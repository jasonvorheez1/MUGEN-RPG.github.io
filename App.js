import { Fragment, jsxDEV } from "react/jsx-dev-runtime";
import React, { useState, useEffect, useRef, useMemo } from "react";
import gsap from "gsap";
import {
  Sword,
  Zap,
  Heart,
  Trophy,
  ShoppingBag,
  ArrowUpCircle,
  Users,
  Settings,
  Gem,
  Sparkles,
  Star,
  Home,
  LayoutGrid,
  MoreHorizontal,
  Swords,
  Package,
  Clover,
  Database,
  Activity,
  Monitor
} from "lucide-react";
import { CHARACTER_DATA_URL, SKILL_TYPES, TIER_STATS, SKILL_RARITY_CONFIG, LEADER_SKILLS, ELEMENTS, MUSIC_TRACKS } from "./constants.js";
import { playSound, getBondRankName, calculateSubStat, generateAI, getBondPath, getBondMultiplier, setLiveAuraUpgrades, preloadCommonSounds, formatPower } from "./utils.js";
import { Particle, FloatingText, BackgroundLayer, VisualEffect } from "./components.js";
import { HomeView } from "./views/HomeView.js";
import { CharacterDetailView } from "./views/CharacterDetailView.js";
import { AbilitiesView } from "./views/AbilitiesView.js";
import { SocialView } from "./views/SocialView.js";
import { RosterView } from "./views/RosterView.js";
import { ShopView } from "./views/ShopView.js";
import { MissionsView } from "./views/MissionsView.js";
import { SettingsView } from "./views/SettingsView.js";
import { InventoryView } from "./views/InventoryView.js";
import { CampaignView } from "./views/CampaignView.js";
import { RecruitView } from "./views/RecruitView.js";
import { TrialsView } from "./views/TrialsView.js";
import { BondView } from "./views/BondView.js";
import { EventsView } from "./views/EventsView.js";
import { SquadBuilderModal } from "./CombatSystem.js";
import { playMidi, stopMidi, setMidiVolume } from "./midiEngine.js";
const App = () => {
  const [characters, setCharacters] = useState([]);
  const [skills, setSkills] = useState([]);
  const [items, setItems] = useState({});
  const [selectedCharIndex, setSelectedCharIndex] = useState(parseInt(localStorage.getItem("mugen_last_char_index") || "0"));
  const [loading, setLoading] = useState(true);
  const [floatingTexts, setFloatingTexts] = useState([]);
  const [particles, setParticles] = useState([]);
  const [autoTrainLevel, setAutoTrainLevel] = useState(0);
  const [view, setView] = useState("home");
  const [appState, setAppState] = useState("launcher");
  const [showSquadBuilder, setShowSquadBuilder] = useState(false);
  const [showMobileMore, setShowMobileMore] = useState(false);
  const [rankUpUnlocks, setRankUpUnlocks] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const [introFrame, setIntroFrame] = useState(0);
  const logoRef = useRef(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [stamina, setStamina] = useState(() => {
    const v = localStorage.getItem("mugen_stamina");
    const val = v !== null ? parseFloat(v) : 150;
    return isNaN(val) ? 150 : val;
  });
  const [credits, setCredits] = useState(() => {
    const v = localStorage.getItem("mugen_credits");
    const val = v !== null ? parseInt(v, 10) : 5e3;
    return isNaN(val) ? 5e3 : val;
  });
  const [gems, setGems] = useState(() => {
    const v = localStorage.getItem("mugen_gems");
    const val = v !== null ? parseInt(v, 10) : 250;
    return isNaN(val) ? 250 : val;
  });
  const [aura, setAura] = useState(() => {
    const v = localStorage.getItem("mugen_aura");
    const val = v !== null ? parseInt(v, 10) : 0;
    return isNaN(val) ? 0 : val;
  });
  const [essence, setEssence] = useState(() => {
    const v = localStorage.getItem("mugen_essence");
    const val = v !== null ? parseInt(v, 10) : 0;
    return isNaN(val) ? 0 : val;
  });
  const [materials, setMaterials] = useState(() => {
    // "Scrap" was renamed to "Materials" -- fall back to the old save key once
    // so existing players don't see their balance reset to 0.
    const v = localStorage.getItem("mugen_materials") ?? localStorage.getItem("mugen_scrap");
    const val = v !== null ? parseInt(v, 10) : 0;
    return isNaN(val) ? 0 : val;
  });
  const safeJSONParse = (key, fallback) => {
    try {
      const item = localStorage.getItem(key);
      if (!item) return fallback;
      return JSON.parse(item);
    } catch (e) {
      console.warn(`Error parsing localStorage key "${key}":`, e);
      return fallback;
    }
  };
  const [inventory, setInventory] = useState(() => safeJSONParse("mugen_inventory", {}));
  const [shards, setShards] = useState(() => safeJSONParse("mugen_shards", {}));
  const [vaultCredits, setVaultCredits] = useState(() => {
    const v = localStorage.getItem("mugen_vault_credits");
    const val = v !== null ? parseInt(v, 10) : 0;
    return isNaN(val) ? 0 : val;
  });
  const [isShaking, setIsShaking] = useState(false);
  const [activeDialogue, setActiveDialogue] = useState(null);
  const [visualEffects, setVisualEffects] = useState([]);
  const [isTypingDialogue, setIsTypingDialogue] = useState(false);
  const [missionTimers, setMissionTimers] = useState(() => safeJSONParse("mugen_mission_timers", {}));
  const [campaignProgress, setCampaignProgress] = useState(() => {
    const v = localStorage.getItem("mugen_campaign_progress");
    const val = v !== null ? parseInt(v, 10) : 1;
    return isNaN(val) ? 1 : val;
  });
  const [campaignRanks, setCampaignRanks] = useState(() => safeJSONParse("mugen_campaign_ranks", {}));
  const [claimedMilestones, setClaimedMilestones] = useState(() => safeJSONParse("mugen_milestones", []));
  const [activeMissions, setActiveMissions] = useState(() => safeJSONParse("mugen_active_missions", []));
  const [clearedTrials, setClearedTrials] = useState(() => safeJSONParse("mugen_cleared_trials", []));
  const [endlessFloor, setEndlessFloor] = useState(() => {
    const v = localStorage.getItem("mugen_endless_floor");
    return v ? parseInt(v, 10) : 1;
  });
  const [arenaRank, setArenaRank] = useState(() => {
    const v = localStorage.getItem("mugen_arena_rank");
    return v ? parseInt(v, 10) : 1;
  });
  const [unlockedIds, setUnlockedIds] = useState(() => safeJSONParse("mugen_unlocked_ids", []));
  const [unlockedFeatures, setUnlockedFeatures] = useState(() => safeJSONParse("mugen_unlocked_features", ["home", "roster", "train", "campaign", "inventory", "gacha", "shop"]));
  const [squadIds, setSquadIds] = useState(() => safeJSONParse("mugen_squad_ids", []));
  const [auraUpgrades, setAuraUpgrades] = useState(() => safeJSONParse("mugen_aura_upgrades", {
    atk: 0,
    hp: 0,
    def: 0,
    speed: 0,
    magic_atk: 0,
    magic_def: 0,
    credits: 0,
    xp: 0,
    stamina: 0,
    vault: 0,
    bond: 0,
    auraPassive: 0,
    geode_drill: 0,
    supernova: 0,
    singularity: 0,
    transmutation: 0
  }));
  const [unclaimedGems, setUnclaimedGems] = useState(() => {
    const v = localStorage.getItem("mugen_unclaimed_gems");
    return v ? parseFloat(v) : 0;
  });
  const [eventTokens, setEventTokens] = useState(() => {
    const v = localStorage.getItem("mugen_event_tokens");
    return v ? parseInt(v, 10) : 0;
  });
  useEffect(() => {
    localStorage.setItem("mugen_event_tokens", eventTokens.toString());
  }, [eventTokens]);
  const [eventPurchases, setEventPurchases] = useState(() => safeJSONParse("mugen_event_purchases", {}));
  const [appearanceTags, setAppearanceTags] = useState(() => safeJSONParse("mugen_appearances", {}));
  const [heroVibes, setHeroVibes] = useState(() => safeJSONParse("mugen_vibes", {}));
  const [preloadProgress, setPreloadProgress] = useState(0);
  const [challenger, setChallenger] = useState(null);
  const [combo, setCombo] = useState(0);
  const [hypeMeter, setHypeMeter] = useState(0);
  const [isHype, setIsHype] = useState(false);
  const [impactActive, setImpactActive] = useState(false);
  const [totalPWR, setTotalPWR] = useState(0);
  const comboTimer = useRef(null);
  const handleTrainRef = useRef(null);
  const recoveryInterval = useRef(null);
  const passiveInterval = useRef(null);
  const activeDialogueTimeout = useRef(null);
  const [settings, setSettings] = useState(() => safeJSONParse("mugen_settings", {
    audio: { master: 0.5, sfx: 0.5 },
    graphics: { particles: true, shake: true, scanlines: true, animations: true },
    gameplay: { dialogueSpeed: 1, autoSave: true }
  }));
  const [stats, setStats] = useState(() => safeJSONParse("mugen_stats", {
    totalHits: 0,
    totalXpGained: 0,
    messagesSent: 0,
    startTime: Date.now(),
    dailyStreak: 0,
    lastLoginDate: ""
  }));
  const [heroMoods, setHeroMoods] = useState(() => safeJSONParse("mugen_hero_moods", {}));
  // Date Memories: a per-character keepsake log from the reworked dating system.
  // Each great date leaves a permanent memory; every memory grants a small,
  // stacking passive bonus to future bond gains with that character.
  const [dateMemories, setDateMemories] = useState(() => safeJSONParse("mugen_date_memories", {}));
  const [favorites, setFavorites] = useState(() => safeJSONParse("mugen_favorites", []));
  const lastCloudSaveTime = useRef(0);
  const lastQuotaWarnTime = useRef(0);
  const [showDailyModal, setShowDailyModal] = useState(false);
  const [battleMusicActive, setBattleMusicActive] = useState(false);
  const [isVictoryMusic, setIsVictoryMusic] = useState(false);
  const [isHardBattle, setIsHardBattle] = useState(false);
  const ytPlayer = useRef(null);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [musicProvider, setMusicProvider] = useState("youtube");
  const [isYTReady, setIsYTReady] = useState(false);
  const featuredMenuHero = useMemo(() => {
    if (!unlockedIds.length || !characters.length) return null;
    const favoritesList = characters.filter((c) => favorites.includes(c.export_id));
    if (favoritesList.length > 0) return favoritesList[Math.floor(Math.random() * favoritesList.length)];
    const unlockedList = characters.filter((c) => unlockedIds.includes(c.export_id));
    return unlockedList[Math.floor(Math.random() * unlockedList.length)];
  }, [unlockedIds, characters, favorites, appState]);
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      setIsYTReady(true);
      return;
    }
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    window.onYouTubeIframeAPIReady = () => setIsYTReady(true);
  }, []);
  const masteryMetrics = useMemo(() => {
    const totalHeroLevels = characters.filter((c) => unlockedIds.includes(c.export_id)).reduce((sum, c) => sum + (c.level || 1), 0);
    const totalBondLevels = characters.filter((c) => unlockedIds.includes(c.export_id)).reduce((sum, c) => sum + (c.bondLevel || 1), 0);
    const uniqueHeroes = unlockedIds.length;
    const stagesCleared = Math.max(0, campaignProgress - 1);
    const score = totalHeroLevels * 1 + totalBondLevels * 5 + uniqueHeroes * 25 + stagesCleared * 100;
    const level = Math.max(1, Math.floor(Math.sqrt(score / 5)));
    return { level, score, totalHeroLevels, totalBondLevels, uniqueHeroes, stagesCleared };
  }, [characters, unlockedIds, campaignProgress]);
  const totalAccountLevel = masteryMetrics.level;
  const facilityRank = Math.floor(totalAccountLevel / 15) + 1;
  const maxStamina = 250 + Math.floor(totalAccountLevel * 4) + (auraUpgrades.stamina || 0) * 25 + (facilityRank >= 5 ? 50 : 0);
  const recoveryRate = (0.4 + totalAccountLevel * 0.02) * (1 + (auraUpgrades.stamina || 0) * 0.1);
  const maxVaultCapacity = 5e4 + totalAccountLevel * 2500 + (auraUpgrades.vault || 0) * 5e4;
  const createFloatingText = (text, isError = false, customColor = null) => {
    const id = Math.random();
    setFloatingTexts((prev) => [...prev, {
      id,
      text,
      x: 35 + Math.random() * 30,
      y: 40 + Math.random() * 20,
      driftX: (Math.random() - 0.5) * 60,
      color: customColor || (isError ? "#ff4444" : "#e94560")
    }]);
    setTimeout(() => setFloatingTexts((prev) => prev.filter((t) => t.id !== id)), 800);
  };
  const triggerVisualEffect = (src, x, y, scale = 1) => {
    const id = Math.random();
    setVisualEffects((prev) => [...prev, {
      id,
      src,
      x,
      y,
      scale,
      rotation: Math.random() * 360
    }]);
    setTimeout(() => setVisualEffects((prev) => prev.filter((e) => e.id !== id)), 500);
  };
  const spawnParticles = (x, y, color) => {
    const newParticles = Array.from({ length: 8 }).map(() => ({
      id: Math.random(),
      x,
      y,
      color,
      tx: (Math.random() - 0.5) * 150,
      ty: (Math.random() - 0.5) * 150
    }));
    setParticles((prev) => [...prev, ...newParticles]);
    setTimeout(() => setParticles((prev) => prev.filter((p) => !newParticles.find((np) => np.id === p.id))), 600);
  };
  const addToInventory = (itemId, qty = 1) => {
    setInventory((prev) => ({ ...prev, [itemId]: (prev[itemId] || 0) + qty }));
    playSound("asset_name", settings.audio.master * settings.audio.sfx);
  };
  const removeFromInventory = (itemId, qty = 1) => {
    setInventory((prev) => {
      const current = prev[itemId] || 0;
      if (current <= qty) {
        const next = { ...prev };
        delete next[itemId];
        return next;
      }
      return { ...prev, [itemId]: current - qty };
    });
  };
  const [dialogueHistory, setDialogueHistory] = useState(() => safeJSONParse("mugen_dialogue_history", {}));
  const triggerDialogue = async (char, action, isHeroInitiated = false) => {
    if (!char || isTypingDialogue || !settings.graphics.animations) return null;
    setIsTypingDialogue(true);
    setStats((prev) => ({ ...prev, messagesSent: prev.messagesSent + 1 }));
    const charCtx = {
      name: char.name,
      role: char.role || "Warrior",
      franchise: char.franchise || "Multiverse",
      relationship: char.relationship || "Neutral",
      bondLevel: char.bondLevel || 1,
      mood: heroMoods[char.export_id] || 50
    };
    const history = dialogueHistory[char.export_id] || [];
    try {
      const prompt = isHeroInitiated ? `SITUATION: ${action}` : `USER ACTION: ${action}`;
      const response = await generateAI(prompt, charCtx, history);
      if (activeDialogueTimeout.current) clearTimeout(activeDialogueTimeout.current);
      const dialogueObj = {
        name: char.name,
        text: response.text,
        expression: response.expression,
        action: response.action,
        id: Math.random()
      };
      setActiveDialogue(dialogueObj);
      setDialogueHistory((prev) => {
        const next = { ...prev };
        const charHist = [...next[char.export_id] || [], response.text].slice(-5);
        next[char.export_id] = charHist;
        localStorage.setItem("mugen_dialogue_history", JSON.stringify(next));
        return next;
      });
      const displayTime = Math.max(3500, response.text.length * 75);
      activeDialogueTimeout.current = setTimeout(() => {
        setActiveDialogue(null);
        activeDialogueTimeout.current = null;
      }, displayTime);
      return response;
    } catch (e) {
      console.warn("Dialogue system error:", e);
      return null;
    } finally {
      setIsTypingDialogue(false);
    }
  };
  const triggerChallenger = (type) => {
    if (challenger) return;
    const lockedOnes = characters.filter((c) => !unlockedIds.includes(c.export_id));
    if (lockedOnes.length === 0) return;
    const lucky = lockedOnes[Math.floor(Math.random() * lockedOnes.length)];
    setChallenger({ hero: lucky, type, wins: 0 });
  };
  const handleTrain = (isAuto = false, event = null) => {
    const charData = characters[selectedCharIndex];
    if (!charData) {
      if (!isAuto) setView("roster");
      return;
    }
    if (!isAuto && Math.random() < 0.1) {
      setImpactActive(true);
      setTimeout(() => setImpactActive(false), 100);
    }
    if (!isAuto) {
      setCombo((prev) => prev + 1);
      setHypeMeter((prev) => Math.min(100, prev + (isHype ? 0 : 2)));
      clearTimeout(comboTimer.current);
      comboTimer.current = setTimeout(() => setCombo(0), 2e3);
      if (hypeMeter >= 100 && !isHype) {
        setIsHype(true);
        playSound("hype_start");
        setTimeout(() => {
          setIsHype(false);
          setHypeMeter(0);
        }, 1e4);
      }
    }
    if (!isAuto && Math.random() < 5e-3) triggerChallenger("hit");
    let costReduction = 0;
    if (charData.relationship.includes("Friend")) {
      if (charData.bondLevel >= 15) costReduction += 0.2;
    }
    if (charData.relationship.includes("Friend")) {
      costReduction += charData.bondLevel / 100 * 0.1;
    }
    if (isAuto && facilityRank >= 7) costReduction += 0.2;
    const baseCost = isAuto ? 2 : maxStamina * 0.1;
    const staminaCost = baseCost * Math.max(0.1, 1 - costReduction);
    if (stamina < staminaCost) {
      if (!isAuto) {
        createFloatingText("EXHAUSTED", true);
        playSound("error");
      }
      return;
    }
    setStamina((s) => Math.max(0, s - staminaCost));
    const staminaPercent = stamina / maxStamina * 100;
    const staminaMultiplier = staminaPercent > 90 ? 3.5 : staminaPercent > 70 ? 2 : staminaPercent < 15 ? 0.2 : 1;
    if (!isAuto) {
      if (settings.graphics.shake) setIsShaking(true), setTimeout(() => setIsShaking(false), 150);
      if (settings.graphics.particles) spawnParticles(50, 50, staminaPercent > 80 ? "#4ade80" : "#e94560");
    }
    setCharacters((prev) => {
      const newChars = [...prev];
      const c = { ...newChars[selectedCharIndex] };
      const prevBondLevel = c.bondLevel;
      let xpMult = staminaMultiplier;
      if (c.relationship.includes("Romantic")) {
        xpMult *= 1.1 + c.bondLevel / 100 * 0.2;
        if (c.bondLevel >= 15) xpMult += 0.2;
      } else if (c.relationship.includes("Friend")) xpMult *= 1.1 + c.bondLevel / 100 * 0.3;
      else if (c.relationship.includes("Enemy")) xpMult *= 0.9 + c.bondLevel / 100 * 0.2;
      const isActuallyCrit = !isAuto && Math.random() < (c.relationship.includes("Romantic") ? 0.35 : 0.15);
      const frenzyBonus = isHype ? 5 : 1;
      let xpGain = (400 + Math.floor(c.level * 22)) * xpMult * frenzyBonus;
      let creditGain = (isAuto ? 25 : 60) * xpMult * frenzyBonus;
      const auraXpMult = 1 + (auraUpgrades.xp || 0) * 0.15;
      xpGain = Math.floor(xpGain * auraXpMult);
      if (facilityRank >= 2) creditGain *= 1.1;
      if (facilityRank >= 4 && Math.random() < 0.1) xpGain *= 2;
      if (isActuallyCrit) xpGain *= 3, creditGain *= 2;
      if (!isAuto && Math.random() < 0.02) {
        setGems((g) => g + 1);
        createFloatingText("+1 LUCKY GEM!", false, "#00d2ff");
        playSound("success", 0.3);
      }
      const mood = heroMoods[c.export_id] || 50;
      const isRadiant = mood >= 80;
      const moodMult = isRadiant ? 1.3 : 0.8 + mood / 100 * 0.4;
      xpGain *= moodMult;
      c.xp += Math.floor(xpGain);
      setCredits((cr) => cr + creditGain);
      if (Math.random() < 0.1) setAura((a) => a + 1);
      setHeroMoods((prev2) => ({
        ...prev2,
        [c.export_id]: Math.max(0, (prev2[c.export_id] || 50) - (isAuto ? 0.05 : 0.5))
      }));
      setStats((s) => ({ ...s, totalHits: s.totalHits + 1, totalXpGained: s.totalXpGained + Math.floor(xpGain) }));
      if (!isAuto) {
        if (isActuallyCrit) {
          playSound("crit_hit", settings.audio.master * settings.audio.sfx);
          createFloatingText("CRITICAL!!", false, "#ffcc00");
          triggerVisualEffect("fx_impact.png", "50%", "30%", 1.8);
          triggerVisualEffect("fx_star_pop.png", "50%", "30%", 1.2);
        } else {
          playSound("train_hit", settings.audio.master * settings.audio.sfx);
          if (c.element === "FIRE") triggerVisualEffect("fx_impact.png", "50%", "30%", 1);
          else if (c.element === "WIND") triggerVisualEffect("fx_slash.png", "50%", "30%", 1.2);
          else if (c.element === "LIGHT") triggerVisualEffect("fx_powerup.png", "50%", "30%", 0.8);
          else triggerVisualEffect("fx_impact.png", "50%", "30%", 0.8);
        }
        createFloatingText(`+${Math.floor(xpGain)} XP`, isActuallyCrit ? false : false, isActuallyCrit ? "#ffcc00" : null);
      }
      const baseBondGain = isAuto ? 2 : 5;
      c.bondXp += Math.floor(baseBondGain * getBondMultiplier(c));
      while (c.bondXp >= c.nextBondXp && c.bondLevel < 100) {
        c.bondXp -= c.nextBondXp;
        c.bondLevel += 1;
        c.nextBondXp = 80 + c.bondLevel * 25;
        if (!isAuto) playSound("unlock"), createFloatingText(`BOND UP: ${c.bondLevel}`, false, "#f472b6");
      }
      if (c.bondLevel > prevBondLevel) {
        try {
          const action = `Our bond just increased to Rank ${c.bondLevel}.`;
          triggerDialogue(c, action, true);
        } catch (e) {
          console.warn("Bond rank dialogue failed", e);
        }
      }
      while (c.xp >= c.nextXp) {
        c.xp -= c.nextXp;
        c.level += 1;
        if (c.level % 10 === 0) {
          triggerDialogue(c, `I just reached Level ${c.level}. I feel significantly stronger now!`, true);
        }
        c.nextXp = Math.floor(100 * Math.pow(1.15, c.level - 1));
        if (c.level % 5 === 0) c.skillPoints = (c.skillPoints || 0) + 1;
        c.abilities.forEach((a) => {
          if (a.unlockLevel === c.level && !c.unlockedAbilities.includes(a.name)) {
            c.unlockedAbilities.push(a.name);
            playSound("unlock");
            createFloatingText("NEW ABILITY!", false, "#4ade80");
          }
        });
        playSound("levelUp"), playSound("mugen_level", 0.5), createFloatingText("LEVEL UP!", false, "#f472b6");
        setCredits((cr) => cr + c.level * 100);
        if (c.level % 10 === 0) setGems((g) => g + 5);
      }
      newChars[selectedCharIndex] = c;
      return newChars;
    });
  };
  const [lastSavedAt, setLastSavedAt] = useState(() => {
    const v = localStorage.getItem("mugen_save_meta");
    try { return v ? JSON.parse(v).savedAt || 0 : 0; } catch (e) { return 0; }
  });
  const SAVE_VERSION = 3;
  // Distinguishes a genuine QuotaExceededError (device/browser storage full)
  // from any other failure. Different browsers surface this differently, so
  // check every known shape rather than just err.name.
  const isQuotaError = (err) => !!err && (
    err.name === "QuotaExceededError" ||
    err.code === 22 ||
    err.code === 1014 ||
    err.name === "NS_ERROR_DOM_QUOTA_REACHED"
  );
  // Rotating local backup ring: every manual save also snapshots the full save
  // into one of 3 backup slots so a bad import / accidental wipe is recoverable
  // from Settings → Data without needing an exported file.
  const writeBackupSnapshot = (saveData) => {
    try {
      const metaRaw = localStorage.getItem("mugen_backup_meta");
      const meta = metaRaw ? JSON.parse(metaRaw) : { next: 1 };
      const slot = meta.next || 1;
      localStorage.setItem(`mugen_backup_${slot}`, JSON.stringify({ savedAt: Date.now(), version: SAVE_VERSION, data: saveData }));
      localStorage.setItem("mugen_backup_meta", JSON.stringify({ next: slot >= 3 ? 1 : slot + 1 }));
    } catch (e) {
      if (!isQuotaError(e)) console.warn("Backup snapshot failed", e);
      // Quota failures here are non-fatal (backups are supplementary, not the
      // live save) -- swallow quietly rather than warn on every autosave tick.
    }
  };
  const saveGame = async (quick = false) => {
    // Never persist while the roster hasn't loaded — a flush during boot would
    // write an empty character array and wipe all progression on next launch.
    if (loading || !characters.length) return;
    try {
      const saveData = {
        mugen_trainer_save_v2: characters,
        mugen_last_char_index: selectedCharIndex.toString(),
        mugen_credits: credits.toString(),
        mugen_gems: gems.toString(),
        mugen_aura: aura.toString(),
        mugen_essence: essence.toString(),
        mugen_materials: materials.toString(),
        mugen_vault_credits: vaultCredits.toString(),
        mugen_last_active: Date.now().toString(),
        mugen_stamina: Math.floor(stamina).toString(),
        mugen_inventory: inventory,
        mugen_shards: shards,
        mugen_campaign_progress: campaignProgress.toString(),
        mugen_campaign_ranks: campaignRanks,
        mugen_milestones: claimedMilestones,
        mugen_active_missions: activeMissions,
        mugen_cleared_trials: clearedTrials,
        mugen_endless_floor: endlessFloor.toString(),
        mugen_arena_rank: arenaRank.toString(),
        mugen_unlocked_ids: unlockedIds,
        mugen_unlocked_features: unlockedFeatures,
        mugen_squad_ids: squadIds,
        mugen_aura_upgrades: auraUpgrades,
        mugen_favorites: favorites,
        mugen_settings: settings,
        mugen_stats: stats,
        mugen_hero_moods: heroMoods,
        mugen_unclaimed_gems: unclaimedGems.toString(),
        mugen_event_purchases: eventPurchases,
        mugen_date_memories: dateMemories
      };
      // Write every key individually rather than letting one failure abort the
      // whole batch silently -- if the device is low on storage, a mid-loop
      // QuotaExceededError used to just bubble up to the outer catch and get
      // swallowed by console.error, leaving the player with no signal at all
      // that their progress had silently stopped saving.
      let hitQuota = false;
      Object.keys(saveData).forEach((key) => {
        try {
          localStorage.setItem(key, typeof saveData[key] === "string" ? saveData[key] : JSON.stringify(saveData[key]));
        } catch (err) {
          if (isQuotaError(err)) hitQuota = true;
          else throw err;
        }
      });
      if (hitQuota) {
        // Don't compound the problem with a backup snapshot attempt (certain
        // to also fail) or a save_meta timestamp implying success. Surface
        // this to the player, throttled so it isn't spammy -- saveGame(true)
        // can run every few seconds via the autosave effect.
        const now = Date.now();
        if (now - lastQuotaWarnTime.current > 120e3) {
          lastQuotaWarnTime.current = now;
          createFloatingText("⚠ Storage full — progress may not be saving! Clear old backups in Settings → Data.", true);
        }
        return;
      }
      localStorage.setItem("mugen_save_meta", JSON.stringify({ version: SAVE_VERSION, savedAt: Date.now() }));
      setLastSavedAt(Date.now());
      if (!quick) writeBackupSnapshot(saveData);
      const now = Date.now();
      if (!quick || now - lastCloudSaveTime.current > 45e3) {
        if (typeof websim !== "undefined" && websim.datastore) {
          lastCloudSaveTime.current = now;
          await websim.datastore.set("mugen_trainer_cloud_save", saveData);
        }
      }
      if (!quick) createFloatingText("Cloud Sync Complete", false, "#00d2ff");
    } catch (e) {
      console.error(e);
    }
  };
  useEffect(() => {
    const fetchChars = async () => {
      try {
        const [resChars, resSkills, resItems, resSig, resCustomChars, cloudSaveRaw] = await Promise.all([
          fetch(`${CHARACTER_DATA_URL}?t=${Date.now()}`, { cache: "no-store" }),
          fetch(`skills.json?t=${Date.now()}`, { cache: "no-store" }),
          fetch(`items.json?t=${Date.now()}`, { cache: "no-store" }),
          fetch(`signature_skills.json?t=${Date.now()}`, { cache: "no-store" }).catch(() => null),
          // Local roster additions live in custom_characters.json -- add a character there
          // (same shape as the remote export) and it shows up with no other code changes.
          fetch(`custom_characters.json?t=${Date.now()}`, { cache: "no-store" }).catch(() => null),
          typeof websim !== "undefined" && websim.datastore ? websim.datastore.get("mugen_trainer_cloud_save") : Promise.resolve(null)
        ]);
        // Cloud saves used to win unconditionally, which meant an older cloud
        // snapshot silently rolled back newer local progress on every boot.
        // Only apply the cloud copy when it is actually newer than local.
        let cloudSave = cloudSaveRaw;
        const localLastActive = parseInt(localStorage.getItem("mugen_last_active") || "0", 10) || 0;
        const cloudLastActive = cloudSave ? parseInt(cloudSave.mugen_last_active || "0", 10) || 0 : 0;
        if (cloudSave && cloudLastActive <= localLastActive) {
          console.info("[save] Local save is newer than cloud — keeping local.");
          cloudSave = null;
        }
        if (cloudSave) {
          if (cloudSave.mugen_credits) setCredits(parseInt(cloudSave.mugen_credits, 10));
          if (cloudSave.mugen_gems) setGems(parseInt(cloudSave.mugen_gems, 10));
          if (cloudSave.mugen_aura) setAura(parseInt(cloudSave.mugen_aura, 10));
          if (cloudSave.mugen_essence) setEssence(parseInt(cloudSave.mugen_essence, 10));
          if (cloudSave.mugen_materials || cloudSave.mugen_scrap) setMaterials(parseInt(cloudSave.mugen_materials || cloudSave.mugen_scrap, 10));
          if (cloudSave.mugen_stamina) setStamina(parseFloat(cloudSave.mugen_stamina));
          if (cloudSave.mugen_inventory) setInventory(cloudSave.mugen_inventory);
          if (cloudSave.mugen_shards) setShards(cloudSave.mugen_shards);
          if (cloudSave.mugen_unlocked_ids) setUnlockedIds(cloudSave.mugen_unlocked_ids);
          if (cloudSave.mugen_unlocked_features) setUnlockedFeatures(cloudSave.mugen_unlocked_features);
          if (cloudSave.mugen_squad_ids) setSquadIds(cloudSave.mugen_squad_ids);
          if (cloudSave.mugen_aura_upgrades) setAuraUpgrades(cloudSave.mugen_aura_upgrades);
          if (cloudSave.mugen_favorites) setFavorites(cloudSave.mugen_favorites);
          if (cloudSave.mugen_settings) setSettings(cloudSave.mugen_settings);
          if (cloudSave.mugen_stats) setStats(cloudSave.mugen_stats);
          if (cloudSave.mugen_hero_moods) setHeroMoods(cloudSave.mugen_hero_moods);
          if (cloudSave.mugen_date_memories) setDateMemories(cloudSave.mugen_date_memories);
          if (cloudSave.mugen_campaign_progress) setCampaignProgress(parseInt(cloudSave.mugen_campaign_progress, 10));
          if (cloudSave.mugen_campaign_ranks) setCampaignRanks(cloudSave.mugen_campaign_ranks);
          if (cloudSave.mugen_milestones) setClaimedMilestones(cloudSave.mugen_milestones);
          if (cloudSave.mugen_active_missions) setActiveMissions(cloudSave.mugen_active_missions);
          if (cloudSave.mugen_cleared_trials) setClearedTrials(cloudSave.mugen_cleared_trials);
          if (cloudSave.mugen_endless_floor) setEndlessFloor(parseInt(cloudSave.mugen_endless_floor, 10));
          if (cloudSave.mugen_arena_rank) setArenaRank(parseInt(cloudSave.mugen_arena_rank, 10));
          if (cloudSave.mugen_vault_credits) setVaultCredits(parseInt(cloudSave.mugen_vault_credits, 10));
          if (cloudSave.mugen_unclaimed_gems) setUnclaimedGems(parseFloat(cloudSave.mugen_unclaimed_gems));
          if (cloudSave.mugen_event_purchases) setEventPurchases(cloudSave.mugen_event_purchases);
          Object.keys(cloudSave).forEach((key) => {
            localStorage.setItem(key, typeof cloudSave[key] === "string" ? cloudSave[key] : JSON.stringify(cloudSave[key]));
          });
        }
        const data = await resChars.json();
        const skillsData = await resSkills.json();
        const itemsData = await resItems.json();
        // Signature skills are character-bound progression rewards. They are merged into the
        // live skills list (so combat can resolve them) but deliberately NOT part of `skillsData`,
        // which seeds random skill assignment / rerolls — keeping signatures unrollable.
        let signatureData = [];
        try { if (resSig && resSig.ok) signatureData = await resSig.json(); } catch (e) { signatureData = []; }
        let customCharData = [];
        try { if (resCustomChars && resCustomChars.ok) customCharData = await resCustomChars.json(); } catch (e) { customCharData = []; }
        setSkills([...skillsData, ...signatureData]);
        setItems(itemsData);
        // Re-host fix: character art lives on the websim blob CDN (slow/unreliable).
        // If a local copy was downloaded (see download_portraits.py -> portraits/),
        // redirect to it. Blobs we couldn't fetch keep their original URL so the
        // image loader shim in index.html can still try the CDN / fall back.
        let __portraitManifest = new Set();
        try {
          const __mf = await fetch(`portraits/manifest.json?t=${Date.now()}`, { cache: "no-store" });
          if (__mf.ok) __portraitManifest = new Set(await __mf.json());
        } catch (e) {}
        const remapPortrait = (u) => {
          if (typeof u === "string" && u.indexOf("api.websim.com/blobs/") !== -1) {
            const base = u.substring(u.lastIndexOf("/") + 1).split("?")[0];
            if (__portraitManifest.has(base)) return "portraits/" + base;
          }
          return u;
        };
        const raw = [...data.collections?.character_v1 || [], ...customCharData];
        const formatted = raw.map((c, i) => {
          const export_id = c.export_id || i + 1;
          const fatigue = 0;
          const elements = ["FIRE", "WATER", "WIND", "LIGHT", "DARK", "NEUTRAL", "EARTH"];
          let assignedElement = elements[export_id % elements.length];
          let tierKey = (c.tier || c.suggestedTier || c.rarity || "C").toString().trim().toUpperCase();
          const idNumCheck = Number(export_id);
          if (!isNaN(idNumCheck) && idNumCheck >= 1 && idNumCheck <= 200 && tierKey.startsWith("C")) {
            tierKey = "A";
          }
          const tierInfo = TIER_STATS[tierKey] || { multiplier: 1 };
          const tierMult = Math.max(0.9, Math.min(2.5, tierInfo.multiplier || 1));
          const rarityWeights = Object.fromEntries(Object.entries(SKILL_RARITY_CONFIG).map(([k, v]) => [k, v.weight || 1]));
          const weightBoostFactor = {
            "SS": 1.6,
            "S+": 1.45,
            "S": 1.3,
            "S-": 1.2,
            "A+": 1.12,
            "A": 1.08,
            "A-": 1.05,
            "B+": 1.02,
            "B": 1.01,
            "C+": 1,
            "C": 1
          }[tierKey] || 1;
          const weightedPool = [];
          skillsData.forEach((s) => {
            const baseW = rarityWeights[s.rarity] || 1;
            const boosted = Math.floor(baseW * (s.rarity === "Legendary" || s.rarity === "Epic" ? weightBoostFactor : 1));
            for (let w = 0; w < Math.max(1, boosted); w++) weightedPool.push(s.id);
          });
          const assignedSkillId = weightedPool.length ? weightedPool[export_id % weightedPool.length] : skillsData[export_id % skillsData.length]?.id || "slash";
          const elementOffset = Math.floor((tierMult - 1) * 2) % elements.length;
          assignedElement = elements[(export_id + elementOffset) % elements.length];
          // Leader skill is a deterministic 1:1 mapping by element -- legible and consistent,
          // no random pool/reroll needed (see LEADER_SKILLS in constants.js).
          const finalElement = c.element || assignedElement;
          const assignedLeaderSkillId = (LEADER_SKILLS.find((ls) => ls.element === finalElement) || LEADER_SKILLS.find((ls) => ls.element === "NEUTRAL")).id;
          const baseHp = Math.floor((c.stats?.hp || 500) * (1 + (tierMult - 1) * 0.25));
          const baseAtk = Math.floor((c.stats?.atk || 50) * (1 + (tierMult - 1) * 0.25));
          const baseDef = Math.floor((c.stats?.def || 50) * (1 + (tierMult - 1) * 0.18));
          const baseSpeed = Math.floor((c.stats?.speed || 40) * (1 + (tierMult - 1) * 0.12));
          const baseMagicAtk = Math.floor((c.stats?.["magic atk"] || 0) * (1 + (tierMult - 1) * 0.2));
          const baseMagicDef = Math.floor((c.stats?.["magic def"] || 0) * (1 + (tierMult - 1) * 0.18));
          const baseLuck = Math.max(5, Math.floor((c.stats?.luck || 10) * (1 + (tierMult - 1) * 0.08)));
          return {
            ...c,
            element: c.element || assignedElement,
            skillId: assignedSkillId,
            // Primary skill slot
            skillId2: null,
            // Secondary skill slot (Unlocks at level 50)
            leaderSkillId: assignedLeaderSkillId,
            // prefer explicit "tier" from JSON, fall back to suggestedTier/rarity or default 'C'
            tier: tierKey,
            baseStats: { hp: baseHp, atk: baseAtk, def: baseDef, speed: baseSpeed, luck: baseLuck, "magic atk": baseMagicAtk, "magic def": baseMagicDef },
            export_id,
            level: 1,
            xp: 0,
            nextXp: 100,
            bondLevel: 1,
            bondXp: 0,
            nextBondXp: 50,
            relationship: "Neutral",
            skillPoints: 0,
            abilityLevels: { [assignedSkillId]: 1 },
            // Initialize skill level
            abilityAwaken: {},
            // Ability Awakening ranks (0-5) per skill id
            unlockedAbilities: [assignedSkillId],
            abilities: [],
            refinements: { hp: 0, atk: 0, def: 0, speed: 0 },
            growthType: ["Aggressive", "Defensive", "Balanced", "Swift"][i % 4],
            pulls: 0,
            // track how many times this character has been pulled
            fatigue: 0,
            unlockedCosmetics: { auras: ["none"], borders: ["default"], titles: ["none"] },
            activeCosmetics: { aura: "none", border: "default", title: "none" }
          };
        });
        const finalCharacters = formatted.filter(
          (char, index, self) => index === self.findIndex((t) => String(t.export_id) === String(char.export_id))
        );
        try {
          const getImageAvgHex = async (url) => {
            try {
              // Bound each remote image fetch so a slow/unreachable host can never
              // strand the player on the loading screen forever.
              const ctrl = new AbortController();
              const tid = setTimeout(() => ctrl.abort(), 1200);
              const res = await fetch(url, { mode: "cors", signal: ctrl.signal }).finally(() => clearTimeout(tid));
              const blob = await res.blob();
              const img = await new Promise((resolve, reject) => {
                const i = new Image();
                i.crossOrigin = "Anonymous";
                i.onload = () => resolve(i);
                i.onerror = reject;
                setTimeout(() => reject(new Error("img timeout")), 1500);
                i.src = URL.createObjectURL(blob);
              });
              const canvas = document.createElement("canvas");
              const ctx = canvas.getContext("2d");
              const w = Math.min(64, img.width || 64);
              const h = Math.min(64, img.height || 64);
              canvas.width = w;
              canvas.height = h;
              ctx.drawImage(img, 0, 0, w, h);
              const data2 = ctx.getImageData(0, 0, w, h).data;
              let r = 0, g = 0, b = 0, count = 0;
              for (let i = 0; i < data2.length; i += 4) {
                const alpha = data2[i + 3];
                if (alpha === 0) continue;
                r += data2[i];
                g += data2[i + 1];
                b += data2[i + 2];
                count++;
              }
              if (count === 0) return null;
              r = Math.round(r / count);
              g = Math.round(g / count);
              b = Math.round(b / count);
              const hex = "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
              return hex.toUpperCase();
            } catch (err) {
              return null;
            }
          };
          const sample = finalCharacters.slice(0, 30);
          // Sample colors in parallel (was sequential — 30 blocking round-trips on startup).
          const samplesWithColor = await Promise.all(sample.map(async (c) => {
            const hex = await getImageAvgHex(c.imageUrl).catch(() => null);
            return { name: c.name, export_id: c.export_id, color: hex || "UNKNOWN" };
          }));
          const promptLines = samplesWithColor.map((s) => `"${s.name}": "${s.color}"`).join(", ");
          const userPrompt = `You are given character names with their image-dominant color hex where available. For each entry map the character to one of these elements: FIRE, WATER, WIND, LIGHT, DARK, NEUTRAL, EARTH based primarily on the color clue, but use name cues if color is UNKNOWN. Respond with ONLY a single JSON object mapping names to elements. Example: { "Name A": "FIRE", "Name B": "EARTH" }.

Data: { ${promptLines} }`;
          const aiContent = await generateAI(userPrompt, "Map names to elements from color hex cues. Output only a JSON object.", true);
          let refinedMap = {};
          try {
            let cleanJson = (aiContent || "").trim();
            if (cleanJson.startsWith("```")) {
              cleanJson = cleanJson.replace(/```(?:json)?\n?([\s\S]*?)\n?```/g, "$1").trim();
            }
            const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              refinedMap = JSON.parse(jsonMatch[0]);
            } else {
              refinedMap = JSON.parse(cleanJson);
            }
          } catch (parseErr) {
            console.warn("AI element JSON parse failed, skipping element refinement", parseErr);
            refinedMap = {};
          }
          const VALID = /* @__PURE__ */ new Set(["FIRE", "WATER", "WIND", "LIGHT", "DARK", "NEUTRAL", "EARTH"]);
          finalCharacters.forEach((c) => {
            const v = refinedMap && refinedMap[c.name];
            if (v && typeof v === "string") {
              const up = v.trim().toUpperCase();
              if (VALID.has(up)) c.element = up;
            }
          });
        } catch (e) {
          console.warn("AI Element refinement failed", e);
        }
        let currentIds = JSON.parse(localStorage.getItem("mugen_unlocked_ids") || "[]");
        if (currentIds.length === 0 && finalCharacters.length > 0) {
          const inRange = finalCharacters.filter((c) => {
            const idNum = Number(c.export_id);
            return !isNaN(idNum) && idNum >= 1 && idNum <= 200;
          });
          const pickCount = 4;
          let picks = [];
          if (inRange.length <= pickCount) {
            picks = inRange.map((c) => c.export_id);
            for (let i = 0; picks.length < pickCount && i < finalCharacters.length; i++) {
              if (!picks.includes(finalCharacters[i].export_id)) picks.push(finalCharacters[i].export_id);
            }
          } else {
            const shuffled = inRange.slice();
            for (let i = shuffled.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            picks = shuffled.slice(0, pickCount).map((c) => c.export_id);
          }
          currentIds = picks;
          setUnlockedIds(currentIds);
        }
        const saved = localStorage.getItem("mugen_trainer_save_v2");
        if (saved) {
          const parsed = JSON.parse(saved);
          finalCharacters.forEach((c) => {
            const match = parsed.find((s) => String(s.export_id) === String(c.export_id));
            if (match) {
              const bondLvl = match.bondLevel || 1;
              if (!match.baseStats) match.baseStats = {};
              if (match.baseStats.luck === void 0) match.baseStats.luck = 10;
              const cleanTier = String(match.tier || match.suggestedTier || c.tier).trim().toUpperCase();
              Object.assign(c, {
                ...match,
                franchise: match.franchise || c.franchise || "Multiverse",
                tier: cleanTier,
                suggestedTier: cleanTier,
                baseStats: { ...match.baseStats, luck: match.baseStats.luck || 10 },
                nextXp: Math.floor(100 * Math.pow(1.15, match.level - 1)),
                nextBondXp: 80 + bondLvl * 25
              });
            }
          });
        }
        finalCharacters.forEach((c) => {
          try {
            if (!c.bondPath || typeof c.bondPath !== "string" || c.bondPath.trim() === "") {
              c.bondPath = getBondPath(c.bondLevel || 1, c.relationship || "Neutral");
            }
          } catch (err) {
            c.bondPath = c.bondPath || "";
          }
          // Leader skills were reworked -- old saves may carry a leaderSkillId from the
          // retired roster. Re-derive it from the character's element so nobody is left
          // pointing at a skill that no longer exists.
          if (!LEADER_SKILLS.some((ls) => ls.id === c.leaderSkillId)) {
            c.leaderSkillId = (LEADER_SKILLS.find((ls) => ls.element === c.element) || LEADER_SKILLS.find((ls) => ls.element === "NEUTRAL")).id;
          }
        });
        finalCharacters.forEach((c) => { c.imageUrl = remapPortrait(c.imageUrl); });
        setCharacters(finalCharacters);
        setLoading(false);
      } catch (e) {
        console.error(e);
        setLoading(false);
      }
    };
    fetchChars();
  }, []);
  useEffect(() => {
    handleTrainRef.current = handleTrain;
  }, [handleTrain]);
  useEffect(() => {
    if (!hasStarted || appState !== "launcher") return;
    preloadCommonSounds();
    const timer = setInterval(() => {
      if (appState === "launcher") {
        setIntroFrame((f) => {
          if (f >= 4) return 4;
          return f + 1;
        });
      }
    }, 700);
    return () => clearInterval(timer);
  }, [hasStarted, appState]);
  useEffect(() => {
    if (!hasStarted || appState !== "launcher") return;
    if (introFrame === 0) {
      playSound("mugen_round", 0.6);
    } else if (introFrame < 4) {
      playSound("mugen_hit", 0.35);
      setImpactActive(true);
      setTimeout(() => setImpactActive(false), 50);
    } else if (introFrame === 4) {
      playSound("mugen_ko", 0.8);
      if (settings.graphics.shake) setIsShaking(true), setTimeout(() => setIsShaking(false), 600);
    }
  }, [introFrame, hasStarted, appState]);
  useEffect(() => {
    if (!hasStarted || appState !== "launcher" || introFrame < 4 || !logoRef.current) return;
    gsap.fromTo(
      logoRef.current,
      { scale: 0.2, opacity: 0, rotate: -8 },
      { scale: 1, opacity: 1, rotate: 0, duration: 0.9, ease: "elastic.out(1, 0.5)" }
    );
  }, [introFrame, hasStarted, appState]);
  useEffect(() => {
    try {
      window.setcharacters = setCharacters;
      return () => {
        delete window.setcharacters;
      };
    } catch (e) {
    }
  }, [setCharacters]);
  useEffect(() => {
    try {
      window.claimVictory = window.claimVictory || function() {
        console.warn("[stub] claimVictory() called but no global handler exists.");
      };
      window.setIsHardBattle = window.setIsHardBattle || function(v) {
        console.warn("[stub] setIsHardBattle(", v, ")");
      };
      return () => {
      };
    } catch (e) {
    }
  }, []);
  useEffect(() => {
    if (autoTrainLevel > 0 && appState === "playing") {
      const id = setInterval(() => handleTrainRef.current(true), 1e3 / autoTrainLevel);
      return () => clearInterval(id);
    }
  }, [autoTrainLevel, appState]);
  useEffect(() => {
    if (appState !== "playing") return;
    const bestFriendLevel = characters.reduce(
      (max, c) => c.relationship && c.relationship.includes("Friend") && unlockedIds.includes(c.export_id) ? Math.max(max, c.bondLevel) : max,
      0
    );
    const friendRegenBonus = bestFriendLevel >= 10 ? 0.15 : 0;
    const effectiveRate = recoveryRate * (1 + friendRegenBonus);
    recoveryInterval.current = setInterval(() => setStamina((s) => Math.min(s + effectiveRate / 20, maxStamina)), 500);
    passiveInterval.current = setInterval(() => {
      setVaultCredits((v) => {
        const rate = Math.max(1, Math.floor(totalAccountLevel / 5));
        return Math.min(maxVaultCapacity, v + rate);
      });
      setUnclaimedGems((g) => {
        const drillBonus = (auraUpgrades.geode_drill || 0) * 2;
        const rate = 0.01 * (1 + facilityRank * 0.25 + drillBonus) + (auraUpgrades.vault || 0) * 5e-3;
        const cap = 100 + facilityRank * 50 + (auraUpgrades.vault || 0) * 25 + (auraUpgrades.geode_drill || 0) * 500;
        return Math.min(cap, g + rate);
      });
      localStorage.setItem("mugen_last_active", Date.now().toString());
    }, 1e3);
    return () => {
      clearInterval(recoveryInterval.current);
      clearInterval(passiveInterval.current);
    };
  }, [totalAccountLevel, maxStamina, appState, recoveryRate, maxVaultCapacity]);
  useEffect(() => {
    if (appState === "playing") {
      playSound("view_change", settings.audio.master * 0.4);
      playSound("mugen_cursor_confirm", settings.audio.master * 0.3);
    }
  }, [view]);
  useEffect(() => {
    if (loading || !characters.length) return;
    const today = (/* @__PURE__ */ new Date()).toDateString();
    if (stats.lastLoginDate !== today) {
      setStats((prev) => ({
        ...prev,
        lastLoginDate: today,
        dailyStreak: prev.lastLoginDate === new Date(Date.now() - 864e5).toDateString() ? prev.dailyStreak + 1 : 1
      }));
      setShowDailyModal(true);
    }
    const lastTime = parseInt(localStorage.getItem("mugen_last_active") || Date.now().toString());
    const now = Date.now();
    const diffSeconds = Math.floor((now - lastTime) / 1e3);
    if (diffSeconds > 0) {
      const rate = Math.max(1, Math.floor(totalAccountLevel / 10));
      const gained = rate * diffSeconds;
      setVaultCredits((v) => Math.min(maxVaultCapacity, v + gained));
      try {
        const offlineStamina = Math.floor(diffSeconds * recoveryRate);
        if (offlineStamina > 0) {
          setStamina((s) => {
            const before = s;
            const after = Math.min(maxStamina, Math.floor(s + offlineStamina));
            if (after > before && typeof createFloatingText === "function") {
              createFloatingText(`+${after - before} Stamina (offline)`, false, "#4ade80");
            }
            return after;
          });
        }
      } catch (e) {
        console.warn("Offline stamina regen failed:", e);
      }
    }
  }, [loading, characters.length]);
  useEffect(() => {
    return () => {
      if (activeDialogueTimeout && activeDialogueTimeout.current) {
        clearTimeout(activeDialogueTimeout.current);
        activeDialogueTimeout.current = null;
      }
    };
  }, []);
  useEffect(() => {
    const xpHandler = (e) => {
      const xp = e.detail?.xp || 0;
      if (xp > 0 && characters.length > 0) {
        setCharacters((prev) => prev.map((c) => {
          if (!unlockedIds.includes(c.export_id)) return c;
          let newXp = c.xp + xp;
          let newLvl = c.level;
          let nXp = c.nextXp;
          while (newXp >= nXp) {
            newXp -= nXp;
            newLvl++;
            nXp = Math.floor(100 * Math.pow(1.15, newLvl - 1));
          }
          return { ...c, level: newLvl, xp: newXp, nextXp: nXp };
        }));
        playSound("xp_gain");
      }
    };
    window.addEventListener("mugen_global_xp", xpHandler);
    const handler = (e) => {
      try {
        const payload = e?.detail || {};
        const newMaterials = typeof payload.materials !== "undefined" ? Number(payload.materials) : parseInt(localStorage.getItem("mugen_materials") || "0", 10) || 0;
        const newEssence = typeof payload.essence !== "undefined" ? Number(payload.essence) : parseInt(localStorage.getItem("mugen_essence") || "0", 10) || 0;
        setMaterials(newMaterials);
        if (typeof setEssence === "function") {
          setEssence(newEssence);
        } else {
          localStorage.setItem("mugen_essence", String(newEssence));
        }
      } catch (err) {
        console.warn("Failed to sync materials/essence from event", err);
      }
    };
    window.addEventListener("mugen_materials_changed", handler);
    return () => {
      window.removeEventListener("mugen_materials_changed", handler);
      window.removeEventListener("mugen_global_xp", xpHandler);
    };
  }, [characters, unlockedIds]);
  useEffect(() => {
    setLiveAuraUpgrades(auraUpgrades);
  }, [auraUpgrades]);
  useEffect(() => {
    if (characters.length) {
      const pwr = characters.filter((c) => unlockedIds.includes(c.export_id)).reduce((s, c) => s + calculateSubStat(c, characters, "pwr", skills, auraUpgrades), 0);
      setTotalPWR(pwr);
      // Unlocking is tied to Street Gym Rank-ups (one rank every 15 account levels)
      // instead of a scattered pile of one-off level thresholds -- rank up and you
      // get a clear batch of new venues, not a surprise toast on a random level.
      const rank = Math.floor(totalAccountLevel / 15) + 1;
      const newUnlocks = [...unlockedFeatures];
      const newlyUnlocked = [];
      // One-time migration: Recruit & Shop used to be rank-gated -- existing saves
      // from before this rebalance get them unlocked immediately, no grinding back
      // to a chapter you've already cleared just to re-earn day-one features.
      ["gacha", "shop"].forEach((f) => { if (!newUnlocks.includes(f)) newUnlocks.push(f); });
      const unlockCheck = (feat, atRank) => {
        if (rank >= atRank && !newUnlocks.includes(feat)) {
          newUnlocks.push(feat);
          newlyUnlocked.push(feat);
        }
      };
      // Events/Trials (rank 2) and Jobs (rank 3) are the only gated features now,
      // at a much gentler 15-levels-per-rank pace.
      unlockCheck("events", 2);
      unlockCheck("trials", 2);
      unlockCheck("missions", 3);
      if (newUnlocks.length !== unlockedFeatures.length) {
        setUnlockedFeatures(newUnlocks);
        if (newlyUnlocked.length) {
          playSound("levelUp");
          playSound("mugen_level", 0.6);
          setRankUpUnlocks({ rank, features: newlyUnlocked });
        }
      }
      if (settings?.gameplay?.autoSave !== false) saveGame(true);
    }
  }, [characters, unlockedIds, credits, gems, stamina, aura, auraUpgrades, inventory, shards, campaignProgress, settings, view, vaultCredits, totalAccountLevel, favorites]);
  // Always flush a save when the tab is closed/hidden, even with autosave off —
  // the localStorage writes inside saveGame are synchronous so this is safe.
  //
  // EXCEPT during a save import/restore: Settings → Data writes fresh data
  // straight to localStorage (bypassing React state entirely) and then calls
  // location.reload(). That reload fires `beforeunload`, which used to run
  // this same flush -- and since saveGame() serializes from React state (still
  // the OLD pre-import values, since import never touched React state), it
  // would silently overwrite the just-imported save with stale data a moment
  // before the reload actually happened. Settings sets window.__mugenSkipAutosave
  // right before writing an import/restore/wipe so this flush backs off.
  const saveGameRef = useRef(saveGame);
  saveGameRef.current = saveGame;
  useEffect(() => {
    const flush = () => {
      if (window.__mugenSkipAutosave) return;
      try { saveGameRef.current(true); } catch (e) {}
    };
    window.addEventListener("beforeunload", flush);
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") flush(); });
    return () => window.removeEventListener("beforeunload", flush);
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("mugen_stats", JSON.stringify(stats || {}));
    } catch (e) {
      console.warn("Failed to persist stats to localStorage", e);
    }
  }, [stats]);
  useEffect(() => {
    if (!isYTReady || !hasStarted) return;
    const getCampaignChapterId = () => {
      try {
        for (const chap of CAMPAIGN_CONTENT) {
          const allStageIds = chap.areas.flatMap((a) => a.stages.map((s) => Number(s.id)));
          const minId = Math.min(...allStageIds);
          const maxId = Math.max(...allStageIds);
          if (campaignProgress >= minId && campaignProgress <= maxId) {
            return String(chap.id);
          }
          if (campaignProgress >= minId && campaignProgress > maxId) return String(chap.id);
        }
      } catch (e) {
        return null;
      }
      return null;
    };
    let category = "MENU";
    if (appState === "launcher") category = "LAUNCHER";
    else if (appState === "menu") category = "MENU";
    else if (appState === "playing") {
      if (isVictoryMusic) category = "VICTORY";
      else if (battleMusicActive) {
        category = isHardBattle ? "HARD_BATTLE" : "BATTLE";
      } else if (view === "shop") category = "SHOP";
      else if (view === "events") category = "TRIALS";
      else if (view === "trials") category = "TRIALS";
      else if (view === "lounge") category = "LOUNGE";
      else if (["train", "abilities", "social", "roster"].includes(view)) category = "PROFILE";
      else if (view === "gacha") category = "GACHA";
      else if (view === "campaign") category = "CAMPAIGN";
      else if (view === "home") category = "HOME";
      else if (view === "missions") category = "MISSIONS";
      else if (view === "inventory") category = "INVENTORY";
      else if (view === "settings") category = "SETTINGS";
      else category = "HUB";
    }
    let pool = MUSIC_TRACKS[category] || MUSIC_TRACKS.MENU;
    if (category === "CAMPAIGN") {
      try {
        const chapId = getCampaignChapterId();
        if (chapId && MUSIC_TRACKS.CAMPAIGN_CHAPTERS && MUSIC_TRACKS.CAMPAIGN_CHAPTERS[chapId]) {
          pool = MUSIC_TRACKS.CAMPAIGN_CHAPTERS[chapId];
        } else {
          pool = MUSIC_TRACKS.CAMPAIGN || MUSIC_TRACKS.BATTLE || MUSIC_TRACKS.MENU;
        }
      } catch (e) {
        pool = MUSIC_TRACKS.CAMPAIGN || MUSIC_TRACKS.BATTLE || MUSIC_TRACKS.MENU;
      }
    }
    // Local .mid variety (see MUSIC_TRACKS.MIDI in constants.js): a few screens had
    // zero dedicated music before and now lean on these entirely; a few existing
    // pools (Lounge/Gacha/Battle) get a coin-flip chance of a .mid track instead,
    // for more variety without losing the YouTube tracks already curated there.
    const midiPool = MUSIC_TRACKS.MIDI && MUSIC_TRACKS.MIDI[category];
    const youtubePool = MUSIC_TRACKS[category];
    let provider = "youtube";
    if (midiPool && midiPool.length) {
      provider = !youtubePool || !youtubePool.length || Math.random() < 0.5 ? "midi" : "youtube";
    }
    const applyVolume = () => {
      const musicMult = typeof settings.audio.music === "number" ? settings.audio.music : 1;
      if (ytPlayer.current && typeof ytPlayer.current.setVolume === "function") {
        const vol = Math.max(0, Math.min(100, Math.round(settings.audio.master * musicMult * 100)));
        ytPlayer.current.setVolume(vol);
        if (vol === 0) ytPlayer.current.mute();
        else ytPlayer.current.unMute();
      }
      setMidiVolume(Math.max(0, settings.audio.master * musicMult));
    };
    if (provider === "midi") {
      const trackFile = midiPool[Math.floor(Math.random() * midiPool.length)];
      if (currentTrack !== trackFile || musicProvider !== "midi") {
        setCurrentTrack(trackFile);
        setMusicProvider("midi");
        try {
          if (ytPlayer.current && typeof ytPlayer.current.pauseVideo === "function") ytPlayer.current.pauseVideo();
        } catch (e) {}
        applyVolume();
        playMidi("music/" + trackFile).catch((e) => console.warn("MIDI playback failed", e));
      } else {
        applyVolume();
      }
    } else {
      let trackId = Array.isArray(pool) && pool.length ? pool[Math.floor(Math.random() * pool.length)] : MUSIC_TRACKS.MENU[0];
      // Guard against ever handing a non-YouTube-ID string (e.g. a stray .mid
      // filename from a provider mix-up) to the YT player -- it throws and takes
      // the whole render down with it.
      if (typeof trackId !== "string" || !/^[A-Za-z0-9_-]{8,15}$/.test(trackId)) trackId = MUSIC_TRACKS.MENU[0];
      if (musicProvider === "midi") {
        setMusicProvider("youtube");
        stopMidi();
      }
      if (currentTrack !== trackId) {
        setCurrentTrack(trackId);
        if (!ytPlayer.current) {
          ytPlayer.current = new window.YT.Player("bg-music-player", {
            height: "0",
            width: "0",
            videoId: trackId,
            playerVars: { autoplay: 1, controls: 0, loop: 1, playlist: trackId },
            events: {
              onReady: (e) => {
                applyVolume();
                e.target.playVideo();
              },
              onStateChange: (e) => {
                if (e.data === window.YT.PlayerState.ENDED) e.target.playVideo();
              }
            }
          });
        } else {
          try {
            if (typeof ytPlayer.current.loadVideoById === "function") {
              ytPlayer.current.loadVideoById(trackId);
              applyVolume();
            } else {
              ytPlayer.current.destroy();
              ytPlayer.current = null;
            }
          } catch (err) {
            console.warn("Music transition failed, resetting player", err);
            ytPlayer.current = null;
          }
        }
      } else {
        applyVolume();
        try { ytPlayer.current && typeof ytPlayer.current.playVideo === "function" && ytPlayer.current.playVideo(); } catch (e) {}
      }
    }
  }, [view, battleMusicActive, isVictoryMusic, settings.audio.master, settings.audio.music, appState, isYTReady, hasStarted, campaignProgress]);
  if (loading) return /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", flexDirection: "column", height: "100vh", alignItems: "center", justifyContent: "center", background: "#000", overflow: "hidden", fontFamily: "Rajdhani, sans-serif" }, children: [
    /* @__PURE__ */ jsxDEV("div", { className: "loading-hex-grid" }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 1291,
      columnNumber: 8
    }),
    /* @__PURE__ */ jsxDEV("div", { className: "loading-pulse-ring" }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 1292,
      columnNumber: 8
    }),
    /* @__PURE__ */ jsxDEV("div", { className: "intro-data-stream" }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 1293,
      columnNumber: 8
    }),
    /* @__PURE__ */ jsxDEV("div", { style: { position: "relative", zIndex: 10, width: "100%", maxWidth: "400px", padding: "20px", textAlign: "center" }, children: [
      /* @__PURE__ */ jsxDEV("div", { style: { display: "inline-flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.05)", padding: "4px 15px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.1)", marginBottom: 20 }, children: [
        /* @__PURE__ */ jsxDEV(Activity, { size: 12, color: "var(--primary)", className: "animate-pulse" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1297,
          columnNumber: 14
        }),
        /* @__PURE__ */ jsxDEV("span", { style: { fontSize: "0.65rem", fontWeight: 900, color: "#fff", letterSpacing: 2 }, children: "ENTERING THE CITY..." }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1298,
          columnNumber: 14
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 1296,
        columnNumber: 11
      }),
      /* @__PURE__ */ jsxDEV("div", { style: { position: "relative" }, children: [
        /* @__PURE__ */ jsxDEV("h1", { className: "intro-logo-reveal", style: { fontSize: "4rem", margin: "10px 0", textShadow: "0 0 30px var(--primary)" }, children: "MUGEN" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1302,
          columnNumber: 14
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "glitch-text", "data-text": "AWAKENING", style: { fontSize: "0.8rem", fontWeight: 900, letterSpacing: 5, color: "#fff" }, children: "AWAKENING" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1303,
          columnNumber: 14
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 1301,
        columnNumber: 11
      }),
      /* @__PURE__ */ jsxDEV("div", { style: { marginTop: 40 }, children: [
        /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", justifyContent: "space-between", fontSize: "0.5rem", fontWeight: 900, color: "var(--text-muted)", marginBottom: 8 }, children: [
          /* @__PURE__ */ jsxDEV("span", { children: "SUMMONING YOUR HEROES" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 1308,
            columnNumber: 17
          }),
          /* @__PURE__ */ jsxDEV("span", { children: "88%" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 1309,
            columnNumber: 17
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 1307,
          columnNumber: 14
        }),
        /* @__PURE__ */ jsxDEV("div", { style: { height: 4, width: "100%", background: "rgba(255,255,255,0.05)", borderRadius: 2, position: "relative", overflow: "hidden" }, children: [
          /* @__PURE__ */ jsxDEV("div", { style: { height: "100%", background: "linear-gradient(90deg, transparent, var(--primary), transparent)", width: "60%", position: "absolute", left: "-60%", animation: "shimmer 1.5s infinite linear" } }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 1312,
            columnNumber: 17
          }),
          /* @__PURE__ */ jsxDEV("div", { style: { height: "100%", background: "var(--primary)", width: "88%", boxShadow: "0 0 10px var(--primary)" } }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 1313,
            columnNumber: 17
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 1311,
          columnNumber: 14
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 1306,
        columnNumber: 11
      }),
      /* @__PURE__ */ jsxDEV("div", { style: { marginTop: 20, fontSize: "0.55rem", opacity: 0.4, color: "#fff", fontFamily: "monospace" }, children: ["GATHERING YOUR ALLIES", "SHARPENING EVERY BLADE", "CHARGING YOUR SPIRIT", "PREPARING THE ARENA"][Math.floor(Date.now() / 800) % 4] }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 1317,
        columnNumber: 11
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 1295,
      columnNumber: 8
    })
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 1290,
    columnNumber: 5
  });
  if (appState === "launcher") {
    return /* @__PURE__ */ jsxDEV("div", { className: "launcher-screen", style: { fontFamily: "Rajdhani, sans-serif" }, onClick: () => {
      if (!hasStarted) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          const tempCtx = new AudioCtx();
          if (tempCtx.state === "suspended") tempCtx.resume();
        }
        setHasStarted(true);
        playSound("mugen_round", 0.5);
        return;
      }
      if (introFrame < 4) {
        setIntroFrame(4);
        return;
      }
      if (introFrame >= 4) {
        setAppState("menu");
        playSound("mugen_fight", 0.6);
      }
    }, children: [
      !hasStarted ? /* @__PURE__ */ jsxDEV("div", { className: "launcher-content animate-popIn", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "scanning-line" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1349,
          columnNumber: 14
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "vhs-noise", style: { opacity: 0.2 } }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1350,
          columnNumber: 14
        }),
        /* @__PURE__ */ jsxDEV("div", { style: { position: "absolute", top: -100, left: "50%", transform: "translateX(-50%)", opacity: 0.1, pointerEvents: "none" }, children: /* @__PURE__ */ jsxDEV(Zap, { size: 300, color: "var(--primary)" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1352,
          columnNumber: 16
        }) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1351,
          columnNumber: 14
        }),
        /* @__PURE__ */ jsxDEV("h1", { className: "launcher-title glitch-text-hover", "data-text": "MUGEN", style: { fontSize: "min(15vw, 6rem)", textShadow: "4px 4px 0px rgba(0,0,0,0.5)", fontFamily: "Cinzel", fontStyle: "italic", animation: "logo-drop 0.8s ease-out" }, children: "MUGEN" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1354,
          columnNumber: 14
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "launcher-subtitle", style: { letterSpacing: 12, opacity: 0.8, color: "#fff" }, children: "CITY STORIES : 2008" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1355,
          columnNumber: 14
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "press-start-container", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "press-start", style: { fontSize: "1.2rem", textShadow: "0 0 10px #fff" }, children: "TOUCH TO BEGIN" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 1357,
            columnNumber: 16
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "data-bits-flicker", children: "A FIGHTING SPIRIT NEVER FADES" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 1358,
            columnNumber: 16
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 1356,
          columnNumber: 14
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "anime-speed-lines", style: { opacity: 0.2 } }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1360,
          columnNumber: 14
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 1348,
        columnNumber: 11
      }) : /* @__PURE__ */ jsxDEV(Fragment, { children: [
        /* @__PURE__ */ jsxDEV("div", { className: "anime-intro-container", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "intro-data-stream" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 1365,
            columnNumber: 16
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "anime-speed-lines" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 1366,
            columnNumber: 16
          }),
          introFrame < 4 && (() => {
            const beats = [
              { key: "FIRE", color: "#ff4444", caption: "YOUR STORY BEGINS", shot: "wide" },
              { key: "WATER", color: "#00d2ff", caption: "RISE UP", shot: "closeup" },
              { key: "WIND", color: "#4ade80", caption: "FACE YOUR DESTINY", shot: "vs" },
              { key: "LIGHT", color: "#facc15", caption: "ENTER THE ARENA", shot: "leap" }
            ];
            const beat = beats[introFrame % 4];
            const sil = (extraStyle, key) => /* @__PURE__ */ jsxDEV(
              "img",
              { src: "intro_char_shadow.png", alt: "", style: { filter: `drop-shadow(0 0 40px ${beat.color})`, ...extraStyle } },
              key,
              false,
              {}
            );
            let stage;
            if (beat.shot === "wide") {
              stage = /* @__PURE__ */ jsxDEV("div", { style: { position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", animation: "anime-hero-slide 0.7s ease-out" }, children: sil({ width: "42%", opacity: 0.55, transform: "scale(1)" }) }, void 0, false, {});
            } else if (beat.shot === "closeup") {
              stage = /* @__PURE__ */ jsxDEV("div", { style: { position: "absolute", inset: 0, overflow: "hidden", display: "flex", alignItems: "flex-end", justifyContent: "center" }, children: sil({ width: "75%", opacity: 0.75, transform: "translateY(15%) scale(1.6)" }) }, void 0, false, {});
            } else if (beat.shot === "vs") {
              stage = /* @__PURE__ */ jsxDEV("div", { style: { position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 4%" }, children: [
                sil({ width: "32%", opacity: 0.6, transform: "scaleX(-1)" }, "l"),
                /* @__PURE__ */ jsxDEV("div", { style: { width: 2, height: "60%", background: beat.color, boxShadow: `0 0 30px ${beat.color}`, opacity: 0.8 } }, void 0, false, {}),
                sil({ width: "32%", opacity: 0.6, transform: "none" }, "r")
              ] }, void 0, true, {});
            } else {
              stage = /* @__PURE__ */ jsxDEV("div", { style: { position: "absolute", inset: 0, display: "flex", alignItems: "flex-end", justifyContent: "center", overflow: "hidden" }, children: sil({ width: "95%", opacity: 0.8, transform: "translateY(10%) scale(1.15) rotate(-2deg)" }) }, void 0, false, {});
            }
            return /* @__PURE__ */ jsxDEV("div", { className: "intro-cut", children: [
              /* @__PURE__ */ jsxDEV("div", { style: { position: "absolute", inset: 0, background: `radial-gradient(circle, ${beat.color}22, #000 75%)`, transition: "background 0.3s" } }, void 0, false, {}),
              introFrame > 0 && /* @__PURE__ */ jsxDEV("div", { className: "intro-slash", style: { background: beat.color, boxShadow: `0 0 60px ${beat.color}` } }, void 0, false, {}),
              stage,
              /* @__PURE__ */ jsxDEV("div", { className: "anime-speed-lines", style: { opacity: beat.shot === "leap" ? 0.5 : 0.2 } }, void 0, false, {}),
              /* @__PURE__ */ jsxDEV("div", { className: `intro-flicker-overlay ${introFrame > 0 ? "intro-flicker-active" : ""}`, style: { background: beat.color } }, void 0, false, {}),
              /* @__PURE__ */ jsxDEV("div", { style: { position: "absolute", top: "18%", color: beat.color, fontWeight: 900, fontSize: "0.65rem", letterSpacing: 14, opacity: 0.85, textShadow: `0 0 20px ${beat.color}` }, children: beat.key }, void 0, false, {}),
              /* @__PURE__ */ jsxDEV("div", { style: { position: "absolute", color: "#fff", fontWeight: 900, fontSize: "0.9rem", letterSpacing: 10, bottom: "20%", textShadow: "0 2px 10px rgba(0,0,0,0.8)" }, children: beat.caption }, void 0, false, {})
            ] }, introFrame + "-cut", true, {});
          })(),
          introFrame >= 4 && /* @__PURE__ */ jsxDEV("div", { className: "intro-cut animate-fadeIn", style: { background: "#000" }, children: [
            /* @__PURE__ */ jsxDEV("div", { style: { position: "absolute", inset: 0, background: "radial-gradient(circle, var(--primary) 0%, #000 70%)", opacity: 0.2 } }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 1380,
              columnNumber: 21
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "intro-slash", style: { animationDuration: "0.25s" } }, void 0, false, {}),
            /* @__PURE__ */ jsxDEV("div", { ref: logoRef, className: "intro-logo-reveal", style: {
              textShadow: "0 0 50px var(--primary), 0 0 100px var(--primary)",
              letterSpacing: 20
            }, children: "MUGEN" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 1381,
              columnNumber: 21
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "absolute bottom-[30%] text-white font-bold text-sm tracking-[6px] opacity-70 animate-pulse", children: "EVERY HERO. ONE CITY. NO LIMITS." }, void 0, false, {}),
            /* @__PURE__ */ jsxDEV("div", { className: "intro-flash", style: { animationDuration: "0.4s" } }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 1386,
              columnNumber: 21
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 1379,
            columnNumber: 18
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 1364,
          columnNumber: 13
        }),
        introFrame >= 4 && /* @__PURE__ */ jsxDEV("div", { className: "launcher-content animate-fadeIn", style: {
          background: "linear-gradient(to top, rgba(0,0,0,0.9) 20%, transparent 100%)",
          width: "100%",
          position: "absolute",
          bottom: 0,
          padding: "40px 0 80px",
          borderRadius: 0,
          backdropFilter: "none",
          zIndex: 200
        }, children: [
          /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "1rem", fontWeight: 900, letterSpacing: 8, marginBottom: 10, color: "#4ade80" }, children: "THE STAGE IS SET" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 1397,
            columnNumber: 17
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "press-start", style: { color: "var(--primary)", fontSize: "1.4rem" }, children: "TAP TO ENTER THE CITY" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 1398,
            columnNumber: 17
          }),
          /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.55rem", opacity: 0.3, marginTop: 20 }, children: "TAP ANYWHERE TO SKIP" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 1399,
            columnNumber: 17
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 1392,
          columnNumber: 15
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 1363,
        columnNumber: 11
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "scanline-overlay" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 1404,
        columnNumber: 9
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 1326,
      columnNumber: 7
    });
  }
  if (appState === "menu") return /* @__PURE__ */ jsxDEV("div", { className: "main-menu", style: { background: "radial-gradient(circle at center, #0f172a 0%, #020617 100%)" }, children: [
    /* @__PURE__ */ jsxDEV("div", { className: "grid-perspective", style: { opacity: 0.4 } }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 1412,
      columnNumber: 7
    }),
    /* @__PURE__ */ jsxDEV("div", { className: "vhs-noise", style: { opacity: 0.05 } }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 1413,
      columnNumber: 7
    }),
    /* @__PURE__ */ jsxDEV("div", { style: { position: "absolute", inset: 0, backgroundImage: "url(background_hub.png)", backgroundSize: "cover", opacity: 0.15, filter: "grayscale(1) contrast(1.2)" } }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 1414,
      columnNumber: 7
    }),
    /* @__PURE__ */ jsxDEV("div", { className: "anime-speed-lines", style: { opacity: 0.1, zIndex: 1 } }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 1415,
      columnNumber: 7
    }),
    /* @__PURE__ */ jsxDEV("div", { className: "menu-status-bar", children: [
      /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", alignItems: "center", gap: 15 }, children: [
        /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", alignItems: "center", gap: 8, color: "var(--primary)" }, children: [
          /* @__PURE__ */ jsxDEV(Database, { size: 14, className: "animate-pulse" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 1421,
            columnNumber: 16
          }),
          /* @__PURE__ */ jsxDEV("span", { children: "DOWNTOWN • DISTRICT 8" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 1422,
            columnNumber: 16
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 1420,
          columnNumber: 13
        }),
        /* @__PURE__ */ jsxDEV("div", { style: { width: 1, height: 15, background: "rgba(255,255,255,0.2)" } }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1424,
          columnNumber: 13
        }),
        /* @__PURE__ */ jsxDEV("div", { style: { color: "#4ade80" }, children: "OPEN TIL LATE" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1425,
          columnNumber: 13
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 1419,
        columnNumber: 10
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "menu-time-block", children: [
        /* @__PURE__ */ jsxDEV("span", { children: "TONIGHT" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1428,
          columnNumber: 13
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "time-box", children: (/* @__PURE__ */ new Date()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1429,
          columnNumber: 13
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 1427,
        columnNumber: 10
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 1418,
      columnNumber: 7
    }),
    featuredMenuHero && /* @__PURE__ */ jsxDEV(
      "img",
      {
        src: featuredMenuHero.imageUrl,
        className: "menu-character-overlay",
        alt: "featured"
      },
      void 0,
      false,
      {
        fileName: "<stdin>",
        lineNumber: 1435,
        columnNumber: 9
      }
    ),
    /* @__PURE__ */ jsxDEV("div", { className: "menu-side-content", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "menu-glitch-wrapper", style: { padding: 0 }, children: [
        /* @__PURE__ */ jsxDEV("h1", { className: "title-glow glitch-text-hover", "data-text": "MUGEN", style: { fontSize: "5rem", margin: 0 }, children: "MUGEN" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1445,
          columnNumber: 11
        }),
        /* @__PURE__ */ jsxDEV("div", { style: { letterSpacing: 6, fontSize: "0.7rem", fontWeight: 900, color: "var(--primary)", marginTop: -10, opacity: 0.8 }, children: "CITY STORIES • AFTER DARK" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1446,
          columnNumber: 11
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 1444,
        columnNumber: 9
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "menu-btn-group", children: [
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            className: "menu-btn glitch-btn",
            onMouseEnter: () => playSound("menu_hover", 0.15),
            onClick: () => {
              setAppState("playing");
              playSound("menu_click");
            },
            style: { width: "280px", textAlign: "left", paddingLeft: "30px" },
            children: [
              /* @__PURE__ */ jsxDEV("span", { className: "btn-glitch-content", style: { display: "flex", alignItems: "center", gap: 15 }, children: [
                /* @__PURE__ */ jsxDEV(Sword, { size: 20 }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 1455,
                  columnNumber: 16
                }),
                " ENTER THE CITY"
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 1454,
                columnNumber: 13
              }),
              /* @__PURE__ */ jsxDEV("span", { className: "btn-glitch-layer", children: "STEP INSIDE..." }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 1457,
                columnNumber: 13
              })
            ]
          },
          void 0,
          true,
          {
            fileName: "<stdin>",
            lineNumber: 1450,
            columnNumber: 11
          }
        ),
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            className: "menu-btn secondary-btn",
            onMouseEnter: () => playSound("menu_hover", 0.1),
            onClick: () => {
              setAppState("playing");
              setView("roster");
              playSound("menu_click");
            },
            style: { width: "280px", textAlign: "left", paddingLeft: "30px", margin: 0 },
            children: /* @__PURE__ */ jsxDEV("span", { style: { display: "flex", alignItems: "center", gap: 15 }, children: [
              /* @__PURE__ */ jsxDEV(Users, { size: 18 }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 1465,
                columnNumber: 16
              }),
              " THE LINEUP"
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 1464,
              columnNumber: 13
            })
          },
          void 0,
          false,
          {
            fileName: "<stdin>",
            lineNumber: 1460,
            columnNumber: 11
          }
        ),
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            className: "menu-btn secondary-btn",
            onMouseEnter: () => playSound("menu_hover", 0.1),
            onClick: () => {
              setAppState("playing");
              setView("settings");
              playSound("menu_click");
            },
            style: { width: "280px", textAlign: "left", paddingLeft: "30px", margin: 0 },
            children: /* @__PURE__ */ jsxDEV("span", { style: { display: "flex", alignItems: "center", gap: 15 }, children: [
              /* @__PURE__ */ jsxDEV(Settings, { size: 18 }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 1474,
                columnNumber: 16
              }),
              " HOUSE RULES"
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 1473,
              columnNumber: 13
            })
          },
          void 0,
          false,
          {
            fileName: "<stdin>",
            lineNumber: 1469,
            columnNumber: 11
          }
        )
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 1449,
        columnNumber: 9
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "menu-news-board", children: [
        /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.65rem", fontWeight: 900, letterSpacing: 2, marginBottom: 12, opacity: 0.6 }, children: "WORD ON THE STREET" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1480,
          columnNumber: 12
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "news-item", children: [
          /* @__PURE__ */ jsxDEV("span", { className: "news-tag", children: "[UPDATE]" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 1482,
            columnNumber: 15
          }),
          /* @__PURE__ */ jsxDEV("span", { children: "V2.7.5: Luck & Trials now live. Endgame floors accessible." }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 1483,
            columnNumber: 15
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 1481,
          columnNumber: 12
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "news-item", children: [
          /* @__PURE__ */ jsxDEV("span", { className: "news-tag", children: "[EVENT]" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 1486,
            columnNumber: 15
          }),
          /* @__PURE__ */ jsxDEV("span", { children: "Series Paradox Trial rewards boosted for 24h." }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 1487,
            columnNumber: 15
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 1485,
          columnNumber: 12
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "news-item", style: { border: "none", marginBottom: 0, paddingBottom: 0 }, children: [
          /* @__PURE__ */ jsxDEV("span", { className: "news-tag", children: "[INTEL]" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 1490,
            columnNumber: 15
          }),
          /* @__PURE__ */ jsxDEV("span", { children: "Unusual rift activity detected in Sector 7 Slums..." }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 1491,
            columnNumber: 15
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 1489,
          columnNumber: 12
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 1479,
        columnNumber: 9
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 1443,
      columnNumber: 7
    }),
    /* @__PURE__ */ jsxDEV("div", { className: "menu-quick-stats", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "quick-stat-box", children: [
        /* @__PURE__ */ jsxDEV("span", { className: "stat-label", style: { fontSize: "0.55rem" }, children: "STREET REP" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1499,
          columnNumber: 13
        }),
        /* @__PURE__ */ jsxDEV("span", { className: "stat-val", style: { color: "var(--primary)", fontSize: "1.4rem" }, children: totalAccountLevel }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1500,
          columnNumber: 13
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 1498,
        columnNumber: 10
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "quick-stat-box", style: { borderColor: "var(--gem-color)" }, children: [
        /* @__PURE__ */ jsxDEV("span", { className: "stat-label", style: { fontSize: "0.55rem" }, children: "GEMS" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1503,
          columnNumber: 13
        }),
        /* @__PURE__ */ jsxDEV("span", { className: "stat-val", style: { color: "var(--gem-color)", fontSize: "1.4rem" }, children: gems }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1504,
          columnNumber: 13
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 1502,
        columnNumber: 10
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 1497,
      columnNumber: 7
    }),
    /* @__PURE__ */ jsxDEV("div", { className: "menu-footer-data", children: [
      /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", gap: 20 }, children: [
        /* @__PURE__ */ jsxDEV("span", { children: "MUGEN CITY • EST. 2008" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1510,
          columnNumber: 12
        }),
        /* @__PURE__ */ jsxDEV("span", { children: "THE NIGHT IS YOUNG" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1511,
          columnNumber: 12
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 1509,
        columnNumber: 9
      }),
      /* @__PURE__ */ jsxDEV("span", { className: "animate-pulse", style: { color: "#4ade80" }, children: "READY WHEN YOU ARE" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 1513,
        columnNumber: 9
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 1508,
      columnNumber: 7
    })
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 1410,
    columnNumber: 5
  });
  return /* @__PURE__ */ jsxDEV("div", { className: `app-layout ${isHype ? "frenzy-active" : ""} ${settings?.graphics?.theme === "nightlife" ? "theme-nightlife" : ""}`, children: [
    /* @__PURE__ */ jsxDEV("div", { id: "bg-music-player", style: { position: "absolute", opacity: 0, pointerEvents: "none" } }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 1521,
      columnNumber: 7
    }),
    /* @__PURE__ */ jsxDEV(BackgroundLayer, { view }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 1522,
      columnNumber: 7
    }),
    /* @__PURE__ */ jsxDEV("div", { className: `impact-flash ${impactActive ? "active" : ""}` }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 1523,
      columnNumber: 7
    }),
    visualEffects.map((fx) => /* @__PURE__ */ jsxDEV(VisualEffect, { fx }, fx.id, false, {
      fileName: "<stdin>",
      lineNumber: 1524,
      columnNumber: 32
    })),
    isHype && /* @__PURE__ */ jsxDEV("div", { className: "hype-text", children: "HYPE MODE!!" }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 1525,
      columnNumber: 18
    }),
    combo > 1 && /* @__PURE__ */ jsxDEV("div", { className: "combo-counter", children: [
      combo,
      " HIT COMBO"
    ] }, combo, true, {
      fileName: "<stdin>",
      lineNumber: 1526,
      columnNumber: 21
    }),
    /* @__PURE__ */ jsxDEV("nav", { className: "nav-container", children: !isMobile ? /* @__PURE__ */ jsxDEV(Fragment, { children: [
      /* @__PURE__ */ jsxDEV("div", { className: "nav-brand", style: { fontFamily: "Cinzel", letterSpacing: "4px", fontStyle: "italic", background: "linear-gradient(to right, #fff, #94a3b8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }, children: "MUGEN 08" }, void 0, false, {}),
      // --- MAIN: the everyday loop ---
      /* @__PURE__ */ jsxDEV("div", { className: "nav-section-label", children: "Main" }, void 0, false, {}),
      /* @__PURE__ */ jsxDEV("div", { className: `nav-item ${view === "home" ? "active" : ""}`, onMouseEnter: () => playSound("menu_hover", 0.1), onClick: () => { setView("home"); playSound("menu_click", 0.2); }, children: [
        /* @__PURE__ */ jsxDEV(Home, { size: 20 }, void 0, false, {}),
        " ",
        /* @__PURE__ */ jsxDEV("span", { className: "nav-label-text", children: "The Spot" }, void 0, false, {})
      ] }, void 0, true, {}),
      /* @__PURE__ */ jsxDEV("div", { className: `nav-item ${["train", "abilities", "social"].includes(view) ? "active" : ""}`, onMouseEnter: () => playSound("menu_hover", 0.1), onClick: () => { setView("train"); playSound("menu_click", 0.2); }, children: [
        characters[selectedCharIndex] ? /* @__PURE__ */ jsxDEV("img", { src: characters[selectedCharIndex].imageUrl, className: "nav-char-icon", alt: "" }, void 0, false, {}) : /* @__PURE__ */ jsxDEV(Sword, { size: 20 }, void 0, false, {}),
        /* @__PURE__ */ jsxDEV("span", { className: "nav-label-text", children: "Profile" }, void 0, false, {})
      ] }, void 0, true, {}),
      /* @__PURE__ */ jsxDEV("div", { className: `nav-item ${view === "roster" ? "active" : ""}`, onMouseEnter: () => playSound("menu_hover", 0.1), onClick: () => { setView("roster"); playSound("menu_click", 0.2); }, children: [
        /* @__PURE__ */ jsxDEV(Users, { size: 20 }, void 0, false, {}),
        " ",
        /* @__PURE__ */ jsxDEV("span", { className: "nav-label-text", children: "Roster" }, void 0, false, {})
      ] }, void 0, true, {}),
      /* @__PURE__ */ jsxDEV("div", { className: "nav-divider" }, void 0, false, {}),
      // --- NIGHTLIFE: social + the gamble ---
      /* @__PURE__ */ jsxDEV("div", { className: "nav-section-label", children: "Nightlife" }, void 0, false, {}),
      /* @__PURE__ */ jsxDEV("div", { className: `nav-item ${view === "lounge" ? "active" : ""}`, onMouseEnter: () => playSound("menu_hover", 0.1), onClick: () => { setView("lounge"); playSound("menu_click", 0.2); }, children: [
        /* @__PURE__ */ jsxDEV(Heart, { size: 20 }, void 0, false, {}),
        " ",
        /* @__PURE__ */ jsxDEV("span", { className: "nav-label-text", children: "Lounge" }, void 0, false, {})
      ] }, void 0, true, {}),
      /* @__PURE__ */ jsxDEV("div", { className: `nav-item ${view === "gacha" ? "active" : ""}`, onMouseEnter: () => playSound("menu_hover", 0.1), onClick: () => { setView("gacha"); playSound("menu_click", 0.2); }, children: [
        /* @__PURE__ */ jsxDEV(Clover, { size: 20 }, void 0, false, {}),
        " ",
        /* @__PURE__ */ jsxDEV("span", { className: "nav-label-text", children: "Recruit" }, void 0, false, {})
      ] }, void 0, true, {}),
      /* @__PURE__ */ jsxDEV("div", { className: "nav-divider" }, void 0, false, {}),
      // --- BATTLE: where the PWR goes to work ---
      /* @__PURE__ */ jsxDEV("div", { className: "nav-section-label", children: "Battle" }, void 0, false, {}),
      /* @__PURE__ */ jsxDEV("div", { className: `nav-item ${view === "campaign" ? "active" : ""}`, onMouseEnter: () => playSound("menu_hover", 0.1), onClick: () => { setView("campaign"); playSound("menu_click", 0.2); }, children: [
        /* @__PURE__ */ jsxDEV(Swords, { size: 20 }, void 0, false, {}),
        " ",
        /* @__PURE__ */ jsxDEV("span", { className: "nav-label-text", children: "Campaign" }, void 0, false, {})
      ] }, void 0, true, {}),
      /* @__PURE__ */ jsxDEV("div", { className: `nav-item ${!unlockedFeatures.includes("events") ? "locked-nav" : ""} ${view === "events" ? "active" : ""}`, onMouseEnter: () => playSound("menu_hover", 0.1), onClick: () => unlockedFeatures.includes("events") ? (setView("events"), playSound("menu_click", 0.2)) : createFloatingText("Reach Street Gym Rank 2 to unlock", true), children: [
        /* @__PURE__ */ jsxDEV(Sparkles, { size: 20 }, void 0, false, {}),
        " ",
        /* @__PURE__ */ jsxDEV("span", { className: "nav-label-text", children: "Events" }, void 0, false, {}),
        !unlockedFeatures.includes("events") && /* @__PURE__ */ jsxDEV("span", { className: "nav-rank-req", children: "RANK 2" }, void 0, false, {})
      ] }, void 0, true, {}),
      /* @__PURE__ */ jsxDEV("div", { className: `nav-item ${!unlockedFeatures.includes("trials") ? "locked-nav" : ""} ${view === "trials" ? "active" : ""}`, onMouseEnter: () => playSound("menu_hover", 0.1), onClick: () => unlockedFeatures.includes("trials") ? (setView("trials"), playSound("menu_click", 0.2)) : createFloatingText("Reach Street Gym Rank 2 to unlock", true), children: [
        /* @__PURE__ */ jsxDEV(Star, { size: 20 }, void 0, false, {}),
        " ",
        /* @__PURE__ */ jsxDEV("span", { className: "nav-label-text", children: "Trials" }, void 0, false, {}),
        !unlockedFeatures.includes("trials") && /* @__PURE__ */ jsxDEV("span", { className: "nav-rank-req", children: "RANK 2" }, void 0, false, {})
      ] }, void 0, true, {}),
      /* @__PURE__ */ jsxDEV("div", { className: "nav-divider" }, void 0, false, {}),
      // --- BUSINESS: gear, gold, and gig work ---
      /* @__PURE__ */ jsxDEV("div", { className: "nav-section-label", children: "Business" }, void 0, false, {}),
      /* @__PURE__ */ jsxDEV("div", { className: `nav-item ${!unlockedFeatures.includes("missions") ? "locked-nav" : ""} ${view === "missions" ? "active" : ""}`, onMouseEnter: () => playSound("menu_hover", 0.1), onClick: () => unlockedFeatures.includes("missions") ? (setView("missions"), playSound("menu_click", 0.2)) : createFloatingText("Reach Street Gym Rank 3 to unlock", true), children: [
        /* @__PURE__ */ jsxDEV(Trophy, { size: 20 }, void 0, false, {}),
        " ",
        /* @__PURE__ */ jsxDEV("span", { className: "nav-label-text", children: "Jobs" }, void 0, false, {}),
        !unlockedFeatures.includes("missions") && /* @__PURE__ */ jsxDEV("span", { className: "nav-rank-req", children: "RANK 3" }, void 0, false, {})
      ] }, void 0, true, {}),
      /* @__PURE__ */ jsxDEV("div", { className: `nav-item ${view === "inventory" ? "active" : ""}`, onMouseEnter: () => playSound("menu_hover", 0.1), onClick: () => { setView("inventory"); playSound("menu_click", 0.2); }, children: [
        /* @__PURE__ */ jsxDEV(LayoutGrid, { size: 20 }, void 0, false, {}),
        " ",
        /* @__PURE__ */ jsxDEV("span", { className: "nav-label-text", children: "Stash" }, void 0, false, {})
      ] }, void 0, true, {}),
      /* @__PURE__ */ jsxDEV("div", { className: `nav-item ${view === "shop" ? "active" : ""}`, onMouseEnter: () => playSound("menu_hover", 0.1), onClick: () => { setView("shop"); playSound("menu_click", 0.2); }, children: [
        /* @__PURE__ */ jsxDEV(ShoppingBag, { size: 20 }, void 0, false, {}),
        " ",
        /* @__PURE__ */ jsxDEV("span", { className: "nav-label-text", children: "Shop" }, void 0, false, {})
      ] }, void 0, true, {}),
      /* @__PURE__ */ jsxDEV("div", { className: `nav-item ${view === "settings" ? "active" : ""}`, onMouseEnter: () => playSound("menu_hover", 0.1), onClick: () => { setView("settings"); playSound("menu_click", 0.2); }, style: { marginTop: "auto" }, children: [
        /* @__PURE__ */ jsxDEV(Settings, { size: 20 }, void 0, false, {}),
        " ",
        /* @__PURE__ */ jsxDEV("span", { className: "nav-label-text", children: "Settings" }, void 0, false, {})
      ] }, void 0, true, {})
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 1531,
      columnNumber: 11
    }) : /* @__PURE__ */ jsxDEV(Fragment, { children: [
      /* @__PURE__ */ jsxDEV("div", { className: `nav-item ${view === "home" ? "active" : ""}`, onClick: () => {
        setView("home");
        setShowMobileMore(false);
        playSound("menu_click", 0.2);
      }, children: [
        /* @__PURE__ */ jsxDEV(Home, { size: 22 }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1611,
          columnNumber: 15
        }),
        " ",
        /* @__PURE__ */ jsxDEV("span", { className: "nav-label-text", children: "Base" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1611,
          columnNumber: 34
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 1610,
        columnNumber: 13
      }),
      /* @__PURE__ */ jsxDEV("div", { className: `nav-item ${["train", "abilities", "social"].includes(view) ? "active" : ""}`, onClick: () => {
        setView("train");
        setShowMobileMore(false);
        playSound("menu_click", 0.2);
      }, children: [
        /* @__PURE__ */ jsxDEV(Sword, { size: 22 }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1614,
          columnNumber: 15
        }),
        " ",
        /* @__PURE__ */ jsxDEV("span", { className: "nav-label-text", children: "Hero" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1614,
          columnNumber: 35
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 1613,
        columnNumber: 13
      }),
      /* @__PURE__ */ jsxDEV("div", { className: `nav-item ${view === "campaign" ? "active" : ""}`, onClick: () => {
        setView("campaign");
        setShowMobileMore(false);
        playSound("menu_click", 0.2);
      }, children: [
        /* @__PURE__ */ jsxDEV(Swords, { size: 22 }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1619,
          columnNumber: 15
        }),
        " ",
        /* @__PURE__ */ jsxDEV("span", { className: "nav-label-text", children: "Combat" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1619,
          columnNumber: 36
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 1616,
        columnNumber: 13
      }),
      /* @__PURE__ */ jsxDEV("div", { className: `nav-item ${view === "events" ? "active" : ""}`, onClick: () => {
        setView("events");
        setShowMobileMore(false);
        playSound("menu_click", 0.2);
      }, children: [
        /* @__PURE__ */ jsxDEV(Sparkles, { size: 22 }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1622,
          columnNumber: 15
        }),
        " ",
        /* @__PURE__ */ jsxDEV("span", { className: "nav-label-text", children: "Events" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1622,
          columnNumber: 38
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 1621,
        columnNumber: 13
      }),
      /* @__PURE__ */ jsxDEV("div", { className: `nav-item ${view === "gacha" ? "active" : ""}`, onClick: () => {
        setView("gacha");
        setShowMobileMore(false);
        playSound("menu_click", 0.2);
      }, children: [
        /* @__PURE__ */ jsxDEV(Clover, { size: 22 }, void 0, false, {}),
        " ",
        /* @__PURE__ */ jsxDEV("span", { className: "nav-label-text", children: "Recruit" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1625,
          columnNumber: 38
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 1624,
        columnNumber: 13
      }),
      /* @__PURE__ */ jsxDEV("div", { className: `nav-item ${showMobileMore ? "active" : ""}`, onClick: () => {
        setShowMobileMore(!showMobileMore);
        playSound("menu_click", 0.1);
      }, children: [
        /* @__PURE__ */ jsxDEV(MoreHorizontal, { size: 22 }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1628,
          columnNumber: 15
        }),
        " ",
        /* @__PURE__ */ jsxDEV("span", { className: "nav-label-text", children: "More" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1628,
          columnNumber: 44
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 1627,
        columnNumber: 13
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 1608,
      columnNumber: 11
    }) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 1529,
      columnNumber: 7
    }),
    isMobile && showMobileMore && /* @__PURE__ */ jsxDEV("div", { className: "mobile-more-overlay", onClick: () => setShowMobileMore(false), children: /* @__PURE__ */ jsxDEV("div", { className: "mobile-more-panel", onClick: (e) => e.stopPropagation(), children: [
      /* @__PURE__ */ jsxDEV("div", { className: "more-menu-item", onClick: () => {
        setView("roster");
        setShowMobileMore(false);
      }, children: [
        /* @__PURE__ */ jsxDEV(Users, { size: 24, color: "var(--primary)" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1639,
          columnNumber: 18
        }),
        " ",
        /* @__PURE__ */ jsxDEV("span", { className: "more-menu-label", children: "Roster" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1639,
          columnNumber: 60
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 1638,
        columnNumber: 15
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "more-menu-item", onClick: () => {
        setView("lounge");
        setShowMobileMore(false);
      }, children: [
        /* @__PURE__ */ jsxDEV(Heart, { size: 24, color: "#f472b6" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1642,
          columnNumber: 18
        }),
        " ",
        /* @__PURE__ */ jsxDEV("span", { className: "more-menu-label", children: "Lounge" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1642,
          columnNumber: 53
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 1641,
        columnNumber: 15
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "more-menu-item", onClick: () => {
        if (unlockedFeatures.includes("events")) {
          setView("events");
          setShowMobileMore(false);
        } else createFloatingText("Reach Street Gym Rank 2 to unlock", true);
      }, children: [
        /* @__PURE__ */ jsxDEV(Sparkles, { size: 24, color: "#a855f7" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1648,
          columnNumber: 18
        }),
        " ",
        /* @__PURE__ */ jsxDEV("span", { className: "more-menu-label", children: "Events" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1648,
          columnNumber: 56
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 1644,
        columnNumber: 15
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "more-menu-item", onClick: () => {
        if (unlockedFeatures.includes("trials")) {
          setView("trials");
          setShowMobileMore(false);
        } else createFloatingText("Reach Street Gym Rank 2 to unlock", true);
      }, children: [
        /* @__PURE__ */ jsxDEV(Star, { size: 24, color: "#facc15" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1654,
          columnNumber: 18
        }),
        " ",
        /* @__PURE__ */ jsxDEV("span", { className: "more-menu-label", children: "Trials" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1654,
          columnNumber: 52
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 1650,
        columnNumber: 15
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "more-menu-item", onClick: () => {
        if (unlockedFeatures.includes("missions")) {
          setView("missions");
          setShowMobileMore(false);
        } else createFloatingText("Reach Street Gym Rank 3 to unlock", true);
      }, children: [
        /* @__PURE__ */ jsxDEV(Trophy, { size: 24, color: "#fb923c" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1660,
          columnNumber: 18
        }),
        " ",
        /* @__PURE__ */ jsxDEV("span", { className: "more-menu-label", children: "Jobs" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1660,
          columnNumber: 54
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 1656,
        columnNumber: 15
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "more-menu-item", onClick: () => {
        setView("inventory");
        setShowMobileMore(false);
      }, children: [
        /* @__PURE__ */ jsxDEV(LayoutGrid, { size: 24, color: "#94a3b8" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1666,
          columnNumber: 18
        }),
        " ",
        /* @__PURE__ */ jsxDEV("span", { className: "more-menu-label", children: "Stash" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1666,
          columnNumber: 58
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 1662,
        columnNumber: 15
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "more-menu-item", onClick: () => {
        setView("shop");
        setShowMobileMore(false);
      }, children: [
        /* @__PURE__ */ jsxDEV(ShoppingBag, { size: 24, color: "#22d3ee" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1672,
          columnNumber: 18
        }),
        " ",
        /* @__PURE__ */ jsxDEV("span", { className: "more-menu-label", children: "Shop" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1672,
          columnNumber: 59
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 1668,
        columnNumber: 15
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "more-menu-item", style: { gridColumn: "span 3" }, onClick: () => {
        setView("settings");
        setShowMobileMore(false);
      }, children: [
        /* @__PURE__ */ jsxDEV(Settings, { size: 20 }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1675,
          columnNumber: 18
        }),
        " ",
        /* @__PURE__ */ jsxDEV("span", { className: "more-menu-label", children: "System Settings" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1675,
          columnNumber: 40
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 1674,
        columnNumber: 15
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 1637,
      columnNumber: 12
    }) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 1636,
      columnNumber: 9
    }),
    /* @__PURE__ */ jsxDEV("main", { className: "content-area", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "resource-header", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "resource-pill", style: { color: "#facc15", borderColor: "rgba(250, 204, 21, 0.3)" }, children: [
          /* @__PURE__ */ jsxDEV(Trophy, { size: 14 }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 1684,
            columnNumber: 113
          }),
          " $",
          credits.toLocaleString()
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 1684,
          columnNumber: 13
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "resource-pill", style: { color: "#00d2ff", borderColor: "rgba(0, 210, 255, 0.3)" }, children: [
          /* @__PURE__ */ jsxDEV(Gem, { size: 14 }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 1685,
            columnNumber: 112
          }),
          " ",
          gems
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 1685,
          columnNumber: 13
        }),
        /* @__PURE__ */ jsxDEV("div", { className: `resource-pill ${stamina < maxStamina * 0.15 ? "stamina-warning" : stamina > maxStamina * 0.9 ? "overdrive-active" : ""}`, style: { color: "#34d399", borderColor: "rgba(52, 211, 153, 0.15)" }, children: [
          /* @__PURE__ */ jsxDEV(Zap, { size: 14 }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 1687,
            columnNumber: 15
          }),
          " ",
          Math.floor(stamina),
          "/",
          maxStamina
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 1686,
          columnNumber: 13
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "resource-pill", style: { color: "#a855f7", borderColor: "rgba(168, 85, 247, 0.3)" }, children: [
          /* @__PURE__ */ jsxDEV(Zap, { size: 14 }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 1689,
            columnNumber: 113
          }),
          " ",
          aura
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 1689,
          columnNumber: 13
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "resource-pill", style: { color: "#f97316", borderColor: "rgba(249,115,22,0.2)" }, children: [
          /* @__PURE__ */ jsxDEV(Star, { size: 14 }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 1690,
            columnNumber: 110
          }),
          " ",
          essence
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 1690,
          columnNumber: 13
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "resource-pill", style: { color: "#94a3b8", borderColor: "rgba(148,163,184,0.2)" }, children: [
          /* @__PURE__ */ jsxDEV(Package, { size: 14 }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 1691,
            columnNumber: 111
          }),
          " ",
          materials
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 1691,
          columnNumber: 13
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "resource-pill", style: { color: "#ff4444", borderColor: "rgba(255, 68, 68, 0.3)" }, children: [
          /* @__PURE__ */ jsxDEV(ArrowUpCircle, { size: 14 }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 1692,
            columnNumber: 112
          }),
          " PWR: ",
          formatPower(totalPWR)
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 1692,
          columnNumber: 13
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 1683,
        columnNumber: 9
      }),
      view === "home" && /* @__PURE__ */ jsxDEV(HomeView, { characters, totalAccountLevel, credits, setCredits, gems, setGems, aura, setView, setSelectedCharIndex, unlockedIds, vaultCredits, setVaultCredits, maxVaultCapacity, createFloatingText, unlockedFeatures, stats, showDailyModal, setShowDailyModal, totalPWR, skills, campaignProgress, unclaimedGems, setUnclaimedGems, triggerVisualEffect, activeMissions, endlessFloor, eventTokens, materials, essence, items, auraUpgrades, selectedCharIndex }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 1696,
        columnNumber: 29
      }),
      (view === "train" || view === "abilities" || view === "social") && /* @__PURE__ */ jsxDEV(CharacterDetailView, { selectedCharIndex, char: characters[selectedCharIndex], characters, setSelectedCharIndex, handleTrain, isShaking, activeDialogue, isTypingDialogue, setIsTypingDialogue, setCharacters, triggerDialogue, setView, stamina, maxStamina, appearanceTags, heroVibes, autoTrainLevel, setAutoTrainLevel, credits, setCredits, gems, setGems, aura, setAura, auraUpgrades, setStamina, createFloatingText, unlockedIds, combo, hypeMeter, isHype, totalAccountLevel, heroMoods, setHeroMoods, triggerVisualEffect, inventory, removeFromInventory, skills, materials, setMaterials, essence, setEssence, totalPWR, items }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 1697,
        columnNumber: 77
      }),
      view === "roster" && /* @__PURE__ */ jsxDEV(RosterView, { characters, setSelectedCharIndex, setView, unlockedIds, shards, setShards, setUnlockedIds, credits, setCredits, playSound, skills, auraUpgrades, favorites, setFavorites }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 1698,
        columnNumber: 31
      }),
      view === "lounge" && /* @__PURE__ */ jsxDEV(BondView, { characters, unlockedIds, setSelectedCharIndex, selectedCharIndex, credits, setCredits, setCharacters, triggerDialogue, triggerVisualEffect, createFloatingText, stamina, setStamina, activeDialogue, isTypingDialogue, setIsTypingDialogue, isShaking, heroVibes, appearanceTags, totalAccountLevel, heroMoods, setHeroMoods, inventory, removeFromInventory, setGems, setAura, materials, setMaterials, essence, setEssence, items, skills, squadIds, setSquadIds, auraUpgrades, dateMemories, setDateMemories }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 1699,
        columnNumber: 31
      }),
      view === "campaign" && /* @__PURE__ */ jsxDEV(CampaignView, { characters, selectedCharIndex, unlockedIds, credits, setCredits, gems, setGems, aura, setAura, stamina, setStamina, maxStamina, createFloatingText, campaignProgress, setCampaignProgress, setShards, squadIds, setSquadIds, triggerVisualEffect, setBattleMusicActive, setIsVictoryMusic, setIsHardBattle, skills, materials, setMaterials, essence, setEssence, items, addToInventory, setCharacters, setShowSquadBuilder, campaignRanks, setCampaignRanks, auraUpgrades }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 1700,
        columnNumber: 33
      }),
      view === "events" && /* @__PURE__ */ jsxDEV(EventsView, { characters, unlockedIds, squadIds, setSquadIds, setShowSquadBuilder, credits, setCredits, gems, setGems, aura, setAura, stamina, setStamina, createFloatingText, triggerVisualEffect, setBattleMusicActive, setIsVictoryMusic, setIsHardBattle, skills, materials, setMaterials, essence, setEssence, addToInventory, auraUpgrades, eventTokens, setEventTokens, setUnlockedIds, totalAccountLevel, setCharacters, eventPurchases, setEventPurchases }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 1701,
        columnNumber: 31
      }),
      view === "inventory" && /* @__PURE__ */ jsxDEV(InventoryView, { inventory, characters, unlockedIds, selectedCharIndex, removeFromInventory, setCharacters, setStamina, maxStamina, setAura, setMaterials, setGems, essence, setEssence, createFloatingText, credits, setCredits, totalPWR, items, skills, auraUpgrades, totalAccountLevel }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 1702,
        columnNumber: 34
      }),
      view === "gacha" && /* @__PURE__ */ jsxDEV(RecruitView, { gems, setGems, characters, unlockedIds, setUnlockedIds, setCharacters, createFloatingText, playSound, credits, setCredits, items, addToInventory, stamina, setStamina, maxStamina, aura, setAura, materials, setMaterials, shards, setShards }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 1703,
        columnNumber: 30
      }),
      view === "trials" && /* @__PURE__ */ jsxDEV(TrialsView, { characters, unlockedIds, createFloatingText, squadIds, setSquadIds, setShowSquadBuilder, clearedTrials, setClearedTrials, setGems, setAura, stamina, setStamina, setBattleMusicActive, setIsVictoryMusic, setIsHardBattle, triggerVisualEffect, endlessFloor, setEndlessFloor, arenaRank, setArenaRank, setCredits, setMaterials, setEssence, skills, auraUpgrades, setCharacters }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 1704,
        columnNumber: 31
      }),
      view === "shop" && /* @__PURE__ */ jsxDEV(ShopView, { credits, setCredits, gems, setGems, aura, setAura, essence, setEssence, materials, setMaterials, addToInventory, setStamina, maxStamina, setCharacters, selectedCharIndex, createFloatingText, characters, unlockedIds, setUnlockedIds, unlockedFeatures, setUnlockedFeatures, totalAccountLevel, auraUpgrades, setAuraUpgrades, setShards, items }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 1705,
        columnNumber: 29
      }),
      view === "missions" && /* @__PURE__ */ jsxDEV(MissionsView, { totalAccountLevel, credits, gems, aura, setCredits, setGems, setAura, setStamina, maxStamina, createFloatingText, claimedMilestones, setClaimedMilestones, totalPWR, items, characters, unlockedIds, activeMissions, setActiveMissions, setMaterials, setEssence, addToInventory, skills, auraUpgrades }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 1706,
        columnNumber: 33
      }),
      view === "settings" && /* @__PURE__ */ jsxDEV(SettingsView, { setAppState, setView, settings, setSettings, stats, saveGame, lastSavedAt, createFloatingText }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 1707,
        columnNumber: 33
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 1681,
      columnNumber: 7
    }),
    activeDialogue && /* @__PURE__ */ jsxDEV("div", { className: "dialogue-overlay-container", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "dialogue-history-peek", children: (dialogueHistory[characters[selectedCharIndex]?.export_id] || []).slice(-3, -1).map((h, i) => /* @__PURE__ */ jsxDEV("div", { className: "history-bubble-mini", children: h }, i, false, {
        fileName: "<stdin>",
        lineNumber: 1715,
        columnNumber: 21
      })) }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 1713,
        columnNumber: 13
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "dialogue-box-v3", onClick: () => setActiveDialogue(null), children: [
        /* @__PURE__ */ jsxDEV("div", { className: "dialogue-nameplate", children: activeDialogue.name }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1719,
          columnNumber: 17
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "dialogue-expression-badge", children: activeDialogue.expression }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1720,
          columnNumber: 17
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "dialogue-text", children: [
          activeDialogue.text,
          isTypingDialogue && /* @__PURE__ */ jsxDEV("span", { className: "dialogue-typing-indicator" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 1723,
            columnNumber: 42
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 1721,
          columnNumber: 17
        }),
        activeDialogue.action && /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.7rem", color: "var(--primary)", fontStyle: "italic", marginTop: 4 }, children: [
          "[",
          activeDialogue.action,
          "]"
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 1725,
          columnNumber: 43
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 1718,
        columnNumber: 13
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 1712,
      columnNumber: 9
    }),
    challenger && /* @__PURE__ */ jsxDEV("div", { className: "challenger-view animate-fadeIn", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "challenger-title-box", children: /* @__PURE__ */ jsxDEV("h1", { children: "A New Challenger Approaches!" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 1732,
        columnNumber: 49
      }) }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 1732,
        columnNumber: 11
      }),
      /* @__PURE__ */ jsxDEV("img", { src: challenger.hero.imageUrl, className: "challenger-silhouette", alt: "???" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 1733,
        columnNumber: 11
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "challenger-actions", children: [
        /* @__PURE__ */ jsxDEV("button", { className: "train-btn", onClick: () => {
          if (stamina < 10) return createFloatingText("Too tired!", true);
          setStamina((s) => s - 10);
          setChallenger((prev) => {
            const wins = prev.wins + 1;
            if (wins >= 4) {
              setUnlockedIds((u) => [...u, prev.hero.export_id]);
              setTimeout(() => setChallenger(null), 1500);
              return { ...prev, wins };
            }
            return { ...prev, wins };
          });
        }, children: "FIGHT! (10 STAMINA)" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1735,
          columnNumber: 13
        }),
        /* @__PURE__ */ jsxDEV("button", { className: "menu-btn", onClick: () => setChallenger(null), children: "FLEE" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1748,
          columnNumber: 13
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 1734,
        columnNumber: 11
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 1731,
      columnNumber: 9
    }),
    particles.map((p) => /* @__PURE__ */ jsxDEV(Particle, { p }, p.id, false, {
      fileName: "<stdin>",
      lineNumber: 1753,
      columnNumber: 27
    })),
    floatingTexts.map((t) => /* @__PURE__ */ jsxDEV(FloatingText, { t }, t.id, false, {
      fileName: "<stdin>",
      lineNumber: 1754,
      columnNumber: 31
    })),
    rankUpUnlocks && /* @__PURE__ */ jsxDEV("div", { className: "rankup-overlay", onClick: () => setRankUpUnlocks(null), children: /* @__PURE__ */ jsxDEV("div", { className: "rankup-card", onClick: (e) => e.stopPropagation(), children: [
      /* @__PURE__ */ jsxDEV("div", { className: "rankup-badge" }, void 0, false, {}),
      /* @__PURE__ */ jsxDEV("div", { className: "rankup-title", children: "STREET GYM RANK UP!" }, void 0, false, {}),
      /* @__PURE__ */ jsxDEV("div", { className: "rankup-rank", children: ["RANK ", rankUpUnlocks.rank] }, void 0, true, {}),
      /* @__PURE__ */ jsxDEV("div", { className: "rankup-sub", children: "New spots just opened up around the city:" }, void 0, false, {}),
      /* @__PURE__ */ jsxDEV("div", { className: "rankup-feature-list", children: rankUpUnlocks.features.map((f) => /* @__PURE__ */ jsxDEV("div", { className: "rankup-feature-chip", children: ({ events: "Events", shop: "Shop", gacha: "Recruit", trials: "Trials", missions: "Jobs" })[f] || f }, f, false, {})) }, void 0, false, {}),
      /* @__PURE__ */ jsxDEV("button", { className: "menu-btn glitch-btn", style: { width: "100%", marginTop: 18 }, onClick: () => setRankUpUnlocks(null), children: "LET'S GO" }, void 0, false, {})
    ] }, void 0, true, {}) }, void 0, false, {}),
    showSquadBuilder && /* @__PURE__ */ jsxDEV(
      SquadBuilderModal,
      {
        characters,
        unlockedIds,
        squadIds,
        setSquadIds,
        onClose: () => setShowSquadBuilder(false),
        playSound,
        createFloatingText,
        skills,
        favorites,
        auraUpgrades,
        filter: typeof showSquadBuilder === "object" ? showSquadBuilder : null
      },
      void 0,
      false,
      {
        fileName: "<stdin>",
        lineNumber: 1757,
        columnNumber: 9
      }
    )
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 1520,
    columnNumber: 5
  });
};
var stdin_default = App;
export {
  stdin_default as default
};
