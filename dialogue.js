const BETTY_DIALOGUE = {
    first_encounter: {
        prompt: "Ah, h-hello... S-sorry to bother you. I, uhm... I heard you're a rather s-strong adventurer. Is that correct?",
        options: {
            A: { text: "Yes, I am.", response: "Oh, w-wonderful! That's perfect! Just what I was hoping to hear." },
            B: { text: "Where did you hear that?", response: "Eep! Oh, I-I'm so sorry, I... I just overheard some people talking in town. P-please don't be upset! It was good gossip!" },
            C: { text: "I wouldn't say I'm that strong.", response: "Oh... I see. W-well, from what I heard, you're more than capable. You'll still do just fine, I'm sure of it!" },
            D: { text: "...", response: "Uhm… not much of a t-talker, are you? That's... that's okay." }
        }
    },
    quest_proposal: {
        intro: [
            "W-where are my manners! My name is B-Betty. I'm a researcher from the 8 Towers. I've been sent here to... to c-catalogue the strange monsters that have appeared in this region.",
            "But... as you can probably tell, I'm... I'm not much of a fighter. That's why I need your h-help. I need someone to handle the more... aggressive specimens.",
            "So... w-what do you say? I-I can't offer a standard payment, but I can reward you for your efforts! Every time you reach a research m-milestone, I'll give you s-something useful. I promise!"
        ],
        options: {
            A: { text: "Sounds interesting. I'll help you.", response: "R-really? Oh, thank you, thank you! I knew I could count on you! H-here, take this." },
            B: { text: "Sorry, I'm not interested right now.", response: "Oh... I... I understand. It's a lot to ask. W-well, if you change your mind, you know where to find me. Please be safe out there." },
            C: { text: "...", response: "U-uhm... I'll... I'll take your silence as a yes? I hope that's okay! H-here, take this!" }
        },
        after_accept: "It's a Bestiary Notebook. J-just... jot down anything you observe about the monsters you defeat. Their strengths, weaknesses... anything at all! Good luck!",
        after_accept_silent: "J-just write down what you find. Thank you again!"
    },
    re_engage: {
        prompt: "Oh, h-hello again. I... I don't suppose you've reconsidered my offer? I s-still need help with my research…",
    },
    betty_idle: [
        "Oh, hello again! How is the research going?",
        "I was just organizing my notes... it's quite a task!",
        "Did you know some slimes are... sweet? It's in my preliminary findings!",
        "Please be careful out there. Some of these creatures are terribly dangerous.",
        "Every little bit of information helps complete the picture. Thank you again!",
        "I saw a... a very large rabbit earlier. I hope it wasn't one of the rabid ones."
    ]
};

const TUTORIAL_SEQUENCES = {
    // --- NEW CONTINUOUS CREATION FLOW ---
    character_creation_flow: [
        // Step 0: Welcome Modal
        {
            id: 'welcome',
            type: 'modal',
            content: "Welcome to Cocytus. Let's create your adventurer. First, choose your difficulty."
            // No trigger, user clicks "Next" (from tutorial box) to advance
        },
        // Step 1: Difficulty
        {
            id: 'difficulty_guide',
            targetId: '#creation-step-0',
            position: 'bottom',
            content: "Choose your difficulty. 'Hardcore' is the intended experience, but 'Medium' is fine if you're... cautious.",
            // This trigger will listen for a click on any of the three difficulty divs
            trigger: { type: 'click', targetId: '.tutorial-difficulty-btn' } 
        },
        // Step 2: Name/Gender
        {
            id: 'step1_guide',
            content: "Enter your Name and select a Gender. When you're done, hit Next.",
            targetId: '#creation-step-1',
            position: 'bottom',
            trigger: { type: 'click', targetId: '#to-step-2-btn' }
        },
        // Step 3: Race
        {
            id: 'step2_guide',
            content: "Select your Race. Details appear on the right. If you pick 'Elementals', you must also choose an Affinity.",
            targetId: '#race-selection-list',
            position: 'right',
            trigger: { type: 'click', targetId: '#to-step-3-btn' }
        },
        // Step 4: Class
        {
            id: 'step3_guide',
            content: "Select your Class. This determines your starting stats, gear, and unique Signature Ability.",
            targetId: '#class-selection-list',
            position: 'right',
            trigger: { type: 'click', targetId: '#to-step-4-btn' }
        },
        // Step 5: Background
        {
            id: 'step4_guide',
            content: "Finally, select your Background. This gives small bonuses as you level up.",
            targetId: '#background-selection-list',
            position: 'right',
            trigger: { type: 'click', targetId: '#finalize-creation-btn' }
        },
        // Step 6: Final Modal
        {
            id: 'finalize',
            type: 'modal',
            content: "I see… so this is the face of our future hero. Very well. Welcome, <Charname>, to the Frigid Land of Cocytus, where your chronicles will be written in ice.",
            // This button will call the helper function that actually creates the character
            nextButtonAction: 'tutorial_callInitGame()' 
        }
    ],

    main_game_screen: [
        { id: 'start', type: 'modal', content: "Alright, chump! So you're the new adventurer, eh? Don't look like much. Listen up. I'm gonna hold your hand through the basics so you don't get yourself killed on day one. Pay attention." },
        { id: 'stats_screen', targetId: '#stats-screen-tutorial-target', position: 'right', content: "First things first, this is your Stat Screen. Everything you need to know about yourself is right here. That's your name, and below it, all your details—gender, race, class, background, the whole lot." },
        { id: 'vitals', targetId: '#vitals-tutorial-target', position: 'right', content: "These three bars are your lifeblood. HP is Health—when it hits zero, you're dead. MP is Mana—your fuel for spells. EXP is Experience. Fill it up to get stronger." },
        { id: 'equipment', targetId: '#equipment-tutorial-target', position: 'right', content: "Next is your gear. Weapons for hitting things, Catalysts for slinging magic, Armor for not getting holes poked in ya, a Shield for blocking, and Lures for picking a fight." },
        { id: 'quests', targetId: '#quests-tutorial-target', position: 'right', content: "This here's your Quest Book. It's empty now, ya lazy sod. Go get a job!" },
        { id: 'inv_char_buttons', targetId: '#inv-char-buttons-tutorial-target', position: 'right', content: "Down below are your Inventory and Character Sheet. One's for your loot, the other's for your guts. Go on, click the Inventory button.", trigger: { type: 'click', targetId: '#inventory-btn' } },
        { id: 'inventory', targetId: '#main-view', position: 'top', content: "This is your bag. You got tabs for spells, items, and all your equipment. Try not to make a mess of it. Now close it by clicking the inventory button again.", trigger: { type: 'click', targetId: 'button[onclick*="returnFromInventory"]' } },
        { id: 'character_sheet_prompt', targetId: '#inv-char-buttons-tutorial-target', position: 'right', content: "Good. Now open the Character Sheet.", trigger: { type: 'click', targetId: '#character-sheet-btn'}},
        { id: 'character_sheet_choice', targetId: '#main-view', position: 'top', type: 'choice', content: "And this is your Character Sheet. Shows your stats and this is where you'll spend points when you level up. Now, do I need to explain what these stats do, or are you actually smart?", choices: { 'Yes': 'stat_explanation_flow', 'No': 'no_stat_explanation_flow' } },
    ],
    stat_explanation_flow: [
        { id: 'stat_explain_modal', type: 'modal', content: "Hmph. Fine, put an old orc to work.<br><strong>Vigor</strong> is how tough you are; more Vigor, more HP.<br><strong>Focus</strong> is your brainpower; gives you more MP.<br><strong>Stamina</strong> is how long you can last; boosts your defenses.<br><strong>Strength</strong> is... well, it's strength. Makes your physical attacks hit harder.<br><strong>Intelligence</strong> is for you mages; makes your spells hurt more.<br><strong>And Luck?</strong> That's whether the gods are smiling on ya or not. Affects your loot, critical hits, all that random nonsense." },
    ],
    no_stat_explanation_flow: [
         { id: 'stat_explain_skip_modal', type: 'modal', content: "A smartypants, are we? Good. Let's move on then." },
    ],
    continue_main_tutorial: [
        { id: 'close_sheet_prompt', targetId: '#main-view', position: 'top', content: "Alright, that's enough reading. Close the sheet by clicking 'Done' so we can continue.", trigger: { type: 'click', targetId: 'button[onclick*="confirmStatAllocation"]'} },
        { id: 'town_nav_checkpoint', type: 'checkpoint', requiredFlags: ['commercial_visited', 'arcane_visited', 'residential_visited'], targetId: '#main-view', position: 'top' },
        { id: 'log', targetId: '#game-log-container', position: 'top', content: "This box here is your Log. It keeps track of everything you do. Check it if your memory's as bad as your face." },
        { id: 'settings', targetId: 'button[onclick*="renderSettingsMenu"]', position: 'left', content: "The gear icon opens the settings menu. In there, you can change the difficulty, save your game, or export the save file. Don't be an idiot, save often." },
        { id: 'to_wilderness', preAction: 'enableWilderness', targetId: 'button[onclick*="renderWildernessMenu"]', position: 'bottom', content: "Alright, lecture's over. Looks like you're ready for a real fight. Let's head to the Wilderness.", trigger: { type: 'click', targetId: 'button[onclick*="renderWildernessMenu"]' } },
        { id: 'wilderness_select', targetId: '#main-view', position: 'top', content: "These are the surveyed areas. Most are too tough for a whelp like you. We'll start with the closest one.", trigger: { type: 'click', targetId: 'button[onclick*="startBattle"]' } },
        {
            id: 'battle_buffer',
            type: 'modal',
            content: "Now let's see how you fight, chump!"
        },
        {
            id: 'battle_intro',
            targetId: '#battle-grid',
            position: 'top',
            content: "These are your actions: Move, Attack, Magic, Item, and Flee. The grid is the battlefield. You're blue, they're red. Simple. Now, go smash that goblin!"
        },
        {
            id: 'wait_for_goblin_death',
            type: 'trigger_only', // Waits for the enemy_death trigger from battle.js
            trigger: { type: 'enemy_death' }
        },
        {
            id: 'outro',
            type: 'modal',
            content: "Heh, you won. Not bad... for a rookie. That's everything I can teach ya. If you need a refresher on any of this, go read a book at the library. Now get back to town. Good luck out there, and try not to die.",
            // *** CHANGED: Use a custom function on button click ***
            nextButtonAction: 'completeBattleTutorial()' // This function will be defined in ui_helpers.js
        }
        // *** REMOVED return_to_town step ***
    ],
    commercial_district_tour: [
        { id: 'commercial_explained', targetId: '#main-view', position: 'top', content: "Right, the market. That's the General Store, the Blacksmith's forge, and that shady alley... that's the Black Market. Go back to the Town Square when you're done looking.", trigger: { type: 'click', targetId: 'button[onclick*="renderTownSquare"]', setFlag: 'commercial_visited' } }
    ],
    arcane_district_tour: [
        { id: 'arcane_explained', targetId: '#main-view', position: 'top', content: "Curious, eh? That big spire is the Sage's Tower, the glowing shop is the Enchantress's, and that hut is the Witch's place. Head back to the Town Square.", trigger: { type: 'click', targetId: 'button[onclick*="renderTownSquare"]', setFlag: 'arcane_visited' } }
    ],
    residential_district_tour: [
        { id: 'residential_explained', targetId: '#main-view', position: 'top', content: "Need a place to rest your head? The Inn is for sleeping, the Quest Board is for work, and now there's a Library if you forget something. Head back to the Town Square when you're ready.", trigger: { type: 'click', targetId: 'button[onclick*="renderTownSquare"]', setFlag: 'residential_visited' } }
    ]
};

const NPC_DIALOGUE = {
    spiceChance: 0.10, // 10% chance to use cross-gender dialogue
    random_chance: {
        attack: 1,
        cast: 1,
        heal: 1,
        idle: 1
    },

    // --- NEW DIALOGUE TYPES ---

    // Time Based: If player lounges too long without clicking any button or closing the game (idle)
    ON_IDLE: [
        {
            gender: 'Male',
            lines: [
                "Boss, are we waiting for the enemies to surrender? Let's move.",
                "Is something wrong, <PlayerName>? My orders are unclear.",
                "Hmph. My patience is not infinite, leader. Pick a direction."
            ]
        },
        {
            gender: 'Female',
            lines: [
                "Is this a strategic pause, darling? Or are you just enjoying my company?",
                "My dear <PlayerName>, I feel restless. Do you have a plan yet?",
                "Waiting is so tedious. Let's find some trouble, shall we?"
            ]
        },
        {
            gender: 'Neutral',
            lines: [
                "Input required, <PlayerName>. Inactivity decreases optimal resource gain.",
                "System idle. Awaiting command to proceed.",
                "I advise against prolonged stagnation. Choose a course of action."
            ]
        }
    ],

    // Dialogue for when ally levels up
    LEVEL_UP: [
        {
            gender: 'Male',
            lines: [
                "I feel the steel sharpening in my bones! This challenge was worth it, <PlayerName>.",
                "Another level. Good. Now I can hit harder. Don't fall behind, Boss.",
                "Hah! Stronger than before. Let's find a fight worthy of this new power."
            ]
        },
        {
            gender: 'Female',
            lines: [
                "Oh, <PlayerName>, I feel so much more graceful now! Perhaps a reward is in order?",
                "My abilities flourish! Thank you for the shared experience, darling.",
                "Confidence level: Maximum. Now I can truly show off my potential!"
            ]
        },
        {
            gender: 'Neutral',
            lines: [
                "Parameter enhancement confirmed. Efficiency metrics have increased.",
                "Level up complete. Recalculating threat assessment. Optimal results achieved.",
                "Affirmative. Progression is satisfactory. My contribution will increase."
            ]
        }
    ],

    // Start Battle (Standard)
    START_BATTLE: [
        {
            gender: 'Male',
            lines: [
                "Time to break some heads, Boss. Stay focused on the big one.",
                "Don't worry about me, <PlayerName>. I'll clear the flanks.",
                "This is where the contract is honored. Engage!"
            ]
        },
        {
            gender: 'Female',
            lines: [
                "Such charming targets! Try not to scuff my armor, darling.",
                "Ready when you are, <PlayerName>. Let's make this quick and clean.",
                "Let the dance begin. Watch how I handle the ugly ones."
            ]
        },
        {
            gender: 'Neutral',
            lines: [
                "Threat detected. Deploying to coordinates. Prepare for combat.",
                "Begin engagement sequence. Calculating optimal target priority.",
                "The terms of the contract are now active. Proceed with extreme prejudice."
            ]
        }
    ],

    // Start Training (Training/Sparring)
    START_TRAIN: [
        {
            gender: 'Male',
            lines: [
                "A dummy fight? Fine. I need to stretch the muscles anyway.",
                "Let's see what this gear can really do. Don't expect me to hold back, <PlayerName>.",
                "Test my limits, Boss. I thrive on the pressure."
            ]
        },
        {
            gender: 'Female',
            lines: [
                "A little practice won't hurt! Show me your best moves, handsome.",
                "Ready for our private lesson, <PlayerName>? Let's have some fun.",
                "This will be a good warm-up. Don't worry, I promise to be gentle... mostly."
            ]
        },
        {
            gender: 'Neutral',
            lines: [
                "Training simulation initiated. Resource expenditure permitted.",
                "Commencing evaluation of combat effectiveness. Target acquired.",
                "This practice is logical. Begin drills now."
            ]
        }
    ],

    // End Battle (Standard)
    END_BATTLE: [
        {
            gender: 'Male',
            lines: [
                "Hah! They folded faster than cheap steel. Next target, Boss.",
                "A clean sweep. Told you I'd handle the flanks, <PlayerName>.",
                "Is that all? Time to collect the bounty."
            ]
        },
        {
            gender: 'Female',
            lines: [
                "A magnificent performance, <PlayerName>! I think we make a stunning pair.",
                "That was almost too easy. We should celebrate this victory!",
                "Grace and efficiency. I told you I wouldn't scuff my armor."
            ]
        },
        {
            gender: 'Neutral',
            lines: [
                "Combat termination confirmed. Analyzing loot yield probability.",
                "Mission parameters achieved. Preparing for post-engagement protocol.",
                "Conflict resolved. Threat neutralized. A profitable outcome."
            ]
        }
    ],

    // End Training
    END_TRAIN: [
        {
            gender: 'Male',
            lines: [
                "Session complete. That was a decent workout.",
                "Back to the real fight now. Training is over, <PlayerName>.",
                "I've learned what I needed to. Good to know my limits."
            ]
        },
        {
            gender: 'Female',
            lines: [
                "I feel wonderfully energized! Thank you for the spar, <PlayerName>.",
                "Time well spent! You have excellent reflexes, handsome.",
                "Practice finished. Let's see if the real enemies are this cooperative."
            ]
        },
        {
            gender: 'Neutral',
            lines: [
                "Training cycle finished. Simulation data recorded.",
                "Evaluation complete. You performed within optimal variance.",
                "End of session. Resetting all combat parameters."
            ]
        }
    ],

    // HP Threshold 50%
    HP_50: [
        {
            gender: 'Male',
            lines: [
                "Damn. That hit stung! Be smarter, <AllyName>!",
                "I'm wounded, Boss! I can take it, but push harder!",
                "Half health. My rage is growing."
            ]
        },
        {
            gender: 'Female',
            lines: [
                "Oh dear, a scratch! We must finish this quickly, <PlayerName>!",
                "My turn to shine! I won't let my beauty fade, darling!",
                "Just a flesh wound. But I prefer perfection."
            ]
        },
        {
            gender: 'Neutral',
            lines: [
                "Warning: Vitality below 50%. Adjusting defensive posture.",
                "Damage sustained. System diverting power to core functions.",
                "Threat assessment upgraded. Be advised."
            ]
        }
    ],

    // HP Threshold 10%
    HP_10: [
        {
            gender: 'Male',
            lines: [
                "CRITICAL! Don't look at me, focus on the kill!",
                "My blood is boiling! Finish this NOW, <PlayerName>!",
                "If I go down, take everything I own! And avenge me, Boss!"
            ]
        },
        {
            gender: 'Female',
            lines: [
                "I'm fading, <PlayerName>! I need a moment! Help me!",
                "This is not how I wanted this story to end! Protect me, darling!",
                "I hate bleeding. Make them pay for this!"
            ]
        },
        {
            gender: 'Neutral',
            lines: [
                "Emergency warning: Vitality critical. Preparing emergency disengagement.",
                "Final stand sequence initiated. Probability of survival: low.",
                "Damage catastrophic. Recommend immediate withdrawal."
            ]
        }
    ],

    // Ally Attacking
    ON_ATTACK: [
        {
            gender: 'Male',
            lines: [
                "Have some steel!",
                "Smash!",
                "This is how real damage is done."
            ]
        },
        {
            gender: 'Female',
            lines: [
                "A touch of my power!",
                "Ha! Predictable!",
                "Just for you, darling."
            ]
        },
        {
            gender: 'Neutral',
            lines: [
                "Executing physical contact protocol.",
                "Damage delivered.",
                "Impact successful."
            ]
        }
    ],

    // Ally Casting Spell
    ON_CAST: [
        {
            gender: 'Male',
            lines: [
                "Feel the arcane force!",
                "Witness true power!",
                "Burn them down!"
            ]
        },
        {
            gender: 'Female',
            lines: [
                "A little magic goes a long way.",
                "Such beautiful destruction!",
                "Sparkle, sparkle!"
            ]
        },
        {
            gender: 'Neutral',
            lines: [
                "Commencing arcane discharge.",
                "Spell matrix stable. Fire!",
                "Target is now receiving magical energy."
            ]
        }
    ],

    // Ally Healing (Item or Spell)
    ON_HEAL: [
        {
            gender: 'Male',
            lines: [
                "Back in the fight! I'm not done yet.",
                "A quick fix. Don't worry, Boss.",
                "A moment's respite is all I need."
            ]
        },
        {
            gender: 'Female',
            lines: [
                "Feeling much better now, thank you!",
                "A little potion to stay pretty!",
                "Don't worry, I'm recovering nicely."
            ]
        },
        {
            gender: 'Neutral',
            lines: [
                "Healing protocol executed.",
                "Vitality replenished. Resuming combat status.",
                "Resource consumption successful."
            ]
        }
    ],

    // Dialogue for when the ally is recruited
    RECRUIT: [
        {
            gender: 'Male',
            lines: [
                "This hand is yours, <PlayerName>. Point me toward the threat; I'll handle the rest.",
                "I accept the contract, <PlayerName>. My strength is yours, Boss. Let's get to work.",
                "Hmph. Fine. You lead, I follow. Don't waste my time, leader.",
                "Your command is my destiny. Let's make some gold, <PlayerName>. I'm ready for the bloodshed.",
                "Another day, another life put on the line. I'm yours, Captain. Just don't get in my way."
            ]
        },
        {
            gender: 'Female',
            lines: [
                "I look forward to our partnership, <PlayerName>! I hope you can keep up with me.",
                "Finally, a chance for some excitement! Thank you for choosing me, darling.",
                "Consider it done, Captain. <AllyName> is ready to follow your orders, and look fabulous doing it.",
                "I sense great potential in our pairing, <PlayerName>. Let's explore together, shall we?",
                "My blade is yours, for now. Try not to miss the show when I fight."
            ]
        },
        {
            gender: 'Neutral',
            lines: [
                "My services are now bound to yours. I will endeavor to be useful to <PlayerName>.",
                "Recruitment complete. Where do we find the enemies with the shiniest loot, <PlayerName>?",
                "The terms are accepted. <AllyName> awaits your command.",
                "A partnership. Logical. I look forward to observing your methods, <PlayerName>.",
                "The price was fair. Show me the danger."
            ]
        }
    ],
    
    // Dialogue for when the ally is dismissed by the player
    DISMISS: [
        {
            gender: 'Male',
            lines: [
                "Understood, <PlayerName>. May your path be clear, and your next weapon be sharp.",
                "It was... eventful. Farewell, and don't let your guard down without me.",
                "If you need my blade again, you know where to find <AllyName>. Until then, <PlayerName>.",
                "This has been a solid run. Take care, Boss. Don't lose the coin.",
                "My business here is finished. I'll be training. Goodbye."
            ]
        },
        {
            gender: 'Female',
            lines: [
                "A shame, but I respect the decision. Be safe out there, <PlayerName>, and try not to miss me too much.",
                "Thank you for the adventure. I always appreciate a talented partner.",
                "The alliance ends, but the memories remain. Goodbye, handsome.",
                "If destiny wills it, we will meet again, <PlayerName>. I'm sure you'll be looking for me.",
                "It was fun while it lasted! Perhaps we can share a drink next time."
            ]
        },
        {
            gender: 'Neutral',
            lines: [
                "Affiliation terminated. I shall return to my solitary pursuits. Farewell.",
                "The contract is fulfilled. I wish you luck, <PlayerName>.",
                "Very well. <AllyName> departs.",
                "Data logged. Disengaging. Goodbye.",
                "I require time for personal reflection. Until next time, Captain."
            ]
        }
    ],
    
    // Dialogue for when the ally is fired (failed to pay salary)
    FIRED: [
        {
            gender: 'Male',
            lines: [
                "I knew it! Always the same! No pay, no play, <PlayerName>!",
                "Unacceptable! I will not serve a cheapskate! Good luck surviving alone.",
                "This is an insult! Keep your paltry gold. <AllyName> is gone. Don't call this number.",
                "You wasted my time and my fury. I'm leaving! I should just take your gear.",
                "Find someone else to bleed for you. I'm done. You're weaker than I thought."
            ]
        },
        {
            gender: 'Female',
            lines: [
                "I cannot work under these conditions. My trust is broken. You disappoint me, <PlayerName>.",
                "You have much to learn about loyalty. I hope this mistake costs you dearly, Captain. I deserved better.",
                "Fine! The risk wasn't worth the reward. I'm done serving you. Next time, bring actual wealth.",
                "My generosity has limits! I won't be treated this way!",
                "Don't bother calling me back. I'm finding a more honorable, and richer, employer."
            ]
        },
        {
            gender: 'Neutral',
            lines: [
                "Error: Service termination due to contract violation. I am taking my severance and leaving.",
                "Insufficient compensation. I am no longer available for field operations, <PlayerName>.",
                "Failure to meet obligations. Goodbye.",
                "Unreliable leadership detected. Protocol dictates abandonment.",
                "Wasting my potential for lack of funds? Illogical. Farewell."
            ]
        }
    ],
    
    // Dialogue for when the ally flees battle (HP hits 0)
    FLEE: [
        {
            gender: 'Male',
            lines: [
                "I'm done! This is beyond my pay grade! Every man for himself!",
                "Retreat! Retreat! Tell <PlayerName> I need a new spine!",
                "Too much! <AllyName> is sorry, I'm out! I'll be back stronger, Boss!",
                "I'm better off alive than heroic! See you later!",
                "I cannot sustain this pace! Find cover, <PlayerName>! I'll buy you a beer if I live!",
                "This isn't a fair fight! I'm disengaging! Don't let them kill the Boss!"
            ]
        },
        {
            gender: 'Female',
            lines: [
                "This is tactical retreat! I'll see you in town, <PlayerName>... maybe after a long bath!",
                "I'm not dying here! Look after yourself, darling!",
                "No, no, no! I need to mend my wounds! I'm leaving! Don't worry about me!",
                "I'll draw their fire! Just kidding, I'm actually running away! Save yourself!",
                "My power is depleted! I have to go! Don't forget my beautiful face!",
                "I must recover! Cover me, I'm getting out of here! We'll laugh about this later!"
            ]
        },
        {
            gender: 'Neutral',
            lines: [
                "Immediate disengagement required. Prioritizing self-preservation!",
                "System failure imminent! Aborting mission! Good luck, <PlayerName>.",
                "Commencing evasive maneuvers! <AllyName> will not be destroyed here.",
                "HP threshold exceeded. Protocol 3-Delta: Flee!",
                "Unacceptable risk level. Retreat is the logical choice.",
                "Energy low. Recharging required. See you at the Barracks."
            ]
        }
    ]
};


const LIBRARY_BOOKS = {
    'cocytus_guidebook': {
        title: "A New Adventurer's Guide to Cocytus",
        author: "Captain Org",
        isDynamic: false,
        chapters: [
            { 
                title: "On Your Stats", 
                content: `
                    <p class="mb-2"><strong>Your Stat Screen:</strong> Everything you need to know about yourself is right here. That's your name, and below it, all your details—gender, race, class, background, the whole lot.</p>
                    <p class="mb-2"><strong>The Three Bars:</strong><br>
                    - <strong>HP (Health):</strong> When it hits zero, you're dead. Simple.<br>
                    - <strong>MP (Mana):</strong> Your fuel for spells. Run out, and you're just waving your hands around.<br>
                    - <strong>EXP (Experience):</strong> Fill it up by fighting and finishing quests to get stronger. Got it?</p>
                    <p class="mb-2"><strong>Your Gear:</strong><br>
                    - <strong>Weapons:</strong> For hitting things. Swords, axes, your bare fists, whatever.<br>
                    - <strong>Catalysts:</strong> For slinging magic. No catalyst, no flashy spells.<br>
                    - <strong>Armor:</strong> What you're wearing; keeps you from gettin' holes poked in ya.<br>
                    - <strong>A Shield:</strong> For blocking or parrying, if you're feeling fancy.<br>
                    - <strong>Lures:</strong> They lure out monsters when you're lookin' for a bigger fight.</p>
                    <p><strong>Quest Book:</strong> It's where you track your jobs. Don't let it stay empty.</p>
                ` 
            },
            {
                title: "On Attributes",
                content: `
                    <p>Listen up, this is what your guts are made of:</p>
                    <ul class="list-disc list-inside ml-4">
                        <li><strong>Vigor:</strong> How tough you are; more Vigor, more HP.</li>
                        <li><strong>Focus:</strong> Your brainpower; gives you more MP.</li>
                        <li><strong>Stamina:</strong> How long you can last; boosts your defenses.</li>
                        <li><strong>Strength:</strong> ...well, it's strength. Makes your physical attacks hit harder.</li>
                        <li><strong>Intelligence:</strong> For you mages; makes your spells hurt more.</li>
                        <li><strong>Luck:</strong> Whether the gods are smiling on ya or not. Affects your loot, critical hits, all that random nonsense.</li>
                    </ul>
                `
            },
            {
                title: "On The Town",
                content: `
                    <p class="mb-2">The town's got three main districts:</p>
                    <ul class="list-disc list-inside ml-4">
                        <li><strong>Commercial District:</strong> Where the money is. The General Store, the Blacksmith, and the shady Black Market are there.</li>
                        <li><strong>Arcane Quarter:</strong> For you magic nerds. You'll find the Sage's Tower, the Enchantress, and the Witch's hut.</li>
                        <li><strong>Residential Area:</strong> Has the Inn for sleeping, the Quest Board for work, and the Library for when you forget this stuff.</li>
                    </ul>
                `
            },
            {
                title: "On Combat",
                content: `
                    <p>When a fight starts, you've got your actions:</p>
                     <ul class="list-disc list-inside ml-4">
                        <li><strong>Move:</strong> To walk around the grid.</li>
                        <li><strong>Attack:</strong> To hit whatever's in your weapon's range.</li>
                        <li><strong>Magic:</strong> To cast a spell, if you have one.</li>
                        <li><strong>Item:</strong> To use something from your bag.</li>
                        <li><strong>Flee:</strong> To run away like a coward.</li>
                    </ul>
                `
            }
        ]
    },
    'nathalies_cookbook': {
        isDynamic: true,
        recipeType: 'cooking',
        title: "Nathalie's Home Cook Guide",
        author: "Nathalie Mahesvara",
        chapters: [
            {
                title: "Introduction",
                content: `<p>A collection of recipes gathered from across the land. The pages are filled with notes and stains, a testament to many meals cooked and enjoyed.</p>`
            }
        ]
    },
    'alchemy_beginner': {
        isDynamic: true,
        recipeType: 'alchemy',
        tier: 1,
        title: "Foundational Formulations, Vol. I",
        author: "Kiky Dionysson",
        chapters: [
            {
                title: "Foreword",
                content: `<p>A comprehensive treatise on the fundamental principles of alchemical synthesis for novice practitioners. Authored by Kiky Dionysson, this volume details precise methodologies for the creation of various Tier 1 concoctions. Adherence to procedure is paramount for reproducible results.</p>`
            }
        ]
    },
    'alchemy_intermediate': {
        isDynamic: true,
        recipeType: 'alchemy',
        tier: 2,
        title: "Foundational Formulations, Vol. II",
        author: "Kiky Dionysson",
        chapters: [
             {
                title: "Foreword",
                content: `<p>More complex concoctions for the aspiring alchemist. These require rarer reagents and a steady hand.</p>`
            }
        ]
    },
    'alchemy_advanced': {
        isDynamic: true,
        recipeType: 'alchemy',
        tier: 3,
        title: "Foundational Formulations, Vol. III",
        author: "Kiky Dionysson",
        chapters: [
             {
                title: "Foreword",
                content: `<p>Masterwork formulas for powerful and volatile potions. Do not attempt without significant experience.</p>`
            }
        ]
    },
    'casino_clues': {
        isDynamic: true,
        recipeType: 'clues', // Custom type
        title: "A Scrambled Note",
        author: "???",
        chapters: [
            {
                title: "Fragments",
                content: `<p>You smooth out the scraps of paper you've found. It seems to be a code, but the order is jumbled...</p>`
            }
            // Dynamic chapters will be added here by renderBook
        ]
    },
    'home_grease_recipes': {
        isDynamic: true,
        recipeType: 'alchemy',
        tier: 1, // Matches the new grease recipes
        title: "Home Recipe for Homemade Grease",
        author: "Nathalie Mahesvara",
        chapters: [
            {
                title: "Introduction",
                content: `<p class="italic">"Kiky keeps all their notes in those dreadfully dry 'Formulations' books, talking about 'thermal insulators' and 'anti-entropic fields.' It all sounds so complicated! I find it's much simpler. A bit of this, a bit of that, and you have a lovely paste to help you in a fight. Here are a few of my own recipes. They're much easier to follow, and they smell better, too!"</p>`
            }
            // Dynamic chapters for each grease recipe will be added here by renderBook()
        ]
    },
};


