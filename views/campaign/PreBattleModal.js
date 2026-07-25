import { Fragment, jsxDEV } from "react/jsx-dev-runtime";
import React from "react";
import { Shield, Users, Sparkles, ChevronRight, ArrowRight, Map as MapIcon, Plus } from "lucide-react";
import { BattleUnit, VictoryScreen, getBattleStats, executeCombatSkill, TacticalStanceRow, applyStatusTick, resolveBasicAttack, getCastAnimMs, getLungeMs, getBasicAttackMs, getCooldownGain, getFlurryHitSound, HITSTOP_BUFFER_MS, ProjectileLayer, pushShieldEffect, TurnOrderStrip } from "../../CombatSystem.js";
import { CAMPAIGN_CONTENT, ELEMENTS, LEADER_SKILLS, COSMETICS, AUTO_CLEAR_PWR_MULT } from "../../constants.js";
import { calculateStat, playSound, calculateSubStat, getTierEfficiency, applyLeaderBonus, applyCrewChemistry, getEnemyStatsFromCP, formatPower, applyMitigation, incrementCourierFieldBattles, getDominantSpecialKey, SPECIAL_ARCHETYPE_NAMES, getGaugeGain, getGearPassives, rollEnemyGear, INITIAL_GAUGE_RANGE } from "../../utils.js";
import { isMobile, CampaignIntro } from "../ViewShared.js";
const PreBattleModal = (props) => {
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
  return /* @__PURE__ */ jsxDEV(Fragment, { children: [
    /* @__PURE__ */ jsxDEV("div", { className: "hero-select-modal animate-fadeIn", style: {
      display: "flex",
      flexDirection: "column",
      backgroundImage: `linear-gradient(180deg, rgba(5,5,10,0.55), rgba(5,5,10,0.92) 60%, rgba(5,5,10,0.97)), url(${pendingStage.bg || "background_battle.png"})`,
      backgroundSize: "cover",
      backgroundPosition: "center"
    }, children: [
      /* @__PURE__ */ jsxDEV("div", { className: "modal-header", style: {
        background: "rgba(10,10,16,0.55)",
        borderRadius: 16,
        padding: "10px 16px",
        backdropFilter: "blur(6px)"
      }, children: [
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("h2", { style: {
            margin: 0,
            color: ELEMENTS[pendingStage.element]?.color || "var(--primary)"
          }, children: pendingStage.name }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\PreBattleModal.jsx",
            lineNumber: 148,
            columnNumber: 15
          }),
          /* @__PURE__ */ jsxDEV("div", { style: {
            fontSize: "0.8rem",
            opacity: 0.7,
            maxWidth: "400px",
            marginTop: 4
          }, children: [
            "Target Enemy: ",
            pendingStage.enemy,
            " \u2022 Element: ",
            pendingStage.element
          ] }, void 0, true, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\PreBattleModal.jsx",
            lineNumber: 151,
            columnNumber: 38
          })
        ] }, void 0, true, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\PreBattleModal.jsx",
          lineNumber: 148,
          columnNumber: 10
        }),
        /* @__PURE__ */ jsxDEV("button", { className: "upgrade-btn", style: {
          padding: "10px 20px"
        }, onClick: () => setPendingStage(null), children: "BACK" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\PreBattleModal.jsx",
          lineNumber: 156,
          columnNumber: 94
        })
      ] }, void 0, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\PreBattleModal.jsx",
        lineNumber: 143,
        columnNumber: 8
      }),
      /* @__PURE__ */ jsxDEV("div", { style: {
        background: "rgba(0,0,0,0.3)",
        padding: 15,
        borderRadius: 16,
        marginBottom: 20
      }, children: [
        /* @__PURE__ */ jsxDEV("div", { style: {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12
        }, children: [
          /* @__PURE__ */ jsxDEV("h3", { style: {
            margin: 0,
            fontSize: "0.9rem",
            fontWeight: 900
          }, children: [
            "MISSION SQUAD (",
            squadIds.length,
            "/4)"
          ] }, void 0, true, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\PreBattleModal.jsx",
            lineNumber: 168,
            columnNumber: 12
          }),
          /* @__PURE__ */ jsxDEV("div", { style: {
            display: "flex",
            gap: 8
          }, children: [
            /* @__PURE__ */ jsxDEV("button", { className: "upgrade-btn", style: {
              fontSize: "0.7rem"
            }, onClick: () => setShowSquadBuilder({
              element: pendingStage.requiredElement,
              franchise: pendingStage.requiredFranchise
            }), children: "EDIT SQUAD" }, void 0, false, {
              fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\PreBattleModal.jsx",
              lineNumber: 175,
              columnNumber: 14
            }),
            /* @__PURE__ */ jsxDEV("button", { className: "upgrade-btn", style: {
              fontSize: "0.7rem"
            }, onClick: () => autoFillSquad(pendingStage), children: "AUTO-FILL" }, void 0, false, {
              fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\PreBattleModal.jsx",
              lineNumber: 180,
              columnNumber: 36
            }),
            squadIds.length > 0 && /* @__PURE__ */ jsxDEV("button", { className: "upgrade-btn", style: {
              fontSize: "0.7rem",
              opacity: 0.7
            }, onClick: clearSquad, children: "CLEAR" }, void 0, false, {
              fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\PreBattleModal.jsx",
              lineNumber: 182,
              columnNumber: 102
            }),
            /* @__PURE__ */ jsxDEV("button", { className: "train-btn", style: {
              width: "auto",
              padding: "8px 24px"
            }, disabled: squadIds.length === 0, onClick: () => startStage(pendingStage), children: "COMMENCE MISSION" }, void 0, false, {
              fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\PreBattleModal.jsx",
              lineNumber: 185,
              columnNumber: 52
            }),
            canAutoClearStage(pendingStage) ? /* @__PURE__ */ jsxDEV("button", { className: "train-btn", style: {
              width: "auto",
              padding: "8px 24px",
              background: "linear-gradient(135deg,#00d2ff,#0891b2)",
              color: "#000"
            }, onClick: () => autoClearStage(pendingStage), children: "\u26A1 AUTO CLEAR" }, void 0, false, {
              fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\PreBattleModal.jsx",
              lineNumber: 188,
              columnNumber: 150
            }) : null
          ] }, void 0, true, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\PreBattleModal.jsx",
            lineNumber: 172,
            columnNumber: 54
          })
        ] }, void 0, true, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\PreBattleModal.jsx",
          lineNumber: 163,
          columnNumber: 10
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "squad-slots-row", style: {
          gridTemplateColumns: "repeat(4, 1fr)"
        }, children: Array.from({
          length: 4
        }).map((_, i) => {
          const heroId = squadIds[i];
          const c = heroId ? characters.find((h) => String(h.export_id) === String(heroId)) : null;
          return /* @__PURE__ */ jsxDEV("div", { className: `squad-member-slot ${c ? "active" : "empty"}`, onClick: () => setShowSquadBuilder(true), children: c ? /* @__PURE__ */ jsxDEV("img", { src: c.imageUrl }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\PreBattleModal.jsx",
            lineNumber: 200,
            columnNumber: 138
          }) : /* @__PURE__ */ jsxDEV(Plus, { size: 20, opacity: 0.2 }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\PreBattleModal.jsx",
            lineNumber: 200,
            columnNumber: 165
          }) }, i, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\PreBattleModal.jsx",
            lineNumber: 200,
            columnNumber: 20
          });
        }) }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\PreBattleModal.jsx",
          lineNumber: 193,
          columnNumber: 102
        })
      ] }, void 0, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\PreBattleModal.jsx",
        lineNumber: 158,
        columnNumber: 69
      }),
      /* @__PURE__ */ jsxDEV("div", { className: `glass-panel ${isHardMode ? "nightmare-panel" : ""}`, style: {
        padding: 20,
        textAlign: "center",
        opacity: 0.8
      }, children: [
        isHardMode && /* @__PURE__ */ jsxDEV("div", { style: {
          color: "#ef4444",
          fontWeight: 900,
          fontSize: "0.8rem",
          letterSpacing: 2,
          marginBottom: 5,
          animation: "pulse-glow 1s infinite"
        }, children: "NIGHTMARE DIFFICULTY" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\PreBattleModal.jsx",
          lineNumber: 205,
          columnNumber: 25
        }),
        (pendingStage.requiredElement || pendingStage.requiredFranchise || pendingStage.requiredRelType || pendingStage.minAvgLevel || pendingStage.squadSizeReq) && (() => {
          const h = React.createElement;
          const ps = pendingStage;
          const avg = squad.length ? squad.reduce((s, c) => s + (c.level || 1), 0) / squad.length : 0;
          const unlockedRoster = characters.filter((c) => unlockedIdSet.has(String(c.export_id)));
          const frMatch = (c, t) => {
            const f = (c.franchise || "").toLowerCase().trim();
            const tt = String(t).toLowerCase().trim();
            return f === tt || f.includes(tt);
          };
          const rosterCanFr = ps.requiredFranchise ? unlockedRoster.some((c) => frMatch(c, ps.requiredFranchise)) : true;
          const rosterCanEl = ps.requiredElement ? unlockedRoster.some((c) => String(c.element).toUpperCase() === String(ps.requiredElement).toUpperCase()) : true;
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
            met: squad.some((c) => String(c.element).toUpperCase() === String(ps.requiredElement).toUpperCase())
          });
          if (ps.requiredFranchise) reqs.push({
            label: `${ps.requiredFranchise} hero`,
            waived: !rosterCanFr,
            met: squad.some((c) => frMatch(c, ps.requiredFranchise))
          });
          if (ps.requiredRelType) reqs.push({
            label: `${ps.requiredRelType} bond`,
            met: squad.some((c) => String(c.relationship || "").toLowerCase().includes(ps.requiredRelType.toLowerCase()))
          });
          return /* @__PURE__ */ jsxDEV("div", { style: {
            background: "rgba(233,69,96,0.08)",
            border: "1px solid var(--primary)",
            borderRadius: 12,
            padding: "10px 12px",
            marginBottom: 15,
            textAlign: "left"
          }, children: [
            /* @__PURE__ */ jsxDEV("div", { style: {
              fontSize: "0.6rem",
              fontWeight: 900,
              color: "var(--primary)",
              letterSpacing: 2,
              marginBottom: 7
            }, children: "WHO'S GETTING IN" }, void 0, false, {
              fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\PreBattleModal.jsx",
              lineNumber: 254,
              columnNumber: 14
            }),
            /* @__PURE__ */ jsxDEV("div", { style: {
              display: "flex",
              flexWrap: "wrap",
              gap: 6
            }, children: reqs.map((r, i) => {
              const ok = r.waived || r.met;
              const col = r.waived ? "#94a3b8" : r.met ? "#4ade80" : "#f87171";
              return /* @__PURE__ */ jsxDEV("span", { style: {
                fontSize: "0.66rem",
                fontWeight: 800,
                padding: "3px 9px",
                borderRadius: 20,
                background: r.waived ? "rgba(148,163,184,0.12)" : r.met ? "rgba(74,222,128,0.13)" : "rgba(239,68,68,0.13)",
                color: col,
                border: "1px solid " + col + "44"
              }, children: (r.waived ? "\u2014 " : r.met ? "\u2713 " : "\u2717 ") + r.label + (r.waived ? " (waived)" : "") }, i, false, {
                fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\PreBattleModal.jsx",
                lineNumber: 267,
                columnNumber: 24
              });
            }) }, void 0, false, {
              fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\PreBattleModal.jsx",
              lineNumber: 260,
              columnNumber: 38
            })
          ] }, void 0, true, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\PreBattleModal.jsx",
            lineNumber: 247,
            columnNumber: 18
          });
        })(),
        /* @__PURE__ */ jsxDEV("div", { style: {
          fontSize: "0.75rem",
          fontWeight: 900,
          color: "#facc15",
          marginBottom: 10
        }, children: [
          "RECOMMENDED POWER: ",
          (pendingStage.cpReq * (isHardMode ? 2 : 1)).toLocaleString()
        ] }, void 0, true, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\PreBattleModal.jsx",
          lineNumber: 277,
          columnNumber: 14
        }),
        /* @__PURE__ */ jsxDEV("div", { style: {
          display: "flex",
          justifyContent: "center",
          gap: 20
        }, children: [
          /* @__PURE__ */ jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDEV("div", { style: {
              fontSize: "0.6rem",
              color: "var(--text-muted)"
            }, children: "CURRENT SQUAD" }, void 0, false, {
              fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\PreBattleModal.jsx",
              lineNumber: 286,
              columnNumber: 17
            }),
            /* @__PURE__ */ jsxDEV("div", { style: {
              fontSize: "1.2rem",
              fontWeight: 900,
              color: totalSquadPWR < pendingStage.cpReq * (isHardMode ? 2 : 1) ? "#ef4444" : "#4ade80"
            }, children: totalSquadPWR.toLocaleString() }, void 0, false, {
              fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\PreBattleModal.jsx",
              lineNumber: 289,
              columnNumber: 35
            })
          ] }, void 0, true, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\PreBattleModal.jsx",
            lineNumber: 286,
            columnNumber: 12
          }),
          /* @__PURE__ */ jsxDEV("div", { style: {
            width: 1,
            background: "rgba(255,255,255,0.1)"
          } }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\PreBattleModal.jsx",
            lineNumber: 293,
            columnNumber: 60
          }),
          /* @__PURE__ */ jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDEV("div", { style: {
              fontSize: "0.6rem",
              color: "var(--text-muted)"
            }, children: "WIN CHANCE" }, void 0, false, {
              fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\PreBattleModal.jsx",
              lineNumber: 296,
              columnNumber: 21
            }),
            /* @__PURE__ */ jsxDEV("div", { style: {
              fontSize: "1.2rem",
              fontWeight: 900
            }, children: [
              Math.min(100, Math.floor(totalSquadPWR / (pendingStage.cpReq * (isHardMode ? 2 : 1)) * 100)),
              "%"
            ] }, void 0, true, {
              fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\PreBattleModal.jsx",
              lineNumber: 299,
              columnNumber: 32
            })
          ] }, void 0, true, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\PreBattleModal.jsx",
            lineNumber: 296,
            columnNumber: 16
          })
        ] }, void 0, true, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\PreBattleModal.jsx",
          lineNumber: 282,
          columnNumber: 99
        })
      ] }, void 0, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\PreBattleModal.jsx",
        lineNumber: 201,
        columnNumber: 26
      })
    ] }, void 0, true, {
      fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\PreBattleModal.jsx",
      lineNumber: 137,
      columnNumber: 12
    }),
    raidResults && /* @__PURE__ */ jsxDEV("div", { className: "battle-result-overlay animate-fadeIn", children: /* @__PURE__ */ jsxDEV("div", { className: "glass-panel", style: {
      width: "90%",
      maxWidth: "400px",
      padding: 30,
      textAlign: "center",
      borderColor: "#4ade80"
    }, children: [
      /* @__PURE__ */ jsxDEV("h2", { style: {
        margin: "0 0 5px 0",
        color: "#4ade80",
        fontSize: "1.8rem"
      }, children: "RAID COMPLETE" }, void 0, false, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\PreBattleModal.jsx",
        lineNumber: 308,
        columnNumber: 10
      }),
      /* @__PURE__ */ jsxDEV("div", { style: {
        fontSize: "0.8rem",
        color: "var(--text-muted)",
        marginBottom: 20
      }, children: [
        "Results for ",
        raidResults.count,
        "x ",
        raidResults.stage
      ] }, void 0, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\PreBattleModal.jsx",
        lineNumber: 312,
        columnNumber: 30
      }),
      /* @__PURE__ */ jsxDEV("div", { style: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 15,
        marginBottom: 25
      }, children: [
        /* @__PURE__ */ jsxDEV("div", { className: "gacha-summary-stat", children: [
          /* @__PURE__ */ jsxDEV("div", { style: {
            fontSize: "0.6rem",
            color: "#94a3b8"
          }, children: "CREDITS" }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\PreBattleModal.jsx",
            lineNumber: 321,
            columnNumber: 48
          }),
          /* @__PURE__ */ jsxDEV("div", { style: {
            fontSize: "1.1rem",
            fontWeight: 900,
            color: "#facc15"
          }, children: [
            "+$",
            raidResults.credits.toLocaleString()
          ] }, void 0, true, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\PreBattleModal.jsx",
            lineNumber: 324,
            columnNumber: 29
          })
        ] }, void 0, true, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\PreBattleModal.jsx",
          lineNumber: 321,
          columnNumber: 12
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "gacha-summary-stat", children: [
          /* @__PURE__ */ jsxDEV("div", { style: {
            fontSize: "0.6rem",
            color: "#94a3b8"
          }, children: "AURA" }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\PreBattleModal.jsx",
            lineNumber: 328,
            columnNumber: 104
          }),
          /* @__PURE__ */ jsxDEV("div", { style: {
            fontSize: "1.1rem",
            fontWeight: 900,
            color: "#a855f7"
          }, children: [
            "+",
            raidResults.aura
          ] }, void 0, true, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\PreBattleModal.jsx",
            lineNumber: 331,
            columnNumber: 26
          })
        ] }, void 0, true, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\PreBattleModal.jsx",
          lineNumber: 328,
          columnNumber: 68
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "gacha-summary-stat", children: [
          /* @__PURE__ */ jsxDEV("div", { style: {
            fontSize: "0.6rem",
            color: "#94a3b8"
          }, children: "MATERIALS" }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\PreBattleModal.jsx",
            lineNumber: 335,
            columnNumber: 83
          }),
          /* @__PURE__ */ jsxDEV("div", { style: {
            fontSize: "1.1rem",
            fontWeight: 900,
            color: "#94a3b8"
          }, children: [
            "+",
            raidResults.materials
          ] }, void 0, true, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\PreBattleModal.jsx",
            lineNumber: 338,
            columnNumber: 31
          })
        ] }, void 0, true, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\PreBattleModal.jsx",
          lineNumber: 335,
          columnNumber: 47
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "gacha-summary-stat", children: [
          /* @__PURE__ */ jsxDEV("div", { style: {
            fontSize: "0.6rem",
            color: "#94a3b8"
          }, children: "ESSENCE" }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\PreBattleModal.jsx",
            lineNumber: 342,
            columnNumber: 88
          }),
          /* @__PURE__ */ jsxDEV("div", { style: {
            fontSize: "1.1rem",
            fontWeight: 900,
            color: "#f97316"
          }, children: [
            "+",
            raidResults.essence
          ] }, void 0, true, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\PreBattleModal.jsx",
            lineNumber: 345,
            columnNumber: 29
          })
        ] }, void 0, true, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\PreBattleModal.jsx",
          lineNumber: 342,
          columnNumber: 52
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "gacha-summary-stat", children: [
          /* @__PURE__ */ jsxDEV("div", { style: {
            fontSize: "0.6rem",
            color: "#94a3b8"
          }, children: "GEMS" }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\PreBattleModal.jsx",
            lineNumber: 349,
            columnNumber: 86
          }),
          /* @__PURE__ */ jsxDEV("div", { style: {
            fontSize: "1.1rem",
            fontWeight: 900,
            color: "#00d2ff"
          }, children: [
            "+",
            raidResults.gems
          ] }, void 0, true, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\PreBattleModal.jsx",
            lineNumber: 352,
            columnNumber: 26
          })
        ] }, void 0, true, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\PreBattleModal.jsx",
          lineNumber: 349,
          columnNumber: 50
        })
      ] }, void 0, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\PreBattleModal.jsx",
        lineNumber: 316,
        columnNumber: 70
      }),
      raidResults.items.length > 0 && /* @__PURE__ */ jsxDEV("div", { style: {
        marginBottom: 20,
        maxHeight: "150px",
        overflowY: "auto"
      }, className: "custom-scroll", children: [
        /* @__PURE__ */ jsxDEV("div", { style: {
          fontSize: "0.65rem",
          fontWeight: 900,
          color: "#4ade80",
          marginBottom: 10
        }, children: "LOOT FOUND:" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\PreBattleModal.jsx",
          lineNumber: 360,
          columnNumber: 38
        }),
        /* @__PURE__ */ jsxDEV("div", { style: {
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 6
        }, children: raidResults.items.map((item, idx) => /* @__PURE__ */ jsxDEV("div", { style: {
          background: "rgba(255, 255, 255, 0.05)",
          padding: "6px",
          borderRadius: 8,
          fontSize: "0.7rem",
          fontWeight: 800,
          color: "#fff"
        }, children: [
          /* @__PURE__ */ jsxDEV(Sparkles, { size: 10, style: {
            marginRight: 5
          } }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\PreBattleModal.jsx",
            lineNumber: 376,
            columnNumber: 16
          }),
          " ",
          item
        ] }, idx, true, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\PreBattleModal.jsx",
          lineNumber: 369,
          columnNumber: 52
        })) }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\PreBattleModal.jsx",
          lineNumber: 365,
          columnNumber: 31
        })
      ] }, void 0, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\PreBattleModal.jsx",
        lineNumber: 356,
        columnNumber: 86
      }),
      /* @__PURE__ */ jsxDEV("button", { className: "train-btn", onClick: () => setRaidResults(null), children: "CONFIRM" }, void 0, false, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\PreBattleModal.jsx",
        lineNumber: 378,
        columnNumber: 48
      })
    ] }, void 0, true, {
      fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\PreBattleModal.jsx",
      lineNumber: 302,
      columnNumber: 211
    }) }, void 0, false, {
      fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\PreBattleModal.jsx",
      lineNumber: 302,
      columnNumber: 157
    })
  ] }, void 0, true, {
    fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\campaign\\PreBattleModal.jsx",
    lineNumber: 137,
    columnNumber: 10
  });
};
export {
  PreBattleModal
};
