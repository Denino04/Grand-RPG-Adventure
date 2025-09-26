const BIOMES = {
    // Tier 1
    'forest': {
        name: 'Whispering Forest',
        theme: 'forest',
        tier: 1,
        description: 'A dense forest where strange beasts and territorial humanoids roam.',
        monsters: { 'rabid_rabbit': 45, 'goblin': 45, 'slime': 10 },
    },
    'catacombs': {
        name: 'Sunken Catacombs',
        theme: 'cave',
        tier: 1,
        description: 'A dark, damp tomb where the dead and their grotesque guardians stir.',
        monsters: { 'skeleton': 50, 'slime': 40, 'rabid_rabbit': 10 },
    },

    // Tier 2
    'cave': {
        name: 'Bandit Cave',
        theme: 'cave',
        tier: 2,
        description: 'A network of caves taken over by ruthless bandits and the monstrous creatures they consort with.',
        monsters: { 'bandit': 40, 'giant_rat': 40, 'armored_zombie': 10, 'dire_wolf': 4, 'goblin': 4, 'mountain_goliath': 1, 'dragon': 1},
    },
    'deserted_warzone': {
        name: 'Deserted Warzone',
        theme: 'mountain',
        tier: 2,
        description: 'An old battlefield where restless spirits and savage beasts feast on the memories of conflict.',
        monsters: { 'dire_wolf': 40, 'armored_zombie': 40, 'bandit': 10, 'giant_rat': 4, 'skeleton': 4, 'livyatan': 1, 'dullahan': 1 },
    },

    // Tier 3
    'necropolis': {
        name: 'Necropolis, the Silent City',
        theme: 'cave',
        tier: 3,
        description: 'A haunted city of the dead, ruled by powerful undead and the desperate men who serve them.',
        monsters: { 'necromancer': 35, 'orc_berserker': 35, 'cockatrice': 10, 'cave_spider': 10, 'armored_zombie': 3, 'bandit': 3, 'dullahan': 2, 'mountain_goliath': 2 },
    },
    'hidden_oasis': {
        name: 'The Hidden Oasis',
        theme: 'forest',
        tier: 3,
        description: 'A lush, isolated paradise that hides some of the most dangerous beasts and monstrosities.',
        monsters: { 'cave_spider': 35, 'cockatrice': 35, 'necromancer': 10, 'orc_berserker': 10, 'dire_wolf': 3, 'giant_rat': 3, 'dragon': 2, 'livyatan': 2 },
    },

    // Tier 4
    'ringed_city': {
        name: 'The Ringed City',
        theme: 'town',
        tier: 4,
        description: 'A forgotten, walled city where monstrous humanoids have built a new, brutal society.',
        monsters: { 'one_eyed_troll': 40, 'living_armor': 10, 'chimera': 5, 'orc_berserker': 20, 'necromancer': 20, 'livyatan': 5 },
    },
    'secret_garden': {
        name: 'The Secret Garden',
        theme: 'forest',
        tier: 4,
        description: 'A beautiful but deadly grove, protected by powerful and magical beasts of myth.',
        monsters: { 'unicorn': 40, 'chimera': 10, 'one_eyed_troll': 5, 'cave_spider': 20, 'cockatrice': 20, 'dragon': 5 },
    },
    'typhons_jaw': {
        name: 'Typhon\'s Jaw',
        theme: 'mountain',
        tier: 4,
        description: 'A jagged mountain pass filled with legendary monstrosities of immense power.',
        monsters: { 'chimera': 40, 'unicorn': 10, 'living_armor': 5, 'cockatrice': 20, 'cave_spider': 20, 'dullahan': 5 },
    },
    'tomb_of_the_dead': {
        name: 'Tomb of the Dead',
        theme: 'cave',
        tier: 4,
        description: 'A grand mausoleum where the most powerful undead guard ancient treasures.',
        monsters: { 'living_armor': 40, 'one_eyed_troll': 10, 'unicorn': 5, 'necromancer': 20, 'orc_berserker': 20, 'mountain_goliath': 5 },
    },

    // Tier 5
    'archdragon_peak': {
        name: 'Archdragon Peak',
        theme: 'mountain',
        tier: 5,
        description: 'The highest point in the world, where only dragons and the strongest beasts dare to tread.',
        monsters: { 'dragon': 50, 'mountain_goliath': 20, 'livyatan': 20, 'chimera': 5, 'unicorn': 5 },
    },
    'gate_of_hades': {
        name: 'Gate of Hades',
        theme: 'cave',
        tier: 5,
        description: 'A direct gateway to the underworld, guarded by its eternal, deathless warden.',
        monsters: { 'dullahan': 50, 'livyatan': 20, 'dragon': 20, 'living_armor': 5, 'chimera': 5 },
    },
    'el_dorado': {
        name: 'El Dorado, the Gilded City',
        theme: 'town',
        tier: 5,
        description: 'The lost city of gold, whose immense treasures are protected by an equally immense guardian.',
        monsters: { 'mountain_goliath': 50, 'dragon': 20, 'dullahan': 20, 'one_eyed_troll': 5, 'living_armor': 5 },
    },
    'hanging_sacred_temple': {
        name: 'Hanging Sacred Temple',
        theme: 'forest',
        tier: 5,
        description: 'A beautiful temple floating in the sky, home to the king of all beasts.',
        monsters: { 'livyatan': 50, 'mountain_goliath': 20, 'dullahan': 20, 'unicorn': 5, 'one_eyed_troll': 5 },
    },
};

const WEAPONS = {
    // Broken
    'fists': { name: 'Fists', damage: [2, 2], price: 0, description: "Just your bare hands." },
    'rusty_sword': { name: 'Rusty Sword', damage: [1, 6], price: 20, description: "A sword well past its prime." },

    // Common
    'dagger': { name: 'Dagger', damage: [2, 4], price: 50, description: "A simple, sharp blade." },
    'steel_longsword': { name: 'Steel Longsword', damage: [1, 8], price: 120, description: "A reliable and sturdy sword." },
    'rapier': { name: 'Rapier', damage: [1, 8], price: 150, description: "A slender, pointed sword for quick thrusts." },
    'longbow': { name: 'Longbow', damage: [1, 6], price: 100, description: "A standard bow for ranged attacks.", effect: { type: 'ranged', chance: 0.3 } },
    
    // Uncommon
    'heavy_greatsword': { name: 'Heavy Greatsword', damage: [2, 6], price: 350, description: "A weighty sword that requires two hands." },
    'obsidian_axe': { name: 'Obsidian Axe', damage: [1, 12], price: 400, description: "A brutal axe made of volcanic glass." },
    'masterwork_spear': { name: 'Masterwork Spear', damage: [3, 4], price: 500, description: "A finely crafted spear with a sharp point." },
    'golden_greatbow': { name: 'Golden Greatbow', damage: [1, 10], price: 600, description: "An elegant and powerful bow.", effect: { type: 'ranged', chance: 0.3 } },
    
    // Rare
    'elven_saber': { name: 'Elven Saber', damage: [4, 4], price: 1200, description: "A gracefully curved blade that strikes with precision.", effect: { type: 'crit', chance: 0.1, multiplier: 2.0 } },
    'lightning_javelin': { name: 'Lightning Javelin', damage: [3, 6], price: 1500, description: "A spear that crackles with stored energy.", effect: { type: 'lightning_damage', damage: [1, 8] } },
    'dwarven_warhammer': { name: 'Dwarven Warhammer', damage: [2, 8], price: 1300, description: "A heavy hammer that can daze foes.", effect: { type: 'paralyze', chance: 0.15, duration: 1 } },
    
    // Epic
    'flaming_sword': { name: 'Flaming Sword', damage: [2, 8], price: 3000, description: "A blade enchanted with eternal fire.", effect: { type: 'fire_damage', damage: [2, 6] } },
    'vampiric_dagger': { name: 'Vampiric Dagger', damage: [3, 4], price: 3200, description: "A cursed dagger that feeds on life force.", effect: { type: 'lifesteal', amount: 0.25 } },
    'sunderers_battleaxe': { name: 'Sunderer\'s Battleaxe', damage: [3, 6], price: 3500, description: "An axe designed to shatter armor.", effect: { type: 'ignore_defense', amount: 0.5 } },
    'obsidian_lamina': { name: 'Obsidian Lamina', damage: [2, 6], price: 3300, description: "A razor-sharp blade that finds weak points.", effect: { type: 'crit', chance: 0.3, multiplier: 3.0 } },
    'eye_of_medusa': { name: 'Eye of Medusa', damage: [3, 4], price: 4000, description: "A bow crafted with a petrifying gaze.", effect: { type: 'ranged', chance: 0.3, petrify_chance: 0.3, duration: 1 } },
    
    // Legendary
    'earthshaker_hammer': { name: 'Earthshaker Hammer', damage: [2, 12], price: 10000, description: "A hammer that strikes with the force of an earthquake.", effect: { type: 'paralyze', chance: 0.3, duration: 1 } },
    'vacuum_greatbow': { name: 'Vacuum Greatbow', damage: [1, 12], price: 12000, description: "Arrows from this bow find their mark as if through a void.", effect: { type: 'ranged', chance: 0.3, ignore_defense: 1.0 } },
    'dragon_scale_cragblade': { name: 'Dragon Scale Cragblade', damage: [2, 8], price: 15000, description: "A greatsword forged from dragon scales, humming with lightning.", effect: { type: 'lightning_damage', damage: [2, 8], bonus_vs_dragon: 1.5 } },
    'void_greatsword': { name: 'Void Greatsword', damage: [3, 8], price: 20000, description: "A blade that whispers of the abyss, tethering your soul to the world.", effect: { type: 'lifesteal', amount: 0.25, revive: true } }
};

const SHIELDS = {
    'no_shield': {name: 'None', defense: 0, blockChance: 0, price: 0, description: "No protection on your arm."},
    'wooden_shield': {name: 'Wooden Shield', defense: 1, blockChance: 0.10, price: 75, description: "A simple, roughly made wooden shield."},
    'iron_kite_shield': {name: 'Iron Kite Shield', defense: 2, blockChance: 0.15, price: 250, description: "A sturdy shield shaped for cavalry, offering decent protection."},
    'iron_buckler': { name: 'Iron Buckler', defense: 1, price: 300, description: "A small, agile shield designed for parrying attacks.", effect: { type: 'parry', chance: 0.15 } },
    'brass_shield': { name: 'Brass Shield', defense: 3, blockChance: 0.15, price: 500, description: "A polished brass shield that's both durable and stylish." },
    'titanium_parrying_shield': { name: 'Titanium Parrying Shield', defense: 3, price: 1200, description: "A lightweight yet incredibly tough shield perfect for deflecting blows.", effect: { type: 'parry', chance: 0.20 } },
    'maxwellian_dueling_shield': { name: 'Maxwellian Dueling Shield', defense: 5, price: 4000, description: "An ornate and perfectly balanced shield, a masterpiece of defensive art.", effect: { type: 'parry', chance: 0.25 } },
    'heavy_slabshield': { name: 'Heavy Slabshield', defense: 10, blockChance: 0.20, price: 5000, description: "A massive slab of iron that is more a mobile wall than a shield." },
    'tower_greatshield': {name: 'Tower Greatshield', defense: 5, blockChance: 0.4, price: 3500, description: "A shield so large it can cover the entire body, offering immense protection at the cost of mobility."},
    'purifying_crystal_shield': { name: 'Purifying Crystal Shield', defense: 5, blockChance: 0.20, price: 6000, description: "A shield with a crystal that pulses with clean energy.", effect: { type: 'debuff_resist', chance: 0.5 } },
    'exa_reflector': { name: 'Exa-Reflector', defense: 5, price: 8000, description: "An advanced shield that reflects a portion of incoming damage back at the attacker.", effect: { type: 'reflect', amount: 0.25 } }
};

const ARMOR = {
    'travelers_garb': {name: 'Traveler\'s Garb', defense: 1, price: 0, description: "Simple clothes for a long journey. Offers minimal protection."},
    'leather_armor': {name: 'Leather Armor', defense: 3, price: 50, description: "Hardened leather plates, a solid choice for any adventurer."},
    'padded_leather': {name: 'Padded Leather', defense: 5, price: 150, description: "Reinforced leather with thick padding underneath."},
    'chainmail_armor': {name: 'Chainmail Armor', defense: 8, price: 400, description: "A tunic of interlocking metal rings."},
    'half_plate_armor': {name: 'Half-Plate Armor', defense: 10, price: 800, description: "A mix of chainmail and solid metal plates, offering good protection with some mobility.", blockChance: 0.10},
    'steel_plate_armor': {name: 'Steel Plate Armor', defense: 15, price: 1500, description: "A full suit of articulated steel plates.", blockChance: 0.15},
    'adamantine_armor': {name: 'Adamantine Armor', defense: 20, price: 5000, description: "Armor forged from a legendary, nigh-unbreakable metal.", blockChance: 0.15},
    'soul_steel_armor': {name: 'Soul Steel Armor', defense: 25, price: 10000, description: "Adamantine infused with Soul Armor Shards, creating a truly superior defense.", blockChance: 0.2},
    
    'silenced_leather_armor': {name: 'Silenced Leather Armor', defense: 5, price: 750, description: "Specially treated leather that muffles sound, favored by rogues.", effect: { type: 'dodge', chance: 0.10 }},
    'assassin_cloak_armor': {name: 'Assassin Cloak Armor', defense: 5, price: 2000, description: "Dark, flowing robes with hidden armor plates, designed for evasion.", effect: { type: 'dodge', chance: 0.20 }},
    'vacuum_encaser': {name: 'Vacuum Encaser', defense: 10, price: 7500, description: "A bizarre armor crafted with Livyatan parts that seems to warp space around the wearer.", effect: { type: 'dodge', chance: 0.25 }}
};

const ITEMS = {
    'health_potion': {name: 'Health Potion', type: 'healing', amount: 20, price: 30, description: "A simple vial that restores a small amount of health."},
    'superior_health_potion': {name: 'Superior Health Potion', type: 'healing', amount: 50, price: 75, description: "A potent draught that restores a moderate amount of health."},
    'mana_potion': {name: 'Mana Potion', type: 'mana_restore', amount: 20, price: 40, description: "A swirling blue liquid that restores magical energy."},
    'goblin_ear': {name: 'Goblin Ear', type: 'junk', price: 5, description: "A grotesque trophy."},
    'wolf_pelt': {name: 'Wolf Pelt', type: 'junk', price: 12, description: "A thick and coarse pelt."},
    'rat_tail': {name: 'Rat Tail', type: 'junk', price: 2, description: "It's... a rat tail."},
    'spider_venom': {name: 'Spider Venom', type: 'junk', price: 10, description: "A vial of potent venom."},
    'dragon_scale': {name: 'Dragon Scale', type: 'junk', price: 50, description: "A shimmering, nigh-indestructible scale."},
    'rabbit_meat': {name: 'Rabbit Meat', type: 'junk', price: 4, description: "Could make a good stew."},
    'orc_liver': { name: 'Orc Liver', type: 'alchemy', price: 25, description: 'A key ingredient for strength potions.' },
    'cockatrice_venom_gland': { name: 'Cockatrice Venom Gland', type: 'alchemy', price: 40, description: 'Can be used to create potions that harden the skin.' },
    'unicorn_horn_fragment': { name: 'Unicorn Horn Fragment', type: 'alchemy', price: 100, description: 'A shard of a unicorn horn, brimming with purifying magic.' },
    'slime_glob': { name: 'Slime Glob', type: 'alchemy', price: 8, description: 'A versatile, gelatinous substance.' },
    'soul_armor_shard': { name: 'Soul Armor Shard', type: 'alchemy', price: 500, description: 'A fragment of a Living Armor, humming with contained spiritual energy.' },
    'livyatan_vacuum_lining': { name: 'Livyatan Vacuum Lining', type: 'alchemy', price: 1500, description: 'A strange, reality-warping membrane from inside a Livyatan.'},
    'strength_potion': { name: 'Strength Potion', type: 'buff', price: 150, effect: { type: 'strength', multiplier: 1.5, duration: 3 }, description: 'Temporarily increases physical damage.' },
    'stonehide_potion': { name: 'Stonehide Potion', type: 'buff', price: 200, effect: { type: 'stonehide', multiplier: 2, duration: 3 }, description: 'Temporarily increases defense.' },
    'cleansing_potion': { name: 'Cleansing Potion', type: 'cleanse', price: 250, description: 'Removes all negative status effects.' },
};
const LURES = {
    'no_lure': { name: 'None', price: 0, description: 'No lure equipped.' },
    'goblin_scent_gland': { name: 'Goblin Scent Gland', price: 50, description: 'The potent smell seems to attract goblins.', lureTarget: 'goblin', uses: 5 },
    'sweet_grass_scent': { name: 'Sweet Grass Scent', price: 50, description: 'The scent of a sweet smelling grass, favorite snack of the rabid rabbits.', lureTarget: 'rabid_rabbit', uses: 5 },
    'chemical_lure': { name: 'Chemical Lure', price: 70, description: 'The inexplicable stench of chemical that lures in slimes.', lureTarget: 'slime', uses: 5 },
    'rotten_cheese': { name: 'Rotten Cheese', price: 80, description: 'The pungent smell of rotten cheese that attracts the hunger of rats.', lureTarget: 'giant_rat', uses: 5 },
    'bandit_coin': { name: 'Gilded Coin', price: 100, description: 'A shiny coin that seems to attract the greedy eyes of bandits.', lureTarget: 'bandit', uses: 5 },
    'wolf_musk': { name: 'Wolf Musk', price: 75, description: 'A strong musk that draws in nearby wolves.', lureTarget: 'dire_wolf', uses: 5 }
};
const MAGIC = {
    'fireball': {name: 'Fireball', type:'damage', damage: [2, 6], cost: 10, price: 100, description: 'Hurls a ball of fire at an enemy.'},
    'lightning_bolt': {name: 'Lightning Bolt', type:'damage', damage: [1, 8], cost: 15, price: 250, description: 'Calls down a bolt of lightning.'},
    'rain_of_arrow': {name: 'Rain of Arrow', type: 'damage', damage: [3, 4], cost: 12, price: 150, description: 'Summons a rain of arrow that showers the enemy'},
    'heal': {name: 'Heal', type:'healing', healing: [2, 8], cost: 20, price: 150, description: 'Mends wounds with soothing magic.'},
    'greater_heal': {name: 'Greater Heal', type:'healing', healing: [4, 6], cost: 50, price: 500, description: 'Let the moonlight embraces you.'}
};

const MONSTER_SPECIES = {
    // Tier 1
    'goblin': { key: 'goblin', name: 'Goblin', class: 'Humanoid', tier: 1, base_hp: 20, base_strength: 3, base_defense: 0, base_xp: 25, base_gold: 15, loot_table: {'health_potion': 0.1, 'goblin_ear': 0.5, 'dagger': 0.1, 'rusty_sword': 0.15, 'wooden_shield': 0.05} },
    'rabid_rabbit': { key: 'rabid_rabbit', name: 'Rabid Rabbit', class: 'Beast', tier: 1, base_hp: 25, base_strength: 2, base_defense: 1, base_xp: 25, base_gold: 8, loot_table: {'rabbit_meat': 0.6} },
    'slime': { key: 'slime', name: 'Slime', class: 'Monstrosity', tier: 1, base_hp: 28, base_strength: 2, base_defense: 2, base_xp: 22, base_gold: 10, loot_table: {'slime_glob': 0.5} },
    'skeleton': { key: 'skeleton', name: 'Skeleton', class: 'Undead', tier: 1, base_hp: 18, base_strength: 3, base_defense: 2, base_xp: 20, base_gold: 10, loot_table: {'rusty_sword': 0.1, 'dagger': 0.05, 'wooden_shield': 0.05, 'iron_buckler': 0.03} },
    
    // Tier 2
    'bandit': { key: 'bandit', name: 'Bandit', class: 'Humanoid', tier: 2, base_hp: 45, base_strength: 8, base_defense: 3, base_xp: 50, base_gold: 30, loot_table: {'health_potion': 0.25, 'dagger': 0.15, 'rusty_sword': 0.1, 'steel_longsword': 0.05, 'iron_kite_shield': 0.05, 'iron_buckler': 0.05, 'padded_leather': 0.08, 'silenced_leather_armor': 0.02} },
    'dire_wolf': { key: 'dire_wolf', name: 'Dire Wolf', class: 'Beast', tier: 2, base_hp: 60, base_strength: 6, base_defense: 2, base_xp: 40, base_gold: 15, loot_table: {'health_potion': 0.15, 'wolf_pelt': 0.4} },
    'giant_rat': { key: 'giant_rat', name: 'Giant Rat', class: 'Monstrosity', tier: 2, base_hp: 40, base_strength: 5, base_defense: 1, base_xp: 35, base_gold: 10, loot_table: {'rat_tail': 0.6} },
    'armored_zombie': { key: 'armored_zombie', name: 'Armored Zombie', class: 'Undead', tier: 2, base_hp: 50, base_strength: 7, base_defense: 5, base_xp: 45, base_gold: 20, loot_table: {'dagger': 0.05, 'steel_longsword': 0.08, 'heavy_greatsword': 0.03, 'iron_kite_shield': 0.05, 'brass_shield': 0.03, 'padded_leather': 0.05, 'chainmail_armor': 0.03} },
    
    // Tier 3
    'orc_berserker': { key: 'orc_berserker', name: 'Orc Berserker', class: 'Humanoid', tier: 3, ability: 'enrage', base_hp: 70, base_strength: 12, base_defense: 4, base_xp: 80, base_gold: 40, loot_table: {'health_potion': 0.3, 'steel_longsword': 0.1, 'heavy_greatsword': 0.08, 'obsidian_axe': 0.05, 'sunderers_battleaxe': 0.02, 'orc_liver': 0.3, 'brass_shield': 0.05, 'titanium_parrying_shield': 0.02, 'chainmail_armor': 0.05, 'half_plate_armor': 0.02} },
    'cave_spider': { key: 'cave_spider', name: 'Cave Spider', class: 'Beast', tier: 3, ability: 'poison_web', base_hp: 90, base_strength: 9, base_defense: 3, base_xp: 75, base_gold: 30, loot_table: {'spider_venom': 0.5, 'eye_of_medusa': 0.01} },
    'cockatrice': { key: 'cockatrice', name: 'Cockatrice', class: 'Monstrosity', tier: 3, ability: 'petrification', base_hp: 80, base_strength: 10, base_defense: 5, base_xp: 90, base_gold: 50, loot_table: {'cockatrice_venom_gland': 0.4, 'eye_of_medusa': 0.02} },
    'necromancer': { key: 'necromancer', name: 'Necromancer', class: 'Undead', tier: 3, ability: 'necromancy', base_hp: 60, base_strength: 8, base_defense: 2, base_xp: 100, base_gold: 60, loot_table: {'mana_potion': 0.2, 'vampiric_dagger': 0.02, 'assassin_cloak_armor': 0.02} },
    
    // Tier 4
    'one_eyed_troll': { key: 'one_eyed_troll', name: 'One-Eyed Troll', class: 'Humanoid', tier: 4, ability: 'ultra_focus', base_hp: 150, base_strength: 20, base_defense: 8, base_xp: 200, base_gold: 100, loot_table: {'superior_health_potion': 0.2, 'obsidian_axe': 0.08, 'sunderers_battleaxe': 0.04, 'heavy_slabshield': 0.03, 'steel_plate_armor': 0.03} },
    'unicorn': { key: 'unicorn', name: 'Unicorn', class: 'Beast', tier: 4, ability: 'healing', base_hp: 170, base_strength: 15, base_defense: 5, base_xp: 180, base_gold: 80, loot_table: {'unicorn_horn_fragment': 0.5, 'golden_greatbow': 0.05, 'obsidian_lamina': 0.02, 'purifying_crystal_shield': 0.02} },
    'chimera': { key: 'chimera', name: 'Chimera', class: 'Monstrosity', tier: 4, ability: 'true_poison', base_hp: 160, base_strength: 18, base_defense: 10, base_xp: 250, base_gold: 120, loot_table: {'golden_greatbow': 0.03, 'eye_of_medusa': 0.03} },
    'living_armor': { key: 'living_armor', name: 'Living Armor', class: 'Undead', tier: 4, ability: 'living_shield', base_hp: 120, base_strength: 17, base_defense: 15, base_xp: 220, base_gold: 110, loot_table: {'obsidian_axe': 0.05, 'masterwork_spear': 0.08, 'flaming_sword': 0.03, 'tower_greatshield': 0.05, 'exa_reflector': 0.01, 'soul_armor_shard': 0.1, 'steel_plate_armor': 0.05, 'adamantine_armor': 0.01} },
    
    // Tier 5
    'mountain_goliath': { key: 'mountain_goliath', name: 'Mountain Goliath', class: 'Humanoid', tier: 5, ability: 'earthshaker', base_hp: 300, base_strength: 28, base_defense: 12, base_xp: 500, base_gold: 250, loot_table: {'sunderers_battleaxe': 0.05, 'earthshaker_hammer': 0.01, 'heavy_slabshield': 0.02} },
    'livyatan': { key: 'livyatan', name: 'Livyatan', class: 'Beast', tier: 5, ability: 'swallow', base_hp: 400, base_strength: 22, base_defense: 10, base_xp: 450, base_gold: 200, loot_table: {'vacuum_greatbow': 0.01, 'lightning_javelin': 0.05, 'livyatan_vacuum_lining': 0.2} },
    'dragon': { key: 'dragon', name: 'Dragon', class: 'Monstrosity', tier: 5, ability: 'scorch_earth', base_hp: 350, base_strength: 25, base_defense: 18, base_xp: 600, base_gold: 300, loot_table: {'dragon_scale': 0.5, 'flaming_sword': 0.05, 'dragon_scale_cragblade': 0.01} },
    'dullahan': { key: 'dullahan', name: 'Dullahan', class: 'Undead', tier: 5, ability: 'alive_again', base_hp: 250, base_strength: 26, base_defense: 14, base_xp: 550, base_gold: 280, loot_table: {'flaming_sword': 0.03, 'vampiric_dagger': 0.04, 'obsidian_lamina': 0.03, 'void_greatsword': 0.01, 'adamantine_armor': 0.02} }
};

const MONSTER_RARITY = {
    'common': {name: 'Common', multiplier: 1.0, rarityIndex: 1},
    'uncommon': {name: 'Uncommon', multiplier: 1.2, rarityIndex: 2},
    'rare': {name: 'Rare', multiplier: 1.5, rarityIndex: 3},
    'epic': {name: 'Epic', multiplier: 2.0, rarityIndex: 4},
    'legendary': {name: 'Legendary', multiplier: 2.5, rarityIndex: 5}
};

const MONSTER_CLASS_DAMAGE = {
    'Humanoid': { baseDice: 1, dieSides: 8 },
    'Beast': { baseDice: 2, dieSides: 4 },
    'Monstrosity': { baseDice: 3, dieSides: 3 },
    'Undead': { baseDice: 1, dieSides: 6 }
};

const QUESTS = {
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
        'collect_goblin_ears': { tier: 1, title: 'Proof of the Deed', type: 'collection', target: 'goblin_ear', required: 5, reward: { xp: 100, gold: 50 }, description: 'A fearful merchant wants proof that the goblin problem is being handled. Bring him their ears.' },
        'collect_daggers': { tier: 1, title: 'Arming the Militia', type: 'collection', target: 'dagger', required: 3, reward: { xp: 120, gold: 200 }, description: 'The town militia needs daggers for its new recruits. Find or buy them.' },
        'collect_wolf_pelts': { tier: 2, title: 'Warmth for Winter', type: 'collection', target: 'wolf_pelt', required: 5, reward: { xp: 150, gold: 100 }, description: 'A tailor needs quality wolf pelts to make winter cloaks.' },
        'collect_longswords': { tier: 2, title: 'Blacksmith\'s Order', type: 'collection', target: 'steel_longsword', required: 2, reward: { xp: 200, gold: 300 }, description: 'The blacksmith needs a couple of standard longswords for a trade caravan.' },
        'collect_spider_venom': { tier: 3, title: 'Potent Poisons', type: 'collection', target: 'spider_venom', required: 10, reward: { xp: 250, gold: 150 }, description: 'The alchemist requires a large quantity of spider venom for his experiments.' },
        'collect_obsidian_axes': { tier: 3, title: 'Orcish Weaponry', type: 'collection', target: 'obsidian_axe', required: 1, reward: { xp: 300, gold: 500 }, description: 'A collector is fascinated by orcish culture and wants a pristine obsidian axe.' },
        'collect_unicorn_horns': { tier: 4, title: 'A Noble Cure', type: 'collection', target: 'unicorn_horn_fragment', required: 3, reward: { xp: 500, gold: 400 }, description: 'The royal physician believes unicorn horns can cure the ailing king.' },
        'collect_flaming_swords': { tier: 4, title: 'The Fiery Blade', type: 'collection', target: 'flaming_sword', required: 1, reward: { xp: 1000, gold: 3500 }, description: 'A wealthy noble desires a legendary Flaming Sword for his collection.' },
        'collect_dragon_scales': { tier: 5, title: 'Indestructible Armor', type: 'collection', target: 'dragon_scale', required: 5, reward: { xp: 800, gold: 500 }, description: 'The king\'s blacksmith wants to forge armor from the scales of a dragon.' },
        'collect_earthshaker': { tier: 5, title: 'Might of the Mountain', type: 'collection', target: 'earthshaker_hammer', required: 1, reward: { xp: 5000, gold: 12000 }, description: 'The Dwarven king will pay handsomely for the return of the legendary Earthshaker Hammer.' },
        'brew_health_potions': { tier: 1, title: 'Basic Brewing', type: 'creation', target: 'health_potion', required: 5, reward: { xp: 100, gold: 200 }, description: 'The town alchemist needs a hand brewing a batch of basic Health Potions.' },
        'brew_strength_potions': { tier: 3, title: 'Liquid Courage', type: 'creation', target: 'strength_potion', required: 3, reward: { xp: 300, gold: 500 }, description: 'The captain of the guard wants Strength Potions to give his soldiers an edge.' },
        'brew_cleansing_potions': { tier: 4, title: 'Purification Ritual', type: 'creation', target: 'cleansing_potion', required: 2, reward: { xp: 500, gold: 600 }, description: 'The high priest needs Cleansing Potions for a temple ritual.' },
};

const LEGACY_QUESTS = {
    'collector_of_legend': {
        title: 'Collector of Legend',
        type: 'legacy_extermination',
        targets: Object.keys(MONSTER_SPECIES),
        reward: { xp: 5000, gold: 10000, item: 'legend_slayer' },
        description: 'Defeat a legendary version of every creature in the land.'
    }
};

const SHOP_INVENTORY = {
    'Potions & Items': ['health_potion', 'mana_potion', 'superior_health_potion'],
    'Weapons': ['dagger', 'rusty_sword'],
    'Gear': ['travelers_garb', 'leather_armor', 'padded_leather', 'wooden_shield']
};
const BLACKSMITH_INVENTORY = {
    'Weapons': ['steel_longsword', 'rapier', 'longbow', 'heavy_greatsword', 'masterwork_spear', 'elven_saber', 'dwarven_warhammer'],
    'Armor': ['chainmail_armor', 'half_plate_armor', 'steel_plate_armor'],
    'Shields': ['iron_kite_shield', 'iron_buckler', 'brass_shield', 'titanium_parrying_shield', 'maxwellian_dueling_shield', 'tower_greatshield']
};
const BLACK_MARKET_INVENTORY = {
    'Armor': ['silenced_leather_armor', 'assassin_cloak_armor'],
    'Lures': ['goblin_scent_gland', 'sweet_grass_scent', 'rotten_cheese', 'chemical_lure', 'bandit_coin', 'wolf_musk']
};

const ALCHEMY_RECIPES = {
    'brew_strength': { output: 'strength_potion', ingredients: { 'orc_liver': 1 }, cost: 50 },
    'brew_stonehide': { output: 'stonehide_potion', ingredients: { 'cockatrice_venom_gland': 1 }, cost: 75 },
    'brew_cleanse': { output: 'cleansing_potion', ingredients: { 'unicorn_horn_fragment': 1 }, cost: 100 },
    'brew_health': { output: 'health_potion', ingredients: { 'slime_glob': 2 }, cost: 10 },
    'brew_mana': { output: 'mana_potion', ingredients: { 'slime_glob': 2 }, cost: 15 },
    'brew_purifying_shield': { output: 'purifying_crystal_shield', ingredients: { 'unicorn_horn_fragment': 5 }, cost: 1500 },
    'brew_exa_reflector': { output: 'exa_reflector', ingredients: { 'soul_armor_shard': 1 }, cost: 2500 },
    'craft_soul_steel': { output: 'soul_steel_armor', ingredients: { 'soul_armor_shard': 5, 'adamantine_armor': 1 }, cost: 5000},
    'craft_vacuum_encaser': { output: 'vacuum_encaser', ingredients: { 'livyatan_vacuum_lining': 3 }, cost: 3000}
};
