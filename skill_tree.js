const DICE_PROGRESSION = [1, 2, 4, 6, 8, 10, 12, 14, 16, 20];

const SKILL_TREE = {
    // =========================================================================
    // CENTER: THE ROOT
    // =========================================================================
    'the_root': {
        name: "The First Breath",
        type: 'mastery',
        costType: 'mastery',
        icon: '🔥', 
        branch: 'Core',
        description: "\"The Age of Ash ended in silence. In these frozen wastes, knowledge is the only heat that sustains us. This is the spark of potential that separates the hero from the corpse.\" <br><span class='text-fuchsia-400'>[Mastery: Core]</span> <br>Gain <b>+5% XP</b> from all sources.",
        parents: [],
        effect: { type: 'xp_mult', value: 0.05 }
    },

    // =========================================================================
    // HEMISPHERE 1: PHYSICAL
    // =========================================================================
    'muscle_control': {
        name: "Kinetic Awakening",
        type: 'passive',
        branch: 'Physical',
        description: "\"The body remembers what the mind forgets. You are no longer just flesh; you are a mechanism of force, calibrated to endure the long winter.\" <br><span class='text-red-300'>[Physical Passive]</span> <br>All Physical attacks deal <b>5% more damage</b>.",
        parents: ['the_root'],
        effect: { type: 'phys_dmg_mult', value: 0.05 }
    },

    // --- WEDGE A: DEXTERITY ---
    'dextrous_control': {
        name: "Flow State",
        type: 'passive',
        branch: 'Dexterity',
        description: "\"A heavy blade is a burden to the soul. True power flows like water, striking through the cracks of the world rather than breaking them against the wall.\" <br><span class='text-cyan-300'>[Dexterity Passive]</span> <br>Deal <b>10% more damage</b> with Swift Weapons (Daggers, Bows, Rapiers, Lances, Curved Swords).",
        parents: ['muscle_control'],
        effect: { type: 'weapon_class_boost', classes: ['Dagger', 'Thrusting Sword', 'Curved Sword', 'Reaper', 'Bow'], value: 0.10 }
    },
    'consecution_technique': {
        name: "Rhythm of Ruin",
        type: 'trigger',
        branch: 'Dexterity',
        description: "\"Combat is a conversation. Strike. Recover. Strike again. Do not let them breathe. Do not let them speak.\" <br><span class='text-yellow-300'>[Trigger: Combo]</span> <br>Consecutive hits on the same target increase damage by <b>10%</b> (Max 30%). Resets on target switch.",
        parents: ['dextrous_control'],
        effect: { type: 'consecution_stack' }
    },
    'defense_exploitation': {
        name: "Needle's Eye",
        type: 'passive',
        branch: 'Dexterity',
        description: "\"There is no such thing as perfect armor. Even the gods bled when the Old World fell. There is always a gap, a loose ring, a rusted hinge.\" <br><span class='text-cyan-300'>[Dexterity Passive]</span> <br>Swift weapons ignore <b>5% of Enemy Defense</b>.",
        parents: ['consecution_technique'],
        effect: { type: 'armor_pierce_flat', value: 0.05 }
    },
    'antspur_piercing': {
        name: "Antspur Injection",
        type: 'toggle',
        branch: 'Dexterity',
        description: "\"The smallest cut kills if the blade is wicked enough. Let the rot spread from within.\" <br><span class='text-purple-300'>[Toggle: 15 MP/Hit]</span> <br>Swift Weapons have a <b>10% chance</b> to inflict Poison. Stacks with other poison sources.",
        parents: ['defense_exploitation'],
        effect: { toggle: 'antspur_piercing' }
    },
    'tailors_instinct': {
        name: "Thread Cutter",
        type: 'passive',
        branch: 'Dexterity',
        description: "\"Fabric, flesh, armor. It is all just thread waiting to be cut. Find the seam and unravel them.\" <br><span class='text-cyan-300'>[Dexterity Passive]</span> <br>Swift weapons ignore an additional <b>5% Defense</b>.",
        parents: ['defense_exploitation'],
        effect: { type: 'flat_pierce_buff', value: 0.05 }
    },
    'weak_point_targeting': {
        name: "Heartseeker",
        type: 'active',
        branch: 'Dexterity',
        // Updated Cost: 15 (Damage already 130% in logic)
        description: "\"See the pulse beneath the skin. That rhythm is a countdown. Sever it, and the clock stops.\" <br><span class='text-red-300'>[Active Art] [Cost: 15 MP]</span> <br>Strike a vital spot for <b>130% Damage</b> with high Crit Chance.",
        parents: ['consecution_technique'],
        effect: { action: 'weak_point_attack', cost: 15 } // Updated Cost
    },
    // 1. Silk-Dancer's Veil (Second Skin)
    'light_armor_proficiency': {
        name: "Silk-Dancer's Veil",
        type: 'passive',
        branch: 'Dexterity',
        armorReq: 'Light',
        description: "\"You are not wearing armor; you are wearing possibilities. To be hit is a failure of the dance.\" <br><span class='text-cyan-300'>[Defense Passive]</span> <br>While wearing Light Armor, you gain <b>+5% Dodge Chance</b>.",
        parents: ['dextrous_control'],
        effect: { type: 'light_armor_dodge', value: 0.05 }
    },

    // 2. Leviathan-Boiled Leather (Hardened Hide)
    'leather_padding': {
        name: "Leviathan-Boiled Leather",
        type: 'passive',
        branch: 'Dexterity',
        armorReq: 'Light',
        description: "\"Treated with salts from the Dead Sea and boiled in leviathan oil. Tough as iron, yet flexible as silk.\" <br><span class='text-cyan-300'>[Defense Passive]</span> <br>Your Light Armor provides <b>50% more Defense</b> value.",
        parents: ['light_armor_proficiency'],
        effect: { type: 'light_armor_def_mult', value: 1.5 }
    },

    // 3. Guild Supply Lines (Mass Produced Hide)
    'guild_supply_lines': {
        name: "Guild Supply Lines",
        type: 'passive',
        branch: 'Dexterity',
        armorReq: 'Light',
        description: "\"You know a guy who knows a guy. High-quality leather and bucklers fall off the back of wagons with surprising frequency.\" <br><span class='text-cyan-300'>[Economy Passive]</span> <br>The cost of Light Armor and Parrying Shields is <b>decreased by 25%</b>.",
        parents: ['leather_padding'],
        effect: { type: 'light_gear_discount', value: 0.25 }
    },

    // 4A. Phantom Step (Ghost Walk)
    'assassins_gambit': {
        name: "Phantom Step",
        type: 'toggle',
        branch: 'Dexterity',
        armorReq: 'Light',
        description: "\"To exist is to be perceived. To kill is to be nothing. Fade from their sight until you are the knife at their throat.\" <br><span class='text-purple-300'>[Toggle: 10 MP/Turn]</span> <br>Enemies will not target you unless you are adjacent (1 tile range).",
        parents: ['guild_supply_lines'], // Changed Parent
        effect: { toggle: 'assassins_gambit' }
    },

    // 4B. Buckler Toss (Shield Hurl)
    'buckler_toss': {
        name: "Buckler Toss",
        type: 'active',
        branch: 'Dexterity',
        armorReq: 'Light',
        description: "\"A parrying shield is balanced for speed. With the right flick of the wrist, it becomes a stunning projectile.\" <br><span class='text-red-300'>[Shield Art] [Cost: 10 MP]</span> <br>Hurl your shield. Deal <b>50% Damage</b> (Base: Shield Def/2) and <b>Root</b> target (No Move) for 1 turn.",
        parents: ['guild_supply_lines'],
        effect: { action: 'buckler_toss', cost: 10 }
    },

    // 5A. Ethereal Permeability (Reality Phaser)
    'ethereal_permeability': {
        name: "Ethereal Permeability",
        type: 'passive',
        branch: 'Dexterity',
        armorReq: 'Light',
        description: "\"Matter is mostly empty space. If you convince yourself you are a ghost, walls become merely suggestions.\" <br><span class='text-cyan-300'>[Passive]</span> <br>While <b>Phantom Step</b> is active, you can walk through obstacles/terrain (but cannot stop inside them).",
        parents: ['assassins_gambit'],
        effect: { type: 'ghost_walk_noclip' }
    },

    // 5B. Flicker (Misty Step)
    'misty_step': {
        name: "Flicker",
        type: 'active',
        branch: 'Dexterity',
        armorReq: 'Light',
        description: "\"One moment here, the next there. The space between is irrelevant.\" <br><span class='text-purple-300'>[Movement Art] [Cost: 30 MP]</span> <br>Teleport instantly to any tile within <b>5 Range</b>.",
        parents: ['assassins_gambit'],
        effect: { action: 'misty_step', cost: 20 }
    },

    // 5C. Chain Deflection (Shield Ricochet)
    'chain_deflection': {
        name: "Chain Deflection",
        type: 'passive',
        branch: 'Dexterity',
        armorReq: 'Light',
        description: "\"Calculated geometry. One throw, three headaches.\" <br><span class='text-cyan-300'>[Passive]</span> <br><b>Buckler Toss</b> bounces to up to <b>3 adjacent targets</b>.",
        parents: ['buckler_toss'],
        effect: { type: 'shield_ricochet' }
    },
    'weapon_mastery_dex': {
        name: "Razor's Edge",
        type: 'passive',
        branch: 'Dexterity',
        description: "\"A dull blade is a danger only to its wielder. Yours are honed to a molecular edge that sings a funeral dirge when swung.\" <br><span class='text-yellow-300'>[Mastery: Weapon Upgrade]</span> <br>Increases the <b>Base Damage Dice</b> of all swift weapons by one tier.",
        parents: ['dextrous_control'],
        effect: { type: 'dice_upgrade', classes: ['Dagger', 'Thrusting Sword', 'Curved Sword', 'Reaper', 'Bow'] }
    },
    // Sub-Branch: Focal Agility
    'focal_agility': {
        name: "Weapon Resonance",
        type: 'passive',
        branch: 'Dexterity',
        description: "\"Listen to the steel. It hungers. Specialist weapons require a mind as sharp as their edge to unlock their true potential.\" <br><span class='text-cyan-300'>[Passive]</span> <br>Deal <b>5% more damage</b> with specialist weapons (Scythes, Rapiers, Curved Swords).",
        parents: ['weapon_mastery_dex'],
        effect: { type: 'dex_weapon_buff', value: 0.05 }
    },
    // skill_tree.js

    // --- SCYTHE BRANCH (The Harvester) ---

    // 1. Reap and Sow (Root) - Renaming/Updating 'deathly_flourish'
    'deathly_flourish': {
        name: "Reap and Sow",
        type: 'active',
        branch: 'Dexterity',
        weaponReq: 'Reaper',
        description: "\"Never be where the corpse falls. Strike the neck and vanish before the head hits the ground.\" <br><span class='text-red-300'>[Scythe Art] [Cost: 20 MP]</span> <br>Sweeping strike for <b>150% Damage</b>. Grants <b>Swiftness</b> (Free Move Action).",
        parents: ['focal_agility'],
        effect: { action: 'deathly_flourish', cost: 20 }
    },

    // 2A. Crimson Penance (Self-Flagellation) - Child of Reap and Sow
    'self_flagellation': {
        name: "Crimson Penance",
        type: 'active',
        branch: 'Dexterity',
        weaponReq: 'Reaper',
        description: "\"Pain is clarity. Blood is power. Sacrifice the vessel to sharpen the soul.\" <br><span class='text-red-300'>[Blood Art] [Cost: 15 MP]</span> <br>Sacrifice <b>20% HP</b> to gain <b>+25% Damage</b> and <b>+15% Lifesteal</b> for 3 turns.",
        parents: ['deathly_flourish'],
        effect: { action: 'self_flagellation', cost: 15 }
    },

    // 2B. Executioner's Stance (Force-Switch Blade) - Child of Reap and Sow
    'force_switch_blade': {
        name: "Executioner's Stance",
        type: 'toggle',
        branch: 'Dexterity',
        weaponReq: 'Reaper',
        description: "\"Extend the handle. Shift the weight. You are no longer reaping wheat; you are harvesting heads.\" <br><span class='text-purple-300'>[Scythe Stance] [10 MP/Turn]</span> <br><b>+1 Range</b>, <b>+10% Damage</b>. Disables base Lifesteal.",
        parents: ['deathly_flourish'],
        effect: { toggle: 'force_switch_blade' }
    },

    // 2C. Requiem Waltz (Deadly Dance) - Child of Reap and Sow
    'deadly_dance': {
        name: "Requiem Waltz",
        type: 'active',
        branch: 'Dexterity',
        weaponReq: 'Reaper',
        description: "\"A harvest dance for the departed. Spin until the world is red.\" <br><span class='text-red-300'>[Scythe Art] [Cost: 50 MP]</span> <br>Strike all <b>8 adjacent tiles</b> for <b>150% Damage</b>. Kills heal <b>5% HP</b> and grant <b>+5% Damage</b> (3 turns).",
        parents: ['deathly_flourish'],
        effect: { action: 'deadly_dance', cost: 50 }
    },

    // 3A. Martyr's Fervor (Patience Devotion) - Child of Crimson Penance
    'patience_devotion': {
        name: "Martyr's Fervor",
        type: 'passive',
        branch: 'Dexterity',
        weaponReq: 'Reaper',
        description: "\"The void listens to those who suffer. The light shines brightest on the broken.\" <br><span class='text-cyan-300'>[Passive]</span> <br>If <b>Crimson Penance</b> is active: Deal <b>+20% Damage</b> with Light or Void infusions.",
        parents: ['self_flagellation'],
        effect: { type: 'martyr_buff' }
    },

    // 3B. Sepulchral Rite (Seppuku) - Child of Crimson Penance + Executioner's Stance
    'seppuku': {
        name: "Sepulchral Rite",
        type: 'synergy',
        branch: 'Dexterity',
        weaponReq: 'Reaper',
        description: "\"To kill death, one must first invite it in.\" <br><span class='text-yellow-300'>[Synergy: Penance + Stance]</span> <br>If <b>Executioner's Stance</b> is active, <b>Crimson Penance</b> grants <b>+25% Crit Chance</b>, <b>+1.0x Crit Mult</b>, and <b>+50% Grease Effect</b> instead of normal buffs.",
        parents: ['self_flagellation', 'force_switch_blade'],
        effect: { type: 'seppuku_mod' }
    },

    'culling_hook': {
        name: "Grave Hook",
        type: 'active',
        branch: 'Dexterity',
        weaponReq: 'Reaper',
        description: "\"The scythe is not just for cutting; it is for gathering. Those who try to flee the harvest only hasten their end.\" <br><span class='text-red-300'>[Scythe Art] [Cost: 20 MP]</span> <br><b>+1 Range</b>. Deals <b>200% Damage</b> (Ignoring 50% Def) and <b>Pulls</b> target 2 tiles.",
        parents: ['force_switch_blade'],
        effect: { action: 'culling_hook', cost: 20 }
    },

    // 3D. Vortex Slash (Cyclone Trigger) - Child of Executioner's Stance + Requiem Waltz
    'cyclone_trigger': {
        name: "Vortex Slash",
        type: 'synergy',
        branch: 'Dexterity',
        weaponReq: 'Reaper',
        description: "\"Focus the storm. Direct the chaos.\" <br><span class='text-yellow-300'>[Synergy: Stance + Waltz]</span> <br>If <b>Executioner's Stance</b> is active, <b>Requiem Waltz</b> becomes a <b>3x3 AoE</b> in front of you.",
        parents: ['force_switch_blade', 'deadly_dance'],
        effect: { type: 'cyclone_aoe' }
    },

    // 3E. Season of Plenty (Harvest Festival) - Child of Requiem Waltz
    'harvest_festival': {
        name: "Season of Plenty",
        type: 'passive',
        branch: 'Dexterity',
        weaponReq: 'Reaper',
        description: "\"Blood makes the grass grow green.\" <br><span class='text-cyan-300'>[Passive]</span> <br><b>Gardening:</b> 10% chance for -25% Growth Time, 1% Instant Grow. <b>Requiem Waltz</b> kills grant <b>+20% XP</b>.",
        parents: ['deadly_dance'],
        effect: { type: 'harvest_buff' }
    },

    // 3F. Sanguine Waltz (Blood Dance) - Child of Requiem Waltz + Crimson Penance
    'blood_dance': {
        name: "Sanguine Waltz",
        type: 'synergy',
        branch: 'Dexterity',
        weaponReq: 'Reaper',
        description: "\"The blood rains down, and the reaper dances in the crimson shower.\" <br><span class='text-yellow-300'>[Synergy: Waltz + Penance]</span> <br>If <b>Crimson Penance</b> is active, <b>Requiem Waltz</b> fires <b>Blood Slashes</b> (50% Dmg, 4 tiles). Heal triggers on Hit (2.5%).",
        parents: ['deadly_dance', 'self_flagellation'],
        effect: { type: 'sanguine_waltz' }
    },
    // 1. Needlepoint Stance (Root)
    'piercing_fang': {
        name: "Needlepoint Stance",
        type: 'toggle',
        branch: 'Dexterity',
        weaponReq: 'Thrusting Sword',
        description: "\"Flesh has pores. Armor has links. There is always a gap. Find it, and the mightiest fortress becomes a tomb.\" <br><span class='text-purple-300'>[Rapier Stance]</span> <br>Attacks cost <b>5 MP</b> but ignore <b>10% Defense</b>.",
        parents: ['focal_agility'],
        effect: { toggle: 'piercing_fang' }
    },

    // 2A. Million-Stabs (Rapid Strike)
    'rapid_strike': {
        name: "Million-Stabs",
        type: 'active',
        branch: 'Dexterity',
        weaponReq: 'Thrusting Sword',
        // Updated Cost: 30
        description: "\"Death by a thousand cuts is inefficient. Death by five precise punctures is art.\" <br><span class='text-red-300'>[Rapier Art] [Cost: 30 MP]</span> <br>Strike 4 times (40% Dmg) then 1 Heavy Slash (60% Dmg).",
        parents: ['piercing_fang'],
        effect: { action: 'rapid_strike', cost: 30 } // Updated Cost
    },

    // 2B. Quicksilver Reflex (Quicksilver Reaction)
    'quicksilver_reaction': {
        name: "Quicksilver Reflex",
        type: 'toggle',
        branch: 'Dexterity',
        weaponReq: 'Thrusting Sword',
        description: "\"Breathe in. Focus. Let their aggression become their undoing.\" <br><span class='text-purple-300'>[Toggle: 15 MP/Counter]</span> <br><b>+10% Parry Chance</b>. Successful Parry triggers a <b>50% Dmg Counter-Attack</b>.",
        parents: ['piercing_fang'],
        effect: { toggle: 'quicksilver_reaction' }
    },

    // 2C. Stillness of Mind (Standing Elegance)
    'standing_elegance': {
        name: "Stillness of Mind",
        type: 'passive',
        branch: 'Dexterity',
        weaponReq: 'Thrusting Sword',
        description: "\"Motion is necessary, but stillness is deadly. Strike from the void of movement.\" <br><span class='text-cyan-300'>[Passive]</span> <br>If you haven't moved this turn: <b>+10% Damage</b> and <b>+0.2x Crit Multiplier</b>.",
        parents: ['piercing_fang'],
        effect: { type: 'standing_bonus' }
    },

    // 3A. Sanguine Tithe (Blood Tax) - Child of Million-Stabs
    'blood_tax': {
        name: "Sanguine Tithe",
        type: 'passive',
        branch: 'Dexterity',
        weaponReq: 'Thrusting Sword',
        description: "\"Every drop they bleed fuels your next strike.\" <br><span class='text-cyan-300'>[Passive Upgrade]</span> <br><b>Million-Stabs</b> dmg increased to <b>50% / 75%</b>. Each hit heals <b>1% Max HP</b>.",
        parents: ['rapid_strike'],
        effect: { type: 'rapier_bleed_heal' }
    },

    // 3B. Celerity (Heightened Speed) - Child of Million-Stabs + Quicksilver
    'heightened_speed': {
        name: "Celerity",
        type: 'synergy',
        branch: 'Dexterity',
        weaponReq: 'Thrusting Sword',
        description: "\"Faster than the eye can follow.\" <br><span class='text-yellow-300'>[Synergy: Stabs + Reflex]</span> <br>If <b>Quicksilver</b> is active: <b>Million-Stabs</b> hits <b>6 times</b> (30%) + <b>2 Heavy</b> (40%). (Scales with Tithe).",
        parents: ['rapid_strike', 'quicksilver_reaction'],
        effect: { type: 'rapier_speed_buff' }
    },

    // 3C. The Monarch's Sight (Royal Third Eye) - Child of Quicksilver
    'royal_third_eye': {
        name: "The Monarch's Sight",
        type: 'passive',
        branch: 'Dexterity',
        weaponReq: 'Thrusting Sword',
        description: "\"See the flow of battle before it happens.\" <br><span class='text-cyan-300'>[Passive]</span> <br>Armor/Shield Dodge & Block bonuses increased by <b>50%</b>. <b>Quicksilver</b> gains <b>+10% Parry</b> and Counter deals <b>75% Dmg</b>.",
        parents: ['quicksilver_reaction'],
        effect: { type: 'royal_defense_buff' }
    },

    // 3D. Viper's Bite (Tripping Blow) - Child of Quicksilver + Stillness
    'tripping_blow': {
        name: "Viper's Bite",
        type: 'toggle',
        branch: 'Dexterity',
        weaponReq: 'Thrusting Sword',
        description: "\"Sweep the leg. End the fight.\" <br><span class='text-purple-300'>[Toggle: 15 MP/Hit]</span> <br>Requires <b>Stillness of Mind</b>. Attacks have <b>20% Chance</b> to Trip (Stun 1 turn, -25% Def).",
        parents: ['quicksilver_reaction', 'standing_elegance'],
        effect: { toggle: 'tripping_blow' }
    },

    // 3E. Heart-Piercer (Needle Shot) - Child of Stillness
    'needle_shot': {
        name: "Heart-Piercer",
        type: 'active',
        branch: 'Dexterity',
        weaponReq: 'Thrusting Sword',
        description: "\"One thrust, one kill.\" <br><span class='text-red-300'>[Rapier Art] [Cost: 25 MP]</span> <br>Strike for <b>200% Damage</b>. <b>+10% Crit Chance</b>, <b>+0.5x Crit Mult</b>, ignores <b>10% Defense</b>.",
        parents: ['standing_elegance'],
        effect: { action: 'needle_shot', cost: 25 }
    },

    // 3F. Grand Duelist's Circle (Zone of Death) - Child of Stillness + Million-Stabs
    'zone_of_death': {
        name: "Grand Duelist's Circle",
        type: 'toggle',
        branch: 'Dexterity',
        weaponReq: 'Thrusting Sword',
        description: "\"This space belongs to you. Anyone who enters, dies.\" <br><span class='text-purple-300'>[Stance]</span> <br><b>+1 Range</b>. <b>Million-Stabs</b> targets up to <b>3 Enemies</b>, distributing hits equally.",
        parents: ['standing_elegance', 'rapid_strike'],
        effect: { toggle: 'zone_of_death' }
    },
    // --- CURVED SWORD BRANCH ---

    // 0. Blade Waltz (Root)
    'certificate_of_dance': {
        name: "Blade Waltz",
        type: 'passive',
        branch: 'Dexterity',
        weaponReq: 'Curved Sword',
        description: "\"To stop moving is to die. Combat is a dance, and you lead the tempo.\" <br><span class='text-cyan-300'>[Curved Sword Passive]</span> <br>Gain <b>Evasion</b> (1 turn) after attacking.",
        parents: ['focal_agility'],
        effect: { type: 'curved_sword_move' }
    },

    // 1. Twin-Moon Crescent (Child of Blade Waltz)
    'sword_dance': {
        name: "Twin-Moon Crescent",
        type: 'passive',
        branch: 'Dexterity',
        weaponReq: 'Curved Sword',
        description: "\"Two moons in the sky, two blades in the flesh. Why strike once when the rhythm demands twice?\" <br><span class='text-cyan-300'>[Passive Upgrade]</span> <br>Curved Sword attacks hit <b>Twice</b> for <b>60% Damage</b> each.",
        parents: ['certificate_of_dance'],
        effect: { type: 'double_hit_curved' }
    },

    // 2. Tidal Momentum (Child of Blade Waltz)
    'flowing_curvature': {
        name: "Tidal Momentum",
        type: 'toggle',
        branch: 'Dexterity',
        weaponReq: 'Curved Sword',
        description: "\"Be the wave that crashes, recedes, and crashes again.\" <br><span class='text-purple-300'>[Stance: Toggle]</span> <br>Moving adjacent to an enemy instantly deals <b>75% Damage</b>. Consumes <b>10 MP per hit</b>.",
        parents: ['certificate_of_dance'],
        effect: { toggle: 'flowing_curvature' }
    },

    // 3. Cardinal Bloom (Child of Blade Waltz)
    'flash_of_flurry': {
        name: "Cardinal Bloom",
        type: 'active',
        branch: 'Dexterity',
        weaponReq: 'Curved Sword',
        // Updated Description: 30% Damage
        description: "\"A flower of steel blooming in all directions.\" <br><span class='text-red-300'>[Curved Sword Art] [Cost: 25 MP]</span> <br>Deals <b>30% Damage</b> 4 times to all enemies in the <b>4 Cardinal Directions</b> (adjacent).",
        parents: ['certificate_of_dance'],
        effect: { action: 'flash_of_flurry', cost: 25 }
    },

    // 4. Dervish's Grace (Child of Twin-Moon Crescent)
    'pure_elegance': {
        name: "Dervish's Grace",
        type: 'toggle',
        branch: 'Dexterity',
        weaponReq: 'Curved Sword',
        description: "\"Spin until the world blurs into red. The dance only ends when the music stops.\" <br><span class='text-purple-300'>[Stance: Toggle] [15 MP/Turn]</span> <br><b>Twin-Moon Crescent</b> now hits <b>4 Times</b> at <b>40% Damage</b> each.",
        parents: ['sword_dance'],
        effect: { toggle: 'pure_elegance' }
    },

    // 5. Unending Flow (Child of Twin-Moon + Tidal Momentum)
    'eternal_dance': {
        name: "Unending Flow",
        type: 'active',
        branch: 'Dexterity',
        weaponReq: 'Curved Sword',
        description: "\"The river does not stop for the stone; it wears it down.\" <br><span class='text-red-300'>[Curved Sword Art]</span> <br><b>Inactive Tidal:</b> Pay 20 MP to buff Twin-Moon (+10%) & Dervish (+5%) dmg. <br><b>Active Tidal:</b> Consumes <b>ALL MP</b>. Deal 1 hit (30% Dmg) per 10 MP consumed.",
        parents: ['sword_dance', 'flowing_curvature'],
        effect: { action: 'eternal_dance', cost: 0 } // Dynamic Cost
    },

    // 6. Void-Step Strike (Child of Tidal Momentum)
    'flash_point': {
        name: "Void-Step Strike",
        type: 'active',
        branch: 'Dexterity',
        weaponReq: 'Curved Sword',
        // Updated Description: 100% Damage
        description: "\"Step through the cracks in reality. Appears behind them before they know they are dead.\" <br><span class='text-red-300'>[Curved Sword Art] [Cost: 25 MP]</span> <br>Dash through enemies (Range +2). Deals <b>100% Damage</b> ignoring Defense to all in path.",
        parents: ['flowing_curvature'],
        effect: { action: 'flash_point', cost: 25 }
    },
    'slipstream_cascade': {
        name: "Slipstream Cascade",
        type: 'synergy',
        branch: 'Dexterity',
        weaponReq: 'Curved Sword',
        description: "\"To the master of the curve, the air itself is a blade. The momentum of the pass leaves a vacuum that collapses violently.\" <br><span class='text-yellow-300'>[Synergy: Flowing Curvature + Flash of Flurry]</span> <br>The <b>Flowing Curvature</b> drive-by now creates a wind shear, dealing 50% damage to enemies horizontally or vertically adjacent to your primary target.",
        parents: ['flowing_curvature', 'flash_of_flurry'],
        effect: { type: 'passive_mod' }
    },
    // 8. Abyssal Bloom (Child of Cardinal Bloom)
    'void_flurry': {
        name: "Abyssal Bloom",
        type: 'passive',
        branch: 'Dexterity',
        weaponReq: 'Curved Sword',
        description: "\"The flower rots, the petals turn to void. Imbued with the power of Livyatan.\" <br><span class='text-cyan-300'>[Passive Upgrade]</span> <br><b>Cardinal Bloom</b> ignores <b>50% Defense</b> and hits <b>8 Tiles</b> (Diagonals included).",
        parents: ['flash_of_flurry'],
        effect: { type: 'void_flurry' }
    },

    // 9. Eclipse Dance (Child of Cardinal Bloom + Twin-Moon)
    'waltz_of_void_and_light': {
        name: "Eclipse Dance",
        type: 'synergy',
        branch: 'Dexterity',
        weaponReq: 'Curved Sword',
        description: "\"Light fades, void remains. The dance ends only when nothing is left.\" <br><span class='text-yellow-300'>[Synergy: Twin-Moon + Bloom]</span> <br>Requires <b>Twin-Moon Crescent</b>. <b>Cardinal Bloom</b> hits <b>+2 Times</b> (Total 6), but damage is reduced to <b>40%</b>.",
        parents: ['flash_of_flurry', 'sword_dance'],
        effect: { type: 'waltz_void_light' }
    },
    // Sub-Branch: Precision Training
    'precision_training': {
        name: "Predator's Eye",
        type: 'toggle',
        branch: 'Dexterity',
        description: "\"Narrow your world until only the target remains. The wind, the breath, the beat—all align into a single moment of violence.\" <br><span class='text-purple-300'>[Stance: Toggle]</span> <br><b>Bows:</b> +2 Range. <br><b>Daggers:</b> +10% Crit Chance.",
        parents: ['weapon_mastery_dex'],
        effect: { toggle: 'precision_training' }
    },
    // 1. Sky-Piercer (was Thunderbolt)
    'mighty_shot': {
        name: "Sky-Piercer",
        type: 'active',
        branch: 'Dexterity',
        weaponReq: 'Bow',
        // Updated Cost: 25
        description: "\"Draw the string until it creaks, then punch a hole in the sky. Let them hear the thunder of your release.\" <br><span class='text-red-300'>[Bow Art] [Cost: 25 MP]</span> <br>Devastating shot for <b>200% Damage</b> with high penetration.",
        parents: ['precision_training'],
        effect: { action: 'mighty_shot', cost: 25 } // Updated Cost
    },

    // 2. Hailstorm (was Barrage)
    'barrage': {
        name: "Hailstorm",
        type: 'toggle',
        branch: 'Dexterity',
        weaponReq: 'Bow',
        // Updated Description: 40% Damage
        description: "\"Rain death until the sky turns black.\" <br><span class='text-purple-300'>[Bow Stance]</span> <br>Attacks 3 times per turn at <b>40% Damage</b>. Costs <b>5 MP</b> per attack (15 MP/turn).",
        parents: ['mighty_shot'],
        effect: { toggle: 'barrage' }
    },
    // 7. Tri-Vector Shot (was Spreadshot)
    'spreadshot': {
        name: "Tri-Vector Shot",
        type: 'active',
        branch: 'Dexterity',
        weaponReq: 'Bow',
        description: "\"One eye, three targets. Efficiency is the sharpest arrow in the quiver.\" <br><span class='text-red-300'>[Bow Art] [Cost: 20 MP]</span> <br>Selects up to 3 Targets in range. Deals 80% of bow damage to each of them.",
        parents: ['mighty_shot'],
        effect: { action: 'spreadshot', cost: 20 }
    },

    // 4. Stalker's Gaze (was Hunter's Mark)
    'hunters_mark_skill': {
        name: "Stalker's Gaze",
        type: 'active',
        branch: 'Dexterity',
        weaponReq: 'Bow',
        description: "\"Paint the target. The universe will handle the rest.\" <br><span class='text-red-300'>[Bow Art] [Cost: 25 MP]</span> <br>Mark a target. They take <b>+20% Bow Damage</b> and <b>+0.5x Crit Multiplier</b>. Stacks with Ranger Mark.",
        parents: ['mighty_shot'],
        effect: { action: 'hunters_mark_skill', cost: 25 }  
    },
            // 3. Spectral Hail (was Soul Barrage)
    'soul_barrage': {
        name: "Spectral Hail",
        type: 'passive',
        branch: 'Dexterity',
        weaponReq: 'Bow',
        description: "\"Wood and steel can miss. The spirit, however, always finds its home.\" <br><span class='text-cyan-300'>[Passive Upgrade]</span> <br>Replaces Hailstorm. Attacks Three times per turn, dealing 75% of normal damage. Consumes 7MP per attack (21MP per turn).",
        parents: ['barrage'],
        effect: { type: 'barrage_upgrade' }
    },
    // 6. Cruel Opportunity (was Pin Cushion)
    'pin_cushion': {
        name: "Cruel Opportunity",
        type: 'synergy',
        branch: 'Dexterity',
        weaponReq: 'Bow',
        description: "\"A wounded beast is slow. A marked beast is already dead. Why stop shooting now?\" <br><span class='text-yellow-300'>[Synergy: Storm + Omen]</span> <br>When targeting a target marked with Stalker's Gaze, Hailstorm and Spectral Hail shoot an additional attack without cost.",
        parents: ['barrage', 'hunters_mark_skill'],
        effect: { type: 'pin_cushion' }
    },
    'shotgun_blast': {
        name: "Gale-Force Impact",
        type: 'passive',
        branch: 'Dexterity',
        weaponReq: 'Bow',
        description: "\"The arrow is merely the vessel. The wind is the hammer.\" <br><span class='text-cyan-300'>[Passive]</span> <br>Tri-Vector Shot now has a <b>20% Chance</b> to knock enemies back. Stacks with Air Enchantment.",
        parents: ['spreadshot'],
        effect: { type: 'shotgun_knockback' }
    },
        // 10. Eclipse of Steel (was Longbowman's Volley)
    'longbowmans_volley': {
        name: "Eclipse of Steel",
        type: 'synergy',
        branch: 'Dexterity',
        weaponReq: 'Bow',
        description: "\"Then we shall fight in the shade? No. They will die in the dark.\" <br><span class='text-yellow-300'>[Synergy: Storm + Trident]</span> <br>When Hailstorm or Spectral Hail is activated, it changes Tri-Vector Shot into <b>3 waves of Volley</b> (10 MP/wave).",
        parents: ['barrage', 'spreadshot'],
        effect: { type: 'volley_override' }
    },
    // 5. Titanfall (was Colossus Slayer)
    'colossus_slayer': {
        name: "Titanfall",
        type: 'passive',
        branch: 'Dexterity',
        weaponReq: 'Bow',
        description: "\"Gravity is a harsh mistress, but you are a harsher teacher. Bring them down.\" <br><span class='text-cyan-300'>[Passive]</span> <br>+1d8 Damage vs Marked targets. <b>+1d10</b> if the target is Legendary or Boss.",
        parents: ['hunters_mark_skill'],
        effect: { type: 'colossus_slayer' }
    },
    // 9. Cascading Dread (was Horde Breaker)
    'horde_breaker': {
        name: "Cascading Dread",
        type: 'synergy',
        branch: 'Dexterity',
        weaponReq: 'Bow',
        description: "\"Panic is a wildfire. All it takes is one spark to burn the whole pack.\" <br><span class='text-yellow-300'>[Synergy: Trident + Omen]</span> <br>When using Tri-Vector Shot, if one of the targets is a marked enemy, extends Stalker's Gaze and Titanfall’s effect to other targets.",
        parents: ['spreadshot', 'hunters_mark_skill'],
        effect: { type: 'horde_breaker' }
    },

    // 1. First Blood (Assassin's Whisper) - Root
    'sneak_attack': {
        name: "First Blood",
        type: 'passive',
        branch: 'Dexterity',
        weaponReq: 'Dagger',
        description: "\"The first cut is the deepest. Make it count.\" <br><span class='text-cyan-300'>[Dagger Passive]</span> <br>First attack in an encounter costs <b>15 MP</b> to deal a <b>Guaranteed Critical Hit</b>.",
        parents: ['precision_training'],
        effect: { type: 'assassins_whisper' }
    },

    // 2A. Phantom Throw (Daggershot Rune)
    'daggershot_rune': {
        name: "Phantom Throw",
        type: 'toggle',
        branch: 'Dexterity',
        weaponReq: 'Dagger',
        // Updated Description: 10 MP, 75% Damage
        description: "\"Your reach exceeds your grasp.\" <br><span class='text-purple-300'>[Dagger Stance] [10 MP/Shot]</span> <br><b>+2 Range</b>. Throws dagger for <b>75% Damage</b>.",
        parents: ['sneak_attack'],
        effect: { toggle: 'daggershot_rune' }
    },

    // 2B. Mug (Covet)
    'covet': {
        name: "Mug",
        type: 'active',
        branch: 'Dexterity',
        weaponReq: 'Dagger',
        description: "\"What is yours is mine.\" <br><span class='text-red-300'>[Dagger Art] [Cost: 15 MP]</span> <br>Deal <b>75% Damage</b>. Steal <b>Gold</b> (10% of drop) and roll for <b>Loot</b> (50% chance).",
        parents: ['sneak_attack'],
        effect: { action: 'covet', cost: 15 }
    },

    // 2C. Honed Edge (Sharpened Dagger)
    'sharpened_dagger': {
        name: "Honed Edge",
        type: 'passive',
        branch: 'Dexterity',
        weaponReq: 'Dagger',
        description: "\"Keener than a razor, colder than ice.\" <br><span class='text-cyan-300'>[Passive]</span> <br>Daggers gain <b>+10% Crit Chance</b> and <b>+0.5x Crit Multiplier</b>.",
        parents: ['sneak_attack'],
        effect: { type: 'dagger_crit_buff' }
    },

    // 3A. Fan of Knives (Scattershot Rune) - Child of Phantom Throw
    'scattershot_rune': {
        name: "Fan of Knives",
        type: 'passive',
        branch: 'Dexterity',
        weaponReq: 'Dagger',
        description: "\"One for you, one for you, and one for you.\" <br><span class='text-cyan-300'>[Passive Upgrade]</span> <br><b>Phantom Throw</b> hits enemies <b>Left and Right</b> of target.",
        parents: ['daggershot_rune'],
        effect: { type: 'scattershot' }
    },

    // 3B. Greed's Ricochet (Trickshot Rune) - Child of Phantom Throw + Mug
    'trickshot_rune': {
        name: "Greed's Ricochet",
        type: 'synergy',
        branch: 'Dexterity',
        weaponReq: 'Dagger',
        description: "\"Profit from every angle.\" <br><span class='text-yellow-300'>[Synergy: Throw + Mug]</span> <br>If <b>Phantom Throw</b> is active, <b>Mug</b> grants <b>+15% Gold/XP</b> on kill.",
        parents: ['daggershot_rune', 'covet'],
        effect: { type: 'trickshot_bonus' }
    },

    // 3C. Flicker Strike (Thief's Gambit) - Child of Mug
    'thiefs_gambit': {
        name: "Flicker Strike",
        type: 'active',
        branch: 'Dexterity',
        weaponReq: 'Dagger',
        description: "\"Now you see me... now you bleed.\" <br><span class='text-red-300'>[Dagger Art] [Cost: 20 MP]</span> <br>TeleFport. If near enemy, <b>Backstab</b> for <b>150% Damage</b> with <b>+10% Crit</b>.",
        parents: ['covet'],
        effect: { action: 'thiefs_gambit', cost: 30 }
    },

    // 3D. Vital Precision (Sneak Attack) - Child of Mug + Honed Edge
    'sneak_attack_passive': { // ID changed to avoid conflict with root
        name: "Vital Precision",
        type: 'synergy',
        branch: 'Dexterity',
        weaponReq: 'Dagger',
        description: "\"Twist the blade.\" <br><span class='text-yellow-300'>[Synergy: Mug + Edge]</span> <br>On <b>Critical Hit</b>, Dagger Base Dice are <b>Doubled</b> (e.g. 2d4).",
        parents: ['covet', 'sharpened_dagger'],
        effect: { type: 'sneak_attack_dice' }
    },

    // 3E. Serrated Mastery (Bloodcarver Dagger) - Child of Honed Edge
    'bloodcarver_dagger': {
        name: "Serrated Mastery",
        type: 'passive',
        branch: 'Dexterity',
        weaponReq: 'Dagger',
        description: "\"Let it flow.\" <br><span class='text-cyan-300'>[Passive]</span> <br><b>+50% Debuff Chance</b> (relative). <b>+50% Lifesteal</b> Amount.",
        parents: ['sharpened_dagger'],
        effect: { type: 'bloodcarver_buff' }
    },

    // 3F. Shadow Piercing (Slipshot Rune) - Child of Honed Edge + Phantom Throw
    'slipshot_rune': {
        name: "Shadow Piercing",
        type: 'synergy',
        branch: 'Dexterity',
        weaponReq: 'Dagger',
        description: "\"Through one, into another.\" <br><span class='text-yellow-300'>[Synergy: Edge + Throw]</span> <br><b>Phantom Throw</b> hits <b>Behind</b> target (50% Dmg). Throws ignore <b>50% Defense</b>.",
        parents: ['sharpened_dagger', 'daggershot_rune'],
        effect: { type: 'slipshot_pierce' }
    },

    // --- WEDGE B: STRENGTH (The Unmovable Mountain) ---
    'power_strengthening': {
        name: "Titanic Grip",
        type: 'passive',
        branch: 'Strength',
        description: "\"The giants of the Old World wielded mountains. We merely imitate them with steel, but the impact is no less devastating.\" <br><span class='text-red-300'>[Strength Passive]</span> <br>Deal <b>10% more damage</b> with Heavy Weapons.",
        parents: ['muscle_control'],
        effect: { type: 'weapon_class_boost', classes: ['Hand-to-Hand', 'Longsword', 'Axe', 'Hammer', 'Lance'], value: 0.10 }
    },
    
    'weapon_mastery_str': {
        name: "Crushing Weight",
        type: 'passive',
        branch: 'Strength',
        description: "\"Force equals mass times acceleration. You simply added more mass.\" <br><span class='text-yellow-300'>[Mastery: Weapon Upgrade]</span> <br>Increases the <b>Base Damage Dice</b> of all heavy weapons by one tier.",
        parents: ['power_strengthening'],
        effect: { type: 'dice_upgrade', classes: ['Hand-to-Hand', 'Longsword', 'Axe', 'Hammer', 'Lance'] }
    },  
    // Sub-Branch: Honor Bound
    // Sub-Branch: Honor Bound (Longsword Root)
    'honor_bound_teaching': {
        name: "The Knight's Code",
        type: 'passive',
        branch: 'Strength',
        description: "\"Stand firm against the tide. Honor is the weight of your boots on the ground.\" <br><span class='text-cyan-300'>[Passive]</span> <br><b>Longsword/Lance:</b> Gain Defense vs 1 enemy, or Damage vs 3+ enemies.",
        parents: ['weapon_mastery_str'],
        effect: { type: 'honor_bound_buff' }
    },

    // 1. Vengeful Guard (Parent of All 3 Paths)
    'riposte': {
        name: "Vengeful Guard",
        type: 'toggle',
        branch: 'Strength',
        weaponReq: 'Longsword',
        description: "\"Pain sharpens your strike. Let them hit you. It will be the last thing they do.\" <br><span class='text-purple-300'>[Longsword Stance]</span> <br>While active, automatically <b>Counter-Attack</b> when hit in melee (Cost: 15 MP).",
        parents: ['honor_bound_teaching'],
        effect: { toggle: 'riposte' }
    },

    // 2. Armor Cleave -> Sundering Hew (Child of Vengeful Guard)
    'armor_cleave': {
        name: "Sundering Hew",
        type: 'active',
        branch: 'Strength',
        weaponReq: 'Longsword',
        description: "\"Steel folds like paper if you strike the stress point with enough hatred.\" <br><span class='text-red-300'>[Longsword Art] [Cost: 20 MP]</span> <br>Deals <b>150% Damage</b>. Reduces target's <b>Defense by 50%</b> for 3 turns.",
        parents: ['riposte'],
        effect: { action: 'armor_cleave', cost: 20 }
    },

    // 3. Fool's Guard -> Gallows' Invitation (Child of Vengeful Guard)
    'fools_guard': {
        name: "Gallows' Invitation",
        type: 'toggle',
        branch: 'Strength',
        weaponReq: 'Longsword',
        description: "\"Lower your guard. Look weak. Invite them in, then snap the trap.\" <br><span class='text-purple-300'>[Longsword Stance]</span> <br><b>-25% Defense</b>. Increases <b>Block, Dodge, and Parry</b> chance by <b>30% (Multiplicative)</b>.",
        parents: ['riposte'],
        effect: { toggle: 'fools_guard' }
    },

    // 4. Quality Whetstone -> Razor Discipline (Child of Vengeful Guard)
    'quality_whetstone': {
        name: "Razor Discipline",
        type: 'passive',
        branch: 'Strength',
        weaponReq: 'Longsword',
        description: "\"A dull blade is a courtesy. You are not courteous.\" <br><span class='text-cyan-300'>[Passive]</span> <br>All Longsword attacks increase their <b>Damage Dice</b> by 1 step (e.g., d8 -> d10).",
        parents: ['riposte'],
        effect: { type: 'dice_upgrade', classes: ['Longsword'] }
    },

    // 5. Cleave Aura -> Resonant Fracture (Child of Sundering Hew)
    'cleave_aura': {
        name: "Resonant Fracture",
        type: 'passive',
        branch: 'Strength',
        weaponReq: 'Longsword',
        description: "\"The air itself should bleed when you swing.\" <br><span class='text-cyan-300'>[Passive Upgrade]</span> <br><b>Sundering Hew</b> deals <b>200% Damage</b>. It also launches a shockwave hitting enemies up to <b>3 tiles away</b> for 50% damage.",
        parents: ['armor_cleave'],
        effect: { type: 'cleave_upgrade' }
    },

    // 6. Mordhau -> The Murder-Stroke (Child of Sundering Hew + Gallows' Invitation)
    'mordhau': {
        name: "The Murder-Stroke",
        type: 'active',
        branch: 'Strength',
        weaponReq: 'Longsword',
        description: "\"Grip the blade. Smash with the hilt. It’s not elegant, but neither is a concussion.\" <br><span class='text-red-300'>[Longsword Art] [Cost: 10 MP]</span> <br>Requires <b>Gallows' Invitation</b>. Deals <b>75% Damage</b> and guarantees <b>Paralysis</b> (1 Turn).",
        parents: ['armor_cleave', 'fools_guard'],
        effect: { action: 'mordhau', cost: 10 }
    },

    // 7. Joker's Jest -> Scornful Slash (Child of Gallows' Invitation)
    'jokers_jest': {
        name: "Scornful Slash",
        type: 'active',
        branch: 'Strength',
        weaponReq: 'Longsword',
        description: "\"A slap with the flat of the blade hurts the pride more than the flesh.\" <br><span class='text-red-300'>[Longsword Art] [Cost: 10 MP]</span> <br>Decreases enemy <b>Attack and Defense by 20%</b> for 3 turns.",
        parents: ['fools_guard'],
        effect: { action: 'jokers_jest', cost: 10 }
    },

    // 8. Conniver's Backslash -> Traitor's Riposte (Child of Gallows' Invitation + Razor Discipline)
    'connivers_backslash': {
        name: "Traitor's Riposte",
        type: 'synergy',
        branch: 'Strength',
        weaponReq: 'Longsword',
        description: "\"They think they missed you. They don't realize they just missed their chance to live.\" <br><span class='text-yellow-300'>[Synergy: Lure + Razor]</span> <br>Requires <b>Razor Discipline</b>. While in <b>Gallows' Invitation</b>, Block/Dodge triggers a <b>50% Damage</b> counter-attack.",
        parents: ['fools_guard', 'quality_whetstone'],
        effect: { type: 'connivers_backslash' }
    },

    // 9. Serrated Blade -> Cruel Serration (Child of Razor Discipline)
    'serrated_blade': {
        name: "Cruel Serration",
        type: 'passive',
        branch: 'Strength',
        weaponReq: 'Longsword',
        description: "\"Cruel notches designed not just to cut, but to tear.\" <br><span class='text-cyan-300'>[Passive]</span> <br>Longswords have a <b>10% chance</b> to inflict Bleed (3 turns). Weapon Arts have a <b>20% chance</b>.",
        parents: ['quality_whetstone'],
        effect: { type: 'longsword_bleed' }
    },

    // 10. Heavy Guillotine -> Final Verdict (Child of Razor Discipline + Sundering Hew)
    'heavy_guillotine': {
        name: "Final Verdict",
        type: 'active',
        branch: 'Strength',
        weaponReq: 'Longsword',
        description: "\"A king without armor is just a man waiting to die.\" <br><span class='text-red-300'>[Longsword Art] [Cost: 30 MP]</span> <br>Deals <b>200% Damage</b>. If target's Defense is lowered (e.g., by Sundering Hew), this attack is a <b>Guaranteed Crit</b> dealing <b>3x Damage</b>.",
        parents: ['quality_whetstone', 'armor_cleave'],
        effect: { action: 'heavy_guillotine', cost: 30 }
    },
    'charge': {
        name: "Momentum",
        type: 'passive',
        branch: 'Strength',
        weaponReq: 'Lance',
        description: "\"A lance in motion is a siege engine. Become the battering ram. Newton's laws apply to goblins just as well as apples.\" <br><span class='text-cyan-300'>[Lance Passive]</span> <br>Move at least <b>2 tiles</b> before attacking to deal <b>50% more damage</b>.",
        parents: ['honor_bound_teaching'],
        effect: { type: 'charge_buff' }
    },

    // 2. Tempest Lance -> Storm-Caller's Throw (Child of Momentum)
    'tempest_lance': {
        name: "Tempest Lance", // Kept purely for structural integrity
        type: 'active',
        branch: 'Strength',
        weaponReq: 'Lance',
        description: "\"Hurl the spear with the force of a gale. Let it fly true.\" <br><span class='text-red-300'>[Lance Art] [Cost: 25 MP]</span> <br>Hurls the Lance dealing <b>200% Damage</b>. Range increased by <b>+2</b>.",
        parents: ['charge'],
        effect: { action: 'tempest_lance', cost: 25 }
    },
    // 3. Giant Hunt -> Behemoth Stalker (Child of Momentum)
    'giant_hunt': {
        name: "Behemoth Stalker",
        type: 'toggle',
        branch: 'Strength',
        weaponReq: 'Lance',
        description: "\"They call them monsters. You call them 'large targets.' There is a specific art to bleeding something that is larger than a house.\" <br><span class='text-purple-300'>[Lance Stance] [15 MP/Attack]</span> <br><b>+10% Damage</b> per Rarity level above Common. <b>+10% vs Bosses</b>.",
        parents: ['charge'],
        effect: { toggle: 'giant_hunt' }
    },

    // 4. Phalanx Formation -> Iron Bastion (Child of Momentum)
    'phalanx_formation': {
        name: "Iron Bastion",
        type: 'toggle',
        branch: 'Strength',
        weaponReq: 'Lance',
        description: "\"One man is a warrior. One man who refuses to move is a wall. Plant your feet and become the boundary line.\" <br><span class='text-purple-300'>[Lance Stance]</span> <br><b>+30% Defense</b> but <b>Immobile</b>. Enemies entering Lance range take <b>50% Damage</b> immediately.",
        parents: ['charge'],
        effect: { toggle: 'phalanx_formation' }
    },

    // 5. Thunderous Tempest -> Forked Lightning (Child of Storm-Caller's Throw)
    'thunderous_tempest': {
        name: "Forked Lightning",
        type: 'passive',
        branch: 'Strength',
        weaponReq: 'Lance',
        description: "\"Lightning follows the path of least resistance. So does death.\" <br><span class='text-cyan-300'>[Passive Upgrade]</span> <br><b>Storm-Caller's Throw</b> arcs to 2 enemies within 1 tile of the target for <b>50% Damage</b>.",
        parents: ['tempest_lance'],
        effect: { type: 'tempest_arc' }
    },

    // 6. Mortal Smite -> Titan-Bane Penetration (Child of Storm-Caller + Behemoth Stalker)
    'mortal_smite': {
        name: "Titan-Bane Penetration",
        type: 'synergy',
        branch: 'Strength',
        weaponReq: 'Lance',
        description: "\"Armor is just a suggestion. Scales are just texture. When you aim for the heart of a god, physics is merely an obstacle to be ignored.\" <br><span class='text-yellow-300'>[Synergy: Stalker + Tempest]</span> <br>If <b>Behemoth Stalker</b> is active: <b>Tempest Lance</b> pierces Defense (scales with Rarity). Vs Legend/Boss: <b>+1 Range, +50% Base Dmg</b>.",
        parents: ['tempest_lance', 'giant_hunt'],
        effect: { type: 'mortal_smite' }
    },

    // 7. Divine Slayer -> God-Eater (Child of Behemoth Stalker)
    'divine_slayer': {
        name: "God-Eater",
        type: 'passive',
        branch: 'Strength',
        weaponReq: 'Lance',
        description: "\"If it bleeds, we can kill it. If it doesn't bleed, we will carve until we find something that does.\" <br><span class='text-cyan-300'>[Passive]</span> <br>Against Legendary/Boss enemies, increase <b>Dice Progression by 2 steps</b> (e.g., d8 becomes d12).",
        parents: ['giant_hunt'],
        effect: { type: 'divine_slayer' }
    },

    // 8. World Turtle Formation -> Aspidochelone Stance (Child of Behemoth Stalker + Iron Bastion)
    'world_turtle_formation': {
        name: "Aspidochelone Stance",
        type: 'toggle',
        branch: 'Strength',
        weaponReq: 'Lance',
        description: "\"The Island Turtle. The world rests on your back. You are not just a soldier; you are the terrain. Let them break their waves against your shore.\" <br><span class='text-purple-300'>[Synergy Toggle] [15 MP/Turn]</span> <br>Requires <b>Stalker & Bastion</b> active. Defense bonus becomes <b>50%</b>. Opportunity attack triggers on <b>ANY enemy move</b> in range.",
        parents: ['giant_hunt', 'phalanx_formation'],
        effect: { toggle: 'world_turtle_formation' }
    },

    // 9. Absolute Defense -> Aegis of the Legion (Child of Iron Bastion)
    'absolute_defense': {
        name: "Aegis of the Legion",
        type: 'passive',
        branch: 'Strength',
        weaponReq: 'Lance',
        description: "\"A shield held only for oneself is vanity. A shield extended to a brother is victory.\" <br><span class='text-cyan-300'>[Passive]</span> <br><b>+10% Block</b>. Allies within Lance range gain your <b>Iron Bastion</b> Defense bonus.",
        parents: ['phalanx_formation'],
        effect: { type: 'absolute_defense' }
    },

    // 10. Last Stand -> The Final Horizon (Child of Iron Bastion + Storm-Caller)
    'last_stand': {
        name: "The Final Horizon",
        type: 'active',
        branch: 'Strength',
        weaponReq: 'Lance',
        description: "\"The sun is setting. Make sure it sets on them, not us. Scream defiance until the void blinks.\" <br><span class='text-red-300'>[Lance Art] [Cost: 50 MP]</span> <br><b>+25% Atk/Def</b>. Cannot Flee. Next <b>Tempest Lance</b> becomes a Charge (automatically triggers Momentum).",
        parents: ['phalanx_formation', 'tempest_lance'],
        effect: { action: 'last_stand', cost: 50 }
    },
    // Sub-Branch: Barbaric Strength
    'barbaric_strength': {
        name: "Reckless Abandon",
        type: 'toggle',
        branch: 'Strength',
        description: "\"Defense is for those who plan to live forever. You plan to live loudly.\" <br><span class='text-purple-300'>[Stance: Toggle]</span> <br>While active, deal <b>25% more damage</b>, but take <b>15% more damage</b>.",
        parents: ['weapon_mastery_str'],
        effect: { toggle: 'barbaric_strength' }
    },
    // 0. Bone-Breaker Flurry (was Pummel)
    'savage_beast_claw': {
        name: "Bone-Breaker Flurry",
        type: 'active',
        branch: 'Strength',
        weaponReq: 'Hand-to-Hand',
        description: "\"Violence in its purest form. No steel, only bone, blood, and the sound of snapping cartilage.\" <br><span class='text-red-300'>[Fist Art] [Cost: 25 MP]</span> <br>Unleash a barrage of 5 rapid punches, dealing <b>35% damage</b> each.",
        parents: ['barbaric_strength'],
        effect: { action: 'savage_beast_claw', cost: 25 }
    },

    // 1. Iron-Root Stance (was Fist of Steel)
    'iron_mountain_stance': {
        name: "Iron-Root Stance",
        type: 'toggle',
        branch: 'Strength',
        weaponReq: 'Hand-to-Hand',
        description: "\"Become the mountain. Immovable. Unbreakable. The storm breaks against you, not the other way around.\" <br><span class='text-purple-300'>[Fist Stance] [5 MP/Turn]</span> <br><b>+50% Defense</b>. Fists deal <b>+1d4 Damage</b>. Movement Speed reduced to <b>1 tile</b>.",
        parents: ['savage_beast_claw'],
        effect: { toggle: 'iron_mountain' }
    },

    // 2. Resonant Palm (was Palm Blast / Glacial Palm)
    'glacial_palm': {
        name: "Resonant Palm",
        type: 'active',
        branch: 'Strength',
        weaponReq: 'Hand-to-Hand',
        description: "\"Condense your ki into a singularity. Strike not the flesh, but the vibrations that hold it together.\" <br><span class='text-red-300'>[Fist Art] [Cost: 30 MP]</span> <br>Prepares an attack for 1 turn. On the next turn, deals <b>250% Damage</b> that ignores <b>50% Defense</b>.",
        parents: ['savage_beast_claw'],
        effect: { action: 'glacial_palm', cost: 30 }
    },

    // 3. Naked Tranquility (Unchanged name, matches theme)
    'way_of_empty_hand': {
        name: "Naked Tranquility",
        type: 'passive',
        branch: 'Strength',
        weaponReq: 'Hand-to-Hand',
        description: "\"Steel is a crutch. Armor is a cage. To be truly lethal, one must be unburdened.\" <br><span class='text-cyan-300'>[Unarmored Passive]</span> <br>If wearing No Armor with Fists: <b>Double Base Defense</b>, enable <b>10% Dodge</b> and <b>10% Block</b>.",
        parents: ['savage_beast_claw'],
        effect: { type: 'empty_hand' }
    },

    // 4. Meteor Drop (was Adamantium Body Press / Avalanche Drop)
    'avalanche_drop': {
        name: "Meteor Drop",
        type: 'active',
        branch: 'Strength',
        weaponReq: 'Hand-to-Hand',
        description: "\"Gravity is the ultimate weapon. Fall upon them like a star dying in the cold sky.\" <br><span class='text-red-300'>[Fist Art] [Cost: 25 MP]</span> <br><b>150% Damage</b>. <b>25% Paralyze</b> chance. Adds <b>50% Damage</b> scaling based on your <b>Physical Defense</b>.",
        parents: ['iron_mountain_stance'],
        effect: { action: 'avalanche_drop', cost: 25 }
    },

    // 5. Gear Grinder -> Tectonic Shift (Keep Tectonic Shift)
    'tectonic_shift': {
        name: "Tectonic Shift",
        type: 'passive',
        branch: 'Strength',
        weaponReq: 'Hand-to-Hand',
        description: "\"When the earth moves, it does not strike once. It grinds until nothing is left.\" <br><span class='text-cyan-300'>[Fist Passive]</span> <br>If <b>Iron-Root Stance</b> is active, <b>Resonant Palm</b> becomes a 3-hit chain dealing <b>100% Damage</b> each.",
        parents: ['iron_mountain_stance', 'glacial_palm'], 
        effect: { type: 'tectonic_shift' }
    },

    // 6. Concussive Blast (Keep name, fits theme)
    'shatterpoint_impact': {
        name: "Concussive Blast",
        type: 'passive',
        branch: 'Strength',
        weaponReq: 'Hand-to-Hand',
        description: "\"Flesh ripples. Bone resonates. Strike the frequency, and the structure fails.\" <br><span class='text-cyan-300'>[Fist Passive]</span> <br>Fist Arts gain a <b>10% Chance</b> to Paralyze (1 turn). Stacks with other sources.",
        parents: ['glacial_palm'],
        effect: { type: 'shatterpoint' }
    },

    // 7. Aero-Vajra (was Compressed Air Blast / Vacuum Fist)
    'vacuum_fist': {
        name: "Aero-Vajra",
        type: 'toggle',
        branch: 'Strength',
        weaponReq: 'Hand-to-Hand',
        description: "\"Strike with such velocity that the air itself becomes a spear.\" <br><span class='text-purple-300'>[Fist Stance]</span> <br>Requires <b>Naked Tranquility</b>. Fist Arts gain <b>+2 Range</b> and <b>Pierce</b> (50% dmg to collaterals). <b>+10 MP Cost</b>.",
        parents: ['glacial_palm', 'way_of_empty_hand'],
        effect: { toggle: 'vacuum_fist' }
    },

    // 8. Swift Agility (Keep Name)
    'flowing_water': {
        name: "Swift Agility",
        type: 'passive',
        branch: 'Strength',
        weaponReq: 'Hand-to-Hand',
        description: "\"Be like water. Crash like a wave, retreat like the tide.\" <br><span class='text-cyan-300'>[Unarmored Passive]</span> <br>Improves <b>Naked Tranquility</b>: <b>+2 Move Speed</b> and gain a 3rd follow-up attack (50% Damage).",
        parents: ['way_of_empty_hand'],
        effect: { type: 'flowing_water' }
    },

    // 9. Unarmed Mastery (Keep Name)
    'titans_grip': {
        name: "Unarmed Mastery",
        type: 'passive',
        branch: 'Strength',
        weaponReq: 'Hand-to-Hand',
        description: "\"Your grip is so absolute you can wield a bulwark without losing the lethality of your fist.\" <br><span class='text-cyan-300'>[Passive]</span> <br>While <b>Iron-Root Stance</b> is active, you may equip a <b>Shield</b> or <b>Catalyst</b> alongside Fists.",
        parents: ['way_of_empty_hand', 'iron_mountain_stance'],
        effect: { type: 'titans_grip' }
    },
    // 1. Swinging Momentum (Root)
    'swinging_momentum': {
        name: "Swinging Momentum",
        type: 'passive',
        branch: 'Strength',
        weaponReq: 'Hammer',
        description: "\"Rhythm is power. Once the pendulum starts, nothing stops it.\" <br><span class='text-cyan-300'>[Hammer Passive]</span> <br>Consecutive hits on same target add <b>+10% Damage</b> (Max 50%). Resets on move/switch.",
        parents: ['barbaric_strength'],
        effect: { type: 'hammer_momentum' }
    },

    // 2A. Impact Tremor (Child of Momentum)
    'impact_tremor': {
        name: "Impact Tremor",
        type: 'active',
        branch: 'Strength',
        weaponReq: 'Hammer',
        // Updated Cost: 25
        description: "\"Shatter their footing and the earth will swallow them whole.\" <br><span class='text-red-300'>[Hammer Art] [Cost: 25 MP]</span> <br>Slam ground for <b>100% Dmg</b> + Splash (Neighbors take 50%).",
        parents: ['swinging_momentum'],
        effect: { action: 'impact_tremor', cost: 25 } // Updated Cost
    },

    // 2B. Dwarven Battle Arts (Child of Momentum)
    'dwarven_battle_arts': {
        name: "Dwarven Battle Arts",
        type: 'passive',
        branch: 'Strength',
        weaponReq: 'Hammer',
        description: "\"Ancient techniques of stone and steel.\" <br><span class='text-cyan-300'>[Passive]</span> <br><b>+10% Atk/Def</b> with Hammers. <b>+10% Drop Rate</b> for Equipment & Gold.",
        parents: ['swinging_momentum'],
        effect: { type: 'dwarf_arts_buff' }
    },

    // 2C. Titan's Swing (Child of Momentum)
    'titan_swing': {
        name: "Titan's Swing",
        type: 'toggle',
        branch: 'Strength',
        weaponReq: 'Hammer',
        description: "\"Strike with the strength of giants.\" <br><span class='text-purple-300'>[Toggle: 10 MP/Turn]</span> <br><b>+10% Dmg</b>. <b>50% Knockback Chance</b>. <b>-1 Move Speed</b>.",
        parents: ['swinging_momentum'],
        effect: { toggle: 'titan_swing' }
    },

    // 3A. Meteoric Impact (Heavy Meteoric Charge) - Child of Impact Tremor
    'heavy_meteoric_charge': {
        name: "Meteoric Impact",
        type: 'active',
        branch: 'Strength',
        weaponReq: 'Hammer',
        // Updated Description: 200% / 100%
        description: "\"Become the comet.\" <br><span class='text-red-300'>[Hammer Art] [Cost: 50 MP]</span> <br>Charge 2 tiles. Slam for <b>200% Dmg</b> (Target) / <b>100% Dmg</b> (8 Neighbors). <b>+50% Paralyze Chance</b>.",
        parents: ['impact_tremor'],
        effect: { action: 'heavy_meteoric_charge', cost: 50 }
    },

    // 3B. Masterwork Haft (High Quality Hammer) - Child of Impact Tremor + Dwarven Arts
    'high_quality_hammer': {
        name: "Masterwork Haft",
        type: 'passive',
        branch: 'Strength',
        weaponReq: 'Hammer',
        description: "\"Balance is key. A better tool makes for a better strike.\" <br><span class='text-cyan-300'>[Synergy: Tremor + Dwarf]</span> <br><b>Impact Tremor</b> & <b>Meteoric Impact</b> deal <b>+50% Damage</b>.",
        parents: ['impact_tremor', 'dwarven_battle_arts'],
        effect: { type: 'hq_hammer' }
    },

    // 3C. Rune of the Mountain (Mountain Magic Arts) - Child of Dwarven Arts
    'mountain_magic_arts': {
        name: "Rune of the Mountain",
        type: 'toggle',
        branch: 'Strength',
        weaponReq: 'Hammer',
        description: "\"The earth lends its weight. The stone lends its certainty.\" <br><span class='text-purple-300'>[Toggle]</span> <br>Secondary Effects trigger <b>2x more often</b>. Hammers gain <b>5% Crit</b> / <b>2.0x Crit Dmg</b>.",
        parents: ['dwarven_battle_arts'],
        effect: { toggle: 'mountain_magic_arts' }
    },

    // 3D. Landslide Stance (Landslide Movement Arts) - Child of Dwarven Arts + Titan Swing
    'landslide_movement_arts': {
        name: "Landslide Stance",
        type: 'passive',
        branch: 'Strength',
        weaponReq: 'Hammer',
        description: "\"Unstoppable force meets movable object.\" <br><span class='text-cyan-300'>[Synergy: Dwarf + Titan]</span> <br>Buffs <b>Dwarven Battle Arts</b> to <b>15%</b>. If <b>Titan's Swing</b> knocks back, <b>Chase & Hit</b> (25% Dmg).",
        parents: ['dwarven_battle_arts', 'titan_swing'],
        effect: { type: 'landslide_arts' }
    },

    // 3E. Reach of the Colossus (Titan's Range) - Child of Titan Swing
    'titans_range': {
        name: "Reach of the Colossus",
        type: 'passive',
        branch: 'Strength',
        weaponReq: 'Hammer',
        description: "\"Nowhere to hide.\" <br><span class='text-cyan-300'>[Passive]</span> <br><b>+1 Hammer Range</b>. <b>+1 Meteoric Impact Range</b>. <b>Titan's Swing</b> Knockback becomes <b>100%</b>.",
        parents: ['titan_swing'],
        effect: { type: 'titans_range' }
    },

    // 3F. Seismic Reshaping (Divine Mining Arts) - Child of Titan Swing + Impact Tremor
    'divine_mining_arts': {
        name: "Seismic Reshaping",
        type: 'passive',
        branch: 'Strength',
        weaponReq: 'Hammer',
        description: "\"The world is your anvil.\" <br><span class='text-cyan-300'>[Synergy: Titan + Tremor]</span> <br>If <b>Titan's Swing</b> active: <b>Impact Tremor</b> deals <b>150% Dmg</b> + Extended Splash (Cross). <b>Meteoric Impact</b> gains Extended Splash (75%).",
        parents: ['titan_swing', 'impact_tremor'],
        effect: { type: 'divine_mining' }
    }, 
    // 1. Hewing Strikes (Root)
    'woodcutter': {
        name: "Hewing Strikes",
        type: 'passive',
        branch: 'Strength',
        weaponReq: 'Axe',
        description: "\"A tree falls one chop at a time. A giant falls the same way.\" <br><span class='text-cyan-300'>[Axe Passive]</span> <br>Consecutive hits on the same target reduce their <b>Defense by 5%</b> (Stacks up to 5 times).",
        parents: ['barbaric_strength'],
        effect: { type: 'hewing_strikes' }
    },

    // 2A. Tomahawk Hurl (Hatchet Throw) - Child of Hewing
    'tomahawk_hurl': {
        name: "Tomahawk Hurl",
        type: 'active',
        branch: 'Strength',
        weaponReq: 'Axe',
        // [FIX] Updated Description to reflect 150% Base (Synergy brings it to 200%)
        description: "\"If you can't reach them, bring the edge to them.\" <br><span class='text-red-300'>[Axe Art] [Cost: 25 MP]</span> <br>Throw axe at <b>Range +2</b> for <b>150% Damage</b>. <b>+10% Crit Chance</b> & <b>1.5x Crit Dmg</b>.",
        parents: ['woodcutter'],
        effect: { action: 'tomahawk_hurl', cost: 25 }
    },
    // 2B. Crimson Feast (Blood Butchery) - Child of Hewing
    'crimson_feast': {
        name: "Crimson Feast",
        type: 'toggle',
        branch: 'Strength',
        weaponReq: 'Axe',
        description: "\"The beast feeds to live. You live to feed.\" <br><span class='text-purple-300'>[Toggle: 10 MP/Turn]</span> <br>Axe hits recover <b>5% Max HP</b>.",
        parents: ['woodcutter'],
        effect: { toggle: 'crimson_feast' }
    },

    // 2C. Scavenger's Eye (Berserker's Instinct) - Child of Hewing
    'scavengers_eye': {
        name: "Scavenger's Eye",
        type: 'passive',
        branch: 'Strength',
        weaponReq: 'Axe',
        description: "\"In the harsh north, nothing is wasted. Bones, meat, scrap... it all has value.\" <br><span class='text-cyan-300'>[Passive]</span> <br><b>+10% Drop Rate</b> for Ingredients and Junk items.",
        parents: ['woodcutter'],
        effect: { type: 'scavenger_loot' }
    },

    // 3A. Earth-Splitter (Mountain Carver) - Child of Tomahawk
    'earth_splitter': {
        name: "Earth-Splitter",
        type: 'active',
        branch: 'Strength',
        weaponReq: 'Axe',
        // Updated Cost: 50
        description: "\"Sunder the ground they stand on.\" <br><span class='text-red-300'>[Axe Art] [Cost: 50 MP]</span> <br>Slam ground for <b>200% Damage</b> in a <b>3-tile Cone</b>. Applies <b>2 Stacks</b> of Hewing Strikes.",
        parents: ['tomahawk_hurl'],
        effect: { action: 'earth_splitter', cost: 50 } // Updated Cost
    },

    // 3B. Predator's Wisdom (Hunter's Knowledge) - Child of Tomahawk + Crimson Feast
    'predators_wisdom': {
        name: "Predator's Wisdom",
        type: 'synergy',
        branch: 'Strength',
        weaponReq: 'Axe',
        description: "\"Know where the blood flows deepest.\" <br><span class='text-yellow-300'>[Synergy: Feast + Hurl]</span> <br>If <b>Crimson Feast</b> active: Normal Attacks gain <b>+5% Crit</b>. <b>Tomahawk Hurl</b> gains <b>+15% Crit / 2.0x Mult</b>. <b>Earth-Splitter</b> adds 3 stacks.",
        parents: ['tomahawk_hurl', 'crimson_feast'],
        effect: { type: 'predators_wisdom' }
    },

    // 3C. Rite of the Old Gods (Northlander's Ritual) - Child of Crimson Feast
    'rite_old_gods': {
        name: "Rite of the Old Gods",
        type: 'toggle',
        branch: 'Strength',
        weaponReq: 'Axe',
        description: "\"Blood for power. A fair trade in the frozen wastes.\" <br><span class='text-purple-300'>[Toggle]</span> <br>Lose <b>5% HP/Turn</b> to gain <b>5% MP/Turn</b>. While active, <b>Crimson Feast</b> costs <b>0 MP</b>.",
        parents: ['crimson_feast'],
        effect: { toggle: 'rite_old_gods' }
    },

    // 3D. Gore-Crazed Howl (Bloodlust Rage) - Child of Crimson Feast + Scavenger's Eye
    'gore_crazed_howl': {
        name: "Gore-Crazed Howl",
        type: 'active',
        branch: 'Strength',
        weaponReq: 'Axe',
        description: "\"Let the red mist descend.\" <br><span class='text-red-300'>[Buff Art] [Cost: 25 MP]</span> <br><b>+50% Dmg</b>, <b>-50% Def</b> (3 Turns). Stacks with Enrage. If <b>Scavenger's Eye</b> unlocked: Normal Attacks become a <b>3-Hit Chain</b> (50% Dmg each).",
        parents: ['crimson_feast', 'scavengers_eye'],
        effect: { action: 'gore_crazed_howl', cost: 25 }
    },
    'iron_stomach': {
        name: "Iron Stomach",
        type: 'passive',
        branch: 'Strength',
        weaponReq: 'Axe',
        description: "\"If it doesn't kill you, it feeds you.\" <br><span class='text-cyan-300'>[Passive]</span> <br>HP/MP Potions restore <b>25% more</b>. Buff potions last <b>25% longer</b>.",
        parents: ['scavengers_eye'],
        effect: { type: 'potion_boost' }
    },

    // 3F. Head-Hunter's Discipline (Precision Training) - Child of Scavenger's Eye + Tomahawk
    'head_hunters_discipline': {
        name: "Head-Hunter's Discipline",
        type: 'synergy',
        branch: 'Strength',
        weaponReq: 'Axe',
        description: "\"Chaos is useful. Controlled chaos is deadly.\" <br><span class='text-yellow-300'>[Synergy: Scavenger + Hurl]</span> <br><b>Tomahawk Hurl</b>: +1 Range, +50% Dmg. <b>Scavenger's Eye</b>: Now grants <b>+10% XP & Gold</b>.",
        parents: ['scavengers_eye', 'tomahawk_hurl'],
        effect: { type: 'precision_training' }
    },
    'heavy_armor_proficiency': {
        name: "Iron Clad",
        type: 'passive',
        branch: 'Strength',
        armorReq: 'Heavy',
        description: "\"The weight of steel is a comfort, a wall between you and the void. Let them break their weapons on your skin.\" <br><span class='text-cyan-300'>[Defense Passive]</span> <br>While wearing Heavy Armor, you gain <b>+5% Block Chance</b>.",
        parents: ['power_strengthening'],
        effect: { type: 'heavy_armor_block', value: 0.05 }
    },

    // 2. Metallurgy (Child of Iron Clad)
    'high_quality_alloy': {
        name: "Metallurgy",
        type: 'passive',
        branch: 'Strength',
        armorReq: 'Heavy',
        description: "\"Secrets of folding steel, learned from the deep dwarves. It does not bend; it breaks others.\" <br><span class='text-cyan-300'>[Defense Passive]</span> <br>Your Heavy Armor provides <b>20% more Defense</b> value.",
        parents: ['heavy_armor_proficiency'],
        effect: { type: 'heavy_armor_def_mult', value: 1.2 }
    },

    // 3. Logistics of War / Cheap Steel (Child of Metallurgy)
    'logistics_of_war': { 
        name: "Logistics of War",
        type: 'passive',
        branch: 'Strength',
        armorReq: 'Heavy',
        description: "\"Quantity has a quality all its own. Standardized parts mean standardized prices.\" <br><span class='text-cyan-300'>[Economy Passive]</span> <br>The cost of Heavy Armors and Shields with block properties is <b>decreased by 25%</b>.",
        parents: ['high_quality_alloy'], // Changed Parent
        effect: { type: 'heavy_gear_discount', value: 0.25 }
    },

    // 4A. Adamantine Skin (Child of Logistics of War)
    'impenetrable_alloy': {
        name: "Adamantine Skin",
        type: 'passive',
        branch: 'Strength',
        armorReq: 'Heavy',
        description: "\"You are the fortress. Let them break their hands against your walls.\" <br><span class='text-cyan-300'>[Defense Passive]</span> <br>While wearing Heavy Armor, you represent a solid wall of iron. You <b>cannot take Critical Damage</b>.",
        parents: ['logistics_of_war'], // Changed Parent
        effect: { type: 'crit_immunity' }
    },

    // 4B. The Iron Kiss / Shield Bash (Child of Logistics of War)
    'the_iron_kiss': { 
        name: "The Iron Kiss",
        type: 'active',
        branch: 'Strength',
        armorReq: 'Heavy',
        description: "\"A shield is just a hammer with a wider surface area. Introduce it to their face.\" <br><span class='text-red-300'>[Shield Art] [Cost: 10 MP]</span> <br>Deal <b>50% Damage</b> (Base: 50% of Shield Def). <b>Knocks back</b> enemy 1 tile.",
        parents: ['logistics_of_war'], // Changed Parent
        effect: { action: 'shield_bash', cost: 10 }
    },

    // 5A. Null-Steel Plating / Full Metal Alchemist (Child of Adamantine Skin)
    'null_steel_plating': { 
        name: "Null-Steel Plating",
        type: 'passive',
        branch: 'Strength',
        armorReq: 'Heavy',
        description: "\"Steel usually conducts magic. Yours grounds it. Weave lead and quicksilver into the lattice.\" <br><span class='text-cyan-300'>[Defense Passive]</span> <br>Heavy Armor grants bonus <b>Magical Defense</b> equal to 20% of its physical Defense.",
        parents: ['impenetrable_alloy'], // Changed Parent
        effect: { type: 'heavy_armor_mag_def', value: 0.2 }
    },

    // 5B. Aegis of the Soul / Mana Steel Aura (Child of Adamantine Skin)
    'aegis_of_the_soul': { 
        name: "Aegis of the Soul",
        type: 'toggle',
        branch: 'Strength',
        armorReq: 'Heavy',
        description: "\"Project your spirit outwards. Make the air around you as hard as the steel you wear.\" <br><span class='text-purple-300'>[Toggle: 20 MP/Turn]</span> <br><b>+20% Phys Def</b>, <b>+10% Mag Def</b>, and <b>+50% Debuff Resist</b>.",
        parents: ['impenetrable_alloy'], // Changed Parent
        effect: { toggle: 'mana_steel_aura' }
    },

    // 5C. Immovable Object / Lockdown (Child of The Iron Kiss)
    'immovable_object': { 
        name: "Immovable Object",
        type: 'toggle',
        branch: 'Strength',
        armorReq: 'Heavy',
        description: "\"Let them come. You are the mountain. Hunker down behind your greatshield and refuse to budge.\" <br><span class='text-purple-300'>[Greatshield Toggle: 15 MP/Turn]</span> <br><b>+25% Defense</b> and <b>Immunity to Crowd Control</b>.",
        parents: ['the_iron_kiss'],
        effect: { toggle: 'lockdown' }
    },  
    // 3E. Iron Stomach (Glutton's Blessings) - Child of Scavenger's Eye

    'power_swing': {
        name: "Sunder",
        type: 'active',
        branch: 'Strength',
        // Updated Cost: 15 (Damage already 150% in logic)
        description: "\"The hardest steel shatters like glass if struck with sufficient conviction. Break their guard, then break their bones.\" <br><span class='text-red-300'>[Active Art] [Cost: 15 MP]</span> <br>Deliver a crushing blow dealing <b>150% Damage</b>. Ignores 20% of the target's Defense.",
        parents: ['power_strengthening'],
        effect: { action: 'power_swing', cost: 15 } // Updated Cost
    },
    'heavier_swing': {
        name: "Impact",
        type: 'passive',
        branch: 'Strength',
        description: "\"Nothing stops the mountain. Not stone, not steel, not bone. Your strikes echo like a war drum.\" <br><span class='text-cyan-300'>[Passive Upgrade]</span> <br>Your 'Sunder' ability now deals <b>170% Damage</b>.",
        parents: ['power_swing'],
        effect: { type: 'power_swing_buff', value: 0.2 }
    },
    'barbaric_swing': {
        name: "Red Mist",
        type: 'active',
        branch: 'Strength',
        // Updated Description: 60% per hit
        description: "\"Abandon reason. Embrace the carnage. Let the rage take the wheel and drive you into the abyss.\" <br><span class='text-red-300'>[Active Art] [Cost: 20 MP]</span> <br>Enter a frenzy, striking <b>3 times</b> in rapid succession for 60% damage each hit.",
        parents: ['power_swing'],
        effect: { action: 'barbaric_swing', cost: 20 }
    },
    'bone_shatter': {
        name: "Cataclysmic Slam",
        type: 'active',
        branch: 'Strength',
        description: "\"Why cut when you can pulverize? Leave them nothing but dust and regret.\" <br><span class='text-red-300'>[Active Art] [Cost: 30 MP]</span> <br>Deal <b>200% Damage</b>. Has a <b>25% chance</b> to Paralyze the target.",
        parents: ['heavier_swing'],
        effect: { action: 'bone_shatter', cost: 30 }
    },
    'blessing_of_giants': {
        name: "Titanic Legacy",
        type: 'passive',
        branch: 'Strength',
        description: "\"The old blood sings. Strike with the weight of mountains, and the earth itself will bow.\" <br><span class='text-cyan-300'>[Strength Passive]</span> <br>Active Arts deal <b>20% more damage</b> when using Heavy Weapons.",
        parents: ['heavier_swing'],
        effect: { type: 'heavy_art_buff', value: 0.20 }
    },

    // --- WEDGE F: ELEMENTAL (Hybrid - Center) ---
    'elemental_ignition': {
        name: "Prismatic Convergence",
        type: 'Trigger',
        branch: 'Magic - Elemental',
        elementReq: 'elemental',
        description: "\"Weave the elements into a chain reaction. Start the fire, fan the flames, ride the storm.\" <br><span class='text-yellow-300'>[Trigger: Elemental]</span> <br>The first time you use a specific element in battle, it deals <b>10% extra damage</b>.",
        parents: ['focus_point'],
        effect: { type: 'elemental_ignition' }
    },
    // 7. Aetheric Saturation (Greater Elemental Infusion) - Child of Prismatic Convergence
    'classical_understanding': {
        name: "Primal Elements",
        type: 'passive',
        branch: 'Magic - Elemental',
        elementReq: 'elemental',
        description: "\"Heat, Flow, Stability, Breath. The foundations of reality.\" <br><span class='text-cyan-300'>[Elemental Passive]</span> <br>Gain <b>+10% Damage</b> with Fire, Water, Earth, and Wind.",
        parents: ['elemental_ignition'],
        effect: { type: 'elemental_boost', elements: ['fire', 'water', 'earth', 'wind'], value: 0.10 }
    },
    'natural_study': {
        name: "Storm and Root",
        type: 'passive',
        branch: 'Magic - Elemental',
        elementReq: 'elemental',
        description: "\"The chaotic vitality of the wild. Life grows, lightning strikes. Both are uncontrolled.\" <br><span class='text-cyan-300'>[Elemental Passive]</span> <br>Gain <b>+10% Damage</b> with Lightning and Nature.",
        parents: ['elemental_ignition'],
        effect: { type: 'elemental_boost', elements: ['lightning', 'nature'], value: 0.10 }
    },
    'paradox_research': {
        name: "Cosmic Duality",
        type: 'passive',
        branch: 'Magic - Elemental',
        elementReq: 'elemental',
        description: "\"Existence and Oblivion, dancing in the dark. To understand one is to fear the other.\" <br><span class='text-cyan-300'>[Elemental Passive]</span> <br>Gain <b>+10% Damage</b> with Light and Void.",
        parents: ['elemental_ignition'],
        effect: { type: 'elemental_boost', elements: ['light', 'void'], value: 0.10 }
    },
    
    // Elemental Sub-Skills (Y=8)
    'rage_of_the_sun': {
        name: "Rage of the Sun",
        type: 'passive',
        branch: 'Magic - Elemental',
        elementReq: 'fire',
        description: "\"The sun does not warm; it burns. Let your fire be unpredictable and hungry.\" <br><span class='text-cyan-300'>[Fire Passive]</span> <br>Fire damage becomes volatile (wider range), but hits significantly harder on average.",
        parents: ['classical_understanding'],
        effect: { type: 'fire_fluctuation_buff' }
    },

    // --- NEW SKILLS START ---
    'volcanic_aftermath': {
        name: "Volcanic Aftermath",
        type: 'toggle',
        branch: 'Magic - Elemental',
        elementReq: 'fire',
        description: "\"The earth remembers the heat long after the flame is gone. Leave a scar upon the world.\" <br><span class='text-purple-300'>[Fire Toggle]</span> <br>Active Fire spells leave a <b>Magma Pool</b> (2 turns). Enemies ending their turn in it take damage (Half Spell Dice).",
        parents: ['rage_of_the_sun'],
        effect: { toggle: 'magma_pool' }
    },

    'solar_prominence': {
        name: "Solar Prominence",
        type: 'active',
        branch: 'Magic - Elemental',
        elementReq: 'fire',
        description: "\"The sun does not ask for permission to burn. It simply is. Ignite the air and let them breathe ash.\" <br><span class='text-red-300'>[Fire Art] [Cost: 30 MP]</span> <br><b>Requires Fire Weapon.</b> Swing the Blade of Fire, dealing <b>200% - 250% Fire Damage</b> to the target and 2 enemies beside it. Coats blade in fire for 3 turns (+1d8 Fire Dmg).",
        parents: ['rage_of_the_sun'],
        effect: { action: 'solar_prominence', cost: 30 }
    },
    'valkyrie_of_flame': {
        name: "Valkyrie of Flame",
        type: 'active',
        branch: 'Magic - Elemental',
        elementReq: 'fire',
        description: "\"Fire has a will. It is not a tool to be used, but a choir waiting to sing. Raise your hand, and let the daughters of ash take the stage.\" <br><span class='text-red-300'>[Fire Art] [Cost: 50 MP]</span> <br>Summons 3 <b>Spritefires</b> (3 Turns). They wield a copy of your weapon (No Secondary Effects) and attack distinct enemies in range dealing <b>50% Max Damage</b>.",
        parents: ['solar_prominence'],
        effect: { action: 'valkyrie_of_flame', cost: 50 }
    },
    // 1. Greater Magma Pool (Passive) - Enhances Volcanic Aftermath
    'greater_magma_pool': {
        name: "Pyroclastic Flow",
        type: 'passive',
        branch: 'Magic - Elemental',
        elementReq: 'fire',
        description: "\"The earth does not merely crack; it shatters. Let the wound you inflict upon the world bleed fire.\" <br><span class='text-cyan-300'>[Passive Upgrade]</span> <br><b>Volcanic Aftermath</b> pools now expand to cover the target and the <b>4 adjacent tiles</b> (Cross shape).",
        parents: ['volcanic_aftermath'], 
        effect: { type: 'greater_magma_pool' }
    },

    // 2. Magma Cragblade (Toggle) - Synergy: Requires Passive + Active
    'pyroclastic_geode': {
        name: "Pyroclastic Geode",
        type: 'active',
        branch: 'Magic - Elemental',
        elementReq: 'fire',
        description: "\"You do not throw a stone; you plant a catastrophe.\" <br><span class='text-orange-400'>[Fire Art] [Cost: 30 MP]</span> <br><b>Requires Catalyst.</b> Lob a geode dealing <b>(2+Amp)d6 Fire Dmg</b>. Leaves a <b>Volatile Geode</b> that explodes next turn for <b>(1+Amp/2)d8 Fire Dmg</b> in a 3x3 area.",
        parents: ['volcanic_aftermath', 'solar_prominence'],
        effect: { action: 'pyroclastic_geode', cost: 30 }
    },
    'continuous_magma': {
        name: "Continuous Magma",
        type: 'passive',
        branch: 'Magic - Elemental',
        elementReq: 'fire',
        description: "\"The earth bleeds, and the wound refuses to close. Fire is not a moment; it is a memory that burns.\" <br><span class='text-orange-300'>[Fire Passive]</span> <br>All Magma based skills have <b>+1 Lifespan</b>. <b>Volcanic Aftermath</b> and <b>Greater Magma Pool</b> persist to deal damage 2 turns in a row. <b>Magmatic Grenade</b> explodes twice.",
        parents: ['greater_magma_pool', 'pyroclastic_geode'], 
        effect: { type: 'magma_mastery' }
    },

    // 4. Pillar of Fire (Passive) - Synergy: Requires Passive + Active
    'pillar_of_fire': {
        name: "Echoes of Cinder",
        type: 'passive',
        branch: 'Magic - Elemental',
        elementReq: 'fire',
        description: "\"Fire has a memory. Where it burns once, it yearns to burn again.\" <br><span class='text-cyan-300'>[Passive]</span> <br>Fire spells leave an <b>Unstable Fire</b> tile. It erupts at the end of the next turn, dealing the spell's damage again.",
        parents: ['volcanic_aftermath', 'solar_prominence'], 
        effect: { type: 'pillar_of_fire' }
    },
    // 6. Corona Ballet (Dance of Fire) - Child of Solar Prominence + Blazing Spear
    'corona_ballet': {
        name: "Corona Ballet",
        type: 'synergy',
        branch: 'Magic - Elemental',
        elementReq: 'fire',
        description: "\"Fire is not static. It breathes, it moves, it dances. Connect the thrust of the spear with the sweep of the blade, and the air itself ignites in a lingering ovation.\" <br><span class='text-yellow-300'>[Synergy: Prominence + Spear]</span> <br><b>Solar Prominence</b> and <b>Prominence Thrust</b> leave <b>Lingering Unstable Fire</b> on all affected tiles.",
        parents: ['valkyrie_of_flame', 'pillar_of_fire'],
        effect: { type: 'scorched_earth' }
    },
    'crashing_wake': {
        name: "Crashing Wake",
        type: 'passive',
        branch: 'Magic - Elemental',
        elementReq: 'water',
        description: "\"Heavy, clinging tide. Drag them down to the depths where the light dies.\" <br><span class='text-cyan-300'>[Water Passive]</span> <br>Drenched application from Weapon and Spell is now <b>100%</b>.",
        parents: ['classical_understanding'],
        effect: { type: 'drenched_boost' }
    },
    'glacial_embrace': {
        name: "Glacial Embrace",
        type: 'passive',
        branch: 'Magic - Elemental', 
        elementReq: 'water',
        description: "\"Water remembers the bite of winter.\" <br><span class='text-blue-300'>[Water Passive]</span> <br>Water damage against <b>Drenched</b> enemies applies <b>Frostbite</b> (+5% Dmg Taken). At 5 stacks, target becomes <b>Frozen</b> (Stunned) for 3 turns.",
        parents: ['crashing_wake'],
        effect: { type: 'glacial_embrace_proc' } // Unique ID
    },
    'crystalline_fracture': {
        name: "Crystalline Fracture",
        type: 'passive',
        branch: 'Magic - Elemental',
        elementReq: 'water',
        description: "\"Fragility is a property of the frozen.\" <br><span class='text-blue-300'>[Water Passive]</span> <br>Enemies with <b>Frostbite</b> shatter when hit, dealing <b>25% damage</b> to 8 neighbors. Can chain react.",
        parents: ['glacial_embrace'],
        effect: { type: 'crystalline_fracture_proc' } // Unique ID
    },

    // [Child of Glacial Embrace AND Aqueous Aegis]
    'glacial_ordnance': {
        name: "Glacial Ordnance",
        type: 'active',
        branch: 'Magic - Elemental',
        elementReq: 'water',
        description: "\"The impact of a collapsing iceberg.\" <br><span class='text-blue-300'>[Water Art]</span> <br><b>Requires Water Weapon.</b> <br>Fire a projectile (Range 3, 3x3 AoE). Deals Weapon Dmg and applies <b>Frostbite</b>.",
        parents: ['glacial_embrace', 'aqueous_aegis'], // Dual Requirement
        effect: { action: 'glacial_ordnance', cost: 25 }
    },
    'hoarfrost_haze': {
        name: "Frozen Armament",
        type: 'active',
        branch: 'Magic - Elemental',
        elementReq: 'water',
        description: "\"The air snaps frozen. You do not wield ice; you wield the absence of life.\" <br><span class='text-blue-300'>[Water Art] [Cost: 30 MP]</span> <br>Coats weapon in ice (<b>+1d8 Water Dmg</b>, <b>+1 Frostbite/hit</b>). Creates a <b>3x2 Frozen Mist</b> (3 turns) that applies Frostbite to enemies inside.",
        parents: ['crystalline_fracture', 'glacial_ordnance'],
        effect: { action: 'hoarfrost_haze', cost: 30 }
    },
    // [Child of Crashing Wake]
    'aqueous_aegis': {
        name: "Aqueous Aegis",
        type: 'active',
        branch: 'Magic - Elemental', // Matched to Parent
        elementReq: 'water',         // Matched to Parent
        description: "\"A sanctuary of surface tension.\" <br><span class='text-blue-300'>[Water Art]</span> <br><b>Requires Water Weapon.</b> <br>Shield yourself with a bubble that <b>negates 90%</b> of the next hit. Lasts 3 turns or until hit.",
        parents: ['crashing_wake'],
        effect: { action: 'aqueous_aegis', cost: 35 }
    },
    'sudsy_minefield': {
        name: "Hydrostatic Minefield",
        type: 'active',
        branch: 'Magic - Elemental', // Matched to Parent
        elementReq: 'water', 
        description: "\"A pressurized prison of water.\" <br><span class='text-blue-300'>[Water Art]</span> <br>Place a trap (Range 3). Enemies stepping on it take <b>1d6 + Phys Water Dmg</b> and are <b>Stopped</b>. Allies ignore it.",
        parents: ['aqueous_aegis'],
        effect: { action: 'bubble_trap', cost: 20 }
    },

    // [Child of Aqueous Aegis AND Glacial Embrace]
    'saponification_arts': {
        name: "Saponification Arts",
        type: 'toggle',
        branch: 'Magic - Elemental', // Matched to Parent
        elementReq: 'water', 
        description: "\"Friction is a luxury they cannot afford.\" <br><span class='text-purple-300'>[Water Stance]</span> <br><b>Drenched</b> becomes <b>Saponified</b> (Miss Chance, Slide Move, Vuln). <br><b>Frostbite</b> trigger causes <b>Explosion</b> instead of Freeze.",
        parents: ['aqueous_aegis', 'glacial_embrace'], // Dual Requirement
        effect: { toggle: 'saponification_arts' }
    },
    'saponification_cascade': {
        name: "Explosive Bubble Bomb",
        type: 'passive', // Changed from 'trigger' to 'passive' for consistency with description
        branch: 'Magic - Elemental',
        elementReq: 'water',
        description: "\"The tension breaks. The bubble bursts. Chaos ensues.\" <br><span class='text-cyan-300'>[Trigger Passive]</span> <br>When a <b>Hydrostatic Minefield</b> bursts (Trigger/Expire), it explodes in a <b>Cross (5 tiles)</b>. <br>Deals <b>50% Weapon Water Dmg</b> and applies <b>Saponified</b>. <br>Leaves <b>Slippery Ground</b> (3 turns) that <b>Trips</b> and <b>Stops</b> enemies.",
        parents: ['sudsy_minefield', 'saponification_arts'],
        effect: { type: 'trigger_saponification' }
    },
    'monolith_of_earth': {
        name: "Monolith of Earth",
        type: 'passive',
        branch: 'Magic - Elemental',
        elementReq: 'earth',
        description: "\"To shape stone is to become stone. Let their blades break against your skin.\" <br><span class='text-cyan-300'>[Earth Passive]</span> <br>Casting Earth spells grants <b>Increased Defense</b>.",
        parents: ['classical_understanding'],
        effect: { type: 'earth_def_buff' }
    },
    'gravitational_anchor': {
        name: "Gravitational Anchor",
        type: 'active',
        branch: 'Magic - Elemental',
        elementReq: 'earth',
        description: "\"The earth does not ask you to kneel; it demands it.\" <br><span class='text-orange-400'>[Earth Art] [Cost: 20 MP]</span> <br>Shoots a gravity well. Deals <b>150% Physical Earth Dmg</b> and <b>Pulls</b> the target 2 tiles closer.",
        parents: ['monolith_of_earth'],
        effect: { action: 'gravitational_anchor', cost: 20 }
    },
    'terrestrial_rejection': {
        name: "Terrestrial Rejection",
        type: 'active',
        branch: 'Magic - Elemental',
        elementReq: 'earth',
        description: "\"You reverse the polarity of the ley lines beneath your feet. For a brief moment, the world itself refuses to tolerate the presence of your enemies.\" <br><span class='text-orange-400'>[Earth Synergy] [Cost: 35 MP]</span> <br>Slam the ground. Deal <b>100% Earth Dmg</b> to all adjacent enemies and <b>Push 2 Tiles</b>. Creates <b>Jagged Earth</b> around you.",
        parents: ['gravitational_anchor'],
        effect: { action: 'terrestrial_rejection', cost: 35 }
    },
    'gravimetric_ascension': {
        name: "Gravimetric Ascension",
        type: 'toggle',
        branch: 'Magic - Elemental',
        elementReq: 'earth',
        description: "\"You sever the ley lines that bind you to the soil. You become a satellite of your own will, untethered by the rough earth below.\" <br><span class='text-orange-400'>[Earth Toggle] [20 MP/Turn]</span> <br>Gain <b>Flight</b> (Bypass Terrain/Traps) but suffer <b>-1 Movement Speed</b> due to lack of traction.",
        parents: ['gravitational_anchor', 'tectonic_edge'],
        effect: { toggle: 'gravimetric_ascension' }
    },
    'geomantic_polarity': {
        name: "Geomantic Polarity",
        type: 'toggle',
        branch: 'Magic - Elemental',
        elementReq: 'earth',
        description: "\"You invert the laws of attraction and repulsion. What once pulled now pushes; what once floated now roots itself with the weight of a mountain.\" <br><span class='text-orange-400'>[Earth Toggle]</span> <br>Inverts Earth Skills. <br><b>Anchor:</b> Pushes. <b>Rejection:</b> Pulls (Radius 2). <br><b>Ascension:</b> Lose Flight, gain <b>+2 Speed</b> & <b>Knockback Immunity</b>.",
        parents: ['terrestrial_rejection', 'gravimetric_ascension'],
        effect: { toggle: 'geomantic_polarity' }
    },
    // Child of Monolith of Earth
    'tectonic_edge': {
        name: "Tectonic Edge",
        type: 'toggle',
        branch: 'Magic - Elemental',
        elementReq: 'earth',
        description: "\"Burden your blade with the weight of the mountain.\" <br><span class='text-orange-400'>[Earth Toggle] [15 MP/Turn]</span> <br>Coats weapon in stone. Adds <b>1d8 Earth Dmg</b> and <b>10% Paralyze Chance</b> on hit.",
        parents: ['monolith_of_earth'],
        effect: { toggle: 'tectonic_edge' }
    },
    'magmatic_stress': {
        name: "Magmatic Stress",
        type: 'passive', // It's a passive that listens for a trigger
        branch: 'Magic - Elemental',
        elementReq: 'earth',
        description: "\"Pressure makes diamonds, but it also makes volcanoes. When the weight of the world bears down upon you, become the eruption.\" <br><span class='text-orange-400'>[Earth Trigger]</span> <br>Taking <b>5 Hits</b> or <b>1000 Dmg</b> activates <b>Heating Rock</b> (1 Turn). <br><b>Heating Rock:</b> +25% Dmg Dealt, -25% Dmg Taken. Physical attacks cause <b>Knockback</b>.",
        parents: ['tectonic_edge'],
        effect: { type: 'earth_trigger_buff' }
    },
    'geodesic_fracture': {
        name: "Geodesic Fracture",
        type: 'passive',
        branch: 'Magic - Elemental',
        elementReq: 'earth',
        description: "\"Gravity doesn't just pull; it tears. By focusing your will, you force the land to buckle and spike, turning the battlefield into a maw that chews on the unworthy.\" <br><span class='text-orange-400'>[Earth Passive]</span> <br>Earth Skills/Spells create <b>Jagged Earth</b> (3 Turns) on target tiles. <br><b>Jagged Earth:</b> Deals <b>5% Max HP</b> dmg. Difficult terrain (Costs <b>3 Move</b>).",
        parents: ['gravitational_anchor', 'tectonic_edge'],
        effect: { type: 'jagged_earth_spawn' }
    },
    'lithic_sovereign': {
        name: "Lithic Sovereign",
        type: 'active',
        branch: 'Magic - Elemental',
        elementReq: 'earth',
        description: "\"You compress the stress of the earth and the fractures of the ley lines into a single, singularity point.\" <br><span class='text-orange-400'>[Earth Arts] [Cost: 100 MP]</span> <br>Summon a <b>Totem Stela</b> (5 Turns). Acts as a wall. <br><b>Aura (2 Tiles):</b> Allies gain <b>+25% Atk/Def</b> and <b>+50% CC Resist</b>.",
        parents: ['magmatic_stress', 'geodesic_fracture'],
        effect: { action: 'spawn_totem', cost: 100 }
    },
    'unending_winds': {
        name: "Unending Winds",
        type: 'passive',
        branch: 'Magic - Elemental',
        elementReq: 'wind',
        description: "\"Momentum is a resource. Do not let the gale die out.\" <br><span class='text-cyan-300'>[Wind Passive]</span> <br>Wind-based Haste buffs last <b>1 turn longer</b>.",
        parents: ['classical_understanding'],
        effect: { type: 'wind_duration_buff' }
    },
    'take_flight': {
        name: "Zephyr's Ascension",
        type: 'toggle',
        branch: 'Magic - Elemental',
        elementReq: 'wind',
        description: "\"To walk the earth is to be bound by it. Cast off the shackles of gravity and dance upon the currents.\" <br><span class='text-purple-300'>[Wind Toggle] [25 MP/Turn]</span> <br>Gain <b>Flight</b> (Bypass Terrain/Traps).",
        parents: ['unending_winds'],
        effect: { toggle: 'take_flight' }
    },
    'slipstream_velocity': {
        name: "Slipstream Velocity",
        type: 'passive',
        branch: 'Magic - Elemental',
        elementReq: 'wind',
        description: "\"You do not merely step; you erupt from one point and crash into another.\" <br><span class='text-cyan-300'>[Wind Passive]</span> <br><b>+1 Movement Speed.</b> <br>If <b>Zephyr's Ascension</b> is active, moving <b>Knocks Back</b> adjacent enemies at both your starting and landing points.",
        parents: ['take_flight'],
        effect: { type: 'slipstream_velocity', value: 1 }
    },
    'condensed_gale': {
        name: "Condensed Gale",
        type: 'active',
        branch: 'Magic - Elemental',
        elementReq: 'wind',
        description: "\"By compressing the air into a dense sphere, you create a localized storm that detonates on impact. The wind does not just blow; it shatters.\" <br><span class='text-cyan-300'>[Wind Art] [Cost: 25 MP]</span> <br><b>Requires Catalyst.</b> Throw a pressurized ball of air dealing <b>2d6 + Amp Wind Dmg</b>. Knockback 2 tiles. <b>20% Stun</b> chance.",
        parents: ['take_flight', 'gale_cannon'],
        effect: { action: 'condensed_gale', cost: 25 }
    },
    'maelstrom_imperative': {
        name: "Maelstrom Imperative",
        type: 'active',
        branch: 'Magic - Elemental',
        elementReq: 'wind',
        description: "\"You do not call the wind; you break the sky. This is the breath of the world in its most violent form, a wandering god of ruin that knows neither friend nor foe.\" <br><span class='text-cyan-300'>[Wind Art] [Cost: 100 MP]</span> <br>Summon a <b>Tornado</b> (5 Turns). It moves randomly, deals <b>2d10 + Amp Wind Dmg</b> (Range 2), and <b>Pulls</b> enemies (Range 5).",
        parents: ['slipstream_velocity', 'condensed_gale'],
        effect: { action: 'maelstrom_imperative', cost: 100 }
    },
    'gale_cannon': {
        name: "Tempest Piercer",
        type: 'active',
        branch: 'Magic - Elemental',
        elementReq: 'wind',
        description: "\"Concentrate the atmosphere into a singular point of devastation. A spear of air that punches through steel and stone alike.\" <br><span class='text-cyan-300'>[Wind Art] [Cost: 30 MP]</span> <br>Fire a beam (Range 6). Deal <b>200% Damage</b>. Pierces enemies (Dmg halves each hit). Destroys Obstacles.",
        parents: ['unending_winds'],
        effect: { action: 'gale_cannon', cost: 30 }
    },
    'cyclone_mantle': {
        name: "Cyclone Mantle",
        type: 'toggle',
        branch: 'Magic - Elemental',
        elementReq: 'wind',
        description: "\"The air around you is no longer empty space; it is a roaring current that swats arrows from the sky and dulls the edge of any blade.\" <br><span class='text-purple-300'>[Wind Toggle] [20 MP/Turn]</span> <br><b>-15% Damage Taken</b>. <b>+10% Block Chance</b> (Even without a shield).",
        parents: ['gale_cannon'],
        effect: { toggle: 'cyclone_mantle' }
    },
    'zephyrs_edge': {
        name: "Zephyr's Edge",
        type: 'toggle',
        branch: 'Magic - Elemental',
        elementReq: 'wind',
        description: "\"The gale does not stop at the skin; it passes through.\" <br><span class='text-purple-300'>[Wind Toggle] [25 MP/Turn]</span> <br>Attacks deal <b>+1d8 Wind Damage</b> and <b>Pierce</b> through the target, hitting the enemy behind them for <b>50% Damage</b>.",
        parents: ['take_flight', 'gale_cannon'],
        effect: { toggle: 'zephyrs_edge' }
    },
    'avatar_of_tempest': {
        name: "Avatar of the Storm",
        type: 'toggle',
        branch: 'Magic - Elemental',
        elementReq: 'wind',
        description: "\"The storm does not guide you; it wears your face.\" <br><span class='text-purple-300'>[Wind Toggle] [40 MP/Turn]</span> <br><b>+30% Attack</b>, <b>+1 Speed</b>, <b>Haste (2 Actions)</b>. <br><span class='text-red-400'>-50% Defense, +50% Wind/Lightning Dmg Taken.</span>",
        parents: ['cyclone_mantle', 'zephyrs_edge'],
        effect: { toggle: 'avatar_of_tempest' }
    },
    'might_of_olympus': {
        name: "Might of the Heaven",
        type: 'passive', 
        branch: 'Magic - Elemental',
        elementReq: 'lightning',
        description: "\"A chaotic aftershock. Lightning never strikes just once; it seeks the path of least resistance.\" <br><span class='text-cyan-300'>[Lightning Passive]</span> <br>Lightning attacks have a 25% chance to trigger a second, smaller strike instantly.",
        parents: ['natural_study'],
        effect: { type: 'lightning_double_strike' }
    },
    'wrath_of_keraunos': {
        name: "Wrath of Keraunos",
        type: 'active',
        branch: 'Magic - Elemental',
        elementReq: 'lightning',
        description: "\"The sky does not ask for permission to strike. Channel the storm father's judgement and turn your blade into a lightning rod of devastation.\" <br><span class='text-blue-300'>[Lightning Art] [Cost: 35 MP]</span> <br>Slam your blade for <b>150% Lightning Damage</b>. Imbues weapon with <b>+1d8 Lightning Damage</b> for 3 turns.",
        parents: ['might_of_olympus'], // Ensure this parent ID exists in your tree
        effect: { action: 'wrath_of_keraunos', cost: 35 }
    },
    'jolting_pressure': {
        name: "Jolting Pressure",
        type: 'passive',
        branch: 'Magic - Elemental',
        elementReq: 'lightning',
        description: "\"The air hums with lethal potential. Leave them charged, and let their own movement be the trigger for the discharge.\" <br><span class='text-cyan-300'>[Lightning Passive]</span> <br>Lightning damage applies <b>Jolted</b> (3 Turns). <br><b>Jolted:</b> Enemy takes <b>25% of the initial damage</b> when they attack, <b>consuming the effect</b>.",
        parents: ['wrath_of_keraunos'],
        effect: { type: 'jolted_debuff' }
    },
    'blink_bolt': {
        name: "Thunderclap Flash",
        type: 'active',
        branch: 'Magic - Elemental',
        elementReq: 'lightning',
        description: "\"Arrive before the sound. Strike before the fear.\" <br><span class='text-yellow-300'>[Lightning Art]</span> <br><b>Cost:</b> 30 MP + 10 MP/Tile. <br>Dash in a straight line to a target. Deals <b>150% Lightning Dmg</b> + <b>30% per tile traveled</b>.",
        parents: ['wrath_of_keraunos', 'aspect_of_tempest'],
        range: 6,
        cost: 30, // <--- ADD THIS LINE (Fixes the base deduction issue)
        effect: { action: 'blink_bolt' }
    },
    'flowering_thunderbolt': {
        name: "Fulgurous Bloom",
        type: 'active',
        branch: 'Magic - Elemental',
        elementReq: 'lightning',
        description: "\"The storm is not merely destruction; it is a garden of high-voltage life. You plant the seed of thunder in their chest, and the lightning will bloom from their charred remains.\" <br><span class='text-blue-300'>[Lightning Art] [Cost: 50 MP]</span> <br><b>Requires Catalyst.</b> Call down a bolt dealing <b>2d8 + INT Lightning Damage</b>. Inflicts <b>Fulgurbloom</b> (5 Turns): Target takes <b>+25% Lightning Damage</b>.",
        parents: ['jolting_pressure', 'blink_bolt'],
        effect: { action: 'flowering_thunderbolt', cost: 50 }
    },
    'aspect_of_tempest': {
        name: "Aspect of Thunder",
        type: 'active',
        branch: 'Magic - Elemental',
        elementReq: 'lightning', // or Hybrid/Lightning
        description: "\"Become the storm that swallows the world.\" <br><span class='text-blue-300'>[Lightning Art] [Cost: 35 MP]</span> <br>Gain <b>+50% Damage</b> and <b>+1 Movement</b> for 3 turns. <br><span class='text-red-400'>Warning: You become weak to Earth and Lightning damage.</span>",
        parents: ['might_of_olympus'], 
        effect: { action: 'aspect_of_tempest', cost: 35 }
    },
    'conduit_of_storm': {
        name: "Conduit of the Storm",
        type: 'toggle',
        branch: 'Magic - Elemental',
        elementReq: 'lightning',
        description: "\"I am the anchor. You are the sparks.\" <br><span class='text-yellow-300'>[Lightning Stance]</span> <br><b>Cost:</b> 30 MP/Turn. <br>While active, <b>4 bolts</b> strike your area each turn (1 on you, 3 adjacent). <br>Deals <b>1d8 + (Catalyst/2) Lightning Dmg</b>.",
        parents: ['aspect_of_tempest'],
        effect: { toggle: 'conduit_of_storm' }
    },
    'voltaic_momentum': {
        name: "Voltaic Momentum",
        type: 'passive', // It's a passive that triggers on move
        branch: 'Magic - Elemental',
        elementReq: 'lightning',
        description: "\"The storm does not sit idle. Every step generates potential; every stride builds the charge.\" <br><span class='text-yellow-300'>[Lightning Passive]</span> <br>Gain <b>Static Charge</b> when moving. Next <b>Electric Attack</b> deals <b>+10% Damage</b> per stack (Max 5).",
        parents: ['wrath_of_keraunos', 'aspect_of_tempest'],
        effect: { type: 'static_charge_accumulator' }
    }, 
    'galvanic_reconstitution': {
        name: "Galvanic Reconstitution",
        type: 'passive',
        branch: 'Magic - Elemental',
        elementReq: 'lightning',
        description: "\"The storm is not a force to be weathered, but a current to be welcomed. You have rewritten the ley-lines of your nervous system, turning destructive voltage into revitalizing energy.\" <br><span class='text-cyan-300'>[Lightning Passive]</span> <br><b>Lightning Immunity.</b> Instead of taking Lightning damage, you <b>Heal for 25%</b> of the raw damage amount.",
        parents: ['conduit_of_storm', 'voltaic_momentum'],
        effect: { type: 'lightning_absorb', ratio: 0.25 }
    },
    'gaias_love': {
        name: "Gaia's Love",
        type: 'passive',
        branch: 'Magic - Elemental',
        elementReq: 'nature',
        description: "\"Life feeds on life. The cycle must be maintained, and you are the harvester.\" <br><span class='text-cyan-300'>[Nature Passive]</span> <br>Nature Lifesteal heals for <b>25% more</b>.",
        parents: ['natural_study'],
        effect: { type: 'nature_heal_buff', value: 1.25 }
    },
    'miasma_of_decay': {
        name: "Miasma of Decay",
        type: 'active',
        branch: 'Magic - Elemental',
        elementReq: 'nature',
        description: "\"Nature is not just flowers and sunlight; it is the slow digestion of the dead. Breathe out the rot that feeds the roots.\" <br><span class='text-green-400'>[Nature Art] [Cost: 25 MP]</span> <br><b>Requires Nature Weapon.</b> <br>Create a <b>3x2 Poison Mist</b> (3 turns). Mist applies <b>Decaying Poison</b> (5% HP/stack, Max 3). <br>Coats weapon: <b>+1d8 Nature Dmg</b>.",
        parents: ['gaias_love'],
        effect: { action: 'miasma_of_decay', cost: 25 }
    },
    'symbiosis_of_decay': {
        name: "Symbiosis of Decay",
        type: 'passive',
        branch: 'Magic - Elemental',
        elementReq: 'nature',
        description: "\"Nature wastes nothing. The rot that claims them fuels you.\" <br><span class='text-green-400'>[Nature Passive]</span> <br>Whenever an enemy takes <b>Poison</b>, <b>Toxic</b>, or <b>Decay</b> damage, you heal for <b>50%</b> of the amount.",
        parents: ['miasma_of_decay'],
        effect: { type: 'passive_buff' } // Logic handled manually in battle.js
    },  
    'carrion_bloom': {
        name: "Carrion Bloom",
        type: 'active',
        branch: 'Magic - Elemental',
        elementReq: 'nature',
        description: "\"The flower that blooms in darkness is the most beautiful, and the most deadly. Force the cycle of decay to completion in a single instant.\" <br><span class='text-green-400'>[Nature Art] [Cost: 30 MP]</span> <br>Deal <b>50% Weapon Damage</b>. Instantly <b>Detonates</b> remaining Poison, Toxic, and Decay turns, dealing their total future damage immediately.",
        parents: ['miasma_of_decay', 'crucible_of_bloom'],
        effect: { action: 'carrion_bloom', cost: 30 }
    },
    'virulent_evolution': {
        name: "Virulent Evolution",
        type: 'passive',
        branch: 'Magic - Elemental',
        elementReq: 'nature',
        description: "\"The simplest venom curdles into a necrotic sludge.\" <br><span class='text-green-400'>[Nature Passive]</span> <br>All <b>Poison</b> you inflict is automatically upgraded to <b>Toxic</b> (Double Damage).",
        parents: ['symbiosis_of_decay', 'carrion_bloom'],
        effect: { type: 'passive_poison_upgrade' }
    },
    'crucible_of_bloom': {
        name: "Crucible of Bloom",
        type: 'active',
        branch: 'Magic - Elemental',
        elementReq: 'nature',
        description: "\"Life is a relentless conquest. Turn the earth into a bed of ravenous petals.\" <br><span class='text-green-400'>[Nature Art] [Cost: 20 MP]</span> <br><b>Requires Catalyst.</b> <br>Target 3x3 area. Spawns <b>Blooming Powder</b> (3 turns). <br>Deals <b>1d8 Magical Nature Dmg</b> to enemies inside.",
        parents: ['gaias_love'],
        effect: { action: 'crucible_of_bloom', cost: 20 }
    },
    'crucible_of_the_beast': {
        name: "Crucible of the Beast",
        type: 'toggle',
        branch: 'Magic - Elemental',
        elementReq: 'nature',
        description: "\"Nature is a hierarchy. Be the apex.\" <br><span class='text-green-400'>[Nature Toggle]</span> <br><b>Passive:</b> +1 Move, +10% Defense. <br><b>Attack:</b> Consumes <b>20 MP</b> to deal <b>2d6 Physical Nature</b> follow-up. <br><b>Upkeep:</b> 10 MP/turn.",
        parents: ['crucible_of_bloom'],
        effect: { toggle: 'crucible_of_the_beast', cost: 0 }
    },
    'dryads_embrace': {
        name: "Crucible of the Dryad",
        type: 'passive',
        branch: 'Magic - Elemental',
        elementReq: 'nature',
        description: "\"The earth cannot contain the life bursting from your presence.\" <br><span class='text-green-400'>[Nature Passive]</span> <br><b>Thorny Vines</b> grow on the 8 adjacent tiles at turn start and on your path as you move. <br><b>Vines:</b> Cost 2 Move. Enemy takes <b>5% Max HP</b> dmg + <b>20% Poison</b> chance.",
        parents: ['miasma_of_decay', 'crucible_of_bloom'],
        effect: { type: 'passive_vine_spawn' }
    },
    'gaias_dominion': {
        name: "Gaia's Dominion",
        type: 'passive',
        branch: 'Magic - Elemental',
        elementReq: 'nature',
        description: "\"The wild does not just aid you; it obeys you.\" <br><span class='text-green-400'>[Nature Passive]</span> <br>Increases the <b>Dice Size</b> of all Nature damage by 1 step (e.g., d6 -> d8, d8 -> d10). Affects Spells, Blooms, Beast attacks, and Infusions.",
        parents: ['crucible_of_the_beast', 'dryads_embrace'],
        effect: { type: 'nature_dice_upgrade' }
    },
    'divine_blessing': {
        name: "Divine Blessing",
        type: 'passive',
        branch: 'Magic - Elemental',
        elementReq: 'light',
        description: "\"A true death. No necromancy can withstand the absolute authority of the dawn.\" <br><span class='text-cyan-300'>[Light Passive]</span> <br>Undead killed by Light <b>cannot be revived</b>.",
        parents: ['paradox_research'],
        effect: { type: 'light_permadeath' }
    },
    'wrathful_smite': {
        name: "Benediction of Fire",
        type: 'toggle',
        branch: 'Magic - Elemental',
        elementReq: 'light',
        description: "\"The Light does not merely reveal the truth; it burns away the lie.\" <br><span class='text-yellow-200'>[Light Toggle] [30 MP/Hit]</span> <br>Your attacks trigger a follow-up burst of <b>2d8 Light Damage</b>.",
        parents: ['divine_blessing'],
        effect: { toggle: 'wrathful_smite' }
    },
    'hallowed_barrage': {
        name: "Hallowed Barrage",
        type: 'active',
        branch: 'Magic - Elemental',
        elementReq: 'light',
        description: "\"Faith is not a trickle; it is a flood. Open the gates and let the light drown the wicked.\" <br><span class='text-yellow-200'>[Light Art] [Variable Cost]</span> <br><b>Requires Catalyst.</b> Channel up to <b>500 MP</b>. Fire 1 bolt (40% Mag Dmg) per <b>20 MP</b>.",
        parents: ['wrathful_smite'],
        effect: { action: 'hallowed_barrage', cost: 0 } // Cost handled dynamically
    },

    // Child of Wrathful Smite AND Hallowed Ground
    'michaellas_verdict': {
        name: "Michaella's Verdict",
        type: 'active',
        branch: 'Magic - Elemental',
        elementReq: 'light',
        description: "\"Saint Michaella did not distinguish between the battlefield and the altar. To her, purification was absolute.\" <br><span class='text-yellow-200'>[Light Art] [Cost: 125 MP]</span> <br><b>Range 5.</b> Strikes a massive area. Deals <b>Weapon Dmg + 2d8 Light</b>. <br><b>Allies:</b> Cleansed. <b>Enemies:</b> Buffs Stripped.",
        parents: ['wrathful_smite', 'hallowed_ground'],
        effect: { action: 'michaellas_verdict', cost: 125 }
    },
    'luminas_grace': {
        name: "Lumina's Grace",
        type: 'passive',
        branch: 'Magic - Elemental',
        elementReq: 'light',
        description: "\"The light does not merely reveal; it empowers. Those who have walked the path of the saint find their very soul resonant with the divine frequency.\" <br><span class='text-yellow-200'>[Light Passive]</span> <br>Increase the <b>Die Size</b> of all Light damage by 1 step (e.g., d8 -> d10).",
        parents: ['hallowed_barrage', 'michaellas_verdict'],
        effect: { type: 'light_dice_upgrade' }
    },
    'hallowed_ground': {
        name: "Hallowed Ground",
        type: 'active',
        branch: 'Magic - Elemental',
        elementReq: 'light',
        description: "\"Sanctify the earth beneath your feet.\" <br><span class='text-yellow-200'>[Light Art] [Cost: 30 MP]</span> <br>Purifies the area around you (Radius 5). <b>Cleanses</b> all debuffs from you and allies.",
        parents: ['divine_blessing'],
        effect: { action: 'hallowed_ground', cost: 30 }
    },
    'sanctuary_of_zenith': {
        name: "Sanctuary of Zenith",
        type: 'active',
        branch: 'Magic - Elemental',
        elementReq: 'light',
        description: "\"The darkness cannot abide the dawn. Establish a domain of absolute purity where the dead cannot tread and the living are made whole.\" <br><span class='text-yellow-200'>[Light Art] [Cost: 30 MP]</span> <br>Creates a <b>3x3 Sanctuary</b> (3 Turns). <br><b>Allies inside:</b> Heal 5%/turn & Auto-Cleanse. <br><b>Undead:</b> Cannot enter.",
        parents: ['hallowed_ground'],
        effect: { action: 'sanctuary_of_zenith', cost: 30 }
    },
    'banquet_of_einherjar': {
        name: "Banquet of the Einherjar",
        type: 'active',
        branch: 'Magic - Elemental',
        elementReq: 'light',
        description: "\"The war is eternal, but the spirit must be fed. Break bread with the gods and rise with the strength of legends.\" <br><span class='text-yellow-200'>[Light Art] [Cost: 100 MP]</span> <br><b>Prepare Phase:</b> Root self and end turn. <br><b>Next Turn:</b> Heal 50% HP & gain <b>+20% Stats / +1 Move</b> (3 Turns) for you and allies.",
        parents: ['wrathful_smite', 'hallowed_ground'],
        effect: { action: 'banquet_of_einherjar', cost: 100 }
    },
    'seal_of_divine_architect': {
        name: "Seal of the Divine Architect",
        type: 'passive',
        branch: 'Magic - Elemental',
        elementReq: 'light',
        description: "\"To build a world free of suffering, one must first lay the foundation that denies death itself.\" <br><span class='text-yellow-200'>[Light Passive]</span> <br>Using <b>Hallowed Ground</b>, <b>Sanctuary</b>, or <b>Banquet</b> leaves a <b>Divine Seal</b> (3 Turns) at your feet. <br><b>Effect:</b> Prevents death for <b>ANYONE</b> standing on it (HP -> 1), then breaks.",
        parents: ['sanctuary_of_zenith', 'banquet_of_einherjar'],
        effect: { type: 'passive_seal_spawn' }
    },
    'darkness_contract': {
        name: "Darkness' Contract",
        type: 'passive',
        branch: 'Magic - Elemental',
        elementReq: 'void',
        description: "\"The void recognizes its own. You stare back, and it blinks first.\" <br><span class='text-cyan-300'>[Void Passive]</span> <br>Resistant to Void defense penetration.",
        parents: ['paradox_research'],
        effect: { type: 'void_resist_buff', value: 0.2 }
    },
    'oblivions_hunger': {
        name: "Oblivion's Hunger",
        type: 'toggle',
        branch: 'Magic - Elemental',
        elementReq: 'void',
        description: "\"The Void devours not just flesh, but the very concept of power.\" <br><span class='text-purple-400'>[Void Toggle]</span> <br><b>Void Spells</b> cost <b>25% more MP</b>. <br><b>Effect:</b> Inflicts <b>Essence Devoured</b> (3 Turns). Affected enemies deal <b>Neutral Damage</b> and lose all <b>Elemental Resistances</b>.",
        parents: ['darkness_contract'],
        effect: { toggle: 'oblivions_hunger' }
    },
    'nullity_sphere': {
        name: "Nullity Sphere",
        type: 'active',
        branch: 'Magic - Elemental',
        elementReq: 'void',
        description: "\"The Void is not merely an absence; it is a hunger.\" <br><span class='text-purple-400'>[Void Art] [Cost: 20% Max HP]</span> <br>Sacrifice life to deal <b>2d8 + HP Cost</b> Void Damage. <br><b>Effect:</b> Ignores <b>20% Defense</b>. Inherits Range and 50% of Spell Amp.",
        parents: ['oblivions_hunger'],
        effect: { action: 'nullity_sphere', cost: 0 } // Cost handled manually in logic
    },
    'nihility_form': {
        name: "Nihility Form",
        type: 'toggle',
        branch: 'Magic - Elemental',
        elementReq: 'void',
        description: "\"To embrace the nothingness is to reject the limitations of matter. You are no longer flesh, but a silhouette of reality—burning your own life force to remain anchored while the world passes through you.\" <br><span class='text-purple-400'>[Void Toggle] [Upkeep: 25 HP & 25 MP]</span> <br><b>Effect:</b> Become Semi-Incorporeal. <br>• Phase through Enemies and Obstacles. <br>• <b>+25%</b> Attack & Defense. <br>• <b>+10%</b> Defense Ignore.",
        parents: ['entropy_edge', 'oblivions_hunger'],
        effect: { toggle: 'nihility_form' }
    },
    'necrotic_ascension': {
        name: "Necrotic Ascension",
        type: 'passive',
        branch: 'Magic - Elemental',
        elementReq: 'void',
        description: "\"The heart stops, but the will remains. Shed your mortality and embrace the cold efficiency of the grave.\" <br><span class='text-purple-400'>[Dark Passive]</span> <br><b>Undead State:</b> Immunity to Enemy Lifesteal. <br><b>Sustain:</b> +20% Lifesteal on all attacks. <br><b>Revive:</b> Survive fatal damage once per expedition (50% HP). <br><span class='text-red-400'>[Weakness]</span> Take <b>+50% Light Damage</b>.",
        parents: ['nihility_form', 'nullity_sphere'],
        effect: { passive: 'necrotic_ascension' }
    },
    'entropy_edge': {
        name: "Entropy Edge",
        type: 'toggle',
        branch: 'Magic - Elemental',
        elementReq: 'void',
        description: "\"Armor does not break; it simply ceases to be.\" <br><span class='text-purple-400'>[Void Toggle] [20 MP/Turn]</span> <br>Attacks deal <b>+1d10 Void Dmg</b> and inflict <b>Void Erosion</b> (-5% Def, Max 5 Stacks).",
        parents: ['darkness_contract'],
        effect: { toggle: 'entropy_edge' }
    },
    'greater_infusion': {
        name: "Aetheric Saturation",
        type: 'passive',
        branch: 'Magic - Elemental',
        elementReq: 'elemental',
        description: "\"The blade is not merely coated; it drinks the element. Fire does not just burn; it consumes.\" <br><span class='text-cyan-300'>[Elemental Passive]</span> <br>Weapons infused with Elemental Essence deal <b>1d10</b> bonus damage (up from 1d8).",
        parents: ['elemental_ignition'],
        effect: { type: 'infusion_buff', dice: 10 }
    },

    // 8. Harmonic Damping (Elemental Absorption) - Child of Aetheric Saturation
    'elemental_absorption': {
        name: "Harmonic Damping",
        type: 'passive',
        branch: 'Magic - Elemental',
        elementReq: 'elemental',
        description: "\"To understand the storm is to walk through it unscathed. You vibrate at the frequency of the magic striking you.\" <br><span class='text-cyan-300'>[Elemental Passive]</span> <br>Take <b>10% Less Damage</b> from elemental enemies. Elemental Weakness damage on Armor/Shield reduced to <b>175%</b> (from 200%).",
        parents: ['greater_infusion'],
        effect: { type: 'elemental_resist_buff' }
    },

    // 9. Essence Resonance (Essence Mastery) - Child of Harmonic Damping
    'essence_mastery': {
        name: "Essence Resonance",
        type: 'passive',
        branch: 'Magic - Elemental',
        elementReq: 'elemental',
        description: "\"You hear the song trapped within the crystallized magic. When you release it, it screams.\" <br><span class='text-cyan-300'>[Elemental Passive]</span> <br>Using Elemental Essence items deals <b>Double Damage</b>. Essence drop rate increased by <b>50%</b>.",
        parents: ['elemental_absorption'],
        effect: { type: 'essence_buff' }
    },
    // =========================================================================
    // HEMISPHERE 2: MAGICAL (Down - Positive Y)
    // =========================================================================
    'focus_point': {
        name: "Third Eye Open",
        type: 'passive',
        branch: 'Magic',
        description: "\"You can see the invisible energy of the world, humming like a plucked string. You do not just see the world; you see its source code.\" <br><span class='text-cyan-300'>[Magic Passive]</span> <br>All Spells deal <b>5% more damage</b>.",
        parents: ['the_root'],
        effect: { type: 'mag_dmg_mult', value: 0.05 }
    },

    // --- WEDGE C: MANA CONTROL (Utility - Far Left) ---
    'mana_control': {
        name: "Mental Discipline",
        type: 'passive',
        branch: 'Magic - Utility',
        description: "\"Do not force the spell. Guide it. The Aether is a torrent; to drink from it without drowning requires an iron will.\" <br><span class='text-cyan-300'>[Utility Passive]</span> <br>All spells cost <b>1 less Mana</b>.",
        parents: ['focus_point'],
        effect: { type: 'mana_reduction', value: 1 }
    },
    'higher_mana_control': {
        name: "Arcane Weaving",
        type: 'passive',
        branch: 'Magic - Utility',
        description: "\"Stitch the threads of the aether with efficiency. Waste nothing, for the void watches every drop spent.\" <br><span class='text-cyan-300'>[Utility Passive]</span> <br>All spells cost an additional <b>2 less Mana</b> (Cumulative).",
        parents: ['mana_control'],
        effect: { type: 'mana_reduction', value: 2 }
    },
    'innate_manipulation': {
        name: "Living Conduit",
        type: 'passive',
        branch: 'Magic - Utility',
        description: "\"Magic flows from you as easily as breath. You are the vessel, the gate, and the key.\" <br><span class='text-cyan-300'>[Utility Passive]</span> <br>All spells cost an additional <b>2 less Mana</b> (Cumulative).",
        parents: ['higher_mana_control'],
        effect: { type: 'mana_reduction', value: 2 }
    },
    'harmonic_attunement': {
        name: "Magical Resonance",
        type: 'passive',
        branch: 'Magic - Utility',
        description: "\"Chaos is a ladder, but reliability is the ground beneath it. Tune your soul to the frequency of certainty.\" <br><span class='text-cyan-300'>[Passive]</span> <br>When rolling spell damage, a <b>1</b> is converted to a <b>2</b>.",
        parents: ['innate_manipulation'],
        effect: { type: 'min_roll_2' }
    },
    'mana_overloading': {
        name: "Soul Burn",
        type: 'toggle',
        branch: 'Magic - Utility',
        description: "\"Let it tear through your veins. Power demands a price, paid in exhaustion and blood.\" <br><span class='text-purple-300'>[Stance: Toggle]</span> <br>Spells deal <b>1.5x Damage</b> but cost <b>Double Mana</b>.",
        parents: ['higher_mana_control'],
        effect: { toggle: 'mana_overload' }
    },
    'void_trance': {
        name: "Meditate",
        type: 'toggle',
        branch: 'Magic - Utility',
        description: "\"To fill the vessel, one must first empty the mind. Silence the world, and the mana will return.\" <br><span class='text-purple-300'>[Stance: Toggle]</span> <br>Regen <b>20% MP/turn</b> but cannot cast spells.",
        parents: ['mana_overloading'],
        effect: { toggle: 'void_trance' }
    },
    'vital_stasis': {
        name: "Catnap",
        type: 'toggle',
        branch: 'Magic - Utility',
        description: "\"The body heals when the spirit is still. Become stone, and let the earth knit your flesh.\" <br><span class='text-purple-300'>[Stance: Toggle]</span> <br>Regen <b>5% HP/turn</b> but cannot move.",
        parents: ['mana_overloading'],
        effect: { toggle: 'vital_stasis' }
    },

    // --- WEDGE D: FLUX CONTROL (AoE - Left Center) ---
    'flux_control': {
        name: "Unstable Geometry",
        type: 'passive',
        branch: 'Magic - AoE',
        description: "\"Let it bleed. A spell shouldn't just hit a target; it should consume the space around them.\" <br><span class='text-cyan-300'>[AoE Passive]</span> <br>Area-of-Effect spells deal <b>10% more damage</b>.",
        parents: ['focus_point'],
        effect: { type: 'aoe_dmg_mult', value: 0.10 }
    },
    'concentrated_spread': {
        name: "Shockwaves",
        type: 'passive',
        branch: 'Magic - AoE',
        description: "\"The explosion is not the end; it is only the beginning. The air itself should shatter.\" <br><span class='text-cyan-300'>[AoE Passive]</span> <br>Splash damage from area spells is <b>10% stronger</b>.",
        parents: ['flux_control'],
        effect: { type: 'splash_boost', value: 0.10 }
    },
    'lobbed_fire': {
        name: "Artillery",
        type: 'passive',
        branch: 'Magic - AoE',
        description: "\"Distance is safety. Rain destruction from beyond their reach, like a god passing judgment.\" <br><span class='text-cyan-300'>[AoE Passive]</span> <br>Cast AoE spells from <b>1 tile further away</b>.",
        parents: ['concentrated_spread'],
        effect: { type: 'aoe_range', value: 1 }
    },
    'siege_protocol': {
        name: "Heavy Artillery",
        type: 'passive',
        branch: 'Magic - AoE',
        description: "\"Why shatter a shield when you can level the fortress?\" <br><span class='text-cyan-300'>[AoE Passive]</span> <br>Splash damage is <b>15% stronger</b>, but AoE spells cost <b>10% more Mana</b>.",
        parents: ['lobbed_fire'],
        effect: { type: 'siege_protocol' }
    },
    'rain_of_ruin': {
        name: "Bombardment",
        type: 'toggle',
        branch: 'Magic - AoE',
        description: "\"It is not about accuracy; it is about volume. Let the sky fall.\" <br><span class='text-purple-300'>[Stance: Toggle]</span> <br>AoE spells cost <b>50% more Mana</b> but fire <b>3 times</b> at 60% damage.",
        parents: ['lobbed_fire'],
        effect: { toggle: 'rain_of_ruin' }
    },
    'ground_zero': {
        name: "Eye of the Storm",
        type: 'toggle',
        branch: 'Magic - AoE',
        description: "\"Focus the singularity. Forget the edges. Make the center absolute.\" <br><span class='text-purple-300'>[Stance: Toggle]</span> <br>AoE spells deal <b>+30% Damage</b> to the main target, but <b>-50% Splash Damage</b>.",
        parents: ['concentrated_spread'],
        effect: { toggle: 'ground_zero' }
    },
    'singularity': {
        name: "Unstable Concentration",
        type: 'toggle',
        branch: 'Magic - AoE',
        description: "\"Force the storm into a bottle. Compress the chaos into a single point of annihilation.\" <br><span class='text-purple-300'>[Stance: Toggle]</span> <br>AoE spells become <b>Single Target</b> dealing <b>200% Damage</b> (Cost: <b>Double MP</b>).",
        parents: ['ground_zero'],
        effect: { toggle: 'singularity' }
    },
    'aftershock': {
        name: "Long Lasting Storm",
        type: 'passive',
        branch: 'Magic - AoE',
        description: "\"The echoes kill just as surely as the shout. The storm lingers.\" <br><span class='text-cyan-300'>[AoE Passive]</span> <br>Removes the splash damage penalty from 'Eye of the Storm'.",
        parents: ['ground_zero'],
        effect: { type: 'aftershock' }
    },

    // --- WEDGE E: CONCENTRATION (Single Target - Right Center) ---
    'concentration_training': {
        name: "Tunnel Vision",
        type: 'passive',
        branch: 'Magic - ST',
        description: "\"There is only you and the target. The rest of the world fades to gray. Silence the noise.\" <br><span class='text-cyan-300'>[ST Passive]</span> <br>Single-Target spells deal <b>10% more damage</b>.",
        parents: ['focus_point'],
        effect: { type: 'st_dmg_mult', value: 0.10 }
    },
    'spell_sniper': {
        name: "Far-Sight",
        type: 'passive',
        branch: 'Magic - ST',
        description: "\"Magic flies true if the mind is clear. You can hit a fly from across the hall.\" <br><span class='text-cyan-300'>[ST Passive]</span> <br>Cast Single-Target spells from <b>1 tile further away</b>.",
        parents: ['concentration_training'],
        effect: { type: 'st_range', value: 1 }
    },
    'focused_fire': {
        name: "Ray Focusing",
        type: 'passive',
        branch: 'Magic - ST',
        description: "\"Pierce the dark. A beam of light never deviates, and neither should you.\" <br><span class='text-cyan-300'>[ST Passive]</span> <br>Cast Single-Target spells from an additional <b>1 tile further away</b>.",
        parents: ['spell_sniper'],
        effect: { type: 'st_range', value: 1 }
    },
    'aetheric_lance': {
        name: "Ethereal Lance",
        type: 'toggle',
        branch: 'Magic - ST',
        description: "\"Physical laws are suggestions. Ignore the shield; strike the soul.\" <br><span class='text-purple-300'>[Stance: Toggle]</span> <br><b>Passive:</b> Ignore 10% Mag Def. <br><b>Active:</b> Pay 10 MP to pierce target and hit enemy behind for 50%.",
        parents: ['focused_fire'],
        effect: { toggle: 'aetheric_lance' }
    },
    'arcane_sigil': {
        name: "Sigil of Inevitability",
        type: 'active',
        branch: 'Magic - ST',
        description: "\"Paint them in aether. Mark them for deletion. The Weave rejects their existence.\" <br><span class='text-red-300'>[Active Art] [Cost: 20 MP]</span> <br>Mark a target. They take <b>20% increased Magic Damage</b> until they die or you switch targets.",
        parents: ['focused_fire'],
        effect: { action: 'arcane_sigil', cost: 20 }
    },
    'power_blast': {
        name: "Overcharge",
        type: 'toggle',
        branch: 'Magic - ST',
        description: "\"Pour everything into one shot. Risk the burnout for the kill.\" <br><span class='text-purple-300'>[Stance: Toggle]</span> <br>ST spells deal <b>25% more damage</b> and knockback, but cost <b>50% more Mana</b>.",
        parents: ['spell_sniper'],
        effect: { toggle: 'power_blast' }
    },
    'harmonic_escalation': {
        name: "Resonant Cascade",
        type: 'passive',
        branch: 'Magic - ST',
        description: "\"Heat builds pressure. The resonance grows louder with every strike until the target shatters.\" <br><span class='text-cyan-300'>[Passive]</span> <br>Consecutive hits on same target increase damage by <b>10%</b> (Max 50%).",
        parents: ['power_blast'],
        effect: { type: 'harmonic_escalation' }
    },
    'mana_barrage': {
        name: "Aetheric Torrent",
        type: 'toggle',
        branch: 'Magic - ST',
        description: "\"Quantity is a quality all its own. Drown them in bolts of pure light.\" <br><span class='text-purple-300'>[Stance: Toggle]</span> <br>ST spells cost <b>50% more MP</b> but fire a <b>3-round burst</b> (60% dmg each).",
        parents: ['power_blast'],
        effect: { toggle: 'mana_barrage' }
    },    
    'event_horizon': {
        name: "Event Horizon",
        type: 'active',
        branch: 'Magic - Elemental',
        elementReq: 'void',
        description: "\"To drink the world, one must first become a hollow vessel.\" <br><span class='text-purple-400'>[Void Art] [Cost: 60 MP]</span> <br><b>Self-Target (Radius 2).</b> Deals <b>150% Void Dmg</b> to surrounding enemies. <br><b>Gluttony:</b> Damage increases by <b>+30%</b> for every enemy suffering from <b>Essence Devoured</b> (Max 5). <br><span class='text-red-400'>[Drawback]</span> Nullifies your Elemental Affinities for 3 turns.",
        parents: ['entropy_edge', 'oblivions_hunger'],
        effect: { action: 'event_horizon', cost: 60 }
    },
    'space_rift': {
        name: "Dimensional Tear",
        type: 'active',
        branch: 'Magic - Elemental',
        elementReq: 'void',
        description: "\"The distance between two points is only a suggestion. Disregard it. But do not linger in the fold, for when reality snaps back, it bites.\" <br><span class='text-purple-400'>[Void Art] [Cost: 40 MP]</span> <br>Tear open two connected <b>Void Rifts</b> (5 Turns): One at your feet, one at the target. <br><b>Effect:</b> Walking into one teleports you to the other. <br><b>Closure:</b> When they close, anyone standing on them takes <b>25% Max HP</b> Void Damage.",
        parents: ['entropy_edge'],
        effect: { action: 'space_rift', cost: 40 }
    },
    'insatiable_void': {
        name: "Insatiable Void",
        type: 'toggle',
        branch: 'Magic - Elemental',
        elementReq: 'void',
        parents: ['event_horizon', 'space_rift'], 
        description: "\"The hunger of the void is not a malice, but a law. Gravity bows, light fractures, and matter obeys. You become the event horizon—a walking apocalypse that draws all things to their end.\" <br><span class='text-purple-400'>[Dark Toggle: 30 MP/Turn]</span> <br><b>Pull 1</b> enemies within 2 tiles. Gain <b>+30% Lifesteal</b>. <br><b>Synergy:</b> If <b>Vacuum Fist</b> is active, attacks inflict <b>10% Void Shred</b> (Def Down). <br><span class='text-red-500'>[Warning]</span> Consumes <b>10% HP</b> if you do not attack.",
        effect: { toggle: 'insatiable_void' }
    },
    'coin_counters_eye': {
        name: "Coin-Counter's Eye",
        type: 'passive',
        branch: 'Core',
        description: "\"Gold has a scent, if you know how to sniff it out.\" <br><span class='text-cyan-300'>[Utility Passive]</span> <br>Gain <b>+5% Gold</b> dropped from enemies.",
        parents: ['the_root'],
        effect: { type: 'gold_drop', value: 0.05 }
    },

    // 2A. Silver-Tongued Negotiator (Business Intuition)
    'mercantile_intuition': {
        name: "Silver-Tongued Negotiator",
        type: 'passive',
        branch: 'Mercantile',
        description: "\"Words are currency. Spend them wisely, and you'll never pay full price.\" <br><span class='text-cyan-300'>[Utility Passive]</span> <br>Gain an additional <b>+5% Gold</b> from enemies. Selling items yields <b>10% more Gold</b>.",
        parents: ['coin_counters_eye'],
        effect: { type: 'mercantile_buff', gold_drop: 0.05, sell_bonus: 0.10 }
    },

    // 2B. Artisan's Eye (Craftsman's Instinct)
    'appraisers_eye': {
        name: "Artisan's Eye",
        type: 'passive',
        branch: 'Craftsmanship',
        description: "\"You can spot a flaw in the steel or a crack in the wood from across the room.\" <br><span class='text-cyan-300'>[Utility Passive]</span> <br>Decrease the cost of buying Weapons, Armor, Shields, Catalysts, and Lures by <b>10%</b>.",
        parents: ['coin_counters_eye'],
        effect: { type: 'buy_discount_gear', value: 0.10 }
    },

    // 2C. Green-Thumb (Nature's Watcher)
    'verdant_touch': {
        name: "Green-Thumb",
        type: 'passive',
        branch: 'Gardener',
        description: "\"Growth is a conversation. You just need to know how to listen.\" <br><span class='text-cyan-300'>[Utility Passive]</span> <br>Decrease the wait time for Gardening by <b>10%</b>.",
        parents: ['coin_counters_eye'],
        effect: { type: 'garden_speed', value: 0.10 }
    },

    // --- NEW SKILLS ---

    // 3A. Syndicate Membership (Black Market's Deal) - Child of Mercantile
    'underground_connections': {
        name: "Syndicate Membership",
        type: 'passive',
        branch: 'Mercantile',
        description: "\"They keep the good stuff in the back for friends. And you are a very good friend.\" <br><span class='text-cyan-300'>[Utility Passive]</span> <br>Black Market stocks <b>+1 Item</b>. Seasonal item costs reduced by <b>20%</b>.",
        parents: ['mercantile_intuition'],
        effect: { type: 'black_market_buff', stock: 1, discount: 0.20 }
    },

    // 3B. Steel-Shaper's Thrift (Blacksmith's Efficiency) - Child of Craftsmanship
    'forge_economy': {
        name: "Steel-Shaper's Thrift",
        type: 'passive',
        branch: 'Craftsmanship',
        description: "\"Heat and hammer, wasted on nothing. Every scrap of metal finds a purpose.\" <br><span class='text-cyan-300'>[Utility Passive]</span> <br>Decrease the cost of crafting <b>Blacksmith Items</b> by <b>25%</b>.",
        parents: ['appraisers_eye'],
        effect: { type: 'blacksmith_discount', value: 0.25 }
    },

    // 3C. Resonant Synthesis (Atelier's Efficacy) - Child of Craftsmanship
    'resonant_synthesis': {
        name: "Resonant Synthesis",
        type: 'passive',
        branch: 'Craftsmanship',
        description: "\"Magic binds easier when you hum the right tune. The materials want to cooperate.\" <br><span class='text-cyan-300'>[Utility Passive]</span> <br>Decrease the cost of crafting <b>Magic Items</b> (Catalysts, Essences) by <b>25%</b>.",
        parents: ['appraisers_eye'],
        effect: { type: 'magic_craft_discount', value: 0.25 }
    },

    // 3D. Apothecary's Compendium (Book of Alchemistry) - Child of Gardener
    'apothecary_wisdom': {
        name: "Apothecary's Compendium",
        type: 'passive',
        branch: 'Gardener',
        description: "\"The soil provides the cure, if you know how to brew it. Extract every drop of potency.\" <br><span class='text-cyan-300'>[Utility Passive]</span> <br><b>+25% Potency</b> for HP/MP Potions. <b>-25% Gold Cost</b> for brewing.",
        parents: ['verdant_touch'],
        effect: { type: 'potion_buff_economy', potency: 0.25, cost_discount: 0.25 }
    },
    // 4A. Magnate's Ledger (Merchant's Proficiency) - Child of Silver-Tongued Negotiator
    'magnates_ledger': {
        name: "Magnate's Ledger",
        type: 'passive',
        branch: 'Mercantile',
        description: "\"A coin in the hand is worth two in the bush, but a coin invested correctly is worth an empire.\" <br><span class='text-cyan-300'>[Utility Passive]</span> <br>Selling items yields an additional <b>15% Gold</b>. Increases <b>Skill Capacity by 2</b>.",
        parents: ['mercantile_intuition'],
        effect: { type: 'mercantile_mastery_cap', sell_bonus: 0.15, capacity: 2 }
    },

    // 4B. Grandmaster's Touch (Craftsman's Proficiency) - Child of Artisan's Eye
    'grandmasters_touch': {
        name: "Grandmaster's Touch",
        type: 'passive',
        branch: 'Craftsmanship',
        description: "\"The difference between a tool and a masterpiece is the soul poured into the iron. And the price tag.\" <br><span class='text-cyan-300'>[Utility Passive]</span> <br>Equipment (Weapons, Armor, Shields) sell for <b>10% more</b>. Increases <b>Skill Capacity by 2</b>.",
        parents: ['appraisers_eye'],
        effect: { type: 'crafting_mastery_cap', sell_bonus: 0.10, capacity: 2 }
    },

    // 4C. Verdant Transmutation (Alchemist's Proficiency) - Child of Green-Thumb
    'verdant_transmutation': {
        name: "Verdant Transmutation",
        type: 'passive',
        branch: 'Gardener',
        description: "\"To distill the essence of nature is to bottle life itself. To sell it is to bottle fortune.\" <br><span class='text-cyan-300'>[Utility Passive]</span> <br>Potions and Consumables sell for <b>20% more</b>. Increases <b>Skill Capacity by 2</b>.",
        parents: ['verdant_touch'],
        effect: { type: 'alchemy_mastery_cap', sell_bonus: 0.20, capacity: 2 }
    },
};