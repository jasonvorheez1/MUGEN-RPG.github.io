import { Fragment, jsxDEV } from "react/jsx-dev-runtime";
import React, { useState, useEffect, useMemo, useRef } from "react";
import gsap from "gsap";
import {
  Heart,
  Shield,
  Zap,
  Flame,
  Users,
  Sparkles,
  ChevronRight,
  Trophy,
  Star,
  ArrowUpCircle,
  Database,
  Swords,
  Hammer,
  Activity,
  Ban,
  ChevronLeft
} from "lucide-react";
import { ITEMS, ELEMENTS } from "../constants.js";
import { getBondPath, playSound, getBondMultiplier } from "../utils.js";
import { SocialView } from "./SocialView.js";
import { InventoryView } from "./InventoryView.js";

const BondView = ({
  characters,
  unlockedIds,
  setSelectedCharIndex,
  selectedCharIndex,
  credits,
  setCredits,
  setCharacters,
  triggerDialogue,
  triggerVisualEffect: triggerVisualEffect2,
  createFloatingText,
  stamina,
  setStamina,
  activeDialogue,
  isTypingDialogue,
  setIsTypingDialogue,
  isShaking,
  heroVibes,
  appearanceTags,
  totalAccountLevel,
  heroMoods,
  setHeroMoods,
  inventory,
  removeFromInventory,
  setGems,
  setAura,
  setMaterials,
  essence,
  setEssence,
  items,
  skills,
  squadIds,
  setSquadIds,
  auraUpgrades = {},
  dateMemories = {},
  setDateMemories
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("actions");
  const [showSidebar, setShowSidebar] = useState(false);
  const [sortMethod, setSortMethod] = useState("level");
  const isMobile2 = window.innerWidth <= 900;
  const [chatHistory, setChatHistory] = useState([]);
  const [dateSession, setDateSession] = useState({
    active: false,
    location: null,
    phase: "select",
    affinity: 0,
    turn: 0,
    history: []
  });
  React.useEffect(() => {
    if (activeDialogue) {
      setChatHistory((prev) => [activeDialogue, ...prev].slice(0, 3));
    }
  }, [activeDialogue]);
  const currentChar = characters[selectedCharIndex];
  useEffect(() => {
    if (!currentChar || activeDialogue || isTypingDialogue || !unlockedIds.includes(currentChar.export_id)) return;
    const randomChat = setInterval(() => {
      if (Math.random() < 0.2) {
        triggerDialogue(currentChar, "You are standing in the lounge together. It's a quiet moment.", true);
      }
    }, 2e4);
    return () => clearInterval(randomChat);
  }, [selectedCharIndex, activeDialogue, isTypingDialogue]);
  const cyclePartner = (dir) => {
    const unlocked = characters.filter((c) => unlockedIds.includes(c.export_id));
    const currentIndex = unlocked.findIndex((c) => c.export_id === currentChar.export_id);
    if (currentIndex === -1) return;
    const nextIdx = (currentIndex + dir + unlocked.length) % unlocked.length;
    const nextChar = unlocked[nextIdx];
    setSelectedCharIndex(characters.indexOf(nextChar));
    playSound("ui_select", 0.2);
    playSound("mugen_cursor_move", 0.3);
  };
  const [showPathChooser, setShowPathChooser] = useState(false);
  const openPathChooser = (char) => {
    if (!char) return;
    setShowPathChooser(true);
  };
  const applyPathChoice = (type) => {
    if (!currentChar) return;
    let relLabel = "Neutral";
    if (type === "friend") relLabel = "Friend";
    if (type === "romantic") relLabel = "Romantic Partner";
    if (type === "enemy") relLabel = "Enemy";
    if (type === "comrade") relLabel = "Comrade";
    setCharacters((prev) => {
      const next = [...prev];
      const idx = next.findIndex((c) => String(c.export_id) === String(currentChar.export_id));
      if (idx !== -1) {
        next[idx] = {
          ...next[idx],
          relationship: relLabel,
          bondPath: getBondPath(next[idx].bondLevel, relLabel)
        };
      }
      return next;
    });
    createFloatingText(`Path set: ${relLabel}`, false, "#f472b6");
    playSound("sfx_ui_select");
    playSound("mugen_cursor_decide", 0.5);
    setShowPathChooser(false);
  };
  const getBondRewards = (relationship) => {
    const rel = (relationship || "").toLowerCase();
    const isEnemy = rel.includes("enemy");
    const isFriend = rel.includes("friend");
    const isRomantic = rel.includes("romant");
    const isComrade = rel.includes("comrade");
    const rewards = [
      { level: 5, label: isEnemy ? "Aggression I" : isFriend ? "Support I" : isRomantic ? "Affection I" : "Synergy I", desc: isEnemy ? "+10% Base Attack" : isFriend ? "+15% Base Defense" : isRomantic ? "+8% All Stats" : "+10% All Stats", icon: /* @__PURE__ */ jsxDEV(ArrowUpCircle, { size: 14 }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 6002,
        columnNumber: 221
      }) },
      { level: 10, label: isEnemy ? "Plunderer" : isFriend ? "Logistics" : isRomantic ? "Generosity" : "Balanced Flux", desc: isEnemy ? "+15% Credits" : isFriend ? "+15% Stamina Regen" : isRomantic ? "+10% Gems" : "+10% Credits & XP", icon: /* @__PURE__ */ jsxDEV(Database, { size: 14 }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 6003,
        columnNumber: 218
      }) },
      { level: 15, label: isEnemy ? "Brutality" : isFriend ? "Efficiency" : isRomantic ? "Care" : "Vigilance", desc: isEnemy ? "+15% Crit DMG" : isFriend ? "-20% Stamina Cost" : isRomantic ? "+20% Training XP" : "+10% Crit & Eva", icon: /* @__PURE__ */ jsxDEV(Zap, { size: 14 }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 6004,
        columnNumber: 214
      }) },
      { level: 20, label: isEnemy ? "Malice" : isFriend ? "Trust" : isRomantic ? "Heartbeat" : "Focus", desc: isEnemy ? "+5% Evasion" : isFriend ? "+10% Base HP" : isRomantic ? "-15% Stamina Cost" : "+10% Skill Power", icon: /* @__PURE__ */ jsxDEV(Shield, { size: 14 }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 6005,
        columnNumber: 202
      }) },
      { level: 25, label: "Battle Instinct", desc: isEnemy ? "Ignore 15% DEF" : isFriend ? "+10% Squad SPD" : isRomantic ? "Heal 5% Per Turn" : "+12% Squad Stats", icon: /* @__PURE__ */ jsxDEV(Swords, { size: 14 }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 6006,
        columnNumber: 159
      }) },
      { level: 30, label: isEnemy ? "Vengeance" : isFriend ? "Reliable" : isRomantic ? "Dreams" : "Instructor", desc: isEnemy ? "+10% Base Atk" : isFriend ? "+15% Base Def" : isRomantic ? "+15% Credits" : "+15% Training XP", icon: /* @__PURE__ */ jsxDEV(Activity, { size: 14 }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 6007,
        columnNumber: 208
      }) },
      { level: 35, label: isEnemy ? "Scorn" : isFriend ? "Team Player" : isRomantic ? "Passion" : "Tactics", desc: isEnemy ? "+15% Magic Atk" : isFriend ? "+10% Magic Def" : isRomantic ? "+10% Crit Rate" : "+10% Def/MDef", icon: /* @__PURE__ */ jsxDEV(Zap, { size: 14 }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 6008,
        columnNumber: 206
      }) },
      { level: 40, label: isEnemy ? "Aggression II" : isFriend ? "Support II" : isRomantic ? "Affection II" : "Synergy II", desc: isEnemy ? "+20% Base Atk" : isFriend ? "+20% Base Def" : isRomantic ? "+15% All Stats" : "+18% All Stats", icon: /* @__PURE__ */ jsxDEV(ArrowUpCircle, { size: 14 }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 6009,
        columnNumber: 220
      }) },
      { level: 45, label: isEnemy ? "Bloodlust" : isFriend ? "Guardian" : isRomantic ? "Spark" : "Supply Line", desc: isEnemy ? "+5% Lifesteal" : isFriend ? "Squad Takes -10% Dmg" : isRomantic ? "+25% Burst Gen" : "+15% Item Drops", icon: /* @__PURE__ */ jsxDEV(Sparkles, { size: 14 }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 6010,
        columnNumber: 216
      }) },
      { level: 50, label: isEnemy ? "Hatred's Peak" : isFriend ? "True Loyalty" : isRomantic ? "Resonance" : "Grand Resonance", desc: isEnemy ? "+10,000 PWR Bonus" : isFriend ? "Synergy Buffs x2" : isRomantic ? "1.35x All Stats" : "3x Resource Find Rate", icon: /* @__PURE__ */ jsxDEV(Trophy, { size: 14 }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 6011,
        columnNumber: 239
      }) },
      { level: 60, label: isEnemy ? "Overpower" : isFriend ? "Fellowship" : isRomantic ? "Devotion" : "Veteran", desc: isEnemy ? "+25% Base Atk" : isFriend ? "+20% Account XP" : isRomantic ? "+20% Crit Dmg" : "+20% PWR Bonus", icon: /* @__PURE__ */ jsxDEV(Users, { size: 14 }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 6012,
        columnNumber: 210
      }) },
      { level: 70, label: isEnemy ? "Shatter" : isFriend ? "Flux" : isRomantic ? "Eternal Flame" : "War Room", desc: isEnemy ? "Break Shields Easier" : isFriend ? "+15% Base HP" : isRomantic ? "+20% Skill Power" : "+15% Base SPD", icon: /* @__PURE__ */ jsxDEV(Hammer, { size: 14 }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 6013,
        columnNumber: 214
      }) },
      { level: 80, label: isEnemy ? "Dread" : isFriend ? "Unwavering" : isRomantic ? "Protection" : "Iron Will", desc: isEnemy ? "+20% Debuff Power" : isFriend ? "+30% Stun Resist" : isRomantic ? "Take 20% Less Dmg" : "+20% Base HP", icon: /* @__PURE__ */ jsxDEV(Shield, { size: 14 }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 6014,
        columnNumber: 217
      }) },
      { level: 90, label: isEnemy ? "Annihilation" : isFriend ? "Bond Shield" : isRomantic ? "Prismatic" : "Strategist", desc: isEnemy ? "+30% Crit Dmg" : isFriend ? "Start with 20% Shield" : isRomantic ? "+25% Base Speed" : "+30% Burst Gain", icon: /* @__PURE__ */ jsxDEV(Zap, { size: 14 }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 6015,
        columnNumber: 227
      }) },
      { level: 100, label: "Ultimate Bond", desc: "All path-specific benefits doubled permanently", icon: /* @__PURE__ */ jsxDEV(Star, { size: 14 }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 6016,
        columnNumber: 107
      }) }
    ];
    return rewards;
  };
  const BOND_REWARDS = getBondRewards(currentChar?.relationship);
  const sortedChars = useMemo(
    () => characters.filter((c) => unlockedIds.includes(c.export_id)).filter((c) => c.name.toLowerCase().includes(searchTerm.toLowerCase())).sort((a, b) => {
      if (sortMethod === "mood") {
        const moodA = heroMoods[a.export_id] || 50;
        const moodB = heroMoods[b.export_id] || 50;
        return moodB - moodA;
      }
      return (b.bondLevel || 0) - (a.bondLevel || 0);
    }),
    [characters, unlockedIds, searchTerm, sortMethod, heroMoods]
  );
  useEffect(() => {
    if (currentChar) playSound("ui_select", 0.15);
  }, [selectedCharIndex]);
  const bondProgress = currentChar ? currentChar.bondXp / currentChar.nextBondXp * 100 : 0;
  const currentMood = currentChar ? heroMoods[currentChar.export_id] || 50 : 50;
  const relType = currentChar ? currentChar.relationship.includes("Enemy") ? "Enemy" : currentChar.relationship.includes("Friend") ? "Friend" : currentChar.relationship.includes("Comrade") ? "Comrade" : "Romantic" : "Romantic";
  const contextConfig = {
    Romantic: {
      actionLabel: "DATE",
      btnBold: "FLIRT",
      btnBoldSub: "Risk it",
      btnChill: "CASUAL",
      btnChillSub: "Relax",
      btnListen: "LISTEN",
      btnListenSub: "Support",
      soundBold: "kiss",
      locArcade: "Fun Date",
      locPark: "Romantic Walk",
      locCafe: "Intimate Chat",
      locArena: "Couple Spar"
    },
    Friend: {
      actionLabel: "HANGOUT",
      btnBold: "JOKE",
      btnBoldSub: "Hype up",
      btnChill: "VIBE",
      btnChillSub: "Chill out",
      btnListen: "CHAT",
      btnListenSub: "Deep talk",
      soundBold: "success",
      locArcade: "Gaming Session",
      locPark: "Hangout",
      locCafe: "Grab Coffee",
      locArena: "Training"
    },
    Comrade: {
      actionLabel: "COORDINATE",
      btnBold: "OFFENSE",
      btnBoldSub: "Direct hit",
      btnChill: "TACTICS",
      btnChillSub: "Plan move",
      btnListen: "INTEL",
      btnListenSub: "Scan data",
      soundBold: "spar",
      locArcade: "Simulation",
      locPark: "Recon Patrol",
      locCafe: "Strategy Meet",
      locArena: "War Games"
    },
    Enemy: {
      actionLabel: "CONFRONT",
      btnBold: "PROVOKE",
      btnBoldSub: "Challenge",
      btnChill: "IGNORE",
      btnChillSub: "Cold shoulder",
      btnListen: "OBSERVE",
      btnListenSub: "Analyze",
      soundBold: "attack_hit",
      locArcade: "Score Attack",
      locPark: "Neutral Ground",
      locCafe: "Tense Meeting",
      locArena: "Grudge Match"
    }
  };
  const ctx = contextConfig[relType];
  const LOCATIONS = [
    { id: "arcade", name: "Cyber Arcade", type: "fun", cost: 500, stamina: 15, bg: "background_casino.png", desc: "Loud, chaotic, and energetic." },
    { id: "park", name: "Neon Park", type: "nature", cost: 200, stamina: 10, bg: "background_gacha.png", desc: "Quiet paths under holographic trees." },
    { id: "cafe", name: "Starlight Caf\xE9", type: "chill", cost: 800, stamina: 5, bg: "background_hub.png", desc: "Premium drinks and privacy." },
    { id: "arena", name: "Sparring Ring", type: "active", cost: 0, stamina: 30, bg: "background_gym.png", desc: "Physical exertion and combat." }
  ];
  const DATE_SCENARIOS = {
    arcade: [
      "The lights are blinding and the music is loud enough to feel in your chest. A claw machine catches their eye.",
      "Someone challenges you both to a dance-pad battle. The crowd is starting to gather.",
      "The high score board lights up with a name neither of you recognize. A rivalry is born.",
      "A vending machine eats your tokens. They're either furious or delighted -- hard to tell which."
    ],
    park: [
      "Holographic fireflies drift between the trees. It's quieter out here than the city ever gets.",
      "A street performer is playing something slow on a synth-violin a few benches down.",
      "The path forks -- one way loops past the fountain, the other cuts through the trees.",
      "Rain starts, just barely. Neither of you moves to leave."
    ],
    cafe: [
      "The barista already knows their order. That's either charming or a little concerning.",
      "A booth in the back just opened up, away from the noise.",
      "Their drink arrives with a free pastry -- a mistake, or a not-so-subtle gift from the staff.",
      "The conversation lulls for a moment, comfortable instead of awkward."
    ],
    arena: [
      "The mats are still warm from the last match. Someone's watching from the bleachers.",
      "A weight rack clatters somewhere behind you. Neither of you flinches.",
      "The scoreboard from the last round is still up. It's not close.",
      "Sweat, adrenaline, and absolutely no intention of going easy on each other."
    ]
  };
  const getDateScenario = (locId, turn) => {
    const pool = DATE_SCENARIOS[locId] || DATE_SCENARIOS.cafe;
    return pool[(turn - 1) % pool.length];
  };
  const charMemories = currentChar ? dateMemories[String(currentChar.export_id)] || [] : [];
  const memoryBondBonus = Math.min(0.25, charMemories.length * 0.01);
  const calculateCompatibility = (char, location) => {
    let score = 0;
    if (char.element === "FIRE" && location.id === "arena") score += 2;
    if (char.element === "WIND" && location.id === "arcade") score += 2;
    if (char.element === "WATER" && (location.id === "cafe" || location.id === "park")) score += 2;
    if (char.element === "EARTH" && (location.id === "arena" || location.id === "park")) score += 2;
    if (char.element === "DARK" && location.id === "arcade") score += 2;
    if (char.element === "LIGHT" && location.id === "cafe") score += 2;
    if (char.growthType === "Aggressive" && (location.id === "arena" || location.id === "arcade")) score += 1;
    if (char.growthType === "Defensive" && (location.id === "park" || location.id === "cafe")) score += 1;
    if (char.growthType === "Swift" && location.id === "arcade") score += 1;
    if (char.relationship.includes("Enemy") && location.id === "arena") score += 2;
    if (char.relationship.includes("Romantic") && location.id === "cafe") score += 2;
    return Math.min(5, score);
  };
  const beginDate = (locationId) => {
    const loc = LOCATIONS.find((l) => l.id === locationId);
    if (credits < loc.cost) {
      createFloatingText(`Need $${loc.cost}`, true);
      return;
    }
    if (stamina < loc.stamina) {
      createFloatingText(`Too tired (${loc.stamina} STA)`, true);
      return;
    }
    setCredits((c) => c - loc.cost);
    setStamina((s) => s - loc.stamina);
    const compat = calculateCompatibility(currentChar, loc);
    setDateSession({
      active: true,
      location: loc,
      phase: "action",
      affinity: 20 + compat * 10,
      turn: 1,
      history: []
    });
    playSound("date");
    triggerDialogue(currentChar, `Arrived at ${loc.name}. Compatibility seems ${compat > 2 ? "High" : "Low"}.`, true);
  };
  const handleDateChoice = async (type) => {
    const t = String(type || "").toLowerCase();
    let score = 0;
    const charId = String(currentChar.export_id);
    const mood = heroMoods[charId] || 50;
    const choice = t === "listen" || t === "listening" ? "listening" : t;
    if (choice === "bold") {
      const threshold = relType === "Enemy" ? 40 : 65;
      score = mood > threshold ? 20 : mood < 30 ? -10 : 5;
      playSound(score > 0 ? ctx.soundBold : "error");
    } else if (choice === "listening") {
      score = mood < 55 ? 18 : 8;
      playSound(relType === "Enemy" ? "click" : "headpat");
    } else {
      score = 12;
      playSound("success");
    }
    score += Math.floor(Math.random() * 6) - 2;
    setDateSession((prev) => {
      const nextTurn = (prev.turn || 0) + 1;
      const nextAffinity = Math.min(100, Math.max(0, (prev.affinity || 0) + score));
      const history = [...prev.history || [], { choice, delta: score, affinity: nextAffinity, turn: nextTurn }];
      return {
        ...prev,
        affinity: nextAffinity,
        phase: nextTurn > 3 ? "end" : "action",
        turn: nextTurn,
        history
      };
    });
    const effect = relType === "Romantic" ? "fx_heart.png" : relType === "Enemy" ? "fx_impact.png" : "fx_sparkle.png";
    if (score > 10) triggerVisualEffect2(effect, "50%", "40%", 1.5);
    else triggerVisualEffect2("fx_sparkle.png", "50%", "40%", 1);
    const actionLabel = choice === "bold" ? ctx.btnBold : choice === "listening" ? ctx.btnListen : ctx.btnChill;
    const reactionPrompt = `[Relationship: ${relType}] I chose to ${actionLabel} (Action: ${choice}). Mood was ${mood}%. Affinity Change: ${score > 0 ? "+" : ""}${score}.`;
    triggerDialogue(currentChar, reactionPrompt, true);
  };
  const finishDate = () => {
    const finalAffinity = dateSession.affinity;
    let bondGain = Math.floor(finalAffinity * 2.5 * (1 + memoryBondBonus));
    let moodGain = Math.floor(finalAffinity * 0.5);
    setCharacters((prev) => {
      const next = [...prev];
      const idx = next.findIndex((c2) => c2.export_id === currentChar.export_id);
      const c = { ...next[idx] };
      c.bondXp += Math.floor(bondGain * getBondMultiplier(c));
      while (c.bondXp >= c.nextBondXp && c.bondLevel < 100) {
        c.bondXp -= c.nextBondXp;
        c.bondLevel++;
        c.nextBondXp = 80 + c.bondLevel * 25;
      }
      next[idx] = c;
      return next;
    });
    setHeroMoods((prev) => ({
      ...prev,
      [currentChar.export_id]: Math.min(100, (prev[currentChar.export_id] || 50) + moodGain)
    }));
    // New feature: Memory Keepsakes -- a truly great date (affinity 75+) leaves a
    // permanent memory behind. Each memory grants a small, stacking, permanent
    // bonus to all future bond gains with this character (capped at +25%).
    let madeMemory = false;
    if (finalAffinity >= 75 && typeof setDateMemories === "function") {
      madeMemory = true;
      const titlePool = finalAffinity >= 95 ? ["A Perfect Night", "Unforgettable", "Sparks Flew"] : ["A Great Time", "Worth Remembering", "A Good Day"];
      const memory = {
        id: Date.now(),
        location: dateSession.location?.name || "Somewhere",
        affinity: finalAffinity,
        title: titlePool[Math.floor(Math.random() * titlePool.length)],
        timestamp: Date.now()
      };
      setDateMemories((prev) => {
        const key = String(currentChar.export_id);
        const list = [memory, ...(prev[key] || [])].slice(0, 20);
        return { ...prev, [key]: list };
      });
    }
    const finalGain = Math.floor(bondGain * getBondMultiplier(currentChar));
    createFloatingText(`Date Finished! +${finalGain} Bond${madeMemory ? " • New Memory!" : ""}`, false, "#f472b6");
    setDateSession({ active: false, location: null, phase: "select", affinity: 0, turn: 0, history: [] });
    setActiveTab(madeMemory ? "memories" : "actions");
  };
  let bgImage = "background_hub.png";
  if (dateSession.active && dateSession.location) bgImage = dateSession.location.bg;
  else if (currentChar) {
    if (currentChar.element === "FIRE") bgImage = "background_gym.png";
    else if (currentChar.element === "WATER") bgImage = "background_hub.png";
    else if (currentChar.element === "WIND") bgImage = "background_gacha.png";
    else if (currentChar.element === "DARK") bgImage = "background_battle.png";
    else bgImage = "background_casino.png";
  }
  return /* @__PURE__ */ jsxDEV("div", { className: "lounge-wrapper aero-glass animate-fadeIn", style: { borderRadius: isMobile2 ? "0" : "24px", border: "1px solid rgba(255,255,255,0.2)" }, children: [
    /* @__PURE__ */ jsxDEV("div", { className: `lounge-sidebar aero-glass custom-scroll ${showSidebar ? "open" : ""}`, style: {
      boxShadow: showSidebar ? "15px 0 50px rgba(0,0,0,0.9)" : "none",
      borderRadius: isMobile2 ? "0 24px 24px 0" : "0"
    }, children: [
      /* @__PURE__ */ jsxDEV("div", { className: "lounge-sidebar-header", children: [
        /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" }, children: [
          /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", alignItems: "center", gap: 8, fontSize: "0.9rem", fontWeight: 900, color: "#f472b6" }, children: [
            /* @__PURE__ */ jsxDEV(Heart, { size: 18, fill: "#f472b6" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 6240,
              columnNumber: 21
            }),
            " RELATIONSHIPS"
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 6239,
            columnNumber: 17
          }),
          /* @__PURE__ */ jsxDEV("button", { onClick: () => setSortMethod((s) => s === "level" ? "mood" : "level"), style: { background: "transparent", border: "none", color: "#fff", cursor: "pointer" }, children: sortMethod === "level" ? /* @__PURE__ */ jsxDEV(Trophy, { size: 14 }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 6243,
            columnNumber: 47
          }) : /* @__PURE__ */ jsxDEV(Activity, { size: 14 }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 6243,
            columnNumber: 70
          }) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 6242,
            columnNumber: 17
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 6238,
          columnNumber: 13
        }),
        /* @__PURE__ */ jsxDEV(
          "input",
          {
            className: "search-bar",
            placeholder: "Filter...",
            value: searchTerm,
            onChange: (e) => setSearchTerm(e.target.value),
            style: { padding: "8px", fontSize: "0.8rem" }
          },
          void 0,
          false,
          {
            fileName: "<stdin>",
            lineNumber: 6246,
            columnNumber: 13
          }
        )
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 6237,
        columnNumber: 9
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "bond-list custom-scroll", children: sortedChars.map((c) => /* @__PURE__ */ jsxDEV(
        "div",
        {
          className: `bond-contact-card ${currentChar && c.export_id === currentChar.export_id ? "active" : ""}`,
          onClick: () => {
            setSelectedCharIndex(characters.indexOf(c));
            setChatHistory([]);
            setDateSession((prev) => ({ ...prev, active: false }));
            if (window.innerWidth < 900) setShowSidebar(false);
          },
          children: [
            /* @__PURE__ */ jsxDEV("img", { src: c.imageUrl, className: "contact-avatar" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 6266,
              columnNumber: 21
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "contact-info", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "contact-name", children: c.name }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 6268,
                columnNumber: 25
              }),
              /* @__PURE__ */ jsxDEV("div", { className: "contact-status", children: [
                /* @__PURE__ */ jsxDEV("span", { children: [
                  "Lv.",
                  c.bondLevel
                ] }, void 0, true, {
                  fileName: "<stdin>",
                  lineNumber: 6270,
                  columnNumber: 29
                }),
                c.relationship.includes("Romantic") && /* @__PURE__ */ jsxDEV(Heart, { size: 10, fill: "#f472b6", color: "#f472b6" }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 6271,
                  columnNumber: 69
                })
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 6269,
                columnNumber: 25
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 6267,
              columnNumber: 21
            })
          ]
        },
        c.export_id,
        true,
        {
          fileName: "<stdin>",
          lineNumber: 6256,
          columnNumber: 17
        }
      )) }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 6254,
        columnNumber: 9
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 6233,
      columnNumber: 7
    }),
    /* @__PURE__ */ jsxDEV("button", { className: "mobile-toggle-btn", onClick: () => setShowSidebar(!showSidebar), children: /* @__PURE__ */ jsxDEV(Users, { size: 20 }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 6280,
      columnNumber: 9
    }) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 6279,
      columnNumber: 7
    }),
    /* @__PURE__ */ jsxDEV("div", { className: "lounge-scene", children: currentChar ? /* @__PURE__ */ jsxDEV(Fragment, { children: [
      /* @__PURE__ */ jsxDEV("div", { className: "lounge-bg", style: { backgroundImage: `url(${bgImage})` } }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 6287,
        columnNumber: 17
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "lounge-char-layer", children: /* @__PURE__ */ jsxDEV(
        "img",
        {
          src: currentChar.imageUrl,
          className: `lounge-art-img hero-breath ${isShaking ? "shake-effect" : ""}`,
          onClick: () => triggerDialogue(currentChar, "touch"),
          alt: currentChar.name
        },
        void 0,
        false,
        {
          fileName: "<stdin>",
          lineNumber: 6291,
          columnNumber: 21
        }
      ) }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 6290,
        columnNumber: 17
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "lounge-hud-top", style: { padding: isMobile2 ? "60px 15px 10px 15px" : "30px", background: "linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)" }, children: [
        /* @__PURE__ */ jsxDEV("div", { className: "lounge-info-box", children: [
          /* @__PURE__ */ jsxDEV("h1", { className: "lounge-name", style: { fontSize: isMobile2 ? "2.2rem" : "4rem", textShadow: "0 4px 10px rgba(0,0,0,0.8)" }, children: currentChar.name }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 6302,
            columnNumber: 25
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "lounge-meta", style: { background: "rgba(0,0,0,0.5)", padding: "5px 15px", borderRadius: 20, backdropFilter: "blur(5px)", display: "inline-flex" }, children: [
            /* @__PURE__ */ jsxDEV("span", { style: { opacity: 0.8, fontSize: isMobile2 ? "0.75rem" : "0.9rem", color: "#fff" }, children: currentChar.franchise }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 6304,
              columnNumber: 29
            }),
            /* @__PURE__ */ jsxDEV("span", { style: { width: 1, height: 12, background: "rgba(255,255,255,0.3)", margin: "0 8px" } }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 6305,
              columnNumber: 29
            }),
            /* @__PURE__ */ jsxDEV("span", { className: "path-badge", style: { fontSize: isMobile2 ? "0.6rem" : "0.7rem", background: "transparent", border: "none", padding: 0 }, children: currentChar.relationship }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 6306,
              columnNumber: 29
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 6303,
            columnNumber: 25
          }),
          /* @__PURE__ */ jsxDEV("div", { style: { marginTop: 15, width: "220px", position: "relative", background: "rgba(0,0,0,0.6)", padding: 10, borderRadius: 12 }, children: [
            /* @__PURE__ */ jsxDEV("div", { className: "mood-label-mini", style: { color: currentMood > 75 ? "#4ade80" : currentMood > 40 ? "#facc15" : "#ef4444", top: -5, right: 10, fontSize: "0.7rem" }, children: [
              "MOOD: ",
              Math.floor(currentMood),
              "%"
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 6309,
              columnNumber: 29
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "mood-gauge-container", style: { height: 6, background: "rgba(255,255,255,0.1)" }, children: /* @__PURE__ */ jsxDEV("div", { className: "mood-gauge-fill", style: {
              width: `${currentMood}%`,
              background: currentMood > 75 ? "linear-gradient(90deg, #22c55e, #4ade80)" : currentMood > 40 ? "linear-gradient(90deg, #f59e0b, #facc15)" : "linear-gradient(90deg, #b91c1c, #ef4444)",
              boxShadow: `0 0 10px ${currentMood > 75 ? "#4ade80" : currentMood > 40 ? "#facc15" : "#ef4444"}`
            } }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 6313,
              columnNumber: 33
            }) }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 6312,
              columnNumber: 29
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 6308,
            columnNumber: 25
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 6301,
          columnNumber: 21
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "bond-heart-display", children: /* @__PURE__ */ jsxDEV("div", { style: { display: isMobile2 ? "flex" : "block", alignItems: "center", gap: 10, background: "rgba(0,0,0,0.6)", padding: "15px 25px", borderRadius: 20, backdropFilter: "blur(5px)" }, children: [
          !isMobile2 && /* @__PURE__ */ jsxDEV("div", { className: "bond-lvl-label", style: { fontSize: "0.7rem", color: "#f472b6" }, children: "BOND LEVEL" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 6326,
            columnNumber: 43
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "bond-heart-val", style: { fontSize: isMobile2 ? "1.8rem" : "3rem" }, children: [
            currentChar.bondLevel,
            " ",
            /* @__PURE__ */ jsxDEV(Heart, { size: isMobile2 ? 24 : 36, fill: "#f472b6" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 6328,
              columnNumber: 57
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 6327,
            columnNumber: 29
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "bond-progress-track", style: { width: isMobile2 ? "100px" : "100%", margin: isMobile2 ? "0" : "5px 0 0 auto", height: 4 }, children: /* @__PURE__ */ jsxDEV("div", { className: "bond-progress-bar", style: { width: `${bondProgress}%` } }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 6331,
            columnNumber: 33
          }) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 6330,
            columnNumber: 29
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 6325,
          columnNumber: 25
        }) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 6324,
          columnNumber: 21
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 6300,
        columnNumber: 17
      }),
      !isMobile2 && /* @__PURE__ */ jsxDEV(Fragment, { children: [
        /* @__PURE__ */ jsxDEV("button", { className: "hero-cycle-btn prev", style: { left: showSidebar ? "280px" : "20px", zIndex: 100 }, onClick: () => cyclePartner(-1), children: /* @__PURE__ */ jsxDEV(ChevronLeft, { size: 32 }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 6341,
          columnNumber: 29
        }) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 6340,
          columnNumber: 25
        }),
        /* @__PURE__ */ jsxDEV("button", { className: "hero-cycle-btn next", style: { right: "20px", zIndex: 100 }, onClick: () => cyclePartner(1), children: /* @__PURE__ */ jsxDEV(ChevronRight, { size: 32 }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 6344,
          columnNumber: 29
        }) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 6343,
          columnNumber: 25
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 6339,
        columnNumber: 21
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "chat-log-overlay", children: chatHistory.map((msg, i) => /* @__PURE__ */ jsxDEV("div", { className: "chat-entry", style: { opacity: 1 - i * 0.3 }, children: msg.text }, i, false, {
        fileName: "<stdin>",
        lineNumber: 6352,
        columnNumber: 25
      })) }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 6350,
        columnNumber: 17
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "lounge-bottom-deck", children: !dateSession.active ? /* @__PURE__ */ jsxDEV(Fragment, { children: [
        /* @__PURE__ */ jsxDEV("div", { className: "deck-tabs-row", children: [
          /* @__PURE__ */ jsxDEV("button", { className: `deck-tab-btn ${activeTab === "actions" ? "active" : ""}`, onClick: () => {
            setActiveTab("actions");
            playSound("ui_hover", 0.15);
          }, children: "INTERACT" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 6363,
            columnNumber: 33
          }),
          /* @__PURE__ */ jsxDEV("button", { className: `deck-tab-btn ${activeTab === "date" ? "active" : ""}`, onClick: () => {
            setActiveTab("date");
            playSound("ui_hover", 0.15);
          }, children: ctx.actionLabel }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 6364,
            columnNumber: 33
          }),
          /* @__PURE__ */ jsxDEV("button", { className: `deck-tab-btn ${activeTab === "gift" ? "active" : ""}`, onClick: () => {
            setActiveTab("gift");
            playSound("ui_hover", 0.15);
          }, children: "GIFT" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 6365,
            columnNumber: 33
          }),
          /* @__PURE__ */ jsxDEV("button", { className: `deck-tab-btn ${activeTab === "memories" ? "active" : ""}`, onClick: () => {
            setActiveTab("memories");
            playSound("ui_hover", 0.15);
          }, children: "MEMORIES" }, void 0, false, {}),
          /* @__PURE__ */ jsxDEV("button", { className: `deck-tab-btn ${activeTab === "perks" ? "active" : ""}`, onClick: () => {
            setActiveTab("perks");
            playSound("ui_hover", 0.15);
          }, children: "PROFILE" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 6366,
            columnNumber: 33
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 6362,
          columnNumber: 29
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "deck-content-area custom-scroll", children: [
          activeTab === "actions" && /* @__PURE__ */ jsxDEV(
            SocialView,
            {
              char: currentChar,
              credits,
              setCredits,
              setCharacters,
              selectedCharIndex,
              triggerDialogue,
              triggerVisualEffect: triggerVisualEffect2,
              createFloatingText,
              stamina,
              setStamina,
              activeDialogue,
              isTypingDialogue,
              setIsTypingDialogue,
              isShaking,
              heroVibes,
              appearanceTags,
              totalAccountLevel,
              heroMoods,
              setHeroMoods,
              inventory,
              removeFromInventory,
              setGems,
              setAura,
              onDateStart: () => setActiveTab("date"),
              onOpenPathChooser: openPathChooser
            },
            void 0,
            false,
            {
              fileName: "<stdin>",
              lineNumber: 6371,
              columnNumber: 37
            }
          ),
          activeTab === "date" && /* @__PURE__ */ jsxDEV("div", { className: "animate-fadeIn", children: [
            /* @__PURE__ */ jsxDEV("div", { style: { textAlign: "center", marginBottom: 20, color: relType === "Enemy" ? "#ef4444" : "#f472b6", fontWeight: 900, fontSize: "0.8rem", letterSpacing: 1 }, children: [
              "SELECT DESTINATION (MOOD: ",
              Math.floor(currentMood),
              "%)"
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 6388,
              columnNumber: 41
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "date-locations-grid", children: LOCATIONS.map((loc) => {
              let flavorName = loc.name;
              let flavorDesc = loc.desc;
              if (loc.id === "arcade") flavorName = ctx.locArcade;
              if (loc.id === "park") flavorName = ctx.locPark;
              if (loc.id === "cafe") flavorName = ctx.locCafe;
              if (loc.id === "arena") flavorName = ctx.locArena;
              return /* @__PURE__ */ jsxDEV("div", { className: "location-card", onClick: () => beginDate(loc.id), children: [
                /* @__PURE__ */ jsxDEV("div", { className: "loc-img", style: { backgroundImage: `url(${loc.bg})` } }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 6403,
                  columnNumber: 57
                }),
                /* @__PURE__ */ jsxDEV("div", { className: "loc-info", children: [
                  /* @__PURE__ */ jsxDEV("div", { className: "loc-name", children: flavorName }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 6405,
                    columnNumber: 61
                  }),
                  /* @__PURE__ */ jsxDEV("div", { className: "loc-desc", children: flavorDesc }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 6406,
                    columnNumber: 61
                  }),
                  /* @__PURE__ */ jsxDEV("div", { className: "loc-cost", children: [
                    /* @__PURE__ */ jsxDEV("span", { style: { color: "#facc15" }, children: [
                      "$",
                      loc.cost
                    ] }, void 0, true, {
                      fileName: "<stdin>",
                      lineNumber: 6408,
                      columnNumber: 65
                    }),
                    " \u2022 ",
                    /* @__PURE__ */ jsxDEV("span", { style: { color: "#4ade80" }, children: [
                      loc.stamina,
                      " STA"
                    ] }, void 0, true, {
                      fileName: "<stdin>",
                      lineNumber: 6408,
                      columnNumber: 119
                    })
                  ] }, void 0, true, {
                    fileName: "<stdin>",
                    lineNumber: 6407,
                    columnNumber: 61
                  })
                ] }, void 0, true, {
                  fileName: "<stdin>",
                  lineNumber: 6404,
                  columnNumber: 57
                })
              ] }, loc.id, true, {
                fileName: "<stdin>",
                lineNumber: 6402,
                columnNumber: 53
              });
            }) }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 6391,
              columnNumber: 41
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 6387,
            columnNumber: 37
          }),
          activeTab === "gift" && /* @__PURE__ */ jsxDEV("div", { className: "animate-fadeIn", children: [
            /* @__PURE__ */ jsxDEV("div", { style: { textAlign: "center", marginBottom: 15, color: ELEMENTS[currentChar.element]?.color || "#4ade80", fontWeight: 900, fontSize: "0.75rem", letterSpacing: 1 }, children: [
              "GIFT AFFINITY: GIVE ",
              /* @__PURE__ */ jsxDEV("span", { style: { textDecoration: "underline" }, children: currentChar.element }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 6421,
                columnNumber: 65
              }),
              " ITEMS FOR +50% BOND"
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 6420,
              columnNumber: 41
            }),
            /* @__PURE__ */ jsxDEV(
              InventoryView,
              {
                inventory,
                characters,
                unlockedIds,
                autoTargetId: currentChar.export_id,
                selectedCharIndex,
                removeFromInventory,
                setCharacters,
                setStamina,
                createFloatingText,
                credits,
                setCredits,
                setGems,
                setMaterials,
                essence,
                setEssence,
                items,
                skills,
                auraUpgrades
              },
              void 0,
              false,
              {
                fileName: "<stdin>",
                lineNumber: 6423,
                columnNumber: 41
              }
            )
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 6419,
            columnNumber: 37
          }),
          activeTab === "memories" && /* @__PURE__ */ jsxDEV("div", { className: "animate-fadeIn custom-scroll", children: [
            /* @__PURE__ */ jsxDEV("div", { style: { textAlign: "center", marginBottom: 15 }, children: [
              /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.7rem", color: "#00d2ff", fontWeight: 900, letterSpacing: 1 }, children: "MEMORY KEEPSAKES" }, void 0, false, {}),
              /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.65rem", opacity: 0.6, marginTop: 4 }, children: [
                charMemories.length,
                " saved • +",
                Math.round(memoryBondBonus * 100),
                "% Bond Gain from memories"
              ] }, void 0, true, {})
            ] }, void 0, true, {}),
            charMemories.length === 0 ? /* @__PURE__ */ jsxDEV("div", { style: { textAlign: "center", opacity: 0.5, fontSize: "0.75rem", padding: "30px 10px" }, children: "No memories yet. A truly great date (high affinity) will leave one behind." }, void 0, false, {}) : /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", flexDirection: "column", gap: 8 }, children: charMemories.map((m) => /* @__PURE__ */ jsxDEV("div", { className: "memory-keepsake-card", children: [
              /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
                /* @__PURE__ */ jsxDEV("span", { style: { fontWeight: 900, fontSize: "0.8rem", color: "#fff" }, children: m.title }, void 0, false, {}),
                /* @__PURE__ */ jsxDEV("span", { style: { fontSize: "0.65rem", fontWeight: 800, color: m.affinity >= 95 ? "#facc15" : "#00d2ff" }, children: [
                  m.affinity,
                  "% affinity"
                ] }, void 0, true, {})
              ] }, void 0, true, {}),
              /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.65rem", opacity: 0.6, marginTop: 2 }, children: ["At ", m.location] }, void 0, true, {})
            ] }, m.id, true, {})) }, void 0, false, {})
          ] }, void 0, true, {}),
          activeTab === "perks" && /* @__PURE__ */ jsxDEV("div", { className: "animate-fadeIn custom-scroll", children: [
            /* @__PURE__ */ jsxDEV("div", { style: { textAlign: "center", marginBottom: 15 }, children: [
              /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "2rem", fontWeight: 900, color: "#f472b6" }, children: currentChar.bondLevel }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 6449,
                columnNumber: 45
              }),
              /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.7rem", opacity: 0.6 }, children: "RESONANCE RANK" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 6450,
                columnNumber: 45
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 6448,
              columnNumber: 41
            }),
            BOND_REWARDS.map((reward, idx) => {
              const isUnlocked = currentChar.bondLevel >= reward.level;
              return /* @__PURE__ */ jsxDEV("div", { className: `bond-perk-node ${isUnlocked ? "unlocked" : ""}`, children: [
                /* @__PURE__ */ jsxDEV("div", { className: "bond-perk-icon", children: isUnlocked ? reward.icon : /* @__PURE__ */ jsxDEV(Ban, { size: 14, opacity: 0.5 }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 6457,
                  columnNumber: 85
                }) }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 6456,
                  columnNumber: 53
                }),
                /* @__PURE__ */ jsxDEV("div", { className: "bond-perk-info", children: [
                  /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
                    /* @__PURE__ */ jsxDEV("span", { className: "bond-perk-title", children: reward.label }, void 0, false, {
                      fileName: "<stdin>",
                      lineNumber: 6461,
                      columnNumber: 61
                    }),
                    /* @__PURE__ */ jsxDEV("span", { style: { fontSize: "0.6rem", fontWeight: 900 }, children: [
                      "LV.",
                      reward.level
                    ] }, void 0, true, {
                      fileName: "<stdin>",
                      lineNumber: 6462,
                      columnNumber: 61
                    })
                  ] }, void 0, true, {
                    fileName: "<stdin>",
                    lineNumber: 6460,
                    columnNumber: 57
                  }),
                  /* @__PURE__ */ jsxDEV("div", { className: "bond-perk-desc", children: reward.desc }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 6464,
                    columnNumber: 57
                  }),
                  isUnlocked && /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.55rem", color: "#4ade80", fontWeight: 800, marginTop: 4 }, children: "ACTIVE BONUS" }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 6465,
                    columnNumber: 72
                  })
                ] }, void 0, true, {
                  fileName: "<stdin>",
                  lineNumber: 6459,
                  columnNumber: 53
                })
              ] }, idx, true, {
                fileName: "<stdin>",
                lineNumber: 6455,
                columnNumber: 49
              });
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 6447,
            columnNumber: 37
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 6369,
          columnNumber: 29
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 6361,
        columnNumber: 25
      }) : /* @__PURE__ */ jsxDEV("div", { className: "date-actions-panel glass-panel", style: { height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }, children: dateSession.phase === "end" ? /* @__PURE__ */ jsxDEV("div", { style: { textAlign: "center" }, children: [
        /* @__PURE__ */ jsxDEV("h2", { style: { color: "#f472b6" }, children: "DATE CONCLUDED" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 6478,
          columnNumber: 37
        }),
        /* @__PURE__ */ jsxDEV("p", { style: { opacity: 0.8, fontSize: "1.2rem" }, children: [
          "Affinity: ",
          dateSession.affinity,
          "%"
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 6479,
          columnNumber: 37
        }),
        /* @__PURE__ */ jsxDEV("button", { className: "train-btn", onClick: finishDate, children: "COMPLETE" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 6480,
          columnNumber: 37
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 6477,
        columnNumber: 33
      }) : /* @__PURE__ */ jsxDEV("div", { className: "animate-fadeIn", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "date-scenario-box", ref: (el) => {
          if (el) gsap.fromTo(el, { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" });
        }, children: getDateScenario(dateSession.location?.id, dateSession.turn) }, dateSession.turn, false, {}),
        /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.7rem", textAlign: "center", marginBottom: 14, fontWeight: 900, color: "#00d2ff", letterSpacing: 1 }, children: [
          "TURN ",
          dateSession.turn,
          "/3 • How do you respond?"
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 6484,
          columnNumber: 37
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "date-choices-row", children: [
          /* @__PURE__ */ jsxDEV("button", { className: "date-choice-btn bold", onClick: () => handleDateChoice("bold"), children: [
            /* @__PURE__ */ jsxDEV("div", { className: "choice-label", children: ctx.btnBold }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 6487,
              columnNumber: 45
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "choice-sub", children: ctx.btnBoldSub }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 6488,
              columnNumber: 45
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 6486,
            columnNumber: 41
          }),
          /* @__PURE__ */ jsxDEV("button", { className: "date-choice-btn chill", onClick: () => handleDateChoice("chill"), children: [
            /* @__PURE__ */ jsxDEV("div", { className: "choice-label", children: ctx.btnChill }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 6491,
              columnNumber: 45
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "choice-sub", children: ctx.btnChillSub }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 6492,
              columnNumber: 45
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 6490,
            columnNumber: 41
          }),
          /* @__PURE__ */ jsxDEV("button", { className: "date-choice-btn listen", onClick: () => handleDateChoice("listening"), children: [
            /* @__PURE__ */ jsxDEV("div", { className: "choice-label", children: ctx.btnListen }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 6495,
              columnNumber: 45
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "choice-sub", children: ctx.btnListenSub }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 6496,
              columnNumber: 45
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 6494,
            columnNumber: 41
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 6485,
          columnNumber: 37
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 6483,
        columnNumber: 33
      }) }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 6475,
        columnNumber: 25
      }) }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 6359,
        columnNumber: 17
      }),
      showPathChooser && /* @__PURE__ */ jsxDEV("div", { className: "hero-select-modal animate-fadeIn", style: { justifyContent: "center", alignItems: "center" }, children: /* @__PURE__ */ jsxDEV("div", { style: { width: "100%", maxWidth: "400px", textAlign: "center" }, children: [
        /* @__PURE__ */ jsxDEV("h2", { style: { fontSize: "1.5rem", marginBottom: 10, color: "#fff", textTransform: "uppercase" }, children: "Relationship Path" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 6508,
          columnNumber: 29
        }),
        /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", flexDirection: "column", gap: 10 }, children: [
          /* @__PURE__ */ jsxDEV("button", { className: "bond-interaction-card", onClick: () => applyPathChoice("friend"), children: /* @__PURE__ */ jsxDEV("div", { className: "interaction-label", style: { color: "#4ade80" }, children: "FRIEND" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 6511,
            columnNumber: 37
          }) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 6510,
            columnNumber: 33
          }),
          /* @__PURE__ */ jsxDEV("button", { className: "bond-interaction-card", onClick: () => applyPathChoice("romantic"), children: /* @__PURE__ */ jsxDEV("div", { className: "interaction-label", style: { color: "#f472b6" }, children: "LOVER" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 6514,
            columnNumber: 37
          }) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 6513,
            columnNumber: 33
          }),
          /* @__PURE__ */ jsxDEV("button", { className: "bond-interaction-card", onClick: () => applyPathChoice("enemy"), children: /* @__PURE__ */ jsxDEV("div", { className: "interaction-label", style: { color: "#ef4444" }, children: "ENEMY" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 6517,
            columnNumber: 37
          }) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 6516,
            columnNumber: 33
          }),
          /* @__PURE__ */ jsxDEV("button", { className: "bond-interaction-card", onClick: () => applyPathChoice("comrade"), children: /* @__PURE__ */ jsxDEV("div", { className: "interaction-label", style: { color: "#60a5fa" }, children: "COMRADE" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 6520,
            columnNumber: 37
          }) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 6519,
            columnNumber: 33
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 6509,
          columnNumber: 29
        }),
        /* @__PURE__ */ jsxDEV("button", { className: "menu-btn", style: { marginTop: 20 }, onClick: () => setShowPathChooser(false), children: "CANCEL" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 6523,
          columnNumber: 29
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 6507,
        columnNumber: 25
      }) }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 6506,
        columnNumber: 21
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 6286,
      columnNumber: 13
    }) : /* @__PURE__ */ jsxDEV("div", { className: "lounge-empty-state", children: [
      /* @__PURE__ */ jsxDEV(Heart, { size: 48, opacity: 0.2 }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 6530,
        columnNumber: 17
      }),
      /* @__PURE__ */ jsxDEV("p", { children: "Select a partner from the sidebar." }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 6531,
        columnNumber: 17
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 6529,
      columnNumber: 13
    }) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 6284,
      columnNumber: 7
    })
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 6231,
    columnNumber: 5
  });
};;

export { BondView };
