import { Fragment, jsxDEV } from "react/jsx-dev-runtime";
import React from "react";
import { Heart, Sword, Shield, Zap, Sparkles, LayoutGrid, Package, Book, Star, Gem, Monitor, Database, Info, X, Hammer, Activity, Clover, Crown } from "lucide-react";
import { playSound } from "../../utils.js";
import { isMobile } from "../ViewShared.js";
const FacilityTab = (props) => {
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
    !isFeatureUnlocked("missions") && /* @__PURE__ */ jsxDEV("div", { className: "shop-item", children: [
      /* @__PURE__ */ jsxDEV("div", { children: [
        /* @__PURE__ */ jsxDEV("div", { style: {
          fontWeight: 900
        }, children: "Missions Board" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\FacilityTab.jsx",
          lineNumber: 68,
          columnNumber: 109
        }),
        /* @__PURE__ */ jsxDEV("div", { style: {
          fontSize: "0.7rem",
          opacity: 0.6
        }, children: "Daily resource collection" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\FacilityTab.jsx",
          lineNumber: 70,
          columnNumber: 32
        })
      ] }, void 0, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\FacilityTab.jsx",
        lineNumber: 68,
        columnNumber: 104
      }),
      /* @__PURE__ */ jsxDEV("button", { className: "train-btn", style: {
        width: "auto",
        padding: "8px 20px"
      }, onClick: () => unlockFeature("missions", 10, "gems"), children: "10 GEMS" }, void 0, false, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\FacilityTab.jsx",
        lineNumber: 73,
        columnNumber: 49
      })
    ] }, void 0, true, {
      fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\FacilityTab.jsx",
      lineNumber: 68,
      columnNumber: 77
    }),
    !isFeatureUnlocked("auto_train_plus") && /* @__PURE__ */ jsxDEV("div", { className: "shop-item", children: [
      /* @__PURE__ */ jsxDEV("div", { children: [
        /* @__PURE__ */ jsxDEV("div", { style: {
          fontWeight: 900
        }, children: "Auto-Train Pro" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\FacilityTab.jsx",
          lineNumber: 76,
          columnNumber: 161
        }),
        /* @__PURE__ */ jsxDEV("div", { style: {
          fontSize: "0.7rem",
          opacity: 0.6
        }, children: "Enhanced automated routine" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\FacilityTab.jsx",
          lineNumber: 78,
          columnNumber: 32
        })
      ] }, void 0, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\FacilityTab.jsx",
        lineNumber: 76,
        columnNumber: 156
      }),
      /* @__PURE__ */ jsxDEV("button", { className: "train-btn", style: {
        width: "auto",
        padding: "8px 20px"
      }, onClick: () => unlockFeature("auto_train_plus", 25, "gems"), children: "25 GEMS" }, void 0, false, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\FacilityTab.jsx",
        lineNumber: 81,
        columnNumber: 50
      })
    ] }, void 0, true, {
      fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\FacilityTab.jsx",
      lineNumber: 76,
      columnNumber: 129
    }),
    /* @__PURE__ */ jsxDEV("div", { className: "shop-item", children: (() => {
      const lv = auraUpgrades.stamina || 0;
      const limit = 100;
      const isMax = lv >= limit;
      const gemCost = Math.floor(100 * Math.pow(1.25, lv));
      const materialsCost = Math.floor(1e3 * Math.pow(1.2, lv));
      return /* @__PURE__ */ jsxDEV(Fragment, { children: [
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("div", { style: {
            fontWeight: 900
          }, children: "Stamina Capacitor" }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\FacilityTab.jsx",
            lineNumber: 90,
            columnNumber: 23
          }),
          /* @__PURE__ */ jsxDEV("div", { style: {
            fontSize: "0.7rem",
            opacity: 0.6
          }, children: "Permanently increases your maximum Stamina by +10." }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\FacilityTab.jsx",
            lineNumber: 92,
            columnNumber: 39
          }),
          /* @__PURE__ */ jsxDEV("div", { style: {
            fontSize: "0.6rem",
            color: "#facc15"
          }, children: [
            "Req: ",
            gemCost,
            " Gems + ",
            materialsCost,
            " Materials"
          ] }, void 0, true, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\FacilityTab.jsx",
            lineNumber: 95,
            columnNumber: 72
          }),
          /* @__PURE__ */ jsxDEV("div", { className: `limit-tag ${isMax ? "maxed" : ""}`, children: [
            "LIMIT ",
            lv,
            "/",
            limit
          ] }, void 0, true, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\FacilityTab.jsx",
            lineNumber: 98,
            columnNumber: 69
          })
        ] }, void 0, true, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\FacilityTab.jsx",
          lineNumber: 90,
          columnNumber: 18
        }),
        /* @__PURE__ */ jsxDEV("button", { className: "train-btn", style: {
          width: "auto",
          padding: "8px 20px",
          background: isMax ? "#334155" : "linear-gradient(135deg,#f59e0b,#facc15)"
        }, disabled: isMax, onClick: () => {
          if (gems < gemCost || materials < materialsCost) {
            createFloatingText("Need more materials", true);
            return;
          }
          setGems((g) => g - gemCost);
          setMaterials((s) => s - materialsCost);
          setAuraUpgrades((p) => ({
            ...p,
            stamina: (p.stamina || 0) + 1
          }));
          createFloatingText(`MAX STAMINA +10`, false, "#4ade80");
          playSound("levelUp");
        }, children: isMax ? "MAXED" : "UPGRADE" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\FacilityTab.jsx",
          lineNumber: 98,
          columnNumber: 152
        })
      ] }, void 0, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\FacilityTab.jsx",
        lineNumber: 90,
        columnNumber: 16
      });
    })() }, void 0, false, {
      fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\FacilityTab.jsx",
      lineNumber: 84,
      columnNumber: 94
    }),
    /* @__PURE__ */ jsxDEV("div", { className: "shop-item", children: (() => {
      const lv = auraUpgrades.auraPassive || 0;
      const limit = 25;
      const isMax = lv >= limit;
      const gemCost = Math.floor(250 * Math.pow(1.4, lv));
      return /* @__PURE__ */ jsxDEV(Fragment, { children: [
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("div", { style: {
            fontWeight: 900
          }, children: "Aura Well" }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\FacilityTab.jsx",
            lineNumber: 121,
            columnNumber: 23
          }),
          /* @__PURE__ */ jsxDEV("div", { style: {
            fontSize: "0.7rem",
            opacity: 0.6
          }, children: "Permanently increases passive aura gain and grants an immediate aura infusion on purchase." }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\FacilityTab.jsx",
            lineNumber: 123,
            columnNumber: 31
          }),
          /* @__PURE__ */ jsxDEV("div", { style: {
            fontSize: "0.6rem",
            color: "#00d2ff"
          }, children: [
            "Req: ",
            gemCost,
            " Gems"
          ] }, void 0, true, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\FacilityTab.jsx",
            lineNumber: 126,
            columnNumber: 112
          }),
          /* @__PURE__ */ jsxDEV("div", { className: `limit-tag ${isMax ? "maxed" : ""}`, children: [
            "LIMIT ",
            lv,
            "/",
            limit
          ] }, void 0, true, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\FacilityTab.jsx",
            lineNumber: 129,
            columnNumber: 41
          })
        ] }, void 0, true, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\FacilityTab.jsx",
          lineNumber: 121,
          columnNumber: 18
        }),
        /* @__PURE__ */ jsxDEV("button", { className: "train-btn", style: {
          width: "auto",
          padding: "8px 20px",
          background: isMax ? "#334155" : "linear-gradient(135deg,#a855f7,#7c3aed)"
        }, disabled: isMax, onClick: () => {
          if (gems < gemCost) {
            createFloatingText(`Need ${gemCost} Gems`, true);
            return;
          }
          setGems((g) => g - gemCost);
          setAuraUpgrades((p) => ({
            ...p,
            auraPassive: (p.auraPassive || 0) + 1
          }));
          setAura((a) => a + 25);
          createFloatingText(`AURA WELL INSTALLED: +25 Aura & passive gain up`, false, "#a855f7");
          playSound("levelUp");
        }, children: isMax ? "MAXED" : "UPGRADE" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\FacilityTab.jsx",
          lineNumber: 129,
          columnNumber: 124
        })
      ] }, void 0, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\FacilityTab.jsx",
        lineNumber: 121,
        columnNumber: 16
      });
    })() }, void 0, false, {
      fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\FacilityTab.jsx",
      lineNumber: 116,
      columnNumber: 18
    }),
    /* @__PURE__ */ jsxDEV("div", { className: "shop-item", children: (() => {
      const lv = auraUpgrades.xp || 0;
      const limit = 50;
      const isMax = lv >= limit;
      const gemCost = Math.floor(150 * Math.pow(1.3, lv));
      return /* @__PURE__ */ jsxDEV(Fragment, { children: [
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("div", { style: {
            fontWeight: 900
          }, children: "Training Manual" }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\FacilityTab.jsx",
            lineNumber: 152,
            columnNumber: 23
          }),
          /* @__PURE__ */ jsxDEV("div", { style: {
            fontSize: "0.7rem",
            opacity: 0.6
          }, children: "Increase XP per TRAIN by +15% per purchase (stacks)." }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\FacilityTab.jsx",
            lineNumber: 154,
            columnNumber: 37
          }),
          /* @__PURE__ */ jsxDEV("div", { style: {
            fontSize: "0.6rem",
            color: "#facc15"
          }, children: [
            "Req: ",
            gemCost,
            " Gems"
          ] }, void 0, true, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\FacilityTab.jsx",
            lineNumber: 157,
            columnNumber: 74
          }),
          /* @__PURE__ */ jsxDEV("div", { className: `limit-tag ${isMax ? "maxed" : ""}`, children: [
            "LIMIT ",
            lv,
            "/",
            limit
          ] }, void 0, true, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\FacilityTab.jsx",
            lineNumber: 160,
            columnNumber: 41
          })
        ] }, void 0, true, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\FacilityTab.jsx",
          lineNumber: 152,
          columnNumber: 18
        }),
        /* @__PURE__ */ jsxDEV("button", { className: "train-btn", style: {
          width: "auto",
          padding: "8px 20px",
          background: isMax ? "#334155" : "linear-gradient(135deg,#6366f1,#8b5cf6)"
        }, disabled: isMax, onClick: () => {
          if (gems < gemCost) {
            createFloatingText(`Need ${gemCost} Gems`, true);
            return;
          }
          setGems((g) => g - gemCost);
          setAuraUpgrades((p) => ({
            ...p,
            xp: (p.xp || 0) + 1
          }));
          createFloatingText(`TRAINING XP +15% (stack)`, false, "#a855f7");
          playSound("levelUp");
        }, children: isMax ? "MAXED" : "UPGRADE" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\FacilityTab.jsx",
          lineNumber: 160,
          columnNumber: 124
        })
      ] }, void 0, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\FacilityTab.jsx",
        lineNumber: 152,
        columnNumber: 16
      });
    })() }, void 0, false, {
      fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\FacilityTab.jsx",
      lineNumber: 147,
      columnNumber: 18
    }),
    /* @__PURE__ */ jsxDEV("div", { className: "shop-item", children: (() => {
      const lv = auraUpgrades.vault || 0;
      const limit = 50;
      const isMax = lv >= limit;
      const auraCost = Math.floor(25 * Math.pow(1.2, lv));
      return /* @__PURE__ */ jsxDEV(Fragment, { children: [
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("div", { style: {
            fontWeight: 900
          }, children: "Vault Expansion" }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\FacilityTab.jsx",
            lineNumber: 182,
            columnNumber: 23
          }),
          /* @__PURE__ */ jsxDEV("div", { style: {
            fontSize: "0.7rem",
            opacity: 0.6
          }, children: "Increase idle credit capacity" }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\FacilityTab.jsx",
            lineNumber: 184,
            columnNumber: 37
          }),
          /* @__PURE__ */ jsxDEV("div", { style: {
            fontSize: "0.6rem",
            color: "#a855f7"
          }, children: [
            "Req: ",
            auraCost,
            " Aura"
          ] }, void 0, true, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\FacilityTab.jsx",
            lineNumber: 187,
            columnNumber: 51
          }),
          /* @__PURE__ */ jsxDEV("div", { className: `limit-tag ${isMax ? "maxed" : ""}`, children: [
            "LIMIT ",
            lv,
            "/",
            limit
          ] }, void 0, true, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\FacilityTab.jsx",
            lineNumber: 190,
            columnNumber: 42
          })
        ] }, void 0, true, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\FacilityTab.jsx",
          lineNumber: 182,
          columnNumber: 18
        }),
        /* @__PURE__ */ jsxDEV("button", { className: "train-btn", style: {
          width: "auto",
          padding: "8px 20px",
          background: isMax ? "#334155" : "var(--sp-color)"
        }, disabled: isMax, onClick: () => {
          if (aura >= auraCost) {
            setAura((a) => a - auraCost);
            setAuraUpgrades((p) => ({
              ...p,
              vault: (p.vault || 0) + 1
            }));
            createFloatingText("VAULT EXPANDED!", false, "#a855f7");
            playSound("upgrade");
          } else createFloatingText(`Need ${auraCost} Aura`, true);
        }, children: isMax ? "MAXED" : "UPGRADE" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\FacilityTab.jsx",
          lineNumber: 190,
          columnNumber: 125
        })
      ] }, void 0, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\FacilityTab.jsx",
        lineNumber: 182,
        columnNumber: 16
      });
    })() }, void 0, false, {
      fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\FacilityTab.jsx",
      lineNumber: 177,
      columnNumber: 18
    }),
    /* @__PURE__ */ jsxDEV("div", { className: "shop-item", style: {
      border: "2px solid #ef4444",
      background: "rgba(239, 68, 68, 0.05)"
    }, children: (() => {
      const lv = auraUpgrades.supernova || 0;
      const limit = 5;
      const isMax = lv >= limit;
      const gemCost = Math.floor(25e3 * Math.pow(3, lv));
      const auraCost = Math.floor(1e4 * Math.pow(2.5, lv));
      return /* @__PURE__ */ jsxDEV(Fragment, { children: [
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("div", { style: {
            fontWeight: 900,
            color: "#ef4444"
          }, children: "Supernova Reactor" }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\FacilityTab.jsx",
            lineNumber: 214,
            columnNumber: 23
          }),
          /* @__PURE__ */ jsxDEV("div", { style: {
            fontSize: "0.7rem",
            opacity: 0.6
          }, children: "Drastically raises max stamina by +500 and doubles regeneration." }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\FacilityTab.jsx",
            lineNumber: 217,
            columnNumber: 39
          }),
          /* @__PURE__ */ jsxDEV("div", { style: {
            fontSize: "0.6rem",
            color: "#facc15"
          }, children: [
            "Req: ",
            gemCost.toLocaleString(),
            " Gems + ",
            auraCost.toLocaleString(),
            " Aura"
          ] }, void 0, true, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\FacilityTab.jsx",
            lineNumber: 220,
            columnNumber: 86
          }),
          /* @__PURE__ */ jsxDEV("div", { className: `limit-tag ${isMax ? "maxed" : ""}`, children: [
            "LIMIT ",
            lv,
            "/",
            limit
          ] }, void 0, true, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\FacilityTab.jsx",
            lineNumber: 223,
            columnNumber: 93
          })
        ] }, void 0, true, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\FacilityTab.jsx",
          lineNumber: 214,
          columnNumber: 18
        }),
        /* @__PURE__ */ jsxDEV("button", { className: "train-btn", style: {
          width: "auto",
          padding: "8px 20px",
          background: isMax ? "#334155" : "linear-gradient(135deg,#ef4444,#b91c1c)"
        }, disabled: isMax, onClick: () => {
          if (gems < gemCost || aura < auraCost) {
            createFloatingText("Materials Insufficient", true);
            return;
          }
          setGems((g) => g - gemCost);
          setAura((a) => a - auraCost);
          setAuraUpgrades((p) => ({
            ...p,
            stamina: (p.stamina || 0) + 50,
            supernova: (p.supernova || 0) + 1
          }));
          createFloatingText(`MAX STAMINA +500`, false, "#ef4444");
          playSound("explosion");
        }, children: isMax ? "MAXED" : "IGNITE" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\FacilityTab.jsx",
          lineNumber: 223,
          columnNumber: 176
        })
      ] }, void 0, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\FacilityTab.jsx",
        lineNumber: 214,
        columnNumber: 16
      });
    })() }, void 0, false, {
      fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\FacilityTab.jsx",
      lineNumber: 205,
      columnNumber: 18
    }),
    /* @__PURE__ */ jsxDEV("div", { className: "shop-item", style: {
      border: "2px solid #00d2ff",
      background: "rgba(0, 210, 255, 0.05)"
    }, children: (() => {
      const lv = auraUpgrades.geode_drill || 0;
      const limit = 10;
      const isMax = lv >= limit;
      const gemCost = Math.floor(15e3 * Math.pow(2, lv));
      const materialsCost = Math.floor(5e4 * Math.pow(1.8, lv));
      return /* @__PURE__ */ jsxDEV(Fragment, { children: [
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("div", { style: {
            fontWeight: 900,
            color: "#00d2ff"
          }, children: "Dimensional Drill" }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\FacilityTab.jsx",
            lineNumber: 251,
            columnNumber: 23
          }),
          /* @__PURE__ */ jsxDEV("div", { style: {
            fontSize: "0.7rem",
            opacity: 0.6
          }, children: "Permanently triples the speed of the Gem Geode generator." }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\FacilityTab.jsx",
            lineNumber: 254,
            columnNumber: 39
          }),
          /* @__PURE__ */ jsxDEV("div", { style: {
            fontSize: "0.6rem",
            color: "#facc15"
          }, children: [
            "Req: ",
            gemCost.toLocaleString(),
            " Gems + ",
            materialsCost.toLocaleString(),
            " Materials"
          ] }, void 0, true, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\FacilityTab.jsx",
            lineNumber: 257,
            columnNumber: 79
          }),
          /* @__PURE__ */ jsxDEV("div", { className: `limit-tag ${isMax ? "maxed" : ""}`, children: [
            "LIMIT ",
            lv,
            "/",
            limit
          ] }, void 0, true, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\FacilityTab.jsx",
            lineNumber: 260,
            columnNumber: 103
          })
        ] }, void 0, true, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\FacilityTab.jsx",
          lineNumber: 251,
          columnNumber: 18
        }),
        /* @__PURE__ */ jsxDEV("button", { className: "train-btn", style: {
          width: "auto",
          padding: "8px 20px",
          background: isMax ? "#334155" : "linear-gradient(135deg,#00d2ff,#3b82f6)"
        }, disabled: isMax, onClick: () => {
          if (gems < gemCost || materials < materialsCost) {
            createFloatingText("Materials Insufficient", true);
            return;
          }
          setGems((g) => g - gemCost);
          setMaterials((s) => s - materialsCost);
          setAuraUpgrades((p) => ({
            ...p,
            geode_drill: (p.geode_drill || 0) + 1
          }));
          createFloatingText(`DRILL ACTIVE: GEODE SPEED UP`, false, "#00d2ff");
          playSound("craft");
        }, children: isMax ? "MAXED" : "UPGRADE" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\FacilityTab.jsx",
          lineNumber: 260,
          columnNumber: 186
        })
      ] }, void 0, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\FacilityTab.jsx",
        lineNumber: 251,
        columnNumber: 16
      });
    })() }, void 0, false, {
      fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\FacilityTab.jsx",
      lineNumber: 242,
      columnNumber: 18
    }),
    /* @__PURE__ */ jsxDEV("div", { className: "shop-item", style: {
      border: "3px solid #facc15",
      background: "linear-gradient(135deg, rgba(250, 204, 21, 0.1), transparent)",
      boxShadow: "0 0 20px rgba(250, 204, 21, 0.2)"
    }, children: (() => {
      const lv = auraUpgrades.singularity || 0;
      const limit = 10;
      const isMax = lv >= limit;
      const creditCost = Math.floor(3e10 * Math.pow(1.5, lv));
      const gemCost = Math.floor(1e4 * Math.pow(1.5, lv));
      return /* @__PURE__ */ jsxDEV(Fragment, { children: [
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("div", { style: {
            fontWeight: 900,
            color: "#facc15",
            fontSize: "1.1rem"
          }, children: "Omniversal Singularity Link" }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\FacilityTab.jsx",
            lineNumber: 288,
            columnNumber: 23
          }),
          /* @__PURE__ */ jsxDEV("div", { style: {
            fontSize: "0.75rem",
            opacity: 0.8,
            color: "#fff",
            maxWidth: "350px"
          }, children: "Permanently grants +100% to ALL HERO STATS and doubles resource gain. The ultimate mark of a Master Trainer." }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\FacilityTab.jsx",
            lineNumber: 292,
            columnNumber: 49
          }),
          /* @__PURE__ */ jsxDEV("div", { style: {
            fontSize: "0.65rem",
            color: "#f472b6",
            marginTop: 4,
            fontWeight: 900
          }, children: [
            "Requirement: $",
            creditCost.toLocaleString(),
            " + ",
            gemCost.toLocaleString(),
            " Gems"
          ] }, void 0, true, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\FacilityTab.jsx",
            lineNumber: 297,
            columnNumber: 130
          }),
          /* @__PURE__ */ jsxDEV("div", { className: `limit-tag ${isMax ? "maxed" : ""}`, children: [
            "LIMIT ",
            lv,
            "/",
            limit
          ] }, void 0, true, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\FacilityTab.jsx",
            lineNumber: 302,
            columnNumber: 99
          })
        ] }, void 0, true, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\FacilityTab.jsx",
          lineNumber: 288,
          columnNumber: 18
        }),
        /* @__PURE__ */ jsxDEV("button", { className: "train-btn", style: {
          width: "auto",
          padding: "12px 24px",
          background: isMax ? "#334155" : "linear-gradient(180deg, #facc15, #ca8a04)",
          color: isMax ? "#fff" : "#000"
        }, disabled: isMax, onClick: () => {
          if (credits < creditCost || gems < gemCost) {
            createFloatingText(`Incomplete Sync: Need resources`, true);
            return;
          }
          setCredits((c) => c - creditCost);
          setGems((g) => g - gemCost);
          setAuraUpgrades((p) => ({
            ...p,
            singularity: (p.singularity || 0) + 1
          }));
          createFloatingText(`!!! OMNIVERSAL LINK ESTABLISHED !!!`, false, "#facc15");
          playSound("gacha_legendary");
          safeTriggerVisualEffect("fx_ultimate_blast.png", "50%", "50%", 3);
        }, children: isMax ? "MAXED" : "ASCEND" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\FacilityTab.jsx",
          lineNumber: 302,
          columnNumber: 182
        })
      ] }, void 0, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\FacilityTab.jsx",
        lineNumber: 288,
        columnNumber: 16
      });
    })() }, void 0, false, {
      fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\FacilityTab.jsx",
      lineNumber: 278,
      columnNumber: 18
    }),
    /* @__PURE__ */ jsxDEV("div", { className: "shop-item", style: {
      border: "3px solid #a855f7",
      background: "rgba(168, 85, 247, 0.05)"
    }, children: (() => {
      const lv = auraUpgrades.transmutation || 0;
      const gemCost = Math.floor(5e4 * Math.pow(1.25, lv));
      return /* @__PURE__ */ jsxDEV(Fragment, { children: [
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("div", { style: {
            fontWeight: 900,
            color: "#a855f7",
            fontSize: "1.1rem"
          }, children: "Aura Transmutation Core" }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\FacilityTab.jsx",
            lineNumber: 328,
            columnNumber: 23
          }),
          /* @__PURE__ */ jsxDEV("div", { style: {
            fontSize: "0.75rem",
            opacity: 0.8,
            color: "#fff",
            maxWidth: "350px"
          }, children: "Instantly grants +1,000,000 Materials and +25,000 Essence. A massive jump in crafting capability." }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\FacilityTab.jsx",
            lineNumber: 332,
            columnNumber: 45
          }),
          /* @__PURE__ */ jsxDEV("div", { style: {
            fontSize: "0.65rem",
            color: "#00d2ff",
            marginTop: 4,
            fontWeight: 900
          }, children: [
            "Requirement: ",
            gemCost.toLocaleString(),
            " Gems"
          ] }, void 0, true, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\FacilityTab.jsx",
            lineNumber: 337,
            columnNumber: 119
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "limit-tag", children: [
            "PURCHASED: ",
            lv
          ] }, void 0, true, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\FacilityTab.jsx",
            lineNumber: 342,
            columnNumber: 66
          })
        ] }, void 0, true, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\FacilityTab.jsx",
          lineNumber: 328,
          columnNumber: 18
        }),
        /* @__PURE__ */ jsxDEV("button", { className: "train-btn", style: {
          width: "auto",
          padding: "12px 24px",
          background: "linear-gradient(180deg, #a855f7, #7c3aed)",
          color: "#fff"
        }, onClick: () => {
          if (gems < gemCost) {
            createFloatingText(`Need ${gemCost.toLocaleString()} Gems`, true);
            return;
          }
          setGems((g) => g - gemCost);
          setAuraUpgrades((p) => ({
            ...p,
            transmutation: (p.transmutation || 0) + 1
          }));
          const curS = parseInt(localStorage.getItem("mugen_materials") || "0", 10);
          const curE = parseInt(localStorage.getItem("mugen_essence") || "0", 10);
          setMaterials(curS + 1e6);
          setEssence(curE + 25e3);
          localStorage.setItem("mugen_materials", String(curS + 1e6));
          localStorage.setItem("mugen_essence", String(curE + 25e3));
          window.dispatchEvent(new CustomEvent("mugen_materials_changed", {
            detail: {
              materials: curS + 1e6,
              essence: curE + 25e3
            }
          }));
          createFloatingText(`MASSIVE RESOURCE INFUSION!`, false, "#a855f7");
          playSound("gacha_epic");
        }, children: "PURCHASE" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\FacilityTab.jsx",
          lineNumber: 342,
          columnNumber: 120
        })
      ] }, void 0, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\FacilityTab.jsx",
        lineNumber: 328,
        columnNumber: 16
      });
    })() }, void 0, false, {
      fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\FacilityTab.jsx",
      lineNumber: 322,
      columnNumber: 18
    }),
    /* @__PURE__ */ jsxDEV("div", { className: "glass-panel", style: {
      textAlign: "center",
      opacity: 0.5,
      padding: 20,
      marginTop: 15
    }, children: [
      /* @__PURE__ */ jsxDEV(Info, { size: 24, style: {
        marginBottom: 10
      } }, void 0, false, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\FacilityTab.jsx",
        lineNumber: 377,
        columnNumber: 8
      }),
      /* @__PURE__ */ jsxDEV("div", { style: {
        fontSize: "0.8rem"
      }, children: "Higher facility ranks unlock automatically based on total Power Level." }, void 0, false, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\FacilityTab.jsx",
        lineNumber: 379,
        columnNumber: 12
      })
    ] }, void 0, true, {
      fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\FacilityTab.jsx",
      lineNumber: 372,
      columnNumber: 18
    })
  ] }, void 0, true, {
    fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\FacilityTab.jsx",
    lineNumber: 68,
    columnNumber: 10
  });
};
export {
  FacilityTab
};
