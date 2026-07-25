// Split out of CombatSystem.js (token-efficiency pass): resolveBasicAttack
// (basic-attack resolution) and executeCombatSkill (the full skill/signature
// resolution engine -- dynamic archetypes, copy system, wish cycles, slot
// rolls, stage cycles, status application, damage calc). This is the single
// biggest, most central chunk of combat logic; CombatSystem.js re-exports it
// unchanged so no other file's import statements needed to change.
import { ELEMENTS } from "../constants.js";
import {
  applyMitigation,
  SIGNATURE_BONUS,
  SPECIAL_STATS,
  SPECIAL_CAP,
  getGearPassives,
  playSound
} from "../utils.js";
import {
  getBattleStats,
  deriveCastAnim,
  RANGED_CAST_ANIMS,
  getMeleeCombo,
  getHitstunMs,
  applyHitstun,
  getShieldPool,
  absorbWithShield,
  pushShieldEffect,
  triggerCutIns,
  applyDeathBurst
} from "./battleHelpers.js";

const resolveBasicAttack = ({ attacker, allUnits, playerElement, comboMult = () => 1, markedTargetId = null, comboCount = 0, skills = [] }) => {
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
  // Basic attacks were far too weak: a small base AND a punishing mitigation
  // constant (1000 vs skills' 4500) meant they chipped for almost nothing while
  // abilities did everything. Bump the base and use a milder mitigation constant
  // so basics are a real, noticeable chunk (~1/3 of a skill hit) from both sides.
  // MAGIC/PHYSICAL PARITY: basics used to ALWAYS read atk/def, full stop -- a
  // caster built entirely around magicAtk (by design, low atk) threw weak
  // basic attacks no matter what, while a physical build's basics scaled with
  // their actual investment for free. Basics now read whichever offense stat
  // the attacker actually built around (mirrors executeCombatSkill's own
  // isMagic pick), mitigated by the matching defense stat, so both archetypes'
  // basic attacks are an equally real expression of their build.
  const basicIsMagic = attackerStats.magicAtk > attackerStats.atk;
  const basicOffense = basicIsMagic ? attackerStats.magicAtk : attackerStats.atk;
  const basicDefense = basicIsMagic ? targetStats.magicDef : targetStats.def;
  let dmg = Math.floor(basicOffense * (1.35 + attackerStats.speed / 1600));
  if (!attacker.isEnemy) dmg = Math.floor(dmg * comboMult());
  const attackerElemBoost = getGearPassives(attacker).filter((p) => p.type === "elem_boost" && p.element === attacker.element).reduce((s, p) => s + p.val, 0);
  if (attackerElemBoost) dmg = Math.floor(dmg * (1 + attackerElemBoost));
  const targetElemResist = getGearPassives(target).filter((p) => p.type === "elem_resist" && p.element === attacker.element).reduce((s, p) => s + p.val, 0);
  if (targetElemResist) dmg = Math.floor(dmg * (1 - Math.min(0.8, targetElemResist)));
  const brokenEff = (target.effects || []).find((e) => e.type === "broken");
  if (brokenEff) dmg = Math.floor(dmg * (1 + (brokenEff.val || 0.5)));
  dmg = applyMitigation(dmg, basicDefense, 3000);
  // BLOCK: same proactive defense payoff as executeCombatSkill (see
  // getBattleStats) -- rolled after mitigation, before the hit reaches a shield.
  const blocked = Math.random() < (targetStats.blockChance || 0);
  if (blocked) dmg = Math.floor(dmg * 0.72);
  dmg = absorbWithShield(target, dmg);
  // Same soft cap as executeCombatSkill (see its comment) -- basics are already
  // much smaller so this rarely triggers, but keeps the ceiling consistent.
  const basicSoftCap = Math.floor(target.maxHp * 0.45);
  if (dmg > basicSoftCap) {
    const overflow = dmg - basicSoftCap;
    dmg = basicSoftCap + Math.floor(overflow * 0.15);
  }
  target.hp = Math.max(0, target.hp - dmg);
  if (target.hp === 0) {
    if (!target.isEnemy && target._leaderRevive) {
      target._leaderRevive = false;
      target.hp = 1;
    } else {
      target.dead = true;
      applyDeathBurst(target, allUnits, skills);
    }
  }
  // ENERGIZED: a reusable buff (Jim Hawkins' Solar Surfer) that pays out bonus
  // Burst every time its holder lands a basic attack, on top of the normal
  // flat gain -- "energized allies charge up faster just by fighting."
  const energizedEff = (attacker.effects || []).find((e) => e.type === "energized");
  const energizedBurst = energizedEff ? Math.round((energizedEff.val || 0) * 40) : 0;
  attacker.burst = Math.min(100, (attacker.burst || 0) + 10 + energizedBurst);
  // FIGHTING-GAME RUSHDOWN: the single damage number above is delivered as a
  // stat-driven flurry of `hits` strikes (with an optional air-combo launcher).
  // BattleUnit reads meleeHits/meleeAir off lastAction to dash + juggle; the
  // combo counter climbs by the whole flurry, and the target rattles per hit.
  // hitSplits carries the per-strike damage (summing to dmg) so the battle
  // views can pop a SEPARATE number for each hit -- it reads as a real combo
  // instead of one lump number.
  // Combo Amp: a status effect any ability/signature can grant (own stacks
  // sum) plus, for allies only, a snowball bonus off their OWN hit-chain
  // length (every 10 combo count = +1, capped +3) -- so keeping a chain alive
  // doesn't just pump damage, it grows the flurry itself.
  const comboAmpVal = (attacker.effects || []).filter((e) => e.type === "combo_amp").reduce((s, e) => s + (e.val || 0), 0)
    + (!attacker.isEnemy ? Math.min(3, Math.floor((comboCount || 0) / 10)) : 0);
  const melee = getMeleeCombo(attackerStats, comboAmpVal);
  const hits = melee.hits;
  const per = Math.max(1, Math.floor(dmg / hits));
  const hitSplits = Array.from({ length: hits }, (_, i) => i === hits - 1 ? Math.max(1, dmg - per * (hits - 1)) : per);
  const now = Date.now();
  target._comboHits = melee.hits;
  target._comboHitsTime = now; // fresh stamp so the target only rattles on THIS flurry, not a later DOT/skill drop
  // A landed flurry locks the victim's OWN gauge/action out for a stretch --
  // see getHitstunMs. This is what actually lets a rushdown chain feel like
  // one continuous combo instead of two units trading blows.
  applyHitstun(target, getHitstunMs(attackerStats, targetStats, hits));
  attacker.lastAction = { targetId: target.id, amount: dmg, type: "basic", meleeHits: melee.hits, meleeAir: melee.air, blocked, time: now };
  // SKILL SURGE: a flat, reactive skill-charge bump paid out the instant a basic
  // attack CONNECTS -- unlike haste's smooth per-tick rate multiplier, this only
  // rewards actually landing hits, so it favors an aggressive, always-swinging
  // playstyle over just waiting out the clock. Any signature/skill can grant it
  // via a self/team effect.
  const surgeEff = (attacker.effects || []).find((e) => e.type === "skill_surge");
  if (surgeEff) {
    const gain = Math.round((surgeEff.val || 0.08) * (attacker.maxSkillCd || 100));
    attacker.skillCd = Math.min(attacker.maxSkillCd || 100, (attacker.skillCd || 0) + gain);
    if (attacker.skillId2) attacker.skillCd2 = Math.min(attacker.maxSkillCd2 || 100, (attacker.skillCd2 || 0) + gain);
  }
  // MOMENTUM: a discrete "build up, then burst" charge mechanic -- each landed
  // basic attack adds a MOMENTUM stack (while the buff is active, array-counted
  // the same way CRUSHED stacks); once stacks hit the buff's threshold, the
  // skill cooldown is INSTANTLY completed and the stacks reset. A different feel
  // from haste's continuous acceleration: nothing happens for several hits, then
  // the whole bar snaps full at once.
  const momentumBuff = (attacker.effects || []).find((e) => e.type === "momentum_surge");
  if (momentumBuff) {
    attacker.effects.push({ type: "momentum_stack", duration: 8, val: 0, label: "MOMENTUM" });
    const stacks = attacker.effects.filter((e) => e.type === "momentum_stack").length;
    if (stacks >= (momentumBuff.threshold || 4)) {
      attacker.effects = attacker.effects.filter((e) => e.type !== "momentum_stack");
      attacker.skillCd = attacker.maxSkillCd || 100;
      if (attacker.skillId2) attacker.skillCd2 = attacker.maxSkillCd2 || 100;
      attacker.lastAction = { ...attacker.lastAction, msg: "MOMENTUM!" };
    }
  }
  triggerCutIns(allUnits, attacker.isEnemy ? "enemy_basic" : "ally_basic", attacker, playerElement);
  return { targetId: target.id, amount: dmg, missed: false, meleeHits: melee.hits, meleeAir: melee.air, hitSplits };
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
    // Generic enemy-side rider, mirroring self/team_effects above -- lets any
    // skill (support/buff-type included, not just "atk") also lean on the
    // whole enemy side regardless of its own target (e.g. a taunt/support cast
    // that also punishes attackers). Reusable by any future signature.
    if (Array.isArray(META.enemy_effects)) next.filter((u) => u.isEnemy !== attacker.isEnemy && !u.dead).forEach((e) => META.enemy_effects.forEach((eff) => e.effects.push({ ...eff, val: scaleVal(eff.val) })));
    if (META.cleanse_team) livingAllies.forEach((a) => { a.effects = a.effects.filter((e) => e.type.startsWith("buff") || e.type === "shield" || e.type === "regen" || e.type === "tactical_stance"); });
    if (META.gain_burst) livingAllies.forEach((a) => { a.burst = Math.min(100, (a.burst || 0) + META.gain_burst); });
    // RECOIL: the caster eats a slice of their OWN max HP for firing something
    // this big (John Silver's arm cannon) -- clamped so it can never be the
    // killing blow, this is a cost, not a suicide button.
    if (META.self_recoil_pct) attacker.hp = Math.max(1, attacker.hp - Math.floor(attacker.maxHp * META.self_recoil_pct));
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
          pushShieldEffect(a, { type: "shield", duration: 3, val: 0.28, label: "GODPARENT GUARD" });
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
        pushShieldEffect(attacker, { type: "shield", duration: 2, val: 0.15, label: "BETTER LUCK NEXT TIME" });
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
    // COPY BOT SYSTEM (Mega Man): entirely separate from the Fallout-style
    // SPECIAL-build dynamic_special engine above -- this is emergent and
    // battle-driven, not player-build-driven. Every cast, the caster scans a
    // random LIVING enemy and copies a themed weapon matching that enemy's
    // element (per META.copy_system.weapons), swapping its damage multiplier,
    // cast animation, damage type, and any rider effects for THIS cast. A
    // running per-element mastery counter (attacker._copyMastery) means
    // copying the SAME element repeatedly across a fight makes that weapon
    // hit progressively harder (+12%/repeat, capped +60%) -- "getting better
    // with a weapon through use" is the actual upgrade axis here, distinct
    // from levels, SPECIAL points, or gear.
    if (META.copy_system) {
      const enemiesNow = next.filter((u) => u.isEnemy !== attacker.isEnemy && !u.dead);
      if (enemiesNow.length) {
        const source = enemiesNow[Math.floor(Math.random() * enemiesNow.length)];
        const copiedElement = source.element || "NEUTRAL";
        const weapon = META.copy_system.weapons?.[copiedElement] || META.copy_system.defaultWeapon || { name: "Mega Buster", dmgMult: 1 };
        attacker._copyMastery = attacker._copyMastery || {};
        attacker._copyMastery[copiedElement] = (attacker._copyMastery[copiedElement] || 0) + 1;
        const masteryCount = attacker._copyMastery[copiedElement];
        const masteryBonus = Math.min(0.6, (masteryCount - 1) * 0.12);
        dynDmgMult = (weapon.dmgMult || 1) * (1 + masteryBonus);
        attacker._dynBonus = weapon.bonus || null;
        if (weapon.castAnim) attacker.lastCastAnim = weapon.castAnim;
        if (weapon.damageType) attacker._dynArchetypeDamageType = weapon.damageType;
        if (weapon.ignore_evasion) attacker._dynArchetypeIgnoreEvasion = true;
        if (Array.isArray(weapon.self_effects)) weapon.self_effects.forEach((e) => attacker.effects.push({ ...e }));
        if (Array.isArray(weapon.enemy_effects)) enemiesNow.forEach((e) => weapon.enemy_effects.forEach((eff) => e.effects.push({ ...eff })));
        // The copied weapon itself is a visible status pip (see describeEffect)
        // so the player can always see which weapon Mega Man is currently
        // packing and how mastered it is, not just a one-frame banner.
        attacker.effects = (attacker.effects || []).filter((e) => e.type !== "copied_weapon");
        attacker.effects.push({ type: "copied_weapon", duration: 9999, val: masteryBonus, label: weapon.name, element: copiedElement });
        attacker.lastAction = { ...attacker.lastAction, msg: masteryCount > 1 ? `${weapon.name} MASTERY LV.${masteryCount}` : `WEAPON GET: ${weapon.name}` };
        if (weapon.target && weapon.target !== skill.target) {
          targets = pickTargets({ ...skill, target: weapon.target }, isLimitBreak);
        }
      }
    } else if (META.dynamic_special && attacker.special) {
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
        // UNDERTONE: only the single DOMINANT stat used to get anything at all --
        // every other point you'd sunk into, say, END or INT was completely
        // wasted the moment some other stat edged it out for the headline
        // archetype. Every SPECIAL stat above baseline now ALSO ticks a small
        // self-effect scaled to its own investment, on top of whichever
        // archetype fired above -- so "I put fewer points into END/INT than my
        // other stats" still does something, it's just proportionally smaller
        // than being the dominant stat.
        const UNDERTONE_FX = {
          str: { type: "overheat", label: "STR UNDERTONE" },
          per: { type: "precision", label: "PER UNDERTONE" },
          end: { type: "fortify", label: "END UNDERTONE" },
          cha: { type: "charm", label: "CHA UNDERTONE" },
          int: { type: "overclock", label: "INT UNDERTONE" },
          agi: { type: "buff_spd", label: "AGI UNDERTONE" },
          lck: { type: "buff_crit", label: "LCK UNDERTONE" }
        };
        SPECIAL_STATS.forEach((k) => {
          const v = attacker.special[k] || baseline;
          if (v <= baseline || k === dominant) return;
          const fx = UNDERTONE_FX[k];
          if (!fx) return;
          const undertoneVal = scaleVal(Math.min(0.3, (v - baseline) * 0.02));
          attacker.effects.push({ type: fx.type, duration: 3, val: undertoneVal, label: fx.label });
        });
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
    // CUT-IN: arms (or re-arms) a standing reactive trigger on the caster --
    // see triggerCutIns for what actually fires. A fresh cast replaces any
    // existing arm outright rather than stacking multiple triggers.
    if (META.cut_in) {
      attacker.effects = (attacker.effects || []).filter((e) => e.type !== "cut_in_armed");
      attacker.effects.push({
        type: "cut_in_armed",
        duration: META.cut_in.duration || 9999,
        trigger: META.cut_in.trigger,
        chance: META.cut_in.chance ?? 1,
        kind: META.cut_in.kind || "strike",
        power: META.cut_in.power || 0.6,
        isMagic: !!META.cut_in.isMagic,
        effType: META.cut_in.effType,
        effDuration: META.cut_in.effDuration,
        val: META.cut_in.val,
        effLabel: META.cut_in.effLabel,
        label: META.cut_in.label || "CUT IN!"
      });
      attacker.lastAction = { ...attacker.lastAction, msg: META.cut_in.armMsg || "ARMED" };
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
            } else if (eff.type === "cd_refund") {
              // CHARGE REFUND -- a one-time instant cooldown burst, distinct
              // from the "haste" status (which speeds up FUTURE gauge gain
              // over its duration). This immediately advances the target's
              // current skill gauge(s) by a % of their max, i.e. "messes with
              // ability charges" directly rather than over time. Never pushed
              // onto t.effects as a lingering status -- it's applied once and
              // done, so it doesn't need a status pip or a tick handler.
              const refundPct = typeof eff.val === "number" ? eff.val * (1 + (abilityLevel - 1) * 0.1) * sigEffectMult : eff.val || 0.3;
              if (typeof t.maxSkillCd === "number") t.skillCd = Math.min(t.maxSkillCd, (t.skillCd || 0) + t.maxSkillCd * refundPct);
              if (t.skillId2 && typeof t.maxSkillCd2 === "number") t.skillCd2 = Math.min(t.maxSkillCd2, (t.skillCd2 || 0) + t.maxSkillCd2 * refundPct);
              t.lastAction = { ...t.lastAction, msg: "CHARGE SURGE" };
            } else {
              let scaledVal = typeof eff.val === "number" ? eff.val * (1 + (abilityLevel - 1) * 0.1) * sigEffectMult : eff.val;
              if (eff.type === "buff_def" && skill.scalingStat === "def") scaledVal *= 1 + attackerStats.def / 1e4;
              if (eff.type === "buff_atk" && skill.scalingStat === "atk") scaledVal *= 1 + attackerStats.atk / 1e4;
              if (eff.type === "shield" && skill.scalingStat === "magic_def") scaledVal *= 1 + attackerStats.magicDef / 5e3;
              if (eff.type === "shield" && skill.scalingStat === "hp") scaledVal *= 1 + attackerStats.hp / 1e4;
              if (eff.type === "shield" && skill.scalingStat === "def") scaledVal *= 1 + attackerStats.def / 8e3;
              if (eff.type === "buff_spd" && skill.scalingStat === "speed") scaledVal *= 1 + attackerStats.speed / 300;
              if (eff.type === "shield") pushShieldEffect(t, { ...eff, val: scaledVal }, attacker);
              else t.effects.push({ ...eff, val: scaledVal });
              // CUT-IN: "ally_buffed" fires whenever a buff-type effect actually
              // lands on a unit (the buffed unit itself, so a cut-in armed on
              // "gets a buff" reacts to its OWN buffs too, not just teammates').
              if (String(eff.type).startsWith("buff")) triggerCutIns(next, "ally_buffed", t, playerElement);
            }
          }
        });
      }
      if (skill.type === "heal") {
        let scalingVal = attackerStats.atk * 0.3 + attackerStats.magicAtk * 1.2;
        if (skill.scalingStat === "hp") scalingVal = attackerStats.hp * 0.15;
        if (skill.scalingStat === "magic_atk") scalingVal = attackerStats.magicAtk * 1.5;
        const sigHealMult = skill.signature ? SIGNATURE_BONUS.HEAL : 1;
        // Smaller Technique payoff on heals than damage (see the skillPower bonus
        // below) so support/healer builds get a legible benefit from investing in
        // it too, without heals swinging as hard as the damage side does.
        const healTechMult = 1 + Math.min(0.3, (attackerStats.technique || 0) / 600);
        const amt = Math.floor(scalingVal * ((skill.power || 1) * (1 + (abilityLevel - 1) * 0.05)) * (isLimitBreak ? 1.8 : 1) * sigHealMult * healTechMult);
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
        // TECHNIQUE: legible ability/signature power lever distinct from raw
        // ATK/magicAtk -- only applied here, in the skill/signature damage path,
        // NEVER in resolveBasicAttack. Two characters with identical ATK but
        // different Technique hit identically with basics but differently with
        // abilities. Caps at +60% at high investment. See utils.js calculateSubStat.
        skillPower *= 1 + Math.min(0.6, (attackerStats.technique || 0) / 400);
        // Signature premium moved out of skillPower (see the additive sigDmgBonus
        // term near the crit roll below) -- it used to multiply here AND get
        // multiplied again by the crit multiplier on the same hit, double-dipping
        // on every signature crit and driving the worst one-shot spikes.
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
        let dmg = Math.floor(offense * skillPower * (attacker.tierMod || 1) * (isLimitBreak ? 1.45 : 0.95));
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
        // Signature premium as one additive term, applied exactly once per hit
        // whether or not it crits (see the skillPower comment above for why this
        // moved here instead of multiplying skillPower directly).
        const sigDmgBonus = skill.signature ? SIGNATURE_BONUS.DAMAGE - 1 : 0;
        let didCrit = false;
        if (Math.random() < (attackerStats.critRate || 0.05) + (awaken >= 5 ? 0.25 : 0) + sigCritBonus || skill.meta?.guaranteed_crit || hiddenPowerReady) {
          dmg = Math.floor(dmg * (1 + sigDmgBonus + 0.4 + awaken * 0.04 + (skill.signature ? SIGNATURE_BONUS.CRIT_DMG : 0)));
          didCrit = true;
        } else if (sigDmgBonus) {
          dmg = Math.floor(dmg * (1 + sigDmgBonus));
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
        // Tracks whether this hit is a genuine execute/finisher -- those are exempt
        // from the damage soft-cap below (see comment at the cap) since "kill an
        // already-low-HP target" is meant to reliably read as a real kill.
        let isExecuteHit = false;
        if (META.execute_below && t.hp / t.maxHp <= META.execute_below) {
          dmg = Math.floor(dmg * (META.execute_mult || 1.8));
          attacker.lastAction = { ...attacker.lastAction, msg: "EXECUTE" };
          isExecuteHit = true;
        }
        // dynamic_special on-hit rider: the chosen SPECIAL form carries a small
        // mechanical identity beyond its damage number (an execute finisher, a
        // life-drain, etc.), applied only when that form is the active one.
        if (attacker._dynBonus === "execute" && t.hp / t.maxHp <= 0.4) {
          dmg = Math.floor(dmg * 1.8);
          attacker.lastAction = { ...attacker.lastAction, msg: "CALLED SHOT" };
          isExecuteHit = true;
        }
        // Cait Sith JACKPOT bonus: on a triple-match roll, anything already low
        // gets deleted on top of the jackpot damage multiplier.
        if (slotJackpot && META.jackpot_execute_below && t.hp / t.maxHp <= META.jackpot_execute_below) {
          dmg = Math.floor(dmg * (META.jackpot_execute_mult || 2.2));
          attacker.lastAction = { ...attacker.lastAction, msg: "★JACKPOT EXECUTE★" };
          isExecuteHit = true;
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
        // BLOCK: defense's proactive payoff (see getBattleStats). Rolled after
        // mitigation and before shields, so a block softens the hit BEFORE it
        // ever reaches the shield pool. Not gated behind execute hits -- a
        // block still lands, it just doesn't hit as hard.
        if (Math.random() < (tStats.blockChance || 0)) {
          dmg = Math.floor(dmg * 0.72);
          attacker.lastAction = { ...attacker.lastAction, blocked: true };
        }
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
            t._shieldBroke = true;
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
        // Damage-stacking soft cap: signature + crit + elemental + hidden-power +
        // jackpot + multi-hit could previously compound past 100% of a target's
        // max HP in a single serialized action -- whichever side acted first just
        // deleted a unit outright. Past 45% of the target's max HP, only 15% of
        // the overflow still lands, so a monstrous roll is still a big, scary hit
        // (up to ~53-55% of max HP) but no longer a guaranteed one-shot. Genuine
        // execute/finisher hits (isExecuteHit) are exempt so killing an
        // already-low-HP target still reads as a clean kill.
        if (!isExecuteHit) {
          const softCap = Math.floor(t.maxHp * 0.45);
          if (dmg > softCap) {
            const overflow = dmg - softCap;
            dmg = softCap + Math.floor(overflow * 0.15);
          }
        }
        t.hp = Math.max(0, t.hp - dmg);
        // Skill hits stun too, not just basics -- same tug-of-war formula, using
        // this cast's own multi-hit count (numHits) as the stack multiplier.
        if (dmg > 0) applyHitstun(t, getHitstunMs(attackerStats, tStats, numHits));
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
            applyDeathBurst(t, next, skills);
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
          pushShieldEffect(attacker, { type: "shield", duration: META.shield_duration || 3, val: META.shield_val || 0.25, label: "SPOILS OF WAR" });
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
            } else { t.dead = true; applyDeathBurst(t, next, skills); }
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
            if (Math.random() < (attacker._tacticalBonus.shieldChance || 0)) pushShieldEffect(attacker, { type: "shield", duration: 2, val: 0.15, label: "TACTICAL SHIELD" });
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
  // CUT-IN: fires "ally_skill"/"enemy_skill" reactions once the whole cast has
  // resolved, so any armed unit's reactive strike/buff/debuff lands cleanly
  // after the primary skill's own targets/effects are already settled.
  triggerCutIns(next, attacker.isEnemy ? "enemy_skill" : "ally_skill", attacker, playerElement);
  return next;
};

export { resolveBasicAttack, executeCombatSkill };
