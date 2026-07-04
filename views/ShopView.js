import { Fragment, jsxDEV } from "react/jsx-dev-runtime";
import React, { useState } from "react";
import {
  Heart,
  Sword,
  Shield,
  Zap,
  Sparkles,
  LayoutGrid,
  Package,
  Book,
  Star,
  Gem,
  Monitor,
  Database,
  Info,
  X,
  Hammer,
  Activity,
  Clover,
  Crown
} from "lucide-react";
import { playSound } from "../utils.js";
import { isMobile } from "./ViewShared.js";

const ShopView = ({
  credits,
  setCredits,
  gems,
  setGems,
  aura,
  setAura,
  essence,
  setEssence,
  materials,
  setMaterials,
  addToInventory,
  setStamina,
  maxStamina,
  createFloatingText,
  characters,
  unlockedIds,
  setUnlockedIds,
  unlockedFeatures,
  setUnlockedFeatures,
  totalAccountLevel,
  auraUpgrades,
  setAuraUpgrades,
  setShards,
  setCharacters,
  items
}) => {
  const [isSummoning, setIsSummoning] = useState(false);
  const [summonResult, setSummonResult] = useState(null);
  const [autorollActive, setAutorollActive] = useState(false);
  const [rollsRemaining, setRollsRemaining] = useState(0);
  const [activeTab, setActiveTab] = useState("supplies");
  const isFeatureUnlocked = (f) => unlockedFeatures.includes(f);
  const summonHero = () => {
    const ROLL_COST = 1500;
    if (credits < ROLL_COST) {
      createFloatingText(`Not enough credits! Need $${ROLL_COST}`, true);
      return;
    }
    setCredits((c) => c - ROLL_COST);
    if (!characters || characters.length === 0) {
      createFloatingText("No characters available.", true);
      return;
    }
    const pool = characters.slice();
    const pick = pool[Math.floor(Math.random() * pool.length)];
    const isNew = !unlockedIds.includes(pick.export_id);
    if (isNew) {
      setUnlockedIds((prev) => Array.from(/* @__PURE__ */ new Set([...prev || [], pick.export_id])));
      setCharacters((prev) => {
        const next = prev.slice();
        const idx = next.findIndex((c) => String(c.export_id) === String(pick.export_id));
        if (idx !== -1) next[idx] = { ...next[idx], pulls: (next[idx].pulls || 0) + 1 };
        return next;
      });
    } else {
      setCharacters((prev) => {
        const next = prev.slice();
        const idx = next.findIndex((c) => String(c.export_id) === String(pick.export_id));
        if (idx !== -1) {
          next[idx] = {
            ...next[idx],
            pulls: (next[idx].pulls || 0) + 1,
            duplicateStatBonus: (next[idx].duplicateStatBonus || 0) + 5e-3
          };
        }
        return next;
      });
    }
    setSummonResult({ ...pick, isNew });
    setIsSummoning(true);
    createFloatingText(isNew ? `New Hero: ${pick.name}!` : `Duplicate: ${pick.name}`, false);
  };
  const startAutoRolls = (count = 10) => {
    if (autorollActive) {
      setAutorollActive(false);
      setRollsRemaining(0);
      return;
    }
    const affordable = Math.floor(credits / 1500);
    const maxRolls = Math.min(count, affordable);
    if (maxRolls <= 0) {
      createFloatingText("Not enough credits for autoroll", true);
      return;
    }
    setAutorollActive(true);
    setRollsRemaining(maxRolls);
    const intervalId = setInterval(() => {
      setRollsRemaining((prev) => {
        const next = (prev || 0) - 1;
        summonHero();
        if (next <= 0) {
          clearInterval(intervalId);
          setAutorollActive(false);
          return 0;
        }
        return next;
      });
    }, 600);
  };
  const confirmSummon = () => {
    if (!summonResult) {
      setIsSummoning(false);
      return;
    }
    setUnlockedIds((prev) => Array.from(/* @__PURE__ */ new Set([...prev || [], summonResult.export_id])));
    setCharacters((prev) => {
      const next = prev.slice();
      const idx = next.findIndex((c) => String(c.export_id) === String(summonResult.export_id));
      if (idx !== -1) next[idx] = { ...next[idx], pulls: (next[idx].pulls || 0) + 1 };
      return next;
    });
    createFloatingText(`${summonResult.name} added to roster`, false, "#4ade80");
    setIsSummoning(false);
    setSummonResult(null);
  };
  const getDailyDeals = () => {
    const hour = (/* @__PURE__ */ new Date()).getHours();
    const itemIds = Object.keys(items || {});
    if (!itemIds.length) return [];
    const seed1 = hour * 7 % itemIds.length;
    const seed2 = (hour * 13 + 3) % itemIds.length;
    const seed3 = (hour * 19 + 7) % itemIds.length;
    return [itemIds[seed1], itemIds[seed2], itemIds[seed3]].map((id) => {
      const item = items[id];
      if (!item) return null;
      const discount = 0.2;
      const basePrice = item.basePrice || 1e3;
      return { ...item, discount, basePrice, discountedPrice: Math.floor(basePrice * (1 - discount)) };
    }).filter(Boolean);
  };
  const dailyDeals = getDailyDeals();
  const unlockFeature = (f, cost, type = "credits", materialsReq = 0) => {
    if (type === "credits" && credits < cost) {
      createFloatingText(`Need $${cost}`, true);
      return;
    }
    if (materials < materialsReq) {
      createFloatingText(`Need ${materialsReq} Materials`, true);
      return;
    }
    if (type === "gems" && gems < cost) {
      createFloatingText(`Need ${cost} Gems`, true);
      return;
    }
    if (type === "credits") setCredits((c) => c - cost);
    else setGems((g) => g - cost);
    setUnlockedFeatures((prev) => [...prev, f]);
    playSound("levelUp");
    createFloatingText("FEATURE UNLOCKED!", false, "#a855f7");
  };
  const [dealSeed] = useState(Math.floor(Date.now() / 36e5));
  const CRAFTING_RECIPES = [
    { id: "c_stamina_1", output: "stamina_small", qty: 1, cost: { materials: 2500, credits: 25e3 }, name: "Recycled Battery", desc: "Convert materials into basic energy." },
    { id: "c_xp_1", output: "xp_scroll", qty: 1, cost: { materials: 1e4, credits: 15e4 }, name: "Data Chip", desc: "Forge a tactical manual from salvaged parts." },
    { id: "c_voucher_1", output: "summon_voucher", qty: 1, cost: { materials: 5e4, essence: 250, credits: 1e6 }, name: "Gacha Token", desc: "Improvised bypass for the dimensional portal." },
    { id: "c_bond_1", output: "bond_gift", qty: 1, cost: { materials: 25e3, essence: 150 }, name: "Hand-crafted Charm", desc: "A sentimental gift made from polished materials." },
    { id: "c_gems_1", output: "gems", qty: 500, cost: { materials: 1e5, essence: 1e3 }, name: "Gem Synthesis X", desc: "Transmute massive materials into dimensional gems." },
    { id: "c_stamina_2", output: "stamina_large", qty: 1, cost: { materials: 15e3, credits: 1e5, essence: 50 }, name: "Heavy Cell", desc: "A high-capacity energy core." },
    { id: "c_aura_core", output: "aura_fragment", qty: 5, cost: { materials: 5e4, essence: 300 }, name: "Aura Core", desc: "A dense cluster of materials infused with raw essence." },
    { id: "c_bond_2", output: "bond_gift_rare", qty: 1, cost: { materials: 1e5, essence: 500 }, name: "Gilded Relic", desc: "An intricate masterpiece of materials and soul." },
    { id: "c_sell_materials", output: "credits", qty: 1e6, cost: { materials: 5e3 }, name: "Bulk Materials Sale", desc: "Sell massive bulk materials for credits." },
    { id: "c_lucky_coin", output: "lucky_coin", qty: 1, cost: { materials: 25e4, essence: 1500 }, name: "Forged Luck", desc: "A counterfeit lucky charm." },
    { id: "c_ultra_xp", output: "xp_ultra_tome", qty: 1, cost: { materials: 5e5, essence: 2500 }, name: "Transcendental Text", desc: "Powerful training data salvaged from the core." },
    { id: "c_legend_bond", output: "bond_gift_legendary", qty: 1, cost: { materials: 1e6, essence: 5e3 }, name: "Nova Crystal", desc: "An artifact of pure soul resonance." },
    { id: "c_void_stamina", output: "void_capsule", qty: 1, cost: { materials: 25e5, essence: 1e4, gems: 5e3 }, name: "Void Infusion", desc: "Forge a permanent stamina capacitor using high-end energy." },
    { id: "c_grand_tome", output: "xp_grand_tome", qty: 1, cost: { aura: 2500, gems: 1e4 }, name: "Series Manifest", desc: "Transmute pure aura and gems into massive XP stores." },
    { id: "c_eternal_spark", output: "bond_eternal_crystal", qty: 1, cost: { aura: 5e3, gems: 2e4, essence: 15e3 }, name: "Unity Engine", desc: "The ultimate bond tool. Extremely costly but definitive." },
    { id: "c_multicore", output: "multiverse_core", qty: 1, cost: { materials: 5e6, essence: 25e3, credits: 1e8 }, name: "Final Reality Core", desc: "The ultimate endgame craft. Requires god-tier resources." }
  ];
  const handleCraft = (recipe, count = 1) => {
    const totalCost = {
      materials: (recipe.cost.materials || 0) * count,
      credits: (recipe.cost.credits || 0) * count,
      essence: (recipe.cost.essence || 0) * count,
      gems: (recipe.cost.gems || 0) * count
    };
    if (totalCost.materials && materials < totalCost.materials) {
      createFloatingText(`Need ${totalCost.materials - materials} more Materials`, true);
      return;
    }
    if (totalCost.credits && credits < totalCost.credits) {
      createFloatingText(`Need $${(totalCost.credits - credits).toLocaleString()} more`, true);
      return;
    }
    if (totalCost.essence && essence < totalCost.essence) {
      createFloatingText(`Need ${totalCost.essence - essence} more Essence`, true);
      return;
    }
    if (totalCost.gems && gems < totalCost.gems) {
      createFloatingText(`Need ${totalCost.gems - gems} more Gems`, true);
      return;
    }
    if (totalCost.materials) setMaterials((s) => s - totalCost.materials);
    if (totalCost.credits) setCredits((c) => c - totalCost.credits);
    if (totalCost.essence) setEssence((e) => e - totalCost.essence);
    if (totalCost.gems) setGems((g) => g - totalCost.gems);
    if (recipe.output === "gems") {
      setGems((g) => g + (recipe.qty || 1) * count);
    } else if (recipe.output === "credits") {
      setCredits((c) => c + (recipe.qty || 1) * count);
    } else {
      addToInventory(recipe.output, (recipe.qty || 1) * count);
    }
    playSound("craft");
    const name = count > 1 ? `${count}x ${recipe.name}` : recipe.name;
    createFloatingText(`Crafted ${name}!`, false, "#4ade80");
  };
  const calculateMaxCraft = (recipe) => {
    let max = 9999;
    if (recipe.cost.materials) max = Math.min(max, Math.floor(materials / recipe.cost.materials));
    if (recipe.cost.credits) max = Math.min(max, Math.floor(credits / recipe.cost.credits));
    if (recipe.cost.essence) max = Math.min(max, Math.floor(essence / recipe.cost.essence));
    if (recipe.cost.gems) max = Math.min(max, Math.floor(gems / recipe.cost.gems));
    return max;
  };
  return /* @__PURE__ */ jsxDEV("div", { className: "shop-view-wrapper animate-fadeIn", style: { padding: "10px 0" }, children: [
    isSummoning && /* @__PURE__ */ jsxDEV("div", { className: "summoning-overlay", children: !summonResult ? /* @__PURE__ */ jsxDEV(Fragment, { children: [
      /* @__PURE__ */ jsxDEV("div", { className: "summoning-circle", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "summon-energy" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 2747,
          columnNumber: 17
        }),
        /* @__PURE__ */ jsxDEV(Sparkles, { size: 80, color: "var(--primary)" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 2748,
          columnNumber: 17
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 2746,
        columnNumber: 15
      }),
      /* @__PURE__ */ jsxDEV("h2", { style: { marginTop: 40, letterSpacing: 4 }, className: "animate-pulse", children: "STABILIZING DIMENSIONAL LINK..." }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 2750,
        columnNumber: 15
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 2745,
      columnNumber: 13
    }) : /* @__PURE__ */ jsxDEV("div", { className: "animate-fadeIn", style: { textAlign: "center" }, children: [
      /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.7rem", color: "var(--primary)", fontWeight: 900, marginBottom: 10 }, children: "NEW ENTITY DETECTED" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 2754,
        columnNumber: 15
      }),
      /* @__PURE__ */ jsxDEV("img", { src: summonResult.imageUrl, alt: summonResult.name, style: { width: 250, height: 250, borderRadius: 40, border: "4px solid var(--primary)", boxShadow: "0 0 50px var(--primary)" } }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 2755,
        columnNumber: 15
      }),
      /* @__PURE__ */ jsxDEV("h1", { style: { fontSize: "3rem", margin: "20px 0 10px 0" }, children: summonResult.name }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 2756,
        columnNumber: 15
      }),
      /* @__PURE__ */ jsxDEV("div", { style: { color: "var(--text-muted)", marginBottom: 30 }, children: [
        summonResult.franchise,
        " \u2022 ",
        summonResult.role
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 2757,
        columnNumber: 15
      }),
      /* @__PURE__ */ jsxDEV("button", { className: "train-btn", onClick: confirmSummon, children: "WELCOME TO THE ACADEMY" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 2758,
        columnNumber: 15
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 2753,
      columnNumber: 13
    }) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 2743,
      columnNumber: 9
    }),
    /* @__PURE__ */ jsxDEV("div", { className: "shop-header-v3", children: [
      /* @__PURE__ */ jsxDEV("h2", { style: { fontWeight: 900, margin: 0, fontSize: "1.8rem", letterSpacing: "2px", fontFamily: "Rajdhani" }, children: "THE LOCAL BODEGA" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 2765,
        columnNumber: 9
      }),
      /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", gap: 10 }, children: [
        /* @__PURE__ */ jsxDEV("div", { className: "currency-pill credits", children: [
          "$",
          credits.toLocaleString()
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 2767,
          columnNumber: 13
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "currency-pill gems", children: [
          gems,
          " GEMS"
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 2768,
          columnNumber: 13
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 2766,
        columnNumber: 9
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 2764,
      columnNumber: 7
    }),
    /* @__PURE__ */ jsxDEV("div", { className: "shop-tabs v3", children: [
      /* @__PURE__ */ jsxDEV("button", { className: `shop-tab-v3 ${activeTab === "supplies" ? "active" : ""}`, onClick: () => setActiveTab("supplies"), children: [
        /* @__PURE__ */ jsxDEV(Package, { size: 16 }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 2774,
          columnNumber: 13
        }),
        " ",
        /* @__PURE__ */ jsxDEV("span", { children: "SUPPLIES" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 2774,
          columnNumber: 34
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 2773,
        columnNumber: 9
      }),
      /* @__PURE__ */ jsxDEV("button", { className: `shop-tab-v3 ${activeTab === "upgrades" ? "active" : ""}`, onClick: () => setActiveTab("upgrades"), children: [
        /* @__PURE__ */ jsxDEV(LayoutGrid, { size: 16 }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 2777,
          columnNumber: 13
        }),
        " ",
        /* @__PURE__ */ jsxDEV("span", { children: "FACILITY" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 2777,
          columnNumber: 37
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 2776,
        columnNumber: 9
      }),
      /* @__PURE__ */ jsxDEV("button", { className: `shop-tab-v3 ${activeTab === "aura" ? "active" : ""}`, onClick: () => setActiveTab("aura"), children: [
        /* @__PURE__ */ jsxDEV(Zap, { size: 16 }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 2780,
          columnNumber: 13
        }),
        " ",
        /* @__PURE__ */ jsxDEV("span", { children: "AURA" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 2780,
          columnNumber: 30
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 2779,
        columnNumber: 9
      }),
      /* @__PURE__ */ jsxDEV("button", { className: `shop-tab-v3 ${activeTab === "crafting" ? "active" : ""}`, onClick: () => setActiveTab("crafting"), children: [
        /* @__PURE__ */ jsxDEV(Hammer, { size: 16 }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 2783,
          columnNumber: 13
        }),
        " ",
        /* @__PURE__ */ jsxDEV("span", { children: "CRAFT" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 2783,
          columnNumber: 33
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 2782,
        columnNumber: 9
      }),
      /* @__PURE__ */ jsxDEV("button", { className: `shop-tab-v3 ${activeTab === "exchange" ? "active" : ""}`, onClick: () => setActiveTab("exchange"), children: [
        /* @__PURE__ */ jsxDEV(Database, { size: 16 }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 2786,
          columnNumber: 13
        }),
        " ",
        /* @__PURE__ */ jsxDEV("span", { children: "X-CHANGE" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 2786,
          columnNumber: 35
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 2785,
        columnNumber: 9
      }),
      /* @__PURE__ */ jsxDEV("button", { className: `shop-tab-v3 ${activeTab === "elite" ? "active" : ""}`, onClick: () => setActiveTab("elite"), children: [
        /* @__PURE__ */ jsxDEV(Crown, { size: 16 }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 2789,
          columnNumber: 13
        }),
        " ",
        /* @__PURE__ */ jsxDEV("span", { children: "ELITE" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 2789,
          columnNumber: 32
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 2788,
        columnNumber: 9
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 2772,
      columnNumber: 7
    }),
    activeTab === "exchange" && /* @__PURE__ */ jsxDEV("div", { className: "animate-fadeIn", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "glass-panel", style: { marginBottom: 20, textAlign: "center", borderColor: "#facc15", boxShadow: "0 0 20px rgba(250, 204, 21, 0.1)" }, children: [
        /* @__PURE__ */ jsxDEV("h3", { style: { margin: 0, color: "#facc15", fontSize: "1.5rem", fontWeight: 900 }, children: "BLACK MARKET EXCHANGE" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 2796,
          columnNumber: 17
        }),
        /* @__PURE__ */ jsxDEV("p", { style: { fontSize: "0.8rem", color: "var(--text-muted)" }, children: "Convert surplus resources instantly. No refunds." }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 2797,
          columnNumber: 17
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 2795,
        columnNumber: 13
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "shop-grid v3", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "shop-card-v3", style: { gridColumn: "span 2" }, children: [
          /* @__PURE__ */ jsxDEV("div", { className: "shop-card-icon-v3", style: { color: "#facc15" }, children: /* @__PURE__ */ jsxDEV(Database, { size: 24 }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 2803,
            columnNumber: 82
          }) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 2803,
            columnNumber: 21
          }),
          /* @__PURE__ */ jsxDEV("h4", { className: "shop-card-title-v3", children: "Industrial Resource Liquidation" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 2804,
            columnNumber: 21
          }),
          /* @__PURE__ */ jsxDEV("p", { className: "shop-card-desc-v3", children: "Dump massive credit reserves to instantly manufacture raw materials materials for crafting." }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 2805,
            columnNumber: 21
          }),
          /* @__PURE__ */ jsxDEV("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }, children: [
            /* @__PURE__ */ jsxDEV("button", { className: "shop-buy-btn", onClick: () => {
              if (credits >= 1e5) {
                setCredits((c) => c - 1e5);
                setMaterials((s) => s + 1e3);
                createFloatingText("+1,000 Materials", false, "#94a3b8");
                playSound("sell_item");
              } else createFloatingText("Need $100k", true);
            }, children: "$100k \u2192 1k Materials" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 2807,
              columnNumber: 25
            }),
            /* @__PURE__ */ jsxDEV("button", { className: "shop-buy-btn", onClick: () => {
              if (credits >= 1e6) {
                setCredits((c) => c - 1e6);
                setMaterials((s) => s + 1e4);
                createFloatingText("+10,000 Materials", false, "#94a3b8");
                playSound("sell_item");
              } else createFloatingText("Need $1.0M", true);
            }, children: "$1.0M \u2192 10k Materials" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 2811,
              columnNumber: 25
            }),
            /* @__PURE__ */ jsxDEV("button", { className: "shop-buy-btn", onClick: () => {
              if (credits >= 25e5) {
                setCredits((c) => c - 25e5);
                setMaterials((s) => s + 25e3);
                createFloatingText("+25,000 Materials", false, "#94a3b8");
                playSound("sell_item");
              } else createFloatingText("Need $2.5M", true);
            }, children: "$2.5M \u2192 25k Materials" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 2815,
              columnNumber: 25
            }),
            /* @__PURE__ */ jsxDEV("button", { className: "shop-buy-btn", style: { background: "linear-gradient(135deg, #334155, #1e293b)" }, onClick: () => {
              if (credits >= 5e6) {
                setCredits((c) => c - 5e6);
                setMaterials((s) => s + 5e4);
                createFloatingText("+50,000 Materials!", false, "#fff");
                playSound("item_craft");
              } else createFloatingText("Need $5.0M", true);
            }, children: "$5.0M \u2192 50k Materials" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 2819,
              columnNumber: 25
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 2806,
            columnNumber: 21
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 2802,
          columnNumber: 17
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "shop-card-v3", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "shop-card-icon-v3", style: { color: "#4ade80" }, children: /* @__PURE__ */ jsxDEV(Zap, { size: 24 }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 2828,
            columnNumber: 82
          }) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 2828,
            columnNumber: 21
          }),
          /* @__PURE__ */ jsxDEV("h4", { className: "shop-card-title-v3", children: "Energy Surge" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 2829,
            columnNumber: 21
          }),
          /* @__PURE__ */ jsxDEV("p", { className: "shop-card-desc-v3", children: "Burn materials to keep training forever." }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 2830,
            columnNumber: 21
          }),
          /* @__PURE__ */ jsxDEV("button", { className: "shop-buy-btn", onClick: () => {
            if (materials >= 500) {
              setMaterials((s) => s - 500);
              setStamina((st) => Math.min(maxStamina, st + 100));
              createFloatingText("+100 Stamina", false, "#4ade80");
              playSound("heal_spell");
            } else createFloatingText("Need 500 Materials", true);
          }, children: "500 Materials \u2192 100 Sta" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 2831,
            columnNumber: 21
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 2827,
          columnNumber: 17
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "shop-card-v3", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "shop-card-icon-v3", style: { color: "#f97316" }, children: /* @__PURE__ */ jsxDEV(Star, { size: 24 }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 2839,
            columnNumber: 82
          }) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 2839,
            columnNumber: 21
          }),
          /* @__PURE__ */ jsxDEV("h4", { className: "shop-card-title-v3", children: "Essence Distillation" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 2840,
            columnNumber: 21
          }),
          /* @__PURE__ */ jsxDEV("p", { className: "shop-card-desc-v3", children: "Condense materials into pure essence." }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 2841,
            columnNumber: 21
          }),
          /* @__PURE__ */ jsxDEV("button", { className: "shop-buy-btn", onClick: () => {
            if (materials >= 2500) {
              setMaterials((s) => s - 2500);
              setEssence((e) => e + 10);
              createFloatingText("+10 Essence", false, "#f97316");
              playSound("magic_blast");
            } else createFloatingText("Need 2.5k Materials", true);
          }, children: "2.5k Materials \u2192 10 Ess" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 2842,
            columnNumber: 21
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 2838,
          columnNumber: 17
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "shop-card-v3", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "shop-card-icon-v3", style: { color: "#00d2ff" }, children: /* @__PURE__ */ jsxDEV(Gem, { size: 24 }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 2850,
            columnNumber: 82
          }) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 2850,
            columnNumber: 21
          }),
          /* @__PURE__ */ jsxDEV("h4", { className: "shop-card-title-v3", children: "Gem Synthesis" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 2851,
            columnNumber: 21
          }),
          /* @__PURE__ */ jsxDEV("p", { className: "shop-card-desc-v3", children: "The ultimate conversion." }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 2852,
            columnNumber: 21
          }),
          /* @__PURE__ */ jsxDEV("button", { className: "shop-buy-btn", onClick: () => {
            if (essence >= 50) {
              setEssence((e) => e - 50);
              setGems((g) => g + 50);
              createFloatingText("+50 Gems", false, "#00d2ff");
              playSound("gacha_legendary");
            } else createFloatingText("Need 50 Essence", true);
          }, children: "50 Ess \u2192 50 Gems" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 2853,
            columnNumber: 21
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 2849,
          columnNumber: 17
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "shop-card-v3", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "shop-card-icon-v3", style: { color: "#a855f7" }, children: /* @__PURE__ */ jsxDEV(Zap, { size: 24 }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 2861,
            columnNumber: 82
          }) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 2861,
            columnNumber: 21
          }),
          /* @__PURE__ */ jsxDEV("h4", { className: "shop-card-title-v3", children: "Aura Compression" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 2862,
            columnNumber: 21
          }),
          /* @__PURE__ */ jsxDEV("p", { className: "shop-card-desc-v3", children: "Compress massive materials into raw account Aura." }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 2863,
            columnNumber: 21
          }),
          /* @__PURE__ */ jsxDEV("button", { className: "shop-buy-btn", onClick: () => {
            if (materials >= 1e5) {
              setMaterials((s) => s - 1e5);
              setAura((a) => a + 100);
              createFloatingText("+100 Aura", false, "#a855f7");
              playSound("magic_blast");
            } else createFloatingText("Need 100k Materials", true);
          }, children: "100k Materials \u2192 100 Aura" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 2864,
            columnNumber: 21
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 2860,
          columnNumber: 17
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "shop-card-v3", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "shop-card-icon-v3", style: { color: "#facc15" }, children: /* @__PURE__ */ jsxDEV(Database, { size: 24 }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 2872,
            columnNumber: 82
          }) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 2872,
            columnNumber: 21
          }),
          /* @__PURE__ */ jsxDEV("h4", { className: "shop-card-title-v3", children: "Reality Funding" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 2873,
            columnNumber: 21
          }),
          /* @__PURE__ */ jsxDEV("p", { className: "shop-card-desc-v3", children: "Donate to the city's future for a massive Gem grant." }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 2874,
            columnNumber: 21
          }),
          /* @__PURE__ */ jsxDEV("button", { className: "shop-buy-btn", onClick: () => {
            const cost = 1e9;
            if (credits >= cost) {
              setCredits((c) => c - cost);
              setGems((g) => g + 5e3);
              createFloatingText("+5,000 Gems!", false, "#00d2ff");
              playSound("jackpot");
            } else createFloatingText("Need $1.0B", true);
          }, children: "$1.0B \u2192 5k Gems" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 2875,
            columnNumber: 21
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 2871,
          columnNumber: 17
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 2800,
        columnNumber: 13
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 2794,
      columnNumber: 9
    }),
    activeTab === "supplies" && /* @__PURE__ */ jsxDEV("div", { className: "animate-fadeIn", children: [
      /* @__PURE__ */ jsxDEV("div", { style: { display: "grid", gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr", gap: 20, marginBottom: 30 }, children: [
        /* @__PURE__ */ jsxDEV("div", { className: "shop-featured-banner hot-deal-glow", style: { background: "linear-gradient(135deg, #1e1b4b, #312e81)", borderColor: "#6366f1", height: "100%", marginBottom: 0, flexDirection: "row" }, children: [
          /* @__PURE__ */ jsxDEV("div", { className: "featured-content", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "featured-tag", style: { background: "#6366f1", color: "#fff" }, children: "GRAND ARCHITECT'S FORGE" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 2891,
              columnNumber: 21
            }),
            /* @__PURE__ */ jsxDEV("h3", { className: "featured-title", children: "Aetheric Resonance" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 2892,
              columnNumber: 21
            }),
            /* @__PURE__ */ jsxDEV("p", { className: "featured-desc", children: "Master-tier transmutation. Use mass materials to directly force account growth." }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 2893,
              columnNumber: 21
            }),
            /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", gap: 10 }, children: /* @__PURE__ */ jsxDEV("button", { className: "featured-buy-btn", style: { background: "#4ade80" }, onClick: () => {
              const cost = 25e3;
              if (credits >= cost && materials >= 5e3) {
                setCredits((c) => c - cost);
                setMaterials((s) => s - 5e3);
                setAura((a) => a + 15);
                createFloatingText("FORGED: +15 AURA", false, "#a855f7");
                playSound("craft");
                triggerVisualEffect("fx_powerup.png", "50%", "50%", 1.5);
              } else createFloatingText("Need $25k + 5k Materials", true);
            }, children: "FORGE AURA ($25k + 5k Materials)" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 2895,
              columnNumber: 25
            }) }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 2894,
              columnNumber: 21
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 2890,
            columnNumber: 18
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "featured-visual", children: /* @__PURE__ */ jsxDEV(Hammer, { size: 80, color: "#6366f1", className: "animate-pulse" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 2911,
            columnNumber: 21
          }) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 2910,
            columnNumber: 18
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 2889,
          columnNumber: 14
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "shop-featured-banner", style: { background: "linear-gradient(135deg, #0f172a, #1e293b)", borderColor: "#00d2ff", marginBottom: 0, flexDirection: "column", textAlign: "center", justifyContent: "center" }, children: [
          /* @__PURE__ */ jsxDEV("div", { className: "featured-tag", style: { background: "#00d2ff", color: "#000", marginBottom: 15 }, children: "DAILY RESOURCE" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 2916,
            columnNumber: 18
          }),
          /* @__PURE__ */ jsxDEV("div", { style: { marginBottom: 15 }, children: [
            /* @__PURE__ */ jsxDEV(Gem, { size: 32, color: "#00d2ff", style: { marginBottom: 5 } }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 2918,
              columnNumber: 21
            }),
            /* @__PURE__ */ jsxDEV("div", { style: { fontWeight: 900, fontSize: "1.2rem", color: "#fff" }, children: "GEM HARVEST" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 2919,
              columnNumber: 21
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 2917,
            columnNumber: 18
          }),
          /* @__PURE__ */ jsxDEV("button", { className: "featured-buy-btn", style: { background: "#00d2ff", width: "100%" }, onClick: () => {
            const costMaterials = 5e4;
            const costEssence = 1e3;
            if (materials >= costMaterials && essence >= costEssence) {
              setMaterials((s) => s - costMaterials);
              setEssence((e) => e - costEssence);
              setGems((g) => g + 100);
              createFloatingText("EXTRACTED: 100 GEMS", false, "#00d2ff");
              playSound("jackpot");
              triggerVisualEffect("fx_magic_circle.png", "50%", "50%", 2);
            } else createFloatingText("Need 50k Materials + 1k Essence", true);
          }, children: "EXCHANGE (50k S + 1k E)" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 2921,
            columnNumber: 18
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 2915,
          columnNumber: 14
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 2888,
        columnNumber: 11
      }),
      /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", flexDirection: "column", gap: 30 }, children: ["consumable", "material"].map((category) => {
        const catItems = Object.entries(items || {}).filter(([_, item]) => item.type === category && item.rarity !== "epic" && item.rarity !== "legendary");
        if (catItems.length === 0) return null;
        return /* @__PURE__ */ jsxDEV("div", { className: "animate-fadeIn", children: [
          /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 15, borderLeft: "3px solid var(--primary)", paddingLeft: 12 }, children: [
            /* @__PURE__ */ jsxDEV("h3", { style: { margin: 0, textTransform: "uppercase", letterSpacing: 2, fontSize: "1rem" }, children: category === "consumable" ? "Battle & Growth" : "Raw Materials" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 2946,
              columnNumber: 21
            }),
            /* @__PURE__ */ jsxDEV("div", { style: { flex: 1, height: 1, background: "linear-gradient(90deg, rgba(217, 70, 239, 0.2), transparent)" } }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 2949,
              columnNumber: 21
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 2945,
            columnNumber: 19
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "shop-grid v3", children: catItems.map(([id, item], idx) => {
            const imageSrc = item.imageUrl || "fx_star_pop.png";
            const sell = item.sellPrice || Math.floor((item.basePrice || 1e3) * 0.45);
            const desc = item.detailedDesc || item.desc;
            const rarityColor = item.rarity === "rare" ? "#3b82f6" : item.rarity === "epic" ? "#a855f7" : item.rarity === "legendary" ? "#facc15" : "var(--primary)";
            return /* @__PURE__ */ jsxDEV("div", { className: "shop-card-v3 animate-shop-entry", style: { animationDelay: `${idx * 0.05}s` }, children: [
              /* @__PURE__ */ jsxDEV("div", { className: "shop-rarity-stripe", style: { background: rarityColor } }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 2960,
                columnNumber: 27
              }),
              /* @__PURE__ */ jsxDEV("div", { className: "shop-card-header-v3", children: /* @__PURE__ */ jsxDEV("img", { src: imageSrc, alt: item.name }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 2962,
                columnNumber: 30
              }) }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 2961,
                columnNumber: 27
              }),
              /* @__PURE__ */ jsxDEV("div", { className: "shop-card-body-v3", children: [
                /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", alignItems: "center", marginBottom: 2 }, children: [
                  /* @__PURE__ */ jsxDEV("div", { className: "rarity-dot", style: { background: rarityColor } }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 2966,
                    columnNumber: 35
                  }),
                  /* @__PURE__ */ jsxDEV("span", { style: { fontSize: "0.6rem", fontWeight: 900, textTransform: "uppercase", color: rarityColor }, children: item.rarity }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 2967,
                    columnNumber: 35
                  })
                ] }, void 0, true, {
                  fileName: "<stdin>",
                  lineNumber: 2965,
                  columnNumber: 31
                }),
                /* @__PURE__ */ jsxDEV("h4", { className: "shop-card-title-v3", children: item.name }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 2969,
                  columnNumber: 31
                }),
                /* @__PURE__ */ jsxDEV("p", { className: "shop-card-desc-v3", title: desc, children: desc }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 2970,
                  columnNumber: 31
                }),
                /* @__PURE__ */ jsxDEV("div", { style: { marginTop: "auto", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 12 }, children: [
                  /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }, children: [
                    /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "1rem", fontWeight: 900, color: "#facc15" }, children: [
                      "$",
                      (item.basePrice || 0).toLocaleString()
                    ] }, void 0, true, {
                      fileName: "<stdin>",
                      lineNumber: 2974,
                      columnNumber: 37
                    }),
                    /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.6rem", color: "var(--text-muted)", fontWeight: 700 }, children: [
                      "Valuation: $",
                      sell.toLocaleString()
                    ] }, void 0, true, {
                      fileName: "<stdin>",
                      lineNumber: 2975,
                      columnNumber: 37
                    })
                  ] }, void 0, true, {
                    fileName: "<stdin>",
                    lineNumber: 2973,
                    columnNumber: 33
                  }),
                  /* @__PURE__ */ jsxDEV("button", { className: "shop-buy-btn", style: { background: credits >= item.basePrice ? "var(--primary)" : "#334155" }, onClick: () => {
                    if (credits >= item.basePrice) {
                      setCredits((c) => c - item.basePrice);
                      addToInventory(id);
                      playSound("purchase");
                      createFloatingText(`Acquired ${item.name}`, false, "#4ade80");
                    } else createFloatingText("Insufficient funds", true);
                  }, children: "PURCHASE ITEM" }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 2977,
                    columnNumber: 33
                  })
                ] }, void 0, true, {
                  fileName: "<stdin>",
                  lineNumber: 2972,
                  columnNumber: 31
                })
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 2964,
                columnNumber: 27
              })
            ] }, id, true, {
              fileName: "<stdin>",
              lineNumber: 2959,
              columnNumber: 23
            });
          }) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 2951,
            columnNumber: 19
          })
        ] }, category, true, {
          fileName: "<stdin>",
          lineNumber: 2944,
          columnNumber: 17
        });
      }) }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 2938,
        columnNumber: 11
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 2886,
      columnNumber: 9
    }),
    activeTab === "upgrades" && /* @__PURE__ */ jsxDEV("div", { className: "animate-fadeIn", children: [
      !isFeatureUnlocked("missions") && /* @__PURE__ */ jsxDEV("div", { className: "shop-item", children: [
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("div", { style: { fontWeight: 900 }, children: "Missions Board" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 3004,
            columnNumber: 20
          }),
          /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.7rem", opacity: 0.6 }, children: "Daily resource collection" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 3004,
            columnNumber: 70
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 3004,
          columnNumber: 15
        }),
        /* @__PURE__ */ jsxDEV("button", { className: "train-btn", style: { width: "auto", padding: "8px 20px" }, onClick: () => unlockFeature("missions", 10, "gems"), children: "10 GEMS" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 3005,
          columnNumber: 15
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 3003,
        columnNumber: 13
      }),
      !isFeatureUnlocked("auto_train_plus") && /* @__PURE__ */ jsxDEV("div", { className: "shop-item", children: [
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("div", { style: { fontWeight: 900 }, children: "Auto-Train Pro" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 3010,
            columnNumber: 20
          }),
          /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.7rem", opacity: 0.6 }, children: "Enhanced automated routine" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 3010,
            columnNumber: 70
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 3010,
          columnNumber: 15
        }),
        /* @__PURE__ */ jsxDEV("button", { className: "train-btn", style: { width: "auto", padding: "8px 20px" }, onClick: () => unlockFeature("auto_train_plus", 25, "gems"), children: "25 GEMS" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 3011,
          columnNumber: 15
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 3009,
        columnNumber: 13
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "shop-item", children: (() => {
        const lv = auraUpgrades.stamina || 0;
        const limit = 100;
        const isMax = lv >= limit;
        const gemCost = Math.floor(100 * Math.pow(1.25, lv));
        const materialsCost = Math.floor(1e3 * Math.pow(1.2, lv));
        return /* @__PURE__ */ jsxDEV(Fragment, { children: [
          /* @__PURE__ */ jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDEV("div", { style: { fontWeight: 900 }, children: "Stamina Capacitor" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 3026,
              columnNumber: 29
            }),
            /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.7rem", opacity: 0.6 }, children: "Permanently increases your maximum Stamina by +10." }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 3027,
              columnNumber: 29
            }),
            /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.6rem", color: "#facc15" }, children: [
              "Req: ",
              gemCost,
              " Gems + ",
              materialsCost,
              " Materials"
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 3028,
              columnNumber: 29
            }),
            /* @__PURE__ */ jsxDEV("div", { className: `limit-tag ${isMax ? "maxed" : ""}`, children: [
              "LIMIT ",
              lv,
              "/",
              limit
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 3029,
              columnNumber: 29
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 3025,
            columnNumber: 25
          }),
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              className: "train-btn",
              style: { width: "auto", padding: "8px 20px", background: isMax ? "#334155" : "linear-gradient(135deg,#f59e0b,#facc15)" },
              disabled: isMax,
              onClick: () => {
                if (gems < gemCost || materials < materialsCost) {
                  createFloatingText("Need more materials", true);
                  return;
                }
                setGems((g) => g - gemCost);
                setMaterials((s) => s - materialsCost);
                setAuraUpgrades((p) => ({ ...p, stamina: (p.stamina || 0) + 1 }));
                createFloatingText(`MAX STAMINA +10`, false, "#4ade80");
                playSound("levelUp");
              },
              children: isMax ? "MAXED" : "UPGRADE"
            },
            void 0,
            false,
            {
              fileName: "<stdin>",
              lineNumber: 3031,
              columnNumber: 25
            }
          )
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 3024,
          columnNumber: 21
        });
      })() }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 3016,
        columnNumber: 11
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "shop-item", children: (() => {
        const lv = auraUpgrades.auraPassive || 0;
        const limit = 25;
        const isMax = lv >= limit;
        const gemCost = Math.floor(250 * Math.pow(1.4, lv));
        return /* @__PURE__ */ jsxDEV(Fragment, { children: [
          /* @__PURE__ */ jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDEV("div", { style: { fontWeight: 900 }, children: "Aura Well" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 3064,
              columnNumber: 29
            }),
            /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.7rem", opacity: 0.6 }, children: "Permanently increases passive aura gain and grants an immediate aura infusion on purchase." }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 3065,
              columnNumber: 29
            }),
            /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.6rem", color: "#00d2ff" }, children: [
              "Req: ",
              gemCost,
              " Gems"
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 3066,
              columnNumber: 29
            }),
            /* @__PURE__ */ jsxDEV("div", { className: `limit-tag ${isMax ? "maxed" : ""}`, children: [
              "LIMIT ",
              lv,
              "/",
              limit
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 3067,
              columnNumber: 29
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 3063,
            columnNumber: 25
          }),
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              className: "train-btn",
              style: { width: "auto", padding: "8px 20px", background: isMax ? "#334155" : "linear-gradient(135deg,#a855f7,#7c3aed)" },
              disabled: isMax,
              onClick: () => {
                if (gems < gemCost) {
                  createFloatingText(`Need ${gemCost} Gems`, true);
                  return;
                }
                setGems((g) => g - gemCost);
                setAuraUpgrades((p) => ({ ...p, auraPassive: (p.auraPassive || 0) + 1 }));
                setAura((a) => a + 25);
                createFloatingText(`AURA WELL INSTALLED: +25 Aura & passive gain up`, false, "#a855f7");
                playSound("levelUp");
              },
              children: isMax ? "MAXED" : "UPGRADE"
            },
            void 0,
            false,
            {
              fileName: "<stdin>",
              lineNumber: 3069,
              columnNumber: 25
            }
          )
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 3062,
          columnNumber: 21
        });
      })() }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 3055,
        columnNumber: 11
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "shop-item", children: (() => {
        const lv = auraUpgrades.xp || 0;
        const limit = 50;
        const isMax = lv >= limit;
        const gemCost = Math.floor(150 * Math.pow(1.3, lv));
        return /* @__PURE__ */ jsxDEV(Fragment, { children: [
          /* @__PURE__ */ jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDEV("div", { style: { fontWeight: 900 }, children: "Training Manual" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 3102,
              columnNumber: 29
            }),
            /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.7rem", opacity: 0.6 }, children: "Increase XP per TRAIN by +15% per purchase (stacks)." }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 3103,
              columnNumber: 29
            }),
            /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.6rem", color: "#facc15" }, children: [
              "Req: ",
              gemCost,
              " Gems"
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 3104,
              columnNumber: 29
            }),
            /* @__PURE__ */ jsxDEV("div", { className: `limit-tag ${isMax ? "maxed" : ""}`, children: [
              "LIMIT ",
              lv,
              "/",
              limit
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 3105,
              columnNumber: 29
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 3101,
            columnNumber: 25
          }),
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              className: "train-btn",
              style: { width: "auto", padding: "8px 20px", background: isMax ? "#334155" : "linear-gradient(135deg,#6366f1,#8b5cf6)" },
              disabled: isMax,
              onClick: () => {
                if (gems < gemCost) {
                  createFloatingText(`Need ${gemCost} Gems`, true);
                  return;
                }
                setGems((g) => g - gemCost);
                setAuraUpgrades((p) => ({ ...p, xp: (p.xp || 0) + 1 }));
                createFloatingText(`TRAINING XP +15% (stack)`, false, "#a855f7");
                playSound("levelUp");
              },
              children: isMax ? "MAXED" : "UPGRADE"
            },
            void 0,
            false,
            {
              fileName: "<stdin>",
              lineNumber: 3107,
              columnNumber: 25
            }
          )
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 3100,
          columnNumber: 21
        });
      })() }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 3093,
        columnNumber: 11
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "shop-item", children: (() => {
        const lv = auraUpgrades.vault || 0;
        const limit = 50;
        const isMax = lv >= limit;
        const auraCost = Math.floor(25 * Math.pow(1.2, lv));
        return /* @__PURE__ */ jsxDEV(Fragment, { children: [
          /* @__PURE__ */ jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDEV("div", { style: { fontWeight: 900 }, children: "Vault Expansion" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 3139,
              columnNumber: 29
            }),
            /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.7rem", opacity: 0.6 }, children: "Increase idle credit capacity" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 3140,
              columnNumber: 29
            }),
            /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.6rem", color: "#a855f7" }, children: [
              "Req: ",
              auraCost,
              " Aura"
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 3141,
              columnNumber: 29
            }),
            /* @__PURE__ */ jsxDEV("div", { className: `limit-tag ${isMax ? "maxed" : ""}`, children: [
              "LIMIT ",
              lv,
              "/",
              limit
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 3142,
              columnNumber: 29
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 3138,
            columnNumber: 25
          }),
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              className: "train-btn",
              style: { width: "auto", padding: "8px 20px", background: isMax ? "#334155" : "var(--sp-color)" },
              disabled: isMax,
              onClick: () => {
                if (aura >= auraCost) {
                  setAura((a) => a - auraCost);
                  setAuraUpgrades((p) => ({ ...p, vault: (p.vault || 0) + 1 }));
                  createFloatingText("VAULT EXPANDED!", false, "#a855f7");
                  playSound("upgrade");
                } else createFloatingText(`Need ${auraCost} Aura`, true);
              },
              children: isMax ? "MAXED" : "UPGRADE"
            },
            void 0,
            false,
            {
              fileName: "<stdin>",
              lineNumber: 3144,
              columnNumber: 25
            }
          )
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 3137,
          columnNumber: 21
        });
      })() }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 3130,
        columnNumber: 11
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "shop-item", style: { border: "2px solid #ef4444", background: "rgba(239, 68, 68, 0.05)" }, children: (() => {
        const lv = auraUpgrades.supernova || 0;
        const limit = 5;
        const isMax = lv >= limit;
        const gemCost = Math.floor(25e3 * Math.pow(3, lv));
        const auraCost = Math.floor(1e4 * Math.pow(2.5, lv));
        return /* @__PURE__ */ jsxDEV(Fragment, { children: [
          /* @__PURE__ */ jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDEV("div", { style: { fontWeight: 900, color: "#ef4444" }, children: "Supernova Reactor" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 3173,
              columnNumber: 29
            }),
            /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.7rem", opacity: 0.6 }, children: "Drastically raises max stamina by +500 and doubles regeneration." }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 3174,
              columnNumber: 29
            }),
            /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.6rem", color: "#facc15" }, children: [
              "Req: ",
              gemCost.toLocaleString(),
              " Gems + ",
              auraCost.toLocaleString(),
              " Aura"
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 3175,
              columnNumber: 29
            }),
            /* @__PURE__ */ jsxDEV("div", { className: `limit-tag ${isMax ? "maxed" : ""}`, children: [
              "LIMIT ",
              lv,
              "/",
              limit
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 3176,
              columnNumber: 29
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 3172,
            columnNumber: 25
          }),
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              className: "train-btn",
              style: { width: "auto", padding: "8px 20px", background: isMax ? "#334155" : "linear-gradient(135deg,#ef4444,#b91c1c)" },
              disabled: isMax,
              onClick: () => {
                if (gems < gemCost || aura < auraCost) {
                  createFloatingText("Materials Insufficient", true);
                  return;
                }
                setGems((g) => g - gemCost);
                setAura((a) => a - auraCost);
                setAuraUpgrades((p) => ({ ...p, stamina: (p.stamina || 0) + 50, supernova: (p.supernova || 0) + 1 }));
                createFloatingText(`MAX STAMINA +500`, false, "#ef4444");
                playSound("explosion");
              },
              children: isMax ? "MAXED" : "IGNITE"
            },
            void 0,
            false,
            {
              fileName: "<stdin>",
              lineNumber: 3178,
              columnNumber: 25
            }
          )
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 3171,
          columnNumber: 21
        });
      })() }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 3163,
        columnNumber: 11
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "shop-item", style: { border: "2px solid #00d2ff", background: "rgba(0, 210, 255, 0.05)" }, children: (() => {
        const lv = auraUpgrades.geode_drill || 0;
        const limit = 10;
        const isMax = lv >= limit;
        const gemCost = Math.floor(15e3 * Math.pow(2, lv));
        const materialsCost = Math.floor(5e4 * Math.pow(1.8, lv));
        return /* @__PURE__ */ jsxDEV(Fragment, { children: [
          /* @__PURE__ */ jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDEV("div", { style: { fontWeight: 900, color: "#00d2ff" }, children: "Dimensional Drill" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 3212,
              columnNumber: 29
            }),
            /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.7rem", opacity: 0.6 }, children: "Permanently triples the speed of the Gem Geode generator." }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 3213,
              columnNumber: 29
            }),
            /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.6rem", color: "#facc15" }, children: [
              "Req: ",
              gemCost.toLocaleString(),
              " Gems + ",
              materialsCost.toLocaleString(),
              " Materials"
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 3214,
              columnNumber: 29
            }),
            /* @__PURE__ */ jsxDEV("div", { className: `limit-tag ${isMax ? "maxed" : ""}`, children: [
              "LIMIT ",
              lv,
              "/",
              limit
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 3215,
              columnNumber: 29
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 3211,
            columnNumber: 25
          }),
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              className: "train-btn",
              style: { width: "auto", padding: "8px 20px", background: isMax ? "#334155" : "linear-gradient(135deg,#00d2ff,#3b82f6)" },
              disabled: isMax,
              onClick: () => {
                if (gems < gemCost || materials < materialsCost) {
                  createFloatingText("Materials Insufficient", true);
                  return;
                }
                setGems((g) => g - gemCost);
                setMaterials((s) => s - materialsCost);
                setAuraUpgrades((p) => ({ ...p, geode_drill: (p.geode_drill || 0) + 1 }));
                createFloatingText(`DRILL ACTIVE: GEODE SPEED UP`, false, "#00d2ff");
                playSound("craft");
              },
              children: isMax ? "MAXED" : "UPGRADE"
            },
            void 0,
            false,
            {
              fileName: "<stdin>",
              lineNumber: 3217,
              columnNumber: 25
            }
          )
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 3210,
          columnNumber: 21
        });
      })() }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 3202,
        columnNumber: 11
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "shop-item", style: { border: "3px solid #facc15", background: "linear-gradient(135deg, rgba(250, 204, 21, 0.1), transparent)", boxShadow: "0 0 20px rgba(250, 204, 21, 0.2)" }, children: (() => {
        const lv = auraUpgrades.singularity || 0;
        const limit = 10;
        const isMax = lv >= limit;
        const creditCost = Math.floor(3e10 * Math.pow(1.5, lv));
        const gemCost = Math.floor(1e4 * Math.pow(1.5, lv));
        return /* @__PURE__ */ jsxDEV(Fragment, { children: [
          /* @__PURE__ */ jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDEV("div", { style: { fontWeight: 900, color: "#facc15", fontSize: "1.1rem" }, children: "Omniversal Singularity Link" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 3251,
              columnNumber: 29
            }),
            /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.75rem", opacity: 0.8, color: "#fff", maxWidth: "350px" }, children: "Permanently grants +100% to ALL HERO STATS and doubles resource gain. The ultimate mark of a Master Trainer." }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 3252,
              columnNumber: 29
            }),
            /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.65rem", color: "#f472b6", marginTop: 4, fontWeight: 900 }, children: [
              "Requirement: $",
              creditCost.toLocaleString(),
              " + ",
              gemCost.toLocaleString(),
              " Gems"
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 3253,
              columnNumber: 29
            }),
            /* @__PURE__ */ jsxDEV("div", { className: `limit-tag ${isMax ? "maxed" : ""}`, children: [
              "LIMIT ",
              lv,
              "/",
              limit
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 3254,
              columnNumber: 29
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 3250,
            columnNumber: 25
          }),
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              className: "train-btn",
              style: { width: "auto", padding: "12px 24px", background: isMax ? "#334155" : "linear-gradient(180deg, #facc15, #ca8a04)", color: isMax ? "#fff" : "#000" },
              disabled: isMax,
              onClick: () => {
                if (credits < creditCost || gems < gemCost) {
                  createFloatingText(`Incomplete Sync: Need resources`, true);
                  return;
                }
                setCredits((c) => c - creditCost);
                setGems((g) => g - gemCost);
                setAuraUpgrades((p) => ({ ...p, singularity: (p.singularity || 0) + 1 }));
                createFloatingText(`!!! OMNIVERSAL LINK ESTABLISHED !!!`, false, "#facc15");
                playSound("gacha_legendary");
                triggerVisualEffect("fx_ultimate_blast.png", "50%", "50%", 3);
              },
              children: isMax ? "MAXED" : "ASCEND"
            },
            void 0,
            false,
            {
              fileName: "<stdin>",
              lineNumber: 3256,
              columnNumber: 25
            }
          )
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 3249,
          columnNumber: 21
        });
      })() }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 3241,
        columnNumber: 11
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "shop-item", style: { border: "3px solid #a855f7", background: "rgba(168, 85, 247, 0.05)" }, children: (() => {
        const lv = auraUpgrades.transmutation || 0;
        const gemCost = Math.floor(5e4 * Math.pow(1.25, lv));
        return /* @__PURE__ */ jsxDEV(Fragment, { children: [
          /* @__PURE__ */ jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDEV("div", { style: { fontWeight: 900, color: "#a855f7", fontSize: "1.1rem" }, children: "Aura Transmutation Core" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 3288,
              columnNumber: 29
            }),
            /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.75rem", opacity: 0.8, color: "#fff", maxWidth: "350px" }, children: "Instantly grants +1,000,000 Materials and +25,000 Essence. A massive jump in crafting capability." }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 3289,
              columnNumber: 29
            }),
            /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.65rem", color: "#00d2ff", marginTop: 4, fontWeight: 900 }, children: [
              "Requirement: ",
              gemCost.toLocaleString(),
              " Gems"
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 3290,
              columnNumber: 29
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "limit-tag", children: [
              "PURCHASED: ",
              lv
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 3291,
              columnNumber: 29
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 3287,
            columnNumber: 25
          }),
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              className: "train-btn",
              style: { width: "auto", padding: "12px 24px", background: "linear-gradient(180deg, #a855f7, #7c3aed)", color: "#fff" },
              onClick: () => {
                if (gems < gemCost) {
                  createFloatingText(`Need ${gemCost.toLocaleString()} Gems`, true);
                  return;
                }
                setGems((g) => g - gemCost);
                setAuraUpgrades((p) => ({ ...p, transmutation: (p.transmutation || 0) + 1 }));
                const curS = parseInt(localStorage.getItem("mugen_materials") || "0", 10);
                const curE = parseInt(localStorage.getItem("mugen_essence") || "0", 10);
                setMaterials(curS + 1e6);
                setEssence(curE + 25e3);
                localStorage.setItem("mugen_materials", String(curS + 1e6));
                localStorage.setItem("mugen_essence", String(curE + 25e3));
                window.dispatchEvent(new CustomEvent("mugen_materials_changed", { detail: { materials: curS + 1e6, essence: curE + 25e3 } }));
                createFloatingText(`MASSIVE RESOURCE INFUSION!`, false, "#a855f7");
                playSound("gacha_epic");
              },
              children: "PURCHASE"
            },
            void 0,
            false,
            {
              fileName: "<stdin>",
              lineNumber: 3293,
              columnNumber: 25
            }
          )
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 3286,
          columnNumber: 21
        });
      })() }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 3281,
        columnNumber: 11
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "glass-panel", style: { textAlign: "center", opacity: 0.5, padding: 20, marginTop: 15 }, children: [
        /* @__PURE__ */ jsxDEV(Info, { size: 24, style: { marginBottom: 10 } }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 3322,
          columnNumber: 13
        }),
        /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.8rem" }, children: "Higher facility ranks unlock automatically based on total Power Level." }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 3323,
          columnNumber: 13
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 3321,
        columnNumber: 11
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 3001,
      columnNumber: 9
    }),
    activeTab === "elite" && /* @__PURE__ */ jsxDEV("div", { className: "animate-fadeIn", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "shop-featured-banner", style: { background: "linear-gradient(135deg, #1e293b, #0f172a)", border: "2px solid #facc15", marginBottom: 25 }, children: [
        /* @__PURE__ */ jsxDEV("div", { className: "featured-content", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "featured-tag", style: { background: "#facc15", color: "#000" }, children: "LEVEL 100+ EXCLUSIVES" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 3332,
            columnNumber: 21
          }),
          /* @__PURE__ */ jsxDEV("h3", { className: "featured-title", children: "High-Dimension Synthetics" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 3333,
            columnNumber: 21
          }),
          /* @__PURE__ */ jsxDEV("p", { className: "featured-desc", children: "These items bypass standard tactical limits. Requires both mass Credits and Dimensional Gems." }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 3334,
            columnNumber: 21
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 3331,
          columnNumber: 17
        }),
        /* @__PURE__ */ jsxDEV(Crown, { size: 64, color: "#facc15", className: "animate-pulse" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 3336,
          columnNumber: 17
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 3330,
        columnNumber: 13
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "shop-grid v3", children: Object.entries(items || {}).filter(([_, item]) => item.dualCost).map(([id, item]) => /* @__PURE__ */ jsxDEV("div", { className: "shop-card-v3", style: { border: "1px solid #facc1533" }, children: [
        /* @__PURE__ */ jsxDEV("div", { className: "shop-rarity-stripe", style: { background: "#facc15" } }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 3342,
          columnNumber: 25
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "shop-card-header-v3", children: /* @__PURE__ */ jsxDEV("img", { src: item.imageUrl, alt: item.name }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 3344,
          columnNumber: 29
        }) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 3343,
          columnNumber: 25
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "shop-card-body-v3", children: [
          /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", alignItems: "center", marginBottom: 2 }, children: [
            /* @__PURE__ */ jsxDEV("div", { className: "rarity-dot", style: { background: "#facc15" } }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 3348,
              columnNumber: 33
            }),
            /* @__PURE__ */ jsxDEV("span", { style: { fontSize: "0.6rem", fontWeight: 900, textTransform: "uppercase", color: "#facc15" }, children: "ELITE ARTIFACT" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 3349,
              columnNumber: 33
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 3347,
            columnNumber: 29
          }),
          /* @__PURE__ */ jsxDEV("h4", { className: "shop-card-title-v3", children: item.name }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 3351,
            columnNumber: 29
          }),
          /* @__PURE__ */ jsxDEV("p", { className: "shop-card-desc-v3", children: item.detailedDesc || item.desc }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 3352,
            columnNumber: 29
          }),
          /* @__PURE__ */ jsxDEV("div", { style: { marginTop: "auto", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 12 }, children: [
            /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", flexDirection: "column", gap: 4, marginBottom: 12 }, children: [
              /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", alignItems: "center", gap: 6, fontSize: "0.85rem", fontWeight: 900, color: credits >= item.dualCost.credits ? "#facc15" : "#ef4444" }, children: [
                /* @__PURE__ */ jsxDEV(Database, { size: 12 }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 3357,
                  columnNumber: 41
                }),
                " $",
                item.dualCost.credits.toLocaleString()
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 3356,
                columnNumber: 37
              }),
              /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", alignItems: "center", gap: 6, fontSize: "0.85rem", fontWeight: 900, color: gems >= item.dualCost.gems ? "#00d2ff" : "#ef4444" }, children: [
                /* @__PURE__ */ jsxDEV(Gem, { size: 12 }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 3360,
                  columnNumber: 41
                }),
                " ",
                item.dualCost.gems.toLocaleString(),
                " GEMS"
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 3359,
                columnNumber: 37
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 3355,
              columnNumber: 33
            }),
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                className: "shop-buy-btn",
                style: { background: credits >= item.dualCost.credits && gems >= item.dualCost.gems ? "var(--primary)" : "#334155" },
                onClick: () => {
                  if (credits >= item.dualCost.credits && gems >= item.dualCost.gems) {
                    setCredits((c) => c - item.dualCost.credits);
                    setGems((g) => g - item.dualCost.gems);
                    addToInventory(id);
                    playSound("purchase");
                    createFloatingText(`Elite Acquisition: ${item.name}`, false, "#facc15");
                  } else createFloatingText("Resources Insufficient", true);
                },
                children: "ACQUIRE"
              },
              void 0,
              false,
              {
                fileName: "<stdin>",
                lineNumber: 3363,
                columnNumber: 33
              }
            )
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 3354,
            columnNumber: 29
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 3346,
          columnNumber: 25
        })
      ] }, id, true, {
        fileName: "<stdin>",
        lineNumber: 3341,
        columnNumber: 21
      })) }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 3339,
        columnNumber: 13
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 3329,
      columnNumber: 9
    }),
    activeTab === "crafting" && /* @__PURE__ */ jsxDEV("div", { className: "animate-fadeIn", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "glass-panel", style: { padding: 25, marginBottom: 25, display: "flex", justifyContent: "space-around", background: "rgba(15, 23, 42, 0.9)", border: "2px solid rgba(255,255,255,0.05)", borderRadius: 24 }, children: [
        /* @__PURE__ */ jsxDEV("div", { style: { textAlign: "center", flex: 1 }, children: [
          /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.7rem", color: "#94a3b8", fontWeight: 900, letterSpacing: 1, marginBottom: 5 }, children: "SALVAGED MATERIALS" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 3389,
            columnNumber: 17
          }),
          /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "1.8rem", fontWeight: 900, color: "#fff", textShadow: "0 0 10px rgba(255,255,255,0.2)" }, children: [
            /* @__PURE__ */ jsxDEV(Package, { size: 20, style: { marginRight: 5 } }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 3390,
              columnNumber: 131
            }),
            " ",
            materials.toLocaleString()
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 3390,
            columnNumber: 17
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 3388,
          columnNumber: 14
        }),
        /* @__PURE__ */ jsxDEV("div", { style: { width: 1, height: 50, background: "rgba(255,255,255,0.1)" } }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 3392,
          columnNumber: 14
        }),
        /* @__PURE__ */ jsxDEV("div", { style: { textAlign: "center", flex: 1 }, children: [
          /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.7rem", color: "#f97316", fontWeight: 900, letterSpacing: 1, marginBottom: 5 }, children: "RAW ESSENCE" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 3394,
            columnNumber: 17
          }),
          /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "1.8rem", fontWeight: 900, color: "#f97316", textShadow: "0 0 10px rgba(249, 115, 22, 0.2)" }, children: [
            /* @__PURE__ */ jsxDEV(Star, { size: 20, style: { marginRight: 5 } }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 3395,
              columnNumber: 136
            }),
            " ",
            essence.toLocaleString()
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 3395,
            columnNumber: 17
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 3393,
          columnNumber: 14
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 3387,
        columnNumber: 11
      }),
      /* @__PURE__ */ jsxDEV("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }, children: CRAFTING_RECIPES.map((recipe, idx) => {
        const max = calculateMaxCraft(recipe);
        const outputItem = items[recipe.output] || { name: recipe.name, icon: "Package" };
        return /* @__PURE__ */ jsxDEV("div", { className: "shop-card-v3 animate-shop-entry", style: { animationDelay: `${idx * 0.04}s`, padding: 20, textAlign: "left", minHeight: "auto" }, children: [
          /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", gap: 15, marginBottom: 15 }, children: [
            /* @__PURE__ */ jsxDEV("div", { style: { width: 56, height: 56, borderRadius: 16, background: "rgba(255,255,255,0.03)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)", flexShrink: 0 }, children: /* @__PURE__ */ jsxDEV(Hammer, { size: 24 }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 3408,
              columnNumber: 28
            }) }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 3407,
              columnNumber: 25
            }),
            /* @__PURE__ */ jsxDEV("div", { children: [
              /* @__PURE__ */ jsxDEV("h4", { style: { margin: 0, fontSize: "1.1rem", fontWeight: 900, color: "#fff" }, children: recipe.name }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 3411,
                columnNumber: 29
              }),
              /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 4 }, children: [
                "Output: ",
                recipe.qty || 1,
                "x ",
                outputItem.name
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 3412,
                columnNumber: 29
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 3410,
              columnNumber: 25
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 3406,
            columnNumber: 21
          }),
          /* @__PURE__ */ jsxDEV("p", { style: { margin: "0 0 15px 0", fontSize: "0.75rem", color: "var(--text-muted)", lineHeight: 1.4, height: "2.8em", overflow: "hidden" }, children: recipe.desc }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 3416,
            columnNumber: 21
          }),
          /* @__PURE__ */ jsxDEV("div", { style: { background: "rgba(0,0,0,0.2)", padding: 12, borderRadius: 12, marginBottom: 20 }, children: [
            /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.65rem", fontWeight: 900, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase" }, children: "Resources Required:" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 3419,
              columnNumber: 25
            }),
            /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", flexWrap: "wrap", gap: 10 }, children: [
              recipe.cost.materials && /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", alignItems: "center", gap: 5, fontSize: "0.75rem", fontWeight: 800, color: materials >= recipe.cost.materials ? "#fff" : "#ef4444" }, children: [
                /* @__PURE__ */ jsxDEV(Package, { size: 12 }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 3423,
                  columnNumber: 37
                }),
                " ",
                recipe.cost.materials
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 3422,
                columnNumber: 33
              }),
              recipe.cost.essence && /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", alignItems: "center", gap: 5, fontSize: "0.75rem", fontWeight: 800, color: essence >= recipe.cost.essence ? "#f97316" : "#ef4444" }, children: [
                /* @__PURE__ */ jsxDEV(Star, { size: 12 }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 3428,
                  columnNumber: 37
                }),
                " ",
                recipe.cost.essence
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 3427,
                columnNumber: 33
              }),
              recipe.cost.credits && /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", alignItems: "center", gap: 5, fontSize: "0.75rem", fontWeight: 800, color: credits >= recipe.cost.credits ? "#facc15" : "#ef4444" }, children: [
                /* @__PURE__ */ jsxDEV(Database, { size: 12 }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 3433,
                  columnNumber: 37
                }),
                " $",
                recipe.cost.credits
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 3432,
                columnNumber: 33
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 3420,
              columnNumber: 25
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 3418,
            columnNumber: 21
          }),
          /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", gap: 8 }, children: [
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                className: "shop-buy-btn",
                style: { flex: 1, padding: "10px", fontSize: "0.8rem", background: "rgba(255,255,255,0.05)" },
                onClick: () => handleCraft(recipe, 1),
                disabled: max < 1,
                children: "CRAFT x1"
              },
              void 0,
              false,
              {
                fileName: "<stdin>",
                lineNumber: 3440,
                columnNumber: 25
              }
            ),
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                className: "shop-buy-btn",
                style: { flex: 2, padding: "10px", fontSize: "0.8rem", background: max >= 1 ? "var(--primary)" : "#334155", border: "none" },
                onClick: () => handleCraft(recipe, max),
                disabled: max < 1,
                children: [
                  "CRAFT MAX (",
                  max,
                  ")"
                ]
              },
              void 0,
              true,
              {
                fileName: "<stdin>",
                lineNumber: 3448,
                columnNumber: 25
              }
            )
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 3439,
            columnNumber: 21
          })
        ] }, recipe.id, true, {
          fileName: "<stdin>",
          lineNumber: 3405,
          columnNumber: 17
        });
      }) }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 3399,
        columnNumber: 11
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 3386,
      columnNumber: 9
    }),
    activeTab === "aura" && /* @__PURE__ */ jsxDEV("div", { className: "animate-fadeIn", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "glass-panel", style: { padding: 25, marginBottom: 25, textAlign: "center", background: "linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(15, 23, 42, 0.8))", borderColor: "rgba(168, 85, 247, 0.3)" }, children: [
        /* @__PURE__ */ jsxDEV(Sparkles, { size: 40, color: "#a855f7", style: { marginBottom: 15 } }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 3467,
          columnNumber: 13
        }),
        /* @__PURE__ */ jsxDEV("h3", { style: { margin: 0, fontSize: "1.5rem", fontWeight: 900, color: "#fff" }, children: "AURA SANCTUM" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 3468,
          columnNumber: 13
        }),
        /* @__PURE__ */ jsxDEV("p", { style: { fontSize: "0.85rem", color: "#94a3b8", maxWidth: "400px", margin: "10px auto" }, children: "Channel your accumulated aura into permanent resonance, strengthening every hero in your multiverse." }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 3469,
          columnNumber: 13
        }),
        /* @__PURE__ */ jsxDEV("div", { style: { display: "inline-flex", alignItems: "center", gap: 10, background: "rgba(168, 85, 247, 0.2)", padding: "6px 20px", borderRadius: 20, border: "1px solid rgba(168, 85, 247, 0.3)", marginTop: 10 }, children: [
          /* @__PURE__ */ jsxDEV(Zap, { size: 16, color: "#a855f7" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 3471,
            columnNumber: 15
          }),
          /* @__PURE__ */ jsxDEV("span", { style: { fontWeight: 900, fontSize: "1.1rem" }, children: [
            aura,
            " AVAILABLE"
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 3472,
            columnNumber: 15
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 3470,
          columnNumber: 13
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 3466,
        columnNumber: 11
      }),
      /* @__PURE__ */ jsxDEV("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 15 }, children: ["atk", "def", "hp", "speed", "magic_atk", "magic_def", "luck", "xp", "stamina", "vault", "bond"].map((stat) => {
        const count = auraUpgrades[stat] || 0;
        const cost = 5 + count * 5;
        const statLabels = {
          atk: { label: "Physical Force", icon: /* @__PURE__ */ jsxDEV(Sword, { size: 20 }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 3481,
            columnNumber: 55
          }), color: "#f87171" },
          def: { label: "Iron Guard", icon: /* @__PURE__ */ jsxDEV(Shield, { size: 20 }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 3482,
            columnNumber: 51
          }), color: "#60a5fa" },
          hp: { label: "Vigor Pulse", icon: /* @__PURE__ */ jsxDEV(Activity, { size: 20 }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 3483,
            columnNumber: 51
          }), color: "#4ade80" },
          speed: { label: "Flash Step", icon: /* @__PURE__ */ jsxDEV(Zap, { size: 20 }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 3484,
            columnNumber: 53
          }), color: "#facc15" },
          magic_atk: { label: "Ether Blast", icon: /* @__PURE__ */ jsxDEV(Sparkles, { size: 20 }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 3485,
            columnNumber: 58
          }), color: "#a855f7" },
          magic_def: { label: "Arcane Veil", icon: /* @__PURE__ */ jsxDEV(Monitor, { size: 20 }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 3486,
            columnNumber: 58
          }), color: "#818cf8" },
          luck: { label: "Fate Twist", icon: /* @__PURE__ */ jsxDEV(Clover, { size: 20 }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 3487,
            columnNumber: 52
          }), color: "#34d399" },
          xp: { label: "Quick Study", icon: /* @__PURE__ */ jsxDEV(Book, { size: 20 }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 3488,
            columnNumber: 51
          }), color: "#f472b6" },
          stamina: { label: "Deep Breath", icon: /* @__PURE__ */ jsxDEV(Zap, { size: 20 }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 3489,
            columnNumber: 56
          }), color: "#34d399" },
          vault: { label: "Gold Hoard", icon: /* @__PURE__ */ jsxDEV(Database, { size: 20 }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 3490,
            columnNumber: 53
          }), color: "#fbbf24" },
          bond: { label: "Soul Link", icon: /* @__PURE__ */ jsxDEV(Heart, { size: 20 }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 3491,
            columnNumber: 51
          }), color: "#ec4899" }
        };
        const cfg = statLabels[stat] || { label: stat, icon: /* @__PURE__ */ jsxDEV(Sparkles, { size: 20 }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 3493,
          columnNumber: 68
        }), color: "#fff" };
        return /* @__PURE__ */ jsxDEV("div", { className: "shop-card-v3", style: { textAlign: "left", padding: 16, borderLeft: `4px solid ${cfg.color}` }, children: [
          /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }, children: [
            /* @__PURE__ */ jsxDEV("div", { style: { color: cfg.color, background: `${cfg.color}15`, width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }, children: cfg.icon }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 3498,
              columnNumber: 21
            }),
            /* @__PURE__ */ jsxDEV("div", { style: { textAlign: "right" }, children: [
              /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.6rem", color: "#94a3b8", fontWeight: 900 }, children: "RESONANCE" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 3502,
                columnNumber: 24
              }),
              /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "1.2rem", fontWeight: 900 }, children: [
                "LV.",
                count
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 3503,
                columnNumber: 24
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 3501,
              columnNumber: 21
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 3497,
            columnNumber: 19
          }),
          /* @__PURE__ */ jsxDEV("div", { style: { fontWeight: 900, fontSize: "1rem", color: "#fff", marginBottom: 4 }, children: cfg.label }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 3507,
            columnNumber: 19
          }),
          /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.75rem", color: "#94a3b8", marginBottom: 15 }, children: [
            "Current Bonus: ",
            /* @__PURE__ */ jsxDEV("span", { style: { color: "#4ade80", fontWeight: 900 }, children: [
              "+",
              count * 2,
              "%"
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 3508,
              columnNumber: 107
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 3508,
            columnNumber: 19
          }),
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              className: "shop-buy-btn",
              style: { background: aura >= cost ? cfg.color : "rgba(255,255,255,0.05)", color: aura >= cost ? "#000" : "rgba(255,255,255,0.2)", border: "none" },
              onClick: () => {
                if (aura >= cost) {
                  setAura((a) => a - cost);
                  setAuraUpgrades((p) => ({ ...p, [stat]: (p[stat] || 0) + 1 }));
                  createFloatingText(`${stat.toUpperCase()} RESONANCE UP!`, false, cfg.color);
                  playSound("upgrade");
                } else createFloatingText(`Need ${cost} Aura`, true);
              },
              children: [
                "UPGRADE (",
                cost,
                " AURA)"
              ]
            },
            void 0,
            true,
            {
              fileName: "<stdin>",
              lineNumber: 3510,
              columnNumber: 19
            }
          )
        ] }, stat, true, {
          fileName: "<stdin>",
          lineNumber: 3496,
          columnNumber: 17
        });
      }) }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 3476,
        columnNumber: 11
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 3465,
      columnNumber: 9
    })
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 2741,
    columnNumber: 5
  });
};;

export { ShopView };
