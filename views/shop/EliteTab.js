import { jsxDEV } from "react/jsx-dev-runtime";
import React from "react";
import { Heart, Sword, Shield, Zap, Sparkles, LayoutGrid, Package, Book, Star, Gem, Monitor, Database, Info, X, Hammer, Activity, Clover, Crown } from "lucide-react";
import { playSound } from "../../utils.js";
import { isMobile } from "../ViewShared.js";
const EliteTab = (props) => {
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
    /* @__PURE__ */ jsxDEV("div", { className: "shop-featured-banner", style: {
      background: "linear-gradient(135deg, #1e293b, #0f172a)",
      border: "2px solid #facc15",
      marginBottom: 25
    }, children: [
      /* @__PURE__ */ jsxDEV("div", { className: "featured-content", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "featured-tag", style: {
          background: "#facc15",
          color: "#000"
        }, children: "LEVEL 100+ EXCLUSIVES" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\EliteTab.jsx",
          lineNumber: 77,
          columnNumber: 42
        }),
        /* @__PURE__ */ jsxDEV("h3", { className: "featured-title", children: "High-Dimension Synthetics" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\EliteTab.jsx",
          lineNumber: 80,
          columnNumber: 39
        }),
        /* @__PURE__ */ jsxDEV("p", { className: "featured-desc", children: "These items bypass standard tactical limits. Requires both mass Credits and Dimensional Gems." }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\EliteTab.jsx",
          lineNumber: 80,
          columnNumber: 100
        })
      ] }, void 0, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\EliteTab.jsx",
        lineNumber: 77,
        columnNumber: 8
      }),
      /* @__PURE__ */ jsxDEV(Crown, { size: 64, color: "#facc15", className: "animate-pulse" }, void 0, false, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\EliteTab.jsx",
        lineNumber: 80,
        columnNumber: 232
      })
    ] }, void 0, true, {
      fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\EliteTab.jsx",
      lineNumber: 73,
      columnNumber: 42
    }),
    /* @__PURE__ */ jsxDEV("div", { className: "shop-grid v3", children: Object.entries(items || {}).filter(([_, item]) => item.dualCost).map(([id, item]) => /* @__PURE__ */ jsxDEV("div", { className: "shop-card-v3", style: {
      border: "1px solid #facc1533"
    }, children: [
      /* @__PURE__ */ jsxDEV("div", { className: "shop-rarity-stripe", style: {
        background: "#facc15"
      } }, void 0, false, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\EliteTab.jsx",
        lineNumber: 82,
        columnNumber: 10
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "shop-card-header-v3", children: /* @__PURE__ */ jsxDEV("img", { src: item.imageUrl, alt: item.name }, void 0, false, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\EliteTab.jsx",
        lineNumber: 84,
        columnNumber: 51
      }) }, void 0, false, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\EliteTab.jsx",
        lineNumber: 84,
        columnNumber: 14
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "shop-card-body-v3", children: [
        /* @__PURE__ */ jsxDEV("div", { style: {
          display: "flex",
          alignItems: "center",
          marginBottom: 2
        }, children: [
          /* @__PURE__ */ jsxDEV("div", { className: "rarity-dot", style: {
            background: "#facc15"
          } }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\EliteTab.jsx",
            lineNumber: 88,
            columnNumber: 14
          }),
          /* @__PURE__ */ jsxDEV("span", { style: {
            fontSize: "0.6rem",
            fontWeight: 900,
            textTransform: "uppercase",
            color: "#facc15"
          }, children: "ELITE ARTIFACT" }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\EliteTab.jsx",
            lineNumber: 90,
            columnNumber: 18
          })
        ] }, void 0, true, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\EliteTab.jsx",
          lineNumber: 84,
          columnNumber: 135
        }),
        /* @__PURE__ */ jsxDEV("h4", { className: "shop-card-title-v3", children: item.name }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\EliteTab.jsx",
          lineNumber: 95,
          columnNumber: 43
        }),
        /* @__PURE__ */ jsxDEV("p", { className: "shop-card-desc-v3", children: item.detailedDesc || item.desc }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\EliteTab.jsx",
          lineNumber: 95,
          columnNumber: 94
        }),
        /* @__PURE__ */ jsxDEV("div", { style: {
          marginTop: "auto",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          paddingTop: 12
        }, children: [
          /* @__PURE__ */ jsxDEV("div", { style: {
            display: "flex",
            flexDirection: "column",
            gap: 4,
            marginBottom: 12
          }, children: [
            /* @__PURE__ */ jsxDEV("div", { style: {
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: "0.85rem",
              fontWeight: 900,
              color: credits >= item.dualCost.credits ? "#facc15" : "#ef4444"
            }, children: [
              /* @__PURE__ */ jsxDEV(Database, { size: 12 }, void 0, false, {
                fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\EliteTab.jsx",
                lineNumber: 111,
                columnNumber: 18
              }),
              " $",
              item.dualCost.credits.toLocaleString()
            ] }, void 0, true, {
              fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\EliteTab.jsx",
              lineNumber: 104,
              columnNumber: 16
            }),
            /* @__PURE__ */ jsxDEV("div", { style: {
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: "0.85rem",
              fontWeight: 900,
              color: gems >= item.dualCost.gems ? "#00d2ff" : "#ef4444"
            }, children: [
              /* @__PURE__ */ jsxDEV(Gem, { size: 12 }, void 0, false, {
                fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\EliteTab.jsx",
                lineNumber: 118,
                columnNumber: 18
              }),
              " ",
              item.dualCost.gems.toLocaleString(),
              " GEMS"
            ] }, void 0, true, {
              fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\EliteTab.jsx",
              lineNumber: 111,
              columnNumber: 88
            })
          ] }, void 0, true, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\EliteTab.jsx",
            lineNumber: 99,
            columnNumber: 14
          }),
          /* @__PURE__ */ jsxDEV("button", { className: "shop-buy-btn", style: {
            background: credits >= item.dualCost.credits && gems >= item.dualCost.gems ? "var(--primary)" : "#334155"
          }, onClick: () => {
            if (credits >= item.dualCost.credits && gems >= item.dualCost.gems) {
              setCredits((c) => c - item.dualCost.credits);
              setGems((g) => g - item.dualCost.gems);
              addToInventory(id);
              playSound("purchase");
              createFloatingText(`Elite Acquisition: ${item.name}`, false, "#facc15");
            } else createFloatingText("Resources Insufficient", true);
          }, children: "ACQUIRE" }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\EliteTab.jsx",
            lineNumber: 118,
            columnNumber: 90
          })
        ] }, void 0, true, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\EliteTab.jsx",
          lineNumber: 95,
          columnNumber: 163
        })
      ] }, void 0, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\EliteTab.jsx",
        lineNumber: 84,
        columnNumber: 100
      })
    ] }, id, true, {
      fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\EliteTab.jsx",
      lineNumber: 80,
      columnNumber: 415
    })) }, void 0, false, {
      fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\EliteTab.jsx",
      lineNumber: 80,
      columnNumber: 299
    })
  ] }, void 0, true, {
    fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\EliteTab.jsx",
    lineNumber: 73,
    columnNumber: 10
  });
};
export {
  EliteTab
};
