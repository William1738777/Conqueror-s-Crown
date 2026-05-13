// ============================================================================
// ⚔️ ENGINE.JS - CORE COMBAT & AI LOGIC
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
        else if (fodders.length > 0) deck.push(fodders[0]);
    }
    return deck.slice(0, 40);
}

// --- 🖥️ UI & RENDER ---
function updateUI() {
    let pManaEl = document.getElementById('mana-display-num');
    if (pManaEl) pManaEl.innerText = pMana;

    let pCoreEl = document.getElementById('player-core-hp');
    if (pCoreEl) pCoreEl.innerText = `PLAYER CORE: ${pCoreHP}`;

    let pCoreBar = document.querySelector('.player-core .hp-bar-current');
    if (pCoreBar) {
        let pCorePct = Math.max(0, (pCoreHP / 2000) * 100);
        pCoreBar.style.width = `${pCorePct}%`;
    }

    let eCoreEl = document.getElementById('enemy-core-hp');
    if (eCoreEl) {
        if (!isTutorialMode) {
            eCoreEl.innerText = `ENEMY CORE: ${eCoreHP}`;
        } else {
            eCoreEl.innerText = `BEN'S CORE: 1 | MANA: 8`; 
        }
    }

    let eCoreBar = document.querySelector('.enemy-core .hp-bar-current');
    if (eCoreBar && !isTutorialMode) {
        let eCorePct = Math.max(0, (eCoreHP / 2000) * 100);
        eCoreBar.style.width = `${eCorePct}%`;
    }

    let execBtn = document.getElementById('exec-btn');
    if (execBtn) execBtn.innerText = `EXECUTE PENDING (${pQueue.length})`;

    document.querySelectorAll('.card').forEach(el => {
        let id = el.id;
        let inst = cardInstances[id];
        if (inst) {
            if (inst.hp <= 0) el.classList.add('dead');
            else {
                el.classList.remove('dead');
                if (inst.side === currentTurn && !inst.exhausted && !inst.queued) {
                    if(inst.turnPlaced < turnCount || inst.type === 'ability' || inst.isBuff) el.classList.add('can-act');
                    else el.classList.remove('can-act');
                } else el.classList.remove('can-act');
            }
            if (inst.queued) el.classList.add('queued-action'); else el.classList.remove('queued-action');
        }
    });

    if (currentTurn === 'PLAYER') {
        let endBtn = document.getElementById('end-turn-btn');
        let cancelBtn = document.getElementById('cancel-btn');
        let drawBtn = document.getElementById('draw-cards-btn');
        
        if(endBtn) endBtn.style.display = 'block';
        if(execBtn) execBtn.style.display = 'block';
        if(cancelBtn) cancelBtn.style.display = 'block';
        if (drawBtn && !isTutorialMode) drawBtn.style.display = document.getElementById('hand').children.length < 6 ? 'block' : 'none';
    } else {
        let endBtn = document.getElementById('end-turn-btn');
        let cancelBtn = document.getElementById('cancel-btn');
        let drawBtn = document.getElementById('draw-cards-btn');
        
        if(endBtn) endBtn.style.display = 'none';
        if(execBtn) execBtn.style.display = 'none';
        if(cancelBtn) cancelBtn.style.display = 'none';
        if (drawBtn && !isTutorialMode) drawBtn.style.display = 'none';
    }
}

function syncVisualHP(cardDOM, hp, maxHp) {
    if(!cardDOM) return;
    let hpBar = cardDOM.querySelector('.hp-bar-current');
    let hpText = cardDOM.querySelector('.hp-text');
    if(hpBar) {
        let pct = Math.max(0, (hp / maxHp) * 100);
        hpBar.style.width = pct + '%';
    }
    if(hpText) hpText.innerText = hp;
}

function createCardDOM(id, data, isHidden) {
    const el = document.createElement('div');
    el.className = 'card';
    el.id = id;
    el.draggable = true;

    if (isHidden) {
        el.style.backgroundImage = `url('${deckBackImg}')`;
        el.classList.add('hidden-card');
        el.innerHTML = `<div class="card-title">Unknown</div>`;
    } else {
        let safeImg = data.img ? data.img.replace(/"/g, '&quot;').replace(/'/g, '%27') : '';
        let statsHTML = '';
        if (data.type === 'unit') {
            statsHTML = `<div class="card-stats">ATK: ${data.atk} <br><div class="hp-bar"><div class="hp-bar-current" style="width: 100%;"></div></div><span class="hp-text">${data.hp}</span></div>`;
        } else if (data.type === 'ability') {
            statsHTML = `<div class="card-stats" style="color:var(--mana-color);">SPELL</div>`;
        } else if (data.isBuff) {
            statsHTML = `<div class="card-stats" style="color:#e67e22;">BUFF</div>`;
        }

        let costType = data.type === 'unit' ? 'summonCost' : 'manaCost';
        let costVal = data[costType] !== undefined ? data[costType] : (data.skills && data.skills.length > 0 ? data.skills[0].manaCost : 0);
        
        let marksHTML = '';
        if (data.name === 'Great Knight') { marksHTML = `<div class="status-icon" style="background-image: url('${barrierImgUrl}'); bottom: -10px; right: 25px; display: none;" id="shield-${id}"></div>`; }
        if (data.name === 'KIN-RYU') { marksHTML = `<div class="marks-display" id="marks-${id}">Souls: 0/3</div>`; }

        el.innerHTML = `
            <div class="card-cost">${costVal}</div>
            <div class="card-img-container" style="background-image: url('${safeImg}');"></div>
            <div class="card-title">${data.name}</div>
            ${statsHTML}
            ${marksHTML}
            <div class="card-fx-overlay"></div>
        `;
    }

    el.addEventListener('dragstart', handleDragStart);
    el.addEventListener('dragend', handleDragEnd);
    el.addEventListener('click', handleCardClick);

    return el;
}

// --- FULLY REBUILT CARD INSPECTOR ---
function handleRightClick(id) {
    let card = cardInstances[id];
    if (!card) return;

    document.getElementById('inspect-name').innerText = card.name;
    document.getElementById('inspect-sub').innerText = card.title || (card.type === 'unit' ? 'Unit' : 'Spell');
    
    let artEl = document.getElementById('inspect-art-fixed');
    if (card.img) {
        artEl.src = card.img.replace(/"/g, '').replace(/'/g, '');
        artEl.style.display = 'block';
        artEl.style.width = '100%';
        artEl.style.border = '1px solid #444';
        artEl.style.borderRadius = '4px';
    }

    let statsHtml = '';
    if (card.type === 'unit') {
        statsHtml = `<div style="color:#e74c3c; font-weight:bold; text-align:center; padding-bottom:5px; border-bottom:1px solid #333;">ATK: ${card.atk || 0} &nbsp;|&nbsp; HP: ${card.hp}/${card.maxHp}</div>`;
    } else {
        statsHtml = `<div style="color:var(--mana-color); font-weight:bold; text-align:center; padding-bottom:5px; border-bottom:1px solid #333;">SPELL CARD</div>`;
    }

    if (card.passives && card.passives.length > 0) {
        card.passives.forEach(p => {
            statsHtml += `<div style="margin-top:10px; border-left: 2px solid #e67e22; padding-left: 5px; text-align: left; font-size: 0.8rem;">
                <span style="color:#e67e22; font-weight:bold;">[${p.name}]</span><br>
                <span style="color:#ccc;">${p.desc}</span>
            </div>`;
        });
    }
    document.getElementById('inspect-status-box').innerHTML = statsHtml;

    let skillsHtml = '';
    if (card.skills && card.skills.length > 0) {
        card.skills.forEach(s => {
            skillsHtml += `<div style="margin-bottom:8px; background:rgba(255,255,255,0.05); padding:5px; border-radius:4px; font-size: 0.8rem; text-align: left;">
                <span style="color:var(--gold); font-weight:bold;">[${s.name}]</span> 
                <span style="color:var(--mana-color); float:right;">${s.manaCost} MP</span><br>
                <div style="color:#ccc; margin-top:4px;">${s.desc}</div>
            </div>`;
        });
    } else if (card.type === 'unit') {
         skillsHtml = `<div style="margin-bottom:8px; background:rgba(255,255,255,0.05); padding:5px; border-radius:4px; font-size: 0.8rem; text-align: left;">
                <span style="color:var(--gold); font-weight:bold;">[ATTACK]</span> 
                <span style="color:var(--mana-color); float:right;">0 MP</span><br>
                <div style="color:#ccc; margin-top:4px;">Basic attack.</div>
            </div>`;
    } else {
        skillsHtml = `<div class="empty-inspector">No actions available.</div>`;
    }
    document.getElementById('inspect-skills-sector').innerHTML = skillsHtml;

    let cost = card.type === 'unit' ? card.summonCost : (card.skills && card.skills.length > 0 ? card.skills[0].manaCost : 0);
    document.getElementById('inspect-summon-val').innerText = cost + ' MANA';
}

// --- 🖱️ DRAG & DROP ---
function handleDragStart(e) {
    if(tutorialLock && !e.target.classList.contains('tut-highlight-glow')) { e.preventDefault(); return; }
    if(isTargeting) { e.preventDefault(); return; }
    let id = e.target.id;
    let card = cardInstances[id];
    if (!card || card.side !== 'PLAYER' || e.target.parentElement.id !== 'hand') { e.preventDefault(); return; }
    
    e.dataTransfer.setData('text/plain', id);
    e.target.classList.add('dragging');
    if (typeof playSound === 'function' && typeof dragSoundUrl !== 'undefined') playSound(dragSoundUrl, false);
}

function handleDragEnd(e) { e.target.classList.remove('dragging'); }

function allowDrop(e) { e.preventDefault(); }

function dropToSlot(e) {
    e.preventDefault();
    if(tutorialLock && !e.currentTarget.classList.contains('tut-highlight-glow')) return;
    
    let id = e.dataTransfer.getData('text/plain');
    if (!id) return;
    let slot = e.currentTarget;
    let card = cardInstances[id];

    if (!card || card.side !== 'PLAYER') return;
    if (slot.children.length > 1) { addLog("Slot occupied.", "red"); return; }
    if (slot.dataset.allowed === 'ability' && card.type !== 'ability') { addLog("Only spells go here.", "red"); return; }
    if (slot.dataset.allowed === 'buff' && !card.isBuff) { addLog("Only buffs go here.", "red"); return; }
    if (slot.dataset.allowed === 'unit' && card.type !== 'unit') { addLog("Only units go here.", "red"); return; }

    let cost = card.type === 'unit' ? card.summonCost : (card.skills && card.skills.length > 0 ? card.skills[0].manaCost : 0);
    if (cost > pMana) { addLog(`Not enough Mana (${cost} needed).`, "red"); return; }

    if (card.summonRequires) {
        if (card.summonRequires.type === 'squiresFallen' && pSquiresFallen < card.summonRequires.amount) {
            addLog(`Requires ${card.summonRequires.amount} fallen Squire(s).`, "red");
            return;
        }
    }

    if(tutorialLock) clearTutHighlights();

    pMana -= cost;
    card.turnPlaced = turnCount;
    slot.appendChild(document.getElementById(id));
    if (typeof playSound === 'function' && typeof dropSoundUrl !== 'undefined') playSound(dropSoundUrl, false);
    
    addLog(`Summoned <b>${card.name}</b>.`, "var(--mana-color)");
    
    if(isTutorialMode) {
        if(tutorialStep === 1) { tutorialStep = 2; progressTutorial(); }
        else if(tutorialStep === 2) { tutorialStep = 3; progressTutorial(); }
        else if(tutorialStep === 8) { tutorialStep = 9; progressTutorial(); }
        else if(tutorialStep === 11) { tutorialStep = 12; progressTutorial(); }
    }
    updateUI();
}

document.querySelectorAll('.slot').forEach(s => { s.addEventListener('dragover', allowDrop); s.addEventListener('drop', dropToSlot); });

// --- 🎯 COMBAT / TARGETING ---
function handleCardClick(e) {
    let id = e.currentTarget.id;
    if(tutorialLock && !document.getElementById(id).classList.contains('tut-highlight-glow')) return;
    
    // Unify clicks: Left clicking a card inspects it immediately!
    handleRightClick(id); 
    
    let card = cardInstances[id];
    let parentId = e.currentTarget.parentElement.id;

    if (isTargeting) {
        if (pendingAction.sourceId === id) { cancelTargeting(); return; }
        finalizeTargeting(id);
        return;
    }

    if (card && card.side === 'PLAYER' && parentId !== 'hand' && !card.exhausted && !card.queued) {
        if (card.turnPlaced === turnCount && card.type === 'unit') { addLog("Summoning sickness.", "red"); return; }

        if (card.skills && card.skills.length > 0) {
            let menu = document.createElement('div');
            menu.className = 'action-menu';
            
            // Absolutely positioned so it pops up at the cursor
            menu.style.position = 'absolute';
            menu.style.zIndex = '9999';
            menu.style.left = e.pageX + 'px';
            menu.style.top = e.pageY + 'px';
            menu.style.backgroundColor = 'rgba(15, 15, 15, 0.95)';
            menu.style.border = '2px solid var(--gold, #f1c40f)';
            menu.style.padding = '10px';
            menu.style.borderRadius = '6px';
            menu.style.display = 'flex';
            menu.style.flexDirection = 'column';
            menu.style.gap = '8px';

            card.skills.forEach((skill) => {
                let btn = document.createElement('button');
                btn.innerHTML = `[${skill.name}] <span style="color:var(--mana-color)">${skill.manaCost} MP</span>`;
                btn.onclick = () => {
                    document.body.removeChild(menu);
                    
                    let allowedSkills = ["HEAVY STRIKE", "Mana Initiation", "ATTACK", "VOLLEY", "RALLY", "SHORTSWORD STRIKE"];
                    if(tutorialLock && !allowedSkills.includes(skill.name)) {
                        addLog("You cannot use this skill right now.", "red"); return;
                    }
                    if (pMana < skill.manaCost) { addLog("Not enough Mana.", "red"); return; }
                    
                    if (skill.name === "Mana Initiation") {
                        pMana -= skill.manaCost;
                        pQueue.push({ sourceId: id, targetId: id, action: skill.name });
                        card.queued = true;
                        addLog(`Queued <b>Mana Initiation</b>.`, "var(--gold)");
                        if(isTutorialMode && tutorialStep === 5) { tutorialStep = 6; progressTutorial(); }
                        updateUI();
                    } else if (skill.name === "RALLY") {
                        pMana -= skill.manaCost;
                        pQueue.push({ sourceId: id, targetId: null, action: skill.name });
                        card.queued = true;
                        addLog(`Queued <b>RALLY</b>.`, "var(--gold)");
                        if(isTutorialMode && tutorialStep === 14) { tutorialStep = 15; progressTutorial(); }
                        updateUI();
                    } else {
                        startTargeting(id, skill.name, skill.manaCost);
                    }
                };
                menu.appendChild(btn);
            });

            if (card.type === 'unit') {
                let atkBtn = document.createElement('button');
                atkBtn.innerHTML = `[ATTACK] <span style="color:var(--mana-color)">0 MP</span>`;
                atkBtn.onclick = () => {
                    document.body.removeChild(menu);
                    startTargeting(id, "ATTACK", 0);
                };
                menu.appendChild(atkBtn);
            }

            let cancelBtn = document.createElement('button');
            cancelBtn.innerText = "Cancel";
            cancelBtn.onclick = () => document.body.removeChild(menu);
            menu.appendChild(cancelBtn);

            document.body.appendChild(menu);
        } else if (card.type === 'unit') {
            startTargeting(id, "ATTACK", 0);
        }
    }
}

function startTargeting(sourceId, actionName, cost) {
    isTargeting = true;
    pendingAction = { sourceId, action: actionName, cost };
    document.body.style.cursor = "crosshair";
    document.querySelectorAll('.card').forEach(c => {
        let inst = cardInstances[c.id];
        if (inst && inst.side === 'ENEMY' && inst.hp > 0 && c.parentElement.id !== 'hand') c.classList.add('target-glow');
        if (actionName === "HEAL" && inst && inst.side === 'PLAYER') c.classList.add('target-heal-glow');
    });
    document.getElementById('e-core-target').classList.add('target-glow');
    addLog(`Select target for <b>${actionName}</b>...`, "#aaa");
}

function cancelTargeting() {
    isTargeting = false; pendingAction = null;
    document.body.style.cursor = "default";
    document.querySelectorAll('.target-glow, .target-heal-glow').forEach(el => el.classList.remove('target-glow', 'target-heal-glow'));
    addLog("Action cancelled.", "#aaa");
}

function finalizeTargeting(targetId) {
    if(tutorialLock && targetId !== 'e_Militia_0' && targetId !== 'e_Archer_1' && targetId !== 'e-core-target') {
        addLog("Attack the highlighted target.", "red"); return;
    }

    if (targetId.startsWith('e_') && cardInstances[targetId]) {
        let tCard = cardInstances[targetId];
        let pId = document.getElementById(targetId).parentElement.id;
        if (pId.includes('back')) {
            let frontHasUnits = ['e-front-left', 'e-front-center', 'e-front-right'].some(id => document.getElementById(id).children.length > 1 && cardInstances[document.getElementById(id).children[1].id].hp > 0);
            if (frontHasUnits) { addLog("Frontline protects the backline!", "red"); return; }
        }
    } else if (targetId === 'e-core-target') {
        let frontHasUnits = ['e-front-left', 'e-front-center', 'e-front-right'].some(id => document.getElementById(id).children.length > 1 && cardInstances[document.getElementById(id).children[1].id].hp > 0);
        if (frontHasUnits) { addLog("Core protected by Frontline!", "red"); return; }
    }

    if(tutorialLock) clearTutHighlights();

    pMana -= pendingAction.cost;
    pQueue.push({ sourceId: pendingAction.sourceId, targetId: targetId, action: pendingAction.action });
    cardInstances[pendingAction.sourceId].queued = true;
    
    let targetName = targetId === 'e-core-target' ? "Enemy Core" : cardInstances[targetId].name;
    addLog(`Queued <b>${pendingAction.action}</b> on <b>${targetName}</b>.`, "var(--gold)");

    if(isTutorialMode && tutorialStep === 6) { tutorialStep = 7; progressTutorial(); }
    if(isTutorialMode && tutorialStep === 15) { tutorialStep = 16; progressTutorial(); }
    if(isTutorialMode && tutorialStep === 17) { tutorialStep = 18; progressTutorial(); }

    cancelTargeting(); updateUI();
}

// --- ⚡ EXECUTION ENGINE ---
async function processQueue(side, queueObj) {
    isExecuting = true;
    document.querySelectorAll('.btn-main').forEach(btn => btn.style.display = 'none');
    
    let q = [...queueObj];
    if (side === 'PLAYER') pQueue = []; else eQueue = [];
    updateUI();

    for (let act of q) {
        let source = cardInstances[act.sourceId];
        let target = act.targetId && act.targetId.includes('core') ? null : cardInstances[act.targetId];
        let sDOM = document.getElementById(act.sourceId);
        let tDOM = document.getElementById(act.targetId);

        if (!source || source.hp <= 0 || !sDOM) continue;
        if (target && target.hp <= 0 && target.id !== source.id) { addLog(`${source.name}'s target is already dead.`, "#aaa"); continue; }

        sDOM.classList.remove('queued-action');
        sDOM.classList.add('attack-bump');
        setTimeout(() => sDOM.classList.remove('attack-bump'), 300);

        if (target) { tDOM.classList.add('damage-flash'); setTimeout(() => tDOM.classList.remove('damage-flash'), 300); }
        else if (tDOM) { tDOM.classList.add('damage-flash'); setTimeout(() => tDOM.classList.remove('damage-flash'), 300); }

        if (act.action === "Mana Initiation") {
            if (side === 'PLAYER') pMana += 3; else eMana += 3;
            if (abilityAudioUrl) playSound(abilityAudioUrl);
            addLog(`<b>${source.name}</b> activated Mana Initiation! +3 Mana.`, "var(--mana-color)");
            showFloatingText(sDOM, "+3 MANA", "var(--mana-color)", "2rem");
            source.hp = 0; sDOM.classList.add('dead');
        } 
        else if (act.action === "RALLY") {
            addLog(`<b>${source.name}</b> used RALLY! Shielding allies!`, "var(--gold)");
            if (healAudioUrl) playSound(healAudioUrl);
            ['p-front-left', 'p-front-center', 'p-front-right'].forEach(slotId => {
                let slot = document.getElementById(slotId);
                if(slot && slot.children.length > 1) {
                    let cDOM = slot.children[1];
                    let cData = cardInstances[cDOM.id];
                    if(cData && cData.hp > 0) { showFloatingText(cDOM, "+SHIELD", "var(--gold)"); }
                }
            });
            source.exhausted = true;
        }
        else {
            let dmg = source.atk || 0;
            if (act.action === "HEAVY STRIKE") dmg = Math.floor(Math.random() * 101) + 150;
            if (act.action === "SHORTSWORD STRIKE") dmg = Math.floor(Math.random() * 21) + 40;
            if (act.action === "VOLLEY") dmg = 80;

            if (target && target.name === "Great Knight" && target.passives && target.passives.some(p => p.name === "HEAVY PLATE")) {
                dmg -= 40; if (dmg < 0) dmg = 0;
            }

            if (act.action === "VOLLEY") createProjectile(sDOM, tDOM, arrowImgUrl, 'arrow-fx');
            else createProjectile(sDOM, tDOM, slashImgUrl, 'slash-fx');
            
            if (arrowHitAudioUrl) playSound(arrowHitAudioUrl);

            if (target) {
                target.hp -= dmg;
                syncVisualHP(tDOM, target.hp, target.maxHp);
                showFloatingText(tDOM, `-${dmg}`, "#e74c3c");
                addLog(`<b>${source.name}</b> dealt ${dmg} to <b>${target.name}</b>!`, "white");
                
                if (target.hp <= 0) {
                    addLog(`<b>${target.name}</b> was destroyed!`, "#e74c3c");
                    tDOM.classList.add('dead');
                    if (target.name === "Leonian Squire") {
                        if (target.side === 'PLAYER') pSquiresFallen++; else eSquiresFallen++;
                    }
                }
            } else if (act.targetId.includes('core')) {
                if (side === 'PLAYER') {
                    eCoreHP -= dmg; showFloatingText(tDOM, `-${dmg}`, "#e74c3c", "3rem");
                    addLog(`<b>${source.name}</b> dealt ${dmg} to Enemy Core!`, "#e74c3c");
                } else {
                    pCoreHP -= dmg; showFloatingText(tDOM, `-${dmg}`, "#e74c3c", "3rem");
                    addLog(`<b>${source.name}</b> dealt ${dmg} to Player Core!`, "#e74c3c");
                }
            }
            source.exhausted = true;
        }
        await new Promise(r => setTimeout(r, 600));
    }

    isExecuting = false;
    updateUI();

    // VICTORY CONDITIONS AND LICENSE TRIGGER!
    if(eCoreHP <= 0) { 
        if (!isTutorialMode) {
            alert("VICTORY! Enemy Core Destroyed!"); 
            location.reload(); 
        } else {
            if (typeof triggerLicenseQuest === 'function') triggerLicenseQuest();
        }
    } else if(pCoreHP <= 0) {
        if (!isTutorialMode) {
            alert("DEFEAT! Your Core was destroyed.");
            location.reload();
        }
    } else {
        if (side === 'ENEMY') { document.querySelectorAll('.btn-main').forEach(btn => btn.style.display = 'block'); }
        if (isTutorialMode && tutorialStep === 7) { tutorialStep = 8; progressTutorial(); }
        if (isTutorialMode && tutorialStep === 16) { tutorialStep = 17; progressTutorial(); }
    }
}

// --- BUTTONS ---
document.getElementById('draw-cards-btn').addEventListener('click', () => {
    let handDOM = document.getElementById('hand');
    if (handDOM.children.length >= 6) { addLog("Hand is full.", "red"); return; }
    if (pDeck.length <= 0) { addLog("Deck is empty.", "red"); return; }
    
    let card = pDeck.pop();
    let id = 'p_' + generateUID();
    cardInstances[id] = { ...card, id: id, exhausted: true, queued: false, side: 'PLAYER', turnPlaced: turnCount, tauntedBy: null, isRevealed: false };
    handDOM.appendChild(createCardDOM(id, card, false));
    if (drawAudioUrl) playSound(drawAudioUrl);
    
    document.getElementById('p-deck-count').innerText = pDeck.length;
    updateUI();
});

document.getElementById('exec-btn').addEventListener('click', async () => {
    if (currentTurn !== 'PLAYER' || isExecuting || pQueue.length === 0) return;
    await processQueue('PLAYER', pQueue);
});

document.getElementById('cancel-btn').addEventListener('click', () => {
    if (currentTurn !== 'PLAYER' || isExecuting) return;
    pQueue.forEach(act => {
        cardInstances[act.sourceId].queued = false;
        pMana += act.cost || 0; 
    });
    pQueue = [];
    addLog("Queue cleared. Mana refunded.", "#aaa");
    updateUI();
});

// ============================================================================
// 🧠 ENEMY AI (JAX) & TURN MANAGEMENT
// ============================================================================
document.getElementById('end-turn-btn').addEventListener('click', async () => {
    if (currentTurn !== 'PLAYER' || isExecuting) return;

    if (isTutorialMode) {
        if (tutorialStep === 3) { tutorialStep = 4; progressTutorial(); return; }
        if (tutorialStep === 9) { tutorialStep = 10; progressTutorial(); return; }
        if (tutorialStep === 12) { tutorialStep = 13; progressTutorial(); return; }
        return; 
    }
    
    currentTurn = 'ENEMY';
    document.getElementById('draw-cards-btn').style.display = "none";
    document.querySelectorAll('.btn-main').forEach(btn => btn.style.display = 'none');
    
    updateUI();
    addLog("Jax is making his move...", "#e74c3c");
    await new Promise(r => setTimeout(r, 1200));

    // --- 1. DRAW PHASE ---
    while (eHandData.length < 6 && eDeck.length > 0) {
        let drawn = eDeck.pop();
        const cardId = 'e_' + generateUID();
        cardInstances[cardId] = { ...drawn, id: cardId, exhausted: true, queued: false, side: 'ENEMY', turnPlaced: turnCount, tauntedBy: null, isRevealed: false };
        eHandData.push(cardId);
    }
    document.getElementById('e-deck-count').innerText = eDeck.length;
    updateUI();
    await new Promise(r => setTimeout(r, 600));

    // --- 2. PLACEMENT PHASE ---
    let handCopy = [...eHandData];
    for (let cardId of handCopy) {
        let card = cardInstances[cardId];
        let cost = card.type === 'unit' ? card.summonCost : (card.skills && card.skills.length > 0 ? card.skills[0].manaCost : 0);
        
        if (cost <= eMana) {
            if (card.summonRequires && card.summonRequires.type === 'squiresFallen' && eSquiresFallen < card.summonRequires.amount) continue;

            let placedSlotId = null;
            if (card.type === 'unit') {
                let frontSlots = ['e-front-left', 'e-front-center', 'e-front-right'];
                let emptyFront = frontSlots.find(id => document.getElementById(id).children.length === 1);
                if (emptyFront) placedSlotId = emptyFront;
                else {
                    let backSlots = ['e-back-left', 'e-back-right'];
                    let emptyBack = backSlots.find(id => document.getElementById(id).children.length === 1);
                    if (emptyBack) placedSlotId = emptyBack;
                }
            } else if (card.type === 'ability' || card.isBuff) {
                let slotType = card.isBuff ? 'e-buff' : 'e-ability';
                if (document.getElementById(slotType).children.length === 1) placedSlotId = slotType;
            }

            if (placedSlotId) {
                eMana -= cost;
                eHandData = eHandData.filter(id => id !== cardId);
                
                // Trigger the NEW Animation Engine!
                await animateAIPlacement(cardId, card, placedSlotId);
                await new Promise(r => setTimeout(r, 200));
            }
        }
    }
    updateUI();

    // --- 3. QUEUEING ATTACKS ---
    let boardCards = Object.values(cardInstances).filter(c => c.side === 'ENEMY' && c.hp > 0 && !eHandData.includes(c.id));
    for (let card of boardCards) {
        if (card.turnPlaced === turnCount && card.type === 'unit') continue;
        if (card.exhausted || card.queued) continue;

        let pFront = Object.values(cardInstances).filter(c => c.side === 'PLAYER' && c.hp > 0 && ['p-front-left', 'p-front-center', 'p-front-right'].includes(document.getElementById(c.id)?.parentElement?.id));
        let pBack = Object.values(cardInstances).filter(c => c.side === 'PLAYER' && c.hp > 0 && ['p-back-left', 'p-back-right'].includes(document.getElementById(c.id)?.parentElement?.id));
        
        let tauntTarget = pFront.find(c => c.skills?.some(s => s.name === "VALIANT GUARD" && c.blockActive));
        let targetId = null;
        let actionName = (card.skills && card.skills.length > 0 && card.skills[0].manaCost <= eMana) ? card.skills[0].name : "ATTACK";

        if (card.type === 'unit') {
            if (tauntTarget) targetId = tauntTarget.id;
            else if (pFront.length > 0) targetId = pFront[Math.floor(Math.random() * pFront.length)].id;
            else if (pBack.length > 0) targetId = pBack[Math.floor(Math.random() * pBack.length)].id;
            else targetId = 'p-core-target';
        } else if (card.type === 'ability') {
             targetId = 'p-core-target'; 
             actionName = card.skills[0].name;
        }

        if (targetId) {
            let skill = card.skills?.find(s => s.name === actionName);
            if (skill && skill.manaCost) eMana -= skill.manaCost;

            eQueue.push({ sourceId: card.id, targetId: targetId, action: actionName });
            card.queued = true;
        }
    }

    // --- 4. EXECUTE QUEUE ---
    if (eQueue.length > 0) {
        addLog("Jax executes his assault!", "#e74c3c");
        await new Promise(r => setTimeout(r, 800));
        await processQueue('ENEMY', eQueue); 
    } else {
        addLog("Jax ends his turn without attacking.", "#aaa");
        await new Promise(r => setTimeout(r, 1000));
        
        turnCount++;
        currentTurn = 'PLAYER';
        
        let manaGain = (turnCount <= 10 ? 2 : turnCount <= 20 ? 3 : turnCount <= 30 ? 4 : 5); 
        pMana += manaGain + pSkeletonMana; 
        eMana += manaGain + eSkeletonMana;
        
        Object.values(cardInstances).forEach(c => { c.queued = false; c.extraAction = false; c.blockActive = false; c.exhausted = false; });

        addLog(`--- TURN ${turnCount} START ---`, "var(--gold)"); 
        updateUI();
        document.querySelectorAll('.btn-main').forEach(btn => btn.style.display = 'block');
    }
});

// --- HELPER FUNCTIONS ---
function generateUID() { return Math.random().toString(36).substr(2, 9); }
function addLog(msg, color="white") {
    let log = document.getElementById('event-log');
    if (!log) return;
    let entry = document.createElement('div');
    entry.style.color = color; entry.innerHTML = msg;
    log.appendChild(entry);
    log.scrollTop = log.scrollHeight;
}
function showFloatingText(el, text, color="white", size="1.2rem") {
    if(!el) return;
    let float = document.createElement('div');
    float.className = 'floating-text';
    float.style.color = color; float.style.fontSize = size; float.innerText = text;
    el.appendChild(float);
    setTimeout(() => float.remove(), 1000);
}
function createProjectile(sDOM, tDOM, imgUrl, className) {
    if (!sDOM || !tDOM) return;
    let proj = document.createElement('div');
    proj.className = className;
    if(imgUrl !== 'none' && imgUrl !== '') proj.style.backgroundImage = `url('${imgUrl}')`;
    
    let sRect = sDOM.getBoundingClientRect(); let tRect = tDOM.getBoundingClientRect();
    let dx = tRect.left - sRect.left; let dy = tRect.top - sRect.top;
    
    proj.style.left = sRect.left + (sRect.width/2) + 'px';
    proj.style.top = sRect.top + (sRect.height/2) + 'px';
    proj.style.setProperty('--dx', dx + 'px');
    proj.style.setProperty('--dy', dy + 'px');
    
    document.body.appendChild(proj);
    setTimeout(() => proj.remove(), 600);
}

// ✨ NEW: AI Visual Drag-and-Drop Animation!
async function animateAIPlacement(cardId, cardData, targetSlotId) {
    return new Promise(resolve => {
        let startDOM = document.getElementById('enemy-deck-stack') || document.body;
        let startRect = startDOM.getBoundingClientRect();
        let targetDOM = document.getElementById(targetSlotId);
        if (!targetDOM) { resolve(); return; }
        let targetRect = targetDOM.getBoundingClientRect();

        let flying = createCardDOM(cardId + '_fly', cardData, false); 
        flying.style.position = 'fixed';
        flying.style.left = (startRect.left || window.innerWidth / 2) + 'px';
        flying.style.top = (startRect.top || -100) + 'px';
        flying.style.transition = 'all 0.5s ease-out';
        flying.style.zIndex = '9999';
        flying.style.pointerEvents = 'none';
        document.body.appendChild(flying);

        // Force browser to register starting position before moving
        void flying.offsetWidth;

        // Fly the card to the slot
        flying.style.left = targetRect.left + 'px';
        flying.style.top = targetRect.top + 'px';
        flying.style.transform = 'scale(1.05)';

        setTimeout(() => {
            flying.remove();
            targetDOM.appendChild(createCardDOM(cardId, cardData, false));
            if (typeof playSound === 'function' && typeof dropSoundUrl !== 'undefined') playSound(dropSoundUrl);
            resolve();
        }, 500);
    });
}
