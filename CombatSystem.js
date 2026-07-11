import { Fragment, jsxDEV } from "react/jsx-dev-runtime";
import React, { useState, useRef, useEffect, useMemo } from "react";
import gsap from "gsap";
import {
  X,
  Plus,
  Zap,
  Star,
  Shield,
  Users,
  Database,
  Monitor,
  Sparkles,
  Flame,
  Snowflake,
  Skull,
  Activity,
  ArrowUpCircle,
  ArrowDownCircle,
  ChevronRight,
  ChevronLeft,
  Trophy,
  Swords,
  Map as MapIcon,
  Sword,
  Ban,
  Gem,
  Package,
  Crown,
  Heart
} from "lucide-react";
import { ELEMENTS, LEADER_SKILLS, CAMPAIGN_CONTENT, SKILL_RARITY_CONFIG, COSMETICS } from "./constants.js";
import {
  calculateStat,
  calculateSubStat,
  playSound,
  applyLeaderBonus,
  getTierEfficiency,
  getBondMultiplier,
  getEnemyStatsFromCP,
  getAbilityColor,
  formatPower,
  getSkillTags,
  applyMitigation,
  SIGNATURE_BONUS,
  SPECIAL_STATS,
  SPECIAL_CAP,
  getGearPassives
} from "./utils.js";
import { CustomSelect, TierBadge, VisualEffect } from "./components.js";
const getBattleStats = (unit, playerElement, activeSynergies = []) => {
  if (!unit) return { hp: 0, atk: 0, def: 0, speed: 0, magicAtk: 0, magicDef: 0, critRate: 0.05, evasion: 0.05, lifesteal: 0, luck: 0 };
  let maxHp = unit.maxHp || 0;
  let atk = unit.atk || 0;
  let def = unit.def || 0;
  let speed = unit.speed || 0;
  let magicAtk = unit.magicAtk || 0;
  let magicDef = unit.magicDef || 0;
  let critRate = unit.critRate || 0.05;
  let evasion = unit.evasion || 0.05;
  let lifesteal = unit.lifesteal || 0;
  let luck = unit.luck || 10;
  const effects = unit.effects || [];
  effects.forEach((eff) => {
    if (eff.type === "buff_atk") {
      atk *= 1 + eff.val;
      magicAtk *= 1 + eff.val;
    }
    if (eff.type === "buff_def") {
      def *= 1 + eff.val;
      magicDef *= 1 + eff.val;
    }
    if (eff.type === "buff_spd") speed *= 1 + eff.val;
    if (eff.type === "buff_crit") critRate += eff.val;
    // --- SPECIAL-linked escalating statuses (reusable) ---------------------------
    // Five status types themed to SPECIAL stats. Each carries a `ramp` so its value
    // climbs every turn it persists (see the view ticks), so they start subtle and
    // snowball. Any signature can apply them, not just Courier.
    if (eff.type === "overheat")  { atk *= 1 + eff.val; }                    // STR: physical power, rising
    if (eff.type === "precision") { critRate += eff.val; }                   // PER: crit chance, rising
    if (eff.type === "fortify")   { def *= 1 + eff.val; magicDef *= 1 + eff.val; } // END: defenses, rising
    if (eff.type === "charm")     { luck *= 1 + eff.val; critRate += eff.val * 0.5; } // CHA: luck/crit, rising
    if (eff.type === "overclock") { magicAtk *= 1 + eff.val; }               // INT: magic power, rising
    // NEW: elemental empowerment — raises the unit's elemental (all) damage output.
    // Amps both physical and magical offense; stacks with regular ATK buffs and
    // reads as a distinct channel (its own pip + aura visual). Signatures grant
    // this to the whole squad at varying strengths.
    if (eff.type === "buff_elemdmg") {
      atk *= 1 + eff.val;
      magicAtk *= 1 + eff.val;
    }
    // NEW: CRUSHED — Kazeto's ball-and-chain mechanic. Stacks; each stack shreds
    // the target's defenses AND amplifies the damage crush skills deal to them.
    if (eff.type === "crushed") {
      def *= 1 - eff.val;
      magicDef *= 1 - eff.val;
    }
    if (eff.type === "debuff_atk") {
      atk *= 1 - eff.val;
      magicAtk *= 1 - eff.val;
    }
    if (eff.type === "debuff_def") {
      def *= 1 - eff.val;
      magicDef *= 1 - eff.val;
    }
    if (eff.type === "debuff_spd") speed *= 1 - eff.val;
    if (eff.type === "burn") {
      atk *= 0.8;
      magicAtk *= 0.8;
    }
    if (eff.type === "freeze") {
      speed *= 0.5;
    }
    if (eff.type === "poison") {
      def *= 0.8;
    }
    if (eff.type === "static") {
      evasion *= 0.5;
    }
    if (eff.type === "boss_presence") {
      def *= 1.3;
      magicDef *= 1.3;
    }
  });
  if (!unit.isEnemy && playerElement) {
    const isMatch = unit.element === playerElement;
    const matchMult = isMatch ? 1.5 : 1;
    switch (playerElement) {
      case "FIRE":
        atk *= 1.3 + (isMatch ? 0.3 : 0);
        magicAtk *= 1.3 + (isMatch ? 0.3 : 0);
        break;
      case "WATER":
        def *= 1.25 + (isMatch ? 0.25 : 0);
        magicDef *= 1.25 + (isMatch ? 0.25 : 0);
        break;
      case "WIND":
        speed *= 1.2 + (isMatch ? 0.2 : 0);
        break;
      case "LIGHT":
        maxHp = Math.floor(maxHp * (1.1 + (isMatch ? 0.2 : 0)));
        break;
      case "DARK":
        critRate += 0.15 * matchMult;
        break;
      case "EARTH":
        def *= 1.4 + (isMatch ? 0.2 : 0);
        speed *= 0.9;
        break;
    }
    luck *= 1.5 * matchMult;
  }
  if (!unit.isEnemy && activeSynergies.length > 0) {
    activeSynergies.forEach((syn) => {
      if (syn.element === unit.element) {
        atk *= 1.15;
        def *= 1.15;
        magicAtk *= 1.15;
        magicDef *= 1.15;
      }
      if (syn.isFranchise) {
        speed *= 1.1;
      }
    });
  }
  return { hp: maxHp, atk, def, speed, magicAtk, magicDef, critRate, evasion, lifesteal, luck };
};
// Pick a bespoke cast animation for a skill. An explicit meta.castAnim always
// wins; otherwise the animation is derived from the skill's own shape so every
// skill gets varied, thematically-fitting motion for free -- not just
// signatures. Keep the returned keys in sync with the .cast-* CSS classes in
// style.css.
const deriveCastAnim = (sig) => {
  if (!sig) return null;
  const m = sig.meta || {};
  if (m.castAnim) return m.castAnim;
  const stat = String(sig.scalingStat || "").toLowerCase();
  const magic = sig.damageType === "magical" || stat.includes("magic");
  const power = sig.power || 0;
  const txt = `${sig.name || ""} ${sig.desc || ""}`;
  if (m.lifesteal || m.drain || /drain|vampir|leech|siphon|feast/i.test(txt)) return "cast-vanish";
  if (/orbit|satellite|ring|halo|swirl|spiral|circle/i.test(txt)) return "cast-orbit";
  if (m.execute_below || m.execute_mult || /execute|finish|reckoning|judgment|doom/i.test(txt)) return "cast-crescendo";
  if (/thunder|lightning|volt|shock|bolt|static|storm cloud/i.test(txt)) return "cast-thunder";
  if (/slam|smash|hammer|meteor|impact|pound/i.test(txt)) return "cast-slam";
  if (m.extra_hits || m.slot_roll || /multi|flurry|barrage|rapid/i.test(sig.desc || "")) return "cast-flurry";
  if (stat === "speed" || /blitz|blink|flash|dash|swift|instant|teleport/i.test(sig.name || "")) return "cast-blink";
  if (m.ignore_evasion || /pierc|snipe|seek|homing|lock|aim|arrow|bullet|shot|dead-?eye/i.test(txt)) return "cast-pierce";
  if (/slash|blade|sword|cut|slice|katana|edge/i.test(txt)) return "cast-slash";
  if (stat === "def" || /quake|earth|crush|ground|stone|seismic/i.test(txt)) return "cast-quake";
  if (m.hidden_power_mult || power >= 4.6) return "cast-heavy";
  if ((sig.type === "buff" && Array.isArray(m.self_effects)) || /guard|shield|brace|ward|bulwark|aegis/i.test(txt)) return "cast-guard";
  if (sig.type === "heal" || sig.type === "buff" || (Array.isArray(m.team_effects) && power < 2)) return "cast-focus";
  if (magic && sig.target === "all_enemies") return "cast-channel";
  if (magic) return "cast-arcane";
  return "cast-charge";
};
// Single source of truth for "how long does this cast read as playing" --
// shared by BattleUnit (how long the CSS class stays applied) and every
// battle view's hit-stop lock (how long the WHOLE simulation holds so nothing
// else can act mid-animation). Deliberately much longer than a snappy game
// feel would use -- these are meant to read as cinematic beats, not blips.
// Keep keys in sync with deriveCastAnim()'s return values + style.css.
const CAST_ANIM_MS = {
  "cast-arcane": 1500, "cast-charge": 1450, "cast-flurry": 1450, "cast-focus": 1500,
  "cast-blink": 1450, "cast-heavy": 1650, "cast-channel": 1650, "cast-override": 1900,
  "cast-slash": 1300, "cast-quake": 1500, "cast-pierce": 1300, "cast-guard": 1450,
  "cast-rainbow": 1700, "cast-slam": 1600, "cast-orbit": 1650, "cast-vanish": 1500,
  "cast-crescendo": 1800, "cast-thunder": 1550
};
// Cast animations that read as "sent something at the target" rather than a
// melee lunge or a self/team buff -- these get an actual flying projectile
// (see ProjectileLayer) instead of just the caster's own wind-up motion.
const RANGED_CAST_ANIMS = /* @__PURE__ */ new Set(["cast-arcane", "cast-charge", "cast-channel", "cast-thunder", "cast-orbit", "cast-crescendo", "cast-override", "cast-flurry", "cast-pierce"]);
const DEFAULT_CAST_MS = 1500;
const LUNGE_MS = 500;
const LUNGE_CRIT_MS = 580;
// FIGHTING-GAME RUSHDOWN: a basic attack now dashes the attacker across the
// field to the target and throws a flurry, instead of a bob-in-place. Ground
// rush and air-combo variants run longer than the old lunge, so their own
// duration constants feed both the CSS animation length AND the battle views'
// hit-stop lock (same sync pattern as CAST_ANIM_MS).
const RUSH_MS = 780;
const RUSH_AIR_MS = 1020;
// How many flurry hits a basic attack throws, and whether it launches an air
// combo, derived from the ATTACKER's in-battle stats -- Speed is the driver
// (a fast character rushes down with more strikes and, past a threshold, juggles
// the target into the air), with Luck adding a small chance to sneak a bonus
// hit or a surprise launch. Returns { hits, air }.
const getMeleeCombo = (stats) => {
  const spd = stats?.speed || 0;
  const luck = stats?.luck || 0;
  let hits = 2 + Math.floor(spd / 55);
  if (Math.random() < Math.min(0.35, luck / 500)) hits += 1; // lucky extra strike
  hits = Math.max(2, Math.min(6, hits));
  const air = spd >= 150 || Math.random() < Math.min(0.22, luck / 650);
  return { hits, air };
};
// How long (ms) a cast animation plays -- null castAnim means "no bespoke
// cast," i.e. a plain basic-attack lunge, which the caller should treat with
// getLungeMs() instead.
const getCastAnimMs = (castAnim) => castAnim ? CAST_ANIM_MS[castAnim] || DEFAULT_CAST_MS : null;
const getLungeMs = (isCrit) => isCrit ? LUNGE_CRIT_MS : LUNGE_MS;
// How long a basic-attack rushdown plays (air combos run longer). Used by both
// BattleUnit (animation length) and every view's basic-attack hit-stop lock.
const getBasicAttackMs = (air) => air ? RUSH_AIR_MS : RUSH_MS;
// Small safety margin added ONLY to the game-logic hit-stop lock (never to the
// CSS/JS visual timeout) so the lock always outlasts the animation even with
// React's render/effect scheduling lag -- otherwise a startled unit's cast can
// visually start a beat before the previous one has fully cleared.
const HITSTOP_BUFFER_MS = 150;
// Turn a raw effect into a short on-badge label + a full tooltip string so the
// player can read the board at a glance instead of decoding tiny icons. `short`
// is the value shown on the pip (kept to a few chars); `full` is the title text.
const STAT_LABELS = { buff_atk: "ATK", debuff_atk: "ATK", buff_def: "DEF", debuff_def: "DEF", buff_spd: "SPD", debuff_spd: "SPD", buff_crit: "CRIT", buff_elemdmg: "ELEM" };
const describeEffect = (e) => {
  const t = e.type || "";
  const pct = typeof e.val === "number" && Math.abs(e.val) < 5 ? Math.round(e.val * 100) : null;
  const sign = t.startsWith("debuff") ? "-" : "+";
  if (STAT_LABELS[t]) {
    const s = `${STAT_LABELS[t]}${sign}${pct != null ? Math.abs(pct) + "%" : ""}`;
    return { short: s, full: `${e.label ? e.label + ": " : ""}${s} (${e.duration}t)` };
  }
  const simple = {
    shield: { short: "SHLD", full: "Shield" }, regen: { short: "RGN", full: "Regen" },
    burn: { short: "BRN", full: "Burn (damage over time)" }, poison: { short: "PSN", full: "Poison (damage over time)" },
    static: { short: "STC", full: "Static" }, stun: { short: "STUN", full: "Stunned — loses its turn" },
    freeze: { short: "FRZ", full: "Frozen" }, silence: { short: "SIL", full: "Silenced — cannot use skills" },
    sleep: { short: "ZZZ", full: "Asleep — skips turns until hit hard enough to wake" },
    crushed: { short: "CRSH", full: "Crushed — takes extra damage" }, broken: { short: "BRK", full: "Broken — amplified damage" },
    phantom_veil: { short: "VEIL", full: "Extremely evasive" }, untargetable: { short: "HIDE", full: "Untargetable" },
    aggro: { short: "TAUNT", full: "Taunting" }, hidden_power: { short: "", full: "Building power" },
    tactical_stance: { short: "STANCE", full: "Tactical stance" }, elemental_insight: { short: "INSGT", full: "Elemental insight" },
    tethered: { short: "TETHR", full: "Tethered" },
    overheat: { short: "HEAT↑", full: "Overheat — physical power rising each turn" },
    precision: { short: "AIM↑", full: "Precision — crit chance rising each turn" },
    fortify: { short: "GUARD↑", full: "Fortify — defenses rising each turn" },
    charm: { short: "CHARM↑", full: "Charm — luck & crit rising each turn" },
    overclock: { short: "OC↑", full: "Overclock — magic power rising each turn" }
  };
  if (simple[t]) return { short: simple[t].short, full: `${e.label ? e.label + ": " : ""}${simple[t].full} (${e.duration}t)` };
  const generic = (e.label || t.replace(/_/g, " ")).slice(0, 6).toUpperCase();
  return { short: generic, full: `${e.label || t} (${e.duration}t)` };
};
// Shared status-effect tick: DOT (burn/poison/static), regen, stun/freeze/sleep
// incapacitation, ramp escalation, duration decrement. Mutates `unit` in place
// and returns whether it's incapacitated this tick plus any floating popups to
// render, so every battle mode processes statuses identically.
const applyStatusTick = (unit) => {
  const popups = [];
  let incapacitated = false;
  unit.effects = (unit.effects || []).filter((e) => {
    if (e.type === "burn" || e.type === "poison" || e.type === "static") {
      const dotDmg = Math.floor((unit.maxHp || 0) * (e.val || 0.05));
      unit.hp = Math.max(0, unit.hp - dotDmg);
      popups.push({ id: Math.random(), targetId: unit.id, amount: dotDmg, type: "miss" });
      if (unit.hp === 0) unit.dead = true;
    }
    if (e.type === "regen") {
      const healAmt = Math.floor((unit.maxHp || 0) * (e.val || 0.05));
      unit.hp = Math.min(unit.maxHp, unit.hp + healAmt);
      popups.push({ id: Math.random(), targetId: unit.id, amount: healAmt, type: "heal" });
    }
    if (e.type === "stun" || e.type === "freeze" || e.type === "sleep") incapacitated = true;
    if (typeof e.ramp === "number") e.val = (e.val || 0) + e.ramp;
    e.duration -= 1;
    return e.duration > 0;
  });
  return { incapacitated, popups };
};
// Shields are secondary HP, not a perpetual damage-reduction multiplier.
// Every shield-creation site (skills.json statusEffects, signature meta,
// on-kill grants, tactical-stance procs, guard buttons...) only ever writes
// `val` (originally authored/scaled as "fraction of max HP shielded" -- see
// skill descriptions like "shield scales with DEF"). Lazily convert that into
// a real, depleting HP pool the FIRST time the shield actually takes a hit,
// so every creation site is covered without having to touch each one. Once a
// pool exists it persists (re-shielding replaces the whole effect object, so
// there's no stale-pool risk).
const getShieldPool = (target, shield) => {
  if (typeof shield.maxHp !== "number" || !shield.maxHp) {
    const frac = Math.min(3, Math.max(0, shield.val || 0));
    shield.maxHp = Math.max(1, Math.floor((target.maxHp || 0) * frac));
    shield.remainingHp = shield.maxHp;
  }
  return shield;
};
// Apply one hit of damage to a target's shield (if any), depleting its HP
// pool and popping it once empty. Returns the damage that gets through.
const absorbWithShield = (target, dmg) => {
  const idx = (target.effects || []).findIndex((e) => e.type === "shield");
  if (idx === -1) return dmg;
  const shield = getShieldPool(target, target.effects[idx]);
  if (dmg >= shield.remainingHp) {
    const leftover = dmg - shield.remainingHp;
    target.effects.splice(idx, 1);
    target._shieldHit = true;
    return leftover;
  }
  shield.remainingHp -= dmg;
  target._shieldHit = true;
  return 0;
};
// Shared "basic attack" resolver — taken whenever a unit's gauge fills but no
// skill is ready. Unifies target selection (taunt/expose/marked/untargetable),
// evasion, gear elemental passives, broken amplification, shield mitigation and
// defense mitigation so basic attacks behave identically in every battle mode.
// `comboMult`/`markedTargetId` are optional Campaign-only extras (default to
// inert values so Trials/Events get the same core resolution).
const resolveBasicAttack = ({ attacker, allUnits, playerElement, comboMult = () => 1, markedTargetId = null }) => {
  const targets = allUnits.filter((t) => t.isEnemy !== attacker.isEnemy && !t.dead && !(t.effects || []).some((e) => e.type === "untargetable"));
  if (!targets.length) return null;
  const taunted = targets.find((t) => (t.effects || []).some((e) => e.type === "aggro"));
  const exposed = !attacker.isEnemy ? targets.find((t) => (t.effects || []).some((e) => e.type === "expose")) : null;
  const marked = !attacker.isEnemy && markedTargetId ? targets.find((t) => t.id === markedTargetId) : null;
  const target = taunted || exposed || marked || targets[Math.floor(Math.random() * targets.length)];
  const attackerStats = getBattleStats(attacker, playerElement, attacker.activeSynergies || []);
  const targetStats = getBattleStats(target, playerElement, target.activeSynergies || []);
  const phantomVeil = (target.effects || []).find((e) => e.type === "phantom_veil");
  const effectiveEvasion = phantomVeil ? phantomVeil.val : targetStats.evasion;
  const attackerTruesight = (attacker.effects || []).some((e) => e.type === "truesight");
  if (!attackerTruesight && Math.random() < effectiveEvasion) {
    attacker.lastAction = { targetId: target.id, amount: "MISS", type: "miss", time: Date.now() };
    return { targetId: target.id, amount: "MISS", missed: true };
  }
  let dmg = Math.floor(attackerStats.atk * (1 + attackerStats.speed / 2e3));
  if (!attacker.isEnemy) dmg = Math.floor(dmg * comboMult());
  const attackerElemBoost = getGearPassives(attacker).filter((p) => p.type === "elem_boost" && p.element === attacker.element).reduce((s, p) => s + p.val, 0);
  if (attackerElemBoost) dmg = Math.floor(dmg * (1 + attackerElemBoost));
  const targetElemResist = getGearPassives(target).filter((p) => p.type === "elem_resist" && p.element === attacker.element).reduce((s, p) => s + p.val, 0);
  if (targetElemResist) dmg = Math.floor(dmg * (1 - Math.min(0.8, targetElemResist)));
  const brokenEff = (target.effects || []).find((e) => e.type === "broken");
  if (brokenEff) dmg = Math.floor(dmg * (1 + (brokenEff.val || 0.5)));
  dmg = applyMitigation(dmg, targetStats.def, 1e3);
  dmg = absorbWithShield(target, dmg);
  target.hp = Math.max(0, target.hp - dmg);
  if (target.hp === 0) {
    if (!target.isEnemy && target._leaderRevive) {
      target._leaderRevive = false;
      target.hp = 1;
    } else {
      target.dead = true;
    }
  }
  attacker.burst = Math.min(100, (attacker.burst || 0) + 10);
  // FIGHTING-GAME RUSHDOWN: the single damage number above is delivered as a
  // stat-driven flurry of `hits` strikes (with an optional air-combo launcher).
  // BattleUnit reads meleeHits/meleeAir off lastAction to dash + juggle; the
  // combo counter climbs by the whole flurry, and the target rattles per hit
  // (target._comboHits, read by the target's own BattleUnit on the HP drop).
  const melee = getMeleeCombo(attackerStats);
  const now = Date.now();
  target._comboHits = melee.hits;
  target._comboHitsTime = now; // fresh stamp so the target only rattles on THIS flurry, not a later DOT/skill drop
  attacker.lastAction = { targetId: target.id, amount: dmg, type: "basic", meleeHits: melee.hits, meleeAir: melee.air, time: now };
  return { targetId: target.id, amount: dmg, missed: false, meleeHits: melee.hits, meleeAir: melee.air };
};
const executeCombatSkill = ({ combatants, attackerId, skills, playerElement, isLimitBreak = false, forcedTargetId = null, extraPowerMult = 1 }) => {
  const next = combatants.map((u) => {
    const cloned = { ...u };
    cloned.effects = Array.isArray(u.effects) ? u.effects.map((e) => ({ ...e })) : [];
    return cloned;
  });
  const attacker = next.find((u) => u.id === attackerId);
  if (!attacker || attacker.dead) return next;
  // Temporal snapshot: every cast, every unit's current HP is logged to a small
  // rolling history. This gives time-travel mechanics (rewind_hp) a REAL past
  // value to restore rather than a fabricated heal number.
  next.forEach((u) => {
    if (!Array.isArray(u._hpHistory)) u._hpHistory = [];
    u._hpHistory.push(u.hp);
    if (u._hpHistory.length > 8) u._hpHistory.shift();
  });
  // Silence: a controlled unit loses its turn entirely (Limit Breaks push through).
  if (!isLimitBreak && (attacker.effects || []).some((e) => e.type === "silence")) {
    attacker.lastAction = { type: "silenced", amount: "SILENCED", msg: "SILENCED", time: Date.now(), skillUser: attacker.id };
    return next;
  }
  attacker.maxSkillCd = Number(attacker.maxSkillCd || attacker.maxSkillCd || 100);
  attacker.skillCd = Number(attacker.skillCd || attacker.skillCd || 0);
  if (attacker.skillId2) {
    attacker.maxSkillCd2 = Number(attacker.maxSkillCd2 || attacker.maxSkillCd || 100);
    attacker.skillCd2 = Number(attacker.skillCd2 || attacker.skillCd2 || 0);
  } else {
    attacker.maxSkillCd2 = attacker.maxSkillCd2 || 0;
    attacker.skillCd2 = attacker.skillCd2 || 0;
  }
  const s1Ready = attacker.skillCd >= (attacker.maxSkillCd || 9999);
  const s2Ready = attacker.skillId2 && attacker.skillCd2 >= (attacker.maxSkillCd2 || 9999);
  const skillsToUse = [];
  if (isLimitBreak) {
    if (attacker.skillId) skillsToUse.push(attacker.skillId);
    if (s2Ready && attacker.skillId2) skillsToUse.push(attacker.skillId2);
  } else {
    if (s1Ready && attacker.skillId) skillsToUse.push(attacker.skillId);
    if (s1Ready && attacker.skillId2 && !skillsToUse.includes(attacker.skillId2)) {
      skillsToUse.push(attacker.skillId2);
    } else if (s2Ready && attacker.skillId2) {
      if (!skillsToUse.includes(attacker.skillId2)) skillsToUse.push(attacker.skillId2);
    }
    if (skillsToUse.length === 0) return next;
  }
  try {
    if (isLimitBreak) attacker.burst = 0;
    skillsToUse.forEach((sid) => {
      if (!isLimitBreak) {
        if (sid === attacker.skillId) attacker.skillCd = 0;
        else if (sid === attacker.skillId2) attacker.skillCd2 = 0;
      }
    });
    attacker.lastSkillTime = Date.now();
    // Which skills actually fired this cast — banners/cut-ins read this instead of
    // guessing from skillId (which hid every slot-2/signature cast from the player).
    attacker.lastSkillIds = [...skillsToUse];
    // Cast animation: EVERY skill cast gets a bespoke wind-up/spell-cast motion
    // now (not just signatures) -- BattleUnit reads this to play the cinematic
    // cast instead of the shared plain lunge. Signature fires (if any) win the
    // pick since they're the more dramatic move when a unit fires two skills.
    const firedSkillObjs = skillsToUse.map((sid) => (skills || []).find((s) => s.id === sid)).filter(Boolean);
    const firedSig = firedSkillObjs.find((s) => s.signature) || firedSkillObjs[0];
    attacker.lastCastAnim = firedSig ? deriveCastAnim(firedSig) : null;
  } catch (e) {
    attacker.lastCastAnim = null;
  }
  const stanceEff = (attacker.effects || []).find((e) => e.type === "tactical_stance");
  if (stanceEff && typeof stanceEff.val === "number" && stanceEff.val > 0) {
    attacker._tacticalBonus = {
      powerMult: 1 + stanceEff.val,
      teamBurst: Math.min(30, Math.round(10 * stanceEff.val)),
      armorPenPct: Math.min(0.45, stanceEff.val * 0.25),
      shieldChance: Math.min(0.5, 0.15 + stanceEff.val * 0.35)
    };
  } else attacker._tacticalBonus = null;
  const pickTargets = (skill, isLB) => {
    const enemies = next.filter((t) => t.isEnemy !== attacker.isEnemy && !t.dead && !t.effects.some((e) => e.type === "untargetable"));
    const allies = next.filter((t) => t.isEnemy === attacker.isEnemy && !t.dead);
    if (skill.target === "all_enemies") return enemies;
    if (skill.target === "all_allies") return allies;
    if (skill.target === "self") return [attacker];
    if (skill.target === "lowest_ally" || skill.type === "heal") {
      return [allies.sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0]];
    }
    if (skill.target === "random_enemies") {
      const count = isLB ? 5 : 3;
      const picks = [];
      for (let i = 0; i < count; i++) picks.push(enemies[Math.floor(Math.random() * enemies.length)]);
      return picks.filter(Boolean);
    }
    const shouldHonorTaunt = skill.type === "atk" || skill.target === "random_enemies" || skill.target === "all_enemies" || skill.damageType && skill.type === "atk";
    if (shouldHonorTaunt) {
      const taunted = enemies.find((e) => e.effects.some((eff) => eff.type === "aggro"));
      if (taunted) return [taunted];
    }
    if (!attacker.isEnemy) {
      const exposed = enemies.find((e) => e.effects.some((eff) => eff.type === "expose"));
      if (exposed) return [exposed];
    }
    if (!attacker.isEnemy && forcedTargetId) {
      const marked = enemies.find((e) => e.id === forcedTargetId);
      if (marked) return [marked];
    }
    if (!attacker.isEnemy) {
      const lowHealthEnemies = enemies.filter((e) => e.hp / e.maxHp < 0.25).sort((a, b) => a.hp - b.hp);
      if (lowHealthEnemies.length > 0 && Math.random() < 0.6) {
        return [lowHealthEnemies[0]];
      }
      const weakEnemies = enemies.filter((e) => ELEMENTS[attacker.element]?.strongTo === e.element);
      if (weakEnemies.length > 0 && Math.random() < 0.5) {
        return [weakEnemies[Math.floor(Math.random() * weakEnemies.length)]];
      }
    }
    if (attacker.isEnemy) {
      const lowHealthAllies = enemies.filter((e) => e.hp / e.maxHp < 0.4).sort((a, b) => a.hp - b.hp);
      if (lowHealthAllies.length > 0 && Math.random() < 0.7) {
        return [lowHealthAllies[0]];
      }
      const supportUnits = enemies.filter((e) => {
        const charObj = combatants.find((c) => c.id === e.id);
        return charObj && (charObj.skillId === "heal_light" || charObj.skillId === "heal_team");
      });
      if (supportUnits.length > 0 && Math.random() < 0.5) {
        return [supportUnits[Math.floor(Math.random() * supportUnits.length)]];
      }
      const weakTargets = enemies.filter((e) => ELEMENTS[attacker.element]?.strongTo === e.element);
      if (weakTargets.length > 0 && Math.random() < 0.6) {
        return [weakTargets[Math.floor(Math.random() * weakTargets.length)]];
      }
    }
    return [enemies[Math.floor(Math.random() * enemies.length)]].filter(Boolean);
  };
  for (let sidIdx = 0; sidIdx < skillsToUse.length; sidIdx++) {
    const sid = skillsToUse[sidIdx];
    const skill = skills.find((s) => s.id === sid) || { id: "slash", type: "atk", power: 1 };
    const abilityLevel = (sid === attacker.skillId ? attacker.abilityLevel : attacker.abilityLevel2) || 1;
    const awaken = (sid === attacker.skillId ? attacker.abilityAwaken : attacker.abilityAwaken2) || 0;
    // `let` so a dynamic_special archetype can re-shape the target set below
    // (e.g. the AGI "blur" form fans the shot out to every enemy).
    let targets = pickTargets(skill, isLimitBreak);
    const attackerStats = getBattleStats(attacker, playerElement, attacker.activeSynergies || []);
    const META = skill.meta || {};
    const sigEffectMult = skill.signature ? SIGNATURE_BONUS.EFFECT_VAL : 1;
    const scaleVal = (v) => typeof v === "number" ? v * (1 + (abilityLevel - 1) * 0.1) * sigEffectMult : v;
    // --- Hidden Power: a silent stacking mechanic. Casting a skill flagged
    // `builds_hidden_power` quietly adds stacks to the caster (no visible threat
    // shown to the opponent beyond a generic status pip). Once stacks reach
    // `hidden_power_threshold`, that same cast becomes a guaranteed, unblockable,
    // defense-ignoring true-form strike, then the stacks reset to zero.
    if (META.builds_hidden_power) {
      let hpEff = attacker.effects.find((e) => e.type === "hidden_power");
      if (!hpEff) {
        hpEff = { type: "hidden_power", duration: 9999, val: 0, label: "INSTINCT" };
        attacker.effects.push(hpEff);
      }
      hpEff.val += META.builds_hidden_power;
    }
    const hiddenPowerEff = attacker.effects.find((e) => e.type === "hidden_power");
    const hiddenPowerReady = !!(META.hidden_power_threshold && hiddenPowerEff && hiddenPowerEff.val >= META.hidden_power_threshold);
    // Damage/hit modifiers used by both the per-cast payload below and the dynamic
    // archetype resolver further down. Declared here so the earlier payload can
    // read/adjust them (e.g. luck-gamble, resonance).
    let dynDmgMult = 1;
    attacker._dynArchetypeDamageType = null;
    attacker._dynArchetypeIgnoreEvasion = false;
    attacker._dynBonus = null;
    attacker._resonanceElement = null;
    // MULTI-HIT: how many times this cast strikes each target. Driven by META.hits,
    // or dynamically by a SPECIAL stat when META.hits_per_special is set (Courier:
    // every point of Agility = one more hit). Reusable by any signature.
    let numHits = Math.max(1, META.hits || 1);
    if (META.hits_per_special && attacker.special) {
      const baseSp = (META.dynamic_special && META.dynamic_special.baseline) || 1;
      numHits = Math.max(1, 1 + ((attacker.special[META.hits_per_special] || baseSp) - baseSp));
    }
    // --- Per-cast effects: applied once when the skill is used (support / self-combo skills) ---
    const livingAllies = next.filter((u) => u.isEnemy === attacker.isEnemy && !u.dead);
    if (Array.isArray(META.self_effects)) META.self_effects.forEach((e) => attacker.effects.push({ ...e, val: scaleVal(e.val) }));
    if (Array.isArray(META.team_effects)) livingAllies.forEach((a) => META.team_effects.forEach((e) => a.effects.push({ ...e, val: scaleVal(e.val) })));
    if (META.cleanse_team) livingAllies.forEach((a) => { a.effects = a.effects.filter((e) => e.type.startsWith("buff") || e.type === "shield" || e.type === "regen" || e.type === "tactical_stance"); });
    if (META.gain_burst) livingAllies.forEach((a) => { a.burst = Math.min(100, (a.burst || 0) + META.gain_burst); });
    if (META.dispel_enemies) {
      next.filter((u) => u.isEnemy !== attacker.isEnemy && !u.dead).forEach((e) => { e.effects = e.effects.filter((x) => !x.type.startsWith("buff") && x.type !== "shield"); });
    }
    // CARE METER (Tenderheart): grants the team a one-time death-save this battle
    // plus an escalating group buff that grows each turn (see `ramp` in the view
    // ticks). Reusable by any "protector" signature.
    if (META.care_revive) {
      livingAllies.forEach((a) => {
        a._leaderRevive = true;
        a.effects.push({ type: "buff_def", duration: 5, val: 0.15, ramp: 0.05, label: "CARING HEART" });
      });
    }
    // LUCK GAMBLE (Good Luck Bear): roll one of several outcomes, odds tilted by the
    // caster's Luck. Reusable RNG payload for any "gambler" signature.
    if (META.luck_gamble) {
      const luck = Math.min(0.6, (attackerStats.luck || 10) / 300);
      const roll = Math.random();
      if (roll < 0.18 + luck) {
        attacker.effects.push({ type: "buff_crit", duration: 3, val: 0.5, label: "JACKPOT" });
        dynDmgMult *= 2.2; attacker.lastAction = { ...attacker.lastAction, msg: "★JACKPOT★" };
      } else if (roll < 0.45 + luck) {
        livingAllies.forEach((a) => { a.hp = Math.min(a.maxHp, a.hp + Math.floor(a.maxHp * 0.18)); });
        attacker.lastAction = { ...attacker.lastAction, msg: "LUCKY HEAL" };
      } else if (roll < 0.7) {
        next.filter((u) => u.isEnemy !== attacker.isEnemy && !u.dead).forEach((e) => e.effects.push({ type: "debuff_def", duration: 3, val: 0.3, label: "UNLUCKY" }));
        attacker.lastAction = { ...attacker.lastAction, msg: "BAD LUCK" };
      } else {
        dynDmgMult *= 1.4;
      }
    }
    // RESONANCE (Cheer Bear): her power grows with the Care Bears fighting beside
    // her, and she briefly borrows the strongest one's element ("merge"). Reads
    // allied bears from the battlefield; reusable via META.resonance_franchise.
    if (META.resonance_franchise) {
      const bears = livingAllies.filter((a) => a.id !== attacker.id && a.franchise === META.resonance_franchise);
      if (bears.length) {
        const strongest = bears.reduce((best, b) => ((b.level || 1) > (best.level || 1) ? b : best), bears[0]);
        const totalLv = bears.reduce((s, b) => s + (b.level || 1), 0);
        dynDmgMult *= 1 + Math.min(1.5, totalLv / 120);
        attacker._resonanceElement = strongest.element;
        attacker.effects.push({ type: "buff_elemdmg", duration: 3, val: Math.min(0.6, 0.1 + bears.length * 0.12), label: "RESONANCE" });
        attacker.lastAction = { ...attacker.lastAction, msg: `RESONANCE ×${bears.length}` };
      }
    }
    // THE WORLD — a genuine time-stop, not a flavor-only stun: every living
    // enemy is frozen (guaranteed, bypasses evasion entirely -- there's
    // nothing to dodge if time itself isn't moving) for META.world_time_stop
    // turns, while the caster gets a matching self-window buff to actually
    // use the stopped time. Deliberately limited for balance: a signature
    // opts in with a very long cooldown in its own JSON (not enforced here),
    // and this is the only signature type that touches _triggeredTimeStopAt
    // -- the battle view watches for that timestamp and briefly silences the
    // music for META.world_time_stop.musicStopMs, then restores it.
    if (META.world_time_stop) {
      const enemiesNow = next.filter((u) => u.isEnemy !== attacker.isEnemy && !u.dead);
      enemiesNow.forEach((e) => { e.effects.push({ type: "stun", duration: META.world_time_stop.duration || 2, val: 0, label: "TIME STOPPED" }); });
      attacker.effects.push({ type: "buff_atk", duration: META.world_time_stop.duration || 2, val: META.world_time_stop.selfAtkBuff || 0.6, label: "THE WORLD" });
      attacker.effects.push({ type: "buff_crit", duration: META.world_time_stop.duration || 2, val: 0.35, label: "THE WORLD" });
      attacker._triggeredTimeStopAt = Date.now();
      attacker._timeStopMusicMs = META.world_time_stop.musicStopMs || 5000;
      attacker.lastAction = { ...attacker.lastAction, msg: "THE WORLD! TOKI WO TOMARE!" };
    }
    // HANNAH — "X Marks the Spot": a real turn-economy steal, not a status effect.
    // Finds whoever is closest to acting next (highest current ATB gauge) and
    // drains it, genuinely delaying their turn.
    if (META.steal_next_enemy_turn) {
      const enemiesNow = next.filter((u) => u.isEnemy !== attacker.isEnemy && !u.dead);
      let victim = null, bestGauge = -1;
      enemiesNow.forEach((e) => {
        const g = e.gauge || 0;
        if (g > bestGauge) { bestGauge = g; victim = e; }
      });
      if (victim) {
        victim.gauge = Math.max(0, (victim.gauge || 0) - (META.steal_next_enemy_turn.drain || 40));
        victim.lastAction = { ...victim.lastAction, msg: "TURN STOLEN" };
      }
    }
    // DUO SKILL — a boss signature carrying META.duo_partner checks whether that
    // named ally is alive on the same side; if so this same cast escalates into a
    // team-up attack (META.duo_bonus can override target/animation/damage and add
    // effects), with zero new cooldown plumbing -- it rides the boss's own
    // existing signature cast. Reusable by any future signature, not boss-only.
    if (META.duo_partner) {
      const partnerAlive = next.some((u) => u.isEnemy === attacker.isEnemy && !u.dead && u.name === META.duo_partner);
      if (partnerAlive) {
        const duo = META.duo_bonus || {};
        if (duo.dmgMult) dynDmgMult *= duo.dmgMult;
        if (duo.target && duo.target !== skill.target) targets = pickTargets({ ...skill, target: duo.target }, isLimitBreak);
        if (duo.castAnim) attacker.lastCastAnim = duo.castAnim;
        if (Array.isArray(duo.self_effects)) duo.self_effects.forEach((e) => attacker.effects.push({ ...e, val: scaleVal(e.val) }));
        if (Array.isArray(duo.team_effects)) livingAllies.forEach((a) => duo.team_effects.forEach((e) => a.effects.push({ ...e, val: scaleVal(e.val) })));
        attacker.lastAction = { ...attacker.lastAction, msg: duo.msg || "★ DUO ATTACK ★" };
      }
    }
    // TIMMY TURNER — "I Wish For..." cycles through THREE completely different
    // wishes each cast (Cosmo's chaos / Wanda's wisdom / Fairy teamwork). The
    // stage persists on the caster (_wishStage) across casts, so the same button
    // does something new every time it fires -- a genuinely rotating mechanic.
    let wishDmgMult = 1;
    let wishMsg = null;
    if (META.wish_cycle) {
      attacker._wishStage = ((attacker._wishStage || 0) % 3) + 1;
      const enemiesNow = next.filter((u) => u.isEnemy !== attacker.isEnemy && !u.dead);
      if (attacker._wishStage === 1) {
        // WISH 1 — COSMO'S CHAOS: a random curse hits every foe + a big damage surge.
        wishDmgMult = 1.7;
        enemiesNow.forEach((e) => {
          const pool = ["burn", "freeze", "poison", "static", "debuff_spd", "debuff_atk"];
          e.effects.push({ type: pool[Math.floor(Math.random() * pool.length)], duration: 3, val: 0.2, label: "COSMIC CHAOS" });
        });
        wishMsg = "COSMO'S CHAOS!";
      } else if (attacker._wishStage === 2) {
        // WISH 2 — WANDA'S WISDOM: dispel all enemy buffs, expose them (-40% DEF), team Crit.
        enemiesNow.forEach((e) => {
          e.effects = e.effects.filter((x) => !x.type.startsWith("buff") && x.type !== "shield");
          e.effects.push({ type: "debuff_def", duration: 3, val: 0.4, label: "WISHED WEAK" });
        });
        livingAllies.forEach((a) => a.effects.push({ type: "buff_crit", duration: 4, val: 0.25, label: "WANDA'S WISDOM" }));
        wishMsg = "WANDA'S WISDOM!";
      } else {
        // WISH 3 — FAIRY TEAMWORK: squad elemental empower + shield + heal + Burst.
        livingAllies.forEach((a) => {
          a.effects.push({ type: "buff_elemdmg", duration: 4, val: 0.4, label: "FAIRY MAGIC" });
          a.effects.push({ type: "shield", duration: 3, val: 0.28, label: "GODPARENT GUARD" });
          a.hp = Math.min(a.maxHp, a.hp + Math.floor(a.maxHp * 0.15));
          a.burst = Math.min(100, (a.burst || 0) + 20);
        });
        wishMsg = "FAIRY MAGIC!";
      }
      attacker.lastAction = { ...attacker.lastAction, msg: wishMsg };
    }
    // CAIT SITH — "Slots: Triple Seven" rolls 3 independent slot reels every
    // cast with genuine Math.random() odds (this is the one signature in the
    // game allowed to gamble). BUST (no match, ~48%) still lands the full
    // listed hit plus a consolation shield; PAIR (~48%) hits harder and
    // empowers the squad; JACKPOT (all 3 match, ~4%) is a massive team-wide
    // power spike that also deletes anything already low on HP.
    let slotDmgMult = 1;
    let slotJackpot = false;
    if (META.slot_roll) {
      const reels = ["MOG", "GIL", "CHOCO", "STAR", "SKULL"];
      const roll = () => reels[Math.floor(Math.random() * reels.length)];
      const pull = [roll(), roll(), roll()];
      const uniqueCount = new Set(pull).size;
      if (uniqueCount === 1) {
        slotDmgMult = 3.5;
        slotJackpot = true;
        livingAllies.forEach((a) => {
          a.effects.push({ type: "buff_elemdmg", duration: 4, val: 0.5, label: "JACKPOT!" });
          a.effects.push({ type: "buff_crit", duration: 4, val: 0.25, label: "HOT STREAK" });
          a.burst = Math.min(100, (a.burst || 0) + 30);
        });
        attacker.lastAction = { ...attacker.lastAction, msg: "★JACKPOT★ " + pull.join(" ") };
      } else if (uniqueCount === 2) {
        slotDmgMult = 1.8;
        livingAllies.forEach((a) => a.effects.push({ type: "buff_atk", duration: 3, val: 0.3, label: "LUCKY PAIR" }));
        attacker.lastAction = { ...attacker.lastAction, msg: "PAIR! " + pull.join(" ") };
      } else {
        attacker.effects.push({ type: "shield", duration: 2, val: 0.15, label: "BETTER LUCK NEXT TIME" });
        attacker.lastAction = { ...attacker.lastAction, msg: "BUST... " + pull.join(" ") };
      }
    }
    // STAGE CYCLE — generic deterministic rotation (no RNG). Persists a stage
    // counter on the caster (_stageCycle) so the signature cycles through a
    // fixed sequence of distinct effects, one new stage per cast, looping back
    // to the top once it reaches the end. Every character using this shares
    // the engine; their flavor comes entirely from the stage data in
    // signature_skills.json (self/team/enemy effects, heals, bursts, a damage
    // multiplier for this cast, and a log message).
    let stageDmgMult = 1;
    if (Array.isArray(META.stage_cycle) && META.stage_cycle.length > 0) {
      const stages = META.stage_cycle;
      attacker._stageCycle = ((attacker._stageCycle || 0) % stages.length) + 1;
      const stage = stages[attacker._stageCycle - 1] || {};
      const enemiesNow = next.filter((u) => u.isEnemy !== attacker.isEnemy && !u.dead);
      if (Array.isArray(stage.self_effects)) stage.self_effects.forEach((e) => attacker.effects.push({ ...e, val: scaleVal(e.val) }));
      if (Array.isArray(stage.team_effects)) livingAllies.forEach((a) => stage.team_effects.forEach((e) => a.effects.push({ ...e, val: scaleVal(e.val) })));
      if (Array.isArray(stage.enemy_effects)) enemiesNow.forEach((e) => stage.enemy_effects.forEach((eff) => e.effects.push({ ...eff, val: scaleVal(eff.val) })));
      if (stage.cleanse_enemies) enemiesNow.forEach((e) => { e.effects = e.effects.filter((x) => !x.type.startsWith("buff") && x.type !== "shield"); });
      if (stage.heal_pct) livingAllies.forEach((a) => { a.hp = Math.min(a.maxHp, a.hp + Math.floor(a.maxHp * stage.heal_pct)); });
      if (stage.burst) livingAllies.forEach((a) => { a.burst = Math.min(100, (a.burst || 0) + stage.burst); });
      if (stage.dmgMult) stageDmgMult = stage.dmgMult;
      attacker.lastAction = { ...attacker.lastAction, msg: stage.msg || ("STAGE " + attacker._stageCycle) };
      // REWIND HP — a genuine time-rewind, not a flat heal: restores the target
      // to their ACTUAL logged HP from `turns_ago` casts back (see the
      // _hpHistory snapshot above), only if that past value beats their current
      // HP. "most_wounded_ally" reaches for whoever's worst off; "self" only
      // ever rewinds the caster.
      if (stage.rewind_hp) {
        const lookback = stage.rewind_hp.turns_ago || 3;
        let rewindTarget = null;
        if (stage.rewind_hp.scope === "self") {
          rewindTarget = attacker;
        } else {
          let bestRatio = 1;
          livingAllies.forEach((a) => {
            const ratio = a.hp / a.maxHp;
            if (ratio < bestRatio) { bestRatio = ratio; rewindTarget = a; }
          });
        }
        if (rewindTarget) {
          const hist = rewindTarget._hpHistory || [];
          const idx = Math.max(0, hist.length - 1 - lookback);
          const pastHp = hist[idx];
          if (typeof pastHp === "number" && pastHp > rewindTarget.hp) {
            rewindTarget.hp = Math.min(rewindTarget.maxHp, pastHp);
            rewindTarget.lastAction = { ...rewindTarget.lastAction, msg: "REWOUND" };
          }
        }
      }
    }
    // DYNAMIC SPECIAL — the skill itself is defined by whichever SPECIAL stat
    // (see utils.js SPECIAL_STATS) the unit has invested in most. No investment
    // yet (every stat still at baseline) means a plain, unmodified basic attack;
    // once a stat pulls ahead of the rest the skill reshapes around that
    // archetype -- e.g. INT overcharges into a mage-style burn/magic-power kit,
    // AGI turns into a speed/slow scout kit. Ties break by a fixed priority so
    // the same build always produces the same kit (no randomness).
    if (META.dynamic_special && attacker.special) {
      const entries = Object.entries(attacker.special);
      const baseline = META.dynamic_special.baseline || 1;
      const maxVal = Math.max(baseline, ...entries.map(([, v]) => v || baseline));
      // ULTIMATE: every SPECIAL stat maxed out (a genuine min-max-everything
      // build, SPECIAL_CAP points in all 7) unlocks a reserved "ultimate"
      // archetype -- checked before anything else so it always wins.
      const isMaxedAll = SPECIAL_STATS.every((k) => (attacker.special[k] || baseline) >= SPECIAL_CAP);
      // CURATED COMBOS: e.g. high STR + mid AGI = a DPS/speed hybrid. Defined in
      // JSON as META.dynamic_special.combos: [{ keys: ["str","agi"], threshold: 6, archetype: "str_agi" }, ...].
      // First combo where every listed stat clears its threshold wins, checked
      // in the order authored (most specific first).
      let comboArchetypeKey = null;
      if (!isMaxedAll && Array.isArray(META.dynamic_special.combos)) {
        const combo = META.dynamic_special.combos.find((c) => (c.keys || []).every((k) => (attacker.special[k] || baseline) >= (c.threshold || baseline + 1)));
        if (combo) comboArchetypeKey = combo.archetype;
      }
      if (isMaxedAll || comboArchetypeKey || maxVal > baseline) {
        const priority = ["int", "agi", "str", "per", "end", "cha", "lck"];
        const topKeys = entries.filter(([, v]) => (v || baseline) === maxVal).map(([k]) => k);
        const dominant = isMaxedAll ? "ultimate" : comboArchetypeKey || priority.find((k) => topKeys.includes(k)) || topKeys[0];
        const archetype = META.dynamic_special.archetypes?.[dominant];
        if (archetype) {
          const enemiesNow = next.filter((u) => u.isEnemy !== attacker.isEnemy && !u.dead);
          if (Array.isArray(archetype.self_effects)) archetype.self_effects.forEach((e) => attacker.effects.push({ ...e, val: scaleVal(e.val) }));
          if (Array.isArray(archetype.team_effects)) livingAllies.forEach((a) => archetype.team_effects.forEach((e) => a.effects.push({ ...e, val: scaleVal(e.val) })));
          if (Array.isArray(archetype.enemy_effects)) enemiesNow.forEach((e) => archetype.enemy_effects.forEach((eff) => e.effects.push({ ...eff, val: scaleVal(eff.val) })));
          if (archetype.heal_pct) livingAllies.forEach((a) => { a.hp = Math.min(a.maxHp, a.hp + Math.floor(a.maxHp * archetype.heal_pct)); });
          if (archetype.burst) livingAllies.forEach((a) => { a.burst = Math.min(100, (a.burst || 0) + archetype.burst); });
          if (archetype.dmgMult) dynDmgMult = archetype.dmgMult;
          if (archetype.damageType) attacker._dynArchetypeDamageType = archetype.damageType;
          if (archetype.ignore_evasion) attacker._dynArchetypeIgnoreEvasion = true;
          // The move ACTUALLY reshapes per build, not just its damage number:
          // an archetype can re-target the cast (a blur that hits everyone, a
          // rally that also mends the team), swap its wind-up animation so each
          // form reads differently on screen, and carry an on-hit rider.
          attacker._dynBonus = archetype.bonus || null;
          if (archetype.castAnim) attacker.lastCastAnim = archetype.castAnim;
          if (archetype.target && archetype.target !== skill.target) {
            targets = pickTargets({ ...skill, target: archetype.target }, isLimitBreak);
          }
          attacker.lastAction = { ...attacker.lastAction, msg: archetype.msg || dominant.toUpperCase() };
        }
      } else {
        attacker.lastAction = { ...attacker.lastAction, msg: META.dynamic_special.baseMsg || undefined };
      }
    }
    // Flying projectile: only for ranged-reading casts aimed at the enemy
    // side (heals/buffs on your own team don't fly across the field). One
    // entry per skill cast, tagged with this cast's timestamp so the visual
    // layer (ProjectileLayer) can tell fresh casts apart from stale ones.
    if (RANGED_CAST_ANIMS.has(attacker.lastCastAnim) && skill.type !== "heal" && skill.type !== "buff") {
      const projTargets = targets.filter((t) => t && t.isEnemy !== attacker.isEnemy).map((t) => t.id);
      if (projTargets.length) {
        attacker.lastProjectile = { targetIds: projTargets, kind: attacker.lastCastAnim, color: ELEMENTS[attacker.element]?.color || "#fff", time: Date.now() };
      }
    }
    targets.forEach((t) => {
      if (!t || t.dead) return;
      if (skill.statusEffects) {
        skill.statusEffects.forEach((eff) => {
          if (eff.condition) {
            if (eff.condition.hasStatus && !t.effects.some((e) => e.type === eff.condition.hasStatus)) return;
            if (typeof eff.condition.hpBelow === "number" && !(t.hp / t.maxHp <= eff.condition.hpBelow)) return;
          }
          // GEAR PASSIVE -- status_resist gear cuts the landing chance of a matching
          // hostile status (e.g. a "stun"-resist trinket vs an incoming stun). Only
          // ever matches hostile status types (burn/poison/freeze/stun/static), so
          // it never touches ally-targeted buffs/heals sharing this same loop.
          const statusResist = getGearPassives(t).filter((p) => p.type === "status_resist" && p.status === eff.type).reduce((s, p) => s + p.val, 0);
          const effChance = Math.min(1, (eff.chance || 0) + awaken * 0.06) * (1 - Math.min(0.9, statusResist));
          if (Math.random() < effChance) {
            if (eff.type === "cleanse") {
              t.effects = t.effects.filter((e) => e.type.startsWith("buff") || e.type === "shield" || e.type === "regen" || e.type === "tactical_stance");
            } else {
              let scaledVal = typeof eff.val === "number" ? eff.val * (1 + (abilityLevel - 1) * 0.1) * sigEffectMult : eff.val;
              if (eff.type === "buff_def" && skill.scalingStat === "def") scaledVal *= 1 + attackerStats.def / 1e4;
              if (eff.type === "buff_atk" && skill.scalingStat === "atk") scaledVal *= 1 + attackerStats.atk / 1e4;
              if (eff.type === "shield" && skill.scalingStat === "magic_def") scaledVal *= 1 + attackerStats.magicDef / 5e3;
              if (eff.type === "shield" && skill.scalingStat === "hp") scaledVal *= 1 + attackerStats.hp / 1e4;
              if (eff.type === "buff_spd" && skill.scalingStat === "speed") scaledVal *= 1 + attackerStats.speed / 300;
              t.effects.push({ ...eff, val: scaledVal });
            }
          }
        });
      }
      if (skill.type === "heal") {
        let scalingVal = attackerStats.atk * 0.3 + attackerStats.magicAtk * 1.2;
        if (skill.scalingStat === "hp") scalingVal = attackerStats.hp * 0.15;
        if (skill.scalingStat === "magic_atk") scalingVal = attackerStats.magicAtk * 1.5;
        const sigHealMult = skill.signature ? SIGNATURE_BONUS.HEAL : 1;
        const amt = Math.floor(scalingVal * ((skill.power || 1) * (1 + (abilityLevel - 1) * 0.05)) * (isLimitBreak ? 2.5 : 1) * sigHealMult);
        t.hp = Math.min(t.maxHp, t.hp + amt);
        if (!attacker.isEnemy) attacker._battleHealing = (attacker._battleHealing || 0) + amt;
        attacker.lastAction = { targetId: t.id, amount: amt, type: "heal", time: Date.now(), skillUser: attacker.id };
        return;
      }
      if (skill.type === "atk" || skill.type === "combo" || skill.type === "debuff" && (skill.power || 0) > 0) {
        const tStats = getBattleStats(t, playerElement, t.activeSynergies || []);
        // PHANTOM VEIL: a rare self-cast effect that overrides the normal
        // (stat-capped-at-60%) evasion roll with a near-total dodge chance for
        // its duration. Deliberately uses the exact same bypass funnel as every
        // other evasion check -- ignore_evasion signatures, Limit Breaks, and
        // hidden-power-ready casts still punch through it -- so nothing new has
        // to be discovered to counter it, it just reads as "she's really lucky."
        const phantomVeil = t.effects.find((e) => e.type === "phantom_veil");
        const effectiveEvasion = phantomVeil ? phantomVeil.val : (tStats.evasion || 0);
        const attackerTruesight = (attacker.effects || []).some((e) => e.type === "truesight");
        if (!isLimitBreak && !META.ignore_evasion && !attacker._dynArchetypeIgnoreEvasion && !hiddenPowerReady && !attackerTruesight && Math.random() < effectiveEvasion) {
          attacker.lastAction = { targetId: t.id, amount: "MISS", type: "miss", time: Date.now(), skillUser: attacker.id };
          return;
        }
        let isMagic = skill.damageType === "magical" || attacker._dynArchetypeDamageType === "magical" || attackerStats.magicAtk > attackerStats.atk;
        let offense = isMagic ? attackerStats.magicAtk : attackerStats.atk;
        if (skill.scalingStat) {
          const s = String(skill.scalingStat || "").toLowerCase();
          if (s === "def") offense = attackerStats.def;
          else if (s === "hp") offense = Math.max(1, Math.floor(attackerStats.hp / 12));
          else if (s === "speed") offense = Math.max(1, Math.floor(attackerStats.speed * 2.8));
          else if (s === "luck") offense = Math.max(1, Math.floor(attackerStats.luck * 10));
          else if (s.includes("magic")) {
            offense = attackerStats.magicAtk;
            isMagic = true;
          } else if (s.includes("atk")) {
            offense = attackerStats.atk;
            isMagic = false;
          }
        }
        let skillPower = (skill.power || 1) * (1 + (abilityLevel - 1) * 0.05) * (1 + awaken * 0.1);
        // Signature premium: a signature must clearly beat a same-power Legendary.
        if (skill.signature) skillPower *= SIGNATURE_BONUS.DAMAGE;
        // COMBO CHAIN: the battle view feeds in a team-wide combo multiplier that
        // ramps while allies keep the hit chain alive (enemy actions break it).
        skillPower *= extraPowerMult;
        skillPower *= wishDmgMult;
        skillPower *= slotDmgMult;
        skillPower *= stageDmgMult;
        skillPower *= dynDmgMult;
        if (hiddenPowerReady) skillPower *= META.hidden_power_mult || 4;
        if (META.scales_missing_hp) skillPower *= 1 + (1 - attacker.hp / attacker.maxHp) * META.scales_missing_hp;
        if (META.scales_current_hp) skillPower *= 1 + (attacker.hp / attacker.maxHp) * META.scales_current_hp;
        // RIPPLE OVERDRIVE (reusable) — scales with the WHOLE TEAM's landed hits
        // this battle (attacker._landedHits, tracked on every unit), not the
        // caster's own count alone. Rewards a squad that's actually been
        // fighting hard over one that just opens with its biggest button --
        // "meta defining" in the sense that it's strongest built around, not
        // just a bigger number. Any future signature can opt into this the
        // same way (META.scales_hit_count: { perHit, cap }).
        if (META.scales_hit_count) {
          const teamHits = livingAllies.reduce((s, a) => s + (a._landedHits || 0), 0);
          skillPower *= Math.min(META.scales_hit_count.cap || 3, 1 + teamHits * (META.scales_hit_count.perHit || 0.02));
        }
        const skillIdLow = (skill.id || "").toLowerCase();
        const elementMatches = skillIdLow.includes("fire") && attacker.element === "FIRE" || skillIdLow.includes("ice") && attacker.element === "WATER" || skillIdLow.includes("bolt") && attacker.element === "WIND" || skillIdLow.includes("holy") && attacker.element === "LIGHT" || skillIdLow.includes("shadow") && attacker.element === "DARK" || skillIdLow.includes("seismic") && attacker.element === "EARTH";
        if (elementMatches) skillPower *= 1.3;
        const targetHasStatic = t.effects.some((e) => e.type === "static");
        if (skill.id === "debug_smite" && targetHasStatic) skillPower *= 3;
        if (skill.id === "data_leech" && targetHasStatic) {
          attacker.hp = Math.min(attacker.maxHp, attacker.hp + Math.floor(offense * 0.5));
          attacker.lastAction = { ...attacker.lastAction, msg: "LEECHED" };
        }
        let dmg = Math.floor(offense * skillPower * (attacker.tierMod || 1) * (isLimitBreak ? 2 : 0.85));
        // GEAR PASSIVES -- elem_boost (attacker's own-element gear) / elem_resist
        // (target's gear resisting the attacker's element). Same catalog players
        // and enemies/bosses/arena opponents both roll from (EQUIPMENT in
        // constants.js), so this applies identically to every unit.
        const attackerElemBoost = getGearPassives(attacker).filter((p) => p.type === "elem_boost" && p.element === attacker.element).reduce((s, p) => s + p.val, 0);
        if (attackerElemBoost) dmg = Math.floor(dmg * (1 + attackerElemBoost));
        const targetElemResist = getGearPassives(t).filter((p) => p.type === "elem_resist" && p.element === attacker.element).reduce((s, p) => s + p.val, 0);
        if (targetElemResist) dmg = Math.floor(dmg * (1 - Math.min(0.8, targetElemResist)));
        if (ELEMENTS[attacker.element]?.strongTo === t.element) {
          dmg = Math.floor(dmg * 1.35);
          const insight = attacker.effects.find((e) => e.type === "elemental_insight");
          if (insight) dmg = Math.floor(dmg * (1 + insight.val));
        } else if (ELEMENTS[attacker.element]?.weakTo === t.element) dmg = Math.floor(dmg * 0.8);
        const sigCritBonus = skill.signature ? SIGNATURE_BONUS.CRIT_RATE : 0;
        let didCrit = false;
        if (Math.random() < (attackerStats.critRate || 0.05) + (awaken >= 5 ? 0.25 : 0) + sigCritBonus || skill.meta?.guaranteed_crit || hiddenPowerReady) {
          dmg = Math.floor(dmg * (1.4 + awaken * 0.04 + (skill.signature ? SIGNATURE_BONUS.CRIT_DMG : 0)));
          didCrit = true;
        }
        // --- Conditional damage modifiers ---
        // BREAK window: broken (stagger-shattered) targets take amplified damage
        // from every source. This is the payoff for filling the stagger bar.
        const brokenEff = t.effects.find((e) => e.type === "broken");
        if (brokenEff) {
          dmg = Math.floor(dmg * (1 + (brokenEff.val || 0.5)));
          attacker.lastAction = { ...attacker.lastAction, msg: "BREAK!" };
        }
        if (META.bonus_vs_status && t.effects.some((e) => e.type === META.bonus_vs_status.status)) {
          dmg = Math.floor(dmg * (META.bonus_vs_status.mult || 1.5));
          attacker.lastAction = { ...attacker.lastAction, msg: "EXPLOIT" };
        }
        if (META.bonus_vs_element && t.element === META.bonus_vs_element.element) dmg = Math.floor(dmg * (META.bonus_vs_element.mult || 1.5));
        if (META.execute_below && t.hp / t.maxHp <= META.execute_below) {
          dmg = Math.floor(dmg * (META.execute_mult || 1.8));
          attacker.lastAction = { ...attacker.lastAction, msg: "EXECUTE" };
        }
        // dynamic_special on-hit rider: the chosen SPECIAL form carries a small
        // mechanical identity beyond its damage number (an execute finisher, a
        // life-drain, etc.), applied only when that form is the active one.
        if (attacker._dynBonus === "execute" && t.hp / t.maxHp <= 0.4) {
          dmg = Math.floor(dmg * 1.8);
          attacker.lastAction = { ...attacker.lastAction, msg: "CALLED SHOT" };
        }
        // Cait Sith JACKPOT bonus: on a triple-match roll, anything already low
        // gets deleted on top of the jackpot damage multiplier.
        if (slotJackpot && META.jackpot_execute_below && t.hp / t.maxHp <= META.jackpot_execute_below) {
          dmg = Math.floor(dmg * (META.jackpot_execute_mult || 2.2));
          attacker.lastAction = { ...attacker.lastAction, msg: "★JACKPOT EXECUTE★" };
        }
        if (META.bonus_vs_full_hp && t.hp / t.maxHp >= (META.bonus_vs_full_hp.above || 0.8)) {
          dmg = Math.floor(dmg * (META.bonus_vs_full_hp.mult || 1.6));
          attacker.lastAction = { ...attacker.lastAction, msg: "AMBUSH" };
        }
        if (META.bonus_per_debuff) {
          const dc = t.effects.filter((e) => /^debuff/.test(e.type) || ["burn", "poison", "static", "freeze", "stun"].includes(e.type)).length;
          if (dc > 0) dmg = Math.floor(dmg * (1 + dc * META.bonus_per_debuff));
        }
        // CRUSH (Kazeto): damage ramps with how many CRUSHED stacks the target
        // already carries -- reward focusing the ball-and-chain on one victim.
        if (META.crush) {
          const crushStacks = t.effects.filter((e) => e.type === "crushed").length;
          if (crushStacks > 0) dmg = Math.floor(dmg * (1 + crushStacks * (META.crush.per_stack || 0.3)));
        }
        if (META.detonate) {
          const dots = t.effects.filter((e) => e.type === "burn" || e.type === "poison" || e.type === "static");
          if (dots.length) {
            let burst = 0;
            dots.forEach((e) => { burst += Math.floor((e.val || 0.05) * t.maxHp * Math.max(1, e.duration || 1)); });
            dmg += Math.floor(burst * META.detonate);
            t.effects = t.effects.filter((e) => e.type !== "burn" && e.type !== "poison" && e.type !== "static");
            attacker.lastAction = { ...attacker.lastAction, msg: "DETONATE" };
          }
        }
        let defense = isMagic ? tStats.magicDef : tStats.def;
        // Combine every armor-pierce source (skill ignore_def, signature floor,
        // tactical stance pen) into one reduction so they don't multiply weirdly.
        let pierce = skill.meta?.ignore_def || 0;
        if (skill.signature) pierce = Math.max(pierce, SIGNATURE_BONUS.PIERCE_FLOOR);
        if (attacker._tacticalBonus && attacker._tacticalBonus.armorPenPct) pierce = 1 - (1 - pierce) * (1 - attacker._tacticalBonus.armorPenPct);
        defense = Math.floor(defense * (1 - Math.min(0.95, pierce)));
        if (hiddenPowerReady) defense = 0;
        // Fixed-constant mitigation (skills: DEF 4500 == 50% reduction).
        dmg = applyMitigation(dmg, defense);
        const shieldIdx = (t.effects || []).findIndex((e) => e.type === "shield");
        if (shieldIdx !== -1 && META.shield_pierce) {
          // Pierce: the shield stays up, but this particular hit ignores it entirely.
          attacker.lastAction = { ...attacker.lastAction, msg: "PIERCED" };
        } else if (shieldIdx !== -1) {
          const shield = getShieldPool(t, t.effects[shieldIdx]);
          if (META.shield_drain) {
            // Drain: rip the shield off the target and slap it on the attacker instead.
            // The hit that does this still lands at full force -- the shield never got
            // the chance to soften it.
            const stolen = t.effects.splice(shieldIdx, 1)[0];
            attacker.effects = attacker.effects.filter((e) => e.type !== "shield");
            attacker.effects.push({ ...stolen, label: "DRAINED " + (stolen.label || "SHIELD") });
            attacker.lastAction = { ...attacker.lastAction, msg: "SHIELD DRAIN" };
          } else if (META.shield_detonate) {
            // Detonate: the stronger the shield, the bigger the payout for cracking it.
            const bonus = Math.floor(dmg * (shield.val || 0) * 2);
            dmg += bonus;
            t.effects.splice(shieldIdx, 1);
            attacker.lastAction = { targetId: t.id, amount: dmg, type: "shield_break", time: Date.now(), skillUser: attacker.id, msg: "SHIELD DETONATE" };
          } else if (META.break_shield) {
            t.effects.splice(shieldIdx, 1);
            dmg = Math.floor(dmg * 1.5);
            attacker.lastAction = { targetId: t.id, amount: dmg, type: "shield_break", time: Date.now(), skillUser: attacker.id };
          } else if (dmg >= shield.remainingHp) {
            dmg -= shield.remainingHp;
            t.effects.splice(shieldIdx, 1);
            t._shieldHit = true;
          } else {
            shield.remainingHp -= dmg;
            dmg = 0;
            t._shieldHit = true;
          }
        }
        // MULTI-HIT: the finalized per-hit damage lands `numHits` times. Total is
        // applied at once (so shields/kills resolve correctly) but the strike count
        // is surfaced on lastAction so the UI can flash "xN".
        if (numHits > 1) {
          dmg = dmg * numHits;
          attacker.lastAction = { ...attacker.lastAction, hits: numHits };
        }
        t.hp = Math.max(0, t.hp - dmg);
        // WAKE ON DAMAGE: sleep (and freeze) break the moment a unit is struck.
        if (dmg > 0) t.effects = t.effects.filter((e) => e.type !== "sleep");
        if (attacker._dynBonus === "lifesteal" && dmg > 0) {
          attacker.hp = Math.min(attacker.maxHp, attacker.hp + Math.floor(dmg * 0.3));
        }
        // SUNBEAM (Funshine): each damaging hit also mends the caster's team a little.
        if (META.sunbeam && dmg > 0) {
          livingAllies.forEach((a) => { a.hp = Math.min(a.maxHp, a.hp + Math.floor(a.maxHp * 0.04)); });
        }
        // Battle report tracking: per-unit damage totals + biggest single hit,
        // read by VictoryScreen for the post-battle breakdown.
        if (!attacker.isEnemy) {
          attacker._battleDamage = (attacker._battleDamage || 0) + dmg;
          attacker._battleBestHit = Math.max(attacker._battleBestHit || 0, dmg);
        }
        if (t.hp === 0) {
          if (!t.isEnemy && t._leaderRevive) {
            t._leaderRevive = false;
            t.hp = 1;
            t.lastAction = { ...t.lastAction, msg: "SAVED!" };
          } else {
            t.dead = true;
            playSound(t.isBoss ? "mugen_double_ko" : "mugen_die", t.isBoss ? 0.7 : 0.4);
          }
        }
        // --- Tangled Web: a paper-tail grapple line that links a marked target to its
        // whole side. While "tethered", every hit landed on any OTHER unit on that same
        // side also yanks the tether, splashing a cut of that damage onto the snared unit.
        if (dmg > 0) {
          const tetherSplashPct = META.tether_splash || 0.3;
          next.filter((u2) => u2.isEnemy === t.isEnemy && u2.id !== t.id && !u2.dead && u2.effects.some((e) => e.type === "tethered")).forEach((snared) => {
            const splash = Math.max(1, Math.floor(dmg * tetherSplashPct));
            snared.hp = Math.max(0, snared.hp - splash);
            if (snared.hp === 0) {
              if (!snared.isEnemy && snared._leaderRevive) {
                snared._leaderRevive = false;
                snared.hp = 1;
                snared.lastAction = { ...snared.lastAction, msg: "SAVED!" };
              } else snared.dead = true;
            }
          });
        }
        if (META.applies_tether && !t.dead) {
          t.effects = t.effects.filter((e) => e.type !== "tethered");
          t.effects.push({ type: "tethered", duration: META.tether_duration || 3, val: 0, label: "TANGLED IN PAPER" });
          attacker.lastAction = { ...attacker.lastAction, msg: "SNARED" };
          playSound("mugen_throw", 0.5);
        }
        if (META.grants_shield_on_kill && t.dead) {
          attacker.effects = attacker.effects.filter((e) => e.type !== "shield");
          attacker.effects.push({ type: "shield", duration: META.shield_duration || 3, val: META.shield_val || 0.25, label: "SPOILS OF WAR" });
          attacker.lastAction = { ...attacker.lastAction, msg: "SHIELD UP" };
        }
        if (META.grants_untargetable_on_kill && t.dead) {
          attacker.effects = attacker.effects.filter((e) => e.type !== "untargetable");
          attacker.effects.push({ type: "untargetable", duration: META.untargetable_duration || 2, val: 0, label: "VANISHED" });
          attacker.lastAction = { ...attacker.lastAction, msg: "VANISH" };
        }
        if (META.steal_buff && !t.dead) {
          const bi = t.effects.findIndex((e) => e.type.startsWith("buff"));
          if (bi !== -1) {
            const stolen = t.effects.splice(bi, 1)[0];
            attacker.effects.push({ ...stolen, label: "STOLEN " + (stolen.label || stolen.type) });
            attacker.lastAction = { ...attacker.lastAction, msg: "STEAL" };
          }
        }
        if (META.mark && !t.dead) {
          t.effects = t.effects.filter((e) => e.type !== "debuff_def" || e.label !== (META.mark.label || "MARKED"));
          t.effects.push({ type: "debuff_def", duration: META.mark.duration || 3, val: META.mark.def_down || 0.3, label: META.mark.label || "MARKED" });
          attacker.lastAction = { ...attacker.lastAction, msg: "MARKED" };
        }
        // CRUSH: slap another CRUSHED stack on the target (up to a cap), shredding
        // its defenses for the whole squad and setting up Kazeto's next hit.
        if (META.crush && !t.dead) {
          const cap = META.crush.max_stacks || 5;
          const cur = t.effects.filter((e) => e.type === "crushed").length;
          if (cur < cap) t.effects.push({ type: "crushed", duration: META.crush.duration || 4, val: META.crush.def_down || 0.12, label: "CRUSHED" });
          attacker.lastAction = { ...attacker.lastAction, msg: "CRUSH!" };
        }
        if (META.heal_on_hit) attacker.hp = Math.min(attacker.maxHp, attacker.hp + Math.floor(dmg * META.heal_on_hit));
        if (META.extra_hits && !t.dead) {
          let extra = 0;
          for (let hI = 0; hI < META.extra_hits; hI++) {
            let hd = dmg;
            if (Math.random() < (attackerStats.critRate || 0.05) + (awaken >= 5 ? 0.25 : 0)) hd = Math.floor(hd * (1.4 + awaken * 0.04));
            extra += hd;
          }
          t.hp = Math.max(0, t.hp - extra);
          if (t.hp === 0) {
            if (!t.isEnemy && t._leaderRevive) {
              t._leaderRevive = false;
              t.hp = 1;
              t.lastAction = { ...t.lastAction, msg: "SAVED!" };
            } else t.dead = true;
          }
          attacker.lastAction = { ...attacker.lastAction, amount: dmg + extra, msg: (META.extra_hits + 1) + " HITS" };
        }
        if (META.copy_buff && !t.dead) {
          t.effects.filter((e) => e.type.startsWith("buff")).forEach((e) => attacker.effects.push({ ...e, label: "COPIED " + (e.label || e.type) }));
          attacker.lastAction = { ...attacker.lastAction, msg: "COPY" };
        }
        if (META.invert_buffs) {
          let inverted = false;
          t.effects = t.effects.map((e) => {
            if (e.type === "buff_atk") { inverted = true; return { type: "debuff_atk", duration: e.duration, val: e.val, label: "INVERTED ATK" }; }
            if (e.type === "buff_def") { inverted = true; return { type: "debuff_def", duration: e.duration, val: e.val, label: "INVERTED DEF" }; }
            if (e.type === "buff_spd") { inverted = true; return { type: "debuff_spd", duration: e.duration, val: e.val, label: "INVERTED SPD" }; }
            return e;
          });
          if (inverted) attacker.lastAction = { ...attacker.lastAction, msg: "INVERT" };
        }
        if (META.random_status && !t.dead) {
          const pool = ["burn", "freeze", "poison", "static", "debuff_spd", "debuff_atk"];
          const pick = pool[Math.floor(Math.random() * pool.length)];
          t.effects.push({ type: pick, duration: 3, val: 0.18, label: "PAINT" });
        }
        if (t.isEnemy && !t.dead && t.maxStagger) {
          const stg = (skill.meta?.stagger_bonus || 1) * (skill.id && skill.id.includes("crit") ? 15 : 8);
          t.stagger = Math.min(t.maxStagger, (t.stagger || 0) + Math.floor(stg));
          if (t.stagger >= t.maxStagger) {
            // BREAK: a filled stagger bar is now a real payoff window -- the enemy
            // is stunned for 2 turns AND takes +50% damage from everything while
            // broken. Build the bar, then dump your burst window into it.
            t.effects.push({ type: "stun", duration: 2, val: 0, label: "STAGGERED" });
            t.effects.push({ type: "broken", duration: 2, val: 0.5, label: "BREAK" });
            t.stagger = 0;
            playSound("mugen_fall" + (Math.random() < 0.34 ? "" : Math.random() < 0.5 ? "2" : "3"), 0.5);
          }
        }
        if (attacker._tacticalBonus && dmg > 0) {
          try {
            next.forEach((a) => {
              if (!a.isEnemy && !a.dead && a.id !== attacker.id) a.burst = Math.min(100, (a.burst || 0) + attacker._tacticalBonus.teamBurst);
            });
            if (Math.random() < (attacker._tacticalBonus.shieldChance || 0)) attacker.effects.push({ type: "shield", duration: 2, val: 0.15, label: "TACTICAL SHIELD" });
          } catch (e) {
          }
        }
        if (attackerStats.lifesteal || skill.meta?.lifesteal || awaken >= 3) {
          const ls = Math.max(attackerStats.lifesteal || 0, skill.meta?.lifesteal || 0, awaken >= 3 ? 0.05 + (awaken - 3) * 0.03 : 0);
          attacker.hp = Math.min(attacker.maxHp, attacker.hp + Math.floor(dmg * ls));
        }
        attacker.lastAction = { targetId: t.id, amount: dmg, type: skill.damageType === "magical" ? "magic" : "normal", crit: didCrit, damageType: skill.damageType || "physical", time: Date.now(), skillUser: attacker.id, resonated: elementMatches, tacticalUsed: !!attacker._tacticalBonus, msg: wishMsg || undefined };
        // Running landed-hit counter -- tracked on every unit so any future
        // signature can read "how much has this attacker actually connected
        // this battle" (see META.scales_hit_count, Jonathan's Ripple Overdrive).
        attacker._landedHits = (attacker._landedHits || 0) + 1;
        if (hiddenPowerReady) {
          hiddenPowerEff.val = 0;
          attacker.lastAction = { ...attacker.lastAction, msg: "TRUE FORM" };
        }
      }
    });
  }
  return next;
};
const TacticalStanceRow = ({ currentStance, onStanceChange }) => {
  return /* @__PURE__ */ jsxDEV("div", { className: "element-switcher", children: ["FIRE", "WATER", "WIND", "LIGHT", "DARK", "EARTH"].map((el) => /* @__PURE__ */ jsxDEV(
    "div",
    {
      className: `element-icon ${currentStance === el ? "active" : ""}`,
      style: {
        "--el-color": ELEMENTS[el].color,
        borderColor: ELEMENTS[el].color,
        background: currentStance === el ? ELEMENTS[el].color : "transparent"
      },
      onClick: () => onStanceChange(el),
      children: el[0]
    },
    el,
    false,
    {
      fileName: "<stdin>",
      lineNumber: 412,
      columnNumber: 17
    }
  )) }, void 0, false, {
    fileName: "<stdin>",
    lineNumber: 410,
    columnNumber: 9
  });
};
// A single flying orb: spawned at the caster's screen position, animates to
// the target's screen position via a shared CSS keyframe driven by per-
// instance --dx/--dy custom properties (so one @keyframes rule handles any
// distance/direction), then unmounts itself. Positions are captured ONCE at
// spawn (not re-measured mid-flight) -- battle formations don't reflow
// mid-animation, so this stays accurate without a rAF loop.
const Projectile = ({ fromX, fromY, dx, dy, color, delayMs, onDone }) => {
  useEffect(() => {
    const t = setTimeout(onDone, delayMs + 620);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const angleDeg = Math.atan2(dy, dx) * (180 / Math.PI);
  return /* @__PURE__ */ jsxDEV("div", { className: "projectile-wrap", style: { left: fromX, top: fromY, "--dx": `${dx}px`, "--dy": `${dy}px`, "--proj-delay": `${delayMs}ms` }, children: [
    /* @__PURE__ */ jsxDEV("div", { className: "projectile-orb", style: { "--proj-color": color } }, void 0, false, {}),
    /* @__PURE__ */ jsxDEV("div", { className: "projectile-trail", style: { "--proj-color": color, "--proj-angle": `${angleDeg}deg` } }, void 0, false, {})
  ] }, void 0, true, {});
};
// Watches `combatants` for fresh `lastProjectile` tags (set in
// executeCombatSkill for ranged-reading casts) and spawns a real screen-space
// projectile flying from the caster's rendered position to each target's --
// "fireball actually flies at the target" instead of just a cast flourish on
// the caster. `containerRef` must point at the battle-scene element the
// battle-unit rows live inside (position: relative), since projectile
// coordinates are computed relative to it.
const ProjectileLayer = ({ combatants = [], containerRef }) => {
  const [projectiles, setProjectiles] = useState([]);
  const seenRef = useRef({});
  useEffect(() => {
    // This effect re-fires on EVERY combat tick (combatants gets a new array
    // reference every ~50ms in all three battle views), so it's critical
    // nothing here touches the DOM -- and nothing re-renders -- unless a
    // skill actually just fired. getBoundingClientRect() forces a synchronous
    // layout; doing that 20x/sec for the whole battle is exactly the kind of
    // thing that reads as "laggy." Check for fresh projectiles FIRST, on the
    // already-in-memory combatants array, before touching the DOM at all.
    const fresh = combatants.filter((u) => u.lastProjectile && u.lastProjectile.time && seenRef.current[u.id] !== u.lastProjectile.time);
    if (!fresh.length) return;
    const container = containerRef?.current;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    const spawned = [];
    fresh.forEach((u) => {
      const proj = u.lastProjectile;
      seenRef.current[u.id] = proj.time;
      const fromEl = document.getElementById(`battle-unit-${u.id}`);
      if (!fromEl) return;
      const fromRect = fromEl.getBoundingClientRect();
      const fromX = fromRect.left + fromRect.width / 2 - containerRect.left;
      const fromY = fromRect.top + fromRect.height / 2 - containerRect.top;
      (proj.targetIds || []).forEach((tid, i) => {
        const toEl = document.getElementById(`battle-unit-${tid}`);
        if (!toEl) return;
        const toRect = toEl.getBoundingClientRect();
        const toX = toRect.left + toRect.width / 2 - containerRect.left;
        const toY = toRect.top + toRect.height / 2 - containerRect.top;
        spawned.push({ id: `${u.id}-${proj.time}-${tid}`, fromX, fromY, dx: toX - fromX, dy: toY - fromY, color: proj.color, delayMs: i * 70 });
      });
    });
    if (spawned.length) setProjectiles((prev) => [...prev, ...spawned]);
  }, [combatants, containerRef]);
  const removeOne = (id) => setProjectiles((prev) => prev.filter((p) => p.id !== id));
  return /* @__PURE__ */ jsxDEV("div", { className: "projectile-layer", children: projectiles.map((p) => /* @__PURE__ */ jsxDEV(Projectile, { ...p, onDone: () => removeOne(p.id) }, p.id, false, {})) }, void 0, false, {});
};
const BattleUnit = ({ unit, isMarked, onMark, floatingDamages, playerElement, reducedFx = false }) => {
  const [isHit, setIsHit] = useState(false);
  // Number of flurry strikes on the current hit (>1 => rapid combo-rattle).
  const [hitBurst, setHitBurst] = useState(0);
  const lastComboTime = useRef(0);
  const [ghostHpPercent, setGhostHpPercent] = useState(0);
  const prevHp = useRef(unit.hp);
  const hpPercent = unit.hp / unit.maxHp * 100;
  // --- Impact/elemental GIF overlay (effectsnew/*.gif), punched in with GSAP ---
  const [activeGif, setActiveGif] = useState(null);
  const gifRef = useRef(null);
  const gifSeq = useRef(0);
  const playGif = (src) => {
    const seq = ++gifSeq.current;
    setActiveGif({ src, key: seq });
  };
  useEffect(() => {
    if (!activeGif || !gifRef.current) return;
    gsap.fromTo(
      gifRef.current,
      { scale: 0.2, opacity: 0 },
      {
        scale: 1.5,
        opacity: 1,
        duration: 0.18,
        ease: "back.out(3)",
        onComplete: () => {
          gsap.to(gifRef.current, { opacity: 0, scale: 1.8, duration: 0.35, delay: 0.15 });
        }
      }
    );
    const timer = setTimeout(() => setActiveGif((cur) => cur && cur.key === activeGif.key ? null : cur), 700);
    return () => clearTimeout(timer);
  }, [activeGif]);
  const prevEffectTypes = useRef(/* @__PURE__ */ new Set());
  useEffect(() => {
    const curTypes = new Set(unit.effects.map((e) => e.type));
    if (curTypes.has("buff_elemdmg") && !prevEffectTypes.current.has("buff_elemdmg")) playGif("effectsnew/holy.gif");
    else if (curTypes.has("crushed") && !prevEffectTypes.current.has("crushed")) playGif("effectsnew/popupflash.gif");
    else if (curTypes.has("burn") && !prevEffectTypes.current.has("burn")) playGif("effectsnew/fire.gif");
    else if (curTypes.has("freeze") && !prevEffectTypes.current.has("freeze")) playGif("effectsnew/ice.gif");
    else if (curTypes.has("poison") && !prevEffectTypes.current.has("poison")) playGif("effectsnew/poison.gif");
    else if (curTypes.has("static") && !prevEffectTypes.current.has("static")) playGif("effectsnew/arcane.gif");
    prevEffectTypes.current = curTypes;
  }, [unit.effects]);
  const prevMsg = useRef(null);
  useEffect(() => {
    const msg = unit.lastAction?.msg;
    if (msg && msg !== prevMsg.current) {
      if (msg === "SAVED!") playGif("effectsnew/holy.gif");
      else if (unit.lastAction?.type === "shield_break") playGif("effectsnew/popupflash.gif");
    }
    prevMsg.current = msg;
  }, [unit.lastAction?.msg]);
  // LUNGE: when this unit lands an offensive action, it physically dashes
  // toward the opposing line and snaps back -- the core "PNGs are actually
  // fighting" read. Crits get a harder, faster lunge.
  const [lungeKind, setLungeKind] = useState(null);
  // Measured dash vector for a rushdown basic attack -- CSS custom props the
  // rush keyframes read to travel the REAL distance to the target and back.
  const [rush, setRush] = useState(null);
  const prevActTime = useRef(null);
  useEffect(() => {
    const act = unit.lastAction;
    if (!act || act.time === prevActTime.current) return;
    prevActTime.current = act.time;
    if (["normal", "magic", "basic", "shield_break"].includes(act.type)) {
      // FIGHTING-GAME RUSHDOWN: a basic attack dashes the attacker all the way
      // across to the target and throws a stat-driven flurry (meleeHits), with
      // fast characters launching an air combo (meleeAir). Measure the actual
      // on-screen vector to the target NOW (post-commit, sprites at rest) so
      // the dash lands on them instead of bobbing in place. Only runs on a
      // real basic-attack event -- not per tick -- so no layout-thrash cost.
      if (act.type === "basic" && !reducedFx) {
        const fromEl = document.getElementById(`battle-unit-${unit.id}`);
        const toEl = act.targetId != null ? document.getElementById(`battle-unit-${act.targetId}`) : null;
        if (fromEl && toEl) {
          const a = fromEl.getBoundingClientRect();
          const b = toEl.getBoundingClientRect();
          // Stop ~72% of the way so the sprites meet but don't fully overlap;
          // clamp so a stray measurement can't fling the sprite off-screen.
          const dx = Math.max(-520, Math.min(520, (b.left + b.width / 2 - (a.left + a.width / 2)) * 0.72));
          const dy = Math.max(-420, Math.min(420, (b.top + b.height / 2 - (a.top + a.height / 2)) * 0.72));
          setRush({ "--rush-dx": `${dx.toFixed(1)}px`, "--rush-dy": `${dy.toFixed(1)}px` });
          const kind = act.meleeAir ? "rush-air" : "rush-combo";
          setLungeKind(kind);
          const dur = getBasicAttackMs(act.meleeAir);
          const t = setTimeout(() => { setLungeKind(null); setRush(null); }, dur);
          return () => clearTimeout(t);
        }
        // Fall through to a plain lunge if we couldn't measure a target.
      }
      // Skill casts play their OWN bespoke wind-up motion (lastCastAnim). Basic
      // attacks never reuse a stale cast anim -- they lunge/rush only.
      const castAnim = act.type !== "basic" ? unit.lastCastAnim : null;
      if (castAnim) {
        setLungeKind(castAnim);
        const t = setTimeout(() => setLungeKind(null), getCastAnimMs(castAnim));
        return () => clearTimeout(t);
      }
      setLungeKind(act.crit ? "lunge-crit" : "lunge");
      const t = setTimeout(() => setLungeKind(null), getLungeMs(act.crit));
      return () => clearTimeout(t);
    }
  }, [unit.lastAction?.time]);
  useEffect(() => {
    if (unit.hp < prevHp.current) {
      // If this HP drop came from a rushdown basic attack, the sim stamped how
      // many flurry strikes landed (_comboHits) with a fresh timestamp. Rattle
      // the target rapidly for that many hits so the flurry visibly LANDS,
      // instead of one flat flash. Gated on a fresh timestamp so a later DOT/
      // skill drop doesn't reuse a stale flurry count.
      let hits = 1;
      if (unit._comboHitsTime && unit._comboHitsTime !== lastComboTime.current) {
        lastComboTime.current = unit._comboHitsTime;
        hits = Math.max(1, unit._comboHits || 1);
      }
      setIsHit(true);
      setHitBurst(hits);
      setGhostHpPercent(prevHp.current / unit.maxHp * 100);
      if (!activeGif) playGif("effectsnew/popupflash.gif");
      const dur = hits > 1 ? Math.min(620, 200 + hits * 80) : 250;
      const timer = setTimeout(() => { setIsHit(false); setHitBurst(0); }, dur);
      return () => clearTimeout(timer);
    } else if (unit.hp > prevHp.current) {
      playGif("effectsnew/popupchomp.gif");
      setGhostHpPercent(hpPercent);
    } else {
      setGhostHpPercent(hpPercent);
    }
    prevHp.current = unit.hp;
  }, [unit.hp, unit.maxHp]);
  const isActiveTurn = unit.gauge >= 100 && !unit.dead;
  const stance = unit.effects.find((e) => e.type === "tactical_stance");
  const isStaggered = unit.effects.some((e) => e.label === "STAGGERED") && !unit.dead;
  const isFrozen = unit.effects.some((e) => e.type === "freeze") && !unit.dead;
  const isStunned = unit.effects.some((e) => e.type === "stun") && !unit.dead;
  const isBurned = unit.effects.some((e) => e.type === "burn") && !unit.dead;
  const isStatic = unit.effects.some((e) => e.type === "static") && !unit.dead;
  const isElemEmpowered = unit.effects.some((e) => e.type === "buff_elemdmg") && !unit.dead;
  const isCrushed = unit.effects.some((e) => e.type === "crushed") && !unit.dead;
  const isBroken = unit.effects.some((e) => e.type === "broken") && !unit.dead;
  // Attack telegraph: an enemy whose turn gauge is nearly full flashes a warning.
  // Guarding during this window grants a PERFECT GUARD (see triggerDefend).
  const isTelegraphing = unit.isEnemy && !unit.dead && (unit.gauge || 0) >= 78;
  const groupedEffects = useMemo(() => {
    const groups = {};
    unit.effects.forEach((e) => {
      if (e.type === "tactical_stance") return;
      const key = e.type + (e.label || "");
      if (!groups[key]) groups[key] = { ...e, count: 0, maxDur: 0 };
      groups[key].count++;
      groups[key].maxDur = Math.max(groups[key].maxDur, e.duration);
    });
    return Object.values(groups);
  }, [unit.effects]);
  const hpColor = hpPercent > 60 ? "#22c55e" : hpPercent > 25 ? "#facc15" : "#ef4444";
  const shieldEffect = unit.effects.find((e) => e.type === "shield");
  const hasShield = !!shieldEffect;
  const shieldHpPercent = shieldEffect && shieldEffect.maxHp ? shieldEffect.remainingHp / shieldEffect.maxHp * 100 : 0;
  const s1Ready = unit.skillCd >= unit.maxSkillCd;
  const s2Ready = unit.skillId2 && unit.skillCd2 >= unit.maxSkillCd2;
  const [shieldHitActive, setShieldHitActive] = useState(false);
  useEffect(() => {
    if (unit._shieldHit) {
      setShieldHitActive(true);
      const t = setTimeout(() => {
        setShieldHitActive(false);
        unit._shieldHit = false;
      }, 300);
      return () => clearTimeout(t);
    }
  }, [unit._shieldHit]);
  const stanceElement = stance ? stance.label.split(":")[1] : null;
  const stanceColor = stanceElement ? ELEMENTS[stanceElement]?.color : "#fff";
  return /* @__PURE__ */ jsxDEV(
    "div",
    {
      id: `battle-unit-${unit.id}`,
      className: `battle-unit ${unit.isEnemy ? "is-enemy" : "is-ally"} ${unit.dead ? "dead-dissolve" : "battle-unit-idle"} ${isActiveTurn ? "acting active-turn" : ""} ${isHit ? "is-hit" : ""} ${hitBurst > 1 ? "combo-rattle" : ""} ${isMarked ? "is-marked" : ""} ${unit.isBoss ? "is-boss" : ""} ${isStaggered ? "staggered-unit" : ""} ${unit.cosmetics?.borderClass || ""} ${stance ? "stance-glow-active" : ""} ${hasShield ? "has-active-shield" : ""} ${isFrozen ? "is-frozen" : ""} ${isStunned ? "is-stunned" : ""} ${isBurned ? "is-burned" : ""} ${isStatic ? "is-static" : ""} ${isElemEmpowered ? "is-elem-empowered" : ""} ${isCrushed ? "is-crushed" : ""} ${isBroken ? "is-broken" : ""} ${isTelegraphing ? "is-telegraphing" : ""} ${reducedFx ? "" : lungeKind || ""}`,
      onClick: () => unit.isEnemy && onMark && onMark(),
      style: {
        "--stance-color": stanceColor,
        "--cast-tint": ELEMENTS[unit.element]?.color || "#fff",
        "--delay": `${(Math.random() * 2).toFixed(2)}s`,
        ...(rush || {})
      },
      children: [
        isMarked && /* @__PURE__ */ jsxDEV("div", { className: "target-marker animate-pulse", children: "MARK" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 500,
          columnNumber: 21
        }),
        isTelegraphing && /* @__PURE__ */ jsxDEV("div", { className: "attack-telegraph", children: "!" }, void 0, false, { fileName: "<stdin>", lineNumber: 1, columnNumber: 1 }),
        stance && /* @__PURE__ */ jsxDEV("div", { className: "stance-indicator-tag", style: { "--stance-color": stanceColor }, children: [
          /* @__PURE__ */ jsxDEV("div", { className: "stance-icon-mini" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 503,
            columnNumber: 13
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "stance-label-mini", children: [
            stanceElement,
            " STANCE ",
            stanceElement === "FIRE" ? "+ATK" : stanceElement === "WATER" ? "+DEF" : stanceElement === "WIND" ? "+SPD" : stanceElement === "DARK" ? "+CRIT" : ""
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 504,
            columnNumber: 13
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 502,
          columnNumber: 10
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "hit-flash-overlay" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 509,
          columnNumber: 8
        }),
        /* @__PURE__ */ jsxDEV("div", { className: `unit-avatar-wrapper ${unit.isBoss ? "boss-size" : "std-size"} ${unit.gauge >= 100 ? "active-turn" : ""}`, style: { position: "relative" }, children: [
          hasShield && /* @__PURE__ */ jsxDEV("div", { className: `shield-vfx-overlay ${shieldHitActive ? "shield-hit" : ""}` }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 512,
            columnNumber: 24
          }),
          hasShield && shieldEffect.val > 0 && /* @__PURE__ */ jsxDEV("div", { className: "shield-strength-chip", children: [
            "SHLD ",
            shieldEffect.remainingHp != null ? Math.max(0, Math.round(shieldEffect.remainingHp / shieldEffect.maxHp * 100)) : 100,
            "%"
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 512,
            columnNumber: 24
          }),
          /* @__PURE__ */ jsxDEV("img", { src: (unit.effects.find((e) => e.type === "phantom_veil") || {}).transformImg || unit._cameoImg || unit.img, className: `unit-avatar ${unit.effects.some((e) => e.type === "phantom_veil") ? "phantom-transform" : unit._cameoImg ? "cameo-morph" : ""}`, style: { ...unit.cosmetics?.auraStyle, width: "100%", height: "100%" } }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 513,
            columnNumber: 10
          }),
          activeGif && /* @__PURE__ */ jsxDEV("img", { ref: gifRef, src: activeGif.src, className: "combat-fx-gif" }, activeGif.key, false, {}),
          isStaggered && /* @__PURE__ */ jsxDEV("div", { className: "stagger-badge", style: { backgroundImage: "url(effectsnew/popupwords.gif)", backgroundSize: "100% 100%", backgroundColor: "transparent" }, children: "STAGGERED" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 514,
            columnNumber: 26
          }),
          groupedEffects.length > 0 && /* @__PURE__ */ jsxDEV("div", { className: "status-effect-row", children: groupedEffects.map((e, i) => {
            let icon = /* @__PURE__ */ jsxDEV(Activity, { size: 10 }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 520,
              columnNumber: 32
            });
            let statusClass = "status-special";
            if (e.type === "burn") {
              icon = /* @__PURE__ */ jsxDEV(Flame, { size: 10 }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 523,
                columnNumber: 53
              });
              statusClass = "status-debuff";
            } else if (e.type === "freeze") {
              icon = /* @__PURE__ */ jsxDEV(Snowflake, { size: 10 }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 524,
                columnNumber: 60
              });
              statusClass = "status-stun";
            } else if (e.type === "poison") {
              icon = /* @__PURE__ */ jsxDEV(Skull, { size: 10 }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 525,
                columnNumber: 60
              });
              statusClass = "status-debuff";
            } else if (e.type === "stun") {
              icon = /* @__PURE__ */ jsxDEV(Ban, { size: 10 }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 526,
                columnNumber: 58
              });
              statusClass = "status-stun";
            } else if (e.type === "static") {
              icon = /* @__PURE__ */ jsxDEV(Zap, { size: 10 }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 527,
                columnNumber: 60
              });
              statusClass = "status-debuff";
            } else if (e.type === "shield") {
              icon = /* @__PURE__ */ jsxDEV(Shield, { size: 10 }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 528,
                columnNumber: 60
              });
              statusClass = "status-shield";
            } else if (e.type === "buff_elemdmg") {
              icon = /* @__PURE__ */ jsxDEV(Sparkles, { size: 10 }, void 0, false, { fileName: "<stdin>", lineNumber: 1, columnNumber: 1 });
              statusClass = "status-elemental";
            } else if (e.type === "crushed") {
              icon = /* @__PURE__ */ jsxDEV(ArrowDownCircle, { size: 10 }, void 0, false, { fileName: "<stdin>", lineNumber: 1, columnNumber: 1 });
              statusClass = "status-crush";
            } else if (e.type.startsWith("buff")) {
              icon = /* @__PURE__ */ jsxDEV(ArrowUpCircle, { size: 10 }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 529,
                columnNumber: 66
              });
              statusClass = "status-buff";
            } else if (e.type.startsWith("debuff")) {
              icon = /* @__PURE__ */ jsxDEV(ArrowDownCircle, { size: 10 }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 530,
                columnNumber: 68
              });
              statusClass = "status-debuff";
            }
            const desc = describeEffect(e);
            return /* @__PURE__ */ jsxDEV("div", { className: `status-badge ${statusClass}`, title: desc.full, children: [
              icon,
              desc.short && /* @__PURE__ */ jsxDEV("span", { className: "status-label", children: desc.short }, void 0, false, { fileName: "<stdin>", lineNumber: 1, columnNumber: 1 }),
              e.count > 1 && /* @__PURE__ */ jsxDEV("span", { className: "stack-count", children: [
                "x",
                e.count
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 535,
                columnNumber: 45
              }),
              /* @__PURE__ */ jsxDEV("span", { className: "duration-text", children: e.maxDur }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 536,
                columnNumber: 29
              })
            ] }, i, true, {
              fileName: "<stdin>",
              lineNumber: 533,
              columnNumber: 25
            });
          }) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 518,
            columnNumber: 14
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 511,
          columnNumber: 8
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "unit-bars", style: { marginTop: 5 }, children: [
          /* @__PURE__ */ jsxDEV("div", { className: "battle-bar-mini hp-bar-container", style: { height: 12 }, children: [
            /* @__PURE__ */ jsxDEV("div", { className: "hp-fill-ghost", style: { width: `${ghostHpPercent}%` } }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 546,
              columnNumber: 13
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "hp-fill", style: { width: `${hpPercent}%`, background: hpColor } }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 547,
              columnNumber: 13
            }),
            hasShield && shieldHpPercent > 0 && /* @__PURE__ */ jsxDEV("div", { className: "shield-bar-segment", style: { width: `${shieldHpPercent}%` } }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 549,
              columnNumber: 17
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "hp-text-overlay", children: [
              hasShield && Number.isFinite(shieldEffect.remainingHp) ? `[${Math.floor(shieldEffect.remainingHp)}] ` : "",
              Number.isFinite(unit.hp) ? Math.floor(unit.hp) : 0
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 551,
              columnNumber: 13
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 545,
            columnNumber: 10
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "battle-bar-mini gauge-bar", style: { height: 4 }, children: /* @__PURE__ */ jsxDEV("div", { className: "gauge-fill", style: { width: `${unit.gauge}%` } }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 556,
            columnNumber: 75
          }) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 556,
            columnNumber: 10
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "unit-skill-labels", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "battle-bar-mini skill-bar", children: /* @__PURE__ */ jsxDEV("div", { className: "skill1-fill", style: { width: `${Math.min(100, unit.skillCd / unit.maxSkillCd * 100)}%` } }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 560,
              columnNumber: 17
            }) }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 559,
              columnNumber: 13
            }),
            unit.skillId2 && /* @__PURE__ */ jsxDEV("div", { className: "battle-bar-mini skill-bar", children: /* @__PURE__ */ jsxDEV("div", { className: "skill2-fill", style: { width: `${Math.min(100, unit.skillCd2 / unit.maxSkillCd2 * 100)}%` } }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 564,
              columnNumber: 21
            }) }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 563,
              columnNumber: 17
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 558,
            columnNumber: 10
          }),
          !unit.isEnemy && /* @__PURE__ */ jsxDEV("div", { className: "battle-bar-mini burst-bar", style: { height: 4, marginTop: 2 }, children: /* @__PURE__ */ jsxDEV("div", { className: "burst-fill", style: { width: `${Math.min(100, unit.burst || 0)}%` } }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 569,
            columnNumber: 107
          }) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 569,
            columnNumber: 28
          }),
          unit.isEnemy && unit.maxStagger > 0 && !unit.dead && /* @__PURE__ */ jsxDEV("div", { className: "battle-bar-mini stagger-bar-mini", children: /* @__PURE__ */ jsxDEV("div", { className: "stagger-fill-mini", style: { width: `${unit.stagger / unit.maxStagger * 100}%` } }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 572,
            columnNumber: 15
          }) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 571,
            columnNumber: 13
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 544,
          columnNumber: 8
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "unit-name", style: { fontSize: "0.7rem", letterSpacing: 1, display: "flex", alignItems: "center", gap: 4 }, children: [
          unit.isEnemy && /* @__PURE__ */ jsxDEV("span", { style: { color: "#ef4444", fontWeight: 900 }, children: [
            "LV.",
            unit.level
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 578,
            columnNumber: 27
          }),
          unit.ascension > 0 && /* @__PURE__ */ jsxDEV("span", { className: "rank-badge-mini", style: { color: "#facc15", fontSize: "0.6rem", padding: "0 4px", borderColor: "#facc15", borderStyle: "solid", borderWidth: "1px" }, children: [
            "ASC ",
            unit.ascension
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 580,
            columnNumber: 12
          }),
          /* @__PURE__ */ jsxDEV("span", { children: unit.name.split(" ")[0] }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 584,
            columnNumber: 10
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 577,
          columnNumber: 8
        }),
        floatingDamages.map((d) => /* @__PURE__ */ jsxDEV("div", { className: `damage-popup dmg-${d.type}`, children: [
          d.type === "heal" ? "+" : "",
          d.amount
        ] }, d.id, true, {
          fileName: "<stdin>",
          lineNumber: 588,
          columnNumber: 10
        }))
      ]
    },
    void 0,
    true,
    {
      fileName: "<stdin>",
      lineNumber: 492,
      columnNumber: 5
    }
  );
};
const TallyNumber = ({ target, duration = 1500, color }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = parseInt(target);
    if (start === end) return;
    let timer = setInterval(() => {
      start += Math.ceil(end / 30);
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, duration / 30);
    return () => clearInterval(timer);
  }, [target]);
  return /* @__PURE__ */ jsxDEV("span", { style: { color }, children: count.toLocaleString() }, void 0, false, {
    fileName: "<stdin>",
    lineNumber: 616,
    columnNumber: 10
  });
};
const VictoryScreen = ({ combatants, rewards, onConfirm }) => {
  const [phase, setPhase] = useState(0);
  const [visibleItems, setVisibleItems] = useState([]);
  const allies = combatants.filter((c) => !c.isEnemy);
  const avgHpPercent = allies.reduce((sum, a) => sum + a.hp / a.maxHp, 0) / allies.length;
  const rankInfo = useMemo(() => {
    const score = avgHpPercent * 100;
    if (score > 98) return { letter: "SSS", color: "#fff", desc: "UNSTOPPABLE FORCE", glow: "#fff" };
    if (score > 90) return { letter: "SS", color: "#facc15", desc: "ELITE COMMANDER", glow: "#facc15" };
    if (score > 75) return { letter: "S", color: "#facc15", desc: "SUPERIOR VICTORY", glow: "#facc15" };
    if (score > 60) return { letter: "A", color: "#a855f7", desc: "EXCELLENT", glow: "#a855f7" };
    if (score > 40) return { letter: "B", color: "#60a5fa", desc: "CLEAN SWEEP", glow: "#60a5fa" };
    return { letter: "C", color: "#94a3b8", desc: "CLOSE CALL", glow: "#94a3b8" };
  }, [avgHpPercent]);
  // BATTLE REPORT: per-ally damage/healing/best-hit totals were tracked live
  // during combat (attacker._battleDamage / _battleBestHit / _battleHealing).
  // Sort once here so the lineup and highlight cards agree on who did what.
  const report = useMemo(() => {
    const sorted = allies.slice().sort((a, b) => (b._battleDamage || 0) - (a._battleDamage || 0));
    const topDamage = sorted[0];
    const bestHitUnit = allies.slice().sort((a, b) => (b._battleBestHit || 0) - (a._battleBestHit || 0))[0];
    const topHealer = allies.slice().sort((a, b) => (b._battleHealing || 0) - (a._battleHealing || 0))[0];
    const totalTeamDamage = allies.reduce((s, a) => s + (a._battleDamage || 0), 0);
    return {
      sorted,
      mvp: topDamage && topDamage._battleDamage > 0 ? topDamage : allies.filter((a) => !a.dead).sort((a, b) => b.hp - a.hp)[0] || allies[0],
      bestHitUnit: bestHitUnit && bestHitUnit._battleBestHit > 0 ? bestHitUnit : null,
      topHealer: topHealer && topHealer._battleHealing > 0 ? topHealer : null,
      totalTeamDamage
    };
  }, [allies]);
  const pendingTimeouts = useRef([]);
  useEffect(() => {
    playSound("victory_fanfare", 0.8);
    playSound("mugen_victory_voice", 0.5);
    const t1 = setTimeout(() => {
      setPhase(1);
      playSound("intro_boom", 0.6);
    }, 1200);
    const t2 = setTimeout(() => {
      setPhase(2);
      playSound("reward_tally", 0.3);
    }, 2400);
    const t3 = setTimeout(() => {
      setPhase(3);
      playSound("reward_tally", 0.4);
    }, 3700);
    const t4 = setTimeout(() => {
      setPhase(4);
    }, 5200);
    const t5 = setTimeout(() => {
      setPhase(5);
    }, 6700);
    pendingTimeouts.current = [t1, t2, t3, t4, t5];
    return () => {
      pendingTimeouts.current.forEach(clearTimeout);
    };
  }, []);
  useEffect(() => {
    if (phase === 4 && rewards.items && rewards.items.length > 0) {
      rewards.items.forEach((item, i) => {
        const t = setTimeout(() => {
          setVisibleItems((prev) => [...prev, item]);
          playSound("item_pop", 0.3);
        }, i * 250);
        pendingTimeouts.current.push(t);
      });
    }
  }, [phase, rewards.items]);
  // SKIP: an impatient/repeat player can jump straight to the confirm button
  // instead of sitting through ~6.7s of staged reveals every single battle.
  // Cancels every still-pending timeout and instantly reveals everything
  // that timeout chain would have shown (loot items included).
  const skipToEnd = () => {
    pendingTimeouts.current.forEach(clearTimeout);
    pendingTimeouts.current = [];
    if (rewards.items && rewards.items.length > 0) setVisibleItems(rewards.items);
    setPhase(5);
    playSound("ui_select", 0.3);
  };
  const mvp = report.mvp;
  const renderSquadReport = () => {
    const h = React.createElement;
    return h("div", { className: "victory-squad-report animate-fadeIn" },
      // Full squad lineup: every ally who fought, ranked by damage dealt, with
      // a post-battle HP bar and a crown on whoever tops the report.
      h("div", { className: "vic-squad-row" },
        report.sorted.map((a, i) => {
          const hpPct = Math.max(0, a.hp / a.maxHp * 100);
          const isTop = a === report.mvp && a._battleDamage > 0;
          return h("div", { key: a.id || i, className: `vic-squad-card ${a.dead ? "ko" : ""} ${isTop ? "top" : ""}`, style: { animationDelay: `${i * 0.08}s` } },
            isTop && h("div", { className: "vic-squad-crown" }, "★ MVP"),
            h("img", { src: a.img, className: "vic-squad-img" }),
            a.dead && h("div", { className: "vic-squad-ko" }, "KO"),
            h("div", { className: "vic-squad-hpbar" }, h("div", { className: "vic-squad-hpfill", style: { width: `${hpPct}%`, background: hpPct > 60 ? "#22c55e" : hpPct > 25 ? "#facc15" : "#ef4444" } })),
            h("div", { className: "vic-squad-name" }, String(a.name || "").split(" ")[0]),
            h("div", { className: "vic-squad-dmg" }, a._battleDamage ? a._battleDamage.toLocaleString() + " DMG" : "—")
          );
        })
      ),
      // Highlight cards: MVP total damage, biggest single hit, top healer (if any).
      h("div", { className: "vic-highlight-row" },
        h("div", { className: "vic-highlight-card", style: { "--hl-color": rankInfo.color } },
          h("div", { className: "vic-highlight-label" }, "TEAM DAMAGE"),
          h("div", { className: "vic-highlight-val" }, h(TallyNumber, { target: report.totalTeamDamage, color: "#fff" }))
        ),
        report.bestHitUnit && h("div", { className: "vic-highlight-card", style: { "--hl-color": "#ef4444" } },
          h("div", { className: "vic-highlight-label" }, "BIGGEST HIT"),
          h("div", { className: "vic-highlight-val" }, h(TallyNumber, { target: report.bestHitUnit._battleBestHit, color: "#ef4444" })),
          h("div", { className: "vic-highlight-sub" }, String(report.bestHitUnit.name || "").split(" ")[0])
        ),
        report.topHealer && h("div", { className: "vic-highlight-card", style: { "--hl-color": "#4ade80" } },
          h("div", { className: "vic-highlight-label" }, "TOP HEALER"),
          h("div", { className: "vic-highlight-val" }, h(TallyNumber, { target: report.topHealer._battleHealing, color: "#4ade80" })),
          h("div", { className: "vic-highlight-sub" }, String(report.topHealer.name || "").split(" ")[0])
        )
      )
    );
  };
  return /* @__PURE__ */ jsxDEV("div", { className: "battle-result-overlay", style: { background: "radial-gradient(circle at center, #1a1a2e 0%, #05050a 100%)", perspective: "1000px" }, children: [
    phase < 5 && /* @__PURE__ */ jsxDEV("button", { className: "vic-skip-btn", onClick: skipToEnd, children: "SKIP >>" }, void 0, false, { fileName: "<stdin>", lineNumber: 1, columnNumber: 1 }),
    /* @__PURE__ */ jsxDEV("div", { className: "anime-speed-lines", style: { opacity: 0.2 } }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 663,
      columnNumber: 7
    }),
    /* @__PURE__ */ jsxDEV("div", { className: "victory-particles-container", children: Array.from({ length: 20 }).map((_, i) => /* @__PURE__ */ jsxDEV("div", { className: "vic-particle", style: {
      left: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 2}s`,
      background: rankInfo.color
    } }, i, false, {
      fileName: "<stdin>",
      lineNumber: 666,
      columnNumber: 12
    })) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 664,
      columnNumber: 7
    }),
    /* @__PURE__ */ jsxDEV("div", { style: { textAlign: "center", width: "100%", maxWidth: "800px", padding: "20px", zIndex: 10 }, children: [
      /* @__PURE__ */ jsxDEV("div", { className: "animate-popIn", style: { color: rankInfo.color, letterSpacing: 12, fontWeight: 900, fontSize: "1.2rem", marginBottom: 20, textShadow: `0 0 20px ${rankInfo.color}` }, children: "JOB DONE" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 676,
        columnNumber: 9
      }),
      phase >= 1 && /* @__PURE__ */ jsxDEV("div", { className: "rank-container-vic", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "rank-letter-huge", style: { color: rankInfo.color, "--rank-glow": rankInfo.glow }, children: rankInfo.letter }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 683,
          columnNumber: 17
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "rank-desc-vic animate-popIn", style: { animationDelay: "0.2s" }, children: rankInfo.desc }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 684,
          columnNumber: 17
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 682,
        columnNumber: 13
      }),
      phase >= 2 && renderSquadReport(),
      phase >= 3 && /* @__PURE__ */ jsxDEV("div", { className: "victory-content-wrap", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "rewards-grid-vic animate-popIn", children: Object.entries(rewards).map(([key, val]) => {
          if (key === "items" || val <= 0) return null;
          const icons = { credits: /* @__PURE__ */ jsxDEV(Database, { size: 16 }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 702,
            columnNumber: 44
          }), gems: /* @__PURE__ */ jsxDEV(Gem, { size: 16 }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 702,
            columnNumber: 73
          }), aura: /* @__PURE__ */ jsxDEV(Zap, { size: 16 }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 702,
            columnNumber: 97
          }), materials: /* @__PURE__ */ jsxDEV(Package, { size: 16 }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 702,
            columnNumber: 122
          }), essence: /* @__PURE__ */ jsxDEV(Star, { size: 16 }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 702,
            columnNumber: 153
          }), xp: /* @__PURE__ */ jsxDEV(Activity, { size: 16 }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 702,
            columnNumber: 176
          }) };
          const colors = { credits: "#facc15", gems: "#00d2ff", aura: "#a855f7", materials: "#94a3b8", essence: "#f97316", xp: "#f472b6" };
          return /* @__PURE__ */ jsxDEV("div", { className: "reward-stat-card-vic", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "reward-icon-vic", style: { color: colors[key] }, children: icons[key] }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 706,
              columnNumber: 24
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "reward-label-vic", children: key.toUpperCase() }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 707,
              columnNumber: 24
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "reward-val-vic", children: [
              key === "credits" && "$",
              /* @__PURE__ */ jsxDEV(TallyNumber, { target: val, color: colors[key] }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 709,
                columnNumber: 53
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 708,
              columnNumber: 24
            })
          ] }, key, true, {
            fileName: "<stdin>",
            lineNumber: 705,
            columnNumber: 21
          });
        }) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 699,
          columnNumber: 14
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 690,
        columnNumber: 11
      }),
      phase >= 4 && rewards.items && rewards.items.length > 0 && /* @__PURE__ */ jsxDEV("div", { className: "victory-items-reveal animate-fadeIn", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "reward-header-vic", children: "LOOT ACQUIRED" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 721,
          columnNumber: 14
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "vic-items-grid", children: visibleItems.map((item, i) => /* @__PURE__ */ jsxDEV("div", { className: "vic-item-card animate-reward-pop", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "vic-item-icon", children: /* @__PURE__ */ jsxDEV(Package, { size: 20, color: "#facc15" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 725,
            columnNumber: 53
          }) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 725,
            columnNumber: 22
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "vic-item-name", children: item }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 726,
            columnNumber: 22
          })
        ] }, i, true, {
          fileName: "<stdin>",
          lineNumber: 724,
          columnNumber: 19
        })) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 722,
          columnNumber: 14
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 720,
        columnNumber: 11
      }),
      phase >= 5 && /* @__PURE__ */ jsxDEV("button", { className: "confirm-vic-btn animate-popIn", onClick: onConfirm, children: [
        /* @__PURE__ */ jsxDEV("div", { className: "btn-inner", children: "RETURN TO BASE" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 736,
          columnNumber: 13
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "btn-shine" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 737,
          columnNumber: 13
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 735,
        columnNumber: 11
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 674,
      columnNumber: 7
    })
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 662,
    columnNumber: 5
  });
};
const SquadBuilderModal = ({
  characters,
  unlockedIds,
  squadIds,
  setSquadIds,
  cameoId = null,
  setCameoId = () => {},
  onClose,
  playSound: playSound2,
  createFloatingText,
  skills,
  favorites = [],
  filter = null,
  auraUpgrades = {}
}) => {
  const [rosterSearch, setRosterSearch] = useState("");
  const [rosterSort, setRosterSort] = useState("power");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [rosterElementFilter, setRosterElementFilter] = useState("All");
  // Max squad size can be constrained per-mode (e.g. Arena is strictly 3v3).
  const maxSquad = (filter && filter.maxSquad) || 5;
  // If we opened with a tighter cap than the current squad, trim the overflow so
  // the player never carries a 5-slot squad into a 3-slot mode.
  useEffect(() => {
    if (squadIds.length > maxSquad) setSquadIds(squadIds.slice(0, maxSquad));
  }, [maxSquad]);
  const overlayRef = useRef(null);
  const headerRef = useRef(null);
  useEffect(() => {
    if (!overlayRef.current) return;
    gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: "power1.out" });
    if (headerRef.current) {
      gsap.fromTo(
        headerRef.current,
        { y: -40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "back.out(1.7)" }
      );
    }
  }, []);
  const processRoster = () => {
    let list = characters.filter((c) => unlockedIds.map(String).includes(String(c.export_id)));
    if (filter) {
      list = list.map((c) => {
        let allowed = true;
        if (filter.isWildcard) {
          const counts = characters.reduce((m, char) => {
            const f = char.franchise || "Minor";
            m[f] = (m[f] || 0) + 1;
            return m;
          }, {});
          if (c.franchise && (counts[c.franchise] || 0) >= 3) allowed = false;
        } else if (filter.franchise) {
          const cFranchise = String(c.franchise || "").toLowerCase().trim();
          const reqFranchise = String(filter.franchise).toLowerCase().trim();
          if (cFranchise !== reqFranchise && !cFranchise.includes(reqFranchise)) allowed = false;
        } else if (filter.element && String(c.element) !== String(filter.element)) allowed = false;
        return { ...c, _restricted: !allowed };
      });
    }
    if (favoritesOnly) list = list.filter((c) => favorites.includes(c.export_id));
    if (rosterElementFilter !== "All") list = list.filter((c) => c.element === rosterElementFilter);
    if (rosterSearch) {
      // Search matches name, franchise, element, equipped skill names, and skill tags
      // (e.g. "AOE", "HEALER", "SHIELD", "STUN") so squads can be built around mechanics.
      const q = rosterSearch.toLowerCase();
      list = list.filter((c) => {
        if (c.name.toLowerCase().includes(q)) return true;
        if (String(c.franchise || "").toLowerCase().includes(q)) return true;
        if (String(c.element || "").toLowerCase().includes(q)) return true;
        const equipped = [c.skillId, c.skillId2].filter(Boolean)
          .map((id) => (skills || []).find((s) => s.id === id)).filter(Boolean);
        return equipped.some((s) =>
          s.name.toLowerCase().includes(q) ||
          getSkillTags(s).some((t) => t.toLowerCase().includes(q))
        );
      });
    }
    list.sort((a, b) => {
      if (a._restricted !== b._restricted) return a._restricted ? 1 : -1;
      if (rosterSort === "power") {
        const pwrA = calculateSubStat(a, characters, "pwr", skills, auraUpgrades);
        const pwrB = calculateSubStat(b, characters, "pwr", skills, auraUpgrades);
        return pwrB - pwrA;
      }
      if (rosterSort === "level") return b.level - a.level;
      if (rosterSort === "rarity") {
        const tiers = { "SS": 6, "S+": 5, "S": 4, "A": 3, "B": 2, "C": 1 };
        return (tiers[b.tier] || 0) - (tiers[a.tier] || 0);
      }
      return a.name.localeCompare(b.name);
    });
    return list;
  };
  const visibleRoster = useMemo(processRoster, [characters, unlockedIds, filter, favoritesOnly, rosterElementFilter, rosterSearch, rosterSort, skills, auraUpgrades]);
  // Cameo/guest summon: only heroes with an UNLOCKED signature are eligible. The
  // guest never joins the squad -- they flash in mid-battle to fire that signature.
  const sigForChar = (c) => (skills || []).find((s) => s.signature && s.owner === c.name);
  const cameoEligible = useMemo(() => (characters || []).filter((c) => {
    if (!unlockedIds.map(String).includes(String(c.export_id))) return false;
    const sig = sigForChar(c);
    return sig && (c.signatureUnlocked || (c.abilityLevels && c.abilityLevels[sig.id]));
  }), [characters, unlockedIds, skills]);
  const cameoChar = cameoId ? characters.find((c) => String(c.export_id) === String(cameoId)) : null;
  const cameoSig = cameoChar ? sigForChar(cameoChar) : null;
  const h = React.createElement;
  const cameoBlock = h("div", { key: "cameo-slot", className: "vanguard-slot-2007", style: { marginTop: 10, padding: 10, border: "1px dashed rgba(0,210,255,0.45)", borderRadius: 12, background: "rgba(0,210,255,0.04)" } }, [
    h("div", { key: "hd", style: { fontSize: "0.6rem", color: "#00d2ff", fontWeight: 900, letterSpacing: 1, marginBottom: 6 } }, "★ GUEST SUMMON — flashes in to cast their signature (2 uses · 60s)"),
    h("div", { key: "row", style: { display: "flex", alignItems: "center", gap: 10 } }, [
      cameoChar ? h("img", { key: "img", src: cameoChar.imageUrl, style: { width: 42, height: 42, borderRadius: 6, border: "2px solid #00d2ff", flexShrink: 0 } }) : null,
      h("div", { key: "info", style: { flex: 1, minWidth: 0 } }, [
        h("select", {
          key: "sel",
          className: "search-bar",
          style: { width: "100%", margin: 0, height: 34, fontSize: "0.8rem", background: "#111", border: "1px solid #00d2ff55" },
          value: cameoId ? String(cameoId) : "",
          onChange: (e) => { setCameoId(e.target.value || null); playSound2("menu_click", 0.2); }
        }, [
          h("option", { key: "none", value: "" }, cameoEligible.length ? "— No guest —" : "— No unlocked signatures yet —"),
          ...cameoEligible.map((c) => { const s = sigForChar(c); return h("option", { key: c.export_id, value: String(c.export_id) }, c.name + (s ? " — " + s.name : "")); })
        ]),
        cameoSig ? h("div", { key: "sig", style: { fontSize: "0.6rem", color: "#94a3b8", marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, "Uses YOUR squad's stats · " + cameoSig.name) : null
      ])
    ])
  ]);
  const totalSquadPWR = useMemo(() => squadIds.reduce((sum, id) => {
    const c = characters.find((h) => String(h.export_id) === String(id));
    return sum + (c ? calculateSubStat(c, characters, "pwr", skills, auraUpgrades) : 0);
  }, 0), [squadIds, characters, skills, auraUpgrades]);
  const leaderChar = squadIds[0] ? characters.find((c) => String(c.export_id) === String(squadIds[0])) : null;
  const leaderSkill = leaderChar ? LEADER_SKILLS.find((ls) => ls.id === leaderChar.leaderSkillId) : null;
  const toggleSquadMember = (rawId, isRestricted) => {
    if (isRestricted) {
      playSound2("error");
      createFloatingText("Unit Incompatible with Mission Protocol", true);
      return;
    }
    const id = String(rawId);
    setSquadIds((prev) => {
      const prevStr = prev.map((x) => String(x));
      if (prevStr.includes(id)) {
        playSound2("ui_cancel", 0.3);
        return prev.filter((x) => String(x) !== id);
      }
      if (prev.length >= maxSquad) {
        playSound2("ui_cancel", 0.5);
        createFloatingText(`Squad full (${maxSquad})!`, true);
        return prev;
      }
      playSound2("equip", 0.4);
      return [...prev, id];
    });
  };
  const promoteToLeader = (rawId) => {
    const id = String(rawId);
    setSquadIds((prev) => {
      const filtered = prev.filter((x) => String(x) !== id);
      return [id, ...filtered];
    });
    playSound2("equip", 0.5);
    createFloatingText("New Leader Assigned", false, "#facc15");
  };
  const autoFillSquad = () => {
    const candidates = visibleRoster.filter((c) => !c._restricted).slice(0, maxSquad).map((c) => c.export_id);
    if (candidates.length === 0) {
      createFloatingText("No eligible units found", true);
      return;
    }
    setSquadIds(candidates);
    playSound2("equip");
    createFloatingText("Squad Optimized", false, "#4ade80");
  };
  return /* @__PURE__ */ jsxDEV("div", { ref: overlayRef, className: "squad-builder-overlay", children: [
    /* @__PURE__ */ jsxDEV("div", { ref: headerRef, className: "vanguard-glass-header", children: [
      /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", alignItems: "center", gap: 15 }, children: [
        /* @__PURE__ */ jsxDEV("div", { style: { background: filter ? "#ef4444" : "var(--primary)", padding: "8px", borderRadius: "8px", boxShadow: filter ? "0 0 15px #ef4444" : "0 0 15px var(--primary)" }, children: /* @__PURE__ */ jsxDEV(Users, { size: 24, color: "#fff" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 859,
          columnNumber: 17
        }) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 858,
          columnNumber: 13
        }),
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("h2", { style: { margin: 0, fontFamily: "Rajdhani", fontWeight: 900, fontSize: "1.8rem", letterSpacing: 2, textTransform: "uppercase", color: "#fff" }, children: filter ? "MEMBERS ONLY" : "YOUR CREW" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 862,
            columnNumber: 17
          }),
          /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.7rem", color: "#94a3b8", letterSpacing: 1 }, children: filter ? "MISSION PARAMETERS ACTIVE" : "STANDARD OPERATING PROCEDURE" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 865,
            columnNumber: 17
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 861,
          columnNumber: 13
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 857,
        columnNumber: 10
      }),
      /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", gap: 10 }, children: [
        /* @__PURE__ */ jsxDEV("button", { className: "glossy-btn-blue", style: { padding: "8px 16px", fontSize: "0.8rem" }, onClick: autoFillSquad, children: "AUTO FILL" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 871,
          columnNumber: 13
        }),
        /* @__PURE__ */ jsxDEV("button", { className: "glossy-btn-blue", style: { padding: "8px 16px", fontSize: "0.8rem", background: "#ef4444", borderColor: "#991b1b", boxShadow: "0 4px 0 #7f1d1d" }, onClick: () => setSquadIds([]), children: "CLEAR" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 872,
          columnNumber: 13
        }),
        /* @__PURE__ */ jsxDEV("button", { className: "glossy-btn-blue", style: { padding: "8px 16px", fontSize: "0.8rem", background: "#334155", borderColor: "#1e293b", boxShadow: "0 4px 0 #0f172a" }, onClick: onClose, children: /* @__PURE__ */ jsxDEV(X, { size: 16 }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 873,
          columnNumber: 194
        }) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 873,
          columnNumber: 13
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 870,
        columnNumber: 10
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 856,
      columnNumber: 7
    }),
    /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", flex: 1, overflow: "hidden", gap: 20, padding: 20 }, children: [
      /* @__PURE__ */ jsxDEV("div", { style: { width: "320px", display: "flex", flexDirection: "column", gap: 15 }, children: [
        /* @__PURE__ */ jsxDEV("div", { className: "glass-panel", style: { padding: 15, background: "rgba(0,0,0,0.4)" }, children: [
          /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }, children: [
            /* @__PURE__ */ jsxDEV("span", { style: { fontSize: "0.7rem", fontWeight: 900, color: "#94a3b8" }, children: "TOTAL POWER" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 883,
              columnNumber: 21
            }),
            /* @__PURE__ */ jsxDEV("span", { className: "pwr-val-endgame", style: { fontSize: "1.4rem" }, children: formatPower(totalSquadPWR) }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 884,
              columnNumber: 21
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 882,
            columnNumber: 17
          }),
          leaderChar && /* @__PURE__ */ jsxDEV("div", { style: { background: "rgba(250, 204, 21, 0.1)", border: "1px solid rgba(250, 204, 21, 0.3)", padding: 8, borderRadius: 8 }, children: [
            /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.6rem", color: "#facc15", fontWeight: 900 }, children: "ACTIVE RESONANCE" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 888,
              columnNumber: 25
            }),
            /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.8rem", color: "#fff", fontWeight: 700 }, children: leaderSkill?.name }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 889,
              columnNumber: 25
            }),
            /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.6rem", color: "#ccc" }, children: leaderSkill?.desc }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 890,
              columnNumber: 25
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 887,
            columnNumber: 21
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 881,
          columnNumber: 13
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "custom-scroll", style: { flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, paddingRight: 5 }, children: Array.from({ length: maxSquad }).map((_, i) => {
          const heroId = squadIds[i];
          const c = heroId ? characters.find((h) => String(h.export_id) === String(heroId)) : null;
          const isLeaderSlot = i === 0;
          return /* @__PURE__ */ jsxDEV("div", { className: `vanguard-slot-2007 ${isLeaderSlot && c ? "active-leader" : ""}`, style: { padding: 10, display: "flex", alignItems: "center", gap: 10, minHeight: 70 }, children: [
            /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "1.2rem", fontWeight: 900, color: "rgba(255,255,255,0.1)", width: 20, textAlign: "center" }, children: isLeaderSlot ? /* @__PURE__ */ jsxDEV(Crown, { size: 16, color: "#facc15" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 905,
              columnNumber: 49
            }) : i + 1 }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 904,
              columnNumber: 29
            }),
            c ? /* @__PURE__ */ jsxDEV(Fragment, { children: [
              /* @__PURE__ */ jsxDEV("img", { src: c.imageUrl, style: { width: 48, height: 48, borderRadius: 6, border: `2px solid ${ELEMENTS[c.element].color}` } }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 910,
                columnNumber: 37
              }),
              /* @__PURE__ */ jsxDEV("div", { style: { flex: 1, overflow: "hidden" }, children: [
                /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.85rem", fontWeight: 900, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }, children: c.name }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 912,
                  columnNumber: 41
                }),
                /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.65rem", color: ELEMENTS[c.element].color, fontWeight: 800 }, children: [
                  c.element,
                  " \u2022 PWR ",
                  formatPower(calculateSubStat(c, characters, "pwr", skills, auraUpgrades))
                ] }, void 0, true, {
                  fileName: "<stdin>",
                  lineNumber: 913,
                  columnNumber: 41
                })
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 911,
                columnNumber: 37
              }),
              /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", flexDirection: "column", gap: 4 }, children: [
                !isLeaderSlot && /* @__PURE__ */ jsxDEV("button", { className: "sb-icon-btn", style: { width: 24, height: 24 }, onClick: () => promoteToLeader(c.export_id), children: /* @__PURE__ */ jsxDEV(ArrowUpCircle, { size: 14 }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 916,
                  columnNumber: 170
                }) }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 916,
                  columnNumber: 59
                }),
                /* @__PURE__ */ jsxDEV("button", { className: "sb-icon-btn", style: { width: 24, height: 24, background: "#ef4444" }, onClick: () => toggleSquadMember(c.export_id), children: /* @__PURE__ */ jsxDEV(X, { size: 14 }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 917,
                  columnNumber: 177
                }) }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 917,
                  columnNumber: 41
                })
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 915,
                columnNumber: 37
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 909,
              columnNumber: 33
            }) : /* @__PURE__ */ jsxDEV("div", { style: { flex: 1, textAlign: "center", fontSize: "0.7rem", color: "#555", fontWeight: 800, letterSpacing: 1 }, children: isLeaderSlot ? "ASSIGN LEADER" : "EMPTY SLOT" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 921,
              columnNumber: 33
            })
          ] }, i, true, {
            fileName: "<stdin>",
            lineNumber: 903,
            columnNumber: 25
          });
        }) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 896,
          columnNumber: 13
        }),
        cameoBlock
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 879,
        columnNumber: 10
      }),
      /* @__PURE__ */ jsxDEV("div", { style: { flex: 1, display: "flex", flexDirection: "column", background: "rgba(0,0,0,0.3)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.05)", overflow: "hidden" }, children: [
        /* @__PURE__ */ jsxDEV("div", { style: { padding: 15, background: "rgba(0,0,0,0.4)", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", gap: 10, alignItems: "center" }, children: [
          /* @__PURE__ */ jsxDEV(
            "input",
            {
              className: "search-bar",
              style: { margin: 0, height: 36, fontSize: "0.8rem", background: "#111", border: "1px solid #333" },
              placeholder: "Search name / skill / tag (AOE, HEALER, STUN...)",
              value: rosterSearch,
              onChange: (e) => setRosterSearch(e.target.value)
            },
            void 0,
            false,
            {
              fileName: "<stdin>",
              lineNumber: 935,
              columnNumber: 17
            }
          ),
          /* @__PURE__ */ jsxDEV(
            "select",
            {
              className: "search-bar",
              style: { width: 120, margin: 0, height: 36, fontSize: "0.8rem", background: "#111", border: "1px solid #333" },
              value: rosterSort,
              onChange: (e) => setRosterSort(e.target.value),
              children: [
                /* @__PURE__ */ jsxDEV("option", { value: "power", children: "Power" }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 948,
                  columnNumber: 21
                }),
                /* @__PURE__ */ jsxDEV("option", { value: "level", children: "Level" }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 949,
                  columnNumber: 21
                }),
                /* @__PURE__ */ jsxDEV("option", { value: "rarity", children: "Rarity" }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 950,
                  columnNumber: 21
                }),
                /* @__PURE__ */ jsxDEV("option", { value: "name", children: "Name" }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 951,
                  columnNumber: 21
                })
              ]
            },
            void 0,
            true,
            {
              fileName: "<stdin>",
              lineNumber: 942,
              columnNumber: 17
            }
          ),
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              className: `sb-chip ${favoritesOnly ? "active" : ""}`,
              style: { height: 36, display: "flex", alignItems: "center" },
              onClick: () => setFavoritesOnly(!favoritesOnly),
              children: /* @__PURE__ */ jsxDEV(Heart, { size: 14, fill: favoritesOnly ? "currentColor" : "none" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 958,
                columnNumber: 21
              })
            },
            void 0,
            false,
            {
              fileName: "<stdin>",
              lineNumber: 953,
              columnNumber: 17
            }
          )
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 934,
          columnNumber: 13
        }),
        /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", gap: 6, flexWrap: "wrap", padding: "8px 15px", background: "rgba(0,0,0,0.3)", borderBottom: "1px solid rgba(255,255,255,0.05)" }, children: ["AOE", "HEALER", "SUPPORT", "SHIELD", "CONTROL", "DOT", "NUKE", "LIFESTEAL", "SIGNATURE"].map((t) => /* @__PURE__ */ jsxDEV(
          "button",
          {
            className: `sb-chip ${rosterSearch.toUpperCase() === t ? "active" : ""}`,
            style: { fontSize: "0.6rem", padding: "3px 9px" },
            onClick: () => setRosterSearch(rosterSearch.toUpperCase() === t ? "" : t),
            children: t
          },
          t,
          false,
          { fileName: "<stdin>", lineNumber: 1, columnNumber: 1 }
        )) }, void 0, false, { fileName: "<stdin>", lineNumber: 1, columnNumber: 1 }),
        filter && /* @__PURE__ */ jsxDEV("div", { style: { background: "rgba(239, 68, 68, 0.1)", padding: "8px 15px", borderBottom: "1px solid #ef444444", display: "flex", alignItems: "center", gap: 10 }, children: [
          /* @__PURE__ */ jsxDEV(Ban, { size: 14, color: "#ef4444" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 965,
            columnNumber: 21
          }),
          /* @__PURE__ */ jsxDEV("span", { style: { fontSize: "0.7rem", color: "#ef4444", fontWeight: 900 }, children: "RESTRICTED: " }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 966,
            columnNumber: 21
          }),
          /* @__PURE__ */ jsxDEV("span", { style: { fontSize: "0.7rem", color: "#fff" }, children: filter.franchise ? `Must be ${filter.franchise}` : filter.element ? `Must be ${filter.element}` : `Must be Minor Franchise` }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 967,
            columnNumber: 21
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 964,
          columnNumber: 17
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "sb-roster-grid custom-scroll", style: { padding: 10, gap: 8, background: "#08080a" }, children: visibleRoster.map((c) => {
          const isSelected = squadIds.map(String).includes(String(c.export_id));
          const isRestricted = !!c._restricted;
          return /* @__PURE__ */ jsxDEV(
            "div",
            {
              className: `sb-hero-row-card ${isSelected ? "selected" : ""} ${isRestricted ? "restricted" : ""}`,
              style: {
                height: 50,
                borderRadius: 8,
                background: isSelected ? "linear-gradient(90deg, rgba(255,0,127,0.14), rgba(0,210,255,0.1))" : "rgba(255,255,255,0.03)",
                borderColor: isSelected ? "#00d2ff" : "transparent",
                boxShadow: isSelected ? "0 0 10px rgba(0,210,255,0.3)" : "none",
                opacity: isRestricted ? 0.4 : 1
              },
              onClick: () => toggleSquadMember(c.export_id, isRestricted),
              children: [
                /* @__PURE__ */ jsxDEV("img", { src: c.imageUrl, style: { width: 36, height: 36, borderRadius: 6, objectFit: "cover" } }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 992,
                  columnNumber: 29
                }),
                /* @__PURE__ */ jsxDEV("div", { style: { flex: 1, overflow: "hidden", paddingLeft: 8 }, children: [
                  /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.8rem", fontWeight: 900, color: isSelected ? "#00d2ff" : isRestricted ? "#ef4444" : "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }, children: c.name }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 994,
                    columnNumber: 33
                  }),
                  /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.6rem", color: "#888" }, children: [
                    "PWR ",
                    formatPower(calculateSubStat(c, characters, "pwr", skills, auraUpgrades)),
                    " \u2022 ",
                    c.element
                  ] }, void 0, true, {
                    fileName: "<stdin>",
                    lineNumber: 995,
                    columnNumber: 33
                  })
                ] }, void 0, true, {
                  fileName: "<stdin>",
                  lineNumber: 993,
                  columnNumber: 29
                }),
                isSelected && /* @__PURE__ */ jsxDEV("div", { style: { color: "#00d2ff", fontWeight: 900, fontSize: "0.7rem", textShadow: "0 0 6px rgba(0,210,255,0.8)" }, children: "ACTIVE" }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 999,
                  columnNumber: 44
                }),
                isRestricted && /* @__PURE__ */ jsxDEV(Ban, { size: 14, color: "#ef4444" }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 1e3,
                  columnNumber: 46
                })
              ]
            },
            c.export_id,
            true,
            {
              fileName: "<stdin>",
              lineNumber: 980,
              columnNumber: 25
            }
          );
        }) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 974,
          columnNumber: 13
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 932,
        columnNumber: 10
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 877,
      columnNumber: 7
    }),
    /* @__PURE__ */ jsxDEV("div", { style: { padding: "15px 20px", background: "rgba(0,0,0,0.6)", borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", justifyContent: "center" }, children: /* @__PURE__ */ jsxDEV("button", { className: "glossy-btn-green", style: { width: 300, padding: "14px", fontSize: "1rem", letterSpacing: 2, textTransform: "uppercase" }, onClick: onClose, children: "CONFIRM CONFIGURATION" }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 1009,
      columnNumber: 10
    }) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 1008,
      columnNumber: 7
    })
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 854,
    columnNumber: 5
  });
};
export {
  BattleUnit,
  ProjectileLayer,
  SquadBuilderModal,
  TacticalStanceRow,
  VictoryScreen,
  executeCombatSkill,
  getBattleStats,
  applyStatusTick,
  resolveBasicAttack,
  getCastAnimMs,
  getLungeMs,
  getBasicAttackMs,
  HITSTOP_BUFFER_MS
};
