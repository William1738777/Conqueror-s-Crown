// ============================================================================
// ⚙️ GITHUB ASSET CONFIGURATION & TEMPLATES ⚙️
// ============================================================================
const ASSET_LINKS = {
    // -- System & UI --
    "Empty Slot": "./assets/Empty%20Slot.png",
    "Empty Ability Card": "./assets/Empty%20Ability%20Card.png",
    "Empty Buff Card": "./assets/Empty%20Buff%20Card.png",
    "CCLogo": "./assets/CCLogo.png",
    "MyMana": "./assets/MyMana.png",
    "ManaGain": "./assets/ManaGain.png",
    "MainMenuBG": "./assets/MainMenuBG.jpg",
    "Back_Card": "./assets/Conqueror%27s%20Crown%20Back_Card.png",
    
    // -- RPG Backgrounds & Icons --
    "WorldMap": "./assets/WorldMap.png",
    "LeoniaBG": "./assets/LeoniaBG.png",
    "TavernBG": "./assets/Tavern.png",
    "AtkIcon": "./assets/AtkIcon.png",
    "AlleyShopBG": "./assets/Alley Shop.png",
    "GladineShopBG": "./assets/Gladine Shop.png",

    // Training Grounds Dialog //
    "TG1": "./assets/TG1.png",
    "TG2": "./assets/TG2.png",
    "TG3": "./assets/TG3.png",
    "TG4": "./assets/TG4.png",
    "TG5": "./assets/TG5.png",
    "TG6": "./assets/TG6.png",
    "TG7": "./assets/TG7.png",
    "TG8": "./assets/TG8.png",
    "TG9": "./assets/TG9.png",

    // -- Audio & SFX --
    "DragSound": "./assets/DragSound.mp3",
    "DropSound": "./assets/DropSound.mp3",
    "AbilityActivated": "./assets/AbilityActivated.mp3",
    "BuffActivated": "./assets/BuffActivated.mp3",
    "ClickSFX": "./assets/ClickSFX.mp3",
    "MenuMusic": "./assets/MenuMusic.mp3",
    "DrawSFX": "./assets/DrawSFX.mp3",
    "PlaceSFX": "./assets/PlaceSFX.mp3",
    "BodyShot": "./assets/BodyShot.mp3",
    "ArrowHit": "./assets/ArrowHit.mp3",
    "HealSound": "./assets/Heal.mp3",
    "BloodSound": "./assets/BloodSound.mp3",
    "Beam": "./assets/Beam.mp3",
    "VillagerSuicideSFX": "./assets/VillagerSuicideSFX.mp3",
    "ShieldBlockSkel": "./assets/ShieldBlockSkel.mp3",
    "KinSanSound": "./assets/KinSanSound.mp3",
    "KinSFX1": "./assets/KinSFX1.mp3",
    "KinSFX2": "./assets/KinSFX2.mp3",
    "JadenSFX1": "./assets/JadenSFX1.mp3",
    "JadenSFX2": "./assets/JadenSFX2.mp3",
    "JadenSFX3": "./assets/JadenSFX3.mp3",
    "RolynSFX1": "./assets/RolynSFX1.mp3",
    "RolynSFX2": "./assets/RolynSFX2.mp3",
    "HealSFXVoice": "./assets/HealSFXVoice.mp3",
    "HealSFXVoice2": "./assets/HealSFXVoice2.mp3",
    "ShieldSFXVoice": "./assets/ShieldSFXVoice.mp3",
    "ShieldSFXVoice2": "./assets/ShieldSFXVoice2.mp3",
    "ShieldSFX": "./assets/ShieldSFX.mp3",
    
    // -- Visual FX & Icons --
    "Slash": "./assets/Slash.gif",
    "Arrow_FX": "./assets/Arrow_FX.png",
    "ShurikenKin_FX": "./assets/ShurikenKin_FX.png",
    "HealFX": "./assets/HealFX.gif",
    "JadenLock": "./assets/JadenLock.png",
    "JadenBullet": "./assets/JadenBullet.gif",
    "Taunted": "./assets/Taunted.png",
    "Barrier": "./assets/Barrier.png",
    "Bleed": "./assets/Bleed.png",
    "ShinobiMark": "./assets/Bleed.png", 
    
    // -- Cards --
    "Squire": "./assets/Squire.png",
    "Great Knight": "./assets/Great%20Knight.png",
    "Bannerman": "./assets/Bannerman.png",
    "Archer": "./assets/Archer.png",
    "Militia": "./assets/Militia.png",
    "Mana Core": "./assets/Mana%20Core.png",
    "One More Time": "./assets/One%20More%20Time.png",
    "Last Stand": "./assets/Last%20Stand.png",
    "Zeek": "./assets/Zeek.png",
    "KIN-RYU": "./assets/Kin-Ryu.png",
    "Shadow Stalker": "./assets/Shadow%20Stalker.png",
    "Lionel Guard Tower": "./assets/Lionel%20Guard%20Tower.png",
    "Rolyn": "./assets/King%20Rolyn.png",
    "Althea": "./assets/Althea.png",
    "Jaden": "./assets/Jaden.png",
    "Skeleton Warrior": "./assets/Skeleton%20Warrior.png",
    "Cursed Crow": "./assets/Cursed Crow.png",
    "Zombie": "./assets/Zombie.png"
};

function getCardTemplate(fileName, dataUrl) {
    let name = fileName.replace(/\.[^/.]+$/, ""); let cleanName = name.toLowerCase();

    // Backgrounds & UI Elements
    if(cleanName.includes('worldmap')) { document.documentElement.style.setProperty('--worldmap-url', `url("${dataUrl.replace(/"/g, '&quot;')}")`); return { isMapBG: true, img: dataUrl }; }
    if(cleanName.includes('leoniabg')) { document.documentElement.style.setProperty('--leoniabg-url', `url("${dataUrl.replace(/"/g, '&quot;')}")`); return { isMapBG: true, img: dataUrl }; }
    if(cleanName.includes('tavern') && cleanName.includes('bg')) { document.documentElement.style.setProperty('--tavernbg-url', `url("${dataUrl.replace(/"/g, '&quot;')}")`); return { isMapBG: true, img: dataUrl }; }
    if(cleanName.includes('alley shop') || cleanName.includes('alleyshopbg')) { document.documentElement.style.setProperty('--alleyshopbg-url', `url("${dataUrl.replace(/"/g, '&quot;')}")`); return { isMapBG: true, img: dataUrl }; }
    if(cleanName.includes('gladine shop') || cleanName.includes('gladineshopbg')) { document.documentElement.style.setProperty('--gladineshopbg-url', `url("${dataUrl.replace(/"/g, '&quot;')}")`); return { isMapBG: true, img: dataUrl }; }
    if(cleanName.match(/tg[1-9]/)) { return { isMapBG: true, img: dataUrl }; }
    
    if(cleanName.includes('empty slot')) { document.documentElement.style.setProperty('--empty-slot-url', `url("${dataUrl.replace(/"/g, '&quot;')}")`); return { isEmptySlot: true, img: dataUrl }; }
    if(cleanName.includes('empty ability')) { document.documentElement.style.setProperty('--empty-ability-url', `url("${dataUrl.replace(/"/g, '&quot;')}")`); return { isFX: true }; }
    if(cleanName.includes('empty buff')) { document.documentElement.style.setProperty('--empty-buff-url', `url("${dataUrl.replace(/"/g, '&quot;')}")`); return { isFX: true }; }
    if(cleanName.includes('mymana')) { document.documentElement.style.setProperty('--mymana-url', `url("${dataUrl.replace(/"/g, '&quot;')}")`); return { isFX: true }; }
    if(cleanName.includes('managain')) { document.documentElement.style.setProperty('--managain-url', `url("${dataUrl.replace(/"/g, '&quot;')}")`); return { isFX: true }; }
    if(cleanName.includes('cclogo')) { document.documentElement.style.setProperty('--cc-logo-url', `url("${dataUrl.replace(/"/g, '&quot;')}")`); return { isFX: true }; }
    
    // Audio & FX
    if(cleanName.includes('dragsound')) { dragSoundUrl = dataUrl; return { isAudio: true }; }
    if(cleanName.includes('dropsound')) { dropSoundUrl = dataUrl; return { isAudio: true }; }
    if(cleanName.includes('abilityactivated')) { abilityActivatedUrl = dataUrl; return { isAudio: true }; }
    if(cleanName.includes('buffactivated')) { buffActivatedUrl = dataUrl; return { isAudio: true }; }
    if(cleanName.includes('clicksfx')) { clickSfxUrl = dataUrl; return { isAudio: true }; }
    if(cleanName.includes('beam')) { beamAudioUrl = dataUrl; return { isAudio: true }; }
    if(cleanName.includes('drawsfx')) { drawSfxUrl = dataUrl; return { isAudio: true }; }
    if(cleanName.includes('placesfx')) { placeSfxUrl = dataUrl; return { isAudio: true }; }
    if(cleanName.includes('bodyshot')) { bodyShotAudioUrl = dataUrl; return { isAudio: true }; }
    if(cleanName.includes('arrowhit')) { arrowHitAudioUrl = dataUrl; return { isAudio: true }; }
    if(cleanName.includes('healsound') || cleanName.includes('heal.mp3')) { healAudioUrl = dataUrl; return { isAudio: true }; }
    if(cleanName.includes('bloodsound') || cleanName.includes('blood sound')) { bloodAudioUrl = dataUrl; return { isAudio: true }; }
    if(cleanName.includes('villagersuicidesfx')) { villagerSuicideSfxUrl = dataUrl; return { isAudio: true }; }
    if(cleanName.includes('shieldblockskel')) { shieldBlockAudioUrl = dataUrl; return { isAudio: true }; }
    if(cleanName.includes('kinsansound') || cleanName.includes('kin san sound')) { kinSanAudioUrl = dataUrl; return { isAudio: true }; }
    if(cleanName.includes('kinsfx1')) { kinSfx1Url = dataUrl; return { isAudio: true }; }
    if(cleanName.includes('kinsfx2')) { kinSfx2Url = dataUrl; return { isAudio: true }; }
    if(cleanName.includes('jadensfx1')) { jadenSfx1 = dataUrl; return { isAudio: true }; }
    if(cleanName.includes('jadensfx2')) { jadenSfx2 = dataUrl; return { isAudio: true }; }
    if(cleanName.includes('jadensfx3')) { jadenSfx3 = dataUrl; return { isAudio: true }; }
    if(cleanName.includes('rolynsfx1')) { rolynSfx1Url = dataUrl; return { isAudio: true }; }
    if(cleanName.includes('rolynsfx2')) { rolynSfx2Url = dataUrl; return { isAudio: true }; }
    if(cleanName.includes('healsfxvoice2')) { healSfxVoice2Url = dataUrl; return { isAudio: true }; }
    if(cleanName.includes('healsfxvoice') && !cleanName.includes('2')) { healSfxVoiceUrl = dataUrl; return { isAudio: true }; }
    if(cleanName.includes('shieldsfxvoice2')) { shieldSfxVoice2Url = dataUrl; return { isAudio: true }; }
    if(cleanName.includes('shieldsfxvoice') && !cleanName.includes('2')) { shieldSfxVoiceUrl = dataUrl; return { isAudio: true }; }
    if(cleanName.includes('shieldsfx') && !cleanName.includes('voice')) { shieldSfxUrl = dataUrl; return { isAudio: true }; }
    if(cleanName.includes('menumusic')) { menuMusicUrl = dataUrl; return { isAudio: true }; }

    if(cleanName.includes('back_card') || cleanName.includes('back card') || cleanName.includes('crown back')) { return { isCardBack: true, img: dataUrl }; }
    if(cleanName.includes('slash')) { return { isSlash: true, img: dataUrl }; }
    if(cleanName.includes('healfx')) { return { isHealFx: true, img: dataUrl }; }
    if(cleanName.includes('arrow_fx') || cleanName.includes('arrow fx')) { return { isArrow: true, img: dataUrl }; }
    if(cleanName.includes('shurikenkin_fx') || cleanName.includes('shuriken')) { return { isShuriken: true, img: dataUrl }; }
    if(cleanName.includes('jadenlock')) { jadenLockUrl = dataUrl; return { isFX: true }; }
    if(cleanName.includes('jadenbullet')) { jadenBulletUrl = dataUrl; return { isFX: true }; }
    if(cleanName.includes('mainmenubg')) { return { isMenuBG: true, img: dataUrl }; }
    if(cleanName.includes('taunted')) { return { isIcon: true, iconType: 'taunted', img: dataUrl }; }
    if(cleanName.includes('barrier')) { return { isIcon: true, iconType: 'barrier', img: dataUrl }; }
    if(cleanName.includes('bleed') && !cleanName.includes('mark')) { return { isIcon: true, iconType: 'bleed', img: dataUrl }; }
    if(cleanName.includes('shinobimark') || cleanName.includes('mark')) { return { isIcon: true, iconType: 'shinobimark', img: dataUrl }; }
    if(cleanName.includes('atkicon')) { document.documentElement.style.setProperty('--atkicon-url', `url("${dataUrl.replace(/"/g, '&quot;')}")`); return { isIcon: true, iconType: 'atkbuff', img: dataUrl }; }

    let type = 'unit';
    if (cleanName.includes('ability') || cleanName.includes('skill') || cleanName.includes('spell') || cleanName.includes('magic') || cleanName.includes('mana core') || cleanName.includes('one more time') || cleanName.includes('last stand')) type = 'ability';

    // --- LEONIA ROSTER EXPANSION ---
    if (cleanName.includes('squire')) {
        return {
            isPlayable: true, type: 'unit', name: "Leonian Squire", title: "Trainee Attendant (Level 1)", powerLevel: 1, summonCost: 1, faction: "Leonia", race: "Human", hp: 450, maxHp: 450, atk: 100, img: dataUrl, marks: 0, queued: false, extraAction: false, blockActive: false, isRevealed: false, ambushTurns: 0, atkBuffTurns: 0,
            skills: [ { name: "SHORTSWORD STRIKE", manaCost: 0, desc: "Deals 80-120 physical damage to a frontline enemy." } ], 
            passives: [ { name: "TRAINED DODGES", desc: "This unit has a 40% chance to dodge any incoming attack." } ]
        };
    }
    else if (cleanName.includes('great knight')) {
        return {
            isPlayable: true, type: 'unit', name: "Great Knight", title: "Level 4", powerLevel: 4, summonCost: 3, summonRequires: { type: 'squiresFallen', amount: 1 }, faction: "Leonia", race: "Human", hp: 950, maxHp: 950, atk: 200, img: dataUrl, marks: 0, queued: false, extraAction: false, blockActive: false, isRevealed: false, ambushTurns: 0, atkBuffTurns: 0,
            skills: [ { name: "HEAVY STRIKE", manaCost: 0, desc: "Deals 150-250 physical damage to a frontline enemy." }, { name: "VALIANT GUARD", manaCost: 2, desc: "Heals for 200 HP, gains a 250 HP shield, and Taunts all enemies in the frontline for 1 turn." } ], 
            passives: [ { name: "HEAVY PLATE", desc: "Reduces all incoming physical damage by a flat 40 points, calculated before any shields are depleted." } ]
        };
    }
    else if (cleanName.includes('bannerman')) {
        return {
            isPlayable: true, type: 'unit', name: "Leonian Bannerman", title: "Level 3", powerLevel: 3, summonCost: 2, faction: "Leonia", race: "Human", hp: 650, maxHp: 650, atk: 50, img: dataUrl, marks: 0, queued: false, extraAction: false, blockActive: false, isRevealed: false, ambushTurns: 0, atkBuffTurns: 0,
            skills: [ { name: "BANNER STRIKE", manaCost: 1, desc: "Deals 50 damage to a single target enemy." }, { name: "RALLY", manaCost: 2, desc: "Grants all allied cards a 100-point shield and an 8% attack buff for 2 turns." } ], 
            passives: [ { name: "LEONIAN DEVOTION", desc: "Heals all allied cards for a random amount between 20-80 HP every turn this card is on the field." } ]
        };
    }
    else if (cleanName.includes('archer')) {
        return {
            isPlayable: true, type: 'unit', name: "Archer", title: "Level 1", powerLevel: 1, summonCost: 1, faction: "Leonia", race: "Human", hp: 500, maxHp: 500, atk: 120, img: dataUrl, marks: 0, queued: false, extraAction: false, blockActive: false, isRevealed: false, ambushTurns: 0, atkBuffTurns: 0,
            skills: [ { name: "VOLLEY", manaCost: 1, desc: "Inflicts damage to a single target rolling from 80-150." } ], 
            passives: [ { name: "FOCUS FIRE", desc: "If this unit attacks the same target as an allied unit in the same turn, it deals an additional 40 flat damage." } ]
        };
    }
    // --- EXISTING CARDS ---
    else if (cleanName.includes('zeek')) {
        return {
            isPlayable: true, type: 'unit', name: "Zeek", title: "Captain of the Rangers (Level 5)", powerLevel: 5, summonCost: 4, faction: "Westlands", race: "Human", hp: 800, maxHp: 800, atk: 300, img: dataUrl, marks: 0, queued: false, extraAction: false, blockActive: false, isRevealed: false, ambushTurns: 0, atkBuffTurns: 0,
            skills: [
                { name: "Bullseye", manaCost: 0, desc: "Shoots an arrow rolling 200-400 damage. (600-1000 in Ambush)" },
                { name: "Arrow Rain", manaCost: 3, desc: "Hits entire Enemy Frontline or Backline for 50-80 damage. (90-180 in Ambush)" },
                { name: "Ambush", manaCost: 5, desc: "Rolls 800-1500 damage. If target dies, enters Ambush Stance for 2 turns." }
            ],
            passives: [ { name: "Ambush Stance", desc: "Becomes untargettable. Buffs Bullseye and Arrow Rain." } ]
        };
    }
    else if(cleanName.includes('kin-ryu') || cleanName.includes('kin ryu')) {
        return { 
            isPlayable: true, type: 'unit', name: "KIN-RYU", title: "YAMI NO SHINOBI (Level 7)", powerLevel: 7, summonCost: 8, summonRequires: { type: 'arashiSouls', amount: 4 }, faction: "Arashi", race: "Human", hp: 1200, maxHp: 1200, atk: 400, img: dataUrl, marks: 0, queued: false, extraAction: false, blockActive: false, isRevealed: false, atkBuffTurns: 0,
            skills: [ { name: "ICHI", manaCost: 1, desc: "Cuts target. 300-1100 DMG. If <500, rerolls." }, { name: "NI", manaCost: 2, desc: "Hits 2 targets for 300-400 damage each." } ], 
            passives: [ { name: "SHADOW STANCE", desc: "Shinobi Marks (Max 3) grant Arashi Faction units +6/12/18% DMG against the target." }, { name: "SAN", desc: "Auto-chains shurikens upon killing a target afflicted with Shinobi Mark." } ] 
        };
    }
    else if(cleanName.includes('shadow stalker')) {
        return { 
            isPlayable: true, type: 'unit', name: "Shadow Stalker", title: "Level 3", powerLevel: 3, summonCost: 3, faction: "Arashi", race: "Human", hp: 800, maxHp: 800, atk: 200, img: dataUrl, marks: 0, queued: false, extraAction: false, blockActive: false, isRevealed: false, atkBuffTurns: 0,
            skills: [ { name: "SHADOW STAR", manaCost: 0, desc: "Throws a Shuriken inflicting 150 damage." }, { name: "BLADE STRIKE", manaCost: 1, desc: "Lunges forward to inflict 225 damage." } ], 
            passives: [ { name: "SHADOW SYNC", desc: "Mimics other stalkers." }, { name: "ASSASSIN'S MARK", desc: "Attacks have a 40% chance to apply Shinobi Mark." } ] 
        };
    }
    else if(cleanName.includes('skeleton warrior')) {
        return { 
            isPlayable: true, type: 'unit', name: "Skeleton Warrior", title: "Wandering Swordsman", powerLevel: 1, summonCost: 1, faction: "Council of Darkness", race: "Undead", hp: 500, maxHp: 500, atk: 100, img: dataUrl, marks: 0, queued: false, extraAction: false, blockActive: false, isRevealed: false, atkBuffTurns: 0,
            skills: [ { name: "SLASH", manaCost: 0, desc: "Inflicts damage rolling from 50-150." }, { name: "BLOCK", manaCost: 0, desc: "Blocks the first attack cast on this unit during the enemy turn." } ], 
            passives: [ { name: "UNDEAD PRESENCE", desc: "Every time this unit is alive on the field, it generates 1 energy for the user." } ] 
        };
    }
    else if(cleanName.includes('cursed crow')) {
        return { 
            isPlayable: true, type: 'unit', name: "Cursed Crow", title: "Level 2", powerLevel: 2, summonCost: 2, faction: "Council of Darkness", race: "Undead", hp: 300, maxHp: 300, atk: 100, img: dataUrl, marks: 0, queued: false, extraAction: false, blockActive: false, bleedStacks: 0, bleedTurns: 0, isRevealed: false, atkBuffTurns: 0,
            skills: [ { name: "Peck", manaCost: 0, desc: "Inflicts damage rolling from 1-100. (+1 Bleed Stack)" } ], 
            passives: [ { name: "Eye of the Crow", desc: "Exposes enemy backline units to attacks." } ] 
        };
    }
    else if(cleanName.includes('lionel guard') || cleanName.includes('guard tower')) {
        return { 
            isPlayable: true, type: 'unit', name: "Lionel Guard Tower", title: "Structure", powerLevel: 5, summonCost: 6, faction: "Leonia", race: "Structure", hp: 2000, maxHp: 2000, atk: 0, img: dataUrl, marks: 0, queued: false, extraAction: false, blockActive: false, isRevealed: false, atkBuffTurns: 0,
            skills: [], passives: [ { name: "Guard Tower", desc: "Retaliates on allied attack (200 DMG)." }, { name: "Attack Tower", desc: "Assists allied attacks (100 DMG)." }, { name: "Structure Info", desc: "Passive rely." } ] 
        };
    }
    else if(cleanName.includes('rolyn')) {
        return { 
            isPlayable: true, type: 'unit', name: "Rolyn", title: "King of Leonia", powerLevel: 7, summonCost: 8, faction: "Leonia", race: "Human", hp: 3000, maxHp: 3000, atk: 300, img: dataUrl, marks: 0, queued: false, extraAction: false, blockActive: false, isRevealed: false, atkBuffTurns: 0,
            skills: [ { name: "Lion's Challenge", manaCost: 2, desc: "Slash the target enemy card to taunt them for 1 turn. Deals 250 damage." }, { name: "Lion's Roar", manaCost: 4, desc: "Target up to 3 enemy units and taunt them for 2 turns." } ], 
            passives: [ { name: "Dauntless", desc: "Counterattack taunted units (300-500 DMG). Heals for 50% of damage dealt." } ] 
        };
    }
    else if(cleanName.includes('althea')) {
        return { 
            isPlayable: true, type: 'unit', name: "Althea", title: "Guardian Deity (Level 5)", powerLevel: 5, summonCost: 5, faction: "Neutral", race: "Deity", hp: 1000, maxHp: 1000, atk: 200, img: dataUrl, marks: 0, queued: false, extraAction: false, blockActive: false, blessings: 0, isRevealed: false, atkBuffTurns: 0,
            skills: [ { name: "Blessing of the Light", manaCost: 1, desc: "Heal target ally for 150-300. Gains +1 Blessing." }, { name: "Shield of Hope", manaCost: 3, desc: "Shields frontline allies for 500 DMG (2 turns). +1 Blessing per ally." }, { name: "Punishment of the Blessed", manaCost: 0, desc: "Fires a beam in a line. 800-1800 DMG front, 500-1000 DMG back. Needs 7 Blessings.", requiresBlessings: 7 } ], 
            passives: [] 
        };
    }
    else if(cleanName.includes('jaden')) {
        return { 
            isPlayable: true, type: 'unit', name: "Jaden", title: "The Crown’s Enforcer", powerLevel: 6, summonCost: 6, faction: "Leonia", race: "Human", hp: 1000, maxHp: 1000, atk: 250, img: dataUrl, marks: 0, queued: false, extraAction: false, blockActive: false, chamberedRounds: 0, isRevealed: false, atkBuffTurns: 0,
            skills: [ { name: "Sniping Shot", manaCost: 2, desc: "Deals 500-800 DMG. Bypasses frontlines. (+1 Chambered Round)" }, { name: "Double-Shot", manaCost: 2, desc: "Shoots twice (300-500 DMG per shot). (+2 Chambered Rounds)" }, { name: "Trigger Unbound", manaCost: 4, desc: "Consumes all Rounds. Flurry of 150-300 DMG per round. Excess DMG hits backline." } ], 
            passives: [ { name: "Extra Shot", desc: "60% chance for an extra shot (+1 Round) on skill 1 or 2." } ] 
        };
    }
    else if(cleanName.includes('zombie')) {
        return { 
            isPlayable: true, type: 'unit', name: "Zombie", title: "Level 2", powerLevel: 2, summonCost: 2, faction: "Council of Darkness", race: "Undead", hp: 700, maxHp: 700, atk: 150, img: dataUrl, marks: 0, queued: false, extraAction: false, blockActive: false, bleedStacks: 0, bleedTurns: 0, isRevealed: false, atkBuffTurns: 0,
            skills: [ { name: "Bite", manaCost: 0, desc: "Inflicts damage rolling from 100-200. (+1 Bleed Stack)" } ], 
            passives: [ { name: "Vigor of the Damned", desc: "If survives with <=100 HP, heals 20% of Max HP and gains 100 shield." } ] 
        };
    }
    else if(cleanName.includes('militia') || cleanName.includes('milita')) {
        return { 
            isPlayable: true, type: 'unit', name: "Militia", title: "Level 1", powerLevel: 1, summonCost: 1, faction: "Neutral", race: "Human", hp: 600, maxHp: 600, atk: 150, img: dataUrl, marks: 0, queued: false, extraAction: false, blockActive: false, isRevealed: false, atkBuffTurns: 0,
            skills: [ { name: "Uncoordinated attack", manaCost: 0, desc: "Attacks inflicting 100-200 damage roll." }, { name: "Suicidal attack", manaCost: 2, desc: "Rolls 1-700 DMG. User dies. Grants 4 mana if target dies." } ], passives: [] 
        };
    }
    else if(cleanName.includes('one more time')) {
        return { 
            isPlayable: true, type: 'ability', name: "One More Time", title: "Ability Card", powerLevel: 0, summonCost: 0, faction: "NA", race: "N/A", hp: 1, maxHp: 1, atk: 0, img: dataUrl, marks: 0, queued: false, isRevealed: false,
            skills: [ { name: "Double Action", manaCost: 0, desc: "Target allied unit can act twice this turn." } ], passives: [ { name: "Consumable", desc: "Destroyed after execution." } ] 
        };
    }
    else if(cleanName.includes('mana core')) {
        return { 
            isPlayable: true, type: 'ability', name: "Mana Core", title: "Ability Card", powerLevel: 0, summonCost: 0, faction: "NA", race: "N/A", hp: 1, maxHp: 1, atk: 0, img: dataUrl, marks: 0, queued: false, isRevealed: false,
            skills: [ { name: "Mana Initiation", manaCost: 0, desc: "Grants user +3 Mana when activated." } ], passives: [ { name: "Auto-Discard", desc: "Discards after use." } ] 
        };
    }
    else if(cleanName.includes('last stand')) {
        return { 
            isPlayable: true, type: 'ability', isBuff: true, name: "Last Stand", title: "Buff Card", powerLevel: 0, summonCost: 2, faction: "Neutral", race: "N/A", hp: 1, maxHp: 1, atk: 0, img: dataUrl, marks: 0, queued: false, buffTurnsRemaining: 0, isRevealed: false,
            skills: [], passives: [ { name: "Last Stand", desc: "Click [ACTIVATE BUFF] next turn. All allied units survive fatal damage at 1 HP for 2 turns." } ] 
        };
    }
    else {
        let defaultHp = type === 'ability' ? 1 : 500;
        return { 
            isPlayable: true, type: type, name: name, title: type === 'ability' ? "Spell Card" : "Basic Unit", powerLevel: type==='ability'? 0 : 1, summonCost: 1, faction: "Unknown", race: "Unknown", hp: defaultHp, maxHp: defaultHp, atk: type==='ability'? 0 : 150, img: dataUrl, marks: 0, queued: false, extraAction: false, blockActive: false, isRevealed: false, atkBuffTurns: 0,
            skills: type === 'ability' ? [ { name: "CAST SPELL", manaCost: 1, desc: "Activate ability effect." } ] : [ { name: "ATTACK", manaCost: 1, desc: "Basic attack for 100 damage." } ], passives: [] 
        };
    }
}
