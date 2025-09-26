// --- GAME STATE ---
let player;
let currentEnemies = [];
let gameState = { currentView: 'main_menu', isPlayerTurn: true, currentBiome: null, playerIsDying: false };
let lastViewBeforeInventory = 'main_menu';
let activeTooltipItem = null;
let isDebugVisible = false;

// --- INITIALIZATION ---
function initGame(playerName) { 
    $('#start-screen-wrapper').classList.add('hidden'); 
    $('#game-wrapper').classList.remove('hidden'); 
    player = new Player(playerName); 
    player.seed = Math.floor(Math.random() * 1000000); // Assign a random seed
    gameState.playerIsDying = false; 
    player.saveKey = generateSaveKey();
    generateRandomizedBiomeOrder();
    generateBlackMarketStock();
    updatePlayerTier();
    addToLog(`Welcome, ${playerName}! Your adventure begins.`); 
    applyTheme('default'); 
    updateStatsView(); 
    saveGame();
    renderMainMenu(); 
}

function generateRandomizedBiomeOrder() {
    // Create a seeded random number generator for this character
    const rng = seededRandom(player.seed);

    // Group biomes by tier
    const biomesByTier = {};
    for (const biomeKey in BIOMES) {
        const biome = BIOMES[biomeKey];
        if (!biomesByTier[biome.tier]) {
            biomesByTier[biome.tier] = [];
        }
        biomesByTier[biome.tier].push(biomeKey);
    }

    // Shuffle within tiers and create final order
    player.biomeOrder = [];
    const sortedTiers = Object.keys(biomesByTier).sort((a, b) => a - b);
    for (const tier of sortedTiers) {
        const shuffledBiomesInTier = shuffleArray(biomesByTier[tier], rng); // Use seeded shuffle
        player.biomeOrder.push(...shuffledBiomesInTier);
    }

    // Apply staggered level requirements
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

/**
 * Calculates and updates the player's tier based on the highest unlocked biome.
 */
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
function saveGame(manual = false) { 
    if (!player || !player.saveKey) return; 
    try { 
        const saveData = JSON.stringify(player); 
        localStorage.setItem(`rpgSaveData_${player.saveKey}`, saveData); 

        const saveKeys = JSON.parse(localStorage.getItem('rpgSaveKeys') || '[]');
        if (!saveKeys.includes(player.saveKey)) {
            saveKeys.push(player.saveKey);
            localStorage.setItem('rpgSaveKeys', JSON.stringify(saveKeys));
        }

        if (manual) { 
            addToLog('Game Saved!', 'text-green-400 font-bold'); 
        } 
    } catch (error) { 
        console.error("Could not save game:", error); 
    } 
}

function renderLoadMenu() {
    $('#start-screen-wrapper').classList.add('hidden');
    $('#game-wrapper').classList.remove('hidden');
    $('#stats-container').classList.add('hidden');
    $('#log-container').classList.add('hidden');

    const saveKeys = JSON.parse(localStorage.getItem('rpgSaveKeys') || '[]');
    let html = `<div class="w-full text-center">
        <h2 class="font-medieval text-3xl mb-4 text-center">Load Character</h2>
        <div class="h-80 overflow-y-auto inventory-scrollbar pr-2 space-y-3">`;
    
    if (saveKeys.length === 0) {
        html += `<p class="text-gray-400">No saved games found.</p>`;
    } else {
        saveKeys.forEach(key => {
            const savedData = localStorage.getItem(`rpgSaveData_${key}`);
            if (savedData) {
                const charData = JSON.parse(savedData);
                html += `
                    <div class="p-3 bg-slate-800 rounded-lg flex justify-between items-center">
                        <div>
                            <p class="font-bold text-yellow-300">${charData.name}</p>
                            <p class="text-sm text-gray-400">Level ${charData.level}</p>
                        </div>
                        <div>
                            <button onclick="loadGameFromKey('${key}')" class="btn btn-primary text-sm py-1 px-3">Load</button>
                            <button onclick="deleteSave('${key}')" class="btn btn-action text-sm py-1 px-3 ml-2">Delete</button>
                        </div>
                    </div>`;
            }
        });
    }

    html += `</div>
        <div class="text-center mt-4">
            <button onclick="showStartScreen()" class="btn btn-primary">Back</button>
        </div>
    </div>`;

    const container = document.createElement('div');
    container.innerHTML = html;
    render(container);
}

function deleteSave(saveKey) {
     const saveKeys = JSON.parse(localStorage.getItem('rpgSaveKeys') || '[]');
     const keyIndex = saveKeys.indexOf(saveKey);
     if (keyIndex > -1) {
         saveKeys.splice(keyIndex, 1);
     }
     localStorage.setItem('rpgSaveKeys', JSON.stringify(saveKeys));
     localStorage.removeItem(`rpgSaveData_${saveKey}`);
     renderLoadMenu();
     updateLoadGameButtonVisibility();
}

function loadGameFromKey(saveKey) { 
    const savedData = localStorage.getItem(`rpgSaveData_${saveKey}`); 
    if (savedData) { 
        try { 
            const parsedData = JSON.parse(savedData); 
            player = new Player(parsedData.name); 
            Object.assign(player, parsedData); 
            if (!player.legacyQuestProgress) {
                player.legacyQuestProgress = {};
            }
            if (!player.blackMarketStock) {
                player.blackMarketStock = { seasonal: [] };
                generateBlackMarketStock();
            }
            gameState.playerIsDying = false; 

            // Compatibility fix for old save files with the old quest system
            if (typeof player.activeQuest === 'string') {
                player.activeQuest = null;
                player.questProgress = 0;
            }

            // Compatibility for saves without a seed
            if (!player.seed) {
                player.seed = Math.floor(Math.random() * 1000000);
            }

            if (!player.biomeOrder || player.biomeOrder.length === 0) {
                generateRandomizedBiomeOrder();
            }
            
            updatePlayerTier(); // Calculate tier on load

            $('#start-screen-wrapper').classList.add('hidden'); 
            $('#game-wrapper').classList.remove('hidden');
            $('#stats-container').classList.remove('hidden');
            $('#log-container').classList.remove('hidden');
            addToLog(`Welcome back, ${player.name}!`); 
            applyTheme('default'); 
            updateStatsView(); 
            renderMainMenu(); 
        } catch (error) { 
            console.error("Could not load game:", error); 
            alert("Could not load game. Save data may be corrupted.");
            showStartScreen();
        } 
    } else {
        alert("Save file not found!");
        showStartScreen();
    }
}

function exportSave() {
    if (!player) return;
    try {
        const saveDataString = JSON.stringify(player);
        const base64Save = btoa(saveDataString);
        navigator.clipboard.writeText(base64Save).then(() => {
            addToLog('Save data copied to clipboard!', 'text-green-400');
        }, (err) => {
            addToLog('Failed to copy save data.', 'text-red-400');
            console.error('Could not copy text: ', err);
        });
    } catch (error) {
        addToLog('Could not export save data.', 'text-red-400');
        console.error('Export failed:', error);
    }
}

function importSave(saveString) {
    try {
        const jsonString = atob(saveString);
        const parsedData = JSON.parse(jsonString);

        if (!parsedData || !parsedData.name || !parsedData.hp) {
            throw new Error("Invalid save data format.");
        }

        player = new Player(parsedData.name);
        Object.assign(player, parsedData);
        player.saveKey = generateSaveKey(); 
        gameState.playerIsDying = false; 
        if (!player.legacyQuestProgress) {
            player.legacyQuestProgress = {};
        }

        // Compatibility fix for old save files with the old quest system
        if (typeof player.activeQuest === 'string') {
            player.activeQuest = null;
            player.questProgress = 0;
        }

        // Compatibility for saves without a seed
        if (!player.seed) {
            player.seed = Math.floor(Math.random() * 1000000);
        }

        if (!player.biomeOrder || player.biomeOrder.length === 0) {
            generateRandomizedBiomeOrder();
        }
        if (!player.specialWeaponStates) {
            player.specialWeaponStates = {};
        }

        updatePlayerTier(); // Calculate tier on import

        $('#start-screen-wrapper').classList.add('hidden');
        $('#game-wrapper').classList.remove('hidden');
        $('#stats-container').classList.remove('hidden');
        $('#log-container').classList.remove('hidden');
        logElement.innerHTML = '';
        addToLog(`Successfully imported character: ${player.name}!`);
        applyTheme('default');
        updateStatsView();
        saveGame(); 
        renderMainMenu();

    } catch (error) {
        console.error("Could not load game from key:", error);
        alert("Failed to import save. The key might be invalid or corrupted.");
    }
}


// --- START SCREEN & UI HELPERS ---
function showStartScreen() {
    $('#game-wrapper').classList.add('hidden');
    $('#start-screen-wrapper').classList.remove('hidden');
    
    // Make sure stats/log are visible for the next game session
    $('#stats-container').classList.remove('hidden');
    $('#log-container').classList.remove('hidden');

    logElement.innerHTML = '';
    player = null;
    updateLoadGameButtonVisibility();
    applyTheme('default');
}

function updateLoadGameButtonVisibility() {
    const saveKeys = JSON.parse(localStorage.getItem('rpgSaveKeys') || '[]');
    if (saveKeys.length > 0) {
        $('#load-game-btn').classList.remove('hidden');
    } else {
        $('#load-game-btn').classList.add('hidden');
    }

    const graveyard = JSON.parse(localStorage.getItem('rpgGraveyard') || '[]');
     if (graveyard.length > 0) {
        $('#graveyard-btn').classList.remove('hidden');
    } else {
        $('#graveyard-btn').classList.add('hidden');
    }
}

function generateSaveKey() { 
    return 'rpg_' + Math.random().toString(36).substr(2, 9); 
}


// --- EVENT LISTENERS ---
$('#start-game-btn').addEventListener('click', () => { 
    const name = $('#player-name-input').value.trim(); 
    if (name) { 
        initGame(name); 
    } else { 
        $('#player-name-input').classList.add('border-red-500'); 
    } 
});

$('#player-name-input').addEventListener('keypress', (e) => { 
    if (e.key === 'Enter') $('#start-game-btn').click(); 
});

$('#import-save-btn').addEventListener('click', () => {
    const saveString = $('#import-save-input').value.trim();
    if (saveString) {
        importSave(saveString);
    }
});

window.addEventListener('load', () => { 
    $('#load-game-btn').addEventListener('click', renderLoadMenu); 
    $('#graveyard-btn').addEventListener('click', renderGraveyard); 
    updateLoadGameButtonVisibility();
});

