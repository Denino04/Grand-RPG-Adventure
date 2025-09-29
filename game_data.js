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

const ELEMENTS = {
    'none': { name: 'Non-elemental', adjective: '', weakness: [], strength: [] },
    'fire': { name: 'Fire', adjective: 'Scorching', weakness: ['water', 'earth'], strength: ['nature', 'wind'] },
    'water': { name: 'Water', adjective: 'Surging', weakness: ['nature', 'lightning'], strength: ['fire', 'earth'] },
    'earth': { name: 'Earth', adjective: 'Quaking', weakness: ['water', 'wind'], strength: ['fire', 'lightning'] },
    'wind': { name: 'Wind', adjective: 'Swirling', weakness: ['fire', 'lightning'], strength: ['nature', 'earth'] },
    'lightning': { name: 'Lightning', adjective: 'Thundering', weakness: ['earth'], strength: ['water', 'wind'] },
    'nature': { name: 'Nature', adjective: 'Blossoming', weakness: ['fire', 'wind'], strength: ['water', 'earth'] },
    'light': { name: 'Light', adjective: 'Shining', weakness: ['void'], strength: [] },
    'dark': { name: 'Dark', adjective: 'Shrouding', weakness: ['light'], strength: [] }, // Added Dark element
    'void': { name: 'Void', adjective: 'Abyssal', weakness: ['light'], strength: [] },
    'healing': { name: 'Healing', adjective: 'Restorative', weakness: [], strength: [] }
};

const WEAPONS = {
    // Broken
    'fists': { name: 'Fists', damage: [2, 2], price: 0, rarity: 'Broken', description: "Just your bare hands." },
    'rusty_sword': { name: 'Rusty Sword', damage: [1, 6], price: 20, rarity: 'Broken', description: "A sword well past its prime. Probably a tetanus risk." },

    // Common
    'dagger': { name: 'Dagger', damage: [2, 4], price: 50, rarity: 'Common', description: "A simple, sharp blade. Good for stabbing things, or perhaps spreading butter." },
    'steel_longsword': { name: 'Steel Longsword', damage: [1, 8], price: 120, rarity: 'Common', description: "A reliable and sturdy sword. The adventurer's best friend." },
    'rapier': { name: 'Rapier', damage: [1, 8], price: 150, rarity: 'Common', description: "A slender, pointed sword for quick, flashy thrusts." },
    'longbow': { name: 'Longbow', damage: [1, 6], price: 100, rarity: 'Common', description: "A standard bow for attacking from a socially acceptable distance.", effect: { type: 'ranged', chance: 0.3 } },
    'battleaxe': {nane: 'Battleaxe', damage: [1, 10], price: 200, rarity: 'Common', description: "A simple barbaric weapon capable of high level of destruction. Side effect includes prone to getting hit more.", effect: {type: 'dodge', chance: -0.5}},
    
    // Uncommon
    'heavy_greatsword': { name: 'Heavy Greatsword', damage: [2, 6], price: 350, rarity: 'Uncommon', description: "A weighty sword that requires two hands and a can-do attitude." },
    'obsidian_axe': { name: 'Obsidian Axe', damage: [1, 12], price: 400, rarity: 'Uncommon', description: "A brutal axe made of volcanic glass. Impractical, but very stylish." },
    'masterwork_spear': { name: 'Masterwork Spear', damage: [3, 4], price: 500, rarity: 'Uncommon', description: "A finely crafted spear with a sharp point. Excellent for keeping monsters at arm's length." },
    'golden_greatbow': { name: 'Golden Greatbow', damage: [1, 10], price: 600, rarity: 'Uncommon', description: "An elegant and powerful bow. Probably worth more than you are.", effect: { type: 'ranged', chance: 0.3 } },
    
    // Rare
    'elven_saber': { name: 'Elven Saber', damage: [4, 4], price: 1200, rarity: 'Rare', description: "A gracefully curved blade, humming with an energy that seems to guide it to vital points.", effect: { type: 'crit', chance: 0.1, multiplier: 2.0 } },
    'lightning_javelin': { name: 'Lightning Javelin', damage: [3, 6], price: 1500, rarity: 'Rare', description: "A spear forged in a storm, crackling with raw, untamed lightning.", effect: { type: 'lightning_damage', damage: [1, 8] } },
    'dwarven_warhammer': { name: 'Dwarven Warhammer', damage: [2, 8], price: 1300, rarity: 'Rare', description: "A hammer of immense weight and perfect balance, capable of staggering even the largest foes.", effect: { type: 'paralyze', chance: 0.15, duration: 1 } },
    'spellblade_of_echoes': { name: 'Spellblade of Echoes', damage: [2, 8], price: 1600, rarity: 'Rare', description: "A blade that resonates with magical energy, unleashing a phantom strike whenever a spell is cast.", effect: { spell_follow_up: true } },
    'dual_longswords': { name: 'Dual Longswords', damage: [1, 8], price: 1800, rarity: 'Rare', description: "A perfectly matched pair of swords that flow in a whirlwind of steel, attacking twice. Requires both hands, obviously.", effect: { double_strike: true, dual_wield: true } },
    
    // Epic
    'flaming_sword': { name: 'Flaming Sword', damage: [2, 8], price: 3000, rarity: 'Epic', description: "A blade enchanted with an eternal, unquenchable fire. Great for marshmallows, better for monsters.", effect: { type: 'fire_damage', damage: [2, 6] } },
    'vampiric_dagger': { name: 'Vampiric Dagger', damage: [3, 4], price: 3200, rarity: 'Epic', description: "A cursed, blood-drinking dagger that mends the wielder's wounds. Its thirst is never slaked.", effect: { type: 'lifesteal', amount: 0.25 } },
    'sunderers_battleaxe': { name: 'Sunderer\'s Battleaxe', damage: [3, 6], price: 3500, rarity: 'Epic', description: "An axe of such brutal weight and design that it treats armor like a minor inconvenience.", effect: { ignore_defense: 0.5 } },
    'obsidian_lamina': { name: 'Obsidian Lamina', damage: [2, 6], price: 3300, rarity: 'Epic', description: "A razor-sharp volcanic blade that instinctively finds and exploits any weakness in a foe's defenses. Tends to be overly critical.", effect: { type: 'crit', chance: 0.3, multiplier: 3.0 } },
    'eye_of_medusa': { name: 'Eye of Medusa', damage: [3, 4], price: 4000, rarity: 'Epic', description: "A bow crafted from the petrified remains of a gorgon, its arrows turning flesh to stone. Try not to look directly at it.", effect: { type: 'ranged', chance: 0.3, petrify_chance: 0.3, duration: 1 } },
    
    // Legendary
    'earthshaker_hammer': { name: 'Earthshaker Hammer', damage: [2, 12], price: 10000, rarity: 'Legendary', description: "A hammer of mythical power, each blow striking with the force of an earthquake, leaving foes paralyzed and questioning their life choices.", effect: { type: 'paralyze', chance: 0.3, duration: 1 } },
    'vacuum_greatbow': { name: 'Vacuum Greatbow', damage: [1, 12], price: 12000, rarity: 'Legendary', description: "Arrows from this bow tear through the very fabric of space, ignoring all defenses as they seek their target. Spatially confusing for everyone involved.", effect: { type: 'ranged', chance: 0.3, ignore_defense: 1.0 } },
    'dragon_scale_cragblade': { name: 'Dragon Scale Cragblade', damage: [2, 8], price: 15000, rarity: 'Legendary', description: "A greatsword forged from the scales of an ancient dragon, it hums with the fury of a lightning storm and thirsts for the blood of its kin.", effect: { type: 'lightning_damage', damage: [2, 8], bonus_vs_dragon: 1.5 } },
    'void_greatsword': { name: 'Void Greatsword', damage: [3, 8], price: 20000, rarity: 'Legendary', description: "A blade that whispers of the abyss, tethering your soul to the world and cheating death itself. Comes with a complimentary existential crisis.", effect: { type: 'lifesteal', amount: 0.25, revive: true } }
};

const CATALYSTS = {
    'no_catalyst': { name: 'None', price: 0, rarity: 'Broken', description: "No catalyst equipped." },
    // Broken
    'wooden_stick': { name: 'Wooden Stick', price: 15, rarity: 'Broken', description: "A simple stick that can channel basic spells. Basically a magic twig.", effect: { ranged_chance: 0.05 } },
    // Common
    'wooden_wand': { name: 'Wooden Wand', price: 70, rarity: 'Common', description: "A wand that slightly amplifies magic. It's the thought that counts.", effect: { spell_amp: 1, ranged_chance: 0.1 } },
    'cracked_orb': { name: 'Cracked Orb', price: 70, rarity: 'Common', description: "An orb that makes spells cheaper to cast. Has a worrying rattle.", effect: { mana_discount: 3, ranged_chance: 0.1 } },
    // Uncommon
    'hardwood_staff': { name: 'Hardwood Staff', price: 300, rarity: 'Uncommon', description: "A sturdy staff that moderately amplifies spells. Good for leaning on, too.", effect: { spell_amp: 2, ranged_chance: 0.15 } },
    'magical_orb': { name: 'Magical Orb', price: 300, rarity: 'Uncommon', description: "A well-crafted orb that reduces mana costs. Polished to a distracting shine.", effect: { mana_discount: 5, ranged_chance: 0.15 } },
    // Rare
    'arcane_focus': { name: 'Arcane Focus', price: 1250, rarity: 'Rare', description: "A crystal that hums with latent power, amplifying spells and drawing mana from the air.", effect: { spell_amp: 2, mana_regen: 5, ranged_chance: 0.2 } },
    'cypresswood_staff': { name: 'Cypresswood Staff', price: 1250, rarity: 'Rare', description: "A staff made from ancient, resilient cypress, it channels life energy to mend the caster's wounds.", effect: { spell_amp: 2, hp_regen: 5, ranged_chance: 0.2 } },
    'staff_of_loss': { name: 'Staff of Loss', price: 1400, rarity: 'Rare', description: "A twisted staff that seems to gamble with magical energies, offering a chance for devastatingly powerful spells.", effect: { spell_amp: 2, spell_crit_chance: 0.1, spell_crit_multiplier: 2.0, ranged_chance: 0.2 } },
    // Epic
    'staff_of_the_magi': { name: 'Staff of the Magi', price: 4500, rarity: 'Epic', description: "The quintessential wizard's staff. Pointy at one end, glows on command, and makes spells hurt more. What's not to like?", effect: { spell_amp: 3, mana_regen: 10, ranged_chance: 0.25 } },
    'bloodwood_scepter': { name: 'Bloodwood Scepter', price: 4500, rarity: 'Epic', description: "Carved from a blood-drinking tree, this scepter drains your life force to fuel even greater destructive power.", effect: { spell_amp: 4, hp_regen: -5, ranged_chance: 0.25 } },
    'crystal_ball': { name: 'Crystal Ball', price: 4800, rarity: 'Epic', description: "A flawless crystal orb that clarifies the mind, making complex spells feel effortless and revealing critical weaknesses.", effect: { mana_discount: 10, spell_crit_chance: 0.15, spell_crit_multiplier: 2.0, ranged_chance: 0.25 } },
    'souldrinker_orb': { name: 'Souldrinker Orb', price: 6000, rarity: 'Epic', description: "A pulsating orb of dark energy that leeches life from your enemies with every spell. Unsettlingly warm to the touch.", effect: { spell_lifesteal: 0.2, ranged_chance: 0.25 } },
    // Legendary
    'mountain_carver': { name: 'Mountain Carver', price: 12000, rarity: 'Legendary', description: "A legendary staff carved from the heart of a mountain, amplifying spells with terrestrial fury. Not recommended for indoor use.", effect: { spell_amp: 4, ranged_chance: 0.3 } },
    'deep_sea_staff': { name: 'Deep Sea Staff', price: 12000, rarity: 'Legendary', description: "A staff of coral and pearl that channels the ocean's endless power, providing frankly ridiculous amounts of regeneration.", effect: { spell_amp: 3, hp_regen: 20, mana_regen: 15, ranged_chance: 0.3 } },
    'dragons_heart': { name: 'Dragon\'s Heart', price: 15000, rarity: 'Legendary', description: "A still-beating dragon's heart, granting immense magical power and making spells feel laughably cheap to cast.", effect: { spell_amp: 3, mana_discount: 20, ranged_chance: 0.3 } },
    'blackshadow_staff': { name: 'Blackshadow Staff', price: 18000, rarity: 'Legendary', description: "A staff of pure darkness that corrupts your spells, twisting them into devastating, soul-shattering critical strikes.", effect: { spell_amp: 3, spell_crit_chance: 0.25, spell_crit_multiplier: 3.0, ranged_chance: 0.3 } }
};

const SHIELDS = {
    'no_shield': {name: 'None', defense: 0, blockChance: 0, price: 0, rarity: 'Broken', description: "No protection on your arm."},
    'wooden_shield': {name: 'Wooden Shield', defense: 1, blockChance: 0.10, price: 75, rarity: 'Common', description: "A simple, roughly made wooden shield. Mostly keeps the rain off."},
    'iron_kite_shield': {name: 'Iron Kite Shield', defense: 2, blockChance: 0.15, price: 250, rarity: 'Common', description: "A sturdy shield shaped for cavalry, offering decent protection."},
    'iron_buckler': { name: 'Iron Buckler', defense: 1, price: 300, rarity: 'Uncommon', description: "A small, agile shield designed for parrying attacks. Or a very large dinner plate.", effect: { type: 'parry', chance: 0.15 } },
    'brass_shield': { name: 'Brass Shield', defense: 3, blockChance: 0.15, price: 500, rarity: 'Uncommon', description: "A polished brass shield that's both durable and stylish." },
    'trollblood_shield': { name: 'Trollblood Shield', defense: 3, price: 1400, rarity: 'Rare', description: "A shield imbued with the legendary regenerative powers of trolls. Smells faintly of wet dog.", effect: { hp_regen: 5 } },
    'titanium_parrying_shield': { name: 'Titanium Parrying Shield', defense: 3, price: 1200, rarity: 'Rare', description: "A lightweight yet incredibly tough shield perfect for turning aside deadly blows.", effect: { type: 'parry', chance: 0.20 } },
    'spiked_retaliator': { name: 'Spiked Retaliator', defense: 2, price: 1500, rarity: 'Rare', description: "A vicious shield that lashes out with a punishing counter-attack whenever you strike an enemy. It has anger issues.", effect: { attack_follow_up: { damage: [1, 4], paralyze_chance: 0.1, duration: 1 } } },
    'tower_greatshield': {name: 'Tower Greatshield', defense: 5, blockChance: 0.4, price: 3500, rarity: 'Epic', description: "A shield so large it has its own zip code, offering immense protection at the cost of seeing where you're going."},
    'purifying_crystal_shield': { name: 'Purifying Crystal Shield', defense: 5, blockChance: 0.20, price: 6000, rarity: 'Epic', description: "A shield with a crystal that pulses with clean energy, shrugging off curses and hexes.", effect: { type: 'debuff_resist', chance: 0.5 } },
    'maxwellian_dueling_shield': { name: 'Maxwellian Dueling Shield', defense: 5, price: 4000, rarity: 'Epic', description: "An ornate and perfectly balanced shield, a masterpiece of defensive art. So beautiful it's almost a shame to block things with it.", effect: { type: 'parry', chance: 1 } },
    'heavy_slabshield': { name: 'Heavy Slabshield', defense: 10, blockChance: 0.20, price: 5000, rarity: 'Legendary', description: "Less of a shield and more of a personal, portable wall. Effective, but not exactly nimble.", effect: { type: 'reflect', amount: 0.1 } },
    'exa_reflector': { name: 'Exa-Reflector', defense: 5, price: 8000, rarity: 'Legendary', description: "An advanced shield of strange design that reflects a portion of incoming damage back at the attacker. 'No, you!'", effect: { type: 'reflect', amount: 0.25 } }
};

const ARMOR = {
    'travelers_garb': {name: 'Traveler\'s Garb', defense: 1, price: 0, rarity: 'Broken', description: "Simple clothes for a long journey. Offers minimal protection."},
    'leather_armor': {name: 'Leather Armor', defense: 3, price: 50, rarity: 'Common', description: "Hardened leather plates, a solid choice for any adventurer."},
    'padded_leather': {name: 'Padded Leather', defense: 5, price: 150, rarity: 'Common', description: "Reinforced leather with thick padding underneath. Surprisingly comfy."},
    'chainmail_armor': {name: 'Chainmail Armor', defense: 8, price: 400, rarity: 'Uncommon', description: "A tunic of interlocking metal rings. Heavy, but better than being stabbed."},
    'half_plate_armor': {name: 'Half-Plate Armor', defense: 10, price: 800, rarity: 'Uncommon', description: "A mix of chainmail and solid metal plates, offering good protection with some mobility.", blockChance: 0.10},
    'silenced_leather_armor': {name: 'Silenced Leather Armor', defense: 3, price: 750, rarity: 'Rare', description: "Specially treated leather that muffles sound, making you unnervingly quiet. Perfect for sneaking up on people... or refrigerators at midnight.", effect: { type: 'dodge', chance: 0.10 }},
    'steel_plate_armor': {name: 'Steel Plate Armor', defense: 15, price: 1500, rarity: 'Rare', description: "A full suit of articulated steel plates. Makes a lot of noise.", blockChance: 0.15},
    'assassin_cloak_armor': {name: 'Assassin Cloak Armor', defense: 5, price: 2000, rarity: 'Epic', description: "Dark, flowing robes with hidden armor plates, designed for evasion and looking mysterious in dark corners.", effect: { type: 'dodge', chance: 0.20 }},
    'archmages_robes': {name: 'Archmage\'s Robes', defense: 8, price: 5000, rarity: 'Epic', description: "Woven with threads of pure mana, these robes constantly regenerate your magical energy and make spells easier to cast. Also surprisingly comfortable.", effect: { mana_regen: 5, mana_discount: 5 }},
    'adamantine_armor': {name: 'Adamantine Armor', defense: 20, price: 5000, rarity: 'Legendary', description: "Armor forged from a legendary, nigh-unbreakable metal. You feel ridiculously safe wearing this.", blockChance: 0.15},
    'mirror_mail': { name: 'Mirror Mail', defense: 18, price: 6000, rarity: 'Legendary', description: "A suit of highly polished armor that reflects a portion of every blow back at the attacker. Very high maintenance.", effect: { reflect_damage: 0.25 } },
    'soul_steel_armor': {name: 'Soul Steel Armor', defense: 25, price: 10000, rarity: 'Legendary', description: "Adamantine infused with the captured souls of ancient warriors, creating the ultimate defense. The whispers are mostly harmless.", blockChance: 0.2},
    'vacuum_encaser': {name: 'Vacuum Encaser', defense: 10, price: 7500, rarity: 'Legendary', description: "A bizarre armor crafted with Livyatan parts that seems to warp space around the wearer. Causes mild nausea in bystanders.", effect: { type: 'dodge', chance: 0.25 }}
};

const ITEMS = {
    'health_potion': {name: 'Health Potion', type: 'healing', amount: 20, price: 30, description: "A simple vial that restores a small amount of health."},
    'condensed_health_potion': {name: 'Condesed Health Potion', type: 'healing', amount: 50, price: 75, description: "A heavy, concentrated mixture of refined herbs and purified mountain water. This potion is thicker and more potent than its normal counterpart, designed to provide substantial, immediate relief."},
    'superior_health_potion': {name: 'Superior Health Potion', type: 'healing', amount: 100, price: 200, description: "A potent draught that restores a moderate amount of health."},
    'mana_potion': {name: 'Mana Potion', type: 'mana_restore', amount: 20, price: 40, description: "A swirling blue liquid that restores magical energy."},
    'condensed_mana_potion': {name: 'Condensed Mana Potion', type: 'mana_restore', amount: 50, price: 100, description: "An oxidized flask containing a potent brew of crushed celestial beetles and distilled shadow essence. It provides a sharp, invigorating shock to the mind, clearing the fog of battle-weariness."},
    'superior_mana_potion': {name: 'Superion Mana Potion', type: 'mana_restore', amount: 100, price: 250, description: "A masterwork of alchemy. The shimmering liquid is pure, crystallized Arcane Energy, providing not just mana, but a momentary conduit to the raw source of magic itself."},
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
    'vacuum_lining': { name: 'Vacuum Lining', type: 'alchemy', price: 1500, description: 'A strange, reality-warping membrane from inside a Livyatan.'},
    'mountain_rock': { name: 'Mountain Rock', type: 'alchemy', price: 1000, description: 'A chunk of rock humming with the power of a mountain.'},
    'dragon_heart_item': { name: 'Dragon Heart', type: 'alchemy', price: 2000, description: 'The still-warm heart of a slain dragon.'},
    'void_heart': { name: 'Void Heart', type: 'alchemy', price: 2000, description: 'A pulsating shard of darkness from a Dullahan.'},
    'strength_potion': { name: 'Strength Potion', type: 'buff', price: 150, effect: { type: 'strength', multiplier: 1.5, duration: 3 }, description: 'Temporarily increases physical damage.' },
    'stonehide_potion': { name: 'Stonehide Potion', type: 'buff', price: 200, effect: { type: 'stonehide', multiplier: 2, duration: 3 }, description: 'Temporarily increases defense.' },
    'cleansing_potion': { name: 'Cleansing Potion', type: 'cleanse', price: 250, description: 'Removes all negative status effects.' },
    'fire_essence': { name: 'Fire Essence', type: 'enchant', price: 100, description: 'The pure, searing essence of fire.' },
    'water_essence': { name: 'Water Essence', type: 'enchant', price: 100, description: 'The pure, flowing essence of water.' },
    'earth_essence': { name: 'Earth Essence', type: 'enchant', price: 100, description: 'The pure, stoic essence of earth.' },
    'wind_essence': { name: 'Wind Essence', type: 'enchant', price: 100, description: 'The pure, rushing essence of wind.' },
    'lightning_essence': { name: 'Lightning Essence', type: 'enchant', price: 100, description: 'The pure, crackling essence of lightning.' },
    'nature_essence': { name: 'Nature Essence', type: 'enchant', price: 100, description: 'The pure, vibrant essence of nature.' },
    'light_essence': { name: 'Light Essence', type: 'enchant', price: 100, description: 'The pure, radiant essence of light.' },
    'void_essence': { name: 'Void Essence', type: 'enchant', price: 100, description: 'The pure, silent essence of the void.' },
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

const SPELLS = {
    // Non-Elemental
    'none_st': {
        element: 'none', type: 'st', learnCost: 250,
        tiers: [
            { name: 'Eldritch Blast', cost: 15, damage: [1, 8], cap: 3, upgradeCost: 750, upgradeEssences: { 'fire_essence': 3, 'water_essence': 3 }, description: "A bolt of raw, crackling arcane energy." },
            { name: 'Bullet of Force', cost: 30, damage: [2, 8], cap: 5, upgradeCost: 3000, upgradeEssences: { 'earth_essence': 5, 'wind_essence': 5 }, description: "A concentrated projectile of pure kinetic force that punches through defenses." },
            { name: 'Arcane Unleashed', cost: 50, damage: [3, 8], cap: 8, description: "Release a torrent of untamed magical power, overwhelming a single target." }
        ]
    },
    'none_aoe': {
        element: 'none', type: 'aoe', learnCost: 250,
        tiers: [
            { name: 'Magical Grenade', cost: 22, damage: [1, 6], cap: 3, splash: 0.25, upgradeCost: 1000, upgradeEssences: { 'fire_essence': 3, 'water_essence': 3 }, description: "Lob an explosive sphere of magical energy that damages nearby foes." },
            { name: 'Rain of Arrow', cost: 42, damage: [2, 6], cap: 5, splash: 0.50, upgradeCost: 4000, upgradeEssences: { 'earth_essence': 5, 'wind_essence': 5 }, description: "Summon a volley of phantom arrows to strike multiple enemies." },
            { name: 'Meteor Shower', cost: 65, damage: [3, 6], cap: 8, splash: 0.75, description: "Call down a cataclysmic shower of meteors to bombard the battlefield." }
        ]
    },
    // Fire
    'fire_st': {
        element: 'fire', type: 'st', learnCost: 250,
        tiers: [
            { name: 'Fireshot', cost: 18, damage: [1, 8], cap: 3, upgradeCost: 750, upgradeEssences: { 'fire_essence': 5 }, description: "Launch a simple bolt of searing flame at a target." },
            { name: 'Fire Arrow', cost: 33, damage: [2, 8], cap: 5, upgradeCost: 3000, upgradeEssences: { 'fire_essence': 10 }, description: "Conjure an arrow of pure fire that seeks its target with burning intensity." },
            { name: 'Divine Blazing Arrow', cost: 55, damage: [3, 8], cap: 8, description: "Unleash a sacred arrow of white-hot fire that purges foes with righteous flame." }
        ]
    },
    'fire_aoe': {
        element: 'fire', type: 'aoe', learnCost: 250,
        tiers: [
            { name: 'Fireball', cost: 27, damage: [1, 6], cap: 3, splash: 0.25, upgradeCost: 1000, upgradeEssences: { 'fire_essence': 5 }, description: "Hurl a classic exploding sphere of fire, engulfing enemies in a fiery blast." },
            { name: 'Fire Orb', cost: 45, damage: [2, 6], cap: 5, splash: 0.50, upgradeCost: 4000, upgradeEssences: { 'fire_essence': 10 }, description: "Create a slow-moving but intensely hot orb of fire that detonates with great force." },
            { name: 'Great Chaos Orb', cost: 70, damage: [3, 6], cap: 8, splash: 0.75, description: "Hurl a massive, churning orb of chaotic flame that leaves a pool of lava in its wake." }
        ]
    },
    'fire_support': {
        element: 'fire', type: 'support', learnCost: 250,
        tiers: [
            { name: 'Flame, Grant me Strength', cost: 38, effect: { type: 'buff_strength', multiplier: 1.5, duration: 3 }, description: "Increase strength by 50% for 3 turns.", upgradeCost: 2000, upgradeEssences: { 'fire_essence': 8 } },
            { name: 'Chaos, Boil my Blood', cost: 60, effect: { type: 'buff_chaos_strength', strMultiplier: 2.0, defMultiplier: 0.5, duration: 3 }, description: "Increase strength by 100% but decrease all defense by 50% for 3 turns." }
        ]
    },
    // Water
    'water_st': {
        element: 'water', type: 'st', learnCost: 250,
        tiers: [
            { name: 'Water Gun', cost: 18, damage: [1, 8], cap: 3, upgradeCost: 750, upgradeEssences: { 'water_essence': 5 }, description: "Fire a high-pressure jet of water at an enemy." },
            { name: 'Surging Strike', cost: 33, damage: [2, 8], cap: 5, upgradeCost: 3000, upgradeEssences: { 'water_essence': 10 }, description: "Command a wave to crash down upon a single foe with the ocean's might." },
            { name: 'Pressurized Water Laser', cost: 55, damage: [3, 8], cap: 8, description: "Focus a stream of water into a razor-thin laser that slices through armor." }
        ]
    },
    'water_aoe': {
        element: 'water', type: 'aoe', learnCost: 250,
        tiers: [
            { name: 'Water Spout', cost: 27, damage: [1, 6], cap: 3, splash: 0.25, upgradeCost: 1000, upgradeEssences: { 'water_essence': 5 }, description: "Summon a whirling spout of water to drench and damage a group of enemies." },
            { name: 'Water Surf', cost: 45, damage: [2, 6], cap: 5, splash: 0.50, upgradeCost: 4000, upgradeEssences: { 'water_essence': 10 }, description: "Unleash a massive wave that crashes across the battlefield." },
            { name: 'Grand Flood', cost: 70, damage: [3, 6], cap: 8, splash: 0.75, description: "Inundate the area with a cataclysmic flood, drowning all who stand against you." }
        ]
    },
    'water_support': {
        element: 'water', type: 'support', learnCost: 250,
        tiers: [
            { name: 'Water Sport', cost: 30, effect: { type: 'debuff_strength', multiplier: 0.75, duration: 3 }, description: "Decrease enemies' strength by 25% for 3 turns.", upgradeCost: 2000, upgradeEssences: { 'water_essence': 8 } },
            { name: 'Deep Sea Protection', cost: 52, effect: { type: 'debuff_strength', multiplier: 0.5, duration: 3 }, description: "Decrease enemies' strength by 50% for 3 turns." }
        ]
    },
    // Earth
    'earth_st': {
        element: 'earth', type: 'st', learnCost: 250,
        tiers: [
            { name: 'Rock Throw', cost: 18, damage: [1, 8], cap: 3, upgradeCost: 750, upgradeEssences: { 'earth_essence': 5 }, description: "Magically hurl a heavy chunk of rock at a target." },
            { name: 'Earth\'s Edge', cost: 33, damage: [2, 8], cap: 5, upgradeCost: 3000, upgradeEssences: { 'earth_essence': 10 }, description: "Summon a jagged spear of rock from the ground to impale an enemy." },
            { name: 'Ferrum Ira Terrae', cost: 55, damage: [3, 8], cap: 8, description: "Manifest the earth's fury, encasing a foe in super-heated, molten iron." }
        ]
    },
    'earth_aoe': {
        element: 'earth', type: 'aoe', learnCost: 250,
        tiers: [
            { name: 'Tremorstrike', cost: 27, damage: [1, 6], cap: 3, splash: 0.25, upgradeCost: 1000, upgradeEssences: { 'earth_essence': 5 }, description: "Slam your power into the ground, creating a localized tremor to stagger nearby foes." },
            { name: 'Earthquake', cost: 45, damage: [2, 6], cap: 5, splash: 0.50, upgradeCost: 4000, upgradeEssences: { 'earth_essence': 10 }, description: "Shake the very foundations of the earth, causing the ground to rupture and damage your enemies." },
            { name: 'Ravine Creation', cost: 70, damage: [3, 6], cap: 8, splash: 0.75, description: "Violently tear the earth asunder, crushing all caught within the cataclysm." }
        ]
    },
    'earth_support': {
        element: 'earth', type: 'support', learnCost: 250,
        tiers: [
            { name: 'Rock Heart', cost: 38, effect: { type: 'buff_defense', multiplier: 1.5, duration: 3 }, description: "Increase physical defense by 50% for 3 turns.", upgradeCost: 2000, upgradeEssences: { 'earth_essence': 8 } },
            { name: 'Titan\'s Blood', cost: 60, effect: { type: 'buff_titan', defMultiplier: 1.5, strMultiplier: 1.5, duration: 3 }, description: "Increase physical defense and damage by 50% for 3 turns." }
        ]
    },
    // Wind
    'wind_st': {
        element: 'wind', type: 'st', learnCost: 250,
        tiers: [
            { name: 'Gale Shot', cost: 18, damage: [1, 8], cap: 3, upgradeCost: 750, upgradeEssences: { 'wind_essence': 5 }, description: "Fire a compressed blast of cutting wind at an enemy." },
            { name: 'Wind Drill', cost: 33, damage: [2, 8], cap: 5, upgradeCost: 3000, upgradeEssences: { 'wind_essence': 10 }, description: "Form a rapidly spinning vortex of wind to drill through a target's defenses." },
            { name: 'Excalibur\'s Edge', cost: 55, damage: [3, 8], cap: 8, description: "Summon a legendary blade of pure wind, so sharp it can slice through reality itself." }
        ]
    },
    'wind_aoe': {
        element: 'wind', type: 'aoe', learnCost: 250,
        tiers: [
            { name: 'Wind Gust', cost: 27, damage: [1, 6], cap: 3, splash: 0.25, upgradeCost: 1000, upgradeEssences: { 'wind_essence': 5 }, description: "Create a powerful gust of wind to buffet and damage a group of foes." },
            { name: 'Sweeping Edge', cost: 45, damage: [2, 6], cap: 5, splash: 0.50, upgradeCost: 4000, upgradeEssences: { 'wind_essence': 10 }, description: "Unleash a wide, scythe-like blade of wind that cuts across the battlefield." },
            { name: 'Hurricane Storm', cost: 70, damage: [3, 6], cap: 8, splash: 0.75, description: "Conjure a ferocious hurricane, trapping and shredding enemies in its chaotic embrace." }
        ]
    },
    'wind_support': {
        element: 'wind', type: 'support', learnCost: 250,
        tiers: [
            { name: 'Haste', cost: 45, effect: { type: 'buff_haste', duration: 3 }, description: "Grants an additional attack per turn for 3 turns.", upgradeCost: 2500, upgradeEssences: { 'wind_essence': 8 } },
            { name: 'Hermes\' Trickery', cost: 75, effect: { type: 'buff_hermes', duration: 3 }, description: "Grants Haste and doubles dodge/block chance for 3 turns." }
        ]
    },
    // Lightning
    'lightning_st': {
        element: 'lightning', type: 'st', learnCost: 250,
        tiers: [
            { name: 'Honed Bolt', cost: 18, damage: [1, 8], cap: 3, upgradeCost: 750, upgradeEssences: { 'lightning_essence': 5 }, description: "Launch a simple, crackling bolt of lightning." },
            { name: 'Concentrated Strike', cost: 33, damage: [2, 8], cap: 5, upgradeCost: 3000, upgradeEssences: { 'lightning_essence': 10 }, description: "Call down a focused, super-heated lightning strike on a single target." },
            { name: 'Wrath of the Sky', cost: 55, damage: [3, 8], cap: 8, description: "Channel the sky's fury, summoning a colossal thunderbolt that obliterates its target." }
        ]
    },
    'lightning_aoe': {
        element: 'lightning', type: 'aoe', learnCost: 250,
        tiers: [
            { name: 'Plasma Pulse', cost: 27, damage: [1, 6], cap: 3, splash: 0.25, upgradeCost: 1000, upgradeEssences: { 'lightning_essence': 5 }, description: "Release a pulse of raw plasma that arcs between nearby enemies." },
            { name: 'Electromagnetic Barrier', cost: 45, damage: [2, 6], cap: 5, splash: 0.50, upgradeCost: 4000, upgradeEssences: { 'lightning_essence': 10 }, description: "Create a deadly barrier of electricity that shocks all foes in an area." },
            { name: 'Thundercloud Form', cost: 70, damage: [3, 6], cap: 8, splash: 0.75, description: "Become a living thundercloud, raining down chaotic lightning strikes across the area." }
        ]
    },
    'lightning_support': {
        element: 'lightning', type: 'support', learnCost: 250,
        tiers: [
            { name: 'Unstable Ion', cost: 38, effect: { type: 'buff_ion_self', duration: 3 }, description: "Weapon attacks may chain to another target (including you) for 50% damage.", upgradeCost: 2000, upgradeEssences: { 'lightning_essence': 8 } },
            { name: 'Thunderbolt Blessings', cost: 68, effect: { type: 'buff_ion_other', duration: 3 }, description: "Weapon attacks may chain to other enemies. Reflect 25% of damage taken." }
        ]
    },
    // Nature
    'nature_st': {
        element: 'nature', type: 'st', learnCost: 250,
        tiers: [
            { name: 'Vine Strike', cost: 18, damage: [1, 8], cap: 3, upgradeCost: 750, upgradeEssences: { 'nature_essence': 5 }, description: "Command a thorny vine to lash out and strike a foe." },
            { name: 'Root Assault', cost: 33, damage: [2, 8], cap: 5, upgradeCost: 3000, upgradeEssences: { 'nature_essence': 10 }, description: "Summon thick, gnarled roots to burst from the earth and crush a target." },
            { name: 'Cage of the Nature', cost: 55, damage: [3, 8], cap: 8, description: "Entrap a foe in a cage of living, thorny wood that constricts and crushes them." }
        ]
    },
    'nature_aoe': {
        element: 'nature', type: 'aoe', learnCost: 250,
        tiers: [
            { name: 'Seed Bomb', cost: 27, damage: [1, 6], cap: 3, splash: 0.25, upgradeCost: 1000, upgradeEssences: { 'nature_essence': 5 }, description: "Hurl a seed that explodes into a burst of thorny shrapnel." },
            { name: 'Bamboo Field Strike', cost: 45, damage: [2, 6], cap: 5, splash: 0.50, upgradeCost: 4000, upgradeEssences: { 'nature_essence': 10 }, description: "Instantly grow a dense field of razor-sharp bamboo, impaling enemies in an area." },
            { name: 'Sea of Vines', cost: 70, damage: [3, 6], cap: 8, splash: 0.75, description: "Transform the ground into a writhing sea of thorny vines that tear at all enemies within." }
        ]
    },
    'nature_support': {
        element: 'nature', type: 'support', learnCost: 250,
        tiers: [
            { name: 'Ingrain', cost: 30, effect: { type: 'buff_ingrain', healing: [1, 6], cap: 5, indefinite: true }, description: "Regenerate HP each turn. Disables fleeing.", upgradeCost: 2000, upgradeEssences: { 'nature_essence': 8 } },
            { name: 'Blessing of Mother Nature', cost: 52, effect: { type: 'buff_mother_nature', healing: [1, 8], cap: 5, indefinite: true }, description: "Regenerate HP and MP each turn. Disables fleeing." }
        ]
    },
    // Light
    'light_st': {
        element: 'light', type: 'st', learnCost: 250,
        tiers: [
            { name: 'Photon Shot', cost: 18, damage: [1, 8], cap: 3, upgradeCost: 750, upgradeEssences: { 'light_essence': 5 }, description: "Fire a concentrated shot of pure, searing light." },
            { name: 'Divine Smite', cost: 33, damage: [2, 8], cap: 5, upgradeCost: 3000, upgradeEssences: { 'light_essence': 10 }, description: "Smite an enemy with a column of holy energy, especially effective against the undead." },
            { name: 'Light Pillar of Heaven', cost: 55, damage: [3, 8], cap: 8, description: "Call down a massive pillar of sacred light from the heavens to purge a target from existence." }
        ]
    },
    'light_aoe': {
        element: 'light', type: 'aoe', learnCost: 250,
        tiers: [
            { name: 'Lantern Spread', cost: 27, damage: [1, 6], cap: 3, splash: 0.25, upgradeCost: 1000, upgradeEssences: { 'light_essence': 5 }, description: "Release a gentle but searing wave of light, like the glow of a lantern." },
            { name: 'Beacon of Light', cost: 45, damage: [2, 6], cap: 5, splash: 0.50, upgradeCost: 4000, upgradeEssences: { 'light_essence': 10 }, description: "Erupt in a blinding flash of holy light, damaging and staggering nearby foes." },
            { name: 'Shine of the Archangel', cost: 70, damage: [3, 6], cap: 8, splash: 0.75, description: "Unfurl ethereal wings and release a devastating wave of archangelic power." }
        ]
    },
    'light_support': {
        element: 'light', type: 'support', learnCost: 250,
        tiers: [
            { name: 'Shield of Faith', cost: 38, effect: { type: 'buff_magic_defense', multiplier: 1.5, duration: 3 }, description: "Increase magical defense by 50% for 3 turns.", upgradeCost: 2000, upgradeEssences: { 'light_essence': 8 } },
            { name: 'Divine Blessings', cost: 60, effect: { type: 'buff_divine', multiplier: 2.0, duration: 3, cleanse: true }, description: "Increase magical defense by 100% for 3 turns and cleanse all debuffs." }
        ]
    },
    // Dark
    'dark_st': {
        element: 'dark', type: 'st', learnCost: 250,
        tiers: [
            { name: 'Shadow Sneak', cost: 18, damage: [1, 8], cap: 3, upgradeCost: 750, upgradeEssences: { 'void_essence': 5 }, description: "Launch a bolt of living shadow at an enemy." },
            { name: 'Hex Strike', cost: 33, damage: [2, 8], cap: 5, upgradeCost: 3000, upgradeEssences: { 'void_essence': 10 }, description: "Strike a foe with a debilitating hex that wracks their body with dark energy." },
            { name: 'Gate of the Underworld', cost: 55, damage: [3, 8], cap: 8, description: "Tear open a momentary rift to the underworld beneath a foe, pulling them toward oblivion." }
        ]
    },
    'dark_aoe': {
        element: 'dark', type: 'aoe', learnCost: 250,
        tiers: [
            { name: 'Shadow Bolt', cost: 27, damage: [1, 6], cap: 3, splash: 0.25, upgradeCost: 1000, upgradeEssences: { 'void_essence': 5 }, description: "Hurl a bolt of shadow that explodes on impact, damaging nearby enemies." },
            { name: 'Void Engulf', cost: 45, damage: [2, 6], cap: 5, splash: 0.50, upgradeCost: 4000, upgradeEssences: { 'void_essence': 10 }, description: "Engulf an area in a sphere of pure void, draining the life from those within." },
            { name: 'Black Hole', cost: 70, damage: [3, 6], cap: 8, splash: 0.75, description: "Conjure a miniature black hole that pulls in and crushes all enemies in its vicinity." }
        ]
    },
    'dark_support': {
        element: 'dark', type: 'support', learnCost: 250,
        tiers: [
            { name: 'Shadow Shroud', cost: 45, effect: { type: 'buff_shroud', duration: 3 }, description: "Increase dodge and critical chance by 50% for 3 turns.", upgradeCost: 2500, upgradeEssences: { 'void_essence': 8 } },
            { name: 'Blessing of Voidwalker', cost: 75, effect: { type: 'buff_voidwalker', duration: 3 }, description: "Grants Shadow Shroud, +50% critical damage, and guaranteed fleeing." }
        ]
    },
    // Healing
    'healing_st': {
        element: 'healing', type: 'st', learnCost: 250,
        tiers: [
            { name: 'Heal', cost: 30, damage: [1, 8], cap: 3, upgradeCost: 750, upgradeEssences: { 'light_essence': 5 }, description: "A simple prayer that mends minor wounds and restores vitality." },
            { name: 'Greater Heal', cost: 52, damage: [2, 8], cap: 5, upgradeCost: 3000, upgradeEssences: { 'light_essence': 10 }, description: "Channel a more powerful divine energy to mend significant injuries." },
            { name: 'Ichor\'s Blood', cost: 75, damage: [3, 8], cap: 8, description: "Invoke the restorative blood of the gods themselves to perform a miraculous, life-saving healing." }
        ]
    },
};

const MONSTER_SPECIES = {
    // Tier 1
    'goblin': { key: 'goblin', name: 'Goblin', class: 'Humanoid', tier: 1, base_hp: 20, base_strength: 3, base_defense: 0, base_xp: 25, base_gold: 15, spell_resistance: 0.05, loot_table: {'health_potion': 0.1, 'goblin_ear': 0.5, 'dagger': 0.1, 'rusty_sword': 0.15, 'wooden_shield': 0.05, 'wooden_wand': 0.02} },
    'rabid_rabbit': { key: 'rabid_rabbit', name: 'Rabid Rabbit', class: 'Beast', tier: 1, base_hp: 25, base_strength: 2, base_defense: 1, base_xp: 25, base_gold: 8, spell_resistance: 0, loot_table: {'rabbit_meat': 0.6} },
    'slime': { key: 'slime', name: 'Slime', class: 'Monstrosity', tier: 1, base_hp: 28, base_strength: 2, base_defense: 2, base_xp: 22, base_gold: 10, spell_resistance: 0.1, loot_table: {'slime_glob': 0.5} },
    'skeleton': { key: 'skeleton', name: 'Skeleton', class: 'Undead', tier: 1, base_hp: 18, base_strength: 3, base_defense: 2, base_xp: 20, base_gold: 10, spell_resistance: 0.1, loot_table: {'rusty_sword': 0.1, 'dagger': 0.05, 'wooden_shield': 0.05, 'iron_buckler': 0.03, 'cracked_orb': 0.02} },
    
    // Tier 2
    'bandit': { key: 'bandit', name: 'Bandit', class: 'Humanoid', tier: 2, base_hp: 45, base_strength: 8, base_defense: 3, base_xp: 50, base_gold: 30, spell_resistance: 0.05, loot_table: {'health_potion': 0.25, 'dagger': 0.15, 'rusty_sword': 0.1, 'steel_longsword': 0.05, 'iron_kite_shield': 0.05, 'iron_buckler': 0.05, 'padded_leather': 0.08, 'silenced_leather_armor': 0.02, 'hardwood_staff': 0.02} },
    'dire_wolf': { key: 'dire_wolf', name: 'Dire Wolf', class: 'Beast', tier: 2, base_hp: 60, base_strength: 6, base_defense: 2, base_xp: 40, base_gold: 15, spell_resistance: 0, loot_table: {'health_potion': 0.15, 'wolf_pelt': 0.4} },
    'giant_rat': { key: 'giant_rat', name: 'Giant Rat', class: 'Monstrosity', tier: 2, base_hp: 40, base_strength: 5, base_defense: 1, base_xp: 35, base_gold: 10, spell_resistance: 0, loot_table: {'rat_tail': 0.6} },
    'armored_zombie': { key: 'armored_zombie', name: 'Armored Zombie', class: 'Undead', tier: 2, base_hp: 50, base_strength: 7, base_defense: 5, base_xp: 45, base_gold: 20, spell_resistance: 0.15, loot_table: {'dagger': 0.05, 'steel_longsword': 0.08, 'heavy_greatsword': 0.03, 'iron_kite_shield': 0.05, 'brass_shield': 0.03, 'padded_leather': 0.05, 'chainmail_armor': 0.03, 'magical_orb': 0.02} },
    
    // Tier 3
    'orc_berserker': { key: 'orc_berserker', name: 'Orc Berserker', class: 'Humanoid', tier: 3, ability: 'enrage', base_hp: 70, base_strength: 12, base_defense: 4, base_xp: 80, base_gold: 40, spell_resistance: 0.1, loot_table: {'health_potion': 0.3, 'steel_longsword': 0.1, 'heavy_greatsword': 0.08, 'obsidian_axe': 0.05, 'sunderers_battleaxe': 0.02, 'orc_liver': 0.3, 'brass_shield': 0.05, 'titanium_parrying_shield': 0.02, 'chainmail_armor': 0.05, 'half_plate_armor': 0.02, 'cypresswood_staff': 0.02, 'dual_longswords': 0.02} },
    'cave_spider': { key: 'cave_spider', name: 'Cave Spider', class: 'Beast', tier: 3, ability: 'poison_web', base_hp: 90, base_strength: 9, base_defense: 3, base_xp: 75, base_gold: 30, spell_resistance: 0, loot_table: {'spider_venom': 0.5, 'eye_of_medusa': 0.01} },
    'cockatrice': { key: 'cockatrice', name: 'Cockatrice', class: 'Monstrosity', tier: 3, ability: 'petrification', base_hp: 80, base_strength: 10, base_defense: 5, base_xp: 90, base_gold: 50, spell_resistance: 0.2, loot_table: {'cockatrice_venom_gland': 0.4, 'eye_of_medusa': 0.02, 'arcane_focus': 0.02} },
    'necromancer': { key: 'necromancer', name: 'Necromancer', class: 'Undead', tier: 3, ability: 'necromancy', base_hp: 60, base_strength: 8, base_defense: 2, base_xp: 100, base_gold: 60, spell_resistance: 0.3, loot_table: {'mana_potion': 0.2, 'vampiric_dagger': 0.02, 'assassin_cloak_armor': 0.02, 'staff_of_loss': 0.02, 'archmages_robes': 0.01, 'souldrinker_orb': 0.01} },
    
    // Tier 4 - REBALANCED REWARDS
    'one_eyed_troll': { key: 'one_eyed_troll', name: 'One-Eyed Troll', class: 'Humanoid', tier: 4, ability: 'ultra_focus', base_hp: 150, base_strength: 20, base_defense: 8, base_xp: 350, base_gold: 175, spell_resistance: 0.1, loot_table: {'superior_health_potion': 0.2, 'obsidian_axe': 0.08, 'sunderers_battleaxe': 0.04, 'heavy_slabshield': 0.03, 'steel_plate_armor': 0.03, 'staff_of_the_magi': 0.01, 'trollblood_shield': 0.03} },
    'unicorn': { key: 'unicorn', name: 'Unicorn', class: 'Beast', tier: 4, ability: 'healing', base_hp: 170, base_strength: 15, base_defense: 5, base_xp: 320, base_gold: 160, spell_resistance: 0.25, loot_table: {'unicorn_horn_fragment': 0.5, 'golden_greatbow': 0.05, 'obsidian_lamina': 0.02, 'purifying_crystal_shield': 0.02} },
    'chimera': { key: 'chimera', name: 'Chimera', class: 'Monstrosity', tier: 4, ability: 'true_poison', base_hp: 160, base_strength: 18, base_defense: 10, base_xp: 400, base_gold: 200, spell_resistance: 0.15, loot_table: {'golden_greatbow': 0.03, 'eye_of_medusa': 0.03, 'crystal_ball': 0.01, 'spellblade_of_echoes': 0.03} },
    'living_armor': { key: 'living_armor', name: 'Living Armor', class: 'Undead', tier: 4, ability: 'living_shield', base_hp: 120, base_strength: 17, base_defense: 15, base_xp: 380, base_gold: 190, spell_resistance: 0.5, loot_table: {'obsidian_axe': 0.05, 'masterwork_spear': 0.08, 'flaming_sword': 0.03, 'tower_greatshield': 0.05, 'exa_reflector': 0.01, 'soul_armor_shard': 0.1, 'steel_plate_armor': 0.05, 'adamantine_armor': 0.01, 'bloodwood_scepter': 0.01, 'spiked_retaliator': 0.02, 'mirror_mail': 0.01} },
    
    // Tier 5 - REBALANCED REWARDS
    'mountain_goliath': { key: 'mountain_goliath', name: 'Mountain Goliath', class: 'Humanoid', tier: 5, ability: 'earthshaker', base_hp: 300, base_strength: 28, base_defense: 12, base_xp: 1200, base_gold: 600, spell_resistance: 0.15, loot_table: {'sunderers_battleaxe': 0.05, 'earthshaker_hammer': 0.01, 'heavy_slabshield': 0.02, 'mountain_rock': 0.1} },
    'livyatan': { key: 'livyatan', name: 'Livyatan', class: 'Beast', tier: 5, ability: 'swallow', base_hp: 400, base_strength: 22, base_defense: 10, base_xp: 1100, base_gold: 550, spell_resistance: 0.1, loot_table: {'vacuum_greatbow': 0.01, 'lightning_javelin': 0.05, 'vacuum_lining': 0.2} },
    'dragon': { key: 'dragon', name: 'Dragon', class: 'Monstrosity', tier: 5, ability: 'scorch_earth', base_hp: 350, base_strength: 25, base_defense: 18, base_xp: 1500, base_gold: 750, spell_resistance: 0.2, loot_table: {'dragon_scale': 0.5, 'flaming_sword': 0.05, 'dragon_scale_cragblade': 0.01, 'dragon_heart_item': 0.1} },
    'dullahan': { key: 'dullahan', name: 'Dullahan', class: 'Undead', tier: 5, ability: 'alive_again', base_hp: 250, base_strength: 26, base_defense: 14, base_xp: 1350, base_gold: 700, spell_resistance: 0.25, loot_table: {'flaming_sword': 0.03, 'vampiric_dagger': 0.04, 'obsidian_lamina': 0.03, 'void_greatsword': 0.01, 'adamantine_armor': 0.02, 'void_heart': 0.1} }
};

const MONSTER_RARITY = {
    'common': {name: 'Common', multiplier: 1.0, rewardMultiplier: 1.0, rarityIndex: 1},
    'uncommon': {name: 'Uncommon', multiplier: 1.2, rewardMultiplier: 1.5, rarityIndex: 2},
    'rare': {name: 'Rare', multiplier: 1.5, rewardMultiplier: 2, rarityIndex: 3},
    'epic': {name: 'Epic', multiplier: 2.0, rewardMultiplier: 3.5, rarityIndex: 4},
    'legendary': {name: 'Legendary', multiplier: 2.5, rewardMultiplier: 5, rarityIndex: 5}
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
        'collect_longswords': { tier: 2, title: 'Blacksmith\'s Order', type: 'collection', target: 'steel_longsword', required: 5, reward: { xp: 200, gold: 300 }, description: 'The blacksmith needs a couple of standard longswords for a trade caravan.' },
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
    'Weapons': ['rusty_sword', 'wooden_stick'],
    'Gear': ['travelers_garb', 'leather_armor', 'padded_leather', 'wooden_shield']
};

const MAGIC_SHOP_INVENTORY = {
    'Catalysts': ['wooden_wand', 'cracked_orb', 'hardwood_staff', 'magical_orb', 'arcane_focus', 'cypresswood_staff', 'staff_of_loss']
};

const BLACKSMITH_INVENTORY = {
    'Weapons': ['steel_longsword', 'rapier', 'longbow', 'heavy_greatsword', 'masterwork_spear', 'dual_longswords', 'elven_saber', 'dwarven_warhammer'],
    'Armor': ['chainmail_armor', 'half_plate_armor', 'steel_plate_armor'],
    'Shields': ['iron_kite_shield', 'iron_buckler', 'brass_shield', 'trollblood_shield', 'titanium_parrying_shield', 'maxwellian_dueling_shield', 'tower_greatshield']
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
};

const BLACKSMITH_RECIPES = {
    'craft_earthshaker': { output: 'earthshaker_hammer', ingredients: { 'mountain_rock': 2 }, cost: 5000 },
    'brew_purifying_shield': { output: 'purifying_crystal_shield', ingredients: { 'unicorn_horn_fragment': 5 }, cost: 1500 },
    'brew_exa_reflector': { output: 'exa_reflector', ingredients: { 'soul_armor_shard': 1 }, cost: 2500 },
    'craft_soul_steel': { output: 'soul_steel_armor', ingredients: { 'soul_armor_shard': 5, 'adamantine_armor': 1 }, cost: 5000},
    'craft_vacuum_encaser': { output: 'vacuum_encaser', ingredients: { 'vacuum_lining': 3 }, cost: 3000}
};

const MAGIC_SHOP_RECIPES = {
    'craft_mountain_carver': { output: 'mountain_carver', ingredients: { 'mountain_rock': 1 }, cost: 6000 },
    'craft_deep_sea_staff': { output: 'deep_sea_staff', ingredients: { 'vacuum_lining': 1 }, cost: 6000 },
    'craft_dragons_heart': { output: 'dragons_heart', ingredients: { 'dragon_heart_item': 1 }, cost: 7500 },
    'craft_blackshadow_staff': { output: 'blackshadow_staff', ingredients: { 'void_heart': 1 }, cost: 9000 }
};

const ENCHANTING_COSTS = {
    'Broken': { essence: 1, gold: 50 },
    'Common': { essence: 5, gold: 250 },
    'Uncommon': { essence: 10, gold: 500 },
    'Rare': { essence: 15, gold: 1500 },
    'Epic': { essence: 20, gold: 5000 },
    'Legendary': { essence: 30, gold: 10000 }
};

const CHANGELOG_DATA = [
    {
        version: "v0.3 - Magic and Elements",
        date: "2025-09-28",
        changes: [
            "<strong>0.3.1</strong> - Implemented the foundational Elemental System, preparing the game for deeper magical combat.",
            "<strong>0.3.2</strong> - Implemented Magic and Spell Overhaul. Adding Spell Upgrade System, Elemental Spells, and Support Spells."
        ]
    },
    {
        version: "v0.2 - Battle Overhaul",
        date: "2025-09-27",
        changes: [
            "<strong>0.2.1</strong> - Conducted a major battle overhaul, reworking monster stats, equipment, and biome encounters.",
            "<strong>0.2.2</strong> - The Alchemist and Black Market were opened, adding new crafting systems and rare items.",
            "<strong>0.2.4</strong> - Updated the user interface for an improved experience on both PC and mobile.",
            "<strong>0.2.6</strong> - Fixed critical bugs, including save file incompatibility between major versions."
        ]
    },
    {
        version: "v0.1 - Creation",
        date: "2025-09-25",
        changes: [
            "<strong>0.1.1</strong> - Initial game creation and foundation.",
            "<strong>0.1.3</strong> - Implemented the core Town systems, including shops and the Quest Board.",
            "<strong>0.1.7</strong> - Overhauled the save system to support robust Save Keys.",
            "<strong>0.1.8</strong> - Added the endgame 'Legacy Quest' for dedicated players."
        ]
    }
];

