// =============================================================================
// GLOBAL STATE & CONFIGURATION
// =============================================================================

// Firebase & Auth
let db, auth, userId, app;
let firebaseInitialized = false;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
let initialAuthCheckCompleted = false;
let lastSaveTimestamp = 0;

// Game State
let player;
let currentEnemies = [];
let lastViewBeforeInventory = 'main_menu';

let gameState = {
    currentView: 'main_menu',
    isPlayerTurn: true,
    currentBiome: null,
    playerIsDying: false,
    action: null, 
    spellToCast: null, 
    comboTarget: null, 
    comboCount: 0, 
    lastSpellElement: 'none', 
    gridWidth: 0, 
    gridHeight: 0,
    gridLayout: [], 
    gridObjects: [], 
    battleEnded: false, 
    activeDrone: null, 
    // Expedition State
    currentMap: null,       
    currentNodeId: null,    
    currentEncounterType: null,
    initialRunGold: 0
};

// System & Timers
let isDebugVisible = false;
let realTimeInterval = null;
let gardenInterval = null;
let isTutorialEnabled = true;
const IDLE_TIMEOUT_MS = 60000; 
let lastUserActivity = Date.now();
window.skillTreeOffset = { x: 0, y: 0 };
window.skillTreeZoom = 1.0;
// Fallback Config (Local Dev)
const fallbackFirebaseConfig = {
    apiKey: "AIzaSyD4exnjoWEpKGkrGeiRe4A8dvX74-tjdyk",
    authDomain: "epic-rpg-adventure.firebaseapp.com",
    projectId: "epic-rpg-adventure",
    storageBucket: "epic-rpg-adventure.appspot.com",
    messagingSenderId: "656335421665",
    appId: "1:656335421665:web:df487548cdce32e01777a0",
    measurementId: "G-11EKCNE68D"
};

// =============================================================================
// FIREBASE INITIALIZATION
// =============================================================================

async function initFirebase() {
    if (firebaseInitialized) return;

    try {
        const config = (typeof __firebase_config !== 'undefined' && __firebase_config)
            ? JSON.parse(__firebase_config)
            : fallbackFirebaseConfig;

        app = firebase.initializeApp(config);
        auth = firebase.auth();
        db = firebase.firestore();
        
        // Offline Persistence (Cache)
        try {
            await db.enablePersistence({ synchronizeTabs: true });
            console.log("Firestore Persistence enabled.");
        } catch (err) {
            console.warn(`Persistence failed: ${err.code}`);
        }

        firebaseInitialized = true;
        document.body.classList.add('logged-out');

        auth.onAuthStateChanged(async (user) => {
            userId = user ? user.uid : null;
            document.body.classList.toggle('logged-in', !!user);
            document.body.classList.toggle('logged-out', !user);
            
            const userDisplay = $('#user-display');
            if (userDisplay) {
                userDisplay.textContent = user ? (user.isAnonymous ? 'Playing as Guest' : `Welcome, ${user.displayName}!`) : '';
            }

            await updateLoadGameButtonVisibility();

            if (!initialAuthCheckCompleted) {
                initialAuthCheckCompleted = true;
                handleRouteChange(); 
            } else {
                 handleRouteChange(); 
            }
        });

    } catch (error) {
        console.error("Firebase Init Error:", error);
        addToLog("Could not connect to game services. Offline mode.", "text-red-500");
    }
}

async function signInWithProvider(provider) {
    if (!auth) return;
    try {
        await auth.signInWithPopup(provider);
    } catch (error) {
        console.error("Sign-In Error:", error);
        addToLog("Sign-In failed.", "text-red-400");
    }
}

const signInWithGoogle = () => signInWithProvider(new firebase.auth.GoogleAuthProvider());
const signInAnonymously = async () => {
    if (!auth) return;
    try {
        await auth.signInAnonymously();
    } catch (error) {
        console.error("Guest Sign-In Error:", error);
        addToLog("Could not start guest session.", "text-red-400");
    }
};

async function signOutUser() {
    if (!auth) return;
    try {
        await auth.signOut();
        window.location.hash = 'menu';
        player = null;
        cleanupIntervals();
        showStartScreen();
    } catch (error) {
        console.error("Sign Out Error:", error);
    }
}

// =============================================================================
// CORE GAME LOOP & ROUTING
// =============================================================================

function cleanupIntervals() {
    if(realTimeInterval) clearInterval(realTimeInterval);
    if(gardenInterval) clearInterval(gardenInterval);
    realTimeInterval = gardenInterval = null;
}

function handleRouteChange() {
    const route = window.location.hash || '#menu';
    const activeSaveKey = sessionStorage.getItem('activeSaveKey');

    if (route === '#game' && activeSaveKey && auth?.currentUser) {
        // Prevent double loading
        if (!player || !document.body.classList.contains('in-game')) {
             loadGameFromKey(activeSaveKey);
        } else {
            // Refresh view if already loaded
            if (gameState.currentView !== 'battle' && gameState.currentView !== 'character_sheet_levelup') {
                 renderTownSquare();
            }
        }
    } else {
        showStartScreen();
    }
}

// Helper to safely find class keys if data is messy
function findClassKeyByName_local(className) {
    if (!className || typeof CLASSES === 'undefined') return null;
    return Object.keys(CLASSES).find(key => CLASSES[key].name.toLowerCase() === className.toLowerCase());
}

async function initGame(playerName, gender, raceKey, classKey, backgroundKey, difficulty, elementalAffinity = null) {
    console.log("Initializing Game...");
    
    // Base Player Object
    player = new Player(playerName, raceKey, classKey);
    
    // Bulk Assignment
    Object.assign(player, {
        gender,
        class: CLASSES[classKey].name,
        background: BACKGROUNDS[backgroundKey].name,
        backgroundKey,
        difficulty,
        elementalAffinity,
        totalXp: 0,
        inventory: { items: {}, weapons: [], catalysts: [], armor: [], shields: [], lures: {} },
        spells: {},
        dialogueFlags: {},
        knownCookingRecipes: [],
        knownAlchemyRecipes: [],
        enchantments: {},
        biomeClears: {},
        seed: Math.floor(Math.random() * 1000000),
        killsSinceLevel4: 0,
        killsSinceLevel7: 0,
        unlocks: {
            blacksmith: false, sageTower: false, houseAvailable: false,
            blackMarket: false, enchanter: false, witchCoven: false,
            hasBlacksmithKey: false, hasTowerKey: false, barracks: false,
            arcaneCasino: false
        },
        barracksRoster: []
    });

    const classData = CLASSES[classKey];

    // Apply Class Stats
    for (const stat in classData.bonusStats) {
        const statLower = stat.toLowerCase();
        if (player.hasOwnProperty(statLower)) player[statLower] += classData.bonusStats[stat];
    }

    // Starting Gear & Spells
    for (const itemKey in classData.startingItems) player.addToInventory(itemKey, classData.startingItems[itemKey], false);
    Object.values(classData.startingEquipment).forEach(itemKey => {
        if(itemKey) {
            player.addToInventory(itemKey, 1, false);
            equipItem(itemKey);
        }
    });
    for (const spellKey in classData.startingSpells) player.spells[spellKey] = { tier: classData.startingSpells[spellKey] };

    // Class Specifics (Ranger/Magus/Cook)
    if (classData.randomLures) {
        const validLures = Object.keys(LURES).filter(k => {
            const target = MONSTER_SPECIES[LURES[k].lureTarget];
            return target && classData.randomLures.types.includes(target.class.toLowerCase());
        });
        for (let i = 0; i < classData.randomLures.count; i++) {
            if (validLures.length) player.addToInventory(validLures[Math.floor(Math.random() * validLures.length)], 1, false);
        }
    }

    if (classData.randomSpells) {
         const spells = shuffleArray([...classData.randomSpells.types]);
         for(let i = 0; i < classData.randomSpells.count; i++) {
             if (spells.length) player.spells[spells.pop()] = { tier: 1 };
         }
    }

    if (classData.randomCookingRecipes) {
        const recipes = shuffleArray([...classData.randomCookingRecipes.keys]);
        for (let i = 0; i < classData.randomCookingRecipes.count; i++) {
            if (recipes.length) player.learnRecipe(`recipe_${recipes.pop()}`, false);
        }
    }

    // Ability Link & Vitals
    player.updateAbilityReferences();
    player.hp = player.maxHp;
    player.mp = player.maxMp;
    gameState.playerIsDying = false;

    // World Gen
    generateRandomizedBiomeOrder();
    generateBlackMarketStock();
    generateBarracksRoster();
    updatePlayerTier();

    // Save & Launch
    sessionStorage.setItem('isNewGame', 'true');
    await saveGame();
    
    const saveKey = player.firestoreId || 'local';
    sessionStorage.setItem('activeSaveKey', saveKey);
    window.location.hash = 'game';
    await loadGameFromKey(saveKey);
}

// =============================================================================
// GAME LOGIC & UPDATES
// =============================================================================

function checkIdleDialogue() {
    if (player && gameState.currentView !== 'battle' && Date.now() - lastUserActivity > IDLE_TIMEOUT_MS) {
        if (player.npcAlly && player.npcAlly._getDialogue) {
            logAllyDialogueChance(player.npcAlly, 'ON_IDLE');
        }
    }
}

function resetActivityTimer() { lastUserActivity = Date.now(); }

function generateRandomizedBiomeOrder() {
    if (!player) return;
    if (!player.seed) player.seed = Math.floor(Math.random() * 1000000);
    
    const rng = seededRandom(player.seed);
    const biomesByTier = {};
    
    for (const k in BIOMES) {
        const b = BIOMES[k];
        (biomesByTier[b.tier] = biomesByTier[b.tier] || []).push(k);
    }

    player.biomeOrder = [];
    Object.keys(biomesByTier).sort((a, b) => a - b).forEach(tier => {
        player.biomeOrder.push(...shuffleArray(biomesByTier[tier], rng));
    });

    player.biomeUnlockLevels = {};
    let currentLvl = 1, increment = 3, step = 0;
    player.biomeOrder.forEach(k => {
        player.biomeUnlockLevels[k] = currentLvl;
        currentLvl += increment;
        step++;
        if (step === 2) increment = 4;
        else if (step === 3) { increment = 3; step = 0; }
    });
}

function updatePlayerTier() {
    if (!player) return;
    if (!player.biomeOrder || player.biomeOrder.length === 0) generateRandomizedBiomeOrder();
    
    let maxTier = 1;
    player.biomeOrder.forEach(k => {
        if (player.biomeUnlockLevels && player.level >= player.biomeUnlockLevels[k]) {
            maxTier = Math.max(maxTier, BIOMES[k]?.tier || 0);
        }
    });
    player.playerTier = maxTier;
}

function updateRealTimePalette() {
    if (!document.body.classList.contains('in-game') || gameState.currentView === 'battle') {
        applyTheme('default');
        return;
    }
    const hour = new Date().getHours();
    let theme = (hour >= 18 || hour < 5) ? 'midnight' : (hour >= 16 ? 'sunset' : 'noon');
    applyTheme(theme);
}

function setDifficulty(newDifficulty) {
    if (!player || player.difficulty === newDifficulty) return;
    player.difficulty = newDifficulty;
    addToLog(`Difficulty changed to <span class="font-bold">${capitalize(newDifficulty)}</span>.`, 'text-yellow-400');
    saveGame();
    updateStatsView();
    renderSettingsMenu();
}

// =============================================================================
// SAVE & LOAD SYSTEM
// =============================================================================

async function saveGame(manual = false) {
    if (!player) return;

    // Spam Protection (2s cooldown)
    const now = Date.now();
    if (now - lastSaveTimestamp < 1000) return;
    lastSaveTimestamp = now;

    // Serialize Data
    const saveData = JSON.parse(JSON.stringify(player));
    
    // Clean ephemeral data
    delete saveData.racialPassive;
    delete saveData.signatureAbilityData;
    if (saveData.npcAlly) {
        delete saveData.npcAlly.racialPassive;
        delete saveData.npcAlly.signatureAbilityData;
        // Convert objects to keys for storage
        saveData.npcAlly.equippedWeaponKey = findKeyByInstance(WEAPONS, player.npcAlly.equippedWeapon);
        saveData.npcAlly.equippedCatalystKey = findKeyByInstance(CATALYSTS, player.npcAlly.equippedCatalyst);
        saveData.npcAlly.equippedArmorKey = findKeyByInstance(ARMOR, player.npcAlly.equippedArmor);
        saveData.npcAlly.equippedShieldKey = findKeyByInstance(SHIELDS, player.npcAlly.equippedShield);
    }

    // Global State
    saveData.lastView = gameState.currentView;
    saveData.currentMap = gameState.currentMap;
    saveData.currentNodeId = gameState.currentNodeId;
    saveData.currentBiome = gameState.currentBiome;

    // Convert Player Equipment to Keys
    saveData.equippedWeaponKey = findKeyByInstance(WEAPONS, player.equippedWeapon);
    saveData.equippedCatalystKey = findKeyByInstance(CATALYSTS, player.equippedCatalyst);
    saveData.equippedArmorKey = findKeyByInstance(ARMOR, player.equippedArmor);
    saveData.equippedShieldKey = findKeyByInstance(SHIELDS, player.equippedShield);

    // 1. Local Storage (Guest)
    if (!auth?.currentUser || auth.currentUser.isAnonymous) {
        try {
            localStorage.setItem('rpgSaveData_local', JSON.stringify(saveData));
            if (manual) addToLog('Game Saved Locally!', 'text-green-400 font-bold');
        } catch (e) { console.error("Local Save Error:", e); }
        return;
    }

    // 2. Cloud Storage
    try {
        saveData.lastUpdated = firebase.firestore.FieldValue.serverTimestamp();
        const charRef = db.collection(`artifacts/${appId}/users/${userId}/characters`);

        if (player.firestoreId) {
            await charRef.doc(player.firestoreId).set(saveData, { merge: true });
        } else {
            const docRef = await charRef.add(saveData);
            player.firestoreId = docRef.id;
        }

        if (manual) addToLog('Game Saved to Cloud!', 'text-green-400 font-bold');

        // 3. Public Ghost Snapshot
        if (player.firestoreId) {
            const snapshotData = {
                name: saveData.name,
                raceKey: saveData.race,
                _classKey: saveData._classKey,
                backgroundKey: saveData.backgroundKey,
                backgroundName: saveData.background,
                level: saveData.level,
                baseGender: saveData.gender,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
                userId: userId,
                equippedWeaponKey: saveData.equippedWeaponKey,
                equippedCatalystKey: saveData.equippedCatalystKey,
                equippedArmorKey: saveData.equippedArmorKey,
                equippedShieldKey: saveData.equippedShieldKey,
                spells: saveData.spells,
                items: saveData.inventory.items
            };
            // Async fire-and-forget for ghost data
            db.collection(`artifacts/${appId}/public/data/characters`)
              .doc(player.firestoreId)
              .set(snapshotData, { merge: true })
              .catch(e => console.error("Ghost Snapshot Error:", e));
        }
    } catch (error) {
        console.error("Cloud Save Error:", error);
        addToLog('Error: Could not save game to cloud.', 'text-red-400');
    }
}

async function loadGameFromKey(docId, isImport = false) {
    console.log(`Loading Game: ${docId}`);
    let parsedData;

    try {
        if (docId === 'local') {
            const localSave = localStorage.getItem('rpgSaveData_local');
            if (!localSave) throw new Error("No local save found.");
            parsedData = JSON.parse(localSave);
        } else {
            if (!db || !userId) throw new Error("DB connection missing.");
            const doc = await db.collection(`artifacts/${appId}/users/${userId}/characters`).doc(docId).get();
            if (!doc.exists) throw new Error("Save file missing.");
            parsedData = doc.data();
        }
    } catch (e) {
        console.error("Load Error:", e);
        alert(e.message);
        sessionStorage.removeItem('activeSaveKey');
        window.location.hash = 'menu';
        return;
    }

    if (parsedData) {
        // Rehydrate Player
        player = new Player("Loading...", parsedData.race || "Human");
        player.seed = parsedData.seed || Math.floor(Math.random() * 1000000);

        // Rehydrate NPC Ally
        if (parsedData.npcAlly) {
            const ad = parsedData.npcAlly;
            const newAlly = new NpcAlly(ad.name, ad._classKey, ad.raceKey, ad.level, ad.backgroundKey, ad.background);
            Object.assign(newAlly, ad);
            newAlly.updateAbilityReferences();
            
            // Ally defaults
            newAlly.inventory = newAlly.inventory || { items: {}, size: 10, stack: 10 };
            newAlly.equipmentOrder = newAlly.equipmentOrder || [];
            newAlly.isResting = newAlly.isResting || false;
            newAlly.enchantments = newAlly.enchantments || {};

            // Ally Gear
            newAlly.equippedWeapon = WEAPONS[ad.equippedWeaponKey] || WEAPONS['fists'];
            newAlly.equippedCatalyst = CATALYSTS[ad.equippedCatalystKey] || CATALYSTS['no_catalyst'];
            newAlly.equippedArmor = ARMOR[ad.equippedArmorKey] || ARMOR['travelers_garb'];
            newAlly.equippedShield = SHIELDS[ad.equippedShieldKey] || SHIELDS['no_shield'];

            parsedData.npcAlly = newAlly;
        }

        Object.assign(player, parsedData);
        if(docId !== 'local') player.firestoreId = docId;

        // Restore Global State
        gameState.currentMap = parsedData.currentMap || null;
        gameState.currentNodeId = parsedData.currentNodeId || null;
        gameState.currentBiome = parsedData.currentBiome || null;
        const lastView = parsedData.lastView || 'town';

        // --- MIGRATION & DEFAULTS ---
        if (!player.house) player.house = { owned: false, storage: { items: {}, weapons: [], armor: [], shields: [], catalysts: [], lures: {} }, garden: [], treePlots: [] };
        ['storageTier', 'gardenTier', 'kitchenTier', 'alchemyTier', 'trainingTier'].forEach(t => { if (player.house[t] === undefined) player.house[t] = 0; });
        
        // Arrays
        player.house.garden = Array.isArray(player.house.garden) ? player.house.garden : [];
        player.house.treePlots = Array.isArray(player.house.treePlots) ? player.house.treePlots : [];
        player.knownCookingRecipes = player.knownCookingRecipes || [];
        player.knownAlchemyRecipes = player.knownAlchemyRecipes || [];
        player.enchantments = player.enchantments || {};
        player.biomeClears = player.biomeClears || {};
        player.barracksRoster = player.barracksRoster || [];
        player.equippedSkills = player.equippedSkills || [];
        player.unlockedSkills = player.unlockedSkills || ['the_root'];

        // Progression & Unlocks
        if (!player.unlocks) player.unlocks = {};
        const u = player.unlocks;
        
        // Retroactive Unlocks Logic
        if (player.level >= 5) { u.houseAvailable = true; u.blackMarket = true; }
        if (player.level >= 8) { u.barracks = true; }
        if (player.level >= 10) { u.arcaneCasino = true; }
        if (player.inventory?.items?.['blacksmith_key']) u.blacksmith = true;
        if (player.inventory?.items?.['tower_key']) u.sageTower = true;

        // Roguelike Casino State
        if (!player.roguelikeBlackjackState) {
            player.roguelikeBlackjackState = {
                runActive: false, buyIn: 500, currentAnteIndex: 0, currentVingtUnIndex: 0,
                currentCrookards: 0, passiveModifiers: [], consumables: [], patronSkills: [],
                runUpgrades: { passiveSlots: 5, consumableSlots: 2, handSize: 5, shopRerollCost: 1, bonusHandsPerVingtUn: 0, bonusRerollsPerVingtUn: 0, baseMultiplier: 0 },
                currentChips: 0, currentHandsLeft: 0, currentRerollsLeft: 0, vingtUnBustSafety: true,
                deck: [], playerHand: [], dealerHand: [], sharedPool: [], lastScore: 0,
                gamePhase: 'buy_in', statusMessage: '', shopStock: [], masterDeckList: [], discardPile: [],
                shopLockedSlots: [], shopLockCost: 2, deckAbilities: {}, cardEnhancements: {}, cardPairs: [], 
                purchasedArcana: [], conjurePackDisplay: { packKey: null, cards: [], chosenIndices: [] },
                highestAnteCleared: 0
            };
        } else {
            // Patch existing RL state
            const rl = player.roguelikeBlackjackState;
            if (rl.highestAnteCleared === undefined) rl.highestAnteCleared = rl.currentAnteIndex || 0;
            if (!rl.masterDeckList) rl.masterDeckList = [];
            if (!rl.purchasedArcana) rl.purchasedArcana = [];
            if (!rl.shopLockedSlots) rl.shopLockedSlots = [];
            if (!rl.deckAbilities) rl.deckAbilities = {};
        }
        if (!player.inventory.craftedCounts) player.inventory.craftedCounts = {}; 
        if (!player.inventory.craftedAvgValues) player.inventory.craftedAvgValues = {}; // <-- NEW
        // --- COMPLETENESS CHECKS ---
        if (!player.race) {
            renderRaceSelectionForOldSave(player, docId, isImport);
            return;
        }
        if (!player.class || !player.backgroundKey) {
            renderClassBackgroundSelectionForOldSave(player, docId, isImport);
            return;
        }
        
        // Fix Class Key
        if (!player._classKey && player.class) {
            player._classKey = findClassKeyByName_local(player.class);
        }

        // Recalculate Stats & Abilities
        player.updateAbilityReferences();
        if (player.totalXp === undefined) {
            let estXp = 0;
            for (let i = 1; i < player.level; i++) estXp += player.calculateXpToNextLevel(i);
            player.totalXp = estXp + player.xp;
        }
        player.recalculateLevelFromTotalXp();
        player.recalculateGrowthBonuses();
        if (typeof player.recalculateSkillPoints === 'function') player.recalculateSkillPoints();
        
        // --- NEW: Run skill migration once on load ---
        if (typeof player.checkSkillMigration === 'function') player.checkSkillMigration();
        // ---------------------------------------------
        
        // Clamp HP/MP
        player.hp = Math.min(player.hp, player.maxHp);
        player.mp = Math.min(player.mp, player.maxMp);

        // Sync Ally
        if (player.npcAlly) {
            player.npcAlly.calculateStats(player.level);
            player.npcAlly.hp = Math.min(player.npcAlly.hp, player.npcAlly.maxHp);
        }

        // Restore Equipment Objects from Keys
        player.equippedWeapon = WEAPONS[parsedData.equippedWeaponKey] || WEAPONS['fists'];
        player.equippedCatalyst = CATALYSTS[parsedData.equippedCatalystKey] || CATALYSTS['no_catalyst'];
        player.equippedArmor = ARMOR[parsedData.equippedArmorKey] || ARMOR['travelers_garb'];
        player.equippedShield = SHIELDS[parsedData.equippedShieldKey] || SHIELDS['no_shield'];

        // Finalize
        document.body.classList.add('in-game');
        const isNewGame = sessionStorage.getItem('isNewGame') === 'true';
        addToLog(isNewGame ? `Welcome to Cocytus, ${player.name}!` : `Welcome back, ${player.name}!`);
        if (isNewGame) sessionStorage.removeItem('isNewGame');

        requestAnimationFrame(() => {
            updateRealTimePalette();
            updateStatsView();
            if (isNewGame && isTutorialEnabled) setTimeout(() => startTutorialSequence('main_game_screen'), 500);
            else if (player.statPoints > 0) setTimeout(() => renderCharacterSheet(true), 1500);
            else routeToSavedView(lastView);
        });

    } else {
        alert("Failed to parse save data.");
        window.location.hash = 'menu';
    }
}

async function deleteSave(docId) {
    if (docId === 'local') {
        localStorage.removeItem('rpgSaveData_local');
        addToLog("Guest save deleted.", "text-yellow-400");
    } else if (db && userId) {
        try {
            await db.collection(`artifacts/${appId}/users/${userId}/characters`).doc(docId).delete();
            addToLog("Cloud save deleted.", "text-yellow-400");
            if (sessionStorage.getItem('activeSaveKey') === docId) sessionStorage.removeItem('activeSaveKey');
        } catch (e) { console.error(e); }
    }
    await renderLoadMenu();
    await updateLoadGameButtonVisibility();
}

// =============================================================================
// UI RENDERING & INPUT
// =============================================================================

async function renderLoadMenu() {
    let html = `<div class="w-full text-center"><h2 class="font-medieval text-3xl mb-4">Load Character</h2><div class="h-80 overflow-y-auto inventory-scrollbar pr-2 space-y-3">`;
    let hasSaves = false;

    const createSaveHTML = (data, key, isGuest) => `
        <div class="p-3 bg-slate-800 ${isGuest ? 'border-l-4 border-yellow-400' : ''} rounded-lg flex justify-between items-center">
            <div><p class="font-bold text-yellow-300">${data.name} ${isGuest ? '(Guest)' : ''}</p><p class="text-sm text-gray-400">Lvl ${data.level} ${data.race} ${data.class}</p></div>
            <div>
                <button onclick="sessionStorage.setItem('activeSaveKey', '${key}'); window.location.hash = 'game'; handleRouteChange();" class="btn btn-primary text-sm py-1 px-3">Load</button>
                <button onclick="deleteSave('${key}')" class="btn btn-action text-sm py-1 px-3 ml-2">Delete</button>
            </div>
        </div>`;

    const localSave = localStorage.getItem('rpgSaveData_local');
    if (localSave) {
        try {
            html += createSaveHTML(JSON.parse(localSave), 'local', true);
            hasSaves = true;
        } catch (e) {}
    }

    if (db && userId) {
        try {
            const snaps = await db.collection(`artifacts/${appId}/users/${userId}/characters`).get();
            if (!snaps.empty) {
                hasSaves = true;
                snaps.forEach(doc => html += createSaveHTML(doc.data(), doc.id, false));
            }
        } catch (e) { console.error(e); html += `<p class="text-red-400">Cloud error.</p>`; }
    }

    if (!hasSaves) html += `<p class="text-gray-400">No saves found.</p>`;
    html += `</div><div class="text-center mt-4"><button onclick="showStartScreen()" class="btn btn-primary">Back</button></div></div>`;
    
    $('#start-screen').classList.add('hidden');
    const container = $('#changelog-screen');
    container.innerHTML = html;
    container.classList.remove('hidden');
}

function showStartScreen() {
    document.body.classList.remove('in-game');
    ['#changelog-screen', '#character-creation-screen', '#old-save-race-selection-screen', '#old-save-class-background-screen'].forEach(s => {
        const el = $(s);
        if(el) el.classList.add('hidden');
    });
    
    const start = $('#start-screen');
    if(start) start.classList.remove('hidden');

    if(logElement) logElement.innerHTML = '';
    player = null;
    sessionStorage.removeItem('activeSaveKey');
    updateLoadGameButtonVisibility();
    cleanupIntervals();
    applyTheme('default');
    const btns = $('#persistent-buttons');
    if(btns) btns.classList.add('hidden');
}

async function updateLoadGameButtonVisibility() {
    const btn = $('#load-game-btn');
    const graveBtn = $('#graveyard-btn');
    if (!btn || !graveBtn) return;

    graveBtn.classList.add('hidden');
    const hasLocal = !!localStorage.getItem('rpgSaveData_local');

    if (!db || !userId) {
        btn.classList.toggle('hidden', !hasLocal);
        return;
    }

    try {
        const snaps = await db.collection(`artifacts/${appId}/users/${userId}/characters`).limit(1).get();
        btn.classList.toggle('hidden', !hasLocal && snaps.empty);

        const graveSnaps = await db.collection(`artifacts/${appId}/public/data/graveyard`).limit(1).get();
        graveBtn.classList.toggle('hidden', graveSnaps.empty);
    } catch (e) {
        btn.classList.toggle('hidden', !hasLocal);
    }
}

function handleStartScreenClicks(e) {
    const t = e.target.closest('button');
    if (!t) return;
    
    const id = t.id;
    if (id === 'google-signin-btn') signInWithGoogle();
    else if (id === 'anonymous-signin-btn') signInAnonymously();
    else if (id === 'start-game-btn') renderCharacterCreation();
    else if (id === 'load-game-btn') renderLoadMenu();
    else if (id === 'sign-out-btn') signOutUser();
    else if (id === 'graveyard-btn') renderGraveyard();
    else if (id === 'changelog-btn') renderChangelog();
    else if (id === 'import-save-btn') {
        const val = $('#import-save-input').value.trim();
        val ? importSave(val) : addToLog("Paste key first.", "text-yellow-400");
    }
}

async function importSave(saveString) {
    try {
        const json = decodeURIComponent(escape(atob(saveString)));
        const data = JSON.parse(json);
        if (!data?.name) throw new Error("Invalid data");

        delete data.firestoreId; 
        player = new Player(data.name, data.race || "Human", data._classKey);
        Object.assign(player, data);
        player.updateAbilityReferences();

        await saveGame();
        addToLog(`Imported: ${player.name}`, "text-green-400");
        const key = player.firestoreId || 'local';
        sessionStorage.setItem('activeSaveKey', key);
        window.location.hash = 'game';
    } catch (e) {
        alert("Import Failed: Key invalid.");
    }
}

async function exportSave() {
    if (!player) return;
    try {
        const str = btoa(unescape(encodeURIComponent(JSON.stringify(player))));
        const ta = document.createElement("textarea");
        ta.value = str;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        addToLog('Save Key copied to clipboard!', 'text-green-400');
    } catch (e) {
        addToLog('Export failed.', 'text-red-400');
    }
}

// =============================================================================
// EVENT LISTENERS
// =============================================================================

function setupEventListeners() {
    // UI Sounds
    document.body.addEventListener('mousedown', (e) => {
        if (e.target.closest('.btn') && typeof playSound === 'function') playSound('click');
    });
    document.body.addEventListener('mouseenter', (e) => {
        if (e.target.closest('.btn') && typeof playSound === 'function') playSound('hover');
    }, true);

    $('#start-screen').addEventListener('click', handleStartScreenClicks);

    const tutorialToggle = $('#tutorial-toggle');
    if(tutorialToggle) {
        tutorialToggle.addEventListener('change', () => {
            isTutorialEnabled = tutorialToggle.checked;
            localStorage.setItem('rpgTutorialEnabled', isTutorialEnabled);
        });
    }

    // Konami Code
    const konami = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright'];
    let kIdx = 0;
    document.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === konami[kIdx]) {
            kIdx++;
            if (kIdx === konami.length) {
                e.preventDefault();
                toggleDebug();
                kIdx = 0;
                addToLog("Dev Mode Active.", "text-purple-400");
            }
        } else kIdx = 0;
    });

    const debugSeq = ['m', 'y', 'd', 'e', 'b', 'u', 'g'];
    let dIdx = 0;
    document.addEventListener('keydown', (e) => {
        // Ignore inputs if typing in an input field (optional safety, but good practice)
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        if (e.key.toLowerCase() === debugSeq[dIdx]) {
            dIdx++;
            if (dIdx === debugSeq.length) {
                e.preventDefault();
                toggleDebug();
                dIdx = 0;
                addToLog("Dev Mode Active.", "text-purple-400");
            }
        } else {
            // Reset, but checking if the "wrong" key was actually the start of "debug" (d)
            dIdx = (e.key.toLowerCase() === 'd') ? 1 : 0;
        }
    });

    // Mobile Corner Code (TL, TR, BL, BR)
    const corners = ['tl', 'tr', 'bl', 'br'];
    let cIdx = 0;
    const cSize = 100;
    document.addEventListener('touchstart', (e) => {
        if (e.touches.length !== 1) { cIdx = 0; return; }
        const t = e.touches[0];
        const w = window.innerWidth, h = window.innerHeight;
        let hit = '';

        if (t.clientY < cSize) hit = t.clientX < cSize ? 'tl' : (t.clientX > w - cSize ? 'tr' : '');
        else if (t.clientY > h - cSize) hit = t.clientX < cSize ? 'bl' : (t.clientX > w - cSize ? 'br' : '');

        if (hit === corners[cIdx]) {
            cIdx++;
            if (cIdx === corners.length) {
                e.preventDefault();
                toggleDebug();
                cIdx = 0;
                addToLog("Dev Mode Active (Mobile).", "text-purple-400");
            }
        } else cIdx = 0;
    }, { passive: false });
}

window.addEventListener('load', async () => {
    initUIElements();
    await initFirebase();

    if (!realTimeInterval) realTimeInterval = setInterval(updateRealTimePalette, 60000);
    if (!gardenInterval) gardenInterval = setInterval(updateGarden, 1000);
    setInterval(checkIdleDialogue, 15000);
    window.addEventListener('hashchange', handleRouteChange);

    const savedTut = localStorage.getItem('rpgTutorialEnabled');
    isTutorialEnabled = savedTut !== 'false';
    const toggle = $('#tutorial-toggle');
    if(toggle) toggle.checked = isTutorialEnabled;

    setupEventListeners();
    setupSkillTreeDoubleTap();
    
    document.addEventListener('mousemove', resetActivityTimer, { passive: true });
    document.addEventListener('keydown', resetActivityTimer, { passive: true });
    document.addEventListener('mousedown', resetActivityTimer, { passive: true });
});