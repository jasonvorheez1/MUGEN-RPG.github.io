// Split out of CombatSystem.js (token-efficiency pass): the post-battle
// VictoryScreen (reward reveal, tally animation, item drops). Self-contained
// -- doesn't depend on any of the other combat-helper modules. CombatSystem.js
// re-exports it unchanged so no other file's import statements needed to
// change.

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
  const allies = combatants.filter(c => !c.isEnemy);
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
  // BATTLE REPORT: per-ally damage/healing/best-hit totals were tracked live
  // during combat (attacker._battleDamage / _battleBestHit / _battleHealing).
  // Sort once here so the lineup and highlight cards agree on who did what.
  const report = useMemo(() => {
    const sorted = allies.slice().sort((a, b) => (b._battleDamage || 0) - (a._battleDamage || 0));
    const topDamage = sorted[0];
    const bestHitUnit = allies.slice().sort((a, b) => (b._battleBestHit || 0) - (a._battleBestHit || 0))[0];
    const topHealer = allies.slice().sort((a, b) => (b._battleHealing || 0) - (a._battleHealing || 0))[0];
    const totalTeamDamage = allies.reduce((s, a) => s + (a._battleDamage || 0), 0);
    return {
      sorted,
      mvp: topDamage && topDamage._battleDamage > 0 ? topDamage : allies.filter(a => !a.dead).sort((a, b) => b.hp - a.hp)[0] || allies[0],
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
          setVisibleItems(prev => [...prev, item]);
          playSound("item_pop", 0.3);
        }, i * 250);
        pendingTimeouts.current.push(t);
      });
    }
  }, [phase, rewards.items]);
  // SKIP: an impatient/repeat player can jump straight to the confirm button
  // instead of sitting through ~6.7s of staged reveals every single battle.
  // Cancels every still-pending timeout and instantly reveals everything
  // that timeout chain would have shown (loot items included).
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
    return <div className="victory-squad-report animate-fadeIn"><div className="vic-squad-row">{report.sorted.map((a, i) => {
          const hpPct = Math.max(0, a.hp / a.maxHp * 100);
          const isTop = a === report.mvp && a._battleDamage > 0;
          return <div key={a.id || i} className={`vic-squad-card ${a.dead ? "ko" : ""} ${isTop ? "top" : ""}`} style={{
            animationDelay: `${i * 0.08}s`
          }}>{isTop && <div className="vic-squad-crown">★ MVP</div>}<img src={a.img} className="vic-squad-img" />{a.dead && <div className="vic-squad-ko">KO</div>}<div className="vic-squad-hpbar"><div className="vic-squad-hpfill" style={{
                width: `${hpPct}%`,
                background: hpPct > 60 ? "#22c55e" : hpPct > 25 ? "#facc15" : "#ef4444"
              }} /></div><div className="vic-squad-name">{String(a.name || "").split(" ")[0]}</div><div className="vic-squad-dmg">{a._battleDamage ? a._battleDamage.toLocaleString() + " DMG" : "—"}</div></div>;
        })}</div><div className="vic-highlight-row"><div className="vic-highlight-card" style={{
          "--hl-color": rankInfo.color
        }}><div className="vic-highlight-label">TEAM DAMAGE</div><div className="vic-highlight-val"><TallyNumber target={report.totalTeamDamage} color="#fff" /></div></div>{report.bestHitUnit && <div className="vic-highlight-card" style={{
          "--hl-color": "#ef4444"
        }}><div className="vic-highlight-label">BIGGEST HIT</div><div className="vic-highlight-val"><TallyNumber target={report.bestHitUnit._battleBestHit} color="#ef4444" /></div><div className="vic-highlight-sub">{String(report.bestHitUnit.name || "").split(" ")[0]}</div></div>}{report.topHealer && <div className="vic-highlight-card" style={{
          "--hl-color": "#4ade80"
        }}><div className="vic-highlight-label">TOP HEALER</div><div className="vic-highlight-val"><TallyNumber target={report.topHealer._battleHealing} color="#4ade80" /></div><div className="vic-highlight-sub">{String(report.topHealer.name || "").split(" ")[0]}</div></div>}</div></div>;
  };
  return <div className="battle-result-overlay" style={{
    background: "radial-gradient(circle at center, #1a1a2e 0%, #05050a 100%)",
    perspective: "1000px"
  }}>{phase < 5 && <button className="vic-skip-btn" onClick={skipToEnd}>{"SKIP >>"}</button>}<div className="anime-speed-lines" style={{
      opacity: 0.2
    }} /><div className="victory-particles-container">{Array.from({
        length: 20
      }).map((_, i) => <div key={i} className="vic-particle" style={{
        left: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 2}s`,
        background: rankInfo.color
      }} />)}</div><div style={{
      textAlign: "center",
      width: "100%",
      maxWidth: "800px",
      padding: "20px",
      zIndex: 10
    }}><div className="animate-popIn" style={{
        color: rankInfo.color,
        letterSpacing: 12,
        fontWeight: 900,
        fontSize: "1.2rem",
        marginBottom: 20,
        textShadow: `0 0 20px ${rankInfo.color}`
      }}>JOB DONE</div>{phase >= 1 && <div className="rank-container-vic"><div className="rank-letter-huge" style={{
          color: rankInfo.color,
          "--rank-glow": rankInfo.glow
        }}>{rankInfo.letter}</div><div className="rank-desc-vic animate-popIn" style={{
          animationDelay: "0.2s"
        }}>{rankInfo.desc}</div></div>}{phase >= 2 && renderSquadReport()}{phase >= 3 && <div className="victory-content-wrap"><div className="rewards-grid-vic animate-popIn">{Object.entries(rewards).map(([key, val]) => {
            if (key === "items" || val <= 0) return null;
            const icons = {
              credits: <Database size={16} />,
              gems: <Gem size={16} />,
              aura: <Zap size={16} />,
              materials: <Package size={16} />,
              essence: <Star size={16} />,
              xp: <Activity size={16} />
            };
            const colors = {
              credits: "#facc15",
              gems: "#00d2ff",
              aura: "#a855f7",
              materials: "#94a3b8",
              essence: "#f97316",
              xp: "#f472b6"
            };
            return <div key={key} className="reward-stat-card-vic"><div className="reward-icon-vic" style={{
                color: colors[key]
              }}>{icons[key]}</div><div className="reward-label-vic">{key.toUpperCase()}</div><div className="reward-val-vic">{key === "credits" && "$"}<TallyNumber target={val} color={colors[key]} /></div></div>;
          })}</div></div>}{phase >= 4 && rewards.items && rewards.items.length > 0 && <div className="victory-items-reveal animate-fadeIn"><div className="reward-header-vic">LOOT ACQUIRED</div><div className="vic-items-grid">{visibleItems.map((item, i) => <div key={i} className="vic-item-card animate-reward-pop"><div className="vic-item-icon"><Package size={20} color="#facc15" /></div><div className="vic-item-name">{item}</div></div>)}</div></div>}{phase >= 5 && <button className="confirm-vic-btn animate-popIn" onClick={onConfirm}><div className="btn-inner">RETURN TO BASE</div><div className="btn-shine" /></button>}</div></div>;
};
export { VictoryScreen };