// This file contains the game logic for the Arcane Casino.

// --- BLACKJACK ("Arcane 21") ---
let casinoSecretCode = []; // <-- NEW: Track secret code
const CASINO_SECRET = ['B', 'A', 'L', 'A', 'T', 'R', 'O']; // <-- NEW: The code itself

let blackjackState = {
    deck: [],
    playerHand: [],
    dealerHand: [],
    bet: 0,
    gamePhase: 'betting', // 'betting', 'playerTurn', 'dealerTurn', 'results'
    statusMessage: 'Place your bet to begin.'
};

const SUITS = ['♠', '♥', '♦', '♣'];
const VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

function checkCasinoCode(char) {
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
}
/**
 * Creates a standard 52-card deck.
 */
function createDeck() {
    let deck = [];
    for (let suit of SUITS) {
        for (let value of VALUES) {
            let weight = parseInt(value);
            if (value === 'J' || value === 'Q' || value === 'K') weight = 10;
            if (value === 'A') weight = 11; // Handle as 11 initially
            deck.push({ value, suit, weight });
        }
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
// --- ARCANE 21: THE ENDLESS RUN (ROGUELIKE BLACKJACK) ---
// =================================================================================

let roguelikeBlackjackState = {
    runActive: false,
    buyIn: 500,

    // --- New Progression Trackers ---
    currentAnteIndex: 0,
    currentVingtUnIndex: 0,
    currentCrookards: 0, // NEW CURRENCY

    // --- Run-Wide Persistent Upgrades ---
    passiveModifiers: [],
    consumables: [],
    patronSkills: [],
    runUpgrades: {
        passiveSlots: 5,
        consumableSlots: 2,
        handSize: 5, 
        shopRerollCost: 1, // Was 10 (Chips), now 1 (Crookard)
        bonusHandsPerVingtUn: 0,
        bonusRerollsPerVingtUn: 0,
        baseMultiplier: 0
    },

    // --- Vingt-un-Specific Trackers (Reset after each win) ---
    currentChips: 0,
    currentHandsLeft: 0,
    currentRerollsLeft: 0,
    vingtUnBustSafety: true,

    // --- Hand-Specific State ---
    deck: [],
    playerHand: [],
    dealerHand: [],
    sharedPool: [],
    lastScore: 0,
    
    // --- State Machine & Shop ---
    gamePhase: 'buy_in',
    statusMessage: '',
    shopStock: [],
};

const ANTE_STRUCTURE = [
    // --- Ante 1 (Intro) ---
    { 
        anteName: "The Entryway",
        cashOutReward: 100, // Reduced from 150
        vingtUns: [
            { name: 'Petit', chipsToWin: 50, hands: 5, rerolls: 3 }, // Your requested 50 start
            { name: 'Grand', chipsToWin: 100, hands: 5, rerolls: 3 },
            { name: 'Patron', chipsToWin: 200, hands: 5, rerolls: 3, patronSkillPool: ['Escalating Stakes', 'Ace in the Hole'] }
        ]
    },
    // --- Ante 2 (Easy) ---
    { 
        anteName: "The Double Down",
        cashOutReward: 250, // Reduced from 300
        vingtUns: [
            { name: 'Petit', chipsToWin: 100, hands: 5, rerolls: 3 },
            { name: 'Grand', chipsToWin: 200, hands: 5, rerolls: 3 },
            { name: 'Patron', chipsToWin: 400, hands: 5, rerolls: 3, patronSkillPool: ['High Roller\'s Intuition', 'Perfect Start'] }
        ]
    },
    // --- Ante 3 (Medium) ---
    { 
        anteName: "The High Table",
        cashOutReward: 500, // Reduced from 600
        vingtUns: [
            { name: 'Petit', chipsToWin: 200, hands: 4, rerolls: 3 }, // Fewer hands
            { name: 'Grand', chipsToWin: 400, hands: 4, rerolls: 3 },
            { name: 'Patron', chipsToWin: 800, hands: 4, rerolls: 3, patronSkillPool: ['Mulligan', 'The Sixth Card'] }
        ]
    },
    // --- Ante 4 (Medium) ---
    { 
        anteName: "The Turn",
        cashOutReward: 1000, // Reduced from 1200
        vingtUns: [
            { name: 'Petit', chipsToWin: 300, hands: 4, rerolls: 3 },
            { name: 'Grand', chipsToWin: 600, hands: 4, rerolls: 3 },
            { name: 'Patron', chipsToWin: 1200, hands: 4, rerolls: 3, patronSkillPool: ['Escalating Stakes', 'Minor Miscalculation'] }
        ]
    },
    // --- Ante 5 (Hard) ---
    { 
        anteName: "The River",
        cashOutReward: 2000, // Reduced from 2500
        vingtUns: [
            { name: 'Petit', chipsToWin: 400, hands: 4, rerolls: 2 }, // Fewer rerolls
            { name: 'Grand', chipsToWin: 800, hands: 4, rerolls: 2 },
            { name: 'Patron', chipsToWin: 1600, hands: 4, rerolls: 2, patronSkillPool: ['High Roller\'s Intuition', 'Jester\'s Gambit'] }
        ]
    },
    // --- Ante 6 (Hard) ---
    { 
        anteName: "The All-In",
        cashOutReward: 4000, // Reduced from 5000
        vingtUns: [
            { name: 'Petit', chipsToWin: 600, hands: 4, rerolls: 2 },
            { name: 'Grand', chipsToWin: 1200, hands: 4, rerolls: 2 },
            { name: 'Patron', chipsToWin: 2500, hands: 4, rerolls: 2, patronSkillPool: ['Perfect Start', 'The Sixth Card'] }
        ]
    },
    // --- Ante 7 (Very Hard) ---
    { 
        anteName: "The Shark Tank",
        cashOutReward: 8000, // Reduced from 10000
        vingtUns: [
            { name: 'Petit', chipsToWin: 1000, hands: 3, rerolls: 2 }, // Fewer hands
            { name: 'Grand', chipsToWin: 2000, hands: 3, rerolls: 2 },
            { name: 'Patron', chipsToWin: 4000, hands: 3, rerolls: 2, patronSkillPool: ['Minor Miscalculation', 'Mulligan'] }
        ]
    },
    // --- Ante 8 (Final) ---
    { 
        anteName: "The House Always Wins",
        cashOutReward: 20000, // Reduced from 25000
        vingtUns: [
            { name: 'Petit', chipsToWin: 1500, hands: 3, rerolls: 1 }, // Fewer rerolls
            { name: 'Grand', chipsToWin: 3000, hands: 3, rerolls: 1 },
            { name: 'Patron', chipsToWin: 6000, hands: 3, rerolls: 1, patronSkillPool: ['Escalating Stakes', 'High Roller\'s Intuition', 'Jester\'s Gambit'] }
        ]
    }
];

// NEW CONSTANT for Patron Skills
const PATRON_SKILLS = {
    'Escalating Stakes': {
        name: 'Escalating Stakes',
        desc: 'At the start of each new Ante (including this one), gain a permanent +1 base Multiplier for the rest of the run. (Cumulative)'
    },
    'High Roller\'s Intuition': {
        name: 'High Roller\'s Intuition',
        desc: 'Doubles the chip bonus from all Poker Hands (Pair, Two Pair, 3-of-a-Kind, etc.).'
    },
    'Ace in the Hole': {
        name: 'Ace in the Hole',
        desc: 'Every hand that includes at least one Ace (used as 1 or 11) gets +50 Base Chips.'
    },
    'Perfect Start': {
        name: 'Perfect Start',
        desc: 'The first hand of every Vingt-un (Petit, Grand, and Patron) does not consume one of your "Hands Left."'
    },
    'Mulligan': {
        name: 'Mulligan',
        desc: 'Your first Pool Reroll in every Vingt-un is free and does not consume a reroll charge.'
    },
    'The Sixth Card': {
        name: 'The Sixth Card',
        desc: 'An extra (7th) card is dealt to the Shared Pool at the start of every hand.'
    },
    'Jester\'s Gambit': {
        name: 'Jester\'s Gambit',
        desc: 'Your maximum hand size is increased to 6. A "6-Card Charlie" (6 cards, 21 or less) counts as an automatic win and applies the 5-card bonus.'
    },
    'Minor Miscalculation': {
        name: 'Minor Miscalculation',
        desc: 'Once per Vingt-un, if you Bust, your hand is reset and your turn ends (you do not lose the hand).'
    }
};

// --- DATA: Passive Modifiers (Jokers) ---
const BJ_PASSIVE_MODIFIERS = {
    // --- Suit Passives (Chips) ---
    'diamonds_chips': { name: 'Gilded Curse (♦)', desc: '+25 Base Chips for each ♦ card in your hand.', type: 'passive', cost: 6, rarity: 1,
        check: () => true, logic: (mult, base, hand) => ({ base: base + (hand.filter(c => c.suit === '♦').length * 25), mult: mult }) },
    'hearts_chips': { name: 'Sanguine Tribute (♥)', desc: '+25 Base Chips for each ♥ card in your hand.', type: 'passive', cost: 6, rarity: 1,
        check: () => true, logic: (mult, base, hand) => ({ base: base + (hand.filter(c => c.suit === '♥').length * 25), mult: mult }) },
    'clubs_chips': { name: 'Scholar\'s Sigil (♣)', desc: '+25 Base Chips for each ♣ card in your hand.', type: 'passive', cost: 6, rarity: 1,
        check: () => true, logic: (mult, base, hand) => ({ base: base + (hand.filter(c => c.suit === '♣').length * 25), mult: mult }) },
    'spades_chips': { name: 'Reaper\'s Tithe (♠)', desc: '+25 Base Chips for each ♠ card in your hand.', type: 'passive', cost: 6, rarity: 1,
        check: () => true, logic: (mult, base, hand) => ({ base: base + (hand.filter(c => c.suit === '♠').length * 25), mult: mult }) },
    
    // --- Suit Passives (Multiplier) ---
    'diamonds_mult': { name: 'Crystal Lattice (♦)', desc: '+2 Multiplier for each ♦ card in your hand.', type: 'passive', cost: 5, rarity: 1,
        check: () => true, logic: (mult, base, hand) => mult + (hand.filter(c => c.suit === '♦').length * 2) },
    'hearts_mult': { name: 'Heart\'s Echo (♥)', desc: '+2 Multiplier for each ♥ card in your hand.', type: 'passive', cost: 5, rarity: 1,
        check: () => true, logic: (mult, base, hand) => mult + (hand.filter(c => c.suit === '♥').length * 2) },
    'clubs_mult': { name: 'Arcane Tome (♣)', desc: '+2 Multiplier for each ♣ card in your hand.', type: 'passive', cost: 5, rarity: 1,
        check: () => true, logic: (mult, base, hand) => mult + (hand.filter(c => c.suit === '♣').length * 2) },
    'spades_mult': { name: 'Shadow Weave (♠)', desc: '+2 Multiplier for each ♠ card in your hand.', type: 'passive', cost: 5, rarity: 1,
        check: () => true, logic: (mult, base, hand) => mult + (hand.filter(c => c.suit === '♠').length * 2) },

    // --- Hand Score Passives (Chips) ---
    'base_chips_plus': { name: 'Burden of Riches', desc: '+50 Base Chips for every winning hand.', type: 'passive', cost: 10, rarity: 3,
        check: () => true, logic: (mult, base) => ({ base: base + 50, mult: mult }) },
    'risky_chips': { name: 'Edge of Madness', desc: 'Standing on 13, 14, 15, or 16 gives +100 Base Chips.', type: 'passive', cost: 8, rarity: 2,
        check: (hand, score) => [13,14,15,16].includes(score), logic: (mult, base) => ({ base: base + 100, mult: mult }) },
    'perfect_21_chips': { name: 'Flawless Execution', desc: 'Winning with exactly 21 gives +150 Base Chips.', type: 'passive', cost: 12, rarity: 3,
        check: (hand, score) => score === 21, logic: (mult, base) => ({ base: base + 150, mult: mult }) },
    'no_hit_win_chips': { name: 'Silent Victory', desc: 'Winning with your starting 2-card hand gives +200 Base Chips.', type: 'passive', cost: 11, rarity: 3,
        check: (hand) => hand.length === 2, logic: (mult, base) => ({ base: base + 200, mult: mult }) },

    // --- Hand Score Passives (Multiplier) ---
    'blackjack_mult': { name: 'Fate\'s Blessing', desc: 'Natural Blackjacks (2-card 21) give +15 Multiplier.', type: 'passive', cost: 9, rarity: 3,
        check: (hand, score, is5Card, isBlackjack) => isBlackjack, logic: (mult) => mult + 15 },
    'five_card_mult': { name: 'The Jester\'s Hand', desc: '5-Card Charlies get +10 Multiplier.', type: 'passive', cost: 10, rarity: 3,
        check: (hand, score, is5Card) => is5Card, logic: (mult) => mult + 10 },
    
    // --- Poker Hand Passives (Multiplier) ---
    'royal_mult': { name: 'Court of the Damned', desc: '+4 Multiplier for each Face card (J,Q,K) in your hand.', type: 'passive', cost: 7, rarity: 2,
        check: () => true, logic: (mult, base, hand) => mult + (hand.filter(c => ['J','Q','K'].includes(c.value)).length * 4) },
    'pair_mult': { name: 'Twin Souls', desc: '+2 Multiplier for each Pair in your hand.', type: 'passive', cost: 8, rarity: 2,
        check: (hand, score, is5Card, isBJ, pokerRank) => pokerRank.pairs > 0, logic: (mult, base, hand, score, is5Card, isBJ, pokerRank) => mult + (pokerRank.pairs * 2) },
    'two_pair_mult': { name: 'Dual Destinies', desc: '+6 Multiplier for Two Pair.', type: 'passive', cost: 10, rarity: 3,
        check: (hand, score, is5Card, isBJ, pokerRank) => pokerRank.isTwoPair, logic: (mult) => mult + 6 },
    'three_kind_mult': { name: 'Coven\'s Pact', desc: '+5 Multiplier for Three of a Kind.', type: 'passive', cost: 9, rarity: 2,
        check: (hand, score, is5Card, isBJ, pokerRank) => pokerRank.isThreeOfAKind, logic: (mult) => mult + 5 },
    'four_kind_mult': { name: 'Void\'s Hand', desc: '+10 Multiplier for Four of a Kind.', type: 'passive', cost: 15, rarity: 4,
        check: (hand, score, is5Card, isBJ, pokerRank) => pokerRank.isFourOfAKind, logic: (mult) => mult + 10 },
    'team_of_ace_mult': { name: 'Abyssal Duality', desc: '+10 Multiplier if your hand uses one Ace as 1 and another as 11.', type: 'passive', cost: 13, rarity: 4,
        check: (hand, score, is5Card, isBJ, pokerRank) => pokerRank.isTeamOfAce, logic: (mult) => mult + 10 },
};

// --- DATA: Consumables (Tarots) ---
const BJ_CONSUMABLES = {
    'vial_clarity': { name: 'Oracle\'s Draught', desc: 'Use: The next card you Hit is guaranteed to be a 7, 8, or 9.', type: 'consumable', cost: 3, rarity: 1,
        use: (state) => {
            const safeCards = state.deck.filter(c => ['7','8','9'].includes(c.value));
            if (safeCards.length > 0) {
                const safeCard = safeCards[0];
                state.deck = state.deck.filter(c => c !== safeCard); // Remove from deck
                state.playerHand.push(safeCard); // Add to hand
                return { success: true, message: 'Drew a safe card.' };
            }
            return { success: false, message: 'No safe cards left!' };
        }},
    'second_guess': { name: 'Fate\'s Erasure', desc: 'Use: If you Bust, undo your last Hit.', type: 'consumable', cost: 5, rarity: 2,
        use: (state) => { /* Logic handled at time of bust */ return { success: true, message: 'Token is ready.' }; }},
    'reshuffle_orb': { name: 'Chaotic Orb', desc: 'Use: Shuffle a new, full deck.', type: 'consumable', cost: 2, rarity: 1,
        use: (state) => {
            state.deck = createDeck();
            shuffleDeck(state.deck);
            return { success: true, message: 'Deck has been reshuffled.' };
        }},
};

// --- DATA: Run Upgrades (Vouchers) ---
const BJ_RUN_UPGRADES = {
    'extra_hand': { 
        name: 'Thickened Resolve', 
        desc: 'Start each Vingt-un with +1 Hand.', 
        type: 'upgrade', 
        cost: 10,
        apply: (state) => { state.runUpgrades.bonusHandsPerVingtUn++; }
    },
    'extra_passive': { 
        name: 'Expanded Consciousness', 
        desc: '+1 Passive Modifier slot.', 
        type: 'upgrade', 
        cost: 15,
        apply: (state) => { state.runUpgrades.passiveSlots++; }
    },
    'extra_consumable': { 
        name: 'Occult Satchel', 
        desc: '+1 Consumable slot.', 
        type: 'upgrade', 
        cost: 8,
        apply: (state) => { state.runUpgrades.consumableSlots++; }
    },
    'cheaper_reroll': { 
        name: 'Silver Tongue', 
        desc: 'Shop rerolls cost 50% less.', 
        type: 'upgrade', 
        cost: 6,
        apply: (state) => { state.runUpgrades.shopRerollCost = Math.floor(state.runUpgrades.shopRerollCost * 0.5); }
    },
    'extra_reroll': { 
        name: 'Third Eye', 
        desc: 'Start each Vingt-un with +1 Pool Reroll.', 
        type: 'upgrade', 
        cost: 12,
        apply: (state) => { state.runUpgrades.bonusRerollsPerVingtUn++; }
    },
};


// --- Core Game Functions ---

function startRoguelikeRun() {
    if (player.gold < roguelikeBlackjackState.buyIn) {
        addToLog(`You need ${roguelikeBlackjackState.buyIn}G to start a run.`, 'text-red-400');
        return;
    }
    player.gold -= roguelikeBlackjackState.buyIn;
    
    // Initialize the new state structure
    roguelikeBlackjackState = {
        ...roguelikeBlackjackState, // Keep buyIn, etc.
        runActive: true,
        currentAnteIndex: 0,
        currentVingtUnIndex: 0,
        passiveModifiers: [],
        consumables: [],
        patronSkills: [],
        runUpgrades: { // Reset all run-specific upgrades
            passiveSlots: 5,
            consumableSlots: 2,
            handSize: 5,
            shopRerollCost: 10,
            bonusHandsPerVingtUn: 0,
            bonusRerollsPerVingtUn: 0,
            baseMultiplier: 0 // For 'Escalating Stakes' skill
        },
        currentChips: 0,
        currentHandsLeft: 0,
        currentRerollsLeft: 0,
        vingtUnBustSafety: true,
        deck: [],
        playerHand: [],
        dealerHand: [],
        sharedPool: [],
        gamePhase: 'starting_run', // A temp phase
        statusMessage: 'The run begins. Prepare for the first Vingt-un.',
        shopStock: [],
        lastScore: 0,
    };
    
    addToLog(`You pay the ${roguelikeBlackjackState.buyIn}G buy-in. The run begins.`, 'text-yellow-300');
    updateStatsView();
    
    // --- THIS IS THE FIX ---
    // Call the new starting function, not the old one.
    startVingtUn(); 
}

function startRoguelikeHand() {
    const state = roguelikeBlackjackState;
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
    const state = roguelikeBlackjackState;
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
    const state = roguelikeBlackjackState;
    if (state.gamePhase !== 'player_draft') return;

    state.gamePhase = 'dealer_draft'; // Lock player actions
    if (consumableKey) {
        // --- Use Consumable ---
        const item = BJ_CONSUMABLES[consumableKey];
        const result = item.use(state);
        addToLog(result.message, result.success ? 'text-green-300' : 'text-red-400');
        // Remove from inventory
        state.consumables.splice(state.consumables.indexOf(consumableKey), 1);
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
    if (playerValue > 21) {
        // --- NEW: Check for 'Minor Miscalculation' Patron Skill ---
        if (state.vingtUnBustSafety) { // Check if safety net is active
            state.vingtUnBustSafety = false; // Consume the safety net
            state.statusMessage = "Minor Miscalculation! Your bust is forgiven, but your turn ends.";
            addToLog(state.statusMessage, 'text-yellow-300');
            state.gamePhase = 'dealer_final_draft'; // Force dealer's final turn
            renderRoguelikeGame();
            setTimeout(() => roguelikeDealerDraft(true), 1500); // Call dealer's final turn
            return; // Stop processing
        }
        // --- END NEW ---

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
    } else if (state.playerHand.length >= (state.runUpgrades.handSize + (state.patronSkills.includes('Jester\'s Gambit') ? 1 : 0))) { // MODIFIED: Check Jester's Gambit
        state.statusMessage = 'Max Hand Size! You automatically Stand.'; // MODIFIED
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
    const state = roguelikeBlackjackState;
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
    const state = roguelikeBlackjackState;
    
    // --- AI Decision Logic ---
    let bestCardIndex = -1;
    let bestCardFinalScore = -Infinity; // The new score, including poker bonus
    let action = 'stand'; // Default action is to stand
    
    const currentRawScore = calculateHandValue(state.dealerHand);
    const currentFinalScore = calculateFinalShowdownScore(state.dealerHand); // Get current score + poker bonus
    const playerVisibleCard = state.playerHand[0]; // AI can only see first card

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
        
        // --- THIS IS YOUR REQUEST: "Slight recognition" ---
        // Add the poker bonus on top of the Blackjack score.
        // This makes it a tie-breaker.
        cardScore += newPokerBonus;
        // --- END REQUEST ---
        
        // Hate-Drafting Logic: Is this card *amazing* for the player?
        // (Simple check: does it give them 21 based on their *one* visible card?)
        if (playerVisibleCard.weight + card.weight === 21) {
            cardScore += 25; // Prioritize taking a card that gives player 21
        }
        
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
    const state = roguelikeBlackjackState;
    state.gamePhase = 'hand_results'; // Set the phase

    if (result === 'win') { // Player wins (e.g., dealer bust)
        const score = calculateRoguelikeScore();
        state.lastScore = score;
        state.currentChips += score; // Add score to wave total
        state.statusMessage = `You win! Scored ${score} Chips!`;
        addToLog(state.statusMessage, 'text-green-300');
    
    } else if (result === 'showdown') { 
        const playerScore = calculateFinalShowdownScore(state.playerHand);
        const dealerScore = calculateFinalShowdownScore(state.dealerHand);

        // ... (log debug scores) ...

        if (playerScore > dealerScore) { // Player wins showdown
            const score = calculateRoguelikeScore(); 
            state.lastScore = score;
            state.currentChips += score; 
            state.statusMessage = `You win! (${playerScore} vs ${dealerScore}) Scored ${score} Chips!`;
            addToLog(state.statusMessage, 'text-green-300');
        } else if (playerScore === dealerScore) { // Push
            const score = calculateRoguelikeScore();
            const halfScore = Math.floor(score / 2); 
            state.lastScore = halfScore;
            state.currentChips += halfScore; 
            state.statusMessage = `Push! (${playerScore} vs ${dealerScore}) Scored ${halfScore} Chips (Half Points)!`;
            addToLog(state.statusMessage, 'text-yellow-300');
        } else { // Player loses showdown
            state.statusMessage = `You lost. (${playerScore} vs ${dealerScore})`;
            addToLog(state.statusMessage, 'text-red-400');
            state.lastScore = 0;
        }
    
    } else if (result === 'push') { 
        // This case is technically now handled by 'showdown', but we keep it as a fallback
        const score = calculateRoguelikeScore();
        const halfScore = Math.floor(score / 2); 
        state.lastScore = halfScore;
        state.currentChips += halfScore;
        state.statusMessage = `Push! You scored ${halfScore} Chips (Half Points)!`;
        addToLog(state.statusMessage, 'text-yellow-300');
    
    } else { // 'lose' (This now correctly only handles player busts)
        state.statusMessage = `You lost the hand. (Bust)`; 
        addToLog(state.statusMessage, 'text-red-400');
        state.lastScore = 0;
    }
    
    // Decrement hand *after* all scoring
    state.currentHandsLeft--;
    
    // Let the results UI handle the next step
    renderRoguelikeResultsUI(); //
}

function evaluateRoguelikeHand(hand) {
    // --- Get Ranks (Values) and sort them by their actual poker order ---
    const ranks = hand.map(c => VALUES.indexOf(c.value)).sort((a, b) => a - b);
    const weights = hand.map(c => c.weight).sort((a, b) => a - b);
    const suits = hand.map(c => c.suit);
    
    let isStraight = false;
    let isFlush = false;
    let isStraightFlush = false;

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
    }

    // --- Original logic for pairs, kinds, and Ace teams (works on any hand size) ---
    const counts = {};
    let aceCount = 0;
    let initialValue = 0;

    hand.forEach(card => {
        counts[card.value] = (counts[card.value] || 0) + 1; // Use card.value
        initialValue += card.weight;
        if (card.value === 'A') aceCount++;
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

    // --- New return object with all checks ---
    return {
        pairs: pairs,
        isTwoPair: pairs === 2,
        isThreeOfAKind: isThreeOfAKind,
        isFourOfAKind: isFourOfAKind,
        isTeamOfAce: isTeamOfAce,
        isStraight: isStraight,
        isFlush: isFlush,
        isFullHouse: isFullHouse,
        isStraightFlush: isStraightFlush
    };
}

function getPokerHandBonus(hand) {
    const pokerRank = evaluateRoguelikeHand(hand);
    let bonus = 0;
    
    // Assign bonus points based on the rank
    if (pokerRank.isStraightFlush) bonus = 30;
    else if (pokerRank.isFourOfAKind) bonus = 20;
    else if (pokerRank.isFullHouse) bonus = 12;
    else if (pokerRank.isFlush) bonus = 10;
    else if (pokerRank.isStraight) bonus = 8;
    else if (pokerRank.isThreeOfAKind) bonus = 6;
    else if (pokerRank.isTwoPair) bonus = 4;
    else if (pokerRank.pairs === 1) bonus = 2;
    
    // NEW: Apply 'High Roller's Intuition'
    if (bonus > 0 && roguelikeBlackjackState.patronSkills.includes('High Roller\'s Intuition')) {
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
    const state = roguelikeBlackjackState;
    const hand = state.playerHand;
    const score = calculateHandValue(hand);

    // 1. Calculate Base Value
    let baseChips = 0;
    const maxHandSize = state.runUpgrades.handSize + (state.patronSkills.includes('Jester\'s Gambit') ? 1 : 0);
    const isBlackjack = hand.length === 2 && score === 21;
    const is5Card = hand.length >= maxHandSize && score <= 21; // MODIFIED: Checks for Jester's Gambit

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

    // --- THIS IS THE FIX ---
    // Add the Poker Hand Bonus to the Base Chips before multipliers
    const pokerRank = evaluateRoguelikeHand(hand);
    const pokerBonus = getPokerHandBonus(hand);
    baseChips += pokerBonus;
    // --- END FIX ---

    // 2. Calculate Multiplier
    let totalMultiplier = 1 + (state.runUpgrades.baseMultiplier || 0);

    // Apply 'Ace in the Hole' (Patron Skill)
    if (state.patronSkills.includes('Ace in the Hole') && hand.some(c => c.value === 'A')) {
        baseChips += 50;
    }

    // Apply standard passives
    state.passiveModifiers.forEach(modKey => {
        const mod = BJ_PASSIVE_MODIFIERS[modKey];
        
        if (mod && mod.check && mod.check(hand, score, is5Card, isBlackjack, pokerRank)) {
            if (mod.logic) {
                const result = mod.logic(totalMultiplier, baseChips, hand, score, is5Card, isBlackjack, pokerRank);
                if (typeof result === 'number') {
                    totalMultiplier = result;
                } else if (typeof result === 'object') {
                    baseChips = result.base;
                    totalMultiplier = result.mult;
                }
            }
        }
    });

    // 3. Rounding
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
        msg = `You quit the run. Your buy-in is lost.`;
    }
    
    addToLog(msg, 'text-red-500');
    roguelikeBlackjackState.runActive = false;
    roguelikeBlackjackState.gamePhase = 'buy_in';
    renderArcaneCasino(); // Go back to main casino screen
}

function startVingtUn() {
    const state = roguelikeBlackjackState;
    
    // Check for win condition (if Ante index is out of bounds)
    if (state.currentAnteIndex >= ANTE_STRUCTURE.length) {
        roguelikeWinRun(); // Player has beaten the final ante
        return;
    }

    // Get current Vingt-un data
    const ante = ANTE_STRUCTURE[state.currentAnteIndex];
    const vingtUn = ante.vingtUns[state.currentVingtUnIndex];
    
    if (!vingtUn) {
        console.error(`Invalid Vingt-un index: ${state.currentVingtUnIndex} for Ante: ${state.currentAnteIndex}`);
        roguelikeLoseRun('Error: Invalid game state');
        return;
    }

    // Create a new deck for this Vingt-un
    state.deck = createDeck();
    shuffleDeck(state.deck);
    addToLog("A fresh deck is shuffled for this Vingt-un.", "text-gray-400");

    // Set Vingt-un state
    state.gamePhase = 'playing'; // This will trigger renderRoguelikeHandUI
    state.currentHandsLeft = vingtUn.hands + state.runUpgrades.bonusHandsPerVingtUn;
    state.currentRerollsLeft = vingtUn.rerolls + state.runUpgrades.bonusRerollsPerVingtUn;
    state.currentChips = 0; // Reset chips for the *start* of the Vingt-un
    state.lastScore = 0;
    state.vingtUnBustSafety = state.patronSkills.includes('Minor Miscalculation'); // Reset safety net

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
    
    startNextHand(); // Call the function to deal the first hand
}

/**
 * Called when a Vingt-un's chip goal is met.
 * Routes to the shop (for Petit/Grand) or to the Ante completion logic (for Patron).
 */
function completeVingtUn() {
    const state = roguelikeBlackjackState;
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


function completeAnte() {
    const state = roguelikeBlackjackState;
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
    const state = roguelikeBlackjackState;
    if (!skillKey || !PATRON_SKILLS[skillKey] || state.patronSkills.includes(skillKey)) {
        console.error("Invalid or duplicate Patron Skill selected.");
        // Don't halt the game, just proceed to the shop.
        state.gamePhase = 'shop';
        state.shopStock = generateRoguelikeShopStock();
        renderRoguelikeShop();
        return;
    }

    state.patronSkills.push(skillKey);
    addToLog(`You have acquired the Patron Skill: ${PATRON_SKILLS[skillKey].name}!`, 'text-green-400 font-bold');
    
    // After selecting the skill, go to the shop
    state.gamePhase = 'shop';
    state.shopStock = generateRoguelikeShopStock();
    renderRoguelikeShop();
}

/**
 * Ends the run, pays the player, and returns to the casino hub.
 */
function roguelikeCashOut() {
    const state = roguelikeBlackjackState;
    const ante = ANTE_STRUCTURE[state.currentAnteIndex]; // Get the Ante they just *completed*
    const goldReward = ante.cashOutReward;

    player.gold += goldReward;
    
    addToLog(`*** Run Complete! ***`, 'text-yellow-200 font-bold text-lg');
    addToLog(`You cashed out after Ante ${state.currentAnteIndex + 1} and won ${goldReward}G!`, 'text-green-400 font-bold');

    state.runActive = false;
    state.gamePhase = 'buy_in';
    updateStatsView();
    renderArcaneCasino();
}
/**
 * Called only when the final (8th) Ante is beaten.
 */
function roguelikeWinRun() {
    const state = roguelikeBlackjackState;
    const finalAnte = ANTE_STRUCTURE[ANTE_STRUCTURE.length - 1]; // Get the last Ante
    const goldReward = finalAnte.cashOutReward;
    
    player.gold += goldReward;
    
    addToLog(`*** CONGRATULATIONS! ***`, 'text-yellow-200 font-bold text-lg');
    addToLog(`You defeated all 8 Antes and won the run!`, 'text-green-400 font-bold');
    addToLog(`You are awarded the grand prize of ${goldReward}G!`, 'text-yellow-300');

    state.runActive = false;
    state.gamePhase = 'buy_in';
    updateStatsView();
    renderArcaneCasino(); //
}

/**
 * Advances to the next Ante after the cash-out prompt.
 */
function startNextAnte() {
    const state = roguelikeBlackjackState;
    state.currentAnteIndex++;
    state.currentVingtUnIndex = 0;
    
    // Apply 'Escalating Stakes' Patron Skill (for the *new* Ante)
    if (state.patronSkills.includes('Escalating Stakes')) {
        if (!state.runUpgrades.baseMultiplier) state.runUpgrades.baseMultiplier = 0;
        state.runUpgrades.baseMultiplier++;
        addToLog("'Escalating Stakes' grants you a permanent +1 Multiplier!", 'text-green-300');
    }
    
    startVingtUn(); // Start the 'Petit' of the new Ante
}

function generateRoguelikeShopStock() {
    // This is a simple generator. A better one would weight by rarity.
    const state = roguelikeBlackjackState;
    const stock = [];
    const passivePool = Object.keys(BJ_PASSIVE_MODIFIERS).filter(k => !state.passiveModifiers.includes(k));
    const consumablePool = Object.keys(BJ_CONSUMABLES);
    // --- MODIFIED: Use new upgrade keys ---
    const upgradePool = Object.keys(BJ_RUN_UPGRADES).filter(k => {
        // This is a placeholder check.
        // A real check would look at state.runUpgrades to see if a non-stackable upgrade was bought
        return true; 
    });

    // ... (rest of stock generation is unchanged) ...
    if (passivePool.length > 0) stock.push(passivePool[Math.floor(Math.random() * passivePool.length)]);
    if (passivePool.length > 1) stock.push(passivePool[Math.floor(Math.random() * passivePool.length)]);
    if (consumablePool.length > 0) stock.push(consumablePool[Math.floor(Math.random() * consumablePool.length)]);
    if (upgradePool.length > 0) stock.push(upgradePool[Math.floor(Math.random() * upgradePool.length)]);
    
    return [...new Set(stock)];
}

function buyRoguelikeTool(toolKey) {
    const state = roguelikeBlackjackState;
    let tool;
    let type;

    if (BJ_PASSIVE_MODIFIERS[toolKey]) {
        tool = BJ_PASSIVE_MODIFIERS[toolKey];
        type = 'passive';
    } else if (BJ_CONSUMABLES[toolKey]) {
        tool = BJ_CONSUMABLES[toolKey];
        type = 'consumable';
    } else if (BJ_RUN_UPGRADES[toolKey]) {
        tool = BJ_RUN_UPGRADES[toolKey];
        type = 'upgrade';
    }

    // --- THIS IS THE CHANGE ---
    if (!tool || state.currentCrookards < tool.cost) { // Check Crookards, not Chips
        addToLog("You can't afford that.", 'text-red-400');
        return;
    }

    // Check slots
    if (type === 'passive' && state.passiveModifiers.length >= state.runUpgrades.passiveSlots) {
        addToLog("Your passive slots are full.", 'text-red-400');
        return;
    }
    if (type === 'consumable' && state.consumables.length >= state.runUpgrades.consumableSlots) {
        addToLog("Your consumable slots are full.", 'text-red-400');
        return;
    }

    // Pay and add tool
    state.currentCrookards -= tool.cost; // Spend Crookards, not Chips
    
    if (type === 'passive') {
        state.passiveModifiers.push(toolKey);
    } else if (type === 'consumable') {
        state.consumables.push(toolKey);
    } else if (type === 'upgrade') {
        tool.apply(state);
        // Remove from shop stock so it can't be bought again
    }

    // Remove from shop stock
    state.shopStock = state.shopStock.filter(key => key !== toolKey);
    addToLog(`Purchased: ${tool.name}!`, 'text-green-300');
    renderRoguelikeShop(); // Re-render shop
}

function roguelikeRerollShop() {
    const state = roguelikeBlackjackState;
    const cost = state.runUpgrades.shopRerollCost;
    
    // --- THIS IS THE CHANGE ---
    if (state.currentCrookards < cost) { // Check Crookards, not Chips
        addToLog("Not enough Crookards to reroll.", 'text-red-400');
        return;
    }
    state.currentCrookards -= cost; // Spend Crookards, not Chips
    // --- END CHANGE ---

    state.shopStock = generateRoguelikeShopStock();
    renderRoguelikeShop();
}

function startNextHand() {
    const state = roguelikeBlackjackState;
    
    if (state.deck.length < 20) { // Ensure enough cards for initial deal + pool
        state.deck = createDeck();
        shuffleDeck(state.deck);
    }

    state.playerHand = [state.deck.pop(), state.deck.pop()];
    state.dealerHand = [state.deck.pop(), state.deck.pop()]; // Dealer gets 2 cards (1 hidden)
    state.sharedPool = []; // Clear old pool
    dealRoguelikePool(); // Deal 6 cards to the pool

    state.gamePhase = 'player_draft'; // Start with player's turn to draft
    state.statusMessage = 'Your turn. Draft a card or Stand.';
    state.lastScore = 0;

    renderRoguelikeGame(); // Render the new hand UI
}

// --- NEW FUNCTION: Player rerolls the pool ---
function roguelikePlayerRerollPool() {
    const state = roguelikeBlackjackState;
    if (state.gamePhase !== 'player_draft' || state.currentRerollsLeft <= 0) {
        return; // Safety check
    }

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