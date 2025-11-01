let statAllocationAmount = 1;
let storageSortOrder = 'category';
// State for inventory tab
let inventoryActiveTab = 'consumables'; // Default tab

function setStorageSortOrder(order) {
    storageSortOrder = order;
    renderHouseStorage();
}

function getWeaponStatsString(weapon) {
    if (!weapon || !weapon.name) return 'None';

    let stats = [];
    stats.push(`${weapon.damage[0]}d${weapon.damage[1]}`);

    // Add specific weapon effect stats
    if(weapon.effect?.critChance) stats.push(`Crit: ${weapon.effect.critChance*100}%`);
    if(weapon.effect?.armorPierce) stats.push(`Pierce: ${weapon.effect.armorPierce*100}%`);


    const elementText = player.weaponElement !== 'none' ? ` <span class="font-bold text-cyan-300">[${capitalize(player.weaponElement)}]</span>` : '';
    return `${weapon.name} (${stats.join(', ')})${elementText}`;
}

function getCatalystStatsString(catalyst) {
    if (!catalyst || !catalyst.name || catalyst.name === 'None') return 'None';
    let stats = [];
    if (catalyst.effect?.spell_amp) stats.push(`+${catalyst.effect.spell_amp} Dice`);
    if (catalyst.effect?.mana_discount) stats.push(`-${catalyst.effect.mana_discount} Cost`);
    if (catalyst.effect?.hp_regen) stats.push(`+${catalyst.effect.hp_regen}HP/t`);
    if (catalyst.effect?.mana_regen) stats.push(`+${catalyst.effect.mana_regen}MP/t`);
    if (catalyst.effect?.spell_crit_chance) stats.push(`${catalyst.effect.spell_crit_chance * 100}% Crit`);
    if (catalyst.effect?.spell_vamp) stats.push(`Vamp`);
    if (catalyst.effect?.spell_penetration) stats.push(`Pen`);
    // Removed spell_sniper display
    if (catalyst.effect?.overdrive) stats.push(`Overdrive`);
    if (catalyst.effect?.battlestaff) stats.push(`Battlestaff`);
    if (catalyst.effect?.spell_weaver) stats.push(`Weaver`);
    // Removed ranged_chance display
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
    if (player.race) {
        detailsText.push(player.race);
        // Add elemental affinity to details if it exists
        if (player.race === 'Elementals' && player.elementalAffinity) {
            detailsText.push(`(${capitalize(player.elementalAffinity)})`);
        }
    }
    if (player.class) detailsText.push(player.class);
    if (player.background) detailsText.push(player.background);
    if (player.difficulty) detailsText.push(capitalize(player.difficulty));
    elements.details.textContent = detailsText.join(' | ');

    elements.level.textContent = player.level;
    elements.gold.textContent = player.gold;
    elements.hp.textContent = `${player.hp} / ${player.maxHp}`;
    elements.mp.textContent = `${player.mp} / ${player.maxMp}`;
    elements.xp.textContent = `${player.xp} / ${player.xpToNextLevel}`;

     // Calculate HP percentage safely
     const currentHp = Number(player.hp) || 0;
     const maxHp = Number(player.maxHp) || 1; // Avoid division by zero
     const hpPercent = maxHp > 0 ? Math.max(0, Math.min(100, (currentHp / maxHp) * 100)) : 0;
     $('#player-hp-bar').style.width = `${hpPercent}%`;

     // Calculate MP percentage safely
     const currentMp = Number(player.mp) || 0;
     const maxMp = Number(player.maxMp) || 1; // Avoid division by zero
     const mpPercent = maxMp > 0 ? Math.max(0, Math.min(100, (currentMp / maxMp) * 100)) : 0;
     $('#player-mp-bar').style.width = `${mpPercent}%`; // Use safe percentage

     // Calculate XP percentage safely
     const currentXp = Number(player.xp) || 0;
     const nextLevelXp = Number(player.xpToNextLevel) || 1; // Avoid division by zero
     const xpPercent = nextLevelXp > 0 ? Math.max(0, Math.min(100, (currentXp / nextLevelXp) * 100)) : 0;
     $('#player-xp-bar').style.width = `${xpPercent}%`; // Use safe percentage


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
            if (player.activeQuest.category === 'collection' || player.activeQuest.category === 'creation') {
                progress = 0;
                const itemDetails = getItemDetails(quest.target);
                if (itemDetails) {
                     if (quest.target in ITEMS) progress = player.inventory.items[quest.target] || 0;
                     else {
                        let category;
                        if (quest.target in WEAPONS) category = 'weapons';
                        else if (quest.target in ARMOR) category = 'armor';
                        else if (quest.target in SHIELDS) category = 'shields';
                        else if (quest.target in CATALYSTS) category = 'catalysts';
                        if(category && player.inventory[category]) {
                           progress = player.inventory[category].filter(item => item === quest.target).length;
                        }
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

// --- NEW HELPER FUNCTIONS FOR renderCharacterSheet ---

/**
 * Builds the HTML for the Main Stats allocation section.
 * @param {number} currentStatPoints - The player's available stat points.
 * @returns {string} HTML string for the main stats.
 */
function _buildCharSheetMainStats(currentStatPoints) {
    const mainStats = ['vigor', 'focus', 'stamina', 'strength', 'intelligence', 'luck'];
    return mainStats.map(stat => {
        const bonusStatKey = 'bonus' + capitalize(stat);
        const pointsSpentThisSession = (player[bonusStatKey] || 0) - (characterSheetOriginalStats[bonusStatKey] || 0);
        const canDecrease = pointsSpentThisSession >= statAllocationAmount;
        const canIncrease = currentStatPoints >= statAllocationAmount;

        return `<div class="grid grid-cols-3 items-center bg-slate-800 px-1 py-0.5 rounded">
                    <span class="font-semibold capitalize text-sm col-span-1">${stat}</span>
                    <div class="col-span-2 flex items-center justify-end">
                        <button onclick="deallocatePoint('${stat}', statAllocationAmount)" class="btn btn-action text-sm py-0 px-2 leading-none w-7 h-7" ${!canDecrease ? 'disabled' : ''}>-</button>
                        <span class="text-sm mx-1 w-8 text-center font-semibold">${player[stat]}</span>
                        <button onclick="allocatePoint('${stat}', statAllocationAmount)" class="btn btn-primary text-sm py-0 px-2 leading-none w-7 h-7" ${!canIncrease ? 'disabled' : ''}>+</button>
                    </div>
                 </div>`;
    }).join('');
}

/**
 * Builds the HTML for the Derived Stats section.
 * @returns {string} HTML string for the derived stats.
 */
function _buildCharSheetDerivedStats() {
    const derivedStats = {
        'Max HP': 'maxHp', 'Max MP': 'maxMp',
        'Physical Def': 'physicalDefense', 'Magical Def': 'magicalDefense',
        'Physical Dmg Bonus': 'physicalDamageBonus', 'Magical Dmg Bonus': 'magicalDamageBonus',
        'Crit Chance': 'critChance', 'Evasion Chance': 'evasionChance', 'Debuff Resist': 'resistanceChance'
    };

    return Object.entries(derivedStats).map(([label, key]) => {
        let value = player[key];
        if (typeof value === 'number') {
            if (key.includes('Chance') || key.includes('Resist')) {
                 value = `${(value * 100).toFixed(1)}%`;
            } else {
                 value = Math.floor(value);
            }
         } else {
             value = 'N/A';
         }
        return `<div class="flex justify-between text-xs"><span>${label}:</span><span class="font-semibold">${value}</span></div>`;
    }).join('');
}

/**
 * Builds the HTML for the Racial Passive and Class Ability sections.
 * @returns {object} Object containing HTML for both sections.
 */
function _buildCharSheetAbilities() {
    // Racial Passive
    const racialPassiveData = RACES[player.race]?.passive;
    let racialPassiveHtml = '';
    if (racialPassiveData) {
        racialPassiveHtml = `<p class="font-semibold text-cyan-300">${racialPassiveData.name}</p>
                             <p class="text-gray-400 mt-1">${racialPassiveData.description}</p>`;
        const evolutionText = racialPassiveData.evolutionDescription || racialPassiveData.evolution;
        if (evolutionText && player.level >= 20) {
             racialPassiveHtml += `<p class="text-green-400 mt-1">Level 20+ Evolution: ${evolutionText}</p>`;
        }
    } else {
        racialPassiveHtml = `<p class="text-gray-500">None</p>`;
    }

    // Class Ability
    const signatureAbilityData = player.signatureAbilityData;
    let classAbilityHtml = '';
    // --- REMOVED DEBUG LOG ---
    if (signatureAbilityData) {
        classAbilityHtml = `<p class="font-semibold text-cyan-300">${signatureAbilityData.name} <span class="text-gray-400 font-normal">(${capitalize(signatureAbilityData.type)})</span></p>
                            <p class="text-gray-400 mt-1">${signatureAbilityData.description}</p>`;
        if (signatureAbilityData.cost > 0 && signatureAbilityData.type !== 'toggle') {
            classAbilityHtml += `<p class="text-blue-400 text-xs">Cost: ${signatureAbilityData.cost} MP</p>`;
        }
    } else {
        classAbilityHtml = `<p class="text-gray-500">None</p>`;
    }

    return { racialPassiveHtml, classAbilityHtml };
}

/**
 * Builds the HTML for the Active Food Buffs section.
 * @returns {string} HTML string for food buffs.
 */
function _buildCharSheetFoodBuffs() {
    let foodBuffsHtml = '';
    let hasBuffs = false;
    for (const buffKey in player.foodBuffs) {
        hasBuffs = true;
        const buff = player.foodBuffs[buffKey];
        const statName = buffKey.replace(/_/g, ' ');
        let valueDisplay = '';
        if (buffKey === 'movement_speed') {
             valueDisplay = `+${buff.value}`;
        } else {
             valueDisplay = `+${((buff.value - 1) * 100).toFixed(0)}%`;
        }
        foodBuffsHtml += `<div class="flex justify-between text-xs"><span>${capitalize(statName)}:</span><span class="font-semibold text-green-400">${valueDisplay} (${buff.duration} enc.)</span></div>`;
    }
    if (!hasBuffs) {
        foodBuffsHtml = `<p class="text-center text-gray-500 text-xs">None</p>`;
    }
    return foodBuffsHtml;
}


function renderCharacterSheet(isLevelUp = false) {
    if (gameState.currentView === 'battle') {
        addToLog("You cannot access your character sheet during combat!", 'text-red-400');
        return;
    }
    if (!player) return;

    // Snapshot current stats if opening the sheet for allocation
    if (!characterSheetOriginalStats) {
        characterSheetOriginalStats = {
            vigor: player.vigor, focus: player.focus, stamina: player.stamina,
            strength: player.strength, intelligence: player.intelligence, luck: player.luck,
            statPoints: player.statPoints || 0,
            bonusVigor: player.bonusVigor || 0, bonusFocus: player.bonusFocus || 0, bonusStamina: player.bonusStamina || 0,
            bonusStrength: player.bonusStrength || 0, bonusIntelligence: player.bonusIntelligence || 0, bonusLuck: player.bonusLuck || 0
        };
    }

    lastViewBeforeInventory = 'character_sheet'; // Set the return view
    gameState.currentView = isLevelUp ? 'character_sheet_levelup' : 'character_sheet'; // Set current view state

    const currentStatPoints = player.statPoints || 0;
    const hasChanges = currentStatPoints !== characterSheetOriginalStats.statPoints;

    // --- Build HTML using helper functions ---
    const mainStatsHtml = _buildCharSheetMainStats(currentStatPoints);
    const derivedStatsHtml = _buildCharSheetDerivedStats();
    const { racialPassiveHtml, classAbilityHtml } = _buildCharSheetAbilities();
    const foodBuffsHtml = _buildCharSheetFoodBuffs();


    // --- Assemble Final HTML ---
    // This is now much cleaner and just assembles the parts.
    let html = `
    <div class="w-full text-left">
        <h2 class="font-medieval text-2xl mb-2 text-center">Character Sheet</h2>

        <!-- Allocation Controls -->
        <div class="flex justify-between items-center mb-2 p-1 bg-slate-900/50 rounded-lg text-sm">
            <div>
                <span class="mr-2 font-semibold">Allocate:</span>
                <button onclick="setStatAllocationAmount(1)" class="btn ${statAllocationAmount === 1 ? 'bg-yellow-600 border-yellow-800' : 'btn-primary'} text-xs py-1 px-2 w-10">1x</button>
                <button onclick="setStatAllocationAmount(5)" class="btn ${statAllocationAmount === 5 ? 'bg-yellow-600 border-yellow-800' : 'btn-primary'} text-xs py-1 px-2 w-10">5x</button>
                <button onclick="setStatAllocationAmount(25)" class="btn ${statAllocationAmount === 25 ? 'bg-yellow-600 border-yellow-800' : 'btn-primary'} text-xs py-1 px-2 w-10">25x</button>
            </div>
            <p class="text-green-400 font-bold">Points: <span id="stat-points">${currentStatPoints}</span></p>
        </div>

        <!-- Stats & Abilities Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-4">
            <!-- Left Column: Stats -->
            <div class="space-y-2">
                <div>
                    <h3 class="font-bold text-lg text-yellow-300 mb-1">Main Stats</h3>
                    <div class="space-y-px">${mainStatsHtml}</div>
                </div>
                <div>
                    <h3 class="font-bold text-lg text-yellow-300 mb-1 mt-2">Derived Stats</h3>
                    <div class="space-y-0.5 bg-slate-800 p-2 rounded">${derivedStatsHtml}</div>
                </div>
            </div>
            <!-- Right Column: Abilities & Buffs -->
            <div class="space-y-2 mt-2 md:mt-0">
                 <div>
                    <h3 class_ ="font-bold text-lg text-yellow-300 mb-1">Racial Passive</h3>
                    <div class="text-xs bg-slate-800 p-2 rounded">${racialPassiveHtml}</div>
                </div>
                <div>
                    <h3 class="font-bold text-lg text-yellow-300 mb-1">Class Ability</h3>
                    <div class="text-xs bg-slate-800 p-2 rounded">${classAbilityHtml}</div>
                </div>
                 <div>
                    <h3 class="font-bold text-lg text-yellow-300 mb-1">Active Food Buffs</h3>
                    <div id="food-buff-tracker" class="space-y-0.5 bg-slate-800 p-2 rounded">${foodBuffsHtml}</div>
                 </div>
                 <!-- Action Buttons moved to right column bottom -->
                 <div class="text-center mt-2 flex justify-center gap-4">
                    <button onclick="resetStatAllocation()" class="btn btn-action" ${!hasChanges ? 'disabled' : ''}>Reset</button>
                    <button onclick="confirmStatAllocation()" class="btn btn-primary">Done</button>
                </div>
            </div>
        </div>
    </div>`;

    const container = document.createElement('div');
    container.innerHTML = html;
    render(container);
}

function renderCharacterCreation() {
    $('#start-screen').classList.add('hidden');
    const creationScreen = $('#character-creation-screen');
    creationScreen.classList.remove('hidden');

    // Ensure all steps are hidden initially, then show step 0
    for (let i = 0; i <= 4; i++) { // Hide steps 0 through 4
        const step = $(`#creation-step-${i}`);
        if (step) step.classList.add('hidden');
    }
    $('#creation-step-0').classList.remove('hidden'); // Show difficulty selection first

    if (isTutorialEnabled) {
        startTutorialSequence('creation_welcome');
    }

    // Initialize creationState, including elementalAffinity
    let creationState = { name: '', gender: null, race: null, class: null, background: null, difficulty: 'hardcore', elementalAffinity: null };

    const switchStep = (from, to) => {
        $(`#creation-step-${from}`)?.classList.add('hidden'); // Add safety check
        $(`#creation-step-${to}`)?.classList.remove('hidden'); // Add safety check

        // Focus the name input if switching to Step 1
        if (to === 1) {
             $('#new-char-name')?.focus(); // Add safety check
        }

        if (isTutorialEnabled) {
            // Trigger tutorial steps based on the step being switched *to*
            if (to === 1) startTutorialSequence('creation_step1'); // Covers Name/Gender
            // Note: Race, Class, Background tutorials are handled within their respective steps if needed
            // else if (to === 2) { /* Maybe trigger race tutorial? */ }
            // else if (to === 3) startTutorialSequence('creation_step2'); // Class
            // else if (to === 4) startTutorialSequence('creation_step3'); // Background
        }
    };

    // --- Difficulty Step (0) ---
    $('#difficulty-easy').onclick = () => { creationState.difficulty = 'easy'; switchStep(0, 1); };
    $('#difficulty-medium').onclick = () => { creationState.difficulty = 'medium'; switchStep(0, 1); };
    $('#difficulty-hardcore').onclick = () => { creationState.difficulty = 'hardcore'; switchStep(0, 1); };
    $('#creation-back-to-start-btn').onclick = showStartScreen; // Back to main menu

    // --- Name & Gender Step (1) ---
    const genderButtons = document.querySelectorAll('#gender-selection button');
    genderButtons.forEach(button => {
        button.onclick = () => {
            genderButtons.forEach(btn => {
                btn.classList.remove('bg-yellow-600', 'border-yellow-800');
                btn.classList.add('btn-primary');
            });
            button.classList.add('bg-yellow-600', 'border-yellow-800');
            button.classList.remove('btn-primary');
            creationState.gender = button.dataset.gender;
        };
    });
    $('#back-to-step-0-btn').onclick = () => switchStep(1, 0); // Back to Difficulty
    $('#to-step-2-btn').onclick = () => { // Forward to Race
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

        if (!hasError) {
            switchStep(1, 2);
        }
    };

    // --- Race Step (2) ---
    const affinityContainer = $('#elemental-affinity-container');
    const affinitySelect = $('#elemental-affinity-select');
    affinitySelect.value = 'fire'; // Default to fire
    creationState.elementalAffinity = 'fire'; // Set default state
    affinitySelect.innerHTML = Object.keys(ELEMENTS)
        .filter(e => e !== 'none' && e !== 'healing')
        .map(e => `<option value="${e}">${capitalize(e)}</option>`)
        .join('');
    affinitySelect.onchange = () => {
        creationState.elementalAffinity = affinitySelect.value;
    };

    const raceListContainer = $('#race-selection-list');
    raceListContainer.innerHTML = ''; // Clear previous buttons if any
    Object.keys(RACES).forEach(raceKey => {
        const raceData = RACES[raceKey];
        const button = document.createElement('button');
        button.className = 'btn btn-primary w-full text-left';
        button.dataset.race = raceKey;
        button.textContent = raceKey;

        const raceDetailsBox = $('#race-details'); // Details box for this step

        button.addEventListener('mouseenter', () => {
            let statsHtml = Object.entries(raceData)
                .filter(([key]) => key !== 'description' && key !== 'passive')
                .map(([stat, value]) => `<div class="grid grid-cols-2"><span>${stat}</span><span class="font-bold text-yellow-300 text-right">${value}</span></div>`)
                .join('');

            let abilityHtml = '';
            if (raceData.passive) {
                abilityHtml = `<h5 class="font-bold mt-3 mb-1 text-cyan-300">Passive: ${raceData.passive.name}</h5>
                               <p>${raceData.passive.description}</p>`;
                // Removed the evolution description rendering for character creation
            }

            raceDetailsBox.innerHTML = `
                <h4 id="race-details-name" class="font-bold text-xl text-yellow-300 mb-2">${raceKey}</h4>
                <p id="race-details-description" class="text-sm text-gray-400 mb-4">${raceData.description}</p>
                <div id="race-details-stats" class="text-sm space-y-1 mb-4">${statsHtml}</div>
                <div id="race-details-ability" class="text-xs border-t border-slate-600 pt-2 mt-2">${abilityHtml}</div>`;
        });

        button.addEventListener('click', () => {
            document.querySelectorAll('#race-selection-list button').forEach(btn => {
                btn.classList.remove('bg-yellow-600', 'border-yellow-800');
                btn.classList.add('btn-primary');
            });
            button.classList.add('bg-yellow-600', 'border-yellow-800');
            button.classList.remove('btn-primary');
            creationState.race = raceKey;

            // Show/Hide Affinity Dropdown
            if (raceKey === 'Elementals') {
                affinityContainer.classList.remove('hidden');
                creationState.elementalAffinity = affinitySelect.value; // Ensure state matches dropdown
            } else {
                affinityContainer.classList.add('hidden');
                creationState.elementalAffinity = null; // Clear affinity if not Elemental
            }
            // Trigger mouseenter to update details on click
            button.dispatchEvent(new MouseEvent('mouseenter'));
        });
        raceListContainer.appendChild(button);
    });

    $('#back-to-step-1-btn').onclick = () => switchStep(2, 1); // Back to Name/Gender
    $('#to-step-3-btn').onclick = () => { // Forward to Class
        let hasError = false;
        if (!creationState.race) {
            $('#race-label').classList.add('animate-pulse', 'text-red-400');
            setTimeout(() => $('#race-label').classList.remove('animate-pulse', 'text-red-400'), 1000);
            hasError = true;
        }
        if (creationState.race === 'Elementals' && !creationState.elementalAffinity) {
            $('#elemental-affinity-label').classList.add('animate-pulse', 'text-red-400');
            setTimeout(() => $('#elemental-affinity-label').classList.remove('animate-pulse', 'text-red-400'), 1000);
            hasError = true;
        }
        if (!hasError) {
            switchStep(2, 3);
        }
    };

    // --- Class Step (3) ---
    const classListContainer = $('#class-selection-list');
    classListContainer.innerHTML = ''; // Clear previous buttons
    Object.keys(CLASSES).forEach(classKey => {
        const classData = CLASSES[classKey];
        const button = document.createElement('button');
        button.className = 'btn btn-primary w-full text-left';
        button.dataset.class = classKey;
        button.textContent = classData.name;

        const classDetailsBox = $('#class-details'); // Details box for this step

        button.addEventListener('mouseenter', () => {
            let statsHtml = '<h5 class="font-bold mt-3 mb-1 text-yellow-300">Stat Bonuses</h5>';
            statsHtml += '<div class="grid grid-cols-2">';
            statsHtml += Object.entries(classData.bonusStats).map(([stat, value]) => {
                const sign = value > 0 ? '+' : '';
                const color = value > 0 ? 'text-green-400' : 'text-red-400';
                return `<span>${capitalize(stat)}</span><span class="${color} text-right">${sign}${value}</span>`;
            }).join('');
            statsHtml += '</div>';

            let gearHtml = '<h5 class="font-bold mt-3 mb-1 text-yellow-300">Starting Gear</h5>';
            const gear = Object.values(classData.startingEquipment)
                              .map(key => getItemDetails(key)?.name)
                              .filter(Boolean).join(', ') || 'None';
            gearHtml += `<p class="text-xs">${gear}</p>`;

             let abilityHtml = '';
             const abilityData = classData.signatureAbility;
             if (abilityData && abilityData.name !== "Placeholder Signature") { // Check if not placeholder
                 abilityHtml = `<h5 class="font-bold mt-3 mb-1 text-cyan-300">Ability: ${abilityData.name} <span class="text-gray-400 font-normal">(${capitalize(abilityData.type)})</span></h5>
                                <p>${abilityData.description}</p>`;
                 if (abilityData.cost > 0) {
                      abilityHtml += `<p class="text-blue-400">Cost: ${abilityData.cost} MP</p>`;
                 }
             } else {
                  abilityHtml = `<h5 class="font-bold mt-3 mb-1 text-gray-500">Ability: None defined yet</h5>`;
             }


            classDetailsBox.innerHTML = `
                <h4 id="class-details-name" class="font-bold text-xl text-yellow-300 mb-2">${classData.name}</h4>
                <p id="class-details-description" class="text-sm text-gray-400 mb-4">${classData.description}</p>
                <div id="class-details-stats" class="text-sm space-y-1 mb-4">${statsHtml}${gearHtml}</div>
                <div id="class-details-ability" class="text-xs border-t border-slate-600 pt-2 mt-2">${abilityHtml}</div>`;
        });

        button.addEventListener('click', () => {
            document.querySelectorAll('#class-selection-list button').forEach(btn => {
                btn.classList.remove('bg-yellow-600', 'border-yellow-800');
                btn.classList.add('btn-primary');
            });
            button.classList.add('bg-yellow-600', 'border-yellow-800');
            button.classList.remove('btn-primary');
            creationState.class = classKey; // Store the KEY
            // Trigger mouseenter to update details on click
            button.dispatchEvent(new MouseEvent('mouseenter'));
        });
        classListContainer.appendChild(button);
    });

    $('#back-to-step-2-btn').onclick = () => switchStep(3, 2); // Back to Race
    $('#to-step-4-btn').onclick = () => { // Forward to Background
        if (!creationState.class) {
            $('#class-label').classList.add('animate-pulse', 'text-red-400');
            setTimeout(() => $('#class-label').classList.remove('animate-pulse', 'text-red-400'), 1000);
            return;
        }
        switchStep(3, 4);
    };

    // --- Background Step (4) ---
    const backgroundListContainer = $('#background-selection-list');
    backgroundListContainer.innerHTML = ''; // Clear previous buttons
    Object.keys(BACKGROUNDS).forEach(bgKey => {
        const bgData = BACKGROUNDS[bgKey];
        const button = document.createElement('button');
        button.className = 'btn btn-primary w-full text-left';
        button.dataset.bg = bgKey;
        button.textContent = bgData.name;

        const backgroundDetailsBox = $('#background-details'); // Details box for this step

        button.addEventListener('mouseenter', () => {
            let detailsHtml = '<h5 class="font-bold mt-3 mb-1 text-yellow-300">Favored Stats</h5>';
            const favoredStats = bgData.favoredStats.map(s => capitalize(s)).join(', ') || 'All';
            detailsHtml += `<p class="text-xs">${favoredStats}</p>`;

            backgroundDetailsBox.innerHTML = `
                <h4 id="background-details-name" class="font-bold text-xl text-yellow-300 mb-2">${bgData.name}</h4>
                <p id="background-details-description" class="text-sm text-gray-400 mb-4">${bgData.description}</p>
                <div id="background-details-stats" class="text-sm space-y-1">${detailsHtml}</div>`;
        });

        button.addEventListener('click', () => {
            document.querySelectorAll('#background-selection-list button').forEach(btn => {
                btn.classList.remove('bg-yellow-600', 'border-yellow-800');
                btn.classList.add('btn-primary');
            });
            button.classList.add('bg-yellow-600', 'border-yellow-800');
            button.classList.remove('btn-primary');
            creationState.background = bgKey; // Store the KEY
             // Trigger mouseenter to update details on click
             button.dispatchEvent(new MouseEvent('mouseenter'));
        });
        backgroundListContainer.appendChild(button);
    });

    $('#back-to-step-3-btn').onclick = () => switchStep(4, 3); // Back to Class
    $('#finalize-creation-btn').onclick = () => { // Finalize
        if (!creationState.background) {
            $('#background-label').classList.add('animate-pulse', 'text-red-400');
            setTimeout(() => $('#background-label').classList.remove('animate-pulse', 'text-red-400'), 1000);
            return;
        }

        if (isTutorialEnabled) {
            startTutorialSequence('creation_finalize');
            advanceTutorial(creationState.name); // Pass name to final message
        }

        setTimeout(() => {
            initGame(creationState.name, creationState.gender, creationState.race, creationState.class, creationState.background, creationState.difficulty, creationState.elementalAffinity);
        }, isTutorialEnabled ? 2500 : 0);
    };
}


window.setStatAllocationAmount = function(amount) {
    statAllocationAmount = amount;
    renderCharacterSheet(gameState.currentView === 'character_sheet_levelup');
}


window.allocatePoint = function(stat, amount) {
     const currentStatPoints = player.statPoints || 0;
    if (currentStatPoints >= amount) {
        // --- Store current and max values BEFORE changes ---
        const oldHp = player.hp;
        const oldMp = player.mp;
        const oldMaxHp = player.maxHp;
        const oldMaxMp = player.maxMp;

        player[stat]+= amount;
        const bonusStatKey = 'bonus' + capitalize(stat);
         // Ensure bonus stat exists before adding
         player[bonusStatKey] = (player[bonusStatKey] || 0) + amount;


        player.recalculateGrowthBonuses(); // Recalculate derived stats (updates maxHp/maxMp)

        player.statPoints = currentStatPoints - amount; // Update points

        // --- Restore HP/MP and add specific bonus ---
        player.hp = oldHp; // Restore old HP first
        player.mp = oldMp; // Restore old MP first

        // Calculate and add only the *direct* HP/MP gain from Vigor/Focus
        let hpGain = 0;
        let mpGain = 0;

        if (stat === 'vigor') {
            // HP gain is 5 per point of Vigor spent
            hpGain = amount * 5;
            // Add the gain, but don't exceed the NEW max HP
            player.hp = Math.min(player.maxHp, player.hp + hpGain);
        } else {
            // If Vigor didn't change, still need to clamp HP to the potentially changed max HP
            // (e.g., if a background bonus calculation changed slightly)
            player.hp = Math.min(player.maxHp, player.hp);
        }

        if (stat === 'focus') {
            // MP gain is 5 per point of Focus spent
            mpGain = amount * 5;
            // Add the gain, but don't exceed the NEW max MP
            player.mp = Math.min(player.maxMp, player.mp + mpGain);
        } else {
            // Clamp MP similar to HP
            player.mp = Math.min(player.maxMp, player.mp);
        }

        // --- REMOVED full HP/MP refill lines ---
        // player.hp = player.maxHp;
        // player.mp = player.maxMp;

        updateStatsView(); // Update main UI
        renderCharacterSheet(gameState.currentView === 'character_sheet_levelup'); // Re-render sheet
    }
}


window.deallocatePoint = function(stat, amount) {
    const bonusStatKey = 'bonus' + capitalize(stat);
    // Calculate points spent ONLY in this session
     const originalBonusStat = characterSheetOriginalStats ? (characterSheetOriginalStats[bonusStatKey] || 0) : 0;
     const currentBonusStat = player[bonusStatKey] || 0;
    const pointsSpentThisSession = currentBonusStat - originalBonusStat;


    // Check if we can actually decrease by the desired amount
    if (pointsSpentThisSession >= amount) {
        // --- Store current HP/MP BEFORE changes ---
        const oldHp = player.hp;
        const oldMp = player.mp;

        player[stat] -= amount; // Decrease base stat
        player[bonusStatKey] = currentBonusStat - amount; // Decrease bonus stat


        player.recalculateGrowthBonuses(); // Recalculate derived (updates maxHp/maxMp)

        player.statPoints = (player.statPoints || 0) + amount; // Refund points

        // --- Restore old HP/MP and clamp to NEW max values ---
        player.hp = Math.min(player.maxHp, oldHp);
        player.mp = Math.min(player.maxMp, oldMp);
        // --- REMOVED full HP/MP refill lines ---
        // player.hp = player.maxHp;
        // player.mp = player.maxMp;

        updateStatsView(); // Update main UI
        renderCharacterSheet(gameState.currentView === 'character_sheet_levelup'); // Re-render sheet
    }
}


function resetStatAllocation() {
    if (!characterSheetOriginalStats) return;

    // --- Store current HP/MP BEFORE changes ---
    const oldHp = player.hp;
    const oldMp = player.mp;

    // Reset base stats by subtracting the difference added this session
    player.vigor -= ((player.bonusVigor || 0) - (characterSheetOriginalStats.bonusVigor || 0));
    player.focus -= ((player.bonusFocus || 0) - (characterSheetOriginalStats.bonusFocus || 0));
    player.stamina -= ((player.bonusStamina || 0) - (characterSheetOriginalStats.bonusStamina || 0));
    player.strength -= ((player.bonusStrength || 0) - (characterSheetOriginalStats.bonusStrength || 0));
    player.intelligence -= ((player.bonusIntelligence || 0) - (characterSheetOriginalStats.bonusIntelligence || 0));
    player.luck -= ((player.bonusLuck || 0) - (characterSheetOriginalStats.bonusLuck || 0));


    // Reset bonus stats to original values
    player.bonusVigor = characterSheetOriginalStats.bonusVigor || 0;
    player.bonusFocus = characterSheetOriginalStats.bonusFocus || 0;
    player.bonusStamina = characterSheetOriginalStats.bonusStamina || 0;
    player.bonusStrength = characterSheetOriginalStats.bonusStrength || 0;
    player.bonusIntelligence = characterSheetOriginalStats.bonusIntelligence || 0;
    player.bonusLuck = characterSheetOriginalStats.bonusLuck || 0;

    // Restore original stat points
    player.statPoints = characterSheetOriginalStats.statPoints || 0;


    player.recalculateGrowthBonuses(); // Recalculate derived stats (updates maxHp/maxMp)

    // --- Restore old HP/MP and clamp to NEW max values ---
    player.hp = Math.min(player.maxHp, oldHp);
    player.mp = Math.min(player.maxMp, oldMp);
    // --- REMOVED full HP/MP refill lines ---
    // player.hp = player.maxHp;
    // player.mp = player.maxMp;


    addToLog("Stat allocation has been reset.", "text-yellow-400");
    updateStatsView(); // Update main UI
    renderCharacterSheet(gameState.currentView === 'character_sheet_levelup'); // Re-render sheet
}
function confirmStatAllocation() {
    if (!player) return;
    characterSheetOriginalStats = null; // Clear the original stats snapshot
    addToLog("Your attributes have been confirmed.", "text-green-400");
    saveGame(); // Save the allocated points


    // Determine where to go next
    if (gameState.currentView === 'character_sheet_levelup') {
        renderTownSquare(); // Go to town after level up allocation
    } else {
        returnFromInventory(); // Go back to the previous view if just checking sheet
    }
}

// ... (rest of the functions remain the same) ...

function returnFromInventory() {
     // If coming back from character sheet, ensure original stats are cleared
     if (lastViewBeforeInventory === 'character_sheet' || gameState.currentView === 'character_sheet_levelup') {
          characterSheetOriginalStats = null;
     }

    // NEW: Reset active inventory tab when leaving inventory/sheet
    inventoryActiveTab = 'consumables'; // Reset to default

    switch (lastViewBeforeInventory) {
        case 'town': renderTownSquare(); break;
        case 'character_sheet': renderTownSquare(); break; // Go back to town if closed from sheet normally
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
        case 'witchs_coven': renderWitchsCoven(); break;
        case 'sell': renderSell(); break;
        case 'battle': renderBattleGrid(); break; // Shouldn't happen, but fallback
        case 'post_battle': renderPostBattleMenu(); break;
        case 'wilderness': renderWildernessMenu(); break;
        case 'settings': renderTownSquare(); break; // Or return to the view before settings
         case 'house': renderHouse(); break; // Added house case
         case 'house_storage': renderHouseStorage(); break;
         case 'garden': renderGarden(); break;
         case 'kitchen': renderKitchen(); break;
         case 'alchemy_lab': renderAlchemyLab(); break;
         case 'training_grounds': renderTrainingGrounds(); break;
         case 'library': renderLibrary(); break; // Added library
         // --- MODIFIED: Adjust Enchanter returns ---
         case 'enchanter': renderArcaneQuarter(); break; // Should not happen now, but keep fallback
         case 'enchanter_menu': renderArcaneQuarter(); break; // Back from main enchanter menu
         case 'enchanter_shop': renderEnchanterMenu(); break; // Back from shop goes to enchanter menu
         case 'enchanter_enchant': renderEnchanterMenu(); break; // Back from enchant goes to enchanter menu
         // --- END MODIFICATION ---
        default: renderTownSquare();
    }
}


function exitGame() {
    addToLog('Saving your progress...');
    saveGame(); // Ensure game is saved before exiting
    setTimeout(() => {
        window.location.hash = 'menu'; // Navigate back to menu
        // showStartScreen might be called by hash change, but call directly too for safety
         showStartScreen();
    }, 1000);
}

function renderWildernessMenu() {
    updateRealTimePalette();
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
        <div class="text-center mt-4"><button onclick="renderTownSquare()" class="btn btn-primary">Back to Town</button></div>
    </div>`;
    const container = document.createElement('div');
    container.innerHTML = html;
    render(container);
}

function renderTown() {
    renderTownSquare();
}

function renderTownSquare() {
    updateRealTimePalette();

    lastViewBeforeInventory = 'town';
    gameState.currentView = 'town';
    $('#inventory-btn').disabled = false;
    $('#character-sheet-btn').disabled = false;
    saveGame(); // Save on entering town square

    // Betty Popup Logic
    const bettyPopup = $('#betty-encounter-popup');
    bettyPopup.classList.add('hidden');
    bettyPopup.onclick = null;
    // Betty appears at level 4 now
    if (player.level >= 4 && player.bettyQuestState === 'not_started' && !player.dialogueFlags.bettyEncounterReady && !player.dialogueFlags.bettyMet) {
        if (Math.random() < 0.05) { // Initial chance to be ready
            player.dialogueFlags.bettyEncounterReady = true;
        }
    }
    // Show popup if ready or if declined previously
    if ((player.dialogueFlags.bettyEncounterReady && player.bettyQuestState === 'not_started') || player.bettyQuestState === 'declined') {
        bettyPopup.classList.remove('hidden');
        if (player.bettyQuestState === 'declined') {
            bettyPopup.innerHTML = `<p class="font-bold text-purple-200">Betty is waiting...</p><p class="text-gray-300">She seems to want to talk to you again.</p>`;
        } else {
            bettyPopup.innerHTML = `<p class="font-bold text-purple-200">A nervous woman whispers...</p><p class="text-gray-300">"Psst... Adventurer... Over here..."</p>`;
        }
        bettyPopup.onclick = () => {
            player.dialogueFlags.bettyEncounterReady = false; // Mark as encountered
            startBettyDialogue();
        };
    }

    const container = document.createElement('div');
    container.className = 'relative flex flex-col items-center justify-center w-full h-full';

    // --- Button Array with Updated Arcane Quarter Unlock Logic ---
    const buttons = [
        { name: 'Explore Wilderness', action: "renderWildernessMenu()", class: 'btn-action', unlocked: true },
        { name: 'Commercial District', action: "renderCommercialDistrict()", class: 'btn-primary', unlocked: true }, // Always show district access
        // --- MODIFIED Arcane Quarter Condition ---
        {
            name: 'Arcane Quarter',
            action: "renderArcaneQuarter()",
            class: 'btn-primary',
            // --- THIS IS THE FIX: Added a check for hasTowerKey ---
            unlocked: player.unlocks.sageTower || player.unlocks.enchanter || player.unlocks.witchCoven || player.unlocks.hasTowerKey
        },
        // --- END MODIFICATION ---
        { name: 'Residential Area', action: "renderResidentialDistrict()", class: 'btn-primary', unlocked: true } // Always show district access
    ];


    // House Button Logic (remains the same)
    if (player.house.owned) {
        buttons.push({ name: 'Your House', action: "renderHouse()", class: 'btn-primary', unlocked: true });
    } else if (player.level >= 5 && player.unlocks.houseAvailable) {
        buttons.push({ name: 'Build House (1000 G)', action: "buildHouse()", class: 'btn-primary', unlocked: true });
    } else {
        buttons.push({ name: '???', action: "", class: 'btn-primary', disabled: true, title: "Reach Level 5 to unlock", unlocked: true }); // Always show placeholder/build button
    }

    // Betty Button Logic (remains the same)
    if (player.bettyQuestState === 'accepted') {
        buttons.push({ name: 'Betty\'s Corner', action: "startBettyDialogue()", class: 'btn-primary', unlocked: true });
    }
    // --- End Button Array ---


    let html = `
        <h2 class="font-medieval text-3xl mb-8 text-center">Town Square</h2>
        <div class="grid grid-cols-2 gap-4 w-full max-w-md">`;

    // Render only unlocked buttons (except house placeholder)
    buttons.forEach(btn => {
        if (btn.unlocked) {
             html += `<button onclick="${btn.action}" class="btn ${btn.class}" ${btn.disabled ? 'disabled' : ''} ${btn.title ? `title="${btn.title}"` : ''}>${btn.name}</button>`;
        }
    });

    html += `</div>`;

    container.innerHTML = html;
    render(container);

    if (tutorialState.isActive) {
        const currentStep = tutorialState.sequence[tutorialState.currentIndex];
        if (currentStep && (currentStep.trigger?.setFlag || currentStep.type === 'checkpoint')) {
            setTimeout(() => advanceTutorial(), 100);
        }
    }
}

// MODIFICATION: New Housing functions
function renderHouse() {
    updateRealTimePalette();
    lastViewBeforeInventory = 'town'; // Go back to town square from house
    gameState.currentView = 'house';

    let buttonsHtml = `
        <button onclick="restAtHouse()" class="btn btn-primary w-full md:w-auto">Rest</button>
        <button onclick="renderHouseStorage()" class="btn btn-primary w-full md:w-auto">Storage</button>
    `;

    if (player.house.gardenTier > 0) {
        buttonsHtml += `<button onclick="renderGarden()" class="btn btn-primary w-full md:w-auto">Garden</button>`;
    }
    if (player.house.kitchenTier > 0) {
        buttonsHtml += `<button onclick="renderKitchen()" class="btn btn-primary w-full md:w-auto">Kitchen</button>`;
    }
    if (player.house.alchemyTier > 0) {
        buttonsHtml += `<button onclick="renderAlchemyLab()" class="btn btn-primary w-full md:w-auto">Alchemy Lab</button>`;
    }
    if (player.house.trainingTier > 0) {
        buttonsHtml += `<button onclick="renderTrainingGrounds()" class="btn btn-primary w-full md:w-auto">Training Grounds</button>`;
    }

    let html = `
        <div class="w-full text-center">
            <h2 class="font-medieval text-3xl mb-4 text-center">Your House</h2>
            <p class="mb-6 text-gray-400">A cozy, personal space to rest and prepare for your adventures.</p>
            <div class="grid grid-cols-2 gap-4 w-full max-w-md mx-auto">
                ${buttonsHtml}
            </div>
             <div class="mt-8">
                <button onclick="renderTownSquare()" class="btn btn-action">Leave House</button>
            </div>
        </div>`;
    const container = document.createElement('div');
    container.innerHTML = html;
    render(container);
}

function renderHouseStorage() {
    gameState.currentView = 'house_storage';

    const renderItemList = (source, type, moveAction, sortOrder) => {
        let allItems = [];
        const categories = ['items', 'lures', 'weapons', 'catalysts', 'armor', 'shields'];
        let hasContent = false;

        // 1. Flatten all items into one array
        categories.forEach(category => {
            const itemsInCategory = source[category] || (category === 'items' || category === 'lures' ? {} : []);

            if (category === 'items' || category === 'lures') {
                Object.keys(itemsInCategory).forEach(key => {
                    const count = itemsInCategory[key];
                    const details = getItemDetails(key);
                    if (count > 0 && details && details.type !== 'key') {
                        allItems.push({ key, count, category, details });
                    }
                });
            } else {
                // For non-stackable, we need to handle duplicates by counting them
                const itemCounts = {};
                itemsInCategory.forEach(key => itemCounts[key] = (itemCounts[key] || 0) + 1);

                Object.keys(itemCounts).forEach(key => {
                    const details = getItemDetails(key);
                    if (!details || details.rarity === 'Broken') return;

                    let isEquipped = false;
                    if (type === 'inventory') {
                        isEquipped = (player.equippedWeapon.name === details.name && category === 'weapons') ||
                                     (player.equippedArmor.name === details.name && category === 'armor') ||
                                     (player.equippedShield.name === details.name && category === 'shields') ||
                                     (player.equippedCatalyst.name === details.name && category === 'catalysts');
                    }
                    if (!isEquipped) {
                        allItems.push({ key, count: itemCounts[key], category, details });
                    }
                });
            }
        });

        hasContent = allItems.length > 0;
        if (!hasContent) {
            const message = type === 'inventory' ? 'Your inventory is empty of unequipped items.' : 'Your storage is empty.';
            return `<p class="text-sm text-gray-500 text-center mt-4 col-span-full">${message}</p>`;
        }

        // 2. Sort the array
        if (sortOrder === 'name') {
            allItems.sort((a, b) => a.details.name.localeCompare(b.details.name));
        } else if (sortOrder === 'cost') {
            allItems.sort((a, b) => (b.details.price || 0) - (a.details.price || 0));
        } else { // 'category' sort (default)
            allItems.sort((a, b) => {
                if (a.category !== b.category) {
                    return categories.indexOf(a.category) - categories.indexOf(b.category);
                }
                return a.details.name.localeCompare(b.details.name);
            });
        }

        // 3. Render the sorted list
        let html = '';
        let currentCategory = '';
        allItems.forEach(item => {
            if (sortOrder === 'category' && item.category !== currentCategory) {
                currentCategory = item.category;
                // Add a full-width header for the category
                html += `<h4 class="font-bold text-yellow-300 mt-4 mb-2 text-sm uppercase tracking-wider col-span-full">${capitalize(currentCategory)}</h4>`;
            }

            const arrow = type === 'inventory' ? '↓' : '↑';
            const countText = item.count > 1 ? ` (x${item.count})` : (item.category === 'lures' ? ` (x${item.count} uses)`: '');

            html += `<div class="flex justify-between items-center p-2 bg-slate-900/50 rounded text-sm">
                <span onmouseover="showTooltip('${item.key}', event)" onmouseout="hideTooltip()">${item.details.name}${countText}</span>
                <button onclick="${moveAction}('${item.category}', '${item.key}')" class="btn btn-primary text-lg py-0 px-3 leading-none">${arrow}</button>
            </div>`;
        });

        return `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">${html}</div>`;
    };

    // Ensure storage object and its properties exist to prevent errors with old saves
    if (!player.house.storage) {
        player.house.storage = { items: {}, weapons: [], armor: [], shields: [], catalysts: [], lures: {} };
    }
    const storage = player.house.storage;
    if (!storage.items) storage.items = {};
    if (!storage.lures) storage.lures = {};
    if (!storage.weapons) storage.weapons = [];
    if (!storage.armor) storage.armor = [];
    if (!storage.shields) storage.shields = [];
    if (!storage.catalysts) storage.catalysts = [];

    const storageTier = player.house.storageTier || 0;
    const baseLimits = { unique: 10, stack: 10 };
    const limits = HOME_IMPROVEMENTS.storage.upgrades[storageTier - 1]?.limits || baseLimits;

    const allStorageItems = [
        ...Object.keys(storage.items),
        ...Object.keys(storage.lures),
        ...storage.weapons,
        ...storage.armor,
        ...storage.shields,
        ...storage.catalysts
    ];
    const uniqueItemCount = new Set(allStorageItems).size;

    let html = `
        <div class="w-full max-w-4xl mx-auto flex flex-col h-full">
            <h2 class="font-medieval text-3xl mb-2 text-center">Storage Chest</h2>
            <p class="text-center text-sm text-gray-400 mb-4">Capacity: ${uniqueItemCount} / ${limits.unique} Unique Items | Max Stack: ${limits.stack}</p>

            <div class="flex-grow flex flex-col bg-slate-800 rounded-lg overflow-hidden">
                <!-- Inventory Section -->
                <div class="p-4 flex-1 overflow-y-auto inventory-scrollbar">
                    <div class="flex justify-between items-center mb-2 sticky top-0 bg-slate-800/80 backdrop-blur-sm py-2 z-10">
                         <h3 class="font-bold text-xl text-yellow-300">Your Inventory</h3>
                         <button onclick="placeAllInStorage()" class="btn btn-primary text-sm py-1 px-3">Place All ↓</button>
                    </div>
                    <div>
                        ${renderItemList(player.inventory, 'inventory', 'moveToStorage', 'category')}
                    </div>
                </div>

                <!-- Separator -->
                <hr class="border-slate-600">

                <!-- Storage Section -->
                <div class="p-4 flex-1 overflow-y-auto inventory-scrollbar">
                     <div class="flex flex-wrap justify-between items-center mb-2 sticky top-0 bg-slate-800/80 backdrop-blur-sm py-2 z-10 gap-2">
                         <div class="flex items-center gap-4">
                            <h3 class="font-bold text-xl text-yellow-300">Chest Storage</h3>
                            <button onclick="takeAllFromStorage()" class="btn btn-primary text-sm py-1 px-3">Take All ↑</button>
                         </div>
                         <div class="flex items-center gap-2">
                            <span class="text-sm text-gray-400">Sort by:</span>
                            <button onclick="setStorageSortOrder('category')" class="btn ${storageSortOrder === 'category' ? 'bg-yellow-600 border-yellow-800' : 'btn-primary'} text-xs py-1 px-2">Category</button>
                            <button onclick="setStorageSortOrder('name')" class="btn ${storageSortOrder === 'name' ? 'bg-yellow-600 border-yellow-800' : 'btn-primary'} text-xs py-1 px-2">Name</button>
                            <button onclick="setStorageSortOrder('cost')" class="btn ${storageSortOrder === 'cost' ? 'bg-yellow-600 border-yellow-800' : 'btn-primary'} text-xs py-1 px-2">Cost</button>
                         </div>
                    </div>
                     <div>
                        ${renderItemList(player.house.storage, 'storage', 'moveFromStorage', storageSortOrder)}
                    </div>
                </div>
            </div>

            <!-- Back Button - outside the scrollable area -->
            <div class="text-center mt-4 flex-shrink-0">
                <button onclick="renderHouse()" class="btn btn-primary">Back</button>
            </div>
        </div>`;

    const container = document.createElement('div');
    container.className = 'w-full h-full';
    container.innerHTML = html;

    render(container);

    // Custom adjustments for this full-screen-like view
    mainView.classList.remove('items-center', 'p-6');
    mainView.classList.add('p-2');
}


function renderSettingsMenu(originView = 'town') {
    lastViewBeforeInventory = originView;
    gameState.currentView = 'settings';
    updateRealTimePalette();

    const difficulties = {
        easy: {
            name: "Child's Play",
            color: "text-green-400",
            desc: "When you die, you simply pass out and wake up at the inn, fully restored. A new day begins, and no progress is lost."
        },
        medium: {
            name: "Medium is Premium",
            color: "text-yellow-400",
            desc: "When you die, you wake up at the inn, but at a cost. You lose half your gold and a random half of your items and equipment."
        },
        hardcore: {
            name: "Hardcore Savages",
            color: "text-red-400",
            desc: "Death is permanent. Your save file will be deleted, and your character's name will be added to the Graveyard for all to remember."
        }
    };

    let html = `<div class="w-full max-w-2xl text-center">
        <h2 class="font-medieval text-3xl mb-4">Settings</h2>

        <div class="mb-6 space-y-2">
            <button onclick="saveGame(true)" class="btn btn-primary">Save Game</button>
            <button onclick="exportSave()" class="btn btn-primary">Export Save</button>
        </div>

        <h3 class="text-xl font-bold mb-4 text-center">Change Difficulty</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">`;

    for (const key in difficulties) {
        const diff = difficulties[key];
        const isSelected = player.difficulty === key;
        const colorClass = diff.color.replace('text-', '');
        html += `<div onclick="setDifficulty('${key}')" class="p-4 bg-slate-800 rounded-lg border-2 ${isSelected ? `border-${colorClass}` : 'border-transparent'} hover:border-${colorClass} cursor-pointer">
            <h4 class="font-bold text-2xl ${diff.color}">${diff.name}</h4>
            <p class="text-sm text-gray-400 mt-2">${diff.desc}</p>
        </div>`;
    }

    html += `</div>
        <div class="mt-8">
            <button onclick="returnFromInventory()" class="btn btn-primary">Back</button>
        </div>
    </div>`;

    const container = document.createElement('div');
    container.innerHTML = html;
    render(container);
}

function renderResidentialDistrict() {
    // --- NPC ALLY: Check for non-payment when leaving Barracks ---
    if (gameState.currentView === 'barracks' && player.npcAlly && player.encountersSinceLastPay >= 5) {
        const salary = player.npcAlly.level * 10;
        if (player.gold < salary) {
            addToLog(`You couldn't afford to pay ${player.npcAlly.name}. They have left your service in disgust.`, 'text-red-500 font-bold');
        } else {
            addToLog(`You left the Barracks without paying ${player.npcAlly.name}. They have left your service in disgust.`, 'text-red-500 font-bold');
        }
        player.npcAlly = null;
        player.encountersSinceLastPay = 0;
        // Ally is now null, proceed to render residential district
    }
    // --- END NPC ALLY ---

    updateRealTimePalette();
    lastViewBeforeInventory = 'residential_district';
    gameState.currentView = 'residential_district';

    if (player.level >= 8 && !player.unlocks.barracks) {
        player.unlocks.barracks = true;
        // You only need the log once, but we include it if the flag was just flipped.
        addToLog("A new military advisor has arrived in the Residential District!", "text-yellow-400 font-bold");
        saveGame(); // Save the new flag state immediately
    }
    // --- END FIX ---  

    const container = document.createElement('div');
    container.className = 'flex flex-col items-center justify-center w-full h-full';

    const locations = [
        { name: 'The Inn', action: "renderInn()" },
        { name: 'Quest Board', action: "renderQuestBoard()" }, // Always available from level 1
        { name: 'Library', action: "renderLibrary()" }, // Always available from level 1
    ];
    
    // --- NPC ALLY: Add Barracks Button ---
    if (player.unlocks.barracks) {
        locations.push({ name: 'Barracks', action: "renderBarracks()" });
    }
    // --- END NPC ALLY ---

    let html = `<h2 class="font-medieval text-3xl mb-8 text-center">Residential District</h2>
                <div class="grid grid-cols-1 gap-4 w-full max-w-xs">`;

    // --- Level 1 Gating Logic ---
    if (player.level >= 1) {
        locations.forEach(loc => {
            html += `<button onclick="${loc.action}" class="btn btn-primary">${loc.name}</button>`;
        });
    } else { // Should technically not happen if player starts at level 1
         html += `<p class="text-center text-gray-400">Seems quiet for now...</p>`;
    }
    // --- End Level 1 Gating ---


    html += `</div>
             <div class="mt-8">
                <button onclick="renderTownSquare()" class="btn btn-action">Back to Town Square</button>
             </div>`;

    container.innerHTML = html;
    render(container);
}

function hireNpc(recruitIndex) {
    if (!player || !player.barracksRoster || !player.barracksRoster[recruitIndex]) {
        console.error("Invalid recruit index.");
        return;
    }
    
    if (player.npcAlly) {
        addToLog("You already have an ally. Dismiss them first.", "text-red-400");
        return;
    }
    
    const recruit = player.barracksRoster[recruitIndex];
    const cost = 100 + (player.level * 25);

    if (player.gold < cost) {
        addToLog("You cannot afford to hire them.", "text-red-400");
        return;
    }

    player.gold -= cost;
    
    // --- THIS IS THE FIX ---
    // Create the new ally using all the recruit's data
    player.npcAlly = new NpcAlly(recruit.name, recruit.classKey, recruit.raceKey, player.level);
    // --- END FIX ---
    player.encountersSinceLastPay = 0; // Reset pay counter

    // Remove the recruit from the roster
    player.barracksRoster.splice(recruitIndex, 1);

    addToLog(`You hired ${recruit.name}, the ${capitalize(recruit.raceKey)} ${CLASSES[recruit.classKey].name}, for ${cost} G!`, "text-green-400");
    updateStatsView();
    renderBarracks(); // Re-render to show the manage screen
    saveGame();
}

/**
 * Fires the current NPC ally. This is permanent.
 */
// --- Updated Function: dismissNpc ---
function dismissNpc(wasFired = false) {
    if (!player.npcAlly) return;

    const allyName = player.npcAlly.name;
    const ally = player.npcAlly; // Get ally object
    
    if (wasFired) {
        addToLog(`You refused to pay ${allyName}, and they left your service in disgust.`, 'text-red-500 font-bold');
        // No items are returned
    } else {
        addToLog(`You have dismissed ${allyName}. They return their equipment and depart.`, 'text-yellow-400');
        
        // --- UPDATED: Return ally's equipped items to player inventory ---
        const itemsToReturn = [
            ally.equippedWeapon.name !== 'Fists' ? findKeyByInstance(WEAPONS, ally.equippedWeapon) : null,
            ally.equippedCatalyst.name !== 'None' ? findKeyByInstance(CATALYSTS, ally.equippedCatalyst) : null,
            ally.equippedArmor.name !== "Traveler's Garb" ? findKeyByInstance(ARMOR, ally.equippedArmor) : null,
            ally.equippedShield.name !== 'None' ? findKeyByInstance(SHIELDS, ally.equippedShield) : null
        ].filter(Boolean); // Filter out nulls (default items)

        itemsToReturn.forEach(key => {
            if (key) player.addToInventory(key, 1, true); // Log each returned item
        });
        // --- END UPDATE ---
        
        // --- NEW: Return all items from their 10-slot pocket ---
        if (ally.inventory && ally.inventory.items) {
            let returnedItemCount = 0;
            for (const itemKey in ally.inventory.items) {
                const count = ally.inventory.items[itemKey];
                if (count > 0) {
                    player.addToInventory(itemKey, count, false); // Add silently
                    returnedItemCount += count;
                }
            }
            if (returnedItemCount > 0) {
                addToLog(`Their bag contained ${returnedItemCount} items, which have been added to your inventory.`, "text-gray-400");
            }
        }
        // --- END NEW ---
    }
    
    player.npcAlly = null;
    player.encountersSinceLastPay = 0;
    
    renderBarracks(); // Refresh to show the recruiting screen
}

function renderNpcSpellTraining() {
    if (!player.npcAlly) {
        renderBarracks();
        return;
    }
    
    gameState.currentView = 'npc_spell_training';
    lastViewBeforeInventory = 'barracks';
    const ally = player.npcAlly;

    const spellsByElement = {};
    for (const spellKey in SPELLS) {
        const spell = SPELLS[spellKey];
        if (!spellsByElement[spell.element]) {
            spellsByElement[spell.element] = [];
        }
        spellsByElement[spell.element].push(spellKey);
    }
    const elementOrder = ['none', 'fire', 'water', 'earth', 'wind', 'lightning', 'nature', 'light', 'void', 'healing'];

    let html = `<div class="w-full max-w-4xl mx-auto">
        <h2 class="font-medieval text-3xl mb-2 text-center">Spell Training for ${ally.name}</h2>
        <p class="text-center text-gray-400 mb-6">Purchase spell training for your ally. Essences are not required, but you must pay the gold cost for each tier.</p>
        
        <div class="h-96 overflow-y-auto inventory-scrollbar pr-2 space-y-4">`;

    elementOrder.forEach(element => {
        if (spellsByElement[element]) {
            html += `<div class="space-y-3">
                        <h3 class="font-medieval text-xl text-yellow-300 border-b-2 border-yellow-300/30 pb-1">${capitalize(element)} Spells</h3>`;

            spellsByElement[element].forEach(spellKey => {
                const spellTree = SPELLS[spellKey];
                const allySpell = ally.spells[spellKey];
                const currentTier = allySpell ? allySpell.tier : 0;
                const spellDetails = spellTree.tiers[currentTier - 1] || spellTree.tiers[0];

                html += `<div class="p-3 bg-slate-800 rounded-lg text-left">`;

                if (currentTier === 0) {
                    const cost = spellTree.learnCost;
                    const canAfford = player.gold >= cost;
                    html += `<div class="flex justify-between items-center">
                                <h3 class="font-bold text-lg text-yellow-300" onmouseover="showTooltip('${spellKey}', event)" onmouseout="hideTooltip()">${spellTree.tiers[0].name} (Tier 1)</h3>
                                <button onclick="learnNpcSpell('${spellKey}')" class="btn btn-primary" ${!canAfford ? 'disabled' : ''}>Learn (${cost} G)</button>
                            </div>
                            <p class="text-sm text-gray-400">${spellDetails.description}</p>`;
                } else if (currentTier < spellTree.tiers.length) {
                    const upgradeData = spellTree.tiers[currentTier - 1]; // Cost is on the *current* tier
                    const cost = upgradeData.upgradeCost;
                    const canAfford = player.gold >= cost;
                    const nextTierData = spellTree.tiers[currentTier];

                    html += `<div class="flex justify-between items-center">
                                <h3 class="font-bold text-lg text-green-300" onmouseover="showTooltip('${spellKey}', event)" onmouseout="hideTooltip()">${spellDetails.name} (Tier ${currentTier})</h3>
                                <button onclick="learnNpcSpell('${spellKey}')" class="btn btn-primary" ${!canAfford ? 'disabled' : ''}>Upgrade to T${currentTier + 1} (${cost} G)</button>
                            </div>
                             <p class="text-sm text-gray-400">Next: ${nextTierData.name}</p>`;
                } else {
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
        <div class="text-center mt-6">
            <button onclick="renderBarracks()" class="btn btn-primary">Back to Barracks</button>
        </div>
    </div>`;

    const container = document.createElement('div');
    container.innerHTML = html;
    render(container);
}

// --- NEW FUNCTION: learnNpcSpell ---
function learnNpcSpell(spellKey) {
    if (!player.npcAlly) return;
    
    const ally = player.npcAlly;
    const spellTree = SPELLS[spellKey];
    const allySpell = ally.spells[spellKey];
    const currentTier = allySpell ? allySpell.tier : 0;
    
    let cost = 0;
    
    if (currentTier === 0) {
        cost = spellTree.learnCost;
    } else if (currentTier < spellTree.tiers.length) {
        cost = spellTree.tiers[currentTier - 1].upgradeCost;
    } else {
        addToLog("Ally has already mastered this spell.", "text-yellow-400");
        return;
    }
    
    if (player.gold < cost) {
        addToLog(`You need ${cost} G to pay for this training.`, "text-red-400");
        return;
    }
    
    player.gold -= cost;
    
    if (currentTier === 0) {
        ally.spells[spellKey] = { tier: 1 };
        addToLog(`You paid ${cost} G. ${ally.name} learned ${spellTree.tiers[0].name}!`, "text-green-400");
    } else {
        ally.spells[spellKey].tier++;
        const newTier = ally.spells[spellKey].tier;
        addToLog(`You paid ${cost} G. ${ally.name} upgraded to ${spellTree.tiers[newTier - 1].name}!`, "text-green-400");
    }
    
    updateStatsView(); // Update gold
    renderNpcSpellTraining(); // Refresh the spell list
}
/**
 * Pays the NPC ally's salary.
 */
function payNpcSalary(salary) {
    if (!player || !player.npcAlly) return;

    if (player.gold < salary) {
        addToLog(`You don't have enough gold to pay ${player.npcAlly.name}!`, "text-red-400");
        return; // Should be disabled, but double-check
    }

    player.gold -= salary;
    player.encountersSinceLastPay = 0;
    
    addToLog(`You paid ${player.npcAlly.name} ${salary} G for their services.`, "text-green-400");
    
    updateStatsView();
    renderBarracks(); // Refresh the barracks UI
}

/**
 * Renders the main Barracks screen.
 * Shows either the recruitment list or the ally management panel.
 */
function renderBarracks() {
    updateRealTimePalette();
    lastViewBeforeInventory = 'residential_district';
    gameState.currentView = 'barracks';

    let html = `<div class="w-full max-w-3xl mx-auto text-left">
        <h2 class="font-medieval text-3xl mb-4 text-center">Barracks</h2>`;

    if (player.npcAlly) {
        // --- NPC ALLY: MANAGE ALLY & SALARY UI ---
        const ally = player.npcAlly;
        const salary = ally.level * 10;
        const encountersLeft = Math.max(0, 5 - player.encountersSinceLastPay);

        html += `<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- Ally Stats Panel -->
                    <div class="bg-slate-800 p-4 rounded-lg">
                        <h3 class="font-bold text-2xl text-yellow-300 mb-2">${ally.name}</h3>
                        
                        <!-- THIS IS THE FIX -->
                        <!-- The old code only showed ally.class and ally.level -->
                        <p class="text-lg text-gray-400 mb-4">${ally.raceKey ? capitalize(ally.raceKey) : 'Unknown Race'} ${ally.class} (Level ${ally.level})</p>
                        <!-- END FIX -->
                        
                        <div class="space-y-1 text-sm mb-4">
                            <p class="flex justify-between"><strong>HP:</strong> <span>${ally.hp} / ${ally.maxHp}</span></p>
                            <p class="flex justify-between"><strong>MP:</strong> <span>${ally.mp} / ${ally.maxMp}</span></p>
                        </div>
                        
                        <h4 class="font-semibold text-gray-200 mb-2">Attributes</h4>
                        <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                            <p><strong>Vigor:</strong> ${ally.vigor + ally.bonusVigor}</p>
                            <p><strong>Focus:</strong> ${ally.focus + ally.bonusFocus}</p>
                            <p><strong>Stamina:</strong> ${ally.stamina + ally.bonusStamina}</p>
                            <p><strong>Strength:</strong> ${ally.strength + ally.bonusStrength}</p>
                            <p><strong>Intelligence:</strong> ${ally.intelligence + ally.bonusIntelligence}</p>
                            <p><strong>Luck:</strong> ${ally.luck + ally.bonusLuck}</p>
                        </div>
                    </div>
                    
                    <!-- Management Panel -->
                    <div class="bg-slate-800 p-4 rounded-lg flex flex-col justify-between">`;
        
        if (player.encountersSinceLastPay >= 5) {
            // --- SALARY DUE ---
            html += `<div>
                        <h3 class="font-bold text-xl text-red-400 mb-2">Salary Due</h3>
                        <p class="text-gray-300 mb-4">Your ally expects payment for their services. If you leave without paying, they will depart.</p>
                        <p class="text-2xl font-bold text-yellow-300 mb-6">Cost: ${salary} G</p>
                     </div>
                     <div class="space-y-3">`;
            
            if (player.gold >= salary) {
                html += `<button onclick="payNpcSalary(${salary})" class="btn btn-primary w-full">Pay Salary (${salary} G)</button>`;
            } else {
                html += `<p class="text-center text-red-500 font-bold">You cannot afford their salary!</p>`;
                html += `<button onclick="dismissNpc(true)" class="btn btn-action w-full">Dismiss Ally</button>`;
            }
            html += `</div>`;

        } else {
            // --- STANDARD MANAGEMENT ---
            html += `<div>
                        <h3 class="font-bold text-xl text-yellow-300 mb-2">Manage Ally</h3>
                        <p class="text-gray-300 mb-4">Encounters until next payment: <span class="font-bold text-lg">${encountersLeft}</span></p>
                        <p class="text-gray-400 text-sm">Remember: Your ally does not heal automatically. Use items on them in battle or manage their inventory here.</p>
                     </div>
                     <div class="space-y-3 mt-4">
                        <button onclick="renderNpcInventory()" class="btn btn-primary w-full">Manage Equipment & Items</button>
                        <!-- NEW SPELL BUTTON -->
                        <button onclick="renderNpcSpellTraining()" class="btn btn-primary w-full">Manage Spells</button>
                        <button onclick="dismissNpc(false)" class="btn btn-action w-full">Dismiss Ally</button>
                     </div>`;
        }
        
        html += `   </div>
                </div>`;

    } else {
        // --- NPC ALLY: RECRUIT UI (NOW USES ROSTER) ---
        html += `<p class="text-center text-gray-400 mb-6">The Barracks master presents the day's available roster. You may hire one companion at a time. A new roster will be available tomorrow.</p>
                 <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 h-80 overflow-y-auto inventory-scrollbar pr-2">`;
        
        if (player.barracksRoster.length === 0) {
             // This happens on first load before resting
             generateBarracksRoster();
        }

        player.barracksRoster.forEach((recruit, index) => {
            const classData = CLASSES[recruit.classKey];
            const raceData = RACES[recruit.raceKey];
            const cost = 100 + (player.level * 25);
            
            // --- FIX for undefined raceData ---
            const raceName = recruit.raceKey ? capitalize(recruit.raceKey) : "Unknown Race"; // The key *is* the name
            const className = classData ? classData.name : "Unknown Class";
            // const classRole = ... // REMOVED THIS LINE, 'role' does not exist in NPC_STAT_ALLOCATIONS
            // --- END FIX ---
            
            html += `<div class="p-4 bg-slate-800 rounded-lg flex flex-col justify-between">
                        <div>
                            <h4 class="font-bold text-lg text-yellow-300">${recruit.name}</h4>
                            <p class="text-sm text-gray-400 mb-2">${raceName} ${className}</p>
                            <p class="text-xs text-gray-400 italic">"${classData ? classData.description : 'No description.'}"</p>
                        </div>
                        <button onclick="hireNpc(${index})" class="btn btn-primary w-full mt-4" ${player.gold < cost ? 'disabled' : ''}>
                            Hire (${cost} G)
                        </button>
                     </div>`;
        });
        
        html += `</div>`; // Close grid
    }

    html += `<div class="text-center mt-8">
                <button onclick="renderResidentialDistrict()" class="btn btn-primary">Back to Residential Area</button>
            </div>
        </div>`; // Close wrapper

    const container = document.createElement('div');
    container.innerHTML = html;
    render(container);
}
// --- New Function: payNpcSalary ---
function payNpcSalary(salary) {
    if (!player || !player.npcAlly) return;

    if (player.gold < salary) {
        addToLog(`You don't have enough gold to pay ${player.npcAlly.name}!`, "text-red-400");
        return; // Should be disabled, but double-check
    }

    player.gold -= salary;
    player.encountersSinceLastPay = 0;
    
    addToLog(`You paid ${player.npcAlly.name} ${salary} G for their services.`, "text-green-400");
    
    updateStatsView();
    renderBarracks(); // Refresh the barracks UI
}
/**
 * Shows the details of a recruit on hover.
 */
function showRecruitDetails(classKey) {
    const detailsView = $('#recruit-details-view');
    const classData = CLASSES[classKey];
    const alloc = NPC_STAT_ALLOCATIONS[classKey];
    if (!detailsView || !classData || !alloc) {
        if (detailsView) detailsView.innerHTML = '<p class="text-red-400">Error loading recruit data.</p>';
        return;
    }

    let statsHtml = '<h5 class="font-bold mt-3 mb-1 text-cyan-300">Stat Allocation</h5><div class="grid grid-cols-2 gap-x-4">';
    statsHtml += Object.entries(alloc).map(([stat, perc]) => {
        return `<span>${capitalize(stat)}</span><span class="font-semibold text-right">${perc * 100}%</span>`;
    }).join('');
    statsHtml += '</div>';

    let gearHtml = '<h5 class="font-bold mt-3 mb-1 text-yellow-300">Starting Gear</h5>';
    const gear = Object.values(classData.startingEquipment)
                      .map(key => getItemDetails(key)?.name)
                      .filter(Boolean).join(', ') || 'None';
    gearHtml += `<p class="text-xs text-gray-400">${gear}</p>`;

    detailsView.innerHTML = `
        <h4 class="font-bold text-xl text-yellow-300 mb-2">${classData.name}</h4>
        <p class="text-sm text-gray-400 mb-4">${classData.description}</p>
        <div class="text-sm space-y-1">${statsHtml}</div>
        <div class="text-sm space-y-1 mt-2">${gearHtml}</div>
    `;
    
    // Also hide the main tooltip if it's open
    hideTooltip();
}

/**
 * Renders the NPC Ally's inventory management screen.
 * This is a placeholder and will be fully implemented in a later phase.
 */
let npcInventoryActiveTab = 'equipment'; // State for NPC inventory tabs

function renderNpcInventory() {
    if (!player.npcAlly) {
        renderBarracks(); // Should not happen, but safety check
        return;
    }
    
    gameState.currentView = 'npc_inventory';
    lastViewBeforeInventory = 'barracks'; // Go back to barracks
    
    const ally = player.npcAlly;
    const playerItems = player.inventory;
    
    let html = `<div class="w-full max-w-5xl mx-auto flex flex-col h-full">
        <h2 class="font-medieval text-3xl mb-2 text-center">Manage ${ally.name}'s Inventory</h2>
        <p class="text-center text-sm text-gray-400 mb-4">Left-click an item in your inventory to give it to your ally. Left-click an item in their inventory to take it back.</p>
        
        <div class="flex-grow grid grid-cols-2 gap-4 overflow-hidden">
            <!-- Left Panel: Player Inventory -->
            <div class="flex flex-col bg-slate-800 rounded-lg overflow-hidden p-4">
                <h3 class="font-bold text-xl text-yellow-300 mb-3 text-center">Your Inventory (Unequipped)</h3>
                <div id="npc-inv-player-list" class="overflow-y-auto inventory-scrollbar pr-2 space-y-3">
                    ${generateNpcInventoryPlayerList()}
                </div>
            </div>

            
            <!-- Right Panel: Ally Inventory -->
            <div class="flex flex-col bg-slate-800 rounded-lg overflow-hidden p-4">
                <h3 class="font-bold text-xl text-yellow-300 mb-3 text-center">${ally.name}'s Gear & Pocket</h3>
                
                <!-- Ally Tabs -->
                <div class="flex-shrink-0 flex gap-1 mb-3">
                    <button onclick="setNpcInvTab('equipment')" class="btn ${npcInventoryActiveTab === 'equipment' ? 'bg-yellow-600 border-yellow-800' : 'btn-primary'} text-sm py-1 px-3 flex-1">Equipment</button>
                    <button onclick="setNpcInvTab('pocket')" class="btn ${npcInventoryActiveTab === 'pocket' ? 'bg-yellow-600 border-yellow-800' : 'btn-primary'} text-sm py-1 px-3 flex-1">Pocket (Items)</button>
                </div>
                
                <!-- Ally Content -->
                <div id="npc-inv-ally-list" class="flex-grow overflow-y-auto inventory-scrollbar pr-2">
                    ${npcInventoryActiveTab === 'equipment' ? generateNpcInventoryAllyEquipment(ally) : generateNpcInventoryAllyPocket(ally)}
                </div>
            </div>
        </div>
        
        <div class="text-center mt-4 flex-shrink-0">
            <button onclick="renderBarracks()" class="btn btn-primary">Back to Barracks</button>
        </div>
    </div>`;
    
    const container = document.createElement('div');
    container.className = 'w-full h-full';
    container.innerHTML = html;

    render(container);
    
    // Custom adjustments for this full-screen-like view
    mainView.classList.remove('items-center', 'p-6');
    mainView.classList.add('p-2');
}

function setNpcInvTab(tabName) {
    npcInventoryActiveTab = tabName;
    renderNpcInventory();
}

// --- NEW HELPER: Generates the Player's item list for the ally screen ---
function generateNpcInventoryPlayerList() {
    let html = "";
    const categories = {
        'Weapons': 'weapons', 
        'Catalysts': 'catalysts', 
        'Armor': 'armor', 
        'Shields': 'shields', 
        'Consumables': 'items'
    };
    
    let hasItems = false;

    for (const catName in categories) {
        const catKey = categories[catName];
        let itemsHtml = "";
        
        if (catKey === 'items') {
            // Consumables (only show usable types)
            const consumableTypes = ['healing', 'mana_restore', 'buff', 'cleanse', 'cleanse_specific', 'debuff_apply', 'debuff_special', 'enchant', 'experimental'];
            const items = Object.keys(player.inventory.items)
                .filter(key => {
                    const d = getItemDetails(key);
                    return d && consumableTypes.includes(d.type);
                })
                .sort((a,b) => getItemDetails(a).name.localeCompare(getItemDetails(b).name));
            
            items.forEach(key => {
                const details = getItemDetails(key);
                const count = player.inventory.items[key] || 0;
                if (count > 0) {
                    itemsHtml += `<div class="flex justify-between items-center p-2 bg-slate-900/50 rounded text-sm" 
                                       onmouseover="showTooltip('${key}', event)" onmouseout="hideTooltip()"
                                       onclick="moveItemToNpc('${catKey}', '${key}')">
                                      <span>${details.name} (x${count})</span>
                                      <span class="text-lg font-bold text-green-400">→</span>
                                  </div>`;
                }
            });
        } else {
            // Equipment
            if (!player.inventory[catKey]) continue;
            const itemCounts = {};
            player.inventory[catKey].forEach(key => itemCounts[key] = (itemCounts[key] || 0) + 1);
            
            const sortedKeys = Object.keys(itemCounts).sort((a,b) => getItemDetails(a).name.localeCompare(getItemDetails(b).name));

            sortedKeys.forEach(key => {
                const details = getItemDetails(key);
                if (!details || details.rarity === 'Broken') return;
                
                // Check if *any* instance is equipped by the PLAYER
                const isEquippedByPlayer = (catKey === 'weapons' && player.equippedWeapon.name === details.name) ||
                                           (catKey === 'catalysts' && player.equippedCatalyst.name === details.name) ||
                                           (catKey === 'armor' && player.equippedArmor.name === details.name) ||
                                           (catKey === 'shields' && player.equippedShield.name === details.name);
                
                const count = itemCounts[key];
                // Can only move if not equipped, OR if count > 1 (meaning an unequipped one exists)
                if (!isEquippedByPlayer || count > 1) {
                    itemsHtml += `<div class="flex justify-between items-center p-2 bg-slate-900/50 rounded text-sm" 
                                       onmouseover="showTooltip('${key}', event)" onmouseout="hideTooltip()"
                                       onclick="moveItemToNpc('${catKey}', '${key}')">
                                      <span>${details.name} (x${count})</span>
                                      <span class="text-lg font-bold text-green-400">→</span>
                                  </div>`;
                }
            });
        }
        
        if (itemsHtml) {
            hasItems = true;
            html += `<h4 class="font-bold text-yellow-300 mt-2 mb-1 text-sm uppercase tracking-wider">${catName}</h4>
                     <div class="space-y-1">${itemsHtml}</div>`;
        }
    }
    
    if (!hasItems) {
        html = `<p class="text-sm text-gray-500 text-center mt-4">You have no unequipped items to give.</p>`;
    }
    return html;
}

// --- NEW HELPER: Generates the Ally's Equipment slots ---
function generateNpcInventoryAllyEquipment(ally) {
    let html = `<div class="space-y-3">`;
    
    const slots = [
        { type: 'armor', item: ally.equippedArmor, default: ARMOR['travelers_garb'], dataObject: ARMOR },
        { type: 'weapon', item: ally.equippedWeapon, default: WEAPONS['fists'], dataObject: WEAPONS },
        { type: 'catalyst', item: ally.equippedCatalyst, default: CATALYSTS['no_catalyst'], dataObject: CATALYSTS },
        { type: 'shield', item: ally.equippedShield, default: SHIELDS['no_shield'], dataObject: SHIELDS }
    ];

    slots.forEach(slot => {
        // --- THIS IS THE FIX ---
        // I am now correctly finding the item key by searching the correct dataObject (e.g., WEAPONS)
        // for the item instance (slot.item).
        const itemKey = findKeyByInstance(slot.dataObject, slot.item);
        // --- END FIX ---

        const isDefault = slot.item.name === slot.default.name;
        // Pass the *correct* itemKey (e.g., 'battleaxe') instead of 'null'
        const action = isDefault ? '' : `onclick="moveItemFromNpc('${slot.type}', '${itemKey}')"`;
        const cursor = isDefault ? 'cursor-default' : 'cursor-pointer';
        
        html += `<div class="p-3 bg-slate-900/50 rounded-lg">
                    <p class="text-xs text-gray-400 uppercase">${capitalize(slot.type)}</p>
                    <div class="flex justify-between items-center mt-1 ${cursor}" 
                         ${action} 
                         onmouseover="showTooltip('${itemKey}', event)" 
                         onmouseout="hideTooltip()">
                        <span class="font-semibold ${isDefault ? 'text-gray-500' : 'text-white'}">${slot.item.name}</span>
                        ${!isDefault ? '<span class="text-lg font-bold text-red-400">←</span>' : ''}
                    </div>
                 </div>`;
    });
    
    html += `</div>`;
    return html;
}



// --- NEW HELPER: Generates the Ally's 10-slot Pocket ---
function generateNpcInventoryAllyPocket(ally) {
    let html = `<div class="space-y-2">`;
    const pocket = ally.inventory.items || {};
    const pocketSize = ally.inventory.size || 10;
    const stackSize = ally.inventory.stack || 10;
    
    const itemKeys = Object.keys(pocket);
    let hasItems = false;
    
    itemKeys.forEach(key => {
        const count = pocket[key];
        if (count > 0) {
            hasItems = true;
            const details = getItemDetails(key);
            html += `<div class="flex justify-between items-center p-2 bg-slate-900/50 rounded text-sm" 
                           onmouseover="showTooltip('${key}', event)" onmouseout="hideTooltip()"
                           onclick="moveItemFromNpc('items', '${key}')">
                          <span>${details.name} (x${count})</span>
                          <span class="text-lg font-bold text-red-400">←</span>
                      </div>`;
        }
    });
    
    if (!hasItems) {
        html = `<p class="text-sm text-gray-500 text-center mt-4">Ally's pocket is empty.</p>`;
    }
    
    html += `<p class="text-xs text-gray-500 text-center mt-4">Slots used: ${itemKeys.length} / ${pocketSize}</p>`;
    
    return html;
}

// --- NEW HELPER: Logic to move item from Player to Ally ---
function moveItemToNpc(category, itemKey) {
    if (!player.npcAlly) return;
    const ally = player.npcAlly;
    const details = getItemDetails(itemKey);
    
    const playerList = document.getElementById('npc-inv-player-list');
    const allyList = document.getElementById('npc-inv-ally-list');
    const playerScrollPos = playerList ? playerList.scrollTop : 0;
    const allyScrollPos = allyList ? allyList.scrollTop : 0;

    
    if (category === 'items') {
        // --- Handle Consumables ---
        const allyPocket = ally.inventory.items;
        const currentAllyCount = allyPocket[itemKey] || 0;
        const maxStack = ally.inventory.stack || 10;
        const maxSlots = ally.inventory.size || 10;

        if (currentAllyCount >= maxStack) {
            addToLog(`Ally's stack of ${details.name} is full.`, 'text-red-400');
            return;
        }
        
        if (!allyPocket[itemKey] && Object.keys(allyPocket).length >= maxSlots) {
            addToLog(`Ally's pocket is full (10 unique items max).`, 'text-red-400');
            return;
        }

        // Move one item
        player.inventory.items[itemKey]--;
        if (player.inventory.items[itemKey] <= 0) delete player.inventory.items[itemKey];
        allyPocket[itemKey] = (allyPocket[itemKey] || 0) + 1;
        
    } else {
        // --- Handle Equipment ---
        const itemIndex = player.inventory[category].indexOf(itemKey);
        if (itemIndex === -1) {
             addToLog("Item not found in your inventory.", "text-red-400"); // Should not happen
             return;
        }
        
        // Remove from player first
        player.inventory[category].splice(itemIndex, 1);
        
        // Equip to ally (this handles the 2-of-3 rule)
        const unequippedItemKey = ally.equipItem(itemKey);
        
        // Add the returned item (if any) back to player inventory
        if (unequippedItemKey) {
            player.addToInventory(unequippedItemKey, 1, false); // Add silently
        }
    }
    
    // Refresh the UI
    renderNpcInventory();

    const newPlayerList = document.getElementById('npc-inv-player-list');
    const newAllyList = document.getElementById('npc-inv-ally-list');
    if (newPlayerList) newPlayerList.scrollTop = playerScrollPos;
    if (newAllyList) newAllyList.scrollTop = allyScrollPos;

}

// --- NEW HELPER: Logic to move item from Ally to Player ---
function moveItemFromNpc(category, itemKey) {
    if (!player.npcAlly) return;
    const ally = player.npcAlly;

    const playerList = document.getElementById('npc-inv-player-list');
    const allyList = document.getElementById('npc-inv-ally-list');
    const playerScrollPos = playerList ? playerList.scrollTop : 0;
    const allyScrollPos = allyList ? allyList.scrollTop : 0;
    
    if (category === 'items') {
        // --- Handle Consumables ---
        const allyPocket = ally.inventory.items;
        if (!allyPocket[itemKey] || allyPocket[itemKey] <= 0) {
            addToLog("Item not found in ally's pocket.", "text-red-400"); // Should not happen
            return;
        }
        
        // Move one item
        allyPocket[itemKey]--;
        if (allyPocket[itemKey] <= 0) delete allyPocket[itemKey];
        player.addToInventory(itemKey, 1, false); // Add silently
        
    } else {
        // --- Handle Equipment ---
        // Unequip from ally (this returns the key and sets slot to default)
        const unequippedItemKey = ally.unequipItem(category);
        
        if (unequippedItemKey !== itemKey) {
             // This should *never* happen if the UI is correct
             console.error(`Item mismatch! Tried to remove ${itemKey}, but unequipped ${unequippedItemKey}`);
             // Still, add the item we *actually* unequipped
             if (unequippedItemKey) player.addToInventory(unequippedItemKey, 1, false);
        } else if (unequippedItemKey) {
            // Success, add the item back to player
            player.addToInventory(unequippedItemKey, 1, false);
        }
    }
    
    // Refresh the UI
    renderNpcInventory();

    const newPlayerList = document.getElementById('npc-inv-player-list');
    const newAllyList = document.getElementById('npc-inv-ally-list');
    if (newPlayerList) newPlayerList.scrollTop = playerScrollPos;
    if (newAllyList) newAllyList.scrollTop = allyScrollPos;
}


function renderLibrary() {
    updateRealTimePalette();
    lastViewBeforeInventory = 'library';
    gameState.currentView = 'library';

    let html = `<div class="w-full h-full flex flex-col text-left">
        <h2 class="font-medieval text-3xl mb-4 text-center">The Library</h2>
        <div class="flex-grow flex gap-6 overflow-hidden">
            <div class="w-1/3 flex flex-col gap-2">
                <h3 class="font-bold text-lg text-yellow-300">Available Tomes</h3>
                <div id="book-list" class="flex flex-col gap-2">`;

    Object.keys(LIBRARY_BOOKS).forEach(bookKey => {
        const book = LIBRARY_BOOKS[bookKey];
        if (book.isDynamic) {
            const hasContent = (book.recipeType === 'cooking' && player.knownCookingRecipes.length > 0) ||
                               (book.recipeType === 'alchemy' && player.knownAlchemyRecipes.some(r => ALCHEMY_RECIPES[r].tier === book.tier));
            if (hasContent) {
                html += `<button onclick="renderBook('${bookKey}')" class="btn btn-primary text-left">${book.title}</button>`;
            }
        } else {
             html += `<button onclick="renderBook('${bookKey}')" class="btn btn-primary text-left">${book.title}</button>`;
        }
    });

    html += `   </div>
            </div>
            <div id="library-content-view" class="w-2/3 bg-slate-800 p-4 rounded-lg overflow-y-auto inventory-scrollbar">
                <p class="text-gray-400">Select a book to read.</p>
            </div>
        </div>
        <div class="text-center mt-4">
            <button onclick="renderResidentialDistrict()" class="btn btn-primary">Back to Residential Area</button>
        </div>
    </div>`;

    const container = document.createElement('div');
    container.innerHTML = html;
    render(container);
}

function renderBook(bookKey, chapterIndex = 0) {
    const bookData = LIBRARY_BOOKS[bookKey];
    if (!bookData) return;

    let book = { ...bookData }; // Create a mutable copy

    if (bookData.isDynamic) {
        book.chapters = [...bookData.chapters]; // Copy static chapters like 'Introduction'

        if (book.recipeType === 'cooking') {
            player.knownCookingRecipes.sort((a,b) => COOKING_RECIPES[a].name.localeCompare(COOKING_RECIPES[b].name)).forEach(recipeKey => {
                const recipe = COOKING_RECIPES[recipeKey];
                const chapterContent = recipe.library_description; // Correctly pull from the recipe object
                if (chapterContent) {
                    book.chapters.push({
                        title: recipe.name,
                        content: chapterContent
                    });
                } else {
                    // Fallback for any recipes that might not have a detailed entry
                    const ingredients = Object.entries(recipe.ingredients).map(([key, val]) => {
                        const details = getItemDetails(key);
                        return `${val}x ${details ? details.name : capitalize(key)}`;
                    }).join(', ');
                    book.chapters.push({
                        title: recipe.name,
                        content: `<p class="italic mb-2">${recipe.description}</p><p><strong>Requires:</strong> ${ingredients}</p>`
                    });
                }
            });
        } else if (book.recipeType === 'alchemy') {
            player.knownAlchemyRecipes.filter(r => ALCHEMY_RECIPES[r].tier === book.tier).sort((a,b) => getItemDetails(ALCHEMY_RECIPES[a].output).name.localeCompare(getItemDetails(ALCHEMY_RECIPES[b].output).name)).forEach(recipeKey => {
                const recipe = ALCHEMY_RECIPES[recipeKey];
                const chapterContent = recipe.library_description;
                if (chapterContent) {
                    book.chapters.push({
                        title: getItemDetails(recipe.output).name,
                        content: chapterContent
                    });
                } else {
                    const ingredients = Object.entries(recipe.ingredients).map(([key, val]) => `${val}x ${getItemDetails(key).name}`).join(', ');
                    book.chapters.push({
                        title: getItemDetails(recipe.output).name,
                        content: `<p><strong>Requires:</strong> ${ingredients}</p>`
                    });
                }
            });
        }
    }

    const contentArea = $('#library-content-view');
    let html = `<div class="text-left">
        <h3 class="font-bold text-xl text-yellow-300 mb-1">${book.title}</h3>
        <p class="text-xs text-gray-400 mb-4">By ${book.author}</p>

        <div class="mb-4 flex flex-wrap gap-2 border-b border-gray-600 pb-2">`;

    book.chapters.forEach((chap, index) => {
        const isActive = index === chapterIndex;
        html += `<button onclick="renderBook('${bookKey}', ${index})" class="text-sm px-3 py-1 rounded ${isActive ? 'bg-yellow-600 text-slate-900 font-bold' : 'bg-slate-700 hover:bg-slate-600'}">${chap.title}</button>`;
    });

    html += `</div>`;

    if (book.chapters[chapterIndex]) {
        html += `<div class="prose prose-invert max-w-none text-gray-300">${book.chapters[chapterIndex].content}</div>`;
    } else if (book.chapters.length > 0) {
        // Automatically select the first chapter if the provided index is invalid
        html += `<div class="prose prose-invert max-w-none text-gray-300">${book.chapters[0].content}</div>`;
    }

    html += `</div>`;

    contentArea.innerHTML = html;

    document.querySelectorAll('#book-list button').forEach(btn => {
        btn.classList.remove('bg-yellow-600', 'border-yellow-800');
        btn.classList.add('btn-primary');
    });
    const activeBtn = document.querySelector(`#book-list button[onclick*="'${bookKey}'"]`);
    if(activeBtn) {
        activeBtn.classList.add('bg-yellow-600', 'border-yellow-800');
        activeBtn.classList.remove('btn-primary');
    }
}


function renderCommercialDistrict() {
    updateRealTimePalette();
    lastViewBeforeInventory = 'commercial_district';
    gameState.currentView = 'commercial_district';

    // --- Added Unlock Checks & Messages ---
    let blacksmithJustUnlocked = false;
    if (player.unlocks.hasBlacksmithKey && !player.unlocks.blacksmith) {
        player.unlocks.blacksmith = true;
        blacksmithJustUnlocked = true;
        saveGame(); // Save unlock immediately
    }
    // --- End Added ---


    const container = document.createElement('div');
    container.className = 'flex flex-col items-center justify-center w-full h-full';

    const locations = [
        { name: 'General Store', action: "renderShop('store')", unlocked: true }, // Always unlocked
        { name: 'Blacksmith', action: "renderBlacksmithMenu()", unlocked: player.unlocks.blacksmith },
        { name: 'Black Market', action: "renderShop('black_market')", unlocked: player.level >= 5 && player.unlocks.blackMarket } // Check level AND flag
    ];

    if (player.house.owned) {
        locations.push({ name: "Foundation & Fortune", action: "renderHomeImprovements()", unlocked: true });
    }

    let html = `<h2 class="font-medieval text-3xl mb-8 text-center">Commercial District</h2>
                <div class="grid grid-cols-1 gap-4 w-full max-w-xs">`;

    // --- Modified Button Rendering ---
    locations.forEach(loc => {
        if (loc.unlocked) { // Only show button if unlocked
            html += `<button onclick="${loc.action}" class="btn btn-primary">${loc.name}</button>`;
        }
        // No 'else' block needed, button is simply not added if locked
    });
    // --- End Modification ---

    html += `</div>
             <div class="mt-8">
                <button onclick="renderTownSquare()" class="btn btn-action">Back to Town Square</button>
             </div>`;

    container.innerHTML = html;
    render(container);

    // --- Added Unlock Message Display ---
    if (blacksmithJustUnlocked) {
        setTimeout(() => addToLog("The blacksmith's chimney is smoking. He must have started working again!", 'text-yellow-300'), 100);
    }
    // --- End Added ---

}

function renderHomeImprovements(activeCategoryKey = 'storage') {
    updateRealTimePalette();
    lastViewBeforeInventory = 'commercial_district';
    gameState.currentView = 'home_improvements';

    let html = `<div class="w-full h-full flex flex-col text-left">
        <h2 class="font-medieval text-3xl mb-1 text-center">Foundation & Fortune</h2>
        <p class="text-sm text-gray-400 text-center mb-4">"Gizmo at your service! More space? Bigger booms? Pointy-er practice dummies? You want it, I got it... for a price!"</p>

        <div class="flex-grow flex flex-col md:flex-row gap-6 overflow-hidden">
            <div class="w-full md:w-1/3 flex flex-col gap-2">
                <h3 class="font-bold text-lg text-yellow-300">Upgrade Categories</h3>
                <div id="upgrade-category-list" class="flex flex-col gap-2">`;

    Object.keys(HOME_IMPROVEMENTS).forEach(key => {
        const category = HOME_IMPROVEMENTS[key];
        const isActive = key === activeCategoryKey;
        html += `<button onclick="renderHomeImprovements('${key}')" class="btn ${isActive ? 'bg-yellow-600 border-yellow-800' : 'btn-primary'} text-left">${category.name}</button>`;
    });

    html += `   </div>
            </div>
            <div id="upgrade-content-view" class="w-full md:w-2/3 bg-slate-800 p-4 rounded-lg overflow-y-auto inventory-scrollbar">
                <!-- Upgrade details will be injected here by renderUpgradeCategory -->
            </div>
        </div>
        <div class="text-center mt-4">
            <button onclick="renderCommercialDistrict()" class="btn btn-primary">Back to Market</button>
        </div>
    </div>`;

    const container = document.createElement('div');
    container.innerHTML = html;
    render(container);

    // Now call the function to render the details for the active category
    renderUpgradeCategory(activeCategoryKey);
}

function renderUpgradeCategory(categoryKey) {
    const contentArea = $('#upgrade-content-view');
    if (!contentArea) return;

    const category = HOME_IMPROVEMENTS[categoryKey];
    const currentTier = player.house[`${categoryKey}Tier`] || 0;

    let html = `<h3 class="font-bold text-xl text-yellow-300 mb-4">${category.name}</h3>`;

    if (currentTier >= category.upgrades.length) {
        html += `<p class="text-green-400">You have fully upgraded this feature. Gizmo thanks you for your patronage!</p>`;
    } else {
        const upgrade = category.upgrades[currentTier];
        const canAfford = player.gold >= upgrade.cost;
        html += `
            <div class="p-4 bg-slate-900/50 rounded-lg">
                <h4 class="font-bold text-lg text-cyan-300">Next Upgrade: ${upgrade.name}</h4>
                <p class="text-sm text-gray-400 my-2">${upgrade.description}</p>
                <div class="flex justify-between items-center mt-4">
                    <p class="text-yellow-400 font-bold">Cost: ${upgrade.cost} G</p>
                    <button onclick="purchaseHouseUpgrade('${categoryKey}')" class="btn btn-primary" ${!canAfford ? 'disabled' : ''}>Purchase</button>
                </div>
            </div>
        `;
    }

    html += `<hr class="border-slate-600 my-4">
             <h4 class="font-bold text-md text-gray-300 mb-2">Current Status</h4>
             <p class="text-sm text-gray-400">Current Tier: ${currentTier}</p>`;

    if (currentTier > 0) {
        const currentUpgrade = category.upgrades[currentTier - 1];
        if(categoryKey === 'storage') {
            html += `<p class="text-sm text-gray-400">Capacity: ${currentUpgrade.limits.unique} unique items, stacks of ${currentUpgrade.limits.stack}.</p>`;
        }
        if(categoryKey === 'garden') {
            html += `<p class="text-sm text-gray-400">Size: ${currentUpgrade.size.width}x${currentUpgrade.size.height} plot.</p>`;
            if(currentUpgrade.treeSize) {
                 html += `<p class="text-sm text-gray-400">Tree Plot Size: ${currentUpgrade.treeSize.width}x${currentUpgrade.treeSize.height}.</p>`;
            }
        }
    } else {
        if(categoryKey === 'storage') {
            html += `<p class="text-sm text-gray-400">Capacity: 10 unique items, stacks of 10.</p>`;
        } else {
            html += `<p class="text-sm text-gray-400">Not yet purchased.</p>`;
        }
    }


    contentArea.innerHTML = html;
}

function renderArcaneQuarter() {
    applyTheme('magic');
    lastViewBeforeInventory = 'arcane_quarter';
    gameState.currentView = 'arcane_quarter';

    // --- Added Unlock Checks & Messages ---
    let sageTowerJustUnlocked = false;
    // Message trigger flags reset on load/new game
    if (gameState.enchanterUnlockMsgShown === undefined) gameState.enchanterUnlockMsgShown = false;
    if (gameState.witchUnlockMsgShown === undefined) gameState.witchUnlockMsgShown = false;


    if (player.unlocks.hasTowerKey && !player.unlocks.sageTower) {
        player.unlocks.sageTower = true;
        sageTowerJustUnlocked = true;
        saveGame(); // Save unlock immediately
    }

    const container = document.createElement('div');
    container.className = 'flex flex-col items-center justify-center w-full h-full';

    const locations = [
        { name: "Sage's Tower", action: "renderSageTowerMenu()", unlocked: player.unlocks.sageTower },
        { name: 'Enchanter', action: "renderEnchanterMenu()", unlocked: player.unlocks.enchanter },
        { name: "Witch's Coven", action: "renderWitchsCoven()", unlocked: player.unlocks.witchCoven }
    ];

    let html = `<h2 class="font-medieval text-3xl mb-8 text-center">Arcane Quarter</h2>
                <div class="grid grid-cols-1 gap-4 w-full max-w-xs">`;

    // --- Modified Button Rendering ---
    locations.forEach(loc => {
        if (loc.unlocked) { // Only show button if unlocked
            html += `<button onclick="${loc.action}" class="btn btn-magic">${loc.name}</button>`;
        }
        // No 'else' block needed
    });
    // --- End Modification ---

    html += `</div>
             <div class="mt-8">
                <button onclick="renderTownSquare()" class="btn btn-action">Back to Town Square</button>
             </div>`;

    container.innerHTML = html;
    render(container);

     // --- Added Unlock Message Display ---
    if (sageTowerJustUnlocked) {
        setTimeout(() => addToLog("The tower's magical energy is starting to fluctuate. The sage must have started experimenting again!", 'text-yellow-300'), 100);
    }
    // Enchanter/Witch messages are displayed when the item is picked up via addToInventory
    // --- End Added ---
}

// --- NEW FUNCTION: Renders the MAIN Enchanter menu ---
function renderEnchanterShop() {
    applyTheme('void'); // Use the Enchanter's theme
    const scrollable = mainView.querySelector('.inventory-scrollbar');
    const scrollPos = scrollable ? scrollable.scrollTop : 0;

    lastViewBeforeInventory = 'enchanter_shop'; // Use a specific view name
    gameState.currentView = 'enchanter_shop';

    let itemsHtml = '';
    for (const category in ENCHANTER_INVENTORY) {
        if (ENCHANTER_INVENTORY[category].length === 0) continue;
        itemsHtml += `<h3 class="font-medieval text-xl mt-4 mb-2 text-yellow-300">${category}</h3>`;
        itemsHtml += '<div class="space-y-2">';

        itemsHtml += createItemList({
            items: ENCHANTER_INVENTORY[category],
            detailsFn: getItemDetails,
            actionsHtmlFn: (key, details) => {
                const price = details.price; // Enchanter prices are standard
                return `
                    <span class="text-yellow-400 font-semibold mr-4">${price} G</span>
                    <button onclick="buyItem('${key}', 'enchanter', ${price})" class="btn btn-primary text-sm py-1 px-3" ${player.gold < price ? 'disabled' : ''}>Buy</button>
                `;
            }
        });

        itemsHtml += '</div>';
    }

    let html = `<div class="w-full">
                    <h2 class="font-medieval text-3xl mb-4 text-center">Enchanter's Wares</h2>
                    <p class="text-center text-gray-400 mb-4">"Looking for reagents? Essences? Things to make your pointy bits... pointier?"</p>
                    <div class="h-80 overflow-y-auto inventory-scrollbar pr-2">${itemsHtml}</div>
                    <div class="flex justify-center gap-4 mt-4">
                        <button onclick="renderEnchanterMenu()" class="btn btn-primary">Back</button>
                    </div>
                </div>`;
    const container = document.createElement('div');
    container.innerHTML = html;
    render(container);

    const newScrollable = mainView.querySelector('.inventory-scrollbar');
    if (newScrollable) newScrollable.scrollTop = scrollPos;
}


// --- Renders the ENCHANTING view ---
function renderEnchanterEnchant(selectedElement = null) {
    applyTheme('void');
    lastViewBeforeInventory = 'enchanter_enchant'; // Keep specific view name for inventory return
    gameState.currentView = 'enchanter_enchant'; // Keep specific view state

    const container = document.createElement('div');
    container.className = 'w-full';

    let html = `<h2 class="font-medieval text-3xl mb-2 text-center">The Enchanter's Table</h2>
                <p class="text-center text-gray-400 mb-6">"Bring your gear, bring the essence... let's make some magic happen."</p>`;

    html += `<div class="mb-6 p-4 bg-slate-900/50 rounded-lg">
                <h3 class="font-bold text-lg text-yellow-300 mb-3 text-center">1. Select an Element</h3>
                <div class="flex flex-wrap justify-center gap-2">`;
    const elements = Object.keys(ELEMENTS).filter(e => e !== 'none' && e !== 'healing');
    elements.forEach(key => {
        const isSelected = selectedElement === key;
        html += `<button onclick="renderEnchanterEnchant('${key}')" class="btn ${isSelected ? 'bg-yellow-600 border-yellow-800' : 'btn-primary'} text-sm py-1 px-3">${capitalize(key)}</button>`;
    });
    html += `</div></div>`;

    if (selectedElement) {
        const essenceKey = `${selectedElement}_essence`;
        const essenceDetails = getItemDetails(essenceKey);
        if (!essenceDetails) {
             html += `<p class="text-red-500 text-center">Error: Could not find details for ${selectedElement} essence.</p>`;
        } else {
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
                if (!gear.item || !gear.item.name || gear.item.name === 'None' || !gear.item.rarity) return;

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
    }


    html += `<div class="text-center mt-6"><button onclick="renderEnchanterMenu()" class="btn btn-primary">Back</button></div>`;
    container.innerHTML = html;
    render(container);
}


// --- Renders the MAIN Enchanter menu ---
function renderEnchanterMenu() {
    applyTheme('void'); // Use the Enchanter's theme
    lastViewBeforeInventory = 'enchanter_menu'; // Specific view for returning from inventory/sheet
    gameState.currentView = 'enchanter_menu';

    let html = `
        <div class="w-full text-center">
            <h2 class="font-medieval text-3xl mb-4 text-center">The Enchanter</h2>
            <p class="mb-6 text-gray-400">"Welcome, welcome! Need some... esoteric supplies? Or perhaps looking to imbue your gear with elemental power?"</p>
            <div class="flex flex-col md:flex-row justify-center items-center gap-4">
                <button onclick="renderEnchanterShop()" class="btn btn-primary w-full md:w-auto">Buy Wares</button>
                <button onclick="renderEnchanterEnchant()" class="btn btn-primary w-full md:w-auto">Enchant Gear</button>
            </div>
             <div class="mt-8">
                <button onclick="renderArcaneQuarter()" class="btn btn-action">Back to Arcane Quarter</button>
            </div>
        </div>`;
    const container = document.createElement('div');
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
                <button onclick="renderWitchsCoven('brew')" class="btn btn-magic w-full md:w-auto">Brew Concoctions</button>
                <button onclick="renderWitchsCoven('reset')" class="btn btn-magic w-full md:w-auto">Reset Fate</button>
                <button onclick="renderWitchsCoven('rebirth')" class="btn btn-magic w-full md:w-auto">Rebirth</button>
            </div>`;
    } else if (subView === 'transmute') {
         html += `<h3 class="font-bold text-xl text-yellow-300 mb-4">Transmute Items</h3>
            <div class="h-80 overflow-y-auto inventory-scrollbar pr-2 space-y-3 text-left">`;
        // *** MODIFIED FILTER: Check if hearts property is UNDEFINED ***
        Object.keys(WITCH_COVEN_RECIPES).filter(k => WITCH_COVEN_RECIPES[k].hearts === undefined).forEach(key => {
            const recipe = WITCH_COVEN_RECIPES[key];
            const product = getItemDetails(recipe.output);
            // Check if product exists before trying to access name
            if (!product) {
                console.warn(`Missing item details for Witch Coven Transmute output: ${recipe.output}`);
                return; // Skip rendering this recipe if output item is invalid
            }
            const ingredients = Object.entries(recipe.ingredients).map(([key, val]) => `${val}x ${getItemDetails(key)?.name || key}`).join(', '); // Added fallback name
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
        // *** MODIFIED FILTER: Check if hearts property EXISTS (is not undefined) ***
        Object.keys(WITCH_COVEN_RECIPES).filter(k => WITCH_COVEN_RECIPES[k].hearts !== undefined).forEach(key => {
            const recipe = WITCH_COVEN_RECIPES[key];
            const product = getItemDetails(recipe.output);
            // Check if product exists before trying to access name
             if (!product) {
                console.warn(`Missing item details for Witch Coven Brew output: ${recipe.output}`);
                return; // Skip rendering this recipe if output item is invalid
            }
            const ingredients = Object.entries(recipe.ingredients).map(([key, val]) => `${val}x ${getItemDetails(key)?.name || key}`).join(', '); // Added fallback name
            // Use recipe.hearts (which could be 0) for the check
            const canAfford = player.gold >= recipe.cost && hearts >= recipe.hearts && Object.entries(recipe.ingredients).every(([key, val]) => (player.inventory.items[key] || 0) >= val);
            const heartCostText = recipe.hearts > 0 ? `, ${recipe.hearts} Undying Hearts` : ''; // Only show heart cost if > 0
            html += `<div class="p-3 bg-slate-800 rounded-lg">
                <div class="flex justify-between items-center">
                    <h4 class="font-bold text-lg text-yellow-300" onmouseover="showTooltip('${recipe.output}', event)" onmouseout="hideTooltip()">${product.name}</h4>
                    <button onclick="brewWitchPotion('${key}')" class="btn btn-primary" ${!canAfford ? 'disabled' : ''}>Brew</button>
                </div>
                <p class="text-sm text-gray-400">Requires: ${ingredients}</p>
                <p class="text-sm text-gray-400">Cost: ${recipe.cost} G${heartCostText}</p>
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
        const raceCost = WITCH_COVEN_SERVICES.changeRace;
        // Build race options, pre-selecting current race
        const raceOptions = Object.keys(RACES).map(r => `<option value="${r}" ${player.race === r ? 'selected' : ''}>${r}</option>`).join('');
        // Build element options
        const elementOptions = Object.keys(ELEMENTS)
            .filter(e => e !== 'none' && e !== 'healing')
            .map(e => `<option value="${e}" ${player.elementalAffinity === e ? 'selected' : ''}>${capitalize(e)}</option>`)
            .join('');

        html += `<div class="p-3 bg-slate-800 rounded-lg">
            <p class="font-bold">Change Race (Cost: ${raceCost.gold} G, ${raceCost.hearts} Hearts)</p>
            <div class="flex flex-col sm:flex-row gap-2 mt-2">
                <select id="race-change-select" class="flex-grow bg-gray-800 text-white border border-gray-600 rounded px-2 py-1" onchange="toggleAffinitySelect(this.value, 'race-change-select-affinity-container')">
                    ${raceOptions}
                </select>
                <div id="race-change-select-affinity-container" class="${player.race === 'Elementals' ? '' : 'hidden'} flex-grow">
                    <select id="race-change-select-affinity" class="w-full bg-gray-800 text-white border border-gray-600 rounded px-2 py-1">
                        ${elementOptions}
                    </select>
                </div>
                <button onclick="changeCharacterAspect('race', document.getElementById('race-change-select').value)" class="btn btn-primary">Change</button>
            </div>
        </div>`;

        const classCost = WITCH_COVEN_SERVICES.changeClass;
        // Build class options, pre-selecting current class
        const classOptions = Object.keys(CLASSES).map(c => `<option value="${c}" ${player._classKey === c ? 'selected' : ''}>${CLASSES[c].name}</option>`).join('');

        html += `<div class="p-3 bg-slate-800 rounded-lg">
            <p class="font-bold">Change Class (Cost: ${classCost.gold} G, ${classCost.hearts} Hearts)</p>
            <div class="flex gap-2 mt-2">
                <select id="class-change-select" class="flex-grow bg-gray-800 text-white border border-gray-600 rounded px-2 py-1">${classOptions}</select>
                <button onclick="changeCharacterAspect('class', document.getElementById('class-change-select').value)" class="btn btn-primary">Change</button>
            </div>
        </div>`;

        const bgCost = WITCH_COVEN_SERVICES.changeBackground;
         // Build background options, pre-selecting current background
        const bgOptions = Object.keys(BACKGROUNDS).map(b => `<option value="${b}" ${player.backgroundKey === b ? 'selected' : ''}>${BACKGROUNDS[b].name}</option>`).join('');

        html += `<div class="p-3 bg-slate-800 rounded-lg">
            <p class="font-bold">Change Background (Cost: ${bgCost.gold} G, ${bgCost.hearts} Hearts)</p>
            <div class="flex gap-2 mt-2">
                <select id="bg-change-select" class="flex-grow bg-gray-800 text-white border border-gray-600 rounded px-2 py-1">${bgOptions}</select>
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

    // Also need to adjust the function call in the 'Brew' section to use brewWitchPotion
    // (This was already done in the code block above)
}

// Helper function for Witch's Coven
function toggleAffinitySelect(raceKey, containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.classList.toggle('hidden', raceKey !== 'Elementals');
    }
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

function renderQuestBoard() {
    updateRealTimePalette();
    const scrollable = mainView.querySelector('.inventory-scrollbar');
    const scrollPos = scrollable ? scrollable.scrollTop : 0;

    lastViewBeforeInventory = 'quest_board';
    gameState.currentView = 'quest_board';
    let html = `<div class="w-full"><h2 class="font-medieval text-3xl mb-4 text-center">Quest Board</h2>`;

    if (player.activeQuest) {
        const quest = getQuestDetails(player.activeQuest);
        let progress = player.questProgress;
        let canComplete = progress >= quest.required;

        if (player.activeQuest.category === 'collection' || player.activeQuest.category === 'creation') {
            progress = 0;
            const itemDetails = getItemDetails(quest.target);
            if (itemDetails) {
                 if (quest.target in ITEMS) {
                     progress = player.inventory.items[quest.target] || 0;
                } else {
                    let category;
                    if (quest.target in WEAPONS) category = 'weapons';
                    else if (quest.target in ARMOR) category = 'armor';
                    else if (quest.target in SHIELDS) category = 'shields';
                    else if (quest.target in CATALYSTS) category = 'catalysts';
                    if(category && player.inventory[category]) {
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

        const numQuestsToShow = 2 + player.playerTier;

        let availableQuests = [];
        for (const questKey in QUESTS) {
            const quest = QUESTS[questKey];
            if (quest.tier <= player.playerTier) {
                const category = quest.type || 'extermination';
                availableQuests.push({ ...quest, category: category, key: questKey });
            }
        }

        availableQuests = availableQuests.filter(quest => !player.questsTakenToday.includes(quest.key));

        const rng = seededRandom(player.seed);
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
    updateRealTimePalette();
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
        updateRealTimePalette();
    } else if (type === 'black_market') {
        applyTheme('void');
    }
    const scrollable = mainView.querySelector('.inventory-scrollbar');
    const scrollPos = scrollable ? scrollable.scrollTop : 0;

    let inventory, title;

    // Create a mutable copy of the base inventory
    let shopInventory = JSON.parse(JSON.stringify(SHOP_INVENTORY));

    switch (type) {
        case 'store':
            // --- DYNAMIC RECIPE LOGIC FOR GENERAL STORE ---
            const rng = seededRandom(player.seed);
            let availableRecipes = [];

            // Determine which recipes to potentially show based on house upgrades
            if (player.house.kitchenTier > 0) {
                 const cookingRecipes = shopInventory['Recipes'].filter(key => ITEMS[key] && ITEMS[key].recipeType === 'cooking');
                 const shuffled = shuffleArray([...cookingRecipes], rng);
                 availableRecipes.push(...shuffled.slice(0, 2));
            }
            if (player.house.alchemyTier > 0) {
                 const alchemyRecipes = shopInventory['Recipes'].filter(key => ITEMS[key] && ITEMS[key].recipeType === 'alchemy');
                 const shuffled = shuffleArray([...alchemyRecipes], rng);
                 availableRecipes.push(...shuffled.slice(0, 3));
            }

            // Assign the dynamically selected recipes to the shop's inventory for this render
            shopInventory['Recipes'] = availableRecipes;

            inventory = shopInventory;
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
        // Hide Recipes category if there are none to show
        if (category === 'Recipes' && (!inventory[category] || inventory[category].length === 0)) {
            continue;
        }

        if (inventory[category].length === 0) continue;
        itemsHtml += `<h3 class="font-medieval text-xl mt-4 mb-2 text-yellow-300">${category}</h3>`;
        itemsHtml += '<div class="space-y-2">';

        itemsHtml += createItemList({
            items: inventory[category],
            detailsFn: getItemDetails,
            actionsHtmlFn: (key, details) => {
                const price = Math.floor(details.price * (type === 'black_market' ? 1.5 : 1));
                return `
                    <span class="text-yellow-400 font-semibold mr-4">${price} G</span>
                    <button onclick="buyItem('${key}', '${type}', ${price})" class="btn btn-primary text-sm py-1 px-3" ${player.gold < price ? 'disabled' : ''}>Buy</button>
                `;
            }
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

        itemsHtml += createItemList({
            items: BLACKSMITH_INVENTORY[category],
            detailsFn: getItemDetails,
            actionsHtmlFn: (key, details) => {
                const price = details.price;
                return `
                    <span class="text-yellow-400 font-semibold mr-4">${price} G</span>
                    <button onclick="buyItem('${key}', 'blacksmith', ${price})" class="btn btn-primary text-sm py-1 px-3" ${player.gold < price ? 'disabled' : ''}>Buy</button>
                `;
            }
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
            } else if (ARMOR[ingredientKey]) {
                playerAmount = player.inventory.armor.filter(i => i === ingredientKey).length;
            } else if (WEAPONS[ingredientKey]) {
                 playerAmount = player.inventory.weapons.filter(i => i === ingredientKey).length;
            } else if (SHIELDS[ingredientKey]) {
                 playerAmount = player.inventory.shields.filter(i => i === ingredientKey).length;
            } else if (CATALYSTS[ingredientKey]) {
                 playerAmount = player.inventory.catalysts.filter(i => i === ingredientKey).length;
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

function renderSell() {
    updateRealTimePalette();
    const scrollable = mainView.querySelector('.inventory-scrollbar');
    const scrollPos = scrollable ? scrollable.scrollTop : 0;

    lastViewBeforeInventory = 'sell';
    gameState.currentView = 'sell';

    let sellableHtml = '';
    const categories = ['items', 'weapons', 'armor', 'shields', 'catalysts'];
    let hasSellableItems = false;

    categories.forEach(category => {
        let itemsInCategory = [];
        if (category === 'items') {
            itemsInCategory = Object.keys(player.inventory.items);
        } else {
            if (!Array.isArray(player.inventory[category])) {
                 player.inventory[category] = [];
            }
            itemsInCategory = [...new Set(player.inventory[category])];
        }

        if (itemsInCategory.length > 0) {
            let categoryHtml = '';
            itemsInCategory.forEach(key => {
                const details = getItemDetails(key);
                if (details && details.price > 0 && details.type !== 'key') {
                    const sellPrice = Math.floor(details.price / 4);
                    let count = 0;
                     if (category === 'items') {
                        count = player.inventory.items[key] || 0;
                    } else {
                        count = player.inventory[category].filter(i => i === key).length;
                    }

                     // Don't list equipped items for sale
                    const isEquipped = (category === 'weapons' && player.equippedWeapon.name === details.name) ||
                                     (category === 'armor' && player.equippedArmor.name === details.name) ||
                                     (category === 'shields' && player.equippedShield.name === details.name) ||
                                     (category === 'catalysts' && player.equippedCatalyst.name === details.name);


                    if (count > 0 && !isEquipped) {
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

    const spellsByElement = {};
    for (const spellKey in SPELLS) {
        const spell = SPELLS[spellKey];
        if (!spellsByElement[spell.element]) {
            spellsByElement[spell.element] = [];
        }
        spellsByElement[spell.element].push(spellKey);
    }

    const elementOrder = ['none', 'fire', 'water', 'earth', 'wind', 'lightning', 'nature', 'light', 'void', 'healing'];

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

                if (currentTier === 0) {
                    const canAfford = player.gold >= spellTree.learnCost;
                    html += `<div class="flex justify-between items-center">
                                <h3 class="font-bold text-lg text-yellow-300" onmouseover="showTooltip('${spellKey}', event)" onmouseout="hideTooltip()">${spellDetails.name}</h3>
                                <button onclick="upgradeSpell('${spellKey}')" class="btn btn-primary" ${!canAfford ? 'disabled' : ''}>Learn</button>
                            </div>
                            <p class="text-sm text-gray-400">Cost: ${spellTree.learnCost} G</p>`;
                } else if (currentTier < spellTree.tiers.length) {
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
                } else {
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

        itemsHtml += createItemList({
            items: MAGIC_SHOP_INVENTORY[category],
            detailsFn: getItemDetails,
            actionsHtmlFn: (key, details) => {
                const price = details.price;
                return `
                    <span class="text-yellow-400 font-semibold mr-4">${price} G</span>
                    <button onclick="buyItem('${key}', 'magic', ${price})" class="btn btn-primary text-sm py-1 px-3" ${player.gold < price ? 'disabled' : ''}>Buy</button>
                `;
            }
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

// Inventory Tab Switching
window.setInventoryTab = function(tabName) {
    inventoryActiveTab = tabName;
    renderInventory(); // Re-render with the new active tab
}

function renderInventory() {
    // Check if player can interact right now (added battle check)
    const isInBattle = lastViewBeforeInventory === 'battle'; // Check based on where we came FROM
    // Allow opening inventory even if not player's turn, but disable actions
    const canTakeActionInBattle = isInBattle && gameState.isPlayerTurn && !isProcessingAction;

    // Store scroll position of the *active* list before re-rendering
    const activeList = mainView.querySelector(`#inventory-${inventoryActiveTab}-list`);
    const scrollPos = activeList ? activeList.scrollTop : 0;

    // Set correct return view: If opened from battle, store 'battle', otherwise store the actual previous view
    // Keep lastViewBeforeInventory consistent until we explicitly leave battle view
    if (gameState.currentView !== 'inventory') { // Only update if not already in inventory
        if (gameState.currentView === 'battle') {
            lastViewBeforeInventory = 'battle';
        } else {
            lastViewBeforeInventory = gameState.currentView; // Store actual previous view if not in battle
        }
    }
    gameState.currentView = 'inventory'; // Set current view

    // --- Tab Definitions ---
    // (Tab definitions remain the same)
    const tabs = [
        { key: 'spells', icon: '✨', title: 'Spells' },
        { key: 'key_items', icon: '🔑', title: 'Key Items' },
        { key: 'consumables', icon: '🧪', title: 'Consumables' },
        { key: 'gardens', icon: '🌱', title: 'Gardens' },
        { key: 'materials', icon: '🧱', title: 'Materials' },
        { key: 'weapons', icon: '⚔️', title: 'Weapons' },
        { key: 'catalysts', icon: '🔮', title: 'Catalysts' },
        { key: 'armor', icon: '⛊', title: 'Armor' },
        { key: 'shields', icon: '🛡️', title: 'Shields' },
        { key: 'lures', icon: '🎣', title: 'Lures' }
    ];

    // --- Helper to Render Lists (Modified for Battle Context) ---
    const renderList = (category, title) => {
        let list = [];
        let itemCounts = {};
        let html = ''; // Start empty

        // (Sorting/Type map logic remains the same)
        const consumableOrder = ['healing', 'mana_restore', 'buff', 'cleanse', 'cleanse_specific', 'buff_apply', 'debuff_apply', 'debuff_special', 'enchant', 'experimental'];
        const typeMapConsumables = { /* ... */
            'healing': 'Healing Potions',
            'mana_restore': 'Mana Potions',
            'buff': 'Buff Items',
            'cleanse': 'Cleansing Items',
            'cleanse_specific': 'Antidotes/Needles',
            'buff_apply': 'Greases/Enhancements',
            'debuff_apply': 'Throwables (Debuff)',
            'debuff_special': 'Throwables (Special)',
            'enchant': 'Essences (Combat Use)',
            'experimental': 'Mysterious Concoctions'
        };
        const materialOrder = ['food_ingredient', 'alchemy', 'enchant', 'special', 'junk'];
        const typeMapMaterials = { /* ... */
             'food_ingredient': 'Cooking Ingredients',
             'alchemy': 'Alchemy Reagents',
             'enchant': 'Essences (Crafting)',
             'special': 'Special Items',
             'junk': 'Junk & Trophies'
        };
        const gardenOrder = ['seed', 'sapling'];
        const typeMapGardens = { /* ... */
            'seed': 'Seeds',
            'sapling': 'Saplings'
        };

        // --- Populate 'list' based on category ---
        // (This population logic remains the same)
         if (category === 'items') { // Handling 'Consumables' Tab
            const allConsumableKeys = Object.keys(player.inventory.items).filter(key => {
                const details = getItemDetails(key);
                return details && consumableOrder.includes(details.type);
            });
             const itemsWithDetails = allConsumableKeys.map(key => ({ key, details: getItemDetails(key) }));
             itemsWithDetails.sort((a, b) => {
                 const typeAIndex = consumableOrder.indexOf(a.details.type);
                 const typeBIndex = consumableOrder.indexOf(b.details.type);
                 if (typeAIndex !== typeBIndex) {
                     const finalAIndex = typeAIndex === -1 ? consumableOrder.length : typeAIndex;
                     const finalBIndex = typeBIndex === -1 ? consumableOrder.length : typeBIndex;
                     return finalAIndex - finalBIndex;
                 }
                 return a.details.name.localeCompare(b.details.name);
             });
             list = itemsWithDetails;
        } else if (category === 'gardens') { // Handling 'Gardens' Tab
            const allGardenKeys = Object.keys(player.inventory.items).filter(key => {
                const details = getItemDetails(key);
                return details && gardenOrder.includes(details.type); // Filter for seed/sapling
            });
            const itemsWithDetails = allGardenKeys.map(key => ({ key, details: getItemDetails(key) }));
            itemsWithDetails.sort((a, b) => { // Sort by type (seed vs sapling), then name
                 const typeAIndex = gardenOrder.indexOf(a.details.type);
                 const typeBIndex = gardenOrder.indexOf(b.details.type);
                 if (typeAIndex !== typeBIndex) {
                     return typeAIndex - typeBIndex;
                 }
                 return a.details.name.localeCompare(b.details.name);
            });
            list = itemsWithDetails;
        } else if (category === 'materials') { // Handling 'Materials' Tab
            const allMaterialKeys = Object.keys(player.inventory.items).filter(key => {
                const details = getItemDetails(key);
                // Filter for material types (excluding seed/sapling now)
                return details && materialOrder.includes(details.type);
            });
            const itemsWithDetails = allMaterialKeys.map(key => ({ key, details: getItemDetails(key) }));
            itemsWithDetails.sort((a, b) => {
                 const typeAIndex = materialOrder.indexOf(a.details.type);
                 const typeBIndex = materialOrder.indexOf(b.details.type);
                 if (typeAIndex !== typeBIndex) {
                     const finalAIndex = typeAIndex === -1 ? materialOrder.length : typeAIndex;
                     const finalBIndex = typeBIndex === -1 ? materialOrder.length : typeBIndex;
                     return finalAIndex - finalBIndex;
                 }
                 return a.details.name.localeCompare(b.details.name);
            });
            list = itemsWithDetails;
        } else if (category === 'lures') {
            list = Object.keys(player.inventory.lures).sort((a,b) => getItemDetails(a).name.localeCompare(getItemDetails(b).name)); // Sort lures alphabetically
        } else { // Equipment
            if (!Array.isArray(player.inventory[category])) player.inventory[category] = [];
            player.inventory[category] = player.inventory[category].filter(key => getItemDetails(key)); // Filter invalid keys
            player.inventory[category].forEach(key => itemCounts[key] = (itemCounts[key] || 0) + 1);
            list = Object.keys(itemCounts).sort((a,b) => getItemDetails(a).name.localeCompare(getItemDetails(b).name)); // Sort equipment alphabetically
        }

        // --- Render the List ---
        // (Empty list check remains the same)
         if (['items', 'materials', 'gardens'].includes(category) && list.length === 0) {
            return `<p class="text-gray-400 text-center mt-4">No ${title.toLowerCase()} found.</p>`;
        } else if (!['items', 'materials', 'gardens'].includes(category) && (!list || list.length === 0)) {
            return `<p class="text-gray-400 text-center mt-4">No ${title.toLowerCase()} found.</p>`;
        }

        html += `<div id="inventory-${category}-list" class="h-full overflow-y-auto inventory-scrollbar pr-2 space-y-2">`; // Added space-y-2

        let currentSubType = ''; // Track the current sub-type for headers
        if (category === 'items' || category === 'materials' || category === 'gardens') {
            // Use appropriate type map based on category
            const typeMap = category === 'items' ? typeMapConsumables : (category === 'materials' ? typeMapMaterials : typeMapGardens);

            list.forEach(itemObj => {
                const key = itemObj.key;
                const details = itemObj.details;
                 if (!details) return;

                 const subType = details.type;
                 if (subType !== currentSubType) {
                     currentSubType = subType;
                     const subHeader = typeMap[subType] || capitalize(subType);
                     html += `<h4 class="font-semibold text-yellow-300 text-xs uppercase tracking-wider pt-2">${subHeader}</h4>`;
                 }

                 let countStr = '';
                 let count = player.inventory.items[key] || 0;
                 if (count > 1) countStr = `(x${count})`;

                 let buttonHtml = '';
                 // --- BATTLE MODIFICATION: Disable 'Use' button in battle for items ---
                 if (category === 'items' && !isInBattle) { // OUTSIDE BATTLE
                     let action = `useItem('${key}')`;
                     let buttonClass = 'btn-item';
                     let buttonText = 'Use';
                      // Disable 'Use' for battle-only items outside combat
                     if (['enchant', 'debuff_apply', 'debuff_special'].includes(details.type)) {
                         action = '';
                         buttonText = 'Use (Battle)';
                     }
                     buttonHtml = `<button onclick="${action}" class="btn ${buttonClass} text-sm py-1 px-3" ${action === '' ? 'disabled' : ''}>${buttonText}</button>`;
                 } else if (category === 'items' && isInBattle) { // INSIDE BATTLE
                     // Show disabled 'Use' button in battle, prompt to use via action menu
                     buttonHtml = `<button class="btn btn-item text-sm py-1 px-3" disabled title="Use via 'Item' action">Use</button>`;
                 }
                 // --- END BATTLE MODIFICATION ---

                 html += `<div class="flex justify-between items-center p-2 bg-slate-800 rounded text-sm" onmouseover="showTooltip('${key}', event)" onmouseout="hideTooltip()" onclick="showTooltip('${key}', event)"><span>${details.name} ${countStr}</span>${buttonHtml}</div>`;
            });
        } else { // Equipment or Lures
             list.forEach(key => {
                 const details = getItemDetails(key);
                 if (!details) return;

                 let countStr = '';
                 let count = 0;

                 if (category === 'lures') {
                     count = player.inventory.lures[key] || 0;
                     countStr = `(x${count} uses)`;
                 } else { // Equipment counts
                     count = itemCounts[key] || 0;
                     if (count > 1) countStr = `(x${count})`;
                 }

                 // Determine if equipped
                 const isEquipped = (category === 'weapons' && WEAPONS[key]?.name === player.equippedWeapon?.name) || // Added safety checks
                                  (category === 'catalysts' && CATALYSTS[key]?.name === player.equippedCatalyst?.name) ||
                                  (category === 'armor' && ARMOR[key]?.name === player.equippedArmor?.name) ||
                                  (category === 'shields' && SHIELDS[key]?.name === player.equippedShield?.name) ||
                                  (category === 'lures' && key === player.equippedLure);
                 const equippedText = isEquipped ? "<span class='text-green-400 font-bold ml-2'>[E]</span>" : "";
                 let buttonHtml = '';
                 const canInteract = !isInBattle || canTakeActionInBattle; // Can interact if outside battle OR if it's player's turn in battle

                 // Equip/Unequip Buttons
                 if (isEquipped) {
                     let itemType = category.slice(0, -1);
                     if (category === 'armor') itemType = 'armor';
                     if (category === 'lures') itemType = 'lure';
                     const isDefaultItem = (itemType === 'weapon' && details.name === WEAPONS['fists'].name) ||
                                           (itemType === 'catalyst' && details.name === CATALYSTS['no_catalyst'].name) ||
                                           (itemType === 'armor' && details.name === ARMOR['travelers_garb'].name) ||
                                           (itemType === 'shield' && details.name === SHIELDS['no_shield'].name) ||
                                           (itemType === 'lure' && key === 'no_lure');
                     // --- BATTLE MODIFICATION: Allow unequip in battle (except lures), check if can interact ---
                     if (!isDefaultItem && !(isInBattle && itemType === 'lure')) {
                         buttonHtml = `<button onclick="unequipItem('${itemType}', true, ${isInBattle})" class="btn btn-action text-sm py-1 px-3" ${!canInteract ? 'disabled title="Cannot change gear now"' : ''}>Unequip</button>`;
                     }
                     // --- END BATTLE MODIFICATION ---
                 } else if (['weapons', 'catalysts', 'armor', 'shields', 'lures'].includes(category)) {
                     // --- BATTLE MODIFICATION: Allow equip in battle (except lures), check if can interact ---
                     if (!(isInBattle && category === 'lures')) {
                        buttonHtml = `<button onclick="equipItem('${key}', ${isInBattle})" class="btn btn-primary text-sm py-1 px-3" ${!canInteract ? 'disabled title="Cannot change gear now"' : ''}>Equip</button>`;
                     } else { // Lures cannot be equipped in battle
                         buttonHtml = `<button class="btn btn-primary text-sm py-1 px-3" disabled title="Cannot equip lures in battle">Equip</button>`;
                     }
                     // --- END BATTLE MODIFICATION ---
                 }
                 html += `<div class="flex justify-between items-center p-2 bg-slate-800 rounded text-sm" onmouseover="showTooltip('${key}', event)" onmouseout="hideTooltip()" onclick="showTooltip('${key}', event)"><span>${details.name} ${countStr} ${equippedText}</span>${buttonHtml}</div>`;
            });
        }
        html += `</div>`; // Close scrollable div
        return html;
    };

    // --- Helper to Render Spellbook ---
     const renderSpellbook = () => { /* ... existing code ... */
        let html = '';
        const knownSpells = Object.keys(player.spells);
        if (knownSpells.length === 0) {
            html += `<p class="text-gray-400 text-center mt-4">You have not learned any spells.</p>`;
        } else {
             html += `<div id="inventory-spells-list" class="space-y-2 h-full overflow-y-auto inventory-scrollbar pr-2">`;
            knownSpells.sort((a,b) => SPELLS[a].tiers[0].name.localeCompare(SPELLS[b].tiers[0].name)).forEach(key => {
                const spellTree = SPELLS[key];
                if (!spellTree) return;
                const playerSpell = player.spells[key];
                const details = spellTree.tiers[playerSpell.tier - 1];
                let buttonHtml = '';
                // Disable healing cast if in battle (must use Magic action)
                if (spellTree.element === 'healing' && !isInBattle) { // OUTSIDE BATTLE
                    buttonHtml = `<button onclick="castHealingSpellOutsideCombat('${key}')" class="btn btn-item text-sm py-1 px-3" ${player.hp >= player.maxHp ? 'disabled' : ''}>Cast</button>`;
                } else if (spellTree.element === 'healing' && isInBattle) { // INSIDE BATTLE
                     buttonHtml = `<button class="btn btn-item text-sm py-1 px-3" disabled title="Use via 'Magic' action">Cast</button>`;
                }

                html += `<div class="p-2 bg-slate-800 rounded text-sm" onmouseover="showTooltip('${key}', event)" onmouseout="hideTooltip()" onclick="showTooltip('${key}', event)">
                            <div class="flex justify-between items-center">
                                <span class="font-bold text-purple-200">${details.name} (T${playerSpell.tier})</span>
                                <div class="flex items-center gap-2">
                                    <span class="text-blue-400 text-xs">${details.cost} MP</span>
                                    ${buttonHtml}
                                </div>
                            </div>
                         </div>`;
            });
             html += `</div>`;
        }
        return html;
     };

    // --- Helper to Render Key Items (No changes needed for battle) ---
    // (renderKeyItemsList function remains the same)
     const renderKeyItemsList = () => { /* ... existing code ... */
        const keyItems = Object.keys(player.inventory.items).filter(key => getItemDetails(key)?.type === 'key');
        let html = '';
        if (keyItems.length === 0) {
             html += `<p class="text-gray-400 text-center mt-4">No key items found.</p>`;
        } else {
             html += `<div id="inventory-key_items-list" class="space-y-2 h-full overflow-y-auto inventory-scrollbar pr-2">`;
            html += keyItems.map(key => {
                const details = getItemDetails(key);
                if (!details) return '';
                let buttonHtml = '';
                if (key === 'bestiary_notebook') {
                    // Disable bestiary button in battle? Might be okay to view. Keep enabled for now.
                    buttonHtml = `<button onclick="event.stopPropagation(); renderBestiaryMenu('inventory')" class="btn btn-primary text-sm py-1 px-3">Open</button>`;
                }
                return `<div class="flex justify-between items-center p-2 bg-slate-800 rounded text-sm" onmouseover="showTooltip('${key}', event)" onmouseout="hideTooltip()" onclick="showTooltip('${key}', event)"><span>${details.name}</span>${buttonHtml}</div>`;
            }).join('');
             html += `</div>`;
        }
        return html;
     };

    // --- Build Tab Buttons (remains the same) ---
    // (Tab button HTML generation remains the same)
    let tabHtml = '<div class="grid grid-cols-5 gap-1 mb-2">'; // Use grid, 5 columns
    tabs.forEach(tab => {
        const isActive = inventoryActiveTab === tab.key;
        const bgColor = isActive ? 'bg-yellow-600 border-yellow-800' : 'bg-slate-700 hover:bg-slate-600 border-slate-900';
        tabHtml += `<button onclick="setInventoryTab('${tab.key}')" class="btn ${bgColor} text-xs py-1 px-2 flex items-center justify-center gap-1 w-full">${tab.icon} ${tab.title}</button>`;
    });
    tabHtml += '</div>';


    // --- Determine Content for Right Pane (remains the same) ---
    // (Switch statement for rightPaneContent remains the same)
    let rightPaneContent = '';
    switch (inventoryActiveTab) {
        case 'spells': rightPaneContent = renderSpellbook(); break;
        case 'key_items': rightPaneContent = renderKeyItemsList(); break;
        case 'consumables': rightPaneContent = renderList('items', 'Consumables'); break;
        case 'gardens': rightPaneContent = renderList('gardens', 'Gardens'); break;
        case 'materials': rightPaneContent = renderList('materials', 'Materials'); break;
        case 'weapons': rightPaneContent = renderList('weapons', 'Weapons'); break;
        case 'catalysts': rightPaneContent = renderList('catalysts', 'Catalysts'); break;
        case 'armor': rightPaneContent = renderList('armor', 'Armor'); break;
        case 'shields': rightPaneContent = renderList('shields', 'Shields'); break;
        case 'lures': rightPaneContent = renderList('lures', 'Lures'); break;
        default: rightPaneContent = renderList('items', 'Consumables'); // Default to consumables
    }

    // --- Assemble Final HTML ---
    // Added battle warning message
    let battleWarning = isInBattle ? '<p class="text-center text-yellow-400 text-sm mb-2">Equipping gear consumes your turn! Use items via the Item action.</p>' : ''; // Updated warning
    // Modified Back button action
    const backAction = isInBattle ? 'returnToBattleFromInventory()' : 'returnFromInventory()';

    let html = `
        <div class="w-full text-left h-full flex flex-col">
            <h2 class="font-medieval text-3xl mb-2 text-center">Inventory</h2>
            ${battleWarning}
            ${tabHtml}
            <div class="flex-grow overflow-hidden h-72">
                ${rightPaneContent}
            </div>
            <div class="text-center mt-3">
                <button onclick="${backAction}" class="btn btn-primary">Back</button>
            </div>
        </div>`;
    const container = document.createElement('div');
    container.innerHTML = html;
    render(container);

    // Restore scroll position
    const newActiveList = mainView.querySelector(`#inventory-${inventoryActiveTab}-list`);
    if (newActiveList) {
        newActiveList.scrollTop = scrollPos;
    }
}



function renderBattle(subView = 'main', actionData = null) {
     if (gameState.battleEnded) return;
     // Allow item use even if no enemies (e.g., healing potion)
     // Modified: Allow buff items even if no enemies
     if (currentEnemies.length === 0 && subView !== 'item' && subView !== 'buff') return; // Added buff check


     if (subView === 'main') {
        renderBattleGrid();
     // REMOVED 'item_target' from this condition. Grid highlighting handles it now.
     } else if (subView === 'attack' || subView === 'magic_target') {
        // ... existing code for attack/magic target selection (button list) ...
        // This block remains unchanged as it's only for the old attack/magic button lists,
        // which might still be used if we revert or for a different UI later.
        // However, the item targeting logic that *was* here is now gone.
        let html = `<h2 class="font-medieval text-3xl mb-4 text-center">Choose a Target</h2><div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">`;
        let buttonAction, buttonClass, titleText, backFunction;

        if (subView === 'attack') {
             buttonAction = 'performAttack';
             buttonClass = 'btn-action';
             titleText = 'Attack';
             backFunction = 'renderBattleGrid()'; // Back to main battle actions
        } else { // magic_target
            buttonAction = `castSpell('${actionData.spellKey}', index)`; // Need index placeholder
             buttonClass = 'btn-magic';
             titleText = `Cast ${SPELLS[actionData.spellKey]?.tiers[player.spells[actionData.spellKey]?.tier -1]?.name || 'Spell'}`;
             backFunction = `renderBattle('magic')`; // Back to magic selection
        }

        html = `<h2 class="font-medieval text-3xl mb-4 text-center">${titleText}</h2><div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">`;

        currentEnemies.forEach((enemy, index) => {
            if (enemy.isAlive()) {
                 const finalAction = buttonAction.replace('index', index); // Replace placeholder with actual index
                 html += `<button onclick="${finalAction}" class="btn ${buttonClass}">${enemy.name}</button>`;
            }
        });
        html += `</div><button onclick="${backFunction}" class="btn btn-primary">Back</button>`;
        const container = document.createElement('div');
        container.innerHTML = html;
        render(container);

     } else if (subView === 'magic') {
        // ... existing code for magic selection ...
        // This block remains unchanged.
        let spellsHtml = Object.keys(player.spells).map(key => {
            const spellTree = SPELLS[key];
            if (!spellTree) {
                console.warn(`Invalid spell key "${key}" found in player's spellbook. Skipping.`);
                return ''; // Skip rendering this invalid spell
            }
            const spell = spellTree.tiers[player.spells[key].tier - 1];

            // Calculate cost with potential modifications (display only)
            let displayCost = spell.cost;
            const catalyst = player.equippedCatalyst;
            const armor = player.equippedArmor;
            if (catalyst.effect?.mana_discount) displayCost = Math.max(1, displayCost - catalyst.effect.mana_discount);
            if (armor.effect?.mana_discount) displayCost = Math.max(1, displayCost - armor.effect.mana_discount);
            if (player._classKey === 'warlock' && player.signatureAbilityToggleActive) displayCost = Math.ceil(displayCost * 1.25);
            if (player._classKey === 'magus' && player.activeModeIndex > -1) displayCost = Math.ceil(displayCost * 1.30);
            if (player.statusEffects.magic_dampen) displayCost = Math.floor(displayCost * (1 / player.statusEffects.magic_dampen.multiplier));


            const canCast = player.mp >= displayCost; // Check against potentially modified cost

            // Pass only the spell key string in onclick
            return `<button onclick="battleAction('magic_select', '${key}')" class="btn btn-magic w-full text-left" ${!canCast ? 'disabled' : ''} onmouseover="showTooltip('${key}', event)" onmouseout="hideTooltip()">
                        <div class="flex justify-between"><span>${spell.name}</span><span>${displayCost} MP</span></div>
                    </button>`;
        }).join('');

        let html = `<div class="w-full text-center">
                        <h2 class="font-medieval text-3xl mb-4">Cast a Spell</h2>
                        <div class="h-80 overflow-y-auto inventory-scrollbar pr-2 mb-4">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-2">${spellsHtml}</div>
                        </div>
                        <button onclick="renderBattleGrid()" class="btn btn-primary">Back</button>
                    </div>`;

        const container = document.createElement('div');
        container.innerHTML = html;
        render(container);
     } else if (subView === 'item') {
        // --- MODIFICATION START: Remove Weapons section ---
        let itemsHtml = '';
        // Removed: let weaponsHtml = ''; // New variable for weapons

        // --- Process Usable Items ---
        const usableItems = Object.keys(player.inventory.items)
            .filter(key => {
                const item = ITEMS[key];
                // Filter for usable types IN BATTLE
                return item && ['healing', 'mana_restore', 'buff', 'cleanse', 'enchant', 'experimental', 'cleanse_specific', 'debuff_apply', 'debuff_special'].includes(item.type);
            })
            .map(key => ({ key, details: ITEMS[key] }));

        const typeOrder = ['healing', 'mana_restore', 'buff', 'cleanse', 'cleanse_specific', 'debuff_apply', 'debuff_special', 'enchant', 'experimental'];
        const typeMap = { /* ... existing typeMap ... */
            'healing': 'Healing Potions',
            'mana_restore': 'Mana Potions',
            'buff': 'Buff Items',
            'cleanse': 'Cleansing Items',
            'cleanse_specific': 'Antidotes/Needles',
            'debuff_apply': 'Throwables (Debuff)',
            'debuff_special': 'Throwables (Special)',
            'enchant': 'Essences',
            'experimental': 'Mysterious Concoctions'
        };

        // Sort items
        usableItems.sort((a, b) => { /* ... existing sorting logic ... */
            const typeAIndex = typeOrder.indexOf(a.details.type);
            const typeBIndex = typeOrder.indexOf(b.details.type);
            if (typeAIndex !== typeBIndex) {
                const finalAIndex = typeAIndex === -1 ? typeOrder.length : typeAIndex;
                const finalBIndex = typeBIndex === -1 ? typeOrder.length : typeBIndex;
                return finalAIndex - finalBIndex;
            }
            return a.details.name.localeCompare(b.details.name);
         });

        let currentType = '';
        if (usableItems.length > 0) {
            usableItems.forEach(itemObj => {
                const key = itemObj.key;
                const item = itemObj.details;
                const count = player.inventory.items[key] || 0;
                if (count <= 0) return;

                if (item.type !== currentType) {
                    currentType = item.type;
                    const header = typeMap[currentType] || capitalize(currentType);
                    itemsHtml += `<h4 class="font-semibold text-yellow-300 text-xs uppercase tracking-wider pt-2 col-span-1 md:col-span-2">${header}</h4>`;
                }

                let action = `battleAction('item_select', { itemKey: '${key}' })`;
                // Removed targeting logic for 'enchant', 'debuff_apply', 'debuff_special' here, handled in item_select case now
                itemsHtml += `<button onclick="${action}" class="btn btn-item w-full text-left" onmouseover="showTooltip('${key}', event)" onmouseout="hideTooltip()"><div class="flex justify-between"><span>${item.name}</span><span>x${count}</span></div></button>`;
            });
        } else {
            itemsHtml = `<p class="text-gray-400 text-center col-span-1 md:col-span-2">You have no usable items.</p>`;
        }

        // --- REMOVED Weapons Processing Section ---

        // --- Combine HTML ---
        let html = `<div class="w-full text-center">
                        <h2 class="font-medieval text-3xl mb-4">Use Item</h2> {/* Updated Title */}
                        <div class="h-80 overflow-y-auto inventory-scrollbar pr-2 mb-4">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                                ${itemsHtml} {/* Only items are shown now */}
                            </div>
                        </div>
                        <button onclick="renderBattleGrid()" class="btn btn-primary">Back</button>
                    </div>`;
        // --- END MODIFICATION ---

        const container = document.createElement('div');
        container.innerHTML = html;
        render(container);
     }

}



function renderPostBattleMenu() {
    $('#inventory-btn').disabled = false;
    $('#character-sheet-btn').disabled = false;
    player.clearEncounterBuffs();
    gameState.activeDrone = null; // Clear drone
    
    // --- NPC ALLY: Handle post-battle ---
    if (player.npcAlly) {
        player.npcAlly.clearBattleBuffs(); // Clear ally buffs
        if (player.npcAlly.isFled) {
            addToLog(`<span class="font-bold text-red-700">${player.npcAlly.name} has fled and is gone for good, taking all their equipment...</span>`, "text-red-700");
            player.npcAlly = null; // Ally is permanently gone
            player.encountersSinceLastPay = 0; // Reset counter
        } else if (preTrainingState === null) { // Don't increment salary for training
            player.encountersSinceLastPay++;
            addToLog(`${player.npcAlly.name} looks weary, but stands ready. (HP: ${player.npcAlly.hp}/${player.npcAlly.maxHp})`, "text-blue-200");
            // HP/MP are *not* restored
        }
    }
    // --- END NPC ALLY ---

    // If it was a training battle, restore state and go back to training grounds
    if (preTrainingState !== null) {
        addToLog("Training session ended. Restoring your resources.", "text-cyan-300");
        player.hp = preTrainingState.hp;
        player.mp = preTrainingState.mp;
        preTrainingState = null;
        updateStatsView();
        setTimeout(renderTrainingGrounds, 1500);
        return;
    }

    gameState.currentView = 'post_battle';
    lastViewBeforeInventory = 'post_battle';

    // DO NOT ADVANCE TUTORIAL HERE. It's handled after the "outro" modal.

    const biomeKey = gameState.currentBiome;
    if (!biomeKey) {
        renderTownSquare();
        return;
    }
    const biome = BIOMES[biomeKey];
    let html = `<div class="text-center">
        <h2 class="font-medieval text-3xl mb-4 text-yellow-200">Victory!</h2>
        <p class="mb-6">You have cleared the area. What will you do next?</p>
        <div class="flex flex-col sm:flex-row justify-center items-center gap-4">
            <button onclick="startBattle('${biomeKey}')" class="btn btn-primary w-full sm:w-auto">Continue Exploring</button>
            <button onclick="renderTownSquare()" class="btn btn-primary w-full sm:w-auto">Return to Town</button>
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
    const screenContainer = $('#changelog-screen');
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
        addToLog("You need a catalyst equipped to cast spells.", 'text-red-400');
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
        addToLog(`Not enough MP to cast ${spell.name}.`, 'text-red-400');
        return;
    }

    player.mp -= finalSpellCost;

    let diceCount = spell.damage[0];
    const spellAmp = catalyst.effect?.spell_amp || 0;
    diceCount = Math.min(spell.cap, diceCount + spellAmp);

    let healAmount = rollDice(diceCount, spell.damage[1], `Healing Spell: ${spell.name}`).total + player.magicalDamageBonus;

    // --- Fertilized Seed Interaction (Out of Combat) ---
    if (player.statusEffects.buff_fertilized && spellData.element === 'nature') { // Nature check might be redundant if only light heals
        const healMultiplier = player.statusEffects.buff_fertilized.healMultiplier;
        healAmount = Math.floor(healAmount * healMultiplier);
        addToLog("The Fertilized Seed enhances the healing!", "text-green-200");
        // Buff duration doesn't decrease outside combat
    }
    // --- End Fertilized Seed Interaction ---


    // --- ELEMENTAL: Innate Elementalist (Healing) ---
    if (player.race === 'Elementals' && player.elementalAffinity === 'healing') {
        const damageBonus = (player.level >= 20) ? 1.20 : 1.10;
        healAmount = Math.floor(healAmount * damageBonus);
        if (player.level >= 20) {
            let extraDieRoll = rollDice(1, spell.damage[1], 'Elemental Evo Die').total;
            let cappedExtraDamage = Math.min( (spell.cap * spell.damage[1]) - healAmount, extraDieRoll); // Cap extra die damage
            healAmount += cappedExtraDamage;
        }
    }
    // --- End Elemental Logic ---
    // --- DRAGONBORN: Bloodline Attunement (Healing) ---
    if (player.race === 'Dragonborn') {
        const damageBonus = (player.level >= 20) ? 1.20 : 1.10;
        healAmount = Math.floor(healAmount * damageBonus);
    }
    // --- End Dragonborn Logic ---


    player.hp = Math.min(player.maxHp, player.hp + healAmount);

    addToLog(`You cast ${spell.name} and recover <span class="font-bold text-green-400">${healAmount}</span> HP.`, 'text-green-300');

    updateStatsView();
    renderInventory();
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
    gameState.currentView = 'dialogue';
    $('#betty-encounter-popup').classList.add('hidden');

    if (!player.dialogueFlags.bettyMet) {
        player.dialogueFlags.bettyMet = true;
    }

    if (player.bettyQuestState === 'not_started' || player.bettyQuestState === 'declined') {
        renderBettyDialogue('first_encounter');
    } else if (player.bettyQuestState === 'accepted') {
        const randomIdle = BETTY_DIALOGUE.betty_idle[Math.floor(Math.random() * BETTY_DIALOGUE.betty_idle.length)];
        let html = `<div class="w-full h-full flex flex-col items-center justify-center p-4">
            <div class="w-full max-w-lg text-center">
                <h2 class="font-medieval text-2xl mb-4">Betty's Corner</h2>
                <p class="text-gray-400 mb-6 italic">"${randomIdle}"</p>
                <div class="flex justify-center gap-4">
                    <button onclick="renderBestiaryMenu('betty')" class="btn btn-primary">View Bestiary</button>
                    <button onclick="renderTown()" class="btn btn-primary">Leave</button>
                </div>
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

    let dialogueHtml = `<div class="w-full h-full flex flex-col items-center justify-center p-4">
        <div class="w-full max-w-2xl mx-auto p-4 bg-slate-800 rounded-lg text-center">
        <p class="mb-6 italic text-gray-300">"${scene.prompt}"</p>
        <div class="flex flex-col gap-3">`;

    for (const key in scene.options) {
        const option = scene.options[key];
        dialogueHtml += `<button onclick="handleBettyResponse('${sceneKey}', '${key}')" class="btn btn-primary text-left">${option.text}</button>`;
    }

    dialogueHtml += `</div></div></div>`;

    const container = document.createElement('div');
    container.innerHTML = dialogueHtml;
    render(container);
}

function handleBettyResponse(sceneKey, optionKey) {
    const scene = BETTY_DIALOGUE[sceneKey];
    const option = scene.options[optionKey];

    let responseHtml = `<div class="w-full h-full flex flex-col items-center justify-center p-4">
        <div class="w-full max-w-2xl mx-auto p-4 bg-slate-800 rounded-lg text-center">
            <p class="mb-6 italic text-gray-300">"${option.response}"</p>
        </div>
    </div>`;
    const container = document.createElement('div');
    container.innerHTML = responseHtml;
    render(container);

    setTimeout(() => {
        if (sceneKey === 'first_encounter') {
            renderBettyQuestProposal();
        } else if (sceneKey === 'quest_proposal') {
            let nextHtml = '';
            switch(optionKey) {
                case 'A':
                    player.bettyQuestState = 'accepted';
                    player.addToInventory('bestiary_notebook');
                    nextHtml = `<div class="w-full h-full flex flex-col items-center justify-center p-4"><div class="w-full max-w-2xl mx-auto p-4 bg-slate-800 rounded-lg text-center">
                        <p class="mb-6 italic text-gray-300">"${BETTY_DIALOGUE.quest_proposal.after_accept}"</p>
                        <button onclick="renderTown()" class="btn btn-primary">Finish</button>
                    </div></div>`;
                    container.innerHTML = nextHtml;
                    render(container);
                    break;
                case 'B':
                    player.bettyQuestState = 'declined';
                    setTimeout(renderTown, 2000);
                    break;
                case 'C':
                    player.bettyQuestState = 'accepted';
                    player.addToInventory('bestiary_notebook');
                    nextHtml = `<div class="w-full h-full flex flex-col items-center justify-center p-4"><div class="w-full max-w-2xl mx-auto p-4 bg-slate-800 rounded-lg text-center">
                        <p class="mb-6 italic text-gray-300">"${BETTY_DIALOGUE.quest_proposal.after_accept_silent}"</p>
                        <button onclick="renderTown()" class="btn btn-primary">Finish</button>
                    </div></div>`;
                    container.innerHTML = nextHtml;
                    render(container);
                    break;
            }
        }
    }, 2500);
}

function renderBettyQuestProposal() {
    const scene = BETTY_DIALOGUE.quest_proposal;
    let dialogueHtml = `<div class="w-full h-full flex flex-col items-center justify-center p-4"><div class="w-full max-w-2xl mx-auto p-4 bg-slate-800 rounded-lg text-center">
        <div class="space-y-4 mb-6 italic text-gray-300">`;

    scene.intro.forEach(line => {
        dialogueHtml += `<p>"${line}"</p>`;
    });

    dialogueHtml += `</div><div class="flex flex-col gap-3">`;

    for (const key in scene.options) {
        const option = scene.options[key];
        dialogueHtml += `<button onclick="handleBettyResponse('quest_proposal', '${key}')" class="btn btn-primary text-left">${option.text}</button>`;
    }

    dialogueHtml += `</div></div></div>`;

    const container = document.createElement('div');
    container.innerHTML = dialogueHtml;
    render(container);
}

function formatTime(ms) {
    if (ms <= 0) return "Ready!";
    let seconds = Math.floor(ms / 1000);
    let minutes = Math.floor(seconds / 60);
    let hours = Math.floor(minutes / 60);

    seconds = seconds % 60;
    minutes = minutes % 60;

    const pad = (num) => num.toString().padStart(2, '0');

    if (hours > 0) {
        return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
}

function renderGarden() {
    gameState.currentView = 'garden';
    lastViewBeforeInventory = 'house';

    // Defensive check to prevent crashes if player or house object is missing.
    if (!player || !player.house) {
        console.error("Critical Error: Player or house data is missing when trying to render garden.");
        render(document.createTextNode("Error: Could not load player data for the garden."));
        return;
    }

    const gardenTier = player.house.gardenTier || 0;
    if (gardenTier === 0) {
        render(document.createTextNode("Error: Garden not purchased. Please report this bug."));
        return;
    }

    const upgrade = HOME_IMPROVEMENTS.garden.upgrades[gardenTier - 1];
    if (!upgrade) {
        console.error(`Invalid garden tier or upgrade data for tier ${gardenTier}`);
        render(document.createTextNode("Error: Could not load garden data."));
        return;
    }

    const { width, height } = upgrade.size;
    const totalPlots = width * height;
    const treePlotSize = upgrade.treeSize ? upgrade.treeSize.width * upgrade.treeSize.height : 0;

    // Critical Fix: Ensure the garden arrays are valid and match the expected size for the tier.
    if (!player.house.garden || !Array.isArray(player.house.garden) || player.house.garden.length < totalPlots) {
        const newGarden = Array(totalPlots).fill(null).map(() => ({ seed: null, plantedAt: 0, growthStage: 0 }));
        if(player.house.garden && Array.isArray(player.house.garden)) {
            for(let i = 0; i < player.house.garden.length; i++) {
                if (i < newGarden.length) newGarden[i] = player.house.garden[i];
            }
        }
        player.house.garden = newGarden;
    }
    if (treePlotSize > 0 && (!player.house.treePlots || !Array.isArray(player.house.treePlots) || player.house.treePlots.length < treePlotSize)) {
         const newTreePlots = Array(treePlotSize).fill(null).map(() => ({ seed: null, plantedAt: 0, growthStage: 0 }));
         if(player.house.treePlots && Array.isArray(player.house.treePlots)) {
             for(let i = 0; i < player.house.treePlots.length; i++) {
                 if (i < newTreePlots.length) newTreePlots[i] = player.house.treePlots[i];
             }
         }
         player.house.treePlots = newTreePlots;
    }

    let html = `<div class="w-full text-center">
        <h2 class="font-medieval text-3xl mb-2">Your Garden</h2>
        <p class="text-gray-400 mb-4">Click an empty plot to plant a seed, or a grown plant to harvest.</p>

        <div class="flex flex-col md:flex-row justify-center items-center md:items-start gap-4 w-full">
            <div class="inline-grid gap-2 p-4 bg-slate-900/50 rounded-lg" style="grid-template-columns: repeat(${width}, 1fr);">`;

    for (let i = 0; i < totalPlots; i++) {
        const plot = player.house.garden[i];
        html += renderPlot(plot, i, false);
    }
    html += `</div>`;

    if (upgrade.treeSize) {
        const treeWidth = upgrade.treeSize.width;
        const treeHeight = upgrade.treeSize.height;
        html += `<div class="p-4 bg-slate-900/50 rounded-lg">
                    <h3 class="font-bold text-yellow-300 mb-2">Tree Plot</h3>
                    <div class="inline-grid gap-1" style="grid-template-columns: repeat(${treeWidth}, 1fr);">`;
        for(let i=0; i < treeWidth * treeHeight; i++) {
            const plot = player.house.treePlots[i];
            html += renderPlot(plot, i, true);
        }
        html += `</div></div>`;
    }

    html += `</div>`;

    html += `<div id="seed-selection-box" class="hidden mt-4 p-4 bg-slate-800 rounded-lg max-w-md mx-auto">
            <h3 id="seed-selection-title" class="font-bold text-lg mb-2 text-yellow-300">Select a Seed</h3>
            <div id="seed-list" class="flex flex-wrap justify-center gap-2"></div>
             <button onclick="hideSeedSelection()" class="btn btn-action mt-3 text-sm">Cancel</button>
        </div>`;

    html += `<div class="mt-6">
                <button onclick="renderHouse()" class="btn btn-primary">Back to House</button>
            </div>
    </div>`;

    const container = document.createElement('div');
    container.innerHTML = html;
    render(container);
}


function renderPlot(plot, index, isTreePlot) {
    let content = '';
    let plotClass = 'garden-plot-dirt';
    let action = `showSeedSelection(${index}, ${isTreePlot})`;
    let title = isTreePlot ? 'Empty Tree Plot' : 'Empty Plot';
    let timerHtml = '';

    if (plot && plot.seed) {
        const seedInfo = SEEDS[plot.seed];
        action = '';
        title = `Planted: ${getItemDetails(plot.seed).name}`;
        const timeRemaining = (plot.plantedAt + seedInfo.growthTime) - Date.now();

        switch(plot.growthStage) {
            case 0: content = '🌱'; title += ' (Seedling)'; break;
            case 1: content = isTreePlot ? '🌳' : '🌿'; title += ' (Sprout)'; break;
            case 2: content = isTreePlot ? '🌳' : '🌿'; plotClass='garden-plot-growing'; title += ' (Growing)'; break;
            case 3:
                content = isTreePlot ? '🌲' : '🌻';
                plotClass='garden-plot-ready';
                action = `harvestPlant(${index}, ${isTreePlot})`;
                title = 'Ready to Harvest!';
                break;
        }

        if (plot.growthStage < 3 && timeRemaining > 0) {
            timerHtml = `<div class="garden-timer">${formatTime(timeRemaining)}</div>`;
            title += ` - ${formatTime(timeRemaining)} remaining`;
        }
    }

    return `<div onclick="${action}" class="garden-plot ${isTreePlot ? 'tree-plot' : ''} ${plotClass}" title="${title}">${content}${timerHtml}</div>`;
}


function showSeedSelection(plotIndex, isTreePlot) {
    hideSeedSelection();

    const seedBox = document.getElementById('seed-selection-box');
    const seedList = document.getElementById('seed-list');
    const seedTitle = document.getElementById('seed-selection-title');
    if (!seedBox || !seedList || !seedTitle) return;

    const seedType = isTreePlot ? 'sapling' : 'seed';
    seedTitle.textContent = isTreePlot ? "Select a Sapling to Plant" : "Select a Seed to Plant";

    let availableSeeds = Object.keys(player.inventory.items).filter(key => {
        const item = ITEMS[key];
        return item && (item.type === seedType) && player.inventory.items[key] > 0;
    });

    if (availableSeeds.length === 0) {
        addToLog(`You have no ${seedType}s to plant.`, "text-yellow-400");
        return;
    }

    seedList.innerHTML = '';
    availableSeeds.forEach(seedKey => {
        const details = getItemDetails(seedKey);
        const count = player.inventory.items[seedKey];
        const btn = document.createElement('button');
        btn.className = 'btn btn-primary text-sm';
        btn.innerHTML = `${details.name} (x${count})`;
        btn.onclick = () => plantSeed(plotIndex, seedKey, isTreePlot);
        seedList.appendChild(btn);
    });

    seedBox.classList.remove('hidden');
}

function hideSeedSelection() {
     const seedBox = document.getElementById('seed-selection-box');
     if (seedBox) seedBox.classList.add('hidden');
}

function renderKitchen() {
    gameState.currentView = 'kitchen';
    lastViewBeforeInventory = 'house';
    applyTheme('town');

    let html = `<div class="w-full text-center">
        <h2 class="font-medieval text-3xl mb-2">Kitchen</h2>
        <p class="text-gray-400 mb-6">Combine ingredients to cook hearty meals. Note: Food buffs do not stack.</p>
        <div class="h-80 overflow-y-auto inventory-scrollbar pr-2 space-y-3 max-w-lg mx-auto text-left">`;

    if (player.knownCookingRecipes.length === 0) {
        html += `<p class="text-center text-gray-500">You don't know any recipes. Find or buy some to get started!</p>`;
    } else {
        const availableIngredients = {
            meat: [],
            veggie: [],
            seasoning: []
        };
        Object.keys(player.inventory.items).forEach(itemKey => {
            const details = getItemDetails(itemKey);
            if (details && details.cookingType) {
                for (let i = 0; i < player.inventory.items[itemKey]; i++) {
                    availableIngredients[details.cookingType].push({ key: itemKey, price: details.price });
                }
            }
        });

        for(const type in availableIngredients) {
            availableIngredients[type].sort((a,b) => a.price - b.price);
        }

        player.knownCookingRecipes.forEach(recipeKey => {
            const recipe = COOKING_RECIPES[recipeKey];
            if (!recipe) return;

            let ingredientsHtml = [];
            let canCook = true;

            for (const reqKey in recipe.ingredients) {
                const requiredAmount = recipe.ingredients[reqKey];
                let currentAmount = 0;
                let ingredientName = '';
                const isGeneric = ['meat', 'veggie', 'seasoning'].includes(reqKey);

                if (isGeneric) {
                    currentAmount = availableIngredients[reqKey].length;
                    ingredientName = capitalize(reqKey);
                } else { // Specific ingredient
                    currentAmount = player.inventory.items[reqKey] || 0;
                    const details = getItemDetails(reqKey);
                    ingredientName = details ? details.name : reqKey;
                }

                if (currentAmount < requiredAmount) {
                    canCook = false;
                    ingredientsHtml.push(`<span class="text-red-400">${ingredientName} (${currentAmount}/${requiredAmount})</span>`);
                } else {
                     ingredientsHtml.push(`<span class="text-gray-400">${ingredientName} (${currentAmount}/${requiredAmount})</span>`);
                }
            }

            html += `<div class="p-3 bg-slate-800 rounded-lg ${!canCook ? 'opacity-60' : ''}">
                <div class="flex justify-between items-center">
                    <h4 class="font-bold text-lg ${!canCook ? 'text-gray-500' : 'text-yellow-300'}" onmouseover="showTooltip('${recipeKey}', event)" onmouseout="hideTooltip()">${recipe.name}</h4>
                    <button onclick="cookRecipe('${recipeKey}')" class="btn btn-primary" ${!canCook ? 'disabled' : ''}>Cook</button>
                </div>
                <p class="text-sm">Requires: ${ingredientsHtml.join(', ')}</p>
            </div>`;
        });
    }


    html += `</div>
        <div class="mt-6">
            <button onclick="renderHouse()" class="btn btn-primary">Back to House</button>
        </div>
    </div>`;

    const container = document.createElement('div');
    container.innerHTML = html;
    render(container);
}

let alchemyState = {
    slots: [],
    outputKey: null
};

function renderAlchemyLab() {
    applyTheme('swamp');
    lastViewBeforeInventory = 'house';
    gameState.currentView = 'alchemy_lab';

    const alchemyTier = player.house.alchemyTier || 0;
    if (alchemyTier === 0) {
        render(document.createTextNode("Error: Alchemy Lab not purchased."));
        return;
    }

    const slotCounts = { 1: 3, 2: 4, 3: 4 };
    const numSlots = slotCounts[alchemyTier] || 3;
    const slotClass = numSlots === 3 ? 'slot-tier-1' : 'slot-tier-2';

    // Ensure alchemyState.slots has the correct number of array entries
    while (alchemyState.slots.length < numSlots) {
        alchemyState.slots.push([]);
    }
    if (alchemyState.slots.length > numSlots) {
        alchemyState.slots = alchemyState.slots.slice(0, numSlots);
    }

    let slotsHtml = alchemyState.slots.map((slotContents, index) => {
        const hasItems = slotContents.length > 0;
        const details = hasItems ? getItemDetails(slotContents[0]) : null;
        const displayName = hasItems ? `${details.name} (x${slotContents.length})` : `Ingredient ${index + 1}`;
        const leftClickAction = `openIngredientPicker(${index})`;
        const rightClickAction = hasItems ? `removeLastIngredient(${index}); event.preventDefault()` : '';

        return `
            <div class="alchemy-slot ${slotClass} ${details ? 'filled' : ''}"
                 onclick="${leftClickAction}"
                 oncontextmenu="${rightClickAction}"
                 onmouseover="showTooltip('${hasItems ? slotContents[0] : ''}', event)"
                 onmouseout="hideTooltip()">
                ${displayName}
                <div class="alchemy-connector"></div>
            </div>`;
    }).join('');

    const outputDetails = alchemyState.outputKey ? getItemDetails(alchemyState.outputKey) : null;
    const allSlotsFilled = alchemyState.slots.every(s => s.length > 0);

    let html = `
        <div class="w-full text-left">
            <h2 class="font-medieval text-3xl mb-2 text-center">Home Alchemy Lab</h2>
            <p class="text-center text-gray-400 mb-6">Tier ${alchemyTier} Station. Left-click a slot to add ingredients. Right-click to remove.</p>

            <div class="alchemy-station">
                ${slotsHtml}
                <div class="alchemy-slot alchemy-output ${outputDetails ? 'filled' : ''}" onmouseover="showTooltip('${alchemyState.outputKey || ''}', event)" onmouseout="hideTooltip()">
                    ${outputDetails ? `Brewed:<br>${outputDetails.name}` : 'Output'}
                </div>
            </div>

            <div id="ingredient-picker-container" class="mt-6"></div>

            <div class="text-center mt-6 flex justify-center gap-4">
                <button onclick="brewFromStation()" class="btn btn-primary" ${!allSlotsFilled || outputDetails ? 'disabled' : ''}>Brew Potion</button>
                <button onclick="resetAlchemyStation()" class="btn btn-action">Reset</button>
            </div>
             <div class="text-center mt-4">
                <button onclick="renderHouse()" class="btn btn-primary">Back to House</button>
            </div>
        </div>`;

    const container = document.createElement('div');
    container.innerHTML = html;
    render(container);
}

function openIngredientPicker(slotIndex) {
    const pickerContainer = $('#ingredient-picker-container');
    if (!pickerContainer) return;

    const slotContents = alchemyState.slots[slotIndex] || [];

    // An empty slot can accept any alchemy ingredient.
    // A non-empty slot can only accept more of the same ingredient.
    const currentItemInSlot = slotContents.length > 0 ? slotContents[0] : null;

    // Count all ingredients currently in ANY slot to check against total inventory
    const usedCounts = {};
    alchemyState.slots.flat().forEach(key => {
        if (key) usedCounts[key] = (usedCounts[key] || 0) + 1;
    });

    let availableItems = Object.keys(player.inventory.items).filter(key => {
        const details = ITEMS[key];
        const canAddToSlot = !currentItemInSlot || currentItemInSlot === key;
        return details && details.alchemyType && (player.inventory.items[key] > (usedCounts[key] || 0)) && canAddToSlot;
    });

    if (availableItems.length === 0) {
        const message = currentItemInSlot
            ? `You have no more ${getItemDetails(currentItemInSlot).name} to add.`
            : 'You have no more alchemy ingredients to add.';
        addToLog(message, 'text-yellow-400');
        closeIngredientPicker();
        return;
    }

    let itemsHtml = availableItems.map(key => {
        const details = getItemDetails(key);
        const availableCount = player.inventory.items[key] - (usedCounts[key] || 0);
        return `<button class="btn btn-primary ingredient-item" onclick="selectIngredient(${slotIndex}, '${key}')">${details.name} (x${availableCount})</button>`;
    }).join('');

    pickerContainer.innerHTML = `
        <div class="ingredient-picker">
            <h3 class="font-bold text-lg mb-2 text-yellow-300">Add Ingredient to Slot ${slotIndex + 1}</h3>
            <div class="ingredient-picker-grid">${itemsHtml}</div>
            <div class="text-center mt-3">
                <button onclick="closeIngredientPicker()" class="btn btn-action text-sm">Cancel</button>
            </div>
        </div>`;
}

function closeIngredientPicker() {
    const pickerContainer = $('#ingredient-picker-container');
    if (pickerContainer) pickerContainer.innerHTML = '';
}

function selectIngredient(slotIndex, itemKey) {
    if (!alchemyState.slots[slotIndex]) {
        alchemyState.slots[slotIndex] = [];
    }
    alchemyState.slots[slotIndex].push(itemKey);
    // If we just added the last available item, close the picker. Otherwise, reopen it to add more.
    const usedCount = alchemyState.slots.flat().filter(k => k === itemKey).length;
    if (usedCount >= player.inventory.items[itemKey]) {
        closeIngredientPicker();
    } else {
        openIngredientPicker(slotIndex); // Refresh the picker
    }
    renderAlchemyLab();
}

function removeLastIngredient(slotIndex) {
    if (alchemyState.slots[slotIndex] && alchemyState.slots[slotIndex].length > 0) {
        alchemyState.slots[slotIndex].pop();
        closeIngredientPicker(); // Close picker in case it was open for this slot
        renderAlchemyLab();
    }
}

function brewFromStation() {
    const ingredients = alchemyState.slots.flat().filter(s => s);
    if (ingredients.length === 0) return;

    const outcome = determineBrewingOutcome(ingredients);

    if (brewHomePotion(ingredients, outcome)) {
        if (outcome.success) {
            alchemyState.outputKey = outcome.potion;
        } else {
            alchemyState.outputKey = outcome.potion; // This will be the mysterious concoction
        }
        renderAlchemyLab();
        setTimeout(resetAlchemyStation, 2000);
    }
}

function resetAlchemyStation() {
    const numSlots = alchemyState.slots.length;
    alchemyState = { slots: Array(numSlots).fill(null).map(() => []), outputKey: null };
    renderAlchemyLab();
}

function renderTrainingGrounds() {
    gameState.currentView = 'training_grounds';
    lastViewBeforeInventory = 'house';
    applyTheme('town');

    const trainingTier = player.house.trainingTier || 0;
    const defeatedEnemies = Object.keys(player.legacyQuestProgress || {});
    let html = `<div class="w-full text-center">
        <h2 class="font-medieval text-3xl mb-2">Training Grounds</h2>`;

    // --- Tier 2: Arena of Champions (Replaces Tier 1) ---
    if (trainingTier >= 2) {
        html += `<div class="max-w-2xl mx-auto text-left space-y-4 p-4 border border-yellow-600 rounded-lg mt-6">
            <h3 class="font-bold text-xl text-yellow-300 text-center">Arena of Champions (Tier 2)</h3>
            <p class="text-gray-400 text-center text-sm mb-4">Design your own custom encounter.</p>

            <div>
                <label for="t2-enemy-count" class="block font-bold text-lg mb-2">Number of Enemies (1-5)</label>
                <input type="number" id="t2-enemy-count" value="1" min="1" max="5" class="w-full bg-gray-800 text-white border border-gray-600 rounded px-2 py-1">
            </div>

            <div id="t2-enemy-configs" class="space-y-3"></div>

            <div>
                <label for="t2-grid-size-select" class="block font-bold text-lg mb-2">Arena Size</label>
                <select id="t2-grid-size-select" class="w-full bg-gray-800 text-white border border-gray-600 rounded px-2 py-1">
                    <option value="5">5x5</option>
                    <option value="6" selected>6x6</option>
                </select>
            </div>
             <div class="text-center">
                <button onclick="startTrainingBattle(2)" class="btn btn-primary" ${defeatedEnemies.length === 0 ? 'disabled' : ''}>Start Tier 2 Training</button>
            </div>
        </div>`;
    }
    // --- Tier 1: Sparring Circle ---
    else if (trainingTier >= 1) {
        html += `<div class="max-w-lg mx-auto text-left space-y-4 p-4 border border-gray-700 rounded-lg">
            <h3 class="font-bold text-xl text-yellow-300 text-center">Sparring Circle (Tier 1)</h3>
            <p class="text-gray-400 text-center text-sm mb-4">Practice against a single foe to test your might.</p>
            <div>
                <label for="t1-enemy-select" class="block font-bold text-lg mb-2">Enemy Dummy</label>
                <select id="t1-enemy-select" class="w-full bg-gray-800 text-white border border-gray-600 rounded px-2 py-1">`;

        if (defeatedEnemies.length > 0) {
            defeatedEnemies.forEach(enemyKey => {
                const enemy = MONSTER_SPECIES[enemyKey];
                if (enemy) html += `<option value="${enemyKey}">${enemy.name}</option>`;
            });
        } else {
            html += `<option value="" disabled>Defeat an enemy first</option>`;
        }
        html += `   </select>
            </div>

            <div>
                <label for="t1-grid-size-select" class="block font-bold text-lg mb-2">Arena Size</label>
                <select id="t1-grid-size-select" class="w-full bg-gray-800 text-white border border-gray-600 rounded px-2 py-1">
                    <option value="3">3x3</option>
                    <option value="4">4x4</option>
                    <option value="5" selected>5x5</option>
                    <option value="6">6x6</option>
                </select>
            </div>
            <div class="text-center">
                <button onclick="startTrainingBattle(1)" class="btn btn-primary" ${defeatedEnemies.length === 0 ? 'disabled' : ''}>Start Tier 1 Training</button>
            </div>
        </div>`;
    }

    html += `<div class="mt-8">
        <button onclick="renderHouse()" class="btn btn-action">Back to House</button>
    </div></div>`;

    const container = document.createElement('div');
    container.innerHTML = html;
    render(container);

    // Add event listener for Tier 2 enemy count change
    if (trainingTier >= 2) {
        const enemyCountInput = document.getElementById('t2-enemy-count');
        enemyCountInput.addEventListener('change', () => {
            const count = Math.max(1, Math.min(5, parseInt(enemyCountInput.value) || 1));
            enemyCountInput.value = count;
            generateEnemyConfigRows(count);
        });
        generateEnemyConfigRows(1); // Initial row
    }
}

function generateEnemyConfigRows(count) {
    const container = document.getElementById('t2-enemy-configs');
    if (!container) return;

    const defeatedEnemies = Object.keys(player.legacyQuestProgress || {});
    const enemyOptions = defeatedEnemies.map(key => `<option value="${key}">${MONSTER_SPECIES[key].name}</option>`).join('');
    const rarityOptions = Object.keys(MONSTER_RARITY).map(key => `<option value="${key}">${MONSTER_RARITY[key].name}</option>`).join('');

    let html = '';
    for (let i = 0; i < count; i++) {
        html += `<div class="p-2 border border-gray-700 rounded-md">
            <p class="font-semibold mb-2">Enemy ${i + 1}</p>
            <div class="grid grid-cols-2 gap-2">
                <select id="t2-enemy-type-${i}" class="w-full bg-gray-700 text-white border border-gray-600 rounded px-2 py-1">${enemyOptions}</select>
                <select id="t2-enemy-rarity-${i}" class="w-full bg-gray-700 text-white border border-gray-600 rounded px-2 py-1">${rarityOptions}</select>
            </div>
        </div>`;
    }
    container.innerHTML = html;
}

window.startTrainingBattle = function(tier) {
    let trainingConfig = {};

    if (tier === 1) {
        const enemyKey = document.getElementById('t1-enemy-select').value;
        const gridSize = parseInt(document.getElementById('t1-grid-size-select').value);
        if (!enemyKey) {
            addToLog("You must select an enemy to train against.", "text-red-400");
            return;
        }
        trainingConfig = {
            gridSize: gridSize,
            enemies: [{ key: enemyKey, rarity: 'common' }]
        };
    } else if (tier === 2) {
        const enemyCount = parseInt(document.getElementById('t2-enemy-count').value);
        const gridSize = parseInt(document.getElementById('t2-grid-size-select').value);
        const enemies = [];
        for (let i = 0; i < enemyCount; i++) {
            const key = document.getElementById(`t2-enemy-type-${i}`).value;
            const rarity = document.getElementById(`t2-enemy-rarity-${i}`).value;
            if (key) {
                enemies.push({ key, rarity });
            }
        }
        if (enemies.length === 0) {
            addToLog("You must select at least one enemy to train against.", "text-red-400");
            return;
        }
        trainingConfig = {
            gridSize: gridSize,
            enemies: enemies
        };
    }

    startBattle(null, trainingConfig);
}


// Function to render Cook's On-Field Cooking UI
function renderOnFieldCookingUI() {
    let html = `<div class="w-full text-center">
        <h2 class="font-medieval text-3xl mb-2">On-Field Cooking</h2>
        <p class="text-gray-400 mb-4">Select a recipe to prepare. Missing ingredients will cost MP.</p>
        <div class="h-80 overflow-y-auto inventory-scrollbar pr-2 space-y-3 max-w-lg mx-auto text-left">`;

    if (player.knownCookingRecipes.length === 0) {
        html += `<p class="text-center text-gray-500">You don't know any recipes!</p>`;
    } else {
        const availableIngredients = { meat: [], veggie: [], seasoning: [] };
        Object.keys(player.inventory.items).forEach(itemKey => {
            const details = getItemDetails(itemKey);
            if (details && details.cookingType) {
                const count = player.inventory.items[itemKey];
                if(count > 0) {
                    for (let i = 0; i < count; i++) {
                        availableIngredients[details.cookingType].push({ key: itemKey, price: details.price, rarity: details.rarity || 'Common' });
                    }
                }
            }
        });
        for(const type in availableIngredients) availableIngredients[type].sort((a,b) => a.price - b.price);

        player.knownCookingRecipes.forEach(recipeKey => {
            const recipe = COOKING_RECIPES[recipeKey];
            if (!recipe) return;

            let ingredientsHtml = [];
            let mpCostForMissing = 0;
            const mpCosts = { 'Common': 5, 'Uncommon': 10, 'Rare': 15, 'Epic': 20, 'Legendary': 25, 'Broken': 0 };

            // Create temporary copies for checking availability without consuming yet
            let tempAvailable = JSON.parse(JSON.stringify(availableIngredients));
            let tempInventory = JSON.parse(JSON.stringify(player.inventory.items));


            for (const reqKey in recipe.ingredients) {
                const requiredAmount = recipe.ingredients[reqKey];
                let usedCount = 0;
                let ingredientName = '';
                const isGeneric = ['meat', 'veggie', 'seasoning'].includes(reqKey);

                if (isGeneric) {
                    ingredientName = capitalize(reqKey);
                    for (let i = 0; i < requiredAmount; i++) {
                        if (tempAvailable[reqKey].length > 0) {
                            const itemUsed = tempAvailable[reqKey].shift(); // Use the cheapest available
                             // Decrement count in temp inventory to track specifics
                             if(tempInventory[itemUsed.key]) tempInventory[itemUsed.key]--;
                            usedCount++;
                        } else {
                            mpCostForMissing += mpCosts['Common']; // Assume Common for generic missing
                        }
                    }
                     ingredientsHtml.push(`${ingredientName} (${usedCount}/${requiredAmount})`);
                } else { // Specific ingredient
                    const details = getItemDetails(reqKey);
                    ingredientName = details ? details.name : reqKey;
                    const currentAmount = tempInventory[reqKey] || 0;
                    const amountToUse = Math.min(currentAmount, requiredAmount);
                    if (amountToUse > 0) {
                        tempInventory[reqKey] -= amountToUse; // Decrement from temp
                        usedCount = amountToUse;
                    }
                    const missingAmount = requiredAmount - usedCount;
                    if (missingAmount > 0) {
                        const rarityCost = mpCosts[details?.rarity || 'Common'] || mpCosts['Common'];
                        mpCostForMissing += missingAmount * rarityCost;
                    }
                    ingredientsHtml.push(`${ingredientName} (${usedCount}/${requiredAmount})`);
                }
            }

            const canAfford = player.mp >= mpCostForMissing;
            const costText = mpCostForMissing > 0 ? `<span class="text-blue-400">(${mpCostForMissing} MP)</span>` : '';

            html += `<div class="p-3 bg-slate-800 rounded-lg ${!canAfford ? 'opacity-60' : ''}">
                <div class="flex justify-between items-center">
                    <h4 class="font-bold text-lg ${!canAfford ? 'text-gray-500' : 'text-yellow-300'}" onmouseover="showTooltip('${recipeKey}', event)" onmouseout="hideTooltip()">${recipe.name} ${costText}</h4>
                    <button onclick="executeOnFieldCooking('${recipeKey}')" class="btn btn-primary" ${!canAfford ? 'disabled' : ''}>Cook</button>
                </div>
                <p class="text-sm text-gray-500">Requires: ${ingredientsHtml.join(', ')}</p>
            </div>`;
        });
    }

    html += `</div>
        <div class="mt-6">
            <button onclick="renderBattleGrid()" class="btn btn-action">Cancel</button>
        </div>
    </div>`;

    const container = document.createElement('div');
    container.innerHTML = html;
    render(container); // Replace main view with this UI
}

