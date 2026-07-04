import { AUDIO_URLS, PATH_ADJECTIVES, PATH_TITLES, TIER_STATS, SKILL_TYPES, SKILL_RARITY_CONFIG, LEADER_SKILLS, COSMETICS } from './constants.js';

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



  // 11. Cosmetic Collection Bonuses (All Unlocked)
  // All unlocked cosmetics provide their stat bonuses, not just equipped ones
  let cosmeticCollectionMult = 1.0;
  
  // Apply all unlocked aura bonuses
  const unlockedAuras = char.unlockedCosmetics?.auras || ['none'];
  unlockedAuras.forEach(auraId => {
    const auraObj = COSMETICS.AURAS.find(c => c.id === auraId);
    if (auraObj && auraObj.multiplier > 1.0) {
      cosmeticCollectionMult *= auraObj.multiplier;
    }
  });

  // Apply all unlocked border bonuses
  const unlockedBorders = char.unlockedCosmetics?.borders || ['default'];
  unlockedBorders.forEach(borderId => {
    const borderObj = COSMETICS.BORDERS.find(c => c.id === borderId);
    if (borderObj && borderObj.multiplier > 1.0) {
      cosmeticCollectionMult *= borderObj.multiplier;
    }
  });

  // Apply all unlocked title bonuses
  const unlockedTitles = char.unlockedCosmetics?.titles || ['none'];
  unlockedTitles.forEach(titleId => {
    const titleObj = COSMETICS.TITLES.find(c => c.id === titleId);
    if (titleObj && titleObj.multiplier > 1.0) {
      cosmeticCollectionMult *= titleObj.multiplier;
    }
  });

  return Math.floor(
    currentBase * 
    growthFactor * 
    typeMult * 
    tierBonus * 
    globalAuraMult * 
    bondBonus * 
    franchiseBonus * 
    ascensionBonus * 
    duplicateBonus *
    cosmeticCollectionMult *
    singularityBonus
  );
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
      result = Number(Math.min(100, 5 + luckCrit + (speed / 3000) + (level / 50)).toFixed(1));
      break;
    case 'crit_dmg':
      result = Number((150 + (atk / 400) + ((char.ascension || 0) * 25)).toFixed(1));
      break;
    case 'evasion':
      // Diminishing returns: Base 2% + (Luck contribution, max ~35% at infinite luck)
      // Formula: (Luck / (Luck + 2500)) * 35
      const luckDodge = (luck / (luck + 2500)) * 35;
      result = Number(Math.min(60, 2 + luckDodge + (speed / 2500)).toFixed(1));
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

      // Cosmetic collection depth.
      const auras = (char.unlockedCosmetics?.auras || ['none']).length;
      const borders = (char.unlockedCosmetics?.borders || ['default']).length;
      const cosmeticMult = 1 + ((auras - 1) * 0.02) + ((borders - 1) * 0.03);

      result = Math.floor(statBudget * levelMult * bondMult * ascMult * abilityMult * cosmeticMult);
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