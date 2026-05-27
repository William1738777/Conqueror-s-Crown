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

    cardInstances = {};
    eHandData = [];
    
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
    tgStep = 0;
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
    { s: "You", c: "#3498db", t: "Nice to meet you, Gladine, my name's ADVENTURER." }, 
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
    if (typeof playClickSound === 'function') playClickSound();
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

function unlockBarracks() {
    const buttons = document.querySelectorAll('#leonia-screen .loc-btn');
    buttons.forEach(btn => {
        if (btn.innerText.includes("Barracks")) {
            btn.disabled = false;
            btn.classList.add('unlocked');
            btn.innerText = "Barracks";
            
            btn.onclick = () => {
                if (typeof playClickSound === 'function') playClickSound();
                document.querySelectorAll('.rpg-screen').forEach(s => s.style.display = 'none');
                const bgScreen = document.getElementById('barracks-gate-screen');
                if (bgScreen) {
                    bgScreen.style.display = 'block';
                    bgScreen.style.backgroundImage = "var(--bk1-url, url('./assets/BK1.png'))";
                }
            };
        }
    });
}

window.enterBarracksInside = function() {
    if (typeof playClickSound === 'function') playClickSound();
    document.querySelectorAll('.rpg-screen').forEach(s => s.style.display = 'none');
    
    const biScreen = document.getElementById('barracks-inside-screen');
    if (biScreen) {
        biScreen.style.display = 'block';
        biScreen.style.backgroundImage = "var(--bk3-url, url('./assets/BK3.png'))";
    }
};

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

let northsidePostDialogueStep = 0;
let hasSeenNorthsidePostLore = false;

const northsidePostDialogue = [
    { s: "You", c: "#3498db", t: "Captain! Goblins... and a lot of them. I was ambushed by the Old Watchtower. They definitely know what happened to the villagers." },
    { s: "Captain Thorne", c: "#e74c3c", t: "Damn those rats! I knew it wouldn't be a simple disappearance." },
    { s: "Captain Thorne", c: "#e74c3c", t: "It's not just the goblins. Scouts from across the borders are reporting back. Beastmen, Lizardmen, and other wild factions have been raiding settlements and taking the villagers." },
    { s: "You", c: "#3498db", t: "Just tell me where you need me. I can help." },
    { s: "Captain Thorne", c: "#e74c3c", t: "Follow the trail of the goblin host you encountered. Our scouts note that while other wild factions are executing the raids, they appear to be taking orders from goblin leaders." },
    { s: "Captain Thorne", c: "#e74c3c", t: "Which means it is highly probable the mastermind behind these coordinated attacks is within the Goblin faction." },
    { s: "Captain Thorne", c: "#e74c3c", t: "I'll be assembling Leonia's forces. In the meantime, I need you to push forward into the Hilltops and find out exactly what they're up to!" },
    { s: "Captain Thorne", c: "#e74c3c", t: "I've authorized a new deployment order. Check the Garrison Board, accept the task, and move out." }
];

function talkToThorne() {
    if (typeof playClickSound === 'function') playClickSound();

    if (!hasSeenThorneLore) {
        thorneDialogueStep = 0;
        document.getElementById('barracks-menu').style.display = 'none';
        document.getElementById('barracks-dialogue-box').style.display = 'flex';
        renderThorneDialogue(); 
        
    } else if (quests.northside_investigation && quests.northside_investigation.progress >= 1 && !hasSeenNorthsidePostLore) {
        northsidePostDialogueStep = 0;
        document.getElementById('barracks-menu').style.display = 'none';
        document.getElementById('barracks-dialogue-box').style.display = 'flex';
        
        document.getElementById('barracks-dialogue-box').onclick = advanceNorthsidePostDialogue;
        renderNorthsidePostDialogue();
        
    } else {
        document.getElementById('barracks-menu').style.display = 'none';
        document.getElementById('barracks-dialogue-box').style.display = 'flex';
        document.getElementById('barracks-speaker').innerText = "Captain Thorne";
        document.getElementById('barracks-speaker').style.color = "#e74c3c";
        
        if (hasSeenNorthsidePostLore) {
            document.getElementById('barracks-text').innerText = "Don't just stand there. Accept the new orders from the board and get to the Hilltops!";
        } else {
            document.getElementById('barracks-text').innerText = "Check the Garrison Quest Board if you're looking for work. Keep your guard up.";
        }
        
        document.getElementById('barracks-dialogue-box').onclick = () => {
            if (typeof playClickSound === 'function') playClickSound();
            document.getElementById('barracks-dialogue-box').style.display = 'none';
            document.getElementById('barracks-menu').style.display = 'flex';
            document.getElementById('barracks-dialogue-box').onclick = advanceThorneDialogue; // Restore safety
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
    if (typeof playClickSound === 'function') playClickSound();
    thorneDialogueStep++;
    if (thorneDialogueStep < thorneDialogue.length) {
        renderThorneDialogue();
    } else {
        hasSeenThorneLore = true;
        document.getElementById('barracks-dialogue-box').style.display = 'none';
        document.getElementById('barracks-menu').style.display = 'flex';
        
        const boardBtn = document.getElementById('garrison-board-btn');
        if (boardBtn) {
            boardBtn.disabled = false;
            boardBtn.classList.add('unlocked');
            boardBtn.innerText = "Garrison Board Quest";
        }
    }
}

function renderNorthsidePostDialogue() {
    const line = northsidePostDialogue[northsidePostDialogueStep];
    const speaker = document.getElementById('barracks-speaker');
    speaker.innerText = line.s;
    speaker.style.color = line.c;
    document.getElementById('barracks-text').innerText = line.t;
}

function advanceNorthsidePostDialogue() {
    if (typeof playClickSound === 'function') playClickSound();
    northsidePostDialogueStep++;
    
    if (northsidePostDialogueStep < northsidePostDialogue.length) {
        renderNorthsidePostDialogue();
    } else {
        hasSeenNorthsidePostLore = true;
        
        // Clean up UI
        document.getElementById('barracks-dialogue-box').style.display = 'none';
        document.getElementById('barracks-menu').style.display = 'flex';
        document.getElementById('barracks-dialogue-box').onclick = advanceThorneDialogue;

        // Automatically complete the quest and give rewards right as the dialogue ends!
        if (typeof claimQuestReward === 'function' && quests.northside_investigation && !quests.northside_investigation.isCompleted) {
            claimQuestReward('northside_investigation');
        }

        // Trigger the new quest creation
        unlockNorthsidePart2Quest();

        // Trigger the epic map unlock floating text
        if (typeof unlockNorthsideHilltops === 'function') unlockNorthsideHilltops();
    }
}

function unlockNorthsidePart2Quest() {
    // 1. Add quest to the database
    quests.northside_part2 = {
        id: 'northside_part2',
        title: "Northside Whereabouts: Part 2",
        objective: "Push forward and secure the Northside Hilltops.",
        reward: "3,500 Gold & Epic Core",
        description: "Scouts have confirmed the goblins are operating from the Hilltops and organizing the regional raids. Your orders are to engage the enemy frontline, break their defensive perimeter, and secure the high ground.<br><br><em>- Captain Thorne</em>",
        isAccepted: false,
        isCompleted: false,
        progress: 0,      
        maxProgress: 1,    
        cooldownUntil: 0
    };
    
    // 2. Dynamically add the button to the Garrison Board UI
    const questListDiv = document.querySelector('#garrison-board-ui > div > div:first-child');
    if(questListDiv && !document.getElementById('btn-quest-northside-part2')) {
        const newBtn = document.createElement('button');
        newBtn.id = 'btn-quest-northside-part2';
        newBtn.className = 'menu-btn unlocked';
        newBtn.style.width = '100%';
        newBtn.style.textAlign = 'left';
        newBtn.style.marginBottom = '10px';
        newBtn.style.color = "#f1c40f";
        newBtn.innerText = "[E-Rank] Northside Whereabouts Pt. 2";
        newBtn.onclick = () => viewQuest('northside_part2');
        questListDiv.appendChild(newBtn);
    }
    
    if (typeof addLog === 'function') addLog("New Deployment Order Available: Northside Part 2!", "#f1c40f");
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
        isCompleted: false, // We no longer permanently lock the quest
        progress: 0,      
        maxProgress: 3,    
        cooldownUntil: 0  // --- NEW: Tracks when the quest can be accepted again ---
    }
};

function openGarrisonBoard() {
    // Hide the barracks menu buttons and show the board
    document.getElementById('barracks-menu').style.display = 'none';
    document.getElementById('garrison-board-ui').style.display = 'block';
    
    // Clear the right side details pane to mirror the Guard shop initialization
    const pane = document.getElementById('quest-details-pane');
    if (pane) {
        pane.innerHTML = `<div style="text-align:center; color:#666; margin-top:50%; font-style:italic; font-size:0.9rem;">Select a quest assignment.</div>`;
    }
}

function closeGarrisonBoard() {
    if (typeof playClickSound === 'function') playClickSound();
    
    // 1. Hide the Board UI
    document.getElementById('garrison-board-ui').style.display = 'none';
    
    // 2. Bring back Captain Thorne's Menu
    document.getElementById('barracks-menu').style.display = 'flex';
    
    // 3. Reset the Inspector Pane so it's fresh for the next time you open it
    const pane = document.getElementById('quest-details-pane');
    if (pane) {
        pane.innerHTML = `<h3 style="color:#888; text-align:center; margin-top:25%; font-style: italic;">Select a quest from the board to view details.</h3>`;
    }
}

function viewQuest(questId) {
    const quest = quests[questId];
    const pane = document.getElementById('quest-details-pane');
    if (!pane) return;

    // --- 1. Star Rating based on quest level ---
    let stars = questId === 'northside_investigation' ? '★★☆☆☆☆☆' : '★☆☆☆☆☆☆';
    let difficultyText = questId === 'northside_investigation' ? 'F-Rank Story Quest' : 'E-Rank Bounty';

   // --- 2. AQW Progress Tracker Sub-Panel ---
    let progressTracker = '';
    
    if (quest.isCompleted) {
        // 🛠️ FIX: Clean visual state for finished story quests
        progressTracker = `
            <div style="background: rgba(0,0,0,0.6); border: 1px solid #27ae60; border-radius: 6px; padding: 12px; text-align: center; margin-bottom: 15px; box-shadow: inset 0 0 10px rgba(39, 174, 96, 0.3);">
                <span style="color:#27ae60; font-weight:bold; letter-spacing: 1px; font-size:0.9rem;">MISSION ACCOMPLISHED</span>
            </div>
        `;
    } else if (quest.isAccepted && quest.progress < quest.maxProgress) {
        progressTracker = `
            <div style="background: rgba(0,0,0,0.6); border: 1px solid #3498db; border-radius: 6px; padding: 12px; text-align: center; margin-bottom: 15px; box-shadow: inset 0 0 10px rgba(52,152,219,0.2);">
                <span style="color:#3498db; font-weight:bold; letter-spacing: 1px; font-size:0.9rem;">GOAL IN PROGRESS</span>
                <div style="color:#fff; font-size:1.1rem; font-weight:bold; margin: 5px 0;">${quest.progress} / ${quest.maxProgress}</div>
                <div style="font-size:0.8rem; color:#aaa; font-style:italic;">${quest.objective}</div>
            </div>
        `;
    } else if (quest.isAccepted && quest.progress >= quest.maxProgress) {
        progressTracker = `
            <div style="background: rgba(0,0,0,0.6); border: 1px solid #2ecc71; border-radius: 6px; padding: 12px; text-align: center; margin-bottom: 15px; box-shadow: inset 0 0 10px rgba(46,204,113,0.3);">
                <span style="color:#2ecc71; font-weight:bold; letter-spacing: 1px; font-size:0.9rem;">REQUIREMENTS MET</span>
                <div style="font-size:0.8rem; color:#aaa; margin-top:3px;">Ready to turn in to Captain Thorne.</div>
            </div>
        `;
    }

    // --- 3. Dynamic Side-Panel Action Buttons ---
    let actionButtons = '';
    let actionType = 'accept';
    let now = Date.now();

    if (quest.isCompleted && questId === 'northside_investigation') {
        // 🛠️ FIX: Permanently lock the button so it can't be accepted twice
        actionButtons = `<button class="btn-main" style="width:100%; background:#27ae60; color:#fff; border:1px solid #2ecc71; cursor:not-allowed;" disabled>STORY CLEARED</button>`;
        actionType = 'completed';
    } else if (quest.cooldownUntil && now < quest.cooldownUntil) {
        let remainingMins = Math.ceil((quest.cooldownUntil - now) / 60000);
        actionButtons = `<button class="btn-main" id="quest-action-btn" style="width:100%; background:#555; color:#aaa; border:1px solid #444; cursor:not-allowed;" disabled>ON COOLDOWN (${remainingMins}m)</button>`;
        actionType = 'cooldown';
    } else if (quest.progress >= quest.maxProgress && quest.isAccepted) {
        actionButtons = `<button class="btn-main" id="quest-action-btn" style="width:100%; background:#f1c40f; color:#000; font-weight:bold; box-shadow: 0 0 15px rgba(241, 196, 15, 0.4); border:1px solid #f39c12;">CLAIM REWARDS</button>`;
        actionType = 'claim';
    } else if (quest.isAccepted) {
        actionButtons = `<button class="btn-main" id="quest-action-btn" style="width:100%; background:#333; color:#888; border:1px solid #555; cursor:not-allowed;" disabled>QUEST IN PROGRESS</button>`;
        actionType = 'active';
    } else {
        actionButtons = `
            <div style="display:flex; gap:10px; width:100%;">
                <button class="btn-main" style="flex:1; background:#e74c3c; color:#fff; border:1px solid #c0392b;" onclick="closeGarrisonBoard()">DECLINE</button>
                <button class="btn-main" id="quest-action-btn" style="flex:1; background:#2ecc71; color:#000; font-weight:bold; box-shadow: 0 0 15px rgba(46, 204, 113, 0.3);">ACCEPT</button>
            </div>
        `;
    }

    // --- 4. AQW Columns Rewards Box Sub-Panel ---
    let rewardLines = '';
    if (questId === 'wisp_hunt') {
        rewardLines = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; font-size:0.9rem;">
                <span style="color:#eee;"><span style="color:#f1c40f; font-weight:bold; margin-right:5px;">G</span> Gold Bounty</span>
                <span style="color:#2ecc71; font-weight:bold;">1,000</span>
            </div>
        `;
    } else if (questId === 'northside_investigation') {
        rewardLines = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; font-size:0.9rem;">
                <span style="color:#eee;"><span style="color:#f1c40f; font-weight:bold; margin-right:5px;">G</span> Gold Bounty</span>
                <span style="color:#2ecc71; font-weight:bold;">2,500</span>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.9rem;">
                <span style="color:#eee;"><span style="color:#9b59b6; font-weight:bold; margin-right:5px;">★</span> Item Drop</span>
                <span style="color:#9b59b6; font-weight:bold; text-transform:uppercase; font-size:0.8rem; letter-spacing:1px;">Rare Card</span>
            </div>
        `;
    }

    // --- 5. Inject Clean AQW Layout Into the Right Inspector Panel ---
    pane.innerHTML = `
        <div style="display:flex; flex-direction:column; height:100%; box-sizing:border-box; padding:5px;">
            
            <div style="text-align:center; margin-bottom:15px;">
                <h4 style="color:var(--gold); margin:0 0 4px 0; font-family:'Cinzel'; font-size:1.4rem; text-shadow:1px 1px 3px #000;">${quest.title}</h4>
                <div style="color:#aaa; font-size:0.75rem; letter-spacing:1px; text-transform:uppercase; margin-bottom:4px;">${difficultyText}</div>
                <div style="color:#f1c40f; font-size:0.8rem; letter-spacing: 2px;">${stars}</div>
            </div>
            
            <div style="background: rgba(0,0,0,0.5); border: 1px solid #444; border-radius: 6px; padding: 12px 15px; box-sizing: border-box; margin-bottom: 15px; font-size: 0.9rem; line-height: 1.4; color: #ddd; font-style: italic; max-height:180px; overflow-y:auto;">
                "${quest.description.split('<br><br>')[0]}"
                <div style="text-align:right; margin-top:8px; color:var(--gold); font-weight:bold; font-size:0.8rem; font-family:'Cinzel'; font-style:normal;">
                    — Captain Thorne
                </div>
            </div>
            
            ${progressTracker}
            
            <div style="background: rgba(0,0,0,0.5); border: 1px solid #444; border-radius: 6px; padding: 12px 15px; width: 100%; box-sizing: border-box; margin-bottom: 15px;">
                <div style="font-size:0.75rem; color:#aaa; margin-bottom:10px; text-transform:uppercase; text-align:center; letter-spacing: 1px; border-bottom:1px solid #333; padding-bottom:5px;">Quest Rewards</div>
                ${rewardLines}
            </div>
            
            <div style="flex-grow:1;"></div> 
            
            <div style="width:100%; margin-top:10px;">
                ${actionButtons}
            </div>
        </div>
    `;

    // --- 6. Safe Event Binding ---
    const actionBtn = document.getElementById('quest-action-btn');
    if (actionBtn && actionType !== 'cooldown' && actionType !== 'active') {
        actionBtn.onclick = () => {
            if (actionType === 'accept') {
                window.acceptQuest(quest.id);
            } else if (actionType === 'claim') {
                claimQuestReward(quest.id);
            }
        };
    }

    // --- 7. Precision Real-time Cooldown Loop ---
    if (quest.cooldownUntil && now < quest.cooldownUntil) {
        let liveTimer = setInterval(() => {
            let currentNow = Date.now();
            let btn = document.getElementById('quest-action-btn');
            
            if (!btn) { clearInterval(liveTimer); return; }
            
            if (currentNow >= quest.cooldownUntil) {
                clearInterval(liveTimer);
                viewQuest(questId); 
            } else {
                let remainingMs = quest.cooldownUntil - currentNow;
                let m = Math.floor(remainingMs / 60000);
                let s = Math.floor((remainingMs % 60000) / 1000);
                btn.innerText = `ON COOLDOWN (${m}m ${s}s)`;
            }
        }, 1000);
    }
}

// ============================================================================
// 🗺️ GATE & EXPLORATION NAVIGATION
// ============================================================================

function enterGate() {
    document.querySelectorAll('.rpg-screen').forEach(s => s.style.display = 'none');
    const gateScreen = document.getElementById('gate-screen');
    gateScreen.style.display = 'block';
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

function enterNorthside() {
    document.querySelectorAll('.rpg-screen').forEach(s => s.style.display = 'none');
    const northScreen = document.getElementById('northside-screen');
    northScreen.style.display = 'block';
    northScreen.style.backgroundImage = "url('./assets/Gate.png')"; 
}

// ============================================================================
// ⛰️ NORTHSIDE WATCHTOWER CINEMATIC & AMBUSH
// ============================================================================
let wtStep = 0;

function enterNorthsideWatchtower() {
    if (typeof playClickSound === 'function') playClickSound();
    
    // Hide all normal RPG screens
    document.querySelectorAll('.rpg-screen').forEach(s => s.style.display = 'none');
    
    // 1. Show Black Loading Screen
    const loader = document.getElementById('loading-overlay');
    loader.style.display = 'flex';
    
    setTimeout(() => {
        loader.style.display = 'none';
        
        // 2. Play Video Cutscene
        const vidContainer = document.getElementById('video-container');
        const vid = document.getElementById('cutscene-video');
        vidContainer.style.display = 'block';
        
        let playPromise = vid.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.warn("Video failed to play or asset missing, skipping to cinematic.", error);
                skipVideo();
            });
        }
        
        vid.onended = () => skipVideo();
        
    }, 2500); 
}

function skipVideo() {
    const vidContainer = document.getElementById('video-container');
    const vid = document.getElementById('cutscene-video');
    vid.pause();
    vidContainer.style.display = 'none';
    startWatchtowerCinematic();
}

function startWatchtowerCinematic() {
    const screen = document.getElementById('watchtower-cinematic-screen');
    screen.style.display = 'block';
    screen.style.backgroundImage = "url('./assets/OldWatchtower1.png')";
    
    wtStep = 1;
    document.getElementById('watchtower-dialogue-box').style.display = 'flex';
    document.getElementById('wt-speaker').innerText = "You";
    document.getElementById('wt-speaker').style.color = "#3498db";
    document.getElementById('wt-text').innerText = "An ambush! Goblins... and a lot of them, too. Looks like a mid-sized raiding party.";
}

function advanceWatchtowerCinematic() {
    const screen = document.getElementById('watchtower-cinematic-screen');
    const text = document.getElementById('wt-text');
    const fxLayer = document.getElementById('cinematic-fx-layer');
    
    if (wtStep === 1) {
        wtStep = 2;
        screen.style.backgroundImage = "url('./assets/OldWatchtower2.png')";
        text.innerText = "(Arrows whistle past you, narrowly missing!)";
        
        // Shoot 3 arrows from right to left
        for(let i = 0; i < 3; i++) {
            setTimeout(() => fireCinematicArrow(fxLayer), i * 300);
        }

    } else if (wtStep === 2) {
        wtStep = 3;
        screen.style.backgroundImage = "url('./assets/OldWatchtower3.png')";
        text.innerText = "I summon thee... Great Knight!";
        summonGreatKnightCinematic(fxLayer);
        
    } else if (wtStep === 3) {
        wtStep = 4;
        screen.style.backgroundImage = "url('./assets/OldWatchtower4.png')";
        text.innerText = "(More arrows deflect off the Knight's heavy armor!)";
        
        for(let i = 0; i < 4; i++) {
            setTimeout(() => fireCinematicArrow(fxLayer, true), i * 250);
        }
        
    } else if (wtStep === 4) {
        wtStep = 5;
        screen.style.backgroundImage = "url('./assets/OldWatchtower5.png')";
        text.innerText = "Let's slay these rats.";
        
    } else if (wtStep === 5) {
        document.getElementById('watchtower-dialogue-box').style.display = 'none';
        fxLayer.innerHTML = ''; 
        startAmbushDuel();
    }
}

function fireCinematicArrow(layer, deflected = false) {
    if(typeof arrowHitAudioUrl !== 'undefined' && arrowHitAudioUrl) playSound(arrowHitAudioUrl);
    
    const arrow = document.createElement('div');
    arrow.className = 'arrow-fx';
    
    let startY = 30 + Math.random() * 40; 
    arrow.style.cssText = `position: absolute; top: ${startY}%; left: 110%; transform: translate(-50%, -50%) rotate(180deg); transition: left 0.4s linear, top 0.4s linear; z-index: 51;`;
    
    arrow.style.backgroundImage = "var(--arrow-url, url('./assets/Arrow_FX.png'))";
    layer.appendChild(arrow);
    
    void arrow.offsetWidth;
    
    arrow.style.left = deflected ? '55%' : '-10%'; 
    arrow.style.top = (startY + (Math.random() * 10 - 5)) + '%';
    
    setTimeout(() => {
        if(deflected && typeof shieldBlockAudioUrl !== 'undefined') playSound(shieldBlockAudioUrl);
        arrow.remove();
    }, 400);
}

function summonGreatKnightCinematic(layer) {
    if(typeof beamAudioUrl !== 'undefined') playSound(beamAudioUrl);
    
    const magicCircle = document.createElement('div');
    magicCircle.className = 'magic-circle charging-element';
    magicCircle.style.left = '50%';
    magicCircle.style.top = '50%';
    magicCircle.style.zIndex = '51';
    
    const pillar = document.createElement('div');
    pillar.className = 'light-pillar charging-element';
    pillar.style.left = '50%';
    pillar.style.zIndex = '52'; 

    const shockwave = document.createElement('div');
    shockwave.className = 'epic-shockwave';
    shockwave.style.left = '50%';
    shockwave.style.top = '50%';
    shockwave.style.zIndex = '53';
    
    layer.appendChild(magicCircle);
    layer.appendChild(pillar);
    layer.appendChild(shockwave);

    setTimeout(() => {
        if(typeof buffActivatedUrl !== 'undefined') playSound(buffActivatedUrl);
    }, 200);

    setTimeout(() => {
        if (pillar) pillar.remove();
        if (magicCircle) magicCircle.remove();
        if (shockwave) shockwave.remove();
    }, 1000);
}

function startAmbushDuel() {
    document.getElementById('watchtower-cinematic-screen').style.display = 'none';
    document.getElementById('game-area').style.display = 'flex';
    document.getElementById('inventory-btn').style.display = 'none';
    
    isTutorialMode = false;
    tutorialLock = false;

    if (typeof showInspector === 'function') showInspector('none');
    
    // 🌟 THE FIX: Wipe the board memory so ghost cards from previous duels don't trigger the wrong victory!
    cardInstances = {};
    eHandData = [];
    
    turnCount = 1; currentTurn = 'PLAYER';
    pMana = 8; eMana = 8; 
    pCoreHP = 2000; eCoreHP = 2000; 
    pQueue = []; eQueue = []; isExecuting = false; globalTargetedThisTurn = []; pArashiSouls = 0; pSquiresFallen = 0;
    
    document.getElementById('hand').innerHTML = ''; 
    document.querySelectorAll('.slot .card').forEach(c => c.remove());
    
    // ... (rest of the function remains the same) ...
    
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
    if(pDeck.length === 0) pDeck = buildDeck(); 
    for(let i = pDeck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pDeck[i], pDeck[j]] = [pDeck[j], pDeck[i]]; }
    
    eDeck = [];
    let gobWarTemplate = cardLibrary.find(c => c.name === "Goblin Warrior");
    let gobArchTemplate = cardLibrary.find(c => c.name === "Goblin Archer");
    
    if (gobWarTemplate && gobArchTemplate) {
        for (let k = 0; k < 10; k++) eDeck.push(JSON.parse(JSON.stringify(gobWarTemplate)));
        for (let k = 0; k < 8; k++) eDeck.push(JSON.parse(JSON.stringify(gobArchTemplate)));
    } else {
        console.warn("Goblin cards not found in library, falling back to random deck.");
        eDeck = buildDeck(); 
    }
    
    for(let i = eDeck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [eDeck[i], eDeck[j]] = [eDeck[j], eDeck[i]]; }
    
    document.getElementById('p-deck-count').innerText = pDeck.length;
    document.getElementById('e-deck-count').innerText = eDeck.length;
    document.getElementById('event-log').innerHTML = '';
    
    addLog("AMBUSH! A Goblin raiding party has attacked!", "#e74c3c");
    addLog("BATTLE COMMENCED. No combat allowed on Turn 1.", "var(--gold)");
    
    updateUI(); 
    
    const drawBtn = document.getElementById('draw-cards-btn');
    drawBtn.style.display = "block";
    drawBtn.innerText = "DRAW HAND";
}

function triggerNorthsideVictory() {
    document.querySelectorAll('.rpg-screen').forEach(s => s.style.display = 'none');
    document.getElementById('game-area').style.display = 'none';
    document.getElementById('inventory-btn').style.display = 'block';
    
    if (typeof quests !== 'undefined' && quests.northside_investigation) {
        quests.northside_investigation.progress = 1;
        quests.northside_investigation.isCompleted = false; 
    }
    
    const nsScreen = document.getElementById('northside-screen');
    nsScreen.style.display = 'block';
    nsScreen.style.backgroundImage = "url('./assets/Gate.png')";
    
    const menu = nsScreen.querySelector('.top-left-menu');
    if (menu) menu.style.display = 'none';

    let nsDialog = document.getElementById('ns-dialogue-box');
    if (!nsDialog) {
        nsDialog = document.createElement('div');
        nsDialog.id = 'ns-dialogue-box';
        nsDialog.className = 'dialogue-box-style';
        nsDialog.innerHTML = `
            <div id="ns-speaker" style="font-weight: bold; font-family: 'Cinzel'; font-size: 1.2rem; margin-bottom: 10px;"></div>
            <div id="ns-text" style="font-size: 1.1rem; line-height: 1.5;"></div>
            <div style="font-size: 0.75rem; color: #aaa; text-align: right; margin-top: 15px; font-style: italic;">(Click to continue)</div>
        `;
        nsScreen.appendChild(nsDialog);
    }
    
    nsDialog.style.display = 'flex';
    document.getElementById('ns-speaker').innerText = "You";
    document.getElementById('ns-speaker').style.color = "#3498db";
    document.getElementById('ns-text').innerText = "I need to claim my bounty at the Barracks and report to the Captain immediately. This is much larger than a simple raid.";
    
    nsDialog.onclick = () => {
        if (typeof playClickSound === 'function') playClickSound();
        nsDialog.style.display = 'none';
        if (menu) menu.style.display = 'flex';
    };

    if (typeof addLog === 'function') addLog("Northside Ambush cleared! Turn in quest at the Garrison Board.", "#2ecc71");
}

function triggerEncounter() {
    if (patrolTimer) clearInterval(patrolTimer);
    if (chanceTimer) clearInterval(chanceTimer);
    
    document.getElementById('player-patrol-marker').classList.remove('marching');
    document.getElementById('encounter-overlay').style.display = 'flex';
}

function escapeEncounter() {
    if (typeof playClickSound === 'function') playClickSound();
    
    document.getElementById('encounter-overlay').style.display = 'none';
    document.getElementById('player-patrol-marker').classList.add('marching');
    startPatrolLoops();
}

function returnToLeonia() {
    if (typeof playClickSound === 'function') playClickSound();
    
    if (typeof stopPatrolAtmosphere === 'function') stopPatrolAtmosphere();
    
    clearInterval(patrolTimer);
    clearInterval(chanceTimer);
    
    const marker = document.getElementById('player-patrol-marker');
    marker.classList.remove('marching');
    marker.classList.add('retreating');
    
    let retreatTimer = setInterval(() => {
        patrolProgress -= 1.0; 
        marker.style.left = Math.max(0, patrolProgress) + '%';
        
        if (patrolProgress <= 0) {
            clearInterval(retreatTimer);
            marker.classList.remove('retreating');
            
            document.querySelectorAll('.rpg-screen').forEach(s => s.style.display = 'none');
            document.getElementById('leonia-screen').style.display = 'block';
        }
    }, 50);
}

function processWispDefeat() {
    if (typeof quests !== 'undefined' && quests.wisp_hunt) {
        let quest = quests.wisp_hunt;
        
        if (quest.isAccepted && !quest.isCompleted && quest.progress < quest.maxProgress) {
            quest.progress++;
            
            if (quest.progress < quest.maxProgress) {
                if (typeof addLog === 'function') addLog(`Quest Progress: Hunted Wisps ${quest.progress}/3`, "#3498db");
            } else {
                if (typeof addLog === 'function') addLog("Wisp Hunt Complete! Return to the Garrison Board.", "#2ecc71");
            }
        }
    }
}

function endWispDuel() {
    document.getElementById('game-area').style.display = 'none';
    document.getElementById('patrol-screen').style.display = 'block';
    document.getElementById('player-patrol-marker').classList.add('marching');
    document.getElementById('inventory-btn').style.display = 'block';
    
    processWispDefeat();
    
    if (typeof playerGold !== 'undefined') {
        playerGold += 50; 
        if (typeof updateGoldUI === 'function') updateGoldUI();
    }

    if (typeof startPatrolAtmosphere === 'function') startPatrolAtmosphere();
    startPatrolLoops();
}

function startWispDuel() {
    if (typeof playClickSound === 'function') playClickSound();

    if (typeof stopPatrolAtmosphere === 'function') stopPatrolAtmosphere();
    
    document.getElementById('encounter-overlay').style.display = 'none';
    document.getElementById('patrol-screen').style.display = 'none';
    
    clearInterval(patrolTimer);
    clearInterval(chanceTimer);

    document.getElementById('game-area').style.display = 'flex';
    document.getElementById('inventory-btn').style.display = 'none';
    
    isTutorialMode = false; 
    tutorialLock = false;

    if (typeof showInspector === 'function') showInspector('none');

    cardInstances = {};
    eHandData = [];
    
    turnCount = 1; currentTurn = 'PLAYER';
    pMana = 8; eMana = 8; 
    pCoreHP = 2000; 
    eCoreHP = 1000; 
    pQueue = []; eQueue = []; isExecuting = false; globalTargetedThisTurn = []; pArashiSouls = 0; pSquiresFallen = 0; eHandData = [];
    
    document.getElementById('hand').innerHTML = ''; 
    document.querySelectorAll('.slot .card').forEach(c => c.remove());
    
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
    if(pDeck.length === 0) pDeck = buildDeck(); 
    for(let i = pDeck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pDeck[i], pDeck[j]] = [pDeck[j], pDeck[i]]; }
    
    eDeck = [];
    let wispTemplate = cardLibrary.find(c => c.name === "Wisp");
    let wispPackSize = Math.floor(Math.random() * 3) + 4; 
    
    if (wispTemplate) {
        for (let k = 0; k < wispPackSize; k++) {
            eDeck.push(JSON.parse(JSON.stringify(wispTemplate)));
        }
    }
    
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

let atmosphereTimer = null;

function spawnPatrolText() {
    const phrases = [
        "Patrolling the Eastern Pass...",
        "Scouting the valley...",
        "Continuous walking...",
        "The wind howls through the trees...",
        "Watching for movement in the brush...",
        "Footsteps echo on the mountain path..."
    ];

    let text = phrases[Math.floor(Math.random() * phrases.length)];

    let textEl = document.createElement('div');
    textEl.className = 'patrol-text';
    textEl.innerText = text;

    let yOffset = Math.floor(Math.random() * 40) - 20; 
    textEl.style.marginTop = `${yOffset}px`;

    document.body.appendChild(textEl);

    setTimeout(() => {
        if(textEl) textEl.remove();
    }, 3000);
}

function startPatrolAtmosphere() {
    if (atmosphereTimer) clearInterval(atmosphereTimer);
    
    spawnPatrolText();
    
    atmosphereTimer = setInterval(spawnPatrolText, 3500);
}

function stopPatrolAtmosphere() {
    if (atmosphereTimer) {
        clearInterval(atmosphereTimer);
        atmosphereTimer = null;
    }
}

let encountersThisPatrol = 0;
const MAX_PATROL_LENGTH = 3; 

function triggerPatrolComplete() {
    if (typeof stopPatrolAtmosphere === 'function') stopPatrolAtmosphere();

    let completeText = document.createElement('div');
    completeText.innerText = "Patrol Completed!";
    completeText.style.cssText = "position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #f1c40f; font-size: 3rem; font-weight: bold; text-shadow: 0 0 20px #e67e22, 2px 2px 5px #000; z-index: 9999; opacity: 0; transition: opacity 1s ease-in-out; font-family: monospace; text-align: center;";
    document.body.appendChild(completeText);

    setTimeout(() => { completeText.style.opacity = '1'; }, 100);

    setTimeout(() => {
        completeText.style.opacity = '0';
        setTimeout(() => {
            completeText.remove();
            
            let returnBtn = document.getElementById('return-to-barracks-btn') || document.getElementById('return-leonia-btn'); 
            if (returnBtn) {
                returnBtn.click(); 
            } else {
                console.log("Could not find the Return button. Check the ID!");
            }
        }, 1000);
    }, 2500);
}

function enterHilltops() {
    if (typeof playClickSound === 'function') playClickSound();
    
    document.querySelectorAll('.rpg-screen').forEach(s => s.style.display = 'none');
    
    const loader = document.getElementById('loading-overlay');
    loader.style.display = 'flex';
    
    setTimeout(() => {
        loader.style.display = 'none';
        
        const vidContainer = document.getElementById('video-container');
        const vid = document.getElementById('cutscene-video');
        vidContainer.style.display = 'block';
        
        vid.innerHTML = '<source src="./assets/Hilltop4.mp4" type="video/mp4">';
        vid.load(); 
        
        let playPromise = vid.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.warn("Video failed to play, skipping directly to duel.", error);
                skipHilltopVideo();
            });
        }
        
        vid.onended = () => skipHilltopVideo();
        
        const skipBtn = vidContainer.querySelector('button');
        if (skipBtn) skipBtn.onclick = skipHilltopVideo;
        
    }, 2500); 
}

function skipHilltopVideo() {
    const vidContainer = document.getElementById('video-container');
    const vid = document.getElementById('cutscene-video');
    vid.pause();
    vidContainer.style.display = 'none';
    
    const skipBtn = vidContainer.querySelector('button');
    if (skipBtn && typeof skipVideo === 'function') skipBtn.onclick = skipVideo; 
    
    startHilltopDuel();
}

function startHilltopDuel() {
    document.getElementById('game-area').style.display = 'flex';
    document.getElementById('inventory-btn').style.display = 'none';
    
    isTutorialMode = false;
    tutorialLock = false;

    if (typeof showInspector === 'function') showInspector('none');

    cardInstances = {};
    eHandData = [];
    
    turnCount = 1; currentTurn = 'PLAYER';
    pMana = 8; eMana = 8; 
    pCoreHP = 2000; eCoreHP = 3000; 
    pQueue = []; eQueue = []; isExecuting = false; globalTargetedThisTurn = []; pArashiSouls = 0; pSquiresFallen = 0;
    
    document.getElementById('hand').innerHTML = ''; 
    document.querySelectorAll('.slot .card').forEach(c => c.remove());
    
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
    if(pDeck.length === 0) pDeck = buildDeck(); 
    for(let i = pDeck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pDeck[i], pDeck[j]] = [pDeck[j], pDeck[i]]; }
    
    eDeck = [];
    let gobArchTemplate = cardLibrary.find(c => c.name === "Goblin Archer");
    let gobWarDrumTemplate = cardLibrary.find(c => c.name === "Goblin Wardrummer");
    let lastStandTemplate = cardLibrary.find(c => c.name === "Last Stand");
    
    const addCardsToEnemyDeck = (template, count) => {
        if (template) {
            for (let k = 0; k < count; k++) eDeck.push(JSON.parse(JSON.stringify(template)));
        }
    };

    addCardsToEnemyDeck(gobArchTemplate, 16);
    addCardsToEnemyDeck(gobWarDrumTemplate, 3);
    addCardsToEnemyDeck(lastStandTemplate, 4);
    
    for(let i = eDeck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [eDeck[i], eDeck[j]] = [eDeck[j], eDeck[i]]; }
    
    document.getElementById('p-deck-count').innerText = pDeck.length;
    document.getElementById('e-deck-count').innerText = eDeck.length;
    document.getElementById('event-log').innerHTML = '';
    
    addLog("AMBUSH AT THE HILLTOPS! The goblin host has the high ground!", "#e74c3c");
    
    const spawnOnBoard = (templateName, slotId) => {
        let template = cardLibrary.find(c => c.name === templateName);
        if(!template) return;
        let cardId = 'e_spawn_' + Math.floor(Math.random() * 1000000);
        cardInstances[cardId] = JSON.parse(JSON.stringify(template));
        cardInstances[cardId].id = cardId;
        cardInstances[cardId].side = 'ENEMY';
        cardInstances[cardId].exhausted = true; 
        cardInstances[cardId].turnPlaced = 1;
        
        let slot = document.getElementById(slotId);
        if(slot) slot.appendChild(createCardDOM(cardId, cardInstances[cardId], false));
    };

    spawnOnBoard("Goblin Wardrummer", "e-front-center");
    spawnOnBoard("Goblin Archer", "e-front-left");
    spawnOnBoard("Goblin Archer", "e-front-right");
    spawnOnBoard("Goblin Archer", "e-back-left");
    spawnOnBoard("Goblin Archer", "e-back-right");
    spawnOnBoard("Last Stand", "e-ability");

    addLog("The enemy formation is perfectly entrenched!", "#9b59b6");
    addLog("BATTLE COMMENCED. No combat allowed on Turn 1.", "var(--gold)");
    
    updateUI(); 
    
    const drawBtn = document.getElementById('draw-cards-btn');
    drawBtn.style.display = "block";
    drawBtn.innerText = "DRAW HAND";
}

function triggerHilltopVictory() {
    if (typeof playClickSound === 'function') playClickSound();
    
    // 1. Hide Battlefield and restore UI safely
    document.querySelectorAll('.rpg-screen').forEach(s => s.style.display = 'none');
    document.getElementById('game-area').style.display = 'none';
    document.getElementById('inventory-btn').style.display = 'block';
    
    // 2. Mark the Part 2 Quest as Ready to Turn In!
    if (typeof quests !== 'undefined' && quests.northside_part2) {
        quests.northside_part2.progress = 1;
    }
    
    // 3. Route back to Northside Selection
    const nsScreen = document.getElementById('northside-screen');
    nsScreen.style.display = 'block';
    nsScreen.style.backgroundImage = "url('./assets/Gate.png')"; 
    
    // Hide menu temporarily for cinematic dialogue
    const menu = nsScreen.querySelector('.top-left-menu');
    if (menu) menu.style.display = 'none';

    // 4. Inject the one-click Player Victory Dialogue
    let nsDialog = document.getElementById('ns-dialogue-box');
    if (!nsDialog) {
        nsDialog = document.createElement('div');
        nsDialog.id = 'ns-dialogue-box';
        nsDialog.className = 'dialogue-box-style';
        nsDialog.innerHTML = `
            <div id="ns-speaker" style="font-weight: bold; font-family: 'Cinzel'; font-size: 1.2rem; margin-bottom: 10px;"></div>
            <div id="ns-text" style="font-size: 1.1rem; line-height: 1.5;"></div>
            <div style="font-size: 0.75rem; color: #aaa; text-align: right; margin-top: 15px; font-style: italic;">(Click to continue)</div>
        `;
        nsScreen.appendChild(nsDialog);
    }
    
    nsDialog.style.display = 'flex';
    document.getElementById('ns-speaker').innerText = "You";
    document.getElementById('ns-speaker').style.color = "#3498db";
    document.getElementById('ns-text').innerText = "The goblin host is broken, and their leaders are defeated. I need to return to the Garrison Board to claim my bounty and report to Captain Thorne.";
    
    // Clicking the box dismisses it and brings the menu back
    nsDialog.onclick = () => {
        if (typeof playClickSound === 'function') playClickSound();
        nsDialog.style.display = 'none';
        if (menu) menu.style.display = 'flex';
    };

    if (typeof addLog === 'function') addLog("Hilltops Secured! Turn in your quest at the Garrison Board.", "#2ecc71");
}

// ============================================================================
// 🌟 BULLETPROOF PATROL SYSTEM
// ============================================================================
let patrolProgress = 0;
let patrolTimer = null;
let chanceTimer = null;
let isPatrolCompleting = false; // 🌟 FIX: Prevents the "100 clicks" bug

function startPatrol() {
    if (typeof playClickSound === 'function') playClickSound();
    
    document.querySelectorAll('.rpg-screen').forEach(s => s.style.display = 'none');
    
    document.getElementById('patrol-screen').style.display = 'block';
    document.getElementById('patrol-screen').style.backgroundImage = "url('./assets/Eastern Mountain Pass Watch.png')";
    
    patrolProgress = 0;
    encountersThisPatrol = 0;
    isPatrolCompleting = false; // Reset the safety lock
    
    document.getElementById('player-patrol-marker').style.left = '0%';
    document.getElementById('player-patrol-marker').classList.add('marching');
    
    startPatrolAtmosphere();
    startPatrolLoops();
}

function startPatrolLoops() {
    // 🌟 FIX: Aggressively nuke any existing background timers before starting new ones!
    if (patrolTimer) clearInterval(patrolTimer);
    if (chanceTimer) clearInterval(chanceTimer);
    
    const marker = document.getElementById('player-patrol-marker');
    
    patrolTimer = setInterval(() => {
        if (patrolProgress >= 100) {
            clearInterval(patrolTimer);
            clearInterval(chanceTimer);
            patrolTimer = null;
            chanceTimer = null;
            marker.classList.remove('marching');
            triggerPatrolComplete();
        } else {
            patrolProgress += 0.5; 
            marker.style.left = patrolProgress + '%';
        }
    }, 100);

    chanceTimer = setInterval(() => {
        if (Math.random() < 0.25) { 
            encountersThisPatrol++;
            triggerEncounter();
        }
    }, 3000); 
}

function triggerPatrolComplete() {
    // 🌟 FIX: If it's already completing, immediately stop it from running again!
    if (isPatrolCompleting) return;
    isPatrolCompleting = true;

    if (typeof stopPatrolAtmosphere === 'function') stopPatrolAtmosphere();

    let completeText = document.createElement('div');
    completeText.innerText = "Patrol Completed!";
    completeText.style.cssText = "position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #f1c40f; font-size: 3rem; font-weight: bold; text-shadow: 0 0 20px #e67e22, 2px 2px 5px #000; z-index: 9999; opacity: 0; transition: opacity 1s ease-in-out; font-family: monospace; text-align: center;";
    document.body.appendChild(completeText);

    setTimeout(() => { completeText.style.opacity = '1'; }, 100);

    setTimeout(() => {
        completeText.style.opacity = '0';
        setTimeout(() => {
            completeText.remove();
            
            // 🌟 FIX: ONLY route back to town if the player is actually physically on the Patrol screen!
            let patrolScreen = document.getElementById('patrol-screen');
            if (patrolScreen && patrolScreen.style.display === 'block') {
                let returnBtn = document.getElementById('return-leonia-btn'); 
                if (returnBtn) returnBtn.click(); 
            }
        }, 1000);
    }, 2500);
}
