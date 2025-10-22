const BLACKSMITH_RECIPES = {
    'craft_earthshaker': { output: 'earthshaker_hammer', ingredients: { 'mountain_rock': 2 }, cost: 5000 },
    'brew_purifying_shield': { output: 'purifying_crystal_shield', ingredients: { 'unicorn_horn_fragment': 5 }, cost: 1500 },
    'brew_exa_reflector': { output: 'exa_reflector', ingredients: { 'soul_armor_shard': 1 }, cost: 2500 },
    'craft_soul_steel': { output: 'soul_steel_armor', ingredients: { 'soul_armor_shard': 5, 'adamantine_armor': 1 }, cost: 5000},
    'craft_vacuum_encaser': { output: 'vacuum_encaser', ingredients: { 'vacuum_lining': 3 }, cost: 3000},
    'craft_claw_of_chimera': { output: 'claw_of_chimera', ingredients: { 'chimera_claw': 2 }, cost: 1000 },
    'craft_holy_beast_halberd': { output: 'holy_beast_halberd', ingredients: { 'unicorn_horn_fragment': 5 }, cost: 2500 },
    'craft_livyatans_scaleclaw': { output: 'livyatans_scaleclaw', ingredients: { 'soul_armor_shard': 3, 'vacuum_lining': 2 }, cost: 8000 },
    'craft_the_black_knife': { output: 'the_black_knife', ingredients: { 'void_heart': 1, 'vacuum_lining': 4 }, cost: 9000 },
    'craft_grims_beloved': { output: 'grims_beloved', ingredients: { 'void_heart': 2, 'soul_armor_shard': 4 }, cost: 10000 },
    'craft_giant_hunter': { output: 'giant_hunter', ingredients: { 'mountain_rock': 2, 'vacuum_lining': 2, 'dragon_scale': 2, 'void_heart': 2 }, cost: 15000 },
    'craft_blacksmiths_hammer': { output: 'blacksmiths_workhammer', ingredients: { 'dwarven_warhammer': 1, 'soul_armor_shard': 2 }, cost: 3000 }
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

const WITCH_COVEN_RECIPES = {
    'transmute_fire_essence': { output: 'fire_essence', ingredients: { 'slime_glob': 5, 'goblin_ear': 2 }, cost: 100 },
    'transmute_water_essence': { output: 'water_essence', ingredients: { 'slime_glob': 5, 'rat_tail': 2 }, cost: 100 },
    'transmute_earth_essence': { output: 'earth_essence', ingredients: { 'slime_glob': 5, 'rabbit_meat': 2 }, cost: 100 },
    'transmute_wind_essence': { output: 'wind_essence', ingredients: { 'slime_glob': 5, 'wolf_pelt': 2 }, cost: 100 },
    'potion_giant_strength': { output: 'potion_of_giant_strength', ingredients: { 'orc_liver': 5 }, cost: 250, hearts: 1 },
    'potion_fortitude': { output: 'potion_of_fortitude', ingredients: { 'cockatrice_venom_gland': 5 }, cost: 250, hearts: 1 },
    'potion_brilliance': { output: 'potion_of_brilliance', ingredients: { 'spider_venom': 5 }, cost: 250, hearts: 1 },
    'potion_clarity': { output: 'potion_of_clarity', ingredients: { 'unicorn_horn_fragment': 2 }, cost: 250, hearts: 1 },
    'brew_health': { output: 'health_potion', ingredients: { 'slime_glob': 2 }, cost: 10 },
    'brew_mana': { output: 'mana_potion', ingredients: { 'slime_glob': 2 }, cost: 15 },
    'brew_condensed_health': { output: 'condensed_health_potion', ingredients: { 'slime_glob': 10 }, cost: 50 },
    'brew_condensed_mana': { output: 'condensed_mana_potion', ingredients: { 'slime_glob': 10 }, cost: 60 },
    'brew_super_health': { output: 'superior_health_potion', ingredients: { 'slime_glob': 20, 'orc_liver' : 2 }, cost: 100 },
    'brew_super_mana': { output: 'superior_mana_potion', ingredients: { 'slime_glob': 20, 'cockatrice_venom_gland': 2 }, cost: 120 },
};

const ALCHEMY_RECIPES = {
    // Tier 1 - Catalyst: Slime Glob
    'brew_health_potion_home': {
        tier: 1,
        output: 'health_potion',
        ingredients: { 'rabbit_meat': 2, 'rat_tail': 1, 'slime_glob': 1 },
        cost: 5,
        library_description: `
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Objective</h4>
            <p class='mb-2'>To synthesize a compound capable of stimulating minor cellular regeneration.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Ingredients</h4>
            <ul class='list-disc list-inside mb-2'>
                <li>Reagent A: 2 units, Leporine Muscle Tissue (rabbit_meat)</li>
                <li>Reagent B: 1 unit, Rodent Caudal Appendage (rat_tail)</li>
                <li>Catalyst: 1 unit, Protoplasmic Catalyst (slime_glob)</li>
            </ul>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Methodology</h4>
            <p class='mb-2'>Combine reagents in a standard cauldron. Agitate at a low temperature until a homogenous, viscous solution is achieved. Decant and store.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Outcome</h4>
            <p class='mb-2'>The resultant compound stimulates minor mitotic activity upon ingestion, colloquially known as 'healing.'</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Addendum</h4>
            <p class='italic text-gray-400'>My spouse, Nathalie, has demonstrated that a similar, albeit less stable, restorative effect can be achieved through the slow-braising of specific monster meats. Her methods are effective, if lacking in quantitative precision.</p>
        `
    },
    'brew_mana_potion_home': {
        tier: 1,
        output: 'mana_potion',
        ingredients: { 'goblin_ear': 2, 'spider_venom': 1, 'slime_glob': 1 },
        cost: 10,
        library_description: `
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Objective</h4>
            <p class='mb-2'>To create a brew that replenishes a subject's metaphysical energy reserves (mana).</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Ingredients</h4>
            <ul class='list-disc list-inside mb-2'>
                <li>Reagent A: 2 units, Goblin Auditory Organs (goblin_ear)</li>
                <li>Reagent B: 1 unit, Arachnid Neurotoxin (spider_venom)</li>
                <li>Catalyst: 1 unit, Protoplasmic Catalyst (slime_glob)</li>
            </ul>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Methodology</h4>
            <p class='mb-2'>Macerate the goblin organs and combine with the neurotoxin. Introduce the catalyst and heat gently until the solution fluoresces with a vibrant blue hue.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Outcome</h4>
            <p class='mb-2'>Provides a quantifiable replenishment of the subject's mana reserves. The tingling sensation upon consumption is a normal side effect.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Addendum</h4>
            <p class='italic text-gray-400'>Contrary to the methods occasionally employed in my spouse's kitchen, one cannot simply 'eyeball' the quantity of goblin auditory organs. Precision is paramount to avoid... unexpected auditory hallucinations.</p>
        `
    },
    'brew_cinderstop': {
        tier: 1,
        output: 'cinderstop_potion',
        ingredients: { 'sunshine_flower': 1, 'water_essence': 2, 'slime_glob': 2 },
        cost: 50,
        library_description: `
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Objective</h4>
            <p class='mb-2'>To formulate a consumable agent that mitigates incoming thermal energy.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Ingredients</h4>
            <ul class='list-disc list-inside mb-2'>
                <li>Reagent A: 1 unit, Helianthus Radiatus (sunshine_flower)</li>
                <li>Reagent B: 2 units, Hydronic Essence (water_essence)</li>
                <li>Catalyst: 2 units, Protoplasmic Catalyst (slime_glob)</li>
            </ul>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Methodology</h4>
            <p class='mb-2'>Suspend the floral reagent in the opposing elemental essence solution. Introduce the catalyst to create a stable, insulated emulsion.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Outcome</h4>
            <p class='mb-2'>Grants a 5% resistance to Fire-aspected energy for a duration of 10 turns.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Addendum</h4>
            <p class='italic text-gray-400'>Nathalie has noted this flower imparts a "pleasant warmth" to certain salads. Its primary alchemical function, however, remains thermal regulation.</p>
        `
    },
    'brew_dampclear': {
        tier: 1,
        output: 'dampclear_potion',
        ingredients: { 'sealotus_pad': 1, 'nature_essence': 2, 'slime_glob': 2 },
        cost: 50,
        library_description: `
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Objective</h4>
            <p class='mb-2'>To synthesize a suspension that provides resistance to aquatic and pressure-based energies.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Ingredients</h4>
            <ul class='list-disc list-inside mb-2'>
                <li>Reagent A: 1 unit, Nymphaea Serena Folium (sealotus_pad)</li>
                <li>Reagent B: 2 units, Phytic Essence (nature_essence)</li>
                <li>Catalyst: 2 units, Protoplasmic Catalyst (slime_glob)</li>
            </ul>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Methodology</h4>
            <p class='mb-2'>Infuse the properties of the Nymphaea Serena Folium into the Phytic Essence. The catalyst serves to bind the hydrophobic properties to the solution.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Outcome</h4>
            <p class='mb-2'>Grants a 5% resistance to Water-aspected energy for a duration of 10 turns.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Addendum</h4>
            <p class='italic text-gray-400'>This reagent is the basis for Nathalie's 'Calming Tea.' Its sedative properties are mild, but statistically present and should be noted when calculating dosages.</p>
        `
    },
    'brew_windwail': {
        tier: 1,
        output: 'windwail_potion',
        ingredients: { 'sweet_dandelion': 1, 'lightning_essence': 2, 'slime_glob': 2 },
        cost: 50,
        library_description: `
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Objective</h4>
            <p class='mb-2'>To formulate a potion that lessens the impact of kinetic force delivered via gaseous mediums.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Ingredients</h4>
            <ul class='list-disc list-inside mb-2'>
                <li>Reagent A: 1 unit, Taraxacum Dulcis (sweet_dandelion)</li>
                <li>Reagent B: 2 units, Fulminic Essence (lightning_essence)</li>
                <li>Catalyst: 2 units, Protoplasmic Catalyst (slime_glob)</li>
            </ul>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Methodology</h4>
            <p class='mb-2'>The Taraxacum Dulcis's unique aerodynamic seed structure is broken down and stabilized within the Fulminic Essence to create an anti-kinetic field.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Outcome</h4>
            <p class='mb-2'>Grants a 5% resistance to Wind-aspected energy for a duration of 10 turns.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Addendum</h4>
            <p class='italic text-gray-400'>My spouse considers this flower a 'lucky green.' While superstition has no place in alchemy, the flower's inherent properties related to air dispersal are undeniable.</p>
        `
    },
    'brew_rockshut': {
        tier: 1,
        output: 'rockshut_potion',
        ingredients: { 'ground_tater': 1, 'wind_essence': 2, 'slime_glob': 2 },
        cost: 50,
        library_description: `
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Objective</h4>
            <p class='mb-2'>To concoct a draught that temporarily increases the user's molecular density to resist seismic forces.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Ingredients</h4>
            <ul class='list-disc list-inside mb-2'>
                <li>Reagent A: 1 unit, Solanum Tuberosum Variant (ground_tater)</li>
                <li>Reagent B: 2 units, Aeris Essence (wind_essence)</li>
                <li>Catalyst: 2 units, Protoplasmic Catalyst (slime_glob)</li>
            </ul>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Methodology</h4>
            <p class='mb-2'>The starchy composition of the Solanum Tuberosum is used as a base to absorb and stabilize the opposing Aeris Essence.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Outcome</h4>
            <p class='mb-2'>Grants a 5% resistance to Earth-aspected energy for a duration of 10 turns.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Addendum</h4>
            <p class='italic text-gray-400'>Nathalie's process of 'baking and loading' this reagent significantly alters its chemical composition for culinary purposes. For alchemy, the tuber must be used in its raw, unprocessed state.</p>
        `
    },
    'brew_zapsipper': {
        tier: 1,
        output: 'zapsipper_potion',
        ingredients: { 'fulgurbloom': 1, 'earth_essence': 2, 'slime_glob': 2 },
        cost: 50,
        library_description: `
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Objective</h4>
            <p class='mb-2'>To create a solution that safely grounds and disperses high-voltage electrical energy.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Ingredients</h4>
            <ul class='list-disc list-inside mb-2'>
                <li>Reagent A: 1 unit, Fulgurbloom (fulgurbloom)</li>
                <li>Reagent B: 2 units, Telluric Essence (earth_essence)</li>
                <li>Catalyst: 2 units, Protoplasmic Catalyst (slime_glob)</li>
            </ul>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Methodology</h4>
            <p class='mb-2'>The Fulgurbloom's innate electrical charge is neutralized and inverted by the grounding properties of the Telluric Essence.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Outcome</h4>
            <p class='mb-2'>Grants a 5% resistance to Lightning-aspected energy for a duration of 10 turns.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Addendum</h4>
            <p class='italic text-gray-400'>The reagent crackles with faint energy. While visually appealing, it is not recommended as a garnish, despite my spouse's documented curiosity on the matter.</p>
        `
    },
    'brew_vinekill': {
        tier: 1,
        output: 'vinekill_potion',
        ingredients: { 'orchidvine_fruit': 1, 'fire_essence': 2, 'slime_glob': 2 },
        cost: 50,
        library_description: `
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Objective</h4>
            <p class='mb-2'>To brew a potion that provides resistance to aggressive, magically-infused flora.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Ingredients</h4>
            <ul class='list-disc list-inside mb-2'>
                <li>Reagent A: 1 unit, Orchidaceae Fructus (orchidvine_fruit)</li>
                <li>Reagent B: 2 units, Pyric Essence (fire_essence)</li>
                <li>Catalyst: 2 units, Protoplasmic Catalyst (slime_glob)</li>
            </ul>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Methodology</h4>
            <p class='mb-2'>The complex alkaloids within the Orchidaceae Fructus, which counteract chlorophyll-based toxins, are extracted using the thermal energy of the Pyric Essence.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Outcome</h4>
            <p class='mb-2'>Grants a 5% resistance to Nature-aspected energy for a duration of 10 turns.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Addendum</h4>
            <p class='italic text-gray-400'>The fruit itself is quite delicious, according to Nathalie's extensive culinary trials. Its true value, however, remains in its potent chemical defenses.</p>
        `
    },
    'brew_lightcloser': {
        tier: 1,
        output: 'lightcloser_potion',
        ingredients: { 'lantern_rose': 1, 'void_essence': 2, 'slime_glob': 2 },
        cost: 50,
        library_description: `
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Objective</h4>
            <p class='mb-2'>To formulate a draught that refracts and absorbs concentrated photonic energy.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Ingredients</h4>
            <ul class='list-disc list-inside mb-2'>
                <li>Reagent A: 1 unit, Rosa Laterna (lantern_rose)</li>
                <li>Reagent B: 2 units, Entropic Essence (void_essence)</li>
                <li>Catalyst: 2 units, Protoplasmic Catalyst (slime_glob)</li>
            </ul>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Methodology</h4>
            <p class='mb-2'>The Rosa Laterna's unique bioluminescent proteins are repurposed to polarize and absorb light when stabilized by the Entropic Essence.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Outcome</h4>
            <p class='mb-2'>Grants a 5% resistance to Light-aspected energy for a duration of 10 turns.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Addendum</h4>
            <p class='italic text-gray-400'>The gentle glow of the Rosa Laterna is aesthetically pleasing. Its ability to manipulate light, however, is its key alchemical property, not merely a decorative one.</p>
        `
    },
    'brew_lampside': {
        tier: 1,
        output: 'lampside_potion',
        ingredients: { 'blackleaf': 1, 'light_essence': 2, 'slime_glob': 2 },
        cost: 50,
        library_description: `
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Objective</h4>
            <p class='mb-2'>To create a suspension that reinforces the user's metaphysical state against entropic energies.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Ingredients</h4>
            <ul class='list-disc list-inside mb-2'>
                <li>Reagent A: 1 unit, Folium Tenebris (blackleaf)</li>
                <li>Reagent B: 2 units, Photonic Essence (light_essence)</li>
                <li>Catalyst: 2 units, Protoplasmic Catalyst (slime_glob)</li>
            </ul>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Methodology</h4>
            <p class='mb-2'>The complex, light-absorbing pigments of the Folium Tenebris are infused with opposing Photonic Essence to create a stable anti-entropic field.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Outcome</h4>
            <p class='mb-2'>Grants a 5% resistance to Void-aspected energy for a duration of 10 turns.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Addendum</h4>
            <p class='italic text-gray-400'>Nathalie utilizes the Folium Tenebris pigments to create a dark food coloring, which, while visually striking in her dishes, is a trivial application of its potent properties.</p>
        `
    },

    // Tier 2
    'brew_condensed_health_potion_home': {
        tier: 2,
        output: 'condensed_health_potion',
        ingredients: { 'wolf_meat': 2, 'beetsnip_carrot': 1, 'wild_wine': 1, 'health_potion': 1 },
        cost: 25,
        library_description: `
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Objective</h4>
            <p class='mb-2'>To increase the potency of the basic restorative agent by approximately 150% through secondary catalysis.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Ingredients</h4>
            <ul class='list-disc list-inside mb-2'>
                <li>Reagent A: 2 units, Lupine Protein (wolf_meat)</li>
                <li>Reagent B: 1 unit, Daucus Carota Extract (beetsnip_carrot)</li>
                <li>Reagent C: 1 unit, Basic Restorative Agent (health_potion)</li>
                <li>Catalyst: 1 unit, Fermented Vitis Vinifera Catalyst (wild_wine)</li>
            </ul>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Methodology</h4>
            <p class='mb-2'>Utilize the fermented catalyst to re-process the base potion, introducing the new organic compounds to increase restorative efficacy.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Outcome</h4>
            <p class='mb-2'>Restores a moderate amount of health (50 HP), a significant improvement over the base formula.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Addendum</h4>
            <p class='italic text-gray-400'>The use of Fermented Vitis Vinifera as a catalyst is surprisingly effective. Nathalie's pantry continues to be an unexpected source of viable, if unrefined, reagents for intermediate-level work.</p>
        `
    },
    'brew_condensed_mana_potion_home': {
        tier: 2,
        output: 'condensed_mana_potion',
        ingredients: { 'orc_liver': 2, 'fulgurbloom': 1, 'wild_wine': 1, 'mana_potion': 1 },
        cost: 30,
        library_description: `
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Objective</h4>
            <p class='mb-2'>To refine the standard arcane restorative for greater efficiency and potency.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Ingredients</h4>
            <ul class='list-disc list-inside mb-2'>
                <li>Reagent A: 2 units, Orcish Hepatic Tissue (orc_liver)</li>
                <li>Reagent B: 1 unit, Fulgurbloom (fulgurbloom)</li>
                <li>Reagent C: 1 unit, Basic Arcane Restorative (mana_potion)</li>
                <li>Catalyst: 1 unit, Fermented Vitis Vinifera Catalyst (wild_wine)</li>
            </ul>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Methodology</h4>
            <p class='mb-2'>The Orcish tissue and Fulgurbloom infusion create a synergistic effect that supercharges the base potion's arcane matrix.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Outcome</h4>
            <p class='mb-2'>Provides a sharp, invigorating restoration of a large amount of magical energy (100 MP).</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Addendum</h4>
            <p class='italic text-gray-400'>This interaction is a perfect example of synergistic alchemy, where the result is far greater than the sum of its parts. A truly elegant formulation.</p>
        `
    },
    'brew_hearthstall': {
        tier: 2,
        output: 'hearthstall_potion',
        ingredients: { 'cinderstop_potion': 1, 'sunshine_flower': 3, 'screaming_lotus': 2, 'wild_wine': 1 },
        cost: 150,
        library_description: `
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Objective</h4>
            <p class='mb-2'>To create an enhanced thermal insulator via sequential synthesis.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Ingredients</h4>
            <ul class='list-disc list-inside mb-2'>
                <li>Reagent A: 1 unit, Base Thermal Insulator (Tier 1) (cinderstop_potion)</li>
                <li>Reagent B: 3 units, Helianthus Radiatus (sunshine_flower)</li>
                <li>Reagent C: 2 units, Lotus Vociferari (screaming_lotus)</li>
                <li>Catalyst: 1 unit, Fermented Vitis Vinifera Catalyst (wild_wine)</li>
            </ul>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Methodology</h4>
            <p class='mb-2'>Reprocess the base Tier 1 potion with an increased concentration of the primary floral reagent, using the Lotus Vociferari to stabilize the now more volatile energy field.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Outcome</h4>
            <p class='mb-2'>Grants a 10% resistance to Fire-aspected energy for a duration of 10 turns.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Addendum</h4>
            <p class='italic text-gray-400'>Sequential synthesis, building upon a previous formulation, is a far more elegant and effective method than simply increasing the quantity of raw reagents. True alchemy is about refinement.</p>
        `
    },
    'brew_waterdam': {
        tier: 2,
        output: 'waterdam_potion',
        ingredients: { 'dampclear_potion': 1, 'sealotus_pad': 3, 'cinnamonwood_log': 2, 'wild_wine': 1 },
        cost: 150,
        library_description: `
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Objective</h4>
            <p class='mb-2'>To enhance the hydrophobic and pressure-resistant properties of the base formula.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Ingredients</h4>
            <ul class='list-disc list-inside mb-2'>
                <li>Reagent A: 1 unit, Base Aquatic Insulator (Tier 1) (dampclear_potion)</li>
                <li>Reagent B: 3 units, Nymphaea Serena Folium (sealotus_pad)</li>
                <li>Reagent C: 2 units, Cinnamomum Lignum (cinnamonwood_log)</li>
                <li>Catalyst: 1 unit, Fermented Vitis Vinifera Catalyst (wild_wine)</li>
            </ul>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Methodology</h4>
            <p class='mb-2'>The lignin composites from the Cinnamomum Lignum unexpectedly reinforce the hydrophobic matrix of the base potion when introduced during secondary catalysis.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Outcome</h4>
            <p class='mb-2'>Grants a 10% resistance to Water-aspected energy for a duration of 10 turns.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Addendum</h4>
            <p class='italic text-gray-400'>An interesting case of cross-property reinforcement. Nathalie's use of this reagent in savory dishes is, by her own admission, 'unconventional.' I am beginning to see the logic.</p>
        `
    },
    'brew_gustshield': {
        tier: 2,
        output: 'gustshield_potion',
        ingredients: { 'windwail_potion': 1, 'sweet_dandelion': 3, 'koriandre_sprig': 2, 'wild_wine': 1 },
        cost: 150,
        library_description: `
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Objective</h4>
            <p class='mb-2'>To create a more robust anti-kinetic field for wind resistance.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Ingredients</h4>
            <ul class='list-disc list-inside mb-2'>
                <li>Reagent A: 1 unit, Base Kinetic Insulator (Tier 1) (windwail_potion)</li>
                <li>Reagent B: 3 units, Taraxacum Dulcis (sweet_dandelion)</li>
                <li>Reagent C: 2 units, Coriandrum Herba (koriandre_sprig)</li>
                <li>Catalyst: 1 unit, Fermented Vitis Vinifera Catalyst (wild_wine)</li>
            </ul>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Methodology</h4>
            <p class='mb-2'>The pungent oils of the Coriandrum Herba act as a surprisingly effective binding agent for the dispersed Taraxacum Dulcis particles.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Outcome</h4>
            <p class='mb-2'>Grants a 10% resistance to Wind-aspected energy for a duration of 10 turns.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Addendum</h4>
            <p class='italic text-gray-400'>Nathalie claims the aroma of Coriandrum Herba "sharpens the mind." My research indicates it primarily functions as an aromatic binding agent. I concede that her stir-fry is, nonetheless, quite effective.</p>
        `
    },
    'brew_quakestable': {
        tier: 2,
        output: 'quakestable_potion',
        ingredients: { 'rockshut_potion': 1, 'ground_tater': 3, 'jet_pepper': 2, 'wild_wine': 1 },
        cost: 150,
        library_description: `
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Objective</h4>
            <p class='mb-2'>To increase the efficacy of the molecular densification agent.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Ingredients</h4>
            <ul class='list-disc list-inside mb-2'>
                <li>Reagent A: 1 unit, Base Seismic Insulator (Tier 1) (rockshut_potion)</li>
                <li>Reagent B: 3 units, Solanum Tuberosum Variant (ground_tater)</li>
                <li>Reagent C: 2 units, Capsicum Infernus (jet_pepper)</li>
                <li>Catalyst: 1 unit, Fermented Vitis Vinifera Catalyst (wild_wine)</li>
            </ul>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Methodology</h4>
            <p class='mb-2'>The capsaicin from the Capsicum Infernus acts as a thermal catalyst, allowing for a denser compression of the tuber starch matrix.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Outcome</h4>
            <p class='mb-2'>Grants a 10% resistance to Earth-aspected energy for a duration of 10 turns.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Addendum</h4>
            <p class='italic text-gray-400'>A volatile procedure. Ensure adequate ventilation. The resulting aerosol is, in Nathalie's words, "a bit spicy." This is an understatement.</p>
        `
    },
    'brew_strikestop': {
        tier: 2,
        output: 'strikestop_potion',
        ingredients: { 'zapsipper_potion': 1, 'fulgurbloom': 3, 'brineflower_leaf': 2, 'wild_wine': 1 },
        cost: 150,
        library_description: `
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Objective</h4>
            <p class='mb-2'>To improve the electrical grounding properties of the base formula.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Ingredients</h4>
            <ul class='list-disc list-inside mb-2'>
                <li>Reagent A: 1 unit, Base Electrical Insulator (Tier 1) (zapsipper_potion)</li>
                <li>Reagent B: 3 units, Fulgurbloom (fulgurbloom)</li>
                <li>Reagent C: 2 units, Folium Salis (brineflower_leaf)</li>
                <li>Catalyst: 1 unit, Fermented Vitis Vinifera Catalyst (wild_wine)</li>
            </ul>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Methodology</h4>
            <p class='mb-2'>The high salinity of the Folium Salis increases the solution's conductivity, allowing for a more rapid and efficient dispersal of electrical energy.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Outcome</h4>
            <p class='mb-2'>Grants a 10% resistance to Lightning-aspected energy for a duration of 10 turns.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Addendum</h4>
            <p class='italic text-gray-400'>An elegant solution. Nathalie uses these same leaves for her 'Salty Seafood Stew.' The principles of creating a balanced saline solution, it seems, are universal.</p>
        `
    },
    'brew_growthstall': {
        tier: 2,
        output: 'growthstall_potion',
        ingredients: { 'vinekill_potion': 1, 'orchidvine_fruit': 3, 'dragon_chili': 2, 'wild_wine': 1 },
        cost: 150,
        library_description: `
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Objective</h4>
            <p class='mb-2'>To create a more potent counter-agent to aggressive flora.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Ingredients</h4>
            <ul class='list-disc list-inside mb-2'>
                <li>Reagent A: 1 unit, Base Phytic Insulator (Tier 1) (vinekill_potion)</li>
                <li>Reagent B: 3 units, Orchidaceae Fructus (orchidvine_fruit)</li>
                <li>Reagent C: 2 units, Capsicum Draconis (dragon_chili)</li>
                <li>Catalyst: 1 unit, Fermented Vitis Vinifera Catalyst (wild_wine)</li>
            </ul>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Methodology</h4>
            <p class='mb-2'>The intense thermal energy of the Capsicum Draconis is used to break down the Orchidaceae Fructus into its most potent anti-chlorophyll alkaloids.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Outcome</h4>
            <p class='mb-2'>Grants a 10% resistance to Nature-aspected energy for a duration of 10 turns.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Addendum</h4>
            <p class='italic text-gray-400'>The resulting potion is intensely acrid. I have a profound respect for Nathalie's ability to render this same chili into something not only edible but, by her account, 'delightful.'</p>
        `
    },
    'brew_sundown': {
        tier: 2,
        output: 'sundown_potion',
        ingredients: { 'lightcloser_potion': 1, 'lantern_rose': 3, 'blackwheat': 2, 'wild_wine': 1 },
        cost: 150,
        library_description: `
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Objective</h4>
            <p class='mb-2'>To enhance the photonic absorption capabilities of the base formula.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Ingredients</h4>
            <ul class='list-disc list-inside mb-2'>
                <li>Reagent A: 1 unit, Base Photonic Insulator (Tier 1) (lightcloser_potion)</li>
                <li>Reagent B: 3 units, Rosa Laterna (lantern_rose)</li>
                <li>Reagent C: 2 units, Triticum Ater (blackwheat)</li>
                <li>Catalyst: 1 unit, Fermented Vitis Vinifera Catalyst (wild_wine)</li>
            </ul>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Methodology</h4>
            <p class='mb-2'>The carbon-rich composition of the Triticum Ater flour creates a superior light-absorbing medium for the polarized proteins of the Rosa Laterna.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Outcome</h4>
            <p class='mb-2'>Grants a 10% resistance to Light-aspected energy for a duration of 10 turns.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Addendum</h4>
            <p class='italic text-gray-400'>This formulation effectively weaponizes the properties Nathalie uses to bake a simple, if unusually dense, 'Fortifying Meat Pie.' Fascinating.</p>
        `
    },
    'brew_sunrise': {
        tier: 2,
        output: 'sunrise_potion',
        ingredients: { 'lampside_potion': 1, 'blackleaf': 3, 'beetsnip_carrot': 2, 'wild_wine': 1 },
        cost: 150,
        library_description: `
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Objective</h4>
            <p class='mb-2'>To improve the anti-entropic field of the base formula.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Ingredients</h4>
            <ul class='list-disc list-inside mb-2'>
                <li>Reagent A: 1 unit, Base Entropic Insulator (Tier 1) (lampside_potion)</li>
                <li>Reagent B: 3 units, Folium Tenebris (blackleaf)</li>
                <li>Reagent C: 2 units, Daucus Carota Extract (beetsnip_carrot)</li>
                <li>Catalyst: 1 unit, Fermented Vitis Vinifera Catalyst (wild_wine)</li>
            </ul>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Methodology</h4>
            <p class='mb-2'>The beta-carotene in the Daucus Carota Extract acts as a stabilizing agent for the volatile light-absorbing pigments of the Folium Tenebris, creating a more durable effect.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Outcome</h4>
            <p class='mb-2'>Grants a 10% resistance to Void-aspected energy for a duration of 10 turns.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Addendum</h4>
            <p class='italic text-gray-400'>The simplicity of the carrot as a solution is remarkable. It appears Nathalie's 'Hunter's Lunch' has applications beyond simple 'luck.'</p>
        `
    },

    // Tier 3
    'brew_superior_health_potion_home': {
        tier: 3,
        output: 'superior_health_potion',
        ingredients: { 'horse_meat': 1, 'blood_peach': 1, 'troll_blood': 1, 'condensed_health_potion': 1 },
        cost: 100,
        library_description: `
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Objective</h4>
            <p class='mb-2'>To create a regenerative elixir capable of mending wounds previously considered fatal.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Ingredients</h4>
            <ul class='list-disc list-inside mb-2'>
                <li>Reagent A: 1 unit, Equine Myocardium (Unicorn) (horse_meat)</li>
                <li>Reagent B: 1 unit, Sanguine Prunus Persica (blood_peach)</li>
                <li>Reagent C: 1 unit, Condensed Restorative Agent (condensed_health_potion)</li>
                <li>Catalyst: 1 unit, Troll-Sourced Coagulant Catalyst (troll_blood)</li>
            </ul>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Methodology</h4>
            <p class='mb-2'>A complex process involving the infusion of the Troll-Sourced Catalyst's unique regenerative properties into the base organic materials. Requires precise temperature control.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Outcome</h4>
            <p class='mb-2'>Restores a substantial amount of health (100 HP), capable of stabilizing critical injuries.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Addendum</h4>
            <p class='italic text-gray-400'>The regenerative principles at work here are fascinating. Nathalie's culinary application, the 'Phoenix Down Roast,' achieves a similar, though less concentrated, effect. Our collaborative potential in the field of bio-restorative consumables warrants further investigation.</p>
        `
    },
    'brew_superior_mana_potion_home': {
        tier: 3,
        output: 'superior_mana_potion',
        ingredients: { 'chimera_claw': 1, 'crystal_apple': 1, 'troll_blood': 1, 'condensed_mana_potion': 1 },
        cost: 120,
        library_description: `
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Objective</h4>
            <p class='mb-2'>To synthesize a draught providing near-total restoration of a subject's arcane reserves.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Ingredients</h4>
            <ul class='list-disc list-inside mb-2'>
                <li>Reagent A: 1 unit, Chimera Unguis (chimera_claw)</li>
                <li>Reagent B: 1 unit, Crystalline Malus Domestica (crystal_apple)</li>
                <li>Reagent C: 1 unit, Condensed Arcane Restorative (condensed_mana_potion)</li>
                <li>Catalyst: 1 unit, Troll-Sourced Coagulant Catalyst (troll_blood)</li>
            </ul>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Methodology</h4>
            <p class='mb-2'>The reality-warping properties of the Chimera Unguis are stabilized by the Crystalline Malus Domestica's ordered arcane matrix, creating a remarkably potent energy source.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Outcome</h4>
            <p class='mb-2'>Restores a vast amount of magical energy (150 MP).</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Addendum</h4>
            <p class='italic text-gray-400'>The fact that most of these high-tier reagents are also key ingredients in Nathalie's desserts is a testament to the fine line between gastronomy and high alchemy.</p>
        `
    },
    'brew_blazeback': {
        tier: 3,
        output: 'blazeback_potion',
        ingredients: { 'hearthstall_potion': 1, 'sunshine_flower': 5, 'ice_cherry': 2, 'troll_blood': 1 },
        cost: 400,
        library_description: `
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Objective</h4>
            <p class='mb-2'>To create the pinnacle of consumable thermal shielding through multi-stage infusion.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Ingredients</h4>
            <ul class='list-disc list-inside mb-2'>
                <li>Reagent A: 1 unit, Fortified Thermal Insulator (Tier 2) (hearthstall_potion)</li>
                <li>Reagent B: 5 units, Helianthus Radiatus (sunshine_flower)</li>
                <li>Reagent C: 2 units, Cryo-Prunus (ice_cherry)</li>
                <li>Catalyst: 1 unit, Troll-Sourced Coagulant Catalyst (troll_blood)</li>
            </ul>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Methodology</h4>
            <p class='mb-2'>The final-stage refinement uses the Troll-Sourced Catalyst to fuse the endothermic properties of the Cryo-Prunus with the fortified thermal field of the base potion.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Outcome</h4>
            <p class='mb-2'>Grants a 20% resistance to Fire-aspected energy for 10 turns.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Addendum</h4>
            <p class='italic text-gray-400'>The paradoxical combination of extreme heat-absorbing and cold-emitting reagents creates a near-perfect thermal barrier. A triumph of alchemical engineering.</p>
        `
    },
    'brew_floodwall': {
        tier: 3,
        output: 'floodwall_potion',
        ingredients: { 'waterdam_potion': 1, 'sealotus_pad': 5, 'blood_peach': 2, 'troll_blood': 1 },
        cost: 400,
        library_description: `
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Objective</h4>
            <p class='mb-2'>To create a potion that generates a microscopic, self-repairing pressure shield.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Ingredients</h4>
            <ul class='list-disc list-inside mb-2'>
                <li>Reagent A: 1 unit, Fortified Aquatic Insulator (Tier 2) (waterdam_potion)</li>
                <li>Reagent B: 5 units, Nymphaea Serena Folium (sealotus_pad)</li>
                <li>Reagent C: 2 units, Sanguine Prunus Persica (blood_peach)</li>
                <li>Catalyst: 1 unit, Troll-Sourced Coagulant Catalyst (troll_blood)</li>
            </ul>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Methodology</h4>
            <p class='mb-2'>The life-giving properties of the Sanguine Prunus Persica, when catalyzed, grant the hydrophobic matrix a limited regenerative capacity.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Outcome</h4>
            <p class='mb-2'>Grants a 20% resistance to Water-aspected energy for 10 turns.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Addendum</h4>
            <p class='italic text-gray-400'>Nathalie's 'Nectar of the Soul' utilizes this same peach for spiritual restoration. It appears its 'life-giving' properties are quite literal and versatile.</p>
        `
    },
    'brew_stormsapper': {
        tier: 3,
        output: 'stormsapper_potion',
        ingredients: { 'gustshield_potion': 1, 'sweet_dandelion': 5, 'exploding_citrus': 2, 'troll_blood': 1 },
        cost: 400,
        library_description: `
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Objective</h4>
            <p class='mb-2'>To create a solution that generates a personal field of high-density air, nullifying kinetic wind forces.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Ingredients</h4>
            <ul class='list-disc list-inside mb-2'>
                <li>Reagent A: 1 unit, Fortified Kinetic Insulator (Tier 2) (gustshield_potion)</li>
                <li>Reagent B: 5 units, Taraxacum Dulcis (sweet_dandelion)</li>
                <li>Reagent C: 2 units, Volatile Citrus (exploding_citrus)</li>
                <li>Catalyst: 1 unit, Troll-Sourced Coagulant Catalyst (troll_blood)</li>
            </ul>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Methodology</h4>
            <p class='mb-2'>The volatile, expansive energy of the Volatile Citrus is harnessed to create a pressurized, stable field around the user.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Outcome</h4>
            <p class='mb-2'>Grants a 20% resistance to Wind-aspected energy for 10 turns.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Addendum</h4>
            <p class='italic text-gray-400'>Handling the primary reagent is, of course, hazardous. It is the same ingredient Nathalie once used in a celebratory tart, which resulted in a minor, but memorable, kitchen detonation.</p>
        `
    },
    'brew_fissurewalker': {
        tier: 3,
        output: 'fissurewalker_potion',
        ingredients: { 'quakestable_potion': 1, 'ground_tater': 5, 'ice_cherry': 2, 'troll_blood': 1 },
        cost: 400,
        library_description: `
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Objective</h4>
            <p class='mb-2'>To formulate a draught that allows the user's body to temporarily absorb and disperse seismic shockwaves.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Ingredients</h4>
            <ul class='list-disc list-inside mb-2'>
                <li>Reagent A: 1 unit, Fortified Seismic Insulator (Tier 2) (quakestable_potion)</li>
                <li>Reagent B: 5 units, Solanum Tuberosum Variant (ground_tater)</li>
                <li>Reagent C: 2 units, Cryo-Prunus (ice_cherry)</li>
                <li>Catalyst: 1 unit, Troll-Sourced Coagulant Catalyst (troll_blood)</li>
            </ul>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Methodology</h4>
            <p class='mb-2'>The endothermic properties of the Cryo-Prunus create a flexible, shock-absorbent molecular structure within the densified starch base.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Outcome</h4>
            <p class='mb-2'>Grants a 20% resistance to Earth-aspected energy for 10 turns.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Addendum</h4>
            <p class='italic text-gray-400'>The concept of using cold to resist tectonic force is counterintuitive but effective. Nathalie's 'Alacrity Sorbet' uses the same cherry to 'accelerate.' The applications of endothermic reagents are proving to be remarkably diverse.</p>
        `
    },
    'brew_thunderground': {
        tier: 3,
        output: 'thunderground_potion',
        ingredients: { 'strikestop_potion': 1, 'fulgurbloom': 5, 'crystal_apple': 2, 'troll_blood': 1 },
        cost: 400,
        library_description: `
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Objective</h4>
            <p class='mb-2'>To create a perfect grounding agent that harmlessly channels extreme electrical voltages.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Ingredients</h4>
            <ul class='list-disc list-inside mb-2'>
                <li>Reagent A: 1 unit, Fortified Electrical Insulator (Tier 2) (strikestop_potion)</li>
                <li>Reagent B: 5 units, Fulgurbloom (fulgurbloom)</li>
                <li>Reagent C: 2 units, Crystalline Malus Domestica (crystal_apple)</li>
                <li>Catalyst: 1 unit, Troll-Sourced Coagulant Catalyst (troll_blood)</li>
            </ul>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Methodology</h4>
            <p class='mb-2'>The ordered, non-conductive matrix of the Crystalline Malus Domestica creates perfect channels for the Fulgurbloom's grounding properties to operate within.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Outcome</h4>
            <p class='mb-2'>Grants a 20% resistance to Lightning-aspected energy for 10 turns.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Addendum</h4>
            <p class='italic text-gray-400'>A flawless synthesis. It is immensely satisfying to create a perfect system. Nathalie finds the resulting potion 'pretty,' which I suppose is also a valid observation.</p>
        `
    },
    'brew_jungleward': {
        tier: 3,
        output: 'jungleward_potion',
        ingredients: { 'growthstall_potion': 1, 'orchidvine_fruit': 5, 'exploding_citrus': 2, 'troll_blood': 1 },
        cost: 400,
        library_description: `
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Objective</h4>
            <p class='mb-2'>To create a broad-spectrum antitoxin effective against nearly all forms of magical flora.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Ingredients</h4>
            <ul class='list-disc list-inside mb-2'>
                <li>Reagent A: 1 unit, Fortified Phytic Insulator (Tier 2) (growthstall_potion)</li>
                <li>Reagent B: 5 units, Orchidaceae Fructus (orchidvine_fruit)</li>
                <li>Reagent C: 2 units, Volatile Citrus (exploding_citrus)</li>
                <li>Catalyst: 1 unit, Troll-Sourced Coagulant Catalyst (troll_blood)</li>
            </ul>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Methodology</h4>
            <p class='mb-2'>The volatile energy of the citrus is used to forcibly break down the fruit's complex alkaloids into their base, universally effective components.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Outcome</h4>
            <p class='mb-2'>Grants a 20% resistance to Nature-aspected energy for 10 turns.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Addendum</h4>
            <p class='italic text-gray-400'>A rather brutish but effective method. Not my most elegant work, but the results are undeniable. A case of favoring force over finesse.</p>
        `
    },
    'brew_smitestopper': {
        tier: 3,
        output: 'smitestopper_potion',
        ingredients: { 'sundown_potion': 1, 'lantern_rose': 5, 'blood_peach': 2, 'troll_blood': 1 },
        cost: 400,
        library_description: `
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Objective</h4>
            <p class='mb-2'>To synthesize a potion that creates a field of 'metaphysical darkness,' causing photonic energy to decay on contact.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Ingredients</h4>
            <ul class='list-disc list-inside mb-2'>
                <li>Reagent A: 1 unit, Fortified Photonic Insulator (Tier 2) (sundown_potion)</li>
                <li>Reagent B: 5 units, Rosa Laterna (lantern_rose)</li>
                <li>Reagent C: 2 units, Sanguine Prunus Persica (blood_peach)</li>
                <li>Catalyst: 1 unit, Troll-Sourced Coagulant Catalyst (troll_blood)</li>
            </ul>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Methodology</h4>
            <p class='mb-2'>The life-giving properties of the Sanguine Prunus Persica are inverted through catalysis, creating an energy-devouring field instead of an energy-emitting one.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Outcome</h4>
            <p class='mb-2'>Grants a 20% resistance to Light-aspected energy for 10 turns.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Addendum</h4>
            <p class='italic text-gray-400'>One of my more ethically ambiguous creations. To turn a life-giving agent into its opposite feels... philosophically questionable. It is, however, remarkably effective.</p>
        `
    },
    'brew_voidshield': {
        tier: 3,
        output: 'voidshield_potion',
        ingredients: { 'sunrise_potion': 1, 'blackleaf': 5, 'crystal_apple': 2, 'troll_blood': 1 },
        cost: 400,
        library_description: `
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Objective</h4>
            <p class='mb-2'>To create the ultimate anti-entropic shield, reinforcing the user's existence against necrotic and void energies.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Ingredients</h4>
            <ul class='list-disc list-inside mb-2'>
                <li>Reagent A: 1 unit, Fortified Entropic Insulator (Tier 2) (sunrise_potion)</li>
                <li>Reagent B: 5 units, Folium Tenebris (blackleaf)</li>
                <li>Reagent C: 2 units, Crystalline Malus Domestica (crystal_apple)</li>
                <li>Catalyst: 1 unit, Troll-Sourced Coagulant Catalyst (troll_blood)</li>
            </ul>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Methodology</h4>
            <p class='mb-2'>The Troll-Sourced Catalyst is used to imprint the stable, ordered lattice of the Crystalline Malus Domestica onto the potion's chaotic anti-entropic field, giving it a rigid and highly durable metaphysical structure.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Outcome</h4>
            <p class='mb-2'>Grants a 20% resistance to Void-aspected energy for 10 turns.</p>
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Addendum</h4>
            <p class='italic text-gray-400'>A far more elegant solution. The ordered matrix of the Crystalline Apple provides a perfect structural framework against entropic decay. It seems Nathalie's penchant for making tarts with these apples has inspired a breakthrough in metaphysical defense. Remarkable.</p>
        `
    }
};

const WITCH_COVEN_SERVICES = {
    resetStats: { gold: 5000, hearts: 5 },
    changeRace: { gold: 10000, hearts: 10 },
    changeClass: { gold: 10000, hearts: 10 },
    changeBackground: { gold: 10000, hearts: 10 }
};

const COOKING_RECIPES = {
    // --- TIER 1: APPRENTICE'S PLATES ---
    'rabbit_roast': {
        name: 'Rabbit Roast',
        tier: 1,
        description: 'A whole roasted rabbit with root vegetables. A proper meal that strengthens your sword arm.',
        library_description: `
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Tier 1: Apprentice's Plates</h4>
            <p class='mb-2'><strong>Ingredients:</strong> 1 portion of Rabbit Meat, 2 Vegetables of your choice.</p>
            <p class='mb-2'><strong>Method:</strong> A simple roast is best. Braise the rabbit low and slow with the vegetables until the meat is tender enough to pull apart with a fork.</p>
            <p class='mb-2 italic text-gray-400'><strong>Nathalie's Note:</strong> “My dear Kiky once tried to explain the 'Maillard reaction' to me, going on about amino acids and reducing sugars. I told them it’s simpler than that: brown food tastes better. This is the first meal I ever made for them, and it’s still a favorite. It’s simple, honest, and puts some real fight back in your arms.”</p>
            <p class='mt-4'><strong>Result:</strong> A hearty meal that restores 60 HP and increases your physical damage by 5% for your next 3 encounters.</p>
        `,
        ingredients: { 'rabbit_meat': 1, 'veggie': 2 },
        effect: { 
            type: 'buff', 
            heal: 60,
            buffs: [{ stat: 'physical_damage', value: 1.05, duration: 3 }]
        }
    },
    'humming_medley': {
        name: 'Humming Veggie Medley',
        tier: 1,
        description: 'A mix of strange, vibrating flora. The low hum seems to focus your thoughts on the arcane.',
        library_description: `
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Tier 1: Apprentice's Plates</h4>
            <p class='mb-2'><strong>Ingredients:</strong> 1 Screaming Lotus, 2 Vegetables of your choice.</p>
            <p class='mb-2'><strong>Method:</strong> A quick chop and sauté in a hot pan with a bit of oil or butter is all this needs. The lotus will soften, and its hum will become a gentle background note.</p>
            <p class='mb-2 italic text-gray-400'><strong>Nathalie's Note:</strong> “Don't be put off by the humming; it's a sign that the lotus is fresh. Kiky says it’s a 'low-frequency resonance that aids synaptic focus.' I just find it helps clear my head when I’m trying to remember a complex spell rotation. A perfect side dish for any aspiring mage.”</p>
            <p class='mt-4'><strong>Result:</strong> Restores 60 HP and boosts your magical damage by 5% for 3 encounters.</p>
        `,
        ingredients: { 'screaming_lotus': 1, 'veggie': 2 },
        effect: { 
            type: 'buff', 
            heal: 60,
            buffs: [{ stat: 'magical_damage', value: 1.05, duration: 3 }]
        }
    },
    'fortifying_meat_pie': {
        name: 'Fortifying Meat Pie',
        tier: 1,
        description: 'A simple pie with a dark wheat crust. Hearty, filling, and makes you feel tougher than you are.',
        library_description: `
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Tier 1: Apprentice's Plates</h4>
            <p class='mb-2'><strong>Ingredients:</strong> 1 portion of Blackwheat, 1 portion of Meat, 1 Vegetable.</p>
            <p class='mb-2'><strong>Method:</strong> Create a simple, firm dough with the blackwheat flour. Fill with your pre-cooked meat and vegetables, seal it up, and bake until the crust is a deep, golden brown.</p>
            <p class='mb-2 italic text-gray-400'><strong>Nathalie's Note:</strong> “There’s nothing more comforting than a warm meat pie after a long journey. The blackwheat crust is wonderfully dense—Kiky calls it a 'high-density carbohydrate matrix.' I call it sturdy. It makes you feel tougher just by looking at it.”</p>
            <p class='mt-4'><strong>Result:</strong> A filling pie that restores 50 HP and increases your Max HP by 10% for 3 encounters.</p>
        `,
        ingredients: { 'blackwheat': 1, 'meat': 1, 'veggie': 1 },
        effect: { 
            type: 'buff', 
            heal: 50,
            buffs: [{ stat: 'max_hp', value: 1.10, duration: 3 }]
        }
    },
    'spiced_root_stew': {
        name: 'Spiced Root Stew',
        tier: 1,
        description: 'A stew thickened with fragrant bark, giving it a peculiar energy that expands the mind.',
        library_description: `
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Tier 1: Apprentice's Plates</h4>
            <p class='mb-2'><strong>Ingredients:</strong> 1 Cinnamonwood Log, 2 Vegetables of your choice.</p>
            <p class='mb-2'><strong>Method:</strong> Let the cinnamonwood log simmer in your stew broth for at least an hour to infuse it with its warm, fragrant energy before adding the vegetables.</p>
            <p class='mb-2 italic text-gray-400'><strong>Nathalie's Note:</strong> “Kiky uses cinnamonwood for their more… volatile alchemical formulas. I prefer to use it for this. The aroma fills the whole house and the stew itself seems to expand your spirit, making you feel full of magical potential.”</p>
            <p class='mt-4'><strong>Result:</strong> A fragrant stew that restores 50 HP and increases your Max MP by 15% for 3 encounters.</p>
        `,
        ingredients: { 'cinnamonwood_log': 1, 'veggie': 2 },
        effect: { 
            type: 'buff', 
            heal: 50,
            buffs: [{ stat: 'max_mp', value: 1.15, duration: 3 }]
        }
    },
    'hunters_lunch': {
        name: 'Hunter\'s Lunch',
        tier: 1,
        description: 'A packed lunch favored by those with sharp eyes. They swear it helps them spot treasure.',
        library_description: `
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Tier 1: Apprentice's Plates</h4>
            <p class='mb-2'><strong>Ingredients:</strong> 1 Beetsnip Carrot, 1 portion of Meat, 1 Vegetable.</p>
            <p class='mb-2'><strong>Method:</strong> This is best served as a cold packed lunch. Simply cook the components ahead of time and wrap them for the road. No fuss, no muss.</p>
            <p class='mb-2 italic text-gray-400'><strong>Nathalie's Note:</strong> “An old tracker’s secret. There’s something about the beetsnip carrot that sharpens the eyes. Kiky says it’s rich in a compound that enhances retinal perception. I just know it helps you spot things others miss—like that glint of gold in the mud.”</p>
            <p class='mt-4'><strong>Result:</strong> A practical meal that restores 40 HP and increases your chance of finding loot by 10% for 3 encounters.</p>
        `,
        ingredients: { 'beetsnip_carrot': 1, 'meat': 1, 'veggie': 1 },
        effect: { 
            type: 'buff', 
            heal: 40,
            buffs: [{ stat: 'loot_chance', value: 1.10, duration: 3 }]
        }
    },
    'travelers_skewer': {
        name: 'Traveler\'s Skewer',
        tier: 1,
        description: 'The perfect combination of lean meat and sweet veg for a long journey. Puts a spring in your step.',
        library_description: `
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Tier 1: Apprentice's Plates</h4>
            <p class='mb-2'><strong>Ingredients:</strong> 1 portion of Rabbit Meat, 1 Beetsnip Carrot, 1 Vegetable of your choice.</p>
            <p class='mb-2'><strong>Method:</strong> Cube the meat and vegetables, skewer them, and grill over an open flame until you get a nice char. Simple, fast, and perfect for a campfire.</p>
            <p class='mb-2 italic text-gray-400'><strong>Nathalie's Note:</strong> “The perfect meal for a long march. Kiky would call it 'efficient nutrient delivery for sustained locomotion.' I call it meat-and-veg-on-a-stick. It’s light, easy to eat, and really puts a spring in your step.”</p>
            <p class='mt-4'><strong>Result:</strong> A convenient meal that restores 40 HP and increases your movement speed by 1 tile for 3 encounters.</p>
        `,
        ingredients: { 'rabbit_meat': 1, 'beetsnip_carrot': 1, 'veggie': 1 },
        effect: { 
            type: 'buff', 
            heal: 40,
            buffs: [{ stat: 'movement_speed', value: 1, duration: 3 }]
        }
    },
    'sages_loaf': {
        name: 'Sage\'s Loaf',
        tier: 1,
        description: 'A dense, spiced bread that provides mental clarity, helping you learn from your mistakes.',
        library_description: `
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Tier 1: Apprentice's Plates</h4>
            <p class='mb-2'><strong>Ingredients:</strong> 1 portion of Blackwheat, 1 Cinnamonwood Log, 1 portion of Meat.</p>
            <p class='mb-2'><strong>Method:</strong> This is a heavy, dense bread that requires a good bit of kneading. Grate the cinnamonwood into the flour before you add the cooked meat. Bake in a camp oven for that perfect rustic crust.</p>
            <p class='mb-2 italic text-gray-400'><strong>Nathalie's Note:</strong> “This bread is dense enough to be a blunt weapon, but it's packed with things that are good for the mind. Kiky brings me the ingredients and says it 'enhances neural plasticity.' It's my go-to meal when I'm trying to master a new skill.”</p>
            <p class='mt-4'><strong>Result:</strong> A hearty bread that restores 30 HP and increases all your XP gains by 10% for 3 encounters.</p>
        `,
        ingredients: { 'blackwheat': 1, 'cinnamonwood_log': 1, 'meat': 1 },
        effect: { 
            type: 'buff', 
            heal: 30,
            buffs: [{ stat: 'xp_gain', value: 1.10, duration: 3 }]
        }
    },
    'hearty_grain_stew': {
        name: 'Hearty Grain Stew',
        tier: 1,
        description: 'The ultimate restorative meal for a weary adventurer, combining meat and grain for maximum effect.',
        library_description: `
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Tier 1: Apprentice's Plates</h4>
            <p class='mb-2'><strong>Ingredients:</strong> 1 portion of Rabbit Meat, 1 portion of Blackwheat, 1 Vegetable of your choice.</p>
            <p class='mb-2'><strong>Method:</strong> Simmer all ingredients together in a pot for a long time. The longer it cooks, the thicker and more savory it gets.</p>
            <p class='mb-2 italic text-gray-400'><strong>Nathalie's Note:</strong> “There's nothing like it after a long day of getting knocked around. A proper, thick stew that warms you from the inside out and knits you back together. It's like a hug in a bowl, if a hug could also heal gaping axe wounds.”</p>
            <p class='mt-4'><strong>Result:</strong> A profoundly restorative meal. Heals for 80 HP plus an extra 5% of your Max HP.</p>
        `,
        ingredients: { 'rabbit_meat': 1, 'blackwheat': 1, 'veggie': 1 },
        effect: { 
            type: 'heal_percent', 
            heal: 80,
            heal_percent: 0.05
        }
    },
    'clarifying_broth': {
        name: 'Clarifying Broth',
        tier: 1,
        description: 'A peculiar broth that hums softly. It clears the mind and refills your arcane wellspring.',
        library_description: `
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Tier 1: Apprentice's Plates</h4>
            <p class='mb-2'><strong>Ingredients:</strong> 1 Beetsnip Carrot, 1 Screaming Lotus, 1 Vegetable of your choice.</p>
            <p class='mb-2'><strong>Method:</strong> A gentle simmer is all that's needed to draw out the properties of the lotus. Strain the broth before serving it warm.</p>
            <p class='mb-2 italic text-gray-400'><strong>Nathalie's Note:</strong> “A light, simple broth for when your head is fuzzy from one too many void spells. Kiky says it's because the active compounds 'neutralize residual chaotic energies.' I just know it works when you need to focus.”</p>
            <p class='mt-4'><strong>Result:</strong> A clear broth that restores 70 HP and 10% of your Max MP.</p>
        `,
        ingredients: { 'beetsnip_carrot': 1, 'screaming_lotus': 1, 'veggie': 1 },
        effect: { 
            type: 'mana_percent', 
            heal: 70,
            mana_percent: 0.10
        }
    },
    // --- TIER 2: JOURNEYMAN'S BISTRO ---
    'spiced_wolf_steak': {
        name: 'Spiced Wolf Steak',
        tier: 2,
        description: 'Tough meat from a dire wolf, tenderized and seasoned to bring out its primal power.',
        library_description: `
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Tier 2: Journeyman's Bistro</h4>
            <p class='mb-2'><strong>Ingredients:</strong> 1 portion of Wolf Meat, 1 Vegetable of your choice, 1 Seasoning of your choice.</p>
            <p class='mb-2'><strong>Method:</strong> Dire wolf meat is tough, so you have to pound it with a mallet for a good while. Once tenderized, sear it hot and fast with your favorite spices.</p>
            <p class='mb-2 italic text-gray-400'><strong>Nathalie's Note:</strong> “Kiky once developed a fantastic 'enzymatic hydrolysis solution' to tenderize this meat. I told them a hammer works just fine. When you season it right, this steak brings out a primal strength you didn’t know you had.”</p>
            <p class='mt-4'><strong>Result:</strong> A tough but rewarding meal. Restores 50 HP and increases physical damage by 10% for 3 encounters.</p>
        `,
        ingredients: { 'wolf_meat': 1, 'veggie': 1, 'seasoning': 1 },
        effect: { 
            type: 'buff', 
            heal: 50,
            buffs: [{ stat: 'physical_damage', value: 1.10, duration: 3 }]
        }
    },
    'arcane_fruit_tart': {
        name: 'Arcane Fruit Tart',
        tier: 2,
        description: 'A sweet tart made from exotic orchidvine fruit, baked to enhance its innate magical properties.',
        library_description: `
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Tier 2: Journeyman's Bistro</h4>
            <p class='mb-2'><strong>Ingredients:</strong> 1 Orchidvine Fruit, 1 Vegetable of your choice, 1 Seasoning of your choice.</p>
            <p class='mb-2'><strong>Method:</strong> Create a simple pastry shell and fill it with the chopped orchidvine fruit. A little sugar or honey helps. Bake until the crust is golden.</p>
            <p class='mb-2 italic text-gray-400'><strong>Nathalie's Note:</strong> “Kiky gets so excited when I bring home an Orchidvine Fruit, going on about its 'complex mana-rich molecular structure.' I just think it makes a lovely, sweet tart that helps a mage feel their best after a long day of study.”</p>
            <p class='mt-4'><strong>Result:</strong> A magical dessert that restores 50 HP and boosts magical damage by 10% for 3 encounters.</p>
        `,
        ingredients: { 'orchidvine_fruit': 1, 'veggie': 1, 'seasoning': 1 },
        effect: { 
            type: 'buff', 
            heal: 50,
            buffs: [{ stat: 'magical_damage', value: 1.10, duration: 3 }]
        }
    },
    'loaded_tater': {
        name: 'Loaded Tater',
        tier: 2,
        description: 'A massive ground tater, baked and loaded with meat and spices. You feel twice as durable after eating it.',
        library_description: `
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Tier 2: Journeyman's Bistro</h4>
            <p class='mb-2'><strong>Ingredients:</strong> 1 Ground Tater, 1 portion of Meat, 1 Seasoning of your choice.</p>
            <p class='mb-2'><strong>Method:</strong> Bake the ground tater until it's fluffy inside. Split it open and stuff it with as much cooked meat and spices as it can hold.</p>
            <p class='mb-2 italic text-gray-400'><strong>Nathalie's Note:</strong> “Find the biggest tater you can for this one. It'll sit in your stomach like a rock—a very comforting, life-extending rock that makes you feel twice as durable as you really are.”</p>
            <p class='mt-4'><strong>Result:</strong> The ultimate comfort food. Restores 40 HP and increases your Max HP by 20% for 3 encounters.</p>
        `,
        ingredients: { 'ground_tater': 1, 'meat': 1, 'seasoning': 1 },
        effect: { 
            type: 'buff', 
            heal: 40,
            buffs: [{ stat: 'max_hp', value: 1.20, duration: 3 }]
        }
    },
    'calming_tea_ceremony': {
        name: 'Calming Tea Ceremony',
        tier: 2,
        description: 'A carefully prepared tea using serene lily pads. Drinking it expands your spiritual capacity.',
        library_description: `
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Tier 2: Journeyman's Bistro</h4>
            <p class='mb-2'><strong>Ingredients:</strong> 1 Sealotus Pad, 1 Vegetable of your choice, 1 Seasoning of your choice.</p>
            <p class='mb-2'><strong>Method:</strong> This is more about the ritual than the recipe. Gently steep the lily pad in hot, but not boiling, water. Serve in a small cup and drink slowly.</p>
            <p class='mb-2 italic text-gray-400'><strong>Nathalie's Note:</strong> “Sometimes, the quiet moments are the most important. This tea is a ritual Kiky and I share to clear our heads. It expands your spiritual capacity, making you feel more connected to the world's magic.”</p>
            <p class='mt-4'><strong>Result:</strong> A meditative brew that restores 40 HP and increases your Max MP by 30% for 3 encounters.</p>
        `,
        ingredients: { 'sealotus_pad': 1, 'veggie': 1, 'seasoning': 1 },
        effect: { 
            type: 'buff', 
            heal: 40,
            buffs: [{ stat: 'max_mp', value: 1.30, duration: 3 }]
        }
    },
    'lucky_greens_salad': {
        name: 'Lucky Greens Salad',
        tier: 2,
        description: 'A salad made from dandelions—a symbol of luck—and other savory bits. You just feel luckier.',
        library_description: `
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Tier 2: Journeyman's Bistro</h4>
            <p class='mb-2'><strong>Ingredients:</strong> 1 Sweet Dandelion, 1 portion of Meat, 1 Seasoning of your choice.</p>
            <p class='mb-2'><strong>Method:</strong> A simple salad. Toss the fresh dandelion greens with some cooked, chilled meat and a sharp vinaigrette.</p>
            <p class='mb-2 italic text-gray-400'><strong>Nathalie's Note:</strong> “Dandelions are a symbol of luck, you know. Kiky scoffs at superstition, but even they can't deny that things just seem to go better after I serve this salad. Coincidence? I think not.”</p>
            <p class='mt-4'><strong>Result:</strong> A fortunate dish. Restores 30 HP and increases your chance of finding loot by 20% for 3 encounters.</p>
        `,
        ingredients: { 'sweet_dandelion': 1, 'meat': 1, 'seasoning': 1 },
        effect: { 
            type: 'buff', 
            heal: 30,
            buffs: [{ stat: 'loot_chance', value: 1.20, duration: 3 }]
        }
    },
    'fiery_meat_platter': {
        name: 'Fiery Meat Platter',
        tier: 2,
        description: 'An assortment of meats, all coated in a searing jet pepper sauce. It\'ll make you run for your life.',
        library_description: `
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Tier 2: Journeyman's Bistro</h4>
            <p class='mb-2'><strong>Ingredients:</strong> 1 Jet Pepper, 2 portions of Meat, 1 Vegetable of your choice.</p>
            <p class='mb-2'><strong>Method:</strong> Create a searing sauce with the jet pepper and coat your cooked meats in it. Serve with a side of cooling vegetables.</p>
            <p class='mb-2 italic text-gray-400'><strong>Nathalie's Note:</strong> “The heat from a jet pepper is no joke. Kiky says it triggers a 'fight-or-flight response.' I say it makes you want to run for your life, in a good way! Puts some serious speed in your boots.”</p>
            <p class='mt-4'><strong>Result:</strong> A spicy challenge. Restores 30 HP and increases your movement speed by 2 tiles for 3 encounters.</p>
        `,
        ingredients: { 'jet_pepper': 1, 'meat': 2, 'veggie': 1 },
        effect: { 
            type: 'buff', 
            heal: 30,
            buffs: [{ stat: 'movement_speed', value: 2, duration: 3 }]
        }
    },
    'focusing_stir_fry': {
        name: 'Focusing Stir-fry',
        tier: 2,
        description: 'A pungent, aromatic stir-fry that sharpens the mind to a razor\'s edge, making every action a lesson.',
        library_description: `
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Tier 2: Journeyman's Bistro</h4>
            <p class='mb-2'><strong>Ingredients:</strong> 1 Koriandre Sprig, 1 portion of Meat, 2 Vegetables of your choice.</p>
            <p class='mb-2'><strong>Method:</strong> A very hot pan and a quick toss is all you need. Add the fragrant koriandre at the very end to preserve its aroma.</p>
            <p class='mb-2 italic text-gray-400'><strong>Nathalie's Note:</strong> “The pungent aroma of koriandre clears the sinuses and the mind. Kiky says it 'stimulates the prefrontal cortex.' I find it just makes it easier to pay attention, which is invaluable when you're trying to learn from your mistakes in a fight.”</p>
            <p class='mt-4'><strong>Result:</strong> A sharp and aromatic meal. Restores 20 HP and increases your XP gains by 20% for 3 encounters.</p>
        `,
        ingredients: { 'koriandre_sprig': 1, 'meat': 1, 'veggie': 2 },
        effect: { 
            type: 'buff', 
            heal: 20,
            buffs: [{ stat: 'xp_gain', value: 1.20, duration: 3 }]
        }
    },
    'restorative_bird_soup': {
        name: 'Restorative Bird Soup',
        tier: 2,
        description: 'The ultimate comfort food. This chicken soup is renowned for its ability to mend wounds and lift the spirits.',
        library_description: `
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Tier 2: Journeyman's Bistro</h4>
            <p class='mb-2'><strong>Ingredients:</strong> 1 portion of Chicken Meat, 2 Vegetables of your choice, 1 Seasoning of your choice.</p>
            <p class='mb-2'><strong>Method:</strong> Simmer the cockatrice meat for a very long time to create a rich, golden broth. Add finely chopped vegetables.</p>
            <p class='mb-2 italic text-gray-400'><strong>Nathalie's Note:</strong> “This is my masterpiece for when Kiky's been cooped up in the lab for too long and forgets to eat. It's comfort in a bowl that can mend wounds and lift even the most scientifically-minded spirits.”</p>
            <p class='mt-4'><strong>Result:</strong> A true cure-all. Heals for 70 HP plus an extra 15% of your Max HP.</p>
        `,
        ingredients: { 'chicken_meat': 1, 'veggie': 2, 'seasoning': 1 },
        effect: { 
            type: 'heal_percent', 
            heal: 70,
            heal_percent: 0.15
        }
    },
    'salty_seafood_stew': {
        name: 'Salty Seafood Stew',
        tier: 2,
        description: 'A stew made with brineflower leaves that tastes of the sea, restoring the flow of your inner energies.',
        library_description: `
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Tier 2: Journeyman's Bistro</h4>
            <p class='mb-2'><strong>Ingredients:</strong> 1 Brineflower Leaf, 1 portion of Meat, 2 Vegetables of your choice.</p>
            <p class='mb-2'><strong>Method:</strong> The brineflower leaf is salty enough on its own, so be careful with other seasonings. Simmer it with the meat and vegetables for a taste of the sea.</p>
            <p class='mb-2 italic text-gray-400'><strong>Nathalie's Note:</strong> “This stew restores your inner flow, washing away fatigue and refilling your arcane wellspring. It's a favorite of Kiky's after they've spent all their magic on a particularly complex experiment.”</p>
            <p class='mt-4'><strong>Result:</strong> A taste of the ocean. Restores 60 HP and 20% of your Max MP.</p>
        `,
        ingredients: { 'brineflower_leaf': 1, 'meat': 1, 'veggie': 2 },
        effect: { 
            type: 'mana_percent', 
            heal: 60,
            mana_percent: 0.20
        }
    },
    // --- TIER 3: MASTER CHEF'S CREATIONS ---
    'steak_of_divine_power': {
        name: 'Steak of Divine Power',
        tier: 3,
        description: 'A fillet of unicorn meat, its natural magic channeled into a meal that grants immense physical might.',
        library_description: `
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Tier 3: Master Chef's Creations</h4>
            <p class='mb-2'><strong>Ingredients:</strong> 1 portion of Horse Meat, 2 Vegetables of your choice, 1 Seasoning of your choice.</p>
            <p class='mb-2'><strong>Method:</strong> You must cook unicorn meat with respect. A simple, perfect sear in a hot pan is all it needs. Do not overcook it.</p>
            <p class='mb-2 italic text-gray-400'><strong>Nathalie's Note:</strong> “Kiky has a twenty-page paper on the 'bio-celestial energy' inherent in unicorn tissue. I have a simpler take: eating this steak makes you strong enough to punch a mountain in half. It is a meal for heroes.”</p>
            <p class='mt-4'><strong>Result:</strong> A truly magical meal. Restores 40 HP and increases physical damage by 15% for 3 encounters.</p>
        `,
        ingredients: { 'horse_meat': 1, 'veggie': 2, 'seasoning': 1 },
        effect: { 
            type: 'buff', 
            heal: 40,
            buffs: [{ stat: 'physical_damage', value: 1.15, duration: 3 }]
        }
    },
    'crystalline_energy_tart': {
        name: 'Crystalline Energy Tart',
        tier: 3,
        description: 'A beautiful tart whose crystalline apple filling hums with raw magical power.',
        library_description: `
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Tier 3: Master Chef's Creations</h4>
            <p class='mb-2'><strong>Ingredients:</strong> 1 Crystal Apple, 2 Vegetables of your choice, 1 Seasoning of your choice.</p>
            <p class='mb-2'><strong>Method:</strong> The challenge is to bake the tart without dissolving the apple's delicate crystalline structure. A low, gentle heat is key.</p>
            <p class='mb-2 italic text-gray-400'><strong>Nathalie's Note:</strong> “This tart is almost too beautiful to eat. Kiky helped me perfect the baking process to preserve what they call the apple's 'arcane matrix.' The result is a dessert that makes any spellcaster feel like an archmage.”</p>
            <p class='mt-4'><strong>Result:</strong> A work of art. Restores 40 HP and boosts magical damage by 15% for 3 encounters.</p>
        `,
        ingredients: { 'crystal_apple': 1, 'veggie': 2, 'seasoning': 1 },
        effect: { 
            type: 'buff', 
            heal: 40,
            buffs: [{ stat: 'magical_damage', value: 1.15, duration: 3 }]
        }
    },
    'livyatans_grand_steak': {
        name: 'Livyatan\'s Grand Steak',
        tier: 3,
        description: 'A steak from a beast that exists between dimensions. Eating it grants you a sliver of its colossal vitality.',
        library_description: `
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Tier 3: Master Chef's Creations</h4>
            <p class='mb-2'><strong>Ingredients:</strong> 1 portion of Whale Meat, 1 Vegetable of your choice, 2 Seasonings of your choice.</p>
            <p class='mb-2'><strong>Method:</strong> It takes three days to cook a steak this big, and you'll need a crane to flip it. It's a project, but the result is a meal infused with the vitality of a beast that exists between dimensions.</p>
            <p class='mb-2 italic text-gray-400'><strong>Nathalie's Note:</strong> “Kiky spent a month just analyzing the properties of this meat. My discovery was simpler: it tastes incredible, and it makes you feel as vast and immortal as the beast it came from.”</p>
            <p class='mt-4'><strong>Result:</strong> A colossal meal for a colossal hero. Restores 30 HP and increases your Max HP by 30% for 3 encounters.</p>
        `,
        ingredients: { 'whale_meat': 1, 'veggie': 1, 'seasoning': 2 },
        effect: { 
            type: 'buff', 
            heal: 30,
            buffs: [{ stat: 'max_hp', value: 1.30, duration: 3 }]
        }
    },
    'nectar_of_the_soul': {
        name: 'Nectar of the Soul',
        tier: 3,
        description: 'A dessert made from a blood peach, which vastly deepens the user\'s spiritual reservoir.',
        library_description: `
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Tier 3: Master Chef's Creations</h4>
            <p class='mb-2'><strong>Ingredients:</strong> 1 Blood Peach, 1 Vegetable of your choice, 2 Seasonings of your choice.</p>
            <p class='mb-2'><strong>Method:</strong> Best served fresh, with a light dusting of spice to complement its deep, rich flavor. To cook it is to waste its perfection.</p>
            <p class='mb-2 italic text-gray-400'><strong>Nathalie's Note:</strong> “This dessert, made from a single, perfect blood peach, deepens your spiritual reservoir in a way that's hard to describe. It's the kind of clarity that mages spend their whole lives seeking, found in one perfect piece of fruit.”</p>
            <p class='mt-4'><strong>Result:</strong> The food of the gods. Restores 30 HP and increases your Max MP by 45% for 3 encounters.</p>
        `,
        ingredients: { 'blood_peach': 1, 'veggie': 1, 'seasoning': 2 },
        effect: { 
            type: 'buff', 
            heal: 30,
            buffs: [{ stat: 'max_mp', value: 1.45, duration: 3 }]
        }
    },
    'feast_of_fortune': {
        name: 'Feast of Fortune',
        tier: 3,
        description: 'A grand platter centered around the jewel-like corn of the Maizemother, said to attract immense fortune.',
        library_description: `
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Tier 3: Master Chef's Creations</h4>
            <p class='mb-2'><strong>Ingredients:</strong> 1 Maizemother Cob, 1 portion of Meat, 1 Vegetable of your choice, 1 Seasoning of your choice.</p>
            <p class='mb-2'><strong>Method:</strong> This is a grand platter. The Maizemother cob, with its jewel-like kernels, should be the centerpiece, surrounded by the finest roasted meats and vegetables.</p>
            <p class='mb-2 italic text-gray-400'><strong>Nathalie's Note:</strong> “They say the Maizemother only grows where fortune has pooled. Kiky calls this 'statistically improbable,' but I say eating this meal is like inviting that good luck into your own life. You'll be amazed what treasures you find.”</p>
            <p class='mt-4'><strong>Result:</strong> A bountiful feast. Restores 20 HP and increases your chance of finding loot by 30% for 3 encounters.</p>
        `,
        ingredients: { 'maizemother_cob': 1, 'meat': 1, 'veggie': 1, 'seasoning': 1 },
        effect: { 
            type: 'buff', 
            heal: 20,
            buffs: [{ stat: 'loot_chance', value: 1.30, duration: 3 }]
        }
    },
    'alacrity_sorbet': {
        name: 'Alacrity Sorbet',
        tier: 3,
        description: 'A perpetually cold sorbet that infuses your muscles with an unnatural, chilling speed.',
        library_description: `
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Tier 3: Master Chef's Creations</h4>
            <p class='mb-2'><strong>Ingredients:</strong> 1 Ice Cherry, 1 Vegetable of your choice, 1 portion of Meat, 1 Seasoning of your choice.</p>
            <p class='mb-2'><strong>Method:</strong> The cherries must be crushed and churned quickly before their innate coldness is lost. It's a race against time.</p>
            <p class='mb-2 italic text-gray-400'><strong>Nathalie's Note:</strong> “A perpetually cold sorbet that infuses your muscles with an unnatural, chilling speed. Kiky calls it a 'temporary nervous system accelerant.' I say it makes you fast enough to dodge raindrops, or at least a very slow sword.”</p>
            <p class='mt-4'><strong>Result:</strong> A chillingly effective dessert. Restores 20 HP and increases your movement speed by 3 tiles for 3 encounters.</p>
        `,
        ingredients: { 'ice_cherry': 1, 'veggie': 1, 'meat': 1, 'seasoning': 1 },
        effect: { 
            type: 'buff', 
            heal: 20,
            buffs: [{ stat: 'movement_speed', value: 3, duration: 3 }]
        }
    },
    'mindfire_curry': {
        name: 'Mindfire Curry',
        tier: 3,
        description: 'A curry so impossibly hot it burns away all unnecessary thoughts, leaving only pure, instinctual learning.',
        library_description: `
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Tier 3: Master Chef's Creations</h4>
            <p class='mb-2'><strong>Ingredients:</strong> 1 Dragon Chili, 2 portions of Meat, 2 Vegetables of your choice.</p>
            <p class='mb-2'><strong>Method:</strong> This curry should be simmered until the pot itself seems to glow with heat. Not for the faint of heart.</p>
            <p class='mb-2 italic text-gray-400'><strong>Nathalie's Note:</strong> “This isn't food; it's a crucible. The dragon chili will burn away everything—your regrets, your fears, your ability to feel your own tongue. All that's left is a state of pure, instinctual learning.”</p>
            <p class='mt-4'><strong>Result:</strong> A trial by fire. Restores 10 HP and increases your XP gains by 30% for 3 encounters.</p>
        `,
        ingredients: { 'dragon_chili': 1, 'meat': 2, 'veggie': 2 },
        effect: { 
            type: 'buff', 
            heal: 10,
            buffs: [{ stat: 'xp_gain', value: 1.30, duration: 3 }]
        }
    },
    'phoenix_down_roast': {
        name: 'Phoenix Down Roast',
        tier: 3,
        description: 'A legendary combination of magical meat and life-giving fruit, this meal can bring one back from the brink.',
        library_description: `
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Tier 3: Master Chef's Creations</h4>
            <p class='mb-2'><strong>Ingredients:</strong> 1 portion of Horse Meat, 1 Blood Peach, 2 Vegetables of your choice, 1 Seasoning of your choice.</p>
            <p class='mb-2'><strong>Method:</strong> A slow roast, with the meat constantly basted in the juices of the blood peach. A legendary combination of magical meat and life-giving fruit.</p>
            <p class='mb-2 italic text-gray-400'><strong>Nathalie's Note:</strong> “Kiky and I worked on this one together—my cooking, their alchemical knowledge of how these ingredients interact. The result is a meal that can truly bring an adventurer back from the brink of death. I’m very proud of this one.”</p>
            <p class='mt-4'><strong>Result:</strong> The ultimate revival meal. Heals for 50 HP plus a massive 25% of your Max HP.</p>
        `,
        ingredients: { 'horse_meat': 1, 'blood_peach': 1, 'veggie': 2, 'seasoning': 1 },
        effect: { 
            type: 'heal_percent', 
            heal: 50,
            heal_percent: 0.25
        }
    },
    'abyssal_ambrosia': {
        name: 'Abyssal Ambrosia',
        tier: 3,
        description: 'The essence of a dimensional beast and a crystal apple, blended into a food that restores the deepest wells of magic.',
        library_description: `
            <h4 class='font-bold text-lg text-yellow-300 mb-2'>Tier 3: Master Chef's Creations</h4>
            <p class='mb-2'><strong>Ingredients:</strong> 1 portion of Whale Meat, 1 Crystal Apple, 2 Vegetables of your choice, 1 Seasoning of your choice.</p>
            <p class='mb-2'><strong>Method:</strong> The dimensional meat must be rendered down into a broth, in which the crystal apple is gently poached. This blends the essence of a dimensional beast and a crystal apple into a food that restores the deepest wells of magic.</p>
            <p class='mb-2 italic text-gray-400'><strong>Nathalie's Note:</strong> “This was another collaboration. Kiky was fascinated by the idea of combining two such potent magical ingredients. The result is a dish that tastes like the cosmos itself, granting a momentary connection to the raw source of all arcane power.”</p>
            <p class='mt-4'><strong>Result:</strong> Food for an archmage. Restores 40 HP and an incredible 30% of your Max MP.</p>
        `,
        ingredients: { 'whale_meat': 1, 'crystal_apple': 1, 'veggie': 2, 'seasoning': 1 },
        effect: { 
            type: 'mana_percent', 
            heal: 40,
            mana_percent: 0.30
        }
    }
};


