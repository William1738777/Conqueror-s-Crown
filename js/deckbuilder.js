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

function openInventory() {
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
    
    if (playerCollection.length === 0 && battleDeckConfig.l4.cards[0] === null) {
        setupStartersAndCollection();
    }
    renderInventory();
}

function closeInventory() {
    document.getElementById('inventory-screen').style.display = 'none';
    document.getElementById('tavern-screen').style.display = 'block';
}

function setupStartersAndCollection() {
    // Populate required starter slots based on the tutorial lore
    battleDeckConfig.l4.cards[0] = {...cardLibrary.find(c => c.name === "Great Knight"), dbId: generateUID()};
    battleDeckConfig.ability.cards[0] = {...cardLibrary.find(c => c.name === "Mana Core"), dbId: generateUID()};

    // Populate the rest of the collection for testing (3 of everything else)
    cardLibrary.forEach(c => {
        if (c.name !== "Great Knight" && c.name !== "Mana Core") {
            for(let i=0; i<3; i++) playerCollection.push({...c, dbId: generateUID()});
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
