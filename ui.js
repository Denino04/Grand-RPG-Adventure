// --- UTILITY & DOM FUNCTIONS ---
const $ = (selector) => document.querySelector(selector);
const logElement = $('#game-log');
const mainView = $('#main-view');

function rollDice(numDice, sides) { let total = 0; for (let i = 0; i < numDice; i++) { total += Math.floor(Math.random() * sides) + 1; } return total; }
function addToLog(message, colorClass = '') { const p = document.createElement('p'); p.innerHTML = message; p.className = `mb-1 ${colorClass}`; logElement.appendChild(p); logElement.scrollTop = logElement.scrollHeight; }
function getItemDetails(itemKey) { if (itemKey in ITEMS) return ITEMS[itemKey]; if (itemKey in WEAPONS) return WEAPONS[itemKey]; if (itemKey in ARMOR) return ARMOR[itemKey]; if (itemKey in SHIELDS) return SHIELDS[itemKey]; if (itemKey in LURES) return LURES[itemKey]; if (itemKey in MAGIC) return MAGIC[itemKey]; return null; }
function render(viewElement) { mainView.innerHTML = ''; mainView.appendChild(viewElement); }

// --- THEME & PALETTES ---
const PALETTES = {
    'default': {
        '--bg-main': '#1f2937', '--bg-secondary': '#111827', '--bg-log': 'rgba(0,0,0,0.3)', '--bg-tooltip': '#111827',
        '--border-main': '#374151', '--text-main': '#d1d5db', '--text-accent': '#fcd34d',
        '--btn-primary-bg': '#475569', '--btn-primary-bg-hover': '#64748b', '--btn-primary-border': '#1e293b', '--btn-primary-border-hover': '#334155',
        '--btn-action-bg': '#dc2626', '--btn-action-bg-hover': '#ef4444', '--btn-action-border': '#991b1b', '--btn-action-border-hover': '#b91c1c',
        '--btn-magic-bg': '#9333ea', '--btn-magic-bg-hover': '#a855f7', '--btn-magic-border': '#6b21a8', '--btn-magic-border-hover': '#7e22ce',
        '--btn-item-bg': '#16a34a', '--btn-item-bg-hover': '#22c55e', '--btn-item-border': '#15803d', '--btn-item-border-hover': '#16a34a',
        '--btn-flee-bg': '#6b7280', '--btn-flee-bg-hover': '#4b5563', '--btn-flee-border': '#374151', '--btn-flee-border-hover': '#1f2937',
    },
    'town': {
        '--bg-main': '#44403c', '--bg-secondary': '#292524', '--bg-log': 'rgba(20,10,0,0.3)', '--bg-tooltip': '#292524',
        '--border-main': '#57534e', '--text-main': '#e7e5e4', '--text-accent': '#f59e0b',
        '--btn-primary-bg': '#a16207', '--btn-primary-bg-hover': '#b45309', '--btn-primary-border': '#713f12', '--btn-primary-border-hover': '#854d0e',
        '--btn-action-bg': '#dc2626', '--btn-action-bg-hover': '#ef4444', '--btn-action-border': '#991b1b', '--btn-action-border-hover': '#b91c1c',
        '--btn-magic-bg': '#9333ea', '--btn-magic-bg-hover': '#a855f7', '--btn-magic-border': '#6b21a8', '--btn-magic-border-hover': '#7e22ce',
        '--btn-item-bg': '#16a34a', '--btn-item-bg-hover': '#22c55e', '--btn-item-border': '#15803d', '--btn-item-border-hover': '#16a34a',
        '--btn-flee-bg': '#78716c', '--btn-flee-bg-hover': '#a8a29e', '--btn-flee-border': '#57534e', '--btn-flee-border-hover': '#44403c',
    },
    'forest': {
        '--bg-main': '#14532d', '--bg-secondary': '#064e3b', '--bg-log': 'rgba(0,10,5,0.3)', '--bg-tooltip': '#064e3b',
        '--border-main': '#065f46', '--text-main': '#d1fae5', '--text-accent': '#a3e635',
        '--btn-primary-bg': '#059669', '--btn-primary-bg-hover': '#047857', '--btn-primary-border': '#065f46', '--btn-primary-border-hover': '#064e3b',
        '--btn-action-bg': '#dc2626', '--btn-action-bg-hover': '#ef4444', '--btn-action-border': '#991b1b', '--btn-action-border-hover': '#b91c1c',
        '--btn-magic-bg': '#9333ea', '--btn-magic-bg-hover': '#a855f7', '--btn-magic-border': '#6b21a8', '--btn-magic-border-hover': '#7e22ce',
        '--btn-item-bg': '#ca8a04', '--btn-item-bg-hover': '#eab308', '--btn-item-border': '#854d0e', '--btn-item-border-hover': '#a16207',
        '--btn-flee-bg': '#78350f', '--btn-flee-bg-hover': '#92400e', '--btn-flee-border': '#451a03', '--btn-flee-border-hover': '#78350f',
    },
    'cave': {
        '--bg-main': '#262626', '--bg-secondary': '#171717', '--bg-log': 'rgba(0,0,0,0.5)', '--bg-tooltip': '#171717',
        '--border-main': '#404040', '--text-main': '#a3a3a3', '--text-accent': '#eab308',
        '--btn-primary-bg': '#525252', '--btn-primary-bg-hover': '#737373', '--btn-primary-border': '#262626', '--btn-primary-border-hover': '#404040',
        '--btn-action-bg': '#ef4444', '--btn-action-bg-hover': '#f87171', '--btn-action-border': '#b91c1c', '--btn-action-border-hover': '#dc2626',
        '--btn-magic-bg': '#a855f7', '--btn-magic-bg-hover': '#c084fc', '--btn-magic-border': '#7e22ce', '--btn-magic-border-hover': '#9333ea',
        '--btn-item-bg': '#16a34a', '--btn-item-bg-hover': '#22c55e', '--btn-item-border': '#15803d', '--btn-item-border-hover': '#16a34a',
        '--btn-flee-bg': '#57534e', '--btn-flee-bg-hover': '#78716c', '--btn-flee-border': '#292524', '--btn-flee-border-hover': '#44403c',
    },
    'mountain': {
        '--bg-main': '#075985', '--bg-secondary': '#0c4a6e', '--bg-log': 'rgba(0,5,20,0.3)', '--bg-tooltip': '#0c4a6e',
        '--border-main': '#0369a1', '--text-main': '#e0f2fe', '--text-accent': '#f0f9ff',
        '--btn-primary-bg': '#0ea5e9', '--btn-primary-bg-hover': '#38bdf8', '--btn-primary-border': '#0369a1', '--btn-primary-border-hover': '#075985',
        '--btn-action-bg': '#f43f5e', '--btn-action-bg-hover': '#fb7185', '--btn-action-border': '#be123c', '--btn-action-border-hover': '#e11d48',
        '--btn-magic-bg': '#a21caf', '--btn-magic-bg-hover': '#d946ef', '--btn-magic-border': '#86198f', '--btn-magic-border-hover': '#a21caf',
        '--btn-item-bg': '#14b8a6', '--btn-item-bg-hover': '#2dd4bf', '--btn-item-border': '#0f766e', '--btn-item-border-hover': '#14b8a6',
        '--btn-flee-bg': '#64748b', '--btn-flee-bg-hover': '#94a3b8', '--btn-flee-border': '#334155', '--btn-flee-border-hover': '#475569',
    },
};

function applyTheme(themeName = 'default') {
    const palette = PALETTES[themeName] || PALETTES['default'];
    for (const key in palette) {
        document.documentElement.style.setProperty(key, palette[key]);
    }
}


// --- TOOLTIP FUNCTIONS ---
function showTooltip(itemKey, event) {
    const tooltipElement = $('#tooltip');
    if (event.type === 'click' && tooltipElement.style.display === 'block' && activeTooltipItem === itemKey) {
        hideTooltip();
        return;
    }
    
    const details = getItemDetails(itemKey);
    if (!details) return;

    let content = `<h4 class="font-bold mb-1" style="color: var(--text-accent);">${details.name}</h4>`;
    
    if (details.damage) content += `<p>Damage: ${details.damage[0]}d${details.damage[1]}</p>`;
    if (details.defense) content += `<p>Defense: ${details.defense}</p>`;
    if (details.blockChance > 0) content += `<p>Block Chance: ${Math.round(details.blockChance * 100)}%</p>`;
    if (details.effect?.type === 'parry') content += `<p>Parry Chance: ${Math.round(details.effect.chance * 100)}%</p>`;
    if (details.amount) content += `<p class="text-green-400">Heals: ${details.amount} HP</p>`;
    if (details.type === 'mana_restore') content += `<p class="text-blue-400">Restores: ${details.amount} MP</p>`;
    if (details.type === 'buff') content += `<p class="text-yellow-300">Effect: ${details.description.split('.')[1]}</p>`;
    if (details.type === 'cleanse') content += `<p class="text-cyan-300">Effect: ${details.description.split('.')[1]}</p>`;
    if (details.cost) content += `<p class="text-blue-400">MP Cost: ${details.cost}</p>`;
    if (details.healing) content += `<p class="text-green-400">Healing: ${details.healing[0]}d${details.healing[1]}</p>`;
    if (details.uses) {
       content += `<p class="text-purple-300">Uses: ${details.uses}</p>`;
    }
    content += `<p class="text-gray-400 mt-2 text-sm"><em>${details.description}</em></p>`;
    
    if (details.effect) {
        content += `<p class="mt-2 font-semibold text-cyan-300">Special Properties:</p><ul class="list-disc list-inside text-sm">`
        if (details.effect.type === 'fire_damage') content += `<li>Deals an extra ${details.effect.damage[0]}d${details.effect.damage[1]} Fire Damage.</li>`;
        if (details.effect.type === 'lightning_damage') content += `<li>Deals an extra ${details.effect.damage[0]}d${details.effect.damage[1]} Lightning Damage.</li>`;
        if (details.effect.type === 'lifesteal') content += `<li>Heals for ${details.effect.amount * 100}% of damage dealt.</li>`;
        if (details.effect.type === 'crit') content += `<li>${details.effect.chance * 100}% chance to deal ${details.effect.multiplier}x damage.</li>`;
        if (details.effect.type === 'ignore_defense') content += `<li>Ignores ${details.effect.amount * 100}% of enemy defense.</li>`;
        if (details.effect.type === 'ranged') content += `<li>Ranged: Causes enemies to have a ${details.effect.chance * 100}% chance to miss.</li>`;
        if (details.effect.petrify_chance) content += `<li>${details.effect.petrify_chance * 100}% chance to Petrify for ${details.effect.duration} turn.</li>`;
        if (details.effect.type === 'paralyze') content += `<li>${details.effect.chance * 100}% chance to Paralyze for ${details.effect.duration} turn.</li>`;
        if (details.effect.type === 'parry') content += `<li>Grants a chance to parry, negating damage and launching a counter-attack.</li>`;
        if (details.effect.type === 'debuff_resist') content += `<li>${details.effect.chance * 100}% chance to resist negative status effects.</li>`;
        if (details.effect.type === 'reflect') content += `<li>Reflects ${details.effect.amount * 100}% of pre-mitigation damage back to the attacker.</li>`;
        if (details.effect.bonus_vs_dragon) content += `<li>Deals ${details.effect.bonus_vs_dragon * 100}% damage to Dragons.</li>`;
        if (details.effect.revive) content += `<li>Revives the user to 50% HP upon death. (Once per lifetime)</li>`;
        content += `</ul>`
    }

    tooltipElement.innerHTML = content;
    tooltipElement.style.display = 'block';
    activeTooltipItem = itemKey;

    let x = event.clientX + 15;
    let y = event.clientY + 15;
    if (x + tooltipElement.offsetWidth > window.innerWidth) {
        x = event.clientX - tooltipElement.offsetWidth - 15;
    }
    if (y + tooltipElement.offsetHeight > window.innerHeight) {
        y = event.clientY - tooltipElement.offsetHeight - 15;
    }
    tooltipElement.style.left = `${x}px`;
    tooltipElement.style.top = `${y}px`;
}

function hideTooltip() {
    $('#tooltip').style.display = 'none';
    activeTooltipItem = null;
}


// --- UI RENDERING FUNCTIONS ----------------------------------------------------
function updateStatsView() {
    if (!player) return;
    $('#player-name').textContent = player.name; 
    $('#player-level').textContent = player.level; 
    $('#player-gold').textContent = player.gold;
    $('#player-hp-text').textContent = `${player.hp} / ${player.maxHp}`; 
    $('#player-mp-text').textContent = `${player.mp} / ${player.maxMp}`; 
    $('#player-xp-text').textContent = `${player.xp} / ${player.xpToNextLevel}`;
    
    const weapon = player.equippedWeapon; 
    const armor = player.equippedArmor;
    const shield = player.equippedShield;
    const lure = LURES[player.equippedLure];
    
    $('#equipped-weapon').textContent = `${weapon.name} (${weapon.damage[0]}d${weapon.damage[1]})`; 
    $('#equipped-armor').textContent = `${armor.name} (Def: ${armor.defense})`;
    
    let shieldStatText = `(Def: ${shield.defense})`;
    if (shield.blockChance > 0) {
        shieldStatText = `(Def: ${shield.defense}, Block: ${Math.round(shield.blockChance * 100)}%)`;
    } else if (shield.effect?.type === 'parry') {
        shieldStatText = `(Def: ${shield.defense}, Parry: ${Math.round(shield.effect.chance * 100)}%)`;
    }
    $('#equipped-shield').textContent = `${shield.name} ${shieldStatText}`;

    $('#equipped-lure').textContent = lure.name;
    
    const questTrackerEl = $('#quest-tracker');
    if (player.activeQuest) {
        const quest = getQuestDetails(player.activeQuest); 
        if (quest) {
            let progress = player.questProgress;
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
            }
            questTrackerEl.innerHTML = `<strong>Quest:</strong> ${quest.title} (${progress} / ${quest.required})`;
        } else {
             questTrackerEl.innerHTML = '';
        }
    } else { questTrackerEl.innerHTML = ''; }

    const legacyQuestTrackerEl = $('#legacy-quest-tracker');
    const legacyQuest = LEGACY_QUESTS['collector_of_legend'];
    const completedCount = Object.keys(player.legacyQuestProgress).length;
    const totalCount = legacyQuest.targets.length;
    legacyQuestTrackerEl.innerHTML = `<strong class="text-purple-400">Legacy:</strong> ${legacyQuest.title} (${completedCount} / ${totalCount})`;
}

function returnFromInventory() {
    switch (lastViewBeforeInventory) {
        case 'main_menu': renderMainMenu(); break;
        case 'town': renderTown(); break;
        case 'town_market': renderTownDistrict('market'); break;
        case 'town_hall': renderTownDistrict('hall'); break;
        case 'town_residential': renderTownDistrict('residential'); break;
        case 'quest_board': renderQuestBoard(); break;
        case 'inn': renderInn(); break;
        case 'magic_shop': renderMagicShop(); break;
        case 'shop': renderShop('store'); break;
        case 'blacksmith': renderShop('blacksmith'); break;
        case 'black_market': renderShop('black_market'); break;
        case 'alchemist': renderAlchemist(); break;
        case 'sell': renderSell(); break;
        case 'battle': renderBattle('main'); break;
        case 'wilderness': renderWildernessMenu(); break;
        default: renderMainMenu();
    }
}

function renderMainMenu() {
    applyTheme('default');
    lastViewBeforeInventory = 'main_menu';
    gameState.currentView = 'main_menu';
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
        logElement.innerHTML = ''; // Clear the log for the next session
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
    applyTheme('town');
    lastViewBeforeInventory = 'town';
    gameState.currentView = 'town';
    const template = document.getElementById('template-town');
    render(template.content.cloneNode(true));
}

function renderTownDistrict(district) {
    let templateId = '';
    let viewKey = '';
    switch(district) {
        case 'market':
            templateId = 'template-market-district';
            viewKey = 'town_market';
            break;
        case 'hall':
            templateId = 'template-hall-district';
            viewKey = 'town_hall';
            break;
        case 'residential':
            templateId = 'template-residential-district';
            viewKey = 'town_residential';
            break;
        default:
            renderTown(); // Go back if district is unknown
            return;
    }
    lastViewBeforeInventory = viewKey;
    gameState.currentView = viewKey;
    const template = document.getElementById(templateId);
    if(template) {
        render(template.content.cloneNode(true));
    }
}

function renderQuestBoard() {
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

        const penalty = 15 * player.level;
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
            html += `<p class="text-center text-gray-400">No quests available for your level.</p>`;
        }
        html += `</div>`;
    }
    html += `<div class="text-center mt-4"><button onclick="renderTown()" class="btn btn-primary">Back to Town</button></div></div>`; 
    const container = document.createElement('div');
    container.innerHTML = html;
    render(container);

    const newScrollable = mainView.querySelector('.inventory-scrollbar');
    if (newScrollable) newScrollable.scrollTop = scrollPos;
}

function renderInn() { 
    lastViewBeforeInventory = 'inn';
    gameState.currentView = 'inn'; 
    const cost = 10 * player.level; 
    let html = `<h2 class="font-medieval text-3xl mb-4 text-center">The Weary Traveler Inn</h2><p class="mb-4 text-center">A night's rest costs ${cost} G. You will be fully restored.</p><div class="flex justify-center gap-4"><button onclick="restAtInn(${cost})" class="btn btn-primary" ${player.gold < cost ? 'disabled' : ''}>Rest for the night</button><button onclick="renderTown()" class="btn btn-primary">Leave</button></div>${player.gold < cost ? '<p class="text-red-400 mt-2 text-center">You cannot afford a room.</p>' : ''}`;
    const container = document.createElement('div');
    container.innerHTML = html;
    render(container);
}

function renderMagicShop() { 
    const scrollable = mainView.querySelector('.inventory-scrollbar');
    const scrollPos = scrollable ? scrollable.scrollTop : 0;

    lastViewBeforeInventory = 'magic_shop';
    gameState.currentView = 'magic_shop'; 
    let learnableSpells = Object.keys(MAGIC).filter(key => !player.spells.includes(key)); 
    let spellsHtml = '<div class="grid grid-cols-1 md:grid-cols-2 gap-4">';
    spellsHtml += learnableSpells.map(key => { const details = MAGIC[key]; return `<div class="p-3 bg-slate-800 rounded" onmouseover="showTooltip('${key}', event)" onmouseout="hideTooltip()" onclick="showTooltip('${key}', event)"><div class="flex justify-between items-center"><h3 class="font-medieval text-lg text-purple-300">${details.name}</h3><div><span class="text-yellow-400 font-semibold mr-4">${details.price} G</span><button onclick="learnSpell('${key}')" class="btn btn-magic text-sm py-1 px-3" ${player.gold < details.price ? 'disabled' : ''}>Learn</button></div></div><p class="text-sm text-gray-400 mt-1">${details.description}</p></div>`; }).join(''); 
    spellsHtml += '</div>';
    if (learnableSpells.length === 0) { spellsHtml = `<p class="text-center text-gray-400">You have learned all available spells.</p>`; } 
    let html = `<div class="w-full"><h2 class="font-medieval text-3xl mb-4 text-center">Whispering Grimoire</h2><p class="text-center text-gray-400 mb-4">Learn new spells to aid you in your journey.</p><div class="h-80 overflow-y-auto inventory-scrollbar pr-2">${spellsHtml}</div><div class="flex justify-center gap-4 mt-4"><button onclick="renderTown()" class="btn btn-primary">Back to Town</button></div></div>`;
    const container = document.createElement('div');
    container.innerHTML = html;
    render(container);

    const newScrollable = mainView.querySelector('.inventory-scrollbar');
    if (newScrollable) newScrollable.scrollTop = scrollPos;
}

function renderShop(type) {
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
        case 'blacksmith':
            inventory = BLACKSMITH_INVENTORY;
            title = 'Clanging Hammer Blacksmith';
            lastViewBeforeInventory = 'blacksmith';
            gameState.currentView = 'blacksmith';
            break;
        case 'black_market':
            inventory = BLACK_MARKET_INVENTORY;
            title = 'Black Market';
            lastViewBeforeInventory = 'black_market';
            gameState.currentView = 'black_market';
            break;
        default: return;
    }

    let itemsHtml = '';
    for (const category in inventory) {
        itemsHtml += `<h3 class="font-medieval text-xl mt-4 mb-2 text-yellow-300">${category}</h3>`;
        itemsHtml += '<div class="space-y-2">';
        inventory[category].forEach(key => {
            const details = getItemDetails(key);
            if (!details) return;
            itemsHtml += `<div class="flex justify-between items-center p-2 bg-slate-800 rounded" onmouseover="showTooltip('${key}', event)" onmouseout="hideTooltip()" onclick="showTooltip('${key}', event)"><span>${details.name}</span><div><span class="text-yellow-400 font-semibold mr-4">${details.price} G</span><button onclick="buyItem('${key}', '${type}')" class="btn btn-primary text-sm py-1 px-3" ${player.gold < details.price ? 'disabled' : ''}>Buy</button></div></div>`;
        });
        itemsHtml += '</div>';
    }
    let html = `<div class="w-full"><h2 class="font-medieval text-3xl mb-4 text-center">${title}</h2><div class="h-80 overflow-y-auto inventory-scrollbar pr-2">${itemsHtml}</div><div class="flex justify-center gap-4 mt-4">${type === 'store' ? `<button onclick="renderSell()" class="btn btn-primary">Sell Items</button>` : ''}<button onclick="renderTownDistrict('market')" class="btn btn-primary">Back to Market</button></div></div>`;
    const container = document.createElement('div');
    container.innerHTML = html;
    render(container);

    const newScrollable = mainView.querySelector('.inventory-scrollbar');
    if (newScrollable) newScrollable.scrollTop = scrollPos;
}

function renderSell() { 
    const scrollable = mainView.querySelector('.inventory-scrollbar');
    const scrollPos = scrollable ? scrollable.scrollTop : 0;

    lastViewBeforeInventory = 'sell';
    gameState.currentView = 'sell'; 
    let sellableHtml = ''; 
    const itemMap = {}; 
    let itemIndex = 0; 
    
    if (player.inventory.items) {
        for (const itemKey in player.inventory.items) {
            const details = getItemDetails(itemKey);
            if (details && details.price > 0) {
                itemMap[itemIndex] = { key: itemKey, category: 'items', count: player.inventory.items[itemKey] };
                itemIndex++;
            }
        }
    }
    const equippableCategories = ['weapons', 'armor', 'shields'];
    for (const category of equippableCategories) {
        if (player.inventory[category]) {
            for (const itemKey of player.inventory[category]) {
                const details = getItemDetails(itemKey);
                if (details && details.price > 0) {
                    itemMap[itemIndex] = { key: itemKey, category: category, count: 1 };
                    itemIndex++;
                }
            }
        }
    }
    if (player.inventory.lures) {
         for (const itemKey in player.inventory.lures) {
            const details = getItemDetails(itemKey);
            if (details && details.price > 0) {
                itemMap[itemIndex] = { key: itemKey, category: 'lures', count: player.inventory.lures[itemKey] };
                itemIndex++;
            }
        }
    }
    
    if (itemIndex > 0) {
        let displayedItems = {};
        sellableHtml += `<div class="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">`;
        let mappedIndex = 0;
        for (const key in itemMap) {
            const item = itemMap[key];
            const details = getItemDetails(item.key);
            let sellPrice = Math.floor(details.price / 2);
            let nameDisplay = details.name;

            if (item.category === 'lures') {
                sellPrice = Math.floor( (details.price / details.uses) / 2 ); // Sell price per use
                nameDisplay += ` (x${item.count} uses)`;
            } else if (item.category === 'items') {
                nameDisplay += ` (x${item.count})`;
            }
            
            const itemHtml = `<div class="flex justify-between items-center p-2 bg-slate-800 rounded" onmouseover="showTooltip('${item.key}', event)" onmouseout="hideTooltip()" onclick="showTooltip('${item.key}', event)"><span>${nameDisplay}</span><div><span class="text-yellow-400 font-semibold mr-4">${sellPrice} G</span><button onclick="sellItem(${mappedIndex})" class="btn btn-primary text-sm py-1 px-3">Sell</button></div></div>`;
            
            sellableHtml += itemHtml.replace(`sellItem(${mappedIndex})`, `sellItem('${item.key}', '${item.category}')`);
            mappedIndex++;
        } 
        sellableHtml += `</div>`;
    } else {
        sellableHtml = `<p class="text-center text-gray-400">You have nothing to sell.</p>`; 
    }
    
    let html = `<div class="w-full"><h2 class="font-medieval text-3xl mb-4 text-center">Sell Items</h2><div class="h-80 overflow-y-auto inventory-scrollbar pr-2">${sellableHtml}</div><div class="flex justify-center mt-4"><button onclick="renderShop('store')" class="btn btn-primary">Back to Shop</button></div></div>`;
    const container = document.createElement('div');
    container.innerHTML = html;
    render(container);

    const newScrollable = mainView.querySelector('.inventory-scrollbar');
    if (newScrollable) newScrollable.scrollTop = scrollPos;

    window.sellItem = (itemKey, category) => {
        const details = getItemDetails(itemKey); 
        let sellPrice = Math.floor(details.price / 2); 
        
        if (category === 'items') { 
            player.inventory.items[itemKey]--; 
            if (player.inventory.items[itemKey] === 0) {
                delete player.inventory.items[itemKey]; 
            }
        } else if (category === 'lures') {
            sellPrice = Math.floor((details.price / details.uses) / 2);
            player.inventory.lures[itemKey]--;
            if (player.inventory.lures[itemKey] === 0) {
                delete player.inventory.lures[itemKey];
            }
        } else { 
            const itemIndexToRemove = player.inventory[category].indexOf(itemKey);
            if (itemIndexToRemove > -1) {
                player.inventory[category].splice(itemIndexToRemove, 1);
            }
        } 
        
        player.gold += sellPrice; 
        addToLog(`You sold one ${details.name} for ${sellPrice} G.`, 'text-yellow-400'); 
        updateStatsView(); 
        renderSell(); 
    }; 
}

function renderAlchemist() {
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
                <button onclick="renderTown()" class="btn btn-primary">Back to Town</button>
            </div>
        </div>`;
    const container = document.createElement('div');
    container.innerHTML = html;
    render(container);

    const newScrollable = mainView.querySelector('.inventory-scrollbar');
    if (newScrollable) newScrollable.scrollTop = scrollPos;
}

function renderInventory() {
    const scrollables = mainView.querySelectorAll('.inventory-scrollbar');
    const scrollPositions = Array.from(scrollables).map(el => el.scrollTop);

    gameState.currentView = 'inventory'; 
    const renderList = (category, title) => { 
        let list;
        let itemCounts = {};

        if (category === 'items') {
            list = Object.keys(player.inventory.items);
        } else if (category === 'lures') {
            list = Object.keys(player.inventory.lures);
        } else {
            player.inventory[category].forEach(key => {
                itemCounts[key] = (itemCounts[key] || 0) + 1;
            });
            list = Object.keys(itemCounts);
        }
        
        if (!list || list.length === 0) return ''; 
        
        let html = `<h3 class="font-medieval text-xl mt-4 mb-2 text-yellow-300">${title}</h3><div class="space-y-2">`; 
        html += list.map(key => { 
            const details = getItemDetails(key); 
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
                             (category === 'armor' && ARMOR[key] === player.equippedArmor) ||
                             (category === 'shields' && SHIELDS[key] === player.equippedShield) ||
                             (category === 'lures' && key === player.equippedLure); 
            const equippedText = isEquipped ? '<span class="text-green-400 font-bold ml-2">[Equipped]</span>' : ''; 
            let buttonHtml = ''; 
            if (category === 'items' && details.type !== 'junk' && details.type !== 'alchemy') { buttonHtml = `<button onclick="useItem('${key}')" class="btn btn-item text-sm py-1 px-3">Use</button>`; } 
            else if ((category === 'weapons' || category === 'armor' || category === 'shields' || category === 'lures') && !isEquipped) { 
                buttonHtml = `<button onclick="equipItem('${key}')" class="btn btn-primary text-sm py-1 px-3">Equip</button>`; 
            }
            return `<div class="flex justify-between items-center p-2 bg-slate-800 rounded" onmouseover="showTooltip('${key}', event)" onmouseout="hideTooltip()" onclick="showTooltip('${key}', event)"><span>${details.name} ${countStr} ${equippedText}</span>${buttonHtml}</div>`; }).join(''); 
            html += `</div>`; 
            return html; 
    }; 
    const renderSpellbook = () => { let html = `<h3 class="font-medieval text-xl mt-4 mb-2 text-purple-300">Spellbook</h3><div class="space-y-2">`; if (player.spells.length === 0) { html += `<p class="text-gray-400">You have not learned any spells.</p>`; } else { html += player.spells.map(key => { const details = MAGIC[key]; return `<div class="p-2 bg-slate-800 rounded" onmouseover="showTooltip('${key}', event)" onmouseout="hideTooltip()" onclick="showTooltip('${key}', event)"><div class="flex justify-between items-center"><span class="font-bold text-purple-200">${details.name}</span><span class="text-blue-400">${details.cost} MP</span></div><p class="text-sm text-gray-400 mt-1">${details.description}</p></div>`; }).join(''); } html += `</div>`; return html; }; 
    let html = `
        <div class="w-full text-left">
            <h2 class="font-medieval text-3xl mb-4 text-center">Inventory & Spells</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 h-80">
                <div class="h-full overflow-y-auto inventory-scrollbar pr-2">
                    ${renderSpellbook()}
                </div>
                <div class="h-full overflow-y-auto inventory-scrollbar pr-2">
                    ${renderList('items', 'Items')}
                    ${renderList('weapons', 'Weapons')}
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
     if (currentEnemies.length === 0 && subView !== 'item') return; // Allow item menu after battle
     if (subView === 'main') {
        const template = document.getElementById('template-battle');
        const view = template.content.cloneNode(true);
        const enemyDisplay = view.querySelector('#enemy-display');
        enemyDisplay.innerHTML = '';

        currentEnemies.forEach((enemy, index) => {
            if (enemy.isAlive()) {
                const enemyDiv = document.createElement('div');
                enemyDiv.className = 'text-center';
                enemyDiv.innerHTML = `
                    <h2 class="font-medieval text-xl mb-1 text-red-400">${enemy.name}</h2>
                    <p class="text-sm">${enemy.hp} / ${enemy.maxHp} HP</p>
                `;
                enemyDisplay.appendChild(enemyDiv);
            }
        });

        const actionsContainer = view.querySelector('#battle-actions');
        let actionsHtml = '';
        if (player.statusEffects.swallowed) {
            actionsHtml = `<button onclick="struggleSwallow()" class="btn btn-action w-48 rounded-full">Struggle!</button>`;
        } else {
            actionsHtml = `
                <button onclick="battleAction('attack')" class="btn btn-action w-28 rounded-full">Attack</button>
                <button onclick="battleAction('magic')" class="btn btn-magic w-28 rounded-full">Magic</button>
                <button onclick="battleAction('item')" class="btn btn-item w-28 rounded-full">Item</button>
                <button onclick="battleAction('flee')" class="btn btn-flee w-28 rounded-full">Flee</button>
            `;
        }
        actionsContainer.innerHTML = actionsHtml;

        render(view);

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
        html += `</div><button onclick="renderBattle('main')" class="btn btn-primary">Back</button>`;
        const container = document.createElement('div');
        container.innerHTML = html;
        render(container);
     } else if (subView === 'magic') {
        let spellsHtml = player.spells.map(key => { const spell = MAGIC[key]; const canCast = player.mp >= spell.cost; return `<button onclick="battleAction('magic_select', {spellKey: '${key}'})" class="btn btn-magic w-full text-left" ${!canCast ? 'disabled' : ''} onmouseover="showTooltip('${key}', event)" onmouseout="hideTooltip()"><div class="flex justify-between"><span>${spell.name}</span><span>${spell.cost} MP</span></div></button>`; }).join('');
        let html = `<h2 class="font-medieval text-3xl mb-4 text-center">Cast a Spell</h2><div class="grid grid-cols-2 gap-2 mb-4">${spellsHtml}</div><button onclick="renderBattle('main')" class="btn btn-primary">Back</button>`;
        const container = document.createElement('div');
        container.innerHTML = html;
        render(container);
     } else if (subView === 'item') {
        let itemsHtml = Object.keys(player.inventory.items).filter(key => ITEMS[key].type !== 'junk' && ITEMS[key].type !== 'alchemy').map(key => { const item = ITEMS[key]; const count = player.inventory.items[key]; return `<button onclick="useItem('${key}', true)" class="btn btn-item w-full text-left" onmouseover="showTooltip('${key}', event)" onmouseout="hideTooltip()"><div class="flex justify-between"><span>${item.name}</span><span>x${count}</span></div></button>`; }).join('');
        if (!itemsHtml) { itemsHtml = `<p class="text-gray-400 text-center col-span-2">You have no usable items.</p>`; }
        let html = `<h2 class="font-medieval text-3xl mb-4 text-center">Use an Item</h2><div class="grid grid-cols-2 gap-2 mb-4">${itemsHtml}</div><button onclick="renderBattle('main')" class="btn btn-primary">Back</button>`;
        const container = document.createElement('div');
        container.innerHTML = html;
        render(container);
     }
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
    $('#game-container').classList.remove('hidden');
    const container = document.createElement('div');
    container.innerHTML = html;
    render(container);
}
