const DICE_PROGRESSION = [1, 2, 4, 6, 8, 10, 12, 14, 16, 20];

const SKILL_TREE = {
    // --- CORE ---
    'the_root': {
        name: "The First Breath",
        type: 'mastery', // [MODIFICATION] Changed to 'mastery'
        description: "\"In the frozen wastes, knowledge is heat.\" Gain +5% XP from all sources.",
        x: 0, y: 0,
        parents: [],
        effect: { type: 'xp_mult', value: 0.05 }
    },

    // --- PHYSICAL BRANCH ---
    'muscle_control': {
        name: "Kinetic Awakening",
        type: 'passive',
        description: "\"Your muscles knot with new density.\" Your physical attacks deal 5% more damage.",
        x: 0, y: -1,
        parents: ['the_root'],
        effect: { type: 'phys_dmg_mult', value: 0.05 }
    },

    // =========================================================================
    // DEXTERITY BRANCH (Left)
    // =========================================================================
    'dextrous_control': {
        name: "Flow State",
        type: 'passive',
        description: "\"A heavy blade is a burden.\" You deal 10% more damage when using swift weapons (Daggers, Bows, Rapiers, etc.).",
        x: -2, y: -2,
        parents: ['muscle_control'],
        effect: { type: 'weapon_class_boost', classes: ['Dagger', 'Thrusting Sword', 'Curved Sword', 'Lance', 'Bow'], value: 0.10 }
    },
    'consecution_technique': {
        name: "The Rhythm of Ruin",
        type: 'trigger',
        description: "\"Strike. Recover. Strike again.\" Attacking the same target repeatedly increases your damage by 10% each hit (up to 30%).",
        x: -3, y: -2.5,
        parents: ['dextrous_control'],
        effect: { type: 'consecution_stack' }
    },
    'defense_exploitation': {
        name: "Needle's Eye",
        type: 'passive',
        description: "\"There is no such thing as perfect armor.\" Your swift weapon attacks bypass 5% of the enemy's Defense.",
        x: -4, y: -3,
        parents: ['consecution_technique'],
        effect: { type: 'armor_pierce_flat', value: 0.05 }
    },
    'weak_point_targeting': {
        name: "Heartseeker",
        type: 'active',
        description: "\"See the pulse.\" (Active Ability) Spend 10 Mana to strike a vital spot, dealing extra damage with a higher chance to land a Critical Hit.",
        x: -3, y: -4,
        parents: ['consecution_technique'],
        effect: { action: 'weak_point_attack', cost: 10 }
    },
    'light_armor_proficiency': {
        name: "Second Skin",
        type: 'passive',
        description: "\"Leather should not bind you.\" While wearing Light Armor, you have a 5% higher chance to Dodge attacks.",
        x: -2, y: -0.5, // Shifted up-right
        parents: ['dextrous_control'],
        effect: { type: 'light_armor_dodge', value: 0.05 }
    },
    'leather_padding': {
        name: "Hardened Hide",
        type: 'passive',
        description: "\"Treated with alchemical salts.\" Your Light Armor provides 50% more Defense protection.",
        x: -3, y: -0.5,
        parents: ['light_armor_proficiency'],
        effect: { type: 'light_armor_def_mult', value: 1.5 }
    },
    'weapon_mastery_dex': {
        name: "Razor's Edge",
        type: 'passive',
        description: "\"A dull blade is a danger to its wielder.\" Your swift weapons become deadlier, using a larger dice size for damage rolls.",
        x: -4, y: -1.5,
        parents: ['dextrous_control'],
        effect: { type: 'dice_upgrade', classes: ['Dagger', 'Thrusting Sword', 'Curved Sword', 'Lance', 'Bow'] }
    },

    // --- DEX SUB-BRANCH 1: FOCAL AGILITY (Melee Finesse) ---
    'focal_agility': {
        name: "Weapon Resonance",
        type: 'passive',
        description: "\"Listen to its hunger.\" You deal 5% more damage with specialist weapons like Scythes, Rapiers, and Curved Swords.",
        x: -5, y: -1, // Branches Left/Up
        parents: ['weapon_mastery_dex'],
        effect: { type: 'dex_weapon_buff', value: 0.05 }
    },
    'deathly_flourish': {
        name: "Reap and Sow",
        type: 'active',
        description: "\"Never be where the corpse falls.\" (Scythe Ability) Spend 10 Mana to strike for 150% damage and gain a burst of speed (Haste).",
        x: -6, y: 0,
        parents: ['focal_agility'],
        effect: { action: 'deathly_flourish', cost: 10 }
    },
    'piercing_fang': {
        name: "Needlepoint",
        type: 'toggle',
        description: "\"Flesh has pores.\" (Thrusting Sword Stance) While active, your attacks cost 5 Mana but pierce deeper, ignoring an additional 10% of enemy Defense.",
        x: -6, y: -1,
        parents: ['focal_agility'],
        effect: { toggle: 'piercing_fang' }
    },
    'certificate_of_dance': {
        name: "Blade Waltz",
        type: 'passive',
        description: "\"To stop moving is to die.\" (Curved Sword Passive) After attacking, you gain a temporary burst of evasion, making you harder to hit.",
        x: -6, y: -2,
        parents: ['focal_agility'],
        effect: { type: 'curved_sword_move' }
    },

    // --- DEX SUB-BRANCH 2: PRECISION TRAINING (Ranged/Assassin) ---
    'precision_training': {
        name: "Predator's Eye",
        type: 'toggle',
        description: "\"Narrow your world.\" (Stance) While active, Bows can shoot further and Daggers are more likely to land Critical Hits.",
        x: -5, y: -2.5, // Branches Left/Down
        parents: ['weapon_mastery_dex'],
        effect: { toggle: 'precision_training' }
    },
    'mighty_shot': {
        name: "Thunderbolt",
        type: 'active',
        description: "\"Punch a hole in the sky.\" (Bow Ability) Spend 20 Mana to loose a devastating shot that deals double damage and pierces armor.",
        x: -6, y: -3,
        parents: ['precision_training'],
        effect: { action: 'mighty_shot', cost: 20 }
    },
    'sneak_attack': {
        name: "Assassin's Whisper",
        type: 'active',
        description: "\"A blade in the dark.\" (Dagger Ability) Spend 15 Mana to strike from the shadows, dealing heavy damage with a very high Critical Hit chance.",
        x: -5, y: -4,
        parents: ['precision_training'],
        effect: { action: 'sneak_attack', cost: 15 }
    },

    // =========================================================================
    // STRENGTH BRANCH (Right)
    // =========================================================================
    'power_strengthening': {
        name: "Titanic Grip",
        type: 'passive',
        description: "\"You are the mountain.\" You deal 10% more damage when using heavy weapons (Axes, Hammers, etc.).",
        x: 2, y: -2,
        parents: ['muscle_control'],
        effect: { type: 'weapon_class_boost', classes: ['Hand-to-Hand', 'Longsword', 'Axe', 'Hammer', 'Reaper'], value: 0.10 }
    },
    'power_swing': {
        name: "Sunder",
        type: 'active',
        description: "\"Break their guard.\" (Active Ability) Spend 10 Mana to deliver a crushing blow that deals 150% damage and ignores 20% of the enemy's Defense.",
        x: 2, y: -3.5,
        parents: ['power_strengthening'],
        effect: { action: 'power_swing', cost: 10 }
    },
    'heavier_swing': {
        name: "Impact",
        type: 'passive',
        description: "\"Nothing stops the mountain.\" Your 'Sunder' ability now deals even more damage (170%).",
        x: 2, y: -4.5,
        parents: ['power_swing'],
        effect: { type: 'power_swing_buff', value: 0.2 }
    },
    'barbaric_swing': {
        name: "The Red Mist",
        type: 'active',
        description: "\"Abandon reason.\" (Active Ability) Spend 20 Mana to enter a frenzy, striking 3 times in rapid succession for 70% damage each.",
        x: 1, y: -4.5,
        parents: ['power_swing'],
        effect: { action: 'barbaric_swing', cost: 20 }
    },
    'heavy_armor_proficiency': {
        name: "Iron Clad",
        type: 'passive',
        description: "\"The weight of steel is a comfort.\" While wearing Heavy Armor, you have a 5% higher chance to Block attacks.",
        x: 2, y: -0.5,
        parents: ['power_strengthening'],
        effect: { type: 'heavy_armor_block', value: 0.05 }
    },
    'high_quality_alloy': {
        name: "Metallurgy",
        type: 'passive',
        description: "\"Secrets of folding steel.\" Your Heavy Armor provides 20% more Defense protection.",
        x: 3, y: -0.5,
        parents: ['heavy_armor_proficiency'],
        effect: { type: 'heavy_armor_def_mult', value: 1.2 }
    },
    'weapon_mastery_str': {
        name: "Crushing Weight",
        type: 'passive',
        description: "\"Force equals mass times acceleration.\" Your heavy weapons hit harder, using a larger dice size for damage rolls.",
        x: 4, y: -1.5,
        parents: ['power_strengthening'],
        effect: { type: 'dice_upgrade', classes: ['Hand-to-Hand', 'Longsword', 'Axe', 'Hammer', 'Reaper'] }
    },

    // --- STR SUB-BRANCH 1: HONOR-BOUND (Duelist/Knight) ---
    'honor_bound_teaching': {
        name: "The Knight's Code",
        type: 'passive',
        description: "\"Stand firm.\" With Longswords or Lances: Gain Defense when dueling a single foe, or gain Damage when fighting many.",
        x: 5, y: -1, // Branches Right/Up
        parents: ['weapon_mastery_str'],
        effect: { type: 'honor_bound_buff' }
    },
    'riposte': {
        name: "Vengeful Guard",
        type: 'toggle',
        description: "\"Pain sharpens your strike.\" (Longsword Stance) While active, spend Mana to instantly counter-attack whenever you are hit.",
        x: 6, y: 0,
        parents: ['honor_bound_teaching'],
        effect: { toggle: 'riposte' }
    },
    'charge': {
        name: "Momentum",
        type: 'passive',
        description: "\"A lance in motion is a siege engine.\" (Lance Passive) If you move at least 2 tiles before attacking, your strike deals 50% more damage.",
        x: 6, y: -1,
        parents: ['honor_bound_teaching'],
        effect: { type: 'charge_buff' }
    },

    // --- STR SUB-BRANCH 2: BARBARIC STRENGTH (Berzerker) ---
    'barbaric_strength': {
        name: "Reckless Abandon",
        type: 'toggle',
        description: "\"Defense is for those who plan to live forever.\" (Heavy Weapon Stance) While active, you deal more damage but take more damage in return.",
        x: 5, y: -2.5, // Branches Right/Down
        parents: ['weapon_mastery_str'],
        effect: { toggle: 'barbaric_strength' }
    },
    'savage_beast_claw': {
        name: "Pummel",
        type: 'active',
        description: "\"Violence in its purest form.\" (Fist Ability) Spend 25 Mana to unleash a barrage of 5 rapid punches.",
        x: 6, y: -2,
        parents: ['barbaric_strength'],
        effect: { action: 'savage_beast_claw', cost: 25 }
    },
    'earthshaker': {
        name: "Impact Tremor",
        type: 'active',
        description: "\"Shatter their footing.\" (Hammer Ability) Spend 15 Mana to slam the ground, damaging your target and shaking the area around them.",
        x: 6, y: -3,
        parents: ['barbaric_strength'],
        effect: { action: 'earthshaker', cost: 15 }
    },
    'woodcutter': {
        name: "Hewing Strikes",
        type: 'passive',
        description: "\"A tree falls one chop at a time.\" (Axe Passive) Repeatedly attacking the same target breaks their armor, allowing you to ignore their Defense.",
        x: 6, y: -4,
        parents: ['barbaric_strength'],
        effect: { type: 'woodcutter_stack' }
    },


    // =========================================================================
    // MAGICAL BRANCH (DOWN - Positive Y)
    // =========================================================================
    'focus_point': {
        name: "Third Eye Open",
        type: 'passive',
        description: "\"You can see the invisible energy of the world.\" Your spells deal 5% more damage.",
        x: 0, y: 1,
        parents: ['the_root'],
        effect: { type: 'mag_dmg_mult', value: 0.05 }
    },

    // --- MANA CONTROL (Left-Down) ---
    'mana_control': {
        name: "Mental Discipline",
        type: 'passive',
        description: "\"Do not force the spell. Guide it.\" All your spells cost 1 less Mana to cast.",
        x: -2, y: 2,
        parents: ['focus_point'],
        effect: { type: 'mana_reduction', value: 1 }
    },
    'higher_mana_control': {
        name: "Arcane Weaving",
        type: 'passive',
        description: "\"Stitch the threads.\" All your spells cost 2 less Mana to cast.",
        x: -3, y: 3,
        parents: ['mana_control'],
        effect: { type: 'mana_reduction', value: 2 }
    },
    'innate_manipulation': {
        name: "Living Conduit",
        type: 'passive',
        description: "\"Magic flows from you.\" All your spells cost 2 less Mana to cast.",
        x: -4, y: 4,
        parents: ['higher_mana_control'],
        effect: { type: 'mana_reduction', value: 2 }
    },
    'mana_overloading': {
        name: "Soul Burn",
        type: 'toggle',
        description: "\"Let it tear through your veins.\" (Toggle) While active, your spells deal massive damage (1.5x) but cost double the Mana.",
        x: -2, y: 4,
        parents: ['higher_mana_control'],
        effect: { toggle: 'mana_overload' }
    },
    // [UPDATED COORDINATES: Y=5]
    'harmonic_attunement': {
        name: "Harmonic Attunement",
        type: 'passive',
        description: "\"The chaos of magic naturally seeks order within you.\" When casting spells, any dice roll of 1 is treated as a 2.",
        x: -4.5, y: 5, 
        parents: ['innate_manipulation'],
        effect: { type: 'min_roll_2' }
    },
    'void_trance': {
        name: "Void Trance",
        type: 'toggle',
        description: "\"Silence the world. Hear the aether.\" (Toggle) While active, you regenerate 20% MP per turn but cannot Cast Spells.",
        x: -3, y: 5, 
        parents: ['mana_overloading'],
        effect: { toggle: 'void_trance' }
    },
    'vital_stasis': {
        name: "Vital Stasis",
        type: 'toggle',
        description: "\"Lock your form in time.\" (Toggle) While active, you regenerate 5% HP per turn but cannot Move.",
        x: -2, y: 5, 
        parents: ['mana_overloading'],
        effect: { toggle: 'vital_stasis' }
    },

    // --- FLUX CONTROL (Center-Down) ---
    'flux_control': {
        name: "Unstable Geometry",
        type: 'passive',
        description: "\"Let it bleed.\" Area-of-Effect spells (spells that hit multiple targets) deal 10% more damage.",
        x: 0, y: 2,
        parents: ['focus_point'],
        effect: { type: 'aoe_dmg_mult', value: 0.10 }
    },
    'concentrated_spread': {
        name: "Shockwaves",
        type: 'passive',
        description: "\"The explosion is not the end.\" The splash damage from your area spells is 10% stronger.",
        x: 0, y: 3,
        parents: ['flux_control'],
        effect: { type: 'splash_boost', value: 0.10 }
    },
    'lobbed_fire': {
        name: "Artillery",
        type: 'passive',
        description: "\"Distance is safety.\" You can cast Area-of-Effect spells from further away.",
        x: -1, y: 4,
        parents: ['concentrated_spread'],
        effect: { type: 'aoe_range', value: 1 }
    },
    'ground_zero': {
        name: "Eye of the Storm",
        type: 'toggle',
        description: "\"Focus the singularity.\" (Toggle) While active, Area spells deal significantly more damage to the main target, but splash damage is reduced.",
        x: 1, y: 4,
        parents: ['concentrated_spread'],
        effect: { toggle: 'ground_zero' }
    },
    // [UPDATED COORDINATES: Y=5]
    'siege_protocol': {
        name: "Siege Protocol",
        type: 'passive',
        description: "\"Overwhelming force is the only force.\" Your AoE splash damage is 15% stronger, but spells cost 10% more Mana.",
        x: -2.5, y: 5, // Updated
        parents: ['lobbed_fire'],
        effect: { type: 'siege_protocol' }
    },
    'rain_of_ruin': {
        name: "Rain of Ruin",
        type: 'toggle',
        description: "\"Let the sky fall.\" (Toggle) AoE spells cost 50% more Mana but fire 3 times at 60% damage each.",
        x: -1.5, y: 5, // Updated
        parents: ['lobbed_fire'],
        effect: { toggle: 'rain_of_ruin' }
    },
    'singularity': {
        name: "Singularity",
        type: 'toggle',
        description: "\"Compress the storm into a single point.\" (Toggle) AoE spells become Single Target and deal 200% damage, but cost 25% more Mana.",
        x: 0.5, y: 5, // Updated
        parents: ['ground_zero'],
        effect: { toggle: 'singularity' }
    },
    'aftershock': {
        name: "Aftershock",
        type: 'passive',
        description: "\"The echo is as deadly as the shout.\" 'Eye of the Storm' no longer reduces splash damage.",
        x: -0.5, y: 5, // Updated
        parents: ['ground_zero'],
        effect: { type: 'aftershock' }
    },
    // [MODIFICATION END]

    // --- CONCENTRATION (Right-Down) ---
    'concentration_training': {
        name: "Tunnel Vision",
        type: 'passive',
        description: "\"Only you and the target.\" Single-Target spells deal 10% more damage.",
        x: 2, y: 2,
        parents: ['focus_point'],
        effect: { type: 'st_dmg_mult', value: 0.10 }
    },
    'spell_sniper': {
        name: "Far-Sight",
        type: 'passive',
        description: "\"Magic flies true.\" You can cast Single-Target spells from further away.",
        x: 3, y: 3,
        parents: ['concentration_training'],
        effect: { type: 'st_range', value: 1 }
    },
    'focused_fire': {
        name: "Ray Focusing",
        type: 'passive',
        description: "\"Pierce the dark.\" You can cast Single-Target spells from even further away.",
        x: 4, y: 2,
        parents: ['spell_sniper'],
        effect: { type: 'st_range', value: 1 }
    },
    'power_blast': {
        name: "Overcharge",
        type: 'toggle',
        description: "\"Pour everything into one shot.\" (Toggle) While active, Single-Target spells deal more damage and knock enemies back, but cost more Mana.",
        x: 4, y: 4,
        parents: ['spell_sniper'],
        effect: { toggle: 'power_blast' }
    },
    
    // [MODIFICATION START] New Concentration Skills
    'aetheric_lance': {
        name: "Aetheric Lance",
        type: 'toggle',
        description: "\"Focus the mana into a needle point.\" (Passive) ST spells ignore 20% Mag Def. (Toggle) Pay 10 MP to pierce through to the enemy behind for 50% damage.",
        x: 3, y: 5,
        parents: ['focused_fire'],
        effect: { toggle: 'aetheric_lance' }
    },
    'arcane_sigil': {
        name: "Arcane Sigil",
        type: 'active',
        description: "\"Mark them for deletion.\" (Active) Spend 20 MP to mark a target. They take 20% increased Magic Damage from all sources.",
        x: 4, y: 5,
        parents: ['focused_fire'],
        effect: { action: 'arcane_sigil', cost: 20 }
    },
    'harmonic_escalation': {
        name: "Harmonic Escalation",
        type: 'passive',
        description: "\"The resonance grows.\" Consecutive magic hits on the same target increase damage by 10% (Max 50%).",
        x: 5, y: 5,
        parents: ['power_blast'],
        effect: { type: 'harmonic_escalation' }
    },
    'mana_barrage': {
        name: "Mana Barrage",
        type: 'toggle',
        description: "\"Quantity is a quality all its own.\" (Toggle) ST Spells cost 50% more MP but fire a 3-round burst at 75% damage each.",
        x: 6, y: 5,
        parents: ['power_blast'],
        effect: { toggle: 'mana_barrage' }
    },
    // [MODIFICATION END]

    // --- HYBRID & ELEMENTAL BASE (Bottom) ---
    'elemental_ignition': {
        name: "Prismatic Convergence",
        type: 'trigger',
        description: "\"Weave the elements into a chain reaction.\" The first time you use a specific element in battle, it deals 10% extra damage.",
        x: 1.5, y: 3,
        parents: ['flux_control', 'concentration_training'],
        effect: { type: 'elemental_ignition' }
    },
    // [UPDATED COORDINATES: Y=6 (Roots)]
    'classical_understanding': {
        name: "Primal Elements",
        type: 'passive',
        description: "\"The foundations of reality.\" Your Fire, Water, Earth, and Wind spells dealing 10% more damage.",
        x: 0, y: 6,
        parents: ['elemental_ignition'],
        effect: { type: 'elemental_boost', elements: ['fire', 'water', 'earth', 'wind'], value: 0.10 }
    },
    'natural_study': {
        name: "Storm and Root",
        type: 'passive',
        description: "\"The chaotic vitality.\" Your Lightning and Nature spells deal 10% more damage.",
        x: 1.5, y: 6,
        parents: ['elemental_ignition'],
        effect: { type: 'elemental_boost', elements: ['lightning', 'nature'], value: 0.10 }
    },
    'paradox_research': {
        name: "Cosmic Duality",
        type: 'passive',
        description: "\"Existence and Oblivion.\" Your Light and Void spells deal 10% more damage.",
        x: 3, y: 6,
        parents: ['elemental_ignition'],
        effect: { type: 'elemental_boost', elements: ['light', 'void'], value: 0.10 }
    },
    // [UPDATED COORDINATES: Y=7 (Children)]
    'rage_of_the_sun': {
        name: "Rage of the Sun",
        type: 'passive',
        description: "\"The sun does not warm; it burns.\" Your Fire damage becomes more volatile, but hits significantly harder on average.",
        x: -1.5, y: 7,
        parents: ['classical_understanding'],
        effect: { type: 'fire_fluctuation_buff' }
    },
    'crashing_wake': {
        name: "Crashing Wake",
        type: 'passive',
        description: "\"Heavy, clinging tide.\" Enemies soaked by your Water attacks ('Drenched') move at half speed.",
        x: -0.5, y: 7,
        parents: ['classical_understanding'],
        effect: { type: 'drenched_slow_buff' }
    },
    'monolith_of_earth': {
        name: "Monolith of Earth",
        type: 'passive',
        description: "\"To shape stone is to become stone.\" Casting an Earth spell hardens your skin, granting increased Defense for a short time.",
        x: 0.5, y: 7,
        parents: ['classical_understanding'],
        effect: { type: 'earth_def_buff' }
    },
    'unending_winds': {
        name: "Unending Winds",
        type: 'passive',
        description: "\"Momentum is a resource.\" Your Wind-based speed buffs (Haste) last longer.",
        x: 1.5, y: 7,
        parents: ['classical_understanding'],
        effect: { type: 'wind_duration_buff' }
    },

    // --- STORM AND ROOT SUB-BRANCH ---
    'might_of_olympus': {
        name: "Might of Olympus",
        type: 'passive', 
        description: "\"A chaotic aftershock.\" Your Lightning attacks have a chance to trigger a second, smaller strike instantly.",
        x: 2.2, y: 7, 
        parents: ['natural_study'],
        effect: { type: 'lightning_double_strike' }
    },
    'gaias_love': {
        name: "Gaia's Love",
        type: 'passive',
        description: "\"Life feeds on life.\" When you drain health with Nature magic, you heal for 25% more.",
        x: 2.9, y: 7,
        parents: ['natural_study'],
        effect: { type: 'nature_heal_buff', value: 1.25 }
    },

    // --- COSMIC DUALITY SUB-BRANCH ---
    'divine_blessing': {
        name: "Divine Blessing",
        type: 'passive',
        description: "\"A true death.\" Undead enemies killed by your Light damage cannot be revived.",
        x: 3.6, y: 7,
        parents: ['paradox_research'],
        effect: { type: 'light_permadeath' }
    },
    'darkness_contract': {
        name: "Darkness' Contract",
        type: 'passive',
        description: "\"The void recognizes its own.\" You are more resistant to Void attacks that try to ignore your defense.",
        x: 4.4, y: 7,
        parents: ['paradox_research'],
        effect: { type: 'void_resist_buff', value: 0.2 }
    }
};