import { Fragment, jsxDEV } from "react/jsx-dev-runtime";
import React, { useState, useEffect, useMemo } from "react";
import {
  Sparkles,
  Package,
  Gem,
  Database
} from "lucide-react";
import { playSound } from "../utils.js";

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
  useEffect(() => {
    localStorage.setItem("mugen_gacha_skip", skipAnim);
  }, [skipAnim]);
  const [activeTab, setActiveTab] = useState("heroes");
  const BASE_GEM_PULL_COST = 250;
  const BASE_CASH_PULL_COST = 15e4;
  const ITEM_PULL_COST = 5e4;
  const X10_DISCOUNT_MULT = 0.85;
  const currentOwned = unlockedIds.length;
  const inflationCapMult = 3.5;
  const dynamicCashCost = Math.floor(BASE_CASH_PULL_COST * Math.min(inflationCapMult, Math.pow(1.08, currentOwned)));
  const dynamicGemCost = Math.floor(BASE_GEM_PULL_COST * Math.min(inflationCapMult, Math.pow(1.04, currentOwned)));
  const banners = React.useMemo(() => {
    const dayIndex = (/* @__PURE__ */ new Date()).getDay();
    const franchiseCounts = characters.reduce((m, c) => {
      const f = c.franchise || "Unknown";
      m[f] = (m[f] || 0) + 1;
      return m;
    }, {});
    let allFranchises = Array.from(new Set(characters.map((c) => c.franchise).filter(Boolean)));
    const majorFranchises = allFranchises.filter((f) => (franchiseCounts[f] || 0) >= 3);
    const dailyFranchise = majorFranchises.length > 0 ? majorFranchises[dayIndex % majorFranchises.length] : "Multiverse";
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
    return [
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
        desc: `High-frequency rift tuned for ${dailyFranchise}.`,
        image: "gacha_banner.png",
        filter: { type: "franchise", value: dailyFranchise },
        currency: "gems",
        cost: dynamicGemCost,
        tag: "PREMIUM FOCUS"
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
  }, [characters, activeTab, (/* @__PURE__ */ new Date()).toDateString(), dynamicCashCost, dynamicGemCost]);
  useEffect(() => {
    setActiveBannerIdx(0);
  }, [activeTab]);
  const activeBanner = banners[activeBannerIdx] || banners[0];
  const performBatchSummon = (maxPulls) => {
    const currency = activeBanner.currency;
    const costPer = activeBanner.cost;
    const x10Cost = Math.ceil(costPer * 10 * X10_DISCOUNT_MULT);
    const actualCost = maxPulls === 10 ? x10Cost : costPer * maxPulls;
    const balance = currency === "gems" ? gems : credits;
    if (balance < actualCost) {
      createFloatingText(`Need ${currency === "gems" ? "Gems" : "Cash"}!`, true);
      setIsSummoning(false);
      return;
    }
    if (currency === "gems") setGems((g) => g - actualCost);
    else setCredits((c) => c - actualCost);
    const pulls = [];
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
        const roll = Math.random();
        let selectedRarity = "common";
        if (roll < 0.04 && rarities.legendary.length) selectedRarity = "legendary";
        else if (roll < 0.15 && rarities.epic.length) selectedRarity = "epic";
        else if (roll < 0.4 && rarities.rare.length) selectedRarity = "rare";
        else if (roll < 0.7 && rarities.uncommon.length) selectedRarity = "uncommon";
        const rarityPool = rarities[selectedRarity].length ? rarities[selectedRarity] : rarities.common;
        const id = rarityPool[Math.floor(Math.random() * rarityPool.length)];
        const item = items[id];
        pulls.push({ ...item, isItem: true, id, tier: item.rarity.toUpperCase() });
        addToInventory(id);
      }
      playSound2("gacha_results");
    } else {
      let pool = characters.slice();
      const newUnlockedIds = [];
      const pullsMap = {};
      for (let i = 0; i < maxPulls; i++) {
        let lucky;
        if (activeBanner.filter?.type === "franchise") {
          const fPool = pool.filter((c) => c.franchise === activeBanner.filter.value);
          lucky = Math.random() < 0.35 && fPool.length ? fPool[Math.floor(Math.random() * fPool.length)] : pool[Math.floor(Math.random() * pool.length)];
        } else if (activeBanner.filter?.type === "element") {
          const ePool = pool.filter((c) => c.element === activeBanner.filter.value);
          lucky = Math.random() < 0.6 && ePool.length ? ePool[Math.floor(Math.random() * ePool.length)] : pool[Math.floor(Math.random() * pool.length)];
        } else {
          lucky = pool[Math.floor(Math.random() * pool.length)];
        }
        const isNew = !unlockedIds.includes(lucky.export_id) && !newUnlockedIds.includes(lucky.export_id);
        pulls.push({ ...lucky, isNew });
        if (!pullsMap[lucky.export_id]) pullsMap[lucky.export_id] = { count: 0, bonus: 0 };
        pullsMap[lucky.export_id].count += 1;
        if (!isNew) pullsMap[lucky.export_id].bonus += 5e-3;
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
      playSound2(pulls.some((p) => p.isNew && ["SS", "S+"].includes(p.tier)) ? "gacha_legendary" : "gacha_results");
    }
    setResultsData({ items: pulls, totalSpent: actualCost, currency });
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
        })
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
      }) : /* @__PURE__ */ jsxDEV("div", { className: "animate-fadeIn", style: { width: "90%", maxWidth: "700px", display: "flex", flexDirection: "column", zIndex: 100 }, children: /* @__PURE__ */ jsxDEV("div", { className: "glass-panel", style: { padding: 30, textAlign: "center", borderColor: "#facc15" }, children: [
        /* @__PURE__ */ jsxDEV("h1", { className: "results-header", style: { fontFamily: "MugenTitle", fontSize: "2.5rem", margin: 0 }, children: "SCORE!" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 3831,
          columnNumber: 18
        }),
        /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: 20 }, children: [
          "SPENT: ",
          resultsData.currency === "gems" ? `${resultsData.totalSpent} GEMS` : `$${resultsData.totalSpent.toLocaleString()}`
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 3832,
          columnNumber: 18
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "gacha-compact-grid custom-scroll", style: { gridTemplateColumns: "repeat(5, 1fr)", gap: 10, background: "rgba(0,0,0,0.5)", padding: 20 }, children: resultsData.items.map((item, i) => /* @__PURE__ */ jsxDEV("div", { className: `gacha-compact-item ${item.isNew ? "new-hero" : ""}`, style: { borderColor: item.isItem ? "#facc15" : "" }, children: [
          item.isItem ? /* @__PURE__ */ jsxDEV("div", { style: { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#111" }, children: /* @__PURE__ */ jsxDEV(Package, { size: 24, color: item.rarity === "rare" ? "#3b82f6" : "#a855f7" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 3839,
            columnNumber: 32
          }) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 3838,
            columnNumber: 29
          }) : /* @__PURE__ */ jsxDEV("img", { src: item.imageUrl }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 3842,
            columnNumber: 29
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "compact-tier", children: item.tier || item.rarity?.toUpperCase() || "C" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 3844,
            columnNumber: 26
          }),
          item.isNew && /* @__PURE__ */ jsxDEV("div", { className: "compact-tier", style: { background: "#4ade80", color: "#000", left: 0, right: "auto" }, children: "NEW" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 3845,
            columnNumber: 41
          })
        ] }, i, true, {
          fileName: "<stdin>",
          lineNumber: 3836,
          columnNumber: 23
        })) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 3834,
          columnNumber: 18
        }),
        /* @__PURE__ */ jsxDEV("button", { className: "train-btn", style: { marginTop: 30, background: "#facc15", color: "#000" }, onClick: () => {
          setIsSummoning(false);
          setResultsData(null);
        }, children: "COLLECT ALL" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 3850,
          columnNumber: 18
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 3830,
        columnNumber: 15
      }) }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 3829,
        columnNumber: 13
      })
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
