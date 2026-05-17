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
let pSkeletonMana = 0, eSkeletonMana = 0; 
let cardInstances = {};
let globalTargetedThisTurn = [];
let playerGold = 500;

// --- TUTORIAL STATE ---
let isTutorialMode = false;
let tutorialStep = 0;
let tutorialLock = false; 

// --- AUDIO & ASSET GLOBALS ---
let deckBackImg = ''; let arrowImgUrl = ''; let shurikenImgUrl = ''; let kinSanAudioUrl = ''; let kinSfx1Url = ''; let kinSfx2Url = ''; let bloodAudioUrl = ''; let bodyShotAudioUrl = ''; let arrowHitAudioUrl = ''; let healAudioUrl = ''; let menuMusicUrl = ''; let menuAudioEl = null; let jadenLockUrl = ''; let jadenBulletUrl = ''; let jadenSfx1 = ''; let jadenSfx2 = ''; let jadenSfx3 = ''; let rolynSfx1Url = ''; let rolynSfx2Url = ''; let shieldBlockAudioUrl = ''; let tauntedImgUrl = ''; let barrierImgUrl = ''; let bleedImgUrl = ''; let shinobiMarkImgUrl = '';
let dragSoundUrl = ''; let dropSoundUrl = ''; let abilityActivatedUrl = ''; let buffActivatedUrl = ''; let clickSfxUrl = ''; let beamAudioUrl = ''; let drawSfxUrl = ''; let placeSfxUrl = ''; let villagerSuicideSfxUrl = ''; let healSfxVoiceUrl = ''; let healSfxVoice2Url = ''; let shieldSfxVoiceUrl = ''; let shieldSfxVoice2Url = ''; let shieldSfxUrl = '';

function playClickSound() {
    if (clickSfxUrl) { let audio = new Audio(clickSfxUrl); audio.volume = 0.5; audio.play().catch(e => console.log(e)); }
}

async function initializeGame() {
    document.getElementById('upload-box').style.display = 'none';
    document.getElementById('absorbing-text').style.display = 'block';

    for (let key in ASSET_LINKS) {
        let cardData = getCardTemplate(key, ASSET_LINKS[key]);
        if (cardData.isMenuBG || cardData.isCardBack) {
            // Handled inside assets file
        } else if (cardData.isAudio || cardData.isMapBG || cardData.isFX || cardData.isEmptySlot || cardData.isIcon) {
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
    document.querySelectorAll('.rpg-screen').forEach(s => s.style.display = 'none');
    document.getElementById('tavern-screen').style.display = 'block';
    
    // Check if this is the very first time entering the Tavern (The Tutorial)
    if (tutorialStep === 0) {
        // 1. Hide the top-left menu
        document.getElementById('tavern-menu').style.display = 'none';
        
        // 2. Force the dialogue box to appear ALWAYS
        document.getElementById('rpg-dialogue-box').style.display = 'flex';
        
        // 3. Start Ben's tutorial dialogue automatically
        if (typeof startDialogueSequence === "function") {
            startDialogueSequence();
        } else {
            console.error("ERROR: tutorial.js is broken and did not load!");
            alert("tutorial.js has a syntax error and failed to load.");
        }
    } else {
        // NORMAL VISIT (After the tutorial)
        // 1. Show the top-left menu options
        document.getElementById('tavern-menu').style.display = 'flex';
        
        // 2. Hide the dialogue box until you click "Talk to Ben"
        document.getElementById('rpg-dialogue-box').style.display = 'none';
    }
}
