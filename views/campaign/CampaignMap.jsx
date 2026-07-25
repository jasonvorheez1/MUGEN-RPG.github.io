import React from "react";
import { Shield, Users, Sparkles, ChevronRight, ArrowRight, Map as MapIcon, Plus } from "lucide-react";
import { BattleUnit, VictoryScreen, getBattleStats, executeCombatSkill, TacticalStanceRow, applyStatusTick, resolveBasicAttack, getCastAnimMs, getLungeMs, getBasicAttackMs, getCooldownGain, getFlurryHitSound, HITSTOP_BUFFER_MS, ProjectileLayer, pushShieldEffect, TurnOrderStrip } from "../../CombatSystem.js";
import { CAMPAIGN_CONTENT, ELEMENTS, LEADER_SKILLS, COSMETICS, AUTO_CLEAR_PWR_MULT } from "../../constants.js";
import { calculateStat, playSound, calculateSubStat, getTierEfficiency, applyLeaderBonus, applyCrewChemistry, getEnemyStatsFromCP, formatPower, applyMitigation, incrementCourierFieldBattles, getDominantSpecialKey, SPECIAL_ARCHETYPE_NAMES, getGaugeGain, getGearPassives, rollEnemyGear, INITIAL_GAUGE_RANGE } from "../../utils.js";
import { isMobile, CampaignIntro } from "../ViewShared.js";
const CampaignMap = props => {
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
  return <div className="campaign-navigation animate-fadeIn"><div className="glass-panel aero-glass" style={{
      padding: "15px 25px",
      marginBottom: 20,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      borderLeft: "5px solid var(--primary)"
    }}><div style={{
        display: "flex",
        alignItems: "center",
        gap: 15
      }}><div style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: "rgba(233, 69, 96, 0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--primary)"
        }}><MapIcon size={24} /></div><div><div style={{
            fontSize: "0.65rem",
            fontWeight: 900,
            color: "var(--primary)",
            letterSpacing: 2
          }}>THE MAP</div><div className="breadcrumb-nav" style={{
            margin: 0
          }}><span className="breadcrumb-item" style={{
              opacity: currentChapter || currentArea ? 0.6 : 1,
              color: currentChapter || currentArea ? "" : "#fff"
            }} onClick={() => {
              setCurrentChapter(null);
              setCurrentArea(null);
            }}>MUGEN CITY</span>{currentChapter && <><ChevronRight size={14} opacity={0.5} /><span className={`breadcrumb-item ${!currentArea ? "active" : ""}`} style={{
                color: !currentArea ? "#fff" : ""
              }} onClick={() => setCurrentArea(null)}>{currentChapter.title.toUpperCase()}</span></>}{currentArea && <><ChevronRight size={14} opacity={0.5} /><span className="breadcrumb-item active" style={{
                color: "#fff"
              }}>{currentArea.name.toUpperCase()}</span></>}</div></div></div><div style={{
        display: "flex",
        alignItems: "center",
        gap: 14
      }}><div style={{
          textAlign: "right",
          fontSize: "0.65rem",
          color: "#94a3b8",
          fontWeight: 800,
          display: "flex",
          gap: 10
        }}><span style={{
            color: stamina < 20 ? "#ef4444" : "#00d2ff"
          }}>⚡ {stamina}/{maxStamina}</span><span style={{
            color: "#facc15"
          }}>PWR {formatPower(totalSquadPWR)}</span></div><button className="upgrade-btn" style={{
          padding: "6px 12px",
          fontSize: "0.65rem",
          background: "linear-gradient(135deg,#00d2ff,#0891b2)",
          color: "#000"
        }} onClick={jumpToNextStage}>▶ CONTINUE</button><button className="upgrade-btn" style={{
          padding: "6px 12px",
          fontSize: "0.65rem",
          background: "#facc15",
          color: "#000"
        }} onClick={handleSweepAll}>⚡ SWEEP ALL</button><div style={{
          textAlign: "right"
        }}><div style={{
            fontSize: "0.6rem",
            color: "#94a3b8",
            fontWeight: 900,
            letterSpacing: 1
          }}>CITY CRED</div><div style={{
            fontSize: "1.2rem",
            fontWeight: 900,
            color: "#fff"
          }}>{Math.floor(campaignProgress / 60 * 100)}%</div></div></div></div>{!currentChapter && !currentArea && <div className="chapters-list" style={{
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
      gap: 15
    }}>{CAMPAIGN_CONTENT.map((chapter, i) => {
        const prevChapter = CAMPAIGN_CONTENT[i - 1];
        const isLocked = i > 0 && getChapterProgress(prevChapter).completed < getChapterProgress(prevChapter).total;
        const progress = getChapterProgress(chapter);
        const isCompleted = progress.completed === progress.total;
        return <div key={chapter.id} className={`chapter-card aero-glass ${isLocked ? "locked" : "neon-hover"}`} style={{
          height: "220px",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: 25,
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: isLocked ? "none" : "0 10px 30px rgba(0,0,0,0.5)"
        }} onClick={() => !isLocked && (setCurrentChapter(chapter), playSound("ui_select"))}><div className="chapter-bg" style={{
            backgroundImage: `url(${chapter.image})`,
            opacity: isLocked ? 0.1 : 0.3,
            filter: "saturate(1.5) contrast(1.2)"
          }} /><div className="chapter-info" style={{
            position: "relative",
            zIndex: 10,
            width: "100%"
          }}><div style={{
              fontSize: "0.65rem",
              fontWeight: 900,
              color: isLocked ? "#94a3b8" : "var(--primary)",
              letterSpacing: 3,
              marginBottom: 5
            }}>DATA_NODE_0{chapter.id}</div><h3 style={{
              fontSize: "1.8rem",
              fontFamily: "MugenTitle",
              textShadow: "0 2px 10px #000"
            }}>{chapter.title}</h3><p style={{
              fontSize: "0.8rem",
              opacity: 0.7,
              margin: "5px 0 15px 0",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden"
            }}>{chapter.desc}</p>{!isLocked && !isCompleted && <><div className="chapter-progress-bar"><div className="chapter-progress-fill" style={{
                  width: `${progress.completed / progress.total * 100}%`
                }} /></div><div style={{
                fontSize: "0.6rem",
                color: "#94a3b8",
                marginBottom: 8
              }}>{progress.total - progress.completed} stages left · ~{(progress.total - progress.completed) * 20} STA to finish</div></>}<div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}><div style={{
                display: "flex",
                gap: 10
              }}>{isLocked ? <div style={{
                  fontSize: "0.7rem",
                  color: "#ef4444",
                  fontWeight: 900
                }}>[ ACCESS_DENIED ]</div> : <><div className="progress-pill" style={{
                    background: "rgba(255,255,255,0.05)",
                    borderColor: isCompleted ? "#4ade80" : ""
                  }}>{progress.completed}/{progress.total} STAGES</div>{isCompleted && <div className="daily-reward-badge" style={{
                    margin: 0
                  }}>CLEAR</div>}</>}</div>{!isLocked && <ChevronRight size={20} color="var(--primary)" />}</div></div></div>;
      })}</div>}{currentChapter && !currentArea && <div className="tech-areas-list" style={{
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
      gap: 15
    }}>{currentChapter.areas.map((area, i) => {
        const isLocked = campaignProgress < area.stages[0].id;
        const progress = getAreaProgress(area);
        const isDone = progress.completed === progress.total;
        return <div key={area.id} className={`tech-area-card aero-glass ${isLocked ? "locked" : "neon-hover"}`} style={{
          flexDirection: "column",
          alignItems: "flex-start",
          padding: 25,
          height: "180px",
          justifyContent: "space-between",
          border: `1px solid ${isDone ? "#4ade8044" : "rgba(255,255,255,0.1)"}`
        }} onClick={() => !isLocked && (setCurrentArea(area), playSound("ui_select"))}><div className="chapter-bg" style={{
            backgroundImage: `url(nightlife_bokeh.png)`,
            opacity: 0.05
          }} /><div style={{
            width: "100%"
          }}><div style={{
              fontSize: "0.6rem",
              fontWeight: 900,
              color: isLocked ? "#94a3b8" : "#00d2ff",
              letterSpacing: 2,
              marginBottom: 5
            }}>SECTOR_ID: {area.id.toString().padStart(2, "0")}</div><h3 style={{
              margin: "0 0 10px 0",
              fontSize: "1.4rem",
              fontFamily: "Rajdhani",
              fontWeight: 900
            }}>{area.name.toUpperCase()}</h3><div className="tech-progress-bar" style={{
              width: "100%",
              height: 4,
              background: "rgba(255,255,255,0.05)"
            }}><div className="tech-progress-fill" style={{
                width: `${progress.completed / progress.total * 100}%`,
                background: isDone ? "#4ade80" : "#00d2ff",
                boxShadow: `0 0 10px ${isDone ? "#4ade80" : "#00d2ff"}`
              }} /></div></div><div style={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
            alignItems: "center"
          }}><div style={{
              fontSize: "0.8rem",
              fontWeight: 900,
              color: isDone ? "#4ade80" : "#fff"
            }}>{progress.completed} / {progress.total} COMPLETION</div>{!isLocked && <div style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.05)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}><ArrowRight size={16} color={isDone ? "#4ade80" : "#fff"} /></div>}</div></div>;
      })}</div>}{currentArea && (() => {
      const sweepableInArea = currentArea.stages.filter(s => campaignProgress > s.id && campaignRanks[s.id]);
      return sweepableInArea.length > 0 && <div style={{
        display: "flex",
        justifyContent: "flex-end",
        marginBottom: 8,
        gap: 8
      }}><span style={{
          fontSize: "0.65rem",
          color: "var(--text-muted)",
          alignSelf: "center"
        }}>{`${sweepableInArea.length} stages raidable`}</span><button className="raid-btn main" style={{
          background: "#facc15",
          color: "#000",
          padding: "6px 14px"
        }} onClick={e => {
          e.stopPropagation();
          sweepableInArea.forEach(s => handleRaid(s, 10));
          createFloatingText(`SWEPT \xD7${sweepableInArea.length * 10}!`, false, "#facc15");
        }}>⚡ SWEEP AREA ×10</button></div>;
    })()}{currentArea && currentArea.stages.length > 4 && <div style={{
      display: "flex",
      gap: 6,
      flexWrap: "wrap",
      marginBottom: 10
    }}><button className={`el-tag ${stageElementFilter === "All" ? "active" : ""}`} style={{
        cursor: "pointer",
        border: stageElementFilter === "All" ? "1px solid #fff" : "1px solid rgba(255,255,255,0.15)",
        background: stageElementFilter === "All" ? "rgba(255,255,255,0.15)" : "transparent"
      }} onClick={() => setStageElementFilter("All")}>ALL</button>{Array.from(new Set(currentArea.stages.map(s => s.element))).map(el => <button key={el} className="el-tag" style={{
        cursor: "pointer",
        background: (ELEMENTS[el]?.color || "#666") + (stageElementFilter === el ? "44" : "11"),
        border: `1px solid ${ELEMENTS[el]?.color || "#666"}`
      }} onClick={() => setStageElementFilter(el)}>{el}</button>)}</div>}{currentArea && <div className={`tech-stages-list ${isHardMode ? "hard-mode" : ""}`}>{currentArea.stages.filter(s => stageElementFilter === "All" || s.element === stageElementFilter).map(stage => {
        const isLocked = campaignProgress < stage.id;
        const isCompleted = campaignProgress > stage.id;
        const isNext = !isLocked && !isCompleted;
        const bestRank = campaignRanks[stage.id];
        const canRaid = !!bestRank;
        const raidLabel = bestRank ? `${(RAID_RANK_MULTS[bestRank] || 0.5).toFixed(2)}\xD7` : null;
        const displayCP = stage.cpReq * (isHardMode ? 2 : 1);
        const rewardPreview = Math.floor(stage.rewards?.credits || stage.id * 600);
        return <div key={stage.id} className={`tech-stage-item ${isLocked ? "locked" : ""} ${isCompleted ? "completed" : ""} ${isHardMode ? "nightmare" : ""} ${isNext ? "next-up" : ""} ${justClearedStageId === stage.id ? "just-cleared" : ""}`} style={isNext ? {
          borderColor: ELEMENTS[stage.element].color,
          boxShadow: `0 0 14px ${ELEMENTS[stage.element].color}55`
        } : void 0} onClick={() => {
          if (!isLocked) {
            setPendingStage(stage);
            setShowSquadBuilder(true);
          } else {
            createFloatingText(`Locked \u2014 clear stage ${stage.id - 1} first`, true);
          }
        }}><div className="stage-id-hex"><span style={{
              fontSize: "0.8rem",
              fontWeight: 900,
              color: "#fff"
            }}>{stage.id}</span></div><div style={{
            flex: 1,
            padding: "0 15px"
          }}><h4 style={{
              margin: 0,
              fontSize: "1rem",
              color: "#fff"
            }}>{stage.name}</h4><div style={{
              display: "flex",
              gap: 10,
              marginTop: 4,
              alignItems: "center"
            }}>{isNext && <div className="rank-sticker" style={{
                background: ELEMENTS[stage.element].color,
                color: "#000"
              }}>NEXT</div>}{bestRank && <div className={`rank-sticker ${bestRank === "SSS" ? "gold" : ""}`}>{bestRank}</div>}<div className="cp-pill" style={{
                color: totalSquadPWR < displayCP ? "#ef4444" : "#4ade80"
              }}>PWR_REQ: {formatPower(displayCP)}</div><div className="el-tag" style={{
                background: ELEMENTS[stage.element].color + "22",
                border: `1px solid ${ELEMENTS[stage.element].color}`
              }}>{stage.element}</div>{!isLocked && <div style={{
                fontSize: "0.6rem",
                color: "#94a3b8",
                fontWeight: 800
              }}>💰 {rewardPreview.toLocaleString()}</div>}</div></div><div className="stage-actions">{isCompleted ? canRaid ? <div style={{
              display: "flex",
              gap: 4,
              flexWrap: "wrap",
              justifyContent: "flex-end"
            }}>{raidLabel && <span style={{
                fontSize: "0.6rem",
                color: "#facc15",
                fontWeight: 900,
                alignSelf: "center",
                marginRight: 2
              }}>{raidLabel}</span>}<button className="raid-btn" onClick={e => {
                e.stopPropagation();
                handleRaid(stage, 1);
              }}>×1</button><button className="raid-btn" onClick={e => {
                e.stopPropagation();
                handleRaid(stage, 10);
              }}>×10</button><button className="raid-btn main" onClick={e => {
                e.stopPropagation();
                handleRaid(stage, 50);
              }}>×50</button><button className="raid-btn main" style={{
                background: "#facc15",
                color: "#000"
              }} onClick={e => {
                e.stopPropagation();
                handleRaid(stage, 100);
              }}>×100</button></div> : <span className="clear-label">SECURED</span> : <div className="start-arrow"><ChevronRight size={18} /></div>}</div></div>;
      })}</div>}</div>;
};
export { CampaignMap };