const BIOMES = {
    'forest': {
        name: 'Whispering Forest',
        level_requirement: 1,
        description: 'A dense forest teeming with common beasts. Relatively safe for new adventurers.',
        monsters: { 'goblin': 49, 'dire_wolf': 40, 'cave_spider': 10, 'dragon': 1 },
        theme: 'forest'
    },
    'cave': {
        name: 'Shadowy Cave',
        level_requirement: 5,
        description: 'A dark, damp cave system, home to unsavory characters and creatures of the dark.',
        monsters: { 'bandit': 49, 'giant_rat': 40, 'orc_berserker': 10, 'dragon': 1 },
        theme: 'cave'
    },
    'mountain': {
        name: 'Dragon\'s Peak',
        level_requirement: 10,
        description: 'The treacherous peaks of the mountain, where only the strongest creatures survive. Rumors speak of a great beast at its summit.',
        monsters: { 'orc_berserker': 40, 'cave_spider': 30, 'bandit': 20, 'dragon': 10 },
        theme: 'mountain'
    }
};

const WEAPONS = {
    'fists': {name: 'Fists', damage: [1, 4], price: 0},
    'dagger': {name: 'Dagger', damage: [2, 4], price: 25},
    'rapier': {name: 'Rapier', damage: [1, 8], price: 100},
    'rusty_sword': {name: 'Rusty Sword', damage: [1, 6], price: 40},
    'steel_longsword': {name: 'Steel Longsword', damage: [2, 6], price: 150},
    'obsidian_axe': {name: 'Obsidian Axe', damage: [1, 12], price: 120},
    'masterwork_spear': {name: 'Masterwork Spear', damage: [2, 8], price: 500},
    'legend_slayer': {name: 'Legend Slayer', damage: [4, 8], price: 10000, effect: { type: 'bonus_vs_legendary', amount: 1.5 }}
};
const SHIELDS = {
    'no_shield': {name: 'None', defense: 0, blockChance: 0, price: 0},
    'wooden_shield': {name: 'Wooden Shield', defense: 1, blockChance: 0.15, price: 75},
    'iron_kite_shield': {name: 'Iron Kite Shield', defense: 2, blockChance: 0.25, price: 250},
    'tower_greatshield': {name: 'Tower Greatshield', defense: 5, blockChance: 0.4, price: 1000}
};
const ARMOR = {
    'rags': {name: 'Tattered Rags', defense: 0, price: 0},
    'leather_armor': {name: 'Leather Armor', defense: 3, price: 50},
    'chainmail': {name: 'Chainmail', defense: 6, price: 200},
    'steel_plate': {name: 'Steel Plate', defense: 10, price: 600}
};
const ITEMS = {
    'health_potion': {name: 'Health Potion', type: 'healing', amount: 20, price: 30},
    'superior_health_potion': {name: 'Superior Health Potion', type: 'healing', amount: 50, price: 75},
    'mana_potion': {name: 'Mana Potion', type: 'mana_restore', amount: 20, price: 40},
    'goblin_ear': {name: 'Goblin Ear', type: 'junk', price: 5},
    'wolf_pelt': {name: 'Wolf Pelt', type: 'junk', price: 12},
    'rat_tail': {name: 'Rat Tail', type: 'junk', price: 2},
    'spider_venom': {name: 'Spider Venom', type: 'junk', price: 10},
    'dragon_scale': {name: 'Dragon Scale', type: 'junk', price: 50}
};
const LURES = {
    'no_lure': { name: 'None', price: 0, description: 'No lure equipped.' },
    'goblin_scent_gland': { name: 'Goblin Scent Gland', price: 50, description: 'The potent smell seems to attract goblins.', lureTarget: 'goblin', uses: 5 },
    'bandit_coin': { name: 'Gilded Coin', price: 80, description: 'A shiny coin that seems to attract the greedy eyes of bandits.', lureTarget: 'bandit', uses: 3 },
    'wolf_musk': { name: 'Wolf Musk', price: 70, description: 'A strong musk that draws in nearby wolves.', lureTarget: 'dire_wolf', uses: 5 }
};
const MAGIC = {
    'fireball': {name: 'Fireball', type:'damage', damage: [2, 6], cost: 10, price: 100, description: 'Hurls a ball of fire at an enemy.'},
    'lightning_bolt': {name: 'Lightning Bolt', type:'damage', damage: [1, 8], cost: 15, price: 250, description: 'Calls down a bolt of lightning.'},
    'rain_of_arrow': {name: 'Rain of Arrow', type: 'damage', damage: [3, 4], cost: 12, price: 150, description: 'Summons a rain of arrow that showers the enemy'},
    'heal': {name: 'Heal', type:'healing', healing: [2, 8], cost: 20, price: 150, description: 'Mends wounds with soothing magic.'},
    'greater_heal': {name: 'Greater Heal', type:'healing', healing: [4, 6], cost: 50, price: 500, description: 'Let the moonlight embraces you.'}
};
const MONSTER_SPECIES = {
    'goblin': { name: 'Goblin', base_hp: 20, base_strength: 3, base_xp: 25, base_gold: 10, loot_table: {'health_potion': 0.1, 'goblin_ear': 0.5, 'dagger': 0.05} },
    'dire_wolf': { name: 'Dire Wolf', base_hp: 35, base_strength: 5, base_xp: 40, base_gold: 15, loot_table: {'health_potion': 0.15, 'wolf_pelt': 0.4} },
    'orc_berserker': { name: 'Orc Berserker', base_hp: 40, base_strength: 6, base_xp: 50, base_gold: 20, loot_table: {'health_potion': 0.2, 'obsidian_axe': 0.1} },
    'giant_rat': { name: 'Giant Rat', base_hp: 15, base_strength: 2, base_xp: 10, base_gold: 5, loot_table: {'rat_tail': 0.6} },
    'cave_spider': { name: 'Cave Spider', base_hp: 25, base_strength: 4, base_xp: 30, base_gold: 12, loot_table: {'spider_venom': 0.3} },
    'bandit': { name: 'Bandit', base_hp: 30, base_strength: 8, base_xp: 50, base_gold: 20, loot_table: {'health_potion': 0.25, 'dagger': 0.2, 'leather_armor': 0.1} },
    'dragon': { name: 'Dragon', base_hp: 100, base_strength: 10, base_xp: 150, base_gold: 100, loot_table: {'dragon_scale': 0.1, 'health_potion': 0.5, 'superior_health_potion': 0.1, 'flaming_sword': 0.2} }
};
const MONSTER_RARITY = {
    'common': {name: 'Common', multiplier: 1.0, damage: [1, 4], loot_chance_mod: 1.0, ability: null},
    'uncommon': {name: 'Uncommon', multiplier: 1.2, damage: [1, 6], loot_chance_mod: 1.5, ability: null},
    'rare': {name: 'Rare', multiplier: 1.5, damage: [2, 6], loot_chance_mod: 2.0, ability: null},
    'epic': {name: 'Epic', multiplier: 2.0, damage: [2, 8], loot_chance_mod: 2.5, ability: 'double_strike'},
    'legendary': {name: 'Legendary', multiplier: 2.5, damage: [3, 6], loot_chance_mod: 3.0, ability: 'life_drain'}
};
const QUESTS = {
    'goblin_ears': { title: 'Goblin Menace', type: 'fetch', target: 'goblin_ear', required: 5, reward: { xp: 100, gold: 50 }, description: 'Collect 5 Goblin Ears.' },
    'wolf_hunt': { title: 'Wolf Hunt', type: 'extermination', target: 'dire_wolf', required: 3, reward: { xp: 150, gold: 75 }, description: 'Kill 3 Dire Wolves.' },
    'rat_infestation': { title: 'Rat Infestation', type: 'extermination', target: 'giant_rat', required: 5, reward: { xp: 50, gold: 25 }, description: 'Kill 5 Giant Rats.' },
    'bandit_cave': { title: 'Bandit Cave', type: 'extermination', target: 'bandit', required: 10, reward: {xp: 200, gold: 100}, description: 'Eliminate 10 Bandits.'}
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
    'Gear': ['dagger', 'leather_armor', 'wooden_shield'],
    'Lures': ['goblin_scent_gland', 'bandit_coin', 'wolf_musk']
};
const BLACKSMITH_INVENTORY = {
    'Weapons': ['rapier', 'steel_longsword', 'masterwork_spear', 'flaming_sword', 'vampiric_dagger'],
    'Armor': ['chainmail', 'steel_plate', 'mana_robe'],
    'Shields': ['iron_kite_shield', 'tower_greatshield']
};

WEAPONS['flaming_sword'] = {name: 'Flaming Sword', damage: [3, 8], price: 700, effect: { type: 'fire_damage', damage: [3, 6] }};
WEAPONS['vampiric_dagger'] = {name: 'Vampiric Dagger', damage: [3, 4], price: 600, effect: { type: 'lifesteal', amount: 0.25 }};
ARMOR['mana_robe'] = {name: 'Robe of the Apprentice', defense: 1, price: 400, effect: { type: 'mp_regen', amount: 3 }};

