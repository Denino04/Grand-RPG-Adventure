const BARRACKS_UNLOCK_LEVEL = 8;

const ELEMENTS = {
    'none': { name: 'Non-elemental', adjective: '', weakness: [], strength: [] },
    'fire': { name: 'Fire', adjective: 'Scorching', weakness: ['water', 'earth'], strength: ['nature', 'wind'] },
    'water': { name: 'Water', adjective: 'Surging', weakness: ['nature', 'lightning'], strength: ['fire', 'earth'] },
    'earth': { name: 'Earth', adjective: 'Quaking', weakness: ['water', 'wind'], strength: ['fire', 'lightning'] },
    'wind': { name: 'Wind', adjective: 'Swirling', weakness: ['fire', 'lightning'], strength: ['nature', 'earth'] },
    'lightning': { name: 'Lightning', adjective: 'Thundering', weakness: ['earth'], strength: ['water', 'wind'] },
    'nature': { name: 'Nature', adjective: 'Blossoming', weakness: ['fire', 'wind'], strength: ['water', 'earth'] },
    'light': { name: 'Light', adjective: 'Shining', weakness: ['void'], strength: ['undead'] }, // Added strength vs undead
    'void': { name: 'Void', adjective: 'Abyssal', weakness: ['light'], strength: [] }, // Void might be strong vs something later?
    'healing': { name: 'Healing', adjective: 'Restorative', weakness: [], strength: [] }
};


const MONSTER_SPECIES = {
    // Tier 1
    'goblin': {
        key: 'goblin', emoji: '👺', name: 'Goblin',
        rarityNames: {
            common: 'Goblin',
            uncommon: 'Hobgoblin',
            rare: 'Hobgoblin Captain',
            epic: 'Hobgoblin Chieftain', // Corrected singular
            legendary: 'Hobgoblin Lord',
            boss: 'Goblin King'
        },
        class: 'Humanoid', tier: 1, base_hp: 20, base_strength: 3, base_defense: 0, range: 1, movement: { speed: 2, type: 'ground' }, base_xp: 25, base_gold: 15, spell_resistance: 0.05, loot_table: {'health_potion': 0.1, 'goblin_ear': 0.5, 'dagger': 0.1, 'rusty_sword': 0.15, 'wooden_shield': 0.05, 'wooden_wand': 0.02, 'wild_wine': 0.1}
    },
    'rabid_rabbit': {
        key: 'rabid_rabbit', emoji: '🐇', name: 'Rabid Rabbit',
        rarityNames: {
            common: 'Rabid Rabbit',
            uncommon: 'Carnivorous Rabbit',
            rare: 'Killer Rabbit',
            epic: 'Bloodthirsty Rabbit',
            legendary: 'Death Rabbit',
            boss: 'Worldeating Rabbit'
        },
        class: 'Beast', tier: 1, base_hp: 25, base_strength: 2, base_defense: 1, range: 1, movement: { speed: 3, type: 'ground' }, base_xp: 25, base_gold: 8, spell_resistance: 0, loot_table: {'rabbit_meat': 0.6}
    },
    'slime': {
        key: 'slime', emoji: '🦠', name: 'Slime',
        rarityNames: {
            common: 'Slime',
            uncommon: 'Colored Slime',
            rare: 'Metal Slime',
            epic: 'Chromatic Slime',
            legendary: 'Golden Slime',
            boss: 'Giant Glutton Slime'
        },
        class: 'Monstrosity', tier: 1, base_hp: 28, base_strength: 2, base_defense: 2, range: 1, movement: { speed: 1, type: 'ground' }, base_xp: 22, base_gold: 10, spell_resistance: 0.1, loot_table: {'slime_glob': 0.5}, damage_type: 'magical'
     },
    'skeleton': {
        key: 'skeleton', emoji: '💀', name: 'Skeleton',
        rarityNames: {
             common: 'Skeleton',
             uncommon: 'Skeleton Warrior',
             rare: 'Grave Keeper Skeleton',
             epic: 'Skeleton Amalgam',
             legendary: 'Giant Skeleton',
             boss: 'Gashadokuro'
        },
        class: 'Undead', tier: 1, base_hp: 18, base_strength: 3, base_defense: 2, range: 1, movement: { speed: 2, type: 'ground' }, base_xp: 20, base_gold: 10, spell_resistance: 0.1, loot_table: {'rusty_sword': 0.1, 'dagger': 0.05, 'wooden_shield': 0.05, 'iron_buckler': 0.03, 'cracked_orb': 0.02, 'undying_heart': 0.02, 'grave_scythe': 0.005}
    },

    // Tier 2
    'bandit': {
        key: 'bandit', emoji: '🤠', name: 'Bandit',
        rarityNames: {
            common: 'Bandit Slave',
            uncommon: 'Bandit',
            rare: 'Bandit Captain',
            epic: 'Rogue Bandit Lord',
            legendary: 'Bandit King',
            boss: 'Lord of the Underground'
        },
        class: 'Humanoid', tier: 2, base_hp: 45, base_strength: 8, base_defense: 3, range: 4, movement: { speed: 2, type: 'ground' }, base_xp: 50, base_gold: 30, spell_resistance: 0.05, loot_table: {'health_potion': 0.25, 'dagger': 0.15, 'rusty_sword': 0.1, 'steel_longsword': 0.05, 'iron_kite_shield': 0.05, 'iron_buckler': 0.05, 'padded_leather': 0.08, 'silenced_leather_armor': 0.02, 'hardwood_staff': 0.02, 'wild_wine': 0.25}
    },
    'dire_wolf': {
        key: 'dire_wolf', emoji: '🐺', name: 'Dire Wolf',
        rarityNames: {
            common: 'Wolf Whelp',
            uncommon: 'Dire Wolf',
            rare: 'Hunter Wolf',
            epic: 'Alpha Wolf',
            legendary: 'Crimson Moon Wolf',
            boss: 'Fenrir the White Wolf'
        },
        class: 'Beast', tier: 2, base_hp: 60, base_strength: 6, base_defense: 2, range: 1, movement: { speed: 3, type: 'ground' }, base_xp: 40, base_gold: 15, spell_resistance: 0, loot_table: {'health_potion': 0.15, 'wolf_pelt': 0.4, 'wolf_meat': 0.5}
    },
    'giant_rat': {
        key: 'giant_rat', emoji: '🐀', name: 'Giant Rat',
        rarityNames: {
            common: 'Giant Rat',
            uncommon: 'Sewer Giant Rat',
            rare: 'Mutated Giant Rat',
            epic: 'Radioactive Giant Rat',
            legendary: 'Monstrous Giant Rat',
            boss: 'The Rat King'
        },
        class: 'Monstrosity', tier: 2, base_hp: 40, base_strength: 5, base_defense: 1, range: 1, movement: { speed: 3, type: 'ground' }, base_xp: 35, base_gold: 10, spell_resistance: 0, loot_table: {'rat_tail': 0.6}
    },
    'armored_zombie': {
        key: 'armored_zombie', emoji: '🧟', name: 'Armored Zombie',
        rarityNames: {
            common: 'Rotten Zombie',
            uncommon: 'Armored Zombie',
            rare: 'Undead Warrior',
            epic: 'Undying Warlord',
            legendary: 'Immortal Zombie',
            boss: 'Deathlord King'
        },
        class: 'Undead', tier: 2, base_hp: 50, base_strength: 7, base_defense: 5, range: 1, movement: { speed: 1, type: 'ground' }, base_xp: 45, base_gold: 20, spell_resistance: 0.15, loot_table: {'dagger': 0.05, 'steel_longsword': 0.08, 'heavy_greatsword': 0.03, 'iron_kite_shield': 0.05, 'brass_shield': 0.03, 'padded_leather': 0.05, 'chainmail_armor': 0.03, 'magical_orb': 0.02, 'undying_heart': 0.05, 'grave_scythe': 0.02, 'elemental_sword': 0.01}, damage_type: 'magical'
    },

    // Tier 3
    'orc_berserker': {
        key: 'orc_berserker', emoji: '👹', name: 'Orc Berserker',
        rarityNames: {
            common: 'Common Orc',
            uncommon: 'Orc Berserker',
            rare: 'Orc Ravager',
            epic: 'Bloodlust Orc Warlord',
            legendary: 'Orc Overlord',
            boss: 'Org the Shadow'
        },
        class: 'Humanoid', tier: 3, ability: 'enrage', base_hp: 70, base_strength: 12, base_defense: 4, range: 1, movement: { speed: 2, type: 'ground' }, base_xp: 80, base_gold: 40, spell_resistance: 0.1, loot_table: {'health_potion': 0.3, 'steel_longsword': 0.1, 'heavy_greatsword': 0.08, 'obsidian_axe': 0.05, 'sunderers_battleaxe': 0.02, 'orc_liver': 0.3, 'brass_shield': 0.05, 'titanium_parrying_shield': 0.02, 'chainmail_armor': 0.05, 'half_plate_armor': 0.02, 'cypresswood_staff': 0.02, 'dual_longswords': 0.02, 'bone_club': 0.1, 'wild_wine': 0.2}
    },
    'cave_spider': {
        key: 'cave_spider', emoji: '🕷️', name: 'Cave Spider',
        rarityNames: {
            common: 'Cave Spider',
            uncommon: 'Poisonous Cave Spider',
            rare: 'Giant Spider',
            epic: 'Silksinger Spider', // Corrected typo
            legendary: 'Spider Queen Guardian',
            boss: 'Arachne, Mother of Spider'
        },
        class: 'Beast', tier: 3, ability: 'poison_web', base_hp: 90, base_strength: 9, base_defense: 3, range: 3, movement: { speed: 2, type: 'ground' }, base_xp: 75, base_gold: 30, spell_resistance: 0, loot_table: {'spider_venom': 0.5, 'eye_of_medusa': 0.01}
    },
    'cockatrice': {
        key: 'cockatrice', emoji: '🐔', name: 'Cockatrice',
        rarityNames: {
            common: 'Rabid Chicken',
            uncommon: 'Mutated Rooster',
            rare: 'Cockatrice',
            epic: 'Metal Cockatrice',
            legendary: 'Raptor Cockatrice',
            boss: 'Failed Drake Quetzalcoatlus'
        },
        class: 'Monstrosity', tier: 3, ability: 'petrification', base_hp: 80, base_strength: 10, base_defense: 5, range: 1, movement: { speed: 3, type: 'flying' }, base_xp: 90, base_gold: 50, spell_resistance: 0.2, loot_table: {'cockatrice_venom_gland': 0.3, 'eye_of_medusa': 0.02, 'arcane_focus': 0.02, 'elemental_sword': 0.02, 'chicken_meat': 0.4}, damage_type: 'magical'
    },
    'necromancer': {
        key: 'necromancer', emoji: '🧙', name: 'Necromancer',
        rarityNames: {
            common: 'Necromancer Novice',
            uncommon: 'Necromancer',
            rare: 'Gravekeeper Necromancer',
            epic: 'Guider\'s Necromancer', // Corrected apostrophe
            legendary: 'Hands of Hades',
            boss: 'Azrael, Defiled God of Death'
        },
        class: 'Undead', tier: 3, ability: 'necromancy', base_hp: 60, base_strength: 8, base_defense: 2, range: 5, movement: { speed: 1, type: 'ground' }, base_xp: 100, base_gold: 60, spell_resistance: 0.3, loot_table: {'mana_potion': 0.2, 'vampiric_dagger': 0.02, 'assassin_cloak_armor': 0.02, 'staff_of_loss': 0.02, 'archmages_robes': 0.01, 'undying_heart': 0.1, 'grave_scythe': 0.03, 'headless_executioner': 0.01, 'elemental_sword': 0.02}, damage_type: 'magical'
    },

    // Tier 4
    'one_eyed_troll': {
        key: 'one_eyed_troll', emoji: '👺', name: 'One-Eyed Troll',
        rarityNames: {
            common: 'One Eyed Goblin',
            uncommon: 'One Eyed Troll',
            rare: 'One Eyed Giant',
            epic: 'One Eyed Cyclops',
            legendary: 'Storm Cyclops',
            boss: 'Orthos the Twin'
        },
        class: 'Humanoid', tier: 4, ability: 'ultra_focus', base_hp: 150, base_strength: 20, base_defense: 8, range: 1, movement: { speed: 1, type: 'ground' }, base_xp: 350, base_gold: 175, spell_resistance: 0.1, loot_table: {'superior_health_potion': 0.2, 'obsidian_axe': 0.08, 'sunderers_battleaxe': 0.04, 'heavy_slabshield': 0.03, 'steel_plate_armor': 0.03, 'staff_of_the_magi': 0.01, 'trollblood_shield': 0.03, 'bone_club': 0.15, 'trolls_knight_sword': 0.05, 'troll_blood': 0.5}
    },
    'unicorn': {
        key: 'unicorn', emoji: '🦄', name: 'Unicorn',
        rarityNames: {
            common: 'Holy Foal',
            uncommon: 'Unicorn',
            rare: 'Radiant Unicorn',
            epic: 'Alicorn',
            legendary: 'Royal Alicorn',
            boss: 'The Prismatic Progenitor'
        },
        class: 'Beast', tier: 4, ability: 'healing', base_hp: 170, base_strength: 15, base_defense: 5, range: 1, movement: { speed: 3, type: 'ground' }, base_xp: 320, base_gold: 160, spell_resistance: 0.25, loot_table: {'unicorn_horn_fragment': 0.5, 'golden_greatbow': 0.05, 'obsidian_lamina': 0.02, 'purifying_crystal_shield': 0.02, 'elemental_sword': 0.03, 'horse_meat': 0.3}, damage_type: 'magical'
    },
    'chimera': {
        key: 'chimera', emoji: '🦁', name: 'Chimera',
        rarityNames: {
            common: 'Alchemical Failure',
            uncommon: 'Chimera',
            rare: 'Royal Chimera',
            epic: 'Quicksilver Chimera',
            legendary: 'Pure Chimera',
            boss: 'Chimeraus Ultima'
        },
        class: 'Monstrosity', tier: 4, ability: 'true_poison', base_hp: 160, base_strength: 18, base_defense: 10, range: 3, movement: { speed: 3, type: 'flying' }, base_xp: 400, base_gold: 200, spell_resistance: 0.15, loot_table: {'golden_greatbow': 0.03, 'eye_of_medusa': 0.03, 'crystal_ball': 0.01, 'spellblade_of_echoes': 0.03, 'chimera_claw': 0.3, 'elemental_sword': 0.03, 'condensed_health_potion': 0.3}, damage_type: 'magical'
    },
    'living_armor': {
        key: 'living_armor', emoji: '🛡️', name: 'Living Armor',
        rarityNames: {
            common: 'Living Armor',
            uncommon: 'Soldier\'s Armor', // Corrected apostrophe
            rare: 'Knight\'s Armor', // Corrected apostrophe
            epic: 'Gold-Gilded Armor',
            legendary: 'Royal Living Armor',
            boss: 'God-Slayer Armor'
        },
        class: 'Undead', tier: 4, ability: 'living_shield', base_hp: 120, base_strength: 17, base_defense: 15, range: 1, movement: { speed: 1, type: 'ground' }, base_xp: 380, base_gold: 190, spell_resistance: 0.5, loot_table: {'obsidian_axe': 0.05, 'masterwork_spear': 0.08, 'tower_greatshield': 0.05, 'exa_reflector': 0.01, 'soul_armor_shard': 0.1, 'steel_plate_armor': 0.05, 'adamantine_armor': 0.01, 'spiked_retaliator': 0.02, 'mirror_mail': 0.01, 'undying_heart': 0.2, 'the_bloodletter': 0.03, 'unending_dance': 0.005, 'headless_executioner': 0.02, 'elemental_sword': 0.03, 'superior_health_potion': 0.1}, damage_type: 'hybrid'
    },

    // Tier 5
    'mountain_goliath': {
        key: 'mountain_goliath', emoji: '⛰️', name: 'Mountain Goliath',
        rarityNames: {
            common: 'Mountain Giant',
            uncommon: 'Mountain Goliath',
            rare: 'Mountain Colossus',
            epic: 'Mountain Carver',
            legendary: 'Mountain Eater',
            boss: 'Living Mountain Titan'
        },
        class: 'Humanoid', tier: 5, ability: 'earthshaker', base_hp: 300, base_strength: 28, base_defense: 12, range: 1, movement: { speed: 1, type: 'ground' }, base_xp: 1200, base_gold: 600, spell_resistance: 0.15, loot_table: {'sunderers_battleaxe': 0.05, 'earthshaker_hammer': 0.01, 'heavy_slabshield': 0.02, 'mountain_rock': 0.1, 'bone_club': 0.2, 'giant_hunter': 0.005, 'superior_health_potion': 0.5}
    },
    'livyatan': {
        key: 'livyatan', emoji: '🐳', name: 'Livyatan',
        rarityNames: {
            common: 'Sea Serpent',
            uncommon: 'Sea Drake',
            rare: 'Sea Dragon',
            epic: 'Livyatan', // Using the base name for Epic
            legendary: 'Oceanic Wyrm',
            boss: 'Leviathan the Sea Eater'
        },
        class: 'Beast', tier: 5, ability: 'swallow', base_hp: 400, base_strength: 22, base_defense: 10, range: 1, movement: { speed: 2, type: 'flying' }, base_xp: 1100, base_gold: 550, spell_resistance: 0.1, loot_table: {'vacuum_greatbow': 0.01, 'lightning_javelin': 0.05, 'vacuum_lining': 0.2, 'giant_hunter': 0.005, 'elemental_sword': 0.05, 'superior_mana_potion': 0.4, 'whale_meat': 0.2}, damage_type: 'magical'
    },
    'dragon': {
        key: 'dragon', emoji: '🐉', name: 'Dragon',
        rarityNames: {
            common: 'Wyvern',
            uncommon: 'Drake',
            rare: 'Dragon',
            epic: 'Ancient Wyrm',
            legendary: 'True Dragon',
            boss: 'Archdragon Typhon'
        },
        class: 'Monstrosity', tier: 5, ability: 'scorch_earth', base_hp: 350, base_strength: 25, base_defense: 18, range: 5, movement: { speed: 3, type: 'flying' }, base_xp: 1500, base_gold: 750, spell_resistance: 0.2, loot_table: {'dragon_scale': 0.5, 'dragon_scale_cragblade': 0.01, 'dragon_heart_item': 0.1, 'giant_hunter': 0.005, 'elemental_sword': 0.05, 'superior_health_potion': 0.5}, damage_type: 'hybrid'
    },
    'dullahan': {
        key: 'dullahan', emoji: '👻', name: 'Dullahan',
        rarityNames: {
            common: 'Headless Warrior',
            uncommon: 'Headless Executioner',
            rare: 'Headless Horseman',
            epic: 'Soul-Eater Dullahan',
            legendary: 'Death Seeker Dullahan',
            boss: 'The Undying'
        },
        class: 'Undead', tier: 5, ability: 'alive_again', base_hp: 250, base_strength: 26, base_defense: 14, range: 1, movement: { speed: 3, type: 'ground' }, base_xp: 1350, base_gold: 700, spell_resistance: 0.25, loot_table: {'vampiric_dagger': 0.04, 'obsidian_lamina': 0.03, 'void_greatsword': 0.01, 'adamantine_armor': 0.02, 'void_heart': 0.1, 'undying_heart': 0.4, 'the_bloodletter': 0.04, 'headless_executioner': 0.03, 'giant_hunter': 0.005, 'elemental_sword': 0.05, 'superior_mana_potion': 0.4}, damage_type: 'hybrid'
    }
};

const MONSTER_RARITY = {
    // Keep the keys as 'common', 'uncommon', etc. for the constructor logic
    'common': { key: 'common', name: 'Common', multiplier: 1.0, rewardMultiplier: 1.0, rarityIndex: 1 },
    'uncommon': { key: 'uncommon', name: 'Uncommon', multiplier: 1.2, rewardMultiplier: 1.3, rarityIndex: 2 },
    'rare': { key: 'rare', name: 'Rare', multiplier: 1.5, rewardMultiplier: 1.8, rarityIndex: 3 },
    'epic': { key: 'epic', name: 'Epic', multiplier: 2.0, rewardMultiplier: 2.5, rarityIndex: 4 },
    'legendary': { key: 'legendary', name: 'Legendary', multiplier: 2.5, rewardMultiplier: 3.5, rarityIndex: 5 }
};

const MONSTER_CLASS_DAMAGE = {
    'Humanoid': { baseDice: 1, dieSides: 8 },
    'Beast': { baseDice: 2, dieSides: 4 },
    'Monstrosity': { baseDice: 3, dieSides: 3 },
    'Undead': { baseDice: 1, dieSides: 6 }
};

const BIOMES = {
    // Tier 1
    'forest': {
        name: 'Whispering Forest',
        theme: 'forest',
        tier: 1,
        description: 'A dense forest where strange beasts and territorial humanoids roam.',
        monsters: { 'rabid_rabbit': 45, 'goblin': 45, 'slime': 10 },
        obstacle: { char: '🌲', name: 'Tree' },
        // --- NEW SECTION ---
        map_generation: {
            depth: 8,  // Total floors (rows) including start and boss
            width: 5,  // Max nodes per row
            node_pool: { 
                'monster': 0.40,   // WAS 0.60
                'elite': 0.25, 
                'event': 0.15, 
                'rest': 0.10,      // WAS 0.10
                'shop': 0.10 
            },
            // Bosses are generated from the 'boss' rarity of these monster keys
            bosses: ['goblin', 'slime', 'rabid_rabbit'] 
        }
        // --- END NEW ---
    },
    'catacombs': {
        name: 'Sunken Catacombs',
        theme: 'necropolis',
        tier: 1,
        description: 'A dark, damp tomb where the dead and their grotesque guardians stir.',
        monsters: { 'skeleton': 50, 'slime': 40, 'rabid_rabbit': 10 },
        obstacle: { char: '⚰️', name: 'Coffin' },
        // --- NEW SECTION ---
        map_generation: {
            depth: 8,
            width: 5,
            node_pool: { 
                'monster': 0.40,   // WAS 0.60
                'elite': 0.25, 
                'event': 0.15, 
                'rest': 0.10,      // WAS 0.10
                'shop': 0.10 
            },
            // Bosses are
            bosses: ['skeleton', 'slime', 'rabid_rabbit']
        }
        // --- END NEW ---
    },

    // Tier 2
    'cave': {
        name: 'Bandit Cave',
        theme: 'cave',
        tier: 2,
        description: 'A network of caves taken over by ruthless bandits and the monstrous creatures they consort with.',
        monsters: { 'bandit': 40, 'giant_rat': 40, 'armored_zombie': 10, 'dire_wolf': 4, 'goblin': 4, 'mountain_goliath': 1, 'dragon': 1},
        obstacle: { char: '🗿', name: 'Rock Formation' },
        // --- NEW SECTION ---
        map_generation: {
            depth: 10, // Deeper than Tier 1
            width: 6,
            node_pool: { 
                'monster': 0.40,   // WAS 0.60
                'elite': 0.25, 
                'event': 0.15, 
                'rest': 0.10,      // WAS 0.10
                'shop': 0.10 
            },
            // Bosses are
            bosses: ['bandit', 'giant_rat', 'armored_zombie', 'dire_wolf']
        }
        // --- END NEW ---
    },
    'deserted_warzone': {
        name: 'Deserted Warzone',
        theme: 'mountain',
        tier: 2,
        description: 'An old battlefield where restless spirits and savage beasts feast on the memories of conflict.',
        monsters: { 'dire_wolf': 40, 'armored_zombie': 40, 'bandit': 10, 'giant_rat': 4, 'skeleton': 4, 'livyatan': 1, 'dullahan': 1 },
        obstacle: { char: '⚔️', name: 'Weapon Pile' },
        // --- NEW SECTION ---
        map_generation: {
            depth: 10,
            width: 6,
            node_pool: { 
                'monster': 0.40,   // WAS 0.60
                'elite': 0.25, 
                'event': 0.15, 
                'rest': 0.10,      // WAS 0.10
                'shop': 0.10 
            },
            // Bosses are
            bosses: ['dire_wolf', 'armored_zombie', 'bandit']
        }
        // --- END NEW ---
    },

    // Tier 3
    'necropolis': {
        name: 'Necropolis, the Silent City',
        theme: 'void',
        tier: 3,
        description: 'A haunted city of the dead, ruled by powerful undead and the desperate men who serve them.',
        monsters: { 'necromancer': 35, 'orc_berserker': 35, 'cockatrice': 10, 'cave_spider': 10, 'armored_zombie': 3, 'bandit': 3, 'dullahan': 2, 'mountain_goliath': 2 },
        obstacle: { char: '💀', name: 'Bone Pile' },
        // --- NEW SECTION ---
        map_generation: {
            depth: 12, // Deeper than Tier 2
            width: 6,
            node_pool: { 
                'monster': 0.40,   // WAS 0.60
                'elite': 0.25, 
                'event': 0.15, 
                'rest': 0.10,      // WAS 0.10
                'shop': 0.10 
            },
            // Bosses are
            bosses: ['necromancer', 'orc_berserker', 'cockatrice', 'cave_spider']
        }
        // --- END NEW ---
    },
    'hidden_oasis': {
        name: 'The Hidden Oasis',
        theme: 'forest',
        tier: 3,
        description: 'A lush, isolated paradise that hides some of the most dangerous beasts and monstrosities.',
        monsters: { 'cave_spider': 35, 'cockatrice': 35, 'necromancer': 10, 'orc_berserker': 10, 'dire_wolf': 3, 'giant_rat': 3, 'dragon': 2, 'livyatan': 2 },
        obstacle: { char: '🌴', name: 'Palm Tree' },
        // --- NEW SECTION ---
        map_generation: {
            depth: 12,
            width: 6,
            node_pool: { 
                'monster': 0.40,   // WAS 0.60
                'elite': 0.25, 
                'event': 0.15, 
                'rest': 0.10,      // WAS 0.10
                'shop': 0.10 
            },
            // Bosses are
            bosses: ['cave_spider', 'cockatrice', 'necromancer', 'orc_berserker']
        }
        // --- END NEW ---
    },

    // Tier 4
    'ringed_city': {
        name: 'The Ringed City',
        theme: 'town',
        tier: 4,
        description: 'A forgotten, walled city where monstrous humanoids have built a new, brutal society.',
        monsters: { 'one_eyed_troll': 40, 'living_armor': 10, 'chimera': 5, 'orc_berserker': 20, 'necromancer': 20, 'livyatan': 5 },
        obstacle: { char: '🛢️', name: 'Barrel' },
        // --- NEW SECTION ---
        map_generation: {
            depth: 14, // Deeper than Tier 3
            width: 7,
            node_pool: { 
                'monster': 0.40,   // WAS 0.60
                'elite': 0.25, 
                'event': 0.15, 
                'rest': 0.10,      // WAS 0.10
                'shop': 0.10 
            },
            // Bosses are
            bosses: ['one_eyed_troll', 'living_armor', 'chimera']
        }
        // --- END NEW ---
    },
    'secret_garden': {
        name: 'The Secret Garden',
        theme: 'forest',
        tier: 4,
        description: 'A beautiful but deadly grove, protected by powerful and magical beasts of myth.',
        monsters: { 'unicorn': 40, 'chimera': 10, 'one_eyed_troll': 5, 'cave_spider': 20, 'cockatrice': 20, 'dragon': 5 },
        obstacle: { char: '🌸', name: 'Flower Patch' },
        // --- NEW SECTION ---
        map_generation: {
            depth: 14,
            width: 7,
            node_pool: { 
                'monster': 0.40,   // WAS 0.60
                'elite': 0.25, 
                'event': 0.15, 
                'rest': 0.10,      // WAS 0.10
                'shop': 0.10 
            },
            // Bosses are
            bosses: ['unicorn', 'chimera', 'one_eyed_troll']
        }
        // --- END NEW ---
    },
    'typhons_jaw': {
        name: 'Typhon\'s Jaw',
        theme: 'volcano',
        tier: 4,
        description: 'A jagged mountain pass filled with legendary monstrosities of immense power.',
        monsters: { 'chimera': 40, 'unicorn': 10, 'living_armor': 5, 'cockatrice': 20, 'cave_spider': 20, 'dullahan': 5 },
        obstacle: { char: '🦷', name: 'Giant Tooth' },
        // --- NEW SECTION ---
        map_generation: {
            depth: 14,
            width: 7,
            node_pool: { 
                'monster': 0.40,   // WAS 0.60
                'elite': 0.25, 
                'event': 0.15, 
                'rest': 0.10,      // WAS 0.10
                'shop': 0.10 
            },
            // Bosses are
            bosses: ['chimera', 'unicorn', 'living_armor']
        }
        // --- END NEW ---
    },
    'tomb_of_the_dead': {
        name: 'Tomb of the Dead',
        theme: 'necropolis',
        tier: 4,
        description: 'A grand mausoleum where the most powerful undead guard ancient treasures.',
        monsters: { 'living_armor': 40, 'one_eyed_troll': 10, 'unicorn': 5, 'necromancer': 20, 'orc_berserker': 20, 'mountain_goliath': 5 },
        obstacle: { char: '🦴', name: 'Bone Pile' },
        // --- NEW SECTION ---
        map_generation: {
            depth: 14,
            width: 7,
            node_pool: { 
                'monster': 0.40,   // WAS 0.60
                'elite': 0.25, 
                'event': 0.15, 
                'rest': 0.10,      // WAS 0.10
                'shop': 0.10 
            },
            // Bosses are
            bosses: ['living_armor', 'one_eyed_troll', 'unicorn']
        }
        // --- END NEW ---
    },

    // Tier 5
    'archdragon_peak': {
        name: 'Archdragon Peak',
        theme: 'mountain',
        tier: 5,
        description: 'The highest point in the world, where only dragons and the strongest beasts dare to tread.',
        monsters: { 'dragon': 50, 'mountain_goliath': 20, 'livyatan': 20, 'chimera': 5, 'unicorn': 5 },
        obstacle: { char: '💎', name: 'Crystal Formation' },
        // --- NEW SECTION ---
        map_generation: {
            depth: 15, // Max depth
            width: 7,
            node_pool: { 
                'monster': 0.40,   // WAS 0.60
                'elite': 0.25, 
                'event': 0.15, 
                'rest': 0.10,      // WAS 0.10
                'shop': 0.10 
            },
            // Bosses are
            bosses: ['dragon', 'mountain_goliath', 'livyatan']
        }
        // --- END NEW ---
    },
    'gate_of_hades': {
        name: 'Gate of Hades',
        theme: 'volcano',
        tier: 5,
        description: 'A direct gateway to the underworld, guarded by its eternal, deathless warden.',
        monsters: { 'dullahan': 50, 'livyatan': 20, 'dragon': 20, 'living_armor': 5, 'chimera': 5 },
        obstacle: { char: '🔥', name: 'Brimstone Pillar' },
        // --- NEW SECTION ---
        map_generation: {
            depth: 15,
            width: 7,
            node_pool: { 
                'monster': 0.40,   // WAS 0.60
                'elite': 0.25, 
                'event': 0.15, 
                'rest': 0.10,      // WAS 0.10
                'shop': 0.10 
            },
            // Bosses are
            bosses: ['dullahan', 'livyatan', 'dragon']
        }
        // --- END NEW ---
    },
    'el_dorado': {
        name: 'El Dorado, the Gilded City',
        theme: 'town',
        tier: 5,
        description: 'The lost city of gold, whose immense treasures are protected by an equally immense guardian.',
        monsters: { 'mountain_goliath': 50, 'dragon': 20, 'dullahan': 20, 'one_eyed_troll': 5, 'living_armor': 5 },
        obstacle: { char: '🗿', name: 'Golden Statue' },
        // --- NEW SECTION ---
        map_generation: {
            depth: 15,
            width: 7,
            node_pool: { 
                'monster': 0.40,   // WAS 0.60
                'elite': 0.25, 
                'event': 0.15, 
                'rest': 0.10,      // WAS 0.10
                'shop': 0.10 
            },
            // Bosses arev
            bosses: ['mountain_goliath', 'dragon', 'dullahan']
        }
        // --- END NEW ---
    },
    'hanging_sacred_temple': {
        name: 'Hanging Sacred Temple',
        theme: 'forest',
        tier: 5,
        description: 'A beautiful temple floating in the sky, home to the king of all beasts.',
        monsters: { 'livyatan': 50, 'mountain_goliath': 20, 'dullahan': 20, 'unicorn': 5, 'one_eyed_troll': 5 },
        obstacle: { char: '🏛️', name: 'Temple Ruin' },
        // --- NEW SECTION ---
        map_generation: {
            depth: 15,
            width: 7,
            node_pool: { 
                'monster': 0.40,   // WAS 0.60
                'elite': 0.25, 
                'event': 0.15, 
                'rest': 0.10,      // WAS 0.10
                'shop': 0.10 
            },
            // Bosses are
            bosses: ['livyatan', 'mountain_goliath', 'dullahan']
        }
        // --- END NEW ---
    },
};

const BATTLE_GRIDS = {
    'square_3x3': { width: 3, height: 3, layout: [1,1,1, 1,1,1, 1,1,1] }, // Added for training
    'square_4x4': { width: 4, height: 4, layout: [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1] }, // Added for training  
    'square_5x5': { width: 5, height: 5, layout: [1,1,1,1,1, 1,1,1,1,1, 1,1,1,1,1, 1,1,1,1,1, 1,1,1,1,1] },
    'square_6x6': { width: 6, height: 6, layout: [1,1,1,1,1,1, 1,1,1,1,1,1, 1,1,1,1,1,1, 1,1,1,1,1,1, 1,1,1,1,1,1, 1,1,1,1,1,1] },

    'rect_6x4': { width: 6, height: 4, layout: [1,1,1,1,1,1, 1,1,1,1,1,1, 1,1,1,1,1,1, 1,1,1,1,1,1] },
    'rect_4x6': { width: 4, height: 6, layout: [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1] },
    'rect_5x6': { width: 5, height: 6, layout: [1,1,1,1,1, 1,1,1,1,1, 1,1,1,1,1, 1,1,1,1,1, 1,1,1,1,1, 1,1,1,1,1] },
    'rect_6x5': { width: 6, height: 5, layout: [1,1,1,1,1,1, 1,1,1,1,1,1, 1,1,1,1,1,1, 1,1,1,1,1,1, 1,1,1,1,1,1] },
};

const MYSTERIOUS_CONCOCTION_EFFECTS = {
    good: [
        { message: "You feel a surge of insight! You've gained some experience!", apply: (p) => p.gainXp(Math.floor(p.xpToNextLevel * 0.2)) },
        { message: "Your senses sharpen! You can spot weaknesses more easily!", apply: (p) => p.statusEffects.bonus_crit = { duration: 10, critChance: 0.15 } },
        { message: "You feel light on your feet!", apply: (p) => p.statusEffects.bonus_speed = { duration: 10, move: 2, dodge: 0.1 } },
        { message: "Your reach extends unnaturally!", apply: (p) => p.statusEffects.bonus_range = { duration: 10, range: 2 } },
        { message: "A shimmering barrier forms around you!", apply: (p) => p.statusEffects.alchemical_barrier = { duration: Infinity, hp: Math.floor(p.maxHp * 0.2) } },
    ],
    bad: [
        { message: "The potion burns on the way down, sapping your vitality!", apply: (p) => p.takeDamage(Math.floor(p.maxHp * 0.05), true) },
        { message: "Your connection to the arcane feels weak...", apply: (p) => p.statusEffects.magic_dampen = { duration: 10, multiplier: 0.5 } },
        { message: "You feel a chilling vulnerability to a random element!", apply: (p) => { const elements = ['fire', 'water', 'earth', 'wind', 'lightning', 'nature']; p.statusEffects.elemental_vuln = { duration: 10, element: elements[Math.floor(Math.random() * elements.length)] }; } },
        { message: "Your legs feel heavy and slow.", apply: (p) => p.statusEffects.slowed = { duration: 10, move: -2, dodge: -0.1 } }, // Added dodge penalty
        { message: "Your vision blurs, making it hard to aim.", apply: (p) => p.statusEffects.inaccurate = { duration: 10, accuracy: -0.2 } },
        { message: "You feel a strange pull, as if monsters are drawn to you.", apply: (p) => p.statusEffects.monster_lure = { duration: 10 } },
        { message: "You feel clumsy and exposed.", apply: (p) => p.statusEffects.clumsy = { duration: 10, dodge: -0.2 } },
        { message: "Your hands tremble, making every action uncertain.", apply: (p) => p.statusEffects.fumble = { duration: 10, chance: 0.2 } },
        { message: "The concoction drains your energy!", apply: (p) => { p.mp = Math.floor(p.mp * 0.5); } },
        { message: "A jinx! One of your items has transformed!", apply: (p) => { const consumables = Object.keys(p.inventory.items).filter(k => ITEMS[k] && ITEMS[k].type !== 'key' && ITEMS[k].type !== 'junk' && k !== 'mysterious_concoction_t1' && k !== 'mysterious_concoction_t2' && k !== 'mysterious_concoction_t3'); if(consumables.length > 0) { const itemToJinx = consumables[Math.floor(Math.random()*consumables.length)]; p.inventory.items[itemToJinx]--; if(p.inventory.items[itemToJinx] <= 0) delete p.inventory.items[itemToJinx]; p.addToInventory('rock', 1, false); } } },
    ]
};

const RECIPE_DROPS_BY_TIER = {
    cooking: {
        1: ['recipe_rabbit_roast', 'recipe_humming_medley', 'recipe_fortifying_meat_pie', 'recipe_spiced_root_stew', 'recipe_hunters_lunch', 'recipe_travelers_skewer', 'recipe_sages_loaf', 'recipe_hearty_grain_stew', 'recipe_clarifying_broth'],
        2: ['recipe_spiced_wolf_steak', 'recipe_arcane_fruit_tart', 'recipe_loaded_tater', 'recipe_calming_tea_ceremony', 'recipe_lucky_greens_salad', 'recipe_fiery_meat_platter', 'recipe_focusing_stir_fry', 'recipe_restorative_bird_soup', 'recipe_salty_seafood_stew'],
        3: ['recipe_steak_of_divine_power', 'recipe_crystalline_energy_tart', 'recipe_livyatans_grand_steak', 'recipe_nectar_of_the_soul', 'recipe_feast_of_fortune', 'recipe_alacrity_sorbet', 'recipe_mindfire_curry', 'recipe_phoenix_down_roast', 'recipe_abyssal_ambrosia']
    },
    alchemy: {
        1: ['recipe_brew_health_potion_home', 'recipe_brew_mana_potion_home', 'recipe_brew_cinderstop', 'recipe_brew_dampclear', 'recipe_brew_windwail', 'recipe_brew_rockshut', 'recipe_brew_zapsipper', 'recipe_brew_vinekill', 'recipe_brew_lightcloser', 'recipe_brew_lampside', 'recipe_brew_fire_grease_home', 'recipe_brew_water_grease_home', 'recipe_brew_earth_grease_home', 'recipe_brew_wind_grease_home', 'recipe_brew_lightning_grease_home', 'recipe_brew_nature_grease_home', 'recipe_brew_light_grease_home', 'recipe_brew_void_grease_home'],
        2: ['recipe_brew_condensed_health_potion_home', 'recipe_brew_condensed_mana_potion_home', 'recipe_brew_hearthstall', 'recipe_brew_waterdam', 'recipe_brew_gustshield', 'recipe_brew_quakestable', 'recipe_brew_strikestop', 'recipe_brew_growthstall', 'recipe_brew_sundown', 'recipe_brew_sunrise'], // Removed stonehide/strength from drops
        3: ['recipe_brew_superior_health_potion_home', 'recipe_brew_superior_mana_potion_home', 'recipe_brew_blazeback', 'recipe_brew_floodwall', 'recipe_brew_stormsapper', 'recipe_brew_fissurewalker', 'recipe_brew_thunderground', 'recipe_brew_jungleward', 'recipe_brew_smitestopper', 'recipe_brew_voidshield'] // Removed strength from drops
    }
};

const SHOP_INVENTORY = {
    'Potions & Items': [
        'health_potion', 'mana_potion',
        'condensed_health_potion', 'condensed_mana_potion',
        'natural_antidote', 'anti_paralytic_needle' // Added new items here
        ],
    'Seeds': ['blackwheat_seed', 'cinnamonwood_seed', 'screaming_lotus_seed', 'beetsnip_seed'],
    'Recipes': [
        // Cooking Tier 1
        'recipe_rabbit_roast', 'recipe_humming_medley', 'recipe_fortifying_meat_pie', 'recipe_spiced_root_stew',
        // Alchemy Tier 1
        'recipe_brew_health_potion_home', 'recipe_brew_mana_potion_home', 'recipe_brew_cinderstop',
        'recipe_brew_dampclear', 'recipe_brew_windwail', 'recipe_brew_rockshut',
        'recipe_brew_zapsipper', 'recipe_brew_vinekill', 'recipe_brew_lightcloser', 'recipe_brew_lampside'
    ],
    'Weapons': ['rusty_sword', 'wooden_stick', 'soldiers_spear', 'farmers_glaive', 'parrying_dagger', 'light_scythe', 'flowing_blade'],
    
    // --- MODIFICATION: Split "Gear" into "Armor" and "Shields" ---
    'Armor': ['travelers_garb', 'leather_armor', 'padded_leather'],
    'Shields': ['wooden_shield']
    // --- END MODIFICATION ---
};


const MAGIC_SHOP_INVENTORY = {
    'Catalysts': ['wooden_wand', 'cracked_orb', 'hardwood_staff', 'magical_orb', 'arcane_focus', 'cypresswood_staff'],
    'Weapons': [],
    'Consumables': ['magic_rock_dust'] // This category is fine
};

const ENCHANTER_INVENTORY = {
    'Consumables': [
        'oil_bomb',
        'viscous_liquid',
        'pocket_cragblade',
        'artificial_light_stone',
        'lightning_rod',
        'fertilized_seed'
    ],
    'Essences': [ 
        'fire_essence',
        'water_essence',
        'earth_essence',
        'wind_essence',
        'lightning_essence',
        'nature_essence',
        'light_essence',
        'void_essence'
    ]
};

const BLACKSMITH_INVENTORY = {
    'Weapons': ['steel_longsword', 'rapier', 'longbow', 'heavy_greatsword', 'masterwork_spear', 'dual_longswords', 'elven_saber', 'dwarven_warhammer', 'caestus', 'shamshir', 'steel_mace', 'iron_ball', 'great_epee', 'sharpshots_beloved'],
    'Tools': ['whetstone', 'fire_grease', 'water_grease', 'earth_grease', 'wind_grease', 'lightning_grease', 'nature_grease', 'light_grease', 'void_grease'],
    'Armor': ['chainmail_armor', 'half_plate_armor', 'steel_plate_armor'],
    'Shields': ['iron_kite_shield', 'iron_buckler', 'brass_shield', 'trollblood_shield', 'titanium_parrying_shield', 'maxwellian_dueling_shield', 'tower_greatshield'],
};

const BLACK_MARKET_INVENTORY = {
    'Weapons': ['assassins_claw', 'psychic_blade', 'bloody_butchering_knife', 'battlestaff'],
    'Armor': ['silenced_leather_armor', 'assassin_cloak_armor'],
    'Enhancements': ['poisonous_grease', 'paralysis_grease'],
    'Lures': ['goblin_scent_gland', 'sweet_grass_scent', 'rotten_cheese', 'chemical_lure', 'bandit_coin', 'wolf_musk', 'war_horn_fragment', 'silken_cocoon', 'petrified_field_mouse', 'grave_dust']
};

const TRAVELING_MERCHANT_STOCK = {
    'Potions & Utility': [
        'condensed_health_potion', 'condensed_mana_potion', 
        'natural_antidote', 'anti_paralytic_needle', 
        'whetstone', 'magic_rock_dust', 'oil_bomb'
    ],
    'Rare Alchemy & Essences': [
        'fire_essence', 'water_essence', 'earth_essence', 'wind_essence', 
        'orc_liver', 'cockatrice_venom_gland', 'troll_blood'
    ],
    'Low-Tier Gear': [
        'rusty_sword', 'wooden_wand', 'iron_buckler', 'padded_leather'
    ]
};

const NPC_RANDOM_NAMES = {
    // Total Names: 180 (Male: 80, Female: 80, Neutral: 20)
    'Male': [
        "Grog", "Bork", "Rolf", "Kaelen", "Orion", "Tusk", "Garrick", "Jorn", "Vance", "Stig", "Rowan", "Draven",
        "Borin", "Zane", "Kael", "Rook", "Huck", "Grak", "Sylas", "Albin", "Barney", "Cade", "Diggory", "Edwin",
        "Finn", "Giles", "Hal", "Jem", "Kester", "Larkin", "Milo", "Ned", "Orin", "Piers", "Quinn", "Rafe",
        "Sim", "Tobin", "Ulric", "Viggo", "Walt", "Yorick", "Zev", "Alastair", "Balthazar", "Caspian", "Darian",
        "Everard", "Fabian", "Gideon", "Helios", "Ignatius", "Julian", "Leander", "Maximilian", "Percival",
        "Quinten", "Reginald", "Sebastian", "Thaddeus", "Ullyses", "Valerius", "Willoughby", "Xavier", "Ajax",
        "Breaker", "Fang", "Grit", "Husk", "Ironfist", "Jarl", "Krieg", "Mace", "Obsidian", "Pyre", "Rage", 
        "Scar", "Torque", "Ursa", "Vex", "Wulf", "Zar", "Krull"
    ],
    'Female': [
        "Elara", "Seraphina", "Brynn", "Lyra", "Faye", "Gwendolyn", "Anya", "Cerys", "Miri", "Talia", "Lyris", 
        "Ada", "Bess", "Cora", "Della", "Elsa", "Flora", "Greta", "Hazel", "Ida", "Joss", "Kira", "Lena", 
        "Mab", "Nora", "Orla", "Pippa", "Rose", "Sadie", "Tess", "Una", "Willa", "Yara", "Zara", "Anastasia", 
        "Beatrix", "Cressida", "Delphine", "Evangeline", "Felicity", "Genevieve", "Isolde", "Jocasta", 
        "Katarina", "Lavinia", "Ophelia", "Persephone", "Quintessa", "Rosalind", "Theodora", "Ursula", 
        "Victoria", "Wilhelmina", "Yseult", "Adrie", "Althaea", "Caelynn", "Elora", "Ielenia", "Jelenneth", 
        "Keyleth", "Leshanna", "Meriele", "Naivara", "Quelenna", "Sariel", "Tava", "Valanthe", "Amber", 
        "Artin", "Diesa", "Eldeth", "Falkrunn", "Gunnloda", "Hlin", "Kathra", "Liftrasa", "Mardred", "Riswynn" 
    ],
    'Neutral': [
        "Fen", "Thistle", "Nyx", "Void", "Ash", "Blaze", "Glimmer", "Pax", "Stone", "Storm", 
        "Cinder", "Ember", "Dread", "Wisp", "Magmus", "Tidal", "Hope", "Sorrow", "Torment", "Despair"
    ]
};
const CHANGELOG_DATA = [
    {
        version: "v0.7.2 - Expedition System Rework ⚔️",
        date: "2025-11-19",
        changes: [
            "<b>MAJOR GAMEPLAY OVERHAUL:</b> Biomes are no longer one-off encounters. They are now multi-stage, node-based expeditions (similar to roguelite maps) with structured paths, resource nodes, and escalating difficulty.",
            "<b>New Enemy Type:</b> Introduces <b>Boss Type Enemies</b> for Boss nodes. These enemies receive 10x Max HP, 3x Strength, and grant a <b>5x multiplier</b> to all rewards and extermination quests upon defeat.",
            "<b>Map Structure & Density:</b>",
            "    - <b>Guaranteed Rest:</b> A Rest Site is now guaranteed at the halfway point of every expedition, providing a safe resource reset.",
            "    - <b>Node Variety:</b> Node density has been increased. The probability of finding <b>Rest Sites</b> has been doubled, and <b>Elite</b> and <b>Event</b> node chances have been notably increased across all tiers.",
            "<b>Expedition-Aware Logic:</b>",
            "    - <b>Death:</b> Dying on an expedition triggers the appropriate difficulty penalty (Easy/Medium/Hardcore loss) specific to the run before returning to town.",
            "    - <b>Fleeing:</b> The mid-battle 'Flee' action now uses the unified expedition penalty logic, enforcing the penalty-free exit from Rest Nodes is honored consistently.",
            "    - <b>Ally Timer:</b> The ally's salary counter now advances only <b>once per Expedition</b> (victory or flee), instead of once per battle encounter."
        ]
    },
    {
        version: "v0.7.1 - Den of Sinners",
        date: "2025-11-07",
        changes: [
            "Adds Crooked Card for those who wants to gamble",
            "Crooked Card comes with 2 games, Arcane 21 and 5-Draw Card",
            "Add a secrets",
            "General Bug Fixing"
        ]
    },
    {
        version: "v0.6.3 - Ally & Progression Refactor",
        date: "2025-10-31",
        changes: [
            "Implemented level-based progression gating to mitigate choice paralysis.",
            "Integrated Barracks module, enabling NPC ally recruitment.",
            "Refactored persistent UI component (Settings/Exit) location into the main view.",
            "General bug fixes and QoL refactoring.",
            "Increase sell prices for garden yields"
        ]
    },
    {
        version: "v0.6.2 - Blood of the Covenant Update",
        date: "2025-10-27",
        changes: [
            "<b>Full Race & Class Ability Overhaul:</b> Implemented the foundational system AND all remaining Racial Passives and Class Signature Abilities. Each race now has innate abilities, and each class gets a signature ability.",
            "<b>Inventory & Character Sheet Revamp:</b> Reworked the UI for ability management, adding new display sections and a dedicated activation button in combat.",
            "Integrated all innate racial choices into the character creation screen.",
            "Fixed several critical bugs, including one that prevented end-of-turn effects from firing, and other various bugs related to ability integration."
         ]
     },
    {
        version: "v0.6.1 - Hearth of the Home Update",
        date: "2025-10-22",
        changes: [
            "NEW CHARACTER OPTIONS! Master the arcane with the brilliant new <b>Artificer</b> Class! Soar to victory with the avian <b>Pinionfolk</b> Race! Your customization just hit MAX LEVEL!",
            "MASSIVE EXPANSION! The <b>'Your House'</b> is now your personal, profit-generating fortress! Check out the five brand new modules you need RIGHT NOW:",
            "    - <b>Storage Area (3 Sizes—Small, Medium, Large!):</b> Tired of inventory management? Dump your glorious loot safely! Never drop another legendary item!",
            "    - <b>Garden Area:</b> Go from bare dirt to a booming jungle! Grow high-stat trees and essential, buff-boosting veggies! Green thumbs GUARANTEED!",
            "    - <b>Kitchen:</b> STOP EATING STALE BREAD! Collect ancient recipes and cook gourmet meals that give HUGE permanent and temporary battlefield ADVANTAGES!",
            "    - <b>Alchemy Lab (3 Tiers of Excellence!):</b> Why buy cheap swill? Mix your own high-potency potions! Go from novice brewer (Tier 1) to ALCHEMICAL GOD (Tier 3)! Experiment and PROFIT!",
            "    - <b>Training Grounds (Regular & Advanced!):</b> Get ripped! Test your new gear and spells against CUSTOM-SIMULATED enemies! Practice makes perfect (and rich)!",
            "Smoother than polished obsidian! We SQUASHED those movement and targeting errors around the battle grids—say goodbye to missed attacks!",
            "More quality-of-life improvements and general bug fixes than you can shake a stick at! This patch FEELS GOOD, people!"
        ]
    },
    {
        version: "v0.5.3 - The Smartass Patch",
        date: "2025-10-12",
        changes: [
            "Rebalanced monster damage formulas to scale more appropriately with player stats, ensuring a consistent challenge.",
            "QoL Update: Players can now access their Inventory and Character Sheet from the post-battle screen using the standard side-panel buttons.",
            "Fixed a critical bug that prevented the player from taking any actions after the enemy's first turn.",
        ]
    },
    {
        version: "v0.5.2 - The Arsenal",
        date: "2025-10-11",
        changes: [
            "Adding a myriad of weaponries and weapon classes to choose from",
            "Conducted a full audit of the armory, making dozens of previously unobtainable 'ghost' weapons available via monster loot, crafting recipes, and merchants.",
            "Introduced a new set of high-tier lures, allowing cunning adventurers to specifically hunt dangerous tier 3 monsters.",
            "Squashed a nasty save file corruption bug related to legacy character imports.",
            "Various minor bug fixes and quality-of-life adjustments."
        ]
    },
    {
        version: "v0.4.2 - Polish and Secrets",
        date: "2025-10-02",
        changes: [
            "Fixed an issue with the UI being too bright (the 'Flashbang' effect).",
            "Resolved bugs causing UI elements to shift unexpectedly.",
            "Rebalanced magic-based combat.",
            "A new secret has been hidden somewhere in the world..."
        ]
    },
    {
        version: "v0.4.1 - The Adventurer",
        date: "2025-09-30",
        changes: [
            "Introduced a new Level Up system with Base Stats (Vigor, Strength, etc.) and Derived Stats (HP, Damage, etc.). Players now get 5 points per level to allocate to Base Stats.",
            "Added a full Character Creation system! Choose your Gender, Race, Class, and Background to customize your hero's journey.",
            "The Witch's Coven is now open! Transmute items, reset your stat points, or even change your character's identity... for a price.",
            "Adjusted the EXP curve for a smoother leveling experience (1.5x -> 1.1x).",
            "Reworked enemy attack patterns to distinguish between physical and magical damage types.",
            "Reduced the gold penalty for resting at the Inn and failing quests.",
            "Healing spells can now be used outside of combat.",
            "Minor tweaks to the UI and color palette."
        ]
    },
    {
        version: "v0.3 - Magic and Elements",
        date: "2025-09-28",
        changes: [
            "I implemented the foundational Elemental System. Things are about to get spicy."
        ]
    },
    {
        version: "v0.2 - Battle Overhaul",
        date: "2025-09-27",
        changes: [
            "I conducted a major battle overhaul, reworking monster stats, equipment, and biome encounters.",
            "The Alchemist and Black Market are now open for business! Go brew something nasty or buy something shiny.",
            "I tamed the UI for a better experience on both PC and mobile.",
            "I squashed some nasty save-breaking bugs from older versions. Your old heroes should be safe now!"
        ]
    },
    {
        version: "v0.1 - Creation",
        date: "2025-09-25",
        changes: [
            "The game exists! I pushed the big red button and here we are.",
            "Towns are now a thing! You can shop, grab quests, and generally not be in the wilderness for a bit.",
            "The save system has been fortified. Your progress is now etched into the digital stone.",
            "I added the super-tough 'Legacy Quest' for those of you who like pain. You know who you are."
        ]
    }
];

