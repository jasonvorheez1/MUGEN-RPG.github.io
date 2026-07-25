import React from "react";
import { Heart, Sword, Shield, Zap, Sparkles, LayoutGrid, Package, Book, Star, Gem, Monitor, Database, Info, X, Hammer, Activity, Clover, Crown } from "lucide-react";
import { playSound } from "../../utils.js";
import { isMobile } from "../ViewShared.js";
const FacilityTab = props => {
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
  return <div className="animate-fadeIn">{!isFeatureUnlocked("missions") && <div className="shop-item"><div><div style={{
          fontWeight: 900
        }}>Missions Board</div><div style={{
          fontSize: "0.7rem",
          opacity: 0.6
        }}>Daily resource collection</div></div><button className="train-btn" style={{
        width: "auto",
        padding: "8px 20px"
      }} onClick={() => unlockFeature("missions", 10, "gems")}>10 GEMS</button></div>}{!isFeatureUnlocked("auto_train_plus") && <div className="shop-item"><div><div style={{
          fontWeight: 900
        }}>Auto-Train Pro</div><div style={{
          fontSize: "0.7rem",
          opacity: 0.6
        }}>Enhanced automated routine</div></div><button className="train-btn" style={{
        width: "auto",
        padding: "8px 20px"
      }} onClick={() => unlockFeature("auto_train_plus", 25, "gems")}>25 GEMS</button></div>}<div className="shop-item">{(() => {
        const lv = auraUpgrades.stamina || 0;
        const limit = 100;
        const isMax = lv >= limit;
        const gemCost = Math.floor(100 * Math.pow(1.25, lv));
        const materialsCost = Math.floor(1e3 * Math.pow(1.2, lv));
        return <><div><div style={{
              fontWeight: 900
            }}>Stamina Capacitor</div><div style={{
              fontSize: "0.7rem",
              opacity: 0.6
            }}>Permanently increases your maximum Stamina by +10.</div><div style={{
              fontSize: "0.6rem",
              color: "#facc15"
            }}>Req: {gemCost} Gems + {materialsCost} Materials</div><div className={`limit-tag ${isMax ? "maxed" : ""}`}>LIMIT {lv}/{limit}</div></div><button className="train-btn" style={{
            width: "auto",
            padding: "8px 20px",
            background: isMax ? "#334155" : "linear-gradient(135deg,#f59e0b,#facc15)"
          }} disabled={isMax} onClick={() => {
            if (gems < gemCost || materials < materialsCost) {
              createFloatingText("Need more materials", true);
              return;
            }
            setGems(g => g - gemCost);
            setMaterials(s => s - materialsCost);
            setAuraUpgrades(p => ({
              ...p,
              stamina: (p.stamina || 0) + 1
            }));
            createFloatingText(`MAX STAMINA +10`, false, "#4ade80");
            playSound("levelUp");
          }}>{isMax ? "MAXED" : "UPGRADE"}</button></>;
      })()}</div><div className="shop-item">{(() => {
        const lv = auraUpgrades.auraPassive || 0;
        const limit = 25;
        const isMax = lv >= limit;
        const gemCost = Math.floor(250 * Math.pow(1.4, lv));
        return <><div><div style={{
              fontWeight: 900
            }}>Aura Well</div><div style={{
              fontSize: "0.7rem",
              opacity: 0.6
            }}>Permanently increases passive aura gain and grants an immediate aura infusion on purchase.</div><div style={{
              fontSize: "0.6rem",
              color: "#00d2ff"
            }}>Req: {gemCost} Gems</div><div className={`limit-tag ${isMax ? "maxed" : ""}`}>LIMIT {lv}/{limit}</div></div><button className="train-btn" style={{
            width: "auto",
            padding: "8px 20px",
            background: isMax ? "#334155" : "linear-gradient(135deg,#a855f7,#7c3aed)"
          }} disabled={isMax} onClick={() => {
            if (gems < gemCost) {
              createFloatingText(`Need ${gemCost} Gems`, true);
              return;
            }
            setGems(g => g - gemCost);
            setAuraUpgrades(p => ({
              ...p,
              auraPassive: (p.auraPassive || 0) + 1
            }));
            setAura(a => a + 25);
            createFloatingText(`AURA WELL INSTALLED: +25 Aura & passive gain up`, false, "#a855f7");
            playSound("levelUp");
          }}>{isMax ? "MAXED" : "UPGRADE"}</button></>;
      })()}</div><div className="shop-item">{(() => {
        const lv = auraUpgrades.xp || 0;
        const limit = 50;
        const isMax = lv >= limit;
        const gemCost = Math.floor(150 * Math.pow(1.3, lv));
        return <><div><div style={{
              fontWeight: 900
            }}>Training Manual</div><div style={{
              fontSize: "0.7rem",
              opacity: 0.6
            }}>Increase XP per TRAIN by +15% per purchase (stacks).</div><div style={{
              fontSize: "0.6rem",
              color: "#facc15"
            }}>Req: {gemCost} Gems</div><div className={`limit-tag ${isMax ? "maxed" : ""}`}>LIMIT {lv}/{limit}</div></div><button className="train-btn" style={{
            width: "auto",
            padding: "8px 20px",
            background: isMax ? "#334155" : "linear-gradient(135deg,#6366f1,#8b5cf6)"
          }} disabled={isMax} onClick={() => {
            if (gems < gemCost) {
              createFloatingText(`Need ${gemCost} Gems`, true);
              return;
            }
            setGems(g => g - gemCost);
            setAuraUpgrades(p => ({
              ...p,
              xp: (p.xp || 0) + 1
            }));
            createFloatingText(`TRAINING XP +15% (stack)`, false, "#a855f7");
            playSound("levelUp");
          }}>{isMax ? "MAXED" : "UPGRADE"}</button></>;
      })()}</div><div className="shop-item">{(() => {
        const lv = auraUpgrades.vault || 0;
        const limit = 50;
        const isMax = lv >= limit;
        const auraCost = Math.floor(25 * Math.pow(1.2, lv));
        return <><div><div style={{
              fontWeight: 900
            }}>Vault Expansion</div><div style={{
              fontSize: "0.7rem",
              opacity: 0.6
            }}>Increase idle credit capacity</div><div style={{
              fontSize: "0.6rem",
              color: "#a855f7"
            }}>Req: {auraCost} Aura</div><div className={`limit-tag ${isMax ? "maxed" : ""}`}>LIMIT {lv}/{limit}</div></div><button className="train-btn" style={{
            width: "auto",
            padding: "8px 20px",
            background: isMax ? "#334155" : "var(--sp-color)"
          }} disabled={isMax} onClick={() => {
            if (aura >= auraCost) {
              setAura(a => a - auraCost);
              setAuraUpgrades(p => ({
                ...p,
                vault: (p.vault || 0) + 1
              }));
              createFloatingText("VAULT EXPANDED!", false, "#a855f7");
              playSound("upgrade");
            } else createFloatingText(`Need ${auraCost} Aura`, true);
          }}>{isMax ? "MAXED" : "UPGRADE"}</button></>;
      })()}</div><div className="shop-item" style={{
      border: "2px solid #ef4444",
      background: "rgba(239, 68, 68, 0.05)"
    }}>{(() => {
        const lv = auraUpgrades.supernova || 0;
        const limit = 5;
        const isMax = lv >= limit;
        const gemCost = Math.floor(25e3 * Math.pow(3, lv));
        const auraCost = Math.floor(1e4 * Math.pow(2.5, lv));
        return <><div><div style={{
              fontWeight: 900,
              color: "#ef4444"
            }}>Supernova Reactor</div><div style={{
              fontSize: "0.7rem",
              opacity: 0.6
            }}>Drastically raises max stamina by +500 and doubles regeneration.</div><div style={{
              fontSize: "0.6rem",
              color: "#facc15"
            }}>Req: {gemCost.toLocaleString()} Gems + {auraCost.toLocaleString()} Aura</div><div className={`limit-tag ${isMax ? "maxed" : ""}`}>LIMIT {lv}/{limit}</div></div><button className="train-btn" style={{
            width: "auto",
            padding: "8px 20px",
            background: isMax ? "#334155" : "linear-gradient(135deg,#ef4444,#b91c1c)"
          }} disabled={isMax} onClick={() => {
            if (gems < gemCost || aura < auraCost) {
              createFloatingText("Materials Insufficient", true);
              return;
            }
            setGems(g => g - gemCost);
            setAura(a => a - auraCost);
            setAuraUpgrades(p => ({
              ...p,
              stamina: (p.stamina || 0) + 50,
              supernova: (p.supernova || 0) + 1
            }));
            createFloatingText(`MAX STAMINA +500`, false, "#ef4444");
            playSound("explosion");
          }}>{isMax ? "MAXED" : "IGNITE"}</button></>;
      })()}</div><div className="shop-item" style={{
      border: "2px solid #00d2ff",
      background: "rgba(0, 210, 255, 0.05)"
    }}>{(() => {
        const lv = auraUpgrades.geode_drill || 0;
        const limit = 10;
        const isMax = lv >= limit;
        const gemCost = Math.floor(15e3 * Math.pow(2, lv));
        const materialsCost = Math.floor(5e4 * Math.pow(1.8, lv));
        return <><div><div style={{
              fontWeight: 900,
              color: "#00d2ff"
            }}>Dimensional Drill</div><div style={{
              fontSize: "0.7rem",
              opacity: 0.6
            }}>Permanently triples the speed of the Gem Geode generator.</div><div style={{
              fontSize: "0.6rem",
              color: "#facc15"
            }}>Req: {gemCost.toLocaleString()} Gems + {materialsCost.toLocaleString()} Materials</div><div className={`limit-tag ${isMax ? "maxed" : ""}`}>LIMIT {lv}/{limit}</div></div><button className="train-btn" style={{
            width: "auto",
            padding: "8px 20px",
            background: isMax ? "#334155" : "linear-gradient(135deg,#00d2ff,#3b82f6)"
          }} disabled={isMax} onClick={() => {
            if (gems < gemCost || materials < materialsCost) {
              createFloatingText("Materials Insufficient", true);
              return;
            }
            setGems(g => g - gemCost);
            setMaterials(s => s - materialsCost);
            setAuraUpgrades(p => ({
              ...p,
              geode_drill: (p.geode_drill || 0) + 1
            }));
            createFloatingText(`DRILL ACTIVE: GEODE SPEED UP`, false, "#00d2ff");
            playSound("craft");
          }}>{isMax ? "MAXED" : "UPGRADE"}</button></>;
      })()}</div><div className="shop-item" style={{
      border: "3px solid #facc15",
      background: "linear-gradient(135deg, rgba(250, 204, 21, 0.1), transparent)",
      boxShadow: "0 0 20px rgba(250, 204, 21, 0.2)"
    }}>{(() => {
        const lv = auraUpgrades.singularity || 0;
        const limit = 10;
        const isMax = lv >= limit;
        const creditCost = Math.floor(3e10 * Math.pow(1.5, lv));
        const gemCost = Math.floor(1e4 * Math.pow(1.5, lv));
        return <><div><div style={{
              fontWeight: 900,
              color: "#facc15",
              fontSize: "1.1rem"
            }}>Omniversal Singularity Link</div><div style={{
              fontSize: "0.75rem",
              opacity: 0.8,
              color: "#fff",
              maxWidth: "350px"
            }}>Permanently grants +100% to ALL HERO STATS and doubles resource gain. The ultimate mark of a Master Trainer.</div><div style={{
              fontSize: "0.65rem",
              color: "#f472b6",
              marginTop: 4,
              fontWeight: 900
            }}>Requirement: ${creditCost.toLocaleString()} + {gemCost.toLocaleString()} Gems</div><div className={`limit-tag ${isMax ? "maxed" : ""}`}>LIMIT {lv}/{limit}</div></div><button className="train-btn" style={{
            width: "auto",
            padding: "12px 24px",
            background: isMax ? "#334155" : "linear-gradient(180deg, #facc15, #ca8a04)",
            color: isMax ? "#fff" : "#000"
          }} disabled={isMax} onClick={() => {
            if (credits < creditCost || gems < gemCost) {
              createFloatingText(`Incomplete Sync: Need resources`, true);
              return;
            }
            setCredits(c => c - creditCost);
            setGems(g => g - gemCost);
            setAuraUpgrades(p => ({
              ...p,
              singularity: (p.singularity || 0) + 1
            }));
            createFloatingText(`!!! OMNIVERSAL LINK ESTABLISHED !!!`, false, "#facc15");
            playSound("gacha_legendary");
            safeTriggerVisualEffect("fx_ultimate_blast.png", "50%", "50%", 3);
          }}>{isMax ? "MAXED" : "ASCEND"}</button></>;
      })()}</div><div className="shop-item" style={{
      border: "3px solid #a855f7",
      background: "rgba(168, 85, 247, 0.05)"
    }}>{(() => {
        const lv = auraUpgrades.transmutation || 0;
        const gemCost = Math.floor(5e4 * Math.pow(1.25, lv));
        return <><div><div style={{
              fontWeight: 900,
              color: "#a855f7",
              fontSize: "1.1rem"
            }}>Aura Transmutation Core</div><div style={{
              fontSize: "0.75rem",
              opacity: 0.8,
              color: "#fff",
              maxWidth: "350px"
            }}>Instantly grants +1,000,000 Materials and +25,000 Essence. A massive jump in crafting capability.</div><div style={{
              fontSize: "0.65rem",
              color: "#00d2ff",
              marginTop: 4,
              fontWeight: 900
            }}>Requirement: {gemCost.toLocaleString()} Gems</div><div className="limit-tag">PURCHASED: {lv}</div></div><button className="train-btn" style={{
            width: "auto",
            padding: "12px 24px",
            background: "linear-gradient(180deg, #a855f7, #7c3aed)",
            color: "#fff"
          }} onClick={() => {
            if (gems < gemCost) {
              createFloatingText(`Need ${gemCost.toLocaleString()} Gems`, true);
              return;
            }
            setGems(g => g - gemCost);
            setAuraUpgrades(p => ({
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
          }}>PURCHASE</button></>;
      })()}</div><div className="glass-panel" style={{
      textAlign: "center",
      opacity: 0.5,
      padding: 20,
      marginTop: 15
    }}><Info size={24} style={{
        marginBottom: 10
      }} /><div style={{
        fontSize: "0.8rem"
      }}>Higher facility ranks unlock automatically based on total Power Level.</div></div></div>;
};
export { FacilityTab };