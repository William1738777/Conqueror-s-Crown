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
    
    // --- BUG FIX: Clear Tutorial Overlay & Combat Visual Artifacts ---
    document.getElementById('tut-overlay-msg').style.display = 'none';
    document.querySelectorAll('.target-glow, .target-line-glow, .target-heal-glow, .tut-highlight-glow, .tut-disabled').forEach(el => {
        el.classList.remove('target-glow', 'target-line-glow', 'target-heal-glow', 'tut-highlight-glow', 'tut-disabled');
    });
    document.querySelectorAll('.arrow-fx, .shuriken-fx, .slash-fx, .floating-text').forEach(el => el.remove());
    isTargeting = false;
    // ----------------------------------------------------------------
    
    // Unlock Inventory Bag
    document.getElementById('inventory-btn').style.display = 'block';

    // NEW FIX: Unlock the Training Grounds in Leonia!
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
    
    // Dynamically inject card into collection
    let link = ASSET_LINKS["One More Time"] || "";
    let omtData = getCardTemplate("One More Time", link);
    if(typeof playerCollection !== 'undefined') {
        playerCollection.push({...omtData, dbId: generateUID()});
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
    
    isTutorialMode = false; // Normal Rules
    tutorialLock = false;   //
    
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
    const jaxDeckNames = ["Zombie", "Zombie", "Zombie", "Skeleton Warrior", "Skeleton Warrior", "Skeleton Warrior", "Leonian Squire", "Leonian Squire", "Leonian Squire", "Jaden"];
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
