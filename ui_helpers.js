// ui_helpers.js
// This file contains utility functions for DOM manipulation, UI rendering,
// theme management, and other interface-related logic.

// =================================================================================
// SECTION 0: AUDIO ENGINE
// =================================================================================

const SOUNDS = {
    // IMPORTANT: Replace these paths with your own audio files
    'hover': new Audio('path/to/your/hover.mp3'),
    'click': new Audio('path/to/your/click.mp3')
};

// Set volumes (optional, 0.5 = 50% volume)
SOUNDS.hover.volume = 0.3;
SOUNDS.click.volume = 0.5;

/**
 * Plays a pre-loaded sound effect.
 * @param {string} soundName - The key of the sound to play (e.g., 'hover', 'click').
 */
function playSound(soundName) {
    const sound = SOUNDS[soundName];
    if (sound) {
        sound.currentTime = 0;
        sound.play().catch(error => {
            // This catch prevents console errors if the user clicks too fast
            console.warn(`Audio play failed for [${soundName}]:`, error.message);
        });
    }
}

// =================================================================================
// SECTION 1: CORE UTILITIES & DOM HELPERS
// =================================================================================

const $ = (selector) => document.querySelector(selector);
let logElement;
let mainView;
let characterSheetOriginalStats = null;

function getItemDetails(itemKey) {
    // --- REMOVED DEBUGGING LOGS ---

    // --- REWRITTEN LOGIC with IF statements ---
    if (typeof WEAPONS !== 'undefined' && WEAPONS && WEAPONS[itemKey]) {
        return WEAPONS[itemKey];
    }
    if (typeof ARMOR !== 'undefined' && ARMOR && ARMOR[itemKey]) {
        return ARMOR[itemKey];
    }
    if (typeof SHIELDS !== 'undefined' && SHIELDS && SHIELDS[itemKey]) {
        return SHIELDS[itemKey];
    }
    if (typeof CATALYSTS !== 'undefined' && CATALYSTS && CATALYSTS[itemKey]) {
        return CATALYSTS[itemKey];
    }
    if (typeof ITEMS !== 'undefined' && ITEMS && ITEMS[itemKey]) {
        return ITEMS[itemKey];
    }
    if (typeof LURES !== 'undefined' && LURES && LURES[itemKey]) {
        return LURES[itemKey];
    }
    // --- ADDED NEW CASINO CHECKS ---
    if (typeof BJ_ARCANA_RITUALS !== 'undefined' && BJ_ARCANA_RITUALS && BJ_ARCANA_RITUALS[itemKey]) {
        return BJ_ARCANA_RITUALS[itemKey];
    }
    if (typeof BJ_CONJURE_PACKS !== 'undefined' && BJ_CONJURE_PACKS && BJ_CONJURE_PACKS[itemKey]) {
        return BJ_CONJURE_PACKS[itemKey];
    }
    if (typeof BJ_ARCANA_PACKS !== 'undefined' && BJ_ARCANA_PACKS && BJ_ARCANA_PACKS[itemKey]) { // <-- THIS BLOCK IS NEW
        return BJ_ARCANA_PACKS[itemKey];
    }
    // --- END NEW CHECKS ---
    if (typeof SPELLS !== 'undefined' && SPELLS && SPELLS[itemKey]) {
        // Spells might need different handling if structure varies,
        // but for tooltip purposes, returning the base object might be okay.
        return SPELLS[itemKey];
    }
    if (typeof COOKING_RECIPES !== 'undefined' && COOKING_RECIPES && COOKING_RECIPES[itemKey]) {
        return COOKING_RECIPES[itemKey];
    }
    // Add checks for ALCHEMY_RECIPES if needed here

    // *** Fallback if not found anywhere ***
    console.warn(`  - Item key "${itemKey}" NOT FOUND in any data object.`); // Keep the warning for actual errors
    return null; // Return null if not found
}
/**
 * Initializes key DOM element references after the page loads.
 * This prevents errors from trying to access elements that don't exist yet.
 */
function initUIElements() {
    logElement = $('#game-log');
    mainView = $('#main-view');
}

/**
 * Capitalizes the first letter of a string.
 * @param {string} str The string to capitalize.
 * @returns {string} The capitalized string.
 */
function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Simulates rolling dice and returns the total. Logs the roll if debug mode is active.
 * @param {number} numDice The number of dice to roll.
 * @param {number} sides The number of sides on each die.
 * @param {string|object} purpose A description of the roll's purpose for debugging.
 * @returns {number} The sum of all dice rolls.
 */
function rollDice(numDice, sides, purpose = 'Generic Roll') {
    let rolls = [];
    for (let i = 0; i < numDice; i++) {
        rolls.push(Math.floor(Math.random() * sides) + 1);
    }
    const total = rolls.reduce((a, b) => a + b, 0);
    if (isDebugVisible) {
        const purposeText = typeof purpose === 'string' ? purpose : purpose.source;
        addToLog(`DEBUG (Dice): ${purposeText} - Rolled ${numDice}d${sides} -> [${rolls.join(', ')}] = ${total}`, 'text-gray-500');
    }
    // Return both total and the individual rolls
    return { total: total, rolls: rolls };
}

/**
 * Adds a message to the in-game log.
 * @param {string} message The HTML-formatted message to add.
 * @param {string} [colorClass=''] Optional Tailwind CSS color class.
 */
function addToLog(message, colorClass = '') {
    if (!logElement) {
        console.error("Log element not initialized, cannot add log:", message);
        return;
    }
    // Sanitize message slightly before adding
    // A more robust sanitizer would be better for production
    const cleanMessage = message.replace(/<script.*?>.*?<\/script>/gi, '');

    const p = document.createElement('p');
    p.innerHTML = cleanMessage; // Use cleaned message
    p.className = `mb-1 ${colorClass}`; // Apply specified class

    // *** SCROLL FIX: Append child ***
    logElement.appendChild(p);

    // *** SCROLL FIX: Defer scrollTop update ***
    requestAnimationFrame(() => {
        // Keep the log scrolled to the bottom.
        logElement.scrollTop = logElement.scrollHeight;
    });


    // Limit log length to, say, 100 entries
    const maxLogEntries = 100;
    while (logElement.children.length > maxLogEntries) {
        logElement.removeChild(logElement.firstChild); // Remove oldest from the top
    }
}

// =================================================================================
// SECTION 2: VIEW & UI STATE MANAGEMENT
// =================================================================================

/**
 * Clears the main view and renders a new element in its place.
 * Also handles tooltips and updates persistent UI elements.
 * @param {HTMLElement} viewElement The new element to render.
 */
function render(viewElement) {
    hideTooltip();
    hideEnemyInfo();

    const baseClasses = "bg-slate-900/50 rounded-lg flex-grow flex items-center justify-center p-6 min-h-[300px] md:min-h-0 overflow-y-auto inventory-scrollbar";
    mainView.className = baseClasses;

    mainView.innerHTML = '';
    mainView.appendChild(viewElement);

    // Update body class for CSS-based button visibility
    // Remove previous view classes first
    document.body.className = document.body.className.replace(/\s?view-\S+/g, '');
    // Add the new view class if in game
    if (document.body.classList.contains('in-game')) {
        document.body.classList.add(`view-${gameState.currentView}`);
    } else {
         // Ensure no view class exists if not in game
         document.body.className = document.body.className.replace(/\s?view-\S+/g, '');
    }


    updateDebugView();
    updatePersistentButtons(); // Call this to handle any potential JS logic needed, even if CSS controls visibility
}

/**
 * Function to handle visibility or other state changes for persistent buttons.
 * Visibility is now primarily controlled by CSS via body classes set in render().
 */
function updatePersistentButtons() {
    const persistentButtons = $('#persistent-buttons');
    if (!persistentButtons) return;

    // We don't need to add/remove 'hidden' class here anymore for visibility.
    // CSS handles showing/hiding based on body.view-* classes.
    // This function can remain empty or be used for other button state logic later.

    // Example: You could disable buttons based on game state here if needed
    // const settingsButton = persistentButtons.querySelector('button[onclick*="renderSettingsMenu"]');
    // if (settingsButton) {
    //     settingsButton.disabled = someCondition;
    // }
}


// =================================================================================
// SECTION 3: REUSABLE UI BUILDER FUNCTIONS
// =================================================================================

/**
 * Creates a standard button for UI menus.
 * @param {object} config - Configuration for the button.
 * @returns {string} The HTML string for the button.
 */
function createButton(config) {
    const { text, onclick, classes = 'btn-primary', disabled = false } = config;
    return `<button onclick="${onclick}" class="btn ${classes}" ${disabled ? 'disabled' : ''}>${text}</button>`;
}

/**
 * Creates a generic list of items for shops or crafting menus, sorted by price.
 * @param {object} config - Configuration for the list.
 * @returns {string} The HTML string for the list.
 */
function createItemList(config) {
    const { items, detailsFn, actionsHtmlFn } = config;
    if (!items || items.length === 0) return '';

    const itemsToSort = items.map(key => {
        const details = detailsFn(key);
        // *** REMOVED DEBUG LOGS ***
        return { key, price: details ? (details.price || 0) : 0, details }; // Keep details for name access
    });

    itemsToSort.sort((a, b) => a.price - b.price);

    return itemsToSort.map(itemObj => {
        const key = itemObj.key;
        const details = itemObj.details; // Use the details we already fetched

        // *** REMOVED DEBUG LOG ***

        // Handle case where details might be null or name missing AFTER fetching
        if (!details || !details.name) {
            console.warn(`  - WARNING: Rendering fallback for key "${key}" because details or name is missing.`);
            // Fallback display using the key if name is unexpectedly missing
             return `
                <div class="flex justify-between items-center p-2 bg-slate-800 rounded">
                    <span>${key} (Fallback - name missing)</span>
                    <div>${actionsHtmlFn(key, { name: key, price: 0 })}</div>
                </div>`;
        }

        // Normal rendering if name exists
        const actionsHtml = actionsHtmlFn(key, details);
        return `
            <div class="flex justify-between items-center p-2 bg-slate-800 rounded" onmouseover="showTooltip('${key}', event)" onmouseout="hideTooltip()" onclick="showTooltip('${key}', event)">
                <span>${details.name}</span>
                <div>${actionsHtml}</div>
            </div>`;
    }).join('');
}


/**
 * Creates a selection list with a details pane (used in character creation).
 * @param {object} config - Configuration object.
 */
function createSelectionListWithDetails(config) {
    const { data, listId, buttonTextFn, onHoverFn, onClickFn } = config;
    const listContainer = $(`#${listId}`);
    if (!listContainer) return;

    listContainer.innerHTML = '';
    Object.keys(data).forEach(key => {
        const itemData = data[key];
        const button = document.createElement('button');
        button.className = 'btn btn-primary w-full text-left';
        button.dataset.key = key;
        button.textContent = buttonTextFn(key, itemData);
        button.onmouseenter = () => onHoverFn(key, itemData);
        button.onclick = () => {
            document.querySelectorAll(`#${listId} button`).forEach(btn => {
                btn.classList.remove('bg-yellow-600', 'border-yellow-800');
                btn.classList.add('btn-primary');
            });
            button.classList.add('bg-yellow-600', 'border-yellow-800');
            button.classList.remove('btn-primary');
            onClickFn(key);
        };
        listContainer.appendChild(button);
    });
}

// =================================================================================
// SECTION 4: TOOLTIP & INFO DISPLAY
// =================================================================================

let activeTooltipItem = null;
let simpleTooltipTimer = null; // Timer for the simple tooltip

/**
 * Shows a simple text-only tooltip.
 * @param {string} text - The text to display.
 * @param {Event} event - The mouse event.
 */
function showSimpleTooltip(text, event) {
    if (simpleTooltipTimer) clearTimeout(simpleTooltipTimer); // Clear any pending hide
    
    const tooltipElement = $('#tooltip'); // Use the existing tooltip element
    if (!text || !event) {
        hideTooltip(); // Use the main hider
        return;
    }

    // Set simple content
    tooltipElement.innerHTML = `<p class="text-gray-300 text-sm">${text}</p>`;
    tooltipElement.style.display = 'block';
    activeTooltipItem = `simple-tooltip-${text.substring(0, 10)}`; // Give it a temporary active ID

    // *** MODIFICATION START: Handle both Mouse and Touch events for positioning ***
    let x, y;
    if (event.touches) {
        // Touch event
        x = event.touches[0].clientX + 15;
        y = event.touches[0].clientY + 15;
    } else {
        // Mouse event
        x = event.clientX + 15;
        y = event.clientY + 15;
    }
    // *** MODIFICATION END ***

    // Keep in viewport
    if (x + tooltipElement.offsetWidth > window.innerWidth) x = event.clientX - tooltipElement.offsetWidth - 15;
    if (y + tooltipElement.offsetHeight > window.innerHeight) y = event.clientY - tooltipElement.offsetHeight - 15;
    tooltipElement.style.left = `${x}px`;
    tooltipElement.style.top = `${y}px`;
}

/**
 * Hides the simple tooltip after a short delay.
 */
function hideSimpleTooltip() {
    // Use a short delay so the tooltip doesn't vanish if you barely mouse-out
    simpleTooltipTimer = setTimeout(() => {
        // Only hide if the active item is a simple tooltip
        if (activeTooltipItem && activeTooltipItem.startsWith('simple-tooltip-')) {
            $('#tooltip').style.display = 'none';
            activeTooltipItem = null;
        }
    }, 100); // 100ms delay
}

/**
 * Shows a detailed tooltip for an item, spell, or enemy.
 * MODIFIED: Added check for shield parry effect.
 * @param {string} itemKey The key of the item to display.
 * @param {Event} event The mouse event that triggered the tooltip.
 */
function showTooltip(itemKey, event) {
    const tooltipElement = $('#tooltip');
    if (event.type === 'click' && tooltipElement.style.display === 'block' && activeTooltipItem === itemKey) {
        hideTooltip();
        return;
    }

    let details;
    let content = '';

    // Guard against null/undefined itemKey early
    if (!itemKey) {
        hideTooltip();
        return;
    }


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

    } else if (itemKey in COOKING_RECIPES) {
        details = COOKING_RECIPES[itemKey];
        if (!details) return;

        content = `<h4 class="font-bold mb-1" style="color: var(--text-accent);">${details.name}</h4>`;
        content += `<p class="text-xs mb-2 text-gray-400">Tier ${details.tier} Cooked Meal</p>`;
        content += `<p class="text-gray-400 mt-2 text-sm"><em>${details.description}</em></p>`;

        const effect = details.effect;
        if (effect) {
            content += '<div class="mt-2 pt-2 border-t border-gray-600 text-cyan-300 text-xs"><ul class="list-disc list-inside space-y-1">';
            if (effect.heal) content += `<li>Heals for ${effect.heal} HP</li>`;
            switch (effect.type) {
                case 'buff':
                    effect.buffs.forEach(buff => {
                        const statName = buff.stat.replace(/_/g, ' ');
                         let valueDisplay = '';
                         if (buff.stat === 'movement_speed') {
                              valueDisplay = `+${buff.value}`;
                         } else if (buff.stat === 'hp_regen_percent' || buff.stat === 'mp_regen_percent') { // <-- ADDED THIS
                              valueDisplay = `${(buff.value * 100).toFixed(0)}% / encounter`; // <-- ADDED THIS
                         } else {
                              valueDisplay = `+${((buff.value - 1) * 100).toFixed(0)}%`;
                         }
                        content += `<li>Effect: ${valueDisplay} ${capitalize(statName)} for ${buff.duration} encounters</li>`;
                    });
                    break;
                case 'full_restore': content += `<li>Effect: Fully restores HP and MP</li>`; break;
            }
            content += '</ul></div>';
        }

    } else {
        details = getItemDetails(itemKey);
        if (!details) return;

        content = `<h4 class="font-bold mb-1" style="color: var(--text-accent);">${details.name}</h4>`;
        if (details.rarity) content += `<p class="text-xs mb-2 text-gray-400">${details.rarity}</p>`;
        if (details.damage) content += `<p>Damage: ${details.damage[0]}d${details.damage[1]}</p>`;
        if (details.range > 0) content += `<p>Range: ${details.range}</p>`;
        if (details.defense) content += `<p>Defense: ${details.defense}</p>`;
        if (details.blockChance > 0) content += `<p>Block Chance: ${Math.round(details.blockChance * 100)}%</p>`;
        if (details.amount && details.type === 'healing') content += `<p class="text-green-400">Heals: ${details.amount} HP</p>`;
        if (details.type === 'mana_restore') content += `<p class="text-blue-400">Restores: ${details.amount} MP</p>`;
        if (details.uses) content += `<p class="text-purple-300">Uses: ${details.uses}</p>`;

        if (details.effect) {
            content += '<div class="mt-2 pt-2 border-t border-gray-600 text-cyan-300 text-xs"><ul class="list-disc list-inside space-y-1">';
            const effect = details.effect;
            // This is a long list of all possible item effects. They are self-explanatory.
            if (effect.critChance) content += `<li>Crit: +${effect.critChance * 100}% chance, x${effect.critMultiplier || 1.5} Dmg</li>`;
            if (effect.lifesteal) content += `<li>Lifesteal: ${effect.lifesteal * 100}%</li>`;
            if (effect.paralyzeChance) content += `<li>On Hit: ${effect.paralyzeChance * 100}% chance to Paralyze</li>`;
            if (effect.toxicChance) content += `<li>On Hit: ${effect.toxicChance * 100}% chance to apply a deadly toxin.</li>`;
            if (effect.armorPierce) content += `<li>Armor Pierce: Ignores ${effect.armorPierce * 100}% of enemy defense</li>`;
            if (effect.bonusVsDragon) content += `<li>Deals x${effect.bonusVsDragon} damage to Dragons</li>`;
            if (effect.bonusVsLegendary) content += `<li>Deals x${effect.bonusVsLegendary} damage to Legendary enemies.</li>`;
            if (effect.doubleStrike) content += `<li>Double Strike: Attacks twice per action.</li>`;
            if (effect.doubleStrikeChance) content += `<li>Has a ${effect.doubleStrikeChance * 100}% chance to strike twice.</li>`;
            if (effect.revive) content += `<li>Revives you upon death (once per battle)</li>`;
            if (effect.spellFollowUp) content += `<li>Launches a phantom strike after casting a spell</li>`;
            if (effect.petrifyChance) content += `<li>On Hit: ${effect.petrifyChance * 100}% chance to Petrify</li>`;
            if (effect.type === 'godslayer') content += `<li>Godslayer: Deals bonus damage equal to ${effect.percent_hp_damage * 100}% of the target's max HP.</li>`;
            if (effect.intScaling) content += `<li>Arcane Edge: Damage scales with Intelligence.</li>`;
            if (effect.elementalBolt) content += `<li>On Hit: Chance to fire a bolt of the last used spell element.</li>`;
            if (effect.uncapCombo) content += `<li>Uncapped Combo: Successive hits deal increasing damage.</li>`;
            if (effect.healOnKill) content += `<li>On Kill: Heals for ${effect.healOnKill * 100}% of your Max HP.</li>`;
            if (effect.execute) content += `<li>Execute: Chance to instantly kill enemies below ${effect.execute * 100}% HP.</li>`;
            if (effect.cleanseChance) content += `<li>On Hit: ${effect.cleanseChance * 100}% chance to cleanse a debuff.</li>`;
            if (effect.lootBonus) content += `<li>On Kill: Increases chance of finding rare materials.</li>`;
            if (effect.spell_amp) content += `<li>Spell Power: +${effect.spell_amp} Dice</li>`;
            if (effect.mana_discount) content += `<li>Spell Cost: -${effect.mana_discount} MP</li>`;
            if (effect.mp_regen_percent) content += `<li>Regen: +${effect.mp_regen_percent * 100}% MP/turn</li>`;
            if (effect.spell_crit_chance) content += `<li>Spell Crit: ${effect.spell_crit_chance * 100}% chance, x${effect.spell_crit_multiplier || 1.5} Dmg</li>`;
            if (effect.spell_vamp) content += `<li>Spell Vamp: Killing with a spell restores ${effect.spell_vamp * 100}% of enemy's max HP and MP.</li>`;
            if (effect.spell_penetration) content += `<li>Spell Pen: Spells ignore ${effect.spell_penetration * 100}% of enemy magic resist.</li>`;
            // Removed sniper display
            if (effect.overdrive) content += `<li>Overdrive: ${effect.overdrive.chance * 100}% chance to deal x${effect.overdrive.multiplier} damage, but you take damage equal to ${effect.overdrive.self_damage * 100}% of your Max HP.</li>`;
            // Removed battlestaff display (handled by intScaling)
            if (effect.spell_weaver) content += `<li>Spellweaver: ${effect.spell_weaver * 100}% chance to apply a random elemental effect.</li>`;
            if (effect.ranged_chance) content += `<li>Ranged Advantage: ${effect.ranged_chance * 100}% chance for melee attackers to miss.</li>`; // Corrected description
            if (effect.hp_regen) content += `<li>Regen: +${effect.hp_regen} HP/turn</li>`;
            // --- MODIFIED: Check for shield parry effect ---
            if (effect.parry || (effect.type === 'parry' && effect.chance)) {
                const parryChance = effect.parry || effect.chance;
                content += `<li>Parry Chance: ${Math.round(parryChance * 100)}%</li>`;
            }
            // --- END MODIFICATION ---
            if (effect.attack_follow_up) content += `<li>Retaliates for ${effect.attack_follow_up.damage.join('-')} damage</li>`;
            if (effect.type === 'debuff_resist') content += `<li>+${effect.chance * 100}% Debuff Resistance</li>`;
            if (effect.type === 'reflect') content += `<li>Reflects ${effect.amount * 100}% of damage taken</li>`;
            if (effect.type === 'dodge') content += `<li>Dodge Chance: +${Math.round(effect.chance * 100)}%</li>`;
            if (effect.reflect_damage) content += `<li>Reflects ${effect.reflect_damage * 100}% of damage taken</li>`;
            if (effect.hp_regen_percent) content += `<li>Regen: +${effect.hp_regen_percent * 100}% HP/turn</li>`;
            if (effect.mp_regen_percent) content += `<li>Regen: +${effect.mp_regen_percent * 100}% MP/turn</li>`;
            if (details.type === 'buff') {
                if (effect.type.startsWith('temp_')) {
                    const statName = { 'maxHp': 'Max HP', 'maxMp': 'Max MP', 'physicalDefense': 'Physical Defense', 'magicalDefense': 'Magical Defense', 'physicalDamageBonus': 'Physical Damage', 'magicalDamageBonus': 'Magical Damage' }[effect.stat] || capitalize(effect.stat);
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


/** Hides the main tooltip. */
function hideTooltip() {
    // *** MODIFICATION: Clear simple tooltip timer as well ***
    if (simpleTooltipTimer) clearTimeout(simpleTooltipTimer);
    // *** END MODIFICATION ***
    $('#tooltip').style.display = 'none';
    activeTooltipItem = null;
}

/**
 * Shows a simplified tooltip for an enemy in battle.
 * @param {Enemy} enemy The enemy object.
 * @param {Event} event The mouse event.
 */
function showEnemyInfo(enemy, event) {
    const tooltipElement = $('#tooltip');
    if (event.type === 'click' && tooltipElement.style.display === 'block' && activeTooltipItem === `enemy-${enemy.name}`) {
        hideEnemyInfo();
        return;
    }

    if (!enemy) return;

    // --- Build Tooltip Content ---
    let content = `<h4 class="font-bold text-red-400 mb-1">${enemy.name}</h4>`;
    content += `<p class="text-xs text-gray-400 mb-2">Rarity: ${enemy.rarityData.name}</p>`; // Added Rarity
    content += `<p>HP: ${enemy.hp} / ${enemy.maxHp}</p>`;

    // --- Display Status Effects ---
    const statusEffects = enemy.statusEffects;
    let effectList = '';
    for (const key in statusEffects) {
        if (statusEffects.hasOwnProperty(key)) {
            const effect = statusEffects[key];
            let durationText = effect.duration ? ` (${effect.duration} turns)` : '';
            let effectName = capitalize(key.replace(/_/g, ' '));
            let colorClass = 'text-gray-400'; // Default for neutral/unknown

            // Basic color coding (can be expanded)
            if (key.startsWith('buff_') || ['enrage', 'living_shield'].includes(key)) {
                colorClass = 'text-green-400'; // Buffs
            } else if (['poison', 'toxic', 'drenched', 'paralyzed', 'petrified', 'swallowed', 'debuff_oiled', 'debuff_viscous', 'debuff_lightstone_primed'].includes(key)) {
                colorClass = 'text-red-400'; // Debuffs
            }

            effectList += `<li class="${colorClass}">${effectName}${durationText}</li>`;
        }
    }

    if (effectList) {
        content += '<div class="mt-2 pt-2 border-t border-gray-600 text-xs"><p class="font-semibold mb-1">Status:</p><ul class="list-disc list-inside space-y-1">' + effectList + '</ul></div>';
    }

    // --- Display Special Conditions ---
    let conditionsList = '';
    if (enemy.isMarked) {
        conditionsList += `<li class="text-yellow-400">Marked</li>`;
    }
    // Add other conditions here if needed (e.g., 'Sleeping', 'Confused')

    if (conditionsList) {
        content += '<div class="mt-2 pt-2 border-t border-gray-600 text-xs"><p class="font-semibold mb-1">Conditions:</p><ul class="list-disc list-inside space-y-1">' + conditionsList + '</ul></div>';
    }
    // --- End Status/Conditions ---


    tooltipElement.innerHTML = content;
    tooltipElement.style.display = 'block';
    activeTooltipItem = `enemy-${enemy.name}`;

    let x = event.clientX + 15;
    let y = event.clientY + 15;
    if (x + tooltipElement.offsetWidth > window.innerWidth) x = event.clientX - tooltipElement.offsetWidth - 15;
    if (y + tooltipElement.offsetHeight > window.innerHeight) y = event.clientY - tooltipElement.offsetHeight - 15;

    tooltipElement.style.left = `${x}px`;
    tooltipElement.style.top = `${y}px`;
}

/** Hides the enemy info tooltip. */
function hideEnemyInfo() {
    $('#tooltip').style.display = 'none';
    activeTooltipItem = null;
}

function showAllyInfo(ally, event, forceShow = false) {
    const tooltipElement = $('#tooltip');
    if (event.type === 'click' && tooltipElement.style.display === 'block' && activeTooltipItem === `ally-${ally.name}` && !forceShow) {
        hideTooltip(); // Use the generic hideTooltip
        return;
    }

    if (!ally) return;

    // --- Build Tooltip Content ---
    let content = `<h4 class="font-bold text-blue-400 mb-1">${ally.name} (Lvl ${ally.level})</h4>`;
    content += `<p class="text-xs text-gray-400 mb-2">${ally.class}</p>`;
    content += `<p>HP: ${ally.hp} / ${ally.maxHp}</p>`;
    content += `<p>MP: ${ally.mp} / ${ally.maxMp}</p>`;

    // --- Display Status Effects ---
    const statusEffects = ally.statusEffects;
    let effectList = '';
    if (statusEffects) { // Add safety check
        for (const key in statusEffects) {
            if (statusEffects.hasOwnProperty(key)) {
                const effect = statusEffects[key];
                let durationText = (effect.duration && effect.duration !== Infinity) ? ` (${effect.duration} turns)` : '';
                let effectName = capitalize(key.replace(/buff_|debuff_/g, '').replace(/_/g, ' '));
                let colorClass = 'text-gray-400'; // Default

                if (key.startsWith('buff_') || ['enrage', 'living_shield'].includes(key)) {
                    colorClass = 'text-green-400'; // Buffs
                } else if (['poison', 'toxic', 'drenched', 'paralyzed', 'petrified', 'swallowed'].includes(key)) {
                    colorClass = 'text-red-400'; // Debuffs
                }

                effectList += `<li class="${colorClass}">${effectName}${durationText}</li>`;
            }
        }
    }

    if (effectList) {
        content += '<div class="mt-2 pt-2 border-t border-gray-600 text-xs"><p class="font-semibold mb-1">Status:</p><ul class="list-disc list-inside space-y-1">' + effectList + '</ul></div>';
    }
    
    // --- Display Gear ---
    content += '<div class="mt-2 pt-2 border-t border-gray-600 text-xs"><p class="font-semibold mb-1">Equipment:</p><ul class="list-none space-y-1">';
    content += `<li><strong>Weapon:</strong> ${ally.equippedWeapon.name}</li>`;
    content += `<li><strong>Armor:</strong> ${ally.equippedArmor.name}</li>`;
    content += `<li><strong>Shield:</strong> ${ally.equippedShield.name}</li>`;
    content += `<li><strong>Catalyst:</strong> ${ally.equippedCatalyst.name}</li>`;
    content += '</ul></div>';


    tooltipElement.innerHTML = content;
    tooltipElement.style.display = 'block';
    activeTooltipItem = `ally-${ally.name}`;

    let x = event.clientX + 15;
    let y = event.clientY + 15;
    if (x + tooltipElement.offsetWidth > window.innerWidth) x = event.clientX - tooltipElement.offsetWidth - 15;
    if (y + tooltipElement.offsetHeight > window.innerHeight) y = event.clientY - tooltipElement.offsetHeight - 15;

    tooltipElement.style.left = `${x}px`;
    tooltipElement.style.top = `${y}px`;
}
// --- END NEW FUNCTION ---
// --- NEW MODAL FUNCTION ---
/**
 * Displays a simple modal popup.
 * @param {string} title - The title of the modal.
 * @param {string} message - The main text content of the modal.
 * @param {string} buttonText - The text for the confirmation button.
 * @param {function | string} onConfirm - Callback function OR function name string when the button is clicked.
 */
function showModal(title, message, buttonText = "OK", onConfirm = null) {
    // Remove existing modal if any
    const existingModal = document.getElementById('simple-modal');
    if (existingModal) {
        existingModal.remove();
    }

    // Create modal elements
    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'simple-modal';
    // Added padding, ensured higher z-index
    modalOverlay.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4';

    const modalContent = document.createElement('div');
    modalContent.className = 'bg-slate-800 p-6 rounded-lg shadow-xl max-w-md w-full text-center border border-slate-600'; // Added border, width constraints
    modalContent.setAttribute('role', 'dialog');
    modalContent.setAttribute('aria-modal', 'true');
    modalContent.setAttribute('aria-labelledby', 'modal-title');
    modalContent.setAttribute('aria-describedby', 'modal-message');

    const modalTitle = document.createElement('h2');
    modalTitle.id = 'modal-title';
    modalTitle.className = 'font-medieval text-2xl mb-4 text-yellow-300';
    modalTitle.textContent = title;

    const modalMessage = document.createElement('p');
    modalMessage.id = 'modal-message';
    modalMessage.className = 'text-gray-300 mb-6';
    modalMessage.textContent = message;

    const modalButton = document.createElement('button');
    modalButton.className = 'btn btn-primary px-6 py-2'; // Standard button styling
    modalButton.textContent = buttonText;
    modalButton.onclick = () => {
        modalOverlay.remove(); // Close modal on click
        if (typeof onConfirm === 'function') {
            onConfirm(); // Execute callback if provided
        } else if (typeof onConfirm === 'string') {
            // If it's a string, assume it's a function name in the global scope
            try {
                window[onConfirm]();
            } catch (e) {
                console.error(`Error calling modal confirm function "${onConfirm}":`, e);
            }
        }
    };

    // --- Add background click to close ---
    modalOverlay.addEventListener('click', (event) => {
        if (event.target === modalOverlay) { // Only close if clicking the overlay itself
            modalOverlay.remove();
        }
    });

    // --- Add Escape key to close ---
    const escapeKeyListener = (event) => {
        if (event.key === 'Escape') {
            modalOverlay.remove();
            document.removeEventListener('keydown', escapeKeyListener); // Clean up listener
        }
    };
    document.addEventListener('keydown', escapeKeyListener);

    // Assemble modal
    modalContent.appendChild(modalTitle);
    modalContent.appendChild(modalMessage);
    modalContent.appendChild(modalButton);
    modalOverlay.appendChild(modalContent);

    // Add to body
    document.body.appendChild(modalOverlay);

    // Focus the button for accessibility
    modalButton.focus();
}
// --- END NEW MODAL FUNCTION ---


// =================================================================================
// SECTION 5: TUTORIAL SYSTEM
// =================================================================================
// Note: This is a simple event-driven tutorial system. It's not fancy, but it works.

let tutorialState = {
    isActive: false,
    sequence: [],
    currentIndex: -1,
    currentTriggerController: null,
    flags: new Set()
};

function startTutorialSequence(sequenceKey) {
    if (!isTutorialEnabled) return;

    if(sequenceKey === 'main_game_screen') {
        const skipBtn = $('#skip-tutorial-btn');
        skipBtn.classList.remove('hidden');
        skipBtn.onclick = endTutorial;
    }

    const sequence = TUTORIAL_SEQUENCES[sequenceKey];
    if (sequence) {
        tutorialState.isActive = true;
        tutorialState.sequence = [...sequence];
        tutorialState.currentIndex = -1;
        tutorialState.flags.clear();
        advanceTutorial();
    }
}

function advanceTutorial(param = '') {
    // --- Abort Previous Trigger ---
    if (tutorialState.currentTriggerController) {
        tutorialState.currentTriggerController.abort();
        tutorialState.currentTriggerController = null;
    }

    // --- Handle Choice Branching ---
    const previousStep = tutorialState.sequence[tutorialState.currentIndex]; // Get previous step
    if (param && previousStep?.type === 'choice') {
        const choiceBranchKey = previousStep.choices[param];
        const branchSequence = TUTORIAL_SEQUENCES[choiceBranchKey] || [];
        const continuationSequence = TUTORIAL_SEQUENCES['continue_main_tutorial'] || [];
        // Splice in the chosen branch, followed by the main continuation.
        tutorialState.sequence.splice(tutorialState.currentIndex + 1, 0, ...branchSequence, ...continuationSequence);
        // currentIndex will be incremented below, correctly moving into the new branch
    }

    // --- Advance Index & Check for End ---
    tutorialState.currentIndex++;
    if (tutorialState.currentIndex >= tutorialState.sequence.length) {
        endTutorial();
        return;
    }

    // --- Get Current Step ---
    let step = tutorialState.sequence[tutorialState.currentIndex];

    // --- Handle Trigger-Only Steps ---
    if (step.type === 'trigger_only') {
        // Execute preAction if it exists
        if (step.preAction && typeof window[step.preAction] === 'function') {
            try {
                window[step.preAction]();
            } catch (e) {
                console.error(`Error executing preAction "${step.preAction}" for trigger_only step:`, e);
            }
        }
        // Setup the trigger without showing UI
        setupTutorialTrigger(step.trigger);
        return; // Wait for trigger
    }

    // --- Handle Checkpoint Steps ---
    if (step.type === 'checkpoint') {
        const requiredFlags = step.requiredFlags || [];
        const hasAllFlags = requiredFlags.every(flag => tutorialState.flags.has(flag));

        if (hasAllFlags) {
            console.log("Checkpoint passed, advancing tutorial.");
            advanceTutorial(); // Skip checkpoint, move to next step
            return;
        } else {
            // Checkpoint not met, set up triggers and show message
            console.log("Checkpoint not met, setting up triggers.");
            let checkpointContent = "Time to check out the town. Visit the ";
            const remaining = [];
            let triggerSetup = false; // Flag to ensure only one trigger is active

            if (!tutorialState.flags.has('commercial_visited')) {
                if (!triggerSetup) {
                     setupTutorialTrigger({ type: 'click', targetId: 'button[onclick*="renderCommercialDistrict"]', nextSequence: 'commercial_district_tour' });
                     triggerSetup = true;
                }
                 remaining.push('Commercial District');
            }
            if (!tutorialState.flags.has('arcane_visited')) {
                 if (!triggerSetup) {
                    setupTutorialTrigger({ type: 'click', targetId: 'button[onclick*="renderArcaneQuarter"]', nextSequence: 'arcane_district_tour' });
                     triggerSetup = true;
                 }
                 remaining.push('Arcane Quarter');
            }
            if (!tutorialState.flags.has('residential_visited')) {
                 if (!triggerSetup) {
                     setupTutorialTrigger({ type: 'click', targetId: 'button[onclick*="renderResidentialDistrict"]', nextSequence: 'residential_district_tour' });
                     triggerSetup = true;
                 }
                 remaining.push('Residential Area');
            }
            checkpointContent += remaining.join(', ') + ".";
            showTutorialStep(step, checkpointContent); // Show the checkpoint message
            // Wait for trigger, do not automatically advance
            return;
        }
    }

    // --- Handle Standard Steps (Modal, Tooltip) ---
    // Process content (e.g., replace <Charname>)
    let content = step.content;
    
    // *** MODIFICATION START: Grab name from tempCreationState if player isn't loaded ***
    let charName = player ? player.name : param; // Use param as a fallback
    if (!charName && window.tempCreationState && window.tempCreationState.name) {
        // This handles the finalize modal, grabbing the name from the state
        // set by the 'finalize-creation-btn' click.
        charName = window.tempCreationState.name;
    }
    // *** MODIFICATION END ***

    if (charName && content && content.includes('<Charname>')) {
        content = content.replace(/<Charname>/g, charName);
    }


    // Execute preAction if defined
    if (step.preAction && typeof window[step.preAction] === 'function') {
        try {
            window[step.preAction]();
        } catch (e) {
            console.error(`Error executing preAction "${step.preAction}":`, e);
        }
    } else if (step.preAction) {
        console.warn(`Tutorial preAction "${step.preAction}" is defined but not a function.`);
    }


    // Show the step UI (modal or tooltip)
    showTutorialStep(step, content);
    // Setup trigger AFTER showing the step (unless it's modal/choice handled internally)
     if (step.type !== 'modal' && step.type !== 'choice') {
          setupTutorialTrigger(step.trigger);
     }
}


/**
 * Shows the tutorial step UI (modal or tooltip).
 * @param {object} step - The tutorial step object.
 * @param {string} content - The processed text content for the step.
 */
function showTutorialStep(step, content) {
    const box = $('#tutorial-box');
    const text = $('#tutorial-text');
    const nextBtn = $('#tutorial-next-btn');
    const choiceContainer = $('#tutorial-choice-buttons');
    const hideBtn = $('#tutorial-hide-btn'); // <-- ADDED

    // Ensure elements exist
    if (!box || !text || !nextBtn || !choiceContainer || !hideBtn) { // <-- ADDED hideBtn
        console.error("Tutorial UI elements not found. Cannot display step.");
        endTutorial(); // End tutorial if UI is broken
        return;
    }

    text.innerHTML = content || ''; // Set text content
    box.classList.remove('hidden'); // Make box visible
    choiceContainer.innerHTML = ''; // Clear previous choices
    nextBtn.style.display = 'none'; // Hide next button by default
    box.className = box.className.replace(/arrow-\w+/g, '').trim(); // Remove old arrow classes

    // --- Position and configure based on step type ---
    if (step.type === 'modal' || step.type === 'choice') {
        // Center modal-style steps
        box.style.position = 'fixed';
        box.style.top = '50%';
        box.style.left = '50%';
        box.style.transform = 'translate(-50%, -50%)';
        box.style.opacity = '1';
        box.style.zIndex = '110'; // Ensure it's above modal overlay if needed

        if (step.type === 'choice') {
            // Create choice buttons
            Object.keys(step.choices).forEach(choiceText => {
                const btn = document.createElement('button');
                btn.className = 'btn btn-primary text-sm py-1 px-3'; // Use smaller buttons for choices
                btn.textContent = choiceText;
                btn.onclick = () => advanceTutorial(choiceText);
                choiceContainer.appendChild(btn);
            });
        // *** TUTORIAL FIX: Check for custom action on modal button ***
        } else if (step.nextButtonAction) {
            nextBtn.style.display = 'block';
            // Evaluate the custom action string (use Function constructor for safety over eval)
            nextBtn.onclick = new Function(step.nextButtonAction);
        } else {
             // Show standard 'Next' button for modals if no custom action
             nextBtn.style.display = 'block';
             nextBtn.onclick = advanceTutorial;
        }

    } else {
        // Position tooltip-style steps relative to a target element
        const targetElement = document.querySelector(step.targetId);
        if (!targetElement) {
            console.warn(`Tutorial target element not found: ${step.targetId}. Skipping step.`);
            advanceTutorial(); // Skip if target doesn't exist
            return;
        }

        // Force reflow to get accurate dimensions after potential content change
        void box.offsetHeight;

        const targetRect = targetElement.getBoundingClientRect();
        const boxRect = box.getBoundingClientRect();
        const arrowOffset = 15; // Space for the arrow
        const viewportMargin = 10; // Min distance from edge
        let top, left;
        const position = step.position || 'right'; // Default position
        box.style.position = 'fixed'; // Use fixed for consistency
        box.style.zIndex = '105'; // Slightly above most elements

        // --- Calculate position based on 'position' property ---
        switch (position) {
            case 'left':
                left = targetRect.left - boxRect.width - arrowOffset;
                top = targetRect.top + (targetRect.height / 2) - (boxRect.height / 2);
                box.classList.add('arrow-right');
                break;
            case 'top':
                left = targetRect.left + (targetRect.width / 2) - (boxRect.width / 2);
                top = targetRect.top - boxRect.height - arrowOffset;
                box.classList.add('arrow-bottom');
                break;
             case 'bottom':
                left = targetRect.left + (targetRect.width / 2) - (boxRect.width / 2);
                top = targetRect.bottom + arrowOffset; // Use bottom + offset
                box.classList.add('arrow-top');
                break;
             case 'right':
            default: // Default to right
                left = targetRect.right + arrowOffset; // Use right + offset
                top = targetRect.top + (targetRect.height / 2) - (boxRect.height / 2);
                box.classList.add('arrow-left');
                break;
        }

        // --- Keep box within viewport bounds ---
        left = Math.max(viewportMargin, Math.min(left, window.innerWidth - boxRect.width - viewportMargin));
        top = Math.max(viewportMargin, Math.min(top, window.innerHeight - boxRect.height - viewportMargin));

        // Apply calculated position
        box.style.left = `${left}px`;
        box.style.top = `${top}px`;
        box.style.transform = ''; // Remove centering transform if applied previously
        box.style.opacity = '1'; // Ensure visible

        // Setup the trigger to advance from this step
        // setupTutorialTrigger(step.trigger); // Moved trigger setup back to advanceTutorial
    }
}


function setupTutorialTrigger(trigger) {
    const nextBtn = $('#tutorial-next-btn');
    // Hide 'Next' button ONLY if there IS a trigger defined
    if (trigger) {
        nextBtn.style.display = 'none';
    } else {
        // Show 'Next' button if there's NO specific trigger for this step
        nextBtn.style.display = 'block';
        nextBtn.onclick = advanceTutorial;
    }


    if (tutorialState.currentTriggerController) {
        tutorialState.currentTriggerController.abort();
    }
    tutorialState.currentTriggerController = new AbortController();
    const { signal } = tutorialState.currentTriggerController;

    if (!trigger) return; // Exit if no trigger defined

    // --- Handle Different Trigger Types ---
    switch (trigger.type) {
        case 'next_button': // Explicitly handled above, do nothing here
            break;
        case 'input':
            const inputEl = document.querySelector(trigger.targetId); // Use querySelector for robustness
            if (inputEl) {
                const triggerAdvance = () => {
                    console.log("Input trigger activated.");
                    advanceTutorial();
                };
                inputEl.addEventListener('input', triggerAdvance, { once: true, signal });
                console.log("Input trigger listener added for:", trigger.targetId);
            } else {
                 console.warn("Input trigger target not found:", trigger.targetId);
            }
            break;
        case 'click':
            const clickEls = document.querySelectorAll(trigger.targetId);
            if (clickEls.length > 0) {
                 console.log(`Adding click trigger listener(s) for: ${trigger.targetId} (Found ${clickEls.length})`);
                clickEls.forEach(el => {
                    const handler = (event) => {
                        console.log("Click trigger activated for:", trigger.targetId);
                        // event.stopPropagation(); // Prevent potential double triggers if needed
                        // event.preventDefault(); // Only if necessary

                        if (trigger.setFlag) {
                            tutorialState.flags.add(trigger.setFlag);
                             console.log("Tutorial flag set:", trigger.setFlag);
                        }
                        if (trigger.nextSequence) {
                             console.log("Splicing in next sequence:", trigger.nextSequence);
                            const nextSeq = TUTORIAL_SEQUENCES[trigger.nextSequence] || [];
                            tutorialState.sequence.splice(tutorialState.currentIndex + 1, 0, ...nextSeq);
                        }
                        advanceTutorial();
                    };
                    // Use capture phase maybe? Or just standard bubble. Standard seems okay here.
                    el.addEventListener('click', handler, { once: true, signal });
                });
            } else {
                console.warn("Click trigger target not found:", trigger.targetId);
            }
            break;
         case 'enemy_death':
             console.log("Enemy death trigger registered. Waiting for battle logic...");
            // This custom trigger is handled in the battle logic (checkBattleStatus).
            // No listener needed here, just indicates the tutorial should wait.
            break;
        default:
             console.warn("Unknown tutorial trigger type:", trigger.type);
    }
}


// *** TUTORIAL FIX: Add function to handle completion ***
/**
 * Called by the tutorial's final battle modal button.
 * Ends the tutorial and navigates to the town square.
 */
function completeBattleTutorial() {
    console.log("Completing battle tutorial...");
    endTutorial(); // Properly clear tutorial state
    renderTownSquare(); // Navigate to town
}

/**
 * Bridge function called by the creation_finalize tutorial modal.
 * Grabs the temporary creation state and calls the async initGame.
 */
function tutorial_callInitGame() {
    if (window.tempCreationState) {
        const state = window.tempCreationState;
        
        // 1. End the current tutorial sequence immediately.
        endTutorial(); 

        // 2. Yield control to browser to ensure DOM update finishes (modal closes), then call initGame asynchronously.
        setTimeout(async () => {
            // initGame saves the character and sets window.location.hash = 'game'.
            await initGame(state.name, state.gender, state.race, state.class, state.background, state.difficulty, state.elementalAffinity);
            window.tempCreationState = null; // Clear the temp state
        }, 0);
        
        // No hash change needed here, initGame handles it after the save is complete.
    } else {
        console.error("Failed to finalize creation: tempCreationState not found.");
        // If state is missing, force navigation anyway.
        window.location.hash = 'menu';
    }
}

function endTutorial() {
    const box = $('#tutorial-box');
    const skipBtn = $('#skip-tutorial-btn');
    if (box) box.classList.add('hidden');
    if (skipBtn) skipBtn.classList.add('hidden');

    tutorialState.isActive = false;
    tutorialState.sequence = [];
    tutorialState.currentIndex = -1;
    if (tutorialState.currentTriggerController) {
        tutorialState.currentTriggerController.abort();
        tutorialState.currentTriggerController = null;
    }
    // Re-enable wilderness button if it exists
    const wildernessBtn = document.querySelector('button[onclick*="renderWildernessMenu"]');
    if(wildernessBtn) wildernessBtn.disabled = false;

     console.log("Tutorial ended.");

    // No automatic navigation here, let the calling context decide (e.g., completeBattleTutorial)
}

// =================================================================================
// SECTION 6: COMBAT LOGIC HELPERS
// =================================================================================

/**
 * Logs a detailed breakdown of a damage calculation to the game log for debugging.
 * @param {object} calc - The calculation details object.
 */
function logDamageCalculation({ source, targetName, baseDamage, steps, finalDamage }) {
    if (!isDebugVisible) return;

    let logMessage = `<div class="text-xs p-2 bg-slate-900/50 rounded border border-slate-700">`;
    logMessage += `<strong class="text-yellow-300">DEBUG: [${source}] -> ${targetName}</strong><br>`;
    logMessage += `<strong>Base Damage (Dice Roll):</strong> ${baseDamage}<br>`;

    steps.forEach(step => {
        logMessage += `<strong>${step.description}:</strong> ${step.value} => <span class="text-cyan-400">${step.result}</span><br>`;
    });

    logMessage += `<strong>Final Damage Applied (after defense):</strong> <strong class="text-red-400">${finalDamage}</strong>`;
    logMessage += `</div>`;

    addToLog(logMessage, 'text-gray-400');
}

/**
 * Calculates the damage modifier based on elemental interactions.
 * @param {string} attackerElement The element of the attacker.
 * @param {string} defenderElement The element of the defender.
 * @returns {number} 2 for super effective, 0.5 for not effective, 1 for neutral.
 */
function calculateElementalModifier(attackerElement, defenderElement) {
    if (!attackerElement || attackerElement === 'none' || !defenderElement || defenderElement === 'none') {
        return 1;
    }
    const attackerData = ELEMENTS[attackerElement];
    const defenderData = ELEMENTS[defenderElement];
    if (!attackerData || !defenderData) return 1;

    if (attackerData.strength.includes(defenderElement)) return 2;
    if (attackerData.weakness.includes(defenderElement)) return 0.5;
    return 1;
}

// =================================================================================
// SECTION 7: DEBUG PANEL FUNCTIONS
// =================================================================================

let logChanceCalculations = false;

// --- ADDED: Function to toggle chance calculation logging ---
function toggleLogChanceCalculations() {
    logChanceCalculations = !logChanceCalculations;
    addToLog(`DEBUG: Detailed chance calculation logging ${logChanceCalculations ? 'ENABLED' : 'DISABLED'}.`, 'text-gray-500');
    // Update button text/style if needed (optional)
    const toggleBtn = document.getElementById('debug-log-chance-toggle');
    if (toggleBtn) {
        toggleBtn.textContent = `Log Chance Calcs: ${logChanceCalculations ? 'ON' : 'OFF'}`;
        toggleBtn.classList.toggle('bg-green-600', logChanceCalculations);
        toggleBtn.classList.toggle('btn-primary', !logChanceCalculations);
    }
}


function toggleDebug() {
    isDebugVisible = !isDebugVisible;
    const panel = $('#debug-panel');
    panel.classList.toggle('hidden', !isDebugVisible);
    if (isDebugVisible) {
        updateDebugView();
        updateDebugAddItemOptions();
        populateDebugStatInputs();
        // --- ADDED: Update toggle button state when opening debug panel ---
        const toggleBtn = document.getElementById('debug-log-chance-toggle');
        if (toggleBtn) {
            toggleBtn.textContent = `Log Chance Calcs: ${logChanceCalculations ? 'ON' : 'OFF'}`;
            toggleBtn.classList.toggle('bg-green-600', logChanceCalculations);
            toggleBtn.classList.toggle('btn-primary', !logChanceCalculations);
        }
        // --- END ADDED ---
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
        // Prevent circular reference issues if enemy abilities target player etc.
        if (key === 'source' && value instanceof Entity) return `Entity(${value.name})`;
        if (key === 'target' && value instanceof Entity) return `Entity(${value.name})`;
        if (key === 'owner' && value instanceof Entity) return `Entity(${value.name})`;
        // Simplify large objects if needed for readability
        // if (key === 'inventory' && value) return "{...inventory data...}";
        return value;
    }, 2); // Use 2 spaces for indentation
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
        // Sort items alphabetically within each category
        const sortedKeys = Object.keys(sourceObject).sort((a, b) => {
             const nameA = sourceObject[a].name || a;
             const nameB = sourceObject[b].name || b;
             return nameA.localeCompare(nameB);
        });

        for (const key of sortedKeys) {
            const item = sourceObject[key];
            if (!item.name) continue; // Skip items without names (like no_shield placeholders if unnamed)
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
        updateDebugView(); // Update debug panel to show new item
    }
}

function populateDebugStatInputs() {
    if (!isDebugVisible || !player) return;
    $('#debug-level').value = player.level;
    $('#debug-gold').value = player.gold;
    $('#debug-xp').value = player.xp;
    $('#debug-statPoints').value = player.statPoints;
    $('#debug-hp').value = player.hp;
    $('#debug-mp').value = player.mp;
    $('#debug-xpMultiplier').value = player.xpMultiplier;
    $('#debug-vigor').value = player.vigor;
    $('#debug-focus').value = player.focus;
    $('#debug-stamina').value = player.stamina;
    $('#debug-strength').value = player.strength;
    $('#debug-intelligence').value = player.intelligence;
    $('#debug-luck').value = player.luck;
    $('#debug-bonusHp').value = player.bonusHp;
    $('#debug-bonusMp').value = player.bonusMp;
    $('#debug-bonusPhysicalDamage').value = player.bonusPhysicalDamage;
    $('#debug-bonusMagicalDamage').value = player.bonusMagicalDamage;
    $('#debug-bonusPhysicalDefense').value = player.bonusPhysicalDefense;
    $('#debug-bonusMagicalDefense').value = player.bonusMagicalDefense;
    $('#debug-bonusCritChance').value = player.bonusCritChance;
    $('#debug-bonusEvasion').value = player.bonusEvasion;
}

function debugUpdateVariables() {
    if (!player) return;
    const int = (id) => parseInt($(`#${id}`).value) || 0;
    const float = (id) => parseFloat($(`#${id}`).value) || 0;

    // Apply updates
    player.level = int('debug-level') || player.level;
    player.gold = int('debug-gold') || player.gold;
    player.xp = int('debug-xp') || player.xp;
    player.statPoints = int('debug-statPoints') || player.statPoints;
    player.xpMultiplier = float('debug-xpMultiplier') || 1;
    player.hp = int('debug-hp') || player.hp;
    player.mp = int('debug-mp') || player.mp;

    // Track changes to base stats
    const oldVigor = player.vigor;
    const oldFocus = player.focus;
    const oldStamina = player.stamina;
    const oldStrength = player.strength;
    const oldIntelligence = player.intelligence;
    const oldLuck = player.luck;

    player.vigor = int('debug-vigor') || player.vigor;
    player.focus = int('debug-focus') || player.focus;
    player.stamina = int('debug-stamina') || player.stamina;
    player.strength = int('debug-strength') || player.strength;
    player.intelligence = int('debug-intelligence') || player.intelligence;
    player.luck = int('debug-luck') || player.luck;

    // Update bonus stats (assuming these are points spent, not direct bonuses)
    // IMPORTANT: If you change base stats, you might need to recalculate spent points or derived bonuses.
    // For simplicity here, we assume direct modification.
    player.bonusHp = int('debug-bonusHp');
    player.bonusMp = int('debug-bonusMp');
    player.bonusPhysicalDamage = int('debug-bonusPhysicalDamage');
    player.bonusMagicalDamage = int('debug-bonusMagicalDamage');
    player.bonusPhysicalDefense = int('debug-bonusPhysicalDefense');
    player.bonusMagicalDefense = int('debug-bonusMagicalDefense');
    player.bonusCritChance = float('debug-bonusCritChance');
    player.bonusEvasion = float('debug-bonusEvasion');

    // --- Recalculate derived stats based on changes ---
    // If base stats changed, recalculate the *derived* bonuses (like HP/MP from Vigor/Focus)
    // Note: recalculateGrowthBonuses typically adds based on *bonus* stats, not base.
    // We might need a full recalculation here or manual adjustment.
    // For now, let's just update max HP/MP based on new base stats.
    player.hp = Math.min(player.hp, player.maxHp); // Clamp HP to new maxHP
    player.mp = Math.min(player.mp, player.maxMp); // Clamp MP to new maxMP
    player.xpToNextLevel = player.calculateXpToNextLevel(); // Update XP needed

    // If level was changed, might need to adjust totalXP or available stat points
    player.recalculateLevelFromTotalXp(); // Recalculate level/XP/points consistency

    addToLog('DEBUG: Player stats manually updated.', 'text-gray-500');
    updateStatsView(); // Refresh sidebar UI
    populateDebugStatInputs(); // Update debug panel inputs to reflect changes
    updateDebugView(); // Update raw debug data view
}


// =================================================================================
// SECTION 8: THEMING & PALETTES
// =================================================================================
/*const PALETTES = {
    'default': { '--bg-main': '#1f2937', '--bg-secondary': '#111827', '--bg-log': 'rgba(0,0,0,0.3)', '--bg-tooltip': '#111827', '--border-main': '#374151', '--text-main': '#d1d5db', '--text-accent': '#fcd34d', '--btn-primary-bg': '#475569', '--btn-primary-bg-hover': '#64748b', '--btn-primary-border': '#1e293b', '--btn-primary-border-hover': '#334155' },
    'town': { '--bg-main': '#44403c', '--bg-secondary': '#292524', '--bg-log': 'rgba(20,10,0,0.3)', '--bg-tooltip': '#292524', '--border-main': '#57534e', '--text-main': '#e7e5e4', '--text-accent': '#f59e0b', '--btn-primary-bg': '#a16207', '--btn-primary-bg-hover': '#b45309', '--btn-primary-border': '#713f12', '--btn-primary-border-hover': '#854d0e' },
    'forest': { '--bg-main': '#14532d', '--bg-secondary': '#064e3b', '--bg-log': 'rgba(0,10,5,0.3)', '--bg-tooltip': '#064e3b', '--border-main': '#065f46', '--text-main': '#d1fae5', '--text-accent': '#a3e635', '--btn-primary-bg': '#059669', '--btn-primary-bg-hover': '#047857', '--btn-primary-border': '#065f46', '--btn-primary-border-hover': '#064e3b' },
    'cave': { '--bg-main': '#262626', '--bg-secondary': '#171717', '--bg-log': 'rgba(0,0,0,0.5)', '--bg-tooltip': '#171717', '--border-main': '#404040', '--text-main': '#a3a3a3', '--text-accent': '#eab308', '--btn-primary-bg': '#525252', '--btn-primary-bg-hover': '#737373', '--btn-primary-border': '#262626', '--btn-primary-border-hover': '#404040' },
    'mountain': { '--bg-main': '#075985', '--bg-secondary': '#0c4a6e', '--bg-log': 'rgba(0,5,20,0.3)', '--bg-tooltip': '#0c4a6e', '--border-main': '#0369a1', '--text-main': '#e0f2fe', '--text-accent': '#f0f9ff', '--btn-primary-bg': '#0ea5e9', '--btn-primary-bg-hover': '#38bdf8', '--btn-primary-border': '#0369a1', '--btn-primary-border-hover': '#075985' },
    'swamp': { '--bg-main': '#1a361e', '--bg-secondary': '#0f2012', '--bg-log': 'rgba(10,20,15,0.4)', '--bg-tooltip': '#0f2012', '--border-main': '#2a5231', '--text-main': '#c6f6d5', '--text-accent': '#68d391', '--btn-primary-bg': '#785a28', '--btn-primary-bg-hover': '#97763a', '--btn-primary-border': '#5c451e', '--btn-primary-border-hover': '#785a28' },
    'volcano': { '--bg-main': '#2d3748', '--bg-secondary': '#1a202c', '--bg-log': 'rgba(0,0,0,0.5)', '--bg-tooltip': '#1a202c', '--border-main': '#4a5568', '--text-main': '#e2e8f0', '--text-accent': '#f56565', '--btn-primary-bg': '#c53030', '--btn-primary-bg-hover': '#e53e3e', '--btn-primary-border': '#9b2c2c', '--btn-primary-border-hover': '#c53030' },
    'tundra': { '--bg-main': '#ebf8ff', '--bg-secondary': '#bee3f8', '--bg-log': 'rgba(200, 220, 255, 0.4)', '--bg-tooltip': '#bee3f8', '--border-main': '#90cdf4', '--text-main': '#2c5282', '--text-accent': '#3182ce', '--btn-primary-bg': '#4299e1', '--btn-primary-bg-hover': '#63b3ed', '--btn-primary-border': '#2b6cb0', '--btn-primary-border-hover': '#3182ce' },
    'void': { '--bg-main': '#1a192c', '--bg-secondary': '#000000', '--bg-log': 'rgba(10, 5, 20, 0.5)', '--bg-tooltip': '#000000', '--border-main': '#44337a', '--text-main': '#e9d8fd', '--text-accent': '#d63384', '--btn-primary-bg': '#44337a', '--btn-primary-bg-hover': '#5a439a', '--btn-primary-border': '#2c215d', '--btn-primary-border-hover': '#44337a' },
    'necropolis': { '--bg-main': '#2d3748', '--bg-secondary': '#1a202c', '--bg-log': 'rgba(0,0,0,0.5)', '--bg-tooltip': '#1a202c', '--border-main': '#4a5568', '--text-main': '#a0aec0', '--text-accent': '#9ae6b4', '--btn-primary-bg': '#4a5568', '--btn-primary-bg-hover': '#718096', '--btn-primary-border': '#2d3748', '--btn-primary-border-hover': '#4a5568' },
    'magic': { '--bg-main': '#2c1b47', '--bg-secondary': '#1a102d', '--bg-log': 'rgba(10, 5, 20, 0.5)', '--bg-tooltip': '#1a102d', '--border-main': '#4a3a6b', '--text-main': '#e6defe', '--text-accent': '#f0abfc', '--btn-primary-bg': '#4a3a6b', '--btn-primary-bg-hover': '#6a5a8b', '--btn-primary-border': '#2c215d', '--btn-primary-border-hover': '#4a3a6b' },
    'noon': { '--bg-main': '#2aa198', '--bg-secondary': '#248d84', '--bg-log': 'rgba(36, 141, 132, 0.6)', '--bg-tooltip': '#248d84', '--border-main': '#47b5ab', '--text-main': '#fdf6e3', '--text-accent': '#facc15', '--btn-primary-bg': '#073642', '--btn-primary-bg-hover': '#586e75', '--btn-primary-border': '#93a1a1', '--btn-primary-border-hover': '#eee8d5', '--btn-primary-text': '#fdf6e3' },
    'sunset': { '--bg-main': '#d35400', '--bg-secondary': '#aa4400', '--bg-log': 'rgba(255, 240, 230, 0.3)', '--bg-tooltip': '#aa4400', '--border-main': '#f39c12', '--text-main': '#fdf6e3', '--text-accent': '#e74c3c', '--btn-primary-bg': '#8e44ad', '--btn-primary-bg-hover': '#9b59b6', '--btn-primary-border': '#6c3483', '--btn-primary-border-hover': '#8e44ad' },
    'midnight': { '--bg-main': '#0c0c1d', '--bg-secondary': '#05050f', '--bg-log': 'rgba(20, 20, 40, 0.5)', '--bg-tooltip': '#05050f', '--border-main': '#2d2d5a', '--text-main': '#bdc3c7', '--text-accent': '#1abc9c', '--btn-primary-bg': '#2d2d5a', '--btn-primary-bg-hover': '#4a4a8c', '--btn-primary-border': '#1c1c3a', '--btn-primary-border-hover': '#2d2d5a' },
'casino': { 
        '--bg-main': '#4a1d68', // Deep Purple
        '--bg-secondary': '#2b103d',
        '--bg-log': 'rgba(20, 10, 30, 0.5)',
        '--bg-tooltip': '#2b103d',
        '--border-main': '#7a3ea5',
        '--text-main': '#e9d5ff',
        '--btn-primary-bg': '#dc2626', // Gaudy Red
        '--btn-primary-bg-hover': '#ef4444',
        '--btn-primary-border': '#991b1b',
        '--btn-primary-border-hover': '#b91c1c'
    }
};*/
// Define the one, true wintry palette
// This is our "Wintry" color. It's the 'cold air' that will be in every theme.
const WINTRY_BASE_COLOR = '#0f172a'; // slate-900

// This is the default Wintry theme for the town square, menus, etc.
const WINTRY_PALETTE = {
    '--bg-main': `linear-gradient(to bottom right, ${WINTRY_BASE_COLOR}, #020617)`, // Wintry Slate -> Wintry Dark
    '--bg-secondary': '#020617', // slate-950
    '--bg-log': 'rgba(2, 6, 23, 0.5)',
    '--bg-tooltip': '#020617',
    '--border-main': '#334155', // slate-700
    '--text-main': '#dbeafe', // light blue
    '--text-accent': '#60a5fa', // bright blue
    '--btn-primary-bg': '#1e3a8a',
    '--btn-primary-bg-hover': '#1e40af',
    '--btn-primary-border': '#1e40af',
    '--btn-primary-border-hover': '#1d4ed8'
};

// These are the HYBRID palettes
const PALETTES = {
    // DEFAULT (Wintry)
    'default': WINTRY_PALETTE,
    
    // TOWN (Homely & Wintry)
    'town': {
        '--bg-main': `linear-gradient(to bottom right, ${WINTRY_BASE_COLOR} 30%, #44403c 100%)`, // Wintry Slate -> Homely Stone Grey
        '--bg-secondary': '#292524', // Original "stone" secondary
        '--bg-log': 'rgba(20,10,0,0.3)',
        '--bg-tooltip': '#292524',
        '--border-main': '#57534e',
        '--text-main': '#e7e5e4',
        '--text-accent': '#f59e0b', // Homely amber text
        '--btn-primary-bg': '#a16207', // Homely brown/gold buttons
        '--btn-primary-bg-hover': '#b45309',
        '--btn-primary-border': '#713f12',
        '--btn-primary-border-hover': '#854d0e'
    },
    
    // FOREST (Lush & Wintry)
    'forest': {
        '--bg-main': `linear-gradient(to bottom right, ${WINTRY_BASE_COLOR} 30%, #14532d 100%)`, // Wintry Slate -> Deep Forest Green
        '--bg-secondary': '#064e3b', // Original dark green secondary
        '--bg-log': 'rgba(0,10,5,0.3)',
        '--bg-tooltip': '#064e3b',
        '--border-main': '#065f46',
        '--text-main': '#d1fae5',
        '--text-accent': '#a3e635', // Vibrant green text
        '--btn-primary-bg': '#059669', // Deep green buttons
        '--btn-primary-bg-hover': '#047857',
        '--btn-primary-border': '#065f46',
        '--btn-primary-border-hover': '#064e3b'
    },
    
    // CAVE (Dank & Wintry)
    'cave': {
        '--bg-main': `linear-gradient(to bottom right, ${WINTRY_BASE_COLOR} 30%, #262626 100%)`, // Wintry Slate -> Dank Grey
        '--bg-secondary': '#171717',
        '--bg-log': 'rgba(0,0,0,0.5)',
        '--bg-tooltip': '#171717',
        '--border-main': '#404040',
        '--text-main': '#a3a3a3',
        '--text-accent': '#eab308', // Gold/torchlight text
        '--btn-primary-bg': '#525252', // Stone grey buttons
        '--btn-primary-bg-hover': '#737373',
        '--btn-primary-border': '#262626',
        '--btn-primary-border-hover': '#404040'
    },
    
    // MOUNTAIN (Pure Icy)
    'mountain': {
        '--bg-main': `linear-gradient(to bottom right, ${WINTRY_BASE_COLOR} 30%, #075985 100%)`, // Wintry Slate -> Sky Blue
        '--bg-secondary': '#0c4a6e',
        '--bg-log': 'rgba(0,5,20,0.3)',
        '--bg-tooltip': '#0c4a6e',
        '--border-main': '#0369a1',
        '--text-main': '#e0f2fe',
        '--text-accent': '#f0f9ff', // Pure white text
        '--btn-primary-bg': '#0ea5e9', // Sky blue buttons
        '--btn-primary-bg-hover': '#38bdf8',
        '--btn-primary-border': '#0369a1',
        '--btn-primary-border-hover': '#075985'
    },

    // VOLCANO (Soot & Hot & Wintry) - This is your Blacksmith theme
    'volcano': {
        '--bg-main': `linear-gradient(to bottom right, ${WINTRY_BASE_COLOR} 30%, #2d3748 100%)`, // Wintry Slate -> Soot Grey
        '--bg-secondary': '#1a202c', // Sooty secondary
        '--bg-log': 'rgba(0,0,0,0.5)',
        '--bg-tooltip': '#1a202c',
        '--border-main': '#4a5568',
        '--text-main': '#e2e8f0',
        '--text-accent': '#f56565', // Fiery red text
        '--btn-primary-bg': '#c53030', // Hot red buttons
        '--btn-primary-bg-hover': '#e53e3e',
        '--btn-primary-border': '#9b2c2c',
        '--btn-primary-border-hover': '#c53030'
    },
    
    // MAGIC (Arcane & Wintry)
    'magic': {
        '--bg-main': `linear-gradient(to bottom right, ${WINTRY_BASE_COLOR} 30%, #2c1b47 100%)`, // Wintry Slate -> Arcane Purple
        '--bg-secondary': '#1a102d',
        '--bg-log': 'rgba(10, 5, 20, 0.5)',
        '--bg-tooltip': '#1a102d',
        '--border-main': '#4a3a6b',
        '--text-main': '#e6defe',
        '--text-accent': '#f0abfc', // Bright magenta text
        '--btn-primary-bg': '#4a3a6b', // Arcane purple buttons
        '--btn-primary-bg-hover': '#6a5a8b',
        '--btn-primary-border': '#2c215d',
        '--btn-primary-border-hover': '#4a3a6b'
    },

    // CASINO (Gaudy & Wintry)
    'casino': {
        '--bg-main': `linear-gradient(to bottom right, ${WINTRY_BASE_COLOR} 30%, #4a1d68 100%)`, // Wintry Slate -> Gaudy Purple
        '--bg-secondary': '#2b103d',
        '--bg-log': 'rgba(20, 10, 30, 0.5)',
        '--bg-tooltip': '#2b103d',
        '--border-main': '#7a3ea5',
        '--text-main': '#e9d5ff',
        '--text-accent': '#fde047', // Gold text
        '--btn-primary-bg': '#dc2626', // Gaudy red buttons
        '--btn-primary-bg-hover': '#ef4444',
        '--btn-primary-border': '#991b1b',
        '--btn-primary-border-hover': '#b91c1c'
    },

    // All other themes will use the Wintry Base Palette
    'swamp': WINTRY_PALETTE,
    'tundra': WINTRY_PALETTE,
    'void': WINTRY_PALETTE,
    'necropolis': WINTRY_PALETTE,
    'noon': WINTRY_PALETTE,
    'sunset': WINTRY_PALETTE,
    'midnight': WINTRY_PALETTE
};

/**
 * Helper function to aggregate loot from a biome's monsters,
 * filtered by player's clear count.
 * @param {string} biomeKey - The key of the biome.
 * @param {number} clearCount - The number of times the player has cleared this biome.
 * @returns {object} An object containing arrays for loot rarities.
 */
function getLootForBiome(biomeKey, clearCount) {
    const biome = BIOMES[biomeKey];
    if (!biome) return {};

    const monsterKeys = Object.keys(biome.monsters);
    const lootSet = new Set(); // Use a Set to avoid duplicate item names

    monsterKeys.forEach(key => {
        const monster = MONSTER_SPECIES[key];
        if (monster && monster.loot_table) {
            Object.keys(monster.loot_table).forEach(lootKey => {
                lootSet.add(lootKey);
            });
        }
    });

    const lootLists = {
        common: [],
        uncommon: [],
        rare: [],
        epic: [],
        legendary: []
    };

    lootSet.forEach(itemKey => {
        const details = getItemDetails(itemKey); // This checks all item types
        if (details) {
            const rarity = (details.rarity || 'Common').toLowerCase();
            if (rarity === 'broken' || rarity === 'junk' || rarity === 'common') {
                if (clearCount >= 50) lootLists.common.push(details.name);
            } else if (rarity === 'uncommon') {
                if (clearCount >= 100) lootLists.uncommon.push(details.name);
            } else if (rarity === 'rare') {
                if (clearCount >= 100) lootLists.rare.push(details.name);
            } else if (rarity === 'epic') {
                if (clearCount >= 250) lootLists.epic.push(details.name);
            } else if (rarity === 'legendary') {
                if (clearCount >= 250) lootLists.legendary.push(details.name);
            }
        }
    });

    // Sort the lists alphabetically
    for (const key in lootLists) {
        lootLists[key].sort();
    }
    
    return lootLists;
}

/**
 * Shows a detailed tooltip for a Biome.
 * @param {string} biomeKey The key of the biome to display.
 * @param {Event} event The mouse event that triggered the tooltip.
 */
function showBiomeTooltip(biomeKey, event) {
    const tooltipElement = $('#tooltip');
    if (event.type === 'click' && tooltipElement.style.display === 'block' && activeTooltipItem === biomeKey) {
        hideTooltip();
        return;
    }

    const biome = BIOMES[biomeKey];
    if (!biome) return;

    const clears = player.biomeClears[biomeKey] || 0;
    let content = `<h4 class="font-bold mb-1" style="color: var(--text-accent);">${biome.name} (Tier ${biome.tier})</h4>`;
    content += `<p class="text-xs text-gray-400 mb-2"><em>${biome.description}</em></p>`;

    // --- Gate 0: < 10 Clears ---
    if (clears < 10) {
        content += `<p class="text-sm">Clears: ${clears} / 10</p>`;
        content += `<div class="mt-2 pt-2 border-t border-gray-600">
                        <p class="font-semibold text-sm">Enemy Intel:</p>
                        <p class="text-sm text-gray-500">????????</p>
                        <p class="font-semibold text-sm mt-1">Loot Intel:</p>
                        <p class="text-sm text-gray-500">????????</p>
                    </div>`;
    }
    // --- Gate 1: 10+ Clears (Show Enemies) ---
    else if (clears < 50) {
        content += `<p class="text-sm">Clears: ${clears} / 50</p>`;
        content += `<div class="mt-2 pt-2 border-t border-gray-600">`;
        content += `<p class="font-semibold text-sm">Known Enemies:</p><div class="flex flex-wrap gap-2 mt-1">`;
        Object.keys(biome.monsters).forEach(key => {
            const monster = MONSTER_SPECIES[key];
            if (monster) {
                content += `<span class="text-sm text-gray-300 bg-slate-700 px-2 py-0.5 rounded">${monster.emoji} ${monster.name}</span>`;
            }
        });
        content += `</div>`;
        content += `<p class="font-semibold text-sm mt-2">Loot Intel:</p>
                    <p class="text-sm text-gray-500">????????</p>
                    </div>`;
    }
    // --- Gate 2: 50+ Clears (Show Common Loot) ---
    else if (clears < 100) {
        content += `<p class="text-sm">Clears: ${clears} / 100</p>`;
        const loot = getLootForBiome(biomeKey, clears);
        content += `<div class="mt-2 pt-2 border-t border-gray-600">`;
        content += `<p class="font-semibold text-sm">Known Enemies:</p><div class="flex flex-wrap gap-2 mt-1">`;
        Object.keys(biome.monsters).forEach(key => {
            const monster = MONSTER_SPECIES[key];
            if (monster) {
                content += `<span class="text-sm text-gray-300 bg-slate-700 px-2 py-0.5 rounded">${monster.emoji} ${monster.name}</span>`;
            }
        });
        content += `</div>`;
        content += `<p class="font-semibold text-sm mt-2">Common Loot:</p>
                    <p class="text-xs text-gray-400">${loot.common.length > 0 ? loot.common.join(', ') : 'None'}</p>`;
        content += `<p class="font-semibold text-sm mt-2">Notable Loot:</p>
                    <p class="text-sm text-gray-500">????????</p>
                    </div>`;
    }
    // --- Gate 3: 100+ Clears (Show Notable Loot) ---
    else if (clears < 250) {
        content += `<p class="text-sm">Clears: ${clears} / 250</p>`;
        const loot = getLootForBiome(biomeKey, clears);
        content += `<div class="mt-2 pt-2 border-t border-gray-600">`;
        content += `<p class="font-semibold text-sm">Known Enemies:</p><div class="flex flex-wrap gap-2 mt-1">`;
        Object.keys(biome.monsters).forEach(key => {
            const monster = MONSTER_SPECIES[key];
            if (monster) {
                content += `<span class="text-sm text-gray-300 bg-slate-700 px-2 py-0.5 rounded">${monster.emoji} ${monster.name}</span>`;
            }
        });
        content += `</div>`;
        content += `<p class="font-semibold text-sm mt-2">Common Loot:</p>
                    <p class="text-xs text-gray-400">${loot.common.length > 0 ? loot.common.join(', ') : 'None'}</p>`;
        content += `<p class="font-semibold text-sm mt-2">Notable Loot:</p>
                    <p class="text-xs text-cyan-300">${[...loot.uncommon, ...loot.rare].length > 0 ? [...loot.uncommon, ...loot.rare].join(', ') : 'None'}</p>`;
        content += `<p class="font-semibold text-sm mt-2">Rare Loot:</p>
                    <p class="text-sm text-gray-500">????????</p>
                    </div>`;
    }
    // --- Gate 4: 250+ Clears (Show All) ---
    else {
        content += `<p class="text-sm text-yellow-300 font-bold">Clears: ${clears} (Mastered)</p>`;
        const loot = getLootForBiome(biomeKey, clears);
        content += `<div class="mt-2 pt-2 border-t border-gray-600">`;
        content += `<p class="font-semibold text-sm">Enemy Spawn Rates:</p><ul class="list-disc list-inside text-sm">`;
        Object.keys(biome.monsters).forEach(key => {
            const monster = MONSTER_SPECIES[key];
            if (monster) {
                content += `<li>${monster.name} (${biome.monsters[key]}%)</li>`;
            }
        });
        content += `</ul>`;
        content += `<p class="font-semibold text-sm mt-2">Common Loot:</p>
                    <p class="text-xs text-gray-400">${loot.common.length > 0 ? loot.common.join(', ') : 'None'}</p>`;
        content += `<p class="font-semibold text-sm mt-2">Notable Loot:</p>
                    <p class="text-xs text-cyan-300">${[...loot.uncommon, ...loot.rare].length > 0 ? [...loot.uncommon, ...loot.rare].join(', ') : 'None'}</p>`;
        content += `<p class="font-semibold text-sm mt-2">Rare Loot:</p>
                    <p class="text-xs text-purple-400">${[...loot.epic, ...loot.legendary].length > 0 ? [...loot.epic, ...loot.legendary].join(', ') : 'None'}</p>`;
        content += `</div>`;
    }

    tooltipElement.innerHTML = content;
    tooltipElement.style.display = 'block';
    activeTooltipItem = biomeKey;

    let x = event.clientX + 15;
    let y = event.clientY + 15;
    if (x + tooltipElement.offsetWidth > window.innerWidth) x = event.clientX - tooltipElement.offsetWidth - 15;
    if (y + tooltipElement.offsetHeight > window.innerHeight) y = event.clientY - tooltipElement.offsetHeight - 15;
    tooltipElement.style.left = `${x}px`;
    tooltipElement.style.top = `${y}px`;
}

/**
 * Applies a color theme to the game UI by setting CSS variables.
 * @param {string} [themeName='default'] The name of the theme to apply.
 */
function applyTheme(themeName = 'default') {
    const palette = PALETTES[themeName] || PALETTES['default'];

    // Shared button colors that can be overridden by a specific theme.
    const finalPalette = {
        '--btn-action-bg': '#dc2626', '--btn-action-bg-hover': '#ef4444', '--btn-action-border': '#991b1b', '--btn-action-border-hover': '#b91c1c',
        '--btn-magic-bg': '#9333ea', '--btn-magic-bg-hover': '#a855f7', '--btn-magic-border': '#6b21a8', '--btn-magic-border-hover': '#7e22ce',
        '--btn-item-bg': '#16a34a', '--btn-item-bg-hover': '#22c55e', '--btn-item-border': '#15803d', '--btn-item-border-hover': '#16a34a',
        '--btn-flee-bg': '#6b7280', '--btn-flee-bg-hover': '#4b5563', '--btn-flee-border': '#374151', '--btn-flee-border-hover': '#1f2937',
        ...palette
    };

    for (const key in finalPalette) {
        document.documentElement.style.setProperty(key, finalPalette[key]);
    }
}
