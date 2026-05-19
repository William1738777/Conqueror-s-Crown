// ============================================================================
// ⚔️ ENGINE.JS - PART 1: UI, DECKS, & DRAG/DROP (Merged High-Stakes + Tutorial)
// ============================================================================

// --- 🎴 DECK GENERATOR & INITIALIZATION ---
function buildDeck() {
    let deck = [];
    let legendaries = cardLibrary.filter(c => c.name === "KIN-RYU" || c.name === "Rolyn");
    let jadens = cardLibrary.filter(c => c.name === "Jaden");
    let fiveStars = cardLibrary.filter(c => c.powerLevel === 5 && c.name !== "Jaden"); 
    let fodders = cardLibrary.filter(c => c.powerLevel < 5 && c.type === 'unit');
    let spells = cardLibrary.filter(c => c.type === 'ability' || c.isBuff);

    legendaries.forEach(c => deck.push(c)); 
    jadens.forEach(c => { deck.push(c); deck.push(c); }); 
    fiveStars.forEach(c => { deck.push(c); deck.push(c); deck.push(c); }); 

    while(deck.length < 40) {
        if (Math.random() > 0.4 && fodders.length > 0) deck.push(fodders[Math.floor(Math.random() * fodders.length)]);
        else if (spells.length > 0) deck.push(spells[Math.floor(Math.random() * spells.length)]);
        else if (fodders.length > 0) deck.push(fodders[Math.floor(Math.random() * fodders.length)]);
    }
    
    deck = deck.slice(0, 40); 
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

function startGame() {
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('game-area').style.display = 'flex';
    document.getElementById('inventory-btn').style.display = 'none';
    pDeck = buildDeck();
    eDeck = buildDeck();
    document.getElementById('p-deck-count').innerText = pDeck.length;
    document.getElementById('e-deck-count').innerText = eDeck.length;
    addLog("BATTLE COMMENCED. No combat allowed on Turn 1.", "var(--gold)");
    updateUI(); 
    const drawBtn = document.getElementById('draw-cards-btn');
    drawBtn.style.display = "block";
    drawBtn.innerText = "DRAW HAND";
}

// --- 🛠️ DOM & UI LOGIC ---
function updateUI() {
    let manaDisp = document.getElementById('mana-display-num');
    if(manaDisp) manaDisp.innerText = pMana;
    
    document.getElementById('enemy-core-hp').innerText = isTutorialMode ? `BEN'S CORE: ${Math.ceil(eCoreHP)} | MANA: ${eMana}` : `ENEMY CORE: ${Math.ceil(eCoreHP)} | MANA: ${eMana}`;
    document.getElementById('player-core-hp').innerText = `PLAYER CORE: ${Math.ceil(pCoreHP)}`;
    
    document.getElementById('exec-btn').innerText = `EXECUTE PENDING (${pQueue.length})`;
    document.getElementById('exec-btn').disabled = isExecuting || pQueue.length === 0;
    
    document.getElementById('cancel-btn').style.display = (pQueue.length > 0 || isTargeting) ? "block" : "none";
    document.getElementById('cancel-btn').disabled = isExecuting || (pQueue.length === 0 && !isTargeting);
    
    document.getElementById('end-turn-btn').disabled = isExecuting;
    document.getElementById('draw-cards-btn').disabled = isExecuting;

    let pLastStand = false, eLastStand = false;
    let pBuffSlot = document.getElementById('player-buff-slot').querySelector('.card');
    if (pBuffSlot && cardInstances[pBuffSlot.id].name === "Last Stand") pLastStand = true;
    let eBuffSlot = document.getElementById('enemy-buff-slot').querySelector('.card');
    if (eBuffSlot && cardInstances[eBuffSlot.id].name === "Last Stand") eLastStand = true;
    
    document.querySelectorAll('.card').forEach(c => {
        const data = cardInstances[c.id];
        if (!data) return;
        
        if(data.side === 'ENEMY' && data.type === 'ability' && data.isRevealed) {
            let imgCont = c.querySelector('.card-img-container');
            let titleEl = c.querySelector('.card-title');
            if (imgCont) imgCont.style.backgroundImage = `url('${data.img.replace(/"/g, '&quot;').replace(/'/g, '%27')}')`;
            if (!titleEl) {
                let newTitle = document.createElement('div');
                newTitle.className = 'card-title';
                newTitle.innerText = data.name;
                c.insertBefore(newTitle, imgCont);
            }
        }

        c.querySelectorAll('.placed-badge, .badge-blessing, .badge-shield, .badge-chambered, .badge-taunted, .badge-barrier, .badge-bleed, .badge-block, .badge-shinobi, .badge-atkbuff').forEach(el => el.remove());

        if(data.turnPlaced === turnCount) {
            const b = document.createElement('div'); b.className = 'placed-badge'; b.innerText = '{PLACED}'; c.appendChild(b);
        }
        if(data.blessings > 0) {
            const bl = document.createElement('div'); bl.className = 'badge-blessing'; bl.innerText = '+' + data.blessings; c.appendChild(bl);
        }
        if(data.chamberedRounds > 0) {
            const cr = document.createElement('div'); cr.className = 'badge-chambered';
            cr.style.cssText = "position:absolute; top:20px; right:-5px; background:#e74c3c; color:white; border-radius:50%; width:24px; height:24px; display:flex; justify-content:center; align-items:center; font-size:0.8rem; font-weight:bold; border:1px solid #111; z-index:26; box-shadow:0 0 10px #e74c3c;";
            cr.innerText = data.chamberedRounds; c.appendChild(cr);
        }
        
        let topRightOffset = -8; let topLeftOffset = -8;

        if (data.tauntedBy) {
            c.classList.add('taunted-status');
            if (tauntedImgUrl) {
                const ti = document.createElement('div'); ti.className = 'badge-taunted';
                ti.style.cssText = `position:absolute; top:-8px; right:${topRightOffset}px; width:24px; height:24px; background-image:url('${tauntedImgUrl.replace(/"/g, '&quot;').replace(/'/g, '%27')}'); background-size:contain; background-repeat:no-repeat; z-index:26; filter:drop-shadow(0 0 5px #e74c3c);`;
                c.appendChild(ti); topRightOffset += 24;
            }
        } else { c.classList.remove('taunted-status'); }

        if(data.shield && data.shield > 0 && data.shieldTurns >= turnCount) {
            const sh = document.createElement('div'); sh.className = 'badge-shield'; sh.innerText = '🛡 ' + data.shield; c.appendChild(sh);
            if (barrierImgUrl) {
                const bi = document.createElement('div'); bi.className = 'badge-barrier';
                bi.style.cssText = `position:absolute; top:-8px; right:${topRightOffset}px; width:24px; height:24px; background-image:url('${barrierImgUrl.replace(/"/g, '&quot;').replace(/'/g, '%27')}'); background-size:contain; background-repeat:no-repeat; z-index:26; filter:drop-shadow(0 0 5px #3498db);`;
                c.appendChild(bi); topRightOffset += 24;
            }
        } else { data.shield = 0; }
        
        if(data.atkBuffTurns && data.atkBuffTurns >= turnCount) {
             if (atkIconUrl) {
                 const atkB = document.createElement('div'); atkB.className = 'badge-atkbuff';
                 atkB.style.cssText = `position:absolute; top:-8px; right:${topRightOffset}px; width:24px; height:24px; background-image:url('${atkIconUrl.replace(/"/g, '&quot;').replace(/'/g, '%27')}'); background-size:contain; background-repeat:no-repeat; z-index:26; filter:drop-shadow(0 0 5px #e67e22);`;
                 c.appendChild(atkB); topRightOffset += 24;
             }
        }

        if(data.bleedStacks && data.bleedStacks > 0 && data.bleedTurns >= turnCount) {
            if (bleedImgUrl) {
                const bl = document.createElement('div'); bl.className = 'badge-bleed';
                bl.style.cssText = `position:absolute; top:-8px; right:${topRightOffset}px; width:24px; height:24px; background-image:url('${bleedImgUrl.replace(/"/g, '&quot;').replace(/'/g, '%27')}'); background-size:contain; background-repeat:no-repeat; z-index:26; filter:drop-shadow(0 0 5px #8e44ad); display:flex; justify-content:center; align-items:center; font-size:0.8rem; font-weight:bold; color:white; text-shadow:1px 1px 2px #000, -1px -1px 2px #000;`;
                bl.innerText = data.bleedStacks; c.appendChild(bl); topRightOffset += 24;
            }
        } else { data.bleedStacks = 0; }

        if (data.marks && data.marks > 0) {
            let actualMarks = Math.min(3, data.marks);
            if (shinobiMarkImgUrl) {
                const mk = document.createElement('div'); mk.className = 'badge-shinobi';
                mk.style.cssText = `position:absolute; top:-8px; left:${topLeftOffset}px; width:24px; height:24px; background-image:url('${shinobiMarkImgUrl.replace(/"/g, '&quot;').replace(/'/g, '%27')}'); background-size:contain; background-repeat:no-repeat; z-index:26; filter:drop-shadow(0 0 5px #e74c3c); display:flex; justify-content:center; align-items:center; font-size:0.8rem; font-weight:bold; color:white; text-shadow:1px 1px 2px #000, -1px -1px 2px #000;`;
                mk.innerText = actualMarks; c.appendChild(mk);
            }
        }

        if(data.blockActive) {
            const blk = document.createElement('div'); blk.className = 'placed-badge badge-block'; blk.innerText = '{BLOCK}'; blk.style.background = '#888'; c.appendChild(blk);
        }

        const isDeployed = c.parentElement && c.parentElement.classList.contains('slot');
        if (isDeployed && data.type === 'unit') {
            if (data.side === 'PLAYER' && pLastStand) c.classList.add('golden-glow');
            else if (data.side === 'ENEMY' && eLastStand) c.classList.add('golden-glow');
            else c.classList.remove('golden-glow');
        } else { c.classList.remove('golden-glow'); }
        
        if (data.ambushTurns && data.ambushTurns >= turnCount && isDeployed) c.classList.add('ambush-stance');
        else c.classList.remove('ambush-stance');

        if(data.queued) c.classList.add('queued-status'); else c.classList.remove('queued-status');
        if(data.exhausted) c.classList.add('exhausted'); else c.classList.remove('exhausted');
        if(!data.extraAction) c.classList.remove('buff-double-action');
    });
}

// --- CARD DOM & DRAG LOGIC ---
function createCardDOM(id, data, isVisualOnly = false) {
    const c = document.createElement('div');
    c.className = `card`; 
    c.id = id; 
    
    if (!isVisualOnly) c.draggable = true;
    
    let safeImgUrl = data.img.replace(/"/g, '&quot;').replace(/'/g, '%27');
    let safeBackImgUrl = deckBackImg.replace(/"/g, '&quot;').replace(/'/g, '%27');

    let bgImg = `background-image: url('${safeImgUrl}');`;
    if(data.side === 'ENEMY' && data.type === 'ability' && data.turnPlaced > 0 && !data.isRevealed) {
        bgImg = `background-image: url('${safeBackImgUrl}');`;
    }

    let html = `<div class="badge-mana">${data.summonCost}</div>`;
    if(data.side === 'PLAYER' || data.type !== 'ability' || data.isRevealed || isVisualOnly) {
        html += `<div class="card-title">${data.name}</div>`;
    }
    html += `<div class="card-img-container" style="${bgImg}"></div>`;
    
    if((data.type === 'unit' || data.type === 'ability') && !isVisualOnly) {
        if (data.type === 'unit') html += `<div class="card-level">${"★".repeat(data.powerLevel)}</div>`;
        html += `<div class="card-hp-footer">
                    <div class="card-hp-bar-container"><div class="card-hp-trail" style="width: ${(data.hp/data.maxHp)*100}%"></div><div class="card-hp-current" style="width: ${(data.hp/data.maxHp)*100}%"></div></div>
                    <div class="card-hp-number">${Math.ceil(data.hp)}</div>
                 </div>`;
    }

    c.innerHTML = html;
    
    if (isVisualOnly) return c;

    c.addEventListener('dragstart', (e) => {
        if(tutorialLock && !c.classList.contains('tut-highlight-glow')) return e.preventDefault();
        if(currentTurn !== 'PLAYER' || isExecuting) return e.preventDefault();
        let liveData = cardInstances[id];
        if(liveData.exhausted || liveData.queued || liveData.tauntedBy) return e.preventDefault();

        const isDeployed = c.parentElement.classList.contains('slot');
        if (isDeployed) return e.preventDefault();

        if (liveData.summonRequires && liveData.side === 'PLAYER' && !isTutorialMode) {
            if (liveData.summonRequires.type === 'arashiSouls' && pArashiSouls < liveData.summonRequires.amount) {
                addLog(`Cannot deploy ${liveData.name}. Requires ${liveData.summonRequires.amount} Arashi Souls.`, "#e74c3c");
                showInspector(id, c); return e.preventDefault();
            }
            if (liveData.summonRequires.type === 'squiresFallen' && pSquiresFallen < liveData.summonRequires.amount) {
                addLog(`Cannot deploy ${liveData.name}. Requires ${liveData.summonRequires.amount} Fallen Squire(s).`, "#e74c3c");
                showInspector(id, c); return e.preventDefault();
            }
        }

        draggedCardId = id;
        if(dragAudioEl) dragAudioEl.pause();
        dragAudioEl = playSound(dragSoundUrl, false);

        const dragGhost = c.cloneNode(true);
        dragGhost.style.transform = "none"; dragGhost.style.position = "absolute"; dragGhost.style.top = "-1000px"; dragGhost.style.left = "-1000px";
        document.body.appendChild(dragGhost);
        e.dataTransfer.setDragImage(dragGhost, 70, 98); 
        setTimeout(() => { if(dragGhost.parentNode) dragGhost.parentNode.removeChild(dragGhost); }, 10);

        document.querySelectorAll('.slot[data-side="PLAYER"]').forEach(s => {
            if(tutorialLock && !s.classList.contains('tut-highlight-glow')) {
                s.classList.add('invalid-drop-zone'); return;
            }
            if(s.querySelector('.card')) {
                s.classList.add('invalid-drop-zone'); return;
            }
            if(!liveData.isBuff && liveData.type === s.dataset.allowed && !isDeployed) s.classList.add('valid-drop-zone');
            else if (liveData.isBuff && s.dataset.allowed === 'ability' && !isDeployed) s.classList.add('valid-drop-zone');
            else s.classList.add('invalid-drop-zone');
        });

        e.dataTransfer.setData('text', id);
    });

    c.addEventListener('dragend', () => {
        draggedCardId = null;
        document.querySelectorAll('.slot').forEach(s => s.classList.remove('valid-drop-zone', 'invalid-drop-zone', 'drag-over'));
    });
    
    c.addEventListener('click', () => {
        if(tutorialLock && !c.classList.contains('tut-highlight-glow') && !c.classList.contains('target-glow') && !c.classList.contains('target-heal-glow')) return;
        if(isExecuting) return;
        let liveData = cardInstances[id];
        
        if(isTargeting) {
            let validTarget = false; let targetInst = liveData; 
            
            if(pendingSkill.skillName === "Blessing of the Light") {
                if(targetInst.side === currentTurn && targetInst.type === 'unit') validTarget = true;
            } else if(pendingSkill.skillName === "Double Action") {
                if(targetInst.side === currentTurn && targetInst.type === 'unit' && !targetInst.exhausted && targetInst.turnPlaced < turnCount) validTarget = true;
            } else if(pendingSkill.skillName === "Punishment of the Blessed") {
                if(targetInst.side !== currentTurn && c.parentElement.classList.contains('frontline')) validTarget = true;
            } else if(pendingSkill.skillName === "Sniping Shot" || pendingSkill.skillName === "Lion's Roar") {
                if(targetInst.side !== currentTurn) validTarget = true;
            } else if (pendingSkill.skillName === "Arrow Rain") {
                if (targetInst.side !== currentTurn && c.parentElement.classList.contains('slot')) validTarget = true;
            } else if (pendingSkill.skillName === "BANNER STRIKE") {
                if (targetInst.side !== currentTurn) validTarget = true;
            } else {
                if(targetInst.side !== currentTurn) {
                    let validIds = getValidEnemyTargetIds(targetInst.side);
                    if (validIds.includes(id)) validTarget = true;
                }
            }
            
            if (validTarget) {
                handleTargetSelection(id);
            } else {
                if (targetInst.side === currentTurn && pendingSkill.skillName !== "Blessing of the Light" && pendingSkill.skillName !== "Double Action") {
                    addLog("Invalid allied target clicked! Action auto-cancelled.", "#e74c3c");
                    document.getElementById('cancel-btn').click();
                } else { showInspector(id, c); }
            }
        } else {
            const isDeployed = c.parentElement.classList.contains('slot');
            if (isDeployed && liveData.side === 'PLAYER' && liveData.isBuff && liveData.turnPlaced < turnCount && c.parentElement.classList.contains('ability-slot')) {
                const buffSlot = document.getElementById('player-buff-slot');
                if (!buffSlot.querySelector('.card')) {
                    buffSlot.classList.add('target-buff-glow'); setTimeout(() => buffSlot.classList.remove('target-buff-glow'), 2000);
                }
            }
            showInspector(id, c);
        }
    });
    return c;
}

// --- DRAG AND DROP SLOTS ---
document.querySelectorAll('.slot').forEach(slot => {
    slot.addEventListener('dragenter', (e) => {
        if (draggedCardId && slot.classList.contains('valid-drop-zone')) slot.classList.add('drag-over');
    });
    slot.addEventListener('dragleave', (e) => { slot.classList.remove('drag-over'); });
    slot.ondragover = (e) => e.preventDefault();
    
    slot.ondrop = (e) => {
        if (isExecuting) return;
        const cardId = e.dataTransfer.getData('text');
        if (!cardId) return;
        const cardEl = document.getElementById(cardId);
        const liveData = cardInstances[cardId];
        const isDeployed = cardEl.parentElement.classList.contains('slot');

        if (slot.classList.contains('buff-slot')) return addLog("Use [ACTIVATE BUFF] button to move this card.", "red");

        if(slot.dataset.side === 'PLAYER' && !slot.querySelector('.card') && !isDeployed) {
            if(tutorialLock && !slot.classList.contains('tut-highlight-glow')) return;

            if(liveData.type !== slot.dataset.allowed && !(liveData.isBuff && slot.dataset.allowed === 'ability')) {
                return addLog(`Needs ${slot.dataset.allowed.toUpperCase()} slot.`, "red");
            }
            if (liveData.summonRequires && liveData.summonRequires.type === 'arashiSouls' && pArashiSouls < liveData.summonRequires.amount && !isTutorialMode) return addLog(`Requires Arashi Souls!`, "red");
            if (liveData.summonRequires && liveData.summonRequires.type === 'squiresFallen' && pSquiresFallen < liveData.summonRequires.amount && !isTutorialMode) return addLog(`Requires Fallen Squire!`, "red");
            
            if(pMana >= liveData.summonCost || isTutorialMode) {
                if (!isTutorialMode) pMana -= liveData.summonCost; 
                
                if (liveData.summonRequires && liveData.summonRequires.type === 'arashiSouls') pArashiSouls -= liveData.summonRequires.amount;
                if (liveData.summonRequires && liveData.summonRequires.type === 'squiresFallen') pSquiresFallen -= liveData.summonRequires.amount;

                liveData.turnPlaced = turnCount;
                slot.appendChild(cardEl);
                if(dropSoundUrl) playSound(dropSoundUrl);
                
                if(liveData.type === 'ability') addLog(`Set Ability Card.`, "#9b59b6");
                else addLog(`Summoned <b>${liveData.name}</b>`, "var(--mana-color)");
                
                updateUI(); 
                showInspector(cardId, cardEl);

                // Tutorial progression checks
                if(isTutorialMode) {
                    if(tutorialStep === 1 && cardId === 'p_Squire' && slot.id === 'p-front-center') { tutorialStep = 2; progressTutorial(); }
                    if(tutorialStep === 2 && cardId === 'p_ManaCore' && slot.id === 'p-ability') { tutorialStep = 3; progressTutorial(); }
                    if(tutorialStep === 8 && cardId === 'p_Bannerman') { tutorialStep = 9; progressTutorial(); }
                    if(tutorialStep === 11 && cardId === 'p_GreatKnight') { tutorialStep = 12; progressTutorial(); }
                    if(tutorialStep === 12 && cardId === 'p_Archer') { tutorialStep = 13; progressTutorial(); }
                }
            } else {
                addLog(`Not enough Mana!`, "red");
            }
        }
    };
});

// --- 🔍 INSPECTOR ---
window.activateBuffCard = function(id) {
    if(isExecuting) return;
    const cardEl = document.getElementById(id);
    const liveData = cardInstances[id];
    const slot = document.getElementById(liveData.side === 'PLAYER' ? 'player-buff-slot' : 'enemy-buff-slot');
    
    if (slot.querySelector('.card')) return addLog("Buff slot is occupied!", "red");
    
    slot.appendChild(cardEl);
    liveData.buffTurnsRemaining = 2;
    
    if(buffActivatedUrl) playSound(buffActivatedUrl);
    addLog(`<b>${liveData.name}</b> moved to Buff Slot and activated!`, "#f1c40f");
    
    updateUI(); showInspector(id, cardEl);
}

function showInspector(id, cardElement) {
    const nameUI = document.getElementById('inspect-name'); const subUI = document.getElementById('inspect-sub');
    const skillsUI = document.getElementById('inspect-skills-sector'); const statusUI = document.getElementById('inspect-status-box');
    const sumUI = document.getElementById('inspect-summon-val'); const reqUI = document.getElementById('inspect-summon-req');
    const artUI = document.getElementById('inspect-art-fixed'); const hpTargetUI = document.getElementById('inspect-hp-target');
    const inspector = document.getElementById('card-inspector');
    
    if (id === 'none' || !cardInstances[id]) {
        nameUI.innerText = "Select Card"; subUI.innerText = "N/A"; skillsUI.innerHTML = `<div class="empty-inspector">No actions available.</div>`;
        statusUI.innerHTML = `<div style="text-align:center; color:#666; font-style:italic; margin-top:20px;">No card selected.</div>`;
        sumUI.innerText = "0 MANA"; reqUI.style.display = "none"; artUI.style.display = "none"; hpTargetUI.innerHTML = "";
        inspector.dataset.inspectedId = ""; return;
    }

    const data = cardInstances[id];
    const isDeployed = cardElement && cardElement.parentElement.classList.contains('slot');
    inspector.dataset.inspectedId = id;

    nameUI.innerText = data.name; subUI.innerText = data.title;
    artUI.src = data.img.replace(/"/g, ''); artUI.style.display = "block";

    let pct = Math.max(0, Math.min(100, (data.hp / data.maxHp) * 100)) || 100;
    hpTargetUI.innerHTML = `<div class="inspect-hp-wrapper">
        <div class="inspect-hp-bar-container"><div class="inspect-hp-trail" style="width: ${pct}%"></div><div class="inspect-hp-current" style="width: ${pct}%"></div></div>
        <div class="inspect-hp-number" id="inspect-hp-num" style="background:${pct < 30 ? '#e74c3c' : '#2ecc71'}; color:${pct < 30 ? '#fff' : '#000'}">${Math.ceil(data.hp)}</div>
    </div>`;

    let statusHtml = `<div style="color:#e74c3c; font-weight:bold; font-size:0.85rem; margin-bottom:8px; padding-bottom:8px; border-bottom: 1px solid #333; text-align:center;">BASE ATK: ${data.atk || 0}</div>`;
    if (data.tauntedBy) statusHtml += `<div class="status-item"><div class="status-icon" style="background-image:url('${tauntedImgUrl ? tauntedImgUrl.replace(/"/g, '&quot;').replace(/'/g, '%27') : ''}')"></div><div class="status-desc"><b>TAUNTED:</b> Must attack taunting unit.</div></div>`;
    if (data.bleedStacks > 0) statusHtml += `<div class="status-item"><div class="status-icon" style="background-image:url('${bleedImgUrl ? bleedImgUrl.replace(/"/g, '&quot;').replace(/'/g, '%27') : ''}')"></div><div class="status-desc"><b>BLEED:</b> Takes damage at end of turn. (${data.bleedStacks} Stacks)</div></div>`;
    if (data.shield && data.shield > 0) statusHtml += `<div class="status-item"><div class="status-icon" style="background-image:url('${barrierImgUrl ? barrierImgUrl.replace(/"/g, '&quot;').replace(/'/g, '%27') : ''}')"></div><div class="status-desc"><b>SHIELDED:</b> Absorbs up to ${data.shield} damage.</div></div>`;
    if (data.atkBuffTurns && data.atkBuffTurns >= turnCount) statusHtml += `<div class="status-item"><div class="status-icon" style="background-image:url('${atkIconUrl ? atkIconUrl.replace(/"/g, '&quot;').replace(/'/g, '%27') : ''}')"></div><div class="status-desc"><b>ATK UP:</b> Attack power increased by 8%.</div></div>`;
    if (data.marks > 0) {
        let actualMarks = Math.min(3, data.marks);
        let dmgInc = actualMarks * 6;
        statusHtml += `<div class="status-item"><div class="status-icon" style="background-image:url('${shinobiMarkImgUrl ? shinobiMarkImgUrl.replace(/"/g, '&quot;').replace(/'/g, '%27') : ''}')"></div><div class="status-desc"><b>SHINOBI MARK:</b> Takes +${dmgInc}% damage from Arashi units. (${actualMarks} Stacks)</div></div>`;
    }
    if (data.ambushTurns && data.ambushTurns >= turnCount) {
        statusHtml += `<div class="status-item"><div class="status-desc" style="color: #3498db;"><b>AMBUSH STANCE:</b> Untargettable by enemies.</div></div>`;
    }
    
    if (statusHtml === `<div style="color:#e74c3c; font-weight:bold; font-size:0.85rem; margin-bottom:8px; padding-bottom:8px; border-bottom: 1px solid #333; text-align:center;">BASE ATK: ${data.atk || 0}</div>`) {
        statusHtml += `<div style="color:#666; text-align:center; font-style:italic; padding-top:10px;">No active effects.</div>`;
    }
    statusUI.innerHTML = statusHtml;

    let actionHtml = '';
    if(isDeployed && data.side === 'PLAYER') {
        if(data.exhausted) actionHtml += `<div style="color:#888; font-weight:bold;">[EXHAUSTED]</div>`;
        else if(data.queued) actionHtml += `<div style="color:#f39c12; font-weight:bold;">[ACTION QUEUED]</div>`;
        else if(data.tauntedBy) actionHtml += `<div style="color:#e74c3c; font-weight:bold;">[TAUNTED: WILL AUTO-ATTACK]</div>`;
        else {
            const canAct = (data.turnPlaced < turnCount);
            if (data.isBuff && canAct && cardElement.parentElement.classList.contains('ability-slot')) {
                actionHtml += `<button class="skill-btn tut-btn-target" style="border-color:#f1c40f" onclick="activateBuffCard('${id}')"><span class="skill-name" style="color:#f1c40f">[ACTIVATE BUFF]</span><span class="skill-desc">Move to Buff Slot instantly.</span></button>`;
            }

            let canAttackCoreUI = false;
            if(turnCount > 1 && data.type === 'unit' && data.name !== "Lionel Guard Tower") {
                let validEnemies = getValidEnemyTargetIds('ENEMY');
                if(validEnemies.length === 0 || (isTutorialMode && tutorialStep === 17)) canAttackCoreUI = true;
            }

            if(canAttackCoreUI) {
                actionHtml += `<button class="skill-btn tut-btn-target" style="border-color:#e74c3c" ${canAct ? '' : 'disabled'} onclick="queueAction('${id}', 'ATTACK CORE', 0, true)"><span class="skill-name" style="color:#e74c3c">[ATTACK CORE]</span><span class="skill-desc">Strike enemy core.</span></button>`;
            }

            if(data.name !== "Lionel Guard Tower" && !data.isBuff && data.skills) {
                data.skills.forEach(skill => {
                    let costMet = pMana >= skill.manaCost;
                    let meetsCondition = true;
                    if(skill.requiresBlessings) meetsCondition = (data.blessings >= skill.requiresBlessings);
                    if(skill.name === "Trigger Unbound" && (!data.chamberedRounds || data.chamberedRounds === 0)) meetsCondition = false;
                    
                    let skillCanAct = canAct;
                    if (isTutorialMode && data.name === "Mana Core" && tutorialStep === 5) skillCanAct = true; 

                    actionHtml += `<button class="skill-btn tut-btn-target" ${skillCanAct && costMet && meetsCondition ? '' : 'disabled'} onclick="queueAction('${id}', '${skill.name.replace(/'/g, "\\'")}', ${skill.manaCost}, false)">
                        <span class="skill-name">[${skill.name}]</span><span class="skill-cost">${skill.manaCost} MP</span><span class="skill-desc">${skill.desc}</span>
                    </button>`;
                });
            }
        }
    } else if (data.skills) {
        data.skills.forEach(skill => { actionHtml += `<div style="margin-top:5px;"><span class="skill-name">[${skill.name}]</span> <span class="skill-cost">${skill.manaCost} MP</span></div>`; });
    }
    
    if(data.passives) data.passives.forEach(p => { actionHtml += `<div style="margin-top:5px;"><span style="color:#e67e22; font-weight:bold; font-size:0.75rem;">[${p.name}]</span><span class="skill-desc">${p.desc}</span></div>`; });
    skillsUI.innerHTML = actionHtml || `<div class="empty-inspector">No actions available.</div>`;

    sumUI.innerText = `${data.summonCost} MANA`;
    
    if (data.summonRequires && data.summonRequires.type === 'arashiSouls') {
        reqUI.style.display = 'block';
        let currentSouls = data.side === 'PLAYER' ? pArashiSouls : eArashiSouls;
        let met = currentSouls >= data.summonRequires.amount;
        reqUI.style.color = met ? '#2ecc71' : '#e74c3c';
        reqUI.innerText = `REQUIRES ${data.summonRequires.amount} ARASHI SOULS (HAVE: ${currentSouls})`;
    } else {
        reqUI.style.display = 'none';
    }
    
    if (tutorialLock) {
        setTimeout(() => {
            document.querySelectorAll('.tut-btn-target').forEach(btn => btn.classList.add('tut-disabled'));
            
            let unlockBtn = null;
            let btns = Array.from(document.querySelectorAll('.tut-btn-target'));
            
            if(tutorialStep === 5 && data.name === "Mana Core") unlockBtn = btns.find(b => b.innerText.includes("Mana Initiation"));
            if(tutorialStep === 6 && data.name === "Leonian Squire") unlockBtn = btns.find(b => b.innerText.includes("SHORTSWORD STRIKE"));
            if(tutorialStep === 14 && data.name === "Leonian Bannerman") unlockBtn = btns.find(b => b.innerText.includes("RALLY"));
            if(tutorialStep === 15 && data.name === "Great Knight") unlockBtn = btns.find(b => b.innerText.includes("HEAVY STRIKE"));
            
            if (unlockBtn) {
                unlockBtn.classList.remove('tut-disabled');
                unlockBtn.removeAttribute('disabled'); 
                unlockBtn.classList.add('tut-highlight-glow'); 
            }

            if(tutorialStep === 17 && data.name === "Archer") {
                btns.forEach(btn => {
                    if (btn.innerText.includes("ATTACK CORE")) {
                        btn.classList.remove('tut-disabled');
                        btn.removeAttribute('disabled');
                        btn.classList.add('tut-highlight-glow');
                    }
                });
            }
        }, 50);
    }
}

// --- UTILS & LISTENERS ---
document.getElementById('scroll-left').addEventListener('click', () => { document.getElementById('hand').scrollBy({ left: -120, behavior: 'smooth' }); if(typeof playClickSound === 'function') playClickSound(); });
document.getElementById('scroll-right').addEventListener('click', () => { document.getElementById('hand').scrollBy({ left: 120, behavior: 'smooth' }); if(typeof playClickSound === 'function') playClickSound(); });

document.getElementById('draw-cards-btn').addEventListener('click', () => {
    if (isExecuting) return;
    document.getElementById('draw-cards-btn').style.display = "none";
    if (turnCount === 1) {
        drawAnimated(5, 'PLAYER'); setTimeout(() => drawAnimated(5, 'ENEMY'), 1500); 
    } else {
        let currentHandCount = document.getElementById('hand').children.length;
        let toDraw = 6 - currentHandCount;
        if(toDraw > 0) drawAnimated(toDraw, 'PLAYER');
        else addLog("Your hand is full.", "var(--gold)");
    }
});

function drawAnimated(n, sideTarget) {
    const stack = document.getElementById(sideTarget === 'PLAYER' ? 'player-deck-stack' : 'enemy-deck-stack');
    let targetDeck = sideTarget === 'PLAYER' ? pDeck : eDeck;
    let counterUI = document.getElementById(sideTarget === 'PLAYER' ? 'p-deck-count' : 'e-deck-count');
    
    for(let i=0; i<n; i++) {
        if (targetDeck.length === 0) break; 
        setTimeout(() => {
            if (targetDeck.length === 0) return;
            const dataTemplate = targetDeck.pop();
            counterUI.innerText = targetDeck.length;

            const data = JSON.parse(JSON.stringify(dataTemplate));
            const cardId = 'card_' + Math.random().toString(36).substr(2, 9);
            cardInstances[cardId] = { ...data, id: cardId, exhausted: false, queued: false, side: sideTarget, turnPlaced: 0, tauntedBy: null, isRevealed: false };

            const flyingCard = document.createElement('div');
            flyingCard.className = 'flying-card';
            flyingCard.style.backgroundImage = `url("${deckBackImg.replace(/"/g, '&quot;').replace(/'/g, '%27')}")`;
            
            const deckRect = stack.getBoundingClientRect();
            flyingCard.style.left = deckRect.left + 'px'; 
            flyingCard.style.top = deckRect.top + 'px';
            document.body.appendChild(flyingCard);

            setTimeout(() => {
                if(sideTarget === 'PLAYER') {
                    const handRect = document.getElementById('hand').getBoundingClientRect();
                    flyingCard.style.left = (handRect.left + handRect.width / 2 - 42) + 'px';
                    flyingCard.style.top = handRect.top + 'px';
                    flyingCard.style.transform = "rotateY(180deg) scale(0.9)";
                } else {
                    flyingCard.style.left = (window.innerWidth / 2) + 'px'; 
                    flyingCard.style.top = '-150px';
                }

                setTimeout(() => {
                    flyingCard.remove();
                    if(sideTarget === 'PLAYER') {
                        if(drawSfxUrl) playSound(drawSfxUrl);
                        const realCard = createCardDOM(cardId, data);
                        realCard.classList.add('flip-reveal');
                        document.getElementById('hand').appendChild(realCard);
                        document.getElementById('hand').scrollBy({ left: 100, behavior: 'smooth' });
                        setTimeout(() => { if (realCard) realCard.classList.remove('flip-reveal'); }, 650);
                    } else { 
                        eHandData.push(cardId); 
                    }
                    updateUI();
                }, 500); 
            }, 50); 
        }, i * 250); 
    }
}

async function animateManaGain(amount) {
    const startEl = document.getElementById('player-deck-stack');
    const endEl = document.getElementById('mana-display-num');
    
    if(!startEl || !endEl || !document.documentElement.style.getPropertyValue('--managain-url')) return;
    
    const sRect = startEl.getBoundingClientRect();
    const eRect = endEl.getBoundingClientRect();
    let particles = Math.min(amount, 5);
    
    for(let i=0; i<particles; i++) {
        let p = document.createElement('div');
        p.className = 'mana-particle';
        p.style.left = (sRect.left + sRect.width/2 - 20) + 'px';
        p.style.top = (sRect.top + sRect.height/2 - 20) + 'px';
        document.body.appendChild(p);
        void p.offsetWidth;
        p.style.left = (eRect.left + eRect.width/2 - 20) + 'px';
        p.style.top = (eRect.top + eRect.height/2 - 20) + 'px';
        setTimeout(() => p.remove(), 800);
        await new Promise(r => setTimeout(r, 150));
    }
    if(particles > 0) await new Promise(r => setTimeout(r, 650));
}

function getValidEnemyTargetIds(defendSide) {
    let attackSide = defendSide === 'PLAYER' ? 'ENEMY' : 'PLAYER';
    let front = Array.from(document.querySelectorAll(`.slot.frontline[data-side="${defendSide}"] .card`)).map(c => c.id).filter(id => !(cardInstances[id].ambushTurns > 0 && cardInstances[id].ambushTurns >= turnCount));
    let back = Array.from(document.querySelectorAll(`.slot.backline[data-side="${defendSide}"] .card`)).map(c => c.id).filter(id => !(cardInstances[id].ambushTurns > 0 && cardInstances[id].ambushTurns >= turnCount));
    
    let hasCrow = Array.from(document.querySelectorAll(`.slot[data-side="${attackSide}"] .card`)).some(c => cardInstances[c.id] && cardInstances[c.id].name === "Cursed Crow" && cardInstances[c.id].hp > 0);

    if (hasCrow) return front.concat(back); 
    if (front.length > 0) return front;
    if (back.length > 0) return back;
    return [];
}

function syncVisualHP(targetDOM, currentHP, maxHP) {
    if(!targetDOM) return;
    let pct = Math.max(0, Math.min(100, (currentHP / maxHP) * 100));
    
    let hTrail = targetDOM.querySelector('.horizontal-bar .hp-bar-trail') || targetDOM.querySelector('.inspect-hp-trail') || targetDOM.querySelector('.card-hp-trail');
    let hCurr = targetDOM.querySelector('.horizontal-bar .hp-bar-current') || targetDOM.querySelector('.inspect-hp-current') || targetDOM.querySelector('.card-hp-current');
    if (hTrail) hTrail.style.width = pct + '%';
    if (hCurr) hCurr.style.width = pct + '%';

    let numCard = targetDOM.querySelector('.card-hp-number');
    if (numCard) { 
        numCard.innerText = Math.ceil(currentHP); 
        numCard.style.background = pct < 30 ? '#e74c3c' : '#2ecc71'; 
        numCard.style.color = pct < 30 ? '#fff' : '#000'; 
    }
    
    let numInspect = document.querySelector('#card-inspector .inspect-hp-number');
    if (numInspect && targetDOM.classList.contains('card') && targetDOM.id === document.getElementById('card-inspector').dataset.inspectedId) {
        numInspect.innerText = Math.ceil(currentHP); 
        numInspect.style.background = pct < 30 ? '#e74c3c' : '#2ecc71'; 
        numInspect.style.color = pct < 30 ? '#fff' : '#000';
    }
}

// ============================================================================
// ⚔️ ENGINE.JS - PART 2: COMBAT, QUEUE, & AI
// ============================================================================

// --- ⚙️ SYSTEM DETECTOR & TARGETING ---
async function systemDetector(trigger, payload) {
    if (trigger === "QUEUE") {
        if (payload.action.actorName === "Shadow Stalker") {
            let activeCardsOnBoard = Object.values(cardInstances).filter(c => {
                let el = document.getElementById(c.id);
                return el && el.parentElement && el.parentElement.classList.contains('slot');
            });
            let allies = activeCardsOnBoard.filter(c => c.side === payload.action.side && c.name === "Shadow Stalker" && c.id !== payload.action.actorId);
            for (let ally of allies) {
                if (!ally.exhausted && !ally.queued && ally.turnPlaced < turnCount) {
                    ally.queued = true;
                    let mimicAction = { actorId: ally.id, actorName: ally.name, side: ally.side, skillName: payload.action.skillName, cost: 0, targetId: payload.action.targetId };
                    if (ally.side === 'PLAYER') pQueue.push(mimicAction);
                    else eQueue.push(mimicAction);
                    addLog(`<b>System:</b> Ally ${ally.name} mimics the queued skill!`, "#e67e22");
                }
            }
        }
    }

    if (trigger === "DAMAGE_CALC") {
        let dmg = payload.baseDmg;
        
        // Atk Buff check
        if (payload.actor.atkBuffTurns && payload.actor.atkBuffTurns >= turnCount) dmg = Math.floor(dmg * 1.08);
        
        // Shinobi Mark + Arashi Faction Bonus
        if (payload.targetInst && payload.targetInst.marks && payload.targetInst.marks > 0 && payload.actor.faction === "Arashi") {
            let actualMarks = Math.min(3, payload.targetInst.marks);
            let multiplier = 1 + (actualMarks * 0.06);
            dmg = Math.floor(dmg * multiplier);
        }
        
        // Great Knight Reduction
        if (payload.targetInst && payload.targetInst.name === "Great Knight" && payload.skillName !== "Bite" && payload.skillName !== "Peck" && payload.skillName !== "SAN") {
            dmg = Math.max(1, dmg - 40);
        }
        
        // Ambush Damage Buffs
        if (payload.actor.ambushTurns && payload.actor.ambushTurns >= turnCount) {
            if (payload.skillName === "Bullseye") dmg = Math.floor(Math.random() * (1000 - 600 + 1)) + 600;
            if (payload.skillName === "Arrow Rain") dmg = Math.floor(Math.random() * (180 - 90 + 1)) + 90;
        }

        return dmg;
    }

    if (trigger === "ATTACK_END") {
        let defSide = payload.actor.side === 'PLAYER' ? 'ENEMY' : 'PLAYER';
        let atkSide = payload.actor.side;
        let activeCardsOnBoard = Object.values(cardInstances).filter(c => {
            let el = document.getElementById(c.id);
            return el && el.parentElement && el.parentElement.classList.contains('slot');
        });
        
        if (payload.actor.tauntedBy) {
            let taunter = cardInstances[payload.actor.tauntedBy];
            let tDOM = document.getElementById(payload.actor.tauntedBy);
            if (taunter && taunter.hp > 0 && tDOM && tDOM.parentElement.classList.contains('slot') && taunter.name === "Rolyn") {
                let counterDmg = Math.floor(Math.random() * 201) + 300;
                addLog(`<b>System</b> [Dauntless]: Rolyn counter-attacks taunted unit for ${counterDmg} DMG!`, "var(--gold)");
                if (rolynSfx1Url) playSound(rolynSfx1Url);
                await applyDamage(taunter, payload.actor.id, counterDmg, "Dauntless");
                
                let healAmt = Math.floor(counterDmg / 2);
                taunter.hp = Math.min(taunter.maxHp, taunter.hp + healAmt);
                syncVisualHP(tDOM, taunter.hp, taunter.maxHp);
                showFloatingText(tDOM, `+${healAmt}`, "#2ecc71", "1.5rem");
                addLog(`<b>Rolyn</b> heals for ${healAmt} HP from Dauntless!`, "#2ecc71");
            }
        }

        let guardTowers = activeCardsOnBoard.filter(c => c.side === defSide && c.name === "Lionel Guard Tower");
        for (let tower of guardTowers) {
            addLog(`<b>System</b> [Guard Tower]: Retaliates for 200 DMG!`, "var(--gold)");
            await shootProjectile(document.getElementById(tower.id), document.getElementById(payload.actor.id), true);
            await applyDamage(tower, payload.actor.id, 200, "Passive");
        }

        let atkTowers = activeCardsOnBoard.filter(c => c.side === atkSide && c.name === "Lionel Guard Tower" && c.id !== payload.actor.id);
        for (let tower of atkTowers) {
            if (payload.action.targetId !== 'SELF') {
                addLog(`<b>System</b> [Attack Tower]: Assist volley for 100 DMG!`, "var(--gold)");
                let tId = Array.isArray(payload.action.targetId) ? payload.action.targetId[0] : payload.action.targetId;
                let targetDOM = tId === 'CORE' ? document.getElementById(defSide === 'ENEMY' ? 'e-core-target' : 'p-core-target') : document.getElementById(tId);
                await shootProjectile(document.getElementById(tower.id), targetDOM, true);
                await applyDamage(tower, tId, 100, "Passive");
            }
        }

        if (payload.actor.name === "KIN-RYU" && payload.targetInst && payload.action.skillName !== "SAN" && !payload.targetDied) {
             payload.targetInst.marks = Math.min(3, (payload.targetInst.marks || 0) + 2);
             let tDOM = document.getElementById(payload.action.targetId);
             setTimeout(() => showFloatingText(tDOM, "Shinobi Mark", "#e74c3c", "1rem"), 400);
             showInspector(payload.action.targetId, tDOM); 
        }

        if (payload.targetDied && payload.actor.faction === "Arashi") {
            if (payload.actor.side === 'PLAYER') {
                pArashiSouls++;
                addLog(`<b>System</b>: Arashi unit eliminated a target! (+1 Arashi Soul)`, "var(--hp-color)");
                updateUI();
            } else { eArashiSouls++; }
        }
    }
}

window.queueAction = function(actorId, skillName, cost, isCore) {
    if(currentTurn !== 'PLAYER' || isExecuting) return;
    const actor = cardInstances[actorId];
    
    if(actor.turnPlaced === turnCount && !(isTutorialMode && actor.name === "Mana Core" && tutorialStep === 5)) return addLog("Card has Summoning Sickness!", "red");
    if(turnCount === 1 && !isTutorialMode) return addLog("No combat allowed on Turn 1!", "red");
    if(actor.exhausted || actor.queued) return addLog("Card has already acted this turn!", "red");
    if(actor.tauntedBy) return addLog("Taunted unit cannot be selected. It will auto-attack upon execution.", "red");
    
    if(pMana < cost && (!isTutorialMode || skillName !== "Mana Initiation")) return addLog("Not enough Mana!", "red");
    if (!isTutorialMode || pMana >= cost) pMana -= cost;
    
    actor.queued = true;

    if(isCore) {
        let action = { actorId, actorName: actor.name, side: actor.side, skillName, cost, targetId: 'CORE' };
        pQueue.push(action); addLog(`Queued [${skillName}] on Enemy Core.`, "#aaa"); 
        if (isTutorialMode && tutorialStep === 17) { tutorialStep = 18; progressTutorial(); }
        systemDetector("QUEUE", { action });
    }
    else if (skillName === "Blessing of the Light") {
        isTargeting = true; pendingSkill = { actorId, actorName: actor.name, side: actor.side, skillName, cost };
        targetCountReq = 1; addLog("Select an Allied target to heal...", "#2ecc71");
        document.querySelectorAll(`.slot[data-side="${actor.side}"] .card`).forEach(c => {
            if(cardInstances[c.id].type === 'unit') c.classList.add('target-heal-glow');
        });
    } 
    else if (skillName === "Double Action") {
        isTargeting = true; pendingSkill = { actorId, actorName: actor.name, side: actor.side, skillName, cost };
        targetCountReq = 1; addLog("Select an Allied unit for One More Time...", "#9b59b6");
        document.querySelectorAll(`.slot[data-side="${actor.side}"] .card`).forEach(c => {
            let tInst = cardInstances[c.id];
            if(tInst && tInst.type === 'unit' && !tInst.exhausted && tInst.turnPlaced < turnCount) c.classList.add('target-buff-glow');
        });
    } 
    else if (skillName === "Punishment of the Blessed") {
        if(actor.blessings < 7) { pMana += cost; actor.queued = false; return addLog("Needs 7 Blessings!", "red"); }
        isTargeting = true; pendingSkill = { actorId, actorName: actor.name, side: actor.side, skillName, cost };
        targetCountReq = 1; addLog("Select an Enemy Frontline target...", "var(--gold)");
        document.querySelectorAll('.slot.frontline[data-side="ENEMY"] .card').forEach(c => {
            if (!(cardInstances[c.id].ambushTurns > 0 && cardInstances[c.id].ambushTurns >= turnCount)) c.classList.add('target-glow');
        });
    } 
    else if (skillName === "Sniping Shot") {
        isTargeting = true; pendingSkill = { actorId, actorName: actor.name, side: actor.side, skillName, cost };
        targetCountReq = 1; let defSide = actor.side === 'PLAYER' ? 'ENEMY' : 'PLAYER';
        addLog("Select ANY Enemy target...", "var(--gold)");
        document.querySelectorAll(`.slot[data-side="${defSide}"] .card`).forEach(c => {
            if (!(cardInstances[c.id].ambushTurns > 0 && cardInstances[c.id].ambushTurns >= turnCount)) c.classList.add('target-glow');
        });
    }
    else if (skillName === "Arrow Rain") {
        isTargeting = true; pendingSkill = { actorId, actorName: actor.name, side: actor.side, skillName, cost };
        targetCountReq = "GROUP"; let defSide = actor.side === 'PLAYER' ? 'ENEMY' : 'PLAYER';
        addLog("Select any enemy in the Frontline or Backline to hit that entire group...", "var(--gold)");
        document.querySelectorAll(`.slot[data-side="${defSide}"] .card`).forEach(c => {
            if (!(cardInstances[c.id].ambushTurns > 0 && cardInstances[c.id].ambushTurns >= turnCount)) c.classList.add('target-glow');
        });
    }
    else if (skillName === "Lion's Roar") {
        isTargeting = true; pendingSkill = { actorId, actorName: actor.name, side: actor.side, skillName, cost };
        let defSide = actor.side === 'PLAYER' ? 'ENEMY' : 'PLAYER';
        let validIds = getValidEnemyTargetIds(defSide);
        targetCountReq = Math.min(3, validIds.length); selectedTargets = []; 
        addLog(`Select up to ${targetCountReq} Enemy targets for Lion's Roar...`, "var(--gold)");
        validIds.forEach(tId => document.getElementById(tId).classList.add('target-glow'));
        
        if (validIds.length === 0) { addLog("No enemies to target.", "#e74c3c"); isTargeting = false; actor.queued = false; pMana += cost; pendingSkill = null; }
    }
    else if (skillName === "Shield of Hope") {
        let action = { actorId, actorName: actor.name, side: actor.side, skillName, cost, targetId: 'ALLIES_FRONT' };
        pQueue.push(action); addLog(`Queued [${skillName}] on Frontline.`, "#3498db"); systemDetector("QUEUE", { action });
    }
    else if (skillName === "RALLY" || skillName === "VALIANT GUARD" || skillName === "Mana Initiation" || skillName === "BLOCK" || actor.type === 'ability' || skillName === "Trigger Unbound") {
        let action = { actorId, actorName: actor.name, side: actor.side, skillName, cost, targetId: 'SELF' };
        pQueue.push(action); addLog(`Queued [${skillName}].`, "#aaa"); 
        
        if (isTutorialMode && tutorialStep === 5 && skillName === "Mana Initiation") { tutorialStep = 6; progressTutorial(); }
        if (isTutorialMode && tutorialStep === 14 && skillName === "RALLY") { tutorialStep = 15; progressTutorial(); }
        systemDetector("QUEUE", { action });
    } 
    else {
        isTargeting = true; pendingSkill = { actorId, actorName: actor.name, side: actor.side, skillName, cost };
        let defSide = actor.side === 'PLAYER' ? 'ENEMY' : 'PLAYER';
        let validIds = getValidEnemyTargetIds(defSide);
        
        if (skillName === "NI") {
            let availableTargets = validIds.length;
            targetCountReq = Math.min(2, availableTargets); selectedTargets = []; 
            addLog(`Select Target 1 for NI...`, "var(--gold)");
        } else {
            targetCountReq = 1; addLog("Select an Enemy target...", "var(--gold)");
        }
        
        validIds.forEach(tId => { let cEl = document.getElementById(tId); if(cEl) cEl.classList.add('target-glow'); });

        if(tutorialLock) {
            validIds.forEach(id => {
                let el = document.getElementById(id);
                if(el) { el.classList.remove('tut-disabled'); el.classList.add('tut-highlight-glow'); }
            });
        }

        if (validIds.length === 0) {
            addLog("All enemies down! Use 'ATTACK CORE' instead.", "#e74c3c");
            isTargeting = false; actor.queued = false; pMana += cost; pendingSkill = null;
        }
    }
    updateUI(); showInspector(actorId, document.getElementById(actorId));
};

function handleTargetSelection(targetId) {
    if (pendingSkill && pendingSkill.skillName === "Double Action") {
        isTargeting = false; 
        document.querySelectorAll('.card').forEach(c => c.classList.remove('target-buff-glow', 'target-glow', 'target-heal-glow', 'target-line-glow'));
        
        let targetInst = cardInstances[targetId]; let targetDOM = document.getElementById(targetId);
        let actorInst = cardInstances[pendingSkill.actorId]; let actorDOM = document.getElementById(pendingSkill.actorId);
        
        if(targetInst) {
            targetInst.extraAction = true; targetInst.exhausted = false; 
            if(targetDOM) targetDOM.classList.add('buff-double-action');
            addLog(`<b>${targetInst.name}</b> is granted One More Time!`, "#9b59b6");
        }
        
        if(actorDOM) { actorDOM.style.transition = "all 0.5s ease"; actorDOM.style.transform = "scale(1.5)"; actorDOM.style.opacity = "0"; setTimeout(() => actorDOM.remove(), 500); }
        if(actorInst) { actorInst.hp = 0; actorInst.queued = false; }
        
        pendingSkill = null; updateUI(); showInspector('none', null); 
        return;
    }

    if (targetCountReq === "GROUP") {
        isTargeting = false;
        document.querySelectorAll('.card').forEach(c => c.classList.remove('target-glow', 'target-line-glow', 'target-heal-glow', 'target-buff-glow'));
        
        let targetDOM = document.getElementById(targetId);
        let groupRow = targetDOM.closest('.row');
        let targets = Array.from(groupRow.querySelectorAll('.card')).map(c => c.id).filter(id => !(cardInstances[id].ambushTurns > 0 && cardInstances[id].ambushTurns >= turnCount));
        
        let action = { ...pendingSkill, targetId: targets };
        pQueue.push(action);
        addLog(`Queued [${pendingSkill.skillName}] on ${targets.length} grouped targets.`, "#aaa");
        systemDetector("QUEUE", { action }); pendingSkill = null; updateUI(); return;
    }

    if (targetCountReq > 1) {
        if (selectedTargets.includes(targetId)) return; 
        selectedTargets.push(targetId);
        document.getElementById(targetId).classList.remove('target-glow', 'target-line-glow', 'target-heal-glow', 'target-buff-glow'); 
        
        if (selectedTargets.length < targetCountReq) { addLog(`Select Target ${selectedTargets.length + 1}...`, "var(--gold)"); return; }
        
        isTargeting = false; 
        document.querySelectorAll('.card').forEach(c => c.classList.remove('target-glow', 'target-line-glow', 'target-heal-glow', 'target-buff-glow'));
        
        let action = { ...pendingSkill, targetId: selectedTargets }; 
        pQueue.push(action); addLog(`Queued [${pendingSkill.skillName}] on ${selectedTargets.length} targets.`, "#aaa");
        systemDetector("QUEUE", { action }); pendingSkill = null; selectedTargets = []; updateUI();
    } else {
        isTargeting = false; 
        document.querySelectorAll('.card').forEach(c => c.classList.remove('target-glow', 'target-line-glow', 'target-heal-glow', 'target-buff-glow'));
        
        let action = { ...pendingSkill, targetId }; 
        pQueue.push(action); addLog(`Queued [${pendingSkill.skillName}] on ${cardInstances[targetId].name}.`, "#aaa");
        
        if(isTutorialMode && tutorialStep === 6 && pendingSkill.skillName === "SHORTSWORD STRIKE") { tutorialStep = 7; progressTutorial(); }
        if(isTutorialMode && tutorialStep === 15) {
            let pQActors = pQueue.map(a => cardInstances[a.actorId].name);
            if(pQActors.includes("Great Knight")) { tutorialStep = 16; progressTutorial(); }
        }

        systemDetector("QUEUE", { action }); pendingSkill = null; updateUI();
    }
}

// --- ⚔️ EXECUTION & VISUAL FX ---
function showFloatingText(targetDOM, text, color="#ff4d4d", fontSize="2rem") {
    if(!targetDOM) return;
    const rect = targetDOM.getBoundingClientRect(); const el = document.createElement('div'); el.className = 'floating-text';
    el.style.color = color; el.style.fontSize = fontSize; el.innerText = text;
    let xOffset = text.length > 5 ? text.length * 4 : 10;
    el.style.left = (rect.left + rect.width / 2 - xOffset) + 'px'; el.style.top = (rect.top + rect.height / 2 - 20) + 'px';
    document.body.appendChild(el); setTimeout(() => el.remove(), 1200);
}

function triggerSlash(targetDOM, muteBodyShot = false) {
    if(!targetDOM) return; if(!muteBodyShot && bodyShotAudioUrl) playSound(bodyShotAudioUrl);
    const slash = document.createElement('div'); slash.className = 'slash-fx'; targetDOM.appendChild(slash); setTimeout(() => slash.remove(), 600);
}

function shootProjectile(actorDOM, targetDOM, isArrow = true) {
    if (!actorDOM || !targetDOM) return;
    const aRect = actorDOM.getBoundingClientRect(); const tRect = targetDOM.getBoundingClientRect();
    const startX = aRect.left + aRect.width / 2; const startY = aRect.top + aRect.height / 2;
    const endX = tRect.left + tRect.width / 2; const endY = tRect.top + tRect.height / 2;

    const projectile = document.createElement('div');
    projectile.className = isArrow ? 'arrow-fx' : 'shuriken-fx';
    projectile.style.left = startX + 'px'; projectile.style.top = startY + 'px';

    const angle = Math.atan2(endY - startY, endX - startX) * (180 / Math.PI);
    projectile.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;

    document.body.appendChild(projectile);

    setTimeout(() => { projectile.style.left = endX + 'px'; projectile.style.top = endY + 'px'; }, 10);
    setTimeout(() => { projectile.remove(); if (isArrow && arrowHitAudioUrl) playSound(arrowHitAudioUrl); }, 300);
}

function showJadenLock(targetDOM) {
    if(!targetDOM || !jadenLockUrl) return null;
    const lock = document.createElement('div');
    lock.style.cssText = `position:absolute; top:50%; left:50%; width:100px; height:100px; transform:translate(-50%, -50%); background-image:url('${jadenLockUrl.replace(/"/g, '&quot;').replace(/'/g, '%27')}'); background-size:contain; background-repeat:no-repeat; background-position:center; pointer-events:none; z-index:9999; animation: pulse-lock 0.5s infinite alternate;`;
    targetDOM.appendChild(lock);
    return lock;
}

async function shootBullet(sourceDOM, targetDOM) {
    if(!sourceDOM || !targetDOM || !jadenBulletUrl) return;
    const sEl = sourceDOM.parentElement.classList.contains('slot') ? sourceDOM.parentElement : sourceDOM;
    const tEl = targetDOM.parentElement.classList.contains('slot') ? targetDOM.parentElement : targetDOM;

    const sRect = sEl.getBoundingClientRect();
    const tRect = tEl.getBoundingClientRect();
    const bullet = document.createElement('div');

    const startX = sRect.left + sRect.width/2;
    const startY = sRect.top + sRect.height/2;
    const endX = tRect.left + tRect.width/2;
    const endY = tRect.top + tRect.height/2;
    const angle = Math.atan2(endY - startY, endX - startX) * 180 / Math.PI;

    bullet.style.cssText = `position:fixed; width:40px; height:20px; background-image:url('${jadenBulletUrl.replace(/"/g, '&quot;').replace(/'/g, '%27')}'); background-size:contain; background-repeat:no-repeat; z-index:9999; pointer-events:none; left:${startX}px; top:${startY}px; transform:translate(-50%, -50%) rotate(${angle}deg); transition:all 0.15s linear;`;
    document.body.appendChild(bullet);

    void bullet.offsetWidth;
    bullet.style.left = endX + 'px';
    bullet.style.top = endY + 'px';

    await new Promise(r => setTimeout(r, 150));
    bullet.remove();
}

async function triggerLuxBeam(actorDOM, targetDOM) {
    if(!actorDOM || !targetDOM) return;

    const tRect = targetDOM.getBoundingClientRect();
    const beamX = tRect.left + (tRect.width / 2);

    const beamContainer = document.createElement('div');
    beamContainer.className = 'lux-beam-container';
    beamContainer.style.left = (beamX - 60) + 'px';

    const core = document.createElement('div');
    core.className = 'lux-beam-core';
    const outer = document.createElement('div');
    outer.className = 'lux-beam-outer';

    beamContainer.appendChild(outer);
    beamContainer.appendChild(core);
    document.body.appendChild(beamContainer);

    beamContainer.style.transition = "opacity 0.2s ease, transform 0.2s ease";
    beamContainer.style.opacity = "0.5";
    beamContainer.style.transform = "scaleX(0.1)";
    await new Promise(r => setTimeout(r, 200));

    if (abilityActivatedUrl) playSound(abilityActivatedUrl);
    document.body.classList.add('shake-anim');
    beamContainer.style.transition = "opacity 0.1s ease, transform 0.1s ease";
    beamContainer.style.opacity = "1";
    beamContainer.style.transform = "scaleX(1)";
    await new Promise(r => setTimeout(r, 400));

    document.body.classList.remove('shake-anim');
    beamContainer.style.transition = "opacity 0.3s ease";
    beamContainer.style.opacity = "0";
    await new Promise(r => setTimeout(r, 300));
    beamContainer.remove();
}

async function triggerSanChain(actor, defSide) {
    let activeCardsOnBoard = Object.values(cardInstances).filter(c => {
        let el = document.getElementById(c.id);
        return el && el.parentElement && el.parentElement.classList.contains('slot');
    });
    let enemies = activeCardsOnBoard.filter(c => c.side === defSide && c.hp > 0 && !(c.ambushTurns > 0 && c.ambushTurns >= turnCount));
    if (enemies.length === 0) return;

    let sanTxt = document.createElement('div');
    sanTxt.className = 'san-text';
    sanTxt.innerText = "三 San 三";
    document.body.appendChild(sanTxt);
    await new Promise(r => setTimeout(r, 1000));
    sanTxt.remove();

    let nextTarget = enemies[Math.floor(Math.random() * enemies.length)];
    let nDOM = document.getElementById(nextTarget.id);
    let aDOM = document.getElementById(actor.id);

    if (kinSanAudioUrl) playSound(kinSanAudioUrl);
    const hitDelay = 150;

    let dmg1 = Math.floor(Math.random() * 201) + 300;
    let dmg2 = Math.floor(Math.random() * 201) + 300;
    let dmg3 = Math.floor(Math.random() * 201) + 300;
    let sanDmgs = [dmg1, dmg2, dmg3];
    let totalSanDmg = dmg1 + dmg2 + dmg3;

    if (shurikenImgUrl !== '') {
        for(let i=0; i<3; i++) {
            setTimeout(() => {
                shootProjectile(aDOM, nDOM, false);
                setTimeout(() => {
                    if (bloodAudioUrl) playSound(bloodAudioUrl);
                    if (nDOM) {
                        nDOM.classList.remove("shake-anim");
                        void nDOM.offsetWidth;
                        nDOM.classList.add("shake-anim");
                        showFloatingText(nDOM, `-${sanDmgs[i]}`, "#ff4d4d", "2.5rem");
                    }
                }, hitDelay);
            }, i * 200);
        }
        await new Promise(r => setTimeout(r, 400 + hitDelay));
    } else {
        await new Promise(r => setTimeout(r, 600));
    }

    let targetDied = await applyDamage(actor, nextTarget.id, totalSanDmg, "SAN");
    if (targetDied) {
        addLog(`<b>System</b> [SAN]: Chain reaction continues!`, "var(--gold)");
        await triggerSanChain(actor, defSide);
    }
}

async function applyDamage(actor, targetId, baseDmg, skillName) {
    let targetDOM = targetId === 'CORE' ? document.getElementById(actor.side === 'PLAYER' ? 'e-core-target' : 'p-core-target') : document.getElementById(targetId);
    let targetInst = cardInstances[targetId]; let actorDOM = document.getElementById(actor.id);
    let actorSlotDOM = (actorDOM && actorDOM.parentElement && actorDOM.parentElement.classList.contains('slot')) ? actorDOM.parentElement : null;
    
    let isSlash = ["SHORTSWORD STRIKE", "HEAVY STRIKE", "BANNER STRIKE", "ATTACK", "ICHI", "NI", "BLADE STRIKE", "SLASH", "Lion's Challenge", "Bite", "Peck"].includes(skillName);
    let isRanged = ["VOLLEY", "Bullseye", "Arrow Rain", "Sniping Shot", "Double-Shot", "SHADOW STAR", "Trigger Unbound", "Punishment of the Blessed", "Force of Nature", "Mana Beam"].includes(skillName) || (skillName === "ATTACK CORE" && ["Archer", "Zeek", "Shadow Stalker", "Jaden", "Althea", "Cursed Crow", "Wisp"].includes(actor.name)); 

    let targetHadMarkBeforeHit = (targetInst && targetInst.marks > 0);

    // --- SQUIRE 40% DODGE LOGIC ---
    if (!isTutorialMode && targetInst && targetInst.name === "Leonian Squire" && skillName !== "Passive" && skillName !== "SAN" && skillName !== "Lion's Roar" && skillName !== "BLOCK") {
        if (Math.random() < 0.40) { // 40% Dodge Chance
            if (targetDOM) {
                showFloatingText(targetDOM, "DODGE!", "#f1c40f", "2rem");
                // Quick dodge animation
                targetDOM.style.transition = "transform 0.1s ease";
                targetDOM.style.transform = "translateX(20px)";
                setTimeout(() => targetDOM.style.transform = "translateX(0)", 150);
            }
            addLog(`<b>${actor.name}</b> missed! The Leonian Squire dodged the attack!`, "#f1c40f");
            
            // Clean up the attacking animation and abort the damage!
            if(actorDOM && skillName !== "RALLY" && skillName !== "BLOCK" && skillName !== "SAN" && actor.name !== "Jaden" && skillName !== "Lion's Roar") {
                setTimeout(() => { actorDOM.style.transition = "transform 0.3s ease-out"; actorDOM.style.transform = "scale(1) translate(0, 0)"; actorDOM.style.zIndex = ""; }, 300);
            }
            if(actorSlotDOM) actorSlotDOM.classList.remove('attacking-slot');
            
            return false; // Returns 'false' meaning the target did not die, entirely skipping the damage math
        }
    }
    // ------------------------------

    let dmg = await systemDetector("DAMAGE_CALC", { actor, targetInst, skillName, baseDmg });

    if(actorDOM && skillName !== "Passive" && skillName !== "RALLY" && skillName !== "BLOCK" && skillName !== "SAN" && !skillName.includes("Punishment") && actor.name !== "Jaden" && actor.name !== "Zeek" && skillName !== "Lion's Roar" && skillName !== "Dauntless" && skillName !== "Mana Beam" && skillName !== "Force of Nature") {
        if (!isRanged) {
            if(actorSlotDOM) actorSlotDOM.classList.add('attacking-slot');
            actorDOM.style.zIndex = "9999"; 
            const aRect = actorDOM.getBoundingClientRect(); const tRect = targetDOM.getBoundingClientRect();
            const dX = (tRect.left + tRect.width/2) - (aRect.left + aRect.width/2); const dY = (tRect.top + tRect.height/2) - (aRect.top + aRect.height/2);
            actorDOM.style.transition = "transform 0.15s cubic-bezier(0.4, 0, 1, 1)"; 
            actorDOM.style.transform = `translate(${dX * 0.5}px, ${dY * 0.5}px) scale(1.3)`;
            await new Promise(r => setTimeout(r, 150));
        } else {
            if(actorSlotDOM) actorSlotDOM.classList.add('attacking-slot');
            actorDOM.style.zIndex = "9999"; 
            actorDOM.style.transition = "transform 0.1s ease-out";
            actorDOM.style.transform = `scale(1.1)`;
            let useArrow = !(["SHADOW STAR", "Trigger Unbound"].includes(skillName));
            shootProjectile(actorDOM, targetDOM, useArrow);
            await new Promise(r => setTimeout(r, 300));
        }
    }

    if(actor.name === "Zeek" && skillName !== "Passive") {
        if(actorDOM) { actorDOM.style.transition = "transform 0.4s ease"; actorDOM.style.transform = "scale(1.2)"; }
        await shootProjectile(actorDOM, targetDOM, true);
    }

    if(targetDOM && skillName !== "RALLY" && skillName !== "BLOCK" && skillName !== "SAN" && skillName !== "Lion's Roar") {
        if(isSlash && dmg > 0) { 
            let muteBS = false;
            if (actor.name === "Rolyn" && (skillName === "Lion's Challenge" || skillName === "Dauntless" || skillName === "ATTACK")) muteBS = true;
            triggerSlash(targetDOM, muteBS); 
        } else if (dmg > 0 && actor.name === "Militia") {
            if (bodyShotAudioUrl) playSound(bodyShotAudioUrl);
        }
        if (dmg > 0) { targetDOM.classList.remove("shake-anim"); void targetDOM.offsetWidth; targetDOM.classList.add("shake-anim"); }
    }
    
    let died = false;
    if(targetId === 'CORE') {
        if (dmg > 0) {
            showFloatingText(targetDOM, `-${dmg}`, "#ff4d4d", "2.5rem");
            if(actor.side === 'PLAYER') { eCoreHP = Math.max(0, eCoreHP - dmg); syncVisualHP(targetDOM, eCoreHP, 2000); if(eCoreHP<=0) died=true; } 
            else { pCoreHP = Math.max(0, pCoreHP - dmg); syncVisualHP(targetDOM, pCoreHP, 2000); if(pCoreHP<=0) died=true; }
        }
    } else if (targetInst) {
        if(targetInst.shield && targetInst.shield > 0 && targetInst.shieldTurns >= turnCount && dmg > 0) {
             if(dmg <= targetInst.shield) {
                  targetInst.shield -= dmg; showFloatingText(targetDOM, `ABSORBED`, "#3498db", "1.5rem"); dmg = 0;
             } else {
                  let absorbed = targetInst.shield; dmg -= targetInst.shield; targetInst.shield = 0;
                  showFloatingText(targetDOM, `-${dmg}`, "#ff4d4d", "2.5rem");
             }
        } else if(skillName !== "SAN" && skillName !== "Lion's Roar" && skillName !== "BLOCK" && dmg > 0) { 
             showFloatingText(targetDOM, `-${dmg}`, "#ff4d4d", "2.5rem"); 
        }

        if(dmg > 0) {
             targetInst.hp -= dmg; syncVisualHP(targetDOM, targetInst.hp, targetInst.maxHp);
             addLog(`<b>${actor.name}</b> hits ${targetInst.name} for ${dmg} DMG!`, '#ff4d4d');

             if(targetInst.name === "Zombie" && targetInst.hp > 0 && targetInst.hp <= 100) {
                 let healAmt = Math.floor(targetInst.maxHp * 0.20);
                 targetInst.hp = Math.min(targetInst.maxHp, targetInst.hp + healAmt);
                 syncVisualHP(targetDOM, targetInst.hp, targetInst.maxHp);
                 targetInst.shield = 100;
                 targetInst.shieldTurns = turnCount + 99;
                 addLog(`<b>Zombie</b>'s Vigor of the Damned triggered! Healed for ${healAmt} HP and gained 100 Shield!`, '#2ecc71');
                 if(targetDOM) { showFloatingText(targetDOM, "VIGOR OF THE DAMNED", "#2ecc71", "1.5rem"); targetDOM.classList.add('shimmer-fx'); setTimeout(() => targetDOM.classList.remove('shimmer-fx'), 1000); }
             }

             if(targetInst.hp <= 0) { 
                 died = true; addLog(`${targetInst.name} was destroyed!`, '#aaa'); 
                 if(targetDOM) targetDOM.remove(); 

                 if(targetInst.hp <= 0) { 
                 died = true; addLog(`${targetInst.name} was destroyed!`, '#aaa'); 
                 if(targetDOM) targetDOM.remove(); 
                 
                 // --- WISP PASSIVE: MANA LIFE ---
                 if (targetInst.passives && targetInst.passives.some(p => p.name === "Mana Life")) {
                     let mGain = Math.floor(Math.random() * 4) + 1;
                     if (targetInst.side === 'PLAYER') pMana += mGain; else eMana += mGain;
                     addLog(`[Mana Life] granted ${mGain} Mana!`, "#3498db");
                     if (typeof updateUI === 'function') updateUI();
                 }
                 
                 if(targetInst.faction === "Arashi" || targetInst.name === "Shadow Stalker") {
                     if(targetInst.side === 'PLAYER') pArashiSouls++; else eArashiSouls++;
                     addLog(`<b>System</b>: Arashi soul collected!`, "#3498db");
                 }
                 if(targetInst.name === "Leonian Squire") {
                     if(targetInst.side === 'PLAYER') { pSquiresFallen++; addLog(`<b>System</b>: Allied Squire fell!`, "#2ecc71"); }
                     else eSquiresFallen++;
                 }
             } 
        }
    }

    if (died && actor.name === "Zeek" && skillName === "Ambush") {
        actor.ambushTurns = turnCount + 2;
        if (actorDOM) actorDOM.classList.add('ambush-stance');
        addLog(`<b>Zeek</b> retreats into the shadows (Ambush Stance)!`, "#3498db");
    }

    await new Promise(r => setTimeout(r, 300)); 
    
    if(actorDOM && skillName !== "RALLY" && skillName !== "BLOCK" && skillName !== "SAN" && actor.name !== "Jaden" && skillName !== "Lion's Roar") {
        actorDOM.style.transition = "transform 0.3s ease-out"; actorDOM.style.transform = "scale(1) translate(0, 0)";
        await new Promise(r => setTimeout(r, 300)); actorDOM.style.zIndex = ""; actorDOM.style.transition = ""; 
    }
    if(actorSlotDOM) actorSlotDOM.classList.remove('attacking-slot');
    
    // Add mark after hit for Kin-Ryu Ichi etc
    let actionPlaceholder = { skillName: skillName, targetId: targetId };
    await systemDetector("ATTACK_END", { actor, targetInst, action: actionPlaceholder, targetDied: died });

    // Kin-Ryu San Chain condition check
    if (actor.name === "KIN-RYU" && died && skillName !== "SAN") { 
        if (targetHadMarkBeforeHit) {
            let defSide = actor.side === 'PLAYER' ? 'ENEMY' : 'PLAYER';
            addLog(`<b>System</b> [SAN]: Marked target destroyed! Kin-Ryu chains attack!`, "var(--gold)"); 
            await triggerSanChain(actor, defSide); 
        }
    }

    return died;
}

async function processQueue(sideProcessing, queueArr) {
    isExecuting = true; document.body.classList.add('in-combat-mode'); 

    if (sideProcessing === 'PLAYER') {
        let activePlayerUnits = Object.values(cardInstances).filter(c => c.side === 'PLAYER' && c.tauntedBy && c.hp > 0 && c.turnPlaced < turnCount && !c.exhausted);
        activePlayerUnits.forEach(u => {
            let taunterDOM = document.getElementById(u.tauntedBy);
            if (taunterDOM && taunterDOM.parentElement.classList.contains('slot')) {
                u.queued = true;
                if (!queueArr.some(a => a.actorId === u.id)) {
                    let forcedSkill = "ATTACK"; let forcedCost = 0;
                    if (u.skills && u.skills.length > 0 && pMana >= u.skills[0].manaCost) { forcedSkill = u.skills[0].name; forcedCost = u.skills[0].manaCost; }
                    queueArr.push({ actorId: u.id, actorName: u.name, side: u.side, skillName: forcedSkill, cost: forcedCost, targetId: u.tauntedBy });
                    addLog(`[TAUNTED] ${u.name} is forced to attack!`, "#e74c3c");
                }
            } else { u.tauntedBy = null; }
        });
    }

    let q = [...queueArr].sort((a, b) => {
        let aPrio = (a.skillName === "Double Action" || a.skillName === "Mana Initiation" || a.skillName === "BLOCK") ? 0 : 1;
        let bPrio = (b.skillName === "Double Action" || b.skillName === "Mana Initiation" || b.skillName === "BLOCK") ? 0 : 1;
        return aPrio - bPrio;
    });

    if(sideProcessing === 'PLAYER') pQueue = []; 
    if(sideProcessing === 'ENEMY') eQueue = []; 
    updateUI();

    for(let i=0; i<q.length; i++) {
        let action = q[i];
        const actor = cardInstances[action.actorId]; const actorDOM = document.getElementById(action.actorId);
        
        if(!actor || actor.hp <= 0) continue;
        
        if (action.targetId !== 'CORE' && action.targetId !== 'SELF' && !Array.isArray(action.targetId) && action.targetId !== 'ALLIES_FRONT') {
            let tInst = cardInstances[action.targetId];
            if (!tInst || tInst.hp <= 0) {
                addLog(`<b>${actor.name}</b>'s target is already dead! Energy saved.`, "#888");
                actor.exhausted = true; updateUI(); await new Promise(r => setTimeout(r, 400));
                continue; 
            }
        }

        actor.queued = false; 

        if (actor.side === 'ENEMY' && actor.type === 'ability' && !actor.isRevealed) {
            actor.isRevealed = true; updateUI(); 
            if(actorDOM) { actorDOM.classList.remove('flip-reveal'); void actorDOM.offsetWidth; actorDOM.classList.add('flip-reveal'); }
            addLog(`Enemy reveals hidden ability: <b>${actor.name}</b>!`, "#9b59b6");
            await new Promise(r => setTimeout(r, 800)); 
        }

        if (!action.isRecast) actor.exhausted = true; 
        updateUI(); 

        if (actor.type === 'ability' || actor.isBuff) {
            if (abilityActivatedUrl && !action.isRecast) playSound(abilityActivatedUrl);
        }

        if (actor.extraAction && action.skillName !== "Double Action" && action.skillName !== "Mana Initiation") {
            actor.extraAction = false;
            if(actorDOM) actorDOM.classList.remove('buff-double-action');
            addLog(`[ONE MORE TIME] <b>${actor.name}</b>'s action will trigger twice!`, "#9b59b6");
            let cloneAction = { ...action, cost: 0, isRecast: true };
            q.splice(i + 1, 0, cloneAction); 
        }

        if (action.skillName === "Mana Initiation") {
            if(actorDOM) { actorDOM.style.transition = "transform 0.3s ease"; actorDOM.style.transform = "scale(1.5)"; actorDOM.style.zIndex = "1000"; await new Promise(r => setTimeout(r, 600)); showFloatingText(actorDOM, "+3", "var(--mana-color)", "2.5rem"); await new Promise(r => setTimeout(r, 400)); actorDOM.style.transform = "scale(1)"; actorDOM.style.zIndex = ""; }
            if(sideProcessing === 'PLAYER') { pMana += 3; addLog(`<b>${actor.name}</b> grants +3 Mana!`, "var(--mana-color)"); } 
            else { eMana += 3; addLog(`Enemy <b>${actor.name}</b> grants +3 Mana!`, "var(--mana-color)"); }
        } 
        else if (action.skillName === "BLOCK") {
            actor.blockActive = true;
            if(actorDOM) { actorDOM.style.transition = "transform 0.3s ease"; actorDOM.style.transform = "scale(1.2)"; await new Promise(r => setTimeout(r, 400)); showFloatingText(actorDOM, "BLOCK STANCE", "#ccc", "1.5rem"); actorDOM.style.transform = "scale(1)"; actorDOM.style.transition = ""; }
            addLog(`<b>${actor.name}</b> enters Block Stance!`, "#ccc");
        }
        else if (action.skillName === "Shield of Hope" || action.skillName === "RALLY") {
            let slots = Array.from(document.querySelectorAll(`.slot.frontline[data-side="${sideProcessing}"]`));
            if (action.skillName === "RALLY") slots = Array.from(document.querySelectorAll(`.slot[data-side="${sideProcessing}"]`));
            let validTargets = slots.map(s => s.querySelector('.card')).filter(c => c && cardInstances[c.id]);
            
            if (validTargets.length > 0) {
                if (!action.isRecast && actor.name === "Althea") {
                    let roll = Math.random(); if (roll < 0.5 && shieldSfxVoiceUrl) playSound(shieldSfxVoiceUrl); else if (roll >= 0.5 && shieldSfxVoice2Url) playSound(shieldSfxVoice2Url);
                    await new Promise(r => setTimeout(r, 100)); 
                }
                if (shieldSfxUrl) playSound(shieldSfxUrl);

                let shieldedCount = 0;
                validTargets.forEach(cEl => {
                      cardInstances[cEl.id].shield = (action.skillName === "RALLY") ? 100 : 500;
                      cardInstances[cEl.id].shieldTurns = turnCount + 1;
                      if (action.skillName === "RALLY") cardInstances[cEl.id].atkBuffTurns = turnCount + 1;
                      showFloatingText(cEl, "SHIELDED", (action.skillName === "RALLY") ? "#f1c40f" : "#3498db", "1.5rem");
                      shieldedCount++;
                });
                if (action.skillName === "Shield of Hope") actor.blessings = (actor.blessings || 0) + shieldedCount;
                addLog(`<b>${actor.name}</b> buffed ${shieldedCount} allies!`, (action.skillName === "RALLY") ? "#f1c40f" : "#3498db");
                await new Promise(r => setTimeout(r, 600)); updateUI();
            }
        }
        else if (action.skillName === "VALIANT GUARD") {
            // --- NEW HEAL LOGIC ---
            let healAmt = 200;
            actor.hp = Math.min(actor.maxHp, actor.hp + healAmt);
            if(actorDOM) syncVisualHP(actorDOM, actor.hp, actor.maxHp);
            if(actorDOM) actorDOM.classList.add('shimmer-fx');
            // ----------------------

            actor.shield = 250; actor.shieldTurns = turnCount + 1;
            let enemySide = sideProcessing === 'PLAYER' ? 'ENEMY' : 'PLAYER';
            let frontlineEnemies = Array.from(document.querySelectorAll(`.slot.frontline[data-side="${enemySide}"] .card`)).map(c => cardInstances[c.id]);
            frontlineEnemies.forEach(eTarget => { if(eTarget && eTarget.hp > 0) eTarget.tauntedBy = actor.id; });
            
            if (shieldSfxUrl) playSound(shieldSfxUrl); 
            if (healAudioUrl) playSound(healAudioUrl); // Plays the heal sound too!
            
            showFloatingText(actorDOM, `+${healAmt} HP / GUARD`, "#3498db", "1.2rem");
            addLog(`<b>${actor.name}</b> healed for ${healAmt}, shielded up, and Taunted the frontline!`, "#3498db");
            
            await new Promise(r => setTimeout(r, 800)); 
            if(actorDOM) actorDOM.classList.remove('shimmer-fx');
            updateUI();
        }
        else if (action.skillName === "Double Action") {
            let tId = Array.isArray(action.targetId) ? action.targetId[0] : action.targetId;
            let targetInst = cardInstances[tId]; let targetDOM = document.getElementById(tId);
            if(actorDOM) { actorDOM.style.transition = "transform 0.5s ease"; actorDOM.style.transform = "scale(2.5)"; actorDOM.style.zIndex = "9999"; await new Promise(r => setTimeout(r, 800)); }
            if(targetInst && targetDOM) { targetInst.extraAction = true; targetInst.exhausted = false; targetDOM.classList.add('buff-double-action'); addLog(`<b>${targetInst.name}</b> is granted One More Time!`, "#9b59b6"); }
            if(actorDOM) { actorDOM.style.opacity = "0"; await new Promise(r => setTimeout(r, 300)); actorDOM.remove(); }
            actor.hp = 0; 
        }
        else if (action.skillName === "Blessing of the Light") {
            let tId = Array.isArray(action.targetId) ? action.targetId[0] : action.targetId;
            let targetInst = cardInstances[tId]; let targetDOM = document.getElementById(tId);
            if(targetInst && targetDOM && targetInst.hp > 0) {
                 if (!action.isRecast && actor.name === "Althea") {
                     let roll = Math.random(); if (roll < 0.5 && healSfxVoiceUrl) playSound(healSfxVoiceUrl); else if (roll >= 0.5 && healSfxVoice2Url) playSound(healSfxVoice2Url);
                     await new Promise(r => setTimeout(r, 100)); 
                 }
                 let heal = Math.floor(Math.random() * 151) + 150;
                 targetInst.hp = Math.min(targetInst.maxHp || targetInst.hp + heal, targetInst.hp + heal);
                 syncVisualHP(targetDOM, targetInst.hp, targetInst.maxHp);
                 showFloatingText(targetDOM, `+${heal}`, "#2ecc71", "2.5rem"); targetDOM.classList.add('shimmer-fx');
                 triggerHeal(targetDOM); if(healAudioUrl) playSound(healAudioUrl);
                 actor.blessings = (actor.blessings || 0) + 1;
                 addLog(`<b>${actor.name}</b> heals ${targetInst.name} for ${heal}!`, "#2ecc71");
                 await new Promise(r => setTimeout(r, 1000)); if(targetDOM) targetDOM.classList.remove('shimmer-fx');
            }
        }
        else if(action.skillName === "Punishment of the Blessed") {
            actor.blessings = Math.max(0, actor.blessings - 7);
            let frontTargetId = Array.isArray(action.targetId) ? action.targetId[0] : action.targetId; let frontDOM = document.getElementById(frontTargetId);
            let targetsToHit = [frontTargetId]; let defSide = actor.side === 'PLAYER' ? 'ENEMY' : 'PLAYER';
            
            if(frontDOM && frontDOM.parentElement.classList.contains('frontline')) {
                 let slots = Array.from(document.querySelectorAll(`.slot.frontline[data-side="${defSide}"]`));
                 let idx = slots.indexOf(frontDOM.parentElement);
                 if(idx > -1) { let backSlot = document.querySelectorAll(`.slot.backline[data-side="${defSide}"]`)[idx]; let backCard = backSlot.querySelector('.card'); if(backCard) targetsToHit.push(backCard.id); }
            }

            if(actorDOM) { actorDOM.style.transition = "transform 0.4s ease"; actorDOM.style.transform = "translateY(-20px) scale(1.1)"; await new Promise(r => setTimeout(r, 400)); }
            if (frontDOM) { if (beamAudioUrl) playSound(beamAudioUrl); await triggerLuxBeam(actorDOM, frontDOM); }

            for(let i=0; i<targetsToHit.length; i++) {
                 let tId = targetsToHit[i]; if (!cardInstances[tId] || cardInstances[tId].hp <= 0) continue;
                 let dmg = i === 0 ? Math.floor(Math.random() * 1001) + 800 : Math.floor(Math.random() * 501) + 500;
                 await applyDamage(actor, tId, dmg, action.skillName);
            }
            if(actorDOM) { actorDOM.style.transform = "scale(1) translateY(0)"; await new Promise(r => setTimeout(r, 300)); actorDOM.style.transition = ""; }
        }
        else if (action.skillName === "Lion's Roar") {
            if (rolynSfx2Url) playSound(rolynSfx2Url);
            if(actorDOM) { actorDOM.style.transition = "transform 0.4s ease"; actorDOM.style.transform = "scale(1.2)"; await new Promise(r => setTimeout(r, 400)); }
            let targetsToTaunt = Array.isArray(action.targetId) ? action.targetId : [action.targetId];
            for (let tId of targetsToTaunt) {
                let targetInst = cardInstances[tId]; let targetDOM = document.getElementById(tId);
                if (targetInst && targetInst.hp > 0 && tId !== 'CORE') {
                    targetInst.tauntedBy = actor.id; targetInst.tauntedTurn = turnCount + (actor.side === 'ENEMY' ? 2 : 1);
                    if (targetDOM) { targetDOM.classList.add('taunted-status'); showFloatingText(targetDOM, "TAUNTED", "#f39c12", "1.5rem"); }
                    addLog(`<b>${actor.name}</b> taunted ${targetInst.name}!`, "#f39c12");
                }
            }
            if(actorDOM) { actorDOM.style.transform = "scale(1)"; await new Promise(r => setTimeout(r, 300)); actorDOM.style.transition = ""; }
        }
        else if (actor.name === "Jaden" && ["Sniping Shot", "Double-Shot", "Trigger Unbound"].includes(action.skillName)) {
            let defSide = actor.side === 'PLAYER' ? 'ENEMY' : 'PLAYER';
            let tId = Array.isArray(action.targetId) ? action.targetId[0] : action.targetId;
            
            if(actorDOM) { actorDOM.style.transition = "transform 0.4s ease"; actorDOM.style.transform = "scale(1.2)"; await new Promise(r => setTimeout(r, 400)); }
            
            if (action.skillName === "Trigger Unbound") {
                let rounds = actor.chamberedRounds || 0;
                if (rounds === 0) {
                    addLog(`<b>Jaden</b> has no Chambered Rounds!`, "red");
                } else {
                    let currentTargetId = tId;
                    for(let i=0; i<rounds; i++) {
                        let cTInst = cardInstances[currentTargetId];
                        if (currentTargetId !== 'CORE' && (!cTInst || cTInst.hp <= 0)) {
                            let valids = getValidEnemyTargetIds(defSide); currentTargetId = valids.length > 0 ? valids[0] : 'CORE';
                        }
                        
                        let tDOM = currentTargetId === 'CORE' ? document.getElementById(actor.side === 'PLAYER' ? 'e-core-target' : 'p-core-target') : document.getElementById(currentTargetId);
                        let lock = showJadenLock(tDOM); shootBullet(actorDOM, tDOM); playSound(jadenSfx1);
                        if(lock) setTimeout(() => lock.remove(), 200);
                        
                        let dmg = Math.floor(Math.random() * (300 - 150 + 1)) + 150;
                        await applyDamage(actor, currentTargetId, dmg, action.skillName);
                        if (i < rounds - 1) await new Promise(r=>setTimeout(r, 25));
                    }
                    actor.chamberedRounds = 0;
                }
            } else {
                let shots = action.skillName === "Double-Shot" ? 2 : 1;
                let dmgMin = action.skillName === "Double-Shot" ? 300 : 500;
                let dmgMax = action.skillName === "Double-Shot" ? 500 : 800;
                let sfx = action.skillName === "Double-Shot" ? jadenSfx2 : jadenSfx1;
                let roundGain = action.skillName === "Double-Shot" ? 2 : 1;
                
                let currentTargetId = tId;
                for(let i=0; i<shots; i++) {
                    let cTInst = cardInstances[currentTargetId];
                    if (currentTargetId !== 'CORE' && (!cTInst || cTInst.hp <= 0)) {
                        let valids = getValidEnemyTargetIds(defSide); currentTargetId = valids.length > 0 ? valids[0] : 'CORE';
                    }
                    
                    let tDOM = currentTargetId === 'CORE' ? document.getElementById(actor.side === 'PLAYER' ? 'e-core-target' : 'p-core-target') : document.getElementById(currentTargetId);
                    let lock = showJadenLock(tDOM); shootBullet(actorDOM, tDOM);
                    if (action.skillName !== "Double-Shot" || i === 0) playSound(sfx);
                    if(lock) setTimeout(() => lock.remove(), 200);
                    
                    let dmg = Math.floor(Math.random() * (dmgMax - dmgMin + 1)) + dmgMin;
                    await applyDamage(actor, currentTargetId, dmg, action.skillName);
                    if (i < shots - 1) await new Promise(r=>setTimeout(r, 50));
                }
                actor.chamberedRounds = (actor.chamberedRounds || 0) + roundGain;
                
                if (Math.random() < 0.6) {
                    addLog(`<b>Jaden</b> [Passive]: Extra Shot!`, "var(--gold)"); await new Promise(r=>setTimeout(r, 300));
                    let cTInst = cardInstances[currentTargetId];
                    if (currentTargetId !== 'CORE' && (!cTInst || cTInst.hp <= 0)) {
                        let valids = getValidEnemyTargetIds(defSide); currentTargetId = valids.length > 0 ? valids[0] : 'CORE';
                    }
                    let tDOM = currentTargetId === 'CORE' ? document.getElementById(actor.side === 'PLAYER' ? 'e-core-target' : 'p-core-target') : document.getElementById(currentTargetId);
                    let lock2 = showJadenLock(tDOM); shootBullet(actorDOM, tDOM); playSound(jadenSfx3);
                    if(lock2) setTimeout(() => lock2.remove(), 200);
                    let dmg2 = Math.floor(Math.random() * (dmgMax - dmgMin + 1)) + dmgMin;
                    await applyDamage(actor, currentTargetId, dmg2, "Extra Shot");
                    actor.chamberedRounds++;
                }
            }
            if(actorDOM) { actorDOM.style.transform = "scale(1)"; await new Promise(r => setTimeout(r, 300)); actorDOM.style.transition = ""; }
        }
        if(actorDOM) { actorDOM.style.transform = "scale(1)"; await new Promise(r => setTimeout(r, 300)); actorDOM.style.transition = ""; }
        }
        else if (action.skillName === "Mana Beam") {
            let defSide = actor.side === 'PLAYER' ? 'ENEMY' : 'PLAYER';
            let activeEnemies = Array.from(document.querySelectorAll(`.slot[data-side="${defSide}"] .card`)).map(c => c.id).filter(id => cardInstances[id].hp > 0 && !(cardInstances[id].ambushTurns > 0 && cardInstances[id].ambushTurns >= turnCount));
            
            let lanes = { 'left': [], 'center': [], 'right': [] };
            activeEnemies.forEach(id => {
                let el = document.getElementById(id);
                if (el && el.parentElement && el.parentElement.id) {
                    if (el.parentElement.id.includes('left')) lanes['left'].push(id);
                    else if (el.parentElement.id.includes('center')) lanes['center'].push(id);
                    else if (el.parentElement.id.includes('right')) lanes['right'].push(id);
                }
            });

            let activeLanes = Object.keys(lanes).filter(l => lanes[l].length > 0);
            let chosenLanes = [];
            while(chosenLanes.length < 2 && activeLanes.length > 0) {
                let idx = Math.floor(Math.random() * activeLanes.length);
                chosenLanes.push(activeLanes.splice(idx, 1)[0]);
            }
            
            let targetsToHit = [];
            if (chosenLanes.length === 0) {
                targetsToHit = ['CORE', 'CORE', 'CORE'];
            } else {
                for (let i = 0; i < 3; i++) {
                    let lane = chosenLanes[Math.floor(Math.random() * chosenLanes.length)];
                    let laneTargets = lanes[lane];
                    targetsToHit.push(laneTargets[Math.floor(Math.random() * laneTargets.length)]);
                }
            }

            if(actorDOM) { actorDOM.style.transition = "transform 0.4s ease"; actorDOM.style.transform = "translateY(-20px) scale(1.1)"; await new Promise(r => setTimeout(r, 400)); }

            for(let i=0; i < targetsToHit.length; i++) {
                let tId = targetsToHit[i];
                let actualTargetId = tId === 'CORE' ? (defSide === 'ENEMY' ? 'e-core-target' : 'p-core-target') : tId;
                let tDOM = document.getElementById(actualTargetId);
                let dmg = Math.floor(Math.random() * (900 - 50 + 1)) + 50;
                
                if (actorDOM && tDOM) {
                    if (typeof createBlueBeamFx === 'function') createBlueBeamFx(actorDOM, tId === 'CORE' ? tDOM.parentElement : tDOM);
                    await applyDamage(actor, tId, dmg, "Mana Beam");
                }
                await new Promise(r => setTimeout(r, 100)); 
            }
            if(actorDOM) { actorDOM.style.transform = "scale(1) translateY(0)"; await new Promise(r => setTimeout(r, 300)); actorDOM.style.transition = ""; }
        }
        else {
            let dmg = actor.atk || 100; let secondDmg = 0;
            if (action.skillName === "Force of Nature") dmg = Math.floor(Math.random() * (300 - 150 + 1)) + 150;
            if (action.skillName === "SHORTSWORD STRIKE") dmg = isTutorialMode ? Math.floor(Math.random() * (120 - 80 + 1)) + 80 : Math.floor(Math.random() * (120 - 80 + 1)) + 80;
            if (action.skillName === "HEAVY STRIKE") dmg = Math.floor(Math.random() * (250 - 150 + 1)) + 150;
            if (action.skillName === "BANNER STRIKE") dmg = 50;
            if (action.skillName === "VOLLEY") dmg = Math.floor(Math.random() * (150 - 80 + 1)) + 80;
            if (action.skillName === "ICHI") { dmg = Math.floor(Math.random() * (1100 - 300 + 1)) + 300; if(dmg < 500) { secondDmg = Math.floor(Math.random() * (1100 - 500 + 1)) + 500; } }
            if (action.skillName === "NI") { if(kinSfx1Url) playSound(kinSfx1Url); dmg = Math.floor(Math.random() * 101) + 300; }
            if (action.skillName === "Bullseye") { let isAmbush = (actor.ambushTurns >= turnCount); dmg = isAmbush ? Math.floor(Math.random() * (1000 - 600 + 1)) + 600 : Math.floor(Math.random() * (400 - 200 + 1)) + 200; }
            if (action.skillName === "Arrow Rain") { let isAmbush = (actor.ambushTurns >= turnCount); dmg = isAmbush ? Math.floor(Math.random() * (180 - 90 + 1)) + 90 : Math.floor(Math.random() * (80 - 50 + 1)) + 50; }
            if (action.skillName === "Ambush") dmg = Math.floor(Math.random() * (1500 - 800 + 1)) + 800;
            if (action.skillName === "Lion's Challenge") dmg = 250;
            if (action.skillName === "SLASH") dmg = Math.floor(Math.random() * (150 - 50 + 1)) + 50;
            if (action.skillName === "Bite") dmg = Math.floor(Math.random() * (200 - 100 + 1)) + 100;
            if (action.skillName === "Uncoordinated attack") dmg = Math.floor(Math.random() * (200 - 100 + 1)) + 100;
            if (action.skillName === "Suicidal attack") { if (villagerSuicideSfxUrl) playSound(villagerSuicideSfxUrl); await new Promise(r => setTimeout(r, 100)); dmg = isTutorialMode ? 650 : Math.floor(Math.random() * (700 - 1 + 1)) + 1; }

            // Focus Fire Passive
            if (actor.name === "Archer" && action.targetId !== 'CORE') {
                if (globalTargetedThisTurn.includes(action.targetId)) { dmg += 40; addLog(`<b>Archer</b> Focus Fire activated! (+40 DMG)`, "#e67e22"); }
            }

            let targetsToHit = Array.isArray(action.targetId) ? action.targetId : [action.targetId]; 
            let defSide = actor.side === 'PLAYER' ? 'ENEMY' : 'PLAYER';
            
            let finalTargets = [];
            for (let tId of targetsToHit) {
                if (tId !== 'CORE' && action.skillName !== "ICHI_REROLL") {
                    let validIds = getValidEnemyTargetIds(defSide);
                    if (validIds.length > 0 && !validIds.includes(tId)) {
                        let newTid = validIds[Math.floor(Math.random() * validIds.length)];
                        addLog(`Target protected or untargettable! Redirected to ${cardInstances[newTid].name}.`, "#3498db");
                        finalTargets.push(newTid);
                    } else if (validIds.length === 0) {
                        addLog(`Defenses broken! Redirected to CORE.`, "#2ecc71");
                        finalTargets.push('CORE');
                    } else { finalTargets.push(tId); }
                } else { finalTargets.push(tId); }
            }

            for(let tId of finalTargets) {
                if (tId !== 'CORE' && (!cardInstances[tId] || cardInstances[tId].hp <= 0)) continue;
                if (tId !== 'CORE') globalTargetedThisTurn.push(tId);

                let targetDied = await applyDamage(actor, tId, dmg, action.skillName);
                
                if (!targetDied && cardInstances[tId] && tId !== 'CORE') {
                    if (action.skillName === "Lion's Challenge") { 
                        cardInstances[tId].tauntedBy = actor.id; cardInstances[tId].tauntedTurn = turnCount + (actor.side === 'ENEMY' ? 1 : 0); 
                        document.getElementById(tId).classList.add('taunted-status'); setTimeout(() => showFloatingText(document.getElementById(tId), "TAUNTED", "#f39c12", "1.5rem"), 400); 
                        showInspector(tId, document.getElementById(tId)); 
                    }
                    if (action.skillName === "Bite") {
                        cardInstances[tId].bleedStacks = (cardInstances[tId].bleedStacks || 0) + 1; cardInstances[tId].bleedTurns = turnCount + 2; 
                        setTimeout(() => showFloatingText(document.getElementById(tId), "BLEED", "#8e44ad", "1.5rem"), 400); showInspector(tId, document.getElementById(tId)); 
                    }
                }

                if (action.skillName === "Suicidal attack") {
                    actor.hp = 0; if (actorDOM) actorDOM.remove();
                    if (targetDied) {
                        if (actor.side === 'PLAYER') { pMana += 4; addLog(`<b>Militia</b> sacrificed to destroy target! Grants +4 Mana!`, "var(--mana-color)"); } 
                        else { eMana += 4; addLog(`Enemy <b>Militia</b> sacrificed to destroy target! Grants +4 Mana!`, "var(--mana-color)"); }
                    } else { addLog(`<b>Militia</b> sacrificed itself but failed to destroy the target!`, "#e74c3c"); }
                }

                if (secondDmg > 0 && (!targetDied || tId === 'CORE')) { 
                    addLog(`<b>KIN-RYU</b> [ICHI Reroll]: Strikes again!`, '#e74c3c'); 
                    targetDied = await applyDamage(actor, tId, secondDmg, "ICHI_REROLL"); 
                }
            }
        }
        
        if((actor.type === 'ability' || actor.isBuff) && action.skillName !== "Double Action") { actor.hp = 0; if(actorDOM) actorDOM.remove(); }
        updateUI(); await new Promise(r => setTimeout(r, 400)); 
    }
    
    isExecuting = false; document.body.classList.remove('in-combat-mode'); updateUI();
    
    if(isTutorialMode && tutorialStep === 7) { tutorialStep = 8; progressTutorial(); }
    if(isTutorialMode && tutorialStep === 16) { tutorialStep = 17; progressTutorial(); }
    
    if(eCoreHP <= 0) { 
        if (!isTutorialMode) { 
            alert("VICTORY! Enemy Core Destroyed!"); 
            if (typeof triggerJaxPostDuel === 'function' && typeof tgStep !== 'undefined' && tgStep >= 4) {
                triggerJaxPostDuel();
            } else {
                location.reload(); 
            }
        } 
        else { if (typeof triggerLicenseQuest === 'function') triggerLicenseQuest(); }
    }
    if(pCoreHP <= 0) { 
        if (!isTutorialMode) { alert("DEFEAT! Your Core was Destroyed!"); location.reload(); }
    }
}

document.getElementById('exec-btn').addEventListener('click', () => { 
    if(pQueue.length > 0 && !isExecuting) processQueue('PLAYER', pQueue); 
});

document.getElementById('cancel-btn').addEventListener('click', () => {
    if(isExecuting) return;
    
    pQueue.forEach(a => { 
        if(cardInstances[a.actorId]) cardInstances[a.actorId].queued = false; 
        pMana += a.cost;
    });
    
    if(pendingSkill && cardInstances[pendingSkill.actorId]) {
        cardInstances[pendingSkill.actorId].queued = false;
        pMana += pendingSkill.cost;
    }

    let omtRefundCount = 0;
    Object.values(cardInstances).forEach(c => {
        if (c.extraAction && c.side === 'PLAYER') {
            c.extraAction = false;
            let dDOM = document.getElementById(c.id);
            if(dDOM) dDOM.classList.remove('buff-double-action');
            omtRefundCount++;
        }
        if (c.hp === 0 && c.side === 'PLAYER' && c.name === "One More Time") {
            delete cardInstances[c.id];
        }
    });
    
    for(let i=0; i<omtRefundCount; i++) {
        const omtData = getCardTemplate("One More Time", ASSET_LINKS["One More Time"]);
        const cardId = 'card_' + Math.random().toString(36).substr(2, 9);
        cardInstances[cardId] = { ...omtData, id: cardId, exhausted: false, queued: false, side: 'PLAYER', turnPlaced: turnCount, tauntedBy: null, isRevealed: false };
        document.getElementById('hand').appendChild(createCardDOM(cardId, cardInstances[cardId], false));
    }
    
    if(omtRefundCount > 0) addLog(`${omtRefundCount}x One More Time cancelled & refunded to hand.`, "#9b59b6");
    
    pQueue = []; isTargeting = false; pendingSkill = null; selectedTargets = [];
    document.querySelectorAll('.card').forEach(c => c.classList.remove('target-glow', 'target-line-glow', 'target-heal-glow', 'target-buff-glow'));
    addLog("All pending actions cancelled.", "#e74c3c");
    updateUI(); showInspector('none', null); 
});

// --- 🤖 AI & END TURN LOGIC ---
async function aiDragAndDrop(cardId, data, targetSlotDOM) {
    const stack = document.getElementById('enemy-deck-stack'); const sRect = stack.getBoundingClientRect(); const tRect = targetSlotDOM.getBoundingClientRect();
    const ghost = document.createElement('div'); ghost.className = 'ai-dragging-card'; ghost.style.backgroundImage = `url("${deckBackImg.replace(/"/g, '&quot;').replace(/'/g, '%27')}")`;
    ghost.style.left = sRect.left + 'px'; ghost.style.top = sRect.top + 'px'; document.body.appendChild(ghost);
    if(dragSoundUrl) playSound(dragSoundUrl);

    targetSlotDOM.classList.add('valid-drop-zone');
    await new Promise(r => setTimeout(r, 50));
    ghost.style.left = (tRect.left) + 'px'; ghost.style.top = (tRect.top) + 'px'; ghost.style.transform = "scale(1.1) rotate(-5deg)";
    
    await new Promise(r => setTimeout(r, 600)); 
    ghost.remove(); targetSlotDOM.classList.remove('valid-drop-zone');
    
    targetSlotDOM.appendChild(createCardDOM(cardId, data, false));
    if(dropSoundUrl) playSound(dropSoundUrl);
}

document.getElementById('end-turn-btn').addEventListener('click', async () => {
    if (isExecuting) return; 
    
    Object.values(cardInstances).forEach(c => { if(c.side === 'ENEMY') { c.exhausted = false; c.queued = false; c.extraAction = false; c.blockActive = false; } });
    
    let activePlayerUnits = Object.values(cardInstances).filter(c => c.side === 'PLAYER' && c.tauntedBy && c.hp > 0 && c.turnPlaced < turnCount && !c.exhausted);
    activePlayerUnits.forEach(u => {
        let taunterDOM = document.getElementById(u.tauntedBy);
        if (taunterDOM && taunterDOM.parentElement.classList.contains('slot')) {
            if (!pQueue.some(a => a.actorId === u.id)) {
                let forcedSkill = "ATTACK"; let forcedCost = 0;
                if (u.skills && u.skills.length > 0 && pMana >= u.skills[0].manaCost) { forcedSkill = u.skills[0].name; forcedCost = u.skills[0].manaCost; }
                pQueue.push({ actorId: u.id, actorName: u.name, side: u.side, skillName: forcedSkill, cost: forcedCost, targetId: u.tauntedBy });
                addLog(`[TAUNTED] ${u.name} is forced to attack!`, "#e74c3c");
            }
        } else { u.tauntedBy = null; }
    });

    if(pQueue.length > 0) await processQueue('PLAYER', pQueue);

    let pBuffSlot = document.getElementById('player-buff-slot'); let pBuffCard = pBuffSlot.querySelector('.card');
    if (pBuffCard) {
        let pData = cardInstances[pBuffCard.id]; pData.buffTurnsRemaining--;
        if (pData.buffTurnsRemaining <= 0) { addLog(`Your <b>${pData.name}</b> expired.`, "#aaa"); pBuffCard.remove(); }
    }

    isExecuting = true; updateUI(); 
    currentTurn = 'ENEMY'; document.getElementById('turn-banner').innerText = "OPPONENT TURN"; document.getElementById('turn-banner').style.borderColor = "#e74c3c";
    addLog(`--- ENEMY TURN ${turnCount} ---`, "#e74c3c"); 
    
    if(isTutorialMode && tutorialStep === 3) { tutorialStep = 4; progressTutorial(); }
    if(isTutorialMode && tutorialStep === 9) { tutorialStep = 10; progressTutorial(); }
    if(isTutorialMode && tutorialStep === 12) { tutorialStep = 13; progressTutorial(); }

    setTimeout(aiTurn, 1000);
});

async function aiTurn() {
    let aiHandCount = eHandData.length; let aiToDraw = 6 - aiHandCount;
    if(aiToDraw > 0) { drawAnimated(aiToDraw, 'ENEMY'); await new Promise(r => setTimeout(r, 1000 + aiToDraw * 250)); }

    let eAbilSlot = document.querySelector('.slot.ability-slot[data-side="ENEMY"]'); let eBuffSlot = document.getElementById('enemy-buff-slot'); let buffInAbil = eAbilSlot.querySelector('.card');
    if (buffInAbil) {
        let bData = cardInstances[buffInAbil.id];
        if (bData && bData.isBuff && bData.turnPlaced < turnCount && !eBuffSlot.querySelector('.card')) {
            eBuffSlot.appendChild(buffInAbil); bData.buffTurnsRemaining = 2;
            if(buffActivatedUrl) playSound(buffActivatedUrl); addLog(`ENEMY activated ${bData.name} in Buff Slot!`, "#f1c40f"); updateUI(); await new Promise(r => setTimeout(r, 500));
        }
    }

    if (isTutorialMode && tutorialStep === 4) {
        let mId = eHandData.find(id => cardInstances[id].name === "Militia");
        let aId = eHandData.find(id => cardInstances[id].name === "Archer");
        let fSlot = document.getElementById('e-front-center');
        let bSlot = document.getElementById('e-back-center') || document.getElementById('e-back-left');
        
        if(mId) { eHandData.splice(eHandData.indexOf(mId), 1); cardInstances[mId].turnPlaced = turnCount; await aiDragAndDrop(mId, cardInstances[mId], fSlot); addLog(`ENEMY summoned Militia`, "#e74c3c"); updateUI(); await new Promise(r=>setTimeout(r, 500)); }
        if(aId) { eHandData.splice(eHandData.indexOf(aId), 1); cardInstances[aId].turnPlaced = turnCount; await aiDragAndDrop(aId, cardInstances[aId], bSlot); addLog(`ENEMY summoned Archer`, "#e74c3c"); updateUI(); await new Promise(r=>setTimeout(r, 500)); }
    } 
    else if (isTutorialMode && tutorialStep === 10) {
        let mId = Object.keys(cardInstances).find(id => cardInstances[id].name === "Militia" && cardInstances[id].side === 'ENEMY');
        let targetId = Object.keys(cardInstances).find(id => cardInstances[id].name === "Leonian Squire" && cardInstances[id].side === 'PLAYER');
        if (mId && targetId) { eQueue.push({ actorId: mId, actorName: "Militia", side: 'ENEMY', skillName: "Suicidal attack", cost: 2, targetId: targetId }); }
    }
    else if (isTutorialMode && tutorialStep === 13) {
        let aId = Object.keys(cardInstances).find(id => cardInstances[id].name === "Archer" && cardInstances[id].side === 'ENEMY');
        let targetId = Object.keys(cardInstances).find(id => cardInstances[id].name === "Great Knight" && cardInstances[id].side === 'PLAYER');
        if (aId && targetId) { eQueue.push({ actorId: aId, actorName: "Archer", side: 'ENEMY', skillName: "VOLLEY", cost: 1, targetId: targetId }); }
    } 
    else if (!isTutorialMode) {
        let summonable = eHandData.filter(id => cardInstances[id].summonCost <= eMana); 
        summonable.sort((a,b) => cardInstances[b].summonCost - cardInstances[a].summonCost);
        
        for(let i = summonable.length - 1; i >= 0; i--) {
            let id = summonable[i]; let data = cardInstances[id];
            if(data.type === 'ability') {
                if(data.name === "One More Time") {
                    let allies = Array.from(document.querySelectorAll('.slot[data-side="ENEMY"] .card')).map(c => cardInstances[c.id]).filter(c => c && c.type === 'unit' && !c.exhausted && c.turnPlaced < turnCount);
                    if(allies.length > 0 && eMana >= data.summonCost) {
                        let chosen = allies.sort((a,b) => (b.atk||0) - (a.atk||0))[0];
                        chosen.extraAction = true; document.getElementById(chosen.id).classList.add('buff-double-action');
                        eMana -= data.summonCost; eHandData.splice(eHandData.indexOf(id), 1); summonable.splice(i, 1);
                        addLog(`ENEMY activated One More Time on ${chosen.name}!`, "#9b59b6"); await new Promise(r => setTimeout(r, 400));
                    }
                } else {
                    let slot = document.querySelector('.slot[data-side="ENEMY"][data-allowed="ability"]');
                    if(!slot.querySelector('.card') && eMana >= data.summonCost) {
                        eMana -= data.summonCost; data.turnPlaced = turnCount; eHandData.splice(eHandData.indexOf(id), 1); summonable.splice(i, 1);
                        await aiDragAndDrop(id, data, slot); addLog(`ENEMY Set an Ability Card`, "#9b59b6"); updateUI(); await new Promise(r => setTimeout(r, 500));
                    }
                }
            }
        }

        for(let id of summonable) {
            let data = cardInstances[id];
            if(data.type === 'unit') {
                if (data.summonRequires && data.summonRequires.type === 'arashiSouls' && eArashiSouls < data.summonRequires.amount) continue;
                if (data.summonRequires && data.summonRequires.type === 'squiresFallen' && eSquiresFallen < data.summonRequires.amount) continue;

                let slots = Array.from(document.querySelectorAll('.slot[data-side="ENEMY"][data-allowed="unit"]')); 
                let empty = slots.filter(s => !s.querySelector('.card'));
                if(empty.length > 0 && eMana >= data.summonCost) {
                    let targetSlot = empty.find(s => s.classList.contains('frontline')) || empty[0]; 
                    eMana -= data.summonCost; 
                    if (data.summonRequires && data.summonRequires.type === 'arashiSouls') eArashiSouls -= data.summonRequires.amount;
                    if (data.summonRequires && data.summonRequires.type === 'squiresFallen') eSquiresFallen -= data.summonRequires.amount;

                    data.turnPlaced = turnCount; eHandData.splice(eHandData.indexOf(id), 1);
                    await aiDragAndDrop(id, data, targetSlot); addLog(`ENEMY summoned ${data.name}`, "#e74c3c"); 
                    updateUI(); await new Promise(r => setTimeout(r, 500));
                }
            }
        }
        
        eQueue = [];
        if(turnCount > 1) {
            let activeEnemyUnits = Array.from(document.querySelectorAll('.slot[data-side="ENEMY"] .card')).map(c => cardInstances[c.id]).filter(d => d.turnPlaced < turnCount && !d.exhausted && d.name !== "Lionel Guard Tower" && !d.isBuff);
            for(let data of activeEnemyUnits) {
                if (data.queued) continue; 
                let action = null;

                if (data.tauntedBy) {
                    let taunterDOM = document.getElementById(data.tauntedBy);
                    if (taunterDOM && taunterDOM.parentElement.classList.contains('slot')) { 
                        let forcedSkill = (data.skills && data.skills.length > 0) ? data.skills[0].name : "ATTACK";
                        action = { actorId: data.id, actorName: data.name, side: 'ENEMY', skillName: forcedSkill, cost: 0, targetId: data.tauntedBy }; 
                    } else { data.tauntedBy = null; }
                }

                if (!action) {
                    if(data.skills.length > 0 || data.type === 'ability') {
                        let validSkills = data.skills.filter(s => {
                            if (s.name === "Trigger Unbound" && (data.chamberedRounds || 0) === 0) return false;
                            if (s.requiresBlessings && (data.blessings || 0) < s.requiresBlessings) return false;
                            return eMana >= s.manaCost;
                        });
                        
                        let cost = validSkills.length > 0 ? validSkills[0].manaCost : 0;
                        let canAttack = (validSkills.length > 0 || data.type === 'ability');

                        if(canAttack && eMana >= cost) {
                            let pTargetIds = getValidEnemyTargetIds('PLAYER');
                            let pTargets = pTargetIds.map(id => document.getElementById(id)).filter(el => el);
                            let isFrontClear = pTargets.length === 0; 
                            
                            if(data.type === 'ability') { action = { actorId: data.id, actorName: data.name, side: 'ENEMY', skillName: data.skills[0].name, cost: cost, targetId: 'SELF' }; } 
                            else if (data.name === "Althea") {
                                if (data.blessings >= 7 && pTargets.length > 0) { action = { actorId: data.id, actorName: data.name, side: 'ENEMY', skillName: "Punishment of the Blessed", cost: 0, targetId: pTargets[Math.floor(Math.random()*pTargets.length)].id }; } 
                                if (!action && eMana >= 3) { action = { actorId: data.id, actorName: data.name, side: 'ENEMY', skillName: "Shield of Hope", cost: 3, targetId: 'ALLIES_FRONT' }; } 
                                if (!action && eMana >= 1) {
                                    let eTargets = Array.from(document.querySelectorAll('.slot[data-side="ENEMY"] .card'));
                                    if(eTargets.length > 0) { action = { actorId: data.id, actorName: data.name, side: 'ENEMY', skillName: "Blessing of the Light", cost: 1, targetId: eTargets[Math.floor(Math.random()*eTargets.length)].id }; }
                                }
                                if (!action && isFrontClear && Math.random() > 0.3) { action = { actorId: data.id, actorName: data.name, side: 'ENEMY', skillName: "ATTACK", cost: 0, targetId: 'CORE' }; }
                                else if (!action && pTargets.length > 0 && validSkills.length > 0) { action = { actorId: data.id, actorName: data.name, side: 'ENEMY', skillName: validSkills[Math.floor(Math.random() * validSkills.length)].name, cost: cost, targetId: pTargets[Math.floor(Math.random()*pTargets.length)].id }; }
                            }
                            else if (data.name === "Zeek") {
                                if (pTargets.length > 0 && validSkills.length > 0) {
                                    let chosenSkill = validSkills[Math.floor(Math.random() * validSkills.length)];
                                    if (chosenSkill.name === "Arrow Rain") {
                                        let targets = Array.from(document.querySelectorAll('.slot.frontline[data-side="PLAYER"] .card')).map(c => c.id).filter(id => !(cardInstances[id].ambushTurns > 0 && cardInstances[id].ambushTurns >= turnCount));
                                        if (targets.length === 0) targets = Array.from(document.querySelectorAll('.slot.backline[data-side="PLAYER"] .card')).map(c => c.id).filter(id => !(cardInstances[id].ambushTurns > 0 && cardInstances[id].ambushTurns >= turnCount));
                                        if (targets.length > 0) action = { actorId: data.id, actorName: data.name, side: 'ENEMY', skillName: "Arrow Rain", cost: chosenSkill.manaCost, targetId: targets };
                                    } else {
                                        action = { actorId: data.id, actorName: data.name, side: 'ENEMY', skillName: chosenSkill.name, cost: chosenSkill.manaCost, targetId: pTargets[Math.floor(Math.random()*pTargets.length)].id };
                                    }
                                }
                            }
                            else if (data.name === "Rolyn") {
                                 let allPTargets = Array.from(document.querySelectorAll('.slot[data-side="PLAYER"] .card')).filter(c=>c);
                                 if (eMana >= 4 && allPTargets.length > 0) { 
                                     let tIds = allPTargets.sort(() => 0.5 - Math.random()).slice(0, 3).map(c=>c.id);
                                     action = { actorId: data.id, actorName: data.name, side: 'ENEMY', skillName: "Lion's Roar", cost: 4, targetId: tIds }; 
                                 } else if (eMana >= 2 && pTargets.length > 0) {
                                     action = { actorId: data.id, actorName: data.name, side: 'ENEMY', skillName: "Lion's Challenge", cost: 2, targetId: pTargets[Math.floor(Math.random()*pTargets.length)].id };
                                 }
                            }
                            else if(isFrontClear && Math.random() > 0.3) { action = { actorId: data.id, actorName: data.name, side: 'ENEMY', skillName: "ATTACK", cost: 0, targetId: 'CORE' }; } 
                            else if(pTargets.length > 0 && validSkills.length > 0) { 
                                let chosenSkill = validSkills[Math.floor(Math.random() * validSkills.length)];
                                let tId = chosenSkill.name === "BLOCK" ? 'SELF' : pTargets[Math.floor(Math.random()*pTargets.length)].id;
                                action = { actorId: data.id, actorName: data.name, side: 'ENEMY', skillName: chosenSkill.name, cost: chosenSkill.manaCost, targetId: tId }; 
                            }
                        }
                    }
                }

                if (action) { eMana -= action.cost; data.queued = true; eQueue.push(action); systemDetector("QUEUE", { action }); }
            }
        }
    }

    if(eQueue.length > 0) await processQueue('ENEMY', eQueue);

    Object.values(cardInstances).forEach(c => {
        if(c.hp > 0 && c.bleedStacks > 0 && c.bleedTurns >= turnCount) {
            let bleedDmg = Math.floor(c.maxHp * (0.05 * c.bleedStacks)); c.hp -= bleedDmg;
            let cDOM = document.getElementById(c.id);
            if (cDOM) {
                showFloatingText(cDOM, `-${bleedDmg} BLEED`, "#8e44ad", "1.5rem"); cDOM.classList.remove("shake-anim"); void cDOM.offsetWidth; cDOM.classList.add("shake-anim"); syncVisualHP(cDOM, c.hp, c.maxHp);
            }
            addLog(`<b>${c.name}</b> takes ${bleedDmg} Bleed damage!`, '#8e44ad');

            if(c.name === "Zombie" && c.hp > 0 && c.hp <= 100) {
                 let healAmt = Math.floor(c.maxHp * 0.20);
                 c.hp = Math.min(c.maxHp, c.hp + healAmt);
                 c.shield = 100;
                 c.shieldTurns = turnCount + 99;
                 addLog(`<b>Zombie</b>'s Vigor of the Damned triggered from Bleed! Healed for ${healAmt} HP and gained 100 Shield!`, '#2ecc71');
                 if(cDOM) { showFloatingText(cDOM, "VIGOR OF THE DAMNED", "#2ecc71", "1.5rem"); cDOM.classList.add('shimmer-fx'); setTimeout(() => cDOM.classList.remove('shimmer-fx'), 1000); syncVisualHP(cDOM, c.hp, c.maxHp); }
            }
            if(c.hp <= 0) { addLog(`${c.name} succumbed to Bleed!`, '#aaa'); if(cDOM) cDOM.remove(); }
        } else if (c.bleedTurns < turnCount) { c.bleedStacks = 0; }
    });

    await new Promise(r => setTimeout(r, 600));
    
    let eActiveBuffCard = eBuffSlot.querySelector('.card');
    if (eActiveBuffCard) {
        let eData = cardInstances[eActiveBuffCard.id]; eData.buffTurnsRemaining--;
        if (eData.buffTurnsRemaining <= 0) { addLog(`Enemy <b>${eData.name}</b> expired.`, "#aaa"); eActiveBuffCard.remove(); }
    }
    
    // --- NEW TURN START ---
    turnCount++; currentTurn = 'PLAYER'; isExecuting = false; globalTargetedThisTurn = []; pSkeletonMana = 0; eSkeletonMana = 0;
    document.getElementById('turn-banner').innerText = `PLAYER TURN ${turnCount}`; document.getElementById('turn-banner').style.borderColor = "var(--gold)";
    
    Object.values(cardInstances).forEach(c => { 
        if(c.tauntedTurn && c.tauntedTurn < turnCount) { c.tauntedBy = null; } 
        let dDOM = document.getElementById(c.id);
        if(dDOM) { dDOM.classList.remove('buff-double-action'); showInspector(c.id, dDOM); }
        
        if(c.side === 'PLAYER') { c.exhausted = false; c.queued = false; c.extraAction = false; c.blockActive = false; }
        
        if (c.name === "Leonian Bannerman" && c.hp > 0 && dDOM && dDOM.parentElement && dDOM.parentElement.classList.contains('slot')) {
            let allies = Array.from(document.querySelectorAll(`.slot[data-side="${c.side}"] .card`)).map(el => cardInstances[el.id]);
            allies.forEach(ally => {
                if (ally.hp < ally.maxHp) {
                    let healAmt = Math.floor(Math.random() * (80 - 20 + 1)) + 20;
                    ally.hp = Math.min(ally.maxHp, ally.hp + healAmt);
                    let allyDOM = document.getElementById(ally.id); syncVisualHP(allyDOM, ally.hp, ally.maxHp);
                    showFloatingText(allyDOM, `+${healAmt}`, "#2ecc71", "1.5rem");
                }
            });
            if (healAudioUrl) playSound(healAudioUrl);
            addLog(`<b>Bannerman</b>'s Devotion heals the board!`, "#2ecc71");
        }

        if (c.name === "Skeleton Warrior" && c.hp > 0 && dDOM && dDOM.parentElement && dDOM.parentElement.classList.contains('slot')) {
            if (c.side === 'PLAYER') pSkeletonMana++; if (c.side === 'ENEMY') eSkeletonMana++;
            showFloatingText(dDOM, "+1 MANA", "var(--mana-color)", "1.5rem");
        }
    }); 
    
    let manaGain = (turnCount <= 10 ? 2 : turnCount <= 20 ? 3 : turnCount <= 30 ? 4 : 5); 
    let totalPGain = manaGain + pSkeletonMana; let totalEGain = manaGain + eSkeletonMana;

    await animateManaGain(totalPGain);
    pMana += totalPGain; eMana += totalEGain;

    if (pSkeletonMana > 0) addLog(`<b>Skeleton Warrior</b> generated ${pSkeletonMana} Mana!`, "var(--mana-color)");
    if (eSkeletonMana > 0) addLog(`Enemy <b>Skeleton Warrior</b> generated ${eSkeletonMana} Mana!`, "var(--mana-color)");

    addLog(`--- TURN ${turnCount} START ---`, "var(--gold)"); updateUI(); 
    
    if(isTutorialMode && tutorialStep === 4) { tutorialStep = 5; progressTutorial(); }
    if(isTutorialMode && tutorialStep === 10) { tutorialStep = 11; progressTutorial(); }
    if(isTutorialMode && tutorialStep === 13) { tutorialStep = 14; progressTutorial(); }

    if (!isTutorialMode) { const drawBtn = document.getElementById('draw-cards-btn'); drawBtn.style.display = "block"; drawBtn.innerText = "DRAW TO 6"; }
}

// ============================================================================
// 🛠️ DEV CONSOLE & CHEAT CODES
// ============================================================================

document.addEventListener('keydown', (e) => {
    const devConsole = document.getElementById('dev-console');
    const devInput = document.getElementById('dev-input');
    
    if (!devConsole || !devInput) return;

    // 1. OPEN CONSOLE: Press '/' (Only if not already typing somewhere else)
    if (e.key === '/' && devConsole.style.display === 'none' && document.activeElement.tagName !== 'INPUT') {
        e.preventDefault(); // Stop the '/' from scrolling the page or doing weird things
        devConsole.style.display = 'flex';
        devInput.value = '/'; // Pre-fill the slash for you
        
        // Slight delay ensures the focus works properly
        setTimeout(() => devInput.focus(), 10);
    } 
    // 2. CLOSE CONSOLE: Press 'Escape'
    else if (e.key === 'Escape' && devConsole.style.display === 'flex') {
        devConsole.style.display = 'none';
        devInput.blur();
    }
    // 3. EXECUTE COMMAND: Press 'Enter'
    else if (e.key === 'Enter' && document.activeElement === devInput) {
        const command = devInput.value.trim().toLowerCase();
        
        // --- COMMAND LIST ---
        if (command === '/kill core') {
            eCoreHP = 0; // Drop Enemy Core to 0
            
            if (typeof updateUI === 'function') updateUI();
            if (typeof addLog === 'function') addLog("⚠️ DEV COMMAND: Enemy Core Annihilated!", "#0f0");
            
            // NOTE: If your game doesn't instantly end when HP hits 0, you might need 
            // to press 'Execute' or 'End Turn' to force the game to check the win condition.
            // If you have a specific win function (like checkWinCondition()), call it right here!
        }
        else if (command === '/add gold') {
            if (typeof playerGold !== 'undefined') {
                playerGold += 1000;
                if (typeof updateGoldUI === 'function') updateGoldUI();
                if (typeof addLog === 'function') addLog("⚠️ DEV COMMAND: +1000 Gold", "#0f0");
            }
        }
        else {
            if (typeof addLog === 'function') addLog(`⚠️ Unknown Command: ${command}`, "#e74c3c");
        }
        
        // Hide the console after executing
        devConsole.style.display = 'none';
        devInput.blur();
    }
});
