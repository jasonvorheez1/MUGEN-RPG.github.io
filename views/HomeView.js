import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Users,
  Sparkles,
  ChevronRight,
  Trophy,
  Gem,
  Database,
  Swords,
  Star,
  Zap,
  Briefcase,
  Map as MapIcon,
  Gift,
  Crown
} from "lucide-react";
import { ELEMENTS, CAMPAIGN_CONTENT, REP_RANKS, getRepRank } from "../constants.js";
import { playSound, calculateSubStat, formatPower, getActiveEvents } from "../utils.js";

const h = React.createElement;

const useCountUp = (value, duration = 800) => {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);
  useEffect(() => {
    const from = fromRef.current;
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (value - from) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return display;
};

// Flatten CAMPAIGN_CONTENT once: flat stage id -> { stage, area, chapter }.
const STAGE_INDEX = (() => {
  const idx = {};
  CAMPAIGN_CONTENT.forEach((ch) => ch.areas.forEach((ar) => ar.stages.forEach((st) => { idx[st.id] = { stage: st, area: ar, chapter: ch }; })));
  return idx;
})();

const HomeView = ({
  characters = [],
  totalAccountLevel = 0,
  credits = 0,
  setCredits,
  gems = 0,
  setGems,
  aura = 0,
  setView,
  setSelectedCharIndex,
  unlockedIds = [],
  vaultCredits = 0,
  setVaultCredits,
  maxVaultCapacity = 5e3,
  createFloatingText,
  unlockedFeatures = [],
  stats = {},
  showDailyModal = false,
  setShowDailyModal,
  totalPWR = 0,
  skills = [],
  campaignProgress = 1,
  unclaimedGems = 0,
  setUnclaimedGems,
  triggerVisualEffect,
  activeMissions = [],
  endlessFloor = 1,
  eventTokens = 0,
  materials = 0,
  essence = 0,
  items = {},
  auraUpgrades = {},
  selectedCharIndex = 0
}) => {
  // ------------------------------------------------------------------ clock
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);
  const clockStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const hour = now.getHours();
  const daypart = hour >= 22 || hour < 5 ? "AFTER MIDNIGHT" : hour >= 18 ? "PRIME TIME" : hour >= 12 ? "SOUNDCHECK" : "THE MORNING AFTER";

  // ------------------------------------------------------------------ crew
  const unlockedCharacters = useMemo(
    () => (characters || []).filter((c) => unlockedIds?.includes(c?.export_id)),
    [characters, unlockedIds]
  );
  const topHeroes = useMemo(
    () => [...unlockedCharacters].sort((a, b) => calculateSubStat(b, characters, "pwr", skills, auraUpgrades) - calculateSubStat(a, characters, "pwr", skills, auraUpgrades)).slice(0, 4),
    [unlockedCharacters, characters, skills, auraUpgrades]
  );
  const selectedChar = characters[selectedCharIndex];
  const featuredHero = (selectedChar && unlockedIds?.includes(selectedChar.export_id)) ? selectedChar : topHeroes[0];
  const featuredPwr = featuredHero ? calculateSubStat(featuredHero, characters, "pwr", skills, auraUpgrades) : 0;
  const resonance = useMemo(() => {
    const counts = {};
    unlockedCharacters.forEach((c) => { counts[c.element] = (counts[c.element] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 4);
  }, [unlockedCharacters]);

  // ------------------------------------------------------------------ rep
  // Same formula as App.js masteryMetrics — recomputed here so the panel can
  // SHOW the player where rep comes from instead of one opaque number.
  const repBreakdown = useMemo(() => {
    const heroLevels = unlockedCharacters.reduce((s, c) => s + (c.level || 1), 0);
    const bondLevels = unlockedCharacters.reduce((s, c) => s + (c.bondLevel || 1), 0);
    const heroes = unlockedCharacters.length;
    const stages = Math.max(0, campaignProgress - 1);
    return [
      { label: "HERO LEVELS", value: heroLevels, pts: heroLevels * 1, hint: "+1 rep each" },
      { label: "BOND RANKS", value: bondLevels, pts: bondLevels * 5, hint: "+5 rep each" },
      { label: "CREW SIZE", value: heroes, pts: heroes * 25, hint: "+25 rep each" },
      { label: "STAGES CLEARED", value: stages, pts: stages * 100, hint: "+100 rep each" }
    ];
  }, [unlockedCharacters, campaignProgress]);
  const facilityRank = Math.floor(totalAccountLevel / 15) + 1;
  const repInfo = getRepRank(facilityRank);
  const nextRepInfo = facilityRank < REP_RANKS.length ? getRepRank(facilityRank + 1) : null;
  const levelsIntoRank = totalAccountLevel % 15;
  const rankProgress = facilityRank >= REP_RANKS.length ? 1 : levelsIntoRank / 15;

  // One-time rank reward chests, persisted outside React state.
  const [claimedRanks, setClaimedRanks] = useState(() => {
    try { return JSON.parse(localStorage.getItem("mugen_rep_claimed") || "[]"); } catch (e) { return []; }
  });
  const claimableRanks = REP_RANKS.filter((r) => r.reward && r.rank <= facilityRank && !claimedRanks.includes(r.rank));
  const claimRankReward = (r) => {
    if (!r.reward || claimedRanks.includes(r.rank) || r.rank > facilityRank) return;
    const next = [...claimedRanks, r.rank];
    setClaimedRanks(next);
    try { localStorage.setItem("mugen_rep_claimed", JSON.stringify(next)); } catch (e) {}
    if (r.reward.gems) setGems((g) => g + r.reward.gems);
    if (r.reward.credits) setCredits((c) => c + r.reward.credits);
    createFloatingText(`REP CHEST: +${r.reward.gems} gems, +$${r.reward.credits.toLocaleString()}`, false, "#facc15");
    playSound("jackpot");
  };

  // ------------------------------------------------------------------ tonight's move
  const nextStageInfo = STAGE_INDEX[campaignProgress] || null;
  const recPower = nextStageInfo ? nextStageInfo.stage.cpReq : campaignProgress * 125e3;
  const readiness = Math.min(1, recPower > 0 ? totalPWR / recPower : 1);
  const readinessLabel = readiness >= 1 ? "READY" : readiness >= 0.7 ? "RISKY" : "OUTMATCHED";
  const readinessColor = readiness >= 1 ? "#4ade80" : readiness >= 0.7 ? "#facc15" : "#ef4444";
  const liveEvents = useMemo(() => getActiveEvents(characters), [characters]);

  // ------------------------------------------------------------------ claims
  const claimDaily = () => {
    const reward = 250 + (stats?.dailyStreak || 0) * 50;
    setGems((g) => g + reward);
    setShowDailyModal(false);
    createFloatingText(`+${reward} DAILY GEMS!`, false, "#00d2ff");
    playSound("daily_reward");
  };
  const claimVault = () => {
    if (vaultCredits <= 0) return;
    setCredits((c) => c + vaultCredits);
    createFloatingText(`+$${vaultCredits.toLocaleString()}`, false, "#facc15");
    setVaultCredits(0);
    playSound("purchase");
  };
  const claimGeode = () => {
    const floor = Math.floor(unclaimedGems);
    if (floor <= 0) return;
    setGems((g) => g + floor);
    setUnclaimedGems((g) => g % 1);
    createFloatingText(`+${floor} GEMS!`, false, "#00d2ff");
    playSound("jackpot");
  };

  const displayPWR = useCountUp(totalPWR);
  const displayLevel = useCountUp(totalAccountLevel);
  const goHero = (heroChar) => {
    const idx = characters.findIndex((c) => String(c.export_id) === String(heroChar.export_id));
    if (idx !== -1) setSelectedCharIndex(idx);
    setView("train");
  };
  const has = (f) => unlockedFeatures.includes(f);

  // Ticker: live tidbits, nightlife-flavored.
  const tickerBits = [
    `${daypart} IN MUGEN CITY`,
    liveEvents.length ? `${liveEvents.length} RIFT${liveEvents.length === 1 ? "" : "S"} LIVE TONIGHT: ${liveEvents.map((e) => e.franchise).join(" / ")}` : "SCOUTS REPORT QUIET RIFT ACTIVITY",
    `THE VOID — FLOOR ${endlessFloor}`,
    eventTokens > 0 ? `${eventTokens.toLocaleString()} EVENT TOKENS BURNING A HOLE IN YOUR POCKET` : "CLEAR RIFTS TO EARN EVENT TOKENS",
    claimableRanks.length ? `${claimableRanks.length} REP CHEST${claimableRanks.length === 1 ? "" : "S"} WAITING AT THE OFFICE` : `NEXT RANK: ${nextRepInfo ? nextRepInfo.venue.toUpperCase() : "MAXED OUT"}`
  ];

  // ------------------------------------------------------------------ ui bits
  const sectionTitle = (icon, text, color = "var(--primary)") =>
    h("div", { className: "mc-card-head" }, h(icon, { size: 13, color }), h("span", { style: { color } }, text));

  return h("div", { className: "animate-fadeIn mc-home", style: { paddingBottom: 110 } },
    // ambient
    h("div", { className: "home-ambient-container" },
      h("div", { style: { position: "absolute", inset: 0, backgroundImage: "url(nightlife_bokeh.png)", backgroundSize: "cover", opacity: 0.1, mixBlendMode: "screen" } }),
      h("div", { className: "vignette-heavy", style: { background: "radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.75) 100%)" } })),

    // daily reward modal (unchanged mechanics)
    showDailyModal ? h("div", { className: "summoning-overlay", style: { background: "rgba(0,0,0,0.9)", backdropFilter: "blur(15px)" } },
      h("div", { className: "glass-panel animate-popIn", style: { padding: 40, textAlign: "center", maxWidth: 320, border: "2px solid var(--gem-color)", boxShadow: "0 0 50px rgba(0,210,255,0.3)" } },
        h(Sparkles, { size: 56, color: "var(--gem-color)", style: { marginBottom: 20 }, className: "animate-pulse" }),
        h("h2", { style: { margin: "0 0 5px 0", fontFamily: "Cinzel", letterSpacing: 2 } }, "NIGHTLY REWARD"),
        h("div", { style: { fontSize: "1.4rem", fontWeight: 900, color: "var(--gem-color)", marginBottom: 10 } }, `DAY ${stats.dailyStreak}`),
        h("p", { style: { fontSize: "0.85rem", opacity: 0.8, marginBottom: 30, lineHeight: 1.5 } }, "Another night on the scene. The house comps your gems."),
        h("button", { className: "train-btn", style: { background: "var(--gem-color)", color: "#000" }, onClick: claimDaily }, `CLAIM ${250 + (stats.dailyStreak || 0) * 50} GEMS`))) : null,

    // ------------------------------------------------- header marquee
    h("div", { className: "mc-marquee glass-panel" },
      h("div", { className: "mc-marquee-left" },
        h("div", { className: "mc-clock-label" }, daypart),
        h("div", { className: "mc-clock" }, clockStr),
        h("div", { className: "mc-clock-sub" }, "MUGEN CITY • DISTRICT 8 • 2008")),
      h("div", { className: "mc-marquee-right" },
        h("div", { className: "mc-rep-chip", onClick: () => document.getElementById("mc-rep-panel")?.scrollIntoView({ behavior: "smooth" }) },
          h(Crown, { size: 14, color: "#facc15" }),
          h("span", null, repInfo.title),
          h("span", { className: "mc-rep-chip-lv" }, `REP ${Math.round(displayLevel)}`)),
        h("div", { className: "mc-marquee-stats" },
          h("div", null, h("span", { className: "mc-ms-label" }, "CREW PWR"), h("span", { className: "mc-ms-val", style: { color: "var(--primary)" } }, formatPower(Math.round(displayPWR)))),
          h("div", null, h("span", { className: "mc-ms-label" }, "HEROES"), h("span", { className: "mc-ms-val" }, unlockedCharacters.length))))),

    // ------------------------------------------------- main grid
    h("div", { className: "mc-grid" },

      // A — HEADLINER (featured hero)
      featuredHero ? h("div", { className: "mc-card mc-headliner neon-hover", onClick: () => goHero(featuredHero) },
        h("div", { className: "mc-headliner-img", style: { backgroundImage: `url(${featuredHero.imageUrl})` } }),
        h("div", { className: "mc-headliner-fade" }),
        h("div", { className: "mc-headliner-body" },
          sectionTitle(Star, "TONIGHT'S HEADLINER", "#ff2ecb"),
          h("div", { className: "mc-headliner-name" }, featuredHero.name),
          h("div", { className: "mc-headliner-meta" },
            h("span", { style: { color: ELEMENTS[featuredHero.element]?.color || "#fff" } }, featuredHero.element),
            h("span", null, `LV.${featuredHero.level}`),
            h("span", { style: { color: "var(--primary)" } }, `PWR ${formatPower(featuredPwr)}`)),
          h("div", { className: "mc-headliner-actions" },
            h("button", { className: "train-btn mc-btn-sm", onClick: (e) => { e.stopPropagation(); goHero(featuredHero); } }, "TRAIN"),
            h("button", { className: "train-btn mc-btn-sm mc-btn-ghost", onClick: (e) => { e.stopPropagation(); setView("lounge"); } }, "LOUNGE")))) : null,

      // B — TONIGHT'S MOVE (next campaign stage)
      h("div", { className: "mc-card neon-hover", style: { cursor: "pointer" }, onClick: () => setView("campaign") },
        sectionTitle(Swords, "TONIGHT'S MOVE", "#4ade80"),
        nextStageInfo ? h(React.Fragment, null,
          h("div", { className: "mc-move-chapter" }, nextStageInfo.chapter.title.toUpperCase()),
          h("div", { className: "mc-move-stage" }, nextStageInfo.stage.name),
          h("div", { className: "mc-move-enemy" }, `TARGET: ${nextStageInfo.stage.enemy} • ${nextStageInfo.stage.element}`),
          h("div", { className: "mc-readiness" },
            h("div", { className: "mc-readiness-row" },
              h("span", null, `REC. ${formatPower(recPower)}`),
              h("span", { style: { color: readinessColor, fontWeight: 900 } }, readinessLabel)),
            h("div", { className: "tech-progress-bar", style: { height: 8 } },
              h("div", { className: "tech-progress-fill", style: { width: `${readiness * 100}%`, background: readinessColor } }))),
          h("button", { className: "train-btn mc-btn-sm", style: { marginTop: 14, background: "#4ade80", color: "#000" } }, "HIT THE STREETS")) :
          h("div", { style: { padding: "20px 0", color: "var(--text-muted)", fontSize: "0.8rem" } }, "Every district cleared. The city sleeps easy tonight."),
        liveEvents.length ? h("div", { className: "mc-move-events" }, `⚡ ${liveEvents.length} RIFT EVENT${liveEvents.length === 1 ? "" : "S"} ALSO LIVE`) : null),

      // C — STREET REP (the revamp)
      h("div", { className: "mc-card mc-rep", id: "mc-rep-panel" },
        sectionTitle(Crown, "STREET REP", "#facc15"),
        h("div", { className: "mc-rep-top" },
          h("div", { className: "mc-rep-badge" }, h("span", { className: "mc-rep-rank-num" }, facilityRank), h("span", { className: "mc-rep-rank-cap" }, "RANK")),
          h("div", { style: { flex: 1, minWidth: 0 } },
            h("div", { className: "mc-rep-title" }, repInfo.title),
            h("div", { className: "mc-rep-venue" }, `HQ: ${repInfo.venue}`),
            h("div", { className: "mc-rep-blurb" }, repInfo.blurb))),
        h("div", { className: "mc-readiness", style: { marginTop: 12 } },
          h("div", { className: "mc-readiness-row" },
            h("span", null, nextRepInfo ? `${15 - levelsIntoRank} LEVELS TO ${nextRepInfo.venue.toUpperCase()}` : "MAX RANK"),
            h("span", { style: { color: "#facc15" } }, `${levelsIntoRank}/15`)),
          h("div", { className: "tech-progress-bar", style: { height: 8 } },
            h("div", { className: "tech-progress-fill", style: { width: `${rankProgress * 100}%`, background: "#facc15" } }))),
        nextRepInfo ? h("div", { className: "mc-rep-next" }, h(Gift, { size: 12, color: "#a855f7" }), ` NEXT: ${nextRepInfo.perk}`) : null,
        h("div", { className: "mc-rep-breakdown" },
          repBreakdown.map((b) => h("div", { key: b.label, className: "mc-rep-src", title: b.hint },
            h("div", { className: "mc-rep-src-pts" }, `+${b.pts.toLocaleString()}`),
            h("div", { className: "mc-rep-src-label" }, `${b.label} (${b.value})`)))),
        claimableRanks.length ? h("div", { className: "mc-rep-chests" },
          claimableRanks.map((r) => h("button", { key: r.rank, className: "mc-chest-btn", onClick: () => claimRankReward(r) },
            h(Gift, { size: 14 }),
            `RANK ${r.rank} CHEST — ${r.reward.gems} GEMS + $${(r.reward.credits / 1e6 >= 1 ? r.reward.credits / 1e6 + "M" : r.reward.credits / 1e3 + "K")}`))) : null),

      // D — BACK OFFICE (vault + geode income)
      h("div", { className: "mc-card" },
        sectionTitle(Database, "THE BACK OFFICE", "#facc15"),
        h("div", { className: "mc-till-row" },
          h("div", { style: { flex: 1, minWidth: 0 } },
            h("div", { className: "mc-till-label" }, "THE TILL — tonight's takings"),
            h("div", { className: "mc-till-val", style: { color: "#facc15" } }, `$${Math.floor(vaultCredits).toLocaleString()}`),
            h("div", { className: "tech-progress-bar", style: { height: 5, marginTop: 6 } },
              h("div", { className: "tech-progress-fill", style: { width: `${Math.min(100, vaultCredits / maxVaultCapacity * 100)}%`, background: "#facc15" } }))),
          h("button", { className: "train-btn mc-btn-sm", disabled: vaultCredits <= 0, onClick: claimVault, style: { background: "#facc15", color: "#000", opacity: vaultCredits > 0 ? 1 : 0.4 } }, "COLLECT")),
        h("div", { className: "mc-till-row", style: { borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 14, marginTop: 14 } },
          h("div", { style: { flex: 1, minWidth: 0 } },
            h("div", { className: "mc-till-label" }, "GEODE — slow-cooked gems"),
            h("div", { className: "mc-till-val", style: { color: "var(--gem-color)" } }, Math.floor(unclaimedGems).toLocaleString())),
          h("button", { className: "train-btn mc-btn-sm", disabled: Math.floor(unclaimedGems) <= 0, onClick: claimGeode, style: { background: "var(--gem-color)", color: "#000", opacity: Math.floor(unclaimedGems) > 0 ? 1 : 0.4 } }, "CRACK"))),

      // E — THE CREW
      h("div", { className: "mc-card" },
        sectionTitle(Users, "THE CREW", "#00d2ff"),
        h("div", { className: "mc-crew-row" },
          topHeroes.map((c) => h("div", { key: c.export_id, className: "mc-crew-slot", onClick: () => goHero(c), title: c.name },
            h("img", { src: c.imageUrl, alt: c.name }),
            h("div", { className: "mc-crew-pwr" }, formatPower(calculateSubStat(c, characters, "pwr", skills, auraUpgrades))))),
          topHeroes.length === 0 ? h("div", { style: { color: "var(--text-muted)", fontSize: "0.75rem" } }, "No crew yet — hit RECRUIT.") : null),
        resonance.length ? h("div", { className: "mc-resonance" },
          resonance.map(([el, n]) => h("span", { key: el, className: "mc-res-chip", style: { color: ELEMENTS[el]?.color || "#fff", borderColor: `${ELEMENTS[el]?.color || "#fff"}44` } }, `${el} ×${n}`))) : null,
        h("div", { className: "mc-headliner-actions", style: { marginTop: 12 } },
          h("button", { className: "train-btn mc-btn-sm", onClick: () => setView("roster") }, "ROSTER"),
          h("button", { className: "train-btn mc-btn-sm mc-btn-ghost", onClick: () => setView("gacha") }, "RECRUIT"))),

      // F — CITY LINES (quick nav w/ lock states)
      h("div", { className: "mc-card" },
        sectionTitle(MapIcon, "CITY LINES", "#a855f7"),
        h("div", { className: "mc-lines" },
          [
            { id: "events", label: "EVENTS", icon: Zap, color: "#facc15", locked: !has("events"), sub: liveEvents.length ? `${liveEvents.length} LIVE` : "RIFTS" },
            { id: "trials", label: "TRIALS", icon: Trophy, color: "#4ade80", locked: !has("trials"), sub: `VOID F${endlessFloor}` },
            { id: "missions", label: "JOBS", icon: Briefcase, color: "#00d2ff", locked: !has("missions"), sub: activeMissions.length ? `${activeMissions.length} RUNNING` : "CONTRACTS" },
            { id: "gacha", label: "RECRUIT", icon: Gem, color: "#ff2ecb", locked: false, sub: "NEW FACES" }
          ].map((l) => h("button", {
            key: l.id,
            className: `mc-line ${l.locked ? "mc-line-locked" : ""}`,
            onClick: () => { if (l.locked) { createFloatingText(`Locked — raise your REP rank`, true); return; } setView(l.id); }
          },
            h(l.icon, { size: 18, color: l.locked ? "#64748b" : l.color }),
            h("div", { className: "mc-line-label" }, l.label),
            h("div", { className: "mc-line-sub", style: { color: l.locked ? "#64748b" : l.color } }, l.locked ? "LOCKED" : l.sub))))),
    ),

    // ------------------------------------------------- ticker
    h("div", { className: "mc-ticker glass-panel" },
      h("div", { className: "mc-ticker-inner" },
        [...tickerBits, ...tickerBits].map((b, i) => h("span", { key: i }, b, h("i", { className: "mc-ticker-dot" }))))),

    h("div", { className: "mc-footer" }, "MUGEN CITY • EST. 2008 • THE NIGHT IS YOUNG")
  );
};

export { HomeView };
export default HomeView;
