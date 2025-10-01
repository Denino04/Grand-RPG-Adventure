// --- UTILITY & DOM FUNCTIONS ---
const $ = (selector) => document.querySelector(selector);
const logElement = $('#game-log');
const mainView = $('#main-view');
let characterSheetOriginalStats = null;


function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function rollDice(numDice, sides, purpose = 'Generic Roll') { 
    let rolls = [];
    for (let i = 0; i < numDice; i++) { 
        rolls.push(Math.floor(Math.random() * sides) + 1);
    }
    const total = rolls.reduce((a, b) => a + b, 0);
    if (isDebugVisible) {
        addToLog(`DEBUG: ${purpose} - Rolled ${numDice}d${sides} -> [${rolls.join(', ')}] = ${total}`, 'text-gray-500');
    }
    return total; 
}
function addToLog(message, colorClass = '') { const p = document.createElement('p'); p.innerHTML = message; p.className = `mb-1 ${colorClass}`; logElement.appendChild(p); logElement.scrollTop = logElement.scrollHeight; }
function getItemDetails(itemKey) { if (itemKey in ITEMS) return ITEMS[itemKey]; if (itemKey in WEAPONS) return WEAPONS[itemKey]; if (itemKey in CATALYSTS) return CATALYSTS[itemKey]; if (itemKey in ARMOR) return ARMOR[itemKey]; if (itemKey in SHIELDS) return SHIELDS[itemKey]; if (itemKey in LURES) return LURES[itemKey]; return null; }
function render(viewElement) { 
    hideTooltip();
    mainView.innerHTML = ''; 
    mainView.appendChild(viewElement); 
    updateDebugView();
}

// --- DEBUG FUNCTIONS ---
function toggleDebug() {
    isDebugVisible = !isDebugVisible;
    const panel = $('#debug-panel');
    panel.classList.toggle('hidden', !isDebugVisible);
    if (isDebugVisible) {
        if (!$('#debug-effective-stats-container')) {
            const modifyStatsTitle = Array.from(panel.querySelectorAll('h4')).find(h => h.textContent === 'Modify Stats');
            if (modifyStatsTitle) {
                const container = document.createElement('div');
                container.id = 'debug-effective-stats-container';
                container.innerHTML = `
                    <hr class="my-2 border-gray-600">
                    <h4 class="font-bold mb-2">Active Effects & Stat Changes</h4>
                    <div id="debug-effective-stats" class="text-xs space-y-1"></div>
                `;
                modifyStatsTitle.before(container);
            }
        }
        updateDebugView();
        updateDebugAddItemOptions();
        populateDebugStatInputs();
    }
}

function updateDebugView() {
    if (!isDebugVisible || !player) return;
    const content = {
        player: player,
        gameState: gameState,
        currentEnemies: currentEnemies
    };
    $('#debug-content').textContent = JSON.stringify(content, (key, value) => {
        if (key === 'swallower') return value ? `Enemy(${value.name})` : value;
        return value;
    }, 2);

    const statsDiv = $('#debug-effective-stats');
    if (!statsDiv) return;

    const effects = player.statusEffects;
    
    let effectiveStrength = player.strength;
    let effectiveDefense = player.physicalDefense;

    for (const key in effects) {
        const effect = effects[key];
        if (effect.strMultiplier) effectiveStrength = Math.floor(effectiveStrength * effect.strMultiplier);
        else if (key === 'strength' && effect.multiplier) effectiveStrength = Math.floor(effectiveStrength * effect.multiplier);
        if (effect.defMultiplier) effectiveDefense = Math.floor(effectiveDefense * effect.defMultiplier);
        else if (key === 'stonehide' && effect.multiplier) effectiveDefense = Math.floor(effectiveDefense * effect.multiplier);
    }

    let statsHtml = '<ul class="list-disc list-inside mb-2">';
    statsHtml += `<li>Strength: ${player.strength}`;
    if (effectiveStrength !== player.strength) statsHtml += ` -> <strong class="text-green-400">${effectiveStrength}</strong>`;
    statsHtml += '</li>';

    let baseDefense = player.physicalDefense;
    statsHtml += `<li>Defense: ${baseDefense}`;
    if (effectiveDefense !== baseDefense) statsHtml += ` -> <strong class="text-green-400">${effectiveDefense}</strong>`;
    statsHtml += '</li>';
    statsHtml += '</ul>';

    let effectsHtml = '<hr class="my-1 border-gray-600"><p class="font-semibold">Active Effects:</p><ul class="list-disc list-inside">';
    let hasEffects = false;
    for (const key in effects) {
        hasEffects = true;
        const effect = effects[key];
        effectsHtml += `<li><span class="font-semibold text-yellow-300">${capitalize(key)}</span> (Duration: ${effect.duration || '∞'})</li>`;
    }
    if (!hasEffects) effectsHtml += '<li>None</li>';
    effectsHtml += '</ul>';

    statsDiv.innerHTML = statsHtml + effectsHtml;
}

function updateDebugAddItemOptions() {
    if (!isDebugVisible) return;
    const itemSelect = $('#debug-item-select');
    if (!itemSelect) return;
    itemSelect.innerHTML = '';

    const itemCategories = { 'Weapons': WEAPONS, 'Catalysts': CATALYSTS, 'Armor': ARMOR, 'Shields': SHIELDS, 'Items': ITEMS, 'Lures': LURES };
    for (const categoryName in itemCategories) {
        const optgroup = document.createElement('optgroup');
        optgroup.label = categoryName;
        const sourceObject = itemCategories[categoryName];
        for (const key in sourceObject) {
            const item = sourceObject[key];
            if (!item.name) continue;
            const option = document.createElement('option');
            option.value = key;
            option.textContent = item.name;
            optgroup.appendChild(option);
        }
        itemSelect.appendChild(optgroup);
    }
}

function debugAddItem() {
    if (!player) return;
    const itemKey = $('#debug-item-select').value;
    if (itemKey) {
        player.addToInventory(itemKey);
        addToLog(`DEBUG: Added ${getItemDetails(itemKey).name} to inventory.`, 'text-gray-500');
        if (gameState.currentView === 'inventory') renderInventory();
    }
}

function populateDebugStatInputs() {
    if (!isDebugVisible || !player) return;
    $('#debug-level').value = player.level;
    $('#debug-gold').value = player.gold;
    $('#debug-xp').value = player.xp;
    $('#debug-hp').value = player.hp;
    $('#debug-mp').value = player.mp;
    $('#debug-str').value = player.strength;
    $('#debug-int').value = player.intelligence;
}

function debugUpdateVariables() {
    if (!player) return;
    player.level = parseInt($('#debug-level').value) || player.level;
    player.gold = parseInt($('#debug-gold').value) || player.gold;
    player.xp = parseInt($('#debug-xp').value) || player.xp;
    player.hp = parseInt($('#debug-hp').value) || player.hp;
    player.mp = parseInt($('#debug-mp').value) || player.mp;
    player.strength = parseInt($('#debug-str').value) || player.strength;
    player.intelligence = parseInt($('#debug-int').value) || player.intelligence;
    
    addToLog('DEBUG: Player stats updated.', 'text-gray-500');
    updateStatsView();
}

// --- THEME & PALETTES ---
const PALETTES = {
    'default': {
        '--bg-main': '#1f2937', '--bg-secondary': '#111827', '--bg-log': 'rgba(0,0,0,0.3)', '--bg-tooltip': '#111827',
        '--border-main': '#374151', '--text-main': '#d1d5db', '--text-accent': '#fcd34d',
        '--btn-primary-bg': '#475569', '--btn-primary-bg-hover': '#64748b', '--btn-primary-border': '#1e293b', '--btn-primary-border-hover': '#334155',
    },
    'town': {
        '--bg-main': '#44403c', '--bg-secondary': '#292524', '--bg-log': 'rgba(20,10,0,0.3)', '--bg-tooltip': '#292524',
        '--border-main': '#57534e', '--text-main': '#e7e5e4', '--text-accent': '#f59e0b',
        '--btn-primary-bg': '#a16207', '--btn-primary-bg-hover': '#b45309', '--btn-primary-border': '#713f12', '--btn-primary-border-hover': '#854d0e',
    },
    'forest': {
        '--bg-main': '#14532d', '--bg-secondary': '#064e3b', '--bg-log': 'rgba(0,10,5,0.3)', '--bg-tooltip': '#064e3b',
        '--border-main': '#065f46', '--text-main': '#d1fae5', '--text-accent': '#a3e635',
        '--btn-primary-bg': '#059669', '--btn-primary-bg-hover': '#047857', '--btn-primary-border': '#065f46', '--btn-primary-border-hover': '#064e3b',
    },
    'cave': {
        '--bg-main': '#262626', '--bg-secondary': '#171717', '--bg-log': 'rgba(0,0,0,0.5)', '--bg-tooltip': '#171717',
        '--border-main': '#404040', '--text-main': '#a3a3a3', '--text-accent': '#eab308',
        '--btn-primary-bg': '#525252', '--btn-primary-bg-hover': '#737373', '--btn-primary-border': '#262626', '--btn-primary-border-hover': '#404040',
    },
    'mountain': {
        '--bg-main': '#075985', '--bg-secondary': '#0c4a6e', '--bg-log': 'rgba(0,5,20,0.3)', '--bg-tooltip': '#0c4a6e',
        '--border-main': '#0369a1', '--text-main': '#e0f2fe', '--text-accent': '#f0f9ff',
        '--btn-primary-bg': '#0ea5e9', '--btn-primary-bg-hover': '#38bdf8', '--btn-primary-border': '#0369a1', '--btn-primary-border-hover': '#075985',
    },
    'swamp': {
        '--bg-main': '#1a361e', '--bg-secondary': '#0f2012', '--bg-log': 'rgba(10,20,15,0.4)', '--bg-tooltip': '#0f2012',
        '--border-main': '#2a5231', '--text-main': '#c6f6d5', '--text-accent': '#68d391',
        '--btn-primary-bg': '#785a28', '--btn-primary-bg-hover': '#97763a', '--btn-primary-border': '#5c451e', '--btn-primary-border-hover': '#785a28',
    },
    'volcano': {
        '--bg-main': '#2d3748', '--bg-secondary': '#1a202c', '--bg-log': 'rgba(0,0,0,0.5)', '--bg-tooltip': '#1a202c',
        '--border-main': '#4a5568', '--text-main': '#e2e8f0', '--text-accent': '#f56565',
        '--btn-primary-bg': '#c53030', '--btn-primary-bg-hover': '#e53e3e', '--btn-primary-border': '#9b2c2c', '--btn-primary-border-hover': '#c53030',
    },
    'tundra': {
        '--bg-main': '#ebf8ff', '--bg-secondary': '#bee3f8', '--bg-log': 'rgba(200, 220, 255, 0.4)', '--bg-tooltip': '#bee3f8',
        '--border-main': '#90cdf4', '--text-main': '#2c5282', '--text-accent': '#3182ce',
        '--btn-primary-bg': '#4299e1', '--btn-primary-bg-hover': '#63b3ed', '--btn-primary-border': '#2b6cb0', '--btn-primary-border-hover': '#3182ce',
    },
    'void': {
        '--bg-main': '#1a192c', '--bg-secondary': '#000000', '--bg-log': 'rgba(10, 5, 20, 0.5)', '--bg-tooltip': '#000000',
        '--border-main': '#44337a', '--text-main': '#e9d8fd', '--text-accent': '#d63384',
        '--btn-primary-bg': '#44337a', '--btn-primary-bg-hover': '#5a439a', '--btn-primary-border': '#2c215d', '--btn-primary-border-hover': '#44337a',
    },
    'necropolis': {
        '--bg-main': '#2d3748', '--bg-secondary': '#1a202c', '--bg-log': 'rgba(0,0,0,0.5)', '--bg-tooltip': '#1a202c',
        '--border-main': '#4a5568', '--text-main': '#a0aec0', '--text-accent': '#9ae6b4',
        '--btn-primary-bg': '#4a5568', '--btn-primary-bg-hover': '#718096', '--btn-primary-border': '#2d3748', '--btn-primary-border-hover': '#4a5568',
    },
    'magic': {
        '--bg-main': '#2c1b47', '--bg-secondary': '#1a102d', '--bg-log': 'rgba(10, 5, 20, 0.5)', '--bg-tooltip': '#1a102d',
        '--border-main': '#4a3a6b', '--text-main': '#e6defe', '--text-accent': '#f0abfc',
        '--btn-primary-bg': '#4a3a6b', '--btn-primary-bg-hover': '#6a5a8b', '--btn-primary-border': '#2c215d', '--btn-primary-border-hover': '#4a3a6b',
    },
    'noon': {
        '--bg-main': '#e0e8f0',
        '--bg-secondary': '#cbd5e1',
        '--bg-log': 'rgba(203, 213, 225, 0.6)',
        '--bg-tooltip': '#cbd5e1',
        '--border-main': '#94a3b8',
        '--text-main': '#1e293b',
        '--text-accent': '#0369a1',
        '--btn-primary-bg': '#0ea5e9',
        '--btn-primary-bg-hover': '#38bdf8',
        '--btn-primary-border': '#075985',
        '--btn-primary-border-hover': '#0369a1',
    },
    'sunset': {
        '--bg-main': '#d35400', '--bg-secondary': '#aa4400', '--bg-log': 'rgba(255, 240, 230, 0.3)', '--bg-tooltip': '#aa4400',
        '--border-main': '#f39c12', '--text-main': '#fdf6e3', '--text-accent': '#e74c3c',
        '--btn-primary-bg': '#8e44ad', '--btn-primary-bg-hover': '#9b59b6', '--btn-primary-border': '#6c3483', '--btn-primary-border-hover': '#8e44ad',
    },
    'midnight': {
        '--bg-main': '#0c0c1d', '--bg-secondary': '#05050f', '--bg-log': 'rgba(20, 20, 40, 0.5)', '--bg-tooltip': '#05050f',
        '--border-main': '#2d2d5a', '--text-main': '#bdc3c7', '--text-accent': '#1abc9c',
        '--btn-primary-bg': '#2d2d5a', '--btn-primary-bg-hover': '#4a4a8c', '--btn-primary-border': '#1c1c3a', '--btn-primary-border-hover': '#2d2d5a',
    }
};

function applyTheme(themeName = 'default') {
    const palette = PALETTES[themeName] || PALETTES['default'];
    // Default button colors are shared unless overridden by the theme itself.
    const finalPalette = {
        '--btn-action-bg': '#dc2626',
        '--btn-action-bg-hover': '#ef4444',
        '--btn-action-border': '#991b1b',
        '--btn-action-border-hover': '#b91c1c',
        '--btn-magic-bg': '#9333ea',
        '--btn-magic-bg-hover': '#a855f7',
        '--btn-magic-border': '#6b21a8',
        '--btn-magic-border-hover': '#7e22ce',
        '--btn-item-bg': '#16a34a',
        '--btn-item-bg-hover': '#22c55e',
        '--btn-item-border': '#15803d',
        '--btn-item-border-hover': '#16a34a',
        '--btn-flee-bg': '#6b7280',
        '--btn-flee-bg-hover': '#4b5563',
        '--btn-flee-border': '#374151',
        '--btn-flee-border-hover': '#1f2937',
        ...palette
    };
    for (const key in finalPalette) {
        document.documentElement.style.setProperty(key, finalPalette[key]);
    }
}

// --- TOOLTIP FUNCTIONS ---
let activeTooltipItem = null;
function showTooltip(itemKey, event) {
    const tooltipElement = $('#tooltip');
    if (event.type === 'click' && tooltipElement.style.display === 'block' && activeTooltipItem === itemKey) {
        hideTooltip();
        return;
    }

    let details;
    let content = '';

    if (itemKey in SPELLS) {
        const spellTree = SPELLS[itemKey];
        const playerSpell = player.spells[itemKey];
        const tier = playerSpell ? playerSpell.tier : 1;
        details = spellTree.tiers[tier - 1];

        content = `<h4 class="font-bold mb-1" style="color: var(--text-accent);">${details.name} (Tier ${tier})</h4>`;
        content += `<p class="text-xs text-gray-400 mb-2">${capitalize(spellTree.element)} / ${spellTree.type.toUpperCase()}</p>`;
        if (details.damage) content += `<p>Power: ${details.damage[0]}d${details.damage[1]} (Cap: ${details.cap} dice)</p>`;
        if (details.cost) content += `<p class="text-blue-400">MP Cost: ${details.cost}</p>`;
        if (details.splash) content += `<p>Splash Damage: ${details.splash * 100}%</p>`;
        if (details.description) content += `<p class="text-gray-400 mt-2 text-sm"><em>${details.description}</em></p>`;

    } else {
        details = getItemDetails(itemKey);
        if (!details) return;

        content = `<h4 class="font-bold mb-1" style="color: var(--text-accent);">${details.name}</h4>`;
        if (details.rarity) content += `<p class="text-xs mb-2 text-gray-400">${details.rarity}</p>`;
        if (details.damage) content += `<p>Damage: ${details.damage[0]}d${details.damage[1]}</p>`;
        if (details.defense) content += `<p>Defense: ${details.defense}</p>`;
        if (details.blockChance > 0) content += `<p>Block Chance: ${Math.round(details.blockChance * 100)}%</p>`;
        if (details.amount && details.type === 'healing') content += `<p class="text-green-400">Heals: ${details.amount} HP</p>`;
        if (details.type === 'mana_restore') content += `<p class="text-blue-400">Restores: ${details.amount} MP</p>`;
        if (details.uses) content += `<p class="text-purple-300">Uses: ${details.uses}</p>`;
        
        if (details.effect) {
            content += '<div class="mt-2 pt-2 border-t border-gray-600 text-cyan-300 text-xs"><ul class="list-disc list-inside space-y-1">';
            const effect = details.effect;

            // Weapon Effects
            if (effect.type === 'crit') content += `<li>Crit: ${effect.chance * 100}% chance, x${effect.multiplier} Dmg</li>`;
            if (effect.type === 'lifesteal') content += `<li>Lifesteal: ${effect.amount * 100}%</li>`;
            if (effect.type === 'paralyze') content += `<li>On Hit: ${effect.chance * 100}% chance to Paralyze</li>`;
            if (effect.type === 'fire_damage') content += `<li>On Hit: +${effect.damage.join('-')} Fire Dmg</li>`;
            if (effect.type === 'lightning_damage') content += `<li>On Hit: +${effect.damage.join('-')} Lightning Dmg</li>`;
            if (effect.ignore_defense) content += `<li>Ignores ${effect.ignore_defense * 100}% of enemy defense</li>`;
            if (effect.bonus_vs_dragon) content += `<li>Deals x${effect.bonus_vs_dragon} damage to Dragons</li>`;
            if (effect.double_strike) content += `<li>Attacks twice</li>`;
            if (effect.revive) content += `<li>Revives you upon death (once per battle)</li>`;
            if (effect.spell_follow_up) content += `<li>Launches a phantom strike after casting a spell</li>`;
            if (effect.petrify_chance) content += `<li>On Hit: ${effect.petrify_chance * 100}% chance to Petrify</li>`;

            // Catalyst Effects
            if (effect.spell_amp) content += `<li>Spell Power: +${effect.spell_amp} Dice</li>`;
            if (effect.mana_discount) content += `<li>Spell Cost: -${effect.mana_discount} MP</li>`;
            if (effect.mana_regen) content += `<li>Regen: +${effect.mana_regen} MP/turn</li>`;
            if (effect.hp_regen) content += `<li>Regen: +${effect.hp_regen} HP/turn</li>`;
            if (effect.spell_crit_chance) content += `<li>Spell Crit: ${effect.spell_crit_chance * 100}% chance, x${effect.spell_crit_multiplier || 1.5} Dmg</li>`;
            if (effect.spell_lifesteal) content += `<li>Spell Lifesteal: ${effect.spell_lifesteal * 100}%</li>`;
            if (effect.ranged_chance) content += `<li>${effect.ranged_chance * 100}% chance to evade ranged attacks</li>`;

            // Shield Effects
            if (effect.type === 'parry') content += `<li>Parry Chance: ${Math.round(effect.chance * 100)}%</li>`;
            if (effect.attack_follow_up) content += `<li>Retaliates for ${effect.attack_follow_up.damage.join('-')} damage</li>`;
            if (effect.type === 'debuff_resist') content += `<li>+${effect.chance * 100}% Debuff Resistance</li>`;
            if (effect.type === 'reflect') content += `<li>Reflects ${effect.amount * 100}% of damage taken</li>`;
            
            // Armor Effects
            if (effect.type === 'dodge') content += `<li>Dodge Chance: +${Math.round(effect.chance * 100)}%</li>`;
            if (effect.reflect_damage) content += `<li>Reflects ${effect.reflect_damage * 100}% of damage taken</li>`;

            // Item Effects
            if (details.type === 'buff') {
                if (effect.type.startsWith('temp_')) {
                    const statName = {
                        'maxHp': 'Max HP',
                        'maxMp': 'Max MP',
                        'physicalDefense': 'Physical Defense',
                        'magicalDefense': 'Magical Defense',
                        'physicalDamageBonus': 'Physical Damage',
                        'magicalDamageBonus': 'Magical Damage'
                    }[effect.stat] || capitalize(effect.stat);
                    const percentage = Math.round((effect.multiplier - 1) * 100);
                    content += `<li>Effect: +${percentage}% ${statName} for ${effect.duration} encounters</li>`;
                } else {
                    content += `<li>Effect: Grants ${effect.type} for ${effect.duration} turns</li>`;
                }
            }
            
            content += '</ul></div>';
        }
        
        content += `<p class="text-gray-400 mt-2 text-sm"><em>${details.description}</em></p>`;
    }

    tooltipElement.innerHTML = content;
    tooltipElement.style.display = 'block';
    activeTooltipItem = itemKey;

    let x = event.clientX + 15;
    let y = event.clientY + 15;
    if (x + tooltipElement.offsetWidth > window.innerWidth) x = event.clientX - tooltipElement.offsetWidth - 15;
    if (y + tooltipElement.offsetHeight > window.innerHeight) y = event.clientY - tooltipElement.offsetHeight - 15;
    tooltipElement.style.left = `${x}px`;
    tooltipElement.style.top = `${y}px`;
}

function hideTooltip() {
    $('#tooltip').style.display = 'none';
    activeTooltipItem = null;
}

