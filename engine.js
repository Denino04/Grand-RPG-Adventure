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
        this.specialWeaponStates = {};
        this.equippedWeapon = WEAPONS['rusty_sword'];
        this.equippedArmor = ARMOR['rags'];
        this.equippedShield = SHIELDS['no_shield'];
        this.equippedLure = 'no_lure';
        this.inventory = { 
            items: { 'health_potion': 2 }, 
            weapons: ['rusty_sword'], 
            armor: ['rags'], 
            shields: ['no_shield'], 
            lures: { } 
        };
        this.spells = ['fireball', 'heal'];
        this.activeQuest = null; this.questProgress = 0;
        this.legacyQuestProgress = {};
        this.biomeOrder = [];
        this.biomeUnlockLevels = {};
    }
    addToInventory(itemKey, quantity = 1, verbose = true) {
        const details = getItemDetails(itemKey); if (!details) return;
        if (verbose) addToLog(`You received: <span class="font-bold" style="color: var(--text-accent);">${details.name}</span>!`, 'text-green-400');
        
        const category = itemKey in WEAPONS ? 'weapons' : 
                         (itemKey in ARMOR ? 'armor' : 
                         (itemKey in SHIELDS ? 'shields' : 
                         (itemKey in LURES ? 'lures' : 'items')));

        if (category === 'lures') {
             this.inventory.lures[itemKey] = (this.inventory.lures[itemKey] || 0) + details.uses;
        } else if (category === 'items') { 
            this.inventory.items[itemKey] = (this.inventory.items[itemKey] || 0) + quantity; 
        } else { 
            this.inventory[category].push(itemKey);
        }
    }
    gainXp(amount) { this.xp += amount; addToLog(`You gained <span class="font-bold">${amount}</span> XP!`, 'text-yellow-400'); if (this.xp >= this.xpToNextLevel) this.levelUp(); updateStatsView(); }
    levelUp() { this.level++; this.xp -= this.xpToNextLevel; this.xpToNextLevel = Math.floor(this.xpToNextLevel * 1.5); this.maxHp += 10; this.hp = this.maxHp; this.maxMp += 5; this.mp = this.maxMp; this.strength += 2; this.intelligence += 2; addToLog(`*** LEVEL UP! You are now level ${this.level}! ***`, 'text-yellow-200 font-bold text-lg'); }
    takeDamage(damage, ignoresDefense = false) { 
        if (!ignoresDefense && this.equippedShield && Math.random() < this.equippedShield.blockChance) {
            addToLog(`You blocked the attack with your ${this.equippedShield.name}!`, 'text-cyan-400 font-bold');
            updateStatsView();
            return 0;
        }
        let totalDefense = ignoresDefense ? 0 : this.equippedArmor.defense + (this.equippedShield ? this.equippedShield.defense : 0);
        if(this.statusEffects.stonehide) {
            totalDefense = Math.floor(totalDefense * this.statusEffects.stonehide.multiplier);
            addToLog(`Your stone-like skin absorbs the blow!`, `text-gray-400`);
        }

        if (ignoresDefense) {
             addToLog(`The attack ignores your defense!`, 'text-yellow-500 font-bold');
        }
        const finalDamage = Math.max(0, damage - totalDefense); 
        this.hp -= finalDamage; 
        addToLog(`You take <span class="font-bold text-red-400">${finalDamage}</span> damage.`); 
        updateStatsView();
        return finalDamage;
    }
}

class Enemy extends Entity {
     constructor(speciesData, rarityData, playerLevel) {
        const finalMultiplier = rarityData.multiplier;
        const finalHp = Math.floor((speciesData.base_hp + (playerLevel * 1.5)) * finalMultiplier);
        const finalStrength = Math.floor((speciesData.base_strength + Math.floor(playerLevel / 2)) * finalMultiplier);
        const finalDefense = Math.floor(((speciesData.base_defense || 0) + Math.floor(playerLevel / 3)) * finalMultiplier);

        super(`${rarityData.name} ${speciesData.name}`, finalHp, finalStrength);
        
        const classDamage = MONSTER_CLASS_DAMAGE[speciesData.class];
        const tier = speciesData.tier;
        const rarityIndex = rarityData.rarityIndex;

        let diceCount = (rarityIndex + tier + classDamage.baseDice) - 2;
        this.damage = [Math.max(1, diceCount), classDamage.dieSides];
        
        this.defense = finalDefense;
        this.ability = speciesData.ability;
        this.xpReward = Math.floor(speciesData.base_xp * finalMultiplier * (speciesData.class === 'Monstrosity' ? 1.2 : 1)); 
        this.goldReward = Math.floor(speciesData.base_gold * finalMultiplier * (speciesData.class === 'Monstrosity' ? 1.2 : 1));
        this.lootTable = speciesData.loot_table; 
        this.lootChanceMod = (speciesData.class === 'Beast' ? 1.5 : 1);
        this.potionDropChanceMod = (speciesData.class === 'Humanoid' ? 1.5 : 1);
        this.speciesData = speciesData;
        this.rarityData = rarityData;
        
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
        addToLog(`${this.name} attacks ${target.name}!`); 
        this._performAttack(target);
        if (this.ability === 'double_strike' && Math.random() < 0.33) { addToLog(`${this.name}'s fury lets it attack again!`, 'text-red-500 font-bold'); setTimeout(() => this._performAttack(target), 500); }
    }
    _performAttack(target) {
        const weapon = player.equippedWeapon;
        if (weapon.effect && weapon.effect.type === 'ranged' && Math.random() < weapon.effect.chance) {
            addToLog(`The ${this.name} misses its attack due to your ranged advantage!`, 'text-blue-300');
            return;
        }

        let diceCount = this.damage[0];
        if (this.statusEffects.enrage) {
            diceCount++;
        }
        let totalDamage = rollDice(diceCount, this.damage[1]) + this.strength; 
        
        if (target.statusEffects.swallowed && target.statusEffects.swallowed.swallower === this) {
            totalDamage *= 2;
            addToLog(`${this.name}'s attack is amplified from within!`, 'text-red-600');
        }
        
        let damageDealt = target.takeDamage(totalDamage, !!this.statusEffects.ultra_focus);

        if (this.ability === 'life_drain') { const drainAmount = Math.floor(damageDealt / 2); this.hp = Math.min(this.maxHp, this.hp + drainAmount); addToLog(`${this.name} drains <span class="font-bold text-green-400">${drainAmount}</span> HP!`); }
        if (this.ability === 'earthshaker' && Math.random() < 0.3) {
            if (!target.statusEffects.paralyzed) {
                target.statusEffects.paralyzed = { duration: 1 };
                addToLog(`${this.name}'s mighty blow shakes the earth! You are paralyzed!`, 'text-orange-500 font-bold');
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
        const finalDamage = Math.max(0, Math.floor(damageTaken - currentDefense));
        this.hp -= finalDamage;

        if (gameState.currentView === 'battle') {
            renderBattle();
        }
        return finalDamage;
    }
}


// --- CORE LOGIC FUNCTIONS ---

function generateEnemy(biomeKey) {
    const biomeData = BIOMES[biomeKey];
    const monsterPool = biomeData.monsters;
    const speciesKey = choices(Object.keys(monsterPool), Object.values(monsterPool));
    const speciesData = MONSTER_SPECIES[speciesKey];

    const rarityKeys = Object.keys(MONSTER_RARITY);
    let weights = [60, 25, 10, 4, 1]; // Common, Uncommon, Rare, Epic, Legendary
    if (speciesData.class === 'Monstrosity') {
        weights = [40, 30, 15, 10, 5]; // Higher chance for higher rarity
    }
    const chosenRarityKey = choices(rarityKeys, weights);
    const rarityData = MONSTER_RARITY[chosenRarityKey];

    return new Enemy(speciesData, rarityData, player.level);
}

// --- BATTLE FUNCTIONS ---
function startBattle(biomeKey) { 
    gameState.isPlayerTurn = true; 
    gameState.currentBiome = biomeKey;
    currentEnemies = [];

    let numEnemies = 1;
    if (player.level >= 5) {
        const rand = Math.random();
        if (rand > 0.9) numEnemies = 3;
        else if (rand > 0.6) numEnemies = 2;
    } else {
         if (Math.random() > 0.8) numEnemies = 2;
    }


    for (let i = 0; i < numEnemies; i++) {
        currentEnemies.push(generateEnemy(biomeKey));
    }

    const biome = BIOMES[biomeKey];
    if (biome && biome.theme) {
        applyTheme(biome.theme);
    }
    
    lastViewBeforeInventory = 'battle';
    gameState.currentView = 'battle'; 
    const enemyNames = currentEnemies.map(e => `<span class="font-bold text-red-400">${e.name}</span>`).join(', ');
    addToLog(`You encounter: ${enemyNames} in the ${BIOMES[biomeKey].name}!`); 
    renderBattle(); 
}

function performAttack(targetIndex) {
    const target = currentEnemies[targetIndex];
    if (!target || !target.isAlive()) {
        renderBattle('main'); // Target is dead, go back to main battle screen
        return;
    };
    gameState.isPlayerTurn = false; 
    const weapon = player.equippedWeapon; 
    let damage = rollDice(...weapon.damage) + player.strength; 
    let attackEffects = {};
    let messageLog = [];

    // --- DAMAGE MODIFICATION ---
    if(player.statusEffects.strength) {
        damage = Math.floor(damage * player.statusEffects.strength.multiplier);
        messageLog.push(`Your strength is augmented!`);
    }
    if (weapon.effect?.type === 'crit' && Math.random() < weapon.effect.chance) {
        damage = Math.floor(damage * weapon.effect.multiplier);
        messageLog.push(`CRITICAL HIT!`);
    }
    if (weapon.effect?.bonus_vs_dragon && target.speciesData.name === 'Dragon') {
        damage = Math.floor(damage * weapon.effect.bonus_vs_dragon);
        messageLog.push(`Your weapon glows with power against the dragon!`);
    }

    // --- APPLY ATTACK EFFECTS ---
    if (weapon.effect?.ignore_defense) {
        attackEffects.ignore_defense = weapon.effect.ignore_defense;
    }
    
    // --- DEAL DAMAGE ---
    const finalDamage = target.takeDamage(damage, attackEffects);
    addToLog(`You attack ${target.name} with ${weapon.name}, dealing <span class="font-bold text-yellow-300">${finalDamage}</span> damage. ${messageLog.join(' ')}`);
    
    // --- POST-DAMAGE EFFECTS ---
    if (weapon.effect) {
        if (weapon.effect.type === 'fire_damage') { 
            const fireDamage = rollDice(...weapon.effect.damage); 
            const finalFireDamage = target.takeDamage(fireDamage, {ignore_defense: 1.0});
            addToLog(`The blade burns for an extra <span class="font-bold text-orange-400">${finalFireDamage}</span> fire damage.`); 
        }
        if (weapon.effect.type === 'lightning_damage') { 
            const lightningDamage = rollDice(...weapon.effect.damage); 
            const finalLightningDamage = target.takeDamage(lightningDamage, {ignore_defense: 1.0});
            addToLog(`Lightning arcs from your weapon for an extra <span class="font-bold text-blue-400">${finalLightningDamage}</span> damage.`); 
        }
        if (weapon.effect.type === 'lifesteal') { 
            const healedAmount = Math.floor(finalDamage * weapon.effect.amount); 
            if (healedAmount > 0) { 
                player.hp = Math.min(player.maxHp, player.hp + healedAmount); 
                addToLog(`You drain <span class="font-bold text-green-400">${healedAmount}</span> HP.`); 
                updateStatsView(); 
            } 
        }
        if (weapon.effect.type === 'paralyze' && Math.random() < weapon.effect.chance) {
            target.statusEffects.paralyzed = { duration: weapon.effect.duration };
            addToLog(`${target.name} is paralyzed by the blow!`, 'text-yellow-500');
        }
        if (weapon.effect.petrify_chance && Math.random() < weapon.effect.petrify_chance) {
            target.statusEffects.petrified = { duration: weapon.effect.duration };
            addToLog(`${target.name} is petrified by the attack!`, 'text-gray-400');
        }
    }
    setTimeout(checkBattleStatus, 200);
}

function castSpell(spellKey, targetIndex) {
    const spell = MAGIC[spellKey];
    if (player.mp < spell.cost) {
        addToLog(`Not enough MP to cast ${spell.name}!`, 'text-blue-400');
        return;
    }
    const target = currentEnemies[targetIndex];
    if ((spell.type === 'damage') && (!target || !target.isAlive())) {
        renderBattle('main');
        return;
    }

    gameState.isPlayerTurn = false; 
    player.mp -= spell.cost; 
    updateStatsView();
    
    if (spell.type === 'damage') {
        addToLog(`You cast ${spell.name} on ${target.name}!`, 'text-purple-300');
    } else {
        addToLog(`You cast ${spell.name}!`, 'text-purple-300');
    }

    switch(spell.type) {
        case 'damage': 
            let magicDamage = rollDice(...spell.damage) + player.intelligence; 
            if (player.statusEffects.swallowed) {
                magicDamage = Math.floor(magicDamage / 2);
                addToLog(`Your spell fizzles inside the beast!`, 'text-gray-400');
            }
            const finalDamage = target.takeDamage(magicDamage); 
            addToLog(`It deals <span class="font-bold text-purple-400">${finalDamage}</span> damage.`); 
            break;
        case 'healing': 
            const healAmount = rollDice(...spell.healing) + player.intelligence; 
            player.hp = Math.min(player.maxHp, player.hp + healAmount); 
            addToLog(`You recover <span class="font-bold text-green-400">${healAmount}</span> HP.`); 
            updateStatsView(); 
            break;
    }
    setTimeout(checkBattleStatus, 200);
}

function battleAction(type, actionData = null) {
    if (!player.isAlive()) {
        checkPlayerDeath();
        return;
    }
    if (!gameState.isPlayerTurn) return;

    const aliveEnemies = currentEnemies.filter(e => e.isAlive());

    if ((type === 'attack' || type === 'magic_select') && aliveEnemies.length > 1) {
        if (type === 'attack') {
            renderBattle('attack');
        } else { // magic_select
            const spell = MAGIC[actionData.spellKey];
            if (spell.type === 'damage') {
                renderBattle('magic_target', actionData);
            } else {
                castSpell(actionData.spellKey, 0); // Self-cast or non-targeted
            }
        }
        return;
    }

    $('#battle-actions')?.classList.add('hidden');
    switch (type) {
        case 'attack':
            const targetIndex = currentEnemies.findIndex(e => e.isAlive());
            if (targetIndex !== -1) {
                 performAttack(targetIndex);
            }
            break;
        case 'magic_select': // From single enemy or non-damage spell
             const spell = MAGIC[actionData.spellKey];
             const magicTargetIndex = currentEnemies.findIndex(e => e.isAlive());
             if (spell.type === 'damage' && magicTargetIndex !== -1) {
                castSpell(actionData.spellKey, magicTargetIndex);
             } else {
                castSpell(actionData.spellKey, 0); // Self-cast
             }
             break;
        case 'magic': renderBattle('magic'); break;
        case 'item': renderBattle('item'); break;
        case 'flee':
            gameState.isPlayerTurn = false;
            if (Math.random() > 0.2) { addToLog(`You successfully escaped!`, 'text-green-400'); setTimeout(renderMainMenu, 1500); }
            else { addToLog(`You failed to escape!`, 'text-red-400'); setTimeout(enemyTurn, 400); }
            break;
    }
}

function struggleSwallow() {
    const swallower = player.statusEffects.swallowed.swallower;
    const rarityIndex = Object.keys(MONSTER_RARITY).indexOf(swallower.rarityData.name.toLowerCase());
    const struggleDifficulty = 10 + (rarityIndex * 5); // Base difficulty 10, +5 for each rarity tier
    
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

function checkBattleStatus() {
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
                enemy.hp = Math.floor(enemy.maxHp * 0.5); // Revive with half HP
                enemy.reviveChance /= 2;
                allDefeated = false; // The fight is not over
            } else {
                if (player.statusEffects.swallowed && player.statusEffects.swallowed.swallower === enemy) {
                    delete player.statusEffects.swallowed;
                    addToLog(`You are freed as the ${enemy.name} collapses!`, 'text-green-500');
                }

                addToLog(`You have defeated ${enemy.name}!`, 'text-green-400 font-bold');
                
                if (enemy.rarityData.name === 'Legendary') {
                    const speciesKey = enemy.speciesData.key;
                    if (!player.legacyQuestProgress[speciesKey]) {
                        player.legacyQuestProgress[speciesKey] = true;
                        addToLog(`Legacy Quest Progress: You have slain a legendary ${enemy.speciesData.name}!`, 'text-purple-300 font-bold');
                    }
                }

                player.gainXp(enemy.xpReward); 
                player.gold += enemy.goldReward;
                addToLog(`You found <span class="font-bold">${enemy.goldReward}</span> G.`, 'text-yellow-400');
                for (const item in enemy.lootTable) { 
                    let dropChance = enemy.lootTable[item];
                    if (enemy.rarityData.name === "Legendary") dropChance *= 2; // Double loot chance for legendary
                    if (Math.random() < dropChance) { 
                        player.addToInventory(item); 
                    } 
                }
                
                if (player.activeQuest) { 
                    const quest = QUESTS[player.activeQuest]; 
                    if (quest.type === 'extermination' && quest.target === enemy.speciesData.key) { 
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
        addToLog(`VICTORY! All enemies have been defeated.`, 'text-yellow-200 font-bold text-lg');
        setTimeout(renderMainMenu, 3000);
    } else if (!gameState.isPlayerTurn) {
        setTimeout(enemyTurn, 400);
    }
    updateStatsView();
}

function handleEndOfTurnEffects() {
    // Player effects
    const playerBuffs = ['strength', 'stonehide'];
    for(const buff of playerBuffs) {
        if(player.statusEffects[buff]) {
            player.statusEffects[buff].duration--;
            if (player.statusEffects[buff].duration <= 0) {
                delete player.statusEffects[buff];
                addToLog(`Your ${buff} potion has worn off.`);
            }
        }
    }

    if (player.statusEffects.poison) {
        const poisonDamage = rollDice(...player.statusEffects.poison.damage);
        player.takeDamage(poisonDamage, true); // True ignores defense
        addToLog(`You take <span class="font-bold text-green-600">${poisonDamage}</span> poison damage.`);
        player.statusEffects.poison.duration--;
        if (player.statusEffects.poison.duration <= 0) {
            delete player.statusEffects.poison;
            addToLog("The poison has worn off.");
        }
    }
    if (player.statusEffects.swallowed) {
        addToLog(`You are being digested inside the ${player.statusEffects.swallowed.by}!`, 'text-red-500');
        const digestDamage = rollDice(2, 6);
        player.takeDamage(digestDamage, true);
    }

    // Enemy effects
    currentEnemies.forEach(enemy => {
        if (!enemy.isAlive()) return;
        const enemyBuffs = ['enrage', 'living_shield', 'ultra_focus', 'petrified', 'paralyzed'];
        for(const buff of enemyBuffs) {
            if(enemy.statusEffects[buff]) {
                enemy.statusEffects[buff].duration--;
                if(enemy.statusEffects[buff].duration <= 0) {
                    delete enemy.statusEffects[buff];
                    addToLog(`${enemy.name} is no longer ${buff}.`);
                }
            }
        }
    });

    updateStatsView();
}

function enemyTurn() {
    if (currentEnemies.length === 0 || !player.isAlive()) return;
    
    handleEndOfTurnEffects();
    if (!player.isAlive()) { // Check if player died from effects
        checkPlayerDeath();
        return;
    }

    let turnDelay = 500;
    
    const enemiesActingThisTurn = [...currentEnemies]; // Create a snapshot

    enemiesActingThisTurn.forEach((enemy, i) => {
        setTimeout(() => {
            if (!enemy.isAlive() || !player.isAlive()) return;
            
            if (enemy.statusEffects.petrified || enemy.statusEffects.paralyzed) {
                const status = enemy.statusEffects.petrified ? 'petrified' : 'paralyzed';
                addToLog(`${enemy.name} is ${status} and cannot move!`);
                // Skip this enemy's turn but continue loop
                 if (i === enemiesActingThisTurn.length - 1) endPlayerTurnPhase();
                return; 
            }

            // Ability logic
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
                            player.statusEffects.poison = { duration: 3, damage: [rarityDice * 2, 4] };
                            addToLog(`${enemy.name} ensnares you in a poisonous web!`, 'text-green-600');
                            usedAbility = true;
                        }
                        break;
                    case 'petrification':
                        if (!player.statusEffects.petrified && Math.random() < 0.25) {
                            player.statusEffects.petrified = { duration: 1 };
                             addToLog(`${enemy.name} gazes at you, turning your flesh to stone! You are petrified.`, 'text-gray-400 font-bold');
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
                             renderBattle(); 
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
                            const healAmount = rollDice(rarityDice * 3, 8);
                            addToLog(`${enemy.name} radiates a soothing light!`, 'text-green-400');
                            currentEnemies.forEach(ally => {
                                if (ally.isAlive()) {
                                    ally.hp = Math.min(ally.maxHp, ally.hp + healAmount);
                                    addToLog(`${ally.name} is healed for <span class="font-bold text-green-400">${healAmount}</span> HP.`, 'text-green-300');
                                }
                            });
                            renderBattle();
                            usedAbility = true;
                        }
                        break;
                    case 'true_poison':
                         if (!player.statusEffects.poison && Math.random() < 0.6) {
                            const rarityDice = Object.keys(MONSTER_RARITY).indexOf(enemy.rarityData.name.toLowerCase()) + 1;
                            player.statusEffects.poison = { duration: 3, damage: [rarityDice * 3, 8] }; // Stronger poison
                            addToLog(`${enemy.name} spews a vile, corrosive poison at you!`, 'text-green-700 font-bold');
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
                            player.statusEffects.swallowed = { by: enemy.name, swallower: enemy, duration: Infinity };
                            addToLog(`${enemy.name} opens its massive maw and swallows you whole!`, 'text-red-700 font-bold');
                            usedAbility = true;
                            renderBattle();
                        }
                        break;
                    case 'scorch_earth':
                        if (Math.random() < 0.4) {
                            addToLog(`${enemy.name} unleashes a torrent of flame!`, 'text-orange-600 font-bold');
                            const rarityDice = Object.keys(MONSTER_RARITY).indexOf(enemy.rarityData.name.toLowerCase()) + 1;
                            const fireDamage = rollDice(rarityDice * 4, 8) + enemy.strength;
                            player.takeDamage(fireDamage, true);
                            usedAbility = true;
                        }
                        break;
                }
            }

            if (!usedAbility) {
                enemy.attack(player);
            }
            
            checkPlayerDeath();

            if (i === enemiesActingThisTurn.length - 1) {
                 setTimeout(() => endPlayerTurnPhase(), turnDelay);
            }

        }, i * turnDelay);
    });
}

function endPlayerTurnPhase() {
    if (!player.isAlive()) {
        checkPlayerDeath();
        return;
    }
    if (player.statusEffects.petrified) {
        addToLog("You are petrified and cannot move!", 'text-gray-400');
        player.statusEffects.petrified.duration--;
        if (player.statusEffects.petrified.duration <= 0) {
            delete player.statusEffects.petrified;
                addToLog("You can move again.");
        }
        enemyTurn();
    } else if (player.statusEffects.paralyzed) {
            addToLog("You are paralyzed and cannot move!", 'text-orange-400');
        player.statusEffects.paralyzed.duration--;
        if (player.statusEffects.paralyzed.duration <= 0) {
            delete player.statusEffects.paralyzed;
                addToLog("You can move again.");
        }
        enemyTurn();
    } else {
        renderBattle();
        $('#battle-actions')?.classList.remove('hidden'); 
        gameState.isPlayerTurn = true;
    }
}

function checkPlayerDeath() {
    if (!player.isAlive() && !gameState.playerIsDying) {
        gameState.playerIsDying = true;

        const weapon = player.equippedWeapon;
        if(weapon.effect?.revive && !player.specialWeaponStates.void_greatsword_revive_used) {
            player.hp = Math.floor(player.maxHp * 0.5);
            player.specialWeaponStates.void_greatsword_revive_used = true;
            addToLog('The Void Greatsword flashes with dark energy, pulling your soul back from the brink!', 'text-purple-400 font-bold');
            updateStatsView();
            gameState.playerIsDying = false; 
            return;
        }
        
        const template = document.getElementById('template-death');
        render(template.content.cloneNode(true));
        const killer = currentEnemies.length > 0 ? currentEnemies[0].name : 'the wilderness';
        addToLog(`You were defeated by ${killer}...`, 'text-red-600 font-bold'); 
        
        addToGraveyard(player, killer);

        addToLog('Your save file has been deleted.', 'text-gray-500');
        const saveKeys = JSON.parse(localStorage.getItem('rpgSaveKeys') || '[]');
        const keyIndex = saveKeys.indexOf(player.saveKey);
        if (keyIndex > -1) {
            saveKeys.splice(keyIndex, 1);
        }
        localStorage.setItem('rpgSaveKeys', JSON.stringify(saveKeys));
        localStorage.removeItem(`rpgSaveData_${player.saveKey}`);

        setTimeout(() => { 
            $('#game-container').classList.add('hidden'); 
            $('#start-screen').classList.remove('hidden'); 
            $('#player-name-input').value = ''; 
            logElement.innerHTML = ''; 
            updateLoadGameButtonVisibility();
        }, 3000);
    }
}

function addToGraveyard(deadPlayer, killer) {
    let graveyard = JSON.parse(localStorage.getItem('rpgGraveyard') || '[]');
    graveyard.unshift({
        name: deadPlayer.name,
        level: deadPlayer.level,
        cause: `Slain by ${killer}`,
        date: new Date().toLocaleString()
    });
    if (graveyard.length > 10) {
        graveyard = graveyard.slice(0, 10);
    }
    localStorage.setItem('rpgGraveyard', JSON.stringify(graveyard));
}


// --- PLAYER ACTIONS ---

function restAtInn(cost) { 
    player.gold -= cost; 
    addToLog(`You pay <span class="font-bold">${cost} G</span> for a room.`, 'text-yellow-400'); 
    if (Math.random() < 0.1) { 
        addToLog(`You are ambushed in your sleep!`, 'text-red-500 font-bold'); 
        setTimeout(() => startBattle(gameState.currentBiome || player.biomeOrder[0]), 2000); 
    } else { 
        player.hp = player.maxHp; 
        player.mp = player.maxMp; 
        addToLog(`You wake up feeling refreshed.`, 'text-green-400 font-bold'); 
        updateStatsView(); 
        setTimeout(renderTown, 2000); 
    } 
}

function learnSpell(spellKey) { 
    const details = MAGIC[spellKey]; 
    if (player.gold >= details.price) { 
        player.gold -= details.price; 
        player.spells.push(spellKey); 
        addToLog(`You have learned the spell: <span class="font-bold text-purple-300">${details.name}</span>!`, 'text-green-400'); 
        updateStatsView(); 
        renderMagicShop(); 
    } 
}

function buyItem(itemKey, shopType) { 
    const details = getItemDetails(itemKey); 
    if (player.gold >= details.price) { 
        player.gold -= details.price; 
        player.addToInventory(itemKey, 1, false); 
        addToLog(`You bought a ${details.name} for ${details.price} G.`, 'text-yellow-400'); 
        updateStatsView(); 
        renderShop(shopType); 
    } 
}

function useItem(itemKey, inBattle = false) {
    if (!player.inventory.items[itemKey] || player.inventory.items[itemKey] < 1) {
        addToLog("You don't have that item!", 'text-red-400');
        if (inBattle) renderBattle('item');
        else renderInventory();
        return false;
    }
    const details = ITEMS[itemKey];
    
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

    player.inventory.items[itemKey]--;
    addToLog(`You used a <span class="font-bold text-green-300">${details.name}</span>.`);
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
    if (itemKey in WEAPONS) player.equippedWeapon = WEAPONS[itemKey]; 
    if (itemKey in ARMOR) player.equippedArmor = ARMOR[itemKey]; 
    if (itemKey in SHIELDS) player.equippedShield = SHIELDS[itemKey]; 
    if (itemKey in LURES) player.equippedLure = itemKey;
    addToLog(`You equipped the <span class="font-bold text-cyan-300">${getItemDetails(itemKey).name}</span>.`); 
    updateStatsView(); 
    renderInventory(); 
}

function brewPotion(recipeKey) {
    const recipe = ALCHEMY_RECIPES[recipeKey];
    if (!recipe) return;

    let hasIngredients = true;
    for (const ingredientKey in recipe.ingredients) {
        if ((player.inventory.items[ingredientKey] || 0) < recipe.ingredients[ingredientKey]) {
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
        player.inventory.items[ingredientKey] -= recipe.ingredients[ingredientKey];
        if (player.inventory.items[ingredientKey] <= 0) {
            delete player.inventory.items[ingredientKey];
        }
    }
    player.gold -= recipe.cost;

    // Add product to inventory
    player.addToInventory(recipe.output);
    const productDetails = getItemDetails(recipe.output);
    addToLog(`You successfully brewed a <span class="font-bold text-green-300">${productDetails.name}</span>!`);

    updateStatsView();
    renderAlchemist();
}

// --- QUESTS ---
function acceptQuest(questKey) { 
    if (!player.activeQuest) { 
        player.activeQuest = questKey; 
        player.questProgress = 0; 
        addToLog(`New quest accepted: <span class="font-bold" style="color: var(--text-accent);">${QUESTS[questKey].title}</span>!`); 
        updateStatsView(); 
        renderQuestBoard(); 
    } else { 
        addToLog(`You already have an active quest!`); 
    } 
}
function completeQuest() {
    if (!player.activeQuest) return; const quest = QUESTS[player.activeQuest];
    if (quest.type === 'fetch') { player.inventory.items[quest.target] -= quest.required; if (player.inventory.items[quest.target] <= 0) { delete player.inventory.items[quest.target]; } }
    addToLog(`Quest Complete: <span class="font-bold text-green-400">${quest.title}</span>!`);
    player.gainXp(quest.reward.xp); player.gold += quest.reward.gold; addToLog(`You received ${quest.reward.gold} G.`, 'text-yellow-400');
    player.activeQuest = null; player.questProgress = 0; updateStatsView(); renderQuestBoard();
}

function cancelQuest() {
    if (!player.activeQuest) return;
    const penalty = 15 * player.level;

    if (player.gold < penalty) {
        addToLog(`You cannot afford the ${penalty} G fee to cancel the quest.`, 'text-red-400');
        return;
    }

    const quest = QUESTS[player.activeQuest];
    player.gold -= penalty;
    addToLog(`You paid a ${penalty} G fee and abandoned the quest: <span class="font-bold text-yellow-300">${quest.title}</span>.`, 'text-red-400');
    
    player.activeQuest = null;
    player.questProgress = 0;
    
    updateStatsView();
    renderQuestBoard();
}
