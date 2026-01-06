let preTrainingState = null;
let isProcessingAction = false; // Flag to prevent action spamming
// --- NEW: Global Touch State ---
let isTouchDragging = false;
let dragTarget = null;
// [NEW HELPER START] Skill Requirement Logic

const CLEANSABLE_DEBUFFS = [
    'poisoned', 'burned', 'paralyzed', 'frozen', 'stunned', 
    'bleeding', 'weakened', 'blinded', 'rot', 'cursed', 'jolted' // Added 'jolted'
];

const STR_WEAPONS = ['Hand-to-Hand', 'Longsword', 'Axe', 'Hammer', 'Lance'];
const DEX_WEAPONS = ['Dagger', 'Thrusting Sword', 'Curved Sword', 'Reaper', 'Bow'];

const ARMOR_TYPE_MAP = {
    // Light
    'travelers_garb': 'Light',
    'leather_armor': 'Light',
    'padded_leather': 'Light',
    'silenced_leather_armor': 'Light',
    'assassin_cloak_armor': 'Light',
    // Heavy
    'chainmail_armor': 'Heavy',
    'half_plate_armor': 'Heavy',
    'steel_plate_armor': 'Heavy',
    'adamantine_armor': 'Heavy',
    // Magic/Robes
    'warmages_armor': 'Magic',
    'archmages_robes': 'Magic'
};

const SKILL_WEAPON_REQ = {
    // --- Hand-to-Hand (Strength) ---
    'savage_beast_claw': ['Hand-to-Hand'],
    'iron_mountain_stance': ['Hand-to-Hand'],
    'glacial_palm': ['Hand-to-Hand'],
    'avalanche_drop': ['Hand-to-Hand'],
    'serious_punch': ['Hand-to-Hand'], 
    'way_of_empty_hand': ['Hand-to-Hand'],
    'tectonic_shift': ['Hand-to-Hand'],
    'shatterpoint_impact': ['Hand-to-Hand'],
    'vacuum_fist': ['Hand-to-Hand'],
    'flowing_water': ['Hand-to-Hand'],
    'titans_grip': ['Hand-to-Hand'],
    'divine_unalloyed_soul': ['Hand-to-Hand'],

    // --- Hammer (Strength) ---
    'earthshaker': ['Hammer'], // Legacy?
    'swinging_momentum': ['Hammer'],
    'impact_tremor': ['Hammer'],
    'dwarven_battle_arts': ['Hammer'],
    'titan_swing': ['Hammer'],
    'heavy_meteoric_charge': ['Hammer'],
    'high_quality_hammer': ['Hammer'],
    'mountain_magic_arts': ['Hammer'],
    'landslide_movement_arts': ['Hammer'],
    'titans_range': ['Hammer'],
    'divine_mining_arts': ['Hammer'],
    
    // --- Scythe / Reaper (Dexterity) ---
    'deathly_flourish': ['Reaper'],
    'self_flagellation': ['Reaper'],
    'force_switch_blade': ['Reaper'],
    'deadly_dance': ['Reaper'],
    'patience_devotion': ['Reaper'],
    'seppuku': ['Reaper'],
    'culling_hook': ['Reaper'],
    'cyclone_trigger': ['Reaper'],
    'harvest_festival': ['Reaper'],
    'blood_dance': ['Reaper'],

    // --- Bow (Dexterity) ---
    'mighty_shot': ['Bow'],
    'barrage': ['Bow'],
    'spreadshot': ['Bow'],
    'hunters_mark_skill': ['Bow'],
    'single_shot': ['Bow'], 
    'longbowmans_volley': ['Bow'],
    'horde_breaker': ['Bow'],
    'shotgun_blast': ['Bow'],
    'pin_cushion': ['Bow'],
    'colossus_slayer': ['Bow'],
    'soul_barrage': ['Bow'],
    
    // --- Dagger (Dexterity) ---
    'sneak_attack': ['Dagger'],
    'daggershot_rune': ['Dagger'],
    'covet': ['Dagger'],
    'sharpened_dagger': ['Dagger'],
    'scattershot_rune': ['Dagger'],
    'trickshot_rune': ['Dagger'],
    'thiefs_gambit': ['Dagger'],
    'sneak_attack_passive': ['Dagger'],
    'bloodcarver_dagger': ['Dagger'],
    'slipshot_rune': ['Dagger'],
    
    // --- Rapier / Thrusting Sword (Dexterity) ---
    'piercing_fang': ['Thrusting Sword'],
    'rapid_strike': ['Thrusting Sword'],
    'quicksilver_reaction': ['Thrusting Sword'],
    'standing_elegance': ['Thrusting Sword'],
    'blood_tax': ['Thrusting Sword'],
    'heightened_speed': ['Thrusting Sword'],
    'royal_third_eye': ['Thrusting Sword'],
    'tripping_blow': ['Thrusting Sword'],
    'needle_shot': ['Thrusting Sword'],
    'zone_of_death': ['Thrusting Sword'],
    
    // --- Longsword (Strength) ---
    'riposte': ['Longsword'],
    'armor_cleave': ['Longsword'],
    'fools_guard': ['Longsword'],
    'quality_whetstone': ['Longsword'],
    'cleave_aura': ['Longsword'],
    'mordhau': ['Longsword'],
    'jokers_jest': ['Longsword'],
    'connivers_backslash': ['Longsword'],
    'serrated_blade': ['Longsword'],
    'heavy_guillotine': ['Longsword'],
    
    // --- Lance (Strength) ---
    'charge': ['Lance'],
    'tempest_lance': ['Lance'],
    'giant_hunt': ['Lance'],
    'phalanx_formation': ['Lance'],
    'thunderous_tempest': ['Lance'],
    'mortal_smite': ['Lance'],
    'divine_slayer': ['Lance'],
    'world_turtle_formation': ['Lance'],
    'absolute_defense': ['Lance'],
    'last_stand': ['Lance'],
    
    // --- Axe (Strength) ---
    'woodcutter': ['Axe'],
    'tomahawk_hurl': ['Axe'],
    'crimson_feast': ['Axe'],
    'scavengers_eye': ['Axe'],
    'earth_splitter': ['Axe'],
    'predators_wisdom': ['Axe'],
    'rite_old_gods': ['Axe'],
    'gore_crazed_howl': ['Axe'],
    
    // --- Curved Sword (Dexterity) ---
    'certificate_of_dance': ['Curved Sword'],
    'sword_dance': ['Curved Sword'],
    'flowing_curvature': ['Curved Sword'],
    'flash_of_flurry': ['Curved Sword'],
    'pure_elegance': ['Curved Sword'],
    'eternal_dance': ['Curved Sword'],
    'flash_point': ['Curved Sword'],
    'encompassing_destiny': ['Curved Sword'],
    'void_flurry': ['Curved Sword'],
    'waltz_of_void_and_light': ['Curved Sword'],
    
    // --- General Branch Skills ---
    'power_swing': STR_WEAPONS,
    'heavier_swing': STR_WEAPONS,
    'barbaric_swing': STR_WEAPONS,
    'barbaric_strength': STR_WEAPONS,
    'bone_shatter': STR_WEAPONS,
    'blessing_of_giants': STR_WEAPONS,
    
    'weak_point_targeting': DEX_WEAPONS,
    'antspur_piercing': DEX_WEAPONS, // Implied "Swift Weapons" from description

    // --- Magic / Elemental (Weapon Agnostic or Specific Enchants) ---
    // These generally don't require a specific weapon *class* but might require an element
    'solar_prominence': STR_WEAPONS.concat(DEX_WEAPONS),
    'blink_bolt': STR_WEAPONS.concat(DEX_WEAPONS), 
    'valkyrie_of_flame': STR_WEAPONS.concat(DEX_WEAPONS), // ADDED: Requirement
};

let longPressTimer = null;
let isLongPressing = false;
let ignoreNextClick = false;


function getEffectiveWeaponDice(weapon, player) {
    // Default to weapon values
    let count = weapon.damage[0];
    let sides = weapon.damage[1];

    const PROG_LIST = typeof DICE_PROGRESSION !== 'undefined' ? DICE_PROGRESSION : [1, 2, 4, 6, 8, 10, 12, 14, 16, 20];
    const getStepIndex = (s) => PROG_LIST.indexOf(s);
    
    let steps = 0;

    // 1. Crushing Weight (Heavy Weapons)
    const HEAVY_WEAPONS = ['Hand-to-Hand', 'Longsword', 'Axe', 'Hammer', 'Lance'];
    if (HEAVY_WEAPONS.includes(weapon.class) && player.isSkillActive('weapon_mastery_str')) {
        steps += 1;
    }

    // 2. Razor Discipline (Longswords)
    if (weapon.class === 'Longsword' && player.isSkillActive('quality_whetstone')) {
        steps += 1;
    }

    // 3. Razor's Edge (Dexterity - Swift Weapons)
    const SWIFT_WEAPONS = ['Dagger', 'Thrusting Sword', 'Curved Sword', 'Reaper', 'Bow'];
    if (SWIFT_WEAPONS.includes(weapon.class) && player.isSkillActive('weapon_mastery_dex')) {
        steps += 1;
    }

    // --- [NEW] 4. MASTERWORK HAFT (Hammers) ---
    if (weapon.class === 'Hammer' && player.isSkillActive('high_quality_hammer')) {
        steps += 1;
    }
    // -------------------------------------------

    // Apply Upgrades
    if (steps > 0) {
        let currentIndex = getStepIndex(sides);
        if (currentIndex !== -1) {
            let newIndex = Math.min(PROG_LIST.length - 1, currentIndex + steps);
            sides = PROG_LIST[newIndex];
        }
    }

    return [count, sides];
}

function getSecondaryChance(rarity) {
    switch ((rarity || 'common').toLowerCase()) {
        case 'common': return 0.10;
        case 'uncommon': return 0.15;
        case 'rare': return 0.20;
        case 'epic': return 0.25;
        case 'legendary': return 0.30;
        default: return 0.10; 
    }
}

function getLifestealPercentage(rarity) {
    switch ((rarity || 'common').toLowerCase()) {
        case 'common': return 0.05;
        case 'uncommon': return 0.10;
        case 'rare': return 0.15;
        case 'epic': return 0.20;
        case 'legendary': return 0.25;
        default: return 0.05; 
    }
}

const PURGEABLE_BUFFS = [
    'regenerating', 'hasted', 'strengthened', 'focused', 'shielded', 
    'stoneskin', 'empowered', 'invisible'
];

function getChainTarget(origin, rangeLimit, excludeEntity) {
    // FIX: Use 'currentEnemies' instead of 'gameState.enemies'
    if (typeof currentEnemies === 'undefined') return null;

    const candidates = currentEnemies.filter(e => 
        e.isAlive() && 
        e !== excludeEntity && // Compare objects directly, not IDs
        e !== origin
    );

    let closest = null;
    let minDist = 999;

    // Standard Chebyshev distance (King move) for grid
    candidates.forEach(e => {
        const dist = Math.max(Math.abs(origin.x - e.x), Math.abs(origin.y - e.y));
        
        if (dist <= rangeLimit && dist < minDist) {
            minDist = dist;
            closest = e;
        }
    });

    return closest;
}

function isSkillActive(skillId) {
    if (!player.isSkillActive(skillId)) return false;
    
    // For Toggles, check if turned on
    const skillNode = SKILL_TREE[skillId];
    if (skillNode && skillNode.type === 'toggle') {
        if (!player.skillToggles[skillNode.effect.toggle]) return false;
    }

    // Check Gear Requirements
    const reqCheck = checkSkillRequirements(skillId);
    return reqCheck.allowed;
}

function restoreDefaultAffinities() {
    // Only intervene if the Void Feedback debuff is actually active
    if (player.statusEffects.void_feedback) {
        const mem = player.statusEffects.void_feedback;
        
        // 1. Restore Armor/Shield
        if (player.equippedArmor) player.equippedArmor.element = mem.originalArmorEl;
        if (player.equippedShield) player.equippedShield.element = mem.originalShieldEl;

        // 2. Restore Weapon from Memory (Preserves Toggles/Infusions)
        // If we have a stored original element, use it. 
        // Otherwise fallback to the item's base element.
        if (mem.originalWeaponEl !== undefined) {
             player.weaponElement = mem.originalWeaponEl;
        } else {
             player.weaponElement = player.equippedWeapon.element || 'physical';
        }

        // 3. Clear the debuff
        delete player.statusEffects.void_feedback;
        
        // 4. Update UI to reflect changes immediately
        updateStatsView();
        addToLog("Void Feedback dissipated. Affinities restored.", "text-blue-300");
    }
}

function createFloatingText(gridX, gridY, text, colorClass = "text-white") {
    // 1. Find the specific cell in the DOM
    const cellIndex = gridY * gameState.gridWidth + gridX;
    const cell = document.getElementById('battle-grid').children[cellIndex];
    
    if (!cell) return;

    // 2. Create the text element
    const floatEl = document.createElement('div');
    floatEl.textContent = text;
    
    // 3. Apply styles for positioning and animation
    // We use Tailwind classes mixed with manual positioning to center it
    floatEl.className = `absolute z-50 font-bold text-sm pointer-events-none select-none ${colorClass}`;
    floatEl.style.left = '50%';
    floatEl.style.top = '50%';
    floatEl.style.transform = 'translate(-50%, -50%)';
    floatEl.style.textShadow = '1px 1px 2px black';
    
    // 4. Add keyframe animation (fade up)
    floatEl.animate([
        { transform: 'translate(-50%, -50%)', opacity: 1 },
        { transform: 'translate(-50%, -150%)', opacity: 0 }
    ], {
        duration: 1000,
        easing: 'ease-out'
    });

    // 5. Append to cell and remove after animation
    cell.style.position = 'relative'; // Ensure cell is a reference point
    cell.appendChild(floatEl);

    setTimeout(() => {
        if (cell.contains(floatEl)) {
            cell.removeChild(floatEl);
        }
    }, 1000);
}

function generateDynamicBattleLayout(isBoss = false) {
    const min = 5;
    // [MODIFIED] Max is 8 for normal fights, 10 for bosses
    const max = isBoss ? 10 : 8;
    
    let width, height;

    // 60% chance for a perfect Square, 40% for Rectangle
    // "All variation in between" is handled by the Rectangle block
    if (Math.random() < 0.60) {
        const size = Math.floor(Math.random() * (max - min + 1)) + min;
        width = size;
        height = size;
    } else {
        // Randomized Rectangular dimensions (e.g. 5x7, 6x8)
        width = Math.floor(Math.random() * (max - min + 1)) + min;
        height = Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    return {
        width: width,
        height: height,
        layout: new Array(width * height).fill(1)
    };
}

function startLongPress(x, y) {
    isLongPressing = false;
    ignoreNextClick = false;
    longPressTimer = setTimeout(() => {
        isLongPressing = true;
        previewAoE(x, y, true); // Show highlight
    }, 500); // 500ms hold to trigger
}

function endLongPress() {
    clearTimeout(longPressTimer);
    previewAoE(0, 0, false); // Clear highlight (coords don't matter when clearing)
    if (isLongPressing) {
        ignoreNextClick = true; // Prevent the subsequent 'click' event
    }
    isLongPressing = false;
}

function cancelLongPress() {
    clearTimeout(longPressTimer);
    previewAoE(0, 0, false);
    isLongPressing = false;
}

// --- AOE PREVIEW LOGIC ---
function previewAoE(tx, ty, show) {
    // 1. Clear existing previews
    document.querySelectorAll('.aoe-preview').forEach(el => el.classList.remove('aoe-preview'));
    
    if (!show) return;

    const offsets = [];
    const skillId = gameState.currentActiveSkill;

    // 2. Determine Pattern based on Action
    if (gameState.action === 'magic_cast') {
        const spell = SPELLS[gameState.spellToCast];
        if (spell && spell.type === 'aoe') {
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (dx === 0 && dy === 0) continue;
                    offsets.push({x: dx, y: dy});
                }
            }
        }
    } 
    else if (gameState.action === 'skill_target') {
        
        // --- FIRE: SOLAR PROMINENCE (Wide Swing) ---
        if (skillId === 'solar_prominence') {
            const dx = Math.sign(tx - player.x);
            const dy = Math.sign(ty - player.y);
            // Perpendicular swing
            if (Math.abs(dx) > Math.abs(dy)) { offsets.push({x:0, y:-1}, {x:0, y:1}); }
            else { offsets.push({x:-1, y:0}, {x:1, y:0}); }
        }

        else if (skillId === 'spreadshot') {
            // Only show AoE if the synergy is active
            if (player.skillToggles['barrage'] && player.isSkillActive('longbowmans_volley')) {
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        offsets.push({x: dx, y: dy});
                    }
                }
            }
        }

        else if (skillId === 'deadly_dance') {
        const hasCyclone = player.isSkillActive('cyclone_trigger') && player.skillToggles['force_switch_blade'];
        const hasBloodDance = player.isSkillActive('blood_dance') && 
                              (player.statusEffects.buff_crimson_penance || player.statusEffects.buff_sepulchral);

        // PRIORITY: Blood Dance (Verdict Shape) > Cyclone (Box) > Base (Ring)
        
        if (hasBloodDance) {
            // MODE C: Blood Dance ("Verdict" / 13-Tile Circle)
            // 1. The 3x3 Box
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    offsets.push({x: dx, y: dy});
                }
            }
            // 2. The 4 Outer Cardinals
            offsets.push(
                {x: 0, y: -2}, // Top
                {x: 0, y: 2},  // Bottom
                {x: -2, y: 0}, // Left
                {x: 2, y: 0}   // Right
            );
        }
        else if (hasCyclone) {
            // MODE B: Cyclone Trigger (3x3 Box)
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    offsets.push({x: dx, y: dy});
                }
            }
        }
        else {
            // MODE A: Base (8-Tile Ring around Player)
            if (tx === player.x && ty === player.y) {
                offsets.push({x:0, y:1}, {x:0, y:-1}, {x:1, y:0}, {x:-1, y:0}, 
                             {x:1, y:1}, {x:1, y:-1}, {x:-1, y:1}, {x:-1, y:-1});
            }
        }
    }

        // --- EARTH: EARTH SPLITTER (Cone) ---
        else if (skillId === 'earth_splitter') {
             const dx = Math.sign(tx - player.x);
             const dy = Math.sign(ty - player.y);
             
             // Base Tile (0,0)
             offsets.push({x:0, y:0});
             
             if (Math.abs(dx) > Math.abs(dy)) { 
                 // Horizontal Cone
                 offsets.push({x: dx, y: -1}, {x: dx, y: 0}, {x: dx, y: 1}); // Row 2
                 offsets.push({x: dx*2, y: -2}, {x: dx*2, y: -1}, {x: dx*2, y: 0}, {x: dx*2, y: 1}, {x: dx*2, y: 2}); // Row 3
             } else { 
                 // Vertical Cone
                 offsets.push({x: -1, y: dy}, {x: 0, y: dy}, {x: 1, y: dy});
                 offsets.push({x: -2, y: dy*2}, {x: -1, y: dy*2}, {x: 0, y: dy*2}, {x: 1, y: dy*2}, {x: 2, y: dy*2});
             }
        }

        // --- EARTH: IMPACT TREMOR / METEOR (Square) ---
        else if (skillId === 'impact_tremor' || skillId === 'heavy_meteoric_charge' || skillId === 'glacial_ordnance' || skillId === 'crucible_of_bloom') {
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    offsets.push({x: dx, y: dy});
                }
            }
            // Titan Swing Extra Range
            if (skillId !== 'glacial_ordnance' && player.isSkillActive('divine_mining_arts') && player.skillToggles['titan_swing']) {
                offsets.push({x: 0, y: -2}, {x: 0, y: 2}, {x: -2, y: 0}, {x: 2, y: 0});
            }
        }
        else if (skillId === 'gale_cannon') {
            const dx = Math.sign(tx - player.x);
            const dy = Math.sign(ty - player.y);
            // Show line up to max range (6)
            for(let i=1; i<=6; i++) {
                offsets.push({x: dx*i, y: dy*i});
            }
        }

        // --- WATER: FLASH OF FLURRY / BLOOM (Cardinal/Box) ---
        else if (skillId === 'flash_of_flurry') {
            // Default: Cardinals
            offsets.push({x:0, y:1}, {x:0, y:-1}, {x:1, y:0}, {x:-1, y:0});
            // Void Flurry: Diagonals too
            if (player.isSkillActive('void_flurry')) {
                offsets.push({x:1, y:1}, {x:1, y:-1}, {x:-1, y:1}, {x:-1, y:-1});
            }
        }

        // --- WATER: FROZEN ARMAMENT (Directional 3x2) ---
        else if (skillId === 'hoarfrost_haze' || skillId === 'miasma_of_decay') { // <--- Added here
            const dx = tx - player.x;
            const dy = ty - player.y;
            
            if (Math.abs(dx) >= Math.abs(dy)) {
                const dirX = dx >= 0 ? 1 : -1;
                offsets.push(
                    {x:0, y:0}, {x:0, y:1}, {x:0, y:-1},           
                    {x:dirX, y:0}, {x:dirX, y:1}, {x:dirX, y:-1}   
                );
            } else {
                const dirY = dy >= 0 ? 1 : -1;
                offsets.push(
                    {x:0, y:0}, {x:1, y:0}, {x:-1, y:0},           
                    {x:0, y:dirY}, {x:1, y:dirY}, {x:-1, y:dirY}   
                );
            }
        }
        
        // --- LIGHT: MICHAELLA'S VERDICT (3x3 + Cross) ---
        else if (skillId === 'michaellas_verdict') {
            // 1. The 3x3 Box
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    offsets.push({x: dx, y: dy});
                }
            }
            // 2. The Cross Extensions
            offsets.push(
                {x: 0, y: -2}, // North
                {x: 0, y: 2},  // South
                {x: -2, y: 0}, // West
                {x: 2, y: 0}   // East
            );
        }
    }

    // 3. Apply Highlights
    offsets.forEach(o => {
        const targetX = tx + o.x;
        const targetY = ty + o.y;
        const cell = document.querySelector(`.grid-cell[data-x="${targetX}"][data-y="${targetY}"]`);
        if (cell) {
            cell.classList.add('aoe-preview');
        }
    });
}

function checkSkillRequirements(skillId, entity = null) {
    // 1. Context Safety
    const target = entity || player;
    if (!target) return { allowed: false, required: "System Error: No Entity" };

    if (typeof SKILL_TREE === 'undefined') return { allowed: true };
    const skillNode = SKILL_TREE[skillId];
    if (!skillNode) return { allowed: true };

    // 2. Gear definitions
    const weapon = target.equippedWeapon;
    const armor = target.equippedArmor;
    const shield = target.equippedShield;
    const catalyst = target.equippedCatalyst;

    // --- 3. IDENTIFY SPECIAL SKILLS ---
    // Shield Arts bypass weapon requirements
    const isShieldArt = skillNode.effect && (skillNode.effect.action === 'shield_bash' || skillNode.effect.toggle === 'lockdown');
    // Aegis bypasses weapon requirements AND specific armor type requirements (just needs 'some' armor)
    const isAegis = skillNode.effect && skillNode.effect.toggle === 'mana_steel_aura';

    // --- 4. ROBUST ARMOR CLASSIFICATION ---
    let currentArmorType = 'Light';
    
    if (armor) {
        if (typeof ARMOR_TYPE_MAP !== 'undefined' && ARMOR_TYPE_MAP[armor.key]) {
            currentArmorType = ARMOR_TYPE_MAP[armor.key];
        }
        else if (armor.metallic || armor.type === 'Heavy' || armor.class === 'Heavy') {
            currentArmorType = 'Heavy';
        } 
        else if (armor.name.includes("Plate") || armor.name.includes("Mail") || armor.name.includes("Scale")) {
            currentArmorType = 'Heavy';
        }
        else if (armor.name.includes("Robe") || armor.name.includes("Hood")) {
            currentArmorType = 'Magic';
        }
        else if ((armor.magicDefense || 0) > (armor.defense || 0) * 1.5) {
            currentArmorType = 'Magic';
        }
    }

    // --- 5. BRANCH REQUIREMENTS ---
    const STR_LIST = typeof STR_WEAPONS !== 'undefined' ? STR_WEAPONS : (typeof STR_WEAPONS_ENG !== 'undefined' ? STR_WEAPONS_ENG : []);
    const DEX_LIST = typeof DEX_WEAPONS !== 'undefined' ? DEX_WEAPONS : (typeof DEX_WEAPONS_ENG !== 'undefined' ? DEX_WEAPONS_ENG : []);

    if (skillNode.branch === 'Strength') {
        // [CHANGE] Added !isAegis to the bypass condition
        if (!isShieldArt && !isAegis && (!weapon || !STR_LIST.includes(weapon.class))) {
            return { allowed: false, required: "Strength Weapon" };
        }
    }
    if (skillNode.branch === 'Dexterity') {
        // [CHANGE] Added !isAegis just in case you move the node later
        if (!isAegis && (!weapon || !DEX_LIST.includes(weapon.class))) {
            return { allowed: false, required: "Dexterity Weapon" };
        }
    }

    // --- 6. SPECIFIC WEAPON REQUIREMENT ---
    // [CHANGE] Aegis completely ignores weapon requirements
    if (skillNode.weaponReq && !isAegis) {
        if (!weapon) return { allowed: false, required: skillNode.weaponReq };

        if (skillNode.weaponReq === 'Hand-to-Hand') {
            if (weapon.class !== 'Hand-to-Hand') return { allowed: false, required: "Fists/Unarmed" };
        } else {
            if (weapon.class !== skillNode.weaponReq) {
                return { allowed: false, required: skillNode.weaponReq };
            }
        }
    }

    // --- 7. ARMOR REQUIREMENT ---
    if (skillNode.armorReq) {
        if (isAegis) {
            // Aegis Rule: Must have armor, type doesn't matter
            if (!armor || armor.name === 'naked') {
                return { allowed: false, required: "Any Armor Equipped" };
            }
            // If armor is equipped, we return true regardless of type
        } 
        else if (currentArmorType !== skillNode.armorReq) {
            return { allowed: false, required: `${skillNode.armorReq} Armor` };
        }
    }

    // --- 8. GREATSHIELD CHECK ---
    if (skillNode.effect && skillNode.effect.toggle === 'lockdown') {
        const isGreatshield = shield && (
            shield.name.includes("Greatshield") || 
            shield.name.includes("Slabshield") ||
            shield.name.includes("Wall") ||
            (shield.blockChance && shield.blockChance >= 0.20)
        );
        if (!isGreatshield) return { allowed: false, required: "Greatshield" };
    }

    // --- 9. ELEMENTAL REQUIREMENT ---
    if (skillNode.elementReq && skillNode.elementReq !== 'elemental') {
        const requiredEl = skillNode.elementReq;
        const gearElements = [];
        
        if (target.weaponElement) gearElements.push(target.weaponElement);
        if (weapon && (weapon.damageType === 'elemental' || weapon.damageType === requiredEl)) {
            gearElements.push(weapon.element || weapon.damageType); 
        }
        if (armor && target.armorElement) gearElements.push(target.armorElement);
        if (shield && target.shieldElement) gearElements.push(target.shieldElement);
        if (catalyst && catalyst.element) gearElements.push(catalyst.element);

        const hasElement = gearElements.some(el => el === requiredEl || el === 'all');
        if (!hasElement) {
            const fmtReq = requiredEl.charAt(0).toUpperCase() + requiredEl.slice(1);
            return { allowed: false, required: `${fmtReq} Element Gear` };
        }
    }

    return { allowed: true };
}

function renderUnendingFlowInput(target) {
    // 1. Calculate Max MP usable (Cap at 500 or Player MP, whichever is lower)
    const maxMp = player.mp;
    const cap = Math.min(maxMp, 500); // <--- THIS CAPS IT AT 500

    if (maxMp < 20) {
        addToLog("Not enough MP (Min 20).", "text-red-400");
        return;
    }

    // 2. Create Modal HTML
    const modalId = 'unending-flow-modal';
    const existing = document.getElementById(modalId);
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = modalId;
    overlay.className = 'fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4';
    
    // Initial hits calculation based on cap
    const initialHits = Math.floor(cap / 20);

    overlay.innerHTML = `
        <div class="bg-slate-900 border-2 border-cyan-500 rounded-lg p-6 max-w-sm w-full text-center shadow-[0_0_20px_rgba(6,182,212,0.3)]">
            <h3 class="font-medieval text-2xl text-cyan-300 mb-2 title-glow">Unending Flow</h3>
            <p class="text-gray-400 text-sm mb-6">Channel your energy into the blade.<br>(20 MP = 1 Strike)</p>
            
            <div class="mb-6">
                <input type="range" id="flow-slider" min="20" max="${cap}" step="20" value="${cap}" 
                       class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400">
                <div class="flex justify-between mt-2 font-bold">
                    <span class="text-blue-400"><span id="flow-cost">${cap}</span> MP</span>
                    <span class="text-red-400"><span id="flow-hits">${initialHits}</span> Hits</span>
                </div>
            </div>

            <div class="flex gap-4 justify-center">
                <button id="flow-cancel" class="btn btn-secondary px-4 py-2">Cancel</button>
                <button id="flow-confirm" class="btn btn-primary px-4 py-2 bg-cyan-700 hover:bg-cyan-600 border-cyan-800">Unleash</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    // 3. Bind Events
    const slider = overlay.querySelector('#flow-slider');
    const costDisplay = overlay.querySelector('#flow-cost');
    const hitsDisplay = overlay.querySelector('#flow-hits');
    const btnConfirm = overlay.querySelector('#flow-confirm');
    const btnCancel = overlay.querySelector('#flow-cancel');

    // Update display dynamically
    slider.oninput = () => {
        const val = parseInt(slider.value);
        costDisplay.textContent = val;
        hitsDisplay.textContent = Math.floor(val / 20);
    };

    btnCancel.onclick = () => {
        overlay.remove();
        isProcessingAction = false; 
    };

    btnConfirm.onclick = () => {
        const finalCost = parseInt(slider.value);
        overlay.remove();
        
        isProcessingAction = true;
        // Pass the chosen cost to the execute function
        executeActiveSkill('eternal_dance', target, finalCost); 
        
        gameState.action = null;
        gameState.currentActiveSkill = null;
    };
}

function applyPrismaticConvergence(damage, element, calcLog) {
    // 1. Safety Checks
    if (!player) return damage;
    
    // CHANGE: Use hasSkill or direct check instead of isSkillActive for Triggers
    const hasTheSkill = (typeof player.hasSkill === 'function' && player.hasSkill('elemental_ignition')) || 
                        (player.skills && player.skills['elemental_ignition']);

    if (!hasTheSkill) return damage;

    // 2. Initialize State
    if (!gameState.usedElements) gameState.usedElements = [];

    // 3. Normalize Element (Handle "Fire" vs "fire" mismatch)
    const checkElement = element ? element.toLowerCase() : 'none';
    const validElements = ['fire', 'water', 'earth', 'wind', 'lightning', 'nature', 'light', 'void', 'ice'];

    // 4. Validity Checks
    if (!validElements.includes(checkElement)) return damage; // Not an elemental attack
    if (gameState.usedElements.includes(checkElement)) return damage; // Already used this element

    // 5. Apply Bonus
    const multiplier = 1.10;
    const newDamage = Math.floor(damage * multiplier);
    
    // 6. Update State
    gameState.usedElements.push(checkElement);

    // 7. Log it
    console.log(`[Prismatic] Applied! ${damage} -> ${newDamage} (${checkElement})`);
    
    if (calcLog && calcLog.steps) {
        calcLog.steps.push({ 
            description: "Prismatic Convergence", 
            value: `x1.10 (First ${checkElement})`, 
            result: newDamage 
        });
    }
    
    addToLog(`Prismatic Convergence ignites! (${checkElement})`, "text-yellow-300 font-bold");

    return newDamage;
}

function applyElementalMastery(damage, element, calcLog) {
    if (!player) return damage;
    
    // Normalize element
    const el = element ? element.toLowerCase() : 'physical';
    
    let multiplier = 1.0;
    let skillName = "";

    // 1. Primal Elements (Fire, Water, Earth, Wind)
    if (player.isSkillActive('classical_understanding') && ['fire', 'water', 'earth', 'wind'].includes(el)) {
        multiplier = 1.10; 
        skillName = "Primal Elements";
    }
    // 2. Storm and Root (Lightning, Nature)
    else if (player.isSkillActive('natural_study') && ['lightning', 'nature'].includes(el)) {
        multiplier = 1.10; 
        skillName = "Storm and Root";
    }
    // 3. Cosmic Duality (Light, Void)
    else if (player.isSkillActive('paradox_research') && ['light', 'void'].includes(el)) {
        multiplier = 1.10; 
        skillName = "Cosmic Duality";
    }

    // Apply Logic
    if (multiplier > 1.0) {
        damage = Math.floor(damage * multiplier);
        if (calcLog && calcLog.steps) {
            calcLog.steps.push({ 
                description: skillName, 
                value: `x${multiplier.toFixed(2)}`, 
                result: damage 
            });
        }
    }
    
    return damage;
}

function triggerSudsyBurst(x, y, source) {
    if (!player.isSkillActive('saponification_cascade')) return;

    addToLog("The Hydrostatic Minefield detonates in a cascade of foam!", "text-cyan-300 font-bold");
    
    const offsets = [{x:0, y:0}, {x:0, y:1}, {x:0, y:-1}, {x:1, y:0}, {x:-1, y:0}];
    
    // Calculate Damage
    const weapon = player.equippedWeapon;
    let roll = rollDice(weapon.damage[0], weapon.damage[1], 'Bubble Burst');
    let baseDmg = roll.total;
    let totalDmg = Math.floor((baseDmg + player.physicalDamageBonus) * 0.5);

    offsets.forEach(off => {
        const tx = x + off.x;
        const ty = y + off.y;
        
        if (tx >= 0 && tx < gameState.gridWidth && ty >= 0 && ty < gameState.gridHeight) {
            // 1. Create Hazard
            const existing = gameState.gridObjects.find(o => o.x === tx && o.y === ty);
            if (!existing || (existing.type !== 'obstacle' && existing.type !== 'terrain')) {
                if (existing) {
                    const idx = gameState.gridObjects.indexOf(existing);
                    if (idx > -1) gameState.gridObjects.splice(idx, 1);
                }
                gameState.gridObjects.push({
                    type: 'hazard', subtype: 'slippery_ground', x: tx, y: ty, emoji: '💧',
                    name: 'Slippery Ground', duration: 4, source: source
                });
            }

            // 2. Deal Damage
            const enemy = currentEnemies.find(e => e.x === tx && e.y === ty && e.isAlive());
            if (enemy) {
                // [LOGGING ADDED]
                const calcLog = { source: "Bubble Burst", targetName: enemy.name, steps: [] };
                calcLog.baseDamage = baseDmg;
                calcLog.steps.push({ description: "Weapon Roll", value: roll.rolls.join('+'), result: baseDmg });
                calcLog.steps.push({ description: "Scaling (50%)", value: "x0.5", result: totalDmg });

                const res = enemy.takeDamage(totalDmg, { element: 'water' }, source);
                
                if(res.defenseSteps) calcLog.steps = calcLog.steps.concat(res.defenseSteps);
                calcLog.finalDamage = res.damageDealt;
                if(typeof logDamageCalculation === 'function') logDamageCalculation(calcLog);

                applyStatusEffect(enemy, 'saponified', { duration: 4, multiplier: 0.75, move: -1 }, "Bubble Burst");
                applyStatusEffect(enemy, 'tripped', { duration: 2 }, "Slippery Ground");
                applyStatusEffect(enemy, 'rooted', { duration: 1 }, "Slippery Ground");
            }
        }
    });
    renderBattleGrid();
}

function trySpawnDivineSeal() {
    if (player.isSkillActive('seal_of_divine_architect')) {
        // Remove existing seal at this exact spot (refresh duration)
        const existingIdx = gameState.gridObjects.findIndex(o => o.x === player.x && o.y === player.y && o.subtype === 'god_seal');
        if (existingIdx > -1) gameState.gridObjects.splice(existingIdx, 1);

        gameState.gridObjects.push({
            type: 'hazard', // Using hazard so it doesn't block movement
            subtype: 'god_seal',
            x: player.x,
            y: player.y,
            emoji: '💠', // Visual
            name: 'Divine Seal',
            duration: 4
        });
        addToLog("A Divine Seal is etched into the ground beneath you.", "text-cyan-200");
    }
}

async function processTornadoActions() {
    const tornados = gameState.gridObjects.filter(o => o.subtype === 'tornado');
    
    if (tornados.length === 0) return;

    for (const tornado of tornados) {
        // 1. Random Movement (1 Tile)
        const moves = [
            {x:0, y:1}, {x:0, y:-1}, {x:1, y:0}, {x:-1, y:0},
            {x:1, y:1}, {x:1, y:-1}, {x:-1, y:1}, {x:-1, y:-1}
        ];
        const move = moves[Math.floor(Math.random() * moves.length)];
        const nx = tornado.x + move.x;
        const ny = tornado.y + move.y;
        
        // Keep in bounds
        if (nx >= 0 && nx < gameState.gridWidth && ny >= 0 && ny < gameState.gridHeight) {
            tornado.x = nx;
            tornado.y = ny;
        }
        
        addToLog("The Maelstrom roars across the battlefield!", "text-cyan-300 font-bold");
        renderBattleGrid();
        await new Promise(r => setTimeout(r, 300)); // Visual delay

        // 2. Vacuum Effect (Pull Range 5)
        const pullRadius = 5;
        const enemiesToPull = currentEnemies.filter(e => 
            e.isAlive() && 
            (Math.abs(e.x - tornado.x) + Math.abs(e.y - tornado.y)) <= pullRadius
        );

        if (enemiesToPull.length > 0) addToLog("The vortex drags enemies inward!", "text-cyan-200 text-xs");

        for (const enemy of enemiesToPull) {
            // Determine direction towards tornado
            const dx = Math.sign(tornado.x - enemy.x);
            const dy = Math.sign(tornado.y - enemy.y);
            
            // Try to move 1 tile closer
            const tx = enemy.x + dx;
            const ty = enemy.y + dy;
            
            // Simple blockage check (ignore flying logic for forced movement usually)
            if (!isCellBlocked(tx, ty, true, false)) {
                enemy.x = tx; 
                enemy.y = ty;
            } else if (dx !== 0 && !isCellBlocked(enemy.x + dx, enemy.y, true, false)) {
                enemy.x += dx;
            } else if (dy !== 0 && !isCellBlocked(enemy.x, enemy.y + dy, true, false)) {
                enemy.y += dy;
            }
        }
        renderBattleGrid();

        // 3. Damage Application (Radius 2)
        const damageRadius = 2;
        
        // Calculate Damage: 2d10 + Amp
        const diceCount = 2 + (tornado.snapshotAmp || 0);
        const roll = rollDice(diceCount, 10, "Maelstrom");
        const baseDmg = roll.total;
        
        // Magic Scaling (Using current player stats)
        const statBonus = player.magicalDamageBonus;
        const multiplier = (1 + statBonus / 20);
        const flatBonus = Math.floor(statBonus / 5);
        const totalDmg = Math.floor(baseDmg * multiplier) + flatBonus;

        // Hit Enemies
        currentEnemies.forEach(e => {
            if (e.isAlive() && Math.abs(e.x - tornado.x) <= damageRadius && Math.abs(e.y - tornado.y) <= damageRadius) {
                 e.takeDamage(totalDmg, { element: 'wind', isMagic: true }, player);
            }
        });
        
        // Hit Player (Half Damage)
        if (Math.abs(player.x - tornado.x) <= damageRadius && Math.abs(player.y - tornado.y) <= damageRadius) {
            const selfDmg = Math.floor(totalDmg / 2);
            player.takeDamage(selfDmg, { element: 'wind', isMagic: true, attacker: player });
            addToLog(`You are buffeted by your own storm! (-${selfDmg})`, "text-orange-300");
        }
        
        // Hit Ally (Half Damage)
        if (player.npcAlly && player.npcAlly.isAlive() && !player.npcAlly.isFled) {
             if (Math.abs(player.npcAlly.x - tornado.x) <= damageRadius && Math.abs(player.npcAlly.y - tornado.y) <= damageRadius) {
                const allyDmg = Math.floor(totalDmg / 2);
                player.npcAlly.takeDamage(allyDmg, { element: 'wind', isMagic: true, attacker: player });
             }
        }
    }
    checkBattleStatus(true);
}

function updateTotemAuras(entity) {
    if (!entity || !entity.isAlive()) return;

    // Find all Totems
    const totems = gameState.gridObjects.filter(o => o.type === 'totem' && o.subtype === 'lithic_sovereign');
    
    let inRange = false;
    for (const totem of totems) {
        const dist = Math.abs(entity.x - totem.x) + Math.abs(entity.y - totem.y);
        // Radius 2 (Manhattan Distance)
        if (dist <= totem.radius) {
            inRange = true;
            break;
        }
    }

    if (inRange) {
        // Apply/Refresh Buff
        // We use Duration 2 to ensure it survives the current turn's end-decrement AND the full next turn
        entity.statusEffects.buff_lithic_aura = {
            name: "Lithic Aura",
            type: 'buff',
            duration: 2, 
            icon: '🗿',
            description: "+25% Atk/Def, +50% CC Resist"
        };
        
        // Refresh UI if it's the player
        if (entity === player) {
            updateStatsView();
        }
    } else {
        // Remove buff if moving out of range
        if (entity.statusEffects.buff_lithic_aura) {
            delete entity.statusEffects.buff_lithic_aura;
            if (entity === player) {
                addToLog("You leave the Lithic Sovereign's protection.", "text-gray-400");
                updateStatsView();
            }
        }
    }
}

function spawnJaggedEarth(x, y) {
    if (x < 0 || x >= gameState.gridWidth || y < 0 || y >= gameState.gridHeight) return;
    
    // Remove existing hazard/trap to prevent stacking (unless it's a wall)
    const existingIndex = gameState.gridObjects.findIndex(o => o.x === x && o.y === y);
    if (existingIndex > -1) {
        const obj = gameState.gridObjects[existingIndex];
        if (obj.type === 'obstacle' || obj.type === 'terrain') return;
        gameState.gridObjects.splice(existingIndex, 1);
    }

    gameState.gridObjects.push({
        type: 'hazard', 
        subtype: 'jagged_earth', 
        x: x, 
        y: y,
        emoji: '⛰️', // Variant: 🪨 or 🏔️
        name: 'Jagged Earth', 
        duration: 4, 
        moveCost: 3 
    });
}

function spawnJaggedEarthPattern(center, patternType) {
    if (!player.isSkillActive('geodesic_fracture')) return;
    
    let tiles = [];
    
    if (patternType === 'single') {
        tiles.push({x: center.x, y: center.y});
    } 
    else if (patternType === '3x3') {
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                tiles.push({x: center.x + dx, y: center.y + dy});
            }
        }
    }
    // [NEW] Ring Pattern
    else if (patternType === 'ring') {
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) continue; // Skip center
                tiles.push({x: center.x + dx, y: center.y + dy});
            }
        }
    }
    
    tiles.forEach(t => spawnJaggedEarth(t.x, t.y));
}

function applyVoltaicMomentum(damage, element, calcLog = null) {
    // Only triggers on Lightning damage if you have stacks
    if (element !== 'lightning' || !player.staticCharge || player.staticCharge <= 0) {
        return damage;
    }

    // Safety check
    if (!player.isSkillActive('voltaic_momentum')) return damage;

    const stacks = player.staticCharge;
    const multiplier = 1 + (stacks * 0.10); // 20% per stack
    const finalDamage = Math.floor(damage * multiplier);

    addToLog(`Voltaic Momentum discharges! (x${multiplier.toFixed(1)})`, "text-yellow-300 font-bold");
    
    // [NEW] Push to Calculation Log
    if (calcLog && calcLog.steps) {
        calcLog.steps.push({ 
            description: "Voltaic Momentum", 
            value: `x${multiplier.toFixed(1)} (${stacks} stacks)`, 
            result: finalDamage 
        });
    }
    
    player.staticCharge = 0; // Reset stacks
    
    return finalDamage;
}

async function applyKnockback(target, source, distance) {
    // [INJECT HERE] Immunity Check
    if (target === player && player.skillToggles['gravimetric_ascension'] && player.skillToggles['geomantic_polarity']) {
        addToLog("Geomantic Polarity anchors you immovably to the earth!", "text-orange-400 font-bold");
        return;
    }

    if (!target || !target.isAlive() || !source || distance <= 0) return;

    // 1. Determine direction (from source to target)
    let dx = target.x - source.x;
    let dy = target.y - source.y;

    // Normalize to get a primary direction (or 0 if on same tile)
    let dirX = 0;
    let dirY = 0;
    
    if (Math.abs(dx) > Math.abs(dy)) {
        dirX = dx > 0 ? 1 : -1;
    } else if (Math.abs(dy) > 0) {
        dirY = dy > 0 ? 1 : -1;
    } else {
        // Target and source are on the same tile? Pick a random direction.
        const randDir = [ {x:0, y:1}, {x:0, y:-1}, {x:1, y:0}, {x:-1, y:0} ];
        const dir = randDir[Math.floor(Math.random() * randDir.length)];
        dirX = dir.x;
        dirY = dir.y;
    }

    // 2. Find final landing spot
    let finalX = target.x;
    let finalY = target.y;
    let collisionDamage = 0;
    let hitObstacle = false;

    // Check if target can fly (applies to enemies or flying players)
    const canFly = (target === player) ? 
        (player.race === 'Pinionfolk' || player.skillToggles['gravimetric_ascension'] || player.skillToggles['take_flight']) : 
        (target.movement?.type === 'flying');

    for (let i = 0; i < distance; i++) {
        let nextX = finalX + dirX;
        let nextY = finalY + dirY;

        // Check for grid boundaries or inactive cells
        if (nextX < 0 || nextX >= gameState.gridWidth || nextY < 0 || nextY >= gameState.gridHeight || 
            !gameState.gridLayout || gameState.gridLayout[nextY * gameState.gridWidth + nextX] !== 1) {
            addToLog(`${target.name} is knocked against the edge of the arena!`);
            collisionDamage = rollDice(1, 6, 'Knockback Wall Collision').total;
            hitObstacle = true;
            break; // Stop moving
        }

        // Check for obstacles/terrain (if not flying)
        if (!canFly) {
            const gridObject = gameState.gridObjects.find(o => o.x === nextX && o.y === nextY);
            if (gridObject && (gridObject.type === 'obstacle' || gridObject.type === 'terrain')) {
                addToLog(`${target.name} slams into a ${gridObject.name || 'barrier'}!`);
                collisionDamage = rollDice(1, 6, 'Knockback Obstacle Collision').total;
                hitObstacle = true;
                if (gridObject.type === 'obstacle' && target === player) {
                     // If player hits obstacle, damage it
                     // We can't await this, so just call it
                     performAttackOnObstacle(gridObject); 
                }
                break; // Stop moving
            }
        }
        
        // Check for other entities (Player, Ally, other Enemies)
        let isBlockedByEntity = false;
        if (target !== player && (player.x === nextX && player.y === nextY)) {
             isBlockedByEntity = true;
        } else if (player.npcAlly && player.npcAlly.isAlive() && !player.npcAlly.isFled && target !== player.npcAlly && (player.npcAlly.x === nextX && player.npcAlly.y === nextY)) {
             isBlockedByEntity = true;
        } else if (currentEnemies.some(e => e.isAlive() && e !== target && (e.x === nextX && e.y === nextY))) {
             isBlockedByEntity = true;
        }

        if (isBlockedByEntity) {
             addToLog(`${target.name} is knocked into another combatant!`);
             collisionDamage = rollDice(1, 4, 'Knockback Entity Collision').total; // Less damage for hitting someone
             hitObstacle = true;
             break; // Stop moving
        }

        // Cell is clear, update final position
        finalX = nextX;
        finalY = nextY;
    }

    // 3. Animate movement
    if (finalX !== target.x || finalY !== target.y) {
        // For simplicity, just teleport them to the final spot with a delay
        target.x = finalX;
        target.y = finalY;
        renderBattleGrid(); // Re-draw the grid
        await new Promise(resolve => setTimeout(resolve, 200)); // Short pause
    }

    // 4. Apply collision damage
    if (collisionDamage > 0) {
        // Apply damage (as true damage, no element)
        // takeDamage returns an object, so we apply it and check results
        const { damageDealt } = target.takeDamage(collisionDamage, { ignore_defense: true, isMagic: false, attacker: source }); 
        addToLog(`The collision deals <span class="font-bold text-red-400">${damageDealt}</span> damage to ${target.name}!`);
        
        // Check if collision was fatal
        if (target === player && !player.isAlive()) {
             checkPlayerDeath(); // This will stop turns
        } else if (target !== player && !target.isAlive()) {
            if (!gameState.battleEnded) checkBattleStatus(true); // Check for enemy death
        }
    }
}

async function triggerSlipstreamKnockback(originX, originY) {
    // Get all 8 neighbors
    const neighbors = [
        {x:0, y:-1}, {x:1, y:-1}, {x:1, y:0}, {x:1, y:1}, 
        {x:0, y:1}, {x:-1, y:1}, {x:-1, y:0}, {x:-1, y:-1}
    ];

    let hitSomething = false;

    for (let offset of neighbors) {
        const checkX = originX + offset.x;
        const checkY = originY + offset.y;
        
        // Find enemy at this tile
        const enemy = currentEnemies.find(e => e.x === checkX && e.y === checkY && e.isAlive());
        
        if (enemy) {
            // Push them 1 tile away from the origin point
            // Harmless knockback = 0 damage, just displacement
            await applyKnockback(enemy, {x: originX, y: originY}, 1);
            hitSomething = true;
        }
    }

    if (hitSomething) {
        addToLog("Slipstream blast repels nearby enemies!", "text-cyan-300 text-xs");
        // Optional: Add a visual effect or sound here
    }
}

function applyPoisoningStack(target) {
    if (!target.isAlive()) return;

    if (!target.statusEffects.poisoning) {
        target.statusEffects.poisoning = { stacks: 0 };
    }
    
    target.statusEffects.poisoning.stacks += 1;
    
    // Check for Conversion
    if (target.statusEffects.poisoning.stacks >= 3) {
        delete target.statusEffects.poisoning;
        
        // Calculate Damage: 5% Max HP (Normal) or 1% Max HP (Boss)
        const percent = target.isBoss ? 0.01 : 0.05;
        const poisonDmg = Math.max(1, Math.floor(target.maxHp * percent));
        
        applyStatusEffect(target, 'poison', { 
            duration: 5, 
            damage: poisonDmg,
            source: player.name 
        }, "Accumulated Decay");
        
        addToLog(`${target.name} is overcome by the toxins! (True Poison)`, "text-green-500 font-bold");
    } else {
        addToLog(`${target.name}: Poisoning Stacks (${target.statusEffects.poisoning.stacks}/3)`, "text-green-200");
    }
}

function spawnThornyVine(x, y, duration = 2) {
    // Bounds check
    if (x < 0 || x >= gameState.gridWidth || y < 0 || y >= gameState.gridHeight) return;

    // Check for existing objects
    const existingObj = gameState.gridObjects.find(o => o.x === x && o.y === y);
    
    if (existingObj) {
        // Refresh duration if vine exists
        if (existingObj.subtype === 'thorny_vine') {
            existingObj.duration = duration;
        }
        return; 
    }

    // Don't spawn on allies (Safety)
    if (player.npcAlly && player.npcAlly.x === x && player.npcAlly.y === y) return;

    // [REMOVED] Enemy check allows vines to grow under them
    // if (currentEnemies.some(e => e.x === x && e.y === y)) return;

    gameState.gridObjects.push({
        type: 'hazard',
        subtype: 'thorny_vine',
        x: x,
        y: y,
        emoji: '🌿', 
        name: 'Thorny Vine',
        duration: duration, 
        moveCost: 2, 
        source: player
    });
}

async function processConduitOfStorm() {
    // 1. Stance Check
    if (!player.skillToggles['conduit_of_storm']) return;

    // 2. Cost Check
    if (player.mp < 30) {
        player.skillToggles['conduit_of_storm'] = false;
        addToLog("Conduit of the Storm flickers and dies (Insufficient MP).", "text-gray-400");
        if (typeof updateStatsView === 'function') updateStatsView();
        return;
    }
    player.mp -= 30;
    
    isProcessingAction = true;

    // 3. Define Targets
    const strikes = [{ x: player.x, y: player.y }]; 
    const neighbors = [
        { x: player.x, y: player.y - 1 }, { x: player.x, y: player.y + 1 }, 
        { x: player.x - 1, y: player.y }, { x: player.x + 1, y: player.y }, 
        { x: player.x - 1, y: player.y - 1 }, { x: player.x + 1, y: player.y - 1 }, 
        { x: player.x - 1, y: player.y + 1 }, { x: player.x + 1, y: player.y + 1 } 
    ].filter(n => n.x >= 0 && n.x < gameState.gridWidth && n.y >= 0 && n.y < gameState.gridHeight);

    for (let i = neighbors.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [neighbors[i], neighbors[j]] = [neighbors[j], neighbors[i]];
    }
    strikes.push(...neighbors.slice(0, 3));

    // 4. Visuals
    renderBattleGrid(); 
    addToLog("The air crackles with impending doom...", "text-yellow-300 italic");

    const gridContainer = document.getElementById('battle-grid');
    if (gridContainer) {
        strikes.forEach(coord => {
            const cellIndex = coord.y * gameState.gridWidth + coord.x;
            const cell = gridContainer.children[cellIndex];
            if (cell) {
                cell.style.position = 'relative'; 
                const overlay = document.createElement('div');
                overlay.innerHTML = '⚡';
                overlay.className = 'absolute inset-0 flex items-center justify-center text-3xl font-bold animate-pulse z-50';
                overlay.style.textShadow = '0 0 10px yellow';
                overlay.style.color = '#fef08a'; 
                cell.appendChild(overlay);
            }
        });
    }

    await new Promise(resolve => setTimeout(resolve, 600));

    // =========================================================================
    // 5. STANDARD MAGIC FORMULA (With Correct Amp Detection)
    // Formula: (Roll * (1 + Int/20)) + (Int/5)
    // =========================================================================

    const calcLog = { 
        source: "Conduit of the Storm", 
        targetName: "Area", 
        steps: [], 
        baseDamage: 0,
        finalDamage: 0
    };

    // A. Calculate Extra Dice (Checking BOTH dice_amp and spell_amp)
    let extraDice = 0;
    const cat = player.equippedCatalyst;
    const armor = player.equippedArmor;
    
    // Check Catalyst
    if (cat && cat.effect) {
        extraDice += (cat.effect.dice_amp || 0);  // Legacy/Skill specific
        extraDice += (cat.effect.spell_amp || 0); // Standard Magic
    }
    // Check Armor
    if (armor && armor.effect) {
        extraDice += (armor.effect.dice_amp || 0);
        extraDice += (armor.effect.spell_amp || 0);
    }

    // B. Roll Base Dice (1d8 + Amp)
    const diceCount = 1 + extraDice;
    const rollResult = rollDice(diceCount, 8, "Conduit Roll");
    const baseRollVal = rollResult.total;

    calcLog.baseDamage = baseRollVal;
    calcLog.steps.push({ 
        description: `Base Roll (${diceCount}d8)`, 
        value: rollResult.rolls.join('+'), 
        result: baseRollVal 
    });

    // C. Standard Scaling
    const magBonus = player.magicalDamageBonus || 0;

    // 1. Multiplier: (1 + Int/20)
    const scaleMult = 1 + (magBonus / 20);
    let currentDmg = Math.floor(baseRollVal * scaleMult);

    calcLog.steps.push({ 
        description: `Int Scaling (${magBonus})`, 
        value: `x${scaleMult.toFixed(2)}`, 
        result: currentDmg 
    });

    // 2. Flat Bonus: (Int/5)
    const flatBonus = Math.floor(magBonus / 5);
    currentDmg += flatBonus;

    calcLog.steps.push({ 
        description: `Flat Bonus (Int/5)`, 
        value: `+${flatBonus}`, 
        result: currentDmg 
    });

    calcLog.finalDamage = currentDmg;
    
    if (typeof logDamageCalculation === 'function') {
        logDamageCalculation(calcLog);
    }

    // 6. Apply Damage
    let hitCount = 0;
    for (const coords of strikes) {
        // A. Check Enemies
        const target = currentEnemies.find(e => e.x === coords.x && e.y === coords.y && e.isAlive());
        if (target) {
            target.takeDamage(currentDmg, { element: 'lightning', isMagic: true, attacker: player });
            hitCount++;
        }

        // B. Check Player (Self-Hit) -> FIX APPLIED HERE
        if (player.x === coords.x && player.y === coords.y) {
            // We pass 'player' as attacker so any "attacker-based" logic still has a source
            player.takeDamage(currentDmg, { element: 'lightning', isMagic: true, attacker: player });
        }
        
        // C. Check Ally (Optional: Friendly Fire logic for consistency)
        if (player.npcAlly && player.npcAlly.isAlive() && !player.npcAlly.isFled && 
            player.npcAlly.x === coords.x && player.npcAlly.y === coords.y) {
            player.npcAlly.takeDamage(currentDmg, { element: 'lightning', isMagic: true, attacker: player });
        }
    }
    if (hitCount > 0) addToLog(`The storm strikes down ${hitCount} enemies!`, "text-yellow-200 font-bold");
    else addToLog("The lightning grounds itself harmlessly.", "text-gray-500");

    if (typeof updateStatsView === 'function') updateStatsView();
    isProcessingAction = false;
}

async function triggerGrimHarvestChain(previousTarget) {
    // Safety break: if the battle ended mid-chain
    if (gameState.battleEnded) return;

    // 1. Find a valid new target
    // Criteria: Alive, Not the guy we just killed, Within Weapon Range (Default 1 for melee, 2 for Scythe/Reaper often)
    const weaponRange = 2; // Hardcoded for Reaper, or derive from player.weapon.range
    
    const candidates = currentEnemies.filter(e => 
        e.isAlive() && 
        e !== previousTarget &&
        (Math.abs(e.x - player.x) <= weaponRange && Math.abs(e.y - player.y) <= weaponRange)
    );

    if (candidates.length === 0) {
        addToLog("The harvest ends (No targets in range).", "text-gray-500 italic");
        return;
    }

    // 2. Pick the closest one (or random if tied)
    candidates.sort((a, b) => {
        const distA = Math.abs(a.x - player.x) + Math.abs(a.y - player.y);
        const distB = Math.abs(b.x - player.x) + Math.abs(b.y - player.y);
        return distA - distB;
    });
    const nextVictim = candidates[0];

    // 3. Visual Delay (Crucial so the game doesn't freeze/jump)
    await new Promise(r => setTimeout(r, 300));

    // 4. Log and Execute
    addToLog(`Grim Harvest momentum carries to ${nextVictim.name}!`, "text-cyan-300 font-bold");
    
    // Add a temporary flag so damage calculation knows this is a chain hit
    player.tempAttackMods = { 
        description: "Grim Harvest",
        multiplier: 1.0 // 100% Damage as requested
    };

    await performPlayerAttack(nextVictim);
    
    // Clean up temp mod
    delete player.tempAttackMods;

    // 5. RECURSION CHECK
    // If that victim ALSO died, the chain continues.
    if (!nextVictim.isAlive()) {
        await triggerGrimHarvestChain(nextVictim);
    } else {
        addToLog("The chain is broken (Target survived).", "text-gray-500 italic");
    }
}

function checkPortalEntry(entity) {
    // Find a portal at the entity's new location
    const portal = gameState.gridObjects.find(o => 
        o.type === 'portal' && 
        o.subtype === 'void_rift' && 
        o.x === entity.x && 
        o.y === entity.y
    );

    if (portal && portal.destination) {
        const dest = portal.destination;
        
        // Ensure destination isn't blocked by a wall/obstacle
        if (!isCellBlocked(dest.x, dest.y, true, entity.race === 'Pinionfolk')) {
            addToLog(`${entity.name} steps into the rift...`, "text-purple-400");
            
            // Perform Teleport
            entity.x = dest.x;
            entity.y = dest.y;
            
            addToLog(`...and reappears instantly!`, "text-purple-300 font-bold");
            playSound('magic_teleport'); // Optional sound
            
            // Visual update
            if (gameState.currentView === 'battle') renderBattleGrid();
            
            return true; // Return true to indicate teleport occurred
        } else {
            addToLog("The destination is blocked!", "text-gray-400");
        }
    }
    return false;
}

function updateRiftMechanics() {
    // Iterate backwards so we can remove objects safely
    for (let i = gameState.gridObjects.length - 1; i >= 0; i--) {
        const obj = gameState.gridObjects[i];
        
        if (obj.type === 'portal' && obj.subtype === 'void_rift') {
            // Decrement Duration is usually handled globally, but if you do it specifically:
            // obj.duration--; 

            if (obj.duration <= 0) {
                // CLOSURE EVENT: Deal Damage
                // Check for Player
                if (player.x === obj.x && player.y === obj.y) {
                    const dmg = Math.floor(player.maxHp * 0.25);
                    player.hp -= dmg;
                    addToLog(`The Rift snaps shut on you! Took ${dmg} Void Damage.`, "text-red-500 font-bold");
                    createFloatingText(player.x, player.y, `-${dmg}`, "red");
                }
                
                // Check for Enemies
                currentEnemies.forEach(enemy => {
                    if (enemy.isAlive() && enemy.x === obj.x && enemy.y === obj.y) {
                        const dmg = Math.floor(enemy.maxHp * 0.25);
                        enemy.takeDamage(dmg);
                        addToLog(`The Rift snaps shut on ${enemy.name}!`, "text-purple-400");
                    }
                });

                // Remove the portal
                gameState.gridObjects.splice(i, 1);
            }
        }
    }
}

async function performOpportunityAttack(target, multiplier = 1.0) {
    if (!target || !target.isAlive()) return;

    addToLog(`${player.name} seizes the moment! (Opportunity Attack)`, "text-yellow-300 font-bold");

    player.tempAttackMods = { multiplier: multiplier };
    await performPlayerAttack(target);
    delete player.tempAttackMods;
}

async function checkLanceOpportunityAttack(enemy, prevX, prevY, nextX, nextY) {
    try {
        // Safety Checks: If player or inventory isn't ready, let enemy move.
        if (!player || !player.skillToggles) return false;

        // 1. Check Toggles
        const bastion = player.skillToggles['phalanx_formation'];
        const turtle = player.skillToggles['world_turtle_formation'];

        // If no defensive stance is active, STOP HERE.
        if (!bastion && !turtle) return false;

        // 2. Check Weapon (Safety: Handle case where weapon is null)
        if (!player.equippedWeapon || player.equippedWeapon.class !== 'Lance') return false;

        // 3. Calculate Range
        let weaponRange = player.equippedWeapon.range || 1;
        if (player.race === 'Pinionfolk' && player.level >= 20) weaponRange += 2;
        if (player.statusEffects && player.statusEffects.bonus_range) weaponRange += player.statusEffects.bonus_range.range;
        if (player.isSkillActive('titans_range') && player.equippedWeapon.class === 'Hammer') weaponRange += 1;

        // 4. Calculate Distances
        const distOld = Math.abs(player.x - prevX) + Math.abs(player.y - prevY);
        const distNew = Math.abs(player.x - nextX) + Math.abs(player.y - nextY);

        let triggered = false;

        // --- CASE A: Aspidochelone Stance ---
        if (turtle && distNew <= weaponRange) {
            if (player.mp >= 15) {
                player.mp -= 15;
                addToLog("Aspidochelone Stance active!", "text-teal-300");
                await performOpportunityAttack(enemy, 1.0); 
                triggered = true;
            }
        } 
        // --- CASE B: Iron Bastion ---
        else if (bastion && distOld > weaponRange && distNew <= weaponRange) {
            addToLog("Iron Bastion impales the approaching foe!", "text-yellow-300");
            await performOpportunityAttack(enemy, 0.5); 
            triggered = true;
        }

        if (triggered) {
            if (typeof updateStatsView === 'function') updateStatsView();
            // --- CHANGE START ---
            // Previously: return true; (Stopped movement)
            // Now: return false; (Allows movement to continue after the stab)
            return false; 
            // --- CHANGE END ---
        }
    } catch (err) {
        console.error("AI Movement Safety Fallback:", err);
        return false; 
    }
    return false;
}

async function processInsatiableVoidStart() {
    if (!player.skillToggles['insatiable_void']) return;

    // 1. Cost Check
    if (player.mp < 30) {
        player.skillToggles['insatiable_void'] = false;
        addToLog("The singularity collapses (Insufficient MP).", "text-gray-400");
        if (typeof updateStatsView === 'function') updateStatsView();
        return;
    }
    player.mp -= 30;

    // 2. Visual & Buff Application
    addToLog("The Insatiable Void drags everything closer...", "text-purple-400 font-bold title-glow");
    
    // Check Synergy with Entropy Edge
    let description = "+30% Lifesteal.";
    let shredVal = 0;
    
    if (player.skillToggles['entropy_edge']) {
        shredVal = 0.10; // 10% Void Shred
        description += " +10% Void Shred.";
    }

    // Apply the buff for the turn
    applyStatusEffect(player, 'buff_insatiable_void', {
        name: "Insatiable Void",
        type: 'buff',
        duration: 2, // Lasts until next turn start
        icon: '⚫',
        description: description,
        lifesteal: 0.30,
        voidShred: shredVal
    });

    // 3. Pull Logic (Radius 2)
    const radius = 2;
    let pulled = false;
    
    // Filter valid targets (Alive enemies within range)
    const targets = currentEnemies.filter(e => 
        e.isAlive() && 
        (Math.abs(e.x - player.x) + Math.abs(e.y - player.y)) <= radius
    );

    // Sort by distance (closest first) to prevent jamming
    targets.sort((a, b) => {
        const distA = Math.abs(a.x - player.x) + Math.abs(a.y - player.y);
        const distB = Math.abs(b.x - player.x) + Math.abs(b.y - player.y);
        return distA - distB;
    });

    for (const enemy of targets) {
        // Calculate Pull Direction (Towards Player)
        const dx = Math.sign(player.x - enemy.x);
        const dy = Math.sign(player.y - enemy.y);
        
        const nextX = enemy.x + dx;
        const nextY = enemy.y + dy;

        // --- COLLISION CHECKS ---
        let blocked = false;

        // 1. Check Player Overlap
        if (nextX === player.x && nextY === player.y) blocked = true;

        // 2. Check Ally Overlap
        if (player.npcAlly && player.npcAlly.isAlive() && !player.npcAlly.isFled && 
            player.npcAlly.x === nextX && player.npcAlly.y === nextY) blocked = true;

        // 3. Check Terrain/Obstacles/Other Enemies (Standard Block)
        // isCellBlocked(x, y, ignoreEntities=false, isFlying=false)
        // Note: isCellBlocked checks currentEnemies, so it prevents merging with other enemies
        if (isCellBlocked(nextX, nextY, false, false)) blocked = true;

        // Apply Move if valid
        if (!blocked) {
            enemy.x = nextX;
            enemy.y = nextY;
            pulled = true;
        }
    }

    if (pulled) {
        renderBattleGrid();
        await new Promise(r => setTimeout(r, 200));
    }
    
    // Reset Attack Flag for the new turn
    player.hasAttackedThisTurn = false;
    if (typeof updateStatsView === 'function') updateStatsView();
}

function processInsatiableVoidEnd() {
    if (!player.skillToggles['insatiable_void']) return;

    // Self-Consume Check: Did we attack?
    if (!player.hasAttackedThisTurn) {
        const selfDmg = Math.floor(player.maxHp * 0.10);
        
        // Deal True Damage (Void)
        player.takeDamage(selfDmg, { element: 'void', ignore_defense: true });
        
        addToLog(`The Void hungers... it consumes you! (-${selfDmg} HP)`, "text-red-500 font-bold");
        createFloatingText(player.x, player.y, `-${selfDmg}`, "red");
        
        if (typeof updateStatsView === 'function') updateStatsView();
        if (player.hp <= 0) checkPlayerDeath();
    }
}

// --- BATTLE FUNCTIONS ---
function startBattle(biomeKey, options = null) {
    // 1. Reset State
    if (options && options.trainingConfig) {
        preTrainingState = { hp: player.hp, mp: player.mp };
    } else {
        preTrainingState = null;
    }

    player.specialWeaponStates = {}; 
    player.encounterFlags = {}; 
    player.tilesMovedThisTurn = 0; 
    player.tilesMovedLastTurn = 0;
    gameState.bladeWaltzTriggered = false
    
    gameState.battleEnded = false;
    player.curvedSwordMomentum = 0;
    player.hasHitEnemyThisTurn = false;
    gameState.currentBiome = biomeKey;
    gameState.consecutionStacks = 0;
    gameState.lastTargetId = null;
    gameState.usedElements = [];
    
    $('#inventory-btn').disabled = false;
    $('#character-sheet-btn').disabled = false;

    // Reset Battle State
    gameState.action = null;
    gameState.comboTarget = null;
    gameState.comboCount = 0;
    gameState.lastSpellElement = 'none';
    gameState.gridObjects = []; 
    gameState.activeDrone = null;
    gameState.npcActiveDrone = null;
    gameState.markedTarget = null;

    // Clear Player Buffs
    player.clearBattleBuffs();
    player.combatTags = {};
    player.signatureAbilityUsed = false;
    player.signatureAbilityToggleActive = false; 
    player.staticCharge = 0;

    // Reset Ally State
    if (player.npcAlly) {
        player.npcAlly.isFled = false;
        player.npcAlly.clearBattleBuffs();
        player.npcAlly.hp = Math.min(player.npcAlly.maxHp, player.npcAlly.hp);
        player.npcAlly.mp = Math.min(player.npcAlly.maxMp, player.npcAlly.mp);
        player.npcAlly.x = -1; 
        player.npcAlly.y = -1;
        player.npcAlly.signatureAbilityUsed = false;
        player.npcAlly.signatureAbilityToggleActive = false;
        player.npcAlly.activeModeIndex = -1;
        player.npcAlly.npcAllyMarkedTarget = null;
        
        if (!player.npcAlly.isResting && player.encountersSinceLastPay < 5) {
            player.npcAlly._50PercentLogged = false; 
            player.npcAlly._10PercentLogged = false;
            const dialogueType = options?.trainingConfig ? 'START_TRAIN' : 'START_BATTLE';
            const dialogue = player.npcAlly._getDialogue(dialogueType, player.name);
            addToLog(`(${player.npcAlly.name})<br>"${dialogue}"`, 'text-gray-400');
        }
    }

    // 2. Determine Context & Grid
    const isTutorial = tutorialState.isActive && tutorialState.sequence[tutorialState.currentIndex]?.id === 'wilderness_select';
    const isTraining = options && options.trainingConfig;
    const isMapNode = options && options.nodeType;

    let gridData;
    if (isTutorial) {
        gridData = BATTLE_GRIDS['square_5x5'];
    } 
    else if (isTraining) {
        const size = options.trainingConfig.gridSize || 5; 
        const safeSize = Math.max(5, Math.min(15, size)); 
        gridData = {
            width: safeSize,
            height: safeSize,
            layout: new Array(safeSize * safeSize).fill(1) 
        };
    } 
    else {
        // [MODIFIED] Check if this is a boss node and pass true/false
        const isBossEncounter = (options && options.nodeType === 'boss');
        gridData = generateDynamicBattleLayout(isBossEncounter);
    }
    
    gameState.gridWidth = gridData.width;
    gameState.gridHeight = gridData.height;
    gameState.gridLayout = gridData.layout;

    // 3. Enemy Generation
    if (isMapNode || isTraining || isTutorial) {
        currentEnemies = [];
    }
    
    if (currentEnemies.length === 0) {
        if (isTutorial) {
            currentEnemies.push(new Enemy(MONSTER_SPECIES['goblin'], MONSTER_RARITY['common'], player.level));
        } else if (isTraining) {
             const mult = options.trainingConfig.statMultiplier || 1.0;
            options.trainingConfig.enemies.forEach(cfg => {
                 const species = MONSTER_SPECIES[cfg.key];
                 const rarity = MONSTER_RARITY[cfg.rarity];
                 if (species && rarity) {
                     const enemy = new Enemy(species, rarity, player.level);
                     if (mult !== 1.0) {
                         enemy.maxHp = Math.floor(enemy.maxHp * mult);
                         enemy.hp = enemy.maxHp;
                         enemy.strength = Math.floor(enemy.strength * mult);
                     }
                     
                     // --- NEW: Apply Element Selection ---
                     if (cfg.element && cfg.element !== 'none') {
                         enemy.elementalAffinity = cfg.element;
                         // Add a visual indicator to the name
                         enemy.name = `${capitalize(cfg.element)} ${enemy.name}`;
                     }
                     // ------------------------------------

                     currentEnemies.push(enemy);
                 }
            });
        } else if (isMapNode) {
            if (options.nodeType === 'elite') {
                 let tempEnemy = generateEnemy(biomeKey);
                 const rarityKey = Math.random() < 0.7 ? 'rare' : 'epic';
                 currentEnemies.push(new Enemy(tempEnemy.speciesData, MONSTER_RARITY[rarityKey], player.level));
            } else if (options.nodeType === 'boss') {
                 const bossKey = options.bossKey; 
                 const species = MONSTER_SPECIES[bossKey] || generateEnemy(biomeKey).speciesData;
                 const rarityData = MONSTER_RARITY['legendary']; 
                 const boss = new Enemy(species, rarityData, player.level);
                 boss.hp = Math.floor(boss.maxHp * 5);
                 boss.maxHp = boss.hp;
                 boss.strength = Math.floor(boss.strength * 2);
                 boss.isBoss = true;
                 currentEnemies.push(boss);
            } else if (options.nodeType === 'monster_lured') {
                 const species = MONSTER_SPECIES[options.speciesKey];
                 currentEnemies.push(new Enemy(species, MONSTER_RARITY['common'], player.level));
            } else {
                 let minEnemies = 1;
                 let maxEnemies = 1;
                 if (player.level >= 20) { minEnemies = 3; maxEnemies = 5; } 
                 else if (player.level >= 10) { minEnemies = 2; maxEnemies = 4; } 
                 else if (player.level >= 6) { minEnemies = 1; maxEnemies = 3; } 
                 else if (player.level >= 4) { minEnemies = 1; maxEnemies = 2; }

                 let numEnemies = Math.floor(Math.random() * (maxEnemies - minEnemies + 1)) + minEnemies;
                 if (player.statusEffects.monster_lure) numEnemies = Math.min(6, numEnemies + 2);

                 for (let i = 0; i < numEnemies; i++) {
                     let enemy = generateEnemy(biomeKey);
                     let safety = 0;
                     while(enemy.rarityData.key === 'legendary' && safety < 10) {
                         enemy = generateEnemy(biomeKey);
                         safety++;
                     }
                     currentEnemies.push(enemy);
                 }
            }
        } else {
            let numEnemies = 1;
            if (player.level >= 6 && Math.random() > 0.8) numEnemies = 2;
            if (player.statusEffects.monster_lure) numEnemies = Math.min(4, numEnemies + 2);
            for (let i = 0; i < numEnemies; i++) currentEnemies.push(generateEnemy(biomeKey));
        }
    }

    // 4. Placement
    const validCells = [];
    for (let y = 0; y < gameState.gridHeight; y++) {
        for (let x = 0; x < gameState.gridWidth; x++) {
            if (gameState.gridLayout[y * gameState.gridWidth + x] === 1) validCells.push({x, y});
        }
    }
    const occupiedCells = new Set();
    const getUnoccupied = (list) => {
        const available = list.filter(c => !occupiedCells.has(`${c.x},${c.y}`));
        return available.length > 0 ? available[Math.floor(Math.random() * available.length)] : null;
    };
    
    // Place Player
    const playerSpawnArea = validCells.filter(c => c.y >= Math.floor(gameState.gridHeight / 2));
    let pCell = getUnoccupied(playerSpawnArea) || getUnoccupied(validCells);
    player.x = pCell.x; player.y = pCell.y;
    occupiedCells.add(`${player.x},${player.y}`);
    
    // Place Enemies
    const enemySpawnArea = validCells.filter(c => c.y < Math.floor(gameState.gridHeight / 2));
    currentEnemies.forEach(enemy => {
        enemy.isMarked = false; enemy.hasDealtDamageThisEncounter = false;
        let cell = getUnoccupied(enemySpawnArea) || getUnoccupied(validCells);
        if (cell) {
            enemy.x = cell.x; enemy.y = cell.y;
            occupiedCells.add(`${cell.x},${cell.y}`);
        } else {
            enemy.x = -1; enemy.y = -1; 
        }
    });

    // Place Ally
    if (player.npcAlly && player.npcAlly.hp > 0 && !player.npcAlly.isResting && player.encountersSinceLastPay < 5) {
         const adj = [{x:player.x+1, y:player.y}, {x:player.x-1, y:player.y}, {x:player.x, y:player.y+1}, {x:player.x, y:player.y-1}];
         const validAdj = adj.filter(c => c.x >= 0 && c.x < gameState.gridWidth && c.y >= 0 && c.y < gameState.gridHeight && gameState.gridLayout[c.y*gameState.gridWidth+c.x] === 1 && !occupiedCells.has(`${c.x},${c.y}`));
         if (validAdj.length > 0) {
             const spot = validAdj[Math.floor(Math.random() * validAdj.length)];
             player.npcAlly.x = spot.x; player.npcAlly.y = spot.y;
             occupiedCells.add(`${spot.x},${spot.y}`);
             _activateNpcStartOfBattleAbilities(player.npcAlly);
         } else {
             addToLog("No room for ally!", "text-yellow-400");
         }
    }

    // Place Obstacles & Terrain (Scaled Density based on Area)
    const totalCells = gameState.gridWidth * gameState.gridHeight;
    const numObstacles = Math.max(2, Math.floor(totalCells * 0.08)); 
    const numTerrain = Math.max(1, Math.floor(totalCells * 0.05));   

    const obsDef = (biomeKey && BIOMES[biomeKey]) ? (BIOMES[biomeKey].obstacle || { char: '🪨', name: 'Rock' }) : { char: '🪨', name: 'Rock' };

    for(let i=0; i<numObstacles; i++) {
        const cell = getUnoccupied(validCells);
        if (cell) {
            gameState.gridObjects.push({ x: cell.x, y: cell.y, type: 'obstacle', hp: 1, emoji: obsDef.char, name: obsDef.name });
            occupiedCells.add(`${cell.x},${cell.y}`);
        }
    }
    
    for(let i=0; i<numTerrain; i++) {
        const cell = getUnoccupied(validCells);
        if (cell) {
            gameState.gridObjects.push({ x: cell.x, y: cell.y, type: 'terrain', hp: Infinity, emoji: '🔳', name: 'Deep Terrain' });
            occupiedCells.add(`${cell.x},${cell.y}`);
        }
    }

    // 5. Finalize
    if (!isTraining) {
        const biome = BIOMES[biomeKey];
        if (biome && biome.theme) applyTheme(biome.theme);
    } else {
        applyTheme('town');
    }

    lastViewBeforeInventory = 'battle';
    gameState.currentView = 'battle';
    
    const enemyNames = currentEnemies.map(e => `<span class="font-bold text-red-400">${e.name}</span>`).join(', ');
    let allyLog = (player.npcAlly && player.npcAlly.x !== -1) ? ` with your ally, <span class="font-bold text-blue-400">${player.npcAlly.name}</span>,` : "";

    if (isTraining) addToLog(`Training against: ${enemyNames}!`, 'text-yellow-300');
    else addToLog(`You encounter: ${enemyNames}${allyLog}!`);

    beginPlayerTurn();

    if (isTutorial) advanceTutorial();
}

function spawnNpcDrone(ally) {
    if (!ally || !ally.isAlive() || gameState.npcActiveDrone) return;

    // 1. Create Drone (using ally's stats)
    const drone = new Drone(ally);
    // 2. Find Spawn Cell
    const potentialSpawns = [
        {x: ally.x+1, y: ally.y}, {x: ally.x-1, y: ally.y},
        {x: ally.x, y: ally.y+1}, {x: ally.x, y: ally.y-1}
    ];
    let spawnCell = null;
    for(const cell of potentialSpawns) {
        // Drone can't fly, check for blockage
        if (!isCellBlocked(cell.x, cell.y, false, false)) { 
            spawnCell = cell;
            break;
        }
    }

    if (spawnCell) {
        drone.x = spawnCell.x;
        drone.y = spawnCell.y;
        gameState.npcActiveDrone = drone; // Store drone instance
        addToLog(`A whirring drone materializes beside ${ally.name}!`, "text-cyan-400");
        renderBattleGrid(); // Update grid to show drone
    } else {
        addToLog(`No space for ${ally.name} to summon their drone!`, 'text-red-400');
        // Refund cost/use
        ally.mp += ally.signatureAbilityData.cost;
        ally.signatureAbilityUsed = false;
    }
}

// --- NEW: Helper for start-of-battle abilities ---
function _activateNpcStartOfBattleAbilities(ally) {
    if (!ally || !ally.signatureAbilityData) return;

    const ability = ally.signatureAbilityData;
    const cost = ability.cost || 0;

    if (ability.type === 'toggle') {
        // Activate toggles if MP is above 25% threshold
        if (ally.mp >= ally.mpToggleThreshold) {
            ally.signatureAbilityToggleActive = true;
            addToLog(`${ally.name} activates ${ability.name}!`, 'text-blue-300');
            // Magus starts in 'Off' state
            if (ally._classKey === 'magus') {
                ally.activeModeIndex = -1;
            }
        } else {
            addToLog(`${ally.name} is too low on MP to activate ${ability.name}.`, 'text-blue-400');
        }
    } else if (ability.type === 'signature') {
        // Only activate Barbarian and Artificer at the start
        if (ally._classKey === 'barbarian' || ally._classKey === 'artificer') {
            if (ally.mp >= cost) {
                ally.mp -= cost;
                ally.signatureAbilityUsed = true;
                addToLog(`${ally.name} uses ${ability.name}!`, 'text-blue-300 font-bold');
                
                if (ally._classKey === 'barbarian') {
                    ally.statusEffects.buff_enrage = { duration: ability.duration };
                    addToLog(`${ally.name} flies into a rage!`, 'text-red-400');
                } else if (ally._classKey === 'artificer') {
                    spawnNpcDrone(ally); // Attempt to spawn
                }
            } else {
                addToLog(`${ally.name} lacks the MP to use ${ability.name}.`, 'text-blue-400');
            }
        }
    }
}
/**
 * Handles returning to the battle screen after closing the inventory mid-battle.
 * Does NOT advance the turn.
 */
function returnToBattleFromInventory() {
    gameState.currentView = 'battle'; // Set view back to battle
    const turnWasConsumed = !gameState.isPlayerTurn; // Check BEFORE resetting flags or rendering

    // Always unlock actions when returning from inventory screen
    isProcessingAction = false;

    if (turnWasConsumed) {
        console.log("Turn was consumed by equipping gear. Finalizing action.");
        // Render the grid to show updated gear, potentially without player actions yet
        renderBattleGrid();
        // Crucially, call finalizePlayerAction AFTER rendering the grid update
        // Use a small timeout to ensure the render completes before the enemy potentially acts instantly
        setTimeout(finalizePlayerAction, 50); // Advance turn state (enemy turn, status effects etc.)
    } else {
        console.log("Returned from inventory without consuming turn.");
        // If turn wasn't consumed, the player can still act.
        gameState.action = null; // Reset any potential pending action from before inventory opened
        renderBattleGrid(); // Re-render the battle grid WITH player action buttons
    }
}

const STATUS_ICONS = {
    'poison': '🤢',
    'toxic': '🤮',
    'paralyzed': '⚡',
    'jolted': '⚡',
    'petrified': '🗿',
    'frozen': '❄️',
    'burning': '🔥',
    'drenched': '💧',
    'rooted': '🕸️',
    'stunned': '💫',
    'swallowed': '👅',
    'shredded': '🛡️💔',
    'sundered': '🛡️💔',
    'scorned': '💢',
    'blinded': '👁️‍🗨️',
    'silenced': '😶',
    'buff_strength': '💪',
    'buff_enrage': '😡',
    'buff_haste': '⏩',
    'buff_swiftness': '🍃',
    'buff_defense': '🛡️',
    'buff_magic_shield': '✨',
    'buff_regeneration': '💚',
    'buff_thorns': '🌵',
    'buff_divine': '🌟',
    'buff_void': '🟣',
    'mark': '🎯',
    'bow_mark': '🎯',
    'arcane_sigil': '🔮',
    'frostbite': '❄️',
    'frozen': '🧊',
    'buff_aqueous_aegis': '🫧'
};

// MODIFIED: No longer renders icons on the grid.
function renderStatusIcons(entity) {
    return ''; 
}

function renderBattle(subView = 'main', actionData = null) {
    if (gameState.battleEnded) return;
    
    // Allow item/buff menu access even if no enemies are present
    if (currentEnemies.length === 0 && subView !== 'item' && subView !== 'buff' && subView !== 'main') return;

    // 1. MAIN VIEW (The Grid)
    if (subView === 'main') {
        renderBattleGrid();
    } 
    
    // 2. TARGET SELECTION
    else if (subView === 'attack' || subView === 'magic_target') {
        let buttonAction, buttonClass, titleText, backFunction;

        if (subView === 'attack') {
             buttonAction = 'performAttack';
             buttonClass = 'btn-action';
             titleText = 'Attack';
             backFunction = 'renderBattleGrid()';
        } else { // magic_target
            buttonAction = `castSpell('${actionData.spellKey}', index)`;
             buttonClass = 'btn-magic';
             // Safe access to spell name
             const spellName = SPELLS[actionData.spellKey]?.tiers[player.spells[actionData.spellKey]?.tier -1]?.name || 'Spell';
             titleText = `Cast ${spellName}`;
             backFunction = `renderBattle('magic')`;
        }

        let html = `<div class="w-full text-center">
            <h2 class="font-medieval text-3xl mb-4 title-glow">${titleText}</h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">`;

        currentEnemies.forEach((enemy, index) => {
            // FIX: Ensure enemy exists and is alive before rendering button
            if (enemy && enemy.isAlive()) {
                 const finalAction = buttonAction.replace('index', index);
                 html += `<button onclick="${finalAction}" class="btn ${buttonClass}">${enemy.name}</button>`;
            }
        });
        html += `</div><button onclick="${backFunction}" class="btn btn-primary">Back</button></div>`;
        
        const container = document.createElement('div');
        container.innerHTML = html;
        render(container);
    } 
    
    // 3. MAGIC MENU
    else if (subView === 'magic') {
        // Sort Spells: Element -> Type -> Name
        const elementOrder = ['none', 'fire', 'water', 'earth', 'wind', 'lightning', 'nature', 'light', 'void', 'healing'];
        const typeOrder = ['st', 'aoe', 'support', 'healing'];

        const sortedKeys = Object.keys(player.spells).filter(k => SPELLS[k]).sort((a, b) => {
            const sA = SPELLS[a];
            const sB = SPELLS[b];
            
            // 1. Element
            const elA = elementOrder.indexOf(sA.element);
            const elB = elementOrder.indexOf(sB.element);
            if (elA !== elB) return (elA === -1 ? 99 : elA) - (elB === -1 ? 99 : elB);
            
            // 2. Type
            const tA = typeOrder.indexOf(sA.type);
            const tB = typeOrder.indexOf(sB.type);
            if (tA !== tB) return (tA === -1 ? 99 : tA) - (tB === -1 ? 99 : tB);
            
            // 3. Name
            return sA.tiers[0].name.localeCompare(sB.tiers[0].name);
        });

        let spellsHtml = '';
        let lastElement = null;

        sortedKeys.forEach(key => {
            const spellTree = SPELLS[key];
            const playerSpell = player.spells[key];
            const spell = spellTree.tiers[player.spells[key].tier - 1];

            // Insert Header if Element Changes
            if (spellTree.element !== lastElement) {
                lastElement = spellTree.element;
                let headerName = capitalize(lastElement);
                if (lastElement === 'none') headerName = 'Null';
                
                spellsHtml += `<div class="col-span-1 md:col-span-2 text-yellow-300 font-bold text-xs uppercase tracking-wider border-b border-white/10 mt-2 mb-1 py-1 text-center sticky top-1 bg-slate-900/90 backdrop-blur z-10">${headerName}</div>`;
            }

            // [UI FIX] Calculate cost with modifiers (Matches castSpell logic)
            let displayCost = spell.cost;
            let flatReduction = 0;

            // 1. Skill Reductions (Cumulative)
            if (player.isSkillActive('mana_control')) flatReduction += 1;
            if (player.isSkillActive('higher_mana_control')) flatReduction += 2;
            if (player.isSkillActive('innate_manipulation')) flatReduction += 2;

            // 2. Gear Reductions
            const catalyst = player.equippedCatalyst;
            const armor = player.equippedArmor;
            if (catalyst.effect?.mana_discount) flatReduction += catalyst.effect.mana_discount;
            if (armor.effect?.mana_discount) flatReduction += armor.effect.mana_discount;
            if (armor.effect?.mana_discount_flat) flatReduction += armor.effect.mana_discount_flat;

            // 3. Apply Flat Reduction (Clamped to 1)
            displayCost = Math.max(1, displayCost - flatReduction);

            // 4. Multipliers
            if (player.skillToggles) {
                // Mana Overload
                if (player.skillToggles['mana_overload']) displayCost = Math.ceil(displayCost * 2);

                // Single Target Logic
                if (spellTree.type === 'st') {
                    if (player.skillToggles['power_blast']) displayCost = Math.ceil(displayCost * 1.50);
                    if (player.skillToggles['aetheric_lance']) displayCost += 10;
                    if (player.skillToggles['mana_barrage']) displayCost = Math.ceil(displayCost * 1.50);
                }

                // [ADDED] AoE Logic (Missing from your UI)
                if (spellTree.type === 'aoe') {        
                    if (player.isSkillActive('siege_protocol')) displayCost = Math.ceil(displayCost * 1.10);
                    if (player.skillToggles['rain_of_ruin']) displayCost = Math.ceil(displayCost * 1.50);
                    if (player.skillToggles['singularity']) displayCost = Math.ceil(displayCost * 2);
                }

                // Void Logic (Fixed multiplier from 1.5 to 1.25 to match backend)
                if (player.skillToggles['oblivions_hunger'] && spellTree.element === 'void') {
                    displayCost = Math.ceil(displayCost * 1.25);
                }
            }
            if (player._classKey === 'warlock' && player.signatureAbilityToggleActive) displayCost = Math.ceil(displayCost * 1.25);
            if (player._classKey === 'magus' && player.activeModeIndex > -1) displayCost = Math.ceil(displayCost * 1.30);
            
            // Dampen (Debuff)
            if (player.statusEffects.magic_dampen) {
                displayCost = Math.floor(displayCost * (1 / player.statusEffects.magic_dampen.multiplier));
            }

            // 5. Final Safety Check
            displayCost = Math.max(1, displayCost);

            const canCast = player.mp >= displayCost; 

            spellsHtml += `<button onclick="battleAction('magic_select', '${key}')" class="btn btn-magic w-full text-left" ${!canCast ? 'disabled' : ''} onmouseover="showTooltip('${key}', event)" onmouseout="hideTooltip()">
                        <div class="flex justify-between"><span>${spell.name}</span><span>${displayCost} MP</span></div>
                    </button>`;
        }); 

        if (spellsHtml === '') {
            spellsHtml = `<p class="col-span-1 md:col-span-2 text-gray-500 text-center italic">No spells learned.</p>`;
        }

        let html = `<div class="w-full text-center">
                        <h2 class="font-medieval text-3xl mb-4 title-glow">Cast a Spell</h2>
                        <div class="h-80 overflow-y-auto inventory-scrollbar pr-2 mb-4">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-2">${spellsHtml}</div>
                        </div>
                        <button onclick="renderBattleGrid()" class="btn btn-primary">Back</button>
                    </div>`;

        const container = document.createElement('div');
        container.innerHTML = html;
        render(container);
     }
     
     // 4. SKILLS MENU
    else if (subView === 'skills') {
        const existingList = document.getElementById('skills-list-scroll');
        const scrollPos = existingList ? existingList.scrollTop : 0;
        const mode = player.skillDescriptionMode || 'detailed';
        const toggleBtnText = mode === 'simple' ? "Show Stats" : "Show Flavor";

        let html = `<div class="w-full text-center h-full flex flex-col relative">
                        <div class="flex justify-between items-center mb-2 flex-shrink-0 w-full px-1 bg-slate-900/50 rounded py-1">
                            <h2 class="font-medieval text-2xl title-glow text-left pl-1">Combat Arts</h2>
                            <button onclick="event.stopPropagation(); toggleSkillDescMode(false); renderBattle('skills')" class="btn btn-secondary text-[10px] py-0.5 px-2 h-6 whitespace-nowrap z-10">${toggleBtnText}</button>
                        </div>
                        <div id="skills-list-scroll" class="flex-grow overflow-y-auto inventory-scrollbar pr-1 space-y-2 text-left">`;

        // --- SIGNATURE (Standard Logic) ---
        if (player.signatureAbilityData && player.signatureAbilityData.type !== 'passive_action') {
            const ability = player.signatureAbilityData;
            let statusText = "";
            let btnClass = "btn-primary";
            let isDisabled = false;
            let subText = ability.description;

            if (ability.type === 'signature') {
                if (player.signatureAbilityUsed) {
                    statusText = "<span class='text-gray-500 text-xs uppercase font-bold'>Depleted</span>";
                    isDisabled = true;
                    btnClass = "btn-primary opacity-50";
                } else {
                    statusText = `<span class='text-blue-300 text-xs font-bold'>${ability.cost} MP</span>`;
                    if (player.mp < ability.cost) { isDisabled = true; btnClass = "btn-primary opacity-50"; }
                }
            } else if (ability.type === 'toggle') {
                const isActive = player.signatureAbilityToggleActive;
                statusText = isActive ? "<span class='text-green-400 text-xs font-bold uppercase'>Active</span>" : "<span class='text-gray-400 text-xs uppercase'>Inactive</span>";
                btnClass = isActive ? "btn-item" : "btn-primary"; 
                if (player._classKey === 'magus' && ability.modes) {
                    const modeName = player.activeModeIndex > -1 ? ability.modes[player.activeModeIndex] : "Off";
                    statusText = `<span class='text-cyan-300 text-xs font-bold'>${modeName}</span>`;
                }
            }

            html += `<div class="bg-slate-800/80 rounded-lg p-2 border border-blue-900/50 shadow-sm">
                        <div class="flex justify-between items-center mb-1">
                            <h4 class="font-bold text-cyan-300 text-xs uppercase tracking-wider">Signature</h4>
                            ${statusText}
                        </div>
                        <button onclick="battleAction('signature_ability')" class="btn ${btnClass} w-full py-2 mb-1 flex justify-center items-center text-sm" ${isDisabled ? 'disabled' : ''}>
                            ${ability.name}
                        </button>
                        <p class="text-[10px] text-gray-400 leading-tight">${subText}</p>
                     </div>`;
        }

        // --- PREPARE LISTS ---
        const equippedSkillObjects = (player.equippedSkills || [])
            .map(id => ({ id, data: SKILL_TREE[id] }))
            .filter(item => item.data);

        const activeSkills = equippedSkillObjects.filter(s => s.data.type === 'active');
        const toggleSkills = equippedSkillObjects.filter(s => s.data.type === 'toggle');
        
        // [MODIFIED] Use Pinned Passives
        const pinnedIds = player.pinnedPassives || [];
        const displayPassives = pinnedIds
            .map(id => ({ id, data: SKILL_TREE[id] }))
            .filter(item => item.data);

        // --- RENDER ACTIVES ---
        // (Helper function inlined for brevity in this response context, or use previous definition)
        const renderButton = (skill) => {
             const { id, data } = skill;
             const cost = data.effect.cost || 0;
             let btnClass = data.type === 'active' ? "btn-action" : "btn-primary";
             let statusLabel = cost > 0 ? `${cost} MP` : "";
             let isDisabled = false;
             if (typeof checkSkillRequirements === 'function') {
                 const reqCheck = checkSkillRequirements(id);
                 if (!reqCheck.allowed) { isDisabled = true; btnClass += " opacity-50 grayscale"; statusLabel = "REQ"; }
             }
             if (data.type === 'toggle') {
                 const isActive = player.skillToggles[data.effect.toggle];
                 statusLabel = isActive ? "ON" : "OFF";
                 if(isActive) btnClass = "btn-item border-green-500";
             } else if (player.mp < cost && !isDisabled) {
                 isDisabled = true; btnClass += " opacity-50";
             }
             return `<button onclick="battleAction('use_skill', '${id}')" class="btn ${btnClass} flex flex-col justify-center items-center h-14 p-1 text-xs relative overflow-hidden w-full shadow-sm" ${isDisabled ? 'disabled' : ''} onmouseover="showSkillNodeTooltip('${id}', event)" onmouseout="hideSimpleTooltip()">
                        <span class="font-bold leading-tight line-clamp-2 w-full text-center pointer-events-none">${data.name}</span>
                        <span class="text-xs opacity-80 mt-0.5 pointer-events-none">${statusLabel}</span>
                    </button>`;
        };

        if (activeSkills.length > 0) {
            html += `<div class="bg-slate-900/40 rounded-lg p-2 mt-2">
                        <h4 class="font-bold text-yellow-300 text-[10px] uppercase tracking-widest mb-1 border-b border-slate-700 pb-0.5">Active Abilities</h4>
                        <div class="grid grid-cols-2 gap-2">${activeSkills.map(renderButton).join('')}</div>
                     </div>`;
        }
        if (toggleSkills.length > 0) {
            html += `<div class="bg-slate-900/40 rounded-lg p-2 mt-2">
                        <h4 class="font-bold text-purple-300 text-[10px] uppercase tracking-widest mb-1 border-b border-slate-700 pb-0.5">Stances & Toggles</h4>
                        <div class="grid grid-cols-2 gap-2">${toggleSkills.map(renderButton).join('')}</div>
                     </div>`;
        }

        // --- RENDER PINNED PASSIVES ---
        if (displayPassives.length > 0) {
            html += `<div class="bg-slate-900/40 rounded-lg p-2 mt-2 relative">
                        <div class="flex justify-between items-end border-b border-slate-700 pb-0.5 mb-1">
                            <h4 class="font-bold text-cyan-300 text-[10px] uppercase tracking-widest">Tracked Passives</h4>
                            <button onclick="renderBattle('passives_select')" class="text-[9px] text-gray-400 hover:text-white underline">Manage</button>
                        </div>
                        <div class="flex flex-wrap gap-1.5">`;
            
            // Render logic to dim passives if requirements aren't met
            displayPassives.forEach(skill => {
                const { id, data } = skill;
                let isActive = true; // Assume true, verify with checkSkillRequirements if available
                if (typeof checkSkillRequirements === 'function') {
                    const req = checkSkillRequirements(id);
                    if (!req.allowed) isActive = false;
                }
                const styleClass = isActive 
                    ? "bg-slate-800 text-gray-300 border-slate-600 hover:border-cyan-400 hover:text-white" 
                    : "bg-slate-900/50 text-gray-600 border-slate-800"; // Dimmed

                html += `<div class="${styleClass} border rounded px-2 py-1 text-[10px] cursor-help transition-colors flex items-center gap-1"
                              onmouseover="showSkillNodeTooltip('${id}', event)" 
                              onmouseout="hideSimpleTooltip()">
                            <span class="${isActive ? 'text-cyan-400/70' : 'text-gray-700'} text-[8px] uppercase font-bold tracking-wider">[${data.branch || 'Passive'}]</span>
                            <span>${data.name}</span>
                         </div>`;
            });
            html += `   </div>
                      </div>`;
        } else {
             // Prompt to add some
             html += `<div class="mt-4 text-center">
                        <button onclick="renderBattle('passives_select')" class="btn btn-secondary text-xs py-1 px-3">Select Passives to Track</button>
                      </div>`;
        }

        html += `</div>
                 <div class="mt-2 flex-shrink-0 w-full pt-2 border-t border-slate-700/50">
                    <button onclick="renderBattleGrid()" class="btn btn-primary w-full py-2 text-sm shadow-md">Back to Battle</button>
                 </div>
            </div>`;

        const container = document.createElement('div');
        container.className = 'w-full h-full max-w-[320px] mx-auto flex flex-col'; 
        container.innerHTML = html;
        render(container);
        if(existingList) document.getElementById('skills-list-scroll').scrollTop = scrollPos;
        
        mainView.classList.remove('p-6');
        mainView.classList.add('p-2');
    }

    // 5. [NEW] PASSIVE SELECTION MENU
    else if (subView === 'passives_select') {
        
        // [FIX] Capture Scroll Position
        const listId = 'passives-list-scroll';
        const existingList = document.getElementById(listId);
        const scrollPos = existingList ? existingList.scrollTop : 0;

        // 1. Get ALL unlocked passives and PRE-CALCULATE status & labels
        let allPassives = (player.unlockedSkills || [])
            .map(id => {
                const data = SKILL_TREE[id];
                if (!data) return null;
                if (data.type !== 'passive' && data.type !== 'trigger' && data.type !== 'synergy' && data.type !== 'mastery') return null;

                // Check Activity
                let isActive = true;
                if (typeof checkSkillRequirements === 'function') {
                    const req = checkSkillRequirements(id);
                    if (!req.allowed) isActive = false;
                }

                // Determine Category Label
                let category = data.branch || 'General';
                if (data.elementReq && data.elementReq !== 'none') {
                    category = data.elementReq.charAt(0).toUpperCase() + data.elementReq.slice(1);
                }
                
                return { id, data, isActive, category };
            })
            .filter(item => item !== null);

        const pinned = player.pinnedPassives || [];

        // 2. SORTING LOGIC
        // Priority: Pinned > Active > Category > Name
        allPassives.sort((a, b) => {
            const aPinned = pinned.includes(a.id);
            const bPinned = pinned.includes(b.id);

            if (aPinned && !bPinned) return -1;
            if (!aPinned && bPinned) return 1;
            if (a.isActive && !b.isActive) return -1;
            if (!a.isActive && b.isActive) return 1;
            if (a.category !== b.category) return a.category.localeCompare(b.category);
            return a.data.name.localeCompare(b.data.name);
        });

        let html = `<div class="w-full text-center h-full flex flex-col">
                        <h2 class="font-medieval text-2xl mb-2 title-glow">Manage Display</h2>
                        <p class="text-xs text-gray-400 mb-2 px-2">Select passives to display in the Battle UI. <br>They function regardless of selection.</p>
                        
                        <div id="${listId}" class="flex-grow overflow-y-auto inventory-scrollbar pr-1 space-y-1 text-left">`;

        if (allPassives.length === 0) {
            html += `<p class="text-gray-500 italic text-center mt-10">You haven't learned any passives yet.</p>`;
        } else {
            let lastWasActive = true; 
            
            allPassives.forEach((skill, index) => {
                const isPinned = pinned.includes(skill.id);
                
                // Visual separator
                if (index > 0 && !isPinned && !skill.isActive && lastWasActive) {
                    html += `<div class="text-[10px] text-gray-600 font-bold uppercase tracking-widest text-center my-2 border-b border-gray-800 leading-[0.1em]"><span class="bg-[#1a1c23] px-2">Inactive</span></div>`;
                }
                if (!isPinned) lastWasActive = skill.isActive;

                // Dynamic Styling
                const borderClass = isPinned ? "border-green-500 bg-slate-800" : (skill.isActive ? "border-slate-600 bg-slate-900/60" : "border-slate-800 bg-slate-900/30 opacity-60");
                const textClass = isPinned ? "text-white" : (skill.isActive ? "text-gray-300" : "text-gray-600");
                const activeDot = skill.isActive ? "<span class='text-green-400 text-[10px]'>●</span>" : "<span class='text-red-900 text-[10px]'>●</span>";
                
                let catColor = "text-gray-500";
                if (skill.category === 'Fire') catColor = "text-red-400";
                else if (skill.category === 'Water') catColor = "text-blue-400";
                else if (skill.category === 'Earth') catColor = "text-amber-600";
                else if (skill.category === 'Wind') catColor = "text-green-300";
                else if (skill.category === 'Lightning') catColor = "text-yellow-300";
                else if (skill.category === 'Void') catColor = "text-purple-400";
                else if (skill.category === 'Nature') catColor = "text-emerald-500";
                else if (skill.category === 'Light') catColor = "text-yellow-100";

                html += `<button onclick="togglePassivePin('${skill.id}')" 
                                 class="w-full flex items-center justify-between p-2 rounded border ${borderClass} transition-all hover:bg-slate-800 mb-1 group">
                            <div class="flex flex-col items-start">
                                <span class="${textClass} font-bold text-xs group-hover:text-white text-left leading-tight">${skill.data.name}</span>
                                <span class="text-[9px] ${catColor} uppercase tracking-wider flex items-center gap-1 mt-0.5 font-semibold">
                                    ${activeDot} ${skill.category}
                                </span>
                            </div>
                            <div class="${isPinned ? 'text-green-400' : 'text-slate-700'} text-lg font-bold ml-2">
                                ${isPinned ? '✓' : '+'}
                            </div>
                         </button>`;
            });
        }

        html += `   </div>
                    <div class="mt-2 flex-shrink-0 w-full pt-2 border-t border-slate-700/50">
                        <button onclick="renderBattle('skills')" class="btn btn-primary w-full py-2 text-sm shadow-md">Done</button>
                    </div>
                 </div>`;

        const container = document.createElement('div');
        container.className = 'w-full h-full max-w-[320px] mx-auto flex flex-col'; 
        container.innerHTML = html;
        render(container);
        
        // [FIX] Restore Scroll Position
        const newList = document.getElementById(listId);
        if (newList) newList.scrollTop = scrollPos;
    }
    
    // 5. ITEM MENU
    else if (subView === 'item') {
        let itemsHtml = '';

        // Filter: Include 'trap' and standard consumables
        const usableItems = Object.keys(player.inventory.items)
            .filter(key => {
                const item = ITEMS[key];
                return item && ['healing', 'mana_restore', 'buff', 'cleanse', 'enchant', 'experimental', 'cleanse_specific', 'debuff_apply', 'debuff_special', 'trap'].includes(item.type);
            })
            .map(key => ({ key, details: ITEMS[key] }));

        const typeOrder = ['healing', 'mana_restore', 'buff', 'cleanse', 'cleanse_specific', 'debuff_apply', 'debuff_special', 'trap', 'enchant', 'experimental'];
        const typeMap = { 
            'healing': 'Healing Potions',
            'mana_restore': 'Mana Potions',
            'buff': 'Buff Items',
            'cleanse': 'Cleansing Items',
            'cleanse_specific': 'Antidotes/Needles',
            'debuff_apply': 'Throwables (Debuff)',
            'debuff_special': 'Throwables (Special)',
            'trap': 'Traps',
            'enchant': 'Essences',
            'experimental': 'Mysterious Concoctions'
        };

        // Sort items
        usableItems.sort((a, b) => {
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
                itemsHtml += `<button onclick="${action}" class="btn btn-item w-full text-left" onmouseover="showTooltip('${key}', event)" onmouseout="hideTooltip()"><div class="flex justify-between"><span>${item.name}</span><span>x${count}</span></div></button>`;
            });
        } else {
            itemsHtml = `<p class="text-gray-400 text-center col-span-1 md:col-span-2">You have no usable items.</p>`;
        }

        let html = `<div class="w-full text-center">
                        <h2 class="font-medieval text-3xl mb-4 title-glow">Use Item</h2>
                        <div class="h-80 overflow-y-auto inventory-scrollbar pr-2 mb-4">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                                ${itemsHtml}
                            </div>
                        </div>
                        <button onclick="renderBattleGrid()" class="btn btn-primary">Back</button>
                    </div>`;

        const container = document.createElement('div');
        container.innerHTML = html;
        render(container);
     }
}

function renderBattleGrid(highlightTargets = false, highlightType = 'magic') {
    // 1. SAFETY CHECKS (Anti-Freeze)
    if (!gameState.gridLayout || gameState.gridWidth <= 0) {
        console.warn("renderBattleGrid: Grid state is invalid or not ready.");
        return;
    }

    try {
        const template = document.getElementById('template-battle').content.cloneNode(true);
        const rootDiv = template.querySelector('div'); 
        
        if (rootDiv) rootDiv.className = 'w-full h-full flex flex-col justify-center items-center py-2 gap-4 overflow-hidden'; 

        const gridContainer = template.getElementById('battle-grid');
        gridContainer.innerHTML = '';

        const cols = gameState.gridWidth;
        const rows = gameState.gridHeight;
        const ratio = cols / rows;

        gridContainer.className = 'grid gap-1 mx-auto content-center justify-center transition-all duration-300 flex-shrink-0';
        gridContainer.style.maxHeight = '55vh'; 
        gridContainer.style.maxWidth = '95%'; 
        gridContainer.style.aspectRatio = `${cols} / ${rows}`;
        
        if (rows >= cols) {
            gridContainer.style.height = '55vh'; 
            gridContainer.style.width = `calc(55vh * ${ratio})`;
        } else {
            gridContainer.style.width = '100%';
            gridContainer.style.height = 'auto'; 
        }

        gridContainer.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        gridContainer.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

        // --- Helper for PC Hover Support ---
        const addInfoListeners = (element, entity, showFn) => {
            element.addEventListener('click', (e) => { 
                if(!gameState.action) showFn(entity, e); 
            });
            if (window.matchMedia('(pointer: fine)').matches) {
                element.addEventListener('mouseenter', (e) => {
                    if(!gameState.action) showFn(entity, e);
                });
                element.addEventListener('mouseleave', () => {
                    if (typeof hideTooltip === 'function') hideTooltip();
                });
            }
        };

        // --- PRE-CALCULATE HIGHLIGHTS ---
        const attackableSet = new Set();
        const magicTargetSet = new Set();
        const itemTargetSet = new Set();
        const groundItemTargetSet = new Set();
        const healTargetSet = new Set();
        const walkableSet = new Set();

        if (highlightTargets) {
            const spellData = gameState.spellToCast ? SPELLS[gameState.spellToCast] : null;
            const itemData = gameState.itemToUse ? ITEMS[gameState.itemToUse] : null;
            
            // 1. Calculate Ranges
            let weaponRange = player.equippedWeapon.range || 1;
            if (player.race === 'Pinionfolk' && player.level >= 20) weaponRange += 2;
            if (player.statusEffects.bonus_range) weaponRange += player.statusEffects.bonus_range.range;
            if (player.equippedWeapon.class === 'Hammer' && player.isSkillActive('titans_range')) weaponRange += 1;
            if (player.equippedWeapon.class === 'Dagger' && player.skillToggles['daggershot_rune']) weaponRange += 2;
            if (player.equippedWeapon.class === 'Thrusting Sword' && player.skillToggles['zone_of_death']) weaponRange += 1;
            if (player.equippedWeapon.class === 'Hand-to-Hand' && player.skillToggles['vacuum_fist']) weaponRange += 2; 

            let spellRange = 0;
            if (spellData) {
                spellRange = player.equippedCatalyst.range || 3;
                if (player.race === 'Pinionfolk' && player.level >= 20) spellRange += 2;
                if (player.equippedCatalyst.effect?.spell_sniper) spellRange *= (1 + player.equippedCatalyst.effect.spell_sniper);
                if (player.statusEffects.buff_magic_dust?.rangeIncrease) spellRange += player.statusEffects.buff_magic_dust.rangeIncrease;
            }

            let itemRange = itemData?.range || 0;

            // Movement Range (Using Central Logic)
            let maxMoveDist = 3;
            if (typeof player.getMovementSpeed === 'function') {
                maxMoveDist = player.getMovementSpeed();
            }

            // --- 2. Loop Grid (Highlight Logic) ---
            for (let y = 0; y < rows; y++) {
                for (let x = 0; x < cols; x++) {
                    if (gameState.gridLayout[y * cols + x] !== 1) continue;

                    const dist = Math.abs(player.x - x) + Math.abs(player.y - y);
                    const coordKey = `${x},${y}`;
                    
                    // [FIX] DEFINED HERE so it is visible to Magic/Attack checks below
                    const enemy = currentEnemies.find(e => e && e.x === x && e.y === y && e.isAlive());
                    
                    // MOVEMENT
                    if (gameState.action === 'move') {
                         const isBlocked = isCellBlocked(x, y, false, player.race === 'Pinionfolk');
                         if (dist <= maxMoveDist && !isBlocked) {
                             walkableSet.add(coordKey);
                         }
                         continue;
                    }

                    // A. ATTACK / SKILL
                    if (gameState.action === 'attack' || (gameState.action === 'skill_target' && highlightType === 'skill')) {
                        let activeRange = weaponRange;
                        
                        if (player.equippedWeapon.class === 'Reaper' && player.skillToggles['force_switch_blade']) activeRange += 1;

                        const skillId = gameState.currentActiveSkill;
                        
                        if (skillId === 'misty_step' || skillId === 'thiefs_gambit') activeRange = 5;
                        else if (skillId === 'flash_point') activeRange += 2;
                        else if (skillId === 'tomahawk_hurl') {
                            activeRange += 2;
                            if (player.isSkillActive('head_hunters_discipline')) activeRange += 1;
                        }
                        else if (skillId === 'buckler_toss') activeRange += 3;
                        else if (skillId === 'heavy_meteoric_charge' && player.isSkillActive('titans_range')) activeRange += 1;
                        else if (skillId === 'glacial_ordnance' || skillId === 'sudsy_minefield') activeRange = 3;
                        else if (skillId === 'hoarfrost_haze' || skillId === 'miasma_of_decay') {
                            activeRange = (player.equippedWeapon.class === 'Bow') ? 2 : (player.equippedWeapon.range || 1);
                        }
                        else if (skillId === 'shield_bash' || skillId === 'the_iron_kiss') activeRange = 1;
                        else if (player.equippedWeapon.class === 'Thrusting Sword' && player.skillToggles['zone_of_death']) activeRange += 1;
                        else if (skillId === 'tempest_lance') {
                            activeRange += 2; 
                            if (player.isSkillActive('mortal_smite') && player.skillToggles['giant_hunt']) {
                                if (enemy && (enemy.isBoss || enemy.rarityData?.key === 'legendary')) {
                                    activeRange += 1;
                                }
                            }
                        }
                        else if (skillId === 'gravitational_anchor') activeRange += 2; 
                        else if (skillId === 'space_rift') activeRange = 4;
                        else if (skillId === 'lithic_sovereign') activeRange = 1;
                        else if (skillId === 'michaellas_verdict') activeRange += 3;
                        else if (skillId === 'hallowed_barrage' || skillId === 'crucible_of_bloom' || skillId === 'flowering_thunderbolt' || skillId === 'condensed_gale' || skillId === 'maelstrom_imperative') { 
                            const catalyst = player.equippedCatalyst;
                            activeRange = catalyst.range || 3;
                            if (player.isSkillActive('spell_sniper')) activeRange += 1;
                            if (player.isSkillActive('focused_fire')) activeRange += 1;
                            if (catalyst.effect?.spell_sniper) activeRange = Math.floor(activeRange * (1 + catalyst.effect.spell_sniper));
                            if (player.race === 'Pinionfolk' && player.level >= 20) activeRange += 2;
                        }

                        const FIST_ARTS = ['savage_beast_claw', 'glacial_palm', 'palm_blast', 'avalanche_drop'];
                        if (FIST_ARTS.includes(skillId)) {
                            const armorName = player.equippedArmor ? player.equippedArmor.name : "";
                            const isUnarmored = !player.equippedArmor || armorName === "Traveler's Garb" || armorName === "Traveler's Armor" || armorName === "Traveler’s Armor"; 
                            if (player.skillToggles['vacuum_fist'] && player.isSkillActive('way_of_empty_hand') && isUnarmored) {
                                activeRange += 2;
                            }
                        }

                        let isValidTarget = false;
                        let canTargetGround = ['misty_step', 'thiefs_gambit', 'michaellas_verdict', 'hallowed_barrage', 'flash_point', 'earth_splitter', 'heavy_meteoric_charge', 'solar_prominence', 'impact_tremor', 'deadly_dance', 'glacial_ordnance', 'sudsy_minefield', 'lithic_sovereign', 'hoarfrost_haze', 'miasma_of_decay', 'crucible_of_bloom', 'maelstrom_imperative', 'space_rift', 'gale_cannon'].includes(skillId);

                        if (skillId === 'spreadshot' && player.skillToggles['barrage'] && player.isSkillActive('longbowmans_volley')) {
                            canTargetGround = true;
                        }

                        if (canTargetGround) {
                            const isBlocked = isCellBlocked(x, y, false, false); 
                            if (dist <= activeRange && (!isBlocked || enemy)) isValidTarget = true;
                        } else {
                            if (dist <= activeRange && enemy) isValidTarget = true;
                        }

                        if (isValidTarget) attackableSet.add(coordKey);
                    }
                    
                    // B. MAGIC
                    else if (gameState.action === 'magic_cast' && spellData && spellRange > 0) {
                        if (dist <= spellRange) {
                            const isAoE = spellData.type === 'aoe';
                            const isAttackSpell = spellData.type === 'st' || isAoE;
                            // [FIX] 'enemy' is now defined in this scope!
                            if (isAttackSpell && (enemy || (isAoE && !isCellBlocked(x, y, false, true)))) { 
                                magicTargetSet.add(coordKey);
                            }
                            const ally = player.npcAlly;
                            if (ally && ally.x === x && ally.y === y && spellData.element === 'healing') healTargetSet.add(coordKey);
                        }
                    }
                    
                    // C. ITEM
                    else if (gameState.action === 'item_target' && itemData) {
                        const ally = player.npcAlly;
                        if (itemData.type === 'trap') {
                            const isOccupied = enemy || (ally && ally.x === x && ally.y === y) || (player.x === x && player.y === y);
                            const tileBlocked = isCellBlocked(x, y, false, false); 
                            if (dist <= itemData.range && !tileBlocked && !isOccupied) {
                                groundItemTargetSet.add(coordKey);
                            }
                        }
                        else if (['healing','mana_restore','buff','cleanse'].includes(itemData.type)) {
                            if (ally && ally.x === x && ally.y === y && dist <= 1) healTargetSet.add(coordKey);
                        } 
                        else if (itemRange > 0 && dist <= itemRange && enemy) {
                            itemTargetSet.add(coordKey);
                        }
                    }
                    else if (gameState.action === 'mark_target' && enemy) {
                        attackableSet.add(coordKey);
                    }
                }
            }
        }

        // --- RENDER LOOP ---
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const cell = document.createElement('div');
                cell.className = 'w-full h-full relative';
                cell.dataset.x = x;
                cell.dataset.y = y;

                if (gameState.gridLayout[y * cols + x] === 1) {
                    cell.classList.add('grid-cell', 'flex', 'items-center', 'justify-center');
                    const coordKey = `${x},${y}`;

                    if (attackableSet.has(coordKey) || groundItemTargetSet.has(coordKey)) cell.classList.add('attackable');
                    if (magicTargetSet.has(coordKey)) cell.classList.add('magic-attackable');
                    if (itemTargetSet.has(coordKey)) cell.classList.add('item-attackable');
                    if (healTargetSet.has(coordKey)) cell.classList.add('item-targetable-ally');
                    if (walkableSet.has(coordKey)) cell.classList.add('walkable');

                    if (gameState.action === 'magic_cast' || gameState.action === 'skill_target') {
                        cell.onmouseenter = () => previewAoE(x, y, true);
                        cell.onmouseleave = () => previewAoE(x, y, false);
                    }

                    // --- CONTENT CONSTRUCTION ---
                    let entityHtml = '';
                    let objectHtml = '';
                    let trapHtml = '';
                    const renderEmoji = (emoji) => `<div class="text-2xl leading-none filter drop-shadow-md select-none z-20 relative">${emoji}</div>`;

                    // 1. ENTITIES
                    if (player.x === x && player.y === y) {
                        cell.classList.add('player'); 
                        const pIcon = player.icon || getPlayerEmoji();
                        entityHtml = `${renderEmoji(pIcon)}`;
                        if (player.tileColor) {
                            cell.style.backgroundColor = player.tileColor;
                            cell.style.boxShadow = `0 0 10px ${player.tileColor}`;
                            cell.style.borderColor = "rgba(255,255,255,0.5)";
                        }
                        if (player.staticCharge > 0) {
                            entityHtml += `<div class="absolute top-[-5px] right-[-5px] text-[10px] font-bold text-yellow-300 bg-black/80 px-1 rounded z-30 border border-yellow-500">⚡${player.staticCharge}</div>`;
                        }
                        addInfoListeners(cell, player, showPlayerInfo);
                    }
                    
                    const drone = gameState.activeDrone;
                    if (!entityHtml && drone && drone.isAlive() && drone.x === x && drone.y === y) {
                        cell.classList.add('ally');
                        entityHtml = renderEmoji('🤖');
                    }
                    
                    const npcDrone = gameState.npcActiveDrone;
                    if (!entityHtml && npcDrone && npcDrone.isAlive() && npcDrone.x === x && npcDrone.y === y) {
                        cell.classList.add('ally');
                        entityHtml = renderEmoji('🛸');
                    }
                    
                    // Safe Enemy Finding
                    const enemy = currentEnemies.find(e => e && e.x === x && e.y === y && e.isAlive());

                    if (!entityHtml && enemy) {
                        cell.classList.add('enemy'); 
                        let stackHtml = '';
                        if (enemy.statusEffects) {
                            if (enemy.statusEffects.frostbite?.stacks) 
                                stackHtml += `<div class="absolute top-[-4px] left-[-4px] text-[10px] font-bold text-cyan-300 bg-black/80 px-1 rounded z-30 border border-cyan-500">❄️${enemy.statusEffects.frostbite.stacks}</div>`;
                            if (enemy.statusEffects.shredded?.stacks) 
                                 stackHtml += `<div class="absolute bottom-[16px] left-[-4px] text-[10px] font-bold text-orange-400 bg-black/80 px-1 rounded z-30 border border-orange-500">💔${enemy.statusEffects.shredded.stacks}</div>`;
                             if (enemy.statusEffects.poisoning?.stacks) 
                                stackHtml += `<div class="absolute top-[-4px] right-[-4px] text-[10px] font-bold text-green-300 bg-black/80 px-1 rounded z-30 border border-green-500">🤢${enemy.statusEffects.poisoning.stacks}</div>`;
                        }
                        const markIndicator = enemy.isMarked ? '<span class="absolute top-0 right-1 text-red-500 font-bold text-lg z-20">🎯</span>' : '';
                        const eEmoji = enemy.speciesData?.emoji || '👾';
                        entityHtml = `${stackHtml}${markIndicator}<div class="enemy-emoji">${renderEmoji(eEmoji)}</div><div class="enemy-hp-bar-bg z-20"><div class="enemy-hp-bar" style="width: ${ (enemy.hp / enemy.maxHp) * 100}%"></div></div>`;
                        addInfoListeners(cell, enemy, showEnemyInfo);
                    }
                    
                    const ally = player.npcAlly;
                    if (!entityHtml && ally && ally.hp > 0 && !ally.isFled && ally.x === x && ally.y === y) {
                          cell.classList.add('ally'); 
                          entityHtml = `<div class="ally-emoji">${getNpcAllyEmoji(ally)}</div> <div class="ally-hp-bar-bg z-20"><div class="ally-hp-bar" style="width: ${ (ally.hp / ally.maxHp) * 100}%"></div></div>`;
                          addInfoListeners(cell, ally, showAllyInfo);
                    }

                    // 2. OBJECTS & TRAPS
                    const gridObject = gameState.gridObjects.find(o => o && o.x === x && o.y === y);
                    
                    if (gridObject) {
                        if (gridObject.type === 'trap' || gridObject.type === 'hazard') {
                            if (gridObject.subtype === 'unstable_fire') {
                                cell.classList.add('unstable-fire');
                                trapHtml = `<div class="absolute inset-0 flex items-center justify-center text-xl opacity-90 pointer-events-none" style="z-index: 5;">${gridObject.emoji || '🔥'}</div>`;
                            }
                            else if (gridObject.subtype === 'magma') {
                                cell.classList.add('magma-pool');
                                cell.style.backgroundColor = 'rgba(200, 50, 0, 0.4)';
                                trapHtml = `<div class="absolute inset-0 flex items-center justify-center text-xl opacity-70 pointer-events-none" style="z-index: 5;">🌋</div>`;
                            }
                            else if (gridObject.subtype === 'caltrops') {
                                trapHtml = `<div class="absolute inset-0 flex items-center justify-center text-xl opacity-90 pointer-events-none" style="z-index: 5;">${gridObject.emoji || '✴️'}</div>`;
                            }
                            else if (gridObject.subtype === 'sudsy_minefield') {
                                trapHtml = `<div class="absolute inset-0 flex items-center justify-center text-xl animate-pulse pointer-events-none z-10 bg-cyan-900/30" style="box-shadow: inset 0 0 10px #22d3ee; text-shadow: 0 0 5px #22d3ee;">${gridObject.emoji || '🫧'}</div>`;
                            }
                            else if (gridObject.subtype === 'frozen_mist') {
                                trapHtml = `<div class="absolute inset-0 flex items-center justify-center text-xl opacity-80 pointer-events-none z-10 bg-white/10 animate-pulse" style="box-shadow: inset 0 0 15px rgba(200, 230, 255, 0.4);">${gridObject.emoji || '🌫️'}</div>`;
                            }
                            else if (gridObject.subtype === 'sanctuary') {
                                trapHtml = `<div class="absolute inset-0 flex items-center justify-center text-xl opacity-60 pointer-events-none z-10 bg-yellow-500/20" style="box-shadow: inset 0 0 15px rgba(253, 224, 71, 0.3);">${gridObject.emoji || '✨'}</div>`;
                            }
                            else {
                                trapHtml = `<div class="absolute inset-0 flex items-center justify-center pointer-events-none opacity-60 z-10 text-2xl animate-pulse">${gridObject.emoji || '⚠️'}</div>`;
                            }
                        }
                        else if (gridObject.type === 'obstacle' || gridObject.type === 'terrain' || gridObject.type === 'totem' || gridObject.type === 'minion') {
                            if (entityHtml) {
                                 objectHtml = `<div class="absolute bottom-0 right-0 text-sm opacity-60 z-10 pointer-events-none grayscale">${renderEmoji(gridObject.emoji || 'O')}</div>`;
                            } else {
                                 if (gridObject.subtype === 'spritefire') {
                                     cell.style.boxShadow = "inset 0 0 15px rgba(255, 100, 0, 0.3)";
                                 } else {
                                     cell.classList.add(gridObject.type);
                                 }
                                 objectHtml = renderEmoji(gridObject.emoji || 'O');
                                 
                                 if (gridObject.type === 'minion') {
                                     cell.addEventListener('click', (e) => {
                                         if(!gameState.action) showTooltip(gridObject.name, e, `Duration: ${gridObject.duration}<br>Dmg: 50% Max`);
                                     });
                                 }
                            }
                        }
                        else if (gridObject.type === 'portal') {
                            trapHtml = `<div class="absolute inset-0 flex items-center justify-center text-3xl z-10 pointer-events-none filter drop-shadow-[0_0_8px_rgba(168,85,247,1)] animate-pulse" title="${gridObject.name}">
                                ${gridObject.emoji || '🌀'}
                            </div>`;
                        }
                    }
                    cell.innerHTML = (trapHtml || '') + (objectHtml || '') + (entityHtml || '');
                    cell.addEventListener('click', () => handleCellClick(x, y));
                } else {
                    cell.classList.add('grid-cell-empty');
                }
                gridContainer.appendChild(cell);
            }
        }
        renderBattleActions(template);
        render(template);
        mainView.classList.remove('p-6'); mainView.classList.add('p-1');

    } catch (e) {
        console.error("Critical Render Crash intercepted:", e);
        // Force reset action state to prevent lock
        isProcessingAction = false;
        gameState.isPlayerTurn = true;
    }
}

function renderBattleActions(template) {
    const actionsContainer = template.getElementById('battle-actions');
    
    actionsContainer.className = 'grid grid-cols-3 gap-2 justify-items-center w-full max-w-[500px] mx-auto flex-shrink-0';
    
    let actionsHtml = '';
    
    if (player.statusEffects.swallowed) {
        actionsHtml = `<button onclick="struggleSwallow()" class="btn btn-action w-full rounded-full col-span-3 px-4 text-sm overflow-hidden text-ellipsis whitespace-nowrap">Struggle!</button>`; 
    } 
    else if (gameState.isMovementOnlyTurn) {
        actionsHtml = `
            <button onclick="battleAction('move')" class="btn btn-primary rounded-full px-3 w-full text-sm overflow-hidden text-ellipsis whitespace-nowrap col-span-3">Move (Swiftness)</button>
        `;
    }
    else {
        actionsHtml = `
            <button onclick="battleAction('move')" class="btn btn-primary rounded-full px-3 w-full text-sm overflow-hidden text-ellipsis whitespace-nowrap">Move</button>
            <button onclick="battleAction('attack')" class="btn btn-action rounded-full px-3 w-full text-sm overflow-hidden text-ellipsis whitespace-nowrap">Attack</button>
            <button onclick="battleAction('magic')" class="btn btn-magic rounded-full px-3 w-full text-sm overflow-hidden text-ellipsis whitespace-nowrap">Magic</button>
            <button onclick="battleAction('skills')" class="btn btn-primary rounded-full px-3 w-full text-sm overflow-hidden text-ellipsis whitespace-nowrap">Skills</button>
            <button onclick="battleAction('item')" class="btn btn-item rounded-full px-3 w-full text-sm overflow-hidden text-ellipsis whitespace-nowrap">Item</button>
            <button onclick="battleAction('flee')" class="btn btn-flee rounded-full px-3 w-full text-sm overflow-hidden text-ellipsis whitespace-nowrap">Flee</button>
        `;
    }
    actionsContainer.innerHTML = actionsHtml;
}
// battle.js

// --- UPDATED CLICK HANDLER (Fixed Ground Targeting for Skills) ---
function handleCellClick(x, y) {
    if (ignoreNextClick) {
        ignoreNextClick = false;
        return;
    }
    if (!gameState.isPlayerTurn || isProcessingAction) return;

    // Mobile Double Tap Logic
    const isMobile = window.innerWidth <= 768; 
    if (isMobile) {
        if (!gameState.pendingTarget || gameState.pendingTarget.x !== x || gameState.pendingTarget.y !== y) {
            gameState.pendingTarget = { x, y };
            document.querySelectorAll('.pending-confirmation').forEach(el => el.classList.remove('pending-confirmation'));
            const cell = document.querySelector(`.grid-cell[data-x="${x}"][data-y="${y}"]`);
            if (cell) cell.classList.add('pending-confirmation');
            return; 
        }
        gameState.pendingTarget = null;
        document.querySelectorAll('.pending-confirmation').forEach(el => el.classList.remove('pending-confirmation'));
    }

    const clickedEnemy = currentEnemies.find(e => e.x === x && e.y === y);
    const clickedObstacle = gameState.gridObjects.find(o => o.x === x && o.y === y && o.type === 'obstacle');
    const clickedAlly = player.npcAlly && player.npcAlly.hp > 0 && !player.npcAlly.isFled && player.npcAlly.x === x && player.npcAlly.y === y ? player.npcAlly : null;
    const isFlying = (player.race === 'Pinionfolk');

    const createGroundTarget = (gx, gy) => ({
        x: gx, y: gy, name: "Ground", isAlive: () => true, isGround: true,
        takeDamage: () => ({ damageDealt: 0, knockback: 0 }), statusEffects: {}, speciesData: { class: 'Terrain' }, rarityData: { rarityIndex: 0, key: 'common' }, isBoss: false, goldReward: 0, lootTable: {}
    });

    // --- 1. MOVE ---
    if (gameState.action === 'move') {
        if (x === player.x && y === player.y) {
            addToLog("You hold your ground.", "text-gray-400");
            const cells = document.querySelectorAll('.grid-cell');
            cells.forEach(c => c.classList.remove('walkable', 'attackable', 'magic-attackable', 'splash-targetable', 'item-attackable', 'magic-targetable-ally', 'item-targetable-ally'));
            gameState.action = null;
            gameState.isPlayerTurn = false;
            finalizePlayerAction(); 
            return;
        }

        // =====================================================================
        // [FIX] RANGE VALIDATION (Synced with movePlayer logic)
        // =====================================================================
        const dist = Math.abs(player.x - x) + Math.abs(player.y - y);
        let maxDist = player.getMovementSpeed(); // Use central logic

        // Crashing Wake Penalty (Specific to interaction, optional)
        if (player.statusEffects.drenched && player.isSkillActive('crashing_wake')) {
            maxDist = Math.floor(maxDist / 2);
        }

        if (dist > maxDist) {
            addToLog("Too far!", "text-red-400");
            return;
        }

        isProcessingAction = true;
        const cells = document.querySelectorAll('.grid-cell');
        cells.forEach(c => c.classList.remove('walkable', 'attackable', 'magic-attackable', 'splash-targetable', 'item-attackable', 'magic-targetable-ally', 'item-targetable-ally'));
        
        gameState.action = null; 
        
        movePlayer(x, y);
    }
    else if (gameState.action === 'attack') {
        let range = player.equippedWeapon.range || 1;
        
        // [FIX] EXECUTIONER'S STANCE (Normal Attack Range)
        if (player.equippedWeapon.class === 'Reaper' && player.skillToggles['force_switch_blade']) {
            range += 1;
        }

        if (player.race === 'Pinionfolk' && player.level >= 20) range += 2;
        if (player.statusEffects.bonus_range) range += player.statusEffects.bonus_range.range;
        if (player.equippedWeapon.class === 'Hammer' && player.isSkillActive('titans_range')) range += 1;
        if (player.equippedWeapon.class === 'Dagger' && player.skillToggles['daggershot_rune']) range += 2;

        if (player.equippedWeapon.class === 'Thrusting Sword' && player.skillToggles['zone_of_death']) {
            range += 1;
        }

        // Check Distance
        const dist = Math.abs(player.x - x) + Math.abs(player.y - y);
        if (dist > range) {
            addToLog("Target out of range!", "text-red-400");
            return;
        }

        if (clickedEnemy && clickedEnemy.isAlive()) {
             isProcessingAction = true;
             gameState.action = null; 
             
             // NEW: We get the index and call performAttack directly.
             // This ensures isInitiation defaults to TRUE, allowing the Barrage Loop to run.
             const targetIndex = currentEnemies.indexOf(clickedEnemy);
             
             performAttack(targetIndex).then(() => {
                 // We rely on performAttack's internal logic to call finalizePlayerAction
                 // But we can leave a safety check here if needed, 
                 // though typically performAttack handles finalization for the initiation stroke.
             });

        } else {
             addToLog("Select a valid target.", "text-gray-400");
        }
    }       
    
    else if (gameState.action === 'magic_cast') {
        const spellData = SPELLS[gameState.spellToCast];
        
        if (spellData.type === 'aoe') {
            isProcessingAction = true;
            castSpell(gameState.spellToCast, {x: x, y: y});
        } else {
             if (clickedEnemy && clickedEnemy.isAlive()) { 
                isProcessingAction = true;
                const targetIndex = currentEnemies.indexOf(clickedEnemy);
                castSpell(gameState.spellToCast, targetIndex);
            } else if (clickedAlly) {
                if (spellData.element === 'healing') {
                    isProcessingAction = true;
                    castSpell(gameState.spellToCast, -1); 
                } else {
                    addToLog("You can't cast that on your ally!", "text-red-400");
                }
            } 
            // [FIX START] Add this block to handle self-targeting
            else if (x === player.x && y === player.y) {
                if (spellData.element === 'healing') {
                    isProcessingAction = true;
                    castSpell(gameState.spellToCast, -2); // -2 is the internal index for Player
                } else {
                    addToLog("You can't cast that on yourself.", "text-gray-400");
                }
            } 
            // [FIX END]
            else {
                if (isFlying && gameState.gridObjects.some(o => o.x === x && o.y === y && o.type === 'terrain')) return;
                gameState.action = null;
                gameState.spellToCast = null;
                renderBattleGrid();
                addToLog("Casting cancelled.", "text-gray-400");
            }
        }
    }
    
    else if (gameState.action === 'skill_target') {
        const skillId = gameState.currentActiveSkill;
        let range = player.equippedWeapon.range || 1;
        
        if (player.race === 'Pinionfolk' && player.level >= 20) range += 2;
        if (player.statusEffects.bonus_range) range += player.statusEffects.bonus_range.range;
        if (player.equippedWeapon.class === 'Hammer' && player.isSkillActive('titans_range')) range += 1;
        if (player.equippedWeapon.class === 'Dagger' && player.skillToggles['daggershot_rune']) range += 2;
        if (player.equippedWeapon.class === 'Thrusting Sword' && player.skillToggles['zone_of_death']) range += 1;

        // Specific Skill Ranges (Keep these)
        if (skillId === 'misty_step' || skillId === 'thiefs_gambit') range = 5;
        else if (skillId === 'flash_point') range += 2;
        else if (skillId === 'tomahawk_hurl') {
            range += 2; 
            if (player.isSkillActive('head_hunters_discipline')) range += 1;
        }
        else if (skillId === 'buckler_toss') range += 3;
        else if (skillId === 'blink_bolt') range = 6;
        else if (skillId === 'heavy_meteoric_charge' && player.isSkillActive('titans_range')) range += 1;
        else if (skillId === 'glacial_ordnance' || skillId === 'sudsy_minefield') range = 3;
        else if (skillId === 'hoarfrost_haze' || skillId === 'miasma_of_decay') {
            range = (player.equippedWeapon.class === 'Bow') ? 2 : (player.equippedWeapon.range || 1);
        }
        else if (skillId === 'shield_bash' || skillId === 'the_iron_kiss') range = 1;
        else if (skillId === 'culling_hook') range += 1;
        else if (skillId === 'tempest_lance') {
            range += 2;
            if (player.isSkillActive('mortal_smite') && player.skillToggles['giant_hunt'] && clickedEnemy && (clickedEnemy.isBoss || clickedEnemy.rarityData?.key === 'legendary')) {
                range += 1;
            }
        }
        else if (skillId === 'gale_cannon') range = 6;
        else if (skillId === 'space_rift') range = 4;
        else if (skillId === 'gravitational_anchor') range += 2;
        else if (skillId === 'michaellas_verdict') range += 3;
        else if (skillId === 'hallowed_barrage' || skillId === 'crucible_of_bloom' || skillId === 'flowering_thunderbolt' || skillId === 'condensed_gale' || skillId === 'maelstrom_imperative') {
            const catalyst = player.equippedCatalyst;
            range = catalyst.range || 3;
            if (player.isSkillActive('spell_sniper')) range += 1;
            if (player.isSkillActive('focused_fire')) range += 1;
            if (catalyst.effect?.spell_sniper) range = Math.floor(range * (1 + catalyst.effect.spell_sniper));
            if (player.race === 'Pinionfolk' && player.level >= 20) range += 2;
        }
        else if (skillId === 'lithic_sovereign') range = 1;

        // Distance Check
        const dist = Math.abs(player.x - x) + Math.abs(player.y - y);
        if (dist > range) {
            addToLog("Target out of range!", "text-red-400");
            return;
        }

        // =====================================================================
        // [FIX] GROUND TARGETING VALIDATION
        // =====================================================================
        // 1. Define list of naturally ground-targetable skills
        const groundSkills = [
            'misty_step', 'thiefs_gambit', 'flash_point', 'hoarfrost_haze', 
            'earth_splitter', 'heavy_meteoric_charge', 'solar_prominence', 
            'impact_tremor', 'deadly_dance', 'glacial_ordnance', 
            'sudsy_minefield', 'michaellas_verdict', 'lithic_sovereign', 
            'miasma_of_decay', 'crucible_of_bloom', 'gale_cannon', 
            'maelstrom_imperative', 'space_rift', 'event_horizon'
        ];

        // 2. Check if the current skill is in that list OR matches a synergy override
        let isGroundTargetable = groundSkills.includes(skillId);

        // -> Eclipse of Steel Override
        if (skillId === 'spreadshot' && player.skillToggles['barrage'] && player.isSkillActive('longbowmans_volley')) {
            isGroundTargetable = true;
        }

        // 3. Process Ground Targeting
        if (isGroundTargetable) {
            // Special checks for movement skills
            if (['misty_step', 'thiefs_gambit'].includes(skillId) && isCellBlocked(x, y, false, player.race === 'Pinionfolk')) {
                addToLog("Cannot target blocked terrain.", "text-red-400");
                return;
            }
            
            isProcessingAction = true; 

            if (clickedEnemy && clickedEnemy.isAlive()) {
                executeActiveSkill(skillId, clickedEnemy);
            } else {
                executeActiveSkill(skillId, {x: x, y: y}); 
            }

            // Cleanup for single-use skills (Space Rift handles its own state)
            if (skillId === 'space_rift' && player.tempRiftEntrance) {
                // Do nothing, waiting for second click
            } else {
                gameState.action = null;
                gameState.currentActiveSkill = null;
            }
            
            if (skillId === 'event_horizon' && x === player.x && y === player.y) {
                executeActiveSkill(skillId, player); 
                gameState.action = null;
                gameState.currentActiveSkill = null;
            }
            return;
        }
        // =====================================================================

        // [FIX] Self-Targeting Logic
        if (x === player.x && y === player.y) {
             const selfSkills = ['aqueous_aegis', 'gore_crazed_howl', 'last_stand', 'sanctuary_of_zenith', 'banquet_of_einherjar', 'terrestrial_rejection', 'miasma_of_decay', 'aspect_of_tempest', 'event_horizon', 'self_flagellation', 'first_aid', 'meditate', 'chakra_breathing', 'flash_of_flurry'];
             
             if (selfSkills.includes(skillId)) {
                 isProcessingAction = true;
                 gameState.action = null;
                 gameState.currentActiveSkill = null;
                 executeActiveSkill(skillId, player);
                 return;
             }
        }

        // Default: Enemy Targeting
        if (clickedEnemy && clickedEnemy.isAlive()) {
             isProcessingAction = true; 
             gameState.action = null;
             gameState.currentActiveSkill = null;
             executeActiveSkill(skillId, clickedEnemy);
        } else {
            addToLog("Invalid target for this skill.", "text-gray-400");
        }
    }

    else if (gameState.action === 'item_target') {
        const itemKey = gameState.itemToUse; 
        const itemDetails = ITEMS[itemKey];

        if (itemDetails.type === 'trap') {
             isProcessingAction = true;
             const success = useItem(itemKey, true, {x: x, y: y});
             if (!success) {
                 isProcessingAction = false; 
             } else {
                 gameState.action = null;
                 gameState.itemToUse = null;
             }
             return;
        }

        if (clickedEnemy && clickedEnemy.isAlive()) { 
            if (['debuff_apply', 'debuff_special', 'enchant'].includes(itemDetails.type)) {
                isProcessingAction = true;
                const targetIndex = currentEnemies.indexOf(clickedEnemy);
                gameState.action = null; 
                gameState.itemToUse = null; 
                useItem(itemKey, true, targetIndex); 
            } else {
                addToLog("You can't use that item on an enemy!", "text-red-400");
            }
        } else if (clickedAlly) {
            if (['healing', 'mana_restore', 'buff', 'cleanse', 'cleanse_specific'].includes(itemDetails.type)) {
                isProcessingAction = true;
                gameState.action = null; 
                gameState.itemToUse = null; 
                useItem(itemKey, true, -1); 
            } else {
                addToLog("You can't use that item on your ally!", "text-red-400");
            }
        } else {
            if (isFlying && gameState.gridObjects.some(o => o.x === x && o.y === y && o.type === 'terrain')) return;
            gameState.action = null;
            gameState.itemToUse = null; 
            renderBattleGrid(); 
            addToLog("Item use cancelled.", "text-gray-400"); 
        }
    }
    
    else if (gameState.action === 'mark_target') {
         if (clickedEnemy && clickedEnemy.isAlive()) {
             isProcessingAction = true; 
             gameState.action = null; 
             
             player.mp -= player.signatureAbilityData.cost;
             player.signatureAbilityUsed = true; 
             updateStatsView();
             gameState.markedTarget = clickedEnemy; 
             clickedEnemy.isMarked = true;
             addToLog(`You mark ${clickedEnemy.name} as your prey!`, 'text-yellow-400');
             renderBattleGrid(); 
             gameState.isPlayerTurn = false; 
             finalizePlayerAction(); 
         } else {
             gameState.action = null;
             isProcessingAction = false; 
             player.signatureAbilityUsed = false;
             updateStatsView();
             renderBattleGrid(); 
             addToLog("Mark cancelled.", "text-gray-400");
             gameState.isPlayerTurn = true;
         }
    }
}
// battle.js - NEW FUNCTION

function renderVariableCostInput(skillName, mpPerUnit, unitName, target, callback) {
    // 1. Calculate Max MP usable
    const maxMp = player.mp;
    // Cap at 500 for Barrage, or player max for others
    const cap = skillName === 'Hallowed Barrage' ? Math.min(maxMp, 500) : maxMp;

    if (maxMp < mpPerUnit) {
        addToLog(`Not enough MP (Min ${mpPerUnit}).`, "text-red-400");
        return;
    }

    // 2. Create Modal HTML
    const modalId = 'variable-cost-modal';
    const existing = document.getElementById(modalId);
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = modalId;
    overlay.className = 'fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4';
    
    const initialUnits = Math.floor(cap / mpPerUnit);

    overlay.innerHTML = `
        <div class="bg-slate-900 border-2 border-yellow-500 rounded-lg p-6 max-w-sm w-full text-center shadow-[0_0_20px_rgba(234,179,8,0.3)]">
            <h3 class="font-medieval text-2xl text-yellow-300 mb-2 title-glow">${skillName}</h3>
            <p class="text-gray-400 text-sm mb-6">Channel your energy.<br>(${mpPerUnit} MP = 1 ${unitName})</p>
            
            <div class="mb-6">
                <input type="range" id="var-slider" min="${mpPerUnit}" max="${cap}" step="${mpPerUnit}" value="${cap}" 
                       class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-400">
                <div class="flex justify-between mt-2 font-bold">
                    <span class="text-blue-400"><span id="var-cost">${cap}</span> MP</span>
                    <span class="text-red-400"><span id="var-units">${initialUnits}</span> ${unitName}s</span>
                </div>
            </div>

            <div class="flex gap-4 justify-center">
                <button id="var-cancel" class="btn btn-secondary px-4 py-2">Cancel</button>
                <button id="var-confirm" class="btn btn-primary px-4 py-2 bg-yellow-700 hover:bg-yellow-600 border-yellow-800">Unleash</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    // 3. Bind Events
    const slider = overlay.querySelector('#var-slider');
    const costDisplay = overlay.querySelector('#var-cost');
    const unitsDisplay = overlay.querySelector('#var-units');
    const btnConfirm = overlay.querySelector('#var-confirm');
    const btnCancel = overlay.querySelector('#var-cancel');

    slider.oninput = () => {
        const val = parseInt(slider.value);
        costDisplay.textContent = val;
        unitsDisplay.textContent = Math.floor(val / mpPerUnit);
    };

    btnCancel.onclick = () => {
        overlay.remove();
        isProcessingAction = false; 
    };

    btnConfirm.onclick = () => {
        const finalCost = parseInt(slider.value);
        overlay.remove();
        isProcessingAction = true;
        // Trigger callback with selected cost
        callback(finalCost);
    };
}

function renderUnendingFlowInput(target) {
    // 1. Calculate Max MP (Must have at least 20 to cast)
    const maxMp = player.mp;
    if (maxMp < 20) {
        addToLog("Not enough MP (Min 20).", "text-red-400");
        return;
    }

    // 2. Create Modal HTML
    const modalId = 'unending-flow-modal';
    const existing = document.getElementById(modalId);
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = modalId;
    overlay.className = 'fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4';
    
    // Initial hits calculation based on 20 MP cost
    const initialHits = Math.floor(maxMp / 20);

    overlay.innerHTML = `
        <div class="bg-slate-900 border-2 border-cyan-500 rounded-lg p-6 max-w-sm w-full text-center shadow-[0_0_20px_rgba(6,182,212,0.3)]">
            <h3 class="font-medieval text-2xl text-cyan-300 mb-2 title-glow">Unending Flow</h3>
            <p class="text-gray-400 text-sm mb-6">Channel your energy into the blade.<br>(20 MP = 1 Strike)</p>
            
            <div class="mb-6">
                <input type="range" id="flow-slider" min="20" max="${maxMp}" step="20" value="${maxMp}" 
                       class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400">
                <div class="flex justify-between mt-2 font-bold">
                    <span class="text-blue-400"><span id="flow-cost">${maxMp}</span> MP</span>
                    <span class="text-red-400"><span id="flow-hits">${initialHits}</span> Hits</span>
                </div>
            </div>

            <div class="flex gap-4 justify-center">
                <button id="flow-cancel" class="btn btn-secondary px-4 py-2">Cancel</button>
                <button id="flow-confirm" class="btn btn-primary px-4 py-2 bg-cyan-700 hover:bg-cyan-600 border-cyan-800">Unleash</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    // 3. Bind Events
    const slider = overlay.querySelector('#flow-slider');
    const costDisplay = overlay.querySelector('#flow-cost');
    const hitsDisplay = overlay.querySelector('#flow-hits');
    const btnConfirm = overlay.querySelector('#flow-confirm');
    const btnCancel = overlay.querySelector('#flow-cancel');

    // Update display dynamically
    slider.oninput = () => {
        const val = parseInt(slider.value);
        costDisplay.textContent = val;
        hitsDisplay.textContent = Math.floor(val / 20);
    };

    // [FIX] Cancel now properly unlocks the game state
    btnCancel.onclick = () => {
        overlay.remove();
        isProcessingAction = false; 
    };

    btnConfirm.onclick = () => {
        const finalCost = parseInt(slider.value);
        overlay.remove();
        
        isProcessingAction = true;
        // Pass the chosen cost to the execute function
        executeActiveSkill('eternal_dance', target, finalCost); 
        
        gameState.action = null;
        gameState.currentActiveSkill = null;
    };
}

// battle.js
async function executeActiveSkill(skillId, target, variableCost = null) {
    const skillNode = SKILL_TREE[skillId];
    
    // 1. Enforce Requirements
    const reqCheck = checkSkillRequirements(skillId);
    if (!reqCheck.allowed) {
        addToLog(`Cannot use ${skillNode.name}: Requires ${reqCheck.required}!`, "text-red-400");
        isProcessingAction = false;
        renderBattleGrid();
        return;
    }

    let cost = skillNode.effect.cost;
    
    // Cost Modifiers
    if (player.skillToggles['the_ironeye'] && skillNode.branch === 'Dexterity') cost = Math.max(1, cost - 10);
    if (player.skillToggles['vacuum_fist'] && player.equippedWeapon.class === 'Hand-to-Hand') cost += 10;

    // Unending Flow Logic
    if (skillId === 'eternal_dance') {
        if (player.skillToggles['flowing_curvature']) {
            cost = variableCost !== null ? variableCost : 0; 
        } else {
            cost = 20;
        }
    }

    // [NEW] Void Trance Check (Stops MP consuming skills)
    if (player.skillToggles['void_trance'] && cost > 0) {
        addToLog("You cannot use MP-consuming skills while Meditating!", "text-purple-400");
        isProcessingAction = false;
        renderBattleGrid();
        return;
    }

    // Check MP
    if (cost > 0 && player.mp < cost) {
        addToLog("Not enough MP!", "text-red-400");
        isProcessingAction = false;
        renderBattleGrid();
        return;
    }

    // Pay Cost
    if (cost > 0) {
        player.mp -= cost;
        updateStatsView();
    }

    const actionType = skillNode.effect.action;
    const isHeavy = ['Hand-to-Hand', 'Longsword', 'Axe', 'Hammer', 'Lance'].includes(player.equippedWeapon.class);
    let activeArtMultiplier = 1.0;
    
    if (isHeavy && player.isSkillActive('blessing_of_giants')) {
        activeArtMultiplier = 1.20; 
    }

    // =========================================================================
    // WATER ARTS
    // =========================================================================

    // Aqueous Aegis (Bubble of Life)
    if (actionType === 'aqueous_aegis') {
        // Duration 4 ensures it lasts through the current turn + 3 enemy turns
        player.statusEffects.buff_aqueous_aegis = { 
            name: "Aqueous Aegis",
            duration: 4,
            icon: '🫧',
            description: "Negates 90% of next hit." 
        };
        addToLog(`${player.name} is surrounded by a shimmering protective bubble!`, "text-blue-300 font-bold");
        finalizePlayerAction(); 
        return;
    }

    // Glacial Ordnance (Ice Cannon)
    else if (actionType === 'glacial_ordnance') {
        if (player.weaponElement !== 'water') {
            addToLog("Requires a Water-Infused Weapon!", "text-red-400");
            player.mp += cost; 
            updateStatsView();
            isProcessingAction = false; renderBattleGrid(); return;
        }

        const targets = [];
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const tx = target.x + dx;
                const ty = target.y + dy;
                const enemy = currentEnemies.find(e => e.x === tx && e.y === ty && e.isAlive());
                if (enemy) targets.push(enemy);
            }
        }

        addToLog(`${player.name} fires a Glacial Ordnance!`, "text-cyan-300 font-bold");
        
        gameState.suppressTurnEnd = true;
        
        for (const t of targets) {
            if (!t.statusEffects.frostbite) t.statusEffects.frostbite = { stacks: 0 };
            t.statusEffects.frostbite.stacks++;
            
            await performPlayerAttack(t);
            await new Promise(r => setTimeout(r, 150)); 
        }

        gameState.suppressTurnEnd = false;
        checkBattleStatus(true);
        finalizePlayerAction();
        return;
    }
    // Sudsy Minefield (Bubble Trap)
    else if (skillId === 'sudsy_minefield') {
        if (player.weaponElement !== 'water') {
            addToLog("Hydrostatic Minefield requires a Water-Infused Weapon!", "text-red-400");
            player.mp += cost;
            updateStatsView();
            isProcessingAction = false; renderBattleGrid(); return;
        }

        const isOccupied = isCellBlocked(target.x, target.y, false, false) || (target.x === player.x && target.y === player.y) || (player.npcAlly && player.npcAlly.x === target.x && player.npcAlly.y === target.y) || currentEnemies.some(e => e.x === target.x && e.y === target.y && e.isAlive());

        if (isOccupied) {
            addToLog("You must place the minefield on an empty tile.", "text-red-400");
            player.mp += cost; isProcessingAction = false; return;
        }
        
        const existingTrap = gameState.gridObjects.find(o => o.x === target.x && o.y === target.y);
        if (existingTrap) {
            addToLog("There is already something there.", "text-red-400");
            player.mp += cost; isProcessingAction = false; return;
        }

        let dmg = rollDice(1, 6, "Hydrostatic Minefield Setup").total + player.physicalDamageBonus;
        
        gameState.gridObjects.push({
            type: 'trap',
            subtype: 'sudsy_minefield',
            x: target.x, y: target.y,
            emoji: '🫧',
            name: 'Hydrostatic Minefield',
            damageSnapshot: dmg,
            duration: 4, 
            source: player 
        });

        addToLog(`${player.name} deploys a Hydrostatic Minefield!`, "text-cyan-300");
        gameState.isPlayerTurn = false;
        renderBattleGrid();
        finalizePlayerAction();
        return;
    }

    else if (actionType === 'hoarfrost_haze') {
        if (player.weaponElement !== 'water') {
            addToLog("Frozen Armament requires a Water-Infused Weapon!", "text-red-400");
            player.mp += cost; updateStatsView();
            isProcessingAction = false; renderBattleGrid(); return;
        }

        applyStatusEffect(player, 'buff_frozen_armament', {
            name: 'Frozen Armament',
            type: 'buff',
            description: 'Weapon coated in Rime-Ice. +1d8 Water Dmg, +1 Frostbite per hit.',
            duration: 4,
            icon: '❄️',
            isFrozenArmament: true 
        }, player.name);

        const offsets = [];
        const dx = target.x - player.x;
        const dy = target.y - player.y;
        
        if (Math.abs(dx) >= Math.abs(dy)) {
            const dirX = dx >= 0 ? 1 : -1;
            offsets.push({x:0, y:0}, {x:0, y:1}, {x:0, y:-1}, {x:dirX, y:0}, {x:dirX, y:1}, {x:dirX, y:-1});
        } else {
            const dirY = dy >= 0 ? 1 : -1;
            offsets.push({x:0, y:0}, {x:1, y:0}, {x:-1, y:0}, {x:0, y:dirY}, {x:1, y:dirY}, {x:-1, y:dirY});
        }

        offsets.forEach(offset => {
            const tx = target.x + offset.x;
            const ty = target.y + offset.y;
            if (tx >= 0 && tx < gameState.gridWidth && ty >= 0 && ty < gameState.gridHeight) {
                const existingObj = gameState.gridObjects.find(o => o.x === tx && o.y === ty);
                if (existingObj && (existingObj.type === 'obstacle' || existingObj.type === 'terrain' || existingObj.type === 'totem')) return;
                if (existingObj && existingObj.subtype === 'frozen_mist') {
                    gameState.gridObjects.splice(gameState.gridObjects.indexOf(existingObj), 1);
                } 
                gameState.gridObjects.push({
                    type: 'hazard', subtype: 'frozen_mist', x: tx, y: ty, emoji: '🌫️', name: 'Frozen Mist', duration: 4, source: player
                });
            }
        });

        addToLog(`${player.name} unleashes a freezing mist and coats their weapon in ice!`, "text-cyan-300");
        gameState.isPlayerTurn = false;
        renderBattleGrid();
        finalizePlayerAction();
        return;
    }

    // =========================================================================
    // EARTH ARTS
    // =========================================================================

    else if (actionType === 'gravitational_anchor') {
        const targetLoc = { x: target.x, y: target.y }; 
        addToLog(`${player.name} manifests a gravity well!`, "text-orange-500 font-bold");
        
        player.tempAttackMods = { multiplier: 1.50 * activeArtMultiplier };
        const originalElement = player.weaponElement;
        player.weaponElement = 'earth'; 
        
        await performPlayerAttack(target);
        
        player.weaponElement = originalElement; 
        delete player.tempAttackMods;

        spawnJaggedEarthPattern(targetLoc, 'single');

        if (target.isAlive()) {
            if (player.skillToggles['geomantic_polarity']) {
                addToLog(`${target.name} is violently repelled by the inverted gravity!`, "text-orange-400");
                await applyKnockback(target, player, 2);
            } else {
                addToLog(`${target.name} is dragged by the gravity!`, "text-orange-400");
                const pullDist = 2;
                for(let i=0; i<pullDist; i++) {
                    const dx = Math.sign(player.x - target.x);
                    const dy = Math.sign(player.y - target.y);
                    const nextX = target.x + dx;
                    const nextY = target.y + dy;
                    if (!isCellBlocked(nextX, nextY, true, false, false, target)) {
                        target.x = nextX; target.y = nextY;
                        renderBattleGrid();
                        await new Promise(r => setTimeout(r, 150)); 
                    } else {
                        addToLog("The pull is obstructed.", "text-gray-500");
                        break; 
                    }
                }
            }
        }
        finalizePlayerAction();
        return;
    }
    else if (actionType === 'terrestrial_rejection') {
        const isInverted = player.skillToggles['geomantic_polarity'];
        const msg = isInverted ? "creates a vacuum with Geomantic Polarity!" : "reverses gravity with Terrestrial Rejection!";
        addToLog(`${player.name} ${msg}`, "text-orange-500 font-bold");

        spawnJaggedEarthPattern({x: player.x, y: player.y}, 'ring');

        const range = isInverted ? 2 : 1;
        const targets = [];
        
        for(let dx = -range; dx <= range; dx++){
            for(let dy = -range; dy <= range; dy++){
                if(dx===0 && dy===0) continue;
                const enemy = currentEnemies.find(e => e.x === player.x+dx && e.y === player.y+dy && e.isAlive());
                if(enemy) targets.push(enemy);
            }
        }

        if (targets.length === 0) {
            addToLog("The gravity wave ripples out, hitting nothing.", "text-gray-400");
        }

        gameState.suppressTurnEnd = true;
        for (const t of targets) {
            if (t.isAlive()) {
                player.tempAttackMods = { multiplier: 1.0 * activeArtMultiplier };
                const originalElement = player.weaponElement;
                player.weaponElement = 'earth';

                await performPlayerAttack(t);

                player.weaponElement = originalElement;
                delete player.tempAttackMods;

                if (t.isAlive()) {
                    if (isInverted) {
                        const pdx = Math.sign(player.x - t.x);
                        const pdy = Math.sign(player.y - t.y);
                        const destX = t.x + pdx;
                        const destY = t.y + pdy;
                        if (!isCellBlocked(destX, destY, true, false, false, t)) {
                            t.x = destX; t.y = destY;
                            addToLog(`${t.name} is dragged inward!`, "text-orange-300");
                            renderBattleGrid();
                        }
                    } else {
                        await applyKnockback(t, player, 2);
                    }
                }
                await new Promise(r => setTimeout(r, 100)); 
            }
        }

        gameState.suppressTurnEnd = false;
        checkBattleStatus(true);
        finalizePlayerAction();
        return;
    }
    
    else if (actionType === 'spawn_totem') {
        let targetX, targetY, enemyOnTile;

        if (target.isAlive && target.speciesData) {
            targetX = target.x; targetY = target.y; enemyOnTile = target;
        } else {
            targetX = target.x; targetY = target.y;
            enemyOnTile = currentEnemies.find(e => e.x === targetX && e.y === targetY && e.isAlive());
        }

        if (enemyOnTile) {
            addToLog(`${player.name} attempts to raise the Totem directly under ${enemyOnTile.name}!`, "text-orange-500 font-bold");

            // [LOGGING ADDED]
            const calcLog = { source: "Totem Crush", targetName: enemyOnTile.name, steps: [] };
            
            const weapon = player.equippedWeapon;
            let rawDmg = rollDice(weapon.damage[0], weapon.damage[1], "Totem Crush").total;
            calcLog.baseDamage = rawDmg;
            
            let magicDmg = Math.floor((rawDmg + player.magicalDamageBonus) * 2.0);
            calcLog.steps.push({ description: "Stat & Mult", value: `x2.0`, result: magicDmg });

            const res = enemyOnTile.takeDamage(magicDmg, { isMagic: true, element: 'earth' }, player);
            if(res.defenseSteps) calcLog.steps = calcLog.steps.concat(res.defenseSteps);
            calcLog.finalDamage = res.damageDealt;
            if(typeof logDamageCalculation === 'function') logDamageCalculation(calcLog);

            addToLog(`The earth erupts beneath them for <span class="font-bold text-purple-300">${res.damageDealt}</span> damage!`, "text-yellow-300");
            await applyKnockback(enemyOnTile, player, 1);
        }

        if (isCellBlocked(targetX, targetY, false, false)) {
            if (enemyOnTile) {
                addToLog("The enemy was too heavy to move! The Totem crumbles.", "text-red-400");
            } else {
                addToLog("Cannot summon Totem there!", "text-red-400");
                player.mp += cost; 
            }
            isProcessingAction = false; renderBattleGrid(); return;
        }

        addToLog(`${player.name} raises the Lithic Sovereign!`, "text-orange-500 font-bold title-glow");

        gameState.gridObjects.push({
            type: 'totem', subtype: 'lithic_sovereign', x: targetX, y: targetY, emoji: '🗿',
            name: 'Totem Stela', duration: 5, radius: 2, faction: 'player'
        });

        updateTotemAuras(player);
        if (player.npcAlly) updateTotemAuras(player.npcAlly);

        checkBattleStatus(true);
        finalizePlayerAction();
        return;    
    }

    // =========================================================================
    // WIND ARTS
    // =========================================================================

    else if (actionType === 'gale_cannon') {
        const dx = Math.sign(target.x - player.x);
        const dy = Math.sign(target.y - player.y);

        if (dx === 0 && dy === 0) {
            addToLog("You cannot fire the cannon at yourself.", "text-red-400");
            player.mp += cost; updateStatsView(); isProcessingAction = false; return;
        }

        addToLog(`${player.name} fires the Tempest Piercer!`, "text-cyan-300 font-bold");

        // Beam Logic
        let currentMult = 2.0; // Starts at 200%
        let currX = player.x;
        let currY = player.y;
        let hitSomething = false;

        // Visual only: Calculate end point for animation
        const maxRange = 6;

        gameState.suppressTurnEnd = true;

        for (let i = 0; i < maxRange; i++) {
            currX += dx;
            currY += dy;

            // 1. Boundary Check
            if (currX < 0 || currX >= gameState.gridWidth || currY < 0 || currY >= gameState.gridHeight) {
                addToLog("The gale dissipates against the world border.", "text-gray-500");
                break;
            }

            // 2. Obstacle Check
            const obstacle = gameState.gridObjects.find(o => o.x === currX && o.y === currY && o.type === 'obstacle');
            if (obstacle) {
                addToLog(`The gale shatters the ${obstacle.name}!`, "text-cyan-400");
                // Destroy logic
                obstacle.hp = 0;
                const idx = gameState.gridObjects.indexOf(obstacle);
                if (idx > -1) gameState.gridObjects.splice(idx, 1);
                // Obstacles stop the beam
                break; 
            }

            // 3. Enemy Check
            const enemy = currentEnemies.find(e => e.x === currX && e.y === currY && e.isAlive());
            if (enemy) {
                player.tempAttackMods = { multiplier: currentMult * activeArtMultiplier };
                
                // Force Wind Element
                const originalElement = player.weaponElement;
                player.weaponElement = 'wind';
                
                await performPlayerAttack(enemy);
                
                player.weaponElement = originalElement;
                delete player.tempAttackMods;

                // Decay Damage
                currentMult *= 0.5;
                hitSomething = true;
                
                await new Promise(r => setTimeout(r, 150));
            }
        }
        
        if (!hitSomething) {
            addToLog("The wind howls through empty space.", "text-gray-400");
        }

        renderBattleGrid();
        gameState.suppressTurnEnd = false;
        checkBattleStatus(true);
        finalizePlayerAction();
        return;
    }
    else if (actionType === 'condensed_gale') {
        // 1. Requirement Check
        if (!player.equippedCatalyst || player.equippedCatalyst.name === 'None') {
            addToLog("Condensed Gale requires a Catalyst!", "text-red-400");
            player.mp += cost; // Refund
            updateStatsView();
            isProcessingAction = false; 
            renderBattleGrid(); 
            return;
        }

        addToLog(`${player.name} hurls a compressed sphere of storm!`, "text-cyan-300 font-bold");

        // 2. Damage Calculation
        const calcLog = { 
            source: "Condensed Gale", 
            targetName: target.name, 
            steps: [] 
        };

        const cat = player.equippedCatalyst;
        const armor = player.equippedArmor;

        // A. Calculate Dice (2 Base + Amp)
        let diceCount = 2; 
        // Sum up all 'dice_amp' and 'spell_amp' sources
        const amp = (cat?.effect?.dice_amp || 0) + (cat?.effect?.spell_amp || 0) + 
                    (armor?.effect?.dice_amp || 0) + (armor?.effect?.spell_amp || 0);
        diceCount += amp;

        // B. Roll Damage
        const roll = rollDice(diceCount, 6, "Condensed Gale");
        const baseDmg = roll.total;
        
        calcLog.baseDamage = baseDmg;
        calcLog.steps.push({ 
            description: `Base Roll (${diceCount}d6)`, 
            value: roll.rolls.join('+'), 
            result: baseDmg 
        });

        // C. Magic Scaling
        const statBonus = player.magicalDamageBonus;
        const multiplier = (1 + statBonus / 20);
        const flatBonus = Math.floor(statBonus / 5);
        
        let damage = Math.floor(baseDmg * multiplier) + flatBonus;
        
        calcLog.steps.push({ 
            description: "Magic Scaling", 
            value: `x${multiplier.toFixed(2)} + ${flatBonus}`, 
            result: damage 
        });

        // D. Catalyst Elemental Boost
        if (cat?.effect?.elemental_boost === 'wind') {
            damage = Math.floor(damage * 1.15);
            calcLog.steps.push({ description: "Catalyst Boost", value: "x1.15", result: damage });
        }

        // 3. Execution
        const res = target.takeDamage(damage, { element: 'wind', isMagic: true }, player);
        
        if(res.defenseSteps) calcLog.steps = calcLog.steps.concat(res.defenseSteps);
        calcLog.finalDamage = res.damageDealt;
        if(typeof logDamageCalculation === 'function') logDamageCalculation(calcLog);

        addToLog(`${target.name} is blasted for <span class="font-bold text-cyan-300">${res.damageDealt}</span> damage!`);

        // 4. Knockback & Stun
        if (target.isAlive()) {
            // Knockback 2 tiles
            await applyKnockback(target, player, 2);

            // 20% Stun Chance
            if (player.rollForEffect(0.20, "Condensed Gale Stun")) {
                applyStatusEffect(target, 'stunned', { duration: 1 }, player.name);
                addToLog(`${target.name} is stunned by the pressure!`, "text-yellow-300 font-bold");
            }
        }

        checkBattleStatus(true);
        finalizePlayerAction();
        return;
    }
    else if (actionType === 'maelstrom_imperative') {
        // 1. Requirement Check
        if (!player.equippedCatalyst || player.equippedCatalyst.name === 'None') {
            addToLog("Maelstrom Imperative requires a Catalyst!", "text-red-400");
            player.mp += cost; 
            updateStatsView();
            isProcessingAction = false; 
            renderBattleGrid(); 
            return;
        }

        // 2. Use Target Location (Changed from Map Center)
        const cx = target.x;
        const cy = target.y;

        addToLog(`${player.name} tears open the sky at [${cx},${cy}]!`, "text-cyan-300 font-bold title-glow");

        // 3. Snapshot Amp
        const cat = player.equippedCatalyst;
        const armor = player.equippedArmor;
        const amp = (cat?.effect?.dice_amp || 0) + (cat?.effect?.spell_amp || 0) + 
                    (armor?.effect?.dice_amp || 0) + (armor?.effect?.spell_amp || 0);

        // 4. Create Object
        // Remove existing tornado (Optional: if you only want one active at a time)
        const existingIdx = gameState.gridObjects.findIndex(o => o.subtype === 'tornado');
        if (existingIdx > -1) gameState.gridObjects.splice(existingIdx, 1);

        gameState.gridObjects.push({
            type: 'hazard', 
            subtype: 'tornado',
            x: cx, 
            y: cy,
            emoji: '🌪️',
            name: 'Maelstrom',
            duration: 5,
            snapshotAmp: amp,
            source: player
        });

        // 5. Cleanup
        renderBattleGrid();
        checkBattleStatus(true);
        finalizePlayerAction();
        return;
    }

    // =========================================================================
    // FIRE ARTS
    // =========================================================================

    else if (actionType === 'solar_prominence') {
        if (player.weaponElement !== 'fire') {
            addToLog("Requires a Fire-Infused Weapon!", "text-red-400");
            player.mp += cost; updateStatsView();
            isProcessingAction = false; renderBattleGrid(); return;
        }

        const dx = Math.sign(target.x - player.x);
        const dy = Math.sign(target.y - player.y);
        
        let targets = [target];
        let tileCoords = [{x: target.x, y: target.y}];
        
        const sideOffsets = [];
        // Determine swing direction (Perpendicular to player-target line)
        if (Math.abs(dx) > Math.abs(dy)) { sideOffsets.push({x:0, y:-1}, {x:0, y:1}); } 
        else { sideOffsets.push({x:-1, y:0}, {x:1, y:0}); }

        sideOffsets.forEach(offset => {
            const sideX = target.x + offset.x;
            const sideY = target.y + offset.y;
            tileCoords.push({x: sideX, y: sideY});
            const sideEnemy = currentEnemies.find(e => e.isAlive() && e.x === sideX && e.y === sideY);
            if (sideEnemy) targets.push(sideEnemy);
        });

        addToLog(`${player.name} swings the Blade of Fire!`, "text-orange-500 font-bold");
        gameState.suppressTurnEnd = true;
        
        for (const t of targets) {
            // Updated Damage: 200% to 250%
            const varMult = 2.0 + (Math.random() * 0.5); 
            player.tempAttackMods = { multiplier: varMult * activeArtMultiplier };
            await performPlayerAttack(t);
            delete player.tempAttackMods;
            await new Promise(r => setTimeout(r, 150));
        }

        // Apply the Blade of Fire Buff
        player.statusEffects.buff_blade_of_fire = {
            name: "Blade of Fire",
            type: 'buff',
            description: "Blade covered in fire. Deals +1d8 Magical Fire dmg.",
            duration: 3,
            icon: '🔥',
            damage: [1, 8],
            element: 'fire',
            isMagic: true 
        };
        addToLog("Your blade is wreathed in everlasting flame!", "text-orange-300");

        // Maintain Synergy: Corona Ballet
        if (player.isSkillActive('corona_ballet')) {
            addToLog("The air ignites in a Corona Ballet!", "text-orange-400");
            const weapon = player.equippedWeapon;
            const trapDmg = rollDice(weapon.damage[0], weapon.damage[1], 'Corona Ballet').total + player.physicalDamageBonus;

            tileCoords.forEach(pos => {
                if (pos.x >= 0 && pos.x < gameState.gridWidth && pos.y >= 0 && pos.y < gameState.gridHeight) {
                    const obs = gameState.gridObjects.find(o => o.x === pos.x && o.y === pos.y && o.type === 'obstacle');
                    if (!obs) {
                        gameState.gridObjects.push({
                            type: 'trap', subtype: 'unstable_fire', x: pos.x, y: pos.y, duration: 2,
                            damageSnapshot: trapDmg, emoji: '🔥', name: 'Unstable Fire'
                        });
                    }
                }
            });
        }

        gameState.suppressTurnEnd = false;
        checkBattleStatus(true);
        finalizePlayerAction();
        return;
    }

    else if (actionType === 'pyroclastic_geode') {
        // 1. Check Catalyst Requirement
        if (!player.equippedCatalyst || player.equippedCatalyst.name === 'None') {
            addToLog("Pyroclastic Geode requires a Catalyst!", "text-red-400");
            isProcessingAction = false; renderBattleGrid(); return;
        }
        if (!isElementalStateActive('fire')) {
            addToLog("Pyroclastic Geode requires Fire Affinity!", "text-red-400");
            player.mp += cost; updateStatsView();
            isProcessingAction = false; renderBattleGrid(); return;
        }

        addToLog(`${player.name} plants a catastrophe!`, "text-orange-500 font-bold");

        // 2. CALCULATE TOTAL AMP (Checks both 'dice_amp' and 'spell_amp')
        const cat = player.equippedCatalyst;
        const arm = player.equippedArmor;
        
        let totalAmp = 0;
        // Catalyst
        if (cat.effect) {
            totalAmp += (cat.effect.dice_amp || 0);
            totalAmp += (cat.effect.spell_amp || 0);
        }
        // Armor
        if (arm.effect) {
            totalAmp += (arm.effect.dice_amp || 0);
            totalAmp += (arm.effect.spell_amp || 0);
        }

        // 3. INITIAL DAMAGE: (2 + Amp)d6
        const calcLog = { source: "Pyroclastic Geode", targetName: target.name || "Ground", steps: [] };
        
        const initialDiceCount = 2 + totalAmp;
        const roll = rollDice(initialDiceCount, 6, "Geode Impact");
        
        calcLog.baseDamage = roll.total;
        calcLog.steps.push({ description: `Base (${initialDiceCount}d6)`, value: roll.rolls.join('+'), result: roll.total });

        // Apply Magic Scaling Formula: (Roll * (1 + Int/20)) + (Int/5)
        const statBonus = player.magicalDamageBonus;
        const scaleMult = 1 + (statBonus / 20);
        const flatBonus = Math.floor(statBonus / 5);

        const magicDmg = Math.floor(roll.total * scaleMult) + flatBonus;
        calcLog.steps.push({ description: "Magic Scaling", value: `(x${scaleMult.toFixed(2)}) + ${flatBonus}`, result: magicDmg });

        // Deal Initial Damage
        if (target.isAlive && target.isAlive()) {
             const res = target.takeDamage(magicDmg, { element: 'fire', isMagic: true }, player);
             if(res.defenseSteps) calcLog.steps = calcLog.steps.concat(res.defenseSteps);
             calcLog.finalDamage = res.damageDealt;
             addToLog(`The geode strikes ${target.name} for <span class="font-bold text-orange-300">${res.damageDealt}</span> damage!`, "text-orange-200");
        }
        
        if(typeof logDamageCalculation === 'function') logDamageCalculation(calcLog);

        // 4. SETUP EXPLOSION (Calculates Dice for Next Turn)
        // Explosion Dice: 1 + (Amp / 2)
        const explosionDice = 1 + Math.floor(totalAmp / 2);
        
        // [NEW LOGIC] Check for Continuous Magma
        let geodeDuration = 1;
        let extraExplosion = false;

        if (player.isSkillActive('continuous_magma')) {
            // "Magmatic Grenade explodes twice" -> We flag it to respawn after the first boom
            extraExplosion = true; 
            // "All Magma based skills now have +1 lifespan" -> Applies to the object itself if needed,
            // but for Geode, we want it to explode NEXT turn, then Respawn. 
            // Increasing duration directly delays the boom, so we keep duration 1 but add the respawn flag.
        }

        gameState.gridObjects.push({
            type: 'trap', 
            subtype: 'pyroclastic_geode', 
            x: target.x, 
            y: target.y, 
            emoji: '💥', 
            name: 'Volatile Geode', 
            duration: geodeDuration, 
            source: player, 
            storedDice: explosionDice,
            // [NEW]
            shouldRespawn: extraExplosion 
        });

        addToLog("A Volatile Geode is planted, pulsating with heat...", "text-orange-400 italic");
        checkBattleStatus(true);
        finalizePlayerAction();
        return;
    }
    if (actionType === 'valkyrie_of_flame') {
        if (!isElementalStateActive('fire')) {
             addToLog("Valkyrie of Flame requires Fire Affinity (Weapon, Armor, Shield, or Catalyst)!", "text-red-400");
             player.mp += cost; updateStatsView();
             isProcessingAction = false; renderBattleGrid(); return;
        }

        addToLog(`${player.name} raises a hand, summoning the daughters of ash!`, "text-orange-500 font-bold title-glow");

        // 1. Identify valid spawn points (Adjacent to player)
        const spawnOffsets = [
            {x:0, y:1}, {x:0, y:-1}, {x:1, y:0}, {x:-1, y:0}, 
            {x:1, y:1}, {x:1, y:-1}, {x:-1, y:1}, {x:-1, y:-1}
        ];
        
        // Shuffle offsets
        for (let i = spawnOffsets.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [spawnOffsets[i], spawnOffsets[j]] = [spawnOffsets[j], spawnOffsets[i]];
        }

        let count = 0;
        const maxSprites = 3;
        
        // Snapshot stats
        const statSnapshot = player.physicalDamageBonus;

        for (const off of spawnOffsets) {
            if (count >= maxSprites) break;
            
            const sx = player.x + off.x;
            const sy = player.y + off.y;

            // Check if space is strictly empty (no entities, no obstacles)
            const isBlocked = isCellBlocked(sx, sy, false, false) || 
                              currentEnemies.some(e => e.x === sx && e.y === sy) ||
                              (player.npcAlly && player.npcAlly.x === sx && player.npcAlly.y === sy);

            if (!isBlocked) {
                // Remove any existing non-blocking hazards to be safe
                const existingIdx = gameState.gridObjects.findIndex(o => o.x === sx && o.y === sy);
                if (existingIdx > -1) gameState.gridObjects.splice(existingIdx, 1);

                gameState.gridObjects.push({
                    type: 'minion',
                    subtype: 'spritefire',
                    name: 'Spritefire',
                    emoji: '🧚‍♀️', 
                    x: sx, 
                    y: sy,
                    duration: 3,
                    faction: 'player',
                    weaponSnapshot: JSON.parse(JSON.stringify(player.equippedWeapon)),
                    statBonusSnapshot: statSnapshot
                });
                count++;
            }
        }

        if (count > 0) {
            addToLog(`${count} Spritefires materialize from the heat!`, "text-yellow-300");
        } else {
            addToLog("There is no room for the flames to take shape.", "text-gray-400");
        }

        gameState.isPlayerTurn = false;
        renderBattleGrid();
        finalizePlayerAction();
        return;
    }

    // =========================================================================
    // LIGHTNING ARTS
    // =========================================================================

    else if (actionType === 'wrath_of_keraunos') {
        // 1. Log the skill
        addToLog(`${player.name} calls down the Wrath of Keraunos!`, "text-blue-400 font-bold title-glow");

        // 2. Setup the 150% Initial Strike
        player.tempAttackMods = { 
            multiplier: 1.5 * activeArtMultiplier 
        };
        
        // Force Lightning element for the main hit (optional, but fits the theme)
        const originalElement = player.weaponElement;
        player.weaponElement = 'lightning'; 

        // 3. Execute Attack
        await performPlayerAttack(target);

        // 4. Cleanup
        player.weaponElement = originalElement;
        delete player.tempAttackMods;

        // 5. Apply the Buff (The "Link" to FollowUpSources)
        // This buff key ('buff_keraunos_charge') MUST match the condition you added in performPlayerAttack
        applyStatusEffect(player, 'buff_keraunos_charge', {
            name: "Keraunos' Charge",
            type: 'buff',
            description: 'Weapon crackles with electricity. +1d8 Lightning Dmg on hit.',
            duration: 4,
            icon: '⚡',
            // These properties are for display; the actual damage logic is now handled by followUpSources
            damage: [1, 8], 
            element: 'lightning'
        }, player.name);

        addToLog("Your weapon hums with the storm's fury!", "text-yellow-200");

        finalizePlayerAction();
        return;
    }

    else if (actionType === 'aspect_of_tempest') {
        addToLog(`${player.name} becomes the Aspect of the Tempest!`, "text-blue-400 font-bold title-glow");
        
        applyStatusEffect(player, 'buff_stormhearted', {
            name: "Stormhearted",
            type: 'buff',
            description: '+50% Dmg, +1 Move. Weak to Earth/Lightning.',
            duration: 4,
            icon: '🌩️'
        }, player.name);

        finalizePlayerAction();
        return;
    }
    else if (actionType === 'blink_bolt') {
        // --- FIX START: Define 'skill' so we can read the cost ---
        const skillId = gameState.currentActiveSkill;
        const skill = SKILL_TREE[skillId];
        const baseCost = skill ? (skill.cost || 30) : 30; // Safety fallback
        // --- FIX END ---

        // 1. Validate Geometry (Straight Line Only)
        const dx = target.x - player.x;
        const dy = target.y - player.y;
        
        if (dx !== 0 && dy !== 0) {
            addToLog("Thunderclap Flash must be performed in a straight line!", "text-red-400");
            player.mp += baseCost; 
            updateStatsView();
            isProcessingAction = false; renderBattleGrid(); return;
        }

        // 2. Calculate Distance & Path
        const totalDist = Math.abs(dx) + Math.abs(dy);
        const travelDist = totalDist - 1; 

        if (travelDist < 1) {
            addToLog("Target is too close to dash.", "text-red-400");
            player.mp += baseCost; 
            updateStatsView();
            isProcessingAction = false; renderBattleGrid(); return;
        }

        // 3. Variable Cost Check
        const extraCost = travelDist * 10;
        if (player.mp < extraCost) {
            addToLog(`Not enough MP for this distance! Need ${extraCost} more.`, "text-red-400");
            player.mp += baseCost; 
            updateStatsView();
            isProcessingAction = false; renderBattleGrid(); return;
        }

        // 4. Pre-calculate the Path & Obstacles
        const stepX = Math.sign(dx);
        const stepY = Math.sign(dy);
        let checkX = player.x;
        let checkY = player.y;
        const dashPath = []; 

        let pathBlocked = false;

        for (let i = 0; i < travelDist; i++) {
            checkX += stepX;
            checkY += stepY;
            
            if (isCellBlocked(checkX, checkY, false, player.race === 'Pinionfolk')) {
                pathBlocked = true;
                break;
            }
            dashPath.push({ x: checkX, y: checkY });
        }

        if (pathBlocked) {
            addToLog("The path is obstructed!", "text-red-400");
            player.mp += baseCost; 
            updateStatsView();
            isProcessingAction = false; renderBattleGrid(); return;
        }

        // === EXECUTION ===
        
        // A. Pay Variable Cost
        player.mp -= extraCost; 
        updateStatsView();

        addToLog(`You flash across the gap!`, "text-cyan-300 font-bold");

        // B. ANIMATED MOVEMENT LOOP
        for (const step of dashPath) {
            player.x = step.x;
            player.y = step.y;
            renderBattleGrid(); 
            await new Promise(resolve => setTimeout(resolve, 40)); 
        }

        player.tilesMovedThisTurn += travelDist; 

        // C. Trigger Voltaic Momentum
        if (player.isSkillActive('voltaic_momentum')) {
            const charges = Math.min(5, (player.staticCharge || 0) + travelDist);
            player.staticCharge = charges;
            addToLog(`Static Charge builds from the speed! (${player.staticCharge})`, "text-yellow-300");
        }

        // D. Calculate Damage
        const dmgMult = 1.5 + (0.30 * travelDist);
        
        player.tempAttackMods = { 
            multiplier: dmgMult * activeArtMultiplier 
        };
        
        const originalElement = player.weaponElement;
        player.weaponElement = 'lightning';

        // E. Perform Attack
        await performPlayerAttack(target);

        // F. Cleanup
        player.weaponElement = originalElement;
        delete player.tempAttackMods;

        // G. Synergy
        if (target.isAlive() && player.isSkillActive('jolting_pressure')) {
             applyStatusEffect(target, 'jolted', { duration: 3, source: player.name }, "Thunderclap Flash");
             addToLog(`${target.name} is left Jolted by the aftershock!`, "text-yellow-200");
        }

        renderBattleGrid();
        checkBattleStatus(true);
        finalizePlayerAction();
        return;
    }
    else if (actionType === 'flowering_thunderbolt') {
        // 1. Requirement: Catalyst
        if (!player.equippedCatalyst || player.equippedCatalyst.name === 'None') {
            addToLog("Fulgurous Bloom requires a Catalyst!", "text-red-400");
            player.mp += cost; // Refund
            updateStatsView();
            isProcessingAction = false; 
            renderBattleGrid(); 
            return;
        }

        addToLog(`${player.name} plants the seed of thunder!`, "text-yellow-300 font-bold");

        // 2. Calculation (Standard Magic Formula)
        const calcLog = { 
            source: "Fulgurous Bloom", 
            targetName: target.name, 
            steps: [] 
        };

        const cat = player.equippedCatalyst;
        const armor = player.equippedArmor;

        // A. Determine Dice Count
        let diceCount = 2; 
        const spellAmp = (cat?.effect?.spell_amp || 0) + (armor?.effect?.spell_amp || 0);
        diceCount += spellAmp;

        // B. Roll Damage
        let roll = rollDice(diceCount, 8, "Fulgurous Bloom");
        let baseDmg = roll.total;
        
        calcLog.baseDamage = baseDmg;
        calcLog.steps.push({ 
            description: `Base Roll (${diceCount}d8)`, 
            value: roll.rolls.join('+'), 
            result: baseDmg 
        });

        // C. Magic Scaling
        const statBonus = player.magicalDamageBonus;
        const multiplier = (1 + statBonus / 20);
        const flatBonus = Math.floor(statBonus / 5);
        
        let damage = Math.floor(baseDmg * multiplier) + flatBonus;
        
        calcLog.steps.push({ 
            description: "Magic Scaling", 
            value: `x${multiplier.toFixed(2)} + ${flatBonus}`, 
            result: damage 
        });

        // D. Multipliers
        if (cat?.effect?.elemental_boost === 'lightning') {
            damage = Math.floor(damage * 1.15);
            calcLog.steps.push({ description: "Catalyst Boost", value: "x1.15", result: damage });
        }
        if (player.race === 'Dragonborn') {
            const dragonBonus = (player.level >= 20 ? 1.20 : 1.10);
            damage = Math.floor(damage * dragonBonus);
            calcLog.steps.push({ description: "Dragonborn", value: `x${dragonBonus}`, result: damage });
        }
        if (typeof applyVoltaicMomentum === 'function') {
             damage = applyVoltaicMomentum(damage, 'lightning', calcLog);
        }

        // E. Defense Calculation (Log Only)
        let targetDef = target.magicalDefense || 0;
        const pierce = (cat?.effect?.armorPierce || 0);
        if (pierce > 0) targetDef -= Math.floor(targetDef * pierce);
        
        const predictedFinal = Math.max(1, damage - targetDef);
        calcLog.steps.push({ 
            description: "Target Mag Def", 
            value: `-${targetDef}`, 
            result: predictedFinal 
        });

        // 3. Apply Status Effect (Conductive Pollen)
        // [FIX] Use global 'applyStatusEffect' instead of 'target.applyStatusEffect'
        if (target && target.isAlive() && typeof applyStatusEffect === 'function') {
            applyStatusEffect(target, 'conductive_pollen', {
                name: "Conductive Pollen",
                duration: 4, 
                icon: '🌸',
                description: "Lightning Dmg Taken +25%",
                elemental_vuln: { amount: 0.25 } // Engine reads this for damage calc
            });

            addToLog(`${target.name} is coated in Conductive Pollen!`, "text-pink-300");

            calcLog.steps.push({
                description: "Effect Applied",
                value: "Conductive Pollen",
                result: "4 Turns"
            });
        }

        // 4. Execution
        if (typeof logDamageCalculation === 'function') {
            calcLog.finalDamage = predictedFinal; 
            logDamageCalculation(calcLog);
        }

        const res = target.takeDamage(damage, { element: 'lightning', isMagic: true }, player);
        
        renderBattleGrid();
        checkBattleStatus(true);
        finalizePlayerAction();
        return;
    }


    // =========================================================================
    // NATURE ARTS
    // =========================================================================

    else if (actionType === 'miasma_of_decay') {
        if (player.weaponElement !== 'nature') {
            addToLog("Miasma of Decay requires a Nature-Infused Weapon!", "text-red-400");
            player.mp += cost; updateStatsView();
            isProcessingAction = false; renderBattleGrid(); return;
        }

        applyStatusEffect(player, 'buff_decaying_touch', {
            name: 'Decaying Touch',
            type: 'buff',
            description: 'Weapon coated in rot. +1d8 Nature Dmg.',
            duration: 4,
            icon: '🤢',
            damage: [1, 8], 
            element: 'nature'
        }, player.name);

        const offsets = [];
        const dx = target.x - player.x;
        const dy = target.y - player.y;
        
        if (Math.abs(dx) >= Math.abs(dy)) {
            const dirX = dx >= 0 ? 1 : -1;
            offsets.push({x:0, y:0}, {x:0, y:1}, {x:0, y:-1}, {x:dirX, y:0}, {x:dirX, y:1}, {x:dirX, y:-1});
        } else {
            const dirY = dy >= 0 ? 1 : -1;
            offsets.push({x:0, y:0}, {x:1, y:0}, {x:-1, y:0}, {x:0, y:dirY}, {x:1, y:dirY}, {x:-1, y:dirY});
        }

        offsets.forEach(offset => {
            const tx = target.x + offset.x;
            const ty = target.y + offset.y;
            if (tx >= 0 && tx < gameState.gridWidth && ty >= 0 && ty < gameState.gridHeight) {
                const existingObj = gameState.gridObjects.find(o => o.x === tx && o.y === ty);
                if (existingObj && (existingObj.type === 'obstacle' || existingObj.type === 'terrain' || existingObj.type === 'totem')) return; 
                if (existingObj) gameState.gridObjects.splice(gameState.gridObjects.indexOf(existingObj), 1);
                
                gameState.gridObjects.push({
                    type: 'hazard', subtype: 'poison_mist', x: tx, y: ty, emoji: '🤢', name: 'Miasma', duration: 4, source: player
                });
            }
        });

        addToLog(`${player.name} exhales a cloud of decay!`, "text-green-400 font-bold");
        gameState.isPlayerTurn = false;
        renderBattleGrid();
        finalizePlayerAction();
        return;
    }    
    else if (actionType === 'crucible_of_bloom') {
        if (!player.equippedCatalyst || player.equippedCatalyst.name === 'None') {
            addToLog("Crucible of Bloom requires a Catalyst!", "text-red-400");
            player.mp += cost; updateStatsView();
            isProcessingAction = false; renderBattleGrid(); return;
        }

        addToLog(`${player.name} sows the seeds of the Crucible!`, "text-green-400 font-bold");
        
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const tx = target.x + dx;
                const ty = target.y + dy;
                if (tx >= 0 && tx < gameState.gridWidth && ty >= 0 && ty < gameState.gridHeight) {
                    const existingIdx = gameState.gridObjects.findIndex(o => o.x === tx && o.y === ty && (o.type === 'hazard' || o.type === 'trap'));
                    if (existingIdx > -1) gameState.gridObjects.splice(existingIdx, 1);

                    const obstacle = gameState.gridObjects.find(o => o.x === tx && o.y === ty && (o.type === 'obstacle' || o.type === 'terrain' || o.type === 'totem'));
                    if (!obstacle) {
                        gameState.gridObjects.push({
                            type: 'hazard', subtype: 'blooming_powder', x: tx, y: ty, emoji: '🌸',
                            name: 'Blooming Powder', duration: 4, source: player
                        });
                    }
                }
            }
        }

        gameState.isPlayerTurn = false;
        renderBattleGrid();
        finalizePlayerAction();
        return;
    }
    else if (actionType === 'carrion_bloom') {
        if (player.weaponElement !== 'nature') {
            addToLog("Carrion Bloom requires a Nature-Infused Weapon!", "text-red-400");
            player.mp += cost; updateStatsView();
            isProcessingAction = false; renderBattleGrid(); return;
        }

        addToLog(`${player.name} strikes to force the bloom!`, "text-green-400 font-bold");

        player.tempAttackMods = { multiplier: 0.5 * activeArtMultiplier };
        await performPlayerAttack(target);
        delete player.tempAttackMods;

        if (target.isAlive()) {
            let totalDetonationDamage = 0;
            let bloomLog = [];

            if (target.statusEffects.poison) {
                const p = target.statusEffects.poison;
                const percent = target.isBoss ? 0.01 : 0.05;
                const dmgPerTurn = p.damage || Math.max(1, Math.floor(target.maxHp * percent));
                totalDetonationDamage += (dmgPerTurn * p.duration);
                bloomLog.push(`Poison`);
                delete target.statusEffects.poison;
            }
            if (target.statusEffects.toxic) {
                const t = target.statusEffects.toxic;
                const percent = target.isBoss ? 0.02 : 0.10;
                const dmgPerTurn = t.damage || Math.max(1, Math.floor(target.maxHp * percent));
                totalDetonationDamage += (dmgPerTurn * t.duration);
                bloomLog.push(`Toxin`);
                delete target.statusEffects.toxic;
            }
            if (target.statusEffects.decaying_poison) {
                const d = target.statusEffects.decaying_poison;
                const stacks = d.stacks || 1;
                const basePercent = target.isBoss ? 0.01 : 0.05;
                const dmgPerTurn = Math.max(1, Math.floor(target.maxHp * (basePercent * stacks)));
                totalDetonationDamage += (dmgPerTurn * d.duration);
                bloomLog.push(`Decay x${stacks}`);
                delete target.statusEffects.decaying_poison;
            }

            if (totalDetonationDamage > 0) {
                await new Promise(r => setTimeout(r, 250));
                
                // [LOGGING ADDED]
                const calcLog = { source: "Carrion Detonation", targetName: target.name, steps: [], baseDamage: totalDetonationDamage };
                calcLog.steps.push({ description: `Consume ${bloomLog.join('+')}`, value: totalDetonationDamage, result: totalDetonationDamage });

                addToLog(`The seeds bloom instantly!`, "text-pink-400 font-bold title-glow");
                const res = target.takeDamage(totalDetonationDamage, { element: 'nature', isMagic: true }, player);
                
                if(res.defenseSteps) calcLog.steps = calcLog.steps.concat(res.defenseSteps);
                calcLog.finalDamage = res.damageDealt;
                if(typeof logDamageCalculation === 'function') logDamageCalculation(calcLog);

                addToLog(`Deal <span class="font-bold text-red-500">${res.damageDealt}</span> damage!`, "text-pink-300");

                if (player.isSkillActive('symbiosis_of_decay')) {
                    const heal = Math.floor(res.damageDealt * 0.5);
                    if (heal > 0) {
                        player.hp = Math.min(player.maxHp, player.hp + heal);
                        addToLog(`Symbiosis: <span class="text-green-300">(+${heal} HP)</span>`, "text-green-200");
                        updateStatsView();
                    }
                }
            } else {
                addToLog("But there were no seeds of decay to bloom.", "text-gray-400");
            }
        }

        checkBattleStatus(true);
        finalizePlayerAction();
        return;
    }

    // =========================================================================
    // LIGHT ARTS
    // =========================================================================

    else if (actionType === 'hallowed_ground') {
        trySpawnDivineSeal();
        const radius = 5; 
        addToLog("You sanctify the earth beneath your feet!", "text-yellow-300 font-bold");
        
        let potentialTargets = [player];
        if (player.npcAlly && player.npcAlly.isAlive()) potentialTargets.push(player.npcAlly);

        let cleansedCount = 0;
        potentialTargets.forEach(unit => {
            const dist = Math.abs(unit.x - player.x) + Math.abs(unit.y - player.y);
            if (dist <= radius) {
                let unitCleansed = false;
                CLEANSABLE_DEBUFFS.forEach(debuff => {
                    if (unit.statusEffects[debuff]) {
                        delete unit.statusEffects[debuff];
                        unitCleansed = true;
                    }
                });
                if (unitCleansed) {
                    addToLog(`${unit.name} is purified of corruption!`, "text-blue-300");
                    cleansedCount++;
                }
            }
        });

        if (cleansedCount > 0) renderBattleGrid(); 
        else addToLog("The light shines bright, but there is nothing to cleanse.", "text-gray-400");
        
        checkBattleStatus(true); finalizePlayerAction(); return;
    }
    else if (actionType === 'hallowed_barrage') {
        if (!player.equippedCatalyst || player.equippedCatalyst.name === 'None') {
            addToLog("Hallowed Barrage requires a Catalyst!", "text-red-400");
            isProcessingAction = false; return;
        }

        if (variableCost === null) {
            renderVariableCostInput("Hallowed Barrage", 20, "Bolt", target, (selectedCost) => {
                executeActiveSkill('hallowed_barrage', target, selectedCost);
            });
            return;
        }

        cost = variableCost;
        if (player.mp < cost) {
             addToLog("Not enough MP!", "text-red-400");
             isProcessingAction = false; renderBattleGrid(); return;
        }
        
        player.mp -= cost;
        updateStatsView();

        const hits = Math.floor(cost / 20);
        addToLog(`${player.name} channels Hallowed Barrage! (${hits} Bolts)`, "text-yellow-200 font-bold");

        gameState.suppressTurnEnd = true;
        
        // Save state to restore after barrage
        const originalElement = player.weaponElement;

        for(let i=0; i<hits; i++) {
            if(target.isAlive && !target.isAlive()) break; 

            // 1. Force Light Element
            player.weaponElement = 'light';

            // 2. Setup the Skill Modifier
            // We use 0.40 multiplier to match your old code (40% scaling)
            player.tempAttackMods = {
                skillName: "Hallowed Barrage",
                multiplier: 0.40, 
                description: `Hallowed Bolt (${i+1}/${hits})`
            };

            // 3. Execute Attack
            // isInitiation: false (Skipps range checks/start turn logic)
            // strikeIndex: 2 (Prevents "Double Strike" weapon perks from triggering on every single bolt)
            await performAttack(target, { 
                isInitiation: false, 
                strikeIndex: 2 
            });

            // Small delay between bolts for visual flair
            await new Promise(r => setTimeout(r, 100));
        }

        // Restore State
        player.weaponElement = originalElement;
        delete player.tempAttackMods;

        gameState.suppressTurnEnd = false;
        checkBattleStatus(true);
        finalizePlayerAction();
        return;
    }

    else if (actionType === 'michaellas_verdict') {
        // 1. Log Start
        addToLog(`${player.name} calls down Michaella's Verdict!`, "text-yellow-100 font-bold title-glow");
        gameState.suppressTurnEnd = true;

        // 2. Define Tiles (3x3 + Cross)
        let affectedTiles = [];
        for(let dx=-1; dx<=1; dx++) {
            for(let dy=-1; dy<=1; dy++) {
                affectedTiles.push({x: target.x + dx, y: target.y + dy});
            }
        }
        affectedTiles.push(
            {x: target.x, y: target.y - 2}, 
            {x: target.x, y: target.y + 2}, 
            {x: target.x - 2, y: target.y}, 
            {x: target.x + 2, y: target.y}
        );

        // 3. Save State
        const originalElement = player.weaponElement;

        for (const tile of affectedTiles) {
            if (tile.x < 0 || tile.x >= gameState.gridWidth || tile.y < 0 || tile.y >= gameState.gridHeight) continue;

            const enemy = currentEnemies.find(e => e.x === tile.x && e.y === tile.y && e.isAlive());
            
            if (enemy) {
                // --- SETUP FOR PERFORM ATTACK ---
                
                // A. Force Light Element
                player.weaponElement = 'light';

                // B. Set the Flag so performAttack triggers the Follow-Up
                player.tempAttackMods = {
                    skillName: "Michaella's Verdict",
                    description: "Michaella's Verdict" // Label for the main hit log
                };

                // C. Execute
                // performAttack sees the flag -> adds 2d8/2d10 -> calculates -> logs it all
                await performAttack(enemy);

                // D. Cleanse/Strip Logic
                let stripped = false;
                for (const key in enemy.statusEffects) {
                    if (key.startsWith('buff_')) {
                        delete enemy.statusEffects[key];
                        stripped = true;
                    }
                }
                if (stripped) addToLog(`Buffs stripped from ${enemy.name}!`, "text-purple-300 text-xs");
            }

            // --- ALLY CLEANSE ---
            let alliesAtTile = [];
            if (player.x === tile.x && player.y === tile.y) alliesAtTile.push(player);
            if (player.npcAlly && player.npcAlly.x === tile.x && player.npcAlly.y === tile.y) alliesAtTile.push(player.npcAlly);

            for (const ally of alliesAtTile) {
                let cleansed = false;
                CLEANSABLE_DEBUFFS.forEach(debuff => {
                    if (ally.statusEffects[debuff]) {
                        delete ally.statusEffects[debuff];
                        cleansed = true;
                    }
                });
                if (cleansed) addToLog(`${ally.name} is absolved of ailments!`, "text-green-300");
            }
            
            // Clean up temp mods immediately after hit so they don't leak
            delete player.tempAttackMods;

            if (enemy || alliesAtTile.length > 0) {
                await new Promise(r => setTimeout(r, 150));
            }
        }

        // 4. Final Cleanup
        player.weaponElement = originalElement;
        delete player.tempAttackMods; // Final safety delete

        gameState.suppressTurnEnd = false;
        checkBattleStatus(true);
        finalizePlayerAction();
        return;
    }

    else if (actionType === 'sanctuary_of_zenith') {
        trySpawnDivineSeal();
        addToLog(`${player.name} consecrates the Sanctuary of Zenith!`, "text-yellow-200 font-bold title-glow");

        for(let dx=-1; dx<=1; dx++) {
            for(let dy=-1; dy<=1; dy++) {
                const tx = player.x + dx; const ty = player.y + dy;
                if (tx >= 0 && tx < gameState.gridWidth && ty >= 0 && ty < gameState.gridHeight) {
                    const existingIdx = gameState.gridObjects.findIndex(o => o.x === tx && o.y === ty && (o.type === 'hazard' || o.type === 'trap'));
                    if (existingIdx > -1) gameState.gridObjects.splice(existingIdx, 1);

                    const obstacle = gameState.gridObjects.find(o => o.x === tx && o.y === ty && (o.type === 'obstacle' || o.type === 'terrain'));
                    if (!obstacle) {
                        gameState.gridObjects.push({
                            type: 'hazard', subtype: 'sanctuary', x: tx, y: ty, emoji: '✨', name: 'Sanctuary', duration: 4
                        });
                    }
                }
            }
        }
        renderBattleGrid();
        finalizePlayerAction();
        return;
    }
    else if (actionType === 'banquet_of_einherjar') {
        trySpawnDivineSeal();
        addToLog(`${player.name} begins preparing the Banquet of the Einherjar!`, "text-yellow-200 font-bold title-glow");
        addToLog("You are rooted in prayer...", "text-gray-400");

        player.statusEffects.preparing_feast = { duration: 2, name: "Preparing Feast", icon: "🍲" };
        player.statusEffects.rooted = { duration: 2 };

        finalizePlayerAction();
        return;
    }

    // =========================================================================
    // VOID ARTS
    // =========================================================================
    else if (actionType === 'nullity_sphere') {
        const catalyst = player.equippedCatalyst;
        if (!catalyst || catalyst.name === 'None') {
            addToLog("Nullity Sphere requires a Catalyst!", "text-red-400");
            isProcessingAction = false; renderBattleGrid(); return;
        }

        const hpCost = Math.floor(player.maxHp * 0.20);
        if (player.hp <= hpCost) {
            addToLog("You don't have enough life force to sacrifice!", "text-red-400");
            isProcessingAction = false; renderBattleGrid(); return;
        }

        let spellRange = catalyst.range || 3;
        if (player.isSkillActive('spell_sniper')) spellRange += 1;
        if (player.isSkillActive('focused_fire')) spellRange += 1;
        if (player.race === 'Pinionfolk' && player.level >= 20) spellRange += 2;
        if (catalyst.effect?.spell_sniper) spellRange *= (1 + catalyst.effect.spell_sniper);

        const dist = Math.abs(player.x - target.x) + Math.abs(player.y - target.y);
        if (dist > spellRange) {
            addToLog("Target is out of range!", "text-red-400");
            isProcessingAction = false; renderBattleGrid(); return;
        }

        addToLog(`${player.name} sacrifices <span class="text-red-400">${hpCost} HP</span> to condense the void...`, "text-purple-300");
        player.hp -= hpCost;
        updateStatsView();

        await new Promise(r => setTimeout(r, 300));

        // [LOGGING ADDED] - Corrected Logic
        const calcLog = { source: "Nullity Sphere", targetName: target.name, steps: [] };

        let diceCount = 2;
        const gearAmp = (catalyst.effect?.spell_amp || 0) + (player.equippedArmor?.effect?.spell_amp || 0);
        const inheritedAmp = Math.floor(gearAmp * 0.5);
        diceCount += inheritedAmp;
        
        calcLog.steps.push({ description: `Dice Count (2 Base + ${inheritedAmp} Amp)`, value: diceCount, result: "" });

        const rollObj = rollDice(diceCount, 8, "Nullity Sphere");
        calcLog.steps.push({ description: "Base Roll", value: rollObj.rolls.join('+'), result: rollObj.total });
        
        const statBonus = player.magicalDamageBonus;
        let magicDmg = Math.floor(rollObj.total * (1 + statBonus / 20)) + Math.floor(statBonus / 5);
        calcLog.steps.push({ description: "Stat Scaling", value: `Magical Bonus`, result: magicDmg });

        let totalDamage = magicDmg + hpCost;
        calcLog.steps.push({ description: "HP Sacrifice", value: `+${hpCost}`, result: totalDamage });

        if (player.skillToggles['mana_overload']) {
            totalDamage = Math.floor(totalDamage * 1.5);
            calcLog.steps.push({ description: "Mana Overload", value: "x1.5", result: totalDamage });
        }

        addToLog(`${player.name} unleashes the Nullity Sphere!`, "text-purple-400 font-bold");
        
        const attackOptions = { element: 'void', isMagic: true, ignore_defense: 0.20 };

        // Execute Damage FIRST
        const result = target.takeDamage(totalDamage, attackOptions, player);

        // THEN complete log with defense steps
        if(result.defenseSteps) calcLog.steps = calcLog.steps.concat(result.defenseSteps);
        calcLog.finalDamage = result.damageDealt;
        if(typeof logDamageCalculation === 'function') logDamageCalculation(calcLog);

        if (player.skillToggles['oblivions_hunger'] && target.isAlive()) {
            applyStatusEffect(target, 'essence_devoured', { duration: 4 }, player.name);
            addToLog(`${target.name}'s essence is devoured by the sphere!`, "text-purple-300 text-xs");
        }

        checkBattleStatus(true);
        finalizePlayerAction();
        return;
    }
    else if (actionType === 'space_rift') {
        const tx = target.x;
        const ty = target.y;

        // 1. Check Obstacles
        if (isCellBlocked(tx, ty, false, false)) {
            addToLog("Cannot open a Rift inside an obstacle!", "text-red-400");
            player.mp += cost; updateStatsView();
            isProcessingAction = false; return;
        }

        // --- STEP A: Entrance ---
        if (!player.tempRiftEntrance) {
            player.tempRiftEntrance = { x: tx, y: ty };
            addToLog("Entrance set. Select Exit (Range 4).", "text-purple-300 font-bold");
            
            player.mp += cost; // Temp Refund until complete
            updateStatsView();
            
            createFloatingText(tx, ty, "⚓ Start", "text-purple-400");
            isProcessingAction = false; 
            gameState.suppressTurnEnd = true; 
            return;
        }

        // --- STEP B: Exit ---
        // Range Check from Entrance (Euclidean Distance <= 4)
        const dist = Math.sqrt(Math.pow(tx - player.tempRiftEntrance.x, 2) + Math.pow(ty - player.tempRiftEntrance.y, 2));
        if (dist > 4) {
             addToLog("Exit is too far from Entrance! (Max 4)", "text-red-400");
             // Do not refund mp (already refunded in Step A logic technically, but we are in the 'active' flow)
             // Actually, since we refunded in A, we need to consume it now if successful, 
             // but here we failed. Reset state to allow retry or cancel?
             // Simplest: Just return and let them click again.
             isProcessingAction = false;
             return;
        }

        addToLog(`${player.name} tears the fabric of reality!`, "text-purple-500 font-bold");

        const riftDuration = 5;
        const riftId = Date.now(); 

        gameState.gridObjects.push({
            type: 'portal', subtype: 'void_rift', name: "Abyssal Breach (In)", emoji: '🌀',
            x: player.tempRiftEntrance.x, y: player.tempRiftEntrance.y,
            duration: riftDuration, pairId: riftId,
            destination: { x: tx, y: ty }
        });

        gameState.gridObjects.push({
            type: 'portal', subtype: 'void_rift', name: "Abyssal Breach (Out)", emoji: '🌀',
            x: tx, y: ty,
            duration: riftDuration, pairId: riftId,
            destination: { x: player.tempRiftEntrance.x, y: player.tempRiftEntrance.y }
        });

        delete player.tempRiftEntrance;
        gameState.suppressTurnEnd = false; 
        renderBattleGrid();
        checkBattleStatus(true);
        finalizePlayerAction();
        return;
    }
    else if (actionType === 'event_horizon') {
        if (target.x !== player.x || target.y !== player.y) {
            addToLog("Event Horizon must be centered on yourself!", "text-purple-400");
            player.mp += cost; updateStatsView();
            isProcessingAction = false; 
            return;
        }

        addToLog(`${player.name} becomes the center of the void!`, "text-purple-500 font-bold");
        playSound('magic_void_heavy');

        // Identify Targets
        let targets = [];
        const range = 2;
        for (const enemy of currentEnemies) {
            if (enemy.isAlive()) {
                const dist = Math.max(Math.abs(enemy.x - player.x), Math.abs(enemy.y - player.y));
                if (dist <= range) targets.push(enemy);
            }
        }

        // Calculate Scaling (Essence Devoured Count)
        const devouredCount = currentEnemies.filter(e => e.isAlive() && e.statusEffects.essence_devoured).length;
        const stackCount = Math.min(devouredCount, 5);
        const damageMult = 1.5 + (stackCount * 0.30);

        addToLog(`Event Horizon absorbs ${stackCount} devoured essences! (x${damageMult.toFixed(2)} Dmg)`, "text-purple-300");

        // Deal Damage
        player.tempAttackMods = { multiplier: damageMult };
        for (const t of targets) {
            createFloatingText(t.x, t.y, "VOID", "purple");
            await performPlayerAttack(t, { 
                forceElement: 'void', 
                animation: 'implosion' 
            });
            await new Promise(r => setTimeout(r, 100));
        }
        delete player.tempAttackMods;

        // [FIX] Check for Victory BEFORE applying the penalty
        // If all enemies are dead/dying, skip the drawback
        const allDead = currentEnemies.every(e => !e.isAlive() || e.hp <= 0);

        if (!allDead) {
            // Apply Drawback
            player.statusEffects.void_feedback = {
                name: "Void Feedback",
                type: 'debuff',
                description: "Elemental affinities are consumed by the void.",
                duration: 3,
                icon: '∅',
                originalWeaponEl: player.weaponElement,
                originalArmorEl: player.equippedArmor ? player.equippedArmor.element : null,
                originalShieldEl: player.equippedShield ? player.equippedShield.element : null
            };

            player.weaponElement = 'physical';
            if (player.equippedArmor) player.equippedArmor.element = null;
            if (player.equippedShield) player.equippedShield.element = null;

            addToLog("Your elemental attunement has been devoured!", "text-red-400 italic");
        } else {
            addToLog("The Void is sated by total oblivion. You are spared the feedback.", "text-purple-300 font-bold");
        }

        checkBattleStatus(true);
        finalizePlayerAction();
        return;
    }

    // =========================================================================
    // SCYTHE ARTS
    // =========================================================================

    else if (actionType === 'deathly_flourish') {
        player.tempAttackMods = { multiplier: 1.5 * activeArtMultiplier };
        addToLog(`${player.name} sweeps the scythe!`, "text-purple-400 font-bold");
        await performPlayerAttack(target);
        delete player.tempAttackMods;
        player.statusEffects.buff_swiftness = { duration: 1 };
        addToLog("Swiftness! (Free Move Action)", "text-cyan-300");
        finalizePlayerAction(); return;
    }

    else if (actionType === 'self_flagellation') {
        // 1. Cost Checks (15 MP + 20% HP)
        const hpCost = Math.floor(player.maxHp * 0.20);
        
        if (player.mp < 15) {
            addToLog("Not enough MP!", "text-red-500");
            return;
        }
        if (player.hp <= hpCost) {
            addToLog("Not enough HP! The ritual would kill you.", "text-red-500");
            return;
        }

        // 2. Pay Costs
        player.mp -= 15;
        player.hp -= hpCost;
        
        // Visuals
        addToLog(`${player.name} sacrifices ${hpCost} HP for power!`, "text-red-600 font-bold");
        if (typeof createFloatingText === 'function') createFloatingText(player.x, player.y, `-${hpCost}`, "text-red-600");

        // 3. Determine Buff (Normal vs Sepulchral)
        // Condition: 'seppuku' unlocked AND 'force_switch_blade' (Executioner's Stance) active
        const isSepulchral = player.isSkillActive('seppuku') && player.skillToggles['force_switch_blade'];

        if (isSepulchral) {
            // SYNERGY: SEPULCHRAL RITE
            // Replaces normal buff with Crit/Grease buff
            applyStatusEffect(player, 'buff_sepulchral', {
                name: "Sepulchral Rite",
                duration: 3,
                icon: "☠️",
                description: "Crit Chance +25%, Crit Dmg +1.0x",
                type: 'buff'
            });
            addToLog("Sepulchral Rite! Death is invited in...", "text-purple-400 font-bold");
        } else {
            // NORMAL: CRIMSON PENANCE
            applyStatusEffect(player, 'buff_crimson_penance', {
                name: "Crimson Penance",
                duration: 3,
                icon: "🩸",
                description: "Damage +25%, Lifesteal +15%",
                type: 'buff',
                lifesteal: 0.15, // Helper for calc
                multiplier: 1.25 // Helper for calc
            });
            addToLog("Crimson Penance! The blood boils.", "text-red-400");
        }

        updateStatsView();
        finalizePlayerAction();
        return;
    }

    if (actionType === 'deadly_dance') {
        const hasCyclone = player.isSkillActive('cyclone_trigger') && player.skillToggles['force_switch_blade'];
        const hasBloodDance = player.isSkillActive('blood_dance') && 
                              (player.statusEffects.buff_crimson_penance || player.statusEffects.buff_sepulchral);
        
        let targets = [];
        let skillName = "Deadly Dance";
        let logColor = "text-red-500 font-bold";

        // 1. DETERMINE TARGETS AND FLAVOR
        if (hasBloodDance) {
            // --- BLOOD DANCE (Verdict Shape) ---
            skillName = "Sanguine Waltz";
            addToLog(`${player.name} performs the Sanguine Waltz!`, logColor);
            
            // 3x3 Box + 4 Outer Cardinals
            const offsets = [];
            // Box
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    offsets.push({x: dx, y: dy});
                }
            }
            // Outer Cardinals
            offsets.push({x: 0, y: -2}, {x: 0, y: 2}, {x: -2, y: 0}, {x: 2, y: 0});

            offsets.forEach(o => {
                const enemy = currentEnemies.find(e => e.isAlive() && e.x === target.x + o.x && e.y === target.y + o.y);
                if (enemy && !targets.includes(enemy)) targets.push(enemy);
            });

        } 
        else if (hasCyclone) {
            // --- CYCLONE TRIGGER (3x3 Box) ---
            skillName = "Cyclone Trigger";
            addToLog(`${player.name} unleashes a Cyclone Trigger!`, logColor);

            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const tx = target.x + dx;
                    const ty = target.y + dy;
                    const enemy = currentEnemies.find(e => e.isAlive() && e.x === tx && e.y === ty);
                    if (enemy) targets.push(enemy);
                }
            }

        } 
        else {
            // --- BASE DEADLY DANCE (Self-Centered Ring) ---
            // Must target self
            if (target.x !== player.x || target.y !== player.y) {
                addToLog("Base Deadly Dance must target self!", "text-red-400");
                player.mp += cost; isProcessingAction = false; renderBattleGrid(); return;
            }

            addToLog(`${player.name} performs the Deadly Dance!`, logColor);
            const offsets = [{x:0, y:1}, {x:0, y:-1}, {x:1, y:0}, {x:-1, y:0}, {x:1, y:1}, {x:1, y:-1}, {x:-1, y:1}, {x:-1, y:-1}];
            offsets.forEach(o => {
                const enemy = currentEnemies.find(e => e.isAlive() && e.x === player.x + o.x && e.y === player.y + o.y);
                if (enemy) targets.push(enemy);
            });
        }

        // 2. EXECUTE ATTACKS & TRACK RESULTS
        let killCount = 0;
        let hitCount = 0;
        gameState.suppressTurnEnd = true;

        for (const t of targets) {
            if (t.isAlive()) {
                // DAMAGE MULTIPLIER LOGIC
                // Base: 150%
                // Blood Dance: 50% of Base (0.75x)
                let multiplier = 1.50; 
                if (hasBloodDance) multiplier = 0.75; 

                player.tempAttackMods = { multiplier: multiplier * activeArtMultiplier };
                
                await performPlayerAttack(t);
                delete player.tempAttackMods;
                
                hitCount++;
                if (!t.isAlive()) killCount++;
                await new Promise(r => setTimeout(r, 100)); // Impact delay
            }
        }

        gameState.suppressTurnEnd = false;

        // 3. APPLY EFFECTS

        // A. BLOOD DANCE: Heal on Hit (2.5% per hit)
        if (hasBloodDance && hitCount > 0) {
            const healPerHit = Math.floor(player.maxHp * 0.025);
            const totalHeal = healPerHit * hitCount;
            if (totalHeal > 0) {
                player.hp = Math.min(player.maxHp, player.hp + totalHeal);
                addToLog(`Sanguine Waltz absorbs blood! (+${totalHeal} HP)`, "text-red-400");
                updateStatsView();
            }
        }

        // B. KILL BONUS (Heal & Buff)
        // Applies to ALL versions if a kill is secured.
        if (killCount > 0) {
            // Heal 5% per kill
            const healPercent = 0.05 * killCount;
            const healAmount = Math.floor(player.maxHp * healPercent);
            
            // Only show log/apply if not already fully healed or if it's significant
            // (Note: Blood Dance might heal twice—once on hit, once on kill. This is intentional per "Additionally")
            if (healAmount > 0) {
                player.hp = Math.min(player.maxHp, player.hp + healAmount);
                addToLog(`Harvested ${killCount} souls! (+${healAmount} HP)`, "text-green-300");
                updateStatsView();
            }

            // Damage Buff (5% per kill)
            const newDmgBonus = 0.05 * killCount;
            const existingBuff = player.statusEffects.buff_deadly_dance;
            let applyBuff = true;

            // "Higher amount will override weaker damage buff"
            if (existingBuff && newDmgBonus <= existingBuff.damageMult) {
                applyBuff = false;
                // Optional: Refresh duration if equal? For now, we strictly follow "override weaker".
            }

            if (applyBuff) {
                player.statusEffects.buff_deadly_dance = {
                    name: "Deadly Dance",
                    type: 'buff',
                    description: `Harvested power. +${(newDmgBonus*100).toFixed(0)}% Damage.`,
                    duration: 3,
                    damageMult: newDmgBonus, 
                    icon: '💃'
                };
                addToLog(`Damage increased by ${(newDmgBonus*100).toFixed(0)}% for 3 turns!`, "text-red-400");
            }
        } else if (targets.length === 0) {
            addToLog("You swing at the air. It remains unharmed.", "text-gray-500");
        }

        checkBattleStatus(true);
        finalizePlayerAction();
        return;
    }
    else if (actionType === 'culling_hook') {
        addToLog(`${player.name} hooks the enemy and drags them closer!`, "text-red-400 font-bold");
        
        // 200% Damage, 50% Pierce
        player.tempAttackMods = { 
            multiplier: 2.0 * activeArtMultiplier,
            pierce: 0.50 
        };
        
        await performPlayerAttack(target);
        delete player.tempAttackMods;

        // Pull Logic
        if (target.isAlive()) {
            const pullDist = 2;
            for(let i=0; i<pullDist; i++) {
                const dx = Math.sign(player.x - target.x);
                const dy = Math.sign(player.y - target.y);
                const nextX = target.x + dx;
                const nextY = target.y + dy;
                
                // Stop if adjacent (don't pull into player)
                if (nextX === player.x && nextY === player.y) break; 
                
                if (!isCellBlocked(nextX, nextY, true, false, false, target)) {
                    target.x = nextX; 
                    target.y = nextY;
                    renderBattleGrid();
                    await new Promise(r => setTimeout(r, 150)); 
                } else {
                    addToLog("The drag is obstructed.", "text-gray-500");
                    break; 
                }
            }
        }
        finalizePlayerAction();
        return;
    }

    // =========================================================================
    // RAPIER ARTS
    // =========================================================================

    else if (actionType === 'rapid_strike') {
        let lightHits = 4;
        let heavyHits = 1;
        let lightDmgMult = 0.40;
        let heavyDmgMult = 0.60;
        
        // Check Passive: Sanguine Tithe (Blood Tax)
        const hasBloodTax = player.isSkillActive('blood_tax');

        if (hasBloodTax) {
            lightDmgMult = 0.50;
            heavyDmgMult = 0.75;
        }

        if (player.isSkillActive('heightened_speed') && player.skillToggles['quicksilver_reaction']) {
            lightHits = 6;
            heavyHits = 2;
            lightDmgMult = hasBloodTax ? 0.35 : 0.30;
            heavyDmgMult = hasBloodTax ? 0.50 : 0.40;
        }

        addToLog(`${player.name} unleashes a flurry of thrusts!`, "text-cyan-300 font-bold");
        
        let targets = [target];
        if (player.skillToggles['zone_of_death']) {
            const extras = currentEnemies.filter(e => e !== target && e.isAlive())
                .sort((a, b) => (Math.abs(a.x - player.x) + Math.abs(a.y - player.y)) - (Math.abs(b.x - player.x) + Math.abs(b.y - player.y)))
                .slice(0, 2);
            targets.push(...extras);
        }

        gameState.suppressTurnEnd = true;

        // --- Helper for Heal Logic ---
        const triggerBloodTaxHeal = () => {
            if (hasBloodTax && player.hp < player.maxHp) {
                // Fix: Ensure at least 1 HP is healed
                const heal = Math.max(1, Math.floor(player.maxHp * 0.01));
                player.hp = Math.min(player.maxHp, player.hp + heal);
                
                // Visual Feedback
                updateStatsView(); 
                createFloatingText(player.x, player.y, `+${heal}`, "text-green-400");
            }
        };

        // 1. Light Hits
        for (let i = 0; i < lightHits; i++) {
            const currentTarget = targets[i % targets.length];
            if (currentTarget.isAlive()) {
                player.tempAttackMods = { multiplier: lightDmgMult * activeArtMultiplier };
                await performPlayerAttack(currentTarget);
                
                triggerBloodTaxHeal(); // Apply Heal

                delete player.tempAttackMods;
                await new Promise(r => setTimeout(r, 100)); 
            }
        }

        // 2. Heavy Hits
        for (let i = 0; i < heavyHits; i++) {
            const currentTarget = targets[i % targets.length];
            if (currentTarget.isAlive()) {
                addToLog("Finishing strike!", "text-red-400");
                player.tempAttackMods = { multiplier: heavyDmgMult * activeArtMultiplier };
                await performPlayerAttack(currentTarget);

                triggerBloodTaxHeal(); // Apply Heal

                delete player.tempAttackMods;
                await new Promise(r => setTimeout(r, 200)); 
            }
        }

        gameState.suppressTurnEnd = false;
        checkBattleStatus(true);
        finalizePlayerAction();
        return;
    }

    else if (actionType === 'needle_shot') {
        addToLog(`${player.name} lunges with precise lethality!`, "text-red-500 font-bold");
        
        player.tempAttackMods = { 
            description: "Heart-Piercer", // Fixes Log Name
            multiplier: 2.0 * activeArtMultiplier, 
            critChanceFlat: 0.10, 
            critMultFlat: 0.5, 
            pierce: 0.10 
        };
        
        await performPlayerAttack(target);
        delete player.tempAttackMods;
        finalizePlayerAction();
        return;
    }

    // =========================================================================
    // HAMMER ARTS
    // =========================================================================

    else if (actionType === 'impact_tremor') {
        let dmgMult = 1.5; 
        let splashMult = 0.75; 
        let extraSplash = false; 

        // 1. Calculate Modifiers
        if (player.isSkillActive('high_quality_hammer') && player.isSkillActive('dwarven_battle_arts')) {
            dmgMult += 0.5; 
            addToLog("Masterwork Haft: Damage Up!", "text-yellow-300");
        }
        
        if (player.isSkillActive('divine_mining_arts') && player.skillToggles['titan_swing']) {
            dmgMult = 2.0; 
            extraSplash = true; 
            addToLog("Seismic Reshaping!", "text-orange-400");
        }

        addToLog(`${player.name} slams the ground!`, "text-orange-500 font-bold");

        player.tempAttackMods = { multiplier: dmgMult, element: 'earth' };

        // 3. Execute Primary Attack
        let baseSplashDmg = 0;
        let primaryVictim = target;
        
        // Find target if clicking ground
        if (!target || typeof target.takeDamage !== 'function') {
            primaryVictim = currentEnemies.find(e => e.x === target.x && e.y === target.y && e.isAlive());
        }

        if (primaryVictim) {
            // Hit an enemy
            const result = await performPlayerAttack(primaryVictim);
            
            // [FIX] Safety Check: Ensure result exists before reading damageDealt
            if (result && typeof result.damageDealt === 'number') {
                baseSplashDmg = result.damageDealt;
            } else {
                // Fallback: If performPlayerAttack returned nothing, calculate theoretical damage for splash
                const weapon = player.equippedWeapon;
                const raw = rollDice(weapon.damage[0], weapon.damage[1], "Impact Tremor (Fallback)").total;
                baseSplashDmg = Math.floor((raw + player.physicalDamageBonus) * dmgMult);
            }
        } else {
            // Hit ground
            addToLog("The hammer strikes the earth directly!", "text-yellow-300 text-xs");
            const weapon = player.equippedWeapon;
            const raw = rollDice(weapon.damage[0], weapon.damage[1], "Ground Impact").total;
            baseSplashDmg = Math.floor((raw + player.physicalDamageBonus) * dmgMult);
        }

        delete player.tempAttackMods;

        // 4. Calculate Splash
        if (baseSplashDmg > 0) {
            const centerX = target.x;
            const centerY = target.y;

            const neighbors = currentEnemies.filter(e => 
                e !== primaryVictim && 
                e.isAlive() && 
                Math.abs(e.x - centerX) <= 1 && 
                Math.abs(e.y - centerY) <= 1
            );
            
            if (extraSplash) {
                const extended = currentEnemies.filter(e => 
                    e !== primaryVictim && 
                    e.isAlive() && (
                    (e.x === centerX && Math.abs(e.y - centerY) === 2) || 
                    (e.y === centerY && Math.abs(e.x - centerX) === 2)
                ));
                neighbors.push(...extended);
            }
            
            for (const n of neighbors) {
                n.takeDamage(Math.floor(baseSplashDmg * splashMult), { element: 'earth' }, player);
            }
        }
        
        checkBattleStatus(true); 
        finalizePlayerAction(); 
        return;
    }

    // =========================================================================
    // METEORIC CHARGE (CRASH FIX)
    // =========================================================================
    else if (actionType === 'heavy_meteoric_charge' || actionType === 'meteoric_charge') {
        let chargeDist = 2;
        if (player.isSkillActive('titans_range')) chargeDist += 1; 

        const dx = Math.sign(target.x - player.x);
        const dy = Math.sign(target.y - player.y);
        let landingX = player.x;
        let landingY = player.y;

        gameState.isPlayerTurn = false;
        addToLog(`${player.name} charges forward like a meteor!`, "text-red-500 font-bold");
        
        // 1. ANIMATE MOVEMENT
        for(let i=0; i<chargeDist; i++) {
             const nextX = landingX + dx;
             const nextY = landingY + dy;
             if ((nextX === target.x && nextY === target.y) || isCellBlocked(nextX, nextY, false, player.race === 'Pinionfolk')) break;
             landingX = nextX; landingY = nextY;
             player.x = landingX; player.y = landingY;
             renderBattleGrid();
             await new Promise(r => setTimeout(r, 150));
        }
        addToLog("IMPACT!", "text-orange-500 font-bold text-lg");

        // 2. RESOLVE ACTUAL TARGET (The Fix)
        // We look for an enemy at the target coordinates we clicked/charged at.
        let actualTarget = target;
        if (!actualTarget || typeof actualTarget.takeDamage !== 'function') {
            actualTarget = currentEnemies.find(e => e.x === target.x && e.y === target.y && e.isAlive());
        }

        // If we still didn't find anyone (charged into a wall or empty space), stop here.
        if (!actualTarget) {
            addToLog("The charge hits nothing but air (or a wall).", "text-gray-400");
            checkBattleStatus(true); 
            finalizePlayerAction(); 
            return;
        }

        // 3. CALC MULTIPLIERS
        let dmgMult = 1.5; 
        if (player.isSkillActive('high_quality_hammer') && player.isSkillActive('dwarven_battle_arts')) {
            dmgMult += 0.5; // Total 2.0x
            addToLog("Masterwork Haft: Impact Maximized!", "text-yellow-300");
        }
        let extraSplash = false;
        if (player.isSkillActive('high_quality_hammer') && player.isSkillActive('dwarven_battle_arts')) dmgMult += 0.5;
        if (player.isSkillActive('divine_mining_arts') && player.skillToggles['titan_swing']) extraSplash = true;

        player.tempAttackMods = { 
            multiplier: dmgMult, 
            element: 'earth'
        };

        // 4. EXECUTE ATTACK (Now safe)
        const result = await performPlayerAttack(actualTarget);
        
        delete player.tempAttackMods;

        if (actualTarget.isAlive() && Math.random() < 0.50) {
            applyStatusEffect(actualTarget, 'paralyzed', { duration: 2 }, player.name);
        }

        // 5. SPLASH DAMAGE
        let dealtDmg = 0;
        if (result && typeof result.damageDealt === 'number') {
            dealtDmg = result.damageDealt;
        } else {
            // Fallback calculation
            const weapon = player.equippedWeapon;
            const raw = rollDice(weapon.damage[0], weapon.damage[1], "Meteoric Impact (Fallback)").total;
            dealtDmg = Math.floor((raw + player.physicalDamageBonus) * dmgMult);
        }
        
        if (dealtDmg > 0) {
            const neighbors = currentEnemies.filter(e => 
                e !== actualTarget && 
                e.isAlive() && 
                Math.abs(e.x - actualTarget.x) <= 1 && 
                Math.abs(e.y - actualTarget.y) <= 1
            );
            
            for (const n of neighbors) {
                n.takeDamage(Math.floor(dealtDmg * 1.0), { element: 'earth' }, player);
            }
            
            if (extraSplash) {
                const extended = currentEnemies.filter(e => 
                    e !== actualTarget && 
                    e.isAlive() && (
                    (e.x === actualTarget.x && Math.abs(e.y - actualTarget.y) === 2) || 
                    (e.y === actualTarget.y && Math.abs(e.x - actualTarget.x) === 2)
                ));
                for (const ex of extended) {
                    ex.takeDamage(Math.floor(dealtDmg * 0.75), { element: 'earth' }, player);
                }
            }
        }

        checkBattleStatus(true); 
        finalizePlayerAction(); 
        return;
    }

    // =========================================================================
    // AXE ARTS
    // =========================================================================

    else if (actionType === 'tomahawk_hurl') {
        let dmgMult = 1.5; // [FIX] Base Damage is now 150%
        let critBonus = 0.10;
        let skillLabel = "Tomahawk Hurl"; // Log Label

        // [FIX] Head-Hunter's Discipline Logic
        if (player.isSkillActive('head_hunters_discipline')) {
            dmgMult += 0.5; // Adds 50% -> Total 200%
            skillLabel += " (Head-Hunter)";
            addToLog("Head-Hunter's Discipline: Damage Up!", "text-yellow-300");
        }

        if (player.skillToggles['crimson_feast'] && player.isSkillActive('predators_wisdom')) {
            critBonus += 0.15;
            player.tempAttackMods = { critMultFlat: 0.5 };
            addToLog("Predator's Wisdom: Lethality Up!", "text-red-300");
        }

        player.tempCritChanceFlat = critBonus;
        
        // Apply Modifiers and Label for the Log
        player.tempAttackMods = { 
            ...player.tempAttackMods, 
            multiplier: dmgMult * activeArtMultiplier,
            description: skillLabel 
        };

        addToLog(`${player.name} hurls the axe!`, "text-red-400 font-bold");

    let description = "Tomahawk Hurl";
    
    if (player.isSkillActive('predators_wisdom') && player.skillToggles['crimson_feast']) {
        dmgMult = 2.0; // 2.0x Multiplier
        
        // Apply Bonus Crit (15%) via temporary mod
        if (!player.tempAttackMods) player.tempAttackMods = {};
        player.tempAttackMods.critChanceFlat = (player.tempAttackMods.critChanceFlat || 0) + 0.15;
        
        description = "Predator's Hurl (Synergy)";
        addToLog("Predator's Wisdom empowers the throw!", "text-yellow-300 font-bold");
    }
    
    player.tempAttackMods = { 
        ...player.tempAttackMods, 
        multiplier: dmgMult, 
        description: description 
    };
    // [FIX END]

    await performPlayerAttack(target);
    
    // Cleanup
    delete player.tempAttackMods;
    finalizePlayerAction();
    return;
}

    // =========================================================================
    // EARTH SPLITTER (Updated)
    // =========================================================================
    else if (actionType === 'earth_splitter') {
        const dx = Math.sign(target.x - player.x);
        const dy = Math.sign(target.y - player.y);
        let affectedTiles = [];

        // Generate 3-Tile Cone
        if (Math.abs(dx) > Math.abs(dy)) {
            // Horizontal Cone
            affectedTiles.push({x: target.x, y: target.y}); // Origin
            affectedTiles.push({x: target.x + dx, y: target.y - 1}, {x: target.x + dx, y: target.y}, {x: target.x + dx, y: target.y + 1}); // Row 2
            affectedTiles.push({x: target.x + dx*2, y: target.y - 2}, {x: target.x + dx*2, y: target.y - 1}, {x: target.x + dx*2, y: target.y}, {x: target.x + dx*2, y: target.y + 1}, {x: target.x + dx*2, y: target.y + 2}); // Row 3
        } else {
            // Vertical Cone
            affectedTiles.push({x: target.x, y: target.y});
            affectedTiles.push({x: target.x - 1, y: target.y + dy}, {x: target.x, y: target.y + dy}, {x: target.x + 1, y: target.y + dy});
            affectedTiles.push({x: target.x - 2, y: target.y + dy*2}, {x: target.x - 1, y: target.y + dy*2}, {x: target.x, y: target.y + dy*2}, {x: target.x + 1, y: target.y + dy*2}, {x: target.x + 2, y: target.y + dy*2});
        }

        addToLog(`${player.name} splits the earth asunder!`, "text-orange-500 font-bold");

        // [FIX] Stacks Logic
        // Base 2, +1 if Predator's Wisdom Synergy active (Total 3)
        let stacksToApply = 2;
        let stackDesc = "Hewing Strikes";
        
        if (player.skillToggles['crimson_feast'] && player.isSkillActive('predators_wisdom')) {
            stacksToApply = 3;
            stackDesc = "Predator's Hewing"; // For the log
            addToLog("Predator's Wisdom: Skill intensified!", "text-red-300 text-xs");
        }

        // Identify Targets
        const targets = [];
        affectedTiles.forEach(tile => {
            const enemy = currentEnemies.find(e => e.isAlive() && e.x === tile.x && e.y === tile.y);
            if (enemy) targets.push(enemy);
        });

        // Execute Damage & Effects
        for (const t of targets) {
            // --- [LOGGING START] ---
            const calcLog = { source: "Earth Splitter", targetName: t.name, steps: [] };
            
            const weapon = player.equippedWeapon;
            let rawDmg = rollDice(weapon.damage[0], weapon.damage[1], "Earth-Splitter").total;
            calcLog.baseDamage = rawDmg;
            
            // 200% Damage Multiplier
            // Ensure activeArtMultiplier is defined, defaulting to 1 if not found in scope
            const mult = (typeof activeArtMultiplier !== 'undefined' ? activeArtMultiplier : 1.0);
            let totalDmg = Math.floor((rawDmg + player.physicalDamageBonus) * 2.0 * mult);
            calcLog.steps.push({ description: "Skill Multiplier", value: `x2.0`, result: totalDmg });
            
            // Deal Damage
            const res = t.takeDamage(totalDmg, { element: 'earth' }, player);
            
            if(res.defenseSteps) calcLog.steps = calcLog.steps.concat(res.defenseSteps);
            calcLog.finalDamage = res.damageDealt;
            
            // --- [FIX: CRIMSON FEAST HEAL] ---
            // Since Earth Splitter bypasses standard attack logic, we inject the heal here.
            if (player.skillToggles['crimson_feast']) {
                 const healAmount = Math.floor(player.maxHp * 0.05);
                 if (player.hp < player.maxHp) {
                    player.hp = Math.min(player.maxHp, player.hp + healAmount);
                    // Add to visual log
                    addToLog(`Crimson Feast: Drained ${healAmount} HP`, "text-green-300 text-xs");
                    // Add to Calc Log for debugging
                    calcLog.steps.push({
                        description: "Crimson Feast (Heal)",
                        value: "5% Max HP",
                        result: `+${healAmount} HP`
                    });
                 }
            }
            
            if(typeof logDamageCalculation === 'function') logDamageCalculation(calcLog);
            // --- [LOGGING END] ---

            // [FIX] HEWING STRIKES INTEGRATION
            if (player.isSkillActive('woodcutter')) {
                if (!player.combatTags) player.combatTags = {};
                
                player.combatTags.hewingLastTarget = t.id;
                
                const current = player.combatTags.hewingStacks || 0;
                // CHANGED: Math.max -> addition. "Adds 3 stacks" means current + 3.
                player.combatTags.hewingStacks = Math.min(current + stacksToApply, 5);
                
                addToLog(`${stackDesc}: ${player.combatTags.hewingStacks} Stacks!`, "text-cyan-300 text-xs");
            }
        }

        checkBattleStatus(true);
        finalizePlayerAction();
        return;
    }

    else if (actionType === 'gore_crazed_howl') {
        // 1. Check Cost
        if (player.mp >= 25) {
            player.mp -= 25;

            // 2. Check Passive Requirement
            const hasInstinct = player.isSkillActive('scavengers_eye');

            // 3. Apply Effect (Duration: 3 Turns per metadata)
            // We use applyStatusEffect so it integrates with the turn manager
            applyStatusEffect(player, 'buff_gore_howl', { 
                duration: 3, 
                name: "Gore-Crazed", 
                icon: "🐺", 
                description: "+50% Dmg, -50% Def" + (hasInstinct ? ", Chain Enabled" : ""),
                atkMult: 1.5, 
                defMult: 0.5, 
                enableMultiHit: hasInstinct 
            });

            // 4. Log
            let msg = `${player.name} lets out a blood-curdling howl! (+50% Dmg / -50% Def)`;
            if (hasInstinct) {
                msg += " <br><span class='text-yellow-300'>Berserker's Instinct: Attacks become devastating chains!</span>";
            }
            addToLog(msg, "text-red-600 font-bold");

            // 5. Cleanup
            updateStatsView(); 
            finalizePlayerAction(); 
            return;
        } else {
            addToLog("Not enough MP! (Need 25)", "text-gray-400");
            return; // Don't finalize, let player choose again
        }
    }

    // =========================================================================
    // DAGGER ARTS
    // =========================================================================
    
    else if (actionType === 'covet') {
        addToLog(`${player.name} mugs the enemy!`, "text-yellow-300");
        player.tempAttackMods = { multiplier: 0.75 * activeArtMultiplier };
        await performPlayerAttack(target);
        delete player.tempAttackMods;
        
        if (target.isAlive()) {
            let stolenGold = Math.floor(target.goldReward * 0.10);
            if (player.skillToggles['daggershot_rune'] && player.isSkillActive('trickshot_rune')) stolenGold = Math.floor(stolenGold * 1.15);
            if (stolenGold > 0) { player.gold += stolenGold; addToLog(`Stole ${stolenGold} G!`, "text-yellow-300"); }
            if (Math.random() < 0.5) {
                 const drop = Object.keys(target.lootTable)[0];
                 if(drop) { player.addToInventory(drop, 1, true); addToLog("You snatched an item!", "text-green-300"); }
            }
        }
        finalizePlayerAction(); return;
    }

    else if (actionType === 'thiefs_gambit') {
        player.x = target.x; player.y = target.y;
        renderBattleGrid();
        addToLog("Flicker Strike! You shift through the shadows!", "text-purple-300");

        const neighbors = [
            {x:player.x+1, y:player.y}, {x:player.x-1, y:player.y}, 
            {x:player.x, y:player.y+1}, {x:player.x, y:player.y-1}
        ];
        
        const enemies = neighbors.map(n => currentEnemies.find(e => e.isAlive() && e.x === n.x && e.y === n.y)).filter(Boolean);
        
        if (enemies.length > 0) {
            const backstabTarget = enemies[Math.floor(Math.random() * enemies.length)];
            addToLog(`...and strike ${backstabTarget.name} from the dark!`, "text-red-400 font-bold");
            
            player.tempAttackMods = { multiplier: 1.5, critChanceFlat: 0.10 };
            await performPlayerAttack(backstabTarget);
            delete player.tempAttackMods;
        } else {
            addToLog("But find no one to strike.", "text-gray-400");
        }
        
        finalizePlayerAction();
        return;
    }

    // =========================================================================
    // CURVED SWORD ARTS
    // =========================================================================

    else if (actionType === 'flash_of_flurry') {
        // 1. Weapon Check
        if (player.equippedWeapon.class !== 'Curved Sword') {
             addToLog("Cardinal Bloom requires a Curved Sword!", "text-red-400");
             player.mp += cost; updateStatsView();
             isProcessingAction = false; renderBattleGrid(); return;
        }

        // 2. Configuration & Upgrades
        const hasVoid = player.isSkillActive('void_flurry');
        const hasEclipse = player.isSkillActive('waltz_of_void_and_light');

        let skillName = "Cardinal Bloom";
        let hitCount = 4;       // Base: 4 Hits
        let damageMult = 0.30;  // Base: 30% Dmg
        let ignoreDef = 0;      // Base: 0% Pierce

        // Upgrade: Abyssal Bloom (Void Flurry)
        if (hasVoid) {
            skillName = "Abyssal Bloom";
            ignoreDef = 0.50; // 50% Pierce
        }
        
        // Upgrade: Eclipse Dance (Synergy)
        if (hasEclipse) {
            skillName = "Eclipse Dance";
            hitCount = 6;     // Up to 6 Hits
            damageMult = 0.40; // Up to 40% Dmg
        }

        addToLog(`${player.name} performs the ${skillName}!`, "text-cyan-300 font-bold title-glow");

        // 3. Define Targets (PBAoE)
        const offsets = [{x:0, y:1}, {x:0, y:-1}, {x:1, y:0}, {x:-1, y:0}]; // Cardinals
        if (hasVoid) {
            // Add Diagonals for Abyssal Bloom
            offsets.push({x:1, y:1}, {x:1, y:-1}, {x:-1, y:1}, {x:-1, y:-1});
        }

        const targets = [];
        offsets.forEach(off => {
            const tx = player.x + off.x;
            const ty = player.y + off.y;
            const enemy = currentEnemies.find(e => e.x === tx && e.y === ty && e.isAlive());
            if (enemy) targets.push(enemy);
        });

        if (targets.length === 0) {
            addToLog("The steel blooms, but finds no purchase.", "text-gray-500 italic");
            finalizePlayerAction();
            return;
        }

        gameState.suppressTurnEnd = true;

        // 4. Execution Loop
        for (let i = 0; i < hitCount; i++) {
            // Optimization: Stop if everything is dead
            if (targets.every(t => !t.isAlive())) break;

            for (const t of targets) {
                if (t.isAlive()) {
                    // Apply Modifiers
                    player.tempAttackMods = { 
                        multiplier: damageMult * activeArtMultiplier,
                        ignore_defense: ignoreDef,
                        // Logs specific skill name in the calc tool
                        description: `${skillName} (Hit ${i+1})`
                    };
                    
                    // Execute Attack (Handles standard logging + Calc Log automatically)
                    await performPlayerAttack(t);
                    
                    delete player.tempAttackMods;
                }
            }
            // Visual Rhythm Delay
            await new Promise(r => setTimeout(r, 150));
        }

        gameState.suppressTurnEnd = false;
        checkBattleStatus(true);
        finalizePlayerAction();
        return;
    }

    else if (actionType === 'eternal_dance') {
        if (player.skillToggles['flowing_curvature']) {
            if (variableCost === null) {
                renderUnendingFlowInput(target);
                return;
            }
            cost = variableCost;

            const hits = Math.floor(cost / 20);
            addToLog(`Unending Flow! Consumed ${cost} MP for ${hits} strikes!`, "text-red-500 font-bold");
            
            gameState.suppressTurnEnd = true;
            for(let i=0; i<hits; i++) {
                if(!target.isAlive()) break;
                player.tempAttackMods = { multiplier: 0.40 * activeArtMultiplier };
                await performPlayerAttack(target);
                delete player.tempAttackMods;
                await new Promise(r => setTimeout(r, 100));
            }
            gameState.suppressTurnEnd = false; 
            checkBattleStatus(true);
        } 
        else {
            player.statusEffects.buff_unending_flow = { duration: 4 }; 
            addToLog("Unending Flow! Dance potency increased.", "text-cyan-300");
        }
        
        finalizePlayerAction(); 
        return;
    }

    else if (actionType === 'flash_point') {
        const dx = Math.sign(target.x - player.x);
        const dy = Math.sign(target.y - player.y);
        let maxDist = (player.equippedWeapon.range || 1) + 2;
        let enemiesHit = [];
        let landingX = player.x; 
        let landingY = player.y;
        
        // 1. Calculate Dash Path & Detect Hits
        for(let i=1; i<=maxDist; i++) {
            const nextX = player.x + (dx * i); 
            const nextY = player.y + (dy * i);
            
            if (nextX < 0 || nextX >= gameState.gridWidth || nextY < 0 || nextY >= gameState.gridHeight) break;
            
            const enemy = currentEnemies.find(e => e.x === nextX && e.y === nextY && e.isAlive());
            const obstacle = gameState.gridObjects.find(o => o.x === nextX && o.y === nextY);
            
            if (enemy) {
                enemiesHit.push(enemy);
            }
            else if (obstacle && obstacle.type === 'obstacle') {
                break;
            }
            else if (isCellBlocked(nextX, nextY, false, player.race === 'Pinionfolk')) { 
                if (player.race !== 'Pinionfolk') break; 
            }
            
            if (!isCellBlocked(nextX, nextY, false, player.race === 'Pinionfolk')) { 
                landingX = nextX; 
                landingY = nextY; 
            }
        }

        // 2. Execute Movement
        player.x = landingX; 
        player.y = landingY;
        renderBattleGrid();
        addToLog("Void-Step Strike!", "text-purple-400 font-bold");

        // 3. Process Damage & Logging
        for (const e of enemiesHit) {
            const weapon = player.equippedWeapon;
            
            // Calculate Damage
            // We use the same rolling logic as your standard attacks
            let rawDmg = rollDice(weapon.damage[0], weapon.damage[1], "Flash Point").total;
            let totalAtk = rawDmg + player.physicalDamageBonus;
            
            // Apply Multipliers (1.0 base * Arts Multiplier)
            let finalDmg = Math.floor(totalAtk * 1.0 * activeArtMultiplier);

            // --- DAMAGE CALC LOGGING ---
            // This pushes the data to your debug tool just like performPlayerAttack does
            if (typeof calcLog !== 'undefined') {
                calcLog.steps.push({ 
                    description: `Flash Point (${e.name})`, 
                    value: `${totalAtk} (True Dmg)`, 
                    result: finalDmg 
                });
            }
            // ---------------------------

            // Deal Damage (Ignore Defense = True)
            e.takeDamage(finalDmg, { ignore_defense: true, element: player.weaponElement }, player);
            
            addToLog(`${e.name} is caught in the dash for ${finalDmg} damage!`);
        }

        checkBattleStatus(true); 
        finalizePlayerAction(); 
        return;
    }

    // =========================================================================
    // LONGSWORD ARTS
    // =========================================================================
    
    else if (actionType === 'armor_cleave') {
        let dmgMult = 1.5;
        if (player.isSkillActive('cleave_aura')) dmgMult = 2.0;
        
        player.tempAttackMods = { multiplier: dmgMult * activeArtMultiplier };
        addToLog(`${player.name} performs a Sundering Hew!`, "text-red-500 font-bold");
        await performPlayerAttack(target);
        delete player.tempAttackMods;
        
        if (target.isAlive()) {
            applyStatusEffect(target, 'sundered', { duration: 4, multiplier: 0.5 }, player.name); 
            addToLog(`${target.name}'s armor is shattered! (-50% Def)`, "text-orange-400");
        }
        
        if (player.isSkillActive('cleave_aura')) {
            const dx = Math.sign(target.x - player.x);
            const dy = Math.sign(target.y - player.y);
            if (dx !== 0 || dy !== 0) {
                for(let i=1; i<=3; i++) {
                    const tx = player.x + (dx * i); const ty = player.y + (dy * i);
                    const enemy = currentEnemies.find(e => e.x === tx && e.y === ty && e.isAlive());
                    if (enemy && enemy !== target) {
                        addToLog("Resonant Fracture shockwave hits!", "text-cyan-300");
                        player.tempAttackMods = { multiplier: 0.5 * activeArtMultiplier }; 
                        await performPlayerAttack(enemy);
                        delete player.tempAttackMods;
                    }
                }
            }
        }
        finalizePlayerAction(); return;
    }

    else if (actionType === 'mordhau') {
        if (!player.skillToggles['fools_guard']) {
            addToLog("Requires Gallows' Invitation stance!", "text-red-400");
            isProcessingAction = false; renderBattleGrid(); return;
        }
        player.tempAttackMods = { multiplier: 0.75 * activeArtMultiplier };
        addToLog(`${player.name} delivers a Murder-Stroke!`, "text-red-500 font-bold");
        await performPlayerAttack(target);
        delete player.tempAttackMods;
        if (target.isAlive()) {
            applyStatusEffect(target, 'paralyzed', { duration: 2 }, player.name);
            addToLog(`${target.name} is dazed by the hilt strike!`, "text-yellow-400");
        }
        finalizePlayerAction(); return;
    }

    else if (actionType === 'jokers_jest') {
        addToLog(`${player.name} performs a Scornful Slash!`, "text-purple-400");
        await performPlayerAttack(target);
        if (target.isAlive()) {
            applyStatusEffect(target, 'scorned', { duration: 4, atkMult: 0.8, defMult: 0.8 }, player.name);
            addToLog(`${target.name} is humiliated! Stats reduced.`, "text-purple-300");
        }
        finalizePlayerAction(); return;
    }

    else if (actionType === 'heavy_guillotine') {
        const defLowered = target.statusEffects.sundered || target.statusEffects.scorned;
        if (defLowered) {
            player.tempCritChanceFlat = 10.0;
            player.tempAttackMods = { multiplier: 2.0 * activeArtMultiplier, critMultFlat: 1.5 }; 
            addToLog("Defense compromised! FINAL VERDICT!", "text-red-600 font-bold text-xl");
        } else {
            player.tempAttackMods = { multiplier: 2.0 * activeArtMultiplier };
            addToLog(`${player.name} executes a heavy strike.`, "text-red-400");
        }
        await performPlayerAttack(target);
        delete player.tempAttackMods;
        delete player.tempCritChanceFlat;
        finalizePlayerAction(); return;
    }

    // =========================================================================
    // LANCE ARTS
    // =========================================================================
    
    else if (actionType === 'tempest_lance') {
        addToLog(`${player.name} hurls the Tempest Lance!`, "text-cyan-300 font-bold");

        // --- CHARGE MECHANIC (From Final Horizon) ---
        if (player.encounterFlags && player.encounterFlags.nextTempestIsCharge) {
            addToLog("The Final Horizon propels you forward!", "text-yellow-300 font-bold");
            
            // Calculate destination (1 tile away from target)
            const dx = Math.sign(target.x - player.x);
            const dy = Math.sign(target.y - player.y);
            const destX = target.x - dx;
            const destY = target.y - dy;

            // Check if the tile is valid (not blocked by wall/another enemy)
            if (!isCellBlocked(destX, destY, false, player.race === 'Pinionfolk')) {
                // Move Player
                player.x = destX;
                player.y = destY;
                renderBattleGrid(); // Visual update
                
                // Track tiles moved for Momentum (technically 0 steps taken this turn, but we force the flag)
                // We rely on 'forceMomentum' flag set by Last Stand
            } else {
                addToLog("The charge path is blocked!", "text-gray-400");
            }
            
            // Consume the Charge flag, but KEEP forceMomentum until attack is done
            delete player.encounterFlags.nextTempestIsCharge;
        }

        // --- ATTACK EXECUTION ---
        gameState.currentActiveSkill = 'tempest_lance'; // Important for Titan-Bane
        player.tempAttackMods = { multiplier: 2.0 * activeArtMultiplier };
        
        await performPlayerAttack(target);
        
        delete player.tempAttackMods;
        gameState.currentActiveSkill = null; 

        // Passive: Forked Lightning
        if (player.isSkillActive('thunderous_tempest')) {
             const neighbors = currentEnemies.filter(e => 
                 e !== target && e.isAlive() && 
                 Math.abs(e.x - target.x) <= 1 && Math.abs(e.y - target.y) <= 1
             );
             const arcs = neighbors.slice(0, 2);
             if (arcs.length > 0) {
                 addToLog("Forked Lightning arcs to nearby foes!", "text-yellow-300");
                 for (const arcTarget of arcs) {
                     player.tempAttackMods = { multiplier: 0.50 * activeArtMultiplier };
                     await performPlayerAttack(arcTarget);
                     delete player.tempAttackMods; 
                 }
             }
        }
        
        // Cleanup 'forceMomentum' ONLY if it was used for this specific combo
        // If Last Stand implies *every* Tempest Lance gets momentum, remove this delete.
        // If it's only the *next* one (as per description "modify the next Tempest Lance"), delete it here.
        if (player.encounterFlags?.forceMomentum) {
             delete player.encounterFlags.forceMomentum;
        }

        finalizePlayerAction();
        return;
    }
    
    else if (actionType === 'last_stand' || actionType === 'the_final_horizon' || actionType === 'final_horizon') { 
        console.log("DEBUG: Final Horizon Activated with ID:", actionType); // Check console to confirm

        if (player.mp < 50) {
            addToLog("Not enough MP!", "text-red-500");
            return;
        }
        player.mp -= 50;

        addToLog(`${player.name} screams into the void! (ATK/DEF +25%, Cannot Flee)`, "text-red-500 font-bold");

        // Apply Infinite Duration Buff
        applyStatusEffect(player, 'buff_final_horizon', { 
            name: "The Final Horizon", 
            duration: 999, 
            description: "Atk/Def +25%, Cannot Flee",
            icon: "⚔️"
        });

        // Set Mechanics Flags
        if (!player.encounterFlags) player.encounterFlags = {};
        player.encounterFlags.cannotFlee = true;        
        player.encounterFlags.nextTempestIsCharge = true; 
        player.encounterFlags.forceMomentum = true;     

        updateStatsView();
        finalizePlayerAction();
        return;
    }   

    // =========================================================================
    // BOW ARTS
    // =========================================================================
    
    else if (actionType === 'mighty_shot') {
        player.tempAttackMods = { multiplier: 2.0, pierce: 0.25 };
        addToLog(`${player.name} fires Sky-Piercer!`, "text-yellow-300 font-bold");
        await performPlayerAttack(target);
        delete player.tempAttackMods;
        finalizePlayerAction(); return;
    }
    
    else if (actionType === 'spreadshot') {
        // Check Synergy Condition
        const isEclipse = player.skillToggles['barrage'] && player.isSkillActive('longbowmans_volley');

        // =====================================================================
        // MODE A: ECLIPSE OF STEEL (3 Waves of AoE)
        // =====================================================================
        if (isEclipse) {
            // 1. Setup Targets (3x3 Area around clicked point)
            const tx = target.x;
            const ty = target.y;
            addToLog(`${player.name} initiates Eclipse of Steel!`, "text-yellow-300 font-bold title-glow");

            // 2. Cost Management
            // Refunds the base 20 MP because we charge 10 MP per wave instead
            player.mp += cost; 
            
            gameState.suppressTurnEnd = true;

            // 3. Wave Loop
            for(let i = 1; i <= 3; i++) {
                if (gameState.battleEnded) break;

                // Pay Wave Cost (10 MP)
                if (player.mp < 10) {
                    addToLog("Not enough MP for the next wave.", "text-gray-500");
                    break;
                }
                player.mp -= 10;
                updateStatsView();

                // Log the Wave
                addToLog(`Eclipse Volley (Wave ${i}) descends!`, "text-purple-300 font-bold");

                // Identify Enemies in 3x3
                const waveTargets = [];
                for(let dy=-1; dy<=1; dy++) {
                    for(let dx=-1; dx<=1; dx++) {
                        const enemy = currentEnemies.find(e => e.x === tx+dx && e.y === ty+dy && e.isAlive());
                        if (enemy) waveTargets.push(enemy);
                    }
                }

                // Deal Damage (50% per wave)
                if (waveTargets.length > 0) {
                    for (const t of waveTargets) {
                        player.tempAttackMods = { 
                            multiplier: 0.50, 
                            description: `Eclipse of Steel (Wave ${i})` 
                        };
                        
                        // Prevent follow-ups to keep the 3-wave rhythm clean
                        await performAttack(t, { isInitiation: false, preventFollowUp: true });
                        
                        delete player.tempAttackMods;
                    }
                } else {
                    addToLog(`Wave ${i} hits only the earth.`, "text-gray-500 text-xs");
                }

                // Visual Delay between waves
                await new Promise(r => setTimeout(r, 300));
            }

            gameState.suppressTurnEnd = false;
            checkBattleStatus(true);
            finalizePlayerAction();
            return;
        }

        // =====================================================================
        // MODE B: TRI-VECTOR SHOT (Standard Multi-Target)
        // =====================================================================
        
        // Safety: If we clicked ground but are NOT in Eclipse mode, abort.
        if (!target.isAlive) {
             const enemy = currentEnemies.find(e => e.x === target.x && e.y === target.y && e.isAlive());
             if (!enemy) {
                 addToLog("Select a valid target.", "text-red-400");
                 player.mp += cost; 
                 isProcessingAction = false;
                 return;
             }
             target = enemy; 
        }

        // 1. Target Selection (Up to 3)
        let targets = [target];
        let range = (player.equippedWeapon.range || 1);
        if (player.race === 'Pinionfolk' && player.level >= 20) range += 2;
        if (player.statusEffects.bonus_range) range += player.statusEffects.bonus_range.range;
        
        const extras = currentEnemies.filter(e => 
            e !== target && e.isAlive() && 
            (Math.abs(e.x - player.x) + Math.abs(e.y - player.y)) <= range
        );

        while (targets.length < 3 && extras.length > 0) {
            const idx = Math.floor(Math.random() * extras.length);
            targets.push(extras[idx]);
            extras.splice(idx, 1);
        }

        // 2. Cascading Dread Synergy
        if (player.isSkillActive('horde_breaker')) {
            const anyMarked = targets.some(t => t.isMarked || (t.statusEffects && t.statusEffects.bow_mark));
            if (anyMarked) {
                addToLog("Cascading Dread spreads the fear!", "text-yellow-300 font-bold");
                targets.forEach(t => {
                    if (!t.statusEffects.bow_mark) {
                        applyStatusEffect(t, 'bow_mark', {
                             name: "Stalker's Gaze", type: 'debuff', duration: 5,
                             damageMod: 1.20, critMod: 0.50, icon: '🎯'
                        }, player.name);
                    }
                });
            }
        }

        // 3. Execution
        const hasKnockback = player.isSkillActive('shotgun_blast');
        addToLog(`${player.name} fires a Tri-Vector Shot!`, "text-yellow-300 font-bold");
        gameState.suppressTurnEnd = true;

        for (const t of targets) {
            if (!t.isAlive()) continue;

            player.tempAttackMods = { 
                multiplier: 0.80,
                description: "Tri-Vector Shot" 
            };

            await performAttack(t, { isInitiation: false, preventFollowUp: true });
            delete player.tempAttackMods;

            if (hasKnockback && t.isAlive() && player.rollForEffect(0.20, "Gale-Force Impact")) {
                await applyKnockback(t, player, 1);
                addToLog("Gale-Force Impact!", "text-cyan-300 text-xs");
            }
            await new Promise(r => setTimeout(r, 200));
        }

        gameState.suppressTurnEnd = false;
        checkBattleStatus(true);
        finalizePlayerAction();
        return;
    }
    
    else if (actionType === 'hunters_mark_skill') {
         // [FIX] Use applyStatusEffect for proper tracking/duration
         applyStatusEffect(target, 'bow_mark', {
             name: "Stalker's Gaze",
             type: 'debuff',
             duration: 5, // Lasts 5 turns
             damageMod: 1.20, // +20% Damage
             critMod: 0.50,   // +0.5x Crit Damage
             icon: '🎯',
             description: "Takes +20% Bow Dmg, +0.5x Crit Dmg"
         }, player.name);

         addToLog(`${target.name} is painted by the Stalker's Gaze!`, "text-red-400 font-bold");
         
         // [LOGGING] No immediate damage, but we log the success
         finalizePlayerAction(); 
         return;
    }
    
    // =========================================================================
    // FIST ARTS
    // =========================================================================
    
    const handleAeroVajraPierce = (targetEntity, damageAmount) => {
        const isUnarmored = !player.equippedArmor || player.equippedArmor.name === "Traveler's Garb";
        if (player.skillToggles['vacuum_fist'] && player.isSkillActive('way_of_empty_hand') && isUnarmored) {
            
            const dx = Math.sign(targetEntity.x - player.x);
            const dy = Math.sign(targetEntity.y - player.y);
            let cx = player.x + dx;
            let cy = player.y + dy;
            
            // Trace path up to the target
            while (cx !== targetEntity.x || cy !== targetEntity.y) {
                const collateral = currentEnemies.find(e => e.x === cx && e.y === cy && e.isAlive());
                if (collateral) {
                    const pierceDmg = Math.floor(damageAmount * 0.50);
                    collateral.takeDamage(pierceDmg, { element: 'wind', isMagic: true }, player);
                    addToLog(`Aero-Vajra pierces ${collateral.name}!`, "text-purple-300 text-xs");
                }
                cx += dx;
                cy += dy;
                if (Math.abs(cx - player.x) > 10 || Math.abs(cy - player.y) > 10) break;
            }
            return true;
        }
        return false;
    };

    // Helper: Shatterpoint (15% Chance)
    const handleShatterpoint = (targetEntity) => {
        if (player.isSkillActive('shatterpoint_impact')) {
            if (player.rollForEffect(0.15, "Shatterpoint Art")) {
                applyStatusEffect(targetEntity, 'paralyzed', { duration: 1 }, player.name);
                addToLog("Concussive Blast! Target paralyzed.", "text-cyan-300 font-bold text-xs");
            }
        }
    };

    // --- SHARED SETUP FOR FIST ARTS ---
    // Check Aero-Vajra Cost (+10 MP)
    const isUnarmored = !player.equippedArmor || player.equippedArmor.name === "Traveler's Garb";
    let extraMpCost = 0;
    if (player.skillToggles['vacuum_fist'] && player.isSkillActive('way_of_empty_hand') && isUnarmored) {
        extraMpCost = 10;
    }

    if (['savage_beast_claw', 'glacial_palm', 'palm_blast', 'avalanche_drop'].includes(actionType)) {
        if (player.mp < extraMpCost) {
            addToLog("Not enough MP for Aero-Vajra stance!", "text-red-500");
            return;
        }
        if(extraMpCost > 0) player.mp -= extraMpCost;
    }

    // [FIX] Calculate Reference Damage manually since getPhysicalAttack() doesn't exist
    // Base 10 + Stat Bonus is a safe approximation for collateral damage
    const getRefDmg = () => (player.physicalDamageBonus || 0) + 10; 

    // 1. SAVAGE BEAST CLAW
    if (actionType === 'savage_beast_claw') {
        gameState.suppressTurnEnd = true;
        addToLog(`${player.name} unleashes Bone-Breaker Flurry!`, "text-red-500 font-bold");
        
        handleAeroVajraPierce(target, getRefDmg()); 

        for(let i=0; i<5; i++) {
            if(!target.isAlive()) break;
            player.tempAttackMods = { multiplier: 0.35 * activeArtMultiplier };
            await performPlayerAttack(target, { preventFollowUp: true });
            delete player.tempAttackMods;
            await new Promise(r => setTimeout(r, 150));
        }
        
        handleShatterpoint(target); 
        gameState.suppressTurnEnd = false; checkBattleStatus(true); finalizePlayerAction(); return;
    }
    
    // 2. RESONANT PALM (Charge / Tectonic)
    else if (actionType === 'glacial_palm') {
        const hasTectonic = player.isSkillActive('tectonic_shift') && player.skillToggles['iron_mountain'];

        // --- PALM BLAST (Combo Mode) ---
        if (hasTectonic) {
            addToLog("Tectonic Shift! The earth trembles with 3 strikes!", "text-orange-400 font-bold");
            
            handleAeroVajraPierce(target, getRefDmg());

            for (let i = 1; i <= 3; i++) {
                if (!target.isAlive()) break;
                player.tempAttackMods = { multiplier: 1.0 * activeArtMultiplier };
                await performPlayerAttack(target, { preventFollowUp: true });
                if (i === 3) await applyKnockback(target, player, 1);
                else await new Promise(r => setTimeout(r, 200)); 
                delete player.tempAttackMods;
            }
            handleShatterpoint(target);
            finalizePlayerAction(); return;
        }

        // --- RESONANT PALM (Charge Mode) ---
        if (player.mp < 30) {
            addToLog("Not enough MP!", "text-red-500");
            if(extraMpCost > 0) player.mp += extraMpCost; // Refund
            return;
        }
        player.mp -= 30;

        applyStatusEffect(player, 'charging_resonant_palm', { 
            name: "Concentrating Ki", type: 'buff', duration: 99, icon: "🧘",
            description: "Unleashes Resonant Palm next turn", target: target 
        });
        addToLog(`${player.name} begins to concentrate ki...`, "text-cyan-300 animate-pulse");
        updateStatsView(); finalizePlayerAction(); return;
    }

    // 3. PALM BLAST (Standalone)
    else if (actionType === 'palm_blast') {
        const hasTectonic = player.isSkillActive('tectonic_shift') && player.skillToggles['iron_mountain'];
        const hits = hasTectonic ? 3 : 1;

        if (hasTectonic) addToLog("Tectonic Shift! 3 strikes!", "text-orange-400");
        else addToLog(`${player.name} thrusts a palm forward!`, "text-yellow-300");

        handleAeroVajraPierce(target, getRefDmg());

        for (let i = 1; i <= hits; i++) {
            if (!target.isAlive()) break;
            player.tempAttackMods = { multiplier: 1.0 * activeArtMultiplier };
            await performPlayerAttack(target, { preventFollowUp: true });
            if (i === hits) await applyKnockback(target, player, 1);
            else await new Promise(r => setTimeout(r, 200));
            delete player.tempAttackMods;
        }
        handleShatterpoint(target);
        finalizePlayerAction(); return;
    }

    // 4. AVALANCHE DROP
    else if (actionType === 'avalanche_drop') {
        player.tempAttackMods = { 
            multiplier: 1.5 * activeArtMultiplier,
            scaleWithDefense: true 
        };
        addToLog(`${player.name} crashes down with Meteor Drop!`, "text-red-500");
        
        handleAeroVajraPierce(target, getRefDmg() * 1.5);

        await performPlayerAttack(target, { preventFollowUp: true });
        delete player.tempAttackMods;
        
        if(target.isAlive() && Math.random() < 0.25) applyStatusEffect(target, 'paralyzed', { duration: 2 }, player.name);
        handleShatterpoint(target); 
        
        finalizePlayerAction(); return;
    }

    // =========================================================================
    // SHIELD ARTS
    // =========================================================================
    
    else if (actionType === 'shield_bash') {
        const shield = player.equippedShield;
        if (!shield || shield.name === 'None') { addToLog("You need a shield!", "text-red-400"); isProcessingAction = false; return; }

        const calcLog = { source: `Shield Bash`, targetName: target.name, steps: [] };
        let baseShieldDmg = Math.floor(shield.defense / 2);
        calcLog.steps.push({ description: "Base", value: `${shield.defense} / 2`, result: baseShieldDmg });
        let scalingDmg = baseShieldDmg + player.physicalDamageBonus;
        calcLog.steps.push({ description: "Stat Bonus", value: `+${player.physicalDamageBonus}`, result: scalingDmg });
        let totalDmg = Math.floor(scalingDmg * 0.5 * activeArtMultiplier);
        calcLog.steps.push({ description: "Skill Multiplier", value: "x0.50", result: totalDmg });
        
        if (totalDmg < 1) totalDmg = 1;
        addToLog(`${player.name} slams their shield into ${target.name}!`, "text-yellow-300 font-bold");
        
        const damageResult = target.takeDamage(totalDmg, { element: 'physical' }, player);
        calcLog.finalDamage = damageResult.damageDealt;
        if(damageResult.defenseSteps) calcLog.steps = calcLog.steps.concat(damageResult.defenseSteps);
        
        if(typeof logDamageCalculation === 'function') logDamageCalculation(calcLog);

        if (target.isAlive()) await applyKnockback(target, player, 1);
        checkBattleStatus(true); finalizePlayerAction(); return;
    }

    else if (actionType === 'buckler_toss') {
        const shield = player.equippedShield;
        if (!shield || shield.name === 'None') {
            addToLog("You need a shield!", "text-red-400");
            isProcessingAction = false;
            return;
        }

        let targets = [target];
        let bouncedTargets = new Set([target]);

        // [FIXED] Chain Deflection Logic
        if (player.isSkillActive('chain_deflection')) {
            let currentSource = target;
            let bounces = 0;
            // Limit increased to 3 to match description
            while (bounces < 3) {
                const neighbors = currentEnemies.filter(e => 
                    e.isAlive() && 
                    !bouncedTargets.has(e) && 
                    // Changed to Max (Chebyshev) to allow diagonal bounces
                    Math.max(Math.abs(e.x - currentSource.x), Math.abs(e.y - currentSource.y)) <= 1
                );

                if (neighbors.length > 0) {
                    const nextTarget = neighbors[Math.floor(Math.random() * neighbors.length)];
                    targets.push(nextTarget);
                    bouncedTargets.add(nextTarget);
                    currentSource = nextTarget;
                    bounces++;
                } else {
                    break;
                }
            }
        }

        addToLog(`${player.name} hurls their shield!`, "text-teal-300 font-bold");

        let baseDmg = Math.floor(shield.defense / 2);
        let totalDmg = Math.floor((baseDmg + player.physicalDamageBonus) * 0.5 * activeArtMultiplier);
        totalDmg = Math.max(1, totalDmg);

        for (const t of targets) {
            const calcLog = { source: "Buckler Toss", targetName: t.name, steps: [], baseDamage: baseDmg };
            calcLog.steps.push({ description: "Scaling", value: `x0.5`, result: totalDmg });

            const res = t.takeDamage(totalDmg, { element: 'physical' }, player);
            
            if(res.defenseSteps) calcLog.steps = calcLog.steps.concat(res.defenseSteps);
            calcLog.finalDamage = res.damageDealt;
            if(typeof logDamageCalculation === 'function') logDamageCalculation(calcLog);

            applyStatusEffect(t, 'rooted', { duration: 2 }, player.name);
        }

        checkBattleStatus(true);
        finalizePlayerAction();
        return;
    }

    // =========================================================================
    // MISC ARTS
    // =========================================================================
    
    else if (actionType === 'misty_step') {
        player.x = target.x; player.y = target.y;
        addToLog("Flicker! You vanish into mist.", "text-purple-300");
        renderBattleGrid(); finalizePlayerAction(); return;
    }

    else if (actionType === 'arcane_sigil') {
        applyStatusEffect(target, 'arcane_sigil', { duration: Infinity, multiplier: 1.2 }, player.name);
        addToLog(`${target.name} is marked by the Arcane Sigil!`, "text-purple-400");
        finalizePlayerAction(); return;
    }

    else if (actionType === 'power_swing') {
        player.tempAttackMods = { multiplier: 1.5 * activeArtMultiplier };
        addToLog(`${player.name} sunders the defense!`, "text-red-400");
        target.takeDamage(0, { ignore_defense: 0.20 }, player);
        await performPlayerAttack(target);
        delete player.tempAttackMods;
        finalizePlayerAction(); return;
    }
    
    else if (actionType === 'barbaric_swing') {
        gameState.suppressTurnEnd = true;
        addToLog("Red Mist! 3 Strikes!", "text-red-600");
        for(let i=0; i<3; i++) {
            if(!target.isAlive()) break;
            player.tempAttackMods = { multiplier: 0.6 * activeArtMultiplier };
            await performPlayerAttack(target);
            delete player.tempAttackMods;
            await new Promise(r => setTimeout(r, 150));
        }
        gameState.suppressTurnEnd = false; checkBattleStatus(true); finalizePlayerAction(); return;
    }
    
    else if (actionType === 'bone_shatter') {
        player.tempAttackMods = { multiplier: 2.0 * activeArtMultiplier };
        addToLog("Cataclysmic Slam!", "text-red-500 font-bold");
        await performPlayerAttack(target);
        delete player.tempAttackMods;
        if(target.isAlive() && Math.random() < 0.25) applyStatusEffect(target, 'paralyzed', {duration: 2}, player.name);
        finalizePlayerAction(); return;
    }
    
    else if (actionType === 'weak_point_attack') {
        // 1. Cost Check (15 MP)
        if (player.mp < 15) {
            addToLog("Not enough MP (15)!", "text-red-500");
            return;
        }
        player.mp -= 15;

        addToLog(`${player.name} aims for a vital spot! (Heartseeker)`, "text-red-400 font-bold");

        // 2. Apply Modifiers
        // 130% Damage
        player.tempAttackMods = { 
            multiplier: 1.3 * activeArtMultiplier 
        };
        
        // "High Crit Chance" -> Let's add flat +50% Crit Chance for this attack
        player.tempCritChanceFlat = 0.20; 

        // 3. Execute Attack
        await performPlayerAttack(target);

        // 4. Cleanup
        delete player.tempAttackMods;
        // tempCritChanceFlat is auto-deleted inside performPlayerAttack

        finalizePlayerAction();
        return;
    }
    // Fallback
    finalizePlayerAction();
}

function isCellBlocked(x, y, ignoreEntities = false, isFlying = false) {
    // 1. BOUNDS CHECK (Always Blocked)
    if (x < 0 || x >= gameState.gridWidth || y < 0 || y >= gameState.gridHeight) {
        return true;
    }

    // 2. DETERMINE PHASING STATE
    // Check if the player has the 'nihility_form' toggle active
    const isPhasing = (typeof player !== 'undefined' && player.skillToggles && player.skillToggles['nihility_form']);

    // 3. OBJECT CHECK (Terrain & Obstacles)
    const obj = gameState.gridObjects.find(o => o.x === x && o.y === y);
    if (obj) {
        // Walls always block, regardless of flight or phasing
        if (obj.type === 'terrain') {
            return true; 
        }
        
        // Obstacles (Pillars/Rocks) block...
        if (obj.type === 'obstacle') {
            // ...UNLESS you are Flying OR Phasing
            if (!isFlying && !isPhasing) {
                return true;
            }
        }
        
        // Note: Traps, Hazards, Portals, and Totems do not block movement
    }

    // 4. ENTITY CHECK
    // If 'ignoreEntities' is true (used for projectile paths), we skip this.
    if (!ignoreEntities) {
        // [PHASING LOGIC] 
        // If Phasing, we treat all entities as non-blocking (walkable)
        if (isPhasing) {
            return false;
        }

        // Check for Enemies
        const enemy = currentEnemies.find(e => e.x === x && e.y === y && e.isAlive());
        if (enemy) return true;

        // Check for NPC Ally
        if (player.npcAlly && player.npcAlly.x === x && player.npcAlly.y === y && !player.npcAlly.isFled) {
            return true;
        }

        // Check for Drones (Player's or NPC's)
        if (gameState.activeDrone && gameState.activeDrone.isAlive() && gameState.activeDrone.x === x && gameState.activeDrone.y === y) {
            return true;
        }
        if (gameState.npcActiveDrone && gameState.npcActiveDrone.isAlive() && gameState.npcActiveDrone.x === x && gameState.npcActiveDrone.y === y) {
            return true;
        }
    }

    return false;
}

function getLineTargets(source, target, range) {
    const targets = [];
    const dx = Math.sign(target.x - source.x);
    const dy = Math.sign(target.y - source.y);
    
    // Only orthogonal or diagonal lines
    if (dx !== 0 && dy !== 0 && Math.abs(target.x - source.x) !== Math.abs(target.y - source.y)) return []; 

    let currX = source.x;
    let currY = source.y;

    for (let i = 0; i < range; i++) {
        currX += dx;
        currY += dy;
        
        if (currX < 0 || currX >= gameState.gridWidth || currY < 0 || currY >= gameState.gridHeight) break;
        
        const enemy = currentEnemies.find(e => e.x === currX && e.y === currY && e.isAlive());
        if (enemy) targets.push(enemy);
    }
    return targets;
}

async function movePlayer(x, y) {
    // 1. Root Checks
    
    // --- LANCE SKILL INTEGRATION START ---
    if (player.skillToggles && player.skillToggles['phalanx_formation']) { 
        addToLog("Iron Bastion makes you immovable! Toggle it off to move.", "text-gray-400");
        isProcessingAction = false;
        return;
    }
    // --- LANCE SKILL INTEGRATION END ---

    if (player.skillToggles && player.skillToggles['vital_stasis']) {
        addToLog("You are rooted in Vital Stasis and cannot move!", "text-green-400");
        isProcessingAction = false; 
        return;
    }

    if (player.skillToggles && player.skillToggles['world_turtle_formation']) {
        addToLog("You are anchored in your defensive stance and cannot move!", "text-red-400");
        isProcessingAction = false; 
        return;
    }

    if (player.statusEffects.rooted) {
        addToLog("You are rooted and cannot move!", "text-red-400");
        isProcessingAction = false; 
        return;
    }

    // 2. Define Flight & Stance Flags
    const ascension = player.skillToggles && player.skillToggles['gravimetric_ascension'];
    const polarity = player.skillToggles && player.skillToggles['geomantic_polarity'];
    const windFlight = player.skillToggles && player.skillToggles['take_flight'];

    // Flight Logic: Pinionfolk OR (Ascension AND !Polarity) OR Zephyr's Ascension
    const isFlying = (player.race === 'Pinionfolk' || (ascension && !polarity) || windFlight);

    // 3. Check Destination Blockage
    const isPhasing = player.skillToggles['nihility_form'];

    // Check Entity Collision
    const isOccupiedByEntity = currentEnemies.some(e => e.x === x && e.y === y && e.isAlive()) 
                            || (player.npcAlly && player.npcAlly.x === x && player.npcAlly.y === y && !player.npcAlly.isFled)
                            || (gameState.activeDrone && gameState.activeDrone.x === x && gameState.activeDrone.y === y)
                            || (gameState.npcActiveDrone && gameState.npcActiveDrone.x === x && gameState.npcActiveDrone.y === y);

    if (isOccupiedByEntity && !isPhasing) {
        addToLog("You cannot land on an occupied space!", 'text-red-400');
        gameState.action = null;
        document.querySelectorAll('.grid-cell').forEach(c => c.classList.remove('walkable'));
        isProcessingAction = false; 
        return;
    }

    // Check what is actually at x,y
    const targetObj = gameState.gridObjects.find(o => o.x === x && o.y === y);
    
    let isBlocked = false;
    
    if (targetObj) {
        if (targetObj.type === 'terrain') isBlocked = true; // Always block walls
        else if (targetObj.type === 'obstacle' && !isPhasing) isBlocked = true; // Block pillars only if NOT phasing
        else if (targetObj.type === 'obstacle' && isPhasing) isBlocked = false; // Phase through pillars
    }

    // Fallback to standard check for bounds/flying logic if not determined yet
    if (isCellBlocked(x, y, false, isFlying)) {
        // If standard check says blocked, double check if it was just an obstacle we can now phase through
        if (!isPhasing || (targetObj && targetObj.type === 'terrain')) {
             addToLog("You can't move there, it's blocked!", 'text-red-400');
             gameState.action = null;
             document.querySelectorAll('.grid-cell').forEach(c => c.classList.remove('walkable'));
             isProcessingAction = false; 
             return;
        }
    }

    // -------------------------------------------------------------------------
    // 4. CALCULATE MOVE DISTANCE (Corrected Logic)
    // -------------------------------------------------------------------------
    let moveDistance = 3; // Base Speed
    
    // A. Stance Overrides (Priority)
    if (player.skillToggles['iron_mountain']) moveDistance = 1;

    // B. Additive/Subtractive Modifiers
    if (player.skillToggles['titan_swing']) moveDistance -= 1;
    if (player.skillToggles['crucible_of_the_beast']) moveDistance += 1;
    if (player.statusEffects.buff_stormhearted) moveDistance += 1;
    
    // Ascension & Polarity
    if (ascension) {
        if (polarity) moveDistance += 2; // Inverted (Grounded)
        else moveDistance = Math.max(1, moveDistance - 1); // Flying
    }

    // --- [FIX] WIND SKILLS ---
    if (player.skillToggles['avatar_of_tempest']) moveDistance += 1;
    // Use hasSkill for passives to ensure they work even if not "toggled"
    if (player.hasSkill('slipstream_velocity')) moveDistance += 1; 
    // -------------------------

    // Gear & Racial Bonuses
    const isUnarmored = !player.equippedArmor || player.equippedArmor.name === "Traveler’s Armor" || player.equippedArmor.name === "Traveler's Garb" || player.equippedArmor.name === "naked";
    
    // Use hasSkill for Flowing Water passive check
    if ((player.hasSkill('flowing_water') || player.isSkillActive('flowing_water')) && isUnarmored && player.equippedWeapon?.class === 'Hand-to-Hand') {
        moveDistance += 2;
    }

    if (player.race === 'Elf' && (!player.equippedArmor || !player.equippedArmor.metallic)) {
        moveDistance += (player.level >= 20 ? 2 : 1);
    }

    // Buffs & Debuffs
    if (player.statusEffects.bonus_speed) moveDistance += player.statusEffects.bonus_speed.move;
    if (player.statusEffects.buff_valhalla) moveDistance += player.statusEffects.buff_valhalla.move;
    
    // Slowed (Ensure we don't go below 1 movement unless Iron Mountain capped it)
    if (player.statusEffects.slowed) moveDistance = Math.max(1, moveDistance + player.statusEffects.slowed.move);
    
    if (player.foodBuffs.movement_speed) moveDistance += player.foodBuffs.movement_speed.value;
    // -------------------------------------------------------------------------


    // 5. Find Path
    const path = findPath({x: player.x, y: player.y}, {x, y}, isFlying);

    if (path && path.length > 1) { 
        player.hasMovedThisTurn = true;
        gameState.isPlayerTurn = false;
        
        // --- [FIX] SWINGING MOMENTUM RESET ---
        if (player.combatTags) {
            if (player.combatTags.momentumStacks > 0) {
                player.combatTags.momentumStacks = 0;
                player.combatTags.momentumLastTarget = null;
                addToLog("Hammer Momentum lost.", "text-gray-400");
            }
            if (player.combatTags.hewingStacks > 0) {
                player.combatTags.hewingStacks = 0;
                player.combatTags.hewingLastTarget = null;
            }
        }

        // --- Slipstream Velocity: Start Blast ---
        if (player.hasSkill('slipstream_velocity') && windFlight) {
            await triggerSlipstreamKnockback(player.x, player.y);
        }

        let enemiesHitThisMove = new Set();

        // --- MOVEMENT LOOP ---
        let remainingMovement = moveDistance;
        let currentStepIndex = 1;

        while (remainingMovement > 0 && currentStepIndex < path.length) {
            await new Promise(resolve => setTimeout(resolve, 150));
            
            const nextStep = path[currentStepIndex];

            // A. Determine Step Cost
            let stepCost = 1;

            // B. Check Affordability
            if (remainingMovement < stepCost) {
                addToLog("The terrain is too difficult to traverse further.", "text-orange-400");
                break;
            }

            // C. Trap Check
            if (!isFlying) {
                const trapIndex = gameState.gridObjects.findIndex(o => o.x === nextStep.x && o.y === nextStep.y && o.type === 'trap' && o.subtype === 'caltrops');
                if (trapIndex !== -1) {
                    const trap = gameState.gridObjects[trapIndex];
                    const prevX = player.x;
                    const prevY = player.y;

                    player.x = nextStep.x;
                    player.y = nextStep.y;
                    player.tilesMovedThisTurn++; 

                    // Portal Check (Caltrops triggered step)
                    const portal = gameState.gridObjects.find(o => o.type === 'portal' && o.subtype === 'void_rift' && o.x === player.x && o.y === player.y);
                    if (portal) {
                        const dest = portal.destination;
                        if (!isCellBlocked(dest.x, dest.y, false, isFlying)) {
                            addToLog("You step through the rift...", "text-purple-400 italic");
                            player.x = dest.x;
                            player.y = dest.y;
                            addToLog("...and emerge elsewhere!", "text-purple-400 italic");
                            renderBattleGrid();
                            await new Promise(r => setTimeout(r, 200));
                        }
                    }
                    
                    if (player.isSkillActive('dryads_embrace') && isElementalStateActive('nature') && typeof spawnThornyVine === 'function') {
                        spawnThornyVine(prevX, prevY, 2);
                    }

                    renderBattleGrid();
                    
                    const dmg = Math.max(1, Math.floor(player.maxHp * trap.damagePercent));
                    player.takeDamage(dmg, { ignore_defense: true });
                    addToLog(`You stepped on Caltrops!`, "text-red-500 font-bold");
                    gameState.gridObjects.splice(trapIndex, 1);
                    break; // Stop!
                }
            }

            // D. Execute Step
            const prevX = player.x; 
            const prevY = player.y; 

            player.x = nextStep.x;
            player.y = nextStep.y;
            player.tilesMovedThisTurn++; 

            // Portal Check (Standard step)
            const portal = gameState.gridObjects.find(o => o.type === 'portal' && o.subtype === 'void_rift' && o.x === player.x && o.y === player.y);
            if (portal) {
                const dest = portal.destination;
                if (!isCellBlocked(dest.x, dest.y, false, isFlying)) {
                    addToLog("You step through the rift...", "text-purple-400 italic");
                    player.x = dest.x;
                    player.y = dest.y;
                    addToLog("...and emerge elsewhere!", "text-purple-400 italic");
                    renderBattleGrid();
                    await new Promise(r => setTimeout(r, 200));
                    break; 
                }
            }

            // Voltaic Momentum
            if (player.isSkillActive('voltaic_momentum')) {
                if (typeof player.staticCharge === 'undefined') player.staticCharge = 0;
                player.staticCharge += 1;
                if (player.staticCharge > 5) player.staticCharge = 5;
                if (player.staticCharge === 5) addToLog("You are fully charged!", "text-yellow-300 font-bold");
            }
            
            // Dryad's Embrace
            if (player.isSkillActive('dryads_embrace') && isElementalStateActive('nature') && typeof spawnThornyVine === 'function') {
                spawnThornyVine(prevX, prevY, 2);
            }

            // Check Aura
            if (typeof updateTotemAuras === 'function') updateTotemAuras(player);

            renderBattleGrid();

            // E. Pay Cost & Apply Hazard Damage
            remainingMovement -= stepCost;
            currentStepIndex++;

            if (!isFlying) {
                const jagged = gameState.gridObjects.find(o => o.x === player.x && o.y === player.y && o.subtype === 'jagged_earth');
                if (jagged) {
                    const dmg = Math.max(1, Math.floor(player.maxHp * 0.05));
                    player.takeDamage(dmg, { ignore_defense: true });
                    addToLog(`You are cut by the Jagged Earth!`, "text-red-400");
                    if (!player.isAlive()) break;
                }
            }
            
            // F. Flowing Curvature
            if (player.skillToggles['flowing_curvature']) {
                const neighbors = [
                    {x: player.x+1, y: player.y}, {x: player.x-1, y: player.y},
                    {x: player.x, y: player.y+1}, {x: player.x, y: player.y-1}
                ];

                for (const n of neighbors) {
                    const enemy = currentEnemies.find(e => e.x === n.x && e.y === n.y && e.isAlive());
                    
                    if (enemy && !enemiesHitThisMove.has(enemy)) {
                        if (player.mp >= 10) {
                            player.mp -= 10;
                            updateStatsView();
                            addToLog(`Flowing Curvature strikes ${enemy.name}!`, "text-cyan-300");

                            const weapon = player.equippedWeapon;
                            let baseRoll = rollDice(weapon.damage[0], weapon.damage[1], "Flowing Curvature").total;
                            let totalAtk = baseRoll + player.physicalDamageBonus;
                            
                            let mainDmg = Math.floor(totalAtk * 0.75);
                            
                            if (typeof calcLog !== 'undefined') {
                                calcLog.steps.push({ 
                                    description: `Flowing Curvature (${enemy.name})`, 
                                    value: `${totalAtk} x 0.75`, 
                                    result: mainDmg 
                                });
                            }

                            enemy.takeDamage(mainDmg, { element: player.weaponElement }, player);
                            enemiesHitThisMove.add(enemy);

                            // Slipstream Cascade
                            if (player.hasSkill('slipstream_cascade') && player.hasSkill('flash_of_flurry')) {
                                const splashOffsets = [{x:0, y:1}, {x:0, y:-1}, {x:1, y:0}, {x:-1, y:0}];
                                let hitSplash = false;

                                for (const off of splashOffsets) {
                                    const sx = enemy.x + off.x;
                                    const sy = enemy.y + off.y;
                                    if (sx === player.x && sy === player.y) continue;
                                    const splashTarget = currentEnemies.find(e => e.x === sx && e.y === sy && e.isAlive());
                                    
                                    if (splashTarget) {
                                        hitSplash = true;
                                        let splashDmg = Math.floor(totalAtk * 0.50);
                                        if (splashDmg < 1) splashDmg = 1;

                                        if (typeof calcLog !== 'undefined') {
                                            calcLog.steps.push({ 
                                                description: `Slipstream (${splashTarget.name})`, 
                                                value: `${totalAtk} x 0.50`, 
                                                result: splashDmg 
                                            });
                                        }
                                        splashTarget.takeDamage(splashDmg, { element: player.weaponElement }, player);
                                    }
                                }
                                if (hitSplash) {
                                    addToLog("Slipstream Cascade cuts nearby foes!", "text-cyan-200 text-sm");
                                }
                            }
                        }
                    }
                }
            }
        }

        // G. Reality Phaser
        if (!isFlying) {
            const endObj = gameState.gridObjects.find(o => o.x === player.x && o.y === player.y);
            if (endObj && (endObj.type === 'obstacle' || endObj.type === 'terrain' || endObj.type === 'totem')) {
                addToLog("Reality snaps back! You are pushed out of the solid matter!", "text-purple-400");
                const neighbors = [{x:0,y:1},{x:0,y:-1},{x:1,y:0},{x:-1,y:0}];
                let pushed = false;
                for (const n of neighbors) {
                    const nx = player.x + n.x;
                    const ny = player.y + n.y;
                    if (!isCellBlocked(nx, ny, false, false)) {
                        player.x = nx; player.y = ny; pushed = true; break;
                    }
                }
                if (!pushed) {
                    player.takeDamage(999, {ignore_defense: true}); 
                    addToLog("You materialized inside a wall and were crushed.", "text-red-600 font-bold");
                }
            }
        }

        // --- Slipstream Velocity: Landing Blast ---
        if (player.hasSkill('slipstream_velocity') && windFlight) {
            await triggerSlipstreamKnockback(player.x, player.y);
        }

        checkBattleStatus(true);
        finalizePlayerAction();
    } else {
        addToLog("No path found or destination unreachable.", 'text-red-400');
        gameState.action = null;
        document.querySelectorAll('.grid-cell').forEach(c => c.classList.remove('walkable'));
        isProcessingAction = false; 
    }
}

function performAttackOnObstacle(obstacle) {
    const weapon = player.equippedWeapon;
    let weaponRange = weapon.range || 1;
    // --- PINIONFOLK: Flight (Range) ---
    if (player.race === 'Pinionfolk' && player.level >= 20) {
        weaponRange += 2;
    }
    // --- End Pinionfolk Logic ---
    if(player.statusEffects.bonus_range) weaponRange += player.statusEffects.bonus_range.range;

    const dx = Math.abs(player.x - obstacle.x);
    const dy = Math.abs(player.y - obstacle.y);

    if (dx + dy > weaponRange) {
        addToLog("You are too far away to attack the obstacle!", 'text-red-400');
        isProcessingAction = false; // Unlock on failure
        return;
    }

    gameState.isPlayerTurn = false;
    addToLog("You attack the obstacle!", "text-yellow-300");

    obstacle.hp -= 1; // Obstacles typically have low HP
    if (obstacle.hp <= 0) {
        addToLog(`You destroyed the ${obstacle.name}!`, "text-green-400");

        // Seed drop logic from obstacles
        const dropChance = 0.1 + (player.luck / 200); // 10% base + luck bonus

        // Use new rollForEffect function, which includes Human/Halfling/Dragonborn passives
        if (player.rollForEffect(dropChance, 'Obstacle Seed Drop')) {
            const seedRarities = ['Common', 'Uncommon', 'Rare'];
            const seedWeights = [70, 25, 5]; // Define chances for each rarity
            const chosenRarity = choices(seedRarities, seedWeights); // Use choices helper

            // Find available seeds of the chosen rarity
            const availableSeeds = Object.keys(ITEMS).filter(key => {
                const details = ITEMS[key];
                return details && (details.type === 'seed' || details.type === 'sapling') && details.rarity === chosenRarity;
            });

            if (availableSeeds.length > 0) {
                const seedKey = availableSeeds[Math.floor(Math.random() * availableSeeds.length)];
                player.addToInventory(seedKey, 1); // Add the seed to inventory (logs automatically)
            }
        }

        // Remove the obstacle from the grid objects array
        const index = gameState.gridObjects.indexOf(obstacle);
        if (index > -1) {
            gameState.gridObjects.splice(index, 1);
        }
    }

    renderBattleGrid(); // Update the grid visually
    finalizePlayerAction(); // Move to next phase
}

function performSpellFollowUpAttack(target) {
    if (!target || !target.isAlive()) {
        const livingEnemies = currentEnemies.filter(e => e.isAlive());
        if (livingEnemies.length > 0) {
            target = livingEnemies[0];
        } else {
            return; 
        }
    }
     if (gameState.battleEnded) return; 

    const weapon = player.equippedWeapon;
    addToLog(`Your ${weapon.name} resonates with the spell, lashing out with a follow-up strike!`, 'text-yellow-300');

    // [LOGGING ADDED]
    const calcLog = { source: "Spell Follow-up", targetName: target.name, steps: [] };

    let roll = rollDice(...weapon.damage, 'Spell Follow-up Attack');
    let baseDamage = roll.total;
    calcLog.baseDamage = baseDamage;
    calcLog.steps.push({ description: "Weapon Roll", value: roll.rolls.join('+'), result: baseDamage });

    let scaleMult = (1 + player.intelligence / 20);
    let damage = Math.floor(baseDamage * scaleMult);
    calcLog.steps.push({ description: `Int Scaling`, value: `x${scaleMult.toFixed(2)}`, result: damage });

    let attackElement = player.weaponElement;

    // Elemental Logic
    if (player.race === 'Elementals' && attackElement === player.elementalAffinity) {
        const damageBonus = (player.level >= 20) ? 1.20 : 1.10;
        damage = Math.floor(damage * damageBonus);
        calcLog.steps.push({ description: "Elemental Affinity", value: `x${damageBonus}`, result: damage });
        if (player.level >= 20) {
             let bonusRoll = rollDice(1, weapon.damage[1], 'Elemental Evo Die').total;
             damage += bonusRoll;
             calcLog.steps.push({ description: "Evo Die", value: `+${bonusRoll}`, result: damage });
        }
    }
    if (player.race === 'Dragonborn') {
        const damageBonus = (player.level >= 20) ? 1.20 : 1.10;
        damage = Math.floor(damage * damageBonus);
        calcLog.steps.push({ description: "Dragonborn", value: `x${damageBonus}`, result: damage });
    }

    damage = applyPrismaticConvergence(damage, attackEffects.element, calcLog);

    const res = target.takeDamage(damage, { element: attackElement });
    
    if(res.defenseSteps) calcLog.steps = calcLog.steps.concat(res.defenseSteps);
    calcLog.finalDamage = res.damageDealt;
    if(typeof logDamageCalculation === 'function') logDamageCalculation(calcLog);

    addToLog(`The follow-up attack hits ${target.name} for <span class="font-bold text-yellow-300">${res.damageDealt}</span> damage.`);

     if (!gameState.battleEnded) {
         checkBattleStatus(true); 
     }
}

async function performShieldFollowUpAttack(target) {
    if (!target || !target.isAlive()) return;

    // [FIX] Shield Follow-up (Check for Item Effect OR Quicksilver Skill)
    const shield = player.equippedShield;
    const isQuicksilver = player.isSkillActive('quicksilver_reaction');
    const hasEffect = shield.effect?.attack_follow_up;

    if (!hasEffect && !isQuicksilver) return;

    // 1. Calculate Damage
    let damage = 0;
    
    // Base: Shield Defense Value or Item Effect Dice
    if (hasEffect && shield.effect.attack_follow_up.damage) {
        damage = rollDice(...shield.effect.attack_follow_up.damage, 'Shield Follow-up').total;
    } else {
        damage = shield.defense || 2; 
    }

    // Quicksilver Reaction: Adds Dexterity Scaling + 50% Bonus
    if (isQuicksilver) {
        const dex = getCharacterStat(player, 'dexterity');
        damage += dex; 
        damage = Math.floor(damage * 1.5);
    } 
    // Standard Shield Mastery (if applicable)
    else if (player.isSkillActive('shield_mastery')) {
        damage += Math.floor(getCharacterStat(player, 'strength') / 2);
    }

    // 2. Prepare Log
    const skillName = isQuicksilver ? "Quicksilver Reaction" : (shield.name + " Retaliation");
    const calcLog = { 
        source: skillName, 
        targetName: target.name, 
        baseDamage: damage, 
        steps: [{ description: "Base Bash", value: `${damage}`, result: damage }] 
    };

    // 3. Apply Element/Effects
    const attackEffects = { element: player.shieldElement || 'physical', attacker: player };
    
    // Quicksilver is fast -> Ignore some defense
    if (isQuicksilver) {
        attackEffects.ignore_defense = 0.25;
        calcLog.steps.push({ description: "Velocity Pierce", value: "25%", result: "Ignored" });
    }

    // 4. Deal Damage
    const res = target.takeDamage(damage, attackEffects, player);
    
    if (res.defenseSteps) calcLog.steps = calcLog.steps.concat(res.defenseSteps);
    calcLog.finalDamage = res.damageDealt;

    // 5. Log & Animate
    addToLog(`${skillName} slams into ${target.name}!`, isQuicksilver ? "text-cyan-300 font-bold" : "text-orange-400");
    addToLog(`It strikes for <span class="font-bold text-orange-400">${res.damageDealt}</span> damage.`);
    
    if (typeof logDamageCalculation === 'function') logDamageCalculation(calcLog);

    // 6. Status Effects (Stun / Paralyze)
    // Quicksilver has a higher stun chance (40%) vs Standard bash (20% or item defined)
    let stunChance = isQuicksilver ? 0.40 : 0.0;
    
    // Use item chance if available and higher, or if not Quicksilver
    if (hasEffect && shield.effect.attack_follow_up.paralyze_chance) {
        if (shield.effect.attack_follow_up.paralyze_chance > stunChance) {
            stunChance = shield.effect.attack_follow_up.paralyze_chance;
        }
    }

    if (player.rollForEffect(stunChance, "Shield Stun")) {
        const duration = (hasEffect && shield.effect.attack_follow_up.duration) ? shield.effect.attack_follow_up.duration + 1 : 1;
        applyStatusEffect(target, 'paralyzed', { duration: duration }, player.name);
        addToLog(`${target.name} is paralyzed by the blow!`, "text-yellow-500");
    }

    if (!gameState.battleEnded) {
         checkBattleStatus(true); 
    }
}

async function performAttack(targetOrIndex, options = {}) {
    // -------------------------------------------------------------------------
    // 1. ARGUMENT RESOLUTION & DEFAULTS
    // -------------------------------------------------------------------------
    let target;
    if (typeof targetOrIndex === 'number') {
        target = currentEnemies[targetOrIndex];
    } else {
        target = targetOrIndex;
    }

    if (!target || !target.isAlive()) {
        isProcessingAction = false;
        renderBattleGrid();
        return;
    }

    const weapon = player.equippedWeapon;
    const isEntity = typeof target.takeDamage === 'function';
    
    // Options Defaults
    // isInitiation: True if this is the Player clicking "Attack". False if it's a recursive hit or skill.
    const isInitiation = options.isInitiation !== false; 
    const strikeIndex = options.strikeIndex || 1;
    const preventFollowUp = options.preventFollowUp || false;
    const sourceLabel = options.sourceLabel || (player.tempAttackMods && player.tempAttackMods.description) || "Player Attack";

    // -------------------------------------------------------------------------
    // 2. INITIATION PHASE (Range Checks & Barrage Logic)
    //    Only runs once at the start of a manual attack action.
    // -------------------------------------------------------------------------
    if (isInitiation) {
        // --- RANGE CHECK ---
        let weaponRange = weapon.range || 1;
        if (player.race === 'Pinionfolk' && player.level >= 20) weaponRange += 2;
        if (player.statusEffects.bonus_range) weaponRange += player.statusEffects.bonus_range.range;
        if (weapon.class === 'Hammer' && player.isSkillActive('titans_range')) weaponRange += 1;
        if (weapon.class === 'Dagger' && player.skillToggles['daggershot_rune']) weaponRange += 2;
        if (weapon.class === 'Thrusting Sword' && player.skillToggles['zone_of_death']) weaponRange += 1;

        const dx = Math.abs(player.x - target.x);
        const dy = Math.abs(player.y - target.y);

        if (dx + dy > weaponRange) {
            addToLog("You are too far away to attack!", 'text-red-400');
            isProcessingAction = false;
            return;
        }

        gameState.isPlayerTurn = false;

        // --- BARRAGE / HAILSTORM LOOP ---
        if (player.skillToggles['barrage']) {
            const isSoul = player.isSkillActive('soul_barrage');
            const damageMult = isSoul ? 0.75 : 0.40;
            const mpCost = isSoul ? 7 : 5;
            const skillName = isSoul ? "Spectral Hail" : "Hailstorm";
            
            const targetEffects = target.statusEffects || {};
            const isMarked = target.isMarked || targetEffects.bow_mark;
            const hasPinCushion = isMarked && player.isSkillActive('pin_cushion');
            
            const totalShots = hasPinCushion ? 4 : 3;

            addToLog(`${player.name} begins ${skillName}!`, "text-purple-300 font-bold");
            gameState.suppressTurnEnd = true;

            for (let i = 0; i < totalShots; i++) {
                if (!target.isAlive() || gameState.battleEnded) break;

                // 4th shot (Index 3) is free via Pin Cushion
                let currentCost = (i === 3) ? 0 : mpCost;
                
                if (player.mp < currentCost) {
                    addToLog("Not enough MP to continue barrage.", "text-gray-500");
                    break;
                }
                
                if (currentCost > 0) {
                    player.mp -= currentCost;
                    updateStatsView();
                } else if (i === 3) {
                    addToLog("Cruel Opportunity! Extra shot!", "text-yellow-300 text-xs");
                }

                player.tempAttackMods = { 
                    multiplier: damageMult, 
                    description: `${skillName} (Shot ${i+1})`
                };

                await performAttack(target, { 
                    isInitiation: false, 
                    strikeIndex: (i === 0 ? 1 : 2), // 1 for first shot, 2 for others (prevents on-first-hit spam)
                    preventFollowUp: true 
                });

                delete player.tempAttackMods;
                await new Promise(r => setTimeout(r, 200));
            }

            gameState.suppressTurnEnd = false;
            checkBattleStatus(true);
            finalizePlayerAction();
            return; // EXIT FUNCTION (Loop handled the attack)
        }
    }

    // -------------------------------------------------------------------------
    // 3. EXECUTION PHASE (Damage Calculation & Application)
    // -------------------------------------------------------------------------
    player.hasAttackedThisTurn = true;
    
    const calcLog = { source: sourceLabel, targetName: isEntity ? target.name : "Ground", baseDamage: 0, steps: [], finalDamage: 0 };
    let messageLog = [];
    let attackEffects = { element: player.weaponElement, attacker: player };

    // Handle Skill Pierce
    if (player.tempAttackMods && player.tempAttackMods.pierce) {
        attackEffects.ignore_defense = (attackEffects.ignore_defense || 0) + player.tempAttackMods.pierce;
        // Logging handled in detail section below
    }

    // --- A. CALCULATE DICE CONFIG ---
    let effectiveDice = getEffectiveWeaponDice(weapon, player);
    let attackDamageDice = [...effectiveDice];

    // God-Eater (Lance)
    if (isEntity && weapon.class === 'Lance' && player.isSkillActive('divine_slayer')) {
        if (target.isBoss || (target.rarityData && target.rarityData.key === 'legendary')) {
            const PROG_LIST = typeof DICE_PROGRESSION !== 'undefined' ? DICE_PROGRESSION : [1, 2, 4, 6, 8, 10, 12, 14, 16, 20];
            const currentMax = attackDamageDice[1];
            const currentIndex = PROG_LIST.indexOf(currentMax);
            if (currentIndex !== -1) {
                const newIndex = Math.min(currentIndex + 2, PROG_LIST.length - 1);
                const newMax = PROG_LIST[newIndex];
                if (newMax > currentMax) {
                    attackDamageDice[1] = newMax;
                    calcLog.steps.push({ description: "God-Eater (Dice Up)", value: `d${currentMax}->d${newMax}`, result: "Active" });
                    addToLog("God-Eater manifests! Weapon Die increased.", "text-purple-300 text-xs");
                }
            }
        }
    }

    // =========================================================================
    // [CRIT CHECK] - RESTRICTED SYSTEM
    // =========================================================================
    let isCrit = false;
    
    // 1. Determine if the weapon is CAPABLE of critting
    let canCrit = false;
    let critSource = "None"; // For debugging who enabled it

    // A. Innate Weapon Traits
    if (weapon.class === 'Dagger') { canCrit = true; critSource = "Innate (Dagger)"; }
    if ((weapon.critChance && weapon.critChance > 0) || (weapon.effect && weapon.effect.critChance > 0)) {
            canCrit = true;
            critSource = "Innate (Effect)";
        }

    // B. Active Skills / Buffs that enable Crits
    if (player.tempCritChanceFlat && player.tempCritChanceFlat > 0) { canCrit = true; critSource = "Active Skill (Temp Buff)"; }
    if (player.tempAttackMods && player.tempAttackMods.critChanceFlat > 0) { canCrit = true; critSource = "Attack Mod"; }

    // C. Specific Skill Toggles (Manual Whitelist)
    if (player.skillToggles['mountain_magic_arts'] && weapon.class === 'Hammer') { canCrit = true; critSource = "Mountain Rune"; }
    
    if (player.isSkillActive('predators_wisdom') && player.skillToggles['crimson_feast'] && weapon.class === 'Axe') { 
        canCrit = true; 
        critSource = "Predator's Wisdom"; 
    }
    
    if (player.statusEffects.buff_sepulchral) { canCrit = true; critSource = "Sepulchral Might"; }

    // 2. Calculate & Log Chance (Only if capable)
    let critChance = 0;
    
    if (canCrit) {
        // We'll store the breakdown here to log it nicely
        let critBreakdown = [];

        // --- Base Stats ---
        critChance = player.critChance; 
        if (critChance > 0) critBreakdown.push({ name: "Base Stats (Dex/Luck)", val: critChance });

        // --- Modifiers ---
        if (player.tempCritChanceFlat) {
            critChance += player.tempCritChanceFlat;
            critBreakdown.push({ name: "Temp Buff", val: player.tempCritChanceFlat });
        }
        if (player.tempAttackMods?.critChanceFlat) {
            critChance += player.tempAttackMods.critChanceFlat;
            critBreakdown.push({ name: "Attack Modifier", val: player.tempAttackMods.critChanceFlat });
        }

        // --- Skill Specifics ---
        if (player.statusEffects.buff_sepulchral) {
            critChance += 0.25;
            critBreakdown.push({ name: "Sepulchral Might", val: 0.25 });
        }
        if (weapon.class === 'Dagger') {
            critChance += 0.1;
            critBreakdown.push({ name: "Dagger Innate", val: 0.1 });
        }
        if (player.isSkillActive('sharpened_dagger') && weapon.class === 'Dagger') {
            critChance += 0.1;
            critBreakdown.push({ name: "Honed Edge", val: 0.1 });
        }
        if (player.skillToggles['mountain_magic_arts'] && weapon.class === 'Hammer') {
            critChance += 0.05;
            critBreakdown.push({ name: "Rune of the Mountain", val: 0.05 });
        }
        if (player.isSkillActive('predators_wisdom') && player.skillToggles['crimson_feast'] && weapon.class === 'Axe') {
             critChance += 0.05;
             critBreakdown.push({ name: "Predator's Wisdom", val: 0.05 });
        }
        if (player.skillToggles['rite_old_gods'] && player.skillToggles['crimson_feast']) {
             critChance += 0.10;
             critBreakdown.push({ name: "Blood Synergy", val: 0.10 });
        }
        if (player.isSkillActive('predators_wisdom') && player.skillToggles['crimson_feast']) {
             // 1. Tomahawk Hurl (+15% Crit)
             if (options.skillName === 'Tomahawk Hurl') {
                 critChance += 0.15;
                 critBreakdown.push({ name: "Predator's Wisdom (Hurl)", val: 0.15 });
             } 
             // 2. Normal Attacks (+5% Crit)
             else if (weapon.class === 'Axe' && !options.skillName) {
                 critChance += 0.05;
                 critBreakdown.push({ name: "Predator's Wisdom", val: 0.05 });
             }
        }

        // --- Caps ---
        if (critChance > 1.0) critChance = 1.0;

        // --- LOGGING THE BREAKDOWN ---
        calcLog.steps.push({ description: "=== CRIT CHANCE ===", value: `(Enabled by ${critSource})`, result: "" });
        
        let runningTotal = 0;
        critBreakdown.forEach(item => {
            runningTotal += item.val;
            calcLog.steps.push({ 
                description: item.name, 
                value: `+${(item.val * 100).toFixed(0)}%`, 
                result: `${(runningTotal * 100).toFixed(0)}%` 
            });
        });

        calcLog.steps.push({ description: "Final Chance", value: "", result: `${(critChance * 100).toFixed(0)}%` });

        // --- ROLL ---
        if (player.rollForEffect(critChance, 'Crit Roll')) {
            isCrit = true;
            messageLog.push("CRITICAL HIT!");

            if (player.isSkillActive('sneak_attack_passive') && weapon.class === 'Dagger') {
                const oldDice = attackDamageDice[0];
                attackDamageDice[0] *= 2; 
                calcLog.steps.push({ description: "Vital Precision (Dice x2)", value: `${oldDice} -> ${attackDamageDice[0]} dice`, result: "Active" });
            }
        }
    } else {
        // Optional: Log that crit was disabled if you want to know why it DIDN'T happen
        // calcLog.steps.push({ description: "Crit Chance", value: "Disabled", result: "0%" });
    }

    // --- B. CALCULATE BASE DAMAGE ---
    let rollResult = rollDice(attackDamageDice[0], attackDamageDice[1], sourceLabel);
    let baseWeaponDamage = rollResult.total;
    calcLog.steps.push({ description: isCrit ? "Base Roll (Crit)" : "Base Roll", value: rollResult.rolls.join('+'), result: baseWeaponDamage });

    // Iron Mountain Bonus
    if (player.skillToggles['iron_mountain'] && weapon.class === 'Hand-to-Hand') {
        const imRoll = rollDice(1, 4, 'Iron Mountain').total;
        baseWeaponDamage += imRoll;
        calcLog.steps.push({ description: "Iron Mountain", value: `+${imRoll}`, result: baseWeaponDamage });
    }

    // Titanfall (Bonus Damage)
    if (isEntity && player.isSkillActive('colossus_slayer') && weapon.class === 'Bow') {
        const isMarked = target.isMarked || (target.statusEffects && target.statusEffects.bow_mark);
        if (isMarked) {
            const isBossOrLegendary = target.isBoss || (target.rarityData && target.rarityData.key === 'legendary');
            const titanDice = isBossOrLegendary ? 10 : 8;
            const titanRoll = rollDice(1, titanDice, "Titanfall").total;
            baseWeaponDamage += titanRoll;
            calcLog.steps.push({ description: isBossOrLegendary ? "Titanfall (Boss)" : "Titanfall", value: `+${titanRoll}`, result: baseWeaponDamage });
        }
    }

    // --- C. FOLLOW-UP SOURCES ---
    const followUpSources = [
        // 1. CLASS SKILL INFUSIONS
        { condition: () => player.statusEffects.buff_blade_of_fire, name: "Blade of Fire", element: 'fire', dice: [1, 8], cost: 0 },
        { condition: () => player.statusEffects.skill_force_infusion, name: "Kinetic Infusion", element: 'physical', dice: [1, 8], cost: 0 },
        { condition: () => player.statusEffects.buff_frozen_armament, name: "Frozen Armament", element: 'water', dice: [1, 8], cost: 0, onHit: (t) => { if (isEntity) { if (!t.statusEffects.frostbite) t.statusEffects.frostbite = { stacks: 0 }; t.statusEffects.frostbite.stacks += 1; } } },
        { condition: () => player.statusEffects.buff_keraunos_charge, name: "Keraunos' Charge", element: 'lightning', dice: [1, 8], cost: 0 },
        { condition: () => player.statusEffects.buff_decaying_touch, name: "Decaying Touch", element: 'nature', dice: [1, typeof getNatureDiceSize === 'function' ? getNatureDiceSize(8) : 8], cost: 0 },
        { condition: () => player.skillToggles['crucible_of_the_beast'], name: () => { const parts = ["Beast Claw", "Beast Fang", "Beast Tail"]; return parts[Math.floor(Math.random() * parts.length)]; }, element: 'nature', dice: [2, typeof getNatureDiceSize === 'function' ? getNatureDiceSize(6) : 6], cost: 20, scaling: 'physical' },
        { condition: () => player.skillToggles['wrathful_smite'], name: "Benediction of Fire", element: 'light', dice: [2, typeof getLightDiceSize === 'function' ? getLightDiceSize(8) : 8], cost: 30 },
        { condition: () => player.skillToggles['tectonic_edge'], name: "Tectonic Edge", element: 'earth', dice: [1, 8], cost: 0 },
        { condition: () => player.skillToggles['entropy_edge'], name: "Entropy Edge", element: 'void', dice: [1, 10], cost: 0 },
        { condition: () => player.skillToggles['zephyrs_edge'], name: "Zephyr's Edge", element: 'wind', dice: [1, 8], cost: 0 },
        { 
            condition: () => player.tempAttackMods && player.tempAttackMods.skillName === "Michaella's Verdict",
            name: "Holy Smite", 
            element: 'light', 
            dice: () => [2, typeof getLightDiceSize === 'function' ? getLightDiceSize(8) : 8], 
            cost: 0 
        },
        { 
            condition: () => player.tempAttackMods && player.tempAttackMods.skillName === "Hallowed Barrage",
            name: "Hallowed Light", 
            element: 'light', 
            // Base 1d4, upgrades to 1d6 if you have light mastery
            dice: () => [1, typeof getLightDiceSize === 'function' ? getLightDiceSize(4) : 4], 
            cost: 0 
        },
        // 2. GREASE BUFFS
        { 
            condition: () => player.statusEffects.buff_elemental_grease, 
            name: () => player.statusEffects.buff_elemental_grease.name || "Weapon Grease", 
            element: player.statusEffects.buff_elemental_grease?.element || 'physical', 
            dice: player.statusEffects.buff_elemental_grease?.damage || [1, 8], 
            cost: 0 
        },

        // 3. [FIX] GENERIC/ITEM ELEMENTAL INFUSION
        // Triggers if the weapon itself has an element (Innate or Item-Applied)
        // and is NOT 'physical' or 'none'.
        { 
            condition: () => {
                // A. Check for Item Buffs (e.g. buff_fire_infusion)
                const elements = ['fire', 'water', 'earth', 'wind', 'lightning', 'nature', 'light', 'void', 'ice'];
                const hasBuff = elements.some(el => player.statusEffects[`buff_${el}_infusion`]);
                
                // B. Check for Innate Weapon Element
                const innateEl = player.weaponElement;
                const hasInnate = innateEl && innateEl !== 'physical' && innateEl !== 'none';
                
                return hasBuff || hasInnate;
            }, 
            name: () => {
                const elements = ['fire', 'water', 'earth', 'wind', 'lightning', 'nature', 'light', 'void', 'ice'];
                const activeBuffEl = elements.find(el => player.statusEffects[`buff_${el}_infusion`]);
                
                // Display "Elemental Infusion" for items, "Innate Infusion" for weapons
                if (activeBuffEl) return `Elemental Infusion (${capitalize(activeBuffEl)})`;
                return `Innate Infusion (${capitalize(player.weaponElement)})`;
            },
            element: () => {
                const elements = ['fire', 'water', 'earth', 'wind', 'lightning', 'nature', 'light', 'void', 'ice'];
                const activeBuffEl = elements.find(el => player.statusEffects[`buff_${el}_infusion`]);
                // Item Buff takes priority over Innate Element
                return activeBuffEl || player.weaponElement || 'physical';
            }, 
            dice: () => {
                // Check if this is a Consumable Buff (for Resonance)
                const elements = ['fire', 'water', 'earth', 'wind', 'lightning', 'nature', 'light', 'void', 'ice'];
                const isConsumable = elements.some(el => player.statusEffects[`buff_${el}_infusion`]);

                // 1. Determine Base Size (Standard: 8)
                let sides = 8;
                
                // 2. Check Greater Infusion (Passive Skill)
                const hasMastery = (typeof player.hasSkill === 'function' && player.hasSkill('greater_infusion')) || (player.skills && player.skills['greater_infusion']);
                if (hasMastery) sides = 10;

                // 3. [NEW] Elemental Sword Bonus (+1 Step)
                // If using Elemental Sword, d8 becomes d10, d10 becomes d12
                if (player.equippedWeapon.key === 'elemental_sword') {
                    if (sides === 8) sides = 10;
                    else if (sides === 10) sides = 12;
                }

                // 4. Essence Resonance (Double Dice Count)
                const hasResonance = (typeof player.hasSkill === 'function' && player.hasSkill('essence_mastery')) || (player.skills && player.skills['essence_mastery']);
                const count = (isConsumable && hasResonance) ? 2 : 1;

                return [count, sides];
            },
            cost: 0 
        }
    ];

    // --- EXECUTE FOLLOW-UP SOURCES (Updated Logging) ---
    for (const source of followUpSources) {
        let isActive = false;
        try { isActive = source.condition(); } catch(e) { console.warn("Infusion check failed", e); }

        if (isActive) {
            // Prevent double-dipping: 
            // If we already applied a specific skill infusion (like Blade of Fire),
            // and that skill MATCHES the current weapon element, the generic check above might trigger too.
            // However, usually Skill Buffs are temporary status effects and don't change 'player.weaponElement' directly.
            // If your game engine DOES update 'player.weaponElement' for skills like Blade of Fire, 
            // you might want to add a check here to skip the Generic one if a Specific one ran.
            
            if (source.cost > 0) {
                if (player.mp < source.cost) continue; 
                player.mp -= source.cost;
            }
            
            // Resolve Name, Dice, and Element
            const dName = typeof source.name === 'function' ? source.name() : source.name;
            const diceArr = (typeof source.dice === 'function') ? source.dice() : source.dice; 
            const dCount = diceArr ? diceArr[0] : 1;
            const dSides = diceArr ? diceArr[1] : 8;

            const roll = rollDice(dCount, dSides, dName).total;
            baseWeaponDamage += roll;
            
            // [LOGGING] Explicitly show the dice formula (e.g., "+5 (1d8)")
            calcLog.steps.push({ 
                description: `${dName}`, 
                value: `+${roll} (${dCount}d${dSides})`, 
                result: baseWeaponDamage 
            });
            
            if (source.onHit && isEntity && target.isAlive()) source.onHit(target);
            
            const el = (typeof source.element === 'function') ? source.element() : source.element;
            if (attackEffects.element === 'none' || attackEffects.element === 'physical') {
                attackEffects.element = el;
            }
        }
    }

    if (isEntity && player.statusEffects.buff_insatiable_void && player.statusEffects.buff_insatiable_void.voidShred > 0) {
        applyStatusEffect(target, 'void_shred', { name: "Void Shred", type: 'debuff', duration: 3, defenseMult: 0.90, icon: '📉' });
        
        // FIX: Changed targetName to target.name
        addToLog(`${target.name} is shredded by the Void!`, "text-purple-300 text-xs");
    }

    if (player.skillToggles['nihility_form']) {
        attackEffects.ignore_defense = (attackEffects.ignore_defense || 0) + 0.10;
        calcLog.steps.push({ description: "Nihility Phase (Pierce)", value: "+10%", result: "Active" });
    }

    // Pre-Attack Toggles
    let isDaggershot = false;
    if (weapon.class === 'Dagger' && player.skillToggles['daggershot_rune']) {
        if (player.mp >= 5) {
            player.mp -= 5;
            isDaggershot = true;
            updateStatsView();
            if (player.isSkillActive('slipshot_rune')) attackEffects.ignore_defense = (attackEffects.ignore_defense || 0) + 0.50; 
        } else {
            player.skillToggles['daggershot_rune'] = false;
            addToLog("Phantom Throw deactivated (No MP).", "text-red-400");
        }
    }

    if (weapon.class === 'Thrusting Sword' && player.skillToggles['tripping_blow']) {
        if (strikeIndex === 1) {
            if (player.mp >= 15) {
                player.mp -= 15;
                updateStatsView();
                calcLog.steps.push({ description: "Viper's Bite", value: "-15 MP", result: "Active" });

                // 20% Chance to Trip
                if (player.rollForEffect(0.20, "Viper's Bite Trip")) {
                    addToLog(`${target.name} is Tripped by the blow!`, "text-yellow-300 font-bold");
                    
                    // 1. Stun
                    applyStatusEffect(target, 'stunned', { duration: 1 }, player.name);
                    
                    // 2. Defense Break (Fixed: use defenseMult instead of multiplier)
                    applyStatusEffect(target, 'sundered', { 
                        name: "Tripped (Exposed)", 
                        type: 'debuff', 
                        duration: 2, 
                        defenseMult: 0.75, // Reduces defense by 25%
                        icon: '🦶' 
                    }, player.name);
                }
            } else {
                player.skillToggles['tripping_blow'] = false;
                addToLog("Viper's Bite deactivated (Insufficient MP).", "text-gray-400");
            }
        }
    }
    
    // Execute Follow-Up Sources
    calcLog.baseDamage = baseWeaponDamage;
    let damage = baseWeaponDamage;

    // --- D. STAT SCALING ---
    let statBonus = 0;
    if (player.tempAttackMods && player.tempAttackMods.scaleWithDefense) {
        const def = player.physicalDefense || 0;
        statBonus = Math.floor(def / 2);
        damage += statBonus;
        calcLog.steps.push({ description: `Defense Scaling`, value: `+${statBonus}`, result: damage });
    } else {
        // [FIX] Adaptive Scaling Logic (Troll's Knight Sword)
        let scalingVal = player.physicalDamageBonus;
        let scaleLabel = "Stat Scaling";

        if (weapon.effect && weapon.effect.adaptiveScaling) {
            const magicBonus = player.magicalDamageBonus || 0;
            if (magicBonus > player.physicalDamageBonus) {
                scalingVal = magicBonus;
                scaleLabel = "Adaptive Scaling (Magic)";
            } else {
                scaleLabel = "Adaptive Scaling (Phys)";
            }
        }

        const scaleMult = 1 + (scalingVal / 20);
        damage = Math.floor(damage * scaleMult);
        statBonus = Math.floor(scalingVal / 5);
        damage += statBonus;
        
        calcLog.steps.push({ description: scaleLabel, value: `x${scaleMult.toFixed(2)} + ${statBonus}`, result: damage });
    }

    // --- E. MULTIPLIERS ---
    calcLog.steps.push({ description: "=== MULTIPLIERS ===", value: "", result: "" });

    damage = applyElementalMastery(damage, attackEffects.element, calcLog);

    if (attackEffects.element === 'fire') {
        const fireFluctuation = 0.8 + (Math.random() * 0.4);
        damage = Math.floor(damage * fireFluctuation);
        
        calcLog.steps.push({ 
            description: "Fire Fluctuation", 
            value: `x${fireFluctuation.toFixed(2)}`, 
            result: damage 
        });
    }

    if (weapon.effect && weapon.effect.bonusVsDragon) {
        // Check Class OR Name (covers Cockatrice/Livyatan if they aren't class 'Dragon')
        const isDragon = (target.speciesData && target.speciesData.class === 'Dragon') || 
                         ['Cockatrice', 'Livyatan', 'Dragon'].some(n => target.name.includes(n));

        if (isDragon) {
            damage = Math.floor(damage * weapon.effect.bonusVsDragon);
            calcLog.steps.push({ 
                description: "Dragon Slayer", 
                value: `x${weapon.effect.bonusVsDragon}`, 
                result: damage 
            });
        }
    }
    if (weapon.effect && weapon.effect.bonusVsLegendary) {
        // Check if target is a Boss or has Legendary rarity
        // We check multiple flags to be safe (isBoss, rarity string, or rarityData object)
        const isLegendaryOrBoss = target.isBoss || 
                                  target.rarity === 'Legendary' || 
                                  (target.rarityData && target.rarityData.name === 'Legendary');

        if (isLegendaryOrBoss) {
            damage = Math.floor(damage * weapon.effect.bonusVsLegendary);
            calcLog.steps.push({ 
                description: "Giant Slayer", 
                value: `x${weapon.effect.bonusVsLegendary}`, 
                result: damage 
            });
        }
    }
    // Stalker's Gaze (+20% Dmg)
    if (isEntity && target.statusEffects && target.statusEffects.bow_mark && weapon.class === 'Bow') {
        const mod = target.statusEffects.bow_mark.damageMod || 1.2;
        damage = Math.floor(damage * mod);
        calcLog.steps.push({ description: "Stalker's Gaze", value: `x${mod}`, result: damage });
    }

    if (player.isSkillActive('standing_elegance') && weapon.class === 'Thrusting Sword' && !player.hasMovedThisTurn) {
        damage = Math.floor(damage * 1.10);
        calcLog.steps.push({ description: "Standing Elegance", value: "x1.10", result: damage });
    }

    if (player.isSkillActive('muscle_control')) {
        damage = Math.floor(damage * 1.05);
        calcLog.steps.push({ description: "Kinetic Awakening", value: "x1.05", result: damage });
    }

    if (player.isSkillActive('dextrous_control')) {
        const swiftWeapons = ['Dagger', 'Thrusting Sword', 'Curved Sword', 'Reaper', 'Bow'];
        if (swiftWeapons.includes(weapon.class)) {
            damage = Math.floor(damage * 1.10);
            calcLog.steps.push({ description: "Flow State", value: "x1.10", result: damage });
        }
    }

    if (player.isSkillActive('focal_agility')) {
        const specialistWeapons = ['Reaper', 'Thrusting Sword', 'Curved Sword'];
        if (specialistWeapons.includes(weapon.class)) {
            damage = Math.floor(damage * 1.05);
            calcLog.steps.push({ description: "Weapon Resonance", value: "x1.05", result: damage });
        }
    }

    if (player.isSkillActive('swinging_momentum') && weapon.class === 'Hammer') {
        // [FIX] SWINGING MOMENTUM DAMAGE
        // Check if current target matches the last one in tags
        if (!player.combatTags) player.combatTags = {};
        
        const currentTargetId = target.id; 
        
        if (player.combatTags.momentumLastTarget === currentTargetId) {
            // Apply Bonus based on existing stacks
            let stacks = player.combatTags.momentumStacks || 0;
            let momentumBonus = Math.min(stacks * 0.10, 0.50); // Cap at 50%
            
            if (momentumBonus > 0) {
                damage = Math.floor(damage * (1 + momentumBonus));
                calcLog.steps.push({
                    description: "Swinging Momentum",
                    value: `+${(momentumBonus * 100).toFixed(0)}%`,
                    result: damage
                });
            }
        } else {
            // Target changed: Reset stacks (bonus applies to NEXT hit)
            player.combatTags.momentumStacks = 0;
        }
    }    

    if (weapon.class === 'Curved Sword') {
        const stacks = player.curvedSwordMomentum || 0;
        if (stacks > 0) {
            // [FIX] Differentiate Unending Dance vs Normal
            let perStack = 0.025; // Default 2.5%
            let label = "Momentum";

            if (weapon.key === 'unending_dance') {
                perStack = 0.05; // 5% for Unending Dance
                label = "Unending Flow";
            }

            const momentumMult = 1 + (stacks * perStack);
            damage = Math.floor(damage * momentumMult);
            
            calcLog.steps.push({ 
                description: `${label} (x${stacks})`, 
                value: `x${momentumMult.toFixed(2)}`, 
                result: damage 
            });
        }
    }

    if (isEntity && player.isSkillActive('consecution_technique')) {
        const swiftWeapons = ['Dagger', 'Thrusting Sword', 'Curved Sword', 'Reaper', 'Bow'];
        if (swiftWeapons.includes(weapon.class)) {
            if (typeof player.rhythmTargetId === 'undefined') player.rhythmTargetId = null;
            if (typeof player.rhythmStacks === 'undefined') player.rhythmStacks = 0;

            if (player.rhythmTargetId === target) {
                player.rhythmStacks = Math.min(3, player.rhythmStacks + 1);
            } else {
                player.rhythmStacks = 0;
                player.rhythmTargetId = target;
            }

            if (player.rhythmStacks > 0) {
                const rhythmBonus = player.rhythmStacks * 0.10;
                damage = Math.floor(damage * (1 + rhythmBonus));
                calcLog.steps.push({ description: `Rhythm of Ruin (x${player.rhythmStacks})`, value: `+${(rhythmBonus*100).toFixed(0)}%`, result: damage });
            }
        } else {
            player.rhythmStacks = 0;
            player.rhythmTargetId = null;
        }
    }

    if (weapon.class === 'Lance' && player.isSkillActive('charge')) { 
        if (player.tilesMovedThisTurn >= 2 || player.encounterFlags?.forceMomentum) {
            damage = Math.floor(damage * 1.50);
            calcLog.steps.push({ description: "Momentum", value: "x1.50", result: damage });
        }
    }

    if (isEntity && weapon.class === 'Lance' && player.skillToggles['giant_hunt']) {
        if (player.mp >= 15) {
            player.mp -= 15;
            const rarityMap = { 'common': 0, 'uncommon': 1, 'rare': 2, 'epic': 3, 'legendary': 4 };
            let rKey = 'common';
            if (target.rarityData && target.rarityData.key) rKey = target.rarityData.key;
            else if (typeof target.rarity === 'string') rKey = target.rarity; 
            const rIndex = rarityMap[rKey] || 0;
            
            let stalkerBonus = rIndex * 0.10;
            if (target.isBoss) stalkerBonus += 0.10;

            if (stalkerBonus > 0) {
                damage = Math.floor(damage * (1 + stalkerBonus));
                calcLog.steps.push({ description: `Behemoth Stalker`, value: `x${(1+stalkerBonus).toFixed(2)}`, result: damage });
            }

            if (player.isSkillActive('mortal_smite') && gameState.currentActiveSkill === 'tempest_lance') {
                const pierceAmount = 0.10 + (rIndex * 0.10);
                attackEffects.ignore_defense = (attackEffects.ignore_defense || 0) + pierceAmount;
                calcLog.steps.push({ description: "Titan-Bane Pierce", value: `${(pierceAmount*100).toFixed(0)}% Ignored`, result: "Applied" });

                if (target.isBoss || rKey === 'legendary') {
                    damage = Math.floor(damage * 1.50);
                    calcLog.steps.push({ description: "Titan-Bane (Slayer)", value: "x1.50", result: damage });
                }
            }
            updateStatsView(); 
        } else {
            player.skillToggles['giant_hunt'] = false; 
            addToLog("Behemoth Stalker deactivated (No MP).", "text-gray-500");
        }
    }

    const HEAVY_WEAPONS = ['Hand-to-Hand', 'Longsword', 'Axe', 'Hammer', 'Lance'];
    if (HEAVY_WEAPONS.includes(weapon.class) && player.isSkillActive('power_strengthening')) {
        damage = Math.floor(damage * 1.10);
        calcLog.steps.push({ description: "Titanic Grip", value: "x1.10", result: damage });
    }

    if (player.skillToggles['barbaric_strength']) {
        damage = Math.floor(damage * 1.25);
        calcLog.steps.push({ description: "Reckless Abandon", value: "x1.25", result: damage });
    }

    if (player.statusEffects.buff_final_horizon) {
        damage = Math.floor(damage * 1.25);
        calcLog.steps.push({ description: "Final Horizon", value: "x1.25", result: damage });
    }

    if (player.skillToggles['nihility_form']) {
        damage = Math.floor(damage * 1.25);
        calcLog.steps.push({ description: "Nihility Form", value: "x1.25", result: damage });
    }

    if (weapon.class === 'Axe' && player.isSkillActive('predators_wisdom') && player.skillToggles['crimson_feast'] && !player.tempAttackMods) {
        damage = Math.floor(damage * 1.5); 
        calcLog.steps.push({ description: "Predator's Wisdom", value: "x1.50", result: damage });
    }
    
    // -- NOTE: You had a duplicate 'player.hammerMomentumStacks' check here in the old code.
    // I have removed it because the new Swinging Momentum logic handles it via combatTags.
    
    if (weapon.class === 'Hammer' && player.isSkillActive('dwarven_battle_arts')) {
        let bonus = player.isSkillActive('landslide_movement_arts') ? 1.15 : 1.10;
        damage = Math.floor(damage * bonus);
        calcLog.steps.push({ description: "Dwarven Arts", value: `x${bonus.toFixed(2)}`, result: damage });
    }
    if (player.skillToggles['titan_swing'] && weapon.class === 'Hammer') {
        damage = Math.floor(damage * 1.10);
        calcLog.steps.push({ description: "Titan's Swing", value: "x1.10", result: damage });
    }
    if (weapon.class === 'Reaper' && player.skillToggles['force_switch_blade']) {
        damage = Math.floor(damage * 1.10);
        calcLog.steps.push({ description: "Switch Blade", value: "x1.10", result: damage });
    }
    
    if (player.statusEffects.buff_crimson_penance) {
        damage = Math.floor(damage * 1.25);
        calcLog.steps.push({ description: "Crimson Penance", value: "x1.25", result: damage });
    }
    
    if (player.isSkillActive('patience_devotion') && weapon.class === 'Reaper' && player.statusEffects.buff_crimson_penance) {
        const currentElement = attackEffects.element || 'physical';
        if (currentElement !== 'physical' && currentElement !== 'none') {
            damage = Math.floor(damage * 1.10);
            calcLog.steps.push({ description: "Martyr's Fervor", value: "x1.10", result: damage });
        }
    }
    if (player.statusEffects.buff_deadly_dance) {
        const bonus = player.statusEffects.buff_deadly_dance.damageMult;
        damage = Math.floor(damage * (1 + bonus));
        calcLog.steps.push({ description: `Deadly Dance (+${(bonus*100).toFixed(0)}%)`, value: `x${(1+bonus).toFixed(2)}`, result: damage });
    }
    // Global Buffs
    if (player.statusEffects.buff_strength) {
        damage = Math.floor(damage * player.statusEffects.buff_strength.multiplier);
        calcLog.steps.push({ description: "Strength Buff", value: `x${player.statusEffects.buff_strength.multiplier}`, result: damage });
    }
    if (player.statusEffects.buff_enrage) {
        damage = Math.floor(damage * 1.5);
        calcLog.steps.push({ description: "Enrage", value: "x1.50", result: damage });
    }
    if (player.statusEffects.buff_gore_howl) {
        damage = Math.floor(damage * 1.5);
        messageLog.push("The red mist empowers you!");
        calcLog.steps.push({ description: "Gore-Crazed Howl", value: "x1.5", result: damage });
    }
    if (player.statusEffects.buff_valhalla) {
        damage = Math.floor(damage * player.statusEffects.buff_valhalla.atkMult);
        calcLog.steps.push({ description: "Einherjar's Vigor", value: `x${player.statusEffects.buff_valhalla.atkMult}`, result: damage });
    }
    if (player.statusEffects.buff_magmatic_stress) {
        damage = Math.floor(damage * 1.25);
        calcLog.steps.push({ description: "Heating Rock", value: "x1.25", result: damage });
    }
    if (player.statusEffects.buff_lithic_aura) {
        damage = Math.floor(damage * 1.25);
        calcLog.steps.push({ description: "Lithic Aura", value: "x1.25", result: damage });
    }
    if (player.statusEffects.buff_stormhearted) {
        damage = Math.floor(damage * 1.30);
        calcLog.steps.push({ description: "Stormhearted", value: "x1.50", result: damage });
    }
    if (player.skillToggles['avatar_of_tempest']) {
        damage = Math.floor(damage * 1.30); 
        calcLog.steps.push({ description: "Avatar of Tempest", value: "x1.30", result: damage });
    }
    
    // [INJECTED] SWIFT AGILITY
    if (strikeIndex === 3) {
        damage = Math.floor(damage * 0.50);
        calcLog.steps.push({ description: "Swift Agility (3rd Strike)", value: "x0.50", result: damage });
    }

    // Skill Multipliers (passed via tempAttackMods)
    let skillMultiplier = 1.0;
    if (player.tempAttackMods && player.tempAttackMods.multiplier) {
        skillMultiplier = player.tempAttackMods.multiplier;
    }

    if (skillMultiplier !== 1.0) {
        damage = Math.floor(damage * skillMultiplier);
        const desc = (player.tempAttackMods && player.tempAttackMods.description) ? player.tempAttackMods.description : "Art Multiplier";
        calcLog.steps.push({ description: desc, value: `x${skillMultiplier.toFixed(2)}`, result: damage });
    }

    // =====================================================================
    // STEP 2: APPLY DAMAGE PENALTY (0.6x / 0.4x)
    // =====================================================================
    const isActiveSkill = player.tempAttackMods && (player.tempAttackMods.multiplier !== undefined);
    if (weapon.class === 'Curved Sword' && !isActiveSkill) { 
        let multiHitMod = 1.0;
        let modName = "";

        // Dervish's Grace Logic
        if (player.skillToggles['pure_elegance']) {
            if (strikeIndex === 1) {
                if (player.mp >= 15) {
                    player.mp -= 15;
                    updateStatsView();
                    multiHitMod = 0.40;
                    modName = "Dervish's Grace";
                } else {
                    player.skillToggles['pure_elegance'] = false;
                    addToLog("Dervish's Grace deactivated (Insufficient MP).", "text-gray-400");
                    if (player.hasSkill('sword_dance')) {
                        multiHitMod = 0.60;
                        modName = "Twin-Moon Crescent";
                    }
                }
            } else {
                multiHitMod = 0.40;
                modName = "Dervish's Grace";
            }
        }
        else if (player.hasSkill('sword_dance')) {
            multiHitMod = 0.60;
            modName = "Twin-Moon Crescent";
        }

        if (multiHitMod < 1.0 && multiHitMod > 0) {
            damage = Math.floor(damage * multiHitMod);
            calcLog.steps.push({ description: modName, value: `x${multiHitMod.toFixed(2)}`, result: damage });
        }
    }

    // --- F. APPLY CRIT MULTIPLIER ---
    if (isCrit) {
        // This line correctly grabs the 2.0 from Assassin's Claws
        let baseMult = weapon.effect?.critMultiplier || 1.5; 
        
        let bonusMult = (player.tempAttackMods?.critMultFlat || 0) + (player.tempCritMult || 0);

        if (player.skillToggles['mountain_magic_arts'] && weapon.class === 'Hammer') {
            baseMult = 2.0;
        }

        if (isEntity && target.statusEffects && target.statusEffects.bow_mark && weapon.class === 'Bow') {
            bonusMult += (target.statusEffects.bow_mark.critMod || 0.5);
        }
        if (player.isSkillActive('standing_elegance') && weapon.class === 'Thrusting Sword' && !player.hasMovedThisTurn) {
            bonusMult += 0.2;
        }
        if (player.statusEffects.buff_sepulchral) bonusMult += 1.0;
        if (player.isSkillActive('sharpened_dagger') && weapon.class === 'Dagger') bonusMult += 0.5;

        let finalMult = baseMult + bonusMult;
        damage = Math.floor(damage * finalMult);
        
        calcLog.steps.push({ 
            description: "CRITICAL" + (player.statusEffects.buff_sepulchral ? " (Sepulchral)" : ""), 
            value: `x${finalMult.toFixed(2)}`, 
            result: damage 
        });
    }
    delete player.tempCritChanceFlat;

    damage = applyVoltaicMomentum(damage, attackEffects.element, calcLog);

    damage = applyPrismaticConvergence(damage, attackEffects.element, calcLog);

    // =========================================================================
    // [INJECTED] DETAILED DEFENSE PIERCE LOGIC
    // =========================================================================
    let totalPierce = (attackEffects.ignore_defense || 0);
    const pierceLog = [];

    // 0. Base Pierce
    if (totalPierce > 0) {
        pierceLog.push({ name: "Base Skill Pierce", val: totalPierce });
    }

    // 1. Skill Specific Overrides
    if (player.tempAttackMods) {
        if (player.tempAttackMods.pierce) {
            totalPierce += player.tempAttackMods.pierce;
            pierceLog.push({ name: "Skill Effect", val: player.tempAttackMods.pierce });
        }
        if (player.tempAttackMods.ignore_defense === true) {
            totalPierce = 1.0; 
            pierceLog.push({ name: "True Damage (Ignore Def)", val: 1.0 });
        }
    }

    // 2. Weapon Innate
    if (weapon.class === 'Thrusting Sword') {
        totalPierce += 0.05;
        pierceLog.push({ name: "Thrusting Sword (Innate)", val: 0.05 });
    }

    if (weapon.effect && weapon.effect.armorPierce) {
        totalPierce += weapon.effect.armorPierce;
        pierceLog.push({ name: "Weapon Properties", val: weapon.effect.armorPierce });
    } 

    // 3. Element Innate (Void/Dark)
    if (attackEffects.element === 'void') {
        totalPierce += 0.10;
        pierceLog.push({ name: "Void Penetration", val: 0.10 });
    }

    // 4. Light Weapon Passives
    const SWIFT_WEAPONS = ['Dagger', 'Thrusting Sword', 'Curved Sword', 'Reaper', 'Bow'];
    if (SWIFT_WEAPONS.includes(weapon.class)) {
        if (player.isSkillActive('defense_exploitation')) {
            totalPierce += 0.05;
            pierceLog.push({ name: "Needle's Eye", val: 0.05 });
        }
        if (player.isSkillActive('tailors_instinct')) {
            totalPierce += 0.05;
            pierceLog.push({ name: "Thread Cutter", val: 0.05 });
        }
    }

    // 5. Active Toggles
    if (weapon.class === 'Thrusting Sword' && player.skillToggles['piercing_fang']) {
        totalPierce += 0.10;
        pierceLog.push({ name: "Needlepoint Stance", val: 0.10 });
    }
    if (player.skillToggles['nihility_form']) {
        totalPierce += 0.10;
        pierceLog.push({ name: "Nihility Form", val: 0.10 });
    }

    // 6. Synergies
    if (weapon.class === 'Dagger' && player.skillToggles['daggershot_rune'] && player.isSkillActive('slipshot_rune')) {
        totalPierce += 0.10;
        pierceLog.push({ name: "Shadow Piercing", val: 0.10 });
    }
    
    if (sourceLabel && (sourceLabel.includes("Bloom") || sourceLabel.includes("Flurry")) && player.isSkillActive('void_flurry')) {
        totalPierce += 0.10;
        pierceLog.push({ name: "Void Flurry", val: 0.10 });
    }

    // 7. Titan-Bane
    if (weapon.class === 'Lance' && player.isSkillActive('mortal_smite') && gameState.currentActiveSkill === 'tempest_lance') {
        let rKey = 'common';
        if (target.rarityData && target.rarityData.key) rKey = target.rarityData.key;
        else if (typeof target.rarity === 'string') rKey = target.rarity;
        
        const rarityMap = { 'common': 0, 'uncommon': 1, 'rare': 2, 'epic': 3, 'legendary': 4 };
        const rIndex = rarityMap[rKey] || 0;
        
        if (rIndex > 0) {
            const val = rIndex * 0.05;
            totalPierce += val;
            pierceLog.push({ name: `Titan-Bane (Tier ${rIndex})`, val: val });
        }
    }

    if (player.isSkillActive('woodcutter') && weapon.class === 'Axe') {
        // Check if we are hitting the same target as last time
        if (player.combatTags && player.combatTags.hewingLastTarget === target.id) {
            const stacks = player.combatTags.hewingStacks || 0;
            
            if (stacks > 0) {
                // 5% per stack, max 25%
                const reduction = Math.min(stacks * 0.05, 0.25);
                totalPierce += reduction; 
                
                pierceLog.push({ 
                    name: `Hewing Strikes (x${stacks})`, 
                    val: reduction 
                });
            }
        }
    }

    const isRiteActive = player.skillToggles['rite_old_gods'];
    const isFeastActive = player.skillToggles['crimson_feast'];
    
    if (isRiteActive && isFeastActive) {
        // 1. Damage Boost (10%)
        damage = Math.floor(damage * 1.10);
        
        // 2. Crit Rate Boost (10%)
        // If you calculate crit earlier, move this check up. 
        // Otherwise, we can simulate it by forcing a lucky roll if close enough.
        // For now, let's just log the power increase so you know it's working.
        calcLog.steps.push({
            description: "Blood Synergy",
            value: "+10% Dmg/Crit",
            result: `${damage}`
        });
    }

    // Apply Final Value
    attackEffects.ignore_defense = Math.min(1.0, totalPierce);

    // LOGGING
    if (pierceLog.length > 0) {
        calcLog.steps.push({ description: "=== PIERCE SOURCES ===", value: "", result: "" });
        pierceLog.forEach(p => {
            calcLog.steps.push({ 
                description: p.name, 
                value: `+${(p.val * 100).toFixed(0)}%`, 
                result: `${(totalPierce * 100).toFixed(0)}% Total` 
            });
        });
    }

    // --- G. APPLY DAMAGE ---
    let finalDamage = 0;
    let damageResult = { damageDealt: 0 }; 

    if (isEntity) {
        calcLog.steps.push({ description: "=== DEFENSE ===", value: "", result: "" });

        if (target.isAlive() && weapon.effect && weapon.effect.execute) {
                // 1. Identify Boss Status
            // (Checks for explicit 'isBoss' flag, Legendary rarity, or Tier 4/5 Raid Boss names)
            const isBoss = (target.isBoss) || 
                           (target.rarity === 'Legendary') || 
                           (target.speciesData && ['Dragon', 'Livyatan', 'Mountain Goliath', 'Chimera', 'Dullahan'].includes(target.speciesData.class));

            // 2. Set Rules
            // Standard: 25% HP Threshold, 25% Trigger Chance
            // Boss: 10% HP Threshold, 10% Trigger Chance
            const thresholdRatio = isBoss ? 0.10 : 0.25;
            const chance = isBoss ? 0.10 : 0.25;

            // 3. Check Conditions
            const thresholdHP = Math.floor(target.maxHp * thresholdRatio);
            
            if (target.hp <= thresholdHP) {
                // 4. Roll the Dice
                if (Math.random() < chance) {
                    const execDmg = target.hp;
                    target.hp = 0; // Instant Death
                    
                    addToLog(`${target.name} is executed by the ${weapon.name}!`, "text-red-600 font-bold title-glow");
                    
                    // Visuals
                    if (typeof createFloatingText === 'function') {
                        createFloatingText(target.x, target.y, "EXECUTE", "red");
                    }
                    
                    // Log update
                    calcLog.steps.push({ 
                        description: "Execution Triggered", 
                        value: `< ${thresholdRatio*100}% HP`, 
                        result: "FATAL" 
                    });
                    
                    finalDamage += execDmg; // Ensure lifesteal/stats track the full kill volume
                } else {
                    // Optional: Log the failed attempt so you know it *could* have happened
                    console.log(`Execution Failed: Rolled > ${chance}`);
                }
            }
        }

        // [HELPER] Determine Damage Type Label (e.g., " Fire")
        // If physical or none, show empty string (standard "damage")
        const currentElement = attackEffects.element;
        const dmgTypeLabel = (currentElement && currentElement !== 'physical' && currentElement !== 'none') 
                             ? ` ${capitalize(currentElement)}` 
                             : '';

        // [LOGIC START: GORE-CRAZED CHAIN CHECK]
        const isGoreActive = player.statusEffects.buff_gore_howl;
        const hasScavenger = (typeof player.hasSkill === 'function' && player.hasSkill('scavengers_eye')) || (player.skills && player.skills.scavengers_eye);
        
        // BRANCH A: THE 3-HIT CHAIN (Axe Only)
        if (isGoreActive && hasScavenger && weapon.class === 'Axe') {
            addToLog(">> GORE-CRAZED CHAIN! (3 Hits) <<", "text-red-500 font-bold");
            
            const chainDamage = Math.floor(damage * 0.50);
            calcLog.steps.push({ description: "Scavenger's Chain", value: "3 Hits @ 50%", result: `${chainDamage} per hit` });

            let chainTotal = 0;

            for (let i = 1; i <= 3; i++) {
                if (!target.isAlive()) break;

                // 1. Deal Damage (Clone effects so we don't mutate original)
                let chainHitRes = target.takeDamage(chainDamage, { ...attackEffects, isChainHit: true }, player);
                chainTotal += chainHitRes.damageDealt;
                
                // 2. Log specific hit [UPDATED WITH ELEMENT]
                addToLog(`Chain Hit ${i}: <span class="font-bold text-yellow-300">${chainHitRes.damageDealt}</span>${dmgTypeLabel} damage.`);
                
                // 3. Feast Logic (Per Hit)
                if (isFeastActive) {
                    const baseHeal = Math.floor(player.maxHp * 0.05);
                    const lifesteal = Math.floor(chainHitRes.damageDealt * 0.05);
                    const totalHeal = baseHeal + lifesteal;
                    if (player.hp < player.maxHp) {
                        player.hp = Math.min(player.maxHp, player.hp + totalHeal);
                        addToLog(`Feast (Hit ${i}): +${totalHeal} HP`, "text-green-300 text-xs");
                    }
                }
            }
            finalDamage = chainTotal;
            damageResult = { damageDealt: finalDamage }; 

        } 
        // BRANCH B: STANDARD ATTACK
        else {
            damageResult = target.takeDamage(damage, { ...attackEffects, silent: true }, player);
            finalDamage = damageResult.damageDealt;

            if (finalDamage > 0 && weapon.class === 'Curved Sword') {
                if (typeof player.curvedSwordMomentum === 'undefined') player.curvedSwordMomentum = 0;
                
                // [FIX] Cap Logic: 20 for normal, Infinite for Unending Dance
                const stackCap = (weapon.key === 'unending_dance') ? Infinity : 20;

                if (player.curvedSwordMomentum < stackCap) {
                    player.curvedSwordMomentum++;
                }
                
                // Important: Mark that we hit something so stacks don't decay at end of turn
                player.hasHitEnemyThisTurn = true;
            }
            
            if (damageResult.defenseSteps) calcLog.steps = calcLog.steps.concat(damageResult.defenseSteps);
            
            // Magmatic Stress Knockback (Standard only)
            if (player.statusEffects.buff_magmatic_stress && finalDamage > 0 && target.isAlive()) {
                addToLog("Heating Rock: The impact sends them flying!", "text-orange-400");
                await applyKnockback(target, player, 1);
            }

            let extraLog = messageLog.length > 0 ? `(${messageLog.join(', ')})` : "";
            
            // [UPDATED LOG WITH ELEMENT]
            addToLog(`You hit ${target.name} for <span class="font-bold text-yellow-300">${finalDamage}</span>${dmgTypeLabel} damage. ${extraLog}`);

            // Shatterpoint Impact (Hand-to-Hand)
            if (finalDamage > 0 && target.isAlive() && weapon.class === 'Hand-to-Hand' && player.isSkillActive('shatterpoint_impact')) {
                if (player.rollForEffect(0.05, "Shatterpoint")) {
                    applyStatusEffect(target, 'paralyzed', { duration: 1 }, player.name);
                    addToLog("Shatterpoint! The target seizes up!", "text-cyan-300 font-bold text-xs");
                }
            }
        }
        // [LOGIC END]
    }

    calcLog.finalDamage = finalDamage;

    // [STANDARD FEAST LOGIC]
    // Only run this if we are NOT doing the chain (chain handles it per hit)
    const isChainAttack = isEntity && player.statusEffects.buff_gore_howl && player.skills?.scavengers_eye && weapon.class === 'Axe';

    if (!isChainAttack && isFeastActive && weapon.class === 'Axe') {
        const baseHeal = Math.floor(player.maxHp * 0.05);
        const lifesteal = Math.floor(finalDamage * 0.05); // 5% of ACTUAL damage dealt
        const totalHeal = baseHeal + lifesteal;

        if (player.hp < player.maxHp) {
            player.hp = Math.min(player.maxHp, player.hp + totalHeal);
            
            addToLog(`Feast: +${baseHeal} (Base) + ${lifesteal} (Drain) HP`, "text-green-300 text-xs");
            
            calcLog.steps.push({ 
                description: "Crimson Feast", 
                value: "5% HP + 5% Dmg", 
                result: `+${totalHeal} HP` 
            });
        }
    }

    if (typeof logDamageCalculation === 'function') logDamageCalculation(calcLog);

    // --- H. SECONDARY EFFECTS (Ground, Etc.) ---
    if (isEntity && finalDamage > 0) {

        // Water Weapon Logic
        if (attackEffects.element === 'water') {
            let chance = getSecondaryChance(player.equippedWeapon?.rarity || 'Common');

            // [MODIFIED] Crashing Wake: Force 100% Chance
            if (player.isSkillActive('crashing_wake')) {
                chance = 1.0; 
            }

            // 1. Roll
            const isSuccess = player.rollForEffect(chance, "Water Weapon (Drenched)");

            // 2. Log (Check if calcLog exists in this scope)
            if (typeof calcLog !== 'undefined' && calcLog.steps) {
                calcLog.steps.push({ 
                    description: "Effect Chance", 
                    value: `${(chance * 100).toFixed(0)}%`, 
                    result: isSuccess ? "Triggered" : "Failed" 
                });
            }

            // 3. Apply
            if (isSuccess) {
                applyStatusEffect(target, 'drenched', { duration: 3, move: -1, multiplier: 0.80 }, player.name);
                addToLog(`${target.name} is Drenched by the strike!`, "text-blue-400");
            }
        }

        if (attackEffects.element === 'earth') {
            const chance = getSecondaryChance(player.equippedWeapon?.rarity || 'Common');
            
            // Roll the dice
            const isSuccess = player.rollForEffect(chance, "Earth Weapon (Paralyze)");

            // Add to Calc Log
            if (typeof calcLog !== 'undefined' && calcLog.steps) {
                calcLog.steps.push({
                    description: "Effect Chance",
                    value: `${(chance * 100).toFixed(0)}%`,
                    result: isSuccess ? "Triggered" : "Failed"
                });
            }

            // Apply Effect
            if (isSuccess) {
                // We typically check if they are already paralyzed to prevent redundant messaging
                if (!target.statusEffects.paralyzed) {
                    applyStatusEffect(target, 'paralyzed', { duration: 2 }, player.name);
                    addToLog(`${target.name} is Paralyzed by the heavy blow!`, "text-amber-600");
                }
            }
        }

        if (attackEffects.element === 'wind') {
            const chance = getSecondaryChance(player.equippedWeapon?.rarity || 'Common');
            const isSuccess = player.rollForEffect(chance, "Wind Weapon (Knockback)");

            // Log to Tooltip
            if (typeof calcLog !== 'undefined' && calcLog.steps) {
                calcLog.steps.push({
                    description: "Effect Chance",
                    value: `${(chance * 100).toFixed(0)}%`,
                    result: isSuccess ? "Triggered" : "Failed"
                });
            }

            // Apply Effect
            if (isSuccess) {
                // Assuming applyKnockback(target, source, distance) exists
                applyKnockback(target, player, 1);
                addToLog(`${target.name} is blasted back by the gale!`, "text-cyan-400");
            }
        }

        if (attackEffects.element === 'nature') {
            const percent = getLifestealPercentage(player.equippedWeapon?.rarity || 'Common');
            const healAmount = Math.floor(finalDamage * percent);

            // Log Magnitude to Tooltip
            if (typeof calcLog !== 'undefined' && calcLog.steps) {
                calcLog.steps.push({
                    description: "Nature Lifesteal",
                    value: `${(percent * 100).toFixed(0)}%`,
                    result: `+${healAmount} HP`
                });
            }

            if (healAmount > 0) {
                player.hp = Math.min(player.maxHp, player.hp + healAmount);
                addToLog(`You drain <span class="font-bold text-green-400">${healAmount}</span> HP from nature's grasp!`, "text-green-300");
                if (typeof updateStatsView === 'function') updateStatsView();
            }
        }

        if (attackEffects.element === 'lightning') {
            const chance = getSecondaryChance(player.equippedWeapon?.rarity || 'Common');
            
            if (player.rollForEffect(chance, "Lightning Weapon (Chain)")) {
                
                // Add to Calc Log
                if (typeof calcLog !== 'undefined' && calcLog.steps) {
                    calcLog.steps.push({ description: "Chain Proc", value: "Success", result: "Active" });
                }

                // FIX: Pass 'target' object, not 'target.id'
                const bounceTarget = getChainTarget(target, 3, target);
                
                if (bounceTarget) {
                    const chainDamage = Math.floor(finalDamage * 0.50);
                    bounceTarget.takeDamage(chainDamage, { element: 'lightning' }, player);
                    addToLog(`⚡ The lightning arcs to ${bounceTarget.name} for ${chainDamage} damage!`, "text-yellow-400 font-bold");
                }
            }
        }

        if (attackEffects.element === 'light') {
            const chance = getSecondaryChance(player.equippedWeapon?.rarity || 'Common');
            const isSuccess = player.rollForEffect(chance, "Light Weapon (Purify)");

            // Log Chance
            if (typeof calcLog !== 'undefined' && calcLog.steps) {
                calcLog.steps.push({
                    description: "Effect Chance",
                    value: `${(chance * 100).toFixed(0)}%`,
                    result: isSuccess ? "Triggered" : "Failed"
                });
            }

            if (isSuccess) {
                // 1. Identify potential actions
                const myDebuffs = Object.keys(player.statusEffects).filter(e => CLEANSABLE_DEBUFFS.includes(e));
                const enemyBuffs = Object.keys(target.statusEffects).filter(e => PURGEABLE_BUFFS.includes(e));
                
                let action = null;

                // 2. Decide what to do
                if (myDebuffs.length > 0 && enemyBuffs.length > 0) {
                    // If both exist, 50/50 flip
                    action = Math.random() < 0.5 ? 'cleanse_self' : 'purge_enemy';
                } else if (myDebuffs.length > 0) {
                    action = 'cleanse_self';
                } else if (enemyBuffs.length > 0) {
                    action = 'purge_enemy';
                }

                // 3. Execute
                if (action === 'cleanse_self') {
                    const effect = myDebuffs[0]; // Cleanse first found
                    delete player.statusEffects[effect];
                    addToLog(`✨ The light cleanses your ${effect}!`, "text-yellow-200 font-bold");
                    if (typeof updateStatsView === 'function') updateStatsView();
                } else if (action === 'purge_enemy') {
                    const effect = enemyBuffs[0]; // Purge first found
                    delete target.statusEffects[effect];
                    addToLog(`✨ The light strips ${target.name}'s ${effect}!`, "text-yellow-200 font-bold");
                } else {
                    // Triggered but nothing to do
                    // addToLog("The light shines, but finds nothing to purify.", "text-gray-400");
                }
            }
        }

        if (weapon.effect && weapon.effect.cleanseChance) {
            // 1. Roll for effect (e.g., 25% chance)
            if (player.rollForEffect(weapon.effect.cleanseChance, "Holy Cleansing")) {
                let cleansedCount = 0;
                
                // 2. Iterate through cleansable debuffs defined in battle.js
                // (CLEANSABLE_DEBUFFS usually includes 'poisoned', 'burned', 'cursed', etc.)
                CLEANSABLE_DEBUFFS.forEach(status => {
                    if (player.statusEffects[status]) {
                        delete player.statusEffects[status];
                        cleansedCount++;
                    }
                });

                // 3. Feedback
                if (cleansedCount > 0) {
                    addToLog("The Holy Beast Halberd purges your afflictions!", "text-cyan-300 font-bold");
                    updateStatsView(); // Refresh UI to show debuffs are gone
                }
            }
        }

        if (weapon.effect && weapon.effect.petrifyChance) {
            // 1. Roll the dice (30% Chance)
            if (player.rollForEffect(weapon.effect.petrifyChance, "Petrification")) {
                // 2. Apply Status
                // 'petrified' acts like a long stun/freeze. 
                // If 'petrified' isn't explicitly defined in your engine's update loop, 
                // it usually falls back to generic skip-turn logic if handled like 'stunned'.
                // Duration: 3 turns (Standard for "stone" status in RPGs)
                applyStatusEffect(target, 'petrified', { duration: 2 }, player.name);
                
                // 3. Feedback
                addToLog(`${target.name} is turned to stone!`, "text-gray-500 font-bold title-glow");
                
                // Optional: Visual indicator if your engine supports it
                if (typeof createFloatingText === 'function') {
                    createFloatingText(target.x, target.y, "STONE", "gray");
                }
            }
        }
        
        // [FIX] CALCULATE SERRATED MASTERY MULTIPLIER
        let debuffChanceMult = 1.0;
        if (player.isSkillActive('bloodcarver_dagger') && weapon.class === 'Dagger') {
            debuffChanceMult = 1.5;
        }

        let lifesteal = 0;
        // Check species class (Prevent lifesteal on Undead/Constructs if desired, or remove this check to buff it)
        if (target.speciesData && target.speciesData.class !== 'Undead' && target.speciesData.class !== 'Construct') {
            if (weapon.effect && weapon.effect.lifesteal) lifesteal += weapon.effect.lifesteal;
            
            // Skill/Class Bonuses
            if (player.isSkillActive('bloodcarver_dagger') && weapon.class === 'Dagger') lifesteal *= 1.5;
            if (player.isSkillActive('necrotic_ascension')) lifesteal += 0.20;
        }
        
        // Global Lifesteal Sources
        if (weapon.class === 'Reaper' && !player.skillToggles['force_switch_blade']) lifesteal += 0.1;
        if (player.statusEffects.buff_crimson_penance) lifesteal += 0.15;
        if (player.statusEffects.buff_insatiable_void && player.statusEffects.buff_insatiable_void.lifesteal) {
            lifesteal += player.statusEffects.buff_insatiable_void.lifesteal;
        }

        if (lifesteal > 0) {
            const heal = Math.floor(finalDamage * lifesteal);
            if (heal > 0) {
                player.hp = Math.min(player.maxHp, player.hp + heal);
                addToLog(`Lifesteal: <span class="text-green-300 font-bold">+${heal} HP</span>`, "text-green-200 text-xs");
                updateStatsView();
            }
        }

        // GROUP A: Effects that require the target to be ALIVE
        if (target.isAlive()) {

            if (weapon.effect) {
                // Claw of Chimera Logic
                if (weapon.effect.toxicChance) {
                    if (player.rollForEffect(weapon.effect.toxicChance, "Weapon Toxin")) {
                        applyStatusEffect(target, 'toxic', { duration: 3 }, player.name);
                        addToLog(`${target.name} is injected with Chimera toxin!`, "text-green-400 font-bold");
                    }
                }
                
                // Future-proofing for other status weapons
                if (weapon.effect.poisonChance) {
                    if (player.rollForEffect(weapon.effect.poisonChance, "Weapon Poison")) {
                        applyStatusEffect(target, 'poison', { duration: 3 }, player.name);
                        addToLog(`${target.name} is poisoned by the blade!`, "text-green-300");
                    }
                }
            }

            if (weapon.class === 'Hammer') {
                let stunChance = 0.10; // Base 10%

                // [FIX] Add Dwarven & Earthshaker Bonuses
                // Reads the 'paralyzeChance' (0.1 or 0.2) from player_data.js and adds it to the stun chance
                if (weapon.effect && weapon.effect.paralyzeChance) {
                    stunChance += weapon.effect.paralyzeChance;
                }

                // Dwarven Warhammer: 0.10 + 0.10 = 20%
                // Earthshaker Hammer: 0.10 + 0.20 = 30%
                if (player.rollForEffect(stunChance, "Hammer Impact")) {
                    applyStatusEffect(target, 'stunned', { duration: 1 }, player.name);
                    addToLog(`${target.name} is stunned by the heavy impact!`, "text-yellow-400 font-bold");
                }
            }
            // Serrated Blade
            if (weapon.class === 'Longsword' && player.isSkillActive('serrated_blade')) {
                let bleedChance = gameState.activeSkill ? 0.20 : 0.10;
                if (player.rollForEffect(bleedChance, "Cruel Serration")) {
                    applyStatusEffect(target, 'bleeding', { duration: 3, damage: Math.ceil(player.level / 2) }, player.name);
                    addToLog("Cruel Serration causes bleeding!", "text-red-400 text-xs");
                }
            }
            
            // Antspur Piercing
            if (player.skillToggles['antspur_piercing']) {
                const swiftWeapons = ['Dagger', 'Thrusting Sword', 'Curved Sword', 'Reaper', 'Bow'];
                if (swiftWeapons.includes(weapon.class)) {
                    const chance = 0.10 * debuffChanceMult;
                    if (player.rollForEffect(chance, "Antspur Injection")) {
                        if (player.mp >= 15) {
                            player.mp -= 15;
                            const poisonDmg = Math.max(1, Math.ceil(player.level / 2));
                            applyStatusEffect(target, 'poisoning', { duration: 3, damage: poisonDmg, stacks: 1 }, player.name);
                            addToLog("Antspur Injection! The rot spreads...", "text-purple-300 font-bold text-xs");
                            updateStatsView();
                        } else {
                            addToLog("Antspur Injection failed (Insufficient MP).", "text-gray-500 text-xs");
                        }
                    }
                }
            }

            // Tectonic Edge
            if (player.skillToggles['tectonic_edge'] && player.rollForEffect(0.10, "Tectonic Paralyze")) {
                applyStatusEffect(target, 'paralyzed', { duration: 2 }, player.name);
                addToLog("The weight of the earth crushes them! (Paralyzed)", "text-yellow-400 font-bold");
            }

            // Grease Debuffs
            // 1. Poisonous Grease
            if (player.statusEffects.buff_poison_grease) {
                const grease = player.statusEffects.buff_poison_grease;
                const baseChance = (grease.poisonChance || 0.20) + (player.luck * 0.005);
                const finalChance = baseChance * debuffChanceMult;

                if (player.rollForEffect(finalChance, "Poison Grease")) {
                    const tickDmg = Math.max(1, Math.floor(finalDamage * 0.25));
                    applyStatusEffect(target, 'poison', { duration: 3, damage: tickDmg, source: player.name }, "Poisonous Grease");
                    addToLog("The grease infects the wound! (Sepsis)", "text-green-300 text-xs");
                }
            }

            // 2. Paralysis Grease
            if (player.statusEffects.buff_paralysis_grease) {
                const grease = player.statusEffects.buff_paralysis_grease;
                const baseChance = (grease.paralyzeChance || 0.20) + (player.luck * 0.005);
                const finalChance = baseChance * debuffChanceMult;

                if (player.rollForEffect(finalChance, "Paralysis Grease")) {
                    applyStatusEffect(target, 'paralyzed', { duration: 1, source: player.name }, "Paralysis Grease");
                    addToLog("The sticky paste binds them! (Paralyzed)", "text-yellow-300 text-xs");
                }
            }

            // Entropy Edge
            if (player.skillToggles['entropy_edge']) {
                if (!target.statusEffects.void_erosion) target.statusEffects.void_erosion = { stacks: 0, duration: 4 };
                const erosion = target.statusEffects.void_erosion;
                if (erosion.stacks < 5) erosion.stacks++;
                erosion.duration = 4; 
                addToLog(`${target.name} erodes under the void! (Def -${erosion.stacks * 5}%)`, "text-purple-400 text-xs");
            }

            // Lifesteal
        }

        // GROUP B: Area/Splash Effects (Work even if target dies)
        if (isDaggershot) {
            const dx = Math.sign(target.x - player.x);
            const dy = Math.sign(target.y - player.y);
            
            const applyDaggerSplash = (enemy, name) => {
                const splashDmg = Math.floor(damage * 0.5);
                const ignoreDef = player.isSkillActive('slipshot_rune') ? 0.5 : 0;
                
                const splashLog = { 
                    source: name, targetName: enemy.name, baseDamage: splashDmg, 
                    steps: [{ description: "Splash (50%)", value: `${damage} * 0.5`, result: splashDmg }] 
                };

                const res = enemy.takeDamage(splashDmg, { element: 'physical', attacker: player, ignore_defense: ignoreDef }, player);
                if (res.defenseSteps) splashLog.steps = splashLog.steps.concat(res.defenseSteps);
                splashLog.finalDamage = res.damageDealt;
                if (typeof logDamageCalculation === 'function') logDamageCalculation(splashLog);

                return res.damageDealt;
            };

            if (player.isSkillActive('scattershot_rune')) {
                const side1 = { x: target.x - dy, y: target.y + dx };
                const side2 = { x: target.x + dy, y: target.y - dx };
                [side1, side2].forEach(pos => {
                    const enemy = currentEnemies.find(e => e.x === pos.x && e.y === pos.y && e.isAlive());
                    if (enemy) {
                        applyDaggerSplash(enemy, "Fan of Knives");
                        addToLog(`Fan of Knives hits ${enemy.name}!`, "text-cyan-300");
                    }
                });
            }
            if (player.isSkillActive('slipshot_rune')) {
                const behindX = target.x + dx;
                const behindY = target.y + dy;
                const enemy = currentEnemies.find(e => e.x === behindX && e.y === behindY && e.isAlive());
                if (enemy) {
                    applyDaggerSplash(enemy, "Shadow Piercing");
                    addToLog(`Shadow Piercing hits ${enemy.name} behind!`, "text-purple-300");
                }
            }
        }

        if (player.skillToggles['zephyrs_edge']) {
            const dirX = Math.sign(target.x - player.x);
            const dirY = Math.sign(target.y - player.y);
            const behindX = target.x + dirX;
            const behindY = target.y + dirY;
            const enemyBehind = currentEnemies.find(e => e.x === behindX && e.y === behindY && e.isAlive());
            if (enemyBehind) {
                const pierceDmg = Math.max(1, Math.floor(finalDamage * 0.5));
                addToLog(`Zephyr's Edge pierces through to ${enemyBehind.name}!`, "text-cyan-300");
                enemyBehind.takeDamage(pierceDmg, { element: 'wind', attacker: player, isMagic: true }, player);
            }
        }

        if (player.skillToggles['titan_swing'] && weapon.class === 'Hammer') {
            let kbChance = player.isSkillActive('titans_range') ? 1.0 : 0.50;
            if (Math.random() < kbChance) {
                if (target.isAlive()) {
                    await applyKnockback(target, player, 1);
                    if (player.isSkillActive('landslide_movement_arts')) {
                        const dx = Math.sign(target.x - player.x);
                        const dy = Math.sign(target.y - player.y);
                        const destX = player.x + dx;
                        const destY = player.y + dy;
                        if (!isCellBlocked(destX, destY, false, player.race === 'Pinionfolk')) {
                            player.x = destX; player.y = destY;
                            addToLog("Landslide Stance! You chase the target!", "text-orange-300");
                            renderBattleGrid();
                            target.takeDamage(Math.floor(finalDamage * 0.25), { element: 'physical' }, player);
                        }
                    }
                }
            }
        }
    }

    if (gameState.activeSkill === 'pyroclastic_geode') {
        if (!gameState.magmaGrenades) gameState.magmaGrenades = [];
        const explosionAmp = Math.floor(getCharacterStat(player, 'intelligence') / 2);
        gameState.magmaGrenades.push({
            x: target.x, y: target.y, damageDice: [1, 8], flatDamage: explosionAmp, turnCreated: gameState.turnCount
        });
        addToLog("Magma bubbles violently beneath the target...", "text-orange-400");
    }

    // -------------------------------------------------------------------------
    // 4. RECURSIVE COMBO LOGIC
    // -------------------------------------------------------------------------
    if (!gameState.battleEnded && isEntity && target.isAlive() && !preventFollowUp) {
        const armorName = player.equippedArmor ? player.equippedArmor.name : '';
        const isUnarmored = !player.equippedArmor || 
                            armorName === "Traveler's Garb" || 
                            armorName === "Traveler's Armor" || 
                            armorName === "Traveler’s Armor" || 
                            armorName === 'naked';
        const isFist = weapon.class === 'Hand-to-Hand';
        
        if (strikeIndex === 1 && isFist) {
            await new Promise(r => setTimeout(r, 200));
            await performAttack(target, { isInitiation: false, strikeIndex: 2 });
        }
        else if (strikeIndex === 2 && player.isSkillActive('flowing_water') && isFist && isUnarmored) {
            addToLog("Swift Agility! A third strike flows like water!", "text-cyan-300 font-bold");
            await new Promise(r => setTimeout(r, 200));
            await performAttack(target, { isInitiation: false, strikeIndex: 3 });
        }

        if (weapon.class === 'Curved Sword' && !isActiveSkill) {
            let maxHits = 1;
            let comboName = "";
            if (player.skillToggles['pure_elegance']) { maxHits = 4; comboName = "Dervish's Grace"; }
            else if (player.hasSkill('sword_dance')) { maxHits = 2; comboName = "Twin-Moon Crescent"; }

            if (strikeIndex < maxHits) {
                await new Promise(r => setTimeout(r, 150));
                await performAttack(target, { isInitiation: false, strikeIndex: strikeIndex + 1, sourceLabel: comboName });
            }
        }
    }

    if (player.isSkillActive('swinging_momentum') && weapon.class === 'Hammer') {
        if (!player.combatTags) player.combatTags = {};
        
        // [FIX] SWINGING MOMENTUM STACKS (Post-Hit)
        // Ensure we track the correct target
        const currentTargetId = target.id;

        if (player.combatTags.momentumLastTarget === currentTargetId) {
            let currentStacks = player.combatTags.momentumStacks || 0;
            player.combatTags.momentumStacks = currentStacks + 1;
        } else {
            player.combatTags.momentumStacks = 1;
            player.combatTags.momentumLastTarget = currentTargetId;
        }
    }

    if (player.isSkillActive('woodcutter') && weapon.class === 'Axe') {
        if (!player.combatTags) player.combatTags = {};
        
        const currentTargetId = target.id;

        if (player.combatTags.hewingLastTarget === currentTargetId) {
            // Hit same target: Increment stack (Max 5)
            let currentStacks = player.combatTags.hewingStacks || 0;
            player.combatTags.hewingStacks = Math.min(currentStacks + 1, 5);
        } else {
            // New target: Reset to 1 (current hit counts as first)
            player.combatTags.hewingStacks = 1;
            player.combatTags.hewingLastTarget = currentTargetId;
        }
    } 

    // -------------------------------------------------------------------------
    // 5. FINALIZATION
    // -------------------------------------------------------------------------
    if (isInitiation) {
        if (gameState.battleEnded) { isProcessingAction = false; return; }

        if (player.equippedShield.effect?.attack_follow_up && isEntity && target.isAlive()) {
            await new Promise(r => setTimeout(r, 250));
            performShieldFollowUpAttack(target);
        }

        const needsSecondAttack = (weapon.effect?.doubleStrike);
        if (needsSecondAttack && isEntity && target.isAlive() && strikeIndex === 1) {
            await new Promise(r => setTimeout(r, 250));
            addToLog("You strike again!", "text-yellow-300");
            await performAttack(target, { isInitiation: false, strikeIndex: 2 });
        }

        finalizePlayerAction();
    } else {
        if (strikeIndex === 1 && !gameState.battleEnded) {
            await new Promise(r => setTimeout(r, 50));
            checkBattleStatus();
        }
    }
}

const performPlayerAttack = (target, options = {}) => {
    return performAttack(target, { ...options, isInitiation: false });
};

// battle.js
async function castSpell(spellKey, targetOrIndex) {
    // --- 1. PRE-CHECKS ---
    if (player.skillToggles && player.skillToggles['void_trance']) {
        addToLog("You cannot cast spells while in Void Trance!", "text-purple-400");
        isProcessingAction = false;
        return;
    }

    player.hasAttackedThisTurn = true;

    const spellData = SPELLS[spellKey];
    if (!spellData) {
        addToLog("Spell data not found.", "text-red-400");
        isProcessingAction = false;
        return;
    }

    let target = null;
    let targetIndex = null;

    // --- TARGET RESOLUTION ---
    if (typeof targetOrIndex === 'object' && targetOrIndex.x !== undefined) {
        // Priority 1: Enemies
        const enemyAtLoc = currentEnemies.find(e => e.x === targetOrIndex.x && e.y === targetOrIndex.y && e.isAlive());
        
        // Priority 2: Player (You)
        const isPlayerLoc = (player.x === targetOrIndex.x && player.y === targetOrIndex.y);
        
        // Priority 3: Ally
        const allyAtLoc = player.npcAlly && player.npcAlly.x === targetOrIndex.x && player.npcAlly.y === targetOrIndex.y && player.npcAlly.hp > 0 ? player.npcAlly : null;

        if (enemyAtLoc) {
            target = enemyAtLoc;
            targetIndex = currentEnemies.indexOf(enemyAtLoc);
        } else if (isPlayerLoc) {
            target = player;
            targetIndex = -2; // Special index for Player
        } else if (allyAtLoc) {
            target = allyAtLoc;
            targetIndex = -1; // Special index for Ally
        } else {
            // Priority 4: Ground (Empty Tile)
            target = { 
                x: targetOrIndex.x, 
                y: targetOrIndex.y, 
                name: "Ground", 
                isAlive: () => true, // Ground is always "alive" for targeting purposes
                isGround: true, 
                statusEffects: {}, 
                harmonicStacks: 0, 
                hp: 9999, // Dummy HP to prevent NaN errors in healing math
                maxHp: 9999,
                takeDamage: () => ({ damageDealt: 0, knockback: 0 }) 
            };
            targetIndex = -999; 
        }
    } else {
        // Legacy Integer Index Handling
        targetIndex = targetOrIndex;
        if (targetIndex === -1) { 
            target = player.npcAlly;
            if (!target || target.hp <= 0 || target.isFled) {
                addToLog("Your ally is not a valid target.", 'text-red-400');
                isProcessingAction = false; return;
            }
        } else if (targetIndex === -2) {
             target = player;
        } else if (targetIndex >= 0) {
            target = currentEnemies[targetIndex];
        }
    }

    // --- VALIDATION CHECK ---
    // We explicitly allow 'player' to pass this check even if they lack an .isAlive() method
    let isTargetAlive = false;
    if (target) {
        if (target === player) isTargetAlive = true; // Player is always valid target
        else if (typeof target.isAlive === 'function') isTargetAlive = target.isAlive();
        else if (target.hp > 0) isTargetAlive = true;
        else if (target.isGround) isTargetAlive = true;
    }

    if ((spellData.type === 'st' || spellData.type === 'aoe') && !isTargetAlive) {
        addToLog("Invalid target selected.", "text-red-400"); // Added feedback so it doesn't silent fail
        isProcessingAction = false;
        renderBattleGrid();
        return;
    }

    // --- 2. SETUP & COSTS ---
    const playerSpell = player.spells[spellKey];
    const tierIndex = playerSpell.tier - 1;
    const spell = spellData.tiers[tierIndex];
    const catalyst = player.equippedCatalyst;
    
    if (!catalyst || catalyst.name === 'None') {
        addToLog("You need a catalyst equipped to cast spells.", 'text-red-400');
        isProcessingAction = false; return;
    }

    // Range Calculation
    let spellRange = catalyst.range || 3;
    if (spellData.type === 'st') {
        if (player.isSkillActive('spell_sniper')) spellRange += 1;
        if (player.isSkillActive('focused_fire')) spellRange += 1;
    }
    if (spellData.type === 'aoe' && player.isSkillActive('lobbed_fire')) spellRange += 1;
    if (player.race === 'Pinionfolk' && player.level >= 20) spellRange += 2;
    if (catalyst.effect?.spell_sniper) spellRange *= (1 + catalyst.effect.spell_sniper);
    if (player.statusEffects.buff_magic_dust?.rangeIncrease) spellRange += player.statusEffects.buff_magic_dust.rangeIncrease;

    const dx = Math.abs(player.x - target.x);
    const dy = Math.abs(player.y - target.y);
    if (dx + dy > spellRange) {
        addToLog("You are too far away to cast that spell!", 'text-red-400');
        isProcessingAction = false; return;
    }

    // --- DYNAMIC COST CALCULATION ---
    let finalSpellCost = spell.cost;
    let flatManaReduction = 0;
    
    if (player.isSkillActive('mana_control')) flatManaReduction += 1;
    if (player.isSkillActive('higher_mana_control')) flatManaReduction += 2;
    if (player.isSkillActive('innate_manipulation')) flatManaReduction += 2;

    if (catalyst.effect?.mana_discount) flatManaReduction += catalyst.effect.mana_discount;
    if (player.equippedArmor?.effect?.mana_discount) flatManaReduction += player.equippedArmor.effect.mana_discount;
    if (player.equippedArmor?.effect?.mana_discount_flat) flatManaReduction += player.equippedArmor.effect.mana_discount_flat;

    finalSpellCost = Math.max(1, finalSpellCost - flatManaReduction);

    if (player.skillToggles) {
        if (player.skillToggles['mana_overload']) finalSpellCost = Math.ceil(finalSpellCost * 2);
        
        if (spellData.type === 'st') {
            if (player.skillToggles['power_blast']) finalSpellCost = Math.ceil(finalSpellCost * 1.50);
            if (player.skillToggles['aetheric_lance']) finalSpellCost += 10;
            if (player.skillToggles['mana_barrage']) finalSpellCost = Math.ceil(finalSpellCost * 1.50);
        }
        if (spellData.type === 'aoe') {
            if (player.isSkillActive('siege_protocol')) finalSpellCost = Math.ceil(finalSpellCost * 1.10);
            
            if (player.skillToggles['rain_of_ruin']) {
                finalSpellCost = Math.ceil(finalSpellCost * 1.50);
            }
            if (player.skillToggles['singularity']) {
                finalSpellCost = Math.ceil(finalSpellCost * 2.0); 
            }
        }
    }
    
    if (player._classKey === 'warlock' && player.signatureAbilityToggleActive) finalSpellCost = Math.ceil(finalSpellCost * 1.25);
    if (player._classKey === 'magus' && player.activeModeIndex > -1) finalSpellCost = Math.ceil(finalSpellCost * 1.30);
    
    if (player.statusEffects.magic_dampen) {
        finalSpellCost = Math.floor(finalSpellCost * (1 / player.statusEffects.magic_dampen.multiplier));
    }
    
    if (player.skillToggles['oblivions_hunger'] && spellData.element === 'void') {
        finalSpellCost = Math.ceil(finalSpellCost * 1.25);
    }

    finalSpellCost = Math.max(1, finalSpellCost);

    if (player.mp < finalSpellCost) {
        addToLog(`Not enough MP to cast ${spell.name} (${finalSpellCost} MP needed).`, 'text-red-400');
        isProcessingAction = false; return;
    }

    // Apply Cost
    player.mp -= finalSpellCost;
    gameState.isPlayerTurn = false;
    gameState.lastSpellElement = spellData.element;
    updateStatsView();

    addToLog(`You cast <span class="font-bold text-purple-300">${spell.name}</span>!`);

    let usedMagicDust = false;
    if (player.statusEffects.buff_magic_dust) { usedMagicDust = true; delete player.statusEffects.buff_magic_dust; }

    // --- 3. SPELL TYPES ---
    
    // TYPE A: HEALING
    if (spellData.element === 'healing') {
        let diceCount = spell.damage[0];
        const spellAmp = (catalyst.effect?.spell_amp || 0) + (player.equippedArmor?.effect?.spell_amp || 0);
        diceCount = Math.min(spell.cap, diceCount + spellAmp);
        
        let baseHeal = rollDice(diceCount, spell.damage[1], `Healing Spell`).total;
        const statBonus = player.magicalDamageBonus;
        let healAmount = Math.floor(baseHeal * (1 + statBonus / 20)) + Math.floor(statBonus / 5);
        
        if (player.statusEffects.buff_fertilized && spellData.element === 'nature') healAmount = Math.floor(healAmount * player.statusEffects.buff_fertilized.healMultiplier);
        if (player.race === 'Elementals' && spellData.element === player.elementalAffinity) healAmount = Math.floor(healAmount * (player.level >= 20 ? 1.20 : 1.10));
        if (player.race === 'Dragonborn') healAmount = Math.floor(healAmount * (player.level >= 20 ? 1.20 : 1.10));
        
        // Healing Logic
        if (target) {
            target.hp = Math.min(target.maxHp, target.hp + healAmount);
            
            const targetName = (target === player) ? "yourself" : target.name;
            const logColor = (target === player || target === player.npcAlly) ? "text-green-400" : "text-yellow-400";
            
            addToLog(`You heal ${targetName} for <span class="font-bold ${logColor}">${healAmount}</span> HP.`, 'text-green-300');
            
            if (target === player) updateStatsView();
            else renderBattleGrid();
        }
    }
    // TYPE B: SUPPORT
    else if (spellData.type === 'support') {
        if (spell.effect) {
            if (spell.effect.type.startsWith('buff_')) {
                player.statusEffects[spell.effect.type] = { ...spell.effect };
                addToLog(`You are filled with the power of ${spell.name}!`, 'text-yellow-300');
                if (spell.effect.cleanse) {
                    const debuffs = Object.keys(player.statusEffects).filter(key => ['poison', 'paralyzed', 'petrified', 'drenched', 'toxic'].includes(key));
                    debuffs.forEach(d => delete player.statusEffects[d]);
                    if (debuffs.length > 0) addToLog("You are cleansed of ailments!", 'text-blue-300');
                }
            } else if (spell.effect.type === 'cleanse') {
                const debuffs = Object.keys(player.statusEffects).filter(key => ['poison', 'paralyzed', 'petrified', 'drenched', 'toxic'].includes(key));
                debuffs.forEach(d => delete player.statusEffects[d]);
                addToLog("You are cleansed of ailments!", 'text-blue-300');
            }
        }
        updateStatsView();
    }
    // TYPE C: DAMAGE
    else {
        let diceCount = spell.damage[0];
        const spellAmp = (catalyst.effect?.spell_amp || 0) + (player.equippedArmor?.effect?.spell_amp || 0);
        diceCount = Math.min(spell.cap, diceCount + spellAmp);
        
        const calcLog = { 
            source: `Spell (${spell.name})`, 
            targetName: target ? target.name : "Area", 
            steps: [], 
            baseDamage: 0 
        };

        let spellDamageDice = [...spell.damage]; 
        if (usedMagicDust) {
            const originalSides = spellDamageDice[1];
             switch (originalSides) {
                 case 2: spellDamageDice[1] = 4; break;
                 case 3: spellDamageDice[1] = 4; break;
                 case 4: spellDamageDice[1] = 6; break;
                 case 6: spellDamageDice[1] = 8; break;
                 case 8: spellDamageDice[1] = 10; break;
                 case 10: spellDamageDice[1] = 12; break;
             }
             if (spellDamageDice[1] !== originalSides) addToLog(`Magic Rock Dust sharpens the spell!`);
        }
        if (spellData.element === 'nature' && typeof getNatureDiceSize === 'function') {
            spellDamageDice[1] = getNatureDiceSize(spellDamageDice[1]);
        }

        let rollResult = rollDice(diceCount, spellDamageDice[1], `Spell Damage`);
        if (player.isSkillActive('harmonic_attunement')) {
            let adjusted = false;
            for (let i = 0; i < rollResult.rolls.length; i++) {
                if (rollResult.rolls[i] === 1) {
                    rollResult.rolls[i] = 2;
                    adjusted = true;
                }
            }
            if (adjusted) {
                rollResult.total = rollResult.rolls.reduce((a, b) => a + b, 0);
                calcLog.steps.push({ 
                    description: "Harmonic Resonance", 
                    value: "1s ➔ 2s", 
                    result: "Adjusted" 
                });
            }
        }
        let baseDamage = rollResult.total;
        calcLog.baseDamage = baseDamage;
        calcLog.steps.push({ description: `Base Roll (${diceCount}d${spellDamageDice[1]})`, value: rollResult.rolls.join('+'), result: baseDamage });
        
        const statBonus = player.magicalDamageBonus;
        let damage = Math.floor(baseDamage * (1 + statBonus / 20)) + Math.floor(statBonus / 5);
        calcLog.steps.push({ description: "Int Scaling", value: `x${(1 + statBonus / 20).toFixed(2)}`, result: damage });

        if (player.isSkillActive('focus_point')) {
            damage = Math.floor(damage * 1.05); 
            calcLog.steps.push({ description: "Third Eye Open", value: "x1.05", result: damage });
        }

        damage = applyElementalMastery(damage, spellData.element, calcLog);

        if (player.skillToggles['mana_overload']) {
            damage = Math.floor(damage * 1.5);
            calcLog.steps.push({ description: "Mana Overload", value: "x1.5", result: damage });
        }
        if (spellData.type === 'st' && player.isSkillActive('concentration_training')) {
            damage = Math.floor(damage * 1.10);
            calcLog.steps.push({ description: "Tunnel Vision", value: "x1.10", result: damage });
        }
        if (spellData.type === 'st' && player.skillToggles['power_blast']) {
            damage = Math.floor(damage * 1.25);
            calcLog.steps.push({ description: "Overcharge", value: "x1.25", result: damage });
        }
        if (spellData.type === 'st' && player.skillToggles['mana_barrage']) {
            damage = Math.floor(damage * 0.60);
            calcLog.steps.push({ description: "Burst Fire", value: "x0.60", result: damage });
        }
        
        if (spellData.type === 'aoe') {
            if (player.skillToggles['singularity']) {
                damage = Math.floor(damage * 2.0);
                calcLog.steps.push({ description: "Unstable Concentration", value: "x2.0", result: damage });
            }
            if (player.skillToggles['rain_of_ruin']) {
                damage = Math.floor(damage * 0.60);
                calcLog.steps.push({ description: "Bombardment", value: "x0.60", result: damage });
            }
            if (player.isSkillActive('flux_control')) {
                damage = Math.floor(damage * 1.10);
                calcLog.steps.push({ description: "Unstable Geometry", value: "x1.10", result: damage });
            }
            if (player.isSkillActive('siege_protocol')) {
                damage = Math.floor(damage * 1.15); 
                calcLog.steps.push({ description: "Heavy Artillery", value: "x1.15", result: damage });
            }
        }

        if (spellData.type === 'st' && player.isSkillActive('harmonic_escalation')) {
            if (target && !target.id) {
                target.id = `enemy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            }
            if (gameState.comboTargetId === target.id) {
                const stacks = Math.min(5, gameState.comboCount);
                if (stacks > 0) {
                    const bonusMult = 1 + (stacks * 0.10);
                    damage = Math.floor(damage * bonusMult);
                    calcLog.steps.push({ 
                        description: `Resonant Cascade (x${stacks})`, 
                        value: `x${bonusMult.toFixed(2)}`, 
                        result: damage 
                    });
                }
            }
        }
        
        if (player.statusEffects.buff_magic_shield) {
            damage = Math.floor(damage * 1.20);
            calcLog.steps.push({ description: "Magic Shield Buff", value: "x1.20", result: damage });
        }
        if (player.statusEffects.buff_divine && spellData.element === 'light') {
            damage = Math.floor(damage * 1.25);
            calcLog.steps.push({ description: "Divine Buff", value: "x1.25", result: damage });
        }
        if (usedMagicDust) {
            damage = Math.floor(damage * 1.50);
            calcLog.steps.push({ description: "Magic Dust", value: "x1.50", result: damage });
        }
        if (player._classKey === 'warlock' && player.signatureAbilityToggleActive) {
            damage = Math.floor(damage * 1.20);
            calcLog.steps.push({ description: "Warlock Toggle", value: "x1.20", result: damage });
        }
        if (catalyst.effect?.elemental_boost === spellData.element) {
            damage = Math.floor(damage * 1.15);
            calcLog.steps.push({ description: "Catalyst Boost", value: "x1.15", result: damage });
        }
        if (player.race === 'Dragonborn') {
            const dragonBonus = (player.level >= 20 ? 1.20 : 1.10);
            damage = Math.floor(damage * dragonBonus);
            calcLog.steps.push({ description: "Dragonborn", value: `x${dragonBonus}`, result: damage });
        }
        if (player.statusEffects.buff_magmatic_stress) {
            damage = Math.floor(damage * 1.25);
            calcLog.steps.push({ description: "Heating Rock", value: "x1.25", result: damage });
        }

        damage = applyVoltaicMomentum(damage, spellData.element, calcLog);

        if (spellData.element === 'fire') {
            const fireFluctuation = 0.8 + (Math.random() * 0.4);
            damage = Math.floor(damage * fireFluctuation);
            calcLog.steps.push({ 
                description: "Fire Fluctuation", 
                value: `x${fireFluctuation.toFixed(2)}`, 
                result: damage 
            });
        }

        damage = applyPrismaticConvergence(damage, spellData.element, calcLog);

        // --- Target Collection ---
        let targets = [];
        if (spellData.type === 'st') {
            if (targetIndex !== -999 && target) targets.push(target);
            if (player.skillToggles['mana_barrage'] && target) {
                targets.push(target);
                targets.push(target);
                addToLog("Aetheric Torrent fires a 3-round burst!", "text-cyan-300 text-xs");
            }
        }
        else if (spellData.type === 'aoe') {
            let potentialTargets = currentEnemies.filter(e => e.isAlive() && Math.abs(e.x - target.x) <= 1 && Math.abs(e.y - target.y) <= 1);

            if (player.skillToggles['singularity']) {
                if (targetIndex !== -999 && target && target.hp !== undefined) {
                    potentialTargets = [target];
                    addToLog("Singularity compresses the storm into a single point!", "text-purple-400 font-bold");
                } else {
                     addToLog("Unstable Concentration requires a direct enemy target!", "text-red-400");
                     player.mp += finalSpellCost;
                     isProcessingAction = false;
                     gameState.isPlayerTurn = true;
                     updateStatsView();
                     return;
                }
            }

            if (player.skillToggles['rain_of_ruin']) {
                addToLog("Bombardment rains destruction! (3 Waves)", "text-red-400 font-bold");
                potentialTargets = [...potentialTargets, ...potentialTargets, ...potentialTargets];
            }

            targets = potentialTargets;
        }

        let attackOptions = { 
            element: spellData.element, 
            isMagic: true,
            armorPierce: (catalyst.effect?.spell_penetration || 0)
        };

        if (player.skillToggles['aetheric_lance']) {
            attackOptions.armorPierce += 0.10;
            calcLog.steps.push({ description: "Ethereal Lance", value: "Ignore 10% Def", result: "Active" });
        }

        const voidBypassChance = 0.20 + (tierIndex * 0.05);
        if (spellData.element === 'void' && player.rollForEffect(voidBypassChance, 'Spell Void Bypass')) {
            attackOptions.ignore_defense = 0.20; 
            addToLog(`${player.name}'s void spell distorts reality! (Ignores 20% Def)`, 'text-purple-500');
        }

        if (spellData.element === 'void') {
            attackOptions.armorPierce = (attackOptions.armorPierce || 0) + 0.10;
            calcLog.steps.push({ 
                description: "Void Penetration", 
                value: "10%", 
                result: "Ignored" 
            });
        }

        // --- Execution Loop ---
        for (const t of targets) {
            if (!t.isAlive()) continue;
            let instanceDamage = damage;

            const isSingularity = player.skillToggles['singularity'];
            const isDirectHit = t.x === target.x && t.y === target.y;

            if (spellData.type === 'aoe' && !isSingularity && !isDirectHit) {
                let splashMult = 0.50; 
                if (playerSpell.tier === 2) splashMult = 0.75;
                else if (playerSpell.tier >= 3) splashMult = 0.90;
                if (player.isSkillActive('concentrated_spread')) splashMult += 0.10;
                if (player.skillToggles['ground_zero'] && !player.isSkillActive('aftershock')) splashMult -= 0.50;
                splashMult = Math.max(0, Math.min(1.0, splashMult));
                instanceDamage = Math.floor(instanceDamage * splashMult);
                calcLog.steps.push({ description: `Splash (T${playerSpell.tier})`, value: `x${splashMult.toFixed(2)}`, result: instanceDamage });
            } 
            else if (spellData.type === 'aoe' && (isDirectHit || isSingularity)) {
                if (player.skillToggles['ground_zero']) {
                    instanceDamage = Math.floor(instanceDamage * 1.30);
                    calcLog.steps.push({ description: "Eye of the Storm", value: "x1.30", result: instanceDamage });
                }
            }
            
            if (player.isSkillActive('harmonic_resonance') && t.harmonicStacks) {
                instanceDamage += (t.harmonicStacks * 5);
                calcLog.steps.push({ description: `Harmonic (${t.harmonicStacks})`, value: `+${t.harmonicStacks*5}`, result: instanceDamage });
            }
            
            calcLog.targetName = t.name; 
            calcLog.steps.push({ description: "=== DEFENSE ===", value: "", result: "" });
            
            const result = t.takeDamage(instanceDamage, attackOptions, player);
            addToLog(`You hit ${t.name} for <span class="font-bold text-yellow-300">${result.damageDealt}</span> damage.`);

             if (spellData.type === 'st' && player.skillToggles['aetheric_lance'] && result.damageDealt > 0) {
                const dx = Math.sign(t.x - player.x);
                const dy = Math.sign(t.y - player.y);
                const behindX = t.x + dx;
                const behindY = t.y + dy;
                const enemyBehind = currentEnemies.find(e => e.x === behindX && e.y === behindY && e.isAlive());
                if (enemyBehind) {
                    const pierceDamage = Math.floor(instanceDamage * 0.50);
                    const pierceResult = enemyBehind.takeDamage(pierceDamage, attackOptions, player);
                    addToLog(`The lance pierces through to hit ${enemyBehind.name} for <span class="font-bold text-yellow-300">${pierceResult.damageDealt}</span>!`, "text-purple-300 text-xs");
                    if (calcLog.steps) calcLog.steps.push({ description: `Pierce (${enemyBehind.name})`, value: "50%", result: pierceResult.damageDealt });
                }
            }
            if (spellData.type === 'st' && player.skillToggles['power_blast'] && result.damageDealt > 0) {
                 await applyKnockback(t, player, 1);
                 addToLog(`${t.name} is knocked back by the overcharge!`, "text-purple-300 text-xs");
            }
            if(result.defenseSteps) calcLog.steps = calcLog.steps.concat(result.defenseSteps);
            calcLog.finalDamage = result.damageDealt;
            if(typeof logDamageCalculation === 'function') logDamageCalculation({...calcLog}); 
            if (player.skillToggles['oblivions_hunger'] && spellData.element === 'void' && t.isAlive()) {
                applyStatusEffect(t, 'essence_devoured', { duration: 4 }, player.name);
                addToLog(`${t.name}'s essence is being devoured!`, "text-purple-300 text-xs");
            }
            if (result.damageDealt > 0 && t.isAlive()) {
                const catalystRarity = player.equippedCatalyst.rarity || 'Common';
                const chance = getSecondaryChance(catalystRarity); 
                switch (spellData.element) {
                    case 'water':
                        let waterChance = getSecondaryChance(catalystRarity);
                        if (player.isSkillActive('crashing_wake')) waterChance = 1.0;
                        const isWaterSuccess = player.rollForEffect(waterChance, "Water Spell (Drenched)");
                        if (calcLog && calcLog.steps) calcLog.steps.push({ description: "Effect Chance", value: `${(waterChance * 100).toFixed(0)}%`, result: isWaterSuccess ? "Triggered" : "Failed" });
                        if (isWaterSuccess) {
                            applyStatusEffect(t, 'drenched', { duration: 3, move: -1, multiplier: 0.80 }, player.name);
                            addToLog(`${t.name} is Drenched by the splash!`, 'text-blue-400');
                        }
                        break;
                    case 'earth':
                        const isEarthSuccess = player.rollForEffect(chance, 'Earth Spell (Paralyze)');
                        calcLog.steps.push({ description: "Effect Chance", value: `${(chance * 100).toFixed(0)}%`, result: isEarthSuccess ? "Triggered" : "Failed" });
                        if (isEarthSuccess) {
                            if (!t.statusEffects.paralyzed) {
                                applyStatusEffect(t, 'paralyzed', { duration: 2 }, player.name);
                                addToLog(`${t.name} is paralyzed by the impact!`, 'text-amber-600');
                            }
                        }
                        break;
                    case 'wind':
                        const isWindSuccess = player.rollForEffect(chance, 'Wind Spell (Knockback)');
                        calcLog.steps.push({ description: "Effect Chance", value: `${(chance * 100).toFixed(0)}%`, result: isWindSuccess ? "Triggered" : "Failed" });
                        if (isWindSuccess) {
                            await applyKnockback(t, player, 1);
                            addToLog(`${t.name} is blasted back by the gale!`, 'text-cyan-400');
                        }
                        break;
                    case 'nature':
                        const nPercent = getLifestealPercentage(player.equippedCatalyst.rarity || 'Common');
                        const nHealAmount = Math.floor(result.damageDealt * nPercent);
                        calcLog.steps.push({ description: "Nature Lifesteal", value: `${(nPercent * 100).toFixed(0)}%`, result: `+${nHealAmount} HP` });
                        if (nHealAmount > 0) {
                            player.hp = Math.min(player.maxHp, player.hp + nHealAmount);
                            addToLog(`You drain <span class="font-bold text-green-400">${nHealAmount}</span> HP.`, 'text-green-300');
                            updateStatsView();
                        }
                        break;
                    case 'lightning':
                        const isVoltSuccess = player.rollForEffect(chance, 'Lightning Spell (Chain)');
                        calcLog.steps.push({ description: "Effect Chance", value: `${(chance * 100).toFixed(0)}%`, result: isVoltSuccess ? "Triggered" : "Failed" });
                        if (isVoltSuccess) {
                            const bounceTarget = getChainTarget(t, 3, t);
                            if (bounceTarget) {
                                const chainDamage = Math.floor(result.damageDealt * 0.50);
                                bounceTarget.takeDamage(chainDamage, { element: 'lightning', isMagic: true }, player);
                                addToLog(`⚡ The spell arcs to ${bounceTarget.name} for ${chainDamage} damage!`, "text-yellow-400 font-bold");
                            }
                        }
                        break;
                    case 'light':
                        const isLightSuccess = player.rollForEffect(chance, 'Light Spell (Purify)');
                        calcLog.steps.push({ description: "Effect Chance", value: `${(chance * 100).toFixed(0)}%`, result: isLightSuccess ? "Triggered" : "Failed" });
                        if (isLightSuccess) {
                            const myDebuffs = Object.keys(player.statusEffects).filter(e => CLEANSABLE_DEBUFFS.includes(e));
                            const enemyBuffs = Object.keys(t.statusEffects).filter(e => PURGEABLE_BUFFS.includes(e));
                            let action = null;
                            if (myDebuffs.length > 0 && enemyBuffs.length > 0) action = Math.random() < 0.5 ? 'cleanse_self' : 'purge_enemy';
                            else if (myDebuffs.length > 0) action = 'cleanse_self';
                            else if (enemyBuffs.length > 0) action = 'purge_enemy';
                            if (action === 'cleanse_self') {
                                const effect = myDebuffs[0];
                                delete player.statusEffects[effect];
                                addToLog(`✨ The light cleanses your ${effect}!`, "text-yellow-200 font-bold");
                                updateStatsView();
                            } else if (action === 'purge_enemy') {
                                const effect = enemyBuffs[0];
                                delete t.statusEffects[effect];
                                addToLog(`✨ The light strips ${t.name}'s ${effect}!`, "text-yellow-200 font-bold");
                            }
                        }
                        break;
                }
            } 
            if (spell.status_effect && player.rollForEffect(spell.status_chance || 1.0, `Status (${spell.status_effect})`)) {
                applyStatusEffect(t, spell.status_effect, { duration: spell.status_duration || 3 }, player.name);
            }
            if (player.skillToggles['permafrost'] && isElementalStateActive('water') && spellData.element === 'water' && t.statusEffects.frozen) {
                t.takeDamage(Math.floor(instanceDamage * 0.2), { element: 'water' }, player);
            }
            if (player.isSkillActive('monolith_of_earth') && spellData.element === 'earth') {
                applyStatusEffect(player, 'buff_monolith', { name: "Monolith", duration: 1, icon: '🗿', description: "+25% Armor" });
            }
            if (player.skillToggles['magma_pool'] && isElementalStateActive('fire') && spellData.element === 'fire') {
                let magmaDuration = 2;
                if (player.isSkillActive('continuous_magma')) magmaDuration += 1;
                const trapDiceCount = Math.max(1, Math.floor(diceCount / 2)); 
                const trapDiceSides = spellDamageDice ? spellDamageDice[1] : 6;
                const existingTrap = gameState.gridObjects.find(o => o.x === t.x && o.y === t.y && o.type === 'trap');
                if (!existingTrap) {
                    if (player.isSkillActive('greater_magma_pool')) {
                        const offsets = [{x:0, y:0}, {x:1, y:0}, {x:-1, y:0}, {x:0, y:1}, {x:0, y:-1}];
                        offsets.forEach(off => {
                            const tx = t.x + off.x;
                            const ty = t.y + off.y;
                            if (tx >= 0 && tx < gameState.gridWidth && ty >= 0 && ty < gameState.gridHeight) {
                                const obs = gameState.gridObjects.find(o => o.x === tx && o.y === ty);
                                if (!obs) gameState.gridObjects.push({ type: 'trap', subtype: 'magma', x: tx, y: ty, duration: magmaDuration, diceCount: trapDiceCount, diceSides: trapDiceSides, flatDamageBonus: 0, emoji: '🌋', name: 'Magma Pool' });
                            }
                        });
                    } else {
                        gameState.gridObjects.push({ type: 'trap', subtype: 'magma', x: t.x, y: t.y, duration: magmaDuration, diceCount: trapDiceCount, diceSides: trapDiceSides, flatDamageBonus: 0, emoji: '🌋', name: 'Magma Pool' });
                    }
                }
            }
        } // End Target Loop
    }

    // --- 4. POST-CAST ---
    if (spellData.element === 'earth') {
        if (spellData.type === 'aoe') spawnJaggedEarthPattern(target, '3x3'); 
        else spawnJaggedEarthPattern(target, 'single'); 
    }

    if (spellData.type === 'st' && spellData.element !== 'healing' && spellData.type !== 'support' && target) {
        if (!target.id) {
            target.id = `enemy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
        if (gameState.comboTargetId === target.id) {
            gameState.comboCount++;
        } else {
            gameState.comboTargetId = target.id;
            gameState.comboCount = 1;
        }
    } else {
        gameState.comboTargetId = null;
        gameState.comboCount = 0;
    }

    gameState.action = null;
    gameState.spellToCast = null;
    if (!gameState.battleEnded) checkBattleStatus();
    finalizePlayerAction();
}

function battleAction(type, actionData = null) {
    if (!player.isAlive()) { checkPlayerDeath(); return; }
    if (!gameState.isPlayerTurn || isProcessingAction) return;

    gameState.pendingTarget = null;
    document.querySelectorAll('.pending-confirmation').forEach(el => el.classList.remove('pending-confirmation'));

    if (type !== 'attack') {
        gameState.comboTarget = null;
        gameState.comboCount = 0;
    }

    gameState.action = type; 
    const cells = document.querySelectorAll('.grid-cell');
    cells.forEach(c => c.classList.remove('walkable', 'attackable', 'magic-attackable', 'splash-targetable', 'item-attackable'));

    if (gameState.isMovementOnlyTurn && type !== 'move') {
        addToLog("You can only Move during a Swiftness turn!", "text-red-400");
        return;
    }

    switch (type) {
        case 'move':
            renderBattleGrid(true); 
            break;
            
        case 'magic': renderBattle('magic'); break;
        
        case 'magic_select': 
             const spellKey = actionData;
             const spellData = SPELLS[spellKey];
             if (!spellData) return;

             // GROUP A: REQUIRES TARGETING (Damage & Healing)
             // We add 'healing' here so it enters the grid selection mode
             if (spellData.type === 'st' || spellData.type === 'aoe' || spellData.element === 'healing') {
                 gameState.spellToCast = spellKey;
                 gameState.action = 'magic_cast';
                 
                 if (spellData.element === 'healing') {
                     addToLog("Select a target (Self or Ally)...", "text-green-300");
                 } else {
                     addToLog("Select a target...", "text-cyan-300");
                 }

                 renderBattleGrid(true, 'magic'); 
             } 
             // GROUP B: INSTANT SELF-CAST (Buffs/Support)
             else if (spellData.type === 'support') {
                 // Pass -2 to target the PLAYER (instead of 0 which is the first enemy)
                 castSpell(spellKey, -2); 
             }
             break;
             
        case 'item': renderBattle('item'); break;
        
        case 'item_select':
            const itemKey = actionData.itemKey;
            const itemDetails = ITEMS[itemKey];
            if (!itemDetails) { gameState.action = null; return; }
            if (['debuff_apply', 'debuff_special', 'enchant', 'trap'].includes(itemDetails.type)) {
                gameState.action = 'item_target'; 
                gameState.itemToUse = itemKey;   
                addToLog(`Select a location for ${itemDetails.name}.`, 'text-yellow-400'); 
                renderBattleGrid(true, 'item'); 
            } else {
                 useItem(itemKey, true); 
                 gameState.action = null;
            }
            break;

        case 'flee':
            // [CHECK] Final Horizon blocks fleeing
            if (player.statusEffects.buff_final_horizon) {
                addToLog("You cannot flee! You have committed to the Final Horizon!", "text-red-500 font-bold");
                return;
            }
            gameState.isPlayerTurn = false;
            if (player.statusEffects.buff_voidwalker || player.rollForEffect(0.8, 'Flee')) {
                addToLog(`You successfully escaped!`, 'text-green-400');

                // [INJECTED] Restore Element
                restoreDefaultAffinities();

                if (preTrainingState !== null) {
                    endTraining();
                } else {
                    setTimeout(() => endBiomeRun('flee'), 500);
                }
            } else {
                addToLog(`You failed to escape!`, 'text-red-400');
                finalizePlayerAction();
            }
            break;

        case 'skills': renderBattle('skills'); break;

        case 'use_skill':
            const skillId = actionData;

            const skillNode = SKILL_TREE[skillId];
            if (!skillNode) return;

            const reqCheck = checkSkillRequirements(skillId);
            if (!reqCheck.allowed) {
                addToLog(`Requires a ${reqCheck.required}!`, "text-red-400");
                return;
            }

            // --- INSTANT SELF-CAST OVERRIDE ---
            // If the skill is in this list, we DO NOT enter targeting mode.
            // We execute it immediately on the player.
            const selfCastSkills = [
                    'aqueous_aegis', 
                    'gore_crazed_howl', 
                    'last_stand', 
                    'sanctuary_of_zenith',
                    'banquet_of_einherjar',
                    'terrestrial_rejection',
                    'miasma_of_decay',
                    'valkyrie_of_flame' // <--- ADD THIS
                ];

            if (selfCastSkills.includes(skillId)) {
                const cost = skillNode.effect.cost;
                if (cost > 0 && player.mp < cost) {
                    addToLog("Not enough MP!", "text-red-400");
                    return;
                }
                
                console.log(`Auto-casting ${skillId}`); // Debug Log
                isProcessingAction = true;
                gameState.action = null; // Clear action so we don't get stuck in targeting
                executeActiveSkill(skillId, player); 
                return;
            }
            // ----------------------------------

            if (skillNode.type === 'toggle') {
                const toggleKey = skillNode.effect.toggle;
                if (toggleKey === 'lockdown') {
                    const shield = player.equippedShield;
                    if (!shield || !shield.blockChance || shield.blockChance <= 0) {
                        addToLog("Immovable Object requires a Greatshield!", "text-red-400");
                        return;
                    }
                }
                if (toggleKey === 'world_turtle_formation' && !player.skillToggles[toggleKey]) {
                    if (!player.skillToggles['phalanx_formation'] || !player.skillToggles['giant_hunt']) {
                        addToLog("Aspidochelone Stance requires Iron Bastion and Behemoth Stalker!", "text-red-400");
                        return;
                    }
                }
                if (toggleKey === 'crucible_of_the_beast') {
                    player.skillToggles[toggleKey] = !player.skillToggles[toggleKey];
                    
                    if (player.skillToggles[toggleKey]) {
                        // Activate Buff
                        player.statusEffects.buff_crucible_beast = { 
                            name: "Beast Form",
                            type: 'buff',
                            duration: Infinity, 
                            defMult: 1.10, // +10% Defense
                            icon: '🐺'
                        };
                        addToLog("You unleash the beast within!", "text-green-400 font-bold");
                    } else {
                        // Deactivate Buff
                        if (player.statusEffects.buff_crucible_beast) delete player.statusEffects.buff_crucible_beast;
                        // [REQUEST 1: Toggle Off Log]
                        addToLog("You suppress the primal urge.", "text-gray-400"); 
                    }
                    renderBattle('skills');
                    updateStatsView();
                }

                player.skillToggles[toggleKey] = !player.skillToggles[toggleKey];
                
                // Stance Collapses (Existing Logic)
                if ((toggleKey === 'phalanx_formation' || toggleKey === 'giant_hunt') && !player.skillToggles[toggleKey]) {
                    if (player.skillToggles['world_turtle_formation']) {
                        player.skillToggles['world_turtle_formation'] = false;
                        addToLog("Aspidochelone Stance collapsed.", "text-yellow-300");
                    }
                }

                addToLog(`${skillNode.name} is now ${player.skillToggles[toggleKey] ? 'Active' : 'Inactive'}.`, "text-yellow-300");
                renderBattle('skills'); 
                
                // 2. ADD THIS LINE HERE:
                saveGame(); 
            }
            else if (skillNode.type === 'active') {
                const cost = skillNode.effect.cost;
                if (cost > 0 && player.mp < cost) {
                    addToLog("Not enough MP!", "text-red-400");
                    return;
                }

                gameState.currentActiveSkill = skillId; 
                gameState.action = 'skill_target';
                addToLog(`Select a target for ${skillNode.name}.`, "text-cyan-300");
                renderBattleGrid(true, 'skill'); 
            }
            break;

        case 'signature_ability':
            const ability = player.signatureAbilityData;
            if (!ability) {
                gameState.action = null;
                return;
            }

            if (ability.type === 'signature') {
                if (player.signatureAbilityUsed) {
                    addToLog(`${ability.name} has already been used this encounter!`, 'text-red-400');
                    gameState.action = null;
                    return;
                }
                if (player.mp < ability.cost) {
                    addToLog(`Not enough MP to use ${ability.name}!`, 'text-blue-400');
                    gameState.action = null;
                    return;
                }

                // [NEW] Void Trance Check
                if (player.skillToggles['void_trance'] && ability.cost > 0) {
                    addToLog("You cannot use MP-consuming abilities while Meditating!", "text-purple-400");
                    gameState.action = null;
                    return;
                }

                if (player._classKey === 'ranger') {
                     addToLog("Select a target to mark.", 'text-yellow-400');
                     gameState.action = 'mark_target'; 
                     renderBattleGrid(true, 'mark'); 
                     return; 
                }

                player.mp -= ability.cost;
                player.signatureAbilityUsed = true;
                updateStatsView();
                addToLog(`You activate ${ability.name}!`, 'text-yellow-300 font-bold');

                if (player._classKey === 'barbarian') {
                    player.statusEffects.buff_enrage = { duration: ability.duration }; 
                    addToLog(`You fly into a rage!`, 'text-red-500');
                }
                else if (player._classKey === 'artificer') {
                    spawnNpcDrone(player); 
                }
                else if (player._classKey === 'cleric') {
                    if (!player.equippedCatalyst || player.equippedCatalyst.name === 'None') {
                        addToLog("Requires catalyst!", 'text-red-400');
                        player.mp += ability.cost;
                        player.signatureAbilityUsed = false;
                        updateStatsView();
                        isProcessingAction = false; gameState.action = null; return; 
                    }
                    const baseDice = 3;
                    let healDiceCount = Math.min(7, baseDice + Math.floor(player.level / 10)); 
                    const healAmount = rollDice(healDiceCount, 8, 'Holy Blessings Heal').total;
                    player.hp = Math.min(player.maxHp, player.hp + healAmount);
                    addToLog(`Divine light heals for <span class="font-bold text-green-400">${healAmount}</span> HP!`, 'text-yellow-200');
                    const debuffs = Object.keys(player.statusEffects).filter(key => ['poison', 'paralyzed', 'petrified', 'drenched', 'toxic', 'slowed', 'inaccurate', 'clumsy', 'fumble', 'magic_dampen', 'elemental_vuln'].includes(key));
                    if (debuffs.length > 0) {
                        debuffs.forEach(key => delete player.statusEffects[key]);
                        addToLog(`Ailments purged!`, 'text-cyan-300');
                    }
                    updateStatsView();
                }
                else if (player._classKey === 'cook') {
                    renderOnFieldCookingUI();
                    return; 
                }

                gameState.isPlayerTurn = false;
                finalizePlayerAction(); 
                gameState.action = null; 

            } else if (ability.type === 'toggle') {
                 if (player._classKey === 'magus' && ability.modes) {
                     player.activeModeIndex++;
                     if (player.activeModeIndex >= ability.modes.length) player.activeModeIndex = -1; 
                     const currentModeName = player.activeModeIndex > -1 ? ability.modes[player.activeModeIndex] : "Off";
                     addToLog(`Arcane Mode: ${currentModeName}`, 'text-yellow-300');
                 }
                 else if (player._classKey === 'paladin') {
                     if (!player.signatureAbilityToggleActive && (!player.equippedCatalyst || player.equippedCatalyst.name === 'None')) {
                         addToLog("Divine Smite requires a catalyst!", 'text-red-400');
                         gameState.action = null; return; 
                     }
                     player.signatureAbilityToggleActive = !player.signatureAbilityToggleActive; 
                     addToLog(`${ability.name} ${player.signatureAbilityToggleActive ? 'activated!' : 'deactivated.'}`, 'text-yellow-300');
                 }
                 else {
                     player.signatureAbilityToggleActive = !player.signatureAbilityToggleActive;
                     addToLog(`${ability.name} ${player.signatureAbilityToggleActive ? 'activated!' : 'deactivated.'}`, 'text-yellow-300');
                 }
                renderBattleGrid(); 
                gameState.action = null; 
            }
            break;
        default:
            gameState.action = null; 
    }
}

function struggleSwallow() {
    if (!player.statusEffects.swallowed) return;
    const swallower = player.statusEffects.swallowed.source;
    if (!swallower || !swallower.isAlive()) {
        delete player.statusEffects.swallowed;
        addToLog("Your captor has fallen! You crawl out, covered in... stuff.", 'text-green-400');
        renderBattleGrid();
         finalizePlayerAction(); // Finalize turn after escaping
        return;
    }

    // Calculate struggle damage (scales with player strength)
    const struggleDamage = Math.floor((rollDice(1, 6, 'Struggle').total + Math.floor(player.strength / 2)) * 0.5);

    addToLog(`You struggle violently inside the beast!`, 'text-yellow-300');
    // --- MODIFIED: Use damageDealt ---
    const { damageDealt } = swallower.takeDamage(struggleDamage, { ignore_defense: 0.5 }); // Bypasses 50% defense
    addToLog(`You dealt <span class="font-bold text-yellow-300">${damageDealt}</span> damage from the inside!`);

    // Check status immediately after dealing damage
    if (!gameState.battleEnded) {
         checkBattleStatus(true); // isReaction = true
    }

    // Check if the struggle killed the beast or battle ended
    if (gameState.battleEnded || !swallower.isAlive()) {
         delete player.statusEffects.swallowed;
         addToLog("You burst free from the fallen beast!", 'text-green-400 font-bold');
         // No need to call finalizePlayerAction here, checkBattleStatus handles end state
         isProcessingAction = false; // Unlock actions
    } else {
        // --- MODIFIED: INT-based escape ---
        const escapeChance = 0.05 + (player.intelligence / 100); // 5% base + 1% per INT
        addToLog(`You try to find a weak point... (Escape Chance: ${(escapeChance * 100).toFixed(0)}%)`, 'text-gray-400');
        
        if (player.rollForEffect(escapeChance, 'Struggle Escape')) {
        // --- END MODIFIED ---
            delete player.statusEffects.swallowed;
            addToLog("You find an opening and squirm free!", 'text-green-300');
             finalizePlayerAction(); // Go to next phase
        } else {
            addToLog("You fail to escape!", 'text-red-400');
             finalizePlayerAction(); // Go to next phase
        }
    }
        gameState.isPlayerTurn = false;
}


function checkVictory() {
    if (gameState.battleEnded) return;
    if (currentEnemies.every(e => !e.isAlive())) {
        gameState.battleEnded = true;

        restoreDefaultAffinities(); // <--- ENSURE THIS IS HERE

        gameState.activeDrone = null;   
        gameState.markedTarget = null;
        addToLog(`All enemies defeated!`, 'text-green-400 font-bold');

        // ... existing logic (Biome Clears, Tutorial, etc.) ...
        if (gameState.currentBiome && preTrainingState === null) {
            if (!player.biomeClears) player.biomeClears = {}; 
            player.biomeClears[gameState.currentBiome] = (player.biomeClears[gameState.currentBiome] || 0) + 1;
        }

        const isTutorialBattle = tutorialState.isActive && tutorialState.sequence[tutorialState.currentIndex]?.trigger?.type === 'enemy_death';
        if (isTutorialBattle) {
            advanceTutorial();
            return true;
        }
        
        if (gameState.currentMap && gameState.currentEncounterType === 'boss') {
            addToLog(`Boss defeated! The expedition is a success!`, 'text-green-400 font-bold');
            setTimeout(() => endBiomeRun('victory'), 1500);
        } else {
            setTimeout(renderPostBattleMenu, 1000);
        }

        return true;
    }
    return false;
}

function checkBattleStatus(isReaction = false) {
    if (gameState.battleEnded) return;

    const defeatedEnemiesThisCheck = [];

    // Iterate backwards because we might remove elements
    for (let i = currentEnemies.length - 1; i >= 0; i--) {
        const enemy = currentEnemies[i];

        // Check if HP is 0 or less
        if (enemy.hp <= 0) {

            // --- Revival Logic ---
            let revived = false;
            
            // Divine Blessing (Anti-Revive)
            let preventRevive = false;
            if (player.hasSkill('divine_blessing') && enemy.killedByLight) {

                if (enemy.speciesData.class === 'Undead' && !enemy.revived && enemy.ability !== 'alive_again') {
                     preventRevive = true;
                     addToLog("Divine Blessing prevents the undead from rising!", "text-yellow-300");
                }

                if (enemy.ability === 'alive_again' && enemy.reviveChance < 1.0) {
                     preventRevive = true;
                     addToLog("Divine Blessing burns away the lingering soul!", "text-yellow-300");
                }
            }
            
            // Actual Revival Checks
            if (!preventRevive) {
                if (enemy.speciesData.class === 'Undead' && !enemy.revived && enemy.ability !== 'alive_again') {
                    addToLog(`${enemy.name} reforms from shattered bones!`, 'text-gray-400 font-bold');
                    enemy.hp = Math.floor(enemy.maxHp * 0.5); // Restore HP
                    enemy.revived = true; // Mark as revived once
                    revived = true;
                } else if (enemy.ability === 'alive_again' && Math.random() < enemy.reviveChance) {
                    addToLog(`${enemy.name} rises again!`, 'text-purple-600 font-bold');
                    enemy.hp = Math.floor(enemy.maxHp * 0.5); // Restore HP
                    enemy.reviveChance /= 2;
                    revived = true;
                }
            }
            // --- End Revival Logic ---

            // If not revived, mark for removal and processing
            if (!revived) {
                defeatedEnemiesThisCheck.push(enemy);
                // If the defeated enemy was the marked target, clear the mark state
                if (enemy === gameState.markedTarget) {
                    gameState.markedTarget = null;
                }
                currentEnemies.splice(i, 1); // Remove from the active list
            }
        }
    } // End loop through enemies

    // Process defeated enemies (XP, loot, quests)
    if (defeatedEnemiesThisCheck.length > 0) {
        defeatedEnemiesThisCheck.forEach(enemy => {
            addToLog(`You have defeated ${enemy.name}!`, 'text-green-400 font-bold');
            
            // --- NEW: Determine Quest/Reward Multiplier ---
            const questMultiplier = enemy.isBoss ? 5 : 1;

            // --- Added Kill Counters & Key Drop Logic ---
            let droppedKey = null;
            if (player.level >= 4) {
                player.killsSinceLevel4++;
                if (player.killsSinceLevel4 >= 5) { 
                    if (player._classKey === 'ranger' || player._classKey === 'cook') {
                        const randomKey = Math.random() < 0.5 ? 'blacksmith_key' : 'tower_key';
                        const alternateKey = randomKey === 'blacksmith_key' ? 'tower_key' : 'blacksmith_key';

                        if (randomKey === 'blacksmith_key' && !player.unlocks.hasBlacksmithKey) {
                            droppedKey = 'blacksmith_key';
                        } else if (randomKey === 'tower_key' && !player.unlocks.hasTowerKey) {
                            droppedKey = 'tower_key';
                        } else if (alternateKey === 'blacksmith_key' && !player.unlocks.hasBlacksmithKey) {
                            droppedKey = 'blacksmith_key';
                        } else if (alternateKey === 'tower_key' && !player.unlocks.hasTowerKey) {
                            droppedKey = 'tower_key';
                        }
                    } else {
                        if (MARTIAL_CLASSES.includes(player._classKey) && !player.unlocks.hasBlacksmithKey) {
                            droppedKey = 'blacksmith_key';
                        } else if (MAGIC_CLASSES.includes(player._classKey) && !player.unlocks.hasTowerKey) {
                            droppedKey = 'tower_key';
                        }
                    }
                }
            }
            if (player.level >= 7) {
                player.killsSinceLevel7++;
                if (player.killsSinceLevel7 >= 5 && !droppedKey) { 
                    if (!player.unlocks.hasBlacksmithKey) {
                        droppedKey = 'blacksmith_key';
                    } else if (!player.unlocks.hasTowerKey) {
                        droppedKey = 'tower_key';
                    }
                }
            }

            if (droppedKey) {
                 player.addToInventory(droppedKey, 1, false);
                 addToLog(`The fallen ${enemy.name} dropped a ${getItemDetails(droppedKey).name}!`, 'text-yellow-400 font-bold');
            }

            // --- [INJECTED LOGIC STARTS HERE] ---
            // Ensure we are NOT in the training dummy mode before giving rewards
            if (typeof preTrainingState === 'undefined' || preTrainingState === null) {
                
                // 1. Gold Drop
                player.gold += enemy.goldReward * questMultiplier;
                addToLog(`You found <span class="font-bold">${enemy.goldReward * questMultiplier}</span> G.`, 'text-yellow-400');
                
                // 2. XP Drop
                player.gainXp(enemy.xpReward * questMultiplier);

                // 3. Legacy Quest Progress
                if (enemy.rarityData.name === 'Legendary') {
                    const speciesKey = enemy.speciesData.key;
                    if (!player.legacyQuestProgress[speciesKey]) {
                        player.legacyQuestProgress[speciesKey] = true;
                        addToLog(`*** LEGACY QUEST UPDATE: Legendary ${enemy.speciesData.name} slain! ***`, 'text-purple-300 font-bold');
                    }
                }

                // 4. Loot Drop Logic
                for (const item in enemy.lootTable) {
                    let baseDropChance = enemy.lootTable[item];
                    const itemDetails = getItemDetails(item);
                    const playerLuckBonus = Math.min(0.25, (player.luck * 0.5) / 100);
                    let finalDropChance = baseDropChance + playerLuckBonus;

                    if (player.foodBuffs.loot_chance) finalDropChance *= player.foodBuffs.loot_chance.value;
                    if (player.race === 'Dwarf' && itemDetails && (WEAPONS[item] || ARMOR[item] || SHIELDS[item] || CATALYSTS[item])) {
                        finalDropChance *= 1.25;
                    }
                    if (player.equippedWeapon.effect?.lootBonus && itemDetails && (itemDetails.class || ['Armor', 'Weapon'].includes(itemDetails.type))) {
                        finalDropChance *= 2;
                    }

                    if (player.rollForEffect(finalDropChance, 'Loot Drop')) {
                        player.addToInventory(item, 1, true);
                    }
                }

                // 5. Recipe Drop Logic
                const enemyTier = enemy.speciesData.tier;
                const baseRecipeDropChance = 0.05 + (enemy.rarityData.rarityIndex * 0.005);
                const recipeLuckBonus = Math.min(0.10, (player.luck * 0.5) / 100); 
                const finalRecipeDropChance = baseRecipeDropChance + recipeLuckBonus;

                if (player.rollForEffect(finalRecipeDropChance, 'Recipe Drop')) {
                    const recipeType = Math.random() < 0.5 ? 'cooking' : 'alchemy';
                    const allPossibleRecipes = RECIPE_DROPS_BY_TIER[recipeType]?.[enemyTier] || [];
                    const availableRecipesForTier = allPossibleRecipes.filter(recipeKey => {
                            const actualRecipeKey = ITEMS[recipeKey]?.recipeKey;
                            if (!actualRecipeKey) return false;
                            if (recipeType === 'cooking') return !player.knownCookingRecipes.includes(actualRecipeKey);
                            else return !player.knownAlchemyRecipes.includes(actualRecipeKey);
                        });

                    if (availableRecipesForTier.length > 0) {
                        const droppedRecipeItemKey = availableRecipesForTier[Math.floor(Math.random() * availableRecipesForTier.length)];
                        player.addToInventory(droppedRecipeItemKey, 1, true);
                    }
                }

                // 6. Seed Drop Logic
                const baseSeedDropChance = 0.10;
                const seedLuckBonus = Math.min(0.15, (player.luck * 0.5) / 100);
                const finalSeedDropChance = baseSeedDropChance + seedLuckBonus;

                if (player.rollForEffect(finalSeedDropChance, 'Seed Drop')) {
                    let weights;
                    if (enemyTier === 1) weights = [100, 0, 0];
                    else if (enemyTier === 2) weights = [70, 30, 0];
                    else if (enemyTier === 3) weights = [20, 80, 0];
                    else if (enemyTier === 4) weights = [0, 70, 30];
                    else if (enemyTier === 5) weights = [0, 30, 70];
                    else weights = [100, 0, 0];

                    const chosenRarity = choices(['Common', 'Uncommon', 'Rare'], weights);
                    const availableSeeds = Object.keys(ITEMS).filter(key => {
                        const details = ITEMS[key];
                        return details && (details.type === 'seed' || details.type === 'sapling') && details.rarity === chosenRarity;
                    });

                    if (availableSeeds.length > 0) {
                        const seedKey = availableSeeds[Math.floor(Math.random() * availableSeeds.length)];
                        player.addToInventory(seedKey, 1, true);
                    }
                }

                // 7. Casino Clue Drop Logic
                if (player.unlocks.arcaneCasino) {
                    const paperClues = ['ripped_paper_1', 'ripped_paper_2', 'ripped_paper_3', 'ripped_paper_4', 'ripped_paper_5'];
                    const missingClues = paperClues.filter(clue => !player.inventory.items[clue]);
                    if (missingClues.length > 0 && player.rollForEffect(0.05, 'Casino Clue Drop')) {
                        const clueToDrop = missingClues[Math.floor(Math.random() * missingClues.length)];
                        player.addToInventory(clueToDrop, 1, true);
                    }
                }

                // 8. Extermination Quest Progress
                if (player.activeQuest && player.activeQuest.category === 'extermination') {
                    const quest = getQuestDetails(player.activeQuest);
                    if (quest && quest.target === enemy.speciesData.key) {
                        player.questProgress += questMultiplier; 
                        addToLog(`Quest progress: ${player.questProgress}/${quest.required}`, 'text-amber-300');
                    }
                }
            }
            // --- [INJECTED LOGIC ENDS HERE] ---
        });
    }

    // Check victory
    if (checkVictory()) {
         isProcessingAction = false; // Ensure actions unlocked on victory
         return; // Stop further processing if victory occurred
    }

    // NPC Ally Flee Check
    if (player.npcAlly && player.npcAlly.hp <= 0) {
        const allyName = player.npcAlly.name; 
        addToLog(`<span class="font-bold text-red-500">${allyName} has been defeated and fled the battle!</span>`, "text-red-500");
        addToLog(`<span class="font-bold text-red-700">${allyName} is gone for good, taking all their equipment...</span>`, "text-red-700");
        player.npcAlly = null; 
        player.encountersSinceLastPay = 0;
        renderBattleGrid(); 
    }
}

function generateLoot(enemy) {
    if (!enemy.lootTable) return;

    for (const item in enemy.lootTable) {
        let baseDropChance = enemy.lootTable[item];
        const itemDetails = getItemDetails(item);
        const playerLuckBonus = Math.min(0.25, (player.luck * 0.5) / 100);
        
        let finalDropChance = baseDropChance + playerLuckBonus;

        // Food Buffs
        if (player.foodBuffs.loot_chance) finalDropChance *= player.foodBuffs.loot_chance.value;
        
        // [FIX] Weapon Effects (Blacksmith's Hammer) - Equipment Only
        if (player.equippedWeapon.effect && player.equippedWeapon.effect.lootBonus) {
            // Explicitly check if the item key exists in the equipment constants
            // This handles Weapons, Armor, Shields, and Catalysts correctly
            const isEquipment = (typeof WEAPONS !== 'undefined' && WEAPONS[item]) || 
                                (typeof ARMOR !== 'undefined' && ARMOR[item]) || 
                                (typeof SHIELDS !== 'undefined' && SHIELDS[item]) || 
                                (typeof CATALYSTS !== 'undefined' && CATALYSTS[item]);

            if (isEquipment) {
                finalDropChance *= 2.0; // Double chance (100% increase)
            }
        }

        // Race Bonus (Dwarf)
        if (player.race === 'Dwarf' && (typeof WEAPONS !== 'undefined' && (WEAPONS[item] || ARMOR[item] || SHIELDS[item] || CATALYSTS[item]))) {
            finalDropChance *= 1.25;
        }
        
        // Skill: Dwarven Battle Arts (Hammer only)
        if (player.isSkillActive('dwarven_battle_arts') && player.equippedWeapon.class === 'Hammer') {
            if (itemDetails && (WEAPONS[item] || ARMOR[item] || SHIELDS[item])) {
                finalDropChance += 0.10; 
            }
        }

        // Skill: Scavenger's Eye
        if (player.isSkillActive('scavengers_eye')) {
                if (itemDetails && (itemDetails.type === 'junk' || itemDetails.type === 'food_ingredient' || itemDetails.type === 'alchemy')) {
                    finalDropChance += 0.10; 
                }
        }
        
        // Skill: Essence Mastery
        if (player.isSkillActive('essence_mastery') && itemDetails && itemDetails.type === 'enchant') {
            finalDropChance *= 1.5; 
        }

        // Roll
        if (player.rollForEffect(finalDropChance, 'Loot Drop')) {
            player.addToInventory(item, 1, true);
        }
    }
}


// NEW: Helper function to finalize player action and transition turn
function finalizePlayerAction() {
    // --- RESET ACTION STATE ---
    gameState.action = null;
    gameState.spellToCast = null;
    gameState.itemToUse = null;
    gameState.pendingTarget = null;
    processInsatiableVoidEnd();
    // --------------------------

    if (gameState.battleEnded) {
        isProcessingAction = false;
        return;
    }

    // [FIX] Handling Death & Revival
    if (!player.isAlive()) {
        checkPlayerDeath(); // Check for revival
        
        // If STILL dead after checking, stop.
        if (!player.isAlive()) {
            isProcessingAction = false;
            return;
        }
        // If revived, code execution continues below to end the turn...
    }

    $('#inventory-btn').disabled = true;
    $('#character-sheet-btn').disabled = true;

    if (gameState.isMovementOnlyTurn) {
        gameState.isMovementOnlyTurn = false;
    }

    if (player.curvedSwordMomentum > 0) {
        if (!player.hasHitEnemyThisTurn) {
            player.curvedSwordMomentum = Math.max(0, player.curvedSwordMomentum - 5);
            addToLog("Momentum fades...", "text-gray-400 text-xs italic");
        }
    }
    
    // Reset the tracker for the next turn
    player.hasHitEnemyThisTurn = false;

    // --- Haste / Extra Action Logic ---
    if (player.statusEffects.buff_haste || player.statusEffects.buff_hermes) {
        const hasteUsed = player.statusEffects.buff_haste?.turnUsed || player.statusEffects.buff_hermes?.turnUsed;
        if (!hasteUsed) {
            if (player.statusEffects.buff_haste) player.statusEffects.buff_haste.turnUsed = true;
            if (player.statusEffects.buff_hermes) player.statusEffects.buff_hermes.turnUsed = true;
            addToLog("Your haste grants you another action!", "text-cyan-300");
            beginPlayerTurn();
            return;
        }
    }

    if (player.skillToggles['avatar_of_tempest']) {
        if (!player.encounterFlags.tempestActionUsed) {
            player.encounterFlags.tempestActionUsed = true;
            addToLog("The tempest within grants you another action!", "text-cyan-300 font-bold");
            beginPlayerTurn();
            return;
        }
    }

    // Check Swiftness (Movement Only Action)
    if (player.statusEffects.buff_swiftness && !gameState.battleEnded) {
        const swiftUsed = player.statusEffects.buff_swiftness.turnUsed;
        if (!swiftUsed) {
            player.statusEffects.buff_swiftness.turnUsed = true;
            addToLog("Swiftness grants you a burst of speed!", "text-cyan-300");
            gameState.isMovementOnlyTurn = true;
            beginPlayerTurn();
            return;
        }
    }

    if (player.encounterFlags) player.encounterFlags.tempestActionUsed = false;
    
    // Proceed to End of Turn
    handlePlayerEndOfTurnEffects();
}

// NEW: Separated end-of-turn effects from the turn transition logic
async function handlePlayerEndOfTurnEffects() {
    if (gameState.battleEnded && !gameState.playerIsDying) return;
    updateTotemAuras(player);

    // =========================================================================
    // A. HELPER: TURN ADVANCEMENT LOGIC
    // =========================================================================
    const advanceTurn = () => {
        // 1. Reset Action Locks (CRITICAL FIX)
        isProcessingAction = false; 
        gameState.isPlayerTurn = false;

        // 2. Determine Next Actor
        if (gameState.activeDrone && gameState.activeDrone.isAlive()) {
            setTimeout(() => droneTurn(gameState.activeDrone, 'startNpcTurn'), 100); 
        } 
        else if (player.npcAlly && player.npcAlly.hp > 0 && !player.npcAlly.isFled && player.npcAlly.x !== -1) {
            setTimeout(startNpcTurn, 100); 
        }
        else if (gameState.npcActiveDrone && gameState.npcActiveDrone.isAlive()) {
            setTimeout(() => droneTurn(gameState.npcActiveDrone, 'enemyTurn'), 100);
        }
        else {
            setTimeout(enemyTurn, 100); 
        }
    };

    // --- 1. PROCESS GRID OBJECTS ---
    const spritefires = gameState.gridObjects.filter(o => o.subtype === 'spritefire');
    if (spritefires.length > 0) {
        addToLog("The Spritefires seek targets...", "text-orange-300 italic");
        const attackedTargets = new Set();
        spritefires.forEach(sprite => {
            const range = sprite.weaponSnapshot.range || 1; 
            const candidates = currentEnemies.filter(e => e.isAlive() && (Math.abs(e.x - sprite.x) + Math.abs(e.y - sprite.y)) <= range);
            if (candidates.length > 0) {
                let target = candidates.find(e => !attackedTargets.has(e.id || e));
                if (!target) target = candidates[0];
                if (target) {
                    attackedTargets.add(target.id || target);
                    const wpn = sprite.weaponSnapshot;
                    const dmg = Math.max(1, Math.floor(((wpn.damage.length > 1 ? wpn.damage[1] : 5) + (sprite.statBonusSnapshot||0)) * 0.5));
                    target.takeDamage(dmg, { element: 'fire' }, player);
                    addToLog(`Spritefire burns ${target.name} for ${dmg}!`, "text-orange-200");
                    
                    // Corona Ballet
                    if (player.isSkillActive('corona_ballet')) {
                        const existing = gameState.gridObjects.find(o => o.x === target.x && o.y === target.y);
                        if (!existing) {
                             gameState.gridObjects.push({type: 'trap', subtype: 'unstable_fire', x: target.x, y: target.y, duration: 2, damageSnapshot: dmg, emoji: '🔥', name: 'Unstable Fire'});
                        }
                    }
                    if (!target.isAlive()) checkBattleStatus(true);
                }
            }
        });
        if (checkVictory()) return;
    }

    const sanctuary = gameState.gridObjects.find(o => o.x === player.x && o.y === player.y && o.subtype === 'sanctuary');
    if (sanctuary) {
        const heal = Math.floor(player.maxHp * 0.05);
        if (player.hp < player.maxHp) player.hp += heal;
        if(typeof CLEANSABLE_DEBUFFS !== 'undefined') CLEANSABLE_DEBUFFS.forEach(d => { if(player.statusEffects[d]) delete player.statusEffects[d]; });
        addToLog("Sanctuary heals and purifies you.", "text-yellow-200");
    }

    // [INJECTED] BANQUET OF EINHERJAR CHECK
    const banquet = gameState.gridObjects.find(o => o.subtype === 'banquet_table' && o.x === player.x && o.y === player.y);
    if (banquet) {
        addToLog("You feast at the Banquet of Einherjar!", "text-yellow-200 font-bold");

        // 1. HEAL (20% Max HP)
        const healAmt = Math.floor(player.maxHp * 0.20);
        if (player.hp < player.maxHp) {
            player.hp = Math.min(player.maxHp, player.hp + healAmt);
            addToLog(`Delicious food restores <span class="text-green-300 font-bold">${healAmt} HP</span>!`, "text-green-200");
            updateStatsView();
        }

        // 2. APPLY BUFFS (20% Atk, 20% Def, +1 Speed)
        applyStatusEffect(player, 'buff_valhalla', {
            name: "Einherjar's Vigor",
            type: 'buff',
            description: "Feasting like a warrior. (+20% Stats, +1 Spd)",
            duration: 4,
            icon: '🍺',
            atkMult: 1.20,             // Used by performAttack
            defense_multiplier: 1.20,  // Standard def scaler
            move: 1                    // Speed Bonus
        });

        addToLog("You feel the strength of Valhalla flowing through you!", "text-yellow-300 text-xs");
        
        // Small delay for effect
        await new Promise(r => setTimeout(r, 200));
    }
    // [END INJECTION]

    for (let i = gameState.gridObjects.length - 1; i >= 0; i--) {
        const obj = gameState.gridObjects[i];
        if (obj.type === 'portal' && obj.subtype === 'void_rift') {
            obj.duration--; 
            if (obj.duration <= 0) {
                addToLog("The Rift collapses!", "text-purple-500");
                const victims = [player, player.npcAlly, ...currentEnemies].filter(e => e && e.isAlive() && e.x === obj.x && e.y === obj.y);
                victims.forEach(v => v.takeDamage(Math.floor(v.maxHp * 0.25), { element: 'void', ignore_defense: true }));
                gameState.gridObjects.splice(i, 1);
            }
        }
    }

    // --- 2. TOGGLES & COSTS ---
    let bloodSynergyActive = false;
    if (player.skillToggles['nihility_form']) {
        if (player.hp > 25 && player.mp >= 25) { player.hp -= 25; player.mp -= 25; addToLog(`[Calc] Nihility: -25 HP/MP`, "text-gray-500 text-xs font-mono"); }
        else { player.skillToggles['nihility_form'] = false; addToLog("Nihility Form ends.", "text-purple-400"); }
    }
    
    const toggleCosts = [
        { key: 'assassins_gambit', cost: 10 }, { key: 'pure_elegance', cost: 15 },
        { key: 'mana_steel_aura', cost: 20 }, { key: 'force_switch_blade', cost: 10 },
        { key: 'titan_swing', cost: 10 }, { key: 'lockdown', cost: 15 },
        { key: 'iron_mountain', cost: 5 }, { key: 'tectonic_edge', cost: 15 },
        { key: 'crucible_of_the_beast', cost: 10 }, { key: 'entropy_edge', cost: 20 },
        { key: 'take_flight', cost: 25 }, { key: 'cyclone_mantle', cost: 20 },
        { key: 'zephyrs_edge', cost: 25 }, { key: 'avatar_of_tempest', cost: 40 },
    ];
    toggleCosts.forEach(t => {
        if (player.skillToggles[t.key]) {
            if (player.mp >= t.cost) player.mp -= t.cost;
            else { player.skillToggles[t.key] = false; addToLog(`${t.key} deactivated (Low MP).`, "text-red-400"); }
        }
    });

    // Special Toggles
    if (player.skillToggles['entropy_edge'] && player.weaponElement !== 'void') player.skillToggles['entropy_edge'] = false;
    if (player.skillToggles['crimson_feast'] && !player.skillToggles['rite_old_gods']) {
        if (player.mp >= 10) player.mp -= 10; else player.skillToggles['crimson_feast'] = false;
    }
    if (player.skillToggles['rite_old_gods']) {
            // Cost: 10% CURRENT HP (High risk at high HP, low risk at low HP)
            const hpCost = Math.floor(player.hp * 0.10);
            // Gain: 10% MAX MP
            const mpGain = Math.floor(player.maxMp * 0.10);

            if (player.hp > hpCost) {
                player.hp -= hpCost;
                player.mp = Math.min(player.maxMp, player.mp + mpGain);
                
                addToLog(`Rite of the Old Gods: -${hpCost} HP, +${mpGain} MP`, "text-purple-300 text-xs");
                
                // Check if we can trigger the Synergy
                if (player.skillToggles['crimson_feast']) {
                    bloodSynergyActive = true;
                    addToLog(">> BLOOD SYNERGY: Stats Up & Feast is Free <<", "text-red-500 font-bold");
                }
            } else {
                player.skillToggles['rite_old_gods'] = false;
                addToLog("Rite deactivated (Health too critical).", "text-red-400");
            }
        }

        // [CRIMSON FEAST]
        if (player.skillToggles['crimson_feast']) {
            // Standard Cost: 25 MP
            let mpCost = 25;
            
            // Synergy Bonus: Cost becomes 0
            if (bloodSynergyActive) {
                mpCost = 0; 
            }

            if (player.mp >= mpCost) {
                player.mp -= mpCost;
                // Note: The visual HP drain/MP cost log is handled by the UI update, 
                // but you can add a log here if you want spam.
            } else {
                player.skillToggles['crimson_feast'] = false;
                addToLog("Crimson Feast deactivated (Insufficient MP).", "text-red-400");
            }
        }
    if (player.skillToggles['divine_unalloyed_soul']) {
        if (player.hp > 25 && player.mp >= 25) { player.hp -= 25; player.mp -= 25; }
        else player.skillToggles['divine_unalloyed_soul'] = false;
    }

    // --- 3. REGENERATION ---
    if (player.skillToggles['void_trance']) {
        const baseAmount = Math.floor(player.maxMp * 0.20);
        if (baseAmount > 0 && player.mp < player.maxMp) {
            // Calculate actual gain to avoid exceeding max
            const actualGain = Math.min(baseAmount, player.maxMp - player.mp);
            player.mp += actualGain;
            addToLog(`Meditate restores <span class="font-bold text-blue-300">${actualGain}</span> MP.`, "text-blue-200");
        }
    }

    if (player.skillToggles['vital_stasis']) {
        const baseAmount = Math.floor(player.maxHp * 0.05);
        if (baseAmount > 0 && player.hp < player.maxHp) {
            // Calculate actual gain to avoid exceeding max
            const actualGain = Math.min(baseAmount, player.maxHp - player.hp);
            player.hp += actualGain;
            addToLog(`Catnap restores <span class="font-bold text-green-300">${actualGain}</span> HP.`, "text-green-200");
        }
    }

    // (Keeping existing Aasimar racial logic, but ensuring it respects caps too if you want consistency)
    if (player.race === 'Aasimar' && player.hp < player.maxHp) {
        const healPercent = (player.level >= 20 ? 0.05 : 0.02);
        const healAmount = Math.floor(player.maxHp * healPercent);
        player.hp = Math.min(player.maxHp, player.hp + healAmount); 
    }
    
    // --- 4. STATUS EFFECTS ---
    const effects = player.statusEffects;
    for (const effectKey in effects) {
        if (effects[effectKey].duration) {
            effects[effectKey].duration--;
            if (effects[effectKey].duration <= 0) {
                
                // [FIX] BANQUET SPAWN LOGIC
                if (effectKey === 'preparing_feast') {
                    delete effects[effectKey];
                    addToLog("The Banquet is served!", "text-yellow-300 font-bold");

                    // 1. Spawn the Table Object
                    // This allows the check at the start of the turn (Section 1) to find it
                    gameState.gridObjects.push({
                        type: 'structure',
                        subtype: 'banquet_table', // Matches the check we added earlier
                        name: "Banquet of Einherjar",
                        x: player.x,
                        y: player.y,
                        emoji: '🍖', 
                        duration: 4 // Stays on field for 4 turns
                    });

                    // 2. Immediate Trigger (Optional but feels better)
                    // If you want the heal to happen THE MOMENT the prep ends:
                    const healAmt = Math.floor(player.maxHp * 0.50);
                    player.hp = Math.min(player.maxHp, player.hp + healAmt);
                    
                    applyStatusEffect(player, 'buff_valhalla', {
                        name: "Einherjar's Vigor",
                        type: 'buff',
                        description: "Feasting like a warrior. (+20% Stats, +1 Spd)",
                        duration: 3,
                        icon: '🍺',
                        atkMult: 1.20,
                        defense_multiplier: 1.20,
                        move: 1
                    });
                    
                    addToLog(`The feast restores <span class="text-green-300 font-bold">${healAmt} HP</span> and strengthens you!`, "text-green-200");
                    updateStatsView();

                    continue; 
                }

                if (effectKey === 'void_feedback' && typeof restoreDefaultAffinities === 'function') restoreDefaultAffinities();
                delete effects[effectKey];
                continue; 
            }
        }
        if (effectKey === 'poison') player.hp -= Math.floor(player.maxHp * 0.05);
        if (effectKey === 'toxic') player.hp -= Math.floor(player.maxHp * 0.10);
        if (effectKey === 'swallowed') player.hp -= Math.floor(player.maxHp * 0.10);
    }
    
    updateStatsView();

    // =========================================================================
    // 5. DEATH & REVIVAL GATE
    // =========================================================================
    if (player.hp <= 0) {
        // A. Run Check
        if (typeof checkPlayerDeath === 'function') await checkPlayerDeath();

        // B. Determine Fate
        if (player.hp > 0) {
            // ALIVE / REVIVED
            // Unlock the engine (Critical Fix)
            isProcessingAction = false; 
            gameState.isPlayerTurn = false;
            gameState.battleEnded = false;
            gameState.playerIsDying = false;

            addToLog("Turn passes to the enemy...", "text-gray-400 italic");
            renderBattleGrid();
            updateStatsView();

            // C. Trigger Next Turn Immediately
            advanceTurn(); 
            return; 
        } else {
            // DEAD
            isProcessingAction = false;
            return;
        }
    }

    // Victory Check
    if (checkVictory()) return;

    // --- 6. NORMAL TURN ADVANCE ---
    advanceTurn();
}

    // Renamed original handlePlayerEndOfTurn to avoid confusion
    const handlePlayerEndOfTurn = handlePlayerEndOfTurnEffects;


// New function for Drone's turn
async function droneTurn(droneInstance, nextTurnKey) { // Made async, takes instance and next turn
    if (gameState.battleEnded || !droneInstance || !droneInstance.isAlive()) {
        setTimeout(window[nextTurnKey], 100); // Drone died or doesn't exist, skip to next turn
        return;
    }

    const drone = droneInstance;
    addToLog(`${drone.name}'s turn! (Range: ${drone.range})`, 'text-cyan-300'); // Log range

    // Simple Drone AI: Find nearest living enemy and attack if in range
    let nearestEnemy = null;
    let minDistance = Infinity;
    let enemyPath = null; // Store path to nearest enemy

    currentEnemies.forEach(enemy => {
        if (enemy.isAlive()) {
            const distance = Math.abs(drone.x - enemy.x) + Math.abs(drone.y - enemy.y);
            // Check if path exists before selecting
            const path = findPath({x: drone.x, y: drone.y}, {x: enemy.x, y: enemy.y}); // Drone probably can't fly
            if (path && distance < minDistance) { // Check path exists and distance is less
                minDistance = distance;
                nearestEnemy = enemy;
                enemyPath = path; // Store the path
            }
        }
    });


    if (nearestEnemy) {
        let currentDistance = Math.abs(drone.x - nearestEnemy.x) + Math.abs(drone.y - nearestEnemy.y);

        // Move if out of range and path exists
        if (currentDistance > drone.range && enemyPath && enemyPath.length > 1) {
            addToLog(`${drone.name} moves towards ${nearestEnemy.name}.`);
            const stepsToTake = Math.min(enemyPath.length - 1, drone.movementSpeed); // Use drone's speed
            for (let i = 1; i <= stepsToTake; i++) {
                const nextStep = enemyPath[i];
                // Double check blockage right before moving (e.g., if another enemy moved)
                if (isCellBlocked(nextStep.x, nextStep.y, false, false)) { // Assuming drone cannot fly
                    addToLog(`${drone.name} encounters an obstacle and stops.`);
                    break;
                }
                drone.x = nextStep.x;
                drone.y = nextStep.y;
                renderBattleGrid(); // Update grid visually
                // MODIFIED: Increased delay from 150 to 300
                await new Promise(resolve => setTimeout(resolve, 300)); // Movement delay
                currentDistance = Math.abs(drone.x - nearestEnemy.x) + Math.abs(drone.y - nearestEnemy.y);
                if (currentDistance <= drone.range) {
                    break; // Stop moving if now in range
                }
            }
        }

        // Attack if now in range
        if (currentDistance <= drone.range) {
            drone.attack(nearestEnemy);
             // Check if drone attack ended the battle
             if (!gameState.battleEnded) checkBattleStatus(true); // isReaction = true
             if (gameState.battleEnded) return; // Stop if battle ended
        } else {
             addToLog(`${drone.name} cannot reach ${nearestEnemy.name}.`);
        }
    } else {
        addToLog(`${drone.name} finds no targets.`);
    }

    // Proceed to enemy turn AFTER drone acts (and after potential delay)
    if (!gameState.battleEnded) {
         setTimeout(window[nextTurnKey], 200); // <-- MODIFIED
    }
}

function handleEnemyEndOfTurn(enemy) {
    if (gameState.battleEnded) return;

    // --- 1. FROZEN MIST CHECK ---
    const mist = gameState.gridObjects.find(o => o.subtype === 'frozen_mist' && o.x === enemy.x && o.y === enemy.y);
    if (mist) {
        if (!enemy.statusEffects.frostbite) enemy.statusEffects.frostbite = { stacks: 0 };
        enemy.statusEffects.frostbite.stacks += 1;
        addToLog(`${enemy.name} shivers in the Frozen Mist. (Frostbite +1)`, 'text-cyan-300');
    }

    // --- 2. POISON MIST CHECK (Miasma of Decay) ---
    const poisonMist = gameState.gridObjects.find(o => o.subtype === 'poison_mist' && o.x === enemy.x && o.y === enemy.y);
    if (poisonMist) {
        if (!enemy.statusEffects.decaying_poison) {
            enemy.statusEffects.decaying_poison = { stacks: 0, duration: 5 };
        }
        
        const effect = enemy.statusEffects.decaying_poison;

        if (effect.stacks < 3) {
            effect.stacks++;
            addToLog(`${enemy.name} inhales the miasma. (Decay x${effect.stacks})`, 'text-green-300');
        } else {
            addToLog(`${enemy.name} chokes on the miasma. (Decay Refreshed)`, 'text-green-300');
        }
        
        effect.duration = 5; 
    }

    // --- 3. BLOOMING POWDER CHECK (Crucible of Bloom) ---
    const bloom = gameState.gridObjects.find(o => o.subtype === 'blooming_powder' && o.x === enemy.x && o.y === enemy.y);
    if (bloom) {
        // Initialize Calculation Log
        const calcLog = {
            source: 'Crucible of Bloom',
            targetName: enemy.name,
            steps: [],
            baseDamage: 0,
            finalDamage: 0
        };

        // 1. Determine Dice Count (1 + Total Amp / 2)
        const catAmp = player.equippedCatalyst?.effect?.spell_amp || 0;
        const armAmp = player.equippedArmor?.effect?.spell_amp || 0;
        const totalAmp = catAmp + armAmp;
        const diceCount = 1 + Math.floor(totalAmp / 2);

        // 2. Roll Base Damage
        const sides = getNatureDiceSize(8); 
        const rollObj = rollDice(diceCount, sides, 'Bloom Damage');
        
        let bloomDmg = rollObj.total;
        
        calcLog.baseDamage = bloomDmg;
        calcLog.steps.push({ 
            description: `Base Roll (${diceCount}d${sides})`, // Update log to reflect new size
            value: rollObj.rolls.join('+'), 
            result: bloomDmg 
        });
        
        // 3. Magic Scaling: Base * (1 + Int/20)
        const magicBonus = player.magicalDamageBonus;
        const scaleMult = 1 + (magicBonus / 20);
        
        bloomDmg = Math.floor(bloomDmg * scaleMult);
        
        calcLog.steps.push({ 
            description: `Int Scaling (${player.intelligence})`, 
            value: `x${scaleMult.toFixed(2)}`, 
            result: bloomDmg 
        });
        
        // 4. Defense Step separator
        calcLog.steps.push({ description: "=== DEFENSE ===", value: "", result: "" });

        // 5. Apply Damage
        const res = enemy.takeDamage(bloomDmg, { element: 'nature', isMagic: true }, player);
        
        // 6. Merge Defense Logs
        if (res.defenseSteps) {
            calcLog.steps = calcLog.steps.concat(res.defenseSteps);
        }
        calcLog.finalDamage = res.damageDealt;

        // 7. Output Results
        logDamageCalculation(calcLog);
        addToLog(`${enemy.name} is choked by the pollen! <span class="font-bold text-pink-300">-${res.damageDealt}</span>`, "text-pink-400");
    }

    // --- 4. TRAP/HAZARD CHECK (Magma / Sanctuary) ---
    const trap = gameState.gridObjects.find(o => (o.type === 'trap' || o.type === 'hazard') && o.x === enemy.x && o.y === enemy.y);
    if (trap) {
        if (trap.subtype === 'magma') {
            const calcLog = { 
                source: trap.name || "Magma Pool", 
                targetName: enemy.name, 
                steps: [], 
                baseDamage: 0, 
                finalDamage: 0 
            };

            let burnDmg = 0;
            
            if (trap.isHighIntensity) {
                // Logic for High Intensity (if applicable)
                const roll = rollDice(trap.diceCount || 1, trap.diceSides || 6, 'Slag Burn');
                burnDmg = roll.total + (trap.flatDamageBonus || 0);
                
                calcLog.baseDamage = burnDmg;
                calcLog.steps.push({ 
                    description: "Slag Roll", 
                    value: `${roll.rolls.join('+')} + ${trap.flatDamageBonus || 0}`, 
                    result: burnDmg 
                });
                
                addToLog(`${enemy.name} melts in the Slag Pool!`, "text-red-500 font-bold");
            } else {
                // Standard Magma
                const count = trap.diceCount || 1;
                const sides = trap.diceSides || 6;
                const roll = rollDice(count, sides, 'Magma Burn');
                burnDmg = roll.total;

                calcLog.baseDamage = burnDmg;
                calcLog.steps.push({ 
                    description: `Magma Roll (${count}d${sides})`, 
                    value: roll.rolls.join('+'), 
                    result: burnDmg 
                });

                addToLog(`${enemy.name} burns in the magma!`, "text-orange-500");
            }

            // Apply Damage
            const res = enemy.takeDamage(burnDmg, { element: 'fire', ignore_defense: true });
            
            // Finalize Log
            if(res.defenseSteps) calcLog.steps = calcLog.steps.concat(res.defenseSteps);
            calcLog.finalDamage = res.damageDealt;
            
            if(typeof logDamageCalculation === 'function') logDamageCalculation(calcLog);

        } else if (trap.subtype === 'sanctuary') {
            if (enemy.speciesData.class === 'Undead') {
                const holyDmg = Math.floor(enemy.maxHp * 0.10);
                const finalDmg = Math.max(1, holyDmg);
                enemy.takeDamage(finalDmg, { element: 'light', ignore_defense: true });
                addToLog(`${enemy.name} burns in the Holy Light!`, "text-yellow-300 font-bold");
            }
        }
        else if (trap.subtype === 'thorny_vine') {
            // 1. Deal 5% Max HP Damage (True Damage)
            const vineDmg = Math.max(1, Math.floor(enemy.maxHp * 0.05));
            enemy.takeDamage(vineDmg, { ignore_defense: true });
            addToLog(`${enemy.name} is pricked by the Thorny Vines!`, "text-green-400");

            // 2. Poison Chance (20%)
            if (Math.random() < 0.20) {
                // Boss Restriction (1% vs 5%)
                const poisonPercent = enemy.isBoss ? 0.01 : 0.05;
                const poisonDmg = Math.max(1, Math.floor(enemy.maxHp * poisonPercent));
                
                // Only apply if not already poisoned (or refresh it)
                applyStatusEffect(enemy, 'poison', { 
                    duration: 4, 
                    damage: poisonDmg,
                    source: 'Thorny Vine' 
                }, "Thorny Vine");
            }
        }
    }

    // --- 5. LINGERING MAGMA DoT ---
    if (enemy.statusEffects.lingering_magma) { 
        const effect = enemy.statusEffects.lingering_magma;
        let magDmg = rollDice(2, 4, 'Lingering Magma').total;
        const intBonus = effect.sourceMagicDamage || player.magicalDamageBonus;
        magDmg = Math.floor(magDmg * (1 + intBonus / 20));

        enemy.takeDamage(magDmg, { element: 'fire', isMagic: true });
        addToLog(`${enemy.name} burns from the lingering magma!`, "text-orange-500");
    }
    
    // --- 6. DECAYING POISON DAMAGE (Miasma of Decay) ---
    if (enemy.statusEffects.decaying_poison) {
        const effect = enemy.statusEffects.decaying_poison;
        
        // Boss Restriction: 1% per stack vs 5% per stack
        const basePercent = enemy.isBoss ? 0.01 : 0.05;
        const percentDmg = basePercent * effect.stacks;
        
        const decayDmg = Math.max(1, Math.floor(enemy.maxHp * percentDmg));
        
        enemy.hp -= decayDmg;
    
        // Symbiosis Logic
        let siphonLog = "";
            // [UPDATE] Added isElementalStateActive check
            if (player.isSkillActive('symbiosis_of_decay') && isElementalStateActive('nature')) {
                // FIXED: Used decayDmg instead of poisonDmg
                const heal = Math.floor(decayDmg * 0.5); 
            if (heal > 0) {
                player.hp = Math.min(player.maxHp, player.hp + heal);
                siphonLog = ` <span class="text-green-300 text-xs">(+${heal} HP)</span>`;
                updateStatsView();
            }
        }

        addToLog(`${enemy.name} rots from within! <span class="font-bold text-green-600">-${decayDmg}</span>${siphonLog}`, 'text-green-600');
    }

    // --- 7. GENERIC STATUS DURATION & STANDARD DoT ---
    const effects = enemy.statusEffects;
    for (const effectKey in effects) {
        if (effects[effectKey].duration && effects[effectKey].duration !== Infinity) {
            effects[effectKey].duration--;
            if (effects[effectKey].duration <= 0) {
                delete effects[effectKey];
                continue; 
            }
        }

        if (effectKey === 'poison' && effects[effectKey]) {
            // Check Boss Status for percentage
            const poisonPercent = enemy.isBoss ? 0.01 : 0.05;
            
            const poisonDmg = effects[effectKey].damage || Math.floor(enemy.maxHp * poisonPercent); 
            enemy.hp -= poisonDmg;
            
            // [NEW] Symbiosis Logic
            let siphonLog = "";
            if (player.isSkillActive('symbiosis_of_decay')) {
                const heal = Math.floor(poisonDmg * 0.5);
                if (heal > 0) {
                    player.hp = Math.min(player.maxHp, player.hp + heal);
                    siphonLog = ` <span class="text-green-300 text-xs">(+${heal} HP)</span>`;
                    updateStatsView();
                }
            }

            addToLog(`${enemy.name} takes <span class="font-bold text-green-600">${poisonDmg}</span> poison damage.${siphonLog}`, 'text-green-600');
        }
        
        // Toxic
        if (effectKey === 'toxic' && effects[effectKey]) {
            // Check Boss Status for percentage
            const toxicPercent = enemy.isBoss ? 0.02 : 0.10;

            const toxicDmg = effects[effectKey].damage || Math.floor(enemy.maxHp * toxicPercent); 
            enemy.hp -= toxicDmg;

            // [NEW] Symbiosis Logic
            let siphonLog = "";
            if (player.isSkillActive('symbiosis_of_decay')) {
                const heal = Math.floor(toxicDmg * 0.5);
                if (heal > 0) {
                    player.hp = Math.min(player.maxHp, player.hp + heal);
                    siphonLog = ` <span class="text-green-300 text-xs">(+${heal} HP)</span>`;
                    updateStatsView();
                }
            }

            addToLog(`${enemy.name} takes <span class="font-bold text-green-800">${toxicDmg}</span> damage from the toxin!${siphonLog}`, 'text-green-800');
        }
    }
}

async function enemyTurn() {
    if (gameState.battleEnded) return;

    $('#inventory-btn').disabled = true;
    $('#character-sheet-btn').disabled = true;

    const enemiesToAct = [...currentEnemies];

    for (const enemy of enemiesToAct) {
        // Skip if enemy died during previous iterations
        if (!currentEnemies.includes(enemy)) continue;

        if (enemy.isAlive() && !gameState.battleEnded) {
            // --- STATUS CHECKS ---
            let canAct = true;
            if (enemy.statusEffects.frozen) {
                addToLog(`${enemy.name} is frozen solid and cannot move!`, 'text-cyan-400');
                canAct = false;
            } else if (enemy.statusEffects.paralyzed || enemy.statusEffects.petrified || enemy.statusEffects.tripped || enemy.statusEffects.stunned) {
                addToLog(`${enemy.name} cannot act!`, 'text-yellow-500');
                canAct = false;
            }

            // --- EXECUTE ACTION ---
            if (canAct) {
                if (player.statusEffects.swallowed && player.statusEffects.swallowed.source === enemy) {
                    addToLog(`${enemy.name} is busy... digesting.`, 'text-red-600');
                    enemy._performAttack(player);
                } else {
                    await enemy.attack(player);
                }
            }

            // [FIX] Revival Check Inside Loop
            if (!player.isAlive()) {
                await checkPlayerDeath(); // Attempt revival
                
                // If STILL dead, stop everything.
                if (!player.isAlive()) return;
                
                // If revived, loop continues!
            }

            // End of Enemy Action processing
            if (!gameState.battleEnded) {
                checkBattleStatus(true);
                if (gameState.battleEnded) return;
            }
            
            handleEnemyEndOfTurn(enemy);

            // Double Check after End of Turn Effects (e.g. poison)
            if (!player.isAlive()) {
                await checkPlayerDeath();
                if (!player.isAlive()) return;
            }
            
            // Delay between enemies
            if (!gameState.battleEnded) {
                const turnDelay = Math.max(50, 150 - (currentEnemies.length * 30));
                await new Promise(resolve => setTimeout(resolve, turnDelay));
            }
        }
    }

    // Pass turn back to player
    if (!gameState.battleEnded) {
        player.tilesMovedLastTurn = player.tilesMovedThisTurn;
        player.tilesMovedThisTurn = 0;
        gameState.bladeWaltzTriggered = false;
        
        // Reset Cooldowns/Flags
        if (player.statusEffects.buff_swiftness?.turnUsed) player.statusEffects.buff_swiftness.turnUsed = false;
        if (player.statusEffects.buff_haste?.turnUsed) player.statusEffects.buff_haste.turnUsed = false;
        if (player.statusEffects.buff_hermes?.turnUsed) player.statusEffects.buff_hermes.turnUsed = false;
        
        if (player.npcAlly) {
             if (player.npcAlly.statusEffects.buff_haste?.turnUsed) player.npcAlly.statusEffects.buff_haste.turnUsed = false;
             if (player.npcAlly.statusEffects.buff_hermes?.turnUsed) player.npcAlly.statusEffects.buff_hermes.turnUsed = false;
        }

        beginPlayerTurn();
    }
}


async function startNpcTurn() {
    if (gameState.battleEnded || !player.npcAlly || player.npcAlly.hp <= 0 || player.npcAlly.isFled) {
        // Ally is dead/fled/missing, proceed to player drone turn
        droneTurn(gameState.activeDrone, 'enemyTurn'); // Pass 'enemyTurn' as next turn
        return;
    }

    const ally = player.npcAlly;
    let actionTaken = false; 
    
    addToLog(`Your ally ${ally.name}'s turn!`, 'text-blue-300');

    // --- 0. Pre-Action Checks ---
    // A. Paralysis/Petrification
    if (ally.statusEffects.paralyzed || ally.statusEffects.petrified) {
        const status = ally.statusEffects.paralyzed ? 'paralyzed' : 'petrified';
        addToLog(`${ally.name} is ${status} and cannot act!`, 'text-yellow-500');
        actionTaken = true; 
    }
    
    // B. Toggle Management (Deactivate if low MP)
    if (!actionTaken && ally.signatureAbilityToggleActive && ally.signatureAbilityData.type === 'toggle') {
        if (ally.mp < ally.mpToggleThreshold) {
            ally.signatureAbilityToggleActive = false;
            ally.activeModeIndex = -1; 
            addToLog(`${ally.name} is low on MP and deactivates ${ally.signatureAbilityData.name}.`, 'text-blue-400');
        }
    }

    // C. Health Threshold Dialogue Check (Do this *before* healing)
    if (!actionTaken) {
        const hpPercent = ally.hp / ally.maxHp;
        if (hpPercent <= 0.10 && !ally._10PercentLogged) {
            const dialogue = ally._getDialogue('HP_10', player.name);
            addToLog(`(${ally.name}) CRITICAL HEALTH WARNING!<br>"${dialogue}"`, 'text-red-500');
            ally._10PercentLogged = true;
            ally._50PercentLogged = true;
        } else if (hpPercent <= 0.50 && !ally._50PercentLogged) {
            const dialogue = ally._getDialogue('HP_50', player.name);
            addToLog(`(${ally.name}) HEALTH ALERT!<br>"${dialogue}"`, 'text-yellow-400');
            ally._50PercentLogged = true;
        } else if (hpPercent > 0.50) {
            ally._10PercentLogged = false;
            ally._50PercentLogged = false;
        }
    }

    // --- 1. Signature Ability (Priority 1: Once-per-Encounter) ---
    if (!actionTaken && ally.signatureAbilityData && ally.signatureAbilityData.type === 'signature' && !ally.signatureAbilityUsed) {
        const ability = ally.signatureAbilityData;
        const cost = ability.cost || 0;
        
        // This block contains the same logic as your original function for Cleric, Ranger, and Cook.
        // It's left concise here but assumes the detailed logic is correct in engine.js helpers.
        
        if (ally._classKey === 'cleric' || ally._classKey === 'ranger' || ally._classKey === 'cook') {
            // Cleric/Ranger/Cook logic handles cost and ability use internally/via helpers.
            // If any of these are triggered, they set actionTaken = true;
            
            // This is a complex logic block requiring external helpers. We assume the ability helpers 
            // inside engine.js now handle the conditions and returns a boolean upon success.
            const success = await _tryNpcSignatureAbility(ally);
            if (success) actionTaken = true;
        }
    }

    // --- 2. Healing/Item Logic (Priority 2: Survival) ---
    const lostHp = ally.maxHp - ally.hp;
    const lostMp = ally.maxMp - ally.mp;
    const healThreshold = ally.maxHp * 0.5; // Threshold to consider healing

    if (!actionTaken && lostHp > ally.maxHp * 0.25) { // If missing 25% HP
        
        // Try Potion First (Hardcoded pot priority for now)
        let potionToUse = null;
        if (lostHp >= 100 && (ally.inventory.items['superior_health_potion'] || 0) > 0) {
             potionToUse = 'superior_health_potion';
        } else if (lostHp >= 50 && (ally.inventory.items['condensed_health_potion'] || 0) > 0) {
            potionToUse = 'condensed_health_potion';
        } else if ((ally.inventory.items['health_potion'] || 0) > 0) {
            potionToUse = 'health_potion';
        }

        if (potionToUse) {
            ally.useItem(potionToUse); // useItem logs ON_HEAL
            actionTaken = true;
        } else {
            // Try Healing Spell (if available and mana allows)
            const healingSpellKey = findBestHealingSpell(ally);
            if (healingSpellKey) {
                 const spellCost = SPELLS[healingSpellKey].tiers[ally.spells[healingSpellKey].tier - 1].cost;
                 const allyHpMissing = ally.maxHp - ally.hp;
                 const playerHpMissing = player.maxHp - player.hp;
                 
                 // If ally or player needs significant healing AND ally has mana
                 if (ally.mp >= spellCost && (allyHpMissing > healThreshold || playerHpMissing > healThreshold)) {
                    await ally.castSpell(healingSpellKey, allyHpMissing > playerHpMissing ? ally : player);
                    logAllyDialogueChance(ally, 'ON_HEAL');
                    actionTaken = true;
                 }
            }
        }
    }

    const needsMana = ally.mp < ally.mpToggleThreshold || (ally.maxMp - ally.mp) >= 50;

    if (!actionTaken && needsMana) {
        let manaPotionToUse = null;
        
        // Find the best potion they *have*
        if ((ally.inventory.items['superior_mana_potion'] || 0) > 0) {
            manaPotionToUse = 'superior_mana_potion';
        } else if ((ally.inventory.items['condensed_mana_potion'] || 0) > 0) {
            manaPotionToUse = 'condensed_mana_potion';
        } else if ((ally.inventory.items['mana_potion'] || 0) > 0) {
            manaPotionToUse = 'mana_potion';
        }
        
        if (manaPotionToUse) {
            ally.useItem(manaPotionToUse); // This will log and update UI
            logAllyDialogueChance(ally, 'ON_HEAL'); // Use the same dialogue type
            actionTaken = true;
        }
    }

    
    // --- 3. Combat Logic (Prioritized by Role) ---
    if (!actionTaken) {
        let target = null;
        let minDistance = Infinity;

        // Target acquisition logic remains: Marked > Closest
        if (ally.npcAllyMarkedTarget && ally.npcAllyMarkedTarget.isAlive()) {
            target = ally.npcAllyMarkedTarget;
        } else {
            currentEnemies.forEach(enemy => {
                if (enemy.isAlive()) {
                    const distance = Math.abs(ally.x - enemy.x) + Math.abs(ally.y - enemy.y);
                    if (distance < minDistance) {
                        minDistance = distance;
                        target = enemy;
                    }
                }
            });
        }
        
        if (target) {
            const distance = Math.abs(ally.x - target.x) + Math.abs(ally.y - target.y);
            const hasWeapon = ally.equippedWeapon.name !== WEAPONS['fists'].name;
            const hasCatalyst = ally.equippedCatalyst.name !== CATALYSTS['no_catalyst'].name;
            const weaponRange = ally.equippedWeapon.range || 1;
            const catalystRange = ally.equippedCatalyst.range || 3;
            const isMartial = MARTIAL_CLASSES.includes(ally._classKey);

            let bestSpell = null;
            let canCastSpell = false;
            let actionType = 'move';
            
            // Check viability of spellcasting first
            if (hasCatalyst) {
                bestSpell = findBestSpell(ally, target);
                if (bestSpell) {
                    const spellCost = SPELLS[bestSpell].tiers[ally.spells[bestSpell].tier - 1].cost;
                    if (ally.mp >= spellCost) canCastSpell = distance <= catalystRange;
                }
            }

            // --- PRIORITY LOGIC ---
            // 1. Martial: Weapon (if owned/in range) > Spell (if possible) > Fists > Move
            // 2. Magic: Spell (if possible/in range) > Weapon (if owned/in range) > Fists > Move
            
            const attemptMelee = (distance <= weaponRange);
            const attemptMagic = canCastSpell && (distance <= catalystRange);

            if (isMartial) {
                if (attemptMelee) actionType = 'attack';
                else if (attemptMagic) actionType = 'spell';
                else actionType = 'move';
            } else { // Magic or Cook/Artificer
                if (attemptMagic) actionType = 'spell';
                else if (attemptMelee) actionType = 'attack';
                else actionType = 'move';
            }
            
            // --- EXECUTE ACTION ---
            switch (actionType) {
                case 'spell':
                    // Magus Mode Update (Only if casting spell)
                    if (ally._classKey === 'magus' && ally.signatureAbilityToggleActive) {
                        const spellData = SPELLS[bestSpell];
                        if (spellData.type === 'st') { ally.activeModeIndex = 0; }
                        else if (spellData.type === 'aoe') { ally.activeModeIndex = 1; }
                    }
                    await ally.castSpell(bestSpell, target);
                    logAllyDialogueChance(ally, 'ON_CAST');
                    actionTaken = true;
                    break;

                case 'attack':
                    await ally.attack(target);
                    logAllyDialogueChance(ally, 'ON_ATTACK');
                    actionTaken = true;
                    break;

                case 'move':
                default:
                    // Only move if currently out of effective range
                    const bestRange = Math.max(weaponRange, canCastSpell ? catalystRange : 0);
                    if (distance > bestRange) {
                        addToLog(`${ally.name} moves towards ${target.name}.`);
                        await ally.moveTowards(target);
                        actionTaken = true;
                    } else {
                        addToLog(`${ally.name} is optimally positioned but cannot perform a primary action this turn.`);
                        actionTaken = true; 
                    }
                    break;
            }

        } else {
            addToLog(`${ally.name} has no targets.`);
            actionTaken = true; 
        }
    }
    
    // --- 4. Finalization ---
    // Check if ally's action ended the battle
    if (!gameState.battleEnded) {
        checkBattleStatus(true); // isReaction = true
    }
    if (gameState.battleEnded) return;

    // Proceed to finalize ally turn
    if (!gameState.battleEnded) {
        // Ally's end-of-turn effects run in finalizeNpcTurn.
        setTimeout(finalizeNpcTurn, 200);
    }
}


// --- NEW HELPER FUNCTION ---
/**
 * Finds the best offensive spell for an ally to use.
 * @param {NpcAlly} ally - The ally casting the spell.
 * @param {Enemy} target - The enemy being targeted.
 * @returns {string|null} The key of the best spell, or null if none.
 */
function findBestSpell(ally, target) {
    let bestSpell = null;
    let maxScore = 0; // 3 = Super effective, 2 = ST, 1 = Basic
    
    for (const spellKey in ally.spells) {
        const spellData = SPELLS[spellKey];
        // --- THIS IS THE FIX ---
        // Skip non-offensive spells AND HEALING SPELLS
        if (!spellData || spellData.element === 'healing' || spellData.type === 'support') {
            continue; 
        }
        
        const spellElement = spellData.element;
        const targetElement = target.element;
        let score = 1; // Base score for any offensive spell
        
        if (spellData.type === 'st') {
            score = 2; // Prefer single-target spells for AI
        }
        
        // Check for super-effective
        if (spellElement !== 'none' && targetElement !== 'none') {
            const modifier = calculateElementalModifier(spellElement, targetElement);
            if (modifier > 1) {
                score = 3; // Highest priority
            } else if (modifier < 1) {
                score = 0; // Avoid "not effective"
            }
        }
        
        if (score > maxScore) {
            // Check if ally can afford it
            const spellTier = ally.spells[spellKey].tier;
            const spellCost = spellData.tiers[spellTier - 1].cost;
            if (ally.mp >= spellCost) {
                maxScore = score;
                bestSpell = spellKey;
            }
        }
    }
    return bestSpell;
}
    
function findBestHealingSpell(ally) {
    let bestHeal = null;
    let maxTier = 0;

    for (const spellKey in ally.spells) {
        const spellData = SPELLS[spellKey];
        // Check if the spell exists and is a healing spell
        if (spellData && spellData.element === 'healing') {
            const spellTier = ally.spells[spellKey].tier;
            // Find the highest tier healing spell they know
            if (spellTier > maxTier) {
                maxTier = spellTier;
                bestHeal = spellKey;
            }
        }
    }
    return bestHeal;
}

async function _npcUseClericAbility(ally, ability) {
    ally.mp -= ability.cost;
    ally.signatureAbilityUsed = true;
    updateStatsView(); // Update player UI if ally is player (shouldn't be, but good practice)
    
    addToLog(`${ally.name} invokes ${ability.name}!`, 'text-yellow-300 font-bold');

    // Calculate healing dice (scales with level, caps at 7)
    const healAmount = ally._calculateClericHealAvg(); // Use the helper we already built
    
    // Heal Ally
    ally.hp = Math.min(ally.maxHp, ally.hp + healAmount);
    addToLog(`Divine light washes over ${ally.name}, restoring <span class="font-bold text-green-400">${healAmount}</span> HP!`, 'text-yellow-200');
    
    // Heal Player
    player.hp = Math.min(player.maxHp, player.hp + healAmount);
    addToLog(`Divine light washes over you, restoring <span class="font-bold text-green-400">${healAmount}</span> HP!`, 'text-yellow-200');

    // Cleanse debuffs for Ally
    const allyDebuffs = Object.keys(ally.statusEffects).filter(key => ['poison', 'paralyzed', 'petrified', 'drenched', 'toxic', 'slowed', 'inaccurate', 'clumsy', 'fumble', 'magic_dampen', 'elemental_vuln'].includes(key));
    if (allyDebuffs.length > 0) {
        allyDebuffs.forEach(key => delete ally.statusEffects[key]);
        addToLog(`The holy energy purges ${ally.name}'s ailments!`, 'text-cyan-300');
    }
    
    // Cleanse debuffs for Player
    const playerDebuffs = Object.keys(player.statusEffects).filter(key => ['poison', 'paralyzed', 'petrified', 'drenched', 'toxic', 'slowed', 'inaccurate', 'clumsy', 'fumble', 'magic_dampen', 'elemental_vuln'].includes(key));
    if (playerDebuffs.length > 0) {
        playerDebuffs.forEach(key => delete player.statusEffects[key]);
        addToLog(`The holy energy purges your ailments!`, 'text-cyan-300');
    }
    
    updateStatsView();
    renderBattleGrid();
}

function _npcCanCook(ally, recipe) {
    const required = recipe.ingredients;
    const availableIngredients = { meat: [], veggie: [], seasoning: [] };
    const specificInventory = { ...ally.inventory.items }; // Use ally's inventory

    // 1. Populate ally's available generic ingredients, sorted by price (cheapest first)
    Object.keys(specificInventory).forEach(itemKey => {
        const details = getItemDetails(itemKey);
        if (details && details.cookingType) {
            const count = specificInventory[itemKey];
            if (count > 0) {
                for (let i = 0; i < count; i++) {
                    availableIngredients[details.cookingType].push({ key: itemKey, price: details.price, rarity: details.rarity || 'Common' });
                }
            }
        }
    });
    for(const type in availableIngredients) {
        availableIngredients[type].sort((a,b) => a.price - b.price);
    }

    const ingredientsToConsume = {};
    let mpCost = 0;
    const mpCosts = { 'Common': 5, 'Uncommon': 10, 'Rare': 15, 'Epic': 20, 'Legendary': 25, 'Broken': 0 };

    // 2. Check requirements and calculate MP cost
    for (const reqKey in required) {
        const requiredAmount = required[reqKey];
        let itemsUsedCount = 0;
        const isGeneric = ['meat', 'veggie', 'seasoning'].includes(reqKey);

        if (isGeneric) {
            const availableCount = availableIngredients[reqKey].length;
            itemsUsedCount = Math.min(availableCount, requiredAmount);

            for(let i = 0; i < itemsUsedCount; i++) {
                const itemToUse = availableIngredients[reqKey][i].key;
                ingredientsToConsume[itemToUse] = (ingredientsToConsume[itemToUse] || 0) + 1;
            }

            const missingAmount = requiredAmount - itemsUsedCount;
            if (missingAmount > 0) {
                 mpCost += missingAmount * mpCosts['Common'];
            }
        } else { // Specific ingredient
            const currentAmount = specificInventory[reqKey] || 0;
            itemsUsedCount = Math.min(currentAmount, requiredAmount);

            if (itemsUsedCount > 0) {
                 ingredientsToConsume[reqKey] = (ingredientsToConsume[reqKey] || 0) + itemsUsedCount;
            }
            const missingAmount = requiredAmount - itemsUsedCount;
            if (missingAmount > 0) {
                const details = getItemDetails(reqKey);
                const rarityCost = mpCosts[details?.rarity || 'Common'] || mpCosts['Common'];
                mpCost += missingAmount * rarityCost;
            }
        }
    }

    // 3. Return the result
    return {
        canCook: true, // It's always "possible" if they have the MP
        mpCost: mpCost,
        ingredientsToConsume: ingredientsToConsume
    };
}

async function _npcUseCookAbility(ally, recipeKey, mpCost, ingredientsToConsume) {
    const recipe = COOKING_RECIPES[recipeKey];
    if (!recipe) return;
    
    // --- Consume Resources ---
    ally.mp -= mpCost;
    if (mpCost > 0) addToLog(`${ally.name} substituted missing ingredients for ${mpCost} MP.`, 'text-blue-300');

    for (const itemKey in ingredientsToConsume) {
        if (ally.inventory.items[itemKey]) { // Check if item exists
            ally.inventory.items[itemKey] -= ingredientsToConsume[itemKey];
            if (ally.inventory.items[itemKey] <= 0) {
                delete ally.inventory.items[itemKey];
            }
        }
    }
    
    // --- Apply Buffs to Ally AND Player ---
    ally.foodBuffs = {}; // Clear old buffs
    if (player) player.clearFoodBuffs(); // Clear player's old buffs
    
    const effect = recipe.effect;
    
    if (effect.heal) {
        ally.hp = Math.min(ally.maxHp, ally.hp + effect.heal);
        if (player) player.hp = Math.min(player.maxHp, player.hp + effect.heal);
    }
    
    switch (effect.type) {
        case 'full_restore':
            ally.hp = ally.maxHp; ally.mp = ally.maxMp;
            if (player) { player.hp = player.maxHp; player.mp = player.maxMp; }
            break;
        case 'heal_percent': // Added this case
             ally.hp = Math.min(ally.maxHp, ally.hp + Math.floor(ally.maxHp * effect.heal_percent));
             if (player) player.hp = Math.min(player.maxHp, player.hp + Math.floor(player.maxHp * effect.heal_percent));
            break;
        case 'mana_percent': // Added this case
             ally.mp = Math.min(ally.maxMp, ally.mp + Math.floor(ally.maxMp * effect.mana_percent));
             if (player) player.mp = Math.min(player.maxMp, player.mp + Math.floor(player.maxMp * effect.mana_percent));
            break;
        case 'buff':
            effect.buffs.forEach(buff => {
                const buffData = { value: buff.value, duration: 4 }; // 3 encounters
                ally.foodBuffs[buff.stat] = buffData;
                if (player) player.foodBuffs[buff.stat] = buffData;
            });
            // Re-apply Max HP/MP buffs
            ally.hp = Math.min(ally.hp, ally.maxHp);
            ally.mp = Math.min(ally.mp, ally.maxMp);
            if (player) {
                player.hp = Math.min(player.hp, player.maxHp);
                player.mp = Math.min(player.mp, player.maxMp);
            }
            break;
    }
    
    addToLog(`${ally.name} quickly cooked and ate ${recipe.name}!`, "text-green-400 font-bold");
    if (player) {
        addToLog(`You share in the meal!`, "text-green-300");
        updateStatsView(); // Update player UI
    }
    renderBattleGrid(); // Update ally HP/MP bars
}

// --- END NEW HELPERS ---

// --- New Function: finalizeNpcTurn ---
function finalizeNpcTurn() {
    if (gameState.battleEnded || !player.npcAlly) {
        // Ally not present/battle over, verify NPC drone then go to Enemy
        if (gameState.npcActiveDrone && gameState.npcActiveDrone.isAlive()) {
            setTimeout(() => droneTurn(gameState.npcActiveDrone, 'enemyTurn'), 100);
        } else {
            setTimeout(enemyTurn, 100); 
        }
        return;
    }
    
    const ally = player.npcAlly;
    updateTotemAuras(ally);
    
    // Safety check if ally died during their own action (e.g. recoil)
    if (ally.hp <= 0 || ally.isFled) {
        if (gameState.npcActiveDrone && gameState.npcActiveDrone.isAlive()) {
            setTimeout(() => droneTurn(gameState.npcActiveDrone, 'enemyTurn'), 100);
        } else {
            setTimeout(enemyTurn, 100);
        }
        return;
    }

    // --- 1. SANCTUARY OF ZENITH CHECK ---
    const sanctuary = gameState.gridObjects.find(o => o.x === ally.x && o.y === ally.y && o.subtype === 'sanctuary');
    if (sanctuary) {
        // Heal 5%
        const heal = Math.floor(ally.maxHp * 0.05);
        if (heal > 0 && ally.hp < ally.maxHp) {
            ally.hp = Math.min(ally.maxHp, ally.hp + heal);
            addToLog(`Sanctuary restores ${ally.name} for <span class="font-bold text-green-300">${heal}</span> HP.`, "text-yellow-200");
        }
        
        // Cleanse Debuffs
        let cleansed = false;
        // CLEANSABLE_DEBUFFS must be defined globally in battle.js
        CLEANSABLE_DEBUFFS.forEach(d => {
            if(ally.statusEffects[d]) { 
                delete ally.statusEffects[d]; 
                cleansed = true; 
            }
        });
        if(cleansed) addToLog(`Sanctuary purifies ${ally.name}!`, "text-yellow-200");
    }

    // --- 2. PASSIVE REGENERATION ---

    // Aasimar Racial
    if (ally.race === 'Aasimar') {
        const healPercent = (ally.level >= 20) ? 0.05 : 0.02;
        const healAmount = Math.floor(ally.maxHp * healPercent);
        if (ally.hp < ally.maxHp && healAmount > 0) {
            ally.hp = Math.min(ally.maxHp, ally.hp + healAmount);
            addToLog(`${ally.name}'s divine nature regenerates <span class="font-bold text-green-300">${healAmount}</span> HP.`, 'text-yellow-200');
        }
    }

    // Gear Regen
    const gearHpRegen = (ally.equippedWeapon.effect?.hp_regen_percent || 0) + 
                        (ally.equippedShield.effect?.hp_regen_percent || 0) + 
                        (ally.equippedArmor.effect?.hp_regen_percent || 0) + 
                        (ally.equippedCatalyst.effect?.hp_regen_percent || 0);
    
    const gearMpRegen = (ally.equippedWeapon.effect?.mp_regen_percent || 0) + 
                        (ally.equippedShield.effect?.mp_regen_percent || 0) + 
                        (ally.equippedArmor.effect?.mp_regen_percent || 0) + 
                        (ally.equippedCatalyst.effect?.mp_regen_percent || 0);

    if (gearHpRegen > 0 && ally.hp < ally.maxHp) {
         const healAmount = Math.floor(ally.maxHp * gearHpRegen);
         if (healAmount > 0) {
            ally.hp = Math.min(ally.maxHp, ally.hp + healAmount);
            addToLog(`${ally.name}'s gear regenerates <span class="font-bold text-green-400">${healAmount}</span> HP.`, 'text-yellow-300');
         }
    }
    if (gearMpRegen > 0 && ally.mp < ally.maxMp) {
         const regenAmount = Math.floor(ally.maxMp * gearMpRegen);
         if (regenAmount > 0) {
            ally.mp = Math.min(ally.maxMp, ally.mp + regenAmount);
            addToLog(`${ally.name}'s gear restores <span class="font-bold text-blue-400">${regenAmount}</span> MP.`, 'text-blue-300');
         }
    }   

    // --- 3. STATUS EFFECTS (Duration & DoT) ---
    const effects = ally.statusEffects;
    for (const effectKey in effects) {
        // Duration Decrement
        if (effects[effectKey].duration && effects[effectKey].duration !== Infinity) {
            effects[effectKey].duration--;
            if (effects[effectKey].duration <= 0) {
                delete effects[effectKey];
                const effectName = effectKey.replace(/buff_|debuff_/g, '').replace(/_/g, ' ');
                addToLog(`${ally.name}'s ${effectName} has worn off.`);
                continue;
            }
        }
        
        // Damage over Time
        if (effectKey === 'poison') {
            const poisonDmg = Math.floor(ally.maxHp * 0.05);
            ally.hp -= poisonDmg;
            addToLog(`${ally.name} takes <span class="font-bold text-green-600">${poisonDmg}</span> poison damage.`, 'text-green-600');
        }
        else if (effectKey === 'toxic') {
            const toxicDmg = Math.floor(ally.maxHp * 0.1);
            ally.hp -= toxicDmg;
            addToLog(`The toxin deals <span class="font-bold text-green-800">${toxicDmg}</span> damage to ${ally.name}!`, 'text-green-800');
        }
    }

    renderBattleGrid(); // Refresh UI bars

    // --- 4. DEATH/FLEE CHECK ---
    if (ally.hp <= 0 && !ally.isFled) {
        // --- SEAL CHECK ---
        const sealIndex = gameState.gridObjects.findIndex(o => o.x === ally.x && o.y === ally.y && o.subtype === 'god_seal');
        if (sealIndex > -1) {
            ally.hp = 1;
            gameState.gridObjects.splice(sealIndex, 1);
            addToLog(`The Divine Seal shatters, saving ${ally.name}!`, "text-cyan-300 font-bold");
            renderBattleGrid();
            // Do not return here, let the turn transition happen
        } else {
            ally.isFled = true;
            addToLog(`<span class="font-bold text-red-500">${ally.name} has succumbed to their wounds and fled!</span>`, "text-red-500");
        }
    }

    // Check if battle ended (unlikely from ally DoT, but possible if it triggered something)
    if (!gameState.battleEnded) {
        checkBattleStatus(true); 
        if (gameState.battleEnded) return; 
    }

    // --- 5. TRANSITION TO NEXT TURN ---
    if (gameState.npcActiveDrone && gameState.npcActiveDrone.isAlive()) {
        setTimeout(() => droneTurn(gameState.npcActiveDrone, 'enemyTurn'), 100);
    } else {
        setTimeout(enemyTurn, 100);
    }
}

async function beginPlayerTurn() { 
    // [INJECTED] RESONANT PALM (Charge Release)
    if (player.statusEffects.charging_resonant_palm) {
        const chargeData = player.statusEffects.charging_resonant_palm;
        const target = chargeData.target; 

        delete player.statusEffects.charging_resonant_palm; 
        updateStatsView();

        if (target && target.isAlive()) {
            addToLog("Resonant Palm unleashed!", "text-cyan-300 font-bold text-lg");
            
            // [INJECTED] AERO-VAJRA PIERCE
            const isUnarmored = !player.equippedArmor || player.equippedArmor.name === "Traveler's Garb";
            if (player.skillToggles['vacuum_fist'] && player.isSkillActive('way_of_empty_hand') && isUnarmored) {
                 // Simple Pierce Logic (Inline)
                 const dx = Math.sign(target.x - player.x);
                 const dy = Math.sign(target.y - player.y);
                 let cx = player.x + dx;
                 let cy = player.y + dy;
                 while (cx !== target.x || cy !== target.y) {
                    const collateral = currentEnemies.find(e => e.x === cx && e.y === cy && e.isAlive());
                    if (collateral) {
                        collateral.takeDamage(Math.floor(player.getPhysicalAttack() * 1.25), { element: 'wind', isMagic: true }, player);
                        addToLog(`Aero-Vajra pierces ${collateral.name}!`, "text-purple-300 text-xs");
                    }
                    cx += dx; cy += dy;
                    if (Math.abs(cx - player.x) > 10) break;
                 }
            }

            player.tempAttackMods = { multiplier: 2.5, ignore_defense: 0.50 };
            await performPlayerAttack(target, { preventFollowUp: true });
            delete player.tempAttackMods;

            // [INJECTED] SHATTERPOINT
            if (player.isSkillActive('shatterpoint_impact') && player.rollForEffect(0.15, "Shatterpoint")) {
                 applyStatusEffect(target, 'paralyzed', { duration: 1 }, player.name);
            }
        }
        else {
            addToLog("Your built-up ki dissipates... (Target lost)", "text-gray-400");
        }

        gameState.isPlayerTurn = false;
        finalizePlayerAction();
        return;
    }
    // [INJECTED] MOMENTUM FIX: Reset movement counters
    // Save history just in case, then reset current turn tracker
    player.tilesMovedLastTurn = player.tilesMovedThisTurn || 0;
    player.tilesMovedThisTurn = 0;

    player.hasMovedThisTurn = false;
    player.hasAttackedThisTurn = false; // <--- ADD THIS INIT
    await processTornadoActions();
    await processInsatiableVoidStart();
    
    gameState.action = null;
    gameState.spellToCast = null;
    gameState.itemToUse = null;
    gameState.comboTarget = null;
    gameState.comboCount = 0;
    gameState.pendingTarget = null;

    currentEnemies.forEach(e => e.hasShatteredThisTurn = false);

    if (gameState.battleEnded) return;
    

    if (player.statusEffects.preparing_feast) {
        addToLog("You are preparing the feast...", "text-yellow-300");
        gameState.isPlayerTurn = false;
        setTimeout(finalizePlayerAction, 500); 
        return;
    }

    // --- 2. DRYAD'S EMBRACE (Turn Start Ring) ---
    if (player.isSkillActive('dryads_embrace') && isElementalStateActive('nature')) {
        let vinesSpawned = false;
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) continue; 
                if (typeof spawnThornyVine === 'function') {
                    spawnThornyVine(player.x + dx, player.y + dy, 2);
                    vinesSpawned = true;
                }
            }
        }
        if (vinesSpawned) {
            addToLog("Nature responds to your presence!", "text-green-300");
        }
    }

    // --- 3. CONDUIT OF THE STORM (Lightning Stance) ---
    await processConduitOfStorm();


    // --- 4. MANAGE GRID OBJECTS / TRAPS / HAZARDS ---
    if (gameState.gridObjects) {
        for (let i = gameState.gridObjects.length - 1; i >= 0; i--) {
            const obj = gameState.gridObjects[i];
            
            if ((obj.type === 'trap' || obj.type === 'totem' || obj.type === 'hazard') && obj.duration > 0 && obj.duration !== Infinity) {
                obj.duration--;
                
                // Bubble Trap Expiration
                if (obj.subtype === 'sudsy_minefield') {
                    if (obj.duration <= 0) {
                        addToLog("A Sudsy Minefield pops harmlessly.", "text-blue-200");
                        gameState.gridObjects.splice(i, 1);
                        continue;
                    }
                }            

                if (obj.type === 'minion' && obj.duration <= 0) {
                    addToLog(`The ${obj.name} fades into ash.`, "text-gray-400");
                    gameState.gridObjects.splice(i, 1);
                    continue;
                }

                if (obj.type === 'portal' && obj.duration <= 0) {
                    addToLog("The Rift collapses violently!", "text-purple-500 font-bold");
                    
                    // Check for entities at this specific portal's location
                    const targets = [player, player.npcAlly, ...currentEnemies].filter(e => e && e.isAlive() && e.x === obj.x && e.y === obj.y);
                    
                    targets.forEach(t => {
                        const dmg = Math.floor(t.maxHp * 0.25);
                        t.takeDamage(dmg, { element: 'void', ignore_defense: true });
                        addToLog(`${t.name} is crushed by the collapse! (-${dmg})`, "text-red-400");
                    });
                    
                    gameState.gridObjects.splice(i, 1);
                    continue;
                }   
                
                // Pillar of Fire Eruption
                if (obj.subtype === 'unstable_fire' && obj.duration <= 0) {
                    addToLog("The Unstable Fire erupts into a Pillar of Flame!", "text-red-500 font-bold");
                    const enemy = currentEnemies.find(e => e.x === obj.x && e.y === obj.y && e.isAlive());
                    if (enemy) {
                        const dmg = obj.damageSnapshot || 10;
                        enemy.takeDamage(dmg, { element: 'fire', isMagic: true }, player);
                        addToLog(`${enemy.name} is engulfed by the pillar!`, "text-orange-400");
                    }
                    gameState.gridObjects.splice(i, 1);
                    continue; 
                }

                // --- PYROCLASTIC GEODE EXPLOSION (Updated) ---
                if (obj.subtype === 'pyroclastic_geode' && obj.duration <= 0) {
                    addToLog("The Volatile Geode erupts!", "text-red-500 font-bold text-lg");

                    if (obj.shouldRespawn) {
                        // Create a "Echo" geode that explodes next turn
                        gameState.gridObjects.push({
                            type: 'trap',
                            subtype: 'pyroclastic_geode',
                            x: obj.x,
                            y: obj.y,
                            emoji: '💥',
                            name: 'Volatile Geode (Echo)',
                            duration: 1, 
                            source: obj.source,
                            storedDice: obj.storedDice, // Keep same damage potential
                            shouldRespawn: false // Only explodes twice, not forever
                        });
                        addToLog("The magma refuses to cool! The Geode reforms!", "text-yellow-300 font-bold");
                    }
                    
                    // 1. Identify 3x3 Area
                    const area = [];
                    for(let dx=-1; dx<=1; dx++) {
                        for(let dy=-1; dy<=1; dy++) {
                            area.push({x: obj.x + dx, y: obj.y + dy});
                        }
                    }

                    // 2. Roll Damage: (Stored Dice)d8
                    const diceCount = obj.storedDice || 1; 
                    const explosionRoll = rollDice(diceCount, 8, "Geode Eruption");
                    const baseExpDmg = explosionRoll.total;
                    
                    // 3. Apply Magic Scaling Formula
                    const statBonus = player.magicalDamageBonus;
                    const scaleMult = 1 + (statBonus / 20);
                    const flatBonus = Math.floor(statBonus / 5);

                    const finalExpDmg = Math.floor(baseExpDmg * scaleMult) + flatBonus;

                    // 4. Hit Enemies & Log
                    let hitCount = 0;
                    area.forEach(tile => {
                        const target = currentEnemies.find(e => e.isAlive() && e.x === tile.x && e.y === tile.y);
                        if (target) {
                            hitCount++;
                            
                            // [LOGGING ADDED] ---------------------------------
                            const calcLog = { 
                                source: "Geode Eruption", 
                                targetName: target.name, 
                                steps: [], 
                                baseDamage: baseExpDmg 
                            };
                            
                            // Record Steps
                            calcLog.steps.push({ 
                                description: `Base Roll (${diceCount}d8)`, 
                                value: explosionRoll.rolls.join('+'), 
                                result: baseExpDmg 
                            });
                            calcLog.steps.push({ 
                                description: "Magic Scaling", 
                                value: `x${scaleMult.toFixed(2)} + ${flatBonus}`, 
                                result: finalExpDmg 
                            });

                            // Deal Damage
                            const res = target.takeDamage(finalExpDmg, { element: 'fire', isMagic: true }, player);
                            
                            // Record Defense Steps
                            if(res.defenseSteps) calcLog.steps = calcLog.steps.concat(res.defenseSteps);
                            calcLog.finalDamage = res.damageDealt;
                            
                            // Output Logs
                            if(typeof logDamageCalculation === 'function') logDamageCalculation(calcLog);
                            addToLog(`${target.name} is incinerated for <span class="font-bold text-orange-300">${res.damageDealt}</span> damage!`, "text-orange-200");
                            // -------------------------------------------------
                        }
                    });

                    if (hitCount > 0) addToLog(`The magma consumes everything in range!`, "text-orange-300");
                    
                    // Remove object manually
                    gameState.gridObjects.splice(i, 1);
                    continue; 
                }

                // Totem Expiration
                if (obj.type === 'totem' && obj.duration <= 0) {
                    addToLog(`The ${obj.name} crumbles back into the earth.`, "text-orange-300");
                    gameState.gridObjects.splice(i, 1);
                    continue;
                }

                // Generic Expiration
                if (obj.duration <= 0) {
                    gameState.gridObjects.splice(i, 1);
                }
            }
        }
        renderBattleGrid(); 
    }

    gameState.isPlayerTurn = true;
    isProcessingAction = false; 

    $('#inventory-btn').disabled = false;
    $('#character-sheet-btn').disabled = false;

    // --- 5. STATUS CHECKS (CC) ---
    if (player.statusEffects.paralyzed || player.statusEffects.petrified) {
         const status = player.statusEffects.paralyzed ? 'paralyzed' : 'petrified';
        addToLog(`You are ${status} and cannot act!`, 'text-red-500 font-bold');
        gameState.isPlayerTurn = false; 
        finalizePlayerAction(); 
    } else if (player.statusEffects.swallowed) {
        addToLog("You are trapped inside the beast! You can only struggle!", "text-red-600 font-bold");
        renderBattleGrid(); 
    }
    else {
        addToLog("Your turn!", 'text-blue-300 font-bold');
        renderBattleGrid();
    }
}

function tryRevivePlayer() {
    console.log("=== REVIVAL CHECK STARTED ===");
    let revived = false;
    let message = "";
    let color = "text-cyan-300";

    // 1. SAFETY INITIALIZATION
    if (typeof player.necroticReviveUsed === 'undefined') player.necroticReviveUsed = false;
    if (!player.specialWeaponStates) player.specialWeaponStates = {};
    if (typeof player.specialWeaponStates.void_greatsword_revive_used === 'undefined') {
        player.specialWeaponStates.void_greatsword_revive_used = false;
    }

    // =========================================================
    // PRIORITY 1: DIVINE SEAL (Environmental)
    // =========================================================
    // You confirmed this works, keeping logic identical.
    const sealIndex = gameState.gridObjects.findIndex(o => 
        o.x === player.x && o.y === player.y && o.subtype === 'god_seal'
    );
    if (sealIndex > -1) {
        player.hp = Math.floor(player.maxHp * 0.50); 
        gameState.gridObjects.splice(sealIndex, 1);
        message = "The Divine Seal shatters, refusing your death!";
        revived = true;
    }

    // =========================================================
    // PRIORITY 2: VOID GREATSWORD (Weapon Effect)
    // =========================================================
    // Fix: Handle cases where equippedWeapon is just a String ID or missing 'effect'
    let weapon = player.equippedWeapon;
    let weaponHasRevive = false;

    // Case A: Weapon is just a string ID (e.g., "void_greatsword")
    if (typeof weapon === 'string' && typeof WEAPONS !== 'undefined') {
        const weaponData = WEAPONS[weapon];
        if (weaponData && weaponData.effect && weaponData.effect.revive) weaponHasRevive = true;
    } 
    // Case B: Weapon is an Object
    else if (typeof weapon === 'object' && weapon !== null) {
        // Direct check
        if (weapon.effect && weapon.effect.revive) {
            weaponHasRevive = true;
        } 
        // Fallback: Check ID against global WEAPONS list if effect is missing on instance
        else if (typeof WEAPONS !== 'undefined' && weapon.key && WEAPONS[weapon.key]?.effect?.revive) {
            weaponHasRevive = true;
        }
    }

    if (!revived && weaponHasRevive && !player.specialWeaponStates.void_greatsword_revive_used) {
        player.hp = Math.floor(player.maxHp * 0.5);
        player.specialWeaponStates.void_greatsword_revive_used = true;
        message = "The Void Greatsword flashes with dark energy!";
        color = "text-purple-400";
        revived = true;
        console.log("Revived via Void Greatsword");
    }

    // =========================================================
    // PRIORITY 3: NECROTIC ASCENSION (Skill)
    // =========================================================
    // Fix: Check Object keys AND Array includes
    const skillId = 'necrotic_ascension';
    let hasNecroticSkill = false;

    // Check 1: player.isSkillActive() method
    if (typeof player.isSkillActive === 'function') {
        if (player.isSkillActive(skillId)) hasNecroticSkill = true;
    }
    
    // Check 2: player.skills is an Object { 'skill_id': level }
    if (!hasNecroticSkill && player.skills && player.skills[skillId]) {
        hasNecroticSkill = true;
    }

    // Check 3: player.skills is an Array ['skill_id', ...]
    if (!hasNecroticSkill && Array.isArray(player.skills) && player.skills.includes(skillId)) {
        hasNecroticSkill = true;
    }

    // Check 4: player.learnedSkills (Common alternate name)
    if (!hasNecroticSkill && player.learnedSkills && (player.learnedSkills[skillId] || (Array.isArray(player.learnedSkills) && player.learnedSkills.includes(skillId)))) {
        hasNecroticSkill = true;
    }

    if (!revived && hasNecroticSkill && player.necroticReviveUsed !== true) {
        player.hp = Math.floor(player.maxHp * 0.5);
        player.necroticReviveUsed = true;
        message = "Death rejects you! Your necrotic form reassembles.";
        color = "text-green-400";
        revived = true;
        console.log("Revived via Necrotic Ascension");
    }

    // =========================================================
    // SUCCESS HANDLER
    // =========================================================
    if (revived) {
        addToLog(message, `${color} font-bold text-xl title-glow`);
        if (typeof playSound === 'function') playSound('magic_buff');
        
        // CRITICAL: Unlock game state
        gameState.playerIsDying = false;
        gameState.battleEnded = false;
        isProcessingAction = false; 
        
        // Update UI
        updateStatsView();
        renderBattleGrid();
        return true;
    }

    console.log("Revival failed. No valid conditions met.");
    return false; 
}

// [FIXED] Ensure death check delegates to revival properly
function checkPlayerDeath() {
    // If already dead/dying, don't re-trigger to avoid loops
    if (gameState.playerIsDying) return;

    if (player.hp <= 0) {
        console.log("Player HP <= 0. Checking revival...");
        
        // 1. Attempt Revival FIRST
        if (tryRevivePlayer()) {
            return; // Successfully revived, stop death sequence
        }

        // 2. If no revival, trigger actual death
        triggerDeathSequence();
    }
}

// HELPER 2: The Game Over Sequence (Only runs if you stay dead)
function triggerDeathSequence() {
    gameState.playerIsDying = true;
    gameState.battleEnded = true;

    // Remove UI interaction
    isProcessingAction = true; 

    // Render Death Screen
    const container = document.getElementById('main-view');
    const template = document.getElementById('template-death');
    
    if (template && container) {
        container.innerHTML = '';
        container.appendChild(template.content.cloneNode(true));
    } else if (container) {
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full bg-black text-center">
                <h1 class="text-6xl text-red-700 font-medieval mb-4">YOU DIED</h1>
                <p class="text-gray-400 animate-pulse">Tap anywhere to respawn...</p>
            </div>`;
    }

    if (typeof playSound === 'function') playSound('game_over');

    // Add Click Listener with Delay (prevents accidental double-clicks)
    setTimeout(() => {
        const handleInput = (e) => {
            // Clean up all listeners to prevent double-firing
            document.removeEventListener('click', handleInput);
            document.removeEventListener('touchstart', handleInput);
            document.removeEventListener('keydown', handleInput);
            
            respawnPlayer(e);
        };

        document.addEventListener('click', handleInput, { once: true });
        document.addEventListener('touchstart', handleInput, { once: true });
        document.addEventListener('keydown', handleInput, { once: true });
    }, 1000); // 1 second delay so you don't accidental-click
}

async function respawnPlayer(e) {
    // 1. Handle Event Safety (if triggered by click/key)
    if (e) {
        if (e.preventDefault) e.preventDefault();
        if (e.stopImmediatePropagation) e.stopImmediatePropagation();
    }

    console.log("Respawning player...");

    // 2. CRITICAL: Clear "Dying" & "Locked" States
    gameState.playerIsDying = false;
    gameState.battleEnded = false;
    isProcessingAction = false; // Unlock UI input

    // 3. Gold Penalty Logic (Based on Difficulty)
    let penaltyRate = 0.10; // Default: Normal (10%)
    
    if (player.difficulty === 'easy') {
        penaltyRate = 0.0; // Easy: 0% loss
    } else if (player.difficulty === 'hard') {
        penaltyRate = 0.20; // Hard: 20% loss
    }

    const goldLoss = Math.floor(player.gold * penaltyRate);
    player.gold = Math.max(0, player.gold - goldLoss);

    // 4. Reset Player Stats & Cooldowns
    player.hp = player.maxHp;
    player.mp = player.maxMp;
    player.clearBattleBuffs();
    
    // --- FIX: Reset Revival Limits for the new run ---
    // If we don't do this, the game thinks you already revived in the new life
    player.necroticReviveUsed = false; 
    if (player.specialWeaponStates) player.specialWeaponStates.void_greatsword_revive_used = false;
    player.specialWeaponStates.void_greatsword_revive_used = false;
    // -------------------------------------------------

    // 5. Reset Ally (if exists)
    if (player.npcAlly) {
        player.npcAlly.hp = player.npcAlly.maxHp;
        player.npcAlly.mp = player.npcAlly.maxMp;
        player.npcAlly.isFled = false;
        player.npcAlly.clearBattleBuffs();
    }

    // 6. Clear Dungeon/Expedition State
    gameState.currentMap = null; 
    gameState.currentNodeId = null;
    gameState.gridObjects = [];
    currentEnemies = [];
    gameState.activeDrone = null;
    gameState.npcActiveDrone = null;

    // 7. Log the Event
    let logMsg = "Fate is rewoven. You wake up in town.";
    if (goldLoss > 0) {
        logMsg += ` (Lost ${goldLoss} Gold)`;
    } else {
        logMsg += ` (Mercifully, you kept your gold)`;
    }
    
    // Clear the visual log and add the respawn message
    const logEl = document.getElementById('game-log');
    if (logEl) logEl.innerHTML = ''; 
    addToLog(logMsg, "text-red-300 font-bold");

    // 8. Save Game & Return to Town
    if (typeof saveGame === 'function') await saveGame();
    
    if (typeof renderTownSquare === 'function') {
        renderTownSquare();
    } else {
        // Fallback if town function is missing
        console.warn("renderTownSquare not found, reloading page...");
        window.location.reload(); 
    }
}

async function addToGraveyard(deadPlayer, killer) {
    if (!db) return;
    try {
        const graveyardCollection = db.collection(`artifacts/${appId}/public/data/graveyard`);
        await graveyardCollection.add({
            name: deadPlayer.name,
            level: deadPlayer.level,
            cause: `Slain by ${killer}`,
            date: new Date().toLocaleString(),
            
            // --- DDOS PROTECTION UPDATE ---
            // Required for the 'isValidWrite()' security rule check
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        console.error("Could not add to graveyard:", error);
    }
}

// Function to handle Cook's ability activation
function executeOnFieldCooking(recipeKey) {
     // Check if ability has already been used (prevent double use if UI lags)
     // Check if player object exists and is a cook before proceeding
     if (!player || player._classKey !== 'cook' || player.signatureAbilityUsed === true) {
         addToLog("Cannot cook right now.", "text-red-400");
         renderBattleGrid(); // Return to main actions
         return;
     }

    const recipeData = COOKING_RECIPES[recipeKey];
    if (!recipeData) {
        addToLog("Invalid recipe selected.", "text-red-400");
        renderBattleGrid(); // Go back to main actions
        // Turn ends even on invalid selection
        gameState.isPlayerTurn = false;
        finalizePlayerAction();
        return;
    }

    // Mark ability as used *before* checking costs
    player.signatureAbilityUsed = true;


    // --- Check ingredients / Calculate MP Cost ---
    const required = recipeData.ingredients;
    const availableIngredients = { meat: [], veggie: [], seasoning: [] };
    Object.keys(player.inventory.items).forEach(itemKey => {
        const details = getItemDetails(itemKey);
        if (details && details.cookingType) {
            const count = player.inventory.items[itemKey];
            if(count > 0) {
                for (let i = 0; i < count; i++) {
                    availableIngredients[details.cookingType].push({ key: itemKey, price: details.price, rarity: details.rarity || 'Common' }); // Added default rarity
                }
            }
        }
    });
    for(const type in availableIngredients) availableIngredients[type].sort((a,b) => a.price - b.price);

    const ingredientsToConsume = {};
    let mpCost = 0;
    let canCook = true;
    const mpCosts = { 'Common': 5, 'Uncommon': 10, 'Rare': 15, 'Epic': 20, 'Legendary': 25, 'Broken': 0 }; // Added more rarities + Broken

    for (const reqKey in required) {
        const requiredAmount = required[reqKey];
        let itemsUsedCount = 0; // Track items *found* for this ingredient type
        const isGeneric = ['meat', 'veggie', 'seasoning'].includes(reqKey);

        if (isGeneric) {
            // Count how many we *can* use from available generics
            const availableCount = availableIngredients[reqKey].length;
            itemsUsedCount = Math.min(availableCount, requiredAmount);

            // Mark the ones we will consume
            for(let i = 0; i < itemsUsedCount; i++) {
                const itemToUse = availableIngredients[reqKey][i].key;
                ingredientsToConsume[itemToUse] = (ingredientsToConsume[itemToUse] || 0) + 1;
            }

            // Calculate MP cost for the *missing* amount
            const missingAmount = requiredAmount - itemsUsedCount;
            if (missingAmount > 0) {
                 mpCost += missingAmount * mpCosts['Common']; // Assume Common for generics
            }

        } else { // Specific ingredient
            const currentAmount = player.inventory.items[reqKey] || 0;
            itemsUsedCount = Math.min(currentAmount, requiredAmount);

            if (itemsUsedCount > 0) {
                 ingredientsToConsume[reqKey] = (ingredientsToConsume[reqKey] || 0) + itemsUsedCount;
            }
            // Add MP cost for missing specific ingredients
            const missingAmount = requiredAmount - itemsUsedCount;
            if (missingAmount > 0) {
                const details = getItemDetails(reqKey);
                const rarityCost = mpCosts[details?.rarity || 'Common'] || mpCosts['Common'];
                mpCost += missingAmount * rarityCost;
            }
        }
    }


    if (player.mp < mpCost) {
        addToLog(`Not enough MP (${mpCost}) to substitute missing ingredients! Cooking failed.`, 'text-blue-400');
        canCook = false;
        // REFUND ability use since it failed due to MP cost
        player.signatureAbilityUsed = false;
        renderBattleGrid(); // Go back to main battle actions
        gameState.isPlayerTurn = true; // Give turn back
        // beginPlayerTurn(); // Don't begin new turn, just allow action
        isProcessingAction = false; // Unlock actions
        return;
    }

    // --- Consume Resources & Apply Effects ---
    if (canCook) {
        player.mp -= mpCost;
        if (mpCost > 0) addToLog(`Substituted missing ingredients for ${mpCost} MP.`, 'text-blue-300');

        for (const itemKey in ingredientsToConsume) {
             if (player.inventory.items[itemKey]) { // Check if item exists before decrementing
                player.inventory.items[itemKey] -= ingredientsToConsume[itemKey];
                if (player.inventory.items[itemKey] <= 0) {
                    delete player.inventory.items[itemKey];
                }
            } else {
                 console.warn(`Attempted to consume ${itemKey} during cooking, but it was not found in inventory.`);
            }
        }

        player.clearFoodBuffs(); // Clear old buffs
        // --- BUFF SHARING (PLAYER) START ---
        if (player.npcAlly) {
            player.npcAlly.clearFoodBuffs();
        }
        // --- BUFF SHARING (PLAYER) END ---

        const effect = recipeData.effect;
        if (effect.heal) {
            player.hp = Math.min(player.maxHp, player.hp + effect.heal);
            // --- BUFF SHARING (PLAYER) START ---
            if (player.npcAlly) {
                player.npcAlly.hp = Math.min(player.npcAlly.maxHp, player.npcAlly.hp + effect.heal);
            }
            // --- BUFF SHARING (PLAYER) END ---
        }

        switch (effect.type) {
            case 'full_restore':
                player.hp = player.maxHp; player.mp = player.maxMp;
                // --- BUFF SHARING (PLAYER) START ---
                if (player.npcAlly) {
                    player.npcAlly.hp = player.npcAlly.maxHp;
                    player.npcAlly.mp = player.npcAlly.maxMp;
                }
                // --- BUFF SHARING (PLAYER) END ---
                break;
            case 'heal_percent':
                player.hp = Math.min(player.maxHp, player.hp + Math.floor(player.maxHp * effect.heal_percent));
                // --- BUFF SHARING (PLAYER) START ---
                if (player.npcAlly) {
                    player.npcAlly.hp = Math.min(player.npcAlly.maxHp, player.npcAlly.hp + Math.floor(player.npcAlly.maxHp * effect.heal_percent));
                }
                // --- BUFF SHARING (PLAYER) END ---
                break;
            case 'mana_percent':
                player.mp = Math.min(player.maxMp, player.mp + Math.floor(player.maxMp * effect.mana_percent));
                // --- BUFF SHARING (PLAYER) START ---
                if (player.npcAlly) {
                    player.npcAlly.mp = Math.min(player.npcAlly.maxMp, player.npcAlly.mp + Math.floor(player.npcAlly.maxMp * effect.mana_percent));
                }
                // --- BUFF SHARING (PLAYER) END ---
                break;
            case 'buff':
                effect.buffs.forEach(buff => {
                    // Ensure duration is 3 encounters for On-Field Cooking
                    const buffData = { value: buff.value, duration: 4 }; // Create data once
                    player.foodBuffs[buff.stat] = buffData;
                    // --- BUFF SHARING (PLAYER) START ---
                    if (player.npcAlly) {
                        player.npcAlly.foodBuffs[buff.stat] = buffData;
                    }
                    // --- BUFF SHARING (PLAYER) END ---
                });
                // Re-apply Max HP/MP buffs
                player.hp = Math.min(player.hp, player.maxHp);
                player.mp = Math.min(player.mp, player.maxMp);
                // --- BUFF SHARING (PLAYER) START ---
                if (player.npcAlly) {
                    player.npcAlly.hp = Math.min(player.npcAlly.hp, player.npcAlly.maxHp);
                    player.npcAlly.mp = Math.min(player.npcAlly.mp, player.npcAlly.maxMp);
                }
                // --- BUFF SHARING (PLAYER) END ---
                break;
        }

        addToLog(`You quickly cook and eat ${recipeData.name}!`, "text-green-400 font-bold");
        // --- BUFF SHARING (PLAYER) START ---
        if (player.npcAlly) {
            addToLog(`${player.npcAlly.name} shares in the meal!`, "text-blue-300");
            renderBattleGrid(); // Update ally HP bar
        }
        // --- BUFF SHARING (PLAYER) END ---
        updateStatsView();


        // End the turn
        gameState.isPlayerTurn = false;
        finalizePlayerAction();
    } else {
         // Should not be reachable if MP check works, but as a fallback:
         addToLog("Could not cook the recipe.", "text-red-400");
         // REFUND ability use if canCook became false for other reasons (e.g. ingredient check logic error)
         player.signatureAbilityUsed = false;
         renderBattleGrid();
         gameState.isPlayerTurn = true;
         // beginPlayerTurn(); // Don't begin new turn
         isProcessingAction = false; // Unlock actions
    }
}

