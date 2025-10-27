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

            // Check for blocking entities (player or other enemies)
            const isOccupiedByEntity = (currentEnemies.some(e => e.isAlive() && e.x === neighbor.x && e.y === neighbor.y) || (player.x === neighbor.x && player.y === neighbor.y));
            if (isOccupiedByEntity && !(neighbor.x === end.x && neighbor.y === end.y)) continue;

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
        if (baseChance <= 0) return false;
        if (baseChance >= 1) return true;

        let modifiedChance = baseChance;

        // 1. Apply Dragonborn penalty first
        if (this.race === 'Dragonborn') {
            const penalty = (this.level >= 20) ? 0.25 : 0.5; // 75% reduction or 50% reduction
            modifiedChance *= penalty;
        }

        // 2. Apply Human bonus
        // Note: applyRacialPassive already checks if the player is Human
        modifiedChance = this.applyRacialPassive(modifiedChance);

        // 3. Make the initial roll
        let roll = Math.random();
        if (roll < modifiedChance) {
            if (isDebugVisible) console.log(`Racial Roll [${debugPurpose}]: SUCCESS (Base: ${baseChance.toFixed(2)}, Mod: ${modifiedChance.toFixed(2)}, Roll: ${roll.toFixed(2)})`);
            return true; // Success!
        }

        // 4. Handle Halfling reroll on failure
        if (this.race === 'Halfling') {
            const rerollChance = (this.level >= 20) ? (1/6) : 0.10; // 10% or 1-in-6
            if (Math.random() < rerollChance) {
                // Halfling luck triggers a *recalculation* against the modified chance, not a guaranteed success
                let reroll = Math.random();
                if (reroll < modifiedChance) {
                    addToLog("Your uncanny luck grants you a second chance... and it succeeds!", "text-green-300");
                    if (isDebugVisible) console.log(`Racial Roll [${debugPurpose}]: HALFLING SUCCESS (Base: ${baseChance.toFixed(2)}, Mod: ${modifiedChance.toFixed(2)}, Reroll: ${reroll.toFixed(2)})`);
                    return true; // Reroll succeeded!
                }
            }
            // If Halfling luck didn't trigger, or the reroll also failed
            if (isDebugVisible) console.log(`Racial Roll [${debugPurpose}]: FAIL (Base: ${baseChance.toFixed(2)}, Mod: ${modifiedChance.toFixed(2)}, Roll: ${roll.toFixed(2)})`);
            return false;
        }

        // 5. Standard failure for all other races
        if (isDebugVisible) console.log(`Racial Roll [${debugPurpose}]: FAIL (Base: ${baseChance.toFixed(2)}, Mod: ${modifiedChance.toFixed(2)}, Roll: ${roll.toFixed(2)})`);
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

        if(details.type === 'recipe') {
            for(let i = 0; i < quantity; i++) {
                this.learnRecipe(itemKey, verbose);
            }
            return;
        }

        if (verbose) addToLog(`You received: <span class="font-bold" style="color: var(--text-accent);">${details.name}</span>!`, 'text-green-400');

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

    // --- NEW: Helper methods for takeDamage refactoring ---

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

    /** Attempts Parry, then Dodge, then Block. Returns true if any succeed. */
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
        setTimeout(() => {
            if (gameState.battleEnded || !attacker || !attacker.isAlive()) return; // Check attacker still exists
            addToLog(`You launch a swift counter-attack!`, 'text-yellow-300');
            const weapon = this.equippedWeapon;
            let counterDamage = rollDice(...weapon.damage, 'Player Parry').total + this.physicalDamageBonus;
            const finalDamage = attacker.takeDamage(counterDamage, { element: this.weaponElement });
            addToLog(`Your riposte hits ${attacker.name} for <span class="font-bold text-yellow-300">${finalDamage}</span> damage.`);
            if (!gameState.battleEnded) {
                checkBattleStatus(true); // Check if counter killed the enemy
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
            const finalReflected = attacker.takeDamage(reflectedDamage, { element: reflectElement });
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
                    const finalReflected = attacker.takeDamage(reflectedDamage, { isMagic: true, element: 'fire', ignore_defense: 1.0 });
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
            return 0; // Damage fully avoided
        }

        // --- Damage Continues ---
        const originalDamage = damage; // Store pre-barrier/vulnerability damage for reflection calc later

        // 3. Apply Alchemical Barrier
        damage = this._applyAlchemicalBarrier(damage);
        if (damage <= 0) {
            updateStatsView(); // Update if barrier absorbed all
            return 0; // Damage fully absorbed
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
        return finalDamageDealt;
    }
    // --- END takeDamage refactoring ---
}

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
        const finalDamage = target.takeDamage(damage, { isMagic: true, element: 'none' });

        calcLog.finalDamage = finalDamage;
        logDamageCalculation(calcLog);

        addToLog(`The beam hits for <span class="font-bold text-cyan-400">${finalDamage}</span> magical damage.`);
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
            gameState.activeDrone = null; // Remove drone reference
        }

        // Update grid to show HP change if needed (might require drone HP bar)
        if (gameState.currentView === 'battle') {
            renderBattleGrid();
        }
        return finalDamage;
    }
}
// --- END Drone Class ---

class Enemy extends Entity {
    constructor(speciesData, rarityData, playerLevel, elementData = { key: 'none', adjective: '' }) {
        const statMultiplier = rarityData.multiplier;
        const rewardMultiplier = rarityData.rewardMultiplier || rarityData.multiplier;

        const finalHp = Math.floor((speciesData.base_hp + (playerLevel * 1.5)) * statMultiplier);
        const finalStrength = Math.floor((speciesData.base_strength + Math.floor(playerLevel / 2)) * statMultiplier);
        const finalDefense = Math.floor(((speciesData.base_defense || 0) + Math.floor(playerLevel / 3)) * statMultiplier);

        const name = elementData.key !== 'none'
            ? `${rarityData.name} ${elementData.adjective} ${speciesData.name}`
            : `${rarityData.name} ${speciesData.name}`;

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
    async attack(target) {
        this.attackParried = false; // Reset parry flag for this attack sequence
        const isFlying = this.movement.type === 'flying';
        this.hasDealtDamageThisEncounter = true;

        let distance = Math.abs(this.x - target.x) + Math.abs(this.y - target.y);

        // If not in range, try to move closer first.
        if (distance > this.range) {
            await this.moveTowards(target); // moveTowards is async now
            // After moving, update the distance to see if an attack is now possible.
            distance = Math.abs(this.x - target.x) + Math.abs(this.y - target.y);
        }

        // Only proceed with the attack if the target is now in range.
        if (distance <= this.range) {
            addToLog(`${this.name} attacks ${target.name}!`);
            this._performAttack(target); // Perform the main attack

            // Check if attack was parried/dodged/blocked before proceeding with multi-attacks/effects
            if (this.attackParried) {
                console.log("Attack parried/dodged/blocked, skipping follow-ups.");
                 return; // Stop the attack sequence
            }


            const rarityIndex = this.rarityData.rarityIndex;
            // Wind Element Multi-attack
            if (this.element === 'wind' && Math.random() < (rarityIndex * 0.05)) { // Chance based on rarity
                addToLog(`The swirling winds grant ${this.name} another strike!`, 'text-gray-300');
                setTimeout(() => {
                    // Check if target and this enemy are still valid inside the timeout
                    if (gameState.battleEnded || !target.isAlive() || !this.isAlive()) return;
                    // Perform a second, weaker attack
                    let followUpDamageRoll = rollDice(Math.max(1, this.damage[0] - 1), this.damage[1], `${this.name} Wind Follow-up`);
                    let followUpDamage = followUpDamageRoll.total + Math.floor(this.strength / 2); // Reduced scaling
                    if (this.element === 'fire') { // Synergy bonus
                        followUpDamage = Math.floor(followUpDamage * (1 + Math.random() * 0.2));
                    }
                     target.takeDamage(followUpDamage, !!this.statusEffects.ultra_focus, this); // Apply damage
                     // Check status immediately after follow-up attack
                     if (!gameState.battleEnded) checkBattleStatus(true);
                }, 500); // Delay for readability
            }
            // Double Strike Ability
            else if (this.ability === 'double_strike' && Math.random() < 0.33) {
                addToLog(`${this.name}'s fury lets it attack again!`, 'text-red-500 font-bold');
                setTimeout(() => {
                     // Check if target and this enemy are still valid inside the timeout
                    if (gameState.battleEnded || !target.isAlive() || !this.isAlive()) return;
                    this._performAttack(target); // Perform a full second attack
                    // Check status immediately after second strike
                    if (!gameState.battleEnded) checkBattleStatus(true);
                }, 500); // Perform a full second attack
            }
        } else {
             addToLog(`${this.name} is too far away to attack.`); // Log if still out of range after moving
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
        damageDealt = target.takeDamage(totalDamage, !!this.statusEffects.ultra_focus, this, attackOptions);

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
                 const lightningDamage = lightningDamageRoll.total + Math.floor(this.strength / 2);
                target.takeDamage(lightningDamage, true, this); // True damage ignores defense
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
        let currentDefense = this.defense;
        // Apply Living Shield buff
        if (this.statusEffects.living_shield) {
            currentDefense *= 2;
        }
        // Apply ignore defense effect (like Void)
        if (effects.ignore_defense) {
             // Ensure ignore_defense is treated as a percentage (0 to 1)
             const pierceAmount = Math.max(0, Math.min(1, effects.ignore_defense));
             currentDefense *= (1 - pierceAmount);
        }
         // Apply Spell Penetration
         if (effects.isMagic && effects.spell_penetration) {
             const pierceAmount = Math.max(0, Math.min(1, effects.spell_penetration));
             currentDefense *= (1 - pierceAmount);
         }
         // Apply Armor Pierce from Thrusting Swords / Sunderer
         if (!effects.isMagic && effects.armorPierce) {
             const pierceAmount = Math.max(0, Math.min(1, effects.armorPierce));
             currentDefense *= (1 - pierceAmount);
         }


        // Apply Enrage vulnerability
        let damageTaken = this.statusEffects.enrage ? Math.floor(damage * 1.5) : damage; // Increase damage *before* defense

        // --- Elemental Calculation ---
        if (effects.element && effects.element !== 'none' && this.element !== 'none') {
            const modifier = calculateElementalModifier(effects.element, this.element);
            if (modifier > 1) { // Weakness
                 damageTaken = Math.floor(damageTaken * modifier); // Increase damage before defense
                addToLog("It's super effective!", 'text-green-400');
            } else if (modifier < 1) { // Resistance
                 damageTaken = Math.floor(damageTaken * modifier); // Decrease damage before defense
                addToLog("It's not very effective...", 'text-red-500');
            }
        }

        // Apply defense
        const finalDamage = Math.max(0, Math.floor(damageTaken - currentDefense));
        this.hp -= finalDamage;

        // Ensure HP doesn't drop below 0 visually before the death check happens
        this.hp = Math.max(0, this.hp);


        // Update grid immediately to show HP change
        if (gameState.currentView === 'battle') {
            renderBattleGrid();
        }
        return finalDamage;
    }
    async moveTowards(target) {
        const isFlying = this.movement.type === 'flying';
        const path = findPath({x: this.x, y: this.y}, {x: target.x, y: target.y}, isFlying);

        if (path && path.length > 1) {
            addToLog(`${this.name} moves closer!`);
            const stepsToTake = Math.min(path.length - 1, this.movement.speed);

            for (let i = 1; i <= stepsToTake; i++) {
                const nextStep = path[i];

                // Check if the next step is valid before moving
                if (!this.isValidMove(nextStep.x, nextStep.y)) {
                     addToLog(`${this.name} encounters an obstacle and stops.`);
                    break; // Stop if the path becomes blocked
                }


                // Check if moving into this cell would put it in range
                const distanceAfterMove = Math.abs(nextStep.x - target.x) + Math.abs(nextStep.y - target.y);

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
    if (target instanceof Player) {
        resistChance = target.resistanceChance; // Base resist (includes Clankers bonus)

        // Add resistance from gear
        const shield = target.equippedShield;
        if (shield && shield.effect?.type === 'debuff_resist') {
            resistChance += (1 - resistChance) * shield.effect.chance; // Multiplicative stacking
        }
         // Add resistance from status effects (like resist potions)
        const resistKey = `resist_${effectType}`; // Assumes potion effects match 'resist_poison', etc.
        if (target.statusEffects[resistKey]) {
             resistChance += (1 - resistChance) * (1 - target.statusEffects[resistKey].multiplier); // Convert multiplier (0.95) to resistance (0.05)
        }


        // Apply Human/Dragonborn/Halfling logic using rollForEffect
        // We are rolling to RESIST, so we use (1 - resistChance) as the "failure" chance
        if (target.rollForEffect(resistChance, 'Debuff Resist')) {
            addToLog(`You resisted the ${effectType} effect from ${sourceName}!`, 'text-cyan-300 font-bold');
            return; // Effect resisted
        }
    }

    // --- AASIMAR: Divine Regeneration (Debuff Reduction) ---
    if (target instanceof Player && target.race === 'Aasimar') {
        if (effectData.duration && effectData.duration > 1) {
            effectData.duration = Math.max(1, effectData.duration - 1); // Reduce by 1, min 1
            addToLog("Your divine nature lessens the debuff's duration!", "text-yellow-200");
        }
    }
    // --- End Aasimar Logic ---

    // Apply the effect if not resisted (or if target is not Player)
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
    // Check if player has the item
    if (!player.inventory.items[itemKey] || player.inventory.items[itemKey] < 1) {
        addToLog("You don't have that item!", 'text-red-400');
        if (inBattle) renderBattle('item'); // Go back to item selection if in battle
        else renderInventory(); // Go back to inventory if out of battle
        return false; // Indicate failure
    }
    const details = ITEMS[itemKey];
    if (!details) {
        console.error("Could not find details for item:", itemKey);
        return false; // Indicate failure if item details don't exist
    }

    // Consume the item *before* applying effects
    player.inventory.items[itemKey]--;
    if (player.inventory.items[itemKey] <= 0) {
        delete player.inventory.items[itemKey];
    }

    addToLog(`You used a <span class="font-bold text-green-300">${details.name}</span>.`);

    if (inBattle) gameState.isPlayerTurn = false; // Using an item costs the turn in battle

    // --- Apply Item Effects ---
    if (details.type === 'experimental') {
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


    if (inBattle && details.type === 'enchant') { // Using Essences in battle
        const target = currentEnemies[targetIndex];
        if (targetIndex === null || !target || !target.isAlive()) {
            addToLog("You must select a valid target.", 'text-red-400');
             // Refund item if target invalid? No, consumed on use attempt.
             if(inBattle) renderBattle('item'); // Go back to item select
             return false; // Indicate failure
        }

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
         const finalDamage = target.takeDamage(damage, { isMagic: true, element: element }); // Apply as magic damage
         addToLog(`It hits ${target.name} for <span class="font-bold text-purple-400">${finalDamage}</span> ${element} damage.`);
         // Check status immediately after essence use
         if (!gameState.battleEnded) {
            checkBattleStatus(true); // isReaction = true for direct damage items?
         }

    } else { // Standard consumable effects (healing, mana, buffs, cleanse)
        if (details.type === 'healing') {
            const healAmount = details.amount;
            player.hp = Math.min(player.maxHp, player.hp + healAmount);
             addToLog(`You recover <span class="font-bold text-green-400">${healAmount}</span> HP.`, 'text-green-300'); // Specific log for healing
        } else if (details.type === 'mana_restore') {
            const restoreAmount = details.amount;
            let currentMp = Number(player.mp) || 0;
            let maxMp = Number(player.maxMp) || 1; // Default maxMP to 1 to avoid division by zero later
            player.mp = Math.min(maxMp, currentMp + restoreAmount); // Use validated numbers
            addToLog(`You restore <span class="font-bold text-blue-400">${restoreAmount}</span> MP.`, 'text-blue-300'); // Specific log for mana
        } else if (details.type === 'buff' && details.effect) { // Added check for details.effect
             // Apply buff effect from item data
             // Note: These are temporary battle buffs, not food buffs
             player.statusEffects[details.effect.type] = { ...details.effect }; // Copy effect data
             addToLog(`You feel the effects of the ${details.name}!`, 'text-yellow-300');
        } else if (details.type === 'cleanse') {
            const badEffects = ['poison', 'petrified', 'paralyzed', 'swallowed', 'toxic', 'drenched']; // Added toxic, drenched
            let cleansed = false;
            for (const effect of badEffects) {
                if (player.statusEffects[effect]) {
                    delete player.statusEffects[effect];
                    cleansed = true;
                }
            }
             if (cleansed) addToLog(`You drink the ${details.name} and feel purified.`, 'text-cyan-300');
             else addToLog(`You drink the ${details.name}, but there were no effects to cleanse.`, 'text-gray-400');
        }
    }

    updateStatsView(); // Update UI after applying effects

    // Transition after effects
    if (!inBattle) {
        renderInventory(); // Re-render inventory if used outside battle
    } else {
        // MODIFICATION: Call finalizePlayerAction instead of checkBattleStatus for standard items too
        // No timeout needed here, finalizePlayerAction handles delays internally if needed.
        finalizePlayerAction(); // Properly end the turn sequence
    }
    return true; // Indicate success
}


function equipItem(itemKey) {
    const details = getItemDetails(itemKey);
    if (!details) return;

    let itemType = null;
    if (WEAPONS[itemKey]) { itemType = 'weapon'; }
    else if (CATALYSTS[itemKey]) { itemType = 'catalyst'; }
    else if (SHIELDS[itemKey]) { itemType = 'shield'; }
    else if (ARMOR[itemKey]) { itemType = 'armor'; }
    else if (LURES[itemKey]) { itemType = 'lure'; }

    // Armor and Lure equipping (simpler logic)
    if (itemType === 'armor') {
        if (player.equippedArmor === details) return; // Already equipped
        player.equippedArmor = details;
        player.armorElement = 'none'; // Reset element on equip
    } else if (itemType === 'lure') {
        if (player.equippedLure === itemKey) return; // Already equipped
        player.equippedLure = itemKey;
    }
    // Weapon, Catalyst, Shield equipping (off-hand logic)
    else if (itemType) {
        const isCurrentlyEquipped =
            (itemType === 'weapon' && player.equippedWeapon === details) ||
            (itemType === 'catalyst' && player.equippedCatalyst === details) ||
            (itemType === 'shield' && player.equippedShield === details);

        if (isCurrentlyEquipped) return; // Already equipped

        // --- Two-Handed Weapon Check ---
        let isTwoHanded = false;
        if (itemType === 'weapon') {
            isTwoHanded = details.class === 'Hand-to-Hand' || details.effect?.dualWield;
            // --- BEASTKIN: Bestial Instinct (Equip) ---
            if (isTwoHanded && details.class === 'Hand-to-Hand' && player.race === 'Beastkin' && player.level >= 20) {
                isTwoHanded = false; // Beastkin (20+) ignores Hand-to-Hand two-handed restriction
                addToLog("Your bestial nature allows you to wield your claws alongside an off-hand item.", "text-green-300");
            }
            // --- End Beastkin Logic ---

            if (isTwoHanded) {
                // Unequip shield and catalyst if equipping a two-handed weapon
                if (player.equippedShield.name !== 'None') {
                    addToLog(`You unequip your ${player.equippedShield.name} to wield your ${details.name}.`, 'text-yellow-500');
                    unequipItem('shield', false); // Don't re-render yet
                }
                if (player.equippedCatalyst.name !== 'None') {
                    addToLog(`You unequip your ${player.equippedCatalyst.name} to wield your ${details.name}.`, 'text-yellow-500');
                    unequipItem('catalyst', false); // Don't re-render yet
                }
            }
        }

        // --- Check if trying to equip shield/catalyst with two-handed ---
        let isEquippedWeaponTwoHanded = player.equippedWeapon.class === 'Hand-to-Hand' || player.equippedWeapon.effect?.dualWield;
        // --- BEASTKIN: Bestial Instinct (Equip) ---
        if (isEquippedWeaponTwoHanded && player.equippedWeapon.class === 'Hand-to-Hand' && player.race === 'Beastkin' && player.level >= 20) {
            isEquippedWeaponTwoHanded = false; // Ignore restriction if it's Hand-to-Hand
        }
        // --- End Beastkin Logic ---

        if ((itemType === 'shield' || itemType === 'catalyst') && isEquippedWeaponTwoHanded) {
            addToLog(`You cannot use a ${itemType} while using a two-handed weapon (${player.equippedWeapon.name}).`, 'text-red-400');
            return;
        }

        // --- Off-hand Slot Logic (Max 2 of Weapon, Catalyst, Shield) ---
        const typeIndex = player.equipmentOrder.indexOf(itemType);
        if (typeIndex > -1) {
             // If equipping the same type again (e.g., swapping swords), remove old entry
             player.equipmentOrder.splice(typeIndex, 1);
        }

         // If already holding 2 different off-hand types, unequip the oldest one
        if (player.equipmentOrder.length >= 2) {
            const typeToUnequip = player.equipmentOrder.shift(); // Remove the first (oldest) entry
            let unequippedItemName = '';
            if (typeToUnequip === 'weapon') {
                unequippedItemName = player.equippedWeapon.name;
                player.equippedWeapon = WEAPONS['fists']; player.weaponElement = 'none';
            } else if (typeToUnequip === 'catalyst') {
                unequippedItemName = player.equippedCatalyst.name;
                player.equippedCatalyst = CATALYSTS['no_catalyst'];
            } else if (typeToUnequip === 'shield') {
                unequippedItemName = player.equippedShield.name;
                player.equippedShield = SHIELDS['no_shield']; player.shieldElement = 'none';
            }
             if (unequippedItemName) {
                addToLog(`You unequipped ${unequippedItemName} to make room for the ${details.name}.`, 'text-yellow-500');
            }
        }

        // Add the newly equipped item type to the end of the order
        player.equipmentOrder.push(itemType);

        // Assign the actual equipment
        if (itemType === 'weapon') { player.equippedWeapon = details; player.weaponElement = 'none'; }
        else if (itemType === 'catalyst') { player.equippedCatalyst = details; }
        else if (itemType === 'shield') { player.equippedShield = details; player.shieldElement = 'none'; }
    } else {
        console.error("Unknown item type for equip:", itemKey);
        return; // Don't proceed if type is unknown
    }


    addToLog(`You equipped the <span class="font-bold text-cyan-300">${details.name}</span>.`);
    updateStatsView();
    if (gameState.currentView === 'inventory') {
        renderInventory(); // Re-render inventory to show changes
    }
}

function unequipItem(itemType, shouldRender = true) {
    if (!player) return;

    let unequippedItemName = '';
    let changed = false;

    switch (itemType) {
        case 'weapon':
            if (player.equippedWeapon.name === WEAPONS['fists'].name) return; // Already default
            unequippedItemName = player.equippedWeapon.name;
            player.equippedWeapon = WEAPONS['fists'];
            player.weaponElement = 'none'; // Reset element
            changed = true;
            break;
        case 'catalyst':
            if (player.equippedCatalyst.name === CATALYSTS['no_catalyst'].name) return;
            unequippedItemName = player.equippedCatalyst.name;
            player.equippedCatalyst = CATALYSTS['no_catalyst'];
            changed = true;
            break;
        case 'armor':
            if (player.equippedArmor.name === ARMOR['travelers_garb'].name) return;
            unequippedItemName = player.equippedArmor.name;
            player.equippedArmor = ARMOR['travelers_garb'];
            player.armorElement = 'none'; // Reset element
            changed = true;
            break;
        case 'shield':
            if (player.equippedShield.name === SHIELDS['no_shield'].name) return;
            unequippedItemName = player.equippedShield.name;
            player.equippedShield = SHIELDS['no_shield'];
            player.shieldElement = 'none'; // Reset element
            changed = true;
            break;
        case 'lure':
            if (player.equippedLure === 'no_lure') return;
            unequippedItemName = LURES[player.equippedLure].name;
            player.equippedLure = 'no_lure';
            changed = true;
            break;
        default:
            return; // Invalid type
    }

    // Update equipment order if weapon/catalyst/shield was unequipped
    if (changed && ['weapon', 'catalyst', 'shield'].includes(itemType)) {
        const typeIndex = player.equipmentOrder.indexOf(itemType);
        if (typeIndex > -1) {
            player.equipmentOrder.splice(typeIndex, 1);
        }
    }

    if (changed) {
        addToLog(`You unequipped the <span class="font-bold text-cyan-300">${unequippedItemName}</span>.`);
        updateStatsView();
        if (shouldRender && gameState.currentView === 'inventory') {
            renderInventory(); // Re-render if called directly from inventory
        }
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

    const effect = recipeData.effect;

    // Apply healing effect first
    if (effect.heal) {
         player.hp = Math.min(player.maxHp, player.hp + effect.heal);
    }

    // Apply primary effect (buff, % heal, % mana, full restore)
    switch (effect.type) {
        case 'full_restore':
            player.hp = player.maxHp;
            player.mp = player.maxMp;
            break;
        case 'heal_percent':
             // Apply % heal ON TOP of flat heal if both exist
            player.hp = Math.min(player.maxHp, player.hp + Math.floor(player.maxHp * effect.heal_percent));
            break;
        case 'mana_percent':
            player.mp = Math.min(player.maxMp, player.mp + Math.floor(player.maxMp * effect.mana_percent));
            break;
        case 'buff':
            effect.buffs.forEach(buff => {
                // Handle different buff types correctly
                if (buff.stat === 'movement_speed') {
                     // Additive movement speed
                     player.foodBuffs[buff.stat] = { value: buff.value, duration: buff.duration };
                } else {
                     // Multiplicative for others (like damage, max hp/mp, loot, xp)
                     player.foodBuffs[buff.stat] = { value: buff.value, duration: buff.duration };
                }
            });
             // Re-apply Max HP/MP buffs immediately after applying
             player.hp = Math.min(player.hp, player.maxHp);
             player.mp = Math.min(player.mp, player.maxMp);
            break;
    }


    addToLog(`You cooked and ate ${recipeData.name}. You feel its effects!`, "text-green-400 font-bold");

    updateStatsView(); // Update UI with new HP/MP and potentially Max HP/MP
    renderKitchen(); // Re-render to update button states and ingredient counts
    saveGame(); // Save after cooking
}

