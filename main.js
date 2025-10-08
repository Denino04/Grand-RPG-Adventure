// --- GAME STATE ---
let player;
let currentEnemies = [];
let gameState = { currentView: 'main_menu', isPlayerTurn: true, currentBiome: null, playerIsDying: false };
let lastViewBeforeInventory = 'main_menu';
let isDebugVisible = false;
let timeOfDayIndex = 0;
let useFullPaletteRotation = false;

// Firebase variables
let db, auth, userId, app;
let firebaseInitialized = false;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- INITIALIZATION ---
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
        let firebaseConfig;
        if (typeof __firebase_config !== 'undefined' && __firebase_config) {
            firebaseConfig = JSON.parse(__firebase_config);
        } else {
            console.warn("Using fallback Firebase config. This is intended for local development.");
            firebaseConfig = fallbackFirebaseConfig;
        }
        
        if (!firebase.apps.length) {
            app = firebase.initializeApp(firebaseConfig);
        } else {
            app = firebase.app();
        }

        auth = firebase.auth();
        db = firebase.firestore();
        firebaseInitialized = true;
        console.log("Firebase Initialized. Waiting for auth state...");
        
        document.body.classList.add('logged-out'); 

        auth.onAuthStateChanged(async (user) => {
            if (user) {
                userId = user.uid;
                console.log("User is signed in with UID:", userId);
                
                document.body.classList.remove('logged-out');
                document.body.classList.add('logged-in');

                if (!user.isAnonymous) {
                    $('#user-display').textContent = `Welcome, ${user.displayName}!`;
                } else {
                     $('#user-display').textContent = `Playing as Guest`;
                }

                await updateLoadGameButtonVisibility();
            } else {
                userId = null;
                console.log("User is signed out.");
                
                document.body.classList.remove('logged-in');
                document.body.classList.add('logged-out');
                
                $('#user-display').textContent = '';
                await updateLoadGameButtonVisibility();
            }
        });

    } catch (error) {
        console.error("Firebase initialization failed:", error);
        addToLog("Could not connect to game services. Running in offline mode.", "text-red-500");
    }
}

async function signInWithGoogle() {
    if (!auth) return;
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
        await auth.signInWithPopup(provider);
    } catch (error) {
        console.error("Google Sign-In failed:", error);
        addToLog("Google Sign-In failed. Please try again.", "text-red-400");
    }
}

async function signInAnonymously() {
    if (!auth) return;
    try {
        await auth.signInAnonymously();
    } catch (error) {
        console.error("Anonymous Sign-In failed:", error);
        addToLog("Could not start a guest session.", "text-red-400");
    }
}


async function signOutUser() {
    if (!auth) return;
    try {
        await auth.signOut();
        showStartScreen(); 
    } catch (error) {
        console.error("Sign out failed:", error);
    }
}


async function initGame(playerName, gender, raceKey, classKey, backgroundKey) { 
    $('#character-creation-screen').classList.add('hidden');
    $('#start-screen').classList.add('hidden'); 
    $('#game-container').classList.remove('hidden'); 
    
    player = new Player(playerName, raceKey); 
    player.gender = gender;
    player.class = CLASSES[classKey].name;
    player.background = BACKGROUNDS[backgroundKey].name;
    player.backgroundKey = backgroundKey;
    player.totalXp = 0; 

    const classData = CLASSES[classKey];
    
    for (const stat in classData.bonusStats) {
        let statLower = stat.toLowerCase();
        if (player.hasOwnProperty(statLower)) {
            player[statLower] += classData.bonusStats[stat];
        }
    }
    
    player.inventory = { items: {}, weapons: [], catalysts: [], armor: [], shields: [], lures: {} }; 
    
    for (const itemKey in classData.startingItems) {
        player.addToInventory(itemKey, classData.startingItems[itemKey], false);
    }
    
    if (classData.startingEquipment.weapon) {
        player.addToInventory(classData.startingEquipment.weapon, 1, false);
        equipItem(classData.startingEquipment.weapon);
    }
    if (classData.startingEquipment.catalyst) {
        player.addToInventory(classData.startingEquipment.catalyst, 1, false);
        equipItem(classData.startingEquipment.catalyst);
    }
    if (classData.startingEquipment.armor) {
        player.addToInventory(classData.startingEquipment.armor, 1, false);
        equipItem(classData.startingEquipment.armor);
    }
    if (classData.startingEquipment.shield) {
        player.addToInventory(classData.startingEquipment.shield, 1, false);
        equipItem(classData.startingEquipment.shield);
    }

    player.spells = {}; 
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
    player.baseStats = { Vigor: player.vigor, Focus: player.focus, Stamina: player.stamina, Strength: player.strength, Intelligence: player.intelligence, Luck: player.luck };
    player.dialogueFlags = {};


    player.seed = Math.floor(Math.random() * 1000000);
    gameState.playerIsDying = false; 
    generateRandomizedBiomeOrder();
    generateBlackMarketStock();
    updatePlayerTier();
    addToLog(`Welcome, ${playerName} the ${player.class}! Your adventure begins.`); 
    applyTheme('default'); 
    updateStatsView(); 
    await saveGame();
    renderTownSquare(); 
}

function generateRandomizedBiomeOrder() {
    const rng = seededRandom(player.seed);

    const biomesByTier = {};
    for (const biomeKey in BIOMES) {
        const biome = BIOMES[biomeKey];
        if (!biomesByTier[biome.tier]) {
            biomesByTier[biome.tier] = [];
        }
        biomesByTier[biome.tier].push(biomeKey);
    }

    player.biomeOrder = [];
    const sortedTiers = Object.keys(biomesByTier).sort((a, b) => a - b);
    for (const tier of sortedTiers) {
        const shuffledBiomesInTier = shuffleArray(biomesByTier[tier], rng);
        player.biomeOrder.push(...shuffledBiomesInTier);
    }

    player.biomeUnlockLevels = {};
    let currentLvl = 1;
    let increment = 3;
    let step = 0;
    player.biomeOrder.forEach(biomeKey => {
        player.biomeUnlockLevels[biomeKey] = currentLvl;
        currentLvl += increment;
        step++;
        if (step === 2) {
            increment = 4;
        } else if (step === 3) {
            increment = 3;
            step = 0;
        }
    });
}

function updatePlayerTier() {
    if (!player) return;
    let maxTier = 0;
    player.biomeOrder.forEach(biomeKey => {
        const biome = BIOMES[biomeKey];
        if (player.level >= player.biomeUnlockLevels[biomeKey]) {
            maxTier = Math.max(maxTier, biome.tier);
        }
    });
    player.playerTier = maxTier || 1;
}


// --- SAVE & LOAD ---
async function saveGame(manual = false) { 
    if (!player) return; 
    const saveData = JSON.parse(JSON.stringify(player));
    
    if (!auth || !auth.currentUser || auth.currentUser.isAnonymous) {
        try {
            localStorage.setItem('rpgSaveData_local', JSON.stringify(saveData));
            if (manual) {
                addToLog('Game Saved Locally!', 'text-green-400 font-bold');
            }
        } catch (error) {
            console.error("Could not save game to localStorage:", error); 
            addToLog('Error: Could not save game locally.', 'text-red-400');
        }
        return; 
    }

    try {
        saveData.userEmail = auth.currentUser.email;
        saveData.userDisplayName = auth.currentUser.displayName;

        const charactersCollection = db.collection(`artifacts/${appId}/users/${userId}/characters`);

        if (player.firestoreId) {
            await charactersCollection.doc(player.firestoreId).set(saveData, { merge: true });
        } else {
            const docRef = await charactersCollection.add(saveData);
            player.firestoreId = docRef.id;
        }

        if (manual) { 
            addToLog('Game Saved to Cloud!', 'text-green-400 font-bold'); 
        } 
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

    const localSaveDataString = localStorage.getItem('rpgSaveData_local');
    if (localSaveDataString) {
        try {
            const charData = JSON.parse(localSaveDataString);
            hasSaves = true;
            html += `
                <div class="p-3 bg-slate-800 border-l-4 border-yellow-400 rounded-lg flex justify-between items-center">
                    <div>
                        <p class="font-bold text-yellow-300">${charData.name} <span class="text-sm font-normal text-gray-400">(Guest)</span></p>
                        <p class="text-sm text-gray-400">Level ${charData.level} ${charData.race || ''} ${charData.class || ''}</p>
                    </div>
                    <div>
                        <button onclick="loadGameFromKey('local')" class="btn btn-primary text-sm py-1 px-3">Load</button>
                        <button onclick="deleteSave('local')" class="btn btn-action text-sm py-1 px-3 ml-2">Delete</button>
                    </div>
                </div>`;
        } catch (e) {
            console.error("Error parsing local save:", e);
        }
    }

    if (db && userId) {
        try {
            const charactersCollection = db.collection(`artifacts/${appId}/users/${userId}/characters`);
            const querySnapshot = await charactersCollection.get();

            if (!querySnapshot.empty) {
                hasSaves = true;
                querySnapshot.forEach(doc => {
                    const charData = doc.data();
                    html += `
                        <div class="p-3 bg-slate-800 rounded-lg flex justify-between items-center">
                            <div>
                                <p class="font-bold text-yellow-300">${charData.name}</p>
                                <p class="text-sm text-gray-400">Level ${charData.level} ${charData.race || ''} ${charData.class || ''}</p>
                            </div>
                            <div>
                                <button onclick="loadGameFromKey('${doc.id}')" class="btn btn-primary text-sm py-1 px-3">Load</button>
                                <button onclick="deleteSave('${doc.id}')" class="btn btn-action text-sm py-1 px-3 ml-2">Delete</button>
                            </div>
                        </div>`;
                });
            }
        } catch (error) {
            console.error("Error loading characters:", error);
            html += `<p class="text-red-400">Could not load cloud characters.</p>`;
        }
    }
    
    if (!hasSaves) {
        html += `<p class="text-gray-400">No saved games found.</p>`;
    }

    html += `</div>
        <div class="text-center mt-4">
            <button onclick="showStartScreen()" class="btn btn-primary">Back</button>
        </div>
    </div>`;
    
    $('#start-screen').classList.add('hidden');
    const screenContainer = $('#changelog-screen');
    screenContainer.innerHTML = html;
    screenContainer.classList.remove('hidden');
}

async function deleteSave(docId) {
     if (docId === 'local') {
         localStorage.removeItem('rpgSaveData_local');
         addToLog("Guest save file deleted.", "text-yellow-400");
         await renderLoadMenu();
         await updateLoadGameButtonVisibility();
         return;
     }
     if (!db || !userId) return;
     try {
         await db.collection(`artifacts/${appId}/users/${userId}/characters`).doc(docId).delete();
         addToLog("Cloud save file deleted.", "text-yellow-400");
         await renderLoadMenu();
         await updateLoadGameButtonVisibility();
     } catch (error) {
         console.error("Error deleting save:", error);
     }
}

async function loadGameFromKey(docId, isImport = false) {
    let parsedData;

    if (docId === 'local') {
        const localSaveDataString = localStorage.getItem('rpgSaveData_local');
        if (localSaveDataString) {
            try {
                parsedData = JSON.parse(localSaveDataString);
            } catch (e) {
                alert("Local save file is corrupted!");
                showStartScreen();
                return;
            }
        } else {
            alert("Local save file not found!");
            showStartScreen();
            return;
        }
    } 
    else {
        if (!db || !userId) return;
        const docRef = db.collection(`artifacts/${appId}/users/${userId}/characters`).doc(docId);
        try {
            const docSnap = await docRef.get();
            if (docSnap.exists) {
                parsedData = docSnap.data();
            } else {
                alert("Save file not found in the cloud!");
                showStartScreen();
                return;
            }
        } catch (error) {
            console.error("Could not load game from cloud:", error);
            return;
        }
    }
    
    if(parsedData) {
        player = new Player("Loading...", "Human");
        Object.assign(player, parsedData);
        if(docId !== 'local') {
            player.firestoreId = docId;
        }

        if (!player.race) {
            renderRaceSelectionForOldSave(player, player.firestoreId || 'local', isImport);
            return;
        }
        if (!player.class || !player.backgroundKey) {
            renderClassBackgroundSelectionForOldSave(player, player.firestoreId || 'local', isImport);
            return;
        }
        if (player.totalXp === undefined) {
            let estimatedTotalXp = 0;
            for (let i = 1; i < player.level; i++) {
                estimatedTotalXp += Math.floor(100 * Math.pow(i, 1.5));
            }
            estimatedTotalXp += player.xp;
            player.totalXp = estimatedTotalXp;
        }
        player.recalculateLevelFromTotalXp();
        player.recalculateGrowthBonuses();
        player.hp = Math.min(parsedData.hp, player.maxHp);
        player.mp = Math.min(parsedData.mp, player.maxMp);
        const weaponKey = findKeyByName(parsedData.equippedWeapon?.name, WEAPONS) || 'fists';
        player.equippedWeapon = WEAPONS[weaponKey];
        const catalystKey = findKeyByName(parsedData.equippedCatalyst?.name, CATALYSTS) || 'no_catalyst';
        player.equippedCatalyst = CATALYSTS[catalystKey];
        const armorKey = findKeyByName(parsedData.equippedArmor?.name, ARMOR) || 'travelers_garb';
        player.equippedArmor = ARMOR[armorKey];
        const shieldKey = findKeyByName(parsedData.equippedShield?.name, SHIELDS) || 'no_shield';
        player.equippedShield = SHIELDS[shieldKey];

        $('#start-screen').classList.add('hidden');
        $('#changelog-screen').classList.add('hidden');
        $('#game-container').classList.remove('hidden');

        addToLog(`Welcome back, ${player.name}!`);
        applyTheme('default');
        updateStatsView();
        if (player.statPoints > 0) {
            setTimeout(() => renderCharacterSheet(true), 1500);
        } else {
            renderTownSquare();
        }
    }
}

async function exportSave() {
    if (!player) return;
    try {
        const saveDataString = JSON.stringify(player);
        const base64Save = btoa(saveDataString);
        await navigator.clipboard.writeText(base64Save);
        addToLog('Save data copied to clipboard!', 'text-green-400');
    } catch (error) {
        addToLog('Could not export save data.', 'text-red-400');
        console.error('Export failed:', error);
    }
}

async function importSave(saveString) {
    try {
        const jsonString = atob(saveString);
        const parsedData = JSON.parse(jsonString);

        if (!parsedData || !parsedData.name) {
            throw new Error("Invalid save data format.");
        }
        
        delete parsedData.firestoreId;
        
        player = new Player(parsedData.name || "Imported Hero", parsedData.race || "Human");
        Object.assign(player, parsedData);

        await saveGame();
        
        addToLog(`Successfully imported character: ${player.name}!`, "text-green-400");
        await loadGameFromKey(player.firestoreId, true);

    } catch (error) {
        console.error("Could not import save:", error);
        alert("Failed to import save. The key might be invalid or corrupted.");
    }
}


// --- START SCREEN & UI HELPERS ---
function showStartScreen() {
    $('#game-container').classList.add('hidden');
    $('#changelog-screen').classList.add('hidden');
    $('#character-creation-screen').classList.add('hidden');
    $('#old-save-race-selection-screen').classList.add('hidden');
    $('#start-screen').classList.remove('hidden');
    logElement.innerHTML = '';
    player = null;
    updateLoadGameButtonVisibility();
}

async function updateLoadGameButtonVisibility() {
    const localSaveExists = !!localStorage.getItem('rpgSaveData_local');
    const loadGameBtn = $('#load-game-btn');
    const graveyardBtn = $('#graveyard-btn');
    graveyardBtn.classList.toggle('hidden', true); // Hide by default

    if (!db || !userId) {
        loadGameBtn.classList.toggle('hidden', !localSaveExists);
        return;
    }
    
    try {
        const charactersSnapshot = await db.collection(`artifacts/${appId}/users/${userId}/characters`).limit(1).get();
        const showLoadBtn = !charactersSnapshot.empty || localSaveExists;
        loadGameBtn.classList.toggle('hidden', !showLoadBtn);

        const graveyardSnapshot = await db.collection(`artifacts/${appId}/public/data/graveyard`).limit(1).get();
        if(!graveyardSnapshot.empty) graveyardBtn.classList.toggle('hidden', false);
    } catch (error) {
        console.error("Could not check for saved games:", error);
        loadGameBtn.classList.toggle('hidden', !localSaveExists);
    }
}


// --- EVENT LISTENERS ---
window.addEventListener('load', async () => { 
    await initFirebase();
    
    $('#start-game-btn').addEventListener('click', renderCharacterCreation);
    $('#google-signin-btn').addEventListener('click', signInWithGoogle);
     $('#anonymous-signin-btn').addEventListener('click', signInAnonymously);
    $('#sign-out-btn').addEventListener('click', signOutUser);

    $('#import-save-btn').addEventListener('click', () => {
        const saveString = $('#import-save-input').value.trim();
        if (saveString) {
            importSave(saveString);
        }
    });

    $('#load-game-btn').addEventListener('click', renderLoadMenu); 
    $('#graveyard-btn').addEventListener('click', renderGraveyard); 
    $('#changelog-btn').addEventListener('click', renderChangelog);

    // Palette Toggle Logic
    const paletteToggle = $('#palette-toggle');
    const savedPalettePref = localStorage.getItem('rpgFullPaletteRotation');
    if (savedPalettePref === 'true') {
        paletteToggle.checked = true;
        useFullPaletteRotation = true;
    }

    paletteToggle.addEventListener('change', () => {
        useFullPaletteRotation = paletteToggle.checked;
        localStorage.setItem('rpgFullPaletteRotation', useFullPaletteRotation);
    });


    const keysPressed = new Set();
    document.addEventListener('keydown', (e) => {
        if (e.key) {
            keysPressed.add(e.key.toLowerCase());
        }
        if (keysPressed.has('d') && keysPressed.has('`')) {
            e.preventDefault();
            toggleDebug();
        }
    });

    document.addEventListener('keyup', (e) => {
        if (e.key) {
            keysPressed.delete(e.key.toLowerCase());
        }
    });

    await updateLoadGameButtonVisibility();
});

