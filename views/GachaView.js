import { Fragment, jsxDEV } from "react/jsx-dev-runtime";
import React, { useState, useEffect, useMemo } from "react";
import {
  Sparkles,
  Package,
  Gem,
  Database
} from "lucide-react";
import { playSound, getActiveEvents } from "../utils.js";

// Duplicate-hero refund: a fraction of that single pull's cost is handed back
// as currency, and the existing per-dupe stat bonus is buffed. Softens the
// "I already have this one" feeling instead of pulls just vanishing.
const DUPLICATE_REFUND_PCT = 0.35;
const DUPLICATE_STAT_BONUS = 0.015;
// PITY: track pulls-since-last-high-tier per banner in localStorage (survives
// reloads and rides along with normal save export/import since it's a
// "mugen_"-prefixed key). Soft pity starts nudging the odds up; hard pity
// guarantees a top-tier hero/item outright so a bad streak always ends.
const PITY_SOFT_START = 90;
const PITY_HARD_CAP = 150;
// Tier strings in the wild include variants like "SS-", "SS+", "S-" beyond the
// six canonical buckets, so match by prefix rather than an exact set --
// anything in the SS family or S+ counts as a pity-satisfying top-tier pull.
const isHighTier = (tier) => {
  const t = String(tier || "").toUpperCase();
  return t.startsWith("SS") || t === "S+";
};
const ITEM_PITY_SOFT_START = 30;
const ITEM_PITY_HARD_CAP = 50;
const loadPity = () => {
  try { return JSON.parse(localStorage.getItem("mugen_gacha_pity") || "{}"); } catch (e) { return {}; }
};
const savePity = (obj) => localStorage.setItem("mugen_gacha_pity", JSON.stringify(obj));

// --- Results screen tier presentation --------------------------------------
// One shared visual language for every rarity so a 100-pull result reads at
// a glance instead of as a wall of identical boxes.
const TIER_RANK = ["SS+", "SS", "SS-", "S+", "S", "S-", "A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "D-", "E+", "E", "E-", "F+", "F", "F-"];
const getTierRank = (tier) => {
  const t = String(tier || "C").trim().toUpperCase();
  const idx = TIER_RANK.indexOf(t);
  return idx === -1 ? TIER_RANK.length : idx;
};
const getTierVisual = (tier) => {
  const t = String(tier || "C").trim().toUpperCase();
  if (t.startsWith("SS")) return { grad: "linear-gradient(135deg, #fff, #ffd700)", glow: "rgba(255,215,0,0.7)", text: "#000", accent: "#ffd700" };
  if (t === "S+") return { grad: "linear-gradient(135deg, #00d2ff, #9d50bb)", glow: "rgba(157,80,187,0.65)", text: "#fff", accent: "#c084fc" };
  if (t.startsWith("S")) return { grad: "linear-gradient(135deg, #facc15, #eab308)", glow: "rgba(234,179,8,0.5)", text: "#000", accent: "#facc15" };
  if (t.startsWith("A")) return { grad: "linear-gradient(135deg, #c084fc, #a855f7)", glow: "rgba(168,85,247,0.4)", text: "#fff", accent: "#a855f7" };
  if (t.startsWith("B")) return { grad: "linear-gradient(135deg, #60a5fa, #3b82f6)", glow: "rgba(59,130,246,0.35)", text: "#fff", accent: "#3b82f6" };
  if (t.startsWith("D") || t.startsWith("E") || t.startsWith("F")) return { grad: "linear-gradient(135deg, #57606f, #414855)", glow: "rgba(87,96,111,0.2)", text: "#cbd5e1", accent: "#64748b" };
  return { grad: "linear-gradient(135deg, #94a3b8, #64748b)", glow: "rgba(100,116,139,0.25)", text: "#fff", accent: "#94a3b8" };
};
// Group a flat pull list into unique-entry cards with a stack count -- a
// 100-pull that landed 6 copies of the same hero shows ONE card with "x6",
// not six identical tiles.
const groupPullResults = (items) => {
  const map = new Map();
  items.forEach((item) => {
    const key = item.isItem ? `item:${item.id}` : `hero:${item.export_id}`;
    if (!map.has(key)) map.set(key, { ...item, count: 0, anyNew: false });
    const entry = map.get(key);
    entry.count += 1;
    if (item.isNew) entry.anyNew = true;
  });
  return Array.from(map.values()).sort((a, b) => getTierRank(a.tier) - getTierRank(b.tier));
};

const GachaView = ({
  gems,
  setGems,
  characters,
  unlockedIds,
  setUnlockedIds,
  setCharacters,
  createFloatingText,
  playSound: playSound2,
  credits,
  setCredits,
  items,
  addToInventory
}) => {
  const [isSummoning, setIsSummoning] = useState(false);
  const isMobile2 = window.innerWidth <= 768;
  const [skipAnim, setSkipAnim] = useState(() => {
    return localStorage.getItem("mugen_gacha_skip") === "true";
  });
  const [resultsData, setResultsData] = useState(null);
  const [activeBannerIdx, setActiveBannerIdx] = useState(0);
  const [pity, setPity] = useState(loadPity);
  useEffect(() => {
    localStorage.setItem("mugen_gacha_skip", skipAnim);
  }, [skipAnim]);
  const [activeTab, setActiveTab] = useState("heroes");
  const BASE_GEM_PULL_COST = 250;
  const BASE_CASH_PULL_COST = 15e4;
  const ITEM_PULL_COST = 5e4;
  const X10_DISCOUNT_MULT = 0.85;
  const X100_DISCOUNT_MULT = 0.7;
  const currentOwned = unlockedIds.length;
  // Grind-easing pass: inflation used to cap at 3.5x (and climbed fast — 1.08/1.04
  // per owned hero) which made pulls feel worse and worse the more you played.
  // Softer cap + slower growth keeps the loop from punishing progression.
  const inflationCapMult = 1.8;
  const dynamicCashCost = Math.floor(BASE_CASH_PULL_COST * Math.min(inflationCapMult, Math.pow(1.045, currentOwned)));
  const dynamicGemCost = Math.floor(BASE_GEM_PULL_COST * Math.min(inflationCapMult, Math.pow(1.02, currentOwned)));
  // Live Events (see getActiveEvents in utils.js) directly drive the
  // "Focus" banner AND spawn one extra rate-up banner per additional
  // concurrent event -- this is the one place "events affect the gacha
  // banners" is implemented, and it's a pure function of the same data
  // EventsView reads, so the two screens can never disagree about what's live.
  const liveEvents = React.useMemo(() => getActiveEvents(characters), [characters, (/* @__PURE__ */ new Date()).toDateString()]);
  const banners = React.useMemo(() => {
    const dayIndex = (/* @__PURE__ */ new Date()).getDay();
    const franchiseCounts = characters.reduce((m, c) => {
      const f = c.franchise || "Unknown";
      m[f] = (m[f] || 0) + 1;
      return m;
    }, {});
    let allFranchises = Array.from(new Set(characters.map((c) => c.franchise).filter(Boolean)));
    const majorFranchises = allFranchises.filter((f) => (franchiseCounts[f] || 0) >= 3);
    const dailyFranchise = liveEvents[0]?.franchise || (majorFranchises.length > 0 ? majorFranchises[dayIndex % majorFranchises.length] : "Multiverse");
    const elements = ["FIRE", "WATER", "WIND", "LIGHT", "DARK", "EARTH"];
    const dailyElement = elements[dayIndex % elements.length];
    if (activeTab === "items") {
      return [
        {
          id: "item_standard",
          name: "Black Market Supply",
          desc: "Score random high-tier supplies, data discs, and rare artifacts.",
          image: "background_hub.png",
          currency: "credits",
          cost: ITEM_PULL_COST,
          tag: "LUCKY BAG"
        },
        {
          id: "item_premium",
          name: "Artifact Collection",
          desc: "Higher chance for Epic and Legendary materials.",
          image: "background_citadel.png",
          currency: "gems",
          cost: 200,
          tag: "PREMIUM CACHE"
        }
      ];
    }
    const base = [
      {
        id: "standard",
        name: "Street Legends",
        desc: "The city never sleeps. Recruit warriors using street cash.",
        image: "background_casino.png",
        filter: null,
        currency: "credits",
        cost: dynamicCashCost,
        tag: "PERMANENT (CASH)"
      },
      {
        id: "franchise",
        name: `${dailyFranchise} Focus`,
        desc: liveEvents[0] ? `${liveEvents[0].label} is live -- rate-up tuned for ${dailyFranchise}.` : `High-frequency rift tuned for ${dailyFranchise}.`,
        image: "gacha_banner.png",
        filter: { type: "franchise", value: dailyFranchise },
        currency: "gems",
        cost: dynamicGemCost,
        tag: liveEvents[0] ? "EVENT RATE-UP" : "PREMIUM FOCUS"
      },
      {
        id: "elemental",
        name: `${dailyElement} Night`,
        desc: `Summon exclusively ${dailyElement} fighters.`,
        image: "background_battle.png",
        filter: { type: "element", value: dailyElement },
        currency: "gems",
        cost: dynamicGemCost,
        tag: "ELEMENTAL RIFT"
      }
    ];
    // Every event beyond the first live one gets its OWN extra rate-up banner
    // -- this is what makes running multiple concurrent events actually show
    // up here instead of only the single daily franchise mattering.
    const eventBanners = liveEvents.slice(1).map((evt) => ({
      id: `event_${evt.uid}`,
      name: `${evt.franchise} ${evt.label.split(' ')[0]}`,
      desc: `${evt.label} is live -- rate-up tuned for ${evt.franchise}.`,
      image: "background_citadel.png",
      filter: { type: "franchise", value: evt.franchise },
      currency: "gems",
      cost: dynamicGemCost,
      tag: "EVENT RATE-UP"
    }));
    return [...base, ...eventBanners];
  }, [characters, activeTab, (/* @__PURE__ */ new Date()).toDateString(), dynamicCashCost, dynamicGemCost, liveEvents]);
  useEffect(() => {
    setActiveBannerIdx(0);
  }, [activeTab]);
  const activeBanner = banners[activeBannerIdx] || banners[0];
  const performBatchSummon = (maxPulls) => {
    const currency = activeBanner.currency;
    const costPer = activeBanner.cost;
    const x10Cost = Math.ceil(costPer * 10 * X10_DISCOUNT_MULT);
    const x100Cost = Math.ceil(costPer * 100 * X100_DISCOUNT_MULT);
    const actualCost = maxPulls === 100 ? x100Cost : maxPulls === 10 ? x10Cost : costPer * maxPulls;
    const balance = currency === "gems" ? gems : credits;
    if (balance < actualCost) {
      createFloatingText(`Need ${currency === "gems" ? "Gems" : "Cash"}!`, true);
      setIsSummoning(false);
      return;
    }
    if (currency === "gems") setGems((g) => g - actualCost);
    else setCredits((c) => c - actualCost);
    const pulls = [];
    let refundCredits = 0;
    let refundGems = 0;
    let pityTriggered = false;
    const pityKey = (activeTab === "items" ? "item_" : "") + activeBanner.id;
    let pityCount = pity[pityKey] || 0;
    if (activeTab === "items") {
      const pool = Object.keys(items || {});
      const rarities = { "legendary": [], "epic": [], "rare": [], "uncommon": [], "common": [] };
      const hasLv100 = characters.some((c) => unlockedIds.includes(c.export_id) && c.level >= 100);
      const restrictedLegendaries = ["xp_omega_log", "xp_soul_gem", "xp_reality_script"];
      pool.forEach((id) => {
        const item = items[id];
        if (restrictedLegendaries.includes(id) && !hasLv100) return;
        if (item && item.rarity && rarities[item.rarity.toLowerCase()]) {
          rarities[item.rarity.toLowerCase()].push(id);
        }
      });
      for (let i = 0; i < maxPulls; i++) {
        // Item pity: soft-boosts legendary odds past ITEM_PITY_SOFT_START pulls,
        // then hard-guarantees one at ITEM_PITY_HARD_CAP so a dry streak always ends.
        const softBoost = pityCount >= ITEM_PITY_SOFT_START ? (pityCount - ITEM_PITY_SOFT_START) * 0.015 : 0;
        const forced = pityCount >= ITEM_PITY_HARD_CAP && rarities.legendary.length;
        if (forced) pityTriggered = true;
        const roll = Math.random();
        let selectedRarity = "common";
        if (forced) selectedRarity = "legendary";
        else if (roll < 0.04 + softBoost && rarities.legendary.length) selectedRarity = "legendary";
        else if (roll < 0.15 && rarities.epic.length) selectedRarity = "epic";
        else if (roll < 0.4 && rarities.rare.length) selectedRarity = "rare";
        else if (roll < 0.7 && rarities.uncommon.length) selectedRarity = "uncommon";
        const rarityPool = rarities[selectedRarity].length ? rarities[selectedRarity] : rarities.common;
        const id = rarityPool[Math.floor(Math.random() * rarityPool.length)];
        const item = items[id];
        pulls.push({ ...item, isItem: true, id, tier: item.rarity.toUpperCase() });
        addToInventory(id);
        pityCount = selectedRarity === "legendary" ? 0 : pityCount + 1;
      }
      playSound2("gacha_results");
    } else {
      let pool = characters.slice();
      const newUnlockedIds = [];
      const pullsMap = {};
      for (let i = 0; i < maxPulls; i++) {
        let bannerPool = pool;
        if (activeBanner.filter?.type === "franchise") bannerPool = pool.filter((c) => c.franchise === activeBanner.filter.value);
        else if (activeBanner.filter?.type === "element") bannerPool = pool.filter((c) => c.element === activeBanner.filter.value);
        if (!bannerPool.length) bannerPool = pool;
        // Hero pity: soft-boosts SS/S+ odds past PITY_SOFT_START pulls without one,
        // then hard-guarantees a top-tier hero at PITY_HARD_CAP.
        const forced = pityCount >= PITY_HARD_CAP;
        if (forced) pityTriggered = true;
        const softChance = pityCount >= PITY_SOFT_START ? (pityCount - PITY_SOFT_START) * 0.02 : 0;
        let lucky;
        if (forced || Math.random() < softChance) {
          const highPool = bannerPool.filter((c) => isHighTier(c.tier));
          lucky = highPool.length ? highPool[Math.floor(Math.random() * highPool.length)] : null;
        }
        if (!lucky) {
          if (activeBanner.filter?.type === "franchise") {
            lucky = Math.random() < 0.35 && bannerPool.length ? bannerPool[Math.floor(Math.random() * bannerPool.length)] : pool[Math.floor(Math.random() * pool.length)];
          } else if (activeBanner.filter?.type === "element") {
            lucky = Math.random() < 0.6 && bannerPool.length ? bannerPool[Math.floor(Math.random() * bannerPool.length)] : pool[Math.floor(Math.random() * pool.length)];
          } else {
            lucky = pool[Math.floor(Math.random() * pool.length)];
          }
        }
        pityCount = isHighTier(lucky.tier) ? 0 : pityCount + 1;
        const isNew = !unlockedIds.includes(lucky.export_id) && !newUnlockedIds.includes(lucky.export_id);
        pulls.push({ ...lucky, isNew });
        if (!pullsMap[lucky.export_id]) pullsMap[lucky.export_id] = { count: 0, bonus: 0 };
        pullsMap[lucky.export_id].count += 1;
        if (!isNew) {
          pullsMap[lucky.export_id].bonus += DUPLICATE_STAT_BONUS;
          const unitCost = maxPulls === 100 ? x100Cost / 100 : maxPulls === 10 ? x10Cost / 10 : costPer;
          if (currency === "gems") refundGems += Math.ceil(unitCost * DUPLICATE_REFUND_PCT);
          else refundCredits += Math.ceil(unitCost * DUPLICATE_REFUND_PCT);
        }
        if (isNew) newUnlockedIds.push(lucky.export_id);
      }
      if (newUnlockedIds.length > 0) {
        setUnlockedIds((prev) => Array.from(/* @__PURE__ */ new Set([...prev, ...newUnlockedIds])));
      }
      setCharacters((prev) => prev.map((c) => {
        const update = pullsMap[c.export_id];
        if (update) {
          return {
            ...c,
            pulls: (c.pulls || 0) + update.count,
            duplicateStatBonus: (c.duplicateStatBonus || 0) + update.bonus
          };
        }
        return c;
      }));
      if (refundGems > 0) setGems((g) => g + refundGems);
      if (refundCredits > 0) setCredits((c) => c + refundCredits);
      playSound2(pulls.some((p) => p.isNew && isHighTier(p.tier)) ? "gacha_legendary" : "gacha_results");
    }
    setPity((prev) => {
      const next = { ...prev, [pityKey]: pityCount };
      savePity(next);
      return next;
    });
    const newCount = pulls.filter((p) => p.isNew).length;
    setResultsData({ items: pulls, totalSpent: actualCost, currency, refund: refundGems || refundCredits || 0, pityTriggered, newCount, pullCount: maxPulls });
    setIsSummoning(true);
  };
  const handleSummonClick = (count) => {
    if (skipAnim) {
      performBatchSummon(count);
      return;
    }
    playSound2("summon_start");
    setIsSummoning(true);
    setTimeout(() => {
      performBatchSummon(count);
    }, 1200);
  };
  const renderResultsScreen = () => {
    const h = React.createElement;
    const grouped = groupPullResults(resultsData.items);
    const bestRank = Math.min(...resultsData.items.map((it) => getTierRank(it.tier)));
    const bestTierIsSS = TIER_RANK[bestRank]?.startsWith("SS");
    const bestTierIsGreat = TIER_RANK[bestRank]?.startsWith("S") || TIER_RANK[bestRank]?.startsWith("A");
    const headline = bestTierIsSS ? "JACKPOT!!" : bestTierIsGreat ? "GREAT PULL!" : "SCORE!";
    const headlineColor = bestTierIsSS ? "#ffd700" : bestTierIsGreat ? "#c084fc" : "#fff";
    // Spotlight: the best 1-3 unique pulls (by tier), skipped entirely for a
    // single pull since the whole screen already IS the spotlight.
    const spotlight = resultsData.pullCount > 1 ? grouped.slice(0, Math.min(3, grouped.length)).filter((g) => getTierRank(g.tier) <= getTierRank("A")) : [];
    const tierTally = {};
    resultsData.items.forEach((it) => {
      const t = it.tier || it.rarity?.toUpperCase() || "C";
      tierTally[t] = (tierTally[t] || 0) + 1;
    });
    const tierChips = Object.entries(tierTally).sort((a, b) => getTierRank(a[0]) - getTierRank(b[0]));
    return h("div", { className: "animate-fadeIn", style: { width: "94%", maxWidth: "820px", display: "flex", flexDirection: "column", zIndex: 100, maxHeight: "90vh" } },
      h("div", { className: "glass-panel", style: { padding: "24px 28px", textAlign: "center", borderColor: headlineColor, display: "flex", flexDirection: "column", maxHeight: "90vh" } },
        // Headline
        h("h1", { className: "results-header gacha-results-headline", style: { fontFamily: "MugenTitle", fontSize: "2.6rem", margin: 0, color: headlineColor, textShadow: `0 0 24px ${headlineColor}88` } }, headline),
        resultsData.pityTriggered && h("div", { className: "pity-triggered-banner" }, "★ PITY GUARANTEE TRIGGERED ★"),
        // Stat bar
        h("div", { style: { display: "flex", justifyContent: "center", gap: 18, flexWrap: "wrap", margin: "14px 0" } },
          h("div", { className: "gacha-stat-chip" },
            h("div", { className: "gacha-stat-label" }, "SPENT"),
            h("div", { className: "gacha-stat-val", style: { color: "#f87171" } }, resultsData.currency === "gems" ? `${resultsData.totalSpent} GEMS` : `$${resultsData.totalSpent.toLocaleString()}`)
          ),
          resultsData.refund > 0 && h("div", { className: "gacha-stat-chip" },
            h("div", { className: "gacha-stat-label" }, "DUPE REFUND"),
            h("div", { className: "gacha-stat-val", style: { color: "#4ade80" } }, `+${resultsData.currency === "gems" ? resultsData.refund + " GEMS" : "$" + resultsData.refund.toLocaleString()}`)
          ),
          h("div", { className: "gacha-stat-chip" },
            h("div", { className: "gacha-stat-label" }, "PULLS"),
            h("div", { className: "gacha-stat-val" }, resultsData.pullCount)
          ),
          typeof resultsData.newCount === "number" && h("div", { className: "gacha-stat-chip" },
            h("div", { className: "gacha-stat-label" }, "NEW"),
            h("div", { className: "gacha-stat-val", style: { color: "#00d2ff" } }, resultsData.newCount)
          )
        ),
        // Tier breakdown chips
        tierChips.length > 1 && h("div", { className: "gacha-tier-tally" },
          tierChips.map(([tier, count]) => {
            const v = getTierVisual(tier);
            return h("div", { key: tier, className: "gacha-tier-pill", style: { background: v.grad, color: v.text, boxShadow: `0 0 10px ${v.glow}` } }, `${tier} ×${count}`);
          })
        ),
        // Spotlight for the best pulls
        spotlight.length > 0 && h("div", { className: "gacha-spotlight-row" },
          spotlight.map((item, i) => {
            const v = getTierVisual(item.tier);
            return h("div", { key: i, className: "gacha-spotlight-card", style: { "--spot-glow": v.glow, animationDelay: `${i * 0.12}s` } },
              h("div", { className: "gacha-spotlight-glow", style: { background: v.grad } }),
              item.isItem
                ? h("div", { className: "gacha-spotlight-img", style: { display: "flex", alignItems: "center", justifyContent: "center", background: "#111" } }, h(Package, { size: 36, color: v.accent }))
                : h("img", { className: "gacha-spotlight-img", src: item.imageUrl }),
              h("div", { className: "gacha-spotlight-tier", style: { background: v.grad, color: v.text } }, item.tier || item.rarity?.toUpperCase()),
              item.anyNew && h("div", { className: "gacha-spotlight-new" }, "NEW"),
              item.count > 1 && h("div", { className: "gacha-spotlight-count" }, `×${item.count}`),
              h("div", { className: "gacha-spotlight-name" }, item.name)
            );
          })
        ),
        // Full grouped results grid
        h("div", { className: "gacha-results-grid custom-scroll" },
          grouped.map((item, i) => {
            const v = getTierVisual(item.tier);
            return h("div", { key: i, className: `gacha-result-card ${item.anyNew ? "new-hero" : ""}`, style: { "--tier-glow": v.glow, animationDelay: `${Math.min(i, 40) * 0.02}s` } },
              item.isItem
                ? h("div", { style: { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#111" } }, h(Package, { size: 22, color: v.accent }))
                : h("img", { src: item.imageUrl }),
              h("div", { className: "gacha-result-tier", style: { background: v.grad, color: v.text } }, item.tier || item.rarity?.toUpperCase() || "C"),
              item.anyNew && h("div", { className: "gacha-result-new" }, "NEW"),
              item.count > 1 && h("div", { className: "gacha-result-count" }, `×${item.count}`)
            );
          })
        ),
        h("button", { className: "train-btn", style: { marginTop: 20, background: "#facc15", color: "#000", flexShrink: 0 }, onClick: () => { setIsSummoning(false); setResultsData(null); } }, "COLLECT ALL")
      )
    );
  };
  return /* @__PURE__ */ jsxDEV("div", { className: "gacha-view-container animate-fadeIn", style: { position: "relative", height: "100%" }, children: [
    /* @__PURE__ */ jsxDEV("div", { className: "gacha-nightlife-bg" }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 3754,
      columnNumber: 7
    }),
    /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", gap: 10, marginBottom: 20, zIndex: 10, position: "relative" }, children: [
      /* @__PURE__ */ jsxDEV("button", { className: `deck-tab-btn ${activeTab === "heroes" ? "active" : ""}`, onClick: () => setActiveTab("heroes"), children: "HERO RECRUIT" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 3757,
        columnNumber: 9
      }),
      /* @__PURE__ */ jsxDEV("button", { className: `deck-tab-btn ${activeTab === "items" ? "active" : ""}`, onClick: () => setActiveTab("items"), children: "ITEM GACHA" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 3758,
        columnNumber: 9
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 3756,
      columnNumber: 7
    }),
    /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", gap: 8, marginBottom: 15, overflowX: "auto", zIndex: 10, position: "relative" }, className: "custom-scroll", children: banners.map((b, i) => /* @__PURE__ */ jsxDEV(
      "button",
      {
        className: `filter-chip ${activeBannerIdx === i ? "active" : ""}`,
        onClick: () => setActiveBannerIdx(i),
        children: b.name
      },
      b.id,
      false,
      {
        fileName: "<stdin>",
        lineNumber: 3763,
        columnNumber: 11
      }
    )) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 3761,
      columnNumber: 7
    }),
    /* @__PURE__ */ jsxDEV("div", { className: "gacha-banner-wrapper neon-border", style: { height: 320, position: "relative", zIndex: 10, borderRadius: 24, overflow: "hidden", boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }, children: [
      /* @__PURE__ */ jsxDEV("img", { src: activeBanner.image, className: "gacha-banner-img", style: { filter: "brightness(0.6) saturate(1.2)" } }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 3774,
        columnNumber: 9
      }),
      /* @__PURE__ */ jsxDEV("div", { style: { position: "absolute", inset: 0, background: "linear-gradient(to top, #000 0%, transparent 60%)" } }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 3775,
        columnNumber: 9
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "banner-overlay", style: { background: "transparent", bottom: 20, left: 20, textAlign: "left" }, children: [
        /* @__PURE__ */ jsxDEV("div", { className: "featured-tag", style: { background: activeBanner.currency === "gems" ? "#00d2ff" : "#facc15", color: "#000", fontSize: "0.7rem", marginBottom: 10 }, children: activeBanner.tag }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 3777,
          columnNumber: 11
        }),
        /* @__PURE__ */ jsxDEV("h2", { className: "banner-title", style: { fontSize: "3rem", fontFamily: "MugenTitle", textShadow: "4px 4px 0 #000" }, children: activeBanner.name }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 3778,
          columnNumber: 11
        }),
        /* @__PURE__ */ jsxDEV("p", { className: "banner-desc", style: { fontSize: "1rem", color: "#fff", textShadow: "0 2px 4px rgba(0,0,0,0.8)", maxWidth: "400px" }, children: activeBanner.desc }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 3779,
          columnNumber: 11
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 3776,
        columnNumber: 9
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "banner-glow-line" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 3781,
        columnNumber: 9
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 3773,
      columnNumber: 7
    }),
    /* @__PURE__ */ jsxDEV("div", { className: "gacha-controls", style: { zIndex: 10, position: "relative", marginTop: -30, padding: "0 20px" }, children: /* @__PURE__ */ jsxDEV("div", { className: "glass-panel", style: { background: "rgba(20, 20, 30, 0.95)", border: "1px solid rgba(255,255,255,0.1)", padding: 25, display: "flex", flexDirection: "column", gap: 20, borderRadius: 24 }, children: [
      /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.6rem", color: "var(--primary)", fontWeight: 900 }, children: [
            "INFLATION SURGE: +",
            ((dynamicCashCost / BASE_CASH_PULL_COST - 1) * 100).toFixed(0),
            "% COST (BASED ON ",
            currentOwned,
            " OWNED)"
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 3788,
            columnNumber: 17
          }),
          activeTab === "heroes" && /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.6rem", color: "#facc15", fontWeight: 900, marginTop: 4 }, children: [
            "PITY: ",
            pity[activeBanner.id] || 0,
            " / ",
            PITY_HARD_CAP,
            " pulls -- guaranteed SS/S+ by then (soft odds ramp from ",
            PITY_SOFT_START,
            ")"
          ] }, void 0, true, { fileName: "<stdin>", lineNumber: 1, columnNumber: 1 }),
          activeTab === "items" && /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.6rem", color: "#facc15", fontWeight: 900, marginTop: 4 }, children: [
            "PITY: ",
            pity["item_" + activeBanner.id] || 0,
            " / ",
            ITEM_PITY_HARD_CAP,
            " pulls -- guaranteed Legendary by then"
          ] }, void 0, true, { fileName: "<stdin>", lineNumber: 1, columnNumber: 1 })
        ] }, void 0, true, { fileName: "<stdin>", lineNumber: 1, columnNumber: 1 }),
        /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", alignItems: "center", gap: 12 }, children: /* @__PURE__ */ jsxDEV("div", { style: { background: "rgba(255,255,255,0.05)", padding: "8px 16px", borderRadius: 20, display: "flex", gap: 8, alignItems: "center" }, children: [
          /* @__PURE__ */ jsxDEV("input", { type: "checkbox", id: "skipAnim", checked: skipAnim, onChange: (e) => setSkipAnim(e.target.checked), style: { accentColor: "var(--primary)" } }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 3793,
            columnNumber: 25
          }),
          /* @__PURE__ */ jsxDEV("label", { htmlFor: "skipAnim", style: { fontSize: "0.75rem", fontWeight: 800, cursor: "pointer" }, children: "SKIP ANIMATION" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 3794,
            columnNumber: 25
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 3792,
          columnNumber: 21
        }) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 3791,
          columnNumber: 17
        }),
        /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "1rem", fontWeight: 900, color: activeBanner.currency === "gems" ? "#00d2ff" : "#facc15", display: "flex", alignItems: "center", gap: 8 }, children: [
          activeBanner.currency === "gems" ? /* @__PURE__ */ jsxDEV(Gem, { size: 18 }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 3798,
            columnNumber: 57
          }) : /* @__PURE__ */ jsxDEV(Database, { size: 18 }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 3798,
            columnNumber: 76
          }),
          activeBanner.currency === "gems" ? gems.toLocaleString() : credits.toLocaleString()
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 3797,
          columnNumber: 17
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 3787,
        columnNumber: 13
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "gacha-btn-grid", style: { gap: 20 }, children: [
        /* @__PURE__ */ jsxDEV("button", { className: "gacha-main-btn", style: { background: "linear-gradient(180deg, #334155, #1e293b)", border: "1px solid rgba(255,255,255,0.1)" }, onClick: () => handleSummonClick(1), children: [
          /* @__PURE__ */ jsxDEV("div", { className: "btn-label", style: { fontSize: "1.2rem" }, children: "PULL x1" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 3805,
            columnNumber: 17
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "btn-sub", style: { color: activeBanner.currency === "gems" ? "#00d2ff" : "#facc15" }, children: activeBanner.currency === "gems" ? `${activeBanner.cost}` : `$${activeBanner.cost.toLocaleString()}` }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 3806,
            columnNumber: 17
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 3804,
          columnNumber: 15
        }),
        /* @__PURE__ */ jsxDEV("button", { className: "gacha-main-btn x10", style: { background: "linear-gradient(180deg, #facc15, #ca8a04)", border: "none", boxShadow: "0 10px 30px rgba(250, 204, 21, 0.3)" }, onClick: () => handleSummonClick(10), children: [
          /* @__PURE__ */ jsxDEV("div", { className: "btn-label", style: { fontSize: "1.4rem", color: "#000", textShadow: "none" }, children: "PULL x10" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 3810,
            columnNumber: 17
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "btn-sub", style: { color: "#000", fontWeight: 800 }, children: activeBanner.currency === "gems" ? `${Math.ceil(activeBanner.cost * 10 * X10_DISCOUNT_MULT)}` : `$${Math.ceil(activeBanner.cost * 10 * X10_DISCOUNT_MULT).toLocaleString()}` }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 3811,
            columnNumber: 17
          }),
          /* @__PURE__ */ jsxDEV("div", { style: { position: "absolute", top: 5, right: 5, background: "#ef4444", color: "#fff", fontSize: "0.6rem", fontWeight: 900, padding: "2px 6px", borderRadius: 4 }, children: "-15% OFF" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 3812,
            columnNumber: 17
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 3809,
          columnNumber: 15
        }),
        /* @__PURE__ */ jsxDEV("button", { className: "gacha-main-btn x100", style: { background: "linear-gradient(180deg, #a855f7, #6b21a8)", border: "none", boxShadow: "0 10px 30px rgba(168, 85, 247, 0.4)" }, onClick: () => handleSummonClick(100), children: [
          /* @__PURE__ */ jsxDEV("div", { className: "btn-label", style: { fontSize: "1.4rem", color: "#fff", textShadow: "none" }, children: "PULL x100" }, void 0, false, { fileName: "<stdin>", lineNumber: 1, columnNumber: 1 }),
          /* @__PURE__ */ jsxDEV("div", { className: "btn-sub", style: { color: "#fff", fontWeight: 800 }, children: activeBanner.currency === "gems" ? `${Math.ceil(activeBanner.cost * 100 * X100_DISCOUNT_MULT)}` : `$${Math.ceil(activeBanner.cost * 100 * X100_DISCOUNT_MULT).toLocaleString()}` }, void 0, false, { fileName: "<stdin>", lineNumber: 1, columnNumber: 1 }),
          /* @__PURE__ */ jsxDEV("div", { style: { position: "absolute", top: 5, right: 5, background: "#ef4444", color: "#fff", fontSize: "0.6rem", fontWeight: 900, padding: "2px 6px", borderRadius: 4 }, children: "-30% OFF" }, void 0, false, { fileName: "<stdin>", lineNumber: 1, columnNumber: 1 })
        ] }, void 0, true, { fileName: "<stdin>", lineNumber: 1, columnNumber: 1 })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 3803,
        columnNumber: 13
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 3785,
      columnNumber: 9
    }) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 3784,
      columnNumber: 7
    }),
    isSummoning && /* @__PURE__ */ jsxDEV("div", { className: "summoning-overlay", style: { background: "#000 url(background_gacha.png)", backgroundSize: "cover", backgroundBlendMode: "multiply" }, children: [
      /* @__PURE__ */ jsxDEV("div", { className: "anime-speed-lines" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 3820,
        columnNumber: 11
      }),
      !resultsData ? /* @__PURE__ */ jsxDEV("div", { className: "portal-animation", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "intro-logo-reveal", style: { fontSize: "4rem", position: "absolute", top: "20%" }, children: "MUGEN" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 3823,
          columnNumber: 16
        }),
        /* @__PURE__ */ jsxDEV("img", { src: "fx_portal.png", className: "portal-graphic" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 3824,
          columnNumber: 16
        }),
        /* @__PURE__ */ jsxDEV(Sparkles, { size: 60, color: "#facc15", className: "animate-pulse" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 3825,
          columnNumber: 16
        }),
        /* @__PURE__ */ jsxDEV("h2", { className: "portal-loading-text", children: "RESONATING..." }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 3826,
          columnNumber: 16
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 3822,
        columnNumber: 13
      }) : renderResultsScreen()
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 3819,
      columnNumber: 9
    })
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 3753,
    columnNumber: 5
  });
};;

export { GachaView };
