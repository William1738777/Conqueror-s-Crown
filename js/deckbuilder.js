// ============================================================================
// 🎒 INVENTORY & DECKBUILDER SYSTEM
// ============================================================================

let playerCollection = [];
let draggingCardData = null;

let battleDeckConfig = {
    l13:     { limit: 15, label: "Level 1-3 Units (15)", validator: (c) => c.type === 'unit' && c.powerLevel <= 3, cards: new Array(15).fill(null) },
    l4:      { limit: 9,  label: "Level 4 Units (9)", validator: (c) => c.type === 'unit' && c.powerLevel === 4, cards: new Array(9).fill(null) },
    ability: { limit: 6,  label: "Ability Cards (6)", validator: (c) => c.type === 'ability' || c.isBuff, cards: new Array(6).fill(null) },
    l5:      { limit: 6,  label: "Level 5 Units (6)", validator: (c) => c.type === 'unit' && c.powerLevel === 5, cards: new Array(6).fill(null) },
    l6:      { limit: 4,  label: "Level 6+ Legends (4)", validator: (c) => c.type === 'unit' && c.powerLevel >= 6, cards: new Array(4).fill(null) }
};

// Remember the last screen the player was on before opening the bag
let previousScreenId = 'tavern-screen'; // Fallback

function openInventory() {
    // 1. Sync the gold display first
    const goldEl = document.getElementById('player-gold');
    if (goldEl && typeof playerGold !== 'undefined') goldEl.innerText = `GOLD: ${playerGold}`;

    // 2. Find which screen is currently visible BEFORE hiding everything
    document.querySelectorAll('.rpg-screen').forEach(s => {
        if (s.style.display === 'block' && s.id !== 'inventory-screen') {
            previousScreenId = s.id;
        }
    });

    // 3. Hide all screens and show the inventory
    document.querySelectorAll('.rpg-screen').forEach(s => s.style.display = 'none');
    document.getElementById('inventory-screen').style.display = 'flex';
    
    // --- FEATURE: Inject Bag Inspector UI if it doesn't exist ---
    if (!document.getElementById('inv-inspector')) {
        const sidebar = document.getElementById('inv-sidebar');
        const exitBtn = sidebar.querySelector('.db-btn');
        const inspectorHtml = `
        <div id="inv-inspector" style="display: none; background: rgba(0,0,0,0.8); border: 1px solid var(--gold); padding: 15px; border-radius: 8px; margin-top: 15px; margin-bottom: 15px; overflow-y: auto; flex-grow: 1; box-shadow: inset 0 0 15px rgba(0,0,0,0.8);">
            <div id="inv-ins-name" style="color: var(--gold); font-weight: bold; text-align: center; font-family: 'Cinzel'; font-size: 1.1rem; border-bottom: 1px solid #444; padding-bottom: 5px;">Select Card</div>
            <div style="text-align: center;"><img id="inv-ins-art" style="width: 70%; margin-top: 10px; border: 1px solid #444; border-radius: 4px; display: none;"></div>
            <div id="inv-ins-desc" style="font-size: 0.75rem; color: #ccc; margin-top: 10px; line-height: 1.4;"></div>
        </div>`;
        exitBtn.insertAdjacentHTML('beforebegin', inspectorHtml);
    }
    
    // 4. Setup starters if bag is totally empty
    if (playerCollection.length === 0 && battleDeckConfig.l4.cards[0] === null) {
        setupStartersAndCollection();
    }
    
    // 5. Render the UI
    renderInventory();
}

function closeInventory() {
    // 1. Hide the inventory
    document.getElementById('inventory-screen').style.display = 'none';
    
    // 2. Show the screen the player was previously on!
    const prevScreen = document.getElementById(previousScreenId);
    if (prevScreen) {
        prevScreen.style.display = 'block';
    } else {
        // Safe fallback just in case
        document.getElementById('tavern-screen').style.display = 'block';
    }
}

function setupStartersAndCollection() {
    // Populate required starter slots based on the tutorial lore
    battleDeckConfig.l4.cards[0] = {...cardLibrary.find(c => c.name === "Great Knight"), dbId: generateUID()};
    battleDeckConfig.ability.cards[0] = {...cardLibrary.find(c => c.name === "Mana Core"), dbId: generateUID()};

    // Give the player ONLY the actual starter cards (not the whole game library)
    const starterNames = ["Leonian Squire", "Archer", "Leonian Bannerman", "Militia"];
    starterNames.forEach(name => {
        let template = cardLibrary.find(c => c.name === name);
        if(template) {
            // Give them 3 copies of each starter
            for(let i=0; i<3; i++) playerCollection.push({...template, dbId: generateUID()});
        }
    });
}

function renderInventory() {
    const tierContainer = document.getElementById('battle-deck-tiers');
    tierContainer.innerHTML = '';

    Object.keys(battleDeckConfig).forEach(tierKey => {
        const tier = battleDeckConfig[tierKey];
        const group = document.createElement('div');
        group.className = 'tier-group';
        group.innerHTML = `<div class="tier-label">${tier.label}</div>`;

        for (let i = 0; i < tier.limit; i++) {
            const slot = document.createElement('div');
            slot.className = 'deck-slot';
            slot.dataset.tier = tierKey;
            slot.dataset.index = i;

            if (tier.cards[i]) {
                slot.appendChild(createDBCardDOM(tier.cards[i], 'DECK', tierKey, i));
            }

            // Drag Over Validation
            slot.ondragover = (e) => {
                e.preventDefault();
                if (draggingCardData && tier.validator(draggingCardData.card)) {
                    slot.classList.add('valid-hover');
                } else {
                    slot.classList.add('invalid-hover');
                }
            };
            slot.ondragleave = () => slot.classList.remove('valid-hover', 'invalid-hover');
            slot.ondrop = (e) => handleDropToSlot(e, tierKey, i, tier.validator);

            group.appendChild(slot);
        }
        tierContainer.appendChild(group);
    });

    const colGrid = document.getElementById('collection-grid');
    colGrid.innerHTML = '';
    playerCollection.forEach(card => colGrid.appendChild(createDBCardDOM(card, 'COLLECTION', null, null)));
}

function createDBCardDOM(card, location, tierKey, index) {
    const el = document.createElement('div');
    el.className = 'db-card';
    el.draggable = true;
    el.style.backgroundImage = `url('${card.img.replace(/"/g, '&quot;').replace(/'/g, '%27')}')`;
    
    el.addEventListener('dragstart', (e) => {
        draggingCardData = { card: card, from: location, tier: tierKey, index: index };
        if(typeof playSound === 'function' && typeof dragSoundUrl !== 'undefined') playSound(dragSoundUrl, false);
    });
    
    el.addEventListener('dragend', () => { draggingCardData = null; });
    
    // --- FEATURE: Click to inspect in Bag ---
    el.addEventListener('click', () => {
        const ins = document.getElementById('inv-inspector');
        if (ins) {
            ins.style.display = 'flex';
            ins.style.flexDirection = 'column';
            document.getElementById('inv-ins-name').innerText = card.name;
            document.getElementById('inv-ins-art').src = card.img.replace(/"/g, '');
            document.getElementById('inv-ins-art').style.display = 'inline-block';
            
            let descHtml = `<div style="color:#e74c3c; font-weight:bold; margin-bottom:5px; text-align:center;">BASE ATK: ${card.atk || 0} | HP: ${card.maxHp || 1}</div>`;
            if(card.skills && card.skills.length > 0) {
                card.skills.forEach(s => descHtml += `<div style="margin-top:5px; background:rgba(255,255,255,0.05); padding:5px; border-radius:4px;"><span style="color:var(--gold); font-weight:bold;">[${s.name}]</span> <span style="color:var(--mana-color); float:right;">${s.manaCost} MP</span><br>${s.desc}</div>`);
            } else if (card.type === 'unit') {
                descHtml += `<div style="margin-top:5px; background:rgba(255,255,255,0.05); padding:5px; border-radius:4px;"><span style="color:var(--gold); font-weight:bold;">[ATTACK]</span> <span style="color:var(--mana-color); float:right;">1 MP</span><br>Basic attack for ${card.atk || 100} damage.</div>`;
            }
            if(card.passives) {
                card.passives.forEach(p => descHtml += `<div style="margin-top:5px; border-left: 2px solid #e67e22; padding-left: 5px;"><span style="color:#e67e22; font-weight:bold;">[${p.name}]</span><br>${p.desc}</div>`);
            }
            
            document.getElementById('inv-ins-desc').innerHTML = descHtml;
        }
    });
    
    return el;
}

function handleDropToSlot(e, targetTierKey, targetIndex, validatorFn) {
    e.preventDefault();
    document.querySelectorAll('.deck-slot').forEach(s => s.classList.remove('valid-hover', 'invalid-hover'));
    if (!draggingCardData) return;

    const { card, from, tier: originTier, index: originIndex } = draggingCardData;

    if (validatorFn(card)) {
        // If there's already a card in the destination, send it back to collection
        const existingCard = battleDeckConfig[targetTierKey].cards[targetIndex];
        if (existingCard) playerCollection.push(existingCard);

        // Remove from origin
        if (from === 'COLLECTION') {
            playerCollection = playerCollection.filter(c => c.dbId !== card.dbId);
        } else {
            battleDeckConfig[originTier].cards[originIndex] = null;
        }

        // Place in new slot
        battleDeckConfig[targetTierKey].cards[targetIndex] = card;
        
        if(typeof playSound === 'function' && typeof dropSoundUrl !== 'undefined') playSound(dropSoundUrl);
        renderInventory();
    } else {
        if(typeof addLog === 'function') addLog("Invalid slot type/level for this card.", "red");
    }
    draggingCardData = null;
}

function allowDrop(e) { e.preventDefault(); }
function dropToCollection(e) {
    e.preventDefault();
    if (!draggingCardData || draggingCardData.from === 'COLLECTION') return;

    const { card, tier, index } = draggingCardData;
    playerCollection.push(card);
    battleDeckConfig[tier].cards[index] = null;
    
    if(typeof playSound === 'function' && typeof dropSoundUrl !== 'undefined') playSound(dropSoundUrl);
    renderInventory();
    draggingCardData = null;
}

function generateUID() { return 'db_' + Math.random().toString(36).substr(2, 9); }


// ============================================================================
// 💰 SHOP & GACHA SYSTEM
// ============================================================================

function updateGoldUI() {
    const goldEl = document.getElementById('shop-gold-display');
    if(goldEl && typeof playerGold !== 'undefined') goldEl.innerText = `${playerGold}G`;
}

// --- STANDARD BUY MENU ---
function openBuyMenu() {
    const container = document.getElementById('shop-ui-container');
    container.style.display = 'block';
    
    // Build the shop UI frame
    container.innerHTML = `
        <h2 style="color:var(--gold); text-align:center; font-family:'Cinzel'; margin-top:0;">
            GLADINE'S WARES - <span id="shop-gold-display" style="color:#f1c40f;">${playerGold}G</span>
        </h2>
        <button onclick="document.getElementById('shop-ui-container').style.display='none'" style="position:absolute; right:20px; top:20px; background:#e74c3c; color:white; border:none; padding:10px 15px; cursor:pointer; font-weight:bold; border-radius:4px;">EXIT SHOP</button>
        <div id="shop-items" style="display:flex; flex-wrap:wrap; gap:25px; justify-content:center; margin-top:30px;"></div>
    `;

    const items = document.getElementById('shop-items');
    
    // Define standard items to sell (You can add more here!)
    const shopStock = [
        { name: "Squire", cost: 50 },
        { name: "Militia", cost: 50 },
        { name: "Archer", cost: 100 },
        { name: "Bannerman", cost: 150 },
        { name: "Mana Core", cost: 200 }
    ];

    shopStock.forEach(stock => {
        let template = cardLibrary.find(c => c.name.includes(stock.name));
        if(!template) return; // Skip if asset isn't loaded
        
        let itemDiv = document.createElement('div');
        itemDiv.style.cssText = "text-align:center; background:#1a1a1a; padding:15px; border:1px solid #333; border-radius:8px; box-shadow: 0 4px 8px rgba(0,0,0,0.5);";
        
        // Use your existing createCardDOM to render the visual
        let visualCard = createCardDOM('shop_item_' + stock.name, template, true);
        visualCard.style.position = 'relative';
        
        itemDiv.appendChild(visualCard);
        itemDiv.innerHTML += `
            <div style="margin-top:15px; color:var(--gold); font-size:1.2rem; font-weight:bold;">${stock.cost} G</div>
            <button class="menu-btn" style="width:100%; padding:8px; margin-top:10px; font-size:0.9rem;" onclick="buyCard('${template.name}', ${stock.cost})">PURCHASE</button>
        `;
        
        items.appendChild(itemDiv);
    });
}

function buyCard(cardName, cost) {
    if(typeof playerGold !== 'undefined' && playerGold >= cost) {
        playerGold -= cost;
        let template = cardLibrary.find(c => c.name === cardName);
        if(template) {
            // Add to bag
            playerCollection.push({...template, dbId: generateUID()});
            
            // Audio & UI updates
            if(typeof playClickSound === 'function') playClickSound();
            updateGoldUI();
            
            // Notification
            if (typeof addLog === 'function') addLog(`Bought ${cardName} for ${cost}G!`, "#2ecc71");
            alert(`Successfully purchased ${cardName}! Check your bag.`);
        }
    } else {
        alert("You don't have enough gold for this!");
    }
}

// --- GACHA SUMMON SYSTEM ---
function openSummonMenu() {
    const summonCost = 100;
    if (typeof playerGold === 'undefined' || playerGold < summonCost) {
        alert(`You need ${summonCost} Gold to summon a card!`);
        return;
    }

    if(!confirm(`Offer ${summonCost} Gold to the Core to summon a random card?`)) return;

    // Deduct Gold
    playerGold -= summonCost;
    if(typeof playClickSound === 'function') playClickSound();
    updateGoldUI();

    // 1. Calculate Pull Rarity
    let pull;
    let pool = [];
    let animationTier = "BASE";
    
    // Roll a number between 0 and 100
    let roll = Math.random() * 100; 

    if (roll <= 1) {
        // 1% Chance for 7-Star (God Tier)
        pool = cardLibrary.filter(c => c.powerLevel >= 7);
        animationTier = "GOD";
    } else if (roll <= 5) {
        // 4% Chance for 6-Star (Legendary)
        pool = cardLibrary.filter(c => c.powerLevel === 6);
        animationTier = "GOD"; 
    } else if (roll <= 15) {
        // 10% Chance for 5-Star (Epic)
        pool = cardLibrary.filter(c => c.powerLevel === 5);
        animationTier = "EPIC";
    } else if (roll <= 30) {
        // 15% Chance for 4-Star (Super Rare)
        pool = cardLibrary.filter(c => c.powerLevel === 4);
        animationTier = "EPIC";
    } else if (roll <= 50) {
        // 20% Chance for Spells/Abilities (Usually PowerLevel 0)
        pool = cardLibrary.filter(c => c.type === 'ability' || c.isBuff);
        animationTier = "BASE";
    } else if (roll <= 70) {
        // 20% Chance for 3-Star (Rare)
        pool = cardLibrary.filter(c => c.powerLevel === 3 && c.type === 'unit');
        animationTier = "BASE";
    } else {
        // 30% Chance for 1 or 2-Star (Common)
        pool = cardLibrary.filter(c => (c.powerLevel === 1 || c.powerLevel === 2) && c.type === 'unit');
        animationTier = "BASE";
    }

    // Failsafe: If a specific rarity pool is completely empty, grab any random card
    if (!pool || pool.length === 0) pool = cardLibrary;

    // Pick a random card from the chosen pool
    pull = pool[Math.floor(Math.random() * pool.length)];

    // 2. Add to Collection
    playerCollection.push({...pull, dbId: generateUID()});

    // 3. Play the appropriate Reveal Animation based on the tier
    if (animationTier === "GOD") {
        showGodTierSummonAnimation(pull);
    } else if (animationTier === "EPIC") {
        showEpicSummonAnimation(pull);
    } else {
        showSummonAnimation(pull);
    }
}

// ==========================================
// 🌟 TIER 1: BASE SUMMON ANIMATION (1-3 Stars)
// ==========================================
function showSummonAnimation(cardData) {
    const overlay = document.createElement('div');
    overlay.className = 'summon-overlay';
    
    overlay.innerHTML = `
        <div class="energy-sphere"></div>
        <div class="flash-bang"></div>
        <div class="revealed-card-wrapper">
            <h1 style="color:var(--gold); font-family:'Cinzel'; text-shadow:0 0 15px #f1c40f; letter-spacing:2px; margin-bottom: 20px; font-size: 1rem;">A GUARDIAN ANSWERS THE CALL...</h1>
            <div id="summon-card-target"></div>
            <button class="btn-main" style="margin-top:30px; padding:10px 20px; font-size: 0.8rem; border:1px solid var(--gold);" onclick="this.closest('.summon-overlay').remove()">ACCEPT CARD</button>
        </div>
    `;
    document.body.appendChild(overlay);

    let cardDOM = createCardDOM('summoned_card', cardData, true);
    cardDOM.style.boxShadow = "0 0 30px var(--gold)";
    overlay.querySelector('#summon-card-target').appendChild(cardDOM);

    if (typeof playSound === 'function') {
        if (typeof beamAudioUrl !== 'undefined') playSound(beamAudioUrl);
        setTimeout(() => { if (typeof buffActivatedUrl !== 'undefined') playSound(buffActivatedUrl); }, 2000); 
    }
}

// ==========================================
// 🌟 TIER 2: EPIC SUMMON ANIMATION (4-5 Stars)
// ==========================================
function showEpicSummonAnimation(cardData) {
    const overlay = document.createElement('div');
    overlay.className = 'summon-overlay';
    overlay.style.background = 'radial-gradient(circle, #2c1a40 0%, #000 100%)';
    overlay.style.perspective = '1000px';

    let sparks = '';
    for(let i = 0; i < 20; i++) {
        let leftOffset = (Math.random() * 500) - 250; 
        let delay = Math.random() * 1.5; 
        sparks += `<div class="divine-spark charging-element" style="left: calc(50% + ${leftOffset}px); animation-delay: ${delay}s;"></div>`;
    }

    overlay.innerHTML = `
        <div class="shake-container">
            <div class="magic-circle charging-element"></div>
            <div class="magic-circle inner charging-element"></div>
            <div class="light-pillar charging-element"></div>
            <div class="light-pillar secondary charging-element"></div>
            ${sparks}
            <div class="epic-shockwave"></div>
        </div>
        <div class="flash-bang"></div>
        <div class="revealed-card-wrapper" style="animation-delay: 3.5s;">
            <h1 style="color:#f1c40f; font-family:'Cinzel'; text-shadow:0 0 25px #f1c40f, 0 0 10px #fff; letter-spacing:6px; margin-bottom: 20px; font-size: 1.3rem;">A LEGEND AWAKENS</h1>
            <div style="position: relative;" id="epic-card-target">
                <div class="card-aura"></div>
            </div>
            <button class="btn-main" style="margin-top:40px; padding:12px 25px; box-shadow: 0 0 15px #9b59b6; border: 2px solid #f1c40f;" onclick="this.closest('.summon-overlay').remove()">CLAIM LEGEND</button>
        </div>
    `;
    document.body.appendChild(overlay);

    let cardDOM = createCardDOM('summoned_card', cardData, true);
    cardDOM.style.boxShadow = "inset 0 0 30px #9b59b6, 0 0 30px #f1c40f";
    cardDOM.style.border = "3px solid #f1c40f";
    cardDOM.style.position = "relative";
    cardDOM.style.zIndex = "2";
    overlay.querySelector('#epic-card-target').appendChild(cardDOM);

    setTimeout(() => { document.querySelectorAll('.charging-element').forEach(el => el.remove()); }, 2900);

    if (typeof playSound === 'function') {
        if (typeof beamAudioUrl !== 'undefined') playSound(beamAudioUrl);
        setTimeout(() => { if (typeof buffActivatedUrl !== 'undefined') playSound(buffActivatedUrl); }, 3000); 
    }
}

// ==========================================
// 🌟 TIER 3: GOD SUMMON ANIMATION (6-7 Stars)
// ==========================================
function showGodTierSummonAnimation(cardData) {
    const overlay = document.createElement('div');
    overlay.className = 'summon-overlay';
    overlay.style.background = '#000';
    overlay.style.perspective = '1000px';

    overlay.innerHTML = `
        <div class="god-shake" id="shake-core">
            <div class="singularity charging-element"></div>
            <div class="accretion-disk charging-element"></div>
            <div class="supernova"></div>
        </div>
        <div class="revealed-card-wrapper" style="animation-delay: 4s;">
            <h1 style="color:#fff; font-family:'Cinzel'; text-shadow:0 0 20px #fff, 0 0 40px #f1c40f; letter-spacing:10px; margin-bottom: 30px; font-size: 1.5rem;">DIVINE ENTITY MANIFESTED</h1>
            <div style="position: relative;" id="god-card-target">
                <div class="god-halo-container">
                    <div class="god-halo halo-1"></div>
                    <div class="god-halo halo-2"></div>
                    <div class="god-halo halo-3"></div>
                </div>
            </div>
            <button class="btn-main" style="margin-top:50px; padding:15px 30px; background: transparent; color: #fff; border: 2px solid #fff; box-shadow: 0 0 20px #f1c40f; backdrop-filter: blur(5px);" onclick="this.closest('.summon-overlay').remove()">SUBMIT TO WILL</button>
        </div>
    `;
    document.body.appendChild(overlay);

    let cardDOM = createCardDOM('summoned_card', cardData, true);
    cardDOM.style.boxShadow = "0 0 50px #fff, inset 0 0 30px #f1c40f";
    cardDOM.style.border = "4px solid #fff";
    cardDOM.style.position = "relative";
    cardDOM.style.zIndex = "2";
    overlay.querySelector('#god-card-target').appendChild(cardDOM);

    const shakeCore = overlay.querySelector('#shake-core');
    let dustInterval = setInterval(() => {
        let dust = document.createElement('div');
        dust.className = 'cosmic-dust charging-element';
        let angle = Math.random() * Math.PI * 2;
        let distance = 600 + Math.random() * 400; 
        dust.style.setProperty('--startX', `${Math.cos(angle) * distance}px`);
        dust.style.setProperty('--startY', `${Math.sin(angle) * distance}px`);
        shakeCore.appendChild(dust);
        setTimeout(() => { if (dust) dust.remove(); }, 1000);
    }, 50); 

    setTimeout(() => {
        clearInterval(dustInterval);
        document.querySelectorAll('.charging-element').forEach(el => el.remove());
    }, 3450);

    if (typeof playSound === 'function') {
        if (typeof beamAudioUrl !== 'undefined') playSound(beamAudioUrl);
        setTimeout(() => { if (typeof kinSanAudioUrl !== 'undefined') playSound(kinSanAudioUrl); }, 3400); 
    }
}
