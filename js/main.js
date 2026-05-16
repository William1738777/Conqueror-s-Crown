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
let deckBackImg = ''; let arrowImgUrl = ''; let shurikenImgUrl = ''; let kinSanAudioUrl = ''; let kinSfx1Url = ''; let kinSfx2Url = ''; let bloodAudioUrl = ''; let bodyShotAudioUrl = ''; let arrowHitAudioUrl = ''; let healAudioUrl = ''; let menuMusicUrl = ''; let menuAudioEl = null; let jadenLockUrl = ''; let jadenBulletUrl = ''; let jadenSfx1 = ''; let jadenSfx2 = ''; let jadenSfx3 = ''; let rolynSfx1Url = ''; let rolynSfx2Url = ''; let shieldBlockAudioUrl = ''; let tauntedImgUrl = ''; let barrierImgUrl = ''; let bleedImgUrl = ''; let shinobiMarkImgUrl = ''; let atkIconUrl = ''; let abilityActivatedUrl = ''; let buffActivatedUrl = ''; let drawSfxUrl = ''; let placeSfxUrl = ''; let dragSoundUrl = ''; let dropSoundUrl = ''; let clickSfxUrl = ''; let villagerSuicideSfxUrl = ''; let beamAudioUrl = ''; let healSfxVoiceUrl = ''; let healSfxVoice2Url = ''; let shieldSfxVoiceUrl = ''; let shieldSfxVoice2Url = ''; let shieldSfxUrl = '';

// --- GAME ENGINE GLOBALS ---
let pQueue = [], eQueue = [];
let isExecuting = false;
let pDeck = [], eDeck = [];
let draggedCardId = null;
let isTargeting = false;
let pendingSkill = null;
let targetCountReq = 1;
let selectedTargets = [];
let dragAudioEl = null;

// ============================================================================
// ⚙️ INITIALIZATION & ASSET PRELOADING
// ============================================================================
async function initializeGame() {
    document.getElementById('upload-box').style.display = 'none';
    const loadText = document.getElementById('absorbing-text');
    loadText.style.display = 'block';
    
    // 1. Force the browser to actually download & cache all files first
    let assetEntries = Object.entries(ASSET_LINKS);
    let totalAssets = assetEntries.length;
    let loadedAssets = 0;

    const loadPromises = assetEntries.map(([name, url]) => {
        return new Promise((resolve) => {
            let cleanUrl = url.replace(/"/g, '').replace(/'/g, '%27');
            let isAudio = cleanUrl.endsWith('.mp3');

            if (isAudio) {
                let audio = new Audio();
                audio.oncanplaythrough = () => { loadedAssets++; updateProgress(); resolve(); };
                audio.onerror = () => { loadedAssets++; updateProgress(); resolve(); }; 
                audio.src = cleanUrl;
                audio.load();
            } else {
                let img = new Image();
                img.onload = () => { loadedAssets++; updateProgress(); resolve(); };
                img.onerror = () => { loadedAssets++; updateProgress(); resolve(); };
                img.src = cleanUrl;
            }
        });
    });

    function updateProgress() {
        let pct = Math.floor((loadedAssets / totalAssets) * 100);
        loadText.innerText = `Downloading Assets... ${pct}%`;
    }

    updateProgress(); // Show 0% immediately
    await Promise.all(loadPromises); // Wait for every single file to finish downloading

    // 2. Now parse the card templates for the logic engine
    loadText.innerText = "Structuring Decks...";
    cardLibrary = []; // Reset just in case
    
    for (const [name, url] of assetEntries) {
        let cardData = getCardTemplate(name, url);
        // Skip background/FX templates from going into the playable deck arrays
        if (cardData.isAudio || cardData.isMapBG || cardData.isFX || cardData.isEmptySlot || cardData.isIcon || cardData.isSlash || cardData.isHealFx || cardData.isArrow || cardData.isShuriken || cardData.isMenuBG || cardData.isCardBack) {
            continue; 
        } else if (cardData.isPlayable) {
            cardLibrary.push({...cardData}); 
        }
    }
    
    if (cardLibrary.length === 0) {
        alert("No playable cards found! Check your asset links.");
        return;
    }
    
    // 3. Transition to the game
    loadText.innerText = "Done!";
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
// 🔊 AUDIO CONTROLLERS
// ============================================================================
function playSound(url, wait = false) {
    if(!url || url === '' || url === 'none') return null;
    let audio = new Audio(url.replace(/"/g, '').replace(/'/g, '%27'));
    audio.play().catch(e => console.log("Audio play prevented:", e));
    return audio;
}

function playMenuMusic() {
    if(menuAudioEl) return; 
    if(!menuMusicUrl || menuMusicUrl === '' || menuMusicUrl === 'none') return;
    
    menuAudioEl = new Audio(menuMusicUrl.replace(/"/g, '').replace(/'/g, '%27'));
    menuAudioEl.loop = true;
    menuAudioEl.volume = 0.5; 
    menuAudioEl.play().catch(e => console.log("Music play prevented:", e));
}

function playClickSound() {
    if(!clickSfxUrl || clickSfxUrl === '' || clickSfxUrl === 'none') return;
    let audio = new Audio(clickSfxUrl.replace(/"/g, '').replace(/'/g, '%27'));
    audio.volume = 0.7;
    audio.play().catch(e => console.log("Click sound prevented:", e));
}

// ============================================================================
// 🖱️ MAP DRAG LOGIC (Overworld)
// ============================================================================
const mapContainer = document.getElementById('world-map-screen');
let isDraggingMap = false;
let startX, startY, scrollLeft, scrollTop;

mapContainer.addEventListener('mousedown', (e) => {
    isDraggingMap = true;
    mapContainer.classList.add('grabbing');
    startX = e.pageX - mapContainer.offsetLeft;
    startY = e.pageY - mapContainer.offsetTop;
    scrollLeft = mapContainer.scrollLeft;
    scrollTop = mapContainer.scrollTop;
});

mapContainer.addEventListener('mouseleave', () => {
    isDraggingMap = false;
    mapContainer.classList.remove('grabbing');
});

mapContainer.addEventListener('mouseup', () => {
    isDraggingMap = false;
    mapContainer.classList.remove('grabbing');
});

mapContainer.addEventListener('mousemove', (e) => {
    if (!isDraggingMap) return;
    e.preventDefault();
    const x = e.pageX - mapContainer.offsetLeft;
    const y = e.pageY - mapContainer.offsetTop;
    const walkX = (x - startX) * 2; 
    const walkY = (y - startY) * 2;
    mapContainer.scrollLeft = scrollLeft - walkX;
    mapContainer.scrollTop = scrollTop - walkY;
});
