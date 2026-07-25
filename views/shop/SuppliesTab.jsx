// Split out of ShopView.js (token-efficiency pass): the "supplies" tab's
// JSX only. Receives every piece of ShopView's state/handlers it might touch
// as a single props object (safe superset -- unused ones cost nothing) so no
// tab loses access to something it needs.

import React from "react";
import { Heart, Sword, Shield, Zap, Sparkles, LayoutGrid, Package, Book, Star, Gem, Monitor, Database, Info, X, Hammer, Activity, Clover, Crown } from "lucide-react";
import { playSound } from "../../utils.js";
import { isMobile } from "../ViewShared.js";
const SuppliesTab = props => {
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
  return <div className="animate-fadeIn"><div style={{
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr",
      gap: 20,
      marginBottom: 30
    }}><div className="shop-featured-banner hot-deal-glow" style={{
        background: "linear-gradient(135deg, #1e1b4b, #312e81)",
        borderColor: "#6366f1",
        height: "100%",
        marginBottom: 0,
        flexDirection: "row"
      }}><div className="featured-content"><div className="featured-tag" style={{
            background: "#6366f1",
            color: "#fff"
          }}>GRAND ARCHITECT'S FORGE</div><h3 className="featured-title">Aetheric Resonance</h3><p className="featured-desc">Master-tier transmutation. Use mass materials to directly force account growth.</p><div style={{
            display: "flex",
            gap: 10
          }}><button className="featured-buy-btn" style={{
              background: "#4ade80"
            }} onClick={() => {
              const cost = 25e3;
              if (credits >= cost && materials >= 5e3) {
                setCredits(c => c - cost);
                setMaterials(s => s - 5e3);
                setAura(a => a + 15);
                createFloatingText("FORGED: +15 AURA", false, "#a855f7");
                playSound("craft");
                safeTriggerVisualEffect("fx_powerup.png", "50%", "50%", 1.5);
              } else createFloatingText("Need $25k + 5k Materials", true);
            }}>FORGE AURA ($25k + 5k Materials)</button></div></div><div className="featured-visual"><Hammer size={80} color="#6366f1" className="animate-pulse" /></div></div><div className="shop-featured-banner" style={{
        background: "linear-gradient(135deg, #0f172a, #1e293b)",
        borderColor: "#00d2ff",
        marginBottom: 0,
        flexDirection: "column",
        textAlign: "center",
        justifyContent: "center"
      }}><div className="featured-tag" style={{
          background: "#00d2ff",
          color: "#000",
          marginBottom: 15
        }}>DAILY RESOURCE</div><div style={{
          marginBottom: 15
        }}><Gem size={32} color="#00d2ff" style={{
            marginBottom: 5
          }} /><div style={{
            fontWeight: 900,
            fontSize: "1.2rem",
            color: "#fff"
          }}>GEM HARVEST</div></div><button className="featured-buy-btn" style={{
          background: "#00d2ff",
          width: "100%"
        }} onClick={() => {
          const costMaterials = 5e4;
          const costEssence = 1e3;
          if (materials >= costMaterials && essence >= costEssence) {
            setMaterials(s => s - costMaterials);
            setEssence(e => e - costEssence);
            setGems(g => g + 100);
            createFloatingText("EXTRACTED: 100 GEMS", false, "#00d2ff");
            playSound("jackpot");
            safeTriggerVisualEffect("fx_magic_circle.png", "50%", "50%", 2);
          } else createFloatingText("Need 50k Materials + 1k Essence", true);
        }}>EXCHANGE (50k S + 1k E)</button></div></div><div style={{
      display: "flex",
      flexDirection: "column",
      gap: 30
    }}>{["consumable", "material"].map(category => {
        const catItems = Object.entries(items || {}).filter(([_, item]) => item.type === category && item.rarity !== "epic" && item.rarity !== "legendary");
        if (catItems.length === 0) return null;
        return <div key={category} className="animate-fadeIn"><div style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 15,
            borderLeft: "3px solid var(--primary)",
            paddingLeft: 12
          }}><h3 style={{
              margin: 0,
              textTransform: "uppercase",
              letterSpacing: 2,
              fontSize: "1rem"
            }}>{category === "consumable" ? "Battle & Growth" : "Raw Materials"}</h3><div style={{
              flex: 1,
              height: 1,
              background: "linear-gradient(90deg, rgba(217, 70, 239, 0.2), transparent)"
            }} /></div><div className="shop-grid v3">{catItems.map(([id, item], idx) => {
              const imageSrc = item.imageUrl || "fx_star_pop.png";
              const sell = item.sellPrice || Math.floor((item.basePrice || 1e3) * 0.45);
              const desc = item.detailedDesc || item.desc;
              const rarityColor = item.rarity === "rare" ? "#3b82f6" : item.rarity === "epic" ? "#a855f7" : item.rarity === "legendary" ? "#facc15" : "var(--primary)";
              return <div key={id} className="shop-card-v3 animate-shop-entry" style={{
                animationDelay: `${idx * 0.05}s`
              }}><div className="shop-rarity-stripe" style={{
                  background: rarityColor
                }} /><div className="shop-card-header-v3"><img src={imageSrc} alt={item.name} /></div><div className="shop-card-body-v3"><div style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: 2
                  }}><div className="rarity-dot" style={{
                      background: rarityColor
                    }} /><span style={{
                      fontSize: "0.6rem",
                      fontWeight: 900,
                      textTransform: "uppercase",
                      color: rarityColor
                    }}>{item.rarity}</span></div><h4 className="shop-card-title-v3">{item.name}</h4><p className="shop-card-desc-v3" title={desc}>{desc}</p><div style={{
                    marginTop: "auto",
                    borderTop: "1px solid rgba(255,255,255,0.05)",
                    paddingTop: 12
                  }}><div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 10
                    }}><div style={{
                        fontSize: "1rem",
                        fontWeight: 900,
                        color: "#facc15"
                      }}>${(item.basePrice || 0).toLocaleString()}</div><div style={{
                        fontSize: "0.6rem",
                        color: "var(--text-muted)",
                        fontWeight: 700
                      }}>Valuation: ${sell.toLocaleString()}</div></div><button className="shop-buy-btn" style={{
                      background: credits >= item.basePrice ? "var(--primary)" : "#334155"
                    }} onClick={() => {
                      if (credits >= item.basePrice) {
                        setCredits(c => c - item.basePrice);
                        addToInventory(id);
                        playSound("purchase");
                        createFloatingText(`Acquired ${item.name}`, false, "#4ade80");
                      } else createFloatingText("Insufficient funds", true);
                    }}>PURCHASE ITEM</button></div></div></div>;
            })}</div></div>;
      })}</div></div>;
};
export { SuppliesTab };