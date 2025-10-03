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
    }
};
