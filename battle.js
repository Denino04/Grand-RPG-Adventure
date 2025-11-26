let preTrainingState = null;
let isProcessingAction = false; // Flag to prevent action spamming

// [NEW HELPER START] Skill Requirement Logic
const STR_WEAPONS = ['Hand-to-Hand', 'Longsword', 'Axe', 'Hammer', 'Lance'];
const DEX_WEAPONS = ['Dagger', 'Thrusting Sword', 'Curved Sword', 'Reaper', 'Bow'];

const SKILL_WEAPON_REQ = {
    // Specific Weapon Skills
    'savage_beast_claw': ['Hand-to-Hand'],
    'earthshaker': ['Hammer'],
    'deathly_flourish': ['Reaper'],
    'mighty_shot': ['Bow'],
    'sneak_attack': ['Dagger'],
    'piercing_fang': ['Thrusting Sword'],
    'riposte': ['Longsword'],
    'charge': ['Lance'],
    'woodcutter': ['Axe'],
    'certificate_of_dance': ['Curved Sword'],
    
    // General Branch Skills
    'power_swing': STR_WEAPONS,
    'heavier_swing': STR_WEAPONS,
    'barbaric_swing': STR_WEAPONS,
    'weak_point_targeting': DEX_WEAPONS
};

function checkSkillRequirements(skillId) {
    const reqs = SKILL_WEAPON_REQ[skillId];
    if (!reqs) return { allowed: true }; // No specific requirement

    const equippedClass = player.equippedWeapon.class;
    if (reqs.includes(equippedClass)) {
        return { allowed: true };
    }
    
    // Return first requirement for display (simplified)
    return { allowed: false, required: reqs[0] === 'Reaper' ? 'Scythe' : reqs[0] }; 
}

async function applyKnockback(target, source, distance) {
    if (!target || !target.isAlive() || !source || distance <= 0) return;

    // 1. Determine direction (from source to target)
    let dx = target.x - source.x;
    let dy = target.y - source.y;

    // Normalize to get a primary direction (or 0 if on same tile)
    let dirX = 0;
    let dirY = 0;
    
    if (Math.abs(dx) > Math.abs(dy)) {
        dirX = dx > 0 ? 1 : -1;
    } else if (Math.abs(dy) > 0) {
        dirY = dy > 0 ? 1 : -1;
    } else {
        // Target and source are on the same tile? Pick a random direction.
        const randDir = [ {x:0, y:1}, {x:0, y:-1}, {x:1, y:0}, {x:-1, y:0} ];
        const dir = randDir[Math.floor(Math.random() * randDir.length)];
        dirX = dir.x;
        dirY = dir.y;
    }

    // 2. Find final landing spot
    let finalX = target.x;
    let finalY = target.y;
    let collisionDamage = 0;
    let hitObstacle = false;

    // Check if target can fly (applies to enemies or flying players)
    const canFly = (target === player) ? (player.race === 'Pinionfolk') : (target.movement?.type === 'flying');

    for (let i = 0; i < distance; i++) {
        let nextX = finalX + dirX;
        let nextY = finalY + dirY;

        // Check for grid boundaries or inactive cells
        if (nextX < 0 || nextX >= gameState.gridWidth || nextY < 0 || nextY >= gameState.gridHeight || 
            !gameState.gridLayout || gameState.gridLayout[nextY * gameState.gridWidth + nextX] !== 1) {
            addToLog(`${target.name} is knocked against the edge of the arena!`);
            collisionDamage = rollDice(1, 6, 'Knockback Wall Collision').total;
            hitObstacle = true;
            break; // Stop moving
        }

        // Check for obstacles/terrain (if not flying)
        if (!canFly) {
            const gridObject = gameState.gridObjects.find(o => o.x === nextX && o.y === nextY);
            if (gridObject && (gridObject.type === 'obstacle' || gridObject.type === 'terrain')) {
                addToLog(`${target.name} slams into a ${gridObject.name || 'barrier'}!`);
                collisionDamage = rollDice(1, 6, 'Knockback Obstacle Collision').total;
                hitObstacle = true;
                if (gridObject.type === 'obstacle' && target === player) {
                     // If player hits obstacle, damage it
                     // We can't await this, so just call it
                     performAttackOnObstacle(gridObject); 
                }
                break; // Stop moving
            }
        }
        
        // Check for other entities (Player, Ally, other Enemies)
        let isBlockedByEntity = false;
        if (target !== player && (player.x === nextX && player.y === nextY)) {
             isBlockedByEntity = true;
        } else if (player.npcAlly && player.npcAlly.isAlive() && !player.npcAlly.isFled && target !== player.npcAlly && (player.npcAlly.x === nextX && player.npcAlly.y === nextY)) {
             isBlockedByEntity = true;
        } else if (currentEnemies.some(e => e.isAlive() && e !== target && (e.x === nextX && e.y === nextY))) {
             isBlockedByEntity = true;
        }

        if (isBlockedByEntity) {
             addToLog(`${target.name} is knocked into another combatant!`);
             collisionDamage = rollDice(1, 4, 'Knockback Entity Collision').total; // Less damage for hitting someone
             hitObstacle = true;
             break; // Stop moving
        }

        // Cell is clear, update final position
        finalX = nextX;
        finalY = nextY;
    }

    // 3. Animate movement
    if (finalX !== target.x || finalY !== target.y) {
        // For simplicity, just teleport them to the final spot with a delay
        target.x = finalX;
        target.y = finalY;
        renderBattleGrid(); // Re-draw the grid
        await new Promise(resolve => setTimeout(resolve, 200)); // Short pause
    }

    // 4. Apply collision damage
    if (collisionDamage > 0) {
        // Apply damage (as true damage, no element)
        // takeDamage returns an object, so we apply it and check results
        const { damageDealt } = target.takeDamage(collisionDamage, { ignore_defense: true, isMagic: false, attacker: source }); 
        addToLog(`The collision deals <span class="font-bold text-red-400">${damageDealt}</span> damage to ${target.name}!`);
        
        // Check if collision was fatal
        if (target === player && !player.isAlive()) {
             checkPlayerDeath(); // This will stop turns
        } else if (target !== player && !target.isAlive()) {
            if (!gameState.battleEnded) checkBattleStatus(true); // Check for enemy death
        }
    }
}
// --- BATTLE FUNCTIONS ---
function startBattle(biomeKey, options = null) {
    // 1. Reset State
    if (options && options.trainingConfig) {
        preTrainingState = { hp: player.hp, mp: player.mp };
    } else {
        preTrainingState = null;
    }

    // --- FIX: Reset ALL special weapon state flags for a new encounter ---
    player.specialWeaponStates = {}; 
    // -------------------------------------------------------------------
    
    isProcessingAction = false; 
    gameState.isPlayerTurn = true;
    gameState.battleEnded = false;
    gameState.currentBiome = biomeKey;
    gameState.consecutionStacks = 0;
    gameState.lastTargetId = null;
    gameState.usedElements = [];
    
    $('#inventory-btn').disabled = false;
    $('#character-sheet-btn').disabled = false;

    // Reset Battle State
    gameState.action = null;
    gameState.comboTarget = null;
    gameState.comboCount = 0;
    gameState.lastSpellElement = 'none';
    gameState.gridObjects = []; 
    gameState.activeDrone = null;
    gameState.npcActiveDrone = null;
    gameState.markedTarget = null;

    // Clear Player Buffs
    player.clearBattleBuffs();
    player.signatureAbilityUsed = false;
    player.signatureAbilityToggleActive = false; 

    // Reset Ally State
    if (player.npcAlly) {
        player.npcAlly.isFled = false;
        player.npcAlly.clearBattleBuffs();
        player.npcAlly.hp = Math.min(player.npcAlly.maxHp, player.npcAlly.hp);
        player.npcAlly.mp = Math.min(player.npcAlly.maxMp, player.npcAlly.mp);
        player.npcAlly.x = -1; 
        player.npcAlly.y = -1;
        player.npcAlly.signatureAbilityUsed = false;
        player.npcAlly.signatureAbilityToggleActive = false;
        player.npcAlly.activeModeIndex = -1;
        player.npcAlly.npcAllyMarkedTarget = null;
        
        if (!player.npcAlly.isResting && player.encountersSinceLastPay < 5) {
            player.npcAlly._50PercentLogged = false; 
            player.npcAlly._10PercentLogged = false;
            const dialogueType = options?.trainingConfig ? 'START_TRAIN' : 'START_BATTLE';
            const dialogue = player.npcAlly._getDialogue(dialogueType, player.name);
            addToLog(`(${player.npcAlly.name})<br>"${dialogue}"`, 'text-gray-400');
        }
    }

    // 2. Determine Context & Grid
    const isTutorial = tutorialState.isActive && tutorialState.sequence[tutorialState.currentIndex]?.id === 'wilderness_select';
    const isTraining = options && options.trainingConfig;
    const isMapNode = options && options.nodeType;

    let gridData;
    if (isTutorial) {
        gridData = BATTLE_GRIDS['square_5x5'];
    } else if (isTraining) {
        const size = options.trainingConfig.gridSize;
        gridData = BATTLE_GRIDS[`square_${size}x${size}`] || BATTLE_GRIDS['square_5x5'];
    } else {
        const gridKeys = Object.keys(BATTLE_GRIDS);
        gridData = BATTLE_GRIDS[gridKeys[Math.floor(Math.random() * gridKeys.length)]];
    }
    
    gameState.gridWidth = gridData.width;
    gameState.gridHeight = gridData.height;
    gameState.gridLayout = gridData.layout;

    // 3. Enemy Generation
    // Explicitly clear enemies if this is a fresh start call (Map Node or Training/Tutorial)
    // engine.js pre-fills for 'monster_lured' and 'boss' sometimes, but let's standardize here.
    if (isMapNode || isTraining || isTutorial) {
        currentEnemies = [];
    }
    // Initialize if undefined (legacy safety)
    if (!currentEnemies || !Array.isArray(currentEnemies)) currentEnemies = [];

    if (currentEnemies.length === 0) {
        if (isTutorial) {
            currentEnemies.push(new Enemy(MONSTER_SPECIES['goblin'], MONSTER_RARITY['common'], player.level));
        } else if (isTraining) {
            options.trainingConfig.enemies.forEach(cfg => {
                 const species = MONSTER_SPECIES[cfg.key];
                 const rarity = MONSTER_RARITY[cfg.rarity];
                 if (species && rarity) currentEnemies.push(new Enemy(species, rarity, player.level));
            });
        } else if (isMapNode) {
            // --- MAP NODE LOGIC ---
            if (options.nodeType === 'elite') {
                 // Spawns exactly 1 Rare or Epic enemy
                 let tempEnemy = generateEnemy(biomeKey);
                 const rarityKey = Math.random() < 0.7 ? 'rare' : 'epic';
                 currentEnemies.push(new Enemy(tempEnemy.speciesData, MONSTER_RARITY[rarityKey], player.level));
            } else if (options.nodeType === 'boss') {
                 // Spawns exactly 1 heavily modified boss enemy
                 const bossKey = options.bossKey; 
                 const species = MONSTER_SPECIES[bossKey] || generateEnemy(biomeKey).speciesData;
                 const rarityData = MONSTER_RARITY['legendary']; 
                 const boss = new Enemy(species, rarityData, player.level);
                 boss.hp = Math.floor(boss.maxHp * 5);
                 boss.maxHp = boss.hp;
                 boss.strength = Math.floor(boss.strength * 2);
                 boss.isBoss = true;
                 currentEnemies.push(boss);
            } else if (options.nodeType === 'monster_lured') {
                 // Spawns exactly 1 lured enemy
                 const species = MONSTER_SPECIES[options.speciesKey];
                 currentEnemies.push(new Enemy(species, MONSTER_RARITY['common'], player.level));
            } else {
                 // --- NEW LOGIC: Randomized Enemy Counts (Ranges) ---
                 let minEnemies = 1;
                 let maxEnemies = 1;

                 if (player.level >= 20) {
                     minEnemies = 3; maxEnemies = 5;
                 } else if (player.level >= 10) {
                     minEnemies = 2; maxEnemies = 4;
                 } else if (player.level >= 6) {
                     minEnemies = 1; maxEnemies = 3;
                 } else if (player.level >= 4) {
                     minEnemies = 1; maxEnemies = 2;
                 }
                 // Level 1-3 stays 1-1

                 // Roll for count
                 let numEnemies = Math.floor(Math.random() * (maxEnemies - minEnemies + 1)) + minEnemies;

                 // Lure adds +2 enemies (max 6)
                 if (player.statusEffects.monster_lure) numEnemies = Math.min(6, numEnemies + 2);

                 for (let i = 0; i < numEnemies; i++) {
                     let enemy = generateEnemy(biomeKey);
                     let safety = 0;
                     while(enemy.rarityData.key === 'legendary' && safety < 10) {
                         enemy = generateEnemy(biomeKey);
                         safety++;
                     }
                     currentEnemies.push(enemy);
                 }
                 // --- END NEW LOGIC ---
            }
        } else {
            // --- STANDARD AMBUSH (Fallback if not a map node) ---
            // Revert back to the old, simple scaling for non-map encounters
            let numEnemies = 1;
            if (player.level >= 6 && Math.random() > 0.8) numEnemies = 2;
            if (player.statusEffects.monster_lure) numEnemies = Math.min(4, numEnemies + 2);
            
            for (let i = 0; i < numEnemies; i++) currentEnemies.push(generateEnemy(biomeKey));
        }
    }

    // 4. Placement
    const validCells = [];
    for (let y = 0; y < gameState.gridHeight; y++) {
        for (let x = 0; x < gameState.gridWidth; x++) {
            if (gameState.gridLayout[y * gameState.gridWidth + x] === 1) validCells.push({x, y});
        }
    }
    const occupiedCells = new Set();
    const getUnoccupied = (list) => {
        const available = list.filter(c => !occupiedCells.has(`${c.x},${c.y}`));
        return available.length > 0 ? available[Math.floor(Math.random() * available.length)] : null;
    };
    
    // Place Player
    const playerSpawnArea = validCells.filter(c => c.y >= Math.floor(gameState.gridHeight / 2));
    let pCell = getUnoccupied(playerSpawnArea) || getUnoccupied(validCells);
    player.x = pCell.x; player.y = pCell.y;
    occupiedCells.add(`${player.x},${player.y}`);
    
    // Place Enemies
    const enemySpawnArea = validCells.filter(c => c.y < Math.floor(gameState.gridHeight / 2));
    currentEnemies.forEach(enemy => {
        enemy.isMarked = false; enemy.hasDealtDamageThisEncounter = false;
        let cell = getUnoccupied(enemySpawnArea) || getUnoccupied(validCells);
        if (cell) {
            enemy.x = cell.x; enemy.y = cell.y;
            occupiedCells.add(`${cell.x},${cell.y}`);
        } else {
            enemy.x = -1; enemy.y = -1; 
        }
    });

    // Place Ally
    if (player.npcAlly && player.npcAlly.hp > 0 && !player.npcAlly.isResting && player.encountersSinceLastPay < 5) {
         const adj = [{x:player.x+1, y:player.y}, {x:player.x-1, y:player.y}, {x:player.x, y:player.y+1}, {x:player.x, y:player.y-1}];
         const validAdj = adj.filter(c => c.x >= 0 && c.x < gameState.gridWidth && c.y >= 0 && c.y < gameState.gridHeight && gameState.gridLayout[c.y*gameState.gridWidth+c.x] === 1 && !occupiedCells.has(`${c.x},${c.y}`));
         if (validAdj.length > 0) {
             const spot = validAdj[Math.floor(Math.random() * validAdj.length)];
             player.npcAlly.x = spot.x; player.npcAlly.y = spot.y;
             occupiedCells.add(`${spot.x},${spot.y}`);
             _activateNpcStartOfBattleAbilities(player.npcAlly);
         } else {
             addToLog("No room for ally!", "text-yellow-400");
         }
    }

    // Place Obstacles
    const numObstacles = 1 + Math.floor(Math.random() * 3);
    for(let i=0; i<numObstacles; i++) {
        const cell = getUnoccupied(validCells);
        if (cell) {
            const obsType = (biomeKey && BIOMES[biomeKey]) ? (BIOMES[biomeKey].obstacle || { char: '🪨', name: 'Rock' }) : { char: '🪨', name: 'Rock' };
            gameState.gridObjects.push({ x: cell.x, y: cell.y, type: 'obstacle', hp: 1, emoji: obsType.char, name: obsType.name });
            occupiedCells.add(`${cell.x},${cell.y}`);
        }
    }

    // 5. Finalize
    if (!isTraining) {
        const biome = BIOMES[biomeKey];
        if (biome && biome.theme) applyTheme(biome.theme);
    } else {
        applyTheme('town');
    }

    lastViewBeforeInventory = 'battle';
    gameState.currentView = 'battle';
    
    const enemyNames = currentEnemies.map(e => `<span class="font-bold text-red-400">${e.name}</span>`).join(', ');
    let allyLog = (player.npcAlly && player.npcAlly.x !== -1) ? ` with your ally, <span class="font-bold text-blue-400">${player.npcAlly.name}</span>,` : "";

    if (isTraining) addToLog(`Training against: ${enemyNames}!`, 'text-yellow-300');
    else addToLog(`You encounter: ${enemyNames}${allyLog}!`);

    renderBattleGrid();
    if (isTutorial) advanceTutorial();
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

function renderBattleGrid(highlightTargets = false, highlightType = 'magic') {
    // Clone the template
    const template = document.getElementById('template-battle').content.cloneNode(true);
    
    // [FIX START] Prevent Grid/Button Overlap
    // The template forces h-full and centering, which causes overlap on small screens.
    // We remove these constraints so the container grows with content and scrolls.
    const rootDiv = template.querySelector('div'); // The wrapper div in the template
    if (rootDiv) {
        rootDiv.classList.remove('h-full', 'justify-center');
        rootDiv.classList.add('min-h-min', 'py-4'); // Ensure it takes space and has padding
    }
    // [FIX END]

    const gridContainer = template.getElementById('battle-grid');
    
    // --- FIX: ULTRA-COMPACT GRID SIZE ---
    gridContainer.classList.remove('max-w-sm', 'max-w-lg', 'max-w-2xl', 'max-w-5xl', 'max-w-[600px]', 'max-w-[400px]', 'max-h-[80vh]'); 
    gridContainer.classList.add('w-full', 'max-w-[300px]', 'aspect-square', 'mx-auto'); 
    // ------------------------------------

    gridContainer.innerHTML = '';
    gridContainer.style.gridTemplateColumns = `repeat(${gameState.gridWidth}, 1fr)`;
    gridContainer.style.gridTemplateRows = `repeat(${gameState.gridHeight}, 1fr)`; 

    const spellData = gameState.spellToCast ? SPELLS[gameState.spellToCast] : null;
    const itemData = gameState.itemToUse ? ITEMS[gameState.itemToUse] : null;
    
    let actionRange = 0;
    if (spellData) {
        const playerSpell = player.spells[gameState.spellToCast];
        const tier = playerSpell ? playerSpell.tier : 1;
        
        actionRange = player.equippedCatalyst.range || 3;
        if (player.race === 'Pinionfolk' && player.level >= 20) actionRange += 2;
        if (player.equippedCatalyst.effect?.spell_sniper) actionRange = Math.floor(actionRange * (1 + player.equippedCatalyst.effect.spell_sniper));
        if (player.statusEffects.buff_magic_dust && player.statusEffects.buff_magic_dust.rangeIncrease) {
             actionRange += player.statusEffects.buff_magic_dust.rangeIncrease;
        }
        if (spellData.type === 'st') {
            if (player.hasSkill('spell_sniper')) actionRange += 1;
            if (player.hasSkill('focused_fire')) actionRange += 1;
        }
        if (spellData.type === 'aoe' && player.hasSkill('lobbed_fire')) actionRange += 1;
    } else if (itemData) {
        actionRange = itemData.range || 0;
    } else if (gameState.action === 'skill_target') {
        actionRange = player.equippedWeapon.range || 1;
        
        // --- SKILL TREE: RANGE MODIFIERS ---
        if (player.race === 'Pinionfolk' && player.level >= 20) actionRange += 2;
        if (player.statusEffects.bonus_range) actionRange += player.statusEffects.bonus_range.range;
        
        // Precision Training: +1 Range for Bows
        if (player.equippedWeapon.class === 'Bow' && player.skillToggles && player.skillToggles['precision_training']) {
            actionRange += 1;
        }
        // -----------------------------------
    }

    const ally = player.npcAlly;
    const allyIsAlive = ally && ally.hp > 0 && !ally.isFled;

    for (let y = 0; y < gameState.gridHeight; y++) {
        for (let x = 0; x < gameState.gridWidth; x++) {
            const cell = document.createElement('div');
            const isCellActive = gameState.gridLayout[y * gameState.gridWidth + x] === 1;
            
            cell.classList.add('aspect-square', 'w-full', 'h-full');

            if (isCellActive) {
                cell.classList.add('grid-cell', 'flex', 'items-center', 'justify-center', 'relative'); 
                
                cell.dataset.x = x;
                cell.dataset.y = y;

                // Text-2xl fits well in the 300px grid
                const renderEmoji = (emoji) => `<div class="text-2xl leading-none filter drop-shadow-md select-none">${emoji}</div>`;

                // Render Entities
                if (player.x === x && player.y === y) {
                    cell.classList.add('player');
                    cell.innerHTML = renderEmoji(getPlayerEmoji());
                } else if (gameState.activeDrone && gameState.activeDrone.isAlive() && gameState.activeDrone.x === x && gameState.activeDrone.y === y) {
                    cell.classList.add('player'); 
                    cell.innerHTML = renderEmoji('🤖');
                } else if (gameState.npcActiveDrone && gameState.npcActiveDrone.isAlive() && gameState.npcActiveDrone.x === x && gameState.npcActiveDrone.y === y) {
                    cell.classList.add('ally'); 
                    cell.innerHTML = renderEmoji('🤖');
                } else if (allyIsAlive && ally.x === x && ally.y === y) {
                    cell.classList.add('ally');
                    cell.innerHTML = `
                        ${renderEmoji(getNpcAllyEmoji(ally))}
                        <div class="ally-hp-bar-bg"><div class="ally-hp-bar" style="width: ${ (ally.hp / ally.maxHp) * 100}%"></div></div>`;
                    cell.addEventListener('mouseover', (event) => showAllyInfo(ally, event));
                    cell.addEventListener('mouseout', hideTooltip);
                    cell.addEventListener('click', (event) => { if (gameState.action === null) showAllyInfo(ally, event, true); });
                }

                const enemy = currentEnemies.find(e => e.x === x && e.y === y);
                if (enemy) {
                    cell.classList.add('enemy');
                    const markIndicator = enemy.isMarked ? '<span class="absolute top-0 right-0 text-red-500 font-bold text-xs z-10">🎯</span>' : '';
                    cell.innerHTML = `${markIndicator}${renderEmoji(enemy.speciesData.emoji)}<div class="enemy-hp-bar-bg"><div class="enemy-hp-bar" style="width: ${ (enemy.hp / enemy.maxHp) * 100}%"></div></div>`;
                    cell.addEventListener('mouseover', (event) => showEnemyInfo(enemy, event));
                    cell.addEventListener('mouseout', hideEnemyInfo);
                    cell.addEventListener('click', (event) => { if (gameState.action === null) showEnemyInfo(enemy, event, true); });
                }

                const gridObject = gameState.gridObjects.find(o => o.x === x && o.y === y);
                if (gridObject) {
                    if (gridObject.type === 'obstacle') {
                        cell.classList.add('obstacle');
                        cell.innerHTML = renderEmoji(gridObject.emoji || 'O');
                    } else if (gridObject.type === 'terrain') {
                        cell.classList.add('terrain');
                    }
                }

                 if (highlightTargets) {
                     const dx = Math.abs(player.x - x);
                     const dy = Math.abs(player.y - y);
                     
                     if (highlightType === 'magic' && spellData && actionRange > 0) {
                         if (dx + dy <= actionRange) {
                             if (enemy && enemy.isAlive()) cell.classList.add('magic-attackable');
                             if (allyIsAlive && ally.x === x && ally.y === y && spellData.element === 'healing') cell.classList.add('magic-targetable-ally');
                         }
                     } else if (highlightType === 'mark') {
                          if (enemy && enemy.isAlive()) cell.classList.add('attackable');
                     } else if (highlightType === 'item' && itemData) {
                         if (['healing', 'mana_restore', 'buff', 'cleanse', 'cleanse_specific'].includes(itemData.type)) {
                            if (allyIsAlive && ally.x === x && ally.y === y && dx + dy <= 1) cell.classList.add('item-targetable-ally');
                         } else if (actionRange > 0 && dx + dy <= actionRange && enemy && enemy.isAlive()) {
                             cell.classList.add('item-attackable');
                         }
                     } else if (highlightType === 'skill' && gameState.action === 'skill_target') {
                         if (dx + dy <= actionRange && enemy && enemy.isAlive()) {
                             cell.classList.add('attackable');
                         }
                     }
                 }

                cell.addEventListener('click', () => handleCellClick(x, y));
            } else {
                 cell.classList.add('grid-cell-empty');
            }
            gridContainer.appendChild(cell);
        }
    }

    if (highlightTargets && highlightType === 'magic' && spellData?.type === 'aoe') {
         const targetableCells = gridContainer.querySelectorAll('.magic-attackable');
         targetableCells.forEach(targetCell => {
             const tx = parseInt(targetCell.dataset.x);
             const ty = parseInt(targetCell.dataset.y);
             const allCells = gridContainer.querySelectorAll('.grid-cell');
             allCells.forEach(splashCell => {
                 const sx = parseInt(splashCell.dataset.x);
                 const sy = parseInt(splashCell.dataset.y);
                 if (Math.abs(tx - sx) <= 1 && Math.abs(ty - sy) <= 1 && (sx === tx || sy === ty)) {
                     if (sx !== tx || sy !== ty) splashCell.classList.add('splash-targetable');
                 }
                 if (player._classKey === 'magus' && player.activeModeIndex === 1) {
                     if (Math.abs(tx - sx) <= 1 && Math.abs(ty - sy) <= 1 && !(sx === tx && sy === ty)) {
                         splashCell.classList.add('splash-targetable');
                     }
                 }
             });
         });
    }

    renderBattleActions(template);
    render(template);
    
    mainView.classList.remove('p-6');
    mainView.classList.add('p-2');
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

        // --- REPLACEMENT START ---
        // Row 2, Column 1: The new Unified Skills Button
        actionsHtml += `
            <button onclick="battleAction('skills')" class="btn btn-primary rounded-full px-3 w-full text-sm overflow-hidden text-ellipsis whitespace-nowrap">Skills</button>
        `;
        // --- REPLACEMENT END ---

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
    } else if (gameState.action === 'skill_target') {
        const clickedEnemy = currentEnemies.find(e => e.x === x && e.y === y);
        
        if (clickedEnemy && clickedEnemy.isAlive()) {
             // Execute the skill
             executeActiveSkill(gameState.currentActiveSkill, clickedEnemy);
             
             // Cleanup
             gameState.action = null;
             gameState.currentActiveSkill = null;
             isProcessingAction = true; // Lock until animation/turn ends
             // Visual cleanup happens in renderBattleGrid called by execute/finalize
        } else {
            // Cancel
            addToLog("Skill cancelled.", "text-gray-400");
            gameState.action = null;
            gameState.currentActiveSkill = null;
            renderBattleGrid(); // Reset UI
        }
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

async function executeActiveSkill(skillId, target) {
    const skillNode = SKILL_TREE[skillId];
    const cost = skillNode.effect.cost;

    if (player.mp < cost) return;
    player.mp -= cost;
    updateStatsView();

    const actionType = skillNode.effect.action;

    if (actionType === 'power_swing') {
        player.tempAttackMods = { multiplier: 1.5, pierce: 0.2 };
        if (player.hasSkill('heavier_swing')) player.tempAttackMods.multiplier = 1.7;
        addToLog(`${player.name} uses Power Swing!`, "text-yellow-300 font-bold");
        await performPlayerAttack(target);
        delete player.tempAttackMods;
    } 
    else if (actionType === 'deathly_flourish') {
        player.tempAttackMods = { multiplier: 1.5 };
        addToLog(`${player.name} performs a Deathly Flourish!`, "text-purple-400");
        await performPlayerAttack(target);
        delete player.tempAttackMods;
        if(player.isAlive()) {
            player.statusEffects.buff_evasion = { duration: 1, chance: 1.0 }; 
            addToLog("You move with blur-like speed! (Evasion Up)", "text-gray-300");
        }
    }
    else if (actionType === 'mighty_shot') {
        player.tempAttackMods = { multiplier: 2.0, pierce: 0.25 };
        addToLog(`${player.name} looses a Thunderbolt!`, "text-yellow-300 font-bold");
        await performPlayerAttack(target);
        delete player.tempAttackMods;
    }
    else if (actionType === 'sneak_attack') {
        player.tempAttackMods = { multiplier: 1.5, critChanceFlat: 0.10, critMultFlat: 0.2 };
        addToLog(`${player.name} strikes from the shadows!`, "text-gray-400");
        await performPlayerAttack(target);
        delete player.tempAttackMods;
    }
    else if (actionType === 'savage_beast_claw') {
        addToLog(`${player.name} unleashes a pummeling barrage!`, "text-red-500 font-bold");
        gameState.isPlayerTurn = false;
        gameState.suppressTurnEnd = true;
        for(let i=0; i<5; i++) {
            if(!target.isAlive() || gameState.battleEnded) break;
            player.tempAttackMods = { multiplier: 0.5 };
            await performPlayerAttack(target); 
            delete player.tempAttackMods;
            await new Promise(r => setTimeout(r, 150));
        }
        gameState.suppressTurnEnd = false;
        finalizePlayerAction();
        return; 
    }
    // [FIX START] The Red Mist (Barbaric Swing)
    else if (actionType === 'barbaric_swing') {
        addToLog(`${player.name} sees red!`, "text-red-600 font-bold");
        gameState.isPlayerTurn = false;
        gameState.suppressTurnEnd = true;
        for(let i=0; i<3; i++) {
            if(!target.isAlive() || gameState.battleEnded) break;
            player.tempAttackMods = { multiplier: 0.7 };
            await performPlayerAttack(target);
            delete player.tempAttackMods;
            await new Promise(r => setTimeout(r, 200));
        }
        gameState.suppressTurnEnd = false;
        finalizePlayerAction();
        return;
    }
    // [FIX END]

    else if (actionType === 'earthshaker') {
        addToLog(`${player.name} slams the ground!`, "text-orange-500 font-bold");
        // Primary
        player.tempAttackMods = { multiplier: 1.5 };
        await performPlayerAttack(target);
        delete player.tempAttackMods;
        
        // AOE
        const cx = target.x;
        const cy = target.y;
        const neighbors = [
            {x:cx+1, y:cy}, {x:cx-1, y:cy}, {x:cx, y:cy+1}, {x:cx, y:cy-1},
            {x:cx+1, y:cy+1}, {x:cx-1, y:cy-1}, {x:cx-1, y:cy+1}, {x:cx+1, y:cy-1}
        ];
        gameState.suppressTurnEnd = true;
        for (const n of neighbors) {
            const neighborEnemy = currentEnemies.find(e => e.x === n.x && e.y === n.y && e.isAlive());
            if (neighborEnemy && neighborEnemy !== target) {
                player.tempAttackMods = { multiplier: 0.5 };
                await performPlayerAttack(neighborEnemy);
                delete player.tempAttackMods;
            }
        }
        gameState.suppressTurnEnd = false;
        finalizePlayerAction();
        return;
    }
    // [FIX START] Heartseeker (Weak Point Targeting)
    else if (actionType === 'weak_point_attack') {
        // +10% Crit Chance, +10% Damage (interpreted as 1.10 multiplier)
        player.tempAttackMods = { multiplier: 1.10, critChanceFlat: 0.10 };
        addToLog(`${player.name} targets a weak point!`, "text-cyan-300");
        await performPlayerAttack(target);
        delete player.tempAttackMods;
    }
    // [FIX END]
    
    else if (actionType === 'arcane_sigil') {
        addToLog(`${player.name} inscribes an Arcane Sigil on ${target.name}!`, "text-purple-300 font-bold");
        // Apply permanent status (duration Infinity)
        applyStatusEffect(target, 'arcane_sigil', { duration: Infinity, multiplier: 1.2 }, player.name);
        finalizePlayerAction();
        return;
    }
    // [MODIFICATION END]

    // Default finalize for single-hit skills
    finalizePlayerAction();
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
    // [MODIFICATION START] Vital Stasis (Block Move)
    if (player.skillToggles && player.skillToggles['vital_stasis']) {
        addToLog("You are rooted in Vital Stasis and cannot move!", "text-green-400");
        isProcessingAction = false; // Unlock actions
        return;
    }
    // [MODIFICATION END]
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
            player.tilesMovedThisTurn++; // Track for Charge
            renderBattleGrid();
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

async function performPlayerAttack(attackTarget, isSecondStrike = false) {
    const weapon = player.equippedWeapon;
    const calcLog = {
        source: `Player Attack ${isSecondStrike ? '(2)' : ''}`,
        targetName: attackTarget.name,
        steps: []
    };
    let messageLog = [];
    let forceCritMultiplier = null;
    let attackEffects = { element: player.weaponElement };

    // --- Rogue: Assassinate Check ---
    if (player._classKey === 'rogue' && player.signatureAbilityToggleActive && attackTarget.hp === attackTarget.maxHp && !attackTarget.hasDealtDamageThisEncounter && !isSecondStrike) {
         const assassinateMultiplier = Math.max(2.0, weapon.effect?.critMultiplier || 1.5);
         messageLog.push(`Assassinate! (x${assassinateMultiplier})`);
         forceCritMultiplier = assassinateMultiplier;
         calcLog.steps.push({ description: "Assassinate", value: `Toggle Active (x${assassinateMultiplier})`, result: "" });
    }

    // --- Dwarf: Craftsmen's Intuition ---
    let attackDamageDice = [...weapon.damage]; 
    if (player.race === 'Dwarf' && player.level >= 20) {
        if (attackDamageDice[1] === 6) attackDamageDice[1] = 8;
        else if (attackDamageDice[1] === 8) attackDamageDice[1] = 10;
    }
    // --- Skill Tree: Weapon Mastery ---
    const isDexWeapon = ['Dagger', 'Thrusting Sword', 'Curved Sword', 'Lance', 'Bow'].includes(weapon.class);
    const isStrWeapon = ['Hand-to-Hand', 'Longsword', 'Axe', 'Hammer', 'Reaper'].includes(weapon.class);
    
    if ((isDexWeapon && player.hasSkill('weapon_mastery_dex')) || 
        (isStrWeapon && player.hasSkill('weapon_mastery_str'))) {
        // Note: getUpgradedDice needs to be available or we manually step up
        const DICE_PROGRESSION = [1, 2, 4, 6, 8, 10, 12, 14, 16, 20];
        const idx = DICE_PROGRESSION.indexOf(attackDamageDice[1]);
        if (idx > -1 && idx < DICE_PROGRESSION.length - 1) {
            attackDamageDice[1] = DICE_PROGRESSION[idx+1];
        }
        calcLog.steps.push({ description: "Weapon Mastery", value: "Dice Upgraded", result: `d${attackDamageDice[1]}` });
    }

    // --- Whetstone ---
    let allowCrit = false;
    if (player.statusEffects.buff_whetstone) {
        if (player.statusEffects.buff_whetstone.diceStepUp && !isSecondStrike) {
            const originalSides = attackDamageDice[1];
            // Simple step up logic for whetstone
             const DICE_PROGRESSION = [1, 2, 4, 6, 8, 10, 12, 14, 16, 20];
            const idx = DICE_PROGRESSION.indexOf(originalSides);
            if (idx > -1 && idx < DICE_PROGRESSION.length - 1) attackDamageDice[1] = DICE_PROGRESSION[idx+1];
        }
        if (player.statusEffects.buff_whetstone.critEnable) allowCrit = true;
    }

    // --- ROLL DAMAGE ---
    let rollResult = rollDice(attackDamageDice[0], attackDamageDice[1], `Player Attack`);
    let baseWeaponDamage = rollResult.total;
    calcLog.baseDamage = baseWeaponDamage;

    // --- Enchantment / Grease Bonus ---
    if (player.weaponElement !== 'none' && !isSecondStrike) {
        const bonus = rollDice(1, 8, `Enchantment`).total;
        baseWeaponDamage += bonus;
        messageLog.push(`+${bonus} ${player.weaponElement} dmg`);
    } else if (player.statusEffects.buff_elemental_grease && !isSecondStrike) {
        const grease = player.statusEffects.buff_elemental_grease;
        const bonus = rollDice(grease.damage[0], grease.damage[1], `Grease`).total;
        baseWeaponDamage += bonus;
        attackEffects.element = grease.element;
        messageLog.push(`+${bonus} ${grease.element} dmg`);
    }

    // --- Fighter Reroll ---
    if (player._classKey === 'fighter' && player.signatureAbilityToggleActive && rollResult.rolls.includes(1)) {
        const cost = attackDamageDice[1];
        if (player.mp >= cost) {
            player.mp -= cost;
            updateStatsView();
            const ones = rollResult.rolls.filter(r => r === 1).length;
            let rerollTotal = 0;
            for(let i=0; i<ones; i++) rerollTotal += Math.floor(Math.random() * attackDamageDice[1]) + 1;
            baseWeaponDamage = baseWeaponDamage - ones + rerollTotal;
            addToLog(`Fighter Reroll! New Base: ${baseWeaponDamage}`, 'text-yellow-300');
        }
    }

    // --- CALCULATE FINAL DAMAGE ---
    let statBonus = player.physicalDamageBonus;
    let damage = baseWeaponDamage;
    const statMultiplier = 1 + statBonus / 20;
    damage = Math.floor(damage * statMultiplier);
    damage += Math.floor(statBonus / 5);

    // --- [MODIFICATION START] Rage of the Sun (Weapon) ---
    if (attackEffects.element === 'fire') {
        let minMult = 1.0;
        let maxMult = 1.2;
        if (player.hasSkill('rage_of_the_sun')) {
            minMult = 1.2;
            maxMult = 1.5;
        }
        const fireMultiplier = minMult + (Math.random() * (maxMult - minMult));
        damage = Math.floor(damage * fireMultiplier);
    }
    // --- [MODIFICATION END] ---

    // --- Apply Modifiers (Skills, Combos, etc) ---
    // 1. Active Skill Mods
    if (player.tempAttackMods) {
        if (player.tempAttackMods.multiplier) damage = Math.floor(damage * player.tempAttackMods.multiplier);
        if (player.tempAttackMods.pierce) attackEffects.armorPierce = (attackEffects.armorPierce || 0) + player.tempAttackMods.pierce;
        if (player.tempAttackMods.critChanceFlat) player.tempCritChanceFlat = player.tempAttackMods.critChanceFlat;
    }

    // 2. Skill Tree Passives
    if (player.hasSkill('muscle_control')) damage = Math.floor(damage * 1.05);
    if (player.hasSkill('dextrous_control') && isDexWeapon) damage = Math.floor(damage * 1.10);
    if (player.hasSkill('power_strengthening') && isStrWeapon) damage = Math.floor(damage * 1.10);
    
    // [FIX START] Reckless Abandon (Damage Boost)
    if (player.skillToggles && player.skillToggles['barbaric_strength'] && ['Hand-to-Hand', 'Axe', 'Hammer'].includes(weapon.class)) {
        damage = Math.floor(damage * 1.10);
        // Defense penalty is handled in engine.js
    }
    // [FIX END]
    
    // [MODIFICATION START] Focal Agility (Weapon Resonance)
    if (player.hasSkill('focal_agility') && ['Scythe', 'Thrusting Sword', 'Curved Sword'].includes(weapon.class)) {
        damage = Math.floor(damage * 1.05);
    }
    // [MODIFICATION END]

    // Consecution
    if (player.hasSkill('consecution_technique') && isDexWeapon) {
        if (player.lastTargetId === attackTarget) {
            gameState.consecutionStacks = Math.min(3, (gameState.consecutionStacks || 0) + 1);
        } else {
            player.lastTargetId = attackTarget;
            gameState.consecutionStacks = 0;
        }
        if (gameState.consecutionStacks > 0) damage = Math.floor(damage * (1 + gameState.consecutionStacks * 0.10));
    }
    // Defense Exploitation
    if (player.hasSkill('defense_exploitation') && isDexWeapon) attackEffects.armorPierce = (attackEffects.armorPierce || 0) + 0.05;

    // Charge
    if (weapon.class === 'Lance' && player.hasSkill('charge') && player.tilesMovedThisTurn >= 2) {
        damage = Math.floor(damage * 1.5);
        messageLog.push("Momentum!");
    }
    
    // Honor Bound
    if (player.hasSkill('honor_bound_teaching') && ['Longsword', 'Lance'].includes(weapon.class)) {
         const livingEnemies = currentEnemies.filter(e => e.isAlive()).length;
         const allies = (player.npcAlly && player.npcAlly.isAlive()) ? 1 : 0;
         if (livingEnemies > (1 + allies)) damage = Math.floor(damage * 1.10);
    }

    // Elemental Passives
    // [MODIFICATION START] Fix Prismatic Convergence Crash
    const el = attackEffects.element;
    if (el !== 'none') {
        if (['fire', 'water', 'earth', 'wind'].includes(el) && player.hasSkill('classical_understanding')) damage = Math.floor(damage * 1.10);
        else if (['lightning', 'nature'].includes(el) && player.hasSkill('natural_study')) damage = Math.floor(damage * 1.10);
        else if (['light', 'void'].includes(el) && player.hasSkill('paradox_research')) damage = Math.floor(damage * 1.10);
        
        // Prismatic Convergence
        if (player.hasSkill('elemental_ignition')) {
             if (!gameState.usedElements.includes(el)) {
                damage = Math.floor(damage * 1.10);
                gameState.usedElements.push(el);
                addToLog("Prismatic Convergence!", "text-cyan-300");
            }
        }
    }
    // [MODIFICATION END]
    
    // --- Status & Weapon Effects ---
    if (player.statusEffects.buff_strength) damage = Math.floor(damage * player.statusEffects.buff_strength.multiplier);
    if (player.statusEffects.buff_enrage) damage = Math.floor(damage * 1.5);

    // --- CRIT CALCULATION ---
    let critChance = player.critChance + (player.tempCritChanceFlat || 0);
    if (weapon.class === 'Dagger') {
        critChance += 0.1;
        // [MODIFICATION START] Precision Training (Dagger)
        if (player.skillToggles && player.skillToggles['precision_training']) {
            critChance += 0.05;
        }
        // [MODIFICATION END]
    }
    if (allowCrit) critChance += 0.1;
    
    if (player.rollForEffect(critChance, 'Crit')) {
        let critMult = 1.5 + (player.tempAttackMods?.critMultFlat || 0);
        damage = Math.floor(damage * critMult);
        messageLog.push("CRITICAL!");
    }
    delete player.tempCritChanceFlat; // Cleanup

    // --- [MODIFICATION START] Piercing Fang (Thrusting Sword Toggle) ---
    if (weapon.class === 'Thrusting Sword' && player.skillToggles && player.skillToggles['piercing_fang']) {
        if (player.mp >= 5) {
            player.mp -= 5;
            attackEffects.armorPierce = (attackEffects.armorPierce || 0) + 0.10;
            addToLog("Piercing Fang!", "text-blue-300");
        }
    }
    // --- [MODIFICATION END] ---

    if (player.weaponElement === 'void') {
         // Void weapons inherently pierce 25% defense (if not already ignoring more)
         if (!attackEffects.armorPierce) attackEffects.armorPierce = 0.25;
    }

    // --- APPLY DAMAGE ---
    const damageResult = attackTarget.takeDamage(damage, attackEffects);
    const finalDamage = damageResult.damageDealt;
    
    addToLog(`You hit ${attackTarget.name} for <span class="font-bold text-yellow-300">${finalDamage}</span> damage. ${messageLog.join(' ')}`);

    // --- [MODIFICATION START] Blade Waltz (Curved Sword) ---
    if (weapon.class === 'Curved Sword' && player.hasSkill('certificate_of_dance')) {
        // +20% Dodge for 1 turn
        player.statusEffects.buff_blade_waltz = { duration: 2, chance: 0.20 }; 
        addToLog("Blade Waltz: You step through the flow of battle!", "text-green-300");
    }
    // --- [MODIFICATION END] ---

    // --- [MODIFICATION START] Might of Olympus (Weapon) ---
    if (attackEffects.element === 'lightning' && player.hasSkill('might_of_olympus') && !isSecondStrike && attackTarget.isAlive()) {
        if (player.rollForEffect(0.10, 'Might of Olympus')) {
            const followUpDmg = Math.floor(finalDamage * 0.25);
            addToLog(`Might of Olympus! A chaotic aftershock strikes!`, 'text-blue-300');
            const followUpResult = attackTarget.takeDamage(followUpDmg, { element: 'lightning', isMagic: false });
            addToLog(`The aftershock deals <span class="font-bold text-blue-300">${followUpResult.damageDealt}</span> damage.`);
            if(!attackTarget.isAlive() && !gameState.battleEnded) checkBattleStatus(true);
        }
    }
    // --- [MODIFICATION END] ---

    // --- ON HIT EFFECTS ---
    // Lifesteal
    if (finalDamage > 0 && attackTarget.speciesData.class !== 'Undead') {
        let lifesteal = 0;
        if (weapon.class === 'Reaper') lifesteal += 0.1;
        if (weapon.class === 'Scythe' && player.hasSkill('focal_agility')) lifesteal += 0.05;
        
        // [MODIFICATION START] Gaia's Love (Weapon Lifesteal)
        if (attackEffects.element === 'nature' && player.hasSkill('gaias_love')) {
            lifesteal *= 1.25; 
        }
        // [MODIFICATION END]

        if (lifesteal > 0) {
            const heal = Math.floor(finalDamage * lifesteal);
            if (heal > 0) {
                player.hp = Math.min(player.maxHp, player.hp + heal);
                addToLog(`You drain ${heal} HP.`);
                updateStatsView();
            }
        }
    }
    
    // Woodcutter Stack
    if (weapon.class === 'Axe' && player.hasSkill('woodcutter')) {
         if (player.lastTargetId === attackTarget) player.woodcutterStacks = Math.min(6, (player.woodcutterStacks || 0) + 1);
         else player.woodcutterStacks = 1;
    }

    if (!gameState.battleEnded && !gameState.suppressTurnEnd) {
        checkBattleStatus(isSecondStrike);
    }
}

async function performAttack(targetIndex) {
    const weapon = player.equippedWeapon;
    const target = currentEnemies[targetIndex];
    if (!target || !target.isAlive()) {
        isProcessingAction = false;
        renderBattleGrid();
        return;
    };

    // Range Check
    let weaponRange = weapon.range || 1;
    if (player.race === 'Pinionfolk' && player.level >= 20) weaponRange += 2;
    if (player.statusEffects.bonus_range) weaponRange += player.statusEffects.bonus_range.range;

    const dx = Math.abs(player.x - target.x);
    const dy = Math.abs(player.y - target.y);

    if(dx + dy > weaponRange){
        addToLog("You are too far away to attack!", 'text-red-400');
        isProcessingAction = false;
        return;
    }

    gameState.isPlayerTurn = false;

    // 1. Perform First Attack
    await performPlayerAttack(target, false);

    if (gameState.battleEnded) { isProcessingAction = false; return; }

    // 2. Handle Follow-ups
    if (player.equippedShield.effect?.attack_follow_up && target.isAlive()) {
        await new Promise(r => setTimeout(r, 250));
        performShieldFollowUpAttack(target);
    }

    const needsSecondAttack = (weapon.class === 'Hand-to-Hand' || weapon.effect?.doubleStrike);
    if (needsSecondAttack && target.isAlive()) {
        await new Promise(r => setTimeout(r, 250));
        addToLog("You strike again!", "text-yellow-300");
        await performPlayerAttack(target, true);
    }

    finalizePlayerAction();
}

async function castSpell(spellKey, targetIndex) {
    // [1. Void Trance Check]
    if (player.skillToggles && player.skillToggles['void_trance']) {
        addToLog("You cannot cast spells while in Void Trance!", "text-purple-400");
        isProcessingAction = false;
        return;
    }

    const spellData = SPELLS[spellKey];

    // [2. Target Validation]
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

    if ((spellData.type === 'st' || spellData.type === 'aoe') && (!target || !target.isAlive())) {
        isProcessingAction = false;
        renderBattleGrid();
        return;
    }

    // [3. Catalyst & Range Check]
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
    // Skill Tree: Range
    if (spellData.type === 'st') {
        if (player.hasSkill('spell_sniper')) spellRange += 1;
        if (player.hasSkill('focused_fire')) spellRange += 1;
    }
    if (spellData.type === 'aoe') {
        if (player.hasSkill('lobbed_fire')) spellRange += 1;
    }
    // Pinionfolk
    if (player.race === 'Pinionfolk' && player.level >= 20) {
        spellRange += 2;
    }
    if (catalyst.effect?.spell_sniper) spellRange *= (1 + catalyst.effect.spell_sniper);
    if (player.statusEffects.buff_magic_dust && player.statusEffects.buff_magic_dust.rangeIncrease) {
        spellRange += player.statusEffects.buff_magic_dust.rangeIncrease;
        addToLog("Magic Rock Dust extends your reach!", 'text-yellow-300');
    }

    if (spellData.type === 'st' || spellData.type === 'aoe' || (spellData.type === 'healing' && targetIndex === -1)) {
        const dx = Math.abs(player.x - target.x);
        const dy = Math.abs(player.y - target.y);
        if (dx + dy > spellRange) {
            addToLog("You are too far away to cast that spell!", 'text-red-400');
            isProcessingAction = false;
            return;
        }
    }

    // [4. MP Cost Calculation]
    let finalSpellCost = spell.cost;

    // Reductions
    let manaCostMod = 0;
    if (player.hasSkill('mana_control')) manaCostMod += 1;
    if (player.hasSkill('higher_mana_control')) manaCostMod += 2;
    if (player.hasSkill('innate_manipulation')) manaCostMod += 2;
    finalSpellCost = Math.max(1, finalSpellCost - manaCostMod);

    const armor = player.equippedArmor;
    if (catalyst.effect?.mana_discount) finalSpellCost = Math.max(1, finalSpellCost - catalyst.effect.mana_discount);
    if (armor.effect?.mana_discount) finalSpellCost = Math.max(1, finalSpellCost - armor.effect.mana_discount);

    // Increases (Toggles & Debuffs)
    if (player.skillToggles) {
        if (player.skillToggles['mana_overload']) finalSpellCost = Math.ceil(finalSpellCost * 2);
        if (player.skillToggles['power_blast'] && spellData.type === 'st') finalSpellCost += (10 * playerSpell.tier);
        if (player.skillToggles['ground_zero'] && spellData.type === 'aoe') finalSpellCost += (10 * playerSpell.tier);
        
        // Flux Control Toggles
        if (player.hasSkill('siege_protocol') && spellData.type === 'aoe') finalSpellCost = Math.ceil(finalSpellCost * 1.10);
        if (player.skillToggles['rain_of_ruin'] && spellData.type === 'aoe') finalSpellCost = Math.ceil(finalSpellCost * 1.50);
        if (player.skillToggles['singularity'] && spellData.type === 'aoe') finalSpellCost = Math.ceil(finalSpellCost * 1.25);

        // Concentration Toggles
        if (player.skillToggles['aetheric_lance'] && spellData.type === 'st') finalSpellCost += 10;
        if (player.skillToggles['mana_barrage'] && spellData.type === 'st') finalSpellCost = Math.ceil(finalSpellCost * 1.50);
    }

    // Class Toggles
    if (player._classKey === 'warlock' && player.signatureAbilityToggleActive) finalSpellCost = Math.ceil(finalSpellCost * 1.25);
    if (player._classKey === 'magus' && player.activeModeIndex > -1) finalSpellCost = Math.ceil(finalSpellCost * 1.30);
    
    if (player.statusEffects.magic_dampen) finalSpellCost = Math.floor(finalSpellCost * (1 / player.statusEffects.magic_dampen.multiplier));

    if (player.mp < finalSpellCost) {
        addToLog(`Not enough MP to cast ${spell.name}.`, 'text-red-400');
        isProcessingAction = false;
        return;
    }

    // Deduct MP
    player.mp -= finalSpellCost;
    
    // Update State
    gameState.isPlayerTurn = false;
    gameState.lastSpellElement = spellData.element;
    updateStatsView();

    addToLog(`You cast <span class="font-bold text-purple-300">${spell.name}</span>!`);

    let finalDamage = 0; 
    let primaryTargetKnockback = 0;

    // Consume Magic Rock Dust
    let usedMagicDust = false;
    if (player.statusEffects.buff_magic_dust) {
        usedMagicDust = true;
        delete player.statusEffects.buff_magic_dust;
    }

    // [5. Healing/Support Logic]
    if (spellData.element === 'healing') {
        let diceCount = spell.damage[0];
        const spellAmp = catalyst.effect?.spell_amp || 0;
        diceCount = Math.min(spell.cap, diceCount + spellAmp);

        let baseHeal = rollDice(diceCount, spell.damage[1], `Healing Spell: ${spell.name}`).total;
        
        const statBonus = player.magicalDamageBonus;
        const statMultiplier = 1 + statBonus / 20;
        const statFlatBonus = Math.floor(statBonus / 5);
        
        let healAmount = Math.floor(baseHeal * statMultiplier) + statFlatBonus;

        if (player.statusEffects.buff_fertilized && spellData.element === 'nature') {
            const healMultiplier = player.statusEffects.buff_fertilized.healMultiplier;
            healAmount = Math.floor(healAmount * healMultiplier);
            addToLog("The Fertilized Seed enhances the healing!", "text-green-200");
        }

        // Racial Bonuses
        if (player.race === 'Elementals' && spellData.element === player.elementalAffinity) {
            const damageBonus = (player.level >= 20) ? 1.20 : 1.10;
            healAmount = Math.floor(healAmount * damageBonus);
            if (player.level >= 20) {
                let extraDieRoll = rollDice(1, spell.damage[1], 'Elemental Evo Die').total;
                healAmount += Math.min(spell.cap * spell.damage[1], extraDieRoll);
            }
        }
        if (player.race === 'Dragonborn') {
            const damageBonus = (player.level >= 20) ? 1.20 : 1.10;
            healAmount = Math.floor(healAmount * damageBonus);
        }

        if (targetIndex === -1 && target) { 
             target.hp = Math.min(target.maxHp, target.hp + healAmount);
             addToLog(`You heal your ally ${target.name} for <span class="font-bold text-green-400">${healAmount}</span> HP.`, 'text-green-300');
             renderBattleGrid();
        } else {
             player.hp = Math.min(player.maxHp, player.hp + healAmount);
             addToLog(`You recover <span class="font-bold text-green-400">${healAmount}</span> HP.`, 'text-green-300');
             updateStatsView();
        }
    }
    else if (spellData.type === 'support') {
        if (spell.effect) {
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
                currentEnemies.forEach(enemy => {
                    if (enemy.isAlive()) {
                        enemy.statusEffects[spell.effect.type] = { ...spell.effect };
                    }
                });
                addToLog(`Your enemies are weakened by ${spell.name}!`, 'text-red-400');
            }
        }
    }

    // [6. Offensive Logic]
    else if (spellData.type === 'st' || spellData.type === 'aoe') {
        let diceCount = spell.damage[0];
        const spellAmp = catalyst.effect?.spell_amp || 0;
        diceCount = Math.min(spell.cap, diceCount + spellAmp);

        // Magic Rock Dust Step Up
        let spellDamageDice = [...spell.damage]; 
        if (usedMagicDust) {
            const originalSides = spellDamageDice[1];
             switch (originalSides) {
                 case 2: spellDamageDice[1] = 4; break;
                 case 3: spellDamageDice[1] = 4; break;
                 case 4: spellDamageDice[1] = 6; break;
                 case 6: spellDamageDice[1] = 8; break;
                 case 8: spellDamageDice[1] = 10; break;
                 case 10: spellDamageDice[1] = 12; break;
             }
             if (spellDamageDice[1] !== originalSides) addToLog(`Magic Rock Dust sharpens the spell!`);
        }
        
        // Harmonic Attunement (Min Roll 2)
        let rollObj = rollDice(diceCount, spellDamageDice[1], `Player Spell: ${spell.name}`);
        if (player.hasSkill('harmonic_attunement')) {
            let modified = false;
            for (let i = 0; i < rollObj.rolls.length; i++) {
                if (rollObj.rolls[i] === 1) {
                    rollObj.rolls[i] = 2;
                    modified = true;
                }
            }
            if (modified) {
                rollObj.total = rollObj.rolls.reduce((a, b) => a + b, 0);
            }
        }
        let baseDamage = rollObj.total;
        
        // Unified Damage Formula
        const statBonus = player.magicalDamageBonus;
        const statMultiplier = 1 + statBonus / 20;
        const statFlatBonus = Math.floor(statBonus / 5);

        let damage = Math.floor(baseDamage * statMultiplier) + statFlatBonus;

        // --- Modifiers ---
        if (player.hasSkill('focus_point')) damage = Math.floor(damage * 1.05);
        if (player.skillToggles && player.skillToggles['mana_overload']) {
            damage = Math.floor(damage * 1.5);
            addToLog("Mana Overload!", "text-purple-400");
        }

        if (spellData.type === 'st') {
            if (player.hasSkill('concentration_training')) damage = Math.floor(damage * 1.10);
            if (player.skillToggles && player.skillToggles['power_blast']) damage = Math.floor(damage * 1.10);
        }

        if (spellData.type === 'aoe') {
             if (player.hasSkill('flux_control')) damage = Math.floor(damage * 1.10);
             if (player.skillToggles && player.skillToggles['ground_zero']) {
                 damage = Math.floor(damage * 1.20); 
                 addToLog("Ground Zero Impact!", "text-red-500");
            }
            if (player.skillToggles && player.skillToggles['singularity']) {
                damage = Math.floor(damage * 2.0);
                addToLog("Singularity Compression!", "text-purple-400 font-bold");
            }
        }

        // Elemental Ignition (Prismatic Convergence)
        if (player.hasSkill('elemental_ignition')) {
            if (!gameState.usedElements.includes(spellData.element)) {
                damage = Math.floor(damage * 1.10);
                gameState.usedElements.push(spellData.element);
                addToLog("Prismatic Convergence!", "text-cyan-300");
            }
        }
        
        // Elemental Mastery
        if (['fire', 'water', 'earth', 'wind'].includes(spellData.element) && player.hasSkill('classical_understanding')) damage = Math.floor(damage * 1.10);
        if (['lightning', 'nature'].includes(spellData.element) && player.hasSkill('natural_study')) damage = Math.floor(damage * 1.10);
        if (['light', 'void'].includes(spellData.element) && player.hasSkill('paradox_research')) damage = Math.floor(damage * 1.10);

        // Food Buffs
        if (player.foodBuffs.magical_damage) {
            damage = Math.floor(damage * player.foodBuffs.magical_damage.value);
        }

        // Racial Bonuses
        if (player.race === 'Elementals' && spellData.element === player.elementalAffinity) {
            const damageBonus = (player.level >= 20) ? 1.20 : 1.10;
            damage = Math.floor(damage * damageBonus);
            if (player.level >= 20) {
                let extraDieRoll = rollDice(1, spellDamageDice[1], 'Elemental Evo Die').total;
                let cappedExtraDamage = Math.min( (spell.cap * spellDamageDice[1]) - damage, extraDieRoll);
                damage += cappedExtraDamage;
            }
        } else if (player.race === 'Dragonborn') {
            const damageBonus = (player.level >= 20) ? 1.20 : 1.10;
            damage = Math.floor(damage * damageBonus);
        }

        // Rage of the Sun
        if (spellData.element === 'fire') {
            let minMult = 1.0;
            let maxMult = 1.2;
            if (player.hasSkill('rage_of_the_sun')) {
                minMult = 1.2;
                maxMult = 1.5;
            }
            const fireMultiplier = minMult + (Math.random() * (maxMult - minMult));
            damage = Math.floor(damage * fireMultiplier);
            addToLog(`Fire Fluctuation! (x${fireMultiplier.toFixed(2)})`, 'text-orange-300');
        }

        // Harmonic Escalation (Target Stacks)
        if (player.hasSkill('harmonic_escalation') && target.harmonicStacks) {
            const bonus = Math.min(0.5, target.harmonicStacks * 0.1); // Max 50%
            damage = Math.floor(damage * (1 + bonus));
            addToLog(`Harmonic Resonance! (+${(bonus*100).toFixed(0)}%)`, 'text-cyan-300');
        }

        // Crit
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

        // Overdrive
        let overdriveChance = catalyst.effect?.overdrive?.chance || 0;
        if (overdriveChance && player.rollForEffect(overdriveChance, 'Overdrive Tome')) {
            damage = Math.floor(damage * catalyst.effect.overdrive.multiplier);
            const selfDamage = Math.floor(player.maxHp * catalyst.effect.overdrive.self_damage);
            player.hp -= selfDamage;
            addToLog(`Overdrive! Damage x3! You take ${selfDamage} backlash damage!`, 'text-purple-500 font-bold');
            updateStatsView();
        }

        // Multi-Hit Loop Setup
        let iterations = 1;
        let damageMultiplier = 1.0;
        if (spellData.type === 'aoe' && player.skillToggles && player.skillToggles['rain_of_ruin']) {
            iterations = 3;
            damageMultiplier = 0.60;
            addToLog("Rain of Ruin: Triple Cast!", "text-orange-400");
        }
        if (spellData.type === 'st' && player.skillToggles && player.skillToggles['mana_barrage']) {
            iterations = 3;
            damageMultiplier = 0.75;
            addToLog("Mana Barrage!", "text-blue-400");
        }

        const spellEffects = {
            isMagic: true,
            element: spellData.element,
            spell_penetration: catalyst.effect?.spell_penetration || 0
        };

        // Aetheric Lance Passive
        if (spellData.type === 'st' && player.hasSkill('aetheric_lance')) {
            spellEffects.spell_penetration = (spellEffects.spell_penetration || 0) + 0.2;
        }

        // Void Bypass
        const voidBypassChance = 0.20 + (tierIndex * 0.05); 
        if (spellData.element === 'void' && player.rollForEffect(voidBypassChance, 'Spell Void Bypass')) {
            spellEffects.ignore_defense = true;
            addToLog(`Your void spell tears a hole in reality, bypassing defenses!`, 'text-purple-500');
        }

        // --- ATTACK EXECUTION LOOP ---
        for (let i = 0; i < iterations; i++) {
            let currentHitDamage = Math.floor(damage * damageMultiplier);

            // Apply Primary Damage
            const damageResultPrimary = target.takeDamage(currentHitDamage, spellEffects);
            finalDamage = damageResultPrimary.damageDealt;
            primaryTargetKnockback = damageResultPrimary.knockback;
            
            if (iterations > 1) addToLog(`Volley ${i+1}: hits ${target.name} for <span class="font-bold text-purple-400">${finalDamage}</span> damage.`);
            else addToLog(`It hits ${target.name} for <span class="font-bold text-purple-400">${finalDamage}</span> ${spellData.element} damage.`);

            // Harmonic Escalation Increment
            if (finalDamage > 0 && player.hasSkill('harmonic_escalation')) {
                target.harmonicStacks = (target.harmonicStacks || 0) + 1;
            }

            // Primary Target Effects
            if (finalDamage > 0 && target.isAlive()) { 
                if (spellData.element === 'water') {
                    addToLog(`${target.name} is drenched!`, 'text-blue-400');
                    applyStatusEffect(target, 'drenched', { duration: 3, move: -1, multiplier: 0.75 }, player.name);
                }
                
                const earthParalyzeChance = 0.10 + (tierIndex * 0.05);
                if (spellData.element === 'earth' && player.rollForEffect(earthParalyzeChance, 'Spell Earth Paralyze')) {
                    if (!target.statusEffects.paralyzed) {
                        applyStatusEffect(target, 'paralyzed', { duration: 2 }, player.name);
                        addToLog(`${target.name} is paralyzed!`, 'text-yellow-500');
                    }
                }

                if (spellData.element === 'wind') {
                    await applyKnockback(target, player, 1);
                    addToLog(`${target.name} is blasted back!`, 'text-cyan-400');
                    if (!target.isAlive() && !gameState.battleEnded) checkBattleStatus(true);
                }

                let natureLifestealPercent = 0.10 + (tierIndex * 0.05); 
                if (player.hasSkill('gaias_love')) natureLifestealPercent *= 1.25;
                if (spellData.element === 'nature') {
                    const lifestealAmount = Math.floor(finalDamage * natureLifestealPercent);
                    if (lifestealAmount > 0) {
                        player.hp = Math.min(player.maxHp, player.hp + lifestealAmount);
                        addToLog(`You drain <span class="font-bold text-green-400">${lifestealAmount}</span> HP.`, 'text-green-300');
                        updateStatsView();
                    }
                }

                const lightCleanseChance = 0.20 + (tierIndex * 0.05);
                if (spellData.element === 'light' && player.rollForEffect(lightCleanseChance, 'Spell Light Cleanse')) {
                    const debuffs = Object.keys(player.statusEffects).filter(key => ['poison', 'paralyzed', 'petrified', 'drenched', 'toxic'].includes(key));
                    if (debuffs.length > 0) {
                        delete player.statusEffects[debuffs[0]];
                        addToLog(`Cleansed ${debuffs[0]}!`, 'text-yellow-200');
                    }
                }

                // Aetheric Lance Toggle (Hit Behind)
                if (spellData.type === 'st' && player.skillToggles && player.skillToggles['aetheric_lance']) {
                    const dx = Math.sign(target.x - player.x);
                    const dy = Math.sign(target.y - player.y);
                    const behindX = target.x + dx;
                    const behindY = target.y + dy;
                    const enemyBehind = currentEnemies.find(e => e.isAlive() && e.x === behindX && e.y === behindY);
                    if (enemyBehind) {
                        const pierceDmg = Math.floor(currentHitDamage * 0.5);
                        const pierceResult = enemyBehind.takeDamage(pierceDmg, spellEffects);
                        addToLog(`Aetheric Lance pierces through to ${enemyBehind.name} for ${pierceResult.damageDealt} damage!`, "text-cyan-300");
                        if (!enemyBehind.isAlive()) checkBattleStatus(true);
                    }
                }
            } // End Primary Effects

            // Might of Olympus (Lightning Double Strike)
            if (spellData.element === 'lightning' && player.hasSkill('might_of_olympus') && !gameState.battleEnded && target.isAlive()) {
                 if (player.rollForEffect(0.10, 'Might of Olympus')) {
                    const followUpDmg = Math.floor(finalDamage * 0.25);
                    addToLog(`Might of Olympus! A chaotic aftershock strikes!`, 'text-blue-300');
                    const followUpResult = target.takeDamage(followUpDmg, { isMagic: true, element: 'lightning' });
                    addToLog(`The aftershock deals <span class="font-bold text-blue-300">${followUpResult.damageDealt}</span> damage.`);
                    if(!target.isAlive() && !gameState.battleEnded) checkBattleStatus(true);
                 }
            }

            // Magus Chain/Wide Logic
            if (target.isAlive() && player._classKey === 'magus' && player.activeModeIndex > -1) {
                const mode = player.signatureAbilityData.modes[player.activeModeIndex];
                if (mode === "Chain Magic" && spellData.type === 'st') {
                    // ... (Existing Chain Logic - simplified for length) ...
                     let closestEnemy = null;
                    let minDist = Infinity;
                    currentEnemies.forEach(enemy => {
                        if (enemy.isAlive() && enemy !== target) {
                            const dist = Math.abs(target.x - enemy.x) + Math.abs(target.y - enemy.y);
                            const distFromPlayer = Math.abs(player.x - enemy.x) + Math.abs(player.y - enemy.y);
                            if (distFromPlayer <= spellRange && dist < minDist) {
                                minDist = dist;
                                closestEnemy = enemy;
                            }
                        }
                    });
                    if (closestEnemy) {
                        const chainDamage = Math.floor(finalDamage * 0.5);
                        const chainRes = closestEnemy.takeDamage(chainDamage, spellEffects);
                        addToLog(`Chain Magic arcs to ${closestEnemy.name} for ${chainRes.damageDealt}!`, 'text-cyan-300');
                        if (!closestEnemy.isAlive()) checkBattleStatus(true);
                    }
                } else if (mode === "Wide Magic" && spellData.type === 'aoe') {
                     // ... (Existing Wide Logic) ...
                     addToLog("Wide Magic empowers the AOE!", 'text-cyan-300');
                     const splashMultiplier = spell.splash !== undefined ? spell.splash : 0.5;
                     const splashDamage = Math.floor(finalDamage * splashMultiplier);
                     for (let dx = -1; dx <= 1; dx++) {
                        for (let dy = -1; dy <= 1; dy++) {
                            if (dx === 0 && dy === 0) continue;
                            const splashTarget = currentEnemies.find(e => e.isAlive() && e.x === target.x + dx && e.y === target.y + dy);
                            if (splashTarget) {
                                const splashRes = splashTarget.takeDamage(splashDamage, spellEffects);
                                addToLog(`Wide Magic splash hits ${splashTarget.name} for ${splashRes.damageDealt}.`);
                                if (!splashTarget.isAlive()) checkBattleStatus(true);
                            }
                        }
                    }
                }
            }
            // Standard Splash Logic (Singularity Blocks This)
            else if (spellData.type === 'aoe' && !(player.skillToggles && player.skillToggles['singularity'])) { 
                 currentEnemies.forEach(async (enemy, index) => { 
                     if (index !== targetIndex && enemy.isAlive()) {
                         if (Math.abs(target.x - enemy.x) + Math.abs(target.y - enemy.y) === 1) {
                            let splashMultiplier = spell.splash !== undefined ? spell.splash : 0.5;
                            if (player.hasSkill('concentrated_spread')) splashMultiplier += 0.10; 
                            if (player.hasSkill('siege_protocol')) splashMultiplier += 0.15;
                            
                            let baseSplashSource = currentHitDamage;
                            // Ground Zero reduces splash source unless Aftershock is present
                            if (player.skillToggles && player.skillToggles['ground_zero'] && !player.hasSkill('aftershock')) {
                                baseSplashSource = Math.floor(currentHitDamage / 1.2); 
                            }
                            
                            const splashDamage = Math.floor(baseSplashSource * splashMultiplier);
                             if (splashDamage > 0) {
                                 const damageResultSplash = enemy.takeDamage(splashDamage, spellEffects); 
                                 addToLog(`Splash hits ${enemy.name} for ${damageResultSplash.damageDealt}.`);
                                 if (!enemy.isAlive()) checkBattleStatus(true);
                             }
                         }
                     }
                 });
            }

            // Lightning Chain (Standard)
            const lightningChainChance = 0.10 + (tierIndex * 0.05); 
            if (!gameState.battleEnded && spellData.element === 'lightning' && player.rollForEffect(lightningChainChance, 'Spell Lightning Chain')) {
                // ... (Existing Lightning Chain Logic) ...
                 let potentialTargets = currentEnemies.filter(e => e.isAlive() && e !== target);
                 if (potentialTargets.length > 0) {
                     // Simple closest target find
                    let nextTarget = potentialTargets.reduce((prev, curr) => {
                        let prevDist = Math.abs(target.x - prev.x) + Math.abs(target.y - prev.y);
                        let currDist = Math.abs(target.x - curr.x) + Math.abs(target.y - curr.y);
                        return (currDist < prevDist) ? curr : prev;
                    });
                    if(nextTarget) {
                        const chainDamage = Math.floor(finalDamage * 0.5);
                        const chainRes = nextTarget.takeDamage(chainDamage, spellEffects);
                        addToLog(`Lightning arcs to ${nextTarget.name} for ${chainRes.damageDealt}!`, 'text-blue-400');
                        if(!nextTarget.isAlive()) checkBattleStatus(true);
                    }
                 }
            }

            // Check battle end after iteration
            if (gameState.battleEnded) break;

        } // End Loop

    } // End Offensive Block

    // [7. Post-Cast Triggers]
    if (!gameState.battleEnded) {
        // Monolith of Earth
        if (spellData.element === 'earth' && player.hasSkill('monolith_of_earth')) {
             player.statusEffects.buff_monolith = { duration: 2, multiplier: 1.10 }; 
             addToLog("Monolith of Earth: Defense Up!", "text-yellow-300");
        }
        // Unending Winds
        if (spellData.element === 'wind' && player.hasSkill('unending_winds')) {
             if (player.statusEffects.buff_haste) {
                 player.statusEffects.buff_haste.duration += 1;
                 addToLog("Unending Winds extends your Haste!", "text-cyan-300");
             }
             if (player.statusEffects.buff_hermes) {
                 player.statusEffects.buff_hermes.duration += 1;
                 addToLog("Unending Winds extends Hermes' Trickery!", "text-cyan-300");
             }
        }

        checkBattleStatus(false);
    }

    // [8. Finalize]
    // Handle Follow-ups / Wind Extra Turn logic (Simplified)
    let followUpActionPending = false;
    if (!gameState.battleEnded) {
        let spellFollowUpChance = player.equippedWeapon.effect?.spellFollowUp ? 1 : 0;
        if (player._classKey === 'warlock' && player.signatureAbilityToggleActive && spellFollowUpChance > 0) spellFollowUpChance *= 1.5;
        
        const validFollowUpTarget = (target && target.isAlive() && target !== player.npcAlly) ? target : currentEnemies.find(e => e.isAlive());
        
        if (validFollowUpTarget && player.rollForEffect(spellFollowUpChance, 'Spell Follow-up')) {
             followUpActionPending = true;
            setTimeout(async () => {
                 if (gameState.battleEnded) { finalizePlayerAction(); return; }
                 performSpellFollowUpAttack(validFollowUpTarget);
                 await new Promise(resolve => setTimeout(resolve, 50));
                 finalizePlayerAction();
            }, 250);
        } else {
            const windExtraTurnChance = (spellData && spellData.element === 'wind' && tierIndex >= 0) ? 0.1 + (tierIndex * 0.05) : 0;
            const anyEnemiesAlive = currentEnemies.some(e => e.isAlive());
            if (windExtraTurnChance > 0 && anyEnemiesAlive && player.rollForEffect(windExtraTurnChance, 'Spell Wind Turn')) {
                followUpActionPending = true;
                addToLog("The swirling winds grant you another turn!", "text-cyan-300 font-bold");
                setTimeout(beginPlayerTurn, 150);
            }
        }
    } else {
        finalizePlayerAction();
    }

    if (!followUpActionPending) {
         finalizePlayerAction();
    }
}

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
            gameState.isPlayerTurn = false;
            
            // 1. Check for success (80% base chance)
            if (player.statusEffects.buff_voidwalker || player.rollForEffect(0.8, 'Flee')) {
                addToLog(`You successfully escaped!`, 'text-green-400');
                
                // 2. Handle Training vs. Real Encounter
                if (preTrainingState !== null) {
                    // Training: Restore resources and return to Training Grounds (No penalty/cleanup needed)
                    player.hp = preTrainingState.hp;
                    player.mp = preTrainingState.mp;
                    preTrainingState = null;
                    updateStatsView();
                    setTimeout(renderTrainingGrounds, 1000);
                } else {
                    // Real Encounter (Map-based or Ambush): Use endBiomeRun to handle penalties/cleanup
                    // This function in engine.js handles the tiered penalty and the safe 'rest' node exit.
                    setTimeout(() => endBiomeRun('flee'), 500);
                }
                
            } else {
                // Failure: Proceed to enemy turn
                addToLog(`You failed to escape!`, 'text-red-400');
                finalizePlayerAction(); 
            }
            break;
        case 'skills':
            renderBattle('skills');
            break;

        case 'use_skill':
            // actionData is the skillId (string)
            const skillId = actionData;
            const skillNode = SKILL_TREE[skillId];
            
            if (!skillNode) return;

            // [MODIFICATION START] Enforce Weapon Requirements
            const reqCheck = checkSkillRequirements(skillId);
            if (!reqCheck.allowed) {
                // Determine if it's a general str/dex requirement for better feedback
                if (SKILL_WEAPON_REQ[skillId] === STR_WEAPONS) addToLog("Requires a Strength weapon!", "text-red-400");
                else if (SKILL_WEAPON_REQ[skillId] === DEX_WEAPONS) addToLog("Requires a Dexterity weapon!", "text-red-400");
                else addToLog(`Requires a ${reqCheck.required}!`, "text-red-400");
                return;
            }
            // [MODIFICATION END]

            if (skillNode.type === 'toggle') {                // Toggle Logic
                const toggleKey = skillNode.effect.toggle;
                player.skillToggles[toggleKey] = !player.skillToggles[toggleKey];
                addToLog(`${skillNode.name} is now ${player.skillToggles[toggleKey] ? 'Active' : 'Inactive'}.`, "text-yellow-300");
                renderBattle('skills'); // Re-render to update button state
            } 
            else if (skillNode.type === 'active') {
                // Active Skill Logic - Setup Targeting
                const cost = skillNode.effect.cost;
                if (player.mp < cost) {
                    addToLog("Not enough MP!", "text-red-400");
                    return;
                }
                
                gameState.currentActiveSkill = skillId; // Store which skill we are using
                gameState.action = 'skill_target'; // Set state to targeting mode
                
                addToLog(`Select a target for ${skillNode.name}.`, "text-cyan-300");
                
                // Render grid with attack highlighting
                // We reuse the 'attackable' class for melee skills
                // You might want 'magic-attackable' if the skill has range, but for now, assume melee/weapon range
                const cells = document.querySelectorAll('.grid-cell');
                let range = player.equippedWeapon.range || 1;
                // Pinionfolk/Passive range bonuses logic here...
                 if (player.race === 'Pinionfolk' && player.level >= 20) range += 2;
                 if (player.statusEffects.bonus_range) range += player.statusEffects.bonus_range.range;

                // Manual Highlighting logic since we aren't calling 'attack' case
                renderBattleGrid(); // Reset grid
                setTimeout(() => { // Wait for render
                    document.querySelectorAll('.grid-cell').forEach(c => {
                         const cx = parseInt(c.dataset.x);
                         const cy = parseInt(c.dataset.y);
                         const dx = Math.abs(player.x - cx);
                         const dy = Math.abs(player.y - cy);
                         // Basic check for enemy existence
                         const enemy = currentEnemies.find(e => e.x === cx && e.y === cy && e.isAlive());
                         if (dx + dy <= range && enemy) {
                             c.classList.add('attackable');
                         }
                    });
                }, 0);
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
    const struggleDamage = Math.floor((rollDice(1, 6, 'Struggle').total + Math.floor(player.strength / 2)) * 0.5);

    addToLog(`You struggle violently inside the beast!`, 'text-yellow-300');
    // --- MODIFIED: Use damageDealt ---
    const { damageDealt } = swallower.takeDamage(struggleDamage, { ignore_defense: 0.5 }); // Bypasses 50% defense
    addToLog(`You dealt <span class="font-bold text-yellow-300">${damageDealt}</span> damage from the inside!`);

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
        // --- MODIFIED: INT-based escape ---
        const escapeChance = 0.05 + (player.intelligence / 100); // 5% base + 1% per INT
        addToLog(`You try to find a weak point... (Escape Chance: ${(escapeChance * 100).toFixed(0)}%)`, 'text-gray-400');
        
        if (player.rollForEffect(escapeChance, 'Struggle Escape')) {
        // --- END MODIFIED ---
            delete player.statusEffects.swallowed;
            addToLog("You find an opening and squirm free!", 'text-green-300');
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
        gameState.activeDrone = null;
        gameState.markedTarget = null;
        addToLog(`All enemies defeated!`, 'text-green-400 font-bold');

        // --- NEW: Increment Biome Clears ---
        if (gameState.currentBiome && preTrainingState === null) {
            if (!player.biomeClears) player.biomeClears = {}; // Safety check
            player.biomeClears[gameState.currentBiome] = (player.biomeClears[gameState.currentBiome] || 0) + 1;
            console.log(`Biome ${gameState.currentBiome} clears: ${player.biomeClears[gameState.currentBiome]}`);
        }
        // --- END NEW ---

        // Handle tutorial battle end
        const isTutorialBattle = tutorialState.isActive && tutorialState.sequence[tutorialState.currentIndex]?.trigger?.type === 'enemy_death';
        if (isTutorialBattle) {
            advanceTutorial();
            return true;
        }
        
        // --- MODIFICATION: Check if this was a boss fight ---
        if (gameState.currentMap && gameState.currentEncounterType === 'boss') {
            addToLog(`Boss defeated! The expedition is a success!`, 'text-green-400 font-bold');
            setTimeout(() => endBiomeRun('victory'), 1500);
        } else {
            setTimeout(renderPostBattleMenu, 1000);
        }
        // ------------------------------

        return true;
    }
    return false;
}

function checkBattleStatus(isReaction = false) {
    if (gameState.battleEnded) return;

    const defeatedEnemiesThisCheck = [];

    // Iterate backwards because we might remove elements
    for (let i = currentEnemies.length - 1; i >= 0; i--) {
        const enemy = currentEnemies[i];

        // Check if HP is 0 or less
        if (enemy.hp <= 0) {

            // --- Revival Logic ---
            let revived = false;
            
            // [MODIFICATION START] Divine Blessing
            let preventRevive = false;
            if (player.hasSkill('divine_blessing') && enemy.killedByLight) {

                if (enemy.speciesData.class === 'Undead' && !enemy.revived && enemy.ability !== 'alive_again') {
                     preventRevive = true;
                     addToLog("Divine Blessing prevents the undead from rising!", "text-yellow-300");
                }

                if (enemy.ability === 'alive_again' && enemy.reviveChance < 1.0) {
                     preventRevive = true;
                     addToLog("Divine Blessing burns away the lingering soul!", "text-yellow-300");
                }
            }
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
            
            // --- NEW: Determine Quest/Reward Multiplier ---
            const questMultiplier = enemy.isBoss ? 5 : 1;

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
                // Apply multiplier to gold
                player.gold += enemy.goldReward * questMultiplier; // <-- MODIFIED
                addToLog(`You found <span class="font-bold">${enemy.goldReward * questMultiplier}</span> G.`, 'text-yellow-400');
                
                // Apply multiplier to XP
                player.gainXp(enemy.xpReward * questMultiplier); // <-- MODIFIED
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
                    // --- FIX: Safety check for itemDetails ---
                    // If itemDetails is null (invalid item key), default to "Unknown Item" to prevent crash
                    const itemName = itemDetails ? itemDetails.name : "Unknown Item";
                    
                    addToLog(`DEBUG: Loot Chance (${itemName}): Base = ${(baseDropChance * 100).toFixed(1)}%, Luck = +${(playerLuckBonus * 100).toFixed(1)}%, Mods = x${(player.foodBuffs.loot_chance?.value || 1).toFixed(1)} x${(player.race === 'Dwarf' && itemDetails && (WEAPONS[item] || ARMOR[item] || SHIELDS[item] || CATALYSTS[item])) ? 1.25 : 1} x${(player.equippedWeapon.effect?.lootBonus && itemDetails && (itemDetails.class || ['Armor', 'Weapon'].includes(itemDetails.type))) ? 2 : 1} => Final = ${(finalDropChance * 100).toFixed(1)}%`, 'text-gray-500');
                    // --- END FIX ---
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
            // --- NEW: Casino Clue Drop Logic ---
            if (player.unlocks.arcaneCasino && preTrainingState === null) {
                const paperClues = [
                    'ripped_paper_1', 
                    'ripped_paper_2', 
                    'ripped_paper_3', 
                    'ripped_paper_4', 
                    'ripped_paper_5'
                ];
                // Find clues the player does *not* have in their inventory
                const missingClues = paperClues.filter(clue => !player.inventory.items[clue]);

                if (missingClues.length > 0) {
                    // 5% chance to drop a missing clue
                    if (player.rollForEffect(0.05, 'Casino Clue Drop')) {
                        // Drop a random *missing* clue
                        const clueToDrop = missingClues[Math.floor(Math.random() * missingClues.length)];
                        player.addToInventory(clueToDrop, 1, true); // This will log the drop
                    }
                }
            }
            // --- END NEW: Casino Clue Drop Logic --
                if (player.activeQuest && player.activeQuest.category === 'extermination') {
                    const quest = getQuestDetails(player.activeQuest);
                    if (quest && quest.target === enemy.speciesData.key) {
                        player.questProgress += questMultiplier; // <-- MODIFIED
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
    if (player.npcAlly && player.npcAlly.hp <= 0) {
        // player.npcAlly.isFled = true; // This is redundant, takeDamage handles it.
        const allyName = player.npcAlly.name; // Get name *before* nulling
        addToLog(`<span class="font-bold text-red-500">${allyName} has been defeated and fled the battle!</span>`, "text-red-500");
        addToLog(`<span class="font-bold text-red-700">${allyName} is gone for good, taking all their equipment...</span>`, "text-red-700");
        
        player.npcAlly = null; // <<< THIS IS THE FIX: Remove ally from player
        player.encountersSinceLastPay = 0; // Reset counter
        
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
     if (gameState.battleEnded) return; 

    // [MODIFICATION START] Toggle Regen Effects
    if (player.skillToggles && player.skillToggles['void_trance']) {
        const manaRegen = Math.floor(player.maxMp * 0.20);
        if (manaRegen > 0 && player.mp < player.maxMp) {
            player.mp = Math.min(player.maxMp, player.mp + manaRegen);
            addToLog(`Void Trance restores <span class="font-bold text-blue-300">${manaRegen}</span> MP.`, "text-blue-300");
        }
    }
    if (player.skillToggles && player.skillToggles['vital_stasis']) {
        const hpRegen = Math.floor(player.maxHp * 0.05);
        if (hpRegen > 0 && player.hp < player.maxHp) {
            player.hp = Math.min(player.maxHp, player.hp + hpRegen);
            addToLog(`Vital Stasis regenerates <span class="font-bold text-green-300">${hpRegen}</span> HP.`, "text-green-300");
        }
    }

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

    const weaponEffect = player.equippedWeapon.effect;
    const shieldEffect = player.equippedShield.effect;
    const armorEffect = player.equippedArmor.effect;
    const catalystEffect = player.equippedCatalyst.effect;

    const hpRegenPercent = (weaponEffect?.hp_regen_percent || 0) + (shieldEffect?.hp_regen_percent || 0) + (armorEffect?.hp_regen_percent || 0) + (catalystEffect?.hp_regen_percent || 0);
    const mpRegenPercent = (weaponEffect?.mp_regen_percent || 0) + (shieldEffect?.mp_regen_percent || 0) + (armorEffect?.mp_regen_percent || 0) + (catalystEffect?.mp_regen_percent || 0);

    if (hpRegenPercent > 0 && player.hp < player.maxHp) {
         const healAmount = Math.floor(player.maxHp * hpRegenPercent);
         if (healAmount > 0) {
            player.hp = Math.min(player.maxHp, player.hp + healAmount);
            addToLog(`Your gear regenerates <span class="font-bold text-green-400">${healAmount}</span> HP.`, 'text-yellow-300');
         }
    }
    if (mpRegenPercent > 0 && player.mp < player.maxMp) {
         const regenAmount = Math.floor(player.maxMp * mpRegenPercent);
         if (regenAmount > 0) {
            player.mp = Math.min(player.maxMp, player.mp + regenAmount);
            addToLog(`Your gear restores <span class="font-bold text-blue-400">${regenAmount}</span> MP.`, 'text-blue-300');
         }
    }
    // --- END NEW ---
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
        // --- MODIFIED: Handle new poison specs ---
        if (effectKey === 'poison' && effects[effectKey]) {
            // This is 'Poison Web' (rarity d4)
            const poisonDmg = effects[effectKey].damage || Math.floor(enemy.maxHp * 0.05); // Use specific damage if available
            enemy.hp -= poisonDmg;
            addToLog(`${enemy.name} takes <span class="font-bold text-green-600">${poisonDmg}</span> poison damage.`, 'text-green-600');
        }
        if (effectKey === 'toxic' && effects[effectKey]) {
            // This is 'True Poison' (rarity d8)
            const toxicDmg = effects[effectKey].damage || Math.floor(enemy.maxHp * 0.1); // Use specific damage if available
            enemy.hp -= toxicDmg;
            addToLog(`${enemy.name} takes <span class="font-bold text-green-800">${toxicDmg}</span> damage from the toxin!`, 'text-green-800');
        }
        // --- END MODIFIED ---
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

            // --- FIX: CHECK IF ALLY FLED OR BATTLE ENDED ---
            // Check if the enemy's attack caused the ally to flee or if all enemies were defeated
            // (e.g., by a reflect effect from the ally)
            if (!gameState.battleEnded) {
                checkBattleStatus(true); // isReaction = true
                if (gameState.battleEnded) return; // Stop if battle ended
            }
            // --- END FIX ---

            // Handle end-of-turn effects for this enemy
            handleEnemyEndOfTurn(enemy);

            // Check if the enemy died from DoT effects
            if (!enemy.isAlive()) {
                 if (!gameState.battleEnded) checkBattleStatus(true); // Check for deaths (isReaction = true)
                if (gameState.battleEnded) return; // Stop if this was the last enemy
            }

            // Only add delay if battle isn't over
            if (!gameState.battleEnded) {
                 // --- SPEED SCALING: Dynamic turn delay ---
                 // 1 Enemy = 150ms, 4 Enemies = 80ms
                 const turnDelay = Math.max(50, 150 - (currentEnemies.length * 30));
                 await new Promise(resolve => setTimeout(resolve, turnDelay)); 
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
        // Ally is dead/fled/missing, proceed to player drone turn
        droneTurn(gameState.activeDrone, 'enemyTurn'); // Pass 'enemyTurn' as next turn
        return;
    }

    const ally = player.npcAlly;
    let actionTaken = false; 
    
    addToLog(`Your ally ${ally.name}'s turn!`, 'text-blue-300');

    // --- 0. Pre-Action Checks ---
    // A. Paralysis/Petrification
    if (ally.statusEffects.paralyzed || ally.statusEffects.petrified) {
        const status = ally.statusEffects.paralyzed ? 'paralyzed' : 'petrified';
        addToLog(`${ally.name} is ${status} and cannot act!`, 'text-yellow-500');
        actionTaken = true; 
    }
    
    // B. Toggle Management (Deactivate if low MP)
    if (!actionTaken && ally.signatureAbilityToggleActive && ally.signatureAbilityData.type === 'toggle') {
        if (ally.mp < ally.mpToggleThreshold) {
            ally.signatureAbilityToggleActive = false;
            ally.activeModeIndex = -1; 
            addToLog(`${ally.name} is low on MP and deactivates ${ally.signatureAbilityData.name}.`, 'text-blue-400');
        }
    }

    // C. Health Threshold Dialogue Check (Do this *before* healing)
    if (!actionTaken) {
        const hpPercent = ally.hp / ally.maxHp;
        if (hpPercent <= 0.10 && !ally._10PercentLogged) {
            const dialogue = ally._getDialogue('HP_10', player.name);
            addToLog(`(${ally.name}) CRITICAL HEALTH WARNING!<br>"${dialogue}"`, 'text-red-500');
            ally._10PercentLogged = true;
            ally._50PercentLogged = true;
        } else if (hpPercent <= 0.50 && !ally._50PercentLogged) {
            const dialogue = ally._getDialogue('HP_50', player.name);
            addToLog(`(${ally.name}) HEALTH ALERT!<br>"${dialogue}"`, 'text-yellow-400');
            ally._50PercentLogged = true;
        } else if (hpPercent > 0.50) {
            ally._10PercentLogged = false;
            ally._50PercentLogged = false;
        }
    }

    // --- 1. Signature Ability (Priority 1: Once-per-Encounter) ---
    if (!actionTaken && ally.signatureAbilityData && ally.signatureAbilityData.type === 'signature' && !ally.signatureAbilityUsed) {
        const ability = ally.signatureAbilityData;
        const cost = ability.cost || 0;
        
        // This block contains the same logic as your original function for Cleric, Ranger, and Cook.
        // It's left concise here but assumes the detailed logic is correct in engine.js helpers.
        
        if (ally._classKey === 'cleric' || ally._classKey === 'ranger' || ally._classKey === 'cook') {
            // Cleric/Ranger/Cook logic handles cost and ability use internally/via helpers.
            // If any of these are triggered, they set actionTaken = true;
            
            // This is a complex logic block requiring external helpers. We assume the ability helpers 
            // inside engine.js now handle the conditions and returns a boolean upon success.
            const success = await _tryNpcSignatureAbility(ally);
            if (success) actionTaken = true;
        }
    }

    // --- 2. Healing/Item Logic (Priority 2: Survival) ---
    const lostHp = ally.maxHp - ally.hp;
    const lostMp = ally.maxMp - ally.mp;
    const healThreshold = ally.maxHp * 0.5; // Threshold to consider healing

    if (!actionTaken && lostHp > ally.maxHp * 0.25) { // If missing 25% HP
        
        // Try Potion First (Hardcoded pot priority for now)
        let potionToUse = null;
        if (lostHp >= 100 && (ally.inventory.items['superior_health_potion'] || 0) > 0) {
             potionToUse = 'superior_health_potion';
        } else if (lostHp >= 50 && (ally.inventory.items['condensed_health_potion'] || 0) > 0) {
            potionToUse = 'condensed_health_potion';
        } else if ((ally.inventory.items['health_potion'] || 0) > 0) {
            potionToUse = 'health_potion';
        }

        if (potionToUse) {
            ally.useItem(potionToUse); // useItem logs ON_HEAL
            actionTaken = true;
        } else {
            // Try Healing Spell (if available and mana allows)
            const healingSpellKey = findBestHealingSpell(ally);
            if (healingSpellKey) {
                 const spellCost = SPELLS[healingSpellKey].tiers[ally.spells[healingSpellKey].tier - 1].cost;
                 const allyHpMissing = ally.maxHp - ally.hp;
                 const playerHpMissing = player.maxHp - player.hp;
                 
                 // If ally or player needs significant healing AND ally has mana
                 if (ally.mp >= spellCost && (allyHpMissing > healThreshold || playerHpMissing > healThreshold)) {
                    await ally.castSpell(healingSpellKey, allyHpMissing > playerHpMissing ? ally : player);
                    logAllyDialogueChance(ally, 'ON_HEAL');
                    actionTaken = true;
                 }
            }
        }
    }

    const needsMana = ally.mp < ally.mpToggleThreshold || (ally.maxMp - ally.mp) >= 50;

    if (!actionTaken && needsMana) {
        let manaPotionToUse = null;
        
        // Find the best potion they *have*
        if ((ally.inventory.items['superior_mana_potion'] || 0) > 0) {
            manaPotionToUse = 'superior_mana_potion';
        } else if ((ally.inventory.items['condensed_mana_potion'] || 0) > 0) {
            manaPotionToUse = 'condensed_mana_potion';
        } else if ((ally.inventory.items['mana_potion'] || 0) > 0) {
            manaPotionToUse = 'mana_potion';
        }
        
        if (manaPotionToUse) {
            ally.useItem(manaPotionToUse); // This will log and update UI
            logAllyDialogueChance(ally, 'ON_HEAL'); // Use the same dialogue type
            actionTaken = true;
        }
    }

    
    // --- 3. Combat Logic (Prioritized by Role) ---
    if (!actionTaken) {
        let target = null;
        let minDistance = Infinity;

        // Target acquisition logic remains: Marked > Closest
        if (ally.npcAllyMarkedTarget && ally.npcAllyMarkedTarget.isAlive()) {
            target = ally.npcAllyMarkedTarget;
        } else {
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
        
        if (target) {
            const distance = Math.abs(ally.x - target.x) + Math.abs(ally.y - target.y);
            const hasWeapon = ally.equippedWeapon.name !== WEAPONS['fists'].name;
            const hasCatalyst = ally.equippedCatalyst.name !== CATALYSTS['no_catalyst'].name;
            const weaponRange = ally.equippedWeapon.range || 1;
            const catalystRange = ally.equippedCatalyst.range || 3;
            const isMartial = MARTIAL_CLASSES.includes(ally._classKey);

            let bestSpell = null;
            let canCastSpell = false;
            let actionType = 'move';
            
            // Check viability of spellcasting first
            if (hasCatalyst) {
                bestSpell = findBestSpell(ally, target);
                if (bestSpell) {
                    const spellCost = SPELLS[bestSpell].tiers[ally.spells[bestSpell].tier - 1].cost;
                    if (ally.mp >= spellCost) canCastSpell = distance <= catalystRange;
                }
            }

            // --- PRIORITY LOGIC ---
            // 1. Martial: Weapon (if owned/in range) > Spell (if possible) > Fists > Move
            // 2. Magic: Spell (if possible/in range) > Weapon (if owned/in range) > Fists > Move
            
            const attemptMelee = (distance <= weaponRange);
            const attemptMagic = canCastSpell && (distance <= catalystRange);

            if (isMartial) {
                if (attemptMelee) actionType = 'attack';
                else if (attemptMagic) actionType = 'spell';
                else actionType = 'move';
            } else { // Magic or Cook/Artificer
                if (attemptMagic) actionType = 'spell';
                else if (attemptMelee) actionType = 'attack';
                else actionType = 'move';
            }
            
            // --- EXECUTE ACTION ---
            switch (actionType) {
                case 'spell':
                    // Magus Mode Update (Only if casting spell)
                    if (ally._classKey === 'magus' && ally.signatureAbilityToggleActive) {
                        const spellData = SPELLS[bestSpell];
                        if (spellData.type === 'st') { ally.activeModeIndex = 0; }
                        else if (spellData.type === 'aoe') { ally.activeModeIndex = 1; }
                    }
                    await ally.castSpell(bestSpell, target);
                    logAllyDialogueChance(ally, 'ON_CAST');
                    actionTaken = true;
                    break;

                case 'attack':
                    await ally.attack(target);
                    logAllyDialogueChance(ally, 'ON_ATTACK');
                    actionTaken = true;
                    break;

                case 'move':
                default:
                    // Only move if currently out of effective range
                    const bestRange = Math.max(weaponRange, canCastSpell ? catalystRange : 0);
                    if (distance > bestRange) {
                        addToLog(`${ally.name} moves towards ${target.name}.`);
                        await ally.moveTowards(target);
                        actionTaken = true;
                    } else {
                        addToLog(`${ally.name} is optimally positioned but cannot perform a primary action this turn.`);
                        actionTaken = true; 
                    }
                    break;
            }

        } else {
            addToLog(`${ally.name} has no targets.`);
            actionTaken = true; 
        }
    }
    
    // --- 4. Finalization ---
    // Check if ally's action ended the battle
    if (!gameState.battleEnded) {
        checkBattleStatus(true); // isReaction = true
    }
    if (gameState.battleEnded) return;

    // Proceed to finalize ally turn
    if (!gameState.battleEnded) {
        // Ally's end-of-turn effects run in finalizeNpcTurn.
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
    const weaponEffect = ally.equippedWeapon.effect;
    const shieldEffect = ally.equippedShield.effect;
    const armorEffect = ally.equippedArmor.effect;
    const catalystEffect = ally.equippedCatalyst.effect;

    const hpRegenPercent = (weaponEffect?.hp_regen_percent || 0) + (shieldEffect?.hp_regen_percent || 0) + (armorEffect?.hp_regen_percent || 0) + (catalystEffect?.hp_regen_percent || 0);
    const mpRegenPercent = (weaponEffect?.mp_regen_percent || 0) + (shieldEffect?.mp_regen_percent || 0) + (armorEffect?.mp_regen_percent || 0) + (catalystEffect?.mp_regen_percent || 0);

    if (hpRegenPercent > 0 && ally.hp < ally.maxHp) {
         const healAmount = Math.floor(ally.maxHp * hpRegenPercent);
         if (healAmount > 0) {
            ally.hp = Math.min(ally.maxHp, ally.hp + healAmount);
            addToLog(`${ally.name}'s gear regenerates <span class="font-bold text-green-400">${healAmount}</span> HP.`, 'text-yellow-300');
         }
    }
    if (mpRegenPercent > 0 && ally.mp < ally.maxMp) {
         const regenAmount = Math.floor(ally.maxMp * mpRegenPercent);
         if (regenAmount > 0) {
            ally.mp = Math.min(ally.maxMp, ally.mp + regenAmount);
            addToLog(`${ally.name}'s gear restores <span class="font-bold text-blue-400">${regenAmount}</span> MP.`, 'text-blue-300');
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

    // --- ADD CHECK BATTLE STATUS HERE ---
    if (!gameState.battleEnded) {
        checkBattleStatus(true); // Check if ally fled
        if (gameState.battleEnded) return; // Stop
    }
    // --- END ADDED CHECK ---

    // --- MODIFIED: Check for NPC drone before enemy turn ---
    if (gameState.npcActiveDrone && gameState.npcActiveDrone.isAlive()) {
        setTimeout(() => droneTurn(gameState.npcActiveDrone, 'enemyTurn'), 100);
    } else {
        setTimeout(enemyTurn, 100); // Proceed to enemy turn
    }
    // --- END MODIFIED ---
}

function beginPlayerTurn() {
    player.tilesMovedThisTurn = 0; // Reset charge tracker
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

    // First, check for any revive effects (Void Greatsword, etc.)
    if(player.equippedWeapon.effect?.revive && !player.specialWeaponStates.void_greatsword_revive_used) {
        player.hp = Math.floor(player.maxHp * 0.5);
        player.specialWeaponStates.void_greatsword_revive_used = true;
        addToLog('The Void Greatsword flashes with dark energy, pulling your soul back from the brink!', 'text-purple-400 font-bold');
        updateStatsView();
        return; // Player is revived, death is averted
    }

    gameState.playerIsDying = true;
    gameState.activeDrone = null;
    gameState.markedTarget = null;

    if (player.npcAlly) {
        player.npcAlly.isFled = true; // Ally flees if player dies
        addToLog(`${player.npcAlly.name} sees your fall and flees the battle!`, "text-gray-400");
    }
    
    const killer = currentEnemies.length > 0 ? currentEnemies[0].name : 'the wilderness';
    
    // --- MODIFICATION: Always render death screen first ---
    const template = document.getElementById('template-death');
    render(template.content.cloneNode(true));
    addToLog(`You were defeated by ${killer}...`, 'text-red-600 font-bold');

    // --- Reworked Difficulty Penalties ---
    switch (player.difficulty) {
        case 'easy':
            addToLog('You pass out from your injuries...', 'text-gray-400');
            setTimeout(() => {
                addToLog('You awaken, fully restored. (No penalty)', 'text-green-400');
                
                // Check if we are in an expedition
                if (gameState.currentMap) {
                    endBiomeRun('death'); // Clean up map and return to town
                } else {
                    restAtInn(0); // Standard respawn
                }
                gameState.playerIsDying = false;
            }, 3000);
            break;

        case 'medium':
            addToLog('You collapse, your belongings scattering...', 'text-orange-400');

            // --- Apply Penalty: Gold Loss ---
            const goldLost = Math.floor(player.gold / 2);
            player.gold -= goldLost;
            addToLog(`You lost <span class="font-bold">${goldLost}</span> G.`, 'text-red-500');

            // --- Apply Penalty: Item Loss ---
            let itemsDropped = 0;
            // Loss of half stackables
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

            // Loss of half equipment
            ['weapons', 'armor', 'shields', 'catalysts'].forEach(category => {
                const items = player.inventory[category];
                if (!Array.isArray(items) || items.length === 0) return;

                const initialCount = items.length;
                const amountToDrop = Math.floor(initialCount / 2);

                for (let i = 0; i < amountToDrop; i++) {
                     if (items.length === 0) break;
                    const randomIndex = Math.floor(Math.random() * items.length);
                    const droppedItemKey = items[randomIndex];
                    const itemDetails = getItemDetails(droppedItemKey);

                    if (itemDetails && itemDetails.rarity !== 'Broken') {
                        items.splice(randomIndex, 1);
                        itemsDropped++;
                        // Unequip if dropped
                        // (Logic to unequip if equipped item was dropped - same as before)
                         let itemTypeToCheck = null;
                        let equippedItem = null;
                        switch (category) {
                            case 'weapons': itemTypeToCheck = 'weapon'; equippedItem = player.equippedWeapon; break;
                            case 'armor': itemTypeToCheck = 'armor'; equippedItem = player.equippedArmor; break;
                            case 'shields': itemTypeToCheck = 'shield'; equippedItem = player.equippedShield; break;
                            case 'catalysts': itemTypeToCheck = 'catalyst'; equippedItem = player.equippedCatalyst; break;
                        }
                        if (itemTypeToCheck && equippedItem && equippedItem.name === itemDetails.name) {
                            unequipItem(itemTypeToCheck, false);
                        }
                    }
                }
            });

            if (itemsDropped > 0) {
                addToLog('You lost some of your items and equipment in the fall.', 'text-red-500');
            }

            setTimeout(() => {
                addToLog('You awaken, sore but alive.', 'text-yellow-300');
                
                // Check if we are in an expedition
                if (gameState.currentMap) {
                    endBiomeRun('death'); // Clean up map and return to town
                } else {
                    restAtInn(0); // Standard respawn
                }
                gameState.playerIsDying = false;
            }, 3000);
            break;

        case 'hardcore':
        default:
            // Hardcore logic - Permadeath (Expedition state doesn't matter, save is gone)
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

