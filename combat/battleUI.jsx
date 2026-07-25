// Split out of CombatSystem.js (token-efficiency pass): in-battle UI
// components -- TacticalStanceRow, Projectile/ProjectileLayer, TurnOrderStrip,
// BattleUnit (the big one -- renders a single combatant card, statuses, cast
// animations), and TallyNumber. CombatSystem.js re-exports these unchanged
// so no other file's import statements needed to change.

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
  return <div className="element-switcher">{["FIRE", "WATER", "WIND", "LIGHT", "DARK", "EARTH"].map(el => <div key={el} className={`element-icon ${currentStance === el ? "active" : ""}`} style={{
      "--el-color": ELEMENTS[el].color,
      borderColor: ELEMENTS[el].color,
      background: currentStance === el ? ELEMENTS[el].color : "transparent"
    }} onClick={() => onStanceChange(el)}>{el[0]}</div>)}</div>;
};
// A single flying orb: spawned at the caster's screen position, animates to
// the target's screen position via a shared CSS keyframe driven by per-
// instance --dx/--dy custom properties (so one @keyframes rule handles any
// distance/direction), then unmounts itself. Positions are captured ONCE at
// spawn (not re-measured mid-flight) -- battle formations don't reflow
// mid-animation, so this stays accurate without a rAF loop.
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
    // BUG FIX: was 620ms, but the CSS projectile-fly animation (style.css) is
    // only 550ms -- the orb sat around fully faded-out for an extra 70ms
    // before React actually unmounted it. Match the real CSS duration so the
    // element is removed right as the animation finishes.
    const t = setTimeout(onDone, delayMs + 550);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const angleDeg = Math.atan2(dy, dx) * (180 / Math.PI);
  return <div className="projectile-wrap" style={{
    left: fromX,
    top: fromY,
    "--dx": `${dx}px`,
    "--dy": `${dy}px`,
    "--proj-delay": `${delayMs}ms`
  }}><div className="projectile-orb" style={{
      "--proj-color": color
    }} /><div className="projectile-trail" style={{
      "--proj-color": color,
      "--proj-angle": `${angleDeg}deg`
    }} /></div>;
};
// Watches `combatants` for fresh `lastProjectile` tags (set in
// executeCombatSkill for ranged-reading casts) and spawns a real screen-space
// projectile flying from the caster's rendered position to each target's --
// "fireball actually flies at the target" instead of just a cast flourish on
// the caster. `containerRef` must point at the battle-scene element the
// battle-unit rows live inside (position: relative), since projectile
// coordinates are computed relative to it.
const ProjectileLayer = ({
  combatants = [],
  containerRef
}) => {
  const [projectiles, setProjectiles] = useState([]);
  const seenRef = useRef({});
  useEffect(() => {
    // This effect re-fires on EVERY combat tick (combatants gets a new array
    // reference every ~50ms in all three battle views), so it's critical
    // nothing here touches the DOM -- and nothing re-renders -- unless a
    // skill actually just fired. getBoundingClientRect() forces a synchronous
    // layout; doing that 20x/sec for the whole battle is exactly the kind of
    // thing that reads as "laggy." Check for fresh projectiles FIRST, on the
    // already-in-memory combatants array, before touching the DOM at all.
    const fresh = combatants.filter(u => u.lastProjectile && u.lastProjectile.time && seenRef.current[u.id] !== u.lastProjectile.time);
    if (!fresh.length) return;
    const container = containerRef?.current;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    const spawned = [];
    fresh.forEach(u => {
      const proj = u.lastProjectile;
      const fromEl = document.getElementById(`battle-unit-${u.id}`);
      // BUG FIX: this used to mark the projectile "seen" (seenRef) BEFORE
      // checking fromEl existed. If the caster's row wasn't mounted yet on
      // this exact tick (revive, fresh cameo/summon, a transient render
      // race), the cast was flagged seen anyway and its projectile was
      // silently dropped forever -- no beam/orb ever flew for that cast.
      // Only mark it seen once we've actually confirmed we can spawn it, so
      // an unmounted row just retries on the next ~50ms tick instead.
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
    if (spawned.length) setProjectiles(prev => [...prev, ...spawned]);
  }, [combatants, containerRef]);
  const removeOne = id => setProjectiles(prev => prev.filter(p => p.id !== id));
  return <div className="projectile-layer">{projectiles.map(p => <Projectile key={p.id} {...p} onDone={() => removeOne(p.id)} />)}</div>;
};
// TURN-ORDER STRIP: projects who acts next by how soon each living unit's
// gauge reaches 100 given its current fill rate, so speed is finally visible
// at a glance instead of eyeballing tiny gauge bars. Was CampaignView-only
// (built inline in its render) -- extracted here so TrialsView/EventsView can
// share the exact same projection logic instead of forking a second copy.
export const TurnOrderStrip = ({
  combatants,
  playerElement,
  combatSpeed
}) => {
  const living = (combatants || []).filter(c => !c.dead);
  if (!living.length) return null;
  const speeds = living.map(u => getBattleStats(u, playerElement, u.activeSynergies || []).speed);
  const order = living.map(u => {
    const spd = getBattleStats(u, playerElement, u.activeSynergies || []).speed;
    const rate = Math.max(0.1, getGaugeGain(spd, speeds, combatSpeed));
    const eta = Math.max(0, (100 - (u.gauge || 0)) / rate);
    return {
      u,
      eta
    };
  }).sort((a, b) => a.eta - b.eta).slice(0, 6);
  return <div className="turn-order-strip"><span className="turn-order-label">NEXT</span>{order.map(({
      u,
      eta
    }, i) => <div key={u.id} className={`turn-order-chip ${u.isEnemy ? "enemy" : "ally"} ${i === 0 ? "imminent" : ""}`} title={`${u.name} — next in ~${Math.ceil(eta)} ticks`}><img src={u._cameoImg || u.img} alt={u.name} /></div>)}</div>;
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
  // Number of flurry strikes on the current hit (>1 => rapid combo-rattle).
  const [hitBurst, setHitBurst] = useState(0);
  const lastComboTime = useRef(0);
  // DAZED: while a unit is in hit-stun (see getHitstunMs/applyHitstun), it
  // visibly reels -- a slower, continuous wobble/tilt distinct from the quick
  // per-hit impact shake below, so a locked-down target actually READS as
  // "can't act right now" for as long as the combo keeps it there.
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
  // --- Impact/elemental GIF overlay (effectsnew/*.gif), punched in with GSAP ---
  const [activeGif, setActiveGif] = useState(null);
  const gifRef = useRef(null);
  const gifSeq = useRef(0);
  const playGif = src => {
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
    const timer = setTimeout(() => setActiveGif(cur => cur && cur.key === activeGif.key ? null : cur), 700);
    return () => clearTimeout(timer);
  }, [activeGif]);
  const prevEffectTypes = useRef(/* @__PURE__ */new Set());
  useEffect(() => {
    const curTypes = new Set(unit.effects.map(e => e.type));
    if (curTypes.has("buff_elemdmg") && !prevEffectTypes.current.has("buff_elemdmg")) playGif("effectsnew/holy.gif");else if (curTypes.has("crushed") && !prevEffectTypes.current.has("crushed")) playGif("effectsnew/popupflash.gif");else if (curTypes.has("burn") && !prevEffectTypes.current.has("burn")) playGif("effectsnew/fire.gif");else if (curTypes.has("freeze") && !prevEffectTypes.current.has("freeze")) playGif("effectsnew/ice.gif");else if (curTypes.has("poison") && !prevEffectTypes.current.has("poison")) playGif("effectsnew/poison.gif");else if (curTypes.has("static") && !prevEffectTypes.current.has("static")) playGif("fx_lightning.png");
    prevEffectTypes.current = curTypes;
  }, [unit.effects]);
  const prevMsg = useRef(null);
  useEffect(() => {
    const msg = unit.lastAction?.msg;
    if (msg && msg !== prevMsg.current) {
      if (msg === "SAVED!") playGif("effectsnew/holy.gif");else if (unit.lastAction?.type === "shield_break") playGif("effectsnew/popupflash.gif");
    }
    prevMsg.current = msg;
  }, [unit.lastAction?.msg]);
  // LUNGE: when this unit lands an offensive action, it physically dashes
  // toward the opposing line and snaps back -- the core "PNGs are actually
  // fighting" read. Crits get a harder, faster lunge.
  const [lungeKind, setLungeKind] = useState(null);
  // BUG FIX: the "1x/1.5x/2x" battle-speed toggle only ever scaled gauge
  // gain (how SOON a unit gets to act again) -- every cast/lunge/rush
  // animation still held the sim for its full, fixed real-time length
  // regardless of the setting. Since that hit-stop lock dominates a battle's
  // actual wall-clock length far more than gauge-fill time does, "2x speed"
  // barely sped anything up in practice. animMs holds the SAME speed-scaled
  // duration used for both the JS unlock timeout below AND the CSS
  // animation-duration override on .unit-avatar-wrapper (see the inline
  // style further down), so the visual and the lock can never drift apart --
  // no risk of the next unit acting while this one's animation is still
  // mid-flight, which is exactly what the hit-stop lock exists to prevent.
  const [animMs, setAnimMs] = useState(null);
  const scaleMs = (ms) => Math.max(200, Math.round(ms / (combatSpeed || 1)));
  // Measured dash vector for a rushdown basic attack -- CSS custom props the
  // rush keyframes read to travel the REAL distance to the target and back.
  const [rush, setRush] = useState(null);
  const prevActTime = useRef(null);
  useEffect(() => {
    const act = unit.lastAction;
    if (!act || act.time === prevActTime.current) return;
    prevActTime.current = act.time;
    if (["normal", "magic", "basic", "shield_break"].includes(act.type)) {
      // FIGHTING-GAME RUSHDOWN: a basic attack dashes the attacker all the way
      // across to the target and throws a stat-driven flurry (meleeHits), with
      // fast characters launching an air combo (meleeAir). Measure the actual
      // on-screen vector to the target NOW (post-commit, sprites at rest) so
      // the dash lands on them instead of bobbing in place. Only runs on a
      // real basic-attack event -- not per tick -- so no layout-thrash cost.
      if (act.type === "basic" && !reducedFx) {
        const fromEl = document.getElementById(`battle-unit-${unit.id}`);
        const toEl = act.targetId != null ? document.getElementById(`battle-unit-${act.targetId}`) : null;
        if (fromEl && toEl) {
          const a = fromEl.getBoundingClientRect();
          const b = toEl.getBoundingClientRect();
          // Stop ~72% of the way so the sprites meet but don't fully overlap;
          // clamp so a stray measurement can't fling the sprite off-screen.
          const dx = Math.max(-520, Math.min(520, (b.left + b.width / 2 - (a.left + a.width / 2)) * 0.72));
          const dy = Math.max(-420, Math.min(420, (b.top + b.height / 2 - (a.top + a.height / 2)) * 0.72));
          setRush({
            "--rush-dx": `${dx.toFixed(1)}px`,
            "--rush-dy": `${dy.toFixed(1)}px`
          });
          const kind = act.meleeAir ? "rush-air" : "rush-combo";
          setLungeKind(kind);
          const dur = scaleMs(getBasicAttackMs(act.meleeAir));
          setAnimMs(dur);
          const t = setTimeout(() => {
            setLungeKind(null);
            setRush(null);
            setAnimMs(null);
          }, dur);
          return () => clearTimeout(t);
        }
        // Fall through to a plain lunge if we couldn't measure a target.
      }
      // Skill casts play their OWN bespoke wind-up motion (lastCastAnim). Basic
      // attacks never reuse a stale cast anim -- they lunge/rush only.
      const castAnim = act.type !== "basic" ? unit.lastCastAnim : null;
      if (castAnim) {
        setLungeKind(castAnim);
        const dur = scaleMs(getCastAnimMs(castAnim));
        setAnimMs(dur);
        const t = setTimeout(() => { setLungeKind(null); setAnimMs(null); }, dur);
        return () => clearTimeout(t);
      }
      setLungeKind(act.crit ? "lunge-crit" : "lunge");
      const dur = scaleMs(getLungeMs(act.crit));
      setAnimMs(dur);
      const t = setTimeout(() => { setLungeKind(null); setAnimMs(null); }, dur);
      return () => clearTimeout(t);
    }
  }, [unit.lastAction?.time]);
  useEffect(() => {
    if (unit.hp < prevHp.current) {
      // If this HP drop came from a rushdown basic attack, the sim stamped how
      // many flurry strikes landed (_comboHits) with a fresh timestamp. Rattle
      // the target rapidly for that many hits so the flurry visibly LANDS,
      // instead of one flat flash. Gated on a fresh timestamp so a later DOT/
      // skill drop doesn't reuse a stale flurry count.
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
  const stance = unit.effects.find(e => e.type === "tactical_stance");
  const isStaggered = unit.effects.some(e => e.label === "STAGGERED") && !unit.dead;
  const isFrozen = unit.effects.some(e => e.type === "freeze") && !unit.dead;
  const isStunned = unit.effects.some(e => e.type === "stun") && !unit.dead;
  const isBurned = unit.effects.some(e => e.type === "burn") && !unit.dead;
  const isStatic = unit.effects.some(e => e.type === "static") && !unit.dead;
  const isElemEmpowered = unit.effects.some(e => e.type === "buff_elemdmg") && !unit.dead;
  const isCrushed = unit.effects.some(e => e.type === "crushed") && !unit.dead;
  const isBroken = unit.effects.some(e => e.type === "broken") && !unit.dead;
  // Attack telegraph: an enemy whose turn gauge is nearly full flashes a warning.
  // Guarding during this window grants a PERFECT GUARD (see triggerDefend).
  const isTelegraphing = unit.isEnemy && !unit.dead && (unit.gauge || 0) >= 78;
  const groupedEffects = useMemo(() => {
    const groups = {};
    unit.effects.forEach(e => {
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
  const shieldEffect = unit.effects.find(e => e.type === "shield");
  const hasShield = !!shieldEffect;
  // A shield's remainingHp/maxHp pool is only materialized once it actually
  // takes a hit (see getShieldPool) -- before that, fall back to the authored
  // val fraction (what remainingHp/maxHp WOULD be at full strength) so a fresh
  // shield's true size shows immediately instead of reading as empty/100%.
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
  // A shield POPPING used to play the exact same 300ms flash as a shield merely
  // absorbing a hit and staying up -- the player couldn't tell "my shield just
  // broke" from "my shield tanked that and is fine." This is a separate, longer
  // cue (a "SHIELD BROKEN" callout) layered on top of the generic hit flash.
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
  // CUT-IN: a distinct interrupt animation, separate from the normal cast
  // wind-up -- a reactive strike/buff/debuff that fires mid-fight off another
  // unit's action, so it needs to visually read as "butting in," not "casting."
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
  return <div id={`battle-unit-${unit.id}`} className={`battle-unit ${unit.isEnemy ? "is-enemy" : "is-ally"} ${unit.dead ? "dead-dissolve" : "battle-unit-idle"} ${isActiveTurn ? "acting active-turn" : ""} ${isHit ? "is-hit" : ""} ${hitBurst > 1 ? "combo-rattle" : ""} ${isDazed && !unit.dead ? "is-dazed" : ""} ${isMarked ? "is-marked" : ""} ${unit.isBoss ? "is-boss" : ""} ${isStaggered ? "staggered-unit" : ""} ${unit.cosmetics?.borderClass || ""} ${stance ? "stance-glow-active" : ""} ${hasShield ? "has-active-shield" : ""} ${isFrozen ? "is-frozen" : ""} ${isStunned ? "is-stunned" : ""} ${isBurned ? "is-burned" : ""} ${isStatic ? "is-static" : ""} ${isElemEmpowered ? "is-elem-empowered" : ""} ${isCrushed ? "is-crushed" : ""} ${isBroken ? "is-broken" : ""} ${isTelegraphing ? "is-telegraphing" : ""} ${reducedFx ? "" : lungeKind || ""} ${unit.dead && unit.name === "Jimmy Neutron" && !reducedFx ? "gore-finale" : ""}`} onClick={() => unit.isEnemy && onMark && onMark()} style={{
    "--stance-color": stanceColor,
    "--cast-tint": ELEMENTS[unit.element]?.color || "#fff",
    "--delay": `${(Math.random() * 2).toFixed(2)}s`,
    ...(rush || {})
  }}>{isMarked && <div className="target-marker animate-pulse">MARK</div>}{isTelegraphing && <div className="attack-telegraph">!</div>}{stance && <div className="stance-indicator-tag" style={{
      "--stance-color": stanceColor
    }}><div className="stance-icon-mini" /><div className="stance-label-mini">{stanceElement} STANCE {stanceElement === "FIRE" ? "+ATK" : stanceElement === "WATER" ? "+DEF" : stanceElement === "WIND" ? "+SPD" : stanceElement === "DARK" ? "+CRIT" : ""}</div></div>}<div className="hit-flash-overlay" /><div className={`unit-avatar-wrapper ${unit.isBoss ? "boss-size" : "std-size"} ${unit.gauge >= 100 ? "active-turn" : ""}`} style={{
      position: "relative",
      // Overrides just the duration portion of whatever `animation` shorthand
      // the active cast-X/lunge/rush class supplies (inline styles win the
      // cascade for that property), keeping the VISIBLE animation length in
      // lockstep with the speed-scaled hit-stop lock above -- see animMs.
      ...(animMs != null ? { animationDuration: `${animMs}ms` } : {})
    }}>{hasShield && <div className={`shield-vfx-overlay ${shieldHitActive ? "shield-hit" : ""}`} />}{
      // Distinct from the generic shield-hit flash above: only fires the instant
      // a shield's pool actually empties, not on every hit it merely absorbs.
      // The shield effect is already gone by this point (hasShield is false),
      // so this is gated on shieldBrokeActive alone, not hasShield.
      shieldBrokeActive && <div className="shield-pop-flash">SHIELD BROKEN</div>}{
      // CUT-IN interrupt: a diagonal slash sweep + ghost portrait bursting in
      // from the side, distinct from every existing cast/hit visual so a
      // reactive trigger reads unmistakably as "butting into someone else's
      // turn," not as this unit's own normal action.
      cutInActive && <div className="cut-in-overlay"><div className="cut-in-slash" /><img className="cut-in-portrait-ghost" src={unit._cameoImg || unit.img} /><div className="cut-in-text">{cutInLabel}</div></div>}{hasShield && shieldEffect.val > 0 && <div className="shield-strength-chip">SHLD {Math.round(shieldHpPercent)}%</div>}<img src={(unit.effects.find(e => e.type === "phantom_veil") || {}).transformImg || unit._cameoImg || unit.img} className={`unit-avatar ${unit.effects.some(e => e.type === "phantom_veil") ? "phantom-transform" : unit._cameoImg ? "cameo-morph" : ""}`} style={{
        ...unit.cosmetics?.auraStyle,
        width: "100%",
        height: "100%"
      }} />{activeGif && <img key={activeGif.key} ref={gifRef} src={activeGif.src} className="combat-fx-gif" />}{isStaggered && <div className="stagger-badge" style={{
        backgroundImage: "url(effectsnew/popupwords.gif)",
        backgroundSize: "100% 100%",
        backgroundColor: "transparent"
      }}>STAGGERED</div>}{groupedEffects.length > 0 && <div className="status-effect-row">{groupedEffects.map((e, i) => {
          let icon = <Activity size={10} />;
          let statusClass = "status-special";
          if (e.type === "burn") {
            icon = <Flame size={10} />;
            statusClass = "status-debuff";
          } else if (e.type === "freeze") {
            icon = <Snowflake size={10} />;
            statusClass = "status-stun";
          } else if (e.type === "poison") {
            icon = <Skull size={10} />;
            statusClass = "status-debuff";
          } else if (e.type === "stun") {
            icon = <Ban size={10} />;
            statusClass = "status-stun";
          } else if (e.type === "static") {
            icon = <Zap size={10} />;
            statusClass = "status-debuff";
          } else if (e.type === "shield") {
            icon = <Shield size={10} />;
            statusClass = "status-shield";
          } else if (e.type === "buff_elemdmg") {
            icon = <Sparkles size={10} />;
            statusClass = "status-elemental";
          } else if (e.type === "crushed") {
            icon = <ArrowDownCircle size={10} />;
            statusClass = "status-crush";
          } else if (e.type.startsWith("buff")) {
            icon = <ArrowUpCircle size={10} />;
            statusClass = "status-buff";
          } else if (e.type.startsWith("debuff")) {
            icon = <ArrowDownCircle size={10} />;
            statusClass = "status-debuff";
          }
          const desc = describeEffect(e);
          return <div key={i} className={`status-badge ${statusClass}`} title={desc.full}>{icon}{desc.short && <span className="status-label">{desc.short}</span>}{e.count > 1 && <span className="stack-count">x{e.count}</span>}<span className="duration-text">{e.maxDur}</span></div>;
        })}</div>}</div><div className="unit-bars" style={{
      marginTop: 5
    }}><div className="battle-bar-mini hp-bar-container" style={{
        height: 12
      }}><div className="hp-fill-ghost" style={{
          width: `${ghostHpPercent}%`
        }} /><div className="hp-fill" style={{
          width: `${hpPercent}%`,
          background: hpColor
        }} />{hasShield && shieldHpPercent > 0 && <div className="shield-bar-segment" style={{
          width: `${shieldHpPercent}%`
        }} />}<div className="hp-text-overlay">{hasShield ? `[${Number.isFinite(shieldEffect.remainingHp) ? Math.floor(shieldEffect.remainingHp) : Math.floor(Math.min(3, Math.max(0, shieldEffect.val || 0)) * unit.maxHp)}] ` : ""}{Number.isFinite(unit.hp) ? Math.floor(unit.hp) : 0}</div></div><div className="battle-bar-mini gauge-bar" style={{
        height: 4
      }}><div className="gauge-fill" style={{
          width: `${unit.gauge}%`
        }} /></div><div className="unit-skill-labels"><div className="battle-bar-mini skill-bar"><div className="skill1-fill" style={{
            width: `${Math.min(100, unit.skillCd / unit.maxSkillCd * 100)}%`
          }} /></div>{unit.skillId2 && <div className="battle-bar-mini skill-bar"><div className="skill2-fill" style={{
            width: `${Math.min(100, unit.skillCd2 / unit.maxSkillCd2 * 100)}%`
          }} /></div>}</div>{!unit.isEnemy && <div className="battle-bar-mini burst-bar" style={{
        height: 4,
        marginTop: 2
      }}><div className="burst-fill" style={{
          width: `${Math.min(100, unit.burst || 0)}%`
        }} /></div>}{unit.isEnemy && unit.maxStagger > 0 && !unit.dead && <div className="battle-bar-mini stagger-bar-mini"><div className="stagger-fill-mini" style={{
          width: `${unit.stagger / unit.maxStagger * 100}%`
        }} /></div>}</div><div className="unit-name" style={{
      fontSize: "0.7rem",
      letterSpacing: 1,
      display: "flex",
      alignItems: "center",
      gap: 4
    }}>{unit.isEnemy && <span style={{
        color: "#ef4444",
        fontWeight: 900
      }}>LV.{unit.level}</span>}{unit.ascension > 0 && <span className="rank-badge-mini" style={{
        color: "#facc15",
        fontSize: "0.6rem",
        padding: "0 4px",
        borderColor: "#facc15",
        borderStyle: "solid",
        borderWidth: "1px"
      }}>ASC {unit.ascension}</span>}<span>{unit.name.split(" ")[0]}</span></div>{floatingDamages.map(d => <div key={d.id} className={`damage-popup dmg-${d.type}`}>{d.type === "heal" ? "+" : ""}{d.amount}</div>)}</div>;
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
  return <span style={{
    color
  }}>{count.toLocaleString()}</span>;
};
export { TacticalStanceRow, ProjectileLayer, BattleUnit, TallyNumber };