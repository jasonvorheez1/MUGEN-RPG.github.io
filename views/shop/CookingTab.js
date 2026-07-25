import { jsxDEV } from "react/jsx-dev-runtime";
import React from "react";
import { Heart, Sword, Shield, Zap, Sparkles, LayoutGrid, Package, Book, Star, Gem, Monitor, Database, Info, X, Hammer, Activity, Clover, Crown } from "lucide-react";
import { playSound } from "../../utils.js";
import { isMobile } from "../ViewShared.js";
const CookingTab = (props) => {
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
    gambleResult && /* @__PURE__ */ jsxDEV("div", { className: "summoning-overlay", onClick: () => setGambleResult(null), children: /* @__PURE__ */ jsxDEV("div", { className: "glass-panel animate-popIn", style: {
      padding: 40,
      textAlign: "center",
      maxWidth: 340,
      border: "2px solid var(--gem-color)"
    }, children: [
      gambleResult.imageUrl && /* @__PURE__ */ jsxDEV("img", { src: gambleResult.imageUrl, style: {
        width: 90,
        height: 90,
        objectFit: "contain",
        marginBottom: 15
      } }, void 0, false, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\CookingTab.jsx",
        lineNumber: 78,
        columnNumber: 36
      }),
      /* @__PURE__ */ jsxDEV("h2", { style: {
        margin: "0 0 5px 0",
        fontFamily: "Cinzel",
        letterSpacing: 1
      }, children: gambleResult.name }, void 0, false, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\CookingTab.jsx",
        lineNumber: 83,
        columnNumber: 15
      }),
      /* @__PURE__ */ jsxDEV("p", { style: {
        fontSize: "0.8rem",
        opacity: 0.8,
        margin: "10px 0 25px 0"
      }, children: gambleResult.desc }, void 0, false, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\CookingTab.jsx",
        lineNumber: 87,
        columnNumber: 36
      }),
      /* @__PURE__ */ jsxDEV("button", { className: "train-btn", onClick: () => setGambleResult(null), children: "NICE" }, void 0, false, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\CookingTab.jsx",
        lineNumber: 91,
        columnNumber: 35
      })
    ] }, void 0, true, {
      fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\CookingTab.jsx",
      lineNumber: 73,
      columnNumber: 132
    }) }, void 0, false, {
      fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\CookingTab.jsx",
      lineNumber: 73,
      columnNumber: 59
    }),
    /* @__PURE__ */ jsxDEV("div", { className: "glass-panel", style: {
      padding: 25,
      marginBottom: 25,
      textAlign: "center",
      background: "linear-gradient(135deg, rgba(250, 204, 21, 0.08), rgba(15, 23, 42, 0.8))",
      borderColor: "rgba(250, 204, 21, 0.3)"
    }, children: [
      /* @__PURE__ */ jsxDEV(Activity, { size: 36, color: "#facc15", style: {
        marginBottom: 12
      } }, void 0, false, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\CookingTab.jsx",
        lineNumber: 97,
        columnNumber: 8
      }),
      /* @__PURE__ */ jsxDEV("h3", { style: {
        margin: 0,
        fontSize: "1.3rem",
        fontWeight: 900,
        color: "#fff"
      }, children: "GAMBLE COOK" }, void 0, false, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\CookingTab.jsx",
        lineNumber: 99,
        columnNumber: 12
      }),
      /* @__PURE__ */ jsxDEV("p", { style: {
        fontSize: "0.8rem",
        color: "#94a3b8",
        maxWidth: 420,
        margin: "8px auto"
      }, children: "Throw resources at the stove and see what comes out. Cheaper than any single recipe -- but you don't pick the dish." }, void 0, false, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\CookingTab.jsx",
        lineNumber: 104,
        columnNumber: 26
      }),
      /* @__PURE__ */ jsxDEV("div", { style: {
        display: "flex",
        justifyContent: "center",
        gap: 15,
        margin: "12px 0 18px 0",
        flexWrap: "wrap"
      }, children: [
        /* @__PURE__ */ jsxDEV("span", { style: {
          fontSize: "0.75rem",
          fontWeight: 800,
          color: materials >= GAMBLE_COOK_COST.materials ? "#fff" : "#ef4444"
        }, children: `${GAMBLE_COOK_COST.materials.toLocaleString()} Materials` }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\CookingTab.jsx",
          lineNumber: 115,
          columnNumber: 10
        }),
        /* @__PURE__ */ jsxDEV("span", { style: {
          fontSize: "0.75rem",
          fontWeight: 800,
          color: essence >= GAMBLE_COOK_COST.essence ? "#f97316" : "#ef4444"
        }, children: `${GAMBLE_COOK_COST.essence.toLocaleString()} Essence` }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\CookingTab.jsx",
          lineNumber: 119,
          columnNumber: 79
        }),
        /* @__PURE__ */ jsxDEV("span", { style: {
          fontSize: "0.75rem",
          fontWeight: 800,
          color: credits >= GAMBLE_COOK_COST.credits ? "#facc15" : "#ef4444"
        }, children: `$${GAMBLE_COOK_COST.credits.toLocaleString()}` }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\CookingTab.jsx",
          lineNumber: 123,
          columnNumber: 75
        })
      ] }, void 0, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\CookingTab.jsx",
        lineNumber: 109,
        columnNumber: 129
      }),
      /* @__PURE__ */ jsxDEV("button", { className: "train-btn", style: {
        width: "auto",
        padding: "12px 40px"
      }, onClick: handleGambleCook, disabled: !canAffordGamble, children: "COOK!" }, void 0, false, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\CookingTab.jsx",
        lineNumber: 127,
        columnNumber: 74
      })
    ] }, void 0, true, {
      fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\CookingTab.jsx",
      lineNumber: 91,
      columnNumber: 129
    }),
    /* @__PURE__ */ jsxDEV("div", { style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
      gap: 20
    }, children: COOKING_RECIPES.map((recipe, idx) => {
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
            flexShrink: 0,
            overflow: "hidden"
          }, children: outputItem.imageUrl ? /* @__PURE__ */ jsxDEV("img", { src: outputItem.imageUrl, style: {
            width: "100%",
            height: "100%",
            objectFit: "contain"
          } }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\CookingTab.jsx",
            lineNumber: 159,
            columnNumber: 39
          }) : /* @__PURE__ */ jsxDEV(Activity, { size: 24, color: "var(--primary)" }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\CookingTab.jsx",
            lineNumber: 163,
            columnNumber: 23
          }) }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\CookingTab.jsx",
            lineNumber: 149,
            columnNumber: 14
          }),
          /* @__PURE__ */ jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDEV("h4", { style: {
              margin: 0,
              fontSize: "1.1rem",
              fontWeight: 900,
              color: "#fff"
            }, children: recipe.name }, void 0, false, {
              fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\CookingTab.jsx",
              lineNumber: 163,
              columnNumber: 80
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
              fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\CookingTab.jsx",
              lineNumber: 168,
              columnNumber: 36
            })
          ] }, void 0, true, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\CookingTab.jsx",
            lineNumber: 163,
            columnNumber: 75
          })
        ] }, void 0, true, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\CookingTab.jsx",
          lineNumber: 145,
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
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\CookingTab.jsx",
          lineNumber: 172,
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
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\CookingTab.jsx",
            lineNumber: 184,
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
                fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\CookingTab.jsx",
                lineNumber: 201,
                columnNumber: 18
              }),
              " ",
              recipe.cost.materials
            ] }, void 0, true, {
              fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\CookingTab.jsx",
              lineNumber: 194,
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
                fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\CookingTab.jsx",
                lineNumber: 208,
                columnNumber: 18
              }),
              " ",
              recipe.cost.essence
            ] }, void 0, true, {
              fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\CookingTab.jsx",
              lineNumber: 201,
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
                fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\CookingTab.jsx",
                lineNumber: 215,
                columnNumber: 18
              }),
              " $",
              recipe.cost.credits
            ] }, void 0, true, {
              fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\CookingTab.jsx",
              lineNumber: 208,
              columnNumber: 89
            }),
            recipe.cost.gems && /* @__PURE__ */ jsxDEV("div", { style: {
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontSize: "0.75rem",
              fontWeight: 800,
              color: gems >= recipe.cost.gems ? "#00d2ff" : "#ef4444"
            }, children: [
              /* @__PURE__ */ jsxDEV(Gem, { size: 12 }, void 0, false, {
                fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\CookingTab.jsx",
                lineNumber: 222,
                columnNumber: 18
              }),
              " ",
              recipe.cost.gems
            ] }, void 0, true, {
              fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\CookingTab.jsx",
              lineNumber: 215,
              columnNumber: 91
            })
          ] }, void 0, true, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\CookingTab.jsx",
            lineNumber: 190,
            columnNumber: 41
          })
        ] }, void 0, true, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\CookingTab.jsx",
          lineNumber: 179,
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
          }, onClick: () => handleCraft(recipe, 1), disabled: max < 1, children: "COOK x1" }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\CookingTab.jsx",
            lineNumber: 225,
            columnNumber: 14
          }),
          /* @__PURE__ */ jsxDEV("button", { className: "shop-buy-btn", style: {
            flex: 2,
            padding: "10px",
            fontSize: "0.8rem",
            background: max >= 1 ? "var(--primary)" : "#334155",
            border: "none"
          }, onClick: () => handleCraft(recipe, max), disabled: max < 1, children: `COOK MAX (${max})` }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\CookingTab.jsx",
            lineNumber: 230,
            columnNumber: 90
          })
        ] }, void 0, true, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\CookingTab.jsx",
          lineNumber: 222,
          columnNumber: 73
        })
      ] }, recipe.id, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\CookingTab.jsx",
        lineNumber: 140,
        columnNumber: 16
      });
    }) }, void 0, false, {
      fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\CookingTab.jsx",
      lineNumber: 130,
      columnNumber: 85
    })
  ] }, void 0, true, {
    fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\CookingTab.jsx",
    lineNumber: 73,
    columnNumber: 10
  });
};
export {
  CookingTab
};
