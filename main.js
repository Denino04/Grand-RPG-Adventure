// Firebase variables
let db, auth, userId, app;
let firebaseInitialized = false;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
let initialAuthCheckCompleted = false;

// --- GAME STATE ---
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
    // --- NEW PROPERTIES ---
    currentMap: null,       
    currentNodeId: null,    
    currentEncounterType: null,
    initialRunGold: 0 // <-- ADD THIS: Tracks gold at start of run
    // --- END NEW ---
};
let isDebugVisible = false;
let realTimeInterval = null;
let gardenInterval = null;
let isTutorialEnabled = true;
const IDLE_TIMEOUT_MS = 60000; // 60 seconds of inactivity to trigger idle dialogue
let lastUserActivity = Date.now();
// --- INITIALIZATION ---
// Fallback config for local development if not provided by the environment
const fallbackFirebaseConfig = {
    apiKey: "AIzaSyD4exnjoWEpKGkrGeiRe4A8dvX74-tjdyk",
    authDomain: "epic-rpg-adventure.firebaseapp.com",
    projectId: "epic-rpg-adventure",
    storageBucket: "epic-rpg-adventure.appspot.com",
    messagingSenderId: "656335421665",
    appId: "1:656335421665:web:df487548cdce32e01777a0",
    measurementId: "G-11EKCNE68D"
};

// ADDED: Local findClassKeyByName for loading fallback
function findClassKeyByName_local(className) {
    if (!className) return null;
    const lowerClassName = className.toLowerCase();
    // Assuming CLASSES is globally available from game_data.js
    if (typeof CLASSES === 'undefined') {
        console.error("CLASSES object not found during findClassKeyByName_local call!");
        return null;
    }
    return Object.keys(CLASSES).find(key => CLASSES[key].name.toLowerCase() === lowerClassName);
}


async function initFirebase() {
    if (firebaseInitialized) return;

    try {
        const firebaseConfig = (typeof __firebase_config !== 'undefined' && __firebase_config)
            ? JSON.parse(__firebase_config)
            : fallbackFirebaseConfig;

        // Updated to modern Firebase v9+ syntax
        app = firebase.initializeApp(firebaseConfig);
        auth = firebase.auth();
        db = firebase.firestore();
        firebaseInitialized = true;
        console.log("Firebase Initialized. Waiting for auth state...");

        document.body.classList.add('logged-out');

        auth.onAuthStateChanged(async (user) => {
            userId = user ? user.uid : null;
            console.log(user ? `User is signed in with UID: ${userId}` : "User is signed out.");

            document.body.classList.toggle('logged-in', !!user);
            document.body.classList.toggle('logged-out', !user);

            $('#user-display').textContent = user ? (user.isAnonymous ? 'Playing as Guest' : `Welcome, ${user.displayName}!`) : '';

            await updateLoadGameButtonVisibility();

            if (!initialAuthCheckCompleted) {
                initialAuthCheckCompleted = true;
                handleRouteChange(); // Handle initial route after auth check
            } else {
                 handleRouteChange(); // Also handle route change if user signs in/out later
            }
        });

    } catch (error) {
        console.error("Firebase initialization failed:", error);
        addToLog("Could not connect to game services. Running in offline mode.", "text-red-500");
    }
}


async function signInWithProvider(provider) {
    if (!auth) return;
    try {
        await auth.signInWithPopup(provider);
        // No explicit route change needed here, onAuthStateChanged will handle it
    } catch (error) {
        console.error(`${provider.providerId} Sign-In failed:`, error);
        addToLog("Sign-In failed. Please try again.", "text-red-400");
    }
}

const signInWithGoogle = () => signInWithProvider(new firebase.auth.GoogleAuthProvider());
const signInAnonymously = async () => {
    if (!auth) return;
    try {
        await auth.signInAnonymously();
         // No explicit route change needed here, onAuthStateChanged will handle it
    } catch (error) {
        console.error("Anonymous Sign-In failed:", error);
        addToLog("Could not start a guest session.", "text-red-400");
    }
};

async function signOutUser() {
    if (!auth) return;
    try {
        await auth.signOut();
        // onAuthStateChanged will trigger showStartScreen via handleRouteChange
        window.location.hash = 'menu'; // Explicitly set hash to menu
        // Ensure player object is cleared immediately on sign out
        player = null;
        if(realTimeInterval) clearInterval(realTimeInterval);
        if(gardenInterval) clearInterval(gardenInterval);
        realTimeInterval = gardenInterval = null;
        showStartScreen(); // Directly show start screen to avoid race conditions
    } catch (error) {
        console.error("Sign out failed:", error);
    }
}

function handleRouteChange() {
    console.log("Handling route change. Hash:", window.location.hash);
    const route = window.location.hash || '#menu';
    const activeSaveKey = sessionStorage.getItem('activeSaveKey');

    if (route === '#game' && activeSaveKey && auth?.currentUser) { // Ensure user is authenticated before trying to load game data associated with them
        console.log(`Route is #game, activeSaveKey found: ${activeSaveKey}. Attempting to load game.`);
        // Only load if player isn't already loaded or if body class indicates not in game yet
        if (!player || !document.body.classList.contains('in-game')) {
             loadGameFromKey(activeSaveKey);
        } else {
            console.log("Game already loaded, skipping loadGameFromKey.");
            // If game is loaded but view isn't battle, ensure town is rendered (e.g., after refresh)
            if (gameState.currentView !== 'battle' && gameState.currentView !== 'character_sheet_levelup') {
                 renderTownSquare();
            }
        }
    } else {
        console.log("Route is not #game or no activeSaveKey/user found. Showing start screen.");
        showStartScreen(); // Fallback to start screen
    }
}


async function initGame(playerName, gender, raceKey, classKey, backgroundKey, difficulty, elementalAffinity = null) {
    console.log("initGame started...");
    player = new Player(playerName, raceKey, classKey);
    Object.assign(player, {
        gender,
        class: CLASSES[classKey].name,
        background: BACKGROUNDS[backgroundKey].name,
        backgroundKey,
        difficulty,
        elementalAffinity: elementalAffinity,
        totalXp: 0,
        inventory: { items: {}, weapons: [], catalysts: [], armor: [], shields: [], lures: {} },
        spells: {},
        dialogueFlags: {},
        knownCookingRecipes: [],
        knownAlchemyRecipes: [],
        enchantments: {}, // <-- NEW: Initialize enchantments
        biomeClears: {}, // <--- NEW
        seed: Math.floor(Math.random() * 1000000),
        // --- Initialize Progression Properties ---
        killsSinceLevel4: 0,
        killsSinceLevel7: 0,
        unlocks: {
            blacksmith: false,
            sageTower: false,
            houseAvailable: false, // Starts locked
            blackMarket: false,    // Starts locked
            enchanter: false,
            witchCoven: false,
            hasBlacksmithKey: false,
            hasTowerKey: false,
            barracks: false // Barracks unlock
        },
        // --- End Initialization ---
        
        // --- NEW: Roster for Barracks ---
        barracksRoster: [],
        // --- END NEW ---
        arcaneCasino: false // Add casino unlock flag
    });
     console.log("Player object base created:", player);

    const classData = CLASSES[classKey];
    for (const stat in classData.bonusStats) {
        const statLower = stat.toLowerCase();
        if (player.hasOwnProperty(statLower)) {
            player[statLower] += classData.bonusStats[stat];
        }
    }
    console.log("Class stats applied.");

    // Add starting items (like seeds for Cook)
    for (const itemKey in classData.startingItems) {
        player.addToInventory(itemKey, classData.startingItems[itemKey], false);
    }
     console.log("Starting items added.");

    // Add starting equipment and equip it
    Object.values(classData.startingEquipment).forEach(itemKey => {
        if(itemKey) {
            player.addToInventory(itemKey, 1, false);
            equipItem(itemKey); // Equip immediately after adding
        }
    });
    console.log("Starting equipment added and equipped.");


    // Learn starting spells
    for (const spellKey in classData.startingSpells) {
        player.spells[spellKey] = { tier: classData.startingSpells[spellKey] };
    }
    console.log("Starting spells learned.");


    // Add starting random lures for Ranger/Rogue
    if (classData.randomLures) {
        const availableLures = Object.keys(LURES).filter(key => {
            const lure = LURES[key];
            if (!lure.lureTarget) return false;
            const target = MONSTER_SPECIES[lure.lureTarget];
            return target && classData.randomLures.types.includes(target.class.toLowerCase());
        });
        for (let i = 0; i < classData.randomLures.count; i++) {
            if (availableLures.length > 0) {
                const randomLureKey = availableLures[Math.floor(Math.random() * availableLures.length)];
                player.addToInventory(randomLureKey, 1, false); // Add lure uses
            }
        }
        console.log("Starting lures added.");
    }

    // Add starting random spells for Magus
    if (classData.randomSpells) {
         const availableSpells = shuffleArray([...classData.randomSpells.types]);
         for(let i = 0; i < classData.randomSpells.count; i++) {
             if (availableSpells.length > 0) {
                const spellKey = availableSpells.pop();
                player.spells[spellKey] = { tier: 1 };
             }
         }
         console.log("Starting random spells added.");
    }

    // --- NEW: Add starting random cooking recipes for Cook ---
    if (classData.randomCookingRecipes) {
        const availableRecipeKeys = shuffleArray([...classData.randomCookingRecipes.keys]);
        for (let i = 0; i < classData.randomCookingRecipes.count; i++) {
            if (availableRecipeKeys.length > 0) {
                const recipeItemKey = `recipe_${availableRecipeKeys.pop()}`; // Assuming recipe item keys follow this pattern
                player.learnRecipe(recipeItemKey, false); // Learn silently
            }
        }
         console.log("Starting recipes learned.");
    }
    // --- End New Recipe Logic ---

    // *** THIS CALL IS CRUCIAL ***
    console.log(`DEBUG initGame: Player class before updateAbilityReferences: "${player.class}"`); // Keep this log
    player.updateAbilityReferences(); // Sets signatureAbilityData using the _classKey stored in constructor
    console.log("...updateAbilityReferences finished.");


    player.hp = player.maxHp;
    player.mp = player.maxMp;

    gameState.playerIsDying = false;
    generateRandomizedBiomeOrder();
    generateBlackMarketStock();
    generateBarracksRoster(); // --- NEW: Generate initial roster ---
    updatePlayerTier();

    sessionStorage.setItem('isNewGame', 'true');
    await saveGame(); // Save initial state
    console.log("Initial save complete.");

    const saveKey = player.firestoreId || 'local';
    sessionStorage.setItem('activeSaveKey', saveKey);
    console.log(`Setting hash to #game, activeSaveKey: ${saveKey}`);
    
    // --- MODIFICATION START ---
    // Set the hash, but don't rely on the event.
    window.location.hash = 'game'; 
    
    // Directly call loadGameFromKey to ensure the flow continues
    // without relying on the hashchange event firing.
    console.log("initGame finished. Directly calling loadGameFromKey...");
    await loadGameFromKey(saveKey); 
    // --- MODIFICATION END ---
    
    // The old line "window.location.hash = 'game';" was here and has been replaced.
    console.log("initGame fully finished after loadGameFromKey.");
}
    

function checkIdleDialogue() {
    if (player && gameState.currentView !== 'battle' && Date.now() - lastUserActivity > IDLE_TIMEOUT_MS) {
        // Only trigger if an ally exists and isn't fighting
        if (player.npcAlly && player.npcAlly._getDialogue) {
            // Log dialogue if roll is successful
            logAllyDialogueChance(player.npcAlly, 'ON_IDLE');
        }
    }
}

function resetActivityTimer() {
    lastUserActivity = Date.now();
}

function generateRandomizedBiomeOrder() {
    // Make sure player exists before seeding
    if (!player || player.seed === null || player.seed === undefined || isNaN(Number(player.seed))) {
         console.warn("Player seed not available for biome order generation. Using Math.random().");
         player.seed = Math.floor(Math.random() * 1000000); // Ensure seed exists if called early
    }
    const rng = seededRandom(player.seed);


    const biomesByTier = {};
    for (const biomeKey in BIOMES) {
        const biome = BIOMES[biomeKey];
        (biomesByTier[biome.tier] = biomesByTier[biome.tier] || []).push(biomeKey);
    }

    player.biomeOrder = [];
    Object.keys(biomesByTier).sort((a, b) => a - b).forEach(tier => {
        player.biomeOrder.push(...shuffleArray(biomesByTier[tier], rng));
    });

    player.biomeUnlockLevels = {};
    let currentLvl = 1, increment = 3, step = 0;
    player.biomeOrder.forEach(biomeKey => {
        player.biomeUnlockLevels[biomeKey] = currentLvl;
        currentLvl += increment;
        step++;
        if (step === 2) increment = 4;
        else if (step === 3) { increment = 3; step = 0; }
    });
    console.log("Biome order generated:", player.biomeOrder, player.biomeUnlockLevels);
}

function updatePlayerTier() {
    if (!player) return;
    let maxTier = 0;
     // Ensure biomeOrder exists before iterating
    if (!player.biomeOrder || player.biomeOrder.length === 0) {
        console.warn("Biome order not set, generating now.");
        generateRandomizedBiomeOrder();
    }
    player.biomeOrder.forEach(biomeKey => {
        // Ensure biomeUnlockLevels exists
        if (player.biomeUnlockLevels && player.level >= player.biomeUnlockLevels[biomeKey]) {
            maxTier = Math.max(maxTier, BIOMES[biomeKey]?.tier || 0); // Add safety check for BIOMES data
        }
    });
    player.playerTier = maxTier || 1;
     console.log("Player tier updated:", player.playerTier);
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

async function saveGame(manual = false) {
    if (!player) { /* ... log ... */ return; }
    
    // Deep copy player data for saving
    const saveData = JSON.parse(JSON.stringify(player));

    // Clean up non-serializable data before saving (unchanged)
    delete saveData.racialPassive;
    delete saveData.signatureAbilityData;
    
    // --- NEW: Save necessary global state variables ---
    saveData.lastView = gameState.currentView;
    saveData.currentMap = gameState.currentMap;
    saveData.currentNodeId = gameState.currentNodeId;
    saveData.currentBiome = gameState.currentBiome;

    // --- NEW: Add keys for equipped items for robust loading ---
    saveData.equippedWeaponKey = findKeyByInstance(WEAPONS, player.equippedWeapon);
    saveData.equippedCatalystKey = findKeyByInstance(CATALYSTS, player.equippedCatalyst);
    saveData.equippedArmorKey = findKeyByInstance(ARMOR, player.equippedArmor);
    saveData.equippedShieldKey = findKeyByInstance(SHIELDS, player.equippedShield);
    // Lure is already stored by key (player.equippedLure)
    
    // --- NPC ALLY: Serialize ally equipment ---
    if (saveData.npcAlly) {
        // Clean up non-serializable data for ally
        delete saveData.npcAlly.racialPassive;
        delete saveData.npcAlly.signatureAbilityData;
        
        // Add keys for ally's equipped items
        saveData.npcAlly.equippedWeaponKey = findKeyByInstance(WEAPONS, player.npcAlly.equippedWeapon);
        saveData.npcAlly.equippedCatalystKey = findKeyByInstance(CATALYSTS, player.npcAlly.equippedCatalyst);
        saveData.npcAlly.equippedArmorKey = findKeyByInstance(ARMOR, player.npcAlly.equippedArmor);
        saveData.npcAlly.equippedShieldKey = findKeyByInstance(SHIELDS, player.npcAlly.equippedShield);
    }
    // --- END NPC ALLY ---

     console.log("Preparing save data (includes equipment keys):", saveData);


    if (!auth?.currentUser || auth.currentUser.isAnonymous) {
        try {
            localStorage.setItem('rpgSaveData_local', JSON.stringify(saveData));
            console.log("Game Saved Locally.");
            if (manual) addToLog('Game Saved Locally!', 'text-green-400 font-bold');
        } catch (error) {
            console.error("Could not save game to localStorage:", error);
            addToLog('Error: Could not save game locally.', 'text-red-400');
        }
        return;
    }

    try {
        // --- DDOS PROTECTION UPDATE START ---
        // We MUST add this field, otherwise the Security Rules will reject the save.
        saveData.lastUpdated = firebase.firestore.FieldValue.serverTimestamp();
        // --- DDOS PROTECTION UPDATE END ---

        const charactersCollection = db.collection(`artifacts/${appId}/users/${userId}/characters`);
        if (player.firestoreId) {
             console.log(`Saving to existing doc: ${player.firestoreId}`);
            await charactersCollection.doc(player.firestoreId).set(saveData, { merge: true });
        } else {
             console.log("Saving new character doc...");
            const docRef = await charactersCollection.add(saveData);
            player.firestoreId = docRef.id;
             console.log(`New character saved with ID: ${player.firestoreId}`);
        }
        console.log("Game Saved to Cloud.");
        if (manual) addToLog('Game Saved to Cloud!', 'text-green-400 font-bold');

        // --- PUBLIC GHOST SNAPSHOT UPDATE ---
        if (db && userId && !auth.currentUser.isAnonymous && player.firestoreId) {
            try {
                const snapshotData = {
                    name: saveData.name,
                    raceKey: saveData.race,
                    _classKey: saveData._classKey,
                    backgroundKey: saveData.backgroundKey,
                    backgroundName: saveData.background,
                    level: saveData.level,
                    baseGender: saveData.gender,
                    lastSaveTimestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    
                    // --- DDOS PROTECTION UPDATE START ---
                    // The 'characters' (ghosts) collection also has the rate limit rule.
                    lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
                    // --- DDOS PROTECTION UPDATE END ---
                    
                    userId: userId, 
                    equippedWeaponKey: saveData.equippedWeaponKey,
                    equippedCatalystKey: saveData.equippedCatalystKey,
                    equippedArmorKey: saveData.equippedArmorKey,
                    equippedShieldKey: saveData.equippedShieldKey,
                    spells: saveData.spells,
                    items: saveData.inventory.items
                };
                
                const publicRef = db.collection(`artifacts/${appId}/public/data/characters`).doc(player.firestoreId);
                await publicRef.set(snapshotData, { merge: true });
                console.log(`Public 'ghost' snapshot saved for ${saveData.name}.`);

            } catch (snapshotError) {
                console.error("Could not save public character snapshot:", snapshotError);
            }
        }

    } catch (error) {
        console.error("Could not save game to Firestore:", error);
        addToLog('Error: Could not save game to cloud.', 'text-red-400');
    }
}

async function renderLoadMenu() {
    console.log("Rendering Load Menu...");
    let html = `<div class="w-full text-center">
        <h2 class="font-medieval text-3xl mb-4 text-center">Load Character</h2>
        <div class="h-80 overflow-y-auto inventory-scrollbar pr-2 space-y-3">`;
    let hasSaves = false;

    // --- THIS IS THE FIX ---
    // The onclick handler is modified to manually call handleRouteChange()
    const createSaveHTML = (charData, key, isGuest) => `
        <div class="p-3 bg-slate-800 ${isGuest ? 'border-l-4 border-yellow-400' : ''} rounded-lg flex justify-between items-center">
            <div>
                <p class="font-bold text-yellow-300">${charData.name} ${isGuest ? '<span class="text-sm font-normal text-gray-400">(Guest)</span>' : ''}</p>
                <p class="text-sm text-gray-400">Level ${charData.level} ${charData.race || ''} ${charData.class || ''}</p>
            </div>
            <div>
                <button onclick="sessionStorage.setItem('activeSaveKey', '${key}'); window.location.hash = 'game'; handleRouteChange();" class="btn btn-primary text-sm py-1 px-3">Load</button>
                <button onclick="deleteSave('${key}')" class="btn btn-action text-sm py-1 px-3 ml-2">Delete</button>
            </div>
        </div>`;
    // --- END FIX ---

    // Check Local Storage (Guest Save)
    const localSaveDataString = localStorage.getItem('rpgSaveData_local');
    if (localSaveDataString) {
        try {
            console.log("Local save found.");
            hasSaves = true;
            html += createSaveHTML(JSON.parse(localSaveDataString), 'local', true);
        } catch (e) { console.error("Error parsing local save:", e); }
    } else {
        console.log("No local save found.");
    }

    // Check Firestore (Cloud Saves)
    if (db && userId) {
         console.log(`Checking Firestore for user ${userId}...`);
        try {
            const querySnapshot = await db.collection(`artifacts/${appId}/users/${userId}/characters`).get();
            if (!querySnapshot.empty) {
                console.log(`Found ${querySnapshot.size} cloud saves.`);
                hasSaves = true;
                querySnapshot.forEach(doc => html += createSaveHTML(doc.data(), doc.id, false));
            } else {
                console.log("No cloud saves found for user.");
            }
        } catch (error) {
            console.error("Error loading characters from Firestore:", error);
            html += `<p class="text-red-400">Could not load cloud characters.</p>`;
        }
    } else {
         console.log("Firestore DB or userId not available, skipping cloud save check.");
    }


    if (!hasSaves) html += `<p class="text-gray-400">No saved games found.</p>`;

    html += `</div><div class="text-center mt-4"><button onclick="showStartScreen()" class="btn btn-primary">Back</button></div></div>`;

    $('#start-screen').classList.add('hidden');
    const screenContainer = $('#changelog-screen');
    screenContainer.innerHTML = html;
    screenContainer.classList.remove('hidden');
     console.log("Load Menu rendered.");
}

async function deleteSave(docId) {
     if (docId === 'local') {
         localStorage.removeItem('rpgSaveData_local');
         addToLog("Guest save file deleted.", "text-yellow-400");
     } else if (db && userId) {
         try {
             await db.collection(`artifacts/${appId}/users/${userId}/characters`).doc(docId).delete();
             addToLog("Cloud save file deleted.", "text-yellow-400");
             // Clear active key if the deleted save was the active one
             if (sessionStorage.getItem('activeSaveKey') === docId) {
                sessionStorage.removeItem('activeSaveKey');
             }
         } catch (error) { console.error("Error deleting save:", error); }
     }
     await renderLoadMenu(); // Refresh the load menu
     await updateLoadGameButtonVisibility(); // Update button visibility on start screen
}


async function loadGameFromKey(docId, isImport = false) {
    console.log(`loadGameFromKey called with docId: ${docId}, isImport: ${isImport}`);
    let parsedData;

    try {
        if (docId === 'local') {
            console.log("Loading from local storage...");
            const localSave = localStorage.getItem('rpgSaveData_local');
            if (!localSave) throw new Error("Local save file not found!");
            parsedData = JSON.parse(localSave);
            console.log("Local data parsed.");
        } else {
            console.log(`Loading from Firestore, docId: ${docId}, userId: ${userId}`);
            if (!db || !userId) { // Added check for db/userId
                console.error("Firestore DB or userId not available for cloud load.");
                throw new Error("Cannot load cloud save - connection issue.");
            }
            const docRef = db.collection(`artifacts/${appId}/users/${userId}/characters`).doc(docId);
            const docSnap = await docRef.get(); // Changed to get specific doc
            if (!docSnap.exists) {
                console.error(`Save file ${docId} not found for user ${userId}.`);
                 sessionStorage.removeItem('activeSaveKey'); // Clear invalid key
                 window.location.hash = 'menu'; // Go back to menu
                throw new Error("Save file not found in the cloud! Returning to menu.");
            }
            parsedData = docSnap.data();
             console.log("Firestore data fetched and parsed.");
        }
    } catch (e) {
        console.error("Error loading game data:", e);
        alert(e.message); // Use alert for critical load errors
        sessionStorage.removeItem('activeSaveKey'); // Clear potentially bad key
        window.location.hash = 'menu';
        return;
    }

    if (parsedData) {
        console.log("Parsed data exists, creating player object...");
        // MODIFIED: Constructor now only needs raceKey initially
        player = new Player("Loading...", parsedData.race || "Human");
        
        // --- NPC ALLY: Re-instantiate ally object BEFORE assigning player data ---
        // This is crucial. We must rebuild the NpcAlly object from its saved data
        // because the saved data is just a plain object, not a class instance.
        if (parsedData.npcAlly) {
            console.log("Re-instantiating NpcAlly...");
            const allyData = parsedData.npcAlly;
            
            // --- THIS IS THE FIX ---
            // Pass the raceKey from the saved data, not the level
            const newAlly = new NpcAlly(allyData.name, allyData._classKey, allyData.raceKey, allyData.level, allyData.backgroundKey, allyData.background);
            // --- END FIX ---
            
            // Now, copy all saved properties *back* onto the new instance
            Object.assign(newAlly, allyData);

            // --- ADDED: Link ally's racial/class abilities ---
            newAlly.updateAbilityReferences();
            // --- END ADDED ---
            
            // --- MIGRATION (for ally) ---
            if (!newAlly.inventory) newAlly.inventory = { items: {}, size: 10, stack: 10 };
            if (!newAlly.equipmentOrder) newAlly.equipmentOrder = [];
            if (newAlly.isResting === undefined) newAlly.isResting = false; // <<< NEW
            if (!newAlly.enchantments) newAlly.enchantments = {}; // <-- NEW: Ally enchantment migration

            // --- END MIGRATION ---
            
            // Re-link equipment details from keys
            newAlly.equippedWeapon = WEAPONS[allyData.equippedWeaponKey] || WEAPONS[findKeyByName(allyData.equippedWeapon?.name, WEAPONS)] || WEAPONS['fists'];
            newAlly.equippedCatalyst = CATALYSTS[allyData.equippedCatalystKey] || CATALYSTS[findKeyByName(allyData.equippedCatalyst?.name, CATALYSTS)] || CATALYSTS['no_catalyst'];
            newAlly.equippedArmor = ARMOR[allyData.equippedArmorKey] || ARMOR[findKeyByName(allyData.equippedArmor?.name, ARMOR)] || ARMOR['travelers_garb'];
            newAlly.equippedShield = SHIELDS[allyData.equippedShieldKey] || SHIELDS[findKeyByName(allyData.equippedShield?.name, SHIELDS)] || SHIELDS['no_shield'];

            parsedData.npcAlly = newAlly; // Replace plain object with class instance
            console.log("NpcAlly re-instantiated.", parsedData.npcAlly);
        }
        // --- END NPC ALLY ---
        
        Object.assign(player, parsedData); // Load all saved data

        // --- NEW: Restore essential global state from loaded data ---
        gameState.currentMap = parsedData.currentMap || null;
        gameState.currentNodeId = parsedData.currentNodeId || null;
        gameState.currentBiome = parsedData.currentBiome || null;
        
        // --- NEW: Capture the last view key ---
        const lastView = parsedData.lastView || 'town';

        // Set firestoreId if loaded from cloud
        if(docId !== 'local') player.firestoreId = docId;

         console.log("Player object created from saved data:", player);


        // --- DATA MIGRATION & DEFAULTS ---
         console.log("Applying data migrations and defaults...");
         
         const inv = player.inventory;
         
        if (!player.house) player.house = { owned: false, storage: { items: {}, weapons: [], armor: [], shields: [], catalysts: [], lures: {} }, garden: [] }; // Added empty arrays
        ['storageTier', 'gardenTier', 'kitchenTier', 'alchemyTier', 'trainingTier'].forEach(tier => {
            if (player.house[tier] === undefined) player.house[tier] = 0;
        });
        if (player.house.alchemyTier === undefined) player.house.alchemyTier = 0;
        if (player.house.trainingTier === undefined) player.house.trainingTier = 0;
        if (!Array.isArray(player.house.garden)) player.house.garden = [];
        if (!player.house.treePlots || !Array.isArray(player.house.treePlots)) player.house.treePlots = [];
        if (!player.difficulty) player.difficulty = 'hardcore';
        if (!player.knownCookingRecipes) player.knownCookingRecipes = [];
        if (!player.knownAlchemyRecipes) player.knownAlchemyRecipes = [];
        if (!player.enchantments) player.enchantments = {}; // <-- NEW: Player enchantment migration
        if (!player.biomeClears) player.biomeClears = {}; // <--- NEW
        if (!player.seed) player.seed = Math.floor(Math.random() * 1000000);
        if (player.elementalAffinity === undefined) player.elementalAffinity = null; // Add default for old saves
        // --- NPC ALLY: Migration for Player ---
        if (player.npcAlly === undefined) player.npcAlly = null;
        if (player.encountersSinceLastPay === undefined) player.encountersSinceLastPay = 0;
        // --- NEW: Barracks Roster Migration ---
        if (player.barracksRoster === undefined) player.barracksRoster = [];
        // --- END NEW ---
        // --- END NPC ALLY ---

        // Ensure inventory structure is correct
        // --- Added Defaults for Progression ---
        if (player.killsSinceLevel4 === undefined) player.killsSinceLevel4 = 0;
        if (player.killsSinceLevel7 === undefined) player.killsSinceLevel7 = 0;
        if (!player.unlocks) { // If unlocks object doesn't exist at all
            player.unlocks = {
                blacksmith: false, sageTower: false, houseAvailable: false,
                blackMarket: false, enchanter: false, witchCoven: false,
                hasBlacksmithKey: false, hasTowerKey: false,
                barracks: false // --- NPC ALLY ---
            };
        } else { // Check individual flags if object exists
            if (player.unlocks.blacksmith === undefined) player.unlocks.blacksmith = false;
            if (player.unlocks.sageTower === undefined) player.unlocks.sageTower = false;
            // Check house based on level for older saves
            if (player.unlocks.houseAvailable === undefined) player.unlocks.houseAvailable = player.level >= 5;
            // Check black market based on level for older saves
            if (player.unlocks.blackMarket === undefined) player.unlocks.blackMarket = player.level >= 5;
            if (player.unlocks.enchanter === undefined) player.unlocks.enchanter = false;
            if (player.unlocks.witchCoven === undefined) player.unlocks.witchCoven = false;
            // Infer key possession from inventory for older saves
            if (player.unlocks.hasBlacksmithKey === undefined) player.unlocks.hasBlacksmithKey = !!player.inventory?.items?.['blacksmith_key'];
            if (player.unlocks.hasTowerKey === undefined) player.unlocks.hasTowerKey = !!player.inventory?.items?.['tower_key'];
            // --- NPC ALLY: Barracks migration ---
            if (player.unlocks.barracks === undefined) player.unlocks.barracks = (player.level >= 8);
            if (player.lastCasinoBet === undefined) player.lastCasinoBet = 10; // <-- NEW
            if (player.lastCasinoAnte === undefined) player.lastCasinoAnte = 10; // <-- NEW

            // --- NEW: Add roguelike state for old saves ---
            if (!player.roguelikeBlackjackState) {
                console.log("Migrating old save: Adding default roguelikeBlackjackState.");
                player.roguelikeBlackjackState = {
                    runActive: false,
                    buyIn: 500,
                    currentAnteIndex: 0,
                    currentVingtUnIndex: 0,
                    currentCrookards: 0,
                    passiveModifiers: [],
                    consumables: [],
                    patronSkills: [],
                    runUpgrades: {
                        passiveSlots: 5,
                        consumableSlots: 2,
                        handSize: 5,
                        shopRerollCost: 1,
                        bonusHandsPerVingtUn: 0,
                        bonusRerollsPerVingtUn: 0,
                        baseMultiplier: 0
                    },
                    currentChips: 0,
                    currentHandsLeft: 0,
                    currentRerollsLeft: 0,
                    vingtUnBustSafety: true,
                    deck: [],
                    playerHand: [],
                    dealerHand: [],
                    sharedPool: [],
                    lastScore: 0,
                    gamePhase: 'buy_in',
                    statusMessage: '',
                    shopStock: [],
                    masterDeckList: [],
                    discardPile: [],
                    shopLockedSlots: [],
                    shopLockCost: 2,
                    deckAbilities: {},      // For deck-wide buffs like Polychrome
                    cardEnhancements: {}, // Stores ability per unique card ID
                    cardPairs: [],          // Stores pairs of unique card IDs for Lovers
                    purchasedArcana: [],    // <-- ADD THIS LINE
                    conjurePackDisplay: { packKey: null, cards: [], chosenIndices: [] }
                }
            }
            if (player.roguelikeBlackjackState.patronSkills === undefined) {
                console.log("Migrating old roguelike state: Adding missing patronSkills array.");
                player.roguelikeBlackjackState.patronSkills = [];
            }
            // --- NEW MIGRATION FOR DECK UNLOCKS ---
            if (player.roguelikeBlackjackState.highestAnteCleared === undefined) {
                // If the value doesn't exist, migrate it.
                // currentAnteIndex (0-based) is the ante they are *on*.
                // So, highestAnteCleared (number of cleared antes) should be equal to currentAnteIndex.
                player.roguelikeBlackjackState.highestAnteCleared = player.roguelikeBlackjackState.currentAnteIndex || 0;
                console.log(`Migrating old save: Set highestAnteCleared to ${player.roguelikeBlackjackState.highestAnteCleared}`);
            }
            // --- END MIGRATION ---
            if (player.roguelikeBlackjackState.masterDeckList === undefined) {
                console.log("Migrating old roguelike state: Adding missing masterDeckList array.");
                player.roguelikeBlackjackState.masterDeckList = [];
            }
            if (player.roguelikeBlackjackState.discardPile === undefined) {
                player.roguelikeBlackjackState.discardPile = [];
            }
            // --- ADD THESE LINES ---
            if (player.roguelikeBlackjackState.deckAbilities === undefined) {
                player.roguelikeBlackjackState.deckAbilities = {};
            }
            if (player.roguelikeBlackjackState.cardEnhancements === undefined) {
                player.roguelikeBlackjackState.cardEnhancements = {};
            }
            if (player.roguelikeBlackjackState.cardPairs === undefined) {
                player.roguelikeBlackjackState.cardPairs = [];
            }
            if (player.roguelikeBlackjackState.purchasedArcana === undefined) {
                console.log("Migrating old roguelike state: Adding missing purchasedArcana array.");
                player.roguelikeBlackjackState.purchasedArcana = [];
            }
            if (player.roguelikeBlackjackState.shopLockedSlots === undefined) {
                console.log("Migrating old roguelike state: Adding missing shopLockedSlots array.");
                player.roguelikeBlackjackState.shopLockedSlots = [];
            }
            if (player.roguelikeBlackjackState.shopLockCost === undefined) {
                console.log("Migrating old roguelike state: Adding default shopLockCost.");
                player.roguelikeBlackjackState.shopLockCost = 2;
            }
            // --- END ADDITION ---
            if (player.roguelikeBlackjackState.conjurePackDisplay === undefined) {
                console.log("Migrating old roguelike state: Adding missing conjurePackDisplay object.");
                player.roguelikeBlackjackState.conjurePackDisplay = { packKey: null, cards: [], chosenIndices: [] };
            }
            if (player.roguelikeBlackjackState.arcanaPackDisplay === undefined) { player.roguelikeBlackjackState.arcanaPackDisplay = null; }
            if (player.roguelikeBlackjackState.arcanaSelection === undefined) { player.roguelikeBlackjackState.arcanaSelection = null; }
            if (player.roguelikeBlackjackState.arcanaSelection === undefined) { player.roguelikeBlackjackState.arcanaSelection = null; }
            if (player.roguelikeBlackjackState.playerFinalEval === undefined) { player.roguelikeBlackjackState.playerFinalEval = null; }
            if (player.roguelikeBlackjackState.dealerFinalEval === undefined) { player.roguelikeBlackjackState.dealerFinalEval = null; }
            // --- END NEW ---
        }
        // --- ADD THESE LINES for migration ---

            // --- END ADDED LINES ---
            // --- END NPC ALLY ---
        // --- End Added ---
                // --- NEW: Retroactive Unlock Fix for saves that have 'false' ---
        // This runs *after* the initial migration, catching old saves
        if (player.level >= 5 && !player.unlocks.houseAvailable) {
            player.unlocks.houseAvailable = true;
            console.log("Retroactively unlocked House.");
        }
        if (player.level >= 5 && !player.unlocks.blackMarket) {
            player.unlocks.blackMarket = true;
            console.log("Retroactively unlocked Black Market.");
        }
        if (player.level >= 8 && !player.unlocks.barracks) {
            player.unlocks.barracks = true;
            console.log("Retroactively unlocked Barracks.");
        }
        if (player.level >= 10 && !player.unlocks.arcaneCasino) {
            player.unlocks.arcaneCasino = true;
            console.log("Retroactively unlocked Arcane Casino.");
        }
        // Check for keys, then unlock the location
        if (player.inventory?.items?.['blacksmith_key'] && !player.unlocks.blacksmith) {
            player.unlocks.blacksmith = true;
            console.log("Retroactively unlocked Blacksmith (key found).");
        }
        if (player.inventory?.items?.['tower_key'] && !player.unlocks.sageTower) {
            player.unlocks.sageTower = true;
            console.log("Retroactively unlocked Sage Tower (key found).");
        }
        // --- END NEW ---

        if (!inv.items) inv.items = {};
        if (!inv.weapons) inv.weapons = [];
        if (!inv.catalysts) inv.catalysts = [];
        if (!inv.armor) inv.armor = [];
        if (!inv.shields) inv.shields = [];
        if (!inv.lures) inv.lures = {};
         console.log("Migrations applied.");


        // --- CHARACTER COMPLETION CHECKS ---
        if (!player.race) {
            console.log("Player race missing, rendering race selection.");
            renderRaceSelectionForOldSave(player, player.firestoreId || 'local', isImport);
            return;
        }
        if (!player.class || !player.backgroundKey) {
             console.log("Player class or backgroundKey missing, rendering selection.");
            renderClassBackgroundSelectionForOldSave(player, player.firestoreId || 'local', isImport);
            return;
        }
        // Check for Elemental affinity if race is Elemental but affinity is missing
        if (player.race === 'Elementals' && !player.elementalAffinity) {
            console.log("Player is Elemental but missing affinity, rendering selection.");
            renderRaceSelectionForOldSave(player, player.firestoreId || 'local', isImport); // Re-use race screen logic for this
            return;
        }


        // --- HANDLE MISSING _classKey FOR OLD SAVES ---
        if (!player._classKey && player.class) {
            console.warn("Save data missing _classKey. Attempting to derive from player.class:", player.class);
            player._classKey = findClassKeyByName_local(player.class); // Use local helper
            if (!player._classKey) {
                console.error("Could not derive _classKey from player.class. Ability data may be missing.");
                // Optionally handle this error, maybe force class selection?
            } else {
                console.log("Derived _classKey successfully:", player._classKey);
            }
        } else if (!player.class && player._classKey) {
             // If save only has _classKey (unlikely but possible future state), set display name
             player.class = CLASSES[player._classKey]?.name || "Unknown Class";
        }


        // *** THIS CALL IS CRUCIAL ***
        console.log(`DEBUG loadGame: Player class before updateAbilityReferences: "${player.class}", _classKey: "${player._classKey}"`);
        player.updateAbilityReferences(); // Should now use the correct _classKey
        console.log("...updateAbilityReferences finished. Player signatureAbilityData:", player.signatureAbilityData ? {...player.signatureAbilityData} : null);


        // --- STAT RECALCULATION ---
        console.log("Recalculating stats...");
        if (player.totalXp === undefined) {
             console.log("Estimating total XP for older save...");
            let estimatedTotalXp = 0;
            // Use calculateXpToNextLevel for accuracy
            for (let i = 1; i < player.level; i++) estimatedTotalXp += player.calculateXpToNextLevel(i);
            player.totalXp = estimatedTotalXp + player.xp;
        }
        player.recalculateLevelFromTotalXp(); // Recalculate level JUST IN CASE XP curve changed
        player.recalculateGrowthBonuses(); // Recalculate derived stats based on loaded points
        player.hp = Math.min(parsedData.hp, player.maxHp); // Ensure HP/MP aren't above recalculated max
        player.mp = Math.min(parsedData.mp, player.maxMp);
                // --- NEW: Sync Ally Level on Load ---
        if (player.npcAlly) {
            // Get HP/MP percentages *before* recalculating stats
            const oldMaxHp = player.npcAlly.maxHp || player.maxHp; // Use player max as fallback
            const oldHp = player.npcAlly.hp;
            const oldMaxMp = player.npcAlly.maxMp || player.maxMp;
            const oldMp = player.npcAlly.mp;

            // Recalculate level and stats based on player's *current* level
            player.npcAlly.calculateStats(player.level); 
            
            // Preserve HP/MP percentage from save
            const hpPercent = (oldMaxHp > 0) ? (oldHp / oldMaxHp) : 1;
            const mpPercent = (oldMaxMp > 0) ? (oldMp / oldMaxMp) : 1;
            
            // Apply percentages to *new* max values
            player.npcAlly.hp = Math.max(1, Math.floor(player.npcAlly.maxHp * hpPercent));
            player.npcAlly.mp = Math.floor(player.npcAlly.maxMp * mpPercent);
            
            console.log(`Synced ally ${player.npcAlly.name} to Lvl ${player.npcAlly.level}.`);
        }
        // --- END NEW ---
        console.log("Stats recalculated.");

        // --- EQUIPMENT RE-ASSIGNMENT (Prioritize Key, Fallback to Name) ---
        console.log("Re-assigning equipment (using keys first)...");

        // --- THIS IS THE FIX (FOR PLAYER) ---
        player.equippedWeapon = WEAPONS[parsedData.equippedWeaponKey] || WEAPONS[findKeyByName(parsedData.equippedWeapon?.name, WEAPONS)] || WEAPONS['fists'];
        player.equippedCatalyst = CATALYSTS[parsedData.equippedCatalystKey] || CATALYSTS[findKeyByName(parsedData.equippedCatalyst?.name, CATALYSTS)] || CATALYSTS['no_catalyst'];
        player.equippedArmor = ARMOR[parsedData.equippedArmorKey] || ARMOR[findKeyByName(parsedData.equippedArmor?.name, ARMOR)] || ARMOR['travelers_garb'];
        player.equippedShield = SHIELDS[parsedData.equippedShieldKey] || SHIELDS[findKeyByName(parsedData.equippedShield?.name, SHIELDS)] || SHIELDS['no_shield'];
        // --- END FIX ---

        // Lure (already stored by key)
        player.equippedLure = parsedData.equippedLure || 'no_lure';
        console.log("Equipment re-assigned.");


        // --- Final Setup ---
        document.body.classList.add('in-game');
         console.log("Added 'in-game' class to body.");

        const isNewGame = sessionStorage.getItem('isNewGame') === 'true';
        if (isNewGame) {
            addToLog(`Welcome to Cocytus, ${player.name}!`);
            sessionStorage.removeItem('isNewGame'); // Clear the flag
        } else {
            addToLog(`Welcome back, ${player.name}!`);
        }

        // Delay rendering slightly to ensure DOM is ready
        requestAnimationFrame(() => {
            console.log("Requesting animation frame for final rendering...");
            updateRealTimePalette();
            updateStatsView();

            if (isNewGame && isTutorialEnabled) {
                setTimeout(() => startTutorialSequence('main_game_screen'), 500);
            } else if (player.statPoints > 0) {
                setTimeout(() => renderCharacterSheet(true), 1500);
            } else {
                // Route to the specific saved view
                routeToSavedView(lastView); // <-- Use the new router
            }
            console.log("loadGameFromKey finished execution.");
        });

    } else {
        console.error("Parsed data was null or undefined after loading attempt.");
        alert("Failed to load character data.");
        sessionStorage.removeItem('activeSaveKey');
        window.location.hash = 'menu';
    }
}


async function exportSave() {
    if (!player) return;
    try {
        const saveDataString = JSON.stringify(player);
        const base64Save = btoa(unescape(encodeURIComponent(saveDataString)));
        // Use document.execCommand for broader compatibility within potential iframe restrictions
        const textArea = document.createElement("textarea");
        textArea.value = base64Save;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        addToLog('Save data copied to clipboard!', 'text-green-400');
    } catch (error) {
        addToLog('Could not export save data. Try manually copying.', 'text-red-400');
        console.error('Export failed:', error);
        // Fallback: Display the key for manual copy
        const saveDataString = JSON.stringify(player);
        const base64Save = btoa(unescape(encodeURIComponent(saveDataString)));
        prompt("Could not copy automatically. Please copy this key manually:", base64Save);
    }
}


async function importSave(saveString) {
    try {
        const jsonString = decodeURIComponent(escape(atob(saveString)));
        const parsedData = JSON.parse(jsonString);
        if (!parsedData?.name) throw new Error("Invalid save data format.");

        delete parsedData.firestoreId; // Ensure we don't overwrite the ID if importing to a new account
        // Pass classKey if available in parsedData, otherwise fallback handling in loadGameFromKey will trigger
        player = new Player(parsedData.name, parsedData.race || "Human", parsedData._classKey);
        Object.assign(player, parsedData); // Load data
        player.updateAbilityReferences(); // Link abilities *after* loading data

        await saveGame(); // Save the newly imported character (will create new doc if cloud)

        addToLog(`Successfully imported character: ${player.name}! Loading game...`, "text-green-400");
        const saveKey = player.firestoreId || 'local'; // Get the *new* ID or 'local'
        sessionStorage.setItem('activeSaveKey', saveKey);
        window.location.hash = 'game'; // Trigger load via hash change
    } catch (error) {
        console.error("Could not import save:", error);
        alert("Failed to import save. The key might be invalid or corrupted.");
    }
}


function showStartScreen() {
    console.log("Showing Start Screen.");
    document.body.classList.remove('in-game');
    ['#changelog-screen', '#character-creation-screen', '#old-save-race-selection-screen', '#old-save-class-background-screen'].forEach(s => $(s)?.classList.add('hidden')); // Added safety check
    $('#start-screen')?.classList.remove('hidden'); // Added safety check

    if(logElement) logElement.innerHTML = ''; // Added safety check
    player = null; // Ensure player object is cleared
    sessionStorage.removeItem('activeSaveKey');
    updateLoadGameButtonVisibility();
    if(realTimeInterval) clearInterval(realTimeInterval);
    if(gardenInterval) clearInterval(gardenInterval);
    realTimeInterval = gardenInterval = null;
    applyTheme('default');
    // Ensure persistent buttons are hidden
    $('#persistent-buttons')?.classList.add('hidden');
}


async function updateLoadGameButtonVisibility() {
    console.log("Updating Load Game Button Visibility...");
    const localSaveExists = !!localStorage.getItem('rpgSaveData_local');
    const loadGameBtn = $('#load-game-btn');
    const graveyardBtn = $('#graveyard-btn');
     if (!loadGameBtn || !graveyardBtn) {
         console.warn("Load/Graveyard buttons not found in DOM yet.");
         return; // Exit if elements aren't ready
     }

    graveyardBtn.classList.add('hidden'); // Hide by default

    if (!db || !userId) {
        console.log("DB/userId not available, checking only local save.");
        loadGameBtn.classList.toggle('hidden', !localSaveExists);
        return; // Can't check cloud or graveyard without db/userId
    }

    try {
        // Check for character saves for the current user
        console.log(`Checking Firestore for saves for user ${userId}...`);
        const charactersSnapshot = await db.collection(`artifacts/${appId}/users/${userId}/characters`).limit(1).get();
        const cloudSaveExists = !charactersSnapshot.empty;
        console.log(`Cloud saves exist: ${cloudSaveExists}`);
        loadGameBtn.classList.toggle('hidden', !cloudSaveExists && !localSaveExists);

        // Check if the public graveyard collection has any documents
        console.log("Checking Firestore Graveyard...");
        const graveyardSnapshot = await db.collection(`artifacts/${appId}/public/data/graveyard`).limit(1).get();
        const graveyardHasEntries = !graveyardSnapshot.empty;
         console.log(`Graveyard has entries: ${graveyardHasEntries}`);
        graveyardBtn.classList.toggle('hidden', !graveyardHasEntries); // Show if not empty
    } catch (error) {
        console.error("Could not check for saved games or graveyard:", error);
        // Fallback: only show load button if local save exists
        loadGameBtn.classList.toggle('hidden', !localSaveExists);
        graveyardBtn.classList.add('hidden'); // Ensure graveyard button is hidden on error
    }
     console.log("Load Game Button Visibility updated.");
}


// Event delegation for the start screen
function handleStartScreenClicks(event) {
    const target = event.target.closest('button');
    if (!target) return;

    const id = target.id;
    console.log(`Start screen button clicked: ${id}`);
    if (id === 'google-signin-btn') signInWithGoogle();
    else if (id === 'anonymous-signin-btn') signInAnonymously();
    else if (id === 'start-game-btn') renderCharacterCreation();
    else if (id === 'load-game-btn') renderLoadMenu();
    else if (id === 'sign-out-btn') signOutUser();
    else if (id === 'import-save-btn') {
        const saveString = $('#import-save-input').value.trim();
        if (saveString) importSave(saveString);
        else addToLog("Paste your save key first.", "text-yellow-400"); // Added feedback
    }
    else if (id === 'graveyard-btn') renderGraveyard();
    else if (id === 'changelog-btn') renderChangelog();
}


function setupEventListeners() {
    // --- NEW: Global Button Sound Listeners ---
    document.body.addEventListener('mousedown', (event) => {
        // 'mousedown' feels more responsive for a "pressed" sound
        if (event.target.closest('.btn')) {
            playSound('click');
        }
    });
    
    document.body.addEventListener('mouseenter', (event) => {
        // 'mouseenter' fires only once when entering, unlike 'mouseover'
        if (event.target.closest('.btn')) {
            playSound('hover');
        }
    }, true); // Use capture phase to catch the event early
    // --- END: Global Button Sound Listeners ---

    $('#start-screen').addEventListener('click', handleStartScreenClicks);

    const tutorialToggle = $('#tutorial-toggle');
    tutorialToggle.addEventListener('change', () => {
        isTutorialEnabled = tutorialToggle.checked;
        localStorage.setItem('rpgTutorialEnabled', isTutorialEnabled);
         console.log(`Tutorial enabled set to: ${isTutorialEnabled}`);
    });

    // --- Konami Code & Mobile Debug ---
    const konamiCode = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright'];
    let keySequence = [];
    document.addEventListener('keydown', (e) => {
        if (!e.key) return;
        keySequence.push(e.key.toLowerCase());
        keySequence.splice(0, keySequence.length - konamiCode.length);
        if (keySequence.join('') === konamiCode.join('')) {
            e.preventDefault();
            toggleDebug();
            keySequence = [];
            addToLog("Developer access granted.", "text-purple-400");
        }
    });

    const mobileCode = ['tl', 'tr', 'bl', 'br'];
    let touchSequence = [];
    const cornerSize = 100; // Increased size for easier tapping
    document.addEventListener('touchstart', (e) => {
        // Only trigger if exactly one touch point
        if (e.touches.length !== 1) {
             touchSequence = []; // Reset sequence if multi-touch
             return;
        }
        const { clientX: x, clientY: y } = e.touches[0];
        const { innerWidth: w, innerHeight: h } = window;
        let corner = '';

        // Determine which corner was touched
        if (y < cornerSize) { // Top row
            if (x < cornerSize) corner = 'tl'; // Top-left
            else if (x > w - cornerSize) corner = 'tr'; // Top-right
        } else if (y > h - cornerSize) { // Bottom row
             if (x < cornerSize) corner = 'bl'; // Bottom-left
             else if (x > w - cornerSize) corner = 'br'; // Bottom-right
        }

        if (corner) {
            touchSequence.push(corner);
            // Keep only the last N touches needed for the code
            touchSequence.splice(0, touchSequence.length - mobileCode.length);
            // Check if the sequence matches
            if (touchSequence.join(',') === mobileCode.join(',')) {
                e.preventDefault(); // Prevent default touch behavior (like scrolling)
                toggleDebug();
                touchSequence = []; // Reset sequence after successful entry
                addToLog("Developer access granted (Mobile).", "text-purple-400");
            }
        } else {
             // If touch is not in a corner, reset the sequence
             touchSequence = [];
        }
    }, { passive: false }); // Need passive: false to allow preventDefault
     console.log("Event listeners set up.");
}


window.addEventListener('load', async () => {
    console.log("Window loaded.");
    initUIElements();
    await initFirebase(); // Initialize Firebase first

    // Start intervals after Firebase is ready
    if (!realTimeInterval) realTimeInterval = setInterval(updateRealTimePalette, 60000);
    if (!gardenInterval) gardenInterval = setInterval(updateGarden, 1000); // Check garden every second
    setInterval(checkIdleDialogue, 15000); // Check every 15 seconds
    window.addEventListener('hashchange', handleRouteChange); // Listen for navigation changes

    // Load tutorial preference
    const savedTutorialPref = localStorage.getItem('rpgTutorialEnabled');
    isTutorialEnabled = savedTutorialPref !== 'false'; // Default to true if not set
    $('#tutorial-toggle').checked = isTutorialEnabled;

    setupEventListeners(); // Setup button clicks, debug codes, etc.

    // Initial route handling might happen within onAuthStateChanged now,
    // but ensure it runs if auth state is already known or doesn't change quickly.
    // handleRouteChange(); // Let onAuthStateChanged handle the initial route
     console.log("Initial setup complete.");

    document.addEventListener('mousemove', resetActivityTimer, { passive: true });
    document.addEventListener('keydown', resetActivityTimer, { passive: true });
    document.addEventListener('mousedown', resetActivityTimer, { passive: true });


});
