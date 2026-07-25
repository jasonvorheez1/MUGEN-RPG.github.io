import React, { useState } from "react";
import { EQUIPMENT, EQUIP_RARITY_WEIGHTS, EQUIP_GACHA_COST } from "../constants.js";
import { playSound, makeGearInstanceId } from "../utils.js";

// Buying and gacha-pulling for NEW gear lives here (Recruit hub), separate
// from CharacterDetailView's GEAR tab, which is now purely for
// equipping/leveling/moving gear you already own between heroes. Pulls here
// land in the shared gearInventory UNEQUIPPED -- go equip them on whichever
// hero you want from their own GEAR tab.
const RARITY_COLOR = { Common: "#94a3b8", Rare: "#38bdf8", Epic: "#a855f7", Legendary: "#facc15", Mythic: "#ff2ecb" };
const STAT_LABEL = { atk: "ATK", "magic atk": "M.ATK", def: "DEF", "magic def": "M.DEF", hp: "HP", speed: "SPD", luck: "LUCK" };
// Bug fix: this was missing a case for the "cdr" passive type (added this
// session on the 4 new Mythic items -- temporal_edge, overclock_talons,
// kinetic_bastion_plate, chronarch_beacon), so those items' passive line
// silently rendered blank instead of showing what they actually do.
const PASSIVE_LABEL = (p) => p.type === "elem_boost" ? `+${Math.round(p.val * 100)}% ${p.element} DMG dealt`
  : p.type === "elem_resist" ? `-${Math.round(p.val * 100)}% ${p.element} DMG taken`
  : p.type === "status_resist" ? `-${Math.round(p.val * 100)}% ${p.status.toUpperCase()} chance`
  : p.type === "cdr" ? `+${Math.round(p.val * 100)}% Ability Charge Speed`
  : "";
const bonusText = (item) => Object.entries(item.bonuses).map(([k, v]) => {
  const pct = Math.round(v * 100);
  return `${STAT_LABEL[k] || k.toUpperCase()} ${pct >= 0 ? "+" : ""}${pct}%`;
}).join("  ");
const passiveText = (item) => !Array.isArray(item.passives) ? "" : item.passives.map(PASSIVE_LABEL).join("  ");

// Addition: gear gacha previously had ZERO pity, unlike the hero gacha (which
// has full soft/hard pity) -- with Mythic sitting at a flat 2% weight and
// gachaOnly (no direct-purchase fallback), a player could go arbitrarily long
// without ever seeing one. Mirrors the hero-gacha pity shape (soft ramp then
// a hard guarantee), tracked per-slot since weapon/armor/trinket are pulled
// separately.
const GEAR_PITY_SOFT_START = 20;
const GEAR_PITY_HARD_CAP = 40;
const loadGearPity = () => {
  try { return JSON.parse(localStorage.getItem("mugen_gear_gacha_pity") || "{}"); } catch (e) { return {}; }
};
const saveGearPity = (obj) => localStorage.setItem("mugen_gear_gacha_pity", JSON.stringify(obj));

const GearShopView = ({
  gearInventory = [], setGearInventory,
  gems = 0, setGems, credits = 0, setCredits, materials = 0, setMaterials, essence = 0, setEssence,
  createFloatingText = () => {}, triggerVisualEffect
}) => {
  const [slot, setSlot] = useState("weapon");
  const [gachaResult, setGachaResult] = useState(null);
  const [gearPity, setGearPity] = useState(loadGearPity);
  const gearPityCount = gearPity[slot] || 0;
  const canAfford = (cost) => (!cost.credits || credits >= cost.credits) && (!cost.gems || gems >= cost.gems) && (!cost.materials || materials >= cost.materials) && (!cost.essence || essence >= cost.essence);
  const spendCost = (cost) => {
    if (!canAfford(cost)) {
      const need = cost.credits && credits < cost.credits ? `$${cost.credits.toLocaleString()}` : cost.gems && gems < cost.gems ? `${cost.gems} Gems` : cost.materials && materials < cost.materials ? `${cost.materials} Materials` : `${cost.essence} Essence`;
      createFloatingText(`Need ${need}`, true);
      return false;
    }
    if (cost.credits) setCredits((c) => c - cost.credits);
    if (cost.gems) setGems((g) => g - cost.gems);
    if (cost.materials) setMaterials((m) => m - cost.materials);
    if (cost.essence) setEssence((e) => e - cost.essence);
    return true;
  };
  const handleBuyGear = (item) => {
    if (!spendCost(item.cost)) return;
    setGearInventory((prev) => [...prev, { instanceId: makeGearInstanceId(), slot, itemId: item.id, level: 1 }]);
    playSound("purchase");
    createFloatingText(`${item.name} added to inventory!`, false, "#38bdf8");
  };
  // Pity-aware: past GEAR_PITY_SOFT_START pulls without a Mythic, nudge its
  // odds up each subsequent pull; at GEAR_PITY_HARD_CAP, force one outright.
  const rollGearRarity = (pityCount) => {
    const forced = pityCount >= GEAR_PITY_HARD_CAP;
    if (forced) return "Mythic";
    const softBonus = pityCount >= GEAR_PITY_SOFT_START ? (pityCount - GEAR_PITY_SOFT_START) * 1.5 : 0;
    const weights = { ...EQUIP_RARITY_WEIGHTS, Mythic: EQUIP_RARITY_WEIGHTS.Mythic + softBonus };
    const total = Object.values(weights).reduce((a, b) => a + b, 0);
    let roll = Math.random() * total;
    for (const [rarity, weight] of Object.entries(weights)) {
      if (roll < weight) return rarity;
      roll -= weight;
    }
    return "Common";
  };
  const pullGearGacha = (count) => {
    const cost = count === 10 ? EQUIP_GACHA_COST.ten : EQUIP_GACHA_COST.single;
    if (gems < cost) { createFloatingText(`Need ${cost} Gems`, true); return; }
    setGems((g) => g - cost);
    const pool = (EQUIPMENT[slot] || []).filter((it) => !it.eventOnly);
    let pityCount = gearPityCount;
    let pityTriggered = false;
    const results = Array.from({ length: count }).map(() => {
      const rarity = rollGearRarity(pityCount);
      if (rarity === "Mythic" && pityCount >= GEAR_PITY_HARD_CAP) pityTriggered = true;
      pityCount = rarity === "Mythic" ? 0 : pityCount + 1;
      const rarityPool = pool.filter((it) => it.rarity === rarity);
      return (rarityPool.length ? rarityPool : pool)[Math.floor(Math.random() * (rarityPool.length ? rarityPool.length : pool.length))];
    }).filter(Boolean);
    if (!results.length) return;
    setGearPity((prev) => {
      const next = { ...prev, [slot]: pityCount };
      saveGearPity(next);
      return next;
    });
    const rank = { Common: 0, Rare: 1, Epic: 2, Legendary: 3, Mythic: 4 };
    let bestRank = -1;
    results.forEach((r) => { if (rank[r.rarity] > bestRank) bestRank = rank[r.rarity]; });
    const newInstances = results.map((item) => ({ instanceId: makeGearInstanceId(), slot, itemId: item.id, level: 1 }));
    setGearInventory((prev) => [...prev, ...newInstances]);
    // Bug fix: this used to be a bare { ts: Date.now() } compared against
    // Date.now() again at render time -- React doesn't re-render on its own
    // once the clock ticks past the 8s window, so the result panel could
    // linger indefinitely until some UNRELATED state change happened to
    // trigger a re-render. An explicit timeout (same pattern used elsewhere
    // in this codebase for timed UI state) actually clears it.
    setGachaResult({ items: results, slot, pityTriggered });
    playSound(bestRank === 4 ? "gacha_legendary" : bestRank === 3 ? "gacha_epic" : "unlock");
    if (bestRank === 4 && typeof triggerVisualEffect === "function") triggerVisualEffect("fx_powerup.png", "50%", "50%", 2);
    setTimeout(() => setGachaResult((prev) => prev && prev.slot === slot ? null : prev), 8000);
  };
  const h = React.createElement;
  return h("div", { className: "animate-fadeIn", style: { padding: "10px 4px" } },
    h("div", { style: { textAlign: "center", marginBottom: 12, fontSize: "0.65rem", color: "#ff2ecb", fontWeight: 800 } }, "GEAR SHOP — PULLS GO STRAIGHT TO YOUR SHARED INVENTORY"),
    h("div", { style: { display: "flex", gap: 8, marginBottom: 14 } }, ["weapon", "armor", "trinket"].map((s) =>
      h("button", { key: s, onClick: () => { setSlot(s); playSound("ui_hover", 0.1); }, style: { flex: 1, padding: "8px 6px", borderRadius: 10, fontWeight: 800, fontSize: "0.65rem", border: slot === s ? "2px solid #ff2ecb" : "1px solid rgba(255,255,255,0.15)", background: slot === s ? "rgba(255,46,203,0.15)" : "rgba(255,255,255,0.04)", color: "#fff", textTransform: "uppercase" } }, s))),
    h("div", { style: { display: "flex", gap: 8, alignItems: "center", padding: 12, borderRadius: 12, marginBottom: 12, background: "linear-gradient(135deg, rgba(255,46,203,0.12), rgba(168,85,247,0.1))", border: "2px solid rgba(255,46,203,0.4)" } },
      h("div", { style: { flex: 1, minWidth: 120 } },
        h("div", { style: { fontWeight: 900, color: "#ff2ecb", fontSize: "0.8rem" } }, "⚡ GEAR GACHA"),
        h("div", { style: { fontSize: "0.58rem", color: "#cbd5e1", fontWeight: 700 } }, `Roll for ${slot} gear — Mythic gear (beyond Legendary) only drops here.`),
        // Addition: gear gacha odds were never shown anywhere (unlike hero
        // gacha, which surfaces inflation + pity explicitly). Same treatment
        // here now that pity actually exists for it.
        h("div", { style: { fontSize: "0.55rem", color: "#facc15", fontWeight: 800, marginTop: 4 } },
          `PITY: ${gearPityCount} / ${GEAR_PITY_HARD_CAP} — guaranteed Mythic by then (soft odds ramp from ${GEAR_PITY_SOFT_START})`)),
      h("button", { onClick: () => pullGearGacha(1), disabled: gems < EQUIP_GACHA_COST.single, style: { padding: "8px 12px", borderRadius: 8, fontWeight: 900, fontSize: "0.62rem", border: "none", background: gems >= EQUIP_GACHA_COST.single ? "linear-gradient(135deg,#ff2ecb,#a855f7)" : "#334155", color: "#fff", cursor: gems >= EQUIP_GACHA_COST.single ? "pointer" : "default" } }, `PULL ×1\n${EQUIP_GACHA_COST.single}💎`),
      h("button", { onClick: () => pullGearGacha(10), disabled: gems < EQUIP_GACHA_COST.ten, style: { padding: "8px 12px", borderRadius: 8, fontWeight: 900, fontSize: "0.62rem", border: "none", background: gems >= EQUIP_GACHA_COST.ten ? "linear-gradient(135deg,#ff2ecb,#a855f7)" : "#334155", color: "#fff", cursor: gems >= EQUIP_GACHA_COST.ten ? "pointer" : "default", whiteSpace: "pre-line" } }, `PULL ×10\n${EQUIP_GACHA_COST.ten}💎`)),
    h("div", { style: { display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 } },
      Object.entries(EQUIP_RARITY_WEIGHTS).map(([r, w]) => {
        const total = Object.values(EQUIP_RARITY_WEIGHTS).reduce((a, b) => a + b, 0);
        return h("div", { key: r, style: { fontSize: "0.52rem", fontWeight: 800, padding: "2px 7px", borderRadius: 10, color: RARITY_COLOR[r], border: `1px solid ${RARITY_COLOR[r]}55`, background: `${RARITY_COLOR[r]}0f` } }, `${r} ${(w / total * 100).toFixed(1)}%`);
      })),
    gachaResult && gachaResult.slot === slot ? h("div", { style: { display: "flex", flexDirection: "column", gap: 6, marginBottom: 14, padding: 10, borderRadius: 10, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)" } },
      gachaResult.pityTriggered && h("div", { style: { fontSize: "0.6rem", fontWeight: 900, color: "#ff2ecb", textAlign: "center" } }, "★ PITY GUARANTEE TRIGGERED ★"),
      h("div", { style: { display: "flex", gap: 6, flexWrap: "wrap" } },
        gachaResult.items.map((it, i) => h("div", { key: i, style: { padding: "4px 8px", borderRadius: 6, fontSize: "0.58rem", fontWeight: 800, color: RARITY_COLOR[it.rarity], border: `1px solid ${RARITY_COLOR[it.rarity]}`, background: `${RARITY_COLOR[it.rarity]}18` } }, it.name))),
      h("button", { onClick: () => setGachaResult(null), style: { alignSelf: "flex-end", fontSize: "0.55rem", fontWeight: 800, color: "#94a3b8", background: "none", border: "none", cursor: "pointer", padding: "2px 4px" } }, "DISMISS ×")
    ) : null,
    h("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 } }, (EQUIPMENT[slot] || []).map((item) => {
      const cost = item.cost || {};
      const costStr = [cost.credits ? `$${(cost.credits / 1000)}k` : null, cost.gems ? `${cost.gems}💎` : null, cost.essence ? `${cost.essence}✦` : null].filter(Boolean).join(" ");
      const affordable = !item.gachaOnly && !item.eventOnly && canAfford(cost);
      const pText = passiveText(item);
      return h("div", { key: item.id, style: { padding: 10, borderRadius: 10, background: item.rarity === "Mythic" ? "rgba(255,46,203,0.06)" : "rgba(255,255,255,0.04)", border: `1px solid ${item.rarity === "Mythic" ? "#ff2ecb" : item.eventOnly ? "#4ade80" : "rgba(255,255,255,0.12)"}` } },
        h("div", { style: { fontWeight: 800, fontSize: "0.72rem", color: RARITY_COLOR[item.rarity] } }, item.name),
        h("div", { style: { fontSize: "0.58rem", color: "#94a3b8", fontWeight: 700, margin: "3px 0 6px" } }, bonusText(item)),
        pText ? h("div", { style: { fontSize: "0.56rem", color: "#facc15", fontWeight: 700, marginBottom: 6 } }, "✦ " + pText) : null,
        item.gachaOnly
          ? h("div", { style: { fontSize: "0.56rem", color: "#ff2ecb", fontWeight: 900, textAlign: "center", padding: "6px 0" } }, "★ GACHA ONLY ★")
          : item.eventOnly
          ? h("div", { style: { fontSize: "0.56rem", color: "#4ade80", fontWeight: 900, textAlign: "center", padding: "6px 0" } }, "★ EVENT REWARD ★")
          : h("button", { onClick: () => handleBuyGear(item), disabled: !affordable, style: { width: "100%", padding: "6px", borderRadius: 8, fontWeight: 800, fontSize: "0.6rem", border: "none", background: affordable ? "linear-gradient(135deg,#38bdf8,#0ea5e9)" : "#334155", color: "#fff", cursor: affordable ? "pointer" : "default" } }, `BUY · ${costStr}`));
    })));
};

export { GearShopView };
