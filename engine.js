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
            // Check grid layout validity first
            if (!gameState.gridLayout || gameState.gridLayout[neighbor.y * gameState.gridWidth + neighbor.x] !== 1) continue;

            // --- THIS IS THE FIX ---
            // The old logic only checked for 'currentEnemies' and 'player'.
            // We must add the check for the NpcAlly here.
            const ally = player.npcAlly;
            const allyIsAliveAndAtNeighbor = (ally && ally.hp > 0 && !ally.isFled && ally.x === neighbor.x && ally.y === neighbor.y);
            const isOccupiedByEntity = (currentEnemies.some(e => e.isAlive() && e.x === neighbor.x && e.y === neighbor.y) || (player.x === neighbor.x && player.y === neighbor.y) || allyIsAliveAndAtNeighbor);
            if (isOccupiedByEntity && !(neighbor.x === end.x && neighbor.y === end.y)) continue;
            // --- END FIX ---

            // Check for blocking objects (obstacles/terrain) if not flying
            // MODIFIED: Pinionfolk (isFlying) ignores obstacles and terrain
            if (!isFlying) {
                const gridObject = gameState.gridObjects.find(o => o.x === neighbor.x && o.y === neighbor.y);
                // Non-flyers are blocked by obstacles AND terrain
                if (gridObject && (gridObject.type === 'obstacle' || gridObject.type === 'terrain')) {
                    if (!(neighbor.x === end.x && neighbor.y === end.y)) { // Can always move *onto* the target cell
                         continue;
                    }
                }
            }


            const tentativeGScore = gScore[`${current.x},${current.y}`] + 1;
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
    return null; // No path found
}

function findReachableCells(start, maxDistance) {
    const reachable = [];
    const visited = new Set();
    const queue = [{ x: start.x, y: start.y, dist: 0 }];
    visited.add(`${start.x},${start.y}`);
    const isFlying = (player.race === 'Pinionfolk'); // Check if player is flying

    while (queue.length > 0) {
        const current = queue.shift();

        if (current.dist > 0) {
            reachable.push(current);
        }

        if (current.dist < maxDistance) {
            const neighbors = [
                { x: current.x, y: current.y - 1 }, { x: current.x, y: current.y + 1 },
                { x: current.x - 1, y: current.y }, { x: current.x + 1, y: current.y }
            ];

            for (const neighbor of neighbors) {
                const key = `${neighbor.x},${neighbor.y}`;
                // Validate neighbor coordinates and layout before accessing gridLayout
                 if (neighbor.x >= 0 && neighbor.x < gameState.gridWidth &&
                    neighbor.y >= 0 && neighbor.y < gameState.gridHeight &&
                    gameState.gridLayout && // Check if gridLayout exists
                    gameState.gridLayout[neighbor.y * gameState.gridWidth + neighbor.x] === 1 &&
                    !visited.has(key) &&
                    !isCellBlocked(neighbor.x, neighbor.y, false, isFlying)) { // Use isCellBlocked with flight status


                    visited.add(key);
                    queue.push({ x: neighbor.x, y: neighbor.y, dist: current.dist + 1 });
                }
            }
        }
    }
    return reachable;
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
        this.npcAlly = null; // <<< NEW
        this.encountersSinceLastPay = 0; // <<< NEW
        this.house = {
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
            hasTowerKey: false
        };
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
            lures: { }
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
        let finalHp = (this.vigor * 5) + this.bonusHp;
        if (this.foodBuffs?.max_hp) {
            finalHp *= this.foodBuffs.max_hp.value;
        }
        return Math.floor(finalHp);
    }
    get maxMp() {
        let finalMp = (this.focus * 5) + this.bonusMp;
        if (this.foodBuffs?.max_mp) {
            finalMp *= this.foodBuffs.max_mp.value;
        }
        return Math.floor(finalMp);
    }
    get physicalDefense() { return Math.floor((this.stamina + this.vigor) / 2) + this.bonusPhysicalDefense; }
    get magicalDefense() { return Math.floor((this.stamina + this.focus) / 2) + this.bonusMagicalDefense; }
    get physicalDamageBonus() { return this.strength + this.bonusPhysicalDamage; }
    get magicalDamageBonus() { return this.intelligence + this.bonusMagicalDamage; }
    // Split Luck contributions for clarity
    get critChance() { return Math.min(0.3, ((this.luck * 0.5) / 100) + this.bonusCritChance); }
    get evasionChance() { return Math.min(0.2, ((this.luck * 0.5) / 100) + this.bonusEvasion); }
    get resistanceChance() {
        let baseResist = Math.min(0.5, (this.luck / 100)); // Debuff resist only from base Luck for now
        // --- CLANKERS: Absolute Logic ---
        if (this.race === 'Clankers') {
            const multiplier = (this.level >= 20) ? 2.0 : 1.5; // 100% or 50% relative bonus
            baseResist = Math.min(0.80, baseResist * multiplier); // Cap at 80%
        }
        // --- End Clankers Logic ---
        return baseResist;
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

    // *** CORRECTED clearBattleBuffs function definition ***
    clearBattleBuffs() {
        const buffsToClear = [
            'buff_strength', 'buff_chaos_strength', 'buff_titan',
            'buff_defense', 'stonehide', 'buff_shroud', 'buff_voidwalker',
            'buff_haste', 'buff_hermes', 'buff_ion_self', 'buff_ion_other',
            'buff_magic_defense', 'buff_divine', 'buff_enrage', // Added enrage
             // Keep resist buffs? Debatable. Clearing them for now for simplicity.
             'resist_fire', 'resist_water', 'resist_earth', 'resist_wind',
             'resist_lightning', 'resist_nature', 'resist_light', 'resist_void',
             // Debuffs applied by enemies
             'drenched', 'paralyzed', 'petrified', 'toxic', 'poison', 'swallowed',
             // Clear temporary alchemy buffs/debuffs
             'bonus_crit', 'bonus_speed', 'bonus_range', 'alchemical_barrier',
             'magic_dampen', 'elemental_vuln', 'slowed', 'inaccurate',
             'monster_lure', 'clumsy', 'fumble',
             'buff_whetstone', // Added whetstone buff
             'buff_magic_dust' // Added magic rock dust buff
        ];

        let cleared = false;
        for (const buffKey of buffsToClear) {
            // Check own properties directly on 'this' (the Player instance)
            if (this.statusEffects[buffKey]) {
                delete this.statusEffects[buffKey];
                cleared = true;
            }
        }
        // Also clear toggle state if active
        if (this.signatureAbilityToggleActive) {
            this.signatureAbilityToggleActive = false;
            cleared = true; // Consider this a cleared effect
        }


        if (cleared) {
            addToLog("The temporary effects of the battle wear off.", "text-gray-400");
             // Update UI immediately if buffs cleared
             updateStatsView();
        }
    }


    addToInventory(itemKey, quantity = 1, verbose = true) {
        const details = getItemDetails(itemKey); if (!details) return;

        // --- Added Item-Based Unlocks ---
        const isEssence = itemKey.endsWith('_essence');
        const isUndyingHeart = itemKey === 'undying_heart';

        if (isEssence && this.level >= 7 && !this.unlocks.enchanter) {
            this.unlocks.enchanter = true;
            // Use setTimeout to ensure the "item received" log appears first
            setTimeout(() => {
                addToLog("The essence you picked up starts to pulsate warmly, seemingly drawn towards a specific building in the Arcane Quarter. You might want to check it out!", 'text-purple-300');
            }, 100);
            saveGame(); // Save unlock flag immediately
        }
        if (isUndyingHeart && this.level >= 10 && !this.unlocks.witchCoven) {
            this.unlocks.witchCoven = true;
             setTimeout(() => {
                addToLog("The still beating Undying Heart thrums in your hand, attracting unseen attention. It feels like the Witch in the Arcane Quarter wants to meet you.", 'text-purple-300');
            }, 100);
            saveGame(); // Save unlock flag immediately
        }
         // Handle Key Item Pickups for unlock flags
        if (itemKey === 'blacksmith_key') {
            this.unlocks.hasBlacksmithKey = true;
            saveGame(); // Save key acquisition
        }
        if (itemKey === 'tower_key') {
            this.unlocks.hasTowerKey = true;
            saveGame(); // Save key acquisition
        }
        // --- End Added ---


        if(details.type === 'recipe') {
            for(let i = 0; i < quantity; i++) {
                this.learnRecipe(itemKey, verbose);
            }
            return;
        }

        // --- Added verbose check for keys ---
        if (verbose || details.type !== 'key') { // Only log normal items, or keys if verbose is true
            addToLog(`You received: <span class="font-bold" style="color: var(--text-accent);">${details.name}</span>!`, 'text-green-400');
        }
        // --- End Added ---


        const category = itemKey in WEAPONS ? 'weapons' :
                         (itemKey in CATALYSTS ? 'catalysts' :
                         (itemKey in ARMOR ? 'armor' :
                         (itemKey in SHIELDS ? 'shields' :
                         (itemKey in LURES ? 'lures' : 'items'))));

         // Ensure inventory category exists
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
        let modifiedAmount = Math.floor(amount * (this.xpMultiplier || 1));
        if(this.foodBuffs.xp_gain) modifiedAmount = Math.floor(modifiedAmount * this.foodBuffs.xp_gain.value);

        this.xp += modifiedAmount;
        if (this.totalXp === undefined || isNaN(this.totalXp)) this.totalXp = 0; // Ensure totalXP is number
        this.totalXp += modifiedAmount;
        addToLog(`You gained <span class="font-bold">${modifiedAmount}</span> XP!`, 'text-yellow-400');

        // Check for level up repeatedly
        let leveledUp = false;
        while (this.xp >= this.xpToNextLevel && this.level < 999) { // Added level cap
            leveledUp = true;
            this.levelUp();
        }

        updateStatsView(); // Update UI once after all level ups
    }

    levelUp() {
         // Should only run if xp >= xpToNextLevel
        this.xp -= this.xpToNextLevel;
        this.level++;
        this.xpToNextLevel = this.calculateXpToNextLevel();
        this.statPoints = (this.statPoints || 0) + 5; // Ensure statPoints is number
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

    /** Calculates final dodge, parry, and block chances including all modifiers. */
    _calculateAvoidanceChances() {
        const shield = this.equippedShield;
        const armor = this.equippedArmor;
        const weapon = this.equippedWeapon;
        let dodgeChance = this.evasionChance;
        let parryChance = 0;
        let blockChance = (shield?.blockChance || 0) + (armor?.blockChance || 0);

        // Gear Dodge/Parry Bonuses/Penalties
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

        // Status Effects Modifiers
        if (this.statusEffects.buff_shroud || this.statusEffects.buff_voidwalker) dodgeChance *= 1.5;
        if (this.statusEffects.buff_hermes) dodgeChance *= 2;
        if (this.statusEffects.bonus_speed) dodgeChance += this.statusEffects.bonus_speed.dodge;
        if (this.statusEffects.slowed) dodgeChance = Math.max(0, dodgeChance + this.statusEffects.slowed.dodge);
        if (this.statusEffects.clumsy) dodgeChance = Math.max(0, dodgeChance + this.statusEffects.clumsy.dodge);

        // Clamp chances between 0 and a reasonable maximum (e.g., 95%)
        dodgeChance = Math.max(0, Math.min(0.95, dodgeChance));
        parryChance = Math.max(0, Math.min(0.95, parryChance));
        blockChance = Math.max(0, Math.min(0.95, blockChance));

        return { dodge: dodgeChance, parry: parryChance, block: blockChance };
    }

    _attemptAvoidance(avoidanceChances, attacker) {
        // --- Parry Check ---
        if (attacker && this.rollForEffect(avoidanceChances.parry, 'Parry') && attacker.isAlive()) {
            attacker.attackParried = true;
            addToLog(`You parried ${attacker.name}'s attack!`, 'text-yellow-300 font-bold');
            this._handleParryCounterAttack(attacker);
            return true; // Avoided
        }

        // --- Dodge Check ---
        if (attacker && this.rollForEffect(avoidanceChances.dodge, 'Dodge')) {
            attacker.attackParried = true;
            addToLog(`You dodged ${attacker.name}'s attack!`, 'text-teal-300 font-bold');
            return true; // Avoided
        }

        // --- Block Check ---
        if (this.rollForEffect(avoidanceChances.block, 'Block')) {
            if (attacker) attacker.attackParried = true;
            addToLog(`You blocked the attack!`, 'text-cyan-400 font-bold');
            return true; // Avoided
        }

        return false; // Not avoided
    }

    /** Handles the counter-attack logic after a successful parry. */
    _handleParryCounterAttack(attacker) {
        // Note: This function runs in a setTimeout, so we skip async actions like knockback
        setTimeout(() => {
            if (gameState.battleEnded || !attacker || !attacker.isAlive()) return;
            addToLog(`You launch a swift counter-attack!`, 'text-yellow-300');

            const weapon = this.equippedWeapon; // 'this' is the Player
            const calcLog = {
                source: `Player Parry`,
                targetName: attacker.name,
                steps: []
            };
            let messageLog = [];

            // --- Start of calculation logic (Copied from performSingleAttack) ---

            // 1. Dice & Whetstone (Dwarf logic is here too)
            let attackDamageDice = [...weapon.damage]; // [numDice, sides]
            if (this.race === 'Dwarf' && this.level >= 20) {
                if (attackDamageDice[1] === 6) { attackDamageDice[1] = 8; calcLog.steps.push({ description: "Craftsmen's Intuition", value: "d6 -> d8", result: "" }); }
                else if (attackDamageDice[1] === 8) { attackDamageDice[1] = 10; calcLog.steps.push({ description: "Craftsmen's Intuition", value: "d8 -> d10", result: "" }); }
            }

            let allowCrit = false;
            if (this.statusEffects.buff_whetstone) {
                // Whetstone buff applies to *all* attacks, including parries
                if (this.statusEffects.buff_whetstone.diceStepUp) {
                    const originalSides = attackDamageDice[1];
                    switch (originalSides) {
                        case 2: attackDamageDice[1] = 4; break;
                        case 3: attackDamageDice[1] = 4; break;
                        case 4: attackDamageDice[1] = 6; break;
                        case 6: attackDamageDice[1] = 8; break;
                        case 8: attackDamageDice[1] = 10; break;
                        case 10: attackDamageDice[1] = 12; break;
                    }
                    if (attackDamageDice[1] !== originalSides) {
                        messageLog.push(`Whetstone sharpens the blow! (d${originalSides} -> d${attackDamageDice[1]})`);
                        calcLog.steps.push({ description: "Whetstone Buff", value: `d${originalSides} -> d${attackDamageDice[1]}`, result: "" });
                    }
                }
                if (this.statusEffects.buff_whetstone.critEnable) {
                    allowCrit = true;
                    messageLog.push(`Whetstone finds a weak spot!`);
                    calcLog.steps.push({ description: "Whetstone Crit Enable", value: `Crit Possible`, result: "" });
                }
            }

            let rollResult = rollDice(attackDamageDice[0], attackDamageDice[1], `Player Parry`);
            let baseWeaponDamage = rollResult.total;
            calcLog.baseDamage = baseWeaponDamage;

            // OMIT Fighter Reroll (it's a toggle ability for a main attack action)

            let statBonus = this.physicalDamageBonus;

            // OMIT Combo (parry isn't part of a combo chain)

            let damage = baseWeaponDamage;
            const statMultiplier = 1 + statBonus / 20;
            damage = Math.floor(damage * statMultiplier);
            calcLog.steps.push({ description: `Stat Multiplier (1 + ${statBonus}/20)`, value: `x${statMultiplier.toFixed(2)}`, result: damage });

            const strengthFlatBonus = Math.floor(this.strength / 5);
            damage += strengthFlatBonus;
            calcLog.steps.push({ description: "Strength Flat Bonus (Str/5)", value: `+${strengthFlatBonus}`, result: damage });

            // Add Ranger Mark bonus (a parry should benefit from this)
            if (attacker.isMarked && attacker === gameState.markedTarget) {
                 const markBonusDamage = rollDice(1, 8, 'Hunters Mark Bonus').total;
                 damage += markBonusDamage;
                 messageLog.push(`Hunter's Mark adds ${markBonusDamage} damage!`);
                 calcLog.steps.push({ description: "Hunter's Mark", value: "+1d8", result: damage });
                 allowCrit = true; // Marked targets can be crit
            }

            let attackEffects = { element: this.weaponElement };

            // Special Weapon Logic (copied)
            if (weapon.name === 'Elemental Sword') {
                const chosenElement = this.weaponElement !== 'none' ? this.weaponElement : gameState.lastSpellElement;
                if (chosenElement !== 'none') {
                    attackEffects.element = chosenElement;
                }
                const intBonus = this.intelligence;
                damage += intBonus; // Add int scaling
                calcLog.steps.push({ description: "Elemental Sword Bonus", value: `+${intBonus} (INT)`, result: damage });
            }
            if (weapon.effect?.intScaling) {
                const intBonus = Math.floor(this.intelligence * weapon.effect.intScaling);
                damage += intBonus;
                calcLog.steps.push({ description: `${weapon.name} Bonus`, value: `+${intBonus} (INT Scale)`, result: damage });
            }

            // Status Effect Modifiers (copied)
            if (this.statusEffects.drenched) {
                const multiplier = this.statusEffects.drenched.multiplier;
                damage = Math.floor(damage * multiplier);
                messageLog.push(`Your attack is weakened!`);
                calcLog.steps.push({ description: "Drenched Debuff", value: `x${multiplier}`, result: damage });
            }
            if(this.statusEffects.buff_strength) {
                const multiplier = this.statusEffects.buff_strength.multiplier;
                damage = Math.floor(damage * multiplier);
                messageLog.push(`Your strength is augmented!`);
                calcLog.steps.push({ description: "Strength Buff", value: `x${multiplier}`, result: damage });
            }
            if (this.statusEffects.buff_enrage) {
                 damage = Math.floor(damage * 1.5);
                 messageLog.push(`Your rage empowers the blow!`);
                 calcLog.steps.push({ description: "Enrage Buff", value: `x1.5`, result: damage });
            }

            // Racial Bonuses (copied)
            if (this.race === 'Elementals' && attackEffects.element === this.elementalAffinity) {
                const damageBonus = (this.level >= 20) ? 1.20 : 1.10;
                damage = Math.floor(damage * damageBonus);
                calcLog.steps.push({ description: "Innate Elementalist", value: `x${damageBonus.toFixed(2)}`, result: damage });
                if (this.level >= 20) {
                     const extraDieRoll = rollDice(1, attackDamageDice[1], 'Elemental Evo Die').total;
                     damage += extraDieRoll;
                     calcLog.steps.push({ description: "Innate Elementalist (Evo)", value: `+1d${attackDamageDice[1]}`, result: damage });
                }
            }
            if (this.race === 'Dragonborn') {
                const damageBonus = (this.level >= 20) ? 1.20 : 1.10;
                damage = Math.floor(damage * damageBonus);
                calcLog.steps.push({ description: "Bloodline Attunement", value: `x${damageBonus.toFixed(2)}`, result: damage });
            }

            // OMIT Assassinate (parry is a reaction, not an opener)

            // Critical Hit Calculation (copied)
            let critChance = this.critChance;
            if(this.statusEffects.bonus_crit) critChance += this.statusEffects.bonus_crit.critChance;
            const canWeaponCrit = weapon.class === 'Dagger' || weapon.effect?.critChance || allowCrit;

            if (canWeaponCrit) {
                if (weapon.class === 'Dagger') critChance += 0.1;
                if (weapon.effect?.critChance) critChance += weapon.effect.critChance;
                if (allowCrit && !weapon.effect?.critChance && weapon.class !== 'Dagger') critChance += 0.10; // For marked target

                if (this.rollForEffect(critChance, 'Parry Crit')) {
                    let critMultiplier = 1.5;
                    if (weapon.class === 'Dagger') critMultiplier = 1.5;
                    if (weapon.effect?.critMultiplier) critMultiplier = weapon.effect.critMultiplier;

                    damage = Math.floor(damage * critMultiplier);
                    messageLog.push(`CRITICAL HIT!`);
                    calcLog.steps.push({ description: "Critical Hit", value: `x${critMultiplier}`, result: damage });
                }
            }

            // Armor Pierce & Other Effects (copied)
            if (weapon.class === 'Thrusting Sword') attackEffects.armorPierce = 0.2;
            if (weapon.effect?.armorPierce) attackEffects.armorPierce = (attackEffects.armorPierce || 0) + weapon.effect.armorPierce;
            if (weapon.effect?.bonusVsDragon && attacker.speciesData.name === 'Dragon') {
                const multiplier = weapon.effect.bonusVsDragon;
                damage = Math.floor(damage * multiplier);
                messageLog.push(`Your weapon glows with power against the dragon!`);
                calcLog.steps.push({ description: "Bonus vs. Dragon", value: `x${multiplier}`, result: damage });
            }
            if (weapon.effect?.bonusVsLegendary && attacker.rarityData.name === 'Legendary') {
                const multiplier = weapon.effect.bonusVsLegendary;
                damage = Math.floor(damage * multiplier);
                messageLog.push(`Your weapon feels destined to slay this foe!`);
                calcLog.steps.push({ description: "Bonus vs. Legendary", value: `x${multiplier}`, result: damage });
            }

            // --- End of calculation logic ---

            const damageResult = attacker.takeDamage(damage, attackEffects);
            const finalDamage = damageResult.damageDealt;
            // const knockbackAmountFromAttack = damageResult.knockback; // Can't handle async knockback in a sync setTimeout

            calcLog.finalDamage = finalDamage;
            logDamageCalculation(calcLog); // Log the calculation

            let damageType = weapon.damageType || 'physical';
            if (attackEffects.element && attackEffects.element !== 'none') {
                damageType = ELEMENTS[attackEffects.element].name;
            }
            let logMessagesCombined = messageLog.join(' ');
            addToLog(`Your riposte hits ${attacker.name} for <span class="font-bold text-yellow-300">${finalDamage}</span> ${damageType} damage. ${logMessagesCombined}`);

            // --- Apply On-Hit Effects (Lifesteal, Paralyze, etc.) ---
            // OMIT Paladin Smite, Greases, Pocket Cragblade, Lightning Rod (these are for main actions, not reactions)
            // OMIT Knockback (can't be awaited here)

            // Lifesteal (copied)
            if (finalDamage > 0) {
                let lifestealAmount = 0;
                if (weapon.class === 'Reaper') lifestealAmount += finalDamage * 0.1;
                if (weapon.effect?.lifesteal) lifestealAmount += finalDamage * weapon.effect.lifesteal;

                if (lifestealAmount > 0) {
                    if (attacker.speciesData.class !== 'Undead') {
                        const healedAmount = Math.floor(lifestealAmount);
                        if (healedAmount > 0) {
                            this.hp = Math.min(this.maxHp, this.hp + healedAmount);
                            addToLog(`You drain <span class="font-bold text-green-400">${healedAmount}</span> HP.`);
                            updateStatsView(); // Update UI
                        }
                    } else {
                        addToLog(`You cannot drain life from the undead!`, 'text-gray-400');
                    }
                }
            }

            // Hammer paralysis & Other on-hit effects (copied)
            let paralyzeBaseChance = 0;
            if (weapon.class === 'Hammer') paralyzeBaseChance += 0.1;
            if (weapon.effect?.paralyzeChance) paralyzeBaseChance += weapon.effect.paralyzeChance;
            if (this.rollForEffect(paralyzeBaseChance, 'Hammer Paralyze') && finalDamage > 0 && !attacker.statusEffects.paralyzed) {
                attacker.statusEffects.paralyzed = { duration: 2 };
                addToLog(`${attacker.name} is stunned by the blow!`, 'text-yellow-500');
            }

            if(finalDamage > 0){
                const toxicChance = weapon.effect?.toxicChance || 0;
                if (this.rollForEffect(toxicChance, 'Weapon Toxic')) {
                    attacker.statusEffects.toxic = { duration: 4 };
                    addToLog(`${attacker.name} is afflicted with a deadly toxin!`, 'text-green-700');
                }
                const petrifyChance = weapon.effect?.petrifyChance || 0;
                if(this.rollForEffect(petrifyChance, 'Weapon Petrify') && !attacker.statusEffects.petrified) {
                    attacker.statusEffects.petrified = { duration: 2 };
                    addToLog(`${attacker.name} is petrified by the attack!`, 'text-gray-400');
                }
                const cleanseChance = weapon.effect?.cleanseChance || 0;
                if (this.rollForEffect(cleanseChance, 'Weapon Cleanse')) {
                     const debuffs = Object.keys(this.statusEffects).filter(key => ['poison', 'toxic', 'paralyzed', 'petrified', 'drenched'].includes(key));
                     if (debuffs.length > 0) {
                         const effectToCleanse = debuffs[0];
                         delete this.statusEffects[effectToCleanse];
                         addToLog(`Your weapon's holy energy cleanses you of ${effectToCleanse}!`, 'text-yellow-200');
                     }
                }
            }

            // OMIT Second Strike / Shield Follow-up (this *is* the follow-up)

            if (!gameState.battleEnded) {
                checkBattleStatus(true); // Check if the counter-attack was fatal
            }
        }, 300);
    }

    /** Checks for and applies damage absorption from Alchemical Barrier. Returns remaining damage. */
    _applyAlchemicalBarrier(incomingDamage) {
        if (this.statusEffects.alchemical_barrier && this.statusEffects.alchemical_barrier.hp > 0) {
            const barrierHP = this.statusEffects.alchemical_barrier.hp;
            if (incomingDamage >= barrierHP) {
                incomingDamage -= barrierHP;
                delete this.statusEffects.alchemical_barrier;
                addToLog(`Your alchemical barrier shatters, absorbing <span class="font-bold text-cyan-300">${barrierHP}</span> damage!`, 'text-cyan-400');
            } else {
                this.statusEffects.alchemical_barrier.hp -= incomingDamage;
                addToLog(`Your alchemical barrier absorbs <span class="font-bold text-cyan-300">${incomingDamage}</span> damage! (${this.statusEffects.alchemical_barrier.hp} HP remaining)`, 'text-cyan-400');
                return 0; // Damage fully absorbed
            }
        }
        return incomingDamage; // Return remaining damage
    }

    /** Applies pre-defense damage multipliers (vulnerabilities). Returns modified damage. */
    _applyDamageVulnerabilities(damage, isMagicAttack, ignoresDefense, attacker = null) { // Added attacker
        let modifiedDamage = damage;
        // --- ORC: Brutish Physique ---
        if (this.race === 'Orc') {
            if (!isMagicAttack && !ignoresDefense) { // Physical damage
                modifiedDamage = Math.floor(modifiedDamage * 0.9); // 10% reduction
                addToLog("Your brutish physique shrugs off some physical damage!", "text-gray-400");
            } else if (isMagicAttack && this.level < 20) { // Magical damage, pre-evolution
                modifiedDamage = Math.floor(modifiedDamage * 1.1); // 10% weakness
                addToLog("Your physique is vulnerable to magic!", "text-red-400");
            }
        }
        // --- End Orc Logic ---

        // Barbarian Enrage - Increased physical damage taken
        if (this.statusEffects.buff_enrage && !isMagicAttack && !ignoresDefense) {
            modifiedDamage = Math.floor(modifiedDamage * 1.5);
            addToLog(`Your rage leaves you open!`, `text-red-400`);
        }
         // Elemental vulnerability from status
        if(this.statusEffects.elemental_vuln && attacker?.element === this.statusEffects.elemental_vuln.element){
            modifiedDamage = Math.floor(modifiedDamage * 1.25);
            addToLog(`You are vulnerable to ${attacker.element} and take extra damage!`, 'text-red-600');
        }

        return modifiedDamage;
    }

    /** Calculates final defense value considering attack type, elements, buffs, and penetration. */
    _calculateEffectiveDefense(isMagicAttack, attackerElement, ignoresDefense, attacker = null) {
        if (ignoresDefense) {
            addToLog(`The attack ignores your defense!`, 'text-yellow-500 font-bold');
            return 0;
        }

        const shield = this.equippedShield;
        const armor = this.equippedArmor;
        let baseDefense = isMagicAttack ? this.magicalDefense : this.physicalDefense;
        let shieldDefense = shield?.defense || 0;
        let armorDefense = armor?.defense || 0; // Get armor defense
        let totalDefense = baseDefense + shieldDefense + armorDefense; // Add armor defense to total

        // Apply Elemental resistances/weaknesses from gear
        if (attackerElement && attackerElement !== 'none') {
            // --- ELEMENTAL: Innate Elementalist (Resistance) --- (Handled in _applyDamageVulnerabilities now)

            const armorMod = calculateElementalModifier(attackerElement, this.armorElement);
            if (armorMod !== 1) { // Apply only if not neutral
                totalDefense += (armor.defense || 0) * (armorMod - 1); // Adjust total defense based on armor's contribution and modifier
                addToLog(`Your armor's enchantment ${armorMod > 1 ? 'resists' : 'is weak to'} the attack!`, armorMod > 1 ? 'text-green-400' : 'text-red-500');
            }

            const shieldMod = calculateElementalModifier(attackerElement, this.shieldElement);
            if (shieldMod !== 1) { // Apply only if not neutral
                totalDefense += (shield.defense || 0) * (shieldMod - 1); // Adjust total defense based on shield's contribution and modifier
                addToLog(`Your shield's enchantment ${shieldMod > 1 ? 'resists' : 'is weak to'} the attack!`, shieldMod > 1 ? 'text-green-400' : 'text-red-500');
            }
        }

        // Apply defense buffs/debuffs
        if (this.statusEffects.stonehide) totalDefense *= this.statusEffects.stonehide.multiplier;
        if (this.statusEffects.buff_defense) totalDefense *= this.statusEffects.buff_defense.multiplier;
        if (this.statusEffects.buff_magic_defense && isMagicAttack) totalDefense *= this.statusEffects.buff_magic_defense.multiplier;
        if (this.statusEffects.buff_divine && isMagicAttack) totalDefense *= this.statusEffects.buff_divine.multiplier;
        if (this.statusEffects.buff_titan) totalDefense *= this.statusEffects.buff_titan.defMultiplier;
        if (this.statusEffects.buff_chaos_strength) totalDefense *= this.statusEffects.buff_chaos_strength.defMultiplier;

        // Apply Penetration/Bypass
        // MODIFIED: Use attacker parameter here (already null-checked with ?)
        if (attacker?.element === 'void') {
            totalDefense *= 0.5; // Void bypasses 50%
            addToLog(`The void attack partially bypasses your defense!`, 'text-purple-400');
        }

        // Log buff applications (can add specific logs here if desired)
        if(this.statusEffects.stonehide) addToLog(`Your stone-like skin absorbs the blow!`, `text-gray-400`);
        if(this.statusEffects.buff_defense) addToLog(`Your magical shield bolsters your defense!`, `text-yellow-300`);
        if(this.statusEffects.buff_magic_defense && isMagicAttack) addToLog(`Your faith shields you from the magic!`, `text-yellow-200`);
        if(this.statusEffects.buff_divine && isMagicAttack) addToLog(`Divine power shields you!`, `text-yellow-100`);
        if(this.statusEffects.buff_chaos_strength) addToLog(`Your reckless abandon lowers your defense!`, `text-red-400`);


        return Math.floor(Math.max(0, totalDefense)); // Ensure defense isn't negative
    }

    /** Applies final damage calculation, subtracts from HP, and logs the result. */
    _applyAndLogDamage(damage, effectiveDefense, attacker, isMagicAttack) {
        const finalDamage = Math.max(0, Math.floor(damage - effectiveDefense));
        this.hp -= finalDamage;
        this.hp = Math.max(0, this.hp); // Prevent HP going below zero visually

        let damageType = '';
        if (attacker && attacker.element && attacker.element !== 'none') {
            damageType = ` ${ELEMENTS[attacker.element].name}`;
        } else if (isMagicAttack) {
            damageType = ' magical';
        }
        addToLog(`You take <span class="font-bold text-red-400">${finalDamage}</span>${damageType} damage.`);
        return finalDamage;
    }

    /** Handles all damage reflection effects. */
    _handleReflectEffects(finalDamageDealt, originalDamage, attacker) {
        if (!attacker || !attacker.isAlive()) return; // Don't reflect if attacker is dead

        const armor = this.equippedArmor;
        const shield = this.equippedShield;
        let reflectedDamage = 0;
        let reflectSource = '';
        let reflectElement = 'none';

        // Armor Reflection
        if (armor?.effect?.reflect_damage) {
            reflectedDamage = Math.floor(originalDamage * armor.effect.reflect_damage);
            reflectSource = armor.name;
            reflectElement = this.armorElement;
        }
        // Shield Reflection
        else if (shield?.effect?.type === 'reflect') {
            reflectedDamage = Math.floor(originalDamage * shield.effect.amount);
            reflectSource = shield.name;
            reflectElement = this.shieldElement;
        }
        // Ion Buff Reflection
        else if (this.statusEffects.buff_ion_other) {
            reflectedDamage = Math.floor(originalDamage * 0.25);
            reflectSource = 'unstable energy';
            reflectElement = 'lightning';
        }

        if (reflectedDamage > 0) {
            // --- MODIFICATION: Use damageDealt from return value ---
            const damageResult = attacker.takeDamage(reflectedDamage, { element: reflectElement });
            const finalReflected = damageResult.damageDealt;
            // --- END MODIFICATION ---
            addToLog(`Your ${reflectSource} reflects <span class="font-bold text-orange-400">${finalReflected}</span> damage back at ${attacker.name}!`, 'text-orange-300');
            if (!gameState.battleEnded) checkBattleStatus(true);
            if (!attacker.isAlive()) return; // Stop if non-racial reflect killed attacker
        }

        // Tiefling Passive (reflects final damage taken)
        if (this.race === 'Tiefling' && finalDamageDealt > 0) {
            const reflectionCost = (this.level >= 20) ? 0 : 5;
            if (this.mp >= reflectionCost) {
                if (reflectionCost > 0) this.mp -= reflectionCost;
                reflectedDamage = Math.floor(finalDamageDealt * 0.10);
                if (reflectedDamage > 0) {
                    // --- MODIFICATION: Use damageDealt from return value ---
                    const damageResult = attacker.takeDamage(reflectedDamage, { isMagic: true, element: 'fire', ignore_defense: 1.0 });
                    const finalReflected = damageResult.damageDealt;
                    // --- END MODIFICATION ---
                    addToLog(`Your infernal blood rebukes ${attacker.name} for <span class="font-bold text-red-500">${finalReflected}</span> fire damage!`, 'text-orange-400');
                     if (!gameState.battleEnded) checkBattleStatus(true);
                }
            }
        }
    }


    /** Main damage taking function - orchestrates calls to helpers. */
    takeDamage(damage, ignoresDefense = false, attacker = null, attackOptions = { isMagic: false }) {
        // 1. Calculate Avoidance
        const avoidanceChances = this._calculateAvoidanceChances();

        // 2. Attempt Avoidance (Parry > Dodge > Block)
        if (this._attemptAvoidance(avoidanceChances, attacker)) {
            updateStatsView(); // Update if HP/MP changed from parry counter etc.
            return { damageDealt: 0, knockback: 0 }; // Return object on avoidance
        }

        // --- Damage Continues ---
        const originalDamage = damage; // Store pre-barrier/vulnerability damage for reflection calc later

        // 3. Apply Alchemical Barrier
        damage = this._applyAlchemicalBarrier(damage);
        if (damage <= 0) {
            updateStatsView(); // Update if barrier absorbed all
            return { damageDealt: 0, knockback: 0 }; // Return object
        }

        // 4. Determine Attack Type & Apply Vulnerabilities
        const isMagicAttack = (attacker?.element && attacker.element !== 'none') || ignoresDefense || attackOptions.isMagic;
        damage = this._applyDamageVulnerabilities(damage, isMagicAttack, ignoresDefense, attacker); // Apply Orc, Enrage here

        // 5. Calculate Effective Defense
        // MODIFIED: Pass the 'attacker' object itself
        const effectiveDefense = this._calculateEffectiveDefense(isMagicAttack, attacker?.element, ignoresDefense, attacker);

        // 6. Apply Damage & Log
        const finalDamageDealt = this._applyAndLogDamage(damage, effectiveDefense, attacker, isMagicAttack);

        // 7. Handle Reflect Effects (pass original for armor/shield reflect, final for Tiefling)
        this._handleReflectEffects(finalDamageDealt, originalDamage, attacker);

        // 8. Final UI Update (potentially redundant if reflection already updated)
        updateStatsView();

        // --- MODIFICATION: Return object with damageDealt ---
        return { damageDealt: finalDamageDealt, knockback: 0 }; // Default knockback 0
        // --- END MODIFICATION ---
    }
    // --- END takeDamage refactoring ---
}
// --- NEW Drone Class ---
// --- NEW Drone Class ---
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

        // Scale damage slightly with drone's intelligence
        const statMultiplier = 1 + this.intelligence / 20;
        let damage = Math.floor(baseDamage * statMultiplier);
        calcLog.steps.push({ description: `Drone Int Multiplier`, value: `x${statMultiplier.toFixed(2)}`, result: damage });

        addToLog(`${this.name} fires a beam at ${target.name}!`);

        // Drone attack is considered magical
        // --- THIS IS THE FIX ---
        // target.takeDamage now returns an object { damageDealt, knockback }
        const damageResult = target.takeDamage(damage, { isMagic: true, element: 'none' });
        const finalDamageDealt = damageResult.damageDealt; // Get the actual number

        calcLog.finalDamage = finalDamageDealt;
        logDamageCalculation(calcLog);

        // Use the correct variable in the log
        addToLog(`The beam hits for <span class="font-bold text-cyan-400">${finalDamageDealt}</span> magical damage.`);
        // --- END FIX ---
    }

    takeDamage(damage, options = {}) {
        // Drone might have simpler defense or none at all
        const defense = 0; // Example: Drone has no defense
        const finalDamage = Math.max(0, damage - defense);
        this.hp -= finalDamage;
        this.hp = Math.max(0, this.hp);

        addToLog(`${this.name} takes <span class="font-bold text-red-400">${finalDamage}</span> damage.`);

        if (!this.isAlive()) {
            addToLog(`${this.name} is destroyed!`, 'text-red-500');
            // --- MODIFIED: Check for player drone or NPC drone ---
            if (this === gameState.activeDrone) {
                gameState.activeDrone = null; // Remove player drone reference
            } else if (this === gameState.npcActiveDrone) {
                gameState.npcActiveDrone = null; // Remove NPC drone reference
            }
            // --- END MODIFICATION ---
        }

        // Update grid to show HP change if needed (might require drone HP bar)
        if (gameState.currentView === 'battle') {
            renderBattleGrid();
        }
        
        // --- MODIFIED: Return object ---
        return { damageDealt: finalDamage, knockback: 0 };
        // --- END MODIFICATION ---
    }
}
// --- END Drone Class ---
class NpcAlly extends Entity {
    // --- CONSTRUCTOR MODIFIED to accept raceKey ---
    constructor(name, classKey, raceKey, playerLevel, backgroundKey, backgroundName) { // <-- MODIFIED SIGNATURE
        super(name);
        this.x = -1;
        this.y = -1;
        this.isFled = false;
        this.isResting = false; // <<< NEWstrengthFlatBonus
        
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
        
        // --- ADDED: Ability properties ---
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
        this.level = Math.max(1, Math.floor(playerLevel * 0.95)); // 95%
        if (playerLevel > 1 && this.level === playerLevel) {
             this.level--; // Ensure at least 1 level discrepancy
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
        let blockChance = (shield?.blockChance || 0) + (armor?.blockChance || 0);

        // Gear Dodge/Parry Bonuses/Penalties
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

        // Status Effects Modifiers (Simplified for Ally)
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
            return 0;
        }

        const shield = this.equippedShield;
        const armor = this.equippedArmor;
        let baseDefense = isMagicAttack ? this.magicalDefense : this.physicalDefense;
        let shieldDefense = shield?.defense || 0;
        let armorDefense = armor?.defense || 0;
        let totalDefense = baseDefense + shieldDefense + armorDefense;

        // Apply Elemental resistances/weaknesses from gear
        if (attackerElement && attackerElement !== 'none') {
            const armorMod = calculateElementalModifier(attackerElement, this.armorElement);
            if (armorMod !== 1) {
                totalDefense += (armor.defense || 0) * (armorMod - 1);
                addToLog(`${this.name}'s armor enchantment ${armorMod > 1 ? 'resists' : 'is weak to'} the attack!`, armorMod > 1 ? 'text-green-400' : 'text-red-500');
            }
            const shieldMod = calculateElementalModifier(attackerElement, this.shieldElement);
            if (shieldMod !== 1) {
                totalDefense += (shield.defense || 0) * (shieldMod - 1);
                addToLog(`${this.name}'s shield enchantment ${shieldMod > 1 ? 'resists' : 'is weak to'} the attack!`, shieldMod > 1 ? 'text-green-400' : 'text-red-500');
            }
        }

        // Apply defense buffs/debuffs
        if (this.statusEffects.stonehide) totalDefense *= this.statusEffects.stonehide.multiplier;
        if (this.statusEffects.buff_defense) totalDefense *= this.statusEffects.buff_defense.multiplier;
        if (this.statusEffects.buff_magic_defense && isMagicAttack) totalDefense *= this.statusEffects.buff_magic_defense.multiplier;
        if (this.statusEffects.buff_divine && isMagicAttack) totalDefense *= this.statusEffects.buff_divine.multiplier;

        // Apply Penetration/Bypass
        if (attacker?.element === 'void') {
            totalDefense *= 0.5; // Void bypasses 50%
            addToLog(`The void attack partially bypasses ${this.name}'s defense!`, 'text-purple-400');
        }

        return Math.floor(Math.max(0, totalDefense));
    }

    _applyAndLogDamage(damage, effectiveDefense, attacker, isMagicAttack) {
        const finalDamage = Math.max(0, Math.floor(damage - effectiveDefense));
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

        if (armor?.effect?.reflect_damage) {
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
        // 1. Calculate Avoidance (For Elf, Beastkin)
        const avoidanceChances = this._calculateAvoidanceChances();
        const attacker = options.attacker || (options.element ? { element: options.element } : null); // Create mock attacker for options

        // 2. Attempt Avoidance (Parry > Dodge > Block)
        if (this._attemptAvoidance(avoidanceChances, attacker)) {
            if (gameState.currentView === 'battle') renderBattleGrid();
            return { damageDealt: 0, knockback: 0 };
        }

        // --- Damage Continues ---
        const originalDamage = damage;

        // 3. Apply Alchemical Barrier
        damage = this._applyAlchemicalBarrier(damage);
        if (damage <= 0) {
            if (gameState.currentView === 'battle') renderBattleGrid();
            return { damageDealt: 0, knockback: 0 };
        }

        // 4. Determine Attack Type & Apply Vulnerabilities (For Orc)
        const isMagicAttack = (attacker?.element && attacker.element !== 'none') || options.isMagic || options.ignore_defense;
        damage = this._applyDamageVulnerabilities(damage, isMagicAttack, options.ignore_defense, attacker);

        // 5. Calculate Effective Defense
        const effectiveDefense = this._calculateEffectiveDefense(isMagicAttack, attacker?.element, options.ignore_defense, attacker);
        
        // 6. Apply Damage & Log
        const finalDamageDealt = this._applyAndLogDamage(damage, effectiveDefense, attacker, isMagicAttack);

        // 7. Handle Reflect Effects (For Tiefling)
        this._handleReflectEffects(finalDamageDealt, originalDamage, attacker);
        
        // 8. Check for Flee state
        if (this.hp <= 0 && !this.isFled) {
            this.isFled = true;
            addToLog(`<span class="font-bold text-red-500">${this.name} has been defeated and fled the battle!</span>`, "text-red-500");
        }
        
        if (gameState.currentView === 'battle') {
            renderBattleGrid();
        }
        return { damageDealt: finalDamageDealt, knockback: 0 }; // Allies don't handle knockback
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

        let damage = baseWeaponDamage; // <-- THIS IS THE FIX (defining 'damage')
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
        if (!target) {
             addToLog(`${this.name} has no one to move towards!`);
             return;
        }
        
        const isFlying = (this.race === 'Pinionfolk'); // Use this.race
        let moveDistance = 2; // Base ally move
        
        // --- ELF: Nature's Madness (Movement) ---
        if (this.race === 'Elf' && (!this.equippedArmor || !this.equippedArmor.metallic)) {
            moveDistance += (this.level >= 20 ? 2 : 1);
        }
        // --- Status Effects (Simplified for ally) ---
        if(this.statusEffects.bonus_speed) moveDistance += this.statusEffects.bonus_speed.move;
        if(this.statusEffects.slowed) moveDistance = Math.max(1, moveDistance + this.statusEffects.slowed.move);
        // (No food buffs for ally)

        const path = findPath({x: this.x, y: this.y}, {x: target.x, y: target.y}, isFlying);

        if (path && path.length > 1) {
            // addToLog(`${this.name} moves towards ${target.name}!`); // This log is already in battle.js
            const stepsToTake = Math.min(path.length - 1, moveDistance); // Use calculated move distance

            for (let i = 1; i <= stepsToTake; i++) {
                const nextStep = path[i];

                // Check if the next step is valid before moving
                // Use the isAllyMoving flag (true)
                if (isCellBlocked(nextStep.x, nextStep.y, false, isFlying, true)) {
                     addToLog(`${this.name} encounters an obstacle and stops.`);
                    break; // Stop if the path becomes blocked
                }

                // Check if moving into this cell would put it in attack range
                // (Need to decide if attacking or casting)
                const distanceAfterMove = Math.abs(nextStep.x - target.x) + Math.abs(nextStep.y - target.y);
                const weaponRange = this.equippedWeapon.range || 1;
                const catalystRange = this.equippedCatalyst.range || 3;

                this.x = nextStep.x;
                this.y = nextStep.y;
                renderBattleGrid();
                await new Promise(resolve => setTimeout(resolve, 300)); // Delay between steps

                // Stop if in range of *either* weapon or catalyst
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
            'buff_strength', 'buff_chaos_strength', 'buff_titan',
            'buff_defense', 'stonehide', 'buff_shroud', 'buff_voidwalker',
            'buff_haste', 'buff_hermes', 'buff_ion_self', 'buff_ion_other',
            'buff_magic_defense', 'buff_divine', 'buff_enrage',
             'resist_fire', 'resist_water', 'resist_earth', 'resist_wind',
             'resist_lightning', 'resist_nature', 'resist_light', 'resist_void',
             'drenched', 'paralyzed', 'petrified', 'toxic', 'poison', 'swallowed',
             'bonus_crit', 'bonus_speed', 'bonus_range', 'alchemical_barrier',
             'magic_dampen', 'elemental_vuln', 'slowed', 'inaccurate',
             'clumsy', 'fumble',
             'buff_whetstone', 'buff_magic_dust'
        ];

        let cleared = false;
        if (!this.statusEffects) this.statusEffects = {}; 
        for (const buffKey of buffsToClear) {
            if (this.statusEffects[buffKey]) {
                delete this.statusEffects[buffKey];
                cleared = true;
            }
        }
        
        if (cleared && !this.isFled) { 
            addToLog(`Temporary effects on ${this.name} wear off.`, "text-gray-400");
        }
    }
    
    // --- 2-of-3 RULE FIX ---
    
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

        if (itemType === 'armor') {
            // Simple armor equip
            const oldItemKey = this.equippedArmor.name !== ARMOR['travelers_garb'].name ? findKeyByInstance(ARMOR, this.equippedArmor) : null;
            this.equippedArmor = details;
            this.armorElement = 'none'; // Reset element on equip
            if (!silent) addToLog(`${this.name} equipped ${details.name}.`);
            return oldItemKey;
        }

        if (itemType === 'weapon' || itemType === 'catalyst' || itemType === 'shield') {
            // 2-of-3 rule logic
            let isTwoHanded = details.class === 'Hand-to-Hand' || details.effect?.dualWield;
            if (isTwoHanded && details.class === 'Hand-to-Hand' && this.race === 'Beastkin' && this.level >= 20) isTwoHanded = false;

            let unequippedItemKey = null;

            if (isTwoHanded) {
                // Unequip both shield and catalyst
                if (this.equippedShield.name !== SHIELDS['no_shield'].name) {
                    unequippedItemKey = this.unequipItem('shield', silent); // Store first unequipped
                }
                if (this.equippedCatalyst.name !== CATALYSTS['no_catalyst'].name) {
                    const unequippedKey2 = this.unequipItem('catalyst', silent);
                    if (!unequippedItemKey) unequippedItemKey = unequippedKey2; // Store second if first was null
                }
            } else {
                // Check if 2-of-3 rule is violated
                const typeIndex = this.equipmentOrder.indexOf(itemType);
                if (typeIndex > -1) this.equipmentOrder.splice(typeIndex, 1); // Remove old entry if same type
                
                if (this.equipmentOrder.length >= 2) {
                    const typeToUnequip = this.equipmentOrder.shift(); // Get oldest
                    if (typeToUnequip && typeToUnequip !== itemType) { // Ensure it's not undefined and not the same type
                        unequippedItemKey = this.unequipItem(typeToUnequip, silent);
                    }
                }
                this.equipmentOrder.push(itemType); // Add new type
            }

            let isEquippedWeaponTwoHanded = this.equippedWeapon?.class === 'Hand-to-Hand' || this.equippedWeapon?.effect?.dualWield;
            if (isEquippedWeaponTwoHanded && this.equippedWeapon?.class === 'Hand-to-Hand' && this.race === 'Beastkin' && this.level >= 20) isEquippedWeaponTwoHanded = false;
            if ((itemType === 'shield' || itemType === 'catalyst') && isEquippedWeaponTwoHanded) {
                if (!silent) addToLog(`${this.name} cannot use a ${itemType} while using ${this.equippedWeapon.name}.`, 'text-red-400');
                // Don't add to equipment order if it failed
                const failedTypeIndex = this.equipmentOrder.indexOf(itemType);
                if (failedTypeIndex > -1) this.equipmentOrder.splice(failedTypeIndex, 1);
                return null;
            }
            // Now, equip the new item
            // Check for replacing same type
            if (itemType === 'weapon') {
                if (this.equippedWeapon.name !== WEAPONS['fists'].name && !unequippedItemKey) {
                    unequippedItemKey = findKeyByInstance(WEAPONS, this.equippedWeapon);
                }
                this.equippedWeapon = details;
                this.weaponElement = 'none';
            } else if (itemType === 'catalyst') {
                 if (this.equippedCatalyst.name !== CATALYSTS['no_catalyst'].name && !unequippedItemKey) {
                    unequippedItemKey = findKeyByInstance(CATALYSTS, this.equippedCatalyst);
                }
                this.equippedCatalyst = details;
            } else if (itemType === 'shield') {
                 if (this.equippedShield.name !== SHIELDS['no_shield'].name && !unequippedItemKey) {
                    unequippedItemKey = findKeyByInstance(SHIELDS, this.equippedShield);
                }
                this.equippedShield = details;
                this.shieldElement = 'none';
            }
            
            if (!silent) addToLog(`${this.name} equipped ${details.name}.`);
            return unequippedItemKey;
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
                if (!silent) addToLog(`${this.name} unequipped ${this.equippedWeapon.name}.`);
                this.equippedWeapon = defaultItem;
                this.weaponElement = 'none';
                break;
            case 'catalyst':
                if (this.equippedCatalyst.name === CATALYSTS['no_catalyst'].name) return null;
                oldItemKey = findKeyByInstance(CATALYSTS, this.equippedCatalyst);
                defaultItem = CATALYSTS['no_catalyst'];
                 if (!silent) addToLog(`${this.name} unequipped ${this.equippedCatalyst.name}.`);
                this.equippedCatalyst = defaultItem;
                break;
            case 'armor':
                if (this.equippedArmor.name === ARMOR['travelers_garb'].name) return null;
                oldItemKey = findKeyByInstance(ARMOR, this.equippedArmor);
                defaultItem = ARMOR['travelers_garb'];
                 if (!silent) addToLog(`${this.name} unequipped ${this.equippedArmor.name}.`);
                this.equippedArmor = defaultItem;
                this.armorElement = 'none';
                break;
            case 'shield':
                if (this.equippedShield.name === SHIELDS['no_shield'].name) return null;
                oldItemKey = findKeyByInstance(SHIELDS, this.equippedShield);
                defaultItem = SHIELDS['no_shield'];
                 if (!silent) addToLog(`${this.name} unequipped ${this.equippedShield.name}.`);
                this.equippedShield = defaultItem;
                this.shieldElement = 'none';
                break;
            default:
                return null;
        }

        // Update equipment order
        const typeIndex = this.equipmentOrder.indexOf(itemType);
        if (typeIndex > -1) {
            this.equipmentOrder.splice(typeIndex, 1);
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
        if (details.type === 'healing') {
            const healAmount = details.amount;
            this.hp = Math.min(this.maxHp, this.hp + healAmount);
            addToLog(`${this.name} recovers <span class="font-bold text-green-400">${healAmount}</span> HP.`, 'text-green-300');
        } else if (details.type === 'mana_restore') {
            const restoreAmount = details.amount;
            this.mp = Math.min(this.maxMp, this.mp + restoreAmount);
            addToLog(`${this.name} restores <span class="font-bold text-blue-400">${restoreAmount}</span> MP.`, 'text-blue-300');
        } else if (details.type === 'buff' && details.effect) {
             this.statusEffects[details.effect.type] = { ...details.effect };
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
    async castSpell(spellKey, target) { // Make async for potential future delays
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
        
        // Cost calculation (simplified, no player gear)
        let finalSpellCost = spell.cost;
        if (catalyst.effect?.mana_discount) {
            finalSpellCost = Math.max(1, finalSpellCost - catalyst.effect.mana_discount);
        }
        
        if (this.mp < finalSpellCost) {
            addToLog(`${this.name} tried to cast ${spell.name}, but lacked MP!`, 'text-blue-400');
            return false;
        }
        
        this.mp -= finalSpellCost;
        addToLog(`${this.name} casts <span class="font-bold text-purple-300">${spell.name}</span>!`);

        // --- NEW: Handle Healing Spells ---
        if (spellData.element === 'healing' || spellData.type === 'support') {
            if (spellData.element === 'healing') {
                let diceCount = spell.damage[0];
                const spellAmp = catalyst.effect?.spell_amp || 0;
            diceCount = Math.min(spell.cap, diceCount + spellAmp);

            let healAmount = rollDice(diceCount, spell.damage[1], `Ally Heal: ${spell.name}`).total;
            
            // Apply Ally's magical damage bonus (Intelligence)
            const statBonus = this.magicalDamageBonus;
            const statMultiplier = 1 + statBonus / 20;
            healAmount = Math.floor(healAmount * statMultiplier);
            const intFlatBonus = Math.floor(this.intelligence / 5);
            healAmount += intFlatBonus;

            // Apply Ally's racial passives (Dragonborn, Elemental[healing])
            if (this.race === 'Elementals' && spellData.element === this.elementalAffinity) { // Assuming ally can have affinity
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

            // Apply heal to the target (which could be player or ally)
            target.hp = Math.min(target.maxHp, target.hp + healAmount);
            const targetName = (target === player) ? "you" : target.name;
            addToLog(`${this.name} heals ${targetName} for <span class="font-bold text-green-400">${healAmount}</span> HP.`, 'text-green-300');
            
            if (target === player) updateStatsView();
            else renderBattleGrid(); // Update ally HP bar
            
            return true; // Cast was successful
        }
    }
        // --- END NEW HEALING LOGIC ---


        // --- Offensive Spell Logic ---
        if (!target.isAlive()) return false; // Check after healing, in case target was somehow invalid

        let diceCount = spell.damage[0];
        const spellAmp = catalyst.effect?.spell_amp || 0;
        diceCount = Math.min(spell.cap, diceCount + spellAmp);
        
        let damage = rollDice(diceCount, spell.damage[1], `${this.name} Spell`).total;
        
        // --- MODIFIED: Apply same formula as player ---
        const statBonus = this.magicalDamageBonus;
        const statMultiplier = 1 + statBonus / 20;
        damage = Math.floor(damage * statMultiplier);
        
        // --- MODIFIED: Use base stat for flat bonus, just like player ---
        const intFlatBonus = Math.floor(this.intelligence / 5);
        damage += intFlatBonus;
        // --- END MODIFIED ---
        
        if (this.race === 'Dragonborn') {
            const damageBonus = (this.level >= 20) ? 1.20 : 1.10;
            damage = Math.floor(damage * damageBonus);
        }        
        // Simplified crit
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
        
        // Apply damage
        const { damageDealt } = target.takeDamage(damage, spellEffects);
        addToLog(`It hits ${target.name} for <span class="font-bold text-purple-400">${damageDealt}</span> ${spellData.element} damage.`);
        
        renderBattleGrid(); // Update MP bar
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
        const finalDefense = Math.floor(((speciesData.base_defense || 0) + Math.floor(playerLevel / 3)) * statMultiplier);

        const rarityName = speciesData.rarityNames?.[rarityData.key] || speciesData.name; // Use rarityData.key ('common', 'uncommon', etc.)

        const name = elementData.key !== 'none'
            ? `${elementData.adjective} ${rarityName}` // Apply adjective to the specific rarity name
            : rarityName; // Use the specific rarity name directly
        // --- END NEW NAME LOGIC ---


        super(name);
        this.x = 0;
        this.y = 0;
        this.hp = finalHp;
        this.maxHp = finalHp;
        this.strength = finalStrength;

        const classDamage = MONSTER_CLASS_DAMAGE[speciesData.class];
        const tier = speciesData.tier;
        const rarityIndex = rarityData.rarityIndex;

        // Simplified dice count calculation
        let diceCount = Math.floor(1 + tier * 0.5 + rarityIndex * 0.5 + classDamage.baseDice * 0.5);
        this.damage = [Math.max(1, diceCount), classDamage.dieSides];


        this.defense = finalDefense;
        this.ability = speciesData.ability;
        this.element = elementData.key;
        this.range = speciesData.range || 1;
        this.movement = speciesData.movement || { speed: 2, type: 'ground' };
        this.xpReward = Math.floor(speciesData.base_xp * rewardMultiplier * (speciesData.class === 'Monstrosity' ? 1.2 : 1));
        this.goldReward = Math.floor(speciesData.base_gold * rewardMultiplier * (speciesData.class === 'Monstrosity' ? 1.2 : 1));
        this.lootTable = {...speciesData.loot_table};

        // Adjust loot chances based on class
        this.lootChanceMod = (speciesData.class === 'Beast' ? 1.5 : 1);
        this.potionDropChanceMod = (speciesData.class === 'Humanoid' ? 1.5 : 1);
        // Apply mods directly to loot table chances for simplicity elsewhere
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
                // Base chance + rarity bonus for essences
                this.lootTable[essenceKey] = (this.lootTable[essenceKey] || 0) + 0.3 + (rarityIndex * 0.05);
            }
        }
        this.hasDealtDamageThisEncounter = false;
        this.isNpcMarked = false;

        if (this.speciesData.class === 'Undead') {
            this.revived = false;
        }
        if (this.ability === 'necromancy') {
            this.summonedAt50 = false;
            this.summonedAt10 = false;
        }
        if (this.ability === 'alive_again') {
            this.reviveChance = 1.0;
        }
    }
    async attack() {
        this.attackParried = false; // Reset parry flag for this attack sequence
        this.hasDealtDamageThisEncounter = true;

        const ally = player.npcAlly;
        const allyIsValid = ally && ally.hp > 0 && !ally.isFled && ally.x !== -1; // Check if ally is alive and spawned

        // 1. Get ranges
        const weaponRange = this.range || 1;

        // 2. Get target distances
        const playerDist = Math.abs(this.x - player.x) + Math.abs(this.y - player.y);
        const allyDist = allyIsValid ? (Math.abs(this.x - ally.x) + Math.abs(this.y - ally.y)) : Infinity;

        // 3. Check who is in range
        const playerInRange = playerDist <= weaponRange;
        const allyInRange = allyIsValid && (allyDist <= weaponRange);

        let target = null;
        let moveTarget = null; // Who to move towards if no one is in range

        // 4. --- AI TARGETING LOGIC ---
        if (playerInRange && allyInRange) {
            // --- Priority 1: Both are in range ---
            addToLog(`${this.name} scans its targets...`, 'text-gray-400');
            
            // a. Check HP %
            const playerHP_Percent = player.hp / player.maxHp;
            const allyHP_Percent = ally.hp / ally.maxHp;

            if (playerHP_Percent < allyHP_Percent) {
                target = player;
                addToLog(`${this.name} targets the weakened ${target.name}!`, 'text-red-400');
            } else if (allyHP_Percent < playerHP_Percent) {
                target = ally;
                addToLog(`${this.name} targets the weakened ${target.name}!`, 'text-red-400');
            } else {
                // b. HP is tied, check defense
                const isMagic = this.speciesData.damage_type === 'magical' || (this.speciesData.damage_type === 'hybrid' && player.magicalDefense < player.physicalDefense);
                const playerDef = isMagic ? player.magicalDefense : player.physicalDefense;
                const allyDef = isMagic ? ally.magicalDefense : ally.physicalDefense;

                if (allyDef < playerDef) {
                    target = ally;
                    addToLog(`${this.name} targets ${target.name}'s weaker defenses!`, 'text-red-400');
                } else if (playerDef < allyDef) {
                    target = player;
                    addToLog(`${this.name} targets ${target.name}'s weaker defenses!`, 'text-red-400');
                } else {
                    // c. Defenses are tied, check distance
                    target = (allyDist < playerDist) ? ally : player;
                    addToLog(`${this.name} targets the closer ${target.name}!`, 'text-red-400');
                }
            }
        } else if (playerInRange) {
            // --- Priority 2: Only Player is in range ---
            target = player;
        } else if (allyInRange) {
            // --- Priority 3: Only Ally is in range ---
            target = ally;
        } else {
            // --- Priority 4: Nobody is in range ---
            target = null;
            // Find the closest valid target to move towards
            moveTarget = (allyDist < playerDist) ? ally : player;
        }
        // --- END AI LOGIC ---
        
        // 5. Execute Action
        if (target) {
            // --- Perform Attack ---
            addToLog(`${this.name} attacks ${target.name}!`);
            this._performAttack(target); // Perform the main attack

            if (this.attackParried) {
                 return; // Stop if attack was parried/dodged
            }

            // Handle follow-up effects (Double Strike, Wind)
            const rarityIndex = this.rarityData.rarityIndex;
            if (this.element === 'wind' && Math.random() < (rarityIndex * 0.05)) {
                addToLog(`The swirling winds grant ${this.name} another strike!`, 'text-gray-300');
                setTimeout(() => {
                    if (gameState.battleEnded || !target.isAlive() || !this.isAlive()) return;
                    let followUpDamageRoll = rollDice(Math.max(1, this.damage[0] - 1), this.damage[1], `${this.name} Wind Follow-up`);
                    let followUpDamage = followUpDamageRoll.total + Math.floor(this.strength / 2);
                    target.takeDamage(followUpDamage, !!this.statusEffects.ultra_focus, this);
                     if (!gameState.battleEnded) checkBattleStatus(true);
                }, 500); 
            }
            else if (this.ability === 'double_strike' && Math.random() < 0.33) {
                addToLog(`${this.name}'s fury lets it attack again!`, 'text-red-500 font-bold');
                setTimeout(() => {
                     if (gameState.battleEnded || !target.isAlive() || !this.isAlive()) return;
                    this._performAttack(target); // Perform a full second attack
                    if (!gameState.battleEnded) checkBattleStatus(true);
                }, 500);
            }
        } else if (moveTarget) {
            // --- Perform Move ---
            await this.moveTowards(moveTarget);
        } else {
            // No targets on the field at all
            addToLog(`${this.name} looks around confused.`);
        }
    }
    _performAttack(target) {
         // Reset parry flag at the start of each individual strike attempt
         this.attackParried = false;

        const calcLog = {
            source: `${this.name} Attack`,
            targetName: target.name,
            steps: []
        };

        let damageDealt = 0;
        // Check for player's ranged advantage buff
        const catalyst = player.equippedCatalyst;
        // Use new rollForEffect function for player's proc
        if (catalyst && catalyst.effect?.ranged_chance && player.rollForEffect(catalyst.effect.ranged_chance, 'Ranged Advantage') && this.range <=1) { // Only affects melee attackers
            addToLog(`The ${this.name} misses its attack due to your ranged advantage!`, 'text-blue-300');
             this.attackParried = true; // Use parried flag to signal miss
            return;
        }

        let diceCount = this.damage[0];
        // Enrage increases dice count
        if (this.statusEffects.enrage) {
            diceCount++;
            calcLog.steps.push({ description: "Enrage Buff", value: "+1 Dice", result: `(Now ${diceCount}d${this.damage[1]})` });
        }
        let rollResult = rollDice(diceCount, this.damage[1], `${this.name} Attack`);
        let totalDamage = rollResult.total;
        calcLog.baseDamage = totalDamage;

        const statBonus = this.strength;

        // Apply stat multiplier and flat bonus
        const statMultiplier = 1 + statBonus / 20;
        totalDamage = Math.floor(totalDamage * statMultiplier);
        calcLog.steps.push({ description: `Stat Multiplier (1 + ${statBonus}/20)`, value: `x${statMultiplier.toFixed(2)}`, result: totalDamage });

        const strengthFlatBonus = Math.floor(this.strength / 5);
        totalDamage += strengthFlatBonus;
        calcLog.steps.push({ description: "Strength Flat Bonus (Str/5)", value: `+${strengthFlatBonus}`, result: totalDamage });

        // Apply Drenched debuff
        if (this.statusEffects.drenched) {
            const multiplier = this.statusEffects.drenched.multiplier;
            totalDamage = Math.floor(totalDamage * multiplier);
            addToLog(`${this.name}'s attack is weakened by the water!`, 'text-blue-300');
            calcLog.steps.push({ description: "Drenched Debuff", value: `x${multiplier}`, result: totalDamage });
        }

        // Apply Fire element bonus
        if (this.element === 'fire') {
            const fireMultiplier = 1 + Math.random() * 0.2;
            totalDamage = Math.floor(totalDamage * fireMultiplier);
            calcLog.steps.push({ description: "Fire Element Bonus", value: `x${fireMultiplier.toFixed(2)}`, result: totalDamage });
        }

        // Apply Swallowed target bonus
        if (target.statusEffects.swallowed && target.statusEffects.swallowed.source === this) {
            totalDamage *= 2;
            addToLog(`${this.name}'s attack is amplified from within!`, 'text-red-600');
            calcLog.steps.push({ description: "Swallowed Target Bonus", value: `x2`, result: totalDamage });
        }

        // Determine attack type for defense calculation
        let attackOptions = { isMagic: false };
        const damageType = this.speciesData.damage_type;

        if (damageType === 'magical') {
            attackOptions.isMagic = true;
        } else if (damageType === 'hybrid') {
            if (target.physicalDefense < target.magicalDefense) {
                addToLog(`${this.name} targets your weaker physical defense!`, 'text-yellow-300');
                attackOptions.isMagic = false;
            } else {
                addToLog(`${this.name} targets your weaker magical defense!`, 'text-yellow-300');
                attackOptions.isMagic = true;
            }
        }

        // Check for player's Inaccurate debuff
        if(player.statusEffects.inaccurate && player.rollForEffect(0.2, 'Inaccurate Debuff')) { // 20% base chance
             addToLog(`${this.name}'s attack misses due to your blurred vision!`, 'text-gray-400');
              this.attackParried = true; // Use parried flag to signal miss
             return;
        }

        // Check for player's Fumble debuff
        if (player.statusEffects.fumble && player.rollForEffect(player.statusEffects.fumble.chance, 'Fumble Debuff')) {
            addToLog(`${this.name} fumbles its attack!`, 'text-yellow-400');
            this.attackParried = true; // Use parried flag to signal miss
            return;
        }


        // Apply damage to target (this is where parry/dodge/block checks happen inside Player.takeDamage)
        // --- MODIFIED: Store object from takeDamage ---
        const damageResult = target.takeDamage(totalDamage, !!this.statusEffects.ultra_focus, this, attackOptions);
        damageDealt = damageResult.damageDealt; // Get the number
        // --- END MODIFIED ---

        calcLog.finalDamage = damageDealt;
        logDamageCalculation(calcLog);

         // If takeDamage returned 0 due to parry/dodge/block, the attackParried flag will be set on `this` (the enemy)
        if (this.attackParried) {
            console.log("Attack flagged as parried/dodged/blocked by takeDamage.");
            return; // Stop processing this attack
        }


        // Apply on-hit elemental effects only if damage was dealt
        const rarityIndex = this.rarityData.rarityIndex;
        const procChance = rarityIndex * 0.1; // Base proc chance based on rarity

        if (damageDealt > 0) {
            if (this.element === 'water') {
                addToLog(`The water attack leaves you drenched, weakening your next attack!`, 'text-blue-400');
                // Ensure duration scales slightly with rarity/tier maybe? For now, fixed.
                applyStatusEffect(target, 'drenched', { duration: 2, multiplier: 0.9 }, this.name); // Use applyStatusEffect
            }
            if (this.element === 'earth' && Math.random() < procChance) {
                if (!target.statusEffects.paralyzed) {
                    applyStatusEffect(target, 'paralyzed', { duration: 2 }, this.name);
                }
            }
            if (this.element === 'nature') {
                const lifestealAmount = Math.floor(damageDealt * procChance); // Lifesteal scales with proc chance
                if (lifestealAmount > 0) {
                    this.hp = Math.min(this.maxHp, this.hp + lifestealAmount);
                    addToLog(`${this.name} drains <span class="font-bold text-green-400">${lifestealAmount}</span> HP from the natural energy.`, 'text-green-300');
                    // No need to render grid here, happens after turn
                }
            }
            if (this.element === 'light' && Math.random() < procChance) {
                const debuffs = Object.keys(this.statusEffects).filter(key => ['paralyzed', 'petrified', 'drenched', 'poison', 'toxic'].includes(key)); // Added poison/toxic
                if (debuffs.length > 0) {
                    const effectToCleanse = debuffs[0]; // Cleanse one debuff
                    delete this.statusEffects[effectToCleanse];
                    addToLog(`The light energy cleanses ${this.name} of ${effectToCleanse}!`, 'text-yellow-200');
                }
            }
            if (this.element === 'lightning' && Math.random() < procChance) {
                 const lightningDamageRoll = rollDice(1, 8, 'Enemy Lightning Proc');
                 // --- MODIFIED: Use damageDealt from object ---
                 const { damageDealt: lightningDamage } = target.takeDamage(lightningDamageRoll.total + Math.floor(this.strength / 2), true, this, {isMagic: true, element: 'lightning'}); // True damage ignores defense
                 // --- END MODIFIED ---
                addToLog(`Lightning arcs from the attack, dealing an extra <span class="font-bold text-blue-400">${lightningDamage}</span> damage!`);
            }
            if (this.element === 'void' && Math.random() < procChance) {
                const lifestealAmount = Math.floor(damageDealt * procChance);
                 if (lifestealAmount > 0) {
                    this.hp = Math.min(this.maxHp, this.hp + lifestealAmount);
                    addToLog(`${this.name} drains <span class="font-bold text-purple-400">${lifestealAmount}</span> HP with void energy.`, 'text-purple-300');
                 }
            }
        }

        // Apply ability-based effects (only if damage was dealt or ability is not on-hit based)
        if (this.ability === 'life_drain' && damageDealt > 0) {
            const drainAmount = Math.floor(damageDealt / 2);
            this.hp = Math.min(this.maxHp, this.hp + drainAmount);
            addToLog(`${this.name} drains <span class="font-bold text-green-400">${drainAmount}</span> HP!`);
        }
        if (this.ability === 'earthshaker' && Math.random() < 0.3) { // Chance independent of hit
            if (!target.statusEffects.paralyzed) {
                applyStatusEffect(target, 'paralyzed', { duration: 1 }, this.name); // Shorter duration than elemental proc
            }
        }
    }
    takeDamage(damage, effects = {}) {
        // --- START FIX: Reworked Defense Calculation ---
        let currentDefense = 0; // Start defense at 0
        const isMagicAttack = (effects.element && effects.element !== 'none') || effects.isMagic; // Don't include ignore_defense here

        // Check if magic attack
        if (isMagicAttack) {
            // Magic attacks use spell_resistance (a 0-1 multiplier)
            let effectiveSpellResist = this.spell_resistance || 0;
            // Apply spell penetration *first*
            if (effects.spell_penetration) {
                effectiveSpellResist = Math.max(0, effectiveSpellResist - effects.spell_penetration);
            }
            // Apply resistance as a damage multiplier
            damage = Math.floor(damage * (1 - effectiveSpellResist));
            // Magic attacks ignore base physical defense
            currentDefense = 0; 
        } else {
            // Physical attacks use flat physical defense
            currentDefense = this.defense;
            if (this.statusEffects.living_shield) {
                currentDefense *= 2; // Living shield only affects physical
            }
        }
        
        // Apply ignore defense / penetration (affects physical defense)
        if (effects.ignore_defense) {
             const pierceAmount = Math.max(0, Math.min(1, effects.ignore_defense));
             currentDefense *= (1 - pierceAmount);
        }
         if (!isMagicAttack && effects.armorPierce) {
             const pierceAmount = Math.max(0, Math.min(1, effects.armorPierce));
             currentDefense *= (1 - pierceAmount);
         }
        // --- END FIX ---

        // Apply Enrage vulnerability
         let damageTaken = this.statusEffects.enrage ? Math.floor(damage * 1.5) : damage;

        // --- Elemental Calculation & Debuff Interactions ---
        let knockbackAmount = 0; // Initialize knockback amount for this damage instance
        if (effects.element && effects.element !== 'none') {
            // Apply Elemental Weakness/Resistance first
            if (this.element !== 'none') {
                const modifier = calculateElementalModifier(effects.element, this.element);
                if (modifier !== 1) {
                    damageTaken = Math.floor(damageTaken * modifier);
                    addToLog(modifier > 1 ? "It's super effective!" : "It's not very effective...", modifier > 1 ? 'text-green-400' : 'text-red-500');
                }
            }

            // --- Oil Bomb Interaction (Fire) ---
            if (effects.element === 'fire' && this.statusEffects.debuff_oiled) {
                damageTaken *= 2;
                addToLog(`${this.name} bursts into flames from the oil!`, "text-orange-600 font-bold");
                delete this.statusEffects.debuff_oiled; // Consume the debuff
            }
            // --- NEW: Artificial Light Stone Interaction (Wind) ---
            else if (effects.element === 'wind' && this.statusEffects.debuff_lightstone_primed) {
                 const multiplier = this.statusEffects.debuff_lightstone_primed.damageMultiplier || 1.5; // Get multiplier from debuff
                 damageTaken = Math.floor(damageTaken * multiplier); // Apply damage multiplier
                 knockbackAmount = this.statusEffects.debuff_lightstone_primed.knockback || 2; // Get knockback from debuff
                 addToLog(`Light Stone energizes the wind attack!`, "text-yellow-300");
                 delete this.statusEffects.debuff_lightstone_primed; // Consume the debuff
            }
            // --- END NEW LIGHT STONE LOGIC ---
        }
        // --- End Elemental Calculation & Debuff Interactions ---


        // Apply defense
        // Ensure currentDefense is a non-negative number before subtraction
        currentDefense = Math.max(0, currentDefense || 0);
        const finalDamage = Math.max(0, Math.floor(damageTaken - currentDefense));
        this.hp -= finalDamage;
        this.hp = Math.max(0, this.hp); // Prevent HP going below zero visually

        // Update grid immediately to show HP change
        if (gameState.currentView === 'battle') {
            renderBattleGrid();
        }

        // Return an object containing final damage and any triggered effects like knockback
        return { damageDealt: finalDamage, knockback: knockbackAmount };
    }

    async moveTowards(target) {
        // --- NEW MOVE LOGIC ---
        // If a specific target is provided (e.g., by the attack logic), move to it.
        // If not, find the closest target (player or ally).
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
             return; // No valid target to move to
        }
        // --- END NEW MOVE LOGIC ---
        
        const isFlying = this.movement.type === 'flying';
        const path = findPath({x: this.x, y: this.y}, {x: finalTarget.x, y: finalTarget.y}, isFlying);

        if (path && path.length > 1) {
            addToLog(`${this.name} moves towards ${finalTarget.name}!`);
            const stepsToTake = Math.min(path.length - 1, this.movement.speed);

            for (let i = 1; i <= stepsToTake; i++) {
                const nextStep = path[i];

                // Check if the next step is valid before moving
                // THIS IS THE FIX: Added 'forEnemy = true'
                if (isCellBlocked(nextStep.x, nextStep.y, true, isFlying)) {
                     addToLog(`${this.name} encounters an obstacle and stops.`);
                    break; // Stop if the path becomes blocked
                }
                // --- END FIX ---


                // Check if moving into this cell would put it in range
                const distanceAfterMove = Math.abs(nextStep.x - finalTarget.x) + Math.abs(nextStep.y - finalTarget.y);

                this.x = nextStep.x;
                this.y = nextStep.y;
                renderBattleGrid();
                // MODIFIED: Increased delay from 150 to 300
                await new Promise(resolve => setTimeout(resolve, 300)); // Delay between steps

                if (distanceAfterMove <= this.range) {
                    break; // In range, stop moving
                }
            }
        } else {
            addToLog(`${this.name} is blocked and cannot move!`);
        }
    }
    isValidMove(x, y) {
        // Check grid bounds
        if (x < 0 || x >= gameState.gridWidth || y < 0 || y >= gameState.gridHeight) {
            return false;
        }
        // Check if the cell is part of the layout
        if (gameState.gridLayout[y * gameState.gridWidth + x] !== 1) {
            return false;
        }
        // Check if player is there
        if (player.x === x && player.y === y) {
            return false;
        }
        // Check if another enemy is there
        if (currentEnemies.some(e => e !== this && e.isAlive() && e.x === x && e.y === y)) { // Only check living enemies
            return false;
        }
         // Check for obstacles
         if (gameState.gridObjects.some(o => o.x === x && o.y === y && o.type === 'obstacle')) {
            return false;
        }
        // If flying, ignore terrain
        const isFlying = this.movement.type === 'flying';
        if (!isFlying && gameState.gridObjects.some(o => o.x === x && o.y === y && o.type === 'terrain')) {
             return false;
        }

        return true;
    }
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
    let resistChance = 0;
    if (target instanceof Player || target instanceof NpcAlly) { // <-- MODIFIED: Include NpcAlly
        resistChance = target.resistanceChance; // Base resist (includes Clankers bonus)

        // Add resistance from gear (Player only for now)
        if (target instanceof Player) { // <-- ADDED: Specific check for Player gear
            const shield = target.equippedShield;
            if (shield && shield.effect?.type === 'debuff_resist') {
                resistChance += (1 - resistChance) * shield.effect.chance; // Multiplicative stacking
            }
        }
         // Add resistance from status effects (like resist potions)
        const resistKey = `resist_${effectType}`; // Assumes potion effects match 'resist_poison', etc.
        if (target.statusEffects[resistKey]) {
             resistChance += (1 - resistChance) * (1 - target.statusEffects[resistKey].multiplier); // Convert multiplier (0.95) to resistance (0.05)
        }


        // Apply Human/Dragonborn/Halfling logic using rollForEffect
        // We are rolling to RESIST, so we use (1 - resistChance) as the "failure" chance
        if (target.rollForEffect(resistChance, 'Debuff Resist')) {
            const logMsg = (target instanceof Player) ? "You resisted" : `${target.name} resisted`; // <-- MODIFIED: Ally-aware log
            addToLog(`${logMsg} the ${effectType} effect from ${sourceName}!`, 'text-cyan-300 font-bold');
            return; // Effect resisted
        }
    }

    // --- AASIMAR: Divine Regeneration (Debuff Reduction) ---
    // <-- MODIFIED: Check for Player OR NpcAlly
    if ((target instanceof Player || target instanceof NpcAlly) && target.race === 'Aasimar') {
        if (effectData.duration && effectData.duration > 1) {
            effectData.duration = Math.max(1, effectData.duration - 1); // Reduce by 1, min 1
            const logMsg = (target instanceof Player) ? "Your divine nature lessens" : `${target.name}'s divine nature lessens`; // <-- MODIFIED: Ally-aware log
            addToLog(`${logMsg} the debuff's duration!`, "text-yellow-200");
        }
    }
    // --- End Aasimar Logic ---

    // Apply the effect if not resisted (or if target is not Player)
    target.statusEffects[effectType] = effectData;

    if (effectType === 'drenched' && target.statusEffects.debuff_viscous) {
        effectData.duration *= 2; // Double duration
        effectData.multiplier = (effectData.multiplier || 0.9) - 0.1; // Increase magnitude (make multiplier smaller)
        addToLog("The viscous liquid enhances the drenching effect!", "text-blue-600 font-bold");
        delete target.statusEffects.debuff_viscous; // Consume the viscous debuff
    }
    // --- End Viscous Liquid Interaction ---

    target.statusEffects[effectType] = effectData;

    // Log the effect application
    let message = '';
    let color = 'text-red-400'; // Default color for negative effects
    switch(effectType) {
        case 'poison':
             message = `You have been poisoned by ${sourceName}!`;
             color = 'text-green-600';
            break;
        case 'toxic': // Added toxic log
            message = `${sourceName} inflicts a deadly toxin!`;
            color = 'text-green-800 font-bold';
            break;
        case 'petrified':
            message = `${sourceName} gazes at you, turning your flesh to stone! You are petrified.`;
            color = 'text-gray-400 font-bold';
            break;
        case 'paralyzed':
            message = `${sourceName}'s blow stuns you! You are paralyzed!`; // Simplified message
            color = 'text-orange-500 font-bold';
            break;
        case 'swallowed':
            message = `${sourceName} opens its massive maw and swallows you whole!`;
            color = 'text-red-700 font-bold';
            break;
         case 'drenched': // Added log for enemy applying drench
             message = `${sourceName}'s attack leaves you Drenched! Your attacks are weaker.`;
             color = 'text-blue-400';
             break;
         // Add cases for other potential debuffs if needed
    }
    if (message) { // Only log if a message was defined
        addToLog(message, color);
    }
     // Update UI if the target is the player
     if (target instanceof Player) {
        updateStatsView();
    }
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

function generateBarracksRoster() {
    if (!player) return;

    // Ensure seed is valid
    if (player.seed === null || player.seed === undefined || isNaN(Number(player.seed))) {
         console.warn("Player seed invalid for Barracks roster. Using temporary random.");
         player.seed = Math.floor(Math.random() * 1000000);
    }
    const rng = seededRandom(player.seed); // Use the player's daily seed
    
    const availableRaces = Object.keys(RACES);
    const availableClasses = Object.keys(CLASSES);
    const availableNames = NPC_RANDOM_NAMES; // From game_data.js
    
    player.barracksRoster = []; // Clear the old roster
    
    for (let i = 0; i < 5; i++) {
        const raceKey = availableRaces[Math.floor(rng() * availableRaces.length)];
        const classKey = availableClasses[Math.floor(rng() * availableClasses.length)];
        const name = availableNames[Math.floor(rng() * availableNames.length)];
        
        // --- NEW: Determine weighted background ---
        const { backgroundKey, backgroundName } = _determineWeightedBackground(raceKey, classKey, rng);
        // --- END NEW ---

        player.barracksRoster.push({
            name: name,
            raceKey: raceKey,
            classKey: classKey,
            backgroundKey: backgroundKey,     // <-- ADDED
            backgroundName: backgroundName  // <-- ADDED
        });
    }
    
    console.log("New Barracks roster generated:", player.barracksRoster);
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
    const stockCount = 3 + Math.floor(rng() * 3); // 3 to 5 items
    player.blackMarketStock.seasonal = shuffled.slice(0, stockCount);
    console.log("Black market stock generated:", player.blackMarketStock.seasonal);
}


// --- PLAYER ACTIONS (OUT OF BATTLE) ---

function enchantItem(gearType, elementKey) {
    if (!player) return;

    let gear, currentElementProp;
    switch(gearType) {
        case 'weapon': gear = player.equippedWeapon; currentElementProp = 'weaponElement'; break;
        case 'armor': gear = player.equippedArmor; currentElementProp = 'armorElement'; break;
        case 'shield': gear = player.equippedShield; currentElementProp = 'shieldElement'; break;
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

    player[currentElementProp] = elementKey;

        addToLog(`You successfully enchanted your ${gear.name} with the power of ${elementKey}!`, 'text-green-400 font-bold');
    updateStatsView();
    renderEnchanter(elementKey); // Re-render to show updated state
}

function restAtInn(cost) {
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
        generateBarracksRoster(); // --- NEW: Refresh Barracks roster ---
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

function buyItem(itemKey, shopType, priceOverride = null) {
    const details = getItemDetails(itemKey);
    let finalPrice = priceOverride !== null ? priceOverride : details.price;

    // Apply Goblinoid discount
    let discountMultiplier = 1.0;
    if (player.race === 'Goblinoid') {
        discountMultiplier = 0.9; // Base 10% discount
        if (player.level >= 20 && player.rollForEffect(0.2, 'Goblinoid Buy Bonus')) {
            discountMultiplier -= 0.2; // Additional 20% discount (total 30%)
            addToLog("Sticky Fingers! You haggle an extra discount!", "text-green-300");
        }
    }
    finalPrice = Math.floor(finalPrice * discountMultiplier);


    if (player.gold >= finalPrice) {
        player.gold -= finalPrice;
        player.addToInventory(itemKey, 1, true); // Set verbose to true for log message
        addToLog(`Purchased for ${finalPrice} G.`, 'text-yellow-400'); // Log the final price
        updateStatsView(); // Update gold display
        // Re-render the specific shop view to update button states
        if (shopType === 'blacksmith') {
            renderBlacksmithBuy();
        } else if (shopType === 'magic') {
            renderSageTowerBuy();
        } else { // General store or black market
            renderShop(shopType);
        }
    } else {
         addToLog(`You cannot afford that item (Cost: ${finalPrice} G).`, "text-red-400"); // Add feedback with price
    }
}

function sellItem(category, itemKey, baseSellPrice) { // Renamed price -> baseSellPrice
    if (!player) return;

    const details = getItemDetails(itemKey);
    if (!details) return;

    // Prevent selling equipped items (important!)
    const isEquipped = (category === 'weapons' && player.equippedWeapon.name === details.name) ||
                     (category === 'armor' && player.equippedArmor.name === details.name) ||
                     (category === 'shields' && player.equippedShield.name === details.name) ||
                     (category === 'catalysts' && player.equippedCatalyst.name === details.name); // Added catalyst check
    if (isEquipped) {
        addToLog("You cannot sell an equipped item.", 'text-red-400');
        return;
    }


    let itemRemoved = false;
    if (category === 'items' || category === 'lures') { // Stackable items/lures
        if (player.inventory[category] && player.inventory[category][itemKey] && player.inventory[category][itemKey] > 0) {
            player.inventory[category][itemKey]--;
            if (player.inventory[category][itemKey] <= 0) {
                delete player.inventory[category][itemKey];
            }
            itemRemoved = true;
        }
    } else { // Non-stackable equipment
        const inventoryCategory = player.inventory[category];
        if (inventoryCategory) {
            const itemIndex = inventoryCategory.indexOf(itemKey); // Find first instance
            if (itemIndex > -1) {
                inventoryCategory.splice(itemIndex, 1); // Remove one instance
                itemRemoved = true;
            }
        }
    }

    if (itemRemoved) {
        // Apply Goblinoid bonus
        let finalSellPrice = baseSellPrice;
        let bonusMultiplier = 1.0;
        if (player.race === 'Goblinoid') {
            bonusMultiplier = 1.1; // Base 10% bonus
            if (player.level >= 20 && player.rollForEffect(0.2, 'Goblinoid Sell Bonus')) {
                bonusMultiplier += 0.2; // Additional 20% bonus (total 30%)
                addToLog("Sticky Fingers! You swindle some extra coin!", "text-green-300");
            }
        }
        finalSellPrice = Math.floor(finalSellPrice * bonusMultiplier);

        player.gold += finalSellPrice;
        addToLog(`You sold ${details.name} for ${finalSellPrice} G.`, 'text-yellow-400'); // Log the final price
        updateStatsView(); // Update gold
        renderSell(); // Re-render sell screen
    } else {
        addToLog("Could not find the item to sell.", 'text-red-400'); // Should not happen if UI is correct
    }
}

// *** CORRECTED useItem function definition ***
function useItem(itemKey, inBattle = false, targetIndex = null) {
    // --- NPC ALLY: Determine Target ---
    let target = player; // Default to player
    if (inBattle && targetIndex === -1) { // -1 is the flag for targeting the ally
        if (player.npcAlly && player.npcAlly.hp > 0 && !player.npcAlly.isFled) {
            target = player.npcAlly;
        } else {
            addToLog("Your ally is not a valid target.", 'text-red-400');
            if (inBattle) gameState.isPlayerTurn = true; // Give turn back
            isProcessingAction = false; // Unlock
            return false; // Failure
        }
    } else if (inBattle && targetIndex !== null) {
        // This block handles offensive items, target will be set later
    }
    // For out-of-battle use, target remains player
    // --- END NPC ALLY ---


    // Check if player has the item (explicitly check count is >= 1)
    const initialCount = Number(player.inventory.items[itemKey]) || 0; // Get count as number
    if (initialCount < 1) { // Check if count is less than 1
        addToLog("You don't have that item!", 'text-red-400');
        if (inBattle) renderBattle('item'); // Go back to item selection if in battle
        else renderInventory(); // Go back to inventory if out of battle
        if (inBattle) gameState.isPlayerTurn = true; // Give turn back if failed early
        isProcessingAction = false; // Unlock
        return false; // Indicate failure
    }

    const details = ITEMS[itemKey];
    if (!details) {
        console.error("Could not find details for item:", itemKey);
        if (inBattle) gameState.isPlayerTurn = true; // Give turn back
        isProcessingAction = false; // Unlock
        return false; // Indicate failure if item details don't exist
    }

    // --- Defer Consumption until *after* targeting checks (if applicable) ---
    let itemConsumed = false; // Flag to track consumption

    // --- NPC ALLY: Modified log message ---
    const targetName = (target === player) ? "You" : target.name;
    const verb = (target === player) ? "use" : "use on";
    addToLog(`${targetName} ${verb} a <span class="font-bold text-green-300">${details.name}</span>.`);
    // --- END NPC ALLY ---

    if (inBattle) gameState.isPlayerTurn = false; // Using an item costs the turn in battle


    // --- Apply Item Effects ---
    if (details.type === 'experimental') {
        // --- Consume Experimental Item ---
        let currentCountExp = Number(player.inventory.items[itemKey]) || 0;
        if (currentCountExp > 0) {
            currentCountExp--;
            if (currentCountExp <= 0) {
                delete player.inventory.items[itemKey];
            } else {
                player.inventory.items[itemKey] = currentCountExp;
            }
            itemConsumed = true;
        } else {
            // Should not happen due to initial check, but handle defensively
            addToLog("Error consuming experimental item.", 'text-red-500');
            if (inBattle) gameState.isPlayerTurn = true; // Give turn back
            return false;
        }
        // --- End Consume ---

        const tier = details.tier;
        const numEffects = tier;
        addToLog("The concoction bubbles violently as you drink it...", "text-purple-400");

        setTimeout(() => {
            for (let i = 0; i < numEffects; i++) {
                const isGood = Math.random() < 0.33; // 1/3 chance for a good effect
                const effectPool = isGood ? MYSTERIOUS_CONCOCTION_EFFECTS.good : MYSTERIOUS_CONCOCTION_EFFECTS.bad;
                // Select a random effect from the chosen pool
                const randomEffect = effectPool[Math.floor(Math.random() * effectPool.length)];

                addToLog(randomEffect.message, isGood ? 'text-green-300' : 'text-red-400');
                randomEffect.apply(player); // Apply the effect function
                updateStatsView(); // Update UI after each effect potentially
            }
            // After all effects are applied
            if (inBattle) {
                // MODIFICATION: Call finalizePlayerAction instead of checkBattleStatus
                finalizePlayerAction(); // Properly end the turn sequence
            } else {
                renderInventory(); // Re-render inventory outside battle
            }
        }, 1000); // Delay for dramatic effect
        return true; // Indicate success (item was used)
    }

    // --- Targeting Items (Bombs, Stones, Essences in battle) ---
    if ( (details.type === 'debuff_apply' || details.type === 'debuff_special' || (details.type === 'enchant' && inBattle)) && inBattle) {
        // --- NPC ALLY: Target is already set for offensive items from castSpell/handleCellClick ---
        const enemyTarget = currentEnemies[targetIndex]; // Re-get enemy target
        if (targetIndex === null || !enemyTarget || !enemyTarget.isAlive()) {
        // --- END NPC ALLY ---
            addToLog("You must select a valid target.", 'text-red-400');
             if(inBattle) renderBattle('item'); // Go back to item select
             gameState.isPlayerTurn = true; // Give turn back if targeting failed
             isProcessingAction = false; // Unlock actions
             return false; // Indicate failure
        }

        // --- Consume Targeting Item NOW ---
        let currentCountTarget = Number(player.inventory.items[itemKey]) || 0;
        if (currentCountTarget > 0) {
            currentCountTarget--;
            if (currentCountTarget <= 0) {
                delete player.inventory.items[itemKey];
            } else {
                player.inventory.items[itemKey] = currentCountTarget;
            }
            itemConsumed = true;
        } else {
            // Should not happen, but handle defensively
            addToLog("Error consuming targeting item.", 'text-red-500');
            if (inBattle) gameState.isPlayerTurn = true; // Give turn back
            return false;
        }
        // --- End Consume ---


        // Apply minimal damage if specified (bombs/stones)
        if ((details.type === 'debuff_apply' || details.type === 'debuff_special') && details.effect.damage) {
            enemyTarget.takeDamage(details.effect.damage, {element: details.effect.element || 'none'});
            addToLog(`The ${details.name} hits ${enemyTarget.name} for minor damage.`);
        }

        // Apply debuff to target or buff to player (bombs/stones)
        if (details.type === 'debuff_apply') {
            enemyTarget.statusEffects[details.effect.type] = { ...details.effect }; // Apply debuff to enemy
            addToLog(`${enemyTarget.name} is affected by the ${details.name}!`);
        } else if (details.type === 'debuff_special') { // Currently only Artificial Light Stone
            player.statusEffects[details.effect.type] = { ...details.effect }; // Apply buff to player
            addToLog(`You feel the power of the ${details.name} coursing through you!`);
        }
        // Apply Essence damage in battle
        else if (details.type === 'enchant' && inBattle) {
            const element = itemKey.replace('_essence', '');
            // Simple damage calculation for essence use
            const damageRoll = rollDice(1, 8, 'Essence Attack');
            let damage = damageRoll.total + player.magicalDamageBonus;

            // --- ELEMENTAL: Innate Elementalist (Damage) ---
            if (player.race === 'Elementals' && element === player.elementalAffinity) {
                const damageBonus = (player.level >= 20) ? 1.20 : 1.10;
                damage = Math.floor(damage * damageBonus);
                if (player.level >= 20) {
                     damage += rollDice(1, 8, 'Elemental Essence Evo').total; // Add extra die
                }
            }
            // --- End Elemental Logic ---


            // --- DRAGONBORN: Bloodline Attunement (Damage) ---
            if (player.race === 'Dragonborn') { // No check for elementalAffinity here
                const damageBonus = (player.level >= 20) ? 1.20 : 1.10;
                damage = Math.floor(damage * damageBonus);
            }
            // --- End Dragonborn Logic ---


            addToLog(`You channel the ${details.name}, unleashing a blast of ${element} energy!`, 'text-yellow-300');
             const finalDamage = enemyTarget.takeDamage(damage, { isMagic: true, element: element }); // Apply as magic damage
             addToLog(`It hits ${enemyTarget.name} for <span class="font-bold text-purple-400">${finalDamage}</span> ${element} damage.`);
        }

        updateStatsView(); // Update inventory count

         // Check status immediately after item use
         if (!gameState.battleEnded) {
            checkBattleStatus(true); // isReaction = true for direct damage/debuff items?
         }
          finalizePlayerAction(); // Properly end the turn sequence
         return true; // Indicate success

    }
    // --- End Targeting Items ---

    // --- Standard Consumable Effects (healing, mana, buffs, cleanse) ---
    // Apply these only if item wasn't a targeting type handled above
    if (details.type !== 'debuff_apply' && details.type !== 'debuff_special' && !(details.type === 'enchant' && inBattle)) {

        // --- Consume Standard Item ---
        let currentCountStd = Number(player.inventory.items[itemKey]) || 0;
        if (currentCountStd > 0) {
            currentCountStd--;
            if (currentCountStd <= 0) {
                delete player.inventory.items[itemKey];
            } else {
                player.inventory.items[itemKey] = currentCountStd;
            }
            itemConsumed = true;
        } else {
             // Should not happen, but handle defensively
            addToLog("Error consuming standard item.", 'text-red-500');
            if (inBattle) gameState.isPlayerTurn = true; // Give turn back
            return false;
        }
        // --- End Consume ---

        // --- NPC ALLY: Apply effects to 'target' (player OR ally) ---
        if (details.type === 'healing') {
            const healAmount = details.amount;
            target.hp = Math.min(target.maxHp, target.hp + healAmount);
             addToLog(`${targetName} recover${(target === player) ? '' : 's'} <span class="font-bold text-green-400">${healAmount}</span> HP.`, 'text-green-300'); // Specific log for healing
        } else if (details.type === 'mana_restore') {
            const restoreAmount = details.amount;
            let currentMp = Number(target.mp) || 0;
            let maxMp = Number(target.maxMp) || 1; // Default maxMP to 1 to avoid division by zero later
            target.mp = Math.min(maxMp, currentMp + restoreAmount); // Use validated numbers
            addToLog(`${targetName} restore${(target === player) ? '' : 's'} <span class="font-bold text-blue-400">${restoreAmount}</span> MP.`, 'text-blue-300'); // Specific log for mana
        } else if (details.type === 'buff' && details.effect) { // Added check for details.effect
             // Apply buff effect from item data
             // Note: These are temporary battle buffs, not food buffs
             target.statusEffects[details.effect.type] = { ...details.effect }; // Copy effect data
             addToLog(`${targetName} feel${(target === player) ? '' : 's'} the effects of the ${details.name}!`, 'text-yellow-300');
        } else if (details.type === 'cleanse') {
            // --- General Cleanse ---
            const badEffects = ['poison', 'petrified', 'paralyzed', 'swallowed', 'toxic', 'drenched']; // Added toxic, drenched
            let cleansed = false;
            for (const effect of badEffects) {
                if (target.statusEffects[effect]) {
                    delete target.statusEffects[effect];
                    cleansed = true;
                }
            }
             if (cleansed) addToLog(`${targetName} drink${(target === player) ? '' : 's'} the ${details.name} and feel${(target === player) ? '' : 's'} purified.`, 'text-cyan-300');
             else addToLog(`${targetName} drink${(target === player) ? '' : 's'} the ${details.name}, but there were no effects to cleanse.`, 'text-gray-400');
        } else if (details.type === 'cleanse_specific') {
            // --- Specific Cleanse (New Items) ---
            const effectsToCleanse = details.effects_to_cleanse || [];
            let specificCleansed = false;
            for (const effect of effectsToCleanse) {
                if (target.statusEffects[effect]) {
                    delete target.statusEffects[effect];
                    specificCleansed = true;
                }
            }
            if (specificCleansed) {
                 if (itemKey === 'natural_antidote') {
                    addToLog(`The antidote courses through ${targetName}, neutralizing the poison!`, 'text-green-400');
                 } else if (itemKey === 'anti_paralytic_needle') {
                    addToLog(`The needle jolts ${targetName}'s nerves, freeing them from paralysis!`, 'text-yellow-300');
                 } else {
                    addToLog(`The ${details.name} cleanses specific ailments from ${targetName}.`, 'text-cyan-300'); // Generic fallback
                 }
            } else {
                 addToLog(`${targetName} use${(target === player) ? '' : 's'} the ${details.name}, but there were no relevant effects to cleanse.`, 'text-gray-400');
            }
        }
        // --- END NPC ALLY ---
    }
    // --- End Standard Consumable Effects ---


    updateStatsView(); // Update UI after applying effects
    // --- NPC ALLY: Update grid if ally was target ---
    if (inBattle && target !== player) {
        renderBattleGrid(); // Re-render grid to show ally's new HP/etc
    }
    // --- END NPC ALLY ---

    // Transition after effects
    if (!inBattle) {
        renderInventory(); // Re-render inventory if used outside battle
    } else {
        // Finalize action if it wasn't a targeting item (those finalize above)
        if (details.type !== 'debuff_apply' && details.type !== 'debuff_special' && details.type !== 'enchant') {
             finalizePlayerAction(); // Properly end the turn sequence
        }
    }
    return true; // Indicate success
}




function equipItem(itemKey, inBattle = false) {
    // Basic validation
    const details = getItemDetails(itemKey);
    if (!details || !player) {
        console.error("equipItem failed: Invalid details or player object.");
        if (inBattle && gameState.isPlayerTurn === false) { gameState.isPlayerTurn = true; isProcessingAction = false;} // Refund turn if possible
        return;
    }

    // --- BATTLE-SPECIFIC CHECKS ---
    let turnConsumed = false;
    if (inBattle) {
        if (!gameState.isPlayerTurn || isProcessingAction) {
            addToLog("Cannot change gear right now.", 'text-red-400');
            return;
        }
        isProcessingAction = true;
        gameState.isPlayerTurn = false; // Assume turn consumed
        turnConsumed = true;
    }
    // --- END BATTLE CHECKS ---


    let itemType = null;
    let categoryName = ''; // e.g., 'weapons'
    if (WEAPONS[itemKey]) { itemType = 'weapon'; categoryName = 'weapons'; }
    else if (CATALYSTS[itemKey]) { itemType = 'catalyst'; categoryName = 'catalysts'; }
    else if (SHIELDS[itemKey]) { itemType = 'shield'; categoryName = 'shields'; }
    else if (ARMOR[itemKey]) { itemType = 'armor'; categoryName = 'armor'; }
    else if (LURES[itemKey]) { itemType = 'lure'; categoryName = 'lures'; }

    // --- Check if item exists in inventory BEFORE proceeding ---
    let itemFoundInInventory = false;
    if (itemType !== 'lure') {
        if (!player.inventory[categoryName]) player.inventory[categoryName] = []; // Ensure array exists
        itemFoundInInventory = player.inventory[categoryName].includes(itemKey);

        if (!itemFoundInInventory) {
            console.warn(`Attempted to equip ${itemKey} (${categoryName}), but not found in inventory array:`, player.inventory[categoryName]);
            addToLog(`Cannot find ${details.name} in your inventory.`, 'text-red-400');
            if (turnConsumed) { isProcessingAction = false; gameState.isPlayerTurn = true; } // Refund turn
            return;
        }
    } else { // Lure check (uses object)
         if (!player.inventory.lures || !(itemKey in player.inventory.lures) || player.inventory.lures[itemKey] <= 0) {
              console.warn(`Attempted to equip lure ${itemKey}, but not found or uses depleted.`);
              addToLog(`Cannot find ${details.name} in your inventory.`, 'text-red-400');
               if (turnConsumed) { isProcessingAction = false; gameState.isPlayerTurn = true; } // Refund turn
              return;
         }
         itemFoundInInventory = true; // Mark as found for lures if check passes
    }
    // --- END INVENTORY CHECK ---

    let equipSuccessful = false; // Flag to track success
    let oldItemKey = null; // Key of the item being replaced
    let oldCategoryName = ''; // Category of the item being replaced

    // Armor equipping
    if (itemType === 'armor') {
        if (player.equippedArmor.name === details.name) {
             if (turnConsumed) { addToLog("Already equipped.", 'text-yellow-400'); isProcessingAction = false; gameState.isPlayerTurn = true; } // Refund
             return;
        }
        oldCategoryName = 'armor';
        if (player.equippedArmor.name !== ARMOR['travelers_garb'].name) {
            oldItemKey = findKeyByInstance(ARMOR, player.equippedArmor);
            if (!oldItemKey) console.error(`Could not find key for old armor: ${player.equippedArmor.name}`);
        }
        player.equippedArmor = details; // Equip new armor OBJECT
        player.armorElement = 'none';
        equipSuccessful = true;
        // NO LONGER REMOVE new armor KEY from inventory array

    }
    // Lure equipping (prevented in battle)
    else if (itemType === 'lure') {
        if (inBattle) {
             addToLog("Cannot change lures during battle.", 'text-red-400');
             isProcessingAction = false; gameState.isPlayerTurn = true; // Refund
             return;
         }
        if (player.equippedLure === itemKey) return;
        // No old key to add back for lures
        player.equippedLure = itemKey; // Equip new lure KEY
        equipSuccessful = true;
        // Lures are not in arrays, no removal needed

    }
    // Weapon, Catalyst, Shield equipping
    else if (itemType) {
        const isCurrentlyEquipped =
            (itemType === 'weapon' && player.equippedWeapon?.name === details.name) ||
            (itemType === 'catalyst' && player.equippedCatalyst?.name === details.name) ||
            (itemType === 'shield' && player.equippedShield?.name === details.name);
        if (isCurrentlyEquipped) {
            if (turnConsumed) { addToLog("Already equipped.", 'text-yellow-400'); isProcessingAction = false; gameState.isPlayerTurn = true; } // Refund
            return;
        }

        // --- Two-Handed Check & Forced Unequips ---
        let isTwoHanded = false;
        if (itemType === 'weapon') {
            isTwoHanded = details.class === 'Hand-to-Hand' || details.effect?.dualWield;
            if (isTwoHanded && details.class === 'Hand-to-Hand' && player.race === 'Beastkin' && player.level >= 20) isTwoHanded = false;
            if (isTwoHanded) {
                // unequipItem internally adds old item key back to inventory
                if (player.equippedShield?.name !== SHIELDS['no_shield'].name) unequipItem('shield', false, false);
                if (player.equippedCatalyst?.name !== CATALYSTS['no_catalyst'].name) unequipItem('catalyst', false, false);
            }
        }
        // Check equipping shield/catalyst with two-handed
        let isEquippedWeaponTwoHanded = player.equippedWeapon?.class === 'Hand-to-Hand' || player.equippedWeapon?.effect?.dualWield;
        if (isEquippedWeaponTwoHanded && player.equippedWeapon?.class === 'Hand-to-Hand' && player.race === 'Beastkin' && player.level >= 20) isEquippedWeaponTwoHanded = false;
        if ((itemType === 'shield' || itemType === 'catalyst') && isEquippedWeaponTwoHanded) {
            addToLog(`Cannot use a ${itemType} while using ${player.equippedWeapon.name}.`, 'text-red-400');
            if (turnConsumed) { isProcessingAction = false; gameState.isPlayerTurn = true; } // Refund
            return;
        }

        // --- Off-hand Slot Logic & Forced Unequips ---
        if (!Array.isArray(player.equipmentOrder)) player.equipmentOrder = [];
        const typeIndex = player.equipmentOrder.indexOf(itemType);
        if (typeIndex > -1) player.equipmentOrder.splice(typeIndex, 1); // Remove old entry if same type
        if (player.equipmentOrder.length >= 2) {
            const typeToUnequip = player.equipmentOrder.shift(); // Get oldest type
            if (typeToUnequip !== itemType) { // Only unequip if different type
                 // unequipItem internally adds old item key back to inventory
                 let unequippedItemName = '';
                 if (typeToUnequip === 'weapon') { unequippedItemName = player.equippedWeapon.name; unequipItem('weapon', false, false); }
                 else if (typeToUnequip === 'catalyst') { unequippedItemName = player.equippedCatalyst.name; unequipItem('catalyst', false, false); }
                 else if (typeToUnequip === 'shield') { unequippedItemName = player.equippedShield.name; unequipItem('shield', false, false); }
                 if (unequippedItemName && !['None', 'Fists', "Traveler's Garb"].includes(unequippedItemName)) {
                     addToLog(`Unequipped ${unequippedItemName} for the ${details.name}.`, 'text-yellow-500');
                 }
            }
        }
        player.equipmentOrder.push(itemType); // Add new type to end

        // --- Store Key of Old Item BEFORE assigning new one ---
        oldCategoryName = categoryName; // Category is the same for old/new here
        if (itemType === 'weapon' && player.equippedWeapon?.name !== WEAPONS['fists'].name) oldItemKey = findKeyByInstance(WEAPONS, player.equippedWeapon);
        else if (itemType === 'catalyst' && player.equippedCatalyst?.name !== CATALYSTS['no_catalyst'].name) oldItemKey = findKeyByInstance(CATALYSTS, player.equippedCatalyst);
        else if (itemType === 'shield' && player.equippedShield?.name !== SHIELDS['no_shield'].name) oldItemKey = findKeyByInstance(SHIELDS, player.equippedShield);

        // Assign the new equipment OBJECT
        if (itemType === 'weapon') { player.equippedWeapon = details; player.weaponElement = 'none'; }
        else if (itemType === 'catalyst') { player.equippedCatalyst = details; }
        else if (itemType === 'shield') { player.equippedShield = details; player.shieldElement = 'none'; }

        equipSuccessful = true; // Mark as successful for inventory adjustment below

    } else { // Should not be reachable
        console.error("Unknown item type for equip:", itemKey);
        if (turnConsumed) { isProcessingAction = false; gameState.isPlayerTurn = true; } // Refund
        return;
    }

    // --- Inventory Adjustments (AFTER potential unequips and successful new equip assignment) ---
    if (equipSuccessful) {
        // Add the old item KEY back to its inventory array (if one was replaced and not default)
        if (oldItemKey && oldCategoryName) {
            if (!player.inventory[oldCategoryName]) player.inventory[oldCategoryName] = []; // Ensure array exists
            // --- Check if old item is already in inventory before adding ---
            if (!player.inventory[oldCategoryName].includes(oldItemKey)) {
                player.inventory[oldCategoryName].push(oldItemKey);
                console.log(`Added old ${oldCategoryName.slice(0,-1)} key ${oldItemKey} back to inventory.${oldCategoryName}.`);
            } else {
                 console.log(`Old ${oldCategoryName.slice(0,-1)} key ${oldItemKey} was already in inventory.`);
            }
        }

        // --- DO NOT REMOVE the newly equipped item KEY from its inventory array ---
        // if (itemType !== 'lure') { ... removal logic removed ... }
        console.log(`Equipped ${itemType} key ${itemKey} - Item remains in inventory list.`);
    }
    // --- End Inventory Adjustments ---


    // --- Final Steps ---
    if (equipSuccessful) {
        if (turnConsumed) {
            addToLog(`You spend your turn equipping the ${details.name}.`, 'text-yellow-300');
        }
        addToLog(`Equipped: <span class="font-bold text-cyan-300">${details.name}</span>.`);
        updateStatsView();

        if (inBattle) {
            console.log("Equip successful in battle, calling returnToBattleFromInventory...");
            // returnToBattleFromInventory handles grid render & turn finalization & isProcessingAction reset
            returnToBattleFromInventory();
        } else if (gameState.currentView === 'inventory') {
            renderInventory(); // Only re-render inventory if OUTSIDE battle
        }
    } else if (turnConsumed) {
        // If equip failed after setting flags, refund turn
         isProcessingAction = false;
         gameState.isPlayerTurn = true;
         // Render inventory again to show the failed state clearly
         if(inBattle) renderInventory();
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

    let unequippedItemName = '';
    let changed = false;
    let turnConsumed = false;

    // --- BATTLE-SPECIFIC CHECKS (only if called directly from inventory) ---
    if (inBattle) {
        if (!gameState.isPlayerTurn || isProcessingAction) {
            addToLog("Cannot change gear right now.", 'text-red-400');
            return;
        }
        isProcessingAction = true;
        gameState.isPlayerTurn = false; // Assume turn consumed
        turnConsumed = true;
    }
    // --- END BATTLE CHECKS ---

    let itemKeyToAdd = null; // Key of the item being unequipped
    let defaultItem = null; // Store the default item object
    let categoryName = ''; // e.g., 'weapons'

    switch (itemType) {
        case 'weapon':
            defaultItem = WEAPONS['fists'];
            categoryName = 'weapons';
            if (player.equippedWeapon.name === defaultItem.name) {
                if(turnConsumed) { addToLog("Fists already equipped.", 'text-yellow-400'); isProcessingAction = false; gameState.isPlayerTurn = true; } return; // Refund if trying to unequip default
            }
            unequippedItemName = player.equippedWeapon.name;
            itemKeyToAdd = findKeyByInstance(WEAPONS, player.equippedWeapon);
            player.equippedWeapon = defaultItem;
            player.weaponElement = 'none';
            changed = true;
            break;
        case 'catalyst':
            defaultItem = CATALYSTS['no_catalyst'];
            categoryName = 'catalysts';
            if (player.equippedCatalyst.name === defaultItem.name) {
                 if(turnConsumed) { addToLog("No catalyst already equipped.", 'text-yellow-400'); isProcessingAction = false; gameState.isPlayerTurn = true; } return;
            }
            unequippedItemName = player.equippedCatalyst.name;
            itemKeyToAdd = findKeyByInstance(CATALYSTS, player.equippedCatalyst);
            player.equippedCatalyst = defaultItem;
            changed = true;
            break;
        case 'armor':
            defaultItem = ARMOR['travelers_garb'];
            categoryName = 'armor';
            if (player.equippedArmor.name === defaultItem.name) {
                 if(turnConsumed) { addToLog("Traveler's Garb already equipped.", 'text-yellow-400'); isProcessingAction = false; gameState.isPlayerTurn = true; } return;
            }
            unequippedItemName = player.equippedArmor.name;
            itemKeyToAdd = findKeyByInstance(ARMOR, player.equippedArmor);
            player.equippedArmor = defaultItem;
            player.armorElement = 'none';
            changed = true;
            break;
        case 'shield':
            defaultItem = SHIELDS['no_shield'];
            categoryName = 'shields';
            if (player.equippedShield.name === defaultItem.name) {
                 if(turnConsumed) { addToLog("No shield already equipped.", 'text-yellow-400'); isProcessingAction = false; gameState.isPlayerTurn = true; } return;
            }
            unequippedItemName = player.equippedShield.name;
            itemKeyToAdd = findKeyByInstance(SHIELDS, player.equippedShield);
            player.equippedShield = defaultItem;
            player.shieldElement = 'none';
            changed = true;
            break;
        case 'lure':
             if (inBattle) {
                 addToLog("Cannot change lures during battle.", 'text-red-400');
                 isProcessingAction = false; gameState.isPlayerTurn = true; // Refund
                 return;
             }
            categoryName = 'lures'; // Set category just for consistency
            if (player.equippedLure === 'no_lure') return; // Already default
            unequippedItemName = LURES[player.equippedLure].name;
            // No key to add back for lures
            player.equippedLure = 'no_lure';
            changed = true;
            break;
        default:
             if (turnConsumed) { isProcessingAction = false; gameState.isPlayerTurn = true; } // Refund if invalid type called in battle
            return;
    }

    // Update equipment order if weapon/catalyst/shield was unequipped
    if (changed && ['weapon', 'catalyst', 'shield'].includes(itemType)) {
        if (!Array.isArray(player.equipmentOrder)) player.equipmentOrder = [];
        const typeIndex = player.equipmentOrder.indexOf(itemType);
        if (typeIndex > -1) {
            player.equipmentOrder.splice(typeIndex, 1);
        }
    }

    // --- DO NOT Add the unequipped item KEY back to inventory array ---
    // The key should already be there since we stopped removing it on equip.
    if (changed && itemKeyToAdd && categoryName && itemType !== 'lure') {
        // We can add a check here just to be SUPER sure it exists
         if (!player.inventory[categoryName]) player.inventory[categoryName] = [];
         if (!player.inventory[categoryName].includes(itemKeyToAdd)) {
             // This case means something went very wrong earlier (like the item *was* removed on equip)
             console.warn(`Attempted to unequip ${itemKeyToAdd}, but it wasn't found in inventory.${categoryName}. Adding it back now.`);
             player.inventory[categoryName].push(itemKeyToAdd);
         } else {
             console.log(`Unequipped ${itemType} key ${itemKeyToAdd}. Key remains in inventory list.`);
         }
    } else if (changed && itemType !== 'lure' && !itemKeyToAdd) {
        // Critical error finding the key
        console.error(`CRITICAL ERROR: Could not find key for unequipped item: ${unequippedItemName} of type ${itemType}.`);
        addToLog(`Critical Error: Could not properly track ${unequippedItemName} during unequip.`, 'text-red-600 font-bold');
        changed = false; // Mark as failed
        if (turnConsumed) { isProcessingAction = false; gameState.isPlayerTurn = true; } // Refund turn
    }
    // --- END Inventory Adjustment Change ---

    // --- Final Steps ---
    if (changed) {
        if (turnConsumed) {
            addToLog(`You spend your turn unequipping the ${unequippedItemName}.`, 'text-yellow-300');
        }
        addToLog(`Unequipped: <span class="font-bold text-cyan-300">${unequippedItemName}</span>.`);
        updateStatsView();

        if (inBattle) {
            console.log("Unequip successful in battle, calling returnToBattleFromInventory...");
            returnToBattleFromInventory(); // Handles grid render & turn finalization & isProcessingAction reset
        } else if (shouldRender && gameState.currentView === 'inventory') {
            renderInventory(); // Only re-render inventory if OUTSIDE battle and requested
        }
    } else if (turnConsumed) {
        // If unequip failed, refund turn
        isProcessingAction = false;
        gameState.isPlayerTurn = true;
        if(inBattle) renderInventory(); // Show failed state
    }
}





function brewWitchPotion(recipeKey) {
    const recipe = WITCH_COVEN_RECIPES[recipeKey];
    if (!recipe || !recipe.hearts) return; // Ensure it's a potion recipe

    if (player.gold < recipe.cost) {
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
    player.gold -= recipe.cost;
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

function determineBrewingOutcome(ingredients) {
    const alchemyTier = player.house.alchemyTier || 1;
    const ingredientCounts = {};
    ingredients.forEach(key => {
        ingredientCounts[key] = (ingredientCounts[key] || 0) + 1;
    });

    // Check for exact recipe match first
    for (const recipeKey in ALCHEMY_RECIPES) {
        const recipe = ALCHEMY_RECIPES[recipeKey];
        // Ensure recipe matches the current lab tier
        if (recipe.tier !== alchemyTier) continue;

        const recipeIngredients = recipe.ingredients;
        let isMatch = true;
        // Check if number of ingredient types match
        if (Object.keys(recipeIngredients).length !== Object.keys(ingredientCounts).length) {
            isMatch = false;
        } else {
             // Check if counts for each ingredient type match
            for (const itemKey in recipeIngredients) {
                if (ingredientCounts[itemKey] !== recipeIngredients[itemKey]) {
                    isMatch = false;
                    break;
                }
            }
        }
        // If it's an exact match, return success
        if (isMatch) {
            return { success: true, potion: recipe.output, message: `You successfully brewed a ${getItemDetails(recipe.output).name}!` };
        }
    }

    // --- Experimental Brewing Logic (if no exact match) ---
    // Count ingredient types (primary, secondary, catalyst)
    const ingredientTypes = { primary_reagent: 0, secondary_reagent: 0, catalyst: 0 };
    let totalIngredients = 0;
    Object.keys(ingredientCounts).forEach(key => {
        const details = getItemDetails(key);
        if (details && details.alchemyType) {
            const type = details.alchemyType;
             if (ingredientTypes.hasOwnProperty(type)) { // Only count known types
                 ingredientTypes[type] += ingredientCounts[key];
                 totalIngredients += ingredientCounts[key];
             }
        }
    });


    let outcome;
    const rand = Math.random();
    const failurePotion = `mysterious_concoction_t${alchemyTier}`;
    const failureMessage = "The mixture bubbles violently and settles into a strange, unpredictable brew...";

     // Find all possible potions for the current tier
    const allPotionsOfTier = Object.values(ALCHEMY_RECIPES)
                                   .filter(r => r.tier === alchemyTier)
                                   .map(r => r.output);
    const randomPotion = allPotionsOfTier.length > 0
        ? allPotionsOfTier[Math.floor(Math.random() * allPotionsOfTier.length)]
        : failurePotion; // Fallback if no potions for tier somehow


    // Basic logic: More catalysts or secondary = higher failure chance
    // This is a simplified placeholder. Could be much more complex.
    const catalystRatio = totalIngredients > 0 ? (ingredientTypes.catalyst / totalIngredients) : 0;
    const secondaryRatio = totalIngredients > 0 ? (ingredientTypes.secondary_reagent / totalIngredients) : 0;
    const failureChance = 0.3 + (catalystRatio * 0.4) + (secondaryRatio * 0.2); // Base 30% + penalty


    if (rand < failureChance || !randomPotion) { // Fail or no valid random potion
        outcome = { success: false, potion: failurePotion, message: failureMessage };
    } else { // Success (random potion)
        outcome = { success: true, potion: randomPotion, message: "A happy accident! You've created a useful potion." };
    }

    return outcome;
}

function brewHomePotion(ingredients, outcome) {
    const ingredientCounts = {};
    ingredients.forEach(key => {
        ingredientCounts[key] = (ingredientCounts[key] || 0) + 1;
    });

    // Consume ingredients from player inventory
    for(const key in ingredientCounts) {
        if (player.inventory.items[key]) {
             player.inventory.items[key] -= ingredientCounts[key];
            if(player.inventory.items[key] <= 0) {
                delete player.inventory.items[key];
            }
        } else {
             console.error(`Attempted to consume non-existent ingredient: ${key}`);
             // Optionally add error handling or logging here
        }
    }


    addToLog(outcome.message, outcome.success ? 'text-green-400' : 'text-purple-400');
    player.addToInventory(outcome.potion, 1, false); // Add result silently first

    // Quest progress check
    if (player.activeQuest && player.activeQuest.category === 'creation' && player.activeQuest.target === outcome.potion) {
        player.questProgress++;
        addToLog(`Quest progress: ${player.questProgress}/${getQuestDetails(player.activeQuest).required}`, 'text-amber-300');
    }
     updateStatsView(); // Update inventory display potentially needed here
    return true; // Indicate brewing attempt was made
}


function craftGear(recipeKey, sourceShop) {
    const recipe = (sourceShop === 'magic' ? MAGIC_SHOP_RECIPES[recipeKey] : BLACKSMITH_RECIPES[recipeKey]);
    if (!recipe) return;

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
    if (player.gold < recipe.cost) {
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

function restAtHouse() {
    player.hp = player.maxHp;
    player.mp = player.maxMp;
     player.questsTakenToday = []; // Reset daily quest limit
     player.seed = Math.floor(Math.random() * 1000000); // Generate new seed for the 'day'
     generateBlackMarketStock(); // Refresh black market stock
     generateBarracksRoster(); // --- NEW: Refresh Barracks roster ---
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
    if (!player || !player.house.owned || player.house.gardenTier === 0) return;
    // Added check for game view
    if (gameState.currentView !== 'garden') return;

    if (!Array.isArray(player.house.garden)) {
        console.error("Garden data was not an array! Resetting to prevent crash.");
        player.house.garden = [];
    }
     if (!Array.isArray(player.house.treePlots)) {
        player.house.treePlots = [];
    }


    const now = Date.now();
    let needsRender = false;

    const checkPlots = (plots) => {
        if (!Array.isArray(plots)) return;
        plots.forEach(plot => {
            if (plot && plot.seed && plot.plantedAt > 0 && plot.growthStage < 3) { // Only check growing plants
                const seedInfo = SEEDS[plot.seed];
                if (!seedInfo) return; // Skip if seed data is invalid

                const timePassed = now - plot.plantedAt;
                const currentStage = plot.growthStage;
                let newStage = 0;
                if (timePassed >= seedInfo.growthTime) {
                    newStage = 3; // Fully grown
                } else if (timePassed >= seedInfo.growthTime * 0.66) {
                    newStage = 2; // Sprout -> Growing
                } else if (timePassed >= seedInfo.growthTime * 0.33) {
                    newStage = 1; // Seedling -> Sprout
                } else {
                     newStage = 0; // Still seedling
                }


                if (newStage > currentStage) { // Only update if stage *increased*
                    plot.growthStage = newStage;
                    needsRender = true;
                }
            }
        });
    };

    checkPlots(player.house.garden);
    checkPlots(player.house.treePlots);


    if (needsRender) {
         console.log("Garden state updated, re-rendering.");
        renderGarden(); // Re-render if any plot changed stage
    }
}


function plantSeed(plotIndex, seedKey, isTreePlot) {
     const targetArray = isTreePlot ? player.house.treePlots : player.house.garden;
     // Basic validation
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


