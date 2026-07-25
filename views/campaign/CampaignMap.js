import { Fragment, jsxDEV } from "react/jsx-dev-runtime";
import React from "react";
import { Shield, Users, Sparkles, ChevronRight, ArrowRight, Map as MapIcon, Plus } from "lucide-react";
import { BattleUnit, VictoryScreen, getBattleStats, executeCombatSkill, TacticalStanceRow, applyStatusTick, resolveBasicAttack, getCastAnimMs, getLungeMs, getBasicAttackMs, getCooldownGain, getFlurryHitSound, HITSTOP_BUFFER_MS, ProjectileLayer, pushShieldEffect, TurnOrderStrip } from "../../CombatSystem.js";
import { CAMPAIGN_CONTENT, ELEMENTS, LEADER_SKILLS, COSMETICS, AUTO_CLEAR_PWR_MULT } from "../../constants.js";
import { calculateStat, playSound, calculateSubStat, getTierEfficiency, applyLeaderBonus, applyCrewChemistry, getEnemyStatsFromCP, formatPower, applyMitigation, incrementCourierFieldBattles, getDominantSpecialKey, SPECIAL_ARCHETYPE_NAMES, getGaugeGain, getGearPassives, rollEnemyGear, INITIAL_GAUGE_RANGE } from "../../utils.js";
import { isMobile, CampaignIntro } from "../ViewShared.js";
const CampaignMap = (props) => {
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
  return /* @__PURE__ */ jsxDEV("div", { className: "campaign-navigation animate-fadeIn", children: [
    /* @__PURE__ */ jsxDEV("div", { className: "glass-panel aero-glass", style: {
      padding: "15px 25px",
      marginBottom: 20,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      borderLeft: "5px solid var(--primary)"
    }, children: [
      /* @__PURE__ */ jsxDEV("div", { style: {
        display: "flex",
        alignItems: "center",
        gap: 15
      }, children: [
        /* @__PURE__ */ jsxDEV("div", { style: {
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: "rgba(233, 69, 96, 0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--primary)"
        }, children: /* @__PURE__ */ jsxDEV(MapIcon, { size: 24 }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\CampaignMap.jsx",
          lineNumber: 157,
          columnNumber: 12
        }) }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\CampaignMap.jsx",
          lineNumber: 148,
          columnNumber: 10
        }),
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("div", { style: {
            fontSize: "0.65rem",
            fontWeight: 900,
            color: "var(--primary)",
            letterSpacing: 2
          }, children: "THE MAP" }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\CampaignMap.jsx",
            lineNumber: 157,
            columnNumber: 44
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "breadcrumb-nav", style: {
            margin: 0
          }, children: [
            /* @__PURE__ */ jsxDEV("span", { className: "breadcrumb-item", style: {
              opacity: currentChapter || currentArea ? 0.6 : 1,
              color: currentChapter || currentArea ? "" : "#fff"
            }, onClick: () => {
              setCurrentChapter(null);
              setCurrentArea(null);
            }, children: "MUGEN CITY" }, void 0, false, {
              fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\CampaignMap.jsx",
              lineNumber: 164,
              columnNumber: 14
            }),
            currentChapter && /* @__PURE__ */ jsxDEV(Fragment, { children: [
              /* @__PURE__ */ jsxDEV(ChevronRight, { size: 14, opacity: 0.5 }, void 0, false, {
                fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\CampaignMap.jsx",
                lineNumber: 170,
                columnNumber: 54
              }),
              /* @__PURE__ */ jsxDEV("span", { className: `breadcrumb-item ${!currentArea ? "active" : ""}`, style: {
                color: !currentArea ? "#fff" : ""
              }, onClick: () => setCurrentArea(null), children: currentChapter.title.toUpperCase() }, void 0, false, {
                fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\CampaignMap.jsx",
                lineNumber: 170,
                columnNumber: 94
              })
            ] }, void 0, true, {
              fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\CampaignMap.jsx",
              lineNumber: 170,
              columnNumber: 52
            }),
            currentArea && /* @__PURE__ */ jsxDEV(Fragment, { children: [
              /* @__PURE__ */ jsxDEV(ChevronRight, { size: 14, opacity: 0.5 }, void 0, false, {
                fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\CampaignMap.jsx",
                lineNumber: 172,
                columnNumber: 120
              }),
              /* @__PURE__ */ jsxDEV("span", { className: "breadcrumb-item active", style: {
                color: "#fff"
              }, children: currentArea.name.toUpperCase() }, void 0, false, {
                fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\CampaignMap.jsx",
                lineNumber: 172,
                columnNumber: 160
              })
            ] }, void 0, true, {
              fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\CampaignMap.jsx",
              lineNumber: 172,
              columnNumber: 118
            })
          ] }, void 0, true, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\CampaignMap.jsx",
            lineNumber: 162,
            columnNumber: 27
          })
        ] }, void 0, true, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\CampaignMap.jsx",
          lineNumber: 157,
          columnNumber: 39
        })
      ] }, void 0, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\CampaignMap.jsx",
        lineNumber: 144,
        columnNumber: 8
      }),
      /* @__PURE__ */ jsxDEV("div", { style: {
        display: "flex",
        alignItems: "center",
        gap: 14
      }, children: [
        /* @__PURE__ */ jsxDEV("div", { style: {
          textAlign: "right",
          fontSize: "0.65rem",
          color: "#94a3b8",
          fontWeight: 800,
          display: "flex",
          gap: 10
        }, children: [
          /* @__PURE__ */ jsxDEV("span", { style: {
            color: stamina < 20 ? "#ef4444" : "#00d2ff"
          }, children: [
            "\u26A1 ",
            stamina,
            "/",
            maxStamina
          ] }, void 0, true, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\CampaignMap.jsx",
            lineNumber: 185,
            columnNumber: 12
          }),
          /* @__PURE__ */ jsxDEV("span", { style: {
            color: "#facc15"
          }, children: [
            "PWR ",
            formatPower(totalSquadPWR)
          ] }, void 0, true, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\CampaignMap.jsx",
            lineNumber: 187,
            columnNumber: 45
          })
        ] }, void 0, true, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\CampaignMap.jsx",
          lineNumber: 178,
          columnNumber: 10
        }),
        /* @__PURE__ */ jsxDEV("button", { className: "upgrade-btn", style: {
          padding: "6px 12px",
          fontSize: "0.65rem",
          background: "linear-gradient(135deg,#00d2ff,#0891b2)",
          color: "#000"
        }, onClick: jumpToNextStage, children: "\u25B6 CONTINUE" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\CampaignMap.jsx",
          lineNumber: 189,
          columnNumber: 59
        }),
        /* @__PURE__ */ jsxDEV("button", { className: "upgrade-btn", style: {
          padding: "6px 12px",
          fontSize: "0.65rem",
          background: "#facc15",
          color: "#000"
        }, onClick: handleSweepAll, children: "\u26A1 SWEEP ALL" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\CampaignMap.jsx",
          lineNumber: 194,
          columnNumber: 57
        }),
        /* @__PURE__ */ jsxDEV("div", { style: {
          textAlign: "right"
        }, children: [
          /* @__PURE__ */ jsxDEV("div", { style: {
            fontSize: "0.6rem",
            color: "#94a3b8",
            fontWeight: 900,
            letterSpacing: 1
          }, children: "CITY CRED" }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\CampaignMap.jsx",
            lineNumber: 201,
            columnNumber: 12
          }),
          /* @__PURE__ */ jsxDEV("div", { style: {
            fontSize: "1.2rem",
            fontWeight: 900,
            color: "#fff"
          }, children: [
            Math.floor(campaignProgress / 60 * 100),
            "%"
          ] }, void 0, true, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\CampaignMap.jsx",
            lineNumber: 206,
            columnNumber: 29
          })
        ] }, void 0, true, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\CampaignMap.jsx",
          lineNumber: 199,
          columnNumber: 57
        })
      ] }, void 0, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\CampaignMap.jsx",
        lineNumber: 174,
        columnNumber: 79
      })
    ] }, void 0, true, {
      fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\CampaignMap.jsx",
      lineNumber: 137,
      columnNumber: 62
    }),
    !currentChapter && !currentArea && /* @__PURE__ */ jsxDEV("div", { className: "chapters-list", style: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
      gap: 15
    }, children: CAMPAIGN_CONTENT.map((chapter, i) => {
      const prevChapter = CAMPAIGN_CONTENT[i - 1];
      const isLocked = i > 0 && getChapterProgress(prevChapter).completed < getChapterProgress(prevChapter).total;
      const progress = getChapterProgress(chapter);
      const isCompleted = progress.completed === progress.total;
      return /* @__PURE__ */ jsxDEV("div", { className: `chapter-card aero-glass ${isLocked ? "locked" : "neon-hover"}`, style: {
        height: "220px",
        flexDirection: "column",
        justifyContent: "flex-end",
        padding: 25,
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: isLocked ? "none" : "0 10px 30px rgba(0,0,0,0.5)"
      }, onClick: () => !isLocked && (setCurrentChapter(chapter), playSound("ui_select")), children: [
        /* @__PURE__ */ jsxDEV("div", { className: "chapter-bg", style: {
          backgroundImage: `url(${chapter.image})`,
          opacity: isLocked ? 0.1 : 0.3,
          filter: "saturate(1.5) contrast(1.2)"
        } }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\CampaignMap.jsx",
          lineNumber: 226,
          columnNumber: 94
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "chapter-info", style: {
          position: "relative",
          zIndex: 10,
          width: "100%"
        }, children: [
          /* @__PURE__ */ jsxDEV("div", { style: {
            fontSize: "0.65rem",
            fontWeight: 900,
            color: isLocked ? "#94a3b8" : "var(--primary)",
            letterSpacing: 3,
            marginBottom: 5
          }, children: [
            "DATA_NODE_0",
            chapter.id
          ] }, void 0, true, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\CampaignMap.jsx",
            lineNumber: 234,
            columnNumber: 14
          }),
          /* @__PURE__ */ jsxDEV("h3", { style: {
            fontSize: "1.8rem",
            fontFamily: "MugenTitle",
            textShadow: "0 2px 10px #000"
          }, children: chapter.title }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\CampaignMap.jsx",
            lineNumber: 240,
            columnNumber: 45
          }),
          /* @__PURE__ */ jsxDEV("p", { style: {
            fontSize: "0.8rem",
            opacity: 0.7,
            margin: "5px 0 15px 0",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden"
          }, children: chapter.desc }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\CampaignMap.jsx",
            lineNumber: 244,
            columnNumber: 36
          }),
          !isLocked && !isCompleted && /* @__PURE__ */ jsxDEV(Fragment, { children: [
            /* @__PURE__ */ jsxDEV("div", { className: "chapter-progress-bar", children: /* @__PURE__ */ jsxDEV("div", { className: "chapter-progress-fill", style: {
              width: `${progress.completed / progress.total * 100}%`
            } }, void 0, false, {
              fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\CampaignMap.jsx",
              lineNumber: 252,
              columnNumber: 104
            }) }, void 0, false, {
              fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\CampaignMap.jsx",
              lineNumber: 252,
              columnNumber: 66
            }),
            /* @__PURE__ */ jsxDEV("div", { style: {
              fontSize: "0.6rem",
              color: "#94a3b8",
              marginBottom: 8
            }, children: [
              progress.total - progress.completed,
              " stages left \xB7 ~",
              (progress.total - progress.completed) * 20,
              " STA to finish"
            ] }, void 0, true, {
              fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\CampaignMap.jsx",
              lineNumber: 254,
              columnNumber: 28
            })
          ] }, void 0, true, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\CampaignMap.jsx",
            lineNumber: 252,
            columnNumber: 64
          }),
          /* @__PURE__ */ jsxDEV("div", { style: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }, children: [
            /* @__PURE__ */ jsxDEV("div", { style: {
              display: "flex",
              gap: 10
            }, children: isLocked ? /* @__PURE__ */ jsxDEV("div", { style: {
              fontSize: "0.7rem",
              color: "#ef4444",
              fontWeight: 900
            }, children: "[ ACCESS_DENIED ]" }, void 0, false, {
              fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\CampaignMap.jsx",
              lineNumber: 265,
              columnNumber: 30
            }) : /* @__PURE__ */ jsxDEV(Fragment, { children: [
              /* @__PURE__ */ jsxDEV("div", { className: "progress-pill", style: {
                background: "rgba(255,255,255,0.05)",
                borderColor: isCompleted ? "#4ade80" : ""
              }, children: [
                progress.completed,
                "/",
                progress.total,
                " STAGES"
              ] }, void 0, true, {
                fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\CampaignMap.jsx",
                lineNumber: 269,
                columnNumber: 48
              }),
              isCompleted && /* @__PURE__ */ jsxDEV("div", { className: "daily-reward-badge", style: {
                margin: 0
              }, children: "CLEAR" }, void 0, false, {
                fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\CampaignMap.jsx",
                lineNumber: 272,
                columnNumber: 88
              })
            ] }, void 0, true, {
              fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\CampaignMap.jsx",
              lineNumber: 269,
              columnNumber: 46
            }) }, void 0, false, {
              fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\CampaignMap.jsx",
              lineNumber: 262,
              columnNumber: 16
            }),
            !isLocked && /* @__PURE__ */ jsxDEV(ChevronRight, { size: 20, color: "var(--primary)" }, void 0, false, {
              fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\CampaignMap.jsx",
              lineNumber: 274,
              columnNumber: 58
            })
          ] }, void 0, true, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\CampaignMap.jsx",
            lineNumber: 258,
            columnNumber: 139
          })
        ] }, void 0, true, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\CampaignMap.jsx",
          lineNumber: 230,
          columnNumber: 16
        })
      ] }, chapter.id, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\CampaignMap.jsx",
        lineNumber: 219,
        columnNumber: 16
      });
    }) }, void 0, false, {
      fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\CampaignMap.jsx",
      lineNumber: 210,
      columnNumber: 116
    }),
    currentChapter && !currentArea && /* @__PURE__ */ jsxDEV("div", { className: "tech-areas-list", style: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
      gap: 15
    }, children: currentChapter.areas.map((area, i) => {
      const isLocked = campaignProgress < area.stages[0].id;
      const progress = getAreaProgress(area);
      const isDone = progress.completed === progress.total;
      return /* @__PURE__ */ jsxDEV("div", { className: `tech-area-card aero-glass ${isLocked ? "locked" : "neon-hover"}`, style: {
        flexDirection: "column",
        alignItems: "flex-start",
        padding: 25,
        height: "180px",
        justifyContent: "space-between",
        border: `1px solid ${isDone ? "#4ade8044" : "rgba(255,255,255,0.1)"}`
      }, onClick: () => !isLocked && (setCurrentArea(area), playSound("ui_select")), children: [
        /* @__PURE__ */ jsxDEV("div", { className: "chapter-bg", style: {
          backgroundImage: `url(nightlife_bokeh.png)`,
          opacity: 0.05
        } }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\CampaignMap.jsx",
          lineNumber: 290,
          columnNumber: 88
        }),
        /* @__PURE__ */ jsxDEV("div", { style: {
          width: "100%"
        }, children: [
          /* @__PURE__ */ jsxDEV("div", { style: {
            fontSize: "0.6rem",
            fontWeight: 900,
            color: isLocked ? "#94a3b8" : "#00d2ff",
            letterSpacing: 2,
            marginBottom: 5
          }, children: [
            "SECTOR_ID: ",
            area.id.toString().padStart(2, "0")
          ] }, void 0, true, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\CampaignMap.jsx",
            lineNumber: 295,
            columnNumber: 14
          }),
          /* @__PURE__ */ jsxDEV("h3", { style: {
            margin: "0 0 10px 0",
            fontSize: "1.4rem",
            fontFamily: "Rajdhani",
            fontWeight: 900
          }, children: area.name.toUpperCase() }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\CampaignMap.jsx",
            lineNumber: 301,
            columnNumber: 70
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "tech-progress-bar", style: {
            width: "100%",
            height: 4,
            background: "rgba(255,255,255,0.05)"
          }, children: /* @__PURE__ */ jsxDEV("div", { className: "tech-progress-fill", style: {
            width: `${progress.completed / progress.total * 100}%`,
            background: isDone ? "#4ade80" : "#00d2ff",
            boxShadow: `0 0 10px ${isDone ? "#4ade80" : "#00d2ff"}`
          } }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\CampaignMap.jsx",
            lineNumber: 310,
            columnNumber: 16
          }) }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\CampaignMap.jsx",
            lineNumber: 306,
            columnNumber: 46
          })
        ] }, void 0, true, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\CampaignMap.jsx",
          lineNumber: 293,
          columnNumber: 16
        }),
        /* @__PURE__ */ jsxDEV("div", { style: {
          display: "flex",
          justifyContent: "space-between",
          width: "100%",
          alignItems: "center"
        }, children: [
          /* @__PURE__ */ jsxDEV("div", { style: {
            fontSize: "0.8rem",
            fontWeight: 900,
            color: isDone ? "#4ade80" : "#fff"
          }, children: [
            progress.completed,
            " / ",
            progress.total,
            " COMPLETION"
          ] }, void 0, true, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\CampaignMap.jsx",
            lineNumber: 319,
            columnNumber: 14
          }),
          !isLocked && /* @__PURE__ */ jsxDEV("div", { style: {
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.05)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }, children: /* @__PURE__ */ jsxDEV(ArrowRight, { size: 16, color: isDone ? "#4ade80" : "#fff" }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\CampaignMap.jsx",
            lineNumber: 331,
            columnNumber: 16
          }) }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\CampaignMap.jsx",
            lineNumber: 323,
            columnNumber: 86
          })
        ] }, void 0, true, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\CampaignMap.jsx",
          lineNumber: 314,
          columnNumber: 32
        })
      ] }, area.id, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\CampaignMap.jsx",
        lineNumber: 283,
        columnNumber: 16
      });
    }) }, void 0, false, {
      fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\CampaignMap.jsx",
      lineNumber: 275,
      columnNumber: 52
    }),
    currentArea && (() => {
      const sweepableInArea = currentArea.stages.filter((s) => campaignProgress > s.id && campaignRanks[s.id]);
      return sweepableInArea.length > 0 && /* @__PURE__ */ jsxDEV("div", { style: {
        display: "flex",
        justifyContent: "flex-end",
        marginBottom: 8,
        gap: 8
      }, children: [
        /* @__PURE__ */ jsxDEV("span", { style: {
          fontSize: "0.65rem",
          color: "var(--text-muted)",
          alignSelf: "center"
        }, children: `${sweepableInArea.length} stages raidable` }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\CampaignMap.jsx",
          lineNumber: 339,
          columnNumber: 10
        }),
        /* @__PURE__ */ jsxDEV("button", { className: "raid-btn main", style: {
          background: "#facc15",
          color: "#000",
          padding: "6px 14px"
        }, onClick: (e) => {
          e.stopPropagation();
          sweepableInArea.forEach((s) => handleRaid(s, 10));
          createFloatingText(`SWEPT \xD7${sweepableInArea.length * 10}!`, false, "#facc15");
        }, children: "\u26A1 SWEEP AREA \xD710" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\CampaignMap.jsx",
          lineNumber: 343,
          columnNumber: 64
        })
      ] }, void 0, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\CampaignMap.jsx",
        lineNumber: 334,
        columnNumber: 44
      });
    })(),
    currentArea && currentArea.stages.length > 4 && /* @__PURE__ */ jsxDEV("div", { style: {
      display: "flex",
      gap: 6,
      flexWrap: "wrap",
      marginBottom: 10
    }, children: [
      /* @__PURE__ */ jsxDEV("button", { className: `el-tag ${stageElementFilter === "All" ? "active" : ""}`, style: {
        cursor: "pointer",
        border: stageElementFilter === "All" ? "1px solid #fff" : "1px solid rgba(255,255,255,0.15)",
        background: stageElementFilter === "All" ? "rgba(255,255,255,0.15)" : "transparent"
      }, onClick: () => setStageElementFilter("All"), children: "ALL" }, void 0, false, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\CampaignMap.jsx",
        lineNumber: 357,
        columnNumber: 8
      }),
      Array.from(new Set(currentArea.stages.map((s) => s.element))).map((el) => /* @__PURE__ */ jsxDEV("button", { className: "el-tag", style: {
        cursor: "pointer",
        background: (ELEMENTS[el]?.color || "#666") + (stageElementFilter === el ? "44" : "11"),
        border: `1px solid ${ELEMENTS[el]?.color || "#666"}`
      }, onClick: () => setStageElementFilter(el), children: el }, el, false, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\CampaignMap.jsx",
        lineNumber: 361,
        columnNumber: 138
      }))
    ] }, void 0, true, {
      fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\CampaignMap.jsx",
      lineNumber: 352,
      columnNumber: 59
    }),
    currentArea && /* @__PURE__ */ jsxDEV("div", { className: `tech-stages-list ${isHardMode ? "hard-mode" : ""}`, children: currentArea.stages.filter((s) => stageElementFilter === "All" || s.element === stageElementFilter).map((stage) => {
      const isLocked = campaignProgress < stage.id;
      const isCompleted = campaignProgress > stage.id;
      const isNext = !isLocked && !isCompleted;
      const bestRank = campaignRanks[stage.id];
      const canRaid = !!bestRank;
      const raidLabel = bestRank ? `${(RAID_RANK_MULTS[bestRank] || 0.5).toFixed(2)}\xD7` : null;
      const displayCP = stage.cpReq * (isHardMode ? 2 : 1);
      const rewardPreview = Math.floor(stage.rewards?.credits || stage.id * 600);
      return /* @__PURE__ */ jsxDEV("div", { className: `tech-stage-item ${isLocked ? "locked" : ""} ${isCompleted ? "completed" : ""} ${isHardMode ? "nightmare" : ""} ${isNext ? "next-up" : ""} ${justClearedStageId === stage.id ? "just-cleared" : ""}`, style: isNext ? {
        borderColor: ELEMENTS[stage.element].color,
        boxShadow: `0 0 14px ${ELEMENTS[stage.element].color}55`
      } : void 0, onClick: () => {
        if (!isLocked) {
          setPendingStage(stage);
          setShowSquadBuilder(true);
        } else {
          createFloatingText(`Locked \u2014 clear stage ${stage.id - 1} first`, true);
        }
      }, children: [
        /* @__PURE__ */ jsxDEV("div", { className: "stage-id-hex", children: /* @__PURE__ */ jsxDEV("span", { style: {
          fontSize: "0.8rem",
          fontWeight: 900,
          color: "#fff"
        }, children: stage.id }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\CampaignMap.jsx",
          lineNumber: 384,
          columnNumber: 42
        }) }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\CampaignMap.jsx",
          lineNumber: 384,
          columnNumber: 12
        }),
        /* @__PURE__ */ jsxDEV("div", { style: {
          flex: 1,
          padding: "0 15px"
        }, children: [
          /* @__PURE__ */ jsxDEV("h4", { style: {
            margin: 0,
            fontSize: "1rem",
            color: "#fff"
          }, children: stage.name }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\CampaignMap.jsx",
            lineNumber: 391,
            columnNumber: 14
          }),
          /* @__PURE__ */ jsxDEV("div", { style: {
            display: "flex",
            gap: 10,
            marginTop: 4,
            alignItems: "center"
          }, children: [
            isNext && /* @__PURE__ */ jsxDEV("div", { className: "rank-sticker", style: {
              background: ELEMENTS[stage.element].color,
              color: "#000"
            }, children: "NEXT" }, void 0, false, {
              fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\CampaignMap.jsx",
              lineNumber: 400,
              columnNumber: 27
            }),
            bestRank && /* @__PURE__ */ jsxDEV("div", { className: `rank-sticker ${bestRank === "SSS" ? "gold" : ""}`, children: bestRank }, void 0, false, {
              fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\CampaignMap.jsx",
              lineNumber: 403,
              columnNumber: 42
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "cp-pill", style: {
              color: totalSquadPWR < displayCP ? "#ef4444" : "#4ade80"
            }, children: [
              "PWR_REQ: ",
              formatPower(displayCP)
            ] }, void 0, true, {
              fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\CampaignMap.jsx",
              lineNumber: 403,
              columnNumber: 127
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "el-tag", style: {
              background: ELEMENTS[stage.element].color + "22",
              border: `1px solid ${ELEMENTS[stage.element].color}`
            }, children: stage.element }, void 0, false, {
              fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\CampaignMap.jsx",
              lineNumber: 405,
              columnNumber: 57
            }),
            !isLocked && /* @__PURE__ */ jsxDEV("div", { style: {
              fontSize: "0.6rem",
              color: "#94a3b8",
              fontWeight: 800
            }, children: [
              "\u{1F4B0} ",
              rewardPreview.toLocaleString()
            ] }, void 0, true, {
              fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\CampaignMap.jsx",
              lineNumber: 408,
              columnNumber: 53
            })
          ] }, void 0, true, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\CampaignMap.jsx",
            lineNumber: 395,
            columnNumber: 33
          })
        ] }, void 0, true, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\CampaignMap.jsx",
          lineNumber: 388,
          columnNumber: 39
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "stage-actions", children: isCompleted ? canRaid ? /* @__PURE__ */ jsxDEV("div", { style: {
          display: "flex",
          gap: 4,
          flexWrap: "wrap",
          justifyContent: "flex-end"
        }, children: [
          raidLabel && /* @__PURE__ */ jsxDEV("span", { style: {
            fontSize: "0.6rem",
            color: "#facc15",
            fontWeight: 900,
            alignSelf: "center",
            marginRight: 2
          }, children: raidLabel }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\CampaignMap.jsx",
            lineNumber: 417,
            columnNumber: 30
          }),
          /* @__PURE__ */ jsxDEV("button", { className: "raid-btn", onClick: (e) => {
            e.stopPropagation();
            handleRaid(stage, 1);
          }, children: "\xD71" }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\CampaignMap.jsx",
            lineNumber: 423,
            columnNumber: 37
          }),
          /* @__PURE__ */ jsxDEV("button", { className: "raid-btn", onClick: (e) => {
            e.stopPropagation();
            handleRaid(stage, 10);
          }, children: "\xD710" }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\CampaignMap.jsx",
            lineNumber: 426,
            columnNumber: 29
          }),
          /* @__PURE__ */ jsxDEV("button", { className: "raid-btn main", onClick: (e) => {
            e.stopPropagation();
            handleRaid(stage, 50);
          }, children: "\xD750" }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\CampaignMap.jsx",
            lineNumber: 429,
            columnNumber: 30
          }),
          /* @__PURE__ */ jsxDEV("button", { className: "raid-btn main", style: {
            background: "#facc15",
            color: "#000"
          }, onClick: (e) => {
            e.stopPropagation();
            handleRaid(stage, 100);
          }, children: "\xD7100" }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\CampaignMap.jsx",
            lineNumber: 432,
            columnNumber: 30
          })
        ] }, void 0, true, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\CampaignMap.jsx",
          lineNumber: 412,
          columnNumber: 128
        }) : /* @__PURE__ */ jsxDEV("span", { className: "clear-label", children: "SECURED" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\CampaignMap.jsx",
          lineNumber: 438,
          columnNumber: 40
        }) : /* @__PURE__ */ jsxDEV("div", { className: "start-arrow", children: /* @__PURE__ */ jsxDEV(ChevronRight, { size: 18 }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\CampaignMap.jsx",
          lineNumber: 438,
          columnNumber: 116
        }) }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\CampaignMap.jsx",
          lineNumber: 438,
          columnNumber: 87
        }) }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\CampaignMap.jsx",
          lineNumber: 412,
          columnNumber: 72
        })
      ] }, stage.id, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\CampaignMap.jsx",
        lineNumber: 374,
        columnNumber: 16
      });
    }) }, void 0, false, {
      fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\CampaignMap.jsx",
      lineNumber: 365,
      columnNumber: 90
    })
  ] }, void 0, true, {
    fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\CampaignMap.jsx",
    lineNumber: 137,
    columnNumber: 10
  });
};
export {
  CampaignMap
};
