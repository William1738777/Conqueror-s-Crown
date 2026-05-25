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
    { id: 'leonian_medal', name: 'Leonian Gold Medal', count: 120, img: './assets/LeoniandMedal.png' },
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

// Overwrite the placeholder you made earlier
function openBarracksShop() {
    if (typeof playClickSound === 'function') playClickSound();
    document.getElementById('barracks-shop-panel').classList.add('open');
}

function closeBarracksShop() {
    if (typeof playClickSound === 'function') playClickSound();
    document.getElementById('barracks-shop-panel').classList.remove('open');
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
        } else {
            alert("Error: Praetorian Guard not found in card library.");
        }
    } else {
        // Not enough currency
        alert(`Insufficient funds!\nYou need 100 Leonian Medals and 3 Valorian Medals.\nYou have: ${leoCount} Leonian, ${valCount} Valorian.`);
    }
}

// ============================================================================
// 🎒 INVENTORY "ITEMS" VIEW LOGIC
// ============================================================================

function openItemBag() {
    if (typeof playClickSound === 'function') playClickSound();
    
    // Hide Cards & Card Filters
    document.getElementById('inventory-grid').style.display = 'none';
    document.getElementById('card-filter-bar').style.display = 'none';
    
    // Show Items & Return Button
    document.getElementById('items-grid').style.display = 'grid';
    document.getElementById('return-to-cards-container').style.display = 'flex';
    
    renderItemBag();
}

function closeItemBag() {
    if (typeof playClickSound === 'function') playClickSound();
    
    // Show Cards & Card Filters
    document.getElementById('inventory-grid').style.display = 'grid';
    document.getElementById('card-filter-bar').style.display = 'flex';
    
    // Hide Items & Return Button
    document.getElementById('items-grid').style.display = 'none';
    document.getElementById('return-to-cards-container').style.display = 'none';
}

function renderItemBag() {
    const grid = document.getElementById('items-grid');
    grid.innerHTML = ''; // Clear old items

    if (playerItems.length === 0) {
        grid.innerHTML = `<div style="color:#666; font-style:italic; grid-column: 1 / -1; text-align:center;">Your bag is empty.</div>`;
        return;
    }

    playerItems.forEach(item => {
        let slot = document.createElement('div');
        slot.className = 'item-slot';
        slot.style.backgroundImage = `url('${item.img}')`;
        slot.title = item.name; // Shows name on hover

        // Only show the number if they have more than 1
        if (item.count > 1) {
            let countEl = document.createElement('div');
            countEl.className = 'item-count';
            countEl.innerText = item.count;
            slot.appendChild(countEl);
        }

        grid.appendChild(slot);
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

function enterBarracks() {
    // Hide the Leonia town screen and show the Barracks interaction
    document.getElementById('leonia-screen').style.display = 'none';
    document.getElementById('barracks-screen').style.display = 'flex';
    
    if (typeof playClickSound === 'function') playClickSound();
}

function leaveBarracks() {
    // Hide the Barracks and return to Leonia
    document.getElementById('barracks-screen').style.display = 'none';
    document.getElementById('leonia-screen').style.display = 'block';
    
    if (typeof playClickSound === 'function') playClickSound();
}
