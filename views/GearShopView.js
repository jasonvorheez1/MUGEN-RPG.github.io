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
const PASSIVE_LABEL = (p) => p.type === "elem_boost" ? `+${Math.round(p.val * 100)}% ${p.element} DMG dealt`
  : p.type === "elem_resist" ? `-${Math.round(p.val * 100)}% ${p.element} DMG taken`
  : p.type === "status_resist" ? `-${Math.round(p.val * 100)}% ${p.status.toUpperCase()} chance`
  : "";
const bonusText = (item) => Object.entries(item.bonuses).map(([k, v]) => {
  const pct = Math.round(v * 100);
  return `${STAT_LABEL[k] || k.toUpperCase()} ${pct >= 0 ? "+" : ""}${pct}%`;
}).join("  ");
const passiveText = (item) => !Array.isArray(item.passives) ? "" : item.passives.map(PASSIVE_LABEL).join("  ");

const GearShopView = ({
  gearInventory = [], setGearInventory,
  gems = 0, setGems, credits = 0, setCredits, materials = 0, setMaterials, essence = 0, setEssence,
  createFloatingText = () => {}, triggerVisualEffect
}) => {
  const [slot, setSlot] = useState("weapon");
  const [gachaResult, setGachaResult] = useState(null);
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
  const rollGearRarity = () => {
    const total = Object.values(EQUIP_RARITY_WEIGHTS).reduce((a, b) => a + b, 0);
    let roll = Math.random() * total;
    for (const [rarity, weight] of Object.entries(EQUIP_RARITY_WEIGHTS)) {
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
    const results = Array.from({ length: count }).map(() => {
      const rarity = rollGearRarity();
      const rarityPool = pool.filter((it) => it.rarity === rarity);
      return (rarityPool.length ? rarityPool : pool)[Math.floor(Math.random() * (rarityPool.length ? rarityPool.length : pool.length))];
    }).filter(Boolean);
    if (!results.length) return;
    const rank = { Common: 0, Rare: 1, Epic: 2, Legendary: 3, Mythic: 4 };
    let bestRank = -1;
    results.forEach((r) => { if (rank[r.rarity] > bestRank) bestRank = rank[r.rarity]; });
    const newInstances = results.map((item) => ({ instanceId: makeGearInstanceId(), slot, itemId: item.id, level: 1 }));
    setGearInventory((prev) => [...prev, ...newInstances]);
    setGachaResult({ items: results, slot, ts: Date.now() });
    playSound(bestRank === 4 ? "gacha_legendary" : bestRank === 3 ? "gacha_epic" : "unlock");
    if (bestRank === 4 && typeof triggerVisualEffect === "function") triggerVisualEffect("fx_powerup.png", "50%", "50%", 2);
  };
  const h = React.createElement;
  return h("div", { className: "animate-fadeIn", style: { padding: "10px 4px" } },
    h("div", { style: { textAlign: "center", marginBottom: 12, fontSize: "0.65rem", color: "#ff2ecb", fontWeight: 800 } }, "GEAR SHOP — PULLS GO STRAIGHT TO YOUR SHARED INVENTORY"),
    h("div", { style: { display: "flex", gap: 8, marginBottom: 14 } }, ["weapon", "armor", "trinket"].map((s) =>
      h("button", { key: s, onClick: () => { setSlot(s); playSound("ui_hover", 0.1); }, style: { flex: 1, padding: "8px 6px", borderRadius: 10, fontWeight: 800, fontSize: "0.65rem", border: slot === s ? "2px solid #ff2ecb" : "1px solid rgba(255,255,255,0.15)", background: slot === s ? "rgba(255,46,203,0.15)" : "rgba(255,255,255,0.04)", color: "#fff", textTransform: "uppercase" } }, s))),
    h("div", { style: { display: "flex", gap: 8, alignItems: "center", padding: 12, borderRadius: 12, marginBottom: 12, background: "linear-gradient(135deg, rgba(255,46,203,0.12), rgba(168,85,247,0.1))", border: "2px solid rgba(255,46,203,0.4)" } },
      h("div", { style: { flex: 1, minWidth: 120 } },
        h("div", { style: { fontWeight: 900, color: "#ff2ecb", fontSize: "0.8rem" } }, "⚡ GEAR GACHA"),
        h("div", { style: { fontSize: "0.58rem", color: "#cbd5e1", fontWeight: 700 } }, `Roll for ${slot} gear — Mythic gear (beyond Legendary) only drops here.`)),
      h("button", { onClick: () => pullGearGacha(1), disabled: gems < EQUIP_GACHA_COST.single, style: { padding: "8px 12px", borderRadius: 8, fontWeight: 900, fontSize: "0.62rem", border: "none", background: gems >= EQUIP_GACHA_COST.single ? "linear-gradient(135deg,#ff2ecb,#a855f7)" : "#334155", color: "#fff", cursor: gems >= EQUIP_GACHA_COST.single ? "pointer" : "default" } }, `PULL ×1\n${EQUIP_GACHA_COST.single}💎`),
      h("button", { onClick: () => pullGearGacha(10), disabled: gems < EQUIP_GACHA_COST.ten, style: { padding: "8px 12px", borderRadius: 8, fontWeight: 900, fontSize: "0.62rem", border: "none", background: gems >= EQUIP_GACHA_COST.ten ? "linear-gradient(135deg,#ff2ecb,#a855f7)" : "#334155", color: "#fff", cursor: gems >= EQUIP_GACHA_COST.ten ? "pointer" : "default", whiteSpace: "pre-line" } }, `PULL ×10\n${EQUIP_GACHA_COST.ten}💎`)),
    gachaResult && gachaResult.slot === slot && Date.now() - gachaResult.ts < 8000 ? h("div", { style: { display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14, padding: 10, borderRadius: 10, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)" } },
      gachaResult.items.map((it, i) => h("div", { key: i, style: { padding: "4px 8px", borderRadius: 6, fontSize: "0.58rem", fontWeight: 800, color: RARITY_COLOR[it.rarity], border: `1px solid ${RARITY_COLOR[it.rarity]}`, background: `${RARITY_COLOR[it.rarity]}18` } }, it.name))
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
