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
    gameState.npcActiveDrone = null; // <-- NEW: Add NPC drone state
    // Reset mark state at start of battle
    gameState.markedTarget = null;
    // --- NPC ALLY: Clear Fled Status ---
    if (player.npcAlly) {
        player.npcAlly.isFled = false;
        player.npcAlly.clearBattleBuffs(); // Also clear their buffs
        // Ensure HP/MP are clamped (they don't auto-heal)
        player.npcAlly.hp = Math.min(player.npcAlly.maxHp, player.npcAlly.hp);
        player.npcAlly.mp = Math.min(player.npcAlly.maxMp, player.npcAlly.mp);
        // Reset position, will be set during spawn
        player.npcAlly.x = -1;
        player.npcAlly.y = -1;
        // --- NEW: Reset ability flags ---
        player.npcAlly.signatureAbilityUsed = false;
        player.npcAlly.signatureAbilityToggleActive = false;
        player.npcAlly.activeModeIndex = -1;
        player.npcAlly.npcAllyMarkedTarget = null;
    }
    // --- END NPC ALLY ---


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
        occupiedCells.add(`${player.x},${player.y}`); // Add player pos to occupied

        // --- NPC ALLY: Spawn Ally in Tutorial ---
        if (player.npcAlly && player.npcAlly.hp > 0) {
            let allyCell = validCells.find(c => c.x === player.x + 1 && c.y === player.y) || validCells.find(c => c.x === player.x - 1 && c.y === player.y) || validCells.find(c => c.x === player.x && c.y === player.y + 1);
            if (allyCell && validCells.includes(allyCell)) {
                player.npcAlly.x = allyCell.x;
                player.npcAlly.y = allyCell.y;
                occupiedCells.add(`${allyCell.x},${allyCell.y}`);
                validCells.splice(validCells.indexOf(allyCell), 1); // Remove from valid
                _activateNpcStartOfBattleAbilities(player.npcAlly);
            }
            // If no adjacent cell, ally won't spawn in tutorial
        } else if (player.npcAlly && player.npcAlly.hp > 0) {
            // <<< NEW: Log why ally didn't spawn in tutorial
            if (player.encountersSinceLastPay >= 5) addToLog(`${player.npcAlly.name} refuses to join the tutorial fight until paid!`, 'text-yellow-400');
            else if (player.npcAlly.isResting) addToLog(`${player.npcAlly.name} is resting and skips the tutorial fight.`, 'text-gray-400');
        }
        // --- END NPC ALLY ---

        let enemyCellIndex = Math.floor(Math.random() * validCells.length);
        let enemyCell = validCells.splice(enemyCellIndex, 1)[0];
        enemy.x = enemyCell.x;
        enemy.y = enemyCell.y;
        occupiedCells.add(`${enemy.x},${enemy.y}`); // Add enemy pos

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
        
        // --- NPC ALLY: Spawn Ally in Training ---
        if (player.npcAlly && player.npcAlly.hp > 0 && player.encountersSinceLastPay < 5 && !player.npcAlly.isResting) { // <<< MODIFIED

            // Try to spawn to the right, fallback to left
            let allyX = player.x + 1;
            let allyY = player.y;
            if (allyX >= gridSize || isCellBlocked(allyX, allyY, false, false)) { // Check if blocked or OOB
                allyX = player.x - 1;
            }
            if (allyX >= 0 && !isCellBlocked(allyX, allyY, false, false)) { // Check left side
                player.npcAlly.x = allyX;
                player.npcAlly.y = allyY;
                occupiedCells.add(`${allyX},${allyY}`);
                _activateNpcStartOfBattleAbilities(player.npcAlly);
            } // If both blocked, ally doesn't spawn
        } else if (player.npcAlly && player.npcAlly.hp > 0) {
            // <<< NEW: Log why ally didn't spawn in training
            if (player.encountersSinceLastPay >= 5) addToLog(`${player.npcAlly.name} refuses to train until paid!`, 'text-yellow-400');
            else if (player.npcAlly.isResting) addToLog(`${player.npcAlly.name} is resting and skips the training session.`, 'text-gray-400');
        }        // --- END NPC ALLY ---

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

        // --- NPC ALLY: Spawn Ally in Standard Battle ---
        if (player.npcAlly && player.npcAlly.hp > 0 && player.encountersSinceLastPay < 5 && !player.npcAlly.isResting) { // <<< MODIFIED
            // Find adjacent, valid, unoccupied cell
            const potentialSpawns = [
                {x: player.x + 1, y: player.y}, {x: player.x - 1, y: player.y},
                {x: player.x, y: player.y + 1}, {x: player.x, y: player.y - 1}
            ].filter(c => 
                c.x >= 0 && c.x < gameState.gridWidth &&
                c.y >= 0 && c.y < gameState.gridHeight &&
                gameState.gridLayout[c.y * gameState.gridWidth + c.x] === 1 &&
                !occupiedCells.has(`${c.x},${c.y}`)
            );

            if (potentialSpawns.length > 0) {
                const allyCell = potentialSpawns[Math.floor(Math.random() * potentialSpawns.length)]; // Pick a random adjacent spot
                player.npcAlly.x = allyCell.x;
                player.npcAlly.y = allyCell.y;
                occupiedCells.add(`${allyCell.x},${allyCell.y}`);
                _activateNpcStartOfBattleAbilities(player.npcAlly);
            } else {
                addToLog("There was no room for your ally to join the fight!", "text-yellow-400");
                // Ally just doesn't spawn this fight
            }
        } else if (player.npcAlly && player.npcAlly.hp > 0) {
             // <<< NEW: Log why ally didn't spawn
            if (player.encountersSinceLastPay >= 5) addToLog(`${player.npcAlly.name} refuses to join the fight until paid!`, 'text-yellow-400');
            else if (player.npcAlly.isResting) addToLog(`${player.npcAlly.name} is resting and sits this one out.`, 'text-gray-400');
        }
        // --- END NPC ALLY ---

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
    
    // --- NPC ALLY: Add ally to encounter log ---
    let allyMessage = "";
    if (player.npcAlly && player.npcAlly.hp > 0 && player.npcAlly.x !== -1) { // Check they spawned
        allyMessage = ` with your ally, <span class="font-bold text-blue-400">${player.npcAlly.name}</span>,`;
    }
    // --- END NPC ALLY ---

    if (trainingConfig) {
        addToLog(`You begin a training session against: ${enemyNames}!`, 'text-yellow-300');
    } else {
        addToLog(`You encounter: ${enemyNames}${allyMessage} in the ${BIOMES[biomeKey].name}!`);
    }
    renderBattleGrid();

    if (isTutorialBattle) {
        advanceTutorial();
    }
}

function spawnNpcDrone(ally) {
    if (!ally || !ally.isAlive() || gameState.npcActiveDrone) return;

    // 1. Create Drone (using ally's stats)
    const drone = new Drone(ally);
    // 2. Find Spawn Cell
    const potentialSpawns = [
        {x: ally.x+1, y: ally.y}, {x: ally.x-1, y: ally.y},
        {x: ally.x, y: ally.y+1}, {x: ally.x, y: ally.y-1}
    ];
    let spawnCell = null;
    for(const cell of potentialSpawns) {
        // Drone can't fly, check for blockage
        if (!isCellBlocked(cell.x, cell.y, false, false)) { 
            spawnCell = cell;
            break;
        }
    }

    if (spawnCell) {
        drone.x = spawnCell.x;
        drone.y = spawnCell.y;
        gameState.npcActiveDrone = drone; // Store drone instance
        addToLog(`A whirring drone materializes beside ${ally.name}!`, "text-cyan-400");
        renderBattleGrid(); // Update grid to show drone
    } else {
        addToLog(`No space for ${ally.name} to summon their drone!`, 'text-red-400');
        // Refund cost/use
        ally.mp += ally.signatureAbilityData.cost;
        ally.signatureAbilityUsed = false;
    }
}

// --- NEW: Helper for start-of-battle abilities ---
function _activateNpcStartOfBattleAbilities(ally) {
    if (!ally || !ally.signatureAbilityData) return;

    const ability = ally.signatureAbilityData;
    const cost = ability.cost || 0;

    if (ability.type === 'toggle') {
        // Activate toggles if MP is above 25% threshold
        if (ally.mp >= ally.mpToggleThreshold) {
            ally.signatureAbilityToggleActive = true;
            addToLog(`${ally.name} activates ${ability.name}!`, 'text-blue-300');
            // Magus starts in 'Off' state
            if (ally._classKey === 'magus') {
                ally.activeModeIndex = -1;
            }
        } else {
            addToLog(`${ally.name} is too low on MP to activate ${ability.name}.`, 'text-blue-400');
        }
    } else if (ability.type === 'signature') {
        // Only activate Barbarian and Artificer at the start
        if (ally._classKey === 'barbarian' || ally._classKey === 'artificer') {
            if (ally.mp >= cost) {
                ally.mp -= cost;
                ally.signatureAbilityUsed = true;
                addToLog(`${ally.name} uses ${ability.name}!`, 'text-blue-300 font-bold');
                
                if (ally._classKey === 'barbarian') {
                    ally.statusEffects.buff_enrage = { duration: ability.duration };
                    addToLog(`${ally.name} flies into a rage!`, 'text-red-400');
                } else if (ally._classKey === 'artificer') {
                    spawnNpcDrone(ally); // Attempt to spawn
                }
            } else {
                addToLog(`${ally.name} lacks the MP to use ${ability.name}.`, 'text-blue-400');
            }
        }
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
    // --- NPC ALLY: Get ally details ---
    const ally = player.npcAlly;
    const allyIsAlive = ally && ally.hp > 0 && !ally.isFled;
    // --- END NPC ALLY ---

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
                
                // --- NEW: Render NPC Drone ---
                if (gameState.npcActiveDrone && gameState.npcActiveDrone.isAlive() && gameState.npcActiveDrone.x === x && gameState.npcActiveDrone.y === y) {
                    cell.classList.add('ally'); // Style like ally
                    cell.textContent = '🤖'; // Drone emoji
                }
                
                // --- NPC ALLY: Render Ally ---
                if (allyIsAlive && ally.x === x && ally.y === y) {
                    cell.classList.add('ally'); // Use new 'ally' CSS class
                    cell.innerHTML = `
                        <div class="ally-emoji">${getNpcAllyEmoji(ally)}</div> <!-- MODIFIED: Use new function -->
                        <div class="ally-hp-bar-bg">
                            <div class="ally-hp-bar" style="width: ${ (ally.hp / ally.maxHp) * 100}%"></div>
                        </div>
                    `;
                    cell.addEventListener('mouseover', (event) => showAllyInfo(ally, event)); // New info function
                    cell.addEventListener('mouseout', hideTooltip); // Use hideTooltip, not hideEnemyInfo

                    cell.addEventListener('click', (event) => {
                        if (gameState.action === null) {
                            showAllyInfo(ally, event, true); // Force show on click
                        }
                    });
                }
                // --- END NPC ALLY ---


                const enemy = currentEnemies.find(e => e.x === x && e.y === y);
                if (enemy) {
                    cell.classList.add('enemy');
                    // Add mark indicator if marked
                    const markIndicator = enemy.isMarked ? '<span class="absolute top-0 right-1 text-red-500 font-bold text-lg">🎯</span>' : '';
                    const npcMarkIndicator = enemy.isNpcMarked ? '<span class="absolute top-0 left-1 text-blue-400 font-bold text-lg">🎯</span>' : '';
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
                             // --- NPC ALLY: Highlight Ally for Healing Spells ---
                             if (allyIsAlive && ally.x === x && ally.y === y && spellData.element === 'healing') {
                                 cell.classList.add('magic-targetable-ally'); // New class for healing
                             }
                             // --- END NPC ALLY ---
                         }
                     }
                     // Mark Targeting (Ranger)
                     else if (gameState.action === 'mark_target' && highlightType === 'mark') {
                          if (enemy && enemy.isAlive()) { // Can mark any living enemy
                              cell.classList.add('attackable'); // Use attackable highlight for marking
                          }
                     }
                     // --- NEW: Item Targeting ---
                     else if (gameState.action === 'item_target' && highlightType === 'item' && itemData) {
                         // --- NPC ALLY: Handle friendly items ---
                         const itemType = itemData.type;
                         if (itemType === 'healing' || itemType === 'mana_restore' || itemType === 'buff' || itemType === 'cleanse' || itemType === 'cleanse_specific') {
                            if (allyIsAlive && ally.x === x && ally.y === y) {
                                // For now, assume all friendly items are touch range
                                const dx = Math.abs(player.x - x);
                                const dy = Math.abs(player.y - y);
                                if (dx + dy <= 1) { // Touch range
                                     cell.classList.add('item-targetable-ally'); // New class for friendly items
                                }
                            }
                         }
                         // --- END NPC ALLY ---
                         // --- Handle offensive items ---
                         else if (itemRange > 0 && (itemType === 'debuff_apply' || itemType === 'debuff_special' || itemType === 'enchant')) {
                             const dx = Math.abs(player.x - x);
                             const dy = Math.abs(player.y - y);
                             if (dx + dy <= itemRange) {
                                 if (enemy && enemy.isAlive()) { // Only highlight living enemies
                                     cell.classList.add('item-attackable'); // Use the new class
                                 }
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
        const clickedAlly = (player.npcAlly && player.npcAlly.hp > 0 && !player.npcAlly.isFled && player.npcAlly.x === x && player.npcAlly.y === y) ? player.npcAlly : null;

    const isFlying = (player.race === 'Pinionfolk');

    if (gameState.action === 'move') {
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
        } else  {
             // If we are flying, we can't click an empty ground/terrain cell to cancel
            if (isFlying && (gameState.gridObjects.some(o => o.x === x && o.y === y && o.type === 'terrain') || (gameState.npcActiveDrone && gameState.npcActiveDrone.x === x && gameState.npcActiveDrone.y === y))) {
                 isProcessingAction = false;
                 return; // Do nothing, keep action active
            } else {
             gameState.action = null; // Cancel action if clicking empty space
             cells.forEach(c => c.classList.remove('walkable', 'attackable', 'magic-attackable', 'splash-targetable', 'item-attackable')); // Clear item highlight too
             isProcessingAction = false; // Unlock actions
             renderBattleGrid(); // Re-render actions to show default buttons
            }
        }
    } else if (gameState.action === 'magic_cast') {

        isProcessingAction = true; // Lock actions
        if (clickedEnemy && clickedEnemy.isAlive()) { // Ensure target is alive
            const targetIndex = currentEnemies.indexOf(clickedEnemy);
            castSpell(gameState.spellToCast, targetIndex);
                    // --- NPC ALLY: Handle healing ally ---
        } else if (clickedAlly) {
            const spellData = SPELLS[gameState.spellToCast];
            if (spellData.element === 'healing') {
                castSpell(gameState.spellToCast, -1); // Use -1 to indicate targeting ally
            } else {
                // Invalid: Trying to cast offensive spell on ally
                isProcessingAction = false; // Unlock
                addToLog("You can't cast that on your ally!", "text-red-400");
                // Don't cancel, let them pick another target
            }
        // --- END NPC ALLY ---
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
        cells.forEach(c => c.classList.remove('walkable', 'attackable', 'magic-attackable', 'splash-targetable', 'item-attackable', 'magic-targetable-ally', 'item-targetable-ally'));
        const itemKey = gameState.itemToUse; // Store key before clearing state
        const itemDetails = ITEMS[itemKey];

        if (clickedEnemy && clickedEnemy.isAlive()) { // Ensure target is alive
            // Check if item is offensive
            if (['debuff_apply', 'debuff_special', 'enchant'].includes(itemDetails.type)) {
                const targetIndex = currentEnemies.indexOf(clickedEnemy);
                gameState.action = null; // Clear action state
                gameState.itemToUse = null; // Clear stored item key
                useItem(itemKey, true, targetIndex); // Call useItem with enemy target index
            } else {
                // Invalid: Trying to use friendly item on enemy
                isProcessingAction = false; // Unlock
                addToLog("You can't use that item on an enemy!", "text-red-400");
                renderBattleGrid(true, 'item'); // Re-highlight targets
            }
        // --- NPC ALLY: Handle using item on ally ---
        } else if (clickedAlly) {
            // Check if item is friendly
            if (['healing', 'mana_restore', 'buff', 'cleanse', 'cleanse_specific'].includes(itemDetails.type)) {
                gameState.action = null; // Clear action state
                gameState.itemToUse = null; // Clear stored item key
                useItem(itemKey, true, -1); // Call useItem with -1 to target ally
            } else {
                // Invalid: Trying to use offensive item on ally
                isProcessingAction = false; // Unlock
                addToLog("You can't use that item on your ally!", "text-red-400");
                renderBattleGrid(true, 'item'); // Re-highlight targets
            }
        // --- END NPC ALLY ---
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
             cells.forEach(c => c.classList.remove('walkable', 'attackable', 'magic-attackable', 'splash-targetable', 'item-attackable', 'magic-targetable-ally', 'item-targetable-ally')); // Clear highlights
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



function isCellBlocked(x, y, forEnemy = false, canFly = false, isAllyMoving = false) {
    // Check if the cell is part of the layout
    if (x < 0 || x >= gameState.gridWidth || y < 0 || y >= gameState.gridHeight || !gameState.gridLayout || gameState.gridLayout[y * gameState.gridWidth + x] !== 1) {
        return true;
    }
    
    // --- OVERLAP FIX: Check for all living entities ---
    const ally = player.npcAlly;
    const allyIsAlive = ally && ally.hp > 0 && !ally.isFled;

    if (forEnemy) {
        // An enemy is checking. It's blocked by the Player and a living Ally.
        if (player.x === x && player.y === y) return true;
        if (allyIsAlive && ally.x === x && ally.y === y) return true;
        // Also blocked by drone
        if (gameState.activeDrone && gameState.activeDrone.isAlive() && gameState.activeDrone.x === x && gameState.activeDrone.y === y) return true;
        // --- NEW: Also blocked by NPC drone ---
        if (gameState.npcActiveDrone && gameState.npcActiveDrone.isAlive() && gameState.npcActiveDrone.x === x && gameState.npcActiveDrone.y === y) return true;
    
    } else if (isAllyMoving) {
        // The ally is checking. It's blocked by the Player and living Enemies.
        if (player.x === x && player.y === y) return true;
        if (currentEnemies.some(e => e.isAlive() && e.x === x && e.y === y)) return true;
        // Also blocked by drone
        if (gameState.activeDrone && gameState.activeDrone.isAlive() && gameState.activeDrone.x === x && gameState.activeDrone.y === y) return true;

    } else { 
        // The player is checking. It's blocked by living Enemies and a living Ally.
        if (currentEnemies.some(e => e.isAlive() && e.x === x && e.y === y)) return true;
        if (allyIsAlive && ally.x === x && ally.y === y) return true;
        // Also blocked by drone
        if (gameState.activeDrone && gameState.activeDrone.isAlive() && gameState.activeDrone.x === x && gameState.activeDrone.y === y) return true;
        // --- NEW: Also blocked by NPC drone ---
        if (gameState.npcActiveDrone && gameState.npcActiveDrone.isAlive() && gameState.npcActiveDrone.x === x && gameState.npcActiveDrone.y === y) return true;
    }
    // --- END OVERLAP FIX ---


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
    if (player.foodBuffs.movement_speed) moveDistance += player.foodBuffs.movement_speed.value; // <-- ADDED

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

                // --- Food Buff ---
        if (player.foodBuffs.physical_damage) {
            damage = Math.floor(damage * player.foodBuffs.physical_damage.value);
            calcLog.steps.push({ description: "Food Buff (Phys Dmg)", value: `x${player.foodBuffs.physical_damage.value.toFixed(2)}`, result: damage });
        }
        // --- End Food Buff ---

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

                     const { damageDealt: finalSmiteDamage } = attackTarget.takeDamage(smiteDamage, { isMagic: true, element: 'light' });
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
    
    // --- NPC ALLY: Determine Target ---
    let target;
    if (targetIndex === -1) { // -1 is the flag for targeting the ally
        target = player.npcAlly;
        if (!target || target.hp <= 0 || target.isFled) {
             addToLog("Your ally is not a valid target.", 'text-red-400');
             isProcessingAction = false; // Unlock
             return;
        }
    } else {
        target = currentEnemies[targetIndex];
    }
    // --- END NPC ALLY ---
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

    if (spellData.type === 'st' || spellData.type === 'aoe' || (spellData.type === 'healing' && targetIndex === -1)) {
        const dx = Math.abs(player.x - target.x);
        const dy = Math.abs(player.y - target.y);

        if(dx + dy > spellRange){
            addToLog("You are too far away to cast that spell!", 'text-red-400');
            isProcessingAction = false; // Unlock if out of range
            return;
        }
    }
    // --- END NPC ALLY ---

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
    // --- NPC ALLY: Modified Healing Logic ---
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

        // Determine who to heal
        if (targetIndex === -1 && target) { // Target is the ally
             target.hp = Math.min(target.maxHp, target.hp + healAmount);
             addToLog(`You heal your ally ${target.name} for <span class="font-bold text-green-400">${healAmount}</span> HP.`, 'text-green-300');
             renderBattleGrid(); // Update ally HP bar
        } else { // Target is the player
             player.hp = Math.min(player.maxHp, player.hp + healAmount);
             addToLog(`You recover <span class="font-bold text-green-400">${healAmount}</span> HP.`, 'text-green-300');
             updateStatsView();
        }
    }
    // --- END NPC ALLY ---
    else if (spellData.type === 'support') {
        // ... [Existing support logic - unchanged] ...
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
        
        if (player.foodBuffs.magical_damage) {
            damage = Math.floor(damage * player.foodBuffs.magical_damage.value);
            addToLog("Your meal empowers the spell!", "text-green-300");
        }
        // --- End Food Buff ---

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
        // --- NPC ALLY: Ensure follow-up doesn't target ally ---
        const validFollowUpTarget = (target && target.isAlive() && target !== player.npcAlly) ? target : currentEnemies.find(e => e.isAlive());
        // --- END NPC ALLY ---
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
            if (player.foodBuffs.movement_speed) moveDistance += player.foodBuffs.movement_speed.value; // <-- ADDED

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

            // --- Added Kill Counters & Key Drop Logic ---
            let droppedKey = null;
            if (player.level >= 4) {
                player.killsSinceLevel4++;
                console.log(`Kills since Level 4: ${player.killsSinceLevel4}`); // Debug log
                // --- THIS IS THE FIX: Changed '===' to '>=' ---
                if (player.killsSinceLevel4 >= 5) { 
                    
                    // --- NEW: Randomized logic for Ranger and Cook ---
                    if (player._classKey === 'ranger' || player._classKey === 'cook') {
                        const randomKey = Math.random() < 0.5 ? 'blacksmith_key' : 'tower_key';
                        const alternateKey = randomKey === 'blacksmith_key' ? 'tower_key' : 'blacksmith_key';

                        if (randomKey === 'blacksmith_key' && !player.unlocks.hasBlacksmithKey) {
                            droppedKey = 'blacksmith_key';
                        } else if (randomKey === 'tower_key' && !player.unlocks.hasTowerKey) {
                            droppedKey = 'tower_key';
                        } else if (alternateKey === 'blacksmith_key' && !player.unlocks.hasBlacksmithKey) {
                            // If they already had the random key, try to give the alternate
                            droppedKey = 'blacksmith_key';
                        } else if (alternateKey === 'tower_key' && !player.unlocks.hasTowerKey) {
                            // If they already had the random key, try to give the alternate
                            droppedKey = 'tower_key';
                        }
                        // If they have both, droppedKey remains null
                        
                    } else {
                        // --- Original logic for all other classes ---
                        if (MARTIAL_CLASSES.includes(player._classKey) && !player.unlocks.hasBlacksmithKey) {
                            droppedKey = 'blacksmith_key';
                        } else if (MAGIC_CLASSES.includes(player._classKey) && !player.unlocks.hasTowerKey) {
                            droppedKey = 'tower_key';
                        }
                    }
                }
            }
            if (player.level >= 7) {
                player.killsSinceLevel7++;
                 console.log(`Kills since Level 7: ${player.killsSinceLevel7}`); // Debug log
                 // --- THIS IS THE FIX: Changed '===' to '>=' ---
                if (player.killsSinceLevel7 >= 5 && !droppedKey) { // Only drop second key if first didn't drop this kill
                    if (!player.unlocks.hasBlacksmithKey) {
                        droppedKey = 'blacksmith_key';
                    } else if (!player.unlocks.hasTowerKey) {
                        droppedKey = 'tower_key';
                    }
                }
            }

            if (droppedKey) {
                 console.log(`Attempting to add key: ${droppedKey}`); // Debug log
                 // Add key silently, the addToInventory function handles the unlock flag and message
                 player.addToInventory(droppedKey, 1, false);
                 addToLog(`The fallen ${enemy.name} dropped a ${getItemDetails(droppedKey).name}! Looks sturdy... wonder what it unlocks back in town?`, 'text-yellow-400 font-bold');
            }
            // --- End Added ---


            if (preTrainingState === null) {
                if (enemy.rarityData.name === 'Legendary') {
                    const speciesKey = enemy.speciesData.key;
                    if (!player.legacyQuestProgress[speciesKey]) {
                        player.legacyQuestProgress[speciesKey] = true;
                        addToLog(`*** LEGACY QUEST UPDATE: Legendary ${enemy.speciesData.name} slain! ***`, 'text-purple-300 font-bold');
                    }
                }

                // --- CHANGE START: Moved Gold Gain before XP Gain ---
                player.gold += enemy.goldReward;
                addToLog(`You found <span class="font-bold">${enemy.goldReward}</span> G.`, 'text-yellow-400');
                
                player.gainXp(enemy.xpReward); // gainXp calls updateStatsView(), so gold must be added BEFORE this line
                // --- CHANGE END ---


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
            const baseSeedDropChance = 0.10; // 10% base chance
            const seedLuckBonus = Math.min(0.15, (player.luck * 0.5) / 100); // Max +15% from luck
            const finalSeedDropChance = baseSeedDropChance + seedLuckBonus;

            if (logChanceCalculations) {
                addToLog(`DEBUG: Seed Roll Chance: Base = ${(baseSeedDropChance * 100).toFixed(1)}%, Luck = +${(seedLuckBonus * 100).toFixed(1)}% => Final = ${(finalSeedDropChance * 100).toFixed(1)}%`, 'text-gray-500');
            }

            if (preTrainingState === null && player.rollForEffect(finalSeedDropChance, 'Seed Drop')) {
                const enemyTier = enemy.speciesData.tier;
                let weights;
                
                // Determine seed rarity pool based on enemy tier
                if (enemyTier === 1) weights = [100, 0, 0];   // [Common, Uncommon, Rare]
                else if (enemyTier === 2) weights = [70, 30, 0];
                else if (enemyTier === 3) weights = [20, 80, 0];
                else if (enemyTier === 4) weights = [0, 70, 30];
                else if (enemyTier === 5) weights = [0, 30, 70];
                else weights = [100, 0, 0]; // Default to Common

                const chosenRarity = choices(['Common', 'Uncommon', 'Rare'], weights);

                // Find all seeds (seeds or saplings) that match that rarity
                const availableSeeds = Object.keys(ITEMS).filter(key => {
                    const details = ITEMS[key];
                    return details && (details.type === 'seed' || details.type === 'sapling') && details.rarity === chosenRarity;
                });

                if (logChanceCalculations) {
                    addToLog(`DEBUG: Seed Drop. Tier ${enemyTier} rolled Rarity: ${chosenRarity}. Found seeds: [${availableSeeds.join(', ')}]`, 'text-gray-500');
                }

                if (availableSeeds.length > 0) {
                    const seedKey = availableSeeds[Math.floor(Math.random() * availableSeeds.length)];
                    player.addToInventory(seedKey, 1, true); // Add and log the seed
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
        // --- NPC ALLY: Check if ally fled ---
    if (player.npcAlly && player.npcAlly.hp <= 0 && !player.npcAlly.isFled) {
        player.npcAlly.isFled = true;
        addToLog(`<span class="font-bold text-red-500">${player.npcAlly.name} has been defeated and fled the battle!</span>`, "text-red-500");
        // We check for this state in renderPostBattleMenu
        renderBattleGrid(); // Re-render to remove ally from grid
    }
    // --- END NPC ALLY ---

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
    if (player.foodBuffs.hp_regen_percent && player.hp < player.maxHp) {
        const healAmount = Math.floor(player.maxHp * player.foodBuffs.hp_regen_percent.value);
        if (healAmount > 0) {
            player.hp = Math.min(player.maxHp, player.hp + healAmount);
            addToLog(`Your meal regenerates <span class="font-bold text-green-300">${healAmount}</span> HP.`, 'text-green-300');
        }
    }
    if (player.foodBuffs.mp_regen_percent && player.mp < player.maxMp) {
        const regenAmount = Math.floor(player.maxMp * player.foodBuffs.mp_regen_percent.value);
        if (regenAmount > 0) {
            player.mp = Math.min(player.maxMp, player.mp + regenAmount);
            addToLog(`Your meal restores <span class="font-bold text-blue-300">${regenAmount}</span> MP.`, 'text-blue-300');
        }
    }
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
     // If drone exists and is alive, it's the drone's turn next
    if (gameState.activeDrone && gameState.activeDrone.isAlive()) {
        setTimeout(() => droneTurn(gameState.activeDrone, 'startNpcTurn'), 100); // Player drone goes, then calls NPC turn
    } 
    // --- NPC ALLY: Check for Ally Turn ---
    else if (player.npcAlly && player.npcAlly.hp > 0 && !player.npcAlly.isFled && player.npcAlly.x !== -1) {
        setTimeout(startNpcTurn, 100); // Ally turn
    }
    // --- END NPC ALLY ---
    else {
        setTimeout(enemyTurn, 100); // Otherwise, proceed to enemy turn after delay
    }
    // --- END MODIFIED ---
}

// Renamed original handlePlayerEndOfTurn to avoid confusion
const handlePlayerEndOfTurn = handlePlayerEndOfTurnEffects;


// New function for Drone's turn
async function droneTurn(droneInstance, nextTurnKey) { // Made async, takes instance and next turn
    if (gameState.battleEnded || !droneInstance || !droneInstance.isAlive()) {
        setTimeout(window[nextTurnKey], 100); // Drone died or doesn't exist, skip to next turn
        return;
    }

    const drone = droneInstance;
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
         setTimeout(window[nextTurnKey], 200); // <-- MODIFIED
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
        // --- HASTE FIX ---
        // This is the end of the full "round" (Player + Ally + Enemies).
        // Reset the 'turnUsed' flag for Haste buffs before starting the player's new logical turn.
        if (player.statusEffects.buff_haste?.turnUsed) player.statusEffects.buff_haste.turnUsed = false;
        if (player.statusEffects.buff_hermes?.turnUsed) player.statusEffects.buff_hermes.turnUsed = false;
        if (player.npcAlly) {
             if (player.npcAlly.statusEffects.buff_haste?.turnUsed) player.npcAlly.statusEffects.buff_haste.turnUsed = false;
             if (player.npcAlly.statusEffects.buff_hermes?.turnUsed) player.npcAlly.statusEffects.buff_hermes.turnUsed = false;
        }
        // --- END HASTE FIX ---
        
        beginPlayerTurn();
    }
}


async function startNpcTurn() {
    if (gameState.battleEnded || !player.npcAlly || player.npcAlly.hp <= 0 || player.npcAlly.isFled) {
        // --- MODIFIED: Call droneTurn for player's drone first ---
        droneTurn(gameState.activeDrone, 'enemy'); // Pass 'enemy' as next turn
        return;
    }

    const ally = player.npcAlly;
    let actionTaken = false; // Flag to track if the ally did something

    addToLog(`Your ally ${ally.name}'s turn!`, 'text-blue-300');
    
    // --- NEW: Toggle Management ---
    // Check if toggles should be deactivated due to low MP
    if (ally.signatureAbilityToggleActive && ally.signatureAbilityData.type === 'toggle') {
        if (ally.mp < ally.mpToggleThreshold) {
            ally.signatureAbilityToggleActive = false;
            ally.activeModeIndex = -1; // Reset Magus mode just in case
            addToLog(`${ally.name} is low on MP and deactivates ${ally.signatureAbilityData.name}.`, 'text-blue-400');
        }
    }
    // --- END NEW ---

    // --- AI Priority Checklist ---

    // 1. Check for paralysis/petrification
    if (ally.statusEffects.paralyzed || ally.statusEffects.petrified) {
        const status = ally.statusEffects.paralyzed ? 'paralyzed' : 'petrified';
        addToLog(`${ally.name} is ${status} and cannot act!`, 'text-yellow-500');
        actionTaken = true; // "Action" was to be paralyzed
    }

    // --- NEW: Signature Ability (Priority 1: Special Actions) ---
    if (!actionTaken && ally.signatureAbilityData && ally.signatureAbilityData.type === 'signature' && !ally.signatureAbilityUsed) {
        const ability = ally.signatureAbilityData;
        const cost = ability.cost || 0;
        
        if (ally.mp >= cost) {
            // --- Cleric: Holy Blessings ---
            if (ally._classKey === 'cleric') {
                const healAvg = ally._calculateClericHealAvg();
                const playerHPMissing = player.maxHp - player.hp;
                const allyHPMissing = ally.maxHp - ally.hp;
                
                // Use if either ally or player is missing at least the average heal amount
                if (playerHPMissing >= healAvg || allyHPMissing >= healAvg) {
                    ally.mp -= cost;
                    ally.signatureAbilityUsed = true;
                    addToLog(`${ally.name} uses ${ability.name}!`, 'text-blue-300 font-bold');

                    // Heal self
                    const selfHeal = rollDice(ally.level >= 20 ? 7 : 3, 8, 'Ally Holy Blessings').total;
                    ally.hp = Math.min(ally.maxHp, ally.hp + selfHeal);
                    addToLog(`${ally.name} restores <span class="font-bold text-green-400">${selfHeal}</span> HP!`, 'text-yellow-200');
                    // Heal player
                    const playerHeal = rollDice(ally.level >= 20 ? 7 : 3, 8, 'Ally Holy Blessings').total;
                    player.hp = Math.min(player.maxHp, player.hp + playerHeal);
                    addToLog(`You are restored for <span class="font-bold text-green-400">${playerHeal}</span> HP!`, 'text-yellow-200');

                    // Cleanse self
                    const allyDebuffs = Object.keys(ally.statusEffects).filter(key => ['poison', 'paralyzed', 'petrified', 'drenched', 'toxic', 'slowed', 'inaccurate', 'clumsy', 'fumble', 'magic_dampen', 'elemental_vuln'].includes(key));
                    if (allyDebuffs.length > 0) {
                        allyDebuffs.forEach(key => delete ally.statusEffects[key]);
                        addToLog(`The holy energy purges ${ally.name}'s ailments!`, 'text-cyan-300');
                    }
                    // Cleanse player
                    const playerDebuffs = Object.keys(player.statusEffects).filter(key => ['poison', 'paralyzed', 'petrified', 'drenched', 'toxic', 'slowed', 'inaccurate', 'clumsy', 'fumble', 'magic_dampen', 'elemental_vuln'].includes(key));
                    if (playerDebuffs.length > 0) {
                        playerDebuffs.forEach(key => delete player.statusEffects[key]);
                        addToLog(`The holy energy purges your ailments!`, 'text-cyan-300');
                    }
                    
                    updateStatsView();
                    actionTaken = true;
                }
            }
            // --- Ranger: Hunter's Mark ---
            else if (ally._classKey === 'ranger') {
                let highestHpEnemy = null;
                let maxHp = 0;
                currentEnemies.forEach(e => {
                    if (e.isAlive() && e.hp > maxHp) {
                        maxHp = e.hp;
                        highestHpEnemy = e;
                    }
                });
                
                if (highestHpEnemy) {
                    ally.mp -= cost;
                    ally.signatureAbilityUsed = true;
                    addToLog(`${ally.name} uses ${ability.name}!`, 'text-blue-300 font-bold');
                    
                    ally.npcAllyMarkedTarget = highestHpEnemy;
                    highestHpEnemy.isNpcMarked = true;
                    addToLog(`${ally.name} marks ${highestHpEnemy.name} as their prey!`, 'text-yellow-400');
                    actionTaken = true;
                }
            }
            // --- Cook: On-Field Cooking ---
            else if (ally._classKey === 'cook') {
                // Find a recipe the *player* knows and the *ally* can cook
                let recipeToCook = null;
                // MODIFIED: Check player.knownCookingRecipes, not ally.knownCookingRecipes
                const availablePlayerRecipes = shuffleArray([...player.knownCookingRecipes]); 
                
                let bestCookChoice = { key: null, cost: Infinity, ingredients: {} };

                for (const recipeKey of availablePlayerRecipes) {
                    const recipe = COOKING_RECIPES[recipeKey];
                    if (!recipe) continue;
                    
                    // Use the _npcCanCook helper, which correctly checks the ALLY'S inventory
                    const cookCheck = _npcCanCook(ally, recipe); // This now returns { canCook, mpCost, ingredientsToConsume }
                    
                    // NEW LOGIC: Check if ally can afford the MP cost and find the 'cheapest' (lowest MP) option
                    if (cookCheck.canCook && ally.mp >= (cost + cookCheck.mpCost)) {
                        if (cookCheck.mpCost < bestCookChoice.cost) {
                            bestCookChoice = {
                                key: recipeKey,
                                cost: cookCheck.mpCost,
                                ingredients: cookCheck.ingredientsToConsume
                            };
                        }
                    }
                }
                
                if (bestCookChoice.key) {
                    ally.mp -= cost; // Cook ability has 0 cost, but this is future-proof
                    ally.signatureAbilityUsed = true; // Mark as used
                    addToLog(`${ally.name} uses ${ability.name}!`, 'text-blue-300 font-bold');
                    
                    // Call the _npcUseCookAbility helper, passing in the calculated MP cost and ingredients
                    await _npcUseCookAbility(ally, bestCookChoice.key, bestCookChoice.cost, bestCookChoice.ingredients); // Make sure to await
                    
                    actionTaken = true;
                }
                // No 'else' needed, if no recipe is cookable, just proceed to combat logic
            }
        }
    }

    // 2. Item Logic (Priority 2: Survival)
    const lostHp = ally.maxHp - ally.hp;
    const potionEffectiveness = {
        'superior_health_potion': 100,
        'condensed_health_potion': 50,
        'health_potion': 20
    };
    
    if (!actionTaken && lostHp > 0) {
        let potionToUse = null;
        
        // Use best potion possible that doesn't waste *too* much
        if (ally.inventory.items['superior_health_potion'] > 0 && lostHp >= potionEffectiveness['superior_health_potion'] * 0.8) {
            potionToUse = 'superior_health_potion';
        } else if (ally.inventory.items['condensed_health_potion'] > 0 && lostHp >= potionEffectiveness['condensed_health_potion'] * 0.8) {
            potionToUse = 'condensed_health_potion';
        } else if (ally.inventory.items['health_potion'] > 0 && lostHp >= potionEffectiveness['health_potion'] * 0.8) {
            potionToUse = 'health_potion';
        }

        if (potionToUse) {
            ally.useItem(potionToUse);
            actionTaken = true;
        }
    }

    const lostMp = ally.maxMp - ally.mp;
    const manaPotionEffectiveness = {
        'superior_mana_potion': 150,
        'condensed_mana_potion': 100,
        'mana_potion': 50
    };

    if (!actionTaken && lostMp > 0) {
        let potionToUse = null;
        
        if (ally.inventory.items['superior_mana_potion'] > 0 && lostMp >= manaPotionEffectiveness['superior_mana_potion'] * 0.8) {
            potionToUse = 'superior_mana_potion';
        } else if (ally.inventory.items['condensed_mana_potion'] > 0 && lostMp >= manaPotionEffectiveness['condensed_mana_potion'] * 0.8) {
            potionToUse = 'condensed_mana_potion';
        } else if (ally.inventory.items['mana_potion'] > 0 && lostMp >= manaPotionEffectiveness['mana_potion'] * 0.8) {
            potionToUse = 'mana_potion';
        }

        if (potionToUse) {
            ally.useItem(potionToUse);
            actionTaken = true;
        }
    }
    
    // 3. Spell Logic (Priority 3: Healing)
    if (!actionTaken) {
        // Check if they *have* healing potions
        const hasHealingPotion = (ally.inventory.items['health_potion'] || 0) > 0 ||
                                 (ally.inventory.items['condensed_health_potion'] || 0) > 0 ||
                                 (ally.inventory.items['superior_health_potion'] || 0) > 0;
        
        // Only use healing spells if they are OUT of healing potions
        if (!hasHealingPotion) {
            const healingSpellKey = findBestHealingSpell(ally);
            
            if (healingSpellKey) {
                const spellData = SPELLS[healingSpellKey];
                const spell = spellData.tiers[ally.spells[healingSpellKey].tier - 1];
                
                const healThreshold = ally._calculateClericHealAvg(healingSpellKey); // Use helper

                // Calculate cost
                let finalSpellCost = spell.cost;
                if (ally.equippedCatalyst.effect?.mana_discount) {
                    finalSpellCost = Math.max(1, finalSpellCost - ally.equippedCatalyst.effect.mana_discount);
                }

                if (ally.mp >= finalSpellCost) {
                    const allyHpMissing = ally.maxHp - ally.hp;
                    const playerHpMissing = player.maxHp - player.hp;
                    let targetToHeal = null;

                    if (allyHpMissing >= healThreshold) {
                        targetToHeal = ally; // Heal self first
                    } else if (playerHpMissing >= healThreshold) {
                        targetToHeal = player; // Heal player if self is okay
                    }

                    if (targetToHeal) {
                        await ally.castSpell(healingSpellKey, targetToHeal);
                        actionTaken = true;
                    }
                }
            }
        }
    }

    // 4. Buff Item Logic (Low Priority)
    if (!actionTaken && Math.random() < 0.15) { // 15% chance to check for buffs
        if (ally.inventory.items['whetstone'] > 0 && !ally.statusEffects['buff_whetstone']) {
            // Only use whetstone if weapon is physical
            const weaponElement = ally.weaponElement;
            if (weaponElement === 'none' || weaponElement === 'physical') {
                ally.useItem('whetstone');
                actionTaken = true;
            }
        }
        // (Add other buff item logic here, e.g., magic_rock_dust for mages)
    }

    // 5. Combat Logic (If no item/ability was used)
    if (!actionTaken) {
        // Find nearest living enemy
        let target = null;
        let minDistance = Infinity;
        
        // --- NEW: Prioritize Marked Target ---
        if (ally.npcAllyMarkedTarget && ally.npcAllyMarkedTarget.isAlive()) {
            target = ally.npcAllyMarkedTarget;
            minDistance = Math.abs(ally.x - target.x) + Math.abs(ally.y - target.y);
            addToLog(`${ally.name} focuses on their marked prey, ${target.name}!`, 'text-blue-400');
        } else {
            // Clear mark if target is dead or gone
            if(ally.npcAllyMarkedTarget) ally.npcAllyMarkedTarget = null; 
            
            // Find closest target
            currentEnemies.forEach(enemy => {
                if (enemy.isAlive()) {
                    const distance = Math.abs(ally.x - enemy.x) + Math.abs(ally.y - enemy.y);
                    if (distance < minDistance) {
                        minDistance = distance;
                        target = enemy;
                    }
                }
            });
        }
        // --- END NEW ---

        if (target) {
            const distance = minDistance; // Use the calculated distance
            const weaponRange = ally.equippedWeapon.range || 1;
            const catalystRange = ally.equippedCatalyst.range || 3;
            
            let bestSpell = null;
            let canCastSpell = false;
            let spellData = null; // <-- FIX
            let spell = null; // <-- FIX
            
            // Check for magic action first
            if (MAGIC_CLASSES.includes(ally._classKey)) {
                bestSpell = findBestSpell(ally, target);
                if (bestSpell) {
                    // --- FIX: Define spellData and spell here ---
                    spellData = SPELLS[bestSpell];
                    spell = spellData.tiers[ally.spells[bestSpell].tier - 1];
                    // --- END FIX ---
                    const spellCost = spell.cost; // Use the defined spell
                    if (ally.mp >= spellCost) {
                        canCastSpell = true;
                    }
                }
            }
            
            // --- NEW: Magus Mode Update ---
            if (ally._classKey === 'magus' && ally.signatureAbilityToggleActive) {
                if (canCastSpell && spellData.type === 'st') {
                    ally.activeModeIndex = 0; // Set to Chain Magic
                } else if (canCastSpell && spellData.type === 'aoe') {
                    ally.activeModeIndex = 1; // Set to Wide Magic
                } else {
                    ally.activeModeIndex = -1; // Not casting or not applicable
                }
            }
            // --- END NEW ---

            // --- AI Decision Tree ---
            if (MAGIC_CLASSES.includes(ally._classKey) && canCastSpell && distance <= catalystRange) {
                // --- MAGE: In spell range & can cast ---
                if (distance === 1) {
                    // Too close, fall back
                    addToLog(`${ally.name} is too close and tries to fall back!`); // <-- MODIFIED LOG

                    // --- NEW FALLBACK LOGIC (Simple) ---
                    let moveDistance = 2; // Base ally move
                    if (ally.race === 'Elf' && (!ally.equippedArmor || !ally.equippedArmor.metallic)) {
                        moveDistance += (ally.level >= 20 ? 2 : 1);
                    }

                    // Find all adjacent cells
                    const neighbors = [
                        { x: ally.x, y: ally.y - 1 }, { x: ally.x, y: ally.y + 1 },
                        { x: ally.x - 1, y: ally.y }, { x: ally.x + 1, y: ally.y }
                    ];

                    let bestCell = null;
                    let maxDistFromEnemy = distance; // Current distance is 1

                    for (const cell of neighbors) {
                        // Check if cell is valid and not blocked *for an ally*
                        // isCellBlocked(x, y, forEnemy = false, canFly = false, isAllyMoving = false)
                        if (!isCellBlocked(cell.x, cell.y, false, false, true)) { // isAllyMoving = true
                            const distFromEnemy = Math.abs(cell.x - target.x) + Math.abs(cell.y - target.y);
                            
                            // We want a cell that is > 1 distance from the enemy
                            if (distFromEnemy > maxDistFromEnemy) {
                                bestCell = cell;
                                maxDistFromEnemy = distFromEnemy;
                                // break; // Found one, that's good enough
                            }
                        }
                    }

                    if (bestCell) {
                        // Found a cell to move to.
                        // `moveTowards` will pathfind. We just give it the target coordinates.
                        await ally.moveTowards(bestCell);
                        actionTaken = true;
                    } else {
                        // Trapped! No adjacent cell to move to.
                        addToLog(`${ally.name} is trapped and casts the spell anyway!`);
                        ally.castSpell(bestSpell, target);
                        actionTaken = true;
                    }
                    // --- END NEW FALLBACK LOGIC ---

                } else {
                    // Good range, cast spell
                    ally.castSpell(bestSpell, target);
                    actionTaken = true;
                }
            } else if (MARTIAL_CLASSES.includes(ally._classKey)) {
                // --- MARTIAL: Logic ---
                const isRangedWeapon = (weaponRange > 4);
                if (isRangedWeapon && distance === 1) {
                    // Too close with ranged, move away
                    addToLog(`${ally.name} repositions for a better shot!`);
                    await ally.moveTowards(player); // Move towards player
                    actionTaken = true;
                } else if (distance <= weaponRange) {
                    // In range, attack
                    await ally.attack(target); // Await attack (which is just the attack part)
                    actionTaken = true;
                } else {
                    // Out of range, move closer
                    addToLog(`${ally.name} moves towards ${target.name}.`);
                    await ally.moveTowards(target); // Await movement
                    actionTaken = true;
                }
            } else if (distance > weaponRange && distance > catalystRange) {
                // --- ALL: Out of range for everything ---
                addToLog(`${ally.name} moves towards ${target.name}.`);
                await ally.moveTowards(target); // Await movement
                actionTaken = true;
            } else if (distance <= weaponRange) {
                // --- FALLBACK: In weapon range (e.g., Mage out of mana) ---
                addToLog(`${ally.name} falls back on their weapon!`);
                await ally.attack(target);
                actionTaken = true;
            } else {
                // --- FINAL FALLBACK (e.g., in spell range but not weapon range, but can't cast) ---
                addToLog(`${ally.name} moves to attack ${target.name}.`);
                await ally.moveTowards(target);
                actionTaken = true;
            }

        } else {
            addToLog(`${ally.name} has no targets.`);
            actionTaken = true; // "Action" was to do nothing
        }
    }
    
    // Check if ally's action ended the battle
    if (!gameState.battleEnded) {
        checkBattleStatus(true); // isReaction = true
    }
    if (gameState.battleEnded) return; // Stop if battle ended

    // Proceed to finalize ally turn
    if (!gameState.battleEnded) {
         setTimeout(finalizeNpcTurn, 200);
    }
}


// --- NEW HELPER FUNCTION ---
/**
 * Finds the best offensive spell for an ally to use.
 * @param {NpcAlly} ally - The ally casting the spell.
 * @param {Enemy} target - The enemy being targeted.
 * @returns {string|null} The key of the best spell, or null if none.
 */
function findBestSpell(ally, target) {
    let bestSpell = null;
    let maxScore = 0; // 3 = Super effective, 2 = ST, 1 = Basic
    
    for (const spellKey in ally.spells) {
        const spellData = SPELLS[spellKey];
        // --- THIS IS THE FIX ---
        // Skip non-offensive spells AND HEALING SPELLS
        if (!spellData || spellData.element === 'healing' || spellData.type === 'support') {
            continue; 
        }
        
        const spellElement = spellData.element;
        const targetElement = target.element;
        let score = 1; // Base score for any offensive spell
        
        if (spellData.type === 'st') {
            score = 2; // Prefer single-target spells for AI
        }
        
        // Check for super-effective
        if (spellElement !== 'none' && targetElement !== 'none') {
            const modifier = calculateElementalModifier(spellElement, targetElement);
            if (modifier > 1) {
                score = 3; // Highest priority
            } else if (modifier < 1) {
                score = 0; // Avoid "not effective"
            }
        }
        
        if (score > maxScore) {
            // Check if ally can afford it
            const spellTier = ally.spells[spellKey].tier;
            const spellCost = spellData.tiers[spellTier - 1].cost;
            if (ally.mp >= spellCost) {
                maxScore = score;
                bestSpell = spellKey;
            }
        }
    }
    return bestSpell;
}
    
function findBestHealingSpell(ally) {
    let bestHeal = null;
    let maxTier = 0;

    for (const spellKey in ally.spells) {
        const spellData = SPELLS[spellKey];
        // Check if the spell exists and is a healing spell
        if (spellData && spellData.element === 'healing') {
            const spellTier = ally.spells[spellKey].tier;
            // Find the highest tier healing spell they know
            if (spellTier > maxTier) {
                maxTier = spellTier;
                bestHeal = spellKey;
            }
        }
    }
    return bestHeal;
}

async function _npcUseClericAbility(ally, ability) {
    ally.mp -= ability.cost;
    ally.signatureAbilityUsed = true;
    updateStatsView(); // Update player UI if ally is player (shouldn't be, but good practice)
    
    addToLog(`${ally.name} invokes ${ability.name}!`, 'text-yellow-300 font-bold');

    // Calculate healing dice (scales with level, caps at 7)
    const healAmount = ally._calculateClericHealAvg(); // Use the helper we already built
    
    // Heal Ally
    ally.hp = Math.min(ally.maxHp, ally.hp + healAmount);
    addToLog(`Divine light washes over ${ally.name}, restoring <span class="font-bold text-green-400">${healAmount}</span> HP!`, 'text-yellow-200');
    
    // Heal Player
    player.hp = Math.min(player.maxHp, player.hp + healAmount);
    addToLog(`Divine light washes over you, restoring <span class="font-bold text-green-400">${healAmount}</span> HP!`, 'text-yellow-200');

    // Cleanse debuffs for Ally
    const allyDebuffs = Object.keys(ally.statusEffects).filter(key => ['poison', 'paralyzed', 'petrified', 'drenched', 'toxic', 'slowed', 'inaccurate', 'clumsy', 'fumble', 'magic_dampen', 'elemental_vuln'].includes(key));
    if (allyDebuffs.length > 0) {
        allyDebuffs.forEach(key => delete ally.statusEffects[key]);
        addToLog(`The holy energy purges ${ally.name}'s ailments!`, 'text-cyan-300');
    }
    
    // Cleanse debuffs for Player
    const playerDebuffs = Object.keys(player.statusEffects).filter(key => ['poison', 'paralyzed', 'petrified', 'drenched', 'toxic', 'slowed', 'inaccurate', 'clumsy', 'fumble', 'magic_dampen', 'elemental_vuln'].includes(key));
    if (playerDebuffs.length > 0) {
        playerDebuffs.forEach(key => delete player.statusEffects[key]);
        addToLog(`The holy energy purges your ailments!`, 'text-cyan-300');
    }
    
    updateStatsView();
    renderBattleGrid();
}

function _npcCanCook(ally, recipe) {
    const required = recipe.ingredients;
    const availableIngredients = { meat: [], veggie: [], seasoning: [] };
    const specificInventory = { ...ally.inventory.items }; // Use ally's inventory

    // 1. Populate ally's available generic ingredients, sorted by price (cheapest first)
    Object.keys(specificInventory).forEach(itemKey => {
        const details = getItemDetails(itemKey);
        if (details && details.cookingType) {
            const count = specificInventory[itemKey];
            if (count > 0) {
                for (let i = 0; i < count; i++) {
                    availableIngredients[details.cookingType].push({ key: itemKey, price: details.price, rarity: details.rarity || 'Common' });
                }
            }
        }
    });
    for(const type in availableIngredients) {
        availableIngredients[type].sort((a,b) => a.price - b.price);
    }

    const ingredientsToConsume = {};
    let mpCost = 0;
    const mpCosts = { 'Common': 5, 'Uncommon': 10, 'Rare': 15, 'Epic': 20, 'Legendary': 25, 'Broken': 0 };

    // 2. Check requirements and calculate MP cost
    for (const reqKey in required) {
        const requiredAmount = required[reqKey];
        let itemsUsedCount = 0;
        const isGeneric = ['meat', 'veggie', 'seasoning'].includes(reqKey);

        if (isGeneric) {
            const availableCount = availableIngredients[reqKey].length;
            itemsUsedCount = Math.min(availableCount, requiredAmount);

            for(let i = 0; i < itemsUsedCount; i++) {
                const itemToUse = availableIngredients[reqKey][i].key;
                ingredientsToConsume[itemToUse] = (ingredientsToConsume[itemToUse] || 0) + 1;
            }

            const missingAmount = requiredAmount - itemsUsedCount;
            if (missingAmount > 0) {
                 mpCost += missingAmount * mpCosts['Common'];
            }
        } else { // Specific ingredient
            const currentAmount = specificInventory[reqKey] || 0;
            itemsUsedCount = Math.min(currentAmount, requiredAmount);

            if (itemsUsedCount > 0) {
                 ingredientsToConsume[reqKey] = (ingredientsToConsume[reqKey] || 0) + itemsUsedCount;
            }
            const missingAmount = requiredAmount - itemsUsedCount;
            if (missingAmount > 0) {
                const details = getItemDetails(reqKey);
                const rarityCost = mpCosts[details?.rarity || 'Common'] || mpCosts['Common'];
                mpCost += missingAmount * rarityCost;
            }
        }
    }

    // 3. Return the result
    return {
        canCook: true, // It's always "possible" if they have the MP
        mpCost: mpCost,
        ingredientsToConsume: ingredientsToConsume
    };
}

async function _npcUseCookAbility(ally, recipeKey, mpCost, ingredientsToConsume) {
    const recipe = COOKING_RECIPES[recipeKey];
    if (!recipe) return;
    
    // --- Consume Resources ---
    ally.mp -= mpCost;
    if (mpCost > 0) addToLog(`${ally.name} substituted missing ingredients for ${mpCost} MP.`, 'text-blue-300');

    for (const itemKey in ingredientsToConsume) {
        if (ally.inventory.items[itemKey]) { // Check if item exists
            ally.inventory.items[itemKey] -= ingredientsToConsume[itemKey];
            if (ally.inventory.items[itemKey] <= 0) {
                delete ally.inventory.items[itemKey];
            }
        }
    }
    
    // --- Apply Buffs to Ally AND Player ---
    ally.foodBuffs = {}; // Clear old buffs
    if (player) player.clearFoodBuffs(); // Clear player's old buffs
    
    const effect = recipe.effect;
    
    if (effect.heal) {
        ally.hp = Math.min(ally.maxHp, ally.hp + effect.heal);
        if (player) player.hp = Math.min(player.maxHp, player.hp + effect.heal);
    }
    
    switch (effect.type) {
        case 'full_restore':
            ally.hp = ally.maxHp; ally.mp = ally.maxMp;
            if (player) { player.hp = player.maxHp; player.mp = player.maxMp; }
            break;
        case 'heal_percent': // Added this case
             ally.hp = Math.min(ally.maxHp, ally.hp + Math.floor(ally.maxHp * effect.heal_percent));
             if (player) player.hp = Math.min(player.maxHp, player.hp + Math.floor(player.maxHp * effect.heal_percent));
            break;
        case 'mana_percent': // Added this case
             ally.mp = Math.min(ally.maxMp, ally.mp + Math.floor(ally.maxMp * effect.mana_percent));
             if (player) player.mp = Math.min(player.maxMp, player.mp + Math.floor(player.maxMp * effect.mana_percent));
            break;
        case 'buff':
            effect.buffs.forEach(buff => {
                const buffData = { value: buff.value, duration: 3 }; // 3 encounters
                ally.foodBuffs[buff.stat] = buffData;
                if (player) player.foodBuffs[buff.stat] = buffData;
            });
            // Re-apply Max HP/MP buffs
            ally.hp = Math.min(ally.hp, ally.maxHp);
            ally.mp = Math.min(ally.mp, ally.maxMp);
            if (player) {
                player.hp = Math.min(player.hp, player.maxHp);
                player.mp = Math.min(player.mp, player.maxMp);
            }
            break;
    }
    
    addToLog(`${ally.name} quickly cooked and ate ${recipe.name}!`, "text-green-400 font-bold");
    if (player) {
        addToLog(`You share in the meal!`, "text-green-300");
        updateStatsView(); // Update player UI
    }
    renderBattleGrid(); // Update ally HP/MP bars
}

// --- END NEW HELPERS ---

// --- New Function: finalizeNpcTurn ---
function finalizeNpcTurn() {
    if (gameState.battleEnded || !player.npcAlly) {
        // --- MODIFIED: Check for NPC drone before enemy turn ---
        if (gameState.npcActiveDrone && gameState.npcActiveDrone.isAlive()) {
            setTimeout(() => droneTurn(gameState.npcActiveDrone, 'enemyTurn'), 100);
        } else {
            setTimeout(enemyTurn, 100); // Proceed to enemy turn
        }
        // --- END MODIFIED ---
        return;
    }
    
    const ally = player.npcAlly;
    if (ally.hp <= 0 || ally.isFled) {
         // --- MODIFIED: Check for NPC drone before enemy turn ---
        if (gameState.npcActiveDrone && gameState.npcActiveDrone.isAlive()) {
            setTimeout(() => droneTurn(gameState.npcActiveDrone, 'enemyTurn'), 100);
        } else {
            setTimeout(enemyTurn, 100); // Ally is out, proceed to enemy
        }
         // --- END MODIFIED ---
         return;
    }

    // --- ADDED: Aasimar Racial Passive ---
    if (ally.race === 'Aasimar') {
        const healPercent = (ally.level >= 20) ? 0.05 : 0.02; // 5% or 2%
        const healAmount = Math.floor(ally.maxHp * healPercent);
        if (ally.hp < ally.maxHp && healAmount > 0) {
            ally.hp = Math.min(ally.maxHp, ally.hp + healAmount);
            addToLog(`${ally.name}'s divine nature regenerates <span class="font-bold text-green-300">${healAmount}</span> HP.`, 'text-yellow-200');
        }
    }

    // Handle ally's status effects (DoTs, durations)
    const effects = ally.statusEffects;
    for (const effectKey in effects) {
        if (effects[effectKey].duration && effects[effectKey].duration !== Infinity) {
            effects[effectKey].duration--;
            if (effects[effectKey].duration <= 0) {
                delete effects[effectKey];
                const effectName = effectKey.replace(/buff_|debuff_/g, '').replace(/_/g, ' ');
                addToLog(`${ally.name}'s ${effectName} has worn off.`);
            }
        }
        // Handle DoTs
        if (effectKey === 'poison' && effects[effectKey]) {
            const poisonDmg = Math.floor(ally.maxHp * 0.05);
            ally.hp -= poisonDmg;
            addToLog(`${ally.name} takes <span class="font-bold text-green-600">${poisonDmg}</span> poison damage.`, 'text-green-600');
        }
        if (effectKey === 'toxic' && effects[effectKey]) {
            const toxicDmg = Math.floor(ally.maxHp * 0.1);
            ally.hp -= toxicDmg;
            addToLog(`The toxin deals <span class="font-bold text-green-800">${toxicDmg}</span> damage to ${ally.name}!`, 'text-green-800');
        }
        // Add other DoTs if needed (e.g., swallowed, though ally shouldn't be swallowed)
    }

    // Check if ally fled from DoT
    if (ally.hp <= 0 && !ally.isFled) {
        ally.isFled = true;
        addToLog(`<span class="font-bold text-red-500">${ally.name} has succumbed to their wounds and fled!</span>`, "text-red-500");
    }

    renderBattleGrid(); // Update ally HP bar from DoTs

    // --- MODIFIED: Check for NPC drone before enemy turn ---
    if (gameState.npcActiveDrone && gameState.npcActiveDrone.isAlive()) {
        setTimeout(() => droneTurn(gameState.npcActiveDrone, 'enemyTurn'), 100);
    } else {
        setTimeout(enemyTurn, 100); // Proceed to enemy turn
    }
    // --- END MODIFIED ---
}

function beginPlayerTurn() {
    if (gameState.battleEnded) return;

    gameState.isPlayerTurn = true;
    isProcessingAction = false; // Unlock actions for the player

    $('#inventory-btn').disabled = false;
    $('#character-sheet-btn').disabled = false;


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

    if (player.npcAlly) {
        player.npcAlly.isFled = true; // Ally flees if player dies
        addToLog(`${player.npcAlly.name} sees your fall and flees the battle!`, "text-gray-400");
    }
    // --- END NPC ALLY --- 
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
        // --- BUFF SHARING (PLAYER) START ---
        if (player.npcAlly) {
            player.npcAlly.clearFoodBuffs();
        }
        // --- BUFF SHARING (PLAYER) END ---

        const effect = recipeData.effect;
        if (effect.heal) {
            player.hp = Math.min(player.maxHp, player.hp + effect.heal);
            // --- BUFF SHARING (PLAYER) START ---
            if (player.npcAlly) {
                player.npcAlly.hp = Math.min(player.npcAlly.maxHp, player.npcAlly.hp + effect.heal);
            }
            // --- BUFF SHARING (PLAYER) END ---
        }

        switch (effect.type) {
            case 'full_restore':
                player.hp = player.maxHp; player.mp = player.maxMp;
                // --- BUFF SHARING (PLAYER) START ---
                if (player.npcAlly) {
                    player.npcAlly.hp = player.npcAlly.maxHp;
                    player.npcAlly.mp = player.npcAlly.maxMp;
                }
                // --- BUFF SHARING (PLAYER) END ---
                break;
            case 'heal_percent':
                player.hp = Math.min(player.maxHp, player.hp + Math.floor(player.maxHp * effect.heal_percent));
                // --- BUFF SHARING (PLAYER) START ---
                if (player.npcAlly) {
                    player.npcAlly.hp = Math.min(player.npcAlly.maxHp, player.npcAlly.hp + Math.floor(player.npcAlly.maxHp * effect.heal_percent));
                }
                // --- BUFF SHARING (PLAYER) END ---
                break;
            case 'mana_percent':
                player.mp = Math.min(player.maxMp, player.mp + Math.floor(player.maxMp * effect.mana_percent));
                // --- BUFF SHARING (PLAYER) START ---
                if (player.npcAlly) {
                    player.npcAlly.mp = Math.min(player.npcAlly.maxMp, player.npcAlly.mp + Math.floor(player.npcAlly.maxMp * effect.mana_percent));
                }
                // --- BUFF SHARING (PLAYER) END ---
                break;
            case 'buff':
                effect.buffs.forEach(buff => {
                    // Ensure duration is 3 encounters for On-Field Cooking
                    const buffData = { value: buff.value, duration: 3 }; // Create data once
                    player.foodBuffs[buff.stat] = buffData;
                    // --- BUFF SHARING (PLAYER) START ---
                    if (player.npcAlly) {
                        player.npcAlly.foodBuffs[buff.stat] = buffData;
                    }
                    // --- BUFF SHARING (PLAYER) END ---
                });
                // Re-apply Max HP/MP buffs
                player.hp = Math.min(player.hp, player.maxHp);
                player.mp = Math.min(player.mp, player.maxMp);
                // --- BUFF SHARING (PLAYER) START ---
                if (player.npcAlly) {
                    player.npcAlly.hp = Math.min(player.npcAlly.hp, player.npcAlly.maxHp);
                    player.npcAlly.mp = Math.min(player.npcAlly.mp, player.npcAlly.maxMp);
                }
                // --- BUFF SHARING (PLAYER) END ---
                break;
        }

        addToLog(`You quickly cook and eat ${recipeData.name}!`, "text-green-400 font-bold");
        // --- BUFF SHARING (PLAYER) START ---
        if (player.npcAlly) {
            addToLog(`${player.npcAlly.name} shares in the meal!`, "text-blue-300");
            renderBattleGrid(); // Update ally HP bar
        }
        // --- BUFF SHARING (PLAYER) END ---
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

