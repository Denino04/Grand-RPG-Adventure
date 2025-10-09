    // --- BATTLE FUNCTIONS ---
    function startBattle(biomeKey) {
        gameState.isPlayerTurn = true;
        gameState.battleEnded = false;
        gameState.currentBiome = biomeKey;
        $('#inventory-btn').disabled = true;
        $('#character-sheet-btn').disabled = true;
        currentEnemies = [];
        player.clearBattleBuffs(); // Clear buffs from previous battle
        gameState.action = null;

        // --- GRID SELECTION ---
        const gridKeys = Object.keys(BATTLE_GRIDS);
        const randomGridKey = gridKeys[Math.floor(Math.random() * gridKeys.length)];
        const gridData = BATTLE_GRIDS[randomGridKey];
        gameState.gridWidth = gridData.width;
        gameState.gridHeight = gridData.height;
        gameState.gridLayout = gridData.layout;
        gameState.gridObjects = []; // Obstacles and terrain


        // --- ENTITY AND OBJECT PLACEMENT ---
        const occupiedCells = new Set();
        const validCells = [];
        for (let y = 0; y < gameState.gridHeight; y++) {
            for (let x = 0; x < gameState.gridWidth; x++) {
                if (gameState.gridLayout[y * gameState.gridWidth + x] === 1) {
                    validCells.push({x, y});
                }
            }
        }

        // Function to get a random unoccupied valid cell
        const getUnoccupiedCell = (cellList) => {
            let availableCells = cellList.filter(c => !occupiedCells.has(`${c.x},${c.y}`));
            if (availableCells.length === 0) return null; // No space left
            return availableCells[Math.floor(Math.random() * availableCells.length)];
        };

        // Position player in the bottom half
        const playerSpawnArea = validCells.filter(c => c.y >= Math.floor(gameState.gridHeight / 2));
        const playerCell = getUnoccupiedCell(playerSpawnArea);
        if (playerCell) {
            player.x = playerCell.x;
            player.y = playerCell.y;
            occupiedCells.add(`${player.x},${player.y}`);
        } else {
            const fallbackCell = getUnoccupiedCell(validCells);
            if(fallbackCell) {
                player.x = fallbackCell.x;
                player.y = fallbackCell.y;
                occupiedCells.add(`${player.x},${player.y}`);
            } else {
                console.error("No valid cell to spawn player!");
                addToLog("Error: Could not find a valid spot to start the battle. Returning to menu.", "text-red-500");
                setTimeout(showStartScreen, 2000);
                return;
            }
        }


        // Position enemies in the top half
        const enemySpawnArea = validCells.filter(c => c.y < Math.floor(gameState.gridHeight / 2));
        let numEnemies = 1;
        if (player.level >= 50) {
            const rand = Math.random();
            if (rand > 0.9) numEnemies = 5;
            else if (rand > 0.7) numEnemies = 4;
            else if (rand > 0.4) numEnemies = 3;
            else if (rand > 0.1) numEnemies = 2;
        } else if (player.level >= 6) {
            const rand = Math.random();
            if (rand > 0.8) { numEnemies = 3; } 
            else if (rand > 0.5) { numEnemies = 2; }
        }
        for (let i = 0; i < numEnemies; i++) {
            const enemy = generateEnemy(biomeKey);
            const enemyCell = getUnoccupiedCell(enemySpawnArea);
            if (enemyCell) {
                enemy.x = enemyCell.x;
                enemy.y = enemyCell.y;
                occupiedCells.add(`${enemy.x},${enemy.y}`);
                currentEnemies.push(enemy);
            }
        }

        // --- PATH GUARANTEE & OBSTACLE PLACEMENT ---

        // 1. Find a critical path to guarantee connectivity before placing obstacles.
        let criticalPath = [];
        if (currentEnemies.length > 0) {
            // Find a path to the first enemy. This path will be kept clear.
            criticalPath = findPath({ x: player.x, y: player.y }, { x: currentEnemies[0].x, y: currentEnemies[0].y }, false) || [];
        }
        const criticalPathCells = new Set(criticalPath.map(cell => `${cell.x},${cell.y}`));

        // 2. Create a pool of cells available for obstacles (i.e., not on the critical path or occupied).
        const obstacleSafeCells = validCells.filter(cell => !criticalPathCells.has(`${cell.x},${cell.y}`));


        // Position Obstacles
        const numObstacles = 1 + Math.floor(Math.random() * 3);
        for (let i = 0; i < numObstacles; i++) {
            const obstacleCell = getUnoccupiedCell(obstacleSafeCells);
            if (obstacleCell) {
                const obstacleType = BIOMES[biomeKey].obstacle || { char: '🪨', name: 'Rock' };
                gameState.gridObjects.push({ 
                    x: obstacleCell.x, 
                    y: obstacleCell.y, 
                    type: 'obstacle', 
                    hp: 1, 
                    emoji: obstacleType.char,
                    name: obstacleType.name
                });
                occupiedCells.add(`${obstacleCell.x},${obstacleCell.y}`);
            }
        }

        // Generate connected terrain
        const numTerrain = 1 + Math.floor(Math.random() * 3);
        if (numTerrain > 0) {
            const startCell = getUnoccupiedCell(obstacleSafeCells);
            if (startCell) {
                const terrainGroup = [startCell];
                occupiedCells.add(`${startCell.x},${startCell.y}`);

                for (let i = 1; i < numTerrain; i++) {
                    const frontier = [];
                    for (const tile of terrainGroup) {
                        const neighbors = [
                            {x: tile.x + 1, y: tile.y}, {x: tile.x - 1, y: tile.y},
                            {x: tile.x, y: tile.y + 1}, {x: tile.x, y: tile.y - 1}
                        ];
                        for (const neighbor of neighbors) {
                            const isOccupied = occupiedCells.has(`${neighbor.x},${neighbor.y}`);
                            const isValid = validCells.some(c => c.x === neighbor.x && c.y === neighbor.y);
                            if(isValid && !isOccupied && !terrainGroup.some(t => t.x === neighbor.x && t.y === neighbor.y)) {
                                frontier.push(neighbor);
                            }
                        }
                    }
                    
                    if (frontier.length > 0) {
                        const nextCell = frontier[Math.floor(Math.random() * frontier.length)];
                        terrainGroup.push(nextCell);
                        occupiedCells.add(`${nextCell.x},${nextCell.y}`);
                    } else {
                        break; 
                    }
                }
                terrainGroup.forEach(cell => {
                    gameState.gridObjects.push({ x: cell.x, y: cell.y, type: 'terrain' });
                });
            }
        }


        const biome = BIOMES[biomeKey];
        if (biome && biome.theme) {
            applyTheme(biome.theme);
        }
        
        lastViewBeforeInventory = 'battle';
        gameState.currentView = 'battle'; 
        const enemyNames = currentEnemies.map(e => `<span class="font-bold text-red-400">${e.name}</span>`).join(', ');
        addToLog(`You encounter: ${enemyNames} in the ${BIOMES[biomeKey].name}!`); 
        renderBattleGrid(); 
    }

    function renderBattleGrid() {
        const template = document.getElementById('template-battle').content.cloneNode(true);
        const gridContainer = template.getElementById('battle-grid');
        gridContainer.innerHTML = '';
        // Set grid style based on dynamic size
        gridContainer.style.gridTemplateColumns = `repeat(${gameState.gridWidth}, 1fr)`;


        for (let y = 0; y < gameState.gridHeight; y++) {
            for (let x = 0; x < gameState.gridWidth; x++) {
                const cell = document.createElement('div');
                const isCellActive = gameState.gridLayout[y * gameState.gridWidth + x] === 1;

                if (isCellActive) {
                    cell.classList.add('grid-cell');
                    cell.dataset.x = x;
                    cell.dataset.y = y;

                    if (player.x === x && player.y === y) {
                        cell.classList.add('player');
                        cell.textContent = getPlayerEmoji();
                    }

                    const enemy = currentEnemies.find(e => e.x === x && e.y === y);
                    if (enemy) {
                        cell.classList.add('enemy');
                        cell.innerHTML = `
                            <div class="enemy-emoji">${enemy.speciesData.emoji}</div>
                            <div class="enemy-hp-bar-bg">
                                <div class="enemy-hp-bar" style="width: ${ (enemy.hp / enemy.maxHp) * 100}%"></div>
                            </div>
                        `;
                        cell.addEventListener('mouseover', (event) => showEnemyInfo(enemy, event));
                        cell.addEventListener('mouseout', hideEnemyInfo);
                        cell.addEventListener('click', (event) => {
                            if (gameState.action === null) {
                                showEnemyInfo(enemy, event, true); // Force show on click if no action
                            }
                        });
                    }

                    const gridObject = gameState.gridObjects.find(o => o.x === x && o.y === y);
                    if (gridObject) {
                        if (gridObject.type === 'obstacle') {
                            cell.classList.add('obstacle');
                            cell.innerHTML = `<span>${gridObject.emoji || 'O'}</span>`;
                        } else if (gridObject.type === 'terrain') {
                            cell.classList.add('terrain');
                        }
                    }
                    
                    cell.addEventListener('click', () => handleCellClick(x, y));
                } else {
                    cell.classList.add('grid-cell-empty');
                }
            
                gridContainer.appendChild(cell);
            }
        }
        
        renderBattleActions(template);
        render(template);
    }

    function renderBattleActions(template) {
        const actionsContainer = template.getElementById('battle-actions');
        let actionsHtml = '';
        if (player.statusEffects.swallowed) {
            actionsHtml = `<button onclick="struggleSwallow()" class="btn btn-action w-48 rounded-full">Struggle!</button>`;
        } else {
            actionsHtml = `
                <button onclick="battleAction('move')" class="btn btn-primary w-28 rounded-full">Move</button>
                <button onclick="battleAction('attack')" class="btn btn-action w-28 rounded-full">Attack</button>
                <button onclick="battleAction('magic')" class="btn btn-magic w-28 rounded-full">Magic</button>
                <button onclick="battleAction('item')" class="btn btn-item w-28 rounded-full">Item</button>
                <button onclick="battleAction('flee')" class="btn btn-flee w-28 rounded-full">Flee</button>
            `;
        }
        actionsContainer.innerHTML = actionsHtml;
    }

    function handleCellClick(x, y) {
        if (!gameState.isPlayerTurn) return;

        const cells = document.querySelectorAll('.grid-cell');
        
        const clickedEnemy = currentEnemies.find(e => e.x === x && e.y === y);
        const clickedObstacle = gameState.gridObjects.find(o => o.x === x && o.y === y && o.type === 'obstacle');

        if (gameState.action === 'move') {
            cells.forEach(c => c.classList.remove('walkable', 'attackable', 'magic-attackable', 'splash-targetable'));
            movePlayer(x, y);
        } else if (gameState.action === 'attack') {
            if (clickedEnemy) {
                const targetIndex = currentEnemies.indexOf(clickedEnemy);
                performAttack(targetIndex);
            } else if (clickedObstacle) {
                performAttackOnObstacle(clickedObstacle);
            } else {
                gameState.action = null; // Cancel action if clicking empty space
                cells.forEach(c => c.classList.remove('walkable', 'attackable', 'magic-attackable', 'splash-targetable'));
            }
        } else if (gameState.action === 'magic_cast') {
            if (clickedEnemy) {
                const targetIndex = currentEnemies.indexOf(clickedEnemy);
                castSpell(gameState.spellToCast, targetIndex);
            } else {
                // Cancel spell if clicking somewhere invalid
                gameState.action = null;
                gameState.spellToCast = null;
                cells.forEach(c => c.classList.remove('walkable', 'attackable', 'magic-attackable', 'splash-targetable'));
            }
        }
    }

    function isCellBlocked(x, y, forEnemy = false, canFly = false) {
        // Check if the cell is part of the layout
        if (x < 0 || x >= gameState.gridWidth || y < 0 || y >= gameState.gridHeight || gameState.gridLayout[y * gameState.gridWidth + x] !== 1) {
            return true;
        }
        
        if (forEnemy) {
            if (player.x === x && player.y === y) return true;
        } else {
            const isOccupiedByEnemy = currentEnemies.some(e => e.x === x && e.y === y);
            if (isOccupiedByEnemy) return true;
        }

        const gridObject = gameState.gridObjects.find(o => o.x === x && o.y === y);
        if (gridObject) {
            if (canFly && gridObject.type === 'terrain') {
                return false; // Flyers can move over terrain
            }
            return true; // Blocked by obstacle or terrain (if not flying)
        }
        
        return false;
    }


    async function movePlayer(x, y) {
        const path = findPath({x: player.x, y: player.y}, {x, y});

        if (path && path.length > 1 && path.length <= 4) { // Path length is steps + 1
            gameState.isPlayerTurn = false;

            for (let i = 1; i < path.length; i++) {
                await new Promise(resolve => setTimeout(resolve, 150)); // Staggered movement
                player.x = path[i].x;
                player.y = path[i].y;
                renderBattleGrid();
            }

            setTimeout(enemyTurn, 400);
        } else {
            addToLog("You can't move that far or the path is blocked!", 'text-red-400');
            gameState.action = null;
            const cells = document.querySelectorAll('.grid-cell');
            cells.forEach(c => c.classList.remove('walkable'));
        }
    }

    function performAttackOnObstacle(obstacle) {
        const weapon = player.equippedWeapon;
        const weaponRange = weapon.range || 1;
        const dx = Math.abs(player.x - obstacle.x);
        const dy = Math.abs(player.y - obstacle.y);

        if (dx + dy > weaponRange) {
            addToLog("You are too far away to attack the obstacle!", 'text-red-400');
            return;
        }

        gameState.isPlayerTurn = false;
        addToLog("You attack the obstacle!", "text-yellow-300");

        obstacle.hp -= 1;
        if (obstacle.hp <= 0) {
            addToLog("You destroyed the obstacle!", "text-green-400");
            const index = gameState.gridObjects.indexOf(obstacle);
            if (index > -1) {
                gameState.gridObjects.splice(index, 1);
            }
        }

        renderBattleGrid();
        setTimeout(enemyTurn, 400);
    }

    function performSpellFollowUpAttack(target) {
        if (!target || !target.isAlive()) {
            const livingEnemies = currentEnemies.filter(e => e.isAlive());
            if (livingEnemies.length > 0) {
                target = livingEnemies[0];
            } else {
                return; 
            }
        }
        
        const weapon = player.equippedWeapon;
        addToLog(`Your ${weapon.name} resonates with the spell, lashing out with a follow-up strike!`, 'text-yellow-300');
        
        const baseDamage = rollDice(...weapon.damage, 'Spell Follow-up Attack');
        const damage = Math.floor(baseDamage * (1 + player.intelligence / 20));
        const finalDamage = target.takeDamage(damage, { element: player.weaponElement });
        addToLog(`The follow-up attack hits ${target.name} for <span class="font-bold text-yellow-300">${finalDamage}</span> damage.`);
        
        setTimeout(() => checkBattleStatus(true), 200);
    }

    function performShieldFollowUpAttack(target) {
        if (!target || !target.isAlive()) return;
        const shield = player.equippedShield;
        if (!shield.effect?.attack_follow_up) return;

        addToLog(`Your ${shield.name} retaliates!`, 'text-orange-400');
        const effect = shield.effect.attack_follow_up;
        const damage = rollDice(...effect.damage, 'Shield Follow-up');
        const finalDamage = target.takeDamage(damage, { element: player.shieldElement });
        addToLog(`It strikes ${target.name} for <span class="font-bold text-orange-400">${finalDamage}</span> damage.`);

        if (effect.paralyze_chance && Math.random() < effect.paralyze_chance) {
            target.statusEffects.paralyzed = { duration: effect.duration + 1 };
            addToLog(`${target.name} is paralyzed by the blow!`, 'text-yellow-500');
        }
    }


    function performAttack(targetIndex) {
        const weapon = player.equippedWeapon; 

        const target = currentEnemies[targetIndex];
        if (!target || !target.isAlive()) {
            renderBattleGrid();
            return;
        };

        const weaponRange = weapon.range || 1;
        const dx = Math.abs(player.x - target.x);
        const dy = Math.abs(player.y - target.y);

        if(dx + dy > weaponRange){
            addToLog("You are too far away to attack!", 'text-red-400');
            return;
        }

        gameState.isPlayerTurn = false; 

        const performSingleAttack = (attackTarget, isSecondStrike = false) => {
            const baseWeaponDamage = rollDice(...weapon.damage, `Player Weapon Attack ${isSecondStrike ? '2' : '1'}`);
            let statBonus = player.physicalDamageBonus;

            if (weapon.effect?.battlestaff) {
                statBonus += player.intelligence;
            }

            // MODIFIED: Adjusted damage formula based on user feedback
            let damage = Math.floor(baseWeaponDamage * (1 + statBonus / 20)) + Math.floor(player.strength / 5);
            let attackEffects = { element: player.weaponElement };
            let messageLog = [];

            if (player.statusEffects.drenched) {
                damage = Math.floor(damage * player.statusEffects.drenched.multiplier);
                messageLog.push(`Your attack is weakened!`);
            }

            if(player.statusEffects.buff_strength) {
                damage = Math.floor(damage * player.statusEffects.buff_strength.multiplier);
                if (!isSecondStrike) messageLog.push(`Your strength is augmented!`);
            }
            if (player.statusEffects.buff_chaos_strength) {
                damage = Math.floor(damage * player.statusEffects.buff_chaos_strength.strMultiplier);
                if (!isSecondStrike) messageLog.push(`Your chaotic power surges!`);
            }
            if (player.statusEffects.buff_titan) {
                damage = Math.floor(damage * player.statusEffects.buff_titan.strMultiplier);
                if (!isSecondStrike) messageLog.push(`You strike with titanic force!`);
            }

            let critChance = 0;
            if (weapon.effect?.type === 'crit') {
                critChance = weapon.effect.chance;
            }
            if (player.statusEffects.buff_shroud || player.statusEffects.buff_voidwalker) {
                critChance *= 1.5;
            }

            if (player.weaponElement === 'fire') {
                const fireMultiplier = 1 + Math.random() * 0.2;
                damage = Math.floor(damage * fireMultiplier);
            }
            if (Math.random() < critChance) {
                let critMultiplier = weapon.effect?.multiplier || 1.5;
                if (player.statusEffects.buff_voidwalker) {
                    critMultiplier += 0.5;
                }
                damage = Math.floor(damage * critMultiplier);
                messageLog.push(`CRITICAL HIT!`);
            }
            if (weapon.effect?.bonus_vs_dragon && attackTarget.speciesData.name === 'Dragon') {
                damage = Math.floor(damage * weapon.effect.bonus_vs_dragon);
                if (!isSecondStrike) messageLog.push(`Your weapon glows with power against the dragon!`);
            }

            if (weapon.effect?.ignore_defense) {
                attackEffects.ignore_defense = weapon.effect.ignore_defense;
            }
            
            const finalDamage = attackTarget.takeDamage(damage, attackEffects);
            let damageType = '';
            if (player.weaponElement && player.weaponElement !== 'none') {
                damageType = ` ${ELEMENTS[player.weaponElement].name}`;
            }
            addToLog(`You attack ${attackTarget.name} with ${weapon.name}, dealing <span class="font-bold text-yellow-300">${finalDamage}</span>${damageType} damage. ${messageLog.join(' ')}`);
            
            // Godslayer Effect
            if (weapon.effect?.type === 'godslayer' && !isSecondStrike) {
                const bonusDamage = Math.floor(attackTarget.maxHp * weapon.effect.percent_hp_damage);
                const finalBonusDamage = attackTarget.takeDamage(bonusDamage, { ignore_defense: 1.0, isMagic: true });
                addToLog(`The Greatsword carves away a piece of ${attackTarget.name}'s essence, dealing an extra <span class="font-bold text-purple-400">${finalBonusDamage}</span> damage!`, 'text-purple-300');
            }

            const weaponRarityName = weapon.rarity || 'Common';
            const rarityIndex = (Object.values(MONSTER_RARITY).findIndex(r => r.name === weaponRarityName) + 1) || 1;

            if (finalDamage > 0 && !isSecondStrike) {
                if (player.weaponElement === 'water') {
                    addToLog(`The water from your attack drenches ${attackTarget.name}!`, 'text-blue-400');
                    attackTarget.statusEffects.drenched = { duration: 2, multiplier: 0.9 };
                }
                if (player.weaponElement === 'earth' && Math.random() < (rarityIndex * 0.05)) {
                    if (!attackTarget.statusEffects.paralyzed) {
                        attackTarget.statusEffects.paralyzed = { duration: 2 };
                        addToLog(`${attackTarget.name} is paralyzed by the force of the earth!`, 'text-yellow-500');
                    }
                }
                if (player.weaponElement === 'nature') {
                    const lifestealAmount = Math.floor(finalDamage * (rarityIndex * 0.05));
                    if (lifestealAmount > 0) {
                        player.hp = Math.min(player.maxHp, player.hp + lifestealAmount);
                        addToLog(`You drain <span class="font-bold text-green-400">${lifestealAmount}</span> HP.`, 'text-green-300');
                        updateStatsView();
                    }
                }
                if (player.weaponElement === 'light' && Math.random() < (rarityIndex * 0.05)) {
                    const debuffs = Object.keys(player.statusEffects).filter(key => ['poison', 'paralyzed', 'petrified', 'drenched'].includes(key));
                    if (debuffs.length > 0) {
                        const effectToCleanse = debuffs[0];
                        delete player.statusEffects[effectToCleanse];
                        addToLog(`Your weapon's light energy cleanses you of ${effectToCleanse}!`, 'text-yellow-200');
                    }
                }
                if (player.weaponElement === 'lightning' && Math.random() < (rarityIndex * 0.05)) {
                    const otherTargets = currentEnemies.filter(e => e.isAlive() && e !== attackTarget);
                    if (otherTargets.length > 0) {
                        const chainTarget = otherTargets[Math.floor(Math.random() * otherTargets.length)];
                        const chainDamage = Math.floor(finalDamage / 2);
                        const finalChainDamage = chainTarget.takeDamage(chainDamage, attackEffects);
                        addToLog(`Lightning chains from your attack, hitting ${chainTarget.name} for <span class="font-bold text-blue-300">${finalChainDamage}</span> damage!`, 'text-blue-400');
                    }
                }
            }

            if (weapon.effect) {
                if (weapon.effect.type === 'fire_damage') { 
                    const fireDamage = rollDice(...weapon.effect.damage, 'Fire Damage'); 
                    const finalFireDamage = target.takeDamage(fireDamage, {ignore_defense: 1.0, isMagic: true, element: 'fire'});
                    addToLog(`The blade burns for an extra <span class="font-bold text-orange-400">${finalFireDamage}</span> fire damage.`); 
                }
                if (weapon.effect.type === 'lightning_damage') { 
                    const lightningDamage = rollDice(...weapon.effect.damage, 'Lightning Damage'); 
                    const finalLightningDamage = target.takeDamage(lightningDamage, {ignore_defense: 1.0, isMagic: true, element: 'lightning'});
                    addToLog(`Lightning arcs from your weapon for an extra <span class="font-bold text-blue-400">${finalLightningDamage}</span> damage.`); 
                }
                if (weapon.effect.type === 'lifesteal') { 
                    const healedAmount = Math.floor(finalDamage * weapon.effect.amount); 
                        if (healedAmount > 0) { 
                            player.hp = Math.min(player.maxHp, player.hp + healedAmount); 
                            addToLog(`You drain <span class="font-bold text-green-400">${healedAmount}</span> HP.`); 
                            updateStatsView(); 
                        } 
                    }
                    if (weapon.effect.type === 'paralyze' && Math.random() < weapon.effect.chance) {
                        attackTarget.statusEffects.paralyzed = { duration: weapon.effect.duration + 1 };
                        addToLog(`${attackTarget.name} is paralyzed by the blow!`, 'text-yellow-500');
                    }
                    if (weapon.effect.petrify_chance && Math.random() < weapon.effect.petrify_chance) {
                        attackTarget.statusEffects.petrified = { duration: weapon.effect.duration + 1 };
                        addToLog(`${attackTarget.name} is petrified by the attack!`, 'text-gray-400');
                    }
                }

            if (player.statusEffects.buff_ion_self || player.statusEffects.buff_ion_other) {
                let potentialTargets = currentEnemies.filter(e => e.isAlive() && e !== attackTarget);
                let canHitPlayer = !!player.statusEffects.buff_ion_self;
                let hitsPlayer = false;

                if (canHitPlayer && potentialTargets.length > 0) {
                    if (Math.random() < 0.2) {
                        hitsPlayer = true;
                    }
                } else if (canHitPlayer) {
                    hitsPlayer = true;
                }
                
                if (potentialTargets.length > 0 || hitsPlayer) {
                    addToLog("Unstable ions arc from your attack!", "text-blue-300");
                    let chainTarget;
                    if(hitsPlayer) {
                        chainTarget = player;
                    } else {
                        chainTarget = potentialTargets[Math.floor(Math.random() * potentialTargets.length)];
                    }
                    
                    const chainDamage = Math.floor(finalDamage / 2);

                    if (chainTarget instanceof Player) {
                        player.takeDamage(chainDamage, true);
                        addToLog(`The lightning chains back, shocking you for <span class="font-bold text-red-400">${chainDamage}</span> damage!`);
                    } else {
                        const finalChainDamage = chainTarget.takeDamage(chainDamage, attackEffects);
                        addToLog(`It chains to ${chainTarget.name} for <span class="font-bold text-blue-400">${finalChainDamage}</span> damage!`);
                    }
                }
            }
        };
        
        performSingleAttack(target);
        
        setTimeout(() => {
            if (player.equippedShield.effect?.attack_follow_up) {
                performShieldFollowUpAttack(target);
            }

            const weaponRarityName = weapon.rarity || 'Common';
            const rarityIndex = (Object.values(MONSTER_RARITY).findIndex(r => r.name === weaponRarityName) + 1) || 1;

            if (player.weaponElement === 'wind' && target.isAlive() && Math.random() < (rarityIndex * 0.05)) {
                setTimeout(() => {
                    addToLog(`The swirling winds grant you another strike!`, 'text-gray-300');
                    performSingleAttack(target, true);
                    setTimeout(checkBattleStatus, 200);
                }, 250);
            } else if (weapon.effect?.double_strike && target.isAlive()) {
                setTimeout(() => {
                    addToLog("You strike again!", "text-yellow-300");
                    performSingleAttack(target, true);
                    setTimeout(checkBattleStatus, 200);
                }, 250);
            } else {
                setTimeout(checkBattleStatus, 200);
            }
        }, 250);
    }

    function castSpell(spellKey, targetIndex) {
        const spellData = SPELLS[spellKey];
        if (!spellData) return;

        const playerSpell = player.spells[spellKey];
        if (!playerSpell) {
            addToLog(`You do not know this spell.`, 'text-red-400');
            return;
        }

        const tierIndex = playerSpell.tier - 1;
        const spell = spellData.tiers[tierIndex];

        const catalyst = player.equippedCatalyst;
        const armor = player.equippedArmor;
        let spellCost = spell.cost;

        if (catalyst.name === 'None') {
            addToLog(`You need to equip a catalyst to cast spells!`, 'text-blue-400');
            renderBattleGrid();
            return;
        }

        if (catalyst.effect?.mana_discount) {
            spellCost = Math.max(1, spellCost - catalyst.effect.mana_discount);
        }
        if (armor.effect?.mana_discount) {
            spellCost = Math.max(1, spellCost - armor.effect.mana_discount);
        }
        
        if (player.mp < spellCost) {
            addToLog(`Not enough MP to cast ${spell.name}!`, 'text-blue-400');
            return;
        }
        
        const target = currentEnemies[targetIndex];
        if (spellData.type === 'st' || spellData.type === 'aoe') {
            if (!target || !target.isAlive()) {
                renderBattleGrid();
                return;
            }

            const catalystRange = player.equippedCatalyst.range || 0;
            const dx = Math.abs(player.x - target.x);
            const dy = Math.abs(player.y - target.y);

            if (dx + dy > catalystRange) {
                addToLog("Target is out of range for this spell!", 'text-red-400');
                gameState.isPlayerTurn = true;
                renderBattleGrid();
                return;
            }
        }

        gameState.isPlayerTurn = false; 
        gameState.lastActionWasSpell = true;
        player.mp -= spellCost; 
        updateStatsView();
        
        if (spellData.type !== 'support' && spellData.element !== 'healing') {
            addToLog(`You cast ${spell.name} on ${target.name}!`, 'text-purple-300');
        } else {
            addToLog(`You cast ${spell.name}!`, 'text-purple-300');
        }

        let messageLog = [];

        if (spellData.type === 'st' || spellData.type === 'aoe' || spellData.element === 'healing') {
            let diceCount = spell.damage[0];
            const spellAmp = catalyst.effect?.spell_amp || 0;
            diceCount = Math.min(spell.cap, diceCount + spellAmp);

            const baseMagicDamage = rollDice(diceCount, spell.damage[1], `Player Spell: ${spell.name}`);
            const magicStat = player.intelligence + Math.floor(player.focus / 2);
            
            // MODIFIED: Adjusted damage formula based on user feedback
            let magicDamage = Math.floor(baseMagicDamage * (1 + magicStat / 20)) + Math.floor(player.intelligence / 5);


            let critChance = catalyst.effect?.spell_crit_chance || 0;
            let critMultiplier = catalyst.effect?.spell_crit_multiplier || 1.5;

            if (spellData.element === 'none') {
                critChance += 0.05 + (tierIndex * 0.01);
            }

            if (critChance > 0 && Math.random() < critChance) {
                magicDamage = Math.floor(magicDamage * critMultiplier);
                messageLog.push('SPELL CRITICAL!');
            }
            
            if (catalyst.effect?.overdrive && Math.random() < catalyst.effect.overdrive.chance) {
                const bonusDamage = magicDamage * (catalyst.effect.overdrive.multiplier - 1);
                magicDamage += bonusDamage;
                messageLog.push('OVERDRIVE!');
                const selfDamage = Math.floor(player.maxHp * catalyst.effect.overdrive.self_damage);
                player.takeDamage(selfDamage, true);
                addToLog(`The power overwhelms you, dealing <span class="font-bold text-red-500">${selfDamage}</span> damage to yourself!`, 'text-red-400');
            }

            if (spellData.element === 'healing') {
                player.hp = Math.min(player.maxHp, player.hp + magicDamage);
                addToLog(`You recover <span class="font-bold text-green-400">${magicDamage}</span> HP.`, 'text-green-300');
            } else {
                if (spellData.element === 'fire') {
                    const fireMultiplier = 1 + Math.random() * (0.2 + (tierIndex * 0.1));
                    magicDamage = Math.floor(magicDamage * fireMultiplier);
                }

                const finalDamage = target.takeDamage(magicDamage, { isMagic: true, element: spellData.element, tier: tierIndex, spell_penetration: catalyst.effect?.spell_penetration });
                addToLog(`It deals <span class="font-bold text-purple-400">${finalDamage}</span> damage. ${messageLog.join(' ')}`);

                if (finalDamage > 0) {
                    if (spellData.element === 'water') {
                        addToLog(`The water from your spell drenches ${target.name}!`, 'text-blue-400');
                        target.statusEffects.drenched = { duration: 2 + tierIndex, multiplier: 0.9 - (tierIndex * 0.05) };
                    }
                    if (spellData.element === 'earth' && Math.random() < (0.2 + (tierIndex * 0.1))) {
                        if (!target.statusEffects.paralyzed) {
                            target.statusEffects.paralyzed = { duration: 2 + tierIndex };
                            addToLog(`${target.name} is paralyzed by the force of the earth!`, 'text-yellow-500');
                        }
                    }
                    if (spellData.element === 'nature') {
                        const lifestealAmount = Math.floor(finalDamage * (0.1 + (tierIndex * 0.05)));
                        if (lifestealAmount > 0) {
                            player.hp = Math.min(player.maxHp, player.hp + lifestealAmount);
                            addToLog(`You drain <span class="font-bold text-green-400">${lifestealAmount}</span> HP.`, 'text-green-300');
                            updateStatsView();
                        }
                    }
                    if (spellData.element === 'light' && Math.random() < (0.2 + (tierIndex * 0.15))) {
                        const debuffs = Object.keys(player.statusEffects).filter(key => ['poison', 'paralyzed', 'petrified', 'drenched'].includes(key));
                        if (debuffs.length > 0) {
                            const effectToCleanse = debuffs[0];
                            delete player.statusEffects[effectToCleanse];
                            addToLog(`Your spell's light energy cleanses you of ${effectToCleanse}!`, 'text-yellow-200');
                        }
                    }
                }
                if (catalyst.effect?.spell_weaver && Math.random() < catalyst.effect.spell_weaver) {
                    const possibleEffects = ['water', 'earth', 'nature', 'light'];
                    const randomEffect = possibleEffects[Math.floor(Math.random() * possibleEffects.length)];
                    addToLog(`The Spellweaver catalyst weaves a random <span class="font-bold text-cyan-300">${randomEffect}</span> effect into your spell!`);
                    switch (randomEffect) {
                        case 'water':
                            target.statusEffects.drenched = { duration: 2, multiplier: 0.9 };
                            break;
                        case 'earth':
                            if (!target.statusEffects.paralyzed) {
                                target.statusEffects.paralyzed = { duration: 2 };
                            }
                            break;
                        case 'nature':
                            const lifestealAmount = Math.floor(finalDamage * 0.1);
                            if (lifestealAmount > 0) player.hp = Math.min(player.maxHp, player.hp + lifestealAmount);
                            break;
                        case 'light':
                            const debuffs = Object.keys(player.statusEffects).filter(key => ['poison', 'paralyzed', 'petrified', 'drenched'].includes(key));
                            if (debuffs.length > 0) delete player.statusEffects[debuffs[0]];
                            break;
                    }
                }


                if (spellData.type === 'aoe') {
                    let splashTargets = [];
                    let splashDamageMultiplier = 0;

                    if (tierIndex === 0) { // Tier 1: + shape
                        splashTargets = [
                            { x: target.x, y: target.y - 1 }, { x: target.x, y: target.y + 1 },
                            { x: target.x - 1, y: target.y }, { x: target.x + 1, y: target.y }
                        ];
                        splashDamageMultiplier = 0.5;
                    } else if (tierIndex === 1) { // Tier 2: 8 surrounding tiles
                        splashTargets = [
                            { x: target.x - 1, y: target.y - 1 }, { x: target.x, y: target.y - 1 }, { x: target.x + 1, y: target.y - 1 },
                            { x: target.x - 1, y: target.y }, { x: target.x + 1, y: target.y },
                            { x: target.x - 1, y: target.y + 1 }, { x: target.x, y: target.y + 1 }, { x: target.x + 1, y: target.y + 1 }
                        ];
                        splashDamageMultiplier = 0.5;
                    } else if (tierIndex === 2) { // Tier 3: 8 surrounding tiles, full damage
                        splashTargets = [
                            { x: target.x - 1, y: target.y - 1 }, { x: target.x, y: target.y - 1 }, { x: target.x + 1, y: target.y - 1 },
                            { x: target.x - 1, y: target.y }, { x: target.x + 1, y: target.y },
                            { x: target.x - 1, y: target.y + 1 }, { x: target.x, y: target.y + 1 }, { x: target.x + 1, y: target.y + 1 }
                        ];
                        splashDamageMultiplier = 1.0;
                    }

                    const splashDamage = Math.floor(magicDamage * splashDamageMultiplier);
                    if (splashDamage > 0) {
                        splashTargets.forEach(pos => {
                            const splashEnemy = currentEnemies.find(e => e.x === pos.x && e.y === pos.y && e.isAlive());
                            if (splashEnemy) {
                                const finalSplashDamage = splashEnemy.takeDamage(splashDamage, { isMagic: true, element: spellData.element });
                                addToLog(`${splashEnemy.name} is hit by the splash for <span class="font-bold text-purple-300">${finalSplashDamage}</span> damage!`);
                            }
                        });
                        // Check if player is in splash zone
                        const playerIsSplashed = splashTargets.some(pos => pos.x === player.x && pos.y === player.y);
                        if (playerIsSplashed) {
                            addToLog(`You are caught in the splash of your own spell!`, 'text-red-400');
                            player.takeDamage(splashDamage, true, null, {isMagic: true});
                        }
                    }
                }
                if (spellData.element === 'lightning' && finalDamage > 0) {
                    const otherTargets = currentEnemies.filter(e => e.isAlive() && e !== target);
                    if (otherTargets.length > 0) {
                        const chainTarget = otherTargets[Math.floor(Math.random() * otherTargets.length)];
                        const chainDamage = Math.floor(finalDamage * (0.5 + (tierIndex * 0.1)));
                        const finalChainDamage = chainTarget.takeDamage(chainDamage, { isMagic: true, element: 'lightning' });
                        addToLog(`Lightning chains from your spell, hitting ${chainTarget.name} for <span class="font-bold text-blue-300">${finalChainDamage}</span> damage!`, 'text-blue-400');
                    }
                }
            }
        } else if (spellData.type === 'support') {
            const effect = spell.effect;
            if (effect) {
                if (effect.cleanse) {
                    const badEffects = ['poison', 'petrified', 'paralyzed', 'swallowed'];
                    let cleansed = false;
                    for (const effectKey of badEffects) {
                        if (player.statusEffects[effectKey]) {
                            delete player.statusEffects[effectKey];
                            cleansed = true;
                        }
                    }
                    if (cleansed) {
                        addToLog('You are cleansed of negative effects!', 'text-cyan-300');
                    }
                }

                if (effect.type.startsWith('debuff_')) {
                    currentEnemies.forEach(enemy => {
                        if (enemy.isAlive()) {
                            enemy.statusEffects[effect.type] = { ...effect };
                        }
                    });
                } else {
                    player.statusEffects[effect.type] = { ...effect };
                }
            
                addToLog(spell.description, 'text-yellow-300');
            }
        }

        if (player.equippedWeapon.effect?.spell_follow_up) {
            setTimeout(() => performSpellFollowUpAttack(target), 200);
        } else {
            if (spellData.element === 'wind' && Math.random() < (0.1 + (tierIndex * 0.05))) {
                addToLog("The swirling winds grant you another turn!", "text-cyan-300 font-bold");
                setTimeout(endPlayerTurnPhase, 500);
            } else {
                setTimeout(checkBattleStatus, 200);
            }
        }
    }

    function battleAction(type, actionData = null) {
        if (!player.isAlive()) {
            checkPlayerDeath();
            return;
        }
        if (!gameState.isPlayerTurn) return;

        gameState.action = type;
        const cells = document.querySelectorAll('.grid-cell');
        cells.forEach(c => c.classList.remove('walkable', 'attackable', 'magic-attackable', 'splash-targetable'));

        switch (type) {
            case 'move':
                const reachableCells = findReachableCells({x: player.x, y: player.y}, 3);
                cells.forEach(c => {
                    const x = parseInt(c.dataset.x);
                    const y = parseInt(c.dataset.y);
                    if (reachableCells.some(p => p.x === x && p.y === y)) {
                        c.classList.add('walkable');
                    }
                });
                break;
            case 'attack':
                const weaponRange = player.equippedWeapon.range || 1;
                cells.forEach(c => {
                    const x = parseInt(c.dataset.x);
                    const y = parseInt(c.dataset.y);
                    const dx = Math.abs(player.x - x);
                    const dy = Math.abs(player.y - y);
                    if (dx + dy <= weaponRange) {
                        const target = currentEnemies.find(e => e.x === x && e.y === y) || gameState.gridObjects.find(o => o.x === x && o.y === y && o.type === 'obstacle');
                        if (target) {
                            c.classList.add('attackable');
                        }
                    }
                });
                break;
            case 'magic': 
                renderBattle('magic'); 
                break;
            case 'magic_select':
                const spellData = SPELLS[actionData.spellKey];
                if (spellData.element === 'healing' || spellData.type === 'support') {
                    castSpell(actionData.spellKey, 0);
                } else {
                    gameState.action = 'magic_cast';
                    gameState.spellToCast = actionData.spellKey;
                    renderBattleGrid(); // Go back to grid to select target
                    const catalystRange = player.equippedCatalyst.range || 0;
                    document.querySelectorAll('.grid-cell').forEach(c => {
                        const x = parseInt(c.dataset.x);
                        const y = parseInt(c.dataset.y);
                        if (c.classList.contains('grid-cell-empty')) return;

                        const dx = Math.abs(player.x - x);
                        const dy = Math.abs(player.y - y);

                        if (dx + dy <= catalystRange) {
                            const enemy = currentEnemies.find(e => e.x === x && e.y === y);
                            if (enemy) {
                                c.classList.add('magic-attackable');
                                
                                // Highlight splash area for AOE spells
                                if (spellData.type === 'aoe') {
                                    const playerSpell = player.spells[actionData.spellKey];
                                    const tierIndex = playerSpell.tier - 1;
                                    let splashOffsets = [];
                                    if (tierIndex === 0) { // Tier 1: + shape
                                        splashOffsets = [{x: 0, y: -1}, {x: 0, y: 1}, {x: -1, y: 0}, {x: 1, y: 0}];
                                    } else if (tierIndex >= 1) { // Tier 2 & 3: 8 surrounding tiles
                                        splashOffsets = [
                                            {x: -1, y: -1}, {x: 0, y: -1}, {x: 1, y: -1},
                                            {x: -1, y: 0}, {x: 1, y: 0},
                                            {x: -1, y: 1}, {x: 0, y: 1}, {x: 1, y: 1}
                                        ];
                                    }
                                    splashOffsets.forEach(offset => {
                                        const splashX = x + offset.x;
                                        const splashY = y + offset.y;
                                        const splashCell = document.querySelector(`.grid-cell[data-x='${splashX}'][data-y='${splashY}']`);
                                        if (splashCell) {
                                            splashCell.classList.add('splash-targetable');
                                        }
                                    });
                                }
                            }
                        }
                    });
                }
                break;
            case 'item': 
                renderBattle('item'); 
                break;
            case 'item_select':
                if (currentEnemies.filter(e => e.isAlive()).length > 1) {
                    renderBattle('item_target', actionData);
                } else {
                    const itemTargetIndex = currentEnemies.findIndex(e => e.isAlive());
                    if (itemTargetIndex !== -1) {
                        useItem(actionData.itemKey, true, itemTargetIndex);
                    }
                }
                break;
            case 'flee':
            gameState.isPlayerTurn = false;
            if (player.statusEffects.buff_voidwalker || Math.random() > 0.2) {
                if (player.statusEffects.buff_voidwalker) {
                    addToLog('You slip through the shadows, guaranteeing your escape!', 'text-purple-400');
                }
                addToLog(`You successfully escaped!`, 'text-green-400');
                $('#inventory-btn').disabled = false;
                $('#character-sheet-btn').disabled = false;
                setTimeout(renderTownSquare, 1500);
            } else {
                addToLog(`You failed to escape!`, 'text-red-400');
                setTimeout(enemyTurn, 400);
            }
            break;
    }
}

function struggleSwallow() {
    const swallower = player.statusEffects.swallowed.swallower;
    const rarityIndex = Object.keys(MONSTER_RARITY).indexOf(swallower.rarityData.name.toLowerCase());
        const struggleDifficulty = 10 + (rarityIndex * 5);
        
        const successChance = player.intelligence / struggleDifficulty;

        if (Math.random() < successChance) {
            addToLog(`You fight your way out of the beast's gullet!`, 'text-green-500 font-bold');
            delete player.statusEffects.swallowed;
        } else {
            addToLog(`You struggle but cannot break free! The powerful beast is difficult to escape.`, 'text-red-500');
        }
        gameState.isPlayerTurn = false;
        setTimeout(enemyTurn, 400);
    }

    function checkVictory() {
        if (gameState.battleEnded) return true;

        const isAnyEnemyActive = currentEnemies.some(enemy => 
            enemy.isAlive() || 
            (enemy.speciesData.class === 'Undead' && !enemy.revived && enemy.ability !== 'alive_again')
        );

        if (!isAnyEnemyActive) {
            checkBattleStatus();
            return true;
        }
        
        return false;
    }

    function checkBattleStatus(isReaction = false) {
        if (gameState.battleEnded) return;
        let allDefeated = true;
        for (let i = currentEnemies.length - 1; i >= 0; i--) {
            const enemy = currentEnemies[i];
            if (!enemy.isAlive()) {
                if (enemy.speciesData.class === 'Undead' && !enemy.revived && enemy.ability !== 'alive_again') {
                    addToLog(`${enemy.name} reforms from shattered bones!`, 'text-gray-400 font-bold');
                    enemy.hp = Math.floor(enemy.maxHp * 0.5);
                    enemy.revived = true;
                    allDefeated = false;
                } else if (enemy.ability === 'alive_again' && Math.random() < enemy.reviveChance) {
                    addToLog(`${enemy.name} rises again!`, 'text-purple-600 font-bold');
                    enemy.hp = Math.floor(enemy.maxHp * 0.5);
                    enemy.reviveChance /= 2;
                    allDefeated = false;
                } else {
                    if (player.statusEffects.swallowed && player.statusEffects.swallower === enemy) {
                        delete player.statusEffects.swallowed;
                        addToLog(`You are freed as the ${enemy.name} collapses!`, 'text-green-500');
                    }

                    addToLog(`You have defeated ${enemy.name}!`, 'text-green-400 font-bold');
                    
                    if (gameState.lastActionWasSpell && player.equippedCatalyst?.effect?.spell_vamp) {
                        const vampAmount = player.equippedCatalyst.effect.spell_vamp;
                        const hpGain = Math.floor(enemy.maxHp * vampAmount);
                        const mpGain = Math.floor(enemy.maxHp * vampAmount);
                        player.hp = Math.min(player.maxHp, player.hp + hpGain);
                        player.mp = Math.min(player.maxMp, player.mp + mpGain);
                        addToLog(`You absorb the vanquished soul, restoring <span class="font-bold text-green-400">${hpGain}</span> HP and <span class="font-bold text-blue-400">${mpGain}</span> MP!`, 'text-purple-300');
                    }


                    if (enemy.rarityData.name === 'Legendary') {
                        const speciesKey = enemy.speciesData.key;
                        if (!player.legacyQuestProgress[speciesKey]) {
                            player.legacyQuestProgress[speciesKey] = true;
                            addToLog(`Legacy Quest Progress: You have slain a legendary ${enemy.speciesData.name}!`, 'text-purple-300 font-bold');
                        }
                    }

                    player.gainXp(enemy.xpReward); 
                    player.gold += enemy.goldReward;
                    addToLog(`You found <span class="font-bold">${enemy.goldReward}</span> G.`, 'text-yellow-400');
                    for (const item in enemy.lootTable) { 
                        let dropChance = enemy.lootTable[item];
                        if (enemy.rarityData.name === "Legendary") dropChance *= 2;
                        if (Math.random() < dropChance) { 
                            player.addToInventory(item); 
                        } 
                    }
                    
                    if (player.activeQuest && player.activeQuest.category === 'extermination') { 
                        const quest = getQuestDetails(player.activeQuest); 
                        if (quest && quest.target === enemy.speciesData.key) { 
                            player.questProgress++; 
                            addToLog(`Quest progress: ${player.questProgress}/${quest.required}`, 'text-amber-300'); 
                        } 
                    }
                    currentEnemies.splice(i, 1);
                }
            } else {
                allDefeated = false;
            }
        }

        if (allDefeated) {
            gameState.battleEnded = true;
            addToLog(`VICTORY! All enemies have been defeated.`, 'text-yellow-200 font-bold text-lg');
            setTimeout(renderPostBattleMenu, 1500);
        } else if (!gameState.isPlayerTurn && !isReaction) {
            setTimeout(enemyTurn, 400);
        }
        updateStatsView();
    }
    function handlePlayerEndOfTurn() {
        const catalyst = player.equippedCatalyst;
        const armor = player.equippedArmor;
        const shield = player.equippedShield;

        if (catalyst.effect?.hp_regen) {
            const regen = catalyst.effect.hp_regen;
            player.hp = Math.min(player.maxHp, player.hp + regen);
            addToLog(`Your ${catalyst.name} regenerates <span class="font-bold text-green-400">${regen}</span> HP.`, 'text-green-300');
        }
        if (shield.effect?.hp_regen) {
            const regen = shield.effect.hp_regen;
            player.hp = Math.min(player.maxHp, player.hp + regen);
            addToLog(`Your ${shield.name} regenerates <span class="font-bold text-green-400">${regen}</span> HP.`, 'text-green-300');
        }
        if (catalyst.effect?.mana_regen) {
            const regen = catalyst.effect.mana_regen;
            player.mp = Math.min(player.maxMp, player.mp + regen);
            addToLog(`Your ${catalyst.name} restores <span class="font-bold text-blue-400">${regen}</span> MP.`, 'text-blue-300');
        }
        if (armor.effect?.mana_regen) {
            const regen = armor.effect.mana_regen;
            player.mp = Math.min(player.maxMp, player.mp + regen);
            addToLog(`Your ${armor.name} restores <span class="font-bold text-blue-400">${regen}</span> MP.`, 'text-blue-300');
        }

        const effects = player.statusEffects;

        if (effects.buff_ingrain) {
            const healEffect = effects.buff_ingrain;
            const healAmount = rollDice(healEffect.healing[0], healEffect.healing[1], 'Ingrain Heal');
            player.hp = Math.min(player.maxHp, player.hp + healAmount);
            addToLog(`Your roots draw <span class="font-bold text-green-400">${healAmount}</span> HP from the earth.`, 'text-green-300');
        }
        if (effects.buff_mother_nature) {
            const healEffect = effects.buff_mother_nature;
            const hpHeal = rollDice(healEffect.healing[0], healEffect.healing[1], 'Mother Nature HP Heal');
            const mpHeal = rollDice(healEffect.healing[0], healEffect.healing[1], 'Mother Nature MP Heal');
            player.hp = Math.min(player.maxHp, player.hp + hpHeal);
            player.mp = Math.min(player.maxMp, player.mp + mpHeal);
            addToLog(`Nature's blessing restores <span class="font-bold text-green-400">${hpHeal}</span> HP and <span class="font-bold text-blue-400">${mpHeal}</span> MP.`, 'text-teal-300');
        }


        for (const effectKey in effects) {
            if (effects[effectKey].duration) {
                effects[effectKey].duration--;
                if (effects[effectKey].duration <= 0) {
                    delete effects[effectKey];
                    addToLog(`Your ${effectKey.replace('buff_', '').replace('_', ' ')} has worn off.`);
                }
            }
        }
        if (effects.poison) {
            const poisonDamage = rollDice(...effects.poison.damage, 'Poison Damage');
            player.takeDamage(poisonDamage, true);
            addToLog(`You take <span class="font-bold text-green-600">${poisonDamage}</span> poison damage.`);
        }
        if (effects.swallowed) {
            addToLog(`You are being digested inside the ${effects.swallowed.by}!`, 'text-red-500');
            const digestDamage = rollDice(2, 6, 'Digestion Damage');
            player.takeDamage(digestDamage, true, effects.swallowed.swallower);
        }
        updateStatsView();
    }
    function handleEnemyEndOfTurn(enemy) {
        const effects = enemy.statusEffects;
        for(const effectKey in effects) {
            if(effects[effectKey].duration) {
                effects[effectKey].duration--;
                if(effects[effectKey].duration <= 0) {
                    delete effects[effectKey];
                    addToLog(`${enemy.name} is no longer ${effectKey.replace('debuff_', '').replace('_', ' ')}.`);
                }
            }
        }
        updateStatsView();
    }

    async function enemyTurn() {
        if (checkVictory()) return;
        handlePlayerEndOfTurn();
        if (!player.isAlive()) {
            checkPlayerDeath();
            return;
        }

        if (player.statusEffects.buff_haste || player.statusEffects.buff_hermes) {
            addToLog("Your haste allows you to act again immediately!", "text-cyan-300 font-bold");
            setTimeout(() => endPlayerTurnPhase(), 500);
            return; 
        }

        const enemiesActingThisTurn = [...currentEnemies];
        for (const enemy of enemiesActingThisTurn) {
            if (gameState.battleEnded || !player.isAlive()) break;

            await new Promise(resolve => {
                setTimeout(async () => {
                    if (!enemy.isAlive() || !player.isAlive()) {
                        resolve();
                        return;
                    }
                
                    let tookTurn = false;
                    if (enemy.statusEffects.petrified || enemy.statusEffects.paralyzed) {
                        const status = enemy.statusEffects.petrified ? 'petrified' : 'paralyzed';
                        addToLog(`${enemy.name} is ${status} and cannot move!`);
                        tookTurn = true; 
                    } else {
                        let usedAbility = false;
                        if (enemy.ability) {
                            switch(enemy.ability) {
                                case 'enrage':
                                    if (!enemy.statusEffects.enrage && Math.random() < 0.5) {
                                        enemy.statusEffects.enrage = { duration: 3 };
                                        addToLog(`${enemy.name} flies into a rage!`, 'text-red-500 font-bold');
                                        usedAbility = true;
                                    }
                                    break;
                                case 'poison_web':
                                    if (!player.statusEffects.poison && Math.random() < 0.4) {
                                        const rarityDice = Object.keys(MONSTER_RARITY).indexOf(enemy.rarityData.name.toLowerCase()) + 1;
                                        applyStatusEffect(player, 'poison', { duration: 3, damage: [rarityDice * 2, 4] }, enemy.name);
                                        usedAbility = true;
                                    }
                                    break;
                                case 'petrification':
                                    if (!player.statusEffects.petrified && Math.random() < 0.25) {
                                        applyStatusEffect(player, 'petrified', { duration: 2 }, enemy.name);
                                        usedAbility = true;
                                    }
                                    break;
                                case 'necromancy':
                                    const hpPercent = enemy.hp / enemy.maxHp;
                                    if ((hpPercent <= 0.5 && !enemy.summonedAt50) || (hpPercent <= 0.1 && !enemy.summonedAt10)) {
                                        if(hpPercent <= 0.5) enemy.summonedAt50 = true;
                                        if(hpPercent <= 0.1) enemy.summonedAt10 = true;
                                        addToLog(`${enemy.name} chants an ancient rite, and skeletons burst from the ground!`, 'text-purple-500');
                                        for (let j = 0; j < 2; j++) {
                                            const skeleton = new Enemy(MONSTER_SPECIES['skeleton'], enemy.rarityData, player.level);
                                            currentEnemies.push(skeleton);
                                        }
                                        renderBattleGrid(); 
                                        usedAbility = true;
                                    }
                                    break;
                                case 'ultra_focus':
                                    if (!enemy.statusEffects.ultra_focus && Math.random() < 0.4) {
                                        enemy.statusEffects.ultra_focus = { duration: 3 };
                                        addToLog(`${enemy.name}'s eye glows with intense focus! Its attacks will ignore defense.`, 'text-yellow-500 font-bold');
                                        usedAbility = true;
                                    }
                                    break;
                                case 'healing':
                                    if (enemy.hp < enemy.maxHp && Math.random() < 0.5) {
                                        const rarityDice = Object.keys(MONSTER_RARITY).indexOf(enemy.rarityData.name.toLowerCase()) + 1;
                                        const healAmount = rollDice(rarityDice * 3, 8, `${enemy.name} Healing`);
                                        addToLog(`${enemy.name} radiates a soothing light!`, 'text-green-400');
                                        currentEnemies.forEach(ally => {
                                            if (ally.isAlive()) {
                                                ally.hp = Math.min(ally.maxHp, ally.hp + healAmount);
                                                addToLog(`${ally.name} is healed for <span class="font-bold text-green-400">${healAmount}</span> HP.`, 'text-green-300');
                                            }
                                        });
                                        renderBattleGrid();
                                        usedAbility = true;
                                    }
                                    break;
                                case 'true_poison':
                                    if (!player.statusEffects.poison && Math.random() < 0.6) {
                                        const rarityDice = Object.keys(MONSTER_RARITY).indexOf(enemy.rarityData.name.toLowerCase()) + 1;
                                        applyStatusEffect(player, 'poison', { duration: 3, damage: [rarityDice * 3, 8] }, enemy.name);
                                        usedAbility = true;
                                    }
                                    break;
                                case 'living_shield':
                                    if (!enemy.statusEffects.living_shield && Math.random() < 0.5) {
                                        enemy.statusEffects.living_shield = { duration: 3 };
                                        addToLog(`${enemy.name}'s armor plating grows thicker, doubling its defense!`, 'text-gray-400 font-bold');
                                        usedAbility = true;
                                    }
                                    break;
                                case 'swallow':
                                    if (!player.statusEffects.swallowed && Math.random() < 0.25) {
                                        applyStatusEffect(player, 'swallowed', { by: enemy.name, swallower: enemy, duration: Infinity }, enemy.name);
                                        usedAbility = true;
                                        renderBattleGrid();
                                    }
                                    break;
                                case 'scorch_earth':
                                    if (Math.random() < 0.4) {
                                        addToLog(`${enemy.name} unleashes a torrent of flame!`, 'text-orange-600 font-bold');
                                        const rarityDice = Object.keys(MONSTER_RARITY).indexOf(enemy.rarityData.name.toLowerCase()) + 1;
                                        const fireDamage = rollDice(rarityDice * 4, 8, `${enemy.name} Scorch Earth`) + enemy.strength;
                                        player.takeDamage(fireDamage, true, enemy);
                                        usedAbility = true;
                                    }
                                    break;
                            }
                        }
                        if (!usedAbility) {
                            // MODIFIED: Replaced external enemy.attack call with inline logic mirroring the player's damage calculation.
                            const dx = Math.abs(enemy.x - player.x);
                            const dy = Math.abs(enemy.y - player.y);
                            const attackRange = enemy.range || 1; 

                            if (dx + dy <= attackRange) {
                                // In range, perform attack
                                addToLog(`${enemy.name} attacks you!`);

                                const baseDamage = rollDice(...enemy.damage, `${enemy.name} Attack`);
                                // MODIFIED: Adjusted damage formula to match player's
                                let damage = Math.floor(baseDamage * (1 + enemy.strength / 20)) + Math.floor(enemy.strength / 5);

                                let attackEffects = {};
                                let messageLog = [];

                                if (enemy.statusEffects.enrage) {
                                    damage = Math.floor(damage * 1.5); 
                                    messageLog.push("It's enraged!");
                                }

                                if (enemy.ability === 'ultra_focus' || enemy.statusEffects.ultra_focus) {
                                    attackEffects.ignore_defense = 1.0;
                                    messageLog.push("Its attack bypasses your defenses!");
                                }
                                
                                const finalDamage = player.takeDamage(damage, false, enemy, attackEffects);
                                // This log is now handled inside player.takeDamage for consistency
                                // addToLog(`You take <span class="font-bold text-red-400">${finalDamage}</span> damage. ${messageLog.join(' ')}`);
                            } else {
                                // Out of range, move closer
                                const path = findPath({x: enemy.x, y: enemy.y}, {x: player.x, y: player.y}, true, enemy.speciesData.canFly);
                                if (path && path.length > 1) {
                                    const nextStep = path[1];
                                    if (!isCellBlocked(nextStep.x, nextStep.y, true)) {
                                        enemy.x = nextStep.x;
                                        enemy.y = nextStep.y;
                                        addToLog(`${enemy.name} moves closer.`);
                                        renderBattleGrid();
                                    } else {
                                        addToLog(`${enemy.name} holds its position.`);
                                    }
                                } else {
                                    addToLog(`${enemy.name} is unable to reach you.`);
                                }
                            }
                        }
                        tookTurn = true;
                    }
                    
                    if (tookTurn) {
                        handleEnemyEndOfTurn(enemy);
                        if (!gameState.battleEnded) {
                            renderBattleGrid(); // Re-render after each enemy action for clarity
                        }
                        checkPlayerDeath();
                    }
                    resolve();
                }, 250);
            });
        }

        if (!gameState.battleEnded) {
            endPlayerTurnPhase();
        }
    }

    function endPlayerTurnPhase() {
        if (checkVictory()) return;
        if (gameState.battleEnded) return;
        if (!player.isAlive()) {
            checkPlayerDeath();
            return;
        }

        gameState.action = null; // Reset action at the end of the turn phase

        if (player.statusEffects.petrified) {
            addToLog("You are petrified and cannot move!", 'text-gray-400');
            setTimeout(enemyTurn, 500);
        } else if (player.statusEffects.paralyzed) {
            addToLog("You are paralyzed and cannot move!", 'text-orange-400');
            setTimeout(enemyTurn, 500);
        } else {
            renderBattleGrid();
            $('#battle-actions')?.classList.remove('hidden'); 
            gameState.isPlayerTurn = true;
        }
    }
    async function checkPlayerDeath() {
        if (!player.isAlive() && !gameState.playerIsDying) {
            
            if (player.equippedLure === 'undying_heart' && !player.usedReviveToday) {
                player.hp = Math.floor(player.maxHp * 0.5);
                player.usedReviveToday = true;
                
                if (player.inventory.items['undying_heart']) {
                    player.inventory.items['undying_heart']--;
                    if (player.inventory.items['undying_heart'] <= 0) {
                        delete player.inventory.items['undying_heart'];
                        player.equippedLure = 'no_lure';
                    }
                } else {
                    player.equippedLure = 'no_lure';
                }
                
                addToLog('The Undying Heart shatters, pulling your soul back from the brink!', 'text-purple-400 font-bold');
                updateStatsView();
                return;
            }

            gameState.playerIsDying = true;

            const weapon = player.equippedWeapon;
            if(weapon.effect?.revive && !player.specialWeaponStates.void_greatsword_revive_used) {
                player.hp = Math.floor(player.maxHp * 0.5);
                player.specialWeaponStates.void_greatsword_revive_used = true;
                addToLog('The Void Greatsword flashes with dark energy, pulling your soul back from the brink!', 'text-purple-400 font-bold');
                updateStatsView();
                gameState.playerIsDying = false; 
                return;
            }
            
            const template = document.getElementById('template-death');
            render(template.content.cloneNode(true));
            const killer = currentEnemies.length > 0 ? currentEnemies[0].name : 'the wilderness';
            addToLog(`You were defeated by ${killer}...`, 'text-red-600 font-bold'); 
            
            await addToGraveyard(player, killer);
            
            await deleteSave(player.firestoreId);
            addToLog('Your save file has been deleted from the cloud.', 'text-gray-500');
            
            setTimeout(() => { 
                signOutUser();
            }, 3000);
        }
    }

    async function addToGraveyard(deadPlayer, killer) {
        if (!db) return;
        try {
            const graveyardCollection = db.collection(`artifacts/${appId}/public/data/graveyard`);
            await graveyardCollection.add({
                name: deadPlayer.name,
                level: deadPlayer.level,
                cause: `Slain by ${killer}`,
                date: new Date().toLocaleString()
            });
        } catch (error) {
            console.error("Could not add to graveyard:", error);
        }
    }





