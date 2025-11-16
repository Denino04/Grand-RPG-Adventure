// This file contains the game logic for the Arcane Casino.
const MASTER_CARD_LIST = [];
(function buildMasterCardList() {
    const allValues = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const allSuits = ['♠', '♥', '♦', '♣'];
    
    for (const suit of allSuits) {
        for (const value of allValues) {
            let weight = parseInt(value);
            if (value === 'J' || value === 'Q' || value === 'K') weight = 10;
            if (value === 'A') weight = 11;
            MASTER_CARD_LIST.push({ value, suit, weight });
        }
    }
    // You can add Jokers or other special cards here if you want them to be conjurable
    // MASTER_CARD_LIST.push({ value: 'Joker', suit: 'JOKER_RED', weight: 12, id: 'joker_red' });
    // MASTER_CARD_LIST.push({ value: 'Joker', suit: 'JOKER_BLACK', weight: 12, id: 'joker_black' });
})();
// --- BLACKJACK ("Arcane 21") ---  
let roguelikeShopActiveDrawer = 'passives'; // Default to 'Passives' as it's most common

window.setRoguelikeShopDrawer = function(drawerName) {
    roguelikeShopActiveDrawer = drawerName;
    renderRoguelikeShop(); // Re-render the shop to show the new drawer
}

let blackjackState = {
    deck: [],
    playerHand: [],
    dealerHand: [],
    bet: 0,
    gamePhase: 'betting', // 'betting', 'playerTurn', 'dealerTurn', 'results'
    statusMessage: 'Place your bet to begin.'
};

let slotState = {
    reels: ['❓', '❓', '❓'],
    bet: 10,
    gamePhase: 'betting', // 'betting', 'spinning', 'results'
    statusMessage: 'Place your bet to spin.'
};

/*function checkCasinoCode(char) {
    if (player.unlocks.roguelikeCardGame) return; // Already unlocked

    casinoSecretCode.push(char);

    // --- NEW: Debug Logging ---
    // Log the current sequence to the browser's console (F12)
    console.log(`[CASINO SECRET] Clicked: ${char}. Current sequence: [${casinoSecretCode.join(', ')}]`);
    // --- END NEW ---
    
    // Check if the current sequence matches the beginning of the secret
    for (let i = 0; i < casinoSecretCode.length; i++) {
        if (casinoSecretCode[i] !== CASINO_SECRET[i]) {
            // Wrong sequence, reset
            
            // --- NEW: Debug Logging ---
            console.log(`[CASINO SECRET] WRONG. Sequence reset.`);
            // --- END NEW ---

            casinoSecretCode = [];
            // Optionally give negative feedback
            // addToLog("...nothing happens.", "text-gray-500");
            return;
        }
    }

    // Check if the full code has been entered
    if (casinoSecretCode.length === CASINO_SECRET.length) {
        
        // --- NEW: Debug Logging ---
        console.log(`[CASINO SECRET] SUCCESS! Unlocking game.`);
        // --- END NEW ---

        addToLog("<span classclass='font-bold text-yellow-300'>*CLACK*</span><br>A hidden slot opens on the wall, revealing a new, darker table.", "text-purple-300 font-bold");
        player.unlocks.roguelikeCardGame = true;
        saveGame();
        casinoSecretCode = []; // Reset code so it doesn't trigger again
        
        // Re-render the casino to show the new button
        renderArcaneCasino();
    }
}*/
/**
 * Creates a standard 52-card deck.
 */
function createDeck(deckKey = 'base_deck') {
    let deck = [];
    
    // Default to base_deck if key is invalid
    const definition = DECK_DEFINITIONS[deckKey] || DECK_DEFINITIONS['base_deck'];
    const comp = definition.composition;

    const values = comp.values;
    const suits = comp.suits;
    const multipliers = comp.card_multipliers || {}; // Default to empty object

    for (let suit of suits) {
        for (let value of values) {
            let weight = parseInt(value);
            if (value === 'J' || value === 'Q' || value === 'K') weight = 10;
            if (value === 'A') weight = 11; // Handle as 11 initially

            // Check for card multipliers (for Glass Deck)
            let count = multipliers[value] || 1; // Default to 1 if not specified
            
            for (let i = 0; i < count; i++) {
                deck.push({ value, suit, weight });
            }
        }
    }

    // Add special cards (for Blighted Deck)
    if (comp.special_cards) {
        for (const card of comp.special_cards) {
            for (let i = 0; i < card.count; i++) {
                // Add all properties from the definition
                deck.push({ 
                    value: card.value, 
                    suit: card.suit, 
                    weight: card.weight, 
                    id: card.id 
                });
            }
        }
    }
    
    // Add Jokers if player has the Patron Skill (this logic is unchanged from your file)
    if (player && player.roguelikeBlackjackState.patronSkills.includes('Joker\'s Wild')) {
        deck.push({ value: 'Joker', suit: 'JOKER_RED', weight: 12, id: 'joker_red' });
        deck.push({ value: 'Joker', suit: 'JOKER_BLACK', weight: 12, id: 'joker_black' });
    }
    
    return deck;
}

/**
 * Shuffles a deck using Fisher-Yates.
 */
function shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

/**
 * Calculates the total value of a hand, handling Aces.
 * @param {Array} hand - An array of card objects.
 * @returns {number} The calculated value of the hand.
 */
function calculateHandValue(hand) {
    let value = 0;
    let aceCount = 0;
    for (let card of hand) {
        value += card.weight;
        if (card.value === 'A') aceCount++;
    }
    // De-value Aces from 11 to 1 if the total is over 21
    while (value > 21 && aceCount > 0) {
        value -= 10;
        aceCount--;
    }
    return value;
}

/**
 * Starts a new game of Blackjack.
 * @param {number} betAmount - The amount of gold the player is betting.
 */
function startBlackjack(betAmount) {
    if (betAmount <= 0) {
         blackjackState.statusMessage = "You must bet something!";
        updateBlackjackUI();
        return;
    }
    if (player.gold < betAmount) {
        blackjackState.statusMessage = "Not enough gold for that bet.";
        updateBlackjackUI(); // Tell rendering to update
        return;
    }

    player.gold -= betAmount;
    player.lastCasinoBet = betAmount; // <-- MODIFIED
    blackjackState = {
        deck: createDeck(),
        playerHand: [],
        dealerHand: [],
        bet: betAmount,
        gamePhase: 'playerTurn',
        statusMessage: 'Your turn. Hit or Stand?'
    };
    shuffleDeck(blackjackState.deck);

    // Deal initial hands
    blackjackState.playerHand.push(blackjackState.deck.pop());
    blackjackState.dealerHand.push(blackjackState.deck.pop());
    blackjackState.playerHand.push(blackjackState.deck.pop());
    blackjackState.dealerHand.push(blackjackState.deck.pop());

    // Check for initial Blackjack
    const playerValue = calculateHandValue(blackjackState.playerHand);
    if (playerValue === 21) {
        // Check if dealer *also* has blackjack
        if (calculateHandValue(blackjackState.dealerHand) === 21) {
             blackjackState.statusMessage = 'Push! You both have Blackjack. Bet returned.';
             blackjackState.gamePhase = 'results';
             player.gold += blackjackState.bet; // Return bet
        } else {
            blackjackState.statusMessage = 'Blackjack! You win!';
            blackjackState.gamePhase = 'results';
            player.gold += Math.floor(betAmount * 2.5); // 3:2 payout (bet back + 1.5x winnings)
        }
    }

    updateBlackjackUI();
    updateStatsView(); // Update gold display
}

/**
 * Player chooses to "Hit" (take another card).
 */
function playerHit() {
    if (blackjackState.gamePhase !== 'playerTurn') return;
    blackjackState.playerHand.push(blackjackState.deck.pop());
    
    const playerValue = calculateHandValue(blackjackState.playerHand);
    if (playerValue > 21) {
        blackjackState.statusMessage = `Bust! You lose ${blackjackState.bet} G.`;
        blackjackState.gamePhase = 'results';
        // Gold was already taken
        logAllyDialogueChance(player.npcAlly, 'ON_IDLE'); // Ally can comment on failure
    } else if (playerValue === 21) {
        blackjackState.statusMessage = '21! Dealer\'s turn.';
        updateBlackjackUI(); // Update UI to show 21
        playerStand(); // Automatically stand on 21
        return;
    } else {
            blackjackState.statusMessage = 'Your turn. Hit or Stand?';
    }
    updateBlackjackUI();
}

/**
 * Player chooses to "Stand" (end their turn).
 */
async function playerStand() {
    if (blackjackState.gamePhase !== 'playerTurn') return;
    blackjackState.gamePhase = 'dealerTurn';
    blackjackState.statusMessage = 'Dealer is playing...';
    updateBlackjackUI(); // Show dealer's hidden card

    // Dealer hits on 16 or less
    while (calculateHandValue(blackjackState.dealerHand) < 17) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Pause for drama
        blackjackState.dealerHand.push(blackjackState.deck.pop());
        updateBlackjackUI();
    }
    determineWinner();
}

/**
 * Compares hands and determines the winner.
 */
function determineWinner() {
    const playerScore = calculateHandValue(blackjackState.playerHand);
    const dealerScore = calculateHandValue(blackjackState.dealerHand);

    if (dealerScore > 21) {
        blackjackState.statusMessage = `Dealer busts! You win ${blackjackState.bet * 2} G!`;
        player.gold += blackjackState.bet * 2; // Win 2x (bet back + winnings)
    } else if (playerScore > dealerScore) {
        blackjackState.statusMessage = `You win! You get ${blackjackState.bet * 2} G!`;
        player.gold += blackjackState.bet * 2;
    } else if (dealerScore > playerScore) {
        blackjackState.statusMessage = `Dealer wins. You lose ${blackjackState.bet} G.`;
        // Gold already lost
    } else { // Push (tie)
        blackjackState.statusMessage = 'Push! Your bet is returned.';
        player.gold += blackjackState.bet; // Return bet
    }
    
    blackjackState.gamePhase = 'results';
    updateBlackjackUI();
    updateStatsView();
}

let pokerState = {
    deck: [],
    playerHand: [],
    dealerHand: [],
    bet: 0,
    pot: 0,
    gamePhase: 'betting', // 'betting', 'drawing', 'results'
    statusMessage: 'Place your ante to play.',
    playerDiscards: [], // Array of card indices to discard
};

// --- 1. POKER GAME FLOW ---

/**
 * Starts a new game of 5-Card Draw poker.
 * @param {number} ante - The initial bet to join the game.
 */
function startPoker(ante) {
    if (ante <= 0) {
        pokerState.statusMessage = "You must bet something!";
        updatePokerUI();
        return;
    }
    if (player.gold < ante) {
        pokerState.statusMessage = "Not enough gold for the ante.";
        updatePokerUI();
        return;
    }

    player.gold -= ante;
    player.lastCasinoAnte = ante; // <-- MODIFIED
    const newDeck = createDeck();
    shuffleDeck(newDeck);

    pokerState = {
        deck: newDeck,
        playerHand: [],
        dealerHand: [],
        bet: ante,
        pot: ante,
        gamePhase: 'drawing', // Player's turn to draw
        statusMessage: 'Select cards to discard (0-5), then hit Draw.',
        playerDiscards: []
    };

    // Deal 5 cards to each
    for (let i = 0; i < 5; i++) {
        pokerState.playerHand.push(pokerState.deck.pop());
        pokerState.dealerHand.push(pokerState.deck.pop());
    }

    updatePokerUI();
    updateStatsView();
}

/**
 * Handles the player's draw action.
 */
async function playerDraw() {
    if (pokerState.gamePhase !== 'drawing') return;

    // 1. Discard selected cards
    let discardCount = pokerState.playerDiscards.length;
    let newHand = [];
    for (let i = 0; i < 5; i++) {
        if (!pokerState.playerDiscards.includes(i)) {
            newHand.push(pokerState.playerHand[i]);
        }
    }
    pokerState.playerHand = newHand;
    pokerState.statusMessage = `You discarded ${discardCount} card(s).`;
    updatePokerUI(); // Show the hand with discarded cards removed

    await new Promise(resolve => setTimeout(resolve, 1000)); // Pause for effect

    // 2. Draw new cards
    for (let i = 0; i < discardCount; i++) {
        if (pokerState.deck.length === 0) { // Safety check
            addToLog("Reshuffling deck...", "text-gray-400");
            pokerState.deck = createDeck();
            shuffleDeck(pokerState.deck);
        }
        pokerState.playerHand.push(pokerState.deck.pop());
    }
    
    pokerState.statusMessage = 'You drew new cards. Dealer is thinking...';
    updatePokerUI(); // Show the final player hand

    await new Promise(resolve => setTimeout(resolve, 1500)); // Pause

    // 3. Trigger Dealer AI
    dealerDrawAI();
}

/**
 * AI for the dealer's draw phase.
 */
async function dealerDrawAI() {
    const dealerEval = evaluatePokerHand(pokerState.dealerHand);
    let cardsToDiscard = [];

    // AI Strategy (Simple)
    // 1. Stand on anything good (Straight or better)
    if (dealerEval.rank >= 4) {
        // Stand pat
        cardsToDiscard = [];
    }
    // 2. Draw for flushes or straights
    else if (dealerEval.draws.fourToFlush.length > 0) {
        cardsToDiscard = dealerEval.draws.fourToFlush; // Keep the 4, discard the 1
    }
    else if (dealerEval.draws.fourToStraight.length > 0) {
        cardsToDiscard = dealerEval.draws.fourToStraight; // Keep the 4, discard the 1
    }
    // 3. Keep pairs
    else if (dealerEval.rank === 3) { // Two Pair
        // Keep the pairs, discard the 1 odd card
        cardsToDiscard = [pokerState.dealerHand.findIndex(card => !dealerEval.kickers.some(k => k.value === card.value))];
    }
    else if (dealerEval.rank === 2) { // Three of a Kind
        // Keep the three, discard the 2
        cardsToDiscard = pokerState.dealerHand.map((card, i) => (card.weight !== dealerEval.primaryWeight) ? i : -1).filter(i => i !== -1);
    }
    else if (dealerEval.rank === 1) { // One Pair
        // Keep the pair, discard the 3
        cardsToDiscard = pokerState.dealerHand.map((card, i) => (card.weight !== dealerEval.primaryWeight) ? i : -1).filter(i => i !== -1);
    }
    // 4. High Card
    else {
        // Discard 3 lowest cards (keep 2 highest)
        let sortedHand = [...pokerState.dealerHand].map((card, i) => ({ card, i })).sort((a, b) => b.card.weight - a.card.weight);
        cardsToDiscard = sortedHand.slice(2).map(item => item.i); // Discard the 3 lowest
    }

    // Perform the discard/draw
    let newHand = [];
    for (let i = 0; i < 5; i++) {
        if (!cardsToDiscard.includes(i)) {
            newHand.push(pokerState.dealerHand[i]);
        }
    }
    pokerState.dealerHand = newHand;

    pokerState.statusMessage = `Dealer discarded ${cardsToDiscard.length} card(s).`;
    updatePokerUI(); // Show dealer's hand *before* drawing

    await new Promise(resolve => setTimeout(resolve, 1500)); // Pause

    for (let i = 0; i < cardsToDiscard.length; i++) {
        if (pokerState.deck.length === 0) {
            pokerState.deck = createDeck();
            shuffleDeck(pokerState.deck);
        }
        pokerState.dealerHand.push(pokerState.deck.pop());
    }

    pokerState.statusMessage = 'Dealer drew new cards. Showdown!';
    updatePokerUI(); // Show new dealer hand (still hidden)

    await new Promise(resolve => setTimeout(resolve, 1500)); // Final pause
    
    // 4. Determine Winner
    determinePokerWinner();
}

/**
 * Compares player and dealer hands and pays out.
 */
function determinePokerWinner() {
    const playerEval = evaluatePokerHand(pokerState.playerHand);
    const dealerEval = evaluatePokerHand(pokerState.dealerHand);

    let win = false;
    let push = false;

    if (playerEval.rank > dealerEval.rank) {
        win = true;
    } else if (playerEval.rank < dealerEval.rank) {
        win = false;
    } else {
        // Ranks are tied, compare primary kicker
        if (playerEval.primaryWeight > dealerEval.primaryWeight) {
            win = true;
        } else if (playerEval.primaryWeight < dealerEval.primaryWeight) {
            win = false;
        } else {
            // Primary kickers tied, compare secondary (for Two Pair)
            if (playerEval.secondaryWeight > dealerEval.secondaryWeight) {
                win = true;
            } else if (playerEval.secondaryWeight < dealerEval.secondaryWeight) {
                win = false;
            } else {
                // Hands are truly identical (or kickers are)
                push = true;
            }
        }
    }

    if (push) {
        pokerState.statusMessage = `Push! ${playerEval.handName} vs ${dealerEval.handName}. Bet returned.`;
        player.gold += pokerState.pot;
    } else if (win) {
        const winnings = pokerState.pot * 2; // 1:1 payout on the ante
        pokerState.statusMessage = `You win! ${playerEval.handName} beats ${dealerEval.handName}. You win ${winnings} G!`;
        player.gold += winnings;
    } else {
        pokerState.statusMessage = `You lose. ${dealerEval.handName} beats ${playerEval.handName}. You lose ${pokerState.pot} G.`;
        // Gold already lost
    }

    pokerState.gamePhase = 'results';
    updatePokerUI();
    updateStatsView();
}


// --- 2. POKER HAND EVALUATION ---

/**
 * Evaluates a 5-card poker hand.
 * @param {Array} hand - An array of 5 card objects.
 * @returns {object} An object containing the rank, hand name, and kicker values.
 */
function evaluatePokerHand(hand) {
    const values = hand.map(c => c.value).sort((a, b) => VALUES.indexOf(a) - VALUES.indexOf(b));
    const weights = hand.map(c => c.weight).sort((a, b) => a - b);
    const suits = hand.map(c => c.suit);
    
    const isFlush = suits.every(s => s === suits[0]);
    
    // Check for Ace-low straight (A, 2, 3, 4, 5)
    const isAceLowStraight = weights.join(',') === '2,3,4,5,11'; // A,2,3,4,5
    if (isAceLowStraight) {
        // Re-order weights to be 5-high for comparison
        weights = [1, 2, 3, 4, 5]; // 1 is Ace-low
    }
    
    const isStraight = isAceLowStraight || weights.every((w, i) => i === 0 || w === weights[i-1] + 1);
    
    // --- Check for Draws (for AI) ---
    const suitCounts = {};
    suits.forEach(s => suitCounts[s] = (suitCounts[s] || 0) + 1);
    const fourToFlushSuit = Object.keys(suitCounts).find(s => suitCounts[s] === 4);
    
    let fourToFlushDiscard = [];
    if (fourToFlushSuit) {
        const discardIndex = hand.findIndex(c => c.suit !== fourToFlushSuit);
        fourToFlushDiscard = [discardIndex];
    }
    
    // Simple 4-to-a-straight check (open-ended or gut-shot)
    let fourToStraightDiscard = [];
    const sortedUniqueWeights = [...new Set(weights)].sort((a, b) => a - b);
    if (sortedUniqueWeights.length === 4) {
        const diff1 = sortedUniqueWeights[1] - sortedUniqueWeights[0];
        const diff2 = sortedUniqueWeights[2] - sortedUniqueWeights[1];
        const diff3 = sortedUniqueWeights[3] - sortedUniqueWeights[2];
        // e.g., [2,3,4,5] or [5,6,7,8] or [J,Q,K,A]
        if (diff1 === 1 && diff2 === 1 && diff3 === 1) {
            // This is 4 in a row. Find the odd card from the *original* hand
            const outlierIndex = hand.findIndex(c => !sortedUniqueWeights.includes(c.weight));
            if(outlierIndex !== -1) fourToStraightDiscard = [outlierIndex];
        }
    } else if (sortedUniqueWeights.length === 5) {
        // Check for 4-to-a-straight with one outlier
        for (let i = 0; i < 5; i++) {
            let tempHand = [...sortedUniqueWeights];
            tempHand.splice(i, 1); // Remove one card
            const diff1 = tempHand[1] - tempHand[0];
            const diff2 = tempHand[2] - tempHand[1];
            const diff3 = tempHand[3] - tempHand[2];
            if (diff1 === 1 && diff2 === 1 && diff3 === 1) {
                const outlierValue = sortedUniqueWeights[i];
                fourToStraightDiscard = [hand.findIndex(c => c.weight === outlierValue)];
                break;
            }
        }
    }
    // --- End Draw Check ---

    // Check for Royal Flush
    if (isStraight && isFlush && weights[4] === 11 && weights[0] === 7) { // 10,J,Q,K,A
        return { rank: 9, handName: 'Royal Flush', primaryWeight: 14, secondaryWeight: 0, kickers: [], draws: { fourToFlush: fourToFlushDiscard, fourToStraight: fourToStraightDiscard } };
    }
    // Check for Straight Flush
    if (isStraight && isFlush) {
        const highCard = isAceLowStraight ? 5 : weights[4];
        return { rank: 8, handName: 'Straight Flush', primaryWeight: highCard, secondaryWeight: 0, kickers: [], draws: { fourToFlush: fourToFlushDiscard, fourToStraight: fourToStraightDiscard } };
    }


    // Count value frequencies
    const counts = {};
    const kickers = [];
    hand.forEach(card => counts[card.value] = (counts[card.value] || 0) + 1);
    
    let pairs = [];
    let threes = null;
    let fours = null;

    for (const value in counts) {
        const weight = VALUES.indexOf(value) + 2; // e.g., 'A' is index 12 -> 14
        if (counts[value] === 4) fours = { value, weight };
        else if (counts[value] === 3) threes = { value, weight };
        else if (counts[value] === 2) pairs.push({ value, weight });
        else kickers.push({ value, weight });
    }
    
    pairs.sort((a, b) => b.weight - a.weight);
    kickers.sort((a, b) => b.weight - a.weight);
    
    // Check for Four of a Kind
    if (fours) {
        return { rank: 7, handName: 'Four of a Kind', primaryWeight: fours.weight, secondaryWeight: kickers[0].weight, kickers: kickers, draws: { fourToFlush: fourToFlushDiscard, fourToStraight: fourToStraightDiscard } };
    }
    // Check for Full House
    if (threes && pairs.length > 0) {
        return { rank: 6, handName: 'Full House', primaryWeight: threes.weight, secondaryWeight: pairs[0].weight, kickers: [], draws: { fourToFlush: fourToFlushDiscard, fourToStraight: fourToStraightDiscard } };
    }
    // Check for Flush
    if (isFlush) {
        return { rank: 5, handName: 'Flush', primaryWeight: weights[4], secondaryWeight: 0, kickers: hand.map(c => ({ value: c.value, weight: c.weight })).sort((a,b) => b.weight - a.weight), draws: { fourToFlush: fourToFlushDiscard, fourToStraight: fourToStraightDiscard } };
    }
    // Check for Straight
    if (isStraight) {
        const highCard = isAceLowStraight ? 5 : weights[4];
        return { rank: 4, handName: 'Straight', primaryWeight: highCard, secondaryWeight: 0, kickers: [], draws: { fourToFlush: fourToFlushDiscard, fourToStraight: fourToStraightDiscard } };
    }
    // Check for Three of a Kind
    if (threes) {
        return { rank: 3, handName: 'Three of a Kind', primaryWeight: threes.weight, secondaryWeight: 0, kickers: kickers, draws: { fourToFlush: fourToFlushDiscard, fourToStraight: fourToStraightDiscard } };
    }
    // Check for Two Pair
    if (pairs.length === 2) {
        return { rank: 2, handName: 'Two Pair', primaryWeight: pairs[0].weight, secondaryWeight: pairs[1].weight, kickers: kickers, draws: { fourToFlush: fourToFlushDiscard, fourToStraight: fourToStraightDiscard } };
    }
    // Check for One Pair
    if (pairs.length === 1) {
        return { rank: 1, handName: 'One Pair', primaryWeight: pairs[0].weight, secondaryWeight: 0, kickers: kickers, draws: { fourToFlush: fourToFlushDiscard, fourToStraight: fourToStraightDiscard } };
    }

    // High Card
    return { 
        rank: 0, 
        handName: 'High Card', 
        primaryWeight: kickers[0].weight, 
        secondaryWeight: 0,
        kickers: kickers,
        draws: {
            fourToFlush: fourToFlushDiscard,
            fourToStraight: fourToStraightDiscard
        }
    };
}

// =================================================================================
// --- SLOT MACHINE LOGIC ---
// =================================================================================
const SLOT_SYMBOL_HEIGHT = 128; // 8rem at 16px/rem = 128px. This MUST match your .reel-symbol CSS height.

const REELS = [
    '🍒', '🍒', '🍒', '🍒', '🍒', '🍒', // 6 Cherries
    '🧈', '🧈', '🧈', '🧈', // 4 BARS
    '7️⃣', '7️⃣', '7️⃣', // 3 Sevens
    '💰', '💰', // 2 Moneybags
    '💎' // 1 Diamond
];

// Payouts are multipliers of the bet
const PAYTABLE = {
    '💎💎💎': 500,
    '💰💰💰': 100,
    '7️⃣7️⃣7️⃣': 75,
    '🧈🧈🧈': 25,
    '🍒🍒🍒': 10,
    '🍒🍒_': 5, // Any two cherries
    '🍒__': 2  // Any one cherry
};

function startSlots(betAmount) {
    if (betAmount <= 0) {
        slotState.statusMessage = "You must bet something!";
        updateSlotUI();
        return;
    }
    if (player.gold < betAmount) {
        slotState.statusMessage = "Not enough gold for that bet.";
        updateSlotUI();
        return;
    }

    player.gold -= betAmount;
    player.lastCasinoBet = betAmount;
    slotState.bet = betAmount;
    slotState.gamePhase = 'spinning';
    slotState.statusMessage = 'Spinning...';
    
    updateStatsView(); // Update gold display
    updateSlotUI(); // This will disable the betting button

    // --- NEW ANIMATION LOGIC ---
    const strips = [
        document.getElementById('reel-strip-0'),
        document.getElementById('reel-strip-1'),
        document.getElementById('reel-strip-2')
    ];

    // Add the .spinning class to start the CSS animation
    strips.forEach(strip => {
        strip.classList.add('spinning');
    });
    // --- END NEW ANIMATION LOGIC ---


    // This interval is now just a timer. The animation is handled by CSS.
    let spinCount = 0;
    const maxSpins = 15; // This is now just a timer for ~1.5 seconds
    const spinInterval = setInterval(() => {
        spinCount++;
        
        // --- REMOVED: All visual update logic from the interval ---

        if (spinCount > maxSpins) {
            clearInterval(spinInterval);
            // --- MODIFIED: Pass strips to the winner function ---
            determineSlotWinner(strips);
        }
    }, 100);
}

// This function determines the *final* outcome
function spinReels() {
    return [
        REELS[Math.floor(Math.random() * REELS.length)],
        REELS[Math.floor(Math.random() * REELS.length)],
        REELS[Math.floor(Math.random() * REELS.length)]
    ];
}

function determineSlotWinner(strips) {
    const finalReels = spinReels(); // Get the one, true result
    slotState.reels = finalReels;
    
    const [r1, r2, r3] = finalReels;
    let winnings = 0;
    let winKey = '';

    // Check from highest to lowest
    if (r1 === '💎' && r2 === '💎' && r3 === '💎') winKey = '💎💎💎';
    else if (r1 === '💰' && r2 === '💰' && r3 === '💰') winKey = '💰💰💰';
    else if (r1 === '7️⃣' && r2 === '7️⃣' && r3 === '7️⃣') winKey = '7️⃣7️⃣7️⃣';
    else if (r1 === 'BAR' && r2 === 'BAR' && r3 === 'BAR') winKey = 'BARBARBAR';
    else if (r1 === '🍒' && r2 === '🍒' && r3 === '🍒') winKey = '🍒🍒🍒';
    else if (r1 === '🍒' && r2 === '🍒') winKey = '🍒🍒_';
    else if (r1 === '🍒') winKey = '🍒__';

    if (PAYTABLE[winKey]) {
        winnings = slotState.bet * PAYTABLE[winKey];
        // DO NOT add to player.gold yet, wait for the reels to stop.
        slotState.statusMessage = `You won ${winnings} G!`;
    } else {
        slotState.statusMessage = `You lost ${slotState.bet} G.`;
    }

    // --- NEW: Trigger the staggered stop ---
    // This new helper function will handle the animation and timeouts.
    stopReel(strips, 0, finalReels, winnings, winKey, slotState.statusMessage);
}

function stopReel(strips, reelIndex, finalReels, winnings, winKey, statusMessage) {
    // Base case: All reels have stopped
    if (reelIndex >= 3) {
        // Wait for the last reel's animation to finish
        setTimeout(() => {
            if (winnings > 0) {
                player.gold += winnings;
                addToLog(`You hit ${winKey} and won ${winnings} G!`, 'text-green-400');
            } else {
                addToLog(`The reels stop. You lost ${slotState.bet} G.`, 'text-red-400');
            }

            slotState.gamePhase = 'results';
            slotState.statusMessage = statusMessage; // Set the final message
            updateSlotUI();
            updateStatsView();
        }, 1500); // Wait for the 1.5s CSS transition to finish
        return;
    }

    // Recursive case: Stop the current reel
    const strip = strips[reelIndex];
    const finalSymbol = finalReels[reelIndex];
    
    let symbolIndex = REELS.indexOf(finalSymbol);
    if (symbolIndex === -1) symbolIndex = 0; // Fallback

    // Land on the symbol in the *third* repetition
    const targetIndex = (REELS.length * 2) + symbolIndex;
    const pixelJitter = Math.floor(Math.random() * 3);
    const finalY = - (targetIndex * SLOT_SYMBOL_HEIGHT) + pixelJitter;

    // Remove the spinning class and set the final transform
    strip.classList.remove('spinning');
    strip.style.transform = `translateY(${finalY}px)`;

    // --- Stagger the next call ---
    let delay = 500; // Default delay
    if (reelIndex === 1) { // The last reel
        delay = 1000; // Tense wait for the 3rd reel
    }

    setTimeout(() => {
        stopReel(strips, reelIndex + 1, finalReels, winnings, winKey, statusMessage);
    }, delay);
}

// =================================================================================
// --- BACCARAT LOGIC (STUB) ---
// =================================================================================
// =================================================================================
// --- BACCARAT LOGIC ---
// =================================================================================

let baccaratState = {
    deck: [],
    playerHand: [],
    bankerHand: [],
    playerScore: 0,
    bankerScore: 0,
    bet: 0,
    betOn: null, // 'player', 'banker', 'tie'
    gamePhase: 'betting', // 'betting', 'drawing', 'results'
    statusMessage: 'Place your bet to begin.'
};

/**
 * Calculates the value of a Baccarat hand (0-9).
 * Face/10s = 0, Ace = 1, 2-9 = face value.
 * @param {Array} hand - An array of card objects.
 * @returns {number} The calculated Baccarat value.
 */
function calculateBaccaratValue(hand) {
    let value = 0;
    for (let card of hand) {
        if (['J', 'Q', 'K', '10'].includes(card.value)) {
            value += 0;
        } else if (card.value === 'A') {
            value += 1;
        } else {
            value += card.weight; // 2-9 are same as weight
        }
    }
    return value % 10; // Baccarat value is the last digit of the sum
}

/**
 * Starts a new game of Baccarat.
 * @param {number} betAmount - The amount of gold to bet.
 * @param {string} betOn - 'player', 'banker', or 'tie'.
 */
async function startBaccarat(betAmount, betOn) {
    if (betAmount <= 0) {
        baccaratState.statusMessage = "You must bet something!";
        updateBaccaratUI();
        return;
    }
    if (player.gold < betAmount) {
        baccaratState.statusMessage = "Not enough gold for that bet.";
        updateBaccaratUI();
        return;
    }

    player.gold -= betAmount;
    player.lastCasinoBet = betAmount;
    baccaratState = {
        deck: createDeck(),
        playerHand: [],
        bankerHand: [],
        playerScore: 0,
        bankerScore: 0,
        bet: betAmount,
        betOn: betOn,
        gamePhase: 'drawing',
        statusMessage: 'Dealing cards...'
    };
    shuffleDeck(baccaratState.deck);

    updateBaccaratUI();
    updateStatsView(); // Update gold display

    // 1. Deal initial hands
    await new Promise(resolve => setTimeout(resolve, 500));
    baccaratState.playerHand.push(baccaratState.deck.pop());
    updateBaccaratUI();
    await new Promise(resolve => setTimeout(resolve, 500));
    baccaratState.bankerHand.push(baccaratState.deck.pop());
    updateBaccaratUI();
    await new Promise(resolve => setTimeout(resolve, 500));
    baccaratState.playerHand.push(baccaratState.deck.pop());
    updateBaccaratUI();
    await new Promise(resolve => setTimeout(resolve, 500));
    baccaratState.bankerHand.push(baccaratState.deck.pop());
    
    baccaratState.playerScore = calculateBaccaratValue(baccaratState.playerHand);
    baccaratState.bankerScore = calculateBaccaratValue(baccaratState.bankerHand);
    baccaratState.statusMessage = `Player has ${baccaratState.playerScore}, Banker has ${baccaratState.bankerScore}.`;
    updateBaccaratUI();

    // 2. Check for Naturals
    if (baccaratState.playerScore >= 8 || baccaratState.bankerScore >= 8) {
        baccaratState.statusMessage = `Natural! ${baccaratState.playerScore >= 8 ? 'Player' : 'Banker'} wins.`;
        if (baccaratState.playerScore === baccaratState.bankerScore) {
            baccaratState.statusMessage = "Natural! It's a Tie.";
        }
        await new Promise(resolve => setTimeout(resolve, 1500));
        determineBaccaratWinner();
        return;
    }

    // 3. Proceed to drawing logic
    await new Promise(resolve => setTimeout(resolve, 1500));
    baccaratDrawingLogic();
}

/**
 * Executes the rigid Baccarat drawing rules (Tableau).
 */
async function baccaratDrawingLogic() {
    let playerDrew = false;
    let playerThirdCard = null;

    // --- Player's Turn ---
    if (baccaratState.playerScore <= 5) {
        // Player draws
        playerDrew = true;
        playerThirdCard = baccaratState.deck.pop();
        baccaratState.playerHand.push(playerThirdCard);
        baccaratState.playerScore = calculateBaccaratValue(baccaratState.playerHand);
        baccaratState.statusMessage = `Player draws a ${playerThirdCard.value}. Player score: ${baccaratState.playerScore}.`;
        updateBaccaratUI();
        await new Promise(resolve => setTimeout(resolve, 1500));
    } else {
        // Player stands
        baccaratState.statusMessage = `Player stands on ${baccaratState.playerScore}.`;
        updateBaccaratUI();
        await new Promise(resolve => setTimeout(resolve, 1500));
    }

    // --- Banker's Turn ---
    let bankerDraws = false;
    const bankerScore = baccaratState.bankerScore; // Score from 2 cards
    const playerThirdCardValue = playerThirdCard ? (playerThirdCard.weight === 11 ? 1 : playerThirdCard.weight) : -1; // 10/J/Q/K = 10, A = 1

    if (!playerDrew) {
        // --- If Player Stood (has 2 cards) ---
        // Banker follows the same rule as the player.
        if (bankerScore <= 5) {
            bankerDraws = true;
        }
    } else {
        // --- If Player Drew (has 3 cards) ---
        // Banker follows the Tableau
        if (bankerScore <= 2) {
            bankerDraws = true;
        } else if (bankerScore === 3) {
            if (playerThirdCardValue !== 8) bankerDraws = true;
        } else if (bankerScore === 4) {
            if ([2, 3, 4, 5, 6, 7].includes(playerThirdCardValue)) bankerDraws = true;
        } else if (bankerScore === 5) {
            if ([4, 5, 6, 7].includes(playerThirdCardValue)) bankerDraws = true;
        } else if (bankerScore === 6) {
            if ([6, 7].includes(playerThirdCardValue)) bankerDraws = true;
        }
        // If Banker score is 7, Banker always stands.
    }

    if (bankerDraws) {
        const bankerThirdCard = baccaratState.deck.pop();
        baccaratState.bankerHand.push(bankerThirdCard);
        baccaratState.bankerScore = calculateBaccaratValue(baccaratState.bankerHand);
        baccaratState.statusMessage = `Banker draws a ${bankerThirdCard.value}. Banker score: ${baccaratState.bankerScore}.`;
        updateBaccaratUI();
        await new Promise(resolve => setTimeout(resolve, 1500));
    } else {
        baccaratState.statusMessage = 'Banker stands.';
        updateBaccaratUI();
        await new Promise(resolve => setTimeout(resolve, 1500));
    }

    // --- Go to Results ---
    determineBaccaratWinner();
}

/**
 * Compares final hands and pays out Baccarat bets.
 */
function determineBaccaratWinner() {
    const pScore = baccaratState.playerScore;
    const bScore = baccaratState.bankerScore;
    const betOn = baccaratState.betOn;
    const bet = baccaratState.bet;
    
    let winner = null;
    let winnings = 0;

    if (pScore > bScore) winner = 'player';
    else if (bScore > pScore) winner = 'banker';
    else winner = 'tie';

    if (betOn === winner) {
        if (winner === 'player') {
            winnings = bet * 2; // 1:1 (bet back + 1x)
            baccaratState.statusMessage = `Player wins! You win ${winnings} G.`;
        } else if (winner === 'banker') {
            winnings = bet + Math.floor(bet * 0.95); // 1:1 minus 5% commission (bet back + 0.95x)
            baccaratState.statusMessage = `Banker wins! You win ${winnings} G.`;
        } else { // 'tie'
            winnings = bet * 9; // 8:1 (bet back + 8x)
            baccaratState.statusMessage = `Tie! You win ${winnings} G!`;
        }
        player.gold += winnings;
    } else {
        if (winner === 'tie') {
            // Bet on Player or Banker and it's a Tie
            baccaratState.statusMessage = `It's a Tie! Your bet is returned.`;
            player.gold += bet; // Push
        } else {
            // You bet wrong
            baccaratState.statusMessage = `You bet on ${capitalize(betOn)}, but ${capitalize(winner)} won. You lose ${bet} G.`;
        }
    }

    baccaratState.gamePhase = 'results';
    updateBaccaratUI();
    updateStatsView();
}


// =================================================================================
// --- ROULETTE LOGIC ---
// =================================================================================
let lastSpinCellId = null;
// Helper constant for number properties
const ROULETTE_NUMBERS = {
    0: { color: 'green', isOdd: null, dozen: null, column: null, range: null },
    1: { color: 'red', isOdd: true, dozen: 1, column: 1, range: 'low' },
    2: { color: 'black', isOdd: false, dozen: 1, column: 2, range: 'low' },
    3: { color: 'red', isOdd: true, dozen: 1, column: 3, range: 'low' },
    4: { color: 'black', isOdd: false, dozen: 1, column: 1, range: 'low' },
    5: { color: 'red', isOdd: true, dozen: 1, column: 2, range: 'low' },
    6: { color: 'black', isOdd: false, dozen: 1, column: 3, range: 'low' },
    7: { color: 'red', isOdd: true, dozen: 1, column: 1, range: 'low' },
    8: { color: 'black', isOdd: false, dozen: 1, column: 2, range: 'low' },
    9: { color: 'red', isOdd: true, dozen: 1, column: 3, range: 'low' },
    10: { color: 'black', isOdd: false, dozen: 1, column: 1, range: 'low' },
    11: { color: 'black', isOdd: true, dozen: 1, column: 2, range: 'low' },
    12: { color: 'red', isOdd: false, dozen: 1, column: 3, range: 'low' },
    13: { color: 'black', isOdd: true, dozen: 2, column: 1, range: 'low' },
    14: { color: 'red', isOdd: false, dozen: 2, column: 2, range: 'low' },
    15: { color: 'black', isOdd: true, dozen: 2, column: 3, range: 'low' },
    16: { color: 'red', isOdd: false, dozen: 2, column: 1, range: 'low' },
    17: { color: 'black', isOdd: true, dozen: 2, column: 2, range: 'low' },
    18: { color: 'red', isOdd: false, dozen: 2, column: 3, range: 'low' },
    19: { color: 'red', isOdd: true, dozen: 2, column: 1, range: 'high' },
    20: { color: 'black', isOdd: false, dozen: 2, column: 2, range: 'high' },
    21: { color: 'red', isOdd: true, dozen: 2, column: 3, range: 'high' },
    22: { color: 'black', isOdd: false, dozen: 2, column: 1, range: 'high' },
    23: { color: 'red', isOdd: true, dozen: 2, column: 2, range: 'high' },
    24: { color: 'black', isOdd: false, dozen: 2, column: 3, range: 'high' },
    25: { color: 'red', isOdd: true, dozen: 3, column: 1, range: 'high' },
    26: { color: 'black', isOdd: false, dozen: 3, column: 2, range: 'high' },
    27: { color: 'red', isOdd: true, dozen: 3, column: 3, range: 'high' },
    28: { color: 'black', isOdd: false, dozen: 3, column: 1, range: 'high' },
    29: { color: 'black', isOdd: true, dozen: 3, column: 2, range: 'high' },
    30: { color: 'red', isOdd: false, dozen: 3, column: 3, range: 'high' },
    31: { color: 'black', isOdd: true, dozen: 3, column: 1, range: 'high' },
    32: { color: 'red', isOdd: false, dozen: 3, column: 2, range: 'high' },
    33: { color: 'black', isOdd: true, dozen: 3, column: 3, range: 'high' },
    34: { color: 'red', isOdd: false, dozen: 3, column: 1, range: 'high' },
    35: { color: 'black', isOdd: true, dozen: 3, column: 2, range: 'high' },
    36: { color: 'red', isOdd: false, dozen: 3, column: 3, range: 'high' },
};

// Payouts (e.g., 35:1 means you get 35 * bet, + your original bet back)
const ROULETTE_PAYOUTS = {
    'straight': 35, // 35:1
    'col1': 2,      // 2:1
    'col2': 2,
    'col3': 2,
    '1st12': 2,
    '2nd12': 2,
    '3rd12': 2,
    'low': 1,       // 1:1
    'high': 1,
    'even': 1,
    'odd': 1,
    'red': 1,
    'black': 1
};

// Replace the stub
let rouletteState = {
    betAmountPerChip: 10,
    bets: {}, // e.g., {'red': 1, '17': 2} (tracks chip *count*)
    totalBet: 0,
    gamePhase: 'betting', // 'betting', 'spinning', 'results'
    statusMessage: 'Place your bets!',
    winningNumber: null
};

function placeRouletteBet(betType) {
    if (rouletteState.gamePhase !== 'betting') return;

    // Increment chip count for this bet type
    rouletteState.bets[betType] = (rouletteState.bets[betType] || 0) + 1;
    
    // Recalculate total bet
    recalculateTotalRouletteBet();
    updateRouletteUI();
}

function clearRouletteBets() {
    if (rouletteState.gamePhase !== 'betting') return;
    rouletteState.bets = {};
    rouletteState.totalBet = 0;
    updateRouletteUI();
}

function recalculateTotalRouletteBet() {
    let total = 0;
    for (const betType in rouletteState.bets) {
        total += rouletteState.bets[betType];
    }
    rouletteState.totalBet = total * rouletteState.betAmountPerChip;
}

async function spinRouletteWheel() {
    const state = rouletteState;
    if (state.gamePhase !== 'betting' || state.totalBet === 0) return;

    if (player.gold < state.totalBet) {
        state.statusMessage = "Not enough gold for this bet.";
        updateRouletteUI();
        return;
    }

    player.gold -= state.totalBet;
    player.lastCasinoBet = state.betAmountPerChip;
    state.gamePhase = 'spinning';
    state.statusMessage = 'No more bets! Spinning...';
    updateStatsView();
    updateRouletteUI(); // This disables all betting UI

    // --- NEW SPIN ANIMATION LOGIC ---
    let spinDuration = 3000; // 3 seconds total
    let fastSpinInterval = 100; // 10 flashes per second
    let spinTimer = 0;

    const fastSpin = setInterval(() => {
        spinTimer += fastSpinInterval;
        
        // 1. Clear previous flash
        if (lastSpinCellId) {
            const lastCell = document.getElementById(lastSpinCellId);
            if (lastCell) lastCell.classList.remove('spin-active');
        }

        // 2. Pick new random number and flash it
        const randomNum = Math.floor(Math.random() * 37); // 0-36
        
        // 3. Flash cell on the table
        const newCellId = `roulette-cell-${randomNum}`;
        const newCell = document.getElementById(newCellId);
        if (newCell) {
            newCell.classList.add('spin-active');
            lastSpinCellId = newCellId;
        }

        // 4. Update central display to follow the spin
        updateRouletteUI(true, randomNum); // Pass spinning=true and the number

        // 5. Check if spin is over
        if (spinTimer >= spinDuration) {
            clearInterval(fastSpin);
            
            // 6. Clear the *last* flashed cell
            if (lastSpinCellId) {
                const lastCell = document.getElementById(lastSpinCellId);
                if (lastCell) lastCell.classList.remove('spin-active');
            }

            // 7. Pick final number and determine winner
            const winningNumber = Math.floor(Math.random() * 37);
            state.winningNumber = winningNumber;
            determineRouletteWinner(winningNumber);
        }
    }, fastSpinInterval);
    // --- END NEW SPIN LOGIC ---
}

function determineRouletteWinner(number) {
    const state = rouletteState;
    const numInfo = ROULETTE_NUMBERS[number];
    
    // --- NEW: Highlight Winning Cells ---
    // 1. Straight up number
    document.getElementById(`roulette-cell-${number}`)?.classList.add('winner');

    // 2. Outside bets (only if not 0)
    if (number > 0) {
        document.getElementById(`roulette-cell-${numInfo.color}`)?.classList.add('winner');
        document.getElementById(`roulette-cell-${numInfo.isOdd ? 'odd' : 'even'}`)?.classList.add('winner');
        document.getElementById(`roulette-cell-${numInfo.range}`)?.classList.add('winner'); // 'low' or 'high'
        
        // Dozen
        if (numInfo.dozen === 1) document.getElementById('roulette-cell-1st12')?.classList.add('winner');
        else if (numInfo.dozen === 2) document.getElementById('roulette-cell-2nd12')?.classList.add('winner');
        else if (numInfo.dozen === 3) document.getElementById('roulette-cell-3rd12')?.classList.add('winner');
        
        // Column
        document.getElementById(`roulette-cell-col${numInfo.column}`)?.classList.add('winner');
    }
    // --- END NEW ---
    
    let totalWinnings = 0;
    let totalBetReturn = 0;

for (const betType in state.bets) {
        const chipCount = state.bets[betType];
        if (chipCount === 0) continue;
        
        const betAmount = chipCount * state.betAmountPerChip;
        let isWin = false;

        // Check straight up numbers
        if (betType.startsWith('straight_')) {
            const num = parseInt(betType.split('_')[1]);
            if (num === number) isWin = true;
        } 
        // Check outside bets
        else if (number > 0) { // Outside bets lose on 0
            switch (betType) {
                case 'red':   if (numInfo.color === 'red') isWin = true; break;
                case 'black': if (numInfo.color === 'black') isWin = true; break;
                case 'even':  if (!numInfo.isOdd) isWin = true; break;
                case 'odd':   if (numInfo.isOdd) isWin = true; break;
                case 'low':   if (numInfo.range === 'low') isWin = true; break;
                case 'high':  if (numInfo.range === 'high') isWin = true; break;
                case '1st12': if (numInfo.dozen === 1) isWin = true; break;
                case '2nd12': if (numInfo.dozen === 2) isWin = true; break;
                case '3rd12': if (numInfo.dozen === 3) isWin = true; break;
                case 'col1':  if (numInfo.column === 1) isWin = true; break;
                case 'col2':  if (numInfo.column === 2) isWin = true; break;
                case 'col3':  if (numInfo.column === 3) isWin = true; break;
            }
        }

        if (isWin) {
            const payoutType = betType.startsWith('straight_') ? 'straight' : betType;
            const payoutRate = ROULETTE_PAYOUTS[payoutType];
            const winnings = betAmount * payoutRate;
            
            totalWinnings += winnings;
            totalBetReturn += betAmount; // Add original bet to be returned
        }
    }

    const totalReturn = totalWinnings + totalBetReturn;
    const netGain = totalReturn - state.totalBet;

    if (totalReturn > 0) {
        player.gold += totalReturn;
        state.statusMessage = `Winner! Number is ${number}. You win ${netGain} G!`;
        addToLog(`The Spinner lands on ${number}! You won ${netGain} G.`, 'text-green-400');
    } else {
        state.statusMessage = `The Spinner lands on ${number}. You lost ${state.totalBet} G.`;
    }

    state.gamePhase = 'results';
    updateRouletteUI();
    updateStatsView();
}

// =================================================================================
// --- ARCANE 21: THE ENDLESS RUN (ROGUELIKE BLACKJACK) ---
// =================================================================================


function startRoguelikeRun(buyInAmount, deckKey = 'base_deck') { // <-- MODIFICATION: Add buyInAmount parameter
    
    // Check if this is a resume or a new run
    const state = player.roguelikeBlackjackState; // <-- NEW: Define state earlier
    const isResuming = state.runActive === false && (state.currentAnteIndex > 0 || state.currentVingtUnIndex > 0);

    // --- NEW: Store the selected deck key ---
    state.deckKey = deckKey;
    if (isResuming) {
        player.roguelikeBlackjackState.runActive = true;
        player.roguelikeBlackjackState.gamePhase = 'shop'; 
        player.roguelikeBlackjackState.statusMessage = 'Resuming run. Welcome back to the shop.';
        
        // --- NEW: Reset shop reroll cost on resume ---
        player.roguelikeBlackjackState.shopRerollCost = player.roguelikeBlackjackState.runUpgrades.baseShopRerollCost || 2;
        // --- END NEW ---
        
        if (!player.roguelikeBlackjackState.shopStock || player.roguelikeBlackjackState.shopStock.length === 0) {
            player.roguelikeBlackjackState.shopStock = generateRoguelikeShopStock();
        }
        
        addToLog(`You resume your run at Ante ${player.roguelikeBlackjackState.currentAnteIndex + 1} for free.`, 'text-yellow-300');
        
    } else {
        // This is a NEW run
        
        // --- MODIFICATION START: Use buyInAmount ---
        if (buyInAmount < 100) {
            addToLog("Buy-in must be at least 100G.", "text-red-400");
            return;
        }
        if (player.gold < buyInAmount) {
            addToLog(`You need ${buyInAmount}G to start a new run.`, 'text-red-400');
            return;
        }
        player.gold -= buyInAmount;
        player.roguelikeBlackjackState.buyIn = buyInAmount; // Store the run's buy-in
        // --- MODIFICATION END ---
        
        // --- NEW: Create masterDeckList ONCE here ---
        const newDeck = createDeck(deckKey); // Create the base deck
        shuffleDeck(newDeck);
        // Assign unique IDs to every card for tracking enhancements
        newDeck.forEach((card, index) => card.uniqueId = `card_${index}`);
        player.roguelikeBlackjackState.masterDeckList = newDeck;
        // --- END NEW ---

        // Reset all progress for the new run
        player.roguelikeBlackjackState.runActive = true;
        player.roguelikeBlackjackState.currentAnteIndex = 0;
        player.roguelikeBlackjackState.currentVingtUnIndex = 0;
        player.roguelikeBlackjackState.currentCrookards = 0; 
        player.roguelikeBlackjackState.passiveModifiers = [];
        player.roguelikeBlackjackState.consumables = [];
        player.roguelikeBlackjackState.patronSkills = [];
        
        // --- NEW: Initialize deck modification properties ---
        player.roguelikeBlackjackState.deckAbilities = {};
        player.roguelikeBlackjackState.cardEnhancements = {};
        player.roguelikeBlackjackState.cardPairs = [];
        // --- END NEW ---

        player.roguelikeBlackjackState.runUpgrades = {
            passiveSlots: 5,
            consumableSlots: 2,
            handSize: 5,
            baseShopRerollCost: 2, // NEW: Base cost
            bonusHandsPerVingtUn: 0,
            bonusRerollsPerVingtUn: 0,
            baseMultiplier: 0,
            rerollsToHands: false // NEW
        };
        // --- NEW: Set initial shop reroll cost ---
        player.roguelikeBlackjackState.shopRerollCost = player.roguelikeBlackjackState.runUpgrades.baseShopRerollCost;
        // --- END NEW ---

        player.roguelikeBlackjackState.gamePhase = 'starting_run';
        player.roguelikeBlackjackState.statusMessage = 'The run begins. Prepare for the first Vingt-un.';
        
        addToLog(`You pay the ${buyInAmount}G buy-in. A new run begins.`, 'text-yellow-300'); // MODIFIED
    }
    
    updateStatsView();
    
    if (player.roguelikeBlackjackState.gamePhase === 'starting_run') {
        startVingtUn();
    } else if (player.roguelikeBlackjackState.gamePhase === 'shop') {
        renderRoguelikeShop(); // Render the shop for resumes
    }
}

function startRoguelikeHand() {
    const state = player.roguelikeBlackjackState;
    if (state.deck.length < 10) {
        state.deck = createDeck();
        shuffleDeck(state.deck);
    }

    state.playerHand = [state.deck.pop(), state.deck.pop()];
    state.dealerHand = [state.deck.pop(), state.deck.pop()];
    state.gamePhase = 'playing';
    state.statusMessage = 'Your turn. Hit or Stand?';
    state.lastScore = 0;

    const playerValue = calculateHandValue(state.playerHand);
    if (playerValue === 21) {
        // Automatic stand on Blackjack
        roguelikePlayerStand();
    } else {
        renderRoguelikeGame();
    }
}

function dealRoguelikePool() {
    const state = player.roguelikeBlackjackState;
    // NEW: Check for 'The Sixth Card'
    const cardsToDeal = 6 + (state.patronSkills.includes('The Sixth Card') ? 1 : 0);
    
    if (state.deck.length < cardsToDeal) {
        state.deck = createDeck();
        shuffleDeck(state.deck);
    }
    for (let i = 0; i < cardsToDeal; i++) {
        state.sharedPool.push(state.deck.pop());
    }
}

function roguelikePlayerDraft(poolCardIndex, consumableKey = null) {
    const state = player.roguelikeBlackjackState;
    if (state.gamePhase !== 'player_draft') return;

    state.gamePhase = 'dealer_draft'; // Lock player actions
    if (consumableKey) {
        // --- Use Consumable ---
        const item = BJ_CONSUMABLES[consumableKey];
        const result = item.use(state);
        addToLog(result.message, result.success ? 'text-green-300' : 'text-red-400');
        // Remove from inventory
        state.consumables.splice(state.consumables.indexOf(consumableKey), 1);

        // --- Handle Escape Rope ---
        if (state.escapeRopeUsed) {
            const prevAnteIndex = state.currentAnteIndex - 1;
            let goldReward = 0;
            if (prevAnteIndex >= 0) {
                goldReward = ANTE_STRUCTURE[prevAnteIndex].cashOutReward;
            }
            player.gold += goldReward;
            addToLog(`You use the Escape Rope! You cash out ${goldReward}G and your run ends.`, 'text-yellow-300');
            
            state.runActive = false;
            state.gamePhase = 'buy_in';
            // FULL RESET ON LOSS/QUIT
            state.currentAnteIndex = 0;
            state.currentVingtUnIndex = 0;
            state.currentCrookards = 0;
            state.passiveModifiers = [];
            state.consumables = [];
            state.patronSkills = [];
            state.runUpgrades = {
                passiveSlots: 5,
                consumableSlots: 2,
                handSize: 5,
                baseShopRerollCost: 2,
                bonusHandsPerVingtUn: 0,
                bonusRerollsPerVingtUn: 0,
                baseMultiplier: 0,
                rerollsToHands: false
            };
            
            // Clear the escape rope flag
            state.escapeRopeUsed = false;

            renderArcaneCasino(); // Force render
            updateStatsView();
            return; // Stop the turn
        }
        
        // --- NEW: Handle Risky Deal ---
        if (state.riskyDealActive) {
            state.riskyDealActive = false; // Consume flag
            renderRoguelikeGame(); // Show new pool
            setTimeout(() => roguelikeDealerDraft(false), 1500); // Dealer goes first
            return; // Stop turn
        }
        // --- END NEW ---

    } else {
        // --- Standard Draft ---
        if (poolCardIndex === null || !state.sharedPool[poolCardIndex]) {
            console.error("Invalid card index drafted.");
            state.gamePhase = 'player_draft'; // Unlock
            return;
        }
        const [draftedCard] = state.sharedPool.splice(poolCardIndex, 1);
        state.playerHand.push(draftedCard);
        state.statusMessage = 'You drafted a card. Dealer is thinking...';
    }

    const playerValue = calculateHandValue(state.playerHand);
    const hasPriestess = state.playerHand.some(c => c.ability === 'priestess');
    
    // --- NEW: Handle Spectral Hand ---
    const maxHandSize = state.runUpgrades.handSize + (state.patronSkills.includes('Jester\'s Gambit') ? 1 : 0);
    const isHandFull = state.playerHand.length >= maxHandSize;
    
    if (state.spectralHandActive && isHandFull) {
        // Hand is full, but spectral hand is active, so we *don't* auto-stand
        state.spectralHandActive = false; // Consumed on first use
        addToLog("Spectral Hand lets you ignore the hand size limit!", "text-purple-300");
    } 
    // --- END NEW ---
    else if (playerValue > 21) {
        // --- NEW: High Priestess Bust Prevention ---
        if (hasPriestess) {
            state.statusMessage = "The High Priestess intercedes! You automatically Stand.";
            addToLog(state.statusMessage, 'text-yellow-300');
            renderRoguelikeGame();
            setTimeout(() => roguelikePlayerStand(), 1000);
            return; // Stop processing, hand goes to Stand
        }
        // --- END NEW ---

        // --- Check for 'Minor Miscalculation' Patron Skill ---
        if (state.vingtUnBustSafety) { // Check if safety net is active
            state.vingtUnBustSafety = false; // Consume the safety net
            state.statusMessage = "Minor Miscalculation! Your bust is forgiven, but your turn ends.";
            addToLog(state.statusMessage, 'text-yellow-300');
            state.gamePhase = 'dealer_final_draft'; // Force dealer's final turn
            renderRoguelikeGame();
            setTimeout(() => roguelikeDealerDraft(true), 1500); // Call dealer's final turn
            return; // Stop processing
        }

        // Check for 'Second Guess' consumable
        const secondGuessIndex = state.consumables.indexOf('second_guess');
        if (secondGuessIndex > -1) {
            state.playerHand.pop(); // Undo the bust
            state.consumables.splice(secondGuessIndex, 1); // Consume the token
            state.statusMessage = "Second Guess token saved you! Your turn.";
            addToLog(state.statusMessage, 'text-yellow-300');
            state.gamePhase = 'player_draft'; // Give turn back
            renderRoguelikeGame(); // Re-render the hand, game continues
            return; // Stop processing
        } else {
            state.statusMessage = `Bust! You lose this hand.`;
            state.gamePhase = 'bust';
            state.lastScore = 0;
            renderRoguelikeGame();
            setTimeout(() => roguelikeDetermineWinner('lose'), 1500);
            return; // Hand is over
        }
    } else if (playerValue === 21) {
        state.statusMessage = '21! You automatically Stand.';
        renderRoguelikeGame();
        setTimeout(() => roguelikePlayerStand(), 1000); // Auto-stand
        return; // Hand continues to dealer's final turn
    } else if (isHandFull) { // Check normal hand size limit
        state.statusMessage = 'Max Hand Size! You automatically Stand.'; 
        renderRoguelikeGame();
        setTimeout(() => roguelikePlayerStand(), 1000); //
        return;
    }

    // --- Check if pool is empty ---
    if (state.sharedPool.length === 0) {
        addToLog("The pool is empty! Dealing 6 more cards...", "text-gray-400");
        dealRoguelikePool();
    }
    
    // --- Proceed to Dealer's Turn ---
    renderRoguelikeGame(); // Show player's new hand
    setTimeout(() => roguelikeDealerDraft(false), 1500); // Call dealer AI
}

async function roguelikePlayerStand() {
    const state = player.roguelikeBlackjackState;
    // --- MODIFICATION ---
    // Allow standing if it's the player's turn (manual) OR if an auto-stand was
    // triggered after a draft (which sets the phase to 'dealer_draft').
    if (state.gamePhase !== 'player_draft' && state.gamePhase !== 'dealer_draft') return;
    // --- END MODIFICATION ---
    
    state.gamePhase = 'dealer_final_draft'; // Set to dealer's last turn
    state.statusMessage = 'You stand. Dealer takes one final action...';
    renderRoguelikeGame(); // Update UI

    await roguelikeDealerDraft(true); // Call dealer AI with isFinalTurn = true
}

async function roguelikeDealerDraft(isFinalTurn = false) {
    const state = player.roguelikeBlackjackState;
    
    // --- AI Decision Logic ---
    let bestCardIndex = -1;
    let bestCardFinalScore = -Infinity; // The new score, including poker bonus
    let action = 'stand'; // Default action is to stand
    
    const currentRawScore = calculateHandValue(state.dealerHand);
    const currentFinalScore = calculateFinalShowdownScore(state.dealerHand); // Get current score + poker bonus
    
    // --- THIS IS THE FIX (Part 1) ---
    // Define playerVisibleCard, which might be undefined if hand is empty
    const playerVisibleCard = state.playerHand[0]; // AI can only see first card
    // --- END FIX ---


    // 1. Evaluate all cards in the pool
    for (let i = 0; i < state.sharedPool.length; i++) {
        const card = state.sharedPool[i];
        const newHand = [...state.dealerHand, card];
        const newRawValue = calculateHandValue(newHand);
        const newPokerBonus = getPokerHandBonus(newHand);
        
        let cardScore = 0; // This is the "desirability" score

        if (newRawValue > 21) {
            cardScore = -100; // Busting is very bad
        } else if (newRawValue === 21) {
            cardScore = 50; // Blackjack/21 is best
        } else if (newRawValue >= 17) {
            cardScore = 20 + newRawValue; // Good: 17 is 37, 20 is 40
        } else {
            cardScore = newRawValue; // OK: 16 is 16
        }
        
        // This makes it a tie-breaker.
        cardScore += newPokerBonus;
        
        // Hate-Drafting Logic: Is this card *amazing* for the player?
        // (Simple check: does it give them 21 based on their *one* visible card?)
        
        // --- THIS IS THE FIX (Part 2) ---
        // Add a check to make sure playerVisibleCard exists before reading its .weight
        if (playerVisibleCard) { 
            if (playerVisibleCard.weight + card.weight === 21) {
                cardScore += 25; // Prioritize taking a card that gives player 21
            }
        }
        // --- END FIX ---
        
        if (cardScore > bestCardFinalScore) {
            bestCardFinalScore = cardScore;
            bestCardIndex = i;
        }
    }

    // 2. Decide action based on the AI's "brain"
    if (isFinalTurn) {
        // --- FINAL TURN LOGIC ---
        // It's the dealer's last move.
        // It MUST stand on 17+ (raw).
        // It will ONLY hit if it's under 17 AND has a safe card.
        if (currentRawScore < 17 && bestCardFinalScore > -100) { // Only hit if under 17 AND have a non-busting card
            action = 'draft';
        } else {
            action = 'stand';
        }
    } else { 
        // --- PLAYER'S TURN LOGIC ---
        // Dealer can be more aggressive.
        // It MUST hit on 16 or less (raw).
        if (currentRawScore < 17) {
            action = 'draft';
        } 
        // It's on 17+. It *can* stand, but...
        // it *will* hit if the best new hand is significantly better
        // (e.g., goes from 17 to 21, or 17 to 17 + a big poker bonus)
        else if (bestCardFinalScore > (currentFinalScore + 5)) { // +5 makes it reluctant to hit a good hand
            action = 'draft';
        } else {
            action = 'stand'; // Stand if 17+ and no great improvement
        }
    }

    // 3. Execute Action
    if (action === 'draft' && bestCardIndex > -1) {
        // Take the card
        const [draftedCard] = state.sharedPool.splice(bestCardIndex, 1);
        state.dealerHand.push(draftedCard);
        state.statusMessage = 'Dealer drafts a card.';
        
        // Check dealer hand state
        const dealerValue = calculateHandValue(state.dealerHand); // Check RAW value for bust
        if (dealerValue > 21) {
            state.statusMessage = 'Dealer busts!';
            renderRoguelikeGame();
            setTimeout(() => roguelikeDetermineWinner('win'), 1500);
            return;
        } else if (dealerValue === 21 || state.dealerHand.length >= state.runUpgrades.handSize) {
            // Dealer auto-stands on 21 or 5-Card
            state.statusMessage = 'Dealer has 21! Showdown.';
            renderRoguelikeGame();
            setTimeout(() => roguelikeDetermineWinner('showdown'), 1500);
            return;
        }
        
    } else {
        // Dealer stands
        state.statusMessage = 'Dealer stands.';
    }

    renderRoguelikeGame(); // Show the dealer's new card (or just the status)
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 4. Conclude Turn
    if (isFinalTurn) {
        // This was the last action. Go to showdown.
        setTimeout(() => roguelikeDetermineWinner('showdown'), 500);
    } else {
        // Check if pool is empty
        if (state.sharedPool.length === 0) {
            addToLog("The pool is empty! Dealing 6 more cards...", "text-gray-400");
            dealRoguelikePool();
        }
        // Return turn to player
        state.gamePhase = 'player_draft';
        state.statusMessage = 'Your turn. Draft a card or Stand.';
        renderRoguelikeGame();
    }
}

function roguelikeDetermineWinner(result) {
    const state = player.roguelikeBlackjackState;
    state.gamePhase = 'hand_results'; // Set the phase
    
    let score = 0;
    let win = false;
    let push = false;

    // --- NEW: Store evals in state ---
    state.playerFinalEval = evaluateRoguelikeHand(state.playerHand);
    state.dealerFinalEval = evaluateRoguelikeHand(state.dealerHand);
    // --- END NEW ---

    if (result === 'win') { // Player wins (e.g., dealer bust)
        win = true;
        // --- NEW: Store raw score for display ---
        state.playerFinalEval.rawValue = calculateHandValue(state.playerHand);
        state.dealerFinalEval.rawValue = calculateHandValue(state.dealerHand);
        // --- END NEW ---
    
    } else if (result === 'showdown') { 
        const playerScore = calculateFinalShowdownScore(state.playerHand, state.playerFinalEval); // Pass eval
        const dealerScore = calculateFinalShowdownScore(state.dealerHand, state.dealerFinalEval); // Pass eval
        
        // --- NEW: Store raw score for display ---
        state.playerFinalEval.rawValue = calculateHandValue(state.playerHand);
        state.dealerFinalEval.rawValue = calculateHandValue(state.dealerHand);
        // --- END NEW ---

        // --- Joker Win Condition ---
        const playerHasJoker = state.playerHand.some(c => c.value === 'Joker');
        const dealerHasJoker = state.dealerHand.some(c => c.value === 'Joker');
        const playerValue = calculateHandValue(state.playerHand); // Get player's raw score
        const dealerValue = calculateHandValue(state.dealerHand);

        if (playerHasJoker && !dealerHasJoker && playerValue <= 21) { // Player wins with Joker if not bust
            win = true;
            addToLog("Your Joker secures the win!", "text-yellow-300");
        } else if (!playerHasJoker && dealerHasJoker && dealerValue <= 21) { // Dealer wins with Joker if not bust
            win = false;
            addToLog("The Dealer's Joker beats your hand!", "text-red-400");
        } else {
            // Original logic if no Jokers or both have Jokers
            if (playerScore > dealerScore) { win = true; }
            else if (playerScore === dealerScore) { push = true; }
            else { win = false; }
        }
        
        // Log result
        if (win) {
            state.statusMessage = `You win! (${playerScore} vs ${dealerScore})`;
        } else if (push) {
            state.statusMessage = `Push! (${playerScore} vs ${dealerScore})`;
        } else {
            state.statusMessage = `You lost. (${playerScore} vs ${dealerScore})`;
        }
        
    } else { // 'lose' (Player bust)
        win = false;
        state.statusMessage = `You lost the hand. (Bust)`; 
        // --- NEW: Store raw score for display ---
        state.playerFinalEval.rawValue = calculateHandValue(state.playerHand); // Store bust value
        state.dealerFinalEval.rawValue = calculateHandValue(state.dealerHand);
        // --- END NEW ---
    }
    
    // --- NEW: Score Calculation & Finalization ---
    const scoreComponents = getRoguelikeScoreComponents();

    if (win) {
        score = scoreComponents.finalScore;
        // Handle Double or Nothing
        if (state.doubleOrNothingActive) {
            score *= 2;
            addToLog("Double or Nothing! Your score is doubled!", "text-green-300 font-bold");
        }
        state.lastScore = score;
        state.currentChips += score; 
        state.statusMessage += ` Scored ${score} Chips!`;
        addToLog(state.statusMessage, 'text-green-300');
    } else if (push) {
        score = Math.floor(scoreComponents.finalScore / 2);
        // Handle Double or Nothing (Push counts as a loss)
        if (state.doubleOrNothingActive) {
            score = 0;
            addToLog("Double or Nothing! A push counts as a loss. Score is 0.", "text-red-400");
        }
        state.lastScore = score;
        state.currentChips += score; 
        state.statusMessage += ` Scored ${score} Chips (Half Points)!`;
        addToLog(state.statusMessage, 'text-yellow-300');
    } else { // Loss
        score = 0;
        // Handle Pity Points
        if (state.passiveModifiers.includes('pity_points')) {
            score = Math.floor(scoreComponents.finalScore / 2);
        }
        // Handle Double or Nothing (Loss is 0)
        if (state.doubleOrNothingActive) {
            score = 0;
            addToLog("Double or Nothing! You lost. Score is 0.", "text-red-400");
        }
        
        state.lastScore = score;
        if (score > 0) {
            state.currentChips += score;
            state.statusMessage += ` But you get ${score} pity Chips!`;
            addToLog(state.statusMessage, 'text-yellow-300');
        } else {
            addToLog(state.statusMessage, 'text-red-400');
        }
    }
    
    if (win) {
        const gambledCards = state.playerHand.filter(c => c.ability === 'wheel');
        gambledCards.forEach(card => {
            if (Math.random() < 0.10) { // 10% chance
                addToLog(`The Wheel turns... your ${card.abilityName} ${card.value}${card.suit} has been destroyed!`, 'text-red-500');
                // Remove from masterDeckList
                const masterIndex = state.masterDeckList.findIndex(c => c.uniqueId === card.uniqueId);
                if (masterIndex > -1) {
                    state.masterDeckList.splice(masterIndex, 1);
                }
                // Remove from enhancements
                delete state.cardEnhancements[card.uniqueId];
            }
        });
    }
    // Clear one-time flags
    state.liquidLuckActive = false;
    state.spectralHandActive = false;
    state.doubleOrNothingActive = false;
    
    // Decrement hand
    state.currentHandsLeft--;
    
    // Render results
    renderRoguelikeResultsUI();
}

function evaluateRoguelikeHand(hand) {
    // --- THIS IS THE FIX ---
    const VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    // --- END FIX ---
    
    // --- NEW: Get run state ---
    const state = player.roguelikeBlackjackState;
    // --- END NEW ---
    const isMonochrome = hand.length >= 2 && hand.every(c => c.suit === hand[0].suit && !c.suit.startsWith('JOKER'));
    // --- Get Ranks (Values) and sort them by their actual poker order ---
    const ranks = hand.map(c => VALUES.indexOf(c.value)).sort((a, b) => a - b);
    const weights = hand.map(c => c.weight).sort((a, b) => a - b);
    
    // --- MODIFICATION: Check for Polychrome ---
    let suits = hand.map(c => c.suit);
    if (state.deckAbilities.polychrome) {
        // If Polychrome is active, pretend all cards are Hearts
        suits = hand.map(c => '♥');
    } else {
        // Check for individual Polychrome (World) cards
        suits = hand.map((card, i) => {
            if (card.ability === 'world') return '♥'; // Use ♥ as the "stand-in" suit
            return suits[i];
        });
    }
    // --- END MODIFICATION ---
    
    let isStraight = false;
    // --- MODIFICATION: Check for Polychrome ---
    let isFlush = hand.length > 0 && suits.every(s => s === suits[0]);
    // --- END MODIFICATION ---
    let isStraightFlush = false;
    let isRoyalFlush = false; // <-- NEW

    // --- Straights and Flushes MUST be 5-card hands ---
    if (hand.length === 5) {
        isFlush = suits.every(s => s === suits[0]);
        
        // Check for Ace-low straight (A, 2, 3, 4, 5)
        // Ranks would be [0, 1, 2, 3, 12] (2, 3, 4, 5, A)
        const isAceLowStraight = ranks.join(',') === '0,1,2,3,12';
        
        // Check for standard straight
        let isStandardStraight = true;
        for (let i = 1; i < ranks.length; i++) {
            if (ranks[i] !== ranks[i-1] + 1) {
                isStandardStraight = false;
                break;
            }
        }
        
        isStraight = isAceLowStraight || isStandardStraight;
        isStraightFlush = isStraight && isFlush;

        // --- NEW: Check for Royal Flush ---
        // Ranks for 10,J,Q,K,A are [8, 9, 10, 11, 12]
        if (isStraightFlush && ranks.join(',') === '8,9,10,11,12') {
            isRoyalFlush = true;
        }
        // --- END NEW ---
    }

    // --- Original logic for pairs, kinds, and Ace teams (works on any hand size) ---
   const counts = {};
    let aceCount = 0;
    let initialValue = 0;
    
    // --- NEW: Hierophant & Justice/Devil check ---
    let faceCardCount = 0;
    let nonFaceCardCount = 0;
    let jokerCount = 0;
    // --- END NEW ---

    hand.forEach(card => {
        counts[card.value] = (counts[card.value] || 0) + 1; // Use card.value
        initialValue += card.weight;
        if (card.value === 'A') aceCount++;
        
        // --- NEW: Check card properties ---
        let isFace = ['J', 'Q', 'K'].includes(card.value);
        let isNonFace = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A'].includes(card.value);
        
        // Check Hierophant
        if (state.deckAbilities.suitRoyals && card.suit === state.deckAbilities.suitRoyals) {
            isFace = true;
        }
        // Check Justice (Balanced)
        if (card.ability === 'justice') {
            isFace = true;
            isNonFace = true;
        }
        // Check Devil (Masked)
        if (card.ability === 'devil') {
            jokerCount++;
        }

        if (isFace) faceCardCount++;
        if (isNonFace) nonFaceCardCount++;
        // --- END NEW ---
    });

    let pairs = 0;
    let isThreeOfAKind = false;
    let isFourOfAKind = false;
    for (const value in counts) { // Use card.value
        if (counts[value] === 4) isFourOfAKind = true;
        if (counts[value] === 3) isThreeOfAKind = true;
        if (counts[value] === 2) pairs++;
    }

    const isFullHouse = isThreeOfAKind && pairs === 1; // This also implies 5 cards

    // "Team of Ace" logic (Ace as 1 and Ace as 11)
    let acesDevalued = 0;
    let tempValue = initialValue;
    let acesAt11Start = aceCount;
    while (tempValue > 21 && acesAt11Start > 0) {
        tempValue -= 10;
        acesAt11Start--;
        acesDevalued++;
    }
    const acesAt11Final = acesAt11Start;
    const isTeamOfAce = acesAt11Final > 0 && acesDevalued > 0;

    // --- NEW: Determine handName ---
    let handName = 'High Card';
    if (isRoyalFlush) handName = 'Royal Flush';
    else if (isStraightFlush) handName = 'Straight Flush';
    else if (isFourOfAKind) handName = 'Four of a Kind';
    else if (isFullHouse) handName = 'Full House';
    else if (isFlush) handName = 'Flush';
    else if (isStraight) handName = 'Straight';
    else if (isThreeOfAKind) handName = 'Three of a Kind';
    else if (pairs === 2) handName = 'Two Pair';
    else if (pairs === 1) handName = 'One Pair';
    // --- END NEW ---

    // --- New return object with all checks AND handName ---
    return {
        pairs: pairs,
        isTwoPair: pairs === 2,
        isThreeOfAKind: isThreeOfAKind,
        isFourOfAKind: isFourOfAKind,
        isTeamOfAce: isTeamOfAce,
        isStraightFlush: isStraightFlush,
        isRoyalFlush: isRoyalFlush,
        handName: handName,
        faceCardCount: faceCardCount,
        nonFaceCardCount: nonFaceCardCount,
        jokerCount: jokerCount,
        isMonochrome: isMonochrome // <-- ADD THIS
    };
}

function getPokerHandBonus(hand, pokerRank = null) {
    if (!pokerRank) {
        pokerRank = evaluateRoguelikeHand(hand); // Calculate if not provided
    }
    let bonus = 0;
    
    // Assign bonus points based on the rank
    if (pokerRank.isStraightFlush) bonus = 30;
    else if (pokerRank.isFourOfAKind) bonus = 20;
    else if (pokerRank.isFullHouse) bonus = 12;
    else if (pokerRank.isStraight) bonus = 8;
    else if (pokerRank.isThreeOfAKind) bonus = 6;
    else if (pokerRank.isTwoPair) bonus = 4;
    else if (pokerRank.pairs === 1) bonus = 2;
    // --- MODIFICATION: Flush Bonus now uses Monochrome scaling ---
    else if (pokerRank.isMonochrome) { // Checks if all cards are the same suit
        // Apply scaling bonus based on hand size
        switch (hand.length) {
            case 2: bonus = 1; break; // 2 cards = +1
            case 3: bonus = 3; break; // 3 cards = +3
            case 4: bonus = 5; break; // 4 cards = +5
            case 5: bonus = 10; break; // 5 cards = +10
            case 6: bonus = 10; break; // 6 cards = +10
            default: bonus = 0;
        }
    }
    // --- END MODIFICATION ---

    // NEW: Apply 'High Roller's Intuition'
    if (bonus > 0 && player.roguelikeBlackjackState.patronSkills.includes('High Roller\'s Intuition')) {
        bonus *= 2;
    }
    
    return bonus;
}

function calculateFinalShowdownScore(hand) {
    // 1. Get the raw Blackjack score
    const rawValue = calculateHandValue(hand);
    
    // 2. Check for a bust
    if (rawValue > 21) {
        return 0; // A bust is always 0
    }
    
    // 3. Get the poker bonus
    const bonus = getPokerHandBonus(hand);
    
    // 4. Return the combined score
    return rawValue + bonus;
}

// --- MODIFIED: This function now includes the new passive logic ---
function getRoguelikeScoreComponents() {
    const state = player.roguelikeBlackjackState;
    const hand = state.playerHand;
    const score = calculateHandValue(hand);

    // 1. Calculate Base Value
    let baseChips = 0;
    const maxHandSize = state.runUpgrades.handSize + (state.patronSkills.includes('Jester\'s Gambit') ? 1 : 0);
    const isBlackjack = hand.length === 2 && score === 21;
    const is5Card = (hand.length >= maxHandSize && score <= 21) || (state.spectralHandActive && score <= 21); // Check spectral hand

    if (isBlackjack) {
        baseChips = 25;
    } else if (is5Card) {
        baseChips = 30;
    } else {
        if (state.gamePhase === 'bust') {
            baseChips = 0;
        } else {
            baseChips = score;
        }
    }

    const pokerRank = evaluateRoguelikeHand(hand);
    let pokerBonus = getPokerHandBonus(hand, pokerRank); // Pass the hand AND the pre-calculated rank
    if (state.deckAbilities.doublePoker) {
        pokerBonus *= 2;
    }
    baseChips += pokerBonus;
    // --- END MODIFICATION ---

    // 2. Calculate Multiplier
    let totalMultiplier = 1 + (state.runUpgrades.baseMultiplier || 0);

    // Apply 'Ace in the Hole' (Patron Skill)
    if (state.patronSkills.includes('Ace in the Hole') && hand.some(c => c.value === 'A')) {
        baseChips += 50;
    }
    
    // Apply 'Golden Hand' (Patron Skill)
    const ante = ANTE_STRUCTURE[state.currentAnteIndex];
    const vingtUn = ante.vingtUns[state.currentVingtUnIndex];
    let initialHands = vingtUn.hands + state.runUpgrades.bonusHandsPerVingtUn + (state.runUpgrades.rerollsToHands ? (vingtUn.rerolls + state.runUpgrades.bonusRerollsPerVingtUn) : 0);
    if (state.patronSkills.includes('Perfect Start')) initialHands++;
    if (state.currentHandsLeft === initialHands && state.patronSkills.includes('Golden Hand')) {
        baseChips += 100;
    }

    hand.forEach(card => {
        if (card.ability) {
            switch (card.ability) {
                case 'strength':
                    baseChips += 50;
                    break;
                case 'emperor': // <-- NEW
                    baseChips += 10; // Doubles 10-value, so +10
                    break;
                case 'tower_rock': // <-- NEW
                    baseChips += 20;
                    break;
                case 'star':
                    totalMultiplier += 4;
                    break;
                case 'sun':
                    totalMultiplier *= 2;
                    break;
                case 'wheel':
                    totalMultiplier += 10;
                    // (Burn logic will be in roguelikeDetermineWinner)
                    break;
                case 'chariot':
                    baseChips += (state.currentHandsLeft * 3);
                    break;
                case 'hermit':
                    const suitCount = hand.filter(c => c.suit === card.suit).length;
                    if (suitCount === 1) {
                        totalMultiplier += 15;
                    }
                    break;
                case 'judgement':
                    if (pokerBonus > 0) { // Check if we *have* a poker hand
                        totalMultiplier += 8;
                    }
                    break;
                case 'hanged_man':
                    totalMultiplier += state.sharedPool.length;
                    break;
                // 'moon' (Spectral) re-triggers others, handled below
                // 'devil' (Masked) is handled by evaluateRoguelikeHand
                // 'justice' (Balanced) is handled by evaluateRoguelikeHand
                // 'world' (Polychrome) is handled by evaluateRoguelikeHand
                // 'tower' (Shattered) logic is in buyRoguelikeTool
            }
        }
    });
    if (state.cardPairs.length > 0) {
        const handIds = new Set(hand.map(c => c.uniqueId));
        state.cardPairs.forEach(pair => {
            if (handIds.has(pair[0]) && handIds.has(pair[1])) {
                baseChips += 100;
                totalMultiplier += 10;
                addToLog("The Lovers are united! +100 Chips, +10 Mult!", "text-purple-300");
            }
        });
    }

    // --- NEW: Apply Hierophant (Double Chips) ---
    hand.forEach(card => {
        if (card.ability === 'hierophant') {
            baseChips += card.weight; // Add the card's value again
        }
    });
    // --- NEW: Handle Spectral (Moon) Re-trigger ---
    const spectralCard = hand.find(c => c.ability === 'moon');
    if (spectralCard) {
        hand.forEach(card => {
            if (card.uniqueId === spectralCard.uniqueId) return; // Don't re-trigger self

            if (card.ability) {
                // Re-apply all 'on-play' abilities
                switch (card.ability) {
                    case 'strength': baseChips += 50; break;
                    case 'star': totalMultiplier += 4; break;
                    case 'sun': totalMultiplier *= 2; break;
                    case 'wheel': totalMultiplier += 10; break;
                    case 'chariot': baseChips += (state.currentHandsLeft * 3); break;
                    case 'hermit':
                        const suitCount = hand.filter(c => c.suit === card.suit).length;
                        if (suitCount === 1) totalMultiplier += 15;
                        break;
                    case 'judgement':
                        if (pokerBonus > 0) totalMultiplier += 8;
                        break;
                    case 'hanged_man':
                        totalMultiplier += state.sharedPool.length;
                        break;
                }
            }
        });
    }

    // Apply standard passives
    state.passiveModifiers.forEach((modKey, index) => {
        const mod = BJ_PASSIVE_MODIFIERS[modKey];
        
        // --- NEW: Liquid Luck Check ---
        const canCheck = state.liquidLuckActive ? true : mod.check(hand, score, is5Card, isBlackjack, pokerRank, state, index);
        
        if (mod && mod.check && canCheck) {
            if (mod.logic) {
                const result = mod.logic(totalMultiplier, baseChips, hand, score, is5Card, isBlackjack, pokerRank, state, index);
                if (typeof result === 'number') {
                    totalMultiplier = result;
                } else if (typeof result === 'object') {
                    baseChips = result.base;
                    totalMultiplier = result.mult;
                }
            }
        }
    });

    // 3. Final Multipliers/Dividers
    if (state.patronSkills.includes('Arcane Overcharge')) {
        totalMultiplier *= 2;
        baseChips = Math.floor(baseChips / 2);
    }

    // 4. Rounding
    return { base: Math.floor(baseChips), mult: Math.floor(totalMultiplier), finalScore: Math.floor(baseChips * totalMultiplier) };
}

function calculateRoguelikeScore() {
    // This function is only called on a win or push,
    // so we don't need to worry about bust logic here.
    const { finalScore } = getRoguelikeScoreComponents();
    return finalScore;
}
function roguelikeLoseRun(reason = 'out of hands') {
    let msg = '';
    if (reason === 'out of hands') {
        msg = `You ran out of hands and couldn't meet the Chip Target. Your run is over.`;
    } else if (reason === 'quit') {
        // This is now only for a "hard quit" or failure
        msg = `Your run has ended and all progress has been reset.`;
    }
    
    addToLog(msg, 'text-red-500');
    player.roguelikeBlackjackState.runActive = false;
    player.roguelikeBlackjackState.gamePhase = 'buy_in';

    // --- NEW: FULL RESET ON LOSS ---
    // This ensures that when they call startRoguelikeRun, it's a fresh start.
    player.roguelikeBlackjackState.currentAnteIndex = 0;
    player.roguelikeBlackjackState.currentVingtUnIndex = 0;
    player.roguelikeBlackjackState.currentCrookards = 0;
    player.roguelikeBlackjackState.passiveModifiers = [];
    player.roguelikeBlackjackState.consumables = [];
    player.roguelikeBlackjackState.patronSkills = [];
    player.roguelikeBlackjackState.runUpgrades = {
        passiveSlots: 5,
        consumableSlots: 2,
        handSize: 5,
        shopRerollCost: 1, // Keep your change
        bonusHandsPerVingtUn: 0,
        bonusRerollsPerVingtUn: 0,
        baseMultiplier: 0
    };
    // --- END NEW ---

    renderArcaneCasino(); // Go back to main casino screen
}

function startVingtUn() {
    const state = player.roguelikeBlackjackState;

    // --- ADD THIS BLOCK AT THE TOP ---
    state.shopStock = []; // Clear the shop stock
    state.shopLockedSlots = []; // Clear all locks
    // --- END ADDITION ---

    if (state.currentAnteIndex >= ANTE_STRUCTURE.length) {
        roguelikeWinRun();
        return;
    }

    const ante = ANTE_STRUCTURE[state.currentAnteIndex];
    const vingtUn = ante.vingtUns[state.currentVingtUnIndex];
    
    if (!vingtUn) {
        console.error(`Invalid Vingt-un index: ${state.currentVingtUnIndex} for Ante: ${state.currentAnteIndex}`);
        roguelikeLoseRun('Error: Invalid game state');
        return;
    }

    // Create a new deck for this Vingt-un
    state.deck = createDeck(state.deckKey);
    shuffleDeck(state.deck);

    // --- NEW: Create master list and empty discard pile ---
    state.deck = [...state.masterDeckList]; // Copy all cards
    shuffleDeck(state.deck);

    // Clear the discard pile for this Vingt-un
    state.discardPile = []; 
    // --- END MODIFICATION ---

    addToLog("A fresh deck is shuffled for this Vingt-un.", "text-gray-400");
    
    // --- NEW: Reset shop reroll cost for the new Ante ---
    // This happens when Vingt-un 0 starts
    state.shopRerollCost = state.runUpgrades.baseShopRerollCost || 2;
    // --- END NEW ---

    // --- MODIFIED: Handle all hand/reroll modifiers ---
    let baseHands = vingtUn.hands + state.runUpgrades.bonusHandsPerVingtUn;
    let baseRerolls = vingtUn.rerolls + state.runUpgrades.bonusRerollsPerVingtUn;

    // Apply Ante Starter Pack (Passive)
    if (state.currentVingtUnIndex === 0 && state.passiveModifiers.includes('ante_starter_pack')) {
        baseHands++;
        baseRerolls++;
        addToLog("'Starter Pack' grants +1 Hand and +1 Reroll for this Ante!", "text-green-300");
    }

    // Apply Iron Will (Passive)
    if (state.passiveModifiers.includes('iron_will')) {
        baseHands += 2;
    }
    
    // Apply Rerolls to Hands (Upgrade)
    if (state.runUpgrades.rerollsToHands) {
        baseHands += baseRerolls;
        baseRerolls = 0;
        addToLog("'Desperate Measures' converts all your rerolls into extra hands!", "text-yellow-300");
    }
    
    // Apply Glass Cannon (Passive)
    if (state.passiveModifiers.includes('glass_cannon')) {
        baseHands = Math.floor(baseHands / 2);
        addToLog("'Glass Cannon' halves your hands!", "text-red-400");
    }
    // --- END MODIFIED ---

    // Set Vingt-un state
    state.gamePhase = 'playing';
    state.currentHandsLeft = baseHands;
    state.currentRerollsLeft = baseRerolls;
    state.currentChips = 0;
    state.lastScore = 0;
    state.vingtUnBustSafety = state.patronSkills.includes('Minor Miscalculation');

    addToLog(`--- Ante ${state.currentAnteIndex + 1}: ${ante.anteName} ---`, 'text-yellow-300 font-bold');
    addToLog(`Starting: ${vingtUn.name}. Target: ${vingtUn.chipsToWin} Chips in ${state.currentHandsLeft} Hands.`, 'text-yellow-300');

    // Apply 'Perfect Start' Patron Skill
    if (state.patronSkills.includes('Perfect Start')) {
        state.currentHandsLeft++;
        addToLog("Your 'Perfect Start' grants you 1 extra hand for this Vingt-un!", 'text-green-300');
    }
    // Apply 'Mulligan' Patron Skill
    if (state.patronSkills.includes('Mulligan')) {
        state.currentRerollsLeft++;
        addToLog("Your 'Mulligan' grants you 1 extra reroll for this Vingt-un!", 'text-green-300');
    }
    
    startNextHand();
}
/**
 * Called when a Vingt-un's chip goal is met.
 * Routes to the shop (for Petit/Grand) or to the Ante completion logic (for Patron).
 */
function completeVingtUn() {
    const state = player.roguelikeBlackjackState;

    // --- NEW: AUTOSAVE ---
    addToLog("Vingt-un complete! Autosaving run progress...", "text-gray-400");
    saveGame(); // This saves the entire player object, including the casino state
    // --- END NEW ---

    const ante = ANTE_STRUCTURE[state.currentAnteIndex];
    const vingtUn = ante.vingtUns[state.currentVingtUnIndex];

    addToLog(`Vingt-un Complete: ${vingtUn.name}!`, 'text-green-400 font-bold');

    // --- NEW CROOKARD EARNING LOGIC ---
    let baseWin = 0;
    let handsBonus = state.currentHandsLeft * 1; // 1 Crookard per hand left
    let rerollBonus = state.currentRerollsLeft * 1; // 1 Crookard per reroll left
    let milestoneBonus = 0;
    
    const chipTarget = vingtUn.chipsToWin;
    const chipScore = state.currentChips;

    // 1. Base Win Bonus
    if (state.currentVingtUnIndex === 0) { // Petit
        baseWin = 3;
    } else if (state.currentVingtUnIndex === 1) { // Grand
        baseWin = 5;
    } else { // Patron
        baseWin = 10;
    }

    // 2. Score Milestone Bonus
    if (chipScore >= chipTarget * 2) {
        milestoneBonus = 5; // Flawless
        addToLog(`Flawless! You more than doubled the target score! (+${milestoneBonus} Crookards)`, 'text-yellow-300');
    } else if (chipScore >= chipTarget * 1.5) {
        milestoneBonus = 2; // Great
        addToLog(`Great! You exceeded the target by 50%! (+${milestoneBonus} Crookards)`, 'text-yellow-300');
    }

    // 3. Total and Apply
    const totalEarned = baseWin + handsBonus + rerollBonus + milestoneBonus;
    state.currentCrookards += totalEarned;

    addToLog(`Base Win: +${baseWin} Crookards`, 'text-green-300');
    if (handsBonus > 0) addToLog(`Hands Left: +${handsBonus} Crookards`, 'text-green-300');
    if (rerollBonus > 0) addToLog(`Rerolls Left: +${rerollBonus} Crookards`, 'text-green-300');
    addToLog(`You earned a total of ${totalEarned} Crookards!`, 'text-yellow-300 font-bold');
    // --- END NEW CROOKARD LOGIC ---

    if (state.currentVingtUnIndex < 2) {
        // --- Won Petit or Grand ---
        state.currentVingtUnIndex++;
        state.gamePhase = 'shop';
        state.shopStock = generateRoguelikeShopStock();
        renderRoguelikeShop();
    } else {
        // --- Won Patron ---
        completeAnte();
    }
}

function roguelikePauseRun() {
    addToLog("Run progress saved. You can continue from this point later (after paying the buy-in).", "text-gray-400");
    saveGame(); // Save the current state (Crookards, Ante/Vingt-un index, etc.)

    player.roguelikeBlackjackState.runActive = false; // Stop the active run
    player.roguelikeBlackjackState.gamePhase = 'buy_in'; // Send back to buy-in screen
    renderArcaneCasino(); // Go back to casino hub
}

function completeAnte() {
    const state = player.roguelikeBlackjackState;
    const ante = ANTE_STRUCTURE[state.currentAnteIndex];
    const vingtUn = ante.vingtUns[2]; // The Patron

    // Check if this was the final Ante
    if (state.currentAnteIndex >= ANTE_STRUCTURE.length - 1) {
        // Player beat the final boss
        roguelikeWinRun();
        return;
    }
    
    // Apply 'Escalating Stakes' Patron Skill
    if (state.patronSkills.includes('Escalating Stakes')) {
        // This is a new skill, I need to add the logic.
        // I will add 'baseMultiplier' to the runUpgrades object.
        if (!state.runUpgrades.baseMultiplier) state.runUpgrades.baseMultiplier = 0;
        state.runUpgrades.baseMultiplier++;
        addToLog("'Escalating Stakes' grants you a permanent +1 Multiplier!", 'text-green-300');
    }

    // Go to Patron Skill selection
    state.gamePhase = 'patron_skill_choice';
    renderPatronSkillChoice(vingtUn.patronSkillPool); // This is a new render function
}

function awardPatronSkill(skillKey) {
    const state = player.roguelikeBlackjackState;
    if (!skillKey || !PATRON_SKILLS[skillKey] || state.patronSkills.includes(skillKey)) {
        console.error("Invalid or duplicate Patron Skill selected.");
        // Don't halt the game, just proceed to the shop.

        // --- ADD THIS LINE ---
        state.currentVingtUnIndex++; // Increment to signal Vingt-uns are done
        // --- END FIX ---

        state.gamePhase = 'shop';
        state.shopStock = generateRoguelikeShopStock();
        renderRoguelikeShop();
        return;
    }

    state.patronSkills.push(skillKey);
    addToLog(`You have acquired the Patron Skill: ${PATRON_SKILLS[skillKey].name}!`, 'text-green-400 font-bold');
    
    // --- AND ADD THIS LINE ---
    state.currentVingtUnIndex++; // Increment to signal Vingt-uns are done
    // --- END FIX ---
    
    // After selecting the skill, go to the shop
    state.gamePhase = 'shop';
    state.shopStock = generateRoguelikeShopStock();
    renderRoguelikeShop();
}

function skipPatronSkillChoice() {
    const state = player.roguelikeBlackjackState;
    addToLog("You decided to skip the Patron Skill.", "text-gray-400");
    
    // Increment Vingt-un index to signal Vingt-uns are done for this Ante
    state.currentVingtUnIndex++;
    
    // Proceed to the shop
    state.gamePhase = 'shop';
    state.shopStock = generateRoguelikeShopStock();
    renderRoguelikeShop();
}
/**
 * Ends the run, pays the player, and returns to the casino hub.
 */
function roguelikeCashOut() {
    const state = player.roguelikeBlackjackState;
    const anteClearedIndex = state.currentAnteIndex; // This is 0 for Ante 1, 1 for Ante 2, etc.

    // --- THIS IS THE FIX: Update highest clear ---
    // We add 1 because anteClearedIndex is 0-based
    if (anteClearedIndex + 1 > state.highestAnteCleared) {
        state.highestAnteCleared = anteClearedIndex + 1;
    }
    // --- END FIX ---

    // --- MODIFICATION START: Calculate reward ---
    const anteData = ANTE_STRUCTURE[anteClearedIndex];
    const goldReward = state.buyIn * anteData.payoutRatio;
    // --- MODIFICATION END ---
    
    player.gold += goldReward;
    
    addToLog(`*** Run Complete! ***`, 'text-yellow-200 font-bold text-lg');
    addToLog(`You cashed out after Ante ${state.currentAnteIndex + 1} and won ${goldReward}G!`, 'text-green-400 font-bold');

    // --- THIS IS THE FIX: Full Run Reset ---
    // Resets all progress so "isResuming" will be false on next entry.
    state.runActive = false;
    state.gamePhase = 'buy_in';
    state.currentAnteIndex = 0;
    state.currentVingtUnIndex = 0;
    state.currentCrookards = 0;
    state.passiveModifiers = [];
    state.consumables = [];
    state.patronSkills = [];
    state.runUpgrades = {
        passiveSlots: 5,
        consumableSlots: 2,
        handSize: 5,
        shopRerollCost: 1,
        bonusHandsPerVingtUn: 0,
        bonusRerollsPerVingtUn: 0,
        baseMultiplier: 0
    };
    // --- END FIX ---

    updateStatsView();
    renderArcaneCasino();
}
/**
 * Called only when the final (8th) Ante is beaten.
 */
function roguelikeWinRun() {
    const state = player.roguelikeBlackjackState;

    // --- THIS IS THE FIX: Update highest clear ---
    state.highestAnteCleared = ANTE_STRUCTURE.length; // They cleared all 8
    // --- END FIX ---

    const finalAnte = ANTE_STRUCTURE[ANTE_STRUCTURE.length - 1]; // Get the last Ante
    
    // --- MODIFICATION START: Calculate reward ---
    const goldReward = state.buyIn * finalAnte.payoutRatio;
    // --- MODIFICATION END ---
    
    player.gold += goldReward;
    
    addToLog(`*** CONGRATULATIONS! ***`, 'text-yellow-200 font-bold text-lg');
    addToLog(`You defeated all 8 Antes and won the run!`, 'text-green-400 font-bold');
    addToLog(`You are awarded the grand prize of ${goldReward}G!`, 'text-yellow-300');

    // --- THIS IS THE FIX: Full Run Reset ---
    // Same fix as roguelikeCashOut()
    state.runActive = false;
    state.gamePhase = 'buy_in';
    state.currentAnteIndex = 0;
    state.currentVingtUnIndex = 0;
    state.currentCrookards = 0;
    state.passiveModifiers = [];
    state.consumables = [];
    state.patronSkills = [];
    state.runUpgrades = {
        passiveSlots: 5,
        consumableSlots: 2,
        handSize: 5,
        shopRerollCost: 1,
        bonusHandsPerVingtUn: 0,
        bonusRerollsPerVingtUn: 0,
        baseMultiplier: 0
    };
    // --- END FIX ---

    updateStatsView();
    renderArcaneCasino();
}

/**
 * Advances to the next Ante after the cash-out prompt.
 */
function startNextAnte() {
    const state = player.roguelikeBlackjackState;

    // --- THIS IS THE FIX: Update highest clear ---
    // state.currentAnteIndex is the one we *just* beat (e.g., 0)
    // We add 1 because it's 0-based
    if (state.currentAnteIndex + 1 > state.highestAnteCleared) {
        state.highestAnteCleared = state.currentAnteIndex + 1;
    }
    // --- END FIX ---

    state.currentAnteIndex++; // Now we increment to 1 (to start Ante 2)
    state.currentVingtUnIndex = 0;
    
    // Apply 'Escalating Stakes' Patron Skill (for the *new* Ante)
    if (state.patronSkills.includes('Escalating Stakes')) {
        if (!state.runUpgrades.baseMultiplier) state.runUpgrades.baseMultiplier = 0;
        state.runUpgrades.baseMultiplier++;
        addToLog("'Escalating Stakes' grants you a permanent +1 Multiplier!", 'text-green-300');
    }
    
    startVingtUn(); // Start the 'Petit' of the new Ante
}

function buyConjurePack(packKey) {
    const state = player.roguelikeBlackjackState;
    if (state.gamePhase !== 'shop') return;

    const pack = BJ_CONJURE_PACKS[packKey];
    if (!pack) {
        console.error(`Invalid pack key: ${packKey}`);
        return;
    }

    if (state.currentCrookards < pack.cost) {
        addToLog("You cannot afford that ritual.", 'text-red-400');
        return;
    }

    state.currentCrookards -= pack.cost;
    addToLog(`You pay ${pack.cost} Crookards. The shaman begins the ritual...`, 'text-yellow-300');

    // Generate random cards
    const conjuredCards = [];
    for (let i = 0; i < pack.conjure; i++) {
        const randomCard = MASTER_CARD_LIST[Math.floor(Math.random() * MASTER_CARD_LIST.length)];
        conjuredCards.push({ ...randomCard }); // Push a copy
    }

    // Set the state and render the conjure screen
    state.gamePhase = 'conjuring'; // New game phase
    state.conjurePackDisplay = {
        packKey: packKey,
        cards: conjuredCards,
        chosenIndices: []
    };
    
    renderRoguelikeConjure();
}

/**
 * Toggles a card for selection in the conjure UI.
 * @param {number} cardIndex - The index of the card in the state.conjurePackDisplay.cards array.
 */
function selectConjuredCard(cardIndex) {
    const state = player.roguelikeBlackjackState;
    if (state.gamePhase !== 'conjuring') return;

    const pack = BJ_CONJURE_PACKS[state.conjurePackDisplay.packKey];
    if (!pack) return;

    const { chosenIndices } = state.conjurePackDisplay;
    const indexInSelection = chosenIndices.indexOf(cardIndex);

    if (indexInSelection > -1) {
        // Card is already selected, de-select it
        chosenIndices.splice(indexInSelection, 1);
    } else {
        // Card is not selected, add it
        chosenIndices.push(cardIndex);
        // If we've exceeded the choose limit, remove the *oldest* selection
        if (chosenIndices.length > pack.choose) {
            chosenIndices.shift(); // Remove the first item in the array
        }
    }
    
    // Re-render to show the new selection state
    renderRoguelikeConjure();
}

/**
 * Confirms the card selection and adds them to the player's deck.
 */
function confirmConjuredCards() {
    const state = player.roguelikeBlackjackState;
    if (state.gamePhase !== 'conjuring') return;

    const { packKey, cards, chosenIndices } = state.conjurePackDisplay;
    const pack = BJ_CONJURE_PACKS[packKey];

    if (chosenIndices.length !== pack.choose) {
        addToLog("You have not chosen the correct number of cards.", 'text-red-400');
        return;
    }

    const cardsAdded = [];
    chosenIndices.forEach(index => {
        const card = cards[index];
        if (card) {
            // Add to both the master deck (for the run) and the current draw pile
            state.masterDeckList.push(card);
            state.deck.push(card);
            cardsAdded.push(`${card.value}${card.suit}`);
        }
    });

    // Reshuffle the draw pile with the new cards
    shuffleDeck(state.deck);

    addToLog(`You have bound the following cards to your fate: ${cardsAdded.join(', ')}.`, 'text-green-300');

    // Reset state and return to shop
    state.gamePhase = 'shop';
    state.conjurePackDisplay = { packKey: null, cards: [], chosenIndices: [] };
    renderRoguelikeShop();
}

/**
 * Cancels the card selection and returns to the shop.
 */
function cancelConjure() {
    const state = player.roguelikeBlackjackState;
    if (state.gamePhase !== 'conjuring') return;

    addToLog("You step away from the ritual.", 'text-gray-400');
    
    // Reset state and return to shop
    state.gamePhase = 'shop';
    state.conjurePackDisplay = { packKey: null, cards: [], chosenIndices: [] };
    renderRoguelikeShop();
}

function selectArcanaChoice(arcanaKey) {
    const state = player.roguelikeBlackjackState;
    if (state.gamePhase !== 'arcana_choice') return;
    state.arcanaPackDisplay.chosenKey = arcanaKey;
    renderRoguelikeArcanaChoice(); // Re-render to show selection
}

function confirmArcanaChoice() {
    const state = player.roguelikeBlackjackState;
    if (state.gamePhase !== 'arcana_choice') return;
    
    const chosenKey = state.arcanaPackDisplay.chosenKey;
    if (!chosenKey) {
        addToLog("You must choose an Arcana.", 'text-red-400');
        return;
    }
    
    const arcana = BJ_ARCANA_RITUALS[chosenKey];
    addToLog(`You have chosen the ${arcana.name} ritual.`, 'text-purple-300');

    // Reset pack display
    state.arcanaPackDisplay = null;
    
    // --- This part is now the same as the OLD 'arcana' purchase logic ---
    if (arcana.subType === 'ritual_immediate') {
        // Apply effect instantly, return to shop
        arcana.apply(state); // e.g., state.deckAbilities.revealDealer = true;
        addToLog(`The ritual is complete. You feel your fate shift!`, 'text-purple-400');
        state.gamePhase = 'shop'; // Back to shop
        renderRoguelikeShop();
    } else {
        // This Arcana requires card selection.
        state.gamePhase = 'arcana_selection';
        state.activeArcanaKey = chosenKey;
        state.arcanaSelection = {
            cardIds: [],
            arcanaKey: chosenKey
        };
        renderRoguelikeArcanaSelection(); // Go to the card selection screen
    }
}

function cancelArcanaChoice() {
    const state = player.roguelikeBlackjackState;
    if (state.gamePhase !== 'arcana_choice') return;
    
    const packKey = state.arcanaPackDisplay.packKey;
    const tool = BJ_ARCANA_PACKS[packKey];
    
    // Refund cost and put pack back in shop
    if (tool) {
        state.currentCrookards += tool.cost;
        state.shopStock.push(packKey);
    }
    
    addToLog("You step away from the Arcana ritual, your Crookards returned.", "text-gray-400");
    
    state.gamePhase = 'shop';
    state.arcanaPackDisplay = null;
    renderRoguelikeShop();
}   

/**
 * Main logic handler for when a player clicks a card during Arcana selection.
 * @param {string} arcanaKey - The key of the ritual being performed.
 * @param {string} cardUniqueId - The uniqueId of the card that was clicked.
 */
function applyArcanaToCard(arcanaKey, cardUniqueId) {
    const state = player.roguelikeBlackjackState;
    const arcana = BJ_ARCANA_RITUALS[arcanaKey];
    const card = state.masterDeckList.find(c => c.uniqueId === cardUniqueId);
    
    if (!arcana || !card) {
        console.error("Arcana or Card not found.");
        cancelArcanaSelection(); // Failsafe
        return;
    }
    
    const selection = state.arcanaSelection;

    // 1. Handle Enhancements (Single-click)
    if (arcana.subType === 'enhancement') {
        if (state.cardEnhancements[card.uniqueId]) {
            const oldEnhancementName = state.cardEnhancements[card.uniqueId].name || 'a previous enhancement';
            addToLog(`The new ritual for ${arcana.name} overrides the old ${oldEnhancementName}!`, 'text-purple-400 font-bold');
            // No return, just log and proceed
        }
        arcana.apply(card); // e.g., card.ability = 'strength'
        state.cardEnhancements[card.uniqueId] = { name: card.abilityName, ability: card.ability };
        
        addToLog(`The ${arcana.name} ritual is complete. Your ${card.value}${card.suit} is now ${card.abilityName}!`, 'text-purple-300');
        finishArcanaSelection();
        return;
    }
    
    // 2. Handle Multi-Step Rituals
    switch (arcana.subType) {
        case 'ritual_pick_1_erase':
        case 'ritual_pick_1_copy_2':
            // These rituals only need one card
            executeArcanaRitual(arcanaKey, [cardUniqueId]);
            break;
            
        case 'ritual_pick_3_double_chips': // <-- NEW (Hierophant)
            // This ritual needs multiple clicks
            
            // Check card validity
            if (card.value === 'J' || card.value === 'Q' || card.value === 'K') {
                renderRoguelikeArcanaSelection(null, "Hierophant only affects Number cards (A, 2-10).");
                return;
            }

            // Check if card is already selected, and remove it
            const indexInSelection_H = selection.cardIds.indexOf(cardUniqueId);
            if (indexInSelection_H > -1) {
                selection.cardIds.splice(indexInSelection_H, 1);
            } else {
                selection.cardIds.push(cardUniqueId);
            }

            const requiredClicks_H = 3;
            
            if (selection.cardIds.length >= requiredClicks_H) {
                executeArcanaRitual(arcanaKey, selection.cardIds);
            } else {
                const remaining = requiredClicks_H - selection.cardIds.length;
                renderRoguelikeArcanaSelection(null, `Select ${remaining} more Number card(s).`);
            }
            break;

        case 'ritual_pick_4_erase':
        case 'ritual_pick_2_pair':
        case 'ritual_pick_2_fuse':
            // These rituals need multiple clicks
            
            // Check if card is already selected, and remove it
            const indexInSelection = selection.cardIds.indexOf(cardUniqueId);
            if (indexInSelection > -1) {
                selection.cardIds.splice(indexInSelection, 1);
            } else {
                selection.cardIds.push(cardUniqueId);
            }

            const requiredClicks = (arcanaKey === 'arcana_death') ? 4 : 2;
            
            if (selection.cardIds.length >= requiredClicks) {
                // We have enough cards, execute the ritual
                executeArcanaRitual(arcanaKey, selection.cardIds);
            } else {
                // Need more cards, just refresh the UI
                const remaining = requiredClicks - selection.cardIds.length;
                renderRoguelikeArcanaSelection(null, `Select ${remaining} more card(s).`);
            }
            break;

        case 'ritual_pick_suit':
            // This is a special case that needs a different UI
            renderArcanaSuitPicker(arcanaKey);
            break;
    }
}

/**
 * Executes the final logic for multi-step or single-step rituals.
 * @param {string} arcanaKey - The key of the ritual.
 * @param {Array<string>} cardIds - An array of one or more unique card IDs.
 */
function executeArcanaRitual(arcanaKey, cardIds) {
    const state = player.roguelikeBlackjackState;
    const arcana = BJ_ARCANA_RITUALS[arcanaKey];
    if (!arcana || !cardIds || cardIds.length === 0) return;

    // Get card objects from IDs
    const cards = cardIds.map(id => state.masterDeckList.find(c => c.uniqueId === id)).filter(Boolean);
    
    switch (arcana.subType) {
        case 'ritual_pick_1_erase':
            state.masterDeckList = state.masterDeckList.filter(c => c.uniqueId !== cardIds[0]);
            state.currentCrookards += 10;
            state.currentRerollsLeft += 1;
            addToLog(`Your ${cards[0].value}${cards[0].suit} has been erased. You gain 10 Crookards and 1 Reroll.`, 'text-purple-300');
            break;
            
        case 'ritual_pick_2_transform_up': // <-- NEW CASE
            cards.forEach(card => {
                const newFace = ['J', 'Q', 'K'][Math.floor(Math.random() * 3)];
                card.value = newFace;
                card.weight = 10;
            });
            addToLog(`Your ${cards.map(c => c.uniqueId).join(', ')} transform into Face Cards!`, 'text-purple-300');
            break;
            
        case 'ritual_pick_2_transform_down': // <-- NEW CASE
            cards.forEach(card => {
                const newNum = ['2', '3', '4', '5', '6', '7', '8', '9', '10'][Math.floor(Math.random() * 9)];
                card.value = newNum;
                card.weight = parseInt(newNum);
            });
            addToLog(`Your ${cards.map(c => c.uniqueId).join(', ')} transform into Number Cards!`, 'text-purple-300');
            break;
            
        case 'ritual_pick_1_copy_2':
            const cardToCopy = cards[0];
            const copy1 = { ...cardToCopy, uniqueId: `card_${Math.random().toString(36).substring(2, 9)}` };
            const copy2 = { ...cardToCopy, uniqueId: `card_${Math.random().toString(36).substring(2, 9)}` };
            state.masterDeckList.push(copy1, copy2);
            addToLog(`Two copies of ${cardToCopy.value}${cardToCopy.suit} have been added to your deck!`, 'text-purple-300');
            break;
            
        case 'ritual_pick_4_erase':
            state.masterDeckList = state.masterDeckList.filter(c => !cardIds.includes(c.uniqueId));
            const cardNames = cards.map(c => `${c.value}${c.suit}`).join(', ');
            addToLog(`The following cards have been purged from your deck: ${cardNames}.`, 'text-purple-300');
            break;

        case 'ritual_pick_2_pair':
            state.cardPairs.push([cardIds[0], cardIds[1]]);
            cards[0].ability = 'lover'; cards[0].abilityName = 'Lover';
            cards[1].ability = 'lover'; cards[1].abilityName = 'Lover';
            addToLog(`Your ${cards[0].value}${cards[0].suit} and ${cards[1].value}${cards[1].suit} are now Fated Lovers!`, 'text-purple-300');
            break;
            
        case 'ritual_pick_2_fuse':
            const cardA = cards[0];
            const cardB = cards[1];

            const isAceA = cardA.value === 'A';
            const isAceB = cardB.value === 'A';
            const hasAce = isAceA || isAceB;

            let newValue, newWeight;

            if (hasAce) {
                // If an Ace is involved, the new card acts like an Ace
                newValue = 'A'; // This will make calculateHandValue() treat it as flexible

                // Set the 'weight' to be the high value (Ace = 11)
                if (isAceA && isAceB) {
                    // Fusing two Aces. (A=11) + (A=1) = 12.
                    newWeight = 11 + 1; // The flexible values will be 12 or 2
                } else if (isAceA) {
                    // Fusing Ace + Number. (A=11) + (CardB's value)
                    newWeight = 11 + cardB.weight;
                } else { // isAceB
                    // Fusing Number + Ace. (CardA's value) + (A=11)
                    newWeight = cardA.weight + 11;
                }
            } else {
                // Original logic: No Aces involved
                newValue = `${cardA.value}+${cardB.value}`;
                newWeight = cardA.weight + cardB.weight;
            }

            // Create a new card
            const newCard = {
                value: newValue, // Set to 'A' if an Ace was involved, or "7+3" otherwise
                suit: cardA.suit, // Keep suit of the first card
                weight: newWeight, // Set to the high value (if Ace) or sum (if not)
                uniqueId: `card_${Math.random().toString(36).substring(2, 9)}`,
                ability: 'fused',
                abilityName: 'Chimeric'
            };
            finishArcanaSelection();
            break; // <-- FIX 1: This was a '}' on line 3510
    } // <-- This '}' is on line 3511 and closes the 'switch'
} // <-- FIX 2: Add this '}' on a new line (3512) to close 'executeArcanaRitual'

/**
 * Handles the logic for The Hierophant (picking a suit).
 * @param {string} arcanaKey - The key ('arcana_hierophant').
 * @param {string} suit - The suit chosen ('♠', '♥', '♦', '♣').
 */
function applyArcanaRitual_Suit(arcanaKey, suit) {
    const state = player.roguelikeBlackjackState;
    state.deckAbilities.suitRoyals = suit;
    
    addToLog(`All ${suit} cards in your deck will now be considered Face Cards!`, 'text-purple-300');
    
    // Close the suit picker modal
    closeArcanaSuitPicker();
    // Finish the selection process
    finishArcanaSelection();
}

/**
 * Cleans up the state after an Arcana ritual is finished and returns to the shop.
 */
function finishArcanaSelection() {
    const state = player.roguelikeBlackjackState;
    // Reset state
    state.gamePhase = 'shop';
    state.activeArcanaKey = null;
    state.arcanaSelection = null;
    
    // Close the UI
    closeArcanaSelection(); // This function is in rendering.js
    renderRoguelikeShop();
}

/**
 * Cancels the Arcana selection and returns to the shop.
 */
function cancelArcanaSelection() {
    const state = player.roguelikeBlackjackState;

    // --- NO REFUND ---
    // The pack was already 'opened'. Cancelling now just forfeits the ritual.

    addToLog("You step away from the ritual, forfeiting the Arcana.", "text-gray-400"); // <-- New log

    // Clear state
    state.activeArcanaKey = null;
    state.arcanaSelection = null;
    state.gamePhase = 'shop';

    closeArcanaSelection(); // This function is in rendering.js
    renderRoguelikeShop();
}

// NEW function to be added to casino.js
/**
 * Sells a Passive Modifier from the player's inventory.
 * @param {string} key - The key of the passive (e.g., 'diamonds_chips').
 */


function sellRoguelikePassive(key) {
    const state = player.roguelikeBlackjackState;
    if (state.gamePhase !== 'player_draft') return; // Can only sell on your turn

    const mod = BJ_PASSIVE_MODIFIERS[key];
    if (!mod) {
        console.error(`Attempted to sell unknown passive: ${key}`);
        return;
    }

    const index = state.passiveModifiers.indexOf(key);
    if (index === -1) {
        console.error(`Attempted to sell passive not in inventory: ${key}`);
        return;
    }

    // Remove the passive
    state.passiveModifiers.splice(index, 1);
    
    // Grant Crookards (50% of base cost, rounded down)
    const sellPrice = Math.floor(mod.cost * 0.5);
    state.currentCrookards += sellPrice;
    
    addToLog(`You sold ${mod.name} for ${sellPrice} Crookards.`, 'text-yellow-300');
    renderRoguelikeHandUI(); // Refresh the UI
}

// NEW function to be added to casino.js
/**
 * Sells a Consumable from the player's inventory.
 * @param {number} index - The index of the consumable in the state.consumables array.
 */
function sellRoguelikeConsumable(index) {
    const state = player.roguelikeBlackjackState;
    if (state.gamePhase !== 'player_draft') return; // Can only sell on your turn

    if (index < 0 || index >= state.consumables.length) {
        console.error(`Attempted to sell invalid consumable index: ${index}`);
        return;
    }

    // Remove the consumable by index
    const key = state.consumables.splice(index, 1)[0]; // This removes and returns the item key
    const item = BJ_CONSUMABLES[key];
    
    if (!item) {
         console.error(`Sold item key was invalid: ${key}`);
         return; // Item didn't exist, but it's removed now anyway
    }

    // Grant Crookards (50% of base cost, rounded down)
    const sellPrice = Math.floor(item.cost * 0.5);
    state.currentCrookards += sellPrice;

    addToLog(`You sold ${item.name} for ${sellPrice} Crookards.`, 'text-yellow-300');
    renderRoguelikeHandUI(); // Refresh the UI
}

function generateRoguelikeShopStock() {
    const state = player.roguelikeBlackjackState;

    // 1. Get locked items and determine target size
    const stock = [...state.shopLockedSlots];
    const targetStockSize = (4 + (state.patronSkills.includes('Shopaholic') ? 1 : 0)) + 2; // 4 random + 2 guaranteed = 6 total (or 7)
    
    // 2. Generate the 4 (or 5) random items
    const randomItemsToStock = (4 + (state.patronSkills.includes('Shopaholic') ? 1 : 0)) - stock.length; // Only add randoms if not locked
    for (let i = 0; i < randomItemsToStock; i++) {
        const roll = Math.random();
        let itemKey;
        if (roll < 0.30) { // 30%
            itemKey = generateWeightedShopItem('passive');
        } else if (roll < 0.50) { // 20%
            itemKey = generateWeightedShopItem('consumable');
        } else if (roll < 0.85) { // 35%
            const shamanRoll = Math.random();
            if (shamanRoll < 0.5) { // 30% of this 35% = 10.5%
                itemKey = generateWeightedShopItem('conjure');
            } else { // 70% of this 35% = 24.5%
                itemKey = generateWeightedShopItem('arcana_pack');
            }
        } else { // 15%
            itemKey = generateWeightedShopItem('upgrade');
        }
        
        if (itemKey) {
            stock.push(itemKey);
        }
    }
    
    // 3. Add 2 guaranteed items (if slots not locked)
    if (randomItemsToStock > 0) { // Only add guaranteed if we're not fully locked
        const commonPassive = generateWeightedShopItem('passive', 1);
        if (commonPassive) stock.push(commonPassive);

        const commonConsumable = generateWeightedShopItem('consumable', 1);
        if (commonConsumable) stock.push(commonConsumable);
    }

    // 4. De-duplicate the list
    let uniqueStock = [...new Set(stock)];

    // 5. (THE FIX) Backfill the shop if duplicates were removed or guaranteed items failed
    let attempt = 0; // Failsafe to prevent infinite loops
    while (uniqueStock.length < targetStockSize && attempt < 10) {
        // Add a random item (any type) to fill the gap
        const randomType = ['passive', 'consumable', 'arcana_pack', 'upgrade', 'conjure'][Math.floor(Math.random() * 5)];
        const fillItem = generateWeightedShopItem(randomType); // Generate a random item
        
        if (fillItem) {
            uniqueStock.push(fillItem); // Add it to the stock
            uniqueStock = [...new Set(uniqueStock)]; // Re-run set to ensure *this* wasn't a duplicate
        }
        attempt++;
    }

    // 6. Save the final stock
    state.shopStock = uniqueStock; 
    return state.shopStock;
}

function generateWeightedShopItem(type) {
    const state = player.roguelikeBlackjackState;
    let sourcePool;
    let filterPool;

    if (type === 'passive') {
        sourcePool = BJ_PASSIVE_MODIFIERS;
        filterPool = k => !state.passiveModifiers.includes(k);
    } else if (type === 'consumable') {
        sourcePool = BJ_CONSUMABLES;
        filterPool = k => true; // Consumables can stack
    } else if (type === 'upgrade') {
        sourcePool = BJ_RUN_UPGRADES;
        // Filter out upgrades that are already acquired and non-stackable
        filterPool = k => {
            if (k === 'rerolls_to_hands' && state.runUpgrades.rerollsToHands) return false;
            if (k === 'cheaper_reroll' && state.runUpgrades.baseShopRerollCost === 1) return false;
            // Add more checks for future non-stackable upgrades
            return true;
        };
    } else if (type === 'conjure') {
        sourcePool = BJ_CONJURE_PACKS;
        filterPool = k => true; // Conjure packs can be bought multiple times
    // --- ADD THIS ELSE IF ---
    } else if (type === 'arcana_pack') {
        sourcePool = BJ_ARCANA_PACKS;
        filterPool = k => true; // Packs can always be bought
    } else {
        return null;    
    }

    const availableKeys = Object.keys(sourcePool).filter(filterPool);
    if (availableKeys.length === 0) return null;

    // Rarity Weights: C: 60%, U: 25%, R: 10%, E: 4%, L: 1%
    const rarityRoll = Math.random() * 100;
    let chosenRarity;
    if (rarityRoll < 60) chosenRarity = 1;       // Common
    else if (rarityRoll < 85) chosenRarity = 2;  // Uncommon
    else if (rarityRoll < 95) chosenRarity = 3;  // Rare
    else if (rarityRoll < 99) chosenRarity = 4;  // Epic
    else chosenRarity = 5;                       // Legendary

    let poolByRarity = availableKeys.filter(k => sourcePool[k].rarity === chosenRarity);
    
    // Fallback: If no items of that rarity are available, try the next rarity down
    if (poolByRarity.length === 0) {
        for (let r = chosenRarity - 1; r >= 1; r--) {
            poolByRarity = availableKeys.filter(k => sourcePool[k].rarity === r);
            if (poolByRarity.length > 0) break;
        }
    }
    // Final fallback: just pick from anything available
    if (poolByRarity.length === 0) {
        poolByRarity = availableKeys;
    }
    if (poolByRarity.length === 0) return null; // Should not happen

    return poolByRarity[Math.floor(Math.random() * poolByRarity.length)];
}

function buyRoguelikeTool(toolKey) {
    const state = player.roguelikeBlackjackState;
    let tool;
    let type;

    if (BJ_PASSIVE_MODIFIERS[toolKey]) {
        tool = BJ_PASSIVE_MODIFIERS[toolKey]; type = 'passive';
    } else if (BJ_CONSUMABLES[toolKey]) {
        tool = BJ_CONSUMABLES[toolKey]; type = 'consumable';
    } else if (BJ_RUN_UPGRADES[toolKey]) {
        tool = BJ_RUN_UPGRADES[toolKey]; type = 'upgrade';
    } else if (BJ_CONJURE_PACKS[toolKey]) {
        tool = BJ_CONJURE_PACKS[toolKey]; type = 'conjure';
    } else if (BJ_ARCANA_PACKS[toolKey]) { // <-- THIS LINE IS NEW
        tool = BJ_ARCANA_PACKS[toolKey]; type = 'arcana_pack';
    }
    // --- END ADDITION ---

    if (!tool || state.currentCrookards < tool.cost) {
        addToLog("You can't afford that.", 'text-red-400');
        return;
    }

    // Check slots
    state.currentCrookards -= tool.cost; 
    
    if (type === 'passive') {
        state.passiveModifiers.push(toolKey);
    } else if (type === 'consumable') {
        state.consumables.push(toolKey);
    } else if (type === 'upgrade') {
        tool.apply(state);
        if (toolKey === 'cheaper_reroll') {
            state.shopRerollCost = state.runUpgrades.baseShopRerollCost;
        }
    } else if (type === 'conjure') {
        addToLog(`You pay ${tool.cost} Crookards. The shaman begins the ritual...`, 'text-yellow-300');
        const conjuredCards = [];
        
        // --- NEW: 10% Enhancement Chance ---
        const enhancements = Object.keys(BJ_ARCANA_RITUALS).filter(k => BJ_ARCANA_RITUALS[k].subType === 'enhancement');
        // --- END NEW ---

        for (let i = 0; i < tool.conjure; i++) {
            const randomCard = { ...MASTER_CARD_LIST[Math.floor(Math.random() * MASTER_CARD_LIST.length)] }; // Push a copy
            
            // --- NEW: 10% Chance Logic ---
            if (enhancements.length > 0 && Math.random() < 0.20) { // 10% chance
                const randomArcanaKey = enhancements[Math.floor(Math.random() * enhancements.length)];
                const randomArcana = BJ_ARCANA_RITUALS[randomArcanaKey];
                randomArcana.apply(randomCard); // Apply enhancement (e.g., card.ability = 'strength')
                addToLog(`The conjured ${randomCard.value}${randomCard.suit} feels... different. It is now ${randomCard.abilityName}!`, 'text-purple-300');
            }
            // --- END NEW ---
            conjuredCards.push(randomCard);
        }
        state.gamePhase = 'conjuring';
        state.conjurePackDisplay = {
            packKey: toolKey,
            cards: conjuredCards,
            chosenIndices: []
        };
        
        state.shopStock = state.shopStock.filter(key => key !== toolKey);
        
        renderRoguelikeConjure(); // Render the new screen
        return; 
    }
    // --- ADD THIS ENTIRE BLOCK ---
    else if (type === 'arcana_pack') {
        addToLog(`You pay ${tool.cost} Crookards for the ${tool.name} ritual...`, 'text-yellow-300');

        // Generate random Arcana choices
        const arcanaChoices = [];
        const availableArcana = Object.keys(BJ_ARCANA_RITUALS); // All arcana are available

        for (let i = 0; i < tool.conjure; i++) {
            if (availableArcana.length === 0) break; // Should not happen
            const randIndex = Math.floor(Math.random() * availableArcana.length);
            // --- THIS IS THE FIX: Splice returns an array, so take the first element ---
            const chosenArcanaKey = availableArcana.splice(randIndex, 1)[0]; // Pull from list to avoid duplicates *in this one pack*
            arcanaChoices.push(chosenArcanaKey);
        }

        state.gamePhase = 'arcana_choice'; // New game phase
        state.arcanaPackDisplay = {
            packKey: toolKey,
            arcana: arcanaChoices,
            chosenKey: null // Single select
        };

        state.shopStock = state.shopStock.filter(key => key !== toolKey);

        renderRoguelikeArcanaChoice(); // Render the new screen
        return; 
    }
// Remove from shop stock (for non-conjure/arcana items)
    // --- END NEW ---

    // Remove from shop stock (for non-conjure/arcana items)
    state.shopStock = state.shopStock.filter(key => key !== toolKey);
    addToLog(`Purchased: ${tool.name}!`, 'text-green-300');
    renderRoguelikeShop(); // Re-render shop
}

function getRandomCardEnhancement() {
    const state = player.roguelikeBlackjackState;
    // Get all Arcana that are 'enhancement' type
    const enhancements = Object.keys(BJ_ARCANA_RITUALS).filter(k => BJ_ARCANA_RITUALS[k].subType === 'enhancement');
    
    if (enhancements.length === 0) {
        return null; // No enhancements defined
    }
    
    const randomArcanaKey = enhancements[Math.floor(Math.random() * enhancements.length)];
    const randomArcana = BJ_ARCANA_RITUALS[randomArcanaKey];
    
    return randomArcana;
}

function sellRoguelikePassiveShop(key) {
    const state = player.roguelikeBlackjackState;
    // Can sell anytime in shop
    if (state.gamePhase !== 'shop') return;

    const mod = BJ_PASSIVE_MODIFIERS[key];
    if (!mod) {
        console.error(`Attempted to sell unknown passive: ${key}`);
        return;
    }

    const index = state.passiveModifiers.indexOf(key);
    if (index === -1) {
        console.error(`Attempted to sell passive not in inventory: ${key}`);
        return;
    }

    // Remove the passive
    state.passiveModifiers.splice(index, 1);
    
    // Grant Crookards (50% of base cost, rounded down)
    const sellPrice = Math.floor(mod.cost * 0.5);
    state.currentCrookards += sellPrice;
    
    addToLog(`You sold ${mod.name} for ${sellPrice} Crookards.`, 'text-yellow-300');
    renderRoguelikeShop(); // Refresh the SHOP UI
}

/**
 * Sells a Consumable from the player's inventory *from the shop screen*.
 * @param {number} index - The index of the consumable in the state.consumables array.
 */
function sellRoguelikeConsumableShop(index) {
    const state = player.roguelikeBlackjackState;
    if (state.gamePhase !== 'shop') return;

    if (index < 0 || index >= state.consumables.length) {
        console.error(`Attempted to sell invalid consumable index: ${index}`);
        return;
    }

    // Remove the consumable by index
    const key = state.consumables.splice(index, 1)[0]; // This removes and returns the item key
    const item = BJ_CONSUMABLES[key];
    
    if (!item) {
         console.error(`Sold item key was invalid: ${key}`);
         return; // Item didn't exist, but it's removed now anyway
    }

    // Grant Crookards (50% of base cost, rounded down)
    const sellPrice = Math.floor(item.cost * 0.5);
    state.currentCrookards += sellPrice;

    addToLog(`You sold ${item.name} for ${sellPrice} Crookards.`, 'text-yellow-300');
    renderRoguelikeShop(); // Refresh the SHOP UI
}

function roguelikeRerollShop() {
    const state = player.roguelikeBlackjackState;
    const cost = state.shopRerollCost;
    
    // --- NEW: Shopaholic check ---
    if (state.patronSkills.includes('Shopaholic')) {
        addToLog("Shopaholic! Reroll is free.", "text-yellow-300");
        state.shopStock = generateRoguelikeShopStock();
        renderRoguelikeShop();
        return;
    }
    // --- END NEW ---

    if (state.currentCrookards < cost) { 
        addToLog("Not enough Crookards to reroll.", 'text-red-400');
        return;
    }
    state.currentCrookards -= cost;
    state.shopRerollCost *= 2;
    addToLog(`Rerolled shop for ${cost} Crookards. Next reroll costs ${state.shopRerollCost} Crookards.`, "text-yellow-300");

    // --- MODIFICATION ---
    // Clear the shop stock. generateRoguelikeShopStock will see it's empty
    // and rebuild it, automatically preserving the shopLockedSlots.
    state.shopStock = [];
    // --- END MODIFICATION ---

    renderRoguelikeShop();
}

function toggleShopLock(itemKey) {
    const state = player.roguelikeBlackjackState;
    if (state.gamePhase !== 'shop') return;

    // Get the correct lock cost from run upgrades
    const lockCost = state.runUpgrades.cheaperLocks ? 1 : (state.shopLockCost || 2);
    const index = state.shopLockedSlots.indexOf(itemKey);

    if (index > -1) {
        // Item is locked, UNLOCK it
        state.shopLockedSlots.splice(index, 1);
        // Do NOT refund cost.
        addToLog(`You unlocked ${getItemDetails(itemKey).name}. It will be removed on the next reroll.`, 'text-gray-400');
    } else {
        // Item is unlocked, LOCK it
        if (state.currentCrookards < lockCost) {
            addToLog(`You need ${lockCost} Crookards to lock that item.`, 'text-red-400');
            return;
        }
        state.currentCrookards -= lockCost;
        state.shopLockedSlots.push(itemKey);
        addToLog(`You paid ${lockCost} Crookards to lock ${getItemDetails(itemKey).name}. It is safe from rerolls.`, 'text-yellow-300');
    }
    renderRoguelikeShop(); // Refresh UI to show new lock state
}

function startNextHand() {
    const state = player.roguelikeBlackjackState;
    
    // --- NEW: Move used cards to discard pile ---
    state.discardPile.push(...state.playerHand);
    state.discardPile.push(...state.dealerHand);
    state.discardPile.push(...state.sharedPool);
    // --- END NEW ---

    if (state.deck.length < 20) { // Ensure enough cards for next hand + pool
        addToLog("Shuffling the discard pile back into the deck.", "text-gray-400");
        state.deck.push(...state.discardPile); // Add discards back
        state.discardPile = []; // Empty discard
        shuffleDeck(state.deck); // Shuffle the full deck
    }

    // --- MODIFIED: Clear hands/pool *after* discarding ---
    state.playerHand = [state.deck.pop(), state.deck.pop()];
    state.dealerHand = [state.deck.pop(), state.deck.pop()]; 
    state.sharedPool = []; 
    // --- END MODIFIED ---

    dealRoguelikePool(); // Deal 6 cards to the pool

    state.gamePhase = 'player_draft'; // Start with player's turn to draft
    state.statusMessage = 'Your turn. Draft a card or Stand.';
    state.lastScore = 0;

    renderRoguelikeGame(); // Render the new hand UI
}

// --- NEW FUNCTION: Player rerolls the pool ---
function roguelikePlayerRerollPool() {
    const state = player.roguelikeBlackjackState;
    // --- MODIFIED: Added rerollsToHands check ---
    if (state.gamePhase !== 'player_draft' || state.currentRerollsLeft <= 0 || state.runUpgrades.rerollsToHands) {
        return; // Safety check
    }
    // --- END MODIFIED ---

    state.currentRerollsLeft--; // Consume a reroll
    state.gamePhase = 'dealer_draft'; // It's now the dealer's turn
    
    addToLog("You use a reroll! The pool is discarded.", "text-yellow-300");

    // Discard pool, deal new one
    state.sharedPool = [];
    dealRoguelikePool();
    
    addToLog("A new pool is dealt. The dealer drafts first!", "text-red-400");
    
    renderRoguelikeGame(); // Show the new pool (and dealer's turn)
    
    // Call the dealer's AI
    setTimeout(() => roguelikeDealerDraft(false), 1500);
}