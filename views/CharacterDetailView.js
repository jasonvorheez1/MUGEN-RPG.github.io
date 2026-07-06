import { Fragment, jsxDEV } from "react/jsx-dev-runtime";
import React, { useState, useRef, useEffect } from "react";
import {
  Heart,
  Sword,
  Zap,
  Users,
  Sparkles,
  ChevronRight,
  Gem,
  X,
  ChevronLeft,
  Clover
} from "lucide-react";
import { ELEMENTS, LEADER_SKILLS, COSMETICS, TIER_ORDER } from "../constants.js";
import { calculateStat, getBondRankName, getBondPath, playSound, calculateSubStat, formatPower, SPECIAL_STATS, SPECIAL_LABELS, SPECIAL_DESCRIPTIONS, SPECIAL_BASE, SPECIAL_CAP, getDefaultSpecial, getSpecialLevelInfo, getSpecialSpentPoints, FIELD_XP_PER_POINT } from "../utils.js";
import { AbilitiesView } from "./AbilitiesView.js";

const CharacterDetailView = ({
  char,
  characters = [],
  selectedCharIndex = 0,
  setSelectedCharIndex,
  handleTrain,
  isShaking = false,
  activeDialogue = null,
  isTypingDialogue = false,
  setIsTypingDialogue,
  setCharacters,
  triggerDialogue,
  triggerVisualEffect: triggerVisualEffect2,
  setView: setView2,
  stamina = 0,
  maxStamina = 100,
  appearanceTags = {},
  heroVibes = {},
  autoTrainLevel = 0,
  setAutoTrainLevel,
  credits = 0,
  setCredits,
  createFloatingText,
  setStamina,
  unlockedIds = [],
  combo = 0,
  hypeMeter = 0,
  isHype = false,
  totalAccountLevel = 0,
  heroMoods = {},
  setHeroMoods,
  gems = 0,
  setGems,
  aura = 0,
  setAura,
  auraUpgrades = {},
  inventory = {},
  removeFromInventory,
  skills = [],
  materials = 0,
  setMaterials,
  essence = 0,
  setEssence,
  totalPWR = 0,
  items = {}
}) => {
  // XP granted per leveling consumable (mirrors InventoryView.useItem so items
  // can be spent straight from the character screen — no trip to the Stash).
  const XP_ITEM_VALUES = {
    xp_scroll: 5e3, xp_tome: 25e3, xp_ultra_tome: 25e4, xp_omega_log: 25e6,
    xp_soul_gem: 45e6, xp_reality_script: 7e7, xp_grand_tome: 5e6,
    xp_disc: 5e3, omega_catalyst: 1e6,
    catalyst_fire: 2e4, catalyst_water: 2e4, catalyst_wind: 2e4,
    catalyst_light: 2e4, catalyst_dark: 2e4, catalyst_neutral: 25e3
  };
  const BOND_ITEM_VALUES = {
    bond_gift: 500, bond_gift_rare: 1500, bond_gift_epic: 5e3, bond_gift_legendary: 15e3
  };
  // Apply N copies of a leveling/bond item to the current hero in one shot.
  const consumeLevelingItem = (itemId, qtyRequested) => {
    const owned = inventory[itemId] || 0;
    if (owned <= 0) return;
    const qty = Math.max(1, Math.min(qtyRequested, owned));
    const idx = selectedCharIndex;
    const isBond = itemId in BOND_ITEM_VALUES;
    const meta = items[itemId] || {};
    setCharacters((prev) => {
      const next = [...prev];
      if (idx < 0 || idx >= next.length) return prev;
      const c = { ...next[idx] };
      if (isBond) {
        let per = BOND_ITEM_VALUES[itemId];
        if (meta.element && meta.element === c.element) per = Math.floor(per * 1.5);
        for (let i = 0; i < qty && c.bondLevel < 100; i++) {
          c.bondXp = (c.bondXp || 0) + per;
          while (c.bondXp >= c.nextBondXp && c.bondLevel < 100) {
            c.bondXp -= c.nextBondXp;
            c.bondLevel++;
            c.nextBondXp = 80 + c.bondLevel * 25;
          }
        }
      } else {
        let per = XP_ITEM_VALUES[itemId] || 0;
        if (itemId.startsWith("catalyst_") && meta.element === c.element) per *= 2;
        for (let i = 0; i < qty && c.level < 100; i++) {
          c.xp = (c.xp || 0) + per;
          while (c.xp >= c.nextXp && c.level < 100) {
            c.xp -= c.nextXp;
            c.level++;
            c.nextXp = Math.floor(100 * Math.pow(1.15, c.level - 1));
          }
        }
        if (c.level >= 100) { c.level = 100; c.xp = 0; }
      }
      next[idx] = c;
      return next;
    });
    if (typeof removeFromInventory === "function") removeFromInventory(itemId, qty);
    playSound("upgrade");
    createFloatingText(isBond ? `+${qty} ${meta.name || "Gift"} → Bond` : `Used ${qty}× ${meta.name || "Tome"}`, false, isBond ? "#f472b6" : "#facc15");
  };
  const [activeTab, setActiveTab] = useState("training");
  const [showSelector, setShowSelector] = useState(false);
  const [isTieringUp, setIsTieringUp] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("level");
  if (!char) return /* @__PURE__ */ jsxDEV("div", { className: "glass-panel", style: { textAlign: "center", padding: "100px 20px" }, children: [
    /* @__PURE__ */ jsxDEV(Users, { size: 48, style: { opacity: 0.2, marginBottom: 20 } }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 446,
      columnNumber: 7
    }),
    /* @__PURE__ */ jsxDEV("p", { children: "Identify a hero to begin synchronization." }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 447,
      columnNumber: 7
    }),
    /* @__PURE__ */ jsxDEV("button", { className: "train-btn", style: { width: "auto", padding: "10px 40px" }, onClick: () => setView2("roster"), children: "OPEN ROSTER" }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 448,
      columnNumber: 7
    })
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 445,
    columnNumber: 5
  });
  const handleTrainMax = (e) => {
    playSound("battle_charge", 0.3);
    const staminaCost = maxStamina * 0.05;
    const count = Math.floor(stamina / staminaCost);
    if (count <= 0) return;
    const batch = count;
    for (let i = 0; i < batch; i++) handleTrain(false, e);
  };
  const performAscension = () => {
    if (!char || char.level < 100) return;
    const currentAsc = char.ascension || 0;
    const costCredits = 25e6 * (currentAsc + 1);
    const costEssence = 1e4 * (currentAsc + 1);
    if (credits < costCredits) {
      createFloatingText(`Need $${costCredits.toLocaleString()}`, true);
      return;
    }
    if (essence < costEssence) {
      createFloatingText(`Need ${costEssence} Essence`, true);
      return;
    }
    if (confirm(`Ascend ${char.name}? Reset Level to 1, +25% Stats Permanent.
Cost: $${costCredits.toLocaleString()} & ${costEssence} Essence`)) {
      setCredits((c) => c - costCredits);
      setEssence((e) => e - costEssence);
      setCharacters((prev) => {
        const next = [...prev];
        const idx = next.findIndex((c2) => c2.export_id === char.export_id);
        if (idx === -1) return prev;
        const c = { ...next[idx] };
        c.level = 1;
        c.xp = 0;
        c.nextXp = 100;
        c.ascension = (c.ascension || 0) + 1;
        next[idx] = c;
        return next;
      });
      playSound("summon_reveal");
      createFloatingText("ASCENSION COMPLETE!", false, "#facc15");
      triggerVisualEffect2("fx_powerup.png", "50%", "50%", 2);
    }
  };
  const estimateTrainGain = () => {
    if (!char) return { xp: 0, credits: 0, staminaMultiplier: 1, relMult: 1, moodMult: 1, auraXpMult: 1, mood: 50 };
    const staminaPercent = stamina / maxStamina * 100;
    const staminaMultiplier = staminaPercent > 90 ? 3.5 : staminaPercent > 70 ? 2 : staminaPercent < 15 ? 0.2 : 1;
    let relMult = 1;
    const rel = char.relationship || "Neutral";
    if (rel.includes("Romantic")) { relMult = 1.1 + char.bondLevel / 100 * 0.2; if (char.bondLevel >= 15) relMult += 0.2; }
    else if (rel.includes("Friend")) relMult = 1.1 + char.bondLevel / 100 * 0.3;
    else if (rel.includes("Enemy")) relMult = 0.9 + char.bondLevel / 100 * 0.2;
    const auraXpMult = 1 + ((auraUpgrades && auraUpgrades.xp) || 0) * 0.15;
    const mood = (heroMoods && heroMoods[char.export_id]) || 50;
    const moodMult = mood >= 80 ? 1.3 : 0.8 + mood / 100 * 0.4;
    const xp = Math.floor((400 + Math.floor(char.level * 22)) * staminaMultiplier * relMult * auraXpMult * moodMult);
    const credits = Math.floor(60 * staminaMultiplier * relMult);
    return { xp, credits, staminaMultiplier, relMult, moodMult, auraXpMult, mood };
  };
  const trainBatch = (n, e) => {
    if (n <= 0) return;
    for (let i = 0; i < n; i++) handleTrain(false, e);
  };
  // SPECIAL BUILD (Courier-exclusive): Fallout-style 7-stat allocation with
  // its own "Field Experience" leveling track (battles fought, not char XP/level).
  const isSpecialEligible = char.name === "Courier";
  const setSpecialPoint = (statKey, delta) => {
    const current = char.special || getDefaultSpecial();
    const info = getSpecialLevelInfo(char.courierFieldBattles || 0);
    const spent = getSpecialSpentPoints(current);
    const newVal = (current[statKey] ?? SPECIAL_BASE) + delta;
    if (newVal < SPECIAL_BASE || newVal > SPECIAL_CAP) return;
    if (delta > 0 && spent >= info.totalPoints) {
      createFloatingText("No SPECIAL points available -- win more battles!", true);
      return;
    }
    setCharacters((prev) => prev.map((c) => c.export_id === char.export_id ? { ...c, special: { ...current, [statKey]: newVal } } : c));
    playSound(delta > 0 ? "ui_select" : "ui_cancel", 0.3);
  };
  const renderSpecialTab = () => {
    const special = char.special || getDefaultSpecial();
    const info = getSpecialLevelInfo(char.courierFieldBattles || 0);
    const spent = getSpecialSpentPoints(special);
    const available = info.totalPoints - spent;
    const h = React.createElement;
    return h("div", { className: "animate-fadeIn", style: { padding: "10px 0" } },
      h("div", { className: "glass-panel", style: { padding: 16, marginBottom: 16, border: "1px solid rgba(168, 85, 247, 0.4)" } },
        h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 } },
          h("div", { style: { fontSize: "0.7rem", fontWeight: 900, color: "#a855f7", letterSpacing: 1 } }, "FIELD EXPERIENCE"),
          h("div", { style: { fontSize: "0.9rem", fontWeight: 900, color: "#fff" } }, `LV. ${info.level}${info.maxed ? " (MAX)" : ""}`)
        ),
        h("div", { className: "tech-progress-bar", style: { width: "100%", height: 8, background: "rgba(255,255,255,0.05)", marginBottom: 6 } },
          h("div", { className: "tech-progress-fill", style: { width: `${info.maxed ? 100 : info.battlesIntoLevel / info.battlesForNext * 100}%`, background: "#a855f7" } })
        ),
        h("div", { style: { fontSize: "0.65rem", color: "var(--text-muted)" } },
          info.maxed ? "Field Experience maxed out." : `${info.battlesIntoLevel} / ${info.battlesForNext} battles fielded toward next SPECIAL point`
        ),
        h("div", { style: { fontSize: "0.65rem", color: "#facc15", fontWeight: 800, marginTop: 8 } },
          `${available} POINT${available === 1 ? "" : "S"} AVAILABLE (respec any time, free)`
        )
      ),
      h("div", { style: { display: "flex", flexDirection: "column", gap: 10 } },
        SPECIAL_STATS.map((key) => {
          const val = special[key] ?? SPECIAL_BASE;
          return h("div", { key, className: "glass-panel", style: { padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 } },
            h("div", { style: { flex: 1, minWidth: 0 } },
              h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "baseline" } },
                h("div", { style: { fontSize: "0.8rem", fontWeight: 900, color: "#fff" } }, `${SPECIAL_LABELS[key]} (${key.toUpperCase()})`),
                h("div", { style: { fontSize: "0.75rem", fontWeight: 900, color: "#a855f7" } }, `${val} / ${SPECIAL_CAP}`)
              ),
              h("div", { style: { fontSize: "0.6rem", color: "var(--text-muted)", marginTop: 2 } }, SPECIAL_DESCRIPTIONS[key]),
              h("div", { className: "tech-progress-bar", style: { width: "100%", height: 5, background: "rgba(255,255,255,0.05)", marginTop: 6 } },
                h("div", { className: "tech-progress-fill", style: { width: `${(val - SPECIAL_BASE) / (SPECIAL_CAP - SPECIAL_BASE) * 100}%`, background: "#facc15" } })
              )
            ),
            h("div", { style: { display: "flex", flexDirection: "column", gap: 4 } },
              h("button", { className: "sb-icon-btn", style: { width: 28, height: 28 }, disabled: val >= SPECIAL_CAP || available <= 0, onClick: () => setSpecialPoint(key, 1) }, "+"),
              h("button", { className: "sb-icon-btn", style: { width: 28, height: 28 }, disabled: val <= SPECIAL_BASE, onClick: () => setSpecialPoint(key, -1) }, "-")
            )
          );
        })
      )
    );
  };
  const renderTrainingTab = () => {
    const h = React.createElement;
    const est = estimateTrainGain();
    const pwr = calculateSubStat(char, characters, "pwr", skills, auraUpgrades);
    const xpPct = Math.min(100, char.xp / char.nextXp * 100);
    const stamPct = Math.min(100, stamina / maxStamina * 100);
    const singleCost = Math.max(1, Math.round(maxStamina * 0.1));
    const dumpCost = Math.max(1, maxStamina * 0.05);
    const availTrains = Math.floor(stamina / singleCost);
    const trainsToLevel = Math.max(1, Math.ceil((char.nextXp - char.xp) / Math.max(1, est.xp)));
    const toLevelN = Math.min(trainsToLevel, Math.floor(stamina / dumpCost));
    const isMaxed = char.level >= 100;
    const canTrain = stamina >= maxStamina * 0.05;
    const freshColor = est.staminaMultiplier >= 2 ? "#4ade80" : est.staminaMultiplier >= 1 ? "#facc15" : "#ef4444";
    const moodColor = est.mood >= 80 ? "#f472b6" : est.mood >= 40 ? "#facc15" : "#ef4444";
    const chip = (label, value, color) => h("div", { key: label, style: { flex: "1 1 0", minWidth: 64, background: "rgba(0,0,0,0.35)", border: "1px solid " + color + "44", borderRadius: 10, padding: "6px 4px", textAlign: "center" } },
      h("div", { style: { fontSize: "0.5rem", fontWeight: 900, letterSpacing: 1, color: "var(--text-muted)", textTransform: "uppercase" } }, label),
      h("div", { style: { fontSize: "0.85rem", fontWeight: 900, color } }, value)
    );
    const bar = (label, pct, fillColor, valueText) => h("div", { style: { marginBottom: 10 } },
      h("div", { style: { display: "flex", justifyContent: "space-between", fontSize: "0.6rem", fontWeight: 900, letterSpacing: 1, marginBottom: 3 } },
        h("span", { style: { color: "var(--text-muted)" } }, label),
        h("span", { style: { color: fillColor } }, valueText)
      ),
      h("div", { style: { height: 12, background: "rgba(0,0,0,0.5)", borderRadius: 6, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" } },
        h("div", { style: { width: pct + "%", height: "100%", background: fillColor, transition: "width 0.3s cubic-bezier(0.16,1,0.3,1)", boxShadow: "0 0 10px " + fillColor } })
      )
    );
    return h("div", { className: "animate-fadeIn" },
      // Header: level badge + PWR
      h("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, gap: 12 } },
        h("div", { style: { display: "flex", alignItems: "center", gap: 10 } },
          h("div", { style: { width: 58, height: 58, borderRadius: 14, background: "linear-gradient(135deg, var(--primary), #7f1d3a)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(233,69,96,0.4)", flexShrink: 0 } },
            h("div", { style: { fontSize: "0.5rem", fontWeight: 900, opacity: 0.8, letterSpacing: 1 } }, "LEVEL"),
            h("div", { style: { fontSize: "1.5rem", fontWeight: 900, lineHeight: 1, fontFamily: "Rajdhani, sans-serif" } }, char.level)
          ),
          h("div", null,
            (char.ascension || 0) > 0 ? h("div", { style: { fontSize: "0.7rem", fontWeight: 900, color: "#facc15" } }, "★ ASCENSION " + char.ascension) : null,
            h("div", { style: { fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 700 } }, isMaxed ? "MAX LEVEL — ready to Ascend" : "Next: LV " + (char.level + 1))
          )
        ),
        h("div", { style: { textAlign: "right" } },
          h("div", { style: { fontSize: "0.5rem", fontWeight: 900, color: "var(--text-muted)", letterSpacing: 1 } }, "POWER"),
          h("div", { style: { fontSize: "1.1rem", fontWeight: 900, color: "#facc15" } }, formatPower(pwr))
        )
      ),
      // Bars
      bar("EXP", xpPct, "#f472b6", Math.floor(char.xp).toLocaleString() + " / " + Math.floor(char.nextXp).toLocaleString() + " (" + Math.floor(xpPct) + "%)"),
      bar("STAMINA", stamPct, "#4ade80", Math.floor(stamina) + " / " + maxStamina + "  • ~" + singleCost + "/train"),
      // Multiplier breakdown
      h("div", { style: { display: "flex", gap: 6, marginTop: 10, marginBottom: 10, flexWrap: "wrap" } },
        chip("Freshness", "×" + est.staminaMultiplier.toFixed(1), freshColor),
        chip("Mood", "×" + est.moodMult.toFixed(2), moodColor),
        chip("Bond", "×" + est.relMult.toFixed(2), "#a855f7"),
        chip("Aura XP", "×" + est.auraXpMult.toFixed(2), "#60a5fa")
      ),
      // Gain preview
      h("div", { style: { background: "rgba(244,114,182,0.08)", border: "1px solid rgba(244,114,182,0.25)", borderRadius: 10, padding: "8px 12px", marginBottom: 12, fontSize: "0.7rem", fontWeight: 700, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 6 } },
        h("span", null, "≈ ", h("span", { style: { color: "#f472b6", fontWeight: 900 } }, "+" + est.xp.toLocaleString() + " XP"), " / train"),
        h("span", { style: { color: "var(--text-muted)" } }, isMaxed ? "—" : "~" + trainsToLevel + " trains to LV " + (char.level + 1))
      ),
      est.staminaMultiplier >= 2 ? h("div", { style: { textAlign: "center", fontSize: "0.6rem", color: "#4ade80", fontWeight: 800, marginBottom: 10 } }, "⚡ FRESH BONUS ACTIVE — train now for " + est.staminaMultiplier.toFixed(1) + "× XP!") : null,
      // Primary action
      isMaxed
        ? h("button", { className: "big-train-btn", style: { background: "linear-gradient(135deg, #facc15, #eab308)", boxShadow: "0 4px 0 #b45309", width: "100%" }, onClick: performAscension },
            h(Sparkles, { size: 22 }),
            h("div", { style: { display: "flex", flexDirection: "column", lineHeight: 1 } },
              h("span", null, "ASCEND"),
              h("span", { style: { fontSize: "0.6rem", opacity: 0.8 } }, "RANK " + ((char.ascension || 0) + 1))
            ))
        : h("button", { className: "big-train-btn", style: { width: "100%" }, onClick: (e) => handleTrain(false, e), disabled: !canTrain },
            h(Sword, { size: 22 }), " ", h("span", null, "TRAIN")),
      // Secondary actions
      !isMaxed ? h("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginTop: 8 } },
        h("button", { className: "sub-train-btn", onClick: (e) => trainBatch(Math.min(10, availTrains), e),  disabled: availTrains < 1  }, "×10"),
        h("button", { className: "sub-train-btn", onClick: (e) => trainBatch(Math.min(50, availTrains), e),  disabled: availTrains < 1  }, "×50"),
        h("button", { className: "sub-train-btn", onClick: (e) => trainBatch(toLevelN, e),                   disabled: !canTrain        }, "→ LV"),
        h("button", { className: "sub-train-btn", onClick: handleTrainMax,                                    disabled: !canTrain        }, "MAX")
      ) : null,
      h("button", { className: "sub-train-btn " + (autoTrainLevel > 0 ? "active" : ""), style: { width: "100%", marginTop: 8 }, onClick: () => setAutoTrainLevel((l) => l >= 20 ? 0 : l + 1) },
        h(Zap, { size: 14, style: { marginRight: 6 } }),
        autoTrainLevel > 0 ? "AUTO ×" + autoTrainLevel + "/s — tap to raise / stop" : "ENABLE AUTO-TRAIN"),
      // Leveling items — spend XP tomes / catalysts straight from here, no stamina,
      // with a one-tap USE ALL for mass leveling toward 100.
      (() => {
        const ownedXp = Object.keys(XP_ITEM_VALUES).filter((id) => (inventory[id] || 0) > 0);
        const ownedBond = Object.keys(BOND_ITEM_VALUES).filter((id) => (inventory[id] || 0) > 0);
        if (ownedXp.length === 0 && ownedBond.length === 0) {
          return h("div", { style: { marginTop: 12, padding: "10px 12px", borderRadius: 10, background: "rgba(0,0,0,0.25)", border: "1px dashed rgba(255,255,255,0.12)", fontSize: "0.62rem", color: "var(--text-muted)", textAlign: "center" } },
            "No leveling items — win Campaign raids & Events to earn XP Tomes, then spend them here instantly.");
        }
        const row = (id, tint) => {
          const meta = items[id] || {};
          const qty = inventory[id] || 0;
          const isBond = id in BOND_ITEM_VALUES;
          const per = isBond ? BOND_ITEM_VALUES[id] : XP_ITEM_VALUES[id];
          const capped = isBond ? char.bondLevel >= 100 : char.level >= 100;
          return h("div", { key: id, style: { display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 8, background: "rgba(0,0,0,0.3)", marginBottom: 6, opacity: capped ? 0.5 : 1 } },
            meta.imageUrl ? h("img", { src: meta.imageUrl, style: { width: 30, height: 30, borderRadius: 6, objectFit: "cover", flexShrink: 0 } }) : h("div", { style: { width: 30, height: 30, borderRadius: 6, background: tint + "33", flexShrink: 0 } }),
            h("div", { style: { flex: 1, minWidth: 0 } },
              h("div", { style: { fontSize: "0.68rem", fontWeight: 900, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, (meta.name || id) + " ×" + qty),
              h("div", { style: { fontSize: "0.55rem", color: tint, fontWeight: 700 } }, isBond ? "+" + per.toLocaleString() + " Bond ea." : "+" + per.toLocaleString() + " XP ea.")
            ),
            h("button", { className: "sub-train-btn", style: { width: "auto", padding: "5px 10px", fontSize: "0.6rem" }, disabled: capped, onClick: () => consumeLevelingItem(id, 1) }, "USE"),
            h("button", { className: "sub-train-btn", style: { width: "auto", padding: "5px 10px", fontSize: "0.6rem", background: tint, color: "#000" }, disabled: capped, onClick: () => consumeLevelingItem(id, qty) }, "ALL")
          );
        };
        return h("div", { style: { marginTop: 14 } },
          h("div", { style: { fontSize: "0.6rem", fontWeight: 900, letterSpacing: 1, color: "var(--text-muted)", marginBottom: 6 } }, "⚡ LEVELING ITEMS — SPEND HERE"),
          ...ownedXp.map((id) => row(id, "#facc15")),
          ...ownedBond.map((id) => row(id, "#f472b6"))
        );
      })(),
      // Bond mini section
      h("div", { style: { marginTop: 16, padding: 12, borderRadius: 12, background: "rgba(244,114,182,0.06)", border: "1px solid rgba(244,114,182,0.2)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 } },
        h("div", { style: { display: "flex", alignItems: "center", gap: 8 } },
          h(Heart, { size: 16, color: "#f472b6", fill: "#f472b6" }),
          h("div", null,
            h("div", { style: { fontSize: "0.7rem", fontWeight: 900, color: "#f472b6" } }, "BOND " + char.bondLevel),
            h("div", { style: { fontSize: "0.55rem", color: "var(--text-muted)" } }, getBondRankName(char.bondLevel, char.relationship))
          )
        ),
        h("button", { className: "train-btn", style: { width: "auto", padding: "8px 16px", fontSize: "0.7rem", background: "rgba(244,114,182,0.2)", border: "1px solid #f472b6", color: "#f472b6" }, onClick: () => setView2("lounge") }, "LOUNGE →")
      )
    );
  };
  const refineStat = (stat, isBulk = false) => {
    if (!char) return;
    const statsToRefine = stat === "all" ? ["hp", "atk", "def", "speed", "magic atk", "magic def", "luck"] : [stat];
    let totalCreditsCost = 0;
    let totalMaterialsCost = 0;
    statsToRefine.forEach((s) => {
      const currentRefine = char.refinements && char.refinements[s] || 0;
      totalCreditsCost += Math.floor(5e4 * Math.pow(1.4, currentRefine));
      totalMaterialsCost += Math.floor(2500 * Math.pow(1.6, currentRefine));
    });
    if (credits < totalCreditsCost) {
      createFloatingText(`Need $${totalCreditsCost.toLocaleString()}`, true);
      return;
    }
    if (materials < totalMaterialsCost) {
      createFloatingText(`Need ${totalMaterialsCost} Materials`, true);
      return;
    }
    setCredits((c) => c - totalCreditsCost);
    setMaterials((s) => s - totalMaterialsCost);
    setCharacters((prev) => {
      const next = [...prev];
      const idx = prev.findIndex((c2) => c2.export_id === char.export_id);
      if (idx === -1) return prev;
      const c = { ...next[idx] };
      c.refinements = { ...c.refinements || {} };
      statsToRefine.forEach((s) => {
        c.refinements[s] = (c.refinements[s] || 0) + 1;
      });
      next[idx] = c;
      return next;
    });
    playSound(isBulk ? "levelup" : "upgrade");
    createFloatingText(isBulk ? "ALL STATS REFINED!" : `Refined ${stat.toUpperCase()}!`, false, "#4ade80");
  };
  const refineTier = () => {
    if (!char || isTieringUp) return;
    const curTier = String(char.tier || char.suggestedTier || "C").trim().toUpperCase();
    if (curTier === "SS") return;
    const currentTierIdx = TIER_ORDER.indexOf(curTier);
    if (currentTierIdx === -1 || currentTierIdx >= TIER_ORDER.length - 1) {
      console.error("Invalid Tier state:", curTier);
      return;
    }
    const nextTier = TIER_ORDER[currentTierIdx + 1];
    const costCr = Math.floor(15e5 * Math.pow(1.35, currentTierIdx));
    const costMaterials = Math.floor(15e4 * Math.pow(1.3, currentTierIdx));
    const costEss = currentTierIdx >= 10 ? Math.floor(2500 * Math.pow(1.2, currentTierIdx - 10)) : 0;
    const costGems = currentTierIdx >= 15 ? Math.floor(5e3 * Math.pow(1.25, currentTierIdx - 15)) : 0;
    if (credits < costCr) {
      createFloatingText(`Need $${costCr.toLocaleString()}`, true);
      return;
    }
    if (materials < costMaterials) {
      createFloatingText(`Need ${costMaterials.toLocaleString()} Materials`, true);
      return;
    }
    if (essence < costEss) {
      createFloatingText(`Need ${costEss.toLocaleString()} Essence`, true);
      return;
    }
    if (gems < costGems) {
      createFloatingText(`Need ${costGems.toLocaleString()} Gems`, true);
      return;
    }
    if (!confirm(`Tier Resonance: Upgrade ${char.name} from ${curTier} to ${nextTier}?

Costs:
- $${costCr.toLocaleString()}
- ${costMaterials.toLocaleString()} Materials
${costEss > 0 ? `- ${costEss} Essence
` : ""}${costGems > 0 ? `- ${costGems} Gems
` : ""}`)) return;
    setIsTieringUp(true);
    playSound("battle_charge", 0.5);
    playSound("riser", 0.4);
    setTimeout(() => {
      setCredits((c) => c - costCr);
      setMaterials((s) => s - costMaterials);
      setEssence((e) => e - costEss);
      setGems((g) => g - costGems);
      setCharacters((prev) => {
        const next = [...prev];
        const idx = next.findIndex((c2) => c2.export_id === char.export_id);
        if (idx === -1) return prev;
        const c = { ...next[idx] };
        c.tier = nextTier;
        c.suggestedTier = nextTier;
        c.refinements = { ...c.refinements || {} };
        c.refinements.hp = (c.refinements.hp || 0) + 2;
        c.refinements.atk = (c.refinements.atk || 0) + 1;
        c.refinements.def = (c.refinements.def || 0) + 1;
        next[idx] = c;
        return next;
      });
      playSound("gacha_epic", 0.8);
      playSound("explosion", 0.5);
      triggerVisualEffect2("fx_powerup.png", "50%", "40%", 2);
      triggerVisualEffect2("fx_star_pop.png", "50%", "40%", 1.5);
    }, 1200);
    setTimeout(() => {
      setIsTieringUp(false);
      playSound("unlock", 0.6);
      createFloatingText(`RESONANCE COMPLETE: ${nextTier}!`, false, "#facc15");
      triggerDialogue(char, `I can feel the resonance... My core has evolved to Tier ${nextTier}. I'm ready for the next level of training.`, true);
    }, 2800);
  };
  const elementColor = ELEMENTS[char.element]?.color || "var(--primary)";
  const bgGradient = `linear-gradient(to bottom, rgba(5,5,10,0), rgba(5,5,10,1)), radial-gradient(circle at 50% 30%, ${elementColor}33 0%, transparent 60%)`;
  const prevAuraRef = useRef(aura);
  useEffect(() => {
    if (typeof aura === "undefined") return;
    if (prevAuraRef.current === aura) return;
    try {
      if (typeof triggerVisualEffect2 === "function") triggerVisualEffect2("fx_powerup.png", "50%", "10%", 1.2);
      if (typeof createFloatingText === "function") createFloatingText(`AURA: +${aura - (prevAuraRef.current || 0)}`, false, "#a855f7");
    } catch (e) {
    }
    prevAuraRef.current = aura;
  }, [aura]);
  const filteredCharacters = characters.filter((c) => unlockedIds.includes(c.export_id)).filter((c) => c.name.toLowerCase().includes(searchTerm.toLowerCase())).sort((a, b) => (b.level || 1) - (a.level || 1));
  const cycleHero = (dir) => {
    const unlocked = characters.filter((c) => unlockedIds.includes(c.export_id));
    const currentIndex = unlocked.findIndex((c) => c.export_id === char.export_id);
    if (currentIndex === -1) return;
    let nextIdx = (currentIndex + dir + unlocked.length) % unlocked.length;
    const nextChar = unlocked[nextIdx];
    setSelectedCharIndex(characters.indexOf(nextChar));
    playSound("ui_select", 0.2);
  };
  const [cosmeticTab, setCosmeticTab] = useState("aura");
  const unlockedCosmetics = char.unlockedCosmetics || { auras: ["none"], borders: ["default"], titles: ["none"] };
  const activeCosmetics = char.activeCosmetics || { aura: "none", border: "default", title: "none" };
  const activeAuraConfig = COSMETICS.AURAS.find((a) => a.id === activeCosmetics.aura) || COSMETICS.AURAS[0];
  const activeBorderConfig = COSMETICS.BORDERS.find((b) => b.id === activeCosmetics.border) || COSMETICS.BORDERS[0];
  const AURA_ASSET_MAP = {
    "burning_spirit": "fx_powerup.png",
    "electric_charge": "fx_sparkle.png",
    "void_mist": "fx_portal.png",
    "angelic_halo": "fx_magic_circle.png",
    "frozen_soul": "fx_sparkle.png",
    "dragon_breath": "fx_powerup.png",
    "cyber_pulse": "fx_magic_circle.png",
    "celestial_grace": "fx_star_pop.png",
    "glitch_field": "fx_portal.png",
    "shadow_form": "fx_portal.png",
    "neon_pulse": "fx_sparkle.png",
    "midas_touch": "fx_powerup.png",
    "none": null
  };
  const activeTitleConfig = COSMETICS.TITLES.find((t) => t.id === activeCosmetics.title) || COSMETICS.TITLES[0];
  const handleUnlockCosmetic = (type, item) => {
    const typeKey = type === "aura" ? "auras" : type === "border" ? "borders" : "titles";
    const cost = item.cost;
    if (cost.credits && credits < cost.credits) {
      createFloatingText(`Need $${cost.credits.toLocaleString()}`, true);
      return;
    }
    if (cost.gems && gems < cost.gems) {
      createFloatingText(`Need ${cost.gems} Gems`, true);
      return;
    }
    if (cost.materials) {
      const curMaterials = parseInt(localStorage.getItem("mugen_materials") || "0", 10);
      if (curMaterials < cost.materials) {
        createFloatingText(`Need ${cost.materials} Materials`, true);
        return;
      }
    }
    if (cost.essence) {
      const curEssence = parseInt(localStorage.getItem("mugen_essence") || "0", 10);
      if (curEssence < cost.essence) {
        createFloatingText(`Need ${cost.essence} Essence`, true);
        return;
      }
    }
    if (cost.credits) setCredits((c) => c - cost.credits);
    if (cost.gems) setGems((g) => g - cost.gems);
    if (cost.materials) {
      const curMaterials = parseInt(localStorage.getItem("mugen_materials") || "0", 10);
      localStorage.setItem("mugen_materials", String(curMaterials - cost.materials));
      window.dispatchEvent(new CustomEvent("mugen_materials_changed", { detail: { materials: curMaterials - cost.materials } }));
    }
    if (cost.essence) {
      const curEssence = parseInt(localStorage.getItem("mugen_essence") || "0", 10);
      localStorage.setItem("mugen_essence", String(curEssence - cost.essence));
      window.dispatchEvent(new CustomEvent("mugen_materials_changed", { detail: { essence: curEssence - cost.essence } }));
    }
    setCharacters((prev) => {
      const next = [...prev];
      const idx = next.findIndex((c2) => c2.export_id === char.export_id);
      const c = { ...next[idx] };
      c.unlockedCosmetics = {
        ...c.unlockedCosmetics,
        [typeKey]: [...c.unlockedCosmetics?.[typeKey] || [], item.id]
      };
      if (type === "border") {
        c.refinements = { ...c.refinements || {} };
        c.refinements.hp = (c.refinements.hp || 0) + 1;
        c.refinements.atk = (c.refinements.atk || 0) + 1;
        c.refinements.def = (c.refinements.def || 0) + 1;
        c.bondPath = c.bondPath || getBondPath(c.bondLevel, c.relationship);
      }
      next[idx] = c;
      return next;
    });
    playSound("unlock");
    createFloatingText(type === "border" ? "BORDER UNLOCKED \u2022 STATS UPDATED" : "UNLOCKED!", false, type === "border" ? "#facc15" : "#4ade80");
  };
  const handleEquipCosmetic = (type, itemId) => {
    setCharacters((prev) => {
      const next = [...prev];
      const idx = next.findIndex((c2) => c2.export_id === char.export_id);
      const c = { ...next[idx] };
      c.activeCosmetics = { ...c.activeCosmetics, [type]: itemId };
      next[idx] = c;
      return next;
    });
    playSound("equip");
  };
  const isMobile2 = window.innerWidth <= 768;
  return /* @__PURE__ */ jsxDEV("div", { className: "hero-dashboard-overhaul animate-fadeIn", children: [
    /* @__PURE__ */ jsxDEV("div", { className: `hero-visual-section aero-glass ${activeBorderConfig.className}`, style: {
      position: "relative",
      borderRadius: isMobile2 ? "0 0 32px 32px" : "24px",
      border: "1px solid rgba(255,255,255,0.4)"
    }, children: [
      /* @__PURE__ */ jsxDEV("div", { className: "hero-art-bg", style: { background: bgGradient } }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 742,
        columnNumber: 9
      }),
      /* @__PURE__ */ jsxDEV("div", { style: { position: "relative", width: "100%", display: "flex", justifyContent: "center", alignItems: "center" }, children: [
        activeCosmetics.aura && activeCosmetics.aura !== "none" && /* @__PURE__ */ jsxDEV(
          "img",
          {
            src: AURA_ASSET_MAP[activeCosmetics.aura] || "fx_powerup.png",
            alt: `${activeCosmetics.aura}-aura`,
            className: "aura-overlay",
            style: { ...activeAuraConfig.style || {} },
            "aria-hidden": "true"
          },
          void 0,
          false,
          {
            fileName: "<stdin>",
            lineNumber: 746,
            columnNumber: 17
          }
        ),
        /* @__PURE__ */ jsxDEV(
          "img",
          {
            src: char.imageUrl,
            className: `hero-full-art hero-breath ${isShaking ? "shake-effect" : ""}`,
            style: { transition: "all 0.5s ease", position: "relative", zIndex: 3 },
            alt: char.name,
            onClick: () => triggerDialogue(char, "poke")
          },
          void 0,
          false,
          {
            fileName: "<stdin>",
            lineNumber: 754,
            columnNumber: 13
          }
        )
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 743,
        columnNumber: 9
      }),
      activeDialogue && /* @__PURE__ */ jsxDEV("div", { className: "hero-chat-bubble animate-popIn", children: [
        activeDialogue.text,
        /* @__PURE__ */ jsxDEV("div", { className: "chat-tail" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 767,
          columnNumber: 17
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 765,
        columnNumber: 13
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "hero-header-overlay", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "hero-identity", children: [
          activeTitleConfig.id !== "none" && /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.9rem", color: "#facc15", fontWeight: 900, textTransform: "uppercase", marginBottom: 0, textShadow: "0 0 10px rgba(0,0,0,0.8)" }, children: activeTitleConfig.text }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 774,
            columnNumber: 21
          }),
          /* @__PURE__ */ jsxDEV("h1", { className: "hero-name-large", children: char.name }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 778,
            columnNumber: 17
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "hero-franchise-tag", children: [
            /* @__PURE__ */ jsxDEV(Sparkles, { size: 12 }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 779,
              columnNumber: 53
            }),
            " ",
            char.franchise
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 779,
            columnNumber: 17
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 772,
          columnNumber: 13
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "hero-badges", style: { flexWrap: "wrap", alignItems: "center", gap: 8 }, children: [
          /* @__PURE__ */ jsxDEV("div", { className: "badge-pill", style: { borderColor: elementColor, color: elementColor }, children: char.element }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 782,
            columnNumber: 17
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "badge-pill", children: [
            "TIER ",
            char.tier || "C"
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 783,
            columnNumber: 17
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "badge-pill", children: [
            "PWR ",
            calculateSubStat(char, characters, "pwr", skills, auraUpgrades).toLocaleString()
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 784,
            columnNumber: 17
          }),
          char.ascension > 0 && /* @__PURE__ */ jsxDEV("div", { className: "badge-pill", style: { borderColor: "#facc15", color: "#facc15", fontWeight: 900 }, children: [
            "ASCENSION ",
            char.ascension
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 786,
            columnNumber: 19
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "badge-pill", title: "Account Aura", style: { borderColor: "#a855f7", color: "#a855f7", display: "flex", alignItems: "center", gap: 6 }, children: [
            /* @__PURE__ */ jsxDEV(Sparkles, { size: 12, color: "#a855f7" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 791,
              columnNumber: 19
            }),
            " ",
            typeof aura !== "undefined" ? `AURA ${aura}` : "AURA -"
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 790,
            columnNumber: 17
          }),
          char.bondLevel >= 5 && /* @__PURE__ */ jsxDEV("div", { className: "badge-pill", style: { borderColor: "#f472b6", color: "#f472b6", textTransform: "uppercase" }, children: char.bondPath || getBondPath(char.bondLevel, char.relationship) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 794,
            columnNumber: 19
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 781,
          columnNumber: 13
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 771,
        columnNumber: 9
      }),
      /* @__PURE__ */ jsxDEV("button", { className: "swap-hero-fab", onClick: () => setShowSelector(true), children: /* @__PURE__ */ jsxDEV(Users, { size: 20 }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 801,
        columnNumber: 81
      }) }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 801,
        columnNumber: 9
      }),
      unlockedIds.length > 1 && /* @__PURE__ */ jsxDEV(Fragment, { children: [
        /* @__PURE__ */ jsxDEV("button", { className: "hero-cycle-btn prev", onClick: (e) => {
          e.stopPropagation();
          cycleHero(-1);
        }, children: /* @__PURE__ */ jsxDEV(ChevronLeft, { size: 24 }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 805,
          columnNumber: 114
        }) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 805,
          columnNumber: 17
        }),
        /* @__PURE__ */ jsxDEV("button", { className: "hero-cycle-btn next", onClick: (e) => {
          e.stopPropagation();
          cycleHero(1);
        }, children: /* @__PURE__ */ jsxDEV(ChevronRight, { size: 24 }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 806,
          columnNumber: 113
        }) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 806,
          columnNumber: 17
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 804,
        columnNumber: 13
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 737,
      columnNumber: 7
    }),
    isTieringUp && /* @__PURE__ */ jsxDEV("div", { className: "tier-up-cinematic-overlay", style: { background: "rgba(0,0,0,0.85)", backdropFilter: "blur(20px)" }, children: [
      /* @__PURE__ */ jsxDEV("div", { className: "anime-speed-lines", style: { opacity: 0.4 } }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 814,
        columnNumber: 15
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "orbital-rings", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "ring ring-1" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 816,
          columnNumber: 19
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "ring ring-2" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 817,
          columnNumber: 19
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "ring ring-3" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 818,
          columnNumber: 19
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 815,
        columnNumber: 15
      }),
      /* @__PURE__ */ jsxDEV("div", { style: { textAlign: "center", zIndex: 100 }, children: [
        /* @__PURE__ */ jsxDEV("div", { className: "glitch-text", "data-text": "EVOLVING CORE", style: { fontSize: "1.2rem", color: "#facc15", letterSpacing: 8, marginBottom: 20 }, children: "EVOLVING CORE" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 821,
          columnNumber: 19
        }),
        /* @__PURE__ */ jsxDEV("img", { src: char.imageUrl, style: { width: 220, height: 220, borderRadius: "50%", border: "4px solid #fff", boxShadow: "0 0 50px #fff" }, className: "hero-breath" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 822,
          columnNumber: 19
        }),
        /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "4rem", fontWeight: 900, color: "#fff", marginTop: 20, fontFamily: "MugenTitle" }, className: "animate-popIn", children: "RESONANCE" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 823,
          columnNumber: 19
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 820,
        columnNumber: 15
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 813,
      columnNumber: 11
    }),
    /* @__PURE__ */ jsxDEV("div", { className: "hero-control-deck glass-panel aero-glass", style: {
      borderRadius: isMobile2 ? "32px 32px 0 0" : "24px",
      boxShadow: "0 -10px 50px rgba(0,0,0,0.8)"
    }, children: [
      /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }, children: [
        /* @__PURE__ */ jsxDEV("span", { style: { fontSize: "0.65rem", fontWeight: 900, color: "var(--text-muted)" }, children: "HERO CORE SYNC" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 834,
          columnNumber: 13
        }),
        /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", gap: 6 }, children: [
          char.tier !== "SS" && /* @__PURE__ */ jsxDEV("button", { className: "upgrade-btn", style: { background: "#facc15", color: "#000", fontSize: "0.6rem", padding: "2px 8px" }, onClick: () => refineTier(), children: "TIER UP" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 837,
            columnNumber: 21
          }),
          /* @__PURE__ */ jsxDEV("button", { className: "upgrade-btn", style: { background: "#4ade80", color: "#000", fontSize: "0.6rem", padding: "2px 8px" }, onClick: () => refineStat("all", true), children: "REFINE ALL" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 841,
            columnNumber: 17
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 835,
          columnNumber: 13
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 833,
        columnNumber: 10
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "stats-hud", style: { gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }, children: [
        /* @__PURE__ */ jsxDEV("div", { className: "stat-hex", onClick: () => refineStat("hp"), children: [
          /* @__PURE__ */ jsxDEV("div", { className: "hex-label", children: [
            /* @__PURE__ */ jsxDEV("img", { src: "ui_icon_hp.png", style: { width: 10, height: 10 } }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 846,
              columnNumber: 44
            }),
            " HP"
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 846,
            columnNumber: 17
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "hex-val", children: calculateStat(char.baseStats.hp, char.level, char, characters, "hp", auraUpgrades).toLocaleString() }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 847,
            columnNumber: 17
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "hex-bar", children: /* @__PURE__ */ jsxDEV("div", { style: { width: "70%", background: "#ef4444" } }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 848,
            columnNumber: 42
          }) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 848,
            columnNumber: 17
          }),
          /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.5rem", marginTop: 2, opacity: 0.6 }, children: [
            "+",
            char.refinements?.hp || 0
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 849,
            columnNumber: 17
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 845,
          columnNumber: 14
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "stat-hex", onClick: () => refineStat("atk"), children: [
          /* @__PURE__ */ jsxDEV("div", { className: "hex-label", children: [
            /* @__PURE__ */ jsxDEV("img", { src: "ui_icon_atk.png", style: { width: 10, height: 10 } }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 852,
              columnNumber: 44
            }),
            " ATK"
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 852,
            columnNumber: 17
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "hex-val", children: calculateStat(char.baseStats.atk, char.level, char, characters, "atk", auraUpgrades).toLocaleString() }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 853,
            columnNumber: 17
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "hex-bar", children: /* @__PURE__ */ jsxDEV("div", { style: { width: "70%", background: "#fb923c" } }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 854,
            columnNumber: 42
          }) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 854,
            columnNumber: 17
          }),
          /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.5rem", marginTop: 2, opacity: 0.6 }, children: [
            "+",
            char.refinements?.atk || 0
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 855,
            columnNumber: 17
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 851,
          columnNumber: 14
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "stat-hex", onClick: () => refineStat("def"), children: [
          /* @__PURE__ */ jsxDEV("div", { className: "hex-label", children: [
            /* @__PURE__ */ jsxDEV("img", { src: "ui_icon_def.png", style: { width: 10, height: 10 } }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 858,
              columnNumber: 44
            }),
            " DEF"
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 858,
            columnNumber: 17
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "hex-val", children: calculateStat(char.baseStats.def, char.level, char, characters, "def", auraUpgrades).toLocaleString() }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 859,
            columnNumber: 17
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "hex-bar", children: /* @__PURE__ */ jsxDEV("div", { style: { width: "70%", background: "#60a5fa" } }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 860,
            columnNumber: 42
          }) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 860,
            columnNumber: 17
          }),
          /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.5rem", marginTop: 2, opacity: 0.6 }, children: [
            "+",
            char.refinements?.def || 0
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 861,
            columnNumber: 17
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 857,
          columnNumber: 14
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "stat-hex", onClick: () => refineStat("speed"), children: [
          /* @__PURE__ */ jsxDEV("div", { className: "hex-label", children: [
            /* @__PURE__ */ jsxDEV("img", { src: "ui_icon_spd.png", style: { width: 10, height: 10 } }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 864,
              columnNumber: 44
            }),
            " SPD"
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 864,
            columnNumber: 17
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "hex-val", children: calculateStat(char.baseStats.speed, char.level, char, characters, "speed", auraUpgrades).toLocaleString() }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 865,
            columnNumber: 17
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "hex-bar", children: /* @__PURE__ */ jsxDEV("div", { style: { width: "70%", background: "#facc15" } }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 866,
            columnNumber: 42
          }) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 866,
            columnNumber: 17
          }),
          /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.5rem", marginTop: 2, opacity: 0.6 }, children: [
            "+",
            char.refinements?.speed || 0
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 867,
            columnNumber: 17
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 863,
          columnNumber: 14
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "stat-hex", onClick: () => refineStat("magic atk"), children: [
          /* @__PURE__ */ jsxDEV("div", { className: "hex-label", children: "M.ATK" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 870,
            columnNumber: 17
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "hex-val", children: calculateStat(char.baseStats["magic atk"] || 0, char.level, char, characters, "magic atk", auraUpgrades).toLocaleString() }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 871,
            columnNumber: 17
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "hex-bar", children: /* @__PURE__ */ jsxDEV("div", { style: { width: "70%", background: "#a855f7" } }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 872,
            columnNumber: 42
          }) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 872,
            columnNumber: 17
          }),
          /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.5rem", marginTop: 2, opacity: 0.6 }, children: [
            "+",
            char.refinements?.["magic atk"] || 0
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 873,
            columnNumber: 17
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 869,
          columnNumber: 14
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "stat-hex", onClick: () => refineStat("magic def"), children: [
          /* @__PURE__ */ jsxDEV("div", { className: "hex-label", children: "M.DEF" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 876,
            columnNumber: 17
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "hex-val", children: calculateStat(char.baseStats["magic def"] || 0, char.level, char, characters, "magic def", auraUpgrades).toLocaleString() }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 877,
            columnNumber: 17
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "hex-bar", children: /* @__PURE__ */ jsxDEV("div", { style: { width: "70%", background: "#3b82f6" } }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 878,
            columnNumber: 42
          }) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 878,
            columnNumber: 17
          }),
          /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.5rem", marginTop: 2, opacity: 0.6 }, children: [
            "+",
            char.refinements?.["magic def"] || 0
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 879,
            columnNumber: 17
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 875,
          columnNumber: 14
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "stat-hex", onClick: () => refineStat("luck"), children: [
          /* @__PURE__ */ jsxDEV("div", { className: "hex-label", children: [
            /* @__PURE__ */ jsxDEV(Clover, { size: 10 }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 882,
              columnNumber: 44
            }),
            " LUCK"
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 882,
            columnNumber: 17
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "hex-val", children: calculateStat(char.baseStats.luck || 10, char.level, char, characters, "luck", auraUpgrades).toLocaleString() }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 883,
            columnNumber: 17
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "hex-bar", children: /* @__PURE__ */ jsxDEV("div", { style: { width: "70%", background: "#4ade80" } }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 884,
            columnNumber: 42
          }) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 884,
            columnNumber: 17
          }),
          /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.5rem", marginTop: 2, opacity: 0.6 }, children: [
            "+",
            char.refinements?.luck || 0
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 885,
            columnNumber: 17
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 881,
          columnNumber: 14
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "stat-hex", style: { cursor: "default", background: "transparent", border: "none" }, children: [
          /* @__PURE__ */ jsxDEV("div", { className: "hex-label", children: "CRIT %" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 888,
            columnNumber: 17
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "hex-val", style: { color: "#facc15" }, children: [
            calculateSubStat(char, characters, "crit_rate", skills, auraUpgrades),
            "%"
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 889,
            columnNumber: 17
          }),
          /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.5rem", marginTop: 2, opacity: 0.6 }, children: [
            "EVA: ",
            calculateSubStat(char, characters, "evasion", skills, auraUpgrades),
            "%"
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 890,
            columnNumber: 17
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 887,
          columnNumber: 14
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 844,
        columnNumber: 10
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "deck-tabs", children: [
        /* @__PURE__ */ jsxDEV("button", { className: `deck-tab ${activeTab === "training" ? "active" : ""}`, onClick: () => {
          setActiveTab("training");
          playSound("ui_select", 0.2);
        }, children: "TRAINING" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 896,
          columnNumber: 13
        }),
        /* @__PURE__ */ jsxDEV("button", { className: `deck-tab ${activeTab === "abilities" ? "active" : ""}`, onClick: () => {
          setActiveTab("abilities");
          playSound("ui_select", 0.2);
        }, children: "SKILLS" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 897,
          columnNumber: 13
        }),
        /* @__PURE__ */ jsxDEV("button", { className: `deck-tab ${activeTab === "visuals" ? "active" : ""}`, onClick: () => {
          setActiveTab("visuals");
          playSound("ui_select", 0.2);
        }, children: "COSMETICS" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 898,
          columnNumber: 13
        }),
        /* @__PURE__ */ jsxDEV("button", { className: `deck-tab ${activeTab === "info" ? "active" : ""}`, onClick: () => {
          setActiveTab("info");
          playSound("ui_select", 0.2);
        }, children: "PROFILE" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 899,
          columnNumber: 13
        }),
        isSpecialEligible && /* @__PURE__ */ jsxDEV("button", { className: `deck-tab ${activeTab === "special" ? "active" : ""}`, style: { color: "#a855f7" }, onClick: () => {
          setActiveTab("special");
          playSound("ui_select", 0.2);
        }, children: "SPECIAL" }, void 0, false, { fileName: "<stdin>", lineNumber: 1, columnNumber: 1 })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 895,
        columnNumber: 10
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "deck-content custom-scroll", children: [
        activeTab === "training" && renderTrainingTab(),
        activeTab === "special" && isSpecialEligible && renderSpecialTab(),
        activeTab === "abilities" && /* @__PURE__ */ jsxDEV(AbilitiesView, { char, characters, credits, setCredits, gems, setGems, essence, setEssence, setCharacters, selectedCharIndex: characters.indexOf(char), createFloatingText, skills, auraUpgrades }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 959,
          columnNumber: 17
        }),
        activeTab === "visuals" && /* @__PURE__ */ jsxDEV("div", { className: "animate-fadeIn", style: { padding: "10px 0" }, children: [
          /* @__PURE__ */ jsxDEV("div", { style: { textAlign: "center", marginBottom: 12, fontSize: "0.65rem", color: "#4ade80", fontWeight: 800 }, children: cosmeticTab === "border" ? "COLLECTION BONUS: +1.5% ALL STATS PER UNLOCKED BORDER" : "CUSTOMIZE YOUR HERO APPEARANCE" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 964,
            columnNumber: 21
          }),
          /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", gap: 10, marginBottom: 15 }, children: ["aura", "border", "title"].map((t) => /* @__PURE__ */ jsxDEV(
            "button",
            {
              onClick: () => {
                setCosmeticTab(t);
                playSound("ui_hover", 0.1);
              },
              style: {
                flex: 1,
                padding: "8px",
                border: "1px solid rgba(255,255,255,0.1)",
                background: cosmeticTab === t ? "var(--primary)" : "rgba(255,255,255,0.05)",
                color: "#fff",
                borderRadius: 8,
                fontWeight: 800,
                fontSize: "0.75rem",
                textTransform: "uppercase"
              },
              children: [
                t,
                "s"
              ]
            },
            t,
            true,
            {
              fileName: "<stdin>",
              lineNumber: 969,
              columnNumber: 29
            }
          )) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 967,
            columnNumber: 21
          }),
          /* @__PURE__ */ jsxDEV("div", { style: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }, children: (cosmeticTab === "aura" ? COSMETICS.AURAS : cosmeticTab === "border" ? COSMETICS.BORDERS : COSMETICS.TITLES).map((item) => {
            const typeKey = cosmeticTab === "aura" ? "auras" : cosmeticTab === "border" ? "borders" : "titles";
            const unlockedList = unlockedCosmetics[typeKey] || ["none", "default"];
            const isUnlocked = unlockedList.includes(item.id);
            const isActive = activeCosmetics[cosmeticTab] === item.id;
            let previewStyle = {};
            if (cosmeticTab === "aura") previewStyle = { ...item.style, borderRadius: "50%" };
            if (cosmeticTab === "border") previewStyle = { border: "none" };
            return /* @__PURE__ */ jsxDEV(
              "div",
              {
                className: `cosmetic-card ${isActive ? "active" : ""} ${!isUnlocked ? "locked" : ""} ${cosmeticTab === "border" ? item.className : ""}`,
                onClick: () => isUnlocked ? handleEquipCosmetic(cosmeticTab, item.id) : handleUnlockCosmetic(cosmeticTab, item),
                children: [
                  /* @__PURE__ */ jsxDEV("div", { className: "cosmetic-preview-box", style: previewStyle, children: [
                    cosmeticTab === "aura" && /* @__PURE__ */ jsxDEV("div", { style: { width: "100%", height: "100%", background: "#fff", borderRadius: "50%", opacity: 0.2 } }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 1002,
                      columnNumber: 68
                    }),
                    cosmeticTab === "title" && /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.5rem", fontWeight: 900 }, children: "ABC" }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 1003,
                      columnNumber: 69
                    })
                  ] }, void 0, true, {
                    fileName: "<stdin>",
                    lineNumber: 1001,
                    columnNumber: 37
                  }),
                  /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.7rem", fontWeight: 900, marginBottom: 2 }, children: item.name }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 1005,
                    columnNumber: 37
                  }),
                  /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.6rem", color: "#f472b6", marginBottom: 4 }, children: item.desc }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 1006,
                    columnNumber: 37
                  }),
                  isUnlocked ? /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.6rem", color: isActive ? "#4ade80" : "#94a3b8", fontWeight: 700 }, children: isActive ? "EQUIPPED" : "OWNED" }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 1008,
                    columnNumber: 41
                  }) : /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.6rem", color: "#facc15", fontWeight: 700 }, children: item.cost === 0 ? "FREE" : item.cost.credits ? `$${item.cost.credits.toLocaleString()}` : item.cost.gems ? `${item.cost.gems} GEMS` : item.cost.essence ? `${item.cost.essence} ESS` : item.cost.materials ? `${item.cost.materials} MATERIALS` : "LOCKED" }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 1012,
                    columnNumber: 41
                  })
                ]
              },
              item.id,
              true,
              {
                fileName: "<stdin>",
                lineNumber: 996,
                columnNumber: 33
              }
            );
          }) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 983,
            columnNumber: 21
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 963,
          columnNumber: 17
        }),
        activeTab === "info" && /* @__PURE__ */ jsxDEV("div", { className: "animate-fadeIn", style: { padding: 20 }, children: [
          /* @__PURE__ */ jsxDEV("h3", { style: { marginTop: 0 }, children: "Hero Data" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 1029,
            columnNumber: 21
          }),
          /* @__PURE__ */ jsxDEV("p", { style: { fontSize: "0.8rem", lineHeight: 1.6, opacity: 0.8 }, children: [
            "A resident representing the ",
            /* @__PURE__ */ jsxDEV("strong", { children: char.franchise }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 1031,
              columnNumber: 53
            }),
            " crew. Currently aligned as ",
            /* @__PURE__ */ jsxDEV("strong", { children: char.relationship }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 1032,
              columnNumber: 46
            }),
            ". Combat style emphasizes ",
            /* @__PURE__ */ jsxDEV("strong", { children: char.growthType }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 1033,
              columnNumber: 49
            }),
            " growth patterns."
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 1030,
            columnNumber: 21
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "glass-panel", style: { marginTop: 20, padding: 15, border: "1px solid #facc15", position: "relative" }, children: [
            /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.6rem", fontWeight: 900, color: "#facc15", marginBottom: 4 }, children: "LEADER SKILL" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 1037,
              columnNumber: 25
            }),
            /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
              /* @__PURE__ */ jsxDEV("div", { children: [
                /* @__PURE__ */ jsxDEV("div", { style: { fontWeight: 900, fontSize: "1rem", color: "#fff" }, children: LEADER_SKILLS.find((s) => s.id === char.leaderSkillId)?.name || "Generic Aura" }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 1040,
                  columnNumber: 33
                }),
                /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.75rem", opacity: 0.8, marginTop: 4 }, children: LEADER_SKILLS.find((s) => s.id === char.leaderSkillId)?.desc || "Boosts squad performance when set as leader." }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 1043,
                  columnNumber: 33
                })
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 1039,
                columnNumber: 29
              }),
              /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.6rem", fontWeight: 900, color: "var(--text-muted)", textAlign: "right" }, children: [
                "TIED TO ",
                char.element,
                " ELEMENT"
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 1047,
                columnNumber: 29
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 1038,
              columnNumber: 25
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 1036,
            columnNumber: 21
          }),
          /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", gap: 10, flexWrap: "wrap", marginTop: 20 }, children: [
            /* @__PURE__ */ jsxDEV("div", { className: "info-tag", children: [
              "Pulls: ",
              char.pulls || 1
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 1069,
              columnNumber: 25
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "info-tag", children: [
              "ID: #",
              char.export_id
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 1070,
              columnNumber: 25
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "info-tag", children: [
              "Mood: ",
              Math.floor(heroMoods[char.export_id] || 50),
              "/100"
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 1071,
              columnNumber: 25
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 1068,
            columnNumber: 21
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 1028,
          columnNumber: 17
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 903,
        columnNumber: 10
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 828,
      columnNumber: 7
    }),
    showSelector && /* @__PURE__ */ jsxDEV("div", { className: "hero-select-modal", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "modal-header", children: [
        /* @__PURE__ */ jsxDEV("h2", { children: "Quick Swap" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1081,
          columnNumber: 17
        }),
        /* @__PURE__ */ jsxDEV("button", { className: "upgrade-btn", onClick: () => setShowSelector(false), children: /* @__PURE__ */ jsxDEV(X, { size: 16 }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1082,
          columnNumber: 88
        }) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1082,
          columnNumber: 17
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 1080,
        columnNumber: 13
      }),
      /* @__PURE__ */ jsxDEV("input", { className: "search-bar", placeholder: "Filter heroes...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), autoFocus: true }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 1084,
        columnNumber: 13
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "roster-grid custom-scroll", style: { maxHeight: "60vh", overflowY: "auto" }, children: filteredCharacters.map((c) => /* @__PURE__ */ jsxDEV("div", { className: `roster-card ${char.export_id === c.export_id ? "active" : ""}`, onClick: () => {
        setSelectedCharIndex(characters.indexOf(c));
        setShowSelector(false);
      }, children: [
        /* @__PURE__ */ jsxDEV("img", { src: c.imageUrl }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1088,
          columnNumber: 25
        }),
        /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.7rem", fontWeight: 900 }, children: c.name }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1089,
          columnNumber: 25
        })
      ] }, c.export_id, true, {
        fileName: "<stdin>",
        lineNumber: 1087,
        columnNumber: 21
      })) }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 1085,
        columnNumber: 13
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 1079,
      columnNumber: 9
    })
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 735,
    columnNumber: 5
  });
};;

export { CharacterDetailView };
