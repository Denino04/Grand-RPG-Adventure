// --- GAME STATE ---
let player;
let currentEnemies = [];
let gameState = { currentView: 'main_menu', isPlayerTurn: true, currentBiome: null, playerIsDying: false };
let lastViewBeforeInventory = 'main_menu';
let isDebugVisible = false;
let timeOfDayIndex = 0;
let useFullPaletteRotation = false;

// --- INITIALIZATION ---
function initGame(playerName, gender, raceKey, classKey, backgroundKey) { 
    $('#character-creation-screen').classList.add('hidden');
    $('#start-screen').classList.add('hidden'); 
    $('#game-container').classList.remove('hidden'); 
    
    // 1. Create Player with Race stats
    player = new Player(playerName, raceKey); 
    player.gender = gender;
    player.class = CLASSES[classKey].name;
    player.background = BACKGROUNDS[backgroundKey].name;
    player.backgroundKey = backgroundKey;
    player.totalXp = 0; // Initialize totalXp for new characters

    // 2. Apply Class modifications
    const classData = CLASSES[classKey];
    
    // Apply stat bonuses
    for (const stat in classData.bonusStats) {
        let statLower = stat.toLowerCase();
        if (player.hasOwnProperty(statLower)) {
            player[statLower] += classData.bonusStats[stat];
        }
    }
    
    // Apply starting equipment, items, and spells
    player.inventory = { items: {}, weapons: [], catalysts: [], armor: [], shields: [], lures: {} }; // Clear default inventory
    
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

    player.spells = {}; // Clear default spells
    for (const spellKey in classData.startingSpells) {
        player.spells[spellKey] = { tier: classData.startingSpells[spellKey] };
    }
    
    // Handle special random items/spells
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


    // 3. Finalize Player Setup
    player.hp = player.maxHp;
    player.mp = player.maxMp;
    player.baseStats = { Vigor: player.vigor, Focus: player.focus, Stamina: player.stamina, Strength: player.strength, Intelligence: player.intelligence, Luck: player.luck };
    player.dialogueFlags = {};


    player.seed = Math.floor(Math.random() * 1000000);
    gameState.playerIsDying = false; 
    player.saveKey = generateSaveKey();
    generateRandomizedBiomeOrder();
    generateBlackMarketStock();
    updatePlayerTier();
    addToLog(`Welcome, ${playerName} the ${player.class}! Your adventure begins.`); 
    applyTheme('default'); 
    updateStatsView(); 
    saveGame();
    renderMainMenu(); 
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
                            <p class="text-sm text-gray-400">Level ${charData.level} ${charData.race || ''} ${charData.class || ''}</p>
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
    
    $('#start-screen').classList.add('hidden');
    const screenContainer = $('#changelog-screen');
    screenContainer.innerHTML = html;
    screenContainer.classList.remove('hidden');
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

function loadGameFromKey(saveKey, isImport = false) {
    const savedData = localStorage.getItem(`rpgSaveData_${saveKey}`);
    if (savedData) {
        try {
            const parsedData = JSON.parse(savedData);

            if (!parsedData.race) {
                renderRaceSelectionForOldSave(parsedData, saveKey, isImport);
                return;
            }
            
            if (!parsedData.class || !parsedData.backgroundKey) {
                renderClassBackgroundSelectionForOldSave(parsedData, saveKey, isImport);
                return;
            }

            player = new Player(parsedData.name, parsedData.race);
            player.saveKey = saveKey; // FIX: Ensure saveKey is assigned immediately.

            // Bug fix: Initialize new properties on the parsed data for old saves.
            if (!parsedData.dialogueFlags) parsedData.dialogueFlags = {};
            if (!parsedData.bettyQuestState) parsedData.bettyQuestState = 'not_started';


            const getterProperties = ['maxHp', 'maxMp', 'physicalDefense', 'magicalDefense', 'physicalDamageBonus', 'magicalDamageBonus', 'resistanceChance', 'critChance', 'evasionChance'];
            for (const key in parsedData) {
                if (Object.prototype.hasOwnProperty.call(parsedData, key) && !getterProperties.includes(key)) {
                    player[key] = parsedData[key];
                }
            }
            
            if (isImport) {
                player.saveKey = generateSaveKey();
            }

            if (player.totalXp === undefined) {
                addToLog('Updating old save file to new EXP system...', 'text-yellow-300');
                let estimatedTotalXp = 0;
                
                // FIX: Use the OLD formula (power of 1.5) to estimate total XP.
                for (let i = 1; i < player.level; i++) {
                    estimatedTotalXp += Math.floor(100 * Math.pow(i, 1.5));
                }

                estimatedTotalXp += player.xp;
                player.totalXp = estimatedTotalXp;
            }

            const levelChange = player.recalculateLevelFromTotalXp();
            if (levelChange !== 0) {
                const changeText = levelChange > 0 ? `gained ${levelChange}` : `lost ${Math.abs(levelChange)}`;
                const plural = Math.abs(levelChange) > 1 ? 's' : '';
                addToLog(`Your level has been re-calibrated! You ${changeText} level${plural}!`, 'text-green-400');
                if (player.statPoints > 0) {
                    addToLog(`You have <span class="font-bold text-green-400">${player.statPoints}</span> stat points to allocate!`, 'text-green-300');
                }
            }
            player.recalculateGrowthBonuses();
            player.hp = Math.min(parsedData.hp, player.maxHp);
            player.mp = Math.min(parsedData.mp, player.maxMp);

            if (player.gender === 'Not specified' || !player.gender) {
                player.gender = 'Neutral';
            }

            if (player.spells) {
                for (const spellKey in player.spells) {
                    if (!SPELLS[spellKey]) {
                        delete player.spells[spellKey];
                        console.warn(`Removed unknown spell '${spellKey}' from save data.`);
                    }
                }
            }

            const weaponKey = findKeyByName(parsedData.equippedWeapon?.name, WEAPONS) || 'fists';
            player.equippedWeapon = WEAPONS[weaponKey];
            const catalystKey = findKeyByName(parsedData.equippedCatalyst?.name, CATALYSTS) || 'no_catalyst';
            player.equippedCatalyst = CATALYSTS[catalystKey];
            const armorKey = findKeyByName(parsedData.equippedArmor?.name, ARMOR) || 'travelers_garb';
            player.equippedArmor = ARMOR[armorKey];
            const shieldKey = findKeyByName(parsedData.equippedShield?.name, SHIELDS) || 'no_shield';
            player.equippedShield = SHIELDS[shieldKey];
            
            if (!LURES[player.equippedLure]) player.equippedLure = 'no_lure';
            if (!player.inventory.catalysts) player.inventory.catalysts = [];
            if (!player.equipmentOrder) {
                player.equipmentOrder = [];
                if (player.equippedWeapon && player.equippedWeapon.name !== 'Fists') player.equipmentOrder.push('weapon');
                if (player.equippedShield && player.equippedShield.name !== 'None') player.equipmentOrder.push('shield');
                if (player.equippedCatalyst && player.equippedCatalyst.name !== 'None') player.equipmentOrder.push('catalyst');
            }
            if (!player.legacyQuestProgress) player.legacyQuestProgress = {};
            if (!player.questsTakenToday) player.questsTakenToday = [];
            if (!player.blackMarketStock) {
                player.blackMarketStock = { seasonal: [] };
                generateBlackMarketStock();
            }
            gameState.playerIsDying = false;

            if (typeof player.activeQuest === 'string') {
                player.activeQuest = null;
                player.questProgress = 0;
            }

            if (!player.seed) player.seed = Math.floor(Math.random() * 1000000);
            if (!player.biomeOrder || player.biomeOrder.length === 0) generateRandomizedBiomeOrder();
            
            updatePlayerTier();

            $('#start-screen').classList.add('hidden');
            $('#character-creation-screen').classList.add('hidden');
            $('#old-save-race-selection-screen').classList.add('hidden');
            $('#old-save-class-background-screen').classList.add('hidden'); // This is the fix
            $('#changelog-screen').classList.add('hidden');
            $('#game-container').classList.remove('hidden');

            addToLog(`Welcome back, ${player.name}!`);
            applyTheme('default');
            updateStatsView();
            if (player.statPoints > 0) {
                setTimeout(() => renderCharacterSheet(true), 1500);
            } else {
                renderMainMenu();
            }
        } catch (error) {
            console.error("Could not load game:", error);
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

        if (!parsedData || !parsedData.name) {
            throw new Error("Invalid save data format.");
        }
        
        const tempKey = `rpg_import_${Date.now()}`;
        localStorage.setItem(`rpgSaveData_${tempKey}`, jsonString);
        loadGameFromKey(tempKey, true);

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
window.addEventListener('load', () => { 
    $('#start-game-btn').addEventListener('click', renderCharacterCreation);

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

    updateLoadGameButtonVisibility();
});


