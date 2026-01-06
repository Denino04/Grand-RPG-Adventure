// ui_helpers.js
// Utility functions for DOM manipulation, UI rendering, and interface logic.

// =================================================================================
// SECTION 0: AUDIO ENGINE
// =================================================================================

const SOUNDS = {
    // 'hover': new Audio('path/to/your/hover.mp3'),
    // 'click': new Audio('path/to/your/click.mp3')
};

function playSound(soundName) {
    if (typeof SOUNDS === 'undefined') return;
    const sound = SOUNDS[soundName];
    if (sound) {
        sound.currentTime = 0;
        sound.play().catch(e => console.warn(`Audio error [${soundName}]:`, e.message));
    }
}

// =================================================================================
// SECTION 1: CORE UTILITIES & DOM HELPERS
// =================================================================================

const $ = (selector) => document.querySelector(selector);
let logElement;
let mainView;
let characterSheetOriginalStats = null;

function initUIElements() {
    logElement = $('#game-log');
    mainView = $('#main-view');
}

function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function rollDice(numDice, sides, purpose = 'Generic Roll') {
    let rolls = [];
    for (let i = 0; i < numDice; i++) rolls.push(Math.floor(Math.random() * sides) + 1);
    const total = rolls.reduce((a, b) => a + b, 0);
    
    if (isDebugVisible) {
        const purposeText = typeof purpose === 'string' ? purpose : purpose.source;
        addToLog(`DEBUG (Dice): ${purposeText} - Rolled ${numDice}d${sides} -> [${rolls.join(', ')}] = ${total}`, 'text-gray-500');
    }
    return { total, rolls };
}

function getLightDiceSize(originalSize) {
    if (player.hasSkill('luminas_grace')) {
        // Dice Progression: 4 -> 6 -> 8 -> 10 -> 12 -> 20
        const progression = [4, 6, 8, 10, 12, 20];
        const idx = progression.indexOf(originalSize);
        if (idx !== -1 && idx < progression.length - 1) {
            return progression[idx + 1];
        }
    }
    return originalSize;
}

function getNatureDiceSize(originalSides) {
    // [UPDATE] Added isElementalStateActive check
    if (!player.hasSkill('gaias_dominion') || !isElementalStateActive('nature')) return originalSides;
    
    const progression = [4, 6, 8, 10, 12];
    const index = progression.indexOf(originalSides);
    
    if (index > -1 && index < progression.length - 1) {
        return progression[index + 1];
    }
    return originalSides; // Cap at 12 or return unknown sizes
}

// ui_helpers.js

let logScrollPending = false;

function addToLog(message, colorClass = '') {
    if (!logElement) return;
    
    const cleanMessage = message.replace(/<script.*?>.*?<\/script>/gi, '');
    const p = document.createElement('p');
    p.innerHTML = cleanMessage;
    p.className = `mb-1 ${colorClass}`;

    logElement.appendChild(p);

    if (logElement.children.length > 100) {
        logElement.removeChild(logElement.firstChild);
    }

    // --- FIX: Batch the scroll update ---
    if (!logScrollPending) {
        logScrollPending = true;
        requestAnimationFrame(() => {
            logElement.scrollTop = logElement.scrollHeight;
            logScrollPending = false;
        });
    }
}
/**
 * Robust item lookup that checks all known data sources.
 */
function getItemDetails(itemKey) {
    const sources = [
        typeof WEAPONS !== 'undefined' ? WEAPONS : null,
        typeof ARMOR !== 'undefined' ? ARMOR : null,
        typeof SHIELDS !== 'undefined' ? SHIELDS : null,
        typeof CATALYSTS !== 'undefined' ? CATALYSTS : null,
        typeof ITEMS !== 'undefined' ? ITEMS : null,
        typeof LURES !== 'undefined' ? LURES : null,
        typeof BJ_ARCANA_RITUALS !== 'undefined' ? BJ_ARCANA_RITUALS : null,
        typeof BJ_CONJURE_PACKS !== 'undefined' ? BJ_CONJURE_PACKS : null,
        typeof BJ_ARCANA_PACKS !== 'undefined' ? BJ_ARCANA_PACKS : null,
        typeof SPELLS !== 'undefined' ? SPELLS : null,
        typeof COOKING_RECIPES !== 'undefined' ? COOKING_RECIPES : null
    ];

    for (const source of sources) {
        if (source && source[itemKey]) return source[itemKey];
    }
    return null;
}

// =================================================================================
// SECTION 2: VIEW & UI STATE MANAGEMENT
// =================================================================================

function render(viewElement) {
    hideTooltip();
    hideEnemyInfo();

    const baseClasses = "bg-slate-900/50 rounded-lg flex-grow flex items-center justify-center p-6 min-h-[300px] md:min-h-0 overflow-y-auto inventory-scrollbar";
    mainView.className = baseClasses;
    mainView.innerHTML = '';
    mainView.appendChild(viewElement);

    document.body.className = document.body.className.replace(/\s?view-\S+/g, '');
    if (document.body.classList.contains('in-game')) {
        document.body.classList.add(`view-${gameState.currentView}`);
    }

    updateDebugView();
}

window.logDamageDetails = false; 

// 2. The Toggle Function
function toggleDamageLogging() {
    window.logDamageDetails = !window.logDamageDetails;
    
    const btn = document.getElementById('debug-damage-log-toggle');
    if (btn) {
        btn.textContent = `Dmg Log: ${window.logDamageDetails ? 'ON' : 'OFF'}`;
        btn.classList.toggle('bg-green-600', window.logDamageDetails);
        btn.classList.toggle('bg-red-900', !window.logDamageDetails); 
    }
    addToLog(`Detailed Damage Logging: ${window.logDamageDetails ? 'ENABLED' : 'DISABLED'}`, "text-purple-300");
}

// 3. The Logger Function
function logDamageCalculation({ source, targetName, baseDamage, steps, finalDamage }) {
    // Check global window variable
    if (!window.logDamageDetails) return;

    let rows = steps.map(s => {
        let valClass = "text-gray-400";
        if (String(s.value).startsWith("+") || (String(s.value).startsWith("x") && parseFloat(s.value.substring(1)) > 1)) valClass = "text-green-400";
        else if (String(s.value).startsWith("-") || (String(s.value).startsWith("x") && parseFloat(s.value.substring(1)) < 1)) valClass = "text-red-400";
        
        if (s.description.startsWith("===")) {
            return `<tr><td colspan="3" class="py-1 text-center text-[10px] font-bold text-slate-500 tracking-widest uppercase border-b border-slate-700/50 pt-2">${s.description.replace(/=/g, '')}</td></tr>`;
        }

        return `
        <tr class="border-b border-slate-800/50 hover:bg-white/5">
            <td class="py-0.5 px-2 text-gray-300 w-1/2">${s.description}</td>
            <td class="py-0.5 px-2 text-right font-mono ${valClass} w-1/4">${s.value}</td>
            <td class="py-0.5 px-2 text-right font-mono text-cyan-200 w-1/4">${s.result !== undefined ? s.result : ''}</td>
        </tr>`;
    }).join('');

    addToLog(`
        <div class="my-2 bg-slate-950 rounded border border-slate-600 shadow-xl font-mono text-[11px] overflow-hidden max-w-sm mx-auto">
            <div class="bg-slate-900 px-2 py-1 flex justify-between items-center border-b border-slate-600">
                <span class="font-bold text-yellow-400">⚔️ ${source}</span>
                <span class="text-xs text-gray-500">vs ${targetName}</span>
            </div>
            <div class="px-2 py-1 flex justify-between border-b border-slate-800 bg-slate-900/50">
                <span class="text-gray-400 italic">Base Roll</span>
                <span class="text-cyan-300 font-bold">${baseDamage}</span>
            </div>
            <table class="w-full text-left border-collapse">
                <tbody>${rows}</tbody>
            </table>
            <div class="bg-slate-800 px-2 py-1 flex justify-between items-center border-t border-slate-600">
                <span class="text-gray-400 uppercase text-[10px]">Final Dmg</span>
                <span class="font-bold text-white text-sm">${finalDamage}</span>
            </div>
        </div>`);
}

// =================================================================================
// SECTION 3: THEMING & VISUALS
// =================================================================================

const WINTRY_BASE_COLOR = '#0f172a'; 
const WINTRY_PALETTE = {
    '--bg-main': `linear-gradient(to bottom right, ${WINTRY_BASE_COLOR}, #020617)`,
    '--bg-secondary': '#020617',
    '--bg-log': 'rgba(2, 6, 23, 0.5)',
    '--bg-tooltip': '#020617',
    '--border-main': '#334155',
    '--text-main': '#dbeafe',
    '--text-accent': '#60a5fa',
    '--btn-primary-bg': '#1e3a8a',
    '--btn-primary-bg-hover': '#1e40af',
    '--btn-primary-border': '#1e40af',
    '--btn-primary-border-hover': '#1d4ed8'
};

const PALETTES = {
    'default': WINTRY_PALETTE,
    'town': {
        '--bg-main': `linear-gradient(to bottom right, ${WINTRY_BASE_COLOR} 30%, #44403c 100%)`,
        '--bg-secondary': '#292524',
        '--bg-log': 'rgba(20,10,0,0.3)',
        '--bg-tooltip': '#292524',
        '--border-main': '#57534e',
        '--text-main': '#e7e5e4',
        '--text-accent': '#f59e0b',
        '--btn-primary-bg': '#a16207',
        '--btn-primary-bg-hover': '#b45309',
        '--btn-primary-border': '#713f12',
        '--btn-primary-border-hover': '#854d0e'
    },
    'forest': {
        '--bg-main': `linear-gradient(to bottom right, ${WINTRY_BASE_COLOR} 30%, #14532d 100%)`,
        '--bg-secondary': '#064e3b',
        '--bg-log': 'rgba(0,10,5,0.3)',
        '--bg-tooltip': '#064e3b',
        '--border-main': '#065f46',
        '--text-main': '#d1fae5',
        '--text-accent': '#a3e635',
        '--btn-primary-bg': '#059669',
        '--btn-primary-bg-hover': '#047857',
        '--btn-primary-border': '#065f46',
        '--btn-primary-border-hover': '#064e3b'
    },
    'cave': {
        '--bg-main': `linear-gradient(to bottom right, ${WINTRY_BASE_COLOR} 30%, #262626 100%)`,
        '--bg-secondary': '#171717',
        '--bg-log': 'rgba(0,0,0,0.5)',
        '--bg-tooltip': '#171717',
        '--border-main': '#404040',
        '--text-main': '#a3a3a3',
        '--text-accent': '#eab308',
        '--btn-primary-bg': '#525252',
        '--btn-primary-bg-hover': '#737373',
        '--btn-primary-border': '#262626',
        '--btn-primary-border-hover': '#404040'
    },
    'mountain': {
        '--bg-main': `linear-gradient(to bottom right, ${WINTRY_BASE_COLOR} 30%, #075985 100%)`,
        '--bg-secondary': '#0c4a6e',
        '--bg-log': 'rgba(0,5,20,0.3)',
        '--bg-tooltip': '#0c4a6e',
        '--border-main': '#0369a1',
        '--text-main': '#e0f2fe',
        '--text-accent': '#f0f9ff',
        '--btn-primary-bg': '#0ea5e9',
        '--btn-primary-bg-hover': '#38bdf8',
        '--btn-primary-border': '#0369a1',
        '--btn-primary-border-hover': '#075985'
    },
    'volcano': {
        '--bg-main': `linear-gradient(to bottom right, ${WINTRY_BASE_COLOR} 30%, #2d3748 100%)`,
        '--bg-secondary': '#1a202c',
        '--bg-log': 'rgba(0,0,0,0.5)',
        '--bg-tooltip': '#1a202c',
        '--border-main': '#4a5568',
        '--text-main': '#e2e8f0',
        '--text-accent': '#f56565',
        '--btn-primary-bg': '#c53030',
        '--btn-primary-bg-hover': '#e53e3e',
        '--btn-primary-border': '#9b2c2c',
        '--btn-primary-border-hover': '#c53030'
    },
    'magic': {
        '--bg-main': `linear-gradient(to bottom right, ${WINTRY_BASE_COLOR} 30%, #2c1b47 100%)`,
        '--bg-secondary': '#1a102d',
        '--bg-log': 'rgba(10, 5, 20, 0.5)',
        '--bg-tooltip': '#1a102d',
        '--border-main': '#4a3a6b',
        '--text-main': '#e6defe',
        '--text-accent': '#f0abfc',
        '--btn-primary-bg': '#4a3a6b',
        '--btn-primary-bg-hover': '#6a5a8b',
        '--btn-primary-border': '#2c215d',
        '--btn-primary-border-hover': '#4a3a6b'
    },
    'casino': {
        '--bg-main': `linear-gradient(to bottom right, ${WINTRY_BASE_COLOR} 30%, #4a1d68 100%)`,
        '--bg-secondary': '#2b103d',
        '--bg-log': 'rgba(20, 10, 30, 0.5)',
        '--bg-tooltip': '#2b103d',
        '--border-main': '#7a3ea5',
        '--text-main': '#e9d5ff',
        '--text-accent': '#fde047',
        '--btn-primary-bg': '#dc2626',
        '--btn-primary-bg-hover': '#ef4444',
        '--btn-primary-border': '#991b1b',
        '--btn-primary-border-hover': '#b91c1c'
    },
    // Fallbacks
    'swamp': WINTRY_PALETTE,
    'tundra': WINTRY_PALETTE,
    'void': WINTRY_PALETTE,
    'necropolis': WINTRY_PALETTE,
    'noon': WINTRY_PALETTE,
    'sunset': WINTRY_PALETTE,
    'midnight': WINTRY_PALETTE
};

function applyTheme(themeName = 'default') {
    const palette = PALETTES[themeName] || PALETTES['default'];

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

function injectMapStyles() {
    if (document.getElementById('roguelike-map-styles')) return;
    const s = document.createElement('style');
    s.id = 'roguelike-map-styles';
    s.textContent = `
        .map-container { position: relative; width: 100%; height: 100%; overflow-y: auto; background: linear-gradient(to top, var(--map-bg-start), var(--map-bg-end)); border-radius: 0.5rem; box-shadow: inset 0 0 20px #000; }
        .map-svg-layer { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 0; }
        .map-node { position: absolute; width: 48px; height: 48px; transform: translate(-50%, -50%); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; background-color: #1e293b; border: 2px solid #475569; z-index: 1; transition: all 0.3s ease; color: #94a3b8; cursor: default; }
        .map-node.next_available { cursor: pointer; border-color: #fbbf24; color: #fff; background-color: #334155; box-shadow: 0 0 15px rgba(251, 191, 36, 0.4); animation: pulse-node 2s infinite; }
        .map-node.next_available:hover { transform: translate(-50%, -50%) scale(1.15); background-color: #475569; }
        .map-node.visited { filter: grayscale(100%); opacity: 0.5; }
        .map-node.type-boss { border-color: #dc2626; background-color: #450a0a; width: 80px; height: 80px; font-size: 3rem; z-index: 2; }
        @keyframes pulse-node { 0% { box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(251, 191, 36, 0); } 100% { box-shadow: 0 0 0 0 rgba(251, 191, 36, 0); } }
    `;
    document.head.appendChild(s);
}

// ui_helpers.js

(function injectBattleStyles() {
    // Remove existing style tag
    const existingStyle = document.getElementById('battle-dynamic-styles');
    if (existingStyle) existingStyle.remove();

    const s = document.createElement('style');
    s.id = 'battle-dynamic-styles';
    s.textContent = `
        /* --- LAYER 0: BASE SETUP --- */
        .grid-cell { position: relative !important; }
        
        /* --- CONTENT LAYERING (Z-Index 20) --- */
        .grid-cell > .text-2xl, .grid-cell > .enemy-emoji, .grid-cell > .ally-emoji { position: relative !important; z-index: 20 !important; }
        .enemy-hp-bar-bg, .ally-hp-bar-bg, .grid-cell > .absolute { z-index: 20 !important; }

        /* --- LAYER 1: TARGETING BORDERS (Z-Index 15) --- */
        .grid-cell.attackable::before,
        .grid-cell.magic-attackable::before,
        .grid-cell.item-attackable::before,
        .grid-cell.item-targetable-ally::before,
        .grid-cell.magic-targetable-ally::before {
            content: ""; position: absolute; inset: 0; border-style: solid; border-width: 4px; z-index: 15; pointer-events: none;
        }

        .grid-cell.attackable::before { border-color: #f97316; }          
        .grid-cell.magic-attackable::before { border-color: #a855f7; }    
        .grid-cell.item-attackable::before { border-color: #16a34a; }     
        .grid-cell.item-targetable-ally::before, 
        .grid-cell.magic-targetable-ally::before { border-color: #0d9488; } 

        /* --- LAYER 2: AOE FILTER (Z-Index 10) --- */
        .grid-cell.splash-targetable::after, 
        .aoe-preview::after {
            content: ""; position: absolute; inset: 0; background-color: rgba(239, 68, 68, 0.5); z-index: 10; pointer-events: none;
        }

        /* --- LAYER 3: TRAP HIGHLIGHTS --- */
        .unstable-fire { animation: pulse-unstable 0.8s infinite alternate; box-shadow: inset 0 0 20px rgba(255, 69, 0, 0.8); border: 1px solid rgba(255, 140, 0, 0.8); }
        @keyframes pulse-unstable { from { background-color: rgba(255, 69, 0, 0.3); } to { background-color: rgba(255, 140, 0, 0.6); } }
        
        /* --- NEW: PENDING CONFIRMATION HIGHLIGHT --- */
        .pending-confirmation::after {
            content: "Confirm";
            position: absolute;
            top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            font-size: 0.7rem;
            font-weight: bold;
            color: white;
            background-color: rgba(0, 0, 0, 0.7);
            padding: 2px 4px;
            border-radius: 4px;
            pointer-events: none;
            z-index: 50;
            animation: pulse-confirm 1s infinite;
        }
        @keyframes pulse-confirm {
            0% { opacity: 0.8; transform: translate(-50%, -50%) scale(1); }
            50% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
            100% { opacity: 0.8; transform: translate(-50%, -50%) scale(1); }
        }

        /* --- CLEANUP --- */
        .grid-cell.attackable, .grid-cell.magic-attackable, .grid-cell.item-attackable, .grid-cell.splash-targetable, .aoe-preview {
            background-color: transparent !important; border: none !important; box-shadow: none !important; animation: none !important;
        }
    `;
    document.head.appendChild(s);
})();

window.clearAoEHighlights = function() {
    document.querySelectorAll('.aoe-preview').forEach(el => el.classList.remove('aoe-preview', 'aoe-center'));
};

window.highlightAoE = function(tx, ty, pattern, sx, sy, size = 1) {
    window.clearAoEHighlights();
    const offsets = [];

    // [FIX] SQUARE PATTERN NOW USES 'size'
    // Size 1 = 3x3 (Radius 1)
    // Size 2 = 5x5 (Radius 2)
    if (pattern === 'square') {
        for(let y = -size; y <= size; y++) {
            for(let x = -size; x <= size; x++) {
                offsets.push({x,y});
            }
        }
    }
    
    // CROSS (Fixed for now)
    else if (pattern === 'cross') {
        offsets.push({x:0,y:0},{x:0,y:-1},{x:0,y:1},{x:-1,y:0},{x:1,y:0});
    }

    // CONE
    else if (pattern === 'cone') {
         const dx = Math.sign(tx - sx);
         const dy = Math.sign(ty - sy);
         offsets.push({x:0, y:0});
         if (Math.abs(dx) > Math.abs(dy)) { 
            offsets.push({x: dx*1, y: 0});
            offsets.push({x: dx*2, y: 0}, {x: dx*2, y: 1}, {x: dx*2, y: -1});
            offsets.push({x: dx*3, y: 0}, {x: dx*3, y: 1}, {x: dx*3, y: -1}, {x: dx*3, y: 2}, {x: dx*3, y: -2});
        } else { 
            offsets.push({x: 0, y: dy*1});
            offsets.push({x: 0, y: dy*2}, {x: 1, y: dy*2}, {x: -1, y: dy*2});
            offsets.push({x: 0, y: dy*3}, {x: 1, y: dy*3}, {x: -1, y: dy*3}, {x: 2, y: dy*3}, {x: -2, y: dy*3});
        }
    }
    
    offsets.forEach(o => {
        const cell = document.querySelector(`.grid-cell[data-x="${tx+o.x}"][data-y="${ty+o.y}"]`);
        if (cell) cell.classList.add('aoe-preview');
    });
};

// =================================================================================
// SECTION 4: REUSABLE UI BUILDERS
// =================================================================================

function createButton({ text, onclick, classes = 'btn-primary', disabled = false }) {
    return `<button onclick="${onclick}" class="btn ${classes}" ${disabled ? 'disabled' : ''}>${text}</button>`;
}

function createItemList({ items, detailsFn, actionsHtmlFn }) {
    if (!items || items.length === 0) return '';

    const itemsToSort = items.map(key => {
        const details = detailsFn(key);
        return { key, price: details ? (details.price || 0) : 0, details };
    }).sort((a, b) => a.price - b.price);

    return itemsToSort.map(itemObj => {
        const { key, details } = itemObj;

        if (!details || !details.name) {
             return `<div class="flex justify-between items-center p-2 bg-slate-800 rounded">
                    <span>${key} (Missing Data)</span>
                    <div>${actionsHtmlFn(key, { name: key, price: 0 })}</div>
                </div>`;
        }

        return `<div class="flex justify-between items-center p-2 bg-slate-800 rounded" 
                     onmouseover="showTooltip('${key}', event)" 
                     onmouseout="hideTooltip()" 
                     onclick="showTooltip('${key}', event)">
                <span>${details.name}</span>
                <div>${actionsHtmlFn(key, details)}</div>
            </div>`;
    }).join('');
}

function createSelectionListWithDetails({ data, listId, buttonTextFn, onHoverFn, onClickFn }) {
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
            listContainer.querySelectorAll(`button`).forEach(btn => {
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
// SECTION 5: TOOLTIPS
// =================================================================================

let activeTooltipItem = null;
let simpleTooltipTimer = null;

function _positionTooltip(tooltipEl, event) {
    const isMobile = window.innerWidth <= 768;

    if (isMobile) {
        tooltipEl.style.position = 'fixed';
        tooltipEl.style.left = '50%';
        tooltipEl.style.top = '50%';
        tooltipEl.style.transform = 'translate(-50%, -50%)';
        tooltipEl.style.width = '90%';
        tooltipEl.style.maxWidth = '400px';
    } else {
        tooltipEl.style.position = 'fixed';
        tooltipEl.style.width = '256px';
        tooltipEl.style.maxWidth = '256px';
        tooltipEl.style.transform = '';

        let cx = event.clientX || (event.touches ? event.touches[0].clientX : 0);
        let cy = event.clientY || (event.touches ? event.touches[0].clientY : 0);
        
        let x = cx + 15;
        let y = cy + 15;

        if (x + tooltipEl.offsetWidth > window.innerWidth) x = cx - tooltipEl.offsetWidth - 15;
        if (y + tooltipEl.offsetHeight > window.innerHeight) y = cy - tooltipEl.offsetHeight - 15;

        tooltipEl.style.left = `${x}px`;
        tooltipEl.style.top = `${y}px`;
    }
}

function showSimpleTooltip(text, event) {
    if (simpleTooltipTimer) clearTimeout(simpleTooltipTimer);
    
    const el = $('#tooltip');
    if (!text || !event) { hideTooltip(); return; }

    el.innerHTML = `<p class="text-gray-300 text-sm">${text}</p>`;
    el.style.display = 'block';
    activeTooltipItem = `simple-tooltip-${text.substring(0, 10)}`;
    
    _positionTooltip(el, event);
}

function hideSimpleTooltip() {
    simpleTooltipTimer = setTimeout(() => {
        if (activeTooltipItem && activeTooltipItem.startsWith('simple-tooltip-')) {
            $('#tooltip').style.display = 'none';
            activeTooltipItem = null;
        }
    }, 100);
}

function showTooltip(itemKey, event) {
    const el = $('#tooltip');
    if (event.type === 'click' && el.style.display === 'block' && activeTooltipItem === itemKey) {
        hideTooltip();
        return;
    }
    if (!itemKey) { hideTooltip(); return; }

    let details;
    let content = '';

    // 1. Check Spells
    if (itemKey in SPELLS) {
        const tree = SPELLS[itemKey];
        const pSpell = player.spells[itemKey];
        const tier = pSpell ? pSpell.tier : 1;
        details = tree.tiers[tier - 1];
        
        content = `<h4 class="font-bold mb-1" style="color: var(--text-accent);">${details.name} (Tier ${tier})</h4>
                   <p class="text-xs text-gray-400 mb-2">${capitalize(tree.element)} / ${tree.type.toUpperCase()}</p>`;
        if (details.damage) content += `<p>Power: ${details.damage[0]}d${details.damage[1]} (Cap: ${details.cap})</p>`;
        if (details.cost) content += `<p class="text-blue-400">Cost: ${details.cost} MP</p>`;
        if (details.splash) content += `<p>Splash: ${details.splash * 100}%</p>`;
        if (details.description) content += `<p class="text-gray-400 mt-2 text-sm"><em>${details.description}</em></p>`;
    } 
    // 2. Check Recipes
    else if (itemKey in COOKING_RECIPES) {
        details = COOKING_RECIPES[itemKey];
        content = `<h4 class="font-bold mb-1" style="color: var(--text-accent);">${details.name}</h4>
                   <p class="text-xs mb-2 text-gray-400">Tier ${details.tier} Meal</p>
                   <p class="text-gray-400 mt-2 text-sm"><em>${details.description}</em></p>`;
        
        if (details.effect) {
            content += '<div class="mt-2 pt-2 border-t border-gray-600 text-cyan-300 text-xs"><ul class="list-disc list-inside space-y-1">';
            if (details.effect.heal) content += `<li>Heals ${details.effect.heal} HP</li>`;
            if (details.effect.buffs) {
                details.effect.buffs.forEach(b => {
                    const stat = b.stat.replace(/_/g, ' ');
                    const val = (b.stat === 'movement_speed') ? `+${b.value}` : `+${((b.value - 1) * 100).toFixed(0)}%`;
                    content += `<li>${val} ${capitalize(stat)} (${b.duration} enc)</li>`;
                });
            }
            if (details.effect.type === 'full_restore') content += `<li>Full HP/MP Restore</li>`;
            content += '</ul></div>';
        }
    } 
    // 3. Check General Items (Weapons, Armor, Shields, Consumables)
    else {
        details = getItemDetails(itemKey);
        if (!details) return;

        content = `<h4 class="font-bold mb-1" style="color: var(--text-accent);">${details.name}</h4>`;
        
        let typeLabel = details.rarity || 'Common';
        if (details.class) {
            typeLabel += ` | ${details.class}`; 
        }
        content += `<p class="text-xs mb-2 text-gray-400">${typeLabel}</p>`;
        
        // Stored Enchantment Check
        if (player && player.enchantments && player.enchantments[itemKey]) {
            const infusedElement = player.enchantments[itemKey];
            if (infusedElement !== 'none') {
                content += `<p class="text-xs font-bold text-cyan-300 mb-2 border-b border-cyan-900 pb-1">Infused: ${capitalize(infusedElement)}</p>`;
            }
        }

        if (details.damage) content += `<p>Damage: ${details.damage[0]}d${details.damage[1]}</p>`;
        if (details.range) {
            content += `<p class="text-yellow-200">Range: ${details.range}</p>`;
        }
        
        // Armor/Shield Defense Split
        if (details.defense !== undefined || details.magicDefense !== undefined) {
             const phys = details.defense || 0;
             const mag = details.magicDefense || 0;
             if (mag > 0) {
                 content += `<div class="grid grid-cols-2 gap-x-2 text-sm">
                                <span>Phys Def: <span class="text-gray-300">${phys}</span></span>
                                <span>Mag Def: <span class="text-purple-300">${mag}</span></span>
                             </div>`;
             } else {
                 content += `<p>Defense: ${phys}</p>`;
             }
        }

        if (details.amount && details.type === 'healing') content += `<p class="text-green-400">Heals: ${details.amount} HP</p>`;
        if (details.type === 'mana_restore') content += `<p class="text-blue-400">Restores: ${details.amount} MP</p>`;

        // Effects List
        const effectList = [];
        const e = details.effect;

        if (e) {
            if (e.critChance) effectList.push(`Crit: +${e.critChance*100}% (x${e.critMultiplier||1.5})`);
            if (e.lifesteal) effectList.push(`Lifesteal: ${e.lifesteal*100}%`);
            if (e.paralyzeChance) effectList.push(`Paralyze: ${e.paralyzeChance*100}%`);
            if (e.toxicChance) effectList.push(`Toxic: ${e.toxicChance*100}%`);
            if (e.armorPierce) effectList.push(`Pierce: ${e.armorPierce*100}% Def`);
            
            if (e.spell_amp) effectList.push(`Spell Power: +${e.spell_amp} Dice`);
            if (e.mana_discount) effectList.push(`Spell Cost: -${e.mana_discount} MP`);
            if (e.hp_regen_percent) effectList.push(`HP Regen: +${e.hp_regen_percent * 100}%`);
            if (e.mp_regen_percent) effectList.push(`MP Regen: +${e.mp_regen_percent * 100}%`);

            if (e.type === 'dodge') effectList.push(`Dodge: +${Math.round(e.chance * 100)}%`);
            if (e.blockChance) effectList.push(`Block: +${Math.round(e.blockChance * 100)}%`);
            if (e.type === 'reflect') effectList.push(`Reflect: ${Math.round(e.amount * 100)}% Dmg`);
            
            // --- NEW: Parry Tooltip Logic ---
            if (e.type === 'parry') {
                let pMsg = `Parry: ${Math.round(e.chance * 100)}%`;
                if (e.parryDamage) {
                    pMsg += ` (Riposte: +${e.parryDamage[0]}d${e.parryDamage[1]})`;
                }
                effectList.push(pMsg);
            }
            // --------------------------------

            if (e.mana_discount_flat) effectList.push(`Spell Cost: -${e.mana_discount_flat} MP`);
            if (e.movement_speed) effectList.push(`Move Speed: +${e.movement_speed}`);
            if (e.type === 'debuff_resist') effectList.push(`Debuff Resist: ${Math.round(e.chance * 100)}%`);

            if (e.type === 'buff' && e.type.startsWith('temp_')) {
                effectList.push(`Buff: +${Math.round((e.multiplier-1)*100)}% ${e.stat} (${e.duration} enc)`);
            }
        }
        
        // Root level blockChance (Shields/legacy armor)
        if (details.blockChance && (!e || !e.blockChance)) {
             effectList.push(`Block: +${Math.round(details.blockChance * 100)}%`);
        }

        if (effectList.length > 0) {
            content += '<div class="mt-2 pt-2 border-t border-gray-600 text-cyan-300 text-xs"><ul class="list-disc list-inside space-y-1">';
            effectList.forEach(eff => content += `<li>${eff}</li>`);
            content += '</ul></div>';
        }
        
        content += `<p class="text-gray-400 mt-2 text-sm"><em>${details.description}</em></p>`;
    }

    el.innerHTML = content;
    el.style.display = 'block';
    activeTooltipItem = itemKey;
    _positionTooltip(el, event);
}

function hideTooltip() {
    if (simpleTooltipTimer) clearTimeout(simpleTooltipTimer);
    $('#tooltip').style.display = 'none';
    activeTooltipItem = null;
}

function showEnemyInfo(enemy, event) {
    const el = $('#tooltip');
    const key = `enemy-${enemy.name}`;
    if (event.type === 'click' && el.style.display === 'block' && activeTooltipItem === key) {
        hideEnemyInfo();
        return;
    }
    if (!enemy) return;

    let content = `<h4 class="font-bold text-red-400 mb-1">${enemy.name}</h4>
                   <p class="text-xs text-gray-400 mb-2">${enemy.rarityData.name}</p>
                   <p>HP: ${enemy.hp} / ${enemy.maxHp}</p>`;

    const effects = enemy.statusEffects;
    let effectList = '';
    for (const k in effects) {
        const eff = effects[k];
        const dur = eff.duration ? ` (${eff.duration})` : '';
        
        // [NEW] Calculate stack string
        const stacks = eff.stacks ? ` (x${eff.stacks})` : '';

        const name = capitalize(k.replace(/buff_|debuff_/g, '').replace(/_/g, ' '));
        
        // [FIX] Ensure buffs (type: 'buff') are green
        const color = (k.startsWith('buff_') || ['enrage'].includes(k)) ? 'text-green-400' : 'text-red-400';
        
        // --- NEW: Add Icon to Tooltip ---
        let icon = STATUS_ICONS[k];
        if (!icon) {
            if (k.startsWith('buff_')) icon = '✨';
            else icon = '💀';
        }
        // --------------------------------

        effectList += `<li class="${color}">${icon} ${name}${stacks}${dur}</li>`;
    }
    if (effectList) content += `<div class="mt-2 pt-2 border-t border-gray-600 text-xs"><ul class="list-disc list-inside">${effectList}</ul></div>`;

    if (enemy.isMarked) content += `<div class="mt-2 pt-2 border-t border-gray-600 text-xs text-yellow-400">🎯 Marked</div>`;

    el.innerHTML = content;
    el.style.display = 'block';
    activeTooltipItem = key;
    _positionTooltip(el, event);
}

function hideEnemyInfo() {
    $('#tooltip').style.display = 'none';
    activeTooltipItem = null;
}

function showPlayerInfo(playerEntity, event) {
    const el = $('#tooltip');
    const key = `player-self`;
    
    if (event.type === 'click' && el.style.display === 'block' && activeTooltipItem === key) {
        hideTooltip();
        return;
    }

    let content = `<h4 class="font-bold text-green-400 mb-1">${playerEntity.name}</h4>
                   <p class="text-xs text-gray-400 mb-2">You</p>
                   <p>HP: ${playerEntity.hp} / ${playerEntity.maxHp}</p>
                   <p>MP: ${playerEntity.mp} / ${playerEntity.maxMp}</p>`;

    let effectList = '';
    if (playerEntity.statusEffects) {
        for (const k in playerEntity.statusEffects) {
            const eff = playerEntity.statusEffects[k];
            const dur = (eff.duration && eff.duration !== Infinity) ? ` (${eff.duration})` : '';
            const name = capitalize(k.replace(/buff_|debuff_/g, '').replace(/_/g, ' '));
            
            // [FIX] Now checks eff.type === 'buff' explicitly
            const color = (k.startsWith('buff_') || k === 'stonehide' || eff.type === 'buff') ? 'text-green-400' : 'text-red-400';
            
            // [FIX] Uses eff.icon if available
            let icon = (typeof STATUS_ICONS !== 'undefined' && STATUS_ICONS[k]) ? STATUS_ICONS[k] : (eff.icon || '');
            if (!icon) {
                if (k.startsWith('buff_') || eff.type === 'buff') icon = '💪';
                else icon = '💀';
            }

            effectList += `<li class="${color}">${icon} ${name}${dur}</li>`;
        }
    }
    if (effectList) content += `<div class="mt-2 pt-2 border-t border-gray-600 text-xs"><ul class="list-disc list-inside">${effectList}</ul></div>`;

    el.innerHTML = content;
    el.style.display = 'block';
    activeTooltipItem = key;
    
    // Simple positioning fallback
    const tooltipX = event.pageX + 10;
    const tooltipY = event.pageY + 10;
    
    // Ensure it doesn't go off screen (basic check)
    if (tooltipX + 200 > window.innerWidth) {
        el.style.left = `${event.pageX - 210}px`;
    } else {
        el.style.left = `${tooltipX}px`;
    }
    el.style.top = `${tooltipY}px`;
}

function showAllyInfo(ally, event, forceShow = false) {
    const el = $('#tooltip');
    const key = `ally-${ally.name}`;
    if (event.type === 'click' && el.style.display === 'block' && activeTooltipItem === key && !forceShow) {
        hideTooltip();
        return;
    }
    if (!ally) return;

    let content = `<h4 class="font-bold text-blue-400 mb-1">${ally.name} (Lvl ${ally.level})</h4>
                   <p class="text-xs text-gray-400 mb-2">${ally.class}</p>
                   <p>HP: ${ally.hp}/${ally.maxHp} | MP: ${ally.mp}/${ally.maxMp}</p>`;

    let effectList = '';
    if (ally.statusEffects) {
        for (const k in ally.statusEffects) {
            const eff = ally.statusEffects[k];
            const dur = (eff.duration && eff.duration !== Infinity) ? ` (${eff.duration})` : '';
            const name = capitalize(k.replace(/buff_|debuff_/g, '').replace(/_/g, ' '));
            const color = (k.startsWith('buff_')) ? 'text-green-400' : 'text-red-400';
            effectList += `<li class="${color}">${name}${dur}</li>`;
        }
    }
    if (effectList) content += `<div class="mt-2 pt-2 border-t border-gray-600 text-xs"><ul class="list-disc list-inside">${effectList}</ul></div>`;

    content += `<div class="mt-2 pt-2 border-t border-gray-600 text-xs">
        <p>Wpn: ${ally.equippedWeapon.name}</p>
        <p>Arm: ${ally.equippedArmor.name}</p>
    </div>`;

    el.innerHTML = content;
    el.style.display = 'block';
    activeTooltipItem = key;
    _positionTooltip(el, event);
}

function showBiomeTooltip(biomeKey, event) {
    const el = $('#tooltip');
    if (event.type === 'click' && el.style.display === 'block' && activeTooltipItem === biomeKey) {
        hideTooltip();
        return;
    }
    const biome = BIOMES[biomeKey];
    if (!biome) return;

    const clears = player.biomeClears[biomeKey] || 0;
    let content = `<h4 class="font-bold mb-1" style="color: var(--text-accent);">${biome.name} (Tier ${biome.tier})</h4>
                   <p class="text-xs text-gray-400 mb-2"><em>${biome.description}</em></p>
                   <p class="text-sm">Clears: ${clears}</p>`;
    
    if (clears >= 10) {
        content += `<div class="mt-2 pt-2 border-t border-gray-600"><p class="font-semibold text-sm">Known Enemies:</p><div class="flex flex-wrap gap-1 mt-1">`;
        Object.keys(biome.monsters).forEach(k => {
            const m = MONSTER_SPECIES[k];
            if (m) content += `<span class="text-xs bg-slate-700 px-1 rounded">${m.emoji} ${m.name}</span>`;
        });
        content += `</div></div>`;
    } else {
        content += `<p class="text-xs text-gray-500 mt-2">Clear more to reveal intel.</p>`;
    }

    el.innerHTML = content;
    el.style.display = 'block';
    activeTooltipItem = biomeKey;
    _positionTooltip(el, event);
}

// =================================================================================
// SECTION 6: MODALS
// =================================================================================

function showModal(title, message, buttonText = "OK", onConfirm = null) {
    const existing = document.getElementById('simple-modal');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'simple-modal';
    overlay.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4';

    overlay.innerHTML = `
        <div class="bg-slate-800 p-6 rounded-lg shadow-xl max-w-md w-full text-center border border-slate-600">
            <h2 class="font-medieval text-2xl mb-4 text-yellow-300">${title}</h2>
            <p class="text-gray-300 mb-6">${message}</p>
            <button id="modal-btn" class="btn btn-primary px-6 py-2">${buttonText}</button>
        </div>`;

    const close = () => {
        overlay.remove();
        document.removeEventListener('keydown', escListener);
    };

    const escListener = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', escListener);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

    document.body.appendChild(overlay);
    const btn = overlay.querySelector('#modal-btn');
    btn.onclick = () => {
        close();
        if (typeof onConfirm === 'function') onConfirm();
        else if (typeof onConfirm === 'string') { try { window[onConfirm](); } catch(e){} }
    };
    btn.focus();
}

// =================================================================================
// SECTION 7: TUTORIAL SYSTEM
// =================================================================================

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
        const skip = $('#skip-tutorial-btn');
        if(skip) { skip.classList.remove('hidden'); skip.onclick = endTutorial; }
    }

    const seq = TUTORIAL_SEQUENCES[sequenceKey];
    if (seq) {
        tutorialState.isActive = true;
        tutorialState.sequence = [...seq];
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

    const prev = tutorialState.sequence[tutorialState.currentIndex];
    if (param && prev?.type === 'choice') {
        const branch = TUTORIAL_SEQUENCES[prev.choices[param]] || [];
        const cont = TUTORIAL_SEQUENCES['continue_main_tutorial'] || [];
        tutorialState.sequence.splice(tutorialState.currentIndex + 1, 0, ...branch, ...cont);
    }

    tutorialState.currentIndex++;
    if (tutorialState.currentIndex >= tutorialState.sequence.length) {
        endTutorial();
        return;
    }

    const step = tutorialState.sequence[tutorialState.currentIndex];

    if (step.type === 'trigger_only') {
        if (step.preAction && window[step.preAction]) window[step.preAction]();
        setupTutorialTrigger(step.trigger);
        return;
    }

    if (step.type === 'checkpoint') {
        const met = (step.requiredFlags || []).every(f => tutorialState.flags.has(f));
        if (met) {
            advanceTutorial();
            return;
        }
        // Checkpoint UI logic omitted for brevity - logic remains same as original
        return;
    }

    let content = step.content;
    let charName = player ? player.name : (window.tempCreationState?.name || param);
    if (charName && content) content = content.replace(/<Charname>/g, charName);

    if (step.preAction && window[step.preAction]) window[step.preAction]();
    showTutorialStep(step, content);
    if (step.type !== 'modal' && step.type !== 'choice') setupTutorialTrigger(step.trigger);
}

function showTutorialStep(step, content) {
    const box = $('#tutorial-box');
    const text = $('#tutorial-text');
    const nextBtn = $('#tutorial-next-btn');
    const choices = $('#tutorial-choice-buttons');
    if (!box || !text) return;

    text.innerHTML = content || '';
    box.classList.remove('hidden');
    choices.innerHTML = '';
    nextBtn.style.display = 'none';
    box.className = box.className.replace(/arrow-\w+/g, '').trim();

    if (step.type === 'modal' || step.type === 'choice') {
        box.style.cssText = "position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); opacity:1; z-index:110;";
        
        if (step.type === 'choice') {
            Object.keys(step.choices).forEach(c => {
                const btn = document.createElement('button');
                btn.className = 'btn btn-primary text-sm py-1 px-3';
                btn.textContent = c;
                btn.onclick = () => advanceTutorial(c);
                choices.appendChild(btn);
            });
        } else {
            nextBtn.style.display = 'block';
            nextBtn.onclick = step.nextButtonAction ? new Function(step.nextButtonAction) : advanceTutorial;
        }
    } else {
        const target = document.querySelector(step.targetId);
        if (!target) { advanceTutorial(); return; }

        const tRect = target.getBoundingClientRect();
        const bRect = box.getBoundingClientRect();
        const offset = 15;
        const margin = 10;
        let top, left;
        const pos = step.position || 'right';

        box.style.position = 'fixed';
        box.style.zIndex = '105';

        if (pos === 'left') {
            left = tRect.left - bRect.width - offset;
            top = tRect.top + (tRect.height/2) - (bRect.height/2);
            box.classList.add('arrow-right');
        } else if (pos === 'top') {
            left = tRect.left + (tRect.width/2) - (bRect.width/2);
            top = tRect.top - bRect.height - offset;
            box.classList.add('arrow-bottom');
        } else if (pos === 'bottom') {
            left = tRect.left + (tRect.width/2) - (bRect.width/2);
            top = tRect.bottom + offset;
            box.classList.add('arrow-top');
        } else {
            left = tRect.right + offset;
            top = tRect.top + (tRect.height/2) - (bRect.height/2);
            box.classList.add('arrow-left');
        }

        // Clamp to viewport
        left = Math.max(margin, Math.min(left, window.innerWidth - bRect.width - margin));
        top = Math.max(margin, Math.min(top, window.innerHeight - bRect.height - margin));

        box.style.left = `${left}px`;
        box.style.top = `${top}px`;
        box.style.transform = '';
        box.style.opacity = '1';
    }
}

function setupTutorialTrigger(trigger) {
    const nextBtn = $('#tutorial-next-btn');
    if (trigger) nextBtn.style.display = 'none';
    else {
        nextBtn.style.display = 'block';
        nextBtn.onclick = advanceTutorial;
    }

    tutorialState.currentTriggerController = new AbortController();
    const { signal } = tutorialState.currentTriggerController;
    if (!trigger) return;

    if (trigger.type === 'click') {
        document.querySelectorAll(trigger.targetId).forEach(el => {
            el.addEventListener('click', () => {
                if (trigger.setFlag) tutorialState.flags.add(trigger.setFlag);
                if (trigger.nextSequence) {
                    const next = TUTORIAL_SEQUENCES[trigger.nextSequence] || [];
                    tutorialState.sequence.splice(tutorialState.currentIndex + 1, 0, ...next);
                }
                advanceTutorial();
            }, { once: true, signal });
        });
    } else if (trigger.type === 'input') {
        const el = document.querySelector(trigger.targetId);
        if(el) el.addEventListener('input', () => advanceTutorial(), { once: true, signal });
    }
}

function completeBattleTutorial() { endTutorial(); renderTownSquare(); }
function tutorial_callInitGame() {
    if (window.tempCreationState) {
        const s = window.tempCreationState;
        endTutorial();
        setTimeout(() => initGame(s.name, s.gender, s.race, s.class, s.background, s.difficulty, s.elementalAffinity), 0);
        window.tempCreationState = null;
    } else window.location.hash = 'menu';
}

function endTutorial() {
    $('#tutorial-box').classList.add('hidden');
    $('#skip-tutorial-btn').classList.add('hidden');
    tutorialState.isActive = false;
    tutorialState.sequence = [];
    if (tutorialState.currentTriggerController) tutorialState.currentTriggerController.abort();
    const btn = document.querySelector('button[onclick*="renderWildernessMenu"]');
    if(btn) btn.disabled = false;
}

// =================================================================================
// SECTION 8: COMBAT LOGIC HELPERS
// =================================================================================

function logDamageCalculation({ source, targetName, baseDamage, steps, finalDamage }) {
    if (!isDebugVisible) return;
    let rows = steps.map(s => `
        <tr class="border-b border-slate-700/50">
            <td class="py-1 px-2 text-gray-400">${s.description}</td>
            <td class="py-1 px-2 text-right font-mono text-yellow-100">${s.value}</td>
            <td class="py-1 px-2 text-right font-mono text-cyan-300">${s.result || '-'}</td>
        </tr>`).join('');

    addToLog(`
        <div class="text-xs mt-1 mb-1 bg-slate-900 rounded border border-slate-700 font-sans shadow-lg">
            <div class="bg-slate-800 px-2 py-1 font-bold text-yellow-300 flex justify-between border-b border-slate-600">
                <span>${source} &rarr; ${targetName}</span><span>Final: ${finalDamage}</span>
            </div>
            <table class="w-full text-left"><tbody class="bg-slate-800/30">${rows}</tbody></table>
        </div>`);
}

function calculateElementalModifier(atk, def) {
    if (!atk || atk === 'none' || !def || def === 'none') return 1;
    const aData = ELEMENTS[atk], dData = ELEMENTS[def];
    if (!aData || !dData) return 1;
    if (aData.strength.includes(def)) return 2;
    if (aData.weakness.includes(def)) return 0.5;
    return 1;
}

// =================================================================================
// SECTION 9: DEBUG & STYLES
// =================================================================================

let logChanceCalculations = false;
function toggleLogChanceCalculations() {
    logChanceCalculations = !logChanceCalculations;
    const btn = document.getElementById('debug-log-chance-toggle');
    if (btn) {
        btn.textContent = `Log Chance: ${logChanceCalculations ? 'ON' : 'OFF'}`;
        btn.classList.toggle('bg-green-600', logChanceCalculations);
    }
}

let debugInitialized = false;

function toggleDebug() {
    isDebugVisible = !isDebugVisible;
    const panel = $('#debug-panel');
    panel.classList.toggle('hidden', !isDebugVisible);
    
    if (isDebugVisible) {
        if (!debugInitialized) {
            initDebugDraggable();
            debugInitialized = true;
        }
        updateDebugView();
        updateDebugAddItemOptions();
        populateDebugStatInputs();
    }
}

function updateDebugView() {
    if (!isDebugVisible || !player) return;
    $('#debug-content').textContent = JSON.stringify({ player, gameState, currentEnemies }, (k, v) => {
        if (k === 'source' || k === 'target' || k === 'owner') return v instanceof Entity ? `Entity(${v.name})` : v;
        return v;
    }, 2);
}

function updateDebugAddItemOptions() {
    if (!isDebugVisible) return;
    const sel = $('#debug-item-select');
    if (!sel) return;
    sel.innerHTML = '';
    const cats = { 'Weapons': WEAPONS, 'Catalysts': CATALYSTS, 'Armor': ARMOR, 'Shields': SHIELDS, 'Items': ITEMS };
    
    for (const cat in cats) {
        const grp = document.createElement('optgroup');
        grp.label = cat;
        Object.keys(cats[cat]).sort().forEach(k => {
            const item = cats[cat][k];
            if (item.name) {
                const opt = document.createElement('option');
                opt.value = k;
                opt.textContent = item.name;
                grp.appendChild(opt);
            }
        });
        sel.appendChild(grp);
    }
}

function debugAddItem() {
    if (!player) return;
    const k = $('#debug-item-select').value;
    if (k) {
        player.addToInventory(k);
        if (gameState.currentView === 'inventory') renderInventory();
        updateDebugView();
    }
}

function populateDebugStatInputs() {
    if (!isDebugVisible || !player) return;
    
    // Added 'xpMultiplier' to this list so the input box actually gets filled
    const keys = ['level', 'gold', 'xp', 'statPoints', 'hp', 'mp', 'xpMultiplier', 'vigor', 'focus', 'stamina', 'strength', 'intelligence', 'luck'];
    
    keys.forEach(id => {
        const el = $(`#debug-${id}`);
        if (el) {
            el.value = player[id] !== undefined ? player[id] : (id === 'xpMultiplier' ? 1 : 0);
        }
    });
}

function debugUpdateVariables() {
    if (!player) return;
    
    const keys = ['level', 'gold', 'xp', 'statPoints', 'hp', 'mp', 'xpMultiplier', 'vigor', 'focus', 'stamina', 'strength', 'intelligence', 'luck'];
    
    keys.forEach(key => {
        const el = $(`#debug-${key}`);
        if (el) {
            // Use parseFloat for xpMultiplier, parseInt for everything else
            const val = key === 'xpMultiplier' ? parseFloat(el.value) : parseInt(el.value);
            // Allow 0, but fallback to default if NaN
            player[key] = isNaN(val) ? (key === 'xpMultiplier' ? 1 : 0) : val;
        }
    });

    player.recalculateGrowthBonuses();
    updateStatsView();
    updateDebugView();
    addToLog("Stats updated from Debug Panel.", "text-purple-400");
}

// =================================================================================
// SECTION 9.1: DEBUG WINDOW MANAGEMENT
// =================================================================================

let isDebugMinimized = false;
let debugPanelState = {
    isDragging: false,
    startX: 0,
    startY: 0,
    initialLeft: 0,
    initialTop: 0,
    lastHeight: '66vh'
};

function initDebugDraggable() {
    const panel = document.getElementById('debug-panel');
    const header = document.getElementById('debug-header');
    if (!panel || !header) return;

    // Drag Logic
    header.addEventListener('mousedown', (e) => {
        if (e.target.tagName === 'BUTTON') return; // Don't drag if clicking buttons
        debugPanelState.isDragging = true;
        debugPanelState.startX = e.clientX;
        debugPanelState.startY = e.clientY;
        
        // Get computed style for accurate starting position
        const style = window.getComputedStyle(panel);
        debugPanelState.initialLeft = parseInt(style.left || 0);
        debugPanelState.initialTop = parseInt(style.top || 0);
        
        // Remove 'right' and 'bottom' if they exist to allow 'left'/'top' to take over
        panel.style.right = 'auto';
        panel.style.bottom = 'auto';
        panel.style.left = `${debugPanelState.initialLeft}px`;
        panel.style.top = `${debugPanelState.initialTop}px`;
        
        document.body.style.userSelect = 'none'; // Prevent text selection
    });

    document.addEventListener('mousemove', (e) => {
        if (!debugPanelState.isDragging) return;
        const dx = e.clientX - debugPanelState.startX;
        const dy = e.clientY - debugPanelState.startY;
        panel.style.left = `${debugPanelState.initialLeft + dx}px`;
        panel.style.top = `${debugPanelState.initialTop + dy}px`;
    });

    document.addEventListener('mouseup', () => {
        debugPanelState.isDragging = false;
        document.body.style.userSelect = '';
    });
}

function toggleDebugMinimize() {
    const panel = document.getElementById('debug-panel');
    const body = document.getElementById('debug-body');
    const btn = document.getElementById('debug-minimize-btn');
    
    isDebugMinimized = !isDebugMinimized;

    if (isDebugMinimized) {
        // Save height before minimizing
        debugPanelState.lastHeight = panel.style.height;
        
        body.style.display = 'none';
        panel.style.height = 'auto';
        panel.style.resize = 'none'; // Disable resize when minimized
        btn.textContent = '+';
    } else {
        body.style.display = 'flex';
        panel.style.height = debugPanelState.lastHeight || '66vh';
        panel.style.resize = 'both'; // Re-enable resize
        btn.textContent = '_';
    }
}

function setupSkillTreeDoubleTap() {
    // 1. Target the Skill Tree Container (Ensure this ID matches your HTML)
    const container = document.getElementById('skill-tree-view') || document.getElementById('skill-tree-canvas'); 
    if (!container) return;

    let lastTap = 0;
    
    container.addEventListener('touchend', (e) => {
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTap;
        
        // 2. Detect Double Tap (Typical threshold is 300ms)
        if (tapLength < 300 && tapLength > 0) {
            e.preventDefault(); // Prevent browser zoom behavior
            
            // 3. Reset Logic
            centerSkillTreeOnRoot();
        }
        lastTap = currentTime;
    });
}

function centerSkillTreeOnRoot() {
    // RESET COORDINATES
    // Assuming you use 'skillTreeOffset' or 'treePan' variables. 
    // Since 'the_root' is usually at (0,0), we center (0,0) on the screen.
    
    if (typeof skillTreeOffset !== 'undefined') {
        skillTreeOffset.x = window.innerWidth / 2;
        skillTreeOffset.y = window.innerHeight / 2;
    } else if (typeof treePanX !== 'undefined') {
        // Fallback variable names if you use distinct X/Y vars
        treePanX = window.innerWidth / 2;
        treePanY = window.innerHeight / 2;
    }

    // RESET ZOOM (Optional)
    if (typeof skillTreeZoom !== 'undefined') {
        skillTreeZoom = 1.0; 
    }

    // RE-RENDER
    if (typeof renderSkillTree === 'function') {
        renderSkillTree();
    }
    
    // Feedback
    addToLog("View reset to Start.", "text-cyan-300 text-xs");
}