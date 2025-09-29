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


// --- CLASSES ---
class Entity {
    constructor(name, hp, strength) { this.name = name; this.maxHp = hp; this.hp = hp; this.strength = strength; this.statusEffects = {}; }
    isAlive() { return this.hp > 0; }
}

class Player extends Entity {
    constructor(name) {
        super(name, 50, 5);
        this.gold = 100; this.level = 1; this.xp = 0; this.xpToNextLevel = 100;
        this.mp = 20; this.maxMp = 20; this.intelligence = 5;
        this.saveKey = null; // Will be assigned on new game
        this.seed = null; // Will be assigned on new game for consistent randomization
        this.playerTier = 1; // Highest unlocked biome tier
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

        this.equipmentOrder = []; // Tracks the order of 'weapon', 'catalyst', 'shield'
        this.inventory = { 
            items: { 
                'health_potion': 3,
                'mana_potion': 1
            }, 
            weapons: ['fists', 'rusty_sword'],
            catalysts: ['no_catalyst'],
            armor: ['travelers_garb'], 
            shields: ['no_shield'], 
            lures: { } 
        };
        // New spell tracking system
        this.spells = {
            'none_st': { tier: 1 },
            'healing_st': { tier: 1 }
        };
        this.activeQuest = null; this.questProgress = 0;
        this.legacyQuestProgress = {};
        this.questsTakenToday = [];
        this.biomeOrder = [];
        this.biomeUnlockLevels = {};
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
    gainXp(amount) { this.xp += amount; addToLog(`You gained <span class="font-bold">${amount}</span> XP!`, 'text-yellow-400'); if (this.xp >= this.xpToNextLevel) this.levelUp(); updateStatsView(); }
    levelUp() { 
        this.level++; 
        this.xp -= this.xpToNextLevel; 
        this.xpToNextLevel = Math.floor(this.xpToNextLevel * 1.1 + this.level * 25); 
        this.maxHp += 10; this.hp = this.maxHp; 
        this.maxMp += 5; this.mp = this.maxMp; 
        this.strength += 2; this.intelligence += 2; 
        addToLog(`*** LEVEL UP! You are now level ${this.level}! ***`, 'text-yellow-200 font-bold text-lg'); 
        updatePlayerTier(); // Update the player's tier after leveling up
    }
    clearBattleBuffs() {
        const buffsToClear = [
            'buff_strength', 'buff_chaos_strength', 'buff_titan',
            'buff_defense', 'stonehide', 'buff_shroud', 'buff_voidwalker',
            'buff_haste', 'buff_hermes', 'buff_ion_self', 'buff_ion_other',
            'buff_magic_defense', 'buff_divine'
            // 'buff_ingrain' and 'buff_mother_nature' are intentionally left to persist
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
    takeDamage(damage, ignoresDefense = false, attacker = null) { 
        const shield = this.equippedShield;
        const armor = this.equippedArmor;
        let dodgeChance = 0;

        // --- Calculate Dodge Chance ---
        if (armor && armor.effect?.type === 'dodge') {
            dodgeChance = armor.effect.chance;
        }
        if (this.statusEffects.buff_shroud || this.statusEffects.buff_voidwalker) {
            dodgeChance *= 1.5;
        }
        if (this.statusEffects.buff_hermes) {
            dodgeChance *= 2; // Double total dodge
        }

        // --- Parry logic (Stops attack entirely) ---
        if (shield && shield.effect?.type === 'parry' && Math.random() < shield.effect.chance && attacker && attacker.isAlive()) {
            attacker.attackParried = true; // Flag that the attack was stopped
            addToLog(`You parried ${attacker.name}'s attack with your ${shield.name}!`, 'text-yellow-300 font-bold');
            setTimeout(() => {
                addToLog(`You launch a swift counter-attack!`, 'text-yellow-300');
                const weapon = this.equippedWeapon;
                let counterDamage = rollDice(...weapon.damage, 'Player Parry') + this.strength;
                const finalDamage = attacker.takeDamage(counterDamage, { element: this.weaponElement });
                addToLog(`Your riposte hits ${attacker.name} for <span class="font-bold text-yellow-300">${finalDamage}</span> damage.`);
                if (!gameState.battleEnded) {
                     checkBattleStatus(true); // Pass true to indicate this is a reaction
                }
            }, 300);
            updateStatsView();
            return 0; // No damage taken
        }
        
        // --- Dodge logic (Stops attack entirely) ---
        if (dodgeChance > 0 && Math.random() < dodgeChance) {
            attacker.attackParried = true; // Flag that the attack was stopped
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
        let armorDefense = ignoresDefense ? 0 : (armor?.defense || 0);
        let shieldDefense = ignoresDefense ? 0 : (shield?.defense || 0);

        if (attacker?.element && attacker.element !== 'none' && !ignoresDefense) {
            const attackerElement = ELEMENTS[attacker.element];

            // Armor elemental check
            if (this.armorElement !== 'none') {
                if (attackerElement.weakness.includes(this.armorElement)) { // Armor is strong vs attack
                    armorDefense *= 2;
                    addToLog(`Your armor's enchantment resists the attack, doubling its effectiveness!`, 'text-green-400');
                } else if (attackerElement.strength.includes(this.armorElement)) { // Armor is weak vs attack
                    armorDefense = 0;
                    addToLog(`Your armor's enchantment is weak to the attack, offering no protection!`, 'text-red-500');
                }
            }
            
            // Shield elemental check
            if (this.shieldElement !== 'none') {
                if (attackerElement.weakness.includes(this.shieldElement)) { // Shield is strong vs attack
                    shieldDefense *= 2;
                    addToLog(`Your shield's enchantment resists the attack, doubling its effectiveness!`, 'text-green-400');
                } else if (attackerElement.strength.includes(this.shieldElement)) { // Shield is weak vs attack
                    shieldDefense = 0;
                    addToLog(`Your shield's enchantment is weak to the attack, offering no protection!`, 'text-red-500');
                }
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
        const finalDamage = Math.max(0, damage - effectiveDefense);
        this.hp -= finalDamage;
        
        let damageType = '';
        if (attacker && attacker.element && attacker.element !== 'none') {
            damageType = ` ${ELEMENTS[attacker.element].name}`;
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
        const rewardMultiplier = rarityData.rewardMultiplier || rarityData.multiplier; // Fallback for safety

        const finalHp = Math.floor((speciesData.base_hp + (playerLevel * 1.5)) * statMultiplier);
        const finalStrength = Math.floor((speciesData.base_strength + Math.floor(playerLevel / 2)) * statMultiplier);
        const finalDefense = Math.floor(((speciesData.base_defense || 0) + Math.floor(playerLevel / 3)) * statMultiplier);
        
        const name = elementData.key !== 'none' 
            ? `${rarityData.name} ${elementData.adjective} ${speciesData.name}`
            : `${rarityData.name} ${speciesData.name}`;

        super(name, finalHp, finalStrength);
        
        const classDamage = MONSTER_CLASS_DAMAGE[speciesData.class];
        const tier = speciesData.tier;
        const rarityIndex = rarityData.rarityIndex;

        let diceCount = (rarityIndex + tier + classDamage.baseDice) - 2;
        this.damage = [Math.max(1, diceCount), classDamage.dieSides];
        
        this.defense = finalDefense;
        this.ability = speciesData.ability;
        this.element = elementData.key;
        this.xpReward = Math.floor(speciesData.base_xp * rewardMultiplier * (speciesData.class === 'Monstrosity' ? 1.2 : 1)); 
        this.goldReward = Math.floor(speciesData.base_gold * rewardMultiplier * (speciesData.class === 'Monstrosity' ? 1.2 : 1));
        this.lootTable = {...speciesData.loot_table}; // Create a copy to modify
        this.lootChanceMod = (speciesData.class === 'Beast' ? 1.5 : 1);
        this.potionDropChanceMod = (speciesData.class === 'Humanoid' ? 1.5 : 1);
        this.speciesData = speciesData;
        this.rarityData = rarityData;
        
        if (this.element !== 'none') {
            const essenceKey = `${this.element}_essence`;
            if (ITEMS[essenceKey]) {
                this.lootTable[essenceKey] = (this.lootTable[essenceKey] || 0) + 0.3 + (rarityIndex * 0.05); // Base 30% + 5% per rarity
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
    attack(target) {
        this.attackParried = false; // Reset the parry flag
        addToLog(`${this.name} attacks ${target.name}!`); 
        this._performAttack(target);
        if (this.attackParried) return; // If the attack was parried or dodged, stop here.

        const rarityIndex = this.rarityData.rarityIndex;
        if (this.element === 'wind' && !this.attackParried && Math.random() < (rarityIndex * 0.05)) {
            addToLog(`The swirling winds grant ${this.name} another strike!`, 'text-gray-300');
            setTimeout(() => {
                let followUpDamage = Math.floor((rollDice(this.damage[0], this.damage[1], `${this.name} Wind Follow-up`) + this.strength) / 2);
                if (this.element === 'fire') { // Apply fire bonus to follow-up as well
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
        
        let damageDealt = target.takeDamage(totalDamage, !!this.statusEffects.ultra_focus, this);

        const rarityIndex = this.rarityData.rarityIndex;
        if (damageDealt > 0) {
            if (this.element === 'water') {
                addToLog(`The water attack leaves you drenched, weakening your next attack!`, 'text-blue-400');
                target.statusEffects.drenched = { duration: 2, multiplier: 0.9 };
            }
            if (this.element === 'earth' && Math.random() < (rarityIndex * 0.05)) {
                if (!target.statusEffects.paralyzed) {
                    applyStatusEffect(target, 'paralyzed', { duration: 2 }, this.name);
                }
            }
            if (this.element === 'nature') {
                const lifestealAmount = Math.floor(damageDealt * (rarityIndex * 0.05));
                if (lifestealAmount > 0) {
                    this.hp = Math.min(this.maxHp, this.hp + lifestealAmount);
                    addToLog(`${this.name} drains <span class="font-bold text-green-400">${lifestealAmount}</span> HP from the natural energy.`, 'text-green-300');
                }
            }
            if (this.element === 'light' && Math.random() < (rarityIndex * 0.05)) {
                const debuffs = Object.keys(this.statusEffects).filter(key => ['paralyzed', 'petrified', 'drenched'].includes(key));
                if (debuffs.length > 0) {
                    const effectToCleanse = debuffs[0];
                    delete this.statusEffects[effectToCleanse];
                    addToLog(`The light energy cleanses ${this.name} of ${effectToCleanse}!`, 'text-yellow-200');
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
            const monsterElement = ELEMENTS[this.element];
            if (monsterElement.weakness.includes(effects.element)) {
                damageTaken *= 2;
                addToLog("It's super effective!", 'text-green-400');
            }
            if (monsterElement.strength.includes(effects.element)) {
                damageTaken = Math.floor(damageTaken / 2);
                addToLog("It's not very effective...", 'text-red-500');
            }
        }

        if (effects.isMagic && this.speciesData.spell_resistance) {
            damageTaken *= (1 - this.speciesData.spell_resistance);
            addToLog(`${this.name} resists some of the magical damage!`, 'text-purple-200');
        }

        let effectiveDefense = currentDefense;
        if (effects.element === 'void') {
            effectiveDefense *= 0.5;
            addToLog(`Your void attack partially bypasses the enemy's defense!`, 'text-purple-400');
        }

        const finalDamage = Math.max(0, Math.floor(damageTaken - effectiveDefense));
        this.hp -= finalDamage;

        if (gameState.currentView === 'battle') {
            renderBattle();
        }
        return finalDamage;
    }
}


// --- CORE LOGIC FUNCTIONS ---

function getQuestDetails(questIdentifier) {
    if (!questIdentifier || !questIdentifier.category || !questIdentifier.key) {
        return null;
    }
    // The quest data structure is flat, not nested under categories in the object.
    // This looks for the key directly in the QUESTS object.
    return QUESTS[questIdentifier.key] || null;
}

function applyStatusEffect(target, effectType, effectData, sourceName) {
    // Check for player's debuff resistance
    if (target instanceof Player) {
        const shield = target.equippedShield;
        if (shield && shield.effect?.type === 'debuff_resist' && Math.random() < shield.effect.chance) {
            addToLog(`Your ${shield.name} glows and resists the ${effectType} effect from ${sourceName}!`, 'text-cyan-300 font-bold');
            return; // Effect resisted
        }
    }
    
    // Apply the effect
    target.statusEffects[effectType] = effectData;
    
    // Log the effect
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
    let rarityWeights = [60, 25, 10, 4, 1]; // Common, Uncommon, Rare, Epic, Legendary
    if (speciesData.class === 'Monstrosity') {
        rarityWeights = [40, 30, 15, 10, 5]; // Higher chance for higher rarity
    }
    const chosenRarityKey = choices(rarityKeys, rarityWeights);
    const rarityData = MONSTER_RARITY[chosenRarityKey];

    // Determine Element based on specified probabilities
    const elementPopulation = ['none', 'fire', 'water', 'earth', 'wind', 'lightning', 'nature', 'light', 'void'];
    const elementWeights = [40, 9, 9, 9, 9, 9, 9, 3, 3]; // 40% none, 9% standard, 3% rare
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
        // Legendary Weapons
        'earthshaker_hammer', 'vacuum_greatbow', 'dragon_scale_cragblade', 'void_greatsword',
        // Alchemist-crafted Gear
        'purifying_crystal_shield', 'exa_reflector', 'soul_steel_armor', 'vacuum_encaser'
    ];

    const rng = seededRandom(player.seed);
    const potentialStock = [];

    // Add non-basic weapons
    Object.keys(WEAPONS).forEach(key => {
        if (WEAPONS[key].price > 50) potentialStock.push(key);
    });
    // Add non-basic armor
    Object.keys(ARMOR).forEach(key => {
        if (ARMOR[key].price > 50) potentialStock.push(key);
    });
    // Add non-basic shields
    Object.keys(SHIELDS).forEach(key => {
        if (SHIELDS[key].price > 50) potentialStock.push(key);
    });
    // Add non-junk/alchemy items
    Object.keys(ITEMS).forEach(key => {
        const item = ITEMS[key];
        if (item.price > 0 && item.type !== 'junk' && item.type !== 'alchemy') {
            potentialStock.push(key);
        }
    });

    const filteredStock = potentialStock.filter(itemKey => !restrictedItems.includes(itemKey));
    
    const shuffled = shuffleArray(filteredStock, rng);
    const stockCount = 3 + Math.floor(rng() * 3); // 3 to 5 items
    player.blackMarketStock.seasonal = shuffled.slice(0, stockCount);
}


// --- PLAYER ACTIONS (OUT OF BATTLE) ---

function enchantItem(gearType, elementKey) {
    if (!player) return;

    let gear, currentElementProp;
    switch(gearType) {
        case 'weapon':
            gear = player.equippedWeapon;
            currentElementProp = 'weaponElement';
            break;
        case 'armor':
            gear = player.equippedArmor;
            currentElementProp = 'armorElement';
            break;
        case 'shield':
            gear = player.equippedShield;
            currentElementProp = 'shieldElement';
            break;
        default:
            return;
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

    // Pay costs
    player.inventory.items[essenceKey] -= costs.essence;
    if (player.inventory.items[essenceKey] <= 0) {
        delete player.inventory.items[essenceKey];
    }
    player.gold -= costs.gold;

    // Apply enchant
    player[currentElementProp] = elementKey;

    addToLog(`You successfully enchanted your ${gear.name} with the power of ${elementKey}!`, 'text-green-400 font-bold');
    updateStatsView();
    renderEnchanter(elementKey); // Re-render to update UI
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
        player.seed = Math.floor(Math.random() * 1000000); // Reshuffle the seed
        generateBlackMarketStock();
        addToLog(`You wake up feeling refreshed. The quest board and black market have new offerings.`, 'text-green-400 font-bold');
        updateStatsView(); 
        setTimeout(renderTown, 2000); 
    } 
}

function upgradeSpell(spellKey) {
    const spellData = SPELLS[spellKey];
    const playerSpell = player.spells[spellKey];
    
    // Learning a new spell
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
    
    // Check gold and essences
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

    // Deduct costs
    player.gold -= upgradeCost;
    for (const essenceKey in requiredEssences) {
        player.inventory.items[essenceKey] -= requiredEssences[essenceKey];
        if (player.inventory.items[essenceKey] <= 0) {
            delete player.inventory.items[essenceKey];
        }
    }

    // Upgrade spell
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
            renderMagicShopBuy();
        } else {
            renderShop(shopType);
        }
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
    
    // Handle targeted combat items (Essences)
    if (inBattle && details.type === 'enchant') {
        const target = currentEnemies[targetIndex];
        if (targetIndex === null || !target || !target.isAlive()) {
            addToLog("You must select a valid target.", 'text-red-400');
            renderBattle('item'); // Go back to item menu if target is invalid
            return false;
        }
        
        gameState.isPlayerTurn = false;
        const element = itemKey.replace('_essence', '');
        const damage = rollDice(1, 8, 'Essence Attack') + player.intelligence;

        addToLog(`You channel the ${details.name}, unleashing a blast of ${element} energy!`, 'text-yellow-300');
        const finalDamage = target.takeDamage(damage, { isMagic: true, element: element });
        addToLog(`It hits ${target.name} for <span class="font-bold text-purple-400">${finalDamage}</span> ${element} damage.`);

    } else { // Handle self-use items (Potions, Buffs)
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

    // --- Simple Equips (Armor & Lure) ---
    if (itemType === 'armor') {
        if (player.equippedArmor === details) return;
        player.equippedArmor = details;
    } else if (itemType === 'lure') {
        if (player.equippedLure === itemKey) return;
        player.equippedLure = itemKey;
    } 
    // --- Complex 2-of-3 Logic ---
    else if (itemType) {
        const isCurrentlyEquipped = 
            (itemType === 'weapon' && player.equippedWeapon === details) ||
            (itemType === 'catalyst' && player.equippedCatalyst === details) ||
            (itemType === 'shield' && player.equippedShield === details);

        if (isCurrentlyEquipped) return;

        // --- Handle Dual Wield Restriction ---
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
        
        // Prevent equipping a shield/catalyst if dual wielding
        if ((itemType === 'shield' || itemType === 'catalyst') && player.equippedWeapon.effect?.dual_wield) {
            addToLog(`You cannot use a ${itemType} while dual wielding.`, 'text-red-400');
            return;
        }


        // Remove from queue if it's already there (for re-equipping)
        const typeIndex = player.equipmentOrder.indexOf(itemType);
        if (typeIndex > -1) {
            player.equipmentOrder.splice(typeIndex, 1);
        }

        // If queue is full, unequip the oldest item
        if (player.equipmentOrder.length >= 2) {
            const typeToUnequip = player.equipmentOrder.shift(); // remove the oldest
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

        // Add new item's type to the queue
        player.equipmentOrder.push(itemType);
        
        // Equip the new item
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

    // Deduct ingredients and gold
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

    // Add product to inventory
    player.addToInventory(recipe.output);
    const productDetails = getItemDetails(recipe.output);
    addToLog(`You successfully crafted a <span class="font-bold text-green-300">${productDetails.name}</span>!`);

    // Update quest progress if applicable
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

    // Deduct ingredients and gold
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

    // Add product to inventory
    player.addToInventory(recipe.output);
    const productDetails = getItemDetails(recipe.output);
    addToLog(`You successfully created a <span class="font-bold text-green-300">${productDetails.name}</span>!`);

    // Update quest progress if applicable
    if (player.activeQuest && player.activeQuest.category === 'creation') {
        const quest = getQuestDetails(player.activeQuest);
        if (quest && quest.target === recipe.output) {
            player.questProgress++;
            addToLog(`Quest progress: ${player.questProgress}/${quest.required}`, 'text-amber-300');
        }
    }

    updateStatsView();
    if (sourceShop === 'magic') {
        renderMagicShopCraft();
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
            } else { // It's equipment
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
    
    // Also add the quest back to the available pool for the day if it was taken and cancelled
    const questIndex = player.questsTakenToday.indexOf(player.activeQuest.key);
    if (questIndex > -1) {
        player.questsTakenToday.splice(questIndex, 1);
    }
    
    player.activeQuest = null;
    player.questProgress = 0;
    
    updateStatsView();
    renderQuestBoard();
}

