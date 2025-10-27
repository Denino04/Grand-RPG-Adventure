// ui_helpers.js
// This file contains utility functions for DOM manipulation, UI rendering,
// theme management, and other interface-related logic.

// =================================================================================
// SECTION 1: CORE UTILITIES & DOM HELPERS
// =================================================================================

const $ = (selector) => document.querySelector(selector);
let logElement;
let mainView;
let characterSheetOriginalStats = null;

function getItemDetails(itemKey) {
    // Check all potential data sources
    return WEAPONS[itemKey]
        || ARMOR[itemKey]
        || SHIELDS[itemKey]
        || CATALYSTS[itemKey]
        || ITEMS[itemKey]
        || LURES[itemKey]
        || SPELLS[itemKey] // Check spells for tooltips
        || COOKING_RECIPES[itemKey] // Check cooking recipes for tooltips
        // Add other data sources like ALCHEMY_RECIPES if needed for tooltips later
        || null; // Return null if not found anywhere
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
 * @returns {object} An object containing the total and the individual rolls: { total: number, rolls: number[] }.
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
 * @param {HTMLElement | DocumentFragment | Text | string} viewElement The new element, fragment, text node, or HTML string to render.
 */
function render(viewElement) {
    // Ensure mainView is initialized
    if (!mainView) {
        console.error("Main view element not initialized. Cannot render.");
        return;
    }

    hideTooltip();
    hideEnemyInfo(); // Ensure enemy info popup is hidden too

    // Define base classes - adjust these if needed
    const baseClasses = "bg-slate-900/50 rounded-lg flex-grow flex items-center justify-center p-6 min-h-[300px] md:min-h-0 overflow-y-auto inventory-scrollbar";

    // Apply base classes (consider preserving specific classes if needed)
    mainView.className = baseClasses;

    // Clear previous content
    mainView.innerHTML = '';

    // Append new content based on type
    if (viewElement instanceof HTMLElement || viewElement instanceof DocumentFragment || viewElement instanceof Text) {
        mainView.appendChild(viewElement);
    } else if (typeof viewElement === 'string') {
        // If it's an HTML string, parse it carefully or use innerHTML
        // Using innerHTML is simpler here, but be mindful of security if the string comes from untrusted sources
        mainView.innerHTML = viewElement;
    } else {
        console.warn("Invalid content passed to render function:", viewElement);
        mainView.textContent = "Error rendering view."; // Fallback message
    }

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

    updateDebugView(); // Update debug panel if visible
    updatePersistentButtons(); // Update state/visibility of persistent UI like settings/exit buttons
}


/**
 * Function to handle visibility or other state changes for persistent buttons.
 * Visibility is now primarily controlled by CSS via body classes set in render().
 */
function updatePersistentButtons() {
    const persistentButtons = $('#persistent-buttons');
    if (!persistentButtons) return;
    // CSS handles showing/hiding based on body.view-* classes.
}

// =================================================================================
// SECTION 3: REUSABLE UI BUILDER FUNCTIONS
// =================================================================================

/**
 * Creates a standard button for UI menus.
 * @param {object} config - Configuration for the button.
 * @param {string} config.text - The button text.
 * @param {string} config.onclick - The JS code for the onclick event.
 * @param {string} [config.classes='btn-primary'] - Additional CSS classes.
 * @param {boolean} [config.disabled=false] - Whether the button is disabled.
 * @returns {string} The HTML string for the button.
 */
function createButton(config) {
    const { text, onclick, classes = 'btn-primary', disabled = false } = config;
    return `<button onclick="${onclick || ''}" class="btn ${classes}" ${disabled ? 'disabled' : ''}>${text || ''}</button>`;
}


/**
 * Creates a generic list of items for shops or crafting menus, sorted by price.
 * @param {object} config - Configuration for the list.
 * @param {string[]} config.items - Array of item keys.
 * @param {function} config.detailsFn - Function to get item details (e.g., getItemDetails).
 * @param {function} config.actionsHtmlFn - Function that returns HTML string for action buttons based on key and details.
 * @returns {string} The HTML string for the list.
 */
function createItemList(config) {
    const { items, detailsFn, actionsHtmlFn } = config;
    if (!items || items.length === 0) return '';

    // Create objects with details for sorting
    const itemsToSort = items.map(key => {
        const details = detailsFn(key);
        // Fallback for items potentially missing price or details
        return { key, price: details?.price || 0, details };
    }).filter(itemObj => itemObj.details); // Filter out items where detailsFn failed

    // Sort by price (ascending)
    itemsToSort.sort((a, b) => a.price - b.price);

    // Generate HTML for the sorted list
    return itemsToSort.map(itemObj => {
        const key = itemObj.key;
        const details = itemObj.details; // Already fetched
        const actionsHtml = actionsHtmlFn(key, details); // Generate actions HTML

        // Basic structure for each list item
        return `
            <div class="flex justify-between items-center p-2 bg-slate-800 rounded text-sm"
                 onmouseover="showTooltip('${key}', event)"
                 onmouseout="hideTooltip()"
                 onclick="showTooltip('${key}', event)">
                <span>${details.name || key}</span> {/* Fallback to key if name missing */}
                <div>${actionsHtml}</div>
            </div>`;
    }).join('');
}


/**
 * Creates a selection list with a details pane (used in character creation).
 * @param {object} config - Configuration object.
 * @param {object} config.data - The data object (e.g., RACES, CLASSES).
 * @param {string} config.listId - The ID of the element to populate with the list.
 * @param {string} config.detailsId - The ID of the element to populate with details.
 * @param {function} config.buttonTextFn - Function(key, data) that returns the text for each button.
 * @param {function} config.detailsHtmlFn - Function(key, data) that returns the HTML for the details pane.
 * @param {function} config.onClickFn - Function(key) called when a button is clicked.
 * @param {string} [config.initialSelectionKey=null] - Key of the item to select initially.
 */
function createSelectionListWithDetails(config) {
    const { data, listId, detailsId, buttonTextFn, detailsHtmlFn, onClickFn, initialSelectionKey = null } = config;
    const listContainer = $(`#${listId}`);
    const detailsContainer = $(`#${detailsId}`);
    if (!listContainer || !detailsContainer) {
        console.error(`Missing container elements: #${listId} or #${detailsId}`);
        return;
    }

    listContainer.innerHTML = ''; // Clear previous list

    // Find the currently selected key (if applicable, e.g., from player object)
    let selectedKey = initialSelectionKey; // Start with explicit initial, or null

    Object.keys(data).forEach(key => {
        const itemData = data[key];
        const button = document.createElement('button');
        button.className = 'btn btn-primary w-full text-left'; // Base style
        button.dataset.key = key;
        button.textContent = buttonTextFn(key, itemData); // Get button text

        // Function to update details pane
        const updateDetails = () => {
            detailsContainer.innerHTML = detailsHtmlFn(key, itemData);
        };

        // Function to handle button click
        const handleClick = () => {
            // Remove selection style from all buttons in this list
            document.querySelectorAll(`#${listId} button`).forEach(btn => {
                btn.classList.remove('bg-yellow-600', 'border-yellow-800');
                btn.classList.add('btn-primary');
            });
            // Apply selection style to the clicked button
            button.classList.add('bg-yellow-600', 'border-yellow-800');
            button.classList.remove('btn-primary');

            selectedKey = key; // Update the selected key
            updateDetails(); // Update details pane
            onClickFn(key); // Call the provided click handler
        };

        button.onmouseenter = updateDetails; // Update details on hover
        button.onclick = handleClick; // Handle click logic

        listContainer.appendChild(button);

        // If this key matches the initial selection, trigger its click handler
        if (key === selectedKey) {
            button.click(); // Programmatically click to select and show details
        }
    });

    // If no initial selection was made (or found), show placeholder text
    if (selectedKey === null) {
        detailsContainer.innerHTML = '<p class="text-gray-400">Select an option from the list.</p>';
    }
}

// =================================================================================
// SECTION 4: TOOLTIP & INFO DISPLAY
// =================================================================================

let activeTooltipItem = null; // Track which item the tooltip is currently showing for

/**
 * Shows a detailed tooltip for an item, spell, recipe, or enemy.
 * Handles positioning to stay within viewport bounds.
 * @param {string} itemKey The key of the item/spell/recipe or a unique enemy identifier (e.g., `enemy-${enemy.name}-${index}`).
 * @param {Event} event The mouse event that triggered the tooltip.
 */
function showTooltip(itemKey, event) {
    const tooltipElement = $('#tooltip');
    if (!tooltipElement) return; // Exit if tooltip element doesn't exist

    // If clicking the same item that's already showing tooltip, hide it
    if (event.type === 'click' && tooltipElement.style.display === 'block' && activeTooltipItem === itemKey) {
        hideTooltip();
        return;
    }

    let details;
    let content = '';

    // --- Determine Item Type and Generate Content ---
    if (itemKey.startsWith('enemy-')) {
        // --- Enemy Tooltip Logic ---
        // Find the specific enemy instance (assuming currentEnemies is globally accessible)
        // This part needs refinement if enemy names aren't unique - maybe pass enemy index or object directly?
        // For now, assuming name is unique enough for tooltip context:
        const enemyName = itemKey.split('-').slice(1).join('-'); // Extract name
        const enemy = typeof currentEnemies !== 'undefined'
            ? currentEnemies.find(e => e.name === enemyName && e.isAlive())
            : null;

        if (enemy) {
            content = `<h4 class="font-bold text-red-400 mb-1">${enemy.name}</h4>`;
            content += `<p>HP: ${enemy.hp} / ${enemy.maxHp}</p>`;
            // Add more enemy details if desired (e.g., element, buffs/debuffs)
            const statusEffects = Object.keys(enemy.statusEffects).map(k => capitalize(k.replace(/_/g, ' '))).join(', ');
            if (statusEffects) {
                content += `<p class="text-xs text-yellow-300 mt-1">Status: ${statusEffects}</p>`;
            }
        } else {
            content = '<p class="text-gray-400">Enemy info not found.</p>';
        }

    } else if (itemKey in SPELLS) {
        // --- Spell Tooltip Logic ---
        const spellTree = SPELLS[itemKey];
        const playerSpell = player?.spells?.[itemKey]; // Safely access player spells
        const tier = playerSpell ? playerSpell.tier : 1; // Default to tier 1 if not learned
        details = spellTree.tiers[tier - 1]; // Get data for the correct tier

        if (details) {
            content = `<h4 class="font-bold mb-1 text-purple-300">${details.name} (Tier ${tier})</h4>`;
            content += `<p class="text-xs text-gray-400 mb-2">${capitalize(spellTree.element)} / ${spellTree.type.toUpperCase()}</p>`;
            if (details.damage) content += `<p class="text-sm">Power: ${details.damage[0]}d${details.damage[1]} (Cap: ${details.cap} dice)</p>`;
            if (details.cost) content += `<p class="text-sm text-blue-400">MP Cost: ${details.cost}</p>`;
            if (details.splash) content += `<p class="text-sm">Splash: ${details.splash * 100}% Dmg</p>`;
            // Add effect description if available
            if (details.description) {
                content += `<p class="text-gray-300 mt-2 text-xs italic">${details.description}</p>`;
            }
            // Show upgrade info if not max tier
            if (tier < spellTree.tiers.length) {
                const upgradeData = spellTree.tiers[tier - 1]; // Upgrade cost is on the *current* tier data
                const nextTierData = spellTree.tiers[tier];
                content += '<div class="mt-2 pt-2 border-t border-gray-600 text-xs">';
                content += `<p>Next Tier: ${nextTierData.name}</p>`;
                if (upgradeData.upgradeCost) content += `<p>Cost: ${upgradeData.upgradeCost} G</p>`;
                if (upgradeData.upgradeEssences) {
                    const essences = Object.entries(upgradeData.upgradeEssences).map(([key, val]) => `${val}x ${getItemDetails(key)?.name || key}`).join(', ');
                    content += `<p>Essences: ${essences}</p>`;
                }
                content += '</div>';
            } else {
                 content += '<p class="text-xs text-cyan-300 mt-2 pt-2 border-t border-gray-600">Max Tier Reached</p>';
            }
        } else {
            content = `<p class="text-red-400">Error: Spell details not found for tier ${tier}.</p>`;
        }

    } else if (itemKey in COOKING_RECIPES) {
        // --- Cooking Recipe Tooltip Logic ---
        details = COOKING_RECIPES[itemKey];
        if (details) {
            content = `<h4 class="font-bold mb-1 text-yellow-300">${details.name}</h4>`;
            content += `<p class="text-xs mb-2 text-gray-400">Tier ${details.tier} Cooked Meal</p>`;
            if (details.description) {
                content += `<p class="text-gray-300 text-xs italic">${details.description}</p>`;
            }
            // Ingredients list
            const ingredients = Object.entries(details.ingredients).map(([key, val]) => {
                const ingredientDetails = getItemDetails(key);
                // Handle generic vs specific ingredient names
                const name = ingredientDetails ? ingredientDetails.name : capitalize(key);
                return `${val}x ${name}`;
            }).join(', ');
            content += `<p class="text-sm mt-2">Requires: ${ingredients}</p>`;
            // Effect description
            const effect = details.effect;
            if (effect) {
                content += '<div class="mt-2 pt-2 border-t border-gray-600 text-cyan-300 text-xs"><ul class="list-disc list-inside space-y-1">';
                if (effect.heal) content += `<li>Heals ${effect.heal} HP</li>`;
                switch (effect.type) {
                    case 'buff':
                        effect.buffs.forEach(buff => {
                            const statName = buff.stat.replace(/_/g, ' ');
                            let valueDisplay = '';
                             if (buff.stat === 'movement_speed') {
                                valueDisplay = `+${buff.value}`; // Additive
                             } else {
                                valueDisplay = `+${((buff.value - 1) * 100).toFixed(0)}%`; // Multiplicative
                             }
                            content += `<li>${valueDisplay} ${capitalize(statName)} (${buff.duration} enc.)</li>`;
                        });
                        break;
                    case 'heal_percent': content += `<li>Restores ${effect.heal_percent * 100}% Max HP</li>`; break;
                    case 'mana_percent': content += `<li>Restores ${effect.mana_percent * 100}% Max MP</li>`; break;
                    case 'full_restore': content += `<li>Fully restores HP & MP</li>`; break;
                }
                content += '</ul></div>';
            }
        } else {
             content = '<p class="text-red-400">Recipe details not found.</p>';
        }

    } else {
        // --- Standard Item Tooltip Logic ---
        details = getItemDetails(itemKey);
        if (!details) {
            // Check if it's potentially an alchemy ingredient key if not found elsewhere
             if (ALCHEMY_RECIPES[itemKey]) { // Assuming ALCHEMY_RECIPES holds output keys mapped to details
                details = ALCHEMY_RECIPES[itemKey]; // Attempt to show recipe output details? This might need adjustment based on ALCHEMY_RECIPES structure.
                // Re-purpose 'details' - add a check or specific handling if needed
                if(details && details.output && getItemDetails(details.output)){ // Check if it's a recipe object and has an output we can detail
                    const outputDetails = getItemDetails(details.output);
                     content = `<h4 class="font-bold mb-1 text-yellow-300">Recipe: ${outputDetails.name}</h4>`;
                     // Maybe add ingredients here?
                }
            }
            if (!details) return; // Exit if still no details found
        }


        // Build standard item tooltip content
        content = `<h4 class="font-bold mb-1" style="color: var(--text-accent);">${details.name}</h4>`;
        if (details.rarity) content += `<p class="text-xs mb-2 ${getRarityColorClass(details.rarity)}">${details.rarity}</p>`;
        else if (details.type === 'key') content += `<p class="text-xs mb-2 text-yellow-300">Key Item</p>`;
        else content += `<p class="text-xs mb-2 text-gray-400">${capitalize(details.type || 'Item')}</p>`; // Fallback type


        // Add relevant stats based on item type
        if (details.damage) content += `<p class="text-sm">Damage: ${details.damage[0]}d${details.damage[1]}</p>`;
        if (details.range > 0) content += `<p class="text-sm">Range: ${details.range}</p>`;
        if (details.defense) content += `<p class="text-sm">Defense: ${details.defense}</p>`;
        if (details.blockChance > 0) content += `<p class="text-sm">Block: ${(details.blockChance * 100).toFixed(0)}%</p>`;
        if (details.amount && details.type === 'healing') content += `<p class="text-sm text-green-400">Heals: ${details.amount} HP</p>`;
        if (details.type === 'mana_restore') content += `<p class="text-sm text-blue-400">Restores: ${details.amount} MP</p>`;
        if (details.uses && details.type !== 'lure') content += `<p class="text-sm text-purple-300">Uses: ${details.uses}</p>`;
        if (details.type === 'lure' && details.uses) content += `<p class="text-sm text-purple-300">Base Uses: ${details.uses}</p>`;


        // --- Item Effects Section ---
        if (details.effect || (details.type === 'buff' && details.effect)) { // Check both direct effect and buff type
            content += '<div class="mt-2 pt-2 border-t border-gray-600 text-cyan-300 text-xs"><ul class="list-disc list-inside space-y-1">';
            const effect = details.effect;
            // List all possible effect types for clarity
            if (effect?.critChance) content += `<li>Crit: +${(effect.critChance * 100).toFixed(0)}% chance, x${effect.critMultiplier || 1.5} Dmg</li>`;
            if (effect?.lifesteal) content += `<li>Lifesteal: ${(effect.lifesteal * 100).toFixed(0)}%</li>`;
            if (effect?.paralyzeChance) content += `<li>On Hit: ${(effect.paralyzeChance * 100).toFixed(0)}% chance to Paralyze</li>`;
            if (effect?.toxicChance) content += `<li>On Hit: ${(effect.toxicChance * 100).toFixed(0)}% chance for Toxin</li>`;
            if (effect?.armorPierce) content += `<li>Armor Pierce: ${(effect.armorPierce * 100).toFixed(0)}%</li>`;
            if (effect?.bonusVsDragon) content += `<li>Bonus vs. Dragon: x${effect.bonusVsDragon} Dmg</li>`;
            if (effect?.bonusVsLegendary) content += `<li>Bonus vs. Legendary: x${effect.bonusVsLegendary} Dmg</li>`;
            if (effect?.doubleStrike) content += `<li>Double Strike (Always)</li>`;
            if (effect?.doubleStrikeChance) content += `<li>Double Strike: ${(effect.doubleStrikeChance * 100).toFixed(0)}% chance</li>`;
            if (effect?.revive) content += `<li>Revives wearer once per battle</li>`;
            if (effect?.spellFollowUp) content += `<li>Follows spell casts with a weapon strike</li>`;
            if (effect?.petrifyChance) content += `<li>On Hit: ${(effect.petrifyChance * 100).toFixed(0)}% chance to Petrify</li>`;
            if (effect?.type === 'godslayer') content += `<li>Godslayer: Bonus Dmg = ${(effect.percent_hp_damage * 100).toFixed(0)}% target Max HP</li>`;
            if (effect?.intScaling) content += `<li>Scales with Intelligence</li>`;
            if (effect?.elementalBolt) content += `<li>On Hit: Chance for elemental bolt</li>`;
            if (effect?.uncapCombo) content += `<li>Uncapped Combo Damage Bonus</li>`;
            if (effect?.healOnKill) content += `<li>On Kill: Heals ${(effect.healOnKill * 100).toFixed(0)}% Max HP</li>`;
            if (effect?.execute) content += `<li>Execute: Chance below ${(effect.execute * 100).toFixed(0)}% HP</li>`;
            if (effect?.cleanseChance) content += `<li>On Hit: ${(effect.cleanseChance * 100).toFixed(0)}% chance to Cleanse</li>`;
            if (effect?.lootBonus) content += `<li>Increases rare material drop chance</li>`;
            if (effect?.spell_amp) content += `<li>Spell Power: +${effect.spell_amp} Dice</li>`;
            if (effect?.mana_discount) content += `<li>Spell Cost: -${effect.mana_discount} MP</li>`;
            if (effect?.mana_regen) content += `<li>Regen: +${effect.mana_regen} MP/turn</li>`;
            if (effect?.spell_crit_chance) content += `<li>Spell Crit: ${(effect.spell_crit_chance * 100).toFixed(0)}% chance, x${effect.spell_crit_multiplier || 1.5} Dmg</li>`;
            if (effect?.spell_vamp) content += `<li>Spell Vamp: Kill restores ${(effect.spell_vamp * 100).toFixed(0)}% HP/MP</li>`;
            if (effect?.spell_penetration) content += `<li>Spell Pen: Ignores ${(effect.spell_penetration * 100).toFixed(0)}% Resist</li>`;
            if (effect?.spell_sniper) content += `<li>Spell Range: +${(effect.spell_sniper * 100).toFixed(0)}%</li>`;
            if (effect?.overdrive) content += `<li>Overdrive: ${(effect.overdrive.chance * 100).toFixed(0)}% for x${effect.overdrive.multiplier} Dmg (Costs ${(effect.overdrive.self_damage * 100).toFixed(0)}% HP)</li>`;
            if (effect?.battlestaff) content += `<li>Battlestaff: Melee scales with Int</li>`;
            if (effect?.spell_weaver) content += `<li>Spellweaver: ${(effect.spell_weaver * 100).toFixed(0)}% for random element</li>`;
            if (effect?.ranged_chance) content += `<li>Ranged Evasion: ${(effect.ranged_chance * 100).toFixed(0)}% chance</li>`;
            if (effect?.hp_regen) content += `<li>Regen: +${effect.hp_regen} HP/turn</li>`;
            if (effect?.parry) content += `<li>Parry: +${(effect.parry * 100).toFixed(0)}% chance</li>`;
            if (effect?.attack_follow_up) content += `<li>Retaliate: ${effect.attack_follow_up.damage.join('d')} Dmg</li>`;
            if (effect?.type === 'debuff_resist') content += `<li>Debuff Resist: +${(effect.chance * 100).toFixed(0)}%</li>`;
            if (effect?.type === 'reflect') content += `<li>Reflect: ${(effect.amount * 100).toFixed(0)}% Dmg</li>`;
            if (effect?.type === 'dodge') content += `<li>Dodge: +${(effect.chance * 100).toFixed(0)}% chance</li>`;
            if (effect?.reflect_damage) content += `<li>Reflect: ${(effect.reflect_damage * 100).toFixed(0)}% Dmg</li>`;
            // Buff Item Effects
            if (details.type === 'buff' && effect) {
                if (effect.type.startsWith('temp_')) { // Encounter buffs from food/special potions
                    const statName = effect.stat.replace(/_/g, ' ');
                    const valueDisplay = (effect.stat === 'movement_speed')
                        ? `+${effect.value}`
                        : `+${((effect.value - 1) * 100).toFixed(0)}%`;
                    content += `<li>Effect: ${valueDisplay} ${capitalize(statName)} (${effect.duration} enc.)</li>`;
                } else { // Standard turn-based buffs from potions
                    content += `<li>Effect: Grants ${capitalize(effect.type.replace('buff_', '').replace('_', ' '))} (${effect.duration} turns)</li>`;
                }
            }
            content += '</ul></div>';
        }


        // Description
        if (details.description) {
            content += `<p class="text-gray-400 mt-2 text-xs italic">${details.description}</p>`;
        }

        // Sell price (only show if item is sellable)
        if (details.price > 0) {
             content += `<p class="text-xs text-yellow-400 mt-2">Value: ${details.price} G | Sells for: ${Math.floor(details.price / 4)} G</p>`;
        }
    }


    tooltipElement.innerHTML = content;
    tooltipElement.style.display = 'block';
    activeTooltipItem = itemKey; // Update tracked item

    // --- Position Calculation ---
    // Ensure event coordinates are numbers
    const eventX = typeof event.clientX === 'number' ? event.clientX : 0;
    const eventY = typeof event.clientY === 'number' ? event.clientY : 0;

    // Use default offsets
    let x = eventX + 15;
    let y = eventY + 15;

    // Get tooltip dimensions *after* setting content
    const tooltipWidth = tooltipElement.offsetWidth;
    const tooltipHeight = tooltipElement.offsetHeight;

    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Adjust position if tooltip goes off-screen
    if (x + tooltipWidth > viewportWidth - 10) { // Add small buffer (10px)
        x = eventX - tooltipWidth - 15; // Move to the left of cursor
    }
    if (y + tooltipHeight > viewportHeight - 10) { // Add small buffer
        y = eventY - tooltipHeight - 15; // Move above cursor
    }

    // Ensure tooltip doesn't go off the top or left edge either
    x = Math.max(10, x);
    y = Math.max(10, y);

    tooltipElement.style.left = `${x}px`;
    tooltipElement.style.top = `${y}px`;
}


/** Hides the main tooltip. */
function hideTooltip() {
    const tooltipElement = $('#tooltip');
    if(tooltipElement) {
        tooltipElement.style.display = 'none';
    }
    activeTooltipItem = null;
}

/**
 * Shows a simplified tooltip for an enemy in battle (uses main showTooltip now).
 * @param {Enemy} enemy The enemy object.
 * @param {Event} event The mouse event.
 */
function showEnemyInfo(enemy, event) {
    if (!enemy) return;
    // Construct a unique key for the enemy instance, maybe including index if names aren't unique
    // For simplicity, assuming name is unique enough here. Could be `enemy-${enemy.name}-${index}` if needed.
    showTooltip(`enemy-${enemy.name}`, event);
}


/** Hides the enemy info tooltip (now just calls hideTooltip). */
function hideEnemyInfo() {
    hideTooltip();
}


// --- REWRITTEN MODAL FUNCTION ---
/**
 * Displays a simple modal popup with enhanced closing options and ARIA attributes.
 * @param {string} title - The title of the modal.
 * @param {string} message - The main text content of the modal.
 * @param {string} buttonText - The text for the confirmation button.
 * @param {function} [onConfirm=null] - Callback function when the button is clicked.
 */
function showModal(title, message, buttonText = "OK", onConfirm = null) {
    // --- Close existing modal if any ---
    const existingModal = document.getElementById('simple-modal');
    if (existingModal) {
        // Clean up previous listeners before removing
        const oldButton = existingModal.querySelector('button');
        if (oldButton) oldButton.onclick = null; // Remove button listener
        document.removeEventListener('keydown', existingModal._escapeHandler); // Remove escape listener
        existingModal.removeEventListener('click', existingModal._overlayClickHandler); // Remove overlay click listener
        existingModal.remove();
    }

    // --- Create modal elements ---
    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'simple-modal';
    modalOverlay.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4 backdrop-blur-sm'; // Increased z-index, added backdrop blur
    modalOverlay.setAttribute('role', 'dialog');
    modalOverlay.setAttribute('aria-modal', 'true');
    modalOverlay.setAttribute('aria-labelledby', 'modal-title');
    modalOverlay.setAttribute('aria-describedby', 'modal-message');

    const modalContent = document.createElement('div');
    modalContent.className = 'bg-slate-800 p-6 rounded-lg shadow-xl max-w-md w-full text-center border border-slate-600 animate-fade-in'; // Added simple fade-in idea (needs CSS)

    const modalTitle = document.createElement('h2');
    modalTitle.id = 'modal-title'; // For aria-labelledby
    modalTitle.className = 'font-medieval text-2xl mb-4 text-yellow-300';
    modalTitle.textContent = title;

    const modalMessage = document.createElement('p');
    modalMessage.id = 'modal-message'; // For aria-describedby
    modalMessage.className = 'text-gray-300 mb-6';
    modalMessage.textContent = message;

    const modalButton = document.createElement('button');
    modalButton.className = 'btn btn-primary px-6 py-2';
    modalButton.textContent = buttonText;

    // --- Close function ---
    const closeModal = () => {
        // Clean up listeners
        document.removeEventListener('keydown', escapeHandler);
        modalOverlay.removeEventListener('click', overlayClickHandler);
        modalOverlay.remove(); // Remove modal from DOM
    };

    // --- Event Handlers ---
    modalButton.onclick = () => {
        closeModal();
        if (typeof onConfirm === 'function') {
            try {
                onConfirm(); // Execute callback
            } catch (e) {
                console.error("Error in modal confirm callback:", e);
            }
        }
    };

    // Close on Escape key
    const escapeHandler = (event) => {
        if (event.key === 'Escape') {
            closeModal();
        }
    };
    modalOverlay._escapeHandler = escapeHandler; // Store reference for removal
    document.addEventListener('keydown', escapeHandler);

    // Close on overlay click (but not content click)
    const overlayClickHandler = (event) => {
        if (event.target === modalOverlay) { // Only close if clicking the dark overlay itself
            closeModal();
        }
    };
    modalOverlay._overlayClickHandler = overlayClickHandler; // Store reference for removal
    modalOverlay.addEventListener('click', overlayClickHandler);

    // --- Assemble modal ---
    modalContent.appendChild(modalTitle);
    modalContent.appendChild(modalMessage);
    modalContent.appendChild(modalButton);
    modalOverlay.appendChild(modalContent);

    // --- Add to body ---
    document.body.appendChild(modalOverlay);

    // Optional: Focus the button for keyboard navigation
    modalButton.focus();
}
// --- END REWRITTEN MODAL FUNCTION ---


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

    // Show skip button only for the main sequence
    if(sequenceKey === 'main_game_screen') {
        const skipBtn = $('#skip-tutorial-btn');
        if (skipBtn) { // Check if element exists
            skipBtn.classList.remove('hidden');
            skipBtn.onclick = endTutorial;
        } else {
             console.warn("Skip tutorial button not found.");
        }
    }

    const sequence = TUTORIAL_SEQUENCES[sequenceKey];
    if (sequence) {
        tutorialState.isActive = true;
        tutorialState.sequence = [...sequence]; // Use spread for a shallow copy
        tutorialState.currentIndex = -1;
        tutorialState.flags.clear(); // Reset flags for new sequence
        console.log(`Starting tutorial sequence: ${sequenceKey}`);
        advanceTutorial();
    } else {
        console.warn(`Tutorial sequence "${sequenceKey}" not found.`);
    }
}


function advanceTutorial(param = '') {
    // Abort previous trigger listener if active
    if (tutorialState.currentTriggerController) {
        tutorialState.currentTriggerController.abort();
        tutorialState.currentTriggerController = null;
    }

    const currentStep = tutorialState.sequence[tutorialState.currentIndex];

    // Handle choice branching
    if (param && currentStep?.type === 'choice') {
        const choiceBranchKey = currentStep.choices[param];
        const branchSequence = TUTORIAL_SEQUENCES[choiceBranchKey] || [];
        const continuationSequence = TUTORIAL_SEQUENCES['continue_main_tutorial'] || [];
        // Splice in the chosen branch, followed by the main continuation.
        tutorialState.sequence.splice(tutorialState.currentIndex + 1, 0, ...branchSequence, ...continuationSequence);
        console.log(`Tutorial branched to: ${choiceBranchKey}`);
    }

    // Move to the next step index
    tutorialState.currentIndex++;
    console.log(`Advancing tutorial to index: ${tutorialState.currentIndex}`);

    // Check if sequence ended
    if (tutorialState.currentIndex >= tutorialState.sequence.length) {
        console.log("Tutorial sequence finished.");
        endTutorial();
        return;
    }

    let step = tutorialState.sequence[tutorialState.currentIndex];

    // Handle steps that only set up triggers without showing UI
    if (step.type === 'trigger_only') {
        console.log(`Setting up trigger for step ${step.id || tutorialState.currentIndex}`);
        setupTutorialTrigger(step.trigger);
        return; // Don't show UI, just wait for trigger
    }

    // Handle checkpoint logic
    if (step.type === 'checkpoint') {
        const requiredFlags = step.requiredFlags || [];
        const hasAllFlags = requiredFlags.every(flag => tutorialState.flags.has(flag));

        console.log(`Checkpoint reached. Required flags: [${requiredFlags.join(', ')}]. Has flags: ${hasAllFlags}`);

        if (hasAllFlags) {
            advanceTutorial(); // Skip checkpoint if flags met
            return;
        } else {
            // Checkpoint not met, set up triggers for missing flags
            let checkpointContent = "Time to check out the town. Visit the ";
            const remaining = [];
            // Dynamically set up triggers for whichever flag is missing
            if (!tutorialState.flags.has('commercial_visited')) {
                 setupTutorialTrigger({ type: 'click', targetId: 'button[onclick*="renderCommercialDistrict"]', nextSequence: 'commercial_district_tour', setFlag: 'commercial_visited' }); // Ensure flag is set on click
                 remaining.push('Commercial District');
            }
            if (!tutorialState.flags.has('arcane_visited')) {
                 setupTutorialTrigger({ type: 'click', targetId: 'button[onclick*="renderArcaneQuarter"]', nextSequence: 'arcane_district_tour', setFlag: 'arcane_visited' });
                 remaining.push('Arcane Quarter');
            }
            if (!tutorialState.flags.has('residential_visited')) {
                 setupTutorialTrigger({ type: 'click', targetId: 'button[onclick*="renderResidentialDistrict"]', nextSequence: 'residential_district_tour', setFlag: 'residential_visited' });
                 remaining.push('Residential Area');
            }
            checkpointContent += remaining.join(' or ') + ".";
            showTutorialStep(step, checkpointContent); // Show checkpoint message
            return; // Wait for trigger
        }
    }

    // Process step content (e.g., replace placeholders)
    let content = step.content;
    const charName = player ? player.name : param; // Use player name if available, else param (for finalize)
    if (charName && content && content.includes('<Charname>')) {
        content = content.replace(/<Charname>/g, charName);
    }

    // Handle pre-actions before showing the step
    if (step.preAction === 'enableWilderness') {
        const wildernessBtn = document.querySelector('button[onclick*="renderWildernessMenu"]');
        if(wildernessBtn) wildernessBtn.disabled = false;
        console.log("Wilderness button enabled by tutorial.");
    }
    // Handle actions that replace the tutorial step itself
    if (step.preAction === 'renderPostBattleMenu') {
        console.log("Rendering post-battle menu via tutorial preAction.");
        renderPostBattleMenu(); // Render the menu
        advanceTutorial(); // Immediately advance to the next tutorial step (likely the outro)
        return; // Don't show the current step's UI
    }

    // Show the actual tutorial step UI
    showTutorialStep(step, content);
}

function showTutorialStep(step, content) {
    const box = $('#tutorial-box');
    const text = $('#tutorial-text');
    const nextBtn = $('#tutorial-next-btn');
    const choiceContainer = $('#tutorial-choice-buttons');

    // Ensure elements exist
    if (!box || !text || !nextBtn || !choiceContainer) {
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
        setupTutorialTrigger(step.trigger);
    }
}


function setupTutorialTrigger(trigger) {
    const nextBtn = $('#tutorial-next-btn');

    // Show 'Next' button only if there's no specific trigger defined
    if (!trigger) {
        if (nextBtn) { // Check if nextBtn exists
            nextBtn.style.display = 'block';
            nextBtn.onclick = advanceTutorial;
        } else {
             console.warn("Tutorial 'Next' button not found.");
        }
    } else {
        if (nextBtn) nextBtn.style.display = 'none'; // Hide if there's a trigger
    }

    // Abort any previous listener controller
    if (tutorialState.currentTriggerController) {
        tutorialState.currentTriggerController.abort();
    }
    // Create a new controller for the current trigger
    tutorialState.currentTriggerController = new AbortController();
    const { signal } = tutorialState.currentTriggerController;

    if (!trigger) return; // Exit if no trigger defined

    // Add event listener based on trigger type
    try { // Add try-catch for robustness
        switch (trigger.type) {
            case 'next_button':
                // Already handled by the check above
                break;
            case 'input':
                const inputEl = $(`#${trigger.targetId}`);
                if (inputEl) {
                    const triggerAdvance = () => {
                        console.log(`Tutorial advanced by input on #${trigger.targetId}`);
                        advanceTutorial();
                    };
                    inputEl.addEventListener('input', triggerAdvance, { once: true, signal });
                } else {
                     console.warn(`Tutorial trigger input element not found: #${trigger.targetId}`);
                }
                break;
            case 'click':
                // Use querySelectorAll for potentially multiple elements (like biome buttons)
                const clickEls = document.querySelectorAll(trigger.targetId);
                if (clickEls.length > 0) {
                    clickEls.forEach(el => {
                        const handler = (e) => {
                             console.log(`Tutorial advanced by click on element matching selector: ${trigger.targetId}`);
                            // Prevent default if specified (useful for links/buttons that shouldn't navigate immediately)
                            // if (trigger.preventDefault) e.preventDefault();

                            if (trigger.setFlag) {
                                console.log(`Setting tutorial flag: ${trigger.setFlag}`);
                                tutorialState.flags.add(trigger.setFlag);
                            }
                            // Splice in next sequence if defined
                            if (trigger.nextSequence) {
                                const nextSeq = TUTORIAL_SEQUENCES[trigger.nextSequence] || [];
                                tutorialState.sequence.splice(tutorialState.currentIndex + 1, 0, ...nextSeq);
                                console.log(`Spliced in next tutorial sequence: ${trigger.nextSequence}`);
                            }
                            advanceTutorial(); // Advance after handling flags/sequences
                        };
                        // Add listener with the signal for aborting
                        el.addEventListener('click', handler, { once: true, signal });
                    });
                } else {
                     console.warn(`Tutorial trigger click target not found: ${trigger.targetId}`);
                     // Should we auto-advance or just wait? Waiting might be safer.
                }
                break;
             case 'enemy_death':
                // This trigger type doesn't need a listener here.
                // It's checked explicitly within the battle logic (checkBattleStatus)
                // which then calls advanceTutorial().
                console.log("Waiting for enemy_death trigger from battle logic...");
                break;
             default:
                 console.warn(`Unknown tutorial trigger type: ${trigger.type}`);
                 // Show next button as a fallback if trigger is unknown?
                  if (nextBtn) {
                      nextBtn.style.display = 'block';
                      nextBtn.onclick = advanceTutorial;
                  }
                 break;

        }
    } catch (error) {
         console.error("Error setting up tutorial trigger:", error);
         // Optionally try to recover or end the tutorial
         // For now, just log the error.
    }
}

function completeBattleTutorial() {
    console.log("Completing battle tutorial...");
    endTutorial(); // Properly clear tutorial state
    renderTownSquare(); // Navigate to town
}

function endTutorial() {
    const box = $('#tutorial-box');
    const skipBtn = $('#skip-tutorial-btn');

    if (box) box.classList.add('hidden');
    if (skipBtn) skipBtn.classList.add('hidden');

    // Clean up listener controller
    if (tutorialState.currentTriggerController) {
        tutorialState.currentTriggerController.abort();
        tutorialState.currentTriggerController = null;
    }

    // Reset tutorial state
    tutorialState.isActive = false;
    tutorialState.sequence = [];
    tutorialState.currentIndex = -1;
    tutorialState.flags.clear();
    console.log("Tutorial ended.");


    // Ensure wilderness button is enabled after tutorial ends (safety check)
    const wildernessBtn = document.querySelector('button[onclick*="renderWildernessMenu"]');
    if(wildernessBtn) wildernessBtn.disabled = false;


    // If tutorial ends and player isn't in a standard view, maybe default to town?
    // Avoid redirecting if already in a valid game state like character sheet or battle.
    const nonRedirectViews = ['battle', 'character_sheet', 'character_sheet_levelup', 'post_battle'];
    if (player && !nonRedirectViews.includes(gameState.currentView)) {
        console.log("Tutorial ended, ensuring town square is rendered.");
        // renderTownSquare(); // Might cause issues if called during another render? Defer slightly.
        // requestAnimationFrame(renderTownSquare);
    }
}


// =================================================================================
// SECTION 6: COMBAT LOGIC HELPERS
// =================================================================================

/**
 * Logs a detailed breakdown of a damage calculation to the game log for debugging.
 * @param {object} calc - The calculation details object.
 * @param {string} calc.source - Origin of the damage (e.g., "Player Attack", "Goblin Attack").
 * @param {string} calc.targetName - Name of the target.
 * @param {number} calc.baseDamage - Initial damage roll total.
 * @param {Array<object>} calc.steps - Array of calculation steps { description: string, value: string, result: number|string }.
 * @param {number} calc.finalDamage - The final damage applied after defense.
 */
function logDamageCalculation({ source, targetName, baseDamage, steps = [], finalDamage }) { // Added default empty array for steps
    if (!isDebugVisible) return;

    let logMessage = `<div class="text-xs p-2 bg-slate-900/50 rounded border border-slate-700 my-1">`; // Added margin
    logMessage += `<strong class="text-yellow-300">DEBUG CALC: [${source || 'Unknown Source'}] &rarr; ${targetName || 'Unknown Target'}</strong><br>`;
    logMessage += `&nbsp;&nbsp;<strong>Base Damage:</strong> ${baseDamage !== undefined ? baseDamage : 'N/A'}<br>`; // Check if baseDamage exists

    steps.forEach(step => {
        logMessage += `&nbsp;&nbsp;<strong>${step.description || 'Step'}:</strong> ${step.value || '?'} &rarr; <span class="text-cyan-400">${step.result !== undefined ? step.result : '?'}</span><br>`; // Added checks and arrows
    });

    logMessage += `&nbsp;&nbsp;<strong>Final Applied:</strong> <strong class="text-red-400">${finalDamage !== undefined ? finalDamage : 'N/A'}</strong>`; // Check finalDamage
    logMessage += `</div>`;

    addToLog(logMessage, 'text-gray-500'); // Use a distinct color for debug logs
}


/**
 * Calculates the damage modifier based on elemental interactions.
 * Returns 2 for super effective, 0.5 for not effective, 1 for neutral.
 * @param {string} attackerElement - The element key of the attacker (e.g., 'fire').
 * @param {string} defenderElement - The element key of the defender (e.g., 'water').
 * @returns {number} The damage modifier (2, 0.5, or 1).
 */
function calculateElementalModifier(attackerElement, defenderElement) {
    // Check for invalid or non-elemental interactions first
    if (!attackerElement || attackerElement === 'none' || !defenderElement || defenderElement === 'none') {
        return 1; // Neutral modifier
    }

    // Get element data from the ELEMENTS constant
    const attackerData = ELEMENTS[attackerElement];
    const defenderData = ELEMENTS[defenderElement]; // Not strictly needed for this logic, but good practice

    // Check if data exists (handles potential typos or invalid keys)
    if (!attackerData || !defenderData) {
        console.warn(`Invalid element key provided to calculateElementalModifier: Attacker=${attackerElement}, Defender=${defenderElement}`);
        return 1; // Neutral if data is missing
    }

    // Check strength/weakness relationships
    if (attackerData.strength && attackerData.strength.includes(defenderElement)) {
        return 2; // Super effective
    }
    if (attackerData.weakness && attackerData.weakness.includes(defenderElement)) {
        return 0.5; // Not very effective
    }

    // Default to neutral if no specific interaction defined
    return 1;
}


// =================================================================================
// SECTION 7: DEBUG PANEL FUNCTIONS
// =================================================================================

function toggleDebug() {
    isDebugVisible = !isDebugVisible;
    const panel = $('#debug-panel');
    if (!panel) return; // Exit if panel doesn't exist

    panel.classList.toggle('hidden', !isDebugVisible);
    if (isDebugVisible) {
        updateDebugView(); // Populate with current data
        updateDebugAddItemOptions(); // Populate item dropdown
        populateDebugStatInputs(); // Populate stat inputs
    }
}

// Function to update the debug panel with current game state
function updateDebugView() {
    if (!isDebugVisible) return;
    const debugContentElement = $('#debug-content');
    if (!debugContentElement) return;

    // Create a simplified representation for logging
    // Avoid logging potentially huge or circular structures directly
    const snapshot = {
        player: player ? {
            name: player.name,
            level: player.level,
            hp: player.hp,
            mp: player.mp,
            stats: { V: player.vigor, F: player.focus, Sta: player.stamina, Str: player.strength, I: player.intelligence, L: player.luck },
            // Add other key player details if needed
        } : null,
        gameState: {
            currentView: gameState.currentView,
            isPlayerTurn: gameState.isPlayerTurn,
            action: gameState.action,
            // Add other key game state details
        },
        currentEnemies: Array.isArray(currentEnemies) ? currentEnemies.map(e => ({ name: e.name, hp: e.hp, status: Object.keys(e.statusEffects) })) : []
    };

    try {
        // Use JSON.stringify with a replacer to handle potential circular refs if any complex objects are added later
        debugContentElement.textContent = JSON.stringify(snapshot, null, 2); // Pretty print
    } catch (e) {
        console.error("Error stringifying debug data:", e);
        debugContentElement.textContent = "Error displaying game state.";
    }
}

// Populates the "Add Item" dropdown in the debug panel
function updateDebugAddItemOptions() {
    if (!isDebugVisible) return;
    const itemSelect = $('#debug-item-select');
    if (!itemSelect) return;

    itemSelect.innerHTML = ''; // Clear existing options

    // Define categories and their data sources
    const itemCategories = {
        'Items': ITEMS,
        'Weapons': WEAPONS,
        'Catalysts': CATALYSTS,
        'Armor': ARMOR,
        'Shields': SHIELDS,
        'Lures': LURES
        // Add Recipes? Seeds? Other categories if needed
    };

    // Iterate through categories and add items to the dropdown
    for (const categoryName in itemCategories) {
        const optgroup = document.createElement('optgroup');
        optgroup.label = categoryName;
        const sourceObject = itemCategories[categoryName];
        if (!sourceObject) continue; // Skip if source object doesn't exist

        // Sort keys alphabetically by item name for better usability
        const sortedKeys = Object.keys(sourceObject).sort((a, b) => {
            const nameA = sourceObject[a]?.name || a;
            const nameB = sourceObject[b]?.name || b;
            return nameA.localeCompare(nameB);
        });

        sortedKeys.forEach(key => {
            const item = sourceObject[key];
            // Ensure item has a name before adding
            if (item?.name) {
                const option = document.createElement('option');
                option.value = key;
                option.textContent = item.name;
                optgroup.appendChild(option);
            }
        });

        // Only add optgroup if it contains options
        if (optgroup.children.length > 0) {
            itemSelect.appendChild(optgroup);
        }
    }
}

// Adds the selected item from the debug dropdown to player inventory
function debugAddItem() {
    if (!player || !isDebugVisible) return;
    const itemSelect = $('#debug-item-select');
    if (!itemSelect) return;

    const itemKey = itemSelect.value;
    if (itemKey) {
        player.addToInventory(itemKey, 1, true); // Add one item with logging
        // No need to call updateDebugView manually, addToLog usually triggers it via render updates
        // Refresh inventory view if it's currently open
        if (gameState.currentView === 'inventory') {
            renderInventory();
        }
    } else {
        addToLog("DEBUG: No item selected to add.", 'text-gray-500');
    }
}

// Populates the stat input fields in the debug panel with current player stats
function populateDebugStatInputs() {
    if (!isDebugVisible || !player) return;

    // Helper function to safely set input value
    const setInputValue = (id, value) => {
        const input = $(`#${id}`);
        if (input) {
            // Handle potential floating point values for percentages
            if (typeof value === 'number' && !Number.isInteger(value) && (id.includes('Chance') || id.includes('Evasion'))) {
                input.value = value.toFixed(3); // Show a few decimal places
            } else {
                input.value = value !== undefined ? value : ''; // Set to empty string if undefined
            }
        } else {
             console.warn(`Debug input element not found: #${id}`);
        }
    };

    // Populate all relevant stat fields
    setInputValue('debug-level', player.level);
    setInputValue('debug-gold', player.gold);
    setInputValue('debug-xp', player.xp);
    setInputValue('debug-statPoints', player.statPoints);
    setInputValue('debug-hp', player.hp);
    setInputValue('debug-mp', player.mp);
    setInputValue('debug-xpMultiplier', player.xpMultiplier);
    setInputValue('debug-vigor', player.vigor);
    setInputValue('debug-focus', player.focus);
    setInputValue('debug-stamina', player.stamina);
    setInputValue('debug-strength', player.strength);
    setInputValue('debug-intelligence', player.intelligence);
    setInputValue('debug-luck', player.luck);
    setInputValue('debug-bonusHp', player.bonusHp);
    setInputValue('debug-bonusMp', player.bonusMp);
    setInputValue('debug-bonusPhysicalDamage', player.bonusPhysicalDamage);
    setInputValue('debug-bonusMagicalDamage', player.bonusMagicalDamage);
    setInputValue('debug-bonusPhysicalDefense', player.bonusPhysicalDefense);
    setInputValue('debug-bonusMagicalDefense', player.bonusMagicalDefense);
    setInputValue('debug-bonusCritChance', player.bonusCritChance);
    setInputValue('debug-bonusEvasion', player.bonusEvasion);
}


// Updates player stats based on values entered in the debug panel inputs
function debugUpdateVariables() {
    if (!player || !isDebugVisible) return;

    // Helper functions to safely parse input values
    const int = (id, defaultValue = 0) => parseInt($(`#${id}`)?.value) || defaultValue;
    const float = (id, defaultValue = 0.0) => parseFloat($(`#${id}`)?.value) || defaultValue;

    // Update player object properties
    player.level = Math.max(1, int('debug-level', player.level)); // Ensure level is at least 1
    player.gold = Math.max(0, int('debug-gold', player.gold)); // Ensure non-negative gold
    player.xp = Math.max(0, int('debug-xp', player.xp));
    player.statPoints = Math.max(0, int('debug-statPoints', player.statPoints));
    player.xpMultiplier = Math.max(0.1, float('debug-xpMultiplier', player.xpMultiplier)); // Minimum multiplier
    // Base stats should ideally have a minimum, e.g., 1
    player.vigor = Math.max(1, int('debug-vigor', player.vigor));
    player.focus = Math.max(1, int('debug-focus', player.focus));
    player.stamina = Math.max(1, int('debug-stamina', player.stamina));
    player.strength = Math.max(1, int('debug-strength', player.strength));
    player.intelligence = Math.max(1, int('debug-intelligence', player.intelligence));
    player.luck = Math.max(1, int('debug-luck', player.luck));
    // Bonus stats can be 0 or positive
    player.bonusHp = Math.max(0, int('debug-bonusHp', player.bonusHp));
    player.bonusMp = Math.max(0, int('debug-bonusMp', player.bonusMp));
    player.bonusPhysicalDamage = Math.max(0, int('debug-bonusPhysicalDamage', player.bonusPhysicalDamage));
    player.bonusMagicalDamage = Math.max(0, int('debug-bonusMagicalDamage', player.bonusMagicalDamage));
    player.bonusPhysicalDefense = Math.max(0, int('debug-bonusPhysicalDefense', player.bonusPhysicalDefense));
    player.bonusMagicalDefense = Math.max(0, int('debug-bonusMagicalDefense', player.bonusMagicalDefense));
    // Percentages should be clamped, e.g., 0 to 1
    player.bonusCritChance = Math.max(0, Math.min(1, float('debug-bonusCritChance', player.bonusCritChance)));
    player.bonusEvasion = Math.max(0, Math.min(1, float('debug-bonusEvasion', player.bonusEvasion)));

    // Recalculate derived stats and ensure HP/MP/XP are valid
    player.xpToNextLevel = player.calculateXpToNextLevel(); // Update XP needed for new level
    player.hp = Math.max(0, Math.min(int('debug-hp', player.hp), player.maxHp)); // Clamp current HP
    player.mp = Math.max(0, Math.min(int('debug-mp', player.mp), player.maxMp)); // Clamp current MP
    player.xp = Math.min(player.xp, player.xpToNextLevel -1); // Ensure XP doesn't exceed cap (or handle level up?)


    addToLog('DEBUG: Player stats manually updated.', 'text-gray-500');
    updateStatsView(); // Refresh the main UI display
    updateDebugView(); // Refresh the debug panel display itself
    populateDebugStatInputs(); // Re-populate inputs with potentially clamped values
}


// =================================================================================
// SECTION 8: THEMING & PALETTES
// =================================================================================

// Theme definitions (color palettes)
const PALETTES = {
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
    // Time-based palettes
    'noon': { '--bg-main': '#2aa198', '--bg-secondary': '#248d84', '--bg-log': 'rgba(36, 141, 132, 0.6)', '--bg-tooltip': '#248d84', '--border-main': '#47b5ab', '--text-main': '#fdf6e3', '--text-accent': '#facc15', '--btn-primary-bg': '#073642', '--btn-primary-bg-hover': '#586e75', '--btn-primary-border': '#93a1a1', '--btn-primary-border-hover': '#eee8d5', '--btn-primary-text': '#fdf6e3' },
    'sunset': { '--bg-main': '#d35400', '--bg-secondary': '#aa4400', '--bg-log': 'rgba(255, 240, 230, 0.3)', '--bg-tooltip': '#aa4400', '--border-main': '#f39c12', '--text-main': '#fdf6e3', '--text-accent': '#e74c3c', '--btn-primary-bg': '#8e44ad', '--btn-primary-bg-hover': '#9b59b6', '--btn-primary-border': '#6c3483', '--btn-primary-border-hover': '#8e44ad' },
    'midnight': { '--bg-main': '#0c0c1d', '--bg-secondary': '#05050f', '--bg-log': 'rgba(20, 20, 40, 0.5)', '--bg-tooltip': '#05050f', '--border-main': '#2d2d5a', '--text-main': '#bdc3c7', '--text-accent': '#1abc9c', '--btn-primary-bg': '#2d2d5a', '--btn-primary-bg-hover': '#4a4a8c', '--btn-primary-border': '#1c1c3a', '--btn-primary-border-hover': '#2d2d5a' }
};

/**
 * Applies a color theme to the game UI by setting CSS variables.
 * @param {string} [themeName='default'] The name of the theme to apply.
 */
function applyTheme(themeName = 'default') {
    const palette = PALETTES[themeName] || PALETTES['default']; // Fallback to default if theme not found

    // Define default button colors (can be overridden by specific themes)
    const defaultButtonColors = {
        '--btn-action-bg': '#dc2626', '--btn-action-bg-hover': '#ef4444', '--btn-action-border': '#991b1b', '--btn-action-border-hover': '#b91c1c',
        '--btn-magic-bg': '#9333ea', '--btn-magic-bg-hover': '#a855f7', '--btn-magic-border': '#6b21a8', '--btn-magic-border-hover': '#7e22ce',
        '--btn-item-bg': '#16a34a', '--btn-item-bg-hover': '#22c55e', '--btn-item-border': '#15803d', '--btn-item-border-hover': '#16a34a',
        '--btn-flee-bg': '#6b7280', '--btn-flee-bg-hover': '#4b5563', '--btn-flee-border': '#374151', '--btn-flee-border-hover': '#1f2937',
        // Default primary button colors are part of the 'default' palette
         '--btn-primary-bg': PALETTES['default']['--btn-primary-bg'],
         '--btn-primary-bg-hover': PALETTES['default']['--btn-primary-bg-hover'],
         '--btn-primary-border': PALETTES['default']['--btn-primary-border'],
         '--btn-primary-border-hover': PALETTES['default']['--btn-primary-border-hover']
    };

    // Merge default button colors with the selected theme's palette
    // The theme's specific colors will override the defaults if they exist
    const finalPalette = { ...defaultButtonColors, ...palette };

    // Apply the final palette to the document's root element
    const root = document.documentElement;
    for (const key in finalPalette) {
        if (finalPalette.hasOwnProperty(key)) {
            root.style.setProperty(key, finalPalette[key]);
        }
    }
     console.log(`Applied theme: ${themeName}`);
}

// Helper function to get rarity color class
function getRarityColorClass(rarity) {
    switch (rarity) {
        case 'Common': return 'text-gray-400';
        case 'Uncommon': return 'text-green-400';
        case 'Rare': return 'text-blue-400';
        case 'Epic': return 'text-purple-400';
        case 'Legendary': return 'text-orange-400';
        case 'Broken': return 'text-red-600';
        default: return 'text-gray-400';
    }
}
