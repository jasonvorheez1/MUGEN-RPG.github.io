import { Fragment, jsxDEV } from "react/jsx-dev-runtime";
import React from "react";
import {
  Sparkles,
  Info
} from "lucide-react";
import { ELEMENTS, SKILL_RARITY_CONFIG } from "../constants.js";
import { getAbilityColor, playSound, getLeaderSkill, getSkillTags, calculateStat, SIGNATURE_BONUS } from "../utils.js";

const AbilitiesView = ({ char, characters = [], credits, setCredits, setCharacters, selectedCharIndex, createFloatingText, minimalMode = false, gems, setGems, essence, setEssence, skills, auraUpgrades = {} }) => {
  if (!char) return null;
  const signature = (skills || []).find((s) => s.signature && s.owner === char.name);
  const SIG_REQ_LEVEL = 70;
  const SIG_REQ_BOND = 20;
  const SIG_COST_GEMS = 2000;
  const SIG_COST_ESSENCE = 100;
  const SIG_COST_CREDITS = 250000;
  const sigUnlocked = !!signature && (char.signatureUnlocked === true || (char.abilityLevels && char.abilityLevels[signature.id]));
  const sigEquipped = !!signature && (char.skillId === signature.id || char.skillId2 === signature.id);
  const unlockSignature = () => {
    if (!signature || sigUnlocked) return;
    if (char.level < SIG_REQ_LEVEL || char.bondLevel < SIG_REQ_BOND) {
      createFloatingText(`Requires LV.${SIG_REQ_LEVEL} & Bond ${SIG_REQ_BOND}`, true);
      playSound("error");
      return;
    }
    if ((gems || 0) < SIG_COST_GEMS) { createFloatingText(`Need ${SIG_COST_GEMS} Gems`, true); playSound("error"); return; }
    if ((essence || 0) < SIG_COST_ESSENCE) { createFloatingText(`Need ${SIG_COST_ESSENCE} Essence`, true); playSound("error"); return; }
    if ((credits || 0) < SIG_COST_CREDITS) { createFloatingText(`Need ${SIG_COST_CREDITS.toLocaleString()} Credits`, true); playSound("error"); return; }
    setGems((g) => g - SIG_COST_GEMS);
    if (typeof setEssence === "function") setEssence((e) => e - SIG_COST_ESSENCE);
    setCredits((c) => c - SIG_COST_CREDITS);
    setCharacters((prev) => {
      const next = [...prev];
      const c = { ...next[selectedCharIndex] };
      c.signatureUnlocked = true;
      c.abilityLevels = { ...(c.abilityLevels || {}) };
      if (!c.abilityLevels[signature.id]) c.abilityLevels[signature.id] = 1;
      next[selectedCharIndex] = c;
      return next;
    });
    playSound("unlock");
    createFloatingText(`SIGNATURE AWAKENED: ${signature.name}!`, false, "#ffd700");
  };
  const equipSignature = (slot) => {
    if (!signature || !sigUnlocked) return;
    if (slot === 2 && char.level < 50) { createFloatingText("Slot 2 unlocks at LV.50", true); playSound("error"); return; }
    setCharacters((prev) => {
      const next = [...prev];
      const c = { ...next[selectedCharIndex] };
      c.abilityLevels = { ...(c.abilityLevels || {}) };
      if (!c.abilityLevels[signature.id]) c.abilityLevels[signature.id] = 1;
      if (slot === 1) c.skillId = signature.id;
      else c.skillId2 = signature.id;
      next[selectedCharIndex] = c;
      return next;
    });
    playSound("equip");
    createFloatingText(`${signature.name} equipped to Slot ${slot}!`, false, "#ffd700");
  };
  const renderSignature = () => {
    if (!signature) return null;
    const h = React.createElement;
    const gold = "#ffd700";
    const reqMet = char.level >= SIG_REQ_LEVEL && char.bondLevel >= SIG_REQ_BOND;
    const effTags = (signature.statusEffects || []).map((e) => e.label).filter(Boolean);
    const metaTags = [];
    const m = signature.meta || {};
    if (m.guaranteed_crit) metaTags.push("ALWAYS CRIT");
    if (m.ignore_def) metaTags.push("PIERCE " + Math.round(m.ignore_def * 100) + "% DEF");
    if (m.ignore_evasion) metaTags.push("CAN'T MISS");
    if (m.break_shield) metaTags.push("SHIELD BREAK");
    if (m.lifesteal) metaTags.push("LIFESTEAL " + Math.round(m.lifesteal * 100) + "%");
    if (m.heal_on_hit) metaTags.push("DRAIN " + Math.round(m.heal_on_hit * 100) + "%");
    if (m.stagger_bonus) metaTags.push("HEAVY STAGGER");
    if (m.execute_below) metaTags.push("EXECUTE <" + Math.round(m.execute_below * 100) + "% HP");
    if (m.detonate) metaTags.push("DETONATE DOTs");
    if (m.steal_buff) metaTags.push("STEAL BUFF");
    if (m.dispel_enemies) metaTags.push("DISPEL BUFFS");
    if (m.mark) metaTags.push("EXPOSE -" + Math.round((m.mark.def_down || 0.3) * 100) + "% DEF");
    if (m.scales_missing_hp) metaTags.push("RAGE (LOW HP)");
    if (m.scales_current_hp) metaTags.push("SCALES HP");
    if (m.bonus_per_debuff) metaTags.push("PUNISH DEBUFFS");
    if (m.bonus_vs_status) metaTags.push("EXPLOIT " + String(m.bonus_vs_status.status || "").replace("debuff_spd", "SLOW").replace("_", " ").toUpperCase());
    if (m.bonus_vs_element) metaTags.push("VS " + m.bonus_vs_element.element);
    if (Array.isArray(m.team_effects)) metaTags.push("TEAM BUFF");
    if (m.cleanse_team) metaTags.push("CLEANSE TEAM");
    if (m.gain_burst) metaTags.push("+" + m.gain_burst + " BURST");
    if (Array.isArray(m.self_effects)) metaTags.push("SELF BUFF");
    if (m.extra_hits) metaTags.push((m.extra_hits + 1) + " HITS");
    if (m.bonus_vs_full_hp) metaTags.push("AMBUSH (FULL HP)");
    if (m.copy_buff) metaTags.push("COPY BUFFS");
    if (m.invert_buffs) metaTags.push("INVERT BUFFS");
    if (m.random_status) metaTags.push("RANDOM CURSE");
    // New elemental-empower mechanic: surface the exact team elemental-damage %.
    const elemEff = Array.isArray(m.team_effects) ? m.team_effects.find((e) => e.type === "buff_elemdmg") : null;
    if (elemEff) metaTags.push("⚡ ELEM DMG +" + Math.round((elemEff.val || 0) * 100) + "%");
    if (m.crush) metaTags.push("CRUSH (RAMPS)");
    if (m.wish_cycle) metaTags.push("✨ WISH CYCLE (3 MODES)");
    const targetLabel = { single_enemy: "Single", all_enemies: "All Enemies", all_allies: "All Allies", self: "Self", lowest_ally: "Ally", random_enemies: "Random" }[signature.target] || signature.target;
    const chip = (txt, bg, col) => h("span", { key: txt, style: { fontSize: "0.55rem", fontWeight: 900, padding: "2px 7px", borderRadius: 5, background: bg, color: col, letterSpacing: 0.5 } }, txt);
    return h("div", { style: {
        marginBottom: 22, padding: 2, borderRadius: 16,
        background: "linear-gradient(135deg, #ffd700, #b8860b 40%, #fff8dc 60%, #daa520)",
        boxShadow: "0 0 22px rgba(255,215,0,0.35)", position: "relative", overflow: "hidden"
      } },
      h("div", { style: { background: "linear-gradient(160deg, #1a1408, #0a0a0f 70%)", borderRadius: 14, padding: 16, position: "relative" } },
        // ribbon
        h("div", { style: { position: "absolute", top: 12, right: -34, transform: "rotate(45deg)", background: "linear-gradient(90deg,#ffd700,#daa520)", color: "#000", fontSize: "0.55rem", fontWeight: 900, padding: "3px 40px", letterSpacing: 1, boxShadow: "0 2px 6px rgba(0,0,0,0.5)" } }, "SIGNATURE"),
        h("div", { style: { fontSize: "0.55rem", fontWeight: 900, letterSpacing: 2, color: gold, opacity: 0.8 } }, "★ SIGNATURE ABILITY — " + char.name.toUpperCase()),
        h("div", { style: { fontSize: "1.35rem", fontWeight: 900, color: "#fff", textShadow: "0 0 12px rgba(255,215,0,0.6)", marginTop: 2 } }, signature.name),
        signature.flavor ? h("div", { style: { fontSize: "0.7rem", fontStyle: "italic", color: gold, opacity: 0.85, marginBottom: 6 } }, '"' + signature.flavor + '"') : null,
        h("p", { style: { fontSize: "0.78rem", color: "#e5e7eb", lineHeight: 1.4, margin: "6px 0 10px" } }, signature.desc),
        // stat chips
        h("div", { style: { display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 } },
          chip(signature.type === "heal" ? "HEAL ×" + signature.power : signature.type === "buff" ? "SUPPORT" : "PWR ×" + signature.power, "rgba(74,222,128,0.15)", "#4ade80"),
          chip("CD " + signature.cooldown, "rgba(96,165,250,0.15)", "#60a5fa"),
          chip(targetLabel, "rgba(168,85,247,0.15)", "#c084fc"),
          ...metaTags.map((t) => chip(t, "rgba(255,215,0,0.15)", gold)),
          ...effTags.map((t) => chip(t, "rgba(239,68,68,0.12)", "#fca5a5"))
        ),
        // action zone
        !sigUnlocked
          ? h("div", null,
              h("div", { style: { display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" } },
                h("span", { style: { fontSize: "0.62rem", fontWeight: 800, color: char.level >= SIG_REQ_LEVEL ? "#4ade80" : "#f87171" } }, (char.level >= SIG_REQ_LEVEL ? "✓" : "✗") + " Level " + char.level + "/" + SIG_REQ_LEVEL),
                h("span", { style: { fontSize: "0.62rem", fontWeight: 800, color: char.bondLevel >= SIG_REQ_BOND ? "#4ade80" : "#f87171" } }, (char.bondLevel >= SIG_REQ_BOND ? "✓" : "✗") + " Bond " + char.bondLevel + "/" + SIG_REQ_BOND)
              ),
              h("button", { onClick: unlockSignature, disabled: !reqMet,
                style: { width: "100%", padding: "12px", border: "none", borderRadius: 10, cursor: reqMet ? "pointer" : "not-allowed",
                  fontWeight: 900, fontSize: "0.85rem", letterSpacing: 1, color: reqMet ? "#000" : "#666",
                  background: reqMet ? "linear-gradient(135deg,#ffd700,#daa520)" : "rgba(255,255,255,0.08)",
                  boxShadow: reqMet ? "0 0 18px rgba(255,215,0,0.5)" : "none" } },
                "AWAKEN SIGNATURE — " + SIG_COST_GEMS + "💎 + " + SIG_COST_ESSENCE + " ESSENCE + " + SIG_COST_CREDITS.toLocaleString() + "₢"),
              h("div", { style: { fontSize: "0.58rem", color: "var(--text-muted)", textAlign: "center", marginTop: 6 } }, "Bond with and train " + char.name + " to unlock their true power.")
            )
          : h("div", null,
              h("div", { style: { fontSize: "0.62rem", fontWeight: 900, color: gold, marginBottom: 8, letterSpacing: 1 } }, sigEquipped ? "✓ EQUIPPED & ACTIVE IN BATTLE" : "UNLOCKED — equip it to a skill slot"),
              h("div", { style: { display: "flex", gap: 8 } },
                h("button", { onClick: () => equipSignature(1), disabled: char.skillId === signature.id,
                  style: { flex: 1, padding: "10px", border: "1px solid " + gold, borderRadius: 8, cursor: "pointer", fontWeight: 900, fontSize: "0.72rem",
                    background: char.skillId === signature.id ? gold : "transparent", color: char.skillId === signature.id ? "#000" : gold } },
                  char.skillId === signature.id ? "IN SLOT 1" : "EQUIP → SLOT 1"),
                h("button", { onClick: () => equipSignature(2), disabled: char.skillId2 === signature.id || char.level < 50,
                  style: { flex: 1, padding: "10px", border: "1px solid " + gold, borderRadius: 8, cursor: char.level < 50 ? "not-allowed" : "pointer", fontWeight: 900, fontSize: "0.72rem",
                    background: char.skillId2 === signature.id ? gold : "transparent", color: char.skillId2 === signature.id ? "#000" : (char.level < 50 ? "#666" : gold), opacity: char.level < 50 ? 0.5 : 1 } },
                  char.skillId2 === signature.id ? "IN SLOT 2" : "EQUIP → SLOT 2")
              )
            )
      )
    );
  };
  const leader = typeof getLeaderSkill === "function" ? getLeaderSkill(char.leaderSkillId) : null;
  const equipLeader = () => {
    if (!leader) return;
    setCharacters((prev) => {
      const next = [...prev];
      const idx = selectedCharIndex;
      if (idx < 0 || idx >= next.length) return prev;
      next[idx] = { ...next[idx], leaderSkillId: leader.id };
      return next;
    });
    playSound("equip");
    createFloatingText(`Leader Skill Equipped: ${leader.name}`, false, "#facc15");
  };
  const skill1 = (skills || []).find((s) => s.id === char.skillId) || { id: "slash", name: "Slash", desc: "Basic strike", rarity: "Common" };
  const skill2 = char.skillId2 ? (skills || []).find((s) => s.id === char.skillId2) : null;
  const level1 = char.abilityLevels?.[skill1.id] || 1;
  const level2 = skill2 ? char.abilityLevels?.[skill2.id] || 1 : 0;
  const upgrade = (skillId, costType) => {
    const currentLevel = char.abilityLevels?.[skillId] || 1;
    const cost = costType === "sp" ? 1 : 500 * (currentLevel + 1);
    if (costType === "sp" && (char.skillPoints || 0) < 1) return;
    if (costType === "credits" && credits < cost) return;
    if (costType === "credits") setCredits((c) => c - cost);
    setCharacters((prev) => {
      const next = [...prev];
      const c = { ...next[selectedCharIndex] };
      if (costType === "sp") c.skillPoints--;
      if (!c.abilityLevels) c.abilityLevels = {};
      c.abilityLevels[skillId] = currentLevel + 1;
      next[selectedCharIndex] = c;
      return next;
    });
    playSound("upgrade");
    createFloatingText("SKILL LEVEL UP!", false, costType === "sp" ? "#a855f7" : "#facc15");
  };
  // Bulk credit upgrade: buy as many levels as requested (or as many as affordable).
  // Cost per level is 500*(level+1), so it ramps — MAX just spends the whole wallet.
  const upgradeBulk = (skillId, times) => {
    let lvl = char.abilityLevels?.[skillId] || 1;
    let budget = credits;
    let bought = 0;
    for (let i = 0; i < times; i++) {
      const c = 500 * (lvl + 1);
      if (budget < c) break;
      budget -= c;
      lvl++;
      bought++;
    }
    if (bought === 0) { createFloatingText("Not enough credits", true); playSound("error"); return; }
    const spent = credits - budget;
    setCredits((c) => c - spent);
    setCharacters((prev) => {
      const next = [...prev];
      const cc = { ...next[selectedCharIndex] };
      if (!cc.abilityLevels) cc.abilityLevels = {};
      cc.abilityLevels[skillId] = lvl;
      next[selectedCharIndex] = cc;
      return next;
    });
    playSound("upgrade");
    createFloatingText(`+${bought} SKILL LV — $${spent.toLocaleString()}`, false, "#facc15");
  };
  const rerollSkill = (slot = 1) => {
    const REROLL_COST = slot === 2 && !char.skillId2 ? 500 : 100;
    if (gems < REROLL_COST) {
      createFloatingText(`Need ${REROLL_COST} Gems`, true);
      return;
    }
    setGems((g) => g - REROLL_COST);
    setCharacters((prev) => {
      const next = [...prev];
      const c = { ...next[selectedCharIndex] };
      const roll = Math.random() * 100;
      let targetRarity = "Common";
      if (roll < 3) targetRarity = "Legendary";
      else if (roll < 15) targetRarity = "Epic";
      else if (roll < 50) targetRarity = "Rare";
      const currentId = slot === 1 ? c.skillId : c.skillId2;
      const otherId = slot === 1 ? c.skillId2 : c.skillId;
      const pool = skills.filter((s) => s.rarity === targetRarity && s.id !== currentId && s.id !== otherId);
      const finalPool = pool.length > 0 ? pool : skills;
      const newSkill = finalPool[Math.floor(Math.random() * finalPool.length)];
      if (slot === 1) {
        const oldLevel = c.abilityLevels?.[c.skillId] || 1;
        c.skillId = newSkill.id;
        if (!c.abilityLevels) c.abilityLevels = {};
        c.abilityLevels[newSkill.id] = oldLevel;
      } else {
        c.skillId2 = newSkill.id;
        if (!c.abilityLevels) c.abilityLevels = {};
        if (!c.abilityLevels[newSkill.id]) c.abilityLevels[newSkill.id] = 1;
      }
      next[selectedCharIndex] = c;
      return next;
    });
    playSound("summon_reveal");
    createFloatingText(slot === 2 && !char.skillId2 ? "SECOND SLOT UNLOCKED!" : "SKILL REROLLED!", false, "#00d2ff");
  };
  const awaken = (skillId) => {
    const rank = char.abilityAwaken?.[skillId] || 0;
    if (rank >= 5) return;
    const level = char.abilityLevels?.[skillId] || 1;
    const reqLevel = (rank + 1) * 3;
    if (level < reqLevel) {
      createFloatingText(`Reach Skill LV.${reqLevel} first`, true);
      playSound("error");
      return;
    }
    const gemCost = 40 * (rank + 1);
    const credCost = 25e3 * (rank + 1);
    if ((gems || 0) < gemCost) {
      createFloatingText(`Need ${gemCost} Gems`, true);
      playSound("error");
      return;
    }
    if (credits < credCost) {
      createFloatingText(`Need $${credCost.toLocaleString()}`, true);
      playSound("error");
      return;
    }
    setGems((g) => g - gemCost);
    setCredits((c) => c - credCost);
    setCharacters((prev) => {
      const next = [...prev];
      const c = { ...next[selectedCharIndex] };
      c.abilityAwaken = { ...(c.abilityAwaken || {}) };
      c.abilityAwaken[skillId] = rank + 1;
      next[selectedCharIndex] = c;
      return next;
    });
    playSound("unlock");
    createFloatingText(`AWAKENED ★${rank + 1}!`, false, "#f472b6");
  };
  const awakenPerks = (rank) => {
    const perks = [];
    if (rank > 0) perks.push(`+${rank * 10}% Power`);
    if (rank > 0) perks.push(`+${rank * 6}% Status Rate`);
    if (rank >= 3) perks.push(`+${5 + (rank - 3) * 3}% Lifesteal`);
    if (rank >= 5) perks.push(`+25% Crit Chance`);
    return perks;
  };
  const renderAwaken = (skill) => {
    if (!skill) return null;
    const rank = char.abilityAwaken?.[skill.id] || 0;
    const level = char.abilityLevels?.[skill.id] || 1;
    const maxed = rank >= 5;
    const reqLevel = (rank + 1) * 3;
    const gemCost = 40 * (rank + 1);
    const credCost = 25 * (rank + 1);
    const pips = [0, 1, 2, 3, 4].map((i) => React.createElement("span", {
      key: i,
      style: {
        width: 13, height: 13, borderRadius: "50%", display: "inline-block", margin: "0 2px",
        background: i < rank ? "#f472b6" : "rgba(255,255,255,0.08)",
        boxShadow: i < rank ? "0 0 8px #f472b6" : "none",
        border: "1px solid " + (i < rank ? "#f9a8d4" : "rgba(255,255,255,0.2)")
      }
    }));
    const perks = awakenPerks(rank);
    return React.createElement("div", { style: { marginTop: 12, paddingTop: 12, borderTop: "1px dashed rgba(244,114,182,0.35)" } },
      React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, flexWrap: "wrap", gap: 6 } },
        React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } },
          React.createElement("span", { style: { fontSize: "0.7rem", fontWeight: 900, color: "#f472b6", letterSpacing: 1 } }, "AWAKENING"),
          React.createElement("div", null, pips)
        ),
        maxed
          ? React.createElement("span", { style: { fontSize: "0.75rem", fontWeight: 900, color: "#facc15" } }, "MAX ★5")
          : React.createElement("button", {
              className: "upgrade-btn",
              style: { background: "linear-gradient(135deg,#f472b6,#e94560)", color: "#fff", padding: "6px 12px", fontSize: "0.7rem", fontWeight: 900 },
              onClick: () => awaken(skill.id)
            }, `AWAKEN • ${gemCost}💎 + $${credCost}k`)
      ),
      React.createElement("div", { style: { fontSize: "0.62rem", color: perks.length ? "#f9a8d4" : "var(--text-muted)" } },
        perks.length ? "Active: " + perks.join(" • ") : "Awaken to grant powerful passives to this skill."),
      !maxed && React.createElement("div", { style: { fontSize: "0.55rem", color: level >= reqLevel ? "#4ade80" : "#f87171", marginTop: 3, fontWeight: 700 } },
        `Next ★${rank + 1}: needs Skill LV.${reqLevel} (now LV.${level})`)
    );
  };
  // Concrete damage/heal readout for a skill at a given ability level, mirroring the
  // combat math in executeCombatSkill so players can see EXACTLY what a level does.
  const cStats = {
    atk: calculateStat(char.baseStats?.atk || 0, char.level, char, characters, "atk"),
    magicAtk: calculateStat(char.baseStats?.["magic atk"] || 0, char.level, char, characters, "magic atk"),
    def: calculateStat(char.baseStats?.def || 0, char.level, char, characters, "def"),
    hp: calculateStat(char.baseStats?.hp || 0, char.level, char, characters, "hp"),
    speed: calculateStat(char.baseStats?.speed || 0, char.level, char, characters, "speed"),
    luck: calculateStat(char.baseStats?.luck || 10, char.level, char, characters, "luck")
  };
  const estimateSkillOutput = (skill, level, awaken = 0) => {
    if (!skill || skill.type === "buff") return null;
    if (skill.type === "heal") {
      let scalingVal = cStats.atk * 0.3 + cStats.magicAtk * 1.2;
      if (skill.scalingStat === "hp") scalingVal = cStats.hp * 0.15;
      else if (skill.scalingStat === "magic_atk") scalingVal = cStats.magicAtk * 1.5;
      const sigMult = skill.signature ? SIGNATURE_BONUS.HEAL : 1;
      const amt = Math.floor(scalingVal * ((skill.power || 1) * (1 + (level - 1) * 0.05)) * sigMult);
      return { kind: "HEAL", val: amt };
    }
    const s = String(skill.scalingStat || "").toLowerCase();
    let offense = skill.damageType === "magical" ? cStats.magicAtk : cStats.atk;
    if (s === "def") offense = cStats.def;
    else if (s === "hp") offense = Math.max(1, Math.floor(cStats.hp / 12));
    else if (s === "speed") offense = Math.max(1, Math.floor(cStats.speed * 2.8));
    else if (s === "luck") offense = Math.max(1, Math.floor(cStats.luck * 10));
    else if (s.includes("magic")) offense = cStats.magicAtk;
    else if (s.includes("atk")) offense = cStats.atk;
    const sigMult = skill.signature ? SIGNATURE_BONUS.DAMAGE : 1;
    const skillPower = (skill.power || 1) * (1 + (level - 1) * 0.05) * (1 + awaken * 0.1) * sigMult;
    const dmg = Math.floor(offense * skillPower * 0.85);
    return { kind: "DMG", val: dmg };
  };
  const fmtNum = (n) => n >= 1e6 ? (n / 1e6).toFixed(1) + "M" : n >= 1e3 ? (n / 1e3).toFixed(1) + "K" : String(n);
  const renderSkillCard = (skill, slotNum) => {
    if (!skill) return null;
    const level = char.abilityLevels?.[skill.id] || 1;
    const upgradeCost = 500 * (level + 1);
    const rarityColor = SKILL_RARITY_CONFIG[skill.rarity || "Common"]?.color || "#fff";
    const statMap = {
      atk: "Attack",
      magic_atk: "Magic ATK",
      def: "Defense",
      magic_def: "Magic DEF",
      speed: "Speed",
      hp: "Max HP",
      luck: "Luck"
    };
    const scalingName = statMap[skill.scalingStat] || (skill.damageType === "magical" ? "Magic ATK" : "Attack");
    const powerLabel = skill.type === "heal" ? "Healing" : skill.type === "buff" ? "Magnitude" : "Power";
    return /* @__PURE__ */ jsxDEV("div", { className: `ability-card unlocked`, style: { borderColor: rarityColor, borderWidth: "2px", marginBottom: 20 }, children: [
      /* @__PURE__ */ jsxDEV("div", { className: "skill-slot-tag", style: { background: rarityColor, color: "#000" }, children: [
        "SLOT ",
        slotNum
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 1204,
        columnNumber: 9
      }),
      /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("div", { style: { fontWeight: 900, fontSize: "1.1rem", color: rarityColor }, children: skill.name }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 1207,
            columnNumber: 13
          }),
          /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.7rem", color: "#fff", fontWeight: 900 }, children: [
            "LV.",
            level,
            " \u2022 ",
            /* @__PURE__ */ jsxDEV("span", { style: { color: ELEMENTS[char.element].color }, children: char.element }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 1209,
              columnNumber: 28
            }),
            " \u2022 ",
            skill.rarity
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 1208,
            columnNumber: 13
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 1206,
          columnNumber: 11
        }),
        /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }, children: [
          /* @__PURE__ */ jsxDEV("button", { className: "upgrade-btn credits", onClick: () => upgrade(skill.id, "credits"), children: [
            "$",
            upgradeCost
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 1213,
            columnNumber: 13
          }),
          /* @__PURE__ */ jsxDEV("button", { className: "upgrade-btn credits", style: { opacity: 0.9 }, onClick: () => upgradeBulk(skill.id, 5), children: "×5" }, void 0, false, { fileName: "<stdin>", lineNumber: 1, columnNumber: 1 }),
          /* @__PURE__ */ jsxDEV("button", { className: "upgrade-btn credits", style: { background: "#facc15", color: "#000" }, onClick: () => upgradeBulk(skill.id, 999), children: "MAX" }, void 0, false, { fileName: "<stdin>", lineNumber: 1, columnNumber: 1 }),
          /* @__PURE__ */ jsxDEV("button", { className: "upgrade-btn", onClick: () => upgrade(skill.id, "sp"), children: "1 SP" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 1214,
            columnNumber: 13
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 1212,
          columnNumber: 11
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 1205,
        columnNumber: 9
      }),
      /* @__PURE__ */ jsxDEV("p", { style: { fontSize: "0.8rem", opacity: 0.8, marginTop: 12, lineHeight: 1.4 }, children: [
        skill.desc,
        " ",
        /* @__PURE__ */ jsxDEV("br", {}, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1218,
          columnNumber: 24
        }),
        /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", gap: 10, marginTop: 8 }, children: [
          /* @__PURE__ */ jsxDEV("span", { style: { fontSize: "0.65rem", color: "#4ade80", background: "rgba(74, 222, 128, 0.1)", padding: "2px 8px", borderRadius: 4, fontWeight: 900 }, children: [
            powerLabel,
            ": ",
            skill.power ? (skill.power * 100).toFixed(0) : 100,
            "%"
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 1220,
            columnNumber: 13
          }),
          /* @__PURE__ */ jsxDEV("span", { style: { fontSize: "0.65rem", color: "#60a5fa", background: "rgba(96, 165, 250, 0.1)", padding: "2px 8px", borderRadius: 4, fontWeight: 900 }, children: [
            "Scales: ",
            scalingName,
            " (+",
            5,
            "% per LV)"
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 1223,
            columnNumber: 13
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 1219,
          columnNumber: 11
        }),
        (() => {
          const cur = estimateSkillOutput(skill, level, char.abilityAwaken?.[skill.id] || 0);
          if (!cur) return null;
          const nxt = estimateSkillOutput(skill, level + 1, char.abilityAwaken?.[skill.id] || 0);
          const isHeal = cur.kind === "HEAL";
          const col = isHeal ? "#4ade80" : "#fca5a5";
          const delta = nxt ? nxt.val - cur.val : 0;
          return /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", alignItems: "center", gap: 8, marginTop: 10, padding: "8px 10px", borderRadius: 8, background: isHeal ? "rgba(74,222,128,0.08)" : "rgba(239,68,68,0.08)", border: `1px solid ${col}33` }, children: [
            /* @__PURE__ */ jsxDEV("span", { style: { fontSize: "0.55rem", fontWeight: 900, letterSpacing: 1, color: "var(--text-muted)" }, children: isHeal ? "HEALS" : "HITS FOR" }, void 0, false, { fileName: "<stdin>", lineNumber: 1, columnNumber: 1 }),
            /* @__PURE__ */ jsxDEV("span", { style: { fontSize: "1.1rem", fontWeight: 900, color: col }, children: ["≈ ", fmtNum(cur.val)] }, void 0, true, { fileName: "<stdin>", lineNumber: 1, columnNumber: 1 }),
            delta > 0 && /* @__PURE__ */ jsxDEV("span", { style: { fontSize: "0.6rem", fontWeight: 800, color: "#4ade80", marginLeft: "auto" }, children: ["LV.", level + 1, ": +", fmtNum(delta)] }, void 0, true, { fileName: "<stdin>", lineNumber: 1, columnNumber: 1 }),
            /* @__PURE__ */ jsxDEV("span", { style: { fontSize: "0.5rem", color: "var(--text-muted)", alignSelf: "flex-end" }, children: isHeal ? "" : "before enemy DEF" }, void 0, false, { fileName: "<stdin>", lineNumber: 1, columnNumber: 1 })
          ] }, void 0, true, { fileName: "<stdin>", lineNumber: 1, columnNumber: 1 });
        })(),
        /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", flexWrap: "wrap", gap: 5, marginTop: 8 }, children: getSkillTags(skill).map((t) => /* @__PURE__ */ jsxDEV("span", { style: {
          fontSize: "0.55rem", fontWeight: 900, padding: "2px 7px", borderRadius: 5,
          background: "rgba(168,85,247,0.12)", color: "#c084fc", letterSpacing: 0.5,
          border: "1px solid rgba(168,85,247,0.25)"
        }, children: t }, t, false, {
          fileName: "<stdin>",
          lineNumber: 1,
          columnNumber: 1
        })) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1,
          columnNumber: 1
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 1217,
        columnNumber: 9
      }),
      /* @__PURE__ */ jsxDEV("div", { style: { marginTop: 15, paddingTop: 15, borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "space-between" }, children: [
        /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.6rem", color: "var(--text-muted)" }, children: "Rates: Leg 3% | Epic 12% | Rare 35%" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1230,
          columnNumber: 11
        }),
        /* @__PURE__ */ jsxDEV("button", { className: "train-btn", style: { width: "auto", padding: "6px 12px", fontSize: "0.7rem", background: "#334155" }, onClick: () => rerollSkill(slotNum), children: [
          /* @__PURE__ */ jsxDEV(Sparkles, { size: 12, style: { marginRight: 6 } }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 1232,
            columnNumber: 14
          }),
          " REROLL (50 GEMS)"
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 1231,
          columnNumber: 11
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 1229,
        columnNumber: 9
      }),
      renderAwaken(skill)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 1203,
      columnNumber: 7
    });
  };
  const playSkillSfx = (skillObj) => {
    if (skillObj.type === "heal") playSound("heal_spell");
    else if (skillObj.type === "buff") playSound("shield_up");
    else if (skillObj.damageType === "magical") playSound("magic_blast");
    else if (skillObj.power > 2) playSound("slash_heavy");
    else playSound("attack_hit");
  };
  return /* @__PURE__ */ jsxDEV("div", { style: { padding: minimalMode ? "0" : "16px 0" }, children: [
    /* @__PURE__ */ jsxDEV("h2", { style: { fontWeight: 900, fontSize: minimalMode ? "1.1rem" : "1.5rem", marginBottom: 10 }, children: "CHARACTER SKILL" }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 1250,
      columnNumber: 7
    }),
    leader && /* @__PURE__ */ jsxDEV("div", { className: "ability-card unlocked", style: { padding: 12, marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between", borderColor: (ELEMENTS[leader.element]?.color || "#facc15") }, children: [
      /* @__PURE__ */ jsxDEV("div", { style: { flex: 1 }, children: [
        /* @__PURE__ */ jsxDEV("div", { style: { fontWeight: 900, fontSize: "1rem", color: (ELEMENTS[leader.element]?.color || "#facc15") }, children: leader.name }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1256,
          columnNumber: 13
        }),
        /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.8rem", opacity: 0.85 }, children: leader.desc }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1257,
          columnNumber: 13
        }),
        /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 6 }, children: [
          "Scope: ",
          leader.element === "NEUTRAL" ? "All Allies" : "Squad • " + leader.element + " boost"
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 1258,
          columnNumber: 13
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 1255,
        columnNumber: 11
      }),
      /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", gap: 8, marginLeft: 12 }, children: /* @__PURE__ */ jsxDEV("button", { className: "upgrade-btn", onClick: equipLeader, style: { padding: "8px 12px" }, children: "EQUIP" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 1261,
        columnNumber: 13
      }) }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 1260,
        columnNumber: 11
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 1254,
      columnNumber: 9
    }),
    /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", gap: 15, marginBottom: 20 }, children: [
      /* @__PURE__ */ jsxDEV("div", { style: { color: "#a855f7", fontWeight: 800 }, children: [
        char.skillPoints || 0,
        " SP"
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 1269,
        columnNumber: 9
      }),
      /* @__PURE__ */ jsxDEV("div", { style: { color: "#facc15", fontWeight: 800 }, children: [
        "$",
        credits.toLocaleString()
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 1270,
        columnNumber: 9
      }),
      gems !== void 0 && /* @__PURE__ */ jsxDEV("div", { style: { color: "#00d2ff", fontWeight: 800 }, children: [
        gems,
        " Gems"
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 1271,
        columnNumber: 32
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 1268,
      columnNumber: 7
    }),
    renderSignature(),
    renderSkillCard(skill1, 1),
    char.level >= 50 ? char.skillId2 ? renderSkillCard(skill2, 2) : /* @__PURE__ */ jsxDEV("div", { className: "ability-card", style: { borderStyle: "dashed", textAlign: "center", padding: "30px" }, children: [
      /* @__PURE__ */ jsxDEV("div", { style: { fontWeight: 900, color: "#facc15", marginBottom: 10 }, children: "SECOND SKILL SLOT UNLOCKED" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 1281,
        columnNumber: 19
      }),
      /* @__PURE__ */ jsxDEV("p", { style: { fontSize: "0.75rem", opacity: 0.7, marginBottom: 20 }, children: "Unlock a secondary skill to use both simultaneously in battle." }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 1282,
        columnNumber: 19
      }),
      /* @__PURE__ */ jsxDEV("button", { className: "train-btn", style: { width: "auto", padding: "10px 30px", background: "var(--gem-color)", color: "#000" }, onClick: () => rerollSkill(2), children: "ROLL SECOND SKILL (250 GEMS)" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 1283,
        columnNumber: 19
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 1280,
      columnNumber: 15
    }) : /* @__PURE__ */ jsxDEV("div", { className: "ability-card locked", style: { textAlign: "center", padding: "30px" }, children: [
      /* @__PURE__ */ jsxDEV("div", { style: { fontWeight: 900, marginBottom: 10 }, children: "SECOND SKILL SLOT" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 1290,
        columnNumber: 15
      }),
      /* @__PURE__ */ jsxDEV("p", { style: { fontSize: "0.75rem", opacity: 0.7 }, children: "Unlocks at Hero Level 50" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 1291,
        columnNumber: 15
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "bar-wrapper", style: { height: 6, width: "150px", margin: "15px auto" }, children: /* @__PURE__ */ jsxDEV("div", { className: "bar-fill", style: { background: "#334155", width: `${char.level / 50 * 100}%` } }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 1293,
        columnNumber: 19
      }) }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 1292,
        columnNumber: 15
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 1289,
      columnNumber: 11
    }),
    /* @__PURE__ */ jsxDEV("div", { className: "glass-panel", style: { marginTop: 20, padding: 15, fontSize: "0.75rem" }, children: [
      /* @__PURE__ */ jsxDEV("h4", { style: { margin: "0 0 10px 0", color: "#facc15" }, children: "Tactical Info" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 1299,
        columnNumber: 9
      }),
      /* @__PURE__ */ jsxDEV("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }, children: [
        /* @__PURE__ */ jsxDEV("div", { style: { color: "#fff" }, children: "Combo Skills provide dual benefits." }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1301,
          columnNumber: 11
        }),
        /* @__PURE__ */ jsxDEV("div", { style: { color: "#fff" }, children: "Buffs/Debuffs stack with levels." }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1302,
          columnNumber: 11
        }),
        /* @__PURE__ */ jsxDEV("div", { style: { color: "#ff4444" }, children: "Fire > Wind" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1303,
          columnNumber: 11
        }),
        /* @__PURE__ */ jsxDEV("div", { style: { color: "#4ade80" }, children: "Wind > Water" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1304,
          columnNumber: 11
        }),
        /* @__PURE__ */ jsxDEV("div", { style: { color: "#00d2ff" }, children: "Water > Fire" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1305,
          columnNumber: 11
        }),
        /* @__PURE__ */ jsxDEV("div", { style: { color: "#a97c50" }, children: "Earth > Water" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1306,
          columnNumber: 11
        }),
        /* @__PURE__ */ jsxDEV("div", { style: { color: "#4ade80" }, children: "Wind > Earth" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1307,
          columnNumber: 11
        }),
        /* @__PURE__ */ jsxDEV("div", { style: { color: "#fff" }, children: "Light <> Dark" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1308,
          columnNumber: 11
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 1300,
        columnNumber: 9
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 1298,
      columnNumber: 7
    })
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 1249,
    columnNumber: 5
  });
};;

export { AbilitiesView };
