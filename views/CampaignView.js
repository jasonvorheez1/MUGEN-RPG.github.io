import { Fragment, jsxDEV } from "react/jsx-dev-runtime";
import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Shield,
  Users,
  Sparkles,
  ChevronRight,
  ArrowRight,
  Map as MapIcon,
  Plus
} from "lucide-react";
import { BattleUnit, VictoryScreen, getBattleStats, executeCombatSkill, TacticalStanceRow } from "../CombatSystem.js";
import { CAMPAIGN_CONTENT, ELEMENTS, LEADER_SKILLS, COSMETICS } from "../constants.js";
import { calculateStat, playSound, calculateSubStat, getTierEfficiency, applyLeaderBonus, getEnemyStatsFromCP, formatPower, applyMitigation } from "../utils.js";
import { isMobile, CampaignIntro } from "./ViewShared.js";

const CampaignView = ({
  characters,
  unlockedIds,
  credits,
  setCredits,
  gems,
  setGems,
  aura,
  setAura,
  stamina,
  setStamina,
  maxStamina,
  createFloatingText,
  campaignProgress,
  setCampaignProgress,
  setShards,
  squadIds,
  setSquadIds,
  triggerVisualEffect: triggerVisualEffect2,
  setBattleMusicActive,
  setIsVictoryMusic,
  setIsHardBattle,
  skills,
  items,
  addToInventory,
  setCharacters,
  setShowSquadBuilder,
  campaignRanks = {},
  setCampaignRanks,
  auraUpgrades = {}
}) => {
  const [activeBattle, setActiveBattle] = useState(null);
  const [battleRewards, setBattleRewards] = useState(null);
  const [battleRank, setBattleRank] = useState("C");
  const [pendingStage, setPendingStage] = useState(null);
  const [isHardMode, setIsHardMode] = useState(false);
  const [currentChapter, setCurrentChapter] = useState(null);
  const [currentArea, setCurrentArea] = useState(null);
  // Community feedback: the campaign felt like "1 stage per chapter" because opening
  // a chapter dropped you on a sector-picker instead of the stages. Auto-jump into
  // the sector holding your next stage so you land on playable content immediately.
  // The ref guards against re-jumping when the player deliberately taps the
  // breadcrumb back to the sector list, so that view stays reachable.
  const autoAreaChapterRef = useRef(null);
  useEffect(() => {
    if (!currentChapter) { autoAreaChapterRef.current = null; return; }
    if (!currentArea && autoAreaChapterRef.current !== currentChapter.id) {
      autoAreaChapterRef.current = currentChapter.id;
      const areas = currentChapter.areas || [];
      const target = areas.find((a) => a.stages.some((s) => s.id === campaignProgress))
        || areas.find((a) => a.stages.some((s) => s.id >= campaignProgress))
        || areas[0];
      if (target) setCurrentArea(target);
    }
  }, [currentChapter, currentArea, campaignProgress]);
  const [combatants, setCombatants] = useState([]);
  const [battleState, setBattleState] = useState("IDLE");
  const [battleLog, setBattleLog] = useState([]);
  const [activeSkill, setActiveSkill] = useState(null);
  const [floatingDamages, setFloatingDamages] = useState([]);
  const [playerElement, setPlayerElement] = useState("FIRE");
  const [autoBattle, setAutoBattle] = useState(false);
  const [combatSpeed, setCombatSpeed] = useState(1);
  const [markedTargetId, setMarkedTargetId] = useState(null);
  const [elementalChain, setElementalChain] = useState({ element: null, count: 0 });
  const tacticalStanceId = useRef(null);
  const changePlayerElement = (el) => {
    setPlayerElement(el);
    try {
      if (typeof triggerVisualEffect2 === "function") triggerVisualEffect2("fx_magic_circle.png", "50%", "8%", 1.2);
    } catch (e) {
    }
    const stanceSounds = {
      FIRE: "stance_fire",
      WATER: "stance_water",
      WIND: "stance_wind",
      LIGHT: "stance_light",
      DARK: "stance_dark",
      EARTH: "stance_earth"
    };
    try {
      playSound && playSound(stanceSounds[el] || "shield_up", 0.5);
    } catch (e) {
    }
    setCombatants((prev) => {
      if (!prev || prev.length === 0) return prev;
      const sid = `${el}_${Date.now()}`;
      tacticalStanceId.current = sid;
      return prev.map((u) => {
        const effects = (u.effects || []).filter((e) => e.type !== "tactical_stance");
        if (!u.isEnemy) {
          const match = String(u.element).toUpperCase() === String(el).toUpperCase();
          const val = match ? 0.25 : 0.12;
          effects.push({ type: "tactical_stance", duration: 9999, val, label: `STANCE:${el}`, meta: { stanceId: sid } });
          return { ...u, effects, tacticalStance: { element: el, val, id: sid } };
        }
        return { ...u, effects };
      });
    });
  };
  // Memoized: during an active battle this component re-renders on every 50ms tick,
  // and re-filtering the full ~400-character roster on each of those renders just to
  // pull out the squad was pure waste -- these only need to change when their inputs do.
  const squadIdSet = useMemo(() => new Set((squadIds || []).map((id) => String(id))), [squadIds]);
  const unlockedIdSet = useMemo(() => new Set((unlockedIds || []).map((id) => String(id))), [unlockedIds]);
  const squad = useMemo(() => characters.filter((c) => squadIdSet.has(String(c.export_id))), [characters, squadIdSet]);
  const autoFillSquad = () => {
    const sorted = [...characters].filter((c) => unlockedIds.includes(c.export_id)).sort((a, b) => calculateSubStat(b, characters, "pwr", skills) - calculateSubStat(a, characters, "pwr", skills)).slice(0, 5).map((c) => c.export_id);
    setSquadIds(sorted);
    playSound("equip");
    createFloatingText("Auto-Assigned Elite Squad", false, "#4ade80");
  };
  const clearSquad = () => {
    setSquadIds([]);
    playSound("ui_cancel");
  };
  const getSynergies = () => {
    const counts = {};
    const franchiseCounts = {};
    squad.forEach((c) => {
      counts[c.element] = (counts[c.element] || 0) + 1;
      if (c.franchise) franchiseCounts[c.franchise] = (franchiseCounts[c.franchise] || 0) + 1;
    });
    const active = [];
    Object.entries(counts).forEach(([el, count]) => {
      if (count >= 3) active.push({ label: `${el} RESONANCE`, desc: `3+ ${el}: +10% Stats`, color: ELEMENTS[el]?.color });
    });
    Object.entries(franchiseCounts).forEach(([fr, count]) => {
      if (count >= 3) active.push({ label: `FACTION: ${fr.toUpperCase()}`, desc: `3+ Same Series: +10% Synergy`, color: "#facc15" });
    });
    return active;
  };
  const totalSquadPWR = squad.reduce((sum, c) => sum + calculateSubStat(c, characters, "pwr", skills), 0);
  const synergies = getSynergies();
  const [raidResults, setRaidResults] = useState(null);
  const RAID_RANK_MULTS = { SSS: 1.5, SS: 1.3, S: 1.15, "S-": 1.05, "A+": 0.95, A: 0.85, "A-": 0.8, "B+": 0.72, B: 0.65, "B-": 0.6, "C+": 0.55, C: 0.5 };
  const handleRaid = (stage, count = 1) => {
    const costPerRaid = 10;
    const totalCost = costPerRaid * count;
    if (stamina < totalCost) {
      createFloatingText(`Need ${totalCost} Stamina!`, true);
      return;
    }
    setStamina((s) => s - totalCost);
    const bestRank = campaignRanks[stage.id];
    const rankMult = RAID_RANK_MULTS[bestRank] || 0.5;
    const hasPlunderer = squad.some((c) => c.relationship?.includes("Enemy") && c.bondLevel >= 10);
    const creditMult = (hasPlunderer ? 1.3 : 1.1) * rankMult;
    const hasGenerosity = squad.some((c) => c.relationship?.includes("Romantic") && c.bondLevel >= 10);
    let totalCredits = 0, totalAura = 0, totalMaterials = 0, totalEssence = 0, totalGemsGained = 0;
    const itemsGained = [];
    const junkPool = Object.keys(items || {}).filter((id) => items[id].type === "junk");
    const rewardPool = Object.keys(items || {}).filter((id) => items[id].type === "consumable" && items[id].rarity === "common");
    for (let i = 0; i < count; i++) {
      const id = stage.id;
      totalCredits   += Math.floor((stage.rewards?.credits || id * 600) * creditMult);
      totalAura      += Math.floor(id * 8 * rankMult);
      totalMaterials += Math.floor((id * 40 + Math.random() * 80) * rankMult);
      totalEssence   += Math.floor((id * 3 + 5) * rankMult);
      if (id >= 5 && Math.random() < 0.05 + (hasGenerosity ? 0.03 : 0)) {
        itemsGained.push("Summon Voucher");
        addToInventory("summon_voucher");
      }
      // XP tomes drop from raids — better tomes from deeper stages
      if (Math.random() < 0.18 * rankMult) {
        const tomeId = id >= 25 ? "xp_ultra_tome" : id >= 10 ? "xp_tome" : "xp_disc";
        if (items?.[tomeId]) { itemsGained.push(items[tomeId].name); addToInventory(tomeId); }
      }
      if (Math.random() < 0.35 && junkPool.length > 0) {
        const junkId = junkPool[Math.floor(Math.random() * junkPool.length)];
        itemsGained.push(items[junkId].name); addToInventory(junkId);
      }
      if (Math.random() < 0.15 && rewardPool.length > 0) {
        const itemId = rewardPool[Math.floor(Math.random() * rewardPool.length)];
        itemsGained.push(items[itemId].name); addToInventory(itemId);
      }
      if (Math.random() < 0.15) totalGemsGained += id >= 10 ? 3 : 1;
    }
    setCredits((c) => c + totalCredits);
    setAura((a) => a + totalAura);
    setGems((g) => g + totalGemsGained);
    const curMaterials = parseInt(localStorage.getItem("mugen_materials") || "0", 10);
    const curEssence   = parseInt(localStorage.getItem("mugen_essence")   || "0", 10);
    const nextMaterials = curMaterials + totalMaterials;
    const nextEssence   = curEssence   + totalEssence;
    localStorage.setItem("mugen_materials", String(nextMaterials));
    localStorage.setItem("mugen_essence",   String(nextEssence));
    window.dispatchEvent(new CustomEvent("mugen_materials_changed", { detail: { materials: nextMaterials, essence: nextEssence } }));
    setRaidResults({ count, stage: stage.name, credits: totalCredits, aura: totalAura, materials: totalMaterials, essence: totalEssence, gems: totalGemsGained, items: itemsGained.slice(0, 8) });
    playSound("success");
    triggerVisualEffect2("fx_sparkle.png", "50%", "50%", 1.5);
  };
  // Raids all cleared stages x10 in one click — QoL sweep for grinding sessions
  const handleSweepAll = () => {
    const allChapters = CAMPAIGN_CONTENT.flatMap((ch) => ch.areas.flatMap((a) => a.stages));
    const raidable = allChapters.filter((s) => campaignProgress > s.id && campaignRanks[s.id]);
    if (!raidable.length) { createFloatingText("No stages ready to sweep!", true); return; }
    const cost = raidable.length * 10 * 10;
    if (stamina < cost) { createFloatingText(`Need ${cost} Stamina to sweep all!`, true); return; }
    raidable.forEach((s) => handleRaid(s, 10));
    createFloatingText(`SWEPT ${raidable.length} stages!`, false, "#facc15");
  };
  const addLog = (msg) => setBattleLog((prev) => [msg, ...prev].slice(0, 10));
  const showDamage = (targetId, amount, type = "normal") => {
    const id = Math.random();
    setFloatingDamages((prev) => [...prev, { id, targetId, amount, type }]);
    setTimeout(() => setFloatingDamages((prev) => prev.filter((d) => d.id !== id)), 1e3);
  };
  const [lastSkillTimestamp, setLastSkillTimestamp] = useState(0);
  const startStage = (stage) => {
    if (!stage) return;
    if (stage.squadSizeReq && squad.length < stage.squadSizeReq) {
      createFloatingText(`Requires a FULL squad of ${stage.squadSizeReq}!`, true);
      return;
    }
    if (stage.minAvgLevel) {
      const avg = squad.reduce((sum, c) => sum + (c.level || 1), 0) / (squad.length || 1);
      if (avg < stage.minAvgLevel) {
        createFloatingText(`Squad Avg Level too low (Need Lv.${stage.minAvgLevel})`, true);
        return;
      }
    }
    if (stage.requiredRelType) {
      const hasRel = squad.some((c) => String(c.relationship || "").toLowerCase().includes(stage.requiredRelType.toLowerCase()));
      if (!hasRel) {
        createFloatingText(`Requires at least 1 hero with '${stage.requiredRelType}' status!`, true);
        return;
      }
    }
    // Softlock safety net: only enforce roster-dependent requirements that the
    // player's UNLOCKED roster can actually satisfy. If a stage asks for an
    // element/franchise no obtainable hero has (e.g. a mis-typed franchise),
    // the gate is skipped instead of permanently locking the campaign.
    const unlockedRoster = characters.filter((c) => unlockedIdSet.has(String(c.export_id)));
    const rosterCanElement = (el) => unlockedRoster.some((c) => String(c.element).toUpperCase() === String(el).toUpperCase());
    const rosterCanFranchise = (t) => {
      const target = String(t).toLowerCase().trim();
      return unlockedRoster.some((c) => {
        const f = (c.franchise || "").toLowerCase().trim();
        return f === target || f.includes(target);
      });
    };
    if (stage.requiredElement && rosterCanElement(stage.requiredElement)) {
      const hasElement = squad.some((c) => String(c.element).toUpperCase() === String(stage.requiredElement).toUpperCase());
      if (!hasElement) {
        createFloatingText(`Requirement: At least one ${stage.requiredElement} hero!`, true);
        return;
      }
    }
    if (stage.requiredFranchise && rosterCanFranchise(stage.requiredFranchise)) {
      const hasFranchise = squad.some((c) => {
        const f = (c.franchise || "").toLowerCase().trim();
        const target = stage.requiredFranchise.toLowerCase().trim();
        return f === target || f.includes(target);
      });
      if (!hasFranchise) {
        createFloatingText(`Requirement: At least one ${stage.requiredFranchise} hero!`, true);
        return;
      }
    }
    const STAGE_STAMINA_COST = 20;
    if (stamina < STAGE_STAMINA_COST) {
      createFloatingText(`Need ${STAGE_STAMINA_COST} Stamina to deploy!`, true);
      return;
    }
    const BOSS_IMAGES = [
      "boss_neon_dragon.png",
      "boss_void_executioner.png",
      "boss_subway_serpent.png",
      "boss_gilded_titan.png"
    ];
    setBattleRewards(null);
    setBattleRank("C");
    if (squadIds.length < 1) {
      createFloatingText("Need at least 1 hero!", true);
      setShowSquadBuilder(true);
      return;
    }
    setStamina((s) => s - STAGE_STAMINA_COST);
    if (campaignProgress < stage.id) {
      createFloatingText("Stage locked!", true);
      return;
    }
    setPendingStage(null);
    setActiveBattle({ ...stage, isHardMode });
    if (setBattleMusicActive) setBattleMusicActive(true);
    if (setIsHardBattle) setIsHardBattle(isHardMode);
    setBattleState("ACTIVE");
    setBattleLog([]);
    setFloatingDamages([]);
    const initialElement = stage.element === "FIRE" ? "WATER" : stage.element === "WATER" ? "WIND" : "FIRE";
    setPlayerElement(initialElement);
    setMarkedTargetId(null);
    setElementalChain({ element: null, count: 0 });
    playSound("boss_intro");
    const activeSynergies = synergies.map((s) => ({
      element: s.label.split(" ")[0],
      isFranchise: s.label.startsWith("FACTION")
    }));
    const allies = squad.map((c, i) => {
      const tierMod = getTierEfficiency(c.suggestedTier || c.tier);
      const activeAuraConfig = COSMETICS.AURAS.find((a) => a.id === (c.activeCosmetics?.aura || "none")) || COSMETICS.AURAS[0];
      const activeBorderConfig = COSMETICS.BORDERS.find((b) => b.id === (c.activeCosmetics?.border || "default")) || COSMETICS.BORDERS[0];
      const s1 = (skills || []).find((s) => s.id === c.skillId);
      return {
        id: `ally-${i}`,
        name: c.name,
        img: c.imageUrl,
        maxHp: calculateStat(c.baseStats.hp, c.level, c, characters, "hp"),
        hp: calculateStat(c.baseStats.hp, c.level, c, characters, "hp"),
        atk: calculateStat(c.baseStats.atk, c.level, c, characters, "atk"),
        magicAtk: calculateStat(c.baseStats["magic atk"] || 0, c.level, c, characters, "magic atk"),
        def: calculateStat(c.baseStats.def, c.level, c, characters, "def"),
        magicDef: calculateStat(c.baseStats["magic def"] || 0, c.level, c, characters, "magic def"),
        speed: calculateStat(c.baseStats.speed, c.level, c, characters, "speed"),
        element: c.element,
        level: c.level,
        skillId: c.skillId,
        skillId2: c.level >= 50 ? c.skillId2 : null,
        abilityLevel: c.abilityLevels?.[c.skillId] || 1,
        abilityLevel2: c.skillId2 ? c.abilityLevels?.[c.skillId2] || 1 : 1,
        abilityAwaken: c.abilityAwaken?.[c.skillId] || 0,
        abilityAwaken2: c.skillId2 ? c.abilityAwaken?.[c.skillId2] || 0 : 0,
        skillCd: 0,
        maxSkillCd: s1?.cooldown || 100,
        isEnemy: false,
        gauge: Math.random() * 30,
        burst: 0,
        activeSynergies,
        effects: [
          // Apply initial stance immediately
          { type: "tactical_stance", duration: 9999, val: c.element === initialElement ? 0.25 : 0.12, label: `STANCE:${initialElement}` }
        ],
        dead: false,
        critRate: calculateSubStat(c, characters, "crit_rate", skills, auraUpgrades) / 100,
        evasion: calculateSubStat(c, characters, "evasion", skills, auraUpgrades) / 100,
        lifesteal: 0,
        tierMod,
        cosmetics: { auraStyle: activeAuraConfig.style, borderClass: activeBorderConfig.className }
      };
    });
    const enemyCount = stage.id <= 3 ? 2 : stage.id <= 8 ? 3 : 4;
    const cpMultiplier = isHardMode ? 2 : 1;
    // Community feedback: the campaign difficulty curve walled players in the mid-game.
    // Soften the enemy stat budget to ~72% of the displayed PWR requirement (the
    // PWR_REQ shown on the map and the rewards are unchanged) so a squad that meets
    // the listed requirement comfortably clears instead of grinding an uphill wall.
    const CAMPAIGN_DIFFICULTY = 0.72;
    const totalSquadCPReq = (stage.cpReq || 1e3) * cpMultiplier * CAMPAIGN_DIFFICULTY;
    const eliteSkills = (skills || []).filter((s) => ["Rare", "Epic", "Legendary"].includes(s.rarity));
    const pickElite = (seed) => eliteSkills[seed % eliteSkills.length]?.id || "slash";
    const enemies = Array.from({ length: enemyCount }).map((_, i) => {
      const isBoss = i === 0;
      const cpShare = isBoss ? 0.65 : 0.35 / (enemyCount - 1);
      const individualCP = totalSquadCPReq * cpShare;
      const stats = getEnemyStatsFromCP(individualCP, isBoss ? "boss" : "minion");
      // Cosmetic display level only (actual difficulty comes from CP via getEnemyStatsFromCP
      // below) -- but a level-30 player seeing "LV.70" enemies in chapter 3 reads as a brutal
      // difficulty spike even when the underlying stats are fair. Track expected player pace
      // instead of stage.id*5, which blew past level 100 by stage 20.
      const enemyLevel = Math.min(100, Math.ceil(stage.id * 1.6) + 5 + (isHardMode ? 10 : 0));
      const roleSeed = stage.id * 10 + i;
      const enemyRole = i === 0 && isBoss ? "boss" : roleSeed % 3 === 0 ? "tank" : roleSeed % 3 === 1 ? "dps" : "support";
      let eliteSkills2 = (skills || []).filter((s) => ["Rare", "Epic", "Legendary"].includes(s.rarity));
      if (enemyRole === "tank") eliteSkills2 = eliteSkills2.filter((s) => s.id === "guard" || s.id === "taunt" || s.scalingStat === "def");
      if (enemyRole === "support") eliteSkills2 = eliteSkills2.filter((s) => s.type === "heal" || s.type === "buff" || s.type === "debuff");
      if (eliteSkills2.length === 0) eliteSkills2 = (skills || []).filter((s) => ["Rare", "Epic"].includes(s.rarity));
      const pickElite2 = (seed) => eliteSkills2[seed % eliteSkills2.length]?.id || "slash";
      const skillId = pickElite2(stage.id + i);
      const hasSkill2 = individualCP >= 5e5;
      let skillId2 = hasSkill2 ? pickElite2(stage.id + i + 7) : null;
      // Late-campaign bosses start showing up with an actual Signature ability as
      // their special move instead of a generic Rare/Epic/Legendary skill -- rare
      // early on, near-guaranteed by the back half of the campaign.
      if (isBoss && hasSkill2) {
        const sigChance = Math.min(0.9, stage.id / 40);
        if (Math.random() < sigChance) {
          const signaturePool = (skills || []).filter((s) => s.signature);
          const elementSignatures = signaturePool.filter((s) => {
            const owner = characters.find((c) => c.name === s.owner);
            return owner && owner.element === stage.element;
          });
          const pool = elementSignatures.length ? elementSignatures : signaturePool;
          if (pool.length) skillId2 = pool[(stage.id + i) % pool.length].id;
        }
      }
      const effects = [];
      if (isBoss) {
        effects.push({ type: "boss_presence", duration: 9999, val: 0.3, label: "UNSTOPPABLE" });
      }
      return {
        id: `enemy-${i}`,
        name: isBoss ? stage.enemy : `Minion ${String.fromCharCode(65 + i)}`,
        img: isBoss ? BOSS_IMAGES[stage.id % BOSS_IMAGES.length] : characters[(stage.id * 5 + i) % Math.max(1, characters.length)]?.imageUrl,
        ...stats,
        element: stage.element,
        level: enemyLevel,
        skillId,
        skillId2,
        abilityLevel: isBoss ? Math.min(10, Math.floor(stage.id / 2) + 1) : 1,
        abilityLevel2: isBoss ? Math.min(10, Math.floor(stage.id / 2)) : 1,
        skillCd: 0,
        skillCd2: 0,
        // Aggressive CD reduction for enemies to ensure they use skills often
        maxSkillCd: Math.max(30, 80 - stage.id * 2),
        maxSkillCd2: Math.max(50, 110 - stage.id * 2),
        isEnemy: true,
        isBoss,
        stagger: 0,
        maxStagger: isBoss ? 900 : 350,
        // Stagger is much harder to trigger, making it a major tactical window
        gauge: 20 + Math.random() * 50,
        burst: 0,
        effects,
        dead: false,
        critRate: 0.05 + stage.id * 5e-3,
        evasion: 0.05 + stage.id * 2e-3,
        lifesteal: isBoss ? 0.08 : 0
      };
    });
    const leaderId = squadIds[0];
    const leaderChar = leaderId ? characters.find((c) => String(c.export_id) === String(leaderId)) : null;
    if (leaderChar) {
      allies.forEach((a) => applyLeaderBonus(leaderChar, a, squad));
      addLog(`LEADER SKILL: ${LEADER_SKILLS.find((s) => s.id === leaderChar.leaderSkillId)?.name || "ACTIVE"}`);
    }
    const hasFastFriend = squad.some((c) => c.relationship?.includes("Friend") && c.bondLevel >= 25);
    if (hasFastFriend) {
      allies.forEach((a) => {
        a.speed = Math.floor(a.speed * 1.1);
      });
      addLog("BOND PERK: Squad Haste Active");
    }
    setCombatants([...enemies, ...allies]);
    addLog("BATTLE START!");
    setBattleState("INTRO");
    playSound("mugen_land", 0.4);
    playSound(["mugen_round", "mugen_round2", "mugen_round3"][Math.floor(Math.random() * 3)], 0.6);
    setTimeout(() => playSound("mugen_fight", 0.6), 550);
  };
  const triggerDefend = (unitId) => {
    setCombatants((prev) => {
      const next = [...prev];
      const idx = next.findIndex((u2) => u2.id === unitId);
      const u = next[idx];
      if (!u || u.dead || (u.burst || 0) < 30) return prev;
      u.burst -= 30;
      u.effects.push({ type: "shield", duration: 2, val: 0.3, label: "EMERGENCY GUARD" });
      u.effects.push({ type: "buff_def", duration: 2, val: 0.5, label: "DEF UP" });
      showDamage(u.id, "GUARD UP", "heal");
      playSound("shield_up");
      playSound("mugen_guard", 0.5);
      return next;
    });
  };
  const triggerSkill = (unitId) => {
    if (battleState !== "ACTIVE") return;
    setCombatants((prev) => {
      const u = prev.find((unit) => unit.id === unitId);
      if (!u || u.dead) return prev;
      const isLimitBreak = (u.burst || 0) >= 100;
      return executeCombatSkill({
        combatants: prev,
        attackerId: unitId,
        skills,
        playerElement,
        isLimitBreak,
        forcedTargetId: markedTargetId
      });
    });
  };
  const loopState = useRef({ autoBattle, playerElement, combatSpeed, markedTargetId, elementalChain });
  useEffect(() => {
    loopState.current = { autoBattle, playerElement, combatSpeed, markedTargetId, elementalChain };
  }, [autoBattle, playerElement, combatSpeed, markedTargetId, elementalChain]);
  React.useEffect(() => {
    if (battleState !== "ACTIVE") return;
    const timer = setInterval(() => {
      setCombatants((prev) => {
        if (!prev || prev.length === 0 || battleState !== "ACTIVE") return prev;
        const alliesAlive = prev.filter((c) => !c.isEnemy && !c.dead).length;
        const enemiesAlive = prev.filter((c) => c.isEnemy && !c.dead).length;
        if (alliesAlive === 0) {
          setBattleState("LOSS");
          playSound("defeat");
          return prev;
        }
        if (enemiesAlive === 0) {
          setBattleState("WIN");
          playSound("victory", 0.8);
          if (setIsVictoryMusic) setIsVictoryMusic(true);
          const id = activeBattle.id;
          const r = activeBattle.rewards || {};
          const allies = prev.filter((c) => !c.isEnemy);
          const avgHpPercent = allies.reduce((sum, a) => sum + a.hp / a.maxHp, 0) / allies.length;
          const score = avgHpPercent * 100;
          let earnedRank = "C";
          if (score > 98) earnedRank = "SSS";
          else if (score > 90) earnedRank = "SS";
          else if (score > 75) earnedRank = "S";
          else if (score > 60) earnedRank = "A";
          else if (score > 40) earnedRank = "B";
          setBattleRank(earnedRank);
          const isHard = activeBattle.isHardMode;
          const rewardMult = isHard ? 2 : 1;
          const randomGems = Math.random() < 0.1 ? 5 : 0;
          const materialsGained = Math.floor((id * 8 + Math.random() * 20) * rewardMult);
          const essenceGained = Math.floor(id / 3 + 1) * rewardMult;
          const itemsGained = [];
          const dropRoll = Math.random();
          if (dropRoll < 0.5 * rewardMult) {
            const junkIds = Object.keys(items || {}).filter((jid) => items[jid].type === "junk");
            if (junkIds.length) itemsGained.push(items[junkIds[Math.floor(Math.random() * junkIds.length)]].name);
          }
          if (dropRoll < 0.15 * rewardMult) itemsGained.push("Micro-Battery");
          setBattleRewards({
            credits: (r.credits || id * 500) * rewardMult,
            gems: ((r.gems || 0) + randomGems) * rewardMult,
            aura: id * 2 * rewardMult,
            materials: materialsGained,
            essence: essenceGained,
            items: itemsGained
          });
          return prev;
        }
        const next = prev.map((u) => ({ ...u, effects: [...u.effects || []] }));
        const { autoBattle: curAuto, playerElement: curEl, combatSpeed: curSpd, markedTargetId: curMarked } = loopState.current;
        next.forEach((u) => {
          if (u.dead) return;
          const stats = getBattleStats(u, curEl, u.activeSynergies || []);
          if (u.skillCd < u.maxSkillCd) u.skillCd += 1;
          if (u.skillId2 && u.skillCd2 < u.maxSkillCd2) u.skillCd2 += 1;
          let gaugeGain = stats.speed / 150 * curSpd * 1.1;
          if (curEl === "WIND" && !u.isEnemy) gaugeGain *= 1.15;
          u.gauge += Math.min(8, Math.max(0.5, gaugeGain));
          if (u.gauge >= 100) {
            u.gauge = 0;
            let incapacitated = false;
            u.effects = u.effects.filter((e) => {
              if (e.type === "burn" || e.type === "poison" || e.type === "static") {
                const dotDmg = Math.floor(u.maxHp * (e.val || 0.05));
                u.hp = Math.max(0, u.hp - dotDmg);
                setFloatingDamages((fd) => [...fd, { id: Math.random(), targetId: u.id, amount: dotDmg, type: "miss" }]);
                if (e.type === "static") u.lastAction = { targetId: u.id, msg: "GLITCH", type: "miss", time: Date.now() };
              }
              if (e.type === "regen") {
                const healAmt = Math.floor(u.maxHp * (e.val || 0.05));
                u.hp = Math.min(u.maxHp, u.hp + healAmt);
                setFloatingDamages((fd) => [...fd, { id: Math.random(), targetId: u.id, amount: healAmt, type: "heal" }]);
              }
              if (e.type === "stun" || e.type === "freeze") incapacitated = true;
              e.duration--;
              return e.duration > 0;
            });
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
            if (!incapacitated) {
              const isBurstReady = (u.burst || 0) >= 100;
              const s1Ready = u.skillCd >= u.maxSkillCd;
              const s2Ready = u.skillId2 && u.skillCd2 >= u.maxSkillCd2;
              if ((u.isEnemy || curAuto) && (s1Ready || s2Ready || isBurstReady)) {
                const nextState = executeCombatSkill({ combatants: next, attackerId: u.id, skills, playerElement: curEl, isLimitBreak: isBurstReady, forcedTargetId: !u.isEnemy ? curMarked : null });
                nextState.forEach((ns, ni) => next[ni] = ns);
              } else {
                const targets = next.filter((t) => t.isEnemy !== u.isEnemy && !t.dead && !t.effects.some((e) => e.type === "untargetable"));
                if (targets.length > 0) {
                  const taunted = targets.find((e) => e.effects.some((eff) => eff.type === "aggro"));
                  const exposed = !u.isEnemy ? targets.find((e) => e.effects.some((eff) => eff.type === "expose")) : null;
                  const marked = !u.isEnemy && curMarked ? targets.find((e) => e.id === curMarked) : null;
                  const target = taunted || exposed || marked || targets[Math.floor(Math.random() * targets.length)];
                  const tStats = getBattleStats(target, curEl);
                  if (Math.random() < tStats.evasion) {
                    u.lastAction = { targetId: target.id, amount: "MISS", type: "miss", time: Date.now() };
                  } else {
                    let dmg = Math.floor(stats.atk * (1 + stats.speed / 2e3));
                    const shield = target.effects.find((e) => e.type === "shield");
                    if (shield) dmg = Math.floor(dmg * (1 - shield.val));
                    dmg = applyMitigation(dmg, tStats.def, 1e3);
                    target.hp = Math.max(0, target.hp - dmg);
                    if (target.hp === 0) {
                      if (!target.isEnemy && target._leaderRevive) {
                        target._leaderRevive = false;
                        target.hp = 1;
                        target.lastAction = { ...target.lastAction, msg: "SAVED!" };
                      } else target.dead = true;
                    }
                    u.burst = Math.min(100, (u.burst || 0) + 10);
                    u.lastAction = { targetId: target.id, amount: dmg, type: "basic", time: Date.now() };
                    setFloatingDamages((fd) => [...fd, { id: Math.random(), targetId: target.id, amount: dmg, type: "normal" }]);
                  }
                }
              }
            } else {
              u.lastAction = { targetId: u.id, amount: 0, type: "miss", msg: "SKIP TURN", time: Date.now() };
            }
          }
        });
        return next;
      });
    }, 50);
    return () => clearInterval(timer);
  }, [battleState]);
  const handledActionTimes = useRef(/* @__PURE__ */ new Map());
  React.useEffect(() => {
    if (battleState !== "ACTIVE") {
      if (tacticalStanceId.current) {
        setCombatants((prev) => (prev || []).map((u) => {
          if (!u) return u;
          u.effects = (u.effects || []).filter((e) => e.type !== "tactical_stance");
          return u;
        }));
        tacticalStanceId.current = null;
      }
      return;
    }
    const recentCaster = combatants.find((c) => c.lastSkillTime > lastSkillTimestamp);
    if (recentCaster) {
      setLastSkillTimestamp(recentCaster.lastSkillTime);
      const skill = (skills || []).find((s) => s.id === recentCaster.skillId);
      if (skill) {
        setActiveSkill({ name: skill.name, user: recentCaster.name });
        setTimeout(() => setActiveSkill(null), 1500);
        if (skill.type === "heal") playSound("heal_spell");
        else if (skill.id === "taunt") playSound("mugen_taunt");
        else if (skill.type === "buff" || skill.id === "guard") { playSound("shield_up"); playSound("mugen_guard0", 0.5); }
        else if (skill.damageType === "magical") playSound("magic_blast");
        else if (skill.power >= 2.5) playSound("slash_heavy");
        else playSound("attack_hit");
        playSound(["mugen_hit_a", "mugen_hit_b", "mugen_hit_c", "mugen_hit_d", "mugen_hit_e"][Math.floor(Math.random() * 5)], 0.3);
        // Layer in the M.U.G.E.N spin/knife/punch flair: signatures get a knife
        // swing + the super sting, heavy hits get a swing, everything else gets
        // a randomized spin whoosh plus an old-school atk/hit punch layer.
        if (skill.signature) { playSound("knife_swing", 0.5); playSound("mugen_super", 0.45); }
        else if (skill.power >= 2.5) playSound("knife_swing", 0.5);
        else if (skill.type === "atk" || skill.type === "combo") {
          playSound("spin" + Math.floor(Math.random() * 3), 0.4);
          playSound("mugen_atk" + Math.floor(Math.random() * 5), 0.3);
        }
        if (!recentCaster.isEnemy && typeof triggerVisualEffect2 === "function") {
          triggerVisualEffect2(skill.damageType === "magical" ? "fx_magic_circle.png" : "fx_impact.png", "50%", "30%", 1.2);
        }
      }
    }
    combatants.forEach((u) => {
      if (u.lastAction && handledActionTimes.current.get(u.id) !== u.lastAction.time) {
        const txt = u.lastAction.msg ? u.lastAction.msg : u.lastAction.amount;
        showDamage(u.lastAction.targetId, txt, u.lastAction.type);
        handledActionTimes.current.set(u.id, u.lastAction.time);
        if (typeof triggerVisualEffect2 === "function") {
          const target = combatants.find((c) => c.id === u.lastAction.targetId);
          const tx = target?.isEnemy ? "50%" : "50%";
          const ty = target?.isEnemy ? "30%" : "70%";
          if (u.lastAction.type === "heal") {
            triggerVisualEffect2("fx_light_beam.png", tx, ty, 1.2);
          } else if (u.lastAction.resonated) {
            triggerVisualEffect2("fx_sparkle.png", tx, ty, 1.4);
            playSound("asset_name");
          } else if (u.lastAction.type === "crit") {
            triggerVisualEffect2("fx_explosion.png", tx, ty, 1);
            playSound("crit_hit", 0.3);
          } else if (u.lastAction.damageType === "magic") {
            triggerVisualEffect2("fx_magic_circle.png", tx, ty, 0.8);
            playSound("magic_blast", 0.2);
          } else if (u.lastAction.type === "limit_break") {
            triggerVisualEffect2("fx_ultimate_blast.png", tx, ty, 2);
            playSound("explosion", 0.5);
          } else {
            triggerVisualEffect2("fx_impact.png", tx, ty, 0.6);
            playSound("attack_hit", 0.15);
          }
          if (target?.effects?.some((e) => e.type === "burn")) triggerVisualEffect2("fx_burn.png", tx, ty, 0.4);
          if (target?.effects?.some((e) => e.type === "static")) triggerVisualEffect2("fx_lightning.png", tx, ty, 0.5);
          if (target?.effects?.some((e) => e.type === "freeze")) triggerVisualEffect2("fx_ice.png", tx, ty, 0.6);
          if (target?.effects?.some((e) => e.type === "poison")) triggerVisualEffect2("fx_poison.png", tx, ty, 0.5);
        }
      }
    });
  }, [combatants, lastSkillTimestamp, battleState]);
  const getChapterProgress = (chapter) => {
    const allStages = chapter.areas.flatMap((a) => a.stages);
    const completed = allStages.filter((s) => campaignProgress > s.id).length;
    return { completed, total: allStages.length };
  };
  const getAreaProgress = (area) => {
    const completed = area.stages.filter((s) => campaignProgress > s.id).length;
    return { completed, total: area.stages.length };
  };
  return /* @__PURE__ */ jsxDEV("div", { style: { padding: "16px 0" }, children: [
    /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }, children: [
      /* @__PURE__ */ jsxDEV("div", { children: [
        /* @__PURE__ */ jsxDEV("h2", { style: { fontWeight: 900, margin: 0, fontFamily: "Cinzel", letterSpacing: 2 }, children: "THE STREETS" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 4721,
          columnNumber: 13
        }),
        /* @__PURE__ */ jsxDEV(
          "div",
          {
            className: `campaign-mode-toggle ${isHardMode ? "nightmare" : ""}`,
            onClick: () => {
              setIsHardMode(!isHardMode);
              playSound(isHardMode ? "ui_cancel" : "glitch_hit", 0.4);
            },
            children: [
              /* @__PURE__ */ jsxDEV("div", { className: "toggle-track", children: /* @__PURE__ */ jsxDEV("div", { className: "toggle-knob" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 4727,
                columnNumber: 21
              }) }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 4726,
                columnNumber: 17
              }),
              /* @__PURE__ */ jsxDEV("div", { className: "toggle-label", children: isHardMode ? "NIGHTMARE" : "NIGHTLIFE" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 4729,
                columnNumber: 17
              }),
              isHardMode && /* @__PURE__ */ jsxDEV("div", { className: "glitch-overlay" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 4732,
                columnNumber: 32
              })
            ]
          },
          void 0,
          true,
          {
            fileName: "<stdin>",
            lineNumber: 4722,
            columnNumber: 13
          }
        )
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 4720,
        columnNumber: 9
      }),
      /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", gap: 8 }, children: /* @__PURE__ */ jsxDEV("button", { className: "sb-btn", style: { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }, onClick: () => setShowSquadBuilder(true), children: [
        /* @__PURE__ */ jsxDEV(Users, { size: 16 }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 4737,
          columnNumber: 15
        }),
        " ",
        /* @__PURE__ */ jsxDEV("span", { children: "YOUR CREW" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 4737,
          columnNumber: 35
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 4736,
        columnNumber: 13
      }) }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 4735,
        columnNumber: 9
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 4719,
      columnNumber: 7
    }),
    !activeBattle && !pendingStage && /* @__PURE__ */ jsxDEV("div", { className: "campaign-navigation animate-fadeIn", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "glass-panel aero-glass", style: { padding: "15px 25px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center", borderLeft: "5px solid var(--primary)" }, children: [
        /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", alignItems: "center", gap: 15 }, children: [
          /* @__PURE__ */ jsxDEV("div", { style: { width: 44, height: 44, borderRadius: "50%", background: "rgba(233, 69, 96, 0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)" }, children: /* @__PURE__ */ jsxDEV(MapIcon, { size: 24 }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 4748,
            columnNumber: 21
          }) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 4747,
            columnNumber: 17
          }),
          /* @__PURE__ */ jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.65rem", fontWeight: 900, color: "var(--primary)", letterSpacing: 2 }, children: "THE MAP" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 4751,
              columnNumber: 20
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "breadcrumb-nav", style: { margin: 0 }, children: [
              /* @__PURE__ */ jsxDEV("span", { className: "breadcrumb-item", style: { opacity: currentChapter || currentArea ? 0.6 : 1, color: currentChapter || currentArea ? "" : "#fff" }, onClick: () => {
                setCurrentChapter(null);
                setCurrentArea(null);
              }, children: "MUGEN CITY" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 4753,
                columnNumber: 21
              }),
              currentChapter && /* @__PURE__ */ jsxDEV(Fragment, { children: [
                /* @__PURE__ */ jsxDEV(ChevronRight, { size: 14, opacity: 0.5 }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 4758,
                  columnNumber: 25
                }),
                /* @__PURE__ */ jsxDEV("span", { className: `breadcrumb-item ${!currentArea ? "active" : ""}`, style: { color: !currentArea ? "#fff" : "" }, onClick: () => setCurrentArea(null), children: currentChapter.title.toUpperCase() }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 4759,
                  columnNumber: 25
                })
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 4757,
                columnNumber: 25
              }),
              currentArea && /* @__PURE__ */ jsxDEV(Fragment, { children: [
                /* @__PURE__ */ jsxDEV(ChevronRight, { size: 14, opacity: 0.5 }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 4766,
                  columnNumber: 25
                }),
                /* @__PURE__ */ jsxDEV("span", { className: "breadcrumb-item active", style: { color: "#fff" }, children: currentArea.name.toUpperCase() }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 4767,
                  columnNumber: 25
                })
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 4765,
                columnNumber: 25
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 4752,
              columnNumber: 20
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 4750,
            columnNumber: 17
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 4746,
          columnNumber: 14
        }),
        /* @__PURE__ */ jsxDEV("div", { style: { textAlign: "right" }, children: [
          /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.6rem", color: "#94a3b8", fontWeight: 900, letterSpacing: 1 }, children: "CITY CRED" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 4774,
            columnNumber: 17
          }),
          /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "1.2rem", fontWeight: 900, color: "#fff" }, children: [
            Math.floor(campaignProgress / 60 * 100),
            "%"
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 4775,
            columnNumber: 17
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 4773,
          columnNumber: 14
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 4745,
        columnNumber: 11
      }),
      !currentChapter && !currentArea && /* @__PURE__ */ jsxDEV("div", { className: "chapters-list", style: { display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 15 }, children: CAMPAIGN_CONTENT.map((chapter, i) => {
        const prevChapter = CAMPAIGN_CONTENT[i - 1];
        const isLocked = i > 0 && getChapterProgress(prevChapter).completed < getChapterProgress(prevChapter).total;
        const progress = getChapterProgress(chapter);
        const isCompleted = progress.completed === progress.total;
        return /* @__PURE__ */ jsxDEV(
          "div",
          {
            className: `chapter-card aero-glass ${isLocked ? "locked" : "neon-hover"}`,
            style: {
              height: "220px",
              flexDirection: "column",
              justifyContent: "flex-end",
              padding: 25,
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: isLocked ? "none" : "0 10px 30px rgba(0,0,0,0.5)"
            },
            onClick: () => !isLocked && (setCurrentChapter(chapter), playSound("ui_select")),
            children: [
              /* @__PURE__ */ jsxDEV("div", { className: "chapter-bg", style: { backgroundImage: `url(${chapter.image})`, opacity: isLocked ? 0.1 : 0.3, filter: "saturate(1.5) contrast(1.2)" } }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 4802,
                columnNumber: 21
              }),
              /* @__PURE__ */ jsxDEV("div", { className: "chapter-info", style: { position: "relative", zIndex: 10, width: "100%" }, children: [
                /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.65rem", fontWeight: 900, color: isLocked ? "#94a3b8" : "var(--primary)", letterSpacing: 3, marginBottom: 5 }, children: [
                  "DATA_NODE_0",
                  chapter.id
                ] }, void 0, true, {
                  fileName: "<stdin>",
                  lineNumber: 4804,
                  columnNumber: 23
                }),
                /* @__PURE__ */ jsxDEV("h3", { style: { fontSize: "1.8rem", fontFamily: "MugenTitle", textShadow: "0 2px 10px #000" }, children: chapter.title }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 4805,
                  columnNumber: 23
                }),
                /* @__PURE__ */ jsxDEV("p", { style: { fontSize: "0.8rem", opacity: 0.7, margin: "5px 0 15px 0", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }, children: chapter.desc }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 4806,
                  columnNumber: 23
                }),
                /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
                  /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", gap: 10 }, children: isLocked ? /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.7rem", color: "#ef4444", fontWeight: 900 }, children: "[ ACCESS_DENIED ]" }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 4811,
                    columnNumber: 33
                  }) : /* @__PURE__ */ jsxDEV(Fragment, { children: [
                    /* @__PURE__ */ jsxDEV("div", { className: "progress-pill", style: { background: "rgba(255,255,255,0.05)", borderColor: isCompleted ? "#4ade80" : "" }, children: [
                      progress.completed,
                      "/",
                      progress.total,
                      " STAGES"
                    ] }, void 0, true, {
                      fileName: "<stdin>",
                      lineNumber: 4814,
                      columnNumber: 37
                    }),
                    isCompleted && /* @__PURE__ */ jsxDEV("div", { className: "daily-reward-badge", style: { margin: 0 }, children: "CLEAR" }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 4817,
                      columnNumber: 53
                    })
                  ] }, void 0, true, {
                    fileName: "<stdin>",
                    lineNumber: 4813,
                    columnNumber: 33
                  }) }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 4809,
                    columnNumber: 26
                  }),
                  !isLocked && /* @__PURE__ */ jsxDEV(ChevronRight, { size: 20, color: "var(--primary)" }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 4821,
                    columnNumber: 40
                  })
                ] }, void 0, true, {
                  fileName: "<stdin>",
                  lineNumber: 4808,
                  columnNumber: 23
                })
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 4803,
                columnNumber: 21
              })
            ]
          },
          chapter.id,
          true,
          {
            fileName: "<stdin>",
            lineNumber: 4789,
            columnNumber: 19
          }
        );
      }) }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 4781,
        columnNumber: 13
      }),
      currentChapter && !currentArea && /* @__PURE__ */ jsxDEV("div", { className: "tech-areas-list", style: { display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 15 }, children: currentChapter.areas.map((area, i) => {
        const isLocked = campaignProgress < area.stages[0].id;
        const progress = getAreaProgress(area);
        const isDone = progress.completed === progress.total;
        return /* @__PURE__ */ jsxDEV(
          "div",
          {
            className: `tech-area-card aero-glass ${isLocked ? "locked" : "neon-hover"}`,
            style: {
              flexDirection: "column",
              alignItems: "flex-start",
              padding: 25,
              height: "180px",
              justifyContent: "space-between",
              border: `1px solid ${isDone ? "#4ade8044" : "rgba(255,255,255,0.1)"}`
            },
            onClick: () => !isLocked && (setCurrentArea(area), playSound("ui_select")),
            children: [
              /* @__PURE__ */ jsxDEV("div", { className: "chapter-bg", style: { backgroundImage: `url(nightlife_bokeh.png)`, opacity: 0.05 } }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 4852,
                columnNumber: 21
              }),
              /* @__PURE__ */ jsxDEV("div", { style: { width: "100%" }, children: [
                /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.6rem", fontWeight: 900, color: isLocked ? "#94a3b8" : "#00d2ff", letterSpacing: 2, marginBottom: 5 }, children: [
                  "SECTOR_ID: ",
                  area.id.toString().padStart(2, "0")
                ] }, void 0, true, {
                  fileName: "<stdin>",
                  lineNumber: 4854,
                  columnNumber: 25
                }),
                /* @__PURE__ */ jsxDEV("h3", { style: { margin: "0 0 10px 0", fontSize: "1.4rem", fontFamily: "Rajdhani", fontWeight: 900 }, children: area.name.toUpperCase() }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 4855,
                  columnNumber: 25
                }),
                /* @__PURE__ */ jsxDEV("div", { className: "tech-progress-bar", style: { width: "100%", height: 4, background: "rgba(255,255,255,0.05)" }, children: /* @__PURE__ */ jsxDEV("div", { className: "tech-progress-fill", style: { width: `${progress.completed / progress.total * 100}%`, background: isDone ? "#4ade80" : "#00d2ff", boxShadow: `0 0 10px ${isDone ? "#4ade80" : "#00d2ff"}` } }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 4857,
                  columnNumber: 29
                }) }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 4856,
                  columnNumber: 25
                })
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 4853,
                columnNumber: 21
              }),
              /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }, children: [
                /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.8rem", fontWeight: 900, color: isDone ? "#4ade80" : "#fff" }, children: [
                  progress.completed,
                  " / ",
                  progress.total,
                  " COMPLETION"
                ] }, void 0, true, {
                  fileName: "<stdin>",
                  lineNumber: 4862,
                  columnNumber: 24
                }),
                !isLocked && /* @__PURE__ */ jsxDEV("div", { style: { width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center" }, children: /* @__PURE__ */ jsxDEV(ArrowRight, { size: 16, color: isDone ? "#4ade80" : "#fff" }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 4865,
                  columnNumber: 201
                }) }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 4865,
                  columnNumber: 38
                })
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 4861,
                columnNumber: 21
              })
            ]
          },
          area.id,
          true,
          {
            fileName: "<stdin>",
            lineNumber: 4839,
            columnNumber: 19
          }
        );
      }) }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 4832,
        columnNumber: 13
      }),
      currentArea && (() => {
        const sweepableInArea = currentArea.stages.filter((s) => campaignProgress > s.id && campaignRanks[s.id]);
        return sweepableInArea.length > 0 && /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", justifyContent: "flex-end", marginBottom: 8, gap: 8 }, children: [
          /* @__PURE__ */ jsxDEV("span", { style: { fontSize: "0.65rem", color: "var(--text-muted)", alignSelf: "center" } , children: `${sweepableInArea.length} stages raidable` }, void 0, false, {}),
          /* @__PURE__ */ jsxDEV("button", { className: "raid-btn main", style: { background: "#facc15", color: "#000", padding: "6px 14px" }, onClick: (e) => { e.stopPropagation(); sweepableInArea.forEach((s) => handleRaid(s, 10)); createFloatingText(`SWEPT ×${sweepableInArea.length * 10}!`, false, "#facc15"); }, children: "⚡ SWEEP AREA ×10" }, void 0, false, {})
        ] }, void 0, true, {});
      })(),
      currentArea && /* @__PURE__ */ jsxDEV("div", { className: `tech-stages-list ${isHardMode ? "hard-mode" : ""}`, children: currentArea.stages.map((stage) => {
        const isLocked = campaignProgress < stage.id;
        const isCompleted = campaignProgress > stage.id;
        const isNext = !isLocked && !isCompleted;
        const bestRank = campaignRanks[stage.id];
        const canRaid = !!bestRank;
        const raidLabel = bestRank ? `${(RAID_RANK_MULTS[bestRank] || 0.5).toFixed(2)}×` : null;
        const displayCP = stage.cpReq * (isHardMode ? 2 : 1);
        return /* @__PURE__ */ jsxDEV(
          "div",
          {
            className: `tech-stage-item ${isLocked ? "locked" : ""} ${isCompleted ? "completed" : ""} ${isHardMode ? "nightmare" : ""} ${isNext ? "next-up" : ""}`,
            style: isNext ? { borderColor: ELEMENTS[stage.element].color, boxShadow: `0 0 14px ${ELEMENTS[stage.element].color}55` } : void 0,
            onClick: () => {
              if (!isLocked) {
                setPendingStage(stage);
                setShowSquadBuilder(true);
              }
            },
            children: [
              /* @__PURE__ */ jsxDEV("div", { className: "stage-id-hex", children: /* @__PURE__ */ jsxDEV("span", { style: { fontSize: "0.8rem", fontWeight: 900, color: "#fff" }, children: stage.id }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 4895,
                columnNumber: 24
              }) }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 4894,
                columnNumber: 21
              }),
              /* @__PURE__ */ jsxDEV("div", { style: { flex: 1, padding: "0 15px" }, children: [
                /* @__PURE__ */ jsxDEV("h4", { style: { margin: 0, fontSize: "1rem", color: "#fff" }, children: stage.name }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 4898,
                  columnNumber: 25
                }),
                /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", gap: 10, marginTop: 4, alignItems: "center" }, children: [
                  isNext && /* @__PURE__ */ jsxDEV("div", { className: "rank-sticker", style: { background: ELEMENTS[stage.element].color, color: "#000" }, children: "NEXT" }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 4900,
                    columnNumber: 30
                  }),
                  bestRank && /* @__PURE__ */ jsxDEV("div", { className: `rank-sticker ${bestRank === "SSS" ? "gold" : ""}`, children: bestRank }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 4900,
                    columnNumber: 42
                  }),
                  /* @__PURE__ */ jsxDEV("div", { className: "cp-pill", style: { color: totalSquadPWR < displayCP ? "#ef4444" : "#4ade80" }, children: [
                    "PWR_REQ: ",
                    formatPower(displayCP)
                  ] }, void 0, true, {
                    fileName: "<stdin>",
                    lineNumber: 4901,
                    columnNumber: 29
                  }),
                  /* @__PURE__ */ jsxDEV("div", { className: "el-tag", style: { background: ELEMENTS[stage.element].color + "22", border: `1px solid ${ELEMENTS[stage.element].color}` }, children: stage.element }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 4904,
                    columnNumber: 29
                  })
                ] }, void 0, true, {
                  fileName: "<stdin>",
                  lineNumber: 4899,
                  columnNumber: 25
                })
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 4897,
                columnNumber: 21
              }),
              /* @__PURE__ */ jsxDEV("div", { className: "stage-actions", children: isCompleted ? canRaid ? /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "flex-end" }, children: [
                raidLabel && /* @__PURE__ */ jsxDEV("span", { style: { fontSize: "0.6rem", color: "#facc15", fontWeight: 900, alignSelf: "center", marginRight: 2 }, children: raidLabel }, void 0, false, {}),
                /* @__PURE__ */ jsxDEV("button", { className: "raid-btn", onClick: (e) => { e.stopPropagation(); handleRaid(stage, 1); }, children: "×1" }, void 0, false, {}),
                /* @__PURE__ */ jsxDEV("button", { className: "raid-btn", onClick: (e) => { e.stopPropagation(); handleRaid(stage, 10); }, children: "×10" }, void 0, false, {}),
                /* @__PURE__ */ jsxDEV("button", { className: "raid-btn main", onClick: (e) => { e.stopPropagation(); handleRaid(stage, 50); }, children: "×50" }, void 0, false, {}),
                /* @__PURE__ */ jsxDEV("button", { className: "raid-btn main", style: { background: "#facc15", color: "#000" }, onClick: (e) => { e.stopPropagation(); handleRaid(stage, 100); }, children: "×100" }, void 0, false, {})
              ] }, void 0, true, {}) : /* @__PURE__ */ jsxDEV("span", { className: "clear-label", children: "SECURED" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 4918,
                columnNumber: 28
              }) : /* @__PURE__ */ jsxDEV("div", { className: "start-arrow", children: /* @__PURE__ */ jsxDEV(ChevronRight, { size: 18 }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 4921,
                columnNumber: 55
              }) }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 4921,
                columnNumber: 26
              }) }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 4910,
                columnNumber: 21
              })
            ]
          },
          stage.id,
          true,
          {
            fileName: "<stdin>",
            lineNumber: 4884,
            columnNumber: 21
          }
        );
      }) }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 4875,
        columnNumber: 13
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 4743,
      columnNumber: 9
    }),
    pendingStage && /* @__PURE__ */ jsxDEV("div", { className: "hero-select-modal animate-fadeIn", style: { display: "flex", flexDirection: "column", backgroundImage: `linear-gradient(180deg, rgba(5,5,10,0.55), rgba(5,5,10,0.92) 60%, rgba(5,5,10,0.97)), url(${pendingStage.bg || "background_battle.png"})`, backgroundSize: "cover", backgroundPosition: "center" }, children: [
      /* @__PURE__ */ jsxDEV("div", { className: "modal-header", style: { background: "rgba(10,10,16,0.55)", borderRadius: 16, padding: "10px 16px", backdropFilter: "blur(6px)" }, children: [
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("h2", { style: { margin: 0, color: ELEMENTS[pendingStage.element]?.color || "var(--primary)" }, children: pendingStage.name }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 4938,
            columnNumber: 15
          }),
          /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.8rem", opacity: 0.7, maxWidth: "400px", marginTop: 4 }, children: [
            "Target Enemy: ",
            pendingStage.enemy,
            " \u2022 Element: ",
            pendingStage.element
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 4939,
            columnNumber: 15
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 4937,
          columnNumber: 13
        }),
        /* @__PURE__ */ jsxDEV("button", { className: "upgrade-btn", style: { padding: "10px 20px" }, onClick: () => setPendingStage(null), children: "BACK" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 4943,
          columnNumber: 13
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 4936,
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
            lineNumber: 4948,
            columnNumber: 16
          }),
          /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", gap: 8 }, children: [
            /* @__PURE__ */ jsxDEV("button", { className: "upgrade-btn", style: { fontSize: "0.7rem" }, onClick: () => setShowSquadBuilder({
              element: pendingStage.requiredElement,
              franchise: pendingStage.requiredFranchise
            }), children: "EDIT SQUAD" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 4950,
              columnNumber: 19
            }),
            /* @__PURE__ */ jsxDEV("button", { className: "train-btn", style: { width: "auto", padding: "8px 24px" }, disabled: squadIds.length === 0, onClick: () => startStage(pendingStage), children: "COMMENCE MISSION" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 4954,
              columnNumber: 19
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 4949,
            columnNumber: 16
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 4947,
          columnNumber: 13
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "squad-slots-row", style: { gridTemplateColumns: "repeat(5, 1fr)" }, children: Array.from({ length: 5 }).map((_, i) => {
          const heroId = squadIds[i];
          const c = heroId ? characters.find((h) => String(h.export_id) === String(heroId)) : null;
          return /* @__PURE__ */ jsxDEV("div", { className: `squad-member-slot ${c ? "active" : "empty"}`, onClick: () => setShowSquadBuilder(true), children: c ? /* @__PURE__ */ jsxDEV("img", { src: c.imageUrl }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 4965,
            columnNumber: 28
          }) : /* @__PURE__ */ jsxDEV(Plus, { size: 20, opacity: 0.2 }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 4965,
            columnNumber: 55
          }) }, i, false, {
            fileName: "<stdin>",
            lineNumber: 4964,
            columnNumber: 21
          });
        }) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 4959,
          columnNumber: 13
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 4946,
        columnNumber: 11
      }),
      /* @__PURE__ */ jsxDEV("div", { className: `glass-panel ${isHardMode ? "nightmare-panel" : ""}`, style: { padding: 20, textAlign: "center", opacity: 0.8 }, children: [
        isHardMode && /* @__PURE__ */ jsxDEV("div", { style: { color: "#ef4444", fontWeight: 900, fontSize: "0.8rem", letterSpacing: 2, marginBottom: 5, animation: "pulse-glow 1s infinite" }, children: "NIGHTMARE DIFFICULTY" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 4973,
          columnNumber: 29
        }),
        (pendingStage.requiredElement || pendingStage.requiredFranchise || pendingStage.requiredRelType || pendingStage.minAvgLevel || pendingStage.squadSizeReq) && (() => {
          const h = React.createElement;
          const ps = pendingStage;
          const avg = squad.length ? squad.reduce((s, c) => s + (c.level || 1), 0) / squad.length : 0;
          const unlockedRoster = characters.filter((c) => unlockedIdSet.has(String(c.export_id)));
          const frMatch = (c, t) => { const f = (c.franchise || "").toLowerCase().trim(); const tt = String(t).toLowerCase().trim(); return f === tt || f.includes(tt); };
          const rosterCanFr = ps.requiredFranchise ? unlockedRoster.some((c) => frMatch(c, ps.requiredFranchise)) : true;
          const rosterCanEl = ps.requiredElement ? unlockedRoster.some((c) => String(c.element).toUpperCase() === String(ps.requiredElement).toUpperCase()) : true;
          const reqs = [];
          if (ps.squadSizeReq) reqs.push({ label: `Full squad of ${ps.squadSizeReq}`, met: squad.length >= ps.squadSizeReq });
          if (ps.minAvgLevel) reqs.push({ label: `Avg Lv.${ps.minAvgLevel}+ (now ${Math.floor(avg)})`, met: avg >= ps.minAvgLevel });
          if (ps.requiredElement) reqs.push({ label: `${ps.requiredElement} hero`, waived: !rosterCanEl, met: squad.some((c) => String(c.element).toUpperCase() === String(ps.requiredElement).toUpperCase()) });
          if (ps.requiredFranchise) reqs.push({ label: `${ps.requiredFranchise} hero`, waived: !rosterCanFr, met: squad.some((c) => frMatch(c, ps.requiredFranchise)) });
          if (ps.requiredRelType) reqs.push({ label: `${ps.requiredRelType} bond`, met: squad.some((c) => String(c.relationship || "").toLowerCase().includes(ps.requiredRelType.toLowerCase())) });
          return h("div", { style: { background: "rgba(233,69,96,0.08)", border: "1px solid var(--primary)", borderRadius: 12, padding: "10px 12px", marginBottom: 15, textAlign: "left" } },
            h("div", { style: { fontSize: "0.6rem", fontWeight: 900, color: "var(--primary)", letterSpacing: 2, marginBottom: 7 } }, "WHO'S GETTING IN"),
            h("div", { style: { display: "flex", flexWrap: "wrap", gap: 6 } }, reqs.map((r, i) => {
              const ok = r.waived || r.met;
              const col = r.waived ? "#94a3b8" : r.met ? "#4ade80" : "#f87171";
              return h("span", { key: i, style: { fontSize: "0.66rem", fontWeight: 800, padding: "3px 9px", borderRadius: 20, background: r.waived ? "rgba(148,163,184,0.12)" : r.met ? "rgba(74,222,128,0.13)" : "rgba(239,68,68,0.13)", color: col, border: "1px solid " + col + "44" } }, (r.waived ? "— " : r.met ? "✓ " : "✗ ") + r.label + (r.waived ? " (waived)" : ""));
            }))
          );
        })(),
        /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.75rem", fontWeight: 900, color: "#facc15", marginBottom: 10 }, children: [
          "RECOMMENDED POWER: ",
          (pendingStage.cpReq * (isHardMode ? 2 : 1)).toLocaleString()
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 4985,
          columnNumber: 14
        }),
        /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", justifyContent: "center", gap: 20 }, children: [
          /* @__PURE__ */ jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.6rem", color: "var(--text-muted)" }, children: "CURRENT SQUAD" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 4990,
              columnNumber: 20
            }),
            /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "1.2rem", fontWeight: 900, color: totalSquadPWR < pendingStage.cpReq * (isHardMode ? 2 : 1) ? "#ef4444" : "#4ade80" }, children: totalSquadPWR.toLocaleString() }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 4991,
              columnNumber: 20
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 4989,
            columnNumber: 17
          }),
          /* @__PURE__ */ jsxDEV("div", { style: { width: 1, background: "rgba(255,255,255,0.1)" } }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 4995,
            columnNumber: 17
          }),
          /* @__PURE__ */ jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.6rem", color: "var(--text-muted)" }, children: "WIN CHANCE" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 4997,
              columnNumber: 20
            }),
            /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "1.2rem", fontWeight: 900 }, children: [
              Math.min(100, Math.floor(totalSquadPWR / (pendingStage.cpReq * (isHardMode ? 2 : 1)) * 100)),
              "%"
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 4998,
              columnNumber: 20
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 4996,
            columnNumber: 17
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 4988,
          columnNumber: 14
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 4972,
        columnNumber: 11
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 4935,
      columnNumber: 9
    }),
    raidResults && /* @__PURE__ */ jsxDEV("div", { className: "battle-result-overlay animate-fadeIn", children: /* @__PURE__ */ jsxDEV("div", { className: "glass-panel", style: { width: "90%", maxWidth: "400px", padding: 30, textAlign: "center", borderColor: "#4ade80" }, children: [
      /* @__PURE__ */ jsxDEV("h2", { style: { margin: "0 0 5px 0", color: "#4ade80", fontSize: "1.8rem" }, children: "RAID COMPLETE" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 5010,
        columnNumber: 19
      }),
      /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: 20 }, children: [
        "Results for ",
        raidResults.count,
        "x ",
        raidResults.stage
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 5011,
        columnNumber: 19
      }),
      /* @__PURE__ */ jsxDEV("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 15, marginBottom: 25 }, children: [
        /* @__PURE__ */ jsxDEV("div", { className: "gacha-summary-stat", children: [
          /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.6rem", color: "#94a3b8" }, children: "CREDITS" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 5015,
            columnNumber: 25
          }),
          /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "1.1rem", fontWeight: 900, color: "#facc15" }, children: [
            "+$",
            raidResults.credits.toLocaleString()
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 5016,
            columnNumber: 25
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 5014,
          columnNumber: 22
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "gacha-summary-stat", children: [
          /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.6rem", color: "#94a3b8" }, children: "AURA" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 5019,
            columnNumber: 25
          }),
          /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "1.1rem", fontWeight: 900, color: "#a855f7" }, children: [
            "+",
            raidResults.aura
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 5020,
            columnNumber: 25
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 5018,
          columnNumber: 22
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "gacha-summary-stat", children: [
          /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.6rem", color: "#94a3b8" }, children: "MATERIALS" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 5023,
            columnNumber: 25
          }),
          /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "1.1rem", fontWeight: 900, color: "#94a3b8" }, children: [
            "+",
            raidResults.materials
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 5024,
            columnNumber: 25
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 5022,
          columnNumber: 22
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "gacha-summary-stat", children: [
          /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.6rem", color: "#94a3b8" }, children: "ESSENCE" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 5027,
            columnNumber: 25
          }),
          /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "1.1rem", fontWeight: 900, color: "#f97316" }, children: [
            "+",
            raidResults.essence
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 5028,
            columnNumber: 25
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 5026,
          columnNumber: 22
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "gacha-summary-stat", children: [
          /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.6rem", color: "#94a3b8" }, children: "GEMS" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 5031,
            columnNumber: 25
          }),
          /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "1.1rem", fontWeight: 900, color: "#00d2ff" }, children: [
            "+",
            raidResults.gems
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 5032,
            columnNumber: 25
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 5030,
          columnNumber: 22
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 5013,
        columnNumber: 19
      }),
      raidResults.items.length > 0 && /* @__PURE__ */ jsxDEV("div", { style: { marginBottom: 20, maxHeight: "150px", overflowY: "auto" }, className: "custom-scroll", children: [
        /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.65rem", fontWeight: 900, color: "#4ade80", marginBottom: 10 }, children: "LOOT FOUND:" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 5038,
          columnNumber: 24
        }),
        /* @__PURE__ */ jsxDEV("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }, children: raidResults.items.map((item, idx) => /* @__PURE__ */ jsxDEV("div", { style: { background: "rgba(255, 255, 255, 0.05)", padding: "6px", borderRadius: 8, fontSize: "0.7rem", fontWeight: 800, color: "#fff" }, children: [
          /* @__PURE__ */ jsxDEV(Sparkles, { size: 10, style: { marginRight: 5 } }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 5042,
            columnNumber: 31
          }),
          " ",
          item
        ] }, idx, true, {
          fileName: "<stdin>",
          lineNumber: 5041,
          columnNumber: 28
        })) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 5039,
          columnNumber: 24
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 5037,
        columnNumber: 21
      }),
      /* @__PURE__ */ jsxDEV("button", { className: "train-btn", onClick: () => setRaidResults(null), children: "CONFIRM" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 5049,
        columnNumber: 19
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 5009,
      columnNumber: 16
    }) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 5008,
      columnNumber: 13
    }),
    activeBattle && /* @__PURE__ */ jsxDEV("div", { className: "battle-screen animate-fadeIn", children: [
      activeSkill && /* @__PURE__ */ jsxDEV("div", { className: "skill-banner", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "skill-banner-text", children: activeSkill.name }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 5058,
          columnNumber: 16
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "skill-banner-sub", children: [
          "USED BY ",
          activeSkill.user
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 5059,
          columnNumber: 16
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 5057,
        columnNumber: 13
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "battle-header", style: { padding: "15px", background: "rgba(0,0,0,0.8)" }, children: [
        /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
          /* @__PURE__ */ jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDEV("h2", { style: { margin: 0, fontSize: "1.2rem", color: "#fff" }, children: "BATTLE MODE" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 5066,
              columnNumber: 21
            }),
            /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.7rem", color: "#94a3b8" }, children: [
              "TACTICAL STANCE: ",
              /* @__PURE__ */ jsxDEV("span", { style: { color: ELEMENTS[playerElement].color }, children: playerElement }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 5067,
                columnNumber: 92
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 5067,
              columnNumber: 21
            }),
            squad[0] && /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.65rem", color: "#facc15", marginTop: 4, fontWeight: 800 }, children: [
              "LEADER: ",
              LEADER_SKILLS.find((s) => s.id === squad[0].leaderSkillId)?.name || "Generic Aura"
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 5069,
              columnNumber: 25
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 5065,
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
                lineNumber: 5075,
                columnNumber: 22
              }
            ),
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                onClick: () => {
                  setAutoBattle(!autoBattle);
                  playSound(autoBattle ? "ui_cancel" : "success", 0.3);
                },
                className: `train-btn auto-btn-combat ${autoBattle ? "active" : ""}`,
                style: { padding: "8px 16px", fontSize: "0.8rem", width: "100px" },
                children: autoBattle ? "AUTO ON" : "AUTO OFF"
              },
              void 0,
              false,
              {
                fileName: "<stdin>",
                lineNumber: 5082,
                columnNumber: 22
              }
            ),
            /* @__PURE__ */ jsxDEV("button", { onClick: () => {
              if (confirm("Abandon battle?")) {
                setActiveBattle(null);
                setBattleState("IDLE");
                if (setBattleMusicActive) setBattleMusicActive(false);
              }
            }, className: "train-btn", style: { padding: "8px 16px", fontSize: "0.8rem", width: "auto", background: "#ef4444" }, children: "FLEE" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 5089,
              columnNumber: 22
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 5074,
            columnNumber: 17
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 5064,
          columnNumber: 14
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "unified-stance-display", children: [
          /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.6rem", fontWeight: 900, color: "var(--text-muted)", letterSpacing: 2 }, children: "TACTICAL_STANCE:" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 5095,
            columnNumber: 17
          }),
          /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.8rem", fontWeight: 900, color: ELEMENTS[playerElement].color }, children: [
            playerElement,
            " ",
            playerElement === "FIRE" ? "(+ATK)" : playerElement === "WATER" ? "(+DEF)" : playerElement === "WIND" ? "(+SPD)" : playerElement === "LIGHT" ? "(+HP)" : playerElement === "DARK" ? "(+CRIT)" : "(+GDRD)"
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 5096,
            columnNumber: 17
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 5094,
          columnNumber: 14
        }),
        /* @__PURE__ */ jsxDEV(TacticalStanceRow, { currentStance: playerElement, onStanceChange: changePlayerElement }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 5100,
          columnNumber: 14
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 5063,
        columnNumber: 11
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "battle-scene", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "battle-background-layer", style: { backgroundImage: `url(${activeBattle?.bg || "background_battle.png"})` } }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 5104,
          columnNumber: 14
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "battle-floor" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 5105,
          columnNumber: 14
        }),
        combatants.filter((c) => c.isEnemy && c.isBoss && !c.dead).map((boss) => /* @__PURE__ */ jsxDEV("div", { className: "boss-hp-container", children: [
          /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 2, padding: "0 10px" }, children: [
            /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "1.2rem", fontWeight: 900, color: "#fff", textShadow: "0 0 10px #000", fontFamily: "MugenTitle" }, children: boss.name }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 5111,
              columnNumber: 21
            }),
            /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.8rem", color: ELEMENTS[boss.element].color, fontWeight: 900, textTransform: "uppercase" }, children: [
              boss.element,
              " ANOMALY"
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 5112,
              columnNumber: 21
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 5110,
            columnNumber: 19
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "boss-hp-main", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "hp-fill", style: { width: `${boss.hp / boss.maxHp * 100}%`, background: "linear-gradient(90deg, #b91c1c, #ef4444)" } }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 5115,
              columnNumber: 21
            }),
            /* @__PURE__ */ jsxDEV("div", { style: { position: "absolute", inset: 0, background: "linear-gradient(transparent, rgba(255,255,255,0.1))" } }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 5116,
              columnNumber: 21
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 5114,
            columnNumber: 19
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "boss-stagger-bar", style: { transform: "skew(-15deg)", border: "none", background: "rgba(0,0,0,0.5)" }, children: /* @__PURE__ */ jsxDEV("div", { className: "stagger-fill", style: { width: `${boss.stagger / boss.maxStagger * 100}%`, background: "#facc15" } }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 5119,
            columnNumber: 21
          }) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 5118,
            columnNumber: 19
          })
        ] }, `boss-hp-${boss.id}`, true, {
          fileName: "<stdin>",
          lineNumber: 5109,
          columnNumber: 16
        })),
        /* @__PURE__ */ jsxDEV("div", { className: "battle-formation enemy-row", children: combatants.filter((c) => c.isEnemy).map((u) => /* @__PURE__ */ jsxDEV(
          BattleUnit,
          {
            unit: u,
            isMarked: markedTargetId === u.id,
            onMark: () => setMarkedTargetId(u.id),
            floatingDamages: floatingDamages.filter((d) => d.targetId === u.id)
          },
          u.id,
          false,
          {
            fileName: "<stdin>",
            lineNumber: 5126,
            columnNumber: 19
          }
        )) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 5124,
          columnNumber: 14
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "battle-formation hero-row", children: combatants.filter((c) => !c.isEnemy).map((u) => /* @__PURE__ */ jsxDEV(BattleUnit, { unit: u, floatingDamages: floatingDamages.filter((d) => d.targetId === u.id) }, u.id, false, {
          fileName: "<stdin>",
          lineNumber: 5137,
          columnNumber: 19
        })) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 5135,
          columnNumber: 14
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 5103,
        columnNumber: 11
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "skill-dock", style: { display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 10 }, children: combatants.filter((c) => !c.isEnemy).map((u, i) => {
        const skill1 = (skills || []).find((s) => s.id === u.skillId) || { id: "slash", name: "Slash", type: "atk", rarity: "Common", cooldown: 100 };
        const skill2 = u.skillId2 ? (skills || []).find((s) => s.id === u.skillId2) : null;
        const isLimitBreak = (u.burst || 0) >= 100;
        const s1Ready = (u.skillCd >= u.maxSkillCd || isLimitBreak) && !u.dead;
        const s2Ready = skill2 && (u.skillCd2 >= (u.maxSkillCd2 || 100) || isLimitBreak) && !u.dead;
        const progress1 = Math.min(100, u.skillCd / u.maxSkillCd * 100);
        const progress2 = skill2 ? Math.min(100, u.skillCd2 / (u.maxSkillCd2 || 100) * 100) : 0;
        return /* @__PURE__ */ jsxDEV("div", { style: { position: "relative", display: "flex", flexDirection: "column", gap: 4, width: "110px" }, children: [
          /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", gap: 4, height: "60px" }, children: [
            /* @__PURE__ */ jsxDEV(
              "div",
              {
                className: `skill-btn ${s1Ready ? "ready" : ""} ${u.dead ? "dead" : ""} ${isLimitBreak ? "limit-break-ready" : ""}`,
                style: { flex: 1 },
                onClick: () => s1Ready && triggerSkill(u.id),
                children: [
                  /* @__PURE__ */ jsxDEV("img", { src: u.img, className: "skill-owner-img" }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 5165,
                    columnNumber: 32
                  }),
                  !isLimitBreak && /* @__PURE__ */ jsxDEV("div", { className: "skill-fill-overlay", style: { height: `${100 - progress1}%` } }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 5166,
                    columnNumber: 50
                  }),
                  /* @__PURE__ */ jsxDEV("div", { className: "skill-label", style: { fontSize: "0.45rem" }, children: isLimitBreak ? "ULTI" : s1Ready ? "READY" : skill1.name }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 5167,
                    columnNumber: 32
                  })
                ]
              },
              void 0,
              true,
              {
                fileName: "<stdin>",
                lineNumber: 5160,
                columnNumber: 28
              }
            ),
            skill2 && /* @__PURE__ */ jsxDEV(
              "div",
              {
                className: `skill-btn ${s2Ready ? "ready" : ""} ${u.dead ? "dead" : ""} ${isLimitBreak ? "limit-break-ready" : ""}`,
                style: { flex: 1, borderColor: "#a855f7" },
                onClick: () => s2Ready && triggerSkill(u.id),
                children: [
                  /* @__PURE__ */ jsxDEV("img", { src: u.img, className: "skill-owner-img", style: { filter: "hue-rotate(280deg)" } }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 5179,
                    columnNumber: 34
                  }),
                  !isLimitBreak && /* @__PURE__ */ jsxDEV("div", { className: "skill-fill-overlay", style: { height: `${100 - progress2}%`, background: "rgba(168, 85, 247, 0.4)" } }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 5180,
                    columnNumber: 52
                  }),
                  /* @__PURE__ */ jsxDEV("div", { className: "skill-label", style: { fontSize: "0.45rem" }, children: isLimitBreak ? "ULTI" : s2Ready ? "READY" : skill2.name }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 5181,
                    columnNumber: 34
                  })
                ]
              },
              void 0,
              true,
              {
                fileName: "<stdin>",
                lineNumber: 5174,
                columnNumber: 30
              }
            )
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 5158,
            columnNumber: 25
          }),
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              className: "guard-mini-btn",
              disabled: u.dead || (u.burst || 0) < 30,
              onClick: () => triggerDefend(u.id),
              children: [
                /* @__PURE__ */ jsxDEV(Shield, { size: 10 }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 5192,
                  columnNumber: 28
                }),
                " GUARD"
              ]
            },
            void 0,
            true,
            {
              fileName: "<stdin>",
              lineNumber: 5187,
              columnNumber: 25
            }
          )
        ] }, u.id, true, {
          fileName: "<stdin>",
          lineNumber: 5157,
          columnNumber: 22
        });
      }) }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 5143,
        columnNumber: 11
      }),
      battleState === "INTRO" && /* @__PURE__ */ jsxDEV(
        CampaignIntro,
        {
          activeBattle,
          squad,
          bossImg: combatants.find((c) => c.isBoss)?.img || "boss_void_executioner.png",
          onComplete: () => {
            setBattleState("ACTIVE");
            playSound("spar");
          }
        },
        void 0,
        false,
        {
          fileName: "<stdin>",
          lineNumber: 5202,
          columnNumber: 13
        }
      ),
      battleState === "LOSS" && /* @__PURE__ */ jsxDEV("div", { className: "battle-result-overlay", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "loss-text", style: { fontSize: "4rem", fontWeight: 900 }, children: "DEFEAT" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 5215,
          columnNumber: 16
        }),
        /* @__PURE__ */ jsxDEV("button", { className: "train-btn", style: { width: "240px", marginTop: 30 }, onClick: () => {
          setActiveBattle(null);
          setBattleState("IDLE");
          if (setBattleMusicActive) setBattleMusicActive(false);
        }, children: "RETURN TO MAP" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 5216,
          columnNumber: 16
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 5214,
        columnNumber: 13
      }),
      battleState === "WIN" && battleRewards && /* @__PURE__ */ jsxDEV(
        VictoryScreen,
        {
          combatants,
          rewards: battleRewards,
          onConfirm: () => {
            const id = activeBattle.id;
            setCampaignRanks((prev) => {
              const current = prev[id];
              const order = { "SSS": 6, "SS": 5, "S": 4, "A": 3, "B": 2, "C": 1 };
              if (!current || order[battleRank] > order[current]) {
                return { ...prev, [id]: battleRank };
              }
              return prev;
            });
            if (battleRewards.credits) setCredits((c) => c + battleRewards.credits);
            if (battleRewards.gems) setGems((g) => g + battleRewards.gems);
            if (battleRewards.aura) setAura((a) => a + battleRewards.aura);
            const curMaterials = parseInt(localStorage.getItem("mugen_materials") || "0", 10);
            const curEssence = parseInt(localStorage.getItem("mugen_essence") || "0", 10);
            const nextMaterials = curMaterials + (battleRewards.materials || 0);
            const nextEssence = curEssence + (battleRewards.essence || 0);
            localStorage.setItem("mugen_materials", String(nextMaterials));
            localStorage.setItem("mugen_essence", String(nextEssence));
            window.dispatchEvent(new CustomEvent("mugen_materials_changed", {
              detail: { materials: nextMaterials, essence: nextEssence }
            }));
            if (battleRewards.items && battleRewards.items.length > 0) {
              battleRewards.items.forEach((itName) => {
                const foundId = Object.keys(items).find((k) => items[k].name === itName);
                if (foundId) addToInventory(foundId);
              });
            }
            setCampaignProgress(Math.max(campaignProgress, id + 1));
            setActiveBattle(null);
            setBattleState("IDLE");
            setBattleRewards(null);
            if (setBattleMusicActive) setBattleMusicActive(false);
            if (setIsVictoryMusic) setIsVictoryMusic(false);
          }
        },
        void 0,
        false,
        {
          fileName: "<stdin>",
          lineNumber: 5225,
          columnNumber: 14
        }
      )
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 5055,
      columnNumber: 9
    })
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 4718,
    columnNumber: 5
  });
};;

export { CampaignView };
