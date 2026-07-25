import { Fragment, jsxDEV } from "react/jsx-dev-runtime";
import React, { useState } from "react";
import {
  Heart,
  Sword,
  Shield,
  Zap,
  Sparkles,
  LayoutGrid,
  Package,
  Book,
  Star,
  Gem,
  Monitor,
  Database,
  Info,
  X,
  Hammer,
  Activity,
  Clover,
  Crown
} from "lucide-react";
import { playSound } from "../utils.js";
import { isMobile } from "./ViewShared.js";
import { ExchangeTab } from "./shop/ExchangeTab.js";
import { SuppliesTab } from "./shop/SuppliesTab.js";
import { FacilityTab } from "./shop/FacilityTab.js";
import { EliteTab } from "./shop/EliteTab.js";
import { CraftingTab } from "./shop/CraftingTab.js";
import { CookingTab } from "./shop/CookingTab.js";
import { AuraTab } from "./shop/AuraTab.js";

const ShopView = ({
  credits,
  setCredits,
  gems,
  setGems,
  aura,
  setAura,
  essence,
  setEssence,
  materials,
  setMaterials,
  addToInventory,
  setStamina,
  maxStamina,
  createFloatingText,
  characters,
  unlockedIds,
  setUnlockedIds,
  unlockedFeatures,
  setUnlockedFeatures,
  totalAccountLevel,
  auraUpgrades,
  setAuraUpgrades,
  setShards,
  setCharacters,
  items,
  triggerVisualEffect,
  inventory = {}
}) => {
  // Fixed a live bug: triggerVisualEffect was called at 3 purchase sites
  // (FORGE AURA, GEM HARVEST, singularity link) but was never actually passed
  // as a prop -- every one of those buttons threw a ReferenceError mid-click,
  // silently skipping whatever ran after the throw in that handler.
  const safeTriggerVisualEffect = typeof triggerVisualEffect === "function" ? triggerVisualEffect : () => {};
  const [isSummoning, setIsSummoning] = useState(false);
  const [summonResult, setSummonResult] = useState(null);
  const [autorollActive, setAutorollActive] = useState(false);
  const [rollsRemaining, setRollsRemaining] = useState(0);
  const [activeTab, setActiveTab] = useState("supplies");
  const [gambleResult, setGambleResult] = useState(null);
  const isFeatureUnlocked = (f) => unlockedFeatures.includes(f);
  const summonHero = () => {
    const ROLL_COST = 1500;
    if (credits < ROLL_COST) {
      createFloatingText(`Not enough credits! Need $${ROLL_COST}`, true);
      return;
    }
    setCredits((c) => c - ROLL_COST);
    if (!characters || characters.length === 0) {
      createFloatingText("No characters available.", true);
      return;
    }
    const pool = characters.slice();
    const pick = pool[Math.floor(Math.random() * pool.length)];
    const isNew = !unlockedIds.includes(pick.export_id);
    if (isNew) {
      setUnlockedIds((prev) => Array.from(/* @__PURE__ */ new Set([...prev || [], pick.export_id])));
      setCharacters((prev) => {
        const next = prev.slice();
        const idx = next.findIndex((c) => String(c.export_id) === String(pick.export_id));
        if (idx !== -1) next[idx] = { ...next[idx], pulls: (next[idx].pulls || 0) + 1 };
        return next;
      });
    } else {
      setCharacters((prev) => {
        const next = prev.slice();
        const idx = next.findIndex((c) => String(c.export_id) === String(pick.export_id));
        if (idx !== -1) {
          next[idx] = {
            ...next[idx],
            pulls: (next[idx].pulls || 0) + 1,
            duplicateStatBonus: (next[idx].duplicateStatBonus || 0) + 5e-3
          };
        }
        return next;
      });
    }
    setSummonResult({ ...pick, isNew });
    setIsSummoning(true);
    createFloatingText(isNew ? `New Hero: ${pick.name}!` : `Duplicate: ${pick.name}`, false);
  };
  const startAutoRolls = (count = 10) => {
    if (autorollActive) {
      setAutorollActive(false);
      setRollsRemaining(0);
      return;
    }
    const affordable = Math.floor(credits / 1500);
    const maxRolls = Math.min(count, affordable);
    if (maxRolls <= 0) {
      createFloatingText("Not enough credits for autoroll", true);
      return;
    }
    setAutorollActive(true);
    setRollsRemaining(maxRolls);
    const intervalId = setInterval(() => {
      setRollsRemaining((prev) => {
        const next = (prev || 0) - 1;
        summonHero();
        if (next <= 0) {
          clearInterval(intervalId);
          setAutorollActive(false);
          return 0;
        }
        return next;
      });
    }, 600);
  };
  const confirmSummon = () => {
    if (!summonResult) {
      setIsSummoning(false);
      return;
    }
    setUnlockedIds((prev) => Array.from(/* @__PURE__ */ new Set([...prev || [], summonResult.export_id])));
    setCharacters((prev) => {
      const next = prev.slice();
      const idx = next.findIndex((c) => String(c.export_id) === String(summonResult.export_id));
      if (idx !== -1) next[idx] = { ...next[idx], pulls: (next[idx].pulls || 0) + 1 };
      return next;
    });
    createFloatingText(`${summonResult.name} added to roster`, false, "#4ade80");
    setIsSummoning(false);
    setSummonResult(null);
  };
  const getDailyDeals = () => {
    const hour = (/* @__PURE__ */ new Date()).getHours();
    const itemIds = Object.keys(items || {});
    if (!itemIds.length) return [];
    const seed1 = hour * 7 % itemIds.length;
    const seed2 = (hour * 13 + 3) % itemIds.length;
    const seed3 = (hour * 19 + 7) % itemIds.length;
    return [itemIds[seed1], itemIds[seed2], itemIds[seed3]].map((id) => {
      const item = items[id];
      if (!item) return null;
      const discount = 0.2;
      const basePrice = item.basePrice || 1e3;
      return { ...item, discount, basePrice, discountedPrice: Math.floor(basePrice * (1 - discount)) };
    }).filter(Boolean);
  };
  const dailyDeals = getDailyDeals();
  const unlockFeature = (f, cost, type = "credits", materialsReq = 0) => {
    if (type === "credits" && credits < cost) {
      createFloatingText(`Need $${cost}`, true);
      return;
    }
    if (materials < materialsReq) {
      createFloatingText(`Need ${materialsReq} Materials`, true);
      return;
    }
    if (type === "gems" && gems < cost) {
      createFloatingText(`Need ${cost} Gems`, true);
      return;
    }
    if (type === "credits") setCredits((c) => c - cost);
    else setGems((g) => g - cost);
    setUnlockedFeatures((prev) => [...prev, f]);
    playSound("levelUp");
    createFloatingText("FEATURE UNLOCKED!", false, "#a855f7");
  };
  const [dealSeed] = useState(Math.floor(Date.now() / 36e5));
  const CRAFTING_RECIPES = [
    { id: "c_stamina_1", output: "stamina_small", qty: 1, cost: { materials: 2500, credits: 25e3 }, name: "Recycled Battery", desc: "Convert materials into basic energy." },
    { id: "c_xp_1", output: "xp_scroll", qty: 1, cost: { materials: 1e4, credits: 15e4 }, name: "Data Chip", desc: "Forge a tactical manual from salvaged parts." },
    { id: "c_voucher_1", output: "summon_voucher", qty: 1, cost: { materials: 5e4, essence: 250, credits: 1e6 }, name: "Gacha Token", desc: "Improvised bypass for the dimensional portal." },
    { id: "c_bond_1", output: "bond_gift", qty: 1, cost: { materials: 25e3, essence: 150 }, name: "Hand-crafted Charm", desc: "A sentimental gift made from polished materials." },
    { id: "c_gems_1", output: "gems", qty: 500, cost: { materials: 1e5, essence: 1e3 }, name: "Gem Synthesis X", desc: "Transmute massive materials into dimensional gems." },
    { id: "c_stamina_2", output: "stamina_large", qty: 1, cost: { materials: 15e3, credits: 1e5, essence: 50 }, name: "Heavy Cell", desc: "A high-capacity energy core." },
    { id: "c_aura_core", output: "aura_fragment", qty: 5, cost: { materials: 5e4, essence: 300 }, name: "Aura Core", desc: "A dense cluster of materials infused with raw essence." },
    { id: "c_bond_2", output: "bond_gift_rare", qty: 1, cost: { materials: 1e5, essence: 500 }, name: "Gilded Relic", desc: "An intricate masterpiece of materials and soul." },
    { id: "c_sell_materials", output: "credits", qty: 1e6, cost: { materials: 5e3 }, name: "Bulk Materials Sale", desc: "Sell massive bulk materials for credits." },
    { id: "c_lucky_coin", output: "lucky_coin", qty: 1, cost: { materials: 25e4, essence: 1500 }, name: "Forged Luck", desc: "A counterfeit lucky charm." },
    { id: "c_ultra_xp", output: "xp_ultra_tome", qty: 1, cost: { materials: 5e5, essence: 2500 }, name: "Transcendental Text", desc: "Powerful training data salvaged from the core." },
    { id: "c_legend_bond", output: "bond_gift_legendary", qty: 1, cost: { materials: 1e6, essence: 5e3 }, name: "Nova Crystal", desc: "An artifact of pure soul resonance." },
    { id: "c_void_stamina", output: "void_capsule", qty: 1, cost: { materials: 25e5, essence: 1e4, gems: 5e3 }, name: "Void Infusion", desc: "Forge a permanent stamina capacitor using high-end energy." },
    { id: "c_grand_tome", output: "xp_grand_tome", qty: 1, cost: { aura: 2500, gems: 1e4 }, name: "Series Manifest", desc: "Transmute pure aura and gems into massive XP stores." },
    { id: "c_eternal_spark", output: "bond_eternal_crystal", qty: 1, cost: { aura: 5e3, gems: 2e4, essence: 15e3 }, name: "Unity Engine", desc: "The ultimate bond tool. Extremely costly but definitive." },
    { id: "c_multicore", output: "multiverse_core", qty: 1, cost: { materials: 5e6, essence: 25e3, credits: 1e8 }, name: "Final Reality Core", desc: "The ultimate endgame craft. Requires god-tier resources." }
  ];
  const handleCraft = (recipe, count = 1) => {
    const totalCost = {
      materials: (recipe.cost.materials || 0) * count,
      credits: (recipe.cost.credits || 0) * count,
      essence: (recipe.cost.essence || 0) * count,
      gems: (recipe.cost.gems || 0) * count
    };
    if (totalCost.materials && materials < totalCost.materials) {
      createFloatingText(`Need ${totalCost.materials - materials} more Materials`, true);
      return;
    }
    if (totalCost.credits && credits < totalCost.credits) {
      createFloatingText(`Need $${(totalCost.credits - credits).toLocaleString()} more`, true);
      return;
    }
    if (totalCost.essence && essence < totalCost.essence) {
      createFloatingText(`Need ${totalCost.essence - essence} more Essence`, true);
      return;
    }
    if (totalCost.gems && gems < totalCost.gems) {
      createFloatingText(`Need ${totalCost.gems - gems} more Gems`, true);
      return;
    }
    if (totalCost.materials) setMaterials((s) => s - totalCost.materials);
    if (totalCost.credits) setCredits((c) => c - totalCost.credits);
    if (totalCost.essence) setEssence((e) => e - totalCost.essence);
    if (totalCost.gems) setGems((g) => g - totalCost.gems);
    if (recipe.output === "gems") {
      setGems((g) => g + (recipe.qty || 1) * count);
    } else if (recipe.output === "credits") {
      setCredits((c) => c + (recipe.qty || 1) * count);
    } else {
      addToInventory(recipe.output, (recipe.qty || 1) * count);
    }
    playSound("craft");
    const name = count > 1 ? `${count}x ${recipe.name}` : recipe.name;
    createFloatingText(`Crafted ${name}!`, false, "#4ade80");
  };
  const calculateMaxCraft = (recipe) => {
    let max = 9999;
    if (recipe.cost.materials) max = Math.min(max, Math.floor(materials / recipe.cost.materials));
    if (recipe.cost.credits) max = Math.min(max, Math.floor(credits / recipe.cost.credits));
    if (recipe.cost.essence) max = Math.min(max, Math.floor(essence / recipe.cost.essence));
    if (recipe.cost.gems) max = Math.min(max, Math.floor(gems / recipe.cost.gems));
    return max;
  };
  // AURA SANCTUM QoL: buying resonance levels one click per level was the
  // exact "too many clicks" complaint -- three fixes:
  // 1) upgradeAuraBulk: ×5/×10/MAX buttons per stat -- one state update + one
  //    sound/toast for the whole batch instead of dozens of individual clicks.
  // 2) upgradeAuraAll: a single "MAX ALL" button that spends the WHOLE aura
  //    wallet across every track in one click, always buying whichever
  //    stat's NEXT level is currently cheapest (naturally round-robins evenly
  //    across all 11 tracks instead of dumping everything into one).
  // 3) affordableAuraLevels: a live "+N" preview on the MAX button so you see
  //    what a click will actually buy before you click it.
  const AURA_STAT_LIST = ["atk", "def", "hp", "speed", "magic_atk", "magic_def", "luck", "xp", "stamina", "vault", "bond"];
  const auraLevelCost = (count) => 5 + count * 5;
  const affordableAuraLevels = (stat, budget) => {
    let lvl = auraUpgrades[stat] || 0;
    let spent = 0;
    let bought = 0;
    while (true) {
      const c = auraLevelCost(lvl);
      if (spent + c > budget) break;
      spent += c;
      lvl++;
      bought++;
    }
    return { bought, spent };
  };
  const upgradeAuraBulk = (stat, times) => {
    const { bought } = affordableAuraLevels(stat, aura);
    const capped = Math.min(bought, times);
    if (capped <= 0) {
      createFloatingText(`Need ${auraLevelCost(auraUpgrades[stat] || 0)} Aura`, true);
      return;
    }
    let lvl = auraUpgrades[stat] || 0;
    let spent = 0;
    for (let i = 0; i < capped; i++) { spent += auraLevelCost(lvl); lvl++; }
    setAura((a) => a - spent);
    setAuraUpgrades((p) => ({ ...p, [stat]: lvl }));
    createFloatingText(`+${capped} RESONANCE!`, false, "#a855f7");
    playSound("upgrade");
  };
  const upgradeAuraAll = () => {
    let budget = aura;
    const levels = { ...auraUpgrades };
    let totalBought = 0;
    let guard = 0;
    while (guard++ < 5000) {
      let cheapestStat = null;
      let cheapestCost = Infinity;
      AURA_STAT_LIST.forEach((stat) => {
        const c = auraLevelCost(levels[stat] || 0);
        if (c < cheapestCost) { cheapestCost = c; cheapestStat = stat; }
      });
      if (!cheapestStat || cheapestCost > budget) break;
      budget -= cheapestCost;
      levels[cheapestStat] = (levels[cheapestStat] || 0) + 1;
      totalBought++;
    }
    if (totalBought === 0) {
      createFloatingText(`Need ${auraLevelCost(0)} Aura`, true);
      return;
    }
    setAura(budget);
    setAuraUpgrades(levels);
    createFloatingText(`+${totalBought} RESONANCE LEVELS ACROSS THE SANCTUM!`, false, "#a855f7");
    playSound("upgrade");
  };
  const COOKING_RECIPES = [
    { id: "cook_r_pepper", output: "cook_pepper_stew", qty: 1, cost: { materials: 9e4, essence: 350 }, name: "Spicy Pepper Stew", desc: "A dish that fights back. Fire heroes eat it like candy." },
    { id: "cook_r_melon", output: "cook_melon_salad", qty: 1, cost: { materials: 9e4, essence: 350 }, name: "Chilled Melon Salad", desc: "Sliced cold and served fast -- a dockside favorite." },
    { id: "cook_r_waffles", output: "cook_windy_waffles", qty: 1, cost: { materials: 9e4, essence: 350 }, name: "Windy Waffles", desc: "Light, airy, and gone in three bites." },
    { id: "cook_r_honey", output: "cook_honey_tart", qty: 1, cost: { materials: 9e4, essence: 350 }, name: "Honey Glow Tart", desc: "Golden and glowing, it hums faintly in the right hands." },
    { id: "cook_r_sausage", output: "cook_blackened_sausage", qty: 1, cost: { materials: 9e4, essence: 350 }, name: "Blackened Sausages", desc: "Charred past the point most would call it done." },
    { id: "cook_r_pretzel", output: "cook_trail_pretzel", qty: 1, cost: { materials: 9e4, essence: 350 }, name: "Trail Pretzel", desc: "No element, no gimmick -- just hits the spot." },
    { id: "cook_r_whiskey", output: "cook_whiskey_toast", qty: 1, cost: { materials: 6e4, essence: 350 }, name: "Aged Whiskey Toast", desc: "One glass, raised to the crew." },
    { id: "cook_r_wine", output: "cook_wine_reserve", qty: 1, cost: { materials: 18e4, essence: 1100, gems: 150 }, name: "Vintage Wine Reserve", desc: "Cellared long before the rift." },
    { id: "cook_r_sushi", output: "cook_sushi_platter", qty: 1, cost: { materials: 15e4, essence: 900, credits: 3e5 }, name: "Chef's Sushi Platter", desc: "A meal shared is a bond formed." },
    { id: "cook_r_feast", output: "cook_hearty_feast", qty: 1, cost: { materials: 22e4, essence: 1400, credits: 6e5 }, name: "Hearty Feast", desc: "Nobody leaves this table hungry." },
    { id: "cook_r_banquet", output: "cook_grand_banquet", qty: 1, cost: { materials: 12e5, essence: 9e3, credits: 15e6, gems: 800 }, name: "The Grand Banquet", desc: "Every dish the kitchen knows how to make, all at once." }
  ];
  const GAMBLE_COOK_COST = { materials: 3e4, essence: 200, credits: 5e4 };
  const GAMBLE_COOK_POOL = [
    { output: "cook_pepper_stew", weight: 15 },
    { output: "cook_melon_salad", weight: 15 },
    { output: "cook_windy_waffles", weight: 15 },
    { output: "cook_honey_tart", weight: 15 },
    { output: "cook_blackened_sausage", weight: 15 },
    { output: "cook_trail_pretzel", weight: 15 },
    { output: "cook_sushi_platter", weight: 6 },
    { output: "cook_whiskey_toast", weight: 6 },
    { output: "cook_wine_reserve", weight: 3 },
    { output: "cook_hearty_feast", weight: 3 },
    { output: "cook_grand_banquet", weight: 1 }
  ];
  const canAffordGamble = materials >= GAMBLE_COOK_COST.materials && essence >= GAMBLE_COOK_COST.essence && credits >= GAMBLE_COOK_COST.credits;
  const handleGambleCook = () => {
    if (!canAffordGamble) {
      createFloatingText("Not enough resources to cook", true);
      return;
    }
    setMaterials((m) => m - GAMBLE_COOK_COST.materials);
    setEssence((e) => e - GAMBLE_COOK_COST.essence);
    setCredits((c) => c - GAMBLE_COOK_COST.credits);
    const totalWeight = GAMBLE_COOK_POOL.reduce((sum, e) => sum + e.weight, 0);
    let roll = Math.random() * totalWeight;
    let picked = GAMBLE_COOK_POOL[0];
    for (const entry of GAMBLE_COOK_POOL) {
      if (roll < entry.weight) { picked = entry; break; }
      roll -= entry.weight;
    }
    addToInventory(picked.output, 1);
    const outputItem = items[picked.output] || { name: picked.output };
    setGambleResult(outputItem);
    playSound("craft");
    if (picked.output === "cook_grand_banquet") playSound("jackpot");
    createFloatingText(`Cooked up: ${outputItem.name}!`, false, "#4ade80");
  };
  return /* @__PURE__ */ jsxDEV("div", { className: "shop-view-wrapper animate-fadeIn", style: { padding: "10px 0" }, children: [
    isSummoning && /* @__PURE__ */ jsxDEV("div", { className: "summoning-overlay", children: !summonResult ? /* @__PURE__ */ jsxDEV(Fragment, { children: [
      /* @__PURE__ */ jsxDEV("div", { className: "summoning-circle", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "summon-energy" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 2747,
          columnNumber: 17
        }),
        /* @__PURE__ */ jsxDEV(Sparkles, { size: 80, color: "var(--primary)" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 2748,
          columnNumber: 17
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 2746,
        columnNumber: 15
      }),
      /* @__PURE__ */ jsxDEV("h2", { style: { marginTop: 40, letterSpacing: 4 }, className: "animate-pulse", children: "STABILIZING DIMENSIONAL LINK..." }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 2750,
        columnNumber: 15
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 2745,
      columnNumber: 13
    }) : /* @__PURE__ */ jsxDEV("div", { className: "animate-fadeIn", style: { textAlign: "center" }, children: [
      /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.7rem", color: "var(--primary)", fontWeight: 900, marginBottom: 10 }, children: "NEW ENTITY DETECTED" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 2754,
        columnNumber: 15
      }),
      /* @__PURE__ */ jsxDEV("img", { src: summonResult.imageUrl, alt: summonResult.name, style: { width: 250, height: 250, borderRadius: 40, border: "4px solid var(--primary)", boxShadow: "0 0 50px var(--primary)" } }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 2755,
        columnNumber: 15
      }),
      /* @__PURE__ */ jsxDEV("h1", { style: { fontSize: "3rem", margin: "20px 0 10px 0" }, children: summonResult.name }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 2756,
        columnNumber: 15
      }),
      /* @__PURE__ */ jsxDEV("div", { style: { color: "var(--text-muted)", marginBottom: 30 }, children: [
        summonResult.franchise,
        " \u2022 ",
        summonResult.role
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 2757,
        columnNumber: 15
      }),
      /* @__PURE__ */ jsxDEV("button", { className: "train-btn", onClick: confirmSummon, children: "WELCOME TO THE ACADEMY" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 2758,
        columnNumber: 15
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 2753,
      columnNumber: 13
    }) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 2743,
      columnNumber: 9
    }),
    /* @__PURE__ */ jsxDEV("div", { className: "shop-header-v3", children: [
      /* @__PURE__ */ jsxDEV("h2", { style: { fontWeight: 900, margin: 0, fontSize: "1.8rem", letterSpacing: "2px", fontFamily: "Rajdhani" }, children: "THE LOCAL BODEGA" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 2765,
        columnNumber: 9
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "currency-strip-v3", style: { display: "flex", gap: 10, flexWrap: "wrap" }, children: [
        /* @__PURE__ */ jsxDEV("div", { className: "currency-pill credits", children: [
          "$",
          credits.toLocaleString()
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 2767,
          columnNumber: 13
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "currency-pill gems", children: [
          gems,
          " GEMS"
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 2768,
          columnNumber: 13
        }),
        // Materials/Essence/Aura were previously invisible while shopping --
        // FACILITY/CRAFT/COOKING/X-CHANGE all spend at least one of these, but
        // a player had no persistent way to see the balance while browsing.
        /* @__PURE__ */ jsxDEV("div", { className: "currency-pill", style: { background: "rgba(163,230,53,0.15)", borderColor: "rgba(163,230,53,0.3)", color: "#a3e635" }, children: [
          (materials || 0).toLocaleString(),
          " MAT"
        ] }, void 0, true, { fileName: "<stdin>", lineNumber: 2768, columnNumber: 13 }),
        /* @__PURE__ */ jsxDEV("div", { className: "currency-pill", style: { background: "rgba(249,115,22,0.15)", borderColor: "rgba(249,115,22,0.3)", color: "#f97316" }, children: [
          (essence || 0).toLocaleString(),
          " ESS"
        ] }, void 0, true, { fileName: "<stdin>", lineNumber: 2768, columnNumber: 13 }),
        /* @__PURE__ */ jsxDEV("div", { className: "currency-pill", style: { background: "rgba(168,85,247,0.15)", borderColor: "rgba(168,85,247,0.3)", color: "#a855f7" }, children: [
          (aura || 0).toLocaleString(),
          " AURA"
        ] }, void 0, true, { fileName: "<stdin>", lineNumber: 2768, columnNumber: 13 })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 2766,
        columnNumber: 9
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 2764,
      columnNumber: 7
    }),
    /* @__PURE__ */ jsxDEV("div", { className: "shop-tabs v3", children: [
      /* @__PURE__ */ jsxDEV("button", { className: `shop-tab-v3 ${activeTab === "supplies" ? "active" : ""}`, onClick: () => setActiveTab("supplies"), children: [
        /* @__PURE__ */ jsxDEV(Package, { size: 16 }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 2774,
          columnNumber: 13
        }),
        " ",
        /* @__PURE__ */ jsxDEV("span", { children: "SUPPLIES" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 2774,
          columnNumber: 34
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 2773,
        columnNumber: 9
      }),
      /* @__PURE__ */ jsxDEV("button", { className: `shop-tab-v3 ${activeTab === "upgrades" ? "active" : ""}`, onClick: () => setActiveTab("upgrades"), children: [
        /* @__PURE__ */ jsxDEV(LayoutGrid, { size: 16 }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 2777,
          columnNumber: 13
        }),
        " ",
        /* @__PURE__ */ jsxDEV("span", { children: "FACILITY" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 2777,
          columnNumber: 37
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 2776,
        columnNumber: 9
      }),
      /* @__PURE__ */ jsxDEV("button", { className: `shop-tab-v3 ${activeTab === "aura" ? "active" : ""}`, onClick: () => setActiveTab("aura"), children: [
        /* @__PURE__ */ jsxDEV(Zap, { size: 16 }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 2780,
          columnNumber: 13
        }),
        " ",
        /* @__PURE__ */ jsxDEV("span", { children: "AURA" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 2780,
          columnNumber: 30
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 2779,
        columnNumber: 9
      }),
      /* @__PURE__ */ jsxDEV("button", { className: `shop-tab-v3 ${activeTab === "crafting" ? "active" : ""}`, onClick: () => setActiveTab("crafting"), children: [
        /* @__PURE__ */ jsxDEV(Hammer, { size: 16 }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 2783,
          columnNumber: 13
        }),
        " ",
        /* @__PURE__ */ jsxDEV("span", { children: "CRAFT" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 2783,
          columnNumber: 33
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 2782,
        columnNumber: 9
      }),
      /* @__PURE__ */ jsxDEV("button", { className: `shop-tab-v3 ${activeTab === "cooking" ? "active" : ""}`, onClick: () => setActiveTab("cooking"), children: [
        /* @__PURE__ */ jsxDEV(Activity, { size: 16 }, void 0, false, { fileName: "<stdin>", lineNumber: 1, columnNumber: 1 }),
        " ",
        /* @__PURE__ */ jsxDEV("span", { children: "COOKING" }, void 0, false, { fileName: "<stdin>", lineNumber: 1, columnNumber: 1 })
      ] }, void 0, true, { fileName: "<stdin>", lineNumber: 1, columnNumber: 1 }),
      /* @__PURE__ */ jsxDEV("button", { className: `shop-tab-v3 ${activeTab === "exchange" ? "active" : ""}`, onClick: () => setActiveTab("exchange"), children: [
        /* @__PURE__ */ jsxDEV(Database, { size: 16 }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 2786,
          columnNumber: 13
        }),
        " ",
        /* @__PURE__ */ jsxDEV("span", { children: "X-CHANGE" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 2786,
          columnNumber: 35
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 2785,
        columnNumber: 9
      }),
      /* @__PURE__ */ jsxDEV("button", { className: `shop-tab-v3 ${activeTab === "elite" ? "active" : ""}`, onClick: () => setActiveTab("elite"), children: [
        /* @__PURE__ */ jsxDEV(Crown, { size: 16 }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 2789,
          columnNumber: 13
        }),
        " ",
        /* @__PURE__ */ jsxDEV("span", { children: "ELITE" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 2789,
          columnNumber: 32
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 2788,
        columnNumber: 9
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 2772,
      columnNumber: 7
    }),
    activeTab === "exchange" && /* @__PURE__ */ jsxDEV(ExchangeTab, { credits, setCredits, gems, setGems, aura, setAura, essence, setEssence, materials, setMaterials, addToInventory, setStamina, maxStamina, createFloatingText, characters, unlockedIds, setUnlockedIds, unlockedFeatures, setUnlockedFeatures, totalAccountLevel, auraUpgrades, setAuraUpgrades, setShards, setCharacters, items, triggerVisualEffect, inventory, safeTriggerVisualEffect, isSummoning, setIsSummoning, summonResult, setSummonResult, autorollActive, setAutorollActive, rollsRemaining, setRollsRemaining, activeTab, setActiveTab, gambleResult, setGambleResult, isFeatureUnlocked, summonHero, startAutoRolls, confirmSummon, dailyDeals, unlockFeature, dealSeed, CRAFTING_RECIPES, handleCraft, calculateMaxCraft, AURA_STAT_LIST, auraLevelCost, affordableAuraLevels, upgradeAuraBulk, upgradeAuraAll, COOKING_RECIPES, GAMBLE_COOK_COST, GAMBLE_COOK_POOL, canAffordGamble, handleGambleCook  }, void 0, false, {}),
    activeTab === "supplies" && /* @__PURE__ */ jsxDEV(SuppliesTab, { credits, setCredits, gems, setGems, aura, setAura, essence, setEssence, materials, setMaterials, addToInventory, setStamina, maxStamina, createFloatingText, characters, unlockedIds, setUnlockedIds, unlockedFeatures, setUnlockedFeatures, totalAccountLevel, auraUpgrades, setAuraUpgrades, setShards, setCharacters, items, triggerVisualEffect, inventory, safeTriggerVisualEffect, isSummoning, setIsSummoning, summonResult, setSummonResult, autorollActive, setAutorollActive, rollsRemaining, setRollsRemaining, activeTab, setActiveTab, gambleResult, setGambleResult, isFeatureUnlocked, summonHero, startAutoRolls, confirmSummon, dailyDeals, unlockFeature, dealSeed, CRAFTING_RECIPES, handleCraft, calculateMaxCraft, AURA_STAT_LIST, auraLevelCost, affordableAuraLevels, upgradeAuraBulk, upgradeAuraAll, COOKING_RECIPES, GAMBLE_COOK_COST, GAMBLE_COOK_POOL, canAffordGamble, handleGambleCook  }, void 0, false, {}),
    activeTab === "upgrades" && /* @__PURE__ */ jsxDEV(FacilityTab, { credits, setCredits, gems, setGems, aura, setAura, essence, setEssence, materials, setMaterials, addToInventory, setStamina, maxStamina, createFloatingText, characters, unlockedIds, setUnlockedIds, unlockedFeatures, setUnlockedFeatures, totalAccountLevel, auraUpgrades, setAuraUpgrades, setShards, setCharacters, items, triggerVisualEffect, inventory, safeTriggerVisualEffect, isSummoning, setIsSummoning, summonResult, setSummonResult, autorollActive, setAutorollActive, rollsRemaining, setRollsRemaining, activeTab, setActiveTab, gambleResult, setGambleResult, isFeatureUnlocked, summonHero, startAutoRolls, confirmSummon, dailyDeals, unlockFeature, dealSeed, CRAFTING_RECIPES, handleCraft, calculateMaxCraft, AURA_STAT_LIST, auraLevelCost, affordableAuraLevels, upgradeAuraBulk, upgradeAuraAll, COOKING_RECIPES, GAMBLE_COOK_COST, GAMBLE_COOK_POOL, canAffordGamble, handleGambleCook  }, void 0, false, {}),
    activeTab === "elite" && /* @__PURE__ */ jsxDEV(EliteTab, { credits, setCredits, gems, setGems, aura, setAura, essence, setEssence, materials, setMaterials, addToInventory, setStamina, maxStamina, createFloatingText, characters, unlockedIds, setUnlockedIds, unlockedFeatures, setUnlockedFeatures, totalAccountLevel, auraUpgrades, setAuraUpgrades, setShards, setCharacters, items, triggerVisualEffect, inventory, safeTriggerVisualEffect, isSummoning, setIsSummoning, summonResult, setSummonResult, autorollActive, setAutorollActive, rollsRemaining, setRollsRemaining, activeTab, setActiveTab, gambleResult, setGambleResult, isFeatureUnlocked, summonHero, startAutoRolls, confirmSummon, dailyDeals, unlockFeature, dealSeed, CRAFTING_RECIPES, handleCraft, calculateMaxCraft, AURA_STAT_LIST, auraLevelCost, affordableAuraLevels, upgradeAuraBulk, upgradeAuraAll, COOKING_RECIPES, GAMBLE_COOK_COST, GAMBLE_COOK_POOL, canAffordGamble, handleGambleCook  }, void 0, false, {}),
    activeTab === "crafting" && /* @__PURE__ */ jsxDEV(CraftingTab, { credits, setCredits, gems, setGems, aura, setAura, essence, setEssence, materials, setMaterials, addToInventory, setStamina, maxStamina, createFloatingText, characters, unlockedIds, setUnlockedIds, unlockedFeatures, setUnlockedFeatures, totalAccountLevel, auraUpgrades, setAuraUpgrades, setShards, setCharacters, items, triggerVisualEffect, inventory, safeTriggerVisualEffect, isSummoning, setIsSummoning, summonResult, setSummonResult, autorollActive, setAutorollActive, rollsRemaining, setRollsRemaining, activeTab, setActiveTab, gambleResult, setGambleResult, isFeatureUnlocked, summonHero, startAutoRolls, confirmSummon, dailyDeals, unlockFeature, dealSeed, CRAFTING_RECIPES, handleCraft, calculateMaxCraft, AURA_STAT_LIST, auraLevelCost, affordableAuraLevels, upgradeAuraBulk, upgradeAuraAll, COOKING_RECIPES, GAMBLE_COOK_COST, GAMBLE_COOK_POOL, canAffordGamble, handleGambleCook  }, void 0, false, {}),
    activeTab === "cooking" && /* @__PURE__ */ jsxDEV(CookingTab, { credits, setCredits, gems, setGems, aura, setAura, essence, setEssence, materials, setMaterials, addToInventory, setStamina, maxStamina, createFloatingText, characters, unlockedIds, setUnlockedIds, unlockedFeatures, setUnlockedFeatures, totalAccountLevel, auraUpgrades, setAuraUpgrades, setShards, setCharacters, items, triggerVisualEffect, inventory, safeTriggerVisualEffect, isSummoning, setIsSummoning, summonResult, setSummonResult, autorollActive, setAutorollActive, rollsRemaining, setRollsRemaining, activeTab, setActiveTab, gambleResult, setGambleResult, isFeatureUnlocked, summonHero, startAutoRolls, confirmSummon, dailyDeals, unlockFeature, dealSeed, CRAFTING_RECIPES, handleCraft, calculateMaxCraft, AURA_STAT_LIST, auraLevelCost, affordableAuraLevels, upgradeAuraBulk, upgradeAuraAll, COOKING_RECIPES, GAMBLE_COOK_COST, GAMBLE_COOK_POOL, canAffordGamble, handleGambleCook  }, void 0, false, {}),
    activeTab === "aura" && /* @__PURE__ */ jsxDEV(AuraTab, { credits, setCredits, gems, setGems, aura, setAura, essence, setEssence, materials, setMaterials, addToInventory, setStamina, maxStamina, createFloatingText, characters, unlockedIds, setUnlockedIds, unlockedFeatures, setUnlockedFeatures, totalAccountLevel, auraUpgrades, setAuraUpgrades, setShards, setCharacters, items, triggerVisualEffect, inventory, safeTriggerVisualEffect, isSummoning, setIsSummoning, summonResult, setSummonResult, autorollActive, setAutorollActive, rollsRemaining, setRollsRemaining, activeTab, setActiveTab, gambleResult, setGambleResult, isFeatureUnlocked, summonHero, startAutoRolls, confirmSummon, dailyDeals, unlockFeature, dealSeed, CRAFTING_RECIPES, handleCraft, calculateMaxCraft, AURA_STAT_LIST, auraLevelCost, affordableAuraLevels, upgradeAuraBulk, upgradeAuraAll, COOKING_RECIPES, GAMBLE_COOK_COST, GAMBLE_COOK_POOL, canAffordGamble, handleGambleCook  }, void 0, false, {})
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 2741,
    columnNumber: 5
  });
};;

export { ShopView };
