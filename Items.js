const ITEMS = {
    // --- Recipe Scrolls ---
    'recipe_rabbit_roast': { name: 'Recipe: Rabbit Roast', type: 'recipe', price: 100, description: 'A recipe for a simple but effective meal.', recipeType: 'cooking', recipeKey: 'rabbit_roast' },
    'recipe_humming_medley': { name: 'Recipe: Humming Veggie Medley', type: 'recipe', price: 100, description: 'A recipe for a strange, magically-inclined dish.', recipeType: 'cooking', recipeKey: 'humming_medley' },
    'recipe_fortifying_meat_pie': { name: 'Recipe: Fortifying Meat Pie', type: 'recipe', price: 120, description: 'A recipe for a pie that makes you feel tougher.', recipeType: 'cooking', recipeKey: 'fortifying_meat_pie' },
    'recipe_spiced_root_stew': { name: 'Recipe: Spiced Root Stew', type: 'recipe', price: 120, description: 'A recipe for a stew that expands one\'s mana reserves.', recipeType: 'cooking', recipeKey: 'spiced_root_stew' },
    'recipe_hunters_lunch': { name: 'Recipe: Hunter\'s Lunch', type: 'recipe', price: 150, description: 'A recipe for a meal that sharpens the eyes.', recipeType: 'cooking', recipeKey: 'hunters_lunch' },
    'recipe_travelers_skewer': { name: 'Recipe: Traveler\'s Skewer', type: 'recipe', price: 150, description: 'A recipe for a meal that quickens the step.', recipeType: 'cooking', recipeKey: 'travelers_skewer' },
    'recipe_sages_loaf': { name: 'Recipe: Sage\'s Loaf', type: 'recipe', price: 200, description: 'A recipe for bread that enhances learning.', recipeType: 'cooking', recipeKey: 'sages_loaf' },
    'recipe_hearty_grain_stew': { name: 'Recipe: Hearty Grain Stew', type: 'recipe', price: 200, description: 'A recipe for a powerfully restorative stew.', recipeType: 'cooking', recipeKey: 'hearty_grain_stew' },
    'recipe_clarifying_broth': { name: 'Recipe: Clarifying Broth', type: 'recipe', price: 200, description: 'A recipe for a broth that refills arcane energy.', recipeType: 'cooking', recipeKey: 'clarifying_broth' },
    'recipe_spiced_wolf_steak': { name: 'Recipe: Spiced Wolf Steak', type: 'recipe', price: 300, description: 'A recipe for a steak that brings out primal power.', recipeType: 'cooking', recipeKey: 'spiced_wolf_steak' },
    'recipe_arcane_fruit_tart': { name: 'Recipe: Arcane Fruit Tart', type: 'recipe', price: 300, description: 'A recipe for a tart that enhances magical properties.', recipeType: 'cooking', recipeKey: 'arcane_fruit_tart' },
    'recipe_loaded_tater': { name: 'Recipe: Loaded Tater', type: 'recipe', price: 350, description: 'A recipe for a massive, durable meal.', recipeType: 'cooking', recipeKey: 'loaded_tater' },
    'recipe_calming_tea_ceremony': { name: 'Recipe: Calming Tea Ceremony', type: 'recipe', price: 350, description: 'A recipe for a tea that expands spiritual capacity.', recipeType: 'cooking', recipeKey: 'calming_tea_ceremony' },
    'recipe_lucky_greens_salad': { name: 'Recipe: Lucky Greens Salad', type: 'recipe', price: 400, description: 'A recipe for a salad that just feels lucky.', recipeType: 'cooking', recipeKey: 'lucky_greens_salad' },
    'recipe_fiery_meat_platter': { name: 'Recipe: Fiery Meat Platter', type: 'recipe', price: 400, description: 'A recipe for a platter that makes you want to run.', recipeType: 'cooking', recipeKey: 'fiery_meat_platter' },
    'recipe_focusing_stir_fry': { name: 'Recipe: Focusing Stir-fry', type: 'recipe', price: 500, description: 'A recipe for a stir-fry that sharpens the mind.', recipeType: 'cooking', recipeKey: 'focusing_stir_fry' },
    'recipe_restorative_bird_soup': { name: 'Recipe: Restorative Bird Soup', type: 'recipe', price: 500, description: 'A recipe for the ultimate comfort food.', recipeType: 'cooking', recipeKey: 'restorative_bird_soup' },
    'recipe_salty_seafood_stew': { name: 'Recipe: Salty Seafood Stew', type: 'recipe', price: 500, description: 'A recipe for a stew that tastes of the sea.', recipeType: 'cooking', recipeKey: 'salty_seafood_stew' },
    'recipe_steak_of_divine_power': { name: 'Recipe: Steak of Divine Power', type: 'recipe', price: 1000, description: 'A recipe for a meal granting immense might.', recipeType: 'cooking', recipeKey: 'steak_of_divine_power' },
    'recipe_crystalline_energy_tart': { name: 'Recipe: Crystalline Energy Tart', type: 'recipe', price: 1000, description: 'A recipe for a tart humming with raw power.', recipeType: 'cooking', recipeKey: 'crystalline_energy_tart' },
    'recipe_livyatans_grand_steak': { name: 'Recipe: Livyatan\'s Grand Steak', type: 'recipe', price: 1200, description: 'A recipe for a meal granting colossal vitality.', recipeType: 'cooking', recipeKey: 'livyatans_grand_steak' },
    'recipe_nectar_of_the_soul': { name: 'Recipe: Nectar of the Soul', type: 'recipe', price: 1200, description: 'A recipe that deepens the spiritual reservoir.', recipeType: 'cooking', recipeKey: 'nectar_of_the_soul' },
    'recipe_feast_of_fortune': { name: 'Recipe: Feast of Fortune', type: 'recipe', price: 1500, description: 'A recipe for a platter that attracts immense fortune.', recipeType: 'cooking', recipeKey: 'feast_of_fortune' },
    'recipe_alacrity_sorbet': { name: 'Recipe: Alacrity Sorbet', type: 'recipe', price: 1500, description: 'A recipe for a sorbet that infuses unnatural speed.', recipeType: 'cooking', recipeKey: 'alacrity_sorbet' },
    'recipe_mindfire_curry': { name: 'Recipe: Mindfire Curry', type: 'recipe', price: 2000, description: 'A recipe for a curry that enhances learning.', recipeType: 'cooking', recipeKey: 'mindfire_curry' },
    'recipe_phoenix_down_roast': { name: 'Recipe: Phoenix Down Roast', type: 'recipe', price: 2000, description: 'A recipe for a meal that can bring one back from the brink.', recipeType: 'cooking', recipeKey: 'phoenix_down_roast' },
    'recipe_abyssal_ambrosia': { name: 'Recipe: Abyssal Ambrosia', type: 'recipe', price: 2000, description: 'A recipe that restores the deepest wells of magic.', recipeType: 'cooking', recipeKey: 'abyssal_ambrosia' },
    'recipe_brew_health_potion_home': { name: 'Alchemical Recipe: Health Potion', type: 'recipe', price: 150, description: 'A recipe for a basic healing draught.', recipeType: 'alchemy', recipeKey: 'brew_health_potion_home' },
    'recipe_brew_mana_potion_home': { name: 'Alchemical Recipe: Mana Potion', type: 'recipe', price: 150, description: 'A recipe for a basic mana restorative.', recipeType: 'alchemy', recipeKey: 'brew_mana_potion_home' },
    'recipe_brew_cinderstop': { name: 'Alchemical Recipe: Cinderstop Potion', type: 'recipe', price: 200, description: 'A recipe for a fire resistance potion.', recipeType: 'alchemy', recipeKey: 'brew_cinderstop' },
    'recipe_brew_dampclear': { name: 'Alchemical Recipe: Dampclear Potion', type: 'recipe', price: 200, description: 'A recipe for a water resistance potion.', recipeType: 'alchemy', recipeKey: 'brew_dampclear' },
    'recipe_brew_windwail': { name: 'Alchemical Recipe: Windwail Potion', type: 'recipe', price: 200, description: 'A recipe for a wind resistance potion.', recipeType: 'alchemy', recipeKey: 'brew_windwail' },
    'recipe_brew_rockshut': { name: 'Alchemical Recipe: Rockshut Potion', type: 'recipe', price: 200, description: 'A recipe for an earth resistance potion.', recipeType: 'alchemy', recipeKey: 'brew_rockshut' },
    'recipe_brew_zapsipper': { name: 'Alchemical Recipe: Zapsipper Potion', type: 'recipe', price: 200, description: 'A recipe for a lightning resistance potion.', recipeType: 'alchemy', recipeKey: 'brew_zapsipper' },
    'recipe_brew_vinekill': { name: 'Alchemical Recipe: Vinekill Potion', type: 'recipe', price: 200, description: 'A recipe for a nature resistance potion.', recipeType: 'alchemy', recipeKey: 'brew_vinekill' },
    'recipe_brew_lightcloser': { name: 'Alchemical Recipe: Lightcloser Potion', type: 'recipe', price: 200, description: 'A recipe for a light resistance potion.', recipeType: 'alchemy', recipeKey: 'brew_lightcloser' },
    'recipe_brew_lampside': { name: 'Alchemical Recipe: Lampside Potion', type: 'recipe', price: 200, description: 'A recipe for a void resistance potion.', recipeType: 'alchemy', recipeKey: 'brew_lampside' },
    'recipe_brew_condensed_health_potion_home': { name: 'Alchemical Recipe: Condensed Health Potion', type: 'recipe', price: 400, description: 'A recipe for a stronger healing draught.', recipeType: 'alchemy', recipeKey: 'brew_condensed_health_potion_home' },
    'recipe_brew_condensed_mana_potion_home': { name: 'Alchemical Recipe: Condensed Mana Potion', type: 'recipe', price: 400, description: 'A recipe for a stronger mana restorative.', recipeType: 'alchemy', recipeKey: 'brew_condensed_mana_potion_home' },
    'recipe_brew_hearthstall': { name: 'Alchemical Recipe: Hearthstall Potion', type: 'recipe', price: 600, description: 'A recipe for an improved fire resistance potion.', recipeType: 'alchemy', recipeKey: 'brew_hearthstall' },
    'recipe_brew_waterdam': { name: 'Alchemical Recipe: Waterdam Potion', type: 'recipe', price: 600, description: 'A recipe for an improved water resistance potion.', recipeType: 'alchemy', recipeKey: 'brew_waterdam' },
    'recipe_brew_gustshield': { name: 'Alchemical Recipe: Gustshield Potion', type: 'recipe', price: 600, description: 'A recipe for an improved wind resistance potion.', recipeType: 'alchemy', recipeKey: 'brew_gustshield' },
    'recipe_brew_quakestable': { name: 'Alchemical Recipe: Quakestable Potion', type: 'recipe', price: 600, description: 'A recipe for an improved earth resistance potion.', recipeType: 'alchemy', recipeKey: 'brew_quakestable' },
    'recipe_brew_strikestop': { name: 'Alchemical Recipe: Strikestop Potion', type: 'recipe', price: 600, description: 'A recipe for an improved lightning resistance potion.', recipeType: 'alchemy', recipeKey: 'brew_strikestop' },
    'recipe_brew_growthstall': { name: 'Alchemical Recipe: Growthstall Potion', type: 'recipe', price: 600, description: 'A recipe for an improved nature resistance potion.', recipeType: 'alchemy', recipeKey: 'brew_growthstall' },
    'recipe_brew_sundown': { name: 'Alchemical Recipe: Sundown Potion', type: 'recipe', price: 600, description: 'A recipe for an improved light resistance potion.', recipeType: 'alchemy', recipeKey: 'brew_sundown' },
    'recipe_brew_sunrise': { name: 'Alchemical Recipe: Sunrise Potion', type: 'recipe', price: 600, description: 'A recipe for an improved void resistance potion.', recipeType: 'alchemy', recipeKey: 'brew_sunrise' },
    'recipe_brew_superior_health_potion_home': { name: 'Alchemical Recipe: Superior Health Potion', type: 'recipe', price: 1200, description: 'A recipe for a superior healing draught.', recipeType: 'alchemy', recipeKey: 'brew_superior_health_potion_home' },
    'recipe_brew_superior_mana_potion_home': { name: 'Alchemical Recipe: Superior Mana Potion', type: 'recipe', price: 1200, description: 'A recipe for a superior mana restorative.', recipeType: 'alchemy', recipeKey: 'brew_superior_mana_potion_home' },
    'recipe_brew_blazeback': { name: 'Alchemical Recipe: Blazeback Potion', type: 'recipe', price: 2000, description: 'A recipe for a masterwork fire resistance potion.', recipeType: 'alchemy', recipeKey: 'brew_blazeback' },
    'recipe_brew_floodwall': { name: 'Alchemical Recipe: Floodwall Potion', type: 'recipe', price: 2000, description: 'A recipe for a masterwork water resistance potion.', recipeType: 'alchemy', recipeKey: 'brew_floodwall' },
    'recipe_brew_stormsapper': { name: 'Alchemical Recipe: Stormsapper Potion', type: 'recipe', price: 2000, description: 'A recipe for a masterwork wind resistance potion.', recipeType: 'alchemy', recipeKey: 'brew_stormsapper' },
    'recipe_brew_fissurewalker': { name: 'Alchemical Recipe: Fissurewalker Potion', type: 'recipe', price: 2000, description: 'A recipe for a masterwork earth resistance potion.', recipeType: 'alchemy', recipeKey: 'brew_fissurewalker' },
    'recipe_brew_thunderground': { name: 'Alchemical Recipe: Thunderground Potion', type: 'recipe', price: 2000, description: 'A recipe for a masterwork lightning resistance potion.', recipeType: 'alchemy', recipeKey: 'brew_thunderground' },
    'recipe_brew_jungleward': { name: 'Alchemical Recipe: Jungleward Potion', type: 'recipe', price: 2000, description: 'A recipe for a masterwork nature resistance potion.', recipeType: 'alchemy', recipeKey: 'brew_jungleward' },
    'recipe_brew_smitestopper': { name: 'Alchemical Recipe: Smitestopper Potion', type: 'recipe', price: 2000, description: 'A recipe for a masterwork light resistance potion.', recipeType: 'alchemy', recipeKey: 'brew_smitestopper' },
    'recipe_brew_voidshield': { name: 'Alchemical Recipe: Voidshield Potion', type: 'recipe', price: 2000, description: 'A recipe for a masterwork void resistance potion.', recipeType: 'alchemy', recipeKey: 'brew_voidshield' },

     // --- Potions & Consumables ---
    'health_potion': {name: 'Health Potion', type: 'healing', amount: 20, price: 30, description: "A simple vial that restores a small amount of health.", alchemyType: 'base_potion'},
    'condensed_health_potion': {name: 'Condensed Health Potion', type: 'healing', amount: 50, price: 75, description: "A heavy, concentrated mixture of refined herbs and purified mountain water. This potion is thicker and more potent than its normal counterpart, designed to provide substantial, immediate relief.", alchemyType: 'base_potion'},
    'superior_health_potion': {name: 'Superior Health Potion', type: 'healing', amount: 100, price: 200, description: "A potent draught that restores a moderate amount of health."},
    'mana_potion': {name: 'Mana Potion', type: 'mana_restore', amount: 50, price: 40, description: "A swirling blue liquid that restores magical energy.", alchemyType: 'base_potion'},
    'condensed_mana_potion': {name: 'Condensed Mana Potion', type: 'mana_restore', amount: 100, price: 100, description: "An oxidized flask containing a potent brew of crushed celestial beetles and distilled shadow essence. It provides a sharp, invigorating shock to the mind, clearing the fog of battle-weariness.", alchemyType: 'base_potion'},
    'superior_mana_potion': {name: 'Superior Mana Potion', type: 'mana_restore', amount: 150, price: 250, description: "A masterwork of alchemy. The shimmering liquid is pure, crystallized Arcane Energy, providing not just mana, but a momentary conduit to the raw source of magic itself."},

    'cleansing_potion': { name: 'Cleansing Potion', type: 'cleanse', price: 250, description: 'Removes all negative status effects.' },

    // Elemental Resistance Potions (Tier 1)
    'cinderstop_potion': { name: 'Cinderstop Potion', type: 'buff', price: 100, description: 'Grants 5% Fire resistance for 10 turns.', effect: { type: 'resist_fire', multiplier: 0.95, duration: 10 }, alchemyType: 'base_potion' },
    'dampclear_potion': { name: 'Dampclear Potion', type: 'buff', price: 100, description: 'Grants 5% Water resistance for 10 turns.', effect: { type: 'resist_water', multiplier: 0.95, duration: 10 }, alchemyType: 'base_potion' },
    'windwail_potion': { name: 'Windwail Potion', type: 'buff', price: 100, description: 'Grants 5% Wind resistance for 10 turns.', effect: { type: 'resist_wind', multiplier: 0.95, duration: 10 }, alchemyType: 'base_potion' },
    'rockshut_potion': { name: 'Rockshut Potion', type: 'buff', price: 100, description: 'Grants 5% Earth resistance for 10 turns.', effect: { type: 'resist_earth', multiplier: 0.95, duration: 10 }, alchemyType: 'base_potion' },
    'zapsipper_potion': { name: 'Zapsipper Potion', type: 'buff', price: 100, description: 'Grants 5% Lightning resistance for 10 turns.', effect: { type: 'resist_lightning', multiplier: 0.95, duration: 10 }, alchemyType: 'base_potion' },
    'vinekill_potion': { name: 'Vinekill Potion', type: 'buff', price: 100, description: 'Grants 5% Nature resistance for 10 turns.', effect: { type: 'resist_nature', multiplier: 0.95, duration: 10 }, alchemyType: 'base_potion' },
    'lightcloser_potion': { name: 'Lightcloser Potion', type: 'buff', price: 100, description: 'Grants 5% Light resistance for 10 turns.', effect: { type: 'resist_light', multiplier: 0.95, duration: 10 }, alchemyType: 'base_potion' },
    'lampside_potion': { name: 'Lampside Potion', type: 'buff', price: 100, description: 'Grants 5% Void resistance for 10 turns.', effect: { type: 'resist_void', multiplier: 0.95, duration: 10 }, alchemyType: 'base_potion' },
    // Tier 2
    'hearthstall_potion': { name: 'Hearthstall Potion', type: 'buff', price: 300, description: 'Grants 10% Fire resistance for 10 turns.', effect: { type: 'resist_fire', multiplier: 0.90, duration: 10 }, alchemyType: 'base_potion' },
    'waterdam_potion': { name: 'Waterdam Potion', type: 'buff', price: 300, description: 'Grants 10% Water resistance for 10 turns.', effect: { type: 'resist_water', multiplier: 0.90, duration: 10 }, alchemyType: 'base_potion' },
    'gustshield_potion': { name: 'Gustshield Potion', type: 'buff', price: 300, description: 'Grants 10% Wind resistance for 10 turns.', effect: { type: 'resist_wind', multiplier: 0.90, duration: 10 }, alchemyType: 'base_potion' },
    'quakestable_potion': { name: 'Quakestable Potion', type: 'buff', price: 300, description: 'Grants 10% Earth resistance for 10 turns.', effect: { type: 'resist_earth', multiplier: 0.90, duration: 10 }, alchemyType: 'base_potion' },
    'strikestop_potion': { name: 'Strikestop Potion', type: 'buff', price: 300, description: 'Grants 10% Lightning resistance for 10 turns.', effect: { type: 'resist_lightning', multiplier: 0.90, duration: 10 }, alchemyType: 'base_potion' },
    'growthstall_potion': { name: 'Growthstall Potion', type: 'buff', price: 300, description: 'Grants 10% Nature resistance for 10 turns.', effect: { type: 'resist_nature', multiplier: 0.90, duration: 10 }, alchemyType: 'base_potion' },
    'sundown_potion': { name: 'Sundown Potion', type: 'buff', price: 300, description: 'Grants 10% Light resistance for 10 turns.', effect: { type: 'resist_light', multiplier: 0.90, duration: 10 }, alchemyType: 'base_potion' },
    'sunrise_potion': { name: 'Sunrise Potion', type: 'buff', price: 300, description: 'Grants 10% Void resistance for 10 turns.', effect: { type: 'resist_void', multiplier: 0.90, duration: 10 }, alchemyType: 'base_potion' },
    // Tier 3
    'blazeback_potion': { name: 'Blazeback Potion', type: 'buff', price: 800, description: 'Grants 20% Fire resistance for 10 turns.', effect: { type: 'resist_fire', multiplier: 0.80, duration: 10 } },
    'floodwall_potion': { name: 'Floodwall Potion', type: 'buff', price: 800, description: 'Grants 20% Water resistance for 10 turns.', effect: { type: 'resist_water', multiplier: 0.80, duration: 10 } },
    'stormsapper_potion': { name: 'Stormsapper Potion', type: 'buff', price: 800, description: 'Grants 20% Wind resistance for 10 turns.', effect: { type: 'resist_wind', multiplier: 0.80, duration: 10 } },
    'fissurewalker_potion': { name: 'Fissurewalker Potion', type: 'buff', price: 800, description: 'Grants 20% Earth resistance for 10 turns.', effect: { type: 'resist_earth', multiplier: 0.80, duration: 10 } },
    'thunderground_potion': { name: 'Thunderground Potion', type: 'buff', price: 800, description: 'Grants 20% Lightning resistance for 10 turns.', effect: { type: 'resist_lightning', multiplier: 0.80, duration: 10 } },
    'jungleward_potion': { name: 'Jungleward Potion', type: 'buff', price: 800, description: 'Grants 20% Nature resistance for 10 turns.', effect: { type: 'resist_nature', multiplier: 0.80, duration: 10 } },
    'smitestopper_potion': { name: 'Smitestopper Potion', type: 'buff', price: 800, description: 'Grants 20% Light resistance for 10 turns.', effect: { type: 'resist_light', multiplier: 0.80, duration: 10 } },
    'voidshield_potion': { name: 'Voidshield Potion', type: 'buff', price: 800, description: 'Grants 20% Void resistance for 10 turns.', effect: { type: 'resist_void', multiplier: 0.80, duration: 10 } },

    // Experimental Potions
    'mysterious_concoction_t1': { name: 'Mysterious Concoction (Tier 1)', type: 'experimental', tier: 1, price: 10, description: 'An unpredictable brew. Who knows what it does? Drink up and find out.' },
    'mysterious_concoction_t2': { name: 'Mysterious Concoction (Tier 2)', type: 'experimental', tier: 2, price: 50, description: 'A complex and unstable mixture. Potentially powerful, potentially poisonous.' },
    'mysterious_concoction_t3': { name: 'Mysterious Concoction (Tier 3)', type: 'experimental', tier: 3, price: 150, description: 'This barely-contained liquid chaos could change your fate... or just give you a stomach ache.' },

    // Tools And Consumables
    'whetstone': { name: 'Whetstone', type: 'buff', price: 100, rarity: 'Common', description: "For the next 3 turns, increase your weapon's damage die by one step (max d12) and enables critical hits. For when you need your blade to be extra pointy.", effect: { type: 'buff_whetstone', duration: 4, critEnable: true, diceStepUp: true } },
    'magic_rock_dust': { name: 'Magic Rock Dust', type: 'buff', price: 150, rarity: 'Uncommon', description: "Consume this suspiciously sparkly dust to briefly expand your consciousness. Your next spell will have its damage die increased by one step (max d12) and its range increased by 2.", effect: { type: 'buff_magic_dust', duration: 2, rangeIncrease: 2, diceStepUp: true } },
    'oil_bomb': { name: 'Oil Bomb', type: 'debuff_apply', price: 75, rarity: 'Common', range: 3, description: "Throws a bomb that deals 1 damage and covers the target in a flammable slick. The next Fire damage they receive is doubled. It's step one of a very bad day for them. Range: 3 tiles.", effect: { type: 'debuff_oiled', duration: Infinity, damage: 1, element: 'none' } },
    'viscous_liquid': { name: 'Viscous Liquid', type: 'debuff_apply', price: 75, rarity: 'Common', range: 3, description: "Throws a vial that deals 1 damage. The next effect that applies the 'drenched' status to the target is doubled in both duration and magnitude, ensuring they aren't just soaked, but achieve a new state of sogginess. Range: 3 tiles.", effect: { type: 'debuff_viscous', duration: Infinity, damage: 1, element: 'none' } },
    'pocket_cragblade': { name: 'Pocket Cragblade', type: 'buff', price: 200, rarity: 'Uncommon', description: "Apply this chunky rock to a weapon. Your next attack that deals Earth damage will deal 1.5x damage and is guaranteed to paralyze the target. A good way to hit someone so hard they forget how to move.", effect: { type: 'buff_cragblade', duration: 2, damageMultiplier: 1.5, guaranteeParalyze: true } },
    'artificial_light_stone': { name: 'Artificial Light Stone', type: 'debuff_apply', price: 200, rarity: 'Uncommon', range: 3, description: "Throws a stone that deals 1 damage and primes the target. Your next attack that deals Wind damage to them will deal 1.5x damage and rudely violate their personal space by knocking them back 2 tiles. Range: 3 tiles.", effect: { type: 'debuff_lightstone_primed', duration: Infinity, damageMultiplier: 1.5, knockback: 2, damage: 1, element: 'none' } }, // <-- Single Line Change
    'lightning_rod': { name: 'Lightning Rod', type: 'buff', price: 250, rarity: 'Rare', description: "Attach to a weapon. For the next 3 turns, your attacks are guaranteed to trigger a follow-up strike that deals an additional 25% of the initial damage as Lightning damage to a random enemy within range. Because why should only one person enjoy a sudden, unexpected electrocution?", effect: { type: 'buff_lightning_rod', duration: 4, chainChance: 1.0, chainMultiplier: 0.25 } },
    'fertilized_seed': { name: 'Fertilized Seed', type: 'buff', price: 100, rarity: 'Uncommon', description: "Consume this suspiciously energetic seed. For the next 3 turns, any healing you receive from Nature-based effects is increased by 50%. Tastes like dirt, heals like a hyperactive forest spirit.", effect: { type: 'buff_fertilized', duration: 4, healMultiplier: 1.5 } },
    'natural_antidote': { name: 'Natural Antidote', type: 'cleanse_specific', effects_to_cleanse: ['poison', 'toxic'], price: 120, rarity: 'Common', description: 'A simple herbal remedy that removes all types of poison effects. Tastes like bitter leaves and righteous indignation, but it gets the job done. Stop dying, you\'ve got things to do.' },
    'anti_paralytic_needle': { name: 'Anti-Paralytic Needle', type: 'cleanse_specific', effects_to_cleanse: ['paralyzed', 'petrified'], price: 180, rarity: 'Uncommon', description: 'A sharp needle full of something stimulating. Immediately removes Paralysis and Petrify effects by giving your nervous system a very aggressive pep talk. The sudden jolt is better than coffee.' },
    'poisonous_grease': { name: 'Poisonous Grease', type: 'buff', price: 200, rarity: 'Uncommon', description: 'Smear this foul-smelling gunk on your weapon. For 3 turns, your attacks have a chance to inflict a nasty poison that deals ¼ of your weapon’s average damage for 3 more turns. The gift that keeps on giving... sepsis. (Chance: 20%+Luck%/2)', effect: { type: 'buff_poison_grease', duration: 4, poisonChance: 0.20 } },
    'paralysis_grease': { name: 'Paralysis Grease', type: 'buff', price: 250, rarity: 'Uncommon', description: 'A sticky paste that makes your weapon shockingly effective. For 3 turns, your attacks have a chance to inflict paralysis for 1 turn, causing enemies to suddenly stop and stare blankly into the middle distance. (Chance: 20%+Luck%/2. Stacks with Earth Element effects for extra stillness.)', effect: { type: 'buff_paralysis_grease', duration: 4, paralyzeChance: 0.20 } },


    // --- Ingredients & Materials ---
    // Junk (for selling)
    'goblin_ear': {name: 'Goblin Ear', type: 'junk', price: 5, description: "A grotesque trophy."},
    'wolf_pelt': {name: 'Wolf Pelt', type: 'junk', price: 12, description: "A thick and coarse pelt."},
    'rat_tail': {name: 'Rat Tail', type: 'junk', price: 2, description: "It's... a rat tail."},
    'spider_venom': {name: 'Spider Venom', type: 'junk', price: 10, description: "A vial of potent venom."},
    'dragon_scale': {name: 'Dragon Scale', type: 'junk', price: 50, description: "A shimmering, nigh-indestructible scale."},
    'rock': {name: 'Useless Rock', type: 'junk', price: 0, description: 'It... was probably something more interesting a moment ago.'}, // <-- ADDED Useless Rock

    // Food Ingredients (Generic Types)
    'rabbit_meat': {name: 'Rabbit Meat', type: 'food_ingredient', price: 4, rarity: 'Common', description: "Could make a good stew.", cookingType: 'meat'},
    'wolf_meat': {name: 'Wolf Meat', type: 'food_ingredient', price: 20, rarity: 'Common', description: 'Tough and gamy, but filling.', cookingType: 'meat'},
    'chicken_meat': {name: 'Chicken Meat', type: 'food_ingredient', price: 15, rarity: 'Uncommon', description: 'Surprisingly normal-tasting meat from a cockatrice.', cookingType: 'meat'},
    'horse_meat': {name: 'Horse Meat', type: 'food_ingredient', price: 30, rarity: 'Uncommon', description: 'Meat from a unicorn. Tastes magical and a little sad.', cookingType: 'meat'},
    'whale_meat': {name: 'Whale Meat', type: 'food_ingredient', price: 100, rarity: 'Rare', description: 'A massive cut of blubbery meat from a Livyatan.', cookingType: 'meat'}, // Added cookingType
    'blackwheat': {name: 'Blackwheat', type: 'food_ingredient', price: 45, sellPrice: 45, rarity: 'Common', description: 'A dark, hardy grain.', alchemyType: 'secondary_reagent', cookingType: 'veggie'},
    'cinnamonwood_log': {name: 'Cinnamonwood Log', type: 'food_ingredient', price: 45, sellPrice: 45, rarity: 'Common', description: 'A fragrant log.', alchemyType: 'secondary_reagent', cookingType: 'veggie'},
    'brineflower_leaf': {name: 'Brineflower Leaf', type: 'food_ingredient', price: 300, sellPrice: 300, rarity: 'Uncommon', description: 'A salty leaf.', alchemyType: 'secondary_reagent', cookingType: 'seasoning'},
    'beetsnip_carrot': {name: 'Beetsnip Carrot', type: 'food_ingredient', price: 45, sellPrice: 45, rarity: 'Common', description: 'A sweet and earthy root vegetable.', alchemyType: 'secondary_reagent', cookingType: 'veggie'},
    'sweet_dandelion': {name: 'Sweet Dandelion', type: 'food_ingredient', price: 150, sellPrice: 150, rarity: 'Uncommon', description: 'A tasty, edible flower.', alchemyType: 'primary_reagent', cookingType: 'veggie'},
    'ground_tater': {name: 'Ground Tater', type: 'food_ingredient', price: 150, sellPrice: 150, rarity: 'Uncommon', description: 'A large, starchy potato.', alchemyType: 'primary_reagent', cookingType: 'veggie'},
    'orchidvine_fruit': {name: 'Orchidvine Fruit', type: 'food_ingredient', price: 150, sellPrice: 150, rarity: 'Uncommon', description: 'An exotic and flavorful fruit.', alchemyType: 'primary_reagent', cookingType: 'veggie'},
    'koriandre_sprig': {name: 'Koriandre Sprig', type: 'food_ingredient', price: 150, sellPrice: 150, rarity: 'Uncommon', description: 'A sprig of a strong, pungent herb.', alchemyType: 'secondary_reagent', cookingType: 'seasoning'},
    'jet_pepper': {name: 'Jet Pepper', type: 'food_ingredient', price: 150, sellPrice: 150, rarity: 'Uncommon', description: 'A very spicy pepper.', alchemyType: 'secondary_reagent', cookingType: 'seasoning'},
    'dragon_chili': {name: 'Dragon Chili', type: 'food_ingredient', price: 150, sellPrice: 150, rarity: 'Uncommon', description: 'An excruciatingly hot chili.', alchemyType: 'secondary_reagent', cookingType: 'seasoning'},
    'screaming_lotus': { name: 'Screaming Lotus', type: 'alchemy', price: 45, sellPrice: 45, rarity: 'Common', description: 'A flower that emits a low hum.', alchemyType: 'secondary_reagent', cookingType: 'veggie' },
    'maizemother_cob': {name: 'Maizemother Cob', type: 'food_ingredient', price: 450, sellPrice: 450, rarity: 'Rare', description: 'A massive cob of corn with kernels like jewels.', cookingType: 'veggie'},
    'crystal_apple': {name: 'Crystal Apple', type: 'food_ingredient', price: 750, sellPrice: 750, rarity: 'Rare', description: 'A crisp apple with translucent, crystalline flesh.', alchemyType: 'secondary_reagent'},
    'blood_peach': {name: 'Blood Peach', type: 'food_ingredient', price: 750, sellPrice: 750, rarity: 'Rare', description: 'A juicy peach with deep red flesh that invigorates the body.', alchemyType: 'secondary_reagent'},
    'ice_cherry': {name: 'Ice Cherry', type: 'food_ingredient', price: 750, sellPrice: 750, rarity: 'Rare', description: 'A cherry that is perpetually cold to the touch.', alchemyType: 'secondary_reagent'},
    'wild_wine': {name: 'Wild Wine', type: 'food_ingredient', price: 25, rarity: 'Uncommon', description: 'A rough, potent wine favored by bandits and outlaws.', alchemyType: 'catalyst', cookingType: 'seasoning'}, // Added cookingType


    // Alchemy Ingredients (Specific)
    'chimera_claw': {name: 'Chimera Claw', type: 'alchemy', price: 200, rarity: 'Epic', description: 'A razor-sharp claw from a Chimera, still dripping with poison.'}, // Rarity increased
    'orc_liver': { name: 'Orc Liver', type: 'alchemy', price: 25, rarity: 'Uncommon', description: 'A key ingredient for strength potions.' }, // Added rarity
    'cockatrice_venom_gland': { name: 'Cockatrice Venom Gland', type: 'alchemy', price: 40, rarity: 'Uncommon', description: 'Can be used to create potions that harden the skin.' }, // Added rarity
    'unicorn_horn_fragment': { name: 'Unicorn Horn Fragment', type: 'alchemy', price: 100, rarity: 'Rare', description: 'A shard of a unicorn horn, brimming with purifying magic.' }, // Added rarity
    'slime_glob': { name: 'Slime Glob', type: 'alchemy', price: 8, rarity: 'Common', description: 'A versatile, gelatinous substance.', alchemyType: 'catalyst' },
    'soul_armor_shard': { name: 'Soul Armor Shard', type: 'alchemy', price: 500, rarity: 'Epic', description: 'A fragment of a Living Armor, humming with contained spiritual energy.' }, // Rarity increased
    'vacuum_lining': { name: 'Vacuum Lining', type: 'alchemy', price: 1500, rarity: 'Legendary', description: 'A strange, reality-warping membrane from inside a Livyatan.'}, // Rarity increased
    'mountain_rock': { name: 'Mountain Rock', type: 'alchemy', price: 1000, rarity: 'Legendary', description: 'A chunk of rock humming with the power of a mountain.'}, // Rarity increased
    'dragon_heart_item': { name: 'Dragon Heart', type: 'alchemy', price: 2000, rarity: 'Legendary', description: 'The still-warm heart of a slain dragon.'}, // Rarity increased
    'void_heart': { name: 'Void Heart', type: 'alchemy', price: 2000, rarity: 'Legendary', description: 'A pulsating shard of darkness from a Dullahan.'}, // Rarity increased
    'troll_blood': {name: 'Troll Blood', type: 'alchemy', price: 50, rarity: 'Rare', description: 'Viscous, green blood that slowly regenerates. A powerful alchemical ingredient.', alchemyType: 'catalyst'},
    // Adding remaining specific alchemy ingredients
    'sunshine_flower': {name: 'Sunshine Flower', type: 'alchemy', price: 150, sellPrice: 150, rarity: 'Uncommon', description: 'A flower that radiates warmth.', alchemyType: 'primary_reagent', cookingType: 'seasoning'},
    'sealotus_pad': {name: 'Sealotus Pad', type: 'alchemy', price: 150, sellPrice: 150, rarity: 'Uncommon', description: 'A lily pad with calming properties.', alchemyType: 'primary_reagent', cookingType: 'veggie'},
    'fulgurbloom': {name: 'Fulgurbloom', type: 'alchemy', price: 150, sellPrice: 150, rarity: 'Uncommon', description: 'A flower that crackles with electrical energy.', alchemyType: 'primary_reagent', cookingType: 'seasoning'},
    'lantern_rose': {name: 'Lantern Rose', type: 'alchemy', price: 150, sellPrice: 150, rarity: 'Uncommon', description: 'A rose that gives off a soft, steady light.', alchemyType: 'primary_reagent', cookingType: 'seasoning'},
    'blackleaf': {name: 'Blackleaf', type: 'alchemy', price: 150, sellPrice: 150, rarity: 'Uncommon', description: 'A leaf used in shadowy concoctions.', alchemyType: 'primary_reagent', cookingType: 'seasoning'},
    'exploding_citrus': {name: 'Exploding Citrus', type: 'alchemy', price: 750, sellPrice: 750, rarity: 'Rare', description: 'A citrus fruit that fizzes and pops. Handle with care.', alchemyType: 'secondary_reagent'},

    // --- Special & Crafting Items ---
    'undying_heart': { name: 'Undying Heart', type: 'special', price: 1000, sellPrice: 100, rarity: 'Rare', description: 'A pulsating heart that refuses to stop beating. Used in powerful rituals.' }, // Added sellPrice
    'fire_essence': { name: 'Fire Essence', type: 'enchant', price: 500, sellPrice: 50, rarity: 'Uncommon', description: 'The pure, searing essence of fire.', alchemyType: 'secondary_reagent' }, // Adjusted price, added sellPrice
    'water_essence': { name: 'Water Essence', type: 'enchant', price: 500, sellPrice: 50, rarity: 'Uncommon', description: 'The pure, flowing essence of water.', alchemyType: 'secondary_reagent' }, // Adjusted price, added sellPrice
    'earth_essence': { name: 'Earth Essence', type: 'enchant', price: 500, sellPrice: 50, rarity: 'Uncommon', description: 'The pure, stoic essence of earth.', alchemyType: 'secondary_reagent' }, // Adjusted price, added sellPrice
    'wind_essence': { name: 'Wind Essence', type: 'enchant', price: 500, sellPrice: 50, rarity: 'Uncommon', description: 'The pure, rushing essence of wind.', alchemyType: 'secondary_reagent' }, // Adjusted price, added sellPrice
    'lightning_essence': { name: 'Lightning Essence', type: 'enchant', price: 500, sellPrice: 50, rarity: 'Uncommon', description: 'The pure, crackling essence of lightning.', alchemyType: 'secondary_reagent' }, // Adjusted price, added sellPrice
    'nature_essence': { name: 'Nature Essence', type: 'enchant', price: 500, sellPrice: 50, rarity: 'Uncommon', description: 'The pure, vibrant essence of nature.', alchemyType: 'secondary_reagent' }, // Adjusted price, added sellPrice
    'light_essence': { name: 'Light Essence', type: 'enchant', price: 500, sellPrice: 50, rarity: 'Uncommon', description: 'The pure, radiant essence of light.', alchemyType: 'secondary_reagent' }, // Adjusted price, added sellPrice
    'void_essence': { name: 'Void Essence', type: 'enchant', price: 500, sellPrice: 50, rarity: 'Uncommon', description: 'The pure, silent essence of the void.', alchemyType: 'secondary_reagent' }, // Adjusted price, added sellPrice

    // --- Key Items ---
    'bestiary_notebook': {name: 'Bestiary Notebook', type: 'key', price: 0, description: "A leather-bound book from a nervous researcher named Betty. Used to catalogue monster observations."},
    'blacksmith_key': {name: 'Blacksmith\'s Key', type: 'key', price: 0, description: "A sturdy iron key, smelling faintly of soot and metal. Looks like it unlocks something important in the Commercial District."},
    'tower_key': {name: 'Tower Key', type: 'key', price: 0, description: "An ornate key humming with faint magical energy. Seems attuned to the Arcane Quarter."},

    // --- Gardening Items ---
    // Seeds
    'blackwheat_seed': {name: 'Blackwheat Seed', type: 'seed', price: 15, rarity: 'Common', description: 'A common seed for a hardy grain.'},
    'cinnamonwood_seed': {name: 'Cinnamonwood Seed', type: 'seed', price: 15, rarity: 'Common', description: 'A common seed for a fragrant tree.'},
    'brineflower_seed': { name: 'Brineflower Seed', type: 'seed', price: 100, rarity: 'Uncommon', description: 'An uncommon seed for a salt-tolerant flower.' },
    'beetsnip_seed': {name: 'Beetsnip Carrot Seed', type: 'seed', price: 15, rarity: 'Common', description: 'A common seed for a sweet root vegetable.'},
    'sunshine_flower_seed': { name: 'Sunshine Flower Seed', type: 'seed', price: 50, rarity: 'Uncommon', description: 'An uncommon seed for a bright, cheerful flower.' },
    'sealotus_lily_seed': { name: 'Sealotus Lily Seed', type: 'seed', price: 50, rarity: 'Uncommon', description: 'An uncommon seed for a beautiful water lily.' },
    'sweet_dandelion_seed': { name: 'Sweet Dandelion Seed', type: 'seed', price: 50, rarity: 'Uncommon', description: 'An uncommon seed for a surprisingly tasty weed.' },
    'ground_tater_seed': { name: 'Ground Tater Seed', type: 'seed', price: 50, rarity: 'Uncommon', description: 'An uncommon seed for a starchy tuber.' },
    'fulgurbloom_seed': { name: 'Fulgurbloom Seed', type: 'seed', price: 50, rarity: 'Uncommon', description: 'An uncommon seed that crackles with faint energy.' },
    'orchidvine_seed': { name: 'Orchidvine Seed', type: 'seed', price: 50, rarity: 'Uncommon', description: 'An uncommon seed for a climbing vine with exotic fruit.' },
    'lantern_rose_seed': { name: 'Lantern Rose Seed', type: 'seed', price: 50, rarity: 'Uncommon', description: 'An uncommon seed for a flower that glows faintly.' },
    'blackleaf_seed': { name: 'Blackleaf Seed', type: 'seed', price: 50, rarity: 'Uncommon', description: 'An uncommon seed for a plant with dark, mysterious leaves.' },
    'koriandre_seed': { name: 'Koriandre Seed', type: 'seed', price: 50, rarity: 'Uncommon', description: 'An uncommon seed for a pungent herb.' },
    'jet_pepper_seed': { name: 'Jet Pepper Seed', type: 'seed', price: 50, rarity: 'Uncommon', description: 'An uncommon seed for a spicy pepper.' },
    'dragon_chili_seed': { name: 'Dragon Chili Seed', type: 'seed', price: 50, rarity: 'Uncommon', description: 'An uncommon seed for an intensely hot chili.' },
    'screaming_lotus_seed': { name: 'Screaming Lotus Seed', type: 'seed', price: 15, rarity: 'Common', description: 'A common seed that seems to vibrate.' },
    'maizemother_seed': { name: 'Maizemother Seed', type: 'seed', price: 150, rarity: 'Rare', description: 'A rare seed for a massive, multi-colored corn.' },

    // Saplings
    'crystal_apple_sapling': { name: 'Crystal Apple Sapling', type: 'sapling', price: 250, rarity: 'Rare', description: 'A rare sapling that will grow into a tree bearing crystalline apples.' },
    'exploding_citrus_sapling': { name: 'Exploding Citrus Sapling', type: 'sapling', price: 250, rarity: 'Rare', description: 'A rare sapling for a tree with... volatile fruit.' },
    'blood_peach_sapling': { name: 'Blood Peach Sapling', type: 'sapling', price: 250, rarity: 'Rare', description: 'A rare sapling for a tree that produces deep red, life-giving peaches.' },
    'ice_cherry_sapling': { name: 'Ice Cherry Sapling', type: 'sapling', price: 250, rarity: 'Rare', description: 'A rare sapling that grows cherries with a chilling effect.' },

    // Harvested Plants (Already defined above in Food/Alchemy sections)
};

const SEEDS = {
    // Common - 15 mins (900 seconds)
    'blackwheat_seed': { growsInto: 'blackwheat', growthTime: 15 * 60 * 1000 },
    'cinnamonwood_seed': { growsInto: 'cinnamonwood_log', growthTime: 15 * 60 * 1000 },
    'beetsnip_seed': { growsInto: 'beetsnip_carrot', growthTime: 15 * 60 * 1000 },
    'screaming_lotus_seed': { growsInto: 'screaming_lotus', growthTime: 15 * 60 * 1000 },

    // Uncommon - 1 hour (3600 seconds)
    'brineflower_seed': { growsInto: 'brineflower_leaf', growthTime: 60 * 60 * 1000 },
    'sunshine_flower_seed': { growsInto: 'sunshine_flower', growthTime: 60 * 60 * 1000 },
    'sealotus_lily_seed': { growsInto: 'sealotus_pad', growthTime: 60 * 60 * 1000 },
    'sweet_dandelion_seed': { growsInto: 'sweet_dandelion', growthTime: 60 * 60 * 1000 },
    'ground_tater_seed': { growsInto: 'ground_tater', growthTime: 60 * 60 * 1000 },
    'fulgurbloom_seed': { growsInto: 'fulgurbloom', growthTime: 60 * 60 * 1000 },
    'orchidvine_seed': { growsInto: 'orchidvine_fruit', growthTime: 60 * 60 * 1000 },
    'lantern_rose_seed': { growsInto: 'lantern_rose', growthTime: 60 * 60 * 1000 },
    'blackleaf_seed': { growsInto: 'blackleaf', growthTime: 60 * 60 * 1000 },
    'koriandre_seed': { growsInto: 'koriandre_sprig', growthTime: 60 * 60 * 1000 },
    'jet_pepper_seed': { growsInto: 'jet_pepper', growthTime: 60 * 60 * 1000 },
    'dragon_chili_seed': { growsInto: 'dragon_chili', growthTime: 60 * 60 * 1000 },

    // Rare - 3 hours (10800 seconds)
    'maizemother_seed': { growsInto: 'maizemother_cob', growthTime: 3 * 60 * 60 * 1000 },
    'crystal_apple_sapling': { growsInto: 'crystal_apple', growthTime: 3 * 60 * 60 * 1000 },
    'exploding_citrus_sapling': { growsInto: 'exploding_citrus', growthTime: 3 * 60 * 60 * 1000 },
    'blood_peach_sapling': { growsInto: 'blood_peach', growthTime: 3 * 60 * 60 * 1000 },
    'ice_cherry_sapling': { growsInto: 'ice_cherry', growthTime: 3 * 60 * 60 * 1000 }
};