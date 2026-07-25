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
const getArenaTier = rank => ARENA_TIERS.find(t => rank >= t.min) || ARENA_TIERS[ARENA_TIERS.length - 1];
const TrialsMenu = props => {
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
  return <><div className="glass-panel" style={{
      marginBottom: 20,
      padding: "12px 20px",
      display: "flex",
      justifyContent: "space-around",
      background: "rgba(0,0,0,0.4)",
      border: "1px solid rgba(255,255,255,0.05)"
    }}><div style={{
        textAlign: "center"
      }}><div style={{
          fontSize: "0.6rem",
          color: "var(--text-muted)",
          fontWeight: 800
        }}>TOTAL HERO LEVELS</div><div style={{
          fontSize: "1.1rem",
          fontWeight: 900,
          color: "var(--primary)"
        }}>{statsSummary.totalLvl.toLocaleString()}</div></div><div style={{
        textAlign: "center"
      }}><div style={{
          fontSize: "0.6rem",
          color: "var(--text-muted)",
          fontWeight: 800
        }}>AVG BOND RANK</div><div style={{
          fontSize: "1.1rem",
          fontWeight: 900,
          color: "#f472b6"
        }}>{statsSummary.count > 0 ? (statsSummary.totalBond / statsSummary.count).toFixed(1) : 0}</div></div><div style={{
        textAlign: "center"
      }}><div style={{
          fontSize: "0.6rem",
          color: "var(--text-muted)",
          fontWeight: 800
        }}>ENDLESS FLOOR</div><div style={{
          fontSize: "1.1rem",
          fontWeight: 900,
          color: "#ef4444"
        }}>{endlessFloor}</div></div></div><div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20
    }}><h2 style={{
        fontWeight: 900,
        margin: 0
      }}>ENDGAME TRIALS</h2><button className="upgrade-btn" style={{
        marginRight: 10,
        background: "#4ade80",
        color: "#000"
      }} onClick={() => setShowSquadBuilder(true)}><Users size={14} /> DEPLOY SQUAD ({squadIds.length}/5)</button><div style={{
        display: "flex",
        gap: 4,
        background: "rgba(255,255,255,0.05)",
        padding: 4,
        borderRadius: 12
      }}><button onClick={() => setActiveTab("element")} style={{
          padding: "8px 16px",
          borderRadius: 8,
          border: "none",
          background: activeTab === "element" ? "var(--primary)" : "transparent",
          color: activeTab === "element" ? "#fff" : "var(--text-muted)",
          fontWeight: 800,
          cursor: "pointer",
          fontSize: "0.75rem"
        }}>ELEMENTAL</button><button onClick={() => setActiveTab("franchise")} style={{
          padding: "8px 16px",
          borderRadius: 8,
          border: "none",
          background: activeTab === "franchise" ? "#3b82f6" : "transparent",
          color: activeTab === "franchise" ? "#fff" : "var(--text-muted)",
          fontWeight: 800,
          cursor: "pointer",
          fontSize: "0.75rem"
        }}>SERIES</button><button onClick={() => setActiveTab("endless")} style={{
          padding: "8px 16px",
          borderRadius: 8,
          border: "none",
          background: activeTab === "endless" ? "#facc15" : "transparent",
          color: activeTab === "endless" ? "#000" : "var(--text-muted)",
          fontWeight: 800,
          cursor: "pointer",
          fontSize: "0.75rem"
        }}>★ ALL-STAR</button><button onClick={() => setActiveTab("arena")} style={{
          padding: "8px 16px",
          borderRadius: 8,
          border: "none",
          background: activeTab === "arena" ? "#facc15" : "transparent",
          color: activeTab === "arena" ? "#000" : "var(--text-muted)",
          fontWeight: 800,
          cursor: "pointer",
          fontSize: "0.75rem"
        }}>ARENA</button><button onClick={() => setActiveTab("grind")} style={{
          padding: "8px 16px",
          borderRadius: 8,
          border: "none",
          background: activeTab === "grind" ? "#00d2ff" : "transparent",
          color: activeTab === "grind" ? "#000" : "var(--text-muted)",
          fontWeight: 800,
          cursor: "pointer",
          fontSize: "0.75rem"
        }}>GRIND</button></div></div>{!activeTrial && !pendingTrial && <div className="trials-grid animate-fadeIn" style={{
      display: "grid",
      gap: 12
    }}>{activeTab === "endless" && renderAllStarMenu()}{activeTab === "grind" && renderGrindDungeons()}{activeTab === "arena" && (() => {
        const h = React.createElement;
        const tier = getArenaTier(arenaRank);
        const mySquad = characters.filter(c => (squadIds || []).some(id => String(id) === String(c.export_id))).slice(0, 3);
        const isPromotionReady = arenaWinStreak >= ARENA_QUALIFIER_WINS;
        const pips = Array.from({
          length: ARENA_QUALIFIER_WINS
        }).map((_, i) => <span key={i} className={"arena-pip" + (i < arenaWinStreak ? " lit" : "")} style={{
          "--pip-color": tier.color
        }} />);
        const header = <div className="arena-hall-header glass-panel" style={{
          "--tier-color": tier.color
        }}><div className="arena-tier-emblem" style={{
            color: tier.color
          }}>{tier.emblem}</div><div style={{
            flex: 1,
            minWidth: 180
          }}><div style={{
              fontSize: "0.62rem",
              fontWeight: 900,
              letterSpacing: 3,
              color: tier.color
            }}>{tier.name + " LEAGUE"}</div><h1 style={{
              margin: "2px 0 4px",
              fontSize: "2rem",
              fontFamily: "MugenTitle",
              color: "#fff"
            }}>{"RANK " + arenaRank}</h1><div style={{
              display: "flex",
              alignItems: "center",
              gap: 8
            }}><span style={{
                fontSize: "0.62rem",
                color: "var(--text-muted)",
                fontWeight: 800
              }}>{isPromotionReady ? "PROMOTION UNLOCKED" : "QUALIFIERS"}</span><div style={{
                display: "flex",
                gap: 5
              }}>{pips}</div><span style={{
                fontSize: "0.62rem",
                color: tier.color,
                fontWeight: 900
              }}>{isPromotionReady ? "FINAL MATCH" : `${arenaWinStreak}/${ARENA_QUALIFIER_WINS}`}</span></div></div><div style={{
            textAlign: "right"
          }}><div style={{
              fontSize: "0.6rem",
              color: "var(--text-muted)",
              fontWeight: 800,
              marginBottom: 6
            }}>YOUR CREW (3v3) • 75 STAMINA</div><div style={{
              display: "flex",
              gap: 6,
              justifyContent: "flex-end"
            }}>{mySquad.length ? mySquad.map((c, i) => <img key={i} src={c.imageUrl} className="arena-crew-chip" style={{
                borderColor: ELEMENTS[c.element]?.color || "#fff"
              }} />) : <span style={{
                fontSize: "0.7rem",
                color: "#f87171",
                fontWeight: 800
              }}>No squad set</span>}<button className="upgrade-btn" style={{
                fontSize: "0.65rem",
                padding: "6px 10px"
              }} onClick={() => setShowSquadBuilder({
                maxSquad: 3
              })}>EDIT</button></div></div></div>;
        if (!arenaScouted) {
          return <div style={{
            display: "grid",
            gap: 14
          }}>{header}<div className={"glass-panel arena-gate-panel" + (isPromotionReady ? " promotion-ready" : "")} style={{
              textAlign: "center",
              padding: "44px 20px",
              "--tier-color": tier.color
            }}>{isPromotionReady && <div className="arena-promotion-banner">PROMOTION MATCH</div>}<div style={{
                fontSize: "0.8rem",
                color: "var(--text-muted)",
                marginBottom: 4
              }}>{isPromotionReady ? `Win this match to reach Rank ${arenaRank + 1}. Promotion squads are stronger and favor Signature heroes.` : `Win ${ARENA_QUALIFIER_WINS - arenaWinStreak} more qualifier ${ARENA_QUALIFIER_WINS - arenaWinStreak === 1 ? "match" : "matches"} to unlock your promotion match.`}</div><div style={{
                fontSize: "0.68rem",
                color: tier.color,
                fontWeight: 800,
                marginBottom: 22
              }}>★ Watch for defenders with Signature abilities — they hit different.</div><button className="train-btn arena-scout-btn" style={{
                background: tier.color,
                color: "#000",
                width: "auto",
                padding: "14px 44px",
                margin: "0 auto"
              }} onClick={scoutArenaOpponents}>⚔ SCOUT OPPONENTS</button></div></div>;
        }
        const threat = enemies => enemies.reduce((s, e) => s + e.atk * 6 + e.def * 4 + Math.floor(e.maxHp / 8) + e.speed * 2, 0);
        return <div style={{
          display: "grid",
          gap: 14
        }}>{header}<div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}><div style={{
              fontWeight: 900,
              color: tier.color,
              letterSpacing: 1
            }}>CHOOSE YOUR OPPONENT</div><button className="upgrade-btn" style={{
              fontSize: "0.7rem"
            }} onClick={scoutArenaOpponents}>↻ RESCOUT</button></div>{canAutoClearArena() ? <div className="glass-panel" style={{
            padding: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            border: "1px solid #00d2ff55"
          }}><div key="txt"><div style={{
                fontSize: "0.7rem",
                fontWeight: 900,
                color: "#00d2ff"
              }}>YOUR CREW OUTCLASSES THIS LEAGUE</div><div style={{
                fontSize: "0.6rem",
                color: "var(--text-muted)"
              }}>{`Crew Power ${formatPower(arenaSquadPWR)} \u2014 skip straight to the result.`}</div></div><button key="btn" onClick={autoClearArenaMatch} style={{
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
            }}>⚡ AUTO CLEAR</button></div> : null}{arenaScouted.matchups.map((enemies, mi) => {
            const sigCount = enemies.filter(e => e.previewSkill2?.signature).length;
            return <div key={mi} className={"arena-opponent-card glass-panel" + (arenaScouted.isPromotionMatch ? " promotion-card" : "")} style={{
              "--tier-color": tier.color
            }}>{arenaScouted.isPromotionMatch && <div className="arena-promotion-card-label">RANK-UP DEFENSE · 2× REWARDS</div>}<div className="arena-opponent-portraits">{enemies.map((e, ei) => <div key={ei} className={"arena-opp-slot" + (ei === 0 ? " boss" : "")}>{ei === 0 && <div className="arena-opp-crown">👑</div>}<img src={e.img} style={{
                    borderColor: ELEMENTS[e.element]?.color || "#fff"
                  }} /><div className="arena-opp-name">{e.name}</div><div className="arena-opp-lv" style={{
                    color: ELEMENTS[e.element]?.color || "#fff"
                  }}>{"LV." + e.level}</div>{e.previewSkill2?.signature && <div className="arena-opp-sig" title={e.previewSkill2.name}>{"\u2605 " + e.previewSkill2.name}</div>}</div>)}</div><div className="arena-opponent-footer"><div><div style={{
                    fontSize: "0.58rem",
                    color: "var(--text-muted)",
                    fontWeight: 800
                  }}>THREAT LEVEL</div><div style={{
                    fontSize: "1.05rem",
                    fontWeight: 900,
                    color: sigCount >= 2 ? "#ef4444" : sigCount === 1 ? "#facc15" : "#4ade80"
                  }}>{formatPower(threat(enemies))}{sigCount > 0 ? ` \u2022 ${sigCount}\u2605 SIG` : ""}</div></div><button className="train-btn arena-fight-btn" style={{
                  background: tier.color,
                  color: "#000"
                }} onClick={() => startArenaMatchup(enemies)}>⚔ BATTLE</button></div></div>;
          })}</div>;
      })()}{groupedTrials.filter(g => g.type === activeTab).map(group => {
        const color = ELEMENTS[group.element]?.color || "#fff";
        return <div key={group.baseId} className="glass-panel" style={{
          padding: 0,
          overflow: "hidden",
          border: `1px solid ${color}33`
        }}><div style={{
            padding: "16px",
            background: `linear-gradient(90deg, ${color}11, transparent)`,
            display: "flex",
            alignItems: "center",
            gap: 15
          }}><div className="trial-icon-box" style={{
              background: color + "22",
              borderColor: color + "44",
              width: 48,
              height: 48,
              marginRight: 0
            }}><Star size={20} color={color} /></div><div style={{
              flex: 1
            }}><h3 style={{
                margin: 0,
                fontSize: "1.1rem",
                fontWeight: 900
              }}>{group.name}</h3><div style={{
                fontSize: "0.7rem",
                opacity: 0.9,
                marginTop: 4,
                display: "flex",
                gap: 8,
                alignItems: "center"
              }}>{group.franchise ? <><div style={{
                    fontSize: "0.65rem",
                    fontWeight: 900,
                    color: "#facc15"
                  }}>Series:</div><div style={{
                    fontSize: "0.75rem",
                    fontWeight: 900,
                    color: "#fff"
                  }}>{group.franchise}</div><div style={{
                    marginLeft: 8,
                    fontSize: "0.65rem",
                    color: "var(--text-muted)"
                  }}>Bring at least one matching unit.</div></> : <><div style={{
                    fontSize: "0.65rem",
                    fontWeight: 900,
                    color: ELEMENTS[group.element]?.color || "#fff"
                  }}>{group.element}</div><div style={{
                    marginLeft: 8,
                    fontSize: "0.65rem",
                    color: "var(--text-muted)"
                  }}>Bring at least one matching hero.</div></>}</div></div></div><div style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 1,
            background: "rgba(255,255,255,0.05)"
          }}>{group.variants.map(t => {
              const cleared = clearedTrials.includes(t.id);
              const matchingHeroes = t.franchise ? characters.filter(c => {
                const f = extractFranchise(c);
                return f && f.toLowerCase().trim() === String(t.franchise).toLowerCase().trim() && unlockedIds.includes(c.export_id);
              }) : characters.filter(c => String(c.element).toUpperCase() === String(t.element).toUpperCase() && unlockedIds.includes(c.export_id));
              const hasRequirement = matchingHeroes.length >= 1;
              const isDangerous = t.cpReq >= 1e6;
              let badgeColor = "#4ade80";
              if (t.difficulty === "medium") badgeColor = "#facc15";
              if (t.difficulty === "hard") badgeColor = "#ef4444";
              if (t.difficulty === "expert") badgeColor = "#a855f7";
              const reqText = t.franchise ? `Requires: ${t.franchise}` : `Requires: ${t.element}`;
              return <button key={t.id} className="trial-variant-btn" style={{
                background: "transparent",
                border: "none",
                padding: "12px 8px",
                color: "#fff",
                cursor: hasRequirement ? "pointer" : "not-allowed",
                opacity: hasRequirement ? 1 : 0.45,
                position: "relative",
                textAlign: "left"
              }} onClick={() => hasRequirement ? setPendingTrial(t) : createFloatingText(`Need ${t.franchise || t.element} Heroes!`, true)} title={reqText}><div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 8
                }}><div><div style={{
                      fontSize: "0.65rem",
                      fontWeight: 900,
                      color: badgeColor
                    }}>{t.difficulty.toUpperCase()}</div><div style={{
                      fontSize: "0.55rem",
                      marginTop: 4,
                      opacity: 0.8
                    }}>{reqText}</div></div><div style={{
                    textAlign: "right"
                  }}><div style={{
                      fontSize: "0.9rem",
                      fontWeight: 900,
                      color: "#fff"
                    }}>{t.cpReq >= 1e6 ? `${(t.cpReq / 1e6).toFixed(1)}M` : `${Math.floor(t.cpReq / 1e3)}K`}</div>{cleared && <div style={{
                      fontSize: "0.6rem",
                      color: "#4ade80",
                      fontWeight: 900,
                      marginTop: 6
                    }}>CLEARED</div>}</div></div><div style={{
                  marginTop: 8,
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  fontSize: "0.65rem",
                  color: "var(--text-muted)"
                }}>{t.franchise ? <><div style={{
                      padding: "2px 8px",
                      borderRadius: 8,
                      background: "rgba(255,255,255,0.03)",
                      fontWeight: 900
                    }}>{t.franchise}</div><div style={{
                      opacity: 0.8
                    }}>{matchingHeroes.length} matching heroes</div></> : <><div style={{
                      width: 14,
                      height: 14,
                      borderRadius: 4,
                      background: ELEMENTS[t.element]?.color || "#fff"
                    }} /><div style={{
                      opacity: 0.8
                    }}>{matchingHeroes.length} {matchingHeroes.length === 1 ? "match" : "matches"}</div></>}{isDangerous && <div style={{
                    marginLeft: "auto",
                    color: "#ef4444",
                    fontWeight: 900
                  }}>DANGEROUS</div>}</div></button>;
            })}</div></div>;
      })}{activeTab !== "arena" && groupedTrials.filter(g => g.type === activeTab).length === 0 && <div style={{
        textAlign: "center",
        padding: 40,
        opacity: 0.5,
        border: "1px dashed rgba(255,255,255,0.2)",
        borderRadius: 20
      }}><p style={{
          fontWeight: 900,
          fontSize: "1.2rem",
          color: "#fff"
        }}>NO TRIALS DETECTED</p><p style={{
          fontSize: "0.8rem",
          maxWidth: 400,
          margin: "10px auto"
        }}>{activeTab === "franchise" ? "Recruit at least 1 hero from any franchise to unlock their Series Paradox Trial." : "Elemental trials appear automatically. If you see this, the multiverse is syncing..."}</p><button className="train-btn" style={{
          width: "auto",
          padding: "10px 20px",
          background: "#334155"
        }} onClick={() => setView("gacha")}>RECRUIT NEW HEROES</button></div>}</div>}</>;
};
export { TrialsMenu };