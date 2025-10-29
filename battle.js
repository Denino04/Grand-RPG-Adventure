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
    // --- Disable buttons on battle start ---
    $('#inventory-btn').disabled = false;
    $('#character-sheet-btn').disabled = false;
    // --- END MODIFICATION ---
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
        // ... (rest of tutorial setup remains the same) ...
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
        // ... (rest of training setup remains the same) ...
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
        // ... (rest of standard setup remains the same) ...
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

    lastViewBeforeInventory = 'battle'; // Set return view from inventory opened in battle
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

/**
 * Handles returning to the battle screen after closing the inventory mid-battle.
 * Does NOT advance the turn.
 */
function returnToBattleFromInventory() {
    gameState.currentView = 'battle'; // Set view back to battle
    const turnWasConsumed = !gameState.isPlayerTurn; // Check BEFORE resetting flags or rendering

    // Always unlock actions when returning from inventory screen
    isProcessingAction = false;

    if (turnWasConsumed) {
        console.log("Turn was consumed by equipping gear. Finalizing action.");
        // Render the grid to show updated gear, potentially without player actions yet
        renderBattleGrid();
        // Crucially, call finalizePlayerAction AFTER rendering the grid update
        // Use a small timeout to ensure the render completes before the enemy potentially acts instantly
        setTimeout(finalizePlayerAction, 50); // Advance turn state (enemy turn, status effects etc.)
    } else {
        console.log("Returned from inventory without consuming turn.");
        // If turn wasn't consumed, the player can still act.
        gameState.action = null; // Reset any potential pending action from before inventory opened
        renderBattleGrid(); // Re-render the battle grid WITH player action buttons
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
        // Apply Magic Rock Dust range bonus for highlighting
        if (player.statusEffects.buff_magic_dust && player.statusEffects.buff_magic_dust.rangeIncrease) {
             spellRange += player.statusEffects.buff_magic_dust.rangeIncrease;
        }
    }

    // --- NEW: Item details for highlighting ---
    const itemData = gameState.itemToUse ? ITEMS[gameState.itemToUse] : null;
    let itemRange = itemData?.range || 0; // Default to 0 range if not specified

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
                                 // Highlight splash targets if AOE (handled later after all cells exist)
                                 // We mark the primary targets now
                             }
                         }
                     }
                     // Mark Targeting (Ranger)
                     else if (gameState.action === 'mark_target' && highlightType === 'mark') {
                          if (enemy && enemy.isAlive()) { // Can mark any living enemy
                              cell.classList.add('attackable'); // Use attackable highlight for marking
                          }
                     }
                     // --- NEW: Item Targeting ---
                     else if (gameState.action === 'item_target' && highlightType === 'item' && itemData && itemRange > 0) {
                         const dx = Math.abs(player.x - x);
                         const dy = Math.abs(player.y - y);
                         if (dx + dy <= itemRange) {
                             if (enemy && enemy.isAlive()) { // Only highlight living enemies
                                 cell.classList.add('item-attackable'); // Use the new class
                             }
                         }
                     }
                     // --- END NEW ---
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
        // ... existing move code ...
        // This part remains unchanged.
        isProcessingAction = true; // Lock actions
        cells.forEach(c => c.classList.remove('walkable', 'attackable', 'magic-attackable', 'splash-targetable', 'item-attackable')); // Clear item highlight too
        movePlayer(x, y);
    } else if (gameState.action === 'attack') {
        // ... existing attack code ...
        // This part remains unchanged.
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
             cells.forEach(c => c.classList.remove('walkable', 'attackable', 'magic-attackable', 'splash-targetable', 'item-attackable')); // Clear item highlight too
             isProcessingAction = false; // Unlock actions
             renderBattleGrid(); // Re-render actions to show default buttons
        }
    } else if (gameState.action === 'magic_cast') {
        // ... existing magic code ...
        // This part remains unchanged.
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
            cells.forEach(c => c.classList.remove('walkable', 'attackable', 'magic-attackable', 'splash-targetable', 'item-attackable')); // Clear item highlight too
            isProcessingAction = false; // Unlock actions
            // Re-render actions to show default buttons
            renderBattleGrid();
        }
    // --- MODIFIED: Handle item targeting via grid click ---
    } else if (gameState.action === 'item_target') {
        isProcessingAction = true; // Lock actions
        // Clear highlights immediately after click attempt
        cells.forEach(c => c.classList.remove('walkable', 'attackable', 'magic-attackable', 'splash-targetable', 'item-attackable'));
        if (clickedEnemy && clickedEnemy.isAlive()) { // Ensure target is alive
            const targetIndex = currentEnemies.indexOf(clickedEnemy);
            const itemKey = gameState.itemToUse; // Store key before clearing state
            gameState.action = null; // Clear action state
            gameState.itemToUse = null; // Clear stored item key
            // Call useItem with the stored item key and target index
            useItem(itemKey, true, targetIndex);
            // useItem should handle finalizing the action
        } else {
            // If we are flying, we can't click an empty ground/terrain cell to cancel
            if (isFlying && gameState.gridObjects.some(o => o.x === x && o.y === y && o.type === 'terrain')) {
                 isProcessingAction = false; // Keep action active
                 // Re-highlight targets if cancellation failed due to flying over terrain
                 renderBattleGrid(true, 'item');
                 return;
             }
            // Cancel item use if clicking somewhere invalid (e.g., empty cell)
            gameState.action = null;
            gameState.itemToUse = null; // Clear selected item
            isProcessingAction = false; // Unlock actions
            renderBattleGrid(); // Re-render actions to show default buttons
            addToLog("Item use cancelled.", "text-gray-400"); // Add feedback
            // Turn does NOT end on cancellation, player can choose another action
            gameState.isPlayerTurn = true;
        }
    // --- END MODIFICATION ---
    } else if (gameState.action === 'mark_target') { // Ranger Mark Target
         // ... existing mark target code ...
         // This part remains unchanged.
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
             cells.forEach(c => c.classList.remove('walkable', 'attackable', 'magic-attackable', 'splash-targetable', 'item-attackable')); // Clear highlights
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
            await new Promise(resolve => setTimeout(resolve, 150)); // Delay between steps
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
    const performSingleAttack = async (attackTarget, isSecondStrike = false) => { // Made async
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
        // *** MODIFICATION: Store return value from takeDamage ***
        const damageResult = attackTarget.takeDamage(damage, attackEffects);
        const finalDamage = damageResult.damageDealt; // Get actual damage dealt
        const knockbackAmountFromAttack = damageResult.knockback; // Get knockback triggered by this hit (e.g., from Lightstone debuff)

        calcLog.finalDamage = finalDamage;
        logDamageCalculation(calcLog);

        let damageType = weapon.damageType || 'physical';
        if (attackEffects.element && attackEffects.element !== 'none') {
            damageType = ELEMENTS[attackEffects.element].name;
        }
        // Append messageLog content here if needed, or integrate messages earlier
        let logMessagesCombined = messageLog.join(' '); // Combine messages collected so far
        addToLog(`You attack ${attackTarget.name} with ${weapon.name}, dealing <span class="font-bold text-yellow-300">${finalDamage}</span> ${damageType} damage. ${logMessagesCombined}`);


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

        // Apply greases if damage dealt
        if (finalDamage > 0) {
            // Poison Grease
            if (player.statusEffects.buff_poison_grease && !isSecondStrike) {
                const poisonChance = player.statusEffects.buff_poison_grease.poisonChance + (player.luck / 200);
                if (player.rollForEffect(poisonChance, 'Poison Grease Proc')) {
                    const avgWeaponDamage = (weapon.damage[0] * (1 + weapon.damage[1])) / 2;
                    const poisonDamage = Math.max(1, Math.floor(avgWeaponDamage / 4));
                    attackTarget.statusEffects.poison = { duration: 4, damage: poisonDamage };
                    addToLog(`Poisonous grease coats ${attackTarget.name}!`); // Moved log here
                }
            }
            // Paralysis Grease
            if (player.statusEffects.buff_paralysis_grease && !isSecondStrike) {
                const paralyzeChance = player.statusEffects.buff_paralysis_grease.paralyzeChance + (player.luck / 200);
                if (player.rollForEffect(paralyzeChance, 'Paralysis Grease Proc') && !attackTarget.statusEffects.paralyzed) {
                    attackTarget.statusEffects.paralyzed = { duration: 2 };
                    addToLog(`${attackTarget.name} is paralyzed by the grease!`); // Moved log here
                }
            }
        }
        // --- END Grease Effects ---

        // Pocket Cragblade
        if (player.statusEffects.buff_cragblade && attackEffects.element === 'earth' && !isSecondStrike && finalDamage > 0) {
            // Note: Damage multiplier is handled pre-defense in takeDamage. Log confirms effect.
            addToLog(`Pocket Cragblade empowers the strike!`);

            // Guaranteed Paralyze (if not already paralyzed)
            if (!attackTarget.statusEffects.paralyzed) {
                attackTarget.statusEffects.paralyzed = { duration: 2 };
                addToLog(`${attackTarget.name} is paralyzed by the Cragblade's force!`);
            }
            delete player.statusEffects.buff_cragblade; // Consume buff
        }
        // --- REMOVED: Artificial Light Stone Buff Check ---

        // Lightning Rod Chain
        if (player.statusEffects.buff_lightning_rod && !isSecondStrike && finalDamage > 0) {
             const rodEffect = player.statusEffects.buff_lightning_rod;
             const potentialTargets = currentEnemies.filter(e =>
                 e.isAlive() &&
                 e !== attackTarget &&
                 (Math.abs(player.x - e.x) + Math.abs(player.y - e.y) <= weaponRange)
             );

             if (potentialTargets.length > 0) {
                 const chainTarget = potentialTargets[Math.floor(Math.random() * potentialTargets.length)];
                 const chainDamage = Math.max(1, Math.floor(finalDamage * rodEffect.chainMultiplier));
                 const finalChainDamage = chainTarget.takeDamage(chainDamage, { isMagic: true, element: 'lightning' });
                 addToLog(`Lightning Rod arcs to ${chainTarget.name} for ${finalChainDamage}!`); // Moved log here
                 // Check if chain killed immediately
                  if (!chainTarget.isAlive()) {
                        setTimeout(() => { if (!gameState.battleEnded) checkBattleStatus(true); }, 100);
                  }
             }
        }
        // --- END Lightning Rod Chain ---

        // --- NEW: Apply Knockback if triggered by the attack itself ---
        if (knockbackAmountFromAttack > 0 && attackTarget.isAlive()) {
             await applyKnockback(attackTarget, player, knockbackAmountFromAttack); // Use await here
             // Re-check target alive *after* knockback
             if (!attackTarget.isAlive()) {
                  if (!gameState.battleEnded) checkBattleStatus(true);
                  return; // Stop if knockback caused death
             }
        }
        // --- END Knockback Application ---


        // Lifesteal
        if (finalDamage > 0) { // Only apply lifesteal if damage was dealt
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
        }

        // Hammer paralysis chance & Other on-hit effects (Toxic, Petrify, Cleanse)
        // ... (Keep existing logic, ensure rollForEffect is used) ...
        // Hammer paralysis chance
        let paralyzeBaseChance = 0;
        if (weapon.class === 'Hammer') paralyzeBaseChance += 0.1;
        if (weapon.effect?.paralyzeChance) paralyzeBaseChance += weapon.effect.paralyzeChance;
        if (player.rollForEffect(paralyzeBaseChance, 'Hammer Paralyze') && finalDamage > 0 && !attackTarget.statusEffects.paralyzed) { // Check damage dealt and not already paralyzed
            attackTarget.statusEffects.paralyzed = { duration: 2 };
            addToLog(`${attackTarget.name} is stunned by the blow!`, 'text-yellow-500');
        }

        // Other on-hit effects (only if damage dealt)
        if(finalDamage > 0){
            const toxicChance = weapon.effect?.toxicChance || 0;
            if (player.rollForEffect(toxicChance, 'Weapon Toxic')) {
                attackTarget.statusEffects.toxic = { duration: 4 }; // Duration is 3 turns after this one
                addToLog(`${attackTarget.name} is afflicted with a deadly toxin!`, 'text-green-700');
            }

            const petrifyChance = weapon.effect?.petrifyChance || 0;
            if(player.rollForEffect(petrifyChance, 'Weapon Petrify') && !attackTarget.statusEffects.petrified) { // Check not already petrified
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
        }


        // Check Battle Status only once after all effects of this single hit are resolved
         if (!gameState.battleEnded) {
             // Only call if knockback didn't already trigger a check or if knockback didn't happen
             if (knockbackAmountFromAttack === 0 || attackTarget.isAlive()) {
                 checkBattleStatus(isSecondStrike); // Pass isSecondStrike as isReaction
             }
         }
    };
    // --- End performSingleAttack function ---


    // --- MODIFICATION: Make the attack sequence async ---
    (async () => {
        // Perform the first attack
        await performSingleAttack(target, false); // Use await

        // Check if the first attack ended the battle before proceeding
        if (gameState.battleEnded) {
            isProcessingAction = false;
            return;
        }

        // --- MODIFIED: Handle Follow-ups with delays using async/await ---
        const handleFollowUps = async () => {
            if (gameState.battleEnded || !target.isAlive()) {
                 finalizePlayerAction();
                 return;
            }

            // Shield Follow-up Check
            if (player.equippedShield.effect?.attack_follow_up) {
                await new Promise(resolve => setTimeout(resolve, 250));
                if (gameState.battleEnded || !target.isAlive()) { finalizePlayerAction(); return; }
                performShieldFollowUpAttack(target); // This calls checkBattleStatus(true)
                if (gameState.battleEnded || !target.isAlive()) { finalizePlayerAction(); return; }
            }

            // Second Weapon Strike Check
            const needsSecondAttack = (weapon.class === 'Hand-to-Hand' || weapon.effect?.doubleStrike);
            const procSecondAttack = weapon.effect?.doubleStrikeChance && player.rollForEffect(weapon.effect.doubleStrikeChance, 'Weapon Double Strike');
            if (needsSecondAttack || procSecondAttack) {
                await new Promise(resolve => setTimeout(resolve, 250));
                if (gameState.battleEnded || !target.isAlive()) { finalizePlayerAction(); return; }
                addToLog("You strike again!", "text-yellow-300");
                await performSingleAttack(target, true); // This calls checkBattleStatus(true)
            }

            finalizePlayerAction(); // Finalize after all checks/attacks
        };

        await handleFollowUps(); // Execute the follow-up logic

    })(); // Immediately invoke the async function

} // End performAttack

async function castSpell(spellKey, targetIndex) { // Make async
    const spellData = SPELLS[spellKey];
    const target = currentEnemies[targetIndex];
    if ((spellData.type === 'st' || spellData.type === 'aoe') && (!target || !target.isAlive())) {
        isProcessingAction = false; // Unlock if target is invalid
        renderBattleGrid();
        return;
    }

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

    if (player.statusEffects.buff_magic_dust && player.statusEffects.buff_magic_dust.rangeIncrease) {
        spellRange += player.statusEffects.buff_magic_dust.rangeIncrease;
        addToLog("Magic Rock Dust extends your reach!", 'text-yellow-300');
        // Buff will be removed after successful cast
    }
    // --- END ADDED ---

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
    let primaryTargetKnockback = 0; // Initialize knockback for spell

    // --- ADDED: Consume Magic Rock Dust *before* applying effects ---
    let usedMagicDust = false;
    if (player.statusEffects.buff_magic_dust) {
        usedMagicDust = true; // Mark as used for this cast
        delete player.statusEffects.buff_magic_dust; // Remove the buff
    }
    // --- END ADDED ---

    // Handle Healing and Support spells
    if (spellData.type === 'healing' || spellData.type === 'support') {
        // ... [Existing healing/support logic - unchanged, including Fertilized Seed check] ...
         if (spellData.type === 'healing') {
            let diceCount = spell.damage[0];
            const spellAmp = catalyst.effect?.spell_amp || 0;
            diceCount = Math.min(spell.cap, diceCount + spellAmp);

            let healAmount = rollDice(diceCount, spell.damage[1], `Healing Spell: ${spell.name}`).total + player.magicalDamageBonus;

            if (player.statusEffects.buff_fertilized && spellData.element === 'nature') {
                const healMultiplier = player.statusEffects.buff_fertilized.healMultiplier;
                healAmount = Math.floor(healAmount * healMultiplier);
                addToLog("The Fertilized Seed enhances the healing!", "text-green-200");
            }
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
        let diceCount = spell.damage[0];
        const spellAmp = catalyst.effect?.spell_amp || 0;
        diceCount = Math.min(spell.cap, diceCount + spellAmp);

        // --- ADDED: Magic Rock Dust Dice Step Up ---
        let spellDamageDice = [...spell.damage]; // [numDice, sides] - Copy original dice
        if (usedMagicDust) { // Check if dust was consumed for this cast
            const originalSides = spellDamageDice[1];
             switch (originalSides) {
                 case 2: spellDamageDice[1] = 4; break;
                 case 3: spellDamageDice[1] = 4; break;
                 case 4: spellDamageDice[1] = 6; break;
                 case 6: spellDamageDice[1] = 8; break;
                 case 8: spellDamageDice[1] = 10; break;
                 case 10: spellDamageDice[1] = 12; break;
                 // d12 stays d12
             }
             if (spellDamageDice[1] !== originalSides) {
                 addToLog(`Magic Rock Dust sharpens the spell! (d${originalSides} -> d${spellDamageDice[1]})`);
             }
        }
        // Use the potentially modified dice for the roll
        let damage = rollDice(diceCount, spellDamageDice[1], `Player Spell: ${spell.name}`).total + player.magicalDamageBonus;
        // --- END ADDED ---


        // --- ELEMENTAL/DRAGONBORN DAMAGE BONUSES ---
        if (player.race === 'Elementals' && spellData.element === player.elementalAffinity) {
            const damageBonus = (player.level >= 20) ? 1.20 : 1.10;
            damage = Math.floor(damage * damageBonus);
            if (player.level >= 20) {
                // Use the potentially modified dice size for the extra die too
                let extraDieRoll = rollDice(1, spellDamageDice[1], 'Elemental Evo Die').total;
                let cappedExtraDamage = Math.min( (spell.cap * spellDamageDice[1]) - damage, extraDieRoll); // Cap extra die damage based on modified dice
                damage += cappedExtraDamage;
            }
        } else if (player.race === 'Dragonborn') {
            const damageBonus = (player.level >= 20) ? 1.20 : 1.10;
            damage = Math.floor(damage * damageBonus);
        }

        // --- SPELL CRIT ---
        let spellCritChance = player.critChance + (catalyst.effect?.spell_crit_chance || 0);
        if (player._classKey === 'warlock' && player.signatureAbilityToggleActive && catalyst.effect?.spell_crit_chance) {
             spellCritChance += (catalyst.effect.spell_crit_chance * 0.5);
        }
        if(player.statusEffects.bonus_crit) spellCritChance += player.statusEffects.bonus_crit.critChance;
        if (player.statusEffects.buff_shroud || player.statusEffects.buff_voidwalker) spellCritChance *= 1.5;
        if (player.rollForEffect(spellCritChance, 'Spell Crit')) {
            let critMultiplier = 1.5;
            if(catalyst.effect?.spell_crit_multiplier) critMultiplier = catalyst.effect.spell_crit_multiplier;
            if(player.statusEffects.buff_voidwalker) critMultiplier += 0.5;
            damage = Math.floor(damage * critMultiplier);
            addToLog(`A critical spell!`, 'text-yellow-300');
        }

        // --- OVERDRIVE ---
        let overdriveChance = catalyst.effect?.overdrive?.chance || 0;
        if (player._classKey === 'warlock' && player.signatureAbilityToggleActive && overdriveChance > 0) {
             overdriveChance *= 1.5;
        }
        const overdrive = catalyst.effect?.overdrive;
        if (overdrive && player.rollForEffect(overdriveChance, 'Overdrive Tome')) {
            damage = Math.floor(damage * overdrive.multiplier);
            const selfDamage = Math.floor(player.maxHp * overdrive.self_damage);
            player.hp -= selfDamage;
            addToLog(`Overdrive activated! The spell deals massive damage! You take <span class="font-bold text-red-400">${selfDamage}</span> backlash damage!`, 'text-purple-500 font-bold');
            updateStatsView();
        }

        // --- SPELLWEAVER ---
         let spellweaverChance = catalyst.effect?.spell_weaver || 0;
          if (player._classKey === 'warlock' && player.signatureAbilityToggleActive && spellweaverChance > 0) {
             spellweaverChance *= 1.5;
         }
         if (catalyst.effect?.spell_weaver && player.rollForEffect(spellweaverChance, 'Spellweaver')) {
             const elements = ['fire', 'water', 'earth', 'wind', 'lightning', 'nature', 'light', 'void'];
             const randomElement = elements[Math.floor(Math.random() * elements.length)];
             addToLog(`Spellweaver! The spell also carries the essence of ${randomElement}!`, 'text-cyan-300');
         }

        const spellEffects = {
            isMagic: true,
            element: spellData.element,
            spell_penetration: catalyst.effect?.spell_penetration || 0
        };

        // --- Apply Damage to Primary Target ---
        // *** MODIFICATION: Store return value from takeDamage ***
        console.log(`DEBUG: Casting ${spell.name} (Element: ${spellData.element}). Target: ${target.name}. Initial Damage (pre-defense): ${damage}`);
        const damageResultPrimary = target.takeDamage(damage, spellEffects);
        finalDamage = damageResultPrimary.damageDealt;
        primaryTargetKnockback = damageResultPrimary.knockback;
        addToLog(`It hits ${target.name} for <span class="font-bold text-purple-400">${finalDamage}</span> ${spellData.element} damage.`);
        console.log(`DEBUG: Final Damage Dealt to ${target.name}: ${finalDamage}. Target HP: ${target.hp}/${target.maxHp}`);

        if (spellData.element === 'nature' && finalDamage > 0) { // Check damage was dealt
            const lifestealAmount = Math.floor(finalDamage * (0.1 + (tierIndex * 0.05)));
            console.log(`DEBUG: Applying Nature Lifesteal. Amount: ${lifestealAmount}`); // <-- DEBUG LOG
            if (lifestealAmount > 0) {
                player.hp = Math.min(player.maxHp, player.hp + lifestealAmount);
                addToLog(`You drain <span class="font-bold text-green-400">${lifestealAmount}</span> HP.`, 'text-green-300');
                updateStatsView(); // Update immediately after healing
            }
        }
        // --- Apply primary target elemental effects (Water Drench, Earth Paralyze, Nature Lifesteal, Light Cleanse) ---
        if (finalDamage > 0 && target.isAlive()) { // Check target alive before applying status
             console.log(`DEBUG: Target ${target.name} is alive and took damage. Checking elemental effects...`);
             if (spellData.element === 'water') {
                console.log("DEBUG: Applying Water Drench effect."); // <-- DEBUG LOG
                addToLog(`The water from your spell drenches ${target.name}!`, 'text-blue-400');
                applyStatusEffect(target, 'drenched', { duration: 2 + tierIndex, multiplier: 0.9 - (tierIndex * 0.05) }, player.name);
            }

            const earthParalyzeChance = 0.2 + (tierIndex * 0.1);
            if (spellData.element === 'earth') {
                console.log(`DEBUG: Checking Earth Paralyze. Chance: ${earthParalyzeChance}`); // <-- DEBUG LOG
                if(player.rollForEffect(earthParalyzeChance, 'Spell Earth Paralyze')) {
                    console.log("DEBUG: Earth Paralyze Proc'd!"); // <-- DEBUG LOG
                    if (!target.statusEffects.paralyzed) {
                        applyStatusEffect(target, 'paralyzed', { duration: 2 + tierIndex }, player.name);
                    } else {
                         console.log("DEBUG: Target already paralyzed."); // <-- DEBUG LOG
                    }
                } else {
                     console.log("DEBUG: Earth Paralyze Failed Roll."); // <-- DEBUG LOG
                }
            }

            const lightCleanseChance = 0.2 + (tierIndex * 0.15);
            if (spellData.element === 'light') {
                console.log(`DEBUG: Checking Light Cleanse. Chance: ${lightCleanseChance}`); // <-- DEBUG LOG
                if(player.rollForEffect(lightCleanseChance, 'Spell Light Cleanse')) {
                    console.log("DEBUG: Light Cleanse Proc'd!"); // <-- DEBUG LOG
                    const debuffs = Object.keys(player.statusEffects).filter(key => ['poison', 'paralyzed', 'petrified', 'drenched', 'toxic'].includes(key));
                    if (debuffs.length > 0) {
                        const effectToCleanse = debuffs[0];
                        delete player.statusEffects[effectToCleanse];
                        addToLog(`Your spell's light energy cleanses you of ${effectToCleanse}!`, 'text-yellow-200');
                         console.log(`DEBUG: Cleansed ${effectToCleanse}.`); // <-- DEBUG LOG
                    } else {
                         console.log("DEBUG: No debuffs to cleanse."); // <-- DEBUG LOG
                    }
                } else {
                    console.log("DEBUG: Light Cleanse Failed Roll."); // <-- DEBUG LOG
                }
            }
        } else {
            console.log(`DEBUG: Elemental effects skipped. finalDamage=${finalDamage}, target.isAlive()=${target.isAlive()}`);
        } // End primary target effects


        // --- Magus: Arcane Manipulation Logic ---
        if (target.isAlive() && player._classKey === 'magus' && player.activeModeIndex > -1) {
            const mode = player.signatureAbilityData.modes[player.activeModeIndex];
            // Chain Magic (Mode 0) - ST Only
            if (mode === "Chain Magic" && spellData.type === 'st') { // <-- ADDED ST CHECK
                let closestEnemy = null;
                let minDist = Infinity;
                currentEnemies.forEach(enemy => {
                    if (enemy.isAlive() && enemy !== target) {
                        // Find distance from the ORIGINAL target, not the player
                        const dist = Math.abs(target.x - enemy.x) + Math.abs(target.y - enemy.y);
                        // Ensure the chained target is also within the spell's original range from the PLAYER
                        const distFromPlayer = Math.abs(player.x - enemy.x) + Math.abs(player.y - enemy.y);
                        if (distFromPlayer <= spellRange && dist < minDist) {
                            minDist = dist;
                            closestEnemy = enemy;
                        }
                    }
                });

                if (closestEnemy) {
                    const chainDamage = Math.floor(finalDamage * 0.5); // Use primary target's finalDamage as base
                    if (chainDamage > 0) {
                        const damageResultChain = closestEnemy.takeDamage(chainDamage, spellEffects); // Store result
                        const chainFinalDamage = damageResultChain.damageDealt;
                        const knockbackChain = damageResultChain.knockback; // Check knockback on chain target
                        addToLog(`Chain Magic! The spell arcs from ${target.name} to ${closestEnemy.name} for <span class="font-bold text-purple-400">${chainFinalDamage}</span> damage!`, 'text-cyan-300'); // Clarified origin
                        if (!gameState.battleEnded && !closestEnemy.isAlive()) checkBattleStatus(true);
                        // Apply knockback to chain target if triggered
                        if (!gameState.battleEnded && knockbackChain > 0 && closestEnemy.isAlive()) {
                             await applyKnockback(closestEnemy, player, knockbackChain);
                             if (!closestEnemy.isAlive()) { if (!gameState.battleEnded) checkBattleStatus(true); } // Re-check after knockback
                        }
                    }
                }
            }
            // Wide Magic (Mode 1) - AOE Only
            else if (mode === "Wide Magic" && spellData.type === 'aoe') { // <-- ADDED AOE CHECK
                addToLog("Wide Magic empowers the AOE!", 'text-cyan-300');
                // Use spell.splash or default to 0.5
                const splashMultiplier = spell.splash !== undefined ? spell.splash : 0.5;
                const splashDamage = Math.floor(finalDamage * splashMultiplier); // Base splash on primary target damage
                if (splashDamage > 0) {
                    // Hit ALL 8 surrounding tiles (dx/dy from -1 to 1, excluding 0,0)
                    for (let dx = -1; dx <= 1; dx++) {
                        for (let dy = -1; dy <= 1; dy++) {
                            if (dx === 0 && dy === 0) continue; // Skip the primary target
                            const splashX = target.x + dx;
                            const splashY = target.y + dy;
                            const splashTarget = currentEnemies.find(e => e.isAlive() && e.x === splashX && e.y === splashY);
                            if (splashTarget) {
                                const damageResultSplash = splashTarget.takeDamage(splashDamage, spellEffects); // Store result
                                const splashFinalDamage = damageResultSplash.damageDealt;
                                const knockbackSplash = damageResultSplash.knockback; // Check knockback
                                addToLog(`Wide Magic splash hits ${splashTarget.name} for <span class="font-bold text-purple-400">${splashFinalDamage}</span> damage.`);
                                if (!gameState.battleEnded && !splashTarget.isAlive()) checkBattleStatus(true);
                                // Apply knockback to splash target
                                if (!gameState.battleEnded && knockbackSplash > 0 && splashTarget.isAlive()) {
                                    await applyKnockback(splashTarget, player, knockbackSplash);
                                    if (!splashTarget.isAlive()) { if (!gameState.battleEnded) checkBattleStatus(true); } // Re-check
                                }
                            }
                        }
                    }
                }
            }
             // NOTE: No 'else' here, standard AOE/Lightning handled after Magus block
        }
        // --- Standard AOE Splash (if Wide Magic isn't active OR player isn't Magus) ---
        // <-- MOVED OUTSIDE and MODIFIED Magus check
        else if (spellData.type === 'aoe') { // Trigger if AOE and NOT Wide Magic
             currentEnemies.forEach(async (enemy, index) => { // Make callback async
                 if (index !== targetIndex && enemy.isAlive()) {
                     // Standard AOE only hits ORTHOGONALLY adjacent (distance === 1)
                     if (Math.abs(target.x - enemy.x) + Math.abs(target.y - enemy.y) === 1) {
                        // Use spell.splash or default to 0.5
                        const splashMultiplier = spell.splash !== undefined ? spell.splash : 0.5;
                        const splashDamage = Math.floor(finalDamage * splashMultiplier); // Base splash on primary target damage
                         if (splashDamage > 0) {
                             const damageResultSplash = enemy.takeDamage(splashDamage, spellEffects); // Store result
                             const splashFinalDamage = damageResultSplash.damageDealt;
                             const knockbackSplash = damageResultSplash.knockback; // Check knockback
                             addToLog(`The spell splashes onto ${enemy.name} for <span class="font-bold text-purple-400">${splashFinalDamage}</span> damage.`);
                             if (!gameState.battleEnded && !enemy.isAlive()) checkBattleStatus(true);
                             // Apply knockback to splash target
                             if (!gameState.battleEnded && knockbackSplash > 0 && enemy.isAlive()) {
                                 await applyKnockback(enemy, player, knockbackSplash);
                                 if (!enemy.isAlive()) { if (!gameState.battleEnded) checkBattleStatus(true); } // Re-check
                             }
                         }
                     }
                 }
             });
        } // End Standard AOE/Splash




        // --- Handle Lightning Chaining ---
        const lightningChainChance = 0.3 + (tierIndex * 0.1); // Base 30% + 10% per tier
        console.log(`DEBUG: Checking Lightning Chain. Chance: ${lightningChainChance}`); // <-- DEBUG LOG
        if (!gameState.battleEnded && spellData.element === 'lightning' && player.rollForEffect(lightningChainChance, 'Spell Lightning Chain')) {
            console.log("DEBUG: Lightning Chain Proc'd!"); // <-- DEBUG LOG
            // --- MODIFIED: Start chain FROM the original target's position ---
            let chainSourceX = target.x;
            let chainSourceY = target.y;
            let currentChainTargetObject = target; // Track the object of the last successful hit for logging
            // --- END MODIFICATION ---
            let chainDamage = Math.floor(finalDamage * 0.5); // Start chain damage based on primary hit
            console.log(`DEBUG: Initial Chain Damage: ${chainDamage}`); // <-- DEBUG LOG
            for (let i = 0; i < tierIndex + 1; i++) { // Chains = tier number
                // --- MODIFIED: Find targets near the LAST hit position ---
                const potentialTargets = currentEnemies.filter(e => e.isAlive() && (e.x !== chainSourceX || e.y !== chainSourceY)); // Find LIVING targets NOT at the source pos
                console.log(`DEBUG: Chain ${i+1}/${tierIndex+1}. Potential targets from (${chainSourceX},${chainSourceY}): ${potentialTargets.map(e=>e.name).join(', ')}`); // <-- DEBUG LOG
                if (potentialTargets.length > 0) {
                    // Find the closest valid target to the last hit position
                    let nextTarget = null;
                    let minDist = Infinity;
                    potentialTargets.forEach(pTarget => {
                        const dist = Math.abs(chainSourceX - pTarget.x) + Math.abs(chainSourceY - pTarget.y);
                        if (dist < minDist) {
                            minDist = dist;
                            nextTarget = pTarget;
                        }
                    });

                    if (!nextTarget) { // Should not happen if potentialTargets > 0, but safety check
                         console.log("DEBUG: Chain stopped (Could not find closest target).");
                         break;
                    }
                    // --- END MODIFICATION ---

                    console.log(`DEBUG: Chaining to ${nextTarget.name}. Damage: ${chainDamage}`); // <-- DEBUG LOG
                    const damageResultChain = nextTarget.takeDamage(chainDamage, spellEffects); // Store result
                    const chainFinalDamage = damageResultChain.damageDealt;
                    const knockbackChain = damageResultChain.knockback; // Check knockback
                    // Log using the *previous* target's position as the source
                    addToLog(`Lightning arcs from ${currentChainTargetObject.name}'s position to ${nextTarget.name} for <span class="font-bold text-blue-400">${chainFinalDamage}</span> damage!`);
                    console.log(`DEBUG: Actual Chain Damage Dealt to ${nextTarget.name}: ${chainFinalDamage}`); // <-- DEBUG LOG
                    if (!gameState.battleEnded && !nextTarget.isAlive()) {
                        console.log(`DEBUG: Chain target ${nextTarget.name} died.`); // <-- DEBUG LOG
                        checkBattleStatus(true); // Check if chain killed
                    }
                    // Apply knockback to chain target
                    if (!gameState.battleEnded && knockbackChain > 0 && nextTarget.isAlive()) {
                         await applyKnockback(nextTarget, player, knockbackChain);
                         if (!nextTarget.isAlive()) {
                             console.log(`DEBUG: Chain target ${nextTarget.name} died from knockback.`); // <-- DEBUG LOG
                             if (!gameState.battleEnded) checkBattleStatus(true);
                         } // Re-check
                    }

                    // Update source position for the next potential chain
                    chainSourceX = nextTarget.x;
                    chainSourceY = nextTarget.y;
                    currentChainTargetObject = nextTarget; // Update the object reference
                    chainDamage = Math.floor(chainDamage * 0.5); // Damage halves each jump
                    console.log(`DEBUG: Next Chain Damage: ${chainDamage}`); // <-- DEBUG LOG
                    if (chainDamage < 1 || !nextTarget.isAlive()) { // Use nextTarget here
                        console.log("DEBUG: Chain stopped (Damage too low or target died)."); // <-- DEBUG LOG
                        break; // Stop if damage too low or target died
                    }
                } else {
                    console.log("DEBUG: Chain stopped (No more valid targets)."); // <-- DEBUG LOG
                    break; // No more targets
                }
            }
        } else if (!gameState.battleEnded && spellData.element === 'lightning') { // Added else if for logging failure
            console.log("DEBUG: Lightning Chain Failed Roll or condition not met."); // <-- DEBUG LOG
        } // End Lightning Chaining

        // --- NEW: Apply Knockback to Primary Target (AFTER AOE/Chains) ---
        if (!gameState.battleEnded && primaryTargetKnockback > 0 && target.isAlive()) {
            await applyKnockback(target, player, primaryTargetKnockback);
            // Re-check target status after knockback
            if (!target.isAlive()) { if (!gameState.battleEnded) checkBattleStatus(true); }
        }
        // --- END Primary Target Knockback ---

    } // End Offensive Spell Logic

    // --- Status Check & Follow-ups ---
    let followUpActionPending = false;
    if (!gameState.battleEnded) {
         checkBattleStatus(false);
    }

    if (!gameState.battleEnded) {
        // Spell Follow-up
        let spellFollowUpChance = player.equippedWeapon.effect?.spellFollowUp ? 1 : 0;
        if (player._classKey === 'warlock' && player.signatureAbilityToggleActive && spellFollowUpChance > 0) {
             spellFollowUpChance *= 1.5;
        }
        // Find a VALID living target for follow-up (original target OR any living enemy)
        const validFollowUpTarget = (target && target.isAlive()) ? target : currentEnemies.find(e => e.isAlive());

        console.log(`DEBUG: Checking Spell Follow-up. Chance: ${spellFollowUpChance}, Target: ${validFollowUpTarget?.name}`);
        if (validFollowUpTarget && player.rollForEffect(spellFollowUpChance, 'Spell Follow-up')) {
             console.log("DEBUG: Spell Follow-up Proc'd!");
             followUpActionPending = true;
            setTimeout(async () => {
                 if (gameState.battleEnded) { finalizePlayerAction(); return; }
                 performSpellFollowUpAttack(validFollowUpTarget);
                 await new Promise(resolve => setTimeout(resolve, 50));
                 finalizePlayerAction();
            }, 250);
        } else {
            // Check for Wind Extra Turn ONLY if Spell Follow-up didn't proc
            const windExtraTurnChance = (spellData && spellData.element === 'wind' && tierIndex >= 0) ? 0.1 + (tierIndex * 0.05) : 0;
            console.log(`DEBUG: Checking Wind Extra Turn. Chance: ${windExtraTurnChance}`);
            // --- MODIFIED CONDITION: Check if any enemies are alive ---
            const anyEnemiesAlive = currentEnemies.some(e => e.isAlive());
            if (windExtraTurnChance > 0 && anyEnemiesAlive && player.rollForEffect(windExtraTurnChance, 'Spell Wind Turn')) {
                 console.log("DEBUG: Wind Extra Turn Proc'd!");
                followUpActionPending = true;
                addToLog("The swirling winds grant you another turn!", "text-cyan-300 font-bold");
                setTimeout(beginPlayerTurn, 150); // Start the next player turn
            } else {
                 console.log("DEBUG: No follow-up or extra turn proc'd.");
            }
        }
    } else { // Battle ended from the spell itself
        finalizePlayerAction(); // Still need to finalize
    }

    // Finalize if no follow-up action is pending
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

    gameState.action = type; // Set action state early
    // Clear highlights BEFORE setting the new action state potentially adds highlights back
    const cells = document.querySelectorAll('.grid-cell');
    cells.forEach(c => c.classList.remove('walkable', 'attackable', 'magic-attackable', 'splash-targetable', 'item-attackable')); // Added 'item-attackable' clear

    const isFlying = (player.race === 'Pinionfolk');

    switch (type) {
        case 'move':
            // ... existing move highlighting code ...
            // This block remains unchanged.
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
            // ... existing attack highlighting code ...
            // This block remains unchanged.
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
            // ... existing magic selection code ...
            // This block remains unchanged.
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
        // --- MODIFIED item_select ---
        case 'item_select':
            const itemKey = actionData.itemKey;
            const itemDetails = ITEMS[itemKey];
            if (!itemDetails) {
                 console.error(`Invalid item key selected: ${itemKey}`);
                 // Reset action state if item details invalid
                 gameState.action = null;
                 return;
            }
            // Check if item needs targeting based on its type
            if (['debuff_apply', 'debuff_special', 'enchant'].includes(itemDetails.type)) {
                gameState.action = 'item_target'; // Set action state specifically for item targeting
                gameState.itemToUse = itemKey;   // Store the item key to be used
                addToLog(`Select a target for ${itemDetails.name}.`, 'text-yellow-400'); // Prompt user
                renderBattleGrid(true, 'item'); // Re-render grid with item highlights
            } else {
                 // Use item immediately if no targeting needed (healing, self-buffs, cleanse)
                 useItem(itemKey, true); // useItem handles consuming and finalizing turn
                 // Reset action state after immediate use
                 gameState.action = null;
            }
            break;

        // --- END NEW CASE ---
        case 'flee':
            // ... existing flee code ...
            // This block remains unchanged.
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
        case 'signature_ability':
            // ... existing signature ability code ...
            // This block remains unchanged.
            const ability = player.signatureAbilityData;
            if (!ability) {
                console.error("Attempted to use signature ability but none found for class.");
                 gameState.action = null; // Reset action state on error
                return;
            }

            if (ability.type === 'signature') {
                if (player.signatureAbilityUsed) {
                    addToLog(`${ability.name} has already been used this encounter!`, 'text-red-400');
                    gameState.action = null; // Reset action state
                    return;
                }
                if (player.mp < ability.cost) {
                    addToLog(`Not enough MP to use ${ability.name}! (${ability.cost} required)`, 'text-blue-400');
                    gameState.action = null; // Reset action state
                    return;
                }

                // --- Ranger: Hunter's Mark Activation ---
                if (player._classKey === 'ranger') {
                     addToLog("Select a target to mark.", 'text-yellow-400');
                     gameState.action = 'mark_target'; // Keep action state for targeting
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
                        gameState.action = null; // Reset action state
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
                        gameState.action = null; // Reset action state
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
                    // Keep action state as 'signature_ability' while cooking UI is open
                    return; // Stop further execution in this switch case for Cook
                }
                // Add other signature ability effects here by checking player._classKey

                // Signature abilities typically end the turn (unless refunded or special like Cook/Ranger targeting)
                gameState.isPlayerTurn = false;
                finalizePlayerAction(); // Go to next phase
                gameState.action = null; // Reset action state after finalizing

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
                         gameState.action = null; // Reset action state
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
                gameState.action = null; // Reset action state after toggle
            }
            break;
        // --- END NEW CASE ---
        default:
            gameState.action = null; // Reset action if type is unknown
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
                    let baseDropChance = enemy.lootTable[item];
                    const itemDetails = getItemDetails(item);

                    // --- ADDED: Luck Bonus ---
                    const playerLuckBonus = Math.min(0.25, (player.luck * 0.5) / 100); // Max +25% absolute from Luck
                    let finalDropChance = baseDropChance + playerLuckBonus;
                    // --- END ADDED ---

                    if (player.foodBuffs.loot_chance) finalDropChance *= player.foodBuffs.loot_chance.value;

                    // --- DWARF: Craftsmen's Intuition (Loot) ---
                    if (player.race === 'Dwarf' && itemDetails && (WEAPONS[item] || ARMOR[item] || SHIELDS[item] || CATALYSTS[item])) {
                        finalDropChance *= 1.25; // 25% relative boost
                    }
                    // --- End Dwarf Logic ---

                    if (player.equippedWeapon.effect?.lootBonus && itemDetails && (itemDetails.class || ['Armor', 'Weapon'].includes(itemDetails.type))) {
                        finalDropChance *= 2;
                    }

                    // --- ADDED: Debug Logging ---
                    if (logChanceCalculations) {
                        addToLog(`DEBUG: Loot Chance (${itemDetails.name}): Base = ${(baseDropChance * 100).toFixed(1)}%, Luck = +${(playerLuckBonus * 100).toFixed(1)}%, Mods = x${(player.foodBuffs.loot_chance?.value || 1).toFixed(1)} x${(player.race === 'Dwarf' && itemDetails && (WEAPONS[item] || ARMOR[item] || SHIELDS[item] || CATALYSTS[item])) ? 1.25 : 1} x${(player.equippedWeapon.effect?.lootBonus && itemDetails && (itemDetails.class || ['Armor', 'Weapon'].includes(itemDetails.type))) ? 2 : 1} => Final = ${(finalDropChance * 100).toFixed(1)}%`, 'text-gray-500');
                    }
                    // --- END ADDED ---

                    // Use new rollForEffect function with the FINAL calculated chance
                    if (player.rollForEffect(finalDropChance, 'Loot Drop')) {
                        player.addToInventory(item, 1, true);
                    }
                }

                // --- Recipe Drop Logic ---
                const enemyTier = enemy.speciesData.tier;
                // Base 5% chance, scaling slightly with enemy rarity
                const baseRecipeDropChance = 0.05 + (enemy.rarityData.rarityIndex * 0.005);
                // --- ADDED: Luck Bonus ---
                const recipeLuckBonus = Math.min(0.10, (player.luck * 0.5) / 100); // Max +10% absolute from Luck for recipes
                const finalRecipeDropChance = baseRecipeDropChance + recipeLuckBonus;
                // --- END ADDED ---

                // --- ADDED: Debug Logging ---
                if (logChanceCalculations) {
                    addToLog(`DEBUG: Recipe Roll Chance: Base = ${(baseRecipeDropChance * 100).toFixed(1)}%, Luck = +${(recipeLuckBonus * 100).toFixed(1)}% => Final = ${(finalRecipeDropChance * 100).toFixed(1)}%`, 'text-gray-500');
                }
                // --- END ADDED ---

                // Use new rollForEffect function with the FINAL calculated chance
                if (preTrainingState === null && player.rollForEffect(finalRecipeDropChance, 'Recipe Drop')) {
                    const recipeType = Math.random() < 0.5 ? 'cooking' : 'alchemy'; // 50/50 chance
                    const allPossibleRecipes = RECIPE_DROPS_BY_TIER[recipeType]?.[enemyTier] || [];
                    const availableRecipesForTier = allPossibleRecipes.filter(recipeKey => {
                            // Check if player *already knows* the recipe
                            const actualRecipeKey = ITEMS[recipeKey]?.recipeKey;
                            if (!actualRecipeKey) return false; // Skip invalid recipe items
                            if (recipeType === 'cooking') {
                                return !player.knownCookingRecipes.includes(actualRecipeKey);
                            } else { // alchemy
                                return !player.knownAlchemyRecipes.includes(actualRecipeKey);
                            }
                        });

                    // --- ADDED: Detailed Debug Logging ---
                    if (logChanceCalculations) {
                        addToLog(`DEBUG: Rolled for ${recipeType} (Tier ${enemyTier}). All Possible: [${allPossibleRecipes.map(k => ITEMS[k]?.name || k).join(', ')}]`, 'text-gray-500');
                        if (availableRecipesForTier.length > 0) {
                             addToLog(`DEBUG: Unknown Available: [${availableRecipesForTier.map(k => ITEMS[k]?.name || k).join(', ')}]`, 'text-gray-500');
                        } else {
                             addToLog(`DEBUG: No unknown recipes available for this type/tier.`, 'text-gray-500');
                        }
                    }
                    // --- END ADDED ---

                    if (availableRecipesForTier.length > 0) {
                        const droppedRecipeItemKey = availableRecipesForTier[Math.floor(Math.random() * availableRecipesForTier.length)];
                        // --- ADDED: Debug Log Chosen Recipe ---
                        if (logChanceCalculations) {
                            addToLog(`DEBUG: Dropping Recipe: ${ITEMS[droppedRecipeItemKey]?.name || droppedRecipeItemKey}`, 'text-gray-500');
                        }
                        // --- END ADDED ---
                        // Add the recipe *item* to inventory, learnRecipe handles the logic
                        player.addToInventory(droppedRecipeItemKey, 1, true);
                    } else {
                        // Log message moved to detailed debug logging above
                    }
                }
                // --- End Recipe Drop Logic ---


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

    $('#inventory-btn').disabled = true;
    $('#character-sheet-btn').disabled = true;
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
        setTimeout(droneTurn, 100); // Add slight delay before drone turn
    } else {
        setTimeout(enemyTurn, 100); // Otherwise, proceed to enemy turn after delay
    }
}

// Renamed original handlePlayerEndOfTurn to avoid confusion
const handlePlayerEndOfTurn = handlePlayerEndOfTurnEffects;


// New function for Drone's turn
async function droneTurn() { // Made async for movement delay
    if (gameState.battleEnded || !gameState.activeDrone || !gameState.activeDrone.isAlive()) {
        setTimeout(enemyTurn, 100); // Drone died or doesn't exist, skip to enemy after delay
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
         setTimeout(enemyTurn, 200);
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

        // --- MODIFIED POISON LOGIC ---
        if (effectKey === 'poison' && effects[effectKey]) {
            // Check if damage value exists (from grease) otherwise use % based
            const poisonDmg = effects[effectKey].damage
                                ? effects[effectKey].damage
                                : Math.floor(enemy.maxHp * 0.05); // Default 5% HP
            enemy.hp -= poisonDmg;
            addToLog(`${enemy.name} takes <span class="font-bold text-green-600">${poisonDmg}</span> poison damage.`, 'text-green-600');
        }
        // --- END MODIFIED POISON LOGIC ---
        if (effectKey === 'toxic' && effects[effectKey]) {
            const toxicDmg = Math.floor(enemy.maxHp * 0.1);
            enemy.hp -= toxicDmg;
            addToLog(`${enemy.name} takes <span class="font-bold text-green-800">${toxicDmg}</span> damage from the toxin!`, 'text-green-800');
        }
    }
}

async function enemyTurn() {
    if (gameState.battleEnded) return;

    $('#inventory-btn').disabled = true;
    $('#character-sheet-btn').disabled = true;

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
                 await new Promise(resolve => setTimeout(resolve, 200)); // Delay between enemy actions
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

    $('#inventory-btn').disabled = false;
    $('#character-sheet-btn').disabled = false;

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

            // --- MODIFIED EQUIPMENT DROPPING LOGIC ---
            ['weapons', 'armor', 'shields', 'catalysts'].forEach(category => {
                const items = player.inventory[category];
                if (!Array.isArray(items) || items.length === 0) return; // Safety check

                // Calculate how many to drop based on the *current* count in inventory
                const initialCount = items.length;
                const amountToDrop = Math.floor(initialCount / 2);

                for (let i = 0; i < amountToDrop; i++) {
                     // Ensure there are still items to potentially drop
                     if (items.length === 0) break;

                    const randomIndex = Math.floor(Math.random() * items.length);
                    const droppedItemKey = items[randomIndex]; // Get the key before removing
                    const itemDetails = getItemDetails(droppedItemKey);

                    // Ensure we don't drop the default "None" items
                    if (itemDetails && itemDetails.rarity !== 'Broken') {
                        items.splice(randomIndex, 1); // Remove from inventory first
                        itemsDropped++;

                        // --- ADDED: Check if the dropped item was equipped ---
                        let itemTypeToCheck = null;
                        let equippedItem = null;
                        switch (category) {
                            case 'weapons': itemTypeToCheck = 'weapon'; equippedItem = player.equippedWeapon; break;
                            case 'armor': itemTypeToCheck = 'armor'; equippedItem = player.equippedArmor; break;
                            case 'shields': itemTypeToCheck = 'shield'; equippedItem = player.equippedShield; break;
                            case 'catalysts': itemTypeToCheck = 'catalyst'; equippedItem = player.equippedCatalyst; break;
                        }

                        // Check if an item type was identified and if the dropped item's name matches the equipped item's name
                        if (itemTypeToCheck && equippedItem && equippedItem.name === itemDetails.name) {
                            addToLog(`Your equipped ${itemDetails.name} was dropped!`, 'text-red-600');
                            unequipItem(itemTypeToCheck, false); // Unequip the item, don't re-render yet
                        }
                        // --- END ADDED CHECK ---
                    }
                }
            });
            // --- END MODIFIED LOGIC ---


            if (itemsDropped > 0) {
                addToLog('You lost some of your items and equipment in the fall.', 'text-red-500');
            }

            setTimeout(() => {
                addToLog('You awaken at the inn, sore but alive.', 'text-yellow-300');
                restAtInn(0); // Respawn by resting for free
                gameState.playerIsDying = false;
                // updateStatsView() will be called within restAtInn
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

