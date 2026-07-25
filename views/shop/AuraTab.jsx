// Split out of ShopView.js (token-efficiency pass): the "aura" tab's
// JSX only. Receives every piece of ShopView's state/handlers it might touch
// as a single props object (safe superset -- unused ones cost nothing) so no
// tab loses access to something it needs.

import React from "react";
import { Heart, Sword, Shield, Zap, Sparkles, LayoutGrid, Package, Book, Star, Gem, Monitor, Database, Info, X, Hammer, Activity, Clover, Crown } from "lucide-react";
import { playSound } from "../../utils.js";
import { isMobile } from "../ViewShared.js";
const AuraTab = props => {
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
      textAlign: "center",
      background: "linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(15, 23, 42, 0.8))",
      borderColor: "rgba(168, 85, 247, 0.3)"
    }}><Sparkles size={40} color="#a855f7" style={{
        marginBottom: 15
      }} /><h3 style={{
        margin: 0,
        fontSize: "1.5rem",
        fontWeight: 900,
        color: "#fff"
      }}>AURA SANCTUM</h3><p style={{
        fontSize: "0.85rem",
        color: "#94a3b8",
        maxWidth: "400px",
        margin: "10px auto"
      }}>Channel your accumulated aura into permanent resonance, strengthening every hero in your multiverse.</p><div style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        background: "rgba(168, 85, 247, 0.2)",
        padding: "6px 20px",
        borderRadius: 20,
        border: "1px solid rgba(168, 85, 247, 0.3)",
        marginTop: 10
      }}><Zap size={16} color="#a855f7" /><span style={{
          fontWeight: 900,
          fontSize: "1.1rem"
        }}>{aura} AVAILABLE</span></div><div style={{
        marginTop: 12
      }}><button className="shop-buy-btn" style={{
          padding: "10px 24px",
          background: "linear-gradient(135deg,#a855f7,#7c3aed)",
          color: "#fff",
          fontWeight: 900,
          border: "none"
        }} onClick={upgradeAuraAll} disabled={aura < auraLevelCost(0)}>{`⚡ MAX ALL — spend all ${aura.toLocaleString()} aura across every track`}</button></div></div><div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
      gap: 15
    }}>{["atk", "def", "hp", "speed", "magic_atk", "magic_def", "luck", "xp", "stamina", "vault", "bond"].map(stat => {
        const count = auraUpgrades[stat] || 0;
        const cost = 5 + count * 5;
        const statLabels = {
          atk: {
            label: "Physical Force",
            icon: <Sword size={20} />,
            color: "#f87171"
          },
          def: {
            label: "Iron Guard",
            icon: <Shield size={20} />,
            color: "#60a5fa"
          },
          hp: {
            label: "Vigor Pulse",
            icon: <Activity size={20} />,
            color: "#4ade80"
          },
          speed: {
            label: "Flash Step",
            icon: <Zap size={20} />,
            color: "#facc15"
          },
          magic_atk: {
            label: "Ether Blast",
            icon: <Sparkles size={20} />,
            color: "#a855f7"
          },
          magic_def: {
            label: "Arcane Veil",
            icon: <Monitor size={20} />,
            color: "#818cf8"
          },
          luck: {
            label: "Fate Twist",
            icon: <Clover size={20} />,
            color: "#34d399"
          },
          xp: {
            label: "Quick Study",
            icon: <Book size={20} />,
            color: "#f472b6"
          },
          stamina: {
            label: "Deep Breath",
            icon: <Zap size={20} />,
            color: "#34d399"
          },
          vault: {
            label: "Gold Hoard",
            icon: <Database size={20} />,
            color: "#fbbf24"
          },
          bond: {
            label: "Soul Link",
            icon: <Heart size={20} />,
            color: "#ec4899"
          }
        };
        const cfg = statLabels[stat] || {
          label: stat,
          icon: <Sparkles size={20} />,
          color: "#fff"
        };
        return <div key={stat} className="shop-card-v3" style={{
          textAlign: "left",
          padding: 16,
          borderLeft: `4px solid ${cfg.color}`
        }}><div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 12
          }}><div style={{
              color: cfg.color,
              background: `${cfg.color}15`,
              width: 44,
              height: 44,
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>{cfg.icon}</div><div style={{
              textAlign: "right"
            }}><div style={{
                fontSize: "0.6rem",
                color: "#94a3b8",
                fontWeight: 900
              }}>RESONANCE</div><div style={{
                fontSize: "1.2rem",
                fontWeight: 900
              }}>LV.{count}</div></div></div><div style={{
            fontWeight: 900,
            fontSize: "1rem",
            color: "#fff",
            marginBottom: 4
          }}>{cfg.label}</div><div style={{
            fontSize: "0.75rem",
            color: "#94a3b8",
            marginBottom: 15
          }}>Current Bonus: <span style={{
              color: "#4ade80",
              fontWeight: 900
            }}>+{count * 2}%</span></div><div style={{
            fontSize: "0.65rem",
            color: "#94a3b8",
            marginBottom: 6
          }}>{`Next Lv.: ${cost} Aura`}</div><div style={{
            display: "flex",
            gap: 6
          }}>{[1, 5, 10].map(n => <button key={n} className="shop-buy-btn" style={{
              flex: 1,
              padding: "8px 4px",
              fontSize: "0.72rem",
              background: aura >= cost ? cfg.color : "rgba(255,255,255,0.05)",
              color: aura >= cost ? "#000" : "rgba(255,255,255,0.2)",
              border: "none"
            }} onClick={() => upgradeAuraBulk(stat, n)} disabled={aura < cost}>{`×${n}`}</button>).concat([<button key="max" className="shop-buy-btn" style={{
              flex: 1.4,
              padding: "8px 4px",
              fontSize: "0.72rem",
              fontWeight: 900,
              background: aura >= cost ? "linear-gradient(135deg,#ffd700,#daa520)" : "rgba(255,255,255,0.05)",
              color: aura >= cost ? "#000" : "rgba(255,255,255,0.2)",
              border: "none"
            }} onClick={() => upgradeAuraBulk(stat, 9999)} disabled={aura < cost}>{`MAX (+${affordableAuraLevels(stat, aura).bought})`}</button>])}</div></div>;
      })}</div></div>;
};
export { AuraTab };