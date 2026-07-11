import { AUDIO_URLS, PATH_ADJECTIVES, PATH_TITLES, TIER_STATS, SKILL_TYPES, SKILL_RARITY_CONFIG, LEADER_SKILLS, COSMETICS, EQUIPMENT, EQUIP_LEVEL_STEP, EQUIP_MAX_LEVEL } from './constants.js';

// ---------------------------------------------------------------------------
// EVENTS: multiple concurrent live events, computed once here and consumed
// identically by EventsView (to build the events themselves) and GachaView
// (to add rate-up banners) -- a single source of truth so "events affect
// gacha banners" falls out for free instead of needing prop-drilled state.
// ---------------------------------------------------------------------------
// A small pool of differentiator mechanics, applied at battle-build time.
// Franchises with a dedicated .mid track get that track; everything else (and
// the mechanic roll) is picked deterministically per event so it's stable for
// the whole cycle but genuinely varies event to event.
export const EVENT_GIMMICKS = [
  { id: 'double_gauge', name: 'Overclocked Rift', desc: 'Every unit\'s turn gauge fills 40% faster -- a fast, twitchy fight.', tag: 'FAST-PACED', color: '#facc15' },
  { id: 'elemental_storm', name: 'Elemental Storm', desc: 'A random elemental team buff pulses over the whole squad every wave.', tag: 'CHAOTIC', color: '#a855f7' },
  { id: 'mirror_match', name: 'Mirror Rift', desc: 'Enemies echo your own squad\'s average stats back at you.', tag: 'MIRROR MATCH', color: '#60a5fa' },
  { id: 'boss_gauntlet', name: 'Elite Gauntlet', desc: 'No fodder here -- every enemy is boss-tier from the first fight.', tag: 'ELITE ONLY', color: '#ef4444' },
  { id: 'glass_cannon', name: 'Fragile Rift', desc: 'Everyone hits 50% harder and has 30% less HP. Fast, lethal fights.', tag: 'GLASS CANNON', color: '#f97316' },
  { id: 'regen_field', name: 'Regen Field', desc: 'Both sides passively regenerate HP each turn -- attrition wins it.', tag: 'SUSTAIN', color: '#4ade80' }
];
export const getGimmick = (id) => EVENT_GIMMICKS.find((g) => g.id === id) || EVENT_GIMMICKS[0];

// Matches a franchise name to one of the real tracks in music/unique/event/.
export const matchEventMusicTheme = (franchiseName) => {
  const f = String(franchiseName || '').toLowerCase();
  if (f.includes('deltarune')) return 'deltarune';
  if (f.includes('final fantasy vii') || f.includes('final fantasy 7') || f.includes('ff vii')) return 'ff7';
  if (f.includes("bug's life")) return 'abugslife';
  if (f.includes('atlyss')) return 'atlyss';
  return null;
};

const hashStr = (str) => { let h = 0; for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0; return Math.abs(h); };

// Returns every event that's live RIGHT NOW -- one to three concurrently,
// each on its own rotation cycle, each with a locked-in franchise/gimmick for
// that cycle. Pure function of `characters` + the current date, so any view
// that calls this gets the exact same answer with zero prop plumbing.
export const getActiveEvents = (characters = []) => {
  const counts = {};
  characters.forEach((c) => { const f = c.franchise || 'Unknown'; if (f !== 'Unknown') counts[f] = (counts[f] || 0) + 1; });
  const majors = Object.keys(counts).filter((f) => counts[f] >= 3).sort();
  if (!majors.length) return [];
  const now = new Date();
  const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 864e5);
  const weekOfYear = Math.floor(dayOfYear / 7);
  const isWeekend = now.getDay() === 0 || now.getDay() === 6;
  const slots = [];
  const spotlightFr = majors[dayOfYear % majors.length];
  slots.push({
    id: 'spotlight', label: 'DAILY SPOTLIGHT', cycle: 'daily', franchise: spotlightFr,
    theme: matchEventMusicTheme(spotlightFr), gimmick: getGimmick(EVENT_GIMMICKS[hashStr(spotlightFr + dayOfYear) % EVENT_GIMMICKS.length].id).id,
    color: '#facc15', desc: `Today's rotating rift spotlights ${spotlightFr}. Resets daily.`
  });
  // Pick each slot's franchise skipping ones already live this cycle, so the
  // three marquees never all advertise the same series.
  const taken = new Set([spotlightFr]);
  const pickDistinct = (startIdx) => {
    for (let i = 0; i < majors.length; i++) {
      const fr = majors[(startIdx + i) % majors.length];
      if (!taken.has(fr)) { taken.add(fr); return fr; }
    }
    return majors[startIdx % majors.length];
  };
  if (majors.length > 1) {
    const crisisFr = pickDistinct((weekOfYear + 1) % majors.length);
    slots.push({
      id: 'crisis', label: 'WEEKLY CRISIS', cycle: 'weekly', franchise: crisisFr,
      theme: matchEventMusicTheme(crisisFr), gimmick: 'boss_gauntlet',
      color: '#ef4444', desc: `A ${crisisFr} incursion, boss-tier from the start. Resets weekly.`
    });
  }
  // The third marquee is always live: a 3-day "surge" rotation, with weekends
  // upgrading it to boosted rewards instead of gating its existence.
  if (majors.length > 2) {
    const surgeFr = pickDistinct((Math.floor(dayOfYear / 3) + 3) % majors.length);
    slots.push({
      id: 'wildcard', label: isWeekend ? 'WEEKEND SURGE' : 'SURGE RIFT', cycle: isWeekend ? 'weekend' : '3-day', franchise: surgeFr,
      theme: matchEventMusicTheme(surgeFr), gimmick: getGimmick(EVENT_GIMMICKS[hashStr(surgeFr + 'srg' + Math.floor(dayOfYear / 3)) % EVENT_GIMMICKS.length].id).id,
      color: '#a855f7', desc: isWeekend ? `A weekend ${surgeFr} surge with boosted rewards.` : `A ${surgeFr} surge rift. Rotates every 3 days.`, bonus: isWeekend
    });
  }
  return slots.map((s) => ({ ...s, uid: `${s.id}_${s.franchise}`.replace(/\s+/g, '_').toLowerCase() }));
};

// ---------------------------------------------------------------------------
// SHARED GEAR INVENTORY
// ---------------------------------------------------------------------------
// Gear is account-wide, not per-character: one physical instance
// { instanceId, slot, itemId, level } lives in the top-level `gearInventory`
// array (App.js state, persisted as mugen_gear_inventory). A character only
// holds a REFERENCE to an instance per slot: char.equipSlots = { weapon:
// instanceId|null, armor: ..., trinket: ... }. Equipping an instance already
// worn by someone else moves it (the whole point of "share gear like an RPG"
// -- there's only one of each physical item, not an infinite buy-per-hero
// supply). Levelling an instance persists regardless of who's wearing it.
//
// Utils functions are pure and don't receive app state directly, so (matching
// the existing liveAuraUpgrades pattern below) App.js pushes the live
// gearInventory array in here via setLiveGearInventory() whenever it changes.
export let liveGearInventory = [];
export const setLiveGearInventory = (val) => { liveGearInventory = Array.isArray(val) ? val : []; };
export const makeGearInstanceId = () => `gi_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

export const getEquipItem = (slot, id) => (EQUIPMENT[slot] || []).find((it) => it.id === id) || null;

// Resolve a character's equipped gear into full { slot, instanceId, itemId,
// level, item } records (item = the EQUIPMENT catalog entry, with bonuses +
// passives). Enemies/bosses use a simpler embedded shape (unit._equippedGear
// = [{ slot, itemId, level }], no shared instance/inventory) since they never
// need to be "shared" -- getEquippedGearList also accepts that shape directly.
export const getEquippedGearList = (char) => {
  if (!char) return [];
  if (Array.isArray(char._equippedGear)) {
    return char._equippedGear.map((g) => {
      const item = getEquipItem(g.slot, g.itemId);
      return item ? { slot: g.slot, instanceId: null, itemId: g.itemId, level: g.level || 1, item } : null;
    }).filter(Boolean);
  }
  const slots = char.equipSlots;
  if (!slots) return [];
  return ['weapon', 'armor', 'trinket'].map((slot) => {
    const instanceId = slots[slot];
    if (!instanceId) return null;
    const inst = liveGearInventory.find((g) => g.instanceId === instanceId);
    if (!inst) return null;
    const item = getEquipItem(slot, inst.itemId);
    if (!item) return null;
    return { slot, instanceId, itemId: inst.itemId, level: inst.level || 1, item };
  }).filter(Boolean);
};

// Resolve a character's total equipment %-bonus for one (normalized) stat.
export const getEquipBonusForStat = (char, normalizedStat) => {
  let pct = 0;
  getEquippedGearList(char).forEach(({ item, level }) => {
    if (!item.bonuses) return;
    const base = item.bonuses[normalizedStat];
    if (!base) return;
    const lvl = Math.max(1, Math.min(EQUIP_MAX_LEVEL, level || 1));
    pct += base * (1 + (lvl - 1) * EQUIP_LEVEL_STEP);
  });
  return pct;
};

// Flat list of every passive currently active on a character (or enemy unit),
// e.g. [{ type: "elem_boost", element: "FIRE", val: 0.1 }, ...] -- read by
// CombatSystem.js at damage/status-resolution time.
export const getGearPassives = (char) => getEquippedGearList(char).flatMap(({ item, level }) => {
  if (!Array.isArray(item.passives)) return [];
  const lvl = Math.max(1, Math.min(EQUIP_MAX_LEVEL, level || 1));
  const scale = 1 + (lvl - 1) * EQUIP_LEVEL_STEP;
  return item.passives.map((p) => ({ ...p, val: p.val * scale }));
});

// Deterministic PRNG keyed by a string seed (mulberry32-ish). Used so a
// pre-battle "scout" preview can roll the EXACT same gear/outcome the actual
// battle will roll, just by reusing the same seed string in both places --
// no need to pre-compute and stash battle data just to preview it.
export const seededRandom = (seedStr) => {
  let h = 1779033703 ^ String(seedStr).length;
  for (let i = 0; i < String(seedStr).length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
};

// Roll a gear loadout for an enemy/boss/arena opponent, from the SAME
// EQUIPMENT catalog players pull from -- so a scouted opponent's gear card
// reads identically to a player's. Embedded directly on the unit
// (unit._equippedGear = [{slot,itemId,level}]) rather than through the shared
// instance/inventory system, since enemies never trade gear with anyone.
// `powerTier` (0-4) biases which rarities can drop and how leveled they are,
// so a Trials/Expert-tier opponent is meaningfully better-geared than a
// generic Campaign mook.
export const rollEnemyGear = (powerTier = 1, seed = Math.random) => {
  const rarityByTier = [
    ["Common"],
    ["Common", "Rare"],
    ["Rare", "Epic"],
    ["Epic", "Legendary"],
    ["Legendary", "Mythic"]
  ][Math.max(0, Math.min(4, powerTier))];
  const levelByTier = [1, 1, 2, 3, 4][Math.max(0, Math.min(4, powerTier))];
  return ['weapon', 'armor', 'trinket'].map((slot) => {
    const pool = (EQUIPMENT[slot] || []).filter((it) => rarityByTier.includes(it.rarity));
    if (!pool.length) return null;
    const item = pool[Math.floor(seed() * pool.length)];
    return { slot, itemId: item.id, level: Math.max(1, Math.min(EQUIP_MAX_LEVEL, levelByTier)) };
  }).filter(Boolean);
};

// ---------------------------------------------------------------------------
// GEAR OPTIMIZER ("Optimize Gear" QoL, FF-style auto-equip-best)
// ---------------------------------------------------------------------------
// Stat weights per growth archetype -- an Aggressive attacker values ATK gear
// far more than a Defensive tank does, so "best" gear is relative to the
// character, not a single universal ranking.
const GROWTH_STAT_WEIGHTS = {
  Aggressive: { atk: 1.4, 'magic atk': 1.2, speed: 0.9, hp: 0.6, def: 0.6, 'magic def': 0.5, luck: 0.7 },
  Defensive: { hp: 1.4, def: 1.4, 'magic def': 1.2, atk: 0.6, 'magic atk': 0.5, speed: 0.5, luck: 0.6 },
  Balanced: { atk: 1, 'magic atk': 1, hp: 1, def: 1, 'magic def': 1, speed: 1, luck: 1 },
  Swift: { speed: 1.5, luck: 1.2, atk: 0.9, 'magic atk': 0.8, hp: 0.6, def: 0.6, 'magic def': 0.5 }
};
export const scoreGearItem = (item, level, growthType) => {
  const weights = GROWTH_STAT_WEIGHTS[growthType] || GROWTH_STAT_WEIGHTS.Balanced;
  const scale = 1 + Math.max(0, (level || 1) - 1) * EQUIP_LEVEL_STEP;
  let score = 0;
  Object.entries(item.bonuses || {}).forEach(([k, v]) => { score += (weights[k] || 0.7) * v * scale; });
  (item.passives || []).forEach((p) => { score += 0.5 * (p.val || 0) * scale; });
  return score;
};
// Picks the best OWNED, available instance for each slot on `char`. `claimed`
// is a Set of instanceIds NOT eligible for this pick (mutated in place, so a
// single Set threaded across several calls lets a roster-wide "optimize all"
// batch run without two heroes fighting over the same physical piece of gear).
// Deliberately does NOT special-case "this is already my current pick" --
// stale/duplicate equipSlots data (e.g. from an old bug or manual edit) could
// otherwise let two different characters both "keep" the same claimed
// instance. If nothing better is available, the fallback keeps the
// character's current gear UNLESS that exact instance was already claimed by
// someone earlier in this same pass, in which case it's cleared instead of
// silently leaving two characters pointing at one physical item.
export const getOptimalLoadout = (char, gearInventory = [], claimed = new Set()) => {
  const growthType = char.growthType || 'Balanced';
  const currentSlots = char.equipSlots || {};
  const result = {};
  ['weapon', 'armor', 'trinket'].forEach((slot) => {
    const candidates = gearInventory.filter((g) => g.slot === slot && !claimed.has(g.instanceId));
    if (!candidates.length) {
      result[slot] = claimed.has(currentSlots[slot]) ? null : (currentSlots[slot] || null);
      return;
    }
    let best = null, bestScore = -Infinity;
    candidates.forEach((inst) => {
      const item = getEquipItem(slot, inst.itemId);
      if (!item) return;
      const score = scoreGearItem(item, inst.level, growthType);
      if (score > bestScore) { bestScore = score; best = inst; }
    });
    result[slot] = best ? best.instanceId : (currentSlots[slot] || null);
    if (best) claimed.add(best.instanceId);
  });
  return result;
};

// ---------------------------------------------------------------------------
// S.P.E.C.I.A.L. BUILD SYSTEM (currently exclusive to Courier)
// ---------------------------------------------------------------------------
// A Fallout-style 7-stat allocation system layered on top of the normal
// level/gear progression. Each stat starts at a baseline of 1 and can be
// pushed up to 10 by spending points earned through Courier's own "Field
// Experience" track (see getSpecialLevelInfo) -- a level curve entirely
// separate from the character's normal XP/level, so his build is a distinct
// long-term investment rather than something that falls out of just leveling.
export const SPECIAL_STATS = ['str', 'per', 'end', 'cha', 'int', 'agi', 'lck'];
export const SPECIAL_LABELS = {
  str: 'Strength', per: 'Perception', end: 'Endurance',
  cha: 'Charisma', int: 'Intelligence', agi: 'Agility', lck: 'Luck'
};
export const SPECIAL_DESCRIPTIONS = {
  str: 'Raw muscle behind every swing -- physical Attack.',
  per: 'Steady hands, dead-on aim -- Crit Rate.',
  end: 'Keeps taking hits and keeps standing -- Max HP.',
  cha: 'Commands the field, wards off retaliation -- Magic Defense.',
  int: 'Rewires tech and chip logic on the fly -- Magic Attack.',
  agi: 'Faster reflexes, harder to pin down -- Speed.',
  lck: "Six bullets, six coincidences -- Luck (crit odds, gacha-flavored skills)."
};
export const SPECIAL_STAT_MAP = {
  str: 'atk', per: 'crit_rate', end: 'hp', cha: 'magic def', int: 'magic atk', agi: 'speed', lck: 'luck'
};
export const SPECIAL_BASE = 1;
export const SPECIAL_CAP = 10;
// +4% to the mapped stat per point above baseline (point 10 => +36%).
export const SPECIAL_PCT_PER_POINT = 0.04;
// Direct flat Crit Rate per PER point above baseline (bypasses the normal
// luck-derived crit curve so Perception has its own clear identity).
export const SPECIAL_PER_CRIT_PER_POINT = 1.2;

export const getDefaultSpecial = () => SPECIAL_STATS.reduce((m, k) => ({ ...m, [k]: SPECIAL_BASE }), {});

// Field Experience: Courier's own leveling system, driven purely by battles
// fought with him in the squad (see App.js incrementCourierFieldXP), not by
// character level/XP. Every 3 battles grants 1 allocatable SPECIAL point.
export const FIELD_XP_PER_POINT = 3;
export const SPECIAL_MAX_LEVEL = 30;
export const getSpecialLevelInfo = (fieldBattles = 0) => {
  const level = Math.min(SPECIAL_MAX_LEVEL, Math.floor((fieldBattles || 0) / FIELD_XP_PER_POINT));
  const intoLevel = (fieldBattles || 0) % FIELD_XP_PER_POINT;
  const totalPoints = level; // 1 point per level
  return { level, battlesIntoLevel: intoLevel, battlesForNext: FIELD_XP_PER_POINT, totalPoints, maxed: level >= SPECIAL_MAX_LEVEL };
};

export const getSpecialSpentPoints = (special) => SPECIAL_STATS.reduce((sum, k) => sum + Math.max(0, (special?.[k] || SPECIAL_BASE) - SPECIAL_BASE), 0);

// Multiplier applied inside calculateStat for whichever combat stat a SPECIAL
// point is mapped to. Returns 1 (no-op) for characters without a `.special`
// build -- this only activates for characters the game has opted in.
export const getSpecialStatMult = (char, normalizedStat) => {
  if (!char || !char.special) return 1;
  const entry = Object.entries(SPECIAL_STAT_MAP).find(([, mapped]) => mapped === normalizedStat);
  if (!entry) return 1;
  const val = char.special[entry[0]] ?? SPECIAL_BASE;
  return 1 + (val - SPECIAL_BASE) * SPECIAL_PCT_PER_POINT;
};

// Display names for each SPECIAL archetype's reshaped signature form (Courier's
// "Lucky 38 Override" today; shared so the roster detail screen and the
// in-battle skill dock show the exact same label for the exact same build.
export const SPECIAL_ARCHETYPE_NAMES = {
  str: "Strongarm Shot", per: "Dead-Eye", end: "Dug In", cha: "Rally Cry",
  int: "Overcharge (Mage Kit)", agi: "Fleet-Footed", lck: "Lucky Break"
};
// Same dominant-stat resolution the combat engine uses (CombatSystem.js
// `dynamic_special` block): highest SPECIAL stat wins, ties break by a fixed
// priority order, baseline (no investment) resolves to null (basic attack).
export const getDominantSpecialKey = (special) => {
  if (!special) return null;
  const entries = Object.entries(special);
  const maxVal = Math.max(SPECIAL_BASE, ...entries.map(([, v]) => v || SPECIAL_BASE));
  if (maxVal <= SPECIAL_BASE) return null;
  const topKeys = entries.filter(([, v]) => (v || SPECIAL_BASE) === maxVal).map(([k]) => k);
  const priority = ["int", "agi", "str", "per", "end", "cha", "lck"];
  return priority.find((k) => topKeys.includes(k)) || topKeys[0];
};

export const getBondRankName = (level, relationship) => {
  // Normalize relationship strings to the keys used in PATH_ADJECTIVES / PATH_TITLES
  const relKey = (relationship || '').toLowerCase().includes('romant') ? 'Romantic'
                 : (relationship || '').toLowerCase().includes('friend') ? 'Friend'
                 : (relationship || '').toLowerCase().includes('enemy') ? 'Enemy'
                 : (relationship || '').toLowerCase().includes('comrade') ? 'Comrade'
                 : 'Neutral';

  const tierIndex = Math.min(Math.floor((level - 1) / 10), 9);
  const adj = PATH_ADJECTIVES[relKey]?.[tierIndex] || PATH_ADJECTIVES['Neutral'][tierIndex];
  const title = PATH_TITLES[relKey]?.[tierIndex] || PATH_TITLES['Neutral'][tierIndex];
  const rankLabel = relKey === 'Romantic' ? 'Affinity Rank' : 'Rank';
  return `${adj} ${title} (${rankLabel} ${level})`;
};

// Return the short "path" (adjective + title) used for bond paths (useful for UI badges)
export const getBondPath = (level, relationship) => {
  const relKey = (relationship || '').toLowerCase().includes('romant') ? 'Romantic'
                 : (relationship || '').toLowerCase().includes('friend') ? 'Friend'
                 : (relationship || '').toLowerCase().includes('enemy') ? 'Enemy'
                 : (relationship || '').toLowerCase().includes('comrade') ? 'Comrade'
                 : 'Neutral';
  const tierIndex = Math.min(Math.floor((level - 1) / 10), 9);
  const adj = PATH_ADJECTIVES[relKey]?.[tierIndex] || PATH_ADJECTIVES['Neutral'][tierIndex];
  const title = PATH_TITLES[relKey]?.[tierIndex] || PATH_TITLES['Neutral'][tierIndex];
  return `${adj} ${title}`;
};

/**
 * WebAudio Sound Engine
 * Handles low-latency playback, pre-buffering, and master compression.
 */
let audioCtx = null;
const audioBuffers = new Map();
let masterGain = null;
let masterCompressor = null;

const initAudio = () => {
  if (audioCtx) return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  audioCtx = new AudioContext();
  
  // Master Chain: Compressor -> Gain -> Destination
  masterCompressor = audioCtx.createDynamicsCompressor();
  masterCompressor.threshold.setValueAtTime(-24, audioCtx.currentTime);
  masterCompressor.knee.setValueAtTime(30, audioCtx.currentTime);
  masterCompressor.ratio.setValueAtTime(12, audioCtx.currentTime);
  masterCompressor.attack.setValueAtTime(0.003, audioCtx.currentTime);
  masterCompressor.release.setValueAtTime(0.25, audioCtx.currentTime);

  masterGain = audioCtx.createGain();
  masterGain.gain.setValueAtTime(1.0, audioCtx.currentTime);

  masterCompressor.connect(masterGain);
  masterGain.connect(audioCtx.destination);
};

export const playSound = async (type, volume = 0.4) => {
  if (!AUDIO_URLS[type]) return;
  
  initAudio();
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  try {
    let buffer = audioBuffers.get(type);
    if (!buffer) {
      const response = await fetch(AUDIO_URLS[type]);
      const arrayBuffer = await response.arrayBuffer();
      buffer = await audioCtx.decodeAudioData(arrayBuffer);
      audioBuffers.set(type, buffer);
    }

    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    
    const nodeGain = audioCtx.createGain();
    // Clamp volume to safe ranges
    nodeGain.gain.setValueAtTime(Math.max(0, Math.min(2.0, volume)), audioCtx.currentTime);
    
    source.connect(nodeGain);
    nodeGain.connect(masterCompressor);
    
    source.start(0);
  } catch (e) {
    // Silent fallback to standard Audio element if WebAudio fails (e.g. invalid buffer)
    try {
      const audio = new Audio(AUDIO_URLS[type]);
      audio.volume = Math.max(0, Math.min(1, volume));
      audio.play().catch(() => {});
    } catch (err) {}
  }
};

/**
 * Pre-fetches and decodes common UI sounds to eliminate first-use lag.
 */
export const preloadCommonSounds = async (types = ['ui_hover', 'ui_select', 'click', 'view_change']) => {
  initAudio();
  const promises = types.map(t => {
    if (!AUDIO_URLS[t]) return Promise.resolve();
    return fetch(AUDIO_URLS[t])
      .then(r => r.arrayBuffer())
      .then(ab => audioCtx.decodeAudioData(ab))
      .then(buffer => audioBuffers.set(t, buffer))
      .catch(() => {});
  });
  return Promise.all(promises);
};

/**
 * Scale a status effect's numeric magnitude based on the caster's skill/ability level.
 * - eff: effect object from skill.statusEffects
 * - caster: unit object (should contain abilityLevel or abilityLevels map)
 * - skillId: id of the skill being applied (optional, will attempt to lookup caster.abilityLevels[skillId])
 *
 * Behavior:
 * - For effects with a numeric 'val', multiply by (1 + 0.1 * (abilityLevel - 1)).
 *   (Each extra ability level gives +10% to effect magnitude; tweakable.)
 * - Non-numeric vals are left untouched.
 * - Always returns a shallow-cloned effect object.
 */
export const getScaledEffect = (eff = {}, caster = {}, skillId = null) => {
  const out = { ...eff };
  try {
    // Determine ability level for the relevant skill
    let level = caster.abilityLevel || 1;
    if (skillId && caster.abilityLevels && typeof caster.abilityLevels[skillId] !== 'undefined') {
      level = caster.abilityLevels[skillId];
    }
    level = Math.max(1, Number(level) || 1);

    if (typeof out.val === 'number' && !isNaN(out.val)) {
      // scale factor: +10% per extra level above 1
      const scale = 1 + ((level - 1) * 0.10);
      out.val = out.val * scale;
    }
  } catch (e) {
    // Fail silently and return original effect copy
  }
  return out;
};

// Internal cache for franchise levels to speed up heavy sorting/calculations
let _franchiseLevelCache = { map: {}, timestamp: 0 };

const getFranchiseLevel = (franchise, characters) => {
  const now = Date.now();
  if (now - _franchiseLevelCache.timestamp > 100) { // Refresh cache every 100ms
    const map = {};
    for (const c of characters) {
      if (c.franchise) {
        // Rebalanced: count levels slightly differently to reward horizontal roster growth
        map[c.franchise] = (map[c.franchise] || 0) + (c.level || 1);
      }
    }
    _franchiseLevelCache = { map, timestamp: now };
  }
  return _franchiseLevelCache.map[franchise] || 0;
};

// Memoized Aura Upgrades (avoiding repeated localStorage reads)
let _auraUpgradeCache = { data: null, timestamp: 0 };
export let liveAuraUpgrades = null;
export const setLiveAuraUpgrades = (val) => { liveAuraUpgrades = val; };

export const getAuraUpgrades = () => {
  if (liveAuraUpgrades) return liveAuraUpgrades;
  const now = Date.now();
  if (!_auraUpgradeCache.data || now - _auraUpgradeCache.timestamp > 100) {
    try {
      const raw = localStorage.getItem('mugen_aura_upgrades');
      _auraUpgradeCache = {
        data: raw ? JSON.parse(raw) : {},
        timestamp: now
      };
    } catch (e) {
      console.warn('Failed to parse mugen_aura_upgrades from localStorage, falling back to empty object.', e);
      _auraUpgradeCache = { data: {}, timestamp: now };
    }
  }
  return _auraUpgradeCache.data || {};
};

export const calculateStat = (base, level, char, characters = [], statType = 'hp', auraUpgradesArg = null) => {
  if (base === undefined || base === null) return 0;

  // Normalize statType to accept both "magic def" and "magic_def" (and other underscore variants)
  const normalizedStat = String(statType).replace(/_/g, ' ').trim();

  // 1. Base + Refinement (use normalizedStat so refinements keyed as "magic def" are found)
  // BUFFED HP Refinement for longer battles
  const refinementBonus = (char.refinements?.[normalizedStat] || 0) * (normalizedStat === 'hp' ? 150 : normalizedStat === 'luck' ? 3 : 15);
  const currentBase = base + refinementBonus;

  // 2. Growth Curve: Exponentially steeper for massive endgame scaling
  const growthFactor = 1 + (Math.pow(level, 1.45) * 0.25);

  // 3. Growth Type Multipliers
  const growthType = char.growthType || 'Balanced';
  const growthMultipliers = {
    'Aggressive': { atk: 1.25, hp: 0.9, def: 0.85, speed: 1.1, 'magic atk': 1.15, 'magic def': 0.85, luck: 0.9 },
    'Defensive': { atk: 0.85, hp: 1.35, def: 1.25, speed: 0.75, 'magic atk': 0.8, 'magic def': 1.2, luck: 0.9 },
    'Balanced': { atk: 1.0, hp: 1.0, def: 1.0, speed: 1.0, 'magic atk': 1.0, 'magic def': 1.0, luck: 1.1 },
    'Swift': { atk: 0.9, hp: 0.8, def: 0.9, speed: 1.45, 'magic atk': 1.0, 'magic def': 0.9, luck: 1.3 }
  };
  const typeMult = growthMultipliers[growthType]?.[normalizedStat] || 1.0;

  // 4. Tier Bonus: Pull from centralized TIER_STATS
  const tierKey = String(char.tier || char.suggestedTier || 'C').trim().toUpperCase();
  const tierBonus = TIER_STATS[tierKey]?.multiplier || 1.0;

  // 5. Global Aura - Lookup key needs underscores (e.g. "magic_atk")
  const auraUpgrades = auraUpgradesArg || getAuraUpgrades();
  const auraKey = normalizedStat.replace(/\s+/g, '_');
  const globalAuraMult = 1 + ((auraUpgrades[auraKey] || 0) * 0.02);

  // 6. Enhanced Bond System v3.0 - Deep Progression
  // Base Scaling: 1.5% per level regardless of path (Buffed)
  const bondLvl = char.bondLevel || 1;
  let bondBonus = 1.0 + (bondLvl * 0.015);

  const rel = String(char.relationship || '').toLowerCase();
  const isAtk = normalizedStat.includes('atk');
  const isDef = normalizedStat.includes('def') || normalizedStat === 'hp';
  const isSpeed = normalizedStat === 'speed';

  // Comprehensive Path Milestones
  if (rel.includes('enemy')) {
    if (bondLvl >= 5 && isAtk) bondBonus += 0.10;
    if (bondLvl >= 15) { if (isAtk) bondBonus += 0.10; }
    if (bondLvl >= 30 && isAtk) bondBonus += 0.15;
    if (bondLvl >= 40 && isAtk) bondBonus += 0.20;
    if (bondLvl >= 50) bondBonus += 0.25; // Hatred's Peak
    if (bondLvl >= 60 && isAtk) bondBonus += 0.20;
    if (bondLvl >= 80) bondBonus += 0.15;
    if (bondLvl >= 90) bondBonus += 0.15;
  } else if (rel.includes('friend')) {
    if (bondLvl >= 5 && isDef) bondBonus += 0.15;
    if (bondLvl >= 20 && isDef) bondBonus += 0.10;
    if (bondLvl >= 30 && isDef) bondBonus += 0.15;
    if (bondLvl >= 40 && isDef) bondBonus += 0.20;
    if (bondLvl >= 50) bondBonus += 0.20; // True Loyalty
    if (bondLvl >= 70 && isDef) bondBonus += 0.15;
    if (bondLvl >= 90 && isDef) bondBonus += 0.20;
  } else if (rel.includes('romant')) {
    if (bondLvl >= 5) bondBonus += 0.08;
    if (bondLvl >= 25) bondBonus += 0.10;
    if (bondLvl >= 35) { if (isSpeed) bondBonus += 0.20; }
    if (bondLvl >= 40) bondBonus += 0.15;
    if (bondLvl >= 50) bondBonus *= 1.35; // Soul Resonance
    if (bondLvl >= 70) bondBonus += 0.10;
    if (bondLvl >= 90) bondBonus += 0.20;
  } else if (rel.includes('comrade')) {
    if (bondLvl >= 5) bondBonus += 0.10;
    if (bondLvl >= 25) bondBonus += 0.15;
    if (bondLvl >= 40) bondBonus += 0.20;
    if (bondLvl >= 50) bondBonus *= 1.25;
    if (bondLvl >= 60) bondBonus += 0.15;
    if (bondLvl >= 80) bondBonus += 0.15;
  }

  // Global "Ultimate Bond" Lvl 100: Doubled perks (simulated by multiplying current bonus)
  if (bondLvl >= 100) bondBonus *= 2.0;

  // 7. Optimized Franchise Synergy
  let franchiseBonus = 1.0;
  if (characters.length > 0 && char.franchise) {
    const combinedLevels = getFranchiseLevel(char.franchise, characters);
    franchiseBonus = 1 + (Math.floor(combinedLevels / 20) * 0.02);
  }

  // 8. Ascension: Multiplier for post-limit-break heroes (Infinite scaling)
  // +35% stats per ascension rank.
  const ascensionBonus = 1.0 + ((char.ascension || 0) * 0.35);

  // 10. Singularity Bonus: For endgame players
  const singularityBonus = 1 + ((auraUpgrades.singularity || 0) * 1.0);

  // 9. Duplicate Summon Bonus: small persistent percent bonus applied when pulling duplicates in gacha
  // stored as char.duplicateStatBonus (e.g., 0.005 for +0.5%)
  const duplicateBonus = 1 + (char.duplicateStatBonus || 0);



  // 11. Equipment: the replacement for the old cosmetic-collection stat grind.
  // Cosmetics are now purely visual; Weapon/Armor/Trinket gear is the readable,
  // fast-to-max stat lever. Returns a fractional %-bonus for this stat.
  const equipPct = getEquipBonusForStat(char, normalizedStat);

  // 12. SPECIAL build (Courier-exclusive): no-op multiplier of 1 for any
  // character without a `.special` allocation.
  const specialMult = getSpecialStatMult(char, normalizedStat);

  // SIMPLE, LEGIBLE MODEL: a clean base times an ADDITIVE sum of percent bonuses,
  // instead of a 12-way product. Every source reads as a plain "+X%" the player
  // can see and counter (debuffs subtract from the same pool). Cosmetic-collection
  // stacking is gone entirely.
  //   final = base * growth * growthType * tier * (1 + Σ percent-bonuses)
  const percentSum =
    (bondBonus - 1) +
    (ascensionBonus - 1) +
    (franchiseBonus - 1) +
    (globalAuraMult - 1) +
    (duplicateBonus - 1) +
    (singularityBonus - 1) +
    (specialMult - 1) +
    equipPct;

  return Math.floor(
    currentBase *
    growthFactor *
    typeMult *
    tierBonus *
    (1 + Math.max(-0.9, percentSum))
  );
};

// SPEED REBALANCE: raw speed grows exponentially with level (see growthFactor
// below, ~level^1.45) and can reach 70,000+ by level 100 on a top tier -- but
// every consumer of raw speed (gauge-gain caps, the evasion/crit speed terms)
// was tuned for values in the hundreds. Past roughly level 20 every build blew
// through those fixed caps identically, making speed stop differentiating
// characters for the rest of the game. getSpeedScore() log-compresses speed so
// it grows close to linearly instead, keeping every downstream formula in a
// sane, comparable range at any level. getGaugeGain() then measures a unit's
// turn-frequency RELATIVE to the average speed score of everyone currently in
// the fight (not against a fixed absolute number), so speed always meaningfully
// separates turn order regardless of what level/scale the battle is at -- there
// is no fixed threshold left to "outgrow."
export const getSpeedScore = (speed) => Math.log2(1 + Math.max(0, speed || 0));

export const getGaugeGain = (unitSpeed, allSpeeds = [], combatSpeedMult = 1) => {
  const score = getSpeedScore(unitSpeed);
  const scores = (allSpeeds || []).map(getSpeedScore).filter((s) => s > 0);
  const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : score || 1;
  const ratio = avg > 0 ? score / avg : 1;
  return Math.min(10, Math.max(1, 4 * ratio * (combatSpeedMult || 1)));
};

// Cache for expensive stat calculations
const _statCache = new Map();
const CACHE_DURATION = 100; // ms

export const calculateSubStat = (char, characters, type, skills = [], auraUpgrades = {}) => {
  const level = char.level || 1;
  const cacheKey = `${char.export_id}_${type}_${level}_${char.bondLevel}_${char.ascension}_${JSON.stringify(auraUpgrades)}`;
  const cached = _statCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.value;
  }

  // HP BASE MULTIPLIER: 4x increase to core health pools for endurance-based combat
  const hp = calculateStat(char.baseStats.hp, level, char, characters, 'hp', auraUpgrades) * 4;
  const atk = calculateStat(char.baseStats.atk, level, char, characters, 'atk', auraUpgrades);
  const def = calculateStat(char.baseStats.def, level, char, characters, 'def', auraUpgrades);
  const speed = calculateStat(char.baseStats.speed, level, char, characters, 'speed', auraUpgrades);
  const magicAtk = calculateStat(char.baseStats['magic atk'] || 0, level, char, characters, 'magic atk', auraUpgrades);
  const magicDef = calculateStat(char.baseStats['magic def'] || 0, level, char, characters, 'magic def', auraUpgrades);
  const luck = calculateStat(char.baseStats.luck || 10, level, char, characters, 'luck', auraUpgrades);

  let result = 0;
  switch(type) {
    case 'crit_rate':
      // Diminishing returns: Base 5% + (Luck contribution, max ~45% at infinite luck) + Level/Speed small bonus
      // Formula: (Luck / (Luck + 2000)) * 45
      const luckCrit = (luck / (luck + 2000)) * 45;
      // SPECIAL Perception: flat crit rate per point above baseline, independent
      // of the luck curve above -- gives PER its own clear identity in a build.
      const perCrit = char.special ? ((char.special.per ?? 1) - 1) * SPECIAL_PER_CRIT_PER_POINT : 0;
      // Speed's contribution uses the log-compressed score (see getSpeedScore)
      // instead of raw speed -- raw speed/3000 could add 20+ points by endgame
      // on its own, swamping luck's crit curve. The scored version stays modest
      // (roughly 3-10 points across the whole level range) so luck keeps its
      // identity as the main crit-rate stat.
      result = Number(Math.min(100, 5 + luckCrit + perCrit + (getSpeedScore(speed) * 0.6) + (level / 50)).toFixed(1));
      break;
    case 'crit_dmg':
      result = Number((150 + (atk / 400) + ((char.ascension || 0) * 25)).toFixed(1));
      break;
    case 'evasion':
      // Diminishing returns: Base 2% + (Luck contribution, max ~35% at infinite luck)
      // Formula: (Luck / (Luck + 2500)) * 35
      const luckDodge = (luck / (luck + 2500)) * 35;
      // Same rescale as crit_rate above: raw speed/2500 could exceed the 60%
      // cap on its own by endgame, making evasion identical (maxed) for every
      // high-level unit regardless of build. The scored version keeps speed a
      // real but secondary contributor, with luck still dominant.
      result = Number(Math.min(60, 2 + luckDodge + (getSpeedScore(speed) * 0.8)).toFixed(1));
      break;
    case 'pwr': {
      // Rebalanced power scaling (v5.0): readable numbers that grow with investment.
      //   Fresh starter  ~  a few thousand
      //   Level ~60      ~  low millions
      //   Fully maxed (Lv100 + Ascension + high Bond) ~ hundreds of billions
      // PWR is a display/advisory rating only; actual combat uses calculateStat.
      const skill1 = (skills || []).find(s => s.id === char.skillId) || { rarity: 'Common' };
      const skill2 = (skills || []).find(s => s.id === char.skillId2);
      const rarityPower = SKILL_RARITY_CONFIG[skill1.rarity || 'Common']?.powerMod || 1.0;
      const rarityPower2 = skill2 ? (SKILL_RARITY_CONFIG[skill2.rarity || 'Common']?.powerMod || 1.0) : 0;

      const blendedOffense = Math.max(atk, magicAtk);
      const blendedDefense = Math.max(def, magicDef);

      // Raw stat budget — sane weights (a fresh starter lands around 3-5k, not millions).
      const statBudget =
        (hp * 0.5) +
        (blendedOffense * 5) +
        (blendedDefense * 5) +
        (speed * 8) +
        (luck * 6);

      // Exponential level scaling: 1x at Lv1 -> ~3,200x at Lv100.
      const levelMult = Math.pow(1.085, (char.level || 1) - 1);

      // Bond: smooth ramp, ~1x at Bond 1 -> ~5x at Bond 100.
      const bond = char.bondLevel || 1;
      const bondMult = 1 + (bond - 1) * 0.015 + Math.pow(bond, 1.5) / 400;

      // Each Ascension roughly doubles power.
      const ascMult = Math.pow(2.0, char.ascension || 0);

      // Ability investment + skill rarity.
      const abilitySum = Object.values(char.abilityLevels || {}).reduce((s, lvl) => s + (lvl || 0), 0);
      const awakenSum = Object.values(char.abilityAwaken || {}).reduce((s, r) => s + (r || 0), 0);
      const abilityMult = 1 + (abilitySum * 0.02) + (awakenSum * 0.05) + ((rarityPower - 1) * 0.15) + (rarityPower2 ? (rarityPower2 - 1) * 0.1 : 0);

      // Equipment depth (replaces cosmetic-collection power). Averages the ATK/HP
      // gear %-bonus so PWR reflects gear investment without double-counting slots.
      const eqPct = (getEquipBonusForStat(char, 'atk') + getEquipBonusForStat(char, 'hp') + getEquipBonusForStat(char, 'def')) / 3;
      const equipMult = 1 + eqPct;

      result = Math.floor(statBudget * levelMult * bondMult * ascMult * abilityMult * equipMult);
      break;
    }
    case 'magic_atk':
      result = Number(magicAtk);
      break;
    case 'magic_def':
      result = Number(magicDef);
      break;
    default:
      result = 0;
  }

  // Cache the result
  _statCache.set(cacheKey, { value: result, timestamp: Date.now() });
  
  // Clean old cache entries periodically
  if (_statCache.size > 1000) {
    const now = Date.now();
    for (const [key, val] of _statCache.entries()) {
      if (now - val.timestamp > CACHE_DURATION * 10) {
        _statCache.delete(key);
      }
    }
  }

  return result;
};

export const getStatGain = (base) => Math.floor(base * 0.08);

// ---------------------------------------------------------------------------
// COMBAT DAMAGE CORE
// ---------------------------------------------------------------------------
// Reverted to the original FIXED-CONSTANT mitigation model. A brief experiment
// with ratio-based (offense-relative) mitigation made skills land near-full
// damage whenever a unit's offense exceeded the target's DEF (the common case,
// since enemy DEF budgets are low relative to leveled player offense) -- which
// let abilities one-shot everything and trivialized the game. The fixed model
// below is the tuned, shipped behavior: DEF == `constant` gives 50% mitigation.
// Skills use 4500, basic attacks use 1000 (their original values), preserved via
// the optional `constant` argument.
// Courier's "Field Experience" -- his own leveling system (see
// getSpecialLevelInfo above), separate from normal character XP/level.
// Ticks once per victory he's fielded in, alive or dead, regardless of mode.
export const incrementCourierFieldBattles = (setCharacters, combatants) => {
  if (typeof setCharacters !== 'function') return;
  const fielded = (combatants || []).some((c) => !c.isEnemy && c.name === 'Courier');
  if (!fielded) return;
  setCharacters((prev) => prev.map((c) => c.name === 'Courier' ? { ...c, courierFieldBattles: (c.courierFieldBattles || 0) + 1 } : c));
};

export const DEF_CONSTANT = 4500;

// Fraction of damage that gets through after defense mitigation.
export const computeMitigation = (defense, constant = DEF_CONSTANT) => {
  const d = Math.max(0, defense);
  const k = Math.max(1, constant);
  return k / (k + d); // portion of damage that LANDS
};

// Apply mitigation to a pre-mitigation damage number. Always leaves >= 1 chip.
export const applyMitigation = (rawDmg, defense, constant = DEF_CONSTANT) => {
  const dealt = rawDmg * computeMitigation(defense, constant);
  return Math.max(1, Math.floor(dealt));
};

// Signature abilities are gated ultimates (level 70 + high bond + a steep unlock
// cost) — they must clearly outperform generic Epics/Legendaries, never "pale"
// next to them. These multipliers are the signature premium, applied centrally
// in executeCombatSkill so every battle mode benefits identically.
export const SIGNATURE_BONUS = {
  DAMAGE: 1.45,      // +45% skill damage vs an equal-power non-signature
  HEAL: 1.4,         // +40% healing
  EFFECT_VAL: 1.3,   // +30% buff/shield/debuff magnitude
  CRIT_RATE: 0.2,    // +20% flat crit chance
  CRIT_DMG: 0.2,     // +20% crit damage
  PIERCE_FLOOR: 0.15 // signatures always ignore at least 15% of DEF
};

// Derives a searchable/browsable tag list for any skill (including signatures)
// from its mechanical data. Explicit `skill.tags` entries are merged in first.
// Used by the Abilities screen chips and the Squad Builder tag search.
export const getSkillTags = (skill) => {
  if (!skill) return [];
  const tags = new Set((skill.tags || []).map((t) => String(t).toUpperCase()));
  // Role / archetype
  if (skill.type === 'heal') tags.add('HEALER');
  if (skill.type === 'buff') tags.add('SUPPORT');
  if (skill.type === 'atk') tags.add(skill.damageType === 'magical' ? 'MAGICAL' : 'PHYSICAL');
  // Targeting
  if (skill.target === 'all_enemies') tags.add('AOE');
  if (skill.target === 'random_enemies') tags.add('MULTI-HIT');
  if (skill.target === 'single_enemy') tags.add('SINGLE-TARGET');
  if (skill.target === 'all_allies') tags.add('TEAM-WIDE');
  if (skill.target === 'lowest_ally') tags.add('RESCUE');
  if (skill.target === 'self') tags.add('SELF');
  // Tempo
  if ((skill.cooldown || 100) <= 50) tags.add('FAST');
  if (skill.type === 'atk' && (skill.power || 0) >= 3) tags.add('NUKE');
  // Scaling
  const scaleNames = { atk: 'ATK-SCALE', magic_atk: 'MAG-SCALE', def: 'DEF-SCALE', magic_def: 'MDEF-SCALE', speed: 'SPD-SCALE', hp: 'HP-SCALE', luck: 'LUCK-SCALE' };
  if (scaleNames[skill.scalingStat]) tags.add(scaleNames[skill.scalingStat]);
  // Status effects
  (skill.statusEffects || []).forEach((e) => {
    const map = {
      burn: 'BURN', poison: 'POISON', freeze: 'FREEZE', stun: 'STUN', static: 'STATIC',
      regen: 'REGEN', shield: 'SHIELD', cleanse: 'CLEANSE', aggro: 'TAUNT',
      buff_atk: 'ATK-UP', buff_def: 'DEF-UP', debuff_spd: 'SLOW', debuff_atk: 'ATK-DOWN', debuff_def: 'DEF-DOWN'
    };
    if (map[e.type]) tags.add(map[e.type]);
    if (['burn', 'poison', 'static'].includes(e.type)) tags.add('DOT');
    if (['freeze', 'stun', 'debuff_spd', 'aggro'].includes(e.type)) tags.add('CONTROL');
  });
  // Meta mechanics
  const m = skill.meta || {};
  if (m.guaranteed_crit) tags.add('CRIT');
  if (m.lifesteal || m.heal_on_hit) tags.add('LIFESTEAL');
  if (m.ignore_def) tags.add('DEF-PIERCE');
  if (m.break_shield || m.shield_detonate) tags.add('SHIELD-BREAK');
  if (m.shield_pierce) tags.add('SHIELD-PIERCE');
  if (m.shield_drain) tags.add('SHIELD-STEAL');
  if (m.grants_shield_on_kill) tags.add('SHIELD');
  if (m.stagger_bonus) tags.add('STAGGER');
  if (m.execute_below) tags.add('EXECUTE');
  if (m.mark) tags.add('EXPOSE');
  if (m.detonate) tags.add('DETONATE');
  if (m.steal_buff || m.copy_buff) tags.add('BUFF-STEAL');
  if (m.dispel_enemies || m.invert_buffs) tags.add('DISPEL');
  if (m.scales_missing_hp) tags.add('RAGE');
  if (m.bonus_per_debuff || m.bonus_vs_status) tags.add('PUNISHER');
  if (m.cleanse_team) tags.add('CLEANSE');
  if (m.extra_hits) tags.add('MULTI-HIT');
  if (m.crush) { tags.add('CRUSH'); tags.add('DEF-DOWN'); }
  if (m.wish_cycle) { tags.add('WISH'); tags.add('SUPPORT'); tags.add('AOE'); }
  if (Array.isArray(m.team_effects) && m.team_effects.some((e) => e.type === 'buff_elemdmg')) {
    tags.add('ELEM-BOOST'); tags.add('SUPPORT');
  }
  if (skill.signature) tags.add('SIGNATURE');
  return Array.from(tags);
};

export const getAbilityColor = (tags = []) => {
    if (tags.some(t => t.toLowerCase().includes('atk'))) return '#ff6b6b';
    if (tags.some(t => t.toLowerCase().includes('buff'))) return '#4ade80';
    if (tags.some(t => t.toLowerCase().includes('ice'))) return '#4fc3f7';
    if (tags.some(t => t.toLowerCase().includes('magic'))) return '#ba68c8';
    return '#94a3b8';
};

// Bond reward scaling helper: each existing bond level and character level increases subsequent bond gains.
// This creates compounding incentives to reward sticking with a character.
export const getBondMultiplier = (char = {}) => {
  const bondLvl = Number(char.bondLevel || 1);
  const charLvl = Number(char.level || 1);

  // Rebalanced Curve: Faster early game, steady mid game
  // Base multiplier increases significantly to make early interactions feel impactful
  const rankMult = 1.5 + (bondLvl * 0.12);

  // Level Scaling: +2% per character level to reward training
  const levelMult = 1 + (charLvl * 0.02);

  // Include Aura Sanctum "bond" upgrades if purchased (increases bond gains globally)
  let auraEffect = 1.0;
  try {
    const auraUpgrades = getAuraUpgrades();
    const bondAuraLevel = Number(auraUpgrades?.bond || 0);
    if (bondAuraLevel > 0) {
      // Buffed: +30% per aura level in sanctum
      auraEffect = 1 + (bondAuraLevel * 0.30);
    }
  } catch (e) {
    auraEffect = 1.0;
  }

  return rankMult * levelMult * auraEffect;
};

export const getLeaderSkill = (id) => LEADER_SKILLS.find(s => s.id === id) || LEADER_SKILLS[0];

export const applyLeaderBonus = (leaderChar, unit, squad = []) => {
  if (!leaderChar || !unit || unit.isEnemy) return;
  const skill = LEADER_SKILLS.find(s => s.id === leaderChar.leaderSkillId);
  if (!skill) return;

  unit.effects = unit.effects || [];
  (skill.squadEffects || []).forEach(e => unit.effects.push({ ...e }));
  if (skill.squadBurst) unit.burst = Math.min(100, (unit.burst || 0) + skill.squadBurst);

  const matchesElement = unit.element === skill.element;
  const lifestealBonus = matchesElement && skill.scopedLifesteal ? skill.scopedLifesteal : skill.squadLifesteal || 0;
  if (lifestealBonus) unit.lifesteal = (unit.lifesteal || 0) + lifestealBonus;
  if (matchesElement) (skill.scopedEffects || []).forEach(e => unit.effects.push({ ...e }));
  if (skill.reviveOnce) unit._leaderRevive = true;
};

/**
 * Global Power/Numeric Formatter
 * Used for high-magnitude endgame numbers (80M, 1B, etc)
 */
export const formatPower = (val) => {
  if (val >= 1000000000) return (val / 1000000000).toFixed(2) + 'B';
  if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
  if (val >= 1000) return Math.floor(val / 1000) + 'K';
  return Math.floor(val).toString();
};

export const getTierEfficiency = (tier) => {
  const t = (tier || 'C').trim().toUpperCase();
  const map = {
    'SS': 1.15, 'S+': 1.12, 'S': 1.10, 'S-': 1.08,
    'A+': 1.06, 'A': 1.05, 'A-': 1.04,
    'B+': 1.03, 'B': 1.02, 'B-': 1.01,
    'C+': 1.00, 'C': 1.00, 'C-': 0.98,
    'D+': 0.96, 'D': 0.95, 'D-': 0.94,
    'E': 0.90, 'F': 0.85
  };
  return map[t] || 1.0;
};

/**
 * generateAI(prompt, system) -> string
 * Wrapper around window.websim.chat.completions.create with sensible fallbacks.
 * Returns the generated content string or throws if something truly unexpected occurs.
 */
function hashCode(s = '') {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

/**
 * Advanced Character Interaction Engine
 * Overhauled to handle structured AI responses, memory, and emotional nuance.
 */
export const generateAI = async (userPrompt, charContext = {}, history = [], isStructured = false) => {
  const low = (s='') => (s||'').toLowerCase();
  
  // Extract context pieces
  const { name, role, franchise, relationship, bondLevel, mood } = charContext;
  const rel = (relationship || 'Neutral').toLowerCase();
  const bondName = getBondRankName(bondLevel || 1, relationship);

  // Character Personality Profile (Heuristics based on franchise/role)
  let trait = "Balanced";
  if (low(franchise).includes('final fantasy')) trait = "Stoic but determined";
  if (low(franchise).includes('naruto')) trait = "Energetic and vocal";
  if (low(franchise).includes('genshin')) trait = "Polite and high-fantasy";
  if (low(franchise).includes('street fighter')) trait = "Action-oriented and disciplined";
  if (low(role).includes('villain') || rel.includes('enemy')) trait = "Arrogant, condescending, or cold";

  const systemInstruction = `
    You are ${name} (${role}) from the ${franchise} series.
    You have been pulled from your home world and summoned into the Mugen Training Grounds by the User, who is your "Summoner".
    
    CURRENT CONTEXT:
    - USER ROLE: Your Summoner (Manifested you here).
    - YOUR RELATIONSHIP: ${relationship} (${bondName}).
    - YOUR MOOD: ${mood}% (Higher is better/happier).
    - PERSONALITY TRAIT: ${trait}.

    STRICT DIALOGUE GUIDELINES:
    1. Stay perfectly in-character based on lore. Address user as 'Summoner', 'Trainer', 'Master', or lore nickname.
    2. Respond with 1-3 evocative, character-appropriate sentences.
    3. Reflect your current path and mood. Low mood makes you cold or irritable. High mood makes you more receptive or affectionate.
    4. Provide an 'expression' tag and a brief bracketed physical gesture.
    5. Never mention being AI or large language models.

    FORMAT: Output ONLY a JSON object.
    {
      "text": "Spoken dialogue.",
      "expression": "Expression Tag",
      "action": "[Bracketed gesture]",
      "moodDelta": <number between -5 and 5 indicating how this specific interaction changed your internal mood>
    }
  `;

  try {
    if (typeof window !== 'undefined' && window.websim?.chat?.completions?.create) {
      // Build message stack with short history
      const messages = [
        { role: "system", content: systemInstruction },
        ...history.slice(-3).map(h => ({ role: "assistant", content: JSON.stringify({ text: h }) })),
        { role: "user", content: userPrompt }
      ];

      const completion = await window.websim.chat.completions.create({
        messages,
        json: true
      });

      let data = completion.content;
      if (typeof data === 'string') {
          try {
              // Cleanup markdown fences if present
              const clean = data.replace(/```(?:json)?\n?([\s\S]*?)\n?```/g, '$1').trim();
              data = JSON.parse(clean);
          } catch(e) { 
              // Fallback to unstructured if JSON fails
              return { text: data.split('\n')[0].replace(/[{}"]/g, ''), expression: 'Neutral' };
          }
      }
      
      return {
          text: (data.text || '').replace(/^[\s"'`]+|[\s"'`]+$/g, '').trim(),
          expression: data.expression || 'Neutral',
          action: data.action || '',
          moodDelta: Number(data.moodDelta || 0)
      };
    }
  } catch (err) {
    console.warn('generateAI overhaul failed:', err);
  }

  // Robust deterministic fallback
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const romanticPool = ["I... I really like spending time with you.", "Your presence makes this city feel different.", "Don't look at me like that, it's embarrassing."];
  const friendPool = ["Great work today, partner!", "Always a pleasure to see you around.", "Let's grab a drink later, on me."];
  const hostilePool = ["Hmph. Don't think we're friends.", "Make it quick. I have things to do.", "One day, I will be the one standing over you."];
  
  let pool = friendPool;
  if (rel.includes('romant')) pool = romanticPool;
  if (rel.includes('enemy')) pool = hostilePool;
  
  return { text: pick(pool), expression: 'Neutral' };
};

// New Enemy Stat Generation Logic
export const getEnemyStatsFromCP = (cp, type = 'balanced') => {
    // Scaling Archetypes: Adjust stats relative to a balanced baseline
    // boss: High HP, moderate defenses to prevent one-shots
    // minion: weaker all around
    // glass: High ATK, Low HP/Def
    // tank: High Def/HP, Low ATK
    // Rebalanced: bosses are less of an HP sponge (faster, more dynamic fights)
    // but hit notably harder so they stay threatening. Minions and tanks now
    // contribute real offense instead of being passive damage soaks.
    // Community tuning: battles were ending in ~3 seconds and mid-game walls were
    // too lethal. Enemy HP is raised (~1.8x) so fights breathe and stay winnable
    // long enough to matter, while enemy ATK is lowered (~0.6x) so they stop
    // one-shotting squads. Net effect: longer, more survivable, more strategic fights.
    const scaling = {
        boss: { hp: 22.0, atk: 0.62, def: 1.05, spd: 0.9 },
        minion: { hp: 10.5, atk: 0.4, def: 0.78, spd: 0.85 },
        elite: { hp: 15.0, atk: 0.58, def: 0.92, spd: 0.95 },
        glass: { hp: 8.0, atk: 0.85, def: 0.4, spd: 1.25 },
        tank: { hp: 23.0, atk: 0.32, def: 1.55, spd: 0.55 },
        balanced: { hp: 12.5, atk: 0.65, def: 0.95, spd: 1.0 }
    }[type] || { hp: 11.0, atk: 0.62, def: 0.95, spd: 1.0 };

    // Baseline Distribution (Target CP -> Stats)
    // Readjusted for high-sustain combat: HP budget significantly increased
    // We adjust weights here to make HP/Defense higher for enemies to prevent being one-shot by high PWR squads
    // Balanced enemy generation for the 1B CP era
    const baselineHP = (cp * 0.48) / 0.15; 
    const baselineAtk = (cp * 0.22) / 3.5;
    const baselineDef = (cp * 0.20) / 3.5; 
    // Speed curve is non-linear to prevent game breaking speed at high CP
    const baselineSpd = 110 + Math.pow(cp, 0.49); 

    // Dynamic Ascension Rank for Enemies based on CP magnitude
    // Rank 1 starts at 80M power (roughly high-tier character level)
    let ascension = 0;
    if (cp >= 1000000000000) ascension = 7;      // 1T+
    else if (cp >= 250000000000) ascension = 6;  // 250B+
    else if (cp >= 50000000000) ascension = 5;   // 50B+
    else if (cp >= 10000000000) ascension = 4;   // 10B+
    else if (cp >= 2500000000) ascension = 3;    // 2.5B+
    else if (cp >= 500000000) ascension = 2;     // 500M+
    else if (cp >= 80000000) ascension = 1;      // 80M+

    return {
        maxHp: Math.max(200, Math.floor(baselineHP * scaling.hp)),
        hp: Math.max(200, Math.floor(baselineHP * scaling.hp)),
        atk: Math.max(15, Math.floor(baselineAtk * scaling.atk)),
        magicAtk: Math.max(15, Math.floor(baselineAtk * scaling.atk)),
        def: Math.max(10, Math.floor(baselineDef * scaling.def)),
        magicDef: Math.max(10, Math.floor(baselineDef * scaling.def)),
        speed: Math.max(1, Math.floor(baselineSpd * scaling.spd)),
        ascension
    };
};