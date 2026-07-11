import { Fragment, jsxDEV } from "react/jsx-dev-runtime";
import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Shield,
  Users,
  Star,
  Info,
  Plus
} from "lucide-react";
import { BattleUnit, VictoryScreen, getBattleStats, executeCombatSkill, TacticalStanceRow, applyStatusTick, resolveBasicAttack, getCastAnimMs, getLungeMs, getBasicAttackMs, HITSTOP_BUFFER_MS, ProjectileLayer } from "../CombatSystem.js";
import { ELEMENTS, TIER_STATS, BOSS_ROSTER, EQUIPMENT } from "../constants.js";
import { calculateStat, playSound, calculateSubStat, applyLeaderBonus, getEnemyStatsFromCP, formatPower, applyMitigation, SIGNATURE_BONUS, incrementCourierFieldBattles, getDominantSpecialKey, SPECIAL_ARCHETYPE_NAMES, getGaugeGain, getGearPassives, rollEnemyGear, seededRandom } from "../utils.js";
import { CampaignIntro } from "./ViewShared.js";

// Arena league tiers — pure presentation, derived from rank. Gives the ladder the
// Bronze→Master arc players expect from arena modes (Disney Heroes / CRK style).
const ARENA_TIERS = [
  { min: 80, name: "MASTER", color: "#f472b6", emblem: "♛" },
  { min: 55, name: "DIAMOND", color: "#a5b4fc", emblem: "◆" },
  { min: 35, name: "PLATINUM", color: "#67e8f9", emblem: "⬡" },
  { min: 20, name: "GOLD", color: "#facc15", emblem: "★" },
  { min: 10, name: "SILVER", color: "#cbd5e1", emblem: "▲" },
  { min: 1, name: "BRONZE", color: "#cd7f32", emblem: "●" }
];
const getArenaTier = (rank) => ARENA_TIERS.find((t) => rank >= t.min) || ARENA_TIERS[ARENA_TIERS.length - 1];

// Arena-specific intro: both squads presented as full lineups (not a lone boss),
// tier emblem, then a VS clash. ~5.5s, skippable by tap.
const ArenaIntro = ({ squad, enemies, rank, onComplete }) => {
  const h = React.createElement;
  const [phase, setPhase] = useState(0);
  const doneRef = useRef(false);
  const finish = () => { if (!doneRef.current) { doneRef.current = true; onComplete(); } };
  const tier = getArenaTier(rank);
  useEffect(() => {
    playSound("riser", 0.4);
    const ts = [
      setTimeout(() => { setPhase(1); playSound("summon_start", 0.5); }, 900),
      setTimeout(() => { setPhase(2); playSound("boss_intro", 0.7); }, 2300),
      setTimeout(() => { setPhase(3); playSound("intro_boom", 1); playSound("slash_heavy", 0.4); }, 3700),
      setTimeout(() => { setPhase(4); playSound("hype_start", 0.9); }, 4800),
      setTimeout(finish, 5600)
    ];
    return () => ts.forEach(clearTimeout);
  }, []);
  const portraitRow = (units, side) => h("div", { className: `arena-intro-row ${side === "left" ? "animate-slideInLeft" : "animate-slideInRight"}`, style: { display: "flex", gap: 18, justifyContent: "center" } },
    units.slice(0, 3).map((u, i) => {
      const col = ELEMENTS[u.element]?.color || "#fff";
      return h("div", { key: i, className: "arena-intro-portrait", style: { animationDelay: `${i * 0.12}s`, textAlign: "center" } },
        h("img", { src: u.img || u.imageUrl, style: {
          width: 110, height: 110, borderRadius: 16, objectFit: "cover",
          border: `4px solid ${side === "left" ? col : "#ef4444"}`,
          boxShadow: `0 0 30px ${side === "left" ? col : "#ef4444"}88`
        } }),
        h("div", { style: { marginTop: 8, fontWeight: 900, fontSize: "0.8rem", color: "#fff", textShadow: "0 2px 6px #000" } }, u.name),
        h("div", { style: { fontSize: "0.6rem", fontWeight: 800, color: side === "left" ? col : "#fca5a5" } }, `LV.${u.level || "?"}`)
      );
    })
  );
  return h("div", { className: "campaign-intro-overlay", style: { background: "#05030c" }, onClick: finish },
    h("div", { className: "anime-speed-lines", style: { opacity: phase >= 1 ? 0.25 : 0 } }),
    phase === 0 && h("div", { className: "animate-popIn", style: { textAlign: "center", zIndex: 10 } },
      h("div", { style: { fontSize: "4rem", color: tier.color, textShadow: `0 0 40px ${tier.color}` } }, tier.emblem),
      h("h1", { style: { fontSize: "4rem", fontFamily: "MugenTitle", color: "#fff", margin: "6px 0", letterSpacing: 4 } }, "THE ARENA"),
      h("div", { style: { color: tier.color, fontWeight: 900, letterSpacing: 6, fontSize: "1rem" } }, `${tier.name} LEAGUE • RANK ${rank}`)
    ),
    phase === 1 && h("div", { style: { textAlign: "center", zIndex: 10 } },
      h("div", { style: { color: "#60a5fa", fontWeight: 900, letterSpacing: 5, fontSize: "0.9rem", marginBottom: 24 } }, "YOUR CREW"),
      portraitRow(squad, "left")
    ),
    phase === 2 && h("div", { style: { textAlign: "center", zIndex: 10 } },
      h("div", { style: { color: "#ef4444", fontWeight: 900, letterSpacing: 5, fontSize: "0.9rem", marginBottom: 24 } }, "CHALLENGERS"),
      portraitRow(enemies, "right"),
      h("div", { className: "intro-flash" })
    ),
    phase === 3 && h("div", { className: "intro-vs-container", style: { gap: 0 } },
      h("div", { className: "intro-side player-side animate-slideInLeft", style: { background: "linear-gradient(90deg, rgba(59,130,246,0.4), transparent)", height: "100vh", justifyContent: "center" } },
        h("img", { src: squad[0]?.imageUrl || squad[0]?.img, style: { width: "80%", height: "60%", objectFit: "contain" } })),
      h("div", { style: { position: "absolute", zIndex: 50, textAlign: "center" } },
        h("div", { className: "vs-large animate-popIn", style: { fontSize: "9rem", textShadow: `0 0 50px ${tier.color}` } }, "VS")),
      h("div", { className: "intro-side enemy-side animate-slideInRight", style: { background: "linear-gradient(-90deg, rgba(239,68,68,0.4), transparent)", height: "100vh", justifyContent: "center" } },
        h("img", { src: enemies[0]?.img, style: { width: "80%", height: "60%", objectFit: "contain" } })),
      h("div", { className: "intro-slash", style: { height: 100, background: "#fff" } })
    ),
    phase === 4 && h("div", { style: { textAlign: "center", zIndex: 100 } },
      h("div", { className: "animate-popIn intro-boss-name-huge", style: { fontSize: "10rem", fontStyle: "italic", color: "#fff", textShadow: `0 0 80px ${tier.color}` } }, "FIGHT!"),
      h("div", { className: "intro-flash", style: { animationDuration: "0.2s" } })
    ),
    h("div", { style: { position: "absolute", bottom: 18, width: "100%", textAlign: "center", fontSize: "0.6rem", color: "rgba(255,255,255,0.35)", letterSpacing: 2 } }, "TAP TO SKIP")
  );
};

const TrialsView = ({
  onWorldTimeStop,
  characters = [],
  unlockedIds = [],
  createFloatingText = () => {
  },
  squadIds = [],
  setSquadIds,
  clearedTrials = [],
  setClearedTrials,
  setGems,
  setAura,
  stamina,
  setStamina,
  setBattleMusicActive,
  setIsVictoryMusic,
  setIsHardBattle,
  triggerVisualEffect: triggerVisualEffect2,
  endlessFloor = 1,
  setEndlessFloor,
  arenaRank = 1,
  setArenaRank,
  setCredits,
  setMaterials,
  setEssence,
  skills,
  setShowSquadBuilder,
  auraUpgrades = {},
  setCharacters
}) => {
  const [pendingTrial, setPendingTrial] = useState(null);
  const [activeTrial, setActiveTrial] = useState(null);
  const [combatants, setCombatants] = useState([]);
  const [battleState, setBattleState] = useState("IDLE");
  const [activeSkill, setActiveSkill] = useState(null);
  const [floatingDamages, setFloatingDamages] = useState([]);
  const [playerElement, setPlayerElement] = useState("FIRE");
  const [autoBattle, setAutoBattle] = useState(true);
  const [combatSpeed, setCombatSpeed] = useState(1.5);
  const [activeTab, setActiveTab] = useState("endless");
  const [lastSkillTimestamp, setLastSkillTimestamp] = useState(0);
  const [arenaScouted, setArenaScouted] = useState(null);
  // KO cut-in: fires whenever any unit dies mid-battle for a short banner.
  const [koEvent, setKoEvent] = useState(null);
  const deadIdsRef = useRef(new Set());
  // THE WORLD -- see CampaignView's identical ref for why this exists.
  const timeStopHandledRef = useRef({});
  // Cinematic hold -- see CampaignView's identical ref. Freezes the whole
  // simulation for exactly as long as the current cast's animation plays, so
  // nothing else can act (or even fill gauge) mid-ability.
  const hitStopUntil = useRef(0);
  const battleSceneRef = useRef(null);
  useEffect(() => {
    if (battleState !== "ACTIVE") { deadIdsRef.current = new Set(); return; }
    const newlyDead = combatants.filter((c) => c.dead && !deadIdsRef.current.has(c.id));
    if (newlyDead.length) {
      newlyDead.forEach((c) => deadIdsRef.current.add(c.id));
      const u = newlyDead[newlyDead.length - 1];
      setKoEvent({ id: u.id, name: u.name, img: u.img, isEnemy: u.isEnemy, time: Date.now() });
      playSound(u.isEnemy ? "heavenly_hit" : "mugen_land", 0.5);
      setTimeout(() => setKoEvent((k) => (k && k.id === u.id ? null : k)), 1500);
    }
  }, [combatants, battleState]);
  const [arenaWinStreak, setArenaWinStreak] = useState(() => parseInt(localStorage.getItem("mugen_arena_streak") || "0", 10));
  useEffect(() => {
    localStorage.setItem("mugen_arena_streak", arenaWinStreak.toString());
  }, [arenaWinStreak]);
  const ARENA_WINS_PER_RANK = 3;
  useEffect(() => {
    if (squadIds.length === 0) setShowSquadBuilder(true);
  }, []);
  const tacticalStanceId = useRef(null);
  const changePlayerElement = (el) => {
    setPlayerElement(el);
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
      tacticalStanceId.current = `${el}_${Date.now()}`;
      return prev.map((u) => {
        u.effects = (u.effects || []).filter((e) => e.type !== "tactical_stance");
        if (!u.isEnemy) {
          const match = String(u.element).toUpperCase() === String(el).toUpperCase();
          const val = match ? 0.25 : 0.12;
          u.effects.push({ type: "tactical_stance", duration: 9999, val, label: `STANCE:${el}`, meta: { stanceId: tacticalStanceId.current } });
        }
        return u;
      });
    });
  };
  const extractFranchise = (c) => {
    if (!c) return null;
    const raw = c.franchise || c.metadata && (c.metadata.franchise || c.metadata.franchise_name) || c.tags && (c.tags.franchise || c.tags.franchise_name) || null;
    if (!raw) return null;
    return String(raw).trim();
  };
  const allFranchises = Array.from(
    new Set(
      characters.map((c) => extractFranchise(c)).filter(Boolean)
    )
  );
  const franchiseCounts = characters.reduce((m, c) => {
    const f = extractFranchise(c) || "Minor";
    m[f] = (m[f] || 0) + 1;
    return m;
  }, {});
  const eligibleFranchises = allFranchises.filter((f) => (franchiseCounts[f] || 0) >= 3);
  const minorFranchiseChars = characters.filter((c) => {
    const f = extractFranchise(c);
    return !f || (franchiseCounts[f] || 0) < 3;
  });
  const baseElementTrials = Object.keys(ELEMENTS).map((el) => ({
    baseId: `trial_el_${el}`,
    name: `${ELEMENTS[el].name} Singularity`,
    desc: `A dimensional void echoing with concentrated ${ELEMENTS[el].name} energy. Only resonators of the same element can fully synchronize.`,
    element: el,
    baseCp: 25e7,
    baseRewards: { gems: 5e4, aura: 5e3, essence: 500, materials: 2500 },
    type: "element"
  }));
  // BUGFIX: this used to assign each franchise trial an unrelated element by
  // fixed index (i % elements), completely independent of what that franchise
  // -- or the player's owned roster -- actually contains. If the player never
  // unlocked ANY character of that arbitrary element anywhere in their whole
  // account, the trial's dual requirement (franchise member + that element)
  // could never be satisfied by any squad, permanently softlocking that trial.
  // Fix: derive the element requirement from the player's OWNED members of
  // that same franchise (the most common element among them) -- so a squad
  // member who already satisfies the franchise requirement typically also
  // satisfies the element one, and the requirement is dropped entirely (no
  // element restriction) if the player hasn't unlocked anyone from the
  // franchise yet, rather than baking in a possibly-unownable element.
  const ownedFranchiseElement = (f) => {
    const owned = characters.filter((c) => extractFranchise(c) === f && unlockedIds.includes(c.export_id));
    if (!owned.length) return null;
    const counts = {};
    owned.forEach((c) => { counts[c.element] = (counts[c.element] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  };
  const baseFranchiseTrials = eligibleFranchises.map((f, i) => ({
    baseId: `trial_fr_${f.replace(/\s+/g, "_")}`,
    name: `${f} Paradox`,
    desc: `The collective destiny of the ${f} universe manifested as a trial of pure strength. Only those from the same origin can enter.`,
    franchise: f,
    element: ownedFranchiseElement(f) || undefined,
    baseCp: 5e8 + i * 1e8,
    baseRewards: { gems: 15e4, aura: 15e3, essence: 1500, materials: 1e4 },
    type: "franchise"
  }));
  if (minorFranchiseChars.length > 0) {
    baseFranchiseTrials.push({
      baseId: `trial_fr_wildcard_series`,
      name: `Wildcard Series Paradox`,
      desc: `A convergence of minor dimensions and forgotten worlds. Only those from low-population franchises can synchronize here.`,
      isWildcard: true,
      element: "DARK",
      baseCp: 8e6,
      baseRewards: { gems: 3e4, aura: 3500, essence: 350, materials: 1500 },
      type: "franchise"
    });
  }
  const DIFFICULTY_CONFIG = {
    easy: { cpMult: 0.6, rewardMult: 0.5, label: "Easy" },
    medium: { cpMult: 1, rewardMult: 1, label: "Medium" },
    hard: { cpMult: 1.6, rewardMult: 1.6, label: "Hard" },
    expert: { cpMult: 2.5, rewardMult: 3, label: "Expert" }
  };
  const trials = [
    ...baseElementTrials.flatMap((bt) => Object.keys(DIFFICULTY_CONFIG).map((d) => {
      const cfg = DIFFICULTY_CONFIG[d];
      return {
        id: `${bt.baseId}_${d}`,
        baseId: bt.baseId,
        difficulty: d,
        difficultyLabel: cfg.label,
        name: `${bt.name} (${cfg.label})`,
        baseName: bt.name,
        desc: bt.desc,
        element: bt.element,
        cpReq: Math.floor(bt.baseCp * cfg.cpMult),
        rewards: {
          gems: Math.floor(bt.baseRewards.gems * cfg.rewardMult),
          aura: Math.floor(bt.baseRewards.aura * cfg.rewardMult),
          essence: Math.floor(bt.baseRewards.essence * cfg.rewardMult),
          materials: Math.floor(bt.baseRewards.materials * cfg.rewardMult)
        },
        type: bt.type
      };
    })),
    ...baseFranchiseTrials.flatMap((bt) => Object.keys(DIFFICULTY_CONFIG).map((d) => {
      const cfg = DIFFICULTY_CONFIG[d];
      return {
        id: `${bt.baseId}_${d}`,
        baseId: bt.baseId,
        difficulty: d,
        difficultyLabel: cfg.label,
        name: `${bt.name} (${cfg.label})`,
        baseName: bt.name,
        desc: bt.desc,
        franchise: bt.franchise,
        element: bt.element,
        cpReq: Math.floor(bt.baseCp * cfg.cpMult),
        rewards: {
          gems: Math.floor(bt.baseRewards.gems * cfg.rewardMult),
          aura: Math.floor(bt.baseRewards.aura * cfg.rewardMult),
          essence: Math.floor(bt.baseRewards.essence * cfg.rewardMult),
          materials: Math.floor(bt.baseRewards.materials * cfg.rewardMult)
        },
        type: bt.type
      };
    }))
  ];
  const groupedTrials = React.useMemo(() => {
    const groups = {};
    trials.forEach((t) => {
      if (!groups[t.baseId]) {
        groups[t.baseId] = {
          baseId: t.baseId,
          name: t.baseName,
          desc: t.desc,
          element: t.element,
          franchise: t.franchise,
          type: t.type,
          variants: []
        };
      }
      groups[t.baseId].variants.push(t);
    });
    Object.values(groups).forEach((g) => {
      const order = { "easy": 1, "medium": 2, "hard": 3, "expert": 4 };
      g.variants.sort((a, b) => order[a.difficulty] - order[b.difficulty]);
    });
    return Object.values(groups);
  }, [trials.length]);
  const toggleTrialSquadMember = (rawId) => {
    const id = String(rawId);
    setSquadIds((prev) => {
      const prevStr = prev.map((x) => String(x));
      if (prevStr.includes(id)) return prev.filter((x) => String(x) !== id);
      if (prev.length >= 5) {
        createFloatingText("Trial squad full (5)!", true);
        return prev;
      }
      return [...prev, id];
    });
  };
  const showDamage = (targetId, amount, type = "normal") => {
    const id = Math.random();
    setFloatingDamages((prev) => [...prev, { id, targetId, amount, type }]);
    setTimeout(() => setFloatingDamages((prev) => prev.filter((d) => d.id !== id)), 1e3);
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
      return next;
    });
  };
  const triggerSkill = (unitId) => {
    if (battleState !== "ACTIVE") return;
    // Respect the same cinematic hold the auto-tick loop honors -- otherwise a
    // manually-controlled ally can fire a skill mid-animation while another
    // unit's cast is still playing.
    if (Date.now() < hitStopUntil.current) return;
    setCombatants((prev) => {
      const u = prev.find((unit) => unit.id === unitId);
      if (!u || u.dead) return prev;
      const isLimitBreak = (u.burst || 0) >= 100;
      const nextState = executeCombatSkill({
        combatants: prev,
        attackerId: unitId,
        skills,
        playerElement,
        isLimitBreak
      });
      const casterAfter = nextState.find((n) => n.id === unitId);
      const castMs = getCastAnimMs(casterAfter?.lastCastAnim);
      if (castMs) hitStopUntil.current = Date.now() + castMs + HITSTOP_BUFFER_MS;
      return nextState;
    });
  };
  const startTrial = (trial) => {
    const squad = characters.filter((c) => (squadIds || []).some((id) => String(id) === String(c.export_id)));
    if (!squad || squad.length < 1) {
      return createFloatingText("Select at least 1 hero!", true);
    }
    // Softlock safety net (matches CampaignView.startStage): only enforce a
    // roster-dependent requirement if the player's UNLOCKED roster can actually
    // satisfy it at all. Otherwise the gate is skipped instead of permanently
    // blocking the trial -- mirrors the "waived" state shown in the WHO'S
    // GETTING IN chip panel above, so the UI and the actual gate agree.
    const unlockedRoster = characters.filter((c) => unlockedIds.includes(c.export_id));
    if (trial.franchise) {
      const rosterCanFranchise = unlockedRoster.some((c) => {
        const f = extractFranchise(c);
        if (!f) return false;
        const fLow = f.toLowerCase().trim();
        const targetLow = String(trial.franchise).toLowerCase().trim();
        return fLow === targetLow || fLow.includes(targetLow);
      });
      if (rosterCanFranchise) {
        const franchiseMembers = squad.filter((c) => {
          const f = extractFranchise(c);
          if (!f) return false;
          const fLow = f.toLowerCase().trim();
          const targetLow = String(trial.franchise).toLowerCase().trim();
          return fLow === targetLow || fLow.includes(targetLow);
        });
        if (franchiseMembers.length < 1) {
          return createFloatingText(`Requires at least 1 hero from ${trial.franchise}!`, true);
        }
      }
    }
    if (trial.isWildcard) {
      const rosterCanWildcard = unlockedRoster.some((c) => { const f = extractFranchise(c) || "Minor"; return !f || (franchiseCounts[f] || 0) < 3; });
      if (rosterCanWildcard) {
        const minorMembers = squad.filter((c) => {
          const f = extractFranchise(c) || "Minor";
          return !f || (franchiseCounts[f] || 0) < 3;
        });
        if (minorMembers.length < 1) {
          return createFloatingText(`Requires at least 1 Wildcard Hero (Series with < 3 chars)!`, true);
        }
      }
    }
    if (trial.element) {
      const elementMembers = squad.filter((c) => String(c.element).toUpperCase() === String(trial.element).toUpperCase());
      if (elementMembers.length < 1) {
        return createFloatingText(`Requires at least 1 ${trial.element} hero!`, true);
      }
    }
    const TRIAL_COST = 50;
    if (stamina < TRIAL_COST) {
      return createFloatingText(`Need ${TRIAL_COST} Stamina for Trial!`, true);
    }
    setStamina((s) => s - TRIAL_COST);
    setActiveTrial(trial);
    setPendingTrial(null);
    setBattleState("INTRO");
    playSound("mugen_land", 0.4);
    playSound(["mugen_round", "mugen_round2", "mugen_round3"][Math.floor(Math.random() * 3)], 0.6);
    setTimeout(() => playSound("mugen_fight", 0.6), 550);
    if (typeof setBattleMusicActive === "function") setBattleMusicActive(true);
    if (typeof setIsHardBattle === "function") setIsHardBattle(trial.difficulty === "hard" || trial.difficulty === "expert" || trial.type === "endless");
    const allies = squad.map((c, i) => {
      const initialStanceVal = c.element === playerElement ? 0.25 : 0.12;
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
        franchise: c.franchise,
        level: c.level,
        skillId: c.skillId,
        skillId2: c.level >= 50 ? c.skillId2 : null,
        abilityLevel: c.abilityLevels?.[c.skillId] || 1,
        abilityLevel2: c.skillId2 ? c.abilityLevels?.[c.skillId2] || 1 : 1,
        abilityAwaken: c.abilityAwaken?.[c.skillId] || 0,
        abilityAwaken2: c.skillId2 ? c.abilityAwaken?.[c.skillId2] || 0 : 0,
        skillCd: 0,
        maxSkillCd: skills.find((s) => s.id === c.skillId)?.cooldown || 100,
        // Slot-2 cooldowns were never initialized for allies here, so equipped
        // signatures/second skills never aged toward ready on their own timer.
        skillCd2: 0,
        maxSkillCd2: c.skillId2 ? skills.find((s) => s.id === c.skillId2)?.cooldown || 100 : 0,
        isEnemy: false,
        special: c.special,
        equipSlots: c.equipSlots,
        gauge: Math.random() * 50,
        burst: 0,
        effects: [
          { type: "tactical_stance", duration: 9999, val: initialStanceVal, label: `STANCE:${playerElement}` }
        ],
        dead: false,
        critRate: calculateSubStat(c, characters, "crit_rate", skills, auraUpgrades) / 100,
        evasion: calculateSubStat(c, characters, "evasion", skills, auraUpgrades) / 100,
        lifesteal: 0
      };
    });
    const difficultyScale = trial.difficulty === "easy" ? 0.75 : trial.difficulty === "hard" ? 1.25 : 1;
    const rewardScale = trial.difficulty === "easy" ? 0.6 : trial.difficulty === "hard" ? 2 : 1;
    // Real named bosses (BOSS_ROSTER) instead of a generic reskin -- picked
    // deterministically from the trial id so a given trial always fights the
    // same boss. Hard/Expert trials summon the boss's duo partner too, so their
    // signature's team-up attack (META.duo_partner) can actually fire.
    const bossPick = BOSS_ROSTER[Math.abs(trial.id.length + trial.id.charCodeAt(0)) % BOSS_ROSTER.length];
    const isDuoTrial = trial.difficulty === "hard" || trial.difficulty === "expert";
    const bossEntries = isDuoTrial ? [bossPick, BOSS_ROSTER.find((b) => b.name === bossPick.duoPartner) || bossPick] : [bossPick];
    const cpShares = bossEntries.length === 2 ? [0.62, 0.38] : [1];
    const findBossSig = (name) => (skills || []).find((s) => s.signature && s.owner === name);
    const eliteSkills = (skills || []).filter((s) => ["Rare", "Epic", "Legendary"].includes(s.rarity));
    const pickElite = (seed) => eliteSkills[seed % eliteSkills.length]?.id || "slash";
    // Trial bosses roll real gear from the same EQUIPMENT catalog the player
    // pulls from -- tier scales with difficulty so an Expert boss is
    // meaningfully better-geared than an Easy one. Visible in the confirm
    // screen's "SCOUT GEAR" panel before the player commits.
    const bossGearTier = { easy: 1, medium: 2, hard: 3, expert: 4 }[trial.difficulty] ?? 2;
    // Seeded by the trial's own id so the SCOUT GEAR preview shown on the
    // confirm screen (see pendingTrial render below) rolls this EXACT loadout
    // -- what you scout is what you fight, not just a flavor sample.
    const bossGearRoll = seededRandom(trial.id + "_gear");
    const enemies = bossEntries.map((bossDef, i) => {
      const bossStats = getEnemyStatsFromCP(trial.cpReq * difficultyScale * cpShares[i], "boss");
      const sig = findBossSig(bossDef.name);
      return {
        id: `trial-boss-${i}`,
        name: bossDef.name,
        img: bossDef.img,
        ...bossStats,
        element: bossDef.element,
        level: 100,
        _equippedGear: rollEnemyGear(bossGearTier, bossGearRoll),
        skillId: pickElite(trial.cpReq + i * 7),
        skillId2: sig ? sig.id : pickElite(trial.cpReq + 13 + i),
        abilityLevel: trial.difficulty === "hard" ? 12 : trial.difficulty === "easy" ? 6 : 10,
        abilityLevel2: trial.difficulty === "hard" ? 12 : trial.difficulty === "easy" ? 6 : 10,
        skillCd: 0,
        skillCd2: 0,
        // Trial bosses are relentless
        maxSkillCd: 35,
        maxSkillCd2: 55,
        isEnemy: true,
        isBoss: i === 0,
        stagger: 0,
        maxStagger: 1500,
        gauge: 90 - i * 20,
        burst: 0,
        effects: [{ type: "shield", duration: Math.max(3, Math.floor(10 * difficultyScale)), val: 0.4 * difficultyScale, label: "TITAN SHIELD" }],
        dead: false,
        critRate: 0.05,
        evasion: 0.05,
        lifesteal: 0
      };
    });
    setActiveTrial({ ...trial, scaledRewards: {
      gems: Math.floor((trial.rewards?.gems || 0) * rewardScale),
      aura: Math.floor((trial.rewards?.aura || 0) * rewardScale),
      essence: Math.floor((trial.rewards?.essence || 0) * rewardScale),
      materials: Math.floor((trial.rewards?.materials || 0) * rewardScale)
    } });
    const leaderId = squadIds[0];
    const leaderChar = leaderId ? characters.find((c) => String(c.export_id) === String(leaderId)) : null;
    if (leaderChar) {
      allies.forEach((a) => applyLeaderBonus(leaderChar, a, squad));
    }
    setCombatants([...enemies, ...allies]);
  };
  // Arena: a scouted 3v3 ladder, not a single hand-tuned boss. Unlike every other
  // Trial here, opponent CP is computed RELATIVE to the player's own chosen 3-hero
  // squad PWR (not a fixed absolute curve) -- this is what keeps it from going stale
  // as the player grows: a static curve gets trivial fast since real squad power
  // (levels + refinement + leader/synergy bonuses) compounds far faster than any
  // hand-picked anchor. Rank 1 starts as a fair fight against your own current
  // strength; Rank 100 demands a squad several times stronger than what it took to
  // get there. Opponents are real named characters (Rank A-SS, occasionally a lower
  // tier -- their combat stats come entirely from the CP budget below, not their own
  // base stats, so a low-tier pick still hits exactly as hard as the rank demands)
  // and the pool is weighted toward characters that own a Signature ability so those
  // kits show up far more often than their natural drop odds would suggest. Climbing
  // a full rank takes ARENA_WINS_PER_RANK wins, not one -- a single win nudges the
  // promotion meter instead of insta-promoting.
  const buildArenaMatchup = (avgAllyStats, rank, usedIds) => {
    const signatureOwners = new Set((skills || []).filter((s) => s.signature).map((s) => s.owner));
    const tierValue = (c) => TIER_STATS[c.tier]?.multiplier || 1;
    const highTierPool = characters.filter((c) => tierValue(c) >= 1.8);
    const lowTierPool = characters.filter((c) => tierValue(c) < 1.8);
    const sigHigh = highTierPool.filter((c) => signatureOwners.has(c.name));
    const otherHigh = highTierPool.filter((c) => !signatureOwners.has(c.name));
    const sigLow = lowTierPool.filter((c) => signatureOwners.has(c.name));
    const otherLow = lowTierPool.filter((c) => !signatureOwners.has(c.name));
    const pickFrom = (arr) => arr.length ? arr[Math.floor(Math.random() * arr.length)] : null;
    const pickOpponent = () => {
      // ~80% chance of a Rank A-SS pick, ~20% chance of a lower-tier underdog
      // (still scaled to full arena strength via CP, not their own base stats).
      const wantLow = Math.random() < 0.2;
      const order = wantLow ? [sigLow, sigHigh, otherLow, otherHigh] : [sigHigh, sigLow, otherHigh, otherLow];
      for (const pool of order) {
        const avail = pool.filter((c) => !usedIds.has(c.export_id));
        const pick = pickFrom(avail);
        if (pick) {
          usedIds.add(pick.export_id);
          return pick;
        }
      }
      return characters[Math.floor(Math.random() * characters.length)];
    };
    const abilityLevel = Math.min(15, 1 + Math.floor(rank / 7));
    const abilityAwaken = Math.min(5, Math.floor(rank / 20));
    const eliteSkills = (skills || []).filter((s) => ["Rare", "Epic", "Legendary"].includes(s.rarity));
    const pickElite = (seed) => eliteSkills[seed % eliteSkills.length]?.id || "slash";
    // Stat multipliers vs average ally: rank1 = slightly below ally, rank100 = far above.
    // Derived from actual ally HP/ATK/DEF so the combat formula 1000/(1000+def) always
    // produces a meaningful mitigation value regardless of player progression.
    const t = Math.max(0, rank - 1) / 99;
    const hpMult  = 3  + t * 12;   // rank1: 3× ally HP,  rank100: 15× (very long fights)
    const atkMult = 0.6 + t * 1.4; // rank1: 0.6× ally ATK, rank100: 2.0×
    const defMult = 0.4 + t * 1.4; // rank1: 0.4× ally DEF, rank100: 1.8×
    const spdMult = 0.7 + t * 0.8; // rank1: 0.7× ally SPD, rank100: 1.5×
    const bossScales = [1.5, 0.65, 0.65]; // boss is beefier, two minions are lighter
    const ARCHETYPES = ["tank", "elite", "elite"];
    return ARCHETYPES.map((archetype, i) => {
      const champ = pickOpponent();
      const scale = bossScales[i] ?? 0.65;
      const stats = {
        hp:       Math.floor(avgAllyStats.hp    * hpMult  * scale),
        atk:      Math.floor(avgAllyStats.atk   * atkMult * scale),
        def:      Math.floor(avgAllyStats.def   * defMult * scale),
        magicAtk: Math.floor(avgAllyStats.atk   * atkMult * scale * 0.75),
        magicDef: Math.floor(avgAllyStats.def   * defMult * scale * 0.75),
        speed:    Math.floor(avgAllyStats.speed * spdMult * scale),
      };
      const hasSig = signatureOwners.has(champ.name);
      const sigSkill = hasSig ? (skills || []).find((s) => s.signature && s.owner === champ.name) : null;
      const skillId = champ.skillId || pickElite(rank + i);
      const skillId2 = sigSkill ? sigSkill.id : pickElite(rank + i + 11);
      const skill1 = (skills || []).find((s) => s.id === skillId);
      const skill2 = (skills || []).find((s) => s.id === skillId2);
      return {
        id: `arena-${i}-${Math.random().toString(36).slice(2, 8)}`,
        name: champ.name,
        img: champ.imageUrl,
        ...stats,
        maxHp: stats.hp,
        element: champ.element,
        level: 30 + Math.round(70 * Math.min(1, Math.max(0, rank - 1) / 99)),
        // Arena opponents roll gear from the same catalog the player does,
        // scaled by rank (Bronze mostly Common, Master reaching Mythic) --
        // scoutable pre-match via the "SCOUT GEAR" panel below.
        _equippedGear: rollEnemyGear(Math.min(4, Math.floor(rank / 25))),
        skillId,
        skillId2,
        abilityLevel,
        abilityLevel2: abilityLevel,
        abilityAwaken,
        abilityAwaken2: abilityAwaken,
        skillCd: 0,
        skillCd2: 0,
        maxSkillCd: 45,
        maxSkillCd2: 65,
        isEnemy: true,
        isBoss: i === 0,
        stagger: 0,
        maxStagger: i === 0 ? 2200 : 900,
        gauge: 40 + Math.random() * 40,
        burst: 0,
        effects: [
          { type: "regen", duration: 9999, val: 0.015, label: "ARENA RESILIENCE" }
        ],
        dead: false,
        critRate: 0.05 + rank * 1e-3,
        evasion: 0.04 + rank * 5e-4,
        lifesteal: i === 0 ? 0.05 : 0,
        previewSkill1: skill1 ? { name: skill1.name, signature: !!skill1.signature, rarity: skill1.rarity } : null,
        previewSkill2: skill2 ? { name: skill2.name, signature: !!skill2.signature, rarity: skill2.rarity } : null
      };
    });
  };
  const scoutArenaOpponents = () => {
    const squad = characters.filter((c) => (squadIds || []).some((id) => String(id) === String(c.export_id))).slice(0, 3);
    if (!squad || squad.length < 1) {
      return createFloatingText("Select at least 1 hero for Arena (3v3)!", true);
    }
    const n = Math.max(1, squad.length);
    const avgAllyStats = squad.reduce((acc, c) => {
      acc.hp    += calculateStat(c.baseStats.hp,                     c.level, c, characters, "hp");
      acc.atk   += calculateStat(c.baseStats.atk,                    c.level, c, characters, "atk");
      acc.def   += calculateStat(c.baseStats.def,                    c.level, c, characters, "def");
      acc.speed += calculateStat(c.baseStats.speed,                  c.level, c, characters, "speed");
      return acc;
    }, { hp: 0, atk: 0, def: 0, speed: 0 });
    avgAllyStats.hp    /= n;
    avgAllyStats.atk   /= n;
    avgAllyStats.def   /= n;
    avgAllyStats.speed /= n;
    const usedIds = new Set();
    const matchups = [0, 1, 2].map(() => buildArenaMatchup(avgAllyStats, arenaRank, usedIds));
    setArenaScouted({ matchups, avgAllyStats });
    playSound("ui_cancel");
  };
  const startArenaMatchup = (enemies) => {
    const squad = characters.filter((c) => (squadIds || []).some((id) => String(id) === String(c.export_id))).slice(0, 3);
    if (!squad || squad.length < 1) {
      return createFloatingText("Select at least 1 hero for Arena (3v3)!", true);
    }
    const ARENA_COST = 75;
    if (stamina < ARENA_COST) {
      return createFloatingText(`Need ${ARENA_COST} Stamina for Arena!`, true);
    }
    setStamina((s) => s - ARENA_COST);
    setActiveTrial({
      id: `arena_${arenaRank}_${Date.now()}`,
      name: `Arena Rank ${arenaRank}`,
      element: enemies[0].element,
      type: "arena",
      rewards: {},
      scaledRewards: {
        gems: 20 + Math.floor(arenaRank * 2.5),
        materials: 200 + arenaRank * 25,
        essence: 10 + Math.floor(arenaRank / 2),
        aura: arenaRank * 5
      }
    });
    setArenaScouted(null);
    setPendingTrial(null);
    setBattleState("INTRO");
    playSound("mugen_land", 0.4);
    playSound(["mugen_round", "mugen_round2", "mugen_round3"][Math.floor(Math.random() * 3)], 0.6);
    setTimeout(() => playSound("mugen_fight", 0.6), 550);
    if (typeof setBattleMusicActive === "function") setBattleMusicActive(true);
    if (typeof setIsHardBattle === "function") setIsHardBattle(true);
    const allies = squad.map((c, i) => {
      const initialStanceVal = c.element === playerElement ? 0.25 : 0.12;
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
        franchise: c.franchise,
        level: c.level,
        skillId: c.skillId,
        skillId2: c.level >= 50 ? c.skillId2 : null,
        abilityLevel: c.abilityLevels?.[c.skillId] || 1,
        abilityLevel2: c.skillId2 ? c.abilityLevels?.[c.skillId2] || 1 : 1,
        abilityAwaken: c.abilityAwaken?.[c.skillId] || 0,
        abilityAwaken2: c.skillId2 ? c.abilityAwaken?.[c.skillId2] || 0 : 0,
        skillCd: 0,
        maxSkillCd: skills.find((s) => s.id === c.skillId)?.cooldown || 100,
        // Slot-2 cooldowns were never initialized for allies here, so equipped
        // signatures/second skills never aged toward ready on their own timer.
        skillCd2: 0,
        maxSkillCd2: c.skillId2 ? skills.find((s) => s.id === c.skillId2)?.cooldown || 100 : 0,
        isEnemy: false,
        special: c.special,
        equipSlots: c.equipSlots,
        gauge: Math.random() * 50,
        burst: 0,
        effects: [
          { type: "tactical_stance", duration: 9999, val: initialStanceVal, label: `STANCE:${playerElement}` }
        ],
        dead: false,
        critRate: calculateSubStat(c, characters, "crit_rate", skills, auraUpgrades) / 100,
        evasion: calculateSubStat(c, characters, "evasion", skills, auraUpgrades) / 100,
        lifesteal: 0
      };
    });
    const leaderId = squadIds[0];
    const leaderChar = leaderId ? characters.find((c) => String(c.export_id) === String(leaderId)) : null;
    if (leaderChar) {
      allies.forEach((a) => applyLeaderBonus(leaderChar, a, squad));
    }
    setCombatants([...enemies, ...allies]);
  };
  React.useEffect(() => {
    if (battleState !== "ACTIVE") return;
    const timer = setInterval(() => {
      setCombatants((prev) => {
        if (!prev || prev.length === 0 || battleState !== "ACTIVE") return prev;
        // HIT-STOP: freeze the simulation for a beat after heavy impacts / while
        // a cast animation plays -- see hitStopUntil sets below.
        if (Date.now() < hitStopUntil.current) return prev;
        const alliesAlive = prev.filter((c) => !c.isEnemy && !c.dead).length;
        const enemiesAlive = prev.filter((c) => c.isEnemy && !c.dead).length;
        if (alliesAlive === 0) {
          setBattleState("LOSS");
          return prev;
        }
        if (enemiesAlive === 0) {
          setBattleState("WIN");
          playSound("victory", 0.8);
          if (setIsVictoryMusic) setIsVictoryMusic(true);
          incrementCourierFieldBattles(setCharacters, prev);
          return prev;
        }
        const next = prev.map((u) => ({ ...u, effects: [...u.effects || []] }));
        const curAuto = autoBattle;
        const curEl = playerElement;
        const curSpd = combatSpeed;
        // Speed rebalance: shared with Campaign/Events -- see utils.js getGaugeGain.
        const battleSpeeds = next.filter((u) => !u.dead).map((u) => getBattleStats(u, curEl, u.activeSynergies || []).speed);
        next.forEach((u) => {
          if (u.dead) return;
          const stats = getBattleStats(u, curEl, u.activeSynergies || []);
          if (u.skillCd < u.maxSkillCd) u.skillCd += 1;
          if (u.skillId2 && u.skillCd2 < u.maxSkillCd2) u.skillCd2 += 1;
          u.gauge += getGaugeGain(stats.speed, battleSpeeds, curSpd);
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
            if (!incapacitated) {
              const isBurstReady = (u.burst || 0) >= 100;
              const s1Ready = u.skillCd >= u.maxSkillCd;
              const s2Ready = u.skillId2 && u.skillCd2 >= u.maxSkillCd2;
              if ((u.isEnemy || curAuto) && (s1Ready || s2Ready || isBurstReady)) {
                const nextState = executeCombatSkill({ combatants: next, attackerId: u.id, skills, playerElement: curEl, isLimitBreak: isBurstReady });
                nextState.forEach((ns, ni) => next[ni] = ns);
                const casterAfter = next.find((n) => n.id === u.id);
                if (casterAfter?._triggeredTimeStopAt && timeStopHandledRef.current[u.id] !== casterAfter._triggeredTimeStopAt) {
                  timeStopHandledRef.current[u.id] = casterAfter._triggeredTimeStopAt;
                  if (typeof onWorldTimeStop === "function") onWorldTimeStop(casterAfter._timeStopMusicMs || 5000);
                }
                const castMs = getCastAnimMs(casterAfter?.lastCastAnim);
                if (castMs) hitStopUntil.current = Date.now() + castMs + HITSTOP_BUFFER_MS;
              } else {
                const result = resolveBasicAttack({ attacker: u, allUnits: next, playerElement: curEl });
                if (result) {
                  hitStopUntil.current = Date.now() + getBasicAttackMs(result.meleeAir) + HITSTOP_BUFFER_MS;
                  if (!result.missed) {
                    if (!u.isEnemy) { u._battleDamage = (u._battleDamage || 0) + result.amount; u._battleBestHit = Math.max(u._battleBestHit || 0, result.amount); }
                    setFloatingDamages((fd) => [...fd, { id: Math.random(), targetId: result.targetId, amount: result.amount, type: "normal" }]);
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
  }, [battleState, playerElement, autoBattle, combatSpeed]);
  const handledActionTimes = useRef(/* @__PURE__ */ new Map());
  React.useEffect(() => {
    if (battleState !== "ACTIVE") return;
    const recentCaster = combatants.find((c) => c.lastSkillTime > lastSkillTimestamp);
    if (recentCaster) {
      setLastSkillTimestamp(recentCaster.lastSkillTime);
      // Resolve the skills that ACTUALLY fired this cast (lastSkillIds) — reading
      // skillId alone hid every slot-2 / signature cast behind the slot-1 name.
      const castIds = Array.isArray(recentCaster.lastSkillIds) && recentCaster.lastSkillIds.length
        ? recentCaster.lastSkillIds
        : [recentCaster.skillId];
      const castSkills = castIds.map((id) => (skills || []).find((s) => s.id === id)).filter(Boolean);
      const skill = castSkills.find((s) => s.signature) || castSkills[0];
      if (skill) {
        setActiveSkill({ name: skill.name, user: recentCaster.name, signature: !!skill.signature, img: recentCaster.img, isEnemy: !!recentCaster.isEnemy, element: recentCaster.element });
        setTimeout(() => setActiveSkill(null), skill.signature ? 2200 : 1500);
        if (skill.type === "heal") playSound("heal_spell");
        else if (skill.id === "taunt") playSound("mugen_taunt");
        else if (skill.damageType === "magical") playSound("magic_blast");
        else playSound("attack_hit");
        if (skill.signature) { playSound("knife_swing", 0.5); playSound("mugen_super", 0.45); }
        else if (skill.power >= 2.5) playSound("knife_swing", 0.5);
        else if (skill.type === "atk" || skill.type === "combo") {
          playSound("spin" + Math.floor(Math.random() * 3), 0.4);
          playSound("mugen_atk" + Math.floor(Math.random() * 5), 0.3);
          const swipePool = skill.damageType === "magical" ? ["act_lunge_magic", "act_whoosh1", "act_whoosh2"] : ["act_swipe1", "act_swipe2", "act_swipe3", "act_swipe4", "act_lunge_generic"];
          playSound(swipePool[Math.floor(Math.random() * swipePool.length)], 0.35);
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
            triggerVisualEffect2("fx_light_beam.png", tx, ty, 1.5);
          } else if (u.lastAction.type === "crit") {
            triggerVisualEffect2("fx_explosion.png", tx, ty, 1.2);
          } else if (u.lastAction.damageType === "magic") {
            triggerVisualEffect2("fx_magic_circle.png", tx, ty, 1);
          } else {
            triggerVisualEffect2("fx_impact.png", tx, ty, 0.7);
          }
        }
      }
    });
  }, [combatants, lastSkillTimestamp, battleState]);
  const finishTrial = () => {
    if (battleState === "WIN") {
      const isFirst = !clearedTrials.includes(activeTrial.id);
      if (activeTrial.type === "endless") {
        setEndlessFloor((f) => f + 1);
        if (activeTrial.scaledRewards) {
          const r = activeTrial.scaledRewards;
          setGems((g) => g + (r.gems || 0));
          setMaterials((s) => s + (r.materials || 0));
          setEssence((e) => e + (r.essence || 0));
          createFloatingText(`FLOOR CLEARED!`, false, "#ef4444");
        }
      } else if (activeTrial.type === "arena") {
        setArenaWinStreak((streak) => {
          const next = streak + 1;
          if (next >= ARENA_WINS_PER_RANK) {
            setArenaRank((r) => r + 1);
            createFloatingText(`PROMOTED TO RANK ${arenaRank + 1}!`, false, "#facc15");
            return 0;
          }
          createFloatingText(`ARENA WIN! (${next}/${ARENA_WINS_PER_RANK} to promotion)`, false, "#facc15");
          return next;
        });
        if (activeTrial.scaledRewards) {
          const r = activeTrial.scaledRewards;
          setGems((g) => g + (r.gems || 0));
          setMaterials((s) => s + (r.materials || 0));
          setEssence((e) => e + (r.essence || 0));
          setAura((a) => a + (r.aura || 0));
        }
      } else if (isFirst) {
        setClearedTrials((prev) => [...prev, activeTrial.id]);
        setGems((g) => g + (activeTrial.scaledRewards?.gems || activeTrial.rewards.gems));
        setAura((a) => a + (activeTrial.scaledRewards?.aura || activeTrial.rewards.aura));
        createFloatingText(`TRIAL CLEARED!`, false, "#4ade80");
      }
      playSound("menu_open");
    }
    setBattleState("IDLE");
    setActiveTrial(null);
    setBattleMusicActive(false);
  };
  const statsSummary = useMemo(() => {
    return characters.reduce((acc, c) => {
      if (!unlockedIds.includes(c.export_id)) return acc;
      acc.totalLvl += c.level;
      acc.totalBond += c.bondLevel;
      acc.count++;
      return acc;
    }, { totalLvl: 0, totalBond: 0, count: 0 });
  }, [characters, unlockedIds]);
  return /* @__PURE__ */ jsxDEV("div", { style: { padding: "16px 0" }, children: [
    /* @__PURE__ */ jsxDEV("div", { className: "glass-panel", style: { marginBottom: 20, padding: "12px 20px", display: "flex", justifyContent: "space-around", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.05)" }, children: [
      /* @__PURE__ */ jsxDEV("div", { style: { textAlign: "center" }, children: [
        /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.6rem", color: "var(--text-muted)", fontWeight: 800 }, children: "TOTAL HERO LEVELS" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 7818,
          columnNumber: 11
        }),
        /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "1.1rem", fontWeight: 900, color: "var(--primary)" }, children: statsSummary.totalLvl.toLocaleString() }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 7819,
          columnNumber: 11
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 7817,
        columnNumber: 9
      }),
      /* @__PURE__ */ jsxDEV("div", { style: { textAlign: "center" }, children: [
        /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.6rem", color: "var(--text-muted)", fontWeight: 800 }, children: "AVG BOND RANK" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 7822,
          columnNumber: 11
        }),
        /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "1.1rem", fontWeight: 900, color: "#f472b6" }, children: statsSummary.count > 0 ? (statsSummary.totalBond / statsSummary.count).toFixed(1) : 0 }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 7823,
          columnNumber: 11
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 7821,
        columnNumber: 9
      }),
      /* @__PURE__ */ jsxDEV("div", { style: { textAlign: "center" }, children: [
        /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.6rem", color: "var(--text-muted)", fontWeight: 800 }, children: "ENDLESS FLOOR" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 7826,
          columnNumber: 11
        }),
        /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "1.1rem", fontWeight: 900, color: "#ef4444" }, children: endlessFloor }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 7827,
          columnNumber: 11
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 7825,
        columnNumber: 9
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 7816,
      columnNumber: 7
    }),
    /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }, children: [
      /* @__PURE__ */ jsxDEV("h2", { style: { fontWeight: 900, margin: 0 }, children: "ENDGAME TRIALS" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 7831,
        columnNumber: 9
      }),
      /* @__PURE__ */ jsxDEV("button", { className: "upgrade-btn", style: { marginRight: 10, background: "#4ade80", color: "#000" }, onClick: () => setShowSquadBuilder(true), children: [
        /* @__PURE__ */ jsxDEV(Users, { size: 14 }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 7833,
          columnNumber: 11
        }),
        " DEPLOY SQUAD (",
        squadIds.length,
        "/5)"
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 7832,
        columnNumber: 9
      }),
      /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", gap: 4, background: "rgba(255,255,255,0.05)", padding: 4, borderRadius: 12 }, children: [
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            onClick: () => setActiveTab("element"),
            style: {
              padding: "8px 16px",
              borderRadius: 8,
              border: "none",
              background: activeTab === "element" ? "var(--primary)" : "transparent",
              color: activeTab === "element" ? "#fff" : "var(--text-muted)",
              fontWeight: 800,
              cursor: "pointer",
              fontSize: "0.75rem"
            },
            children: "ELEMENTAL"
          },
          void 0,
          false,
          {
            fileName: "<stdin>",
            lineNumber: 7836,
            columnNumber: 13
          }
        ),
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            onClick: () => setActiveTab("franchise"),
            style: {
              padding: "8px 16px",
              borderRadius: 8,
              border: "none",
              background: activeTab === "franchise" ? "#3b82f6" : "transparent",
              color: activeTab === "franchise" ? "#fff" : "var(--text-muted)",
              fontWeight: 800,
              cursor: "pointer",
              fontSize: "0.75rem"
            },
            children: "SERIES"
          },
          void 0,
          false,
          {
            fileName: "<stdin>",
            lineNumber: 7847,
            columnNumber: 13
          }
        ),
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            onClick: () => setActiveTab("endless"),
            style: {
              padding: "8px 16px",
              borderRadius: 8,
              border: "none",
              background: activeTab === "endless" ? "#ef4444" : "transparent",
              color: activeTab === "endless" ? "#fff" : "var(--text-muted)",
              fontWeight: 800,
              cursor: "pointer",
              fontSize: "0.75rem"
            },
            children: "ENDLESS"
          },
          void 0,
          false,
          {
            fileName: "<stdin>",
            lineNumber: 7858,
            columnNumber: 13
          }
        ),
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            onClick: () => setActiveTab("arena"),
            style: {
              padding: "8px 16px",
              borderRadius: 8,
              border: "none",
              background: activeTab === "arena" ? "#facc15" : "transparent",
              color: activeTab === "arena" ? "#000" : "var(--text-muted)",
              fontWeight: 800,
              cursor: "pointer",
              fontSize: "0.75rem"
            },
            children: "ARENA"
          },
          void 0,
          false,
          {
            fileName: "<stdin>",
            lineNumber: 7859,
            columnNumber: 13
          }
        )
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 7835,
        columnNumber: 9
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 7830,
      columnNumber: 7
    }),
    !activeTrial && !pendingTrial && /* @__PURE__ */ jsxDEV("div", { className: "trials-grid animate-fadeIn", style: { display: "grid", gap: 12 }, children: [
      activeTab === "endless" && /* @__PURE__ */ jsxDEV("div", { className: "glass-panel", style: { textAlign: "center", padding: 40, borderColor: "#ef4444" }, children: [
        /* @__PURE__ */ jsxDEV("h1", { style: { fontSize: "3rem", margin: 0, color: "#ef4444" }, children: [
          "FLOOR ",
          endlessFloor
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 7877,
          columnNumber: 17
        }),
        /* @__PURE__ */ jsxDEV("div", { style: { color: "var(--text-muted)", margin: "10px 0 30px" }, children: "THE VOID NEVER ENDS" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 7878,
          columnNumber: 17
        }),
        /* @__PURE__ */ jsxDEV("div", { style: { marginBottom: 20 }, children: [
          /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.8rem", fontWeight: 900 }, children: "ENEMY PWR" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 7880,
            columnNumber: 21
          }),
          /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "1.5rem", color: "#fff" }, children: Math.floor(endlessFloor * 25e3 * Math.pow(1.05, endlessFloor)).toLocaleString() }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 7881,
            columnNumber: 21
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 7879,
          columnNumber: 17
        }),
        /* @__PURE__ */ jsxDEV("button", { className: "train-btn", onClick: () => {
          const floorCp = Math.floor(endlessFloor * 5e4 * Math.pow(1.06, endlessFloor));
          const nextTrial = {
            id: `endless_${endlessFloor}`,
            name: `Void Floor ${endlessFloor}`,
            element: ["FIRE", "WATER", "WIND", "LIGHT", "DARK", "EARTH"][endlessFloor % 6],
            cpReq: floorCp,
            desc: "Survive.",
            rewards: {
              gems: 10 + Math.floor(endlessFloor * 0.5),
              materials: 100 + endlessFloor * 10,
              essence: 5 + Math.floor(endlessFloor / 5)
            },
            difficulty: "hard",
            type: "endless"
          };
          startTrial(nextTrial);
        }, children: "ENTER THE VOID" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 7883,
          columnNumber: 17
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 7876,
        columnNumber: 14
      }),
      activeTab === "arena" && (() => {
        const h = React.createElement;
        const tier = getArenaTier(arenaRank);
        const mySquad = characters.filter((c) => (squadIds || []).some((id) => String(id) === String(c.export_id))).slice(0, 3);
        const pips = Array.from({ length: ARENA_WINS_PER_RANK }).map((_, i) => h("span", {
          key: i,
          className: "arena-pip" + (i < arenaWinStreak ? " lit" : ""),
          style: { "--pip-color": tier.color }
        }));
        const header = h("div", { className: "arena-hall-header glass-panel", style: { "--tier-color": tier.color } },
          h("div", { className: "arena-tier-emblem", style: { color: tier.color } }, tier.emblem),
          h("div", { style: { flex: 1, minWidth: 180 } },
            h("div", { style: { fontSize: "0.62rem", fontWeight: 900, letterSpacing: 3, color: tier.color } }, tier.name + " LEAGUE"),
            h("h1", { style: { margin: "2px 0 4px", fontSize: "2rem", fontFamily: "MugenTitle", color: "#fff" } }, "RANK " + arenaRank),
            h("div", { style: { display: "flex", alignItems: "center", gap: 8 } },
              h("span", { style: { fontSize: "0.62rem", color: "var(--text-muted)", fontWeight: 800 } }, "PROMOTION"),
              h("div", { style: { display: "flex", gap: 5 } }, pips),
              h("span", { style: { fontSize: "0.62rem", color: tier.color, fontWeight: 900 } }, `${arenaWinStreak}/${ARENA_WINS_PER_RANK}`)
            )
          ),
          h("div", { style: { textAlign: "right" } },
            h("div", { style: { fontSize: "0.6rem", color: "var(--text-muted)", fontWeight: 800, marginBottom: 6 } }, "YOUR CREW (3v3) • 75 STAMINA"),
            h("div", { style: { display: "flex", gap: 6, justifyContent: "flex-end" } },
              mySquad.length
                ? mySquad.map((c, i) => h("img", { key: i, src: c.imageUrl, className: "arena-crew-chip", style: { borderColor: ELEMENTS[c.element]?.color || "#fff" } }))
                : h("span", { style: { fontSize: "0.7rem", color: "#f87171", fontWeight: 800 } }, "No squad set"),
              h("button", { className: "upgrade-btn", style: { fontSize: "0.65rem", padding: "6px 10px" }, onClick: () => setShowSquadBuilder({ maxSquad: 3 }) }, "EDIT")
            )
          )
        );
        if (!arenaScouted) {
          return h("div", { style: { display: "grid", gap: 14 } },
            header,
            h("div", { className: "glass-panel arena-gate-panel", style: { textAlign: "center", padding: "44px 20px", "--tier-color": tier.color } },
              h("div", { style: { fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: 4 } }, "Real champions defend the ladder. Beat " + ARENA_WINS_PER_RANK + " squads to reach Rank " + (arenaRank + 1) + "."),
              h("div", { style: { fontSize: "0.68rem", color: tier.color, fontWeight: 800, marginBottom: 22 } }, "★ Watch for defenders with Signature abilities — they hit different."),
              h("button", { className: "train-btn arena-scout-btn", style: { background: tier.color, color: "#000", width: "auto", padding: "14px 44px", margin: "0 auto" }, onClick: scoutArenaOpponents }, "⚔ SCOUT OPPONENTS")
            )
          );
        }
        const threat = (enemies) => enemies.reduce((s, e) => s + e.atk * 6 + e.def * 4 + Math.floor(e.maxHp / 8) + e.speed * 2, 0);
        return h("div", { style: { display: "grid", gap: 14 } },
          header,
          h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } },
            h("div", { style: { fontWeight: 900, color: tier.color, letterSpacing: 1 } }, "CHOOSE YOUR OPPONENT"),
            h("button", { className: "upgrade-btn", style: { fontSize: "0.7rem" }, onClick: scoutArenaOpponents }, "↻ RESCOUT")
          ),
          ...arenaScouted.matchups.map((enemies, mi) => {
            const sigCount = enemies.filter((e) => e.previewSkill2?.signature).length;
            return h("div", { key: mi, className: "arena-opponent-card glass-panel", style: { "--tier-color": tier.color } },
              h("div", { className: "arena-opponent-portraits" },
                enemies.map((e, ei) => h("div", { key: ei, className: "arena-opp-slot" + (ei === 0 ? " boss" : "") },
                  ei === 0 && h("div", { className: "arena-opp-crown" }, "👑"),
                  h("img", { src: e.img, style: { borderColor: ELEMENTS[e.element]?.color || "#fff" } }),
                  h("div", { className: "arena-opp-name" }, e.name),
                  h("div", { className: "arena-opp-lv", style: { color: ELEMENTS[e.element]?.color || "#fff" } }, "LV." + e.level),
                  e.previewSkill2?.signature && h("div", { className: "arena-opp-sig", title: e.previewSkill2.name }, "★ " + e.previewSkill2.name)
                ))
              ),
              h("div", { className: "arena-opponent-footer" },
                h("div", null,
                  h("div", { style: { fontSize: "0.58rem", color: "var(--text-muted)", fontWeight: 800 } }, "THREAT LEVEL"),
                  h("div", { style: { fontSize: "1.05rem", fontWeight: 900, color: sigCount >= 2 ? "#ef4444" : sigCount === 1 ? "#facc15" : "#4ade80" } },
                    formatPower(threat(enemies)), sigCount > 0 ? ` • ${sigCount}★ SIG` : "")
                ),
                h("button", { className: "train-btn arena-fight-btn", style: { background: tier.color, color: "#000" }, onClick: () => startArenaMatchup(enemies) }, "⚔ BATTLE")
              )
            );
          })
        );
      })(),
      groupedTrials.filter((g) => g.type === activeTab).map((group) => {
        const color = ELEMENTS[group.element]?.color || "#fff";
        return /* @__PURE__ */ jsxDEV("div", { className: "glass-panel", style: { padding: 0, overflow: "hidden", border: `1px solid ${color}33` }, children: [
          /* @__PURE__ */ jsxDEV("div", { style: { padding: "16px", background: `linear-gradient(90deg, ${color}11, transparent)`, display: "flex", alignItems: "center", gap: 15 }, children: [
            /* @__PURE__ */ jsxDEV("div", { className: "trial-icon-box", style: { background: color + "22", borderColor: color + "44", width: 48, height: 48, marginRight: 0 }, children: /* @__PURE__ */ jsxDEV(Star, { size: 20, color }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 7911,
              columnNumber: 25
            }) }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 7910,
              columnNumber: 21
            }),
            /* @__PURE__ */ jsxDEV("div", { style: { flex: 1 }, children: [
              /* @__PURE__ */ jsxDEV("h3", { style: { margin: 0, fontSize: "1.1rem", fontWeight: 900 }, children: group.name }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 7914,
                columnNumber: 25
              }),
              /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.7rem", opacity: 0.9, marginTop: 4, display: "flex", gap: 8, alignItems: "center" }, children: group.franchise ? /* @__PURE__ */ jsxDEV(Fragment, { children: [
                /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.65rem", fontWeight: 900, color: "#facc15" }, children: "Series:" }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 7919,
                  columnNumber: 33
                }),
                /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.75rem", fontWeight: 900, color: "#fff" }, children: group.franchise }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 7920,
                  columnNumber: 33
                }),
                /* @__PURE__ */ jsxDEV("div", { style: { marginLeft: 8, fontSize: "0.65rem", color: "var(--text-muted)" }, children: "Bring at least one matching unit." }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 7921,
                  columnNumber: 33
                })
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 7918,
                columnNumber: 31
              }) : /* @__PURE__ */ jsxDEV(Fragment, { children: [
                /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.65rem", fontWeight: 900, color: ELEMENTS[group.element]?.color || "#fff" }, children: group.element }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 7925,
                  columnNumber: 33
                }),
                /* @__PURE__ */ jsxDEV("div", { style: { marginLeft: 8, fontSize: "0.65rem", color: "var(--text-muted)" }, children: "This trial favors that element." }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 7926,
                  columnNumber: 33
                })
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 7924,
                columnNumber: 31
              }) }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 7915,
                columnNumber: 25
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 7913,
              columnNumber: 21
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 7909,
            columnNumber: 18
          }),
          /* @__PURE__ */ jsxDEV("div", { style: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1, background: "rgba(255,255,255,0.05)" }, children: group.variants.map((t) => {
            const cleared = clearedTrials.includes(t.id);
            const matchingHeroes = t.franchise ? characters.filter((c) => {
              const f = extractFranchise(c);
              return f && f.toLowerCase().trim() === String(t.franchise).toLowerCase().trim() && unlockedIds.includes(c.export_id);
            }) : characters.filter((c) => String(c.element).toUpperCase() === String(t.element).toUpperCase() && unlockedIds.includes(c.export_id));
            const hasRequirement = matchingHeroes.length >= 1;
            const isDangerous = t.cpReq >= 1e6;
            let badgeColor = "#4ade80";
            if (t.difficulty === "medium") badgeColor = "#facc15";
            if (t.difficulty === "hard") badgeColor = "#ef4444";
            if (t.difficulty === "expert") badgeColor = "#a855f7";
            const reqText = t.franchise ? `Requires: ${t.franchise}` : `Recommended element: ${t.element}`;
            return /* @__PURE__ */ jsxDEV(
              "button",
              {
                className: "trial-variant-btn",
                style: {
                  background: "transparent",
                  border: "none",
                  padding: "12px 8px",
                  color: "#fff",
                  cursor: hasRequirement ? "pointer" : "not-allowed",
                  opacity: hasRequirement ? 1 : 0.45,
                  position: "relative",
                  textAlign: "left"
                },
                onClick: () => hasRequirement ? setPendingTrial(t) : createFloatingText(`Need ${t.franchise || t.element} Heroes!`, true),
                title: reqText,
                children: [
                  /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }, children: [
                    /* @__PURE__ */ jsxDEV("div", { children: [
                      /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.65rem", fontWeight: 900, color: badgeColor }, children: t.difficulty.toUpperCase() }, void 0, false, {
                        fileName: "<stdin>",
                        lineNumber: 7969,
                        columnNumber: 41
                      }),
                      /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.55rem", marginTop: 4, opacity: 0.8 }, children: reqText }, void 0, false, {
                        fileName: "<stdin>",
                        lineNumber: 7972,
                        columnNumber: 41
                      })
                    ] }, void 0, true, {
                      fileName: "<stdin>",
                      lineNumber: 7968,
                      columnNumber: 37
                    }),
                    /* @__PURE__ */ jsxDEV("div", { style: { textAlign: "right" }, children: [
                      /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.9rem", fontWeight: 900, color: "#fff" }, children: t.cpReq >= 1e6 ? `${(t.cpReq / 1e6).toFixed(1)}M` : `${Math.floor(t.cpReq / 1e3)}K` }, void 0, false, {
                        fileName: "<stdin>",
                        lineNumber: 7975,
                        columnNumber: 41
                      }),
                      cleared && /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.6rem", color: "#4ade80", fontWeight: 900, marginTop: 6 }, children: "CLEARED" }, void 0, false, {
                        fileName: "<stdin>",
                        lineNumber: 7976,
                        columnNumber: 53
                      })
                    ] }, void 0, true, {
                      fileName: "<stdin>",
                      lineNumber: 7974,
                      columnNumber: 37
                    })
                  ] }, void 0, true, {
                    fileName: "<stdin>",
                    lineNumber: 7967,
                    columnNumber: 33
                  }),
                  /* @__PURE__ */ jsxDEV("div", { style: { marginTop: 8, display: "flex", gap: 8, alignItems: "center", fontSize: "0.65rem", color: "var(--text-muted)" }, children: [
                    t.franchise ? /* @__PURE__ */ jsxDEV(Fragment, { children: [
                      /* @__PURE__ */ jsxDEV("div", { style: { padding: "2px 8px", borderRadius: 8, background: "rgba(255,255,255,0.03)", fontWeight: 900 }, children: t.franchise }, void 0, false, {
                        fileName: "<stdin>",
                        lineNumber: 7984,
                        columnNumber: 43
                      }),
                      /* @__PURE__ */ jsxDEV("div", { style: { opacity: 0.8 }, children: [
                        matchingHeroes.length,
                        " matching heroes"
                      ] }, void 0, true, {
                        fileName: "<stdin>",
                        lineNumber: 7985,
                        columnNumber: 43
                      })
                    ] }, void 0, true, {
                      fileName: "<stdin>",
                      lineNumber: 7983,
                      columnNumber: 41
                    }) : /* @__PURE__ */ jsxDEV(Fragment, { children: [
                      /* @__PURE__ */ jsxDEV("div", { style: { width: 14, height: 14, borderRadius: 4, background: ELEMENTS[t.element]?.color || "#fff" } }, void 0, false, {
                        fileName: "<stdin>",
                        lineNumber: 7989,
                        columnNumber: 43
                      }),
                      /* @__PURE__ */ jsxDEV("div", { style: { opacity: 0.8 }, children: [
                        matchingHeroes.length,
                        " ",
                        matchingHeroes.length === 1 ? "match" : "matches"
                      ] }, void 0, true, {
                        fileName: "<stdin>",
                        lineNumber: 7990,
                        columnNumber: 43
                      })
                    ] }, void 0, true, {
                      fileName: "<stdin>",
                      lineNumber: 7988,
                      columnNumber: 41
                    }),
                    isDangerous && /* @__PURE__ */ jsxDEV("div", { style: { marginLeft: "auto", color: "#ef4444", fontWeight: 900 }, children: "DANGEROUS" }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 7993,
                      columnNumber: 53
                    })
                  ] }, void 0, true, {
                    fileName: "<stdin>",
                    lineNumber: 7981,
                    columnNumber: 33
                  })
                ]
              },
              t.id,
              true,
              {
                fileName: "<stdin>",
                lineNumber: 7954,
                columnNumber: 29
              }
            );
          }) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 7933,
            columnNumber: 18
          })
        ] }, group.baseId, true, {
          fileName: "<stdin>",
          lineNumber: 7908,
          columnNumber: 15
        });
      }),
      activeTab !== "arena" && groupedTrials.filter((g) => g.type === activeTab).length === 0 && /* @__PURE__ */ jsxDEV("div", { style: { textAlign: "center", padding: 40, opacity: 0.5, border: "1px dashed rgba(255,255,255,0.2)", borderRadius: 20 }, children: [
        /* @__PURE__ */ jsxDEV("p", { style: { fontWeight: 900, fontSize: "1.2rem", color: "#fff" }, children: "NO TRIALS DETECTED" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 8004,
          columnNumber: 18
        }),
        /* @__PURE__ */ jsxDEV("p", { style: { fontSize: "0.8rem", maxWidth: 400, margin: "10px auto" }, children: activeTab === "franchise" ? "Recruit at least 1 hero from any franchise to unlock their Series Paradox Trial." : "Elemental trials appear automatically. If you see this, the multiverse is syncing..." }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 8005,
          columnNumber: 18
        }),
        /* @__PURE__ */ jsxDEV("button", { className: "train-btn", style: { width: "auto", padding: "10px 20px", background: "#334155" }, onClick: () => setView("gacha"), children: "RECRUIT NEW HEROES" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 8010,
          columnNumber: 18
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 8003,
        columnNumber: 14
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 7873,
      columnNumber: 9
    }),
    pendingTrial && /* @__PURE__ */ jsxDEV("div", { className: "hero-select-modal animate-fadeIn", style: { display: "flex", flexDirection: "column" }, children: [
      /* @__PURE__ */ jsxDEV("div", { className: "modal-header", children: [
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("h2", { style: { margin: 0, color: pendingTrial.element ? ELEMENTS[pendingTrial.element].color : "#fff" }, children: pendingTrial.name }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 8022,
            columnNumber: 15
          }),
          /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.8rem", opacity: 0.7, maxWidth: "400px", marginTop: 4 }, children: pendingTrial.desc }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 8023,
            columnNumber: 15
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 8021,
          columnNumber: 13
        }),
        /* @__PURE__ */ jsxDEV("button", { className: "upgrade-btn", style: { padding: "10px 20px" }, onClick: () => setPendingTrial(null), children: "CANCEL" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 8025,
          columnNumber: 13
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 8020,
        columnNumber: 11
      }),
      // "WHO'S GETTING IN" — surfaces every squad requirement for this trial as a
      // chip (met/unmet/waived), mirroring the same pattern CampaignView uses for
      // stage requirements. "Waived" means the requirement was auto-dropped
      // because no owned hero could ever satisfy it (see the softlock fix in
      // startTrial's franchise-trial element derivation above) -- surfacing that
      // state here means the player can SEE why a requirement isn't listed as
      // blocking, instead of just wondering why the trial always looked doable.
      (pendingTrial.franchise || pendingTrial.element || pendingTrial.isWildcard) && (() => {
        const h = React.createElement;
        const squad = characters.filter((c) => (squadIds || []).some((id) => String(id) === String(c.export_id)));
        const unlockedRoster = characters.filter((c) => unlockedIds.includes(c.export_id));
        const frMatch = (c, t) => { const f = (extractFranchise(c) || "").toLowerCase().trim(); const tt = String(t).toLowerCase().trim(); return f === tt || f.includes(tt); };
        const rosterCanFr = pendingTrial.franchise ? unlockedRoster.some((c) => frMatch(c, pendingTrial.franchise)) : true;
        const rosterCanEl = pendingTrial.element ? unlockedRoster.some((c) => String(c.element).toUpperCase() === String(pendingTrial.element).toUpperCase()) : true;
        const rosterCanWildcard = pendingTrial.isWildcard ? unlockedRoster.some((c) => { const f = extractFranchise(c) || "Minor"; return !f || (franchiseCounts[f] || 0) < 3; }) : true;
        const reqs = [];
        if (pendingTrial.franchise) reqs.push({ label: `${pendingTrial.franchise} hero`, waived: !rosterCanFr, met: squad.some((c) => frMatch(c, pendingTrial.franchise)) });
        if (pendingTrial.element) reqs.push({ label: `${pendingTrial.element} hero`, waived: !rosterCanEl, met: squad.some((c) => String(c.element).toUpperCase() === String(pendingTrial.element).toUpperCase()) });
        if (pendingTrial.isWildcard) reqs.push({ label: "Wildcard (minor series) hero", waived: !rosterCanWildcard, met: squad.some((c) => { const f = extractFranchise(c) || "Minor"; return !f || (franchiseCounts[f] || 0) < 3; }) });
        return h("div", { style: { background: "rgba(233,69,96,0.08)", border: "1px solid var(--primary)", borderRadius: 12, padding: "10px 12px", marginBottom: 15, textAlign: "left" } },
          h("div", { style: { fontSize: "0.6rem", fontWeight: 900, color: "var(--primary)", letterSpacing: 2, marginBottom: 7 } }, "WHO'S GETTING IN"),
          h("div", { style: { display: "flex", flexWrap: "wrap", gap: 6 } }, reqs.map((r, i) => {
            const col = r.waived ? "#94a3b8" : r.met ? "#4ade80" : "#f87171";
            return h("span", { key: i, style: { fontSize: "0.66rem", fontWeight: 800, padding: "3px 9px", borderRadius: 20, background: r.waived ? "rgba(148,163,184,0.12)" : r.met ? "rgba(74,222,128,0.13)" : "rgba(239,68,68,0.13)", color: col, border: "1px solid " + col + "44" } }, (r.waived ? "— " : r.met ? "✓ " : "✗ ") + r.label + (r.waived ? " (waived)" : ""));
          }))
        );
      })(),
      // SCOUT GEAR — reproduces the EXACT boss + gear roll startTrial() will
      // use (same BOSS_ROSTER pick logic, same trial-id-seeded RNG) so what
      // you scout here is what you actually fight, not a flavor sample.
      (() => {
        const h = React.createElement;
        const RARITY_COLOR = { Common: "#94a3b8", Rare: "#38bdf8", Epic: "#a855f7", Legendary: "#facc15", Mythic: "#ff2ecb" };
        const bossPick = BOSS_ROSTER[Math.abs(pendingTrial.id.length + pendingTrial.id.charCodeAt(0)) % BOSS_ROSTER.length];
        const isDuoTrial = pendingTrial.difficulty === "hard" || pendingTrial.difficulty === "expert";
        const bossEntries = isDuoTrial ? [bossPick, BOSS_ROSTER.find((b) => b.name === bossPick.duoPartner) || bossPick] : [bossPick];
        const bossGearTier = { easy: 1, medium: 2, hard: 3, expert: 4 }[pendingTrial.difficulty] ?? 2;
        const gearRoll = seededRandom(pendingTrial.id + "_gear");
        return h("div", { style: { background: "rgba(0,0,0,0.3)", padding: 12, borderRadius: 14, marginBottom: 15 } },
          h("div", { style: { fontSize: "0.6rem", fontWeight: 900, color: "#facc15", letterSpacing: 2, marginBottom: 8 } }, "SCOUT REPORT"),
          h("div", { style: { display: "flex", flexDirection: "column", gap: 8 } }, bossEntries.map((boss) => {
            const gear = rollEnemyGear(bossGearTier, gearRoll);
            return h("div", { key: boss.name, style: { display: "flex", alignItems: "center", gap: 8 } },
              h("img", { src: boss.img, style: { width: 32, height: 32, borderRadius: 8, objectFit: "cover", border: `1px solid ${ELEMENTS[boss.element]?.color || "#fff"}` } }),
              h("span", { style: { fontWeight: 800, fontSize: "0.68rem", minWidth: 90 } }, boss.name),
              h("div", { style: { display: "flex", flexWrap: "wrap", gap: 4 } }, gear.map((g) => {
                const item = (EQUIPMENT[g.slot] || []).find((it) => it.id === g.itemId);
                if (!item) return null;
                const rc = RARITY_COLOR[item.rarity];
                return h("span", { key: g.slot, title: item.name, style: { fontSize: "0.56rem", fontWeight: 800, padding: "2px 6px", borderRadius: 10, color: rc, border: `1px solid ${rc}66`, background: `${rc}18` } }, `${item.name} +${g.level}`);
              })));
          })));
      })(),
      /* @__PURE__ */ jsxDEV("div", { style: { background: "rgba(0,0,0,0.3)", padding: 15, borderRadius: 16, marginBottom: 20 }, children: [
        /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }, children: [
          /* @__PURE__ */ jsxDEV("h3", { style: { margin: 0, fontSize: "0.9rem", fontWeight: 900 }, children: [
            "TRIAL SQUAD (",
            squadIds.length,
            "/5)"
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 8030,
            columnNumber: 16
          }),
          /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", flexDirection: "column", gap: 6 }, children: [
            /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", gap: 8 }, children: [
              /* @__PURE__ */ jsxDEV("button", { className: "upgrade-btn", style: { fontSize: "0.7rem" }, onClick: () => setShowSquadBuilder({
                element: pendingTrial.element,
                franchise: pendingTrial.franchise,
                isWildcard: pendingTrial.isWildcard
              }), children: "SELECT HEROES" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 8032,
                columnNumber: 19
              }),
              /* @__PURE__ */ jsxDEV("button", { className: "train-btn", style: { width: "auto", padding: "8px 24px" }, disabled: squadIds.length === 0, onClick: () => startTrial(pendingTrial), children: "PROCEED TO TRIAL" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 8037,
                columnNumber: 19
              })
            ] }, void 0, true, { fileName: "<stdin>", lineNumber: 1, columnNumber: 1 }),
            squadIds.length === 0 && /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.65rem", color: "#ef4444", fontWeight: 700 }, children: "Select at least 1 hero to proceed" }, void 0, false, { fileName: "<stdin>", lineNumber: 1, columnNumber: 1 })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 8031,
            columnNumber: 16
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 8029,
          columnNumber: 13
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "squad-slots-row", style: { gridTemplateColumns: "repeat(5, 1fr)" }, children: Array.from({ length: 5 }).map((_, i) => {
          const heroId = squadIds[i];
          const c = heroId ? characters.find((h) => String(h.export_id) === String(heroId)) : null;
          return /* @__PURE__ */ jsxDEV("div", { className: `squad-member-slot ${c ? "active" : "empty"}`, onClick: () => setShowSquadBuilder(true), children: c ? /* @__PURE__ */ jsxDEV("img", { src: c.imageUrl }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 8048,
            columnNumber: 28
          }) : /* @__PURE__ */ jsxDEV(Plus, { size: 20, opacity: 0.2 }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 8048,
            columnNumber: 55
          }) }, i, false, {
            fileName: "<stdin>",
            lineNumber: 8047,
            columnNumber: 21
          });
        }) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 8042,
          columnNumber: 13
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 8028,
        columnNumber: 11
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "glass-panel", style: { textAlign: "center", padding: 40, opacity: 0.7 }, children: [
        /* @__PURE__ */ jsxDEV(Info, { size: 32, style: { marginBottom: 10 } }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 8056,
          columnNumber: 14
        }),
        /* @__PURE__ */ jsxDEV("p", { children: "Ensure your squad matches the element or series requirement before entering." }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 8057,
          columnNumber: 14
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 8055,
        columnNumber: 11
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 8019,
      columnNumber: 9
    }),
    activeTrial && /* @__PURE__ */ jsxDEV("div", { className: "battle-screen animate-fadeIn", children: [
      battleState === "INTRO" && (activeTrial.type === "arena"
        ? /* @__PURE__ */ jsxDEV(
          ArenaIntro,
          {
            squad: characters.filter((c) => squadIds.map(String).includes(String(c.export_id))).slice(0, 3),
            enemies: combatants.filter((c) => c.isEnemy),
            rank: arenaRank,
            onComplete: () => {
              setBattleState("ACTIVE");
              playSound("spar");
            }
          },
          void 0,
          false,
          { fileName: "<stdin>", lineNumber: 1, columnNumber: 1 }
        )
        : /* @__PURE__ */ jsxDEV(
          CampaignIntro,
          {
            activeBattle: activeTrial,
            squad: characters.filter((c) => squadIds.map(String).includes(String(c.export_id))),
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
            lineNumber: 8065,
            columnNumber: 13
          }
        )),
      /* @__PURE__ */ jsxDEV("div", { style: { position: "absolute", top: 50, right: 20, zIndex: 100 }, children: /* @__PURE__ */ jsxDEV("div", { style: { background: "rgba(0,0,0,0.8)", padding: "5px 15px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)" }, children: [
        /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.6rem", color: "var(--text-muted)" }, children: "SQUAD PWR" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 8078,
          columnNumber: 17
        }),
        /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.9rem", fontWeight: 900, color: "#fff" }, children: squadIds.reduce((sum, id) => sum + calculateSubStat(characters.find((c) => String(c.export_id) === String(id)) || {}, characters, "pwr", skills), 0).toLocaleString() }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 8079,
          columnNumber: 17
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 8077,
        columnNumber: 14
      }) }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 8076,
        columnNumber: 11
      }),
      activeSkill && !activeSkill.signature && /* @__PURE__ */ jsxDEV("div", { className: "skill-banner", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "skill-banner-text", children: activeSkill.name }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 8084,
          columnNumber: 16
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "skill-banner-sub", children: [
          "USED BY ",
          activeSkill.user
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 8085,
          columnNumber: 16
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 8083,
        columnNumber: 13
      }),
      activeSkill && activeSkill.signature && /* @__PURE__ */ jsxDEV("div", { className: `sig-cutin ${activeSkill.isEnemy ? "enemy" : "ally"}`, children: [
        /* @__PURE__ */ jsxDEV("div", { className: "sig-cutin-stripe" }, void 0, false, { fileName: "<stdin>", lineNumber: 1, columnNumber: 1 }),
        /* @__PURE__ */ jsxDEV("img", { src: activeSkill.img, className: "sig-cutin-portrait", style: { borderColor: ELEMENTS[activeSkill.element]?.color || "#ffd700" } }, void 0, false, { fileName: "<stdin>", lineNumber: 1, columnNumber: 1 }),
        /* @__PURE__ */ jsxDEV("div", { className: "sig-cutin-textblock", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "sig-cutin-label", children: "★ SIGNATURE" }, void 0, false, { fileName: "<stdin>", lineNumber: 1, columnNumber: 1 }),
          /* @__PURE__ */ jsxDEV("div", { className: "sig-cutin-name", children: activeSkill.name }, void 0, false, { fileName: "<stdin>", lineNumber: 1, columnNumber: 1 }),
          /* @__PURE__ */ jsxDEV("div", { className: "sig-cutin-user", children: activeSkill.user }, void 0, false, { fileName: "<stdin>", lineNumber: 1, columnNumber: 1 })
        ] }, void 0, true, { fileName: "<stdin>", lineNumber: 1, columnNumber: 1 })
      ] }, activeSkill.name + activeSkill.user, true, { fileName: "<stdin>", lineNumber: 1, columnNumber: 1 }),
      koEvent && /* @__PURE__ */ jsxDEV("div", { className: `ko-banner ${koEvent.isEnemy ? "enemy" : "ally"}`, children: [
        /* @__PURE__ */ jsxDEV("img", { src: koEvent.img, className: "ko-banner-img" }, void 0, false, { fileName: "<stdin>", lineNumber: 1, columnNumber: 1 }),
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("div", { className: "ko-banner-ko", children: "K.O.!" }, void 0, false, { fileName: "<stdin>", lineNumber: 1, columnNumber: 1 }),
          /* @__PURE__ */ jsxDEV("div", { className: "ko-banner-name", children: [koEvent.name, koEvent.isEnemy ? " ELIMINATED" : " DOWN"] }, void 0, true, { fileName: "<stdin>", lineNumber: 1, columnNumber: 1 })
        ] }, void 0, true, { fileName: "<stdin>", lineNumber: 1, columnNumber: 1 })
      ] }, koEvent.id + String(koEvent.time), true, { fileName: "<stdin>", lineNumber: 1, columnNumber: 1 }),
      /* @__PURE__ */ jsxDEV("div", { className: "battle-header", style: { padding: 15, background: "rgba(0,0,0,0.8)" }, children: [
        /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
          /* @__PURE__ */ jsxDEV("h2", { style: { margin: 0, fontSize: "1rem" }, children: activeTrial.name.toUpperCase() }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 8090,
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
                lineNumber: 8092,
                columnNumber: 20
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
                lineNumber: 8099,
                columnNumber: 20
              }
            ),
            /* @__PURE__ */ jsxDEV("button", { onClick: () => {
              if (!confirm("Forfeit trial?")) return;
              setBattleState("LOSS");
              setActiveTrial(null);
              setCombatants([]);
              try {
                if (typeof setBattleMusicActive === "function") setBattleMusicActive(false);
              } catch (e) {
              }
              try {
                if (typeof setIsVictoryMusic === "function") setIsVictoryMusic(false);
              } catch (e) {
              }
            }, className: "train-btn", style: { padding: "5px 15px", background: "#ef4444", width: "auto" }, children: "QUIT" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 8106,
              columnNumber: 20
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 8091,
            columnNumber: 17
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 8089,
          columnNumber: 14
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "unified-stance-display", children: [
          /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.6rem", fontWeight: 900, color: "var(--text-muted)", letterSpacing: 2 }, children: "TACTICAL_STANCE:" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 8117,
            columnNumber: 17
          }),
          /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.8rem", fontWeight: 900, color: ELEMENTS[playerElement].color }, children: [
            playerElement,
            " ",
            playerElement === "FIRE" ? "(+ATK)" : playerElement === "WATER" ? "(+DEF)" : playerElement === "WIND" ? "(+SPD)" : playerElement === "LIGHT" ? "(+HP)" : playerElement === "DARK" ? "(+CRIT)" : "(+GRD)"
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 8118,
            columnNumber: 17
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 8116,
          columnNumber: 14
        }),
        /* @__PURE__ */ jsxDEV(TacticalStanceRow, { currentStance: playerElement, onStanceChange: changePlayerElement }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 8122,
          columnNumber: 14
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 8088,
        columnNumber: 11
      }),
      /* @__PURE__ */ jsxDEV("div", { ref: battleSceneRef, className: "battle-scene", children: [
        /* @__PURE__ */ jsxDEV(ProjectileLayer, { combatants, containerRef: battleSceneRef }, void 0, false, {}),
        /* @__PURE__ */ jsxDEV("div", { className: "battle-background-layer", style: { backgroundImage: `url(${activeTrial?.type === "endless" ? "background_void.png" : activeTrial?.element === "FIRE" ? "fx_burn.png" : activeTrial?.element === "WATER" ? "background_battle.png" : "background_citadel.png"})` } }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 8125,
          columnNumber: 14
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "battle-floor" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 8126,
          columnNumber: 14
        }),
        // MISSION BADGE + ambient dressing -- tinted to arena tier / void /
        // element so endgame trials read as distinct occasions, not a reskin
        // of the same generic battle screen.
        (() => {
          const isArena = activeTrial?.type === "arena";
          const isVoid = activeTrial?.type === "endless";
          const tier = isArena ? getArenaTier(arenaRank) : null;
          const tint = tier ? tier.color : isVoid ? "#a855f7" : ELEMENTS[activeTrial?.element]?.color || "#a855f7";
          const emblem = tier ? tier.emblem : isVoid ? "◈" : "✦";
          const label = tier ? `${tier.name} LEAGUE` : isVoid ? "THE VOID" : (activeTrial?.difficulty || "TRIAL").toUpperCase();
          const missionName = isArena ? `RANK ${arenaRank}` : (activeTrial?.name || "").toUpperCase();
          return h(Fragment, { key: "trial-dressing" }, [
            h("div", { key: "vig", className: "trial-vignette", style: { "--tmb-color": tint } }),
            h("div", { key: "motes", className: "trial-ambient-layer" },
              Array.from({ length: 14 }).map((_, i) => h("div", {
                key: i,
                className: "trial-mote",
                style: {
                  "--tmb-color": tint,
                  "--mote-drift": `${(i % 2 === 0 ? 1 : -1) * (14 + i * 3)}px`,
                  left: `${(i * 137) % 100}%`,
                  animationDuration: `${6 + i % 5}s`,
                  animationDelay: `${(i * 0.37).toFixed(2)}s`
                }
              }))),
            h("div", { key: "badge", className: "trial-mission-badge trial-rank-pulse", style: { "--tmb-color": tint } }, [
              h("div", { key: "e", className: "trial-mission-emblem" }, emblem),
              h("div", { key: "t", className: "trial-mission-text" }, [
                h("div", { key: "l", className: "trial-mission-label" }, label),
                h("div", { key: "n", className: "trial-mission-name" }, missionName)
              ])
            ])
          ]);
        })(),
        combatants.filter((c) => c.isEnemy && !c.dead).slice(0, 1).map((boss) => /* @__PURE__ */ jsxDEV("div", { className: "boss-hp-container", children: [
          /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 2, padding: "0 10px" }, children: [
            /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "1.2rem", fontWeight: 900, color: "#fff", textShadow: "0 0 10px #000", fontFamily: "MugenTitle" }, children: boss.name }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 8132,
              columnNumber: 21
            }),
            /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.8rem", color: ELEMENTS[boss.element].color, fontWeight: 900 }, children: [
              boss.element,
              " GUARDIAN"
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 8133,
              columnNumber: 21
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 8131,
            columnNumber: 19
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "boss-hp-main", children: /* @__PURE__ */ jsxDEV("div", { className: "hp-fill", style: { width: `${boss.hp / boss.maxHp * 100}%`, background: "linear-gradient(90deg, #b91c1c, #ef4444)" } }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 8136,
            columnNumber: 21
          }) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 8135,
            columnNumber: 19
          }),
          boss.maxStagger ? /* @__PURE__ */ jsxDEV("div", { className: "boss-stagger-bar", children: /* @__PURE__ */ jsxDEV("div", { className: "stagger-fill", style: { width: `${(boss.stagger || 0) / boss.maxStagger * 100}%`, background: "#facc15" } }, void 0, false, {}) }, void 0, false, {}) : null
        ] }, `boss-hp-${boss.id}`, true, {
          fileName: "<stdin>",
          lineNumber: 8130,
          columnNumber: 16
        })),
        /* @__PURE__ */ jsxDEV("div", { className: "battle-formation enemy-row", children: combatants.filter((c) => c.isEnemy).map((u) => /* @__PURE__ */ jsxDEV(BattleUnit, { unit: u, floatingDamages: floatingDamages.filter((d) => d.targetId === u.id) }, u.id, false, {
          fileName: "<stdin>",
          lineNumber: 8142,
          columnNumber: 60
        })) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 8141,
          columnNumber: 14
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "battle-formation hero-row", children: combatants.filter((c) => !c.isEnemy).map((u) => /* @__PURE__ */ jsxDEV(BattleUnit, { unit: u, floatingDamages: floatingDamages.filter((d) => d.targetId === u.id) }, u.id, false, {
          fileName: "<stdin>",
          lineNumber: 8145,
          columnNumber: 61
        })) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 8144,
          columnNumber: 14
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 8124,
        columnNumber: 11
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "skill-dock", style: { display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 10 }, children: combatants.filter((c) => !c.isEnemy).map((u, i) => {
        const skill1 = (skills || []).find((s) => s.id === u.skillId) || { id: "slash", type: "atk", name: "Slash", rarity: "Common", cooldown: 100 };
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
                    lineNumber: 8169,
                    columnNumber: 32
                  }),
                  !isLimitBreak && /* @__PURE__ */ jsxDEV("div", { className: "skill-fill-overlay", style: { height: `${100 - progress1}%` } }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 8170,
                    columnNumber: 50
                  }),
                  /* @__PURE__ */ jsxDEV("div", { className: "skill-label", style: { fontSize: "0.45rem" }, children: isLimitBreak ? "ULTI" : s1Ready ? "READY" : skill1.name }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 8171,
                    columnNumber: 32
                  })
                ]
              },
              void 0,
              true,
              {
                fileName: "<stdin>",
                lineNumber: 8164,
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
                    lineNumber: 8181,
                    columnNumber: 34
                  }),
                  !isLimitBreak && /* @__PURE__ */ jsxDEV("div", { className: "skill-fill-overlay", style: { height: `${100 - progress2}%`, background: "rgba(168, 85, 247, 0.4)" } }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 8182,
                    columnNumber: 52
                  }),
                  /* @__PURE__ */ jsxDEV("div", { className: "skill-label", style: { fontSize: "0.45rem" }, children: isLimitBreak ? "ULTI" : s2Ready ? "READY" : skill2.name }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 8183,
                    columnNumber: 34
                  })
                ]
              },
              void 0,
              true,
              {
                fileName: "<stdin>",
                lineNumber: 8176,
                columnNumber: 30
              }
            )
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 8163,
            columnNumber: 25
          }),
          (skill1?.meta?.dynamic_special || skill2?.meta?.dynamic_special) && /* @__PURE__ */ jsxDEV("div", { className: "dyn-form-badge", children: (() => {
            const dominant = getDominantSpecialKey(u.special);
            return dominant ? SPECIAL_ARCHETYPE_NAMES[dominant] : "Basic Attack";
          })() }, void 0, false, { fileName: "<stdin>", lineNumber: 1, columnNumber: 1 }),
          /* @__PURE__ */ jsxDEV("button", { className: "guard-mini-btn", disabled: u.dead || (u.burst || 0) < 30, onClick: () => triggerDefend(u.id), children: [
            /* @__PURE__ */ jsxDEV(Shield, { size: 10 }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 8189,
              columnNumber: 135
            }),
            " GUARD"
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 8189,
            columnNumber: 25
          })
        ] }, u.id, true, {
          fileName: "<stdin>",
          lineNumber: 8162,
          columnNumber: 22
        });
      }) }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 8148,
        columnNumber: 11
      }),
      battleState === "LOSS" && /* @__PURE__ */ jsxDEV("div", { className: "battle-result-overlay", children: [
        /* @__PURE__ */ jsxDEV("h1", { className: "loss-text", children: "TRIAL FAILED" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 8196,
          columnNumber: 17
        }),
        /* @__PURE__ */ jsxDEV("button", { className: "train-btn", style: { width: 200, marginTop: 20 }, onClick: () => {
          setBattleState("IDLE");
          setActiveTrial(null);
          setBattleMusicActive(false);
        }, children: "RETURN" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 8197,
          columnNumber: 17
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 8195,
        columnNumber: 14
      }),
      battleState === "WIN" && /* @__PURE__ */ jsxDEV(
        VictoryScreen,
        {
          combatants,
          rewards: {
            ...activeTrial.scaledRewards,
            gems: !clearedTrials.includes(activeTrial.id) || activeTrial.type === "endless" ? activeTrial.scaledRewards.gems : 0
          },
          onConfirm: () => {
            finishTrial();
            if (setIsVictoryMusic) setIsVictoryMusic(false);
          }
        },
        void 0,
        false,
        {
          fileName: "<stdin>",
          lineNumber: 8202,
          columnNumber: 14
        }
      )
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 8063,
      columnNumber: 9
    })
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 7815,
    columnNumber: 5
  });
};;

export { TrialsView };
