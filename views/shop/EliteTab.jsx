// Split out of ShopView.js (token-efficiency pass): the "elite" tab's
// JSX only. Receives every piece of ShopView's state/handlers it might touch
// as a single props object (safe superset -- unused ones cost nothing) so no
// tab loses access to something it needs.

import React from "react";
import { Heart, Sword, Shield, Zap, Sparkles, LayoutGrid, Package, Book, Star, Gem, Monitor, Database, Info, X, Hammer, Activity, Clover, Crown } from "lucide-react";
import { playSound } from "../../utils.js";
import { isMobile } from "../ViewShared.js";
const EliteTab = props => {
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
  return <div className="animate-fadeIn"><div className="shop-featured-banner" style={{
      background: "linear-gradient(135deg, #1e293b, #0f172a)",
      border: "2px solid #facc15",
      marginBottom: 25
    }}><div className="featured-content"><div className="featured-tag" style={{
          background: "#facc15",
          color: "#000"
        }}>LEVEL 100+ EXCLUSIVES</div><h3 className="featured-title">High-Dimension Synthetics</h3><p className="featured-desc">These items bypass standard tactical limits. Requires both mass Credits and Dimensional Gems.</p></div><Crown size={64} color="#facc15" className="animate-pulse" /></div><div className="shop-grid v3">{Object.entries(items || {}).filter(([_, item]) => item.dualCost).map(([id, item]) => <div key={id} className="shop-card-v3" style={{
        border: "1px solid #facc1533"
      }}><div className="shop-rarity-stripe" style={{
          background: "#facc15"
        }} /><div className="shop-card-header-v3"><img src={item.imageUrl} alt={item.name} /></div><div className="shop-card-body-v3"><div style={{
            display: "flex",
            alignItems: "center",
            marginBottom: 2
          }}><div className="rarity-dot" style={{
              background: "#facc15"
            }} /><span style={{
              fontSize: "0.6rem",
              fontWeight: 900,
              textTransform: "uppercase",
              color: "#facc15"
            }}>ELITE ARTIFACT</span></div><h4 className="shop-card-title-v3">{item.name}</h4><p className="shop-card-desc-v3">{item.detailedDesc || item.desc}</p><div style={{
            marginTop: "auto",
            borderTop: "1px solid rgba(255,255,255,0.05)",
            paddingTop: 12
          }}><div style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
              marginBottom: 12
            }}><div style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: "0.85rem",
                fontWeight: 900,
                color: credits >= item.dualCost.credits ? "#facc15" : "#ef4444"
              }}><Database size={12} /> ${item.dualCost.credits.toLocaleString()}</div><div style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: "0.85rem",
                fontWeight: 900,
                color: gems >= item.dualCost.gems ? "#00d2ff" : "#ef4444"
              }}><Gem size={12} /> {item.dualCost.gems.toLocaleString()} GEMS</div></div><button className="shop-buy-btn" style={{
              background: credits >= item.dualCost.credits && gems >= item.dualCost.gems ? "var(--primary)" : "#334155"
            }} onClick={() => {
              if (credits >= item.dualCost.credits && gems >= item.dualCost.gems) {
                setCredits(c => c - item.dualCost.credits);
                setGems(g => g - item.dualCost.gems);
                addToInventory(id);
                playSound("purchase");
                createFloatingText(`Elite Acquisition: ${item.name}`, false, "#facc15");
              } else createFloatingText("Resources Insufficient", true);
            }}>ACQUIRE</button></div></div></div>)}</div></div>;
};
export { EliteTab };