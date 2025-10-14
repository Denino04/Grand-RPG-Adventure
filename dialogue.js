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
    character_creation: [
        {
            id: 'welcome',
            type: 'modal',
            content: "Welcome to the Chronicles of Cocytus. You are one of the first adventurers to set foot in this foreign land, where a new life awaits. Here, you are free to become whoever you wish. So, tell us… who are you?"
        },
        {
            id: 'step1_guide',
            content: "First, choose your Name, Gender, and Race. When you're done, hit Next.",
            targetId: '#creation-step-1',
            position: 'bottom',
            trigger: { type: 'next_button', targetId: '#to-step-2-btn' }
        },
        {
            id: 'class',
            content: "Your class grants bonus stats and starting equipment. What is your chosen profession?",
            targetId: '#class-selection-list',
            position: 'left',
            trigger: { type: 'next_button', targetId: '#to-step-3-btn' }
        },
        {
            id: 'background',
            content: "Finally, your background provides unique stat bonuses. What life did you lead before coming to this frigid land?",
            targetId: '#background-selection-list',
            position: 'left',
            trigger: { type: 'next_button', targetId: '#finalize-creation-btn' }
        },
        {
            id: 'finalize',
            type: 'modal',
            content: "I see… so this is the face of our future hero. Very well. Welcome, <Charname>, to the Frigid Land of Cocytus, where your chronicles will be written in ice."
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
        { id: 'final_ui_save', targetId: 'button[onclick*="saveGame"]', position: 'top', content: "See these two icons? The book is to Save your game. The scroll is to Export your save file. Don't be an idiot, save often." },
        { id: 'log', targetId: '#game-log-container', position: 'top', content: "Last thing. This box here is your Log. It keeps track of everything you do. Check it if your memory's as bad as your face." },
        { id: 'to_wilderness', preAction: 'enableWilderness', targetId: 'button[onclick*="renderWildernessMenu"]', position: 'bottom', content: "Alright, lecture's over. Looks like you're ready for a real fight. Let's head to the Wilderness.", trigger: { type: 'click', targetId: 'button[onclick*="renderWildernessMenu"]' } },
        { id: 'wilderness_select', targetId: '#main-view', position: 'top', content: "These are the surveyed areas. Most are too tough for a whelp like you. We'll start with the closest one.", trigger: { type: 'click', targetId: 'button[onclick*="startBattle"]' } },
        { 
            id: 'battle_intro', 
            type: 'modal',
            content: "Welcome to the battlefield. You're the blue one, the enemy's the red one. Don't mix 'em up. Down here are your actions:<br><b>Move:</b> To walk around the grid.<br><b>Attack:</b> To hit whatever's in your weapon's range.<br><b>Magic:</b> To cast a spell, if you have one.<br><b>Item:</b> To use something from your bag.<br><b>Flee:</b> To run away like a coward. Now, go smash that goblin!"
        },
        {
            id: 'wait_for_goblin_death',
            trigger: { type: 'enemy_death' }
        },
        { 
            id: 'outro', 
            type: 'modal', 
            content: "Heh, you won. Not bad... for a rookie. That's everything I can teach ya. If you need a refresher on any of this, go read a book at the library. Now get out of my sight. Good luck out there, and try not to die." 
        },
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

const LIBRARY_BOOKS = {
    'cocytus_guidebook': {
        title: "A New Adventurer's Guide to Cocytus",
        author: "Captain Org",
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
    }
};

