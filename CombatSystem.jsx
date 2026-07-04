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
  SIGNATURE_BONUS
} from "./utils.js";
import { CustomSelect, TierBadge, VisualEffect } from "./components.jsx";
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
const executeCombatSkill = ({ combatants, attackerId, skills, playerElement, isLimitBreak = false, forcedTargetId = null }) => {
  const next = combatants.map((u) => {
    const cloned = { ...u };
    cloned.effects = Array.isArray(u.effects) ? u.effects.map((e) => ({ ...e })) : [];
    return cloned;
  });
  const attacker = next.find((u) => u.id === attackerId);
  if (!attacker || attacker.dead) return next;
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
  } catch (e) {
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
    const targets = pickTargets(skill, isLimitBreak);
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
    // --- Per-cast effects: applied once when the skill is used (support / self-combo skills) ---
    const livingAllies = next.filter((u) => u.isEnemy === attacker.isEnemy && !u.dead);
    if (Array.isArray(META.self_effects)) META.self_effects.forEach((e) => attacker.effects.push({ ...e, val: scaleVal(e.val) }));
    if (Array.isArray(META.team_effects)) livingAllies.forEach((a) => META.team_effects.forEach((e) => a.effects.push({ ...e, val: scaleVal(e.val) })));
    if (META.cleanse_team) livingAllies.forEach((a) => { a.effects = a.effects.filter((e) => e.type.startsWith("buff") || e.type === "shield" || e.type === "regen" || e.type === "tactical_stance"); });
    if (META.gain_burst) livingAllies.forEach((a) => { a.burst = Math.min(100, (a.burst || 0) + META.gain_burst); });
    if (META.dispel_enemies) {
      next.filter((u) => u.isEnemy !== attacker.isEnemy && !u.dead).forEach((e) => { e.effects = e.effects.filter((x) => !x.type.startsWith("buff") && x.type !== "shield"); });
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
    targets.forEach((t) => {
      if (!t || t.dead) return;
      if (skill.statusEffects) {
        skill.statusEffects.forEach((eff) => {
          if (eff.condition) {
            if (eff.condition.hasStatus && !t.effects.some((e) => e.type === eff.condition.hasStatus)) return;
            if (typeof eff.condition.hpBelow === "number" && !(t.hp / t.maxHp <= eff.condition.hpBelow)) return;
          }
          if (Math.random() < Math.min(1, (eff.chance || 0) + awaken * 0.06)) {
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
        attacker.lastAction = { targetId: t.id, amount: amt, type: "heal", time: Date.now(), skillUser: attacker.id };
        return;
      }
      if (skill.type === "atk" || skill.type === "combo" || skill.type === "debuff" && (skill.power || 0) > 0) {
        const tStats = getBattleStats(t, playerElement, t.activeSynergies || []);
        if (!isLimitBreak && !META.ignore_evasion && !hiddenPowerReady && Math.random() < (tStats.evasion || 0)) {
          attacker.lastAction = { targetId: t.id, amount: "MISS", type: "miss", time: Date.now(), skillUser: attacker.id };
          return;
        }
        let isMagic = skill.damageType === "magical" || attackerStats.magicAtk > attackerStats.atk;
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
        skillPower *= wishDmgMult;
        if (hiddenPowerReady) skillPower *= META.hidden_power_mult || 4;
        if (META.scales_missing_hp) skillPower *= 1 + (1 - attacker.hp / attacker.maxHp) * META.scales_missing_hp;
        if (META.scales_current_hp) skillPower *= 1 + (attacker.hp / attacker.maxHp) * META.scales_current_hp;
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
        if (ELEMENTS[attacker.element]?.strongTo === t.element) {
          dmg = Math.floor(dmg * 1.35);
          const insight = attacker.effects.find((e) => e.type === "elemental_insight");
          if (insight) dmg = Math.floor(dmg * (1 + insight.val));
        } else if (ELEMENTS[attacker.element]?.weakTo === t.element) dmg = Math.floor(dmg * 0.8);
        const sigCritBonus = skill.signature ? SIGNATURE_BONUS.CRIT_RATE : 0;
        if (Math.random() < (attackerStats.critRate || 0.05) + (awaken >= 5 ? 0.25 : 0) + sigCritBonus || skill.meta?.guaranteed_crit || hiddenPowerReady) {
          dmg = Math.floor(dmg * (1.4 + awaken * 0.04 + (skill.signature ? SIGNATURE_BONUS.CRIT_DMG : 0)));
        }
        // --- Conditional damage modifiers ---
        if (META.bonus_vs_status && t.effects.some((e) => e.type === META.bonus_vs_status.status)) {
          dmg = Math.floor(dmg * (META.bonus_vs_status.mult || 1.5));
          attacker.lastAction = { ...attacker.lastAction, msg: "EXPLOIT" };
        }
        if (META.bonus_vs_element && t.element === META.bonus_vs_element.element) dmg = Math.floor(dmg * (META.bonus_vs_element.mult || 1.5));
        if (META.execute_below && t.hp / t.maxHp <= META.execute_below) {
          dmg = Math.floor(dmg * (META.execute_mult || 1.8));
          attacker.lastAction = { ...attacker.lastAction, msg: "EXECUTE" };
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
          const shield = t.effects[shieldIdx];
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
          } else {
            const shieldHp = shield.remainingHp || 0;
            if (shieldHp > 0) {
              if (dmg >= shieldHp) {
                dmg -= shieldHp;
                t.effects.splice(shieldIdx, 1);
                t._shieldHit = true;
              } else {
                shield.remainingHp -= dmg;
                dmg = 0;
                t._shieldHit = true;
              }
            } else {
              dmg = Math.floor(dmg * (1 - (shield.val || 0)));
            }
          }
        }
        t.hp = Math.max(0, t.hp - dmg);
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
            t.effects.push({ type: "stun", duration: 1, val: 0, label: "STAGGERED" });
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
        attacker.lastAction = { targetId: t.id, amount: dmg, type: skill.damageType === "magical" ? "magic" : "normal", damageType: skill.damageType || "physical", time: Date.now(), skillUser: attacker.id, resonated: elementMatches, tacticalUsed: !!attacker._tacticalBonus, msg: wishMsg || undefined };
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
const BattleUnit = ({ unit, isMarked, onMark, floatingDamages, playerElement }) => {
  const [isHit, setIsHit] = useState(false);
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
  useEffect(() => {
    if (unit.hp < prevHp.current) {
      setIsHit(true);
      setGhostHpPercent(prevHp.current / unit.maxHp * 100);
      if (!activeGif) playGif("effectsnew/popupflash.gif");
      const timer = setTimeout(() => setIsHit(false), 250);
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
      className: `battle-unit ${unit.isEnemy ? "is-enemy" : "is-ally"} ${unit.dead ? "dead-dissolve" : "battle-unit-idle"} ${isActiveTurn ? "acting active-turn" : ""} ${isHit ? "is-hit" : ""} ${isMarked ? "is-marked" : ""} ${unit.isBoss ? "is-boss" : ""} ${isStaggered ? "staggered-unit" : ""} ${unit.cosmetics?.borderClass || ""} ${stance ? "stance-glow-active" : ""} ${hasShield ? "has-active-shield" : ""} ${isFrozen ? "is-frozen" : ""} ${isStunned ? "is-stunned" : ""} ${isBurned ? "is-burned" : ""} ${isStatic ? "is-static" : ""} ${isElemEmpowered ? "is-elem-empowered" : ""} ${isCrushed ? "is-crushed" : ""}`,
      onClick: () => unit.isEnemy && onMark && onMark(),
      style: {
        "--stance-color": stanceColor,
        "--delay": `${(Math.random() * 2).toFixed(2)}s`
      },
      children: [
        isMarked && /* @__PURE__ */ jsxDEV("div", { className: "target-marker animate-pulse", children: "MARK" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 500,
          columnNumber: 21
        }),
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
        /* @__PURE__ */ jsxDEV("div", { className: `unit-avatar-wrapper ${unit.gauge >= 100 ? "active-turn" : ""}`, style: { position: "relative", width: unit.isBoss ? "130px" : "85px", height: unit.isBoss ? "130px" : "85px" }, children: [
          hasShield && /* @__PURE__ */ jsxDEV("div", { className: `shield-vfx-overlay ${shieldHitActive ? "shield-hit" : ""}` }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 512,
            columnNumber: 24
          }),
          hasShield && shieldEffect.val > 0 && /* @__PURE__ */ jsxDEV("div", { className: "shield-strength-chip", children: [
            "-",
            Math.min(99, Math.round((isFinite(shieldEffect.val) ? shieldEffect.val : 0) * 100)),
            "% DMG"
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 512,
            columnNumber: 24
          }),
          /* @__PURE__ */ jsxDEV("img", { src: unit.img, className: "unit-avatar", style: { ...unit.cosmetics?.auraStyle, width: "100%", height: "100%" } }, void 0, false, {
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
            return /* @__PURE__ */ jsxDEV("div", { className: `status-badge ${statusClass}`, children: [
              icon,
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
  useEffect(() => {
    playSound("victory_fanfare", 0.8);
    playSound("mugen_victory_voice", 0.5);
    const t1 = setTimeout(() => {
      setPhase(1);
      playSound("intro_boom", 0.6);
    }, 1200);
    const t2 = setTimeout(() => {
      setPhase(2);
      playSound("reward_tally", 0.4);
    }, 2200);
    const t3 = setTimeout(() => {
      setPhase(3);
    }, 3500);
    const t4 = setTimeout(() => {
      setPhase(4);
    }, 5e3);
    return () => {
      [t1, t2, t3, t4].forEach(clearTimeout);
    };
  }, []);
  useEffect(() => {
    if (phase === 3 && rewards.items && rewards.items.length > 0) {
      rewards.items.forEach((item, i) => {
        setTimeout(() => {
          setVisibleItems((prev) => [...prev, item]);
          playSound("item_pop", 0.3);
        }, i * 250);
      });
    }
  }, [phase, rewards.items]);
  const mvp = allies.filter((a) => !a.dead).sort((a, b) => b.hp - a.hp)[0] || allies[0];
  return /* @__PURE__ */ jsxDEV("div", { className: "battle-result-overlay", style: { background: "radial-gradient(circle at center, #1a1a2e 0%, #05050a 100%)", perspective: "1000px" }, children: [
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
      phase >= 2 && /* @__PURE__ */ jsxDEV("div", { className: "victory-content-wrap", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "mvp-spotlight animate-popIn", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "mvp-label", children: "BATTLE MVP" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 692,
            columnNumber: 17
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "mvp-hero-box", style: { borderColor: rankInfo.color }, children: [
            /* @__PURE__ */ jsxDEV("img", { src: mvp.img, className: "mvp-avatar-img" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 694,
              columnNumber: 21
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "mvp-name-tag", children: mvp.name }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 695,
              columnNumber: 21
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 693,
            columnNumber: 17
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 691,
          columnNumber: 14
        }),
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
      phase >= 3 && rewards.items && rewards.items.length > 0 && /* @__PURE__ */ jsxDEV("div", { className: "victory-items-reveal animate-fadeIn", children: [
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
      phase >= 4 && /* @__PURE__ */ jsxDEV("button", { className: "confirm-vic-btn animate-popIn", onClick: onConfirm, children: [
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
        })
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
  SquadBuilderModal,
  TacticalStanceRow,
  VictoryScreen,
  executeCombatSkill,
  getBattleStats
};
