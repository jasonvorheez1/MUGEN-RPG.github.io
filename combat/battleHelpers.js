// Split out of CombatSystem.js (token-efficiency pass): stat computation,
// cast-animation timing, hit-stun, status-effect description/ticking, and
// shields. These are the shared low-level helpers that both resolution.js
// (resolveBasicAttack/executeCombatSkill) and battleUI.js (BattleUnit) build
// on top of. CombatSystem.js re-exports everything here unchanged, so no
// other file's import statements needed to change.
import { getSpeedScore, getDefenseScore, getGearPassives, applyMitigation } from "../utils.js";

const getBattleStats = (unit, playerElement, activeSynergies = []) => {
  if (!unit) return { hp: 0, atk: 0, def: 0, speed: 0, magicAtk: 0, magicDef: 0, critRate: 0.05, evasion: 0.05, lifesteal: 0, luck: 0, technique: 0, blockChance: 0.03 };
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
  // TECHNIQUE: unbuffed in v1 (no status effect currently targets it) -- just
  // carried through from the combatant so executeCombatSkill's ability-power
  // bonus reads a real number. See utils.js calculateSubStat 'technique' case.
  const technique = unit.technique || 0;
  const effects = unit.effects || [];
  // CREW CHEMISTRY -- deliberately tracked outside the multiplicative buff
  // loop below (see application after the loop). Every OTHER buff here
  // (buff_atk, overheat, buff_elemdmg...) applies via `*=` inside this same
  // forEach, so a unit already carrying several of its own kit's ATK buffs
  // gets crew chemistry's % applied on top of THEIR ALREADY-INFLATED stat --
  // physical/ATK-stacking kits are simply more common than magic ones, so
  // that compounding made physical squads disproportionately stronger from
  // the same nominal buff. Applying it as a flat bonus on the unit's BASE
  // stat instead (once, after every other multiplier) gives every squad the
  // identical relative uplift regardless of how buff-stacked it already is.
  let crewSynergyVal = 0;
  effects.forEach((eff) => {
    if (eff.type === "crew_synergy") crewSynergyVal = Math.max(crewSynergyVal, eff.val || 0);
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
    if (eff.type === "buff_evasion") evasion += eff.val;
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
  if (crewSynergyVal) {
    atk += (unit.atk || 0) * crewSynergyVal;
    magicAtk += (unit.magicAtk || 0) * crewSynergyVal;
    def += (unit.def || 0) * crewSynergyVal * 0.8;
    magicDef += (unit.magicDef || 0) * crewSynergyVal * 0.8;
  }
  // BLOCK: defense's proactive counterpart to how speed feeds crit_rate/evasion.
  // Computed from the FINAL, post-buff def/magicDef (not a precomputed roster
  // stat) so it reacts live to fortify/crushed/debuff_def etc mid-fight, unlike
  // crit_rate/evasion which are locked in at squad-build time. On trigger, a
  // landed hit takes an extra cut on top of normal mitigation (see resolution.js)
  // -- a separate, proactive payoff for investing in defense rather than only
  // ever shaving the incoming number passively.
  const blockChance = Math.min(0.35, 0.03 + getDefenseScore((def + magicDef) / 2) * 0.02);
  return { hp: maxHp, atk, def, speed, magicAtk, magicDef, critRate, evasion, lifesteal, luck, technique, blockChance };
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
  // Unblockable/unavoidable multi-star AOE bombardments (PK Starstorm and
  // anything cut from the same cloth) get their own dedicated read -- a
  // longer, multi-pulse "several things are landing, not one" cast rather
  // than the single-swell cast-starfall or single-target cast-crescendo.
  if (/star ?storm|meteor shower|rain of stars|falling stars|shower of/i.test(txt)) return "cast-starstorm";
  // Sustained-line attacks (a held beam/laser/ray, not a single thrown bolt)
  // get their own read -- a longer charge-then-hold-the-line motion, distinct
  // from cast-pierce's quick single lunge-thrust.
  if (/\bbeam\b|laser|\bray\b|death ?ray/i.test(txt)) return "cast-beam";
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
  "cast-crescendo": 1800, "cast-thunder": 1550,
  // --- Batch 2 (anime-flavored, condition/description-driven picks) ---
  "cast-comet": 1550, "cast-mirage": 1400, "cast-bloom": 1600, "cast-shatter": 1500,
  "cast-tidal": 1650, "cast-gale": 1450, "cast-starfall": 1700, "cast-halo": 1750,
  "cast-voidrip": 1600, "cast-inferno": 1650, "cast-tremor": 1550, "cast-riposte": 1350,
  "cast-cyclone": 1500, "cast-eclipse": 1700, "cast-runway": 1600, "cast-sparkle": 1450,
  "cast-fracture": 1300, "cast-phantom": 1450, "cast-surge": 1550, "cast-finale": 2000,
  "cast-starstorm": 1900, "cast-beam": 1800
};
// Cast animations that read as "sent something at the target" rather than a
// melee lunge or a self/team buff -- these get an actual flying projectile
// (see ProjectileLayer) instead of just the caster's own wind-up motion.
const RANGED_CAST_ANIMS = /* @__PURE__ */ new Set([
  "cast-arcane", "cast-charge", "cast-channel", "cast-thunder", "cast-orbit", "cast-crescendo", "cast-override", "cast-flurry", "cast-pierce",
  "cast-comet", "cast-starfall", "cast-tidal", "cast-inferno", "cast-voidrip", "cast-surge", "cast-halo", "cast-starstorm", "cast-beam"
]);
// castAnim -> playSound() key, for the small curated set of NEW anims that
// deserve a bespoke sting instead of the generic type/damageType-based pick
// (see the sound-dispatch block in each battle view's tick effect). Anything
// not listed here just falls back to that existing generic logic -- this is
// purely additive, so it can never break an old skill's sound.
const CAST_ANIM_SOUND = {
  "cast-comet": "act_jump_double", "cast-mirage": "act_ninja_swishes1", "cast-bloom": "cheer_shot1",
  "cast-shatter": "act_swipe_big1", "cast-tidal": "act_swim_return1", "cast-gale": "act_wing_flap1",
  "cast-starfall": "act_bounce_hi", "cast-halo": "snd_tuning_fork", "cast-voidrip": "act_grab_chain",
  "cast-inferno": "act_steam2", "cast-tremor": "act_pushblock", "cast-riposte": "act_double_swish2",
  "cast-cyclone": "act_twirl_pole1", "cast-eclipse": "snd_organ_so", "cast-runway": "act_skateboard_trick1",
  "cast-sparkle": "cheer_shot2", "cast-fracture": "act_swipe_double_lrg1", "cast-phantom": "act_putaway",
  "cast-surge": "act_acrobat_swipe", "cast-finale": "act_umbrella_open", "cast-starstorm": "act_camera_flash",
  "cast-beam": "act_sonic_boom"
};
// Looks up a bespoke cast sting for the newer castAnim keys; returns null for
// anything not in the curated list so callers can fall back to their own
// existing generic sound logic instead.
const getCastAnimSound = (castAnim) => CAST_ANIM_SOUND[castAnim] || null;
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
// hit or a surprise launch. `comboAmp` is an EXTRA source on top of stats --
// fed by a unit's own `combo_amp` status effects (see abilities/signatures
// that grant it) plus the caller's own hit-chain length -- so a well-played
// combo snowballs into longer, more air-heavy flurries, not just a fixed
// stat-only roll. Still fully automatic; the player never manually strings
// air combos, they just get bigger/more frequent the more a build invests in
// them. Returns { hits, air }.
const getMeleeCombo = (stats, comboAmp = 0) => {
  const spd = stats?.speed || 0;
  const luck = stats?.luck || 0;
  let hits = 2 + Math.floor(spd / 55) + Math.round(comboAmp);
  if (Math.random() < Math.min(0.35, luck / 500)) hits += 1; // lucky extra strike
  hits = Math.max(2, Math.min(8, hits));
  const air = spd >= 150 || comboAmp >= 1 || Math.random() < Math.min(0.32, luck / 650 + comboAmp * 0.08);
  return { hits, air };
};
// A per-hit sound for a basic-attack flurry: cycles through the mugen_hit
// pool so a multi-hit combo doesn't repeat the same thwack twice in a row,
// and gives the FINISHING hit its own heavier impact (slash_heavy for an air
// finisher, crit_hit on the ground) so the flurry has a real punctuation mark.
const FLURRY_HIT_SOUNDS = ["mugen_hit_a", "mugen_hit_b", "mugen_hit_c", "mugen_hit_d", "mugen_hit_e"];
const getFlurryHitSound = (hitIndex, totalHits, isAir) => {
  const isFinisher = totalHits > 1 && hitIndex === totalHits - 1;
  if (isFinisher) return isAir ? "slash_heavy" : "crit_hit";
  return FLURRY_HIT_SOUNDS[hitIndex % FLURRY_HIT_SOUNDS.length];
};
// HIT-STUN -- the actual fighting-game mechanic that makes combos POSSIBLE:
// landing a hit locks the victim out of acting for a beat, so a real sequence
// of attacks reads as one unbroken combo instead of a trade. Recovery is a
// tug-of-war between the ATTACKER's speed/power and the VICTIM's own
// speed/defense: a fast, hard-hitting attacker keeps someone locked down
// noticeably longer; a fast, tanky victim shrugs a hit off almost instantly.
// `hits` (a flurry's strike count) stacks the window rather than overwriting
// it, so a real multi-hit combo can lock a target down well past what any
// single hit would buy on its own -- this is what lets combos run LONGER.
const getHitstunMs = (attackerStats, targetStats, hits = 1) => {
  const atkPower = getSpeedScore(attackerStats?.speed || 0) * 40 + (attackerStats?.atk || 0) * 0.15;
  const resilience = getSpeedScore(targetStats?.speed || 0) * 55 + (targetStats?.def || 0) * 0.2;
  const ratio = atkPower / Math.max(30, resilience);
  const perHit = Math.max(90, Math.min(260, Math.round(150 * ratio)));
  return perHit * Math.max(1, Math.min(hits, 4));
};
// Stacks (extends, never shortens) a target's stun window -- called once per
// landed hit/flurry so back-to-back attacks compound instead of resetting.
const applyHitstun = (target, ms) => {
  if (!target || !ms) return;
  target._hitstunUntil = Math.max(target._hitstunUntil || 0, Date.now() + ms);
};
// How long (ms) a cast animation plays -- null castAnim means "no bespoke
// cast," i.e. a plain basic-attack lunge, which the caller should treat with
// getLungeMs() instead.
const getCastAnimMs = (castAnim) => castAnim ? CAST_ANIM_MS[castAnim] || DEFAULT_CAST_MS : null;
const getLungeMs = (isCrit) => isCrit ? LUNGE_CRIT_MS : LUNGE_MS;
// How long a basic-attack rushdown plays (air combos run longer). Used by both
// BattleUnit (animation length) and every view's basic-attack hit-stop lock.
const getBasicAttackMs = (air) => air ? RUSH_AIR_MS : RUSH_MS;
// How fast a unit's skill cooldowns fill each tick. Baseline is >1 so abilities
// come up noticeably sooner than the old 1-per-tick (which made every skill
// feel like a long wait), and a `haste` buff (or `freeze`/slow debuff) scales
// it further -- so there are real abilities that speed up how often skills fire,
// and enemies that roll them get the same benefit.
const getCooldownGain = (unit) => {
  let g = 1.35;
  // SPEED: used to only govern turn frequency (gauge) -- two builds with
  // identical haste/gear but very different speed investment charged
  // abilities at the exact same flat rate, which made speed feel like a
  // "goes first" stat only. Give raw speed a real, capped say in ability
  // charge rate too (log-compressed like everything else that reads raw
  // speed -- see getSpeedScore), so it's a genuine passive alternative to
  // stacking haste/cdr instead of just winning the turn-order race.
  g *= 1 + Math.min(0.3, getSpeedScore(unit.speed || 0) * 0.025);
  (unit.effects || []).forEach((e) => {
    if (e.type === "haste") g *= 1 + (e.val || 0.4);
    if (e.type === "freeze") g *= 0.6;
    if (e.type === "debuff_spd") g *= 1 - Math.min(0.5, e.val || 0);
  });
  // GEAR PASSIVE -- "cdr" is a permanent, always-on version of the same lever
  // haste pulls temporarily: gear-carried ability charge speed. Unlike haste
  // (a timed status from a cast) this is always active just from having the
  // piece equipped, so it stacks additively with any live haste rather than
  // needing a status slot.
  const gearCdr = getGearPassives(unit).filter((p) => p.type === "cdr").reduce((s, p) => s + p.val, 0);
  if (gearCdr) g *= 1 + gearCdr;
  return g;
};
// Small safety margin added ONLY to the game-logic hit-stop lock (never to the
// CSS/JS visual timeout) so the lock always outlasts the animation even with
// React's render/effect scheduling lag -- otherwise a startled unit's cast can
// visually start a beat before the previous one has fully cleared.
const HITSTOP_BUFFER_MS = 150;
// Turn a raw effect into a short on-badge label + a full tooltip string so the
// player can read the board at a glance instead of decoding tiny icons. `short`
// is the value shown on the pip (kept to a few chars); `full` is the title text.
const STAT_LABELS = { buff_atk: "ATK", debuff_atk: "ATK", buff_def: "DEF", debuff_def: "DEF", buff_spd: "SPD", debuff_spd: "SPD", buff_crit: "CRIT", buff_elemdmg: "ELEM", buff_evasion: "EVA" };
export const describeEffect = (e) => {
  const t = e.type || "";
  const pct = typeof e.val === "number" && Math.abs(e.val) < 5 ? Math.round(e.val * 100) : null;
  const sign = t.startsWith("debuff") ? "-" : "+";
  if (STAT_LABELS[t]) {
    const s = `${STAT_LABELS[t]}${sign}${pct != null ? Math.abs(pct) + "%" : ""}`;
    return { short: s, full: `${e.label ? e.label + ": " : ""}${s} (${e.duration}t)` };
  }
  if (t === "copied_weapon") {
    // Copy Bot system (Mega Man) -- shows which weapon is currently copied and
    // how mastered it is (repeat copies of the same element stack a damage
    // bonus, see the copy_system hook in executeCombatSkill).
    const masteryPct = Math.round((e.val || 0) * 100);
    return { short: "COPY", full: `${e.label || "Copied Weapon"}${masteryPct > 0 ? ` (+${masteryPct}% mastery)` : ""}` };
  }
  if (t === "shield") {
    // Shield strength as % of the shielded unit's max HP -- same "worth X% max
    // HP" framing already used pre-battle in AbilitiesView, now also shown here
    // in the actual in-combat tooltip (previously just a bare "Shield" word).
    // Falls back to the authored val fraction before the pool has materialized
    // (see getShieldPool / BattleUnit's shieldHpPercent for the same fallback).
    const shPct = Number.isFinite(e.remainingHp) && e.maxHp
      ? Math.round(e.remainingHp / e.maxHp * 100)
      : Math.round(Math.min(3, Math.max(0, e.val || 0)) * 100);
    return { short: "SHLD", full: `${e.label ? e.label + ": " : ""}Shield — ${shPct}% of max HP remaining (${e.duration}t)` };
  }
  const simple = {
    regen: { short: "RGN", full: "Regen" },
    burn: { short: "BRN", full: "Burn (damage over time)" }, poison: { short: "PSN", full: "Poison (damage over time)" },
    static: { short: "STC", full: "Static" }, stun: { short: "STUN", full: "Stunned — loses its turn" },
    freeze: { short: "FRZ", full: "Frozen" }, silence: { short: "SIL", full: "Silenced — cannot use skills" },
    sleep: { short: "ZZZ", full: "Asleep — skips turns until hit hard enough to wake" },
    crushed: { short: "CRSH", full: "Crushed — takes extra damage" }, broken: { short: "BRK", full: "Broken — amplified damage" },
    phantom_veil: { short: "VEIL", full: "Extremely evasive" }, untargetable: { short: "HIDE", full: "Untargetable" },
    aggro: { short: "TAUNT", full: "Taunting" }, hidden_power: { short: "", full: "Building power" },
    tactical_stance: { short: "STANCE", full: "Tactical stance" }, elemental_insight: { short: "INSGT", full: "Elemental insight" },
    tethered: { short: "TETHR", full: "Tethered" },
    haste: { short: "HASTE", full: "Haste — skills charge faster" },
    combo_amp: { short: "COMBO↑", full: "Combo Amp — basic attacks flurry harder & launch airborne more often" },
    energized: { short: "ENRG", full: "Energized — basic attacks charge Burst faster" },
    truesight: { short: "SIGHT", full: "Truesight — attacks can't be dodged" },
    overheat: { short: "HEAT↑", full: "Overheat — physical power rising each turn" },
    precision: { short: "AIM↑", full: "Precision — crit chance rising each turn" },
    fortify: { short: "GUARD↑", full: "Fortify — defenses rising each turn" },
    charm: { short: "CHARM↑", full: "Charm — luck & crit rising each turn" },
    overclock: { short: "OC↑", full: "Overclock — magic power rising each turn" },
    crew_synergy: { short: "CREW", full: "Crew Chemistry — flat squad-wide stat bonus from bonded allies" },
    skill_surge: { short: "SURGE", full: "Skill Surge — landing basic attacks instantly charges skills" },
    momentum_surge: { short: "MMTM", full: "Momentum — basic attacks build stacks; at max, a skill instantly completes" },
    momentum_stack: { short: "MMTM+", full: "Momentum stack" },
    cut_in_armed: { short: "CUT-IN", full: "Armed — reacts automatically the next time its trigger condition happens" }
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
    target._shieldBroke = true;
    return leftover;
  }
  shield.remainingHp -= dmg;
  target._shieldHit = true;
  return 0;
};
// Push a shield effect onto `target`. A fresh shield used to silently REPLACE
// whatever shield was already up, even if the new one was weaker -- a stronger
// shield could vanish for no visible reason. Now the bigger pool wins, with a
// lastAction message either way (when an attacker/self ref is passed) so the
// player can tell what happened. Exported so player-triggered Guard actions in
// the battle views can share this exact rule instead of pushing raw effects.
export const pushShieldEffect = (target, eff, attacker = null) => {
  if (!target.effects) target.effects = [];
  const existingIdx = target.effects.findIndex((e) => e.type === "shield");
  const incoming = getShieldPool(target, { ...eff });
  if (existingIdx !== -1) {
    const existing = getShieldPool(target, target.effects[existingIdx]);
    if (existing.remainingHp >= incoming.maxHp) {
      target.effects[existingIdx].duration = Math.max(target.effects[existingIdx].duration, eff.duration);
      if (attacker) attacker.lastAction = { ...attacker.lastAction, msg: "SHIELD HELD" };
      return;
    }
    target.effects.splice(existingIdx, 1);
    if (attacker) attacker.lastAction = { ...attacker.lastAction, msg: "SHIELD UPGRADED" };
  }
  target.effects.push(incoming);
};
// CUT-IN SYSTEM: certain signatures/legendaries "arm" a standing reactive
// trigger on their caster when cast (see the `cut_in_armed` effect pushed in
// executeCombatSkill). From then on, EVERY time a matching event happens
// anywhere in the fight -- an ally basic-attacks, an ally casts a skill, an
// enemy casts a skill, or a unit gets buffed -- the armed unit reacts on its
// own with a small strike/buff/debuff and a distinct "cut-in" interrupt
// animation (BattleUnit reads `unit._cutIn`), for as long as the arm lasts
// (usually the rest of the battle). This is checked after every qualifying
// action across all three battle views, since they all funnel basic attacks
// and skills through resolveBasicAttack/executeCombatSkill.
const triggerCutIns = (combatants, eventType, sourceUnit, playerElement) => {
  if (!sourceUnit || !combatants) return;
  combatants.forEach((armed) => {
    if (!armed || armed.dead) return;
    // Self-triggering is allowed only for "ally_buffed" (a unit reacting to
    // its OWN buff) -- otherwise a unit reacting to its own basic/skill would
    // be a trivial infinite hook, not a meaningful "cut-in."
    if (armed === sourceUnit && eventType !== "ally_buffed") return;
    const arm = (armed.effects || []).find((e) => e.type === "cut_in_armed" && e.trigger === eventType);
    if (!arm) return;
    const sameSide = sourceUnit.isEnemy === armed.isEnemy;
    if (eventType.startsWith("ally_") && !sameSide) return;
    if (eventType.startsWith("enemy_") && sameSide) return;
    if (Math.random() > (arm.chance ?? 1)) return;
    if (arm.kind === "buff") {
      armed.effects.push({ type: arm.effType || "buff_atk", duration: arm.effDuration || 3, val: arm.val ?? 0.15, label: arm.effLabel || "CUT-IN" });
    } else if (arm.kind === "debuff") {
      const foes = combatants.filter((t) => t && !t.dead && t.isEnemy !== armed.isEnemy);
      const target = foes[Math.floor(Math.random() * foes.length)];
      if (target) target.effects.push({ type: arm.effType || "debuff_def", duration: arm.effDuration || 3, val: arm.val ?? 0.2, label: arm.effLabel || "CUT-IN" });
    } else {
      const foes = combatants.filter((t) => t && !t.dead && t.isEnemy !== armed.isEnemy);
      const target = foes[Math.floor(Math.random() * foes.length)];
      if (target) {
        const armedStats = getBattleStats(armed, playerElement, armed.activeSynergies || []);
        const targetStats = getBattleStats(target, playerElement, target.activeSynergies || []);
        const offense = arm.isMagic ? armedStats.magicAtk : armedStats.atk;
        const defense = arm.isMagic ? targetStats.magicDef : targetStats.def;
        let dmg = applyMitigation(Math.floor(offense * (arm.power || 0.6)), defense);
        // Same soft cap as regular hits (see executeCombatSkill) -- a reactive
        // strike is meant to add pressure over a fight, not spike a one-shot.
        const softCap = Math.floor(target.maxHp * 0.45);
        if (dmg > softCap) dmg = softCap + Math.floor((dmg - softCap) * 0.15);
        target.hp = Math.max(0, target.hp - dmg);
        if (target.hp === 0) target.dead = true;
      }
    }
    armed.lastAction = { ...armed.lastAction, msg: arm.effLabel || "CUT IN!" };
    armed._cutIn = { label: arm.label || "CUT IN!", time: Date.now() };
  });
};
// DEATH BURST: a signature can carry a death-triggered payload (meta.death_burst,
// an array of effects) that fires ONCE, automatically, the instant its owner
// dies -- independent of whether the signature was ever actually cast that
// fight. Checked at every point a unit's HP can hit zero (both resolveBasicAttack
// and executeCombatSkill's damage-application spots). Distinct from the
// signature's normal team_effects (which only apply on a live cast) so a kit
// can have a completely different, one-time "parting gift" on death.
const applyDeathBurst = (dyingUnit, allUnits, skills) => {
  if (!dyingUnit || dyingUnit._deathBurstFired) return;
  const sig = (skills || []).find((s) => s.signature && s.owner === dyingUnit.name && s.meta && Array.isArray(s.meta.death_burst));
  if (!sig) return;
  dyingUnit._deathBurstFired = true;
  const allies = (allUnits || []).filter((u) => u && !u.dead && u.id !== dyingUnit.id && u.isEnemy === dyingUnit.isEnemy);
  allies.forEach((a) => { sig.meta.death_burst.forEach((eff) => a.effects.push({ ...eff })); });
  dyingUnit.lastAction = { ...dyingUnit.lastAction, msg: sig.meta.death_burst_msg || "DEATH BURST" };
};

export {
  getBattleStats,
  applyDeathBurst,
  deriveCastAnim,
  CAST_ANIM_MS,
  RANGED_CAST_ANIMS,
  DEFAULT_CAST_MS,
  LUNGE_MS,
  LUNGE_CRIT_MS,
  RUSH_MS,
  RUSH_AIR_MS,
  getMeleeCombo,
  FLURRY_HIT_SOUNDS,
  getFlurryHitSound,
  getHitstunMs,
  applyHitstun,
  getCastAnimMs,
  getCastAnimSound,
  getLungeMs,
  getBasicAttackMs,
  getCooldownGain,
  HITSTOP_BUFFER_MS,
  applyStatusTick,
  getShieldPool,
  absorbWithShield,
  triggerCutIns
};
