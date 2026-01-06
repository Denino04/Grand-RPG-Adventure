/**
 * Calculates dynamic rarity weights based on player level and monster class.
 * @param {number} playerLevel The player's current level.
 * @param {string} monsterClass The class of the monster being generated.
 * @returns {Array<number>} An array of weights for [common, uncommon, rare, epic, legendary].
 */
function getDynamicRarityWeights(playerLevel, monsterClass) {
    // Base weights
    let weights = {
        common: 50,
        uncommon: 25,
        rare: 15,
        epic: 9,
        legendary: 1
    };

    // Monstrosities are inherently more dangerous and have a higher chance of being rare.
    if (monsterClass === 'Monstrosity') {
        weights = {
            common: 35,
            uncommon: 30,
            rare: 18,
            epic: 12,
            legendary: 5
        };
    }

    // Start shifting weights more significantly after level 5
    if (playerLevel > 5) {
        // Determine how many percentage points to shift away from 'common' based on level.
        // This caps out to ensure common enemies never disappear entirely.
        const transferPoints = Math.min(35, Math.floor((playerLevel - 5) / 1.5));

        weights.common -= transferPoints;

        // Distribute the transferred points to higher rarities.
        weights.uncommon += Math.ceil(transferPoints * 0.5);  // 50% of points
        weights.rare += Math.ceil(transferPoints * 0.3);      // 30% of points
        weights.epic += Math.floor(transferPoints * 0.2);     // 20% of points
        // The base legendary chance is preserved for that "oh shit" factor at all levels.
    }

    // Normalize weights to ensure they sum to 100.
    const finalWeights = Object.values(weights);
    const currentTotal = finalWeights.reduce((a, b) => a + b, 0);
    const difference = 100 - currentTotal;
    finalWeights[0] += difference; // Add/remove any rounding errors to/from common chance.

    // Final sanity check to prevent negative chances.
    if (finalWeights[0] < 5) {
        const excess = 5 - finalWeights[0];
        finalWeights[0] = 5;
        // Adjust uncommon weight first, then rare if needed
        if (finalWeights[1] >= excess) {
            finalWeights[1] -= excess;
        } else {
            const remainingExcess = excess - finalWeights[1];
            finalWeights[1] = 0; // Or a minimum value like 1 if desired
            if (finalWeights[2] >= remainingExcess) {
                 finalWeights[2] -= remainingExcess;
            } else {
                 // Handle further adjustments if necessary (unlikely with current numbers)
                 finalWeights[2] = 0; // Or minimum
                 // Could adjust epic/legendary if absolutely needed
                 console.warn("Rarity weight normalization needed deeper adjustments.");
            }
        }
    }


    return finalWeights;
}

const STR_WEAPONS_CHECK = ['Hand-to-Hand', 'Longsword', 'Axe', 'Hammer', 'Lance'];
const DEX_WEAPONS_CHECK = ['Dagger', 'Thrusting Sword', 'Curved Sword', 'Reaper', 'Bow'];

// Helper to normalize armor types from your messy ID strings
const ARMOR_TYPES = {
    'travelers_garb': 'Light', 'leather_armor': 'Light', 'padded_leather': 'Light',
    'silenced_leather_armor': 'Light', 'assassin_cloak_armor': 'Light',
    'chainmail_armor': 'Heavy', 'half_plate_armor': 'Heavy', 
    'steel_plate_armor': 'Heavy', 'adamantine_armor': 'Heavy',
    'warmages_armor': 'Magic', 'archmages_robes': 'Magic'
};

/**
 * Creates a seeded pseudo-random number generator.
 * @param {number} seed The seed for the generator.
 * @returns {function(): number} A function that returns a random number between 0 and 1.
 */
function seededRandom(seed) {
    // Ensure seed is a number
    let currentSeed = Number(seed);
    if (isNaN(currentSeed)) {
        console.warn("Invalid seed provided to seededRandom, using default Math.random(). Seed:", seed);
        return Math.random; // Fallback to non-seeded random if seed is invalid
    }

    return function() {
        var t = currentSeed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        currentSeed = t; // Update the seed for the next call
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}


/**
 * Shuffles an array in place using the Fisher-Yates algorithm.
 * @param {Array} array The array to shuffle.
 * @param {function(): number} [rng=Math.random] Optional random number generator.
 * @returns {Array} The shuffled array.
 */
function shuffleArray(array, rng) {
    const randomFunc = rng || Math.random;
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(randomFunc() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

/**
 * Selects a random element from a population based on on weights.
 * @param {Array} population The array of items to choose from.
 * @param {Array<number>} weights The corresponding weights for each item.
 * @param {function(): number} [rng=Math.random] Optional random number generator.
 * @returns {*} The chosen item.
 */
function choices(population, weights, rng) {
    const randomFunc = rng || Math.random;
    let totalWeight = weights.reduce((acc, w) => acc + w, 0);
    // Handle cases where total weight might be zero or negative
    if (totalWeight <= 0) {
        console.warn("Total weight in choices function is <= 0. Returning random element.");
        return population[Math.floor(randomFunc() * population.length)];
    }
    let randomNum = randomFunc() * totalWeight;
    for (let i = 0; i < population.length; i++) {
        if (randomNum < weights[i]) return population[i];
        randomNum -= weights[i];
    }
    // Fallback in case of rounding errors etc.
    return population[population.length - 1];
}

/**
 * Finds the key of an item in a given object based on its name.
 * @param {string} name The name of the item to find.
 * @param {object} object The object to search in (e.g., WEAPONS, ARMOR).
 * @returns {string|null} The key of the item, or null if not found.
 */
function findKeyByName(name, object) {
    if (!name || !object) return null;
    return Object.keys(object).find(key => object[key].name === name);
}

// Removed findClassKeyByName - no longer needed here

// Mapping for Elemental emojis based on affinity
const ELEMENTAL_AFFINITY_EMOJIS = {
    'fire': '🔥',
    'water': '💧',
    'earth': '🏔️', // Changed from 🪨
    'wind': '💨',
    'lightning': '⚡',
    'nature': '🌿',
    'light': '✨',
    'void': '⚫',
    // Add healing if needed, or default
    'default': '🔥' // Changed fallback from ⚡
};

/**
 * Gets the appropriate emoji for the player based on their race, gender, and affinity.
 * @returns {string} The player's emoji.
 */
function getPlayerEmoji() {
    if (!player || !player.race) return '🧑'; // Default if player/race invalid

    // Handle Elementals dynamically
    if (player.race === 'Elementals') {
        const affinity = player.elementalAffinity;
        return ELEMENTAL_AFFINITY_EMOJIS[affinity] || ELEMENTAL_AFFINITY_EMOJIS['default'];
    }

    // Handle other races based on gender
    const raceEmojis = PLAYER_EMOJIS[player.race];
    if (!raceEmojis) return '🧑'; // Default if race not in map
    return raceEmojis[player.gender] || raceEmojis['Neutral'] || '🧑'; // Default to Neutral then generic
}

/**
 * Finds the key of an item instance within a larger data object (e.g., finding 'steel_longsword' in WEAPONS).
 * @param {object} dataObject The object to search within (e.g., WEAPONS, ARMOR).
 * @param {object} instance The specific item object instance to find.
 * @returns {string|null} The key of the item instance, or null if not found.
 */
function findKeyByInstance(dataObject, instance) {
    if (!instance || !dataObject || !instance.name) return null; // Need instance and name to search
    // Find the key where the object's name matches the instance's name
    // This assumes names are unique identifiers within their category for lookup purposes
    return Object.keys(dataObject).find(key => dataObject[key].name === instance.name);
}
// --- A* Pathfinding ---
// engine.js

// --- A* Pathfinding ---
function findPath(start, end, isFlying = false) {
    const openSet = [start];
    const cameFrom = {};
    const gScore = {};
    const fScore = {};

    for (let y = 0; y < gameState.gridHeight; y++) {
        for (let x = 0; x < gameState.gridWidth; x++) {
            gScore[`${x},${y}`] = Infinity;
            fScore[`${x},${y}`] = Infinity;
        }
    }

    gScore[`${start.x},${start.y}`] = 0;
    fScore[`${start.x},${start.y}`] = Math.abs(start.x - end.x) + Math.abs(start.y - end.y);

    const isPlayer = (start.x === player.x && start.y === player.y);
    const isGhost = isPlayer && player.skillToggles && player.skillToggles['assassins_gambit'] && player.isSkillActive('ethereal_permeability');

    while (openSet.length > 0) {
        let current = openSet.reduce((a, b) => fScore[`${a.x},${a.y}`] < fScore[`${b.x},${b.y}`] ? a : b);

        if (current.x === end.x && current.y === end.y) {
            const path = [];
            while (current) {
                path.unshift(current);
                current = cameFrom[`${current.x},${current.y}`];
            }
            return path;
        }

        openSet.splice(openSet.indexOf(current), 1);

        const neighbors = [
            { x: current.x, y: current.y - 1 }, { x: current.x, y: current.y + 1 },
            { x: current.x - 1, y: current.y }, { x: current.x + 1, y: current.y }
        ];

        for (const neighbor of neighbors) {
            if (neighbor.x < 0 || neighbor.x >= gameState.gridWidth || neighbor.y < 0 || neighbor.y >= gameState.gridHeight) continue;
            if (!gameState.gridLayout || gameState.gridLayout[neighbor.y * gameState.gridWidth + neighbor.x] !== 1) continue;

            const isDestination = (neighbor.x === end.x && neighbor.y === end.y);

            // --- 1. ENTITY BLOCKING CHECK ---
            const ally = player.npcAlly;
            const allyIsAliveAndAtNeighbor = (ally && ally.hp > 0 && !ally.isFled && ally.x === neighbor.x && ally.y === neighbor.y);
            const isOccupiedByEntity = (currentEnemies.some(e => e.isAlive() && e.x === neighbor.x && e.y === neighbor.y) || (player.x === neighbor.x && player.y === neighbor.y) || allyIsAliveAndAtNeighbor);
            
            if (isOccupiedByEntity) {
                if (!isGhost) {
                    if (!isDestination) continue; 
                } else {
                    if (isDestination) continue; 
                }
            }

            // --- 2. OBSTACLE CHECK ---
            const gridObject = gameState.gridObjects.find(o => o.x === neighbor.x && o.y === neighbor.y);
            if (!isFlying && !isGhost) {
                if (gridObject && (gridObject.type === 'obstacle' || gridObject.type === 'terrain')) {
                    if (!isDestination) continue; 
                }
            }

            // --- 3. CALCULATE MOVEMENT COST ---
            // [MODIFIED SECTION START]
            let moveCost = 1;
            
            if (!isFlying && gridObject) {
                // Jagged Earth costs 3 movement
                if (gridObject.subtype === 'jagged_earth') {
                    moveCost = 3;
                }
                // Traps generally cost more to encourage avoiding them
                else if (gridObject.type === 'trap') {
                    moveCost = 3; 
                }
            }
            // [MODIFIED SECTION END]

            const tentativeGScore = gScore[`${current.x},${current.y}`] + moveCost;

            if (tentativeGScore < gScore[`${neighbor.x},${neighbor.y}`]) {
                cameFrom[`${neighbor.x},${neighbor.y}`] = current;
                gScore[`${neighbor.x},${neighbor.y}`] = tentativeGScore;
                fScore[`${neighbor.x},${neighbor.y}`] = tentativeGScore + Math.abs(neighbor.x - end.x) + Math.abs(neighbor.y - end.y);
                if (!openSet.some(node => node.x === neighbor.x && node.y === neighbor.y)) {
                    openSet.push(neighbor);
                }
            }
        }
    }
    return null;
}

function generateNewBiomeMap(biomeKey) {
    const biome = BIOMES[biomeKey];
    if (!biome) return null;

    const rules = biome.map_generation;
    
    // --- FIX: Use Math.random() for map layout to ensure variety per run ---
    // Previously used player.seed (Daily Seed), which caused duplicate maps if not resting.
    const rng = Math.random; 
    
    let nodes = [];
    let nodesByFloor = [];
    
    // Constants
    const bossNodeId = 'node-boss';
    const preBossRestId = 'node-pre-boss-rest';
    const halfwayRestId = 'node-halfway-rest'; 

    // --- NEW: Set initial gold for the run ---
    gameState.initialRunGold = player.gold; 
    
    // --- BOSS SELECTION ---
    const bossKey = rules.bosses[Math.floor(rng() * rules.bosses.length)];
    
    const halfwayFloor = Math.floor(rules.depth / 2);

    for (let f = 0; f < rules.depth; f++) {
        nodesByFloor[f] = [];
        let nodesInThisFloor = 0;

        // Helper to generate random visual offset
        // X is percentage based (so +/- 6%), Y is pixels (+/- 25px)
        const getOffset = () => ({ x: (rng() * 12) - 6, y: (rng() * 50) - 25 });
        const getStableOffset = () => ({ x: 0, y: 0 }); // For boss/rest nodes

        if (f === 0) {
            // Floor 0: Start
            nodesInThisFloor = Math.floor(rng() * 2) + 2;
            const segmentSize = rules.width / nodesInThisFloor;
            
            for (let i = 0; i < nodesInThisFloor; i++) {
                const col = Math.floor((i * segmentSize) + (segmentSize / 2)); 
                const node = { 
                    id: `node-${f}-${col}`, floor: f, col: col, type: 'monster', 
                    state: 'next_available', connections: [], 
                    offset: getOffset() // Chaotic offset
                };
                nodesByFloor[f].push(node); nodes.push(node);
            }
        } 
        else if (f === halfwayFloor) {
            // Halfway Rest (Guaranteed)
            const node = { 
                id: halfwayRestId, floor: f, col: Math.floor(rules.width / 2), type: 'rest', 
                state: 'hidden', connections: [],
                offset: getStableOffset() // Stable
            };
            nodesByFloor[f].push(node); nodes.push(node);
            
            if (nodesByFloor[f - 1]) {
                nodesByFloor[f - 1].forEach(prev => prev.connections.push(node.id));
            }
        }
        else if (f === rules.depth - 2) {
            // Pre-Boss Rest
            const node = { 
                id: preBossRestId, floor: f, col: Math.floor(rules.width / 2), type: 'rest', 
                state: 'hidden', connections: [bossNodeId],
                offset: getStableOffset() // Stable
            };
            nodesByFloor[f].push(node); nodes.push(node);
            if (nodesByFloor[f - 1]) nodesByFloor[f - 1].forEach(prev => prev.connections.push(node.id));
        } else if (f === rules.depth - 1) {
            // Boss Node
            const node = { 
                id: bossNodeId, floor: f, col: Math.floor(rules.width / 2), type: 'boss', 
                bossId: bossKey, state: 'hidden', connections: [],
                offset: getStableOffset() // Stable
            }; 
            nodesByFloor[f].push(node); nodes.push(node);
        } else {
            // Intermediate Floors
            const prevFloorNodes = nodesByFloor[f - 1];
            if (!prevFloorNodes || prevFloorNodes.length === 0) continue;

            // Chaotic node count: 2 to 5
            nodesInThisFloor = Math.floor(rng() * 4) + 2; 
            const segmentSize = rules.width / nodesInThisFloor;

            for (let i = 0; i < nodesInThisFloor; i++) {
                // Randomize column slightly to avoid perfect alignment
                let col = Math.floor((i * segmentSize) + (segmentSize / 2));
                // Add slight column jitter
                if (rng() > 0.5) col += Math.floor(rng() * 2) - 1;
                
                // Clamp column
                if (col < 0) col = 0;
                if (col >= rules.width) col = rules.width - 1;

                // Determine Type
                let nodeType = 'monster';
                const typeRoll = rng();
                let cumulativeChance = 0;
                for (const type in rules.node_pool) {
                    cumulativeChance += rules.node_pool[type];
                    if (typeRoll < cumulativeChance) { nodeType = type; break; }
                }
                if (f < 4 && (nodeType === 'elite' || nodeType === 'rest')) nodeType = 'monster';

                const node = { 
                    id: `node-${f}-${col}-${i}`, // Added index to ID to prevent collision
                    floor: f, col: col, type: nodeType, 
                    state: 'hidden', connections: [],
                    offset: getOffset() // Chaotic offset
                };
                nodesByFloor[f].push(node); nodes.push(node);
            }

            // Connect Previous Floor to This Floor
            prevFloorNodes.forEach(prevNode => {
                const createdNodes = nodesByFloor[f];
                // Don't connect Rest/Shop/Elite to same type to allow variety
                let validTargets = createdNodes.filter(n => !(['elite', 'rest', 'shop'].includes(n.type) && n.type === prevNode.type));
                if (validTargets.length === 0) validTargets = createdNodes;
                
                // --- CHAOTIC CONNECTIONS ---
                // Use shuffleArray with standard Math.random logic inside since rng is Math.random
                shuffleArray(validTargets); 

                // Connect to at least 1 random node
                prevNode.connections.push(validTargets[0].id);

                // 40% chance to connect to a second random node
                if (rng() < 0.4 && validTargets.length > 1) {
                    prevNode.connections.push(validTargets[1].id);
                }
            });
        }
    }

    // 2. PRUNING (Remove unreachable nodes)
    let accessibleIds = new Set(nodesByFloor[0].map(n => n.id));
    let queue = [...nodesByFloor[0]];
    while(queue.length > 0) {
        const curr = queue.shift();
        curr.connections.forEach(childId => {
            if(!accessibleIds.has(childId)) {
                accessibleIds.add(childId);
                const childNode = nodes.find(n => n.id === childId);
                if(childNode) queue.push(childNode);
            }
        });
    }

    let reachesBossIds = new Set([bossNodeId]);
    for(let f = rules.depth - 2; f >= 0; f--) {
        nodesByFloor[f].forEach(node => {
            const connectsToValid = node.connections.some(connId => reachesBossIds.has(connId));
            if (connectsToValid) reachesBossIds.add(node.id);
        });
    }

    const finalNodes = nodes.filter(n => accessibleIds.has(n.id) && reachesBossIds.has(n.id));
    
    finalNodes.forEach(node => {
        node.connections = node.connections.filter(connId => accessibleIds.has(connId) && reachesBossIds.has(connId));
    });

    const map = { biomeKey: biomeKey, nodes: finalNodes };
    gameState.currentMap = map;
    return map;
}


function triggerNodeEvent(node) {
    if (!node) return;
    gameState.currentEncounterType = node.type;

    switch(node.type) {
        case 'monster_lured':
            // Pass the lure target specifically
            const lureDetails = LURES[player.equippedLure];
            startBattle(gameState.currentMap.biomeKey, { 
                nodeType: 'monster_lured', 
                speciesKey: lureDetails.lureTarget 
            });
            break;
            
        case 'monster':
            startBattle(gameState.currentMap.biomeKey, { nodeType: 'monster' });
            break;
            
        case 'elite':
            startBattle(gameState.currentMap.biomeKey, { nodeType: 'elite' });
            break;
            
        case 'boss':
            // Pass the specific boss ID stored on the node
            startBattle(gameState.currentMap.biomeKey, { 
                nodeType: 'boss', 
                bossKey: node.bossId 
            });
            break;
            
        case 'event': handleRandomEvent(node); break; // <-- MODIFIED
        case 'rest': renderRestNode(); break;
        case 'shop': renderMerchantNode(); break;
        default: renderBiomeMap(gameState.currentMap.biomeKey);
    }
}

function handleRandomEvent(node) {
    // 1. Define events and weights (Weights can depend on player level/luck)
    const eventTypes = [
        'Treasure', // Current basic event (safe, instant reward)
        'LockedChest', // Puzzle/Skill Check
        'SphinxRiddle', // Quiz/Knowledge Check
        'PoisonedStream' // Resource/Risk Check
    ];
    const weights = [
        40, // Base Treasure (safe)
        25, // Locked Chest
        20, // Sphinx Riddle
        15  // Poisoned Stream
    ];
    
    const chosenEvent = choices(eventTypes, weights, Math.random); // Use Math.random for world events

    // 2. Store event on node (to prevent re-roll on accidental refresh/re-render)
    if (!node.eventData) {
        node.eventData = { type: chosenEvent, state: 'active' };
    }
    
    // 3. Route to the appropriate renderer
    switch (node.eventData.type) {
        case 'LockedChest': renderLockedChestPuzzle(node); break;
        case 'SphinxRiddle': renderSphinxRiddleQuiz(node); break;
        case 'PoisonedStream': renderPoisonedStreamRisk(node); break;
        case 'Treasure': renderTreasureNode(); break; // Existing logic
        default: renderTreasureNode();
    }
}
/**
 * Executes the event for a given map node.
 * This is the bridge between the map and the game's encounter logic.
 * @param {object} node - The node object from the gameState.currentMap.nodes array.
 */
function triggerNodeEvent(node) {
    if (!node) return;
    gameState.currentEncounterType = node.type;

    switch(node.type) {
        case 'monster_lured':
        case 'monster':
            let enemy;
            if (node.type === 'monster_lured') {
                const lureDetails = LURES[player.equippedLure];
                const speciesData = MONSTER_SPECIES[lureDetails.lureTarget];
                enemy = new Enemy(speciesData, MONSTER_RARITY['common'], player.level);
            } else {
                enemy = generateEnemy(gameState.currentMap.biomeKey);
                while (enemy.rarityData.key === 'legendary') enemy = generateEnemy(gameState.currentMap.biomeKey);
            }
            // Manually push enemy and start battle to bypass standard generation
            currentEnemies = [enemy];
            // We use a customized startBattle flow or just inject it
            // Actually, standard startBattle generates enemies if list is empty. 
            // We need to tweak startBattle OR just use the array we just made.
            // Let's rely on the rendering.js/battle.js tweaks to handle pre-existing enemies.
            // *Self-correction*: Simplest way is to set currentEnemies and call a modified startBattle, 
            // OR just let startBattle generate it if we didn't pass one. 
            // Let's stick to the standard flow for now to avoid breaking things:
            // If type is monster_lured, we need to force it. 
            // See `battle.js` modification below for how we handle this cleanly.
            startBattle(gameState.currentMap.biomeKey, { nodeType: node.type }); 
            break;
            
        case 'elite':
            startBattle(gameState.currentMap.biomeKey, { nodeType: 'elite' });
            break;
            
        case 'boss':
            startBattle(gameState.currentMap.biomeKey, { nodeType: 'boss' });
            break;
            
        case 'event': renderTreasureNode(); break;
        case 'rest': renderRestNode(); break;
        case 'shop': renderMerchantNode(); break;
        default: renderBiomeMap(gameState.currentMap.biomeKey);
    }
}

/**
 * Ends the biome run, handles penalties/rewards, and returns to town.
 * @param {string} reason - 'victory' (beat boss), 'death' (player died), 'flee' (player fled map).
 */
function endBiomeRun(reason) {
    const map = gameState.currentMap;
    if (!map) return;

    // --- FIX: Validate Biome Key ---
    // If the save file has an old biome key that no longer exists in BIOMES, this prevents the crash.
    const biome = BIOMES[map.biomeKey];
    if (!biome) {
        console.error(`Invalid biome key '${map.biomeKey}' detected. Forcing return to town.`);
        addToLog("The magic of this expedition has faded. Returning to town...", "text-red-400");
        // Clear invalid state so the player isn't stuck
        gameState.currentMap = null;
        gameState.currentNodeId = null;
        gameState.currentEncounterType = null;
        setTimeout(renderTownSquare, 1000);
        return;
    }
    // --- END FIX ---

    // 1. Calculate Proportional Gold Loss (if fleeing)
    let goldMessage = "";
    if (reason === 'flee') {
        
        // --- NEW: Check if fleeing from a Rest Site ---
        const currentNode = map.nodes.find(n => n.id === gameState.currentNodeId);
        const isSafeZone = currentNode && currentNode.type === 'rest';
        
        if (isSafeZone) {
            goldMessage = `You chose to leave safely from a Rest Site. You keep all your winnings!`;
        } 
        // --- END NEW ---
        
        else {
            // Standard penalty logic
            const currentGold = player.gold;
            const earnedGold = Math.max(0, currentGold - gameState.initialRunGold);
            
            if (earnedGold > 0) {
                let currentFloor = 0;
                if (gameState.currentNodeId) {
                    const node = map.nodes.find(n => n.id === gameState.currentNodeId);
                    if (node) currentFloor = node.floor;
                }
                
                const penaltyPct = Math.min(1.0, currentFloor * 0.1); // 10% per floor
                const penalty = Math.floor(earnedGold * penaltyPct);
                
                if (penalty > 0) {
                    player.gold -= penalty;
                    goldMessage = `You dropped <span class="font-bold text-red-400">${penalty} G</span> of your winnings while fleeing in panic.`;
                } else {
                    goldMessage = `You managed to flee with all your winnings!`;
                }
            } else {
                goldMessage = `You made no profit, so you lost nothing.`;
            }
        }
    }

    // 2. Clear map state
    gameState.currentMap = null;
    gameState.currentNodeId = null;
    gameState.currentEncounterType = null;
    gameState.initialRunGold = 0;
    
    // 3. Handle outcome
    if (reason === 'victory') {
        addToLog(`You have conquered the ${BIOMES[map.biomeKey].name}!`, "text-green-400 font-bold");
        if (player.npcAlly && !player.npcAlly.isResting) {
            player.encountersSinceLastPay++;
            addToLog(`Your ally's service counter advanced. (${5 - player.encountersSinceLastPay} expeditions left until pay.)`, "text-gray-400");
        }
        setTimeout(renderTownSquare, 1500);

    } else if (reason === 'flee') {
        addToLog(`You fled the expedition! ${goldMessage}`, "text-yellow-400");
        if (player.npcAlly && !player.npcAlly.isResting) {
            player.encountersSinceLastPay++;
            addToLog(`Your ally's service counter advanced. (${5 - player.encountersSinceLastPay} expeditions left until pay.)`, "text-gray-400");
        }
        setTimeout(renderTownSquare, 1500);

    } else if (reason === 'death') {
        // --- MODIFIED: Immediate return ---
        // battle.js handles the delay and death screen. 
        // This function just cleans up the state and renders town.
        renderTownSquare(); 
        // --- END MODIFICATION ---
    }
    
    player.clearBattleBuffs();
    if (player.npcAlly) player.npcAlly.clearBattleBuffs();
    updateStatsView();
}

function findReachableCells(start, maxMovement) {
    const reachable = [];
    const costMap = new Map();
    const keyStart = `${start.x},${start.y}`;
    costMap.set(keyStart, 0);

    const queue = [{ x: start.x, y: start.y, cost: 0 }];
    
    // [CRITICAL FIX] Align Flight Logic with movePlayer
    // You only fly if Ascension is ON and Polarity is OFF.
    const ascension = player.skillToggles && player.skillToggles['gravimetric_ascension'];
    const polarity = player.skillToggles && player.skillToggles['geomantic_polarity'];
    
    const isFlying = (player.race === 'Pinionfolk' || (ascension && !polarity));

    while (queue.length > 0) {
        queue.sort((a, b) => a.cost - b.cost);
        const current = queue.shift();

        if (current.cost > costMap.get(`${current.x},${current.y}`)) continue;

        if (current.cost > 0) {
            reachable.push(current);
        }

        const neighbors = [
            { x: current.x, y: current.y - 1 }, { x: current.x, y: current.y + 1 },
            { x: current.x - 1, y: current.y }, { x: current.x + 1, y: current.y }
        ];

        for (const neighbor of neighbors) {
            const key = `${neighbor.x},${neighbor.y}`;
            
            // 1. Grid Boundaries & Layout Check
            if (neighbor.x < 0 || neighbor.x >= gameState.gridWidth ||
                neighbor.y < 0 || neighbor.y >= gameState.gridHeight ||
                !gameState.gridLayout || 
                gameState.gridLayout[neighbor.y * gameState.gridWidth + neighbor.x] !== 1) continue;

            // 2. Blockage Check
            // Now correctly uses the updated isFlying logic (respects walls if Polarity is on)
            if (isCellBlocked(neighbor.x, neighbor.y, false, isFlying)) continue;

            // 3. Calculate Step Cost
            let stepCost = 1;
            
            // Only check hazards if NOT flying
            if (!isFlying) {
                const gridObject = gameState.gridObjects.find(o => o.x === neighbor.x && o.y === neighbor.y);
                if (gridObject) {
                    if (gridObject.subtype === 'jagged_earth') {
                        stepCost = 3; 
                    } 
                    else if (gridObject.type === 'trap') {
                        stepCost = 3; 
                    }
                }
            }

            const newCost = current.cost + stepCost;

            if (newCost <= maxMovement) {
                if (!costMap.has(key) || newCost < costMap.get(key)) {
                    costMap.set(key, newCost);
                    queue.push({ x: neighbor.x, y: neighbor.y, cost: newCost });
                }
            }
        }
    }
    return reachable;
}

function isElementalStateActive(element) {
    if (!element) return true;
    const req = element.toLowerCase();
    
    // 1. Check Weapon (Current Infusion or Base)
    if (player.weaponElement === req || player.weaponElement === 'all') return true;
    if (player.equippedWeapon.damageType === 'elemental' && (player.equippedWeapon.element === req || player.equippedWeapon.element === 'all')) return true;
    
    // 2. Check Armor
    if (player.equippedArmor && player.equippedArmor.element === req) return true;
    
    // 3. Check Shield
    if (player.equippedShield && player.equippedShield.element === req) return true;
    
    // 4. Check Catalyst
    if (player.equippedCatalyst && player.equippedCatalyst.element === req) return true;

    return false;
}   


// --- CLASSES ---
class Entity {
    constructor(name) {
        this.name = name;
        this.statusEffects = {};
    }
    isAlive() { return this.hp > 0; }
}

class Player extends Entity {
    // MODIFIED: Constructor accepts classKey
    constructor(name, raceKey, classKey = null) { // Added classKey, default null for safety
        super(name);
        this.x = 0;
        this.y = 0;
        // Core Attributes
        this.level = 1;
        this.xp = 0;
        this.xpMultiplier = 1;
        this.totalXp = 0;
        this.xpToNextLevel = this.calculateXpToNextLevel();
        this.gold = 100;
        this.statPoints = 0;
        this.gender = 'Neutral';
        this.race = raceKey || 'Human'; // Ensure race is set
        this.class = ''; // Class NAME (e.g., "Barbarian") set later
        this._classKey = classKey; // STORE THE KEY directly
        this.background = '';
        this.backgroundKey = '';
        this.difficulty = 'hardcore';
        this.elementalAffinity = null; // For Elementals
        this.biomeClears = {}; // <--- NEW
        this.npcAlly = null; // <<< NEW
        this.enchantments = {}; // <-- NEW: Store item-type enchantments
        this.encountersSinceLastPay = 0; // <<< NEW
        this.house = {
            owned: false,
            owned: false,
            storage: { items: {}, weapons: [], armor: [], shields: [], catalysts: [], lures: {} },
            storageTier: 0,
            gardenTier: 0,
            kitchenTier: 0,
            alchemyTier: 0,
            trainingTier: 0,
            garden: [],
            treePlots: []
        };
        this.dialogueFlags = {};
        this.bettyQuestState = 'not_started'; // not_started, declined, accepted
        this.knownCookingRecipes = [];
        this.knownAlchemyRecipes = [];
        this.barracksRoster = [];
        this.killsSinceLevel4 = 0;
        this.killsSinceLevel7 = 0;
        this.unlocks = {
            blacksmith: false,
            sageTower: false,
            houseAvailable: false,
            blackMarket: false,
            enchanter: false,
            witchCoven: false,
            barracks: false, // <<< NEW
            hasBlacksmithKey: false,
            hasTowerKey: false,
            roguelikeCardGame: false // <-- NEW FLAG
        };
        this.lastCasinoBet = 10; // <-- NEW
        this.lastCasinoAnte = 10; // <-- NEW
        this.roguelikeBlackjackState = {
            runActive: false,
            buyIn: 500,
            highestAnteCleared: 0, // <-- ADD THIS LINE
            currentAnteIndex: 0,
            currentVingtUnIndex: 0,
            currentCrookards: 0,
            passiveModifiers: [],
            consumables: [],
            patronSkills: [],
            runUpgrades: {
                passiveSlots: 5,
                consumableSlots: 2,
                handSize: 5,
                shopRerollCost: 1,
                bonusHandsPerVingtUn: 0,
                bonusRerollsPerVingtUn: 0,
                baseMultiplier: 0
            },
            currentChips: 0,
            currentHandsLeft: 0,
            currentRerollsLeft: 0,
            vingtUnBustSafety: true,
            deck: [],
            playerHand: [],
            dealerHand: [],
            sharedPool: [],
            lastScore: 0,
            gamePhase: 'buy_in',
            statusMessage: '',
            shopStock: [],
        };

                    // --- Skill Tree and abilities ---
        this.skillPoints = 0;
        this.unlockedSkills = ['the_root']; // Auto-unlock root
        this.skillToggles = {}; // For Power Blast, Mana Overload, etc.
        this.combatTags = {};
        this.tilesMovedThisTurn = 0; // For 'Charge'
        this.woodcutterStacks = 0; // For 'Woodcutter'
        this.lastTargetId = null; // Existing, but Ensure it is therethis.equippedSkills = []; // Array of skill IDs
        this.skillDescriptionMode = 'detailed'; // 'simple' (Lore) or 'detailed' (Stats)
        this.equippedSkills = []; // Initialize empty
        this.skillLoadouts = [];  // Initialize empty
        // --- End Added ---


        // Main Stats from Race
        const raceStats = RACES[this.race] || RACES['Human'];
        this.vigor = raceStats.Vigor;
        this.focus = raceStats.Focus;
        this.stamina = raceStats.Stamina;
        this.strength = raceStats.Strength;
        this.intelligence = raceStats.Intelligence;
        this.luck = raceStats.Luck;

        // Points allocated from leveling up
        this.bonusVigor = 0;
        this.bonusFocus = 0;
        this.bonusStamina = 0;
        this.bonusStrength = 0;
        this.bonusIntelligence = 0;
        this.bonusLuck = 0;

        // Bonuses derived from background + allocated points
        this.bonusHp = 0;
        this.bonusMp = 0;
        this.bonusPhysicalDefense = 0;
        this.bonusMagicalDefense = 0;
        this.bonusPhysicalDamage = 0;
        this.bonusMagicalDamage = 0;
        this.bonusEvasion = 0;
        this.bonusCritChance = 0;

        // Abilities (References set by updateAbilityReferences)
        this.racialPassive = (chance) => chance; // Default pass-through function
        this.signatureAbilityData = null; // Reference to the ability data object
        this.signatureAbilityUsed = false; // For once-per-encounter
        this.signatureAbilityToggleActive = false; // For toggleable
        this.activeModeIndex = -1; // For multi-mode toggles like Magus (-1 = Off, 0 = Mode 1, 1 = Mode 2)


        // Initial HP/MP set from base stats - Calculated AFTER all stats are set
        this.hp = 1; // Temporary placeholder
        this.mp = 1;


        // Game State & Equipment
        this.foodBuffs = {};
        this.firestoreId = null;
        this.seed = null; // Set during initGame or load
        this.playerTier = 1;
        this.specialWeaponStates = {};
        this.blackMarketStock = { seasonal: [] };

        this.equippedWeapon = WEAPONS['fists'];
        this.equippedCatalyst = CATALYSTS['no_catalyst'];
        this.equippedArmor = ARMOR['travelers_garb'];
        this.equippedShield = SHIELDS['no_shield'];
        this.equippedLure = 'no_lure';

        this.weaponElement = 'none';
        this.armorElement = 'none';
        this.shieldElement = 'none';

        this.equipmentOrder = []; // Track off-hand usage
        this.inventory = {
            items: { 'health_potion': 3, 'mana_potion': 1 },
            weapons: ['fists'],
            catalysts: ['no_catalyst'],
            armor: ['travelers_garb'],
            shields: ['no_shield'],
            lures: { },
            craftedCounts: {}, 
            craftedAvgValues: {} // <-- NEW: Track average ingredient cost of crafted stacks
        };
        this.spells = {};
        this.activeQuest = null; this.questProgress = 0;
        this.legacyQuestProgress = {}; // Tracks slain *legendary* versions
        this.questsTakenToday = [];
        this.biomeOrder = [];
        this.biomeUnlockLevels = {};

        // Recalculate HP/MP now that base stats are set
        this.hp = this.maxHp;
        this.mp = this.maxMp;
    }

    checkRequirements(skillId) {
    const result = checkSkillRequirements(skillId, this);

    // 2. Handle the legacy logging behavior
    if (!result.allowed) {
        if (typeof addToLog === 'function') {
            addToLog(
                `Requirement not met: ${result.required}`, 
                "text-red-400"
            );
        }
        return false;
    }

    return true;
    }

    // [UPDATED] hasSkill now enforces requirements
    hasSkill(skillId) {
        // Just checks if we bought/unlocked it. 
        // Does NOT care about equipment. Keeps the UI safe.
        return this.unlockedSkills.includes(skillId) || 
               (this.equippedSkills && this.equippedSkills.includes(skillId));
    }

    // 2. NEW COMBAT CHECK (Use this for Damage, Toggles, and Battle Buttons)
    isSkillActive(skillId) {
        // First, do we even own it?
        if (!this.hasSkill(skillId)) return false;

        // Safety: If SKILL_TREE isn't loaded yet, default to TRUE to prevent crash
        if (typeof SKILL_TREE === 'undefined' || !SKILL_TREE[skillId]) return true;

        const skill = SKILL_TREE[skillId];
        
        // --- DEFINE CONSTANTS LOCALLY TO PREVENT MISSING VARIABLE ERRORS ---
        const STR_WEAPONS = ['Hand-to-Hand', 'Longsword', 'Axe', 'Hammer', 'Lance'];
        const DEX_WEAPONS = ['Dagger', 'Thrusting Sword', 'Curved Sword', 'Reaper', 'Bow'];
        const ARMOR_TYPES = {
            'travelers_garb': 'Light', 'leather_armor': 'Light', 'padded_leather': 'Light',
            'silenced_leather_armor': 'Light', 'assassin_cloak_armor': 'Light',
            'chainmail_armor': 'Heavy', 'half_plate_armor': 'Heavy', 
            'steel_plate_armor': 'Heavy', 'adamantine_armor': 'Heavy',
            'warmages_armor': 'Magic', 'archmages_robes': 'Magic'
        };

        // --- GET CURRENT GEAR (With Safety Checks) ---
        const weapon = this.equippedWeapon || { class: 'Hand-to-Hand', element: 'none' };
        const armor = this.equippedArmor || { name: 'naked', element: 'none' };
        const shield = this.equippedShield || { element: 'none' };

        // --- A. CHECK BRANCH (Strength vs Dexterity) ---
        if (skill.branch === 'Strength' || skill.branch === 'Might') {
             if (!STR_WEAPONS.includes(weapon.class)) return false;
        }
        if (skill.branch === 'Dexterity' || skill.branch === 'Finesse') {
             if (!DEX_WEAPONS.includes(weapon.class)) return false;
        }

        // --- B. CHECK SPECIFIC WEAPON ---
        if (skill.weaponReq && weapon.class !== skill.weaponReq) {
            return false;
        }

        // --- C. CHECK ARMOR TYPE ---
        if (skill.armorReq) {
            let currentType = 'Light'; // Default
            // Try to find type by ID, then name
            const key = armor.id || (armor.name ? armor.name.toLowerCase().replace(/ /g, '_') : 'naked');
            if (ARMOR_TYPES[key]) currentType = ARMOR_TYPES[key];
            
            if (currentType !== skill.armorReq) return false;
        }

        // --- D. CHECK ELEMENT ---
        if (skill.elementReq && skill.elementReq !== 'none') {
            const req = skill.elementReq;
            
            // Build list of all active elements on player
            const activeElements = [];
            
            // Weapon Element
            if (this.weaponElement) activeElements.push(this.weaponElement);
            if (weapon.element) activeElements.push(weapon.element);
            if (weapon.damageType && weapon.damageType !== 'physical') activeElements.push(weapon.damageType);

            // Armor/Shield Elements
            if (this.armorElement) activeElements.push(this.armorElement);
            if (this.shieldElement) activeElements.push(this.shieldElement);
            if (armor.element) activeElements.push(armor.element);
            if (shield.element) activeElements.push(shield.element);

            // [FIX] Handle 'elemental' wildcard matching any specific element
            // If the requirement is 'elemental', any non-physical/non-none element counts as a match.
            const genericElementalElements = ['fire', 'water', 'earth', 'wind', 'lightning', 'nature', 'light', 'void'];
            
            let hasMatch = false;
            
            if (req === 'elemental') {
                // Pass if we have ANY valid element in our active list
                hasMatch = activeElements.some(el => genericElementalElements.includes(el) || el === 'all');
            } else {
                // Standard exact match (allow 'all' wildcard from gear)
                hasMatch = activeElements.includes(req) || activeElements.includes('all');
            }
            
            if (!hasMatch) return false;
        }

        // If we passed all checks, the skill is active!
        return true;
    }

    // [NEW] Skill Loadout Methods
    isSkillEquipped(skillId) {
        // [FIX] Safety check: Init array if missing
        if (!this.equippedSkills) this.equippedSkills = [];
        return this.equippedSkills.includes(skillId);
    }

    // [NEW] Dynamic Skill Capacity Getter
    get maxSkillCapacity() {
        let capacity = 8; // Base capacity
        if (this.isSkillActive('magnates_ledger')) capacity += 2;
        if (this.isSkillActive('grandmasters_touch')) capacity += 2;
        if (this.isSkillActive('verdant_transmutation')) capacity += 2;
        return capacity;
    }

    equipSkill(skillId) {
        if (!this.equippedSkills) this.equippedSkills = []; 
        if (this.isSkillEquipped(skillId)) return;
        
        // [FIX] Use dynamic capacity check
        if (this.equippedSkills.length >= this.maxSkillCapacity) {
            addToLog(`Skill Loadout full (Max ${this.maxSkillCapacity}). Unequip something first.`, "text-red-400");
            return;
        }
        this.equippedSkills.push(skillId);
    }
    
    // [NEW] Auto-equip migration for old saves (Updated)
    checkSkillMigration() {
        if (this.hasMigratedSkills) return; 
        if (!this.equippedSkills) this.equippedSkills = [];
        
        if (this.equippedSkills.length === 0 && this.unlockedSkills.length > 0) {
            this.unlockedSkills.forEach(id => {
                const skill = SKILL_TREE[id];
                // Use dynamic capacity here too
                if (skill && (skill.type === 'active' || skill.type === 'toggle')) {
                    if (this.equippedSkills.length < this.maxSkillCapacity) {
                        this.equippedSkills.push(id);
                    }
                }
            });
        }
        this.hasMigratedSkills = true; 
    }

    unequipSkill(skillId) {
        const index = this.equippedSkills.indexOf(skillId);
        if (index > -1) {
            this.equippedSkills.splice(index, 1);
            
            // --- FIX: Auto-deactivate toggle when unequipping ---
            if (typeof SKILL_TREE !== 'undefined') {
                const skillNode = SKILL_TREE[skillId];
                
                // Check if the skill is a toggle and if it possesses a toggle key
                if (skillNode && skillNode.type === 'toggle' && skillNode.effect && skillNode.effect.toggle) {
                    const toggleKey = skillNode.effect.toggle;
                    
                    // If it is currently active, turn it off
                    if (this.skillToggles[toggleKey]) {
                        this.skillToggles[toggleKey] = false;
                        
                        // Optional: Provide feedback if UI functions are available
                        if (typeof addToLog === 'function') {
                            addToLog(`${skillNode.name} deactivated (Unequipped).`, "text-yellow-300");
                        }
                    }
                }
            }
            // --- END FIX ---
        }
    }

    toggleSkillEquip(skillId) {
        if (this.isSkillEquipped(skillId)) {
            this.unequipSkill(skillId);
        } else {
            this.equipSkill(skillId);
        }
    }
    
    unequipAllSkills() {
        if (!this.equippedSkills || this.equippedSkills.length === 0) return;

        let deactivatedCount = 0;

        // 1. Check for active toggles and turn them off
        this.equippedSkills.forEach(skillId => {
            if (typeof SKILL_TREE !== 'undefined') {
                const skillNode = SKILL_TREE[skillId];
                if (skillNode && skillNode.type === 'toggle' && skillNode.effect && skillNode.effect.toggle) {
                    const toggleKey = skillNode.effect.toggle;
                    if (this.skillToggles[toggleKey]) {
                        this.skillToggles[toggleKey] = false;
                        deactivatedCount++;
                    }
                }
            }
        });

        // 2. Clear the array
        this.equippedSkills = [];

        // 3. Log feedback
        if (typeof addToLog === 'function') {
            let msg = "Skill loadout cleared.";
            if (deactivatedCount > 0) msg += ` (${deactivatedCount} active stances deactivated)`;
            addToLog(msg, "text-yellow-300");
        }
    }

    // =========================================================================
    // LOADOUT SYSTEM LOGIC
    // =========================================================================

    /** * Calculates total Skill Points spent on currently unlocked skills.
     * Used to determine how many loadout slots the player has unlocked.
     */
    getSpentSkillPoints() {
        if (typeof SKILL_TREE === 'undefined') return 0;
        let spent = 0;
        this.unlockedSkills.forEach(id => {
            const skill = SKILL_TREE[id];
            // Only count standard skills (costType not 'mastery')
            if (skill && skill.costType !== 'mastery') {
                spent += (skill.cost || 1);
            }
        });
        return spent;
    }

    /**
     * Calculates available slots: 2 Base + 1 for every 50 SP spent.
     */
    getMaxLoadoutSlots() {
        return 4;
    }

    /**
     * Saves the current set of equipped skills to a specific slot index.
     */
    saveLoadout(slotIndex) {
        const maxSlots = this.getMaxLoadoutSlots();
        if (slotIndex < 0 || slotIndex >= maxSlots) return false;

        // Preserve existing name if it exists, otherwise default
        let currentName = `Loadout ${slotIndex + 1}`;
        if (this.skillLoadouts[slotIndex] && this.skillLoadouts[slotIndex].name) {
            currentName = this.skillLoadouts[slotIndex].name;
        }

        const loadoutData = {
            name: currentName,
            timestamp: Date.now(),
            skills: [...this.equippedSkills]
        };

        // Ensure array exists up to this index
        while (this.skillLoadouts.length <= slotIndex) {
            this.skillLoadouts.push(null);
        }

        this.skillLoadouts[slotIndex] = loadoutData;
        return true;
    }

    renameLoadout(slotIndex, newName) {
        if (!this.skillLoadouts[slotIndex]) return false;
        // Basic sanitization: trim and limit length
        this.skillLoadouts[slotIndex].name = newName.trim().substring(0, 20); 
        return true;
    }

    /**
     * Loads skills from a slot, respecting ownership and current capacity.
     */
    loadLoadout(slotIndex) {
        if (!this.skillLoadouts[slotIndex]) return false;

        const savedSkills = this.skillLoadouts[slotIndex].skills;
        
        // 1. Validation: Only equip skills we still actually own
        // (Prevents bugs if a player respecs but tries to load an old build)
        const validSkills = savedSkills.filter(id => this.hasSkill(id));
        
        // 2. Validation: Respect current max capacity
        if (validSkills.length > this.maxSkillCapacity) {
            this.equippedSkills = validSkills.slice(0, this.maxSkillCapacity);
            if (typeof addToLog === 'function') {
                addToLog("Loadout truncated to fit current capacity.", "text-yellow-300");
            }
        } else {
            this.equippedSkills = validSkills;
        }
        
        // 3. Deactivate any toggles that aren't in the new loadout
        this.validateWeaponToggles(); // Use your existing validation logic

        return true;
    }
    // =========================================================================
    
    // [NEW] Auto-equip migration for old saves
    checkSkillMigration() {
        // If we have already migrated this save, do not auto-equip again
        if (this.hasMigratedSkills) return; 

        if (!this.equippedSkills) this.equippedSkills = [];
        
        // Only run logic if we have unlocked skills but nothing equipped
        if (this.equippedSkills.length === 0 && this.unlockedSkills.length > 0) {
            // Auto-equip existing active/toggles up to limit
            this.unlockedSkills.forEach(id => {
                const skill = SKILL_TREE[id];
                if (skill && (skill.type === 'active' || skill.type === 'toggle')) {
                    if (this.equippedSkills.length < 8) {
                        this.equippedSkills.push(id);
                    }
                }
            });
        }
        
        // Mark migration as complete so it doesn't overwrite user's choices later
        this.hasMigratedSkills = true; 
    }

    // Method to link ability data after class/race are set
    // MODIFIED: Uses stored _classKey directly
    updateAbilityReferences() {
        console.log(`DEBUG: updateAbilityReferences called. Player Class Key: "${this._classKey}", Race: "${this.race}"`);

        // Get signature ability using the stored key
        const classData = this._classKey ? CLASSES[this._classKey] : null;
        this.signatureAbilityData = classData ? classData.signatureAbility : null;
        console.log("DEBUG: Signature Ability Data set to:", this.signatureAbilityData ? {...this.signatureAbilityData} : null);

        // Get racial passive function
        this.racialPassive = RACES[this.race]?.passive?.applyEffect || ((chance, playerLevel) => chance);
        console.log("DEBUG: Racial Passive Function assigned:", typeof this.racialPassive === 'function');
    }


     // Method to apply racial passive modifiers (specifically for Human now)
    applyRacialPassive(baseChance) {
        // Human passive: Jack of All Trades
        if (this.race === 'Human' && typeof this.racialPassive === 'function') {
            return this.racialPassive(baseChance, this.level); // Call the specific function from RACES data
        }
        // Add other race passive checks here if they modify chances
        // else if (this.race === 'SomeOtherRace' && ...) { ... }

        // Default: no modification
        return baseChance;
    }

    /**
     * Centralized function to roll for a chance-based effect.
     * Automatically applies racial modifiers (Dragonborn penalty, Human bonus, Halfling reroll).
     * @param {number} baseChance The base probability of the event (e.g., 0.1 for 10%).
     * @param {string} debugPurpose A label for debugging logs (e.g., "Weapon Crit").
     * @returns {boolean} True if the effect triggered, false otherwise.
     */
    rollForEffect(baseChance, debugPurpose = "Unknown Effect") {
        // --- CHANCE LOGGING: Log initial state ---
        if (logChanceCalculations) { // Check the new global flag
            addToLog(`DEBUG (Chance) [${debugPurpose}]: Base Chance = ${(baseChance * 100).toFixed(1)}%`, 'text-gray-500');
        }

        if (baseChance <= 0) {
             // --- CHANCE LOGGING: Log failure due to 0% ---
             if (logChanceCalculations) addToLog(`DEBUG (Chance) [${debugPurpose}]: Result = FAIL (Base chance <= 0)`, 'text-gray-500');
             return false;
        }
        if (baseChance >= 1) {
             // --- CHANCE LOGGING: Log success due to 100% ---
             if (logChanceCalculations) addToLog(`DEBUG (Chance) [${debugPurpose}]: Result = SUCCESS (Base chance >= 1)`, 'text-gray-500');
            return true;
        }


        let modifiedChance = baseChance;
        
        // --- NEW: Mountain Magic Arts (2x Proc) ---
        if (this.skillToggles && this.skillToggles['mountain_magic_arts'] && this.equippedWeapon.class === 'Hammer') {
            modifiedChance *= 2.0;
        }

        // --- NEW: Bloodcarver Dagger (Debuff Chance) ---
        if (this.isSkillActive('bloodcarver_dagger') && this.equippedWeapon.class === 'Dagger') {
            // Heuristic: If purpose implies a debuff
            if (debugPurpose.includes('Poison') || debugPurpose.includes('Bleed') || debugPurpose.includes('Paralyze') || debugPurpose.includes('Toxic')) {
                modifiedChance *= 1.5; // +50% relative
            }
        }
        // -------------------------------------------------
        let logSteps = []; // Keep track of modifications for logging

        // 1. Apply Dragonborn penalty first
        if (this.race === 'Dragonborn') {
            const penalty = (this.level >= 20) ? 0.25 : 0.5; // 75% reduction or 50% reduction
            const oldChance = modifiedChance;
            modifiedChance *= penalty;
            logSteps.push(`Dragonborn Penalty x${penalty.toFixed(2)} -> ${(modifiedChance * 100).toFixed(1)}%`);
        }

        // 2. Apply Human bonus
        const humanBonusApplied = this.race === 'Human' && typeof this.racialPassive === 'function';
        if (humanBonusApplied) {
            const oldChance = modifiedChance;
            modifiedChance = this.applyRacialPassive(modifiedChance); // Call the specific function from RACES data
            logSteps.push(`Human Bonus -> ${(modifiedChance * 100).toFixed(1)}%`);
        }

        // --- CHANCE LOGGING: Log final chance before roll ---
        if (logChanceCalculations && logSteps.length > 0) {
             addToLog(`DEBUG (Chance) [${debugPurpose}]: Modifications => ${logSteps.join(' | ')}`, 'text-gray-500');
        } else if (logChanceCalculations) {
            addToLog(`DEBUG (Chance) [${debugPurpose}]: Final Chance = ${(modifiedChance * 100).toFixed(1)}% (No mods applied)`, 'text-gray-500');
        }


        // 3. Make the initial roll
        let roll = Math.random();
        // --- CHANCE LOGGING: Log the roll ---
        if (logChanceCalculations) {
            addToLog(`DEBUG (Chance) [${debugPurpose}]: Rolled ${roll.toFixed(3)} vs Chance ${(modifiedChance * 100).toFixed(1)}%`, 'text-gray-500');
        }

        if (roll < modifiedChance) {
            // --- CHANCE LOGGING: Log success ---
            if (logChanceCalculations) addToLog(`DEBUG (Chance) [${debugPurpose}]: Result = SUCCESS`, 'text-green-400');
            if (isDebugVisible && !logChanceCalculations) console.log(`Racial Roll [${debugPurpose}]: SUCCESS (Base: ${baseChance.toFixed(2)}, Mod: ${modifiedChance.toFixed(2)}, Roll: ${roll.toFixed(2)})`);
            return true; // Success!
        }

        // 4. Handle Halfling reroll on failure
        if (this.race === 'Halfling') {
            const rerollChance = (this.level >= 20) ? (1/6) : 0.10; // 10% or 1-in-6
             // --- CHANCE LOGGING: Log Halfling attempt ---
             if (logChanceCalculations) {
                 addToLog(`DEBUG (Chance) [${debugPurpose}]: Halfling Reroll Check (${(rerollChance * 100).toFixed(1)}% chance)`, 'text-gray-500');
             }

            let rerollLuckRoll = Math.random(); // Roll for the *chance* to reroll
            if (rerollLuckRoll < rerollChance) {
                 // --- CHANCE LOGGING: Log Halfling reroll triggered ---
                 if (logChanceCalculations) addToLog(`DEBUG (Chance) [${debugPurpose}]: Halfling Reroll Triggered! Rerolling...`, 'text-yellow-300');

                // Halfling luck triggers a *recalculation* against the modified chance, not a guaranteed success
                let reroll = Math.random();
                 // --- CHANCE LOGGING: Log the actual reroll value ---
                 if (logChanceCalculations) {
                    addToLog(`DEBUG (Chance) [${debugPurpose}]: Rerolled ${reroll.toFixed(3)} vs Chance ${(modifiedChance * 100).toFixed(1)}%`, 'text-yellow-300');
                 }

                if (reroll < modifiedChance) {
                    addToLog("Your uncanny luck grants you a second chance... and it succeeds!", "text-green-300");
                    // --- CHANCE LOGGING: Log Halfling success ---
                    if (logChanceCalculations) addToLog(`DEBUG (Chance) [${debugPurpose}]: Result = HALFLING SUCCESS`, 'text-green-400');
                    if (isDebugVisible && !logChanceCalculations) console.log(`Racial Roll [${debugPurpose}]: HALFLING SUCCESS (Base: ${baseChance.toFixed(2)}, Mod: ${modifiedChance.toFixed(2)}, Reroll: ${reroll.toFixed(2)})`);
                    return true; // Reroll succeeded!
                } else {
                     // --- CHANCE LOGGING: Log Halfling reroll failure ---
                     if (logChanceCalculations) addToLog(`DEBUG (Chance) [${debugPurpose}]: Reroll Failed. Result = FAIL`, 'text-red-400');
                }
            } else {
                // --- CHANCE LOGGING: Log Halfling luck didn't trigger ---
                if (logChanceCalculations) addToLog(`DEBUG (Chance) [${debugPurpose}]: Halfling Reroll Not Triggered. Result = FAIL`, 'text-red-400');
            }
             // Fall through to standard failure logging if reroll wasn't attempted or failed
        }

        // 5. Standard failure for all other races (or Halfling fail)
        // --- CHANCE LOGGING: Log final failure ---
        if (logChanceCalculations && this.race !== 'Halfling') { // Avoid double logging Halfling fail
             addToLog(`DEBUG (Chance) [${debugPurpose}]: Result = FAIL`, 'text-red-400');
        }
        if (isDebugVisible && !logChanceCalculations) console.log(`Racial Roll [${debugPurpose}]: FAIL (Base: ${baseChance.toFixed(2)}, Mod: ${modifiedChance.toFixed(2)}, Roll: ${roll.toFixed(2)})`);
        return false;
    }


    // Derived Stats using Getters
    get maxHp() {
        // (Base Vigor + Spent Vigor) * 5 + Derived Bonus HP (from background)
        let finalHp = ((this.vigor + this.bonusVigor) * 5) + this.bonusHp;
        if (this.foodBuffs?.max_hp) {
            finalHp *= this.foodBuffs.max_hp.value;
        }
        return Math.floor(finalHp);
    }
    get maxMp() {
        // (Base Focus + Spent Focus) * 5 + Derived Bonus MP (from background)
        let finalMp = ((this.focus + this.bonusFocus) * 5) + this.bonusMp;
        if (this.foodBuffs?.max_mp) {
            finalMp *= this.foodBuffs.max_mp.value;
        }
        return Math.floor(finalMp);
    }
    get physicalDefense() { return Math.floor(((this.stamina + this.bonusStamina) + (this.vigor + this.bonusVigor)) / 2) + this.bonusPhysicalDefense; }
    get magicalDefense() { return Math.floor(((this.stamina + this.bonusStamina) + (this.focus + this.bonusFocus)) / 2) + this.bonusMagicalDefense; }
    get physicalDamageBonus() { return (this.strength + this.bonusStrength) + this.bonusPhysicalDamage; }
    get magicalDamageBonus() { return (this.intelligence + this.bonusIntelligence) + this.bonusMagicalDamage; }
    // Split Luck contributions for clarity
    get critChance() { return Math.min(0.3, (((this.luck + this.bonusLuck) * 0.5) / 100) + this.bonusCritChance); }
    get evasionChance() { return Math.min(0.2, (((this.luck + this.bonusLuck) * 0.5) / 100) + this.bonusEvasion); }
    get resistanceChance() {
        let baseResist = Math.min(0.5, ((this.luck + this.bonusLuck) / 100)); // Use total luck
        
        // [ADD THIS] Aegis of the Soul: +50% Resistance
        if (this.skillToggles && this.skillToggles['mana_steel_aura']) {
            baseResist += 0.50; 
        }

        // --- CLANKERS: Absolute Logic ---
        if (this.race === 'Clankers') {

            const multiplier = (this.level >= 20) ? 2.0 : 1.5; // 100% or 50% relative bonus
            baseResist = Math.min(0.80, baseResist * multiplier); // Cap at 80%
        }
        // --- End Clankers Logic ---
        return baseResist;
    }

    getMovementSpeed() {
        let moveDistance = 3; // Base Speed

        // 1. Stance Overrides (Priority)
        if (this.skillToggles['iron_mountain']) moveDistance = 1;

        // 2. Additive Modifiers
        if (this.skillToggles['titan_swing']) moveDistance -= 1;
        if (this.skillToggles['crucible_of_the_beast']) moveDistance += 1;
        if (this.statusEffects.buff_stormhearted) moveDistance += 1;

        // 3. Gravimetric Ascension & Polarity
        const ascension = this.skillToggles['gravimetric_ascension'];
        const polarity = this.skillToggles['geomantic_polarity'];

        if (ascension) {
            if (polarity) {
                moveDistance += 2; // Inverted (Grounded)
            } else {
                moveDistance = Math.max(1, moveDistance - 1); // Flying
            }
        }

        // 4. Wind Skills (The Fix)
        if (this.skillToggles['avatar_of_tempest']) moveDistance += 1;
        
        // Use isSkillActive to ensure requirements (Wind Weapon/Gear) are met
        if (this.isSkillActive('slipstream_velocity')) moveDistance += 1;

        // 5. Gear & Racial Bonuses
        const armorName = this.equippedArmor ? this.equippedArmor.name : "naked";
        const isUnarmored = !this.equippedArmor || ["Traveler's Garb", "Traveler’s Armor", "naked"].includes(armorName);
        
        if (this.isSkillActive('flowing_water') && isUnarmored && this.equippedWeapon?.class === 'Hand-to-Hand') {
            moveDistance += 2;
        }

        if (this.race === 'Elf' && (!this.equippedArmor || !this.equippedArmor.metallic)) {
            moveDistance += (this.level >= 20 ? 2 : 1);
        }

        // 6. Buffs (Valhalla, Potions, etc.)
        if (this.statusEffects.bonus_speed) moveDistance += this.statusEffects.bonus_speed.move;
        if (this.statusEffects.buff_valhalla) moveDistance += this.statusEffects.buff_valhalla.move;
        if (this.foodBuffs.movement_speed) moveDistance += this.foodBuffs.movement_speed.value;

        // 7. Debuffs (Slow)
        if (this.statusEffects.slowed) {
            // Ensure we don't go below 1 movement (unless Iron Mountain locked it)
            moveDistance = Math.max(1, moveDistance + this.statusEffects.slowed.move);
        }

        return Math.max(0, moveDistance); // Safety floor
    }

    calculateXpToNextLevel(level) {
        const lvl = level || this.level;
        // Ensure level is at least 1 for calculation
        if (lvl < 1) return 100;
        return Math.floor(100 * Math.pow(lvl, 1.15));
    }


    recalculateLevelFromTotalXp() {
        const oldLevel = this.level;
        let newLevel = 1;
        let xpPool = this.totalXp;
        let xpForNext = this.calculateXpToNextLevel(newLevel);

        // Ensure xpPool is a non-negative number
        xpPool = Math.max(0, xpPool || 0);


        while (xpPool >= xpForNext && newLevel < 999) { // Added level cap safety
            xpPool -= xpForNext;
            newLevel++;
            xpForNext = this.calculateXpToNextLevel(newLevel);
            if (xpForNext <= 0) break; // Safety break for weird curves
        }


        this.level = newLevel;
        this.xp = xpPool;
        this.xpToNextLevel = this.calculateXpToNextLevel(this.level);

        // Calculate available stat points based ONLY on level difference from last known state
        const levelsGained = this.level - oldLevel;
        if (levelsGained > 0) {
            this.statPoints = (this.statPoints || 0) + levelsGained * 5; // Ensure statPoints is a number
        } else if (levelsGained < 0) {
             // Handle level loss? For now, just recalculate available based on current level.
             console.warn("Player level decreased during recalculation. This might indicate an issue.");
             const maxPossiblePoints = Math.max(0, (this.level - 1) * 5);
             const totalSpentPoints = (this.bonusVigor || 0) + (this.bonusFocus || 0) + (this.bonusStamina || 0) + (this.bonusStrength || 0) + (this.bonusIntelligence || 0) + (this.bonusLuck || 0);
             this.statPoints = Math.max(0, maxPossiblePoints - totalSpentPoints);
        } else {
             // Level unchanged, ensure statPoints is non-negative
             this.statPoints = Math.max(0, this.statPoints || 0);
        }


        // IMPORTANT: Validate spent points against current level possibility
        const totalSpentPoints = (this.bonusVigor || 0) + (this.bonusFocus || 0) + (this.bonusStamina || 0) + (this.bonusStrength || 0) + (this.bonusIntelligence || 0) + (this.bonusLuck || 0);
        const maxPossiblePoints = Math.max(0, (this.level - 1) * 5);


        if (totalSpentPoints > maxPossiblePoints) {
            console.warn("Spent points exceed possible points for level. Resetting bonus stats.");
            // This scenario implies data corruption or major rebalancing.
            // Safest action is to reset bonus stats and refund based on current level.
            this.bonusVigor = 0; this.bonusFocus = 0; this.bonusStamina = 0;
            this.bonusStrength = 0; this.bonusIntelligence = 0; this.bonusLuck = 0;
            this.statPoints = maxPossiblePoints;
             this.recalculateGrowthBonuses(); // Recalculate derived based on reset bonuses
        } else {
            // Ensure statPoints reflects available points correctly
             this.statPoints = Math.max(0, maxPossiblePoints - totalSpentPoints);
        }


        return levelsGained; // Return levels gained for potential notifications
    }


    recalculateGrowthBonuses() {
        // Reset all derived bonuses before recalculating
        this.bonusHp = 0;
        this.bonusMp = 0;
        this.bonusPhysicalDefense = 0;
        this.bonusMagicalDefense = 0;
        this.bonusPhysicalDamage = 0;
        this.bonusMagicalDamage = 0;
        this.bonusEvasion = 0;
        this.bonusCritChance = 0;

        if (!this.backgroundKey || !BACKGROUNDS[this.backgroundKey]) return;

        const backgroundData = BACKGROUNDS[this.backgroundKey];
        // Ensure seed exists and is valid before creating RNG
        if (this.seed === null || this.seed === undefined || isNaN(Number(this.seed))) {
            console.warn("Player seed is invalid during recalculateGrowthBonuses. Generating new seed.");
            this.seed = Math.floor(Math.random() * 1000000);
        }
        const rng = seededRandom(this.seed);


        if (backgroundData.growthBonus.wretch) {
            const totalPointsSpent = (this.bonusVigor || 0) + (this.bonusFocus || 0) + (this.bonusStamina || 0) + (this.bonusStrength || 0) + (this.bonusIntelligence || 0) + (this.bonusLuck || 0);
            const procs = Math.floor(totalPointsSpent / 2); // Wretch gets bonus every 2 points spent
            const possibleBonuses = ['vigor', 'focus', 'stamina', 'strength', 'intelligence', 'luck'];

            for (let i = 0; i < procs; i++) {
                const randomStat = possibleBonuses[Math.floor(rng() * possibleBonuses.length)];
                this.applyBonusForStat(randomStat, 1, rng, true); // Apply 1 point bonus
            }
            // Also apply normal bonuses for the points spent directly
            this.applyBonusForStat('vigor', this.bonusVigor || 0, rng);
            this.applyBonusForStat('focus', this.bonusFocus || 0, rng);
            this.applyBonusForStat('stamina', this.bonusStamina || 0, rng);
            this.applyBonusForStat('strength', this.bonusStrength || 0, rng);
            this.applyBonusForStat('intelligence', this.bonusIntelligence || 0, rng);
            this.applyBonusForStat('luck', this.bonusLuck || 0, rng);


            return; // Exit after Wretch logic
        }

        // Standard background bonus application
        this.applyBonusForStat('vigor', this.bonusVigor || 0, rng);
        this.applyBonusForStat('focus', this.bonusFocus || 0, rng);
        this.applyBonusForStat('stamina', this.bonusStamina || 0, rng);
        this.applyBonusForStat('strength', this.bonusStrength || 0, rng);
        this.applyBonusForStat('intelligence', this.bonusIntelligence || 0, rng);
        this.applyBonusForStat('luck', this.bonusLuck || 0, rng);
    }

    recalculateSkillPoints() {
        // 1. Calculate Total Points Earned
        // Formula: 1 Point every 3 levels starting at Level 6. (6, 9, 12...)
        const totalEarned = (this.level < 6) ? 0 : Math.floor((this.level - 6) / 3) + 1;
        
        // 2. Calculate Points Spent
        // 'the_root' is free, so we subtract 1 from the total unlocked count.
        const uniqueUnlocked = new Set(this.unlockedSkills); // Safety for duplicates
        
        // Calculate standard skill points spent (excluding mastery nodes)
        let spent = 0;
        let masterySpent = 0;
        
        uniqueUnlocked.forEach(skillId => {
            if (skillId === 'the_root') return; // Free
            const node = SKILL_TREE[skillId];
            if (node) {
                if (node.costType === 'mastery') {
                    masterySpent++;
                } else {
                    spent++;
                }
            }
        });
        
        // 3. Set Available Points
        this.skillPoints = Math.max(0, totalEarned - spent);
        
        // 4. Calculate Mastery Skill Points
        // Formula: 1 Point every 100 levels.
        const masteryEarned = Math.floor(this.level / 100);
        
        // Ensure masteryPoints property exists
        if (this.masteryPoints === undefined) this.masteryPoints = 0;
        
        this.masteryPoints = Math.max(0, masteryEarned - masterySpent);

        console.log(`Skill Points Sync: Level ${this.level} -> Earned ${totalEarned}, Spent ${spent}, Available ${this.skillPoints}. Mastery Earned ${masteryEarned}, Spent ${masterySpent}, Available ${this.masteryPoints}`);
    }

    applyBonusForStat(stat, points, rng, isWretchProc = false) {
         // Ensure points is a non-negative number
         points = Math.max(0, points || 0);
        if (!this.backgroundKey || !BACKGROUNDS[this.backgroundKey] || points === 0) return;


        const background = BACKGROUNDS[this.backgroundKey];
        const favoredStats = background.favoredStats.map(s => s.toLowerCase());

        // Wretch procs apply regardless of favored stats
        // Standard bonuses only apply if the stat is favored (or if background is Wretch itself, handled above)
        if (!isWretchProc && !background.growthBonus.wretch && !favoredStats.includes(stat)) return;


        switch(stat) {
            case 'vigor': this.bonusHp += 5 * points; break;
            case 'focus': this.bonusMp += 5 * points; break;
            case 'stamina':
                for (let i = 0; i < points; i++) {
                    if (rng() < 0.5) this.bonusPhysicalDefense += 0.5;
                    else this.bonusMagicalDefense += 0.5;
                }
                break;
            case 'strength': this.bonusPhysicalDamage += 1 * points; break;
            case 'intelligence': this.bonusMagicalDamage += 1 * points; break;
            case 'luck':
                for (let i = 0; i < points; i++) {
                    if (rng() < 0.5) this.bonusEvasion += 0.005; // 0.5% per point
                    else this.bonusCritChance += 0.005; // 0.5% per point
                }
                break;
        }
         // Ensure derived stats are numbers after calculation
         this.bonusHp = this.bonusHp || 0;
         this.bonusMp = this.bonusMp || 0;
         this.bonusPhysicalDefense = this.bonusPhysicalDefense || 0;
         this.bonusMagicalDefense = this.bonusMagicalDefense || 0;
         this.bonusPhysicalDamage = this.bonusPhysicalDamage || 0;
         this.bonusMagicalDamage = this.bonusMagicalDamage || 0;
         this.bonusEvasion = this.bonusEvasion || 0;
         this.bonusCritChance = this.bonusCritChance || 0;
    }


    clearFoodBuffs() {
        if (Object.keys(this.foodBuffs).length > 0) {
            this.foodBuffs = {};
            addToLog("The effects of your last meal have worn off.", "text-gray-400");
            this.hp = Math.min(this.hp, this.maxHp);
            this.mp = Math.min(this.mp, this.maxMp);
        }
    }

    clearEncounterBuffs() {
        let buffsCleared = false;
        for (const key in this.foodBuffs) {
            this.foodBuffs[key].duration--;
            if (this.foodBuffs[key].duration <= 0) {
                delete this.foodBuffs[key];
                buffsCleared = true;
            }
        }
        if (buffsCleared) {
            addToLog("The lingering effects of your meal begin to fade...", "text-purple-400");
            this.hp = Math.min(this.hp, this.maxHp);
            this.mp = Math.min(this.mp, this.maxMp);
            updateStatsView();
        }
    }

    clearBattleBuffs() {
        // 1. Reset Combat Counters & Accumulators
        this.staticCharge = 0;          // Lightning: Voltaic Momentum
        this.hammerMomentumStacks = 0;  // Hammer: Swinging Momentum
        this.hewingStacks = 0;          // Axe: Woodcutter
        this.tilesMovedThisTurn = 0;
        this.tilesMovedLastTurn = 0;
        this.hasMovedThisTurn = false;
        this.combatTags = {};
        
        // 2. Reset Temporary Combat Flags
        this.tempAttackMods = {};       // Clears temp multipliers/crit
        delete this.tempCritChanceFlat; 
        this.specialWeaponStates = {};  // Clears Void Greatsword revive, etc.
        this.encounterFlags = {};       // Clears Earth Magmatic Stress triggers, Last Stand, etc.
        this.lastTargetId = null;       // Reset combo targeting

        // 3. Reset Ability Usage
        // We generally don't disable signatureAbilityToggleActive here to allow stances to persist,
        // but specific battle-only toggles are cleared in the loop below.
        
        // 4. Consolidate & Clear Status Effects
        const buffsToClear = [
            // --- Standard / Item Buffs ---
            'buff_strength', 'buff_chaos_strength', 'buff_titan',
            'buff_defense', 'stonehide', 'buff_shroud', 'buff_voidwalker',
            'buff_haste', 'buff_hermes', 'buff_ion_self', 'buff_ion_other',
            'buff_magic_defense', 'buff_divine', 'buff_enrage', 
            'buff_magic_dust', 'buff_whetstone',
            'buff_cragblade', 'buff_lightning_rod', 'buff_fertilized',
            'buff_poison_grease', 'buff_paralysis_grease', 'buff_elemental_grease',

            // --- Elemental Arts (NEW) ---
            'buff_keraunos_charge',   // Lightning (Weapon Infusion)
            'buff_stormhearted',      // Lightning (Aspect of Tempest - VITAL to clear weakness)
            'buff_frozen_armament',   // Water
            'buff_aqueous_aegis',     // Water
            'buff_blazing_spear',     // Fire
            'buff_decaying_touch',    // Nature
            'buff_magmatic_stress',   // Earth (Heating Rock)
            'buff_lithic_aura',       // Earth (Totem Aura)
            'buff_crucible_beast',    // Nature (Transformation)
            
            // --- Weapon Arts & Class Buffs ---
            'buff_final_horizon',     // Lance
            'buff_sepulchral',        // Scythe
            'buff_crimson_penance',   // Scythe
            'buff_swiftness',         // Scythe/General
            'buff_gore_howl',         // Axe
            'buff_unending_flow',     // Curved Sword
            'buff_blade_waltz',       // Curved Sword
            'buff_valhalla',          // Light (Banquet Stats)

            // --- States & Debuffs ---
            'preparing_feast',        // Light (Banquet Pre-cast)
            'shredded', 'sundered', 'scorned', 
            'drenched', 'paralyzed', 'petrified', 'toxic', 'poison', 'swallowed',
            'blinded', 'silenced', 'rooted', 'slowed', 'inaccurate',
            'mark', 'bow_mark', 'arcane_sigil', 'lingering_magma',
            'debuff_oiled', 'debuff_viscous', 'debuff_lightstone_primed',
            'jolted', 'frozen', 'stunned', 'bleeding', 'weakened', 'rot', 'cursed',
            'monster_lure', 'clumsy', 'fumble',
            'alchemical_barrier', 'magic_dampen', 'elemental_vuln',
            'bonus_crit', 'bonus_speed', 'bonus_range'
        ];

        let cleared = false;

        // Clear specific buffs
        for (const buffKey of buffsToClear) {
            if (this.statusEffects[buffKey]) {
                delete this.statusEffects[buffKey];
                cleared = true;
            }
        }

        // Safety Catch-all: Remove any status with a short duration (< 100 turns)
        // This ensures we catch any temp combat buffs we might have missed in the list.
        for (const key in this.statusEffects) {
            if (this.statusEffects[key].duration && this.statusEffects[key].duration < 100) {
                delete this.statusEffects[key];
                cleared = true;
            }
        }

        // Clear toggle state if it was a temporary combat stance (optional logic)
        // For now, we leave signature toggles active unless specifically handled elsewhere.

        if (cleared) {
            addToLog("The temporary effects of the battle wear off.", "text-gray-400");
            if (typeof updateStatsView === 'function') updateStatsView();
        }
    }

    // --- PASTE THIS INSIDE CLASS PLAYER (engine.js) ---

    /**
     * Checks active toggles and deactivates any that don't match the current weapon.
     */
    validateWeaponToggles() {
        if (typeof SKILL_TREE === 'undefined') return;

        let deactivatedCount = 0;

        for (const toggleKey in this.skillToggles) {
            if (!this.skillToggles[toggleKey]) continue;

            const skillId = this.unlockedSkills.find(id => 
                SKILL_TREE[id] && 
                SKILL_TREE[id].type === 'toggle' && 
                SKILL_TREE[id].effect.toggle === toggleKey
            );

            if (skillId) {
                const skill = SKILL_TREE[skillId];
                if (skill.weaponReq && this.equippedWeapon.class !== skill.weaponReq) {
                    this.skillToggles[toggleKey] = false;
                    deactivatedCount++;
                    if (typeof addToLog === 'function') {
                        addToLog(`${skill.name} deactivated (Incompatible Weapon).`, "text-yellow-300");
                    }
                }
            }
        }
        
        if (deactivatedCount > 0 && typeof updateStatsView === 'function') {
             updateStatsView();
        }
    }

    /**
     * Equips an item to the player, handling 2-of-3 rule, stats, and side effects.
     */
    equipItem(itemKey, silent = false) {
        const details = getItemDetails(itemKey);
        if (!details) return null;

        let itemType = null;
        if (WEAPONS[itemKey]) itemType = 'weapon';
        else if (CATALYSTS[itemKey]) itemType = 'catalyst';
        else if (SHIELDS[itemKey]) itemType = 'shield';
        else if (ARMOR[itemKey]) itemType = 'armor';
        else if (LURES[itemKey]) itemType = 'lure';

        // --- ARMOR ---
        if (itemType === 'armor') {
            if (this.equippedArmor.name === details.name) return;
            const oldItemKey = this.equippedArmor.name !== ARMOR['travelers_garb'].name ? findKeyByInstance(ARMOR, this.equippedArmor) : null;
            this.equippedArmor = details;
            
            // Restore Enchantment
            const storedArmorEnchantment = this.enchantments[itemKey];
            this.armorElement = storedArmorEnchantment || 'none';
            
            if (!silent) addToLog(`Equipped: ${details.name}.`);
            return oldItemKey;
        }
        
        // --- LURES ---
        if (itemType === 'lure') {
            this.equippedLure = itemKey;
            if (!silent) addToLog(`Equipped: ${details.name}.`);
            return null;
        }

        // --- WEAPONS / SHIELDS / CATALYSTS (The 2-of-3 Rule) ---
        if (itemType === 'weapon' || itemType === 'catalyst' || itemType === 'shield') {
            
            // 1. Determine if the NEW item is 2-Handed
            let isTwoHanded = details.class === 'Hand-to-Hand' || details.effect?.dualWield;
            if (isTwoHanded && details.class === 'Hand-to-Hand' && this.race === 'Beastkin' && this.level >= 20) isTwoHanded = false;
            if (isTwoHanded && details.class === 'Hand-to-Hand' && this.isSkillActive('titans_grip') && this.skillToggles['iron_mountain']) {
                isTwoHanded = false;
            }

            let unequippedItemKey = null;

            // 2. Handle Logic for equipping a 2-Handed Item
            if (isTwoHanded) {
                // If picking up a 2H weapon, we must drop the Shield and Catalyst
                if (this.equippedShield.name !== SHIELDS['no_shield'].name) unequippedItemKey = this.unequipItem('shield', silent);
                if (this.equippedCatalyst.name !== CATALYSTS['no_catalyst'].name) {
                    const k2 = this.unequipItem('catalyst', silent);
                    if(!unequippedItemKey) unequippedItemKey = k2; 
                }
            } 
            // 3. Handle Logic for equipping a 1-Handed Item (FIFO Slot Management)
            else {
                const typeIndex = this.equipmentOrder.indexOf(itemType);
                const isDefaultItem = (itemType === 'catalyst' && itemKey === 'no_catalyst') ||
                                  (itemType === 'shield' && itemKey === 'no_shield') ||
                                  (itemType === 'weapon' && itemKey === 'fists');
                
                if (typeIndex > -1) this.equipmentOrder.splice(typeIndex, 1);
                
                if (!isDefaultItem) {
                    // If we already have 2 slots filled, drop the oldest one
                    if (this.equipmentOrder.length >= 2) {
                        const typeToUnequip = this.equipmentOrder.shift();
                        if (typeToUnequip && typeToUnequip !== itemType) {
                            unequippedItemKey = this.unequipItem(typeToUnequip, silent);
                        }
                    }
                    this.equipmentOrder.push(itemType);
                }
            }

            // 4. Check conflicts with the CURRENTLY equipped weapon (if we are equipping a shield/catalyst)
            let isEquippedWeaponTwoHanded = this.equippedWeapon?.class === 'Hand-to-Hand' || this.equippedWeapon?.effect?.dualWield;
            if (isEquippedWeaponTwoHanded && this.equippedWeapon?.class === 'Hand-to-Hand' && this.race === 'Beastkin' && this.level >= 20) isEquippedWeaponTwoHanded = false;
            if (isEquippedWeaponTwoHanded && this.equippedWeapon?.class === 'Hand-to-Hand' && this.isSkillActive('titans_grip') && this.skillToggles['iron_mountain']) {
                 isEquippedWeaponTwoHanded = false;
            }

            if ((itemType === 'shield' || itemType === 'catalyst') && isEquippedWeaponTwoHanded) {
                if (!silent) addToLog(`Cannot use a ${itemType} while using ${this.equippedWeapon.name}.`, 'text-red-400');
                const failedTypeIndex = this.equipmentOrder.indexOf(itemType);
                if (failedTypeIndex > -1) this.equipmentOrder.splice(failedTypeIndex, 1);
                return null;
            }

            // 5. Perform the Equip
            if (itemType === 'weapon') {
                if (this.equippedWeapon.name !== WEAPONS['fists'].name && !unequippedItemKey) {
                    unequippedItemKey = findKeyByInstance(WEAPONS, this.equippedWeapon);
                }
                this.equippedWeapon = details;
                
                // Restore Enchantment
                const stored = this.enchantments[itemKey];
                this.weaponElement = stored || 'none';
                
                // [FEATURE] Validate Toggles (Turn off Longsword stances if equipping Axe, etc.)
                this.validateWeaponToggles();
                
            } else if (itemType === 'catalyst') {
                 if (this.equippedCatalyst.name !== CATALYSTS['no_catalyst'].name && !unequippedItemKey) {
                    unequippedItemKey = findKeyByInstance(CATALYSTS, this.equippedCatalyst);
                }
                this.equippedCatalyst = details;

            } else if (itemType === 'shield') {
                 if (this.equippedShield.name !== SHIELDS['no_shield'].name && !unequippedItemKey) {
                    unequippedItemKey = this.unequipItem('shield', silent);
                }
                this.equippedShield = details;
                
                // Restore Enchantment
                const stored = this.enchantments[itemKey];
                this.shieldElement = stored || 'none';

                // [FEATURE] Movement Speed Effect (e.g. Rabbit's Foot Shield)
                if (details.effect && details.effect.movement_speed) {
                    this.statusEffects.bonus_speed = { move: details.effect.movement_speed, duration: Infinity, source: 'equipment' };
                    if (!silent) addToLog(`You feel lighter on your feet! (+${details.effect.movement_speed} Move)`);
                }
            }
            
            if (!silent) addToLog(`Equipped: ${details.name}.`);
            return unequippedItemKey;
        }
        return null;
    }

    /**
     * Unequips an item, reverting to default and removing associated effects.
     */
    unequipItem(itemType, silent = false) {
        let oldItemKey = null;
        let defaultItem = null;
        
        switch (itemType) {
            case 'weapon':
                if (this.equippedWeapon.name === WEAPONS['fists'].name) return null;
                oldItemKey = findKeyByInstance(WEAPONS, this.equippedWeapon);
                defaultItem = WEAPONS['fists'];
                if (!silent) addToLog(`Unequipped: ${this.equippedWeapon.name}.`);
                
                this.equippedWeapon = defaultItem;
                this.weaponElement = 'none';
                this.validateWeaponToggles();
                
                // [FIX] Recalculate stats immediately
                if(typeof this.calculateStats === 'function') this.calculateStats(); 
                break;
                
            case 'catalyst':
                if (this.equippedCatalyst.name === CATALYSTS['no_catalyst'].name) return null;
                oldItemKey = findKeyByInstance(CATALYSTS, this.equippedCatalyst);
                defaultItem = CATALYSTS['no_catalyst'];
                 if (!silent) addToLog(`Unequipped: ${this.equippedCatalyst.name}.`);
                this.equippedCatalyst = defaultItem;
                
                if(typeof this.calculateStats === 'function') this.calculateStats();
                break;

            case 'armor':
                if (this.equippedArmor.name === ARMOR['travelers_garb'].name) return null;
                oldItemKey = findKeyByInstance(ARMOR, this.equippedArmor);
                defaultItem = ARMOR['travelers_garb'];
                 if (!silent) addToLog(`Unequipped: ${this.equippedArmor.name}.`);
                this.equippedArmor = defaultItem;
                this.armorElement = 'none';
                
                // [FIX] Recalculate stats immediately
                if(typeof this.calculateStats === 'function') this.calculateStats();
                break;

            case 'shield':
                if (this.equippedShield.name === SHIELDS['no_shield'].name) return null;
                oldItemKey = findKeyByInstance(SHIELDS, this.equippedShield);
                
                // Remove Movement Speed Effect
                if (this.equippedShield.effect && this.equippedShield.effect.movement_speed) {
                    if (this.statusEffects.bonus_speed && this.statusEffects.bonus_speed.source === 'equipment') {
                        delete this.statusEffects.bonus_speed;
                        if (!silent) addToLog(`You feel your normal weight return.`);
                    }
                }

                defaultItem = SHIELDS['no_shield'];
                 if (!silent) addToLog(`Unequipped: ${this.equippedShield.name}.`);
                this.equippedShield = defaultItem;
                this.shieldElement = 'none';
                
                // [FIX] Recalculate stats immediately
                if(typeof this.calculateStats === 'function') this.calculateStats();
                break;

             case 'lure':
                if (this.equippedLure === 'no_lure') return null;
                if (!silent) addToLog(`Unequipped: ${LURES[this.equippedLure].name}.`);
                this.equippedLure = 'no_lure';
                break;

            default:
                return null;
        }

        // Clean up FIFO queue
        const typeIndex = this.equipmentOrder.indexOf(itemType);
        if (typeIndex > -1) {
            this.equipmentOrder.splice(typeIndex, 1);
        }
        
        return oldItemKey;
    }

    addToInventory(itemKey, quantity = 1, verbose = true, isCrafted = false) {
        // --- FIX: Allow keys to trigger unlocks even if item details are missing/bugged ---
        if (itemKey === 'blacksmith_key') { this.unlocks.hasBlacksmithKey = true; saveGame(); }
        if (itemKey === 'tower_key') { this.unlocks.hasTowerKey = true; saveGame(); }

        const details = getItemDetails(itemKey); 
        if (!details) {
            // If it's a key, we already handled the logic above, so we can exit safely.
            // If it's not a key, we can't add it to inventory without details.
            if (itemKey !== 'blacksmith_key' && itemKey !== 'tower_key') {
                console.warn(`Attempted to add invalid item: ${itemKey}`);
                return;
            }
            // If it IS a key but missing details, we fake it so it appears in inventory
            if (itemKey === 'blacksmith_key' || itemKey === 'tower_key') {
                 // Fallback details if Items.js is missing them
                 if (!this.inventory.items) this.inventory.items = {};
                 this.inventory.items[itemKey] = (this.inventory.items[itemKey] || 0) + quantity;
                 if (verbose) addToLog(`You received: <span class="font-bold text-yellow-300">${itemKey.replace('_', ' ')}</span>!`, 'text-green-400');
                 return;
            }
        }

        // --- Added Item-Based Unlocks (Essences/Hearts) ---
        const isEssence = itemKey.endsWith('_essence');
        const isUndyingHeart = itemKey === 'undying_heart';

        if (isEssence && this.level >= 7 && !this.unlocks.enchanter) {
            this.unlocks.enchanter = true;
            setTimeout(() => {
                addToLog("The essence you picked up starts to pulsate warmly, seemingly drawn towards a specific building in the Arcane Quarter. You might want to check it out!", 'text-purple-300');
            }, 100);
            saveGame();
        }
        if (isUndyingHeart && this.level >= 10 && !this.unlocks.witchCoven) {
            this.unlocks.witchCoven = true;
             setTimeout(() => {
                addToLog("The still beating Undying Heart thrums in your hand, attracting unseen attention. It feels like the Witch in the Arcane Quarter wants to meet you.", 'text-purple-300');
            }, 100);
            saveGame(); 
        }
        // --- End Added ---

        if(details.type === 'recipe') {
            for(let i = 0; i < quantity; i++) {
                this.learnRecipe(itemKey, verbose);
            }
            return;
        }

        if (verbose || details.type !== 'key') {
            addToLog(`You received: <span class="font-bold" style="color: var(--text-accent);">${details.name}</span>!`, 'text-green-400');
        }

        const category = itemKey in WEAPONS ? 'weapons' :
                         (itemKey in CATALYSTS ? 'catalysts' :
                         (itemKey in ARMOR ? 'armor' :
                         (itemKey in SHIELDS ? 'shields' :
                         (itemKey in LURES ? 'lures' : 'items'))));

        if (!this.inventory[category]) {
            if (category === 'items' || category === 'lures') {
                this.inventory[category] = {};
            } else {
                this.inventory[category] = [];
            }
        }

        if (category === 'lures') {
             this.inventory.lures[itemKey] = (this.inventory.lures[itemKey] || 0) + details.uses;
        } else if (category === 'items') {
            this.inventory.items[itemKey] = (this.inventory.items[itemKey] || 0) + quantity;
            
            if (isCrafted) {
                if (!this.inventory.craftedCounts) this.inventory.craftedCounts = {};
                this.inventory.craftedCounts[itemKey] = (this.inventory.craftedCounts[itemKey] || 0) + quantity;
            }
        } else {
            for (let i = 0; i < quantity; i++) {
                this.inventory[category].push(itemKey);
            }
        }
    }

    learnRecipe(itemKey, verbose = true) {
        const details = ITEMS[itemKey];
        if(!details || details.type !== 'recipe') return; // Ensure it's a recipe item

        const actualRecipeKey = details.recipeKey;
        let recipeList;
        let messageType = '';
        let knownListKey = '';

        if(details.recipeType === 'cooking') {
            recipeList = COOKING_RECIPES;
            messageType = 'cooking';
            knownListKey = 'knownCookingRecipes';
        } else if (details.recipeType === 'alchemy') {
            recipeList = ALCHEMY_RECIPES;
            messageType = 'alchemy';
            knownListKey = 'knownAlchemyRecipes';
        }

        // Ensure the known list exists
        if (!Array.isArray(this[knownListKey])) {
             this[knownListKey] = [];
        }


        if(recipeList && recipeList[actualRecipeKey] && !this[knownListKey].includes(actualRecipeKey)) {
            this[knownListKey].push(actualRecipeKey);
            const recipeName = recipeList[actualRecipeKey].name || getItemDetails(recipeList[actualRecipeKey].output)?.name || actualRecipeKey;
            if (verbose) addToLog(`You learned a new ${messageType} recipe: <span class="font-bold text-yellow-300">${recipeName}</span>!`, 'text-green-400');
        } else {
             if (verbose && recipeList && recipeList[actualRecipeKey]) { // Only log if recipe was valid
                addToLog(`You already know this recipe. You sell the spare for a small profit.`);
                this.gold += Math.floor(details.price / 4);
                updateStatsView(); // <-- ADDED: Immediately update UI after gaining gold
            } else if (verbose) {
                 addToLog(`This recipe scroll seems incomplete or damaged.`); // Log if recipeKey wasn't found
            }
        }
    }


    gainXp(amount) {
        // Allow 0 as a valid multiplier
        const multiplier = this.xpMultiplier !== undefined ? this.xpMultiplier : 1;
        let modifiedAmount = Math.floor(amount * multiplier);
        
        // Apply Food Buffs globally here
        if(this.foodBuffs.xp_gain) {
            modifiedAmount = Math.floor(modifiedAmount * this.foodBuffs.xp_gain.value);
        }

        this.xp += modifiedAmount;
        if (this.totalXp === undefined || isNaN(this.totalXp)) this.totalXp = 0; 
        this.totalXp += modifiedAmount;
        
        addToLog(`You gained <span class="font-bold">${modifiedAmount}</span> XP!`, 'text-yellow-400');

        // Check for level up repeatedly
        let leveledUp = false;
        while (this.xp >= this.xpToNextLevel && this.level < 999) { 
            leveledUp = true;
            this.levelUp();
        }

        updateStatsView(); 
    }

    levelUp() {
         // Should only run if xp >= xpToNextLevel
        this.xp -= this.xpToNextLevel;
        this.level++;
        this.xpToNextLevel = this.calculateXpToNextLevel();
        this.statPoints = (this.statPoints || 0) + 5; 
        // NEW: Skill Points every 3 levels starting at level 6
        if (this.level >= 6 && (this.level - 6) % 3 === 0) {
            this.skillPoints = (this.skillPoints || 0) + 1;
            addToLog(`You gained <span class="font-bold text-purple-300">1 Skill Point</span>!`, 'text-purple-300');
        }
        
        // NEW: Mastery Points every 100 levels
        if (this.level % 100 === 0) {
            this.masteryPoints = (this.masteryPoints || 0) + 1;
            addToLog(`You gained <span class="font-bold text-yellow-300">1 Mastery Point</span>!`, 'text-yellow-300');
        }

        this.hp = this.maxHp; // Full heal on level up
        this.mp = this.maxMp; // Full mana on level up
        addToLog(`*** LEVEL UP! You are now level ${this.level}! ***`, 'text-yellow-200 font-bold text-lg');
        addToLog(`You have <span class="font-bold text-green-400">5</span> stat points to allocate!`, 'text-green-300');
        updatePlayerTier(); // Update tier based on new level
        characterSheetOriginalStats = null; // Reset temp stats on level up

        // --- Added Level-Based Unlocks ---
        if (this.level === 5 && !this.unlocks.houseAvailable) {
            this.unlocks.houseAvailable = true;
            addToLog("A 'For Sale' sign has appeared on that empty plot at the edge of town. Looks like you could build your own house there!");
        }
        if (this.level === 5 && !this.unlocks.blackMarket) {
            this.unlocks.blackMarket = true;
            addToLog("The whispers of shady dealings start to fly around. It looks like the black market has reached this frontier town.");
        }
        if (this.level >= 10 && !this.unlocks.arcaneCasino) { // Changed === to >=
            this.unlocks.arcaneCasino = true;
            addToLog("You've heard whispers of a new 'entertainment' venue opening in the Arcane Quarter. Might be worth a look.");
        }
        // --- End Added ---
                // --- NEW: Level up NPC Ally ---
        if (this.npcAlly) {
            this.npcAlly.calculateStats(this.level); // Recalculate stats based on player's NEW level
            this.npcAlly.hp = this.npcAlly.maxHp; // Full heal on level up
            this.npcAlly.mp = this.npcAlly.maxMp;
            addToLog(`Your ally, ${this.npcAlly.name}, has grown stronger! They are now level ${this.npcAlly.level}.`, 'text-blue-300');
        }
        // --- END NEW ---


        // Trigger level up screen display AFTER current action completes, if not in battle
        if (gameState.currentView !== 'battle' && gameState.currentView !== 'character_sheet_levelup') {
            setTimeout(() => {
                 // Check again if still not in battle before rendering
                 if (gameState.currentView !== 'battle') {
                     renderCharacterSheet(true);
                 }
            }, 1000);
        }
    }

    _getDefenseStats(isMagic, element, attacker = null) {
        const shield = this.equippedShield;
        const armor = this.equippedArmor;
        const weapon = this.equippedWeapon;
        const toggles = this.skillToggles || {};
        const effects = this.statusEffects || {};
        
        // --- DEFINITIONS ---
        // Light armor lacks a specific tag, so we define the high-end ones explicitly.
        // We also assume anything NOT metallic and NOT magic robes falls here.
        const lightArmorNames = [
            "Traveler’s Armor", "Traveler's Armor", "Traveler's Garb",
            "Leather Armor", "Padded Leather", "Silenced Leather", 
            "Assassin’s Cloak", "Vacuum Encaser"
        ];
        
        // --- A. AVOIDANCE CHANCES ---
        let dodge = Number(this.evasionChance) || 0;
        let block = 0;
        let parry = 0;
        let canBlock = false;
        let canParry = false;

        // 1. DODGE TREATMENT
        const getGearDodge = (item) => {
            if (item?.effect?.type === 'dodge') return Number(item.effect.chance) || 0;
            if (item?.effect?.dodge) return Number(item.effect.dodge) || 0; 
            return 0;
        };
        dodge += getGearDodge(armor);
        dodge += getGearDodge(shield);
        dodge += getGearDodge(weapon);

        // [PASSIVE] Silk-Dancer's Veil (Light Armor Dodge)
        // Checks strictly for the light armor list to avoid triggering on robes/naked
        if (this.isSkillActive('light_armor_proficiency') && armor && lightArmorNames.includes(armor.name)) {
            dodge += 0.05; 
        }

        if (weapon && (weapon.class === 'Axe' || weapon.class === 'Hammer')) {
             dodge *= 0.5;
        }

        // 2. BLOCK TREATMENT
        if (shield && shield.name !== 'no_shield') {
            canBlock = true;
            block += (Number(shield.blockChance) || 0);
        }
        
        const armorBlock = (Number(armor?.blockChance) || 0) + (Number(armor?.effect?.blockChance) || 0);
        if (armorBlock > 0) {
            canBlock = true;
            block += armorBlock;
        }

        // [PASSIVE] Iron Clad (Heavy Armor Block)
        // Uses the 'metallic' property which defines Heavy Armor in your data
        if (this.isSkillActive('heavy_armor_proficiency') && armor?.metallic) {
            canBlock = true; 
            block += 0.05;
        }

        const isUnarmored = !armor || ["Traveler's Garb", "Traveler's Armor", "Traveler’s Armor", "naked"].includes(armor.name);
        if (this.isSkillActive('way_of_empty_hand') && weapon.class === 'Hand-to-Hand' && isUnarmored) {
            canBlock = true;
            block += 0.10;
            dodge += 0.10; 
        } else if (toggles['cyclone_mantle']) {
            canBlock = true;
            block += 0.10;
        }

        // 3. PARRY TREATMENT
        const getGearParry = (item) => {
            if (!item || !item.effect) return 0;
            if (item.effect.parry) return Number(item.effect.parry); 
            if (item.effect.type === 'parry') return Number(item.effect.chance);
            return 0;
        };
        const shieldParry = getGearParry(shield);
        const weaponParry = getGearParry(weapon);

        if (shieldParry > 0 || weaponParry > 0) {
            canParry = true;
            parry += (shieldParry + weaponParry);
        }

        if (toggles['quicksilver_reaction'] && weapon.class === 'Thrusting Sword') {
            canParry = true;
            parry += 0.10 + (this.isSkillActive('royal_third_eye') ? 0.10 : 0);
        } else if (toggles['fools_guard'] && weapon.class === 'Longsword') {
            canParry = true;
            parry += 0.15;
        }

        // 4. MODIFIERS & CAPS
        if (canBlock) {
            if (this.isSkillActive('immovable_object')) block *= 1.25;
            if (this.isSkillActive('royal_third_eye') && weapon.class === 'Thrusting Sword' && shield?.name !== 'no_shield') block += 0.05;
        }
        if (canParry && this.dexterity > 15) parry += (this.dexterity - 15) * 0.005;

        if (toggles['fools_guard'] && weapon.class === 'Longsword') { dodge *= 1.3; if(canParry) parry *= 1.3; if(canBlock) block *= 1.3; }
        if (this.race === 'Beastkin') { dodge *= 1.25; if(canParry) parry *= 1.25; if(canBlock) block *= 1.25; }
        if (this.race === 'Elf' && (!armor || !armor.metallic)) dodge += Math.min(dodge * 0.5, 0.50);
        if (effects.buff_shroud || effects.buff_voidwalker) dodge *= 1.5;
        if (effects.buff_hermes) dodge *= 2;
        if (effects.bonus_speed) dodge += effects.bonus_speed.dodge;
        
        if (effects.slowed) dodge = Math.max(0, dodge + effects.slowed.dodge);
        if (effects.clumsy) dodge = Math.max(0, dodge + effects.clumsy.dodge);
        if (shield && ['Tower Greatshield', 'Heavy Slabshield'].includes(shield.name)) dodge *= 0.5;
        if (armor?.metallic && !this.isSkillActive('heavy_armor_proficiency')) dodge *= 0.75;

        // --- B. DEFENSE VALUES ---
        let flatDef = isMagic ? (Number(this.magicalDefense) || 0) : (Number(this.physicalDefense) || 0);
        
        // [ADD THIS BLOCK] Aegis of the Soul Logic
        if (this.skillToggles && this.skillToggles['mana_steel_aura']) {
            if (isMagic) {
                flatDef = Math.floor(flatDef * 1.10); // +10% Magic Def
            } else {
                flatDef = Math.floor(flatDef * 1.20); // +20% Phys Def
            }
        }
        
        // Ensure values are numbers to prevent string concatenation hilarity
        let shieldDefValue = isMagic ? (Number(shield?.magicDefense) || 0) : (Number(shield?.defense) || 0);
        let armorDefValue = isMagic ? (Number(armor?.magicDefense) || 0) : (Number(armor?.defense) || 0);

        // [PASSIVE FIX] Leather Padding (Leviathan-Boiled Leather)
        // Multiplies Light Armor Defense by 1.5x
        if (this.isSkillActive('leather_padding') && armor && lightArmorNames.includes(armor.name) && !isMagic) {
            armorDefValue *= 1.5;
        }

        // [PASSIVE FIX] High Quality Alloy (Metallurgy)
        // Multiplies Heavy Armor Defense by 1.2x
        // NOW USES 'metallic' CHECK. If it's metallic, it gets the buff.
        if (this.isSkillActive('high_quality_alloy') && armor?.metallic && !isMagic) {
            armorDefValue *= 1.2;
        }

        // Combine Gear Defense
        let gearDef = shieldDefValue + armorDefValue;

        // Flat/Gear Modifiers
        if (this.isSkillActive('way_of_empty_hand') && weapon.class === 'Hand-to-Hand' && isUnarmored) flatDef *= 2; 
        
        if (isMagic && this.isSkillActive('null_steel_plating') && armor?.metallic) gearDef += (Number(armor.defense) || 0) * 0.2;
        if (toggles['avatar_of_tempest']) { flatDef *= 0.5; gearDef *= 0.5; }
        if (toggles['iron_mountain']) flatDef += Math.floor(flatDef * 0.50);
        if (toggles['nihility_form']) flatDef += Math.floor(flatDef * 0.25);

        if (effects.buff_gore_howl) {
            flatDef = Math.floor(flatDef * 0.50); 
            gearDef = Math.floor(gearDef * 0.50); 
        }

        let gearPercent = Math.min(0.95, gearDef / 100);

        // --- C. RESISTANCES ---
        let mult = 1.0;
        
        if (this.race === 'Orc') {
            if (!isMagic) mult *= 0.9; 
            else if (this.level < 20) mult *= 1.1; 
        }
        if (effects.buff_enrage && !isMagic) mult *= 1.5;
        if (attacker?.element && attacker.element !== 'none') {
            let weaknessMult = 1.0;
            const armorMod = (typeof calculateElementalModifier === 'function') ? calculateElementalModifier(attacker.element, this.armorElement) : 1;
            const shieldMod = (typeof calculateElementalModifier === 'function') ? calculateElementalModifier(attacker.element, this.shieldElement) : 1;
            
            if (armorMod === 2 || shieldMod === 2) weaknessMult = this.isSkillActive('elemental_absorption') ? 1.75 : 2.0;
            
            if (weaknessMult > 1.0) mult *= weaknessMult;
            if (this.isSkillActive('elemental_absorption')) mult *= 0.90; 
        }
        if (effects.elemental_vuln && attacker?.element === effects.elemental_vuln.element) mult *= 1.5;
        if ((toggles['avatar_of_tempest'] || effects.buff_stormhearted) && attacker && ['earth','lightning','wind'].includes(attacker.element)) mult *= 1.5;

        if (toggles['iron_mountain']) mult *= 0.65;
        if (toggles['phalanx_formation'] && weapon.class === 'Lance') mult *= toggles['world_turtle_formation'] ? 0.50 : 0.70;
        if (toggles['lockdown'] && shield?.blockChance > 0) mult *= 0.85;
        if (toggles['divine_unalloyed_soul']) mult *= 0.50;
        if (effects.buff_defense) mult *= 0.70;
        if (effects.buff_magic_defense && isMagic) mult *= 0.70;
        if (effects.buff_titan) mult *= 0.70;
        if (effects.buff_divine && isMagic) mult *= 0.40;
        if (effects.stonehide) mult *= 0.80;
        if (effects.buff_lithic_aura) mult *= 0.75;
        if (effects.buff_magmatic_stress) mult *= 0.75;
        if (effects.buff_final_horizon) mult *= 0.75;

        if (this.isSkillActive('honor_bound_teaching') && typeof currentEnemies !== 'undefined') {
            const living = currentEnemies.filter(e => e.isAlive());
            if (living.length === 1 && ['Longsword', 'Lance'].includes(weapon?.class)) {
                mult *= 0.90; 
            }
        }
        
        if (toggles['rite_old_gods'] && toggles['crimson_feast']) {
            mult *= 0.90; 
        }

        if (effects.buff_chaos_strength) mult *= 1.25;
        if (toggles['fools_guard']) mult *= 1.15;
        if (attacker?.element === 'void') mult *= 1.50;
        if (effects.void_erosion) mult *= (1 + ((effects.void_erosion.stacks || 1) * 0.05));

        return {
            dodge: Math.max(0, Math.min(0.95, dodge)),
            parry: Math.max(0, Math.min(0.95, parry)),
            block: Math.max(0, Math.min(0.95, block)),
            canBlock,
            flatDef: Math.floor(Math.max(0, flatDef)),
            gearPercent,
            damageMultiplier: Math.max(0, mult)
        };
    }

    takeDamage(damage, options = {}, source = null) {
        // --- 1. SANITIZE INPUT ---
        let currentDmg = Number(damage) || 0; 
        const defenseSteps = [];
        const element = (options.element || 'none').toLowerCase(); 
        const isMagic = options.isMagic || false;
        
        // --- 2. IMMUNITIES & ABSORPTION ---
        
        // [PASSIVE] GALVANIC RECONSTITUTION
        if (this.hasSkill('galvanic_reconstitution') && element === 'lightning') {
            const hasLightningGear = (this.weaponElement === 'lightning') || 
                                     (this.armorElement === 'lightning') || 
                                     (this.shieldElement === 'lightning');

            if (hasLightningGear) {
                const heal = Math.floor(currentDmg * 0.25);
                this.hp = Math.min(this.maxHp, this.hp + heal);
                addToLog(`Galvanic Reconstitution absorbs the shock! (+${heal} HP)`, 'text-green-300 font-bold');
                if (typeof createFloatingText === 'function') createFloatingText(this.x, this.y, `+${heal}`, "text-green-400");
                if (typeof updateStatsView === 'function') updateStatsView();
                return { damageDealt: 0, defenseSteps: [{ description: "Galvanic Absorb", value: "Immune", result: `+${heal} HP` }] };
            }
        }

        // Calculate Penetration
        let penetration = 0;
        if (options.ignore_defense === true) penetration = 1.0;
        else if (typeof options.ignore_defense === 'number') penetration = options.ignore_defense;
        if (options.armorPierce) penetration += options.armorPierce;
        penetration = Math.min(1.0, Math.max(0, penetration));

        // =========================================================
        // [INJECTED] CRITICAL HIT & ADAMANTINE SKIN LOGIC
        // =========================================================
        let isCritical = options.isCritical || false;

        // [PASSIVE] Adamantine Skin (Crit Immunity)
        // Requires: Skill Active + Heavy Armor (Metallic)
        if (isCritical && this.isSkillActive('impenetrable_alloy')) {
             if (this.equippedArmor && this.equippedArmor.metallic) {
                 isCritical = false;
                 defenseSteps.push({ description: "Adamantine Skin", value: "Crit Immune", result: currentDmg });
                 // Optional: Only log if you want the player to know they ignored a crit
                 // addToLog("Adamantine Skin negates the critical hit!", "text-gray-400");
             }
        }

        // Apply Critical Multiplier (if not immune)
        if (isCritical) {
            currentDmg = Math.floor(currentDmg * 1.5);
            defenseSteps.push({ description: "Critical Hit!", value: "x1.5", result: currentDmg });
        }
        // =========================================================

        // [TOGGLE] AVATAR OF TEMPEST (Vulnerability)
        if (this.skillToggles['avatar_of_tempest'] && (element === 'wind' || element === 'lightning')) {
            currentDmg = Math.floor(currentDmg * 1.5);
            addToLog("The storm rages within you! (Vuln: +50% Dmg)", "text-red-400 font-bold");
            defenseSteps.push({ description: "Avatar (Storm Vuln)", value: "x1.5", result: currentDmg });
        }

        const stats = this._getDefenseStats(isMagic, element, source);

        // --- 3. BARRIERS ---
        if (this.statusEffects.alchemical_barrier?.hp > 0) {
            const barrierHP = this.statusEffects.alchemical_barrier.hp;
            const absorbed = Math.min(currentDmg, barrierHP);
            this.statusEffects.alchemical_barrier.hp -= absorbed;
            currentDmg -= absorbed;
            addToLog(`Alchemical Barrier absorbs ${absorbed} damage!`, 'text-cyan-400');
            if (this.statusEffects.alchemical_barrier.hp <= 0) delete this.statusEffects.alchemical_barrier;
            if (currentDmg <= 0) return { damageDealt: 0, defenseSteps };
        }

        // --- 4. AVOIDANCE (Dodge / Parry) ---
        if (!options.undodgeable) {
            // DODGE
            if (this.rollForEffect(stats.dodge, 'Dodge')) {
                addToLog("You dodged the attack!", "text-green-400");
                if (this.isSkillActive('connivers_backslash') && this.skillToggles['fools_guard'] && source) {
                    this._executeReaction('traitor', source);
                }
                return { damageDealt: 0, defenseSteps: [{ description: "Dodge", value: "Evaded", result: 0 }] };
            }
            // PARRY
            if (!isMagic && this.rollForEffect(stats.parry, 'Parry')) {
                addToLog("You parried the attack!", "text-yellow-300");
                if (source) {
                    source.attackParried = true;
                    this._executeReaction('parry', source); 
                    if (this.skillToggles['quicksilver_reaction'] && this.mp >= 15) {
                        this._executeReaction('quicksilver', source); 
                    }
                }
                return { damageDealt: 0, defenseSteps: [{ description: "Parry", value: "Negated", result: 0 }] };
            }
        }

        // --- 5. FLAT MITIGATION (Buffs) ---
        if (this.skillToggles['nihility_form']) currentDmg = Math.ceil(currentDmg * 0.75);
        if (this.statusEffects.buff_aqueous_aegis) {
            const blockedAmount = Math.floor(currentDmg * 0.90);
            currentDmg -= blockedAmount;
            defenseSteps.push({ description: "Aqueous Aegis", value: "-90%", result: currentDmg });
            addToLog(`The bubble bursts, absorbing <span class="text-white font-bold">${blockedAmount}</span> damage!`, "text-blue-300");
            if (typeof createFloatingText === 'function') createFloatingText(this.x, this.y, "🫧 Pop!", "text-cyan-300");
            delete this.statusEffects.buff_aqueous_aegis;
            if (typeof updateStatsView === 'function') updateStatsView();
        }

        // --- 6. BLOCKING ---
        if (stats.canBlock && penetration < 1.0) {
            if (this.rollForEffect(stats.block, 'Block')) {
                let damageMultiplier = 0.2; 
                if (this.isSkillActive('immovable_object')) damageMultiplier = 0.1;

                const blockedAmount = Math.floor(currentDmg * (1 - damageMultiplier));
                currentDmg = Math.floor(currentDmg * damageMultiplier);
                
                addToLog(`Blocked! Damage reduced significantly.`, "text-blue-300");
                defenseSteps.push({ description: `Block`, value: `-${blockedAmount}`, result: currentDmg });

                if (this.isSkillActive('connivers_backslash') && this.skillToggles['fools_guard'] && source) {
                    this._executeReaction('traitor', source);
                }
            }
        }

        // --- 7. ARMOR REDUCTION ---
        let effFlat = stats.flatDef;
        if (this.skillToggles['avatar_of_tempest']) {
            effFlat = Math.floor(effFlat * 0.5);
            defenseSteps.push({ description: "Avatar (Armor Shred)", value: "0.5x Armor", result: "" });
        }

        // Apply Pierce to Flat Def
        if (penetration > 0) effFlat -= Math.floor(effFlat * penetration);
        
        if (effFlat > 0) {
            const reduced = Math.max(0, currentDmg - effFlat);
            defenseSteps.push({ description: "Flat Defense", value: `-${effFlat}`, result: reduced });
            currentDmg = reduced;
        }

        // Apply Pierce to Percent Def
        let effPercent = stats.gearPercent;
        if (penetration > 0) effPercent *= (1.0 - penetration);

        if (effPercent > 0) {
            currentDmg = Math.floor(currentDmg * (1 - effPercent));
            defenseSteps.push({ description: "Gear Mitigation", value: `-${(effPercent*100).toFixed(0)}%`, result: currentDmg });
        }

        // --- 8. MULTIPLIERS (Resistances) ---
        if (stats.damageMultiplier !== 1.0) {
            currentDmg = Math.floor(currentDmg * stats.damageMultiplier);
            defenseSteps.push({ description: "Buffs/Resists", value: `x${stats.damageMultiplier.toFixed(2)}`, result: currentDmg });
        }

        // --- 9. FINAL APPLICATION ---
        const finalDamage = Math.max(0, currentDmg);
        this.hp = Math.max(0, this.hp - finalDamage);

        let dmgTypeStr = element !== 'none' ? ` ${ELEMENTS[element]?.name || element}` : (isMagic ? ' magical' : '');
        addToLog(`You take <span class="font-bold text-red-400">${finalDamage}</span>${dmgTypeStr} damage.`);

        // --- 10. POST-DAMAGE TRIGGERS ---
        if (finalDamage > 0) {
            
            // JOLTING PRESSURE (Reflect)
            if (source && source.isAlive() && source.statusEffects['jolted']) {
                const jolt = source.statusEffects['jolted'];
                const dischargeDmg = jolt.damageSnapshot || 20;

                addToLog(`Static Pressure discharges on ${source.name}!`, "text-yellow-300 font-bold");
                
                if (typeof source.takeDamage === 'function') {
                    source.takeDamage(dischargeDmg, { element: 'lightning', ignore_defense: true });
                } else {
                    source.hp -= dischargeDmg;
                }
                if (typeof createFloatingText === 'function') createFloatingText(source.x, source.y, `⚡${dischargeDmg}`, "text-yellow-300");
                delete source.statusEffects['jolted'];
            }

            // MAGMATIC STRESS (Stacking Buff)
            if (this.isSkillActive('magmatic_stress')) {
                if (!this.combatTags) this.combatTags = {};
                
                this.combatTags.magmaDmg = (this.combatTags.magmaDmg || 0) + finalDamage;
                this.combatTags.magmaHits = (this.combatTags.magmaHits || 0) + 1;

                if (this.combatTags.magmaDmg >= 1000 || this.combatTags.magmaHits >= 5) {
                    if (typeof applyStatusEffect === 'function') {
                        applyStatusEffect(this, 'buff_magmatic_stress', { 
                            duration: 2, 
                            name: "Heating Rock", 
                            icon: "🌋",
                            description: "Dmg +25%, Taken -25%, Knockback" 
                        }, "Magmatic Stress");
                    }
                    addToLog(`${this.name}'s Magmatic Stress erupts!`, "text-orange-500 font-bold");
                    this.combatTags.magmaDmg = 0;
                    this.combatTags.magmaHits = 0;
                }
            }

            // Apply Jolt to Enemy (if hit by lightning)
            if (element === 'lightning' && source?.hasSkill?.('jolting_pressure')) {
                 if(typeof applyStatusEffect === 'function') applyStatusEffect(this, 'jolted', { duration: 3, damageSnapshot: Math.max(1, Math.floor(finalDamage*0.25)) }, "Jolting Pressure");
            }
            
            // Reflections
            if (source && source.isAlive()) {
                this._executeReaction('reflection', source, { damage: finalDamage, raw: (Number(damage) || 0) });
                if (this.skillToggles['riposte']) this._executeReaction('vengeful_guard', source);
            }
        }

        if (typeof updateStatsView === 'function') updateStatsView();
        return { damageDealt: finalDamage, knockback: 0, defenseSteps };
    }

    _executeReaction(type, target, data = {}) {
        if (!target || !target.isAlive() || gameState.battleEnded) return;

        // Common Data
        const weapon = this.equippedWeapon;
        let delay = 200;
        let message = "";
        let action = null;

        switch (type) {
            case 'traitor': // Conniver's Backslash (Dodge/Block Counter)
                message = "Traitor's Riposte! You strike back!";
                action = () => {
                    // Safety check if weapon damage is undefined
                    const min = weapon.damage ? weapon.damage[0] : 1;
                    const max = weapon.damage ? weapon.damage[1] : 4;
                    let baseDmg = rollDice(min, max, "Traitor Counter").total;
                    let dmg = Math.floor((baseDmg + this.physicalDamageBonus) * 0.5); 
                    target.takeDamage(dmg, { element: this.weaponElement }, this);
                };
                break;

            case 'quicksilver': // Rapier Stance Special
                message = "Quicksilver Reflex! A flash of steel!";
                this.mp -= 15;
                action = () => {
                    let dmgMult = this.isSkillActive('royal_third_eye') ? 0.75 : 0.50;
                    const min = weapon.damage ? weapon.damage[0] : 1;
                    const max = weapon.damage ? weapon.damage[1] : 4;
                    let baseDmg = rollDice(min, max, "Quicksilver").total;
                    let dmg = Math.floor((baseDmg + this.physicalDamageBonus) * dmgMult);
                    target.takeDamage(dmg, { element: this.weaponElement, ignore_defense: true }, this);
                };
                break;

            case 'vengeful_guard': // Longsword Toggle
                if (this.mp < 10) return;
                this.mp -= 10;
                delay = 0; // Instant
                message = "Vengeful Guard! Counter-attack!";
                action = () => {
                    const dmg = Math.floor(this.strength * 1.5);
                    target.takeDamage(dmg, { element: 'physical' }, this);
                };
                break;

            case 'reflection': // Armor/Shield/Passive Reflection
                delay = 0; // Instant
                action = () => {
                    let refDmg = 0; 
                    let refEl = 'none';
                    let sourceName = '';
                    const rawDamage = Number(data.raw) || 0;

                    // Check Gear
                    if (this.equippedArmor?.effect?.type === 'reflect') { refDmg = rawDamage * (this.equippedArmor.effect.amount || 0); refEl = this.armorElement; sourceName = this.equippedArmor.name; }
                    else if (this.equippedShield?.effect?.type === 'reflect') { refDmg = rawDamage * this.equippedShield.effect.amount; refEl = this.shieldElement; sourceName = this.equippedShield.name; }
                    else if (this.statusEffects.buff_ion_other) { refDmg = rawDamage * 0.25; refEl = 'lightning'; sourceName = 'Unstable Energy'; }
                    
                    if (refDmg > 0) {
                        const res = target.takeDamage(Math.floor(refDmg), { element: refEl });
                        addToLog(`Your ${sourceName} reflects ${res.damageDealt} damage!`, 'text-orange-300');
                    }

                    // Tiefling
                    if (this.race === 'Tiefling' && rawDamage > 0 && this.mp >= 5) {
                        const cost = (this.level >= 20) ? 0 : 5;
                        this.mp -= cost;
                        const tieflingDmg = Math.floor(rawDamage * 0.10);
                        if(tieflingDmg > 0) {
                            const res = target.takeDamage(tieflingDmg, { element: 'fire', ignore_defense: 1.0, isMagic: true });
                            addToLog(`Infernal Rebuke deals ${res.damageDealt}!`, 'text-orange-400');
                        }
                    }
                };
                break;

            case 'parry': 
            default:
                delay = 300;
                message = "You launch a swift counter-attack!";
                action = () => {
                    const min = weapon.damage ? weapon.damage[0] : 1;
                    const max = weapon.damage ? weapon.damage[1] : 4;
                    let attackDamageDice = [min, max];  
                    
                    // Dwarf Racial
                    if (this.race === 'Dwarf' && this.level >= 20) {
                        if (attackDamageDice[1] === 6) attackDamageDice[1] = 8;
                        else if (attackDamageDice[1] === 8) attackDamageDice[1] = 10;
                    }

                    // Whetstone
                    let allowCrit = false;
                    if (this.statusEffects.buff_whetstone) {
                        if (this.statusEffects.buff_whetstone.diceStepUp) {
                            const steps = {2:4, 3:4, 4:6, 6:8, 8:10, 10:12};
                            if (steps[attackDamageDice[1]]) attackDamageDice[1] = steps[attackDamageDice[1]];
                        }
                        if (this.statusEffects.buff_whetstone.critEnable) allowCrit = true;
                    }

                    // Base Roll
                    let rollResult = rollDice(attackDamageDice[0], attackDamageDice[1], "Parry Counter");
                    let dmg = rollResult.total;

                    // Enchantment / Element
                    if (this.weaponElement !== 'none') dmg += rollDice(1, 8, "Element Bonus").total;
                    
                    // Shield Parry Bonus
                    if (this.equippedShield?.effect?.parryDamage) {
                        const sDice = this.equippedShield.effect.parryDamage;
                        dmg += rollDice(sDice[0], sDice[1], "Shield Bonus").total;
                    }

                    // Elemental Grease
                    if (this.statusEffects.buff_elemental_grease) {
                        const g = this.statusEffects.buff_elemental_grease;
                        dmg += rollDice(g.damage[0], g.damage[1], "Grease Bonus").total;
                    }

                    // Stat Scaling
                    const statMultiplier = 1 + (this.physicalDamageBonus / 20);
                    dmg = Math.floor(dmg * statMultiplier);
                    dmg += Math.floor(this.strength / 5);

                    // Hunter's Mark
                    if (target.isMarked && target === gameState.markedTarget) {
                        dmg += rollDice(1, 8, "Mark Bonus").total;
                        allowCrit = true;
                    }

                    // Critical Hit
                    let critChance = this.critChance + 0.1; 
                    if (allowCrit) critChance += 0.1;
                    if (this.rollForEffect(critChance, 'Parry Crit')) {
                        dmg = Math.floor(dmg * 1.5);
                        addToLog("CRITICAL COUNTER!", "text-red-400 font-bold");
                    }

                    // Apply Damage
                    const res = target.takeDamage(dmg, { element: this.weaponElement }, this);
                    addToLog(`Counter-attack hits for <span class="font-bold text-yellow-300">${res.damageDealt}</span>!`);

                    // Lifesteal
                    if (res.damageDealt > 0 && target.speciesData.class !== 'Undead') {
                        let lifesteal = 0;
                        if (weapon.class === 'Reaper') lifesteal += 0.1;
                        if (weapon.effect?.lifesteal) lifesteal += weapon.effect.lifesteal;
                        
                        if (lifesteal > 0) {
                            const heal = Math.floor(res.damageDealt * lifesteal);
                            if (heal > 0) {
                                this.hp = Math.min(this.maxHp, this.hp + heal);
                                if (typeof updateStatsView === 'function') updateStatsView();
                                addToLog(`Drained ${heal} HP.`, "text-green-300");
                            }
                        }
                    }
                };
                break;
        }

        // Execute
        if (delay > 0) {
            if (message) setTimeout(() => addToLog(message, "text-yellow-300"), 50);
            setTimeout(() => {
                if (!gameState.battleEnded && target.isAlive()) {
                    action();
                    checkBattleStatus(true);
                }
            }, delay);
        } else {
            action();
            if (!gameState.battleEnded) checkBattleStatus(true);
        }
    }

    clone(snapshot = null) {
        // Create a new Player instance from core data (name, raceKey, classKey)
        const clonedPlayer = new Player(this.name, this.race, this._classKey);

        // Copy all properties from current instance to clone (including current derived values)
        Object.assign(clonedPlayer, this);
        
        // Revert bonus stats and recalculate derived stats if a snapshot is provided
        if (snapshot) {
            clonedPlayer.bonusVigor = snapshot.bonusVigor || 0;
            clonedPlayer.bonusFocus = snapshot.bonusFocus || 0;
            clonedPlayer.bonusStamina = snapshot.bonusStamina || 0;
            clonedPlayer.bonusStrength = snapshot.bonusStrength || 0;
            clonedPlayer.bonusIntelligence = snapshot.bonusIntelligence || 0;
            clonedPlayer.bonusLuck = snapshot.bonusLuck || 0;

            // Re-run the core stat calculation to derive maxHp/maxMp/etc based on original snapshot
            clonedPlayer.recalculateGrowthBonuses();
        }

        return clonedPlayer;
    }
    // --- END takeDamage refactoring ---
}

class Drone extends Entity {
    constructor(playerRef) {
        super("Magic Drone");
        this.owner = playerRef; // Reference to the player who summoned it
        this.maxHp = Math.floor(playerRef.maxHp * 0.5);
        this.hp = this.maxHp;
        this.intelligence = Math.floor(playerRef.intelligence * 0.5); // Inherit stats
        this.focus = Math.floor(playerRef.focus * 0.5);
        this.movementSpeed = 2; // Drone's movement speed
        this.x = -1; // Position will be set on spawn
        this.y = -1;
        this.damage = [1, 6]; // Basic damage dice (e.g., 1d6)
    }

    // Calculate drone's range based on owner's gear
    get range() {
        const weaponRange = this.owner.equippedWeapon?.range || 0;
        const catalystRange = this.owner.equippedCatalyst?.range || 0;
        // Drone uses the greater of the player's weapon or catalyst range
        return Math.max(1, weaponRange, catalystRange);
    }

    // Basic attack logic for the drone
    attack(target) {
        if (!target || !target.isAlive()) return;

        const calcLog = {
            source: `${this.name} Attack`,
            targetName: target.name,
            steps: []
        };

        let baseDamage = rollDice(this.damage[0], this.damage[1], `${this.name} Attack`).total;
        calcLog.baseDamage = baseDamage;
        calcLog.steps.push({ description: "Base Damage", value: baseDamage, result: baseDamage });

        // Scale damage slightly with drone's intelligence
        const statMultiplier = 1 + this.intelligence / 20;
        let damage = Math.floor(baseDamage * statMultiplier);
        calcLog.steps.push({ description: `Drone Int Multiplier`, value: `x${statMultiplier.toFixed(2)}`, result: damage });

        addToLog(`${this.name} fires a beam at ${target.name}!`);

        calcLog.steps.push({ description: "=== DEFENSE ===", value: "", result: "" });

        const damageResult = target.takeDamage(damage, { isMagic: true, element: 'none' });
        const finalDamageDealt = damageResult.damageDealt;

        // [FIX] Merge steps
        if (damageResult.defenseSteps) {
            calcLog.steps = calcLog.steps.concat(damageResult.defenseSteps);
        }

        calcLog.finalDamage = finalDamageDealt;
        logDamageCalculation(calcLog);

        addToLog(`The beam hits for <span class="font-bold text-cyan-400">${finalDamageDealt}</span> magical damage.`);
    }

    takeDamage(damage, options = {}) {
        // 1. Calculate Avoidance
        const avoidanceChances = this._calculateAvoidanceChances();
        const attacker = options.attacker || (options.element ? { element: options.element } : null);

        if (this._attemptAvoidance(avoidanceChances, attacker)) {
            if (gameState.currentView === 'battle') renderBattleGrid();
            return { damageDealt: 0, knockback: 0, defenseSteps: [{ description: "Avoided", value: "Negated", result: 0 }] };
        }

        const defenseSteps = []; // Log Start
        const originalDamage = damage;

        // 3. Apply Alchemical Barrier
        const dmgBeforeBarrier = damage;
        damage = this._applyAlchemicalBarrier(damage);
        if (dmgBeforeBarrier !== damage) {
             defenseSteps.push({ description: "Alchemical Barrier", value: `-${dmgBeforeBarrier - damage}`, result: damage });
        }
        if (damage <= 0) {
            if (gameState.currentView === 'battle') renderBattleGrid();
            return { damageDealt: 0, knockback: 0, defenseSteps };
        }

        // 4. Vulnerabilities
        const isMagicAttack = (attacker?.element && attacker.element !== 'none') || options.isMagic || options.ignore_defense;
        
        const dmgBeforeVuln = damage;
        damage = this._applyDamageVulnerabilities(damage, isMagicAttack, options.ignore_defense, attacker);
        if (dmgBeforeVuln !== damage) {
            defenseSteps.push({ description: "Vulnerabilities", value: "Multiplier", result: damage });
        }

        // 5. Calculate Effective Defense
        const defData = this._calculateEffectiveDefense(isMagicAttack, attacker?.element, options.ignore_defense, attacker);
        
        // 6. CALCULATION
        let reducedDamage = Math.max(0, damage - defData.flat);
        if (defData.flat > 0) {
            defenseSteps.push({ description: `Flat Defense`, value: `-${defData.flat}`, result: reducedDamage });
        }
        
        let effectiveGearPercent = defData.gearPercent;
        if (options.armorPierce) {
             effectiveGearPercent = effectiveGearPercent * (1 - options.armorPierce);
             defenseSteps.push({ description: "Armor Pierce", value: `-${(options.armorPierce*100).toFixed(0)}% Def`, result: "" });
        }

        if (effectiveGearPercent > 0) {
            let oldDmg = reducedDamage;
            reducedDamage = Math.floor(reducedDamage * (1 - effectiveGearPercent));
            defenseSteps.push({ description: `Mitigation (${(effectiveGearPercent*100).toFixed(0)}%)`, value: `-${oldDmg - reducedDamage}`, result: reducedDamage });
        }

        if (defData.buffMult !== 1.0) {
            reducedDamage = Math.floor(reducedDamage * defData.buffMult);
            defenseSteps.push({ description: "Defensive Buffs", value: `x${defData.buffMult.toFixed(2)}`, result: reducedDamage });
        }

        if (this.isSkillActive('dwarven_battle_arts') && this.equippedWeapon.class === 'Hammer') {
            reducedDamage = Math.floor(reducedDamage * 0.90); // 10% Reduction
            defenseSteps.push({ 
                description: "Dwarven Arts", 
                value: "-10%", 
                result: reducedDamage 
            });
        }
        
        // 7. Apply Damage
        const finalDamageDealt = this._applyAndLogDamage(Math.floor(reducedDamage), 0, attacker, isMagicAttack);

        // 8. Reflect Effects
        this._handleReflectEffects(finalDamageDealt, originalDamage, attacker);
        
        // 9. Flee Check & Logs (Omitted lengthy logic for brevity, keeps existing behavior)
        if (this.hp <= 0 && !this.isFled) {
            this.isFled = true;
            const fleeDialogue = this._getDialogue('FLEE');
            addToLog(`<span class="font-bold text-red-500">${this.name} has been defeated and fled!</span> "${fleeDialogue}"`, "text-red-500");
        }

        if (gameState.currentView === 'battle') {
            renderBattleGrid();
        }
        return { damageDealt: finalDamageDealt, knockback: 0, defenseSteps: defenseSteps }; 
    }
}

class NpcAlly extends Entity {
    // --- CONSTRUCTOR MODIFIED to accept raceKey ---
    constructor(name, classKey, raceKey, playerLevel, backgroundKey, backgroundName) { // <-- MODIFIED SIGNATURE
        super(name);
        this.x = -1;
        this.y = -1;
        this.isFled = false;
        this.isResting = false; // <<< NEWstrengthFlatBonus
        this.isGhost =false;
         this.enchantments = {}; // <-- NEW: Store item-type enchantments
        
        // --- Base Stats & Class ---
        this._classKey = classKey; // Store the key, even if it's undefined
        const classData = CLASSES[classKey]; // Get classData *once*
        this.raceKey = raceKey || 'Human'; // Store the race key
        this.race = RACES[this.raceKey]?.name || 'Human'; // <-- ADDED: Set race display name
        this.backgroundKey = backgroundKey;
        this.background = backgroundName;

        // --- ROBUSTNESS: Ensure this.race is set, even if raceKey was missing ---
        if (!this.race && this.raceKey) {
            this.race = RACES[this.raceKey]?.name || 'Human';
        }
        // --- END ROBUSTNESS ---

        if (classData) {

            this.class = classData.name;
        } else {
            this.class = "Unknown Ally"; // Assign a default name
            console.warn(`NpcAlly loaded with invalid classKey: ${classKey}. Defaulting gear.`);
        }

        // --- THIS IS THE FIX ---
        // playerLevel is now the 4th argument, not the 3rd
        this.level = Math.max(1, Math.floor(playerLevel * 0.95)); // 95% of player level
        if (playerLevel > 1 && this.level === playerLevel) {
             this.level--; // Ensure at least 1 level discrepancy
        }

        // Base stats now come from the provided raceKey
        const raceStats = RACES[this.raceKey] || RACES['Human'];
        this.vigor = (raceStats.Vigor || 0) + (classData?.bonusStats?.Vigor || 0);
        this.focus = (raceStats.Focus || 0) + (classData?.bonusStats?.Focus || 0);
        this.stamina = (raceStats.Stamina || 0) + (classData?.bonusStats?.Stamina || 0);
        this.strength = (raceStats.Strength || 0) + (classData?.bonusStats?.Strength || 0);
        this.intelligence = (raceStats.Intelligence || 0) + (classData?.bonusStats?.Intelligence || 0);
        this.luck = (raceStats.Luck || 0) + (classData?.bonusStats?.Luck || 0);
        // --- END FIX ---

        // Bonus points from leveling
        this.bonusVigor = 0;
        this.bonusFocus = 0;
        this.bonusStamina = 0;
        this.bonusStrength = 0;
        this.bonusIntelligence = 0;
        this.bonusLuck = 0;

        this.bonusHp = 0;
        this.bonusMp = 0;
        this.bonusPhysicalDefense = 0;
        this.bonusMagicalDefense = 0;
        this.bonusPhysicalDamage = 0;
        this.bonusMagicalDamage = 0;
        this.bonusEvasion = 0;
        this.bonusCritChance = 0;
        this._50PercentLogged = false;
        this._10PercentLogged = false;
        this.dialogueType = _determineDialogueType(name); 
        // --- END FIXED ---
        // --- END ADDED ---
        
        // Abilities (References set by updateAbilityReferences)
        this.racialPassive = (chance) => chance; // Default pass-through function
        this.signatureAbilityData = null; // Reference to the ability data object
        this.signatureAbilityUsed = false;
        this.signatureAbilityToggleActive = false;
        this.activeModeIndex = -1; // For Magus
        this.npcAllyMarkedTarget = null; // For Ranger
        this.knownCookingRecipes = []; // For Cook
        this.mpToggleThreshold = 0; // For toggle AI
        this.foodBuffs = {};        
        // --- Stat Allocation ---
        this.calculateStats(playerLevel); // This will set the level and distribute points
        // --- NEW Equipment & Inventory ---
        this.equippedWeapon = WEAPONS['fists'];
        this.equippedCatalyst = CATALYSTS['no_catalyst'];
        this.equippedArmor = ARMOR['travelers_garb'];
        this.equippedShield = SHIELDS['no_shield'];
        this.weaponElement = 'none';
        this.armorElement = 'none';
        this.shieldElement = 'none';
        
        // Inventory for items given by player (10 unique, 10 stack)
        this.inventory = {
            items: {}, 
            size: 10,
            stack: 10
        };
        
        // --- NEW: Spells Property ---
        this.spells = {};
        
        // Tracks [weapon, catalyst, shield] for 2-of-3 rule
        this.equipmentOrder = []; 
        // --- END NEW ---
        
        if (classData && classData.startingEquipment) {
            // Use the new equipItem logic to apply starting gear
            Object.values(classData.startingEquipment).forEach(itemKey => {
                if(itemKey) this.equipItem(itemKey, true); // Equip silently
            });
        }
        
        if (classData && classData.startingSpells) {
            for (const spellKey in classData.startingSpells) {
                this.spells[spellKey] = { tier: classData.startingSpells[spellKey] };
            }
        }

        // --- FIX: Correctly check for *starting* recipes, not random ones ---
        if (classData && classData.startingCookingRecipes) { // Use startingCookingRecipes
            // We just add the property here. The *hiring* logic in rendering.js
            // will be responsible for populating this list.
            // For now, ensure the list exists.
            this.knownCookingRecipes = [...classData.startingCookingRecipes]; // <-- FIX
        }
        // --- END FIX ---

        this.updateAbilityReferences();

        // --- NEW: Recalculate derived bonuses from background ---
        // Ensure seed is set for bonus calculation
        if (player) {
            this.seed = player.seed;
        } else {
            // Fallback seed if player isn't available (shouldn't happen in normal flow)
            this.seed = Math.floor(Math.random() * 1000000);
        }
        this.recalculateGrowthBonuses();
        // --- END NEW ---

        // Final HP/MP calculation
        this.hp = this.maxHp;
        this.mp = this.maxMp;
        this.mpToggleThreshold = Math.floor(this.maxMp * 0.25);
    }
    isAlive() { return this.hp > 0; }

    // [FIX] Add hasSkill stub to prevent crashes when sharing logic with Player
    hasSkill(skillId) { return false; }

    updateAbilityReferences() {
        console.log(`DEBUG: updateAbilityReferences called for Ally. Race Key: "${this.raceKey}"`);

        // Get racial passive function
        this.racialPassive = RACES[this.raceKey]?.passive?.applyEffect || ((chance, playerLevel) => chance);
        console.log("DEBUG: Ally Racial Passive Function assigned:", typeof this.racialPassive === 'function');
        
        // Placeholder for signature ability
        const classData = this._classKey ? CLASSES[this._classKey] : null;
        this.signatureAbilityData = classData ? classData.signatureAbility : null;
        // We aren't *using* this yet, but it's correct to set it here.
    }

    get resistanceChance() {
        let baseResist = Math.min(0.5, ((this.luck + this.bonusLuck) / 100));
        // --- CLANKERS: Absolute Logic ---
        if (this.race === 'Clankers') {
            const multiplier = (this.level >= 20) ? 2.0 : 1.5; // 100% or 50% relative bonus
            baseResist = Math.min(0.80, baseResist * multiplier); // Cap at 80%
        }
        // --- End Clankers Logic ---
        return baseResist;
    }

    rollForEffect(baseChance, debugPurpose = "Unknown Effect") {
        // --- CHANCE LOGGING: Log initial state ---
        if (logChanceCalculations) { // Check the new global flag
            addToLog(`DEBUG (Chance) [ALLY: ${this.name} - ${debugPurpose}]: Base Chance = ${(baseChance * 100).toFixed(1)}%`, 'text-gray-500');
        }

        if (baseChance <= 0) {
             // --- CHANCE LOGGING: Log failure due to 0% ---
             if (logChanceCalculations) addToLog(`DEBUG (Chance) [ALLY: ${this.name} - ${debugPurpose}]: Result = FAIL (Base chance <= 0)`, 'text-gray-500');
             return false;
        }
        if (baseChance >= 1) {
             // --- CHANCE LOGGING: Log success due to 100% ---
             if (logChanceCalculations) addToLog(`DEBUG (Chance) [ALLY: ${this.name} - ${debugPurpose}]: Result = SUCCESS (Base chance >= 1)`, 'text-gray-500');
            return true;
        }


        let modifiedChance = baseChance;
        let logSteps = []; // Keep track of modifications for logging

        // 1. Apply Dragonborn penalty first
        if (this.race === 'Dragonborn') {
            const penalty = (this.level >= 20) ? 0.25 : 0.5; // 75% reduction or 50% reduction
            const oldChance = modifiedChance;
            modifiedChance *= penalty;
            logSteps.push(`Dragonborn Penalty x${penalty.toFixed(2)} -> ${(modifiedChance * 100).toFixed(1)}%`);
        }

        // 2. Apply Human bonus
        // (Uses this.racialPassive, which was set in constructor by updateAbilityReferences)
        const humanBonusApplied = this.race === 'Human' && typeof this.racialPassive === 'function';
        if (humanBonusApplied) {
            const oldChance = modifiedChance;
            modifiedChance = this.racialPassive(modifiedChance, this.level); // Call the specific function from RACES data
            logSteps.push(`Human Bonus -> ${(modifiedChance * 100).toFixed(1)}%`);
        }

        // --- CHANCE LOGGING: Log final chance before roll ---
        if (logChanceCalculations && logSteps.length > 0) {
             addToLog(`DEBUG (Chance) [ALLY: ${this.name} - ${debugPurpose}]: Modifications => ${logSteps.join(' | ')}`, 'text-gray-500');
        } else if (logChanceCalculations) {
            addToLog(`DEBUG (Chance) [ALLY: ${this.name} - ${debugPurpose}]: Final Chance = ${(modifiedChance * 100).toFixed(1)}% (No mods applied)`, 'text-gray-500');
        }


        // 3. Make the initial roll
        let roll = Math.random();
        // --- CHANCE LOGGING: Log the roll ---
        if (logChanceCalculations) {
            addToLog(`DEBUG (Chance) [ALLY: ${this.name} - ${debugPurpose}]: Rolled ${roll.toFixed(3)} vs Chance ${(modifiedChance * 100).toFixed(1)}%`, 'text-gray-500');
        }

        if (roll < modifiedChance) {
            // --- CHANCE LOGGING: Log success ---
            if (logChanceCalculations) addToLog(`DEBUG (Chance) [ALLY: ${this.name} - ${debugPurpose}]: Result = SUCCESS`, 'text-green-400');
            if (isDebugVisible && !logChanceCalculations) console.log(`Racial Roll [ALLY: ${this.name} - ${debugPurpose}]: SUCCESS (Base: ${baseChance.toFixed(2)}, Mod: ${modifiedChance.toFixed(2)}, Roll: ${roll.toFixed(2)})`);
            return true; // Success!
        }

        // 4. Handle Halfling reroll on failure
        if (this.race === 'Halfling') {
            const rerollChance = (this.level >= 20) ? (1/6) : 0.10; // 10% or 1-in-6
             // --- CHANCE LOGGING: Log Halfling attempt ---
             if (logChanceCalculations) {
                 addToLog(`DEBUG (Chance) [ALLY: ${this.name} - ${debugPurpose}]: Halfling Reroll Check (${(rerollChance * 100).toFixed(1)}% chance)`, 'text-gray-500');
             }

            let rerollLuckRoll = Math.random(); // Roll for the *chance* to reroll
            if (rerollLuckRoll < rerollChance) {
                 // --- CHANCE LOGGING: Log Halfling reroll triggered ---
                 if (logChanceCalculations) addToLog(`DEBUG (Chance) [ALLY: ${this.name} - ${debugPurpose}]: Halfling Reroll Triggered! Rerolling...`, 'text-yellow-300');

                // Halfling luck triggers a *recalculation* against the modified chance, not a guaranteed success
                let reroll = Math.random();
                 // --- CHANCE LOGGING: Log the actual reroll value ---
                 if (logChanceCalculations) {
                    addToLog(`DEBUG (Chance) [ALLY: ${this.name} - ${debugPurpose}]: Rerolled ${reroll.toFixed(3)} vs Chance ${(modifiedChance * 100).toFixed(1)}%`, 'text-yellow-300');
                 }

                if (reroll < modifiedChance) {
                    addToLog(`${this.name}'s uncanny luck grants them a second chance... and it succeeds!`, "text-green-300");
                    // --- CHANCE LOGGING: Log Halfling success ---
                    if (logChanceCalculations) addToLog(`DEBUG (Chance) [ALLY: ${this.name} - ${debugPurpose}]: Result = HALFLING SUCCESS`, 'text-green-400');
                    if (isDebugVisible && !logChanceCalculations) console.log(`Racial Roll [ALLY: ${this.name} - ${debugPurpose}]: HALFLING SUCCESS (Base: ${baseChance.toFixed(2)}, Mod: ${modifiedChance.toFixed(2)}, Reroll: ${reroll.toFixed(2)})`);
                    return true; // Reroll succeeded!
                } else {
                     // --- CHANCE LOGGING: Log Halfling reroll failure ---
                     if (logChanceCalculations) addToLog(`DEBUG (Chance) [ALLY: ${this.name} - ${debugPurpose}]: Reroll Failed. Result = FAIL`, 'text-red-400');
                }
            } else {
                // --- CHANCE LOGGING: Log Halfling luck didn't trigger ---
                if (logChanceCalculations) addToLog(`DEBUG (Chance) [ALLY: ${this.name} - ${debugPurpose}]: Reroll Not Triggered. Result = FAIL`, 'text-red-400');
            }
             // Fall through to standard failure logging if reroll wasn't attempted or failed
        }

        // 5. Standard failure for all other races (or Halfling fail)
        // --- CHANCE LOGGING: Log final failure ---
        if (logChanceCalculations && this.race !== 'Halfling') { // Avoid double logging Halfling fail
             addToLog(`DEBUG (Chance) [ALLY: ${this.name} - ${debugPurpose}]: Result = FAIL`, 'text-red-400');
        }
        if (isDebugVisible && !logChanceCalculations) console.log(`Racial Roll [ALLY: ${this.name} - ${debugPurpose}]: FAIL (Base: ${baseChance.toFixed(2)}, Mod: ${modifiedChance.toFixed(2)}, Roll: ${roll.toFixed(2)})`);
        return false;
    }
    // --- END ADDED ---


    recalculateGrowthBonuses() {
        // Reset all derived bonuses before recalculating
        this.bonusHp = 0;
        this.bonusMp = 0;
        this.bonusPhysicalDefense = 0;
        this.bonusMagicalDefense = 0;
        this.bonusPhysicalDamage = 0;
        this.bonusMagicalDamage = 0;
        this.bonusEvasion = 0;
        this.bonusCritChance = 0;

        if (!this.backgroundKey || !BACKGROUNDS[this.backgroundKey]) return;

        const backgroundData = BACKGROUNDS[this.backgroundKey];
        // Ensure seed exists and is valid before creating RNG
        if (this.seed === null || this.seed === undefined || isNaN(Number(this.seed))) {
            console.warn("NPC seed is invalid during recalculateGrowthBonuses. Using temp random.");
            this.seed = Math.floor(Math.random() * 1000000);
        }
        const rng = seededRandom(this.seed);


        if (backgroundData.growthBonus.wretch) {
            const totalPointsSpent = (this.bonusVigor || 0) + (this.bonusFocus || 0) + (this.bonusStamina || 0) + (this.bonusStrength || 0) + (this.bonusIntelligence || 0) + (this.bonusLuck || 0);
            const procs = Math.floor(totalPointsSpent / 2); // Wretch gets bonus every 2 points spent
            const possibleBonuses = ['vigor', 'focus', 'stamina', 'strength', 'intelligence', 'luck'];

            for (let i = 0; i < procs; i++) {
                const randomStat = possibleBonuses[Math.floor(rng() * possibleBonuses.length)];
                this.applyBonusForStat(randomStat, 1, rng, true); // Apply 1 point bonus
            }
            // Also apply normal bonuses for the points spent directly
            this.applyBonusForStat('vigor', this.bonusVigor || 0, rng);
            this.applyBonusForStat('focus', this.bonusFocus || 0, rng);
            this.applyBonusForStat('stamina', this.bonusStamina || 0, rng);
            this.applyBonusForStat('strength', this.bonusStrength || 0, rng);
            this.applyBonusForStat('intelligence', this.bonusIntelligence || 0, rng);
            this.applyBonusForStat('luck', this.bonusLuck || 0, rng);


            return; // Exit after Wretch logic
        }

        // Standard background bonus application
        this.applyBonusForStat('vigor', this.bonusVigor || 0, rng);
        this.applyBonusForStat('focus', this.bonusFocus || 0, rng);
        this.applyBonusForStat('stamina', this.bonusStamina || 0, rng);
        this.applyBonusForStat('strength', this.bonusStrength || 0, rng);
        this.applyBonusForStat('intelligence', this.bonusIntelligence || 0, rng);
        this.applyBonusForStat('luck', this.bonusLuck || 0, rng);
    }

    // --- PASTE `applyBonusForStat` from Player class ---
    applyBonusForStat(stat, points, rng, isWretchProc = false) {
         // Ensure points is a non-negative number
         points = Math.max(0, points || 0);
        if (!this.backgroundKey || !BACKGROUNDS[this.backgroundKey] || points === 0) return;


        const background = BACKGROUNDS[this.backgroundKey];
        const favoredStats = background.favoredStats.map(s => s.toLowerCase());

        // Wretch procs apply regardless of favored stats
        // Standard bonuses only apply if the stat is favored (or if background is Wretch itself, handled above)
        if (!isWretchProc && !background.growthBonus.wretch && !favoredStats.includes(stat)) return;


        switch(stat) {
            case 'vigor': this.bonusHp += 5 * points; break;
            case 'focus': this.bonusMp += 5 * points; break;
            case 'stamina':
                for (let i = 0; i < points; i++) {
                    if (rng() < 0.5) this.bonusPhysicalDefense += 0.5;
                    else this.bonusMagicalDefense += 0.5;
                }
                break;
            case 'strength': this.bonusPhysicalDamage += 1 * points; break;
            case 'intelligence': this.bonusMagicalDamage += 1 * points; break;
            case 'luck':
                for (let i = 0; i < points; i++) {
                    if (rng() < 0.5) this.bonusEvasion += 0.005; // 0.5% per point
                    else this.bonusCritChance += 0.005; // 0.5% per point
                }
                break;
        }
         // Ensure derived stats are numbers after calculation
         this.bonusHp = this.bonusHp || 0;
         this.bonusMp = this.bonusMp || 0;
         this.bonusPhysicalDefense = this.bonusPhysicalDefense || 0;
         this.bonusMagicalDefense = this.bonusMagicalDefense || 0;
         this.bonusPhysicalDamage = this.bonusPhysicalDamage || 0;
         this.bonusMagicalDamage = this.bonusMagicalDamage || 0;
         this.bonusEvasion = this.bonusEvasion || 0;
         this.bonusCritChance = this.bonusCritChance || 0;
    }

    // --- Stat Calculation Method ---
    calculateStats(playerLevel) {
        const oldLevel = this.level;
        this.level = Math.max(1, Math.floor(playerLevel * 0.95)); // 95%
        if (playerLevel > 1 && this.level === playerLevel) {
             this.level--; // Ensure at least 1 level discrepancy
        }

        if (this.level > oldLevel) {
            const dialogue = this._getDialogue('LEVEL_UP', player.name);
            addToLog(`Your ally, ${this.name}, has grown stronger! They are now level ${this.level}.<br>"${dialogue}"`, 'text-blue-300');
        }

        const totalPoints = (this.level - 1) * 5;
        const allocation = NPC_STAT_ALLOCATIONS[this._classKey];
        if (!allocation || totalPoints <= 0) {
            // Ensure bonus stats are initialized even if no points are spent
            this.bonusVigor = 0;
            this.bonusFocus = 0;
            this.bonusStamina = 0;
            this.bonusStrength = 0;
            this.bonusIntelligence = 0;
            this.bonusLuck = 0;
            this.mpToggleThreshold = Math.floor(this.maxMp * 0.25);
            return;
        };

        // Distribute points based on percentages
        this.bonusVigor = Math.floor(totalPoints * allocation.Vigor);
        this.bonusFocus = Math.floor(totalPoints * allocation.Focus);
        this.bonusStamina = Math.floor(totalPoints * allocation.Stamina);
        this.bonusStrength = Math.floor(totalPoints * allocation.Strength);
        this.bonusIntelligence = Math.floor(totalPoints * allocation.Intelligence);
        this.bonusLuck = Math.floor(totalPoints * allocation.Luck);
        
        // --- MODIFIED: Distribute remaining points based on allocation weight ---
        let remainingPoints = totalPoints - (this.bonusVigor + this.bonusFocus + this.bonusStamina + this.bonusStrength + this.bonusIntelligence + this.bonusLuck);
        
        // Sort stats by allocation percentage, descending
        const allocationEntries = Object.entries(allocation);
        allocationEntries.sort((a, b) => b[1] - a[1]); // Sort by percentage
        
        // Give remaining points to the highest-allocation stats
        for (let i = 0; i < remainingPoints; i++) {
            const statToBuff = allocationEntries[i % allocationEntries.length][0]; // Cycle through top stats
            switch(statToBuff) {
                case 'Vigor': this.bonusVigor++; break;
                case 'Focus': this.bonusFocus++; break;
                case 'Stamina': this.bonusStamina++; break;
                case 'Strength': this.bonusStrength++; break;
                case 'Intelligence': this.bonusIntelligence++; break;
                case 'Luck': this.bonusLuck++; break;
            }
        }
        this.mpToggleThreshold = Math.floor(this.maxMp * 0.25);
    }

    _getDialogue(type, playerName) { // Accepts playerName
        const dialogueList = NPC_DIALOGUE[type] || [];
        
        // 1. Try to find the exact dialogueType (Male, Female, or Spiced)
        let genderedLines = dialogueList.find(d => d.gender === this.dialogueType);

        // 2. Fallback to Neutral if the specific type is missing or null.
        if (!genderedLines) {
            genderedLines = dialogueList.find(d => d.gender === 'Neutral');
        }
        
        // 3. Extract lines array, falling back to a single generic line if all else fails.
        const lines = genderedLines ? genderedLines.lines : ["I am currently unavailable."]; // Fixed fallback text
        
        // Select a random line
        let line = lines[Math.floor(Math.random() * lines.length)];
        
        // Replace placeholders
        line = line.replace(/<AllyName>/g, this.name);
        line = line.replace(/<PlayerName>/g, playerName || 'Adventurer'); // Replace Player Name
        
        return line;
    }


    _calculateClericHealAvg() {
        if (this._classKey !== 'cleric' || !this.signatureAbilityData) {
            return 0;
        }
        
        const ability = this.signatureAbilityData;
        const catalyst = this.equippedCatalyst;
        
        // Cleric ability requires a catalyst
        if (!catalyst || catalyst.name === 'None') {
            return 0;
        }
        
        // Calculate healing dice (scales with level, caps at 7)
        const baseDice = 3;
        let healDiceCount = Math.min(7, baseDice + Math.floor(this.level / 10));
        
        // Add catalyst bonus
        const spellAmp = catalyst.effect?.spell_amp || 0;
        healDiceCount = Math.min(7, healDiceCount + spellAmp); // Apply amp, still cap at 7
        
        // Calculate average heal amount (base)
        // (1+8) / 2 = 4.5
        let avgHeal = healDiceCount * 4.5; 
        
        // Apply magical damage bonus
        const statBonus = this.magicalDamageBonus;
        const statMultiplier = 1 + statBonus / 20;
        avgHeal = Math.floor(avgHeal * statMultiplier);
        
        // --- MODIFIED: Use total intelligence for flat bonus ---
        const intFlatBonus = Math.floor((this.intelligence + this.bonusIntelligence) / 5);
        avgHeal += intFlatBonus;

        // Apply Ally's racial passives (Dragonborn, Elemental[healing])
        if (this.race === 'Dragonborn') {
            const damageBonus = (this.level >= 20) ? 1.20 : 1.10;
            avgHeal = Math.floor(avgHeal * damageBonus);
        }
        // Note: Allies don't have elemental affinity, so no 'Elementals' check for healing.

        return Math.floor(avgHeal);
    }
    // --- MODIFIED: Derived Stat Getters (to include background bonuses) ---
    get maxHp() { 
        let finalHp = ((this.vigor + this.bonusVigor) * 5) + this.bonusHp;
        // Allies don't get food buffs
        return Math.floor(finalHp);
    }
    get maxMp() { 
        let finalMp = ((this.focus + this.bonusFocus) * 5) + this.bonusMp;
        // Allies don't get food buffs
        return Math.floor(finalMp);
    }
    get physicalDefense() { return Math.floor(((this.stamina + this.bonusStamina) + (this.vigor + this.bonusVigor)) / 2) + this.bonusPhysicalDefense; }
    get magicalDefense() { return Math.floor(((this.stamina + this.bonusStamina) + (this.focus + this.bonusFocus)) / 2) + this.bonusMagicalDefense; }
    get physicalDamageBonus() { return (this.strength + this.bonusStrength) + this.bonusPhysicalDamage; }
    get magicalDamageBonus() { return (this.intelligence + this.bonusIntelligence) + this.bonusMagicalDamage; }
    get critChance() { return Math.min(0.3, (((this.luck + this.bonusLuck) * 0.5) / 100) + this.bonusCritChance); }
    get evasionChance() { return Math.min(0.2, (((this.luck + this.bonusLuck) * 0.5) / 100) + this.bonusEvasion); }


    _calculateAvoidanceChances() {
        const shield = this.equippedShield;
        const armor = this.equippedArmor;
        const weapon = this.equippedWeapon;
        
        let dodgeChance = this.evasionChance;
        let parryChance = 0;
        
        // [FIX] Check both nested effect and root for blockChance
        let armorBlock = armor?.effect?.blockChance || armor?.blockChance || 0;
        let shieldBlock = shield?.blockChance || shield?.effect?.blockChance || 0;
        let blockChance = shieldBlock + armorBlock;

        // Gear Dodge/Parry Bonuses/Penalties
        // [FIX] Check nested dodge type
        if (armor && armor.effect?.type === 'dodge') dodgeChance += armor.effect.chance;
        else if (armor && armor.metallic) dodgeChance *= 0.5;
        
        if (shield && ['Tower Greatshield', 'Heavy Slabshield'].includes(shield.name)) dodgeChance *= 0.5;
        if (shield && shield.effect?.type === 'parry') parryChance += shield.effect.chance;
        if (weapon.effect?.parry) parryChance += weapon.effect.parry;

        // Racial Bonuses/Penalties
        if (this.race === 'Elf' && (!armor || !armor.metallic)) {
            let relativeBonus = dodgeChance * 0.5;
            let cappedBonus = Math.min(relativeBonus, 0.50);
            dodgeChance += cappedBonus;
        }
        if (this.race === 'Beastkin') {
            dodgeChance *= 1.25;
            parryChance *= 1.25;
            blockChance *= 1.25;
        }

        if (this.isSkillActive && this.isSkillActive('heavy_armor_proficiency') && armor && armor.metallic) {
            blockChance += 0.05;
        }
        
        if (this.isSkillActive && this.isSkillActive('light_armor_proficiency') && (!armor || !armor.metallic)) {
            dodgeChance += 0.05;
        }
        
        if (this.statusEffects.buff_shroud || this.statusEffects.buff_voidwalker) dodgeChance *= 1.5;
        if (this.statusEffects.buff_hermes) dodgeChance *= 2;
        if (this.statusEffects.bonus_speed) dodgeChance += this.statusEffects.bonus_speed.dodge;
        if (this.statusEffects.slowed) dodgeChance = Math.max(0, dodgeChance + this.statusEffects.slowed.dodge);
        if (this.statusEffects.clumsy) dodgeChance = Math.max(0, dodgeChance + this.statusEffects.clumsy.dodge);

        // Clamp chances
        dodgeChance = Math.max(0, Math.min(0.95, dodgeChance));
        parryChance = Math.max(0, Math.min(0.95, parryChance));
        blockChance = Math.max(0, Math.min(0.95, blockChance));

        return { dodge: dodgeChance, parry: parryChance, block: blockChance };
    }

    _attemptAvoidance(avoidanceChances, attacker) {
        // --- Parry Check ---
        if (attacker && this.rollForEffect(avoidanceChances.parry, 'Parry') && attacker.isAlive()) {
            attacker.attackParried = true;
            addToLog(`${this.name} parried ${attacker.name}'s attack!`, 'text-yellow-300 font-bold');
            this._handleParryCounterAttack(attacker);
            return true; // Avoided
        }

        // --- Dodge Check ---
        if (attacker && this.rollForEffect(avoidanceChances.dodge, 'Dodge')) {
            attacker.attackParried = true;
            addToLog(`${this.name} dodged ${attacker.name}'s attack!`, 'text-teal-300 font-bold');
            return true; // Avoided
        }

        // --- Block Check ---
        if (this.rollForEffect(avoidanceChances.block, 'Block')) {
            if (attacker) attacker.attackParried = true;
            addToLog(`${this.name} blocked the attack!`, 'text-cyan-400 font-bold');
            return true; // Avoided
        }

        return false; // Not avoided
    }

    /** Handles the counter-attack logic after a successful parry (Simplified for Ally). */
    _handleParryCounterAttack(attacker) {
        setTimeout(() => {
            if (gameState.battleEnded || !attacker || !attacker.isAlive()) return;
            addToLog(`${this.name} launches a swift counter-attack!`, 'text-yellow-300');

            const weapon = this.equippedWeapon;
            let messageLog = [];

            // --- Dwarf: Craftsmen's Intuition (Evolution) ---
            let attackDamageDice = [...weapon.damage]; // [numDice, sides]
            if (this.race === 'Dwarf' && this.level >= 20) {
                if (attackDamageDice[1] === 6) { attackDamageDice[1] = 8; }
                else if (attackDamageDice[1] === 8) { attackDamageDice[1] = 10; }
            }

            let rollResult = rollDice(attackDamageDice[0], attackDamageDice[1], `${this.name} Parry`);
            let baseWeaponDamage = rollResult.total;
            let statBonus = this.physicalDamageBonus;

            let damage = baseWeaponDamage;
            const statMultiplier = 1 + statBonus / 20;
            damage = Math.floor(damage * statMultiplier);

            const strengthFlatBonus = Math.floor(this.strength / 5);
            damage += strengthFlatBonus;

            let attackEffects = { element: this.weaponElement };

            // --- DRAGONBORN: Bloodline Attunement (Damage) ---
            if (this.race === 'Dragonborn') {
                const damageBonus = (this.level >= 20) ? 1.20 : 1.10;
                damage = Math.floor(damage * damageBonus);
            }

            // Critical Hit Calculation (Simplified)
            let critChance = this.critChance;
            const canWeaponCrit = weapon.class === 'Dagger' || weapon.effect?.critChance;
            if (canWeaponCrit) {
                if (weapon.class === 'Dagger') critChance += 0.1;
                if (weapon.effect?.critChance) critChance += weapon.effect.critChance;

                if (this.rollForEffect(critChance, 'Parry Crit')) {
                    let critMultiplier = weapon.effect?.critMultiplier || 1.5;
                    damage = Math.floor(damage * critMultiplier);
                    messageLog.push(`CRITICAL HIT!`);
                }
            }

            // Armor Pierce
            if (weapon.class === 'Thrusting Sword') attackEffects.armorPierce = 0.2;
            if (weapon.effect?.armorPierce) attackEffects.armorPierce = (attackEffects.armorPierce || 0) + weapon.effect.armorPierce;
           
            const damageResult = attacker.takeDamage(damage, attackEffects);
            const finalDamage = damageResult.damageDealt;

            let damageType = weapon.damageType || 'physical';
            if (attackEffects.element && attackEffects.element !== 'none') {
                damageType = ELEMENTS[attackEffects.element].name;
            }
            let logMessagesCombined = messageLog.join(' ');
            addToLog(`${this.name}'s riposte hits ${attacker.name} for <span class="font-bold text-yellow-300">${finalDamage}</span> ${damageType} damage. ${logMessagesCombined}`);

            // Lifesteal
            if (finalDamage > 0) {
                let lifestealAmount = 0;
                if (weapon.class === 'Reaper') lifestealAmount += finalDamage * 0.1;
                if (weapon.effect?.lifesteal) lifestealAmount += finalDamage * weapon.effect.lifesteal;
                if (lifestealAmount > 0 && attacker.speciesData.class !== 'Undead') {
                    const healedAmount = Math.floor(lifestealAmount);
                    if (healedAmount > 0) {
                        this.hp = Math.min(this.maxHp, this.hp + healedAmount);
                        addToLog(`${this.name} drains <span class="font-bold text-green-400">${healedAmount}</span> HP.`);
                    }
                }
            }
            
            if (!gameState.battleEnded) {
                checkBattleStatus(true); // Check if the counter-attack was fatal
                renderBattleGrid(); // Update ally HP bar if they lifestealed
            }
        }, 300);
    }

    _applyAlchemicalBarrier(incomingDamage) {
        if (this.statusEffects.alchemical_barrier && this.statusEffects.alchemical_barrier.hp > 0) {
            const barrierHP = this.statusEffects.alchemical_barrier.hp;
            if (incomingDamage >= barrierHP) {
                incomingDamage -= barrierHP;
                delete this.statusEffects.alchemical_barrier;
                addToLog(`${this.name}'s alchemical barrier shatters, absorbing <span class="font-bold text-cyan-300">${barrierHP}</span> damage!`, 'text-cyan-400');
            } else {
                this.statusEffects.alchemical_barrier.hp -= incomingDamage;
                addToLog(`${this.name}'s alchemical barrier absorbs <span class="font-bold text-cyan-300">${incomingDamage}</span> damage! (${this.statusEffects.alchemical_barrier.hp} HP remaining)`, 'text-cyan-400');
                return 0; // Damage fully absorbed
            }
        }
        return incomingDamage; // Return remaining damage
    }

    _applyDamageVulnerabilities(damage, isMagicAttack, ignoresDefense, attacker = null) {
        let modifiedDamage = damage;
        // --- ORC: Brutish Physique ---
        if (this.race === 'Orc') {
            if (!isMagicAttack && !ignoresDefense) { // Physical damage
                modifiedDamage = Math.floor(modifiedDamage * 0.9); // 10% reduction
                addToLog(`${this.name}'s brutish physique shrugs off some physical damage!`, "text-gray-400");
            } else if (isMagicAttack && this.level < 20) { // Magical damage, pre-evolution
                modifiedDamage = Math.floor(modifiedDamage * 1.1); // 10% weakness
                addToLog(`${this.name}'s physique is vulnerable to magic!`, "text-red-400");
            }
        }
        // --- End Orc Logic ---

        // (Other buffs like Enrage)
        if (this.statusEffects.buff_enrage && !isMagicAttack && !ignoresDefense) {
            modifiedDamage = Math.floor(modifiedDamage * 1.5);
            addToLog(`${this.name}'s rage leaves them open!`, `text-red-400`);
        }
         // Elemental vulnerability from status
        if(this.statusEffects.elemental_vuln && attacker?.element === this.statusEffects.elemental_vuln.element){
            modifiedDamage = Math.floor(modifiedDamage * 1.25);
            addToLog(`${this.name} is vulnerable to ${attacker.element} and takes extra damage!`, 'text-red-600');
        }

        return modifiedDamage;
    }

    _calculateEffectiveDefense(isMagicAttack, attackerElement, ignoresDefense, attacker = null) {
        if (ignoresDefense) {
            addToLog(`The attack ignores ${this.name}'s defense!`, 'text-yellow-500 font-bold');
            return { flat: 0, gearPercent: 0, buffMult: 1.0 };
        }

        // 1. FLAT
        let flatDefense = isMagicAttack ? this.magicalDefense : this.physicalDefense;

        // 2. PERCENTAGE (Gear)
        const shield = this.equippedShield;
        const armor = this.equippedArmor;
        
        let shieldDefense = shield?.defense || 0;
        // [FIX] Use Magic Defense from armor if it exists and attack is magic
        let armorDefense = 0;
        if (isMagicAttack) {
            armorDefense = armor?.magicDefense || 0;
        } else {
            armorDefense = armor?.defense || 0;
        }

        let gearPercent = (shieldDefense + armorDefense) / 100;
        gearPercent = Math.min(0.95, gearPercent);

        // 3. MULTIPLIERS (Buffs)
        let damageMult = 1.0;

        if (attackerElement && attackerElement !== 'none') {
            const armorMod = calculateElementalModifier(attackerElement, this.armorElement);
            if (armorMod !== 1) {
                damageMult *= armorMod;
                addToLog(`${this.name}'s armor enchantment ${armorMod < 1 ? 'resists' : 'is weak to'} the attack!`, armorMod < 1 ? 'text-green-400' : 'text-red-500');
            }
            const shieldMod = calculateElementalModifier(attackerElement, this.shieldElement);
            if (shieldMod !== 1) {
                damageMult *= shieldMod;
                addToLog(`${this.name}'s shield enchantment ${shieldMod < 1 ? 'resists' : 'is weak to'} the attack!`, shieldMod < 1 ? 'text-green-400' : 'text-red-500');
            }
        }

        if (this.statusEffects.stonehide) damageMult *= this.statusEffects.stonehide.multiplier;
        if (this.statusEffects.buff_defense) damageMult *= this.statusEffects.buff_defense.multiplier;
        if (this.statusEffects.buff_magic_defense && isMagicAttack) damageMult *= this.statusEffects.buff_magic_defense.multiplier;
        if (this.statusEffects.buff_divine && isMagicAttack) damageMult *= this.statusEffects.buff_divine.multiplier;
        if (this.statusEffects && this.statusEffects.tripped) {
             damageMult *= 1.25; 
        }
        if (attacker?.element === 'void') {
            damageMult *= 1.5; 
            addToLog(`The void attack partially bypasses ${this.name}'s defense!`, 'text-purple-400');
        }

        return { flat: Math.floor(Math.max(0, flatDefense)), gearPercent, buffMult: Math.max(0, damageMult) };
    }

    _applyAndLogDamage(finalDamage, unusedDefense, attacker, isMagicAttack) {
        this.hp -= finalDamage;
        this.hp = Math.max(0, this.hp);

        let damageType = '';
        if (attacker && attacker.element && attacker.element !== 'none') {
            damageType = ` ${ELEMENTS[attacker.element].name}`;
        } else if (isMagicAttack) {
            damageType = ' magical';
        }
        addToLog(`${this.name} takes <span class="font-bold text-red-400">${finalDamage}</span>${damageType} damage.`);
        return finalDamage;
    }

    _handleReflectEffects(finalDamageDealt, originalDamage, attacker) {
        if (!attacker || !attacker.isAlive()) return;

        const armor = this.equippedArmor;
        const shield = this.equippedShield;
        let reflectedDamage = 0;
        let reflectSource = '';
        let reflectElement = 'none';

        // [FIX] Check new effect structure
        if (armor?.effect?.type === 'reflect') {
            reflectedDamage = Math.floor(originalDamage * (armor.effect.amount || 0));
            reflectSource = armor.name;
            reflectElement = this.armorElement;
        }
        else if (armor?.effect?.reflect_damage) {
            reflectedDamage = Math.floor(originalDamage * armor.effect.reflect_damage);
            reflectSource = armor.name;
            reflectElement = this.armorElement;
        }
        else if (shield?.effect?.type === 'reflect') {
            reflectedDamage = Math.floor(originalDamage * shield.effect.amount);
            reflectSource = shield.name;
            reflectElement = this.shieldElement;
        }

        if (reflectedDamage > 0) {
            const damageResult = attacker.takeDamage(reflectedDamage, { element: reflectElement });
            const finalReflected = damageResult.damageDealt;
            addToLog(`${this.name}'s ${reflectSource} reflects <span class="font-bold text-orange-400">${finalReflected}</span> damage back at ${attacker.name}!`, 'text-orange-300');
            if (!gameState.battleEnded) checkBattleStatus(true);
            if (!attacker.isAlive()) return;
        }

        // Tiefling Passive
        if (this.race === 'Tiefling' && finalDamageDealt > 0) {
            const reflectionCost = (this.level >= 20) ? 0 : 5;
            if (this.mp >= reflectionCost) {
                if (reflectionCost > 0) this.mp -= reflectionCost;
                reflectedDamage = Math.floor(finalDamageDealt * 0.10);
                if (reflectedDamage > 0) {
                    const damageResult = attacker.takeDamage(reflectedDamage, { isMagic: true, element: 'fire', ignore_defense: 1.0 });
                    const finalReflected = damageResult.damageDealt;
                    addToLog(`${this.name}'s infernal blood rebukes ${attacker.name} for <span class="font-bold text-red-500">${finalReflected}</span> fire damage!`, 'text-orange-400');
                     if (!gameState.battleEnded) checkBattleStatus(true);
                }
            }
        }
    }

    // --- REPLACED: Main takeDamage function ---
    takeDamage(damage, options = {}) {
        // 1. Calculate Avoidance
        const avoidanceChances = this._calculateAvoidanceChances();
        const attacker = options.attacker || (options.element ? { element: options.element } : null);

        // 2. Attempt Avoidance
        if (this._attemptAvoidance(avoidanceChances, attacker)) {
            if (gameState.currentView === 'battle') renderBattleGrid();
            return { damageDealt: 0, knockback: 0, defenseSteps: [{ description: "Avoidance", value: "Negated", result: 0 }] };
        }

        const defenseSteps = []; // Log Start
        const originalDamage = damage;

        // 3. Apply Alchemical Barrier
        const dmgBeforeBarrier = damage;
        damage = this._applyAlchemicalBarrier(damage);
        if (dmgBeforeBarrier !== damage) {
             defenseSteps.push({ description: "Alchemical Barrier", value: `-${dmgBeforeBarrier - damage}`, result: damage });
        }
        if (damage <= 0) {
            if (gameState.currentView === 'battle') renderBattleGrid();
            return { damageDealt: 0, knockback: 0, defenseSteps };
        }

        // 4. Determine Attack Type & Vulnerabilities
        const isMagicAttack = (attacker?.element && attacker.element !== 'none') || options.isMagic || options.ignore_defense;
        
        const dmgBeforeVuln = damage;
        damage = this._applyDamageVulnerabilities(damage, isMagicAttack, options.ignore_defense, attacker);
        if (dmgBeforeVuln !== damage) {
            defenseSteps.push({ description: "Vulnerabilities", value: "Multiplier", result: damage });
        }

        // 5. Calculate Effective Defense
        const defData = this._calculateEffectiveDefense(isMagicAttack, attacker?.element, options.ignore_defense, attacker);
        
        // 6. Apply Final Calculations
        let reducedDamage = Math.max(0, damage - defData.flat);
        if (defData.flat > 0) {
            defenseSteps.push({ description: `Flat Defense`, value: `-${defData.flat}`, result: reducedDamage });
        }

        // Percent Mitigation
        let effectiveGearPercent = defData.gearPercent;
        if (options.armorPierce) {
             effectiveGearPercent = effectiveGearPercent * (1 - options.armorPierce);
             defenseSteps.push({ description: "Armor Pierce", value: `-${(options.armorPierce*100).toFixed(0)}% Def`, result: "" });
        }

        if (effectiveGearPercent > 0) {
            let oldDmg = reducedDamage;
            reducedDamage = Math.floor(reducedDamage * (1 - effectiveGearPercent));
            defenseSteps.push({ description: `Mitigation (${(effectiveGearPercent*100).toFixed(0)}%)`, value: `-${oldDmg - reducedDamage}`, result: reducedDamage });
        }

        // Buff Multipliers
        if (defData.buffMult !== 1.0) {
            reducedDamage = Math.floor(reducedDamage * defData.buffMult);
            defenseSteps.push({ description: "Defensive Buffs", value: `x${defData.buffMult.toFixed(2)}`, result: reducedDamage });
        }
        
        const finalDamageDealt = this._applyAndLogDamage(Math.floor(reducedDamage), 0, attacker, isMagicAttack);

        // 7. Handle Reflect Effects
        this._handleReflectEffects(finalDamageDealt, originalDamage, attacker);
        
        // 8. Check for Flee state
        if (this.hp <= 0 && !this.isFled) {
            this.isFled = true;
            const fleeDialogue = this._getDialogue('FLEE');
            addToLog(`<span class="font-bold text-red-500">${this.name} has been defeated and fled!</span> "${fleeDialogue}"`, "text-red-500");
        }
        
        const hpPercent = this.hp / this.maxHp;
        if (hpPercent <= 0.10 && !this._10PercentLogged) {
            const dialogue = this._getDialogue('HP_10', player.name);
            addToLog(`(${this.name}) CRITICAL HEALTH WARNING!<br>"${dialogue}"`, 'text-red-500');
            this._10PercentLogged = true;
            this._50PercentLogged = true; // Prevents 50% from firing if 10% is reached first
        } else if (hpPercent <= 0.50 && !this._50PercentLogged) {
            const dialogue = this._getDialogue('HP_50', player.name);
            addToLog(`(${this.name}) HEALTH ALERT!<br>"${dialogue}"`, 'text-yellow-400');
            this._50PercentLogged = true;
        } else if (hpPercent > 0.50) {
            // Reset flags if healed above 50%
            this._10PercentLogged = false;
            this._50PercentLogged = false;
        }

        if (gameState.currentView === 'battle') {
            renderBattleGrid();
        }
        return { damageDealt: finalDamageDealt, knockback: 0, defenseSteps: defenseSteps }; 
    }
    // --- END REPLACED ---

    // --- Battle AI ---
    async attack(target) {
        if (!target || !target.isAlive()) return;

        const weapon = this.equippedWeapon;
        let weaponRange = weapon.range || 1;
        
        let distance = Math.abs(this.x - target.x) + Math.abs(this.y - target.y);

        if (distance > weaponRange) {
            await this.moveTowards(target);
            distance = Math.abs(this.x - target.x) + Math.abs(this.y - target.y);
        }

        if (distance <= weaponRange) {
            this._performAttack(target);
        } else {
            addToLog(`${this.name} cannot reach ${target.name}.`);
        }
    }

    _performAttack(target) {
        if (!target || !target.isAlive()) return;
        
        const weapon = this.equippedWeapon;
        let messageLog = []; // For crit messages, etc.

        // --- Dwarf: Craftsmen's Intuition (Evolution) ---
        let attackDamageDice = [...weapon.damage]; // [numDice, sides]
        if (this.race === 'Dwarf' && this.level >= 20) {
            if (attackDamageDice[1] === 6) { attackDamageDice[1] = 8; }
            else if (attackDamageDice[1] === 8) { attackDamageDice[1] = 10; }
        }

        let rollResult = rollDice(attackDamageDice[0], attackDamageDice[1], `${this.name} Attack`);
        let baseWeaponDamage = rollResult.total;
        
        // --- START: Full Damage Calculation (Copied from Parry) ---
        let statBonus = this.physicalDamageBonus;

        let damage = baseWeaponDamage; 
        
        // --- NEW UNIFIED DAMAGE FORMULA ---
        const statMultiplier = 1 + statBonus / 20;
        const statFlatBonus = Math.floor(statBonus / 5); // <-- USES TOTAL BONUS

        damage = Math.floor(damage * statMultiplier);
        damage += statFlatBonus;
        // --- END NEW FORMULA ---

        let attackEffects = { element: this.weaponElement };


        // --- DRAGONBORN: Bloodline Attunement (Damage) ---
        if (this.race === 'Dragonborn') {
            const damageBonus = (this.level >= 20) ? 1.20 : 1.10;
            damage = Math.floor(damage * damageBonus);
        }

        // Critical Hit Calculation (Simplified)
        let critChance = this.critChance;
        const canWeaponCrit = weapon.class === 'Dagger' || weapon.effect?.critChance;

        // --- NEW: Ranger Mark crit enable ---
        if (target.isNpcMarked && target === this.npcAllyMarkedTarget) {
            const markBonusDamage = rollDice(1, 8, 'Ally Hunters Mark Bonus').total;
            damage += markBonusDamage;
            messageLog.push(`Hunter's Mark adds ${markBonusDamage} damage!`);
            // allowCrit = true; // This isn't defined here, but just enabling crit chance is fine
            critChance += 0.10; // Add 10% crit chance for marked
        }
        // --- END NEW ---

        if (canWeaponCrit || (target.isNpcMarked && target === this.npcAllyMarkedTarget)) { // Allow crit if marked
            if (weapon.class === 'Dagger') critChance += 0.1;
            if (weapon.effect?.critChance) critChance += weapon.effect.critChance;

            if (this.rollForEffect(critChance, 'Ally Attack Crit')) {
                let critMultiplier = weapon.effect?.critMultiplier || 1.5;
                damage = Math.floor(damage * critMultiplier);
                messageLog.push(`CRITICAL HIT!`);
            }
        }

        // Armor Pierce
        if (weapon.class === 'Thrusting Sword') attackEffects.armorPierce = 0.2;
        if (weapon.effect?.armorPierce) attackEffects.armorPierce = (attackEffects.armorPierce || 0) + weapon.effect.armorPierce;
        // --- END: Full Damage Calculation ---

        // Pass 'this' as the attacker
        const { damageDealt } = target.takeDamage(damage, attackEffects, this); 
        
        let logMessagesCombined = messageLog.join(' ');
        addToLog(`${this.name} attacks ${target.name} with ${weapon.name} for <span class="font-bold text-yellow-300">${damageDealt}</span> damage. ${logMessagesCombined}`);

        // --- Lifesteal (Copied from Parry) ---
        if (damageDealt > 0) {
            let lifestealAmount = 0;
            if (weapon.class === 'Reaper') lifestealAmount += damageDealt * 0.1;
            if (weapon.effect?.lifesteal) lifestealAmount += damageDealt * weapon.effect.lifesteal;
            if (lifestealAmount > 0 && target.speciesData.class !== 'Undead') {
                const healedAmount = Math.floor(lifestealAmount);
                if (healedAmount > 0) {
                    this.hp = Math.min(this.maxHp, this.hp + healedAmount);
                    addToLog(`${this.name} drains <span class="font-bold text-green-400">${healedAmount}</span> HP.`);
                }
            }
        }
        // --- End Lifesteal ---
        // --- NEW: Paladin Divine Smite ---
        if (this._classKey === 'paladin' && this.signatureAbilityToggleActive && damageDealt > 0) {
            const catalyst = this.equippedCatalyst;
            if (catalyst && catalyst.name !== 'None') {
                const smiteCost = 15;
                if (this.mp >= smiteCost) {
                    this.mp -= smiteCost;
                    
                    // Calculate smite damage (scales with catalyst spell_amp)
                    const baseDice = 2;
                    const maxDice = 6;
                    const spellAmp = catalyst.effect?.spell_amp || 0;
                    const smiteDiceCount = Math.min(maxDice, baseDice + spellAmp);
                    const smiteDamage = rollDice(smiteDiceCount, 8, `${this.name} Divine Smite`).total;

                    // Deconstruct the result object
                    const { damageDealt: finalSmiteDamage } = target.takeDamage(smiteDamage, { isMagic: true, element: 'light' });
                    addToLog(`${this.name}'s Divine Smite erupts, dealing an extra <span class="font-bold text-yellow-200">${finalSmiteDamage}</span> Light damage! (Cost: ${smiteCost} MP)`, 'text-yellow-100');
                    
                    if (!target.isAlive()) checkBattleStatus(true); // Check if smite killed
                } else {
                    addToLog(`${this.name} is too low on MP for Divine Smite.`, 'text-blue-400');
                }
            }
        }
        // --- END NEW ---
    }

    async moveTowards(target) {
        // 1. Root Check
        if (this.statusEffects.rooted) {
            addToLog(`${this.name} is rooted and cannot move!`, "text-yellow-500");
            return;
        }

        // 2. Determine Target
        let finalTarget = target;
        if (!finalTarget) {
            // Fallback logic if no specific target provided
            // (Used when called generally without a specific attack target)
            const enemies = currentEnemies.filter(e => e.isAlive());
            if (enemies.length > 0) {
                // Find closest
                let minDst = Infinity;
                enemies.forEach(e => {
                    const d = Math.abs(this.x - e.x) + Math.abs(this.y - e.y);
                    if (d < minDst) { minDst = d; finalTarget = e; }
                });
            }
        }

        if (!finalTarget) {
             addToLog(`${this.name} has no one to move towards!`);
             return; 
        }
        
        const isFlying = (this.race === 'Pinionfolk'); 
        
        // Base Movement
        let moveDistance = 3; 
        
        // Elf Passive
        if (this.race === 'Elf' && (!this.equippedArmor || !this.equippedArmor.metallic)) {
            moveDistance += (this.level >= 20 ? 2 : 1);
        }

        const path = findPath({x: this.x, y: this.y}, {x: finalTarget.x, y: finalTarget.y}, isFlying);

        if (path && path.length > 1) {
            // Crashing Wake (Slow)
            let speed = moveDistance;
            if (this.statusEffects.drenched && typeof player !== 'undefined' && player.isSkillActive('crashing_wake')) {
                 speed = Math.ceil(speed / 2);
            }

            const stepsToTake = Math.min(path.length - 1, speed);

            // Dynamic Speed Calculation (Faster if fewer enemies)
            const moveDelay = Math.max(50, 300 - (currentEnemies.length * 40)); 

            for (let i = 1; i <= stepsToTake; i++) {
                const nextStep = path[i];

                // Check Blockage (forEnemy = true because allies block each other like enemies do)
                if (isCellBlocked(nextStep.x, nextStep.y, true, isFlying)) {
                     addToLog(`${this.name} encounters an obstacle and stops.`);
                    break; 
                }

                // --- TRAP CHECK ---
                const trapIndex = gameState.gridObjects.findIndex(o => o.x === nextStep.x && o.y === nextStep.y && o.type === 'trap' && o.subtype === 'caltrops');
                
                if (trapIndex !== -1) {
                    const trap = gameState.gridObjects[trapIndex];
                    
                    // 1. Move to the trap tile
                    this.x = nextStep.x;
                    this.y = nextStep.y;
                    
                    // 2. Trigger Effect
                    const dmg = Math.max(1, Math.floor(this.maxHp * trap.damagePercent));
                    this.takeDamage(dmg, { ignore_defense: true });
                    addToLog(`${this.name} steps on Caltrops!`, "text-red-400");
                    
                    // 3. Remove Trap
                    gameState.gridObjects.splice(trapIndex, 1);
                    
                    // 4. Render & Stop
                    if (gameState.currentView === 'battle') renderBattleGrid();

                    if (typeof checkPortalEntry === 'function' && checkPortalEntry(this)) {
                        break; // Stop moving if teleported
                    }
                    break; // Stop moving
                }
                // ------------------

                const distanceAfterMove = Math.abs(nextStep.x - finalTarget.x) + Math.abs(nextStep.y - finalTarget.y);
                const weaponRange = this.equippedWeapon.range || 1;
                const catalystRange = this.equippedCatalyst.range || 3;

                this.x = nextStep.x;
                this.y = nextStep.y;
                if (gameState.currentView === 'battle') renderBattleGrid();
                
                // [INJECT HERE]
                updateTotemAuras(this);

                await new Promise(resolve => setTimeout(resolve, moveDelay));

                if (distanceAfterMove <= weaponRange || distanceAfterMove <= catalystRange) {
                    break; // In range, stop moving
                }
            }
        } else {
            addToLog(`${this.name} is blocked and cannot move!`);
        }
    }

    clearBattleBuffs() {
        const buffsToClear = [
            // Standard Buffs
            'buff_strength', 'buff_chaos_strength', 'buff_titan',
            'buff_defense', 'stonehide', 'buff_shroud', 'buff_voidwalker',
            'buff_haste', 'buff_hermes', 'buff_ion_self', 'buff_ion_other',
            'buff_magic_defense', 'buff_divine', 'buff_enrage',
            
            // --- NEW: Weapon Arts & Class Buffs ---
            'buff_final_horizon', 
            'buff_blazing_spear',
            'buff_sepulchral',
            'buff_crimson_penance',
            'buff_gore_howl',
            'buff_elemental_grease',
            'buff_whetstone', 
            'buff_magic_dust',
            'buff_unending_flow',
            'buff_blade_waltz',
            'buff_swiftness',
            'buff_keraunos_charge',

            // Debuffs & Status Effects
             'drenched', 'paralyzed', 'petrified', 'toxic', 'poison', 'swallowed',
             'bonus_crit', 'bonus_speed', 'bonus_range', 'alchemical_barrier',
             'magic_dampen', 'elemental_vuln', 'slowed', 'inaccurate',
             'clumsy', 'fumble', 'rooted',
             
             // --- NEW: Combat Debuffs & Marks ---
             'shredded', 'sundered', 'scorned', 'blinded', 'silenced',
             'mark', 'bow_mark', 'arcane_sigil', 'lingering_magma'
        ];

        let cleared = false;
        if (!this.statusEffects) this.statusEffects = {}; 
        for (const buffKey of buffsToClear) {
            if (this.statusEffects[buffKey]) {
                delete this.statusEffects[buffKey];
                cleared = true;
            }
        }
        
        // Reset Ally Specific Counters
        this.npcAllyMarkedTarget = null;
        
        if (cleared && !this.isFled) { 
            addToLog(`Temporary effects on ${this.name} wear off.`, "text-gray-400");
        }
    }

    // --- NEWLY ADDED METHOD TO FIX CRASH ---
    clearFoodBuffs() {
        // Check if foodBuffs exists and has keys
        if (this.foodBuffs && Object.keys(this.foodBuffs).length > 0) {
            this.foodBuffs = {};
            addToLog(`The effects of ${this.name}'s last meal have worn off.`, "text-gray-400");
            // Recalculate max HP/MP just in case (getters do this), then clamp
            this.hp = Math.min(this.hp, this.maxHp);
            this.mp = Math.min(this.mp, this.maxMp);
            // No updateStatsView() needed here, ally stats aren't in the main UI
        }
    }
    
    /**
     * Equips an item to the ally, handling 2-of-3 rule.
     * Returns the item key that was unequipped, if any.
     * @param {string} itemKey - The key of the item to equip.
     * @param {boolean} [silent=false] - If true, won't log messages (for init).
     * @returns {string|null} The key of the item that was auto-unequipped.
     */
    equipItem(itemKey, silent = false) {
        const details = getItemDetails(itemKey);
        if (!details) return null;

        let itemType = null;
        if (WEAPONS[itemKey]) itemType = 'weapon';
        else if (CATALYSTS[itemKey]) itemType = 'catalyst';
        else if (SHIELDS[itemKey]) itemType = 'shield';
        else if (ARMOR[itemKey]) itemType = 'armor';

        // 1. ARMOR
        if (itemType === 'armor') {
            if (this.equippedArmor.name === details.name) return;
            const oldItemKey = this.equippedArmor.name !== ARMOR['travelers_garb'].name ? findKeyByInstance(ARMOR, this.equippedArmor) : null;
            this.equippedArmor = details;
            
            // NPCs usually don't have separate enchantment storage, default to none or inherit
            // If you want NPCs to use enchantments, you'd need to add an 'enchantments' property to them.
            // For now, we assume standard gear.
            this.armorElement = 'none'; 
            
            if (!silent) addToLog(`${this.name} equipped: ${details.name}.`, 'text-blue-300');
            return oldItemKey;
        }

        // 2. WEAPONS / SHIELDS / CATALYSTS (The 2-of-3 Rule)
        if (itemType === 'weapon' || itemType === 'catalyst' || itemType === 'shield') {
            // Determine 2H status
            let isTwoHanded = details.class === 'Hand-to-Hand' || details.effect?.dualWield;
            if (isTwoHanded && details.class === 'Hand-to-Hand' && this.race === 'Beastkin') isTwoHanded = false;
            
            // Check for Titan's Grip (if NPC has skills)
            if (isTwoHanded && this.isSkillActive && this.isSkillActive('titans_grip') && this.skillToggles && this.skillToggles['iron_mountain']) {
                isTwoHanded = false;
            }

            // Simple Auto-Unequip Logic for NPCs
            // If equipping 2H, drop shield/catalyst
            if (isTwoHanded) {
                if (this.equippedShield.name !== SHIELDS['no_shield'].name) this.unequipItem('shield', silent);
                if (this.equippedCatalyst.name !== CATALYSTS['no_catalyst'].name) this.unequipItem('catalyst', silent);
            }

            // Check conflicts with existing gear
            let isEquippedWeaponTwoHanded = this.equippedWeapon?.class === 'Hand-to-Hand' || this.equippedWeapon?.effect?.dualWield;
             if (isEquippedWeaponTwoHanded && this.equippedWeapon?.class === 'Hand-to-Hand' && this.race === 'Beastkin') isEquippedWeaponTwoHanded = false;

            if ((itemType === 'shield' || itemType === 'catalyst') && isEquippedWeaponTwoHanded) {
                if (!silent) addToLog(`${this.name} cannot use a ${itemType} while wielding a 2H weapon.`, 'text-red-400');
                return null;
            }

            // Perform Equip
            if (itemType === 'weapon') {
                this.equippedWeapon = details;
                this.weaponElement = 'none'; // Default for NPC
            } 
            else if (itemType === 'catalyst') {
                this.equippedCatalyst = details;
            } 
            else if (itemType === 'shield') {
                if (this.equippedShield.name !== SHIELDS['no_shield'].name) this.unequipItem('shield', true);
                
                this.equippedShield = details;
                this.shieldElement = 'none';

                // [NEW] Movement Speed Effect Check (Rabbit's Foot Shield)
                if (details.effect && details.effect.movement_speed) {
                    // Initialize statusEffects if missing (safety check)
                    if (!this.statusEffects) this.statusEffects = {};
                    
                    this.statusEffects.bonus_speed = { move: details.effect.movement_speed, duration: Infinity, source: 'equipment' };
                    if (!silent) addToLog(`${this.name} moves faster!`, 'text-blue-300');
                }
            }
            
            if (!silent) addToLog(`${this.name} equipped: ${details.name}.`, 'text-blue-300');
            return true;
        }
        return null;
    }


    /**
     * Unequips an item from a specific slot.
     * Returns the key of the item that was unequipped.
     * @param {string} itemType - 'weapon', 'catalyst', 'armor', or 'shield'.
     * @param {boolean} [silent=false] - If true, won't log messages.
     * @returns {string|null} The key of the item that was unequipped.
     */
    unequipItem(itemType, silent = false) {
        let oldItemKey = null;
        let defaultItem = null;

        switch (itemType) {
            case 'weapon':
                if (this.equippedWeapon.name === WEAPONS['fists'].name) return null;
                oldItemKey = findKeyByInstance(WEAPONS, this.equippedWeapon);
                defaultItem = WEAPONS['fists'];
                if (!silent) addToLog(`${this.name} unequipped ${this.equippedWeapon.name}.`, 'text-gray-400');
                this.equippedWeapon = defaultItem;
                this.weaponElement = 'none';
                break;

            case 'catalyst':
                if (this.equippedCatalyst.name === CATALYSTS['no_catalyst'].name) return null;
                oldItemKey = findKeyByInstance(CATALYSTS, this.equippedCatalyst);
                defaultItem = CATALYSTS['no_catalyst'];
                if (!silent) addToLog(`${this.name} unequipped ${this.equippedCatalyst.name}.`, 'text-gray-400');
                this.equippedCatalyst = defaultItem;
                break;

            case 'armor':
                if (this.equippedArmor.name === ARMOR['travelers_garb'].name) return null;
                oldItemKey = findKeyByInstance(ARMOR, this.equippedArmor);
                defaultItem = ARMOR['travelers_garb'];
                if (!silent) addToLog(`${this.name} unequipped ${this.equippedArmor.name}.`, 'text-gray-400');
                this.equippedArmor = defaultItem;
                this.armorElement = 'none';
                break;

            case 'shield':
                if (this.equippedShield.name === SHIELDS['no_shield'].name) return null;
                oldItemKey = findKeyByInstance(SHIELDS, this.equippedShield);
                
                // [NEW] Remove Movement Speed Effect
                if (this.equippedShield.effect && this.equippedShield.effect.movement_speed) {
                    if (this.statusEffects && this.statusEffects.bonus_speed && this.statusEffects.bonus_speed.source === 'equipment') {
                        delete this.statusEffects.bonus_speed;
                    }
                }
                
                defaultItem = SHIELDS['no_shield'];
                if (!silent) addToLog(`${this.name} unequipped ${this.equippedShield.name}.`, 'text-gray-400');
                this.equippedShield = defaultItem;
                this.shieldElement = 'none';
                break;

            default:
                return null;
        }
        return oldItemKey;
    }
    
    // --- NEW AI ABILITY METHODS ---
    
    /**
     * Ally uses an item from their own inventory. (Simplified)
     * @param {string} itemKey - The key of the item to use.
     * @returns {boolean} True if the item was successfully used.
     */
    useItem(itemKey) {
        const target = this; // <--- ADD THIS LINE
        const details = getItemDetails(itemKey);
        if (!details || !this.inventory.items[itemKey] || this.inventory.items[itemKey] <= 0) {
            addToLog(`${this.name} tried to use ${itemKey}, but had none!`, 'text-red-400');
            return false;
        }

        // Consume item
        this.inventory.items[itemKey]--;
        if (this.inventory.items[itemKey] <= 0) {
            delete this.inventory.items[itemKey];
        }

        addToLog(`${this.name} used a <span class="font-bold text-green-300">${details.name}</span>!`);

        // Apply effect (self-target only for now)
        let boostMult = 1.0;
        let durationMult = 1.0;
        if (player.isSkillActive('iron_stomach')) {
            boostMult = 1.25;
            durationMult = 1.25;
        }
        // ----------------------------------
// --- NEW: Apothecary's Compendium (Potency) ---
        if (player.isSkillActive('apothecary_wisdom')) {
            // Stacks with Iron Stomach. (e.g., 1.25 * 1.25 = ~1.56x)
            boostMult *= 1.25; 
        }
        // ----------------------------------------------

        if (details.type === 'healing') {
            const healAmount = Math.floor(details.amount * boostMult);
            target.hp = Math.min(target.maxHp, target.hp + healAmount); 
            addToLog(`${this.name} recovers <span class="font-bold text-green-400">${healAmount}</span> HP.`, 'text-green-300');
        } else if (details.type === 'mana_restore') {
            const restoreAmount = Math.floor(details.amount * boostMult);
            this.mp = Math.min(this.maxMp, this.mp + restoreAmount);
            addToLog(`${this.name} restores <span class="font-bold text-blue-400">${restoreAmount}</span> MP.`, 'text-blue-300');
        } else if (details.type === 'buff' && details.effect) {
             const buffData = { ...details.effect };
             if (buffData.duration && buffData.duration !== Infinity) {
                 buffData.duration = Math.ceil(buffData.duration * durationMult); // Boosted Duration
             }
             target.statusEffects[details.effect.type] = buffData;
             addToLog(`${this.name} feels the effects of the ${details.name}!`, 'text-yellow-300');
        }
        // ... (can add cleanse logic later if needed)
        
        renderBattleGrid(); // Update HP/MP bars
        return true;
    }
    
    /**
     * Ally casts a spell. (Simplified, offensive only)
     * @param {string} spellKey - The key of the spell to cast.
     * @param {Enemy} target - The enemy to target.
     * @returns {boolean} True if the spell was successfully cast.
     */
    async castSpell(spellKey, target) {
        if (!target) return false;
        
        const spellData = SPELLS[spellKey];
        const allySpell = this.spells[spellKey];
        if (!spellData || !allySpell) return false;
        
        const tierIndex = allySpell.tier - 1;
        const spell = spellData.tiers[tierIndex];
        
        const catalyst = this.equippedCatalyst;
        if (!catalyst || catalyst.name === 'None') {
            addToLog(`${this.name} needs a catalyst to cast spells.`, 'text-red-400');
            return false;
        }
        
        // Cost calculation
        let finalSpellCost = spell.cost;
        if (catalyst.effect?.mana_discount) {
            finalSpellCost = Math.max(1, finalSpellCost - catalyst.effect.mana_discount);
        }
        if (this.equippedArmor?.effect?.mana_discount_flat) {
            finalSpellCost = Math.max(1, finalSpellCost - this.equippedArmor.effect.mana_discount_flat);
        }
        
        if (this.mp < finalSpellCost) {
            addToLog(`${this.name} tried to cast ${spell.name}, but lacked MP!`, 'text-blue-400');
            return false;
        }
        
        this.mp -= finalSpellCost;
        addToLog(`${this.name} casts <span class="font-bold text-purple-300">${spell.name}</span>!`);

        // --- HEALING LOGIC ---
        if (spellData.element === 'healing') {
            let diceCount = spell.damage[0];
            
            // Add Catalyst Amp
            diceCount += (catalyst.effect?.spell_amp || 0);
            // Add Armor Amp
            diceCount += (this.equippedArmor?.effect?.spell_amp || 0);

            diceCount = Math.min(spell.cap, diceCount);

            let baseHeal = rollDice(diceCount, spell.damage[1], `Ally Heal: ${spell.name}`).total;
            
            const statBonus = this.magicalDamageBonus;
            const statMultiplier = 1 + statBonus / 20;
            const statFlatBonus = Math.floor(statBonus / 5);
            
            let healAmount = Math.floor(baseHeal * statMultiplier) + statFlatBonus;

            if (this.race === 'Elementals' && spellData.element === this.elementalAffinity) {
                const damageBonus = (this.level >= 20) ? 1.20 : 1.10;
                healAmount = Math.floor(healAmount * damageBonus);
                if (this.level >= 20) {
                    let extraDieRoll = rollDice(1, spell.damage[1], 'Elemental Evo Die').total;
                    healAmount += Math.min(spell.cap * spell.damage[1], extraDieRoll);
                }
            } else if (this.race === 'Dragonborn') {
                const damageBonus = (this.level >= 20) ? 1.20 : 1.10;
                healAmount = Math.floor(healAmount * damageBonus);
            }

            target.hp = Math.min(target.maxHp, target.hp + healAmount);
            const targetName = (target === player) ? "you" : target.name;
            addToLog(`${this.name} heals ${targetName} for <span class="font-bold text-green-400">${healAmount}</span> HP.`, 'text-green-300');
            
            if (target === player) updateStatsView();
            else renderBattleGrid();
            
            return true;
        }

        // --- OFFENSIVE LOGIC ---
        if (!target.isAlive()) return false;

        // Dice Calculation
        let diceCount = spell.damage[0];
        
        diceCount += (catalyst.effect?.spell_amp || 0);
        diceCount += (this.equippedArmor?.effect?.spell_amp || 0);
        
        diceCount = Math.min(spell.cap, diceCount);
        
        let baseDamage = rollDice(diceCount, spell.damage[1], `${this.name} Spell`).total;
        
        const statBonus = this.magicalDamageBonus;
        const statMultiplier = 1 + statBonus / 20;
        const statFlatBonus = Math.floor(statBonus / 5);

        let damage = Math.floor(baseDamage * statMultiplier) + statFlatBonus;
        
        if (this.race === 'Dragonborn') {
            const damageBonus = (this.level >= 20) ? 1.20 : 1.10;
            damage = Math.floor(damage * damageBonus);
        }        

        const spellCritChance = this.critChance + (catalyst.effect?.spell_crit_chance || 0);
        if (Math.random() < spellCritChance) {
            const critMultiplier = catalyst.effect?.spell_crit_multiplier || 1.5;
            damage = Math.floor(damage * critMultiplier);
            addToLog(`A critical spell!`, 'text-yellow-300');
        }
        
        const spellEffects = {
            isMagic: true,
            element: spellData.element,
            spell_penetration: catalyst.effect?.spell_penetration || 0
        };
        
        // --- VOID BYPASS CHECK (NERFED) ---
        // Base Chance: 20% + 5% per Spell Tier
        const voidBypassChance = 0.20 + (tierIndex * 0.05);
        if (spellData.element === 'void' && this.rollForEffect(voidBypassChance, 'Spell Void Bypass')) {
            // [CHANGED] From true (100%) to 0.20 (20%)
            spellEffects.ignore_defense = 0.20;
            addToLog(`${this.name}'s void spell distorts reality! (Ignores 20% Def)`, 'text-purple-500');
        }
        const { damageDealt } = target.takeDamage(damage, spellEffects, this);
        addToLog(`It hits ${target.name} for <span class="font-bold text-purple-400">${damageDealt}</span> ${spellData.element} damage.`);
        
        // Secondary Effects Logic
        if (damageDealt > 0 && target.isAlive()) {
            const rarityMap = { 'Broken': 0, 'Common': 1, 'Uncommon': 2, 'Rare': 3, 'Epic': 4, 'Legendary': 5 };
            const catalystRarity = this.equippedCatalyst.rarity || 'Common';
            const tierIndexCatalyst = rarityMap[catalystRarity] || 1;

            switch (spellData.element) {
                case 'water':
                    addToLog(`The water attack leaves ${target.name} drenched! (-1 Move, -25% Dmg)`, 'text-blue-400');
                    applyStatusEffect(target, 'drenched', { duration: 3, move: -1, multiplier: 0.75 }, this.name);
                    break;
                case 'earth':
                    const earthParalyzeChance = 0.10 + (tierIndexCatalyst * 0.05);
                    if (this.rollForEffect(earthParalyzeChance, 'Ally Spell Earth Paralyze')) {
                        if (!target.statusEffects.paralyzed) {
                            applyStatusEffect(target, 'paralyzed', { duration: 2 }, this.name);
                            addToLog(`${target.name} is paralyzed by the blow!`, 'text-yellow-500');
                        }
                    }
                    break;
                case 'wind':
                    if (typeof applyKnockback === 'function') {
                         applyKnockback(target, this, 1); // Helper from battle.js
                         addToLog(`${target.name} is blasted back by the gale!`, 'text-cyan-400');
                    }
                    break;
                case 'nature':
                    const allySpellTierIndex = (this.spells[spellKey] ? this.spells[spellKey].tier : 1) - 1;
                    const allyNatureLifestealPercent = 0.10 + (allySpellTierIndex * 0.05);
                    const lifestealAmount = Math.floor(damageDealt * allyNatureLifestealPercent);
                    if (lifestealAmount > 0) {
                        this.hp = Math.min(this.maxHp, this.hp + lifestealAmount);
                        addToLog(`${this.name} drains <span class="font-bold text-green-400">${lifestealAmount}</span> HP.`, 'text-green-300');
                    }
                    break;
                case 'light':
                    const lightCleanseChance = 0.20 + (tierIndexCatalyst * 0.05);
                    if (this.rollForEffect(lightCleanseChance, 'Ally Spell Light Cleanse')) {
                        const debuffs = Object.keys(this.statusEffects).filter(key => ['poison', 'paralyzed', 'petrified', 'drenched', 'toxic'].includes(key));
                        if (debuffs.length > 0) {
                            const effectToCleanse = debuffs[0];
                            delete this.statusEffects[effectToCleanse];
                            addToLog(`${this.name}'s spell's light energy cleanses them of ${effectToCleanse}!`, 'text-yellow-200');
                        }
                    }
                    break;
            }
        }

        renderBattleGrid();
        return true;
    }
    // --- END NEW AI METHODS ---
}

class Enemy extends Entity {
    constructor(speciesData, rarityData, playerLevel, elementData = { key: 'none', adjective: '' }) {
        const statMultiplier = rarityData.multiplier;
        const rewardMultiplier = rarityData.rewardMultiplier || rarityData.multiplier;

        const finalHp = Math.floor((speciesData.base_hp + (playerLevel * 1.5)) * statMultiplier);
        const finalStrength = Math.floor((speciesData.base_strength + Math.floor(playerLevel / 2)) * statMultiplier);

        // --- NEW DEFENSE FORMULA (FLAT) ---
        // Formula: Base Species Defense + Player Level
        const finalDefense = (speciesData.base_defense || 0) + playerLevel;

        // --- NEW MITIGATION FORMULA (PERCENT) ---
        // Bosses are capped at 60% elsewhere or handled via rarity override if needed
        let mitigationPercent = 0.10;
        switch (rarityData.key) {
            case 'common': mitigationPercent = 0.10; break;
            case 'uncommon': mitigationPercent = 0.20; break;
            case 'rare': mitigationPercent = 0.30; break;
            case 'epic': mitigationPercent = 0.40; break;
            case 'legendary': mitigationPercent = 0.50; break;
            default: mitigationPercent = 0.10;
        }

        const rarityName = speciesData.rarityNames?.[rarityData.key] || speciesData.name; 
        const name = elementData.key !== 'none' ? `${elementData.adjective} ${rarityName}` : rarityName; 

        super(name);
        this.x = 0;
        this.y = 0;
        this.hp = finalHp;
        this.maxHp = finalHp;
        this.strength = finalStrength;

        const classDamage = MONSTER_CLASS_DAMAGE[speciesData.class];
        const tier = speciesData.tier;
        const rarityIndex = rarityData.rarityIndex;

        let diceCount = Math.floor(1 + tier * 0.5 + rarityIndex * 0.5 + classDamage.baseDice * 0.5);
        this.damage = [Math.max(1, diceCount), classDamage.dieSides];

        this.defense = finalDefense;
        this.mitigation = mitigationPercent;
        this.ability = speciesData.ability;
        this.element = elementData.key;
        this.range = speciesData.range || 1;
        this.movement = speciesData.movement || { speed: 2, type: 'ground' };
        this.xpReward = Math.floor(speciesData.base_xp * rewardMultiplier * (speciesData.class === 'Monstrosity' ? 1.2 : 1));
        this.goldReward = Math.floor(speciesData.base_gold * rewardMultiplier * (speciesData.class === 'Monstrosity' ? 1.2 : 1));
        this.lootTable = {...speciesData.loot_table};

        // Loot Modifiers
        this.lootChanceMod = (speciesData.class === 'Beast' ? 1.5 : 1);
        this.potionDropChanceMod = (speciesData.class === 'Humanoid' ? 1.5 : 1);
        for (const itemKey in this.lootTable) {
            const itemDetails = getItemDetails(itemKey);
            if (itemDetails) {
                 if (['health_potion', 'mana_potion', 'condensed_health_potion', 'condensed_mana_potion', 'superior_health_potion', 'superior_mana_potion'].includes(itemKey)) {
                    this.lootTable[itemKey] *= this.potionDropChanceMod;
                 } else {
                     this.lootTable[itemKey] *= this.lootChanceMod;
                 }
            }
        }

        this.speciesData = speciesData;
        this.rarityData = rarityData;

        if (this.element !== 'none') {
            const essenceKey = `${this.element}_essence`;
            if (ITEMS[essenceKey]) {
                this.lootTable[essenceKey] = (this.lootTable[essenceKey] || 0) + 0.3 + (rarityIndex * 0.05);
            }
        }
        
        this.hasDealtDamageThisEncounter = false;
        this.isNpcMarked = false;
        this.hasShatteredThisTurn = false; // For Crystalline Fracture

        if (this.speciesData.class === 'Undead') {
            this.revived = false;
        }
        
        // Ability Flags
        if (this.ability === 'enrage') this.enrageUsed = false;
        if (this.ability === 'necromancy') { this.summonedAt50 = false; this.summonedAt10 = false; }
        if (this.ability === 'ultra_focus') this.ultraFocusTurns = 0;
        if (this.ability === 'alive_again') this.reviveChance = 1.0;
    }

    rollForEffect(baseChance, debugPurpose = "Unknown Effect") {
        if (logChanceCalculations) {
            addToLog(`DEBUG (Chance) [ENEMY: ${this.name} - ${debugPurpose}]: Base Chance = ${(baseChance * 100).toFixed(1)}%`, 'text-gray-500');
        }
        if (baseChance <= 0) return false;
        if (baseChance >= 1) return true;

        let roll = Math.random();
        if (roll < baseChance) return true;
        return false;
    }

    async attack(playerTarget = null) {
        this.attackParried = false; 
        this.hasDealtDamageThisEncounter = true;

        const ally = player.npcAlly;
        const allyIsValid = ally && ally.hp > 0 && !ally.isFled && ally.x !== -1;

        const weaponRange = this.range || 1;
        const playerDist = Math.abs(this.x - player.x) + Math.abs(this.y - player.y);
        const allyDist = allyIsValid ? (Math.abs(this.x - ally.x) + Math.abs(this.y - ally.y)) : Infinity;

        // --- Ghost Walk / Assassin's Gambit Check ---
        let playerIsHidden = false;
        if (player.skillToggles && player.skillToggles['assassins_gambit']) {
            if (playerDist > 1 && player.mp >= 10) { // Only visible if adjacent
                playerIsHidden = true;
            }
        }

        const playerInRange = !playerIsHidden && (playerDist <= weaponRange);
        const allyInRange = allyIsValid && (allyDist <= weaponRange);

        let target = null;
        let moveTarget = null;

        // AI Targeting Priority
        if (playerInRange && allyInRange) {
            // 1. Weakest HP %
            const playerHP_Percent = player.hp / player.maxHp;
            const allyHP_Percent = ally.hp / ally.maxHp;

            if (playerHP_Percent < allyHP_Percent) target = player;
            else if (allyHP_Percent < playerHP_Percent) target = ally;
            else {
                // 2. Weakest Defense
                const isMagic = this.speciesData.damage_type === 'magical' || (this.speciesData.damage_type === 'hybrid' && player.magicalDefense < player.physicalDefense);
                const playerDef = isMagic ? player.magicalDefense : player.physicalDefense;
                const allyDef = isMagic ? ally.magicalDefense : ally.physicalDefense;

                if (allyDef < playerDef) target = ally;
                else if (playerDef < allyDef) target = player;
                else target = (allyDist < playerDist) ? ally : player; // 3. Closest
            }
        } else if (playerInRange) {
            target = player;
        } else if (allyInRange) {
            target = ally;
        } else {
            // Movement Logic
            if (playerIsHidden) {
                if (allyIsValid) moveTarget = ally;
                else moveTarget = null;
            } else {
                 moveTarget = (allyDist < playerDist) ? ally : player;
            }
        }
        
        // Execute
        const abilityTarget = target || moveTarget;
        
        if (!target && !moveTarget && playerIsHidden && !allyIsValid) {
            addToLog(`${this.name} searches for a target but sees nothing...`, "text-gray-500");
            return; 
        }

        if (abilityTarget) {
            if (await this._tryUseAbility(abilityTarget)) {
                return; // Ability used, turn ends
            }
        }

        if (target) {
            addToLog(`${this.name} attacks ${target.name}!`);
            this._performAttack(target); 

            if (this.attackParried) return;

            // Double Strike
            if (this.ability === 'double_strike' && Math.random() < 0.33) {
                addToLog(`${this.name}'s fury lets it attack again!`, 'text-red-500 font-bold');
                setTimeout(() => {
                     if (gameState.battleEnded || !target.isAlive() || !this.isAlive()) return;
                    this._performAttack(target); 
                    if (!gameState.battleEnded) checkBattleStatus(true);
                }, 500);
            }
        } else if (moveTarget) {
            await this.moveTowards(moveTarget);
        } else {
            addToLog(`${this.name} looks around confused.`);
        }
    }

    _performAttack(target) {
        this.attackParried = false;

        // [Safe Jolting Check]
        if (this.statusEffects.jolted) {
            const joltDmg = this.statusEffects.jolted.damageSnapshot || 0;
            if (joltDmg > 0) {
                const res = this.takeDamage(joltDmg, { element: 'lightning', ignore_defense: true });
                addToLog(`${this.name} discharges static electricity! (${res.damageDealt || 0} dmg)`, 'text-yellow-300 font-bold');
                delete this.statusEffects.jolted; 
                if (!this.isAlive()) return;
            }
        }

        const calcLog = { source: `${this.name} Attack`, targetName: target.name, steps: [] };

        // 1. Ranged Advantage
        const catalyst = player.equippedCatalyst;
        if (catalyst && catalyst.effect?.ranged_chance && player.rollForEffect(catalyst.effect.ranged_chance, 'Ranged Advantage') && this.range <= 1) {
            addToLog(`The ${this.name} misses due to your ranged advantage!`, 'text-blue-300');
            this.attackParried = true; 
            return;
        }

        // 2. Base Damage (Safe Access)
        // Default to [1, 4] if damage array is missing
        let damageArr = this.damage || [1, 4]; 
        let diceCount = damageArr[0] || 1;
        let diceSides = damageArr[1] || 4;
        
        if (this.statusEffects.enrage) { diceCount++; calcLog.steps.push({ description: "Enrage", value: "+1 Dice", result: "" }); }
        
        let rollResult = rollDice(diceCount, diceSides, `${this.name} Attack`);
        let totalDamage = rollResult.total || 0;
        calcLog.baseDamage = totalDamage;
        calcLog.steps.push({ description: "Base Roll", value: rollResult.rolls.join('+'), result: totalDamage });

        // 3. Crit Immunity
        let targetHasCritImmunity = false;
        if (target === player && player.hasSkill('impenetrable_alloy') && player.equippedArmor && player.equippedArmor.metallic) {
            targetHasCritImmunity = true;
        }

        // 4. Scaling (Safe Access)
        const statBonus = (typeof getCharacterStat === 'function') ? getCharacterStat(this, 'strength') : (this.strength || 0);
        const statMultiplier = 1 + (statBonus / 20);
        
        totalDamage = Math.floor(totalDamage * statMultiplier);
        totalDamage += Math.floor(statBonus / 5);
        calcLog.steps.push({ description: "Stat Scaling", value: `Str ${statBonus}`, result: totalDamage });

        // 5. Critical Hit
        const rarityData = this.rarityData || { critChance: 0, rarityIndex: 0 };
        const critChance = rarityData.critChance || 0;
        
        if (!targetHasCritImmunity && this.rollForEffect(critChance, 'Enemy Crit')) {
            totalDamage = Math.floor(totalDamage * 2);
            addToLog(`${this.name} lands a <span class="text-red-500 font-bold text-lg">CRITICAL HIT!</span>`, 'text-red-500');
            calcLog.steps.push({ description: "CRITICAL HIT", value: "x2", result: totalDamage });
        } else if (targetHasCritImmunity && this.rollForEffect(critChance, 'Enemy Crit Check')) {
            addToLog("The enemy strikes a critical spot, but your armor holds!", "text-gray-400");
            calcLog.steps.push({ description: "Crit Negated", value: "Immune", result: totalDamage });
        }

        // 6. Modifiers
        if (this.statusEffects.drenched) {
            const mult = this.statusEffects.drenched.multiplier || 0.75;
            totalDamage = Math.floor(totalDamage * mult);
            calcLog.steps.push({ description: "Drenched", value: `x${mult}`, result: totalDamage });
        }
        if (target.statusEffects.swallowed && target.statusEffects.swallowed.source === this) {
            totalDamage *= 2;
            calcLog.steps.push({ description: "Swallow Amp", value: "x2", result: totalDamage });
        }

        // 7. Attack Type
        let attackOptions = { isMagic: false };
        const speciesData = this.speciesData || {};
        if (speciesData.damage_type === 'magical') attackOptions.isMagic = true;
        else if (speciesData.damage_type === 'hybrid') {
            const pDef = target.physicalDefense || target.defense || 0;
            const mDef = target.magicalDefense || target.defense || 0;
            attackOptions.isMagic = (mDef < pDef);
            addToLog(`${this.name} targets your weaker ${attackOptions.isMagic ? 'magical' : 'physical'} defense!`, 'text-yellow-300');
        }

        // 8. Player Debuffs
        if(player.statusEffects.inaccurate && player.rollForEffect(0.2, 'Inaccurate Debuff')) { 
             addToLog(`${this.name}'s attack misses!`, 'text-gray-400');
             this.attackParried = true; return;
        }

        // 9. Void Bypass
        const rarityIndex = rarityData.rarityIndex || 0;
        let voidBypassChance = 0.20 + (Math.max(0, rarityIndex - 1) * 0.05); 
        if (player.hasSkill('darkness_contract') && typeof isElementalStateActive === 'function' && isElementalStateActive('void')) voidBypassChance *= 0.8;

        if (this.element === 'void' && this.rollForEffect(voidBypassChance, 'Enemy Void Bypass')) {
            attackOptions.ignore_defense = 0.20; 
            calcLog.steps.push({ description: "Void Distortion", value: "Ignore 20% Def", result: "" });
        }

        // 10. Ultra Focus
        const ignoreDefense = !!this.statusEffects.ultra_focus || attackOptions.ignore_defense; 
        if (ignoreDefense && !attackOptions.ignore_defense) { 
            this.ultraFocusTurns--; 
            if (this.ultraFocusTurns <= 0) { delete this.statusEffects.ultra_focus; }
            calcLog.steps.push({ description: "Ultra Focus", value: "True Damage", result: "" });
        }

        let finalElement = this.element || 'physical';
        if (this.statusEffects.essence_devoured) finalElement = 'none'; 

        const damageOptions = { 
            ignore_defense: ignoreDefense, 
            attacker: this, 
            isMagic: attackOptions.isMagic,
            element: finalElement, 
            armorPierce: attackOptions.armorPierce
        };

        // --- EXECUTE HIT ---
        calcLog.steps.push({ description: "=== DEFENSE ===", value: "", result: "" });
        
        // Safety call
        const damageResult = target.takeDamage(totalDamage, damageOptions); 
        
        // Ensure damageDealt is a number to prevent NaN
        let damageDealt = (typeof damageResult.damageDealt === 'number' && !isNaN(damageResult.damageDealt)) ? damageResult.damageDealt : 0;

        // [CRITICAL LOGIC] Merge Steps from Player.takeDamage
        if (damageResult.defenseSteps) {
            calcLog.steps = calcLog.steps.concat(damageResult.defenseSteps);
        }
        
        calcLog.finalDamage = damageDealt;
        
        if (typeof logDamageCalculation === 'function') {
            logDamageCalculation(calcLog);
        }

        if (this.attackParried) return;

        // 11. On-Hit Effects (Safe Maths)
        if (damageDealt > 0 && !attackOptions.ignore_defense) {
            // Jolting Pressure (Applied to Attacker if Defender has skill)
            // Note: The logic for applying Jolted to self (Attacker) if Defender has skill is tricky.
            // Usually, the defender (Player) applies it inside takeDamage.
            // But if the Attacker (Enemy) strikes with Lightning, and Player has Jolted...
            // Logic in takeDamage handles 'Jolting Pressure' application.
            
            if (finalElement === 'water') {
                addToLog(`The water attack leaves ${target.name} drenched!`, 'text-blue-400');
                applyStatusEffect(target, 'drenched', { duration: 3, move: -1, multiplier: 0.75 }, this.name);
            }
            if (finalElement === 'nature') {
                const naturePct = 0.10 + (Math.max(0, rarityIndex - 1) * 0.02); 
                let lifesteal = Math.floor(damageDealt * naturePct);
                if (target === player && player.hasSkill('necrotic_ascension')) lifesteal = 0;
                
                if (lifesteal > 0) {
                    this.hp = Math.min(this.maxHp, this.hp + lifesteal);
                    addToLog(`${this.name} drains <span class="font-bold text-green-400">${lifesteal}</span> HP.`, 'text-green-300');
                    if(gameState.currentView === 'battle') renderBattleGrid(); 
                }
            }
            // Add other elements as needed, ensuring variables exist
        }

        // Ability Checks
        if (this.ability === 'life_drain' && damageDealt > 0) {
            let drain = Math.floor(damageDealt / 2);
            if (target === player && player.hasSkill('necrotic_ascension')) drain = 0;
            if (drain > 0) {
                this.hp = Math.min(this.maxHp, this.hp + drain);
                addToLog(`${this.name} drains <span class="font-bold text-green-400">${drain}</span> HP!`);
            }
        }
    }

    _applyAndLogDamage(finalDamage, unusedDefense, attacker, isMagicAttack, suppressLog = false) {
        // 1. Actually Subtract HP
        this.hp -= finalDamage;
        if (this.hp < 0) this.hp = 0;

        // 2. Log to Console/Battle Log (ONLY if not suppressed)
        if (!suppressLog) {
            let damageType = '';
            if (attacker && attacker.element && attacker.element !== 'none') {
                damageType = ` ${ELEMENTS[attacker.element].name}`;
            } else if (isMagicAttack) {
                damageType = ' magical';
            }
            
            addToLog(`${this.name} takes <span class="font-bold text-red-400">${finalDamage}</span>${damageType} damage.`);
        }
        
        return finalDamage;
    }

    takeDamage(damage, options = {}, source = null) {
        const defenseSteps = []; 

        // --- 0. CALCULATE PENETRATION (Unified) ---
        // Combine boolean check and percentage values
        let penetration = 0;
        if (options.ignore_defense === true) {
            penetration = 1.0; // True Damage
        } else if (typeof options.ignore_defense === 'number') {
            penetration = options.ignore_defense;
        }
        
        // Add specific Armor Pierce (if stacked)
        if (options.armorPierce) {
            penetration += options.armorPierce;
        }
        
        // Cap at 100%
        penetration = Math.min(1.0, Math.max(0, penetration));

        // --- 1. FROZEN STATUS HANDLING ---
        if (this.statusEffects.frozen) {
            if (options.element === 'fire') {
                delete this.statusEffects.frozen;
                addToLog(`${this.name}'s frozen prison melts instantly!`, "text-orange-400");
            } else if (Math.random() < 0.20) {
                delete this.statusEffects.frozen;
                addToLog(`The ice shattering around ${this.name} breaks!`, "text-cyan-300");
            }
        }

        // --- 2. VULNERABILITIES (Damage Amplification) ---
        // Saponified Vulnerability
        if (this.statusEffects.saponified) {
            if (options.element === 'water' || options.element === 'lightning') {
                damage = Math.floor(damage * 1.25);
                defenseSteps.push({ description: "Saponified Vuln", value: "x1.25", result: damage });
            }
        }

        // Fulgurbloom Vulnerability
        if (this.statusEffects.conductive_pollen && options.element === 'lightning') {
            const amount = this.statusEffects.conductive_pollen.elemental_vuln?.amount || 0.25;
            damage = Math.floor(damage * (1 + amount));
            defenseSteps.push({ description: "Conductive Pollen", value: `x${(1+amount).toFixed(2)}`, result: damage });
        }
        
        // Enrage Vulnerability
        if (this.statusEffects.enrage) {
            damage = Math.floor(damage * 2.0);
            addToLog(`${this.name} takes extra damage (Enraged)!`, 'text-red-500');
            defenseSteps.push({ description: "Enraged", value: "x2.0", result: damage });
        }

        // --- 3. DEFENSE CALCULATION ---
        let currentFlatDefense = this.defense;
        let currentMitigation = this.mitigation;
        if (this.isBoss) currentMitigation = 0.60;

        // --- A. APPLY STATUS MODIFIERS TO ARMOR (Before Pierce) ---
        
        // Living Shield (Buff)
        if (this.statusEffects.living_shield) { 
            currentFlatDefense *= 2.0; 
            defenseSteps.push({ description: "Living Shield", value: "2x Armor", result: "" }); 
        }

        // Sundered (Longsword Art: Sundering Hew)
        if (this.statusEffects.sundered) {
            currentFlatDefense = Math.floor(currentFlatDefense * this.statusEffects.sundered.multiplier);
            defenseSteps.push({ description: "Sundered", value: `x${this.statusEffects.sundered.multiplier}`, result: "" });
        }

        // Shredded (Axe Passive: Hewing Strikes)
        if (this.statusEffects.shredded) {
            const mult = this.statusEffects.shredded.defenseMult || 1.0;
            currentFlatDefense = Math.floor(currentFlatDefense * mult);
            defenseSteps.push({ description: "Shredded", value: `x${mult.toFixed(2)}`, result: "" });
        }

        // Scorned (Longsword Art: Jokers Jest)
        if (this.statusEffects.scorned) {
            const mult = this.statusEffects.scorned.defMult || 0.8;
            currentFlatDefense = Math.floor(currentFlatDefense * mult);
            defenseSteps.push({ description: "Scorned", value: `x${mult}`, result: "" });
        }
        
        // Void Erosion
        if (this.statusEffects.void_erosion) {
            const erosionStacks = this.statusEffects.void_erosion.stacks || 1;
            const erosionMult = 1.0 - (erosionStacks * 0.05); 
            currentFlatDefense = Math.floor(currentFlatDefense * erosionMult);
            defenseSteps.push({ description: `Void Erosion (x${erosionStacks})`, value: `-${(erosionStacks*5)}% Armor`, result: "" });
        }

        // --- B. APPLY UNIFIED PIERCE TO FLAT DEFENSE ---
        if (penetration > 0 && currentFlatDefense > 0) {
            const ignoredVal = Math.floor(currentFlatDefense * penetration);
            currentFlatDefense -= ignoredVal;
            
            if (penetration >= 1.0) {
                defenseSteps.push({ description: "True Damage", value: "Ignore Armor", result: "" });
            } else {
                defenseSteps.push({ description: "Pierce", value: `-${ignoredVal} Def`, result: "" });
            }
        }

        // --- C. OTHER CALCULATIONS ---

        // Magic Penetration (Specific to Magic, subtracts from Mitigation directly)
        if (options.isMagic && options.spell_penetration) {
             currentMitigation = Math.max(0, currentMitigation - options.spell_penetration);
             defenseSteps.push({ description: "Spell Pen", value: `-${(options.spell_penetration*100).toFixed(0)}% Mit`, result: "" });
        } 
        
        // Arcane Sigil (Damage Amp)
        if (this.statusEffects.arcane_sigil && (options.isMagic || options.element)) {
            damage = Math.floor(damage * this.statusEffects.arcane_sigil.multiplier);
            defenseSteps.push({ description: "Arcane Sigil", value: `x${this.statusEffects.arcane_sigil.multiplier}`, result: damage });
        }
        
        // Frostbite (Damage Amp)
        if (this.statusEffects.frostbite) {
            const stacks = this.statusEffects.frostbite.stacks || 1;
            const multiplier = 1 + (stacks * 0.05); 
            damage = Math.floor(damage * multiplier);
            defenseSteps.push({ description: `Frostbite (x${stacks})`, value: `x${multiplier.toFixed(2)}`, result: damage });
        }

        // --- D. ELEMENTAL CALCULATIONS ---
        if (options.element && this.element !== 'none') {
            let modifier = calculateElementalModifier(options.element, this.element);
            
            // Essence Devoured: Strip Resistances
            if (this.statusEffects.essence_devoured && modifier < 1.0) {
                modifier = 1.0; 
                addToLog("Essence Devoured negates the resistance!", "text-purple-400 text-xs");
            }

            if (modifier !== 1.0) {
                damage = Math.floor(damage * modifier);
                const msg = modifier > 1 ? "Super effective!" : "Not very effective...";
                const color = modifier > 1 ? 'text-green-400' : 'text-red-500';
                addToLog(msg, color);
                defenseSteps.push({ description: `Element Match`, value: `x${modifier}`, result: damage });
            }
        }

        // --- E. APPLY FLAT DEFENSE ---
        let reducedDamage = Math.max(1, damage - Math.floor(currentFlatDefense));
        if (currentFlatDefense > 0) {
            defenseSteps.push({ description: "Armor", value: `-${Math.floor(currentFlatDefense)}`, result: reducedDamage });
        }
        
        // --- F. APPLY UNIFIED PIERCE TO MITIGATION ---
        // If penetration is 50%, a 20% resistance becomes 10%
        if (penetration > 0 && currentMitigation > 0) {
            currentMitigation = currentMitigation * (1.0 - penetration);
        }

        // --- G. APPLY PERCENTAGE MITIGATION ---
        if (currentMitigation !== 0) {
             // Cap negative resistance (Vulnerability) at -100% and positive at 95%
             currentMitigation = Math.max(-1.0, Math.min(0.95, currentMitigation));
             reducedDamage = Math.floor(reducedDamage * (1 - currentMitigation));
             defenseSteps.push({ description: `Mitigation`, value: `-${(currentMitigation*100).toFixed(0)}%`, result: reducedDamage });
        }
        
        const finalDamageDealt = this._applyAndLogDamage(
            Math.floor(reducedDamage), 
            0, 
            options.attacker, 
            options.isMagic, 
            options.silent // <--- THIS IS NEW
        );
        const finalDamage = Math.max(0, reducedDamage);
        
        // --- SHATTER LOGIC (Crystalline Fracture) ---
        if (source && source.isSkillActive && options) {

            // 1. GLACIAL EMBRACE (Apply Frostbite)
            if (source.isSkillActive('glacial_embrace') && 
                options.element === 'water' && 
                (this.statusEffects['drenched'] || this.statusEffects['saponified'])) {
                
                // Initialize or Increment Stacks
                if (!this.statusEffects['frostbite']) {
                    this.statusEffects['frostbite'] = { name: "Frostbite", duration: 3, stacks: 0, multiplier: 1.05 };
                }
                this.statusEffects['frostbite'].stacks += 1;
                this.statusEffects['frostbite'].duration = 3; // Refresh duration

                // Log Stack Count
                if (typeof defenseSteps !== 'undefined') {
                    defenseSteps.push({ 
                        description: "Glacial Embrace", 
                        value: `Stack ${this.statusEffects['frostbite'].stacks}`, 
                        result: "Frostbite" 
                    });
                }

                // Check for Threshold (5 Stacks)
                if (this.statusEffects['frostbite'].stacks >= 5) {
                    delete this.statusEffects['frostbite']; // Consume stacks
                    
                    // [FIX] Saponification Arts: Explosion instead of Freeze
                    // Check if Saponification Arts is active OR if the enemy is already Saponified
                    if (source.skillToggles['saponification_arts'] || this.statusEffects['saponified']) {
                        
                        // Calculate Explosion Damage (e.g., 150% of the triggering hit + Level Bonus)
                        const boomDmg = Math.floor(finalDamage * 1.5) + (source.level * 5);
                        
                        addToLog(`${this.name} erupts in a Saponified Explosion!`, "text-purple-300 font-bold");
                        
                        // Apply the explosion damage directly (using internal method to avoid recursion loops)
                        // We assume this is Water damage.
                        if (typeof this._applyAndLogDamage === 'function') {
                            this._applyAndLogDamage(boomDmg, 0, source, true);
                        } else {
                            this.hp -= boomDmg; // Fallback if method missing
                        }

                        if (typeof createFloatingText === 'function') {
                             createFloatingText(this.x, this.y, "💥 POP!", "text-purple-300");
                        }

                    } else {
                        // Default Behavior: Frozen (Stun)
                        this.statusEffects['frozen'] = { 
                            name: "Frozen", 
                            duration: 3, 
                            icon: '❄️', 
                            description: "Stunned. Unable to act." 
                        };
                        
                        addToLog(`${this.name} freezes solid!`, "text-cyan-300 font-bold");
                        if (typeof createFloatingText === 'function') createFloatingText(this.x, this.y, "❄️ FROZEN", "text-cyan-400");
                    }
                } else {
                    addToLog(`${this.name} suffers Frostbite!`, "text-blue-200");
                }
            }
        if (source.isSkillActive('jolting_pressure') && options.element === 'lightning') {
                const storedDmg = Math.floor(finalDamage * 0.50); // Snapshot 50% damage
                this.statusEffects['jolted'] = {
                    name: "Jolted",
                    duration: 3, 
                    icon: "⚡",
                    damageSnapshot: Math.max(10, storedDmg), 
                    description: "Static charge building. Discharges upon attacking."
                };
                addToLog(`${this.name} builds up static pressure!`, "text-yellow-300");
                if (typeof createFloatingText === 'function') {
                    createFloatingText(this.x, this.y, "⚡ JOLTED", "text-yellow-300");
                }
            }
        }
        
        return { damageDealt: finalDamageDealt, knockback: 0, defenseSteps: defenseSteps };
    }

    _findEmptyAdjacentCell() {
        const neighbors = [{ x: this.x, y: this.y - 1 }, { x: this.x, y: this.y + 1 }, { x: this.x - 1, y: this.y }, { x: this.x + 1, y: this.y }];
        if (typeof shuffleArray === 'function') shuffleArray(neighbors);
        for (const cell of neighbors) {
            if (!isCellBlocked(cell.x, cell.y, true, false)) return cell;
        }
        return null; 
    }

    _summonSkeleton(rarityKey) {
        const cell = this._findEmptyAdjacentCell();
        if (!cell) { addToLog(`${this.name} fails to summon (no space)!`, 'text-gray-400'); return; }
        const species = MONSTER_SPECIES['skeleton'];
        const rarity = MONSTER_RARITY[rarityKey] || MONSTER_RARITY['common'];
        if (!species || !rarity) return;
        const skeleton = new Enemy(species, rarity, player.level);
        skeleton.x = cell.x; skeleton.y = cell.y;
        currentEnemies.push(skeleton); 
        addToLog(`${this.name} raises a Skeleton!`, 'text-purple-400');
        renderBattleGrid(); 
    }

    async _tryUseAbility(target) {
        if (!this.ability || !target || !target.isAlive()) return false;

        // Enrage
        if (this.ability === 'enrage' && !this.enrageUsed && this.hp < this.maxHp * 0.5) {
            this.enrageUsed = true;
            this.statusEffects.enrage = { duration: 4 }; 
            addToLog(`${this.name} flies into a primal RAGE!`, 'text-red-600 font-bold');
            return false;
        }

        // Swallow
        if (this.ability === 'swallow' && !target.statusEffects.swallowed && Math.random() < 0.25) {
            applyStatusEffect(target, 'swallowed', { duration: Infinity, source: this }, this.name);
            return true; 
        }

        // Necromancy
        if (this.ability === 'necromancy') {
            const hpPercent = this.hp / this.maxHp;
            const rarityKey = this.rarityData.key;
            if (hpPercent <= 0.1 && !this.summonedAt10) {
                this.summonedAt10 = true; this.summonedAt50 = true;
                addToLog(`${this.name} desperately calls for aid!`, 'text-purple-500');
                this._summonSkeleton(rarityKey); 
                await new Promise(r => setTimeout(r, 250));
                if (gameState.battleEnded) return true; 
                this._summonSkeleton(rarityKey); 
                return true; 
            }
            if (hpPercent <= 0.5 && !this.summonedAt50) {
                this.summonedAt50 = true;
                addToLog(`${this.name} calls a minion!`, 'text-purple-400');
                this._summonSkeleton(rarityKey);
                return true; 
            }
        }
        
        // Poison Web
        if (this.ability === 'poison_web' && Math.random() < 0.3) {
            addToLog(`${this.name} spits a poison web!`, 'text-green-700');
            const targetStamina = (target.stamina || 0) + (target.bonusStamina || 0);
            const percentDamage = Math.max(0.05, 0.10 - (targetStamina * 0.01)); 
            const poisonDamage = Math.floor(target.maxHp * percentDamage);
            applyStatusEffect(target, 'poison', { duration: 6, damage: poisonDamage, source: this.name }, this.name); 
            return true; 
        }

        // Petrification
        const petrifyChance = 0.10 + (Math.max(0, this.rarityData.rarityIndex - 1) * 0.05); 
        if (this.ability === 'petrification' && Math.random() < petrifyChance) { 
            if (!target.statusEffects.petrified) {
                addToLog(`${this.name} unleashes a terrifying gaze!`, 'text-gray-400');
                applyStatusEffect(target, 'petrified', { duration: 2 }, this.name);
            }
            return false;
        }

        // Healing
        if (this.ability === 'healing' && this.hp < this.maxHp * 0.5 && Math.random() < 0.3) { 
            const healPercent = 0.20 + (Math.max(0, this.rarityData.rarityIndex - 1) * 0.05); 
            const healAmount = Math.floor(this.maxHp * healPercent); 
            this.hp = Math.min(this.maxHp, this.hp + healAmount);
            addToLog(`${this.name} radiates holy light! (+${healAmount} HP)`, 'text-green-400');

            const otherAllies = currentEnemies.filter(e => e.isAlive() && e !== this && (Math.abs(this.x - e.x) + Math.abs(this.y - e.y) <= 2));
            otherAllies.forEach(ally => {
                const allyHealAmount = Math.floor(ally.maxHp * healPercent); 
                ally.hp = Math.min(ally.maxHp, ally.hp + allyHealAmount);
                addToLog(`${this.name} heals ${ally.name}!`, 'text-green-300');
            });
            renderBattleGrid(); 
            return true; 
        }
        
        // Ultra Focus
        if (this.ability === 'ultra_focus' && this.ultraFocusTurns <= 0 && Math.random() < 0.25) { 
            addToLog(`${this.name}'s eye glows! (Next attacks pierce)`, 'text-yellow-500');
            this.ultraFocusTurns = 3; 
            return true;
        }

        // Scorch Earth
        if (this.ability === 'scorch_earth' && Math.random() < 0.2) { 
            const scorchDamage = rollDice(this.rarityData.rarityIndex, 6, 'Scorch Earth').total + this.strength; 
            addToLog(`${this.name} breathes fire!`, 'text-orange-500');
            target.takeDamage(scorchDamage, { isMagic: true, element: 'fire', ignore_defense: 0.25, attacker: this }); 
            return false;
        }
        
        // Living Shield
        if (this.ability === 'living_shield' && !this.statusEffects.living_shield && Math.random() < 0.3) { 
            addToLog(`${this.name} braces itself!`, 'text-gray-300');
            this.statusEffects.living_shield = { duration: 4 }; 
            return true;
        }

        // True Poison
        if (this.ability === 'true_poison' && Math.random() < 0.3) { 
            addToLog(`${this.name} inflicts True Poison!`, 'text-green-800');
            const targetStamina = (target.stamina || 0) + (target.bonusStamina || 0);
            const percentDamage = Math.max(0.10, 0.20 - (targetStamina * 0.01)); 
            const poisonDamage = Math.floor(target.maxHp * percentDamage);
            applyStatusEffect(target, 'toxic', { duration: 6, damage: poisonDamage, source: this.name }, this.name); 
            return true; 
        }

        return false;
    }

    async moveTowards(target) {
        if (this.statusEffects.rooted) {
            addToLog(`${this.name} is rooted!`, "text-yellow-500");
            return;
        }

        // 1. Determine Target
        let finalTarget = target;
        if (!finalTarget) {
            const ally = player.npcAlly;
            const allyIsValid = ally && ally.hp > 0 && !ally.isFled && ally.x !== -1;
            const playerDist = Math.abs(this.x - player.x) + Math.abs(this.y - player.y);
            const allyDist = allyIsValid ? (Math.abs(this.x - ally.x) + Math.abs(this.y - ally.y)) : Infinity;
            finalTarget = (allyDist < playerDist) ? ally : player;
        }
        if (!finalTarget) {
             addToLog(`${this.name} has no one to move towards!`);
             return; 
        }
        
        const isFlying = this.movement.type === 'flying';
        
        // 2. Find Path
        const path = findPath({x: this.x, y: this.y}, {x: finalTarget.x, y: finalTarget.y}, isFlying);

        if (path && path.length > 1) {
            addToLog(`${this.name} moves towards ${finalTarget.name}!`);
            let speed = this.movement.speed;
            if (this.statusEffects.drenched && player.isSkillActive('crashing_wake')) speed = Math.ceil(speed / 2);

            const stepsToTake = Math.min(path.length - 1, speed);
            const moveDelay = Math.max(50, 300 - (currentEnemies.length * 40)); 

            for (let i = 1; i <= stepsToTake; i++) {
                const nextStep = path[i];

                if (isCellBlocked(nextStep.x, nextStep.y, true, isFlying)) {
                     addToLog(`${this.name} encounters an obstacle and stops.`);
                    break; 
                }

                // --- TRAP CHECK ---
                const trapIndex = gameState.gridObjects.findIndex(o => o.x === nextStep.x && o.y === nextStep.y && (o.type === 'trap' || o.type === 'hazard'));
                
                if (trapIndex !== -1) {
                    const trap = gameState.gridObjects[trapIndex];
                    this.x = nextStep.x;
                    this.y = nextStep.y;
                    
                    if (gameState.currentView === 'battle') renderBattleGrid();

                    // Trap Effects
                    if (trap.subtype === 'slippery_ground') {
                        addToLog(`${this.name} slips!`, "text-cyan-300");
                        applyStatusEffect(this, 'tripped', { duration: 2 }, "Slippery Ground");
                        applyStatusEffect(this, 'rooted', { duration: 1 }, "Slippery Ground");
                        break; 
                    }
                    else if (trap.subtype === 'caltrops') {
                        const dmg = Math.max(1, Math.floor(this.maxHp * trap.damagePercent));
                        this.takeDamage(dmg, { ignore_defense: true });
                        addToLog(`${this.name} hits Caltrops!`, "text-orange-400");
                        gameState.gridObjects.splice(trapIndex, 1);
                        break; 
                    }
                    else if (trap.subtype === 'sudsy_minefield') {
                        if (typeof triggerSudsyBurst === 'function') triggerSudsyBurst(trap.x, trap.y, player);
                        addToLog(`${this.name} bursts the bubble!`, "text-cyan-300 font-bold");
                        const dmg = trap.damageSnapshot || 10;
                        this.takeDamage(dmg, { element: 'water', ignore_defense: true }, trap.source || player);
                        gameState.gridObjects.splice(trapIndex, 1);
                        break; 
                    }
                    else if (trap.subtype === 'thorny_vine') {
                        const vineDmg = Math.max(1, Math.floor(this.maxHp * 0.05));
                        this.takeDamage(vineDmg, { ignore_defense: true });
                        addToLog(`${this.name} tears through Thorny Vines!`, "text-green-400");
                        if (Math.random() < 0.20) {
                            const poisonDmg = Math.max(1, Math.floor(this.maxHp * (this.isBoss ? 0.01 : 0.05)));
                            applyStatusEffect(this, 'poison', { duration: 4, damage: poisonDmg, source: 'Thorny Vine' }, "Thorny Vine");
                        }
                        break; 
                    }
                }

                // --- [FIX] Check Opportunity Attacks (MUST AWAIT!) ---
                // If this returns true, it means an attack happened and we stop moving.
                if (await checkLanceOpportunityAttack(this, this.x, this.y, nextStep.x, nextStep.y)) {
                    break; 
                }

                // Move
                this.x = nextStep.x;
                this.y = nextStep.y;
                if (gameState.currentView === 'battle') renderBattleGrid();
                
                // Update Auras
                if (typeof updateTotemAuras === 'function') updateTotemAuras(this);

                // Portal Check
                if (typeof checkPortalEntry === 'function' && checkPortalEntry(this)) {
                    break; 
                }

                await new Promise(resolve => setTimeout(resolve, moveDelay));

                const dist = Math.abs(nextStep.x - finalTarget.x) + Math.abs(nextStep.y - finalTarget.y);
                if (dist <= this.range) break; 
            }
        } else {
            addToLog(`${this.name} is blocked!`);
        }
    }

    isValidMove(x, y) {
        if (x < 0 || x >= gameState.gridWidth || y < 0 || y >= gameState.gridHeight) return false;
        if (gameState.gridLayout[y * gameState.gridWidth + x] !== 1) return false;
        if (player.x === x && player.y === y) return false;
        if (currentEnemies.some(e => e !== this && e.isAlive() && e.x === x && e.y === y)) return false;
        if (gameState.gridObjects.some(o => o.x === x && o.y === y && o.type === 'obstacle')) return false;
        if (this.movement.type !== 'flying' && gameState.gridObjects.some(o => o.x === x && o.y === y && o.type === 'terrain')) return false;
        return true;
    }
}

function _determineDialogueType(name) {
    // Find the base gender category for the name
    let baseGender = 'Neutral';
    // Access the gender arrays directly from the global NPC_RANDOM_NAMES object
    if (NPC_RANDOM_NAMES.Male.includes(name)) {
        baseGender = 'Male';
    } else if (NPC_RANDOM_NAMES.Female.includes(name)) {
        baseGender = 'Female';
    }

    // Apply spice chance (10% chance to flip to another gender type)
    if (Math.random() < NPC_DIALOGUE.spiceChance) {
        const options = ['Male', 'Female', 'Neutral'].filter(g => g !== baseGender);
        return options[Math.floor(Math.random() * options.length)];
    }
    
    return baseGender;
}


// --- New: Global Dialogue Helper Method (Used by NpcAlly class) ---
function _getDialogue(ally, type, playerName = 'Adventurer') {
    const dialogueList = NPC_DIALOGUE[type] || [];
    
    // 1. Try to find the exact dialogueType (Male, Female, or Spiced)
    let genderedLines = dialogueList.find(d => d.gender === ally.dialogueType);

    // 2. Fallback to Neutral if the specific type is missing or null.
    if (!genderedLines) {
        genderedLines = dialogueList.find(d => d.gender === 'Neutral');
    }
    
    // 3. Extract lines array, falling back to a single generic line if all else fails.
    const lines = genderedLines ? genderedLines.lines : ["I am currently unavailable."]; // Fixed fallback text
    
    // Select a random line
    let line = lines[Math.floor(Math.random() * lines.length)];
    
    // Replace placeholders
    line = line.replace(/<AllyName>/g, ally.name);
    // --- ADDED: Replace PlayerName placeholder ---
    line = line.replace(/<PlayerName>/g, playerName);
    // --- END ADDED ---
    
    return line;
}


function logAllyDialogueChance(ally, type) {
    if (!ally || !NPC_DIALOGUE.random_chance || !ally._getDialogue) return false;

    const chance = NPC_DIALOGUE.random_chance[type] || 0;
    if (Math.random() < chance) {
        const dialogue = ally._getDialogue(type, player.name);
        addToLog(`(${ally.name})<br>"${dialogue}"`, 'text-gray-400');
        return true;
    }
    return false;
}

function getNpcAllyEmoji(ally) {
    if (!ally || !ally.raceKey) return '🛡️'; // Default fallback

    // Handle Elementals (defaulting to fire, since they don't have affinity)
    if (ally.raceKey === 'Elementals') {
        // Allies don't have elementalAffinity, so we'll default
        return ELEMENTAL_AFFINITY_EMOJIS['fire'] || '🔥'; 
    }

    // Handle other races
    const raceEmojis = PLAYER_EMOJIS[ally.raceKey];
    if (!raceEmojis) return '🛡️'; // Default if race not in map

    // Allies don't have gender, so always use the 'Neutral' emoji
    // Fallback to Male, then Female, then the default '🛡️'
    return raceEmojis['Neutral'] || raceEmojis['Male'] || raceEmojis['Female'] || '🛡️';
}

// --- CORE LOGIC FUNCTIONS ---

function getQuestDetails(questIdentifier) {
    if (!questIdentifier || !questIdentifier.category || !questIdentifier.key) {
        return null;
    }
    const quest = QUESTS[questIdentifier.key] || null;
    if (!quest) return null;

    // A unified way to check quest progress ONLY when viewing the board/details
    // Actual progress updates happen where relevant (battle end, crafting, etc.)
    if (player.activeQuest && player.activeQuest.key === questIdentifier.key) {
        if (quest.type === 'collection' || quest.type === 'creation') {
            const itemDetails = getItemDetails(quest.target);
            if (itemDetails) {
                 // Check inventory based on item type
                 if (quest.target in ITEMS) {
                     player.questProgress = player.inventory.items[quest.target] || 0;
                } else {
                    let category = '';
                    if (quest.target in WEAPONS) category = 'weapons';
                    else if (quest.target in ARMOR) category = 'armor';
                    else if (quest.target in SHIELDS) category = 'shields';
                    else if (quest.target in CATALYSTS) category = 'catalysts'; // Added catalysts

                    if (category && player.inventory[category]) { // Ensure category exists
                        player.questProgress = player.inventory[category].filter(item => item === quest.target).length;
                    } else {
                         player.questProgress = 0; // Reset if category is invalid
                    }
                }
            } else {
                 player.questProgress = 0; // Reset if target item is invalid
            }
        }
        // Extermination progress is updated in checkBattleStatus
    }

    return quest;
}


function applyStatusEffect(target, effectType, effectData, sourceName) {
    // --- VIRULENT EVOLUTION (Poison -> Toxic) ---
    // [UPDATE] Added isElementalStateActive check
    if (effectType === 'poison' && player && player.isSkillActive('virulent_evolution') && isElementalStateActive('nature')) {
        const playerSources = [player.name, 'Thorny Vine', 'Accumulated Decay', 'Poison Grease', 'Weapon Effect'];
        if (playerSources.includes(sourceName)) {
            effectType = 'toxic';
            if (effectData.damage) effectData.damage = Math.floor(effectData.damage * 2);
        }
    }
    // ---------------------------------------------

    let resistChance = 0;
    
    // [MODIFIED] Check if target is Player/Ally AND the effect is NOT a buff
    if ((target instanceof Player || target instanceof NpcAlly) && !effectType.startsWith('buff_') && effectData.type !== 'buff') { 
        resistChance = target.resistanceChance; 

        // [INJECT HERE] Lithic Sovereign CC Resist
        if (target.statusEffects.buff_lithic_aura) {
            // Check if it is a Crowd Control effect
            const ccEffects = ['paralyzed', 'petrified', 'slowed', 'swallowed', 'rooted', 'stunned', 'frozen', 'tripped'];
            if (ccEffects.includes(effectType)) {
                resistChance += 0.50; // +50% Resistance
            }
        }

        // Aegis of the Soul (Resist)
        if (target.skillToggles && target.skillToggles['mana_steel_aura']) {
            resistChance += (1 - resistChance) * 0.5;
        }

        // Immovable Object (CC Immunity)
        const ccEffects = ['paralyzed', 'petrified', 'slowed', 'swallowed', 'knockback', 'rooted'];
        if (target.skillToggles && target.skillToggles['lockdown'] && ccEffects.includes(effectType)) {
            addToLog("Immovable Object ignores the crowd control!", "text-yellow-300 font-bold");
            return; 
        }

        // Gear Resistance (Player only)
        if (target instanceof Player) { 
            const shield = target.equippedShield;
            if (shield && shield.effect?.type === 'debuff_resist') {
                resistChance += (1 - resistChance) * shield.effect.chance; 
            }
        }
         
        // Status Resistance
        const resistKey = `resist_${effectType}`; 
        if (target.statusEffects[resistKey]) {
             resistChance += (1 - resistChance) * (1 - target.statusEffects[resistKey].multiplier); 
        }

        // Racial/Luck Roll
        if (target.rollForEffect(resistChance, 'Debuff Resist')) {
            const logMsg = (target instanceof Player) ? "You resisted" : `${target.name} resisted`; 
            addToLog(`${logMsg} the ${effectType} effect from ${sourceName}!`, 'text-cyan-300 font-bold');
            return; 
        }
    }

    // Divine Unalloyed Soul Immunity
    if (target instanceof Player && target.skillToggles && target.skillToggles['divine_unalloyed_soul']) {
        if (['poison', 'paralyzed', 'toxic', 'drenched', 'saponified'].includes(effectType)) {
            addToLog(`Divine Unalloyed Soul purges the ${effectType}!`, "text-yellow-300 font-bold");
            return; 
        }
    }

    // Aasimar Duration Reduction
    if ((target instanceof Player || target instanceof NpcAlly) && target.race === 'Aasimar') {
        if (effectData.duration && effectData.duration > 1) {
            effectData.duration = Math.max(1, effectData.duration - 1); 
            const logMsg = (target instanceof Player) ? "Your divine nature lessens" : `${target.name}'s divine nature lessens`; 
            addToLog(`${logMsg} the debuff's duration!`, "text-yellow-200");
        }
    }

    // --- SAPONIFICATION ARTS TRANSFORMATION ---
    // If applying Drenched and player has the toggle, convert to Saponified
    if (effectType === 'drenched' && player.skillToggles && player.skillToggles['saponification_arts']) {
        effectType = 'saponified';
        // Saponified inherits duration/multiplier from the source spell but changes type
        addToLog("The water turns to slippery foam! (Saponified)", "text-cyan-300");
    }
    // ------------------------------------------

    // Viscous Liquid Interaction
    if (effectType === 'drenched' && target.statusEffects.debuff_viscous) {
        effectData.duration *= 2; 
        effectData.multiplier = (effectData.multiplier || 0.9) - 0.1; 
        addToLog("The viscous liquid enhances the drenching effect!", "text-blue-600 font-bold");
        delete target.statusEffects.debuff_viscous; 
    }
    
    // Apply the Effect
    target.statusEffects[effectType] = effectData;

    // Logging
    let message = '';
    let color = 'text-red-400'; 
    switch(effectType) {
        case 'poison':
             message = `You have been poisoned by ${sourceName}!`;
             color = 'text-green-600';
            break;
        case 'toxic': 
            message = `${sourceName} inflicts a deadly toxin!`;
            color = 'text-green-800 font-bold';
            break;
        case 'petrified':
            message = `${sourceName} gazes at you, turning your flesh to stone! You are petrified.`;
            color = 'text-gray-400 font-bold';
            break;
        case 'paralyzed':
            message = `${sourceName}'s blow stuns you! You are paralyzed!`; 
            color = 'text-orange-500 font-bold';
            break;
        case 'swallowed':
            message = `${sourceName} opens its massive maw and swallows you whole!`;
            color = 'text-red-700 font-bold';
            break;
         case 'drenched': 
             message = `${sourceName}'s attack leaves you Drenched! Your attacks are weaker.`;
             color = 'text-blue-400';
             break;
         case 'saponified': 
             message = `${target.name} is coated in slippery foam!`;
             color = 'text-cyan-300';
             break;
         case 'rooted':
            message = `${target.name} is rooted to the spot!`;
            color = 'text-yellow-500 font-bold';
            break;
    }
    if (message) { 
        addToLog(message, color);
    }
     
     if (target instanceof Player) {
        updateStatsView();
    }
}

Player.prototype.canUnlockSkill = function(skillId) {
    if (this.isSkillActive(skillId)) return false;
    
    const node = SKILL_TREE[skillId];
    if (!node) return false;

    // --- CHECK CURRENCY ---
    if (node.costType === 'mastery') {
        if ((this.masteryPoints || 0) <= 0) return false;
    } else {
        if (this.skillPoints <= 0) return false;
    }
    
    // --- EXCLUSIVITY CHECK ---
    if (node.exclusiveWith && this.isSkillActive(node.exclusiveWith)) {
        return false; 
    }

    // --- PARENT CHECK (MODIFIED) ---
    // If no parents (Root), it's unlockable
    if (!node.parents || node.parents.length === 0) return true;

    // Requirement: ALL parents must be unlocked
    return node.parents.every(parentId => this.isSkillActive(parentId));
};

Player.prototype.unlockSkill = function(skillId) {
    if (!this.canUnlockSkill(skillId)) return;
    
    const node = SKILL_TREE[skillId];

    // Deduct appropriate currency
    if (node.costType === 'mastery') {
        this.masteryPoints--;
        addToLog(`Mastered Art: <span class="font-bold text-purple-400">${node.name}</span>`, 'text-purple-300');
    } else {
        this.skillPoints--;
        addToLog(`Learned Skill: <span class="font-bold text-yellow-300">${node.name}</span>`, 'text-yellow-300');
    }
    
    this.unlockedSkills.push(skillId);
    
    // Re-render if on skill screen
    if (gameState.currentView === 'skill_tree') {
        renderSkillTree();
    }
};

// Helper to upgrade dice
function getUpgradedDice(currentDice) {
    // currentDice is [numDice, sides] e.g., [1, 6]
    const sides = currentDice[1];
    const index = DICE_PROGRESSION.indexOf(sides);
    
    if (index === -1 || index >= DICE_PROGRESSION.length - 1) {
        return currentDice; // Can't upgrade or maxed
    }
    
    return [currentDice[0], DICE_PROGRESSION[index + 1]];
}


function generateEnemy(biomeKey) {
    const biomeData = BIOMES[biomeKey];
    const monsterPool = biomeData.monsters;
    let speciesKey;

    // --- LURE LOGIC ---
    const lureDetails = LURES[player.equippedLure];
    if (player.equippedLure !== 'no_lure' && lureDetails && player.inventory.lures[player.equippedLure] > 0 && monsterPool[lureDetails.lureTarget] && player.rollForEffect(0.75, 'Monster Lure')) { // Use new roll function
        speciesKey = lureDetails.lureTarget;
        addToLog(`Your ${lureDetails.name} attracts a monster!`, 'text-yellow-300');
        player.inventory.lures[player.equippedLure]--; // Decrement uses
        if (player.inventory.lures[player.equippedLure] <= 0) {
            addToLog(`Your ${lureDetails.name} has been fully used.`, 'text-gray-400');
            delete player.inventory.lures[player.equippedLure];
            // No need to find key again, just compare with equippedLure
            if(player.equippedLure === findKeyByName(lureDetails.name, LURES)) { // Check if the depleted lure was equipped
                player.equippedLure = 'no_lure';
            }

        }
        updateStatsView(); // Update UI to show remaining uses or 'None'
    } else {
        speciesKey = choices(Object.keys(monsterPool), Object.values(monsterPool));
    }


    const speciesData = MONSTER_SPECIES[speciesKey];

    const rarityKeys = Object.keys(MONSTER_RARITY);
    const rarityWeights = getDynamicRarityWeights(player.level, speciesData.class);
    const chosenRarityKey = choices(rarityKeys, rarityWeights);
    const rarityData = MONSTER_RARITY[chosenRarityKey];

    // Elemental Monster Generation
    const elementPopulation = ['none', 'fire', 'water', 'earth', 'wind', 'lightning', 'nature', 'light', 'void'];
     // Adjusted weights: Lower chance for elements overall, especially light/void
    const elementWeights = [60, 6, 6, 6, 6, 6, 6, 2, 2]; // 60% none, 6% each main element, 2% light/void
    const chosenElementKey = choices(elementPopulation, elementWeights);


    let elementData = { key: 'none', adjective: '' };
    if (chosenElementKey !== 'none') {
        const chosenElement = ELEMENTS[chosenElementKey];
        elementData = { key: chosenElementKey, adjective: chosenElement.adjective };
    }


    return new Enemy(speciesData, rarityData, player.level, elementData);
}

async function generateBarracksRoster() {
    if (!player) return;

    // Ensure seed is valid
    if (player.seed === null || player.seed === undefined || isNaN(Number(player.seed))) {
         console.warn("Player seed invalid for Barracks roster. Using temporary random.");
         player.seed = Math.floor(Math.random() * 1000000);
    }
    const rng = seededRandom(player.seed); // Use the player's daily seed
    
    player.barracksRoster = []; // Clear the old roster
    
    // Get all available names and shuffle them
    const namesMale = NPC_RANDOM_NAMES.Male.map(n => ({ name: n, gender: 'Male' }));
    const namesFemale = NPC_RANDOM_NAMES.Female.map(n => ({ name: n, gender: 'Female' }));
    const namesNeutral = NPC_RANDOM_NAMES.Neutral.map(n => ({ name: n, gender: 'Neutral' }));
    const allNames = shuffleArray([...namesMale, ...namesFemale, ...namesNeutral], rng);

    // --- 1. Generate 4 Random NPCs ---
    for (let i = 0; i < 4; i++) {
        if (allNames.length === 0) break; 

        const recruitData = allNames.pop();
        const availableRaces = Object.keys(RACES);
        const availableClasses = Object.keys(CLASSES);

        const raceKey = availableRaces[Math.floor(rng() * availableRaces.length)];
        const classKey = availableClasses[Math.floor(rng() * availableClasses.length)];
        
        const { backgroundKey, backgroundName } = _determineWeightedBackground(raceKey, classKey, rng);

        player.barracksRoster.push({
            name: recruitData.name,
            raceKey: raceKey,
            classKey: classKey,
            backgroundKey: backgroundKey,
            backgroundName: backgroundName,
            baseGender: recruitData.gender,
            isGhost: false // Flag as not a ghost
        });
    }
    
    // --- 2. Fetch 1 Ghost NPC ---
    let ghostAdded = false;
    if (typeof db !== 'undefined' && typeof userId !== 'undefined' && userId && typeof auth !== 'undefined' && auth.currentUser && !auth.currentUser.isAnonymous) {
        try {
            // --- REMOVE LEVEL QUERIES ---
            // const minLvl = Math.max(1, player.level - 5);
            // const maxLvl = player.level + 10;
            const publicRef = db.collection(`artifacts/${appId}/public/data/characters`);
            
            // --- MODIFIED QUERY: Remove .where() clauses ---
            const querySnapshot = await publicRef
                // .where('level', '>=', minLvl) // REMOVED
                // .where('level', '<=', maxLvl) // REMOVED
                .limit(20) // Just get a random batch
                .get();

            if (!querySnapshot.empty) {
                let potentialGhosts = [];
                querySnapshot.forEach(doc => {
                    const data = doc.data();
                    // --- CHANGED: Check the CHARACTER ID, not the USER ID ---
                    if (doc.id !== player.firestoreId) { // Don't add your CURRENT character
                        potentialGhosts.push(data);
                    }
                    // --- END CHANGED ---
                });

                if (potentialGhosts.length > 0) {
                    const ghostData = potentialGhosts[Math.floor(rng() * potentialGhosts.length)];
                    
                    player.barracksRoster.push({
                        name: ghostData.name,
                        raceKey: ghostData.raceKey,
                        classKey: ghostData._classKey,
                        backgroundKey: ghostData.backgroundKey,
                        backgroundName: ghostData.backgroundName,
                        baseGender: ghostData.baseGender,
                        isGhost: true,

                        // --- ADD THESE NEW LINES ---
                        // Pass the ghost's loadout into the roster data
                        equippedWeaponKey: ghostData.equippedWeaponKey,
                        equippedCatalystKey: ghostData.equippedCatalystKey,
                        equippedArmorKey: ghostData.equippedArmorKey,
                        equippedShieldKey: ghostData.equippedShieldKey,
                        spells: ghostData.spells,
                        items: ghostData.items
                        // --- END ADDED LINES ---
                    });
                    ghostAdded = true;
                }
            }
        } catch (error) {
            console.error("Failed to fetch ghost ally:", error);
            // Fallback will run
        }
    }

    // --- 3. Fallback: Add 5th Random NPC ---
    if (!ghostAdded) {
        if (allNames.length > 0) {
            const recruitData = allNames.pop();
            const availableRaces = Object.keys(RACES);
            const availableClasses = Object.keys(CLASSES);
            const raceKey = availableRaces[Math.floor(rng() * availableRaces.length)];
            const classKey = availableClasses[Math.floor(rng() * availableClasses.length)];
            const { backgroundKey, backgroundName } = _determineWeightedBackground(raceKey, classKey, rng);

            player.barracksRoster.push({
                name: recruitData.name,
                raceKey: raceKey,
                classKey: classKey,
                backgroundKey: backgroundKey,
                backgroundName: backgroundName,
                baseGender: recruitData.gender,
                isGhost: false
            });
        }
    }

    // --- 4. Shuffle the final roster ---
    player.barracksRoster = shuffleArray(player.barracksRoster, rng);

    console.log("New Barracks roster generated (with ghost attempt):", player.barracksRoster);
}


function _determineWeightedBackground(raceKey, classKey, rng) {
    const raceData = RACES[raceKey] || RACES['Human'];
    const classData = CLASSES[classKey] || CLASSES['fighter'];

    const statKeys = ['vigor', 'focus', 'stamina', 'strength', 'intelligence', 'luck'];
    const baseStats = {};

    // 1. Calculate combined Level 1 base stats
    statKeys.forEach(stat => {
        const capStat = capitalize(stat); // capitalize() is from ui_helpers.js
        const raceStat = raceData[capStat] || 0;
        const classStat = classData.bonusStats[capStat] || 0;
        baseStats[stat] = raceStat + classStat;
    });

    // 2. Find highest and second-highest stats
    const sortedStats = Object.entries(baseStats).sort((a, b) => b[1] - a[1]);
    const highestStat = sortedStats[0][0];
    const secondHighestStat = sortedStats[1][0];

    // 3. Create background pools
    const primaryPool = [];
    const secondaryPool = [];
    const tertiaryPool = [];

    Object.keys(BACKGROUNDS).forEach(bgKey => {
        // Exclude 'wretch' from weighted selection; it's a player-only default/choice
        if (bgKey === 'wretch') return;

        const favoredStats = BACKGROUNDS[bgKey].favoredStats.map(s => s.toLowerCase());
        if (favoredStats.includes(highestStat)) {
            primaryPool.push(bgKey);
        } else if (favoredStats.includes(secondHighestStat)) {
            secondaryPool.push(bgKey);
        } else {
            tertiaryPool.push(bgKey);
        }
    });

    // 4. Perform weighted roll
    const roll = rng() * 100;
    let chosenPool;

    // 60% chance for Primary, 30% for Secondary, 10% for Tertiary
    if (roll < 60 && primaryPool.length > 0) {
        chosenPool = primaryPool;
    } else if (roll < 90 && secondaryPool.length > 0) {
        chosenPool = secondaryPool;
    } else if (tertiaryPool.length > 0) {
        chosenPool = tertiaryPool;
    } else if (secondaryPool.length > 0) {
        chosenPool = secondaryPool; // Fallback
    } else if (primaryPool.length > 0) {
        chosenPool = primaryPool; // Fallback
    } else {
        // Ultimate fallback (should only happen if all pools are empty)
        return { backgroundKey: 'wretch', backgroundName: BACKGROUNDS['wretch'].name };
    }

    // 5. Select from the chosen pool
    const chosenKey = chosenPool[Math.floor(rng() * chosenPool.length)];
    return { backgroundKey: chosenKey, backgroundName: BACKGROUNDS[chosenKey].name };
}

function generateBlackMarketStock() {
    // List of powerful/unique items restricted from random stock
    const restrictedItems = [
        // Legendary Weapons
        'livyatans_scaleclaw', 'the_black_knife', 'void_greatsword', 'the_greatsword',
        'dragonscale_cragblade', 'unending_dance', 'headless_executioner',
        'earthshaker_hammer', 'giant_hunter', 'vacuum_greatbow', 'grims_beloved',
        // Legendary Catalysts
        'mountain_carver', 'deep_sea_staff', 'dragons_heart', 'blackshadow_staff',
        // Legendary Shields
        'heavy_slabshield', 'exa_reflector',
        // Legendary Armor
        'adamantine_armor', 'mirror_mail', 'soul_steel_armor', 'vacuum_encaser',
        // Specific Epic items maybe? (Optional)
        'trolls_knight_sword', 'vampiric_dagger', // Example
        // Key Items
        'undying_heart'
    ];

    // Ensure player seed is valid
    if (player.seed === null || player.seed === undefined || isNaN(Number(player.seed))) {
         console.warn("Player seed invalid for black market generation. Using temporary random.");
         player.seed = Math.floor(Math.random() * 1000000);
    }
    const rng = seededRandom(player.seed);
    const potentialStock = [];


    // Add non-legendary, non-broken Weapons, Armor, Shields, Catalysts
    Object.keys(WEAPONS).forEach(key => { if (WEAPONS[key].price > 0 && WEAPONS[key].rarity !== 'Legendary' && WEAPONS[key].rarity !== 'Broken') potentialStock.push(key); });
    Object.keys(ARMOR).forEach(key => { if (ARMOR[key].price > 0 && ARMOR[key].rarity !== 'Legendary' && ARMOR[key].rarity !== 'Broken') potentialStock.push(key); });
    Object.keys(SHIELDS).forEach(key => { if (SHIELDS[key].price > 0 && SHIELDS[key].rarity !== 'Legendary' && SHIELDS[key].rarity !== 'Broken') potentialStock.push(key); });
    Object.keys(CATALYSTS).forEach(key => { if (CATALYSTS[key].price > 0 && CATALYSTS[key].rarity !== 'Legendary' && CATALYSTS[key].rarity !== 'Broken') potentialStock.push(key); });

    // Add Seeds and Saplings
    Object.keys(ITEMS).forEach(key => {
        const item = ITEMS[key];
        // Allow seeds/saplings, exclude key items, recipes, junk
        if (item.price > 0 && (item.type === 'seed' || item.type === 'sapling')) {
            potentialStock.push(key);
        }
         // Maybe add rare alchemy ingredients too?
         if (item.price > 50 && item.type === 'alchemy' && item.rarity === 'Rare') {
             potentialStock.push(key);
         }
    });


    const filteredStock = potentialStock.filter(itemKey => !restrictedItems.includes(itemKey));
    const shuffled = shuffleArray(filteredStock, rng);
    
    // Base: 3 to 5 items
    let stockCount = 3 + Math.floor(rng() * 3); 
    
    // --- NEW: Syndicate Membership Bonus ---
    if (player.isSkillActive('underground_connections')) {
        stockCount += 1;
    }
    // ---------------------------------------

    player.blackMarketStock.seasonal = shuffled.slice(0, stockCount);
    console.log("Black market stock generated:", player.blackMarketStock.seasonal);
}

// --- PLAYER ACTIONS (OUT OF BATTLE) ---

function enchantItem(gearType, elementKey) {
    if (!player) return;

    let gear, currentElementProp, itemKey; // <-- ADDED itemKey
    switch(gearType) {
        case 'weapon': 
            gear = player.equippedWeapon; 
            currentElementProp = 'weaponElement'; 
            itemKey = findKeyByInstance(WEAPONS, gear); // <-- NEW: Get the key of the equipped item
            break;
        case 'armor': 
            gear = player.equippedArmor; 
            currentElementProp = 'armorElement'; 
            itemKey = findKeyByInstance(ARMOR, gear); // <-- NEW: Get the key of the equipped item
            break;
        case 'shield': 
            gear = player.equippedShield; 
            currentElementProp = 'shieldElement'; 
            itemKey = findKeyByInstance(SHIELDS, gear); // <-- NEW: Get the key of the equipped item
            break;
        default: return;
    }

    if (!gear || gear.rarity === 'Broken' || !gear.rarity) {
        addToLog(`You cannot enchant this item.`, 'text-red-400');
        return;
    }

    if (player[currentElementProp] === elementKey) {
        addToLog(`This item is already enchanted with ${elementKey}.`, 'text-yellow-400');
        return;
    }

    const costs = ENCHANTING_COSTS[gear.rarity];
    if (!costs) {
        addToLog(`Cannot find enchanting costs for ${gear.rarity} rarity.`, 'text-red-400');
        return;
    }

    const essenceKey = `${elementKey}_essence`;
    const essenceDetails = getItemDetails(essenceKey); // Get details for logging name
    if (!essenceDetails) {
        addToLog(`Error: Invalid essence key '${essenceKey}'.`, 'text-red-500');
        return;
    }
    const playerEssence = player.inventory.items[essenceKey] || 0;


    if (playerEssence < costs.essence) {
        addToLog(`You need ${costs.essence} ${essenceDetails.name} to enchant this.`, 'text-red-400');
        return;
    }
    if (player.gold < costs.gold) {
        addToLog(`You need ${costs.gold} G to enchant this.`, 'text-red-400');
        return;
    }

    player.inventory.items[essenceKey] -= costs.essence;
    if (player.inventory.items[essenceKey] <= 0) {
        delete player.inventory.items[essenceKey];
    }
    player.gold -= costs.gold;

    // --- NEW LOGIC: Save enchantment to the item type key ---
    if (itemKey) {
        player.enchantments[itemKey] = elementKey;
    }
    // --- END NEW LOGIC ---

    player[currentElementProp] = elementKey;

    addToLog(`You successfully enchanted your ${gear.name} with the power of ${elementKey}!`, 'text-green-400 font-bold');
    updateStatsView();
    renderEnchanterEnchant(elementKey); // Re-render to show updated state
}
    

async function restAtInn(cost) {
    if(cost > 0 && player.gold < cost) {
        addToLog("You can't afford a room.", "text-red-400");
        return;
    }
    player.gold -= cost;
    if(cost > 0) addToLog(`You pay <span class="font-bold">${cost} G</span> for a room.`, 'text-yellow-400');

    // Ambush chance - lower probability
    if (player.rollForEffect(0.05, 'Inn Ambush') && cost > 0) { // Reduced to 5%, use new roll function
        addToLog(`You are ambushed in your sleep!`, 'text-red-500 font-bold');
        // Determine biome based on player tier or last visited biome if available
        const potentialBiomes = player.biomeOrder.filter(b => BIOMES[b].tier <= player.playerTier);
        const ambushBiome = potentialBiomes.length > 0
            ? potentialBiomes[Math.floor(Math.random() * potentialBiomes.length)]
            : player.biomeOrder[0]; // Fallback to first biome
        setTimeout(() => startBattle(ambushBiome), 2000);
    } else {
        player.hp = player.maxHp;
        player.mp = player.maxMp;
        player.questsTakenToday = []; // Reset daily quest limit
        player.seed = Math.floor(Math.random() * 1000000); // Generate new seed for the 'day'
        generateBlackMarketStock(); // Refresh black market stock
        await generateBarracksRoster(); // --- NEW: Refresh Barracks roster ---
        player.clearFoodBuffs(); // Food buffs wear off after resting
        addToLog(`You wake up feeling refreshed. The quest board and black market have new offerings.`, 'text-green-400 font-bold');
        updateStatsView(); // Update UI after resting
        setTimeout(renderTown, 2000); // Go back to town square
    }
}

function upgradeSpell(spellKey) {
    const spellData = SPELLS[spellKey];
    const playerSpell = player.spells[spellKey];

    if (!playerSpell) {
        const learnCost = spellData.learnCost || 0;
        if (player.gold >= learnCost) {
            player.gold -= learnCost;
            player.spells[spellKey] = { tier: 1 };
            addToLog(`You have learned the basics of <span class="font-bold text-purple-300">${spellData.tiers[0].name}</span>!`, 'text-green-400');
        } else {
            addToLog(`You need ${learnCost} G to learn this spell.`, 'text-red-400');
        }
        updateStatsView(); // Update gold display
        renderSageTowerTrain(); // Re-render spell list
        return;
    }

    const currentTierIndex = playerSpell.tier - 1;
    const currentTierData = spellData.tiers[currentTierIndex];

    if (currentTierIndex >= spellData.tiers.length - 1) {
        addToLog("This spell is already at its maximum tier.", 'text-yellow-400');
        return;
    }

    const upgradeCost = currentTierData.upgradeCost;
    const requiredEssences = currentTierData.upgradeEssences || {};

    if (player.gold < upgradeCost) {
        addToLog(`You need ${upgradeCost} G to upgrade this spell.`, 'text-red-400');
        return;
    }
    for (const essenceKey in requiredEssences) {
        const requiredAmount = requiredEssences[essenceKey];
        const playerAmount = player.inventory.items[essenceKey] || 0;
        if (playerAmount < requiredAmount) {
            addToLog(`You need ${requiredAmount}x ${getItemDetails(essenceKey).name}.`, 'text-red-400');
            return;
        }
    }

    // Deduct resources
    player.gold -= upgradeCost;
    for (const essenceKey in requiredEssences) {
        player.inventory.items[essenceKey] -= requiredEssences[essenceKey];
        if (player.inventory.items[essenceKey] <= 0) {
            delete player.inventory.items[essenceKey];
        }
    }

    // Upgrade spell tier
    player.spells[spellKey].tier++;
    const nextTierData = spellData.tiers[currentTierIndex + 1];
    addToLog(`You have upgraded to <span class="font-bold text-purple-300">${nextTierData.name}</span>!`, 'text-green-400');
    updateStatsView(); // Update gold display
    renderSageTowerTrain(); // Re-render spell list
}

window.calculateAdjustedPrice = function(itemKey, priceMultiplier = 1.0) {
    const details = getItemDetails(itemKey);
    if (!details) return 0;
    
    let price = details.price * priceMultiplier;

    // 1. Guild Supply Lines (Light Armor & Parrying Shields -25%)
    if (player.isSkillActive('guild_supply_lines')) {
        const lightArmorNames = [
            "Traveler’s Armor", "Traveler's Armor", "Traveler's Garb",
            "Leather Armor", "Padded Leather", "Silenced Leather", 
            "Assassin’s Cloak", "Vacuum Encaser"
        ];
        
        const isLightArmor = (ARMOR[itemKey] && lightArmorNames.includes(details.name));
        
        // Check for Parry: Explicit 'parry' type or legacy 'parry' property
        const isParryShield = SHIELDS[itemKey] && (
            (details.effect && details.effect.type === 'parry') || 
            (details.effect && details.effect.parry)
        );

        if (isLightArmor || isParryShield) {
            price *= 0.75;
        }
    }

    // 2. Logistics of War (Heavy Armor & Block Shields -25%)
    if (player.isSkillActive('logistics_of_war')) {
        // Heavy Armor defined by metallic tag
        const isHeavyArmor = ARMOR[itemKey] && details.metallic;
        
        // Block Shield defined by having blockChance > 0
        const isBlockShield = SHIELDS[itemKey] && (details.blockChance > 0 || (details.effect && details.effect.blockChance));

        if (isHeavyArmor || isBlockShield) {
            price *= 0.75;
        }
    }

    // 3. Goblinoid Racial Bonus
    if (player.race === 'Goblinoid') {
        let discount = 0.10; // Base 10%
        if (player.level >= 20 && player.rollForEffect(0.2, 'Goblinoid Buy Bonus')) {
            discount += 0.20; // Extra 20%
            addToLog("Sticky Fingers! You haggle an extra discount!", "text-green-300");
        }
        price *= (1.0 - discount);
    }

    return Math.floor(price);
};

// [UPDATED] buyItem now trusts the calculator
function buyItem(itemKey, shopType, priceOverride = null) {
    const details = getItemDetails(itemKey);
    
    // Trust the UI's calculation if provided, otherwise recalculate
    let finalPrice = priceOverride;
    
    if (finalPrice === null) {
        finalPrice = window.calculateAdjustedPrice(itemKey, 1.0);
    }

    if (player.gold >= finalPrice) {
        player.gold -= finalPrice;
        player.addItem(itemKey);
        playSound('buy');
        addToLog(`Bought ${details.name} for ${finalPrice} G.`, "text-yellow-400");
        
        updateStatsView();
        if (shopType === 'store') renderShop('store');
        else if (shopType === 'black_market') renderShop('black_market');
        else if (shopType === 'blacksmith') renderBlacksmithBuy();
        else if (shopType === 'sage_tower') renderSageTowerBuy();
        else if (shopType === 'event_shop') { if(typeof renderEventShop === 'function') renderEventShop(); }
        
    } else {
        addToLog("Not enough gold!", "text-red-500");
        playSound('error');
    }
}

function sellItem(category, itemKey, baseSellPrice, isCraftedSale = false) { 
    if (!player) return;

    const details = getItemDetails(itemKey);
    if (!details) return;

    let itemRemoved = false;
    if (category === 'items' || category === 'lures') {
        if (player.inventory[category] && player.inventory[category][itemKey] && player.inventory[category][itemKey] > 0) {
            player.inventory[category][itemKey]--;
            
            // --- UPDATED: Decrement Crafted Count & Cleanup ---
            if (isCraftedSale && player.inventory.craftedCounts && player.inventory.craftedCounts[itemKey] > 0) {
                player.inventory.craftedCounts[itemKey]--;
                
                // If count reaches 0, clear the avg value to keep data clean
                if (player.inventory.craftedCounts[itemKey] <= 0) {
                    delete player.inventory.craftedCounts[itemKey];
                    if (player.inventory.craftedAvgValues) {
                        delete player.inventory.craftedAvgValues[itemKey];
                    }
                }
            }
            // --------------------------------------------------

            if (player.inventory[category][itemKey] <= 0) {
                delete player.inventory[category][itemKey];
                // Safety cleanup
                if (player.inventory.craftedCounts && player.inventory.craftedCounts[itemKey]) delete player.inventory.craftedCounts[itemKey];
                if (player.inventory.craftedAvgValues && player.inventory.craftedAvgValues[itemKey]) delete player.inventory.craftedAvgValues[itemKey];
            }
            itemRemoved = true;
        }
    } else { 
        // Equipment removal (unchanged)
        const inventoryCategory = player.inventory[category];
        if (inventoryCategory) {
            const itemIndex = inventoryCategory.indexOf(itemKey);
            if (itemIndex > -1) {
                inventoryCategory.splice(itemIndex, 1);
                itemRemoved = true;
            }
        }
    }

    if (itemRemoved) {
        // --- UPDATED: Base Price Selection ---
        let finalSellPrice = baseSellPrice;
        
        // If it's a crafted sale, try to use the stored average value first
        if (isCraftedSale && player.inventory.craftedAvgValues && player.inventory.craftedAvgValues[itemKey]) {
            // "Sum of ingredients * 1.5"
            // The stored avg value IS the sum of ingredients (averaged per item)
            // So we just multiply by 1.5
            finalSellPrice = Math.floor(player.inventory.craftedAvgValues[itemKey] * 1.5);
        }
        // -------------------------------------

        let bonusMultiplier = 1.0;

        // 1. Race Bonuses
        if (player.race === 'Goblinoid') {
            bonusMultiplier += 0.1; 
            if (player.level >= 20 && player.rollForEffect(0.2, 'Goblinoid Sell Bonus')) {
                bonusMultiplier += 0.2; 
                addToLog("Sticky Fingers! You swindle some extra coin!", "text-green-300");
            }
        }

        // 2. Skill Bonuses
        if (player.isSkillActive('mercantile_intuition')) bonusMultiplier += 0.10;
        if (player.isSkillActive('magnates_ledger')) bonusMultiplier += 0.15;
        if (player.isSkillActive('grandmasters_touch') && ['weapons', 'armor', 'shields', 'catalysts'].includes(category)) bonusMultiplier += 0.10;
        if (player.isSkillActive('verdant_transmutation') && ['items', 'lures'].includes(category)) bonusMultiplier += 0.20;

        finalSellPrice = Math.floor(finalSellPrice * bonusMultiplier);

        player.gold += finalSellPrice;
        addToLog(`You sold ${details.name} for ${finalSellPrice} G.`, 'text-yellow-400');
        updateStatsView();
        renderSell();
    } else {
        addToLog("Could not find the item to sell.", 'text-red-400');
    }
}

// *** CORRECTED useItem function definition ***
function useItem(itemKey, inBattle = false, targetIndex = null) {
    // 1. Validate Item
    const initialCount = Number(player.inventory.items[itemKey]) || 0; 
    if (initialCount < 1) { 
        addToLog("You don't have that item!", 'text-red-400');
        if (inBattle) {
            gameState.isPlayerTurn = true; 
            isProcessingAction = false; 
        }
        return false; 
    }

    const details = ITEMS[itemKey];

    // --- TYPE 4: TRAPS (Battle Only) ---
    if (details.type === 'trap' && inBattle) {
        // targetIndex represents {x, y} for traps
        if (!targetIndex || typeof targetIndex.x === 'undefined') {
             addToLog("Error: No location selected for trap.", 'text-red-400');
             gameState.isPlayerTurn = true;
             isProcessingAction = false;
             return false;
        }

        const { x, y } = targetIndex;

        // Check for existing objects
        const existing = gameState.gridObjects.find(o => o.x === x && o.y === y);
        if (existing && existing.type !== 'magma') {
             addToLog("Cannot place trap there.", 'text-red-400');
             gameState.isPlayerTurn = true;
             isProcessingAction = false;
             return false;
        }

        // Consume
        player.inventory.items[itemKey]--;
        if (player.inventory.items[itemKey] <= 0) delete player.inventory.items[itemKey];

        addToLog(`You scatter ${details.name} on the ground!`, 'text-gray-300');

        // Place Trap Object
        gameState.gridObjects.push({
            type: 'trap',
            subtype: 'caltrops',
            x: x,
            y: y,
            emoji: '✴️', 
            name: 'Caltrops',
            damagePercent: details.effect.damagePercent,
            // Infinite duration until stepped on
            duration: Infinity 
        });

        gameState.isPlayerTurn = false;
        finalizePlayerAction();
        return true;
    }

    // --- EXISTING ITEM TYPES (Forward to standard logic) ---
    // Determine target entity for standard items
    let target = player;
    if (inBattle && typeof targetIndex === 'number') {
        if (targetIndex === -1) {
             if (player.npcAlly && player.npcAlly.hp > 0) target = player.npcAlly;
             else { addToLog("Invalid ally target.", 'text-red-400'); isProcessingAction = false; return false; }
        } else {
             target = currentEnemies[targetIndex]; // Offensive item
        }
    }
    
    const targetName = (target === player) ? "You" : target.name;
    const verb = (target === player) ? "use" : "use on";
    addToLog(`${targetName} ${verb} a <span class="font-bold text-green-300">${details.name}</span>.`);

    if (inBattle) gameState.isPlayerTurn = false; 

    // --- TYPE 1: EXPERIMENTAL (Concoctions) ---
    if (details.type === 'experimental') {
        player.inventory.items[itemKey]--;
        if (player.inventory.items[itemKey] <= 0) delete player.inventory.items[itemKey];

        const tier = details.tier;
        const numEffects = tier;
        addToLog("The concoction bubbles violently as you drink it...", "text-purple-400");

        setTimeout(() => {
            for (let i = 0; i < numEffects; i++) {
                const isGood = Math.random() < 0.33; 
                const effectPool = isGood ? MYSTERIOUS_CONCOCTION_EFFECTS.good : MYSTERIOUS_CONCOCTION_EFFECTS.bad;
                const randomEffect = effectPool[Math.floor(Math.random() * effectPool.length)];
                addToLog(randomEffect.message, isGood ? 'text-green-300' : 'text-red-400');
                randomEffect.apply(player); 
                updateStatsView(); 
            }
            if (inBattle) finalizePlayerAction(); 
            else renderInventory(); 
        }, 1000); 
        return true; 
    }

    // --- TYPE 2: TARGETING ITEMS (Offensive) ---
    if ((details.type === 'debuff_apply' || details.type === 'debuff_special' || (details.type === 'enchant' && inBattle)) && inBattle) {
        const enemyTarget = currentEnemies[targetIndex]; 
        if (targetIndex === null || !enemyTarget || !enemyTarget.isAlive()) {
            addToLog("You must select a valid target.", 'text-red-400');
            if(inBattle) renderBattle('item'); 
            gameState.isPlayerTurn = true; 
            isProcessingAction = false; 
            return false; 
        }

        // Consume Item
        player.inventory.items[itemKey]--;
        if (player.inventory.items[itemKey] <= 0) delete player.inventory.items[itemKey];

        // Apply Minor Damage (Bombs/Stones)
        if ((details.type === 'debuff_apply' || details.type === 'debuff_special') && details.effect.damage) {
            enemyTarget.takeDamage(details.effect.damage, {element: details.effect.element || 'none'});
            addToLog(`The ${details.name} hits ${enemyTarget.name} for minor damage.`);
        }

        // Apply Debuffs
        if (details.type === 'debuff_apply') {
            enemyTarget.statusEffects[details.effect.type] = { ...details.effect }; 
            addToLog(`${enemyTarget.name} is affected by the ${details.name}!`);
        } else if (details.type === 'debuff_special') { 
            player.statusEffects[details.effect.type] = { ...details.effect }; 
            addToLog(`You feel the power of the ${details.name} coursing through you!`);
        }
        
        // Essence Damage (Enchant)
        else if (details.type === 'enchant' && inBattle) {
            const element = itemKey.replace('_essence', '');
            const damageRoll = rollDice(1, 8, 'Essence Attack');
            let damage = damageRoll.total + player.magicalDamageBonus;

            // Elemental Racial
            if (player.race === 'Elementals' && element === player.elementalAffinity) {
                const damageBonus = (player.level >= 20) ? 1.20 : 1.10;
                damage = Math.floor(damage * damageBonus);
                if (player.level >= 20) damage += rollDice(1, 8, 'Elemental Essence Evo').total; 
            }
            // Dragonborn Racial
            if (player.race === 'Dragonborn') {
                const damageBonus = (player.level >= 20) ? 1.20 : 1.10;
                damage = Math.floor(damage * damageBonus);
            }
            
            // [NEW] Essence Mastery (Double Damage)
            if (player.isSkillActive('essence_mastery')) {
                damage = Math.floor(damage * 2);
                addToLog("Essence Resonance doubles the power!", "text-cyan-300");
            }

            addToLog(`You channel the ${details.name}, unleashing a blast of ${element} energy!`, 'text-yellow-300');
            const finalDamage = enemyTarget.takeDamage(damage, { isMagic: true, element: element }); 
            addToLog(`It hits ${enemyTarget.name} for <span class="font-bold text-purple-400">${finalDamage.damageDealt}</span> ${element} damage.`);
        }

        updateStatsView(); 
        if (!gameState.battleEnded) checkBattleStatus(true); 
        finalizePlayerAction(); 
        return true; 
    }

    // --- TYPE 3: STANDARD CONSUMABLES (Healing/Buffs) ---
    if (details.type !== 'debuff_apply' && details.type !== 'debuff_special' && !(details.type === 'enchant' && inBattle)) {
        
        // Calculate Potency Multipliers
        let boostMult = 1.0;
        let durationMult = 1.0;

        // [FIX: IRON STOMACH]
        // Checks for passive skill to boost potions by 25%
        if (player.isSkillActive('iron_stomach')) {
            boostMult *= 1.25;
            durationMult *= 1.25;
            addToLog("Iron Stomach: Effects boosted by 25%!", "text-cyan-300 text-xs");
        }
        
        // Apothecary's Compendium (Stacks Multiplicatively)
        if (player.isSkillActive('apothecary_wisdom')) {
            boostMult *= 1.25; 
        }

        // Consume Item
        player.inventory.items[itemKey]--;
        if (player.inventory.items[itemKey] <= 0) delete player.inventory.items[itemKey];

        // Apply Effect
        if (details.type === 'healing') {
            const healAmount = Math.floor(details.amount * boostMult);
            target.hp = Math.min(target.maxHp, target.hp + healAmount);
            addToLog(`${targetName} recover${(target === player) ? '' : 's'} <span class="font-bold text-green-400">${healAmount}</span> HP.`, 'text-green-300');
        } 
        else if (details.type === 'mana_restore') {
            const restoreAmount = Math.floor(details.amount * boostMult);
            target.mp = Math.min(target.maxMp, target.mp + restoreAmount);
            addToLog(`${targetName} restore${(target === player) ? '' : 's'} <span class="font-bold text-blue-400">${restoreAmount}</span> MP.`, 'text-blue-300');
        } 
        else if (details.type === 'buff' && details.effect) {
            const buffData = { ...details.effect };
            // Apply Duration Boost
            if (buffData.duration && buffData.duration !== Infinity) {
                buffData.duration = Math.ceil(buffData.duration * durationMult);
            }
            target.statusEffects[details.effect.type] = buffData;
            addToLog(`${targetName} feel${(target === player) ? '' : 's'} the effects of the ${details.name}!`, 'text-yellow-300');
        } 
        else if (details.type === 'cleanse' || details.type === 'cleanse_specific') {
            const effectsToCleanse = details.type === 'cleanse' 
                ? ['poison', 'petrified', 'paralyzed', 'swallowed', 'toxic', 'drenched'] 
                : (details.effects_to_cleanse || []);
            
            let cleansed = false;
            for (const effect of effectsToCleanse) {
                if (target.statusEffects[effect]) {
                    delete target.statusEffects[effect];
                    cleansed = true;
                }
            }
            if (cleansed) addToLog(`${targetName} feel${(target === player) ? '' : 's'} purified.`, 'text-cyan-300');
            else addToLog(`...but nothing happened.`, 'text-gray-400');
        }
    }

    updateStatsView(); 
    if (inBattle && target !== player) renderBattleGrid(); 

    if (!inBattle) renderInventory(); 
    else finalizePlayerAction(); 
    
    return true; 
}

function equipItem(itemKey, inBattle = false) {
    const details = getItemDetails(itemKey);
    if (!details || !player) return;

    let turnConsumed = false;
    if (inBattle) {
        if (!gameState.isPlayerTurn || isProcessingAction) {
            addToLog("Cannot change gear right now.", 'text-red-400');
            return;
        }
        isProcessingAction = true;
        gameState.isPlayerTurn = false;
        turnConsumed = true;
    }

    let itemType = null;
    if (WEAPONS[itemKey]) itemType = 'weapon';
    else if (CATALYSTS[itemKey]) itemType = 'catalyst';
    else if (SHIELDS[itemKey]) itemType = 'shield';
    else if (ARMOR[itemKey]) itemType = 'armor';
    else if (LURES[itemKey]) itemType = 'lure';

    // ... (Inventory check logic remains the same, omitted for brevity, assume standard check) ...

    if (itemType === 'armor') {
        if (player.equippedArmor.name === details.name) return;
        player.equippedArmor = details;
        const storedArmorEnchantment = player.enchantments[itemKey];
        player.armorElement = storedArmorEnchantment || 'none';
        if (turnConsumed) addToLog(`You spend your turn equipping the ${details.name}.`, 'text-yellow-300');
        addToLog(`Equipped: <span class="font-bold text-cyan-300">${details.name}</span>.`);
        updateStatsView();
        if (inBattle) returnToBattleFromInventory();
        else renderInventory();
        return;
    }
    
    if (itemType === 'lure') {
        if (inBattle) { addToLog("Cannot change lures during battle.", 'text-red-400'); return; }
        player.equippedLure = itemKey;
        addToLog(`Equipped: <span class="font-bold text-cyan-300">${details.name}</span>.`);
        updateStatsView();
        renderInventory();
        return;
    }

    // --- WEAPON / SHIELD / CATALYST LOGIC ---
    if (itemType) {
        // Check Two-Handed Constraints
        let isTwoHanded = false;
        if (itemType === 'weapon') {
            isTwoHanded = details.class === 'Hand-to-Hand' || details.effect?.dualWield;
            
            // Beastkin Lvl 20 Exception
            if (isTwoHanded && details.class === 'Hand-to-Hand' && player.race === 'Beastkin' && player.level >= 20) isTwoHanded = false;
            
            // --- FIX: Titan's Grip Exception ---
            if (isTwoHanded && details.class === 'Hand-to-Hand' && player.isSkillActive('titans_grip') && player.skillToggles['iron_mountain']) {
                isTwoHanded = false;
            }

            if (isTwoHanded) {
                if (player.equippedShield?.name !== SHIELDS['no_shield'].name) unequipItem('shield', false, false);
                if (player.equippedCatalyst?.name !== CATALYSTS['no_catalyst'].name) unequipItem('catalyst', false, false);
            }
        }

        // Check if existing weapon prevents this equip
        let isEquippedWeaponTwoHanded = player.equippedWeapon?.class === 'Hand-to-Hand' || player.equippedWeapon?.effect?.dualWield;
        
        // Beastkin Exception (Existing)
        if (isEquippedWeaponTwoHanded && player.equippedWeapon?.class === 'Hand-to-Hand' && player.race === 'Beastkin' && player.level >= 20) isEquippedWeaponTwoHanded = false;
        
        // --- FIX: Titan's Grip Exception (Existing) ---
        if (isEquippedWeaponTwoHanded && player.equippedWeapon?.class === 'Hand-to-Hand' && player.isSkillActive('titans_grip') && player.skillToggles['iron_mountain']) {
             isEquippedWeaponTwoHanded = false;
        }

        if ((itemType === 'shield' || itemType === 'catalyst') && isEquippedWeaponTwoHanded) {
            addToLog(`Cannot use a ${itemType} while using ${player.equippedWeapon.name}.`, 'text-red-400');
            if (turnConsumed) { isProcessingAction = false; gameState.isPlayerTurn = true; }
            return;
        }

        // Handle Equipment Order (2-of-3 rule)
        if (!Array.isArray(player.equipmentOrder)) player.equipmentOrder = [];
        const typeIndex = player.equipmentOrder.indexOf(itemType);
        if (typeIndex > -1) player.equipmentOrder.splice(typeIndex, 1);
        
        if (player.equipmentOrder.length >= 2) {
            const typeToUnequip = player.equipmentOrder.shift();
            if (typeToUnequip !== itemType) unequipItem(typeToUnequip, false, false);
        }
        player.equipmentOrder.push(itemType);

        // Equip
        if (itemType === 'weapon') {
            player.equippedWeapon = details;
            const stored = player.enchantments[itemKey];
            player.weaponElement = stored || 'none';
        } else if (itemType === 'catalyst') {
            player.equippedCatalyst = details;
        } else if (itemType === 'shield') {
            player.equippedShield = details;
            const stored = player.enchantments[itemKey];
            player.shieldElement = stored || 'none';
        }

        if (turnConsumed) addToLog(`You spend your turn equipping the ${details.name}.`, 'text-yellow-300');
        addToLog(`Equipped: <span class="font-bold text-cyan-300">${details.name}</span>.`);
        updateStatsView();
        
        if (inBattle) returnToBattleFromInventory();
        else renderInventory();
    }
}

/**
 * Unequips an item of the specified type, returning it to inventory.
 * MODIFIED: Stops adding the item key back if it's already present. Ensures immediate return in battle.
 * @param {string} itemType - The type of item to unequip ('weapon', 'catalyst', 'armor', 'shield', 'lure').
 * @param {boolean} [shouldRender=true] - Whether to re-render the inventory (if open).
 * @param {boolean} [inBattle=false] - Whether this action happens during battle.
 */
function unequipItem(itemType, shouldRender = true, inBattle = false) {
    if (!player) return;

    if (inBattle) {
        if (!gameState.isPlayerTurn || isProcessingAction) {
            addToLog("Cannot change gear right now.", 'text-red-400');
            return;
        }
    }

    // 1. Actually unequip the item in data
    const unequippedKey = player.unequipItem(itemType, false);

    if (unequippedKey) {
        // [FIX] Force a full recalculation of derived stats immediately
        if (typeof player.calculateStats === 'function') {
            player.calculateStats(); 
        }

        // [FIX] Explicitly nullify the reference if the class didn't do it
        // This ensures checks like `!player.equippedArmor` work instantly
        if (itemType === 'armor') player.equippedArmor = null;
        if (itemType === 'shield') player.equippedShield = null;
        if (itemType === 'weapon') player.equippedWeapon = null; // Careful with weapon, usually sets to Fists

        if (inBattle) {
            addToLog("Turn consumed.", "text-yellow-300 text-xs");
            isProcessingAction = true;
            gameState.isPlayerTurn = false;
            updateStatsView();
            returnToBattleFromInventory();
        } else {
            updateStatsView();
            if (shouldRender && gameState.currentView === 'inventory') {
                renderInventory();
            }
            if (shouldRender && gameState.currentView === 'character_sheet') {
                renderCharacterSheet();
            }
        }
    } else {
        if (inBattle) {
            isProcessingAction = false;
            gameState.isPlayerTurn = true;
        }
    }
}

function brewWitchPotion(recipeKey) {
    const recipe = WITCH_COVEN_RECIPES[recipeKey];
    if (!recipe || !recipe.hearts) return; // Ensure it's a potion recipe
    let brewCost = recipe.cost;
    if (player.isSkillActive('apothecary_wisdom')) {
        brewCost = Math.floor(brewCost * 0.75); // 25% Off
    }
    if (player.gold < brewCost) {
        addToLog(`You need ${recipe.cost} Gold.`, 'text-red-400');
        return;
    }
    const hearts = player.inventory.items['undying_heart'] || 0;
    if (hearts < recipe.hearts) {
        addToLog(`You need ${recipe.hearts} Undying Hearts.`, 'text-red-400');
        return;
    }
    for (const ingredientKey in recipe.ingredients) {
        if ((player.inventory.items[ingredientKey] || 0) < recipe.ingredients[ingredientKey]) {
            addToLog(`You lack the required ingredients. Need ${recipe.ingredients[ingredientKey]}x ${getItemDetails(ingredientKey).name}.`, 'text-red-400');
            return;
        }
    }

    // Consume resources
    player.gold -= brewCost;
    player.inventory.items['undying_heart'] -= recipe.hearts;
    if (player.inventory.items['undying_heart'] <= 0) delete player.inventory.items['undying_heart'];

    for (const ingredientKey in recipe.ingredients) {
        player.inventory.items[ingredientKey] -= recipe.ingredients[ingredientKey];
        if (player.inventory.items[ingredientKey] <= 0) delete player.inventory.items[ingredientKey];
    }

    // Add product
    player.addToInventory(recipe.output, 1, false); // Add silently first
    const productDetails = getItemDetails(recipe.output);
    addToLog(`You successfully brewed a <span class="font-bold text-green-300">${productDetails.name}</span>!`);

    // Check quest progress
    if (player.activeQuest && player.activeQuest.category === 'creation' && player.activeQuest.target === recipe.output) {
        player.questProgress++;
        addToLog(`Quest progress: ${player.questProgress}/${getQuestDetails(player.activeQuest).required}`, 'text-amber-300');
    }

    updateStatsView(); // Update gold/hearts display
    renderWitchsCoven('brew'); // Re-render brew screen
}

function transmuteWitchItem(recipeKey) {
    const recipe = WITCH_COVEN_RECIPES[recipeKey];
    if (!recipe || recipe.hearts) return; // Ensure it's a transmute recipe

    if (player.gold < recipe.cost) {
        addToLog(`You need ${recipe.cost} Gold.`, 'text-red-400');
        return;
    }
    for (const ingredientKey in recipe.ingredients) {
        if ((player.inventory.items[ingredientKey] || 0) < recipe.ingredients[ingredientKey]) {
            addToLog(`You lack the required ingredients. Need ${recipe.ingredients[ingredientKey]}x ${getItemDetails(ingredientKey).name}.`, 'text-red-400');
            return;
        }
    }

    // Consume resources
    player.gold -= recipe.cost;
    for (const ingredientKey in recipe.ingredients) {
        player.inventory.items[ingredientKey] -= recipe.ingredients[ingredientKey];
        if (player.inventory.items[ingredientKey] <= 0) delete player.inventory.items[ingredientKey];
    }

    // Add product
    player.addToInventory(recipe.output, 1); // Log the item received
    updateStatsView(); // Update gold display
    renderWitchsCoven('transmute'); // Re-render transmute screen
}

function resetStatsCoven() {
    const cost = WITCH_COVEN_SERVICES.resetStats;
    const hearts = player.inventory.items['undying_heart'] || 0;
    if (player.gold < cost.gold || hearts < cost.hearts) {
        addToLog("You lack the required payment to reset your fate.", 'text-red-400');
        return;
    }

    player.gold -= cost.gold;
    player.inventory.items['undying_heart'] -= cost.hearts;
    if(player.inventory.items['undying_heart'] <= 0) delete player.inventory.items['undying_heart'];

    const pointsToRefund = (player.bonusVigor || 0) + (player.bonusFocus || 0) + (player.bonusStamina || 0) + (player.bonusStrength || 0) + (player.bonusIntelligence || 0) + (player.bonusLuck || 0);
    player.statPoints = (player.statPoints || 0) + pointsToRefund;

    // --- FIX: Recalculate base stats from scratch (Race + Class) ---
    // This ensures any corrupted base stats are fixed to their Lvl 1 defaults.
    const raceData = RACES[player.race];
    const classData = CLASSES[player._classKey];

    if (!raceData || !classData) {
        addToLog("Critical Error: Cannot find Race or Class data. Stat reset aborted.", "text-red-500");
        // Refund the cost if we abort here
        player.gold += cost.gold;
        player.inventory.items['undying_heart'] = hearts; // (This is slightly buggy if they had 0, but good enough)
        player.statPoints -= pointsToRefund; // Take back points
        return;
    }
    
    // Reset base stats to Level 1 defaults
    player.vigor = (raceData.Vigor || 0) + (classData.bonusStats.Vigor || 0);
    player.focus = (raceData.Focus || 0) + (classData.bonusStats.Focus || 0);
    player.stamina = (raceData.Stamina || 0) + (classData.bonusStats.Stamina || 0);
    player.strength = (raceData.Strength || 0) + (classData.bonusStats.Strength || 0);
    player.intelligence = (raceData.Intelligence || 0) + (classData.bonusStats.Intelligence || 0);
    player.luck = (raceData.Luck || 0) + (classData.bonusStats.Luck || 0);
    // --- END FIX ---

    // Reset bonus stats TO ZERO
    player.bonusVigor = 0;
    player.bonusFocus = 0;
    player.bonusStamina = 0;
    player.bonusStrength = 0;
    player.bonusIntelligence = 0;
    player.bonusLuck = 0;

    // Recalculate derived bonuses based on the now-zero bonus stats
    player.recalculateGrowthBonuses();
    // Refresh HP/MP based on potentially changed max values (though they shouldn't change much without bonus stats)
    player.hp = player.maxHp;
    player.mp = player.maxMp;


    addToLog("The witch chants, and you feel your body's potential restored. Your stats have been reset.", 'text-purple-300');
    updateStatsView(); // Update UI
    saveGame(); // Save changes
    setTimeout(() => renderCharacterSheet(true), 1000); // Show stat allocation screen
}

function changeCharacterAspect(aspectType, newKey) {
    const costs = {
        race: WITCH_COVEN_SERVICES.changeRace,
        class: WITCH_COVEN_SERVICES.changeClass,
        background: WITCH_COVEN_SERVICES.changeBackground
    };
    const cost = costs[aspectType];
    const hearts = player.inventory.items['undying_heart'] || 0;


     if (player.gold < cost.gold || hearts < cost.hearts) {
        addToLog("You lack the required payment for such a powerful ritual.", 'text-red-400');
        return;
    }

    // Additional check for Elemental race change
    let newAffinity = null;
    if (aspectType === 'race' && newKey === 'Elementals') {
        newAffinity = document.getElementById('race-change-select-affinity')?.value || 'fire'; // Get affinity or default to fire
    }


    // Consume resources FIRST
    player.gold -= cost.gold;
    player.inventory.items['undying_heart'] -= cost.hearts;
    if(player.inventory.items['undying_heart'] <= 0) delete player.inventory.items['undying_heart'];


    // --- Reverse old bonuses ---
    // Background: No stats to reverse directly, handled by recalculateGrowthBonuses
    // Class:
    if (aspectType === 'class') {
        const oldClassKey = player._classKey; // Use stored key
        if (oldClassKey && CLASSES[oldClassKey]) { // Check if key and data exist
            const oldClassData = CLASSES[oldClassKey];
            for (const stat in oldClassData.bonusStats) {
                // Subtract bonus from BASE stat
                player[stat.toLowerCase()] = (player[stat.toLowerCase()] || 0) - (oldClassData.bonusStats[stat] || 0);
            }
        }
    }
    // Race:
    else if (aspectType === 'race') {
        const oldRaceData = RACES[player.race]; // Use current race key
        if(oldRaceData) {
            // Subtract base stats
            player.vigor = (player.vigor || 0) - (oldRaceData.Vigor || 0);
            player.focus = (player.focus || 0) - (oldRaceData.Focus || 0);
            player.stamina = (player.stamina || 0) - (oldRaceData.Stamina || 0);
            player.strength = (player.strength || 0) - (oldRaceData.Strength || 0);
            player.intelligence = (player.intelligence || 0) - (oldRaceData.Intelligence || 0);
            player.luck = (player.luck || 0) - (oldRaceData.Luck || 0);
        }
    }

    // --- Apply new aspect ---
    if (aspectType === 'class') {
        const newClassData = CLASSES[newKey];
        player.class = newClassData.name; // Set new class NAME
        player._classKey = newKey; // *** SET NEW CLASS KEY ***
        for (const stat in newClassData.bonusStats) {
             // Add bonus to BASE stat
            player[stat.toLowerCase()] = (player[stat.toLowerCase()] || 0) + (newClassData.bonusStats[stat] || 0);
        }
         player.updateAbilityReferences(); // Update ability data reference
    } else if (aspectType === 'race') {
        const newRaceData = RACES[newKey];
        player.race = newKey; // Set new race KEY
        player.elementalAffinity = newAffinity; // Set new affinity (will be null if not Elemental)
        // Add new base stats
        player.vigor = (player.vigor || 0) + (newRaceData.Vigor || 0);
        player.focus = (player.focus || 0) + (newRaceData.Focus || 0);
        player.stamina = (player.stamina || 0) + (newRaceData.Stamina || 0);
        player.strength = (player.strength || 0) + (newRaceData.Strength || 0);
        player.intelligence = (player.intelligence || 0) + (newRaceData.Intelligence || 0);
        player.luck = (player.luck || 0) + (newRaceData.Luck || 0);
         player.updateAbilityReferences(); // Update passive reference
    } else if (aspectType === 'background') {
        player.background = BACKGROUNDS[newKey].name; // Set new background NAME
        player.backgroundKey = newKey; // Set new background KEY
        // RecalculateGrowthBonuses will handle applying the new derived bonuses
    }

    // --- Final Recalculations ---
    player.recalculateGrowthBonuses(); // Apply new derived bonuses based on background/points
    player.hp = player.maxHp; // Refresh HP/MP
    player.mp = player.maxMp;

    addToLog("The world shifts around you. You are... different.", 'text-purple-300 font-bold');
    updateStatsView(); // Update UI
    saveGame(); // Save changes
    renderWitchsCoven('rebirth'); // Re-render rebirth screen
}

function resetSkillsCoven() {
    // 1. Calculate spent mastery points
    let spentMastery = 0;
    player.unlockedSkills.forEach(skillId => {
        if (SKILL_TREE[skillId] && SKILL_TREE[skillId].costType === 'mastery') {
            spentMastery++;
        }
    });

    const service = WITCH_COVEN_SERVICES.resetSkills;
    const totalGold = service.base.gold + (spentMastery * service.perMastery.gold);
    const totalHearts = service.base.hearts + (spentMastery * service.perMastery.hearts);

    const hearts = player.inventory.items['undying_heart'] || 0;

    if (player.gold < totalGold || hearts < totalHearts) {
        addToLog(`You lack the required payment. Need: <span class="text-yellow-400">${totalGold} G</span>, <span class="text-purple-300">${totalHearts} Hearts</span>.`, 'text-red-400');
        return;
    }

    // 2. Consume Resources
    player.gold -= totalGold;
    player.inventory.items['undying_heart'] -= totalHearts;
    if (player.inventory.items['undying_heart'] <= 0) delete player.inventory.items['undying_heart'];

    // 3. Reset Skills
    player.unlockedSkills = ['the_root']; // Keep root
    player.equippedSkills = []; // Clear loadout
    player.skillToggles = {}; // Clear active toggles
    
    // 4. Recalculate Points
    // This function (added in previous steps) calculates available points based on level vs spent.
    // Since spent is now 0 (mostly), it will refund everything.
    player.recalculateSkillPoints();

    addToLog("The Witch unravels your fate. Your skills have been forgotten, allowing you to forge a new path.", 'text-purple-300 font-bold');
    updateStatsView();
    saveGame();
    renderWitchsCoven('reset_skills'); // Re-render to update cost display
}

function determineBrewingOutcome(ingredients) {
    const alchemyTier = player.house.alchemyTier || 1;
    
    // --- Helper to check if a key is a specific item or a generic category ---
    // In this game, specific items have details in ITEMS. Generics (meat, veggie) do not.
    const isSpecificItem = (key) => !!getItemDetails(key);

    // Loop all recipes to find a match
    for (const recipeKey in ALCHEMY_RECIPES) {
        const recipe = ALCHEMY_RECIPES[recipeKey];
        
        // 1. Check Tier (Allow brewing lower tier recipes in higher tier labs)
        if (recipe.tier > alchemyTier) continue;

        const recipeIngredients = recipe.ingredients;
        let isMatch = true;
        
        // 2. Create a mutable copy of the provided ingredients to track consumption
        // We use a list of keys: ['sunshine_flower', 'water_essence', ...]
        let availableIngredients = [...ingredients]; 

        // 3. Sort requirements: Process Specific items FIRST, then Generics.
        // This prevents a generic requirement from "eating" an item needed for a specific requirement.
        const reqKeys = Object.keys(recipeIngredients).sort((a, b) => {
            const aSpecific = isSpecificItem(a);
            const bSpecific = isSpecificItem(b);
            return bSpecific - aSpecific; // true (1) comes before false (0)
        });

        const ingredientsToConsume = {}; // For output tracking

        for (const reqKey of reqKeys) {
            const count = recipeIngredients[reqKey];
            const isReqSpecific = isSpecificItem(reqKey);

            for (let i = 0; i < count; i++) {
                let foundIndex = -1;

                if (isReqSpecific) {
                    // Look for exact ID match
                    foundIndex = availableIngredients.indexOf(reqKey);
                } else {
                    // Look for type match (Cooking Type OR Alchemy Type)
                    foundIndex = availableIngredients.findIndex(itemKey => {
                        const details = getItemDetails(itemKey);
                        if (!details) return false;
                        return (details.cookingType === reqKey) || (details.alchemyType === reqKey);
                    });
                }

                if (foundIndex !== -1) {
                    // Match found! Consume it.
                    const usedItem = availableIngredients[foundIndex];
                    availableIngredients.splice(foundIndex, 1);
                    
                    // Track for consumption object
                    ingredientsToConsume[usedItem] = (ingredientsToConsume[usedItem] || 0) + 1;
                } else {
                    // Requirement not met
                    isMatch = false;
                    break;
                }
            }
            if (!isMatch) break;
        }

        // 4. Strict Match Check: Ensure no extra ingredients were provided
        if (isMatch && availableIngredients.length === 0) {
            return { 
                success: true, 
                potion: recipe.output, 
                message: `You successfully brewed a ${getItemDetails(recipe.output).name}!`,
                ingredientsToConsume: ingredientsToConsume 
            };
        }
    }

    // --- FALLBACK: Mysterious Concoction (Failure) ---
    const failurePotion = `mysterious_concoction_t${alchemyTier}`;
    const failureMessage = "The mixture bubbles violently and settles into a strange, unpredictable brew...";

    // Consume everything currently in the slots
    const consumeAll = ingredients.reduce((acc, key) => {
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {});

    return { 
        success: false, 
        potion: failurePotion, 
        message: failureMessage,
        ingredientsToConsume: consumeAll
    };
}

function brewHomePotion(outcome) {
    const ingredientCounts = outcome.ingredientsToConsume;
    let batchCost = 0;

    // Consume ingredients & Calculate Cost
    for(const key in ingredientCounts) {
        if (player.inventory.items[key]) {
             // Calculate cost for this ingredient
             const details = getItemDetails(key);
             if (details && details.price) {
                 batchCost += (details.price * ingredientCounts[key]);
             }

             player.inventory.items[key] -= ingredientCounts[key];
            if(player.inventory.items[key] <= 0) {
                delete player.inventory.items[key];
            }
        }
    }

    addToLog(outcome.message, outcome.success ? 'text-green-400' : 'text-purple-400');
    
    // --- UPDATED: Pass isCrafted=true AND the batchCost ---
    // If it failed (outcome.success=false), we still give the failure potion (e.g. mysterious_concoction)
    // and it still costs ingredients, so it should have a value.
    player.addToInventory(outcome.potion, 1, false, true, batchCost); 
    // -------------------------------------------------------

    // Quest progress check (unchanged)
    if (player.activeQuest && player.activeQuest.category === 'creation' && player.activeQuest.target === outcome.potion) {
        player.questProgress++;
        addToLog(`Quest progress: ${player.questProgress}/${getQuestDetails(player.activeQuest).required}`, 'text-amber-300');
    }
     updateStatsView(); 
    return true; 
}


function craftGear(recipeKey, sourceShop) {
    const recipe = (sourceShop === 'magic' ? MAGIC_SHOP_RECIPES[recipeKey] : BLACKSMITH_RECIPES[recipeKey]);
    if (!recipe) return;

    let craftCost = recipe.cost;

    // --- NEW: Crafting Cost Reductions ---
    if (sourceShop === 'blacksmith' && player.isSkillActive('forge_economy')) {
        craftCost = Math.floor(craftCost * 0.75); // 25% Off
        // Optional log: addToLog("Steel-Shaper's Thrift applied!", "text-green-300");
    } else if (sourceShop === 'magic' && player.isSkillActive('resonant_synthesis')) {
        craftCost = Math.floor(craftCost * 0.75); // 25% Off
        // Optional log: addToLog("Resonant Synthesis applied!", "text-cyan-300");
    }

    let hasIngredients = true;
    for (const ingredientKey in recipe.ingredients) {
        const requiredAmount = recipe.ingredients[ingredientKey];

        let playerAmount = 0;
        // Check different inventory categories
        if (ITEMS[ingredientKey]) {
            playerAmount = player.inventory.items[ingredientKey] || 0;
        } else if (ARMOR[ingredientKey]) {
            playerAmount = player.inventory.armor.filter(i => i === ingredientKey).length;
        } else if (WEAPONS[ingredientKey]) { // Check weapons if needed
             playerAmount = player.inventory.weapons.filter(i => i === ingredientKey).length;
        } else if (SHIELDS[ingredientKey]) { // Check shields
             playerAmount = player.inventory.shields.filter(i => i === ingredientKey).length;
        } else if (CATALYSTS[ingredientKey]) { // Check catalysts
             playerAmount = player.inventory.catalysts.filter(i => i === ingredientKey).length;
        }
        // Add more checks if other categories can be ingredients


        if (playerAmount < requiredAmount) {
             addToLog(`You need ${requiredAmount}x ${getItemDetails(ingredientKey).name}.`, 'text-red-400'); // More specific feedback
            hasIngredients = false;
            break; // Stop checking if one ingredient is missing
        }
    }


    if (!hasIngredients) {
        // Log message already added in the loop
        return;
    }
    if (player.gold < craftCost) { // Use modified cost
        addToLog("You can't afford the fee.", 'text-red-400');
        return;
    }

    // Subtract materials and gold
    for (const ingredientKey in recipe.ingredients) {
        const requiredAmount = recipe.ingredients[ingredientKey];
        if (ITEMS[ingredientKey]) {
            player.inventory.items[ingredientKey] -= requiredAmount;
            if (player.inventory.items[ingredientKey] <= 0) {
                delete player.inventory.items[ingredientKey];
            }
        } else {
             // Find the correct category to remove from
             let category = '';
             if (ARMOR[ingredientKey]) category = 'armor';
             else if (WEAPONS[ingredientKey]) category = 'weapons';
             else if (SHIELDS[ingredientKey]) category = 'shields';
             else if (CATALYSTS[ingredientKey]) category = 'catalysts';

             if (category && player.inventory[category]) {
                for(let i = 0; i < requiredAmount; i++) {
                    const index = player.inventory[category].indexOf(ingredientKey);
                    if (index > -1) {
                        player.inventory[category].splice(index, 1);
                    } else {
                         console.error(`Could not find item ${ingredientKey} in category ${category} to remove during crafting.`);
                         // Handle potential error - maybe cancel crafting? For now, just log.
                         break;
                    }
                }
            }
        }

    }
    player.gold -= recipe.cost;

    player.addToInventory(recipe.output, 1, false); // Add silently first
    const craftedItemDetails = getItemDetails(recipe.output);
    addToLog(`You successfully created a <span class="font-bold text-green-300">${craftedItemDetails.name}</span>!`);

    if (player.activeQuest && player.activeQuest.category === 'creation' && player.activeQuest.target === recipe.output) {
        player.questProgress++;
        addToLog(`Quest progress: ${player.questProgress}/${getQuestDetails(player.activeQuest).required}`, 'text-amber-300');
    }

    updateStatsView(); // Update gold display
    // Re-render the correct crafting screen
    if (sourceShop === 'magic') {
        renderSageTowerCraft();
    } else {
        renderBlacksmithCraft();
    }
}


// --- QUESTS ---
function acceptQuest(category, questKey) {
    if (!player.activeQuest) {
        player.activeQuest = { category, key: questKey };
        player.questProgress = 0; // Reset progress on accepting
        player.questsTakenToday.push(questKey);
        const quest = getQuestDetails(player.activeQuest);
        addToLog(`New quest accepted: <span class="font-bold" style="color: var(--text-accent);">${quest.title}</span>!`);
        updateStatsView(); // Show quest on sidebar
        renderQuestBoard(); // Refresh board UI
    } else {
        addToLog(`You already have an active quest!`);
    }
}
function completeQuest() {
    if (!player.activeQuest) return;
    const quest = getQuestDetails(player.activeQuest);
    if (!quest) return;

    // Verify completion criteria again before completing
     let currentProgress = player.questProgress;
     if (quest.type === 'collection' || quest.type === 'creation') {
          currentProgress = 0; // Recalculate collection count just in case
          const itemDetails = getItemDetails(quest.target);
          if (itemDetails) {
               if (quest.target in ITEMS) { currentProgress = player.inventory.items[quest.target] || 0; }
               else {
                    let category = '';
                    if (quest.target in WEAPONS) category = 'weapons';
                    else if (quest.target in ARMOR) category = 'armor';
                    else if (quest.target in SHIELDS) category = 'shields';
                    else if (quest.target in CATALYSTS) category = 'catalysts';
                    if (category && player.inventory[category]) {
                         currentProgress = player.inventory[category].filter(item => item === quest.target).length;
                    }
               }
          }
     }

     if (currentProgress < quest.required) {
          addToLog(`You haven't met the requirements for "${quest.title}" yet.`, 'text-red-400');
          return; // Prevent completion if criteria not met
     }


    // Consume items for collection/creation quests
    if (quest.type === 'collection' || quest.type === 'creation') {
        const itemDetails = getItemDetails(quest.target);
        if (itemDetails) {
            if (quest.target in ITEMS) {
                 if (player.inventory.items[quest.target]) {
                    player.inventory.items[quest.target] -= quest.required;
                    if (player.inventory.items[quest.target] <= 0) {
                        delete player.inventory.items[quest.target];
                    }
                 }
            } else {
                 let category = '';
                 if (quest.target in WEAPONS) category = 'weapons';
                 else if (quest.target in ARMOR) category = 'armor';
                 else if (quest.target in SHIELDS) category = 'shields';
                 else if (quest.target in CATALYSTS) category = 'catalysts';

                 if (category && player.inventory[category]) {
                    for (let i = 0; i < quest.required; i++) {
                        const index = player.inventory[category].indexOf(quest.target);
                        if (index > -1) {
                            player.inventory[category].splice(index, 1);
                        } else {
                             // This shouldn't happen if completion check passed, but log error just in case
                             console.error(`Error completing quest: Could not find required item ${quest.target} to remove.`);
                             break;
                        }
                    }
                 }
            }
        }
    }
    addToLog(`Quest Complete: <span class="font-bold text-green-400">${quest.title}</span>!`);
    player.gainXp(quest.reward.xp); // Use gainXp for potential multipliers
    player.gold += quest.reward.gold;
    addToLog(`You received ${quest.reward.gold} G.`, 'text-yellow-400');

     // Handle potential item rewards
     if (quest.reward.item) {
        player.addToInventory(quest.reward.item, 1, true); // Add item reward with log
     }


    player.activeQuest = null;
    player.questProgress = 0; // Reset progress
    updateStatsView(); // Update sidebar
    renderQuestBoard(); // Refresh board UI
}

function cancelQuest() {
    if (!player.activeQuest) return;
    const quest = getQuestDetails(player.activeQuest);
    if (!quest) return;

    // Use a scaling penalty based on tier, with a minimum
    const penalty = Math.max(50, (quest.tier || 1) * 25);


    if (player.gold < penalty) {
        addToLog(`You cannot afford the ${penalty} G fee to cancel the quest.`, 'text-red-400');
        return;
    }

    player.gold -= penalty;
    addToLog(`You paid a ${penalty} G fee and abandoned the quest: <span class="font-bold text-yellow-300">${quest.title}</span>.`, 'text-red-400');

    // Remove from 'taken today' so it can potentially reappear
    const questIndex = player.questsTakenToday.indexOf(player.activeQuest.key);
    if (questIndex > -1) {
        player.questsTakenToday.splice(questIndex, 1);
    }


    player.activeQuest = null;
    player.questProgress = 0;

    updateStatsView();
    renderQuestBoard();
}

// MODIFICATION: New functions for player housing
function buildHouse() {
    if (player.level < 4) {
        addToLog("You must be at least level 4 to build a house.", "text-red-400");
        return;
    }
    if (player.gold < 1000) {
        addToLog("You need 1000 Gold to build your house.", "text-red-400");
        return;
    }
    player.gold -= 1000;
    player.house.owned = true;

    // Initialize all house properties if they don't exist (robustness for old saves)
    if (!player.house.storage) player.house.storage = { items: {}, weapons: [], armor: [], shields: [], catalysts: [], lures: {} };
    if (player.house.storageTier === undefined) player.house.storageTier = 0;
    if (player.house.gardenTier === undefined) player.house.gardenTier = 0;
    if (player.house.kitchenTier === undefined) player.house.kitchenTier = 0;
    if (player.house.alchemyTier === undefined) player.house.alchemyTier = 0;
    if (player.house.trainingTier === undefined) player.house.trainingTier = 0;
    if (!player.house.garden || !Array.isArray(player.house.garden)) player.house.garden = [];
    if (!player.house.treePlots || !Array.isArray(player.house.treePlots)) player.house.treePlots = [];


    addToLog("You hand over the gold and the deed is yours! Your new house is ready.", "text-green-400 font-bold");
    saveGame(); // Save the house ownership change
    updateStatsView(); // Update UI if needed
    renderHouse(); // Go directly to the house view
}

async function restAtHouse() {
    player.hp = player.maxHp;
    player.mp = player.maxMp;
     player.questsTakenToday = []; // Reset daily quest limit
     player.seed = Math.floor(Math.random() * 1000000); // Generate new seed for the 'day'
     generateBlackMarketStock(); // Refresh black market stock
     await generateBarracksRoster(); // --- NEW: Refresh Barracks roster ---
     player.clearFoodBuffs(); // Food buffs wear off after resting
    addToLog("You rest in the comfort of your own bed and feel fully restored. Shops and quests have refreshed.", "text-green-400"); // Updated log
    updateStatsView(); // Update HP/MP display
    saveGame(); // Save rested state
    renderHouse(); // Stay in the house view
}


function placeAllInStorage() {
    const storage = player.house.storage;
    const inventory = player.inventory;
    const storageTier = player.house.storageTier || 0;
    const baseLimits = { unique: 10, stack: 10 };
    // Get limits for the *current* tier (index tier - 1)
    const limits = storageTier > 0 ? (HOME_IMPROVEMENTS.storage.upgrades[storageTier - 1]?.limits || baseLimits) : baseLimits;


    // Calculate current unique items in storage
    const allStorageItemsSet = new Set([
        ...Object.keys(storage.items || {}), ...Object.keys(storage.lures || {}),
        ...(storage.weapons || []), ...(storage.armor || []), ...(storage.shields || []), ...(storage.catalysts || [])
    ]);
    let uniqueItemCount = allStorageItemsSet.size;


    let itemsMovedCount = 0;
    let storageFullMessage = ''; // Track if limits were hit

    const categories = ['items', 'lures', 'weapons', 'armor', 'shields', 'catalysts'];

    for (const category of categories) {
         // Ensure source inventory category exists
         if (!inventory[category]) continue;
         // Ensure destination storage category exists
         if (!storage[category]) {
             storage[category] = (category === 'items' || category === 'lures') ? {} : [];
         }


        if (category === 'items' || category === 'lures') {
            const source = inventory[category];
            const destination = storage[category];
            const itemKeys = Object.keys(source);

            for (const itemKey of itemKeys) {
                const details = getItemDetails(itemKey);
                // Skip key items, broken items, or invalid items
                if (!details || details.type === 'key' || details.rarity === 'Broken') continue;


                let spaceInStack = limits.stack - (destination[itemKey] || 0);
                if (spaceInStack <= 0) {
                     storageFullMessage = 'Stack limit reached for some items.';
                     continue; // Skip if stack is full
                }

                let isNewUniqueItem = !allStorageItemsSet.has(itemKey);
                if (isNewUniqueItem && uniqueItemCount >= limits.unique) {
                    storageFullMessage = 'Unique item limit reached.';
                    continue; // Skip if unique limit reached
                }

                const amountToMove = Math.min(source[itemKey], spaceInStack);

                if (amountToMove > 0) {
                    if (isNewUniqueItem) {
                        allStorageItemsSet.add(itemKey); // Add to set immediately
                        uniqueItemCount++;
                    }
                    destination[itemKey] = (destination[itemKey] || 0) + amountToMove;
                    source[itemKey] -= amountToMove;
                    if (source[itemKey] <= 0) delete source[itemKey];
                    itemsMovedCount += amountToMove;
                }
            }
        } else { // Equipment (non-stackable)
            const source = inventory[category];
            const destination = storage[category];

            for (let i = source.length - 1; i >= 0; i--) { // Iterate backwards when removing
                const itemKey = source[i];
                const details = getItemDetails(itemKey);
                // Skip broken or invalid items
                if (!details || details.rarity === 'Broken') continue;


                // Skip equipped items
                const isEquipped = (player.equippedWeapon?.name === details.name && category === 'weapons') || // Add safety checks for equipped items
                                 (player.equippedArmor?.name === details.name && category === 'armor') ||
                                 (player.equippedShield?.name === details.name && category === 'shields') ||
                                 (player.equippedCatalyst?.name === details.name && category === 'catalysts');
                if (isEquipped) continue;


                let isNewUniqueItem = !allStorageItemsSet.has(itemKey);
                if (isNewUniqueItem && uniqueItemCount >= limits.unique) {
                     storageFullMessage = 'Unique item limit reached.';
                    continue; // Skip if unique limit reached
                }

                if (isNewUniqueItem) {
                    allStorageItemsSet.add(itemKey); // Add to set immediately
                    uniqueItemCount++;
                }

                destination.push(itemKey); // Add to storage
                source.splice(i, 1); // Remove from inventory
                itemsMovedCount++;
            }
        }
    }

    if (itemsMovedCount > 0) {
        addToLog(`Moved ${itemsMovedCount} item(s) to storage.`);
    } else {
        addToLog(`No unequipped items to move, or storage is full.`);
    }
    if (storageFullMessage) {
        addToLog(`Could not move all items: ${storageFullMessage}`, 'text-yellow-400');
    }

    renderHouseStorage(); // Refresh UI
}

function takeAllFromStorage() {
    if (!player.house.storage) {
        player.house.storage = { items: {}, weapons: [], armor: [], shields: [], catalysts: [], lures: {} };
    }
    const categories = ['items', 'weapons', 'armor', 'shields', 'catalysts', 'lures'];
    let itemsMovedCount = 0;

    categories.forEach(category => {
         // Ensure storage category exists
         if (!player.house.storage[category]) return;
          // Ensure inventory category exists
         if (!player.inventory[category]) {
             player.inventory[category] = (category === 'items' || category === 'lures') ? {} : [];
         }


        if (category === 'items' || category === 'lures') {
            const source = player.house.storage[category];
            const destination = player.inventory[category];
            for (const itemKey in source) {
                const count = source[itemKey];
                if (count > 0) {
                    destination[itemKey] = (destination[itemKey] || 0) + count;
                    itemsMovedCount += count;
                }
            }
            player.house.storage[category] = {}; // Clear storage category
        } else { // Equipment
            const source = player.house.storage[category];
            const destination = player.inventory[category];
            if (source.length > 0) {
                itemsMovedCount += source.length;
                destination.push(...source); // Add all items to inventory
                player.house.storage[category] = []; // Clear storage category
            }
        }
    });

    if (itemsMovedCount > 0) {
        addToLog(`Moved all items from storage to your inventory.`);
    } else {
        addToLog(`Storage is already empty.`);
    }

    renderHouseStorage(); // Refresh UI
}

function moveToStorage(category, itemKey, index = -1) { // Index might not be needed if we move one at a time based on key
     if (!player.house.storage) {
        player.house.storage = { items: {}, weapons: [], armor: [], shields: [], catalysts: [], lures: {} };
    }
    const details = getItemDetails(itemKey);
    if (!details) return;

    const storageTier = player.house.storageTier || 0;
    const baseLimits = { unique: 10, stack: 10 };
    const limits = storageTier > 0 ? (HOME_IMPROVEMENTS.storage.upgrades[storageTier - 1]?.limits || baseLimits) : baseLimits;


    // Calculate current unique items in storage
    const allStorageItemsSet = new Set([
        ...Object.keys(player.house.storage.items || {}), ...Object.keys(player.house.storage.lures || {}),
        ...(player.house.storage.weapons || []), ...(player.house.storage.armor || []),
        ...(player.house.storage.shields || []), ...(player.house.storage.catalysts || [])
    ]);
    const uniqueItemCount = allStorageItemsSet.size;


    const isNewUniqueItem = !allStorageItemsSet.has(itemKey);

    // Check unique item limit first for ALL items
    if (isNewUniqueItem && uniqueItemCount >= limits.unique) {
        addToLog('Your storage chest is full! You cannot add any more types of items.', 'text-red-400');
        return;
    }


    if (category === 'items' || category === 'lures') {
        const source = player.inventory[category];
        const destination = player.house.storage[category];
         // Ensure destination exists
         if (!destination) player.house.storage[category] = {};


        // Check stack limit specifically for stackable items
        if ((destination[itemKey] || 0) >= limits.stack) {
            addToLog(`You cannot store any more ${details.name}. The stack limit (${limits.stack}) is full.`, 'text-red-400');
            return;
        }

        if (source && source[itemKey] && source[itemKey] > 0) { // Check source exists
            source[itemKey]--;
            if (source[itemKey] <= 0) delete source[itemKey];
            destination[itemKey] = (destination[itemKey] || 0) + 1;
        } else {
             addToLog(`You don't have any ${details.name} in your inventory to store.`, 'text-red-400'); // Feedback if item not found
             return;
        }
    } else { // Equipment
        const source = player.inventory[category];
        const destination = player.house.storage[category];
         // Ensure destination exists
         if (!destination) player.house.storage[category] = [];


        // Find the index of the item to remove (ensure it exists)
        const itemIndex = source ? source.indexOf(itemKey) : -1;


        if (itemIndex > -1) {
            source.splice(itemIndex, 1); // Remove one instance from inventory
            destination.push(itemKey); // Add one instance to storage
        } else {
            addToLog(`Could not find ${details.name} in your inventory to store.`, 'text-red-400'); // Feedback
             return;
        }
    }
    renderHouseStorage(); // Refresh UI after successful move
}


function moveFromStorage(category, itemKey, index = -1) { // Index might not be needed
    if (!player.house.storage) {
         addToLog("Storage hasn't been initialized properly.", 'text-red-500'); // Should not happen with checks elsewhere
        return;
    }
    const details = getItemDetails(itemKey);
    if (!details) return;

    if (category === 'items' || category === 'lures') {
        const source = player.house.storage[category];
        const destination = player.inventory[category];
         // Ensure categories exist
         if (!source || !destination) return;


        if (source[itemKey] && source[itemKey] > 0) {
            source[itemKey]--;
            if (source[itemKey] <= 0) delete source[itemKey];
            destination[itemKey] = (destination[itemKey] || 0) + 1;
        } else {
            addToLog(`No ${details.name} found in storage.`, 'text-red-400');
             return;
        }
    } else { // Equipment
        const source = player.house.storage[category];
        const destination = player.inventory[category];
        // Ensure categories exist
        if (!source || !destination) return;

        // Find the index to remove
        const itemIndex = source.indexOf(itemKey);

        if (itemIndex > -1) {
            source.splice(itemIndex, 1); // Remove from storage
            destination.push(itemKey); // Add to inventory
        } else {
             addToLog(`Could not find ${details.name} in storage.`, 'text-red-400');
             return;
        }
    }
    renderHouseStorage(); // Refresh UI after successful move
}


function purchaseHouseUpgrade(categoryKey) {
    const category = HOME_IMPROVEMENTS[categoryKey];
    if (!category) return;

    const currentTier = player.house[`${categoryKey}Tier`] || 0;
    if (currentTier >= category.upgrades.length) {
        addToLog("You've already fully upgraded this feature.", 'text-yellow-400');
        return;
    }

    const upgrade = category.upgrades[currentTier];
    if (player.gold < upgrade.cost) {
        addToLog(`You need ${upgrade.cost} G for the ${upgrade.name}.`, 'text-red-400');
        return;
    }

    player.gold -= upgrade.cost;
    player.house[`${categoryKey}Tier`]++;

    addToLog(`Upgrade purchased: ${upgrade.name}!`, 'text-green-400 font-bold');

    // Apply immediate effects of the upgrade
    if (categoryKey === 'storage') {
        // Limits are checked dynamically, no need to store on player
         console.log("Storage upgraded to Tier", player.house.storageTier);
    } else if (categoryKey === 'garden') {
        const newSize = upgrade.size.width * upgrade.size.height;
        // Expand garden array if necessary, preserving existing plots
        if (!player.house.garden || player.house.garden.length < newSize) {
             const existingPlots = player.house.garden || [];
             const newGarden = Array(newSize).fill(null).map((_, i) =>
                 existingPlots[i] || { seed: null, plantedAt: 0, growthStage: 0 }
             );
             player.house.garden = newGarden;
        }


        // Expand tree plot array if necessary
        if(upgrade.treeSize) {
            const treePlotSize = upgrade.treeSize.width * upgrade.treeSize.height;
             if (!player.house.treePlots || player.house.treePlots.length < treePlotSize) {
                const existingTreePlots = player.house.treePlots || [];
                const newTreePlots = Array(treePlotSize).fill(null).map((_, i) =>
                    existingTreePlots[i] || { seed: null, plantedAt: 0, growthStage: 0 }
                );
                player.house.treePlots = newTreePlots;
            }
        }
         console.log("Garden upgraded to Tier", player.house.gardenTier);
    } else {
        console.log(`${capitalize(categoryKey)} upgraded to Tier`, player.house[`${categoryKey}Tier`]);
    }


    saveGame(); // Save the upgrade purchase
    updateStatsView(); // Update gold display
    renderHomeImprovements(categoryKey); // Re-render the improvements screen
}

// --- GARDEN FUNCTIONS ---

function updateGarden() {
    // 1. Basic checks to see if we should run at all.
    if (!player || !player.house.owned || player.house.gardenTier === 0) {
        return; // No player, no house, or no garden plot = do nothing.
    }
    
    // 2. Data validation. If garden arrays are broken, fix them.
    // This stops the game from crashing if an old save loads without these arrays.
    if (!Array.isArray(player.house.garden)) {
        console.error("Garden data was not an array! Resetting to prevent crash.");
        player.house.garden = [];
    }
     if (!Array.isArray(player.house.treePlots)) {
        player.house.treePlots = [];
    }

    // 3. Set up variables for the check.
    const now = Date.now();
    let needsRender = false; // Flag to track if the screen needs to be redrawn.

    /**
     * Helper function to check a set of plots (garden or tree) for growth.
     * This is defined *inside* updateGarden to keep it clean.
     * @param {Array} plots - The array of plot objects (e.g., player.house.garden).
     */
    const checkPlots = (plots) => {
        if (!Array.isArray(plots)) return;

        plots.forEach(plot => {
            if (plot && plot.seed && plot.plantedAt > 0 && plot.growthStage < 3) {
                const seedInfo = SEEDS[plot.seed];
                if (!seedInfo) return;

                // --- NEW: Modified Growth Time ---
                let totalGrowthTime = seedInfo.growthTime;
                if (player.isSkillActive('verdant_touch')) {
                    totalGrowthTime = Math.floor(totalGrowthTime * 0.90);
                }
                // ---------------------------------

                const timePassed = Date.now() - plot.plantedAt;
                const currentStage = plot.growthStage;
                
                let newStage = 0; // Default: seedling

                if (timePassed >= totalGrowthTime * 0.33) {
                    newStage = 1; // Stage 1: Sprout
                }
                if (timePassed >= totalGrowthTime * 0.66) {
                    newStage = 2; // Stage 2: Growing
                }
                if (timePassed >= totalGrowthTime) {
                    newStage = 3; // Stage 3: Fully grown
                }
                // --- MODIFICATION END ---

                // 5. If the stage has advanced, update the plot and flag a re-render.
                if (newStage > currentStage) {
                    plot.growthStage = newStage;
                    needsRender = true;
                }
            }
        });
    };

    // 6. Run the check on both plot types.
    checkPlots(player.house.garden);
    checkPlots(player.house.treePlots);

    // 7. THE FIX: Only re-render the screen if the player is *actually looking at it*.
    // This function (updateGarden) runs every second in the background.
    // The logic above will run and update the plant stages.
    // This `if` block ensures we only *draw* the changes if the garden is the current view.
    if (needsRender && gameState.currentView === 'garden') {
         console.log("Garden state updated, re-rendering.");
        renderGarden(); // Re-render because a plot changed stage and we're looking at it.
    }
}

function plantSeed(plotIndex, seedKey, isTreePlot) {
     const targetArray = isTreePlot ? player.house.treePlots : player.house.garden;
     // Basic validation

     // --- NEW: Season of Plenty ---
    if (player.isSkillActive('harvest_festival')) {
        const roll = Math.random();
        if (roll < 0.01) { // 1% Instant
            plot.plantedAt = Date.now() - 999999999; // Finished
            addToLog("Season of Plenty: Instant Growth!", "text-green-300 font-bold");
        } else if (roll < 0.11) { // 10% Speed (0.01 to 0.11 range covers 10%)
            // We can't change 'plantedAt' easily to reflect % reduction of *duration*.
            // Better to flag the plot as 'accelerated'.
            plot.isAccelerated = true; 
            addToLog("Season of Plenty: Rapid Growth!", "text-green-300");
        }
    }

     if (!targetArray || plotIndex < 0 || plotIndex >= targetArray.length) {
          addToLog("Invalid plot selected.", "text-red-400");
          return;
     }
     if (targetArray[plotIndex] && targetArray[plotIndex].seed) {
          addToLog("This plot is already occupied.", "text-yellow-400");
          return;
     }

    if ((player.inventory.items[seedKey] || 0) < 1) {
        addToLog(`You don't have any ${getItemDetails(seedKey).name}.`, 'text-red-400');
         hideSeedSelection(); // Close selection if out of seeds
         renderGarden(); // Re-render to potentially update seed list if it was open
        return;
    }

    // Consume seed
    player.inventory.items[seedKey]--;
    if (player.inventory.items[seedKey] <= 0) {
        delete player.inventory.items[seedKey];
    }

    // Plant
    targetArray[plotIndex] = {
        seed: seedKey,
        plantedAt: Date.now(),
        growthStage: 0 // Start at seedling stage
    };


    addToLog(`You planted a ${getItemDetails(seedKey).name}.`, 'text-green-400');
    hideSeedSelection(); // Close selection box
    renderGarden(); // Re-render the garden UI
    saveGame(); // Save the planting action
}

function harvestPlant(plotIndex, isTreePlot) {
    const targetArray = isTreePlot ? player.house.treePlots : player.house.garden;
     if (!targetArray || plotIndex < 0 || plotIndex >= targetArray.length) return; // Validation


    const plot = targetArray[plotIndex];
    if (!plot || plot.growthStage < 3) return; // Can only harvest if fully grown

    const seedInfo = SEEDS[plot.seed];
    if (!seedInfo) return; // Invalid seed data

    // Add harvest to inventory (verbose log included in addToInventory)
    player.addToInventory(seedInfo.growsInto, 1, true);

    // Reset the plot
    targetArray[plotIndex] = { seed: null, plantedAt: 0, growthStage: 0 };


    renderGarden(); // Re-render UI
    saveGame(); // Save harvest action
}

// --- COOKING FUNCTIONS ---
function cookRecipe(recipeKey) {
    const recipeData = COOKING_RECIPES[recipeKey];
    if (!recipeData) {
        addToLog("Invalid recipe.", "text-red-400");
        return;
    }

    // --- Check ingredients ---
    const required = recipeData.ingredients;
    const availableIngredients = { // Stores available *items* for generic slots
        meat: [],
        veggie: [],
        seasoning: []
    };

    // Populate available ingredients, sorted by price (cheapest first)
    Object.keys(player.inventory.items).forEach(itemKey => {
        const details = getItemDetails(itemKey);
        if (details && details.cookingType) {
             // Only add if count > 0
             const count = player.inventory.items[itemKey];
             if (count > 0) {
                for (let i = 0; i < count; i++) {
                    availableIngredients[details.cookingType].push({ key: itemKey, price: details.price });
                }
             }
        }
    });

    // Sort available generic ingredients
    for(const type in availableIngredients) {
        availableIngredients[type].sort((a,b) => a.price - b.price);
    }


    // Check if player has enough of each required ingredient
    const ingredientsToConsume = {}; // Track specific items to remove
    let canCook = true;
    for (const reqKey in required) {
        const requiredAmount = required[reqKey];
        const isGeneric = ['meat', 'veggie', 'seasoning'].includes(reqKey);

        if (isGeneric) {
            if (availableIngredients[reqKey].length < requiredAmount) {
                canCook = false;
                break; // Stop checking if a generic type is missing
            }
            // Mark the cheapest ones for consumption
            for(let i = 0; i < requiredAmount; i++) {
                const itemToUse = availableIngredients[reqKey][i].key;
                ingredientsToConsume[itemToUse] = (ingredientsToConsume[itemToUse] || 0) + 1;
            }
        } else { // Specific ingredient
            if ((player.inventory.items[reqKey] || 0) < requiredAmount) {
                canCook = false;
                break; // Stop checking if specific item is missing
            }
            // Mark specific item for consumption
            ingredientsToConsume[reqKey] = (ingredientsToConsume[reqKey] || 0) + requiredAmount;
        }
    }


    if (!canCook) {
        addToLog("You don't have the required ingredients.", "text-red-400");
        return;
    }

    // --- Consume Ingredients & Apply Effects ---
    for (const itemKey in ingredientsToConsume) {
        player.inventory.items[itemKey] -= ingredientsToConsume[itemKey];
        if (player.inventory.items[itemKey] <= 0) {
            delete player.inventory.items[itemKey];
        }
    }

    player.clearFoodBuffs(); // Clear old buffs before applying new ones
    // --- BUFF SHARING (KITCHEN) ---
    if (player.npcAlly) {
        player.npcAlly.clearFoodBuffs(); // Clear ally's old buffs too
    }
    // --- END BUFF SHARING ---

    const effect = recipeData.effect;

    // Apply healing effect first
    if (effect.heal) {
         player.hp = Math.min(player.maxHp, player.hp + effect.heal);
         // --- BUFF SHARING (KITCHEN) ---
         if (player.npcAlly) {
            player.npcAlly.hp = Math.min(player.npcAlly.maxHp, player.npcAlly.hp + effect.heal);
         }
         // --- END BUFF SHARING ---
    }

    // Apply primary effect (buff, % heal, % mana, full restore)
    switch (effect.type) {
        case 'full_restore':
            player.hp = player.maxHp;
            player.mp = player.maxMp;
            // --- BUFF SHARING (KITCHEN) ---
            if (player.npcAlly) {
                player.npcAlly.hp = player.npcAlly.maxHp;
                player.npcAlly.mp = player.npcAlly.maxMp;
            }
            // --- END BUFF SHARING ---
            break;
        case 'buff':
            effect.buffs.forEach(buff => {
                // Handle different buff types correctly
                if (buff.stat === 'movement_speed') {
                     // Additive movement speed
                     player.foodBuffs[buff.stat] = { value: buff.value, duration: buff.duration };
                     // --- BUFF SHARING (KITCHEN) ---
                     if (player.npcAlly) {
                        player.npcAlly.foodBuffs[buff.stat] = { value: buff.value, duration: buff.duration };
                     }
                     // --- END BUFF SHARING ---
                } else {
                     // Multiplicative/Value-based for others (like damage, max hp/mp, loot, xp, and new regen)
                     player.foodBuffs[buff.stat] = { value: buff.value, duration: buff.duration };
                     // --- BUFF SHARING (KITCHEN) ---
                     if (player.npcAlly) {
                        player.npcAlly.foodBuffs[buff.stat] = { value: buff.value, duration: buff.duration };
                     }
                     // --- END BUFF SHARING ---
                }
            });
             // Re-apply Max HP/MP buffs immediately after applying
             player.hp = Math.min(player.hp, player.maxHp);
             player.mp = Math.min(player.mp, player.maxMp);
             // --- BUFF SHARING (KITCHEN) ---
             if (player.npcAlly) {
                player.npcAlly.hp = Math.min(player.npcAlly.hp, player.npcAlly.maxHp);
                player.npcAlly.mp = Math.min(player.npcAlly.mp, player.npcAlly.maxMp);
             }
             // --- END BUFF SHARING ---
            break;
    }


    addToLog(`You cooked and ate ${recipeData.name}. You feel its effects!`, "text-green-400 font-bold");
    // --- BUFF SHARING (KITCHEN) ---
    if (player.npcAlly) {
        addToLog(`${player.npcAlly.name} shares in the meal!`, "text-blue-300");
    }
    // --- END BUFF SHARING ---

    updateStatsView(); // Update UI with new HP/MP and potentially Max HP/MP
    renderKitchen(); // Re-render to update button states and ingredient counts
    saveGame(); // Save after cooking
}

function processPlantInSeedmaker(plantKey) {
    if (!player.inventory.items[plantKey] || player.inventory.items[plantKey] < 1) {
        addToLog("You don't have any of that plant to process.", "text-red-400");
        return;
    }

    // Build the reverse map to find the corresponding seed
    const PLANT_TO_SEED_MAP = {};
    for (const seedKey in SEEDS) {
        const plantKey = SEEDS[seedKey].growsInto;
        PLANT_TO_SEED_MAP[plantKey] = seedKey;
    }

    const seedKey = PLANT_TO_SEED_MAP[plantKey];
    if (!seedKey) {
        console.error(`Could not find corresponding seed for plant: ${plantKey}`);
        addToLog("An error occurred. Could not find the seed for that plant.", "text-red-500");
        return;
    }
    
    const plantDetails = getItemDetails(plantKey);
    const seedDetails = getItemDetails(seedKey);
    if (!plantDetails || !seedDetails) {
         addToLog("An error occurred. Item details are missing.", "text-red-500");
         return;
    }

    // 1. Consume one plant
    player.inventory.items[plantKey]--;
    if (player.inventory.items[plantKey] <= 0) {
        delete player.inventory.items[plantKey];
    }

    // 2. Determine seed amount (2, with 10% chance for 3)
    let seedAmount = 2;
    // Use rollForEffect to include luck and racial passives
    if (player.rollForEffect(0.1, 'Seedmaker Bonus')) { 
        seedAmount = 3;
        addToLog("Bonus! The seedmaker was extra efficient!", "text-green-300");
    }

    // 3. Add the seeds
    player.addToInventory(seedKey, seedAmount, true); // addToInventory will log the item gain

    addToLog(`You processed 1 ${plantDetails.name} into ${seedAmount} ${seedDetails.name}s.`);

    updateStatsView(); // Update inventory counts
    saveGame(); // Save the change
}


