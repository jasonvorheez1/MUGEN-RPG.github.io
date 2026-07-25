// Split out of ShopView.js (token-efficiency pass): the "crafting" tab's
// JSX only. Receives every piece of ShopView's state/handlers it might touch
// as a single props object (safe superset -- unused ones cost nothing) so no
// tab loses access to something it needs.

import React from "react";
import { Heart, Sword, Shield, Zap, Sparkles, LayoutGrid, Package, Book, Star, Gem, Monitor, Database, Info, X, Hammer, Activity, Clover, Crown } from "lucide-react";
import { playSound } from "../../utils.js";
import { isMobile } from "../ViewShared.js";
const CraftingTab = props => {
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
  return <div className="animate-fadeIn"><div className="glass-panel" style={{
      padding: 25,
      marginBottom: 25,
      display: "flex",
      justifyContent: "space-around",
      background: "rgba(15, 23, 42, 0.9)",
      border: "2px solid rgba(255,255,255,0.05)",
      borderRadius: 24
    }}><div style={{
        textAlign: "center",
        flex: 1
      }}><div style={{
          fontSize: "0.7rem",
          color: "#94a3b8",
          fontWeight: 900,
          letterSpacing: 1,
          marginBottom: 5
        }}>SALVAGED MATERIALS</div><div style={{
          fontSize: "1.8rem",
          fontWeight: 900,
          color: "#fff",
          textShadow: "0 0 10px rgba(255,255,255,0.2)"
        }}><Package size={20} style={{
            marginRight: 5
          }} /> {materials.toLocaleString()}</div></div><div style={{
        width: 1,
        height: 50,
        background: "rgba(255,255,255,0.1)"
      }} /><div style={{
        textAlign: "center",
        flex: 1
      }}><div style={{
          fontSize: "0.7rem",
          color: "#f97316",
          fontWeight: 900,
          letterSpacing: 1,
          marginBottom: 5
        }}>RAW ESSENCE</div><div style={{
          fontSize: "1.8rem",
          fontWeight: 900,
          color: "#f97316",
          textShadow: "0 0 10px rgba(249, 115, 22, 0.2)"
        }}><Star size={20} style={{
            marginRight: 5
          }} /> {essence.toLocaleString()}</div></div></div><div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
      gap: 20
    }}>{CRAFTING_RECIPES.map((recipe, idx) => {
        const max = calculateMaxCraft(recipe);
        const outputItem = items[recipe.output] || {
          name: recipe.name,
          icon: "Package"
        };
        return <div key={recipe.id} className="shop-card-v3 animate-shop-entry" style={{
          animationDelay: `${idx * 0.04}s`,
          padding: 20,
          textAlign: "left",
          minHeight: "auto"
        }}><div style={{
            display: "flex",
            gap: 15,
            marginBottom: 15
          }}><div style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "rgba(255,255,255,0.03)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--primary)",
              flexShrink: 0
            }}><Hammer size={24} /></div><div><h4 style={{
                margin: 0,
                fontSize: "1.1rem",
                fontWeight: 900,
                color: "#fff"
              }}>{recipe.name}</h4><div style={{
                fontSize: "0.7rem",
                color: "var(--text-muted)",
                marginTop: 4
              }}>Output: {recipe.qty || 1}x {outputItem.name}</div></div></div><p style={{
            margin: "0 0 15px 0",
            fontSize: "0.75rem",
            color: "var(--text-muted)",
            lineHeight: 1.4,
            height: "2.8em",
            overflow: "hidden"
          }}>{recipe.desc}</p><div style={{
            background: "rgba(0,0,0,0.2)",
            padding: 12,
            borderRadius: 12,
            marginBottom: 20
          }}><div style={{
              fontSize: "0.65rem",
              fontWeight: 900,
              color: "var(--text-muted)",
              marginBottom: 8,
              textTransform: "uppercase"
            }}>Resources Required:</div><div style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10
            }}>{recipe.cost.materials && <div style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                fontSize: "0.75rem",
                fontWeight: 800,
                color: materials >= recipe.cost.materials ? "#fff" : "#ef4444"
              }}><Package size={12} /> {recipe.cost.materials}</div>}{recipe.cost.essence && <div style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                fontSize: "0.75rem",
                fontWeight: 800,
                color: essence >= recipe.cost.essence ? "#f97316" : "#ef4444"
              }}><Star size={12} /> {recipe.cost.essence}</div>}{recipe.cost.credits && <div style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                fontSize: "0.75rem",
                fontWeight: 800,
                color: credits >= recipe.cost.credits ? "#facc15" : "#ef4444"
              }}><Database size={12} /> ${recipe.cost.credits}</div>}</div></div><div style={{
            display: "flex",
            gap: 8
          }}><button className="shop-buy-btn" style={{
              flex: 1,
              padding: "10px",
              fontSize: "0.8rem",
              background: "rgba(255,255,255,0.05)"
            }} onClick={() => handleCraft(recipe, 1)} disabled={max < 1}>CRAFT x1</button><button className="shop-buy-btn" style={{
              flex: 2,
              padding: "10px",
              fontSize: "0.8rem",
              background: max >= 1 ? "var(--primary)" : "#334155",
              border: "none"
            }} onClick={() => handleCraft(recipe, max)} disabled={max < 1}>CRAFT MAX ({max})</button></div></div>;
      })}</div></div>;
};
export { CraftingTab };