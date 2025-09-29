// --- BATTLE FUNCTIONS ---
function startBattle(biomeKey) { 
    gameState.isPlayerTurn = true; 
    gameState.battleEnded = false;
    gameState.currentBiome = biomeKey;
    $('#inventory-btn').disabled = true;
    currentEnemies = [];
    player.clearBattleBuffs(); // Clear buffs from previous battle

    let numEnemies = 1;
    if (player.level >= 50) {
        const rand = Math.random();
        if (rand > 0.9) numEnemies = 5;       // 10% for 5
        else if (rand > 0.7) numEnemies = 4;  // 20% for 4
        else if (rand > 0.4) numEnemies = 3;  // 30% for 3
        else if (rand > 0.1) numEnemies = 2;  // 30% for 2
        // 10% for 1
    } else if (player.level >= 40) {
        const rand = Math.random();
        if (rand > 0.8) numEnemies = 4;      // 20% for 4
        else if (rand > 0.5) numEnemies = 3; // 30% for 3
        else if (rand > 0.2) numEnemies = 2; // 30% for 2
        // 20% for 1
    } else if (player.level >= 6) {
        const rand = Math.random();
        if (rand > 0.8) { // 20% chance for 3 enemies
            numEnemies = 3;
        } else if (rand > 0.5) { // 30% chance for 2 enemies
            numEnemies = 2;
        }
        // 50% chance for 1 enemy
    } else if (player.level >= 4) { // Levels 4 and 5
        if (Math.random() < 0.3) { // 30% chance for 2 enemies
            numEnemies = 2;
        }
        // 70% chance for 1 enemy
    }
    // For levels 1, 2, and 3, numEnemies will remain 1.

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

function performSpellFollowUpAttack(target) {
    if (!target || !target.isAlive()) {
        // If the original target is dead, find a new living target
        const livingEnemies = currentEnemies.filter(e => e.isAlive());
        if (livingEnemies.length > 0) {
            target = livingEnemies[0];
        } else {
            return; // No one left to attack
        }
    }
    
    const weapon = player.equippedWeapon;
    addToLog(`Your ${weapon.name} resonates with the spell, lashing out with a follow-up strike!`, 'text-yellow-300');
    
    // Use a simplified attack logic for the follow-up
    let damage = rollDice(...weapon.damage, 'Spell Follow-up Attack') + Math.floor(player.intelligence / 2); // Scales with INT
    const finalDamage = target.takeDamage(damage, { element: player.weaponElement });
    addToLog(`The follow-up attack hits ${target.name} for <span class="font-bold text-yellow-300">${finalDamage}</span> damage.`);
    
    // Check battle status again after the follow-up
    setTimeout(() => checkBattleStatus(true), 200);
}

function performShieldFollowUpAttack(target) {
     if (!target || !target.isAlive()) return;
     const shield = player.equippedShield;
     if (!shield.effect?.attack_follow_up) return;

     addToLog(`Your ${shield.name} retaliates!`, 'text-orange-400');
     const effect = shield.effect.attack_follow_up;
     const damage = rollDice(...effect.damage, 'Shield Follow-up');
     const finalDamage = target.takeDamage(damage, { element: player.shieldElement });
     addToLog(`It strikes ${target.name} for <span class="font-bold text-orange-400">${finalDamage}</span> damage.`);

     if (effect.paralyze_chance && Math.random() < effect.paralyze_chance) {
         target.statusEffects.paralyzed = { duration: effect.duration + 1 };
         addToLog(`${target.name} is paralyzed by the blow!`, 'text-yellow-500');
     }
}


function performAttack(targetIndex) {
    const weapon = player.equippedWeapon; 

    const target = currentEnemies[targetIndex];
    if (!target || !target.isAlive()) {
        renderBattle('main'); // Target is dead, go back to main battle screen
        return;
    };
    gameState.isPlayerTurn = false; 

    const performSingleAttack = (attackTarget, isSecondStrike = false) => {
        let damage = rollDice(...weapon.damage, `Player Weapon Attack ${isSecondStrike ? '2' : '1'}`) + player.strength; 
        let attackEffects = { element: player.weaponElement };
        let messageLog = [];

        if (player.statusEffects.drenched) {
            damage = Math.floor(damage * player.statusEffects.drenched.multiplier);
            messageLog.push(`Your attack is weakened!`);
        }

        // --- STRENGTH MODIFICATION FROM BUFFS ---
        if(player.statusEffects.buff_strength) {
            damage = Math.floor(damage * player.statusEffects.buff_strength.multiplier);
            if (!isSecondStrike) messageLog.push(`Your strength is augmented!`);
        }
        if (player.statusEffects.buff_chaos_strength) {
             damage = Math.floor(damage * player.statusEffects.buff_chaos_strength.strMultiplier);
             if (!isSecondStrike) messageLog.push(`Your chaotic power surges!`);
        }
        if (player.statusEffects.buff_titan) {
            damage = Math.floor(damage * player.statusEffects.buff_titan.strMultiplier);
            if (!isSecondStrike) messageLog.push(`You strike with titanic force!`);
        }

        // --- CRIT CHANCE ---
        let critChance = 0;
        if (weapon.effect?.type === 'crit') {
            critChance = weapon.effect.chance;
        }
        if (player.statusEffects.buff_shroud || player.statusEffects.buff_voidwalker) {
            critChance *= 1.5;
        }


        // --- DAMAGE MODIFICATION ---
        if (player.weaponElement === 'fire') {
            const fireMultiplier = 1 + Math.random() * 0.2;
            damage = Math.floor(damage * fireMultiplier);
        }
        if (Math.random() < critChance) {
            let critMultiplier = weapon.effect?.multiplier || 1.5; // Default crit multi
            if (player.statusEffects.buff_voidwalker) {
                critMultiplier += 0.5; // Bonus crit damage
            }
            damage = Math.floor(damage * critMultiplier);
            messageLog.push(`CRITICAL HIT!`);
        }
        if (weapon.effect?.bonus_vs_dragon && attackTarget.speciesData.name === 'Dragon') {
            damage = Math.floor(damage * weapon.effect.bonus_vs_dragon);
            if (!isSecondStrike) messageLog.push(`Your weapon glows with power against the dragon!`);
        }

        // --- APPLY ATTACK EFFECTS ---
        if (weapon.effect?.ignore_defense) {
            attackEffects.ignore_defense = weapon.effect.ignore_defense;
        }
        
        // --- DEAL DAMAGE ---
        const finalDamage = attackTarget.takeDamage(damage, attackEffects);
        let damageType = '';
        if (player.weaponElement && player.weaponElement !== 'none') {
            damageType = ` ${ELEMENTS[player.weaponElement].name}`;
        }
        addToLog(`You attack ${attackTarget.name} with ${weapon.name}, dealing <span class="font-bold text-yellow-300">${finalDamage}</span>${damageType} damage. ${messageLog.join(' ')}`);
        
        const weaponRarityName = weapon.rarity || 'Common';
        const rarityIndex = (Object.values(MONSTER_RARITY).findIndex(r => r.name === weaponRarityName) + 1) || 1;

        if (finalDamage > 0 && !isSecondStrike) {
             if (player.weaponElement === 'water') {
                addToLog(`The water from your attack drenches ${attackTarget.name}!`, 'text-blue-400');
                attackTarget.statusEffects.drenched = { duration: 2, multiplier: 0.9 };
            }
            if (player.weaponElement === 'earth' && Math.random() < (rarityIndex * 0.05)) {
                if (!attackTarget.statusEffects.paralyzed) {
                    attackTarget.statusEffects.paralyzed = { duration: 2 }; // Duration is 2 so it lasts for their next turn
                    addToLog(`${attackTarget.name} is paralyzed by the force of the earth!`, 'text-yellow-500');
                }
            }
            if (player.weaponElement === 'nature') {
                const lifestealAmount = Math.floor(finalDamage * (rarityIndex * 0.05));
                if (lifestealAmount > 0) {
                    player.hp = Math.min(player.maxHp, player.hp + lifestealAmount);
                    addToLog(`You drain <span class="font-bold text-green-400">${lifestealAmount}</span> HP.`, 'text-green-300');
                    updateStatsView();
                }
            }
            if (player.weaponElement === 'light' && Math.random() < (rarityIndex * 0.05)) {
                const debuffs = Object.keys(player.statusEffects).filter(key => ['poison', 'paralyzed', 'petrified', 'drenched'].includes(key));
                if (debuffs.length > 0) {
                    const effectToCleanse = debuffs[0];
                    delete player.statusEffects[effectToCleanse];
                    addToLog(`Your weapon's light energy cleanses you of ${effectToCleanse}!`, 'text-yellow-200');
                }
            }
            if (player.weaponElement === 'lightning' && Math.random() < (rarityIndex * 0.05)) {
                const otherTargets = currentEnemies.filter(e => e.isAlive() && e !== attackTarget);
                if (otherTargets.length > 0) {
                    const chainTarget = otherTargets[Math.floor(Math.random() * otherTargets.length)];
                    const chainDamage = Math.floor(finalDamage / 2);
                    const finalChainDamage = chainTarget.takeDamage(chainDamage, attackEffects);
                    addToLog(`Lightning chains from your attack, hitting ${chainTarget.name} for <span class="font-bold text-blue-300">${finalChainDamage}</span> damage!`, 'text-blue-400');
                }
            }
        }

        // --- POST-DAMAGE EFFECTS ---
        if (weapon.effect) {
            if (weapon.effect.type === 'fire_damage') { 
                const fireDamage = rollDice(...weapon.effect.damage, 'Fire Damage'); 
                const finalFireDamage = target.takeDamage(fireDamage, {ignore_defense: 1.0, isMagic: true, element: 'fire'});
                addToLog(`The blade burns for an extra <span class="font-bold text-orange-400">${finalFireDamage}</span> fire damage.`); 
            }
            if (weapon.effect.type === 'lightning_damage') { 
                const lightningDamage = rollDice(...weapon.effect.damage, 'Lightning Damage'); 
                const finalLightningDamage = target.takeDamage(lightningDamage, {ignore_defense: 1.0, isMagic: true, element: 'lightning'});
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
                    attackTarget.statusEffects.paralyzed = { duration: weapon.effect.duration + 1 };
                    addToLog(`${attackTarget.name} is paralyzed by the blow!`, 'text-yellow-500');
                }
                if (weapon.effect.petrify_chance && Math.random() < weapon.effect.petrify_chance) {
                    attackTarget.statusEffects.petrified = { duration: weapon.effect.duration + 1 };
                    addToLog(`${attackTarget.name} is petrified by the attack!`, 'text-gray-400');
                }
            }

        // --- CHAIN LIGHTNING LOGIC from Buffs ---
        if (player.statusEffects.buff_ion_self || player.statusEffects.buff_ion_other) {
            let potentialTargets = currentEnemies.filter(e => e.isAlive() && e !== attackTarget);
            let canHitPlayer = !!player.statusEffects.buff_ion_self;
            let hitsPlayer = false;

            if (canHitPlayer && potentialTargets.length > 0) {
                 if (Math.random() < 0.2) { // 20% chance to hit player if other enemies exist
                    hitsPlayer = true;
                 }
            } else if (canHitPlayer) { // Only player is a valid target
                hitsPlayer = true;
            }
            
            if (potentialTargets.length > 0 || hitsPlayer) {
                addToLog("Unstable ions arc from your attack!", "text-blue-300");
                let chainTarget;
                if(hitsPlayer) {
                    chainTarget = player;
                } else {
                    chainTarget = potentialTargets[Math.floor(Math.random() * potentialTargets.length)];
                }
                
                const chainDamage = Math.floor(finalDamage / 2);

                if (chainTarget instanceof Player) {
                    player.takeDamage(chainDamage, true); // True damage to player
                    addToLog(`The lightning chains back, shocking you for <span class="font-bold text-red-400">${chainDamage}</span> damage!`);
                } else {
                    const finalChainDamage = chainTarget.takeDamage(chainDamage, attackEffects);
                    addToLog(`It chains to ${chainTarget.name} for <span class="font-bold text-blue-400">${finalChainDamage}</span> damage!`);
                }
            }
        }
    };
    
    performSingleAttack(target);
    
    // Chain the next actions
    setTimeout(() => {
        if (player.equippedShield.effect?.attack_follow_up) {
            performShieldFollowUpAttack(target);
        }

        const weaponRarityName = weapon.rarity || 'Common';
        const rarityIndex = (Object.values(MONSTER_RARITY).findIndex(r => r.name === weaponRarityName) + 1) || 1;

        if (player.weaponElement === 'wind' && target.isAlive() && Math.random() < (rarityIndex * 0.05)) {
            setTimeout(() => {
                addToLog(`The swirling winds grant you another strike!`, 'text-gray-300');
                performSingleAttack(target, true); // Call again, but mark as second strike
                 setTimeout(checkBattleStatus, 200);
            }, 300);
        } else if (weapon.effect?.double_strike && target.isAlive()) {
             setTimeout(() => {
                addToLog("You strike again!", "text-yellow-300");
                performSingleAttack(target, true);
                setTimeout(checkBattleStatus, 200);
            }, 300);
        } else {
            setTimeout(checkBattleStatus, 200);
        }
    }, 300);
}


function castSpell(spellKey, targetIndex) {
    const spellData = SPELLS[spellKey];
    if (!spellData) return;

    const playerSpell = player.spells[spellKey];
    if (!playerSpell) {
        addToLog(`You do not know this spell.`, 'text-red-400');
        return;
    }

    const tierIndex = playerSpell.tier - 1;
    const spell = spellData.tiers[tierIndex];

    const catalyst = player.equippedCatalyst;
    const armor = player.equippedArmor;
    let spellCost = spell.cost;

    if (catalyst.name === 'None') {
        addToLog(`You need to equip a catalyst to cast spells!`, 'text-blue-400');
        renderBattle();
        return;
    }

    if (catalyst.effect?.mana_discount) {
        spellCost = Math.max(1, spellCost - catalyst.effect.mana_discount);
    }
    if (armor.effect?.mana_discount) {
        spellCost = Math.max(1, spellCost - armor.effect.mana_discount);
    }
    
    if (player.mp < spellCost) {
        addToLog(`Not enough MP to cast ${spell.name}!`, 'text-blue-400');
        return;
    }
    
    const target = currentEnemies[targetIndex];
    if ((spellData.type === 'st' || spellData.type === 'aoe') && (!target || !target.isAlive())) {
        renderBattle('main');
        return;
    }

    gameState.isPlayerTurn = false; 
    player.mp -= spellCost; 
    updateStatsView();
    
    if (spellData.type !== 'support' && spellData.element !== 'healing') {
        addToLog(`You cast ${spell.name} on ${target.name}!`, 'text-purple-300');
    } else {
        addToLog(`You cast ${spell.name}!`, 'text-purple-300');
    }

    let messageLog = [];

    // --- SPELL LOGIC ---
    if (spellData.type === 'st' || spellData.type === 'aoe' || spellData.element === 'healing') {
        let diceCount = spell.damage[0];
        const spellAmp = catalyst.effect?.spell_amp || 0;
        diceCount = Math.min(spell.cap, diceCount + spellAmp);

        let magicDamage = rollDice(diceCount, spell.damage[1], `Player Spell: ${spell.name}`) + player.intelligence;

        if (catalyst.effect?.spell_crit_chance && Math.random() < catalyst.effect.spell_crit_chance) {
            magicDamage = Math.floor(magicDamage * (catalyst.effect.spell_crit_multiplier || 1.5));
            messageLog.push('SPELL CRITICAL!');
        }
        
        if (spellData.element === 'healing') {
            player.hp = Math.min(player.maxHp, player.hp + magicDamage);
            addToLog(`You recover <span class="font-bold text-green-400">${magicDamage}</span> HP.`, 'text-green-300');
        } else {
            // Apply elemental damage fluctuation for Fire spells
            if (spellData.element === 'fire') {
                const fireMultiplier = 1 + Math.random() * 0.2;
                magicDamage = Math.floor(magicDamage * fireMultiplier);
            }

            // Main target damage
            const finalDamage = target.takeDamage(magicDamage, { isMagic: true, element: spellData.element });
            addToLog(`It deals <span class="font-bold text-purple-400">${finalDamage}</span> damage. ${messageLog.join(' ')}`);

            // Apply secondary elemental effects after main damage
            if (finalDamage > 0) {
                 if (spellData.element === 'water') {
                    addToLog(`The water from your spell drenches ${target.name}!`, 'text-blue-400');
                    target.statusEffects.drenched = { duration: 2, multiplier: 0.9 };
                }
                if (spellData.element === 'earth' && Math.random() < 0.2) { // 20% chance for paralysis
                    if (!target.statusEffects.paralyzed) {
                        target.statusEffects.paralyzed = { duration: 2 };
                        addToLog(`${target.name} is paralyzed by the force of the earth!`, 'text-yellow-500');
                    }
                }
                 if (spellData.element === 'nature') {
                    const lifestealAmount = Math.floor(finalDamage * 0.1); // 10% lifesteal
                    if (lifestealAmount > 0) {
                        player.hp = Math.min(player.maxHp, player.hp + lifestealAmount);
                        addToLog(`You drain <span class="font-bold text-green-400">${lifestealAmount}</span> HP.`, 'text-green-300');
                        updateStatsView();
                    }
                }
                 if (spellData.element === 'light' && Math.random() < 0.2) { // 20% chance to cleanse
                    const debuffs = Object.keys(player.statusEffects).filter(key => ['poison', 'paralyzed', 'petrified', 'drenched'].includes(key));
                    if (debuffs.length > 0) {
                        const effectToCleanse = debuffs[0];
                        delete player.statusEffects[effectToCleanse];
                        addToLog(`Your spell's light energy cleanses you of ${effectToCleanse}!`, 'text-yellow-200');
                    }
                }
            }

            // AoE splash damage
            if (spellData.type === 'aoe') {
                const splashDamage = Math.floor(magicDamage * spell.splash);
                currentEnemies.forEach(enemy => {
                    if (enemy !== target && enemy.isAlive()) {
                        const finalSplashDamage = enemy.takeDamage(splashDamage, { isMagic: true, element: spellData.element });
                        addToLog(`${enemy.name} is hit by the splash for <span class="font-bold text-purple-300">${finalSplashDamage}</span> damage!`);
                    }
                });
            }
             // Chain Lightning for lightning spells
            if (spellData.element === 'lightning' && finalDamage > 0) {
                const otherTargets = currentEnemies.filter(e => e.isAlive() && e !== target);
                if (otherTargets.length > 0) {
                    const chainTarget = otherTargets[Math.floor(Math.random() * otherTargets.length)];
                    const chainDamage = Math.floor(finalDamage / 2);
                    const finalChainDamage = chainTarget.takeDamage(chainDamage, { isMagic: true, element: 'lightning' });
                    addToLog(`Lightning chains from your spell, hitting ${chainTarget.name} for <span class="font-bold text-blue-300">${finalChainDamage}</span> damage!`, 'text-blue-400');
                }
            }
        }
    } else if (spellData.type === 'support') {
        const effect = spell.effect;
        if (effect) {
             // For effects that have an immediate, one-time action
            if (effect.cleanse) {
                const badEffects = ['poison', 'petrified', 'paralyzed', 'swallowed'];
                let cleansed = false;
                for (const effectKey of badEffects) {
                    if (player.statusEffects[effectKey]) {
                        delete player.statusEffects[effectKey];
                        cleansed = true;
                    }
                }
                if (cleansed) {
                    addToLog('You are cleansed of negative effects!', 'text-cyan-300');
                }
            }

            // For debuffs that target enemies
            if (effect.type.startsWith('debuff_')) {
                currentEnemies.forEach(enemy => {
                    if (enemy.isAlive()) {
                        enemy.statusEffects[effect.type] = { ...effect };
                    }
                });
            } else {
                // Apply the status effect object to the player
                 player.statusEffects[effect.type] = { ...effect };
            }
           
            addToLog(spell.description, 'text-yellow-300');
        }
    }

    // Check for spell follow-up attack
    if (player.equippedWeapon.effect?.spell_follow_up) {
        setTimeout(() => performSpellFollowUpAttack(target), 200);
    } else {
        setTimeout(checkBattleStatus, 200);
    }
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
            const spellData = SPELLS[actionData.spellKey];
            if (spellData.type === 'st' || spellData.type === 'aoe') {
                renderBattle('magic_target', actionData);
            } else { // Support or Healing
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
             const spellData = SPELLS[actionData.spellKey];
             const magicTargetIndex = currentEnemies.findIndex(e => e.isAlive());
             if ((spellData.type === 'st' || spellData.type === 'aoe') && magicTargetIndex !== -1) {
                castSpell(actionData.spellKey, magicTargetIndex);
             } else {
                castSpell(actionData.spellKey, 0); // Self-cast
             }
             break;
        case 'magic': renderBattle('magic'); break;
        case 'item': renderBattle('item'); break;
        case 'item_select': // New case for selecting a target for an item
            const item = ITEMS[actionData.itemKey];
            const itemTargetIndex = currentEnemies.findIndex(e => e.isAlive());
            if (aliveEnemies.length > 1) {
                 renderBattle('item_target', actionData);
            } else if (itemTargetIndex !== -1) {
                useItem(actionData.itemKey, true, itemTargetIndex);
            }
            break;
        case 'flee':
            gameState.isPlayerTurn = false;
            if (player.statusEffects.buff_voidwalker || Math.random() > 0.2) {
                if (player.statusEffects.buff_voidwalker) {
                    addToLog('You slip through the shadows, guaranteeing your escape!', 'text-purple-400');
                }
                addToLog(`You successfully escaped!`, 'text-green-400');
                setTimeout(renderMainMenu, 1500);
            } else {
                addToLog(`You failed to escape!`, 'text-red-400');
                setTimeout(enemyTurn, 400);
            }
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

function checkBattleStatus(isReaction = false) {
    if (gameState.battleEnded) return;
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
                if (player.statusEffects.swallowed && player.statusEffects.swallower === enemy) {
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
                
                if (player.activeQuest && player.activeQuest.category === 'extermination') { 
                    const quest = getQuestDetails(player.activeQuest); 
                    if (quest && quest.target === enemy.speciesData.key) { 
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
        gameState.battleEnded = true;
        addToLog(`VICTORY! All enemies have been defeated.`, 'text-yellow-200 font-bold text-lg');
        setTimeout(renderPostBattleMenu, 1500);
    } else if (!gameState.isPlayerTurn && !isReaction) {
        setTimeout(enemyTurn, 400);
    }
    updateStatsView();
}
function handlePlayerEndOfTurn() {
    const catalyst = player.equippedCatalyst;
    const armor = player.equippedArmor;
    const shield = player.equippedShield;

    if (catalyst.effect?.hp_regen) {
        const regen = catalyst.effect.hp_regen;
        player.hp = Math.min(player.maxHp, player.hp + regen);
        addToLog(`Your ${catalyst.name} regenerates <span class="font-bold text-green-400">${regen}</span> HP.`, 'text-green-300');
    }
    if (shield.effect?.hp_regen) {
        const regen = shield.effect.hp_regen;
        player.hp = Math.min(player.maxHp, player.hp + regen);
        addToLog(`Your ${shield.name} regenerates <span class="font-bold text-green-400">${regen}</span> HP.`, 'text-green-300');
    }
    if (catalyst.effect?.mana_regen) {
        const regen = catalyst.effect.mana_regen;
        player.mp = Math.min(player.maxMp, player.mp + regen);
        addToLog(`Your ${catalyst.name} restores <span class="font-bold text-blue-400">${regen}</span> MP.`, 'text-blue-300');
    }
     if (armor.effect?.mana_regen) {
        const regen = armor.effect.mana_regen;
        player.mp = Math.min(player.maxMp, player.mp + regen);
        addToLog(`Your ${armor.name} restores <span class="font-bold text-blue-400">${regen}</span> MP.`, 'text-blue-300');
    }

    const effects = player.statusEffects;

    // Handle heal-over-time effects
    if (effects.buff_ingrain) {
        const healEffect = effects.buff_ingrain;
        const healAmount = rollDice(healEffect.healing[0], healEffect.healing[1], 'Ingrain Heal');
        player.hp = Math.min(player.maxHp, player.hp + healAmount);
        addToLog(`Your roots draw <span class="font-bold text-green-400">${healAmount}</span> HP from the earth.`, 'text-green-300');
    }
    if (effects.buff_mother_nature) {
        const healEffect = effects.buff_mother_nature;
        const hpHeal = rollDice(healEffect.healing[0], healEffect.healing[1], 'Mother Nature HP Heal');
        const mpHeal = rollDice(healEffect.healing[0], healEffect.healing[1], 'Mother Nature MP Heal');
        player.hp = Math.min(player.maxHp, player.hp + hpHeal);
        player.mp = Math.min(player.maxMp, player.mp + mpHeal);
        addToLog(`Nature's blessing restores <span class="font-bold text-green-400">${hpHeal}</span> HP and <span class="font-bold text-blue-400">${mpHeal}</span> MP.`, 'text-teal-300');
    }


    for (const effectKey in effects) {
        if (effects[effectKey].duration) {
            effects[effectKey].duration--;
            if (effects[effectKey].duration <= 0) {
                delete effects[effectKey];
                addToLog(`Your ${effectKey.replace('buff_', '').replace('_', ' ')} has worn off.`);
            }
        }
    }
    if (effects.poison) {
        const poisonDamage = rollDice(...effects.poison.damage, 'Poison Damage');
        player.takeDamage(poisonDamage, true);
        addToLog(`You take <span class="font-bold text-green-600">${poisonDamage}</span> poison damage.`);
    }
    if (effects.swallowed) {
        addToLog(`You are being digested inside the ${effects.swallowed.by}!`, 'text-red-500');
        const digestDamage = rollDice(2, 6, 'Digestion Damage');
        player.takeDamage(digestDamage, true, effects.swallowed.swallower);
    }
    updateStatsView();
}
function handleEnemyEndOfTurn(enemy) {
    const effects = enemy.statusEffects;
    for(const effectKey in effects) {
        if(effects[effectKey].duration) {
            effects[effectKey].duration--;
            if(effects[effectKey].duration <= 0) {
                delete effects[effectKey];
                addToLog(`${enemy.name} is no longer ${effectKey.replace('debuff_', '').replace('_', ' ')}.`);
            }
        }
    }
    updateStatsView();
}

async function enemyTurn() {
    handlePlayerEndOfTurn();
    if (!player.isAlive()) {
        checkPlayerDeath();
        return;
    }

    if (player.statusEffects.buff_haste || player.statusEffects.buff_hermes) {
        addToLog("Your haste allows you to act again immediately!", "text-cyan-300 font-bold");
        setTimeout(() => endPlayerTurnPhase(), 500);
        return; 
    }

    const enemiesActingThisTurn = [...currentEnemies];
    for (const enemy of enemiesActingThisTurn) {
        if (gameState.battleEnded || !player.isAlive()) break;

        await new Promise(resolve => {
            setTimeout(() => {
                if (!enemy.isAlive() || !player.isAlive()) {
                    resolve();
                    return;
                }
            
                let tookTurn = false;
                if (enemy.statusEffects.petrified || enemy.statusEffects.paralyzed) {
                    const status = enemy.statusEffects.petrified ? 'petrified' : 'paralyzed';
                    addToLog(`${enemy.name} is ${status} and cannot move!`);
                    tookTurn = true; 
                } else {
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
                                    applyStatusEffect(player, 'poison', { duration: 3, damage: [rarityDice * 2, 4] }, enemy.name);
                                    usedAbility = true;
                                }
                                break;
                            case 'petrification':
                                if (!player.statusEffects.petrified && Math.random() < 0.25) {
                                    applyStatusEffect(player, 'petrified', { duration: 2 }, enemy.name);
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
                                    const healAmount = rollDice(rarityDice * 3, 8, `${enemy.name} Healing`);
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
                                    applyStatusEffect(player, 'poison', { duration: 3, damage: [rarityDice * 3, 8] }, enemy.name);
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
                                    applyStatusEffect(player, 'swallowed', { by: enemy.name, swallower: enemy, duration: Infinity }, enemy.name);
                                    usedAbility = true;
                                    renderBattle();
                                }
                                break;
                            case 'scorch_earth':
                                if (Math.random() < 0.4) {
                                    addToLog(`${enemy.name} unleashes a torrent of flame!`, 'text-orange-600 font-bold');
                                    const rarityDice = Object.keys(MONSTER_RARITY).indexOf(enemy.rarityData.name.toLowerCase()) + 1;
                                    const fireDamage = rollDice(rarityDice * 4, 8, `${enemy.name} Scorch Earth`) + enemy.strength;
                                    player.takeDamage(fireDamage, true, enemy);
                                    usedAbility = true;
                                }
                                break;
                        }
                    }
                    if (!usedAbility) {
                        enemy.attack(player);
                    }
                    tookTurn = true;
                }
                
                if (tookTurn) {
                    handleEnemyEndOfTurn(enemy);
                    checkPlayerDeath();
                }
                resolve();
            }, 500);
        });
    }

    if (!gameState.battleEnded) {
        endPlayerTurnPhase();
    }
}

function endPlayerTurnPhase() {
    if (gameState.battleEnded) return;
    if (!player.isAlive()) {
        checkPlayerDeath();
        return;
    }

    if (player.statusEffects.petrified) {
        addToLog("You are petrified and cannot move!", 'text-gray-400');
        setTimeout(enemyTurn, 500);
    } else if (player.statusEffects.paralyzed) {
        addToLog("You are paralyzed and cannot move!", 'text-orange-400');
        setTimeout(enemyTurn, 500);
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

