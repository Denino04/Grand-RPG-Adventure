// casino_data.js
const DECK_DEFINITIONS = {
    'base_deck': {
        name: "Standard Deck",
        description: "A standard 52-card deck. Balanced and predictable.",
        composition: {
            values: ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'],
            suits: ['♠', '♥', '♦', '♣']
        }
    },
    'pebble_deck': {
        name: "Pebble Deck",
        description: "Contains only low-value cards (A, 2-7). Hard to bust, harder to win.",
        composition: {
            values: ['A', '2', '3', '4', '5', '6', '7'],
            suits: ['♠', '♥', '♦', '♣']
        }
    },
    'unstable_deck': {
        name: "Unstable Deck (Odd)",
        description: "Contains only Odd-valued cards (A, 3, 5, 7, 9, Q). No 10-value cards.",
        composition: {
            values: ['A', '3', '5', '7', '9', 'Q'],
            suits: ['♠', '♥', '♦', '♣']
        }
    },
    'stable_deck': {
        name: "Stable Deck (Even)",
        description: "Contains only Even-valued cards (2, 4, 6, 8, 10, J, K). No Aces.",
        composition: {
            values: ['2', '4', '6', '8', '10', 'J', 'K'],
            suits: ['♠', '♥', '♦', '♣']
        }
    },
    'greed_deck': {
        name: "Greed Deck",
        description: "Contains only high-value cards (A, 7-K). Hitting is a deadly gamble.",
        composition: {
            values: ['A', '7', '8', '9', '10', 'J', 'Q', 'K'],
            suits: ['♠', '♥', '♦', '♣']
        }
    },
    'blighted_deck': {
        name: "Blighted Deck",
        description: "A 52-card deck tainted with 4 'Blight' cards. Blight is worth 0, but causes the next card drawn to double its value.",
        composition: {
            values: ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'],
            suits: ['♠', '♥', '♦', '♣'],
            special_cards: [
                { id: 'blight', value: 'Blight', suit: 'Special', weight: 0, count: 4 }
            ]
        }
    },
    'glass_deck': {
        name: "Glass Deck (All or Nothing)",
        description: "A 32-card deck containing only 16 Aces and 16 10-value cards. No Jokers.",
        composition: {
            values: ['A', '10', 'J', 'Q', 'K'],
            suits: ['♠', '♥', '♦', '♣'],
            card_multipliers: { 'A': 4 } // 4x Aces, 1x 10-cards = 16 of each
        }
    }
};

const ANTE_STRUCTURE = [
    // --- Ante 1 (Intro) - UNTOUCHED ---
    { 
        anteName: "The Entryway",
        cashOutReward: 1000,
        vingtUns: [
            { name: 'Petit', chipsToWin: 50, hands: 5, rerolls: 3 },
            { name: 'Grand', chipsToWin: 100, hands: 5, rerolls: 3 },
            { name: 'Patron', chipsToWin: 200, hands: 5, rerolls: 3, patronSkillPool: ['Escalating Stakes', 'Ace in the Hole'] }
        ]
    },
    // --- Ante 2 (Scaled) ---
    { 
        anteName: "The Double Down",
        cashOutReward: 3000,
        vingtUns: [
            { name: 'Petit', chipsToWin: 200, hands: 5, rerolls: 3 },
            { name: 'Grand', chipsToWin: 400, hands: 5, rerolls: 3 },
            { name: 'Patron', chipsToWin: 800, hands: 5, rerolls: 3, patronSkillPool: ['High Roller Intuition', 'Perfect Start', 'Golden Hand'] }
        ]
    },
    // --- Ante 3 (Scaled) ---
    { 
        anteName: "The High Table",
        cashOutReward: 6000,
        vingtUns: [
            { name: 'Petit', chipsToWin: 500, hands: 4, rerolls: 3 },
            { name: 'Grand', chipsToWin: 1000, hands: 4, rerolls: 3 },
            { name: 'Patron', chipsToWin: 2000, hands: 4, rerolls: 3, patronSkillPool: ['Mulligan', 'The Sixth Card', 'MultPerAnte'] }
        ]
    },
    // --- Ante 4 (Scaled) ---
    { 
        anteName: "The Turn",
        cashOutReward: 10000,
        vingtUns: [
            { name: 'Petit', chipsToWin: 1000, hands: 4, rerolls: 3 },
            { name: 'Grand', chipsToWin: 2000, hands: 4, rerolls: 3 },
            { name: 'Patron', chipsToWin: 4000, hands: 4, rerolls: 3, patronSkillPool: ['Escalating Stakes', 'Minor Miscalculation', 'Shopaholic'] }
        ]
    },
    // --- Ante 5 (Scaled) ---
    { 
        anteName: "The River",
        cashOutReward: 15000,
        vingtUns: [
            { name: 'Petit', chipsToWin: 2000, hands: 4, rerolls: 2 },
            { name: 'Grand', chipsToWin: 4000, hands: 4, rerolls: 2 },
            { name: 'Patron', chipsToWin: 8000, hands: 4, rerolls: 2, patronSkillPool: ['High Roller Intuition', 'Jester Gambit', 'Golden Hand'] }
        ]
    },
    // --- Ante 6 (Scaled) ---
    { 
        anteName: "The All-In",
        cashOutReward: 22000,
        vingtUns: [
            { name: 'Petit', chipsToWin: 4000, hands: 4, rerolls: 2 },
            { name: 'Grand', chipsToWin: 8000, hands: 4, rerolls: 2 },
            { name: 'Patron', chipsToWin: 16000, hands: 4, rerolls: 2, patronSkillPool: ['Perfect Start', 'The Sixth Card', 'Arcane Overcharge'] }
        ]
    },
    // --- Ante 7 (Scaled) ---
    { 
        anteName: "The Shark Tank",
        cashOutReward: 30000,
        vingtUns: [
            { name: 'Petit', chipsToWin: 8000, hands: 3, rerolls: 2 },
            { name: 'Grand', chipsToWin: 16000, hands: 3, rerolls: 2 },
            { name: 'Patron', chipsToWin: 32000, hands: 3, rerolls: 2, patronSkillPool: ['Minor Miscalculation', 'Mulligan', 'Polychrome'] }
        ]
    },
    // --- Ante 8 (Scaled) ---
    { 
        anteName: "The House Always Wins",
        cashOutReward: 50000,
        vingtUns: [
            { name: 'Petit', chipsToWin: 15000, hands: 3, rerolls: 1 },
            { name: 'Grand', chipsToWin: 30000, hands: 3, rerolls: 1 },
            { name: 'Patron', chipsToWin: 60000, hands: 3, rerolls: 1, patronSkillPool: ['Escalating Stakes', 'Jester Gambit', 'Joker Wild'] }
        ]
    }
];

const BJ_CONJURE_PACKS = {
    'pack_small': {
        name: "Glimpse Fate",
        desc: "The shaman conjures 3 random cards from the ether. You may choose 1 to add to your deck.",
        cost: 5,
        conjure: 3,
        choose: 1,
        type: 'conjure', // <-- ADD THIS
        rarity: 1,       // <-- ADD THIS (Common)
        flavor: "The shaman parts the veil for but a moment..." // <-- ADDED FLAVOR
    },
    'pack_medium': {
        name: "Read the Tapestry",
        desc: "The shaman reveals 5 strands of fate. You may choose 2 to weave into your deck.",
        cost: 8,
        conjure: 5,
        choose: 2,
        type: 'conjure', // <-- ADD THIS
        rarity: 2,       // <-- ADD THIS (Uncommon)
        flavor: "The threads of destiny are laid bare for you to see." // <-- ADDED FLAVOR
    },
    'pack_large': {
        name: "Seize Destiny",
        desc: "The shaman parts the veil, revealing 8 potential paths. You may seize 3 to bind to your deck.",
        cost: 12,
        conjure: 8,
        choose: 3,
        type: 'conjure', // <-- ADD THIS
        rarity: 3,       // <-- ADD THIS (Rare)
        flavor: "Fate is not a river, but a sea. Choose your current." // <-- ADDED FLAVOR
    }
};

const BJ_ARCANA_PACKS = {
    'pack_arcana_small': {
        name: "Minor Arcana",
        desc: "The shaman reveals 2 Arcana. You may choose 1 to bind to your fate.",
        cost: 10,
        conjure: 2,
        choose: 1,
        type: 'arcana_pack',
        rarity: 2, // Uncommon
        flavor: "A small glimpse into the patterns of power."
    },
    'pack_arcana_medium': {
        name: "Major Arcana",
        desc: "The shaman reveals 3 Arcana. You may choose 1 to bind to your fate.",
        cost: 15,
        conjure: 3,
        choose: 1,
        type: 'arcana_pack',
        rarity: 3, // Rare
        flavor: "The threads of destiny are clearer now."
    },
    'pack_arcana_large': {
        name: "True Arcana",
        desc: "The shaman reveals 5 Arcana. You may choose 1 to bind to your fate.",
        cost: 20,
        conjure: 5,
        choose: 1,
        type: 'arcana_pack',
        rarity: 4, // Epic
        flavor: "The full, unbridled truth of the cards is laid bare."
    }
};

const BJ_ARCANA_RITUALS = {
    // --- Enhancements (Pick one card) ---
    'arcana_strength': {
        name: 'Arcana VIII: Strength',
        desc: '(Enhancement) Choose one card in your deck. It permanently grants +50 Base Chips when played.',
        cost: 7, type: 'arcana', rarity: 2, subType: 'enhancement',
        apply: (card) => { card.ability = 'strength'; card.abilityName = 'Enhanced'; },
        flavor: '"Inner Power."'
    },
    'arcana_emperor': {
        name: 'Arcana IV: The Emperor',
        desc: '(Enhancement) Enhance 1 Face Card (J,Q,K). It permanently grants double its Base Chip value (+10 Chips) when scored.',
        cost: 8, type: 'arcana', rarity: 3, subType: 'enhancement',
        apply: (card) => { card.ability = 'emperor'; card.abilityName = 'Imperial'; },
        flavor: '"Authority."'
    },
    'arcana_star': {
        name: 'Arcana XVII: The Star',
        desc: '(Enhancement) Choose one card in your deck. It permanently grants +4 Multiplier when played.',
        cost: 7, type: 'arcana', rarity: 2, subType: 'enhancement',
        apply: (card) => { card.ability = 'star'; card.abilityName = 'Illuminated'; },
        flavor: '"Guiding Light."'
    },
    'arcana_justice': {
        name: 'Arcana XI: Justice',
        desc: '(Ritual) Choose 2 cards. They are now considered both a Face Card (Royal) and a Non-Face Card (Peasant) for all passive checks.',
        cost: 8, type: 'arcana', rarity: 2, subType: 'ritual_pick_2_enhance',
        apply: (card) => { card.ability = 'justice'; card.abilityName = 'Balanced'; },
        flavor: '"Balance."'
    },
    'arcana_chariot': {
        name: 'Arcana VII: The Chariot',
        desc: '(Enhancement) Choose one card. When played, it grants +5 Base Chips for every Hand remaining in this Vingt-un.',
        cost: 7, type: 'arcana', rarity: 2, subType: 'enhancement',
        apply: (card) => { card.ability = 'chariot'; card.abilityName = 'Driven'; },
        flavor: '"Momentum."'
    },
    'arcana_sun': {
        name: 'Arcana XIX: The Sun',
        desc: '(Enhancement) Choose one card. It permanently applies a x2 Multiplier when played.',
        cost: 10, type: 'arcana', rarity: 3, subType: 'enhancement',
        apply: (card) => { card.ability = 'sun'; card.abilityName = 'Solar'; },
        flavor: '"Radiance."'
    },
    'arcana_devil': {
        name: 'Arcana XV: The Devil',
        desc: '(Enhancement) Choose one card. It is now considered a Joker for all passive checks, but retains its original value.',
        cost: 10, type: 'arcana', rarity: 3, subType: 'enhancement',
        apply: (card) => { card.ability = 'devil'; card.abilityName = 'Masked'; },
        flavor: '"The Mask."'
    },
    'arcana_wheel': {
        name: 'Arcana X: Wheel of Fortune',
        desc: '(Enhancement) Choose one card. It grants +10 Multiplier, but has a 10% chance to be destroyed after being played in a winning hand.',
        cost: 9, type: 'arcana', rarity: 3, subType: 'enhancement',
        apply: (card) => { card.ability = 'wheel'; card.abilityName = 'Gambled'; },
        flavor: '"A Great Gamble."'
    },
    'arcana_hermit': {
        name: 'Arcana IX: The Hermit',
        desc: '(Enhancement) Choose one card. It grants +15 Multiplier, but only if it is the only card of its suit in your hand when scored.',
        cost: 9, type: 'arcana', rarity: 3, subType: 'enhancement',
        apply: (card) => { card.ability = 'hermit'; card.abilityName = 'Solitary'; },
        flavor: '"Isolation."'
    },
    'arcana_judgement': {
        name: 'Arcana XX: Judgement',
        desc: '(Enhancement) Choose one card. It grants +8 Multiplier, but only if your hand contains a Poker Hand (Pair, Straight, etc.).',
        cost: 10, type: 'arcana', rarity: 3, subType: 'enhancement',
        apply: (card) => { card.ability = 'judgement'; card.abilityName = 'Judged'; },
        flavor: '"The Final Call."'
    },
    'arcana_tower': {
        name: 'Arcana XVI: The Tower',
        desc: '(Enhancement) Enhance 1 card. It transforms into a "Rock Card". Rocks are not part of any suit, have a value of 10, and grant +20 Base Chips.',
        cost: 8, type: 'arcana', rarity: 3, subType: 'enhancement',
        apply: (card) => { card.ability = 'tower_rock'; card.abilityName = 'Rock'; },
        flavor: '"Upheaval."'
    },
    'arcana_hanged_man': {
        name: 'Arcana XII: The Hanged Man',
        desc: '(Enhancement) Choose one card. When in your hand, it grants +1 Multiplier for every card left in the Shared Pool when you Stand.',
        cost: 9, type: 'arcana', rarity: 3, subType: 'enhancement',
        apply: (card) => { card.ability = 'hanged_man'; card.abilityName = 'Bound'; },
        flavor: '"Perspective."'
    },
    'arcana_moon': {
        name: 'Arcana XVIII: The Moon',
        desc: '(Enhancement) Choose one card. If this card remains in the Shared Pool at the end of a hand, it re-triggers the "on-play" abilities of all Enhanced cards in your scored hand.',
        cost: 14, type: 'arcana', rarity: 4, subType: 'enhancement',
        apply: (card) => { card.ability = 'moon'; card.abilityName = 'Spectral'; },
        flavor: '"Illusion."'
    },
    'arcana_world': {
        name: 'Arcana XXI: The World',
        desc: '(Enhancement) Choose one card. It is now Polychrome, considered to be all four suits (♠, ♥, ♦, ♣) simultaneously.',
        cost: 12, type: 'arcana', rarity: 4, subType: 'enhancement',
        apply: (card) => { card.ability = 'world'; card.abilityName = 'Polychrome'; },
        flavor: '"Completion."'
    },

    // --- Rituals (Deck-wide / Pick multiple) ---
    'arcana_fool': {
        name: 'Arcana 0: The Fool',
        desc: '(Ritual) Choose one card in your deck to permanently erase from your run. Gain 10 Crookards and +1 Reroll for this Vingt-un.',
        cost: 3, type: 'arcana', rarity: 1, subType: 'ritual_pick_1_erase',
        flavor: '"A New Beginning."'
    },
    'arcana_magician_up': {
        name: 'Arcana I: The Magician (Ascendant)',
        desc: '(Ritual) Choose 2 Number cards (2-10). They transform into random Face cards (J, Q, K) of the same suit.',
        cost: 6, type: 'arcana', rarity: 2, subType: 'ritual_pick_2_transform_up',
        flavor: '"Transformation."'
    },
    'arcana_magician_down': {
        name: 'Arcana I: The Magician (Descendant)',
        desc: '(Ritual) Choose 2 Face cards (J, Q, K). They transform into random Number cards (2-10) of the same suit.',
        cost: 6, type: 'arcana', rarity: 2, subType: 'ritual_pick_2_transform_down',
        flavor: '"Reversion."'
    },
    'arcana_lovers': {
        name: 'Arcana VI: The Lovers',
        desc: '(Ritual) Choose two cards in your deck. They become Lovers. If both are in your hand when you score, gain +100 Chips and +10 Mult.',
        cost: 10, type: 'arcana', rarity: 3, subType: 'ritual_pick_2_pair',
        flavor: '"A Fated Pair."'
    },
    'arcana_empress': {
        name: 'Arcana III: The Empress',
        desc: '(Ritual) Choose one card in your deck. Add two copies of that card to your deck.',
        cost: 10, type: 'arcana', rarity: 3, subType: 'ritual_pick_1_copy_2',
        flavor: '"Abundance."'
    },
    'arcana_death': {
        name: 'Arcana XIII: Death',
        desc: '(Ritual) Choose up to 4 cards in your deck to permanently erase from your run.',
        cost: 8, type: 'arcana', rarity: 3, subType: 'ritual_pick_4_erase',
        flavor: '"Culling."'
    },
    'arcana_hierophant': {
        name: 'Arcana V: The Hierophant',
        desc: '(Ritual) Choose 3 Number cards (A, 2-10). They permanently grant double their Base Chip value when scored.',
        cost: 12, type: 'arcana', rarity: 4, subType: 'ritual_pick_3_double_chips',
        flavor: '"Tradition."'
    },
    'arcana_temperance': {
        name: 'Arcana XIV: Temperance',
        desc: '(Ritual) Choose two cards in your deck. They are destroyed and fused into a new "Chimeric" card with their combined Base Chip values.',
        cost: 12, type: 'arcana', rarity: 4, subType: 'ritual_pick_2_fuse',
        flavor: '"Fusion."'
    },
    
    // --- Rituals (Immediate Effect, No Choice) ---
    'arcana_high_priestess': {
        name: 'Arcana II: The High Priestess',
        desc: '(Enhancement) Choose one card. While this "Blessed" card is in your hand (or the Dealer\'s hand), that hand cannot Bust. Scoring 21+ will instead immediately force a Stand.',
        cost: 15, type: 'arcana', rarity: 4, subType: 'enhancement',
        apply: (card) => { card.ability = 'priestess'; card.abilityName = 'Blessed'; },
        flavor: '"Hidden Knowledge."'
    }
};


const PATRON_SKILLS = {
    // --- Rare (Rarity 3) ---
    'Escalating Stakes': {
        name: 'Escalating Stakes',
        desc: 'At the start of each new Ante (including this one), gain a permanent +1 base Multiplier for the rest of the run. (Cumulative)',
        flavor: "The Patron is impressed. 'Your continued success is... amusing. I shall raise the stakes, making your victories all the more potent.'",
        rarity: 3
    },
    'High Roller Intuition': {
        name: 'High Roller Intuition',
        desc: 'Doubles the chip bonus from all Poker Hands (Pair, Two Pair, 3-of-a-Kind, etc.).',
        flavor: "'You no longer see just cards; you see the patterns of fate. The connections between pairs and triplets now grant you double their usual power.'",
        rarity: 3
    },
    'Ace in the Hole': {
        name: 'Ace in the Hole',
        desc: 'Every hand that includes at least one Ace (used as 1 or 11) gets +50 Base Chips.',
        flavor: "'The Ace, the card of beginnings and ends. You\'ve learned to channel its duality, drawing raw chips from its very presence in your hand.'",
        rarity: 3
    },
    'Perfect Start': {
        name: 'Perfect Start',
        desc: 'The first hand of every Vingt-un (Petit, Grand, and Patron) does not consume one of your "Hands Left."',
        flavor: "'The Patron grants you a moment of clarity. Your first gambit in any Vingt-un is a 'free lesson,' costing you nothing.'",
        rarity: 3
    },
    'Mulligan': {
        name: 'Mulligan',
        desc: 'Your first Pool Reroll in every Vingt-un is free and does not consume a reroll charge.',
        flavor: "'You are granted a single 'do-over' for each Vingt-un, a chance to petition the void to reshuffle the offered pool... once.'",
        rarity: 3
    },
    'Golden Hand': {
        name: 'Golden Hand',
        desc: 'The first hand of every Vingt-un (Petit, Grand, and Patron) gets +100 Base Chips.',
        flavor: "'Your opening move is blessed. Your first hand of every Vingt-un is gilded, starting you with a boon of 100 chips.'",
        rarity: 3
    },
    'MultPerAnte': {
        name: 'Growing Confidence',
        desc: 'Gain a permanent +1 Multiplier for each Ante you have completed. (Non-cumulative)',
        flavor: "'Your reputation precedes you. The deeper you delve, the more your very presence multiplies your gains, a reward for past victories.'",
        rarity: 3
    },

    // --- Epic (Rarity 4) ---
    'The Sixth Card': {
        name: 'The Sixth Card',
        desc: 'An extra (7th) card is dealt to the Shared Pool at the start of every hand.',
        flavor: "'The void offers more choices, but also more confusion. An extra card is now dealt to the shared pool, complicating your (and the dealer's) decisions.'",
        rarity: 4
    },
    'Jester Gambit': {
        name: 'Jester Gambit',
        desc: 'Your maximum hand size is increased to 6. A "6-Card Charlie" (6 cards, 21 or less) counts as an automatic win and applies the 5-card bonus.',
        flavor: "'You adopt the fool\'s strategy, allowing you to hold a sixth card. If you manage to hold 6 cards without busting, the Patron laughs and grants you an automatic win.'",
        rarity: 4
    },
    'Minor Miscalculation': {
        name: 'Minor Miscalculation',
        desc: 'Once per Vingt-un, if you Bust, your hand is reset and your turn ends (you do not lose the hand).',
        flavor: "'The Patron grants you a single, minor reprieve. Once per Vingt-un, a fatal bust is forgiven, dismissed as a 'minor miscalculation.' Your turn ends, but your hand does not.'",
        rarity: 4
    },
    'Shopaholic': {
        name: 'Shopaholic',
        desc: 'The Void Market stocks 1 additional item. All shop rerolls are free.',
        flavor: "'The Void Market\'s curator takes a special interest in you, always offering an extra item and allowing you to reroll its stock for free.'",
        rarity: 4
    },
    'Arcane Overcharge': {
        name: 'Arcane Overcharge',
        desc: 'Your total Multiplier is permanently doubled, but your total Base Chips are halved. (Calculated at the end).',
        flavor: "'You make a dangerous pact: you will burn twice as bright, but half as long. Your Multiplier is doubled, but your Base Chips are permanently halved.'",
        rarity: 4
    },

    // --- Legendary (Rarity 5) ---
    'Jokers Wild': {
        name: 'Joker\'s Wild',
        desc: 'Adds 2 Jokers (1 Red, 1 Black) to the deck for the rest of the run. Jokers are worth +12 Chips and count as an automatic win if not Bust.',
        flavor: "'You invite true chaos to the table. Two Jokers, one red and one black, are shuffled into the deck. They are wild, powerful, and guarantee a win... if you don\'t bust first.'",
        rarity: 5
    },
    'Polychrome': {
        name: 'Polychrome',
        desc: 'All cards in your hand are considered to be all 4 suits (♠, ♥, ♦, ♣) simultaneously.',
        flavor: "'You see beyond the simple colors. To you, all cards now shimmer with a polychromatic aura, counting as all four suits (♠, ♥, ♦, ♣) at once.'",
        rarity: 5
    }
};

const BJ_PASSIVE_MODIFIERS = {
    // --- Common (Rarity 1) ---
    'diamonds_chips': {
        name: 'Gilded Curse (♦)',
        desc: '+25 Base Chips for each ♦ card in your hand.',
        flavor: 'You draw power from the suit of Diamonds, gaining 25 Base Chips for each one you hold.',
        type: 'passive',
        cost: 4,
        rarity: 1,
        check: () => true,
        logic: (mult, base, hand, s, i, isBJ, pR, state) => {
            const suitCount = hand.filter(c => 
                c.suit === '♦' || 
                (c.suit === 'JOKER_RED' && state.patronSkills.includes('Polychrome')) || 
                (state.patronSkills.includes('Polychrome') && !c.suit.startsWith('JOKER'))
            ).length;
            return { base: base + (suitCount * 25), mult: mult };
        }
    },
    'hearts_chips': {
        name: 'Sanguine Tribute (♥)',
        desc: '+25 Base Chips for each ♥ card in your hand.',
        flavor: 'You draw power from the suit of Hearts, gaining 25 Base Chips for each one you hold.',
        type: 'passive',
        cost: 4,
        rarity: 1,
        check: () => true,
        logic: (mult, base, hand, s, i, isBJ, pR, state) => {
            const suitCount = hand.filter(c => 
                c.suit === '♥' || 
                (c.suit === 'JOKER_RED' && state.patronSkills.includes('Polychrome')) || 
                (state.patronSkills.includes('Polychrome') && !c.suit.startsWith('JOKER'))
            ).length;
            return { base: base + (suitCount * 25), mult: mult };
        }
    },
    'clubs_chips': {
        name: 'Scholar\'s Sigil (♣)',
        desc: '+25 Base Chips for each ♣ card in your hand.',
        flavor: 'You draw power from the suit of Clubs, gaining 25 Base Chips for each one you hold.',
        type: 'passive',
        cost: 4,
        rarity: 1,
        check: () => true,
        logic: (mult, base, hand, s, i, isBJ, pR, state) => {
            const suitCount = hand.filter(c => 
                c.suit === '♣' || 
                (c.suit === 'JOKER_BLACK' && state.patronSkills.includes('Polychrome')) || 
                (state.patronSkills.includes('Polychrome') && !c.suit.startsWith('JOKER'))
            ).length;
            return { base: base + (suitCount * 25), mult: mult };
        }
    },
    'spades_chips': {
        name: 'Reaper\'s Tithe (♠)',
        desc: '+25 Base Chips for each ♠ card in your hand.',
        flavor: 'You draw power from the suit of Spades, gaining 25 Base Chips for each one you hold.',
        type: 'passive',
        cost: 4,
        rarity: 1,
        check: () => true,
        logic: (mult, base, hand, s, i, isBJ, pR, state) => {
            const suitCount = hand.filter(c => 
                c.suit === '♠' || 
                (c.suit === 'JOKER_BLACK' && state.patronSkills.includes('Polychrome')) || 
                (state.patronSkills.includes('Polychrome') && !c.suit.startsWith('JOKER'))
            ).length;
            return { base: base + (suitCount * 25), mult: mult };
        }
    },
    'diamonds_mult': {
        name: 'Crystal Lattice (♦)',
        desc: '+2 Multiplier for each ♦ card in your hand.',
        flavor: 'The suit of Diamonds resonates with your will, granting a +2 Multiplier for each one you hold.',
        type: 'passive',
        cost: 4,
        rarity: 1,
        check: () => true,
        logic: (mult, base, hand, s, i, isBJ, pR, state) => {
            const suitCount = hand.filter(c => 
                c.suit === '♦' || 
                (c.suit === 'JOKER_RED' && state.patronSkills.includes('Polychrome')) || 
                (state.patronSkills.includes('Polychrome') && !c.suit.startsWith('JOKER'))
            ).length;
            return mult + (suitCount * 2);
        }
    },
    'hearts_mult': {
        name: 'Heart\'s Echo (♥)',
        desc: '+2 Multiplier for each ♥ card in your hand.',
        flavor: 'The suit of Hearts resonates with your will, granting a +2 Multiplier for each one you hold.',
        type: 'passive',
        cost: 4,
        rarity: 1,
        check: () => true,
        logic: (mult, base, hand, s, i, isBJ, pR, state) => {
            const suitCount = hand.filter(c => 
                c.suit === '♥' || 
                (c.suit === 'JOKER_RED' && state.patronSkills.includes('Polychrome')) || 
                (state.patronSkills.includes('Polychrome') && !c.suit.startsWith('JOKER'))
            ).length;
            return mult + (suitCount * 2);
        }
    },
    'clubs_mult': {
        name: 'Arcane Tome (♣)',
        desc: '+2 Multiplier for each ♣ card in your hand.',
        flavor: 'The suit of Clubs resonates with your will, granting a +2 Multiplier for each one you hold.',
        type: 'passive',
        cost: 4,
        rarity: 1,
        check: () => true,
        logic: (mult, base, hand, s, i, isBJ, pR, state) => {
            const suitCount = hand.filter(c => 
                c.suit === '♣' || 
                (c.suit === 'JOKER_BLACK' && state.patronSkills.includes('Polychrome')) || 
                (state.patronSkills.includes('Polychrome') && !c.suit.startsWith('JOKER'))
            ).length;
            return mult + (suitCount * 2);
        }
    },
    'spades_mult': {
        name: 'Shadow Weave (♠)',
        desc: '+2 Multiplier for each ♠ card in your hand.',
        flavor: 'The suit of Spades resonates with your will, granting a +2 Multiplier for each one you hold.',
        type: 'passive',
        cost: 4,
        rarity: 1,
        check: () => true,
        logic: (mult, base, hand, s, i, isBJ, pR, state) => {
            const suitCount = hand.filter(c => 
                c.suit === '♠' || 
                (c.suit === 'JOKER_BLACK' && state.patronSkills.includes('Polychrome')) || 
                (state.patronSkills.includes('Polychrome') && !c.suit.startsWith('JOKER'))
            ).length;
            return mult + (suitCount * 2);
        }
    },
    'non_royal_mult': {
        name: 'Peasant\'s Uprising',
        desc: '+1 Multiplier for each non-Face card (2-10, A) in your hand.',
        flavor: 'You find strength in the common folk of the deck. Each non-Face card (2-10, A) adds +1 to your Multiplier.',
        type: 'passive',
        cost: 5,
        rarity: 1,
        check: () => true,
        logic: (mult, base, hand) => {
            return mult + (hand.filter(c => !['J', 'Q', 'K'].includes(c.value)).length * 1);
        }
    },
    'chip_per_hand': {
        name: 'Momentum',
        desc: '+5 Base Chips for each hand played in this Vingt-un (including this one).',
        flavor: 'With each hand, your confidence grows. You gain +5 Base Chips for every hand you\'ve played in this Vingt-un.',
        type: 'passive',
        cost: 4,
        rarity: 1,
        check: () => true,
        logic: (mult, base, hand, score, is5Card, isBJ, pokerRank, state) => {
            const ante = ANTE_STRUCTURE[state.currentAnteIndex];
            const vingtUn = ante.vingtUns[state.currentVingtUnIndex];
            
            let initialHands = vingtUn.hands + state.runUpgrades.bonusHandsPerVingtUn;
            if (state.runUpgrades.rerollsToHands) {
                initialHands += (vingtUn.rerolls + state.runUpgrades.bonusRerollsPerVingtUn);
            }
            if (state.patronSkills.includes('Perfect Start')) {
                initialHands++;
            }
            
            const handsPlayed = (initialHands - state.currentHandsLeft) + 1;
            return { base: base + (handsPlayed * 5), mult: mult };
        }
    },

    // --- Uncommon (Rarity 2) ---
    'risky_chips': {
        name: 'Edge of Madness',
        desc: 'Standing on 13, 14, 15, or 16 gives +100 Base Chips.',
        flavor: 'You live dangerously. When you Stand on a weak hand (13-16), your audacity is rewarded with +100 Base Chips.',
        type: 'passive',
        cost: 6,
        rarity: 2,
        check: (hand, score) => [13, 14, 15, 16].includes(score),
        logic: (mult, base) => ({ base: base + 100, mult: mult })
    },
    'royal_mult': {
        name: 'Court of the Damned',
        desc: '+4 Multiplier for each Face card (J,Q,K) in your hand.',
        flavor: 'You\'ve curried favor with the royals. Each Face card (J, Q, K) you hold grants you a +4 Multiplier.',
        type: 'passive',
        cost: 7,
        rarity: 2,
        check: () => true,
        logic: (mult, base, hand) => {
            return mult + (hand.filter(c => ['J', 'Q', 'K'].includes(c.value)).length * 4);
        }
    },
    'three_kind_mult': {
        name: 'Coven\'s Pact',
        desc: '+5 Multiplier for Three of a Kind.',
        flavor: 'A trio of matching cards forms a small coven, granting their power to you as a +5 Multiplier.',
        type: 'passive',
        cost: 7,
        rarity: 2,
        check: (hand, score, is5Card, isBJ, pokerRank) => pokerRank.isThreeOfAKind,
        logic: (mult) => mult + 5
    },
    'bonus_decay_chips': {
        name: 'Fading Riches',
        desc: '+100 Base Chips. This bonus decreases by 10 for each hand played in this Vingt-un.',
        flavor: 'A fleeting boon. You start each Vingt-un with +100 Base Chips, but this bonus fades by 10 after every hand you play.',
        type: 'passive',
        cost: 6,
        rarity: 2,
        isFading: true,
        check: () => true,
        logic: (mult, base, hand, score, is5Card, isBJ, pokerRank, state) => {
            const ante = ANTE_STRUCTURE[state.currentAnteIndex];
            const vingtUn = ante.vingtUns[state.currentVingtUnIndex];
            
            let initialHands = vingtUn.hands + state.runUpgrades.bonusHandsPerVingtUn;
            if (state.runUpgrades.rerollsToHands) {
                initialHands += (vingtUn.rerolls + state.runUpgrades.bonusRerollsPerVingtUn);
            }
            if (state.patronSkills.includes('Perfect Start')) {
                initialHands++;
            }

            const handsPlayed = initialHands - state.currentHandsLeft;
            const bonus = Math.max(0, 100 - (handsPlayed * 10));
            return { base: base + bonus, mult: mult };
        }
    },
    'copycat': {
        name: 'Echo',
        desc: 'Copies all effects of the passive modifier directly to its left.',
        flavor: 'A mimic. This ethereal passive copies all abilities of the item to its immediate left. Its position is everything.',
        type: 'passive',
        cost: 7,
        rarity: 2,
        check: () => true,
        logic: (mult, base, hand, score, is5Card, isBJ, pokerRank, state, index) => {
            if (index > 0) {
                const prevModKey = state.passiveModifiers[index - 1];
                const prevMod = BJ_PASSIVE_MODIFIERS[prevModKey];
                
                if (prevMod && prevMod.logic && prevMod.check(hand, score, is5Card, isBJ, pokerRank, state, index - 1)) {
                    const result = prevMod.logic(mult, base, hand, score, is5Card, isBJ, pokerRank, state, index - 1);
                    return result;
                }
            }
            return (typeof mult === 'number') ? mult : { base: base, mult: mult };
        }
    },
    'all_red_mult': {
        name: 'Crimson Heart',
        desc: '+5 Multiplier if your hand contains only Red cards (♥, ♦, or Red Joker).',
        flavor: 'You channel pure passion. If your hand is composed of only Red cards (♥, ♦), you gain a +5 Multiplier.',
        type: 'passive',
        cost: 6,
        rarity: 2,
        check: (hand, s, i, isBJ, pR, state) => {
            if (hand.length === 0) return false;
            return hand.every(c => 
                ['♥','♦', 'JOKER_RED'].includes(c.suit) || 
                (state.patronSkills.includes('Polychrome') && !c.suit.startsWith('JOKER'))
            );
        },
        logic: (mult) => mult + 5
    },
    'all_black_mult': {
        name: 'Ashen Soul',
        desc: '+5 Multiplier if your hand contains only Black cards (♠, ♣, or Black Joker).',
        flavor: 'You channel pure logic. If your hand is composed of only Black cards (♠, ♣), you gain a +5 Multiplier.',
        type: 'passive',
        cost: 6,
        rarity: 2,
        check: (hand, s, i, isBJ, pR, state) => {
            if (hand.length === 0) return false;
            return hand.every(c => 
                ['♠','♣', 'JOKER_BLACK'].includes(c.suit) || 
                (state.patronSkills.includes('Polychrome') && !c.suit.startsWith('JOKER'))
            );
        },
        logic: (mult) => mult + 5
    },
    'chip_per_ante': {
        name: 'Veteran',
        desc: '+25 Base Chips for each Ante you have completed in this run.',
        flavor: 'Your experience pays dividends. You gain +25 Base Chips for every Ante you\'ve already completed this run.',
        type: 'passive',
        cost: 6,
        rarity: 2,
        check: () => true,
        logic: (mult, base, hand, score, is5Card, isBJ, pokerRank, state) => {
            return { base: base + (state.currentAnteIndex * 25), mult: mult };
        }
    },
    'iron_will': {
        name: 'Iron Will',
        desc: 'Start each Vingt-un with +2 Hands, but your Base Multiplier is -1.',
        flavor: 'You steel yourself for a long haul, gaining +2 Hands for the Vingt-un, but the mental toll subtracts 1 from your Base Multiplier.',
        type: 'passive',
        cost: 5,
        rarity: 2,
        check: () => true,
        logic: (mult, base) => ({ base: base, mult: mult - 1 })
    },
    'flush_chips': {
        name: 'Flush Bonus',
        desc: '+100 Base Chips if your hand is a 5-card Flush.',
        flavor: 'All five cards sing in the same suit, granting you a boon of +100 Base Chips.',
        type: 'passive',
        cost: 6,
        rarity: 2,
        check: (hand, score, is5Card, isBJ, pokerRank) => pokerRank.isFlush,
        logic: (mult, base) => ({ base: base + 100, mult: mult })
    },
    'straight_chips': {
        name: 'Straight Bonus',
        desc: '+100 Base Chips if your hand is a 5-card Straight.',
        flavor: 'All five cards form a perfect ladder, granting you a boon of +100 Base Chips.',
        type: 'passive',
        cost: 6,
        rarity: 2,
        check: (hand, score, is5Card, isBJ, pokerRank) => pokerRank.isStraight,
        logic: (mult, base) => ({ base: base + 100, mult: mult })
    },

    // --- Rare (Rarity 3) ---
    'base_chips_plus': {
        name: 'Burden of Riches',
        desc: '+50 Base Chips for every winning hand.',
        flavor: 'Your wealth begets wealth. Every winning hand you play grants an extra +50 Base Chips.',
        type: 'passive',
        cost: 8,
        rarity: 3,
        check: () => true,
        logic: (mult, base) => ({ base: base + 50, mult: mult })
    },
    'perfect_21_chips': {
        name: 'Flawless Execution',
        desc: 'Winning with exactly 21 gives +150 Base Chips.',
        flavor: 'A perfect score of 21 is a masterstroke, granting an additional +150 Base Chips.',
        type: 'passive',
        cost: 10,
        rarity: 3,
        check: (hand, score) => score === 21,
        logic: (mult, base) => ({ base: base + 150, mult: mult })
    },
    'no_hit_win_chips': {
        name: 'Silent Victory',
        desc: 'Winning with your starting 2-card hand gives +200 Base Chips.',
        flavor: 'To win with only the two cards you were dealt is a sign of true confidence, granting +200 Base Chips.',
        type: 'passive',
        cost: 9,
        rarity: 3,
        check: (hand) => hand.length === 2,
        logic: (mult, base) => ({ base: base + 200, mult: mult })
    },
    'blackjack_mult': {
        name: 'Fate\'s Blessing',
        desc: 'Natural Blackjacks (2-card 21) give +15 Multiplier.',
        flavor: 'A natural Blackjack (a 2-card 21) is a mark of destiny, granting a +15 Multiplier.',
        type: 'passive',
        cost: 9,
        rarity: 3,
        check: (hand, score, is5Card, isBlackjack) => isBlackjack,
        logic: (mult) => mult + 15
    },
    'five_card_mult': {
        name: 'The Jester\'s Hand',
        desc: '5-Card Charlies get +10 Multiplier.',
        flavor: 'To draw 5 cards without busting (a \'Charlie\') is the Jester\'s favorite trick, granting a +10 Multiplier.',
        type: 'passive',
        cost: 8,
        rarity: 3,
        check: (hand, score, is5Card) => is5Card,
        logic: (mult) => mult + 10
    },
    'pair_mult': {
        name: 'Twin Souls',
        desc: '+2 Multiplier for each Pair in your hand.',
        flavor: 'You draw power from duality. Each Pair in your hand grants a +2 Multiplier.',
        type: 'passive',
        cost: 8,
        rarity: 3,
        check: (hand, score, is5Card, isBJ, pokerRank) => pokerRank.pairs > 0,
        logic: (mult, base, hand, score, is5Card, isBJ, pokerRank) => {
            return mult + (pokerRank.pairs * 2);
        }
    },
    'two_pair_mult': {
        name: 'Dual Destinies',
        desc: '+6 Multiplier for Two Pair.',
        flavor: 'Two pairs, a hand of mirrors, grants a +6 Multiplier.',
        type: 'passive',
        cost: 9,
        rarity: 3,
        check: (hand, score, is5Card, isBJ, pokerRank) => pokerRank.isTwoPair,
        logic: (mult) => mult + 6
    },
    'bonus_decay_mult': {
        name: 'Fading Power',
        desc: '+10 Multiplier. This bonus decreases by 1 for each hand played in this Vingt-un.',
        flavor: 'A fleeting insight. You start each Vingt-un with +10 Multiplier, but this bonus fades by 1 after every hand you play.',
        type: 'passive',
        cost: 8,
        rarity: 3,
        isFading: true,
        check: () => true,
        logic: (mult, base, hand, score, is5Card, isBJ, pokerRank, state) => {
            const ante = ANTE_STRUCTURE[state.currentAnteIndex];
            const vingtUn = ante.vingtUns[state.currentVingtUnIndex];
            
            let initialHands = vingtUn.hands + state.runUpgrades.bonusHandsPerVingtUn;
            if (state.runUpgrades.rerollsToHands) {
                initialHands += (vingtUn.rerolls + state.runUpgrades.bonusRerollsPerVingtUn);
            }
            if (state.patronSkills.includes('Perfect Start')) {
                initialHands++;
            }

            const handsPlayed = initialHands - state.currentHandsLeft;
            const bonus = Math.max(0, 10 - handsPlayed);
            return mult + bonus;
        }
    },
    'pity_points': {
        name: 'Consolation Prize',
        desc: 'Losing a hand (Bust or Showdown) grants 50% of the score you *would have* gotten.',
        flavor: 'The Patron finds your failure amusing and tosses you a coin. If you lose a hand, you still gain 50% of the score you would have won.',
        type: 'passive',
        cost: 10,
        rarity: 3,
        check: () => false, // Applied manually in determineWinner
        logic: (mult, base) => ({ base: base, mult: mult })
    },
    'one_suit_mult': {
        name: 'Monochrome',
        desc: 'If your hand contains only one suit (no Jokers), gain a Multiplier bonus based on hand size: 2 cards (+1 Mult), 3 cards (+3 Mult), 4 cards (+5 Mult), 5+ cards (+10 Mult).',
        flavor: 'A hand of perfect uniformity. The Patron rewards this display of order with a scaling bonus.',
        type: 'passive',
        cost: 9,
        rarity: 3,
        check: (hand) => {
            if (hand.length < 2) return false; // Bonus only starts at 2 cards
            return hand.every(c => c.suit === hand[0].suit && !c.suit.startsWith('JOKER'));
        },
        logic: (mult, base, hand) => {
            let bonus = 0;
            switch (hand.length) {
                case 2: bonus = 1; break;
                case 3: bonus = 3; break;
                case 4: bonus = 5; break;
                case 5: bonus = 10; break;
                case 6: bonus = 10; break; // Also apply to 6-card hands (Jester's Gambit)
                default: bonus = (hand.length > 6) ? 10 : 0; // Future-proofing
            }
            return mult + bonus;
        }
    },
    'base_mult_plus': {
        name: 'Solid Foundation',
        desc: 'Gain a permanent +4 Base Multiplier.',
        flavor: 'You have built a solid foundation of power, permanently increasing your Base Multiplier by 4.',
        type: 'passive',
        cost: 10,
        rarity: 3,
        check: () => true,
        logic: (mult) => mult + 4
    },
    'mult_per_hand': {
        name: 'Gathering Storm',
        desc: '+1 Multiplier for each hand played in this Vingt-un (including this one).',
        flavor: 'You are a gathering storm. Your Multiplier increases by +1 for every hand you\'ve played in this Vingt-un.',
        type: 'passive',
        cost: 8,
        rarity: 3,
        check: () => true,
        logic: (mult, base, hand, score, is5Card, isBJ, pokerRank, state) => {
            const ante = ANTE_STRUCTURE[state.currentAnteIndex];
            const vingtUn = ante.vingtUns[state.currentVingtUnIndex];
            
            let initialHands = vingtUn.hands + state.runUpgrades.bonusHandsPerVingtUn;
            if (state.runUpgrades.rerollsToHands) {
                initialHands += (vingtUn.rerolls + state.runUpgrades.bonusRerollsPerVingtUn);
            }
            if (state.patronSkills.includes('Perfect Start')) {
                initialHands++;
            }
            
            const handsPlayed = (initialHands - state.currentHandsLeft) + 1;
            return mult + handsPlayed;
        }
    },
    'full_house_chips': {
        name: 'Full House Bonus',
        desc: '+150 Base Chips if your hand is a Full House.',
        flavor: 'A Pair and a Trio, a family of cards. This hand grants an extra +150 Base Chips.',
        type: 'passive',
        cost: 8,
        rarity: 3,
        check: (hand, score, is5Card, isBJ, pokerRank) => pokerRank.isFullHouse,
        logic: (mult, base) => ({ base: base + 150, mult: mult })
    },
    'ante_starter_pack': {
        name: 'Starter Pack',
        desc: 'At the start of each new Ante, gain +1 Hand and +1 Reroll for all Vingt-uns in that Ante.',
        flavor: 'You\'ve learned to pack well. At the start of every new Ante, you get +1 Hand and +1 Reroll.',
        type: 'passive',
        cost: 9,
        rarity: 3,
        check: () => false, // Applied in startVingtUn
        logic: (mult, base) => ({ base: base, mult: mult })
    },

    // --- Epic (Rarity 4) ---
    'four_kind_mult': {
        name: 'Void\'s Hand',
        desc: '+10 Multiplier for Four of a Kind.',
        flavor: 'Four cards of the same rank, a hand blessed by the void itself. Grants a +10 Multiplier.',
        type: 'passive',
        cost: 12,
        rarity: 4,
        check: (hand, score, is5Card, isBJ, pokerRank) => pokerRank.isFourOfAKind,
        logic: (mult) => mult + 10
    },
    'team_of_ace_mult': {
        name: 'Abyssal Duality',
        desc: '+10 Multiplier if your hand uses one Ace as 1 and another as 11.',
        flavor: 'You harness the true power of the Ace, forcing one to be High (11) and one to be Low (1). This mastery grants a +10 Multiplier.',
        type: 'passive',
        cost: 10,
        rarity: 4,
        check: (hand, score, is5Card, isBJ, pokerRank) => pokerRank.isTeamOfAce,
        logic: (mult) => mult + 10
    },
    'glass_cannon': {
        name: 'Glass Cannon',
        desc: 'Your total Multiplier is doubled, but your Hands Left for each Vingt-un is halved (rounded down).',
        flavor: 'You burn with a blinding light. Your total Multiplier is doubled, but your \'stamina\' (Hands Left) is halved.',
        type: 'passive',
        cost: 12,
        rarity: 4,
        check: () => true,
        logic: (mult) => mult * 2 // Hand logic in startVingtUn
    },
    'straight_flush_mult': {
        name: 'Straight Flush Bonus',
        desc: '+15 Multiplier if your hand is a Straight Flush.',
        flavor: 'A hand of pure, flowing perfection. Grants a +15 Multiplier.',
        type: 'passive',
        cost: 13,
        rarity: 4,
        check: (hand, score, is5Card, isBJ, pokerRank) => pokerRank.isStraightFlush,
        logic: (mult) => mult + 15
    },

    // --- Legendary (Rarity 5) ---
    'royal_flush_mult': {
        name: 'Royal Flush Bonus',
        desc: '+25 Multiplier if your hand is a Royal Flush.',
        flavor: 'The unbeatable hand, the mark of a true master. Grants a legendary +25 Multiplier.',
        type: 'passive',
        cost: 15,
        rarity: 5,
        check: (hand, score, is5Card, isBJ, pokerRank) => pokerRank.isRoyalFlush,
        logic: (mult) => mult + 25
    }
};

const BJ_CONSUMABLES = {
    // --- Common (Rarity 1) ---
    'vial_clarity': {
        name: 'Oracle\'s Draught',
        desc: 'Use: The next card you Hit is guaranteed to be a 7, 8, or 9.',
        flavor: 'You drink a draught that grants a moment of perfect foresight, allowing you to *will* your next card to be a safe 7, 8, or 9.',
        type: 'consumable',
        cost: 3,
        rarity: 1,
        use: (state) => {
            const safeCards = state.deck.filter(c => ['7', '8', '9'].includes(c.value));
            if (safeCards.length > 0) {
                const safeCard = safeCards[0];
                state.deck = state.deck.filter(c => c !== safeCard); // Remove from deck
                state.playerHand.push(safeCard); // Add to hand
                return { success: true, message: 'Drew a safe card.' };
            }
            return { success: false, message: 'No safe cards left!' };
        }
    },
    'reshuffle_orb': {
        name: 'Chaotic Orb',
        desc: 'Use: Shuffle a new, full deck.',
        flavor: 'You crush an orb of pure chaos, dismissing the current deck and summoning a fresh one from the void.',
        type: 'consumable',
        cost: 2,
        rarity: 1,
        use: (state) => {
            // --- MODIFICATION ---
            state.deck = createDeck(state.deckKey); // Use the run's deckKey
            shuffleDeck(state.deck);
            state.masterDeckList = [...state.deck]; // <-- ADD THIS
            state.discardPile = []; // <-- ADD THIS
            // --- END MODIFICATION ---
            return { success: true, message: 'Deck has been reshuffled.' };
        }
    },
    'panic_exit': {
        name: 'Escape Rope',
        desc: 'Use: Immediately end your run. You cash out the value of the *previous* Ante (or 0 if on Ante 1).',
        flavor: 'A coward\'s tool. You tear the fabric of the Patron\'s game, escaping with your run... but you only get to keep the winnings from the *previous* Ante.',
        type: 'consumable',
        cost: 3,
        rarity: 1,
        use: (state) => {
            state.escapeRopeUsed = true;
            return { success: true, message: 'Escape Rope activated! Your run will end.' };
        }
    },
    'weigh_deck_low': {
        name: 'Minor Weight',
        desc: 'Use: All cards in the Shared Pool are replaced with new non-Face cards (2-6).',
        flavor: 'You whisper a command, and the shared pool dissolves, replaced instantly by a new set of weak, low-value cards (2-6).',
        type: 'consumable',
        cost: 3,
        rarity: 1,
        use: (state) => {
            const poolSize = state.sharedPool.length;
            state.sharedPool = [];
            const lowValues = ['2', '3', '4', '5', '6'];
            const suits = ['♠', '♥', '♦', '♣'];
            for (let i = 0; i < poolSize; i++) {
                const randValue = lowValues[Math.floor(Math.random() * lowValues.length)];
                const randSuit = suits[Math.floor(Math.random() * suits.length)];
                state.sharedPool.push({ value: randValue, suit: randSuit, weight: parseInt(randValue) });
            }
            return { success: true, message: 'The pool is now filled with low cards.' };
        }
    },
    'risky_deal': {
        name: 'Risky Deal',
        desc: 'Use: Reroll the Shared Pool for free, but the Dealer gets to draft first.',
        flavor: 'You challenge the dealer, forcing a new pool of cards to be dealt... but in exchange, the dealer gets to draft first.',
        type: 'consumable',
        cost: 2,
        rarity: 1,
        use: (state) => {
            state.sharedPool = [];
            dealRoguelikePool();
            state.riskyDealActive = true;
            return { success: true, message: 'Pool rerolled. Dealer drafts first!' };
        }
    },

    // --- Uncommon (Rarity 2) ---
    'second_guess': {
        name: 'Fate\'s Erasure',
        desc: 'Use: If you Bust, undo your last Hit.',
        flavor: 'You hold a token of un-making. The next time you Bust, this token shatters, rewinding time and undoing your last \'Hit\'.',
        type: 'consumable',
        cost: 5,
        rarity: 2,
        use: (state) => {
            /* Logic handled at time of bust */
            return { success: true, message: 'Token is ready.' };
        }
    },
    'burn_hands': {
        name: 'Immolation',
        desc: 'Use: Burn both your and the dealer\'s hands. You both start from an empty hand, drafting from the pool.',
        flavor: 'You cast your hand (and the dealer\'s) into a void flame. You both must start over with nothing, drafting anew from the pool.',
        type: 'consumable',
        cost: 5,
        rarity: 2,
        use: (state) => {
            state.playerHand = [];
            state.dealerHand = [];
            return { success: true, message: 'Hands burned. Draft anew.' };
        }
    },
    'pool_to_royals': {
        name: 'Royal Decree',
        desc: 'Use: All cards in the Shared Pool are replaced with new Royal cards (J, Q, K).',
        flavor: 'You present a false decree. The common cards in the pool flee, replaced instantly by a new set of Royals (J, Q, K).',
        type: 'consumable',
        cost: 4,
        rarity: 2,
        use: (state) => {
            const poolSize = state.sharedPool.length;
            state.sharedPool = [];
            const royals = ['J', 'Q', 'K'];
            const suits = ['♠', '♥', '♦', '♣'];
            for (let i = 0; i < poolSize; i++) {
                const randValue = royals[Math.floor(Math.random() * royals.length)];
                const randSuit = suits[Math.floor(Math.random() * suits.length)];
                state.sharedPool.push({ value: randValue, suit: randSuit, weight: 10 });
            }
            return { success: true, message: 'The pool is now royal.' };
        }
    },
    'perfect_pair': {
        name: 'Perfect Pair',
        desc: 'Use: The next 2 cards you draft from the pool are guaranteed to be a Pair.',
        flavor: 'You manipulate the threads of fate, ensuring that a matching Pair is hidden within the next pool of cards to be dealt.',
        type: 'consumable',
        cost: 4,
        rarity: 2,
        use: (state) => {
            // --- THIS IS THE FIX ---
            const VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
            // --- END FIX ---
            
            const randValue = VALUES[Math.floor(Math.random() * VALUES.length)];
            let weight = parseInt(randValue);
            if (['J', 'Q', 'K'].includes(randValue)) weight = 10;
            if (randValue === 'A') weight = 11;
            
            const card1 = { value: randValue, suit: '♦', weight: weight };
            const card2 = { value: randValue, suit: '♥', weight: weight };
            
            state.deck.unshift(card1);
            state.deck.unshift(card2);
            
            // Also add to master list
            state.masterDeckList.push(card1); // <-- ADD THIS
            state.masterDeckList.push(card2); // <-- ADD THIS
            // --- END MODIFICATION ---

            state.sharedPool = [];
            dealRoguelikePool();
            return { success: true, message: 'The pool now contains a pair...' };
        }
    },

    // --- Rare (Rarity 3) ---
    'swap_hands': {
        name: 'Cruel Swap',
        desc: 'Use: Swap your entire hand with the dealer\'s hand.',
        flavor: 'A wicked trick. You instantly swap your entire hand with the dealer\'s. Be careful what you wish for.',
        type: 'consumable',
        cost: 6,
        rarity: 3,
        use: (state) => {
            const tempHand = state.playerHand;
            state.playerHand = state.dealerHand;
            state.dealerHand = tempHand;
            return { success: true, message: 'Hands swapped!' };
        }
    },
    'weigh_deck_high': {
        name: 'Major Weight',
        desc: 'Use: All cards in the Shared Pool are replaced with new mid-to-high cards (6, 7, 8, 9, or 10).',
        flavor: 'You slam your fist on the table, and the pool\'s cards shimmer... replaced instantly by a new set of solid, high-value cards (6-10).',
        type: 'consumable',
        cost: 6,
        rarity: 3,
        use: (state) => {
            const poolSize = state.sharedPool.length;
            state.sharedPool = [];
            const highValues = ['6', '7', '8', '9', '10'];
            const suits = ['♠', '♥', '♦', '♣'];
            for (let i = 0; i < poolSize; i++) {
                const randValue = highValues[Math.floor(Math.random() * highValues.length)];
                let weight = parseInt(randValue);
                const randSuit = suits[Math.floor(Math.random() * suits.length)];
                state.sharedPool.push({ value: randValue, suit: randSuit, weight: weight });
            }
            return { success: true, message: 'The pool is now filled with new cards.' };
        }
    },
    'liquid_luck': {
        name: 'Liquid Luck',
        desc: 'Use: Your next hand is guaranteed to trigger all its Poker Hand and Passive Modifier checks, regardless of score.',
        flavor: 'You drink liquid fortune. For this hand only, the universe conspires in your favor, forcing all of your Passives to trigger, even if their conditions aren\'t met.',
        type: 'consumable',
        cost: 7,
        rarity: 3,
        use: (state) => {
            state.liquidLuckActive = true;
            return { success: true, message: 'You feel incredibly lucky...' };
        }
    },

    // --- Epic (Rarity 4) ---
    'spectral_hand': {
        name: 'Spectral Hand',
        desc: 'Use: For this hand only, your hand size limit is ignored. (You can still only Stand or Bust).',
        flavor: 'Your hand becomes ethereal, allowing you to ignore the normal 5-card limit for this hand only. You can keep hitting... until you bust.',
        type: 'consumable',
        cost: 8,
        rarity: 4,
        use: (state) => {
            state.spectralHandActive = true;
            return { success: true, message: 'Your hand feels ethereal...' };
        }
    },
    'double_or_nothing': {
        name: 'Double or Nothing',
        desc: 'Use: Your next hand is a gamble. If you win, your score is doubled. If you lose or push, your score is 0.',
        flavor: 'You wager your very score. Win this hand, and your score for it is doubled. Push or Lose, and your score is 0. No guts, no glory.',
        type: 'consumable',
        cost: 7,
        rarity: 4,
        use: (state) => {
            state.doubleOrNothingActive = true;
            return { success: true, message: 'All or nothing...' };
        }
    },

    // --- Legendary (Rarity 5) ---
    'chaos_orb': {
        name: 'Orb of Chaos',
        desc: 'Use: Reroll all of your current Passive Modifiers. (You get the same number of new passives).',
        flavor: 'You shatter the orb, destroying all of your current Passives. In their place, an equal number of new, random Passives fly from the void to bind to you.',
        type: 'consumable',
        cost: 10,
        rarity: 5,
        use: (state) => {
            const numPassives = state.passiveModifiers.length;
            state.passiveModifiers = [];
            for (let i = 0; i < numPassives; i++) {
                const newModKey = generateWeightedShopItem('passive');
                if (newModKey) {
                    state.passiveModifiers.push(newModKey);
                }
            }
            state.passiveModifiers = [...new Set(state.passiveModifiers)]; // Ensure no duplicates
            return { success: true, message: 'Your passives have been reforged by chaos!' };
        }
    }
};

const BJ_RUN_UPGRADES = {
    'cheaper_reroll': {
        name: 'Silver Tongue',
        desc: 'Shop rerolls start at 1 Crookard (instead of 2).',
        flavor: 'A permanent boon. Your silver tongue charms the shopkeeper, who now only charges 1 Crookard for your first reroll (instead of 2).',
        type: 'upgrade',
        cost: 6,
        rarity: 1, // Common
        apply: (state) => { state.runUpgrades.baseShopRerollCost = 1; }
    },
    'extra_consumable': {
        name: 'Occult Satchel',
        desc: '+1 Consumable slot.',
        flavor: 'You find a hidden pocket in your soul, allowing you to hold +1 Consumable.',
        type: 'upgrade',
        cost: 8,
        rarity: 2, // Uncommon
        apply: (state) => { state.runUpgrades.consumableSlots++; }
    },
    'extra_hand': {
        name: 'Thickened Resolve',
        desc: 'Start each Vingt-un with +1 Hand.',
        flavor: 'Your will has hardened. You can now endure +1 Hand in every Vingt-un.',
        type: 'upgrade',
        cost: 10,
        rarity: 2, // Uncommon
        apply: (state) => { state.runUpgrades.bonusHandsPerVingtUn++; }
    },
    'extra_passive': {
        name: 'Expanded Consciousness',
        desc: '+1 Passive Modifier slot.',
        flavor: 'Your mind expands, allowing you to attune to +1 Passive Modifier.',
        type: 'upgrade',
        cost: 15,
        rarity: 3, // Rare
        apply: (state) => { state.runUpgrades.passiveSlots++; }
    },
    'extra_reroll': {
        name: 'Third Eye',
        desc: 'Start each Vingt-un with +1 Pool Reroll.',
        flavor: 'Your third eye opens, granting you +1 free Pool Reroll in every Vingt-un.',
        type: 'upgrade',
        cost: 12,
        rarity: 3, // Rare
        apply: (state) => { state.runUpgrades.bonusRerollsPerVingtUn++; }
    },
    'rerolls_to_hands': {
        name: 'Desperate Measures',
        desc: 'Convert all Rerolls for each Vingt-un into extra Hands. (e.g., 5 Hands, 3 Rerolls becomes 8 Hands, 0 Rerolls)',
        flavor: 'You trade patience for endurance. You can no longer reroll the pool, but all your Rerolls are converted into extra Hands.',
        type: 'upgrade',
        cost: 10,
        rarity: 3, // Rare
        apply: (state) => { state.runUpgrades.rerollsToHands = true; }
    },
    'cheaper_locks': {
        name: 'Iron Clad Contract',
        desc: 'Reduces the cost to lock items in the shop to 1 Crookard.',
        flavor: 'You found a loophole in your contract with the shopkeeper. Locking items is now dirt cheap.',
        type: 'upgrade',
        cost: 7,
        rarity: 2, // Uncommon
        apply: (state) => { state.runUpgrades.cheaperLocks = true; }
    }
};