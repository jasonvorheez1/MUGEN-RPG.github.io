import React, { useState, useEffect, useMemo, useRef } from "react";
import { Sparkles, ShoppingBag, Star, Gem, Database, Plus, ChevronLeft, Zap } from "lucide-react";
import { BattleUnit, executeCombatSkill, TacticalStanceRow, getBattleStats, applyStatusTick, resolveBasicAttack, getCastAnimMs, getLungeMs, getBasicAttackMs, HITSTOP_BUFFER_MS, ProjectileLayer } from "../CombatSystem.js";
import { ELEMENTS, BOSS_ROSTER, EQUIPMENT } from "../constants.js";
import { calculateStat, playSound, calculateSubStat, getEnemyStatsFromCP, applyLeaderBonus, applyMitigation, incrementCourierFieldBattles, getGaugeGain, rollEnemyGear, getActiveEvents, getGimmick, makeGearInstanceId } from "../utils.js";
import { CampaignIntro } from "./ViewShared.js";

// EVENTS -- full rewrite. Multiple events run CONCURRENTLY (see
// getActiveEvents in utils.js: a daily spotlight, a weekly crisis, and a
// weekend-only surge, each locked to its own franchise + a differentiator
// "gimmick" mechanic for that cycle). Each event is now a real Campaign-style
// sequential 6-stage mini-chapter -- stages unlock by clearing the previous
// one, not just an account-level gate -- and the same getActiveEvents() call
// is what GachaView reads to add rate-up banners, so "events affect the
// gacha" falls out of one shared source of truth instead of separate state.

const MILESTONE_TIERS = [
  { at: 5000, reward: { credits: 3e6 }, label: "5,000 TOKENS EARNED" },
  { at: 15000, reward: { gems: 200 }, label: "15,000 TOKENS EARNED" },
  { at: 35000, reward: { materials: 6e4, essence: 1500 }, label: "35,000 TOKENS EARNED" },
  { at: 75000, reward: { gems: 500, items: ["multiverse_core"] }, label: "75,000 TOKENS EARNED" },
  { at: 150000, reward: { gems: 900, items: ["xp_grand_tome"] }, label: "150,000 TOKENS EARNED" },
  { at: 300000, reward: { gems: 1800, materials: 2e5, essence: 5000, items: ["bond_eternal_crystal"] }, label: "300,000 TOKENS EARNED" }
];
const loadLedger = () => {
  try {
    return {
      progress: parseInt(localStorage.getItem("mugen_event_ledger_progress") || "0", 10) || 0,
      claimed: JSON.parse(localStorage.getItem("mugen_event_ledger_claimed") || "[]")
    };
  } catch (e) { return { progress: 0, claimed: [] }; }
};
const loadProgressMap = () => {
  try { return JSON.parse(localStorage.getItem("mugen_event_progress") || "{}"); } catch (e) { return {}; }
};
const EVENT_GEAR_POOL = ["rift_shard_blade", "rift_woven_plate", "rift_bound_charm"];
const STAGE_COUNT = 6;

const EventsView = ({
  onWorldTimeStop,
  characters = [],
  unlockedIds = [],
  squadIds = [],
  setSquadIds,
  setShowSquadBuilder,
  credits,
  setCredits,
  gems,
  setGems,
  aura,
  setAura,
  stamina,
  setStamina,
  createFloatingText,
  triggerVisualEffect: triggerVisualEffect2,
  setBattleMusicActive,
  setIsVictoryMusic,
  setIsHardBattle,
  skills,
  materials,
  setMaterials,
  essence,
  setEssence,
  addToInventory,
  auraUpgrades = {},
  eventTokens = 0,
  setEventTokens,
  setUnlockedIds,
  totalAccountLevel = 1,
  setCharacters,
  eventPurchases = {},
  setEventPurchases,
  setEventTheme = () => {},
  gearInventory = [],
  setGearInventory
}) => {
  const h = React.createElement;
  const liveEvents = useMemo(() => getActiveEvents(characters), [characters]);
  const [progressMap, setProgressMap] = useState(loadProgressMap);
  const bumpProgress = (uid, stageId) => {
    setProgressMap((prev) => {
      const next = { ...prev, [uid]: Math.max(prev[uid] || 0, stageId) };
      localStorage.setItem("mugen_event_progress", JSON.stringify(next));
      return next;
    });
  };
  const [activeEventUid, setActiveEventUid] = useState(null);
  const [viewMode, setViewMode] = useState("list");
  const [ledger, setLedger] = useState(loadLedger);
  const claimLedgerTier = (tier) => {
    if (ledger.progress < tier.at || ledger.claimed.includes(tier.at)) return;
    const r = tier.reward;
    if (r.credits) setCredits((c) => c + r.credits);
    if (r.gems) setGems((g) => g + r.gems);
    if (r.materials) {
      setMaterials((s) => s + r.materials);
      const cur = parseInt(localStorage.getItem("mugen_materials") || "0", 10);
      localStorage.setItem("mugen_materials", String(cur + r.materials));
    }
    if (r.essence) {
      setEssence((e) => e + r.essence);
      const curE = parseInt(localStorage.getItem("mugen_essence") || "0", 10);
      localStorage.setItem("mugen_essence", String(curE + r.essence));
    }
    if (Array.isArray(r.items)) r.items.forEach((it) => addToInventory(it));
    setLedger((prev) => {
      const next = { ...prev, claimed: [...prev.claimed, tier.at] };
      localStorage.setItem("mugen_event_ledger_claimed", JSON.stringify(next.claimed));
      return next;
    });
    createFloatingText(`LEDGER TIER CLAIMED: ${tier.label}`, false, "#facc15");
    playSound("jackpot");
  };
  const [battleState, setBattleState] = useState("IDLE");
  const [activeStage, setActiveStage] = useState(null);
  const [pendingStage, setPendingStage] = useState(null);
  const [combatants, setCombatants] = useState([]);
  const timeStopHandledRef = useRef({});
  const stormTickRef = useRef(0);
  // Cinematic hold -- see CampaignView's identical ref. Freezes the whole
  // simulation for exactly as long as the current cast's animation plays, so
  // nothing else can act (or even fill gauge) mid-ability.
  const hitStopUntil = useRef(0);
  const battleSceneRef = useRef(null);
  const [playerElement, setPlayerElement] = useState("FIRE");
  const [autoBattle, setAutoBattle] = useState(true);
  const [combatSpeed, setCombatSpeed] = useState(1.5);
  const [floatingDamages, setFloatingDamages] = useState([]);

  const extractFranchise = (c) => c ? String(c.franchise || "Unknown").trim() : "Unknown";

  // Campaign-style sequential stages for one event -- CP ramps steeply across
  // 6 stages, the last is always a real named boss and (first clear only)
  // drops an event-exclusive gear piece.
  const generateEventStages = (evt) => {
    const baseCP = 3e8 * (evt.bonus ? 1.3 : 1);
    return Array.from({ length: STAGE_COUNT }).map((_, i) => {
      const id = i + 1;
      const isBoss = id === STAGE_COUNT;
      const cpMult = Math.pow(1.85, i);
      return {
        id,
        eventUid: evt.uid,
        franchise: evt.franchise,
        gimmick: evt.gimmick,
        theme: evt.theme,
        color: evt.color,
        isBoss,
        name: isBoss ? `${evt.franchise} — Finale` : `${evt.franchise} — Stage ${id}`,
        cp: Math.floor(baseCP * cpMult),
        stamina: 20 + id * 12,
        rewards: {
          tokens: Math.floor(700 * cpMult),
          credits: Math.floor(35e4 * cpMult),
          essence: Math.floor(70 * cpMult),
          gems: isBoss ? 300 : id % 2 === 0 ? 60 : 0,
          grantsEventGear: isBoss
        }
      };
    });
  };

  const purchaseEventItem = (item) => {
    const buyCount = eventPurchases[item.id] || 0;
    const currentCost = Math.floor(item.cost * Math.pow(1.65, buyCount));
    if (eventTokens < currentCost) { createFloatingText(`Need ${currentCost} Tokens`, true); return; }
    setEventTokens((t) => t - currentCost);
    setEventPurchases((prev) => ({ ...prev, [item.id]: (prev[item.id] || 0) + 1 }));
    if (["multiverse_core", "xp_grand_tome", "bond_eternal_crystal", "void_capsule"].includes(item.id)) {
      addToInventory(item.id, item.amount || 1);
      createFloatingText(`Acquired ${item.name}!`, false, "#facc15");
    } else if (item.type === "hero") {
      const isNew = !unlockedIds.includes(item.id);
      if (isNew) {
        setUnlockedIds((prev) => Array.from(new Set([...prev, item.id])));
        createFloatingText(`Recruited ${item.name}!`, false, "#4ade80");
      } else {
        createFloatingText(`Duplicate ${item.name}: +Stat Bonus`, false, "#facc15");
      }
      if (typeof setCharacters === "function") {
        setCharacters((prev) => prev.map((c) => String(c.export_id) === String(item.id)
          ? { ...c, pulls: (c.pulls || 0) + 1, duplicateStatBonus: (c.duplicateStatBonus || 0) + (isNew ? 0 : 5e-3) }
          : c));
      }
    } else if (item.type === "resource") {
      if (item.id.startsWith("gems")) setGems((g) => g + item.amount);
      else if (item.id.startsWith("credits")) setCredits((c) => c + item.amount);
      else if (item.id === "essence") setEssence((e) => e + item.amount);
      createFloatingText(`Obtained ${item.name}`, false, "#4ade80");
    }
    playSound("purchase");
  };
  const getShopItems = () => {
    const items = [];
    const getHeroTokenCost = (tier) => {
      const t = (tier || "C").trim().toUpperCase();
      if (t === "SS") return 25e3;
      if (t === "S+") return 15e3;
      if (t === "S") return 1e4;
      return 5e3;
    };
    // Every live event stocks the exchange: heroes from the daily spotlight AND
    // the weekly crisis AND the surge rift are all purchasable while their
    // event runs, tagged with the event that brought them.
    const seen = new Set();
    liveEvents.forEach((ev) => {
      characters.filter((c) => extractFranchise(c) === ev.franchise).slice(0, 8).forEach((hero) => {
        if (seen.has(String(hero.export_id))) return;
        seen.add(String(hero.export_id));
        items.push({ type: "hero", id: hero.export_id, name: hero.name, cost: getHeroTokenCost(hero.tier), img: hero.imageUrl, rarity: hero.tier, eventLabel: ev.label, eventColor: ev.color });
      });
    });
    items.push({ type: "resource", id: "multiverse_core", name: "Multiverse Core", cost: 1e5, amount: 1, img: "item_multiverse_core.png" });
    items.push({ type: "resource", id: "xp_grand_tome", name: "Grand Archive", cost: 5e4, amount: 1, img: "item_grand_archive.png" });
    items.push({ type: "resource", id: "bond_eternal_crystal", name: "Eternal Unity Spark", cost: 15e4, amount: 1, img: "item_eternal_spark.png" });
    items.push({ type: "resource", id: "void_capsule", name: "Void Stamina Cap", cost: 75e3, amount: 1, img: "item_void_capsule.png" });
    items.push({ type: "resource", id: "gems", name: "5000 Gems", cost: 25e3, amount: 5e3, icon: h(Gem, { size: 20 }) });
    items.push({ type: "resource", id: "credits", name: "50M Credits", cost: 1e4, amount: 5e7, icon: h(Database, { size: 20 }) });
    items.push({ type: "resource", id: "essence", name: "2500 Essence", cost: 15e3, amount: 2500, icon: h(Star, { size: 20 }) });
    return items;
  };

  const changePlayerElement = (el) => {
    setPlayerElement(el);
    const stanceSounds = { FIRE: "stance_fire", WATER: "stance_water", WIND: "stance_wind", LIGHT: "stance_light", DARK: "stance_dark", EARTH: "stance_earth" };
    playSound(stanceSounds[el] || "shield_up", 0.5);
    setCombatants((prev) => prev.map((u) => {
      u.effects = (u.effects || []).filter((e) => e.type !== "tactical_stance");
      if (!u.isEnemy) {
        const val = u.element === el ? 0.25 : 0.12;
        u.effects.push({ type: "tactical_stance", duration: 9999, val, label: `STANCE:${el}` });
      }
      return u;
    }));
  };

  const claimVictory = () => {
    if (!activeStage) {
      createFloatingText("No active stage to claim.", true);
      setBattleState("IDLE"); setActiveStage(null); setCombatants([]);
      setBattleMusicActive?.(false); setIsVictoryMusic?.(false); setEventTheme(null);
      return;
    }
    incrementCourierFieldBattles(setCharacters, combatants);
    bumpProgress(activeStage.eventUid, activeStage.id);
    const r = activeStage.rewards || {};
    const luckRoll = Math.random();
    const isGreatSuccess = luckRoll < 0.15;
    const rewardMult = (activeStage.isBoss ? 2 : 1) * (isGreatSuccess ? 3 : 1);
    if (isGreatSuccess) { playSound("jackpot"); createFloatingText("CRITICAL MISSION SUCCESS! x3 REWARDS", false, "#facc15"); }
    if (r.credits) setCredits((c) => c + Math.floor(r.credits * rewardMult));
    if (r.gems) setGems((g) => g + Math.floor(r.gems * rewardMult));
    if (r.essence) {
      const addE = Math.floor(r.essence * rewardMult);
      setEssence((e) => e + addE);
      const curE = parseInt(localStorage.getItem("mugen_essence") || "0", 10);
      localStorage.setItem("mugen_essence", String(curE + addE));
    }
    if (r.tokens) {
      const earned = Math.floor(r.tokens * rewardMult);
      setEventTokens((t) => t + earned);
      setLedger((prev) => {
        const nextProgress = prev.progress + earned;
        localStorage.setItem("mugen_event_ledger_progress", String(nextProgress));
        return { ...prev, progress: nextProgress };
      });
    }
    // Event-exclusive gear: guaranteed on the FIRST-ever clear of a finale
    // stage, straight into the shared gear inventory unequipped (same model
    // as gacha pulls -- go equip it from whichever hero's GEAR tab).
    if (r.grantsEventGear && (progressMap[activeStage.eventUid] || 0) < activeStage.id && typeof setGearInventory === "function") {
      const itemId = EVENT_GEAR_POOL[Math.abs(activeStage.eventUid.length + activeStage.id) % EVENT_GEAR_POOL.length];
      let slot = "weapon";
      for (const s of ["weapon", "armor", "trinket"]) { if ((EQUIPMENT[s] || []).some((it) => it.id === itemId)) { slot = s; break; } }
      const item = (EQUIPMENT[slot] || []).find((it) => it.id === itemId);
      setGearInventory((prev) => [...prev, { instanceId: makeGearInstanceId(), slot, itemId, level: 1 }]);
      createFloatingText(`EVENT REWARD: ${item?.name || itemId}!`, false, "#4ade80");
      playSound("gacha_epic");
    }
    createFloatingText("EVENT DATA RETRIEVED", false, "#4ade80");
    playSound("victory");
    setBattleState("IDLE"); setActiveStage(null); setCombatants([]);
    setBattleMusicActive?.(false); setIsVictoryMusic?.(false); setEventTheme(null);
  };

  const startBattle = (stage) => {
    if (stamina < stage.stamina) { createFloatingText(`Need ${stage.stamina} Stamina!`, true); return; }
    if (squadIds.length === 0) { createFloatingText("Squad is empty!", true); setShowSquadBuilder(true); return; }
    setStamina((s) => s - stage.stamina);
    setActiveStage(stage);
    setPendingStage(null);
    setBattleState("INTRO");
    playSound("boss_intro");
    setEventTheme(stage.theme || null);
    setBattleMusicActive?.(true);
    setIsHardBattle?.(stage.isBoss || stage.id >= 4);
    setFloatingDamages([]);
    stormTickRef.current = 0;
    const gimmick = stage.gimmick;
    const isGlassCannon = gimmick === "glass_cannon";
    const squad = characters.filter((c) => squadIds.map(String).includes(String(c.export_id)));
    const allies = squad.map((c, i) => {
      const maxHp = calculateStat(c.baseStats.hp, c.level, c, characters, "hp") * (isGlassCannon ? 0.7 : 1);
      return {
        id: `ally-${i}`,
        name: c.name,
        img: c.imageUrl,
        maxHp, hp: maxHp,
        atk: calculateStat(c.baseStats.atk, c.level, c, characters, "atk") * (isGlassCannon ? 1.5 : 1),
        magicAtk: calculateStat(c.baseStats["magic atk"], c.level, c, characters, "magic atk") * (isGlassCannon ? 1.5 : 1),
        def: calculateStat(c.baseStats.def, c.level, c, characters, "def"),
        magicDef: calculateStat(c.baseStats["magic def"], c.level, c, characters, "magic def"),
        speed: calculateStat(c.baseStats.speed, c.level, c, characters, "speed"),
        element: c.element,
        franchise: c.franchise,
        level: c.level,
        skillId: c.skillId,
        skillId2: c.skillId2,
        abilityLevel: c.abilityLevels?.[c.skillId] || 1,
        abilityAwaken: c.abilityAwaken?.[c.skillId] || 0,
        abilityAwaken2: c.skillId2 ? c.abilityAwaken?.[c.skillId2] || 0 : 0,
        maxSkillCd: skills.find((s) => s.id === c.skillId)?.cooldown || 100,
        skillCd: 0,
        isEnemy: false,
        special: c.special,
        equipSlots: c.equipSlots,
        gauge: Math.random() * 30,
        burst: 0,
        effects: gimmick === "regen_field" ? [{ type: "regen", duration: 9999, val: 0.02, label: "REGEN FIELD" }] : [],
        dead: false,
        critRate: calculateSubStat(c, characters, "crit_rate", skills, auraUpgrades) / 100,
        evasion: calculateSubStat(c, characters, "evasion", skills, auraUpgrades) / 100
      };
    });
    const leaderChar = squadIds[0] ? characters.find((c) => String(c.export_id) === String(squadIds[0])) : null;
    allies.forEach((a) => applyLeaderBonus(leaderChar, a, squad));
    const na = Math.max(1, allies.length);
    const avgAlly = {
      hp: allies.reduce((s, a) => s + a.maxHp, 0) / na,
      atk: allies.reduce((s, a) => s + a.atk, 0) / na,
      def: allies.reduce((s, a) => s + a.def, 0) / na,
      speed: allies.reduce((s, a) => s + a.speed, 0) / na
    };
    const DIFF_MULTS = { 1: { hp: 2, atk: 0.75, def: 0.65 }, 2: { hp: 3, atk: 0.95, def: 0.85 }, 3: { hp: 4.5, atk: 1.2, def: 1.05 }, 4: { hp: 7, atk: 1.6, def: 1.4 }, 5: { hp: 10, atk: 2, def: 1.8 }, 6: { hp: 16, atk: 2.6, def: 2.3 } };
    const dm = DIFF_MULTS[stage.id] || DIFF_MULTS[1];
    const enemyPool = characters.filter((c) => extractFranchise(c) === stage.franchise);
    const bossGauntlet = gimmick === "boss_gauntlet";
    const duoBossStage = stage.isBoss;
    const enemyCount = stage.isBoss ? (duoBossStage ? 2 : 1) : bossGauntlet ? 3 : 4;
    const primaryBoss = BOSS_ROSTER[Math.abs(stage.id * 7 + stage.franchise.length) % BOSS_ROSTER.length];
    const secondaryBoss = duoBossStage ? (BOSS_ROSTER.find((b) => b.name === primaryBoss.duoPartner) || primaryBoss) : null;
    const findBossSig = (name) => (skills || []).find((s) => s.signature && s.owner === name);
    // The finale is fought against the event franchise's OWN champions — its
    // strongest characters (signature owners first), armed with their real
    // signature moves — so each event's climax actually feels like that series.
    // Generic BOSS_ROSTER monsters are only a fallback for empty franchises.
    const tierRank = (t) => { const i = ["SS", "S+", "S", "S-", "A+", "A", "A-", "B+", "B", "C+", "C"].indexOf((t || "C").trim().toUpperCase()); return i === -1 ? 99 : i; };
    const sigOwners = new Set((skills || []).filter((s) => s.signature).map((s) => s.owner));
    const champions = enemyPool.slice().sort((a, b) => (sigOwners.has(b.name) ? 1 : 0) - (sigOwners.has(a.name) ? 1 : 0) || tierRank(a.tier) - tierRank(b.tier));
    const enemies = Array.from({ length: enemyCount }).map((_, i) => {
      const template = enemyPool[Math.floor(Math.random() * enemyPool.length)] || characters[0];
      const isBossUnit = stage.isBoss || bossGauntlet || (i === 0 && stage.id >= 4);
      const champ = stage.isBoss ? (i === 0 ? champions[0] : champions[1] || champions[0]) : null;
      const bossRosterDef = champ ? null : (stage.isBoss ? (i === 0 ? primaryBoss : secondaryBoss) : (isBossUnit ? primaryBoss : null));
      const scale = isBossUnit ? 2.0 : 0.65;
      let eHp, eAtk, eDef;
      if (gimmick === "mirror_match") {
        eHp = Math.floor(avgAlly.hp * scale); eAtk = Math.floor(avgAlly.atk * scale); eDef = Math.floor(avgAlly.def * scale);
      } else {
        eHp = Math.floor(avgAlly.hp * dm.hp * scale);
        eAtk = Math.floor(avgAlly.atk * dm.atk * scale);
        eDef = Math.floor(avgAlly.def * dm.def * scale);
      }
      if (isGlassCannon) { eHp = Math.floor(eHp * 0.7); eAtk = Math.floor(eAtk * 1.5); }
      const stats = { hp: eHp, atk: eAtk, def: eDef, magicAtk: Math.floor(eAtk * 0.75), magicDef: Math.floor(eDef * 0.75), speed: Math.floor(avgAlly.speed * (isBossUnit ? 0.85 : 0.95)), maxHp: eHp };
      const eliteSkills = (skills || []).filter((s) => ["Rare", "Epic", "Legendary"].includes(s.rarity));
      const pickElite = (seed) => eliteSkills[seed % eliteSkills.length]?.id || template.skillId;
      let bossSkillId2 = isBossUnit ? pickElite(i + 133) : null;
      if (bossRosterDef) { const sig = findBossSig(bossRosterDef.name); if (sig) bossSkillId2 = sig.id; }
      if (champ) { const sig = findBossSig(champ.name); if (sig) bossSkillId2 = sig.id; }
      const sigChance = isBossUnit ? (stage.id >= 5 ? 0.85 : 0.35) : 0.15;
      if (!bossRosterDef && !champ && Math.random() < sigChance) {
        const signaturePool = (skills || []).filter((s) => s.signature);
        const elementSignatures = signaturePool.filter((s) => { const owner = characters.find((c) => c.name === s.owner); return owner && owner.element === template.element; });
        const pool = elementSignatures.length ? elementSignatures : signaturePool;
        if (pool.length) bossSkillId2 = pool[i % pool.length].id;
      }
      const bossAtkBuff = 0.2 + stage.id * 0.1;
      return {
        id: `enemy-${i}`,
        name: champ ? champ.name : bossRosterDef ? bossRosterDef.name : (isBossUnit ? `ANOMALY_${template.name.toUpperCase()}` : template.name),
        img: champ ? champ.imageUrl : bossRosterDef ? bossRosterDef.img : (stage.isBoss ? "boss_void_executioner.png" : template.imageUrl),
        ...stats,
        element: champ ? champ.element : bossRosterDef ? bossRosterDef.element : template.element,
        franchise: champ ? stage.franchise : bossRosterDef ? "Bosses" : template.franchise,
        level: Math.min(100, 20 + stage.id * 10),
        _equippedGear: rollEnemyGear(isBossUnit ? Math.min(4, 1 + Math.floor(stage.id / 2)) : Math.min(3, Math.floor(stage.id / 2))),
        skillId: isBossUnit ? pickElite(i + 77) : template.skillId,
        skillId2: bossSkillId2,
        abilityLevel: isBossUnit ? Math.min(10, stage.id + 2) : 1,
        abilityLevel2: isBossUnit ? Math.min(10, stage.id + 2) : 1,
        maxSkillCd: isBossUnit ? 35 : 50,
        skillCd: 0, skillCd2: 0, maxSkillCd2: 60,
        isEnemy: true, isBoss: isBossUnit,
        maxStagger: isBossUnit ? 2400 : 600, stagger: 0,
        gauge: 60 + Math.random() * 40, burst: 0,
        effects: [
          ...(isBossUnit ? [{ type: "buff_atk", duration: 99, val: bossAtkBuff, label: "EVENT FURY" }, { type: "shield", duration: 99, val: 0.2, label: "VOID ARMOR" }] : []),
          ...(gimmick === "regen_field" ? [{ type: "regen", duration: 9999, val: 0.02, label: "REGEN FIELD" }] : [])
        ],
        dead: false
      };
    });
    setCombatants([...enemies, ...allies]);
  };

  React.useEffect(() => {
    if (battleState !== "ACTIVE") return;
    const timer = setInterval(() => {
      setCombatants((prev) => {
        if (!prev || prev.length === 0) return prev;
        // HIT-STOP: freeze the simulation for a beat while a cast animation
        // plays -- see hitStopUntil sets below.
        if (Date.now() < hitStopUntil.current) return prev;
        if (prev.filter((c) => !c.isEnemy && !c.dead).length === 0) { setBattleState("LOSS"); return prev; }
        if (prev.filter((c) => c.isEnemy && !c.dead).length === 0) { setBattleState("WIN"); setIsVictoryMusic(true); return prev; }
        const next = prev.map((u) => ({ ...u, effects: Array.isArray(u.effects) ? u.effects.map((e) => ({ ...e })) : [] }));
        const gimmick = activeStage?.gimmick;
        // ELEMENTAL STORM: every ~3s (60 ticks @ 50ms), a random elemental team
        // buff pulses over the whole living squad.
        if (gimmick === "elemental_storm") {
          stormTickRef.current += 1;
          if (stormTickRef.current % 60 === 0) {
            const stormEl = Object.keys(ELEMENTS)[Math.floor(Math.random() * Object.keys(ELEMENTS).length)];
            next.filter((u) => !u.isEnemy && !u.dead).forEach((u) => u.effects.push({ type: "buff_elemdmg", duration: 3, val: 0.3, label: `STORM:${stormEl}` }));
          }
        }
        const battleSpeeds = next.filter((u) => !u.dead).map((u) => getBattleStats(u, playerElement, u.activeSynergies || []).speed);
        const gaugeMult = gimmick === "double_gauge" ? 1.4 : 1;
        next.forEach((u) => {
          if (u.dead) return;
          const stats = getBattleStats(u, playerElement, u.activeSynergies || []);
          u.gauge += getGaugeGain(stats.speed, battleSpeeds, combatSpeed) * gaugeMult;
          if (u.skillCd < u.maxSkillCd) u.skillCd += 1;
          if (u.skillId2 && u.skillCd2 < u.maxSkillCd2) u.skillCd2 += 1;
          if (u.gauge >= 100) {
            // Same-tick guard -- see CampaignView's identical check for why.
            if (Date.now() < hitStopUntil.current) return;
            u.gauge = 0;
            const { incapacitated, popups } = applyStatusTick(u);
            if (popups.length) setFloatingDamages((fd) => [...fd, ...popups]);
            if (u.hp <= 0) {
              if (!u.isEnemy && u._leaderRevive) {
                u._leaderRevive = false;
                u.hp = 1;
                u.lastAction = { ...u.lastAction, msg: "SAVED!" };
              } else {
                u.dead = true;
                return;
              }
            }
            if (incapacitated) {
              u.lastAction = { targetId: u.id, amount: 0, type: "miss", msg: "SKIP TURN", time: Date.now() };
              return;
            }
            const isBurstReady = (u.burst || 0) >= 100;
            const s1Ready = u.skillCd >= u.maxSkillCd;
            const s2Ready = u.skillId2 && u.skillCd2 >= u.maxSkillCd2;
            if ((u.isEnemy || autoBattle) && (s1Ready || s2Ready || isBurstReady)) {
              const nextState = executeCombatSkill({ combatants: next, attackerId: u.id, skills, playerElement, isLimitBreak: isBurstReady });
              nextState.forEach((ns, ni) => next[ni] = ns);
              const casterAfter = next.find((n) => n.id === u.id);
              if (casterAfter?._triggeredTimeStopAt && timeStopHandledRef.current[u.id] !== casterAfter._triggeredTimeStopAt) {
                timeStopHandledRef.current[u.id] = casterAfter._triggeredTimeStopAt;
                if (typeof onWorldTimeStop === "function") onWorldTimeStop(casterAfter._timeStopMusicMs || 5000);
              }
              const castMs = getCastAnimMs(casterAfter?.lastCastAnim);
              if (castMs) hitStopUntil.current = Date.now() + castMs + HITSTOP_BUFFER_MS;
              return;
            }
            const result = resolveBasicAttack({ attacker: u, allUnits: next, playerElement });
            if (result) {
              hitStopUntil.current = Date.now() + getBasicAttackMs(result.meleeAir) + HITSTOP_BUFFER_MS;
              if (!result.missed) {
                if (!u.isEnemy) { u._battleDamage = (u._battleDamage || 0) + result.amount; u._battleBestHit = Math.max(u._battleBestHit || 0, result.amount); }
                setFloatingDamages((prev2) => [...prev2, { id: Math.random(), targetId: result.targetId, amount: result.amount, type: "normal" }]);
              }
            }
          }
        });
        return next;
      });
    }, 50);
    return () => clearInterval(timer);
  }, [battleState, combatSpeed, activeStage]);

  // --- RENDER ---
  const RARITY_COLOR = { Common: "#94a3b8", Rare: "#38bdf8", Epic: "#a855f7", Legendary: "#facc15", Mythic: "#ff2ecb" };
  const activeEvent = liveEvents.find((e) => e.uid === activeEventUid);

  const renderEventList = () => h("div", { className: "animate-fadeIn" },
    h("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 } },
      liveEvents.map((evt) => {
        const gimmickInfo = getGimmick(evt.gimmick);
        const cleared = progressMap[evt.uid] || 0;
        return h("div", {
          key: evt.uid,
          className: "event-card neon-hover",
          style: { background: "rgba(10,10,20,0.6)", borderRadius: 24, padding: 30, border: `1px solid ${evt.color}55`, cursor: "pointer", position: "relative", overflow: "hidden", "--evt-accent": evt.color },
          onClick: () => { setActiveEventUid(evt.uid); setViewMode("stages"); }
        },
          h("div", { className: "event-glow" }),
          h("div", { className: "event-accent-bar" }),
          h("div", { style: { position: "relative", zIndex: 10 } },
            h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 } },
              h("div", { style: { fontSize: "0.7rem", color: evt.color, fontWeight: 900, letterSpacing: 2 } }, evt.label),
              evt.theme ? h("div", { style: { display: "flex", alignItems: "center", gap: 4, fontSize: "0.6rem", color: "#4ade80", fontWeight: 800 } }, [h(Sparkles, { key: "i", size: 11 }), " THEMED OST"]) : null),
            h("h3", { style: { margin: 0, fontSize: "1.8rem", fontWeight: 900 } }, evt.franchise),
            h("p", { style: { fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.4, margin: "10px 0 12px" } }, evt.desc),
            h("div", { style: { display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 } },
              h("span", { style: { fontSize: "0.6rem", fontWeight: 900, letterSpacing: 0.5, color: gimmickInfo.color, background: `${gimmickInfo.color}18`, border: `1px solid ${gimmickInfo.color}55`, padding: "4px 10px", borderRadius: 20 } }, `⚡ ${gimmickInfo.tag}: ${gimmickInfo.name}`)),
            h("div", { style: { fontSize: "0.7rem", color: "#94a3b8", marginBottom: 12 } }, gimmickInfo.desc),
            h("div", { className: "tech-progress-bar", style: { width: "100%", height: 8, background: "rgba(255,255,255,0.05)", marginBottom: 8 } },
              h("div", { className: "tech-progress-fill", style: { width: `${(cleared / STAGE_COUNT) * 100}%`, background: evt.color } })),
            h("div", { style: { fontSize: "0.65rem", color: "var(--text-muted)", marginBottom: 14 } }, `${cleared} / ${STAGE_COUNT} STAGES CLEARED`),
            h("button", { className: "train-btn", style: { width: "auto", padding: "10px 24px", fontSize: "0.8rem", background: evt.color, color: "#000" } }, cleared >= STAGE_COUNT ? "REPLAY EVENT" : "DEPLOY SQUAD")));
      }),
      h("div", { className: "event-card neon-hover", style: { background: "linear-gradient(135deg, rgba(250, 204, 21, 0.1), transparent)", borderRadius: 24, padding: 30, border: "1px solid #facc15", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center" }, onClick: () => setViewMode("shop") },
        h("div", null, [
          h(ShoppingBag, { key: "i", size: 48, color: "#facc15", style: { marginBottom: 15 }, className: "animate-pulse" }),
          h("h3", { key: "t", style: { margin: 0, fontSize: "1.6rem", fontWeight: 900, color: "#facc15" } }, "EXCHANGE HUB"),
          h("p", { key: "p", style: { fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 8 } }, "Trade Event Tokens for Elite Heroes")
        ])),
      h("div", { className: "event-card neon-hover", style: { background: "linear-gradient(135deg, rgba(168, 85, 247, 0.15), transparent)", borderRadius: 24, padding: 30, border: "1px solid #a855f7", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", position: "relative", overflow: "hidden" }, onClick: () => setViewMode("ledger") },
        h("div", null, [
          h(Star, { key: "i", size: 48, color: "#a855f7", style: { marginBottom: 15 }, className: "animate-pulse" }),
          h("h3", { key: "t", style: { margin: 0, fontSize: "1.6rem", fontWeight: 900, color: "#a855f7" } }, "VANGUARD LEDGER"),
          h("p", { key: "p", style: { fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 8 } }, "Lifetime token milestones -- one-time rewards that never expire"),
          MILESTONE_TIERS.some((t) => ledger.progress >= t.at && !ledger.claimed.includes(t.at)) ? h("div", { key: "b", style: { marginTop: 10, display: "inline-block", background: "#facc15", color: "#000", fontSize: "0.65rem", fontWeight: 900, padding: "3px 10px", borderRadius: 20, animation: "pulse-glow 1.5s infinite" } }, "TIER READY TO CLAIM") : null
        ]))));

  const renderLedger = () => h("div", { className: "animate-fadeIn" },
    h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 } },
      h("button", { className: "upgrade-btn", onClick: () => setViewMode("list"), style: { padding: "10px 20px" } }, [h(ChevronLeft, { key: "i", size: 16 }), " BACK"]),
      h("div", { style: { textAlign: "right" } },
        h("div", { style: { fontSize: "0.6rem", color: "#a855f7", fontWeight: 900, letterSpacing: 2 } }, "LIFETIME TOKENS EARNED"),
        h("div", { style: { fontSize: "1.4rem", fontWeight: 900, color: "#fff" } }, ledger.progress.toLocaleString()))),
    h("h2", { style: { margin: "0 0 6px 0", fontFamily: "Cinzel" } }, "VANGUARD LEDGER"),
    h("p", { style: { fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: 25 } }, "Every Event Token you've ever earned counts toward these tiers -- spending tokens in the Exchange Hub never rolls this back."),
    h("div", { style: { display: "flex", flexDirection: "column", gap: 14 } }, MILESTONE_TIERS.map((tier, i) => {
      const isClaimed = ledger.claimed.includes(tier.at);
      const isReady = !isClaimed && ledger.progress >= tier.at;
      const prevAt = i > 0 ? MILESTONE_TIERS[i - 1].at : 0;
      const segProgress = Math.max(0, Math.min(1, (ledger.progress - prevAt) / (tier.at - prevAt)));
      const rewardParts = [];
      if (tier.reward.credits) rewardParts.push(`$${tier.reward.credits.toLocaleString()}`);
      if (tier.reward.gems) rewardParts.push(`${tier.reward.gems} Gems`);
      if (tier.reward.materials) rewardParts.push(`${tier.reward.materials.toLocaleString()} Materials`);
      if (tier.reward.essence) rewardParts.push(`${tier.reward.essence.toLocaleString()} Essence`);
      if (Array.isArray(tier.reward.items)) tier.reward.items.forEach((it) => rewardParts.push(it.replace(/_/g, " ")));
      return h("div", { key: tier.at, className: "glass-panel", style: { padding: 20, borderRadius: 16, border: `1px solid ${isClaimed ? "rgba(74, 222, 128, 0.4)" : isReady ? "#facc15" : "rgba(255,255,255,0.1)"}`, opacity: isClaimed ? 0.6 : 1 } },
        h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 } },
          h("div", { style: { fontSize: "0.85rem", fontWeight: 900, color: isClaimed ? "#4ade80" : "#fff" } }, tier.label),
          h("div", { style: { fontSize: "0.7rem", color: "#facc15", fontWeight: 800 } }, rewardParts.join(" + "))),
        h("div", { className: "tech-progress-bar", style: { width: "100%", height: 8, background: "rgba(255,255,255,0.05)", marginBottom: 10 } },
          h("div", { className: "tech-progress-fill", style: { width: `${segProgress * 100}%`, background: isClaimed ? "#4ade80" : "#a855f7" } })),
        h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } },
          h("div", { style: { fontSize: "0.65rem", color: "var(--text-muted)" } }, `${Math.min(ledger.progress, tier.at).toLocaleString()} / ${tier.at.toLocaleString()}`),
          h("button", { className: "train-btn", disabled: !isReady, style: { width: "auto", padding: "8px 20px", fontSize: "0.75rem", background: isClaimed ? "#334155" : isReady ? "#facc15" : "#1e293b", color: isReady ? "#000" : "#fff", opacity: isClaimed ? 0.7 : 1 }, onClick: () => claimLedgerTier(tier) }, isClaimed ? "CLAIMED" : isReady ? "CLAIM" : "LOCKED")));
    })));

  const renderStages = () => {
    if (!activeEvent) return null;
    const gimmickInfo = getGimmick(activeEvent.gimmick);
    const cleared = progressMap[activeEvent.uid] || 0;
    return h("div", { className: "animate-fadeIn" },
      h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 } },
        h("button", { className: "upgrade-btn", onClick: () => { setViewMode("list"); setActiveEventUid(null); }, style: { padding: "10px 20px" } }, [h(ChevronLeft, { key: "i", size: 16 }), " BACK"]),
        h("button", { className: "sb-btn confirm", style: { padding: "10px 20px", fontSize: "0.8rem", background: "#facc15", color: "#000" }, onClick: () => setViewMode("shop") }, [h(ShoppingBag, { key: "i", size: 14 }), " EXCHANGE"])),
      h("div", { style: { padding: "10px 16px", borderRadius: 12, background: `${gimmickInfo.color}12`, border: `1px solid ${gimmickInfo.color}55`, marginBottom: 16, fontSize: "0.7rem", color: gimmickInfo.color, fontWeight: 800 } }, `⚡ ${gimmickInfo.name}: ${gimmickInfo.desc}`),
      h("div", { style: { display: "flex", flexDirection: "column", gap: 12 } }, generateEventStages(activeEvent).map((s) => {
        const isLocked = s.id > cleared + 1;
        const isCleared = s.id <= cleared;
        return h("div", { key: s.id, className: `stage-card ${isLocked ? "locked" : ""}`, style: { padding: 24 }, onClick: () => !isLocked && setPendingStage(s) },
          h("div", { style: { flex: 1 } },
            h("div", { style: { display: "flex", alignItems: "center", gap: 12 } },
              h("div", { style: { fontWeight: 900, fontSize: "1.2rem", color: isLocked ? "var(--text-muted)" : s.isBoss ? "#a855f7" : "#4ade80" } }, s.name),
              isCleared ? h("div", { style: { background: "#4ade80", color: "#000", fontSize: "0.6rem", padding: "2px 8px", borderRadius: 4, fontWeight: 900 } }, "CLEARED") : null,
              isLocked ? h("div", { style: { background: "#334155", color: "#94a3b8", fontSize: "0.6rem", padding: "2px 8px", borderRadius: 4, fontWeight: 900 } }, "LOCKED") : null,
              s.rewards.grantsEventGear ? h("div", { style: { background: "#4ade80", color: "#000", fontSize: "0.6rem", padding: "2px 8px", borderRadius: 4, fontWeight: 900 } }, "★ GEAR REWARD") : null),
            h("div", { style: { fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 6 } }, `STAMINA_COST ${s.stamina}`)),
          h("div", { style: { textAlign: "right" } },
            h("div", { style: { fontSize: "0.65rem", fontWeight: 900, color: "#facc15" } }, "TOKENS"),
            h("div", { style: { fontSize: "1.4rem", fontWeight: 900 } }, `+${s.rewards.tokens}`)));
      })));
  };

  const renderPendingStage = () => !pendingStage ? null : h("div", { className: "hero-select-modal animate-fadeIn", style: { display: "flex", flexDirection: "column" } },
    h("div", { className: "modal-header" },
      h("div", null,
        h("h2", { style: { margin: 0, color: pendingStage.color || "var(--primary)" } }, pendingStage.name),
        h("div", { style: { fontSize: "0.8rem", opacity: 0.7, maxWidth: "400px", marginTop: 4 } }, `Event Operation // Stage ${pendingStage.id} of ${STAGE_COUNT}`)),
      h("button", { className: "upgrade-btn", style: { padding: "10px 20px" }, onClick: () => setPendingStage(null) }, "BACK")),
    h("div", { style: { background: "rgba(0,0,0,0.3)", padding: 15, borderRadius: 16, marginBottom: 20 } },
      h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 } },
        h("h3", { style: { margin: 0, fontSize: "0.9rem", fontWeight: 900 } }, `MISSION SQUAD (${squadIds.length}/5)`),
        h("div", { style: { display: "flex", gap: 8 } },
          h("button", { className: "upgrade-btn", style: { fontSize: "0.7rem" }, onClick: () => setShowSquadBuilder(true) }, "EDIT SQUAD"),
          h("button", { className: "train-btn", style: { width: "auto", padding: "8px 24px", background: "#22c55e" }, disabled: squadIds.length === 0, onClick: () => startBattle(pendingStage) }, "COMMENCE OPERATION"))),
      h("div", { className: "squad-slots-row", style: { gridTemplateColumns: "repeat(5, 1fr)" } }, Array.from({ length: 5 }).map((_, i) => {
        const heroId = squadIds[i];
        const c = heroId ? characters.find((hh) => String(hh.export_id) === String(heroId)) : null;
        return h("div", { key: i, className: `squad-member-slot ${c ? "active" : "empty"}`, onClick: () => setShowSquadBuilder(true) }, c ? h("img", { src: c.imageUrl }) : h(Plus, { size: 20, opacity: 0.2 }));
      }))),
    h("div", { className: "glass-panel", style: { padding: 25, textAlign: "center" } },
      h("div", { style: { fontSize: "0.75rem", fontWeight: 900, color: "#facc15", marginBottom: 10 } }, `STAMINA COST: ${pendingStage.stamina}`),
      h("div", { style: { display: "flex", justifyContent: "center", gap: 20 } },
        h("div", null,
          h("div", { style: { fontSize: "0.6rem", color: "var(--text-muted)" } }, "CURRENT SQUAD"),
          h("div", { style: { fontSize: "1.2rem", fontWeight: 900, color: "#4ade80" } }, squadIds.reduce((sum, id) => sum + calculateSubStat(characters.find((hh) => String(hh.export_id) === String(id)) || {}, characters, "pwr", skills), 0).toLocaleString())),
        h("div", { style: { width: 1, background: "rgba(255,255,255,0.1)" } }),
        h("div", null,
          h("div", { style: { fontSize: "0.6rem", color: "var(--text-muted)" } }, "TOKEN YIELD"),
          h("div", { style: { fontSize: "1.2rem", fontWeight: 900, color: "#facc15" } }, pendingStage.rewards.tokens.toLocaleString())))));

  const renderShop = () => h("div", { className: "animate-fadeIn" },
    h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 } },
      h("button", { className: "upgrade-btn", onClick: () => setViewMode(activeEventUid ? "stages" : "list"), style: { padding: "10px 20px" } }, [h(ChevronLeft, { key: "i", size: 16 }), " BACK"]),
      h("h3", { style: { margin: 0, textTransform: "uppercase", color: "#facc15", letterSpacing: 2 } }, "THE EXCHANGE")),
    h("div", { className: "inventory-grid", style: { gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 15 } }, getShopItems().map((item, i) => {
      const isOwned = item.type === "hero" && unlockedIds.includes(item.id);
      return h("div", { key: i, className: "inventory-card", style: { border: isOwned ? "1px solid #4ade80" : "1px solid rgba(255,255,255,0.1)", background: isOwned ? "linear-gradient(135deg, rgba(74, 222, 128, 0.05), rgba(15, 23, 42, 0.9))" : "" } },
        h("div", { style: { textAlign: "center", marginBottom: 15, position: "relative" } },
          item.img ? h("img", { src: item.img, style: { width: "100%", aspectRatio: 1, borderRadius: 16, objectFit: "cover", border: "2px solid rgba(255,255,255,0.1)" } }) : h("div", { style: { height: 100, display: "flex", alignItems: "center", justifyContent: "center" } }, item.icon),
          item.rarity ? h("div", { className: "tier-badge", style: { position: "absolute", top: 8, left: 8 } }, item.rarity) : null,
          item.eventLabel ? h("div", { style: { position: "absolute", bottom: 8, left: 8, background: "rgba(0,0,0,0.75)", color: item.eventColor || "#facc15", border: `1px solid ${item.eventColor || "#facc15"}55`, fontSize: "0.5rem", fontWeight: 900, letterSpacing: 1, padding: "2px 7px", borderRadius: 4, zIndex: 10 } }, item.eventLabel) : null,
          isOwned ? h("div", { style: { position: "absolute", top: 5, right: 5, background: "#4ade80", color: "#000", fontSize: "0.5rem", fontWeight: 900, padding: "2px 6px", borderRadius: 4, zIndex: 10 } }, "OWNED") : null,
          !isOwned && item.type === "hero" ? h("div", { style: { position: "absolute", top: 5, right: 5, background: "#facc15", color: "#000", fontSize: "0.5rem", fontWeight: 900, padding: "2px 6px", borderRadius: 4, zIndex: 10 } }, "NEW") : null),
        h("div", { className: "item-name", style: { fontSize: "1rem" } }, item.name),
        h("div", { style: { marginTop: "auto", paddingTop: 15 } },
          h("button", { className: "shop-buy-btn", onClick: () => purchaseEventItem(item), style: { background: isOwned ? "linear-gradient(135deg, #4ade80, #166534)" : "linear-gradient(135deg, #facc15, #eab308)", color: isOwned ? "#fff" : "#000" } }, `${Math.floor(item.cost * Math.pow(1.65, eventPurchases[item.id] || 0)).toLocaleString()} TOKENS`)));
    })));

  const renderBattle = () => h("div", { className: "battle-screen animate-fadeIn" },
    h("div", { className: "battle-header", style: { padding: 20, background: "rgba(0,0,0,0.9)", borderBottom: "1px solid rgba(255,255,255,0.1)" } },
      h("div", null,
        h("h2", { style: { margin: 0, fontSize: "1.2rem", fontFamily: "MugenTitle" } }, activeStage.name),
        h("div", { style: { fontSize: "0.7rem", color: "var(--text-muted)" } }, ["STANCE_SYNC: ", h("span", { key: "s", style: { color: ELEMENTS[playerElement].color } }, playerElement)])),
      h("div", { style: { display: "flex", gap: 8 } },
        h("button", { onClick: () => setCombatSpeed((s) => s === 1 ? 1.5 : s === 1.5 ? 2 : 1), className: "train-btn", style: { padding: "8px 12px", fontSize: "0.7rem", width: "auto", background: combatSpeed > 1 ? "var(--primary)" : "#334155" } }, `${combatSpeed}x`),
        h("button", { className: "train-btn", style: { width: "auto", padding: "8px 20px", background: "#ef4444" }, onClick: () => { setBattleState("IDLE"); setActiveStage(null); setBattleMusicActive(false); setEventTheme(null); } }, "ABORT OP"))),
    h("div", { className: "unified-stance-display" }, h(TacticalStanceRow, { currentStance: playerElement, onStanceChange: changePlayerElement })),
    h("div", { ref: battleSceneRef, className: "battle-scene" },
      h(ProjectileLayer, { combatants, containerRef: battleSceneRef }),
      h("div", { className: "battle-background-layer", style: { backgroundImage: `url(${activeStage.isBoss ? "background_void.png" : "background_battle.png"})` } }),
      h("div", { className: "battle-formation enemy-row" }, combatants.filter((c) => c.isEnemy).map((u) => h(BattleUnit, { key: u.id, unit: u, floatingDamages: floatingDamages.filter((d) => d.targetId === u.id) }))),
      h("div", { className: "battle-formation hero-row" }, combatants.filter((c) => !c.isEnemy).map((u) => h(BattleUnit, { key: u.id, unit: u, floatingDamages: floatingDamages.filter((d) => d.targetId === u.id) })))),
    battleState === "INTRO" ? h(CampaignIntro, {
      activeBattle: { name: activeStage.name, enemy: combatants.find((c) => c.isEnemy && c.isBoss)?.name || combatants.find((c) => c.isEnemy)?.name || "ANOMALY", element: combatants.find((c) => c.isEnemy)?.element || "NEUTRAL", bg: activeStage.isBoss ? "THE VOID" : "RIFT DISTRICT" },
      squad: characters.filter((c) => squadIds.map(String).includes(String(c.export_id))),
      bossImg: combatants.find((c) => c.isEnemy && c.isBoss)?.img || combatants.find((c) => c.isEnemy)?.img || "boss_void_executioner.png",
      onComplete: () => { setBattleState("ACTIVE"); playSound("spar"); }
    }) : null,
    battleState === "WIN" ? h("div", { className: "battle-result-overlay" },
      h("h1", { className: "win-text", style: { fontSize: "5rem" } }, "OP SUCCESS"),
      h("button", { className: "confirm-vic-btn", onClick: claimVictory }, h("div", { className: "btn-inner" }, "RETRIEVE DATA"))) : null,
    battleState === "LOSS" ? h("div", { className: "battle-result-overlay" },
      h("h1", { className: "loss-text", style: { fontSize: "5rem" } }, "SYSTEM FAILURE"),
      h("button", { className: "train-btn", style: { marginTop: 30, width: 240 }, onClick: () => { setBattleState("IDLE"); setActiveStage(null); setBattleMusicActive(false); setEventTheme(null); } }, "BACK TO BASE")) : null);

  return h("div", { className: "animate-fadeIn", style: { padding: "10px 0" } },
    h("div", { className: "glass-panel", style: { marginBottom: 20, background: "rgba(15, 23, 42, 0.9)", borderLeft: "4px solid #facc15", padding: "20px 30px" } },
      h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } },
        h("div", null,
          h("h2", { style: { margin: 0, fontSize: "2rem", fontWeight: 900, fontFamily: "MugenTitle", letterSpacing: 2 } }, "STREET OPS"),
          h("div", { style: { color: "var(--text-muted)", fontSize: "0.8rem", letterSpacing: 1, marginTop: 4 } }, `${liveEvents.length} EVENT${liveEvents.length === 1 ? "" : "S"} LIVE NOW — CLEAR RIFTS → EARN TOKENS → TRADE IN THE EXCHANGE HUB`)),
        h("div", { style: { textAlign: "right" } },
          h("div", { style: { fontSize: "0.6rem", color: "#facc15", fontWeight: 900, letterSpacing: 2 } }, "RESERVE TOKENS"),
          h("div", { style: { fontSize: "1.8rem", fontWeight: 900, color: "#fff" } }, eventTokens.toLocaleString())))),
    !activeStage && viewMode === "list" ? renderEventList() : null,
    viewMode === "ledger" ? renderLedger() : null,
    viewMode === "stages" && !activeStage ? renderStages() : null,
    renderPendingStage(),
    viewMode === "shop" ? renderShop() : null,
    battleState !== "IDLE" ? renderBattle() : null);
};

export { EventsView };
