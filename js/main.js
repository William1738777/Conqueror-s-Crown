// ============================================================================
// ⚙️ GLOBAL VARIABLES (Shared across all files)
// ============================================================================
let cardLibrary = [];
let eHandData = [];
let currentTurn = 'PLAYER', turnCount = 1;
let pMana = 8, eMana = 8;
let pCoreHP = 2000, eCoreHP = 2000;
let pArashiSouls = 0, eArashiSouls = 0; 
let pSquiresFallen = 0, eSquiresFallen = 0; 
let pSkeletonMana = 0, eSkeletonMana = 0; // Added from VersionFight
let cardInstances = {};
let globalTargetedThisTurn = [];

// --- TUTORIAL STATE ---
let isTutorialMode = false;
let tutorialStep = 0;
let tutorialLock = false; 

// --- AUDIO & ASSET GLOBALS ---
let deckBackImg = ''; let arrowImgUrl = ''; let shurikenImgUrl = ''; let kinSanAudioUrl = ''; let kinSfx1Url = ''; let kinSfx2Url = ''; let bloodAudioUrl = ''; let bodyShotAudioUrl = ''; let arrowHitAudioUrl = ''; let healAudioUrl = ''; let menuMusicUrl = ''; let menuAudioEl = null; let jadenLockUrl = ''; let jadenBulletUrl = ''; let jadenSfx1 = ''; let jadenSfx2 = ''; let jadenSfx3 = ''; let rolynSfx1Url = ''; let rolynSfx2Url = ''; let shieldBlockAudioUrl = ''; let tauntedImgUrl = ''; let barrierImgUrl = ''; let bleedImgUrl = ''; let shinobiMarkImgUrl = ''; let atkIconUrl = ''; let drawSfxUrl = ''; let placeSfxUrl = ''; let abilityActivatedUrl = ''; let buffActivatedUrl = ''; let dragSoundUrl = ''; let dropSoundUrl = ''; let clickSfxUrl = ''; let dragAudioEl = null; let villagerSuicideSfxUrl = ''; let healSfxVoiceUrl = ''; let healSfxVoice2Url = ''; let shieldSfxVoiceUrl = ''; let shieldSfxVoice2Url = ''; let shieldSfxUrl = ''; let beamAudioUrl = '';

// --- COMBAT QUEUE GLOBALS ---
let pQueue = []; let eQueue = []; let isTargeting = false; let pendingSkill = null; let isExecuting = false; let targetCountReq = 1; let selectedTargets = []; let draggedCardId = null; let pDeck = []; let eDeck = [];

const log = document.getElementById('event-log');

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
        } else if (cardData.isHealFx) { document.documentElement.style.setProperty('--healfx-url', `url("${cardData.img.replace(/"/g, '&quot;')}")`);
        } else if (cardData.isArrow) { arrowImgUrl = cardData.img; document.documentElement.style.setProperty('--arrow-url', `url("${cardData.img.replace(/"/g, '&quot;')}")`);
        } else if (cardData.isShuriken) { shurikenImgUrl = cardData.img; document.documentElement.style.setProperty('--shuriken-url', `url("${cardData.img.replace(/"/g, '&quot;')}")`);
        } else if (cardData.isIcon) {
            if (cardData.iconType === 'taunted') tauntedImgUrl = cardData.img;
            if (cardData.iconType === 'barrier') barrierImgUrl = cardData.img;
            if (cardData.iconType === 'bleed') bleedImgUrl = cardData.img;
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
