// --- GAME STATE ---
let player;
let currentEnemies = [];
let gameState = { currentView: 'main_menu', isPlayerTurn: true, currentBiome: null, playerIsDying: false };
let lastViewBeforeInventory = 'main_menu';
let isDebugVisible = false;
let realTimeInterval = null; 
let gardenInterval = null;
let isTutorialEnabled = true;

// Firebase variables
let db, auth, userId, app;
let firebaseInitialized = false;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
let initialAuthCheckCompleted = false; 

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
                handleRouteChange();
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
    } catch (error) {
        console.error("Anonymous Sign-In failed:", error);
        addToLog("Could not start a guest session.", "text-red-400");
    }
};

async function signOutUser() {
    if (!auth) return;
    try {
        await auth.signOut();
        window.location.hash = 'menu';
    } catch (error) {
        console.error("Sign out failed:", error);
    }
}

function handleRouteChange() {
    const route = window.location.hash || '#menu';
    const activeSaveKey = sessionStorage.getItem('activeSaveKey');

    if (route === '#game' && activeSaveKey) {
        if (!player || !document.body.classList.contains('in-game')) {
            loadGameFromKey(activeSaveKey);
        }
    } else {
        showStartScreen();
    }
}

async function initGame(playerName, gender, raceKey, classKey, backgroundKey, difficulty) { 
    player = new Player(playerName, raceKey);
    Object.assign(player, {
        gender,
        class: CLASSES[classKey].name,
        background: BACKGROUNDS[backgroundKey].name,
        backgroundKey,
        difficulty,
        totalXp: 0,
        inventory: { items: {}, weapons: [], catalysts: [], armor: [], shields: [], lures: {} },
        spells: {},
        dialogueFlags: {},
        knownCookingRecipes: [],
        knownAlchemyRecipes: [],
        seed: Math.floor(Math.random() * 1000000)
    });

    const classData = CLASSES[classKey];
    for (const stat in classData.bonusStats) {
        const statLower = stat.toLowerCase();
        if (player.hasOwnProperty(statLower)) {
            player[statLower] += classData.bonusStats[stat];
        }
    }
    
    for (const itemKey in classData.startingItems) {
        player.addToInventory(itemKey, classData.startingItems[itemKey], false);
    }
    
    Object.values(classData.startingEquipment).forEach(itemKey => {
        if(itemKey) {
            player.addToInventory(itemKey, 1, false);
            equipItem(itemKey);
        }
    });

    for (const spellKey in classData.startingSpells) {
        player.spells[spellKey] = { tier: classData.startingSpells[spellKey] };
    }
    
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
                player.addToInventory(randomLureKey, 1, false);
            }
        }
    }
    if (classData.randomSpells) {
         const availableSpells = shuffleArray([...classData.randomSpells.types]);
         for(let i = 0; i < classData.randomSpells.count; i++) {
             if (availableSpells.length > 0) {
                const spellKey = availableSpells.pop();
                player.spells[spellKey] = { tier: 1 };
             }
         }
    }

    player.hp = player.maxHp;
    player.mp = player.maxMp;
    
    gameState.playerIsDying = false; 
    generateRandomizedBiomeOrder();
    generateBlackMarketStock();
    updatePlayerTier();
    
    sessionStorage.setItem('isNewGame', 'true');
    await saveGame(); 

    const saveKey = player.firestoreId || 'local';
    sessionStorage.setItem('activeSaveKey', saveKey);
    window.location.hash = 'game';
}

function generateRandomizedBiomeOrder() {
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
}

function updatePlayerTier() {
    if (!player) return;
    let maxTier = 0;
    player.biomeOrder.forEach(biomeKey => {
        if (player.level >= player.biomeUnlockLevels[biomeKey]) {
            maxTier = Math.max(maxTier, BIOMES[biomeKey].tier);
        }
    });
    player.playerTier = maxTier || 1;
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
    if (!player) return; 
    const saveData = JSON.parse(JSON.stringify(player));
    
    if (!auth?.currentUser || auth.currentUser.isAnonymous) {
        try {
            localStorage.setItem('rpgSaveData_local', JSON.stringify(saveData));
            if (manual) addToLog('Game Saved Locally!', 'text-green-400 font-bold');
        } catch (error) {
            console.error("Could not save game to localStorage:", error); 
            addToLog('Error: Could not save game locally.', 'text-red-400');
        }
        return; 
    }

    try {
        const charactersCollection = db.collection(`artifacts/${appId}/users/${userId}/characters`);
        if (player.firestoreId) {
            await charactersCollection.doc(player.firestoreId).set(saveData, { merge: true });
        } else {
            const docRef = await charactersCollection.add(saveData);
            player.firestoreId = docRef.id;
        }
        if (manual) addToLog('Game Saved to Cloud!', 'text-green-400 font-bold'); 
    } catch (error) { 
        console.error("Could not save game to Firestore:", error); 
        addToLog('Error: Could not save game to cloud.', 'text-red-400');
    } 
}

async function renderLoadMenu() {
    let html = `<div class="w-full text-center">
        <h2 class="font-medieval text-3xl mb-4 text-center">Load Character</h2>
        <div class="h-80 overflow-y-auto inventory-scrollbar pr-2 space-y-3">`;
    let hasSaves = false;

    const createSaveHTML = (charData, key, isGuest) => `
        <div class="p-3 bg-slate-800 ${isGuest ? 'border-l-4 border-yellow-400' : ''} rounded-lg flex justify-between items-center">
            <div>
                <p class="font-bold text-yellow-300">${charData.name} ${isGuest ? '<span class="text-sm font-normal text-gray-400">(Guest)</span>' : ''}</p>
                <p class="text-sm text-gray-400">Level ${charData.level} ${charData.race || ''} ${charData.class || ''}</p>
            </div>
            <div>
                <button onclick="sessionStorage.setItem('activeSaveKey', '${key}'); window.location.hash = 'game';" class="btn btn-primary text-sm py-1 px-3">Load</button>
                <button onclick="deleteSave('${key}')" class="btn btn-action text-sm py-1 px-3 ml-2">Delete</button>
            </div>
        </div>`;

    const localSaveDataString = localStorage.getItem('rpgSaveData_local');
    if (localSaveDataString) {
        try {
            hasSaves = true;
            html += createSaveHTML(JSON.parse(localSaveDataString), 'local', true);
        } catch (e) { console.error("Error parsing local save:", e); }
    }

    if (db && userId) {
        try {
            const querySnapshot = await db.collection(`artifacts/${appId}/users/${userId}/characters`).get();
            if (!querySnapshot.empty) {
                hasSaves = true;
                querySnapshot.forEach(doc => html += createSaveHTML(doc.data(), doc.id, false));
            }
        } catch (error) {
            console.error("Error loading characters:", error);
            html += `<p class="text-red-400">Could not load cloud characters.</p>`;
        }
    }
    
    if (!hasSaves) html += `<p class="text-gray-400">No saved games found.</p>`;

    html += `</div><div class="text-center mt-4"><button onclick="showStartScreen()" class="btn btn-primary">Back</button></div></div>`;
    
    $('#start-screen').classList.add('hidden');
    const screenContainer = $('#changelog-screen');
    screenContainer.innerHTML = html;
    screenContainer.classList.remove('hidden');
}

async function deleteSave(docId) {
     if (docId === 'local') {
         localStorage.removeItem('rpgSaveData_local');
         addToLog("Guest save file deleted.", "text-yellow-400");
     } else if (db && userId) {
         try {
             await db.collection(`artifacts/${appId}/users/${userId}/characters`).doc(docId).delete();
             addToLog("Cloud save file deleted.", "text-yellow-400");
     } catch (error) { console.error("Error deleting save:", error); }
     }
     await renderLoadMenu();
     await updateLoadGameButtonVisibility();
}

async function loadGameFromKey(docId, isImport = false) {
    let parsedData;
    try {
        if (docId === 'local') {
            const localSave = localStorage.getItem('rpgSaveData_local');
            if (!localSave) throw new Error("Local save file not found!");
            parsedData = JSON.parse(localSave);
        } else {
            if (!db || !userId) return;
            const docSnap = await db.collection(`artifacts/${appId}/users/${userId}/characters`).doc(docId).get();
            if (!docSnap.exists) throw new Error("Save file not found in the cloud!");
            parsedData = docSnap.data();
        }
    } catch (e) {
        alert(e.message);
        window.location.hash = 'menu';
        return;
    }
    
    if (parsedData) {
        player = new Player("Loading...", "Human");
        Object.assign(player, parsedData);
        if(docId !== 'local') player.firestoreId = docId;
        
        // --- DATA MIGRATION & DEFAULTS ---
        if (!player.house) player.house = { owned: false, storage: {}, garden: [] };
        ['storageTier', 'gardenTier', 'kitchenTier', 'alchemyTier', 'trainingTier'].forEach(tier => {
            if (player.house[tier] === undefined) player.house[tier] = 0;
        });
        if (!Array.isArray(player.house.garden)) player.house.garden = [];
        if (!player.difficulty) player.difficulty = 'hardcore';
        if (!player.knownCookingRecipes) player.knownCookingRecipes = [];
        if (!player.knownAlchemyRecipes) player.knownAlchemyRecipes = [];
        if (!player.seed) player.seed = Math.floor(Math.random() * 1000000);

        // --- CHARACTER COMPLETION CHECKS ---
        if (!player.race) {
            renderRaceSelectionForOldSave(player, player.firestoreId || 'local', isImport);
            return;
        }
        if (!player.class || !player.backgroundKey) {
            renderClassBackgroundSelectionForOldSave(player, player.firestoreId || 'local', isImport);
            return;
        }

        // --- STAT RECALCULATION ---
        if (player.totalXp === undefined) {
            let estimatedTotalXp = 0;
            for (let i = 1; i < player.level; i++) estimatedTotalXp += Math.floor(100 * Math.pow(i, 1.5));
            player.totalXp = estimatedTotalXp + player.xp;
        }
        player.recalculateLevelFromTotalXp();
        player.recalculateGrowthBonuses();
        player.hp = Math.min(parsedData.hp, player.maxHp);
        player.mp = Math.min(parsedData.mp, player.maxMp);

        // --- EQUIPMENT RE-ASSIGNMENT ---
        player.equippedWeapon = WEAPONS[findKeyByName(parsedData.equippedWeapon?.name, WEAPONS)] || WEAPONS['fists'];
        player.equippedCatalyst = CATALYSTS[findKeyByName(parsedData.equippedCatalyst?.name, CATALYSTS)] || CATALYSTS['no_catalyst'];
        player.equippedArmor = ARMOR[findKeyByName(parsedData.equippedArmor?.name, ARMOR)] || ARMOR['travelers_garb'];
        player.equippedShield = SHIELDS[findKeyByName(parsedData.equippedShield?.name, SHIELDS)] || SHIELDS['no_shield'];

        document.body.classList.add('in-game');
        
        const isNewGame = sessionStorage.getItem('isNewGame') === 'true';
        if (isNewGame) {
            addToLog(`Welcome to Cocytus, ${player.name}!`);
            sessionStorage.removeItem('isNewGame'); // Clear the flag
        } else {
            addToLog(`Welcome back, ${player.name}!`);
        }
        
        requestAnimationFrame(() => {
            updateRealTimePalette();
            updateStatsView();

            if (isNewGame && isTutorialEnabled) {
                setTimeout(() => startTutorialSequence('main_game_screen'), 500);
            } else if (player.statPoints > 0) {
                setTimeout(() => renderCharacterSheet(true), 1500);
            } else {
                renderTownSquare();
            }
        });
    }
}

async function exportSave() {
    if (!player) return;
    try {
        const saveDataString = JSON.stringify(player);
        const base64Save = btoa(unescape(encodeURIComponent(saveDataString)));
        await navigator.clipboard.writeText(base64Save);
        addToLog('Save data copied to clipboard!', 'text-green-400');
    } catch (error) {
        addToLog('Could not export save data.', 'text-red-400');
        console.error('Export failed:', error);
    }
}

async function importSave(saveString) {
    try {
        const jsonString = decodeURIComponent(escape(atob(saveString)));
        const parsedData = JSON.parse(jsonString);
        if (!parsedData?.name) throw new Error("Invalid save data format.");
        
        delete parsedData.firestoreId;
        player = new Player(parsedData.name, parsedData.race || "Human");
        Object.assign(player, parsedData);

        await saveGame();
        
        addToLog(`Successfully imported character: ${player.name}!`, "text-green-400");
        const saveKey = player.firestoreId || 'local';
        sessionStorage.setItem('activeSaveKey', saveKey);
        window.location.hash = 'game';
    } catch (error) {
        console.error("Could not import save:", error);
        alert("Failed to import save. The key might be invalid or corrupted.");
    }
}

function showStartScreen() {
    document.body.classList.remove('in-game');
    ['#changelog-screen', '#character-creation-screen', '#old-save-race-selection-screen', '#old-save-class-background-screen'].forEach(s => $(s).classList.add('hidden'));
    $('#start-screen').classList.remove('hidden');
    
    logElement.innerHTML = '';
    player = null;
    sessionStorage.removeItem('activeSaveKey');
    updateLoadGameButtonVisibility();
    if(realTimeInterval) clearInterval(realTimeInterval);
    if(gardenInterval) clearInterval(gardenInterval);
    realTimeInterval = gardenInterval = null;
    applyTheme('default');
}

async function updateLoadGameButtonVisibility() {
    const localSaveExists = !!localStorage.getItem('rpgSaveData_local');
    const loadGameBtn = $('#load-game-btn');
    const graveyardBtn = $('#graveyard-btn');
    graveyardBtn.classList.add('hidden'); 

    if (!db || !userId) {
        loadGameBtn.classList.toggle('hidden', !localSaveExists);
        return;
    }
    
    try {
        const charactersSnapshot = await db.collection(`artifacts/${appId}/users/${userId}/characters`).limit(1).get();
        loadGameBtn.classList.toggle('hidden', charactersSnapshot.empty && !localSaveExists);

        const graveyardSnapshot = await db.collection(`artifacts/${appId}/public/data/graveyard`).limit(1).get();
        graveyardBtn.classList.toggle('hidden', graveyardSnapshot.empty);
    } catch (error) {
        console.error("Could not check for saved games:", error);
        loadGameBtn.classList.toggle('hidden', !localSaveExists);
    }
}

// Event delegation for the start screen
function handleStartScreenClicks(event) {
    const target = event.target.closest('button');
    if (!target) return;

    const id = target.id;
    if (id === 'google-signin-btn') signInWithGoogle();
    else if (id === 'anonymous-signin-btn') signInAnonymously();
    else if (id === 'start-game-btn') renderCharacterCreation();
    else if (id === 'load-game-btn') renderLoadMenu();
    else if (id === 'sign-out-btn') signOutUser();
    else if (id === 'import-save-btn') {
        const saveString = $('#import-save-input').value.trim();
        if (saveString) importSave(saveString);
    }
    else if (id === 'graveyard-btn') renderGraveyard();
    else if (id === 'changelog-btn') renderChangelog();
}


function setupEventListeners() {
    $('#start-screen').addEventListener('click', handleStartScreenClicks);
    
    const tutorialToggle = $('#tutorial-toggle');
    tutorialToggle.addEventListener('change', () => {
        isTutorialEnabled = tutorialToggle.checked;
        localStorage.setItem('rpgTutorialEnabled', isTutorialEnabled);
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
    const cornerSize = 100;
    document.addEventListener('touchstart', (e) => {
        if (e.touches.length !== 1) { touchSequence = []; return; }
        const { clientX: x, clientY: y } = e.touches[0];
        const { innerWidth: w, innerHeight: h } = window;
        let corner = '';
        if (y < cornerSize) corner = x < cornerSize ? 'tl' : (x > w - cornerSize ? 'tr' : '');
        else if (y > h - cornerSize) corner = x < cornerSize ? 'bl' : (x > w - cornerSize ? 'br' : '');
        if (corner) {
            touchSequence.push(corner);
            touchSequence.splice(0, touchSequence.length - mobileCode.length);
            if (touchSequence.join(',') === mobileCode.join(',')) {
                e.preventDefault();
                toggleDebug();
                touchSequence = [];
                addToLog("Developer access granted (Mobile).", "text-purple-400");
            }
        } else { touchSequence = []; }
    }, { passive: false });
}


window.addEventListener('load', async () => { 
    initUIElements();
    await initFirebase();
    
    if (!realTimeInterval) realTimeInterval = setInterval(updateRealTimePalette, 60000); 
    if (!gardenInterval) gardenInterval = setInterval(updateGarden, 1000);
    
    window.addEventListener('hashchange', handleRouteChange);
    
    const savedTutorialPref = localStorage.getItem('rpgTutorialEnabled');
    isTutorialEnabled = savedTutorialPref !== 'false';
    $('#tutorial-toggle').checked = isTutorialEnabled;

    setupEventListeners();
});

