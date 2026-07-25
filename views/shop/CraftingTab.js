import { jsxDEV } from "react/jsx-dev-runtime";
import React from "react";
import { Heart, Sword, Shield, Zap, Sparkles, LayoutGrid, Package, Book, Star, Gem, Monitor, Database, Info, X, Hammer, Activity, Clover, Crown } from "lucide-react";
import { playSound } from "../../utils.js";
import { isMobile } from "../ViewShared.js";
const CraftingTab = (props) => {
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
      padding: 25,
      marginBottom: 25,
      display: "flex",
      justifyContent: "space-around",
      background: "rgba(15, 23, 42, 0.9)",
      border: "2px solid rgba(255,255,255,0.05)",
      borderRadius: 24
    }, children: [
      /* @__PURE__ */ jsxDEV("div", { style: {
        textAlign: "center",
        flex: 1
      }, children: [
        /* @__PURE__ */ jsxDEV("div", { style: {
          fontSize: "0.7rem",
          color: "#94a3b8",
          fontWeight: 900,
          letterSpacing: 1,
          marginBottom: 5
        }, children: "SALVAGED MATERIALS" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\CraftingTab.jsx",
          lineNumber: 84,
          columnNumber: 10
        }),
        /* @__PURE__ */ jsxDEV("div", { style: {
          fontSize: "1.8rem",
          fontWeight: 900,
          color: "#fff",
          textShadow: "0 0 10px rgba(255,255,255,0.2)"
        }, children: [
          /* @__PURE__ */ jsxDEV(Package, { size: 20, style: {
            marginRight: 5
          } }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\CraftingTab.jsx",
            lineNumber: 95,
            columnNumber: 12
          }),
          " ",
          materials.toLocaleString()
        ] }, void 0, true, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\CraftingTab.jsx",
          lineNumber: 90,
          columnNumber: 36
        })
      ] }, void 0, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\CraftingTab.jsx",
        lineNumber: 81,
        columnNumber: 8
      }),
      /* @__PURE__ */ jsxDEV("div", { style: {
        width: 1,
        height: 50,
        background: "rgba(255,255,255,0.1)"
      } }, void 0, false, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\CraftingTab.jsx",
        lineNumber: 97,
        columnNumber: 57
      }),
      /* @__PURE__ */ jsxDEV("div", { style: {
        textAlign: "center",
        flex: 1
      }, children: [
        /* @__PURE__ */ jsxDEV("div", { style: {
          fontSize: "0.7rem",
          color: "#f97316",
          fontWeight: 900,
          letterSpacing: 1,
          marginBottom: 5
        }, children: "RAW ESSENCE" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\CraftingTab.jsx",
          lineNumber: 104,
          columnNumber: 10
        }),
        /* @__PURE__ */ jsxDEV("div", { style: {
          fontSize: "1.8rem",
          fontWeight: 900,
          color: "#f97316",
          textShadow: "0 0 10px rgba(249, 115, 22, 0.2)"
        }, children: [
          /* @__PURE__ */ jsxDEV(Star, { size: 20, style: {
            marginRight: 5
          } }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\CraftingTab.jsx",
            lineNumber: 115,
            columnNumber: 12
          }),
          " ",
          essence.toLocaleString()
        ] }, void 0, true, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\CraftingTab.jsx",
          lineNumber: 110,
          columnNumber: 29
        })
      ] }, void 0, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\CraftingTab.jsx",
        lineNumber: 101,
        columnNumber: 12
      })
    ] }, void 0, true, {
      fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\CraftingTab.jsx",
      lineNumber: 73,
      columnNumber: 42
    }),
    /* @__PURE__ */ jsxDEV("div", { style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
      gap: 20
    }, children: CRAFTING_RECIPES.map((recipe, idx) => {
      const max = calculateMaxCraft(recipe);
      const outputItem = items[recipe.output] || {
        name: recipe.name,
        icon: "Package"
      };
      return /* @__PURE__ */ jsxDEV("div", { className: "shop-card-v3 animate-shop-entry", style: {
        animationDelay: `${idx * 0.04}s`,
        padding: 20,
        textAlign: "left",
        minHeight: "auto"
      }, children: [
        /* @__PURE__ */ jsxDEV("div", { style: {
          display: "flex",
          gap: 15,
          marginBottom: 15
        }, children: [
          /* @__PURE__ */ jsxDEV("div", { style: {
            width: 56,
            height: 56,
            borderRadius: 16,
            background: "rgba(255,255,255,0.03)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--primary)",
            flexShrink: 0
          }, children: /* @__PURE__ */ jsxDEV(Hammer, { size: 24 }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\CraftingTab.jsx",
            lineNumber: 146,
            columnNumber: 16
          }) }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\CraftingTab.jsx",
            lineNumber: 136,
            columnNumber: 14
          }),
          /* @__PURE__ */ jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDEV("h4", { style: {
              margin: 0,
              fontSize: "1.1rem",
              fontWeight: 900,
              color: "#fff"
            }, children: recipe.name }, void 0, false, {
              fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\CraftingTab.jsx",
              lineNumber: 146,
              columnNumber: 47
            }),
            /* @__PURE__ */ jsxDEV("div", { style: {
              fontSize: "0.7rem",
              color: "var(--text-muted)",
              marginTop: 4
            }, children: [
              "Output: ",
              recipe.qty || 1,
              "x ",
              outputItem.name
            ] }, void 0, true, {
              fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\CraftingTab.jsx",
              lineNumber: 151,
              columnNumber: 36
            })
          ] }, void 0, true, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\CraftingTab.jsx",
            lineNumber: 146,
            columnNumber: 42
          })
        ] }, void 0, true, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\CraftingTab.jsx",
          lineNumber: 132,
          columnNumber: 12
        }),
        /* @__PURE__ */ jsxDEV("p", { style: {
          margin: "0 0 15px 0",
          fontSize: "0.75rem",
          color: "var(--text-muted)",
          lineHeight: 1.4,
          height: "2.8em",
          overflow: "hidden"
        }, children: recipe.desc }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\CraftingTab.jsx",
          lineNumber: 155,
          columnNumber: 80
        }),
        /* @__PURE__ */ jsxDEV("div", { style: {
          background: "rgba(0,0,0,0.2)",
          padding: 12,
          borderRadius: 12,
          marginBottom: 20
        }, children: [
          /* @__PURE__ */ jsxDEV("div", { style: {
            fontSize: "0.65rem",
            fontWeight: 900,
            color: "var(--text-muted)",
            marginBottom: 8,
            textTransform: "uppercase"
          }, children: "Resources Required:" }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\CraftingTab.jsx",
            lineNumber: 167,
            columnNumber: 14
          }),
          /* @__PURE__ */ jsxDEV("div", { style: {
            display: "flex",
            flexWrap: "wrap",
            gap: 10
          }, children: [
            recipe.cost.materials && /* @__PURE__ */ jsxDEV("div", { style: {
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontSize: "0.75rem",
              fontWeight: 800,
              color: materials >= recipe.cost.materials ? "#fff" : "#ef4444"
            }, children: [
              /* @__PURE__ */ jsxDEV(Package, { size: 12 }, void 0, false, {
                fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\CraftingTab.jsx",
                lineNumber: 184,
                columnNumber: 18
              }),
              " ",
              recipe.cost.materials
            ] }, void 0, true, {
              fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\CraftingTab.jsx",
              lineNumber: 177,
              columnNumber: 42
            }),
            recipe.cost.essence && /* @__PURE__ */ jsxDEV("div", { style: {
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontSize: "0.75rem",
              fontWeight: 800,
              color: essence >= recipe.cost.essence ? "#f97316" : "#ef4444"
            }, children: [
              /* @__PURE__ */ jsxDEV(Star, { size: 12 }, void 0, false, {
                fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\CraftingTab.jsx",
                lineNumber: 191,
                columnNumber: 18
              }),
              " ",
              recipe.cost.essence
            ] }, void 0, true, {
              fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\CraftingTab.jsx",
              lineNumber: 184,
              columnNumber: 94
            }),
            recipe.cost.credits && /* @__PURE__ */ jsxDEV("div", { style: {
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontSize: "0.75rem",
              fontWeight: 800,
              color: credits >= recipe.cost.credits ? "#facc15" : "#ef4444"
            }, children: [
              /* @__PURE__ */ jsxDEV(Database, { size: 12 }, void 0, false, {
                fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\CraftingTab.jsx",
                lineNumber: 198,
                columnNumber: 18
              }),
              " $",
              recipe.cost.credits
            ] }, void 0, true, {
              fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\CraftingTab.jsx",
              lineNumber: 191,
              columnNumber: 89
            })
          ] }, void 0, true, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\CraftingTab.jsx",
            lineNumber: 173,
            columnNumber: 41
          })
        ] }, void 0, true, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\CraftingTab.jsx",
          lineNumber: 162,
          columnNumber: 31
        }),
        /* @__PURE__ */ jsxDEV("div", { style: {
          display: "flex",
          gap: 8
        }, children: [
          /* @__PURE__ */ jsxDEV("button", { className: "shop-buy-btn", style: {
            flex: 1,
            padding: "10px",
            fontSize: "0.8rem",
            background: "rgba(255,255,255,0.05)"
          }, onClick: () => handleCraft(recipe, 1), disabled: max < 1, children: "CRAFT x1" }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\CraftingTab.jsx",
            lineNumber: 201,
            columnNumber: 14
          }),
          /* @__PURE__ */ jsxDEV("button", { className: "shop-buy-btn", style: {
            flex: 2,
            padding: "10px",
            fontSize: "0.8rem",
            background: max >= 1 ? "var(--primary)" : "#334155",
            border: "none"
          }, onClick: () => handleCraft(recipe, max), disabled: max < 1, children: [
            "CRAFT MAX (",
            max,
            ")"
          ] }, void 0, true, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\CraftingTab.jsx",
            lineNumber: 206,
            columnNumber: 91
          })
        ] }, void 0, true, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\CraftingTab.jsx",
          lineNumber: 198,
          columnNumber: 82
        })
      ] }, recipe.id, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\CraftingTab.jsx",
        lineNumber: 127,
        columnNumber: 16
      });
    }) }, void 0, false, {
      fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\CraftingTab.jsx",
      lineNumber: 117,
      columnNumber: 61
    })
  ] }, void 0, true, {
    fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\CraftingTab.jsx",
    lineNumber: 73,
    columnNumber: 10
  });
};
export {
  CraftingTab
};
