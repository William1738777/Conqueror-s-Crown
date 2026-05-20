// ============================================================================
// 🗺️ RPG & TUTORIAL LOGIC (Tavern Keeper Ben)
// ============================================================================

let dialogueIndex = 0;
const tavernDialogue = [
    "Ah, a new face. You look like you've seen a battle or two... but maybe not the kind we fight around here.",
    "In Leonia, wars are fought on the table. With strategy, mana, and a good deck.",
    "You want to survive in this kingdom? You need to know how to deploy your forces.",
    "I've got a spare starter deck behind the counter. Let me walk you through the basics."
];

function startDialogueSequence() {
    dialogueIndex = 0;
    document.getElementById('dialogue-text').innerText = tavernDialogue[dialogueIndex];
}

function advanceDialogue() {
    dialogueIndex++;
    if (dialogueIndex < tavernDialogue.length) {
        document.getElementById('dialogue-text').innerText = tavernDialogue[dialogueIndex];
    } else {
        document.getElementById('rpg-dialogue-box').style.display = 'none';
        presentStarterCards();
    }
}

async function presentStarterCards() {
    const container = document.createElement('div');
    container.className = 'tutorial-card-presentation';
    
    const starters = ["Squire", "Archer", "Bannerman", "Great Knight", "Mana Core", "Militia"];
    for (let i=0; i<starters.length; i++) {
        let key = starters[i];
        if (key === "Mana Core") key = "Mana Core";
        if (key === "Great Knight") key = "Great Knight";

        const data = getCardTemplate(key, ASSET_LINKS[key]);
        const cardDOM = createCardDOM('tut_' + i, data, true); 
        
        cardDOM.classList.add('tut-card');
        cardDOM.style.animationDelay = `${i * 0.3}s`;
        
        let imgContainer = cardDOM.querySelector('.card-img-container');
        if(imgContainer) {
            imgContainer.style.backgroundImage = `url('${data.img.replace(/"/g, '&quot;').replace(/'/g, '%27')}')`;
        }
        
        container.appendChild(cardDOM);
    }
    document.body.appendChild(container);

    const msgBox = document.createElement('div');
    msgBox.style.cssText = `position:fixed; top:20%; left:50%; transform:translateX(-50%); background:rgba(0,0,0,0.9); border:2px solid var(--gold); padding:20px; color:white; z-index:600; text-align:center; border-radius:8px; font-size:1.2rem; opacity:0; transition:1s;`;
    msgBox.innerHTML = `<b>BEN:</b> Here. Take these. Let's see what you can do with them.<br><br><button id="start-tut-btn" style="padding:10px 20px; margin-top:15px; background:var(--gold); border:none; cursor:pointer; font-weight:bold;">ENTER BATTLEFIELD</button>`;
    document.body.appendChild(msgBox);
    
    setTimeout(() => { msgBox.style.opacity = 1; }, 2000);

    document.getElementById('start-tut-btn').addEventListener('click', () => {
        container.remove();
        msgBox.remove();
        document.getElementById('tavern-screen').style.display = 'none';
        startTutorialDuel();
    });
}

function startTutorialDuel() {
    document.getElementById('game-area').style.display = 'flex';
    document.getElementById('tutorial-exit-btn').style.display = 'block';
    
    isTutorialMode = true;
    tutorialStep = 1;
    pMana = 8;
    eMana = 8;
    eCoreHP = 1; 
    document.getElementById('enemy-core-hp').innerText = `BEN'S CORE: 1 | MANA: 8`;
    
    let playerHand = ["Squire", "Archer", "Bannerman", "Mana Core", "Great Knight", "Militia"];
    playerHand.forEach(name => {
        const data = getCardTemplate(name, ASSET_LINKS[name]);
        const cardId = 'p_' + name.replace(/\s+/g, '');
        cardInstances[cardId] = { ...data, id: cardId, exhausted: false, queued: false, side: 'PLAYER', turnPlaced: 0, tauntedBy: null, isRevealed: false };
        document.getElementById('hand').appendChild(createCardDOM(cardId, cardInstances[cardId], false));
    });

    let enemyHand = ["Militia", "Archer"];
    enemyHand.forEach((name, idx) => {
        const data = getCardTemplate(name, ASSET_LINKS[name]);
        if (name === "Archer") { data.hp = 150; data.maxHp = 150; }
        const cardId = 'e_' + name.replace(/\s+/g, '') + '_' + idx;
        cardInstances[cardId] = { ...data, id: cardId, exhausted: false, queued: false, side: 'ENEMY', turnPlaced: 0, tauntedBy: null, isRevealed: false };
        eHandData.push(cardId);
    });

    document.getElementById('tut-overlay-msg').style.display = 'block';
    if (typeof updateUI === "function") updateUI();
    progressTutorial();
}

function setTutMessage(msg) {
    document.getElementById('tut-overlay-msg').innerHTML = msg;
}

function clearTutHighlights() {
    document.querySelectorAll('.tut-highlight-glow, .tut-disabled').forEach(el => {
        el.classList.remove('tut-highlight-glow', 'tut-disabled');
    });
    tutorialLock = false;
}

function lockAllExcept(allowedIds, allowEndTurn = false, allowExec = false) {
    tutorialLock = true;
    document.querySelectorAll('.card, .slot, .btn-main').forEach(el => {
        el.classList.add('tut-disabled');
    });
    allowedIds.forEach(id => {
        let el = document.getElementById(id);
        if(el) {
            el.classList.remove('tut-disabled');
            el.classList.add('tut-highlight-glow');
        }
    });
    
    let endBtn = document.getElementById('end-turn-btn');
    if (allowEndTurn) { endBtn.classList.remove('tut-disabled'); endBtn.classList.add('tut-highlight-glow'); }
    else { endBtn.classList.add('tut-disabled'); endBtn.classList.remove('tut-highlight-glow'); }
    
    let execBtn = document.getElementById('exec-btn');
    if (allowExec) { execBtn.classList.remove('tut-disabled'); execBtn.classList.add('tut-highlight-glow'); }
    else { execBtn.classList.add('tut-disabled'); execBtn.classList.remove('tut-highlight-glow'); }
    
    let cancelBtn = document.getElementById('cancel-btn');
    if (cancelBtn) cancelBtn.classList.remove('tut-disabled');
    
    let drawBtn = document.getElementById('draw-cards-btn');
    if(drawBtn) drawBtn.style.display = 'none'; 
}

function progressTutorial() {
    if (!isTutorialMode) return;
    clearTutHighlights();

    switch(tutorialStep) {
        case 1:
            setTutMessage("<b>BEN:</b> Welcome to the board. First, let's establish a presence. Drag your <b>Squire</b> to the <b>Frontline Center</b>.");
            lockAllExcept(['p_Squire', 'p-front-center']);
            break;
        case 2:
            setTutMessage("<b>BEN:</b> Now drag your <b>Mana Core</b> to the purple <b>Ability Slot</b> in the backline.");
            lockAllExcept(['p_ManaCore', 'p-ability']);
            break;
        case 3:
            setTutMessage("<b>BEN:</b> Notice how your cards are grayed out? That's <b>Summoning Sickness</b>. Units cannot act on the turn they are placed. Spells, however, can. End your turn to pass priority to me.");
            lockAllExcept([], true, false);
            break;
        case 4:
            setTutMessage("<b>BEN:</b> I summon a Militia and an Archer. I'll end my turn.");
            break;
        case 5:
            setTutMessage("<b>BEN:</b> Before we attack, remember the Frontline/Backline system. Frontline protects the Backline. You cannot hit my Archer until my Militia falls. Let's get more Mana. Click your <b>Mana Core</b> and select <b>[Mana Initiation]</b>.");
            lockAllExcept(['p_ManaCore']);
            break;
        case 6:
            setTutMessage("<b>BEN:</b> Now click your <b>Squire</b> and queue a <b>[SHORTSWORD STRIKE]</b> on my <b>Militia</b>.");
            lockAllExcept(['p_Squire', 'e_Militia_0']);
            break;
        case 7:
            setTutMessage("<b>BEN:</b> Good. Combat doesn't happen instantly. You build a queue, then launch it all at once. Click <b>EXECUTE PENDING</b> to trigger your actions!");
            lockAllExcept([], false, true);
            break;
        case 8:
            setTutMessage("<b>BEN:</b> The execute system allows for chain reactions and combos. Now, deploy your <b>Bannerman</b> to the backline.");
            lockAllExcept(['p_Bannerman', 'p-back-left', 'p-back-right']);
            break;
        case 9:
            setTutMessage("<b>BEN:</b> Excellent. Let's end your turn.");
            lockAllExcept([], true, false);
            break;
        case 10:
            setTutMessage("<b>BEN:</b> My turn. Desperate times! My Militia initiates a Suicidal Attack on your Squire!");
            break;
        case 11:
            setTutMessage("<b>BEN:</b> Since your Squire died, conditions have been met. You can now field the <b>Great Knight</b>. Deploy him to the Frontline.");
            if(cardInstances['p_GreatKnight']) cardInstances['p_GreatKnight'].summonRequires = null; 
            lockAllExcept(['p_GreatKnight', 'p-front-left', 'p-front-center', 'p-front-right']);
            break;
        case 12:
            setTutMessage("<b>BEN:</b> Well done. Also deploy your <b>Archer</b> to the backline. Then end your turn.");
            lockAllExcept(['p_Archer', 'p-back-left', 'p-back-right'], true, false);
            break;
        case 13:
            setTutMessage("<b>BEN:</b> My Archer fires a volley at your Great Knight!");
            break;
        case 14:
            setTutMessage("<b>BEN:</b> The knight took damage. Let's use a support skill. Click your <b>Bannerman</b> and use <b>[RALLY]</b> to shield your team.");
            lockAllExcept(['p_Bannerman']);
            break;
        case 15:
            setTutMessage("<b>BEN:</b> Now have your <b>Great Knight</b> attack my Archer with <b>[HEAVY STRIKE]</b>.");
            lockAllExcept(['p_GreatKnight', 'e_Archer_1']);
            break;
        case 16:
            setTutMessage("<b>BEN:</b> Execute the queue to let the Knight strike!");
            lockAllExcept([], false, true);
            break;
        case 17:
            setTutMessage("<b>BEN:</b> My frontline is broken! Now, click your <b>Archer</b> and choose <b>[ATTACK CORE]</b>!");
            lockAllExcept(['p_Archer', 'e-core-target']);
            break;
        case 18:
            setTutMessage("<b>BEN:</b> Execute the queue one last time to claim victory!");
            lockAllExcept([], false, true);
            break;
    }
}

// --- ADVENTURER'S LICENSE LORE HANDOFF ---
function triggerLicenseQuest() {
    isTutorialMode = false;
    document.getElementById('game-area').style.display = 'none';
    document.getElementById('tavern-screen').style.display = 'block';
    
    document.getElementById('tut-overlay-msg').style.display = 'none';
    document.querySelectorAll('.target-glow, .target-line-glow, .target-heal-glow, .tut-highlight-glow, .tut-disabled').forEach(el => {
        el.classList.remove('target-glow', 'target-line-glow', 'target-heal-glow', 'tut-highlight-glow', 'tut-disabled');
    });
    document.querySelectorAll('.arrow-fx, .shuriken-fx, .slash-fx, .floating-text').forEach(el => el.remove());
    isTargeting = false;
    
    // Unlock Inventory Bag
    document.getElementById('inventory-btn').style.display = 'block';

    const tgBtn = document.getElementById('loc-tg-btn');
    if (tgBtn) {
        tgBtn.disabled = false;
        tgBtn.classList.add('unlocked');
        tgBtn.innerText = "Training Grounds";
    }

    const questDialogue = [
        "BEN: Looks like you can handle yourself pretty well. I can see you'll fit right in.",
        "BEN: Stick around, let me know if you need anything.",
        "PLAYER: Actually, Ben... I need a place to stay, and I'm short on gold. Got any cheap rooms?",
        "BEN: Ha! Well, you're in the right place. You don't need gold, but I have to abide by the kingdom's laws.",
        "BEN: I'll be needing to see your Adventurer's License. If you don't have one, it's easy enough.",
        "BEN: Just assemble a solid, legal deck of 40 cards and head to Leonia's Main Office to get licensed.",
        "BEN: You can build your collection by buying from Shops, winning table wagers, or exploring the world.",
        "BEN: Click the Bag icon at the top right to manage your Battle Deck. Let me know when you're licensed.",
        "PLAYER: Got it. Thanks, Ben!"
    ];

    dialogueIndex = 0;
    
    document.getElementById('rpg-dialogue-box').style.display = 'flex';
    document.getElementById('dialogue-text').innerText = questDialogue[0];
    
    document.getElementById('rpg-dialogue-box').onclick = () => {
        dialogueIndex++;
        if (dialogueIndex < questDialogue.length) {
            document.getElementById('dialogue-text').innerText = questDialogue[dialogueIndex];
            if(questDialogue[dialogueIndex].startsWith("PLAYER:")) {
                document.getElementById('dialogue-speaker').innerText = "You";
                document.getElementById('dialogue-speaker').style.color = "#3498db";
            } else {
                document.getElementById('dialogue-speaker').innerText = "Tavern Keeper Ben";
                document.getElementById('dialogue-speaker').style.color = "#b71c1c";
            }
        } else {
            // Dialogue is over! Hide the box and show the menu.
            document.getElementById('rpg-dialogue-box').style.display = 'none';
            document.getElementById('tavern-menu').style.display = 'flex';
        }
    };
}

// ============================================================================
// 🗺️ LOCATIONS & STRANGER DUEL EVENT
// ============================================================================

function talkToBen() {
    document.getElementById('rpg-dialogue-box').style.display = 'flex';
    document.getElementById('dialogue-speaker').innerText = "Tavern Keeper Ben";
    document.getElementById('dialogue-speaker').style.color = "#b71c1c";
    document.getElementById('dialogue-text').innerText = "Let me know when you get the License. Go check out the Training Grounds if you need to test your deck.";
    document.getElementById('rpg-dialogue-box').onclick = () => { document.getElementById('rpg-dialogue-box').style.display = 'none'; };
}

function backToLeonia() {
    document.querySelectorAll('.rpg-screen').forEach(s => s.style.display = 'none');
    document.getElementById('leonia-screen').style.display = 'block';
}

function enterTrainingGrounds() {
    document.querySelectorAll('.rpg-screen').forEach(s => s.style.display = 'none');
    const tg = document.getElementById('tg-screen');
    tg.style.display = 'block';
    tg.style.backgroundImage = "url('./assets/TG1.png')";
    document.getElementById('tg-menu').style.display = 'flex';
}

// --- STRANGERS EVENT LOGIC ---
let tgStep = 0;

function startStrangersEvent() {
    document.getElementById('tg-menu').style.display = 'none';
    document.getElementById('tg-screen').style.backgroundImage = "url('./assets/TG2.png')";
    
    tgStep = 1;
    const box = document.getElementById('tg-dialogue-box');
    box.style.display = 'flex';
    document.getElementById('tg-speaker').innerText = "You";
    document.getElementById('tg-speaker').style.color = "#3498db";
    document.getElementById('tg-text').innerText = "Hey there. I'm looking to see how to get some cards.. I need to get my Adventurer's license. You have any tips?";
}

function advanceTgDialogue() {
    if (tgStep === 1) {
        tgStep = 2;
        document.getElementById('tg-screen').style.backgroundImage = "url('./assets/TG3.png')";
        document.getElementById('tg-speaker').innerText = "Friendly Girl";
        document.getElementById('tg-speaker').style.color = "#2ecc71";
        document.getElementById('tg-text').innerText = "Oh, a newcomer! Getting a license isn't easy, but you'll need all the help you can get. Here, I have a spare spell that saved my life a few times. Take it!";
    } else if (tgStep === 2) {
        document.getElementById('tg-dialogue-box').style.display = 'none';
        presentOMTCard();
    } else if (tgStep === 3) {
        tgStep = 4;
        document.getElementById('tg-screen').style.backgroundImage = "url('./assets/TG5.png')";
        document.getElementById('tg-speaker').innerText = "Arrogant Guy";
        document.getElementById('tg-text').innerText = "Enough talk. Let me show you what a real duel looks like. Try not to cry when I crush your core!";
    } else if (tgStep === 4) {
        document.getElementById('tg-dialogue-box').style.display = 'none';
        startStrangerDuel();
    }
}

function presentOMTCard() {
    const container = document.getElementById('omt-presentation');
    container.innerHTML = '';
    
    // Attempt to load One More Time
    let link = ASSET_LINKS["One More Time"] || "";
    const data = getCardTemplate("One More Time", link); 
    const cardDOM = createCardDOM('omt_reward', data, true);
    
    cardDOM.style.transform = "scale(1.5)";
    cardDOM.style.marginBottom = "45px";
    
    container.appendChild(cardDOM);
    container.innerHTML += `<button class="menu-btn" style="background:var(--hp-color); color:black; width:100%; text-align:center;" onclick="acceptOMT()">Accept Card</button>`;
    container.style.display = 'block';
}

function acceptOMT() {
    document.getElementById('omt-presentation').style.display = 'none';
    
    // Create the new card instance
    let link = ASSET_LINKS["One More Time"] || "";
    let omtData = getCardTemplate("One More Time", link);
    let newCard = {...omtData, dbId: generateUID()};
    
    // Automatically equip it to the Battle Deck if there is space
    let placedInDeck = false;
    if(typeof battleDeckConfig !== 'undefined' && battleDeckConfig.ability) {
        for(let i = 0; i < battleDeckConfig.ability.limit; i++) {
            if(battleDeckConfig.ability.cards[i] === null) {
                battleDeckConfig.ability.cards[i] = newCard;
                placedInDeck = true;
                break;
            }
        }
    }
    
    // Fallback just in case the deck is completely full
    if(!placedInDeck && typeof playerCollection !== 'undefined') {
        playerCollection.push(newCard);
    }
    
    // Trigger Jax sequence
    tgStep = 3;
    document.getElementById('tg-screen').style.backgroundImage = "url('./assets/TG4.png')";
    const box = document.getElementById('tg-dialogue-box');
    box.style.display = 'flex';
    document.getElementById('tg-speaker').innerText = "Arrogant Guy";
    document.getElementById('tg-speaker').style.color = "#e74c3c";
    document.getElementById('tg-text').innerText = "Pfft, giving away spells to rookies? You're too soft. Kid won't last a minute out here.";
}

// --- DUEL INITIALIZATION ---
function startStrangerDuel() {
    document.getElementById('tg-screen').style.display = 'none';
    document.getElementById('game-area').style.display = 'flex';

    document.getElementById('inventory-btn').style.display = 'none';
    
    isTutorialMode = false; // Normal Rules
    tutorialLock = false;

    // Clear the inspector!
    if (typeof showInspector === 'function') showInspector('none');
    
    turnCount = 1; currentTurn = 'PLAYER';
    pMana = 8; eMana = 8; pCoreHP = 2000; eCoreHP = 2000;
    pQueue = []; eQueue = []; isExecuting = false; globalTargetedThisTurn = []; pArashiSouls = 0; pSquiresFallen = 0;
    
    // Clear previously frozen tutorial elements
    document.getElementById('hand').innerHTML = ''; 
    document.querySelectorAll('.slot .card').forEach(c => c.remove());
    
    // Pull Player Deck based heavily on their specific Inventory setup
    pDeck = [];
    if(typeof battleDeckConfig !== 'undefined') {
        Object.values(battleDeckConfig).forEach(tier => {
            tier.cards.forEach(card => {
                if(card) {
                   let template = cardLibrary.find(c => c.name === card.name);
                   if (template) pDeck.push(JSON.parse(JSON.stringify(template)));
                }
            });
        });
    }
    // Fallback logic incase player brought an empty deck
    if(pDeck.length === 0) pDeck = buildDeck(); 
    for(let i = pDeck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pDeck[i], pDeck[j]] = [pDeck[j], pDeck[i]]; }
    
    // Pull Enemy Deck (Jax's Custom Smack-Talk Deck)
    eDeck = [];
    const jaxDeckNames = ["Skeleton Warrior", "Skeleton Warrior", "Skeleton Warrior", "Zombie", "Leonian Squire", "Leonian Squire", "Jaden"];
    jaxDeckNames.forEach(name => {
        let template = cardLibrary.find(c => c.name === name);
        if(template) eDeck.push(JSON.parse(JSON.stringify(template)));
    });
    for(let i = eDeck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [eDeck[i], eDeck[j]] = [eDeck[j], eDeck[i]]; }
    
    // Update visuals
    document.getElementById('p-deck-count').innerText = pDeck.length;
    document.getElementById('e-deck-count').innerText = eDeck.length;
    document.getElementById('event-log').innerHTML = '';
    
    addLog("BATTLE COMMENCED. No combat allowed on Turn 1.", "var(--gold)");
    updateUI(); 
    
    const drawBtn = document.getElementById('draw-cards-btn');
    drawBtn.style.display = "block";
    drawBtn.innerText = "DRAW HAND";
}

// ============================================================================
// 🏆 POST-DUEL EVENT (JAX DEFEATED)
// ============================================================================
let postDuelStep = 0;

function triggerJaxPostDuel() {
    document.getElementById('game-area').style.display = 'none';
    document.getElementById('inventory-btn').style.display = 'block';
    const tgScreen = document.getElementById('tg-screen');
    tgScreen.style.display = 'block';

    // Clean up any stray UI from the duel
    document.getElementById('omt-presentation').style.display = 'none';
    document.getElementById('tg-menu').style.display = 'none';

    postDuelStep = 0;
    advancePostDuelDialogue();
}

function advancePostDuelDialogue() {
    const box = document.getElementById('tg-dialogue-box');
    box.style.display = 'flex';
    const speaker = document.getElementById('tg-speaker');
    const text = document.getElementById('tg-text');
    const tgScreen = document.getElementById('tg-screen');

    if (postDuelStep === 0) {
        tgScreen.style.backgroundImage = "url('./assets/TG6.png')";
        speaker.innerText = "";
        text.innerText = "(Jax appeared to run to escape the embarrassment.)";
    } else if (postDuelStep === 1) {
        tgScreen.style.backgroundImage = "url('./assets/TG7.png')";
        speaker.innerText = "";
        text.innerText = "(His friend shortly followed after.)";
    } else if (postDuelStep === 2) {
        tgScreen.style.backgroundImage = "url('./assets/TG8.png')";
        speaker.innerText = "Friendly Girl";
        speaker.style.color = "#2ecc71";
        text.innerText = "You really showed them their place! Hilarious.";
    } else if (postDuelStep === 3) {
        text.innerText = "It's tradition that the loser loses one of the cards to the winner. Here, choose one of these cards that he dropped. I'll find him later and return the other ones.";
    } else if (postDuelStep === 4) {
        // Hide dialog box and trigger the card selection UI
        box.style.display = 'none';
        showPostDuelCardChoice();
        return; // Pause the dialogue sequence until a card is picked
    } else if (postDuelStep === 5) {
        speaker.innerText = "Friendly Girl";
        speaker.style.color = "#2ecc71";
        text.innerText = "Good choice!";
    } else if (postDuelStep === 6) {
        text.innerText = "By the way, I own a shop on the alley. I sell different types of starter cards that you might be interested in, feel free to visit when you have time!";
    } else if (postDuelStep === 7) {
        speaker.innerText = "You";
        speaker.style.color = "#3498db";
        text.innerText = "Will do, thanks!";
    // ... (Keep previous steps 0 through 7 exactly the same) ...
    } else if (postDuelStep === 7) {
        speaker.innerText = "You";
        speaker.style.color = "#3498db";
        text.innerText = "Will do, thanks!";
    } else if (postDuelStep === 8) {
        // End of sequence: hide dialog, change to TG9, show menu with ONLY the exit button
        box.style.display = 'none';
        tgScreen.style.backgroundImage = "url('./assets/TG9.png')";
        
        document.getElementById('tg-menu').style.display = 'flex';
        
        // Hide the "Talk to the Strangers" button so they can only leave
        const talkBtn = document.getElementById('talk-strangers-btn');
        if (talkBtn) talkBtn.style.display = 'none';
        
        unlockShopsAlley();
        return;
    }

    postDuelStep++;
    // Re-bind the click event to ensure it advances this specific dialogue tree
    box.onclick = advancePostDuelDialogue;
}
function showPostDuelCardChoice() {
    const container = document.getElementById('omt-presentation');
    container.innerHTML = ''; // Clear out the old 'One More Time' UI

    const choices = [
        { name: "Zombie", key: "Zombie" },
        { name: "Skeleton Warrior", key: "Skeleton Warrior" },
        { name: "Leonian Squire", key: "Squire" } // Maps to the correct asset key
    ];

    const flexBox = document.createElement('div');
    flexBox.style.display = 'flex';
    flexBox.style.gap = '25px';
    flexBox.style.justifyContent = 'center';
    flexBox.style.marginTop = '20px';

    choices.forEach(choice => {
        const link = ASSET_LINKS[choice.key] || "";
        const data = getCardTemplate(choice.key, link);
        // createCardDOM with 'true' at the end makes it purely visual (no dragging)
        const cardDOM = createCardDOM('reward_' + choice.key.replace(/\s/g, ''), data, true);

        // Add hover effects for interactivity
        cardDOM.style.transform = "scale(1.2)";
        cardDOM.style.cursor = "pointer";
        cardDOM.style.transition = "transform 0.2s ease";

        cardDOM.onmouseover = () => cardDOM.style.transform = "scale(1.3)";
        cardDOM.onmouseout = () => cardDOM.style.transform = "scale(1.2)";

        cardDOM.onclick = () => acceptPostDuelCard(choice.name, data);

        flexBox.appendChild(cardDOM);
    });

    const title = document.createElement('h2');
    title.innerText = "CHOOSE YOUR REWARD";
    title.style.color = "var(--gold)";
    title.style.textShadow = "2px 2px 4px #000";
    title.style.marginBottom = "30px";

    container.appendChild(title);
    container.appendChild(flexBox);
    container.style.display = 'block';
}

function acceptPostDuelCard(cardName, data) {
    document.getElementById('omt-presentation').style.display = 'none';
    
    // Add the selected card to the player's bag
    let newCard = {...data, dbId: generateUID()};
    if (typeof playerCollection !== 'undefined') {
        playerCollection.push(newCard);
        if (typeof addLog === 'function') addLog(`Added ${cardName} to your collection!`, "#f1c40f");
    }

    // Advance to the next line of dialogue ("Good choice!")
    postDuelStep = 5;
    advancePostDuelDialogue();
}

function unlockShopsAlley() {
    // Only unlock the button, do NOT force the screen to change here
    const buttons = document.querySelectorAll('#leonia-screen .loc-btn');
    buttons.forEach(btn => {
        if (btn.innerText.includes("Shops Alley")) {
            btn.disabled = false;
            btn.classList.add('unlocked');
            btn.innerText = "Shops Alley";
            btn.onclick = enterShopsAlley; // Bind navigation
        }
    });
}

// ============================================================================
// 🏪 SHOPS ALLEY & GLADINE LORE EVENT
// ============================================================================

// Overwrite previous unlock function to correctly bind the click event
function unlockShopsAlley() {
    document.querySelectorAll('.rpg-screen').forEach(s => s.style.display = 'none');
    document.getElementById('leonia-screen').style.display = 'block';

    const buttons = document.querySelectorAll('#leonia-screen .loc-btn');
    buttons.forEach(btn => {
        if (btn.innerText.includes("Shops Alley")) {
            btn.disabled = false;
            btn.classList.add('unlocked');
            btn.innerText = "Shops Alley";
            btn.onclick = enterShopsAlley; // Bind navigation
        }
    });
}

function enterShopsAlley() {
    document.querySelectorAll('.rpg-screen').forEach(s => s.style.display = 'none');
    const alleyScreen = document.getElementById('shops-alley-screen');
    alleyScreen.style.display = 'block';
    // Use the dynamic CSS variable assigned during asset loading
    alleyScreen.style.backgroundImage = "var(--alleyshopbg-url)";
}

function backToShopsAlley() {
    document.querySelectorAll('.rpg-screen').forEach(s => s.style.display = 'none');
    document.getElementById('shops-alley-screen').style.display = 'block';
}

let shopDialogueStep = 0;
let hasSeenShopLore = false;

const shopDialogue = [
    { s: "Gladine", c: "#2ecc71", t: "The name's Gladine by the way, thank you so much for coming!" },
    { s: "You", c: "#3498db", t: "Nice to meet you, Gladine, my name's ADVENTURER." }, // You can swap ADVENTURER with a dynamic player name later
    { s: "Gladine", c: "#2ecc71", t: "Pleasure's all mine." },
    { s: "You", c: "#3498db", t: "I've been curious, why did the guy ran from me, like I was going to hurt him?" },
    { s: "Gladine", c: "#2ecc71", t: "Well you did broke his Core Crystals, defense so, yea you could have." },
    { s: "You", c: "#3498db", t: "I'm not following..?" },
    { s: "Gladine", c: "#2ecc71", t: "Have you been living under a rock, you're acting like you don't know the stories of old." },
    { s: "You", c: "#3498db", t: "..." },
    { s: "Gladine", c: "#2ecc71", t: "okay fine, I don't know where you've been all this years, but the story goes, Long before the empires of today drew their borders, the world was consumed by the Great Cataclysm. It was an age of ash and ruin, where humans, elves, demons, and feral beasts waged a war so absolute it threatened to unmake creation itself." },
    { s: "Gladine", c: "#2ecc71", t: "The skies wept fire, the oceans boiled, and the earth groaned under the weight of ceaseless slaughter. Chaos reigned, and the realm stood upon the very precipice of annihilation." },
    { s: "Gladine", c: "#2ecc71", t: "It was in our darkest hour that She descended—Syvia, the Creator Goddess." },
    { s: "Gladine", c: "#2ecc71", t: "Sorrowful at the devastation wrought by Her children, Syvia unleashed a magic of profound, overwhelming peace. A wave of radiant light scoured the world, stripping away all magics of mass destruction and silencing the weapons of war. With a single, divine edict, the era of unchecked bloodshed was brought to an abrupt end." },
    { s: "Gladine", c: "#2ecc71", t: "To ensure the realm would never again face such ruin, the Goddess enacted the Heavenly Restriction, reshaping the very laws of conflict. The great and terrible monsters that ravaged the lands were sealed away into mystic slates and The spirits of the noble heroes who perished in the Cataclysm were preserved and tethered to this realm. They were reborn as eternal Guardians they can be summoned at will through these cards." },
    { s: "Gladine", c: "#2ecc71", t: "But Syvia’s greatest gift was the Crystal Core. The Goddess' voice echoed throughout the land 'Let no mortal hand strike another in the fields of war. Let the soul bear the shield, and the Guardians bear the sword.'" },
    { s: "Gladine", c: "#2ecc71", t: "The Goddess bound these radiant stones to the souls of the living, giving rise to the Summoners. As long as a Summoner’s Crystal Core remains whole, they are blessed with absolute invulnerability—immune to all earthly harm, disease, and weaponry. No mortal blade or arrow can pierce this divine aegis." },
    { s: "Gladine", c: "#2ecc71", t: "Under the Covenant of Syvia, a Crystal Core can only be shattered by the might of a summoned Guardian. Thus, the apocalyptic wars of old were replaced by the honorable, tactical duels of today. It is a world still shaped by conflict, yes, but bound by heavenly law—ensuring that while our ambitions clash on the table, the world itself shall never again burn." },
    { s: "Gladine", c: "#2ecc71", t: "So that's pretty much the story. Nowadays, wars are fought by generals above a table top to fight for territories." },
    { s: "Gladine", c: "#2ecc71", t: "There are also those dark summoners. They have been trying to manipulate and experiment on Crystal Cores, that had turned it corrupted. These Corrupted Cores roam the land and should not be taken lightly." },
    { s: "Gladine", c: "#2ecc71", t: "Despite the Godess' heavenly restriction, they are and they will be able to physically hurt and kill you as the power they use is also derieved from the same one's the Godess' used, only corrupted." },
    { s: "Gladine", c: "#2ecc71", t: "But enough of that, the Captain should explain it more to you later." },
    { s: "You", c: "#3498db", t: "The Captain?" },
    { s: "Gladine", c: "#2ecc71", t: "Well you mentioned you needed your adventurer's license, my brother the captain is the one to help! He'll discuss it further with you at the barracks." },
    { s: "Gladine", c: "#2ecc71", t: "Do check my Shop if you have time!" },
    { s: "You", c: "#3498db", t: "Got it, thanks Gladine!" }
];

function enterCardShop() {
    document.querySelectorAll('.rpg-screen').forEach(s => s.style.display = 'none');
    const shopScreen = document.getElementById('card-shop-screen');
    shopScreen.style.display = 'block';
    shopScreen.style.backgroundImage = "var(--gladineshopbg-url)";
    
    if(!hasSeenShopLore) {
        shopDialogueStep = 0;
        document.getElementById('card-shop-menu').style.display = 'none';
        const box = document.getElementById('shop-dialogue-box');
        box.style.display = 'flex';
        renderShopDialogue();
    } else {
        document.getElementById('card-shop-menu').style.display = 'flex';
    }
}

function renderShopDialogue() {
    const line = shopDialogue[shopDialogueStep];
    const speaker = document.getElementById('shop-speaker');
    speaker.innerText = line.s;
    speaker.style.color = line.c;
    document.getElementById('shop-text').innerText = line.t;
}

function advanceShopDialogue() {
    shopDialogueStep++;
    if (shopDialogueStep < shopDialogue.length) {
        renderShopDialogue();
    } else {
        hasSeenShopLore = true;
        document.getElementById('shop-dialogue-box').style.display = 'none';
        document.getElementById('card-shop-menu').style.display = 'flex';
        unlockBarracks();
    }
}

// ============================================================================
// 🛡️ BARRACKS & CAPTAIN THORNE LORE EVENT
// ============================================================================

// Overwrite the placeholder unlock function so it navigates correctly
function unlockBarracks() {
    const buttons = document.querySelectorAll('#leonia-screen .loc-btn');
    buttons.forEach(btn => {
        if (btn.innerText.includes("Barracks")) {
            btn.disabled = false;
            btn.classList.add('unlocked');
            btn.innerText = "Barracks";
            btn.onclick = enterBarracks; // Bind navigation
        }
    });
}

function enterBarracks() {
    document.querySelectorAll('.rpg-screen').forEach(s => s.style.display = 'none');
    const bgScreen = document.getElementById('barracks-gate-screen');
    bgScreen.style.display = 'block';
    bgScreen.style.backgroundImage = "var(--bk1-url)";
}

function enterBarracksInside() {
    document.querySelectorAll('.rpg-screen').forEach(s => s.style.display = 'none');
    const biScreen = document.getElementById('barracks-inside-screen');
    biScreen.style.display = 'block';
    biScreen.style.backgroundImage = "var(--bk3-url)";
}

function backToBarracksGate() {
    document.querySelectorAll('.rpg-screen').forEach(s => s.style.display = 'none');
    document.getElementById('barracks-gate-screen').style.display = 'block';
}

let thorneDialogueStep = 0;
let hasSeenThorneLore = false;

const thorneDialogue = [
    { s: "Captain Thorne", c: "#e74c3c", t: "You must be the new face Gladine mentioned. I'm Captain Thorne. My sister asked me to look out for you, and I honor my word. But understand this—the Barracks is no tavern." },
    { s: "You", c: "#3498db", t: "I appreciate the help, Captain. I'm ready to pull my weight." },
    { s: "Captain Thorne", c: "#e74c3c", t: "Good. See that Garrison Quest Board over there? That's where you'll accept jobs. Complete them, and you'll earn gold and materials to upgrade your deck." },
    { s: "Captain Thorne", c: "#e74c3c", t: "But don't take these tasks lightly. If ordinary folk could handle these problems, they wouldn't be paying us to do it. You risk your neck out there." },
    { s: "You", c: "#3498db", t: "What exactly am I going up against?" },
    { s: "Captain Thorne", c: "#e74c3c", t: "Listen closely, because I despise repeating myself. The threats out there vary. First, you have the minor Wisps. They're playful nuisances. They'll cast a trap spell on you just to force a duel. They're relatively harmless, and I trust you can take them on without breaking a sweat." },
    { s: "You", c: "#3498db", t: "Sounds easy enough. Are all wisps like that?" },
    { s: "Captain Thorne", c: "#e74c3c", t: "Not quite. If you see a Gold Wisp, stay sharp. They are much harder and far more dangerous. However, taking one down yields a heavy purse and, on occasion, a very rare ability card." },
    { s: "You", c: "#3498db", t: "Wisps I can handle. What about actual people?" },
    { s: "Captain Thorne", c: "#e74c3c", t: "Rogues. Outlaws who use the same trap spells to ambush travelers. They're cunning—much smarter than any wisp. Defeat them on the board, but don't just leave them out there. Turn them in so we can lock them up here in the barracks." },
    { s: "You", c: "#3498db", t: "Got it. Wisps and Rogues. Anything else?" },
    { s: "Captain Thorne", c: "#e74c3c", t: "Yes. The real threat. Corrupted Crystal Cores. They tear through portals into our lands in events we call Invasions. They spread absolute destruction. It takes about twenty elite soldiers to bring one down... but it is far easier if a Summoner handles it." },
    { s: "You", c: "#3498db", t: "Twenty? That's intense. How do I fight something like that?" },
    { s: "Captain Thorne", c: "#e74c3c", t: "By knowing your limits. They come in different colors representing their corruption level. Blue and Green cores are manageable—just a step up from a Wisp. You can handle those." },
    { s: "You", c: "#3498db", t: "And the others?" },
    { s: "Captain Thorne", c: "#e74c3c", t: "Purple Cores are tough sons of... well, they're brutal. I advise you to leave those to the veteran summoners. And finally... the Red ones." },
    { s: "You", c: "#3498db", t: "Let me guess. Don't engage?" },
    { s: "Captain Thorne", c: "#e74c3c", t: "Run. As soon as possible. You call for backup and you never, ever take a Red Core on alone. Am I clear?" },
    { s: "You", c: "#3498db", t: "Crystal clear, Captain." },
    { s: "Captain Thorne", c: "#e74c3c", t: "Good. If you don't have any questions, go ahead and check the Quest Board. Let's see what you're made of." }
];

function talkToThorne() {
    if(!hasSeenThorneLore) {
        thorneDialogueStep = 0;
        document.getElementById('barracks-menu').style.display = 'none';
        document.getElementById('barracks-dialogue-box').style.display = 'flex';
        renderThorneDialogue();
    } else {
        // Repeated chatter if the player talks to him again
        document.getElementById('barracks-menu').style.display = 'none';
        document.getElementById('barracks-dialogue-box').style.display = 'flex';
        document.getElementById('barracks-speaker').innerText = "Captain Thorne";
        document.getElementById('barracks-speaker').style.color = "#e74c3c";
        document.getElementById('barracks-text').innerText = "Check the Garrison Quest Board if you're looking for work. Keep your guard up.";
        
        // Temporarily change the click behavior to just close the box
        document.getElementById('barracks-dialogue-box').onclick = () => {
            document.getElementById('barracks-dialogue-box').style.display = 'none';
            document.getElementById('barracks-menu').style.display = 'flex';
            document.getElementById('barracks-dialogue-box').onclick = advanceThorneDialogue; // Restore original
        };
    }
}

function renderThorneDialogue() {
    const line = thorneDialogue[thorneDialogueStep];
    const speaker = document.getElementById('barracks-speaker');
    speaker.innerText = line.s;
    speaker.style.color = line.c;
    document.getElementById('barracks-text').innerText = line.t;
}

function advanceThorneDialogue() {
    thorneDialogueStep++;
    if (thorneDialogueStep < thorneDialogue.length) {
        renderThorneDialogue();
    } else {
        hasSeenThorneLore = true;
        document.getElementById('barracks-dialogue-box').style.display = 'none';
        document.getElementById('barracks-menu').style.display = 'flex';
        
        // Dialogue is over, unlock the Garrison Board Quest!
        const boardBtn = document.getElementById('garrison-board-btn');
        if(boardBtn) {
            boardBtn.disabled = false;
            boardBtn.classList.add('unlocked');
            boardBtn.innerText = "Garrison Board Quest";
        }
    }
}

// ============================================================================
// 📋 GARRISON QUEST BOARD LOGIC
// ============================================================================

let quests = {
    wisp_hunt: {
        id: 'wisp_hunt',
        title: "Wisp Hunt",
        objective: "Hunt 3 Wisps in the Eastern Pass.",
        reward: "1,000 Gold",
        description: "We've had reports of pesky Wisps causing trouble for merchants traveling through the Eastern Pass. Clear them out before they cause serious damage or lure in larger threats.<br><br><em>- Captain Thorne</em>",
        isAccepted: false,
        isCompleted: false,
        progress: 0,      // Tracks how many killed
        maxProgress: 3    // Goal to finish
    }
};
function openGarrisonBoard() {
    // Hide the barracks menu buttons and show the board
    document.getElementById('barracks-menu').style.display = 'none';
    document.getElementById('garrison-board-ui').style.display = 'block';
}

function closeGarrisonBoard() {
    // Hide the board and restore the barracks menu buttons
    document.getElementById('garrison-board-ui').style.display = 'none';
    document.getElementById('barracks-menu').style.display = 'flex';
}

function viewQuest(questId) {
    const quest = quests[questId];
    const pane = document.getElementById('quest-details-pane');
    
    // Create the "1/3" text if the quest is accepted
    let progressText = quest.isAccepted ? `<p style="color: #2ecc71; font-weight: bold; font-size: 1.2rem; margin-top: 10px;">Progress: ${quest.progress} / ${quest.maxProgress} Wisps Defeated</p>` : '';

    // Dynamically change the button based on the quest's state
    let btnText = 'ACCEPT QUEST';
    let btnStyle = '';
    let btnAction = `acceptQuest('${quest.id}')`;
    let btnDisabled = '';

    if (quest.isCompleted) {
        btnText = 'COMPLETED';
        btnStyle = 'background: #27ae60; color: white; border: 1px solid #2ecc71;';
        btnDisabled = 'disabled';
    } else if (quest.progress >= quest.maxProgress) {
        btnText = 'CLAIM REWARD';
        btnStyle = 'background: #f1c40f; color: black; border: 1px solid #f39c12; text-shadow: none;';
        btnAction = `claimQuestReward('${quest.id}')`;
    } else if (quest.isAccepted) {
        btnText = 'QUEST ACCEPTED';
        btnStyle = 'background: #333; color: #888; border: 1px solid #555;';
        btnDisabled = 'disabled';
    }

    pane.innerHTML = `
        <h2 style="color:var(--gold); margin-top:0; font-family:'Cinzel'; font-size: 2rem;">${quest.title}</h2>
        <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 6px; border-left: 3px solid #3498db; margin-bottom: 20px;">
            <p style="margin: 0 0 10px 0; color: #fff;"><strong>Objective:</strong> <span style="color:#3498db;">${quest.objective}</span></p>
            <p style="margin: 0; color: #fff;"><strong>Reward:</strong> <span style="color:#f1c40f;">${quest.reward}</span></p>
            ${progressText}
        </div>
        <p style="color:#ddd; font-size: 1.1rem; line-height: 1.6;">${quest.description}</p>
        
        <button class="btn-main" style="margin-top: 30px; width: 100%; padding: 15px; ${btnStyle}" ${btnDisabled} onclick="${btnAction}">
            ${btnText}
        </button>
    `;
}

function claimQuestReward(questId) {
    if (questId === 'wisp_hunt') {
        quests.wisp_hunt.isCompleted = true;
        
        if (typeof playerGold !== 'undefined') {
            playerGold += 1000;
            if (typeof updateGoldUI === 'function') updateGoldUI();
        }
        
        if (typeof playClickSound === 'function') playClickSound();
        alert("Quest Completed! 1,000 Gold has been added to your purse.");
        
        // Refresh the UI to show the green "COMPLETED" state
        viewQuest(questId);
    }
}

function acceptQuest(questId) {
    if (questId === 'wisp_hunt') {
        quests.wisp_hunt.isAccepted = true;
        
        // Log & Notify
        if (typeof addLog === 'function') addLog("Accepted Quest: Wisp Hunt!", "#3498db");
        if (typeof playClickSound === 'function') playClickSound();
        alert("Quest Accepted: Wisp Hunt!\nThe City Gate is now unlocked.");
        
        // Unlock the Gate in Leonia Screen
        const gateBtn = document.getElementById('loc-gate-btn');
        if (gateBtn) {
            gateBtn.disabled = false;
            gateBtn.classList.add('unlocked');
            gateBtn.innerText = "City Gate";
        }
        
        // Refresh the UI to show the button as disabled/accepted
        viewQuest(questId);
    }
}

// ============================================================================
// 🗺️ GATE & EXPLORATION NAVIGATION
// ============================================================================

function enterGate() {
    document.querySelectorAll('.rpg-screen').forEach(s => s.style.display = 'none');
    const gateScreen = document.getElementById('gate-screen');
    gateScreen.style.display = 'block';
    
    // Setting background directly or via CSS variable. Assuming './assets/Gate.png'
    gateScreen.style.backgroundImage = "url('./assets/Gate.png')"; 
}

function backToGate() {
    document.querySelectorAll('.rpg-screen').forEach(s => s.style.display = 'none');
    document.getElementById('gate-screen').style.display = 'block';
}

function enterEasternPass() {
    document.querySelectorAll('.rpg-screen').forEach(s => s.style.display = 'none');
    const epScreen = document.getElementById('eastern-pass-screen');
    epScreen.style.display = 'block';
    // Inherits Gate background or uses its own if you have one
    epScreen.style.backgroundImage = "url('./assets/Gate.png')"; 
}

function backToEasternPass() {
    document.querySelectorAll('.rpg-screen').forEach(s => s.style.display = 'none');
    document.getElementById('eastern-pass-screen').style.display = 'block';
}

function enterEasternMountainPass() {
    document.querySelectorAll('.rpg-screen').forEach(s => s.style.display = 'none');
    const empScreen = document.getElementById('eastern-mountain-pass-screen');
    empScreen.style.display = 'block';
    empScreen.style.backgroundImage = "url('./assets/Eastern Mountain Pass Watch.png')";
}

// --- PATROL STATE VARIABLES ---
let patrolProgress = 0;
let encounterChance = 5;
let patrolTimer = null;
let chanceTimer = null;

function startPatrol() {
    if (typeof playClickSound === 'function') playClickSound();
    
    // Hide all screens and show the new Patrol Screen
    document.querySelectorAll('.rpg-screen').forEach(s => s.style.display = 'none');
    const patrolScreen = document.getElementById('patrol-screen');
    patrolScreen.style.display = 'block';
    
    patrolScreen.style.backgroundImage = "url('./assets/Eastern Mountain Pass Watch.png')";
    
    // Reset state and setup marker
    patrolProgress = 0;
    encounterChance = 5;
    const marker = document.getElementById('player-patrol-marker');
    marker.style.left = '0%';
    marker.classList.remove('retreating');
    marker.classList.add('marching');

    // Kick off the movement and RNG loops
    startPatrolLoops();
}

function startPatrolLoops() {
    // 1. The Movement Loop (Calculated for exactly 2 minutes)
    patrolTimer = setInterval(() => {
        patrolProgress += (100 / 1200); // Moves 0.0833% every 100ms
        document.getElementById('player-patrol-marker').style.left = patrolProgress + '%';
        
        // Win Condition: Reached the end of the patrol route
        if (patrolProgress >= 100) {
            clearInterval(patrolTimer);
            clearInterval(chanceTimer);
            
            // Give a small reward for a safe patrol, then head home
            if (typeof addLog === 'function') addLog("Patrol completed safely! Area secure.", "#2ecc71");
            returnToLeonia();
        }
    }, 100);

    // 2. The Encounter RNG Loop (runs every 10 seconds)
    chanceTimer = setInterval(() => {
        encounterChance += 5; // Increase chance by 5%
        
        let roll = Math.random() * 100;
        // Keeping the F12 log here so you can watch the tension build!
        console.log(`Searching for Wisps... Needed: <${encounterChance} | Rolled: ${roll.toFixed(2)}`);
        
        if (roll < encounterChance) {
            triggerEncounter();
        }
    }, 10000); 
}

function triggerEncounter() {
    // Pause the movement and RNG timers
    clearInterval(patrolTimer);
    clearInterval(chanceTimer);
    
    // Stop the visual marching trail
    document.getElementById('player-patrol-marker').classList.remove('marching');
    
    // Show the flashy overlay
    document.getElementById('encounter-overlay').style.display = 'flex';
}

function escapeEncounter() {
    if (typeof playClickSound === 'function') playClickSound();
    
    // Hide the overlay
    document.getElementById('encounter-overlay').style.display = 'none';
    
    // Restart the visual trail and resume the loops
    document.getElementById('player-patrol-marker').classList.add('marching');
    startPatrolLoops();
}

function returnToLeonia() {
    if (typeof playClickSound === 'function') playClickSound();
    
    // Stop any forward marching
    clearInterval(patrolTimer);
    clearInterval(chanceTimer);
    
    const marker = document.getElementById('player-patrol-marker');
    marker.classList.remove('marching');
    marker.classList.add('retreating');
    
    // Reverse movement loop (moves back to 0% twice as fast)
    let retreatTimer = setInterval(() => {
        patrolProgress -= 1.0; 
        marker.style.left = Math.max(0, patrolProgress) + '%';
        
        // Once we hit the start, load the main map
        if (patrolProgress <= 0) {
            clearInterval(retreatTimer);
            marker.classList.remove('retreating');
            
            document.querySelectorAll('.rpg-screen').forEach(s => s.style.display = 'none');
            document.getElementById('leonia-screen').style.display = 'block';
        }
    }, 50);
}

// Keep this as a placeholder for the next phase
function startWispDuel() {
    document.getElementById('encounter-overlay').style.display = 'none';
    console.log("Setting up Wisp Duel... Need to pull Wisp Deck and transition to game-area.");
}

// ============================================================================
// ⚔️ WISP DEFEAT & QUEST PROGRESSION
// ============================================================================

function processWispDefeat() {
    let quest = quests.wisp_hunt;
    
    // Only increment if the quest is active and not already finished
    if (quest.isAccepted && !quest.isCompleted && quest.progress < quest.maxProgress) {
        quest.progress++;
        
        if (quest.progress < quest.maxProgress) {
            if (typeof addLog === 'function') addLog(`Quest Progress: Hunted Wisps ${quest.progress}/3`, "#3498db");
        } else {
            if (typeof addLog === 'function') addLog("Wisp Hunt Complete! Return to the Garrison Board.", "#2ecc71");
            // Optional: Play a victory chime here!
        }
    }
}

function endWispDuel() {
    // 1. Hide the game area
    document.getElementById('game-area').style.display = 'none';
    
    // 2. Return to the Eastern Mountain Pass so they can patrol again
    document.getElementById('eastern-mountain-pass-screen').style.display = 'block';
    
    // 3. Restore the inventory button
    document.getElementById('inventory-btn').style.display = 'block';
    
    // 4. Update the quest math
    processWispDefeat();
    
    // 5. Give a small immediate reward for the skirmish
    if (typeof playerGold !== 'undefined') {
        playerGold += 50; 
        if (typeof updateGoldUI === 'function') updateGoldUI();
    }
}

// ============================================================================
// ⚔️ WISP ENCOUNTER DUEL INITIALIZATION
// ============================================================================
function startWispDuel() {
    if (typeof playClickSound === 'function') playClickSound();
    
    // 1. Hide Patrol & Encounter UI, Show Battlefield
    document.getElementById('encounter-overlay').style.display = 'none';
    document.getElementById('patrol-screen').style.display = 'none';
    
    clearInterval(patrolTimer);
    clearInterval(chanceTimer);

    document.getElementById('game-area').style.display = 'flex';
    document.getElementById('inventory-btn').style.display = 'none';
    
    // 2. Reset Game States
    isTutorialMode = false; 
    tutorialLock = false;

    if (typeof showInspector === 'function') showInspector('none');
    
    turnCount = 1; currentTurn = 'PLAYER';
    pMana = 8; eMana = 8; 
    pCoreHP = 2000; 
    eCoreHP = 1000; // Wisps are weaker, making for a faster skirmish!
    pQueue = []; eQueue = []; isExecuting = false; globalTargetedThisTurn = []; pArashiSouls = 0; pSquiresFallen = 0;
    
    // 3. Clear the board from any previous games
    document.getElementById('hand').innerHTML = ''; 
    document.querySelectorAll('.slot .card').forEach(c => c.remove());
    
    // 4. Pull the Player's Deck from their Inventory Bag
    pDeck = [];
    if(typeof battleDeckConfig !== 'undefined') {
        Object.values(battleDeckConfig).forEach(tier => {
            tier.cards.forEach(card => {
                if(card) {
                   let template = cardLibrary.find(c => c.name === card.name);
                   if (template) pDeck.push(JSON.parse(JSON.stringify(template)));
                }
            });
        });
    }
    // Fallback just in case their bag is empty
    if(pDeck.length === 0) pDeck = buildDeck(); 
    for(let i = pDeck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pDeck[i], pDeck[j]] = [pDeck[j], pDeck[i]]; }
    
    // 5. Build the Wisp Enemy Deck (Exactly 4-6 Wisps total)
    eDeck = [];
    let wispTemplate = cardLibrary.find(c => c.name === "Wisp");
    
    // Roll RNG for exactly 4, 5, or 6 Wisps
    let wispPackSize = Math.floor(Math.random() * 3) + 4; 
    
    if (wispTemplate) {
        for (let k = 0; k < wispPackSize; k++) {
            eDeck.push(JSON.parse(JSON.stringify(wispTemplate)));
        }
    }
    
    // We don't even need to shuffle because they are all the same card!
    
    // 6. Update Visuals & Start Match
    document.getElementById('p-deck-count').innerText = pDeck.length;
    document.getElementById('e-deck-count').innerText = eDeck.length;
    document.getElementById('event-log').innerHTML = '';
    
    addLog("ENCOUNTER: WILD WISP! The enemy's core is relatively weak.", "var(--hp-color)");
    addLog("BATTLE COMMENCED. No combat allowed on Turn 1.", "var(--gold)");
    
    updateUI(); 
    
    const drawBtn = document.getElementById('draw-cards-btn');
    drawBtn.style.display = "block";
    drawBtn.innerText = "DRAW HAND";
}

// ============================================================================
// 🚶‍♂️ PATROL ATMOSPHERE LOGIC
// ============================================================================

let patrolTimer = null;

function spawnPatrolText() {
    const phrases = [
        "Patrolling the Eastern Pass...",
        "Scouting the valley...",
        "Continuous walking...",
        "The wind howls through the trees...",
        "Watching for movement in the brush...",
        "Footsteps echo on the mountain path..."
    ];

    // Pick a random phrase
    let text = phrases[Math.floor(Math.random() * phrases.length)];

    // Create the visual element
    let textEl = document.createElement('div');
    textEl.className = 'patrol-text';
    textEl.innerText = text;

    // Optional: Add a tiny random offset so they don't appear in the EXACT same pixel every time
    let yOffset = Math.floor(Math.random() * 40) - 20; 
    textEl.style.marginTop = `${yOffset}px`;

    document.body.appendChild(textEl);

    // Delete the element from the game code after the CSS animation finishes (3 seconds)
    setTimeout(() => {
        if(textEl) textEl.remove();
    }, 3000);
}

// Call this when they enter the patrol map
function startPatrolAtmosphere() {
    // Clear any existing timer just to be safe
    if (patrolTimer) clearInterval(patrolTimer);
    
    // Spawn the first text immediately
    spawnPatrolText();
    
    // Loop it every 3.5 seconds
    patrolTimer = setInterval(spawnPatrolText, 3500);
}

// Call this when combat starts or they leave the map
function stopPatrolAtmosphere() {
    if (patrolTimer) {
        clearInterval(patrolTimer);
        patrolTimer = null;
    }
}
