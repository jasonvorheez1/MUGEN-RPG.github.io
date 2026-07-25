import React from "react";
import { Shield, Users, Sparkles, ChevronRight, ArrowRight, Map as MapIcon, Plus } from "lucide-react";
import { BattleUnit, VictoryScreen, getBattleStats, executeCombatSkill, TacticalStanceRow, applyStatusTick, resolveBasicAttack, getCastAnimMs, getLungeMs, getBasicAttackMs, getCooldownGain, getFlurryHitSound, HITSTOP_BUFFER_MS, ProjectileLayer, pushShieldEffect, TurnOrderStrip } from "../../CombatSystem.js";
import { CAMPAIGN_CONTENT, ELEMENTS, LEADER_SKILLS, COSMETICS, AUTO_CLEAR_PWR_MULT } from "../../constants.js";
import { calculateStat, playSound, calculateSubStat, getTierEfficiency, applyLeaderBonus, applyCrewChemistry, getEnemyStatsFromCP, formatPower, applyMitigation, incrementCourierFieldBattles, getDominantSpecialKey, SPECIAL_ARCHETYPE_NAMES, getGaugeGain, getGearPassives, rollEnemyGear, INITIAL_GAUGE_RANGE } from "../../utils.js";
import { isMobile, CampaignIntro } from "../ViewShared.js";
const PreBattleModal = props => {
  const {
    onWorldTimeStop,
    characters,
    unlockedIds,
    credits,
    setCredits,
    gems,
    setGems,
    aura,
    setAura,
    stamina,
    setStamina,
    maxStamina,
    createFloatingText,
    campaignProgress,
    setCampaignProgress,
    setShards,
    squadIds,
    setSquadIds,
    triggerVisualEffect2,
    setBattleMusicActive,
    setIsVictoryMusic,
    setIsHardBattle,
    skills,
    items,
    addToInventory,
    setCharacters,
    setShowSquadBuilder,
    campaignRanks,
    setCampaignRanks,
    auraUpgrades,
    settings,
    cameoId,
    cameoData,
    cameoRef,
    cameoCutin,
    setCameoCutin,
    fxEnabled,
    activeBattle,
    setActiveBattle,
    battleRewards,
    setBattleRewards,
    battleRank,
    setBattleRank,
    pendingStage,
    setPendingStage,
    isHardMode,
    setIsHardMode,
    currentChapter,
    setCurrentChapter,
    currentArea,
    setCurrentArea,
    autoAreaChapterRef,
    jumpToNextStage,
    prevCampaignProgressRef,
    justClearedStageId,
    setJustClearedStageId,
    combatants,
    setCombatants,
    battleState,
    setBattleState,
    battleLog,
    setBattleLog,
    activeSkill,
    setActiveSkill,
    floatingDamages,
    setFloatingDamages,
    playerElement,
    setPlayerElement,
    autoBattle,
    setAutoBattle,
    combatSpeed,
    setCombatSpeed,
    markedTargetId,
    setMarkedTargetId,
    stageElementFilter,
    setStageElementFilter,
    elementalChain,
    setElementalChain,
    comboRef,
    comboMult,
    comboDisplay,
    setComboDisplay,
    hitStopUntil,
    battleSceneRef,
    sceneShake,
    setSceneShake,
    shakeTimer,
    triggerShake,
    prevBrokenIds,
    breakBanner,
    setBreakBanner,
    bumpCombo,
    breakCombo,
    parryFlash,
    setParryFlash,
    resonanceRef,
    applyResonance,
    tacticalStanceId,
    changePlayerElement,
    squadIdSet,
    unlockedIdSet,
    squad,
    autoFillSquad,
    clearSquad,
    getSynergies,
    totalSquadPWR,
    synergies,
    raidResults,
    setRaidResults,
    RAID_RANK_MULTS,
    handleRaid,
    handleSweepAll,
    addLog,
    showDamage,
    lastSkillTimestamp,
    setLastSkillTimestamp,
    canAutoClearStage,
    autoClearStage,
    startStage,
    triggerDefend,
    triggerSkill,
    triggerCameo,
    loopState,
    timeStopHandledRef,
    handledActionTimes,
    getChapterProgress,
    getAreaProgress
  } = props;
  return <><div className="hero-select-modal animate-fadeIn" style={{
      display: "flex",
      flexDirection: "column",
      backgroundImage: `linear-gradient(180deg, rgba(5,5,10,0.55), rgba(5,5,10,0.92) 60%, rgba(5,5,10,0.97)), url(${pendingStage.bg || "background_battle.png"})`,
      backgroundSize: "cover",
      backgroundPosition: "center"
    }}><div className="modal-header" style={{
        background: "rgba(10,10,16,0.55)",
        borderRadius: 16,
        padding: "10px 16px",
        backdropFilter: "blur(6px)"
      }}><div><h2 style={{
            margin: 0,
            color: ELEMENTS[pendingStage.element]?.color || "var(--primary)"
          }}>{pendingStage.name}</h2><div style={{
            fontSize: "0.8rem",
            opacity: 0.7,
            maxWidth: "400px",
            marginTop: 4
          }}>Target Enemy: {pendingStage.enemy} • Element: {pendingStage.element}</div></div><button className="upgrade-btn" style={{
          padding: "10px 20px"
        }} onClick={() => setPendingStage(null)}>BACK</button></div><div style={{
        background: "rgba(0,0,0,0.3)",
        padding: 15,
        borderRadius: 16,
        marginBottom: 20
      }}><div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12
        }}><h3 style={{
            margin: 0,
            fontSize: "0.9rem",
            fontWeight: 900
          }}>MISSION SQUAD ({squadIds.length}/4)</h3><div style={{
            display: "flex",
            gap: 8
          }}><button className="upgrade-btn" style={{
              fontSize: "0.7rem"
            }} onClick={() => setShowSquadBuilder({
              element: pendingStage.requiredElement,
              franchise: pendingStage.requiredFranchise
            })}>EDIT SQUAD</button><button className="upgrade-btn" style={{
              fontSize: "0.7rem"
            }} onClick={() => autoFillSquad(pendingStage)}>AUTO-FILL</button>{squadIds.length > 0 && <button className="upgrade-btn" style={{
              fontSize: "0.7rem",
              opacity: 0.7
            }} onClick={clearSquad}>CLEAR</button>}<button className="train-btn" style={{
              width: "auto",
              padding: "8px 24px"
            }} disabled={squadIds.length === 0} onClick={() => startStage(pendingStage)}>COMMENCE MISSION</button>{canAutoClearStage(pendingStage) ? <button className="train-btn" style={{
              width: "auto",
              padding: "8px 24px",
              background: "linear-gradient(135deg,#00d2ff,#0891b2)",
              color: "#000"
            }} onClick={() => autoClearStage(pendingStage)}>⚡ AUTO CLEAR</button> : null}</div></div><div className="squad-slots-row" style={{
          gridTemplateColumns: "repeat(4, 1fr)"
        }}>{Array.from({
            length: 4
          }).map((_, i) => {
            const heroId = squadIds[i];
            const c = heroId ? characters.find(h => String(h.export_id) === String(heroId)) : null;
            return <div key={i} className={`squad-member-slot ${c ? "active" : "empty"}`} onClick={() => setShowSquadBuilder(true)}>{c ? <img src={c.imageUrl} /> : <Plus size={20} opacity={0.2} />}</div>;
          })}</div></div><div className={`glass-panel ${isHardMode ? "nightmare-panel" : ""}`} style={{
        padding: 20,
        textAlign: "center",
        opacity: 0.8
      }}>{isHardMode && <div style={{
          color: "#ef4444",
          fontWeight: 900,
          fontSize: "0.8rem",
          letterSpacing: 2,
          marginBottom: 5,
          animation: "pulse-glow 1s infinite"
        }}>NIGHTMARE DIFFICULTY</div>}{(pendingStage.requiredElement || pendingStage.requiredFranchise || pendingStage.requiredRelType || pendingStage.minAvgLevel || pendingStage.squadSizeReq) && (() => {
          const h = React.createElement;
          const ps = pendingStage;
          const avg = squad.length ? squad.reduce((s, c) => s + (c.level || 1), 0) / squad.length : 0;
          const unlockedRoster = characters.filter(c => unlockedIdSet.has(String(c.export_id)));
          const frMatch = (c, t) => {
            const f = (c.franchise || "").toLowerCase().trim();
            const tt = String(t).toLowerCase().trim();
            return f === tt || f.includes(tt);
          };
          const rosterCanFr = ps.requiredFranchise ? unlockedRoster.some(c => frMatch(c, ps.requiredFranchise)) : true;
          const rosterCanEl = ps.requiredElement ? unlockedRoster.some(c => String(c.element).toUpperCase() === String(ps.requiredElement).toUpperCase()) : true;
          const reqs = [];
          if (ps.squadSizeReq) reqs.push({
            label: `Full squad of ${ps.squadSizeReq}`,
            met: squad.length >= ps.squadSizeReq
          });
          if (ps.minAvgLevel) reqs.push({
            label: `Avg Lv.${ps.minAvgLevel}+ (now ${Math.floor(avg)})`,
            met: avg >= ps.minAvgLevel
          });
          if (ps.requiredElement) reqs.push({
            label: `${ps.requiredElement} hero`,
            waived: !rosterCanEl,
            met: squad.some(c => String(c.element).toUpperCase() === String(ps.requiredElement).toUpperCase())
          });
          if (ps.requiredFranchise) reqs.push({
            label: `${ps.requiredFranchise} hero`,
            waived: !rosterCanFr,
            met: squad.some(c => frMatch(c, ps.requiredFranchise))
          });
          if (ps.requiredRelType) reqs.push({
            label: `${ps.requiredRelType} bond`,
            met: squad.some(c => String(c.relationship || "").toLowerCase().includes(ps.requiredRelType.toLowerCase()))
          });
          return <div style={{
            background: "rgba(233,69,96,0.08)",
            border: "1px solid var(--primary)",
            borderRadius: 12,
            padding: "10px 12px",
            marginBottom: 15,
            textAlign: "left"
          }}><div style={{
              fontSize: "0.6rem",
              fontWeight: 900,
              color: "var(--primary)",
              letterSpacing: 2,
              marginBottom: 7
            }}>WHO'S GETTING IN</div><div style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 6
            }}>{reqs.map((r, i) => {
                const ok = r.waived || r.met;
                const col = r.waived ? "#94a3b8" : r.met ? "#4ade80" : "#f87171";
                return <span key={i} style={{
                  fontSize: "0.66rem",
                  fontWeight: 800,
                  padding: "3px 9px",
                  borderRadius: 20,
                  background: r.waived ? "rgba(148,163,184,0.12)" : r.met ? "rgba(74,222,128,0.13)" : "rgba(239,68,68,0.13)",
                  color: col,
                  border: "1px solid " + col + "44"
                }}>{(r.waived ? "\u2014 " : r.met ? "\u2713 " : "\u2717 ") + r.label + (r.waived ? " (waived)" : "")}</span>;
              })}</div></div>;
        })()}<div style={{
          fontSize: "0.75rem",
          fontWeight: 900,
          color: "#facc15",
          marginBottom: 10
        }}>RECOMMENDED POWER: {(pendingStage.cpReq * (isHardMode ? 2 : 1)).toLocaleString()}</div><div style={{
          display: "flex",
          justifyContent: "center",
          gap: 20
        }}><div><div style={{
              fontSize: "0.6rem",
              color: "var(--text-muted)"
            }}>CURRENT SQUAD</div><div style={{
              fontSize: "1.2rem",
              fontWeight: 900,
              color: totalSquadPWR < pendingStage.cpReq * (isHardMode ? 2 : 1) ? "#ef4444" : "#4ade80"
            }}>{totalSquadPWR.toLocaleString()}</div></div><div style={{
            width: 1,
            background: "rgba(255,255,255,0.1)"
          }} /><div><div style={{
              fontSize: "0.6rem",
              color: "var(--text-muted)"
            }}>WIN CHANCE</div><div style={{
              fontSize: "1.2rem",
              fontWeight: 900
            }}>{Math.min(100, Math.floor(totalSquadPWR / (pendingStage.cpReq * (isHardMode ? 2 : 1)) * 100))}%</div></div></div></div></div>{raidResults && <div className="battle-result-overlay animate-fadeIn"><div className="glass-panel" style={{
        width: "90%",
        maxWidth: "400px",
        padding: 30,
        textAlign: "center",
        borderColor: "#4ade80"
      }}><h2 style={{
          margin: "0 0 5px 0",
          color: "#4ade80",
          fontSize: "1.8rem"
        }}>RAID COMPLETE</h2><div style={{
          fontSize: "0.8rem",
          color: "var(--text-muted)",
          marginBottom: 20
        }}>Results for {raidResults.count}x {raidResults.stage}</div><div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 15,
          marginBottom: 25
        }}><div className="gacha-summary-stat"><div style={{
              fontSize: "0.6rem",
              color: "#94a3b8"
            }}>CREDITS</div><div style={{
              fontSize: "1.1rem",
              fontWeight: 900,
              color: "#facc15"
            }}>+${raidResults.credits.toLocaleString()}</div></div><div className="gacha-summary-stat"><div style={{
              fontSize: "0.6rem",
              color: "#94a3b8"
            }}>AURA</div><div style={{
              fontSize: "1.1rem",
              fontWeight: 900,
              color: "#a855f7"
            }}>+{raidResults.aura}</div></div><div className="gacha-summary-stat"><div style={{
              fontSize: "0.6rem",
              color: "#94a3b8"
            }}>MATERIALS</div><div style={{
              fontSize: "1.1rem",
              fontWeight: 900,
              color: "#94a3b8"
            }}>+{raidResults.materials}</div></div><div className="gacha-summary-stat"><div style={{
              fontSize: "0.6rem",
              color: "#94a3b8"
            }}>ESSENCE</div><div style={{
              fontSize: "1.1rem",
              fontWeight: 900,
              color: "#f97316"
            }}>+{raidResults.essence}</div></div><div className="gacha-summary-stat"><div style={{
              fontSize: "0.6rem",
              color: "#94a3b8"
            }}>GEMS</div><div style={{
              fontSize: "1.1rem",
              fontWeight: 900,
              color: "#00d2ff"
            }}>+{raidResults.gems}</div></div></div>{raidResults.items.length > 0 && <div style={{
          marginBottom: 20,
          maxHeight: "150px",
          overflowY: "auto"
        }} className="custom-scroll"><div style={{
            fontSize: "0.65rem",
            fontWeight: 900,
            color: "#4ade80",
            marginBottom: 10
          }}>LOOT FOUND:</div><div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 6
          }}>{raidResults.items.map((item, idx) => <div key={idx} style={{
              background: "rgba(255, 255, 255, 0.05)",
              padding: "6px",
              borderRadius: 8,
              fontSize: "0.7rem",
              fontWeight: 800,
              color: "#fff"
            }}><Sparkles size={10} style={{
                marginRight: 5
              }} /> {item}</div>)}</div></div>}<button className="train-btn" onClick={() => setRaidResults(null)}>CONFIRM</button></div></div>}</>;
};
export { PreBattleModal };