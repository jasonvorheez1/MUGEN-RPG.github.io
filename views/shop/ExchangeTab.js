import { jsxDEV } from "react/jsx-dev-runtime";
import React from "react";
import { Heart, Sword, Shield, Zap, Sparkles, LayoutGrid, Package, Book, Star, Gem, Monitor, Database, Info, X, Hammer, Activity, Clover, Crown } from "lucide-react";
import { playSound } from "../../utils.js";
import { isMobile } from "../ViewShared.js";
const ExchangeTab = (props) => {
  const {
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
    items,
    triggerVisualEffect,
    inventory,
    safeTriggerVisualEffect,
    isSummoning,
    setIsSummoning,
    summonResult,
    setSummonResult,
    autorollActive,
    setAutorollActive,
    rollsRemaining,
    setRollsRemaining,
    activeTab,
    setActiveTab,
    gambleResult,
    setGambleResult,
    isFeatureUnlocked,
    summonHero,
    startAutoRolls,
    confirmSummon,
    dailyDeals,
    unlockFeature,
    dealSeed,
    CRAFTING_RECIPES,
    handleCraft,
    calculateMaxCraft,
    AURA_STAT_LIST,
    auraLevelCost,
    affordableAuraLevels,
    upgradeAuraBulk,
    upgradeAuraAll,
    COOKING_RECIPES,
    GAMBLE_COOK_COST,
    GAMBLE_COOK_POOL,
    canAffordGamble,
    handleGambleCook
  } = props;
  return /* @__PURE__ */ jsxDEV("div", { className: "animate-fadeIn", children: [
    /* @__PURE__ */ jsxDEV("div", { className: "glass-panel", style: {
      marginBottom: 20,
      textAlign: "center",
      borderColor: "#facc15",
      boxShadow: "0 0 20px rgba(250, 204, 21, 0.1)"
    }, children: [
      /* @__PURE__ */ jsxDEV("h3", { style: {
        margin: 0,
        color: "#facc15",
        fontSize: "1.5rem",
        fontWeight: 900
      }, children: "BLACK MARKET EXCHANGE" }, void 0, false, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\ExchangeTab.jsx",
        lineNumber: 78,
        columnNumber: 8
      }),
      /* @__PURE__ */ jsxDEV("p", { style: {
        fontSize: "0.8rem",
        color: "var(--text-muted)"
      }, children: "Convert surplus resources instantly. No refunds." }, void 0, false, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\ExchangeTab.jsx",
        lineNumber: 83,
        columnNumber: 36
      })
    ] }, void 0, true, {
      fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\ExchangeTab.jsx",
      lineNumber: 73,
      columnNumber: 42
    }),
    /* @__PURE__ */ jsxDEV("div", { className: "shop-grid v3", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "shop-card-v3", style: {
        gridColumn: "span 2"
      }, children: [
        /* @__PURE__ */ jsxDEV("div", { className: "shop-card-icon-v3", style: {
          color: "#facc15"
        }, children: /* @__PURE__ */ jsxDEV(Database, { size: 24 }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\ExchangeTab.jsx",
          lineNumber: 90,
          columnNumber: 12
        }) }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\ExchangeTab.jsx",
          lineNumber: 88,
          columnNumber: 10
        }),
        /* @__PURE__ */ jsxDEV("h4", { className: "shop-card-title-v3", children: "Industrial Resource Liquidation" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\ExchangeTab.jsx",
          lineNumber: 90,
          columnNumber: 40
        }),
        /* @__PURE__ */ jsxDEV("p", { className: "shop-card-desc-v3", children: "Dump massive credit reserves to instantly manufacture raw materials materials for crafting." }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\ExchangeTab.jsx",
          lineNumber: 90,
          columnNumber: 111
        }),
        /* @__PURE__ */ jsxDEV("div", { style: {
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10
        }, children: [
          /* @__PURE__ */ jsxDEV("button", { className: "shop-buy-btn", onClick: () => {
            if (credits >= 1e5) {
              setCredits((c) => c - 1e5);
              setMaterials((s) => s + 1e3);
              createFloatingText("+1,000 Materials", false, "#94a3b8");
              playSound("sell_item");
            } else createFloatingText("Need $100k", true);
          }, children: "$100k \u2192 1k Materials" }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\ExchangeTab.jsx",
            lineNumber: 94,
            columnNumber: 12
          }),
          /* @__PURE__ */ jsxDEV("button", { className: "shop-buy-btn", onClick: () => {
            if (credits >= 1e6) {
              setCredits((c) => c - 1e6);
              setMaterials((s) => s + 1e4);
              createFloatingText("+10,000 Materials", false, "#94a3b8");
              playSound("sell_item");
            } else createFloatingText("Need $1.0M", true);
          }, children: "$1.0M \u2192 10k Materials" }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\ExchangeTab.jsx",
            lineNumber: 101,
            columnNumber: 43
          }),
          /* @__PURE__ */ jsxDEV("button", { className: "shop-buy-btn", onClick: () => {
            if (credits >= 25e5) {
              setCredits((c) => c - 25e5);
              setMaterials((s) => s + 25e3);
              createFloatingText("+25,000 Materials", false, "#94a3b8");
              playSound("sell_item");
            } else createFloatingText("Need $2.5M", true);
          }, children: "$2.5M \u2192 25k Materials" }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\ExchangeTab.jsx",
            lineNumber: 108,
            columnNumber: 44
          }),
          /* @__PURE__ */ jsxDEV("button", { className: "shop-buy-btn", style: {
            background: "linear-gradient(135deg, #334155, #1e293b)"
          }, onClick: () => {
            if (credits >= 5e6) {
              setCredits((c) => c - 5e6);
              setMaterials((s) => s + 5e4);
              createFloatingText("+50,000 Materials!", false, "#fff");
              playSound("item_craft");
            } else createFloatingText("Need $5.0M", true);
          }, children: "$5.0M \u2192 50k Materials" }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\ExchangeTab.jsx",
            lineNumber: 115,
            columnNumber: 44
          })
        ] }, void 0, true, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\ExchangeTab.jsx",
          lineNumber: 90,
          columnNumber: 239
        })
      ] }, void 0, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\ExchangeTab.jsx",
        lineNumber: 86,
        columnNumber: 98
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "shop-card-v3", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "shop-card-icon-v3", style: {
          color: "#4ade80"
        }, children: /* @__PURE__ */ jsxDEV(Zap, { size: 24 }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\ExchangeTab.jsx",
          lineNumber: 126,
          columnNumber: 12
        }) }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\ExchangeTab.jsx",
          lineNumber: 124,
          columnNumber: 86
        }),
        /* @__PURE__ */ jsxDEV("h4", { className: "shop-card-title-v3", children: "Energy Surge" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\ExchangeTab.jsx",
          lineNumber: 126,
          columnNumber: 35
        }),
        /* @__PURE__ */ jsxDEV("p", { className: "shop-card-desc-v3", children: "Burn materials to keep training forever." }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\ExchangeTab.jsx",
          lineNumber: 126,
          columnNumber: 87
        }),
        /* @__PURE__ */ jsxDEV("button", { className: "shop-buy-btn", onClick: () => {
          if (materials >= 500) {
            setMaterials((s) => s - 500);
            setStamina((st) => Math.min(maxStamina, st + 100));
            createFloatingText("+100 Stamina", false, "#4ade80");
            playSound("heal_spell");
          } else createFloatingText("Need 500 Materials", true);
        }, children: "500 Materials \u2192 100 Sta" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\ExchangeTab.jsx",
          lineNumber: 126,
          columnNumber: 164
        })
      ] }, void 0, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\ExchangeTab.jsx",
        lineNumber: 124,
        columnNumber: 56
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "shop-card-v3", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "shop-card-icon-v3", style: {
          color: "#f97316"
        }, children: /* @__PURE__ */ jsxDEV(Star, { size: 24 }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\ExchangeTab.jsx",
          lineNumber: 135,
          columnNumber: 12
        }) }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\ExchangeTab.jsx",
          lineNumber: 133,
          columnNumber: 80
        }),
        /* @__PURE__ */ jsxDEV("h4", { className: "shop-card-title-v3", children: "Essence Distillation" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\ExchangeTab.jsx",
          lineNumber: 135,
          columnNumber: 36
        }),
        /* @__PURE__ */ jsxDEV("p", { className: "shop-card-desc-v3", children: "Condense materials into pure essence." }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\ExchangeTab.jsx",
          lineNumber: 135,
          columnNumber: 96
        }),
        /* @__PURE__ */ jsxDEV("button", { className: "shop-buy-btn", onClick: () => {
          if (materials >= 2500) {
            setMaterials((s) => s - 2500);
            setEssence((e) => e + 10);
            createFloatingText("+10 Essence", false, "#f97316");
            playSound("magic_blast");
          } else createFloatingText("Need 2.5k Materials", true);
        }, children: "2.5k Materials \u2192 10 Ess" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\ExchangeTab.jsx",
          lineNumber: 135,
          columnNumber: 170
        })
      ] }, void 0, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\ExchangeTab.jsx",
        lineNumber: 133,
        columnNumber: 50
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "shop-card-v3", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "shop-card-icon-v3", style: {
          color: "#00d2ff"
        }, children: /* @__PURE__ */ jsxDEV(Gem, { size: 24 }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\ExchangeTab.jsx",
          lineNumber: 144,
          columnNumber: 12
        }) }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\ExchangeTab.jsx",
          lineNumber: 142,
          columnNumber: 80
        }),
        /* @__PURE__ */ jsxDEV("h4", { className: "shop-card-title-v3", children: "Gem Synthesis" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\ExchangeTab.jsx",
          lineNumber: 144,
          columnNumber: 35
        }),
        /* @__PURE__ */ jsxDEV("p", { className: "shop-card-desc-v3", children: "The ultimate conversion." }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\ExchangeTab.jsx",
          lineNumber: 144,
          columnNumber: 88
        }),
        /* @__PURE__ */ jsxDEV("button", { className: "shop-buy-btn", onClick: () => {
          if (essence >= 50) {
            setEssence((e) => e - 50);
            setGems((g) => g + 50);
            createFloatingText("+50 Gems", false, "#00d2ff");
            playSound("gacha_legendary");
          } else createFloatingText("Need 50 Essence", true);
        }, children: "50 Ess \u2192 50 Gems" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\ExchangeTab.jsx",
          lineNumber: 144,
          columnNumber: 149
        })
      ] }, void 0, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\ExchangeTab.jsx",
        lineNumber: 142,
        columnNumber: 50
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "shop-card-v3", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "shop-card-icon-v3", style: {
          color: "#a855f7"
        }, children: /* @__PURE__ */ jsxDEV(Zap, { size: 24 }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\ExchangeTab.jsx",
          lineNumber: 153,
          columnNumber: 12
        }) }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\ExchangeTab.jsx",
          lineNumber: 151,
          columnNumber: 73
        }),
        /* @__PURE__ */ jsxDEV("h4", { className: "shop-card-title-v3", children: "Aura Compression" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\ExchangeTab.jsx",
          lineNumber: 153,
          columnNumber: 35
        }),
        /* @__PURE__ */ jsxDEV("p", { className: "shop-card-desc-v3", children: "Compress massive materials into raw account Aura." }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\ExchangeTab.jsx",
          lineNumber: 153,
          columnNumber: 91
        }),
        /* @__PURE__ */ jsxDEV("button", { className: "shop-buy-btn", onClick: () => {
          if (materials >= 1e5) {
            setMaterials((s) => s - 1e5);
            setAura((a) => a + 100);
            createFloatingText("+100 Aura", false, "#a855f7");
            playSound("magic_blast");
          } else createFloatingText("Need 100k Materials", true);
        }, children: "100k Materials \u2192 100 Aura" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\ExchangeTab.jsx",
          lineNumber: 153,
          columnNumber: 177
        })
      ] }, void 0, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\ExchangeTab.jsx",
        lineNumber: 151,
        columnNumber: 43
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "shop-card-v3", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "shop-card-icon-v3", style: {
          color: "#facc15"
        }, children: /* @__PURE__ */ jsxDEV(Database, { size: 24 }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\ExchangeTab.jsx",
          lineNumber: 162,
          columnNumber: 12
        }) }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\ExchangeTab.jsx",
          lineNumber: 160,
          columnNumber: 82
        }),
        /* @__PURE__ */ jsxDEV("h4", { className: "shop-card-title-v3", children: "Reality Funding" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\ExchangeTab.jsx",
          lineNumber: 162,
          columnNumber: 40
        }),
        /* @__PURE__ */ jsxDEV("p", { className: "shop-card-desc-v3", children: "Donate to the city's future for a massive Gem grant." }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\ExchangeTab.jsx",
          lineNumber: 162,
          columnNumber: 95
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
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\ExchangeTab.jsx",
          lineNumber: 162,
          columnNumber: 184
        })
      ] }, void 0, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\ExchangeTab.jsx",
        lineNumber: 160,
        columnNumber: 52
      })
    ] }, void 0, true, {
      fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\ExchangeTab.jsx",
      lineNumber: 86,
      columnNumber: 68
    })
  ] }, void 0, true, {
    fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\ExchangeTab.jsx",
    lineNumber: 73,
    columnNumber: 10
  });
};
export {
  ExchangeTab
};
