import { jsxDEV } from "react/jsx-dev-runtime";
import React from "react";
import { Heart, Sword, Shield, Zap, Sparkles, LayoutGrid, Package, Book, Star, Gem, Monitor, Database, Info, X, Hammer, Activity, Clover, Crown } from "lucide-react";
import { playSound } from "../../utils.js";
import { isMobile } from "../ViewShared.js";
const AuraTab = (props) => {
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
      textAlign: "center",
      background: "linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(15, 23, 42, 0.8))",
      borderColor: "rgba(168, 85, 247, 0.3)"
    }, children: [
      /* @__PURE__ */ jsxDEV(Sparkles, { size: 40, color: "#a855f7", style: {
        marginBottom: 15
      } }, void 0, false, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\AuraTab.jsx",
        lineNumber: 79,
        columnNumber: 8
      }),
      /* @__PURE__ */ jsxDEV("h3", { style: {
        margin: 0,
        fontSize: "1.5rem",
        fontWeight: 900,
        color: "#fff"
      }, children: "AURA SANCTUM" }, void 0, false, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\AuraTab.jsx",
        lineNumber: 81,
        columnNumber: 12
      }),
      /* @__PURE__ */ jsxDEV("p", { style: {
        fontSize: "0.85rem",
        color: "#94a3b8",
        maxWidth: "400px",
        margin: "10px auto"
      }, children: "Channel your accumulated aura into permanent resonance, strengthening every hero in your multiverse." }, void 0, false, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\AuraTab.jsx",
        lineNumber: 86,
        columnNumber: 27
      }),
      /* @__PURE__ */ jsxDEV("div", { style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        background: "rgba(168, 85, 247, 0.2)",
        padding: "6px 20px",
        borderRadius: 20,
        border: "1px solid rgba(168, 85, 247, 0.3)",
        marginTop: 10
      }, children: [
        /* @__PURE__ */ jsxDEV(Zap, { size: 16, color: "#a855f7" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\AuraTab.jsx",
          lineNumber: 100,
          columnNumber: 10
        }),
        /* @__PURE__ */ jsxDEV("span", { style: {
          fontWeight: 900,
          fontSize: "1.1rem"
        }, children: [
          aura,
          " AVAILABLE"
        ] }, void 0, true, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\AuraTab.jsx",
          lineNumber: 100,
          columnNumber: 43
        })
      ] }, void 0, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\AuraTab.jsx",
        lineNumber: 91,
        columnNumber: 114
      }),
      /* @__PURE__ */ jsxDEV("div", { style: {
        marginTop: 12
      }, children: /* @__PURE__ */ jsxDEV("button", { className: "shop-buy-btn", style: {
        padding: "10px 24px",
        background: "linear-gradient(135deg,#a855f7,#7c3aed)",
        color: "#fff",
        fontWeight: 900,
        border: "none"
      }, onClick: upgradeAuraAll, disabled: aura < auraLevelCost(0), children: `\u26A1 MAX ALL \u2014 spend all ${aura.toLocaleString()} aura across every track` }, void 0, false, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\AuraTab.jsx",
        lineNumber: 105,
        columnNumber: 10
      }) }, void 0, false, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\AuraTab.jsx",
        lineNumber: 103,
        columnNumber: 41
      })
    ] }, void 0, true, {
      fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\AuraTab.jsx",
      lineNumber: 73,
      columnNumber: 42
    }),
    /* @__PURE__ */ jsxDEV("div", { style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
      gap: 15
    }, children: ["atk", "def", "hp", "speed", "magic_atk", "magic_def", "luck", "xp", "stamina", "vault", "bond"].map((stat) => {
      const count = auraUpgrades[stat] || 0;
      const cost = 5 + count * 5;
      const statLabels = {
        atk: {
          label: "Physical Force",
          icon: /* @__PURE__ */ jsxDEV(Sword, { size: 20 }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\AuraTab.jsx",
            lineNumber: 121,
            columnNumber: 19
          }),
          color: "#f87171"
        },
        def: {
          label: "Iron Guard",
          icon: /* @__PURE__ */ jsxDEV(Shield, { size: 20 }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\AuraTab.jsx",
            lineNumber: 126,
            columnNumber: 19
          }),
          color: "#60a5fa"
        },
        hp: {
          label: "Vigor Pulse",
          icon: /* @__PURE__ */ jsxDEV(Activity, { size: 20 }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\AuraTab.jsx",
            lineNumber: 131,
            columnNumber: 19
          }),
          color: "#4ade80"
        },
        speed: {
          label: "Flash Step",
          icon: /* @__PURE__ */ jsxDEV(Zap, { size: 20 }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\AuraTab.jsx",
            lineNumber: 136,
            columnNumber: 19
          }),
          color: "#facc15"
        },
        magic_atk: {
          label: "Ether Blast",
          icon: /* @__PURE__ */ jsxDEV(Sparkles, { size: 20 }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\AuraTab.jsx",
            lineNumber: 141,
            columnNumber: 19
          }),
          color: "#a855f7"
        },
        magic_def: {
          label: "Arcane Veil",
          icon: /* @__PURE__ */ jsxDEV(Monitor, { size: 20 }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\AuraTab.jsx",
            lineNumber: 146,
            columnNumber: 19
          }),
          color: "#818cf8"
        },
        luck: {
          label: "Fate Twist",
          icon: /* @__PURE__ */ jsxDEV(Clover, { size: 20 }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\AuraTab.jsx",
            lineNumber: 151,
            columnNumber: 19
          }),
          color: "#34d399"
        },
        xp: {
          label: "Quick Study",
          icon: /* @__PURE__ */ jsxDEV(Book, { size: 20 }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\AuraTab.jsx",
            lineNumber: 156,
            columnNumber: 19
          }),
          color: "#f472b6"
        },
        stamina: {
          label: "Deep Breath",
          icon: /* @__PURE__ */ jsxDEV(Zap, { size: 20 }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\AuraTab.jsx",
            lineNumber: 161,
            columnNumber: 19
          }),
          color: "#34d399"
        },
        vault: {
          label: "Gold Hoard",
          icon: /* @__PURE__ */ jsxDEV(Database, { size: 20 }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\AuraTab.jsx",
            lineNumber: 166,
            columnNumber: 19
          }),
          color: "#fbbf24"
        },
        bond: {
          label: "Soul Link",
          icon: /* @__PURE__ */ jsxDEV(Heart, { size: 20 }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\AuraTab.jsx",
            lineNumber: 171,
            columnNumber: 19
          }),
          color: "#ec4899"
        }
      };
      const cfg = statLabels[stat] || {
        label: stat,
        icon: /* @__PURE__ */ jsxDEV(Sparkles, { size: 20 }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\AuraTab.jsx",
          lineNumber: 177,
          columnNumber: 17
        }),
        color: "#fff"
      };
      return /* @__PURE__ */ jsxDEV("div", { className: "shop-card-v3", style: {
        textAlign: "left",
        padding: 16,
        borderLeft: `4px solid ${cfg.color}`
      }, children: [
        /* @__PURE__ */ jsxDEV("div", { style: {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 12
        }, children: [
          /* @__PURE__ */ jsxDEV("div", { style: {
            color: cfg.color,
            background: `${cfg.color}15`,
            width: 44,
            height: 44,
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }, children: cfg.icon }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\AuraTab.jsx",
            lineNumber: 189,
            columnNumber: 14
          }),
          /* @__PURE__ */ jsxDEV("div", { style: {
            textAlign: "right"
          }, children: [
            /* @__PURE__ */ jsxDEV("div", { style: {
              fontSize: "0.6rem",
              color: "#94a3b8",
              fontWeight: 900
            }, children: "RESONANCE" }, void 0, false, {
              fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\AuraTab.jsx",
              lineNumber: 200,
              columnNumber: 16
            }),
            /* @__PURE__ */ jsxDEV("div", { style: {
              fontSize: "1.2rem",
              fontWeight: 900
            }, children: [
              "LV.",
              count
            ] }, void 0, true, {
              fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\AuraTab.jsx",
              lineNumber: 204,
              columnNumber: 33
            })
          ] }, void 0, true, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\AuraTab.jsx",
            lineNumber: 198,
            columnNumber: 32
          })
        ] }, void 0, true, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\AuraTab.jsx",
          lineNumber: 184,
          columnNumber: 12
        }),
        /* @__PURE__ */ jsxDEV("div", { style: {
          fontWeight: 900,
          fontSize: "1rem",
          color: "#fff",
          marginBottom: 4
        }, children: cfg.label }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\AuraTab.jsx",
          lineNumber: 207,
          columnNumber: 46
        }),
        /* @__PURE__ */ jsxDEV("div", { style: {
          fontSize: "0.75rem",
          color: "#94a3b8",
          marginBottom: 15
        }, children: [
          "Current Bonus: ",
          /* @__PURE__ */ jsxDEV("span", { style: {
            color: "#4ade80",
            fontWeight: 900
          }, children: [
            "+",
            count * 2,
            "%"
          ] }, void 0, true, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\AuraTab.jsx",
            lineNumber: 216,
            columnNumber: 29
          })
        ] }, void 0, true, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\AuraTab.jsx",
          lineNumber: 212,
          columnNumber: 31
        }),
        /* @__PURE__ */ jsxDEV("div", { style: {
          fontSize: "0.65rem",
          color: "#94a3b8",
          marginBottom: 6
        }, children: `Next Lv.: ${cost} Aura` }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\AuraTab.jsx",
          lineNumber: 219,
          columnNumber: 42
        }),
        /* @__PURE__ */ jsxDEV("div", { style: {
          display: "flex",
          gap: 6
        }, children: [1, 5, 10].map((n) => /* @__PURE__ */ jsxDEV("button", { className: "shop-buy-btn", style: {
          flex: 1,
          padding: "8px 4px",
          fontSize: "0.72rem",
          background: aura >= cost ? cfg.color : "rgba(255,255,255,0.05)",
          color: aura >= cost ? "#000" : "rgba(255,255,255,0.2)",
          border: "none"
        }, onClick: () => upgradeAuraBulk(stat, n), disabled: aura < cost, children: `\xD7${n}` }, n, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\AuraTab.jsx",
          lineNumber: 226,
          columnNumber: 35
        })).concat([/* @__PURE__ */ jsxDEV("button", { className: "shop-buy-btn", style: {
          flex: 1.4,
          padding: "8px 4px",
          fontSize: "0.72rem",
          fontWeight: 900,
          background: aura >= cost ? "linear-gradient(135deg,#ffd700,#daa520)" : "rgba(255,255,255,0.05)",
          color: aura >= cost ? "#000" : "rgba(255,255,255,0.2)",
          border: "none"
        }, onClick: () => upgradeAuraBulk(stat, 9999), disabled: aura < cost, children: `MAX (+${affordableAuraLevels(stat, aura).bought})` }, "max", false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\AuraTab.jsx",
          lineNumber: 233,
          columnNumber: 108
        })]) }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\AuraTab.jsx",
          lineNumber: 223,
          columnNumber: 46
        })
      ] }, stat, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\AuraTab.jsx",
        lineNumber: 180,
        columnNumber: 16
      });
    }) }, void 0, false, {
      fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\AuraTab.jsx",
      lineNumber: 111,
      columnNumber: 167
    })
  ] }, void 0, true, {
    fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\AuraTab.jsx",
    lineNumber: 73,
    columnNumber: 10
  });
};
export {
  AuraTab
};
