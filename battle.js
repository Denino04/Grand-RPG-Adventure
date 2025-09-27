// --- BATTLE FUNCTIONS ---
function startBattle(biomeKey) { 
    gameState.isPlayerTurn = true; 
    gameState.battleEnded = false;
    gameState.currentBiome = biomeKey;
    $('#inventory-btn').disabled = true;
    currentEnemies = [];

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
        if (rand > 0.7) { // 30% chance for 3 enemies
            numEnemies = 3;
        } else if (rand > 0.4) { // 30% chance for 2 enemies
            numEnemies = 2;
        }
        // 40% chance for 1 enemy
    } else if (player.level >= 4) { // Levels 4 and 5
        if (Math.random() > 0.5) { // 50% chance for 2 enemies
            numEnemies = 2;
        }
        // 50% for 1 enemy
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

function performAttack(targetIndex) {
    const weapon = player.equippedWeapon; 
    if (weapon.name === 'Fists' && player.equippedCatalyst.name !== 'None') {
        addToLog('You cannot attack with your fists while holding a catalyst. Use it to cast spells.', 'text-blue-400');
        renderBattle('main'); // Re-render the battle UI to show action buttons again
        return;
    }

    const target = currentEnemies[targetIndex];
    if (!target || !target.isAlive()) {
        renderBattle('main'); // Target is dead, go back to main battle screen
        return;
    };
    gameState.isPlayerTurn = false; 
    let damage = rollDice(...weapon.damage, 'Player Weapon Attack') + player.strength; 
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
            const fireDamage = rollDice(...weapon.effect.damage, 'Fire Damage'); 
            const finalFireDamage = target.takeDamage(fireDamage, {ignore_defense: 1.0});
            addToLog(`The blade burns for an extra <span class="font-bold text-orange-400">${finalFireDamage}</span> fire damage.`); 
        }
        if (weapon.effect.type === 'lightning_damage') { 
            const lightningDamage = rollDice(...weapon.effect.damage, 'Lightning Damage'); 
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
            target.statusEffects.paralyzed = { duration: weapon.effect.duration + 1 };
            addToLog(`${target.name} is paralyzed by the blow!`, 'text-yellow-500');
        }
        if (weapon.effect.petrify_chance && Math.random() < weapon.effect.petrify_chance) {
            target.statusEffects.petrified = { duration: weapon.effect.duration + 1 };
            addToLog(`${target.name} is petrified by the attack!`, 'text-gray-400');
        }
    }
    setTimeout(checkBattleStatus, 200);
}

function castSpell(spellKey, targetIndex) {
    const spell = MAGIC[spellKey];
    const catalyst = player.equippedCatalyst;
    let spellCost = spell.cost;

    if (catalyst.name === 'None') {
        addToLog(`You need to equip a catalyst to cast spells!`, 'text-blue-400');
        return;
    }

    if (catalyst.effect?.mana_discount) {
        spellCost = Math.max(1, spellCost - catalyst.effect.mana_discount);
    }
    
    if (player.mp < spellCost) {
        addToLog(`Not enough MP to cast ${spell.name}!`, 'text-blue-400');
        return;
    }
    
    const target = currentEnemies[targetIndex];
    if ((spell.type === 'damage') && (!target || !target.isAlive())) {
        renderBattle('main');
        return;
    }

    gameState.isPlayerTurn = false; 
    player.mp -= spellCost; 
    updateStatsView();
    
    if (spell.type === 'damage') {
        addToLog(`You cast ${spell.name} on ${target.name}!`, 'text-purple-300');
    } else {
        addToLog(`You cast ${spell.name}!`, 'text-purple-300');
    }

    let messageLog = [];

    switch(spell.type) {
        case 'damage': 
            let diceCount = spell.damage[0];
            if (catalyst.effect?.spell_amp) {
                diceCount += catalyst.effect.spell_amp;
            }
            let magicDamage = rollDice(diceCount, spell.damage[1], `Player Spell: ${spell.name}`) + player.intelligence;

            if (catalyst.effect?.spell_crit_chance && Math.random() < catalyst.effect.spell_crit_chance) {
                magicDamage = Math.floor(magicDamage * catalyst.effect.spell_crit_multiplier);
                messageLog.push('SPELL CRITICAL!');
            }

            if (player.statusEffects.swallowed) {
                magicDamage = Math.floor(magicDamage / 2);
                messageLog.push(`Your spell fizzles inside the beast!`);
            }
            const finalDamage = target.takeDamage(magicDamage); 
            addToLog(`It deals <span class="font-bold text-purple-400">${finalDamage}</span> damage. ${messageLog.join(' ')}`);

            if (catalyst.effect?.bonus_fire_damage) {
                const fireDamage = rollDice(...catalyst.effect.bonus_fire_damage, 'Bonus Fire Damage');
                const finalFireDamage = target.takeDamage(fireDamage, { ignore_defense: 1.0 });
                addToLog(`The spell burns for an extra <span class="font-bold text-orange-400">${finalFireDamage}</span> fire damage.`);
            }
            break;
        case 'healing': 
            let healAmount = rollDice(...spell.healing, `Player Healing: ${spell.name}`) + player.intelligence; 
            if (catalyst.effect?.heal_amp) {
                healAmount = Math.floor(healAmount * catalyst.effect.heal_amp);
            }
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
    if (catalyst.effect?.hp_regen) {
        const regen = catalyst.effect.hp_regen;
        player.hp = Math.min(player.maxHp, player.hp + regen);
        addToLog(`Your ${catalyst.name} regenerates <span class="font-bold text-green-400">${regen}</span> HP.`, 'text-green-300');
    }
    if (catalyst.effect?.mana_regen) {
        const regen = catalyst.effect.mana_regen;
        player.mp = Math.min(player.maxMp, player.mp + regen);
        addToLog(`Your ${catalyst.name} restores <span class="font-bold text-blue-400">${regen}</span> MP.`, 'text-blue-300');
    }

    const effects = player.statusEffects;
    for (const effectKey in effects) {
        if (effects[effectKey].duration) {
            effects[effectKey].duration--;
            if (effects[effectKey].duration <= 0) {
                delete effects[effectKey];
                addToLog(`Your ${effectKey} has worn off.`);
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
                addToLog(`${enemy.name} is no longer ${effectKey}.`);
            }
        }
    }
    updateStatsView();
}
function enemyTurn() {
    handlePlayerEndOfTurn();
    if (!player.isAlive()) {
        checkPlayerDeath();
        return;
    }

    let turnDelay = 500;
    const enemiesActingThisTurn = [...currentEnemies];

    enemiesActingThisTurn.forEach((enemy, i) => {
        setTimeout(() => {
            if (!enemy.isAlive() || !player.isAlive()) return;
            
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

            if (i === enemiesActingThisTurn.length - 1) {
                 setTimeout(() => endPlayerTurnPhase(), turnDelay);
            }
        }, i * turnDelay);
    });
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
