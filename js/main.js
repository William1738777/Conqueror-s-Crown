// ============================================================================
// ⚙️ GLOBAL VARIABLES (Shared across all files)
// ============================================================================
let cardLibrary = [];
let eHandData = [];
let currentTurn = 'PLAYER', turnCount = 1;
let pMana = 8, eMana = 8;
let playerDiscardsRemaining = 5;
let pCoreHP = 2000, eCoreHP = 2000;
let pArashiSouls = 0, eArashiSouls = 0; 
let pSquiresFallen = 0, eSquiresFallen = 0; 
let pSkeletonMana = 0, eSkeletonMana = 0; // Added from VersionFight
let cardInstances = {};
let globalTargetedThisTurn = [];
let playerGold = 500;

// --- TUTORIAL STATE ---
let isTutorialMode = false;
let tutorialStep = 0;
let tutorialLock = false; 

// --- INVENTORY GLOBALS ---
// Stores stacking items. I've given you some starting medals to test the shop!
let playerItems = [
    { id: 'leonian_medal', name: 'Leonian Gold Medal', count: 120, img: './assets/LeonianMedal.png' },
    { id: 'valorian_medal', name: 'Valorian Medal', count: 5, img: './assets/ValorianMedal.png' }
];

// --- AUDIO & ASSET GLOBALS ---
let deckBackImg = ''; let arrowImgUrl = ''; let shurikenImgUrl = ''; let kinSanAudioUrl = ''; let kinSfx1Url = ''; let kinSfx2Url = ''; let bloodAudioUrl = ''; let bodyShotAudioUrl = ''; let arrowHitAudioUrl = ''; let healAudioUrl = ''; let menuMusicUrl = ''; let menuAudioEl = null; let jadenLockUrl = ''; let jadenBulletUrl = ''; let jadenSfx1 = ''; let jadenSfx2 = ''; let jadenSfx3 = ''; let rolynSfx1Url = ''; let rolynSfx2Url = ''; let shieldBlockAudioUrl = ''; let tauntedImgUrl = ''; let barrierImgUrl = ''; let bleedImgUrl = ''; let shinobiMarkImgUrl = ''; let atkIconUrl = ''; let drawSfxUrl = ''; let placeSfxUrl = ''; let abilityActivatedUrl = ''; let buffActivatedUrl = ''; let dragSoundUrl = ''; let dropSoundUrl = ''; let clickSfxUrl = ''; let dragAudioEl = null; let villagerSuicideSfxUrl = ''; let healSfxVoiceUrl = ''; let healSfxVoice2Url = ''; let shieldSfxVoiceUrl = ''; let shieldSfxVoice2Url = ''; let shieldSfxUrl = ''; let beamAudioUrl = ''; let wardrummerSfxUrl = ''; let goblinKillSfxUrl = ''; let fearDebuffImgUrl = '';let pQueue = []; let eQueue = []; let isTargeting = false; let pendingSkill = null; let isExecuting = false; let targetCountReq = 1; let selectedTargets = []; let draggedCardId = null; let pDeck = []; let eDeck = [];

// 🌟PRAETORIAN SOUNDS :
let praetorianSfx1 = ''; let praetorianSfx2 = ''; let praetorianSfx3 = ''; let praetorianSpearReleaseUrl = ''; let praetorianSpearConnectUrl = '';

const log = document.getElementById('event-log');

// ============================================================================
// 🛒 BARRACKS SHOP LOGIC
// ============================================================================

function openBarracksShop() {
    if (typeof playClickSound === 'function') playClickSound();
    
    // Hide the bag so it doesn't block the UI
    const invBtn = document.getElementById('inventory-btn');
    if (invBtn) invBtn.style.display = 'none';

    document.getElementById('barracks-shop-panel').classList.add('open');
    // Clear inspector on open
    document.getElementById('barracks-inspector-content').innerHTML = `<div style="text-align:center; color:#666; margin-top:50%; font-style:italic;">Select an item.</div>`;
    document.getElementById('barracks-inspector-panel').classList.remove('open');
}

function closeBarracksShop() {
    if (typeof playClickSound === 'function') playClickSound();
    
    // Bring the bag back!
    const invBtn = document.getElementById('inventory-btn');
    if (invBtn) invBtn.style.display = 'block';

    document.getElementById('barracks-shop-panel').classList.remove('open');
    document.getElementById('barracks-inspector-panel').classList.remove('open');
}

function inspectBarracksItem(itemName) {
    if (typeof playClickSound === 'function') playClickSound();
    const inspector = document.getElementById('barracks-inspector-panel');
    const content = document.getElementById('barracks-inspector-content');
    
    // Slide the inspector out!
    inspector.classList.add('open');
    
    if (itemName === 'Praetorian Guard') {
        let template = cardLibrary.find(c => c.name === "Praetorian Guard");
        if (!template) {
            content.innerHTML = `<div style="color:red;">Error: Asset not loaded.</div>`;
            return;
        }
        
        // Render the visual card via the engine
        let visualCard = createCardDOM('inspect_shop', template, true);
        visualCard.style.margin = "0 auto 10px auto"; 
        visualCard.style.transform = "scale(1.1)"; 
        
        // 👇 FETCH LIVE INVENTORY COUNTS 👇
        let leoMedal = playerItems.find(i => i.id === 'leonian_medal');
        let valMedal = playerItems.find(i => i.id === 'valorian_medal');
        let leoCount = leoMedal ? leoMedal.count : 0;
        let valCount = valMedal ? valMedal.count : 0;
        
        // Inject AQW-style Layout with Overview & Dynamic Requirements
        content.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; height:100%;">
                
                <div id="inspector-card-target" style="height: 220px; display:flex; align-items:center;"></div>
                
                <h4 style="color:var(--gold); margin:10px 0 5px 0; font-family:'Cinzel'; font-size:1.3rem; text-align:center;">${template.name}</h4>
                <div style="color:#aaa; font-size:0.8rem; margin-bottom:15px; letter-spacing: 2px;">★★★★★</div>
                
                <div style="background: rgba(0,0,0,0.5); border: 1px solid #444; border-radius: 6px; padding: 10px 15px; width: 100%; box-sizing: border-box; margin-bottom: 15px;">
                    <div style="font-size:0.8rem; color:#aaa; margin-bottom:8px; text-transform:uppercase; text-align:center; letter-spacing: 1px;">Overview</div>
                    <div style="display:flex; justify-content:space-between; font-size: 0.85rem;">
                        
                        <div style="display:flex; flex-direction:column; gap:5px; width:48%;">
                            <div><span style="color:#888;">Lethality:</span> <span style="color:#e74c3c; font-weight:bold; float:right;">S+</span></div>
                            <div><span style="color:#888;">Utility:</span> <span style="color:#3498db; font-weight:bold; float:right;">B</span></div>
                            <div><span style="color:#888;">Synergy:</span> <span style="color:#9b59b6; font-weight:bold; float:right;">C</span></div>
                        </div>
                        
                        <div style="display:flex; flex-direction:column; gap:5px; width:48%;">
                            <div><span style="color:#888;">Survivability:</span> <span style="color:#2ecc71; font-weight:bold; float:right;">S</span></div>
                            <div><span style="color:#888;">Economy:</span> <span style="color:#f1c40f; font-weight:bold; float:right;">A</span></div>
                        </div>
                        
                    </div>
                </div>
                
                <div style="background: rgba(0,0,0,0.5); border: 1px solid #444; border-radius: 6px; padding: 10px 15px; width: 100%; box-sizing: border-box; margin-bottom: 10px;">
                    <div style="font-size:0.8rem; color:#aaa; margin-bottom:10px; text-transform:uppercase; text-align:center; letter-spacing: 1px;">Requirements</div>
                    
                    <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                        <span><img src="./assets/LeonianMedal.png" style="width:20px; vertical-align:middle; margin-right:5px;"> Leonian Medal</span>
                        <span style="color:${leoCount >= 100 ? '#2ecc71' : '#e74c3c'}; font-weight:bold;">${leoCount} / 100</span>
                    </div>
                    
                    <div style="display:flex; justify-content:space-between;">
                        <span><img src="./assets/ValorianMedal.png" style="width:20px; vertical-align:middle; margin-right:5px;"> Valorian Medal</span>
                        <span style="color:${valCount >= 3 ? '#2ecc71' : '#e74c3c'}; font-weight:bold;">${valCount} / 3</span>
                    </div>
                </div>
                
                <div style="flex-grow:1;"></div> 
                <button class="btn-main" style="background:#2ecc71; color:#000; box-shadow: 0 0 15px rgba(46, 204, 113, 0.4);" onclick="buyPraetorianGuard()">CALL FORTH</button>
            </div>
        `;
        
        document.getElementById('inspector-card-target').appendChild(visualCard);
    }
}
function buyPraetorianGuard() {
    // 1. Find the required items in the player's inventory
    let leoMedal = playerItems.find(i => i.id === 'leonian_medal');
    let valMedal = playerItems.find(i => i.id === 'valorian_medal');

    let leoCount = leoMedal ? leoMedal.count : 0;
    let valCount = valMedal ? valMedal.count : 0;

    // 2. Check if they have enough
    if (leoCount >= 100 && valCount >= 3) {
        
        // 3. Deduct the cost
        leoMedal.count -= 100;
        valMedal.count -= 3;
        
        // Clean up empty stacks if they hit exactly 0
        playerItems = playerItems.filter(i => i.count > 0);

        // 4. Give the player the card
        let guardData = cardLibrary.find(c => c.name === "Praetorian Guard");
        if (guardData) {
            let newCard = JSON.parse(JSON.stringify(guardData));
            newCard.dbId = 'card_' + Math.random().toString(36).substr(2, 9);
            playerCollection.push(newCard); // Assuming this is your bag array name
            
            addLog("Purchased 1x Praetorian Guard!", "#2ecc71");
            if (typeof playClickSound === 'function') playClickSound();
            alert("Transaction Successful! Praetorian Guard added to your stash.");
            
            // Re-render the inspector to show updated item counts
            inspectBarracksItem('Praetorian Guard');
        } else {
            alert("Error: Praetorian Guard not found in card library.");
        }
    } else {
        // Not enough currency
        alert(`Insufficient funds!\nYou need 100 Leonian Medals and 3 Valorian Medals.\nYou have: ${leoCount} Leonian, ${valCount} Valorian.`);
    }
}

// ============================================================================
// 📜 BARRACKS QUEST LOGIC
// ============================================================================

// Quest State Trackers
let questPestControlStatus = 'unaccepted'; // Can be 'unaccepted', 'active', or 'completed'
let goblinsSlain = 0;

function openBarracksQuests() {
    if (typeof playClickSound === 'function') playClickSound();
    
    // Hide the bag to prevent UI overlap
    const invBtn = document.getElementById('inventory-btn');
    if (invBtn) invBtn.style.display = 'none';

    document.getElementById('barracks-quest-panel').classList.add('open');
    document.getElementById('barracks-quest-content').innerHTML = `<div style="text-align:center; color:#666; margin-top:50%; font-style:italic;">Select a quest.</div>`;
    document.getElementById('barracks-quest-inspector').classList.remove('open');
}

function closeBarracksQuests() {
    if (typeof playClickSound === 'function') playClickSound();
    
    // Bring the bag back
    const invBtn = document.getElementById('inventory-btn');
    if (invBtn) invBtn.style.display = 'block';

    document.getElementById('barracks-quest-panel').classList.remove('open');
    document.getElementById('barracks-quest-inspector').classList.remove('open');
}

function inspectBarracksQuest(questName) {
    if (typeof playClickSound === 'function') playClickSound();
    const inspector = document.getElementById('barracks-quest-inspector');
    const content = document.getElementById('barracks-quest-content');
    
    inspector.classList.add('open');
    
    if (questName === 'Pest Control') {
        let actionButtons = '';
        let progressTracker = '';

        // Determine what buttons/trackers to show based on quest status
        if (questPestControlStatus === 'unaccepted') {
            actionButtons = `
                <div style="display:flex; gap:10px; margin-top: 15px;">
                    <button class="btn-main" style="flex:1; background:#e74c3c; color:#fff;" onclick="closeBarracksQuests()">DECLINE</button>
                    <button class="btn-main" style="flex:1; background:#2ecc71; color:#000;" onclick="acceptBarracksQuest('Pest Control')">ACCEPT</button>
                </div>
            `;
        } else if (questPestControlStatus === 'active') {
            progressTracker = `
                <div style="background: rgba(0,0,0,0.5); border: 1px solid #3498db; border-radius: 6px; padding: 10px; text-align: center; margin-bottom: 15px;">
                    <span style="color:#3498db; font-weight:bold; letter-spacing: 1px;">GOBLINS SLAIN: ${goblinsSlain} / 30</span>
                </div>
            `;
            actionButtons = `<button class="btn-main" style="width:100%; background:#888; color:#fff; cursor:not-allowed;" disabled>QUEST IN PROGRESS</button>`;
        } else if (questPestControlStatus === 'completed') {
            progressTracker = `
                <div style="background: rgba(0,0,0,0.5); border: 1px solid #2ecc71; border-radius: 6px; padding: 10px; text-align: center; margin-bottom: 15px;">
                    <span style="color:#2ecc71; font-weight:bold; letter-spacing: 1px;">REQUIREMENTS MET</span>
                </div>
            `;
            actionButtons = `<button class="btn-main" style="width:100%; background:#f1c40f; color:#000;" onclick="turnInQuest('Pest Control')">CLAIM REWARDS</button>`;
        }

        // Inject the updated Quest Inspector UI with E-Rank details
        content.innerHTML = `
            <div style="display:flex; flex-direction:column; height:100%;">
                
                <h4 style="color:var(--gold); margin:0 0 5px 0; font-family:'Cinzel'; font-size:1.4rem; text-align:center;">Pest Control</h4>
                <div style="color:#f1c40f; font-size:0.8rem; margin-bottom:20px; text-align:center; letter-spacing: 2px;">★★☆☆☆☆☆</div>
                
                <div style="background: rgba(0,0,0,0.5); border: 1px solid #444; border-radius: 6px; padding: 15px; box-sizing: border-box; margin-bottom: 15px; font-size: 0.95rem; line-height: 1.5; color: #ddd; font-style: italic;">
                    "Goblins breed like roaches in the eastern woods. If we don't cull their numbers every season, they start raiding the supply caravans. Head out there, slay 30 of them, and report back. We'll make it worth your time."
                </div>
                
                ${progressTracker}
                
                <div style="background: rgba(0,0,0,0.5); border: 1px solid #444; border-radius: 6px; padding: 10px 15px; width: 100%; box-sizing: border-box; margin-bottom: 10px;">
                    <div style="font-size:0.8rem; color:#aaa; margin-bottom:10px; text-transform:uppercase; text-align:center; letter-spacing: 1px;">Rewards</div>
                    
                    <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                        <span><span style="color:#f1c40f; font-weight:bold;">G</span> Gold</span>
                        <span style="color:#2ecc71; font-weight:bold;">250</span>
                    </div>
                    
                    <div style="display:flex; justify-content:space-between;">
                        <span><img src="./assets/LeonianMedal.png" style="width:20px; vertical-align:middle; margin-right:5px;"> Leonian Medals</span>
                        <span style="color:#2ecc71; font-weight:bold;">3 - 8</span>
                    </div>
                </div>
                
                <div style="flex-grow:1;"></div> 
                
                ${actionButtons}
            </div>
        `;
    }
}

function acceptBarracksQuest(questName) {
    if (typeof playClickSound === 'function') playClickSound();
    
    if (questName === 'Pest Control') {
        questPestControlStatus = 'active';
        if (typeof addLog === 'function') addLog("Quest Accepted: Pest Control", "#3498db");
        // Instantly re-render the inspector to show the tracker and hide the accept buttons
        inspectBarracksQuest('Pest Control');
    }
}

// Function to call whenever an enemy dies in combat
function trackQuestKills(deadUnitName) {
    // Only track if the Pest Control quest is currently active
    if (questPestControlStatus === 'active') {
        
        // Check if the dead unit is one of the targeted Goblins
        if (deadUnitName === 'Goblin Warrior' || 
            deadUnitName === 'Goblin Archer' || 
            deadUnitName === 'Goblin Wardrummer') {
            
            goblinsSlain++;
            
            // Log the progress so the player sees it in combat
            if (typeof addLog === 'function') addLog(`Goblin Slain! Progress: ${goblinsSlain}/30`, "#f1c40f");

            // Check if they hit the goal
            if (goblinsSlain >= 30) {
                questPestControlStatus = 'completed';
                if (typeof addLog === 'function') addLog("Quest Objective Complete: Return to the Barracks!", "#2ecc71");
            }
        }
    }
}

// Function to claim the rewards when 30/30 is reached
function turnInQuest(questName) {
    if (typeof playClickSound === 'function') playClickSound();
    
    if (questName === 'Pest Control' && questPestControlStatus === 'completed') {
        // Roll between 3 and 8 Leonian Medals
        const medalReward = Math.floor(Math.random() * 6) + 3; 
        
        // 1. Award Gold
        if (typeof playerGold !== 'undefined') playerGold += 250;
        
        // 2. Award Medals
        let leoMedal = playerItems.find(i => i.id === 'leonian_medal');
        if (leoMedal) {
            leoMedal.count += medalReward;
        } else {
            // If they somehow have 0 medals and the object was removed, recreate it
            playerItems.push({ id: 'leonian_medal', name: 'Leonian Gold Medal', count: medalReward, img: './assets/LeonianMedal.png' });
        }
        
        // 3. Update Quest Status (Mark it done so they can't farm it forever)
        questPestControlStatus = 'turned_in'; 
        
        if (typeof addLog === 'function') addLog(`Quest Complete! Rewarded 250G and ${medalReward} Leonian Medals.`, "#2ecc71");
        alert(`Quest Complete!\nReceived: 250 Gold\nReceived: ${medalReward} Leonian Medals`);
        
        // Refresh the UI or close the board
        closeBarracksQuests();
    }
}

// ============================================================================
// 🎒 INVENTORY VIEW, FILTER & ROUTING LOGIC
// ============================================================================

function filterBag(filterType) {
    if (typeof playClickSound === 'function') playClickSound();

    // Safely highlight active tab
    const tabs = document.querySelectorAll('#card-filter-bar .filter-tab');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    if (filterType === 'all' && tabs[0]) tabs[0].classList.add('active');
    else if (filterType === 'unit' && tabs[1]) tabs[1].classList.add('active');
    else if (filterType === 'ability' && tabs[2]) tabs[2].classList.add('active');
    else if (filterType === 'items' && tabs[3]) tabs[3].classList.add('active');

    const collectionGrid = document.getElementById('collection-grid');
    const itemsGrid = document.getElementById('items-grid');

    if (!collectionGrid || !itemsGrid) return; // Failsafe against crashes

    // Toggle Grids
    if (filterType === 'items') {
        collectionGrid.style.display = 'none';
        itemsGrid.style.display = 'grid'; 
        if (typeof renderItemBag === 'function') renderItemBag(); 
        return; 
    } else {
        collectionGrid.style.display = 'flex'; 
        itemsGrid.style.display = 'none';
    }

    // Filter Cards using dataset tags
    const cards = collectionGrid.children; 
    Array.from(cards).forEach(card => {
        const isAbility = card.dataset.type === 'ability' || card.dataset.isBuff === 'true';

        if (filterType === 'all') {
            card.style.display = ''; 
        } else if (filterType === 'unit') {
            card.style.display = isAbility ? 'none' : '';
        } else if (filterType === 'ability') {
            card.style.display = isAbility ? '' : 'none';
        }
    });
}

// 🌟 THE FIX: Item Names are now rendered beautifully under the icons
function renderItemBag() {
    const grid = document.getElementById('items-grid');
    grid.innerHTML = ''; // Clear old items

    if (playerItems.length === 0) {
        grid.innerHTML = `<div style="color:#666; font-style:italic; grid-column: 1 / -1; text-align:center;">Your bag is empty.</div>`;
        return;
    }

    playerItems.forEach(item => {
        let container = document.createElement('div');
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.alignItems = 'center';
        container.style.gap = '8px';

        let slot = document.createElement('div');
        slot.className = 'item-slot';
        slot.style.backgroundImage = `url('${item.img}')`;

        if (item.count > 1) {
            let countEl = document.createElement('div');
            countEl.className = 'item-count';
            countEl.innerText = item.count;
            slot.appendChild(countEl);
        }

        let nameEl = document.createElement('div');
        nameEl.style.color = 'var(--gold)';
        nameEl.style.fontSize = '0.75rem';
        nameEl.style.fontFamily = 'Cinzel, serif';
        nameEl.style.textAlign = 'center';
        nameEl.style.textShadow = '1px 1px 3px #000';
        nameEl.innerText = item.name;

        container.appendChild(slot);
        container.appendChild(nameEl);
        grid.appendChild(container);
    });
}

// ============================================================================
// 🎵 AUDIO ENGINE
// ============================================================================
function playClickSound() {
    if (clickSfxUrl) playSound(clickSfxUrl);
}

function playSound(url, overlap = true) {
    if (!url || url === 'none') return null;
    const audio = new Audio(url);
    audio.volume = 0.6;
    audio.play().catch(e => console.warn("Audio playback prevented/failed:", e));
    return audio;
}

// ============================================================================
// 📝 EVENT LOG ENGINE
// ============================================================================
function addLog(msg, color = "#fff") {
    const logEl = document.getElementById('event-log');
    if(!logEl) return;
    const entry = document.createElement('div');
    entry.style.color = color;
    entry.style.marginBottom = "6px";
    entry.innerHTML = `> ${msg}`;
    logEl.appendChild(entry);
    logEl.scrollTop = logEl.scrollHeight;
}

// ============================================================================
// 🚀 GAME INITIALIZATION
// ============================================================================
async function initializeGame() {
    document.getElementById('upload-box').style.display = 'none';
    document.getElementById('absorbing-text').style.display = 'block';

    if(menuMusicUrl && !menuAudioEl) {
        menuAudioEl = new Audio(menuMusicUrl);
        menuAudioEl.loop = true; menuAudioEl.volume = 0.4;
        menuAudioEl.play().catch(e=>{});
    }

    let keys = Object.keys(ASSET_LINKS);
    for(let i=0; i<keys.length; i++) {
        let key = keys[i];
        let fileUrl = ASSET_LINKS[key];
        
        document.getElementById('absorbing-text').innerText = `Loading Asset ${i + 1} of ${keys.length}...`;
        const cardData = getCardTemplate(key, fileUrl);
        
        if (cardData.isCardBack) {
            deckBackImg = cardData.img;
            document.getElementById('player-deck-stack').style.backgroundImage = `url("${deckBackImg.replace(/"/g, '&quot;').replace(/'/g, '%27')}")`;
            document.getElementById('enemy-deck-stack').style.backgroundImage = `url("${deckBackImg.replace(/"/g, '&quot;').replace(/'/g, '%27')}")`;
        } else if (cardData.isSlash) { document.documentElement.style.setProperty('--slash-url', `url("${cardData.img.replace(/"/g, '&quot;')}")`);
        // Add these to your existing else-if chain inside the asset loading loop:
        } else if (key === 'praetorian_spear') { 
    document.documentElement.style.setProperty('--praetorian-spear-url', `url(${fileUrl.replace(/"/g, '')})`);
        } else if (key === 'speared_icon') { 
    document.documentElement.style.setProperty('--speared-icon-url', `url(${fileUrl.replace(/"/g, '')})`);
        } else if (cardData.isHealFx) { document.documentElement.style.setProperty('--healfx-url', `url("${cardData.img.replace(/"/g, '&quot;')}")`);
        } else if (cardData.isArrow) { arrowImgUrl = cardData.img; document.documentElement.style.setProperty('--arrow-url', `url("${cardData.img.replace(/"/g, '&quot;')}")`);
        } else if (cardData.isShuriken) { shurikenImgUrl = cardData.img; document.documentElement.style.setProperty('--shuriken-url', `url("${cardData.img.replace(/"/g, '&quot;')}")`);
        } else if (cardData.isIcon) {
            if (cardData.iconType === 'taunted') tauntedImgUrl = cardData.img;
            if (cardData.iconType === 'barrier') barrierImgUrl = cardData.img;
            if (cardData.iconType === 'speared') {
                document.documentElement.style.setProperty('--speared-icon-url', `url("${cardData.img.replace(/"/g, '&quot;')}")`);
            }
            if (cardData.iconType === 'bleed') bleedImgUrl = cardData.img;
            if (cardData.iconType === 'fear') fearDebuffImgUrl = cardData.img;
            if (cardData.iconType === 'shinobimark') shinobiMarkImgUrl = cardData.img;
            if (cardData.iconType === 'atkbuff') atkIconUrl = cardData.img;
        } else if (cardData.isAudio || cardData.isMapBG || cardData.isFX || cardData.isEmptySlot) {
            // Handled inside assets file
        } else if (cardData.isPlayable) {
            cardLibrary.push({...cardData}); 
        }
        await new Promise(r => setTimeout(r, 60)); 
    }
    if (cardLibrary.length === 0) {
        alert("No playable cards found! Check your asset links.");
        return;
    }

    const discardPile = document.getElementById('discard-pile');
    if(discardPile) discardPile.style.display = 'flex';
    
    setTimeout(showOverworldMap, 500); 
}

// ============================================================================
// 🗺️ RPG SCREEN NAVIGATION
// ============================================================================
function showOverworldMap() {
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('world-map-screen').style.display = 'block';
}

function enterLeonia() {
    document.getElementById('world-map-screen').style.display = 'none';
    document.getElementById('leonia-screen').style.display = 'block';
}

function enterTavern() {
    document.getElementById('leonia-screen').style.display = 'none';
    document.getElementById('tavern-screen').style.display = 'block';
    
    // If tutorial is at step 0, play the opening sequence
    if (tutorialStep === 0 && typeof startDialogueSequence === "function") {
        startDialogueSequence();
    } else {
        // Otherwise, skip the tutorial and just show the standard Tavern menu
        document.getElementById('tavern-menu').style.display = 'flex';
    }
}

// ============================================================================
// 🛡️ BARRACKS NAVIGATION
// ============================================================================

// 1. Entering the Gate from Leonia Town
function enterBarracksGate() {
    if (typeof playClickSound === 'function') playClickSound();
    document.querySelectorAll('.rpg-screen').forEach(s => s.style.display = 'none');
    const bgScreen = document.getElementById('barracks-gate-screen');
    bgScreen.style.display = 'block';
    bgScreen.style.backgroundImage = "var(--bk1-url)";
}

// 2. Talking to the Guard (Standardized Full Screen)
function talkToBarracksGuard() {
    if (typeof playClickSound === 'function') playClickSound();
    document.querySelectorAll('.rpg-screen').forEach(s => s.style.display = 'none');
    
    const guardScreen = document.getElementById('barracks-screen');
    guardScreen.style.display = 'block';
    guardScreen.style.backgroundImage = "var(--bk2-url)"; 
}

// 3. Leaving the Guard Interaction
function leaveBarracksGuard() {
    if (typeof playClickSound === 'function') playClickSound();
    document.querySelectorAll('.rpg-screen').forEach(s => s.style.display = 'none');
    document.getElementById('barracks-gate-screen').style.display = 'block';
}

// 4. Going inside the actual Barracks (Fixed Background Rendering!)
function enterBarracksInside() {
    if (typeof playClickSound === 'function') playClickSound();
    document.querySelectorAll('.rpg-screen').forEach(s => s.style.display = 'none');
    
    const biScreen = document.getElementById('barracks-inside-screen');
    biScreen.style.display = 'block';
    // This is the line that was missing in the duplicate!
    biScreen.style.backgroundImage = "var(--bk3-url, url('./assets/BK3.png'))";
}

// 5. Returning to Gate from Inside
function backToBarracksGate() {
    if (typeof playClickSound === 'function') playClickSound();
    document.querySelectorAll('.rpg-screen').forEach(s => s.style.display = 'none');
    document.getElementById('barracks-gate-screen').style.display = 'block';
}

// 6. Leaving entirely to go back to Town
function backToLeonia() {
    if (typeof playClickSound === 'function') playClickSound();
    document.querySelectorAll('.rpg-screen').forEach(s => s.style.display = 'none');
    document.getElementById('leonia-screen').style.display = 'block';
}
