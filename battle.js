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
    gameState.comboTarget = null;
    gameState.comboCount = 0;
    gameState.lastSpellElement = 'none';

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
    const weaponRange = weapon.range || (weapon.class === 'Lance' ? 2 : 1);
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

    // Determine weapon range, including class perks
    let weaponRange = weapon.range || 1;
    if (weapon.class === 'Lance') {
         weaponRange = weapon.range || 2;
         if(weapon.name === 'Holy Beast Halberd') weaponRange = 3;
    }
    
    const dx = Math.abs(player.x - target.x);
    const dy = Math.abs(player.y - target.y);

    if(dx + dy > weaponRange){
        addToLog("You are too far away to attack!", 'text-red-400');
        return;
    }

    gameState.isPlayerTurn = false; 

    const performSingleAttack = (attackTarget, isSecondStrike = false) => {
        const calcLog = {
            source: `Player Attack ${isSecondStrike ? '(2)' : ''}`,
            targetName: attackTarget.name,
            steps: []
        };

        const baseWeaponDamage = rollDice(...weapon.damage, `Player Weapon Attack ${isSecondStrike ? '2' : '1'}`);
        calcLog.baseDamage = baseWeaponDamage;
        
        let statBonus = player.physicalDamageBonus;
        
        // --- WEAPON CLASS PERKS ---
        // Curved Sword: Check and apply combo bonus
        let comboBonus = 1.0;
        if (weapon.class === 'Curved Sword') {
            if (gameState.comboTarget === attackTarget) {
                gameState.comboCount++;
            } else {
                gameState.comboTarget = attackTarget;
                gameState.comboCount = 1;
            }
            const maxCombo = weapon.effect?.uncapCombo ? gameState.comboCount : 5;
            comboBonus = 1 + (Math.min(gameState.comboCount - 1, maxCombo) * 0.1);
        }

        let damage = baseWeaponDamage;
        const statMultiplier = 1 + statBonus / 20;
        damage = Math.floor(damage * statMultiplier);
        calcLog.steps.push({ description: `Stat Multiplier (1 + ${statBonus}/20)`, value: `x${statMultiplier.toFixed(2)}`, result: damage });

        const strengthFlatBonus = Math.floor(player.strength / 5);
        damage += strengthFlatBonus;
        calcLog.steps.push({ description: "Strength Flat Bonus (Str/5)", value: `+${strengthFlatBonus}`, result: damage });
        
        if (comboBonus > 1.0) {
            damage = Math.floor(damage * comboBonus);
            calcLog.steps.push({ description: `Curved Sword Combo (${gameState.comboCount}x)`, value: `x${comboBonus.toFixed(2)}`, result: damage });
        }

        let attackEffects = { element: player.weaponElement };
        let messageLog = [];

        // --- SPECIAL WEAPON LOGIC ---
        // Elemental Sword
        if (weapon.name === 'Elemental Sword') {
            const chosenElement = player.weaponElement !== 'none' ? player.weaponElement : gameState.lastSpellElement;
            if (chosenElement !== 'none') {
                attackEffects.element = chosenElement;
            }
            const intBonus = player.intelligence;
            damage += intBonus; // Add int scaling
            calcLog.steps.push({ description: "Elemental Sword Bonus", value: `+${intBonus} (INT)`, result: damage });
        }
        // Troll's Knight Sword
        if (weapon.effect?.intScaling) {
            const intBonus = Math.floor(player.intelligence * weapon.effect.intScaling);
            damage += intBonus;
            calcLog.steps.push({ description: `${weapon.name} Bonus`, value: `+${intBonus} (INT Scale)`, result: damage });
        }

        // --- STATUS EFFECT MODIFIERS ---
        if (player.statusEffects.drenched) {
            const multiplier = player.statusEffects.drenched.multiplier;
            damage = Math.floor(damage * multiplier);
            messageLog.push(`Your attack is weakened!`);
            calcLog.steps.push({ description: "Drenched Debuff", value: `x${multiplier}`, result: damage });
        }

        if(player.statusEffects.buff_strength) {
            const multiplier = player.statusEffects.buff_strength.multiplier;
            damage = Math.floor(damage * multiplier);
            if (!isSecondStrike) messageLog.push(`Your strength is augmented!`);
            calcLog.steps.push({ description: "Strength Buff", value: `x${multiplier}`, result: damage });
        }

        // --- CRITICAL HIT CALCULATION (REWORKED) ---
        const canWeaponCrit = weapon.class === 'Dagger' || weapon.effect?.critChance;
        if (canWeaponCrit) {
            let critChance = player.critChance; // Start with the player's base chance
            if (weapon.class === 'Dagger') critChance += 0.1; // Add Dagger perk
            if (weapon.effect?.critChance) critChance += weapon.effect.critChance; // Add specific weapon effect bonus
        
            if (Math.random() < critChance) {
                let critMultiplier = 1.5; // Default crit multiplier
                if (weapon.class === 'Dagger') critMultiplier = 1.5; // Dagger base crit multiplier
                if (weapon.effect?.critMultiplier) critMultiplier = weapon.effect.critMultiplier; // Specific weapon multiplier overrides
        
                damage = Math.floor(damage * critMultiplier);
                messageLog.push(`CRITICAL HIT!`);
                calcLog.steps.push({ description: "Critical Hit", value: `x${critMultiplier}`, result: damage });
            }
        }
        
        // --- ARMOR PIERCING & OTHER EFFECTS ---
        if (weapon.class === 'Thrusting Sword') attackEffects.armorPierce = 0.2;
        if (weapon.effect?.armorPierce) attackEffects.armorPierce = (attackEffects.armorPierce || 0) + weapon.effect.armorPierce;
        if (weapon.effect?.bonusVsDragon && attackTarget.speciesData.name === 'Dragon') {
            const multiplier = weapon.effect.bonusVsDragon;
            damage = Math.floor(damage * multiplier);
            if (!isSecondStrike) messageLog.push(`Your weapon glows with power against the dragon!`);
            calcLog.steps.push({ description: "Bonus vs. Dragon", value: `x${multiplier}`, result: damage });
        }
        if (weapon.effect?.bonusVsLegendary && attackTarget.rarityData.name === 'Legendary') {
            const multiplier = weapon.effect.bonusVsLegendary;
            damage = Math.floor(damage * multiplier);
             if (!isSecondStrike) messageLog.push(`Your weapon feels destined to slay this foe!`);
            calcLog.steps.push({ description: "Bonus vs. Legendary", value: `x${multiplier}`, result: damage });
        }
        
        // --- FINAL DAMAGE & LOGGING ---
        const finalDamage = attackTarget.takeDamage(damage, attackEffects);
        
        calcLog.finalDamage = finalDamage;
        logDamageCalculation(calcLog);

        let damageType = weapon.damageType || 'physical';
        if (attackEffects.element && attackEffects.element !== 'none') {
            damageType = ELEMENTS[attackEffects.element].name;
        }
        addToLog(`You attack ${attackTarget.name} with ${weapon.name}, dealing <span class="font-bold text-yellow-300">${finalDamage}</span> ${damageType} damage. ${messageLog.join(' ')}`);
        
        // --- POST-ATTACK EFFECTS ---
        let lifestealAmount = 0;
        if (weapon.class === 'Reaper') lifestealAmount += finalDamage * 0.1; // Reaper Perk
        if (weapon.effect?.lifesteal) lifestealAmount += finalDamage * weapon.effect.lifesteal;
        
        if (lifestealAmount > 0) { 
            if (attackTarget.speciesData.class !== 'Undead') {
                const healedAmount = Math.floor(lifestealAmount);
                if (healedAmount > 0) { 
                    player.hp = Math.min(player.maxHp, player.hp + healedAmount); 
                    addToLog(`You drain <span class="font-bold text-green-400">${healedAmount}</span> HP.`); 
                    updateStatsView(); 
                }
            } else {
                addToLog(`You cannot drain life from the undead!`, 'text-gray-400');
            }
        }

        // Hammer paralysis chance
        let paralyzeChance = 0;
        if (weapon.class === 'Hammer') paralyzeChance += 0.1;
        if (weapon.effect?.paralyzeChance) paralyzeChance += weapon.effect.paralyzeChance;
        if (paralyzeChance > 0 && Math.random() < paralyzeChance) {
            attackTarget.statusEffects.paralyzed = { duration: 2 };
            addToLog(`${attackTarget.name} is stunned by the blow!`, 'text-yellow-500');
        }

        // Other on-hit effects
        if (weapon.effect?.toxicChance && Math.random() < weapon.effect.toxicChance) {
            attackTarget.statusEffects.toxic = { duration: 4 }; // Duration is 3 turns after this one
            addToLog(`${attackTarget.name} is afflicted with a deadly toxin!`, 'text-green-700');
        }
        if(weapon.effect?.petrifyChance && Math.random() < weapon.effect.petrifyChance) {
            attackTarget.statusEffects.petrified = { duration: 2 };
            addToLog(`${attackTarget.name} is petrified by the attack!`, 'text-gray-400');
        }
        if (weapon.effect?.cleanseChance && Math.random() < weapon.effect.cleanseChance) {
             const debuffs = Object.keys(player.statusEffects).filter(key => ['poison', 'toxic', 'paralyzed', 'petrified', 'drenched'].includes(key));
             if (debuffs.length > 0) {
                 const effectToCleanse = debuffs[0];
                 delete player.statusEffects[effectToCleanse];
                 addToLog(`Your weapon's holy energy cleanses you of ${effectToCleanse}!`, 'text-yellow-200');
             }
        }
    };
    
    performSingleAttack(target);
    
    setTimeout(() => {
        if (player.equippedShield.effect?.attack_follow_up) {
            performShieldFollowUpAttack(target);
        }

        // Check for second attacks (Hand-to-Hand, Dual Longswords, etc.)
        const needsSecondAttack = (weapon.class === 'Hand-to-Hand' || weapon.effect?.doubleStrike) && target.isAlive();
        const procSecondAttack = weapon.effect?.doubleStrikeChance && Math.random() < weapon.effect.doubleStrikeChance && target.isAlive();

        if (needsSecondAttack || procSecondAttack) {
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

    // Reset Curved Sword combo when casting a spell
    gameState.comboTarget = null;
    gameState.comboCount = 0;
    
    // Store last spell element for Elemental Sword
    gameState.lastSpellElement = spellData.element;

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
    player.mp -= spellCost; 
    updateStatsView();
    
    if (spellData.type !== 'support' && spellData.element !== 'healing') {
        addToLog(`You cast ${spell.name} on ${target.name}!`, 'text-purple-300');
    } else {
        addToLog(`You cast ${spell.name}!`, 'text-purple-300');
    }

    let messageLog = [];

    if (spellData.type === 'st' || spellData.type === 'aoe' || spellData.element === 'healing') {
        const calcLog = {
            source: `Player Spell: ${spell.name}`,
            targetName: target ? target.name : 'Self',
            steps: []
        };

        let diceCount = spell.damage[0];
        const spellAmp = catalyst.effect?.spell_amp || 0;
        diceCount = Math.min(spell.cap, diceCount + spellAmp);

        const baseMagicDamage = rollDice(diceCount, spell.damage[1], `Player Spell: ${spell.name}`);
        calcLog.baseDamage = baseMagicDamage;
        const magicStat = player.intelligence + Math.floor(player.focus / 2);
        
        let magicDamage = baseMagicDamage;
        const statMultiplier = 1 + magicStat / 20;
        magicDamage = Math.floor(magicDamage * statMultiplier);
        calcLog.steps.push({ description: `Magic Stat Multiplier (1 + ${magicStat}/20)`, value: `x${statMultiplier.toFixed(2)}`, result: magicDamage });

        const intFlatBonus = Math.floor(player.intelligence / 5);
        magicDamage += intFlatBonus;
        calcLog.steps.push({ description: "Intelligence Flat Bonus (INT/5)", value: `+${intFlatBonus}`, result: magicDamage });


        let critChance = catalyst.effect?.spell_crit_chance || 0;
        let critMultiplier = catalyst.effect?.spell_crit_multiplier || 1.5;

        if (critChance > 0 && Math.random() < critChance) {
            magicDamage = Math.floor(magicDamage * critMultiplier);
            messageLog.push('SPELL CRITICAL!');
            calcLog.steps.push({ description: "Spell Critical Hit", value: `x${critMultiplier}`, result: magicDamage });
        }
        
        if (catalyst.effect?.overdrive && Math.random() < catalyst.effect.overdrive.chance) {
            const multiplier = catalyst.effect.overdrive.multiplier;
            magicDamage = Math.floor(magicDamage * multiplier);
            messageLog.push('OVERDRIVE!');
            calcLog.steps.push({ description: "Overdrive", value: `x${multiplier}`, result: magicDamage });

            const selfDamage = Math.floor(player.maxHp * catalyst.effect.overdrive.self_damage);
            player.takeDamage(selfDamage, true);
            addToLog(`The power overwhelms you, dealing <span class="font-bold text-red-500">${selfDamage}</span> damage to yourself!`, 'text-red-400');
        }

        if (spellData.element === 'healing') {
            player.hp = Math.min(player.maxHp, player.hp + magicDamage);
            calcLog.finalDamage = magicDamage;
            logDamageCalculation(calcLog);
            addToLog(`You recover <span class="font-bold text-green-400">${magicDamage}</span> HP.`, 'text-green-300');
        } else {
            if (spellData.element === 'fire') {
                const fireMultiplier = 1 + Math.random() * (0.2 + (tierIndex * 0.1));
                magicDamage = Math.floor(magicDamage * fireMultiplier);
                calcLog.steps.push({ description: "Fire Element Bonus", value: `x${fireMultiplier.toFixed(2)}`, result: magicDamage });
            }

            const finalDamage = target.takeDamage(magicDamage, { isMagic: true, element: spellData.element, tier: tierIndex, spell_penetration: catalyst.effect?.spell_penetration });
            
            calcLog.finalDamage = finalDamage;
            logDamageCalculation(calcLog);

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
                const badEffects = ['poison', 'petrified', 'paralyzed', 'swallowed', 'toxic'];
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

    // Spell Follow-Up logic
    if (player.equippedWeapon.effect?.spellFollowUp && target && target.isAlive()) {
        addToLog("Your blade echoes the spell's power with a free strike!", 'text-cyan-300');
        setTimeout(() => performAttack(targetIndex), 200); // This will trigger a full attack sequence
    } else {
        if (spellData.element === 'wind' && Math.random() < (0.1 + (tierIndex * 0.05))) {
            addToLog("The swirling winds grant you another turn!", "text-cyan-300 font-bold");
            setTimeout(beginPlayerTurn, 500);
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

    // Reset Curved Sword combo if the action is not an attack.
    if (type !== 'attack') {
        gameState.comboTarget = null;
        gameState.comboCount = 0;
    }

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
            let weaponRange = player.equippedWeapon.range || 1;
            if (player.equippedWeapon.class === 'Lance') {
                 weaponRange = player.equippedWeapon.range || 2;
                 if(player.equippedWeapon.name === 'Holy Beast Halberd') weaponRange = 3;
            }

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
                // --- On-Kill Effects ---
                if (player.equippedWeapon.effect?.healOnKill) {
                    const healAmount = Math.floor(player.maxHp * player.equippedWeapon.effect.healOnKill);
                    player.hp = Math.min(player.maxHp, player.hp + healAmount);
                    addToLog(`Your weapon drinks the life force of the fallen, healing you for ${healAmount} HP!`, 'text-green-400');
                }

                if (player.statusEffects.swallowed && player.statusEffects.swallower === enemy) {
                    delete player.statusEffects.swallowed;
                    addToLog(`You are freed as the ${enemy.name} collapses!`, 'text-green-500');
                }

                addToLog(`You have defeated ${enemy.name}!`, 'text-green-400 font-bold');
                
                if (enemy.rarityData.name === 'Legendary') {
                    const speciesKey = enemy.speciesData.key;
                    if (!player.legacyQuestProgress[speciesKey]) {
                        player.legacyQuestProgress[speciesKey] = true;
                        addToLog(`*** LEGACY QUEST UPDATE: Legendary ${enemy.speciesData.name} slain! ***`, 'text-purple-300 font-bold');
                    }
                }

                player.gainXp(enemy.xpReward); 
                player.gold += enemy.goldReward;
                addToLog(`You found <span class="font-bold">${enemy.goldReward}</span> G.`, 'text-yellow-400');
                
                // --- Loot Drop Logic ---
                for (const item in enemy.lootTable) { 
                    let dropChance = enemy.lootTable[item];
                    // Blacksmith's Hammer perk
                    const itemDetails = getItemDetails(item);
                    if (player.equippedWeapon.effect?.lootBonus && (itemDetails.class || ['Armor', 'Weapon'].includes(itemDetails.type))) {
                        dropChance *= 2;
                    }

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
    // New Toxic effect
    if (effects.toxic) {
        const toxicDamage = Math.floor(player.maxHp * 0.1);
        player.takeDamage(toxicDamage, true);
        addToLog(`The toxin courses through you, dealing <span class="font-bold text-green-800">${toxicDamage}</span> damage!`);
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
    // Handle enemy toxic damage
    if (effects.toxic) {
        const toxicDamage = Math.floor(enemy.maxHp * 0.1);
        enemy.takeDamage(toxicDamage, { isMagic: true, ignore_defense: 1.0 });
        addToLog(`${enemy.name} suffers <span class="font-bold text-green-800">${toxicDamage}</span> damage from the toxin!`);
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
        setTimeout(() => beginPlayerTurn(), 500);
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
                    // MODIFICATION: Removed the check that prevented attacking after ability use.
                    await enemy.attack(player);
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
        beginPlayerTurn();
    }
}

function beginPlayerTurn() {
    if (checkVictory()) return;
    if (gameState.battleEnded) return;
    if (!player.isAlive()) {
        checkPlayerDeath();
        return;
    }

    gameState.action = null; 

    if (player.statusEffects.petrified) {
        addToLog("You are petrified and cannot move!", 'text-gray-400');
        setTimeout(enemyTurn, 500); // Skip player turn
    } else {
        gameState.isPlayerTurn = true; // It's now the player's turn
        renderBattleGrid(); // Re-render to show active buttons
    }
}
async function checkPlayerDeath() {
    // MODIFICATION: Moved revive check to the TOP of the function.
    if (!player.isAlive() && !gameState.playerIsDying) {
        
        // Void Greatsword Revive
        if(player.equippedWeapon.effect?.revive && !player.specialWeaponStates.void_greatsword_revive_used) {
            player.hp = Math.floor(player.maxHp * 0.5);
            player.specialWeaponStates.void_greatsword_revive_used = true;
            addToLog('The Void Greatsword flashes with dark energy, pulling your soul back from the brink!', 'text-purple-400 font-bold');
            updateStatsView();
            gameState.playerIsDying = false; 
            return;
        }

        gameState.playerIsDying = true; // Set dying state AFTER checking for revive.
        
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


