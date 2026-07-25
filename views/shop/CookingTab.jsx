// Split out of ShopView.js (token-efficiency pass): the "cooking" tab's
// JSX only. Receives every piece of ShopView's state/handlers it might touch
// as a single props object (safe superset -- unused ones cost nothing) so no
// tab loses access to something it needs.

import React from "react";
import { Heart, Sword, Shield, Zap, Sparkles, LayoutGrid, Package, Book, Star, Gem, Monitor, Database, Info, X, Hammer, Activity, Clover, Crown } from "lucide-react";
import { playSound } from "../../utils.js";
import { isMobile } from "../ViewShared.js";
const CookingTab = props => {
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
  return <div className="animate-fadeIn">{gambleResult && <div className="summoning-overlay" onClick={() => setGambleResult(null)}><div className="glass-panel animate-popIn" style={{
        padding: 40,
        textAlign: "center",
        maxWidth: 340,
        border: "2px solid var(--gem-color)"
      }}>{gambleResult.imageUrl && <img src={gambleResult.imageUrl} style={{
          width: 90,
          height: 90,
          objectFit: "contain",
          marginBottom: 15
        }} />}<h2 style={{
          margin: "0 0 5px 0",
          fontFamily: "Cinzel",
          letterSpacing: 1
        }}>{gambleResult.name}</h2><p style={{
          fontSize: "0.8rem",
          opacity: 0.8,
          margin: "10px 0 25px 0"
        }}>{gambleResult.desc}</p><button className="train-btn" onClick={() => setGambleResult(null)}>NICE</button></div></div>}<div className="glass-panel" style={{
      padding: 25,
      marginBottom: 25,
      textAlign: "center",
      background: "linear-gradient(135deg, rgba(250, 204, 21, 0.08), rgba(15, 23, 42, 0.8))",
      borderColor: "rgba(250, 204, 21, 0.3)"
    }}><Activity size={36} color="#facc15" style={{
        marginBottom: 12
      }} /><h3 style={{
        margin: 0,
        fontSize: "1.3rem",
        fontWeight: 900,
        color: "#fff"
      }}>GAMBLE COOK</h3><p style={{
        fontSize: "0.8rem",
        color: "#94a3b8",
        maxWidth: 420,
        margin: "8px auto"
      }}>Throw resources at the stove and see what comes out. Cheaper than any single recipe -- but you don't pick the dish.</p><div style={{
        display: "flex",
        justifyContent: "center",
        gap: 15,
        margin: "12px 0 18px 0",
        flexWrap: "wrap"
      }}><span style={{
          fontSize: "0.75rem",
          fontWeight: 800,
          color: materials >= GAMBLE_COOK_COST.materials ? "#fff" : "#ef4444"
        }}>{`${GAMBLE_COOK_COST.materials.toLocaleString()} Materials`}</span><span style={{
          fontSize: "0.75rem",
          fontWeight: 800,
          color: essence >= GAMBLE_COOK_COST.essence ? "#f97316" : "#ef4444"
        }}>{`${GAMBLE_COOK_COST.essence.toLocaleString()} Essence`}</span><span style={{
          fontSize: "0.75rem",
          fontWeight: 800,
          color: credits >= GAMBLE_COOK_COST.credits ? "#facc15" : "#ef4444"
        }}>{`$${GAMBLE_COOK_COST.credits.toLocaleString()}`}</span></div><button className="train-btn" style={{
        width: "auto",
        padding: "12px 40px"
      }} onClick={handleGambleCook} disabled={!canAffordGamble}>COOK!</button></div><div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
      gap: 20
    }}>{COOKING_RECIPES.map((recipe, idx) => {
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
              flexShrink: 0,
              overflow: "hidden"
            }}>{outputItem.imageUrl ? <img src={outputItem.imageUrl} style={{
                width: "100%",
                height: "100%",
                objectFit: "contain"
              }} /> : <Activity size={24} color="var(--primary)" />}</div><div><h4 style={{
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
              }}><Database size={12} /> ${recipe.cost.credits}</div>}{recipe.cost.gems && <div style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                fontSize: "0.75rem",
                fontWeight: 800,
                color: gems >= recipe.cost.gems ? "#00d2ff" : "#ef4444"
              }}><Gem size={12} /> {recipe.cost.gems}</div>}</div></div><div style={{
            display: "flex",
            gap: 8
          }}><button className="shop-buy-btn" style={{
              flex: 1,
              padding: "10px",
              fontSize: "0.8rem",
              background: "rgba(255,255,255,0.05)"
            }} onClick={() => handleCraft(recipe, 1)} disabled={max < 1}>COOK x1</button><button className="shop-buy-btn" style={{
              flex: 2,
              padding: "10px",
              fontSize: "0.8rem",
              background: max >= 1 ? "var(--primary)" : "#334155",
              border: "none"
            }} onClick={() => handleCraft(recipe, max)} disabled={max < 1}>{`COOK MAX (${max})`}</button></div></div>;
      })}</div></div>;
};
export { CookingTab };