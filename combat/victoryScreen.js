import { jsxDEV } from "react/jsx-dev-runtime";
import React, { useState, useRef, useEffect, useMemo } from "react";
import { Zap, Database, Activity, Star, Package, Gem } from "lucide-react";
import { playSound } from "../utils.js";
import { TallyNumber } from "./battleUI.js";
const VictoryScreen = ({
  combatants,
  rewards,
  onConfirm
}) => {
  const [phase, setPhase] = useState(0);
  const [visibleItems, setVisibleItems] = useState([]);
  const allies = combatants.filter((c) => !c.isEnemy);
  const avgHpPercent = allies.reduce((sum, a) => sum + a.hp / a.maxHp, 0) / allies.length;
  const rankInfo = useMemo(() => {
    const score = avgHpPercent * 100;
    if (score > 98) return {
      letter: "SSS",
      color: "#fff",
      desc: "UNSTOPPABLE FORCE",
      glow: "#fff"
    };
    if (score > 90) return {
      letter: "SS",
      color: "#facc15",
      desc: "ELITE COMMANDER",
      glow: "#facc15"
    };
    if (score > 75) return {
      letter: "S",
      color: "#facc15",
      desc: "SUPERIOR VICTORY",
      glow: "#facc15"
    };
    if (score > 60) return {
      letter: "A",
      color: "#a855f7",
      desc: "EXCELLENT",
      glow: "#a855f7"
    };
    if (score > 40) return {
      letter: "B",
      color: "#60a5fa",
      desc: "CLEAN SWEEP",
      glow: "#60a5fa"
    };
    return {
      letter: "C",
      color: "#94a3b8",
      desc: "CLOSE CALL",
      glow: "#94a3b8"
    };
  }, [avgHpPercent]);
  const report = useMemo(() => {
    const sorted = allies.slice().sort((a, b) => (b._battleDamage || 0) - (a._battleDamage || 0));
    const topDamage = sorted[0];
    const bestHitUnit = allies.slice().sort((a, b) => (b._battleBestHit || 0) - (a._battleBestHit || 0))[0];
    const topHealer = allies.slice().sort((a, b) => (b._battleHealing || 0) - (a._battleHealing || 0))[0];
    const totalTeamDamage = allies.reduce((s, a) => s + (a._battleDamage || 0), 0);
    return {
      sorted,
      mvp: topDamage && topDamage._battleDamage > 0 ? topDamage : allies.filter((a) => !a.dead).sort((a, b) => b.hp - a.hp)[0] || allies[0],
      bestHitUnit: bestHitUnit && bestHitUnit._battleBestHit > 0 ? bestHitUnit : null,
      topHealer: topHealer && topHealer._battleHealing > 0 ? topHealer : null,
      totalTeamDamage
    };
  }, [allies]);
  const pendingTimeouts = useRef([]);
  useEffect(() => {
    playSound("victory_fanfare", 0.8);
    playSound("mugen_victory_voice", 0.5);
    const t1 = setTimeout(() => {
      setPhase(1);
      playSound("intro_boom", 0.6);
    }, 1200);
    const t2 = setTimeout(() => {
      setPhase(2);
      playSound("reward_tally", 0.3);
    }, 2400);
    const t3 = setTimeout(() => {
      setPhase(3);
      playSound("reward_tally", 0.4);
    }, 3700);
    const t4 = setTimeout(() => {
      setPhase(4);
    }, 5200);
    const t5 = setTimeout(() => {
      setPhase(5);
    }, 6700);
    pendingTimeouts.current = [t1, t2, t3, t4, t5];
    return () => {
      pendingTimeouts.current.forEach(clearTimeout);
    };
  }, []);
  useEffect(() => {
    if (phase === 4 && rewards.items && rewards.items.length > 0) {
      rewards.items.forEach((item, i) => {
        const t = setTimeout(() => {
          setVisibleItems((prev) => [...prev, item]);
          playSound("item_pop", 0.3);
        }, i * 250);
        pendingTimeouts.current.push(t);
      });
    }
  }, [phase, rewards.items]);
  const skipToEnd = () => {
    pendingTimeouts.current.forEach(clearTimeout);
    pendingTimeouts.current = [];
    if (rewards.items && rewards.items.length > 0) setVisibleItems(rewards.items);
    setPhase(5);
    playSound("ui_select", 0.3);
  };
  const mvp = report.mvp;
  const renderSquadReport = () => {
    const h = React.createElement;
    return /* @__PURE__ */ jsxDEV("div", { className: "victory-squad-report animate-fadeIn", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "vic-squad-row", children: report.sorted.map((a, i) => {
        const hpPct = Math.max(0, a.hp / a.maxHp * 100);
        const isTop = a === report.mvp && a._battleDamage > 0;
        return /* @__PURE__ */ jsxDEV("div", { className: `vic-squad-card ${a.dead ? "ko" : ""} ${isTop ? "top" : ""}`, style: {
          animationDelay: `${i * 0.08}s`
        }, children: [
          isTop && /* @__PURE__ */ jsxDEV("div", { className: "vic-squad-crown", children: "\u2605 MVP" }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\victoryScreen.jsx",
            lineNumber: 133,
            columnNumber: 24
          }),
          /* @__PURE__ */ jsxDEV("img", { src: a.img, className: "vic-squad-img" }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\victoryScreen.jsx",
            lineNumber: 133,
            columnNumber: 69
          }),
          a.dead && /* @__PURE__ */ jsxDEV("div", { className: "vic-squad-ko", children: "KO" }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\victoryScreen.jsx",
            lineNumber: 133,
            columnNumber: 125
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "vic-squad-hpbar", children: /* @__PURE__ */ jsxDEV("div", { className: "vic-squad-hpfill", style: {
            width: `${hpPct}%`,
            background: hpPct > 60 ? "#22c55e" : hpPct > 25 ? "#facc15" : "#ef4444"
          } }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\victoryScreen.jsx",
            lineNumber: 133,
            columnNumber: 197
          }) }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\victoryScreen.jsx",
            lineNumber: 133,
            columnNumber: 164
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "vic-squad-name", children: String(a.name || "").split(" ")[0] }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\victoryScreen.jsx",
            lineNumber: 136,
            columnNumber: 26
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "vic-squad-dmg", children: a._battleDamage ? a._battleDamage.toLocaleString() + " DMG" : "\u2014" }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\victoryScreen.jsx",
            lineNumber: 136,
            columnNumber: 100
          })
        ] }, a.id || i, true, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\victoryScreen.jsx",
          lineNumber: 131,
          columnNumber: 18
        });
      }) }, void 0, false, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\victoryScreen.jsx",
        lineNumber: 128,
        columnNumber: 65
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "vic-highlight-row", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "vic-highlight-card", style: {
          "--hl-color": rankInfo.color
        }, children: [
          /* @__PURE__ */ jsxDEV("div", { className: "vic-highlight-label", children: "TEAM DAMAGE" }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\victoryScreen.jsx",
            lineNumber: 139,
            columnNumber: 12
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "vic-highlight-val", children: /* @__PURE__ */ jsxDEV(TallyNumber, { target: report.totalTeamDamage, color: "#fff" }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\victoryScreen.jsx",
            lineNumber: 139,
            columnNumber: 101
          }) }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\victoryScreen.jsx",
            lineNumber: 139,
            columnNumber: 66
          })
        ] }, void 0, true, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\victoryScreen.jsx",
          lineNumber: 137,
          columnNumber: 53
        }),
        report.bestHitUnit && /* @__PURE__ */ jsxDEV("div", { className: "vic-highlight-card", style: {
          "--hl-color": "#ef4444"
        }, children: [
          /* @__PURE__ */ jsxDEV("div", { className: "vic-highlight-label", children: "BIGGEST HIT" }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\victoryScreen.jsx",
            lineNumber: 141,
            columnNumber: 12
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "vic-highlight-val", children: /* @__PURE__ */ jsxDEV(TallyNumber, { target: report.bestHitUnit._battleBestHit, color: "#ef4444" }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\victoryScreen.jsx",
            lineNumber: 141,
            columnNumber: 101
          }) }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\victoryScreen.jsx",
            lineNumber: 141,
            columnNumber: 66
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "vic-highlight-sub", children: String(report.bestHitUnit.name || "").split(" ")[0] }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\victoryScreen.jsx",
            lineNumber: 141,
            columnNumber: 181
          })
        ] }, void 0, true, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\victoryScreen.jsx",
          lineNumber: 139,
          columnNumber: 196
        }),
        report.topHealer && /* @__PURE__ */ jsxDEV("div", { className: "vic-highlight-card", style: {
          "--hl-color": "#4ade80"
        }, children: [
          /* @__PURE__ */ jsxDEV("div", { className: "vic-highlight-label", children: "TOP HEALER" }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\victoryScreen.jsx",
            lineNumber: 143,
            columnNumber: 12
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "vic-highlight-val", children: /* @__PURE__ */ jsxDEV(TallyNumber, { target: report.topHealer._battleHealing, color: "#4ade80" }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\victoryScreen.jsx",
            lineNumber: 143,
            columnNumber: 100
          }) }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\victoryScreen.jsx",
            lineNumber: 143,
            columnNumber: 65
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "vic-highlight-sub", children: String(report.topHealer.name || "").split(" ")[0] }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\victoryScreen.jsx",
            lineNumber: 143,
            columnNumber: 178
          })
        ] }, void 0, true, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\victoryScreen.jsx",
          lineNumber: 141,
          columnNumber: 303
        })
      ] }, void 0, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\victoryScreen.jsx",
        lineNumber: 137,
        columnNumber: 18
      })
    ] }, void 0, true, {
      fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\victoryScreen.jsx",
      lineNumber: 128,
      columnNumber: 12
    });
  };
  return /* @__PURE__ */ jsxDEV("div", { className: "battle-result-overlay", style: {
    background: "radial-gradient(circle at center, #1a1a2e 0%, #05050a 100%)",
    perspective: "1000px"
  }, children: [
    phase < 5 && /* @__PURE__ */ jsxDEV("button", { className: "vic-skip-btn", onClick: skipToEnd, children: "SKIP >>" }, void 0, false, {
      fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\victoryScreen.jsx",
      lineNumber: 148,
      columnNumber: 20
    }),
    /* @__PURE__ */ jsxDEV("div", { className: "anime-speed-lines", style: {
      opacity: 0.2
    } }, void 0, false, {
      fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\victoryScreen.jsx",
      lineNumber: 148,
      columnNumber: 94
    }),
    /* @__PURE__ */ jsxDEV("div", { className: "victory-particles-container", children: Array.from({
      length: 20
    }).map((_, i) => /* @__PURE__ */ jsxDEV("div", { className: "vic-particle", style: {
      left: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 2}s`,
      background: rankInfo.color
    } }, i, false, {
      fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\victoryScreen.jsx",
      lineNumber: 152,
      columnNumber: 24
    })) }, void 0, false, {
      fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\victoryScreen.jsx",
      lineNumber: 150,
      columnNumber: 10
    }),
    /* @__PURE__ */ jsxDEV("div", { style: {
      textAlign: "center",
      width: "100%",
      maxWidth: "800px",
      padding: "20px",
      zIndex: 10
    }, children: [
      /* @__PURE__ */ jsxDEV("div", { className: "animate-popIn", style: {
        color: rankInfo.color,
        letterSpacing: 12,
        fontWeight: 900,
        fontSize: "1.2rem",
        marginBottom: 20,
        textShadow: `0 0 20px ${rankInfo.color}`
      }, children: "JOB DONE" }, void 0, false, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\victoryScreen.jsx",
        lineNumber: 162,
        columnNumber: 8
      }),
      phase >= 1 && /* @__PURE__ */ jsxDEV("div", { className: "rank-container-vic", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "rank-letter-huge", style: {
          color: rankInfo.color,
          "--rank-glow": rankInfo.glow
        }, children: rankInfo.letter }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\victoryScreen.jsx",
          lineNumber: 169,
          columnNumber: 75
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "rank-desc-vic animate-popIn", style: {
          animationDelay: "0.2s"
        }, children: rankInfo.desc }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\victoryScreen.jsx",
          lineNumber: 172,
          columnNumber: 35
        })
      ] }, void 0, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\victoryScreen.jsx",
        lineNumber: 169,
        columnNumber: 39
      }),
      phase >= 2 && renderSquadReport(),
      phase >= 3 && /* @__PURE__ */ jsxDEV("div", { className: "victory-content-wrap", children: /* @__PURE__ */ jsxDEV("div", { className: "rewards-grid-vic animate-popIn", children: Object.entries(rewards).map(([key, val]) => {
        if (key === "items" || val <= 0) return null;
        const icons = {
          credits: /* @__PURE__ */ jsxDEV(Database, { size: 16 }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\victoryScreen.jsx",
            lineNumber: 177,
            columnNumber: 24
          }),
          gems: /* @__PURE__ */ jsxDEV(Gem, { size: 16 }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\victoryScreen.jsx",
            lineNumber: 178,
            columnNumber: 21
          }),
          aura: /* @__PURE__ */ jsxDEV(Zap, { size: 16 }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\victoryScreen.jsx",
            lineNumber: 179,
            columnNumber: 21
          }),
          materials: /* @__PURE__ */ jsxDEV(Package, { size: 16 }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\victoryScreen.jsx",
            lineNumber: 180,
            columnNumber: 26
          }),
          essence: /* @__PURE__ */ jsxDEV(Star, { size: 16 }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\victoryScreen.jsx",
            lineNumber: 181,
            columnNumber: 24
          }),
          xp: /* @__PURE__ */ jsxDEV(Activity, { size: 16 }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\victoryScreen.jsx",
            lineNumber: 182,
            columnNumber: 19
          })
        };
        const colors = {
          credits: "#facc15",
          gems: "#00d2ff",
          aura: "#a855f7",
          materials: "#94a3b8",
          essence: "#f97316",
          xp: "#f472b6"
        };
        return /* @__PURE__ */ jsxDEV("div", { className: "reward-stat-card-vic", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "reward-icon-vic", style: {
            color: colors[key]
          }, children: icons[key] }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\victoryScreen.jsx",
            lineNumber: 192,
            columnNumber: 68
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "reward-label-vic", children: key.toUpperCase() }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\victoryScreen.jsx",
            lineNumber: 194,
            columnNumber: 36
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "reward-val-vic", children: [
            key === "credits" && "$",
            /* @__PURE__ */ jsxDEV(TallyNumber, { target: val, color: colors[key] }, void 0, false, {
              fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\victoryScreen.jsx",
              lineNumber: 194,
              columnNumber: 153
            })
          ] }, void 0, true, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\victoryScreen.jsx",
            lineNumber: 194,
            columnNumber: 95
          })
        ] }, key, true, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\victoryScreen.jsx",
          lineNumber: 192,
          columnNumber: 20
        });
      }) }, void 0, false, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\victoryScreen.jsx",
        lineNumber: 174,
        columnNumber: 128
      }) }, void 0, false, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\victoryScreen.jsx",
        lineNumber: 174,
        columnNumber: 90
      }),
      phase >= 4 && rewards.items && rewards.items.length > 0 && /* @__PURE__ */ jsxDEV("div", { className: "victory-items-reveal animate-fadeIn", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "reward-header-vic", children: "LOOT ACQUIRED" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\victoryScreen.jsx",
          lineNumber: 195,
          columnNumber: 140
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "vic-items-grid", children: visibleItems.map((item, i) => /* @__PURE__ */ jsxDEV("div", { className: "vic-item-card animate-reward-pop", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "vic-item-icon", children: /* @__PURE__ */ jsxDEV(Package, { size: 20, color: "#facc15" }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\victoryScreen.jsx",
            lineNumber: 195,
            columnNumber: 346
          }) }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\victoryScreen.jsx",
            lineNumber: 195,
            columnNumber: 315
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "vic-item-name", children: item }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\victoryScreen.jsx",
            lineNumber: 195,
            columnNumber: 389
          })
        ] }, i, true, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\victoryScreen.jsx",
          lineNumber: 195,
          columnNumber: 257
        })) }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\victoryScreen.jsx",
          lineNumber: 195,
          columnNumber: 194
        })
      ] }, void 0, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\victoryScreen.jsx",
        lineNumber: 195,
        columnNumber: 87
      }),
      phase >= 5 && /* @__PURE__ */ jsxDEV("button", { className: "confirm-vic-btn animate-popIn", onClick: onConfirm, children: [
        /* @__PURE__ */ jsxDEV("div", { className: "btn-inner", children: "RETURN TO BASE" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\victoryScreen.jsx",
          lineNumber: 195,
          columnNumber: 538
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "btn-shine" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\victoryScreen.jsx",
          lineNumber: 195,
          columnNumber: 585
        })
      ] }, void 0, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\victoryScreen.jsx",
        lineNumber: 195,
        columnNumber: 468
      })
    ] }, void 0, true, {
      fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\victoryScreen.jsx",
      lineNumber: 156,
      columnNumber: 20
    })
  ] }, void 0, true, {
    fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\victoryScreen.jsx",
    lineNumber: 145,
    columnNumber: 10
  });
};
export {
  VictoryScreen
};
