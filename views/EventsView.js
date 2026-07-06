import { Fragment, jsxDEV } from "react/jsx-dev-runtime";
import React, { useState, useEffect, useMemo } from "react";
import {
  Sparkles,
  ShoppingBag,
  Star,
  Gem,
  Database,
  Plus,
  ChevronLeft
} from "lucide-react";
import { BattleUnit, executeCombatSkill, TacticalStanceRow } from "../CombatSystem.js";
import { ELEMENTS } from "../constants.js";
import { calculateStat, playSound, calculateSubStat, getEnemyStatsFromCP, applyLeaderBonus, applyMitigation, incrementCourierFieldBattles } from "../utils.js";
import { CampaignIntro } from "./ViewShared.js";

// VANGUARD LEDGER: a lifetime-earned Event Token milestone track -- something
// to work toward in Events beyond grinding stages and spending in the shop.
// Progress is total tokens ever earned (never reduced by shop spending), so
// it's a second, always-forward-moving reward rail running alongside the
// spendable Token balance.
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

const EventsView = ({
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
  setEventPurchases
}) => {
  const [activeEvent, setActiveEvent] = useState(null);
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
  const [playerElement, setPlayerElement] = useState("FIRE");
  const [autoBattle, setAutoBattle] = useState(true);
  const [combatSpeed, setCombatSpeed] = useState(1.5);
  const [floatingDamages, setFloatingDamages] = useState([]);
  const claimVictory = () => {
    if (!activeStage) {
      createFloatingText("No active stage to claim.", true);
      setBattleState("IDLE");
      setActiveStage(null);
      setCombatants([]);
      if (typeof setBattleMusicActive === "function") setBattleMusicActive(false);
      if (typeof setIsVictoryMusic === "function") setIsVictoryMusic(false);
      return;
    }
    incrementCourierFieldBattles(setCharacters, combatants);
    const r = activeStage.rewards || {};
    const luckRoll = Math.random();
    const isGreatSuccess = luckRoll < 0.15;
    const rewardMult = (activeStage.isBoss || activeStage.diff === "Expert" || activeStage.diff === "Hard" ? 2 : 1) * (isGreatSuccess ? 3 : 1);
    if (isGreatSuccess) {
      playSound("jackpot");
      createFloatingText("CRITICAL MISSION SUCCESS! x3 REWARDS", false, "#facc15");
    }
    if (r.credits) setCredits((c) => c + Math.floor(r.credits * rewardMult));
    if (r.gems) setGems((g) => g + Math.floor(r.gems * rewardMult));
    if (r.aura) setAura((a) => a + Math.floor(r.aura * rewardMult));
    if (r.materials) {
      const add = Math.floor(r.materials * rewardMult);
      setMaterials((s) => s + add);
      const cur = parseInt(localStorage.getItem("mugen_materials") || "0", 10);
      localStorage.setItem("mugen_materials", String(cur + add));
      window.dispatchEvent(new CustomEvent("mugen_materials_changed", { detail: { materials: cur + add } }));
    }
    if (r.essence) {
      const addE = Math.floor(r.essence * rewardMult);
      setEssence((e) => e + addE);
      const curE = parseInt(localStorage.getItem("mugen_essence") || "0", 10);
      localStorage.setItem("mugen_essence", String(curE + addE));
      window.dispatchEvent(new CustomEvent("mugen_materials_changed", { detail: { essence: curE + addE } }));
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
    if (Array.isArray(r.items) && r.items.length > 0) {
      r.items.forEach((it) => {
        addToInventory(it);
        createFloatingText(`RECOVERED: ${it.replace("_", " ").toUpperCase()}`, false, "#facc15");
      });
    }
    createFloatingText("EVENT DATA RETRIEVED", false, "#4ade80");
    playSound("victory");
    setBattleState("IDLE");
    setActiveStage(null);
    setCombatants([]);
    if (typeof setBattleMusicActive === "function") setBattleMusicActive(false);
    if (typeof setIsVictoryMusic === "function") setIsVictoryMusic(false);
  };
  const extractFranchise = (c) => {
    if (!c) return "Unknown";
    return String(c.franchise || "Unknown").trim();
  };
  const franchiseData = useMemo(() => {
    const counts = {};
    characters.forEach((c) => {
      const f = extractFranchise(c);
      if (f !== "Unknown") counts[f] = (counts[f] || 0) + 1;
    });
    const majors = Object.keys(counts).filter((f) => counts[f] >= 3);
    const minors = Object.keys(counts).filter((f) => counts[f] < 3);
    const dayOfYear = Math.floor((Date.now() - new Date((/* @__PURE__ */ new Date()).getFullYear(), 0, 0)) / 864e5);
    const dailyMajor = majors.length > 0 ? majors[dayOfYear % majors.length] : "Mugen";
    const wildcardPool = characters.filter((c) => minors.includes(extractFranchise(c)));
    return { dailyMajor, wildcardFranchises: minors, wildcardChars: wildcardPool };
  }, [characters]);
  const activeEventsList = [
    {
      id: "franchise",
      title: franchiseData.dailyMajor.toUpperCase(),
      sub: "DAILY SERIES SINGULARITY",
      desc: `Today's rotating rift spotlights ${franchiseData.dailyMajor}. Best source of Event Tokens & Essence — fuel for unlocking Signature abilities. Resets daily.`,
      tag: "BEST FOR: Tokens • Essence",
      bg: "background_citadel.png",
      color: "#facc15",
      unlockLv: 1
    },
    {
      id: "wildcard",
      title: "OUTLIER ANOMALY",
      sub: "EXPERIMENTAL OPS",
      desc: "A revolving door of minor franchises — unpredictable foes, but the richest Materials & crafting-material yield in the game.",
      tag: "BEST FOR: Materials • Materials",
      bg: "background_gacha.png",
      color: "#a855f7",
      unlockLv: 25
    },
    {
      id: "boss_rush",
      title: "VOID GENESIS",
      sub: "WORLD RAID PROTOCOL",
      desc: "An endgame gauntlet against the Void Overlord. Brutal, but the only place to farm Gems & top-tier gear at scale. Rewards scale with how far you push.",
      tag: "BEST FOR: Gems • Elite Gear",
      bg: "background_void.png",
      color: "#ef4444",
      unlockLv: 60
    }
  ];
  const generateStages = (eventId) => {
    const isWildcard = eventId === "wildcard";
    const isBoss = eventId === "boss_rush";
    const franchiseName = isBoss ? "Void Core" : isWildcard ? "Wildcard Alliance" : franchiseData.dailyMajor;
    const baseCP = isBoss ? 2e9 : 5e8;
    // Rewards tuned so events are a strong-but-not-dominant income source:
    // Easy assumes an Awakening 2 squad, Expert an endgame one. Campaign raiding
    // should remain the bulk-credits loop; events are for tokens/essence/gems.
    return [
      { id: 1, diff: "Easy", cp: Math.floor(baseCP * 0.5), stamina: 25, unlockLv: 5, rewards: { tokens: 1200, credits: 8e5, essence: 120 } },
      { id: 2, diff: "Normal", cp: Math.floor(baseCP * 2), stamina: 50, unlockLv: 20, rewards: { tokens: 3500, credits: 3e6, essence: 500, gems: 80, items: ["stamina_large"] } },
      { id: 3, diff: "Hard", cp: Math.floor(baseCP * 8), stamina: 100, unlockLv: 40, rewards: { tokens: 1e4, gems: 300, aura: 1500, materials: 6e4, items: ["xp_ultra_tome", "stamina_xl"] } },
      { id: 4, diff: "Expert", cp: Math.floor(baseCP * 20), stamina: 250, unlockLv: 70, rewards: { tokens: 35e3, gems: 1800, essence: 2500, materials: 25e4, items: ["multiverse_core", "xp_grand_tome"] } }
    ].map((s) => ({
      ...s,
      name: `${franchiseName} // ${s.diff.toUpperCase()}`,
      franchise: franchiseName,
      isWildcard,
      isBoss,
      eventId
    }));
  };
  const purchaseEventItem = (item) => {
    const buyCount = eventPurchases[item.id] || 0;
    const currentCost = Math.floor(item.cost * Math.pow(1.65, buyCount));
    if (eventTokens < currentCost) {
      createFloatingText(`Need ${currentCost} Tokens`, true);
      return;
    }
    setEventTokens((t) => t - currentCost);
    setEventPurchases((prev) => ({ ...prev, [item.id]: (prev[item.id] || 0) + 1 }));
    if (item.id === "multiverse_core" || item.id === "xp_grand_tome" || item.id === "bond_eternal_crystal" || item.id === "void_capsule") {
      addToInventory(item.id, item.amount || 1);
      createFloatingText(`Acquired ${item.name}!`, false, "#facc15");
    } else if (item.type === "hero") {
      const isNew = !unlockedIds.includes(item.id);
      if (isNew) {
        setUnlockedIds((prev) => Array.from(/* @__PURE__ */ new Set([...prev, item.id])));
        createFloatingText(`Recruited ${item.name}!`, false, "#4ade80");
      } else {
        createFloatingText(`Duplicate ${item.name}: +Stat Bonus`, false, "#facc15");
      }
      if (typeof setCharacters === "function") {
        setCharacters((prev) => prev.map((c) => {
          if (String(c.export_id) === String(item.id)) {
            return {
              ...c,
              pulls: (c.pulls || 0) + 1,
              duplicateStatBonus: (c.duplicateStatBonus || 0) + (isNew ? 0 : 5e-3)
            };
          }
          return c;
        }));
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
    const pool = activeEvent === "wildcard" ? franchiseData.wildcardChars.slice(0, 12) : characters.filter((c) => extractFranchise(c) === franchiseData.dailyMajor).slice(0, 12);
    const getHeroTokenCost = (tier) => {
      const t = (tier || "C").trim().toUpperCase();
      if (t === "SS") return 25e3;
      if (t === "S+") return 15e3;
      if (t === "S") return 1e4;
      return 5e3;
    };
    pool.forEach((h) => {
      items.push({
        type: "hero",
        id: h.export_id,
        name: h.name,
        cost: getHeroTokenCost(h.tier),
        img: h.imageUrl,
        rarity: h.tier
      });
    });
    items.push({ type: "resource", id: "multiverse_core", name: "Multiverse Core", cost: 1e5, amount: 1, img: "item_multiverse_core.png" });
    items.push({ type: "resource", id: "xp_grand_tome", name: "Grand Archive", cost: 5e4, amount: 1, img: "item_grand_archive.png" });
    items.push({ type: "resource", id: "bond_eternal_crystal", name: "Eternal Unity Spark", cost: 15e4, amount: 1, img: "item_eternal_spark.png" });
    items.push({ type: "resource", id: "void_capsule", name: "Void Stamina Cap", cost: 75e3, amount: 1, img: "item_void_capsule.png" });
    items.push({ type: "resource", id: "gems", name: "5000 Gems", cost: 25e3, amount: 5e3, icon: /* @__PURE__ */ jsxDEV(Gem, { size: 20 }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 6760,
      columnNumber: 100
    }) });
    items.push({ type: "resource", id: "credits", name: "50M Credits", cost: 1e4, amount: 5e7, icon: /* @__PURE__ */ jsxDEV(Database, { size: 20 }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 6761,
      columnNumber: 109
    }) });
    items.push({ type: "resource", id: "essence", name: "2500 Essence", cost: 15e3, amount: 2500, icon: /* @__PURE__ */ jsxDEV(Star, { size: 20 }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 6762,
      columnNumber: 106
    }) });
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
  const startBattle = (stage) => {
    if (totalAccountLevel < stage.unlockLv) {
      createFloatingText(`Unlock at Level ${stage.unlockLv}`, true);
      return;
    }
    if (stamina < stage.stamina) {
      createFloatingText(`Need ${stage.stamina} Stamina!`, true);
      return;
    }
    if (squadIds.length === 0) {
      createFloatingText("Squad is empty!", true);
      setShowSquadBuilder(true);
      return;
    }
    setStamina((s) => s - stage.stamina);
    setActiveStage(stage);
    setPendingStage(null);
    setBattleState("INTRO");
    playSound("boss_intro");
    if (setBattleMusicActive) setBattleMusicActive(true);
    if (setIsHardBattle) setIsHardBattle(stage.isBoss || stage.diff === "Hard" || stage.diff === "Expert");
    setFloatingDamages([]);
    const squad = characters.filter((c) => squadIds.map(String).includes(String(c.export_id)));
    const allies = squad.map((c, i) => ({
      id: `ally-${i}`,
      name: c.name,
      img: c.imageUrl,
      maxHp: calculateStat(c.baseStats.hp, c.level, c, characters, "hp"),
      hp: calculateStat(c.baseStats.hp, c.level, c, characters, "hp"),
      atk: calculateStat(c.baseStats.atk, c.level, c, characters, "atk"),
      magicAtk: calculateStat(c.baseStats["magic atk"], c.level, c, characters, "magic atk"),
      def: calculateStat(c.baseStats.def, c.level, c, characters, "def"),
      magicDef: calculateStat(c.baseStats["magic def"], c.level, c, characters, "magic def"),
      speed: calculateStat(c.baseStats.speed, c.level, c, characters, "speed"),
      element: c.element,
      level: c.level,
      skillId: c.skillId,
      skillId2: c.skillId2,
      abilityLevel: c.abilityLevels?.[c.skillId] || 1,
      abilityAwaken: c.abilityAwaken?.[c.skillId] || 0,
      abilityAwaken2: c.skillId2 ? c.abilityAwaken?.[c.skillId2] || 0 : 0,
      maxSkillCd: skills.find((s) => s.id === c.skillId)?.cooldown || 100,
      skillCd: 0,
      isEnemy: false,
      gauge: Math.random() * 30,
      burst: 0,
      effects: [],
      dead: false,
      critRate: calculateSubStat(c, characters, "crit_rate", skills, auraUpgrades) / 100,
      evasion: calculateSubStat(c, characters, "evasion", skills, auraUpgrades) / 100
    }));
    const leaderChar = squadIds[0] ? characters.find((c) => String(c.export_id) === String(squadIds[0])) : null;
    allies.forEach((a) => applyLeaderBonus(leaderChar, a, squad));
    // Scale enemies from actual ally stats so difficulty tracks player progression
    // automatically instead of using an absolute CP anchor that becomes trivial or
    // impossible depending on where in the game the player is.
    const na = Math.max(1, allies.length);
    const avgAlly = {
      hp:    allies.reduce((s, a) => s + a.maxHp, 0) / na,
      atk:   allies.reduce((s, a) => s + a.atk,   0) / na,
      def:   allies.reduce((s, a) => s + a.def,    0) / na,
      speed: allies.reduce((s, a) => s + a.speed,  0) / na,
    };
    const DIFF_MULTS = {
      Easy:   { hp: 2.5, atk: 0.8,  def: 0.7  },
      Normal: { hp: 5,   atk: 1.15, def: 1.0  },
      Hard:   { hp: 9,   atk: 1.7,  def: 1.55 },
      Expert: { hp: 16,  atk: 2.5,  def: 2.3  },
    };
    // Absolute stat floors so an underdeveloped squad can't cheese a tier with
    // relative scaling alone — Easy floors sit around an Awakening 2 mid-40s squad.
    const DIFF_FLOORS = {
      Easy:   { hp: 15e4, atk: 1800,  def: 1200  },
      Normal: { hp: 5e5,  atk: 3500,  def: 2500  },
      Hard:   { hp: 2e6,  atk: 7e3,   def: 5500  },
      Expert: { hp: 8e6,  atk: 14e3,  def: 11e3  },
    };
    const dm = DIFF_MULTS[stage.diff] || DIFF_MULTS.Normal;
    const fl = DIFF_FLOORS[stage.diff] || DIFF_FLOORS.Normal;
    const enemyPool = stage.isWildcard ? franchiseData.wildcardChars : characters.filter((c) => extractFranchise(c) === franchiseData.dailyMajor);
    const enemies = Array.from({ length: stage.isBoss ? 1 : 4 }).map((_, i) => {
      const template = enemyPool[Math.floor(Math.random() * enemyPool.length)] || characters[0];
      const isBossUnit = stage.isBoss || (i === 0 && (stage.diff === "Expert" || stage.diff === "Hard"));
      const scale = isBossUnit ? 2.0 : 0.65;
      const eHp  = Math.floor(Math.max(avgAlly.hp  * dm.hp,  fl.hp)  * scale);
      const eAtk = Math.floor(Math.max(avgAlly.atk * dm.atk, fl.atk) * scale);
      const eDef = Math.floor(Math.max(avgAlly.def * dm.def, fl.def) * scale);
      const stats = {
        hp:       eHp,
        atk:      eAtk,
        def:      eDef,
        magicAtk: Math.floor(eAtk * 0.75),
        magicDef: Math.floor(eDef * 0.75),
        speed:    Math.floor(avgAlly.speed * (isBossUnit ? 0.85 : 0.95)),
        maxHp:    eHp,
      };
      const eliteSkills = (skills || []).filter((s) => ["Rare", "Epic", "Legendary"].includes(s.rarity));
      const pickElite = (seed) => eliteSkills[seed % eliteSkills.length]?.id || template.skillId;
      let bossSkillId2 = isBossUnit || stage.diff === "Expert" || stage.diff === "Hard" ? pickElite(i + 133) : null;
      if (isBossUnit && (stage.diff === "Hard" || stage.diff === "Expert")) {
        const sigChance = stage.diff === "Expert" ? 0.85 : 0.35;
        if (Math.random() < sigChance) {
          const signaturePool = (skills || []).filter((s) => s.signature);
          const elementSignatures = signaturePool.filter((s) => {
            const owner = characters.find((c) => c.name === s.owner);
            return owner && owner.element === template.element;
          });
          const pool = elementSignatures.length ? elementSignatures : signaturePool;
          if (pool.length) bossSkillId2 = pool[i % pool.length].id;
        }
      }
      const bossAtkBuff = { Easy: 0.15, Normal: 0.35, Hard: 0.6, Expert: 0.9 }[stage.diff] ?? 0.35;
      return {
        id: `enemy-${i}`,
        name: isBossUnit ? `ANOMALY_${template.name.toUpperCase()}` : template.name,
        img: stage.isBoss ? "boss_void_executioner.png" : template.imageUrl,
        ...stats,
        element: template.element,
        level: Math.min(100, stage.unlockLv + stage.id * 5),
        skillId: isBossUnit ? pickElite(i + 77) : template.skillId,
        skillId2: bossSkillId2,
        abilityLevel: isBossUnit ? Math.min(10, stage.id) : 1,
        abilityLevel2: isBossUnit ? Math.min(10, stage.id) : 1,
        maxSkillCd: isBossUnit ? 35 : 50,
        skillCd: 0,
        skillCd2: 0,
        maxSkillCd2: 60,
        isEnemy: true,
        isBoss: isBossUnit,
        maxStagger: isBossUnit ? 2400 : 600,
        stagger: 0,
        gauge: 60 + Math.random() * 40,
        burst: 0,
        effects: isBossUnit
          ? [{ type: "buff_atk", duration: 99, val: bossAtkBuff, label: "EVENT FURY" },
             { type: "shield",   duration: 99, val: 0.2,         label: "VOID ARMOR"  }]
          : [],
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
        if (prev.filter((c) => !c.isEnemy && !c.dead).length === 0) {
          setBattleState("LOSS");
          return prev;
        }
        if (prev.filter((c) => c.isEnemy && !c.dead).length === 0) {
          setBattleState("WIN");
          setIsVictoryMusic(true);
          return prev;
        }
        const next = prev.map((u) => ({ ...u, effects: Array.isArray(u.effects) ? u.effects.map((e) => ({ ...e })) : [] }));
        next.forEach((u) => {
          if (u.dead) return;
          // Cap the action rate: raw speed reaches the thousands late-game, which
          // let every unit act ~10x/second and ended fights in moments. Fastest
          // possible action is now ~1 per second (at 1x speed); SPD still matters
          // below the cap and breaks ties above it via the small overflow bonus.
          u.gauge += Math.min(3.4, u.speed / 100 * 1.5 + Math.log10(Math.max(1, u.speed)) * 0.12) * combatSpeed;
          if (u.skillCd < u.maxSkillCd) u.skillCd += 1;
          if (u.skillId2 && u.skillCd2 < u.maxSkillCd2) u.skillCd2 += 1;
          if (u.gauge >= 100) {
            u.gauge = 0;
            const isBurstReady = (u.burst || 0) >= 100;
            const s1Ready = u.skillCd >= u.maxSkillCd;
            const s2Ready = u.skillId2 && u.skillCd2 >= u.maxSkillCd2;
            if ((u.isEnemy || autoBattle) && (s1Ready || s2Ready || isBurstReady)) {
              const nextState = executeCombatSkill({ combatants: next, attackerId: u.id, skills, playerElement, isLimitBreak: isBurstReady });
              nextState.forEach((ns, ni) => next[ni] = ns);
              return;
            }
            const targets = next.filter((t) => t.isEnemy !== u.isEnemy && !t.dead && !t.effects.some((e) => e.type === "untargetable"));
            if (targets.length > 0) {
              const target = targets[Math.floor(Math.random() * targets.length)];
              let dmg = Math.floor(u.atk * 1.5);
              const shield = target.effects.find((e) => e.type === "shield");
              if (shield) dmg = Math.floor(dmg * (1 - shield.val));
              dmg = applyMitigation(dmg, target.def || 0, 1e3);
              target.hp = Math.max(0, target.hp - dmg);
              if (target.hp === 0) {
                if (!target.isEnemy && target._leaderRevive) {
                  target._leaderRevive = false;
                  target.hp = 1;
                  target.lastAction = { ...target.lastAction, msg: "SAVED!" };
                } else target.dead = true;
              }
              setFloatingDamages((prev2) => [...prev2, { id: Math.random(), targetId: target.id, amount: dmg, type: "normal" }]);
            }
          }
        });
        return next;
      });
    }, 50);
    return () => clearInterval(timer);
  }, [battleState, combatSpeed]);
  return /* @__PURE__ */ jsxDEV("div", { className: "animate-fadeIn", style: { padding: "10px 0" }, children: [
    /* @__PURE__ */ jsxDEV("div", { className: "glass-panel", style: { marginBottom: 20, background: "rgba(15, 23, 42, 0.9)", borderLeft: "4px solid #facc15", padding: "20px 30px" }, children: /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
      /* @__PURE__ */ jsxDEV("div", { children: [
        /* @__PURE__ */ jsxDEV("h2", { style: { margin: 0, fontSize: "2rem", fontWeight: 900, fontFamily: "MugenTitle", letterSpacing: 2 }, children: "STREET OPS" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 6906,
          columnNumber: 17
        }),
        /* @__PURE__ */ jsxDEV("div", { style: { color: "var(--text-muted)", fontSize: "0.8rem", letterSpacing: 1, marginTop: 4 }, children: "CLEAR RIFTS → EARN TOKENS → TRADE IN THE EXCHANGE HUB FOR EXCLUSIVE HEROES & PREMIUM GEAR" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 6907,
          columnNumber: 17
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 6905,
        columnNumber: 14
      }),
      /* @__PURE__ */ jsxDEV("div", { style: { textAlign: "right" }, children: [
        /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.6rem", color: "#facc15", fontWeight: 900, letterSpacing: 2 }, children: "RESERVE TOKENS" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 6910,
          columnNumber: 17
        }),
        /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "1.8rem", fontWeight: 900, color: "#fff" }, children: eventTokens.toLocaleString() }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 6911,
          columnNumber: 17
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 6909,
        columnNumber: 14
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 6904,
      columnNumber: 11
    }) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 6903,
      columnNumber: 8
    }),
    !activeStage && viewMode === "list" && /* @__PURE__ */ jsxDEV("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }, children: [
      activeEventsList.map((evt) => {
        const isLocked = totalAccountLevel < evt.unlockLv;
        return /* @__PURE__ */ jsxDEV(
          "div",
          {
            className: `event-card ${isLocked ? "locked" : "neon-hover"}`,
            style: { background: "rgba(10,10,20,0.6)", borderRadius: 24, padding: 30, border: `1px solid ${isLocked ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.1)"}`, cursor: isLocked ? "not-allowed" : "pointer", position: "relative", overflow: "hidden", opacity: isLocked ? 0.5 : 1, "--evt-accent": evt.color },
            onClick: () => !isLocked && (setActiveEvent(evt.id), setViewMode("stages")),
            children: [
              !isLocked && /* @__PURE__ */ jsxDEV("div", { className: "event-glow" }, void 0, false, { fileName: "<stdin>", lineNumber: 1, columnNumber: 1 }),
              !isLocked && /* @__PURE__ */ jsxDEV("div", { className: "event-accent-bar" }, void 0, false, { fileName: "<stdin>", lineNumber: 1, columnNumber: 1 }),
              /* @__PURE__ */ jsxDEV("div", { style: { position: "absolute", inset: 0, opacity: 0.15, backgroundImage: `url(${evt.bg})`, backgroundSize: "cover", animation: isLocked ? "none" : "event-drift 14s ease-in-out infinite alternate" } }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 6924,
                columnNumber: 21
              }),
              /* @__PURE__ */ jsxDEV("div", { style: { position: "relative", zIndex: 10 }, children: [
                /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
                  /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.7rem", color: evt.color, fontWeight: 900, marginBottom: 5, letterSpacing: 2 }, children: evt.sub }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 6927,
                    columnNumber: 29
                  }),
                  isLocked && /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.65rem", color: "#ef4444", fontWeight: 900 }, children: [
                    "REQ LV.",
                    evt.unlockLv
                  ] }, void 0, true, {
                    fileName: "<stdin>",
                    lineNumber: 6928,
                    columnNumber: 42
                  }),
                  !isLocked && evt.id === "franchise" && /* @__PURE__ */ jsxDEV("div", { style: { background: "#facc15", color: "#000", fontSize: "0.6rem", fontWeight: 900, padding: "2px 8px", borderRadius: 4, animation: "pulse-glow 2s infinite" }, children: "RESONANCE ACTIVE" }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 6930,
                    columnNumber: 33
                  })
                ] }, void 0, true, {
                  fileName: "<stdin>",
                  lineNumber: 6926,
                  columnNumber: 25
                }),
                /* @__PURE__ */ jsxDEV("h3", { style: { margin: 0, fontSize: "1.8rem", fontWeight: 900 }, children: evt.title }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 6933,
                  columnNumber: 25
                }),
                /* @__PURE__ */ jsxDEV("p", { style: { fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.4, margin: "10px 0 12px" }, children: evt.desc }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 6934,
                  columnNumber: 25
                }),
                !isLocked && evt.tag && /* @__PURE__ */ jsxDEV("div", { style: { display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.6rem", fontWeight: 900, letterSpacing: 1, color: evt.color, background: "rgba(0,0,0,0.4)", border: `1px solid ${evt.color}44`, padding: "4px 10px", borderRadius: 20, marginBottom: 16 }, children: [
                  /* @__PURE__ */ jsxDEV("span", { className: "event-live-dot" }, void 0, false, { fileName: "<stdin>", lineNumber: 1, columnNumber: 1 }),
                  evt.tag
                ] }, void 0, true, { fileName: "<stdin>", lineNumber: 1, columnNumber: 1 }),
                !isLocked && evt.id === "franchise" && /* @__PURE__ */ jsxDEV("div", { style: { marginBottom: 15, padding: "8px", background: "rgba(250, 204, 21, 0.1)", border: "1px solid rgba(250, 204, 21, 0.2)", borderRadius: 12, fontSize: "0.65rem", display: "flex", alignItems: "center", gap: 8 }, children: [
                  /* @__PURE__ */ jsxDEV(Sparkles, { size: 12, color: "#facc15" }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 6938,
                    columnNumber: 33
                  }),
                  /* @__PURE__ */ jsxDEV("span", { style: { color: "#facc15", fontWeight: 900 }, children: [
                    "SERIES BUFF: +25% Power to ",
                    franchiseData.dailyMajor,
                    " allies."
                  ] }, void 0, true, {
                    fileName: "<stdin>",
                    lineNumber: 6939,
                    columnNumber: 33
                  })
                ] }, void 0, true, {
                  fileName: "<stdin>",
                  lineNumber: 6937,
                  columnNumber: 29
                }),
                /* @__PURE__ */ jsxDEV("button", { className: "train-btn", style: { width: "auto", padding: "10px 24px", fontSize: "0.8rem", background: isLocked ? "#334155" : "var(--primary)" }, children: isLocked ? `LOCKED: LVL ${evt.unlockLv}` : "DEPLOY SQUAD" }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 6943,
                  columnNumber: 25
                })
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 6925,
                columnNumber: 21
              })
            ]
          },
          evt.id,
          true,
          {
            fileName: "<stdin>",
            lineNumber: 6921,
            columnNumber: 17
          }
        );
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "event-card neon-hover", style: { background: "linear-gradient(135deg, rgba(250, 204, 21, 0.1), transparent)", borderRadius: 24, padding: 30, border: "1px solid #facc15", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center" }, onClick: () => {
        setActiveEvent("franchise");
        setViewMode("shop");
      }, children: /* @__PURE__ */ jsxDEV("div", { style: { position: "relative", zIndex: 10 }, children: [
        /* @__PURE__ */ jsxDEV(ShoppingBag, { size: 48, color: "#facc15", style: { marginBottom: 15 }, className: "animate-pulse" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 6953,
          columnNumber: 17
        }),
        /* @__PURE__ */ jsxDEV("h3", { style: { margin: 0, fontSize: "1.6rem", fontWeight: 900, color: "#facc15" }, children: "EXCHANGE HUB" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 6954,
          columnNumber: 17
        }),
        /* @__PURE__ */ jsxDEV("p", { style: { fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 8 }, children: "Trade Event Tokens for Elite Heroes" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 6955,
          columnNumber: 17
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 6952,
        columnNumber: 14
      }) }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 6951,
        columnNumber: 11
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "event-card neon-hover", style: { background: "linear-gradient(135deg, rgba(168, 85, 247, 0.15), transparent)", borderRadius: 24, padding: 30, border: "1px solid #a855f7", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", position: "relative", overflow: "hidden" }, onClick: () => setViewMode("ledger"), children: /* @__PURE__ */ jsxDEV("div", { style: { position: "relative", zIndex: 10 }, children: [
        /* @__PURE__ */ jsxDEV(Star, { size: 48, color: "#a855f7", style: { marginBottom: 15 }, className: "animate-pulse" }, void 0, false, { fileName: "<stdin>", lineNumber: 1, columnNumber: 1 }),
        /* @__PURE__ */ jsxDEV("h3", { style: { margin: 0, fontSize: "1.6rem", fontWeight: 900, color: "#a855f7" }, children: "VANGUARD LEDGER" }, void 0, false, { fileName: "<stdin>", lineNumber: 1, columnNumber: 1 }),
        /* @__PURE__ */ jsxDEV("p", { style: { fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 8 }, children: "Lifetime token milestones -- one-time rewards that never expire" }, void 0, true, { fileName: "<stdin>", lineNumber: 1, columnNumber: 1 }),
        MILESTONE_TIERS.some((t) => ledger.progress >= t.at && !ledger.claimed.includes(t.at)) && /* @__PURE__ */ jsxDEV("div", { style: { marginTop: 10, display: "inline-block", background: "#facc15", color: "#000", fontSize: "0.65rem", fontWeight: 900, padding: "3px 10px", borderRadius: 20, animation: "pulse-glow 1.5s infinite" }, children: "TIER READY TO CLAIM" }, void 0, false, { fileName: "<stdin>", lineNumber: 1, columnNumber: 1 })
      ] }, void 0, true, { fileName: "<stdin>", lineNumber: 1, columnNumber: 1 }) }, void 0, false, { fileName: "<stdin>", lineNumber: 1, columnNumber: 1 })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 6917,
      columnNumber: 8
    }),
    viewMode === "ledger" && /* @__PURE__ */ jsxDEV("div", { className: "animate-fadeIn", children: [
      /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }, children: [
        /* @__PURE__ */ jsxDEV("button", { className: "upgrade-btn", onClick: () => setViewMode("list"), style: { padding: "10px 20px" }, children: [
          /* @__PURE__ */ jsxDEV(ChevronLeft, { size: 16 }, void 0, false, { fileName: "<stdin>", lineNumber: 1, columnNumber: 1 }),
          " BACK"
        ] }, void 0, true, { fileName: "<stdin>", lineNumber: 1, columnNumber: 1 }),
        /* @__PURE__ */ jsxDEV("div", { style: { textAlign: "right" }, children: [
          /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.6rem", color: "#a855f7", fontWeight: 900, letterSpacing: 2 }, children: "LIFETIME TOKENS EARNED" }, void 0, false, { fileName: "<stdin>", lineNumber: 1, columnNumber: 1 }),
          /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "1.4rem", fontWeight: 900, color: "#fff" }, children: ledger.progress.toLocaleString() }, void 0, false, { fileName: "<stdin>", lineNumber: 1, columnNumber: 1 })
        ] }, void 0, true, { fileName: "<stdin>", lineNumber: 1, columnNumber: 1 })
      ] }, void 0, true, { fileName: "<stdin>", lineNumber: 1, columnNumber: 1 }),
      /* @__PURE__ */ jsxDEV("h2", { style: { margin: "0 0 6px 0", fontFamily: "Cinzel" }, children: "VANGUARD LEDGER" }, void 0, false, { fileName: "<stdin>", lineNumber: 1, columnNumber: 1 }),
      /* @__PURE__ */ jsxDEV("p", { style: { fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: 25 }, children: "Every Event Token you've ever earned counts toward these tiers -- spending tokens in the Exchange Hub never rolls this back. Clear rifts at your own pace; the ledger only moves forward." }, void 0, false, { fileName: "<stdin>", lineNumber: 1, columnNumber: 1 }),
      /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", flexDirection: "column", gap: 14 }, children: MILESTONE_TIERS.map((tier, i) => {
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
        return /* @__PURE__ */ jsxDEV("div", { className: "glass-panel", style: { padding: 20, borderRadius: 16, border: `1px solid ${isClaimed ? "rgba(74, 222, 128, 0.4)" : isReady ? "#facc15" : "rgba(255,255,255,0.1)"}`, opacity: isClaimed ? 0.6 : 1 }, children: [
          /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }, children: [
            /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.85rem", fontWeight: 900, color: isClaimed ? "#4ade80" : "#fff" }, children: tier.label }, void 0, false, { fileName: "<stdin>", lineNumber: 1, columnNumber: 1 }),
            /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.7rem", color: "#facc15", fontWeight: 800 }, children: rewardParts.join(" + ") }, void 0, false, { fileName: "<stdin>", lineNumber: 1, columnNumber: 1 })
          ] }, void 0, true, { fileName: "<stdin>", lineNumber: 1, columnNumber: 1 }),
          /* @__PURE__ */ jsxDEV("div", { className: "tech-progress-bar", style: { width: "100%", height: 8, background: "rgba(255,255,255,0.05)", marginBottom: 10 }, children: /* @__PURE__ */ jsxDEV("div", { className: "tech-progress-fill", style: { width: `${segProgress * 100}%`, background: isClaimed ? "#4ade80" : "#a855f7" } }, void 0, false, { fileName: "<stdin>", lineNumber: 1, columnNumber: 1 }) }, void 0, false, { fileName: "<stdin>", lineNumber: 1, columnNumber: 1 }),
          /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
            /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.65rem", color: "var(--text-muted)" }, children: [Math.min(ledger.progress, tier.at).toLocaleString(), " / ", tier.at.toLocaleString()] }, void 0, true, { fileName: "<stdin>", lineNumber: 1, columnNumber: 1 }),
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                className: "train-btn",
                disabled: !isReady,
                style: { width: "auto", padding: "8px 20px", fontSize: "0.75rem", background: isClaimed ? "#334155" : isReady ? "#facc15" : "#1e293b", color: isReady ? "#000" : "#fff", opacity: isClaimed ? 0.7 : 1 },
                onClick: () => claimLedgerTier(tier),
                children: isClaimed ? "CLAIMED" : isReady ? "CLAIM" : "LOCKED"
              },
              void 0,
              false,
              { fileName: "<stdin>", lineNumber: 1, columnNumber: 1 }
            )
          ] }, void 0, true, { fileName: "<stdin>", lineNumber: 1, columnNumber: 1 })
        ] }, tier.at, true, { fileName: "<stdin>", lineNumber: 1, columnNumber: 1 });
      }) }, void 0, false, { fileName: "<stdin>", lineNumber: 1, columnNumber: 1 })
    ] }, void 0, true, { fileName: "<stdin>", lineNumber: 1, columnNumber: 1 }),
    viewMode === "stages" && !activeStage && /* @__PURE__ */ jsxDEV("div", { className: "animate-fadeIn", children: [
      /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }, children: [
        /* @__PURE__ */ jsxDEV("button", { className: "upgrade-btn", onClick: () => {
          setViewMode("list");
          setActiveEvent(null);
        }, style: { padding: "10px 20px" }, children: [
          /* @__PURE__ */ jsxDEV(ChevronLeft, { size: 16 }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 6964,
            columnNumber: 142
          }),
          " BACK"
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 6964,
          columnNumber: 17
        }),
        /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", gap: 15, alignItems: "center" }, children: /* @__PURE__ */ jsxDEV("button", { className: "sb-btn confirm", style: { padding: "10px 20px", fontSize: "0.8rem", background: "#facc15", color: "#000" }, onClick: () => setViewMode("shop"), children: [
          /* @__PURE__ */ jsxDEV(ShoppingBag, { size: 14 }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 6967,
            columnNumber: 23
          }),
          " EXCHANGE"
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 6966,
          columnNumber: 20
        }) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 6965,
          columnNumber: 17
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 6963,
        columnNumber: 13
      }),
      /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", flexDirection: "column", gap: 12 }, children: generateStages(activeEvent).map((s) => {
        const isLocked = totalAccountLevel < s.unlockLv;
        return /* @__PURE__ */ jsxDEV("div", { className: `stage-card ${isLocked ? "locked" : ""}`, style: { padding: 24 }, onClick: () => !isLocked && setPendingStage(s), children: [
          /* @__PURE__ */ jsxDEV("div", { style: { flex: 1 }, children: [
            /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", alignItems: "center", gap: 12 }, children: [
              /* @__PURE__ */ jsxDEV("div", { style: { fontWeight: 900, fontSize: "1.2rem", color: isLocked ? "var(--text-muted)" : s.diff === "Hard" ? "#ef4444" : s.diff === "Expert" ? "#a855f7" : "#4ade80" }, children: s.name }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 6978,
                columnNumber: 37
              }),
              isLocked && /* @__PURE__ */ jsxDEV("div", { style: { background: "#ef4444", color: "#fff", fontSize: "0.6rem", padding: "2px 8px", borderRadius: 4, fontWeight: 900 }, children: [
                "LOCKED: ACCOUNT LV.",
                s.unlockLv
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 6979,
                columnNumber: 50
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 6977,
              columnNumber: 33
            }),
            /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 6 }, children: [
              ({ Easy: "REC: AWAKENING 2 CREW", Normal: "REC: AWAKENING 3 CREW", Hard: "REC: AWAKENING 4 / LV.90+", Expert: "REC: ENDGAME CREW" })[s.diff] || "",
              " \u2022 STAMINA_COST ",
              s.stamina
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 6981,
              columnNumber: 33
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 6976,
            columnNumber: 29
          }),
          /* @__PURE__ */ jsxDEV("div", { style: { textAlign: "right" }, children: [
            /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.65rem", fontWeight: 900, color: "#facc15" }, children: "TOKENS" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 6984,
              columnNumber: 33
            }),
            /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "1.4rem", fontWeight: 900 }, children: [
              "+",
              s.rewards.tokens
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 6985,
              columnNumber: 33
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 6983,
            columnNumber: 29
          })
        ] }, s.id, true, {
          fileName: "<stdin>",
          lineNumber: 6975,
          columnNumber: 25
        });
      }) }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 6971,
        columnNumber: 13
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 6962,
      columnNumber: 10
    }),
    pendingStage && /* @__PURE__ */ jsxDEV("div", { className: "hero-select-modal animate-fadeIn", style: { display: "flex", flexDirection: "column" }, children: [
      /* @__PURE__ */ jsxDEV("div", { className: "modal-header", children: [
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("h2", { style: { margin: 0, color: pendingStage.color || "var(--primary)" }, children: pendingStage.name }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 6998,
            columnNumber: 15
          }),
          /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.8rem", opacity: 0.7, maxWidth: "400px", marginTop: 4 }, children: [
            "Event Operation // ",
            pendingStage.diff,
            " Difficulty"
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 6999,
            columnNumber: 15
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 6997,
          columnNumber: 13
        }),
        /* @__PURE__ */ jsxDEV("button", { className: "upgrade-btn", style: { padding: "10px 20px" }, onClick: () => setPendingStage(null), children: "BACK" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 7003,
          columnNumber: 13
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 6996,
        columnNumber: 11
      }),
      /* @__PURE__ */ jsxDEV("div", { style: { background: "rgba(0,0,0,0.3)", padding: 15, borderRadius: 16, marginBottom: 20 }, children: [
        /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }, children: [
          /* @__PURE__ */ jsxDEV("h3", { style: { margin: 0, fontSize: "0.9rem", fontWeight: 900 }, children: [
            "MISSION SQUAD (",
            squadIds.length,
            "/5)"
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 7008,
            columnNumber: 16
          }),
          /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", gap: 8 }, children: [
            /* @__PURE__ */ jsxDEV("button", { className: "upgrade-btn", style: { fontSize: "0.7rem" }, onClick: () => setShowSquadBuilder(true), children: "EDIT SQUAD" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 7010,
              columnNumber: 19
            }),
            /* @__PURE__ */ jsxDEV("button", { className: "train-btn", style: { width: "auto", padding: "8px 24px", background: "#22c55e" }, disabled: squadIds.length === 0, onClick: () => startBattle(pendingStage), children: "COMMENCE OPERATION" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 7011,
              columnNumber: 19
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 7009,
            columnNumber: 16
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 7007,
          columnNumber: 13
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "squad-slots-row", style: { gridTemplateColumns: "repeat(5, 1fr)" }, children: Array.from({ length: 5 }).map((_, i) => {
          const heroId = squadIds[i];
          const c = heroId ? characters.find((h) => String(h.export_id) === String(heroId)) : null;
          return /* @__PURE__ */ jsxDEV("div", { className: `squad-member-slot ${c ? "active" : "empty"}`, onClick: () => setShowSquadBuilder(true), children: c ? /* @__PURE__ */ jsxDEV("img", { src: c.imageUrl }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 7022,
            columnNumber: 28
          }) : /* @__PURE__ */ jsxDEV(Plus, { size: 20, opacity: 0.2 }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 7022,
            columnNumber: 55
          }) }, i, false, {
            fileName: "<stdin>",
            lineNumber: 7021,
            columnNumber: 21
          });
        }) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 7016,
          columnNumber: 13
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 7006,
        columnNumber: 11
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "glass-panel", style: { padding: 25, textAlign: "center" }, children: [
        /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.75rem", fontWeight: 900, color: "#facc15", marginBottom: 10 }, children: [
          "STAMINA COST: ",
          pendingStage.stamina,
          " \u2022 ",
          ({ Easy: "AWAKENING 2 RECOMMENDED", Normal: "AWAKENING 3 RECOMMENDED", Hard: "AWAKENING 4 RECOMMENDED", Expert: "ENDGAME CREW RECOMMENDED" })[pendingStage.diff] || ""
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 7030,
          columnNumber: 14
        }),
        /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", justifyContent: "center", gap: 20 }, children: [
          /* @__PURE__ */ jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.6rem", color: "var(--text-muted)" }, children: "CURRENT SQUAD" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 7035,
              columnNumber: 20
            }),
            /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "1.2rem", fontWeight: 900, color: "#4ade80" }, children: squadIds.reduce((sum, id) => sum + calculateSubStat(characters.find((h) => String(h.export_id) === String(id)) || {}, characters, "pwr", skills), 0).toLocaleString() }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 7036,
              columnNumber: 20
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 7034,
            columnNumber: 17
          }),
          /* @__PURE__ */ jsxDEV("div", { style: { width: 1, background: "rgba(255,255,255,0.1)" } }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 7040,
            columnNumber: 17
          }),
          /* @__PURE__ */ jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.6rem", color: "var(--text-muted)" }, children: "TOKEN YIELD" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 7042,
              columnNumber: 20
            }),
            /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "1.2rem", fontWeight: 900, color: "#facc15" }, children: pendingStage.rewards.tokens.toLocaleString() }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 7043,
              columnNumber: 20
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 7041,
            columnNumber: 17
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 7033,
          columnNumber: 14
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 7029,
        columnNumber: 11
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 6995,
      columnNumber: 9
    }),
    viewMode === "shop" && /* @__PURE__ */ jsxDEV("div", { className: "animate-fadeIn", children: [
      /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }, children: [
        /* @__PURE__ */ jsxDEV("button", { className: "upgrade-btn", onClick: () => setViewMode("list"), style: { padding: "10px 20px" }, children: [
          /* @__PURE__ */ jsxDEV(ChevronLeft, { size: 16 }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 7055,
            columnNumber: 115
          }),
          " BACK"
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 7055,
          columnNumber: 17
        }),
        /* @__PURE__ */ jsxDEV("h3", { style: { margin: 0, textTransform: "uppercase", color: "#facc15", letterSpacing: 2 }, children: "THE EXCHANGE" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 7056,
          columnNumber: 17
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 7054,
        columnNumber: 13
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "inventory-grid", style: { gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 15 }, children: getShopItems().map((item, i) => {
        const isOwned = item.type === "hero" && unlockedIds.includes(item.id);
        return /* @__PURE__ */ jsxDEV("div", { className: "inventory-card", style: { border: isOwned ? "1px solid #4ade80" : "1px solid rgba(255,255,255,0.1)", background: isOwned ? "linear-gradient(135deg, rgba(74, 222, 128, 0.05), rgba(15, 23, 42, 0.9))" : "" }, children: [
          /* @__PURE__ */ jsxDEV("div", { style: { textAlign: "center", marginBottom: 15, position: "relative" }, children: [
            item.img ? /* @__PURE__ */ jsxDEV("img", { src: item.img, style: { width: "100%", aspectRatio: 1, borderRadius: 16, objectFit: "cover", border: "2px solid rgba(255,255,255,0.1)" } }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 7064,
              columnNumber: 45
            }) : /* @__PURE__ */ jsxDEV("div", { style: { height: 100, display: "flex", alignItems: "center", justifyContent: "center" }, children: item.icon }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 7064,
              columnNumber: 185
            }),
            item.rarity && /* @__PURE__ */ jsxDEV("div", { className: "tier-badge", style: { position: "absolute", top: 8, left: 8 }, children: item.rarity }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 7065,
              columnNumber: 49
            }),
            isOwned && /* @__PURE__ */ jsxDEV("div", { style: { position: "absolute", top: 5, right: 5, background: "#4ade80", color: "#000", fontSize: "0.5rem", fontWeight: 900, padding: "2px 6px", borderRadius: 4, zIndex: 10 }, children: "OWNED" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 7066,
              columnNumber: 45
            }),
            !isOwned && item.type === "hero" && /* @__PURE__ */ jsxDEV("div", { style: { position: "absolute", top: 5, right: 5, background: "#facc15", color: "#000", fontSize: "0.5rem", fontWeight: 900, padding: "2px 6px", borderRadius: 4, zIndex: 10 }, children: "NEW" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 7067,
              columnNumber: 70
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 7063,
            columnNumber: 29
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "item-name", style: { fontSize: "1rem" }, children: item.name }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 7069,
            columnNumber: 29
          }),
          /* @__PURE__ */ jsxDEV("div", { style: { marginTop: "auto", paddingTop: 15 }, children: /* @__PURE__ */ jsxDEV("button", { className: "shop-buy-btn", onClick: () => purchaseEventItem(item), style: { background: isOwned ? "linear-gradient(135deg, #4ade80, #166534)" : "linear-gradient(135deg, #facc15, #eab308)", color: isOwned ? "#fff" : "#000" }, children: [
            Math.floor(item.cost * Math.pow(1.65, eventPurchases[item.id] || 0)).toLocaleString(),
            " TOKENS"
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 7071,
            columnNumber: 33
          }) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 7070,
            columnNumber: 29
          })
        ] }, i, true, {
          fileName: "<stdin>",
          lineNumber: 7062,
          columnNumber: 25
        });
      }) }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 7058,
        columnNumber: 13
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 7053,
      columnNumber: 10
    }),
    battleState !== "IDLE" && /* @__PURE__ */ jsxDEV("div", { className: "battle-screen animate-fadeIn", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "battle-header", style: { padding: 20, background: "rgba(0,0,0,0.9)", borderBottom: "1px solid rgba(255,255,255,0.1)" }, children: [
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("h2", { style: { margin: 0, fontSize: "1.2rem", fontFamily: "MugenTitle" }, children: activeStage.name }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 7086,
            columnNumber: 21
          }),
          /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.7rem", color: "var(--text-muted)" }, children: [
            "STANCE_SYNC: ",
            /* @__PURE__ */ jsxDEV("span", { style: { color: ELEMENTS[playerElement].color }, children: playerElement }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 7087,
              columnNumber: 94
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 7087,
            columnNumber: 21
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 7085,
          columnNumber: 17
        }),
        /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", gap: 8 }, children: [
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              onClick: () => setCombatSpeed((s) => s === 1 ? 1.5 : s === 1.5 ? 2 : 1),
              className: "train-btn",
              style: { padding: "8px 12px", fontSize: "0.7rem", width: "auto", background: combatSpeed > 1 ? "var(--primary)" : "#334155" },
              children: [
                combatSpeed,
                "x"
              ]
            },
            void 0,
            true,
            {
              fileName: "<stdin>",
              lineNumber: 7090,
              columnNumber: 19
            }
          ),
          /* @__PURE__ */ jsxDEV("button", { className: "train-btn", style: { width: "auto", padding: "8px 20px", background: "#ef4444" }, onClick: () => {
            setBattleState("IDLE");
            setActiveStage(null);
            setBattleMusicActive(false);
          }, children: "ABORT OP" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 7097,
            columnNumber: 19
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 7089,
          columnNumber: 17
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 7084,
        columnNumber: 13
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "unified-stance-display", children: /* @__PURE__ */ jsxDEV(TacticalStanceRow, { currentStance: playerElement, onStanceChange: changePlayerElement }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 7102,
        columnNumber: 17
      }) }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 7101,
        columnNumber: 13
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "battle-scene", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "battle-background-layer", style: { backgroundImage: `url(${activeStage.isBoss ? "background_void.png" : "background_battle.png"})` } }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 7106,
          columnNumber: 17
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "battle-formation enemy-row", children: combatants.filter((c) => c.isEnemy).map((u) => /* @__PURE__ */ jsxDEV(BattleUnit, { unit: u, floatingDamages: floatingDamages.filter((d) => d.targetId === u.id) }, u.id, false, {
          fileName: "<stdin>",
          lineNumber: 7108,
          columnNumber: 65
        })) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 7107,
          columnNumber: 17
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "battle-formation hero-row", children: combatants.filter((c) => !c.isEnemy).map((u) => /* @__PURE__ */ jsxDEV(BattleUnit, { unit: u, floatingDamages: floatingDamages.filter((d) => d.targetId === u.id) }, u.id, false, {
          fileName: "<stdin>",
          lineNumber: 7111,
          columnNumber: 66
        })) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 7110,
          columnNumber: 17
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 7105,
        columnNumber: 13
      }),
      battleState === "INTRO" && /* @__PURE__ */ jsxDEV(
        CampaignIntro,
        {
          activeBattle: {
            name: activeStage.name,
            enemy: combatants.find((c) => c.isEnemy && c.isBoss)?.name || combatants.find((c) => c.isEnemy)?.name || "ANOMALY",
            element: combatants.find((c) => c.isEnemy)?.element || "NEUTRAL",
            bg: activeStage.isBoss ? "THE VOID" : "RIFT DISTRICT"
          },
          squad: characters.filter((c) => squadIds.map(String).includes(String(c.export_id))),
          bossImg: combatants.find((c) => c.isEnemy && c.isBoss)?.img || combatants.find((c) => c.isEnemy)?.img || "boss_void_executioner.png",
          onComplete: () => {
            setBattleState("ACTIVE");
            playSound("spar");
          }
        },
        void 0,
        false,
        {
          fileName: "<stdin>",
          lineNumber: 1,
          columnNumber: 1
        }
      ),
      battleState === "WIN" && /* @__PURE__ */ jsxDEV("div", { className: "battle-result-overlay", children: [
        /* @__PURE__ */ jsxDEV("h1", { className: "win-text", style: { fontSize: "5rem" }, children: "OP SUCCESS" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 7116,
          columnNumber: 21
        }),
        /* @__PURE__ */ jsxDEV("button", { className: "confirm-vic-btn", onClick: claimVictory, children: /* @__PURE__ */ jsxDEV("div", { className: "btn-inner", children: "RETRIEVE DATA" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 7117,
          columnNumber: 80
        }) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 7117,
          columnNumber: 21
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 7115,
        columnNumber: 17
      }),
      battleState === "LOSS" && /* @__PURE__ */ jsxDEV("div", { className: "battle-result-overlay", children: [
        /* @__PURE__ */ jsxDEV("h1", { className: "loss-text", style: { fontSize: "5rem" }, children: "SYSTEM FAILURE" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 7122,
          columnNumber: 21
        }),
        /* @__PURE__ */ jsxDEV("button", { className: "train-btn", style: { marginTop: 30, width: 240 }, onClick: () => {
          setBattleState("IDLE");
          setActiveStage(null);
          setBattleMusicActive(false);
        }, children: "BACK TO BASE" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 7123,
          columnNumber: 21
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 7121,
        columnNumber: 17
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 7083,
      columnNumber: 10
    })
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 6902,
    columnNumber: 5
  });
};;

export { EventsView };
