const RACES = {
    'Human': {
        Vigor: 10, Focus: 10, Stamina: 5, Strength: 5, Intelligence: 5, Luck: 5,
        description: "Versatile and well-rounded, adaptable to any path. The vanilla ice cream of adventurers, but hey, everyone likes vanilla.",
        passive: {
            name: "Jack of All Trades",
            description: "Your inherent adaptability increases the chance for all secondary effects from equipment and spells to occur by a relative 20% (e.g., a 20% chance becomes 24%).",
            evolutionDescription: "Your mastery of fortune increases this bonus to a relative 50% (e.g., a 20% chance becomes 30%).",
            // Actual calculation happens in Player.applyRacialPassive method (engine.js)
            applyEffect: (chance, playerLevel) => {
                const multiplier = playerLevel >= 20 ? 1.5 : 1.2;
                // Ensure chance is a number, default to 0 if not
                const baseChance = typeof chance === 'number' ? chance : 0;
                return baseChance * multiplier;
            }
        }
    },
    'Elf': {
        Vigor: 3, Focus: 13, Stamina: 4, Strength: 2, Intelligence: 9, Luck: 5,
        description: "Graceful and magically attuned, but physically frail. Be careful, a strong breeze might be a legitimate threat.",
        passive: {
            name: "Nature's Madness",
            description: "When unburdened by metallic armor (Heavy/Plate), you gain +1 Movement Speed and your Dodge chance is increased by a relative 50% (up to a maximum absolute bonus of +50% Dodge from this passive).",
            evolutionDescription: "Your attunement to nature deepens, increasing the Movement Speed bonus to +2.",
            // Logic implemented in movement (battle.js) and dodge calculation (engine.js Player.takeDamage)
        }
    },
    'Dwarf': {
        Vigor: 13, Focus: 6, Stamina: 10, Strength: 4, Intelligence: 2, Luck: 5,
        description: "Hardy and resilient, with a natural affinity for defense. You have two solutions to every problem: hitting it and hitting it harder.",
        passive: {
            name: "Craftsmen's Intuition",
            description: "You have a natural eye for quality, increasing the chance of finding rare weapons and equipment from loot drops by a relative 25%.",
            evolutionDescription: "Your innate understanding of weaponry allows you to strike harder with smaller arms, increasing the dice size of d6 and d8 weapons by one step (d6 → d8, d8 → d10).",
            // Base logic implemented in loot drops (battle.js checkBattleStatus)
            // Evolution logic implemented in weapon damage calculation (battle.js performAttack)
        }
    },
    'Orc': {
        Vigor: 12, Focus: 6, Stamina: 6, Strength: 11, Intelligence: 1, Luck: 4,
        description: "Fiercely strong and vigorous, favoring brute force over intellect. Great at opening jars... and skulls. Mostly skulls.",
        passive: {
            name: "Brutish Physique",
            description: "Your hardy physique reduces all incoming physical damage by 10%, but at the cost of a 10% weakness to magical damage.",
            evolutionDescription: "Your body hardens through countless battles, completely nullifying the innate magical weakness.",
            // Logic implemented in damage calculation (engine.js Player.takeDamage)
        }
    },
    'Halfling': {
        Vigor: 8, Focus: 8, Stamina: 3, Strength: 2, Intelligence: 4, Luck: 15,
        description: "Surprisingly resilient and unbelievably lucky, though not physically imposing. You'll be very accustomed to failing successfully.",
        passive: {
            name: "Failed Successfully",
            description: "When a secondary effect fails to trigger, your uncanny luck gives you a 10% chance to instantly recalculate it. This can only occur once per effect.",
            evolutionDescription: "Your luck becomes even more potent, increasing the recalculation chance to 1 in 6 (approx. 16.7%).",
            // Logic implemented in Player.rollForEffect (engine.js)
        }
    },
    'Tiefling': {
        Vigor: 9, Focus: 10, Stamina: 3, Strength: 2, Intelligence: 8, Luck: 8,
        description: "Inheritors of a fiendish bloodline, gifted with cunning and intellect. Your family reunions are... complicated.",
        passive: {
            name: "Hellish Rebuke",
            description: "Your infernal bloodline innately reflects 10% of damage taken back at the attacker, consuming 5 MP per reflection.",
            evolutionDescription: "Your power matures, allowing you to reflect damage without consuming any mana.",
            // Logic implemented in Player.takeDamage (engine.js)
        }
    },
    'Dragonborn': {
        Vigor: 12, Focus: 7, Stamina: 3, Strength: 8, Intelligence: 8, Luck: 2,
        description: "A proud lineage of draconic might, balancing physical and magical power. Prone to hoarding shiny things and accidentally setting the tavern curtains on fire.",
        passive: {
            name: "Bloodline Attunement",
            description: "You channel your raw draconic power, increasing all damage dealt by 10% in exchange for a 50% reduction in the chance to trigger secondary effects.",
            evolutionDescription: "Your bloodline's power intensifies, increasing the damage bonus to 20% at the cost of a 75% reduction in secondary effect chance.",
            // Logic implemented in damage calculation (battle.js) and Player.rollForEffect (engine.js)
        }
    },
    'Aasimar': {
        Vigor: 10, Focus: 10, Stamina: 6, Strength: 5, Intelligence: 6, Luck: 3,
        description: "Celestially touched, with a harmonious balance of mind and body. You're probably the designated driver of the celestial planes.",
        passive: {
            name: "Divine Regeneration",
            description: "Your divine nature shortens the duration of all debuffs by 1 turn (to a minimum of 1) and regenerates 2% of your maximum HP each turn.",
            evolutionDescription: "The regenerative power surges, increasing the healing to 5% of your maximum HP each turn instead.",
            // Logic implemented in applyStatusEffect (engine.js) and handlePlayerEndOfTurn (battle.js)
        }
    },
    'Beastkin': {
        Vigor: 9, Focus: 4, Stamina: 7, Strength: 9, Intelligence: 3, Luck: 8,
        description: "Possessing primal strength and instincts, a born survivor. You've definitely tried to solve a riddle by sniffing it.",
        passive: {
            name: "Bestial Instinct",
            description: "Your primal instincts sharpen your reflexes, increasing the proc chance of defensive abilities (Dodge, Block, Parry) by a relative 25%.",
            evolutionDescription: "You unlock a versatile fighting style, allowing you to equip a shield or catalyst while using Hand-to-Hand weapons.",
            // Logic implemented in Player.takeDamage and equipItem (engine.js)
        }
    },
    'Clankers': {
        Vigor: 10, Focus: 5, Stamina: 11, Strength: 5, Intelligence: 8, Luck: 1,
        description: "Constructed beings of metal and logic, incredibly durable but stiff. Sarcasm is not a part of your programming.",
        passive: {
            name: "Absolute Logic",
            description: "Your machine mind filters out hostile influence, increasing your resistance to passive debuffs by a relative 50% (up to a maximum of 80%).",
            evolutionDescription: "Your logic becomes flawless, increasing the resistance bonus to a relative 100%.",
            // Logic implemented in applyStatusEffect (engine.js)
        }
    },
    'Pinionfolk': {
        Vigor: 6, Focus: 7, Stamina: 12, Strength: 4, Intelligence: 5, Luck: 6,
        description: "Winged humanoids with hollow bones and sharp eyes. You're great at spotting things from afar and even better at complaining about cramped dungeons.", // Updated Stats
        passive: {
            name: "Flight",
            description: "Your wings grant you the ability to fly, allowing you to move over obstacles and terrain that would impede others.",
            evolutionDescription: "Your superior vantage point from the air increases the range of your weapons and catalysts by 2.",
            // Logic implemented in pathfinding (engine.js) and range calculations (battle.js)
        }
    },
    'Elementals': {
        Vigor: 5, Focus: 12, Stamina: 4, Strength: 4, Intelligence: 8, Luck: 7,
        description: "Beings of raw elemental energy given form. Naturally attuned to magic, with a somewhat volatile disposition.",
        passive: {
            name: "Innate Elementalist",
            description: "At creation, choose an elemental affinity (Fire, Water, etc.). You deal 20% increased damage with spells and enchanted weapons of that element.",
            evolutionDescription: "Your bond with your element deepens, granting you 25% damage resistance to it. Additionally, your attuned attacks now add one extra damage die to the roll (respecting the weapon/spell's cap).",
            // Logic implemented in creation (main.js/rendering.js), combat (battle.js), and defense (engine.js)
        }
    },
    'Goblinoid': { // <-- NEW RACE ADDED HERE
        Vigor: 4, Focus: 6, Stamina: 8, Strength: 5, Intelligence: 10, Luck: 7,
        description: "Small, green, and surprisingly cunning when it comes to coin. Masters of the 'five-finger discount' and 'aggressive haggling'.",
        passive: {
            name: "Sticky Fingers",
            description: "Gain a 10% discount when buying items and a 10% bonus when selling items.",
            evolutionDescription: "Every purchase has a 20% chance to gain an additional 20% discount. Every sale has a 20% chance to gain an additional 20% bonus.",
            // Logic implemented in buyItem and sellItem (engine.js)
        }
    }
};



const PLAYER_EMOJIS = {
    'Human': { 'Male': '👨', 'Female': '👩', 'Neutral': '🧑' },
    'Elf': { 'Male': '🧝‍♂️', 'Female': '🧝‍♀️', 'Neutral': '🧝' },
    'Dwarf': { 'Male': '🧔‍♂️', 'Female': '🧔‍♀️', 'Neutral': '🧔' },
    'Orc': { 'Male': '👹', 'Female': '👹', 'Neutral': '👹' },
    'Halfling': { 'Male': '👦', 'Female': '👧', 'Neutral': '🧒' },
    'Tiefling': { 'Male': '😈', 'Female': '👹', 'Neutral': '👹' }, // Note: Using Orc female for Tiefling female
    'Dragonborn': { 'Male': '🐲', 'Female': '🐉', 'Neutral': '🐲' },
    'Aasimar': { 'Male': '😇', 'Female': '😇', 'Neutral': '😇' },
    'Beastkin': { 'Male': '🦁', 'Female': '🐯', 'Neutral': '🐺' },
    'Clankers': { 'Male': '🤖', 'Female': '🤖', 'Neutral': '🤖' },
    'Pinionfolk': { 'Male': '🦅', 'Female': '🦅', 'Neutral': '🦅' },
    'Goblinoid': { 'Male': '👺', 'Female': '👺', 'Neutral': '👺' } // <-- NEW EMOJI ADDED HERE
};

const CLASSES = {
    'artificer': {
        name: 'Artificer',
        description: "A master of gadgets, gizmos, and things that go BOOM. You believe any problem can be solved with enough gears, gunpowder, and a blatant disregard for personal safety.",
        bonusStats: { Stamina: 5, Intelligence: 3, Luck: -2 },
        startingEquipment: { catalyst: 'wooden_stick', weapon: 'dagger', armor: 'travelers_garb' },
        startingItems: { 'health_potion': 1, 'mana_potion': 2 },
        startingSpells: { 'none_aoe': 1 },
        signatureAbility: {
            name: "Magic Drone",
            type: "signature",
            description: "Once per encounter, summon a drone that acts after you. HP: 50% Max HP, Stats: 25% Int/Focus.",
            cost: 30,
            duration: Infinity // Represents 'rest of encounter'
         }
    },
    'barbarian': {
        name: 'Barbarian',
        description: 'A pure brute fueled by raw strength and primal fury. Your answer to "why?" is usually "RAAAGH!"',
        bonusStats: { Strength: 5, Stamina: 3, Intelligence: -2 },
        startingEquipment: { weapon: 'battleaxe', shield: 'wooden_shield', armor: 'travelers_garb' },
        startingItems: { 'health_potion': 3 },
        startingSpells: {},
        signatureAbility: {
            name: "Enrage",
            type: "signature",
            description: "Once per encounter, consume 25 MP to enter a deadly frenzy for 3 turns. While enraged, you both deal and take 50% more physical damage.",
            cost: 25,
            duration: 4 // Duration includes activation turn + 3 more
        }
    },
    'cleric': {
        name: 'Cleric',
        description: 'A gentle soul who brings healing and faith to the battlefield. The glorified-yet-essential band-aid of the party.',
        bonusStats: { Focus: 5, Stamina: 3, Strength: -2 },
        startingEquipment: { catalyst: 'wooden_stick', armor: 'leather_armor' },
        startingItems: { 'health_potion': 2, 'mana_potion': 2 },
        startingSpells: { 'light_support': 1, 'healing_st': 1 },
        signatureAbility: {
            name: "Holy Blessings",
            type: "signature",
            description: "Once per encounter, unleash divine energy. Heals player (3d8, scales up to 7d8) and cleanses debuffs. Requires Catalyst.",
            cost: 50,
            duration: 0 // Instant effect
         }
    },
    'cook': { // New Class Added
        name: 'Cook',
        description: 'A culinary master who turns battlefield scraps into gourmet buffs. Believes the stomach is the way to victory.',
        bonusStats: { Focus: 5, Luck: 3, Strength: -2 },
        startingEquipment: { catalyst: 'wooden_stick', shield: 'iron_buckler', armor: 'travelers_garb' },
        startingItems: { 'blackwheat_seed': 1, 'cinnamonwood_seed': 1, 'beetsnip_seed': 1, 'screaming_lotus_seed': 1 },
        startingSpells: { 'water_st': 1, 'nature_support': 1 }, // Water Gun, Ingrain
        randomCookingRecipes: { count: 2, keys: ['rabbit_roast', 'humming_medley', 'fortifying_meat_pie', 'spiced_root_stew'] },
        signatureAbility: {
            name: "On-Field Cooking",
            type: "signature",
            description: "Once per encounter, prepare one known recipe. Consumes ingredients or MP (5/10/15 per missing C/U/R ingredient). Effect lasts 3 encounters, overrides existing.",
            cost: 0, // Dynamic cost handled in logic
            duration: 0 // Instant application, effect duration handled by buff system
         }
    },
    'fighter': {
        name: 'Fighter',
        description: 'An all-rounder with a strong sense of justice and martial prowess. You know the pointy end goes into the other guy. It\'s a living.',
        bonusStats: { Strength: 5, Luck: 3, Focus: -2 },
        startingEquipment: { weapon: 'steel_longsword', shield: 'wooden_shield', armor: 'leather_armor' },
        startingItems: { 'health_potion': 3 },
        startingSpells: {},
        signatureAbility: {
            name: "Weapon Mastery",
            type: "toggle",
            description: "A toggleable passive. While active, whenever a weapon attack rolls a 1, you automatically spend MP equal to the weapon's dice size (e.g., a d10 weapon costs 10 MP) to reroll the attack.",
            cost: 0, // Cost is dynamic based on weapon
            duration: Infinity // Represents toggle state
        }
    },
    'paladin': {
        name: 'Paladin',
        description: 'The blade of a god, sworn to defend the innocent with holy might. A cleric who decided that smiting is a form of proactive healing.',
        bonusStats: { Stamina: 5, Vigor: 3, Luck: -2 },
        startingEquipment: { weapon: 'rusty_sword', catalyst: 'wooden_stick', armor: 'padded_leather' },
        startingItems: { 'health_potion': 2, 'mana_potion': 1 },
        startingSpells: { 'light_st': 1, 'light_support': 1 },
        signatureAbility: {
            name: "Divine Smite",
            type: "toggle",
            description: "Toggle: After hitting with a weapon attack, spend 15 MP to add Light damage (scales 2d8 to 6d8 with Catalyst). Requires Catalyst.",
            cost: 15, // MP cost per activation, not toggle
            duration: Infinity
        }
    },
    'ranger': {
        name: 'Ranger',
        description: 'A keeper of the woods, adept with the bow and natural magic. You were social distancing before it was cool.',
        bonusStats: { Vigor: 5, Focus: 3, Intelligence: -2 },
        startingEquipment: { weapon: 'longbow', catalyst: 'wooden_stick', armor: 'travelers_garb' },
        startingItems: { 'health_potion': 2 },
        startingSpells: { 'nature_support': 1 },
        randomLures: { count: 2, types: ['beast', 'monstrosity'] },
        signatureAbility: {
            name: "Hunter's Mark",
            type: "signature", // Once per encounter
            description: "Once per encounter, mark an enemy. Weapon attacks against the mark deal +1d8 damage and can critically hit (10% base, 1.5x).",
            cost: 30,
            duration: Infinity // Represents 'rest of encounter' or until target dies
        }
    },
    'rogue': {
        name: 'Rogue',
        description: 'A sneaky bastard with an eye for prizes and a penchant for dirty tricks. If it\'s not nailed down, it\'s yours. If it is nailed down, you have a crowbar.',
        bonusStats: { Luck: 5, Intelligence: 3, Stamina: -2 },
        startingEquipment: { weapon: 'dagger', armor: 'leather_armor', catalyst: 'wooden_stick' },
        startingItems: { 'health_potion': 1, 'mana_potion': 2 },
        startingSpells: { 'void_support': 1 },
        randomLures: { count: 2, types: ['humanoid', 'undead'] },
        signatureAbility: {
            name: "Assassinate",
            type: "toggle", // Keep as toggle
            // Update description to reflect toggle behavior and conditions
            description: "Toggle: While active, your first weapon attack against an enemy at full health who hasn't dealt damage this encounter automatically critically hits (using 2x or weapon's crit multiplier, whichever is higher).",
            cost: 0, // Remove the per-use MP cost
            duration: Infinity // Represents toggle state
        }
    },
    'magus': {
        name: 'Magus',
        description: 'The quintessential magic user, weaving powerful elemental spells. You have a spell for every occasion, but you\'ll probably just use fireball.',
        bonusStats: { Intelligence: 5, Focus: 3, Strength: -2 },
        startingEquipment: { catalyst: 'wooden_wand', shield: 'wooden_shield', armor: 'travelers_garb' },
        startingItems: { 'mana_potion': 3 },
        startingSpells: { 'none_st': 1 },
        randomSpells: { count: 2, types: ['fire_st', 'water_st', 'earth_st', 'wind_st', 'lightning_st', 'nature_st'] },
        signatureAbility: {
            name: "Arcane Manipulation",
            type: "toggle", // Multi-mode toggle
            description: "Toggle between modes: Chain Magic (ST spells chain, +30% MP cost) or Wide Magic (AOE spells hit wider area, +30% MP cost).",
            cost: 0, // MP cost handled per spell cast
            duration: Infinity,
            modes: ["Chain Magic", "Wide Magic"] // Define the modes
        }
    },
    'warlock': {
        name: 'Warlock',
        description: 'A master of debilitating hexes and shadowy magic. Your power comes from a mysterious entity who\'s probably just using you for cosmic tax evasion.',
        bonusStats: { Intelligence: 5, Luck: 3, Focus: -2 },
        startingEquipment: { catalyst: 'wooden_wand', armor: 'leather_armor' },
        startingItems: { 'mana_potion': 2 },
        startingSpells: { 'none_st': 1, 'water_support': 1, 'void_st': 1 },
        signatureAbility: {
            name: "Eldritch Blessings",
            type: "toggle",
            description: "Toggle: Increase catalyst proc chance by relative 50%, but all spells cost 25% more MP.",
            cost: 0, // MP cost handled per spell cast
            duration: Infinity
        }
    }
};

// --- Added Class Categorization ---
const MARTIAL_CLASSES = ['fighter', 'barbarian', 'rogue', 'ranger', 'paladin'];
const MAGIC_CLASSES = ['magus', 'warlock', 'cleric', 'artificer', 'cook'];
// --- End Added ---

const NPC_STAT_ALLOCATIONS = {
    'artificer': { Vigor: 0.20, Focus: 0.20, Stamina: 0.15, Strength: 0.05, Intelligence: 0.25, Luck: 0.15 },
    'barbarian': { Vigor: 0.25, Focus: 0.05, Stamina: 0.20, Strength: 0.40, Intelligence: 0.05, Luck: 0.05 },
    'cleric': { Vigor: 0.20, Focus: 0.20, Stamina: 0.25, Strength: 0.10, Intelligence: 0.20, Luck: 0.05 },
    'cook': { Vigor: 0.20, Focus: 0.20, Stamina: 0.15, Strength: 0.20, Intelligence: 0.20, Luck: 0.05 },
    'fighter': { Vigor: 0.20, Focus: 0.05, Stamina: 0.30, Strength: 0.30, Intelligence: 0.05, Luck: 0.10 },
    'paladin': { Vigor: 0.15, Focus: 0.15, Stamina: 0.30, Strength: 0.25, Intelligence: 0.10, Luck: 0.05 },
    'ranger': { Vigor: 0.15, Focus: 0.15, Stamina: 0.20, Strength: 0.20, Intelligence: 0.20, Luck: 0.10 },
    'rogue': { Vigor: 0.20, Focus: 0.15, Stamina: 0.10, Strength: 0.20, Intelligence: 0.05, Luck: 0.30 },
    'magus': { Vigor: 0.10, Focus: 0.30, Stamina: 0.10, Strength: 0.05, Intelligence: 0.40, Luck: 0.05 },
    'warlock': { Vigor: 0.15, Focus: 0.20, Stamina: 0.10, Strength: 0.05, Intelligence: 0.30, Luck: 0.20 }
};

const BACKGROUNDS = {
    'wretch': {
        name: 'Wretch',
        description: 'A blank slate. For every 2 points spent anywhere, gain a small, random bonus to a derived stat. Your past is a mystery, mostly because you have amnesia from that one really bad Tuesday.',
        favoredStats: [], // Wretch benefits from all stats via procs
        growthBonus: { wretch: true } // Special flag for unique Wretch logic
    },
    'ascetic_monk': {
        name: 'Ascetic Monk',
        description: 'Trained in discipline of body and mind. You can find inner peace, but you\'d rather find the pressure point that makes a guy\'s leg go numb.',
        favoredStats: ['Vigor', 'Focus'],
        growthBonus: { vigor: { maxHp: 5 }, focus: { maxMp: 5 } } // Example: +5 HP per Vigor, +5 MP per Focus
    },
    'gladiator_slave': {
        name: 'Gladiator Slave',
        description: 'Forced to fight for survival, your body is conditioned to endure. You have more scars than friends, and you\'re friends with your scars.',
        favoredStats: ['Vigor', 'Stamina'],
        growthBonus: { vigor: { maxHp: 5 }, stamina: { physicalDefense: 0.5, magicalDefense: 0.5 } } // +0.5 P.Def/M.Def per Stamina
    },
    'highlander': {
        name: 'Highlander',
        description: 'Raised in the harsh mountains, developing peerless strength. Your idea of a fun hike involves at least one avalanche and a territorial goat.',
        favoredStats: ['Vigor', 'Strength'],
        growthBonus: { vigor: { maxHp: 5 }, strength: { physicalDamage: 1 } } // +1 P.Dmg per Strength
    },
    'war_student': {
        name: 'War Student',
        description: 'A student of tactical warfare, combining physical training with sharp intellect. You\'ve read "The Art of War" and have several highlighted, tear-stained copies.',
        favoredStats: ['Vigor', 'Intelligence'],
        growthBonus: { vigor: { maxHp: 5 }, intelligence: { magicalDamage: 1 } } // +1 M.Dmg per Int
    },
    'fey_touched': {
        name: 'Fey-Touched',
        description: 'Blessed (or cursed) with a connection to the whimsical and dangerous feywild. You speak fluent nonsense and have a worrying craving for glitter.',
        favoredStats: ['Vigor', 'Luck'],
        growthBonus: { vigor: { maxHp: 5 }, luck: { evasionChance: 0.005, critChance: 0.005 } } // +0.5% Eva/Crit per Luck
    },
    'paladins_protege': {
        name: 'Paladin\'s Protégé',
        description: 'Schooled in defensive tactics and channeling divine energy. You spent your youth polishing armor and learning how to smite... politely.',
        favoredStats: ['Focus', 'Stamina'],
        growthBonus: { focus: { maxMp: 5 }, stamina: { physicalDefense: 0.5, magicalDefense: 0.5 } }
    },
    'runesmiths_apprentice': {
        name: 'Runesmith\'s Apprentice',
        description: 'Learned to imbue physical strikes with magical force. You\'re a blacksmith who makes hammers that hit with the power of explosions and bad grammar.',
        favoredStats: ['Focus', 'Strength'],
        growthBonus: { focus: { maxMp: 5 }, strength: { physicalDamage: 1 } }
    },
    'sages_apprentice': {
        name: 'Sage\'s Apprentice',
        description: 'A dedicated student of the arcane arts. You know the ancient secrets of the cosmos, but you still put your robes on backwards sometimes.',
        favoredStats: ['Focus', 'Intelligence'],
        growthBonus: { focus: { maxMp: 5 }, intelligence: { magicalDamage: 1 } }
    },
    'hedge_mage': {
        name: 'Hedge Mage',
        description: 'A self-taught magic user with an uncanny knack for making spells work. Your spells are held together by duct tape and sheer willpower.',
        favoredStats: ['Focus', 'Luck'],
        growthBonus: { focus: { maxMp: 5 }, luck: { evasionChance: 0.005, critChance: 0.005 } }
    },
    'knights_squire': {
        name: 'Knight\'s Squire',
        description: 'Trained in both defense and the art of the blade. You\'ve carried enough armor to know exactly how to get out of it for a bathroom break.',
        favoredStats: ['Stamina', 'Strength'],
        growthBonus: { stamina: { physicalDefense: 0.5, magicalDefense: 0.5 }, strength: { physicalDamage: 1 } }
    },
    'city_investigator': {
        name: 'City Investigator',
        description: 'You survived by knowing your enemy\'s weakness, both physical and magical. You\'re the reason people say "I\'ve got a bad feeling about this."',
        favoredStats: ['Stamina', 'Intelligence'],
        growthBonus: { stamina: { physicalDefense: 0.5, magicalDefense: 0.5 }, intelligence: { magicalDamage: 1 } }
    },
    'alley_brawler': {
        name: 'Alley Brawler',
        description: 'You learned to take a punch and got lucky enough to survive. Your face has stopped more fists than a professional bodyguard.',
        favoredStats: ['Stamina', 'Luck'],
        growthBonus: { stamina: { physicalDefense: 0.5, magicalDefense: 0.5 }, luck: { evasionChance: 0.005, critChance: 0.005 } }
    },
    'eldritch_knight_initiate': {
        name: 'Eldritch Knight Initiate',
        description: 'A warrior who blends martial prowess with arcane power. Why choose between hitting someone with a sword or a fireball when you can do both?',
        favoredStats: ['Strength', 'Intelligence'],
        growthBonus: { strength: { physicalDamage: 1 }, intelligence: { magicalDamage: 1 } }
    },
    'swashbuckler': {
        name: 'Swashbuckler',
        description: 'A flamboyant fighter who relies on flair, force, and a bit of fortune. You swing from chandeliers you have no business swinging from.',
        favoredStats: ['Strength', 'Luck'],
        growthBonus: { strength: { physicalDamage: 1 }, luck: { evasionChance: 0.005, critChance: 0.005 } }
    },
    'street_urchin': {
        name: 'Street Urchin',
        description: 'You survived the harsh streets with your wits and a whole lot of luck. You see a locked door and think, "Oh look, a puzzle with a prize behind it."',
        favoredStats: ['Intelligence', 'Luck'],
        growthBonus: { intelligence: { magicalDamage: 1 }, luck: { evasionChance: 0.005, critChance: 0.005 } }
    }
};


const WEAPONS = {
    // --- Fists ---
    'fists': { name: 'Fists', class: 'Longsword', damage: [2, 2], price: 0, rarity: 'Broken', description: "Just your bare hands." },
    'caestus': { name: 'Caestus', class: 'Hand-to-Hand', damage: [2, 2], price: 50, rarity: 'Common', description: "A simple caestus made for brawling. Made from hardened leather and soft cotton, designed to protect the hand of a fighter while they tenderize someone's face." },
    'iron_ball': { name: 'Iron Ball', class: 'Hand-to-Hand', damage: [1, 6], price: 200, rarity: 'Uncommon', description: "Two iron balls fashioned in the shape of a boxing glove. Heavy, hefty, and they hit like... well, two iron balls." },
    'assassins_claw': { name: 'Assassin’s Claw', class: 'Hand-to-Hand', damage: [2, 4], price: 1000, rarity: 'Rare', description: "Claws resembling those of a feline, used by a gang of underworld assassins on their jobs. Its sharp designs are meant to strike at weak points.", effect: { critChance: 0.1, critMultiplier: 2.0 } },
    'claw_of_chimera': { name: 'Claw of Chimera', class: 'Hand-to-Hand', damage: [3, 4], damageType: 'physical', price: 4000, rarity: 'Epic', description: "Freshly cut, minimally modified claws of a Chimera, its tip still dripping with fresh poison. No one knows if this is ethical, to the monster or the target.", effect: { toxicChance: 0.15 } },
    'livyatans_scaleclaw': { name: 'Livyatan’s Scaleclaw', class: 'Hand-to-Hand', damage: [3, 6], damageType: 'void', price: 20000, rarity: 'Legendary', description: "A claw made from the reality-shifting scales of a Livyatan, capable of ignoring the armor and shield of an enemy to strike their soft flesh with ease. Quote: \"Why knock on the door when you can just phase through the wall?\"", effect: { armorPierce: 0.5 } },

    // --- Daggers ---
    'dagger': { name: 'Dagger', class: 'Dagger', damage: [1, 4], price: 50, rarity: 'Common', description: "Simple hunting daggers for new adventurers. It's not glamorous, but the pointy end reliably goes into the other guy." },
    'parrying_dagger': { name: 'Parrying Dagger', class: 'Dagger', damage: [2, 4], price: 250, rarity: 'Uncommon', description: "A finely crafted dagger capable of parrying and striking in a single movement. For those who believe the best offense is not getting a sword stuck in your face.", effect: { parry: 0.2 } },
    'psychic_blade': { name: 'Psychic Blade', class: 'Dagger', damage: [2, 6], damageType: 'psychic', price: 1200, rarity: 'Rare', range: 4, description: "A blade made from the beating hearts of the undead. Capable of coming back to its user after being thrown, which saves a lot of awkward searching mid-battle." },
    'vampiric_dagger': { name: 'Vampiric Dagger', class: 'Dagger', damage: [3, 4], price: 3200, rarity: 'Epic', description: "A dagger with a mind of its own, demanding blood sacrifice in exchange for an unending life. It's a high-maintenance relationship, but the health benefits are undeniable.", effect: { lifesteal: 0.25 } },
    'the_black_knife': { name: 'The Black Knife', class: 'Dagger', damage: [3, 6], damageType: 'void', price: 18000, rarity: 'Legendary', description: "A knife made of the void skin of Livyatan, capable of phasing in and out of reality to strike the most important target at will. Quote: \"...To this blade, armor is merely a suggestion.\"", effect: { critChance: 0.15, critMultiplier: 2.5, armorPierce: 0.25 } },

    // --- Longswords ---
    'rusty_sword': { name: 'Rusty Sword', class: 'Longsword', damage: [1, 6], price: 20, rarity: 'Broken', description: "A sword well past its prime. Probably a tetanus risk." },
    'steel_longsword': { name: 'Steel Longsword', class: 'Longsword', damage: [1, 8], price: 120, rarity: 'Common', description: "Standard issue Longsword used by soldiers and adventurers alike. Unremarkable, dependable, and unlikely to get you arrested for practicing dark magic." },
    'heavy_greatsword': { name: 'Heavy Greatsword', class: 'Longsword', damage: [2, 6], price: 350, rarity: 'Uncommon', description: "A heavy and hefty greatsword capable of dishing out heavy strikes. Preferably held by both hands, unless you enjoy dislocating your shoulder." },
    'dual_longswords': { name: 'Dual Longswords', class: 'Longsword', damage: [2, 4], price: 1800, rarity: 'Rare', description: "Two longswords to cover both sides with double the attack power. People advised adventurers against using them like this, but it does look very cool.", effect: { doubleStrike: true, dualWield: true } },
    'trolls_knight_sword': { name: 'Troll’s Knight Sword', class: 'Longsword', damage: [3, 8], price: 4500, rarity: 'Epic', description: "A heavy greatsword made from the blood of a troll, capable of resonating with the soul of its user. The more understanding the user has, the stronger it is.", effect: { intScaling: 0.2 } },
    'void_greatsword': { name: 'Void Greatsword', class: 'Longsword', damage: [3, 10], damageType: 'void', price: 20000, rarity: 'Legendary', description: "A greatsword ripped straight out of a Dullahan’s possession. It sucks the soul out of your enemy and can even possess you when you die, just long enough to get you back on your feet. Quote: \"Death is a contract, and this blade is an expert in renegotiation.\"", effect: { lifesteal: 0.25, revive: true } },
    'the_greatsword': { name: 'The Greatsword', class: 'Longsword', damage: [4, 12], price: 50000, rarity: 'Legendary', description: "A colossal slab of iron, more a monument than a weapon. Said to have been used to slay a god... or at least give one a very bad headache.", effect: { type: 'godslayer', percent_hp_damage: 0.1 } },

    // --- Thrusting Swords ---
    'rapier': { name: 'Rapier', class: 'Thrusting Sword', damage: [1, 6], price: 150, rarity: 'Common', description: "A finely crafted piercing armament capable of piercing armors, especially the gaps that most adventurers forget to cover." },
    'great_epee': { name: 'Great Épée', class: 'Thrusting Sword', damage: [1, 10], price: 400, rarity: 'Uncommon', description: "A heavy Épée blade, capable of delivering heavier strikes on a single pinpoint target with rather unsubtle force." },
    'spellblade_of_echoes': { name: 'Spellblade of Echoes', class: 'Thrusting Sword', damage: [2, 8], damageType: 'physical', price: 1600, rarity: 'Rare', description: "A blade created using empty essence shells so it can resonate with the elements. Perfect for the indecisive mage who wants to cast a fireball and stab someone in the same turn.", effect: { spellFollowUp: true } },
    'the_bloodletter': { name: 'The Bloodletter', class: 'Thrusting Sword', damage: [3, 6], price: 3800, rarity: 'Epic', description: "A sinister twisting thrusting blade, capable of easily piercing skins and rendering the insides perfect for a bloodletting ritual. Messy, but highly effective.", effect: { lifesteal: 0.25 } },
    'dragon_scale_cragblade': { name: 'Dragonscale Cragblade', class: 'Thrusting Sword', damage: [3, 8], damageType: 'lightning', price: 15000, rarity: 'Legendary', range: 3, description: "A straight cragblade made from the reversed scale of a dragon and imbued with lightning. It's capable of piercing even a Dragon’s mighty impenetrable scales. Quote: \"Fighting fire with fire is cliché. Fight dragons with something they're made of.\"", effect: { bonusVsDragon: 1.5, doubleStrikeChance: 0.25 } },

    // --- Curved Swords ---
    'shamshir': { name: 'Shamshir', class: 'Curved Sword', damage: [1, 6], price: 100, rarity: 'Common', description: "A simple curved blade, often used in festivities and self-defense. One of those is significantly more dangerous than the other." },
    'flowing_blade': { name: 'Flowing Blade', class: 'Curved Sword', damage: [1, 8], price: 300, rarity: 'Uncommon', description: "A finely crafted curved sword, intended to be used alongside sword dance traditions. It also allows the user to strike the same place multiple times with ease." },
    'elven_saber': { name: 'Elven Saber', class: 'Curved Sword', damage: [3, 4], price: 1200, rarity: 'Rare', description: "A traditional elven saber, made by using their special Cold Smithing techniques. It combines the power of a flowing river and growing forest into one very sharp object.", effect: { critChance: 0.1, critMultiplier: 2.0 } },
    'elemental_sword': { name: 'Elemental Sword', class: 'Curved Sword', damage: [2, 8], damageType: 'elemental', price: 5000, rarity: 'Epic', description: "Made using active essences of all elements, this blade is unstable and will pursue whatever element it has touched last. Handle with care, and preferably with gloves.", effect: { intScaling: 1.0, elementalBolt: true } },
    'unending_dance': { name: 'Unending Dance', class: 'Curved Sword', damage: [3, 6], price: 22000, rarity: 'Legendary', description: "A legendary blade made to ignore the laws of the universe, capable of speeding up unceasingly until it can cut the very fabric of reality apart. Quote: \"Strike once. Then strike again, faster. Repeat until the problem is solved.\"", effect: { uncapCombo: true } },

    // --- Axes ---
    'battleaxe': { name: 'Battleaxe', class: 'Axe', damage: [1, 10], price: 200, rarity: 'Common', description: "A hefty battleaxe. The proud choice for a barbarian, or anyone who sees a problem that can be solved with a single, forceful application of sharpened metal." },
    'obsidian_axe': { name: 'Obsidian Axe', class: 'Axe', damage: [2, 8], price: 400, rarity: 'Uncommon', description: "A sharp and brittle Axe made of volcanic glass. It's designed to break inside the flesh of its target, adding pain, suffering, and a very bad day." },
    'bloody_butchering_knife': { name: 'Bloody Butchering Knife', class: 'Axe', damage: [2, 10], price: 1400, rarity: 'Rare', description: "A giant cleaver made specifically to butcher humanoids and monsters alike. Its groove is made so blood easily flows from the prey to its butcher.", effect: { healOnKill: 0.1 } },
    'sunderers_battleaxe': { name: 'Sunderer’s Battleaxe', class: 'Axe', damage: [4, 6], price: 3500, rarity: 'Epic', description: "A heroic battleaxe made to sunder earth and break open armors. Its power rivals that of an earthquake, making it a terrible choice for delicate negotiations.", effect: { armorPierce: 0.5 } },
    'headless_executioner': { name: 'Headless Executioner', class: 'Axe', damage: [3, 10], damageType: 'necrotic', price: 17000, rarity: 'Legendary', description: "The execution weapon for those unwilling to die, capable of severing life from death in a single heavy swing. It slowly pulses as if it has a soul of its own. Quote: \"There are no appeals.\"", effect: { execute: 0.25 } },

    // --- Hammers ---
    'steel_mace': { name: 'Steel Mace', class: 'Hammer', damage: [1, 8], price: 180, rarity: 'Common', description: "A simple steel mace made for both domestic and adventuring duty. Equally good at bashing helmets and stubborn tent pegs." },
    'bone_club': { name: 'Bone Club', class: 'Hammer', damage: [1, 12], price: 380, rarity: 'Uncommon', description: "A club made of the hardened bone of an unidentified monster. Often wielded by Orc Barbarians, hence the unwieldy size for a normal humanoid user." },
    'battlestaff': { name: 'Battlestaff', class: 'Hammer', damage: [1, 8], price: 300, rarity: 'Uncommon', description: "A sturdy staff reinforced for physical combat. Your melee attacks scale with both Strength and Intelligence.", effect: { intScaling: 1.0 } },
    'dwarven_warhammer': { name: 'Dwarven Warhammer', class: 'Hammer', damage: [2, 8], price: 1300, rarity: 'Rare', description: "A prized possession of the Dwarves. A hammer so heavy and dense, every time it is swung, the earth quakes and the wind blows.", effect: { paralyzeChance: 0.1 } },
    'blacksmiths_workhammer': { name: 'Blacksmith’s Workhammer', class: 'Hammer', damage: [3, 8], price: 4800, rarity: 'Epic', description: "An enchanted hammer usually only used by a Blacksmith. Magic that dwells inside it can recognize armors and weapons, letting it seek weak points and potential prizes.", effect: { armorPierce: 0.3, lootBonus: true } },
    'earthshaker_hammer': { name: 'Earthshaker Hammer', class: 'Hammer', damage: [3, 10], price: 10000, rarity: 'Legendary', description: "A hammer made of the bone of a Goliath. Its heft is so otherworldly that a single slam to the ground would shake the Earth so hard Mother Gaia herself will wake up. Quote: \"If violence doesn't solve it, you aren't using a big enough hammer.\"", effect: { paralyzeChance: 0.2 } },

    // --- Lances ---
    'soldiers_spear': { name: 'Soldier’s Spear', class: 'Lance', damage: [1, 6], price: 90, rarity: 'Common', description: "Standard issue soldier’s spear. Often used in war conscription, and now often used for keeping monsters at a comfortable, non-mauling distance." },
    'masterwork_spear': { name: 'Masterwork Spear', class: 'Lance', damage: [3, 4], price: 500, rarity: 'Uncommon', description: "A masterfully made spear. A talented user will be able to use this spear to keep a very safe distance between themself and the enemy." },
    'lightning_javelin': { name: 'Lightning Javelin', class: 'Lance', damage: [3, 6], price: 1500, rarity: 'Rare', range: 4, description: "A thunderous javelin, said to be the crystallization of a thunderbolt. Capable of being thrown, reenacting the Battle of Gods on a much smaller, more mortal scale." },
    'holy_beast_halberd': { name: 'Holy Beast Halberd', class: 'Lance', damage: [2, 10], damageType: 'holy', price: 5200, rarity: 'Epic', range: 3, description: "A golden halberd blessed by a Holy Beast. Its power smites down the evil and monstrous while protecting those worthy of its divinity.", effect: { cleanseChance: 0.25 } },
    'giant_hunter': { name: 'Giant Hunter', class: 'Lance', damage: [3, 8], price: 16000, rarity: 'Legendary', description: "An ancient Lance rediscovered after the melting of Cocytus. It is said that its shape and size is the direct result of its frequent usage of slaying Gods and Monsters alike. Quote: \"Sure, it's overkill for goblins, but you don't bring a flyswatter to a dragon fight.\"", effect: { bonusVsLegendary: 1.5 } },

    // --- Bows ---
    'longbow': { name: 'Longbow', class: 'Bow', damage: [1, 6], price: 100, rarity: 'Common', range: 6, description: "The quintessential weapon for a hunter. Simple, easy to use, and keeps you far away from the teeth and claws." },
    'golden_greatbow': { name: 'Golden Greatbow', class: 'Bow', damage: [1, 10], price: 600, rarity: 'Uncommon', range: 6, description: "A heavy, gold-coated greatbow. While mostly used for display, it turns out that being shot by a very expensive arrow hurts just as much." },
    'sharpshots_beloved': { name: 'Sharpshot’s Beloved', class: 'Bow', damage: [2, 6], price: 1700, rarity: 'Rare', range: 7, description: "A seemingly simple shortbow, jet-black in color. It has a particular quality for helping its user find their target’s weak points.", effect: { critChance: 0.15, critMultiplier: 2.5 } },
    'eye_of_medusa': { name: 'Eye of Medusa', class: 'Bow', damage: [4, 4], price: 4000, rarity: 'Epic', range: 6, description: "A crossbow made of the eye of a Cockatrice, but called the Eye of Medusa because it has a better ring to it. Capable of turning its targets into statues from a long range.", effect: { petrifyChance: 0.3 } },
    'vacuum_greatbow': { name: 'Vacuum Greatbow', class: 'Bow', damage: [2, 10], damageType: 'void', price: 12000, rarity: 'Legendary', range: 8, description: "A vacuous greatbow made from the vacuum lining and hollow bone of a Livyatan. Its shot blinks in and out of existence, piercing reality itself to hit its target. Quote: \"Why shoot through armor when you can just shoot around it in the fourth dimension?\"", effect: { armorPierce: 0.5 } },

    // --- Reapers ---
    'farmers_glaive': { name: 'Farmer’s Glaive', class: 'Reaper', damage: [1, 6], price: 80, rarity: 'Common', description: "A simple glaive easily found in a farmer’s shed. Sometimes used as a defensive weapon when wolves get a little too interested in the sheep." },
    'light_scythe': { name: 'Light Scythe', class: 'Reaper', damage: [1, 8], price: 280, rarity: 'Uncommon', description: "A light scythe given to military personnel for use on both the battlefield and the actual field. Sharp, light, and easily stored." },
    'grave_scythe': { name: 'Grave Scythe', class: 'Reaper', damage: [2, 8], damageType: 'necrotic', price: 1100, rarity: 'Rare', range: 2, description: "A scythe of those who live in death. Probably a side effect of them being a farmer back in their life. Old habits die hard. Or, in this case, they don't." },
    'obsidian_lamina': { name: 'Obsidian Lamina', class: 'Reaper', damage: [3, 6], price: 3300, rarity: 'Epic', description: "A sharp volcanic glass made to reap the life of its opponent cleanly. Nobody knows if its jet-black appearance is from its material or the heaps of dried blood.", effect: { critChance: 0.25, critMultiplier: 2.0 } },
    'grims_beloved': { name: 'Grim’s Beloved', class: 'Reaper', damage: [3, 8], damageType: 'necrotic', price: 19000, rarity: 'Legendary', description: "A beloved weapon of the Grim Reaper. People say it was a normal scythe before the Reaper got a handle on it. Now, it has certain... performance expectations. Quote: \"Borrowing it is fine. Just be sure to give it back.\"", effect: { lifesteal: 0.4 } }
};

const CATALYSTS = {
    'no_catalyst': { name: 'None', price: 0, rarity: 'Broken', range: 0, description: "No catalyst equipped." },
    // Broken
    'wooden_stick': { name: 'Wooden Stick', price: 15, rarity: 'Broken', range: 3, description: "A simple stick that can channel basic spells. Basically a magic twig." },
    // Common
    'wooden_wand': { name: 'Wooden Wand', price: 70, rarity: 'Common', range: 3, description: "A wand that slightly amplifies magic. It's the thought that counts.", effect: { spell_amp: 1 } },
    'cracked_orb': { name: 'Cracked Orb', price: 70, rarity: 'Common', range: 3, description: "An orb that makes spells cheaper to cast. Has a worrying rattle.", effect: { mana_discount: 5 } },
    // Uncommon
    'hardwood_staff': { name: 'Hardwood Staff', price: 300, rarity: 'Uncommon', range: 4, description: "A sturdy staff that moderately amplifies spells. Good for leaning on, too.", effect: { spell_amp: 2 } },
    'magical_orb': { name: 'Magical Orb', price: 300, rarity: 'Uncommon', range: 4, description: "A well-crafted orb that reduces mana costs. Polished to a distracting shine.", effect: { mana_discount: 10 } },
    // Rare
    'arcane_focus': { name: 'Arcane Focus', price: 1200, rarity: 'Rare', range: 4, description: "A crystal that hums with latent power, slowly replenishing your mana.", effect: { spell_amp: 2, mp_regen_percent: 0.05 } },
    'cypresswood_staff': { name: 'Cypresswood Staff', price: 1200, rarity: 'Rare', range: 4, description: "A staff made from the resilient wood of an ancient cypress, it slowly mends your wounds.", effect: { spell_amp: 2 ,hp_regen_percent: 0.05 } },
    'spell_sniper_lens': { name: 'Spell Sniper\'s Lens', price: 1250, rarity: 'Rare', range: 7, description: "A crystal lens that helps you keep foes at a distance.", effect: { spell_amp: 2 } }, // Range increased by +3
    'spellweaver_catalyst': { name: 'Spellweaver Catalyst', price: 1250, rarity: 'Rare', range: 5, description: "A chaotic catalyst that has a chance to imbue your spells with random secondary effects from other elements.", effect: { spell_amp: 2, spell_weaver: 0.25 } },
    'overdrive_tome': { name: 'Overdrive Tome', price: 1400, rarity: 'Rare', range: 5, description: "A dangerous tome that offers immense power at a price. Spells have a 15% chance to deal 3x damage, but the backlash deals damage to you equal to 20% of your Max HP.", effect: { spell_amp: 2, overdrive: { chance: 0.15, multiplier: 3.0, self_damage: 0.2 } } },
    // Epic
    'staff_of_loss': { name: 'Staff of Loss', price: 4200, rarity: 'Epic', range: 6, description: "A staff that channels sorrow and despair, granting your spells a chance to strike a critical blow.", effect: { spell_amp: 3, spell_crit_chance: 0.1, spell_crit_multiplier: 1.75 } },
    'staff_of_the_magi': { name: 'Staff of the Magi', price: 4500, rarity: 'Epic', range: 6, description: "The quintessential wizard's staff. Pointy at one end, glows on command, and makes spells hurt more. What's not to like?", effect: { spell_amp: 3, mp_regen_percent: 0.10 } },
    'runic_scepter': { name: 'Runic Scepter', price: 4500, rarity: 'Epic', range: 6, description: "Carved with runes of unmaking, this scepter allows your spells to partially ignore enemy magic resistance.", effect: { spell_amp: 4, spell_penetration: 0.25 } },
    'crystal_ball': { name: 'Crystal Ball', price: 4800, rarity: 'Epic', range: 6, description: "A flawless crystal orb that clarifies the mind, making complex spells feel effortless and revealing critical weaknesses.", effect: { spell_amp: 2, mana_discount: 10, spell_crit_chance: 0.15, spell_crit_multiplier: 2.0 } },
    'vampiric_orb': { name: 'Vampiric Orb', price: 6000, rarity: 'Epic', range: 6, description: "A pulsating orb of dark energy that restores your health and mana when you vanquish a foe with a spell.", effect: {spell_amp: 3, spell_vamp: 0.15 } },
    // Legendary
    'mountain_carver': { name: 'Mountain Carver', price: 12000, rarity: 'Legendary', range: 7, description: "A legendary staff carved from the heart of a mountain, amplifying spells with terrestrial fury. Not recommended for indoor use.", effect: { spell_amp: 6 } },
    'deep_sea_staff': { name: 'Deep Sea Staff', price: 12000, rarity: 'Legendary', range: 7, description: "A staff of coral and pearl that channels the ocean's endless power, providing frankly ridiculous amounts of regeneration.", effect: { spell_amp: 3, hp_regen_percent: 0.20, mp_regen_percent: 0.15 } },
    'dragons_heart': { name: 'Dragon\'s Heart', price: 15000, rarity: 'Legendary', range: 7, description: "A still-beating dragon's heart, granting immense magical power and making spells feel laughably cheap to cast.", effect: { spell_amp: 4, mana_discount: 20 } },
    'blackshadow_staff': { name: 'Blackshadow Staff', price: 18000, rarity: 'Legendary', range: 7, description: "A staff of pure darkness that corrupts your spells, twisting them into devastating, soul-shattering critical strikes.", effect: { spell_amp: 3, spell_crit_chance: 0.25, spell_crit_multiplier: 3.0 } }
};

const SHIELDS = {
    'no_shield': {name: 'None', defense: 0, blockChance: 0, price: 0, rarity: 'Broken', description: "No protection on your arm."},
    'wooden_shield': {name: 'Wooden Shield', defense: 1, blockChance: 0.10, price: 75, rarity: 'Common', description: "A simple, roughly made wooden shield. Mostly keeps the rain off."},
    'iron_kite_shield': {name: 'Iron Kite Shield', defense: 2, blockChance: 0.15, price: 250, rarity: 'Common', description: "A sturdy shield shaped for cavalry, offering decent protection."},
    'iron_buckler': { name: 'Iron Buckler', defense: 1, price: 300, rarity: 'Uncommon', description: "A small, agile shield designed for parrying attacks. Or a very large dinner plate.", effect: { type: 'parry', chance: 0.15 } },
    'brass_shield': { name: 'Brass Shield', defense: 3, blockChance: 0.15, price: 500, rarity: 'Uncommon', description: "A polished brass shield that's both durable and stylish." },
    'trollblood_shield': { name: 'Trollblood Shield', defense: 3, price: 1400, rarity: 'Rare', description: "A shield imbued with the legendary regenerative powers of trolls. Smells faintly of wet dog.", effect: { hp_regen_percent: 0.05 } },
    'titanium_parrying_shield': { name: 'Titanium Parrying Shield', defense: 3, price: 1200, rarity: 'Rare', description: "A lightweight yet incredibly tough shield perfect for turning aside deadly blows.", effect: { type: 'parry', chance: 0.20 } },
    'spiked_retaliator': { name: 'Spiked Retaliator', defense: 2, price: 1500, rarity: 'Rare', description: "A vicious shield that lashes out with a punishing counter-attack whenever you strike an enemy. It has anger issues.", effect: { attack_follow_up: { damage: [1, 4], paralyze_chance: 0.1, duration: 1 } } },
    'tower_greatshield': {name: 'Tower Greatshield', defense: 5, blockChance: 0.4, price: 3500, rarity: 'Epic', description: "A shield so large it has its own zip code, offering immense protection at the cost of seeing where you're going."},
    'purifying_crystal_shield': { name: 'Purifying Crystal Shield', defense: 5, blockChance: 0.20, price: 6000, rarity: 'Epic', description: "A shield with a crystal that pulses with clean energy, shrugging off curses and hexes.", effect: { type: 'debuff_resist', chance: 0.5 } },
    'maxwellian_dueling_shield': { name: 'Maxwellian Dueling Shield', defense: 5, price: 4000, rarity: 'Epic', description: "An ornate and perfectly balanced shield, a masterpiece of defensive art. So beautiful it's almost a shame to block things with it.", effect: { type: 'parry', chance: 0.25 } },
    'heavy_slabshield': { name: 'Heavy Slabshield', defense: 10, blockChance: 0.20, price: 5000, rarity: 'Legendary', description: "Less of a shield and more of a personal, portable wall. Effective, but not exactly nimble.", effect: { type: 'reflect', amount: 0.1 } },
    'exa_reflector': { name: 'Exa-Reflector', defense: 5, price: 8000, rarity: 'Legendary', description: "An advanced shield of strange design that reflects a portion of incoming damage back at the attacker. 'No, you!'", effect: { type: 'reflect', amount: 0.25 } }
};

const ARMOR = {
    'travelers_garb': {name: 'Traveler\'s Garb', defense: 1, price: 0, rarity: 'Broken', description: "Simple clothes for a long journey. Offers minimal protection."},
    'leather_armor': {name: 'Leather Armor', defense: 3, price: 50, rarity: 'Common', description: "Hardened leather plates, a solid choice for any adventurer."},
    'padded_leather': {name: 'Padded Leather', defense: 5, price: 150, rarity: 'Common', description: "Reinforced leather with thick padding underneath. Surprisingly comfy."},
    'chainmail_armor': {name: 'Chainmail Armor', defense: 8, price: 400, rarity: 'Uncommon', description: "A tunic of interlocking metal rings. Heavy, but better than being stabbed.", metallic: true},
    'half_plate_armor': {name: 'Half-Plate Armor', defense: 10, price: 800, rarity: 'Uncommon', description: "A mix of chainmail and solid metal plates, offering good protection with some mobility.", blockChance: 0.10, metallic: true},
    'silenced_leather_armor': {name: 'Silenced Leather Armor', defense: 3, price: 750, rarity: 'Rare', description: "Specially treated leather that muffles sound, making you unnervingly quiet. Perfect for sneaking up on people... or refrigerators at midnight.", effect: { type: 'dodge', chance: 0.10 }},
    'steel_plate_armor': {name: 'Steel Plate Armor', defense: 15, price: 1500, rarity: 'Rare', description: "A full suit of articulated steel plates. Makes a lot of noise.", blockChance: 0.15, metallic: true},
    'assassin_cloak_armor': {name: 'Assassin Cloak Armor', defense: 5, price: 2000, rarity: 'Epic', description: "Dark, flowing robes with hidden armor plates, designed for evasion and looking mysterious in dark corners.", effect: { type: 'dodge', chance: 0.20 }},
    'archmages_robes': {name: 'Archmage\'s Robes', defense: 8, price: 5000, rarity: 'Epic', description: "Woven with threads of pure mana, these robes constantly regenerate your magical energy and make spells easier to cast. Also surprisingly comfortable.", effect: { mp_regen_percent: 0.05, mana_discount: 5 }},
    'adamantine_armor': {name: 'Adamantine Armor', defense: 20, price: 5000, rarity: 'Legendary', description: "Armor forged from a legendary, nigh-unbreakable metal. You feel ridiculously safe wearing this.", blockChance: 0.15, metallic: true},
    'mirror_mail': { name: 'Mirror Mail', defense: 18, price: 6000, rarity: 'Legendary', description: "A suit of highly polished armor that reflects a portion of every blow back at the attacker. Very high maintenance.", effect: { reflect_damage: 0.25 }, metallic: true },
    'soul_steel_armor': {name: 'Soul Steel Armor', defense: 25, price: 10000, rarity: 'Legendary', description: "Adamantine infused with the captured souls of ancient warriors, creating the ultimate defense. The whispers are mostly harmless.", blockChance: 0.2, metallic: true},
    'vacuum_encaser': {name: 'Vacuum Encaser', defense: 10, price: 7500, rarity: 'Legendary', description: "A bizarre armor crafted with Livyatan parts that seems to warp space around the wearer. Causes mild nausea in bystanders.", effect: { type: 'dodge', chance: 0.25 }}
};

const LURES = {
    'no_lure': { name: 'None', price: 0, description: 'No lure equipped.' },
    'goblin_scent_gland': { name: 'Goblin Scent Gland', price: 50, description: 'The potent smell seems to attract goblins.', lureTarget: 'goblin', uses: 5 },
    'sweet_grass_scent': { name: 'Sweet Grass Scent', price: 50, description: 'The scent of a sweet smelling grass, favorite snack of the rabid rabbits.', lureTarget: 'rabid_rabbit', uses: 5 },
    'chemical_lure': { name: 'Chemical Lure', price: 70, description: 'The inexplicable stench of chemical that lures in slimes.', lureTarget: 'slime', uses: 5 },
    'grave_dirt_lure': { name: 'Grave Dirt Lure', price: 60, description: 'Disturbing this dirt seems to attract nearby skeletons.', lureTarget: 'skeleton', uses: 5 }, // Added Skeleton lure
    'rotten_cheese': { name: 'Rotten Cheese', price: 80, description: 'The pungent smell of rotten cheese that attracts the hunger of rats.', lureTarget: 'giant_rat', uses: 5 },
    'bandit_coin': { name: 'Gilded Coin', price: 100, description: 'A shiny coin that seems to attract the greedy eyes of bandits.', lureTarget: 'bandit', uses: 5 },
    'wolf_musk': { name: 'Wolf Musk', price: 75, description: 'A strong musk that draws in nearby wolves.', lureTarget: 'dire_wolf', uses: 5 },
    'zombie_bait': { name: 'Zombie Bait (Flesh)', price: 90, description: 'Rotting flesh that seems irresistible to zombies.', lureTarget: 'armored_zombie', uses: 5 }, // Added Zombie lure
    'war_horn_fragment': { name: 'War Horn Fragment', price: 150, description: 'The sound from this broken horn fragment seems to enrage nearby orcs.', lureTarget: 'orc_berserker', uses: 5 },
    'silken_cocoon': { name: 'Silken Cocoon', price: 150, description: 'A pulsating cocoon that attracts large, hungry spiders.', lureTarget: 'cave_spider', uses: 5 },
    'petrified_field_mouse': { name: 'Petrified Field Mouse', price: 175, description: 'The sight of this statue seems to attract the territorial gaze of a Cockatrice.', lureTarget: 'cockatrice', uses: 5 },
    'grave_dust': { name: 'Grave Dust', price: 200, description: 'A pouch of dust from a desecrated grave. It calls to those who command the dead.', lureTarget: 'necromancer', uses: 5 }
};

const HOME_IMPROVEMENTS = {
    storage: {
        name: 'Storage Solutions',
        upgrades: [
            { name: 'Expanded Chest', description: 'Upgrades storage to 25 unique item slots, with stacks up to 25.', cost: 400, limits: { unique: 25, stack: 25 } },
            { name: 'Walk-in Closet', description: 'Upgrades storage to 50 unique item slots, with stacks up to 50.', cost: 1600, limits: { unique: 50, stack: 50 } },
            { name: 'The Vault', description: 'Upgrades storage to 100 unique item slots, with stacks up to 100.', cost: 6000, limits: { unique: 100, stack: 100 } }
        ]
    },
    garden: {
        name: 'Landscaping Services',
        upgrades: [
            { name: 'Garden Reclamation', description: 'Unlocks a basic 2x2 farming plot in your backyard.', cost: 300, size: {width: 2, height: 2} },
            { name: 'Fertile Fields', description: 'Expands the garden to a 4x4 plot.', cost: 1200, size: {width: 4, height: 4} },
            { name: 'Arboretum Annex', description: 'Expands the garden to 6x6 and adds a special 2x2 plot for a tree.', cost: 5000, size: {width: 6, height: 6}, treeSize: {width: 2, height: 2} },
            { name: 'Grove of Plenty', description: 'Maximizes the garden to 8x8 with a larger 3x3 tree plot.', cost: 14000, size: {width: 8, height: 8}, treeSize: {width: 3, height: 3} }
        ]
    },
    kitchen: {
        name: 'Culinary Corner',
        upgrades: [
            { name: 'Kitchen & Pantry', description: 'Unlocks a new "Cooking" interface in your house to create stat-boosting foods.', cost: 1000 }
        ]
    },
    alchemy: {
        name: 'Alchemical Ambitions',
        upgrades: [
            { name: 'Home Alchemy Set', description: 'Allows you to brew basic Tier 1 potions (Health, Mana, etc.) at home.', cost: 1200 },
            { name: 'Professional Alembic', description: 'Upgrades your set to brew more complex Tier 2 potions.', cost: 8000 },
            { name: 'Magnum Opus Laboratory', description: 'The ultimate setup, allowing you to craft the most powerful Tier 3 concoctions.', cost: 24000 }
        ]
    },
    training: {
        name: 'Combat & Conditioning',
        upgrades: [
            { name: 'Sparring Circle', description: 'Unlocks a "Train" option for a simple 1v1 battle against a dummy to test your damage.', cost: 4000 },
            { name: 'Arena of Champions', description: 'Upgrades the training grounds to a fully customizable arena. Select grids and enemies from your Bestiary.', cost: 40000 }
        ]
    }
};

const SPELLS = {
    // Non-Elemental
    'none_st': {
        element: 'none', type: 'st', learnCost: 250,
        tiers: [
            { name: 'Eldritch Blast', cost: 10, damage: [2, 8], cap: 4, upgradeCost: 750, upgradeEssences: { 'fire_essence': 5, 'water_essence': 5 }, description: "A bolt of raw, crackling arcane energy." },
            { name: 'Bullet of Force', cost: 25, damage: [4, 8], cap: 7, upgradeCost: 3000, upgradeEssences: { 'earth_essence': 10, 'wind_essence': 10 }, description: "A concentrated projectile of pure kinetic force that punches through defenses." },
            { name: 'Arcane Unleashed', cost: 50, damage: [6, 8], cap: 10, description: "Release a torrent of untamed magical power, overwhelming a single target." }
        ]
    },
    'none_aoe': {
        element: 'none', type: 'aoe', learnCost: 250,
        tiers: [
            { name: 'Magical Grenade', cost: 15, damage: [2, 6], cap: 4, upgradeCost: 1000, upgradeEssences: { 'earth_essence': 5, 'wind_essence': 5 }, description: "Lob an explosive sphere of magical energy that damages nearby foes." },
            { name: 'Rain of Arrow', cost: 35, damage: [4, 6], cap: 7, upgradeCost: 4000, upgradeEssences: { 'fire_essence': 10, 'water_essence': 10 }, description: "Summon a volley of phantom arrows to strike multiple enemies." },
            { name: 'Meteor Shower', cost: 60, damage: [6, 6], cap: 10, description: "Call down a cataclysmic shower of meteors to bombard the battlefield." }
        ]
    },
    // Fire
    'fire_st': {
        element: 'fire', type: 'st', learnCost: 250,
        tiers: [
            { name: 'Fireshot', cost: 10, damage: [2, 8], cap: 4, upgradeCost: 750, upgradeEssences: { 'fire_essence': 10 }, description: "Launch a simple bolt of searing flame at a target." },
            { name: 'Fire Arrow', cost: 25, damage: [4, 8], cap: 7, upgradeCost: 3000, upgradeEssences: { 'fire_essence': 20 }, description: "Conjure an arrow of pure fire that seeks its target with burning intensity." },
            { name: 'Divine Blazing Arrow', cost: 50, damage: [6, 8], cap: 10, description: "Unleash a sacred arrow of white-hot fire that purges foes with righteous flame." }
        ]
    },
    'fire_aoe': {
        element: 'fire', type: 'aoe', learnCost: 250,
        tiers: [
            { name: 'Fireball', cost: 15, damage: [2, 6], cap: 4, upgradeCost: 1000, upgradeEssences: { 'fire_essence': 10 }, description: "Hurl a classic exploding sphere of fire, engulfing enemies in a fiery blast." },
            { name: 'Fire Orb', cost: 35, damage: [4, 6], cap: 7, upgradeCost: 4000, upgradeEssences: { 'fire_essence': 20 }, description: "Create a slow-moving but intensely hot orb of fire that detonates with great force." },
            { name: 'Great Chaos Orb', cost: 60, damage: [6, 6], cap: 10, description: "Hurl a massive, churning orb of chaotic flame that leaves a pool of lava in its wake." }
        ]
    },
    'fire_support': {
        element: 'fire', type: 'support', learnCost: 250,
        tiers: [
            { name: 'Flame, Grant me Strength', cost: 20, effect: { type: 'buff_strength', multiplier: 1.5, duration: 4 }, description: "Increase strength by 50% for 3 turns.", upgradeCost: 2000, upgradeEssences: { 'fire_essence': 15 } },
            { name: 'Chaos, Boil my Blood', cost: 40, effect: { type: 'buff_chaos_strength', strMultiplier: 2.0, defMultiplier: 0.5, duration: 4 }, description: "Increase strength by 100% but decrease all defense by 50% for 3 turns." }
        ]
    },
    // Water
    'water_st': {
        element: 'water', type: 'st', learnCost: 250,
        tiers: [
            { name: 'Water Gun', cost: 10, damage: [2, 8], cap: 4, upgradeCost: 750, upgradeEssences: { 'water_essence': 10 }, description: "Fire a high-pressure jet of water at an enemy." },
            { name: 'Surging Strike', cost: 25, damage: [4, 8], cap: 7, upgradeCost: 3000, upgradeEssences: { 'water_essence': 20 }, description: "Command a wave to crash down upon a single foe with the ocean's might." },
            { name: 'Pressurized Water Laser', cost: 50, damage: [6, 8], cap: 10, description: "Focus a stream of water into a razor-thin laser that slices through armor." }
        ]
    },
    'water_aoe': {
        element: 'water', type: 'aoe', learnCost: 250,
        tiers: [
            { name: 'Water Spout', cost: 15, damage: [2, 6], cap: 4, upgradeCost: 1000, upgradeEssences: { 'water_essence': 10 }, description: "Summon a whirling spout of water to drench and damage a group of enemies." },
            { name: 'Water Surf', cost: 35, damage: [4, 6], cap: 7, upgradeCost: 4000, upgradeEssences: { 'water_essence': 20 }, description: "Unleash a massive wave that crashes across the battlefield." },
            { name: 'Grand Flood', cost: 60, damage: [6, 6], cap: 10, description: "Inundate the area with a cataclysmic flood, drowning all who stand against you." }
        ]
    },
    'water_support': {
        element: 'water', type: 'support', learnCost: 250,
        tiers: [
            { name: 'Water Sport', cost: 20, effect: { type: 'debuff_strength', multiplier: 0.75, duration: 4 }, description: "Decrease enemies' strength by 25% for 3 turns.", upgradeCost: 2000, upgradeEssences: { 'water_essence': 15 } },
            { name: 'Deep Sea Protection', cost: 40, effect: { type: 'debuff_strength', multiplier: 0.5, duration: 4 }, description: "Decrease enemies' strength by 50% for 3 turns." }
        ]
    },
    // Earth
    'earth_st': {
        element: 'earth', type: 'st', learnCost: 250,
        tiers: [
            { name: 'Rock Throw', cost: 10, damage: [2, 8], cap: 4, upgradeCost: 750, upgradeEssences: { 'earth_essence': 10 }, description: "Magically hurl a heavy chunk of rock at a target." },
            { name: 'Earth\'s Edge', cost: 25, damage: [4, 8], cap: 7, upgradeCost: 3000, upgradeEssences: { 'earth_essence': 20 }, description: "Summon a jagged spear of rock from the ground to impale an enemy." },
            { name: 'Ferrum Ira Terrae', cost: 50, damage: [6, 8], cap: 10, description: "Manifest the earth's fury, encasing a foe in super-heated, molten iron." }
        ]
    },
    'earth_aoe': {
        element: 'earth', type: 'aoe', learnCost: 250,
        tiers: [
            { name: 'Tremorstrike', cost: 15, damage: [2, 6], cap: 4, upgradeCost: 1000, upgradeEssences: { 'earth_essence': 10 }, description: "Slam your power into the ground, creating a localized tremor to stagger nearby foes." },
            { name: 'Earthquake', cost: 35, damage: [4, 6], cap: 7, upgradeCost: 4000, upgradeEssences: { 'earth_essence': 20 }, description: "Shake the very foundations of the earth, causing the ground to rupture and damage your enemies." },
            { name: 'Ravine Creation', cost: 60, damage: [6, 6], cap: 10, description: "Violently tear the earth asunder, crushing all who stand against you." }
        ]
    },
    'earth_support': {
        element: 'earth', type: 'support', learnCost: 250,
        tiers: [
            { name: 'Rock Heart', cost: 20, effect: { type: 'buff_defense', multiplier: 1.5, duration: 3 }, description: "Increase physical defense by 50% for 3 turns.", upgradeCost: 2000, upgradeEssences: { 'earth_essence': 15 } },
            { name: 'Titan\'s Blood', cost: 40, effect: { type: 'buff_titan', defMultiplier: 1.5, strMultiplier: 1.5, duration: 3 }, description: "Increase physical defense and damage by 50% for 3 turns." }
        ]
    },
    // Wind
    'wind_st': {
        element: 'wind', type: 'st', learnCost: 250,
        tiers: [
            { name: 'Gale Shot', cost: 10, damage: [2, 8], cap: 4, upgradeCost: 750, upgradeEssences: { 'wind_essence': 10 }, description: "Fire a compressed blast of cutting wind at an enemy." },
            { name: 'Wind Drill', cost: 25, damage: [4, 8], cap: 7, upgradeCost: 3000, upgradeEssences: { 'wind_essence': 20 }, description: "Form a rapidly spinning vortex of wind to drill through a target's defenses." },
            { name: 'Excalibur\'s Edge', cost: 50, damage: [6, 8], cap: 10, description: "Summon a legendary blade of pure wind, so sharp it can slice through reality itself." }
        ]
    },
    'wind_aoe': {
        element: 'wind', type: 'aoe', learnCost: 250,
        tiers: [
            { name: 'Wind Gust', cost: 15, damage: [2, 6], cap: 4, upgradeCost: 1000, upgradeEssences: { 'wind_essence': 10 }, description: "Create a powerful gust of wind to buffet and damage a group of foes." },
            { name: 'Sweeping Edge', cost: 35, damage: [4, 6], cap: 7, upgradeCost: 4000, upgradeEssences: { 'wind_essence': 20 }, description: "Unleash a wide, scythe-like blade of wind that cuts across the battlefield." },
            { name: 'Hurricane Storm', cost: 60, damage: [6, 6], cap: 10, description: "Conjure a ferocious hurricane, trapping and shredding enemies in its chaotic embrace." }
        ]
    },
    'wind_support': {
        element: 'wind', type: 'support', learnCost: 250,
        tiers: [
            { name: 'Haste', cost: 25, effect: { type: 'buff_haste', duration: 4 }, description: "Grants an additional action per turn for 3 turns.", upgradeCost: 2500, upgradeEssences: { 'wind_essence': 15 } }, // Changed description slightly
            { name: 'Hermes\' Trickery', cost: 50, effect: { type: 'buff_hermes', duration: 4 }, description: "Grants Haste and doubles dodge chance for 3 turns." } // Simplified description
        ]
    },
    // Lightning
    'lightning_st': {
        element: 'lightning', type: 'st', learnCost: 250,
        tiers: [
            { name: 'Honed Bolt', cost: 10, damage: [2, 8], cap: 4, upgradeCost: 750, upgradeEssences: { 'lightning_essence': 10 }, description: "Launch a simple, crackling bolt of lightning." },
            { name: 'Lightning Bolt', cost: 25, damage: [4, 8], cap: 7, upgradeCost: 3000, upgradeEssences: { 'lightning_essence': 20 }, description: "Call down a focused, super-heated lightning strike on a single target." },
            { name: 'Wrath of the Sky', cost: 50, damage: [6, 8], cap: 10, description: "Channel the sky's fury, summoning a colossal thunderbolt that obliterates its target." }
        ]
    },
    'lightning_aoe': {
        element: 'lightning', type: 'aoe', learnCost: 250,
        tiers: [
            { name: 'Plasma Pulse', cost: 15, damage: [2, 6], cap: 4, upgradeCost: 1000, upgradeEssences: { 'lightning_essence': 10 }, description: "Release a pulse of raw plasma that arcs between nearby enemies." },
            { name: 'Electromagnetic Barrier', cost: 35, damage: [4, 6], cap: 7, upgradeCost: 4000, upgradeEssences: { 'lightning_essence': 20 }, description: "Create a deadly barrier of electricity that shocks all foes in an area." },
            { name: 'Thundercloud Form', cost: 60, damage: [6, 6], cap: 10, description: "Become a living thundercloud, raining down chaotic lightning strikes across the area." }
        ]
    },
    'lightning_support': {
        element: 'lightning', type: 'support', learnCost: 250,
        tiers: [
            { name: 'Unstable Ion', cost: 20, effect: { type: 'buff_ion_self', duration: 4 }, description: "Weapon attacks may chain to another target (including you) for 50% damage.", upgradeCost: 2000, upgradeEssences: { 'lightning_essence': 15 } },
            { name: 'Thunderbolt Blessings', cost: 40, effect: { type: 'buff_ion_other', duration: 4 }, description: "Weapon attacks may chain to other enemies. Reflect 25% of damage taken." }
        ]
    },
    // Nature
    'nature_st': {
        element: 'nature', type: 'st', learnCost: 250,
        tiers: [
            { name: 'Vine Strike', cost: 10, damage: [2, 8], cap: 4, upgradeCost: 750, upgradeEssences: { 'nature_essence': 10 }, description: "Command a thorny vine to lash out and strike a foe." },
            { name: 'Root Assault', cost: 25, damage: [4, 8], cap: 7, upgradeCost: 3000, upgradeEssences: { 'nature_essence': 20 }, description: "Summon thick, gnarled roots to burst from the earth and crush a target." },
            { name: 'Cage of the Nature', cost: 50, damage: [6, 8], cap: 10, description: "Entrap a foe in a cage of living, thorny wood that constricts and crushes them." }
        ]
    },
    'nature_aoe': {
        element: 'nature', type: 'aoe', learnCost: 250,
        tiers: [
            { name: 'Seed Bomb', cost: 15, damage: [2, 6], cap: 4, upgradeCost: 1000, upgradeEssences: { 'nature_essence': 10 }, description: "Hurl a seed that explodes into a burst of thorny shrapnel." },
            { name: 'Bamboo Field Strike', cost: 35, damage: [4, 6], cap: 7, upgradeCost: 4000, upgradeEssences: { 'nature_essence': 20 }, description: "Instantly grow a dense field of razor-sharp bamboo, impaling enemies in an area." },
            { name: 'Sea of Vines', cost: 60, damage: [6, 6], cap: 10, description: "Transform the ground into a writhing sea of thorny vines that tear at all enemies within." }
        ]
    },
    'nature_support': {
        element: 'nature', type: 'support', learnCost: 250,
        tiers: [
            { name: 'Ingrain', cost: 20, effect: { type: 'buff_ingrain', healing: [1, 6], cap: 5, indefinite: true }, description: "Regenerate HP each turn. Disables fleeing.", upgradeCost: 2000, upgradeEssences: { 'nature_essence': 15 } },
            { name: 'Blessing of Mother Nature', cost: 40, effect: { type: 'buff_mother_nature', healing: [1, 8], cap: 5, indefinite: true }, description: "Regenerate HP and MP each turn. Disables fleeing." }
        ]
    },
    // Light
    'light_st': {
        element: 'light', type: 'st', learnCost: 250,
        tiers: [
            { name: 'Photon Shot', cost: 10, damage: [2, 8], cap: 4, upgradeCost: 750, upgradeEssences: { 'light_essence': 10 }, description: "Fire a concentrated shot of pure, searing light." },
            { name: 'Divine Smite', cost: 25, damage: [4, 8], cap: 7, upgradeCost: 3000, upgradeEssences: { 'light_essence': 20 }, description: "Smite an enemy with a column of holy energy, especially effective against the undead." },
            { name: 'Light Pillar of Heaven', cost: 50, damage: [6, 8], cap: 10, description: "Call down a massive pillar of sacred light from the heavens to purge a target from existence." }
        ]
    },
    'light_aoe': {
        element: 'light', type: 'aoe', learnCost: 250,
        tiers: [
            { name: 'Lantern Spread', cost: 15, damage: [2, 6], cap: 4, upgradeCost: 1000, upgradeEssences: { 'light_essence': 10 }, description: "Release a gentle but searing wave of light, like the glow of a lantern." },
            { name: 'Beacon of Light', cost: 35, damage: [4, 6], cap: 7, upgradeCost: 4000, upgradeEssences: { 'light_essence': 20 }, description: "Erupt in a blinding flash of holy light, damaging and staggering nearby foes." },
            { name: 'Shine of the Archangel', cost: 60, damage: [6, 6], cap: 10, description: "Unfurl ethereal wings and release a devastating wave of archangelic power." }
        ]
    },
    'light_support': {
        element: 'light', type: 'support', learnCost: 250,
        tiers: [
            { name: 'Shield of Faith', cost: 20, effect: { type: 'buff_magic_defense', multiplier: 1.5, duration: 4 }, description: "Increase magical defense by 50% for 3 turns.", upgradeCost: 2000, upgradeEssences: { 'light_essence': 15 } },
            { name: 'Divine Blessings', cost: 40, effect: { type: 'buff_divine', multiplier: 2.0, duration: 4, cleanse: true }, description: "Increase magical defense by 100% for 3 turns and cleanse all debuffs." }
        ]
    },
    // Void
    'void_st': {
        element: 'void', type: 'st', learnCost: 250,
        tiers: [
            { name: 'Shadow Sneak', cost: 10, damage: [2, 8], cap: 4, upgradeCost: 750, upgradeEssences: { 'void_essence': 10 }, description: "Launch a bolt of living shadow at an enemy." },
            { name: 'Hex Strike', cost: 25, damage: [4, 8], cap: 7, upgradeCost: 3000, upgradeEssences: { 'void_essence': 20 }, description: "Strike a foe with a debilitating hex that wracks their body with dark energy." },
            { name: 'Gate of the Underworld', cost: 50, damage: [6, 8], cap: 10, description: "Tear open a momentary rift to the underworld beneath a foe, pulling them toward oblivion." }
        ]
    },
    'void_aoe': {
        element: 'void', type: 'aoe', learnCost: 250,
        tiers: [
            { name: 'Shadow Bolt', cost: 15, damage: [2, 6], cap: 4, upgradeCost: 1000, upgradeEssences: { 'void_essence': 10 }, description: "Hurl a bolt of shadow that explodes on impact, damaging nearby enemies." },
            { name: 'Void Engulf', cost: 35, damage: [4, 6], cap: 7, upgradeCost: 4000, upgradeEssences: { 'void_essence': 20 }, description: "Engulf an area in a sphere of pure void, draining the life from those within." },
            { name: 'Black Hole', cost: 60, damage: [6, 6], cap: 10, description: "Conjure a miniature black hole that pulls in and crushes all enemies in its vicinity." }
        ]
    },
    'void_support': {
        element: 'void', type: 'support', learnCost: 250,
        tiers: [
            { name: 'Shadow Shroud', cost: 25, effect: { type: 'buff_shroud', duration: 4 }, description: "Increase dodge and critical chance by 50% for 3 turns.", upgradeCost: 2500, upgradeEssences: { 'void_essence': 15 } },
            { name: 'Blessing of Voidwalker', cost: 50, effect: { type: 'buff_voidwalker', duration: 4 }, description: "Grants Shadow Shroud, +50% critical damage, and guaranteed fleeing." }
        ]
    },
    // Healing
    'healing_st': {
        element: 'healing', type: 'st', learnCost: 250, // Changed type to st (single target heal)
        tiers: [
            { name: 'Heal', cost: 10, damage: [2, 8], cap: 4, upgradeCost: 750, upgradeEssences: { 'light_essence': 10 }, description: "A simple prayer that mends minor wounds and restores vitality." },
            { name: 'Greater Heal', cost: 25, damage: [4, 8], cap: 7, upgradeCost: 3000, upgradeEssences: { 'light_essence': 20 }, description: "Channel a more powerful divine energy to mend significant injuries." },
            { name: 'Ichor\'s Blood', cost: 50, damage: [6, 8], cap: 10, description: "Invoke the restorative blood of the gods themselves to perform a miraculous, life-saving healing." }
        ]
    },
};

const QUESTS = {
        // --- Extermination ---
        'exterminate_goblin': { tier: 1, title: 'Goblin Cull', target: 'goblin', required: 10, reward: { xp: 375, gold: 150 }, description: 'The forest is overrun with goblins. Thin their numbers.' },
        'exterminate_rabid_rabbit': { tier: 1, title: 'Rabbit Stew', target: 'rabid_rabbit', required: 10, reward: { xp: 300, gold: 75 }, description: 'A local hunter wants rabid rabbits gone. Permanently.' },
        'exterminate_slime': { tier: 1, title: 'Slimy Situation', target: 'slime', required: 10, reward: { xp: 330, gold: 120 }, description: 'Clear out the slimes that have infested the old cellar.' },
        'exterminate_skeleton': { tier: 1, title: 'Restless Dead', target: 'skeleton', required: 10, reward: { xp: 300, gold: 105 }, description: 'Put the animated skeletons back to their eternal rest.' },
        'exterminate_bandit': { tier: 2, title: 'Bandit Bounties', target: 'bandit', required: 8, reward: { xp: 600, gold: 240 }, description: 'A bounty has been placed on the heads of local bandits.' },
        'exterminate_dire_wolf': { tier: 2, title: 'The Alpha', target: 'dire_wolf', required: 8, reward: { xp: 480, gold: 180 }, description: 'A particularly large pack of dire wolves is threatening the main road.' },
        'exterminate_giant_rat': { tier: 2, title: 'Rat Problem', target: 'giant_rat', required: 8, reward: { xp: 420, gold: 144 }, description: 'The town granary is infested with unusually large rats.' },
        'exterminate_armored_zombie': { tier: 2, title: 'Walking Armor', target: 'armored_zombie', required: 8, reward: { xp: 540, gold: 216 }, description: 'Zombies in old armor are proving tough for the town guard.' },
        'exterminate_orc_berserker': { tier: 3, title: 'Green Tide', target: 'orc_berserker', required: 5, reward: { xp: 600, gold: 300 }, description: 'An Orc war party has been spotted nearby. Stop their berserkers.' },
        'exterminate_cave_spider': { tier: 3, title: 'Venomous Vermin', target: 'cave_spider', required: 5, reward: { xp: 562, gold: 225 }, description: 'Giant cave spiders are nesting too close to the mines.' },
        'exterminate_cockatrice': { tier: 3, title: 'Stone Gaze', target: 'cockatrice', required: 5, reward: { xp: 675, gold: 375 }, description: 'Huntsmen are being turned to stone by vicious cockatrices.' },
        'exterminate_necromancer': { tier: 3, title: 'Master of Puppets', target: 'necromancer', required: 5, reward: { xp: 750, gold: 450 }, description: 'A necromancer is raising the dead in the old graveyard. End their foul magic.' },
        'exterminate_one_eyed_troll': { tier: 4, title: 'Troll Toll', target: 'one_eyed_troll', required: 3, reward: { xp: 900, gold: 450 }, description: 'A huge troll is blocking the mountain pass.' },
        'exterminate_unicorn': { tier: 4, title: 'Corrupted Purity', target: 'unicorn', required: 3, reward: { xp: 810, gold: 360 }, description: 'A dark magic has twisted the local unicorns into aggressive beasts.' },
        'exterminate_chimera': { tier: 4, title: 'Three-Headed Menace', target: 'chimera', required: 3, reward: { xp: 1125, gold: 540 }, description: 'A mythical chimera has been sighted, attacking livestock and travelers.' },
        'exterminate_living_armor': { tier: 4, title: 'Haunted Steel', target: 'living_armor', required: 3, reward: { xp: 990, gold: 495 }, description: 'Spirits have possessed suits of armor in the old castle.' },
        'exterminate_mountain_goliath': { tier: 5, title: 'Giant Slayer', target: 'mountain_goliath', required: 1, reward: { xp: 750, gold: 375 }, description: 'Slay the legendary Mountain Goliath that guards the peak.' },
        'exterminate_livyatan': { tier: 5, title: 'Beast of the Deep', target: 'livyatan', required: 1, reward: { xp: 675, gold: 300 }, description: 'A fisherman\'s guild has posted an enormous bounty for the head of the Livyatan.' },
        'exterminate_dragon': { tier: 5, title: 'Dragon Slayer', target: 'dragon', required: 1, reward: { xp: 900, gold: 450 }, description: 'The ultimate challenge: Slay the great Dragon of the mountains.' },
        'exterminate_dullahan': { tier: 5, title: 'Headless Horseman', target: 'dullahan', required: 1, reward: { xp: 825, gold: 420 }, description: 'A terrifying omen, the Dullahan, rides the plains. Banish it.' },

        // --- Collection ---
        'collect_goblin_ears': { tier: 1, title: 'Proof of the Deed', type: 'collection', target: 'goblin_ear', required: 5, reward: { xp: 100, gold: 50 }, description: 'A fearful merchant wants proof that the goblin problem is being handled. Bring him their ears.' },
        'collect_daggers': { tier: 1, title: 'Arming the Militia', type: 'collection', target: 'dagger', required: 3, reward: { xp: 120, gold: 200 }, description: 'The town militia needs daggers for its new recruits. Find or buy them.' },
        'collect_wolf_pelts': { tier: 2, title: 'Warmth for Winter', type: 'collection', target: 'wolf_pelt', required: 5, reward: { xp: 150, gold: 100 }, description: 'A tailor needs quality wolf pelts to make winter cloaks.' },
        'collect_longswords': { tier: 2, title: 'Blacksmith\'s Order', type: 'collection', target: 'steel_longsword', required: 5, reward: { xp: 200, gold: 300 }, description: 'The blacksmith needs a couple of standard longswords for a trade caravan.' },
        'collect_spider_venom': { tier: 3, title: 'Potent Poisons', type: 'collection', target: 'spider_venom', required: 10, reward: { xp: 250, gold: 150 }, description: 'The alchemist requires a large quantity of spider venom for his experiments.' },
        'collect_obsidian_axes': { tier: 3, title: 'Orcish Weaponry', type: 'collection', target: 'obsidian_axe', required: 1, reward: { xp: 300, gold: 500 }, description: 'A collector is fascinated by orcish culture and wants a pristine obsidian axe.' },
        'collect_unicorn_horns': { tier: 4, title: 'A Noble Cure', type: 'collection', target: 'unicorn_horn_fragment', required: 3, reward: { xp: 500, gold: 400 }, description: 'The royal physician believes unicorn horns can cure the ailing king.' },
        'collect_dragon_scales': { tier: 5, title: 'Indestructible Armor', type: 'collection', target: 'dragon_scale', required: 5, reward: { xp: 800, gold: 500 }, description: 'The king\'s blacksmith wants to forge armor from the scales of a dragon.' },
        'collect_earthshaker': { tier: 5, title: 'Might of the Mountain', type: 'collection', target: 'earthshaker_hammer', required: 1, reward: { xp: 5000, gold: 12000 }, description: 'The Dwarven king will pay handsomely for the return of the legendary Earthshaker Hammer.' },

        // --- Creation ---
        'brew_health_potions': { tier: 1, title: 'Basic Brewing', type: 'creation', target: 'health_potion', required: 5, reward: { xp: 100, gold: 200 }, description: 'The town alchemist needs a hand brewing a batch of basic Health Potions.' },
        'craft_steel_longswords': { tier: 2, title: 'Arming the Guard', type: 'creation', target: 'steel_longsword', required: 3, reward: { xp: 250, gold: 400 }, description: 'The blacksmith is fulfilling a large order for the Town Guard and needs help crafting Steel Longswords.'},
        'craft_mana_potions': { tier: 1, title: 'Mage Guild Supplies', type: 'creation', target: 'mana_potion', required: 5, reward: { xp: 120, gold: 250 }, description: 'The local mage guild needs a stock of Mana Potions for their apprentices.'},
};


const LEGACY_QUESTS = {
    'collector_of_legend': {
        title: 'Collector of Legend',
        type: 'legacy_extermination',
        targets: Object.keys(MONSTER_SPECIES),
        // MODIFICATION: Changed reward to a real item.
        reward: { xp: 5000, gold: 10000, item: 'giant_hunter' },
        description: 'Defeat a legendary version of every creature in the land.'
    }
};