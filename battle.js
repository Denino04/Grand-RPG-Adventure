let preTrainingState = null;
let isProcessingAction = false; // Flag to prevent action spamming

// --- BATTLE FUNCTIONS ---
function startBattle(biomeKey, trainingConfig = null) {
    if (trainingConfig) {
        preTrainingState = { hp: player.hp, mp: player.mp };
    } else {
        preTrainingState = null;
    }

    isProcessingAction = false; // Reset action lock at the start of every battle
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
    gameState.gridObjects = []; // Obstacles and terrain

    // Reset drone state at start of battle
    gameState.activeDrone = null;
    // Reset mark state at start of battle
    gameState.markedTarget = null;


    // Reset signature ability states for the new battle
    player.signatureAbilityUsed = false;
    player.signatureAbilityToggleActive = false; // Reset toggle state at start of battle


    const isTutorialBattle = tutorialState.isActive && tutorialState.sequence[tutorialState.currentIndex]?.id === 'wilderness_select';

    if (isTutorialBattle) {
        // --- TUTORIAL BATTLE SETUP ---
        const gridData = BATTLE_GRIDS['square_5x5'];
        gameState.gridWidth = gridData.width;
        gameState.gridHeight = gridData.height;
        gameState.gridLayout = gridData.layout;

        const enemy = new Enemy(MONSTER_SPECIES['goblin'], MONSTER_RARITY['common'], player.level);
        enemy.isMarked = false; // Ensure mark flag is initialized
        enemy.hasDealtDamageThisEncounter = false; // Reset damage dealt flag

        // Place player and enemy at random valid spots
        const occupiedCells = new Set();
        const validCells = [];
        for (let y = 0; y < gameState.gridHeight; y++) {
            for (let x = 0; x < gameState.gridWidth; x++) {
                if (gameState.gridLayout[y * gameState.gridWidth + x] === 1) {
                    validCells.push({x, y});
                }
            }
        }

        let playerCellIndex = Math.floor(Math.random() * validCells.length);
        let playerCell = validCells.splice(playerCellIndex, 1)[0];
        player.x = playerCell.x;
        player.y = playerCell.y;

        let enemyCellIndex = Math.floor(Math.random() * validCells.length);
        let enemyCell = validCells.splice(enemyCellIndex, 1)[0];
        enemy.x = enemyCell.x;
        enemy.y = enemyCell.y;

        currentEnemies.push(enemy);

    } else if (trainingConfig) {
        // --- TRAINING BATTLE SETUP ---
        const gridSize = trainingConfig.gridSize;
        const gridData = BATTLE_GRIDS[`square_${gridSize}x${gridSize}`] || BATTLE_GRIDS['square_5x5'];
        gameState.gridWidth = gridData.width;
        gameState.gridHeight = gridData.height;
        gameState.gridLayout = gridData.layout;

        player.x = Math.floor(gridSize / 2);
        player.y = gridSize - 1;

        const occupiedCells = new Set([`${player.x},${player.y}`]);

        trainingConfig.enemies.forEach((enemyConfig, index) => {
            const species = MONSTER_SPECIES[enemyConfig.key];
            const rarity = MONSTER_RARITY[enemyConfig.rarity];
            if (species && rarity) {
                const enemy = new Enemy(species, rarity, player.level);
                enemy.isMarked = false; // Ensure mark flag is initialized
                enemy.hasDealtDamageThisEncounter = false; // Reset damage dealt flag
                // Simple placement logic for training
                enemy.x = Math.floor(gridSize / 2) + index - Math.floor(trainingConfig.enemies.length / 2);
                enemy.y = 0;
                if (!occupiedCells.has(`${enemy.x},${enemy.y}`)) {
                    currentEnemies.push(enemy);
                    occupiedCells.add(`${enemy.x},${enemy.y}`);
                }
            }
        });

    } else {
        // --- STANDARD BATTLE SETUP ---
        const gridKeys = Object.keys(BATTLE_GRIDS);
        const randomGridKey = gridKeys[Math.floor(Math.random() * gridKeys.length)];
        const gridData = BATTLE_GRIDS[randomGridKey];
        gameState.gridWidth = gridData.width;
        gameState.gridHeight = gridData.height;
        gameState.gridLayout = gridData.layout;

        const occupiedCells = new Set();
        const validCells = [];
        for (let y = 0; y < gameState.gridHeight; y++) {
            for (let x = 0; x < gameState.gridWidth; x++) {
                if (gameState.gridLayout[y * gameState.gridWidth + x] === 1) {
                    validCells.push({x, y});
                }
            }
        }

        const getUnoccupiedCell = (cellList) => {
            let availableCells = cellList.filter(c => !occupiedCells.has(`${c.x},${c.y}`));
            if (availableCells.length === 0) return null;
            return availableCells[Math.floor(Math.random() * availableCells.length)];
        };

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

        if (player.statusEffects.monster_lure) numEnemies = Math.min(5, numEnemies + 2); // Add more monsters if lured

        for (let i = 0; i < numEnemies; i++) {
            const enemy = generateEnemy(biomeKey);
            enemy.isMarked = false; // Ensure mark flag is initialized
            enemy.hasDealtDamageThisEncounter = false; // Reset damage dealt flag
            const enemyCell = getUnoccupiedCell(enemySpawnArea);
            if (enemyCell) {
                enemy.x = enemyCell.x;
                enemy.y = enemyCell.y;
                occupiedCells.add(`${enemy.x},${enemy.y}`);
                currentEnemies.push(enemy);
            }
        }

        let criticalPath = [];
        if (currentEnemies.length > 0) {
            // Pathfind with Pinionfolk flight if applicable
            criticalPath = findPath({ x: player.x, y: player.y }, { x: currentEnemies[0].x, y: currentEnemies[0].y }, player.race === 'Pinionfolk') || [];
        }
        const criticalPathCells = new Set(criticalPath.map(cell => `${cell.x},${cell.y}`));
        const obstacleSafeCells = validCells.filter(cell => !criticalPathCells.has(`${cell.x},${cell.y}`));

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
    }

    if (!trainingConfig) {
        const biome = BIOMES[biomeKey];
        if (biome && biome.theme) {
            applyTheme(biome.theme);
        }
    } else {
        applyTheme('town'); // Use a neutral theme for training
    }

    lastViewBeforeInventory = 'battle';
    gameState.currentView = 'battle';
    const enemyNames = currentEnemies.map(e => `<span class="font-bold text-red-400">${e.name}</span>`).join(', ');

    if (trainingConfig) {
        addToLog(`You begin a training session against: ${enemyNames}!`, 'text-yellow-300');
    } else {
        addToLog(`You encounter: ${enemyNames} in the ${BIOMES[biomeKey].name}!`);
    }
    renderBattleGrid();

    if (isTutorialBattle) {
        advanceTutorial();
    }
}

function renderBattleGrid(highlightTargets = false, highlightType = 'magic') { // Added highlightTargets parameter and type
    const template = document.getElementById('template-battle').content.cloneNode(true);
    const gridContainer = template.getElementById('battle-grid');
    gridContainer.innerHTML = '';
    // Set grid style based on dynamic size
    gridContainer.style.gridTemplateColumns = `repeat(${gameState.gridWidth}, 1fr)`;

    // Spell details needed for highlighting
    const spellData = gameState.spellToCast ? SPELLS[gameState.spellToCast] : null;
    const playerSpell = gameState.spellToCast ? player.spells[gameState.spellToCast] : null;
    const spellTier = playerSpell ? playerSpell.tier : 0;
    const spell = spellData && spellTier > 0 ? spellData.tiers[spellTier - 1] : null;
    let spellRange = 0;
    if (spell) {
        spellRange = player.equippedCatalyst.range || 3;
        if (player.race === 'Pinionfolk' && player.level >= 20) spellRange += 2;
        if (player.equippedCatalyst.effect?.spell_sniper) spellRange *= (1 + player.equippedCatalyst.effect.spell_sniper);
    }

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

                // Render Drone if active
                if (gameState.activeDrone && gameState.activeDrone.isAlive() && gameState.activeDrone.x === x && gameState.activeDrone.y === y) { // Added isAlive check
                    cell.classList.add('player'); // Style like player for now
                    cell.textContent = '🤖'; // Drone emoji
                    // Add tooltip or click info for drone stats later if needed
                }


                const enemy = currentEnemies.find(e => e.x === x && e.y === y);
                if (enemy) {
                    cell.classList.add('enemy');
                    // Add mark indicator if marked
                    const markIndicator = enemy.isMarked ? '<span class="absolute top-0 right-1 text-red-500 font-bold text-lg">🎯</span>' : '';
                    cell.innerHTML = `
                        ${markIndicator}
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

                 // --- Highlighting Logic ---
                 if (highlightTargets) {
                     // Magic Targeting
                     if (gameState.action === 'magic_cast' && highlightType === 'magic' && spellData && spellRange > 0) {
                         const dx = Math.abs(player.x - x);
                         const dy = Math.abs(player.y - y);
                         if (dx + dy <= spellRange) {
                             if (enemy && enemy.isAlive()) { // Only highlight living enemies
                                 cell.classList.add('magic-attackable');
                                 // Highlight splash targets if AOE
                                 if (spellData.type === 'aoe') {
                                     // Need to iterate through all potential cells AFTER they are added to DOM
                                     // This logic will run for *each* potential target, highlighting its splash zone
                                     const splashCells = gridContainer.querySelectorAll(`.grid-cell`); // Get cells within the container being built
                                     splashCells.forEach(splashCell => {
                                         if (splashCell.dataset.x === undefined) return;
                                         const sx = parseInt(splashCell.dataset.x);
                                         const sy = parseInt(splashCell.dataset.y);
                                         if (Math.abs(x - sx) <= 1 && Math.abs(y - sy) <= 1) {
                                              if (sx !== x || sy !== y) {
                                                  splashCell.classList.add('splash-targetable');
                                              }
                                         }
                                     });
                                     cell.classList.add('magic-attackable'); // Re-apply main target highlight
                                 }
                             }
                         }
                     }
                     // Mark Targeting (Ranger)
                     else if (gameState.action === 'mark_target' && highlightType === 'mark') {
                          if (enemy && enemy.isAlive()) { // Can mark any living enemy
                              cell.classList.add('attackable'); // Use attackable highlight for marking
                          }
                     }
                 }
                // --- End Highlighting Logic ---

                cell.addEventListener('click', () => handleCellClick(x, y));
            } else {
                 cell.classList.add('grid-cell-empty');
            }

            gridContainer.appendChild(cell);
        }
    }

    // After grid cells are added, re-apply splash highlights correctly
    // This is needed because the earlier loop adds classes before all cells exist
    if (highlightTargets && gameState.action === 'magic_cast' && highlightType === 'magic' && spellData?.type === 'aoe') {
         const targetableCells = gridContainer.querySelectorAll('.magic-attackable');
         targetableCells.forEach(targetCell => {
             const tx = parseInt(targetCell.dataset.x);
             const ty = parseInt(targetCell.dataset.y);
             const allCells = gridContainer.querySelectorAll('.grid-cell');
             allCells.forEach(splashCell => {
                 if (splashCell.dataset.x === undefined) return;
                 const sx = parseInt(splashCell.dataset.x);
                 const sy = parseInt(splashCell.dataset.y);
                 if (Math.abs(tx - sx) <= 1 && Math.abs(ty - sy) <= 1) {
                     if (sx !== tx || sy !== ty) { // Don't highlight the main target itself as splash
                         splashCell.classList.add('splash-targetable');
                     }
                 }
             });
         });
    }


    renderBattleActions(template);
    render(template);
}

function renderBattleActions(template) {
    const actionsContainer = template.getElementById('battle-actions');
    let actionsHtml = '';
    if (player.statusEffects.swallowed) {
        // Special case: Single button spanning all 3 columns
        actionsHtml = `<button onclick="struggleSwallow()" class="btn btn-action w-full rounded-full col-span-3 px-4 text-sm overflow-hidden text-ellipsis whitespace-nowrap">Struggle!</button>`; // Added text classes
    } else {
        // Row 1
        actionsHtml = `
            <button onclick="battleAction('move')" class="btn btn-primary rounded-full px-3 w-full text-sm overflow-hidden text-ellipsis whitespace-nowrap">Move</button>
            <button onclick="battleAction('attack')" class="btn btn-action rounded-full px-3 w-full text-sm overflow-hidden text-ellipsis whitespace-nowrap">Attack</button>
            <button onclick="battleAction('magic')" class="btn btn-magic rounded-full px-3 w-full text-sm overflow-hidden text-ellipsis whitespace-nowrap">Magic</button>
        `;

        // Row 2, Column 1 (Conditional)
        console.log("DEBUG renderBattleActions: Checking player.signatureAbilityData just before rendering button:", player ? (player.signatureAbilityData ? JSON.stringify(player.signatureAbilityData) : 'Signature Ability Data is null/undefined') : 'Player object is null/undefined');
        if (player && player.signatureAbilityData && player.signatureAbilityData.type !== 'passive_action') {
            console.log("Signature ability data found, adding button.");
            const ability = player.signatureAbilityData;
            let buttonText = "Ability"; // Base text
            let isDisabled = false;
            let buttonClass = 'btn-magic';
            // Logic to append cost/status remains the same
            if (ability.type === 'signature') {
                if (player.signatureAbilityUsed) {
                    buttonText += ' (Used)';
                    isDisabled = true;
                    buttonClass = 'btn-primary opacity-50';
                } else if (player.mp < ability.cost) {
                    buttonText += ` (${ability.cost} MP)`;
                    isDisabled = true;
                    buttonClass = 'btn-primary opacity-50';
                } else {
                    buttonText += ` (${ability.cost} MP)`;
                }
            } else if (ability.type === 'toggle') {
                if (player._classKey === 'magus' && ability.modes) {
                     const currentModeIndex = player.activeModeIndex;
                     const currentModeName = currentModeIndex > -1 ? ability.modes[currentModeIndex] : "Inactive";
                     buttonText += ` (${currentModeName})`; // Keep specific mode name for Magus
                     buttonClass = currentModeIndex > -1 ? 'btn-item' : 'btn-primary';
                } else {
                    buttonText += player.signatureAbilityToggleActive ? ' (Active)' : ' (Inactive)';
                    if (ability.cost > 0 && player.mp < ability.cost && !player.signatureAbilityToggleActive) {
                         buttonText += ` (${ability.cost} MP)`;
                         isDisabled = true;
                         buttonClass = 'btn-primary opacity-50';
                     }
                     if (player.signatureAbilityToggleActive) {
                         buttonClass = 'btn-item';
                     }
                }
            } else {
                console.warn("Unknown signature ability type:", ability.type);
                isDisabled = true;
                buttonClass = 'btn-primary opacity-50';
            }
            actionsHtml += `
                <button onclick="battleAction('signature_ability')"
                        class="btn ${buttonClass} rounded-full px-3 w-full text-sm overflow-hidden text-ellipsis whitespace-nowrap"
                        ${isDisabled ? 'disabled' : ''}>
                    ${buttonText}
                </button>
            `;
        } else {
            console.log("No signature ability data found or it's passive, button not added.");
            // ADDED: Placeholder div to maintain grid structure
             actionsHtml += `<div></div>`; // Fills Row 2, Column 1 if no ability btn
        }

        // Row 2, Columns 2 & 3
        actionsHtml += `
            <button onclick="battleAction('item')" class="btn btn-item rounded-full px-3 w-full text-sm overflow-hidden text-ellipsis whitespace-nowrap">Item</button>
            <button onclick="battleAction('flee')" class="btn btn-flee rounded-full px-3 w-full text-sm overflow-hidden text-ellipsis whitespace-nowrap">Flee</button>
        `;
    }
    actionsContainer.innerHTML = actionsHtml;
}



function handleCellClick(x, y) {
    if (!gameState.isPlayerTurn || isProcessingAction) return;

    const cells = document.querySelectorAll('.grid-cell');

    const clickedEnemy = currentEnemies.find(e => e.x === x && e.y === y);
    const clickedObstacle = gameState.gridObjects.find(o => o.x === x && o.y === y && o.type === 'obstacle');
    const isFlying = (player.race === 'Pinionfolk');

    if (gameState.action === 'move') {
        isProcessingAction = true; // Lock actions
        cells.forEach(c => c.classList.remove('walkable', 'attackable', 'magic-attackable', 'splash-targetable'));
        movePlayer(x, y);
    } else if (gameState.action === 'attack') {
        isProcessingAction = true; // Lock actions
        if (clickedEnemy) {
            const targetIndex = currentEnemies.indexOf(clickedEnemy);
            performAttack(targetIndex);
        } else if (clickedObstacle) {
            performAttackOnObstacle(clickedObstacle);
        } else {
             // If we are flying, we can't click an empty ground/terrain cell to cancel
             if (isFlying && gameState.gridObjects.some(o => o.x === x && o.y === y && o.type === 'terrain')) {
                 isProcessingAction = false;
                 return; // Do nothing, keep action active
             }
             gameState.action = null; // Cancel action if clicking empty space
             cells.forEach(c => c.classList.remove('walkable', 'attackable', 'magic-attackable', 'splash-targetable'));
             isProcessingAction = false; // Unlock actions
             renderBattleGrid(); // Re-render actions to show default buttons
        }
    } else if (gameState.action === 'magic_cast') {
        isProcessingAction = true; // Lock actions
        if (clickedEnemy && clickedEnemy.isAlive()) { // Ensure target is alive
            const targetIndex = currentEnemies.indexOf(clickedEnemy);
            castSpell(gameState.spellToCast, targetIndex);
        } else {
             // If we are flying, we can't click an empty ground/terrain cell to cancel
             if (isFlying && gameState.gridObjects.some(o => o.x === x && o.y === y && o.type === 'terrain')) {
                 isProcessingAction = false;
                 return; // Do nothing, keep action active
             }
            // Cancel spell if clicking somewhere invalid
            gameState.action = null;
            gameState.spellToCast = null; // Also clear the selected spell
            cells.forEach(c => c.classList.remove('walkable', 'attackable', 'magic-attackable', 'splash-targetable'));
            isProcessingAction = false; // Unlock actions
            // Re-render actions to show default buttons
            renderBattleGrid();
        }
    } else if (gameState.action === 'mark_target') { // Ranger Mark Target
         isProcessingAction = true; // Lock actions
         if (clickedEnemy && clickedEnemy.isAlive()) {
             // Deduct cost and mark used now that target is confirmed
             player.mp -= player.signatureAbilityData.cost;
             player.signatureAbilityUsed = true; // Mark as used
             updateStatsView();

             gameState.markedTarget = clickedEnemy; // Store reference to the enemy object
             clickedEnemy.isMarked = true;
             addToLog(`You mark ${clickedEnemy.name} as your prey!`, 'text-yellow-400');
             renderBattleGrid(); // Re-render to show mark indicator
             gameState.isPlayerTurn = false; // End turn
             finalizePlayerAction(); // Proceed to next phase
         } else {
             // Cancel mark if clicking somewhere invalid
             gameState.action = null;
             cells.forEach(c => c.classList.remove('walkable', 'attackable', 'magic-attackable', 'splash-targetable')); // Clear highlights
             isProcessingAction = false; // Unlock
             // REFUND ability use since it failed
             player.signatureAbilityUsed = false;
             // Don't need to refund MP as it wasn't deducted yet
             updateStatsView();
             renderBattleGrid(); // Show default actions
             addToLog("Mark cancelled.", "text-gray-400");
             // Turn does NOT end on cancellation
             gameState.isPlayerTurn = true;
             // beginPlayerTurn(); // Don't call this, just allow another action
             // Re-enable actions without starting a full new turn cycle
             isProcessingAction = false;
         }
    }
}

function isCellBlocked(x, y, forEnemy = false, canFly = false) {
    // Check if the cell is part of the layout
    if (x < 0 || x >= gameState.gridWidth || y < 0 || y >= gameState.gridHeight || !gameState.gridLayout || gameState.gridLayout[y * gameState.gridWidth + x] !== 1) {
        return true;
    }

    if (forEnemy) {
        if (player.x === x && player.y === y) return true;
        // Check for drone
        if (gameState.activeDrone && gameState.activeDrone.isAlive() && gameState.activeDrone.x === x && gameState.activeDrone.y === y) return true; // Added isAlive
    } else { // Player movement OR Drone movement
        const isOccupiedByEnemy = currentEnemies.some(e => e.isAlive() && e.x === x && e.y === y); // Only check living enemies
        if (isOccupiedByEnemy) return true;
        // Check for drone (if player is moving)
        if (!forEnemy && gameState.activeDrone && gameState.activeDrone.isAlive() && gameState.activeDrone.x === x && gameState.activeDrone.y === y) return true; // Added isAlive
        // Check for player (if drone is moving - this case might need refinement if drone moves independently)
        if (forEnemy && player.x === x && player.y === y) return true; // Assuming drone is 'forEnemy=true' when checking its own movement - needs review
    }


    const gridObject = gameState.gridObjects.find(o => o.x === x && o.y === y);
    if (gridObject) {
        // If the entity can fly, it can move over obstacles and terrain
        if (canFly) {
            return false;
        }
         // Obstacles always block, terrain blocks non-flyers
         if (gridObject.type === 'obstacle' || gridObject.type === 'terrain') {
             return true;
         }
    }

    return false;
}


async function movePlayer(x, y) {
    const isFlying = (player.race === 'Pinionfolk');

    if (isCellBlocked(x, y, false, isFlying)) {
        addToLog("You can't move there, it's blocked!", 'text-red-400');
        gameState.action = null;
        document.querySelectorAll('.grid-cell').forEach(c => c.classList.remove('walkable'));
        isProcessingAction = false; // Unlock actions on invalid move
        return;
    }

    let moveDistance = 3; // Base move distance
    // --- ELF: Nature's Madness (Movement) ---
    if (player.race === 'Elf' && (!player.equippedArmor || !player.equippedArmor.metallic)) {
        moveDistance += (player.level >= 20 ? 2 : 1);
    }
    if(player.statusEffects.bonus_speed) moveDistance += player.statusEffects.bonus_speed.move;
    if(player.statusEffects.slowed) moveDistance = Math.max(1, moveDistance + player.statusEffects.slowed.move);

    const path = findPath({x: player.x, y: player.y}, {x, y}, isFlying);

    if (path && path.length > 1 && path.length <= (moveDistance + 1)) { // Path length includes start cell
        gameState.isPlayerTurn = false; // Player turn ends after move starts

        // Animate movement along the path
        for (let i = 1; i < path.length; i++) {
            // MODIFIED: Increased delay from 150 to 300
            await new Promise(resolve => setTimeout(resolve, 300)); // Delay between steps
            player.x = path[i].x;
            player.y = path[i].y;
            renderBattleGrid(); // Re-render grid after each step
        }

        finalizePlayerAction(); // Go to end of turn effects/next phase
    } else {
         if (!path) {
             addToLog("The path is blocked!", 'text-red-400');
         } else {
             addToLog("You can't move that far!", 'text-red-400');
         }
        gameState.action = null;
        const cells = document.querySelectorAll('.grid-cell');
        cells.forEach(c => c.classList.remove('walkable'));
        isProcessingAction = false; // Unlock actions after invalid path
    }
}

function performAttackOnObstacle(obstacle) {
    const weapon = player.equippedWeapon;
    let weaponRange = weapon.range || 1;
    // --- PINIONFOLK: Flight (Range) ---
    if (player.race === 'Pinionfolk' && player.level >= 20) {
        weaponRange += 2;
    }
    // --- End Pinionfolk Logic ---
    if(player.statusEffects.bonus_range) weaponRange += player.statusEffects.bonus_range.range;

    const dx = Math.abs(player.x - obstacle.x);
    const dy = Math.abs(player.y - obstacle.y);

    if (dx + dy > weaponRange) {
        addToLog("You are too far away to attack the obstacle!", 'text-red-400');
        isProcessingAction = false; // Unlock on failure
        return;
    }

    gameState.isPlayerTurn = false;
    addToLog("You attack the obstacle!", "text-yellow-300");

    obstacle.hp -= 1; // Obstacles typically have low HP
    if (obstacle.hp <= 0) {
        addToLog(`You destroyed the ${obstacle.name}!`, "text-green-400");

        // Seed drop logic from obstacles
        const dropChance = 0.1 + (player.luck / 200); // 10% base + luck bonus

        // Use new rollForEffect function, which includes Human/Halfling/Dragonborn passives
        if (player.rollForEffect(dropChance, 'Obstacle Seed Drop')) {
            const seedRarities = ['Common', 'Uncommon', 'Rare'];
            const seedWeights = [70, 25, 5]; // Define chances for each rarity
            const chosenRarity = choices(seedRarities, seedWeights); // Use choices helper

            // Find available seeds of the chosen rarity
            const availableSeeds = Object.keys(ITEMS).filter(key => {
                const details = ITEMS[key];
                return details && (details.type === 'seed' || details.type === 'sapling') && details.rarity === chosenRarity;
            });

            if (availableSeeds.length > 0) {
                const seedKey = availableSeeds[Math.floor(Math.random() * availableSeeds.length)];
                player.addToInventory(seedKey, 1); // Add the seed to inventory (logs automatically)
            }
        }

        // Remove the obstacle from the grid objects array
        const index = gameState.gridObjects.indexOf(obstacle);
        if (index > -1) {
            gameState.gridObjects.splice(index, 1);
        }
    }

    renderBattleGrid(); // Update the grid visually
    finalizePlayerAction(); // Move to next phase
}

function performSpellFollowUpAttack(target) {
    if (!target || !target.isAlive()) {
        const livingEnemies = currentEnemies.filter(e => e.isAlive());
        if (livingEnemies.length > 0) {
            target = livingEnemies[0];
        } else {
            return; // No living targets left
        }
    }
     if (gameState.battleEnded) return; // Don't proceed if battle ended before follow-up

    const weapon = player.equippedWeapon;
    addToLog(`Your ${weapon.name} resonates with the spell, lashing out with a follow-up strike!`, 'text-yellow-300');

    let baseDamage = rollDice(...weapon.damage, 'Spell Follow-up Attack').total;
    let damage = Math.floor(baseDamage * (1 + player.intelligence / 20));
    let attackElement = player.weaponElement;

    // --- ELEMENTAL: Innate Elementalist (Damage) ---
    if (player.race === 'Elementals' && attackElement === player.elementalAffinity) {
        const damageBonus = (player.level >= 20) ? 1.20 : 1.10;
        damage = Math.floor(damage * damageBonus);
        if (player.level >= 20) {
             damage += rollDice(1, weapon.damage[1], 'Elemental Evo Die').total; // Add extra die
        }
    }
    // --- End Elemental Logic ---

    // --- DRAGONBORN: Bloodline Attunement (Damage) ---
    if (player.race === 'Dragonborn') {
        const damageBonus = (player.level >= 20) ? 1.20 : 1.10;
        damage = Math.floor(damage * damageBonus);
    }
    // --- End Dragonborn Logic ---

    const finalDamage = target.takeDamage(damage, { element: attackElement });
    addToLog(`The follow-up attack hits ${target.name} for <span class="font-bold text-yellow-300">${finalDamage}</span> damage.`);

    // MODIFIED: Check status immediately after follow-up
     if (!gameState.battleEnded) {
         checkBattleStatus(true); // isReaction = true for follow-ups
     }
}

function performShieldFollowUpAttack(target) {
     if (!target || !target.isAlive()) return;
     const shield = player.equippedShield;
     if (!shield.effect?.attack_follow_up) return;

     addToLog(`Your ${shield.name} retaliates!`, 'text-orange-400');
     const effect = shield.effect.attack_follow_up;
     const damage = rollDice(...effect.damage, 'Shield Follow-up').total;
     const finalDamage = target.takeDamage(damage, { element: player.shieldElement });
     addToLog(`It strikes ${target.name} for <span class="font-bold text-orange-400">${finalDamage}</span> damage.`);

     // Use new rollForEffect function
     const paralyzeChance = effect.paralyze_chance || 0;
     if (player.rollForEffect(paralyzeChance, 'Shield Paralyze')) {
         target.statusEffects.paralyzed = { duration: (effect.duration || 1) + 1 }; // Default duration 1 + 1
         addToLog(`${target.name} is paralyzed by the blow!`, 'text-yellow-500');
     }
     // MODIFIED: Check status immediately after shield attack
     if (!gameState.battleEnded) {
          checkBattleStatus(true); // isReaction = true for follow-ups
     }
}


function performAttack(targetIndex) {
    const weapon = player.equippedWeapon;
    const target = currentEnemies[targetIndex];
    if (!target || !target.isAlive()) {
        isProcessingAction = false; // Unlock if target is invalid
        renderBattleGrid();
        return;
    };

    // Determine weapon range
    let weaponRange = weapon.range || 1;
    // --- PINIONFOLK: Flight (Range) ---
    if (player.race === 'Pinionfolk' && player.level >= 20) {
        weaponRange += 2;
    }
    // --- End Pinionfolk Logic ---
    if(player.statusEffects.bonus_range) weaponRange += player.statusEffects.bonus_range.range;

    const dx = Math.abs(player.x - target.x);
    const dy = Math.abs(player.y - target.y);

    if(dx + dy > weaponRange){
        addToLog("You are too far away to attack!", 'text-red-400');
        isProcessingAction = false; // Unlock if out of range
        return;
    }

    gameState.isPlayerTurn = false;

    // --- performSingleAttack function remains unchanged internally ---
    const performSingleAttack = (attackTarget, isSecondStrike = false) => {
        const calcLog = {
            source: `Player Attack ${isSecondStrike ? '(2)' : ''}`,
            targetName: attackTarget.name,
            steps: []
        };
        let messageLog = []; // Log messages specific to this attack instance
        let forceCritMultiplier = null; // Used by Rogue's Assassinate

        // --- Rogue: Assassinate Check ---
        // Check HP, MP, AND if the target hasn't dealt damage yet
        // MODIFIED: Check signatureAbilityToggleActive and remove MP cost logic
        if (player._classKey === 'rogue' && player.signatureAbilityToggleActive && attackTarget.hp === attackTarget.maxHp && !attackTarget.hasDealtDamageThisEncounter && !isSecondStrike) {
             const assassinateMultiplier = Math.max(2.0, weapon.effect?.critMultiplier || 1.5); // Use 2x or weapon's crit mod (default 1.5), whichever is higher
             messageLog.push(`Assassinate! (x${assassinateMultiplier})`);
             forceCritMultiplier = assassinateMultiplier; // Force crit damage
             calcLog.steps.push({ description: "Assassinate", value: `Toggle Active (x${assassinateMultiplier})`, result: "" });
             // MP cost is removed
        }


        // --- Dwarf: Craftsmen's Intuition (Evolution) ---
        // Create a mutable copy of weapon damage for this attack
        let attackDamageDice = [...weapon.damage]; // [numDice, sides]
        if (player.race === 'Dwarf' && player.level >= 20) {
            if (attackDamageDice[1] === 6) { // d6
                attackDamageDice[1] = 8; // becomes d8
                calcLog.steps.push({ description: "Craftsmen's Intuition", value: "d6 -> d8", result: "" });
            } else if (attackDamageDice[1] === 8) { // d8
                attackDamageDice[1] = 10; // becomes d10
                calcLog.steps.push({ description: "Craftsmen's Intuition", value: "d8 -> d10", result: "" });
            }
        }
        // --- End Dwarf Logic ---

        // --- Whetstone Buff ---
        let allowCrit = false; // Flag to enable crit chance even if weapon normally can't
        if (player.statusEffects.buff_whetstone) {
            if (player.statusEffects.buff_whetstone.diceStepUp && !isSecondStrike) { // Apply only once per action if double strike
                const originalSides = attackDamageDice[1];
                switch (originalSides) {
                    case 2: attackDamageDice[1] = 4; break;
                    case 3: attackDamageDice[1] = 4; break; // d3 goes to d4
                    case 4: attackDamageDice[1] = 6; break;
                    case 6: attackDamageDice[1] = 8; break;
                    case 8: attackDamageDice[1] = 10; break;
                    case 10: attackDamageDice[1] = 12; break;
                    // d12 stays d12 (max)
                }
                if (attackDamageDice[1] !== originalSides) {
                    messageLog.push(`Whetstone sharpens the blow! (d${originalSides} -> d${attackDamageDice[1]})`);
                    calcLog.steps.push({ description: "Whetstone Buff", value: `d${originalSides} -> d${attackDamageDice[1]}`, result: "" });
                }
            }
            if (player.statusEffects.buff_whetstone.critEnable) {
                allowCrit = true; // Whetstone enables crits
                messageLog.push(`Whetstone finds a weak spot!`);
                 calcLog.steps.push({ description: "Whetstone Crit Enable", value: `Crit Possible`, result: "" });
            }
        }

        let rollResult = rollDice(attackDamageDice[0], attackDamageDice[1], `Player Weapon Attack ${isSecondStrike ? '2' : '1'}`);
        let baseWeaponDamage = rollResult.total;
        calcLog.baseDamage = baseWeaponDamage;

        // --- Fighter: Weapon Mastery Reroll ---
        if (player._classKey === 'fighter' && player.signatureAbilityToggleActive && rollResult.rolls.includes(1)) {
            const diceSize = attackDamageDice[1]; // Use the (potentially modified) dice size
            const cost = diceSize; // MP cost equals die size
            const onesCount = rollResult.rolls.filter(r => r === 1).length;

            if (player.mp >= cost) {
                player.mp -= cost;
                updateStatsView();
                addToLog(`Weapon Mastery: Rerolling ${onesCount} dice (Cost: ${cost} MP)...`, 'text-yellow-300');

                // Reroll only the dice that resulted in 1
                let rerollTotal = 0;
                let rerolledValues = [];
                for(let i = 0; i < onesCount; i++) {
                    const reroll = Math.floor(Math.random() * diceSize) + 1;
                    rerollTotal += reroll;
                    rerolledValues.push(reroll);
                }

                // Calculate new base damage: Original total - number of ones + reroll total
                baseWeaponDamage = baseWeaponDamage - onesCount + rerollTotal;
                addToLog(`Rerolled: [${rerolledValues.join(', ')}]. New Base Damage: ${baseWeaponDamage}`, 'text-yellow-300');
                calcLog.steps.push({ description: "Weapon Mastery Reroll", value: `Cost ${cost} MP`, result: baseWeaponDamage });

            } else {
                addToLog(`Weapon Mastery: Not enough MP (${cost} required) to reroll!`, 'text-blue-400');
            }
        }
        // --- End Fighter Logic ---

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

        // --- Ranger: Hunter's Mark Bonus Damage ---
        if (attackTarget.isMarked && attackTarget === gameState.markedTarget) {
             const markBonusDamage = rollDice(1, 8, 'Hunters Mark Bonus').total;
             damage += markBonusDamage;
             messageLog.push(`Hunter's Mark adds ${markBonusDamage} damage!`);
             calcLog.steps.push({ description: "Hunter's Mark", value: "+1d8", result: damage });
             allowCrit = true; // Marked targets can be crit
        }


        let attackEffects = { element: player.weaponElement };


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
        // Barbarian Enrage
        if (player.statusEffects.buff_enrage) {
             damage = Math.floor(damage * 1.5);
             if (!isSecondStrike) messageLog.push(`Your rage empowers the blow!`);
             calcLog.steps.push({ description: "Enrage Buff", value: `x1.5`, result: damage });
        }

        // --- ELEMENTAL: Innate Elementalist (Damage) ---
        if (player.race === 'Elementals' && attackEffects.element === player.elementalAffinity) {
            const damageBonus = (player.level >= 20) ? 1.20 : 1.10;
            damage = Math.floor(damage * damageBonus);
            calcLog.steps.push({ description: "Innate Elementalist", value: `x${damageBonus.toFixed(2)}`, result: damage });
            if (player.level >= 20) {
                 const extraDieRoll = rollDice(1, attackDamageDice[1], 'Elemental Evo Die').total;
                 damage += extraDieRoll;
                 calcLog.steps.push({ description: "Innate Elementalist (Evo)", value: `+1d${attackDamageDice[1]}`, result: damage });
            }
        }
        // --- End Elemental Logic ---

        // --- DRAGONBORN: Bloodline Attunement (Damage) ---
        if (player.race === 'Dragonborn') {
            const damageBonus = (player.level >= 20) ? 1.20 : 1.10;
            damage = Math.floor(damage * damageBonus);
            calcLog.steps.push({ description: "Bloodline Attunement", value: `x${damageBonus.toFixed(2)}`, result: damage });
        }
        // --- End Dragonborn Logic ---


        // --- CRITICAL HIT CALCULATION ---
        if (forceCritMultiplier) { // Apply Assassinate crit
             damage = Math.floor(damage * forceCritMultiplier);
             messageLog.push(`CRITICAL HIT!`); // Message already added in Assassinate check
             // calcLog step already added in Assassinate check
        } else { // Normal crit calculation
            let critChance = player.critChance;
            if(player.statusEffects.bonus_crit) critChance += player.statusEffects.bonus_crit.critChance;
            // Check if weapon can crit OR if target is marked (allowCrit)
            const canWeaponCrit = weapon.class === 'Dagger' || weapon.effect?.critChance || allowCrit;

            if (canWeaponCrit) {
                // Apply specific crit chance bonuses
                if (weapon.class === 'Dagger') critChance += 0.1;
                if (weapon.effect?.critChance) critChance += weapon.effect.critChance;
                // Add base 10% for marked target if weapon doesn't have native crit AND Assassinate didn't proc
                if (allowCrit && !weapon.effect?.critChance && weapon.class !== 'Dagger' && !forceCritMultiplier) critChance += 0.10;

                if (player.rollForEffect(critChance, 'Weapon Crit')) { // Use central roll function
                    let critMultiplier = 1.5; // Default crit multiplier
                    if (weapon.class === 'Dagger') critMultiplier = 1.5;
                    if (weapon.effect?.critMultiplier) critMultiplier = weapon.effect.critMultiplier;
                    // Marked target uses default 1.5x unless weapon specifies higher

                    damage = Math.floor(damage * critMultiplier);
                    messageLog.push(`CRITICAL HIT!`);
                    calcLog.steps.push({ description: "Critical Hit", value: `x${critMultiplier}`, result: damage });
                }
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

        // Paladin: Divine Smite
        if (player._classKey === 'paladin' && player.signatureAbilityToggleActive && finalDamage > 0 && !isSecondStrike) { // Check toggle, only on first hit
            const catalyst = player.equippedCatalyst;
            if (catalyst && catalyst.name !== 'None') {
                 const smiteCost = 15;
                 if (player.mp >= smiteCost) {
                     player.mp -= smiteCost;
                     updateStatsView();
                     // Calculate smite damage (scales with catalyst spell_amp)
                     const baseDice = 2;
                     const maxDice = 6;
                     const spellAmp = catalyst.effect?.spell_amp || 0;
                     const smiteDiceCount = Math.min(maxDice, baseDice + spellAmp);
                     const smiteDamage = rollDice(smiteDiceCount, 8, 'Divine Smite').total;

                     const finalSmiteDamage = attackTarget.takeDamage(smiteDamage, { isMagic: true, element: 'light' });
                     addToLog(`Divine Smite erupts, dealing an extra <span class="font-bold text-yellow-200">${finalSmiteDamage}</span> Light damage! (Cost: ${smiteCost} MP)`, 'text-yellow-100');
                     // Check if smite killed the target immediately (isReaction = true)
                     if (!attackTarget.isAlive()) checkBattleStatus(true); // Only check if smite killed
                 } else {
                     addToLog("Not enough MP to activate Divine Smite!", 'text-blue-400');
                 }
            } else {
                 addToLog("Divine Smite requires a catalyst equipped!", 'text-red-400');
            }
        }


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
        let paralyzeBaseChance = 0;
        if (weapon.class === 'Hammer') paralyzeBaseChance += 0.1;
        if (weapon.effect?.paralyzeChance) paralyzeBaseChance += weapon.effect.paralyzeChance;

        // Use new rollForEffect function
        if (player.rollForEffect(paralyzeBaseChance, 'Hammer Paralyze')) {
            attackTarget.statusEffects.paralyzed = { duration: 2 };
            addToLog(`${attackTarget.name} is stunned by the blow!`, 'text-yellow-500');
        }

        // Other on-hit effects
        const toxicChance = weapon.effect?.toxicChance || 0;
        if (player.rollForEffect(toxicChance, 'Weapon Toxic')) {
            attackTarget.statusEffects.toxic = { duration: 4 }; // Duration is 3 turns after this one
            addToLog(`${attackTarget.name} is afflicted with a deadly toxin!`, 'text-green-700');
        }

        const petrifyChance = weapon.effect?.petrifyChance || 0;
        if(player.rollForEffect(petrifyChance, 'Weapon Petrify')) {
            attackTarget.statusEffects.petrified = { duration: 2 };
            addToLog(`${attackTarget.name} is petrified by the attack!`, 'text-gray-400');
        }

        const cleanseChance = weapon.effect?.cleanseChance || 0;
        if (player.rollForEffect(cleanseChance, 'Weapon Cleanse')) {
             const debuffs = Object.keys(player.statusEffects).filter(key => ['poison', 'toxic', 'paralyzed', 'petrified', 'drenched'].includes(key));
             if (debuffs.length > 0) {
                 const effectToCleanse = debuffs[0];
                 delete player.statusEffects[effectToCleanse];
                 addToLog(`Your weapon's holy energy cleanses you of ${effectToCleanse}!`, 'text-yellow-200');
             }
        }
        // MODIFIED: Call checkBattleStatus immediately after damage/effects of THIS strike
        // Use 'true' for isReaction only if it's the second strike or a follow-up
        if (!gameState.battleEnded) { // Only check if battle not already ended by this strike
             checkBattleStatus(isSecondStrike); // Pass isSecondStrike directly as isReaction flag
        }
    };
    // --- End performSingleAttack function ---


    // Perform the first attack
    performSingleAttack(target, false); // isSecondStrike = false

    // Check if the first attack ended the battle before proceeding
    if (gameState.battleEnded) {
        isProcessingAction = false; // Ensure actions are unlocked if battle ends here
        return; // Stop processing further attacks/effects
    }

    // --- Handle Follow-ups with Delays ---
    // Use a flag to track if a follow-up action is pending, to prevent immediate turn end
    let followUpPending = false;

    // Shield Follow-up Check (Delayed)
    if (player.equippedShield.effect?.attack_follow_up && target.isAlive()) {
        followUpPending = true;
        setTimeout(() => {
            if (gameState.battleEnded || !target.isAlive()) {
                 // If battle ended or target died before/during shield attack, finalize
                 finalizePlayerAction();
                 return;
            }
            performShieldFollowUpAttack(target); // This function internally calls checkBattleStatus(true)
             // After shield attack, check if second weapon strike is needed OR finalize
             if (!gameState.battleEnded) {
                 checkAndPerformSecondStrike(target);
             } else {
                  finalizePlayerAction(); // Finalize if shield attack ended battle
             }
        }, 250);
    } else {
        // If no shield follow-up, check directly for second weapon strike
        checkAndPerformSecondStrike(target);
    }

    // Helper function to handle the second weapon strike logic
    function checkAndPerformSecondStrike(strikeTarget) {
         if (gameState.battleEnded || !strikeTarget.isAlive()) {
             // If battle ended or target died before second strike check, finalize immediately
             finalizePlayerAction();
             return;
         }

        const needsSecondAttack = (weapon.class === 'Hand-to-Hand' || weapon.effect?.doubleStrike);
        const procSecondAttack = weapon.effect?.doubleStrikeChance && player.rollForEffect(weapon.effect.doubleStrikeChance, 'Weapon Double Strike');

        if (needsSecondAttack || procSecondAttack) {
            followUpPending = true; // Mark pending
            setTimeout(() => {
                if (gameState.battleEnded || !strikeTarget.isAlive()) {
                     // If battle ended or target died before second strike executes, finalize
                     finalizePlayerAction();
                     return;
                }
                addToLog("You strike again!", "text-yellow-300");
                performSingleAttack(strikeTarget, true); // isSecondStrike = true
                // performSingleAttack now calls checkBattleStatus(true) internally

                // Finalize after the second strike completes (regardless of battle end state)
                finalizePlayerAction();

            }, 250); // Delay before second strike
        } else if (!followUpPending) {
             // If NO follow-ups were pending at all, finalize the player's action now
             finalizePlayerAction();
        }
         // If only shield follow-up was pending, finalizePlayerAction is called within its timeout
    }

    // Note: finalizePlayerAction handles moving to the next phase if the battle hasn't ended.

} // End performAttack



function castSpell(spellKey, targetIndex) {
    const spellData = SPELLS[spellKey];
    const target = currentEnemies[targetIndex];
    if ((spellData.type === 'st' || spellData.type === 'aoe') && (!target || !target.isAlive())) {
        isProcessingAction = false; // Unlock if target is invalid
        renderBattleGrid();
        return;
    }

    // ... [rest of spell cost, range checks, MP deduction] ...
    // --- [Existing Spell Cost Calculation Logic Start] ---
    const playerSpell = player.spells[spellKey];
    const tierIndex = playerSpell.tier - 1;
    const spell = spellData.tiers[tierIndex];

    const catalyst = player.equippedCatalyst;
    if (!catalyst || catalyst.name === 'None') {
        addToLog("You need a catalyst equipped to cast spells.", 'text-red-400');
        isProcessingAction = false;
        return;
    }

    // Determine spell range
    let spellRange = catalyst.range || 3;
    // --- PINIONFOLK: Flight (Range) ---
    if (player.race === 'Pinionfolk' && player.level >= 20) {
        spellRange += 2;
    }
    // --- End Pinionfolk Logic ---
    if (catalyst.effect?.spell_sniper) spellRange *= (1 + catalyst.effect.spell_sniper);

    if (spellData.type === 'st' || spellData.type === 'aoe') {
        const dx = Math.abs(player.x - target.x);
        const dy = Math.abs(player.y - target.y);

        if(dx + dy > spellRange){
            addToLog("You are too far away to cast that spell!", 'text-red-400');
            isProcessingAction = false; // Unlock if out of range
            return;
        }
    }

    // Calculate Final MP Cost
    let finalSpellCost = spell.cost;
    const armor = player.equippedArmor;
    if (catalyst.effect?.mana_discount) {
        finalSpellCost = Math.max(1, finalSpellCost - catalyst.effect.mana_discount);
    }
    if (armor.effect?.mana_discount) {
        finalSpellCost = Math.max(1, finalSpellCost - armor.effect.mana_discount);
    }
    // Warlock Cost Increase
    if (player._classKey === 'warlock' && player.signatureAbilityToggleActive) {
        finalSpellCost = Math.ceil(finalSpellCost * 1.25);
    }
    // Magus Cost Increase
    if (player._classKey === 'magus' && player.activeModeIndex > -1) {
        finalSpellCost = Math.ceil(finalSpellCost * 1.30);
    }
    // Debuff Cost Increase
    if (player.statusEffects.magic_dampen) {
        finalSpellCost = Math.floor(finalSpellCost * (1 / player.statusEffects.magic_dampen.multiplier));
    }


    if (player.mp < finalSpellCost) {
        addToLog(`Not enough MP to cast ${spell.name}.`, 'text-red-400');
        isProcessingAction = false;
        return;
    }

    player.mp -= finalSpellCost;
    // --- [Existing Spell Cost Calculation Logic End] ---

    gameState.isPlayerTurn = false;
    gameState.lastSpellElement = spellData.element;
    updateStatsView();

    addToLog(`You cast <span class="font-bold text-purple-300">${spell.name}</span>!`);

    let finalDamage = 0; // Initialize finalDamage

    // Handle Healing and Support spells
    if (spellData.type === 'healing' || spellData.type === 'support') {
        // ... [Existing healing/support logic - unchanged] ...
         if (spellData.type === 'healing') {
            let diceCount = spell.damage[0];
            const spellAmp = catalyst.effect?.spell_amp || 0;
            diceCount = Math.min(spell.cap, diceCount + spellAmp);

            let healAmount = rollDice(diceCount, spell.damage[1], `Healing Spell: ${spell.name}`).total + player.magicalDamageBonus;

            // --- ELEMENTAL: Innate Elementalist (Damage/Healing) ---
            if (player.race === 'Elementals' && spellData.element === player.elementalAffinity) {
                const damageBonus = (player.level >= 20) ? 1.20 : 1.10;
                healAmount = Math.floor(healAmount * damageBonus);
                if (player.level >= 20) {
                    let extraDieRoll = rollDice(1, spell.damage[1], 'Elemental Evo Die').total;
                    healAmount += Math.min(spell.cap * spell.damage[1], extraDieRoll); // Cap extra die damage
                }
            }
            // --- End Elemental Logic ---

            // --- DRAGONBORN: Bloodline Attunement (Damage/Healing) ---
            if (player.race === 'Dragonborn') {
                const damageBonus = (player.level >= 20) ? 1.20 : 1.10;
                healAmount = Math.floor(healAmount * damageBonus);
            }
            // --- End Dragonborn Logic ---

            player.hp = Math.min(player.maxHp, player.hp + healAmount);
            addToLog(`You recover <span class="font-bold text-green-400">${healAmount}</span> HP.`, 'text-green-300');
            updateStatsView();
        }
        else if (spellData.type === 'support') {
            if (spell.effect) {
                // Check if it's a buff or debuff
                if (spell.effect.type.startsWith('buff_')) {
                    player.statusEffects[spell.effect.type] = { ...spell.effect };
                    addToLog(`You are filled with the power of ${spell.name}!`, 'text-yellow-300');
                    if (spell.effect.cleanse) {
                        const debuffs = Object.keys(player.statusEffects).filter(key => ['poison', 'paralyzed', 'petrified', 'drenched', 'toxic'].includes(key));
                        if (debuffs.length > 0) {
                            debuffs.forEach(key => delete player.statusEffects[key]);
                            addToLog(`The divine light purges your ailments!`, 'text-yellow-200');
                        }
                    }
                } else if (spell.effect.type.startsWith('debuff_')) {
                    // Apply debuff to all enemies
                    currentEnemies.forEach(enemy => {
                        if (enemy.isAlive()) {
                            enemy.statusEffects[spell.effect.type] = { ...spell.effect };
                        }
                    });
                    addToLog(`Your enemies are weakened by ${spell.name}!`, 'text-red-400');
                }
            }
        }
    }
    // Handle Offensive spells
    else if (spellData.type === 'st' || spellData.type === 'aoe') {
        // ... [Existing offensive spell damage calculation logic] ...
        let diceCount = spell.damage[0];
        const spellAmp = catalyst.effect?.spell_amp || 0;
        diceCount = Math.min(spell.cap, diceCount + spellAmp);

        let damage = rollDice(diceCount, spell.damage[1], `Player Spell: ${spell.name}`).total + player.magicalDamageBonus;

        // --- ELEMENTAL: Innate Elementalist (Damage) ---
        if (player.race === 'Elementals' && spellData.element === player.elementalAffinity) {
            const damageBonus = (player.level >= 20) ? 1.20 : 1.10;
            damage = Math.floor(damage * damageBonus);
            if (player.level >= 20) {
                let extraDieRoll = rollDice(1, spell.damage[1], 'Elemental Evo Die').total;
                let cappedExtraDamage = Math.min( (spell.cap * spell.damage[1]) - damage, extraDieRoll); // Cap extra die damage
                damage += cappedExtraDamage;
            }
        }
        // --- End Elemental Logic ---

        // --- DRAGONBORN: Bloodline Attunement (Damage) ---
        if (player.race === 'Dragonborn') {
            const damageBonus = (player.level >= 20) ? 1.20 : 1.10;
            damage = Math.floor(damage * damageBonus);
        }
        // --- End Dragonborn Logic ---

        // Check for spell crit
        let spellCritChance = player.critChance + (catalyst.effect?.spell_crit_chance || 0);
         // Warlock Crit Bonus
         if (player._classKey === 'warlock' && player.signatureAbilityToggleActive && catalyst.effect?.spell_crit_chance) {
             spellCritChance += (catalyst.effect.spell_crit_chance * 0.5); // Relative 50% increase
         }
        if(player.statusEffects.bonus_crit) spellCritChance += player.statusEffects.bonus_crit.critChance;
        if (player.statusEffects.buff_shroud || player.statusEffects.buff_voidwalker) spellCritChance *= 1.5;

        // Use new rollForEffect function
        if (player.rollForEffect(spellCritChance, 'Spell Crit')) {
            let critMultiplier = 1.5;
            if(catalyst.effect?.spell_crit_multiplier) critMultiplier = catalyst.effect.spell_crit_multiplier;
            if(player.statusEffects.buff_voidwalker) critMultiplier += 0.5;

            damage = Math.floor(damage * critMultiplier);
            addToLog(`A critical spell!`, 'text-yellow-300');
        }

        // Overdrive Tome
        let overdriveChance = catalyst.effect?.overdrive?.chance || 0;
         // Warlock Overdrive Bonus
         if (player._classKey === 'warlock' && player.signatureAbilityToggleActive && overdriveChance > 0) {
             overdriveChance *= 1.5; // Relative 50% increase
         }
        const overdrive = catalyst.effect?.overdrive;
        if (overdrive && player.rollForEffect(overdriveChance, 'Overdrive Tome')) { // Use potentially modified chance
            damage = Math.floor(damage * overdrive.multiplier);
            const selfDamage = Math.floor(player.maxHp * overdrive.self_damage);
            player.hp -= selfDamage;
            addToLog(`Overdrive activated! The spell deals massive damage! You take <span class="font-bold text-red-400">${selfDamage}</span> backlash damage!`, 'text-purple-500 font-bold');
            updateStatsView();
        }

        // Spellweaver Catalyst
         let spellweaverChance = catalyst.effect?.spell_weaver || 0;
          // Warlock Spellweaver Bonus
         if (player._classKey === 'warlock' && player.signatureAbilityToggleActive && spellweaverChance > 0) {
             spellweaverChance *= 1.5; // Relative 50% increase
         }
         if (catalyst.effect?.spell_weaver && player.rollForEffect(spellweaverChance, 'Spellweaver')) { // Use modified chance
             const elements = ['fire', 'water', 'earth', 'wind', 'lightning', 'nature', 'light', 'void'];
             const randomElement = elements[Math.floor(Math.random() * elements.length)];
             addToLog(`Spellweaver! The spell also carries the essence of ${randomElement}!`, 'text-cyan-300');
             // Apply secondary element effect (simplified for now: just log)
             // More complex logic could apply damage/status based on secondary element
         }

        const spellEffects = {
            isMagic: true,
            element: spellData.element,
            spell_penetration: catalyst.effect?.spell_penetration || 0
        };

        // --- Apply Damage to Primary Target ---
        finalDamage = target.takeDamage(damage, spellEffects); // Assign to finalDamage
        addToLog(`It hits ${target.name} for <span class="font-bold text-purple-400">${finalDamage}</span> ${spellData.element} damage.`);

        // --- Apply primary target elemental effects (Water Drench, Earth Paralyze, Nature Lifesteal, Light Cleanse) ---
        if (finalDamage > 0 && target.isAlive()) { // Check target alive before applying status
             if (spellData.element === 'water') {
                addToLog(`The water from your spell drenches ${target.name}!`, 'text-blue-400');
                applyStatusEffect(target, 'drenched', { duration: 2 + tierIndex, multiplier: 0.9 - (tierIndex * 0.05) }, player.name);
            }

            const earthParalyzeChance = 0.2 + (tierIndex * 0.1);
            if (spellData.element === 'earth' && player.rollForEffect(earthParalyzeChance, 'Spell Earth Paralyze')) {
                if (!target.statusEffects.paralyzed) {
                    applyStatusEffect(target, 'paralyzed', { duration: 2 + tierIndex }, player.name);
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

            const lightCleanseChance = 0.2 + (tierIndex * 0.15);
            if (spellData.element === 'light' && player.rollForEffect(lightCleanseChance, 'Spell Light Cleanse')) {
                const debuffs = Object.keys(player.statusEffects).filter(key => ['poison', 'paralyzed', 'petrified', 'drenched', 'toxic'].includes(key));
                if (debuffs.length > 0) {
                    const effectToCleanse = debuffs[0];
                    delete player.statusEffects[effectToCleanse];
                    addToLog(`Your spell's light energy cleanses you of ${effectToCleanse}!`, 'text-yellow-200');
                }
            }
        } // End primary target effects

        // --- Magus: Arcane Manipulation Logic ---
        if (target.isAlive() && player._classKey === 'magus' && player.activeModeIndex > -1) { // Check target alive
             // ... [Existing Magus Chain/Wide logic - apply damage to secondary targets] ...
             const mode = player.signatureAbilityData.modes[player.activeModeIndex];

             // Chain Magic (Mode 0)
             if (mode === "Chain Magic" && spellData.type === 'st') {
                 let closestEnemy = null;
                 let minDist = Infinity;
                 // Find the closest *other* living enemy
                 currentEnemies.forEach(enemy => {
                     if (enemy.isAlive() && enemy !== target) {
                         const dist = Math.abs(target.x - enemy.x) + Math.abs(target.y - enemy.y);
                         // Check if within half the original spell range
                         if (dist <= Math.ceil(spellRange / 2) && dist < minDist) {
                             minDist = dist;
                             closestEnemy = enemy;
                         }
                     }
                 });

                 if (closestEnemy) {
                     const chainDamage = Math.floor(finalDamage * 0.5); // Half damage
                     if (chainDamage > 0) {
                         const chainFinalDamage = closestEnemy.takeDamage(chainDamage, spellEffects);
                         addToLog(`Chain Magic! The spell arcs to ${closestEnemy.name} for <span class="font-bold text-purple-400">${chainFinalDamage}</span> damage!`, 'text-cyan-300');
                         if (!gameState.battleEnded && !closestEnemy.isAlive()) checkBattleStatus(true); // Check if chain killed
                     }
                 }
             }
             // Wide Magic (Mode 1)
             else if (mode === "Wide Magic" && spellData.type === 'aoe') {
                 addToLog("Wide Magic empowers the AOE!", 'text-cyan-300');
                 const splashDamage = Math.floor(finalDamage * (spell.splash || 0.5)); // Use original splash factor
                 if (splashDamage > 0) {
                     // Iterate through all 8 adjacent cells (including diagonals)
                     for (let dx = -1; dx <= 1; dx++) {
                         for (let dy = -1; dy <= 1; dy++) {
                             if (dx === 0 && dy === 0) continue; // Skip center cell
                             const splashX = target.x + dx;
                             const splashY = target.y + dy;
                             const splashTarget = currentEnemies.find(e => e.isAlive() && e.x === splashX && e.y === splashY);
                             if (splashTarget) {
                                  const splashFinalDamage = splashTarget.takeDamage(splashDamage, spellEffects);
                                  addToLog(`Wide Magic splash hits ${splashTarget.name} for <span class="font-bold text-purple-400">${splashFinalDamage}</span> damage.`);
                                  if (!gameState.battleEnded && !splashTarget.isAlive()) checkBattleStatus(true); // Check if splash killed
                             }
                         }
                     }
                 }
             }
        }
        // --- Standard AOE Splash (if Wide Magic isn't active) ---
        else if (spellData.type === 'aoe') {
             currentEnemies.forEach((enemy, index) => {
                 if (index !== targetIndex && enemy.isAlive()) { // Check splash target alive
                     // Check adjacency (only orthogonal for standard splash)
                     if (Math.abs(target.x - enemy.x) + Math.abs(target.y - enemy.y) === 1) {
                         const splashDamage = Math.floor(finalDamage * (spell.splash || 0.5));
                         if (splashDamage > 0) {
                             const splashFinalDamage = enemy.takeDamage(splashDamage, spellEffects);
                             addToLog(`The spell splashes onto ${enemy.name} for <span class="font-bold text-purple-400">${splashFinalDamage}</span> damage.`);
                             if (!gameState.battleEnded && !enemy.isAlive()) checkBattleStatus(true); // Check if splash killed
                         }
                     }
                 }
             });
        } // End AOE/Splash

        // --- Handle Lightning Chaining ---
        if (target.isAlive() && spellData.element === 'lightning') { // Check target alive
            let chainTarget = target;
            let chainDamage = Math.floor(finalDamage * 0.5);
            for (let i = 0; i < tierIndex + 1; i++) { // Chains = tier number
                const potentialTargets = currentEnemies.filter(e => e.isAlive() && e !== chainTarget);
                if (potentialTargets.length > 0) {
                    const nextTarget = potentialTargets[Math.floor(Math.random() * potentialTargets.length)];
                    const chainFinalDamage = nextTarget.takeDamage(chainDamage, spellEffects);
                    addToLog(`Lightning arcs from ${chainTarget.name} to ${nextTarget.name} for <span class="font-bold text-blue-400">${chainFinalDamage}</span> damage!`);
                     if (!gameState.battleEnded && !nextTarget.isAlive()) checkBattleStatus(true); // Check if chain killed
                    chainTarget = nextTarget;
                    chainDamage = Math.floor(chainDamage * 0.5); // Damage halves each jump
                    if (chainDamage < 1 || !chainTarget.isAlive()) break; // Stop if damage too low or target died
                } else {
                    break; // No more targets
                }
            }
        } // End Lightning Chaining
    } // End Offensive Spell Logic

    // MODIFIED: Call checkBattleStatus immediately after all direct spell effects
    let followUpActionPending = false; // Flag to track if follow-up might happen
    if (!gameState.battleEnded) {
         checkBattleStatus(false); // isReaction = false for the main spell cast
    }

    // --- Handle Spell Follow-up and Wind Extra Turn AFTER immediate check ---
    if (!gameState.battleEnded) { // Only proceed if battle didn't end from main spell
        // Spell Follow-up (check if target is valid for follow-up)
        let spellFollowUpChance = player.equippedWeapon.effect?.spellFollowUp ? 1 : 0; // Assuming it's guaranteed if effect exists
        // Warlock Spell Follow-up Bonus
        if (player._classKey === 'warlock' && player.signatureAbilityToggleActive && spellFollowUpChance > 0) {
            spellFollowUpChance *= 1.5; // Relative 50% increase (won't affect guaranteed ones)
        }
        if (target && target.isAlive() && player.rollForEffect(spellFollowUpChance, 'Spell Follow-up')) { // Use roll function
             followUpActionPending = true;
            setTimeout(() => {
                 if (gameState.battleEnded) { // Check again inside timeout
                      finalizePlayerAction();
                      return;
                 }
                 performSpellFollowUpAttack(target); // This now calls checkBattleStatus(true) internally
                 finalizePlayerAction(); // Finalize after follow-up completes
            }, 250);
        } else {
            // Check for Wind Extra Turn ONLY if Spell Follow-up didn't proc
            const windExtraTurnChance = 0.1 + (tierIndex * 0.05);
            if (spellData.element === 'wind' && player.rollForEffect(windExtraTurnChance, 'Spell Wind Turn')) {
                followUpActionPending = true; // Prevents immediate turn end
                addToLog("The swirling winds grant you another turn!", "text-cyan-300 font-bold");
                setTimeout(beginPlayerTurn, 500); // Start another player turn
            }
        }
    } else {
        // If battle ended from main spell, finalize (which mainly unlocks actions now)
         finalizePlayerAction();
    }

    // If no follow-up actions are pending from this spell, finalize the action now
    if (!followUpActionPending) {
         finalizePlayerAction();
    }
} // End castSpell

function battleAction(type, actionData = null) {
    if (!player.isAlive()) {
        checkPlayerDeath();
        return;
    }
    if (!gameState.isPlayerTurn || isProcessingAction) return; // Added isProcessingAction check here

    // Reset Curved Sword combo if the action is not an attack.
    if (type !== 'attack') {
        gameState.comboTarget = null;
        gameState.comboCount = 0;
    }

    gameState.action = type;
    const cells = document.querySelectorAll('.grid-cell');
    cells.forEach(c => c.classList.remove('walkable', 'attackable', 'magic-attackable', 'splash-targetable'));
    const isFlying = (player.race === 'Pinionfolk');

    switch (type) {
        case 'move':
            let moveDistance = 3;
            // --- ELF: Nature's Madness (Movement) ---
            if (player.race === 'Elf' && (!player.equippedArmor || !player.equippedArmor.metallic)) {
                moveDistance += (player.level >= 20 ? 2 : 1);
            }
            if(player.statusEffects.bonus_speed) moveDistance += player.statusEffects.bonus_speed.move;
            if(player.statusEffects.slowed) moveDistance = Math.max(1, moveDistance + player.statusEffects.slowed.move);

            const reachableCells = findReachableCells({x: player.x, y: player.y}, moveDistance);
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
            // --- PINIONFOLK: Flight (Range) ---
            if (isFlying && player.level >= 20) {
                weaponRange += 2;
            }
            // --- End Pinionfolk Logic ---
            if(player.statusEffects.bonus_range) weaponRange += player.statusEffects.bonus_range.range;

            cells.forEach(c => {
                const x = parseInt(c.dataset.x);
                const y = parseInt(c.dataset.y);
                const dx = Math.abs(player.x - x);
                const dy = Math.abs(player.y - y);

                if (dx + dy <= weaponRange) {
                    const enemy = currentEnemies.find(e => e.x === x && e.y === y);
                    const obstacle = gameState.gridObjects.find(o => o.x === x && o.y === y && o.type === 'obstacle');
                    if (enemy || obstacle) {
                        c.classList.add('attackable');
                    }
                }
            });
            break;
        case 'magic':
            renderBattle('magic');
            break;
        case 'magic_select':
            // actionData is now just the spellKey string
            const spellKey = actionData;
            const spellData = SPELLS[spellKey];
             // Check if spellData is valid before proceeding
            if (!spellData) {
                 console.error(`Invalid spell key selected: ${spellKey}`);
                 return; // Prevent further errors
            }
            const spell = spellData.tiers[player.spells[spellKey].tier - 1];
            gameState.spellToCast = spellKey;


            if (spellData.type === 'st' || spellData.type === 'aoe') {
                gameState.action = 'magic_cast';
                 // Call renderBattleGrid with highlight flag
                 renderBattleGrid(true, 'magic'); // Specify magic highlight type
            } else if (spellData.type === 'support' || spellData.type === 'healing') {
                // Support/Healing spells are cast immediately without targeting
                castSpell(spellKey, 0); // Pass dummy targetIndex
            }
            break;
        case 'item':
            renderBattle('item');
            break;
        case 'item_select':
            if (ITEMS[actionData.itemKey].type === 'enchant') {
                 gameState.action = 'item_target';
                 renderBattle('item_target', actionData);
            } else {
                 useItem(actionData.itemKey, true);
            }
            break;
        case 'flee':
            gameState.isPlayerTurn = false;
            // Use new rollForEffect function, applying bonuses/penalties
            if (player.statusEffects.buff_voidwalker || player.rollForEffect(0.8, 'Flee')) { // Base 80% flee chance
                addToLog(`You successfully escaped!`, 'text-green-400');
                if (preTrainingState !== null) {
                    player.hp = preTrainingState.hp;
                    player.mp = preTrainingState.mp;
                    preTrainingState = null;
                    updateStatsView();
                    setTimeout(renderTrainingGrounds, 1000);
                } else {
                    setTimeout(renderTownSquare, 1000);
                }
            } else {
                addToLog(`You failed to escape!`, 'text-red-400');
                finalizePlayerAction(); // Go to next phase
            }
            break;

        // --- NEW CASE FOR SIGNATURE ABILITIES ---
        case 'signature_ability':
            const ability = player.signatureAbilityData;
            if (!ability) {
                console.error("Attempted to use signature ability but none found for class.");
                return;
            }

            if (ability.type === 'signature') {
                if (player.signatureAbilityUsed) {
                    addToLog(`${ability.name} has already been used this encounter!`, 'text-red-400');
                    return;
                }
                if (player.mp < ability.cost) {
                    addToLog(`Not enough MP to use ${ability.name}! (${ability.cost} required)`, 'text-blue-400');
                    return;
                }

                // --- Ranger: Hunter's Mark Activation ---
                if (player._classKey === 'ranger') {
                     addToLog("Select a target to mark.", 'text-yellow-400');
                     gameState.action = 'mark_target';
                     renderBattleGrid(true, 'mark'); // Highlight enemies for marking
                     // Don't deduct cost/use yet, do it in handleCellClick on successful mark
                     return; // Wait for target selection
                }


                // Deduct cost and mark used for other signature abilities
                player.mp -= ability.cost;
                player.signatureAbilityUsed = true;
                updateStatsView();
                addToLog(`You activate ${ability.name}!`, 'text-yellow-300 font-bold');

                // Apply specific effect (e.g., Barbarian Enrage)
                if (player._classKey === 'barbarian') {
                    player.statusEffects.buff_enrage = { duration: ability.duration }; // Duration from game_data
                    addToLog(`You fly into a rage! (+50% Phys Dmg, +50% Phys Dmg Taken)`, 'text-red-500');
                }
                // --- Artificer: Magic Drone ---
                else if (player._classKey === 'artificer') {
                    // 1. Create Drone
                    const drone = new Drone(player); // Pass player ref to drone
                    // 2. Find Spawn Cell
                    const potentialSpawns = [
                        {x: player.x+1, y: player.y}, {x: player.x-1, y: player.y},
                        {x: player.x, y: player.y+1}, {x: player.x, y: player.y-1}
                    ];
                    let spawnCell = null;
                    for(const cell of potentialSpawns) {
                        if (!isCellBlocked(cell.x, cell.y, false, false)) { // Check if cell is valid and not blocked (drone can't fly)
                            spawnCell = cell;
                            break;
                        }
                    }

                    if (spawnCell) {
                        drone.x = spawnCell.x;
                        drone.y = spawnCell.y;
                        gameState.activeDrone = drone; // Store drone instance
                        addToLog("A whirring drone materializes beside you!", "text-cyan-400");
                        renderBattleGrid(); // Update grid to show drone
                    } else {
                        addToLog("No space to summon the drone!", 'text-red-400');
                        // Refund cost/use
                        player.mp += ability.cost;
                        player.signatureAbilityUsed = false;
                        updateStatsView();
                        gameState.isPlayerTurn = true; // Give turn back
                        // setTimeout(beginPlayerTurn, 400); // Don't begin new turn, just allow action
                        isProcessingAction = false; // Unlock action
                        return; // Stop ability effect
                    }
                }
                // --- Cleric: Holy Blessings ---
                else if (player._classKey === 'cleric') {
                    if (!player.equippedCatalyst || player.equippedCatalyst.name === 'None') {
                        addToLog("You need a catalyst equipped to channel Holy Blessings!", 'text-red-400');
                        // Refund cost and usage since it failed
                        player.mp += ability.cost;
                        player.signatureAbilityUsed = false;
                        updateStatsView();
                        // Ability failed, player keeps turn
                        gameState.isPlayerTurn = true;
                        // setTimeout(beginPlayerTurn, 400); // Re-start player turn quickly
                        isProcessingAction = false; // Unlock action
                        return; // Stop further execution for this ability
                    }

                    // Calculate healing dice (scales with level, caps at 7)
                    const baseDice = 3;
                    let healDiceCount = Math.min(7, baseDice + Math.floor(player.level / 10)); // Example: +1 die every 10 levels


                    const healAmount = rollDice(healDiceCount, 8, 'Holy Blessings Heal').total;
                    player.hp = Math.min(player.maxHp, player.hp + healAmount);
                    addToLog(`Divine light washes over you, restoring <span class="font-bold text-green-400">${healAmount}</span> HP!`, 'text-yellow-200');

                    // Cleanse debuffs
                    const debuffs = Object.keys(player.statusEffects).filter(key => ['poison', 'paralyzed', 'petrified', 'drenched', 'toxic', 'slowed', 'inaccurate', 'clumsy', 'fumble', 'magic_dampen', 'elemental_vuln'].includes(key));
                    if (debuffs.length > 0) {
                        debuffs.forEach(key => delete player.statusEffects[key]);
                        addToLog(`The holy energy purges your ailments!`, 'text-cyan-300');
                    }
                    updateStatsView();
                }
                // --- Cook: On-Field Cooking ---
                else if (player._classKey === 'cook') {
                    // Call the UI rendering function from rendering.js
                    renderOnFieldCookingUI();
                    // Don't end the turn here; it ends after selection or cancellation in the UI function's callbacks
                    return; // Stop further execution in this switch case for Cook
                }
                // Add other signature ability effects here by checking player._classKey

                // Signature abilities typically end the turn (unless refunded or special like Cook/Ranger targeting)
                gameState.isPlayerTurn = false;
                finalizePlayerAction(); // Go to next phase

            } else if (ability.type === 'toggle') {
                 // Magus Mode Cycling
                 if (player._classKey === 'magus' && ability.modes) {
                     player.activeModeIndex++;
                     if (player.activeModeIndex >= ability.modes.length) {
                         player.activeModeIndex = -1; // Cycle back to Off
                     }
                     const currentModeName = player.activeModeIndex > -1 ? ability.modes[player.activeModeIndex] : "Off";
                     addToLog(`Arcane Manipulation mode set to: ${currentModeName}`, 'text-yellow-300');
                 }
                 // Paladin: Divine Smite Toggle
                 else if (player._classKey === 'paladin') {
                     if (!player.signatureAbilityToggleActive && (!player.equippedCatalyst || player.equippedCatalyst.name === 'None')) {
                         addToLog("Divine Smite requires a catalyst equipped to activate!", 'text-red-400');
                         return; // Prevent activation without catalyst
                     }
                     player.signatureAbilityToggleActive = !player.signatureAbilityToggleActive; // Standard toggle
                     addToLog(`${ability.name} ${player.signatureAbilityToggleActive ? 'activated!' : 'deactivated.'}`, 'text-yellow-300');
                 }
                 // Standard Toggle (Fighter, Warlock, Rogue)
                 else {
                     player.signatureAbilityToggleActive = !player.signatureAbilityToggleActive;
                     addToLog(`${ability.name} ${player.signatureAbilityToggleActive ? 'activated!' : 'deactivated.'}`, 'text-yellow-300');
                 }

                // Toggling usually doesn't cost a turn, just re-render actions
                renderBattleGrid(); // Re-render to update the button state
            }
            break;
        // --- END NEW CASE ---
    }
}


function struggleSwallow() {
    if (!player.statusEffects.swallowed) return;
    const swallower = player.statusEffects.swallowed.source;
    if (!swallower || !swallower.isAlive()) {
        delete player.statusEffects.swallowed;
        addToLog("Your captor has fallen! You crawl out, covered in... stuff.", 'text-green-400');
        renderBattleGrid();
         finalizePlayerAction(); // Finalize turn after escaping
        return;
    }

    // Calculate struggle damage (scales with player strength)
    const struggleDamage = rollDice(1, 6, 'Struggle').total + Math.floor(player.strength / 2);

    addToLog(`You struggle violently inside the beast!`, 'text-yellow-300');
    const finalDamage = swallower.takeDamage(struggleDamage, { ignore_defense: 0.5 }); // Bypasses 50% defense
    addToLog(`You dealt <span class="font-bold text-yellow-300">${finalDamage}</span> damage from the inside!`);

    // Check status immediately after dealing damage
    if (!gameState.battleEnded) {
         checkBattleStatus(true); // isReaction = true
    }

    // Check if the struggle killed the beast or battle ended
    if (gameState.battleEnded || !swallower.isAlive()) {
         delete player.statusEffects.swallowed;
         addToLog("You burst free from the fallen beast!", 'text-green-400 font-bold');
         // No need to call finalizePlayerAction here, checkBattleStatus handles end state
         isProcessingAction = false; // Unlock actions
    } else {
        // 20% chance to escape
        if (player.rollForEffect(0.2, 'Struggle Escape')) {
            delete player.statusEffects.swallowed;
            addToLog("You manage to squirm free!", 'text-green-300');
             finalizePlayerAction(); // Go to next phase
        } else {
            addToLog("You fail to escape!", 'text-red-400');
             finalizePlayerAction(); // Go to next phase
        }
    }

    gameState.isPlayerTurn = false;
}


function checkVictory() {
    if (gameState.battleEnded) return;
    if (currentEnemies.every(e => !e.isAlive())) {
        gameState.battleEnded = true;
        gameState.activeDrone = null; // Clear drone on victory
        gameState.markedTarget = null; // Clear mark on victory
        addToLog(`All enemies defeated!`, 'text-green-400 font-bold');

        // Handle tutorial battle end
        const isTutorialBattle = tutorialState.isActive && tutorialState.sequence[tutorialState.currentIndex]?.trigger?.type === 'enemy_death';
        if (isTutorialBattle) {
            // *** REVERTED CHANGE: Let the tutorial sequence handle the next step via advanceTutorial ***
            // The 'wait_for_goblin_death' trigger is met, so advance the tutorial sequence.
            // This will show the 'outro' modal defined in dialogue.js.
            // The modal's button will now call completeBattleTutorial().
            advanceTutorial(); // Let the tutorial system show the final modal
            return true; // Indicate victory occurred, tutorial handles next step
        }

        // Standard post-battle (if not tutorial)
        setTimeout(renderPostBattleMenu, 1000);
        return true; // Indicate victory occurred
    }
    return false; // Indicate no victory yet
}

function checkBattleStatus(isReaction = false) {
    if (gameState.battleEnded) return;

    const defeatedEnemiesThisCheck = [];

    // Iterate backwards because we might remove elements
    for (let i = currentEnemies.length - 1; i >= 0; i--) {
        const enemy = currentEnemies[i];

        // Check if HP is 0 or less
        if (enemy.hp <= 0) { // Explicitly check <= 0

            // --- Revival Logic ---
            let revived = false;
            if (enemy.speciesData.class === 'Undead' && !enemy.revived && enemy.ability !== 'alive_again') {
                addToLog(`${enemy.name} reforms from shattered bones!`, 'text-gray-400 font-bold');
                enemy.hp = Math.floor(enemy.maxHp * 0.5); // Restore HP
                enemy.revived = true; // Mark as revived once
                revived = true;
            } else if (enemy.ability === 'alive_again' && Math.random() < enemy.reviveChance) {
                addToLog(`${enemy.name} rises again!`, 'text-purple-600 font-bold');
                enemy.hp = Math.floor(enemy.maxHp * 0.5); // Restore HP
                enemy.reviveChance /= 2;
                revived = true;
            }
            // --- End Revival Logic ---

            // If not revived, mark for removal and processing
            if (!revived) {
                defeatedEnemiesThisCheck.push(enemy);
                // If the defeated enemy was the marked target, clear the mark state
                if (enemy === gameState.markedTarget) {
                    gameState.markedTarget = null;
                }
                currentEnemies.splice(i, 1); // Remove from the active list
            }
        }
    } // End loop through enemies

    // Process defeated enemies (XP, loot, quests)
    if (defeatedEnemiesThisCheck.length > 0) {
        defeatedEnemiesThisCheck.forEach(enemy => {
            addToLog(`You have defeated ${enemy.name}!`, 'text-green-400 font-bold');
            if (preTrainingState === null) {
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

                // Loot Drop Logic
                for (const item in enemy.lootTable) {
                    let dropChance = enemy.lootTable[item];
                    if (player.foodBuffs.loot_chance) dropChance *= player.foodBuffs.loot_chance.value;
                    const itemDetails = getItemDetails(item);

                    // --- DWARF: Craftsmen's Intuition (Loot) ---
                    if (player.race === 'Dwarf' && itemDetails && (WEAPONS[item] || ARMOR[item] || SHIELDS[item] || CATALYSTS[item])) {
                        dropChance *= 1.25; // 25% relative boost
                    }
                    // --- End Dwarf Logic ---

                    if (player.equippedWeapon.effect?.lootBonus && itemDetails && (itemDetails.class || ['Armor', 'Weapon'].includes(itemDetails.type))) {
                        dropChance *= 2;
                    }

                    // Use new rollForEffect function
                    if (player.rollForEffect(dropChance, 'Loot Drop')) {
                        player.addToInventory(item, 1, true);
                    }
                }

                if (player.activeQuest && player.activeQuest.category === 'extermination') {
                    const quest = getQuestDetails(player.activeQuest);
                    if (quest && quest.target === enemy.speciesData.key) {
                        player.questProgress++;
                        addToLog(`Quest progress: ${player.questProgress}/${quest.required}`, 'text-amber-300');
                    }
                }
            }
        });

        // After processing all deaths, check for victory
        if (checkVictory()) {
             isProcessingAction = false; // Ensure actions unlocked on victory
             return; // Stop further processing if victory occurred
        }
    }

    // MODIFIED: Removed the automatic call to handlePlayerEndOfTurn here.
    // It's now called by finalizePlayerAction after the *entire* player action sequence.
    // This function now *only* checks for enemy deaths and processes them.
}

// NEW: Helper function to finalize player action and transition turn
function finalizePlayerAction() {
    // This function is called after the main action AND any follow-ups are done.

    // First, double-check if the battle ended during the action/follow-ups
    if (gameState.battleEnded) {
        isProcessingAction = false; // Unlock actions
        return;
    }

    // Check if player died during their own action (e.g., Overdrive Tome)
    if (!player.isAlive()) {
        checkPlayerDeath();
        isProcessingAction = false; // Unlock actions
        return;
    }


    // Now, determine the next step based on Haste/Wind effects or standard flow
    const spellData = gameState.spellToCast ? SPELLS[gameState.spellToCast] : null;
    const playerSpell = gameState.spellToCast ? player.spells[gameState.spellToCast] : null;
    const tierIndex = playerSpell ? playerSpell.tier - 1 : -1;
    const windExtraTurnChance = (spellData && spellData.element === 'wind') ? 0.1 + (tierIndex * 0.05) : 0;

    // Check Haste first (takes priority over Wind spell)
    if (player.statusEffects.buff_haste || player.statusEffects.buff_hermes) {
        // Check if the Haste turn was already used (relevant if Wind spell also procced)
        const hasteUsed = player.statusEffects.buff_haste?.turnUsed || player.statusEffects.buff_hermes?.turnUsed;
        if (!hasteUsed) {
            if (player.statusEffects.buff_haste) player.statusEffects.buff_haste.turnUsed = true;
            if (player.statusEffects.buff_hermes) player.statusEffects.buff_hermes.turnUsed = true;
            addToLog("Your haste grants you another action!", "text-cyan-300");
            beginPlayerTurn(); // Start another player turn
        } else {
             // Haste was already used this 'logical' turn, proceed normally
             handlePlayerEndOfTurnEffects();
        }
    }
    // Check Wind spell extra turn (only if Haste isn't active or was already used)
    else if (windExtraTurnChance > 0 && player.rollForEffect(windExtraTurnChance, 'Spell Wind Turn')) {
        addToLog("The swirling winds grant you another turn!", "text-cyan-300 font-bold");
        beginPlayerTurn(); // Start another player turn
    }
    // Standard turn progression
    else {
        handlePlayerEndOfTurnEffects();
    }
}

// NEW: Separated end-of-turn effects from the turn transition logic
function handlePlayerEndOfTurnEffects() {
     if (gameState.battleEnded) return; // Re-check battle end

     // --- AASIMAR: Divine Regeneration ---
    if (player.race === 'Aasimar') {
        const healPercent = (player.level >= 20) ? 0.05 : 0.02; // 5% or 2%
        const healAmount = Math.floor(player.maxHp * healPercent);
        if (player.hp < player.maxHp && healAmount > 0) {
            player.hp = Math.min(player.maxHp, player.hp + healAmount);
            addToLog(`Your divine nature regenerates <span class="font-bold text-green-300">${healAmount}</span> HP.`, 'text-yellow-200');
        }
    }
    // --- End Aasimar Logic ---

    // Handle status effect durations and DoTs
    const effects = player.statusEffects;
    for (const effectKey in effects) {
        if (effects[effectKey].duration && effects[effectKey].duration !== Infinity) {
            effects[effectKey].duration--;
            if (effects[effectKey].duration <= 0) {
                delete effects[effectKey];
                // Make sure the effect name is reasonably user-friendly
                const effectName = effectKey.replace(/buff_|debuff_/g, '').replace(/_/g, ' ');
                addToLog(`Your ${effectName} has worn off.`);
            }
        }

        // Handle damage/effects over time
        if (effectKey === 'poison' && effects[effectKey]) {
            const poisonDmg = Math.floor(player.maxHp * 0.05);
            player.hp -= poisonDmg;
            addToLog(`You take <span class="font-bold text-green-600">${poisonDmg}</span> poison damage.`, 'text-green-600');
        }
        if (effectKey === 'toxic' && effects[effectKey]) {
            const toxicDmg = Math.floor(player.maxHp * 0.1);
            player.hp -= toxicDmg;
            addToLog(`The toxin deals <span class="font-bold text-green-800">${toxicDmg}</span> damage to you!`, 'text-green-800');
        }
        if (effectKey === 'swallowed' && effects[effectKey]) {
            const acidDmg = Math.floor(player.maxHp * 0.1);
            player.hp -= acidDmg;
            addToLog(`You take <span class="font-bold text-red-700">${acidDmg}</span> acid damage from the beast's stomach!`, 'text-red-700');
        }
    }

    updateStatsView();
    if (!player.isAlive()) {
        checkPlayerDeath();
        isProcessingAction = false; // Ensure unlock if player dies from DoT
        return;
    }

     // If drone exists and is alive, it's the drone's turn next
    if (gameState.activeDrone && gameState.activeDrone.isAlive()) {
        setTimeout(droneTurn, 400); // Add slight delay before drone turn
    } else {
        setTimeout(enemyTurn, 400); // Otherwise, proceed to enemy turn after delay
    }
}

// Renamed original handlePlayerEndOfTurn to avoid confusion
const handlePlayerEndOfTurn = handlePlayerEndOfTurnEffects;


// New function for Drone's turn
async function droneTurn() { // Made async for movement delay
    if (gameState.battleEnded || !gameState.activeDrone || !gameState.activeDrone.isAlive()) {
        setTimeout(enemyTurn, 400); // Drone died or doesn't exist, skip to enemy after delay
        return;
    }

    const drone = gameState.activeDrone;
    addToLog(`${drone.name}'s turn! (Range: ${drone.range})`, 'text-cyan-300'); // Log range

    // Simple Drone AI: Find nearest living enemy and attack if in range
    let nearestEnemy = null;
    let minDistance = Infinity;
    let enemyPath = null; // Store path to nearest enemy

    currentEnemies.forEach(enemy => {
        if (enemy.isAlive()) {
            const distance = Math.abs(drone.x - enemy.x) + Math.abs(drone.y - enemy.y);
            // Check if path exists before selecting
            const path = findPath({x: drone.x, y: drone.y}, {x: enemy.x, y: enemy.y}); // Drone probably can't fly
            if (path && distance < minDistance) { // Check path exists and distance is less
                minDistance = distance;
                nearestEnemy = enemy;
                enemyPath = path; // Store the path
            }
        }
    });


    if (nearestEnemy) {
        let currentDistance = Math.abs(drone.x - nearestEnemy.x) + Math.abs(drone.y - nearestEnemy.y);

        // Move if out of range and path exists
        if (currentDistance > drone.range && enemyPath && enemyPath.length > 1) {
            addToLog(`${drone.name} moves towards ${nearestEnemy.name}.`);
            const stepsToTake = Math.min(enemyPath.length - 1, drone.movementSpeed); // Use drone's speed
            for (let i = 1; i <= stepsToTake; i++) {
                const nextStep = enemyPath[i];
                // Double check blockage right before moving (e.g., if another enemy moved)
                if (isCellBlocked(nextStep.x, nextStep.y, false, false)) { // Assuming drone cannot fly
                    addToLog(`${drone.name} encounters an obstacle and stops.`);
                    break;
                }
                drone.x = nextStep.x;
                drone.y = nextStep.y;
                renderBattleGrid(); // Update grid visually
                // MODIFIED: Increased delay from 150 to 300
                await new Promise(resolve => setTimeout(resolve, 300)); // Movement delay
                currentDistance = Math.abs(drone.x - nearestEnemy.x) + Math.abs(drone.y - nearestEnemy.y);
                if (currentDistance <= drone.range) {
                    break; // Stop moving if now in range
                }
            }
        }

        // Attack if now in range
        if (currentDistance <= drone.range) {
            drone.attack(nearestEnemy);
             // Check if drone attack ended the battle
             if (!gameState.battleEnded) checkBattleStatus(true); // isReaction = true
             if (gameState.battleEnded) return; // Stop if battle ended
        } else {
             addToLog(`${drone.name} cannot reach ${nearestEnemy.name}.`);
        }
    } else {
        addToLog(`${drone.name} finds no targets.`);
    }

    // Proceed to enemy turn AFTER drone acts (and after potential delay)
    if (!gameState.battleEnded) {
         setTimeout(enemyTurn, 400);
    }
}


function handleEnemyEndOfTurn(enemy) {
    if (gameState.battleEnded) return;

    const effects = enemy.statusEffects;
    for (const effectKey in effects) {
        if (effects[effectKey].duration && effects[effectKey].duration !== Infinity) {
            effects[effectKey].duration--;
            if (effects[effectKey].duration <= 0) {
                delete effects[effectKey];
            }
        }

        if (effectKey === 'poison' && effects[effectKey]) {
            const poisonDmg = Math.floor(enemy.maxHp * 0.05);
            enemy.hp -= poisonDmg;
            addToLog(`${enemy.name} takes <span class="font-bold text-green-600">${poisonDmg}</span> poison damage.`, 'text-green-600');
        }
        if (effectKey === 'toxic' && effects[effectKey]) {
            const toxicDmg = Math.floor(enemy.maxHp * 0.1);
            enemy.hp -= toxicDmg;
            addToLog(`${enemy.name} takes <span class="font-bold text-green-800">${toxicDmg}</span> damage from the toxin!`, 'text-green-800');
        }
    }
}

async function enemyTurn() {
    if (gameState.battleEnded) return;

    for (const enemy of currentEnemies) {
        if (enemy.isAlive() && !gameState.battleEnded) {
            // Check for paralysis/petrification
            if (enemy.statusEffects.paralyzed || enemy.statusEffects.petrified) {
                const status = enemy.statusEffects.paralyzed ? 'paralyzed' : 'petrified';
                addToLog(`${enemy.name} is ${status} and cannot act!`, 'text-yellow-500');
            } else {
                 // Check if player is swallowed by *this* enemy
                if (player.statusEffects.swallowed && player.statusEffects.swallowed.source === enemy) {
                    addToLog(`${enemy.name} is busy... digesting.`, 'text-red-600');
                    // Enemy might still perform a "digest" attack
                    enemy._performAttack(player); // This will trigger the 2x damage
                } else {
                    // Standard attack logic
                    await enemy.attack(player);
                }
            }

            // Check if player died from the attack
            if (!player.isAlive()) {
                checkPlayerDeath();
                return; // Stop the turn sequence
            }

            // Handle end-of-turn effects for this enemy
            handleEnemyEndOfTurn(enemy);

            // Check if the enemy died from DoT effects
            if (!enemy.isAlive()) {
                 if (!gameState.battleEnded) checkBattleStatus(true); // Check for deaths (isReaction = true)
                if (gameState.battleEnded) return; // Stop if this was the last enemy
            }

            // Only add delay if battle isn't over
            if (!gameState.battleEnded) {
                 await new Promise(resolve => setTimeout(resolve, 500)); // Delay between enemy actions
            }
        }
    }

    // After all enemies have acted
    if (!gameState.battleEnded) {
        beginPlayerTurn();
    }
}

function beginPlayerTurn() {
    if (gameState.battleEnded) return;

    gameState.isPlayerTurn = true;
    isProcessingAction = false; // Unlock actions for the player

    // Clear Haste's "used" flag
    if (player.statusEffects.buff_haste?.turnUsed) player.statusEffects.buff_haste.turnUsed = false;
    if (player.statusEffects.buff_hermes?.turnUsed) player.statusEffects.buff_hermes.turnUsed = false;

    // Check for paralysis/petrification at the start of the turn
    if (player.statusEffects.paralyzed || player.statusEffects.petrified) {
         const status = player.statusEffects.paralyzed ? 'paralyzed' : 'petrified';
        addToLog(`You are ${status} and cannot act!`, 'text-red-500 font-bold');
        gameState.isPlayerTurn = false; // Immediately end turn
        finalizePlayerAction(); // Process end-of-turn (which will check for Haste/Drone/Enemy)
    } else if (player.statusEffects.swallowed) {
        addToLog("You are trapped inside the beast! You can only struggle!", "text-red-600 font-bold");
        renderBattleGrid(); // Re-render to show only the "Struggle" button
    }
    else {
        addToLog("Your turn!", 'text-blue-300 font-bold');
        renderBattleGrid();
    }
}


async function checkPlayerDeath() {
    if (player.isAlive() || gameState.playerIsDying) return;

    // First, check for any revive effects
    if(player.equippedWeapon.effect?.revive && !player.specialWeaponStates.void_greatsword_revive_used) {
        player.hp = Math.floor(player.maxHp * 0.5);
        player.specialWeaponStates.void_greatsword_revive_used = true;
        addToLog('The Void Greatsword flashes with dark energy, pulling your soul back from the brink!', 'text-purple-400 font-bold');
        updateStatsView();
        return; // Player is revived, death is averted
    }

    gameState.playerIsDying = true;
    gameState.activeDrone = null; // Clear drone on death
    gameState.markedTarget = null; // Clear mark on death
    const killer = currentEnemies.length > 0 ? currentEnemies[0].name : 'the wilderness';
    const template = document.getElementById('template-death');
    render(template.content.cloneNode(true));
    addToLog(`You were defeated by ${killer}...`, 'text-red-600 font-bold');

    switch (player.difficulty) {
        case 'easy':
            addToLog('You pass out from your injuries...', 'text-gray-400');
            setTimeout(() => {
                addToLog('You awaken in a bed at the inn, fully restored.', 'text-green-400');
                restAtInn(0); // Respawn by resting for free
                gameState.playerIsDying = false;
            }, 3000);
            break;

        case 'medium':
            addToLog('You collapse, your belongings scattering...', 'text-orange-400');

            // Lose half gold
            const goldLost = Math.floor(player.gold / 2);
            player.gold -= goldLost;
            addToLog(`You lost <span class="font-bold">${goldLost}</span> G.`, 'text-red-500');

            // Lose half items and equipment
            let itemsDropped = 0;
            for (const itemKey in player.inventory.items) {
                const amount = player.inventory.items[itemKey];
                const amountToDrop = Math.floor(amount / 2);
                if (amountToDrop > 0) {
                    player.inventory.items[itemKey] -= amountToDrop;
                    if (player.inventory.items[itemKey] <= 0) {
                        delete player.inventory.items[itemKey];
                    }
                    itemsDropped++;
                }
            }

            ['weapons', 'armor', 'shields', 'catalysts'].forEach(category => {
                const items = player.inventory[category];
                if (!Array.isArray(items)) return; // Safety check
                const amountToDrop = Math.floor(items.length / 2);
                for (let i = 0; i < amountToDrop; i++) {
                    const randomIndex = Math.floor(Math.random() * items.length);
                    // Ensure we don't drop the default "None" items
                    const itemDetails = getItemDetails(items[randomIndex]);
                    if (itemDetails && itemDetails.rarity !== 'Broken') {
                        items.splice(randomIndex, 1);
                        itemsDropped++;
                    }
                }
            });

            if (itemsDropped > 0) {
                addToLog('You lost some of your items and equipment in the fall.', 'text-red-500');
            }

            setTimeout(() => {
                addToLog('You awaken at the inn, sore but alive.', 'text-yellow-300');
                restAtInn(0); // Respawn by resting for free
                gameState.playerIsDying = false;
            }, 3000);
            break;

        case 'hardcore':
        default:
            addToLog('Your journey ends here.', 'text-gray-500');
            await addToGraveyard(player, killer);
            await deleteSave(player.firestoreId || 'local');
            addToLog('Your legacy has been recorded in the Graveyard. Your save file has been deleted.', 'text-gray-500');

            setTimeout(() => {
                signOutUser();
            }, 4000);
            break;
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

// Function to handle Cook's ability activation
function executeOnFieldCooking(recipeKey) {
     // Check if ability has already been used (prevent double use if UI lags)
     // Check if player object exists and is a cook before proceeding
     if (!player || player._classKey !== 'cook' || player.signatureAbilityUsed === true) {
         addToLog("Cannot cook right now.", "text-red-400");
         renderBattleGrid(); // Return to main actions
         return;
     }

    const recipeData = COOKING_RECIPES[recipeKey];
    if (!recipeData) {
        addToLog("Invalid recipe selected.", "text-red-400");
        renderBattleGrid(); // Go back to main actions
        // Turn ends even on invalid selection
        gameState.isPlayerTurn = false;
        finalizePlayerAction();
        return;
    }

    // Mark ability as used *before* checking costs
    player.signatureAbilityUsed = true;


    // --- Check ingredients / Calculate MP Cost ---
    const required = recipeData.ingredients;
    const availableIngredients = { meat: [], veggie: [], seasoning: [] };
    Object.keys(player.inventory.items).forEach(itemKey => {
        const details = getItemDetails(itemKey);
        if (details && details.cookingType) {
            const count = player.inventory.items[itemKey];
            if(count > 0) {
                for (let i = 0; i < count; i++) {
                    availableIngredients[details.cookingType].push({ key: itemKey, price: details.price, rarity: details.rarity || 'Common' }); // Added default rarity
                }
            }
        }
    });
    for(const type in availableIngredients) availableIngredients[type].sort((a,b) => a.price - b.price);

    const ingredientsToConsume = {};
    let mpCost = 0;
    let canCook = true;
    const mpCosts = { 'Common': 5, 'Uncommon': 10, 'Rare': 15, 'Epic': 20, 'Legendary': 25, 'Broken': 0 }; // Added more rarities + Broken

    for (const reqKey in required) {
        const requiredAmount = required[reqKey];
        let itemsUsedCount = 0; // Track items *found* for this ingredient type
        const isGeneric = ['meat', 'veggie', 'seasoning'].includes(reqKey);

        if (isGeneric) {
            // Count how many we *can* use from available generics
            const availableCount = availableIngredients[reqKey].length;
            itemsUsedCount = Math.min(availableCount, requiredAmount);

            // Mark the ones we will consume
            for(let i = 0; i < itemsUsedCount; i++) {
                const itemToUse = availableIngredients[reqKey][i].key;
                ingredientsToConsume[itemToUse] = (ingredientsToConsume[itemToUse] || 0) + 1;
            }

            // Calculate MP cost for the *missing* amount
            const missingAmount = requiredAmount - itemsUsedCount;
            if (missingAmount > 0) {
                 mpCost += missingAmount * mpCosts['Common']; // Assume Common for generics
            }

        } else { // Specific ingredient
            const currentAmount = player.inventory.items[reqKey] || 0;
            itemsUsedCount = Math.min(currentAmount, requiredAmount);

            if (itemsUsedCount > 0) {
                 ingredientsToConsume[reqKey] = (ingredientsToConsume[reqKey] || 0) + itemsUsedCount;
            }
            // Add MP cost for missing specific ingredients
            const missingAmount = requiredAmount - itemsUsedCount;
            if (missingAmount > 0) {
                const details = getItemDetails(reqKey);
                const rarityCost = mpCosts[details?.rarity || 'Common'] || mpCosts['Common'];
                mpCost += missingAmount * rarityCost;
            }
        }
    }


    if (player.mp < mpCost) {
        addToLog(`Not enough MP (${mpCost}) to substitute missing ingredients! Cooking failed.`, 'text-blue-400');
        canCook = false;
        // REFUND ability use since it failed due to MP cost
        player.signatureAbilityUsed = false;
        renderBattleGrid(); // Go back to main battle actions
        gameState.isPlayerTurn = true; // Give turn back
        // beginPlayerTurn(); // Don't begin new turn, just allow action
        isProcessingAction = false; // Unlock actions
        return;
    }

    // --- Consume Resources & Apply Effects ---
    if (canCook) {
        player.mp -= mpCost;
        if (mpCost > 0) addToLog(`Substituted missing ingredients for ${mpCost} MP.`, 'text-blue-300');

        for (const itemKey in ingredientsToConsume) {
             if (player.inventory.items[itemKey]) { // Check if item exists before decrementing
                player.inventory.items[itemKey] -= ingredientsToConsume[itemKey];
                if (player.inventory.items[itemKey] <= 0) {
                    delete player.inventory.items[itemKey];
                }
            } else {
                 console.warn(`Attempted to consume ${itemKey} during cooking, but it was not found in inventory.`);
            }
        }

        player.clearFoodBuffs(); // Clear old buffs

        const effect = recipeData.effect;
        if (effect.heal) player.hp = Math.min(player.maxHp, player.hp + effect.heal);

        switch (effect.type) {
            case 'full_restore':
                player.hp = player.maxHp; player.mp = player.maxMp;
                break;
            case 'heal_percent':
                player.hp = Math.min(player.maxHp, player.hp + Math.floor(player.maxHp * effect.heal_percent));
                break;
            case 'mana_percent':
                player.mp = Math.min(player.maxMp, player.mp + Math.floor(player.maxMp * effect.mana_percent));
                break;
            case 'buff':
                effect.buffs.forEach(buff => {
                    // Ensure duration is 3 encounters for On-Field Cooking
                    player.foodBuffs[buff.stat] = { value: buff.value, duration: 3 };
                });
                // Re-apply Max HP/MP buffs
                player.hp = Math.min(player.hp, player.maxHp);
                player.mp = Math.min(player.mp, player.maxMp);
                break;
        }

        addToLog(`You quickly cook and eat ${recipeData.name}!`, "text-green-400 font-bold");
        updateStatsView();

        // End the turn
        gameState.isPlayerTurn = false;
        finalizePlayerAction();
    } else {
         // Should not be reachable if MP check works, but as a fallback:
         addToLog("Could not cook the recipe.", "text-red-400");
         // REFUND ability use if canCook became false for other reasons (e.g. ingredient check logic error)
         player.signatureAbilityUsed = false;
         renderBattleGrid();
         gameState.isPlayerTurn = true;
         // beginPlayerTurn(); // Don't begin new turn
         isProcessingAction = false; // Unlock actions
    }
}

