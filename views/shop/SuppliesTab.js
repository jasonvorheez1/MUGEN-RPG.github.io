import { jsxDEV } from "react/jsx-dev-runtime";
import React from "react";
import { Heart, Sword, Shield, Zap, Sparkles, LayoutGrid, Package, Book, Star, Gem, Monitor, Database, Info, X, Hammer, Activity, Clover, Crown } from "lucide-react";
import { playSound } from "../../utils.js";
import { isMobile } from "../ViewShared.js";
const SuppliesTab = (props) => {
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
    /* @__PURE__ */ jsxDEV("div", { style: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr",
      gap: 20,
      marginBottom: 30
    }, children: [
      /* @__PURE__ */ jsxDEV("div", { className: "shop-featured-banner hot-deal-glow", style: {
        background: "linear-gradient(135deg, #1e1b4b, #312e81)",
        borderColor: "#6366f1",
        height: "100%",
        marginBottom: 0,
        flexDirection: "row"
      }, children: [
        /* @__PURE__ */ jsxDEV("div", { className: "featured-content", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "featured-tag", style: {
            background: "#6366f1",
            color: "#fff"
          }, children: "GRAND ARCHITECT'S FORGE" }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\SuppliesTab.jsx",
            lineNumber: 84,
            columnNumber: 44
          }),
          /* @__PURE__ */ jsxDEV("h3", { className: "featured-title", children: "Aetheric Resonance" }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\SuppliesTab.jsx",
            lineNumber: 87,
            columnNumber: 43
          }),
          /* @__PURE__ */ jsxDEV("p", { className: "featured-desc", children: "Master-tier transmutation. Use mass materials to directly force account growth." }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\SuppliesTab.jsx",
            lineNumber: 87,
            columnNumber: 97
          }),
          /* @__PURE__ */ jsxDEV("div", { style: {
            display: "flex",
            gap: 10
          }, children: /* @__PURE__ */ jsxDEV("button", { className: "featured-buy-btn", style: {
            background: "#4ade80"
          }, onClick: () => {
            const cost = 25e3;
            if (credits >= cost && materials >= 5e3) {
              setCredits((c) => c - cost);
              setMaterials((s) => s - 5e3);
              setAura((a) => a + 15);
              createFloatingText("FORGED: +15 AURA", false, "#a855f7");
              playSound("craft");
              safeTriggerVisualEffect("fx_powerup.png", "50%", "50%", 1.5);
            } else createFloatingText("Need $25k + 5k Materials", true);
          }, children: "FORGE AURA ($25k + 5k Materials)" }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\SuppliesTab.jsx",
            lineNumber: 90,
            columnNumber: 14
          }) }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\SuppliesTab.jsx",
            lineNumber: 87,
            columnNumber: 209
          })
        ] }, void 0, true, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\SuppliesTab.jsx",
          lineNumber: 84,
          columnNumber: 10
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "featured-visual", children: /* @__PURE__ */ jsxDEV(Hammer, { size: 80, color: "#6366f1", className: "animate-pulse" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\SuppliesTab.jsx",
          lineNumber: 102,
          columnNumber: 102
        }) }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\SuppliesTab.jsx",
          lineNumber: 102,
          columnNumber: 69
        })
      ] }, void 0, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\SuppliesTab.jsx",
        lineNumber: 78,
        columnNumber: 8
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "shop-featured-banner", style: {
        background: "linear-gradient(135deg, #0f172a, #1e293b)",
        borderColor: "#00d2ff",
        marginBottom: 0,
        flexDirection: "column",
        textAlign: "center",
        justifyContent: "center"
      }, children: [
        /* @__PURE__ */ jsxDEV("div", { className: "featured-tag", style: {
          background: "#00d2ff",
          color: "#000",
          marginBottom: 15
        }, children: "DAILY RESOURCE" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\SuppliesTab.jsx",
          lineNumber: 109,
          columnNumber: 10
        }),
        /* @__PURE__ */ jsxDEV("div", { style: {
          marginBottom: 15
        }, children: [
          /* @__PURE__ */ jsxDEV(Gem, { size: 32, color: "#00d2ff", style: {
            marginBottom: 5
          } }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\SuppliesTab.jsx",
            lineNumber: 115,
            columnNumber: 12
          }),
          /* @__PURE__ */ jsxDEV("div", { style: {
            fontWeight: 900,
            fontSize: "1.2rem",
            color: "#fff"
          }, children: "GEM HARVEST" }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\SuppliesTab.jsx",
            lineNumber: 117,
            columnNumber: 16
          })
        ] }, void 0, true, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\SuppliesTab.jsx",
          lineNumber: 113,
          columnNumber: 32
        }),
        /* @__PURE__ */ jsxDEV("button", { className: "featured-buy-btn", style: {
          background: "#00d2ff",
          width: "100%"
        }, onClick: () => {
          const costMaterials = 5e4;
          const costEssence = 1e3;
          if (materials >= costMaterials && essence >= costEssence) {
            setMaterials((s) => s - costMaterials);
            setEssence((e) => e - costEssence);
            setGems((g) => g + 100);
            createFloatingText("EXTRACTED: 100 GEMS", false, "#00d2ff");
            playSound("jackpot");
            safeTriggerVisualEffect("fx_magic_circle.png", "50%", "50%", 2);
          } else createFloatingText("Need 50k Materials + 1k Essence", true);
        }, children: "EXCHANGE (50k S + 1k E)" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\SuppliesTab.jsx",
          lineNumber: 121,
          columnNumber: 37
        })
      ] }, void 0, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\SuppliesTab.jsx",
        lineNumber: 102,
        columnNumber: 176
      })
    ] }, void 0, true, {
      fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\SuppliesTab.jsx",
      lineNumber: 73,
      columnNumber: 42
    }),
    /* @__PURE__ */ jsxDEV("div", { style: {
      display: "flex",
      flexDirection: "column",
      gap: 30
    }, children: ["consumable", "material"].map((category) => {
      const catItems = Object.entries(items || {}).filter(([_, item]) => item.type === category && item.rarity !== "epic" && item.rarity !== "legendary");
      if (catItems.length === 0) return null;
      return /* @__PURE__ */ jsxDEV("div", { className: "animate-fadeIn", children: [
        /* @__PURE__ */ jsxDEV("div", { style: {
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 15,
          borderLeft: "3px solid var(--primary)",
          paddingLeft: 12
        }, children: [
          /* @__PURE__ */ jsxDEV("h3", { style: {
            margin: 0,
            textTransform: "uppercase",
            letterSpacing: 2,
            fontSize: "1rem"
          }, children: category === "consumable" ? "Battle & Growth" : "Raw Materials" }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\SuppliesTab.jsx",
            lineNumber: 149,
            columnNumber: 14
          }),
          /* @__PURE__ */ jsxDEV("div", { style: {
            flex: 1,
            height: 1,
            background: "linear-gradient(90deg, rgba(217, 70, 239, 0.2), transparent)"
          } }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\SuppliesTab.jsx",
            lineNumber: 154,
            columnNumber: 86
          })
        ] }, void 0, true, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\SuppliesTab.jsx",
          lineNumber: 142,
          columnNumber: 63
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "shop-grid v3", children: catItems.map(([id, item], idx) => {
          const imageSrc = item.imageUrl || "fx_star_pop.png";
          const sell = item.sellPrice || Math.floor((item.basePrice || 1e3) * 0.45);
          const desc = item.detailedDesc || item.desc;
          const rarityColor = item.rarity === "rare" ? "#3b82f6" : item.rarity === "epic" ? "#a855f7" : item.rarity === "legendary" ? "#facc15" : "var(--primary)";
          return /* @__PURE__ */ jsxDEV("div", { className: "shop-card-v3 animate-shop-entry", style: {
            animationDelay: `${idx * 0.05}s`
          }, children: [
            /* @__PURE__ */ jsxDEV("div", { className: "shop-rarity-stripe", style: {
              background: rarityColor
            } }, void 0, false, {
              fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\SuppliesTab.jsx",
              lineNumber: 165,
              columnNumber: 18
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "shop-card-header-v3", children: /* @__PURE__ */ jsxDEV("img", { src: imageSrc, alt: item.name }, void 0, false, {
              fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\SuppliesTab.jsx",
              lineNumber: 167,
              columnNumber: 59
            }) }, void 0, false, {
              fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\SuppliesTab.jsx",
              lineNumber: 167,
              columnNumber: 22
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "shop-card-body-v3", children: [
              /* @__PURE__ */ jsxDEV("div", { style: {
                display: "flex",
                alignItems: "center",
                marginBottom: 2
              }, children: [
                /* @__PURE__ */ jsxDEV("div", { className: "rarity-dot", style: {
                  background: rarityColor
                } }, void 0, false, {
                  fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\SuppliesTab.jsx",
                  lineNumber: 171,
                  columnNumber: 22
                }),
                /* @__PURE__ */ jsxDEV("span", { style: {
                  fontSize: "0.6rem",
                  fontWeight: 900,
                  textTransform: "uppercase",
                  color: rarityColor
                }, children: item.rarity }, void 0, false, {
                  fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\SuppliesTab.jsx",
                  lineNumber: 173,
                  columnNumber: 26
                })
              ] }, void 0, true, {
                fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\SuppliesTab.jsx",
                lineNumber: 167,
                columnNumber: 138
              }),
              /* @__PURE__ */ jsxDEV("h4", { className: "shop-card-title-v3", children: item.name }, void 0, false, {
                fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\SuppliesTab.jsx",
                lineNumber: 178,
                columnNumber: 50
              }),
              /* @__PURE__ */ jsxDEV("p", { className: "shop-card-desc-v3", title: desc, children: desc }, void 0, false, {
                fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\SuppliesTab.jsx",
                lineNumber: 178,
                columnNumber: 101
              }),
              /* @__PURE__ */ jsxDEV("div", { style: {
                marginTop: "auto",
                borderTop: "1px solid rgba(255,255,255,0.05)",
                paddingTop: 12
              }, children: [
                /* @__PURE__ */ jsxDEV("div", { style: {
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 10
                }, children: [
                  /* @__PURE__ */ jsxDEV("div", { style: {
                    fontSize: "1rem",
                    fontWeight: 900,
                    color: "#facc15"
                  }, children: [
                    "$",
                    (item.basePrice || 0).toLocaleString()
                  ] }, void 0, true, {
                    fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\SuppliesTab.jsx",
                    lineNumber: 187,
                    columnNumber: 24
                  }),
                  /* @__PURE__ */ jsxDEV("div", { style: {
                    fontSize: "0.6rem",
                    color: "var(--text-muted)",
                    fontWeight: 700
                  }, children: [
                    "Valuation: $",
                    sell.toLocaleString()
                  ] }, void 0, true, {
                    fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\SuppliesTab.jsx",
                    lineNumber: 191,
                    columnNumber: 73
                  })
                ] }, void 0, true, {
                  fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\SuppliesTab.jsx",
                  lineNumber: 182,
                  columnNumber: 22
                }),
                /* @__PURE__ */ jsxDEV("button", { className: "shop-buy-btn", style: {
                  background: credits >= item.basePrice ? "var(--primary)" : "#334155"
                }, onClick: () => {
                  if (credits >= item.basePrice) {
                    setCredits((c) => c - item.basePrice);
                    addToInventory(id);
                    playSound("purchase");
                    createFloatingText(`Acquired ${item.name}`, false, "#4ade80");
                  } else createFloatingText("Insufficient funds", true);
                }, children: "PURCHASE ITEM" }, void 0, false, {
                  fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\SuppliesTab.jsx",
                  lineNumber: 195,
                  columnNumber: 73
                })
              ] }, void 0, true, {
                fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\SuppliesTab.jsx",
                lineNumber: 178,
                columnNumber: 157
              })
            ] }, void 0, true, {
              fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\SuppliesTab.jsx",
              lineNumber: 167,
              columnNumber: 103
            })
          ] }, id, true, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\SuppliesTab.jsx",
            lineNumber: 163,
            columnNumber: 22
          });
        }) }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\SuppliesTab.jsx",
          lineNumber: 158,
          columnNumber: 24
        })
      ] }, category, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\SuppliesTab.jsx",
        lineNumber: 142,
        columnNumber: 16
      });
    }) }, void 0, false, {
      fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\SuppliesTab.jsx",
      lineNumber: 135,
      columnNumber: 56
    })
  ] }, void 0, true, {
    fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\shop\\SuppliesTab.jsx",
    lineNumber: 73,
    columnNumber: 10
  });
};
export {
  SuppliesTab
};
