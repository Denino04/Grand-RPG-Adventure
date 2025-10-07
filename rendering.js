let statAllocationAmount = 1;

function getWeaponStatsString(weapon) {
    if (!weapon || !weapon.name) return 'None';
    const elementText = player.weaponElement !== 'none' ? ` <span class="font-bold text-cyan-300">[${capitalize(player.weaponElement)}]</span>` : '';
    return `${weapon.name} (${weapon.damage[0]}d${weapon.damage[1]})${elementText}`;
}

function getCatalystStatsString(catalyst) {
    if (!catalyst || !catalyst.name || catalyst.name === 'None') return 'None';
    let stats = [];
    if (catalyst.effect?.spell_amp) stats.push(`+${catalyst.effect.spell_amp} Dice`);
    if (catalyst.effect?.mana_discount) stats.push(`-${catalyst.effect.mana_discount} Cost`);
    if (catalyst.effect?.hp_regen) stats.push(`+${catalyst.effect.hp_regen}HP/t`);
    if (catalyst.effect?.mana_regen) stats.push(`+${catalyst.effect.mana_regen}MP/t`);
    if (catalyst.effect?.spell_crit_chance) stats.push(`${catalyst.effect.spell_crit_chance * 100}% Crit`);
    if (catalyst.effect?.spell_vamp) stats.push(`Spell Vamp`);
    if (catalyst.effect?.spell_penetration) stats.push(`Penetration`);
    if (catalyst.effect?.spell_sniper) stats.push(`Sniper`);
    if (catalyst.effect?.overdrive) stats.push(`Overdrive`);
    if (catalyst.effect?.battlestaff) stats.push(`Battlestaff`);
    if (catalyst.effect?.spell_weaver) stats.push(`Spellweaver`);
    if (catalyst.effect?.ranged_chance) stats.push(`Ranged Evasion`);
    return `${catalyst.name}${stats.length > 0 ? ` (${stats.join(', ')})` : ''}`;
}


function updateStatsView() {
    if (!player) return;
    const elements = {
        name: $('#player-name'), details: $('#player-details'), level: $('#player-level'), gold: $('#player-gold'),
        hp: $('#player-hp-text'), mp: $('#player-mp-text'), xp: $('#player-xp-text'), weapon: $('#equipped-weapon'),
        catalyst: $('#equipped-catalyst'), armor: $('#equipped-armor'), shield: $('#equipped-shield'), lure: $('#equipped-lure'),
        questTracker: $('#quest-tracker'), legacyQuestTracker: $('#legacy-quest-tracker')
    };
    if (!elements.name || !elements.hp) {
        console.warn("Stats view elements not found, skipping UI update.");
        return;
    }
    elements.name.textContent = player.name; 
    let detailsText = [];
    if (player.gender) detailsText.push(player.gender);
    if (player.race) detailsText.push(player.race);
    if (player.class) detailsText.push(player.class);
    if (player.background) detailsText.push(player.background);
    elements.details.textContent = detailsText.join(' | ');

    elements.level.textContent = player.level; 
    elements.gold.textContent = player.gold;
    elements.hp.textContent = `${player.hp} / ${player.maxHp}`; 
    elements.mp.textContent = `${player.mp} / ${player.maxMp}`; 
    elements.xp.textContent = `${player.xp} / ${player.xpToNextLevel}`;
    
    $('#player-hp-bar').style.width = `${(player.hp / player.maxHp) * 100}%`;
    $('#player-mp-bar').style.width = `${(player.mp / player.maxMp) * 100}%`;
    $('#player-xp-bar').style.width = `${(player.xp / player.xpToNextLevel) * 100}%`;

    elements.weapon.innerHTML = getWeaponStatsString(player.equippedWeapon);
    elements.catalyst.textContent = getCatalystStatsString(player.equippedCatalyst);
    
    const armor = player.equippedArmor;
    let armorStats = [`Def: ${armor.defense}`];
    if (armor.blockChance > 0) armorStats.push(`Block: ${Math.round(armor.blockChance * 100)}%`);
    if (armor.effect?.type === 'dodge') armorStats.push(`Dodge: ${Math.round(armor.effect.chance * 100)}%`);
    const armorElementText = player.armorElement !== 'none' ? ` <span class="font-bold text-cyan-300">[${capitalize(player.armorElement)}]</span>` : '';
    elements.armor.innerHTML = `${armor.name} (${armorStats.join(', ')})` + armorElementText;

    const shield = player.equippedShield;
    let shieldStats = [`Def: ${shield.defense}`];
    if (shield.blockChance > 0) shieldStats.push(`Block: ${Math.round(shield.blockChance * 100)}%`);
    if (shield.effect?.type === 'parry') shieldStats.push(`Parry: ${Math.round(shield.effect.chance * 100)}%`);
    const shieldElementText = player.shieldElement !== 'none' ? ` <span class="font-bold text-cyan-300">[${capitalize(player.shieldElement)}]</span>` : '';
    elements.shield.innerHTML = `${shield.name} (${shieldStats.join(', ')})` + shieldElementText;
    
    elements.lure.textContent = LURES[player.equippedLure].name;
    
    if (player.activeQuest) {
        const quest = getQuestDetails(player.activeQuest); 
        if (quest) {
            let progress = player.questProgress;
            if (player.activeQuest.category === 'collection') { 
                progress = 0;
                const itemDetails = getItemDetails(quest.target);
                if (itemDetails) {
                    if (quest.target in ITEMS) progress = player.inventory.items[quest.target] || 0;
                    else {
                        let category;
                        if (quest.target in WEAPONS) category = 'weapons';
                        else if (quest.target in ARMOR) category = 'armor';
                        else if (quest.target in SHIELDS) category = 'shields';
                        if(category) progress = player.inventory[category].filter(item => item === quest.target).length;
                    }
                }
            }
            elements.questTracker.innerHTML = `<strong>Quest:</strong> ${quest.title} (${progress} / ${quest.required})`;
        } else elements.questTracker.innerHTML = '';
    } else elements.questTracker.innerHTML = '';

    const legacyQuest = LEGACY_QUESTS['collector_of_legend'];
    const completedCount = Object.keys(player.legacyQuestProgress).length;
    const totalCount = legacyQuest.targets.length;
    elements.legacyQuestTracker.innerHTML = `<strong class="text-purple-400">Legacy:</strong> ${legacyQuest.title} (${completedCount} / ${totalCount})`;
    
    updateDebugView();
}

function renderCharacterCreation() {
    $('#start-screen').classList.add('hidden');
    $('#character-creation-screen').classList.remove('hidden');
    $('#creation-step-1').classList.remove('hidden');
    $('#creation-step-2').classList.add('hidden');
    $('#creation-step-3').classList.add('hidden');
    $('#new-char-name').focus();

    let creationState = {
        name: '',
        gender: null,
        race: null,
        class: null,
        background: null
    };
    
    // --- Step 1: Race Selection ---
    const raceListContainer = $('#race-selection-list');
    raceListContainer.innerHTML = '';
    Object.keys(RACES).forEach(raceKey => {
        const button = document.createElement('button');
        button.className = 'btn btn-primary w-full text-left';
        button.dataset.race = raceKey;
        button.textContent = raceKey;
        button.onmouseenter = () => {
            const raceData = RACES[raceKey];
            $('#race-details-name').textContent = raceKey;
            $('#race-details-description').textContent = raceData.description;
            const statsContainer = $('#race-details-stats');
            statsContainer.innerHTML = Object.entries(raceData)
                .filter(([key]) => key !== 'description')
                .map(([stat, value]) => `<div class="grid grid-cols-2"><span>${stat}</span><span class="font-bold text-yellow-300 text-right">${value}</span></div>`)
                .join('');
        };
        button.addEventListener('click', () => {
            document.querySelectorAll('#race-selection-list button').forEach(btn => {
                btn.classList.remove('bg-yellow-600', 'border-yellow-800');
                btn.classList.add('btn-primary');
            });
            button.classList.add('bg-yellow-600', 'border-yellow-800');
            button.classList.remove('btn-primary');
            creationState.race = raceKey;
        });
        raceListContainer.appendChild(button);
    });

    const genderButtons = document.querySelectorAll('#gender-selection button');
    genderButtons.forEach(button => {
        button.addEventListener('click', () => {
            genderButtons.forEach(btn => {
                btn.classList.remove('bg-yellow-600', 'border-yellow-800');
                btn.classList.add('btn-primary');
            });
            button.classList.add('bg-yellow-600', 'border-yellow-800');
            button.classList.remove('btn-primary');
            creationState.gender = button.dataset.gender;
        });
    });

    $('#to-step-2-btn').onclick = () => {
        const nameInput = $('#new-char-name');
        creationState.name = nameInput.value.trim();
        let hasError = false;

        if (!creationState.name) {
            nameInput.classList.add('border-red-500'); hasError = true;
        } else { nameInput.classList.remove('border-red-500'); }

        if (!creationState.gender) {
            $('#gender-label').classList.add('animate-pulse', 'text-red-400');
            setTimeout(() => $('#gender-label').classList.remove('animate-pulse', 'text-red-400'), 1000);
            hasError = true;
        }

        if (!creationState.race) {
             $('#race-label').classList.add('animate-pulse', 'text-red-400');
            setTimeout(() =>  $('#race-label').classList.remove('animate-pulse', 'text-red-400'), 1000);
            hasError = true;
        }

        if (!hasError) {
            $('#creation-step-1').classList.add('hidden');
            $('#creation-step-2').classList.remove('hidden');
        }
    };
    
    // --- Step 2: Class Selection ---
    const classListContainer = $('#class-selection-list');
    classListContainer.innerHTML = '';
    Object.keys(CLASSES).forEach(classKey => {
        const classData = CLASSES[classKey];
        const button = document.createElement('button');
        button.className = 'btn btn-primary w-full text-left';
        button.dataset.class = classKey;
        button.textContent = classData.name;
        button.onmouseenter = () => {
            $('#class-details-name').textContent = classData.name;
            $('#class-details-description').textContent = classData.description;
            let detailsHtml = '<h5 class="font-bold mt-3 mb-1 text-yellow-300">Stat Bonuses</h5>';
            detailsHtml += '<div class="grid grid-cols-2">';
            detailsHtml += Object.entries(classData.bonusStats).map(([stat, value]) => {
                const sign = value > 0 ? '+' : '';
                const color = value > 0 ? 'text-green-400' : 'text-red-400';
                return `<span>${capitalize(stat)}</span><span class="${color} text-right">${sign}${value}</span>`;
            }).join('');
            detailsHtml += '</div>';
            
            detailsHtml += '<h5 class="font-bold mt-3 mb-1 text-yellow-300">Starting Gear</h5>';
            const gear = Object.values(classData.startingEquipment).map(key => getItemDetails(key)?.name).filter(Boolean).join(', ');
            detailsHtml += `<p class="text-xs">${gear}</p>`;

            $('#class-details-stats').innerHTML = detailsHtml;
        };
        button.addEventListener('click', () => {
             document.querySelectorAll('#class-selection-list button').forEach(btn => {
                btn.classList.remove('bg-yellow-600', 'border-yellow-800');
                btn.classList.add('btn-primary');
            });
            button.classList.add('bg-yellow-600', 'border-yellow-800');
            button.classList.remove('btn-primary');
            creationState.class = classKey;
        });
        classListContainer.appendChild(button);
    });
    
    $('#to-step-3-btn').onclick = () => {
        if (!creationState.class) {
             $('#class-label').classList.add('animate-pulse', 'text-red-400');
            setTimeout(() =>  $('#class-label').classList.remove('animate-pulse', 'text-red-400'), 1000);
            return;
        }
        $('#creation-step-2').classList.add('hidden');
        $('#creation-step-3').classList.remove('hidden');
    };

    // --- Step 3: Background Selection ---
    const backgroundListContainer = $('#background-selection-list');
    backgroundListContainer.innerHTML = '';
    Object.keys(BACKGROUNDS).forEach(bgKey => {
        const bgData = BACKGROUNDS[bgKey];
        const button = document.createElement('button');
        button.className = 'btn btn-primary w-full text-left';
        button.dataset.bg = bgKey;
        button.textContent = bgData.name;
        button.onmouseenter = () => {
            $('#background-details-name').textContent = bgData.name;
            $('#background-details-description').textContent = bgData.description;
            let detailsHtml = '<h5 class="font-bold mt-3 mb-1 text-yellow-300">Favored Stats</h5>';
            const favoredStats = bgData.favoredStats.map(s => capitalize(s)).join(', ') || 'All';
            detailsHtml += `<p class="text-xs">${favoredStats}</p>`;
            $('#background-details-stats').innerHTML = detailsHtml;
        };
        button.addEventListener('click', () => {
             document.querySelectorAll('#background-selection-list button').forEach(btn => {
                btn.classList.remove('bg-yellow-600', 'border-yellow-800');
                btn.classList.add('btn-primary');
            });
            button.classList.add('bg-yellow-600', 'border-yellow-800');
            button.classList.remove('btn-primary');
            creationState.background = bgKey;
        });
        backgroundListContainer.appendChild(button);
    });

    $('#finalize-creation-btn').onclick = () => {
        if (!creationState.background) {
            $('#background-label').classList.add('animate-pulse', 'text-red-400');
            setTimeout(() => $('#background-label').classList.remove('animate-pulse', 'text-red-400'), 1000);
            return;
        }
        initGame(creationState.name, creationState.gender, creationState.race, creationState.class, creationState.background);
    };

    $('#back-to-step-1-btn').onclick = () => {
        $('#creation-step-2').classList.add('hidden');
        $('#creation-step-1').classList.remove('hidden');
    };
    $('#back-to-step-2-btn').onclick = () => {
        $('#creation-step-3').classList.add('hidden');
        $('#creation-step-2').classList.remove('hidden');
    };
    $('#back-to-start-btn').onclick = showStartScreen;
}

function renderRaceSelectionForOldSave(savedData, saveKey, isImport) {
    showStartScreen(); // Reset all screens
    $('#start-screen').classList.add('hidden');
    $('#old-save-race-selection-screen').classList.remove('hidden');

    $('#old-save-char-name').textContent = savedData.name;
    let selectedRace = null;
    
    const raceListContainer = $('#old-save-race-list');
    const confirmBtn = $('#confirm-old-save-race-btn');
    raceListContainer.innerHTML = '';

    Object.keys(RACES).forEach(raceKey => {
        const button = document.createElement('button');
        button.className = 'btn btn-primary w-full text-left';
        button.dataset.race = raceKey;
        button.textContent = raceKey;
        button.onmouseenter = () => {
            const raceData = RACES[raceKey];
            $('#old-save-race-name').textContent = raceKey;
            $('#old-save-race-description').textContent = raceData.description;
            const statsContainer = $('#old-save-race-stats');
            statsContainer.innerHTML = Object.entries(raceData)
                .filter(([key]) => key !== 'description')
                .map(([stat, value]) => `<div class="grid grid-cols-2"><span>${stat}</span><span class="font-bold text-yellow-300 text-right">${value}</span></div>`)
                .join('');
        };
        button.onclick = () => {
            document.querySelectorAll('#old-save-race-list button').forEach(btn => {
                btn.classList.remove('bg-yellow-600', 'border-yellow-800');
                btn.classList.add('btn-primary');
            });
            button.classList.add('bg-yellow-600', 'border-yellow-800');
            button.classList.remove('btn-primary');
            selectedRace = raceKey;
            confirmBtn.disabled = false;
        };
        raceListContainer.appendChild(button);
    });

    confirmBtn.onclick = () => {
        if (selectedRace) {
            savedData.race = selectedRace;
            const updatedSaveData = JSON.stringify(savedData);
            localStorage.setItem(`rpgSaveData_${saveKey}`, updatedSaveData);
            loadGameFromKey(saveKey, isImport);
        }
    };
}

function renderClassBackgroundSelectionForOldSave(savedData, saveKey, isImport) {
    showStartScreen(); // Reset all screens
    $('#start-screen').classList.add('hidden');
    $('#old-save-class-background-screen').classList.remove('hidden');

    $('#old-save-cb-char-name').textContent = savedData.name;
    let selectedClass = null;
    let selectedBackground = null;
    
    const confirmBtn = $('#confirm-old-save-class-background-btn');

    function checkSelections() {
        if (selectedClass && selectedBackground) {
            confirmBtn.disabled = false;
        }
    }

    // --- Class Selection ---
    const classListContainer = $('#old-save-class-list');
    classListContainer.innerHTML = '';
    Object.keys(CLASSES).forEach(classKey => {
        const classData = CLASSES[classKey];
        const button = document.createElement('button');
        button.className = 'btn btn-primary w-full text-left';
        button.dataset.class = classKey;
        button.textContent = classData.name;
        button.onmouseenter = () => {
            $('#old-save-class-details-name').textContent = classData.name;
            $('#old-save-class-details-description').textContent = classData.description;
             let detailsHtml = '<h5 class="font-bold mt-3 mb-1 text-yellow-300">Stat Bonuses</h5>';
            detailsHtml += '<div class="grid grid-cols-2">';
            detailsHtml += Object.entries(classData.bonusStats).map(([stat, value]) => {
                const sign = value > 0 ? '+' : '';
                const color = value > 0 ? 'text-green-400' : 'text-red-400';
                return `<span>${capitalize(stat)}</span><span class="${color} text-right">${sign}${value}</span>`;
            }).join('');
            detailsHtml += '</div>';
            $('#old-save-class-details-stats').innerHTML = detailsHtml;
        };
        button.addEventListener('click', () => {
             document.querySelectorAll('#old-save-class-list button').forEach(btn => {
                btn.classList.remove('bg-yellow-600', 'border-yellow-800');
                btn.classList.add('btn-primary');
            });
            button.classList.add('bg-yellow-600', 'border-yellow-800');
            button.classList.remove('btn-primary');
            selectedClass = classKey;
            checkSelections();
        });
        classListContainer.appendChild(button);
    });

    // --- Background Selection ---
    const backgroundListContainer = $('#old-save-background-list');
    backgroundListContainer.innerHTML = '';
    Object.keys(BACKGROUNDS).forEach(bgKey => {
        const bgData = BACKGROUNDS[bgKey];
        const button = document.createElement('button');
        button.className = 'btn btn-primary w-full text-left';
        button.dataset.bg = bgKey;
        button.textContent = bgData.name;
        button.onmouseenter = () => {
            $('#old-save-background-details-name').textContent = bgData.name;
            $('#old-save-background-details-description').textContent = bgData.description;
            let detailsHtml = '<h5 class="font-bold mt-3 mb-1 text-yellow-300">Favored Stats</h5>';
            const favoredStats = bgData.favoredStats.map(s => capitalize(s)).join(', ') || 'All';
            detailsHtml += `<p class="text-xs">${favoredStats}</p>`;
            $('#old-save-background-details-stats').innerHTML = detailsHtml;
        };
        button.addEventListener('click', () => {
             document.querySelectorAll('#old-save-background-list button').forEach(btn => {
                btn.classList.remove('bg-yellow-600', 'border-yellow-800');
                btn.classList.add('btn-primary');
            });
            button.classList.add('bg-yellow-600', 'border-yellow-800');
            button.classList.remove('btn-primary');
            selectedBackground = bgKey;
            checkSelections();
        });
        backgroundListContainer.appendChild(button);
    });

    confirmBtn.onclick = () => {
        if (selectedClass && selectedBackground) {
            // Update save data object
            savedData.class = CLASSES[selectedClass].name;
            savedData.background = BACKGROUNDS[selectedBackground].name;
            savedData.backgroundKey = selectedBackground;

            // Retroactively apply class bonuses and starting items
            const classData = CLASSES[selectedClass];
            for (const stat in classData.bonusStats) {
                if (savedData.hasOwnProperty(stat.toLowerCase())) {
                    savedData[stat.toLowerCase()] += classData.bonusStats[stat];
                }
            }

            if (!savedData.inventory) savedData.inventory = { items: {}, weapons: [], catalysts: [], armor: [], shields: [], lures: {} };
            if (!savedData.spells) savedData.spells = {};

            Object.keys(classData.startingItems).forEach(key => {
                savedData.inventory.items[key] = (savedData.inventory.items[key] || 0) + classData.startingItems[key];
            });

             Object.keys(classData.startingEquipment).forEach(type => {
                const itemKey = classData.startingEquipment[type];
                const category = `${type}s`;
                if(savedData.inventory[category] && !savedData.inventory[category].includes(itemKey)){
                    savedData.inventory[category].push(itemKey);
                }
            });

            Object.keys(classData.startingSpells).forEach(key => {
                if (!savedData.spells[key]) {
                     savedData.spells[key] = { tier: classData.startingSpells[key] };
                }
            });

            const updatedSaveData = JSON.stringify(savedData);
            localStorage.setItem(`rpgSaveData_${saveKey}`, updatedSaveData);
            loadGameFromKey(saveKey, isImport);
        }
    };
}

function renderCharacterSheet(isLevelUp = false) {
    if (gameState.currentView === 'battle') {
        addToLog("You cannot access your character sheet during combat!", 'text-red-400');
        return;
    }
    if (!player) return;
    if (!characterSheetOriginalStats) {
        characterSheetOriginalStats = {
            vigor: player.vigor, focus: player.focus, stamina: player.stamina,
            strength: player.strength, intelligence: player.intelligence, luck: player.luck,
            statPoints: player.statPoints,
            bonusVigor: player.bonusVigor, bonusFocus: player.bonusFocus, bonusStamina: player.bonusStamina,
            bonusStrength: player.bonusStrength, bonusIntelligence: player.bonusIntelligence, bonusLuck: player.bonusLuck
        };
    }

    lastViewBeforeInventory = 'character_sheet';
    gameState.currentView = isLevelUp ? 'character_sheet_levelup' : 'character_sheet';

    const mainStats = ['vigor', 'focus', 'stamina', 'strength', 'intelligence', 'luck'];
    const derivedStats = {
        'Max HP': 'maxHp', 'Max MP': 'maxMp', 
        'Physical Def': 'physicalDefense', 'Magical Def': 'magicalDefense',
        'Physical Dmg': 'physicalDamageBonus', 'Magical Dmg': 'magicalDamageBonus',
        'Crit Chance': 'critChance', 'Evasion Chance': 'evasionChance', 'Debuff Resist': 'resistanceChance'
    };

    const hasChanges = player.statPoints !== characterSheetOriginalStats.statPoints;

    let html = `<div class="w-full text-left">
        <h2 class="font-medieval text-2xl mb-2 text-center">Character Sheet</h2>
        
        <div class="flex justify-between items-center mb-2 p-1 bg-slate-900/50 rounded-lg text-sm">
            <div>
                <span class="mr-2 font-semibold">Allocate:</span>
                <button onclick="setStatAllocationAmount(1)" class="btn ${statAllocationAmount === 1 ? 'bg-yellow-600 border-yellow-800' : 'btn-primary'} text-xs py-1 px-2 w-12">1x</button>
                <button onclick="setStatAllocationAmount(5)" class="btn ${statAllocationAmount === 5 ? 'bg-yellow-600 border-yellow-800' : 'btn-primary'} text-xs py-1 px-2 w-12">5x</button>
                <button onclick="setStatAllocationAmount(25)" class="btn ${statAllocationAmount === 25 ? 'bg-yellow-600 border-yellow-800' : 'btn-primary'} text-xs py-1 px-2 w-12">25x</button>
            </div>
            <p class="text-green-400 font-bold">Points: <span id="stat-points">${player.statPoints}</span></p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <div>
                <h3 class="font-bold text-lg text-yellow-300 mb-1">Main Stats</h3>
                <div class="space-y-1">`;
    
    mainStats.forEach(stat => {
        const pointsSpentOnStat = player[stat] - characterSheetOriginalStats[stat];
        html += `<div class="grid grid-cols-3 items-center bg-slate-800 p-1 rounded-lg">
                    <span class="font-bold capitalize text-sm col-span-1">${stat}</span>
                    <div class="col-span-2 flex items-center justify-end">
                        <button onclick="deallocatePoint('${stat}', statAllocationAmount)" class="btn btn-action text-base py-0 px-2 leading-none w-7" ${pointsSpentOnStat < statAllocationAmount ? 'disabled' : ''}>-</button>
                        <span class="text-base mx-2 w-8 text-center">${player[stat]}</span>
                        <button onclick="allocatePoint('${stat}', statAllocationAmount)" class="btn btn-primary text-base py-0 px-2 leading-none w-7" ${player.statPoints < statAllocationAmount ? 'disabled' : ''}>+</button>
                    </div>
                 </div>`;
    });
    
    html += `</div></div>
            <div>
                 <h3 class="font-bold text-lg text-yellow-300 mb-1">Derived Stats</h3>
                 <div class="space-y-0.5 text-xs bg-slate-800 p-2 rounded-lg h-48 overflow-y-auto inventory-scrollbar">`;

    Object.entries(derivedStats).forEach(([label, key]) => {
        let value = player[key];
        if (key.includes('Chance')) value = `${(value * 100).toFixed(1)}%`;
        html += `<div class="flex justify-between"><span>${label}:</span><span class="font-semibold">${value}</span></div>`;
    });

    html += `</div></div></div>
        <div class="text-center mt-2 flex justify-center gap-4">
            <button onclick="resetStatAllocation()" class="btn btn-action" ${!hasChanges ? 'disabled' : ''}>Reset</button>
            <button onclick="confirmStatAllocation()" class="btn btn-primary">Done</button>
        </div>
    </div>`;

    const container = document.createElement('div');
    container.innerHTML = html;
    render(container);
}


window.setStatAllocationAmount = function(amount) {
    statAllocationAmount = amount;
    renderCharacterSheet(gameState.currentView === 'character_sheet_levelup');
}


window.allocatePoint = function(stat, amount) {
    if (player.statPoints >= amount) {
        player[stat]+= amount;
        const bonusStatKey = 'bonus' + capitalize(stat);
        player[bonusStatKey]+= amount;
        
        player.recalculateGrowthBonuses();
        
        player.statPoints-= amount;
        player.hp = player.maxHp;
        player.mp = player.maxMp;
        updateStatsView();
        renderCharacterSheet(gameState.currentView === 'character_sheet_levelup');
    }
}

window.deallocatePoint = function(stat, amount) {
    const bonusStatKey = 'bonus' + capitalize(stat);
    const pointsSpentOnStat = player[bonusStatKey] - (characterSheetOriginalStats ? characterSheetOriginalStats[bonusStatKey] : 0);


    if (pointsSpentOnStat >= amount) {
        player[stat] -= amount;
        player[bonusStatKey] -= amount;

        player.recalculateGrowthBonuses();

        player.statPoints += amount;
        player.hp = player.maxHp;
        player.mp = player.maxMp;
        updateStatsView();
        renderCharacterSheet(gameState.currentView === 'character_sheet_levelup');
    }
}

function resetStatAllocation() {
    if (!characterSheetOriginalStats) return;

    // Restore main stats from the backup
    player.vigor = characterSheetOriginalStats.vigor;
    player.focus = characterSheetOriginalStats.focus;
    player.stamina = characterSheetOriginalStats.stamina;
    player.strength = characterSheetOriginalStats.strength;
    player.intelligence = characterSheetOriginalStats.intelligence;
    player.luck = characterSheetOriginalStats.luck;

    // Restore bonus points from the backup
    player.bonusVigor = characterSheetOriginalStats.bonusVigor;
    player.bonusFocus = characterSheetOriginalStats.bonusFocus;
    player.bonusStamina = characterSheetOriginalStats.bonusStamina;
    player.bonusStrength = characterSheetOriginalStats.bonusStrength;
    player.bonusIntelligence = characterSheetOriginalStats.bonusIntelligence;
    player.bonusLuck = characterSheetOriginalStats.bonusLuck;
    
    // Restore stat points
    player.statPoints = characterSheetOriginalStats.statPoints;
    
    player.recalculateGrowthBonuses();
    player.hp = player.maxHp;
    player.mp = player.maxMp;

    addToLog("Stat allocation has been reset.", "text-yellow-400");
    updateStatsView();
    renderCharacterSheet(gameState.currentView === 'character_sheet_levelup');
}

function confirmStatAllocation() {
    if (!player) return;
    characterSheetOriginalStats = null; // Lock in the new stats
    addToLog("Your attributes have been confirmed.", "text-green-400");
    saveGame();
    
    if (gameState.currentView === 'character_sheet_levelup') {
        renderMainMenu();
    } else {
        returnFromInventory(); 
    }
}


function returnFromInventory() {
    switch (lastViewBeforeInventory) {
        case 'main_menu': renderMainMenu(); break;
        case 'character_sheet': renderMainMenu(); break; // Go to main menu from char sheet
        case 'town': renderTownSquare(); break;
        case 'commercial_district': renderCommercialDistrict(); break;
        case 'arcane_quarter': renderArcaneQuarter(); break;
        case 'residential_district': renderResidentialDistrict(); break;
        case 'quest_board': renderQuestBoard(); break;
        case 'inn': renderInn(); break;
        case 'sage_tower_train': renderSageTowerTrain(); break;
        case 'sage_tower_menu': renderSageTowerMenu(); break; 
        case 'sage_tower_buy': renderSageTowerBuy(); break;
        case 'sage_tower_craft': renderSageTowerCraft(); break;
        case 'shop': renderShop('store'); break;
        case 'blacksmith': renderBlacksmithMenu(); break;
        case 'blacksmith_buy': renderBlacksmithBuy(); break;
        case 'blacksmith_craft': renderBlacksmithCraft(); break;
        case 'black_market': renderShop('black_market'); break;
        case 'alchemist': renderAlchemist(); break;
        case 'witchs_coven': renderWitchsCoven(); break;
        case 'sell': renderSell(); break;
        case 'battle': renderBattleGrid(); break;
        case 'wilderness': renderWildernessMenu(); break;
        default: renderMainMenu();
    }
}

function renderMainMenu() {
    const defaultPalettes = ['noon', 'sunset', 'midnight'];
    const allPalettes = Object.keys(PALETTES);
    const palettesToUse = useFullPaletteRotation ? allPalettes : defaultPalettes;

    if (timeOfDayIndex >= palettesToUse.length) {
        timeOfDayIndex = 0;
    }

    const theme = palettesToUse[timeOfDayIndex];
    applyTheme(theme);
    
    timeOfDayIndex = (timeOfDayIndex + 1) % palettesToUse.length;

    lastViewBeforeInventory = 'main_menu';
    gameState.currentView = 'main_menu';
    $('#inventory-btn').disabled = false;
    $('#character-sheet-btn').disabled = false; // Re-enable character button
    saveGame();
    const template = document.getElementById('template-main-menu');
    render(template.content.cloneNode(true));
}

function exitGame() {
    addToLog('Saving your progress...');
    saveGame();
    setTimeout(() => {
        $('#game-container').classList.add('hidden');
        $('#start-screen').classList.remove('hidden');
        logElement.innerHTML = '';
        updateLoadGameButtonVisibility();
        applyTheme('default');
    }, 1000);
}

function renderWildernessMenu() {
    applyTheme('default');
    lastViewBeforeInventory = 'wilderness';
    gameState.currentView = 'wilderness';
    let html = `<div class="w-full">
        <h2 class="font-medieval text-3xl mb-4 text-center">Choose a Biome to Explore</h2>
        <div class="h-80 overflow-y-auto inventory-scrollbar pr-2 space-y-3">`;

    player.biomeOrder.forEach(biomeKey => {
        const biome = BIOMES[biomeKey];
        const requiredLevel = player.biomeUnlockLevels[biomeKey];
        const isUnlocked = player.level >= requiredLevel;

        html += `
            <div class="p-4 bg-slate-800 rounded-lg ${!isUnlocked ? 'opacity-50' : ''}">
                <div class="flex justify-between items-center">
                    <div>
                        <h3 class="font-bold text-yellow-300 text-lg">${biome.name}</h3>
                        <p class="text-sm text-gray-400 mt-1">${biome.description}</p>
                    </div>
                    ${isUnlocked 
                        ? `<button onclick="startBattle('${biomeKey}')" class="btn btn-primary ml-4">Explore</button>` 
                        : `<div class="text-right ml-4">
                               <p class="font-bold text-red-400">Locked</p>
                               <p class="text-xs text-gray-500">Requires Level ${requiredLevel}</p>
                           </div>`
                    }
                </div>
            </div>`;
    });

    html += `</div>
        <div class="text-center mt-4"><button onclick="renderMainMenu()" class="btn btn-primary">Back</button></div>
    </div>`;
    const container = document.createElement('div');
    container.innerHTML = html;
    render(container);
}

function renderTown() {
    renderTownSquare();
}

function renderTownSquare() {
    applyTheme('town');
    lastViewBeforeInventory = 'town';
    gameState.currentView = 'town';

    const bettyPopup = $('#betty-encounter-popup');
    bettyPopup.classList.add('hidden');
    bettyPopup.onclick = null;

    if (player.level >= 10 && player.bettyQuestState === 'not_started' && !player.dialogueFlags.bettyEncounterReady) {
        if (Math.random() < 0.05) {
            player.dialogueFlags.bettyEncounterReady = true; 
        }
    }
    
    if (player.dialogueFlags.bettyEncounterReady && player.bettyQuestState === 'not_started') {
        bettyPopup.classList.remove('hidden');
        bettyPopup.innerHTML = `<p class="font-bold text-purple-200">A nervous woman whispers...</p><p class="text-gray-300">"Psst... Adventurer... Over here..."</p>`;
        bettyPopup.onclick = () => {
            player.dialogueFlags.bettyEncounterReady = false;
            startBettyDialogue();
        };
    } else if (player.bettyQuestState === 'declined') {
        bettyPopup.classList.remove('hidden');
        bettyPopup.innerHTML = `<p class="font-bold text-purple-200">Betty is waiting...</p><p class="text-gray-300">She seems to want to talk to you again.</p>`;
        bettyPopup.onclick = startBettyDialogue;
    }

    const container = document.createElement('div');
    container.className = 'flex flex-col items-center justify-center w-full h-full';

    const locations = [
        { name: 'Commercial District', action: "renderCommercialDistrict()" },
        { name: 'Arcane Quarter', action: "renderArcaneQuarter()" },
        { name: 'Residential Area', action: "renderResidentialDistrict()" },
    ];
    
     if (player.bettyQuestState === 'accepted') {
        locations.push({ name: 'Betty\'s Corner', action: "startBettyDialogue()" });
    }

    let html = `<h2 class="font-medieval text-3xl mb-8 text-center">Town Square</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-md">`;
    
    locations.forEach(loc => {
        html += `<button onclick="${loc.action}" class="btn btn-primary">${loc.name}</button>`;
    });

    html += `</div>
             <div class="mt-8">
                <button onclick="renderMainMenu()" class="btn btn-action">Leave Town</button>
             </div>`;
    
    container.innerHTML = html;
    render(container);
}

function renderResidentialDistrict() {
    applyTheme('town');
    lastViewBeforeInventory = 'residential_district';
    gameState.currentView = 'residential_district';

    const container = document.createElement('div');
    container.className = 'flex flex-col items-center justify-center w-full h-full';

    const locations = [
        { name: 'The Inn', action: "renderInn()" },
        { name: 'Quest Board', action: "renderQuestBoard()" },
        { name: 'Your House', action: "addToLog('Sorry, the housing market has yet to crash.', 'text-yellow-400')" },
    ];

    let html = `<h2 class="font-medieval text-3xl mb-8 text-center">Residential District</h2>
                <div class="grid grid-cols-1 gap-4 w-full max-w-xs">`;
    
    locations.forEach(loc => {
        html += `<button onclick="${loc.action}" class="btn btn-primary">${loc.name}</button>`;
    });

    html += `</div>
             <div class="mt-8">
                <button onclick="renderTownSquare()" class="btn btn-action">Back to Town Square</button>
             </div>`;
    
    container.innerHTML = html;
    render(container);
}

function renderCommercialDistrict() {
    applyTheme('town');
    lastViewBeforeInventory = 'commercial_district';
    gameState.currentView = 'commercial_district';

    const container = document.createElement('div');
    container.className = 'flex flex-col items-center justify-center w-full h-full';

    const locations = [
        { name: 'General Store', action: "renderShop('store')" }, 
        { name: 'Blacksmith', action: "renderBlacksmithMenu()" }, 
        { name: 'Black Market', action: "renderShop('black_market')" }
    ];

    let html = `<h2 class="font-medieval text-3xl mb-8 text-center">Commercial District</h2>
                <div class="grid grid-cols-1 gap-4 w-full max-w-xs">`;
    
    locations.forEach(loc => {
        html += `<button onclick="${loc.action}" class="btn btn-primary">${loc.name}</button>`;
    });

    html += `</div>
             <div class="mt-8">
                <button onclick="renderTownSquare()" class="btn btn-action">Back to Town Square</button>
             </div>`;
    
    container.innerHTML = html;
    render(container);
}

function renderArcaneQuarter() {
    applyTheme('magic');
    lastViewBeforeInventory = 'arcane_quarter';
    gameState.currentView = 'arcane_quarter';

    const container = document.createElement('div');
    container.className = 'flex flex-col items-center justify-center w-full h-full';

    const locations = [
        { name: "Sage's Tower", action: "renderSageTowerMenu()" }, 
        { name: 'Enchanter', action: "renderEnchanter()" }, 
        { name: "Witch's Coven", action: "renderWitchsCoven()" }
    ];

    let html = `<h2 class="font-medieval text-3xl mb-8 text-center">Arcane Quarter</h2>
                <div class="grid grid-cols-1 gap-4 w-full max-w-xs">`;
    
    locations.forEach(loc => {
        html += `<button onclick="${loc.action}" class="btn btn-magic">${loc.name}</button>`;
    });

    html += `</div>
             <div class="mt-8">
                <button onclick="renderTownSquare()" class="btn btn-action">Back to Town Square</button>
             </div>`;
    
    container.innerHTML = html;
    render(container);
}

function renderWitchsCoven(subView = 'main') {
    applyTheme('necropolis'); 
    lastViewBeforeInventory = 'witchs_coven';
    gameState.currentView = 'witchs_coven';
    
    const hearts = player.inventory.items['undying_heart'] || 0;
    let html = `<div class="w-full text-center">
        <h2 class="font-medieval text-3xl mb-2">Witch's Coven</h2>
        <p class="text-purple-300 mb-6">You have <span class="font-bold">${hearts}</span> Undying Hearts.</p>`;

    if (subView === 'main') {
        html += `<p class="mb-6">The air is thick with incense and unspoken power. The witch offers her services... for a price.</p>
            <div class="flex flex-col md:flex-row justify-center items-center gap-4">
                <button onclick="renderWitchsCoven('transmute')" class="btn btn-magic w-full md:w-auto">Transmute Items</button>
                <button onclick="renderWitchsCoven('reset')" class="btn btn-magic w-full md:w-auto">Reset Fate</button>
                <button onclick="renderWitchsCoven('rebirth')" class="btn btn-magic w-full md:w-auto">Rebirth</button>
            </div>`;
    } else if (subView === 'transmute') {
         html += `<h3 class="font-bold text-xl text-yellow-300 mb-4">Transmute Items</h3>
            <div class="h-80 overflow-y-auto inventory-scrollbar pr-2 space-y-3 text-left">`;
        Object.keys(WITCH_COVEN_RECIPES).filter(k => !WITCH_COVEN_RECIPES[k].hearts).forEach(key => {
            const recipe = WITCH_COVEN_RECIPES[key];
            const product = getItemDetails(recipe.output);
            const ingredients = Object.entries(recipe.ingredients).map(([key, val]) => `${val}x ${getItemDetails(key).name}`).join(', ');
            const canAfford = player.gold >= recipe.cost && Object.entries(recipe.ingredients).every(([key, val]) => (player.inventory.items[key] || 0) >= val);
            html += `<div class="p-3 bg-slate-800 rounded-lg">
                <div class="flex justify-between items-center">
                    <h4 class="font-bold text-lg text-yellow-300" onmouseover="showTooltip('${recipe.output}', event)" onmouseout="hideTooltip()">${product.name}</h4>
                    <button onclick="transmuteWitchItem('${key}')" class="btn btn-primary" ${!canAfford ? 'disabled' : ''}>Transmute</button>
                </div>
                <p class="text-sm text-gray-400">Requires: ${ingredients}</p>
                <p class="text-sm text-gray-400">Cost: ${recipe.cost} G</p>
            </div>`;
        });
        html += `</div>`;
    } else if (subView === 'brew') {
        html += `<h3 class="font-bold text-xl text-yellow-300 mb-4">Brew Concoctions</h3>
            <div class="h-80 overflow-y-auto inventory-scrollbar pr-2 space-y-3 text-left">`;
        Object.keys(WITCH_COVEN_RECIPES).filter(k => WITCH_COVEN_RECIPES[k].hearts).forEach(key => {
            const recipe = WITCH_COVEN_RECIPES[key];
            const product = getItemDetails(recipe.output);
            const ingredients = Object.entries(recipe.ingredients).map(([key, val]) => `${val}x ${getItemDetails(key).name}`).join(', ');
            const canAfford = player.gold >= recipe.cost && hearts >= recipe.hearts && Object.entries(recipe.ingredients).every(([key, val]) => (player.inventory.items[key] || 0) >= val);
            html += `<div class="p-3 bg-slate-800 rounded-lg">
                <div class="flex justify-between items-center">
                    <h4 class="font-bold text-lg text-yellow-300" onmouseover="showTooltip('${recipe.output}', event)" onmouseout="hideTooltip()">${product.name}</h4>
                    <button onclick="brewWitchPotion('${key}')" class="btn btn-primary" ${!canAfford ? 'disabled' : ''}>Brew</button>
                </div>
                <p class="text-sm text-gray-400">Requires: ${ingredients}</p>
                <p class="text-sm text-gray-400">Cost: ${recipe.cost} G, ${recipe.hearts} Undying Hearts</p>
            </div>`;
        });
        html += `</div>`;
    } else if (subView === 'reset') {
        const cost = WITCH_COVEN_SERVICES.resetStats;
        const canAfford = player.gold >= cost.gold && hearts >= cost.hearts;
        html += `<h3 class="font-bold text-xl text-yellow-300 mb-4">Reset Fate</h3>
                 <p class="mb-4">This will refund all stat points you have allocated since level 1.</p>
                 <p class="mb-6">This ritual requires <span class="font-bold text-yellow-400">${cost.gold} G</span> and <span class="font-bold text-purple-300">${cost.hearts} Undying Hearts</span>.</p>
                 <button onclick="resetStatsCoven()" class="btn btn-action" ${!canAfford ? 'disabled' : ''}>Perform Ritual</button>`;
    } else if (subView === 'rebirth') {
        html += `<h3 class="font-bold text-xl text-yellow-300 mb-4">Rebirth</h3>
                 <p class="mb-6">The witch can reshape your very being, but it will be costly.</p>
                 <div class="space-y-4 max-w-lg mx-auto text-left">`;
        // Change Race
        const raceCost = WITCH_COVEN_SERVICES.changeRace;
        html += `<div class="p-3 bg-slate-800 rounded-lg">
            <p class="font-bold">Change Race (Cost: ${raceCost.gold} G, ${raceCost.hearts} Hearts)</p>
            <div class="flex gap-2 mt-2">
                <select id="race-change-select" class="flex-grow bg-gray-800 text-white border border-gray-600 rounded px-2 py-1">${Object.keys(RACES).map(r => `<option value="${r}">${r}</option>`).join('')}</select>
                <button onclick="changeCharacterAspect('race', document.getElementById('race-change-select').value)" class="btn btn-primary">Change</button>
            </div>
        </div>`;
        // Change Class
        const classCost = WITCH_COVEN_SERVICES.changeClass;
        html += `<div class="p-3 bg-slate-800 rounded-lg">
            <p class="font-bold">Change Class (Cost: ${classCost.gold} G, ${classCost.hearts} Hearts)</p>
            <div class="flex gap-2 mt-2">
                <select id="class-change-select" class="flex-grow bg-gray-800 text-white border border-gray-600 rounded px-2 py-1">${Object.keys(CLASSES).map(c => `<option value="${c}">${CLASSES[c].name}</option>`).join('')}</select>
                <button onclick="changeCharacterAspect('class', document.getElementById('class-change-select').value)" class="btn btn-primary">Change</button>
            </div>
        </div>`;
        // Change Background
        const bgCost = WITCH_COVEN_SERVICES.changeBackground;
        html += `<div class="p-3 bg-slate-800 rounded-lg">
            <p class="font-bold">Change Background (Cost: ${bgCost.gold} G, ${bgCost.hearts} Hearts)</p>
            <div class="flex gap-2 mt-2">
                <select id="bg-change-select" class="flex-grow bg-gray-800 text-white border border-gray-600 rounded px-2 py-1">${Object.keys(BACKGROUNDS).map(b => `<option value="${b}">${BACKGROUNDS[b].name}</option>`).join('')}</select>
                <button onclick="changeCharacterAspect('background', document.getElementById('bg-change-select').value)" class="btn btn-primary">Change</button>
            </div>
        </div>`;
        html += `</div>`;
    }

    html += `<div class="mt-8">
                <button onclick="${subView === 'main' ? 'renderArcaneQuarter()' : 'renderWitchsCoven()'}" class="btn btn-primary">Back</button>
            </div>
    </div>`;

    const container = document.createElement('div');
    container.innerHTML = html;
    render(container);
}


function renderSageTowerMenu() {
    applyTheme('magic');
    lastViewBeforeInventory = 'sage_tower_menu';
    gameState.currentView = 'sage_tower_menu';

    let html = `
        <div class="w-full text-center">
            <h2 class="font-medieval text-3xl mb-4 text-center">Sage's Tower</h2>
            <p class="mb-6">The ancient sage offers knowledge of spells and arcane catalysts.</p>
            <div class="flex flex-col md:flex-row justify-center items-center gap-4">
                <button onclick="renderSageTowerTrain()" class="btn btn-magic w-full md:w-auto">Train Spells</button>
                <button onclick="renderSageTowerBuy()" class="btn btn-primary w-full md:w-auto">Purchase Catalysts</button>
                <button onclick="renderSageTowerCraft()" class="btn btn-primary w-full md:w-auto">Synthesize Catalysts</button>
            </div>
             <div class="mt-8">
                <button onclick="renderArcaneQuarter()" class="btn btn-action">Back</button>
            </div>
        </div>`;
    const container = document.createElement('div');
    container.innerHTML = html;
    render(container);
}

function renderEnchanter(selectedElement = null) {
    applyTheme('void');
    lastViewBeforeInventory = 'enchanter';
    gameState.currentView = 'enchanter';

    const container = document.createElement('div');
    container.className = 'w-full';

    let html = `<h2 class="font-medieval text-3xl mb-2 text-center">The Enchanter's Table</h2>
                <p class="text-center text-gray-400 mb-6">Imbue your equipment with elemental power.</p>`;

    // --- Element Selection ---
    html += `<div class="mb-6 p-4 bg-slate-900/50 rounded-lg">
                <h3 class="font-bold text-lg text-yellow-300 mb-3 text-center">1. Select an Element</h3>
                <div class="flex flex-wrap justify-center gap-2">`;
    const elements = Object.keys(ELEMENTS).filter(e => e !== 'none' && e !== 'healing');
    elements.forEach(key => {
        const isSelected = selectedElement === key;
        html += `<button onclick="renderEnchanter('${key}')" class="btn ${isSelected ? 'bg-yellow-600 border-yellow-800' : 'btn-primary'} text-sm py-1 px-3">${capitalize(key)}</button>`;
    });
    html += `</div></div>`;

    // --- Equipment & Enchanting ---
    if (selectedElement) {
        const essenceKey = `${selectedElement}_essence`;
        const essenceDetails = getItemDetails(essenceKey);
        const playerEssence = player.inventory.items[essenceKey] || 0;

        html += `<div class="mb-6 p-4 bg-slate-900/50 rounded-lg">
                    <h3 class="font-bold text-lg text-yellow-300 mb-3 text-center">2. Choose Gear to Enchant</h3>
                    <p class="text-center mb-4">You have <span class="font-bold text-cyan-300">${playerEssence}</span> ${essenceDetails.name}.</p>
                    <div class="space-y-4">`;

        const gearToDisplay = [
            { type: 'weapon', item: player.equippedWeapon, currentElement: player.weaponElement },
            { type: 'armor', item: player.equippedArmor, currentElement: player.armorElement },
            { type: 'shield', item: player.equippedShield, currentElement: player.shieldElement }
        ];

        gearToDisplay.forEach(gear => {
            if (!gear.item || !gear.item.name || gear.item.name === 'None') return;

            const costs = ENCHANTING_COSTS[gear.item.rarity];
            const canAfford = costs && playerEssence >= costs.essence && player.gold >= costs.gold;
            const isAlreadyEnchanted = gear.currentElement === selectedElement;
            const canEnchant = gear.item.rarity !== 'Broken' && !isAlreadyEnchanted;

            html += `<div class="flex flex-col sm:flex-row justify-between items-center p-3 bg-slate-800 rounded-lg">
                        <div>
                            <p class="font-bold">${gear.item.name} <span class="text-xs text-gray-400">(${gear.item.rarity})</span></p>
                            <p class="text-sm">Current: <span class="font-semibold ${gear.currentElement === 'none' ? 'text-gray-500' : 'text-cyan-300'}">${capitalize(gear.currentElement)}</span></p>
                        </div>
                        <div class="text-right mt-2 sm:mt-0">`;
            if (canEnchant && costs) {
                 html += `<p class="text-xs">Cost: ${costs.essence} Essence, ${costs.gold} G</p>
                            <button onclick="enchantItem('${gear.type}', '${selectedElement}')" class="btn btn-primary text-sm py-1 px-3 mt-1" ${!canAfford ? 'disabled' : ''}>Enchant</button>`;
            } else if (isAlreadyEnchanted) {
                html += `<p class="text-green-400 font-bold">Already Enchanted</p>`
            } else {
                 html += `<p class="text-gray-500 text-xs">Cannot be enchanted</p>`;
            }
            html += `</div></div>`;
        });
        html += `</div></div>`;
    }

    html += `<div class="text-center mt-6"><button onclick="renderArcaneQuarter()" class="btn btn-primary">Back</button></div>`;
    container.innerHTML = html;
    render(container);
}

function renderQuestBoard() {
    applyTheme('town');
    const scrollable = mainView.querySelector('.inventory-scrollbar');
    const scrollPos = scrollable ? scrollable.scrollTop : 0;

    lastViewBeforeInventory = 'quest_board';
    gameState.currentView = 'quest_board';
    let html = `<div class="w-full"><h2 class="font-medieval text-3xl mb-4 text-center">Quest Board</h2>`;
    
    if (player.activeQuest) {
        const quest = getQuestDetails(player.activeQuest);
        let progress = player.questProgress;
        let canComplete = progress >= quest.required;

        if (player.activeQuest.category === 'collection') {
            progress = 0;
            const itemDetails = getItemDetails(quest.target);
            if (itemDetails) {
                 if (quest.target in ITEMS) {
                     progress = player.inventory.items[quest.target] || 0;
                } else { // Equipment
                    let category;
                    if (quest.target in WEAPONS) category = 'weapons';
                    else if (quest.target in ARMOR) category = 'armor';
                    else if (quest.target in SHIELDS) category = 'shields';
                    if(category) {
                        progress = player.inventory[category].filter(item => item === quest.target).length;
                    }
                }
            }
            canComplete = progress >= quest.required;
        }

        const penalty = 10 * player.level;
        html += `<div class="p-4 bg-slate-800 rounded-lg text-center">
                    <h3 class="font-bold text-yellow-300">${quest.title} (Active)</h3>
                    <p class="text-gray-400 my-2">${quest.description}</p>
                    <p>Progress: ${progress} / ${quest.required}</p>
                    <p>Reward: ${quest.reward.xp} XP, ${quest.reward.gold} G</p>
                    <div class="mt-4 flex justify-center gap-4">
                        <button onclick="completeQuest()" class="btn btn-primary" ${!canComplete ? 'disabled' : ''}>Complete Quest</button>
                        <button onclick="cancelQuest()" class="btn btn-action">Cancel (Fee: ${penalty} G)</button>
                    </div>
                </div>`;
    } else {
        html += `<p class="text-center mb-4">Choose a quest to undertake.</p>`;

        // Determine number of quests to show based on player tier
        const numQuestsToShow = 2 + player.playerTier;

        // Gather and filter available quests
        let availableQuests = [];
        // Iterate through the flat QUESTS object
        for (const questKey in QUESTS) {
            const quest = QUESTS[questKey];
            // Check if the quest tier is appropriate for the player
            if (quest.tier <= player.playerTier) {
                // Determine the quest category/type. Default to 'extermination' if not specified.
                const category = quest.type || 'extermination';
                availableQuests.push({ ...quest, category: category, key: questKey });
            }
        }
        
        availableQuests = availableQuests.filter(quest => !player.questsTakenToday.includes(quest.key));

        const rng = seededRandom(player.seed); // Use the player's seed for consistent quest offerings
        const offeredQuests = shuffleArray(availableQuests, rng).slice(0, numQuestsToShow);
        
        html += `<div class="h-80 overflow-y-auto inventory-scrollbar pr-2 space-y-3">`
        if (offeredQuests.length > 0) {
            html += offeredQuests.map(quest => {
                 return `<div class="p-3 bg-slate-800 rounded-lg">
                            <h3 class="font-bold text-yellow-300">${quest.title} <span class="text-xs text-gray-400">(Tier ${quest.tier})</span></h3>
                            <p class="text-sm text-gray-400 my-1">${quest.description}</p>
                            <p class="text-sm">Reward: ${quest.reward.xp} XP, ${quest.reward.gold} G</p>
                            <button onclick="acceptQuest('${quest.category}', '${quest.key}')" class="btn btn-primary mt-2 text-sm py-1 px-3">Accept</button>
                         </div>`;
            }).join('');
        } else {
            html += `<p class="text-center text-gray-400">No new quests available. Rest at an Inn to see more.</p>`;
        }
        html += `</div>`;
    }
    html += `<div class="text-center mt-4"><button onclick="renderResidentialDistrict()" class="btn btn-primary">Back</button></div></div>`; 
    const container = document.createElement('div');
    container.innerHTML = html;
    render(container);

    const newScrollable = mainView.querySelector('.inventory-scrollbar');
    if (newScrollable) newScrollable.scrollTop = scrollPos;
}

function renderInn() { 
    applyTheme('town');
    lastViewBeforeInventory = 'inn';
    gameState.currentView = 'inn'; 
    const cost = 10 + 5 * player.level; 
    let html = `<h2 class="font-medieval text-3xl mb-4 text-center">The Weary Traveler Inn</h2><p class="mb-4 text-center">A night's rest costs ${cost} G. You will be fully restored.</p><div class="flex justify-center gap-4"><button onclick="restAtInn(${cost})" class="btn btn-primary" ${player.gold < cost ? 'disabled' : ''}>Rest for the night</button><button onclick="renderResidentialDistrict()" class="btn btn-primary">Back</button></div>${player.gold < cost ? '<p class="text-red-400 mt-2 text-center">You cannot afford a room.</p>' : ''}`;
    const container = document.createElement('div');
    container.innerHTML = html;
    render(container);
}

function renderShop(type) {
    if (type === 'store') {
        applyTheme('town');
    } else if (type === 'black_market') {
        applyTheme('void');
    }
    const scrollable = mainView.querySelector('.inventory-scrollbar');
    const scrollPos = scrollable ? scrollable.scrollTop : 0;

    let inventory, title;

    switch (type) {
        case 'store':
            inventory = SHOP_INVENTORY;
            title = 'General Store';
            lastViewBeforeInventory = 'shop';
            gameState.currentView = 'shop';
            break;
        case 'black_market':
            inventory = { ...BLACK_MARKET_INVENTORY, 'Seasonal Wares': player.blackMarketStock.seasonal };
            title = 'Black Market';
            lastViewBeforeInventory = 'black_market';
            gameState.currentView = 'black_market';
            break;
        default: return;
    }

    let itemsHtml = '';
    for (const category in inventory) {
        if (inventory[category].length === 0) continue;
        itemsHtml += `<h3 class="font-medieval text-xl mt-4 mb-2 text-yellow-300">${category}</h3>`;
        itemsHtml += '<div class="space-y-2">';
        inventory[category].forEach(key => {
            const details = getItemDetails(key);
            if (!details) return;
            const price = Math.floor(details.price * (type === 'black_market' ? 1.5 : 1)); // 50% markup for black market
            itemsHtml += `<div class="flex justify-between items-center p-2 bg-slate-800 rounded" onmouseover="showTooltip('${key}', event)" onmouseout="hideTooltip()" onclick="showTooltip('${key}', event)"><span>${details.name}</span><div><span class="text-yellow-400 font-semibold mr-4">${price} G</span><button onclick="buyItem('${key}', '${type}', ${price})" class="btn btn-primary text-sm py-1 px-3" ${player.gold < price ? 'disabled' : ''}>Buy</button></div></div>`;
        });
        itemsHtml += '</div>';
    }
    let html = `<div class="w-full"><h2 class="font-medieval text-3xl mb-4 text-center">${title}</h2><div class="h-80 overflow-y-auto inventory-scrollbar pr-2">${itemsHtml}</div><div class="flex justify-center gap-4 mt-4">${type === 'store' ? `<button onclick="renderSell()" class="btn btn-primary">Sell Items</button>` : ''}<button onclick="renderCommercialDistrict()" class="btn btn-primary">Back</button></div></div>`;
    const container = document.createElement('div');
    container.innerHTML = html;
    render(container);

    const newScrollable = mainView.querySelector('.inventory-scrollbar');
    if (newScrollable) newScrollable.scrollTop = scrollPos;
}

function renderBlacksmithMenu() {
    applyTheme('volcano');
    lastViewBeforeInventory = 'blacksmith';
    gameState.currentView = 'blacksmith';

    let html = `
        <div class="w-full text-center">
            <h2 class="font-medieval text-3xl mb-4 text-center">Clanging Hammer Blacksmith</h2>
            <p class="mb-6">The heat of the forge is immense. What do you need?</p>
            <div class="flex justify-center gap-4">
                <button onclick="renderBlacksmithBuy()" class="btn btn-primary">Buy Equipment</button>
                <button onclick="renderBlacksmithCraft()" class="btn btn-primary">Craft Equipment</button>
                <button onclick="renderCommercialDistrict()" class="btn btn-primary">Back</button>
            </div>
        </div>`;
    const container = document.createElement('div');
    container.innerHTML = html;
    render(container);
}

function renderBlacksmithBuy() {
    const scrollable = mainView.querySelector('.inventory-scrollbar');
    const scrollPos = scrollable ? scrollable.scrollTop : 0;
    
    lastViewBeforeInventory = 'blacksmith_buy';
    gameState.currentView = 'blacksmith_buy';

    let itemsHtml = '';
    for (const category in BLACKSMITH_INVENTORY) {
        if (BLACKSMITH_INVENTORY[category].length === 0) continue;
        itemsHtml += `<h3 class="font-medieval text-xl mt-4 mb-2 text-yellow-300">${category}</h3>`;
        itemsHtml += '<div class="space-y-2">';
        BLACKSMITH_INVENTORY[category].forEach(key => {
            const details = getItemDetails(key);
            if (!details) return;
            const price = details.price;
            itemsHtml += `<div class="flex justify-between items-center p-2 bg-slate-800 rounded" onmouseover="showTooltip('${key}', event)" onmouseout="hideTooltip()" onclick="showTooltip('${key}', event)"><span>${details.name}</span><div><span class="text-yellow-400 font-semibold mr-4">${price} G</span><button onclick="buyItem('${key}', 'blacksmith', ${price})" class="btn btn-primary text-sm py-1 px-3" ${player.gold < price ? 'disabled' : ''}>Buy</button></div></div>`;
        });
        itemsHtml += '</div>';
    }
    let html = `<div class="w-full"><h2 class="font-medieval text-3xl mb-4 text-center">Buy Equipment</h2><div class="h-80 overflow-y-auto inventory-scrollbar pr-2">${itemsHtml}</div><div class="flex justify-center gap-4 mt-4"><button onclick="renderBlacksmithMenu()" class="btn btn-primary">Back</button></div></div>`;
    const container = document.createElement('div');
    container.innerHTML = html;
    render(container);

    const newScrollable = mainView.querySelector('.inventory-scrollbar');
    if (newScrollable) newScrollable.scrollTop = scrollPos;
}

function renderBlacksmithCraft() {
    const scrollable = mainView.querySelector('.inventory-scrollbar');
    const scrollPos = scrollable ? scrollable.scrollTop : 0;
    
    lastViewBeforeInventory = 'blacksmith_craft';
    gameState.currentView = 'blacksmith_craft';

    let recipesHtml = '';
    for (const recipeKey in BLACKSMITH_RECIPES) {
        const recipe = BLACKSMITH_RECIPES[recipeKey];
        const productDetails = getItemDetails(recipe.output);
        
        let hasIngredients = true;
        let ingredientsList = [];
        for (const ingredientKey in recipe.ingredients) {
            const requiredAmount = recipe.ingredients[ingredientKey];
            let playerAmount = 0;

            if(ITEMS[ingredientKey]) {
                playerAmount = player.inventory.items[ingredientKey] || 0;
            } else if (ARMOR[ingredientKey]) { // Special case for crafting with armor
                playerAmount = player.inventory.armor.filter(i => i === ingredientKey).length;
            }

            if (playerAmount < requiredAmount) {
                hasIngredients = false;
            }
            const ingredientDetails = getItemDetails(ingredientKey);
            ingredientsList.push(`<span onmouseover="showTooltip('${ingredientKey}', event)" onmouseout="hideTooltip()">${requiredAmount}x ${ingredientDetails.name}</span>`);
        }

        const canAfford = player.gold >= recipe.cost;
        const canCraft = hasIngredients && canAfford;

        recipesHtml += `
            <div class="p-3 bg-slate-800 rounded-lg">
                <div class="flex justify-between items-center">
                    <h3 class="font-bold text-lg text-yellow-300" onmouseover="showTooltip('${recipe.output}', event)" onmouseout="hideTooltip()">${productDetails.name}</h3>
                    <button onclick="craftGear('${recipeKey}', 'blacksmith')" class="btn btn-primary text-sm py-1 px-3" ${!canCraft ? 'disabled' : ''}>Craft</button>
                </div>
                <div class="text-sm text-gray-400 mt-1">
                    <p>Requires: ${ingredientsList.join(', ')}</p>
                    <p>Cost: <span class="text-yellow-400">${recipe.cost} G</span></p>
                </div>
            </div>`;
    }

    if (Object.keys(BLACKSMITH_RECIPES).length === 0) {
        recipesHtml = `<p class="text-center text-gray-400">The blacksmith has no crafting recipes for you at this time.</p>`;
    }

    let html = `
        <div class="w-full">
            <h2 class="font-medieval text-3xl mb-4 text-center">Craft Equipment</h2>
            <p class="text-center text-gray-400 mb-4">Combine materials to forge powerful gear.</p>
            <div class="h-80 overflow-y-auto inventory-scrollbar pr-2 space-y-3">${recipesHtml}</div>
            <div class="text-center mt-4">
                <button onclick="renderBlacksmithMenu()" class="btn btn-primary">Back</button>
            </div>
        </div>`;
    const container = document.createElement('div');
    container.innerHTML = html;
    render(container);

    const newScrollable = mainView.querySelector('.inventory-scrollbar');
    if (newScrollable) newScrollable.scrollTop = scrollPos;
}

function renderAlchemist() {
    applyTheme('swamp');
    const scrollable = mainView.querySelector('.inventory-scrollbar');
    const scrollPos = scrollable ? scrollable.scrollTop : 0;

    lastViewBeforeInventory = 'alchemist';
    gameState.currentView = 'alchemist';

    let recipesHtml = '';
    for (const recipeKey in ALCHEMY_RECIPES) {
        const recipe = ALCHEMY_RECIPES[recipeKey];
        const productDetails = getItemDetails(recipe.output);
        
        let hasIngredients = true;
        let ingredientsList = [];
        for (const ingredientKey in recipe.ingredients) {
            const requiredAmount = recipe.ingredients[ingredientKey];
            const playerAmount = player.inventory.items[ingredientKey] || 0;
            if (playerAmount < requiredAmount) {
                hasIngredients = false;
            }
            const ingredientDetails = getItemDetails(ingredientKey);
            ingredientsList.push(`<span onmouseover="showTooltip('${ingredientKey}', event)" onmouseout="hideTooltip()">${requiredAmount}x ${ingredientDetails.name}</span>`);
        }

        const canAfford = player.gold >= recipe.cost;
        const canBrew = hasIngredients && canAfford;

        recipesHtml += `
            <div class="p-3 bg-slate-800 rounded-lg">
                <div class="flex justify-between items-center">
                    <h3 class="font-bold text-lg text-yellow-300" onmouseover="showTooltip('${recipe.output}', event)" onmouseout="hideTooltip()">${productDetails.name}</h3>
                    <button onclick="brewPotion('${recipeKey}')" class="btn btn-primary text-sm py-1 px-3" ${!canBrew ? 'disabled' : ''}>Brew</button>
                </div>
                <div class="text-sm text-gray-400 mt-1">
                    <p>Requires: ${ingredientsList.join(', ')}</p>
                    <p>Cost: <span class="text-yellow-400">${recipe.cost} G</span></p>
                </div>
            </div>`;
    }

    let html = `
        <div class="w-full">
            <h2 class="font-medieval text-3xl mb-4 text-center">Alchemist's Workshop</h2>
            <p class="text-center text-gray-400 mb-4">Brew powerful potions from monster parts.</p>
            <div class="h-80 overflow-y-auto inventory-scrollbar pr-2 space-y-3">${recipesHtml}</div>
            <div class="text-center mt-4">
                <button onclick="renderCommercialDistrict()" class="btn btn-primary">Back</button>
            </div>
        </div>`;
    const container = document.createElement('div');
    container.innerHTML = html;
    render(container);

    const newScrollable = mainView.querySelector('.inventory-scrollbar');
    if (newScrollable) newScrollable.scrollTop = scrollPos;
}

function renderSell() {
    applyTheme('town');
    const scrollable = mainView.querySelector('.inventory-scrollbar');
    const scrollPos = scrollable ? scrollable.scrollTop : 0;

    lastViewBeforeInventory = 'sell';
    gameState.currentView = 'sell';

    let sellableHtml = '';
    const categories = ['items', 'weapons', 'armor', 'shields'];
    let hasSellableItems = false;

    categories.forEach(category => {
        let itemsInCategory = [];
        if (category === 'items') {
            itemsInCategory = Object.keys(player.inventory.items);
        } else {
            itemsInCategory = [...new Set(player.inventory[category])];
        }

        if (itemsInCategory.length > 0) {
            let categoryHtml = '';
            itemsInCategory.forEach(key => {
                const details = getItemDetails(key);
                if (details && details.price > 0) { // Can't sell items with no price
                    const sellPrice = Math.floor(details.price / 4);
                    let count = 0;
                     if (category === 'items') {
                        count = player.inventory.items[key] || 0;
                    } else {
                        count = player.inventory[category].filter(i => i === key).length;
                    }

                    if (count > 0) {
                        hasSellableItems = true;
                        categoryHtml += `<div class="flex justify-between items-center p-2 bg-slate-800 rounded" onmouseover="showTooltip('${key}', event)" onmouseout="hideTooltip()">
                                        <span>${details.name} (x${count})</span>
                                        <div>
                                            <span class="text-yellow-400 font-semibold mr-4">${sellPrice} G</span>
                                            <button onclick="sellItem('${category}', '${key}', ${sellPrice})" class="btn btn-primary text-sm py-1 px-3">Sell</button>
                                        </div>
                                     </div>`;
                    }
                }
            });
            if (categoryHtml) {
                 sellableHtml += `<h3 class="font-medieval text-xl mt-4 mb-2 text-yellow-300">${capitalize(category)}</h3><div class="space-y-2">${categoryHtml}</div>`;
            }
        }
    });

    if (!hasSellableItems) {
        sellableHtml = '<p class="text-center text-gray-400 mt-8">You have nothing of value to sell.</p>';
    }

    let html = `<div class="w-full">
                    <h2 class="font-medieval text-3xl mb-4 text-center">Sell Items</h2>
                    <p class="text-center text-gray-400 mb-4">You get 25% of an item's value when selling.</p>
                    <div class="h-80 overflow-y-auto inventory-scrollbar pr-2">${sellableHtml}</div>
                    <div class="text-center mt-4">
                        <button onclick="renderShop('store')" class="btn btn-primary">Back to Store</button>
                    </div>
                </div>`;
    const container = document.createElement('div');
    container.innerHTML = html;
    render(container);
    
    const newScrollable = mainView.querySelector('.inventory-scrollbar');
    if (newScrollable) newScrollable.scrollTop = scrollPos;
}

function renderSageTowerTrain() {
    applyTheme('magic');
    const scrollable = mainView.querySelector('.inventory-scrollbar');
    const scrollPos = scrollable ? scrollable.scrollTop : 0;

    lastViewBeforeInventory = 'sage_tower_train';
    gameState.currentView = 'sage_tower_train';

    // Group spells by element
    const spellsByElement = {};
    for (const spellKey in SPELLS) {
        const spell = SPELLS[spellKey];
        if (!spellsByElement[spell.element]) {
            spellsByElement[spell.element] = [];
        }
        spellsByElement[spell.element].push(spellKey);
    }
    
    // Define the order of elements
    const elementOrder = ['none', 'fire', 'water', 'earth', 'wind', 'lightning', 'nature', 'light', 'dark', 'healing'];
    
    let html = `<div class="w-full">
        <h2 class="font-medieval text-3xl mb-4 text-center">Train Spells</h2>
        <div class="h-80 overflow-y-auto inventory-scrollbar pr-2 space-y-4">`;

    elementOrder.forEach(element => {
        if (spellsByElement[element]) {
            html += `<div class="space-y-3">
                        <h3 class="font-medieval text-xl text-yellow-300 border-b-2 border-yellow-300/30 pb-1">${capitalize(element)} Spells</h3>`;
            
            spellsByElement[element].forEach(spellKey => {
                const spellTree = SPELLS[spellKey];
                const playerSpell = player.spells[spellKey];
                const currentTier = playerSpell ? playerSpell.tier : 0;
                const spellDetails = spellTree.tiers[currentTier - 1] || spellTree.tiers[0];
                
                html += `<div class="p-3 bg-slate-800 rounded-lg text-left">`;

                if (currentTier === 0) { // Spell not learned
                    const canAfford = player.gold >= spellTree.learnCost;
                    html += `<div class="flex justify-between items-center">
                                <h3 class="font-bold text-lg text-yellow-300" onmouseover="showTooltip('${spellKey}', event)" onmouseout="hideTooltip()">${spellDetails.name}</h3>
                                <button onclick="upgradeSpell('${spellKey}')" class="btn btn-primary" ${!canAfford ? 'disabled' : ''}>Learn</button>
                            </div>
                            <p class="text-sm text-gray-400">Cost: ${spellTree.learnCost} G</p>`;
                } else if (currentTier < spellTree.tiers.length) { // Can be upgraded
                    const upgradeData = spellTree.tiers[currentTier - 1];
                    const canAffordGold = player.gold >= upgradeData.upgradeCost;
                    const hasEssences = Object.entries(upgradeData.upgradeEssences || {}).every(([key, val]) => (player.inventory.items[key] || 0) >= val);
                    const canUpgrade = canAffordGold && hasEssences;
                    const essenceList = Object.entries(upgradeData.upgradeEssences || {}).map(([key, val]) => `${val}x ${getItemDetails(key).name}`).join(', ');

                    html += `<div class="flex justify-between items-center">
                                <h3 class="font-bold text-lg text-green-300" onmouseover="showTooltip('${spellKey}', event)" onmouseout="hideTooltip()">${spellDetails.name} (Tier ${currentTier})</h3>
                                <button onclick="upgradeSpell('${spellKey}')" class="btn btn-primary" ${!canUpgrade ? 'disabled' : ''}>Upgrade</button>
                            </div>
                             <p class="text-sm text-gray-400">Next: ${spellTree.tiers[currentTier].name}</p>
                             <p class="text-sm text-gray-400">Cost: ${upgradeData.upgradeCost} G, ${essenceList}</p>`;
                } else { // Max tier
                     html += `<div class="flex justify-between items-center">
                                <h3 class="font-bold text-lg text-cyan-300" onmouseover="showTooltip('${spellKey}', event)" onmouseout="hideTooltip()">${spellDetails.name} (Max Tier)</h3>
                                <span class="text-gray-500">Mastered</span>
                              </div>`;
                }

                html += `</div>`;
            });
            html += `</div>`;
        }
    });

    html += `</div>
        <div class="text-center mt-4">
            <button onclick="renderSageTowerMenu()" class="btn btn-primary">Back</button>
        </div>
    </div>`;

    const container = document.createElement('div');
    container.innerHTML = html;
    render(container);

    const newScrollable = mainView.querySelector('.inventory-scrollbar');
    if (newScrollable) newScrollable.scrollTop = scrollPos;
}

function renderSageTowerBuy() {
    applyTheme('magic');
    const scrollable = mainView.querySelector('.inventory-scrollbar');
    const scrollPos = scrollable ? scrollable.scrollTop : 0;

    lastViewBeforeInventory = 'sage_tower_buy';
    gameState.currentView = 'sage_tower_buy';

    let itemsHtml = '';
    for (const category in MAGIC_SHOP_INVENTORY) {
        if (MAGIC_SHOP_INVENTORY[category].length === 0) continue;
        itemsHtml += `<h3 class="font-medieval text-xl mt-4 mb-2 text-yellow-300">${category}</h3>`;
        itemsHtml += '<div class="space-y-2">';
        MAGIC_SHOP_INVENTORY[category].forEach(key => {
            const details = getItemDetails(key);
            if (!details) return;
            const price = details.price;
            itemsHtml += `<div class="flex justify-between items-center p-2 bg-slate-800 rounded" onmouseover="showTooltip('${key}', event)" onmouseout="hideTooltip()">
                            <span>${details.name}</span>
                            <div>
                                <span class="text-yellow-400 font-semibold mr-4">${price} G</span>
                                <button onclick="buyItem('${key}', 'magic', ${price})" class="btn btn-primary text-sm py-1 px-3" ${player.gold < price ? 'disabled' : ''}>Buy</button>
                            </div>
                         </div>`;
        });
        itemsHtml += '</div>';
    }

    let html = `<div class="w-full">
                    <h2 class="font-medieval text-3xl mb-4 text-center">Purchase Catalysts</h2>
                    <div class="h-80 overflow-y-auto inventory-scrollbar pr-2">${itemsHtml}</div>
                    <div class="text-center mt-4">
                        <button onclick="renderSageTowerMenu()" class="btn btn-primary">Back</button>
                    </div>
                </div>`;
    const container = document.createElement('div');
    container.innerHTML = html;
    render(container);

    const newScrollable = mainView.querySelector('.inventory-scrollbar');
    if (newScrollable) newScrollable.scrollTop = scrollPos;
}

function renderSageTowerCraft() {
    applyTheme('magic');
    const scrollable = mainView.querySelector('.inventory-scrollbar');
    const scrollPos = scrollable ? scrollable.scrollTop : 0;

    lastViewBeforeInventory = 'sage_tower_craft';
    gameState.currentView = 'sage_tower_craft';

    let recipesHtml = '';
    for (const recipeKey in MAGIC_SHOP_RECIPES) {
        const recipe = MAGIC_SHOP_RECIPES[recipeKey];
        const productDetails = getItemDetails(recipe.output);
        
        let hasIngredients = true;
        let ingredientsList = [];
        for (const ingredientKey in recipe.ingredients) {
            const requiredAmount = recipe.ingredients[ingredientKey];
            const playerAmount = player.inventory.items[ingredientKey] || 0;
            if (playerAmount < requiredAmount) {
                hasIngredients = false;
            }
            const ingredientDetails = getItemDetails(ingredientKey);
            ingredientsList.push(`<span onmouseover="showTooltip('${ingredientKey}', event)" onmouseout="hideTooltip()">${requiredAmount}x ${ingredientDetails.name}</span>`);
        }

        const canAfford = player.gold >= recipe.cost;
        const canCraft = hasIngredients && canAfford;

        recipesHtml += `
            <div class="p-3 bg-slate-800 rounded-lg">
                <div class="flex justify-between items-center">
                    <h3 class="font-bold text-lg text-yellow-300" onmouseover="showTooltip('${recipe.output}', event)" onmouseout="hideTooltip()">${productDetails.name}</h3>
                    <button onclick="craftGear('${recipeKey}', 'magic')" class="btn btn-primary text-sm py-1 px-3" ${!canCraft ? 'disabled' : ''}>Synthesize</button>
                </div>
                <div class="text-sm text-gray-400 mt-1">
                    <p>Requires: ${ingredientsList.join(', ')}</p>
                    <p>Cost: <span class="text-yellow-400">${recipe.cost} G</span></p>
                </div>
            </div>`;
    }
     if (Object.keys(MAGIC_SHOP_RECIPES).length === 0) {
        recipesHtml = `<p class="text-center text-gray-400">The Sage has no catalyst recipes for you at this time.</p>`;
    }


    let html = `
        <div class="w-full">
            <h2 class="font-medieval text-3xl mb-4 text-center">Synthesize Catalysts</h2>
            <p class="text-center text-gray-400 mb-4">Combine materials to create powerful arcane catalysts.</p>
            <div class="h-80 overflow-y-auto inventory-scrollbar pr-2 space-y-3">${recipesHtml}</div>
            <div class="text-center mt-4">
                <button onclick="renderSageTowerMenu()" class="btn btn-primary">Back</button>
            </div>
        </div>`;
    const container = document.createElement('div');
    container.innerHTML = html;
    render(container);

    const newScrollable = mainView.querySelector('.inventory-scrollbar');
    if (newScrollable) newScrollable.scrollTop = scrollPos;
}

function renderInventory() {
    if (gameState.currentView === 'battle') {
        addToLog("You cannot access your full inventory during combat! Use the 'Item' command instead.", 'text-red-400');
        return;
    }
    const scrollables = mainView.querySelectorAll('.inventory-scrollbar');
    const scrollPositions = Array.from(scrollables).map(el => el.scrollTop);

    gameState.currentView = 'inventory'; 

    const renderKeyItemsList = () => {
        const keyItems = Object.keys(player.inventory.items).filter(key => {
            const details = getItemDetails(key);
            return details && details.type === 'key';
        });

        if (keyItems.length === 0) return '';

        let html = `<h3 class="font-medieval text-xl mt-4 mb-2 text-yellow-300">Key Items</h3><div class="space-y-2">`;
        html += keyItems.map(key => {
            const details = getItemDetails(key);
            if (!details) return '';

            let buttonHtml = '';
            if (key === 'bestiary_notebook') {
                buttonHtml = `<button onclick="event.stopPropagation(); renderBestiaryMenu('inventory')" class="btn btn-primary text-sm py-1 px-3">Open</button>`;
            }

            return `<div class="flex justify-between items-center p-2 bg-slate-800 rounded" onmouseover="showTooltip('${key}', event)" onmouseout="hideTooltip()" onclick="showTooltip('${key}', event)"><span>${details.name}</span>${buttonHtml}</div>`;
        }).join('');
        html += `</div>`;
        return html;
    };

    const renderList = (category, title) => { 
        let list;
        let itemCounts = {};

        if (category === 'items') {
            list = Object.keys(player.inventory.items);
        } else if (category === 'lures') {
            list = Object.keys(player.inventory.lures);
        } else {
            if (!Array.isArray(player.inventory[category])) {
                 player.inventory[category] = [];
            }
            player.inventory[category] = player.inventory[category].filter(key => {
                const isValid = getItemDetails(key);
                if (!isValid) {
                    console.warn(`Removed invalid item key "${key}" from inventory category "${category}".`);
                }
                return isValid;
            });
            
            player.inventory[category].forEach(key => {
                itemCounts[key] = (itemCounts[key] || 0) + 1;
            });
            list = Object.keys(itemCounts);
        }
        
        if (!list || list.length === 0) return ''; 
        
        let html = `<h3 class="font-medieval text-xl mt-4 mb-2 text-yellow-300">${title}</h3><div class="space-y-2">`; 
        html += list.map(key => { 
            const details = getItemDetails(key); 
            if (!details) return '';

            if (category === 'items' && details.type === 'key') {
                return ''; // Exclude key items from the regular item list
            }

            let countStr = '';

            if (category === 'items') {
                countStr = `(x${player.inventory.items[key]})`;
            } else if (category === 'lures') {
                countStr = `(x${player.inventory.lures[key]} uses)`;
            }
            else {
                 if (itemCounts[key] > 1) {
                    countStr = `(x${itemCounts[key]})`;
                }
            }

            const isEquipped = (category === 'weapons' && WEAPONS[key] === player.equippedWeapon) || 
                             (category === 'catalysts' && CATALYSTS[key] === player.equippedCatalyst) ||
                             (category === 'armor' && ARMOR[key] === player.equippedArmor) ||
                             (category === 'shields' && SHIELDS[key] === player.equippedShield) ||
                             (category === 'lures' && key === player.equippedLure); 
            const equippedText = isEquipped ? '<span class="text-green-400 font-bold ml-2">[Equipped]</span>' : ''; 
            let buttonHtml = ''; 
            if (category === 'items' && details.type !== 'junk' && details.type !== 'alchemy' && details.type !== 'key') { 
                buttonHtml = `<button onclick="useItem('${key}')" class="btn btn-item text-sm py-1 px-3">Use</button>`; 
            } else if (isEquipped) {
                let itemType = category.slice(0, -1);
                if (category === 'armor') itemType = 'armor';
                if (category === 'lures') itemType = 'lure';

                const isDefaultItem = (itemType === 'weapon' && player.equippedWeapon.name === WEAPONS['fists'].name) ||
                                      (itemType === 'catalyst' && player.equippedCatalyst.name === CATALYSTS['no_catalyst'].name) ||
                                      (itemType === 'armor' && player.equippedArmor.name === ARMOR['travelers_garb'].name) ||
                                      (itemType === 'shield' && player.equippedShield.name === SHIELDS['no_shield'].name) ||
                                      (itemType === 'lure' && player.equippedLure === 'no_lure');

                if (!isDefaultItem) {
                    buttonHtml = `<button onclick="unequipItem('${itemType}')" class="btn btn-action text-sm py-1 px-3">Unequip</button>`;
                }
            } else if (['weapons', 'catalysts', 'armor', 'shields', 'lures'].includes(category)) { 
                buttonHtml = `<button onclick="equipItem('${key}')" class="btn btn-primary text-sm py-1 px-3">Equip</button>`; 
            }
            return `<div class="flex justify-between items-center p-2 bg-slate-800 rounded" onmouseover="showTooltip('${key}', event)" onmouseout="hideTooltip()" onclick="showTooltip('${key}', event)"><span>${details.name} ${countStr} ${equippedText}</span>${buttonHtml}</div>`; }).join(''); 
            html += `</div>`; 
        return html; 
    }; 
    const renderSpellbook = () => {
        let html = `<h3 class="font-medieval text-xl mt-4 mb-2 text-purple-300">Spellbook</h3><div class="space-y-2">`;
        const knownSpells = Object.keys(player.spells);
        if (knownSpells.length === 0) {
            html += `<p class="text-gray-400">You have not learned any spells.</p>`;
        } else {
            knownSpells.forEach(key => {
                const spellTree = SPELLS[key];
                if (!spellTree) { 
                    console.warn(`Spell key "${key}" not found in SPELLS data. Skipping render.`);
                    return;
                }
                const playerSpell = player.spells[key];
                const details = spellTree.tiers[playerSpell.tier - 1];

                let buttonHtml = '';
                if (spellTree.element === 'healing') {
                    buttonHtml = `<button onclick="castHealingSpellOutsideCombat('${key}')" class="btn btn-item text-sm py-1 px-3">Cast</button>`;
                }

                html += `<div class="p-2 bg-slate-800 rounded" onmouseover="showTooltip('${key}', event)" onmouseout="hideTooltip()" onclick="showTooltip('${key}', event)">
                            <div class="flex justify-between items-center">
                                <span class="font-bold text-purple-200">${details.name} (Tier ${playerSpell.tier})</span>
                                <div class="flex items-center gap-4">
                                    <span class="text-blue-400">${details.cost} MP</span>
                                    ${buttonHtml}
                                </div>
                            </div>
                            <p class="text-sm text-gray-400 mt-1">${details.description || ''}</p>
                         </div>`;
            });
        }
        html += `</div>`;
        return html;
    };
    let html = `
        <div class="w-full text-left">
            <h2 class="font-medieval text-3xl mb-4 text-center">Inventory & Spells</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 h-80">
                <div class="h-full overflow-y-auto inventory-scrollbar pr-2">
                    ${renderSpellbook()}
                    ${renderKeyItemsList()}
                </div>
                <div class="h-full overflow-y-auto inventory-scrollbar pr-2">
                    ${renderList('items', 'Items')}
                    ${renderList('weapons', 'Weapons')}
                    ${renderList('catalysts', 'Catalysts')}
                    ${renderList('armor', 'Armor')}
                    ${renderList('shields', 'Shields')}
                    ${renderList('lures', 'Lures')}
                </div>
            </div>
            <div class="text-center mt-4">
                <button onclick="returnFromInventory()" class="btn btn-primary">Back</button>
            </div>
        </div>`;
    const container = document.createElement('div');
    container.innerHTML = html;
    render(container);

    const newScrollables = mainView.querySelectorAll('.inventory-scrollbar');
    newScrollables.forEach((el, index) => {
        if (scrollPositions[index] !== undefined) {
            el.scrollTop = scrollPositions[index];
        }
    });
}

function renderBattle(subView = 'main', actionData = null) {
     if (gameState.battleEnded) return;
     if (currentEnemies.length === 0 && subView !== 'item') return; // Allow item menu after battle

     if (subView === 'main') {
        renderBattleGrid();
     } else if (subView === 'attack' || subView === 'magic_target') {
        let html = `<h2 class="font-medieval text-3xl mb-4 text-center">Choose a Target</h2><div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">`;
        currentEnemies.forEach((enemy, index) => {
            if (enemy.isAlive()) {
                 if (subView === 'attack') {
                    html += `<button onclick="performAttack(${index})" class="btn btn-action">${enemy.name}</button>`;
                } else { // magic_target
                    html += `<button onclick="castSpell('${actionData.spellKey}', ${index})" class="btn btn-magic">${enemy.name}</button>`;
                }
            }
        });
        html += `</div><button onclick="renderBattleGrid()" class="btn btn-primary">Back</button>`;
        const container = document.createElement('div');
        container.innerHTML = html;
        render(container);
     } else if (subView === 'magic') {
        let spellsHtml = Object.keys(player.spells).map(key => {
            const spellTree = SPELLS[key];
            const spell = spellTree.tiers[player.spells[key].tier - 1];
            const canCast = player.mp >= spell.cost;
            return `<button onclick="battleAction('magic_select', {spellKey: '${key}'})" class="btn btn-magic w-full text-left" ${!canCast ? 'disabled' : ''} onmouseover="showTooltip('${key}', event)" onmouseout="hideTooltip()">
                        <div class="flex justify-between"><span>${spell.name}</span><span>${spell.cost} MP</span></div>
                    </button>`;
        }).join('');
        let html = `<h2 class="font-medieval text-3xl mb-4 text-center">Cast a Spell</h2><div class="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">${spellsHtml}</div><button onclick="renderBattleGrid()" class="btn btn-primary">Back</button>`;
        const container = document.createElement('div');
        container.innerHTML = html;
        render(container);
     } else if (subView === 'item') {
        let itemsHtml = Object.keys(player.inventory.items)
            .filter(key => {
                const item = ITEMS[key];
                return item && item.type !== 'junk' && item.type !== 'alchemy' && item.type !== 'key';
            })
            .map(key => {
                const item = ITEMS[key];
                const count = player.inventory.items[key];
                let action = `useItem('${key}', true)`; // Default action for potions etc.
                if (item.type === 'enchant') {
                    action = `battleAction('item_select', {itemKey: '${key}'})`; // Action for essences that need targeting
                }
                return `<button onclick="${action}" class="btn btn-item w-full text-left" onmouseover="showTooltip('${key}', event)" onmouseout="hideTooltip()"><div class="flex justify-between"><span>${item.name}</span><span>x${count}</span></div></button>`;
            }).join('');
        if (!itemsHtml) { itemsHtml = `<p class="text-gray-400 text-center col-span-2">You have no usable items.</p>`; }
        let html = `<h2 class="font-medieval text-3xl mb-4 text-center">Use an Item</h2><div class="grid grid-cols-2 gap-2 mb-4">${itemsHtml}</div><button onclick="renderBattleGrid()" class="btn btn-primary">Back</button>`;
        const container = document.createElement('div');
        container.innerHTML = html;
        render(container);
     } else if (subView === 'item_target') { // New sub-view for item targeting
        let html = `<h2 class="font-medieval text-3xl mb-4 text-center">Use ${ITEMS[actionData.itemKey].name} on...</h2><div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">`;
        currentEnemies.forEach((enemy, index) => {
            if (enemy.isAlive()) {
                html += `<button onclick="useItem('${actionData.itemKey}', true, ${index})" class="btn btn-item">${enemy.name}</button>`;
            }
        });
        html += `</div><button onclick="renderBattle('item')" class="btn btn-primary">Back</button>`;
        const container = document.createElement('div');
        container.innerHTML = html;
        render(container);
     }
}

function renderPostBattleMenu() {
    $('#inventory-btn').disabled = false;
    $('#character-sheet-btn').disabled = false;
    player.clearEncounterBuffs(); 
    const biomeKey = gameState.currentBiome;
    if (!biomeKey) { // Safety check
        renderMainMenu();
        return;
    }
    const biome = BIOMES[biomeKey];
    let html = `<div class="text-center">
        <h2 class="font-medieval text-3xl mb-4 text-yellow-200">Victory!</h2>
        <p class="mb-6">You have cleared the area. What will you do next?</p>
        <div class="flex flex-col sm:flex-row justify-center items-center gap-4">
            <button onclick="startBattle('${biomeKey}')" class="btn btn-primary w-full sm:w-auto">Continue Exploring ${biome.name}</button>
            <button onclick="renderMainMenu()" class="btn btn-primary w-full sm:w-auto">Return to Menu</button>
        </div>
    </div>`;
    const container = document.createElement('div');
    container.innerHTML = html;
    render(container);
}

function renderGraveyard() {
    const graveyard = JSON.parse(localStorage.getItem('rpgGraveyard') || '[]');
    let html = `<div class="w-full text-center">
        <h2 class="font-medieval text-3xl mb-4 text-center">Graveyard</h2>
        <div class="h-80 overflow-y-auto inventory-scrollbar pr-2 space-y-3 text-left">`;
    
    if (graveyard.length === 0) {
        html += `<p class="text-gray-400 text-center">No heroes have fallen... yet.</p>`;
    } else {
        graveyard.forEach(entry => {
            html += `
                <div class="p-3 bg-slate-800 rounded-lg">
                    <p class="font-bold text-yellow-300">${entry.name} - Level ${entry.level}</p>
                    <p class="text-sm text-gray-400">${entry.cause}</p>
                    <p class="text-xs text-gray-500 mt-1">${entry.date}</p>
                </div>`;
        });
    }

    html += `</div>
        <div class="text-center mt-4">
            <button onclick="showStartScreen()" class="btn btn-primary">Back</button>
        </div>
    </div>`;

    $('#start-screen').classList.add('hidden');
    const screenContainer = $('#changelog-screen'); // Re-use this container
    screenContainer.innerHTML = html;
    screenContainer.classList.remove('hidden');
}

function renderChangelog() {
    $('#start-screen').classList.add('hidden');
    const changelogScreen = $('#changelog-screen');
    changelogScreen.classList.remove('hidden');

    let html = `<h2 class="font-medieval text-4xl mb-4 text-center text-yellow-400">Changelog</h2>
                <div class="bg-slate-800 rounded-lg p-6 h-96 overflow-y-auto inventory-scrollbar space-y-6">`;

    CHANGELOG_DATA.forEach(version => {
        html += `<div>
                    <h3 class="font-bold text-lg text-yellow-300">${version.version} <span class="text-sm text-gray-400 font-normal">- ${version.date}</span></h3>
                    <ul class="list-disc list-inside mt-2 space-y-1 text-gray-300">`;
        version.changes.forEach(change => {
            html += `<li>${change.replace(/"/g, '&quot;')}</li>`;
        });
        html += `   </ul>
                 </div>`;
    });

    html += `</div>
             <div class="text-center mt-6">
                <button onclick="showStartScreen()" class="btn btn-primary">Back</button>
             </div>`;
    
    changelogScreen.innerHTML = html;
}

window.castHealingSpellOutsideCombat = function(spellKey) {
    const spellData = SPELLS[spellKey];
    if (!spellData || spellData.element !== 'healing') return;

    if (player.hp >= player.maxHp) {
        addToLog("You are already at full health.", "text-yellow-400");
        return;
    }

    const catalyst = player.equippedCatalyst;
    if (!catalyst || catalyst.name === 'None') {
        addToLog("You need a catalyst equipped to cast spells.", "text-red-400");
        return;
    }
    
    const playerSpell = player.spells[spellKey];
    const spell = spellData.tiers[playerSpell.tier - 1];
    
    let finalSpellCost = spell.cost;
    const armor = player.equippedArmor;
    if (catalyst.effect?.mana_discount) {
        finalSpellCost = Math.max(1, finalSpellCost - catalyst.effect.mana_discount);
    }
    if (armor.effect?.mana_discount) {
        finalSpellCost = Math.max(1, finalSpellCost - armor.effect.mana_discount);
    }

    if (player.mp < finalSpellCost) {
        addToLog(`Not enough MP to cast ${spell.name}.`, "text-red-400");
        return;
    }

    player.mp -= finalSpellCost;

    let diceCount = spell.damage[0];
    const spellAmp = catalyst.effect?.spell_amp || 0;
    diceCount = Math.min(spell.cap, diceCount + spellAmp);

    const healAmount = rollDice(diceCount, spell.damage[1], `Healing Spell: ${spell.name}`) + player.magicalDamageBonus;
    
    player.hp = Math.min(player.maxHp, player.hp + healAmount);

    addToLog(`You cast ${spell.name} and recover <span class="font-bold text-green-400">${healAmount}</span> HP.`, 'text-green-300');
    
    updateStatsView();
    renderInventory(); // Re-render the inventory to update the button states
}

function renderBestiaryMenu(origin = 'inventory') {
    hideTooltip();
    gameState.currentView = 'bestiary';
    let backAction;
    if (origin === 'betty') {
        backAction = "startBettyDialogue()";
    } else {
        backAction = "renderInventory()";
    }

    let html = `<div class="w-full text-center">
        <h2 class="font-medieval text-3xl mb-4">Bestiary</h2>
        <p class="text-gray-400 mb-6">(Work in Progress)</p>
        <div class="h-80 overflow-y-auto inventory-scrollbar pr-2 space-y-3">
            <p class="text-gray-500">You haven't discovered any creatures yet.</p>
        </div>
        <div class="text-center mt-4">
            <button onclick="${backAction}" class="btn btn-primary">Back</button>
        </div>
    </div>`;
    const container = document.createElement('div');
    container.innerHTML = html;
    render(container);
}


// --- BETTY DIALOGUE FUNCTIONS ---

function startBettyDialogue() {
    gameState.currentView = 'dialogue'; // Prevent other actions
    $('#betty-encounter-popup').classList.add('hidden'); // Hide popup once dialogue starts

    // This is the first time the player is interacting with her in any capacity.
    if (!player.dialogueFlags.bettyMet) {
        player.dialogueFlags.bettyMet = true;
    }

    if (player.bettyQuestState === 'not_started' || player.bettyQuestState === 'declined') {
        renderBettyDialogue('first_encounter');
    } else if (player.bettyQuestState === 'accepted') {
        const randomIdle = BETTY_DIALOGUE.betty_idle[Math.floor(Math.random() * BETTY_DIALOGUE.betty_idle.length)];
        let html = `<div class="w-full text-center">
            <h2 class="font-medieval text-2xl mb-4">Betty's Corner</h2>
            <p class="text-gray-400 mb-6 italic">"${randomIdle}"</p>
            <div class="flex justify-center gap-4">
                <button onclick="renderBestiaryMenu('betty')" class="btn btn-primary">View Bestiary</button>
                <button onclick="renderTown()" class="btn btn-primary">Leave</button>
            </div>
        </div>`;
        const container = document.createElement('div');
        container.innerHTML = html;
        render(container);
    }
}


function renderBettyDialogue(sceneKey) {
    const scene = BETTY_DIALOGUE[sceneKey];
    if (!scene) return;

    let dialogueHtml = `<div class="w-full max-w-2xl mx-auto p-4 bg-slate-800 rounded-lg text-center">
        <p class="mb-6 italic text-gray-300">"${scene.prompt}"</p>
        <div class="flex flex-col gap-3">`;

    for (const key in scene.options) {
        const option = scene.options[key];
        dialogueHtml += `<button onclick="handleBettyResponse('${sceneKey}', '${key}')" class="btn btn-primary text-left">${option.text}</button>`;
    }
    
    dialogueHtml += `</div></div>`;
    
    const container = document.createElement('div');
    container.innerHTML = dialogueHtml;
    render(container);
}

function handleBettyResponse(sceneKey, optionKey) {
    const scene = BETTY_DIALOGUE[sceneKey];
    const option = scene.options[optionKey];

    // Display Betty's immediate response
    let responseHtml = `<div class="w-full max-w-2xl mx-auto p-4 bg-slate-800 rounded-lg text-center">
        <p class="mb-6 italic text-gray-300">"${option.response}"</p>
    </div>`;
    const container = document.createElement('div');
    container.innerHTML = responseHtml;
    render(container);

    // After a delay, move to the next part of the conversation
    setTimeout(() => {
        if (sceneKey === 'first_encounter') {
            renderBettyQuestProposal();
        } else if (sceneKey === 'quest_proposal') {
            switch(optionKey) {
                case 'A': // Accept
                    player.bettyQuestState = 'accepted';
                    player.addToInventory('bestiary_notebook');
                    let acceptHtml = `<div class="w-full max-w-2xl mx-auto p-4 bg-slate-800 rounded-lg text-center">
                        <p class="mb-6 italic text-gray-300">"${BETTY_DIALOGUE.quest_proposal.after_accept}"</p>
                        <button onclick="renderTown()" class="btn btn-primary">Finish</button>
                    </div>`;
                    container.innerHTML = acceptHtml;
                    render(container);
                    break;
                case 'B': // Decline
                    player.bettyQuestState = 'declined';
                    setTimeout(renderTown, 2000); // Go back to town after a short delay
                    break;
                case 'C': // Silent Accept
                    player.bettyQuestState = 'accepted';
                    player.addToInventory('bestiary_notebook');
                    let silentAcceptHtml = `<div class="w-full max-w-2xl mx-auto p-4 bg-slate-800 rounded-lg text-center">
                        <p class="mb-6 italic text-gray-300">"${BETTY_DIALOGUE.quest_proposal.after_accept_silent}"</p>
                        <button onclick="renderTown()" class="btn btn-primary">Finish</button>
                    </div>`;
                    container.innerHTML = silentAcceptHtml;
                    render(container);
                    break;
            }
        }
    }, 2500); // 2.5 second delay
}

function renderBettyQuestProposal() {
    const scene = BETTY_DIALOGUE.quest_proposal;
    let dialogueHtml = `<div class="w-full max-w-2xl mx-auto p-4 bg-slate-800 rounded-lg text-center">
        <div class="space-y-4 mb-6 italic text-gray-300">`;

    scene.intro.forEach(line => {
        dialogueHtml += `<p>"${line}"</p>`;
    });

    dialogueHtml += `</div><div class="flex flex-col gap-3">`;

    for (const key in scene.options) {
        const option = scene.options[key];
        dialogueHtml += `<button onclick="handleBettyResponse('quest_proposal', '${key}')" class="btn btn-primary text-left">${option.text}</button>`;
    }
    
    dialogueHtml += `</div></div>`;
    
    const container = document.createElement('div');
    container.innerHTML = dialogueHtml;
    render(container);
}
