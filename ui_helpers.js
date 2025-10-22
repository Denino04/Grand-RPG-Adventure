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
    return total;
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
    const p = document.createElement('p');
    p.innerHTML = message;
    p.className = `mb-1 ${colorClass}`;
    logElement.appendChild(p);
    // This is a neat trick to keep the log scrolled to the bottom.
    logElement.scrollTop = logElement.scrollHeight;
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
    updateDebugView();
    updatePersistentButtons();
}

/**
 * Shows or hides the persistent settings/exit buttons based on the game state.
 */
function updatePersistentButtons() {
    const persistentButtons = $('#persistent-buttons');
    if (!persistentButtons) return;
    
    // Show buttons when in-game, but not during a battle.
    const showButtons = document.body.classList.contains('in-game') && gameState.currentView !== 'battle';
    persistentButtons.classList.toggle('hidden', !showButtons);
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
        return { key, price: details ? (details.price || 0) : 0 };
    });

    itemsToSort.sort((a, b) => a.price - b.price);

    return itemsToSort.map(itemObj => {
        const key = itemObj.key;
        const details = detailsFn(key);
        if (!details) return '';
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

/**
 * Shows a detailed tooltip for an item, spell, or enemy.
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
                        const value = (buff.value - 1) * 100;
                        content += `<li>Effect: +${value.toFixed(0)}% ${capitalize(statName)} for ${buff.duration} encounters</li>`;
                    });
                    break;
                case 'heal_percent': content += `<li>Effect: Restores ${effect.heal_percent * 100}% of Max HP</li>`; break;
                case 'mana_percent': content += `<li>Effect: Restores ${effect.mana_percent * 100}% of Max MP</li>`; break;
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
            if (effect.bonus_vs_dragon) content += `<li>Deals x${effect.bonus_vs_dragon} damage to Dragons</li>`;
            if (effect.bonusVsLegendary) content += `<li>Deals x${effect.bonusVsLegendary} damage to Legendary enemies.</li>`;
            if (effect.doubleStrike) content += `<li>Double Strike: Attacks twice per action.</li>`;
            if (effect.doubleStrikeChance) content += `<li>Has a ${effect.doubleStrikeChance * 100}% chance to strike twice.</li>`;
            if (effect.revive) content += `<li>Revives you upon death (once per battle)</li>`;
            if (effect.spellFollowUp) content += `<li>Launches a phantom strike after casting a spell</li>`;
            if (effect.petrify_chance) content += `<li>On Hit: ${effect.petrify_chance * 100}% chance to Petrify</li>`;
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
            if (effect.mana_regen) content += `<li>Regen: +${effect.mana_regen} MP/turn</li>`;
            if (effect.spell_crit_chance) content += `<li>Spell Crit: ${effect.spell_crit_chance * 100}% chance, x${effect.spell_crit_multiplier || 1.5} Dmg</li>`;
            if (effect.spell_vamp) content += `<li>Spell Vamp: Killing with a spell restores ${effect.spell_vamp * 100}% of enemy's max HP and MP.</li>`;
            if (effect.spell_penetration) content += `<li>Spell Pen: Spells ignore ${effect.spell_penetration * 100}% of enemy magic resist.</li>`;
            if (effect.spell_sniper) content += `<li>Spell Sniper: Increases effective range by ${effect.spell_sniper * 100}%.</li>`;
            if (effect.overdrive) content += `<li>Overdrive: ${effect.overdrive.chance * 100}% chance to deal x${effect.overdrive.multiplier} damage, but you take damage equal to ${effect.overdrive.self_damage * 100}% of your Max HP.</li>`;
            if (effect.battlestaff) content += `<li>Battlestaff: Your melee attacks also scale with your Intelligence.</li>`;
            if (effect.spell_weaver) content += `<li>Spellweaver: ${effect.spell_weaver * 100}% chance to apply a random elemental effect.</li>`;
            if (effect.ranged_chance) content += `<li>${effect.ranged_chance * 100}% chance to evade ranged attacks</li>`;
            if (effect.hp_regen) content += `<li>Regen: +${effect.hp_regen} HP/turn</li>`;
            if (effect.parry) content += `<li>Parry Chance: ${Math.round(effect.parry * 100)}%</li>`;
            if (effect.attack_follow_up) content += `<li>Retaliates for ${effect.attack_follow_up.damage.join('-')} damage</li>`;
            if (effect.type === 'debuff_resist') content += `<li>+${effect.chance * 100}% Debuff Resistance</li>`;
            if (effect.type === 'reflect') content += `<li>Reflects ${effect.amount * 100}% of damage taken</li>`;
            if (effect.type === 'dodge') content += `<li>Dodge Chance: +${Math.round(effect.chance * 100)}%</li>`;
            if (effect.reflect_damage) content += `<li>Reflects ${effect.reflect_damage * 100}% of damage taken</li>`;
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

    let content = `<h4 class="font-bold text-red-400 mb-1">${enemy.name}</h4>`;
    content += `<p>HP: ${enemy.hp} / ${enemy.maxHp}</p>`;
    
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
    if (tutorialState.currentTriggerController) {
        tutorialState.currentTriggerController.abort();
        tutorialState.currentTriggerController = null;
    }
    
    const currentStep = tutorialState.sequence[tutorialState.currentIndex];

    if (param && currentStep?.type === 'choice') {
        const choiceBranchKey = currentStep.choices[param];
        const branchSequence = TUTORIAL_SEQUENCES[choiceBranchKey] || [];
        const continuationSequence = TUTORIAL_SEQUENCES['continue_main_tutorial'] || [];
        // Splice in the chosen branch, followed by the main continuation.
        tutorialState.sequence.splice(tutorialState.currentIndex + 1, 0, ...branchSequence, ...continuationSequence);
    }

    tutorialState.currentIndex++;
    if (tutorialState.currentIndex >= tutorialState.sequence.length) {
        endTutorial();
        return;
    }

    let step = tutorialState.sequence[tutorialState.currentIndex];

    if (step.type === 'trigger_only') {
        setupTutorialTrigger(step.trigger);
        return;
    }

    if (step.type === 'checkpoint') {
        const requiredFlags = step.requiredFlags || [];
        const hasAllFlags = requiredFlags.every(flag => tutorialState.flags.has(flag));
        
        if (hasAllFlags) {
            advanceTutorial();
            return;
        } else {
            let checkpointContent = "Time to check out the town. Visit the ";
            const remaining = [];
            if (!tutorialState.flags.has('commercial_visited')) {
                 setupTutorialTrigger({ type: 'click', targetId: 'button[onclick*="renderCommercialDistrict"]', nextSequence: 'commercial_district_tour' });
                 remaining.push('Commercial District');
            }
            if (!tutorialState.flags.has('arcane_visited')) {
                 setupTutorialTrigger({ type: 'click', targetId: 'button[onclick*="renderArcaneQuarter"]', nextSequence: 'arcane_district_tour' });
                 remaining.push('Arcane Quarter');
            }
            if (!tutorialState.flags.has('residential_visited')) {
                 setupTutorialTrigger({ type: 'click', targetId: 'button[onclick*="renderResidentialDistrict"]', nextSequence: 'residential_district_tour' });
                 remaining.push('Residential Area');
            }
            checkpointContent += remaining.join(', ') + ".";
            showTutorialStep(step, checkpointContent);
            return;
        }
    }
    
    let content = step.content;
    const charName = player ? player.name : param; 
    if (charName && content && content.includes('<Charname>')) {
        content = content.replace(/<Charname>/g, charName);
    }
    
    if (step.preAction === 'enableWilderness') {
        const wildernessBtn = document.querySelector('button[onclick*="renderWildernessMenu"]');
        if(wildernessBtn) wildernessBtn.disabled = false;
    }
    if (step.preAction === 'renderPostBattleMenu') {
        renderPostBattleMenu();
        advanceTutorial();
        return;
    }

    showTutorialStep(step, content);
}


function showTutorialStep(step, content) {
    const box = $('#tutorial-box');
    const text = $('#tutorial-text');
    const nextBtn = $('#tutorial-next-btn');
    const choiceContainer = $('#tutorial-choice-buttons');
    
    text.innerHTML = content || '';
    box.classList.remove('hidden');
    choiceContainer.innerHTML = '';
    nextBtn.style.display = 'none';
    box.className = box.className.replace(/arrow-\w+/g, '').trim();

    if (step.type === 'modal' || step.type === 'choice') {
        box.style.position = 'fixed';
        box.style.top = '50%';
        box.style.left = '50%';
        box.style.transform = 'translate(-50%, -50%)';
        box.style.opacity = '1';

        if (step.type === 'choice') {
            Object.keys(step.choices).forEach(choiceText => {
                const btn = document.createElement('button');
                btn.className = 'btn btn-primary';
                btn.textContent = choiceText;
                btn.onclick = () => advanceTutorial(choiceText);
                choiceContainer.appendChild(btn);
            });
        } else {
             nextBtn.style.display = 'block';
             nextBtn.onclick = advanceTutorial;
        }

    } else {
        const targetElement = document.querySelector(step.targetId);
        if (!targetElement) {
            console.warn(`Tutorial target element ${step.targetId} not found.`);
            advanceTutorial();
            return;
        }

        void box.offsetHeight; // Force reflow

        const targetRect = targetElement.getBoundingClientRect();
        const boxRect = box.getBoundingClientRect();
        const arrowOffset = 20;
        let top, left;
        const position = step.position || 'right';
        box.style.position = 'fixed';

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
                top = targetRect.top + targetRect.height + arrowOffset;
                box.classList.add('arrow-top');
                break;
             case 'right':
            default:
                left = targetRect.left + targetRect.width + arrowOffset;
                top = targetRect.top + (targetRect.height / 2) - (boxRect.height / 2);
                box.classList.add('arrow-left');
                break;
        }
        
        left = Math.max(10, Math.min(left, window.innerWidth - boxRect.width - 10));
        top = Math.max(10, Math.min(top, window.innerHeight - boxRect.height - 10));
        
        box.style.left = `${left}px`;
        box.style.top = `${top}px`;
        box.style.transform = '';
        box.style.opacity = '1';

        setupTutorialTrigger(step.trigger);
    }
}


function setupTutorialTrigger(trigger) {
    const nextBtn = $('#tutorial-next-btn');
    if(!trigger) {
        nextBtn.style.display = 'block';
        nextBtn.onclick = advanceTutorial;
    } else {
        nextBtn.style.display = 'none';
    }

    if (tutorialState.currentTriggerController) {
        tutorialState.currentTriggerController.abort();
    }
    tutorialState.currentTriggerController = new AbortController();
    const { signal } = tutorialState.currentTriggerController;

    if (!trigger) return;

    switch (trigger.type) {
        case 'next_button':
            break;
        case 'input':
            const inputEl = $(`#${trigger.targetId}`);
            if (inputEl) {
                const triggerAdvance = () => advanceTutorial();
                inputEl.addEventListener('input', triggerAdvance, { once: true, signal });
            }
            break;
        case 'click':
            const clickEls = document.querySelectorAll(trigger.targetId);
            if (clickEls.length > 0) {
                clickEls.forEach(el => {
                    const handler = () => {
                        if (trigger.setFlag) {
                            tutorialState.flags.add(trigger.setFlag);
                        }
                        if (trigger.nextSequence) {
                            const nextSeq = TUTORIAL_SEQUENCES[trigger.nextSequence] || [];
                            tutorialState.sequence.splice(tutorialState.currentIndex + 1, 0, ...nextSeq);
                        }
                        advanceTutorial();
                    };
                    el.addEventListener('click', handler, { once: true, signal });
                });
            }
            break;
         case 'enemy_death':
            // This custom trigger is handled in the battle logic (checkBattleStatus).
            break;
    }
}


function endTutorial() {
    $('#tutorial-box').classList.add('hidden');
    $('#skip-tutorial-btn').classList.add('hidden');
    tutorialState.isActive = false;
    tutorialState.sequence = [];
    tutorialState.currentIndex = -1;
    if (tutorialState.currentTriggerController) {
        tutorialState.currentTriggerController.abort();
    }
    const wildernessBtn = document.querySelector('button[onclick*="renderWildernessMenu"]');
    if(wildernessBtn) wildernessBtn.disabled = false;
    
    if (gameState.currentView !== 'town' && player) {
        renderTownSquare();
    }
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

function toggleDebug() {
    isDebugVisible = !isDebugVisible;
    const panel = $('#debug-panel');
    panel.classList.toggle('hidden', !isDebugVisible);
    if (isDebugVisible) {
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

    player.level = int('debug-level') || player.level;
    player.gold = int('debug-gold') || player.gold;
    player.xp = int('debug-xp') || player.xp;
    player.statPoints = int('debug-statPoints') || player.statPoints;
    player.xpMultiplier = float('debug-xpMultiplier') || 1;
    player.hp = int('debug-hp') || player.hp;
    player.mp = int('debug-mp') || player.mp;
    player.vigor = int('debug-vigor') || player.vigor;
    player.focus = int('debug-focus') || player.focus;
    player.stamina = int('debug-stamina') || player.stamina;
    player.strength = int('debug-strength') || player.strength;
    player.intelligence = int('debug-intelligence') || player.intelligence;
    player.luck = int('debug-luck') || player.luck;
    player.bonusHp = int('debug-bonusHp');
    player.bonusMp = int('debug-bonusMp');
    player.bonusPhysicalDamage = int('debug-bonusPhysicalDamage');
    player.bonusMagicalDamage = int('debug-bonusMagicalDamage');
    player.bonusPhysicalDefense = int('debug-bonusPhysicalDefense');
    player.bonusMagicalDefense = int('debug-bonusMagicalDefense');
    player.bonusCritChance = float('debug-bonusCritChance');
    player.bonusEvasion = float('debug-bonusEvasion');

    player.hp = Math.min(player.hp, player.maxHp);
    player.mp = Math.min(player.mp, player.maxMp);
    
    addToLog('DEBUG: Player stats updated.', 'text-gray-500');
    updateStatsView();
    populateDebugStatInputs();
}

// =================================================================================
// SECTION 8: THEMING & PALETTES
// =================================================================================
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
    'noon': { '--bg-main': '#2aa198', '--bg-secondary': '#248d84', '--bg-log': 'rgba(36, 141, 132, 0.6)', '--bg-tooltip': '#248d84', '--border-main': '#47b5ab', '--text-main': '#fdf6e3', '--text-accent': '#facc15', '--btn-primary-bg': '#073642', '--btn-primary-bg-hover': '#586e75', '--btn-primary-border': '#93a1a1', '--btn-primary-border-hover': '#eee8d5', '--btn-primary-text': '#fdf6e3' },
    'sunset': { '--bg-main': '#d35400', '--bg-secondary': '#aa4400', '--bg-log': 'rgba(255, 240, 230, 0.3)', '--bg-tooltip': '#aa4400', '--border-main': '#f39c12', '--text-main': '#fdf6e3', '--text-accent': '#e74c3c', '--btn-primary-bg': '#8e44ad', '--btn-primary-bg-hover': '#9b59b6', '--btn-primary-border': '#6c3483', '--btn-primary-border-hover': '#8e44ad' },
    'midnight': { '--bg-main': '#0c0c1d', '--bg-secondary': '#05050f', '--bg-log': 'rgba(20, 20, 40, 0.5)', '--bg-tooltip': '#05050f', '--border-main': '#2d2d5a', '--text-main': '#bdc3c7', '--text-accent': '#1abc9c', '--btn-primary-bg': '#2d2d5a', '--btn-primary-bg-hover': '#4a4a8c', '--btn-primary-border': '#1c1c3a', '--btn-primary-border-hover': '#2d2d5a' }
};

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


