import { Fragment, jsxDEV } from "react/jsx-dev-runtime";
import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Shield,
  Users,
  Star,
  Info,
  Plus
} from "lucide-react";
import { BattleUnit, VictoryScreen, getBattleStats, executeCombatSkill, TacticalStanceRow, applyStatusTick, resolveBasicAttack, getCastAnimMs, getCastAnimSound, getLungeMs, getBasicAttackMs, getCooldownGain, getFlurryHitSound, HITSTOP_BUFFER_MS, ProjectileLayer, pushShieldEffect, TurnOrderStrip } from "../CombatSystem.js";
import { ELEMENTS, TIER_STATS, BOSS_ROSTER, EQUIPMENT, AUTO_CLEAR_PWR_MULT } from "../constants.js";
import { calculateStat, playSound, calculateSubStat, applyLeaderBonus, applyCrewChemistry, getEnemyStatsFromCP, formatPower, applyMitigation, SIGNATURE_BONUS, incrementCourierFieldBattles, getDominantSpecialKey, SPECIAL_ARCHETYPE_NAMES, getGaugeGain, getGearPassives, rollEnemyGear, seededRandom, makeGearInstanceId, INITIAL_GAUGE_RANGE_WIDE } from "../utils.js";
import { CampaignIntro } from "./ViewShared.js";
import { TrialsMenu } from "./trials/TrialsMenu.js";
import { PreTrialModal } from "./trials/PreTrialModal.js";

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
  cameoId = null,
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
  setCharacters,
  abilityShards = {},
  setAbilityShards,
  gearInventory = [],
  setGearInventory
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
  // COMBO CHAIN -- see CampaignView's identical mechanic. Every ally hit
  // extends it, any enemy action breaks it; the multiplier feeds back into
  // resolveBasicAttack (comboMult) AND executeCombatSkill (extraPowerMult),
  // and the raw count also feeds the melee flurry's own comboAmp (see
  // resolveBasicAttack's comboCount) so a live chain snowballs into bigger,
  // more air-heavy combos, not just more damage.
  const comboRef = useRef({ count: 0 });
  const [comboDisplay, setComboDisplay] = useState(0);
  const comboMult = () => 1 + Math.min(0.4, comboRef.current.count * 0.02);
  const bumpCombo = (n = 1) => {
    comboRef.current.count += n;
    setComboDisplay(comboRef.current.count);
  };
  const breakCombo = () => {
    if (comboRef.current.count > 0) {
      comboRef.current.count = 0;
      setComboDisplay(0);
    }
  };
  // CAMEO / GUEST SUMMON -- ported from CampaignView so guest abilities work
  // in every battle mode, not just Campaign. Same rules: 2 uses/battle, ~60s
  // between uses, first use available immediately, and auto-fires the instant
  // it's ready while Auto is on (see the tick loop below) instead of sitting
  // there unused waiting for a manual click.
  const cameoData = useMemo(() => {
    if (!cameoId) return null;
    const c = (characters || []).find((x) => String(x.export_id) === String(cameoId));
    if (!c) return null;
    const sig = (skills || []).find((s) => s.signature && s.owner === c.name);
    if (!sig) return null;
    if (!(c.signatureUnlocked || (c.abilityLevels && c.abilityLevels[sig.id]))) return null;
    return { sigId: sig.id, img: c.imageUrl, name: c.name, element: c.element, sigName: sig.name };
  }, [cameoId, characters, skills]);
  const cameoRef = useRef({ usesLeft: 2, lastUsed: 0 });
  const [cameoCutin, setCameoCutin] = useState(null);
  const triggerCameo = () => {
    if (battleState !== "ACTIVE" || !cameoData) return;
    if (Date.now() < hitStopUntil.current) return;
    if (cameoRef.current.usesLeft <= 0) return;
    if (Date.now() - cameoRef.current.lastUsed < 60000) return;
    setCombatants((prev) => {
      const next = [...prev];
      const allies = next.filter((u) => !u.isEnemy && !u.dead);
      if (!allies.length) return prev;
      const idx = next.findIndex((u) => u.id === allies.reduce((best, u) => (u.gauge || 0) > (best.gauge || 0) ? u : best, allies[0]).id);
      const caster = next[idx];
      const orig = { skillId2: caster.skillId2, skillCd2: caster.skillCd2, maxSkillCd2: caster.maxSkillCd2, abilityLevel2: caster.abilityLevel2, skillCd: caster.skillCd, maxSkillCd: caster.maxSkillCd };
      caster.skillId2 = cameoData.sigId;
      caster.maxSkillCd2 = 0;
      caster.skillCd2 = 0;
      caster.abilityLevel2 = caster.abilityLevel2 || 1;
      caster.maxSkillCd = 999999;
      caster.skillCd = 0;
      const ns = executeCombatSkill({ combatants: next, attackerId: caster.id, skills, playerElement, isLimitBreak: false });
      ns.forEach((s, i) => next[i] = s);
      const after = next[idx];
      after.skillId2 = orig.skillId2;
      after.skillCd2 = orig.skillCd2;
      after.maxSkillCd2 = orig.maxSkillCd2;
      after.abilityLevel2 = orig.abilityLevel2;
      after.skillCd = orig.skillCd;
      after.maxSkillCd = orig.maxSkillCd;
      after._cameoImg = cameoData.img;
      after._cameoRevertAt = Date.now() + 1600;
      cameoRef.current.usesLeft -= 1;
      cameoRef.current.lastUsed = Date.now();
      setCameoCutin({ guest: cameoData.name, sig: cameoData.sigName, user: after.name, img: cameoData.img, element: cameoData.element });
      hitStopUntil.current = Math.max(hitStopUntil.current, Date.now() + 260);
      playSound("mugen_super", 0.5);
      setTimeout(() => setCameoCutin(null), 2200);
      return next;
    });
  };
  React.useEffect(() => {
    if (battleState === "ACTIVE") cameoRef.current = { usesLeft: 2, lastUsed: 0 };
  }, [battleState]);
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
  const [arenaWinStreak, setArenaWinStreak] = useState(() => {
    const saved = parseInt(localStorage.getItem("mugen_arena_streak") || "0", 10);
    return Number.isFinite(saved) ? Math.max(0, Math.min(saved, 2)) : 0;
  });
  useEffect(() => {
    localStorage.setItem("mugen_arena_streak", arenaWinStreak.toString());
  }, [arenaWinStreak]);
  const ARENA_WINS_PER_RANK = 3;
  const ARENA_QUALIFIER_WINS = ARENA_WINS_PER_RANK - 1;
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
  // ============================ ALL-STAR GAUNTLET ============================
  // Replaces the old endless "Void": a run through EVERY series in a fixed
  // order, fought against each series' own champions, escalating every round
  // (and harder still each full lap). The round counter reuses `endlessFloor`
  // (already persisted). Series need >=2 members to field a champion team;
  // sorted alphabetically so the order is stable and previewable.
  const gauntletSeries = allFranchises
    .filter((f) => (franchiseCounts[f] || 0) >= 2)
    .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  const gauntletLen = Math.max(1, gauntletSeries.length);
  const gauntletRound = Math.max(1, endlessFloor);
  const gauntletIdx = (gauntletRound - 1) % gauntletLen;
  const gauntletLap = Math.floor((gauntletRound - 1) / gauntletLen);
  const gauntletCurrentSeries = gauntletSeries[gauntletIdx] || null;
  // Enemy CP for a given round: All-Star is the true endgame gauntlet, so
  // ROUND 1 ALONE is already sized for the recommended squad (Ascension 5,
  // Level 100, Skill Level 500 on both slots, ~Bond 50) -- see the PWR v6.0
  // comment in utils.js for how that reference squad's power was derived
  // (~30M PWR). It keeps climbing hard every round after that, and harder
  // still each full lap, so it never stops being a genuine endgame test.
  const gauntletCp = (round) => {
    const lap = Math.floor((round - 1) / gauntletLen);
    return Math.floor(30e6 * Math.pow(1.045, round - 1) * (1 + lap * 0.5));
  };
  // A series' top `n` champions: signature-owners first, then best tier. Shared
  // by the menu preview (portraits) and the battle builder (enemy stats).
  const seriesChampions = (franchise, n) => {
    if (!franchise) return [];
    const sigOwners = new Set((skills || []).filter((s) => s.signature).map((s) => s.owner));
    const tierOrder = ["SS", "S+", "S", "S-", "A+", "A", "A-", "B+", "B", "C+", "C"];
    const tierRank = (t) => { const i = tierOrder.indexOf((t || "C").trim().toUpperCase()); return i === -1 ? 99 : i; };
    return characters
      .filter((c) => extractFranchise(c) === franchise)
      .slice()
      .sort((a, b) => (sigOwners.has(b.name) ? 1 : 0) - (sigOwners.has(a.name) ? 1 : 0) || tierRank(a.tier) - tierRank(b.tier))
      .slice(0, n);
  };
  // Elemental Trials are the lenient/accessible end of Trials -- meant to be
  // clearable well before endgame (unlike All-Star), so baseCp sits in the
  // low-millions where a mid-game squad's PWR already lands (see the PWR
  // v6.0 reference figures in utils.js), not the hundred-million-plus range
  // that used to require a near-maxed roster just to attempt Easy.
  const baseElementTrials = Object.keys(ELEMENTS).map((el) => ({
    baseId: `trial_el_${el}`,
    name: `${ELEMENTS[el].name} Singularity`,
    desc: `A dimensional void echoing with concentrated ${ELEMENTS[el].name} energy. Only resonators of the same element can fully synchronize.`,
    element: el,
    baseCp: 1.2e6,
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
  // Series (franchise) Trials are also lenient by design -- same low-millions
  // baseline as Elemental, with a small per-franchise-index bump so a deeper
  // roster (more eligible franchises unlocked) nudges later ones up slightly.
  const baseFranchiseTrials = eligibleFranchises.map((f, i) => ({
    baseId: `trial_fr_${f.replace(/\s+/g, "_")}`,
    name: `${f} Paradox`,
    desc: `The collective destiny of the ${f} universe manifested as a trial of pure strength. Only those from the same origin can enter.`,
    franchise: f,
    element: ownedFranchiseElement(f) || undefined,
    baseCp: 1.5e6 + i * 2e5,
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
      baseCp: 5e5,
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
      pushShieldEffect(u, { type: "shield", duration: 2, val: 0.3, label: "EMERGENCY GUARD" });
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
      // BUG FIX: must match BattleUnit's speed-scaled animMs (see battleUI.jsx)
      // or the sim idles after the (now-shorter) visual animation finishes.
      if (castMs) hitStopUntil.current = Date.now() + Math.max(200, Math.round(castMs / (combatSpeed || 1))) + HITSTOP_BUFFER_MS;
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
    const TRIAL_COST = trial.staminaCost || 50;
    if (stamina < TRIAL_COST) {
      return createFloatingText(`Need ${TRIAL_COST} Stamina for Trial!`, true);
    }
    setStamina((s) => s - TRIAL_COST);
    comboRef.current.count = 0;
    setComboDisplay(0);
    setActiveTrial(trial);
    setPendingTrial(null);
    setBattleState("INTRO");
    playSound("mugen_land", 0.4);
    playSound(["mugen_round", "mugen_round2", "mugen_round3"][Math.floor(Math.random() * 3)], 0.6);
    setTimeout(() => playSound("mugen_fight", 0.6), 550);
    if (typeof setBattleMusicActive === "function") setBattleMusicActive(true);
    if (typeof setIsHardBattle === "function") setIsHardBattle(trial.difficulty === "hard" || trial.difficulty === "expert" || trial.type === "endless" || trial.type === "allstar");
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
          { type: "tactical_stance", duration: 9999, val: initialStanceVal, label: `STANCE:${playerElement}` },
          ...(c.name === "Jimmy Neutron" ? [{ type: "aggro", duration: 3, val: 0, label: "NOT LIKE THIS..." }] : [])
        ],
        dead: false,
        critRate: calculateSubStat(c, characters, "crit_rate", skills, auraUpgrades) / 100,
        technique: calculateSubStat(c, characters, "technique", skills, auraUpgrades),
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
    let enemies;
    if (trial.type === "allstar") {
      // ALL-STAR ROUND: fight the current series' own champions (their real
      // signatures), not a generic reskin -- more of them the deeper you go.
      const champs = seriesChampions(trial.allstarFranchise, trial.allstarRound < 4 ? 2 : 3);
      const chosen = champs.length ? champs : [characters[0]].filter(Boolean);
      const shares = chosen.length >= 3 ? [0.42, 0.31, 0.27] : chosen.length === 2 ? [0.58, 0.42] : [1];
      enemies = chosen.map((cd, i) => {
        const st = getEnemyStatsFromCP(trial.cpReq * difficultyScale * shares[i], "boss");
        const sig = findBossSig(cd.name);
        return {
          id: `allstar-${i}`,
          name: cd.name,
          img: cd.imageUrl,
          ...st,
          element: cd.element,
          franchise: trial.allstarFranchise,
          level: 100,
          _equippedGear: rollEnemyGear(4, bossGearRoll),
          skillId: cd.skillId || pickElite(trial.cpReq + i * 7),
          skillId2: sig ? sig.id : pickElite(trial.cpReq + 13 + i),
          abilityLevel: 12,
          abilityLevel2: 12,
          skillCd: 0,
          skillCd2: 0,
          maxSkillCd: 32,
          maxSkillCd2: 52,
          isEnemy: true,
          isBoss: i === 0,
          stagger: 0,
          maxStagger: 1500,
          // Fair-start fix: was 92-i*16 (76-92), a near-guaranteed first move. Same range as allies now.
          gauge: Math.random() * INITIAL_GAUGE_RANGE_WIDE,
          burst: 0,
          effects: [{ type: "shield", duration: 8, val: 0.32, label: "ALL-STAR AEGIS" }],
          dead: false,
          critRate: 0.06,
          evasion: 0.05,
          lifesteal: 0
        };
      });
    } else if (trial.type === "grind") {
      // GRIND DUNGEONS -- deliberately lighter than a real Trial boss fight:
      // "minion" stat archetype (not "boss"), no shield buff, only 1-2 weaker
      // foes, so these stay fast and repeatable. Still draws from BOSS_ROSTER
      // for art/name and still gets a real elite/signature skill so it isn't
      // a total pushover, matching "enemies use real abilities" elsewhere.
      const grindCount = trial.cpReq > 2e6 ? 2 : 1;
      const grindShares = grindCount === 2 ? [0.6, 0.4] : [1];
      enemies = Array.from({ length: grindCount }).map((_, i) => {
        const gDef = BOSS_ROSTER[Math.abs(trial.id.length + trial.id.charCodeAt(trial.id.length - 1) + i * 11) % BOSS_ROSTER.length];
        const gStats = getEnemyStatsFromCP(trial.cpReq * grindShares[i], "minion");
        return {
          id: `grind-${i}`,
          name: gDef.name,
          img: gDef.img,
          ...gStats,
          element: gDef.element,
          level: Math.min(100, 20 + trial.cpReq / 5e4),
          skillId: pickElite(trial.cpReq + i * 5),
          skillId2: pickElite(trial.cpReq + 17 + i),
          abilityLevel: 5,
          abilityLevel2: 5,
          skillCd: 0,
          skillCd2: 0,
          maxSkillCd: 45,
          maxSkillCd2: 65,
          isEnemy: true,
          isBoss: i === 0,
          stagger: 0,
          maxStagger: 1500,
          // Fair-start fix: was 60-i*15, ahead of allies' 0-50. Same range now.
          gauge: Math.random() * INITIAL_GAUGE_RANGE_WIDE,
          burst: 0,
          effects: [],
          dead: false,
          critRate: 0.04,
          evasion: 0.04,
          lifesteal: 0
        };
      });
    } else enemies = bossEntries.map((bossDef, i) => {
      // Named entries now fight like what they actually are -- a tank archetype
      // (Whispy Woods, Mighty Bear) tanks, a glass one (Attack Slug, Beanbot)
      // hits harder but folds faster -- instead of every trial boss sharing one
      // flat "boss" stat curve regardless of lore identity.
      const bossStats = getEnemyStatsFromCP(trial.cpReq * difficultyScale * cpShares[i], bossDef.archetype || "boss");
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
        // Fair-start fix: was 90-i*20 (70-90), a near-guaranteed first move. Same range as allies now.
        gauge: Math.random() * INITIAL_GAUGE_RANGE_WIDE,
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
      materials: Math.floor((trial.rewards?.materials || 0) * rewardScale),
      credits: Math.floor((trial.rewards?.credits || 0) * rewardScale),
      abilityShards: trial.targetSkillId ? { [trial.targetSkillId]: trial.shardAmount || 0 } : null,
      gearReward: trial.gearReward || null
    } });
    const leaderId = squadIds[0];
    const leaderChar = leaderId ? characters.find((c) => String(c.export_id) === String(leaderId)) : null;
    allies.forEach((a) => applyCrewChemistry(a, squad));
    if (leaderChar) {
      allies.forEach((a) => applyLeaderBonus(leaderChar, a, squad));
    }
    setCombatants([...enemies, ...allies]);
  };
  // Launch the current All-Star round against the active series. NO franchise/
  // element requirement (any squad may enter) -- deliberately no `element`
  // field so startTrial's element gate is skipped; the background/badge branch
  // on type === "allstar" instead.
  const startAllStarRound = () => {
    const series = gauntletCurrentSeries;
    if (!series) { createFloatingText("Recruit heroes across more series to open the gauntlet.", true); return; }
    const round = gauntletRound;
    const el = seriesChampions(series, 1)[0]?.element || "DARK";
    startTrial({
      id: `allstar_${round}`,
      name: `${series} — Round ${round}`,
      allstarFranchise: series,
      allstarRound: round,
      allstarElement: el,
      cpReq: gauntletCp(round),
      desc: `All-Star Gauntlet · Lap ${gauntletLap + 1}`,
      rewards: { gems: 12 + round, materials: 120 + round * 12, essence: 6 + Math.floor(round / 4), aura: 20 + round * 6 },
      difficulty: "hard",
      type: "allstar"
    });
  };
  // ============================ GRIND DUNGEONS ============================
  // A proper loot-run, not a target-picker: each clear drops a varied bundle
  // (credits, materials, essence, aura, a random gear piece, and shards of a
  // random ability at this tier's rarity band). Reward rates are pegged to
  // Campaign's own "Raid" auto-sweep (10 stamina flat, credits = stageId*600,
  // materials = stageId*40+~40, essence = stageId*3+5, aura = stageId*8) so a
  // grind run is genuinely competitive per-stamina with just re-raiding a
  // cleared Campaign stage -- it used to pay a small fraction of that, which
  // made it pointless busywork next to Campaign farming. Bring shards to any
  // equipped skill's SHARD BOOST (character screen) to instantly level it up
  // for free. Six lenient, repeatable tiers -- short fights, no franchise/
  // element gate -- meant to be run constantly, not saved for endgame like
  // All-Star/Arena.
  // Per-dungeon selected stamina PERCENTAGE (10%/25%/50%/100% of CURRENT
  // stamina), remembered by tier. Percentage-based instead of a flat 1x-5x
  // multiplier of a fixed base cost so the commitment automatically scales
  // with however much stamina the player actually has right now -- which
  // itself keeps growing from Deep Breath aura upgrades, Supernova, etc. A
  // flat "5x" ceiling stops mattering the moment max stamina outgrows it;
  // "50% of my current pool" never does.
  const [grindPctByTier, setGrindPctByTier] = useState({});
  const getGrindPct = (tier) => grindPctByTier[tier] || 25;
  const GRIND_STAMINA_PCTS = [10, 25, 50, 100];
  const grindEffMult = (dungeon, pct) => Math.max(1, Math.min(200, Math.floor((stamina * (pct / 100)) / dungeon.staminaCost)));
  const GRIND_DUNGEONS = [
    { tier: 1, name: "Back Alley Scrap", cpMult: 0.12, staminaCost: 12, shardAmount: 6, skillRarities: ["Common", "Uncommon"], gearRarities: ["Common"] },
    { tier: 2, name: "Warehouse Raid", cpMult: 0.28, staminaCost: 16, shardAmount: 7, skillRarities: ["Uncommon", "Rare"], gearRarities: ["Common", "Rare"] },
    { tier: 3, name: "Rooftop Skirmish", cpMult: 0.55, staminaCost: 20, shardAmount: 8, skillRarities: ["Rare"], gearRarities: ["Rare"] },
    { tier: 4, name: "Underground Circuit", cpMult: 1, staminaCost: 26, shardAmount: 9, skillRarities: ["Rare", "Epic"], gearRarities: ["Rare", "Epic"] },
    { tier: 5, name: "Vault Breach", cpMult: 1.8, staminaCost: 32, shardAmount: 10, skillRarities: ["Epic"], gearRarities: ["Epic"] },
    { tier: 6, name: "The Deep End", cpMult: 3, staminaCost: 40, shardAmount: 12, skillRarities: ["Epic", "Legendary"], gearRarities: ["Epic", "Legendary"] }
  ];
  // Per-stamina rates roughly matching a mid-Campaign-stage Raid sweep, with a
  // tier premium so deeper dungeons pay noticeably better per stamina too, not
  // just a bigger flat number.
  // STAMINA MULTIPLIER: the player can commit 2x/3x/5x a dungeon's base stamina
  // cost in one run for proportionally bigger rewards, PLUS a small "bulk"
  // premium (up to +20% at 5x) so spending stamina in one bigger sitting is
  // strictly better per-stamina than the same total spent 1x at a time --
  // this is the actual fix for "grind dungeons are pathetic," not just a
  // flat number bump.
  const GRIND_STAMINA_MULTS = [1, 2, 3, 5];
  const grindBulkMult = (mult) => 1 + Math.min(0.2, (mult - 1) * 0.05);
  const grindDungeonRewards = (dungeon, mult = 1) => {
    const tierMult = 1 + (dungeon.tier - 1) * 0.16;
    const bulkMult = grindBulkMult(mult);
    const totalStamina = dungeon.staminaCost * mult;
    return {
      credits: Math.round(totalStamina * 2500 * tierMult * bulkMult),
      materials: Math.round(totalStamina * 170 * tierMult * bulkMult),
      essence: Math.round(totalStamina * 13 * tierMult * bulkMult),
      aura: Math.round(totalStamina * 30 * tierMult * bulkMult)
    };
  };
  const grindSkillPool = (rarities) => (skills || []).filter((s) => !s.signature && rarities.includes(s.rarity));
  const rollGrindGear = (rarities) => {
    const slots = ["weapon", "armor", "trinket"];
    const slot = slots[Math.floor(Math.random() * slots.length)];
    const pool = (EQUIPMENT[slot] || []).filter((it) => rarities.includes(it.rarity));
    if (!pool.length) return null;
    const item = pool[Math.floor(Math.random() * pool.length)];
    return { slot, itemId: item.id, name: item.name, rarity: item.rarity };
  };
  const startGrindDungeon = (dungeon, mult = 1) => {
    const pool = grindSkillPool(dungeon.skillRarities);
    const targetSkill = pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
    // One gear roll PER multiplier step -- committing more stamina at once
    // means more actual loot rolls, not just bigger numbers on the same roll.
    const gearRolls = Array.from({ length: mult }).map(() => rollGrindGear(dungeon.gearRarities)).filter(Boolean);
    startTrial({
      id: `grind_${dungeon.tier}`,
      name: mult > 1 ? `${dungeon.name} (${mult}x)` : dungeon.name,
      desc: `Grind Dungeon · gear, credits, materials & shards${mult > 1 ? ` — ${mult}x stamina committed for bulk rewards` : ""}`,
      cpReq: 1.2e6 * dungeon.cpMult,
      rewards: grindDungeonRewards(dungeon, mult),
      difficulty: "medium",
      type: "grind",
      staminaCost: dungeon.staminaCost * mult,
      targetSkillId: targetSkill?.id || null,
      shardAmount: Math.round(dungeon.shardAmount * mult * grindBulkMult(mult)),
      gearReward: gearRolls
    });
  };
  const SHARD_TIER_COLOR = { Common: "#94a3b8", Uncommon: "#60a5fa", Rare: "#3b82f6", Epic: "#a855f7", Legendary: "#facc15", Mythic: "#ff2ecb" };
  const renderGrindDungeons = () => {
    const h = React.createElement;
    return h("div", { className: "grind-menu animate-fadeIn", style: { display: "grid", gap: 12 } },
      h("div", { className: "glass-panel", style: { padding: 14, marginBottom: 4 } },
        h("div", { style: { fontWeight: 900, fontSize: "1rem", color: "#facc15", marginBottom: 4 } }, "GRIND DUNGEONS"),
        h("div", { style: { fontSize: "0.72rem", color: "var(--text-muted)" } }, `Every clear drops a mixed loot bundle: credits, materials, essence, aura, gear, and ability shards. Commit a bigger SLICE of your current stamina (10%/25%/50%/100%, ${stamina.toLocaleString()}⚡ right now) for proportionally bigger rewards PLUS a bulk bonus (up to +20%) and extra gear rolls -- this scales with your stamina pool automatically as it grows, unlike a flat multiplier. Spend shards on an equipped skill's SHARD BOOST (character screen) for an instant free level.`)
      ),
      GRIND_DUNGEONS.map((dungeon) => {
        const cp = 1.2e6 * dungeon.cpMult;
        const pct = getGrindPct(dungeon.tier);
        const mult = grindEffMult(dungeon, pct);
        const r = grindDungeonRewards(dungeon, mult);
        const totalStamina = dungeon.staminaCost * mult;
        const shardTotal = Math.round(dungeon.shardAmount * mult * grindBulkMult(mult));
        const canAfford = stamina >= totalStamina && stamina >= dungeon.staminaCost;
        return h("div", { key: dungeon.tier, className: "glass-panel", style: { padding: 14, display: "flex", flexDirection: "column", gap: 8 } },
          h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 } },
            h("div", null,
              h("div", { style: { fontWeight: 900, fontSize: "0.9rem", color: "#fff" } }, `TIER ${dungeon.tier} — ${dungeon.name}`),
              h("div", { style: { fontSize: "0.65rem", color: "var(--text-muted)" } }, `Recommended Power: ${formatPower(cp)} · ${totalStamina}⚡ (${pct}% of ${stamina.toLocaleString()} current, ${mult}× base run${mult > 1 ? "s" : ""})`)
            ),
            h("button", { className: "train-btn", style: { width: "auto", padding: "8px 18px", background: canAfford ? "linear-gradient(135deg,#00d2ff,#0891b2)" : "#334155", color: canAfford ? "#000" : "#94a3b8", opacity: canAfford ? 1 : 0.6 }, disabled: !canAfford, onClick: () => startGrindDungeon(dungeon, mult) }, canAfford ? "ENTER" : "NOT ENOUGH ⚡")
          ),
          h("div", { style: { display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" } },
            h("span", { style: { fontSize: "0.58rem", fontWeight: 900, color: "var(--text-muted)", letterSpacing: 1 } }, "STAMINA SLICE:"),
            GRIND_STAMINA_PCTS.map((p) => h("button", {
              key: p,
              className: "sb-chip",
              style: {
                fontSize: "0.62rem", fontWeight: 900, cursor: "pointer", border: "1px solid " + (pct === p ? "#facc15" : "rgba(255,255,255,0.15)"),
                background: pct === p ? "rgba(250,204,21,0.18)" : "rgba(255,255,255,0.04)", color: pct === p ? "#facc15" : "#fff"
              },
              onClick: () => setGrindPctByTier((prev) => ({ ...prev, [dungeon.tier]: p }))
            }, `${p}%`))
          ),
          h("div", { style: { display: "flex", gap: 6, flexWrap: "wrap" } },
            h("span", { className: "sb-chip", style: { fontSize: "0.6rem", color: "#facc15" } }, `$${r.credits.toLocaleString()}`),
            h("span", { className: "sb-chip", style: { fontSize: "0.6rem", color: "#a3e635" } }, `${r.materials.toLocaleString()} materials`),
            h("span", { className: "sb-chip", style: { fontSize: "0.6rem", color: "#c084fc" } }, `${r.essence} essence`),
            h("span", { className: "sb-chip", style: { fontSize: "0.6rem", color: "#f472b6" } }, `${r.aura} aura`),
            h("span", { className: "sb-chip", style: { fontSize: "0.6rem", color: SHARD_TIER_COLOR[dungeon.gearRarities[dungeon.gearRarities.length - 1]] || "#fff" } }, `+${mult} gear piece${mult > 1 ? "s" : ""}`),
            h("span", { className: "sb-chip", style: { fontSize: "0.6rem", color: "#00d2ff" } }, `+${shardTotal} ability shards`),
            mult > 1 ? h("span", { className: "sb-chip", style: { fontSize: "0.6rem", color: "#4ade80", fontWeight: 900 } }, `+${Math.round((grindBulkMult(mult) - 1) * 100)}% bulk bonus`) : null
          )
        );
      })
    );
  };
  // Overhauled All-Star menu: current series showcase (champion portraits +
  // scaling enemy power), the escalating "road ahead" of upcoming series, and
  // the full gauntlet roadmap. Built with React.createElement for brevity.
  const renderAllStarMenu = () => {
    const h = React.createElement;
    const series = gauntletCurrentSeries;
    const champs = seriesChampions(series, 3);
    const cp = gauntletCp(gauntletRound);
    const elColor = ELEMENTS[champs[0]?.element]?.color || "#facc15";
    const upcoming = Array.from({ length: Math.min(6, gauntletLen) }).map((_, k) => ({
      round: gauntletRound + k,
      series: gauntletSeries[(gauntletIdx + k) % gauntletLen]
    }));
    return h("div", { className: "allstar-menu animate-fadeIn" }, [
      h("div", { className: "allstar-hero glass-panel", key: "hero", style: { "--as-color": elColor } }, [
        h("div", { className: "allstar-hero-bg", key: "bg" }),
        h("div", { className: "allstar-kicker", key: "k" }, [
          h("span", { className: "allstar-star", key: "s" }, "★"),
          `LAP ${gauntletLap + 1}  ·  ROUND ${gauntletRound}  ·  ${gauntletLen} SERIES`
        ]),
        h("h1", { className: "allstar-title", key: "t" }, "ALL-STAR GAUNTLET"),
        h("div", { className: "allstar-tagline", key: "tag" }, "Every series, in order. It only gets stronger."),
        series ? h("div", { className: "allstar-now", key: "now" }, [
          h("div", { className: "allstar-now-head", key: "nh" }, [
            h("span", { className: "allstar-now-label", key: "l" }, "NOW ENTERING"),
            h("span", { className: "allstar-now-series", key: "s" }, series)
          ]),
          h("div", { className: "allstar-champ-row", key: "cr" }, champs.length
            ? champs.map((cd, i) => h("div", { className: `allstar-champ ${i === 0 ? "lead" : ""}`, key: i }, [
                h("img", { key: "i", src: cd.imageUrl, alt: cd.name, loading: "lazy" }),
                h("div", { className: "allstar-champ-name", key: "n" }, cd.name)
              ]))
            : h("div", { className: "allstar-empty", key: "e" }, "This series has no champions to field yet.")),
          h("div", { className: "allstar-stats", key: "st" }, [
            h("div", { className: "allstar-stat", key: "p" }, [
              h("span", { className: "allstar-stat-label", key: "l" }, "ENEMY POWER"),
              h("span", { className: "allstar-stat-val", key: "v", style: { color: "#ef4444" } }, formatPower(cp))
            ]),
            h("div", { className: "allstar-stat", key: "r" }, [
              h("span", { className: "allstar-stat-label", key: "l" }, "REWARD"),
              h("span", { className: "allstar-stat-val", key: "v", style: { color: "#facc15" } }, `${12 + gauntletRound} 💎`)
            ]),
            h("div", { className: "allstar-stat", key: "c" }, [
              h("span", { className: "allstar-stat-label", key: "l" }, "COST"),
              h("span", { className: "allstar-stat-val", key: "v" }, "50 ⚡")
            ]),
            h("div", { className: "allstar-stat", key: "yp" }, [
              h("span", { className: "allstar-stat-label", key: "l" }, "YOUR POWER"),
              h("span", { className: "allstar-stat-val", key: "v", style: { color: totalSquadPWR >= cp ? "#4ade80" : "#f87171" } }, formatPower(totalSquadPWR))
            ])
          ]),
          h("div", { className: "allstar-cta-row", key: "ctarow", style: { display: "flex", gap: 8 } }, [
            h("button", { className: "allstar-cta", key: "cta", style: { flex: 1 }, onClick: () => startAllStarRound() },
              `CHALLENGE ${String(series).toUpperCase()}`),
            canAutoClearAllStar() ? h("button", {
              key: "auto", onClick: autoClearAllStarRound,
              style: { flex: 1, border: "none", borderRadius: 10, fontWeight: 900, letterSpacing: 1, fontSize: "0.8rem", cursor: "pointer", background: "linear-gradient(135deg,#00d2ff,#0891b2)", color: "#000" }
            }, "⚡ AUTO CLEAR") : null
          ])
        ]) : h("div", { className: "allstar-locked", key: "lk" },
          "Recruit at least 2 heroes from a series to open the gauntlet.")
      ]),
      h("div", { className: "allstar-road glass-panel", key: "road" }, [
        h("div", { className: "allstar-road-label", key: "l" }, "THE ROAD AHEAD"),
        h("div", { className: "allstar-road-track", key: "t" }, upcoming.map((u, k) =>
          h("div", { className: `allstar-stop ${k === 0 ? "current" : ""}`, key: k }, [
            h("span", { className: "allstar-stop-num", key: "n" }, `R${u.round}`),
            h("span", { className: "allstar-stop-name", key: "s" }, u.series || "—"),
            k < upcoming.length - 1 ? h("span", { className: "allstar-stop-arrow", key: "a" }, "→") : null
          ])))
      ])
    ]);
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
  const buildArenaMatchup = (avgAllyStats, rank, usedIds, isPromotionMatch = false) => {
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
      const wantLow = !isPromotionMatch && Math.random() < 0.2;
      const order = isPromotionMatch ? [sigHigh, sigLow, otherHigh, otherLow] : wantLow ? [sigLow, sigHigh, otherLow, otherHigh] : [sigHigh, sigLow, otherHigh, otherLow];
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
    // Moderate difficulty bump ("sorta" harder, not All-Star-extreme): early
    // ranks are barely touched, but the top of the ladder now demands a
    // meaningfully stronger squad than before rather than a stats-matched one.
    const t = Math.max(0, rank - 1) / 99;
    const promoMult = isPromotionMatch ? 1.18 : 1;
    const hpMult  = (3 + t * 16) * promoMult;
    const atkMult = (0.62 + t * 1.8) * promoMult;
    const defMult = (0.42 + t * 1.8) * promoMult;
    const spdMult = (0.72 + t * 1.0) * promoMult;
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
        // Fair-start fix: was 40-80, ahead of allies' 0-50. Same range now.
        gauge: Math.random() * INITIAL_GAUGE_RANGE_WIDE,
        burst: 0,
        effects: [
          { type: "regen", duration: 9999, val: isPromotionMatch ? 0.02 : 0.015, label: isPromotionMatch ? "PROMOTION RESILIENCE" : "ARENA RESILIENCE" },
          ...(champ.name === "Jimmy Neutron" ? [{ type: "aggro", duration: 3, val: 0, label: "NOT LIKE THIS..." }] : [])
        ],
        dead: false,
        critRate: 0.05 + rank * 1e-3,
        evasion: 0.04 + rank * 5e-4,
        lifesteal: i === 0 ? 0.05 : 0,
        previewSkill1: skill1 ? { name: skill1.name, signature: !!skill1.signature, rarity: skill1.rarity } : null,
        previewSkill2: skill2 ? { name: skill2.name, signature: !!skill2.signature, rarity: skill2.rarity } : null,
        isPromotionMatch
      };
    });
  };
  const scoutArenaOpponents = () => {
    const squad = characters.filter((c) => (squadIds || []).some((id) => String(id) === String(c.export_id))).slice(0, 3);
    if (!squad || squad.length < 3) {
      return createFloatingText("Arena requires 3 heroes. Edit your squad to enter.", true);
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
    const isPromotionMatch = arenaWinStreak >= ARENA_QUALIFIER_WINS;
    const matchups = [0, 1, 2].map(() => buildArenaMatchup(avgAllyStats, arenaRank, usedIds, isPromotionMatch));
    setArenaScouted({ matchups, avgAllyStats, isPromotionMatch });
    playSound("ui_cancel");
  };
  const startArenaMatchup = (enemies) => {
    const squad = characters.filter((c) => (squadIds || []).some((id) => String(id) === String(c.export_id))).slice(0, 3);
    if (!squad || squad.length < 3) {
      return createFloatingText("Arena requires 3 heroes. Edit your squad to enter.", true);
    }
    const ARENA_COST = 75;
    if (stamina < ARENA_COST) {
      return createFloatingText(`Need ${ARENA_COST} Stamina for Arena!`, true);
    }
    setStamina((s) => s - ARENA_COST);
    comboRef.current.count = 0;
    setComboDisplay(0);
    setActiveTrial({
      id: `arena_${arenaRank}_${Date.now()}`,
      name: `${enemies[0]?.isPromotionMatch ? "Promotion Match" : "Arena Match"} · Rank ${arenaRank}`,
      element: enemies[0].element,
      type: "arena",
      isPromotionMatch: !!enemies[0]?.isPromotionMatch,
      rewards: {},
      scaledRewards: {
        gems: (20 + Math.floor(arenaRank * 2.5)) * (enemies[0]?.isPromotionMatch ? 2 : 1),
        materials: (200 + arenaRank * 25) * (enemies[0]?.isPromotionMatch ? 2 : 1),
        essence: (10 + Math.floor(arenaRank / 2)) * (enemies[0]?.isPromotionMatch ? 2 : 1),
        aura: (arenaRank * 5) * (enemies[0]?.isPromotionMatch ? 2 : 1)
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
          { type: "tactical_stance", duration: 9999, val: initialStanceVal, label: `STANCE:${playerElement}` },
          ...(c.name === "Jimmy Neutron" ? [{ type: "aggro", duration: 3, val: 0, label: "NOT LIKE THIS..." }] : [])
        ],
        dead: false,
        critRate: calculateSubStat(c, characters, "crit_rate", skills, auraUpgrades) / 100,
        technique: calculateSubStat(c, characters, "technique", skills, auraUpgrades),
        evasion: calculateSubStat(c, characters, "evasion", skills, auraUpgrades) / 100,
        lifesteal: 0
      };
    });
    const leaderId = squadIds[0];
    const leaderChar = leaderId ? characters.find((c) => String(c.export_id) === String(leaderId)) : null;
    allies.forEach((a) => applyCrewChemistry(a, squad));
    if (leaderChar) {
      allies.forEach((a) => applyLeaderBonus(leaderChar, a, squad));
    }
    setCombatants([...enemies, ...allies]);
  };
  React.useEffect(() => {
    if (battleState !== "ACTIVE") return;
    const timer = setInterval(() => {
      // Guest summon, auto-piloted -- fires the instant it's ready while Auto
      // is on (see CampaignView's identical hook for why).
      if (autoBattle && cameoData && Date.now() >= hitStopUntil.current) {
        const cameoReady = cameoRef.current.usesLeft > 0 && Date.now() - cameoRef.current.lastUsed >= 60000;
        if (cameoReady) triggerCameo();
      }
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
        // Fair-start fix: shuffle scan order each tick so same-tick gauge-100 ties
        // aren't always won by enemies (see CampaignView.js for the full rationale).
        const scanOrder = [...next].sort(() => Math.random() - 0.5);
        scanOrder.forEach((u) => {
          if (u.dead) return;
          // HIT-STUN -- see CombatSystem's getHitstunMs/applyHitstun.
          if (Date.now() < (u._hitstunUntil || 0)) return;
          const stats = getBattleStats(u, curEl, u.activeSynergies || []);
          { const cdg = getCooldownGain(u); if (u.skillCd < u.maxSkillCd) u.skillCd = Math.min(u.maxSkillCd, u.skillCd + cdg); if (u.skillId2 && u.skillCd2 < u.maxSkillCd2) u.skillCd2 = Math.min(u.maxSkillCd2, u.skillCd2 + cdg); }
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
                const nextState = executeCombatSkill({ combatants: next, attackerId: u.id, skills, playerElement: curEl, isLimitBreak: isBurstReady, extraPowerMult: u.isEnemy ? 1 : comboMult() });
                nextState.forEach((ns, ni) => next[ni] = ns);
                const casterAfter = next.find((n) => n.id === u.id);
                if (casterAfter?._triggeredTimeStopAt && timeStopHandledRef.current[u.id] !== casterAfter._triggeredTimeStopAt) {
                  timeStopHandledRef.current[u.id] = casterAfter._triggeredTimeStopAt;
                  if (typeof onWorldTimeStop === "function") onWorldTimeStop(casterAfter._timeStopMusicMs || 5000);
                }
                const castMs = getCastAnimMs(casterAfter?.lastCastAnim);
                if (castMs) hitStopUntil.current = Date.now() + Math.max(200, Math.round(castMs / (curSpd || 1))) + HITSTOP_BUFFER_MS;
                if (u.isEnemy) breakCombo(); else bumpCombo(2);
              } else {
                const result = resolveBasicAttack({ attacker: u, allUnits: next, playerElement: curEl, comboMult, comboCount: comboRef.current.count, skills });
                if (result) {
                  hitStopUntil.current = Date.now() + Math.max(200, Math.round(getBasicAttackMs(result.meleeAir) / (curSpd || 1))) + HITSTOP_BUFFER_MS;
                  if (u.isEnemy) breakCombo(); else bumpCombo(result.meleeHits || 1);
                  if (!result.missed) {
                    if (!u.isEnemy) { u._battleDamage = (u._battleDamage || 0) + result.amount; u._battleBestHit = Math.max(u._battleBestHit || 0, result.amount); }
                    const splits = result.hitSplits && result.hitSplits.length ? result.hitSplits : [result.amount];
                    splits.forEach((d, hi) => setTimeout(() => {
                      showDamage(result.targetId, d, hi === splits.length - 1 && splits.length > 1 ? "crit" : "normal");
                      playSound(getFlurryHitSound(hi, splits.length, result.meleeAir), hi === splits.length - 1 ? 0.4 : 0.22);
                      if (hi === 0 && result.meleeAir) playSound(["spin0", "spin1", "spin2"][Math.floor(Math.random() * 3)], 0.35);
                    }, hi * 105));
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
        else playSound("attack");
        if (skill.signature) { playSound("knife_swing", 0.5); playSound("mugen_super", 0.45); }
        else if (skill.power >= 2.5) playSound("knife_swing", 0.5);
        else if (skill.type === "atk" || skill.type === "combo") {
          playSound("spin" + Math.floor(Math.random() * 3), 0.4);
          playSound("mugen_atk" + Math.floor(Math.random() * 5), 0.3);
          const swipePool = skill.damageType === "magical" ? ["act_lunge_magic", "act_whoosh1", "act_whoosh2"] : ["act_swipe1", "act_swipe2", "act_swipe3", "act_swipe4", "act_lunge_generic"];
          playSound(swipePool[Math.floor(Math.random() * swipePool.length)], 0.35);
        }
        // Bespoke sting for the newer anime-flavored castAnim set (see
        // CAST_ANIM_SOUND) -- layers on TOP of the generic picks above rather
        // than replacing them; returns null (no-op) for every older castAnim.
        const animSting = getCastAnimSound((skill.meta || {}).castAnim);
        if (animSting) playSound(animSting, 0.4);
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
  const getVictoryRewards = (trial) => {
    if (!trial?.scaledRewards) return {};
    const repeatable = trial.type === "allstar" || trial.type === "endless" || trial.type === "arena" || trial.type === "grind";
    if (!repeatable && clearedTrials.includes(trial.id)) return {};
    return trial.scaledRewards;
  };
  const grantRewards = (rewards) => {
    setGems((g) => g + (rewards.gems || 0));
    setAura((a) => a + (rewards.aura || 0));
    setMaterials((m) => m + (rewards.materials || 0));
    setEssence((e) => e + (rewards.essence || 0));
    if (rewards.credits && typeof setCredits === "function") setCredits((c) => c + rewards.credits);
    if (rewards.abilityShards && typeof setAbilityShards === "function") {
      setAbilityShards((prev) => {
        const next = { ...prev };
        Object.entries(rewards.abilityShards).forEach(([id, amt]) => { next[id] = (next[id] || 0) + amt; });
        return next;
      });
    }
    if (rewards.gearReward && typeof setGearInventory === "function") {
      // Grind Dungeons can hand back MULTIPLE gear rolls when the player
      // committed a stamina multiplier -- other trial types still pass a
      // single object, so accept both shapes.
      const items = Array.isArray(rewards.gearReward) ? rewards.gearReward : [rewards.gearReward];
      items.filter(Boolean).forEach((g) => {
        setGearInventory((prev) => [...prev, { instanceId: makeGearInstanceId(), slot: g.slot, itemId: g.itemId, level: 1 }]);
        createFloatingText(`+ ${g.name} (${g.rarity})`, false, SHARD_TIER_COLOR[g.rarity] || "#00d2ff");
      });
    }
  };
  // AUTO-CLEAR: once a squad's PWR clears the recommended power by
  // AUTO_CLEAR_PWR_MULT, the fight's a foregone conclusion -- skip the battle
  // and grant rewards instantly. Deliberately NOT offered for Elemental/Series
  // trials (they're the lenient/accessible tier, meant to always be played),
  // only All-Star and Arena, the two hard/endgame modes.
  const totalSquadPWR = useMemo(() => (squadIds || []).reduce((sum, id) => {
    const c = characters.find((ch) => String(ch.export_id) === String(id));
    return sum + (c ? calculateSubStat(c, characters, "pwr", skills, auraUpgrades) : 0);
  }, 0), [squadIds, characters, skills, auraUpgrades]);
  // Arena only ever fields 3, so its own PWR reference is the first 3 slots,
  // not the full 5-wide squad total used elsewhere.
  const arenaSquadPWR = useMemo(() => (squadIds || []).slice(0, 3).reduce((sum, id) => {
    const c = characters.find((ch) => String(ch.export_id) === String(id));
    return sum + (c ? calculateSubStat(c, characters, "pwr", skills, auraUpgrades) : 0);
  }, 0), [squadIds, characters, skills, auraUpgrades]);
  // Arena enemies scale off the PLAYER'S OWN stats (see buildArenaMatchup), so
  // there's no external cpReq to compare against -- auto-clear instead unlocks
  // once the squad is flatly this overqualified for the mode entirely,
  // regardless of current rank (roughly a near-maxed 3-hero squad).
  const ARENA_AUTO_CLEAR_PWR = 15e6;
  const canAutoClearAllStar = () => gauntletCurrentSeries && totalSquadPWR >= gauntletCp(gauntletRound) * AUTO_CLEAR_PWR_MULT;
  const canAutoClearArena = () => arenaSquadPWR >= ARENA_AUTO_CLEAR_PWR;
  const autoClearAllStarRound = () => {
    if (!canAutoClearAllStar()) return;
    const TRIAL_COST = 50;
    if (stamina < TRIAL_COST) { createFloatingText(`Need ${TRIAL_COST} Stamina!`, true); return; }
    setStamina((s) => s - TRIAL_COST);
    setEndlessFloor((f) => f + 1);
    grantRewards({
      gems: Math.floor(5e4 * 1),
      aura: Math.floor(5e3 * 1),
      essence: Math.floor(500 * 1),
      materials: Math.floor(2500 * 1)
    });
    const nextSeries = gauntletSeries[gauntletRound % gauntletLen];
    createFloatingText(`AUTO-CLEARED ROUND ${gauntletRound}! Next: ${nextSeries || "???"}`, false, "#00d2ff");
    playSound("success");
  };
  const autoClearArenaMatch = () => {
    if (!canAutoClearArena()) return;
    const ARENA_COST = 75;
    if (stamina < ARENA_COST) { createFloatingText(`Need ${ARENA_COST} Stamina for Arena!`, true); return; }
    setStamina((s) => s - ARENA_COST);
    const isPromotionMatch = arenaWinStreak >= ARENA_QUALIFIER_WINS;
    const rewardMult = isPromotionMatch ? 2 : 1;
    grantRewards({
      gems: (20 + Math.floor(arenaRank * 2.5)) * rewardMult,
      materials: (200 + arenaRank * 25) * rewardMult,
      essence: (10 + Math.floor(arenaRank / 2)) * rewardMult,
      aura: (arenaRank * 5) * rewardMult
    });
    if (isPromotionMatch) {
      const promotedRank = arenaRank + 1;
      setArenaWinStreak(0);
      setArenaRank((rank) => rank + 1);
      createFloatingText(`AUTO-CLEARED! PROMOTED TO RANK ${promotedRank}!`, false, "#00d2ff");
    } else {
      const nextStreak = Math.min(ARENA_QUALIFIER_WINS, arenaWinStreak + 1);
      setArenaWinStreak(nextStreak);
      createFloatingText(`AUTO-CLEARED QUALIFIER! (${nextStreak}/${ARENA_QUALIFIER_WINS})`, false, "#00d2ff");
    }
    setArenaScouted(null);
    playSound("success");
  };
  const finishTrial = () => {
    if (battleState === "WIN") {
      const isFirst = !clearedTrials.includes(activeTrial.id);
      if (activeTrial.type === "allstar" || activeTrial.type === "endless") {
        setEndlessFloor((f) => f + 1);
        grantRewards(getVictoryRewards(activeTrial));
        const nextSeries = gauntletSeries[gauntletRound % gauntletLen];
        createFloatingText(`ROUND ${gauntletRound} CLEARED! Next: ${nextSeries || "???"}`, false, "#facc15");
      } else if (activeTrial.type === "arena") {
        if (activeTrial.isPromotionMatch) {
          const promotedRank = arenaRank + 1;
          setArenaWinStreak(0);
          setArenaRank((rank) => rank + 1);
          createFloatingText(`PROMOTED TO RANK ${promotedRank}!`, false, "#facc15");
        } else {
          const nextStreak = Math.min(ARENA_QUALIFIER_WINS, arenaWinStreak + 1);
          setArenaWinStreak(nextStreak);
          createFloatingText(nextStreak >= ARENA_QUALIFIER_WINS ? "PROMOTION MATCH UNLOCKED!" : `QUALIFIER WIN! (${nextStreak}/${ARENA_QUALIFIER_WINS})`, false, "#facc15");
        }
        grantRewards(getVictoryRewards(activeTrial));
      } else if (isFirst) {
        setClearedTrials((prev) => prev.includes(activeTrial.id) ? prev : [...prev, activeTrial.id]);
        grantRewards(getVictoryRewards(activeTrial));
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
    /* @__PURE__ */ jsxDEV(TrialsMenu, { onWorldTimeStop, cameoId, characters, unlockedIds, createFloatingText, squadIds, setSquadIds, clearedTrials, setClearedTrials, setGems, setAura, stamina, setStamina, setBattleMusicActive, setIsVictoryMusic, setIsHardBattle, triggerVisualEffect2, endlessFloor, setEndlessFloor, arenaRank, setArenaRank, setCredits, setMaterials, setEssence, skills, setShowSquadBuilder, auraUpgrades, setCharacters, abilityShards, setAbilityShards, gearInventory, setGearInventory, ARENA_AUTO_CLEAR_PWR, ARENA_QUALIFIER_WINS, ARENA_WINS_PER_RANK, DIFFICULTY_CONFIG, GRIND_DUNGEONS, GRIND_STAMINA_MULTS, GRIND_STAMINA_PCTS, SHARD_TIER_COLOR, activeSkill, activeTab, activeTrial, allFranchises, arenaScouted, arenaSquadPWR, arenaWinStreak, autoBattle, autoClearAllStarRound, autoClearArenaMatch, baseElementTrials, baseFranchiseTrials, battleSceneRef, battleState, breakCombo, buildArenaMatchup, bumpCombo, cameoCutin, cameoData, cameoRef, canAutoClearAllStar, canAutoClearArena, changePlayerElement, combatSpeed, combatants, comboDisplay, comboMult, comboRef, deadIdsRef, eligibleFranchises, extractFranchise, finishTrial, floatingDamages, franchiseCounts, gauntletCp, gauntletCurrentSeries, gauntletIdx, gauntletLap, gauntletLen, gauntletRound, gauntletSeries, getGrindPct, getVictoryRewards, grantRewards, grindBulkMult, grindDungeonRewards, grindEffMult, grindPctByTier, grindSkillPool, groupedTrials, handledActionTimes, hitStopUntil, koEvent, lastSkillTimestamp, minorFranchiseChars, ownedFranchiseElement, pendingTrial, playerElement, renderAllStarMenu, renderGrindDungeons, rollGrindGear, scoutArenaOpponents, seriesChampions, setActiveSkill, setActiveTab, setActiveTrial, setArenaScouted, setArenaWinStreak, setAutoBattle, setBattleState, setCameoCutin, setCombatSpeed, setCombatants, setComboDisplay, setFloatingDamages, setGrindPctByTier, setKoEvent, setLastSkillTimestamp, setPendingTrial, setPlayerElement, showDamage, startAllStarRound, startArenaMatchup, startGrindDungeon, startTrial, statsSummary, tacticalStanceId, timeStopHandledRef, toggleTrialSquadMember, totalSquadPWR, trials, triggerCameo, triggerDefend, triggerSkill }, void 0, false, {}),
    pendingTrial && /* @__PURE__ */ jsxDEV(PreTrialModal, { onWorldTimeStop, cameoId, characters, unlockedIds, createFloatingText, squadIds, setSquadIds, clearedTrials, setClearedTrials, setGems, setAura, stamina, setStamina, setBattleMusicActive, setIsVictoryMusic, setIsHardBattle, triggerVisualEffect2, endlessFloor, setEndlessFloor, arenaRank, setArenaRank, setCredits, setMaterials, setEssence, skills, setShowSquadBuilder, auraUpgrades, setCharacters, abilityShards, setAbilityShards, gearInventory, setGearInventory, ARENA_AUTO_CLEAR_PWR, ARENA_QUALIFIER_WINS, ARENA_WINS_PER_RANK, DIFFICULTY_CONFIG, GRIND_DUNGEONS, GRIND_STAMINA_MULTS, GRIND_STAMINA_PCTS, SHARD_TIER_COLOR, activeSkill, activeTab, activeTrial, allFranchises, arenaScouted, arenaSquadPWR, arenaWinStreak, autoBattle, autoClearAllStarRound, autoClearArenaMatch, baseElementTrials, baseFranchiseTrials, battleSceneRef, battleState, breakCombo, buildArenaMatchup, bumpCombo, cameoCutin, cameoData, cameoRef, canAutoClearAllStar, canAutoClearArena, changePlayerElement, combatSpeed, combatants, comboDisplay, comboMult, comboRef, deadIdsRef, eligibleFranchises, extractFranchise, finishTrial, floatingDamages, franchiseCounts, gauntletCp, gauntletCurrentSeries, gauntletIdx, gauntletLap, gauntletLen, gauntletRound, gauntletSeries, getGrindPct, getVictoryRewards, grantRewards, grindBulkMult, grindDungeonRewards, grindEffMult, grindPctByTier, grindSkillPool, groupedTrials, handledActionTimes, hitStopUntil, koEvent, lastSkillTimestamp, minorFranchiseChars, ownedFranchiseElement, pendingTrial, playerElement, renderAllStarMenu, renderGrindDungeons, rollGrindGear, scoutArenaOpponents, seriesChampions, setActiveSkill, setActiveTab, setActiveTrial, setArenaScouted, setArenaWinStreak, setAutoBattle, setBattleState, setCameoCutin, setCombatSpeed, setCombatants, setComboDisplay, setFloatingDamages, setGrindPctByTier, setKoEvent, setLastSkillTimestamp, setPendingTrial, setPlayerElement, showDamage, startAllStarRound, startArenaMatchup, startGrindDungeon, startTrial, statsSummary, tacticalStanceId, timeStopHandledRef, toggleTrialSquadMember, totalSquadPWR, trials, triggerCameo, triggerDefend, triggerSkill }, void 0, false, {}),
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
      /* @__PURE__ */ jsxDEV(TurnOrderStrip, { combatants, playerElement, combatSpeed }, "turn-strip", false, { fileName: "<stdin>", lineNumber: 1, columnNumber: 1 }),
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
            cameoData ? (() => {
              const cdLeft = Math.max(0, 60000 - (Date.now() - cameoRef.current.lastUsed));
              const ready = cameoRef.current.usesLeft > 0 && cdLeft <= 0;
              return React.createElement("button", {
                key: "cameo", onClick: triggerCameo, disabled: !ready, className: "train-btn",
                style: { padding: "8px 12px", fontSize: "0.7rem", width: "auto", background: ready ? "linear-gradient(135deg,#00d2ff,#0891b2)" : "#334155", color: ready ? "#000" : "#94a3b8" },
                title: cameoRef.current.usesLeft <= 0 ? "No guest summons left" : !ready ? `Recharging (${Math.ceil(cdLeft / 1000)}s)` : `Summon ${cameoData.name}`
              }, ready ? "SUMMON" : cameoRef.current.usesLeft <= 0 ? "SPENT" : `${Math.ceil(cdLeft / 1000)}s`);
            })() : null,
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
        comboDisplay >= 2 && /* @__PURE__ */ jsxDEV("div", { className: `combo-counter ${comboDisplay >= 20 ? "combo-tier-3" : comboDisplay >= 10 ? "combo-tier-2" : "combo-tier-1"}`, children: [
          /* @__PURE__ */ jsxDEV("div", { className: "combo-hits", children: [comboDisplay, " HITS"] }, comboDisplay, true, { fileName: "<stdin>", lineNumber: 1, columnNumber: 1 }),
          /* @__PURE__ */ jsxDEV("div", { className: "combo-bonus", children: ["+", Math.round(Math.min(40, comboDisplay * 2)), "% DMG"] }, void 0, true, { fileName: "<stdin>", lineNumber: 1, columnNumber: 1 })
        ] }, void 0, true, { fileName: "<stdin>", lineNumber: 1, columnNumber: 1 }),
        /* @__PURE__ */ jsxDEV("div", { className: "battle-background-layer", style: { backgroundImage: `url(${activeTrial?.type === "allstar" ? "background_citadel.png" : activeTrial?.type === "endless" ? "background_void.png" : activeTrial?.element === "FIRE" ? "fx_burn.png" : activeTrial?.element === "WATER" ? "background_battle.png" : "background_citadel.png"})` } }, void 0, false, {
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
          const h = React.createElement;
          const isArena = activeTrial?.type === "arena";
          const isVoid = activeTrial?.type === "endless";
          const isAllStar = activeTrial?.type === "allstar";
          const tier = isArena ? getArenaTier(arenaRank) : null;
          const tint = tier ? tier.color : isAllStar ? "#facc15" : isVoid ? "#a855f7" : ELEMENTS[activeTrial?.element]?.color || "#a855f7";
          const emblem = tier ? tier.emblem : isAllStar ? "★" : isVoid ? "◈" : "✦";
          const label = tier ? `${tier.name} LEAGUE` : isAllStar ? `ALL-STAR · ROUND ${activeTrial?.allstarRound || ""}` : isVoid ? "THE VOID" : (activeTrial?.difficulty || "TRIAL").toUpperCase();
          const missionName = isArena ? `RANK ${arenaRank}` : isAllStar ? (activeTrial?.allstarFranchise || "").toUpperCase() : (activeTrial?.name || "").toUpperCase();
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
        /* @__PURE__ */ jsxDEV("div", { className: "battle-formation enemy-row", children: combatants.filter((c) => c.isEnemy).map((u) => /* @__PURE__ */ jsxDEV(BattleUnit, { unit: u, floatingDamages: floatingDamages.filter((d) => d.targetId === u.id), combatSpeed }, u.id, false, {
          fileName: "<stdin>",
          lineNumber: 8142,
          columnNumber: 60
        })) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 8141,
          columnNumber: 14
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "battle-formation hero-row", children: combatants.filter((c) => !c.isEnemy).map((u) => /* @__PURE__ */ jsxDEV(BattleUnit, { unit: u, floatingDamages: floatingDamages.filter((d) => d.targetId === u.id), combatSpeed }, u.id, false, {
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
          rewards: getVictoryRewards(activeTrial),
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
