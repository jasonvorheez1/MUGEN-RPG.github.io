import { jsxDEV } from "react/jsx-dev-runtime";
import React, { useState, useRef, useEffect, useMemo } from "react";
import gsap from "gsap";
import { Zap, Shield, Sparkles, Flame, Snowflake, Skull, Activity, ArrowUpCircle, ArrowDownCircle, Ban } from "lucide-react";
import { ELEMENTS } from "../constants.js";
import { getGaugeGain } from "../utils.js";
import { getBattleStats, describeEffect, getCastAnimMs, getLungeMs, getBasicAttackMs } from "./battleHelpers.js";
const TacticalStanceRow = ({
  currentStance,
  onStanceChange
}) => {
  return /* @__PURE__ */ jsxDEV("div", { className: "element-switcher", children: ["FIRE", "WATER", "WIND", "LIGHT", "DARK", "EARTH"].map((el) => /* @__PURE__ */ jsxDEV("div", { className: `element-icon ${currentStance === el ? "active" : ""}`, style: {
    "--el-color": ELEMENTS[el].color,
    borderColor: ELEMENTS[el].color,
    background: currentStance === el ? ELEMENTS[el].color : "transparent"
  }, onClick: () => onStanceChange(el), children: el[0] }, el, false, {
    fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\battleUI.jsx",
    lineNumber: 17,
    columnNumber: 107
  })) }, void 0, false, {
    fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\battleUI.jsx",
    lineNumber: 17,
    columnNumber: 10
  });
};
const Projectile = ({
  fromX,
  fromY,
  dx,
  dy,
  color,
  delayMs,
  onDone
}) => {
  useEffect(() => {
    const t = setTimeout(onDone, delayMs + 550);
    return () => clearTimeout(t);
  }, []);
  const angleDeg = Math.atan2(dy, dx) * (180 / Math.PI);
  return /* @__PURE__ */ jsxDEV("div", { className: "projectile-wrap", style: {
    left: fromX,
    top: fromY,
    "--dx": `${dx}px`,
    "--dy": `${dy}px`,
    "--proj-delay": `${delayMs}ms`
  }, children: [
    /* @__PURE__ */ jsxDEV("div", { className: "projectile-orb", style: {
      "--proj-color": color
    } }, void 0, false, {
      fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\battleUI.jsx",
      lineNumber: 54,
      columnNumber: 6
    }),
    /* @__PURE__ */ jsxDEV("div", { className: "projectile-trail", style: {
      "--proj-color": color,
      "--proj-angle": `${angleDeg}deg`
    } }, void 0, false, {
      fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\battleUI.jsx",
      lineNumber: 56,
      columnNumber: 10
    })
  ] }, void 0, true, {
    fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\battleUI.jsx",
    lineNumber: 48,
    columnNumber: 10
  });
};
const ProjectileLayer = ({
  combatants = [],
  containerRef
}) => {
  const [projectiles, setProjectiles] = useState([]);
  const seenRef = useRef({});
  useEffect(() => {
    const fresh = combatants.filter((u) => u.lastProjectile && u.lastProjectile.time && seenRef.current[u.id] !== u.lastProjectile.time);
    if (!fresh.length) return;
    const container = containerRef?.current;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    const spawned = [];
    fresh.forEach((u) => {
      const proj = u.lastProjectile;
      const fromEl = document.getElementById(`battle-unit-${u.id}`);
      if (!fromEl) return;
      seenRef.current[u.id] = proj.time;
      const fromRect = fromEl.getBoundingClientRect();
      const fromX = fromRect.left + fromRect.width / 2 - containerRect.left;
      const fromY = fromRect.top + fromRect.height / 2 - containerRect.top;
      (proj.targetIds || []).forEach((tid, i) => {
        const toEl = document.getElementById(`battle-unit-${tid}`);
        if (!toEl) return;
        const toRect = toEl.getBoundingClientRect();
        const toX = toRect.left + toRect.width / 2 - containerRect.left;
        const toY = toRect.top + toRect.height / 2 - containerRect.top;
        spawned.push({
          id: `${u.id}-${proj.time}-${tid}`,
          fromX,
          fromY,
          dx: toX - fromX,
          dy: toY - fromY,
          color: proj.color,
          delayMs: i * 70
        });
      });
    });
    if (spawned.length) setProjectiles((prev) => [...prev, ...spawned]);
  }, [combatants, containerRef]);
  const removeOne = (id) => setProjectiles((prev) => prev.filter((p) => p.id !== id));
  return /* @__PURE__ */ jsxDEV("div", { className: "projectile-layer", children: projectiles.map((p) => /* @__PURE__ */ jsxDEV(Projectile, { ...p, onDone: () => removeOne(p.id) }, p.id, false, {
    fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\battleUI.jsx",
    lineNumber: 123,
    columnNumber: 66
  })) }, void 0, false, {
    fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\battleUI.jsx",
    lineNumber: 123,
    columnNumber: 10
  });
};
const TurnOrderStrip = ({
  combatants,
  playerElement,
  combatSpeed
}) => {
  const living = (combatants || []).filter((c) => !c.dead);
  if (!living.length) return null;
  const speeds = living.map((u) => getBattleStats(u, playerElement, u.activeSynergies || []).speed);
  const order = living.map((u) => {
    const spd = getBattleStats(u, playerElement, u.activeSynergies || []).speed;
    const rate = Math.max(0.1, getGaugeGain(spd, speeds, combatSpeed));
    const eta = Math.max(0, (100 - (u.gauge || 0)) / rate);
    return {
      u,
      eta
    };
  }).sort((a, b) => a.eta - b.eta).slice(0, 6);
  return /* @__PURE__ */ jsxDEV("div", { className: "turn-order-strip", children: [
    /* @__PURE__ */ jsxDEV("span", { className: "turn-order-label", children: "NEXT" }, void 0, false, {
      fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\battleUI.jsx",
      lineNumber: 147,
      columnNumber: 44
    }),
    order.map(({
      u,
      eta
    }, i) => /* @__PURE__ */ jsxDEV("div", { className: `turn-order-chip ${u.isEnemy ? "enemy" : "ally"} ${i === 0 ? "imminent" : ""}`, title: `${u.name} \u2014 next in ~${Math.ceil(eta)} ticks`, children: /* @__PURE__ */ jsxDEV("img", { src: u._cameoImg || u.img, alt: u.name }, void 0, false, {
      fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\battleUI.jsx",
      lineNumber: 150,
      columnNumber: 176
    }) }, u.id, false, {
      fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\battleUI.jsx",
      lineNumber: 150,
      columnNumber: 14
    }))
  ] }, void 0, true, {
    fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\battleUI.jsx",
    lineNumber: 147,
    columnNumber: 10
  });
};
const BattleUnit = ({
  unit,
  isMarked,
  onMark,
  floatingDamages,
  playerElement,
  reducedFx = false,
  combatSpeed = 1
}) => {
  const [isHit, setIsHit] = useState(false);
  const [hitBurst, setHitBurst] = useState(0);
  const lastComboTime = useRef(0);
  const [isDazed, setIsDazed] = useState(false);
  const lastHitstunUntil = useRef(0);
  useEffect(() => {
    const until = unit._hitstunUntil || 0;
    if (until <= lastHitstunUntil.current) return;
    lastHitstunUntil.current = until;
    const remaining = until - Date.now();
    if (remaining <= 0) return;
    setIsDazed(true);
    const t = setTimeout(() => setIsDazed(false), remaining);
    return () => clearTimeout(t);
  }, [unit._hitstunUntil]);
  const [ghostHpPercent, setGhostHpPercent] = useState(0);
  const prevHp = useRef(unit.hp);
  const hpPercent = unit.hp / unit.maxHp * 100;
  const [activeGif, setActiveGif] = useState(null);
  const gifRef = useRef(null);
  const gifSeq = useRef(0);
  const playGif = (src) => {
    const seq = ++gifSeq.current;
    setActiveGif({
      src,
      key: seq
    });
  };
  useEffect(() => {
    if (!activeGif || !gifRef.current) return;
    gsap.fromTo(gifRef.current, {
      scale: 0.2,
      opacity: 0
    }, {
      scale: 1.5,
      opacity: 1,
      duration: 0.18,
      ease: "back.out(3)",
      onComplete: () => {
        gsap.to(gifRef.current, {
          opacity: 0,
          scale: 1.8,
          duration: 0.35,
          delay: 0.15
        });
      }
    });
    const timer = setTimeout(() => setActiveGif((cur) => cur && cur.key === activeGif.key ? null : cur), 700);
    return () => clearTimeout(timer);
  }, [activeGif]);
  const prevEffectTypes = useRef(/* @__PURE__ */ new Set());
  useEffect(() => {
    const curTypes = new Set(unit.effects.map((e) => e.type));
    if (curTypes.has("buff_elemdmg") && !prevEffectTypes.current.has("buff_elemdmg")) playGif("effectsnew/holy.gif");
    else if (curTypes.has("crushed") && !prevEffectTypes.current.has("crushed")) playGif("effectsnew/popupflash.gif");
    else if (curTypes.has("burn") && !prevEffectTypes.current.has("burn")) playGif("effectsnew/fire.gif");
    else if (curTypes.has("freeze") && !prevEffectTypes.current.has("freeze")) playGif("effectsnew/ice.gif");
    else if (curTypes.has("poison") && !prevEffectTypes.current.has("poison")) playGif("effectsnew/poison.gif");
    else if (curTypes.has("static") && !prevEffectTypes.current.has("static")) playGif("fx_lightning.png");
    prevEffectTypes.current = curTypes;
  }, [unit.effects]);
  const prevMsg = useRef(null);
  useEffect(() => {
    const msg = unit.lastAction?.msg;
    if (msg && msg !== prevMsg.current) {
      if (msg === "SAVED!") playGif("effectsnew/holy.gif");
      else if (unit.lastAction?.type === "shield_break") playGif("effectsnew/popupflash.gif");
    }
    prevMsg.current = msg;
  }, [unit.lastAction?.msg]);
  const [lungeKind, setLungeKind] = useState(null);
  const [animMs, setAnimMs] = useState(null);
  const scaleMs = (ms) => Math.max(200, Math.round(ms / (combatSpeed || 1)));
  const [rush, setRush] = useState(null);
  const prevActTime = useRef(null);
  useEffect(() => {
    const act = unit.lastAction;
    if (!act || act.time === prevActTime.current) return;
    prevActTime.current = act.time;
    if (["normal", "magic", "basic", "shield_break"].includes(act.type)) {
      if (act.type === "basic" && !reducedFx) {
        const fromEl = document.getElementById(`battle-unit-${unit.id}`);
        const toEl = act.targetId != null ? document.getElementById(`battle-unit-${act.targetId}`) : null;
        if (fromEl && toEl) {
          const a = fromEl.getBoundingClientRect();
          const b = toEl.getBoundingClientRect();
          const dx = Math.max(-520, Math.min(520, (b.left + b.width / 2 - (a.left + a.width / 2)) * 0.72));
          const dy = Math.max(-420, Math.min(420, (b.top + b.height / 2 - (a.top + a.height / 2)) * 0.72));
          setRush({
            "--rush-dx": `${dx.toFixed(1)}px`,
            "--rush-dy": `${dy.toFixed(1)}px`
          });
          const kind = act.meleeAir ? "rush-air" : "rush-combo";
          setLungeKind(kind);
          const dur2 = scaleMs(getBasicAttackMs(act.meleeAir));
          setAnimMs(dur2);
          const t2 = setTimeout(() => {
            setLungeKind(null);
            setRush(null);
            setAnimMs(null);
          }, dur2);
          return () => clearTimeout(t2);
        }
      }
      const castAnim = act.type !== "basic" ? unit.lastCastAnim : null;
      if (castAnim) {
        setLungeKind(castAnim);
        const dur2 = scaleMs(getCastAnimMs(castAnim));
        setAnimMs(dur2);
        const t2 = setTimeout(() => {
          setLungeKind(null);
          setAnimMs(null);
        }, dur2);
        return () => clearTimeout(t2);
      }
      setLungeKind(act.crit ? "lunge-crit" : "lunge");
      const dur = scaleMs(getLungeMs(act.crit));
      setAnimMs(dur);
      const t = setTimeout(() => {
        setLungeKind(null);
        setAnimMs(null);
      }, dur);
      return () => clearTimeout(t);
    }
  }, [unit.lastAction?.time]);
  useEffect(() => {
    if (unit.hp < prevHp.current) {
      let hits = 1;
      if (unit._comboHitsTime && unit._comboHitsTime !== lastComboTime.current) {
        lastComboTime.current = unit._comboHitsTime;
        hits = Math.max(1, unit._comboHits || 1);
      }
      setIsHit(true);
      setHitBurst(hits);
      setGhostHpPercent(prevHp.current / unit.maxHp * 100);
      if (!activeGif) playGif("effectsnew/popupflash.gif");
      const dur = hits > 1 ? Math.min(620, 200 + hits * 80) : 250;
      const timer = setTimeout(() => {
        setIsHit(false);
        setHitBurst(0);
      }, dur);
      return () => clearTimeout(timer);
    } else if (unit.hp > prevHp.current) {
      playGif("effectsnew/popupchomp.gif");
      setGhostHpPercent(hpPercent);
    } else {
      setGhostHpPercent(hpPercent);
    }
    prevHp.current = unit.hp;
  }, [unit.hp, unit.maxHp]);
  const isActiveTurn = unit.gauge >= 100 && !unit.dead;
  const stance = unit.effects.find((e) => e.type === "tactical_stance");
  const isStaggered = unit.effects.some((e) => e.label === "STAGGERED") && !unit.dead;
  const isFrozen = unit.effects.some((e) => e.type === "freeze") && !unit.dead;
  const isStunned = unit.effects.some((e) => e.type === "stun") && !unit.dead;
  const isBurned = unit.effects.some((e) => e.type === "burn") && !unit.dead;
  const isStatic = unit.effects.some((e) => e.type === "static") && !unit.dead;
  const isElemEmpowered = unit.effects.some((e) => e.type === "buff_elemdmg") && !unit.dead;
  const isCrushed = unit.effects.some((e) => e.type === "crushed") && !unit.dead;
  const isBroken = unit.effects.some((e) => e.type === "broken") && !unit.dead;
  const isTelegraphing = unit.isEnemy && !unit.dead && (unit.gauge || 0) >= 78;
  const groupedEffects = useMemo(() => {
    const groups = {};
    unit.effects.forEach((e) => {
      if (e.type === "tactical_stance") return;
      const key = e.type + (e.label || "");
      if (!groups[key]) groups[key] = {
        ...e,
        count: 0,
        maxDur: 0
      };
      groups[key].count++;
      groups[key].maxDur = Math.max(groups[key].maxDur, e.duration);
    });
    return Object.values(groups);
  }, [unit.effects]);
  const hpColor = hpPercent > 60 ? "#22c55e" : hpPercent > 25 ? "#facc15" : "#ef4444";
  const shieldEffect = unit.effects.find((e) => e.type === "shield");
  const hasShield = !!shieldEffect;
  const shieldHpPercent = shieldEffect ? shieldEffect.maxHp ? shieldEffect.remainingHp / shieldEffect.maxHp * 100 : Math.min(300, Math.max(0, (shieldEffect.val || 0) * 100)) : 0;
  const s1Ready = unit.skillCd >= unit.maxSkillCd;
  const s2Ready = unit.skillId2 && unit.skillCd2 >= unit.maxSkillCd2;
  const [shieldHitActive, setShieldHitActive] = useState(false);
  useEffect(() => {
    if (unit._shieldHit) {
      setShieldHitActive(true);
      const t = setTimeout(() => {
        setShieldHitActive(false);
        unit._shieldHit = false;
      }, 300);
      return () => clearTimeout(t);
    }
  }, [unit._shieldHit]);
  const [shieldBrokeActive, setShieldBrokeActive] = useState(false);
  useEffect(() => {
    if (unit._shieldBroke) {
      setShieldBrokeActive(true);
      const t = setTimeout(() => {
        setShieldBrokeActive(false);
        unit._shieldBroke = false;
      }, 700);
      return () => clearTimeout(t);
    }
  }, [unit._shieldBroke]);
  const [cutInActive, setCutInActive] = useState(false);
  const [cutInLabel, setCutInLabel] = useState("");
  useEffect(() => {
    if (unit._cutIn) {
      setCutInLabel(unit._cutIn.label || "CUT IN!");
      setCutInActive(true);
      const t = setTimeout(() => {
        setCutInActive(false);
        unit._cutIn = null;
      }, 950);
      return () => clearTimeout(t);
    }
  }, [unit._cutIn]);
  const stanceElement = stance ? stance.label.split(":")[1] : null;
  const stanceColor = stanceElement ? ELEMENTS[stanceElement]?.color : "#fff";
  return /* @__PURE__ */ jsxDEV("div", { id: `battle-unit-${unit.id}`, className: `battle-unit ${unit.isEnemy ? "is-enemy" : "is-ally"} ${unit.dead ? "dead-dissolve" : "battle-unit-idle"} ${isActiveTurn ? "acting active-turn" : ""} ${isHit ? "is-hit" : ""} ${hitBurst > 1 ? "combo-rattle" : ""} ${isDazed && !unit.dead ? "is-dazed" : ""} ${isMarked ? "is-marked" : ""} ${unit.isBoss ? "is-boss" : ""} ${isStaggered ? "staggered-unit" : ""} ${unit.cosmetics?.borderClass || ""} ${stance ? "stance-glow-active" : ""} ${hasShield ? "has-active-shield" : ""} ${isFrozen ? "is-frozen" : ""} ${isStunned ? "is-stunned" : ""} ${isBurned ? "is-burned" : ""} ${isStatic ? "is-static" : ""} ${isElemEmpowered ? "is-elem-empowered" : ""} ${isCrushed ? "is-crushed" : ""} ${isBroken ? "is-broken" : ""} ${isTelegraphing ? "is-telegraphing" : ""} ${reducedFx ? "" : lungeKind || ""} ${unit.dead && unit.name === "Jimmy Neutron" && !reducedFx ? "gore-finale" : ""}`, onClick: () => unit.isEnemy && onMark && onMark(), style: {
    "--stance-color": stanceColor,
    "--cast-tint": ELEMENTS[unit.element]?.color || "#fff",
    "--delay": `${(Math.random() * 2).toFixed(2)}s`,
    ...rush || {}
  }, children: [
    isMarked && /* @__PURE__ */ jsxDEV("div", { className: "target-marker animate-pulse", children: "MARK" }, void 0, false, {
      fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\battleUI.jsx",
      lineNumber: 424,
      columnNumber: 19
    }),
    isTelegraphing && /* @__PURE__ */ jsxDEV("div", { className: "attack-telegraph", children: "!" }, void 0, false, {
      fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\battleUI.jsx",
      lineNumber: 424,
      columnNumber: 94
    }),
    stance && /* @__PURE__ */ jsxDEV("div", { className: "stance-indicator-tag", style: {
      "--stance-color": stanceColor
    }, children: [
      /* @__PURE__ */ jsxDEV("div", { className: "stance-icon-mini" }, void 0, false, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\battleUI.jsx",
        lineNumber: 426,
        columnNumber: 8
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "stance-label-mini", children: [
        stanceElement,
        " STANCE ",
        stanceElement === "FIRE" ? "+ATK" : stanceElement === "WATER" ? "+DEF" : stanceElement === "WIND" ? "+SPD" : stanceElement === "DARK" ? "+CRIT" : ""
      ] }, void 0, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\battleUI.jsx",
        lineNumber: 426,
        columnNumber: 44
      })
    ] }, void 0, true, {
      fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\battleUI.jsx",
      lineNumber: 424,
      columnNumber: 147
    }),
    /* @__PURE__ */ jsxDEV("div", { className: "hit-flash-overlay" }, void 0, false, {
      fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\battleUI.jsx",
      lineNumber: 426,
      columnNumber: 265
    }),
    /* @__PURE__ */ jsxDEV("div", { className: `unit-avatar-wrapper ${unit.isBoss ? "boss-size" : "std-size"} ${unit.gauge >= 100 ? "active-turn" : ""}`, style: {
      position: "relative",
      // Overrides just the duration portion of whatever `animation` shorthand
      // the active cast-X/lunge/rush class supplies (inline styles win the
      // cascade for that property), keeping the VISIBLE animation length in
      // lockstep with the speed-scaled hit-stop lock above -- see animMs.
      ...animMs != null ? { animationDuration: `${animMs}ms` } : {}
    }, children: [
      hasShield && /* @__PURE__ */ jsxDEV("div", { className: `shield-vfx-overlay ${shieldHitActive ? "shield-hit" : ""}` }, void 0, false, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\battleUI.jsx",
        lineNumber: 433,
        columnNumber: 22
      }),
      // Distinct from the generic shield-hit flash above: only fires the instant
      // a shield's pool actually empties, not on every hit it merely absorbs.
      // The shield effect is already gone by this point (hasShield is false),
      // so this is gated on shieldBrokeActive alone, not hasShield.
      shieldBrokeActive && /* @__PURE__ */ jsxDEV("div", { className: "shield-pop-flash", children: "SHIELD BROKEN" }, void 0, false, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\battleUI.jsx",
        lineNumber: 438,
        columnNumber: 28
      }),
      // CUT-IN interrupt: a diagonal slash sweep + ghost portrait bursting in
      // from the side, distinct from every existing cast/hit visual so a
      // reactive trigger reads unmistakably as "butting into someone else's
      // turn," not as this unit's own normal action.
      cutInActive && /* @__PURE__ */ jsxDEV("div", { className: "cut-in-overlay", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "cut-in-slash" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\battleUI.jsx",
          lineNumber: 443,
          columnNumber: 54
        }),
        /* @__PURE__ */ jsxDEV("img", { className: "cut-in-portrait-ghost", src: unit._cameoImg || unit.img }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\battleUI.jsx",
          lineNumber: 443,
          columnNumber: 86
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "cut-in-text", children: cutInLabel }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\battleUI.jsx",
          lineNumber: 443,
          columnNumber: 160
        })
      ] }, void 0, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\battleUI.jsx",
        lineNumber: 443,
        columnNumber: 22
      }),
      hasShield && shieldEffect.val > 0 && /* @__PURE__ */ jsxDEV("div", { className: "shield-strength-chip", children: [
        "SHLD ",
        Math.round(shieldHpPercent),
        "%"
      ] }, void 0, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\battleUI.jsx",
        lineNumber: 443,
        columnNumber: 252
      }),
      /* @__PURE__ */ jsxDEV("img", { src: (unit.effects.find((e) => e.type === "phantom_veil") || {}).transformImg || unit._cameoImg || unit.img, className: `unit-avatar ${unit.effects.some((e) => e.type === "phantom_veil") ? "phantom-transform" : unit._cameoImg ? "cameo-morph" : ""}`, style: {
        ...unit.cosmetics?.auraStyle,
        width: "100%",
        height: "100%"
      } }, void 0, false, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\battleUI.jsx",
        lineNumber: 443,
        columnNumber: 332
      }),
      activeGif && /* @__PURE__ */ jsxDEV("img", { ref: gifRef, src: activeGif.src, className: "combat-fx-gif" }, activeGif.key, false, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\battleUI.jsx",
        lineNumber: 447,
        columnNumber: 26
      }),
      isStaggered && /* @__PURE__ */ jsxDEV("div", { className: "stagger-badge", style: {
        backgroundImage: "url(effectsnew/popupwords.gif)",
        backgroundSize: "100% 100%",
        backgroundColor: "transparent"
      }, children: "STAGGERED" }, void 0, false, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\battleUI.jsx",
        lineNumber: 447,
        columnNumber: 129
      }),
      groupedEffects.length > 0 && /* @__PURE__ */ jsxDEV("div", { className: "status-effect-row", children: groupedEffects.map((e, i) => {
        let icon = /* @__PURE__ */ jsxDEV(Activity, { size: 10 }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\battleUI.jsx",
          lineNumber: 452,
          columnNumber: 22
        });
        let statusClass = "status-special";
        if (e.type === "burn") {
          icon = /* @__PURE__ */ jsxDEV(Flame, { size: 10 }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\battleUI.jsx",
            lineNumber: 455,
            columnNumber: 20
          });
          statusClass = "status-debuff";
        } else if (e.type === "freeze") {
          icon = /* @__PURE__ */ jsxDEV(Snowflake, { size: 10 }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\battleUI.jsx",
            lineNumber: 458,
            columnNumber: 20
          });
          statusClass = "status-stun";
        } else if (e.type === "poison") {
          icon = /* @__PURE__ */ jsxDEV(Skull, { size: 10 }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\battleUI.jsx",
            lineNumber: 461,
            columnNumber: 20
          });
          statusClass = "status-debuff";
        } else if (e.type === "stun") {
          icon = /* @__PURE__ */ jsxDEV(Ban, { size: 10 }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\battleUI.jsx",
            lineNumber: 464,
            columnNumber: 20
          });
          statusClass = "status-stun";
        } else if (e.type === "static") {
          icon = /* @__PURE__ */ jsxDEV(Zap, { size: 10 }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\battleUI.jsx",
            lineNumber: 467,
            columnNumber: 20
          });
          statusClass = "status-debuff";
        } else if (e.type === "shield") {
          icon = /* @__PURE__ */ jsxDEV(Shield, { size: 10 }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\battleUI.jsx",
            lineNumber: 470,
            columnNumber: 20
          });
          statusClass = "status-shield";
        } else if (e.type === "buff_elemdmg") {
          icon = /* @__PURE__ */ jsxDEV(Sparkles, { size: 10 }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\battleUI.jsx",
            lineNumber: 473,
            columnNumber: 20
          });
          statusClass = "status-elemental";
        } else if (e.type === "crushed") {
          icon = /* @__PURE__ */ jsxDEV(ArrowDownCircle, { size: 10 }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\battleUI.jsx",
            lineNumber: 476,
            columnNumber: 20
          });
          statusClass = "status-crush";
        } else if (e.type.startsWith("buff")) {
          icon = /* @__PURE__ */ jsxDEV(ArrowUpCircle, { size: 10 }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\battleUI.jsx",
            lineNumber: 479,
            columnNumber: 20
          });
          statusClass = "status-buff";
        } else if (e.type.startsWith("debuff")) {
          icon = /* @__PURE__ */ jsxDEV(ArrowDownCircle, { size: 10 }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\battleUI.jsx",
            lineNumber: 482,
            columnNumber: 20
          });
          statusClass = "status-debuff";
        }
        const desc = describeEffect(e);
        return /* @__PURE__ */ jsxDEV("div", { className: `status-badge ${statusClass}`, title: desc.full, children: [
          icon,
          desc.short && /* @__PURE__ */ jsxDEV("span", { className: "status-label", children: desc.short }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\battleUI.jsx",
            lineNumber: 486,
            columnNumber: 112
          }),
          e.count > 1 && /* @__PURE__ */ jsxDEV("span", { className: "stack-count", children: [
            "x",
            e.count
          ] }, void 0, true, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\battleUI.jsx",
            lineNumber: 486,
            columnNumber: 179
          }),
          /* @__PURE__ */ jsxDEV("span", { className: "duration-text", children: e.maxDur }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\battleUI.jsx",
            lineNumber: 486,
            columnNumber: 227
          })
        ] }, i, true, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\battleUI.jsx",
          lineNumber: 486,
          columnNumber: 18
        });
      }) }, void 0, false, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\battleUI.jsx",
        lineNumber: 451,
        columnNumber: 56
      })
    ] }, void 0, true, {
      fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\battleUI.jsx",
      lineNumber: 426,
      columnNumber: 302
    }),
    /* @__PURE__ */ jsxDEV("div", { className: "unit-bars", style: {
      marginTop: 5
    }, children: [
      /* @__PURE__ */ jsxDEV("div", { className: "battle-bar-mini hp-bar-container", style: {
        height: 12
      }, children: [
        /* @__PURE__ */ jsxDEV("div", { className: "hp-fill-ghost", style: {
          width: `${ghostHpPercent}%`
        } }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\battleUI.jsx",
          lineNumber: 491,
          columnNumber: 10
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "hp-fill", style: {
          width: `${hpPercent}%`,
          background: hpColor
        } }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\battleUI.jsx",
          lineNumber: 493,
          columnNumber: 14
        }),
        hasShield && shieldHpPercent > 0 && /* @__PURE__ */ jsxDEV("div", { className: "shield-bar-segment", style: {
          width: `${shieldHpPercent}%`
        } }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\battleUI.jsx",
          lineNumber: 496,
          columnNumber: 51
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "hp-text-overlay", children: [
          hasShield ? `[${Number.isFinite(shieldEffect.remainingHp) ? Math.floor(shieldEffect.remainingHp) : Math.floor(Math.min(3, Math.max(0, shieldEffect.val || 0)) * unit.maxHp)}] ` : "",
          Number.isFinite(unit.hp) ? Math.floor(unit.hp) : 0
        ] }, void 0, true, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\battleUI.jsx",
          lineNumber: 498,
          columnNumber: 15
        })
      ] }, void 0, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\battleUI.jsx",
        lineNumber: 489,
        columnNumber: 8
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "battle-bar-mini gauge-bar", style: {
        height: 4
      }, children: /* @__PURE__ */ jsxDEV("div", { className: "gauge-fill", style: {
        width: `${unit.gauge}%`
      } }, void 0, false, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\battleUI.jsx",
        lineNumber: 500,
        columnNumber: 10
      }) }, void 0, false, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\battleUI.jsx",
        lineNumber: 498,
        columnNumber: 294
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "unit-skill-labels", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "battle-bar-mini skill-bar", children: /* @__PURE__ */ jsxDEV("div", { className: "skill1-fill", style: {
          width: `${Math.min(100, unit.skillCd / unit.maxSkillCd * 100)}%`
        } }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\battleUI.jsx",
          lineNumber: 502,
          columnNumber: 98
        }) }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\battleUI.jsx",
          lineNumber: 502,
          columnNumber: 55
        }),
        unit.skillId2 && /* @__PURE__ */ jsxDEV("div", { className: "battle-bar-mini skill-bar", children: /* @__PURE__ */ jsxDEV("div", { className: "skill2-fill", style: {
          width: `${Math.min(100, unit.skillCd2 / unit.maxSkillCd2 * 100)}%`
        } }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\battleUI.jsx",
          lineNumber: 504,
          columnNumber: 83
        }) }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\battleUI.jsx",
          lineNumber: 504,
          columnNumber: 40
        })
      ] }, void 0, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\battleUI.jsx",
        lineNumber: 502,
        columnNumber: 20
      }),
      !unit.isEnemy && /* @__PURE__ */ jsxDEV("div", { className: "battle-bar-mini burst-bar", style: {
        height: 4,
        marginTop: 2
      }, children: /* @__PURE__ */ jsxDEV("div", { className: "burst-fill", style: {
        width: `${Math.min(100, unit.burst || 0)}%`
      } }, void 0, false, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\battleUI.jsx",
        lineNumber: 509,
        columnNumber: 10
      }) }, void 0, false, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\battleUI.jsx",
        lineNumber: 506,
        columnNumber: 47
      }),
      unit.isEnemy && unit.maxStagger > 0 && !unit.dead && /* @__PURE__ */ jsxDEV("div", { className: "battle-bar-mini stagger-bar-mini", children: /* @__PURE__ */ jsxDEV("div", { className: "stagger-fill-mini", style: {
        width: `${unit.stagger / unit.maxStagger * 100}%`
      } }, void 0, false, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\battleUI.jsx",
        lineNumber: 511,
        columnNumber: 125
      }) }, void 0, false, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\battleUI.jsx",
        lineNumber: 511,
        columnNumber: 75
      })
    ] }, void 0, true, {
      fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\battleUI.jsx",
      lineNumber: 487,
      columnNumber: 25
    }),
    /* @__PURE__ */ jsxDEV("div", { className: "unit-name", style: {
      fontSize: "0.7rem",
      letterSpacing: 1,
      display: "flex",
      alignItems: "center",
      gap: 4
    }, children: [
      unit.isEnemy && /* @__PURE__ */ jsxDEV("span", { style: {
        color: "#ef4444",
        fontWeight: 900
      }, children: [
        "LV.",
        unit.level
      ] }, void 0, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\battleUI.jsx",
        lineNumber: 519,
        columnNumber: 25
      }),
      unit.ascension > 0 && /* @__PURE__ */ jsxDEV("span", { className: "rank-badge-mini", style: {
        color: "#facc15",
        fontSize: "0.6rem",
        padding: "0 4px",
        borderColor: "#facc15",
        borderStyle: "solid",
        borderWidth: "1px"
      }, children: [
        "ASC ",
        unit.ascension
      ] }, void 0, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\battleUI.jsx",
        lineNumber: 522,
        columnNumber: 56
      }),
      /* @__PURE__ */ jsxDEV("span", { children: unit.name.split(" ")[0] }, void 0, false, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\battleUI.jsx",
        lineNumber: 529,
        columnNumber: 38
      })
    ] }, void 0, true, {
      fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\battleUI.jsx",
      lineNumber: 513,
      columnNumber: 27
    }),
    floatingDamages.map((d) => /* @__PURE__ */ jsxDEV("div", { className: `damage-popup dmg-${d.type}`, children: [
      d.type === "heal" ? "+" : "",
      d.amount
    ] }, d.id, true, {
      fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\battleUI.jsx",
      lineNumber: 529,
      columnNumber: 108
    }))
  ] }, void 0, true, {
    fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\battleUI.jsx",
    lineNumber: 419,
    columnNumber: 10
  });
};
const TallyNumber = ({
  target,
  duration = 1500,
  color
}) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = parseInt(target);
    if (start === end) return;
    let timer = setInterval(() => {
      start += Math.ceil(end / 30);
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, duration / 30);
    return () => clearInterval(timer);
  }, [target]);
  return /* @__PURE__ */ jsxDEV("span", { style: {
    color
  }, children: count.toLocaleString() }, void 0, false, {
    fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\battleUI.jsx",
    lineNumber: 552,
    columnNumber: 10
  });
};
export {
  BattleUnit,
  ProjectileLayer,
  TacticalStanceRow,
  TallyNumber,
  TurnOrderStrip
};
