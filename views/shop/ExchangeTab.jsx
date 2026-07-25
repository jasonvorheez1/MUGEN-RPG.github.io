// Split out of ShopView.js (token-efficiency pass): the "exchange" tab's
// JSX only. Receives every piece of ShopView's state/handlers it might touch
// as a single props object (safe superset -- unused ones cost nothing) so no
// tab loses access to something it needs.

import React from "react";
import { Heart, Sword, Shield, Zap, Sparkles, LayoutGrid, Package, Book, Star, Gem, Monitor, Database, Info, X, Hammer, Activity, Clover, Crown } from "lucide-react";
import { playSound } from "../../utils.js";
import { isMobile } from "../ViewShared.js";
const ExchangeTab = props => {
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
      marginBottom: 20,
      textAlign: "center",
      borderColor: "#facc15",
      boxShadow: "0 0 20px rgba(250, 204, 21, 0.1)"
    }}><h3 style={{
        margin: 0,
        color: "#facc15",
        fontSize: "1.5rem",
        fontWeight: 900
      }}>BLACK MARKET EXCHANGE</h3><p style={{
        fontSize: "0.8rem",
        color: "var(--text-muted)"
      }}>Convert surplus resources instantly. No refunds.</p></div><div className="shop-grid v3"><div className="shop-card-v3" style={{
        gridColumn: "span 2"
      }}><div className="shop-card-icon-v3" style={{
          color: "#facc15"
        }}><Database size={24} /></div><h4 className="shop-card-title-v3">Industrial Resource Liquidation</h4><p className="shop-card-desc-v3">Dump massive credit reserves to instantly manufacture raw materials materials for crafting.</p><div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10
        }}><button className="shop-buy-btn" onClick={() => {
            if (credits >= 1e5) {
              setCredits(c => c - 1e5);
              setMaterials(s => s + 1e3);
              createFloatingText("+1,000 Materials", false, "#94a3b8");
              playSound("sell_item");
            } else createFloatingText("Need $100k", true);
          }}>$100k → 1k Materials</button><button className="shop-buy-btn" onClick={() => {
            if (credits >= 1e6) {
              setCredits(c => c - 1e6);
              setMaterials(s => s + 1e4);
              createFloatingText("+10,000 Materials", false, "#94a3b8");
              playSound("sell_item");
            } else createFloatingText("Need $1.0M", true);
          }}>$1.0M → 10k Materials</button><button className="shop-buy-btn" onClick={() => {
            if (credits >= 25e5) {
              setCredits(c => c - 25e5);
              setMaterials(s => s + 25e3);
              createFloatingText("+25,000 Materials", false, "#94a3b8");
              playSound("sell_item");
            } else createFloatingText("Need $2.5M", true);
          }}>$2.5M → 25k Materials</button><button className="shop-buy-btn" style={{
            background: "linear-gradient(135deg, #334155, #1e293b)"
          }} onClick={() => {
            if (credits >= 5e6) {
              setCredits(c => c - 5e6);
              setMaterials(s => s + 5e4);
              createFloatingText("+50,000 Materials!", false, "#fff");
              playSound("item_craft");
            } else createFloatingText("Need $5.0M", true);
          }}>$5.0M → 50k Materials</button></div></div><div className="shop-card-v3"><div className="shop-card-icon-v3" style={{
          color: "#4ade80"
        }}><Zap size={24} /></div><h4 className="shop-card-title-v3">Energy Surge</h4><p className="shop-card-desc-v3">Burn materials to keep training forever.</p><button className="shop-buy-btn" onClick={() => {
          if (materials >= 500) {
            setMaterials(s => s - 500);
            setStamina(st => Math.min(maxStamina, st + 100));
            createFloatingText("+100 Stamina", false, "#4ade80");
            playSound("heal_spell");
          } else createFloatingText("Need 500 Materials", true);
        }}>500 Materials → 100 Sta</button></div><div className="shop-card-v3"><div className="shop-card-icon-v3" style={{
          color: "#f97316"
        }}><Star size={24} /></div><h4 className="shop-card-title-v3">Essence Distillation</h4><p className="shop-card-desc-v3">Condense materials into pure essence.</p><button className="shop-buy-btn" onClick={() => {
          if (materials >= 2500) {
            setMaterials(s => s - 2500);
            setEssence(e => e + 10);
            createFloatingText("+10 Essence", false, "#f97316");
            playSound("magic_blast");
          } else createFloatingText("Need 2.5k Materials", true);
        }}>2.5k Materials → 10 Ess</button></div><div className="shop-card-v3"><div className="shop-card-icon-v3" style={{
          color: "#00d2ff"
        }}><Gem size={24} /></div><h4 className="shop-card-title-v3">Gem Synthesis</h4><p className="shop-card-desc-v3">The ultimate conversion.</p><button className="shop-buy-btn" onClick={() => {
          if (essence >= 50) {
            setEssence(e => e - 50);
            setGems(g => g + 50);
            createFloatingText("+50 Gems", false, "#00d2ff");
            playSound("gacha_legendary");
          } else createFloatingText("Need 50 Essence", true);
        }}>50 Ess → 50 Gems</button></div><div className="shop-card-v3"><div className="shop-card-icon-v3" style={{
          color: "#a855f7"
        }}><Zap size={24} /></div><h4 className="shop-card-title-v3">Aura Compression</h4><p className="shop-card-desc-v3">Compress massive materials into raw account Aura.</p><button className="shop-buy-btn" onClick={() => {
          if (materials >= 1e5) {
            setMaterials(s => s - 1e5);
            setAura(a => a + 100);
            createFloatingText("+100 Aura", false, "#a855f7");
            playSound("magic_blast");
          } else createFloatingText("Need 100k Materials", true);
        }}>100k Materials → 100 Aura</button></div><div className="shop-card-v3"><div className="shop-card-icon-v3" style={{
          color: "#facc15"
        }}><Database size={24} /></div><h4 className="shop-card-title-v3">Reality Funding</h4><p className="shop-card-desc-v3">Donate to the city's future for a massive Gem grant.</p><button className="shop-buy-btn" onClick={() => {
          const cost = 1e9;
          if (credits >= cost) {
            setCredits(c => c - cost);
            setGems(g => g + 5e3);
            createFloatingText("+5,000 Gems!", false, "#00d2ff");
            playSound("jackpot");
          } else createFloatingText("Need $1.0B", true);
        }}>$1.0B → 5k Gems</button></div></div></div>;
};
export { ExchangeTab };