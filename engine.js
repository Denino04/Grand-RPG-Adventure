/**
 * Calculates the damage modifier based on elemental strengths and weaknesses.
 * @param {string} attackElement The element of the incoming attack.
 * @param {string} defenseElement The element of the defending entity/gear.
 * @returns {number} 2 for strong, 0.5 for weak, 1 for neutral.
 */
function calculateElementalModifier(attackElement, defenseElement) {
    if (!attackElement || !defenseElement || attackElement === 'none' || defenseElement === 'none') {
        return 1;
    }
    const attackData = ELEMENTS[attackElement];
    if (attackData.weakness.includes(defenseElement)) {
        return 2; // Defensive element is strong against the attack
    }
    if (attackData.strength.includes(defenseElement)) {
        return 0.5; // Defensive element is weak against the attack
    }
    return 1;
}

/**
 * Creates a seeded pseudo-random number generator.
 * @param {number} seed The seed for the generator.
 * @returns {function(): number} A function that returns a random number between 0 and 1.
 */
function seededRandom(seed) {
    return function() {
        var t = seed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
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
 * Selects a random element from a population based on weights.
 * @param {Array} population The array of items to choose from.
 * @param {Array<number>} weights The corresponding weights for each item.
 * @param {function(): number} [rng=Math.random] Optional random number generator.
 * @returns {*} The chosen item.
 */
function choices(population, weights, rng) { 
    const randomFunc = rng || Math.random;
    let totalWeight = weights.reduce((acc, w) => acc + w, 0); 
    let randomNum = randomFunc() * totalWeight; 
    for (let i = 0; i < population.length; i++) { 
        if (randomNum < weights[i]) return population[i]; 
        randomNum -= weights[i]; 
    } 
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

/**
 * Gets the appropriate emoji for the player based on their race and gender.
 * @returns {string} The player's emoji.
 */
function getPlayerEmoji() {
    if (!player || !player.race || !player.gender) return '🧑';
    const raceEmojis = PLAYER_EMOJIS[player.race];
    if (!raceEmojis) return '🧑';
    return raceEmojis[player.gender] || raceEmojis['Neutral'] || '🧑';
}


/**
 * A centralized function to get details for any item from any category.
 * @param {string} itemKey The key of the item to find.
 * @returns {object|null} The details object for the item, or null if not found.
 */
function getItemDetails(itemKey) {
    return WEAPONS[itemKey] || ARMOR[itemKey] || SHIELDS[itemKey] || CATALYSTS[itemKey] || ITEMS[itemKey] || LURES[itemKey] || SPELLS[itemKey] || null;
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
            if (gameState.gridLayout[neighbor.y * gameState.gridWidth + neighbor.x] !== 1) continue;
            
            // Check for blocking entities (player or other enemies)
            const isOccupiedByEntity = (currentEnemies.some(e => e.x === neighbor.x && e.y === neighbor.y) || (player.x === neighbor.x && player.y === neighbor.y));
            if (isOccupiedByEntity && !(neighbor.x === end.x && neighbor.y === end.y)) continue;

            // Check for blocking objects (obstacles/terrain) if not flying
            if (!isFlying) {
                const isBlockedByObject = gameState.gridObjects.some(o => o.x === neighbor.x && o.y === neighbor.y);
                if (isBlockedByObject && !(neighbor.x === end.x && neighbor.y === end.y)) continue;
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
                if (!visited.has(key) &&
                    neighbor.x >= 0 && neighbor.x < gameState.gridWidth &&
                    neighbor.y >= 0 && neighbor.y < gameState.gridHeight &&
                    gameState.gridLayout[neighbor.y * gameState.gridWidth + neighbor.x] === 1 &&
                    !isCellBlocked(neighbor.x, neighbor.y)) {
                    
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
    constructor(name, raceKey) {
        super(name);
        this.x = 0;
        this.y = 0;
        // Core Attributes
        this.level = 1;
        this.xp = 0;
        // this.totalXp is intentionally left undefined here. It will be initialized for new games in initGame()
        // and calculated for old saves in loadGameFromKey().
        this.xpToNextLevel = this.calculateXpToNextLevel();
        this.gold = 100;
        this.statPoints = 0;
        this.gender = 'Neutral';
        this.race = raceKey || 'Human';
        this.class = '';
        this.background = '';
        this.backgroundKey = '';
        this.dialogueFlags = {};
        this.bettyQuestState = 'not_started'; // not_started, declined, accepted

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
        
        // Initial HP/MP set from base stats
        this.hp = this.maxHp;
        this.mp = this.maxMp;

        // Game State & Equipment
                            this.usedReviveToday = false;
                            this.temporaryBuffs = {};
        this.firestoreId = null;
        this.seed = null;
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

        this.equipmentOrder = [];
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
        this.legacyQuestProgress = {};
        this.questsTakenToday = [];
        this.biomeOrder = [];
        this.biomeUnlockLevels = {};
    }

    // Derived Stats using Getters
    get maxHp() { return (this.vigor * 5) + this.bonusHp; }
    get maxMp() { return (this.focus * 5) + this.bonusMp; }
    get physicalDefense() { return Math.floor((this.stamina + this.vigor) / 2) + this.bonusPhysicalDefense; }
    get magicalDefense() { return Math.floor((this.stamina + this.focus) / 2) + this.bonusMagicalDefense; }
    get physicalDamageBonus() { return this.strength + this.bonusPhysicalDamage; }
    get magicalDamageBonus() { return this.intelligence + this.bonusMagicalDamage; }
    get resistanceChance() { return Math.min(0.5, (this.luck / 100) + this.bonusEvasion + this.bonusCritChance); } // Combined for simplicity
    get critChance() { return Math.min(0.3, ((this.luck * 0.5) / 100) + this.bonusCritChance); } 
    get evasionChance() { return Math.min(0.2, ((this.luck * 0.5) / 100) + this.bonusEvasion); }
    
    /**
     * Calculates the experience required to level up using the NEW formula.
     * @param {number} [level] - Optional level to calculate for, otherwise uses current level.
     * @returns {number} The total XP needed for the next level.
     */
    calculateXpToNextLevel(level) {
        const lvl = level || this.level;
        // New, easier formula: 100 * level^1.15
        return Math.floor(100 * Math.pow(lvl, 1.15));
    }

    /**
     * Recalculates the player's level, current XP, and stat points from their totalXP.
     * This is the core function for migrating old saves to the new EXP curve.
     * @returns {number} The number of levels gained or lost.
     */
    recalculateLevelFromTotalXp() {
        const oldLevel = this.level;
        let newLevel = 1;
        let xpPool = this.totalXp;
        let xpForNext = this.calculateXpToNextLevel(newLevel);

        while (xpPool >= xpForNext) {
            xpPool -= xpForNext;
            newLevel++;
            xpForNext = this.calculateXpToNextLevel(newLevel);
        }

        this.level = newLevel;
        this.xp = xpPool;
        this.xpToNextLevel = this.calculateXpToNextLevel(this.level); // Update for current level

        // Recalculate stat points based on the new level, preserving spent points.
        const totalSpentPoints = this.bonusVigor + this.bonusFocus + this.bonusStamina + this.bonusStrength + this.bonusIntelligence + this.bonusLuck;
        const totalPointsFromLevels = (this.level - 1) * 5;
        this.statPoints = totalPointsFromLevels - totalSpentPoints;
        
        return newLevel - oldLevel;
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
        const rng = seededRandom(this.seed || 1); // Use a seeded RNG for deterministic random choices

        // Wretch Background Logic
        if (backgroundData.growthBonus.wretch) {
            const totalPointsSpent = this.bonusVigor + this.bonusFocus + this.bonusStamina + this.bonusStrength + this.bonusIntelligence + this.bonusLuck;
            const procs = Math.floor(totalPointsSpent / 2);
            const possibleBonuses = ['vigor', 'focus', 'stamina', 'strength', 'intelligence', 'luck'];
            
            for (let i = 0; i < procs; i++) {
                const randomStat = possibleBonuses[Math.floor(rng() * possibleBonuses.length)];
                this.applyBonusForStat(randomStat, 1, rng, true); // Force apply for Wretch
            }
            return; // Wretch logic is exclusive
        }

        // Standard Background Logic
        this.applyBonusForStat('vigor', this.bonusVigor, rng);
        this.applyBonusForStat('focus', this.bonusFocus, rng);
        this.applyBonusForStat('stamina', this.bonusStamina, rng);
        this.applyBonusForStat('strength', this.bonusStrength, rng);
        this.applyBonusForStat('intelligence', this.bonusIntelligence, rng);
        this.applyBonusForStat('luck', this.bonusLuck, rng);
    }

    applyBonusForStat(stat, points, rng, isWretch = false) {
        if (!this.backgroundKey || !BACKGROUNDS[this.backgroundKey] || points === 0) return;
        
        const background = BACKGROUNDS[this.backgroundKey];
        const favoredStats = background.favoredStats.map(s => s.toLowerCase());

        if (!isWretch && !favoredStats.includes(stat)) return; // Only apply bonus if it's a favored stat (or Wretch)

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
                    if (rng() < 0.5) this.bonusEvasion += 0.005; // 0.5%
                    else this.bonusCritChance += 0.005; // 0.5%
                }
                break;
        }
    }

    clearEncounterBuffs() {
        let buffsCleared = false;
        for (const key in this.temporaryBuffs) {
            this.temporaryBuffs[key]--;
            if (this.temporaryBuffs[key] <= 0) {
                delete this.temporaryBuffs[key];
                buffsCleared = true;
            }
        }
        if(buffsCleared) {
            addToLog("The effects of a concoction wear off.", "text-purple-400");
            this.hp = Math.min(this.hp, this.maxHp);
            this.mp = Math.min(this.mp, this.maxMp);
            updateStatsView();
        }
    }

    addToInventory(itemKey, quantity = 1, verbose = true) {
        const details = getItemDetails(itemKey); if (!details) return;
        if (verbose) addToLog(`You received: <span class="font-bold" style="color: var(--text-accent);">${details.name}</span>!`, 'text-green-400');
        
        const category = itemKey in WEAPONS ? 'weapons' :
                         (itemKey in CATALYSTS ? 'catalysts' :
                         (itemKey in ARMOR ? 'armor' : 
                         (itemKey in SHIELDS ? 'shields' : 
                         (itemKey in LURES ? 'lures' : 'items'))));

        if (category === 'lures') {
             this.inventory.lures[itemKey] = (this.inventory.lures[itemKey] || 0) + details.uses;
        } else if (category === 'items') { 
            this.inventory.items[itemKey] = (this.inventory.items[itemKey] || 0) + quantity; 
        } else {
            if (!this.inventory[category]) {
                this.inventory[category] = [];
            }
            this.inventory[category].push(itemKey);
        }
    }
    gainXp(amount) { 
        this.xp += amount; 
        if (this.totalXp === undefined) this.totalXp = 0; // safety check
        this.totalXp += amount; // Add to total XP as well
        addToLog(`You gained <span class="font-bold">${amount}</span> XP!`, 'text-yellow-400'); 
        while (this.xp >= this.xpToNextLevel) { // Use while loop for multiple level ups
            this.levelUp();
        } 
        updateStatsView(); 
    }
    levelUp() { 
        this.xp -= this.xpToNextLevel; 
        this.level++; // NOTE: This is only called when leveling up, not during recalculation
        this.xpToNextLevel = this.calculateXpToNextLevel(); 
        this.statPoints += 5;
        this.hp = this.maxHp; 
        this.mp = this.maxMp; 
        addToLog(`*** LEVEL UP! You are now level ${this.level}! ***`, 'text-yellow-200 font-bold text-lg'); 
        addToLog(`You have <span class="font-bold text-green-400">5</span> stat points to allocate!`, 'text-green-300');
        updatePlayerTier();
        characterSheetOriginalStats = null; // Reset the baseline for the character sheet
        if (gameState.currentView !== 'battle' && gameState.currentView !== 'character_sheet_levelup') {
            setTimeout(() => renderCharacterSheet(true), 1000);
        }
    }
    clearBattleBuffs() {
        const buffsToClear = [
            'buff_strength', 'buff_chaos_strength', 'buff_titan',
            'buff_defense', 'stonehide', 'buff_shroud', 'buff_voidwalker',
            'buff_haste', 'buff_hermes', 'buff_ion_self', 'buff_ion_other',
            'buff_magic_defense', 'buff_divine'
        ];
        
        let cleared = false;
        for (const buffKey of buffsToClear) {
            if (this.statusEffects[buffKey]) {
                delete this.statusEffects[buffKey];
                cleared = true;
            }
        }
        
        if (cleared) {
            addToLog("The temporary magical effects of the battle wear off.", "text-gray-400");
        }
    }
    takeDamage(damage, ignoresDefense = false, attacker = null, attackOptions = { isMagic: false }) { 
        const shield = this.equippedShield;
        const armor = this.equippedArmor;
        let dodgeChance = this.evasionChance; // Base evasion from Luck

        // --- Calculate Dodge Chance ---
        if (armor && armor.effect?.type === 'dodge') {
            dodgeChance += armor.effect.chance;
        }
        if (this.statusEffects.buff_shroud || this.statusEffects.buff_voidwalker) {
            dodgeChance *= 1.5;
        }
        if (this.statusEffects.buff_hermes) {
            dodgeChance *= 2; // Double total dodge
        }

        // --- Parry logic (Stops attack entirely) ---
        if (shield && shield.effect?.type === 'parry' && Math.random() < shield.effect.chance && attacker && attacker.isAlive()) {
            attacker.attackParried = true;
            addToLog(`You parried ${attacker.name}'s attack with your ${shield.name}!`, 'text-yellow-300 font-bold');
            setTimeout(() => {
                addToLog(`You launch a swift counter-attack!`, 'text-yellow-300');
                const weapon = this.equippedWeapon;
                let counterDamage = rollDice(...weapon.damage, 'Player Parry') + this.physicalDamageBonus;
                const finalDamage = attacker.takeDamage(counterDamage, { element: this.weaponElement });
                addToLog(`Your riposte hits ${attacker.name} for <span class="font-bold text-yellow-300">${finalDamage}</span> damage.`);
                if (!gameState.battleEnded) {
                     checkBattleStatus(true);
                }
            }, 300);
            updateStatsView();
            return 0;
        }
        
        // --- Dodge logic (Stops attack entirely) ---
        if (dodgeChance > 0 && Math.random() < dodgeChance) {
            attacker.attackParried = true;
            addToLog(`You dodged ${attacker.name}'s attack!`, 'text-teal-300 font-bold');
            updateStatsView();
            return 0;
        }

        // --- Block logic (Stops attack entirely) ---
        const totalBlockChance = (shield?.blockChance || 0) + (armor?.blockChance || 0);
        if (!ignoresDefense && totalBlockChance > 0 && Math.random() < totalBlockChance) {
            addToLog(`You blocked the attack!`, 'text-cyan-400 font-bold');
            updateStatsView();
            return 0;
        }

        // --- Defense Calculation with Elemental Modifiers ---
        let isMagicAttack = (attacker?.element && attacker.element !== 'none') || ignoresDefense || attackOptions.isMagic;
        let armorDefense = ignoresDefense ? 0 : (isMagicAttack ? this.magicalDefense : this.physicalDefense);
        let shieldDefense = ignoresDefense ? 0 : (shield?.defense || 0);

        if (attacker?.element && attacker.element !== 'none' && !ignoresDefense) {
            const armorMod = calculateElementalModifier(attacker.element, this.armorElement);
            if (armorMod > 1) {
                armorDefense *= armorMod;
                addToLog(`Your armor's enchantment resists the attack!`, 'text-green-400');
            } else if (armorMod < 1) {
                armorDefense *= armorMod;
                addToLog(`Your armor's enchantment is weak to the attack!`, 'text-red-500');
            }

            const shieldMod = calculateElementalModifier(attacker.element, this.shieldElement);
             if (shieldMod > 1) {
                shieldDefense *= shieldMod;
                addToLog(`Your shield's enchantment resists the attack!`, 'text-green-400');
            } else if (shieldMod < 1) {
                shieldDefense *= shieldMod;
                addToLog(`Your shield's enchantment is weak to the attack!`, 'text-red-500');
            }
        }

        let totalDefense = armorDefense + shieldDefense;
        
        // --- Apply status effect defense modifiers ---
        if(this.statusEffects.stonehide) {
            totalDefense = Math.floor(totalDefense * this.statusEffects.stonehide.multiplier);
            addToLog(`Your stone-like skin absorbs the blow!`, `text-gray-400`);
        }
        if(this.statusEffects.buff_defense) {
            totalDefense = Math.floor(totalDefense * this.statusEffects.buff_defense.multiplier);
            addToLog(`Your magical shield bolsters your defense!`, `text-yellow-300`);
        }
        if(this.statusEffects.buff_titan) {
            totalDefense = Math.floor(totalDefense * this.statusEffects.buff_titan.defMultiplier);
        }
        if(this.statusEffects.buff_chaos_strength) {
            totalDefense = Math.floor(totalDefense * this.statusEffects.buff_chaos_strength.defMultiplier);
             addToLog(`Your reckless abandon lowers your defense!`, `text-red-400`);
        }
        
        if (ignoresDefense) {
             addToLog(`The attack ignores your defense!`, 'text-yellow-500 font-bold');
        }

        // --- Final Damage Calculation ---
        let effectiveDefense = totalDefense;
        if (attacker?.element === 'void') {
            effectiveDefense *= 0.5;
            addToLog(`The void attack partially bypasses your defense!`, 'text-purple-400');
        }
        const finalDamage = Math.max(0, Math.floor(damage - effectiveDefense));
        this.hp -= finalDamage;
        
        let damageType = '';
        if (attacker && attacker.element && attacker.element !== 'none') {
            damageType = ` ${ELEMENTS[attacker.element].name}`;
        } else if (isMagicAttack) {
            damageType = ' magical';
        }
        addToLog(`You take <span class="font-bold text-red-400">${finalDamage}</span>${damageType} damage.`); 

        // --- Post-Damage Effects (Reflect) ---
        if (armor?.effect?.reflect_damage && attacker && attacker.isAlive()) {
             const reflectedDamage = Math.floor(damage * armor.effect.reflect_damage);
             if (reflectedDamage > 0) {
                  attacker.takeDamage(reflectedDamage, { element: this.armorElement });
                  addToLog(`Your ${armor.name} reflects <span class="font-bold text-orange-400">${reflectedDamage}</span> damage back at ${attacker.name}!`, 'text-orange-300');
             }
        }
        if (shield && shield.effect?.type === 'reflect' && attacker && attacker.isAlive()) {
            const reflectedDamage = Math.floor(damage * shield.effect.amount);
            if (reflectedDamage > 0) {
                attacker.takeDamage(reflectedDamage, { element: this.shieldElement });
                addToLog(`Your ${shield.name} reflects <span class="font-bold text-orange-400">${reflectedDamage}</span> damage back at ${attacker.name}!`, 'text-orange-300');
            }
        }

        updateStatsView();
        return finalDamage;
    }
}

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

        let diceCount = (rarityIndex + tier + classDamage.baseDice) - 2;
        this.damage = [Math.max(1, diceCount), classDamage.dieSides];
        
        this.defense = finalDefense;
        this.ability = speciesData.ability;
        this.element = elementData.key;
        this.range = speciesData.range || 1;
        this.movement = speciesData.movement || { speed: 2, type: 'ground' };
        this.xpReward = Math.floor(speciesData.base_xp * rewardMultiplier * (speciesData.class === 'Monstrosity' ? 1.2 : 1)); 
        this.goldReward = Math.floor(speciesData.base_gold * rewardMultiplier * (speciesData.class === 'Monstrosity' ? 1.2 : 1));
        this.lootTable = {...speciesData.loot_table};
        this.lootChanceMod = (speciesData.class === 'Beast' ? 1.5 : 1);
        this.potionDropChanceMod = (speciesData.class === 'Humanoid' ? 1.5 : 1);
        this.speciesData = speciesData;
        this.rarityData = rarityData;
        
        if (this.element !== 'none') {
            const essenceKey = `${this.element}_essence`;
            if (ITEMS[essenceKey]) {
                this.lootTable[essenceKey] = (this.lootTable[essenceKey] || 0) + 0.3 + (rarityIndex * 0.05);
            }
        }

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
        this.attackParried = false;

        const distance = Math.abs(this.x - target.x) + Math.abs(this.y - target.y);

        if (distance > this.range) {
            await this.moveTowards(target);
            return; // End turn after moving
        }

        addToLog(`${this.name} attacks ${target.name}!`); 
        this._performAttack(target);
        if (this.attackParried) return;

        const rarityIndex = this.rarityData.rarityIndex;
        if (this.element === 'wind' && !this.attackParried && Math.random() < (rarityIndex * 0.05)) {
            addToLog(`The swirling winds grant ${this.name} another strike!`, 'text-gray-300');
            setTimeout(() => {
                let followUpDamage = Math.floor((rollDice(this.damage[0], this.damage[1], `${this.name} Wind Follow-up`) + this.strength) / 2);
                if (this.element === 'fire') {
                    followUpDamage = Math.floor(followUpDamage * (1 + Math.random() * 0.2));
                }
                target.takeDamage(followUpDamage, !!this.statusEffects.ultra_focus, this);
            }, 500);
        } else if (this.ability === 'double_strike' && Math.random() < 0.33) { 
            addToLog(`${this.name}'s fury lets it attack again!`, 'text-red-500 font-bold'); 
            setTimeout(() => this._performAttack(target), 500); 
        }
    }
    _performAttack(target) {
        let damageDealt = 0;
        const catalyst = player.equippedCatalyst;
        if (catalyst && catalyst.effect?.ranged_chance && Math.random() < catalyst.effect.ranged_chance) {
            addToLog(`The ${this.name} misses its attack due to your ranged advantage!`, 'text-blue-300');
            return;
        }

        let diceCount = this.damage[0];
        if (this.statusEffects.enrage) {
            diceCount++;
        }
        let totalDamage = rollDice(diceCount, this.damage[1], `${this.name} Attack`) + this.strength; 
        
        if (this.statusEffects.drenched) {
            totalDamage = Math.floor(totalDamage * this.statusEffects.drenched.multiplier);
            addToLog(`${this.name}'s attack is weakened by the water!`, 'text-blue-300');
        }

        if (this.element === 'fire') {
            const fireMultiplier = 1 + Math.random() * 0.2;
            totalDamage = Math.floor(totalDamage * fireMultiplier);
        }
        
        if (target.statusEffects.swallowed && target.statusEffects.swallower === this) {
            totalDamage *= 2;
            addToLog(`${this.name}'s attack is amplified from within!`, 'text-red-600');
        }
        
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

        damageDealt = target.takeDamage(totalDamage, !!this.statusEffects.ultra_focus, this, attackOptions);

        const rarityIndex = this.rarityData.rarityIndex;
        const procChance = rarityIndex * 0.1;

        if (damageDealt > 0) {
            if (this.element === 'water') {
                addToLog(`The water attack leaves you drenched, weakening your next attack!`, 'text-blue-400');
                target.statusEffects.drenched = { duration: 2, multiplier: 0.9 };
            }
            if (this.element === 'earth' && Math.random() < procChance) {
                if (!target.statusEffects.paralyzed) {
                    applyStatusEffect(target, 'paralyzed', { duration: 2 }, this.name);
                }
            }
            if (this.element === 'nature') {
                const lifestealAmount = Math.floor(damageDealt * procChance);
                if (lifestealAmount > 0) {
                    this.hp = Math.min(this.maxHp, this.hp + lifestealAmount);
                    addToLog(`${this.name} drains <span class="font-bold text-green-400">${lifestealAmount}</span> HP from the natural energy.`, 'text-green-300');
                }
            }
            if (this.element === 'light' && Math.random() < procChance) {
                const debuffs = Object.keys(this.statusEffects).filter(key => ['paralyzed', 'petrified', 'drenched'].includes(key));
                if (debuffs.length > 0) {
                    const effectToCleanse = debuffs[0];
                    delete this.statusEffects[effectToCleanse];
                    addToLog(`The light energy cleanses ${this.name} of ${effectToCleanse}!`, 'text-yellow-200');
                }
            }
            if (this.element === 'lightning' && Math.random() < procChance) {
                const lightningDamage = rollDice(1, 8, 'Enemy Lightning Proc') + Math.floor(this.strength / 2);
                target.takeDamage(lightningDamage, true, this);
                addToLog(`Lightning arcs from the attack, dealing an extra <span class="font-bold text-blue-400">${lightningDamage}</span> damage!`);
            }
            if ((this.element === 'dark' || this.element === 'void') && Math.random() < procChance) {
                const lifestealAmount = Math.floor(damageDealt * procChance);
                 if (lifestealAmount > 0) {
                    this.hp = Math.min(this.maxHp, this.hp + lifestealAmount);
                    addToLog(`${this.name} drains <span class="font-bold text-purple-400">${lifestealAmount}</span> HP with dark energy.`, 'text-purple-300');
                }
            }
        }

        if (this.ability === 'life_drain') { const drainAmount = Math.floor(damageDealt / 2); this.hp = Math.min(this.maxHp, this.hp + drainAmount); addToLog(`${this.name} drains <span class="font-bold text-green-400">${drainAmount}</span> HP!`); }
        if (this.ability === 'earthshaker' && Math.random() < 0.3) {
            if (!target.statusEffects.paralyzed) {
                applyStatusEffect(target, 'paralyzed', { duration: 1 }, this.name);
            }
        }
    }
    takeDamage(damage, effects = {}) { 
        let currentDefense = this.defense;
        if (this.statusEffects.living_shield) {
            currentDefense *= 2;
        }
        if (effects.ignore_defense) {
            currentDefense *= (1 - effects.ignore_defense);
        }

        let damageTaken = this.statusEffects.enrage ? damage * 2 : damage;

        // --- Elemental Calculation ---
        if (effects.element && effects.element !== 'none' && this.element !== 'none') {
            const modifier = calculateElementalModifier(effects.element, this.element);
            if (modifier > 1) {
                damageTaken = Math.floor(damageTaken * modifier);
                addToLog("It's super effective!", 'text-green-400');
            } else if (modifier < 1) {
                damageTaken = Math.floor(damageTaken * modifier);
                addToLog("It's not very effective...", 'text-red-500');
            }
        }

        let effectiveDefense = currentDefense;
        if (effects.isMagic && effects.spell_penetration) {
            effectiveDefense *= (1 - effects.spell_penetration);
        }
        if (effects.element === 'void' || effects.element === 'dark') {
            const pierceAmount = Math.min(1, 0.5 + ((effects.tier || 0) * 0.1)); // Default tier to 0 if not provided
            effectiveDefense *= (1 - pierceAmount);
            addToLog(`Your dark attack bypasses a significant portion of the enemy's defense!`, 'text-purple-400');
        }

        const finalDamage = Math.max(0, Math.floor(damageTaken - effectiveDefense));
        this.hp -= finalDamage;

        if (gameState.currentView === 'battle') {
            renderBattleGrid();
        }
        return finalDamage;
    }
    async moveTowards(target) {
        const path = findPath({x: this.x, y: this.y}, {x: target.x, y: target.y}, true);
        
        if (path && path.length > 1) {
            addToLog(`${this.name} moves closer!`);
             for (let i = 1; i < path.length; i++) {
                // Stop if adjacent to the player
                const dx = Math.abs(path[i].x - target.x);
                const dy = Math.abs(path[i].y - target.y);
                if (dx + dy <= this.range) {
                     break;
                }

                await new Promise(resolve => setTimeout(resolve, 200));
                this.x = path[i].x;
                this.y = path[i].y;
                renderBattleGrid();
            }
        } else {
            addToLog(`${this.name} is blocked and cannot move!`);
        }
    }
    async moveTowards(target) {
        const isFlying = this.movement.type === 'flying';
        const path = findPath({x: this.x, y: this.y}, {x: target.x, y: target.y}, isFlying);
        
        if (path && path.length > 1) {
            addToLog(`${this.name} moves closer!`);
            const stepsToTake = Math.min(path.length - 1, this.movement.speed);

            for (let i = 1; i <= stepsToTake; i++) {
                const nextStep = path[i];
                
                // Check if moving into this cell would put it in range
                const distanceAfterMove = Math.abs(nextStep.x - target.x) + Math.abs(nextStep.y - target.y);
                
                this.x = nextStep.x;
                this.y = nextStep.y;
                renderBattleGrid();
                await new Promise(resolve => setTimeout(resolve, 150));

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
        if (currentEnemies.some(e => e !== this && e.x === x && e.y === y)) {
            return false;
        }
         // Check for obstacles
        if (gameState.gridObjects.some(o => o.x === x && o.y === y && o.type === 'obstacle')) {
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
    return QUESTS[questIdentifier.key] || null;
}

function applyStatusEffect(target, effectType, effectData, sourceName) {
    if (target instanceof Player) {
        const baseResist = target.resistanceChance;
        let finalResist = baseResist;

        // Multiplicative stacking from gear
        const shield = target.equippedShield;
        if (shield && shield.effect?.type === 'debuff_resist') {
            finalResist += (1 - finalResist) * shield.effect.chance;
        }
        
        if (Math.random() < finalResist) {
            addToLog(`You resisted the ${effectType} effect from ${sourceName}!`, 'text-cyan-300 font-bold');
            return;
        }
    }
    
    target.statusEffects[effectType] = effectData;
    
    let message = '';
    let color = 'text-red-400';
    switch(effectType) {
        case 'poison':
             message = `You have been poisoned by ${sourceName}!`;
             color = 'text-green-600'
            break;
        case 'petrified':
            message = `${sourceName} gazes at you, turning your flesh to stone! You are petrified.`;
            color = 'text-gray-400 font-bold';
            break;
        case 'paralyzed':
            message = `${sourceName}'s mighty blow shakes the earth! You are paralyzed!`;
            color = 'text-orange-500 font-bold';
            break;
        case 'swallowed':
            message = `${sourceName} opens its massive maw and swallows you whole!`;
            color = 'text-red-700 font-bold';
            break;
    }
    addToLog(message, color);
}

function generateEnemy(biomeKey) {
    const biomeData = BIOMES[biomeKey];
    const monsterPool = biomeData.monsters;
    const speciesKey = choices(Object.keys(monsterPool), Object.values(monsterPool));
    const speciesData = MONSTER_SPECIES[speciesKey];

    // Determine Rarity
    const rarityKeys = Object.keys(MONSTER_RARITY);
    let rarityWeights = [60, 25, 10, 4, 1];
    if (speciesData.class === 'Monstrosity') {
        rarityWeights = [40, 30, 15, 10, 5];
    }
    const chosenRarityKey = choices(rarityKeys, rarityWeights);
    const rarityData = MONSTER_RARITY[chosenRarityKey];

    // Determine Element
    const elementPopulation = ['none', 'fire', 'water', 'earth', 'wind', 'lightning', 'nature', 'light', 'void'];
    const elementWeights = [40, 9, 9, 9, 9, 9, 9, 3, 3];
    const chosenElementKey = choices(elementPopulation, elementWeights);

    let elementData = { key: 'none', adjective: '' };
    if (chosenElementKey !== 'none') {
        const chosenElement = ELEMENTS[chosenElementKey];
        elementData = { key: chosenElementKey, adjective: chosenElement.adjective };
    }


    return new Enemy(speciesData, rarityData, player.level, elementData);
}

function generateBlackMarketStock() {
    const restrictedItems = [
        'earthshaker_hammer', 'vacuum_greatbow', 'dragon_scale_cragblade', 'void_greatsword',
        'purifying_crystal_shield', 'exa_reflector', 'soul_steel_armor', 'vacuum_encaser'
    ];

    const rng = seededRandom(player.seed);
    const potentialStock = [];

    Object.keys(WEAPONS).forEach(key => { if (WEAPONS[key].price > 50) potentialStock.push(key); });
    Object.keys(ARMOR).forEach(key => { if (ARMOR[key].price > 50) potentialStock.push(key); });
    Object.keys(SHIELDS).forEach(key => { if (SHIELDS[key].price > 50) potentialStock.push(key); });
    Object.keys(ITEMS).forEach(key => {
        const item = ITEMS[key];
        if (item.price > 0 && item.type !== 'junk' && item.type !== 'alchemy') {
            potentialStock.push(key);
        }
    });

    const filteredStock = potentialStock.filter(itemKey => !restrictedItems.includes(itemKey));
    
    const shuffled = shuffleArray(filteredStock, rng);
    const stockCount = 3 + Math.floor(rng() * 3);
    player.blackMarketStock.seasonal = shuffled.slice(0, stockCount);
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
    const playerEssence = player.inventory.items[essenceKey] || 0;

    if (playerEssence < costs.essence) {
        addToLog(`You need ${costs.essence} ${getItemDetails(essenceKey).name} to enchant this.`, 'text-red-400');
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
    renderEnchanter(elementKey);
}

function restAtInn(cost) { 
    player.gold -= cost; 
    addToLog(`You pay <span class="font-bold">${cost} G</span> for a room.`, 'text-yellow-400'); 
    if (Math.random() < 0.1) { 
        addToLog(`You are ambushed in your sleep!`, 'text-red-500 font-bold'); 
        setTimeout(() => startBattle(gameState.currentBiome || player.biomeOrder[0]), 2000); 
    } else { 
        player.hp = player.maxHp; 
        player.mp = player.maxMp; 
        player.questsTakenToday = [];
        player.seed = Math.floor(Math.random() * 1000000);
        generateBlackMarketStock();
        addToLog(`You wake up feeling refreshed. The quest board and black market have new offerings.`, 'text-green-400 font-bold');
        updateStatsView(); 
        setTimeout(renderTown, 2000); 
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
        updateStatsView();
        renderSageTowerTrain();
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

    player.gold -= upgradeCost;
    for (const essenceKey in requiredEssences) {
        player.inventory.items[essenceKey] -= requiredEssences[essenceKey];
        if (player.inventory.items[essenceKey] <= 0) {
            delete player.inventory.items[essenceKey];
        }
    }

    player.spells[spellKey].tier++;
    const nextTierData = spellData.tiers[currentTierIndex + 1];
    addToLog(`You have upgraded to <span class="font-bold text-purple-300">${nextTierData.name}</span>!`, 'text-green-400');
    updateStatsView();
    renderSageTowerTrain();
}

function buyItem(itemKey, shopType, priceOverride = null) { 
    const details = getItemDetails(itemKey); 
    const finalPrice = priceOverride !== null ? priceOverride : details.price;
    if (player.gold >= finalPrice) { 
        player.gold -= finalPrice; 
        player.addToInventory(itemKey, 1, false); 
        addToLog(`You bought a ${details.name} for ${finalPrice} G.`, 'text-yellow-400'); 
        updateStatsView(); 
        if (shopType === 'blacksmith') {
            renderBlacksmithBuy();
        } else if (shopType === 'magic') {
            renderSageTowerBuy();
        } else {
            renderShop(shopType);
        }
    } 
}

function sellItem(category, itemKey, price) {
    if (!player) return;

    const details = getItemDetails(itemKey);
    if (!details) return;

    // Prevent selling equipped items
    if ((category === 'weapons' && player.equippedWeapon.name === details.name) ||
        (category === 'armor' && player.equippedArmor.name === details.name) ||
        (category === 'shields' && player.equippedShield.name === details.name)) {
        addToLog("You cannot sell an equipped item.", 'text-red-400');
        return;
    }

    let itemRemoved = false;
    if (category === 'items') {
        if (player.inventory.items[itemKey] && player.inventory.items[itemKey] > 0) {
            player.inventory.items[itemKey]--;
            if (player.inventory.items[itemKey] <= 0) {
                delete player.inventory.items[itemKey];
            }
            itemRemoved = true;
        }
    } else {
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
        player.gold += price;
        addToLog(`You sold ${details.name} for ${price} G.`, 'text-yellow-400');
        updateStatsView();
        renderSell();
    } else {
        addToLog("Could not find the item to sell.", 'text-red-400');
    }
}

function useItem(itemKey, inBattle = false, targetIndex = null) {
    if (!player.inventory.items[itemKey] || player.inventory.items[itemKey] < 1) {
        addToLog("You don't have that item!", 'text-red-400');
        if (inBattle) renderBattle('item');
        else renderInventory();
        return false;
    }
    const details = ITEMS[itemKey];
    
    if (inBattle && details.type === 'enchant') {
        const target = currentEnemies[targetIndex];
        if (targetIndex === null || !target || !target.isAlive()) {
            addToLog("You must select a valid target.", 'text-red-400');
            renderBattle('item');
            return false;
        }
        
        gameState.isPlayerTurn = false;
        const element = itemKey.replace('_essence', '');
        const damage = rollDice(1, 8, 'Essence Attack') + player.magicalDamageBonus;

        addToLog(`You channel the ${details.name}, unleashing a blast of ${element} energy!`, 'text-yellow-300');
        const finalDamage = target.takeDamage(damage, { isMagic: true, element: element });
        addToLog(`It hits ${target.name} for <span class="font-bold text-purple-400">${finalDamage}</span> ${element} damage.`);

    } else {
        if (inBattle) gameState.isPlayerTurn = false;

        if (details.type === 'healing') {
            player.hp = Math.min(player.maxHp, player.hp + details.amount);
        } else if (details.type === 'mana_restore') {
            player.mp = Math.min(player.maxMp, player.mp + details.amount);
        } else if (details.type === 'buff') {
            player.statusEffects[details.effect.type] = { ...details.effect };
            addToLog(`You drink the ${details.name} and feel a surge of power!`, 'text-yellow-300');
        } else if (details.type === 'cleanse') {
            const badEffects = ['poison', 'petrified', 'paralyzed', 'swallowed'];
            for (const effect of badEffects) {
                if (player.statusEffects[effect]) {
                    delete player.statusEffects[effect];
                }
            }
            addToLog(`You drink the ${details.name} and feel purified.`, 'text-cyan-300');
        }
        addToLog(`You used a <span class="font-bold text-green-300">${details.name}</span>.`);
    }

    player.inventory.items[itemKey]--;
    if (player.inventory.items[itemKey] <= 0) {
        delete player.inventory.items[itemKey];
    }
    updateStatsView();

    if (!inBattle) {
        renderInventory();
    } else {
        setTimeout(checkBattleStatus, 200);
    }
    return true;
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

    if (itemType === 'armor') {
        if (player.equippedArmor === details) return;
        player.equippedArmor = details;
    } else if (itemType === 'lure') {
        if (player.equippedLure === itemKey) return;
        player.equippedLure = itemKey;
    } 
    else if (itemType) {
        const isCurrentlyEquipped = 
            (itemType === 'weapon' && player.equippedWeapon === details) ||
            (itemType === 'catalyst' && player.equippedCatalyst === details) ||
            (itemType === 'shield' && player.equippedShield === details);

        if (isCurrentlyEquipped) return;

        if (details.effect?.dual_wield) {
            if (player.equippedShield.name !== 'None') {
                addToLog(`You unequip your ${player.equippedShield.name} to wield two swords.`, 'text-yellow-500');
                player.equippedShield = SHIELDS['no_shield'];
                const shieldIndex = player.equipmentOrder.indexOf('shield');
                if (shieldIndex > -1) player.equipmentOrder.splice(shieldIndex, 1);
            }
            if (player.equippedCatalyst.name !== 'None') {
                addToLog(`You unequip your ${player.equippedCatalyst.name} to wield two swords.`, 'text-yellow-500');
                player.equippedCatalyst = CATALYSTS['no_catalyst'];
                 const catalystIndex = player.equipmentOrder.indexOf('catalyst');
                if (catalystIndex > -1) player.equipmentOrder.splice(catalystIndex, 1);
            }
        }
        
        if ((itemType === 'shield' || itemType === 'catalyst') && player.equippedWeapon.effect?.dual_wield) {
            addToLog(`You cannot use a ${itemType} while dual wielding.`, 'text-red-400');
            return;
        }

        const typeIndex = player.equipmentOrder.indexOf(itemType);
        if (typeIndex > -1) {
            player.equipmentOrder.splice(typeIndex, 1);
        }

        if (player.equipmentOrder.length >= 2) {
            const typeToUnequip = player.equipmentOrder.shift();
            let unequippedItemName = '';
            if (typeToUnequip === 'weapon') {
                unequippedItemName = player.equippedWeapon.name;
                player.equippedWeapon = WEAPONS['fists'];
            } else if (typeToUnequip === 'catalyst') {
                unequippedItemName = player.equippedCatalyst.name;
                player.equippedCatalyst = CATALYSTS['no_catalyst'];
            } else if (typeToUnequip === 'shield') {
                unequippedItemName = player.equippedShield.name;
                player.equippedShield = SHIELDS['no_shield'];
            }
            addToLog(`You unequipped ${unequippedItemName} to make room for the ${details.name}.`, 'text-yellow-500');
        }

        player.equipmentOrder.push(itemType);
        
        if (itemType === 'weapon') player.equippedWeapon = details;
        else if (itemType === 'catalyst') player.equippedCatalyst = details;
        else if (itemType === 'shield') player.equippedShield = details;
    }

    addToLog(`You equipped the <span class="font-bold text-cyan-300">${details.name}</span>.`);
    updateStatsView();
    if (gameState.currentView === 'inventory') {
        renderInventory();
    }
}

function unequipItem(itemType) {
    if (!player) return;

    let unequippedItemName = '';

    switch (itemType) {
        case 'weapon':
            if (player.equippedWeapon.name === WEAPONS['fists'].name) return;
            unequippedItemName = player.equippedWeapon.name;
            player.equippedWeapon = WEAPONS['fists'];
            player.weaponElement = 'none';
            break;
        case 'catalyst':
            if (player.equippedCatalyst.name === CATALYSTS['no_catalyst'].name) return;
            unequippedItemName = player.equippedCatalyst.name;
            player.equippedCatalyst = CATALYSTS['no_catalyst'];
            break;
        case 'armor':
            if (player.equippedArmor.name === ARMOR['travelers_garb'].name) return;
            unequippedItemName = player.equippedArmor.name;
            player.equippedArmor = ARMOR['travelers_garb'];
            player.armorElement = 'none';
            break;
        case 'shield':
            if (player.equippedShield.name === SHIELDS['no_shield'].name) return;
            unequippedItemName = player.equippedShield.name;
            player.equippedShield = SHIELDS['no_shield'];
            player.shieldElement = 'none';
            break;
        case 'lure':
            if (player.equippedLure === 'no_lure') return;
            unequippedItemName = LURES[player.equippedLure].name;
            player.equippedLure = 'no_lure';
            break;
        default:
            return;
    }

    if (['weapon', 'catalyst', 'shield'].includes(itemType)) {
        const typeIndex = player.equipmentOrder.indexOf(itemType);
        if (typeIndex > -1) {
            player.equipmentOrder.splice(typeIndex, 1);
        }
    }

    addToLog(`You unequipped the <span class="font-bold text-cyan-300">${unequippedItemName}</span>.`);
    updateStatsView();
    if (gameState.currentView === 'inventory') {
        renderInventory();
    }
}


function brewWitchPotion(recipeKey) {
    const recipe = WITCH_COVEN_RECIPES[recipeKey];
    if (!recipe) return;

    if(player.gold < recipe.cost) {
        addToLog(`You need ${recipe.cost} Gold.`, 'text-red-400');
        return;
    }
    if ((player.inventory.items['undying_heart'] || 0) < recipe.hearts) {
         addToLog(`You need ${recipe.hearts} Undying Hearts.`, 'text-red-400');
        return;
    }
     for (const ingredientKey in recipe.ingredients) {
        if ((player.inventory.items[ingredientKey] || 0) < recipe.ingredients[ingredientKey]) {
            addToLog(`You lack the required ingredients.`, 'text-red-400');
            return;
        }
    }

    player.gold -= recipe.cost;
    player.inventory.items['undying_heart'] -= recipe.hearts;
    if (player.inventory.items['undying_heart'] <= 0) delete player.inventory.items['undying_heart'];

    for (const ingredientKey in recipe.ingredients) {
        player.inventory.items[ingredientKey] -= recipe.ingredients[ingredientKey];
        if (player.inventory.items[ingredientKey] <= 0) delete player.inventory.items[ingredientKey];
    }
    
    player.addToInventory(recipe.output, 1);
    updateStatsView();
    renderWitchsCoven('brew');
}

function transmuteWitchItem(recipeKey) {
    const recipe = WITCH_COVEN_RECIPES[recipeKey];
    if (!recipe) return;

    if (player.gold < recipe.cost) {
        addToLog(`You need ${recipe.cost} Gold.`, 'text-red-400');
        return;
    }
    for (const ingredientKey in recipe.ingredients) {
        if ((player.inventory.items[ingredientKey] || 0) < recipe.ingredients[ingredientKey]) {
            addToLog(`You lack the required ingredients.`, 'text-red-400');
            return;
        }
    }
    
    player.gold -= recipe.cost;
    for (const ingredientKey in recipe.ingredients) {
        player.inventory.items[ingredientKey] -= recipe.ingredients[ingredientKey];
        if (player.inventory.items[ingredientKey] <= 0) delete player.inventory.items[ingredientKey];
    }

    player.addToInventory(recipe.output, 1);
    updateStatsView();
    renderWitchsCoven('transmute');
}

function resetStatsCoven() {
    const cost = WITCH_COVEN_SERVICES.resetStats;
    if (player.gold < cost.gold || (player.inventory.items['undying_heart'] || 0) < cost.hearts) {
        addToLog("You lack the required payment to reset your fate.", 'text-red-400');
        return;
    }
    
    player.gold -= cost.gold;
    player.inventory.items['undying_heart'] -= cost.hearts;
    if(player.inventory.items['undying_heart'] <= 0) delete player.inventory.items['undying_heart'];

    const pointsToRefund = player.bonusVigor + player.bonusFocus + player.bonusStamina + player.bonusStrength + player.bonusIntelligence + player.bonusLuck;
    player.statPoints += pointsToRefund;
    
    // Subtract the bonus points from the main stats before resetting the bonus points
    player.vigor -= player.bonusVigor;
    player.focus -= player.bonusFocus;
    player.stamina -= player.bonusStamina;
    player.strength -= player.bonusStrength;
    player.intelligence -= player.bonusIntelligence;
    player.luck -= player.bonusLuck;
    
    // Now reset the bonus points
    player.bonusVigor = 0;
    player.bonusFocus = 0;
    player.bonusStamina = 0;
    player.bonusStrength = 0;
    player.bonusIntelligence = 0;
    player.bonusLuck = 0;

    player.recalculateGrowthBonuses();
    player.hp = player.maxHp;
    player.mp = player.maxMp;
    
    addToLog("The witch chants, and you feel your body's potential restored. Your stats have been reset.", 'text-purple-300');
    updateStatsView();
    saveGame();
    setTimeout(() => renderCharacterSheet(true), 1000);
}

function changeCharacterAspect(aspectType, newKey) {
    const costs = {
        race: WITCH_COVEN_SERVICES.changeRace,
        class: WITCH_COVEN_SERVICES.changeClass,
        background: WITCH_COVEN_SERVICES.changeBackground
    };
    const cost = costs[aspectType];

     if (player.gold < cost.gold || (player.inventory.items['undying_heart'] || 0) < cost.hearts) {
        addToLog("You lack the required payment for such a powerful ritual.", 'text-red-400');
        return;
    }
    
    player.gold -= cost.gold;
    player.inventory.items['undying_heart'] -= cost.hearts;
    if(player.inventory.items['undying_heart'] <= 0) delete player.inventory.items['undying_heart'];

    // Reverse old bonuses
    if (aspectType === 'class') {
        const oldClassData = Object.values(CLASSES).find(c => c.name === player.class);
        if (oldClassData) {
            for (const stat in oldClassData.bonusStats) {
                player[stat.toLowerCase()] -= oldClassData.bonusStats[stat];
            }
        }
    } else if (aspectType === 'race') {
        const oldRaceData = RACES[player.race];
        if(oldRaceData) {
            player.vigor -= oldRaceData.Vigor;
            player.focus -= oldRaceData.Focus;
            player.stamina -= oldRaceData.Stamina;
            player.strength -= oldRaceData.Strength;
            player.intelligence -= oldRaceData.Intelligence;
            player.luck -= oldRaceData.Luck;
        }
    }
    
    // Apply new bonuses
    if (aspectType === 'class') {
        const newClassData = CLASSES[newKey];
        player.class = newClassData.name;
        for (const stat in newClassData.bonusStats) {
            player[stat.toLowerCase()] += newClassData.bonusStats[stat];
        }
    } else if (aspectType === 'race') {
        const newRaceData = RACES[newKey];
        player.race = newKey;
        player.vigor += newRaceData.Vigor;
        player.focus += newRaceData.Focus;
        player.stamina += newRaceData.Stamina;
        player.strength += newRaceData.Strength;
        player.intelligence += newRaceData.Intelligence;
        player.luck += newRaceData.Luck;
    } else if (aspectType === 'background') {
        player.background = BACKGROUNDS[newKey].name;
        player.backgroundKey = newKey;
    }

    player.recalculateGrowthBonuses();
    player.hp = player.maxHp;
    player.mp = player.maxMp;

    addToLog("The world shifts around you. You are... different.", 'text-purple-300 font-bold');
    updateStatsView();
    saveGame();
    renderWitchsCoven('rebirth');
}

function brewPotion(recipeKey) {
    const recipe = ALCHEMY_RECIPES[recipeKey];
    if (!recipe) return;

    let hasIngredients = true;
    for (const ingredientKey in recipe.ingredients) {
        const requiredAmount = recipe.ingredients[ingredientKey];
        
        let playerAmount = 0;
        if (ITEMS[ingredientKey]) {
            playerAmount = player.inventory.items[ingredientKey] || 0;
        } else if (ARMOR[ingredientKey]) {
            playerAmount = player.inventory.armor.filter(i => i === ingredientKey).length;
        }

        if (playerAmount < requiredAmount) {
            hasIngredients = false;
            break;
        }
    }

    if (!hasIngredients) {
        addToLog("You don't have the required ingredients.", 'text-red-400');
        return;
    }
    if (player.gold < recipe.cost) {
        addToLog("You don't have enough gold.", 'text-red-400');
        return;
    }

    for (const ingredientKey in recipe.ingredients) {
        const requiredAmount = recipe.ingredients[ingredientKey];
        if (ITEMS[ingredientKey]) {
            player.inventory.items[ingredientKey] -= requiredAmount;
            if (player.inventory.items[ingredientKey] <= 0) {
                delete player.inventory.items[ingredientKey];
            }
        } else if (ARMOR[ingredientKey]) {
            for(let i = 0; i < requiredAmount; i++) {
                const index = player.inventory.armor.indexOf(ingredientKey);
                if (index > -1) {
                    player.inventory.armor.splice(index, 1);
                }
            }
        }
    }
    player.gold -= recipe.cost;

    player.addToInventory(recipe.output);
    const productDetails = getItemDetails(recipe.output);
    addToLog(`You successfully crafted a <span class="font-bold text-green-300">${productDetails.name}</span>!`);

    if (player.activeQuest && player.activeQuest.category === 'creation') {
        const quest = getQuestDetails(player.activeQuest);
        if (quest && quest.target === recipe.output) {
            player.questProgress++;
            addToLog(`Quest progress: ${player.questProgress}/${quest.required}`, 'text-amber-300');
        }
    }

    updateStatsView();
    renderAlchemist();
}

function craftGear(recipeKey, sourceShop) {
    const recipe = (sourceShop === 'magic' ? MAGIC_SHOP_RECIPES[recipeKey] : BLACKSMITH_RECIPES[recipeKey]);
    if (!recipe) return;

    let hasIngredients = true;
    for (const ingredientKey in recipe.ingredients) {
        const requiredAmount = recipe.ingredients[ingredientKey];
        
        let playerAmount = 0;
        if (ITEMS[ingredientKey]) {
            playerAmount = player.inventory.items[ingredientKey] || 0;
        } else if (ARMOR[ingredientKey]) {
            playerAmount = player.inventory.armor.filter(i => i === ingredientKey).length;
        }

        if (playerAmount < requiredAmount) {
            hasIngredients = false;
            break;
        }
    }

    if (!hasIngredients) {
        addToLog("You don't have the required materials.", 'text-red-400');
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
        } else if (ARMOR[ingredientKey]) {
            for(let i = 0; i < requiredAmount; i++) {
                const index = player.inventory.armor.indexOf(ingredientKey);
                if (index > -1) {
                    player.inventory.armor.splice(index, 1);
                }
            }
        }
    }
    player.gold -= recipe.cost;

    player.addToInventory(recipe.output);
    const craftedItemDetails = getItemDetails(recipe.output);
    addToLog(`You successfully created a <span class="font-bold text-green-300">${craftedItemDetails.name}</span>!`);

    if (player.activeQuest && player.activeQuest.category === 'creation') {
        const quest = getQuestDetails(player.activeQuest);
        if (quest && quest.target === recipe.output) {
            player.questProgress++;
            addToLog(`Quest progress: ${player.questProgress}/${quest.required}`, 'text-amber-300');
        }
    }

    updateStatsView();
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
        player.questProgress = 0; 
        player.questsTakenToday.push(questKey);
        const quest = getQuestDetails(player.activeQuest);
        addToLog(`New quest accepted: <span class="font-bold" style="color: var(--text-accent);">${quest.title}</span>!`); 
        updateStatsView(); 
        renderQuestBoard(); 
    } else { 
        addToLog(`You already have an active quest!`); 
    } 
}
function completeQuest() {
    if (!player.activeQuest) return;
    const quest = getQuestDetails(player.activeQuest);
    if (!quest) return;

    if (player.activeQuest.category === 'collection') {
        const itemDetails = getItemDetails(quest.target);
        if (itemDetails) {
            if (quest.target in ITEMS) {
                player.inventory.items[quest.target] -= quest.required;
                if (player.inventory.items[quest.target] <= 0) {
                    delete player.inventory.items[quest.target];
                }
            } else {
                for (let i = 0; i < quest.required; i++) {
                    let category;
                    if (quest.target in WEAPONS) category = 'weapons';
                    else if (quest.target in ARMOR) category = 'armor';
                    else if (quest.target in SHIELDS) category = 'shields';

                    if (category) {
                        const index = player.inventory[category].indexOf(quest.target);
                        if (index > -1) {
                            player.inventory[category].splice(index, 1);
                        }
                    }
                }
            }
        }
    }
    addToLog(`Quest Complete: <span class="font-bold text-green-400">${quest.title}</span>!`);
    player.gainXp(quest.reward.xp); 
    player.gold += quest.reward.gold; 
    addToLog(`You received ${quest.reward.gold} G.`, 'text-yellow-400');
    player.activeQuest = null; 
    player.questProgress = 0; 
    updateStatsView(); 
    renderQuestBoard();
}

function cancelQuest() {
    if (!player.activeQuest) return;
    const penalty = 15 * player.level;

    if (player.gold < penalty) {
        addToLog(`You cannot afford the ${penalty} G fee to cancel the quest.`, 'text-red-400');
        return;
    }

    const quest = getQuestDetails(player.activeQuest);
    player.gold -= penalty;
    addToLog(`You paid a ${penalty} G fee and abandoned the quest: <span class="font-bold text-yellow-300">${quest.title}</span>.`, 'text-red-400');
    
    const questIndex = player.questsTakenToday.indexOf(player.activeQuest.key);
    if (questIndex > -1) {
        player.questsTakenToday.splice(questIndex, 1);
    }
    
    player.activeQuest = null;
    player.questProgress = 0;
    
    updateStatsView();
    renderQuestBoard();
}

