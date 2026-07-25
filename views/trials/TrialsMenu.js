import { Fragment, jsxDEV } from "react/jsx-dev-runtime";
import React from "react";
import { Shield, Users, Star, Info, Plus } from "lucide-react";
import { BattleUnit, VictoryScreen, getBattleStats, executeCombatSkill, TacticalStanceRow, applyStatusTick, resolveBasicAttack, getCastAnimMs, getLungeMs, getBasicAttackMs, getCooldownGain, getFlurryHitSound, HITSTOP_BUFFER_MS, ProjectileLayer, pushShieldEffect, TurnOrderStrip } from "../../CombatSystem.js";
import { ELEMENTS, TIER_STATS, BOSS_ROSTER, EQUIPMENT, AUTO_CLEAR_PWR_MULT } from "../../constants.js";
import { calculateStat, playSound, calculateSubStat, applyLeaderBonus, applyCrewChemistry, getEnemyStatsFromCP, formatPower, applyMitigation, SIGNATURE_BONUS, incrementCourierFieldBattles, getDominantSpecialKey, SPECIAL_ARCHETYPE_NAMES, getGaugeGain, getGearPassives, rollEnemyGear, seededRandom, makeGearInstanceId, INITIAL_GAUGE_RANGE_WIDE } from "../../utils.js";
import { CampaignIntro } from "../ViewShared.js";
const ARENA_TIERS = [{
  min: 80,
  name: "MASTER",
  color: "#f472b6",
  emblem: "\u265B"
}, {
  min: 55,
  name: "DIAMOND",
  color: "#a5b4fc",
  emblem: "\u25C6"
}, {
  min: 35,
  name: "PLATINUM",
  color: "#67e8f9",
  emblem: "\u2B21"
}, {
  min: 20,
  name: "GOLD",
  color: "#facc15",
  emblem: "\u2605"
}, {
  min: 10,
  name: "SILVER",
  color: "#cbd5e1",
  emblem: "\u25B2"
}, {
  min: 1,
  name: "BRONZE",
  color: "#cd7f32",
  emblem: "\u25CF"
}];
const getArenaTier = (rank) => ARENA_TIERS.find((t) => rank >= t.min) || ARENA_TIERS[ARENA_TIERS.length - 1];
const TrialsMenu = (props) => {
  const {
    onWorldTimeStop,
    cameoId,
    characters,
    unlockedIds,
    createFloatingText,
    squadIds,
    setSquadIds,
    clearedTrials,
    setClearedTrials,
    setGems,
    setAura,
    stamina,
    setStamina,
    setBattleMusicActive,
    setIsVictoryMusic,
    setIsHardBattle,
    triggerVisualEffect2,
    endlessFloor,
    setEndlessFloor,
    arenaRank,
    setArenaRank,
    setCredits,
    setMaterials,
    setEssence,
    skills,
    setShowSquadBuilder,
    auraUpgrades,
    setCharacters,
    abilityShards,
    setAbilityShards,
    gearInventory,
    setGearInventory,
    ARENA_AUTO_CLEAR_PWR,
    ARENA_QUALIFIER_WINS,
    ARENA_WINS_PER_RANK,
    DIFFICULTY_CONFIG,
    GRIND_DUNGEONS,
    GRIND_STAMINA_MULTS,
    GRIND_STAMINA_PCTS,
    SHARD_TIER_COLOR,
    activeSkill,
    activeTab,
    activeTrial,
    allFranchises,
    arenaScouted,
    arenaSquadPWR,
    arenaWinStreak,
    autoBattle,
    autoClearAllStarRound,
    autoClearArenaMatch,
    baseElementTrials,
    baseFranchiseTrials,
    battleSceneRef,
    battleState,
    breakCombo,
    buildArenaMatchup,
    bumpCombo,
    cameoCutin,
    cameoData,
    cameoRef,
    canAutoClearAllStar,
    canAutoClearArena,
    changePlayerElement,
    combatSpeed,
    combatants,
    comboDisplay,
    comboMult,
    comboRef,
    deadIdsRef,
    eligibleFranchises,
    extractFranchise,
    finishTrial,
    floatingDamages,
    franchiseCounts,
    gauntletCp,
    gauntletCurrentSeries,
    gauntletIdx,
    gauntletLap,
    gauntletLen,
    gauntletRound,
    gauntletSeries,
    getGrindPct,
    getVictoryRewards,
    grantRewards,
    grindBulkMult,
    grindDungeonRewards,
    grindEffMult,
    grindPctByTier,
    grindSkillPool,
    groupedTrials,
    handledActionTimes,
    hitStopUntil,
    koEvent,
    lastSkillTimestamp,
    minorFranchiseChars,
    ownedFranchiseElement,
    pendingTrial,
    playerElement,
    renderAllStarMenu,
    renderGrindDungeons,
    rollGrindGear,
    scoutArenaOpponents,
    seriesChampions,
    setActiveSkill,
    setActiveTab,
    setActiveTrial,
    setArenaScouted,
    setArenaWinStreak,
    setAutoBattle,
    setBattleState,
    setCameoCutin,
    setCombatSpeed,
    setCombatants,
    setComboDisplay,
    setFloatingDamages,
    setGrindPctByTier,
    setKoEvent,
    setLastSkillTimestamp,
    setPendingTrial,
    setPlayerElement,
    showDamage,
    startAllStarRound,
    startArenaMatchup,
    startGrindDungeon,
    startTrial,
    statsSummary,
    tacticalStanceId,
    timeStopHandledRef,
    toggleTrialSquadMember,
    totalSquadPWR,
    trials,
    triggerCameo,
    triggerDefend,
    triggerSkill
  } = props;
  return /* @__PURE__ */ jsxDEV(Fragment, { children: [
    /* @__PURE__ */ jsxDEV("div", { className: "glass-panel", style: {
      marginBottom: 20,
      padding: "12px 20px",
      display: "flex",
      justifyContent: "space-around",
      background: "rgba(0,0,0,0.4)",
      border: "1px solid rgba(255,255,255,0.05)"
    }, children: [
      /* @__PURE__ */ jsxDEV("div", { style: {
        textAlign: "center"
      }, children: [
        /* @__PURE__ */ jsxDEV("div", { style: {
          fontSize: "0.6rem",
          color: "var(--text-muted)",
          fontWeight: 800
        }, children: "TOTAL HERO LEVELS" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
          lineNumber: 185,
          columnNumber: 10
        }),
        /* @__PURE__ */ jsxDEV("div", { style: {
          fontSize: "1.1rem",
          fontWeight: 900,
          color: "var(--primary)"
        }, children: statsSummary.totalLvl.toLocaleString() }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
          lineNumber: 189,
          columnNumber: 35
        })
      ] }, void 0, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
        lineNumber: 183,
        columnNumber: 8
      }),
      /* @__PURE__ */ jsxDEV("div", { style: {
        textAlign: "center"
      }, children: [
        /* @__PURE__ */ jsxDEV("div", { style: {
          fontSize: "0.6rem",
          color: "var(--text-muted)",
          fontWeight: 800
        }, children: "AVG BOND RANK" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
          lineNumber: 195,
          columnNumber: 10
        }),
        /* @__PURE__ */ jsxDEV("div", { style: {
          fontSize: "1.1rem",
          fontWeight: 900,
          color: "#f472b6"
        }, children: statsSummary.count > 0 ? (statsSummary.totalBond / statsSummary.count).toFixed(1) : 0 }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
          lineNumber: 199,
          columnNumber: 31
        })
      ] }, void 0, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
        lineNumber: 193,
        columnNumber: 64
      }),
      /* @__PURE__ */ jsxDEV("div", { style: {
        textAlign: "center"
      }, children: [
        /* @__PURE__ */ jsxDEV("div", { style: {
          fontSize: "0.6rem",
          color: "var(--text-muted)",
          fontWeight: 800
        }, children: "ENDLESS FLOOR" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
          lineNumber: 205,
          columnNumber: 10
        }),
        /* @__PURE__ */ jsxDEV("div", { style: {
          fontSize: "1.1rem",
          fontWeight: 900,
          color: "#ef4444"
        }, children: endlessFloor }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
          lineNumber: 209,
          columnNumber: 31
        })
      ] }, void 0, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
        lineNumber: 203,
        columnNumber: 111
      })
    ] }, void 0, true, {
      fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
      lineNumber: 176,
      columnNumber: 12
    }),
    /* @__PURE__ */ jsxDEV("div", { style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20
    }, children: [
      /* @__PURE__ */ jsxDEV("h2", { style: {
        fontWeight: 900,
        margin: 0
      }, children: "ENDGAME TRIALS" }, void 0, false, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
        lineNumber: 218,
        columnNumber: 8
      }),
      /* @__PURE__ */ jsxDEV("button", { className: "upgrade-btn", style: {
        marginRight: 10,
        background: "#4ade80",
        color: "#000"
      }, onClick: () => setShowSquadBuilder(true), children: [
        /* @__PURE__ */ jsxDEV(Users, { size: 14 }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
          lineNumber: 225,
          columnNumber: 52
        }),
        " DEPLOY SQUAD (",
        squadIds.length,
        "/5)"
      ] }, void 0, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
        lineNumber: 221,
        columnNumber: 29
      }),
      /* @__PURE__ */ jsxDEV("div", { style: {
        display: "flex",
        gap: 4,
        background: "rgba(255,255,255,0.05)",
        padding: 4,
        borderRadius: 12
      }, children: [
        /* @__PURE__ */ jsxDEV("button", { onClick: () => setActiveTab("element"), style: {
          padding: "8px 16px",
          borderRadius: 8,
          border: "none",
          background: activeTab === "element" ? "var(--primary)" : "transparent",
          color: activeTab === "element" ? "#fff" : "var(--text-muted)",
          fontWeight: 800,
          cursor: "pointer",
          fontSize: "0.75rem"
        }, children: "ELEMENTAL" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
          lineNumber: 231,
          columnNumber: 10
        }),
        /* @__PURE__ */ jsxDEV("button", { onClick: () => setActiveTab("franchise"), style: {
          padding: "8px 16px",
          borderRadius: 8,
          border: "none",
          background: activeTab === "franchise" ? "#3b82f6" : "transparent",
          color: activeTab === "franchise" ? "#fff" : "var(--text-muted)",
          fontWeight: 800,
          cursor: "pointer",
          fontSize: "0.75rem"
        }, children: "SERIES" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
          lineNumber: 240,
          columnNumber: 30
        }),
        /* @__PURE__ */ jsxDEV("button", { onClick: () => setActiveTab("endless"), style: {
          padding: "8px 16px",
          borderRadius: 8,
          border: "none",
          background: activeTab === "endless" ? "#facc15" : "transparent",
          color: activeTab === "endless" ? "#000" : "var(--text-muted)",
          fontWeight: 800,
          cursor: "pointer",
          fontSize: "0.75rem"
        }, children: "\u2605 ALL-STAR" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
          lineNumber: 249,
          columnNumber: 27
        }),
        /* @__PURE__ */ jsxDEV("button", { onClick: () => setActiveTab("arena"), style: {
          padding: "8px 16px",
          borderRadius: 8,
          border: "none",
          background: activeTab === "arena" ? "#facc15" : "transparent",
          color: activeTab === "arena" ? "#000" : "var(--text-muted)",
          fontWeight: 800,
          cursor: "pointer",
          fontSize: "0.75rem"
        }, children: "ARENA" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
          lineNumber: 258,
          columnNumber: 31
        }),
        /* @__PURE__ */ jsxDEV("button", { onClick: () => setActiveTab("grind"), style: {
          padding: "8px 16px",
          borderRadius: 8,
          border: "none",
          background: activeTab === "grind" ? "#00d2ff" : "transparent",
          color: activeTab === "grind" ? "#000" : "var(--text-muted)",
          fontWeight: 800,
          cursor: "pointer",
          fontSize: "0.75rem"
        }, children: "GRIND" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
          lineNumber: 267,
          columnNumber: 26
        })
      ] }, void 0, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
        lineNumber: 225,
        columnNumber: 115
      })
    ] }, void 0, true, {
      fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
      lineNumber: 213,
      columnNumber: 44
    }),
    !activeTrial && !pendingTrial && /* @__PURE__ */ jsxDEV("div", { className: "trials-grid animate-fadeIn", style: {
      display: "grid",
      gap: 12
    }, children: [
      activeTab === "endless" && renderAllStarMenu(),
      activeTab === "grind" && renderGrindDungeons(),
      activeTab === "arena" && (() => {
        const h = React.createElement;
        const tier = getArenaTier(arenaRank);
        const mySquad = characters.filter((c) => (squadIds || []).some((id) => String(id) === String(c.export_id))).slice(0, 3);
        const isPromotionReady = arenaWinStreak >= ARENA_QUALIFIER_WINS;
        const pips = Array.from({
          length: ARENA_QUALIFIER_WINS
        }).map((_, i) => /* @__PURE__ */ jsxDEV("span", { className: "arena-pip" + (i < arenaWinStreak ? " lit" : ""), style: {
          "--pip-color": tier.color
        } }, i, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
          lineNumber: 286,
          columnNumber: 26
        }));
        const header = /* @__PURE__ */ jsxDEV("div", { className: "arena-hall-header glass-panel", style: {
          "--tier-color": tier.color
        }, children: [
          /* @__PURE__ */ jsxDEV("div", { className: "arena-tier-emblem", style: {
            color: tier.color
          }, children: tier.emblem }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
            lineNumber: 291,
            columnNumber: 12
          }),
          /* @__PURE__ */ jsxDEV("div", { style: {
            flex: 1,
            minWidth: 180
          }, children: [
            /* @__PURE__ */ jsxDEV("div", { style: {
              fontSize: "0.62rem",
              fontWeight: 900,
              letterSpacing: 3,
              color: tier.color
            }, children: tier.name + " LEAGUE" }, void 0, false, {
              fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
              lineNumber: 296,
              columnNumber: 14
            }),
            /* @__PURE__ */ jsxDEV("h1", { style: {
              margin: "2px 0 4px",
              fontSize: "2rem",
              fontFamily: "MugenTitle",
              color: "#fff"
            }, children: "RANK " + arenaRank }, void 0, false, {
              fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
              lineNumber: 301,
              columnNumber: 45
            }),
            /* @__PURE__ */ jsxDEV("div", { style: {
              display: "flex",
              alignItems: "center",
              gap: 8
            }, children: [
              /* @__PURE__ */ jsxDEV("span", { style: {
                fontSize: "0.62rem",
                color: "var(--text-muted)",
                fontWeight: 800
              }, children: isPromotionReady ? "PROMOTION UNLOCKED" : "QUALIFIERS" }, void 0, false, {
                fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
                lineNumber: 310,
                columnNumber: 16
              }),
              /* @__PURE__ */ jsxDEV("div", { style: {
                display: "flex",
                gap: 5
              }, children: pips }, void 0, false, {
                fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
                lineNumber: 314,
                columnNumber: 81
              }),
              /* @__PURE__ */ jsxDEV("span", { style: {
                fontSize: "0.62rem",
                color: tier.color,
                fontWeight: 900
              }, children: isPromotionReady ? "FINAL MATCH" : `${arenaWinStreak}/${ARENA_QUALIFIER_WINS}` }, void 0, false, {
                fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
                lineNumber: 317,
                columnNumber: 30
              })
            ] }, void 0, true, {
              fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
              lineNumber: 306,
              columnNumber: 42
            })
          ] }, void 0, true, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
            lineNumber: 293,
            columnNumber: 33
          }),
          /* @__PURE__ */ jsxDEV("div", { style: {
            textAlign: "right"
          }, children: [
            /* @__PURE__ */ jsxDEV("div", { style: {
              fontSize: "0.6rem",
              color: "var(--text-muted)",
              fontWeight: 800,
              marginBottom: 6
            }, children: "YOUR CREW (3v3) \u2022 75 STAMINA" }, void 0, false, {
              fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
              lineNumber: 323,
              columnNumber: 14
            }),
            /* @__PURE__ */ jsxDEV("div", { style: {
              display: "flex",
              gap: 6,
              justifyContent: "flex-end"
            }, children: [
              mySquad.length ? mySquad.map((c, i) => /* @__PURE__ */ jsxDEV("img", { src: c.imageUrl, className: "arena-crew-chip", style: {
                borderColor: ELEMENTS[c.element]?.color || "#fff"
              } }, i, false, {
                fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
                lineNumber: 332,
                columnNumber: 56
              })) : /* @__PURE__ */ jsxDEV("span", { style: {
                fontSize: "0.7rem",
                color: "#f87171",
                fontWeight: 800
              }, children: "No squad set" }, void 0, false, {
                fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
                lineNumber: 334,
                columnNumber: 24
              }),
              /* @__PURE__ */ jsxDEV("button", { className: "upgrade-btn", style: {
                fontSize: "0.65rem",
                padding: "6px 10px"
              }, onClick: () => setShowSquadBuilder({
                maxSquad: 3
              }), children: "EDIT" }, void 0, false, {
                fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
                lineNumber: 338,
                columnNumber: 38
              })
            ] }, void 0, true, {
              fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
              lineNumber: 328,
              columnNumber: 50
            })
          ] }, void 0, true, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
            lineNumber: 321,
            columnNumber: 117
          })
        ] }, void 0, true, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
          lineNumber: 289,
          columnNumber: 24
        });
        if (!arenaScouted) {
          return /* @__PURE__ */ jsxDEV("div", { style: {
            display: "grid",
            gap: 14
          }, children: [
            header,
            /* @__PURE__ */ jsxDEV("div", { className: "glass-panel arena-gate-panel" + (isPromotionReady ? " promotion-ready" : ""), style: {
              textAlign: "center",
              padding: "44px 20px",
              "--tier-color": tier.color
            }, children: [
              isPromotionReady && /* @__PURE__ */ jsxDEV("div", { className: "arena-promotion-banner", children: "PROMOTION MATCH" }, void 0, false, {
                fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
                lineNumber: 352,
                columnNumber: 37
              }),
              /* @__PURE__ */ jsxDEV("div", { style: {
                fontSize: "0.8rem",
                color: "var(--text-muted)",
                marginBottom: 4
              }, children: isPromotionReady ? `Win this match to reach Rank ${arenaRank + 1}. Promotion squads are stronger and favor Signature heroes.` : `Win ${ARENA_QUALIFIER_WINS - arenaWinStreak} more qualifier ${ARENA_QUALIFIER_WINS - arenaWinStreak === 1 ? "match" : "matches"} to unlock your promotion match.` }, void 0, false, {
                fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
                lineNumber: 352,
                columnNumber: 99
              }),
              /* @__PURE__ */ jsxDEV("div", { style: {
                fontSize: "0.68rem",
                color: tier.color,
                fontWeight: 800,
                marginBottom: 22
              }, children: "\u2605 Watch for defenders with Signature abilities \u2014 they hit different." }, void 0, false, {
                fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
                lineNumber: 356,
                columnNumber: 316
              }),
              /* @__PURE__ */ jsxDEV("button", { className: "train-btn arena-scout-btn", style: {
                background: tier.color,
                color: "#000",
                width: "auto",
                padding: "14px 44px",
                margin: "0 auto"
              }, onClick: scoutArenaOpponents, children: "\u2694 SCOUT OPPONENTS" }, void 0, false, {
                fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
                lineNumber: 361,
                columnNumber: 92
              })
            ] }, void 0, true, {
              fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
              lineNumber: 348,
              columnNumber: 22
            })
          ] }, void 0, true, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
            lineNumber: 345,
            columnNumber: 18
          });
        }
        const threat = (enemies) => enemies.reduce((s, e) => s + e.atk * 6 + e.def * 4 + Math.floor(e.maxHp / 8) + e.speed * 2, 0);
        return /* @__PURE__ */ jsxDEV("div", { style: {
          display: "grid",
          gap: 14
        }, children: [
          header,
          /* @__PURE__ */ jsxDEV("div", { style: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }, children: [
            /* @__PURE__ */ jsxDEV("div", { style: {
              fontWeight: 900,
              color: tier.color,
              letterSpacing: 1
            }, children: "CHOOSE YOUR OPPONENT" }, void 0, false, {
              fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
              lineNumber: 377,
              columnNumber: 14
            }),
            /* @__PURE__ */ jsxDEV("button", { className: "upgrade-btn", style: {
              fontSize: "0.7rem"
            }, onClick: scoutArenaOpponents, children: "\u21BB RESCOUT" }, void 0, false, {
              fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
              lineNumber: 381,
              columnNumber: 42
            })
          ] }, void 0, true, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
            lineNumber: 373,
            columnNumber: 20
          }),
          canAutoClearArena() ? /* @__PURE__ */ jsxDEV("div", { className: "glass-panel", style: {
            padding: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            border: "1px solid #00d2ff55"
          }, children: [
            /* @__PURE__ */ jsxDEV("div", { children: [
              /* @__PURE__ */ jsxDEV("div", { style: {
                fontSize: "0.7rem",
                fontWeight: 900,
                color: "#00d2ff"
              }, children: "YOUR CREW OUTCLASSES THIS LEAGUE" }, void 0, false, {
                fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
                lineNumber: 390,
                columnNumber: 29
              }),
              /* @__PURE__ */ jsxDEV("div", { style: {
                fontSize: "0.6rem",
                color: "var(--text-muted)"
              }, children: `Crew Power ${formatPower(arenaSquadPWR)} \u2014 skip straight to the result.` }, void 0, false, {
                fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
                lineNumber: 394,
                columnNumber: 56
              })
            ] }, "txt", true, {
              fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
              lineNumber: 390,
              columnNumber: 14
            }),
            /* @__PURE__ */ jsxDEV("button", { onClick: autoClearArenaMatch, style: {
              border: "none",
              borderRadius: 10,
              fontWeight: 900,
              letterSpacing: 1,
              fontSize: "0.8rem",
              cursor: "pointer",
              padding: "10px 20px",
              background: "linear-gradient(135deg,#00d2ff,#0891b2)",
              color: "#000",
              flexShrink: 0
            }, children: "\u26A1 AUTO CLEAR" }, "btn", false, {
              fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
              lineNumber: 397,
              columnNumber: 110
            })
          ] }, void 0, true, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
            lineNumber: 383,
            columnNumber: 93
          }) : null,
          arenaScouted.matchups.map((enemies, mi) => {
            const sigCount = enemies.filter((e) => e.previewSkill2?.signature).length;
            return /* @__PURE__ */ jsxDEV("div", { className: "arena-opponent-card glass-panel" + (arenaScouted.isPromotionMatch ? " promotion-card" : ""), style: {
              "--tier-color": tier.color
            }, children: [
              arenaScouted.isPromotionMatch && /* @__PURE__ */ jsxDEV("div", { className: "arena-promotion-card-label", children: "RANK-UP DEFENSE \xB7 2\xD7 REWARDS" }, void 0, false, {
                fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
                lineNumber: 412,
                columnNumber: 50
              }),
              /* @__PURE__ */ jsxDEV("div", { className: "arena-opponent-portraits", children: enemies.map((e, ei) => /* @__PURE__ */ jsxDEV("div", { className: "arena-opp-slot" + (ei === 0 ? " boss" : ""), children: [
                ei === 0 && /* @__PURE__ */ jsxDEV("div", { className: "arena-opp-crown", children: "\u{1F451}" }, void 0, false, {
                  fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
                  lineNumber: 412,
                  columnNumber: 279
                }),
                /* @__PURE__ */ jsxDEV("img", { src: e.img, style: {
                  borderColor: ELEMENTS[e.element]?.color || "#fff"
                } }, void 0, false, {
                  fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
                  lineNumber: 412,
                  columnNumber: 321
                }),
                /* @__PURE__ */ jsxDEV("div", { className: "arena-opp-name", children: e.name }, void 0, false, {
                  fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
                  lineNumber: 414,
                  columnNumber: 24
                }),
                /* @__PURE__ */ jsxDEV("div", { className: "arena-opp-lv", style: {
                  color: ELEMENTS[e.element]?.color || "#fff"
                }, children: "LV." + e.level }, void 0, false, {
                  fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
                  lineNumber: 414,
                  columnNumber: 70
                }),
                e.previewSkill2?.signature && /* @__PURE__ */ jsxDEV("div", { className: "arena-opp-sig", title: e.previewSkill2.name, children: "\u2605 " + e.previewSkill2.name }, void 0, false, {
                  fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
                  lineNumber: 416,
                  columnNumber: 76
                })
              ] }, ei, true, {
                fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
                lineNumber: 412,
                columnNumber: 195
              })) }, void 0, false, {
                fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
                lineNumber: 412,
                columnNumber: 129
              }),
              /* @__PURE__ */ jsxDEV("div", { className: "arena-opponent-footer", children: [
                /* @__PURE__ */ jsxDEV("div", { children: [
                  /* @__PURE__ */ jsxDEV("div", { style: {
                    fontSize: "0.58rem",
                    color: "var(--text-muted)",
                    fontWeight: 800
                  }, children: "THREAT LEVEL" }, void 0, false, {
                    fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
                    lineNumber: 416,
                    columnNumber: 235
                  }),
                  /* @__PURE__ */ jsxDEV("div", { style: {
                    fontSize: "1.05rem",
                    fontWeight: 900,
                    color: sigCount >= 2 ? "#ef4444" : sigCount === 1 ? "#facc15" : "#4ade80"
                  }, children: [
                    formatPower(threat(enemies)),
                    sigCount > 0 ? ` \u2022 ${sigCount}\u2605 SIG` : ""
                  ] }, void 0, true, {
                    fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
                    lineNumber: 420,
                    columnNumber: 40
                  })
                ] }, void 0, true, {
                  fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
                  lineNumber: 416,
                  columnNumber: 230
                }),
                /* @__PURE__ */ jsxDEV("button", { className: "train-btn arena-fight-btn", style: {
                  background: tier.color,
                  color: "#000"
                }, onClick: () => startArenaMatchup(enemies), children: "\u2694 BATTLE" }, void 0, false, {
                  fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
                  lineNumber: 424,
                  columnNumber: 117
                })
              ] }, void 0, true, {
                fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
                lineNumber: 416,
                columnNumber: 191
              })
            ] }, mi, true, {
              fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
              lineNumber: 410,
              columnNumber: 20
            });
          })
        ] }, void 0, true, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
          lineNumber: 370,
          columnNumber: 16
        });
      })(),
      groupedTrials.filter((g) => g.type === activeTab).map((group) => {
        const color = ELEMENTS[group.element]?.color || "#fff";
        return /* @__PURE__ */ jsxDEV("div", { className: "glass-panel", style: {
          padding: 0,
          overflow: "hidden",
          border: `1px solid ${color}33`
        }, children: [
          /* @__PURE__ */ jsxDEV("div", { style: {
            padding: "16px",
            background: `linear-gradient(90deg, ${color}11, transparent)`,
            display: "flex",
            alignItems: "center",
            gap: 15
          }, children: [
            /* @__PURE__ */ jsxDEV("div", { className: "trial-icon-box", style: {
              background: color + "22",
              borderColor: color + "44",
              width: 48,
              height: 48,
              marginRight: 0
            }, children: /* @__PURE__ */ jsxDEV(Star, { size: 20, color }, void 0, false, {
              fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
              lineNumber: 447,
              columnNumber: 16
            }) }, void 0, false, {
              fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
              lineNumber: 441,
              columnNumber: 14
            }),
            /* @__PURE__ */ jsxDEV("div", { style: {
              flex: 1
            }, children: [
              /* @__PURE__ */ jsxDEV("h3", { style: {
                margin: 0,
                fontSize: "1.1rem",
                fontWeight: 900
              }, children: group.name }, void 0, false, {
                fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
                lineNumber: 449,
                columnNumber: 16
              }),
              /* @__PURE__ */ jsxDEV("div", { style: {
                fontSize: "0.7rem",
                opacity: 0.9,
                marginTop: 4,
                display: "flex",
                gap: 8,
                alignItems: "center"
              }, children: group.franchise ? /* @__PURE__ */ jsxDEV(Fragment, { children: [
                /* @__PURE__ */ jsxDEV("div", { style: {
                  fontSize: "0.65rem",
                  fontWeight: 900,
                  color: "#facc15"
                }, children: "Series:" }, void 0, false, {
                  fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
                  lineNumber: 460,
                  columnNumber: 39
                }),
                /* @__PURE__ */ jsxDEV("div", { style: {
                  fontSize: "0.75rem",
                  fontWeight: 900,
                  color: "#fff"
                }, children: group.franchise }, void 0, false, {
                  fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
                  lineNumber: 464,
                  columnNumber: 35
                }),
                /* @__PURE__ */ jsxDEV("div", { style: {
                  marginLeft: 8,
                  fontSize: "0.65rem",
                  color: "var(--text-muted)"
                }, children: "Bring at least one matching unit." }, void 0, false, {
                  fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
                  lineNumber: 468,
                  columnNumber: 45
                })
              ] }, void 0, true, {
                fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
                lineNumber: 460,
                columnNumber: 37
              }) : /* @__PURE__ */ jsxDEV(Fragment, { children: [
                /* @__PURE__ */ jsxDEV("div", { style: {
                  fontSize: "0.65rem",
                  fontWeight: 900,
                  color: ELEMENTS[group.element]?.color || "#fff"
                }, children: group.element }, void 0, false, {
                  fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
                  lineNumber: 472,
                  columnNumber: 69
                }),
                /* @__PURE__ */ jsxDEV("div", { style: {
                  marginLeft: 8,
                  fontSize: "0.65rem",
                  color: "var(--text-muted)"
                }, children: "Bring at least one matching hero." }, void 0, false, {
                  fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
                  lineNumber: 476,
                  columnNumber: 43
                })
              ] }, void 0, true, {
                fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
                lineNumber: 472,
                columnNumber: 67
              }) }, void 0, false, {
                fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
                lineNumber: 453,
                columnNumber: 35
              })
            ] }, void 0, true, {
              fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
              lineNumber: 447,
              columnNumber: 54
            })
          ] }, void 0, true, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
            lineNumber: 435,
            columnNumber: 12
          }),
          /* @__PURE__ */ jsxDEV("div", { style: {
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 1,
            background: "rgba(255,255,255,0.05)"
          }, children: group.variants.map((t) => {
            const cleared = clearedTrials.includes(t.id);
            const matchingHeroes = t.franchise ? characters.filter((c) => {
              const f = extractFranchise(c);
              return f && f.toLowerCase().trim() === String(t.franchise).toLowerCase().trim() && unlockedIds.includes(c.export_id);
            }) : characters.filter((c) => String(c.element).toUpperCase() === String(t.element).toUpperCase() && unlockedIds.includes(c.export_id));
            const hasRequirement = matchingHeroes.length >= 1;
            const isDangerous = t.cpReq >= 1e6;
            let badgeColor = "#4ade80";
            if (t.difficulty === "medium") badgeColor = "#facc15";
            if (t.difficulty === "hard") badgeColor = "#ef4444";
            if (t.difficulty === "expert") badgeColor = "#a855f7";
            const reqText = t.franchise ? `Requires: ${t.franchise}` : `Requires: ${t.element}`;
            return /* @__PURE__ */ jsxDEV("button", { className: "trial-variant-btn", style: {
              background: "transparent",
              border: "none",
              padding: "12px 8px",
              color: "#fff",
              cursor: hasRequirement ? "pointer" : "not-allowed",
              opacity: hasRequirement ? 1 : 0.45,
              position: "relative",
              textAlign: "left"
            }, onClick: () => hasRequirement ? setPendingTrial(t) : createFloatingText(`Need ${t.franchise || t.element} Heroes!`, true), title: reqText, children: [
              /* @__PURE__ */ jsxDEV("div", { style: {
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 8
              }, children: [
                /* @__PURE__ */ jsxDEV("div", { children: [
                  /* @__PURE__ */ jsxDEV("div", { style: {
                    fontSize: "0.65rem",
                    fontWeight: 900,
                    color: badgeColor
                  }, children: t.difficulty.toUpperCase() }, void 0, false, {
                    fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
                    lineNumber: 512,
                    columnNumber: 25
                  }),
                  /* @__PURE__ */ jsxDEV("div", { style: {
                    fontSize: "0.55rem",
                    marginTop: 4,
                    opacity: 0.8
                  }, children: reqText }, void 0, false, {
                    fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
                    lineNumber: 516,
                    columnNumber: 58
                  })
                ] }, void 0, true, {
                  fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
                  lineNumber: 512,
                  columnNumber: 20
                }),
                /* @__PURE__ */ jsxDEV("div", { style: {
                  textAlign: "right"
                }, children: [
                  /* @__PURE__ */ jsxDEV("div", { style: {
                    fontSize: "0.9rem",
                    fontWeight: 900,
                    color: "#fff"
                  }, children: t.cpReq >= 1e6 ? `${(t.cpReq / 1e6).toFixed(1)}M` : `${Math.floor(t.cpReq / 1e3)}K` }, void 0, false, {
                    fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
                    lineNumber: 522,
                    columnNumber: 22
                  }),
                  cleared && /* @__PURE__ */ jsxDEV("div", { style: {
                    fontSize: "0.6rem",
                    color: "#4ade80",
                    fontWeight: 900,
                    marginTop: 6
                  }, children: "CLEARED" }, void 0, false, {
                    fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
                    lineNumber: 526,
                    columnNumber: 127
                  })
                ] }, void 0, true, {
                  fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
                  lineNumber: 520,
                  columnNumber: 45
                })
              ] }, void 0, true, {
                fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
                lineNumber: 507,
                columnNumber: 157
              }),
              /* @__PURE__ */ jsxDEV("div", { style: {
                marginTop: 8,
                display: "flex",
                gap: 8,
                alignItems: "center",
                fontSize: "0.65rem",
                color: "var(--text-muted)"
              }, children: [
                t.franchise ? /* @__PURE__ */ jsxDEV(Fragment, { children: [
                  /* @__PURE__ */ jsxDEV("div", { style: {
                    padding: "2px 8px",
                    borderRadius: 8,
                    background: "rgba(255,255,255,0.03)",
                    fontWeight: 900
                  }, children: t.franchise }, void 0, false, {
                    fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
                    lineNumber: 538,
                    columnNumber: 37
                  }),
                  /* @__PURE__ */ jsxDEV("div", { style: {
                    opacity: 0.8
                  }, children: [
                    matchingHeroes.length,
                    " matching heroes"
                  ] }, void 0, true, {
                    fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
                    lineNumber: 543,
                    columnNumber: 43
                  })
                ] }, void 0, true, {
                  fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
                  lineNumber: 538,
                  columnNumber: 35
                }) : /* @__PURE__ */ jsxDEV(Fragment, { children: [
                  /* @__PURE__ */ jsxDEV("div", { style: {
                    width: 14,
                    height: 14,
                    borderRadius: 4,
                    background: ELEMENTS[t.element]?.color || "#fff"
                  } }, void 0, false, {
                    fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
                    lineNumber: 545,
                    columnNumber: 77
                  }),
                  /* @__PURE__ */ jsxDEV("div", { style: {
                    opacity: 0.8
                  }, children: [
                    matchingHeroes.length,
                    " ",
                    matchingHeroes.length === 1 ? "match" : "matches"
                  ] }, void 0, true, {
                    fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
                    lineNumber: 550,
                    columnNumber: 26
                  })
                ] }, void 0, true, {
                  fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
                  lineNumber: 545,
                  columnNumber: 75
                }),
                isDangerous && /* @__PURE__ */ jsxDEV("div", { style: {
                  marginLeft: "auto",
                  color: "#ef4444",
                  fontWeight: 900
                }, children: "DANGEROUS" }, void 0, false, {
                  fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
                  lineNumber: 552,
                  columnNumber: 125
                })
              ] }, void 0, true, {
                fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
                lineNumber: 531,
                columnNumber: 50
              })
            ] }, t.id, true, {
              fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
              lineNumber: 498,
              columnNumber: 22
            });
          }) }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
            lineNumber: 480,
            columnNumber: 83
          })
        ] }, group.baseId, true, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
          lineNumber: 431,
          columnNumber: 16
        });
      }),
      activeTab !== "arena" && groupedTrials.filter((g) => g.type === activeTab).length === 0 && /* @__PURE__ */ jsxDEV("div", { style: {
        textAlign: "center",
        padding: 40,
        opacity: 0.5,
        border: "1px dashed rgba(255,255,255,0.2)",
        borderRadius: 20
      }, children: [
        /* @__PURE__ */ jsxDEV("p", { style: {
          fontWeight: 900,
          fontSize: "1.2rem",
          color: "#fff"
        }, children: "NO TRIALS DETECTED" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
          lineNumber: 564,
          columnNumber: 10
        }),
        /* @__PURE__ */ jsxDEV("p", { style: {
          fontSize: "0.8rem",
          maxWidth: 400,
          margin: "10px auto"
        }, children: activeTab === "franchise" ? "Recruit at least 1 hero from any franchise to unlock their Series Paradox Trial." : "Elemental trials appear automatically. If you see this, the multiverse is syncing..." }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
          lineNumber: 568,
          columnNumber: 34
        }),
        /* @__PURE__ */ jsxDEV("button", { className: "train-btn", style: {
          width: "auto",
          padding: "10px 20px",
          background: "#334155"
        }, onClick: () => setView("gacha"), children: "RECRUIT NEW HEROES" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
          lineNumber: 572,
          columnNumber: 217
        })
      ] }, void 0, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
        lineNumber: 558,
        columnNumber: 100
      })
    ] }, void 0, true, {
      fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
      lineNumber: 276,
      columnNumber: 72
    })
  ] }, void 0, true, {
    fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\TrialsMenu.jsx",
    lineNumber: 176,
    columnNumber: 10
  });
};
export {
  TrialsMenu
};
