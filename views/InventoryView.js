import { Fragment, jsxDEV } from "react/jsx-dev-runtime";
import React, { useState, useEffect, useMemo } from "react";
import {
  Package,
  Database,
  X,
  Wrench
} from "lucide-react";
import { ELEMENTS } from "../constants.js";
import { CustomSelect } from "../components.js";
import { playSound, calculateSubStat, getBondMultiplier } from "../utils.js";

const InventoryView = ({
  inventory,
  characters,
  unlockedIds = [],
  autoTargetId = null,
  selectedCharIndex,
  removeFromInventory,
  setCharacters,
  setStamina,
  maxStamina,
  setAura,
  setMaterials,
  setGems,
  essence,
  setEssence,
  createFloatingText,
  credits,
  setCredits,
  totalPWR = 0,
  items,
  skills,
  auraUpgrades = {},
  totalAccountLevel = 1
}) => {
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("rarity");
  const [lockedItems, setLockedItems] = useState(() => {
    try {
      const saved = localStorage.getItem("mugen_locked_items");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [pendingItem, setPendingItem] = useState(null);
  const [showTargetModal, setShowTargetModal] = useState(false);
  useEffect(() => {
    if (lockedItems) {
      localStorage.setItem("mugen_locked_items", JSON.stringify(lockedItems));
    }
  }, [lockedItems]);
  const toggleLock = (itemId, e) => {
    if (!itemId) return;
    e.stopPropagation();
    setLockedItems((prev) => {
      const list = prev || [];
      return list.includes(itemId) ? list.filter((i) => i !== itemId) : [...list, itemId];
    });
    playSound("ui_hover", 0.2);
  };
  const [targetSearch, setTargetSearch] = useState("");
  const getTargetIndex = (id) => characters.findIndex((c) => String(c.export_id) === String(id));
  const initiateUseItem = (itemId) => {
    const item = items?.[itemId];
    if (!item) return;
    const isGlobal = ["stamina_small", "stamina_large", "stamina_xl", "aura_fragment", "essence_vial", "materials_bundle", "summon_voucher", "mystery_crate"].includes(itemId);
    if (isGlobal) {
      confirmUseItem(itemId, null);
    } else if (autoTargetId) {
      confirmUseItem(itemId, autoTargetId);
    } else {
      setPendingItem(itemId);
      setShowTargetModal(true);
    }
  };
  const confirmUseItem = (itemId, targetCharId) => {
    useItem(itemId, targetCharId);
    setPendingItem(null);
    setShowTargetModal(false);
  };
  const salvageItem = (itemId, e) => {
    e.stopPropagation();
    const item = items?.[itemId];
    if (!item) return;
    const materialsMap = { "common": 150, "uncommon": 450, "rare": 1200, "epic": 5e3, "legendary": 25e3 };
    const amount = materialsMap[item.rarity] || 100;
    let essenceGain = 0;
    if (item.type === "junk" && item.rarity === "epic") essenceGain = 20;
    removeFromInventory(itemId, 1);
    const curMaterials = parseInt(localStorage.getItem("mugen_materials") || "0", 10);
    const curEssence = parseInt(localStorage.getItem("mugen_essence") || "0", 10);
    const nextMaterials = curMaterials + amount;
    const nextEssence = curEssence + essenceGain;
    if (setMaterials) setMaterials(nextMaterials);
    if (setEssence) setEssence(nextEssence);
    localStorage.setItem("mugen_materials", String(nextMaterials));
    localStorage.setItem("mugen_essence", String(nextEssence));
    window.dispatchEvent(new CustomEvent("mugen_materials_changed", {
      detail: { materials: nextMaterials, essence: nextEssence }
    }));
    playSound("scavenge");
    createFloatingText(`+${amount} Materials ${essenceGain > 0 ? `& +${essenceGain} Essence` : ""}`, false, "#94a3b8");
  };
  const sellItem = (itemId, e) => {
    e.stopPropagation();
    const item = items?.[itemId];
    if (!item) return;
    const sellPrice = item.rarity === "common" ? 100 : item.rarity === "uncommon" ? 300 : item.rarity === "rare" ? 800 : 2500;
    setCredits((c) => c + sellPrice);
    removeFromInventory(itemId, 1);
    playSound("sell_item");
    createFloatingText(`+$${sellPrice.toLocaleString()}`, false, "#facc15");
  };
  const sellAllJunk = () => {
    if (!inventory) return;
    let totalCredits = 0;
    let itemsToRemove = [];
    Object.entries(inventory).forEach(([id, qty]) => {
      const item = items?.[id];
      if (item && item.type === "junk") {
        const sellPrice = item.rarity === "common" ? 100 : item.rarity === "uncommon" ? 300 : item.rarity === "rare" ? 800 : 2500;
        totalCredits += sellPrice * qty;
        itemsToRemove.push({ id, qty });
      }
    });
    if (totalCredits === 0) {
      createFloatingText("No junk to sell!", true);
      return;
    }
    if (confirm(`Sell all junk for $${totalCredits.toLocaleString()}?`)) {
      itemsToRemove.forEach((it) => removeFromInventory(it.id, it.qty));
      setCredits((c) => c + totalCredits);
      createFloatingText(`+$${totalCredits.toLocaleString()}`, false, "#facc15");
      playSound("sell_item");
    }
  };
  const salvageAllCommons = () => {
    if (!inventory) return;
    let totalMaterials = 0;
    let itemsToRemove = [];
    Object.entries(inventory).forEach(([id, qty]) => {
      const item = items?.[id];
      if (item && (item.rarity === "common" || item.rarity === "uncommon") && item.type !== "special") {
        const materialsVal = item.rarity === "common" ? 25 : 60;
        totalMaterials += materialsVal * qty;
        itemsToRemove.push({ id, qty });
      }
    });
    if (totalMaterials === 0) {
      createFloatingText("No suitable items to salvage", true);
      return;
    }
    if (confirm(`Salvage all Common/Uncommon items for ${totalMaterials.toLocaleString()} Materials?`)) {
      itemsToRemove.forEach((it) => removeFromInventory(it.id, it.qty));
      const curMaterials = parseInt(localStorage.getItem("mugen_materials") || "0", 10);
      const next = curMaterials + totalMaterials;
      if (setMaterials) setMaterials(next);
      localStorage.setItem("mugen_materials", String(next));
      window.dispatchEvent(new CustomEvent("mugen_materials_changed", { detail: { materials: next } }));
      createFloatingText(`+${totalMaterials.toLocaleString()} MATERIALS`, false, "#94a3b8");
      playSound("scavenge");
    }
  };
  const useItem = (itemId, targetId = null) => {
    if (!inventory[itemId]) return;
    const item = items?.[itemId];
    if (!item) return;
    let tIndex = -1;
    let targetChar = null;
    if (targetId) {
      tIndex = getTargetIndex(targetId);
      targetChar = characters[tIndex];
      if (tIndex === -1) return;
    }
    if (["ascension_injector", "omega_serum"].includes(itemId) && targetChar.level < 100) {
      createFloatingText("Hero must be Lv. 100!", true);
      playSound("error");
      return;
    }
    if (item.type === "junk") {
      const bondGain = item.rarity === "common" ? 15 : item.rarity === "uncommon" ? 40 : item.rarity === "rare" ? 100 : 250;
      const estGain = Math.floor(bondGain * getBondMultiplier(targetChar));
      setCharacters((prev) => {
        const next = [...prev];
        const idx = next.findIndex((c2) => String(c2.export_id) === String(targetId));
        if (idx === -1) return prev;
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
      createFloatingText(`+${estGain} Bond`, false, "#f472b6");
      removeFromInventory(itemId, 1);
      playSound("upgrade");
      return;
    }
    let consumed = true;
    switch (itemId) {
      case "elixir_atk":
        setCharacters((prev) => {
          const next = [...prev];
          const c = { ...next[tIndex] };
          c.xp += 5e4;
          c.refinements = { ...c.refinements, atk: (c.refinements?.atk || 0) + 1 };
          while (c.xp >= c.nextXp) {
            c.xp -= c.nextXp;
            c.level++;
            c.nextXp = Math.floor(100 * Math.pow(1.15, c.level - 1));
          }
          next[tIndex] = c;
          return next;
        });
        createFloatingText("+50k XP & +1 ATK REFINE", false, "#ef4444");
        break;
      case "elixir_magic":
        setCharacters((prev) => {
          const next = [...prev];
          const c = { ...next[tIndex] };
          c.xp += 5e4;
          c.refinements = { ...c.refinements, "magic atk": (c.refinements?.["magic atk"] || 0) + 1 };
          while (c.xp >= c.nextXp) {
            c.xp -= c.nextXp;
            c.level++;
            c.nextXp = Math.floor(100 * Math.pow(1.15, c.level - 1));
          }
          next[tIndex] = c;
          return next;
        });
        createFloatingText("+50k XP & +1 M.ATK REFINE", false, "#a855f7");
        break;
      case "omega_catalyst":
        setCharacters((prev) => {
          const next = [...prev];
          const c = { ...next[tIndex] };
          c.xp += 1e6;
          while (c.xp >= c.nextXp) {
            c.xp -= c.nextXp;
            c.level++;
            c.nextXp = Math.floor(100 * Math.pow(1.15, c.level - 1));
          }
          next[tIndex] = c;
          return next;
        });
        createFloatingText("+1,000,000 XP", false, "#fbbf24");
        break;
      case "dimensional_key":
        setGems((g) => g + 1e3);
        createFloatingText("+1,000 GEMS!", false, "#00d2ff");
        break;
      case "stamina_small":
        setStamina((s) => Math.min(maxStamina, s + 45));
        createFloatingText("+45 Stamina", false, "#4ade80");
        break;
      case "stamina_large":
        setStamina((s) => Math.min(maxStamina, s + 120));
        createFloatingText("+120 Stamina", false, "#4ade80");
        break;
      case "stamina_xl":
        setStamina((s) => s + 200);
        createFloatingText("OVERCHARGED +200!", false, "#fbbf24");
        break;
      case "cook_hearty_feast":
        setStamina((s) => s + 320);
        createFloatingText("OVERCHARGED +320!", false, "#fbbf24");
        break;
      case "cook_sushi_platter": {
        setStamina((s) => s + 260);
        createFloatingText("OVERCHARGED +260!", false, "#fbbf24");
        setCharacters((prev) => {
          const next = [...prev];
          const idx = next.findIndex((c2) => String(c2.export_id) === String(targetId));
          if (idx === -1) return prev;
          const c = { ...next[idx] };
          c.bondXp += Math.floor(400 * getBondMultiplier(c));
          while (c.bondXp >= c.nextBondXp && c.bondLevel < 100) {
            c.bondXp -= c.nextBondXp;
            c.bondLevel++;
            c.nextBondXp = 80 + c.bondLevel * 25;
          }
          next[idx] = c;
          return next;
        });
        createFloatingText("+400 Bond", false, "#f472b6");
        break;
      }
      case "cook_grand_banquet": {
        setStamina((s) => s + 300);
        createFloatingText("OVERCHARGED +300!", false, "#fbbf24");
        setCharacters((prev) => {
          const next = [...prev];
          const c = { ...next[tIndex] };
          c.xp += 2e6;
          while (c.xp >= c.nextXp) {
            c.xp -= c.nextXp;
            c.level++;
            c.nextXp = Math.floor(100 * Math.pow(1.15, c.level - 1));
          }
          next[tIndex] = c;
          return next;
        });
        createFloatingText("+2,000,000 XP", false, "#f472b6");
        break;
      }
      case "mystery_crate": {
        const r = Math.random();
        if (r < 0.5) {
          setCredits((c) => c + 15e3);
          createFloatingText("+$15,000", false, "#facc15");
        } else if (r < 0.8) {
          setMaterials((s) => s + 2500);
          createFloatingText("+2,500 Materials", false, "#94a3b8");
        } else {
          setGems((g) => g + 75);
          createFloatingText("+75 Gems!", false, "#00d2ff");
          playSound("jackpot");
        }
        break;
      }
      case "xp_scroll":
      case "xp_tome":
      case "xp_ultra_tome":
      case "xp_omega_log":
      case "xp_soul_gem":
      case "xp_reality_script":
      case "catalyst_fire":
      case "catalyst_water":
      case "catalyst_wind":
      case "catalyst_light":
      case "catalyst_dark":
      case "catalyst_neutral":
      case "cook_pepper_stew":
      case "cook_melon_salad":
      case "cook_windy_waffles":
      case "cook_honey_tart":
      case "cook_blackened_sausage":
      case "cook_trail_pretzel": {
        const xpMap = {
          xp_scroll: 5e3,
          xp_tome: 25e3,
          xp_ultra_tome: 25e4,
          xp_omega_log: 25e6,
          xp_soul_gem: 45e6,
          xp_reality_script: 7e7,
          catalyst_fire: 2e4,
          catalyst_water: 2e4,
          catalyst_wind: 2e4,
          catalyst_light: 2e4,
          catalyst_dark: 2e4,
          catalyst_neutral: 25e3,
          cook_pepper_stew: 5e4,
          cook_melon_salad: 5e4,
          cook_windy_waffles: 5e4,
          cook_honey_tart: 5e4,
          cook_blackened_sausage: 5e4,
          cook_trail_pretzel: 5e4
        };
        let gain = xpMap[itemId];
        if ((itemId.startsWith("catalyst_") || itemId.startsWith("cook_")) && targetChar) {
          const itemEl = item.element;
          if (itemEl === targetChar.element) {
            gain *= 2;
            createFloatingText("ELEMENTAL RESONANCE!", false, ELEMENTS[itemEl].color);
          }
        }
        setCharacters((prev) => {
          const next = [...prev];
          const c = { ...next[tIndex] };
          c.xp += gain;
          while (c.xp >= c.nextXp) {
            c.xp -= c.nextXp;
            c.level++;
            c.nextXp = Math.floor(100 * Math.pow(1.15, c.level - 1));
          }
          next[tIndex] = c;
          return next;
        });
        createFloatingText(`+${gain.toLocaleString()} XP`, false, "#f472b6");
        break;
      }
      case "bond_gift":
      case "bond_gift_rare":
      case "bond_gift_epic":
      case "bond_gift_legendary":
      case "cook_whiskey_toast":
      case "cook_wine_reserve": {
        const baseGains = { bond_gift: 500, bond_gift_rare: 1500, bond_gift_epic: 5e3, bond_gift_legendary: 15e3, cook_whiskey_toast: 1e3, cook_wine_reserve: 3e3 };
        let gain = baseGains[itemId];
        const isMatch = item.element === targetChar.element;
        if (isMatch) gain = Math.floor(gain * 1.5);
        setCharacters((prev) => {
          const next = [...prev];
          const idx = next.findIndex((c2) => String(c2.export_id) === String(targetId));
          if (idx === -1) return prev;
          const c = { ...next[idx] };
          c.bondXp += Math.floor(gain * getBondMultiplier(c));
          while (c.bondXp >= c.nextBondXp && c.bondLevel < 100) {
            c.bondXp -= c.nextBondXp;
            c.bondLevel++;
            c.nextBondXp = 80 + c.bondLevel * 25;
          }
          next[idx] = c;
          return next;
        });
        createFloatingText(`+${gain} Bond`, false, "#f472b6");
        break;
      }
      case "aura_fragment":
        setAura((a) => a + 25);
        createFloatingText("+25 Aura", false, "#a855f7");
        break;
      case "essence_vial":
        setEssence((e) => e + 25);
        createFloatingText("+25 Essence", false, "#f97316");
        break;
      case "materials_bundle":
        setMaterials((s) => s + 2e3);
        createFloatingText("+2,000 Materials", false, "#94a3b8");
        playSound("loot");
        break;
      case "summon_voucher":
        setGems((g) => g + 150);
        createFloatingText("+150 Gems", false, "#00d2ff");
        break;
      /* Added handlers for previously unsupported high-tier items */
      case "xp_grand_tome": {
        const XP = 5e6;
        if (targetChar) {
          setCharacters((prev) => {
            const next = [...prev];
            const idx = next.findIndex((c2) => String(c2.export_id) === String(targetId));
            if (idx === -1) return prev;
            const c = { ...next[idx] };
            c.xp += XP;
            while (c.xp >= c.nextXp) {
              c.xp -= c.nextXp;
              c.level++;
              c.nextXp = Math.floor(100 * Math.pow(1.15, c.level - 1));
            }
            next[idx] = c;
            return next;
          });
          createFloatingText("+5,000,000 XP", false, "#fbbf24");
        } else {
          setCredits((cr) => cr + 25e4);
          createFloatingText("No target selected \u2014 granted $250k instead", true);
        }
        break;
      }
      case "multiverse_core": {
        if (targetChar) {
          setCharacters((prev) => {
            const next = [...prev];
            const idx = next.findIndex((c2) => String(c2.export_id) === String(targetId));
            if (idx === -1) return prev;
            const c = { ...next[idx] };
            c.level = 100;
            c.xp = 0;
            c.nextXp = Math.floor(100 * Math.pow(1.15, c.level - 1));
            c.ascension = Math.max(0, (c.ascension || 0) + 1);
            c.refinements = { ...c.refinements || {}, hp: (c.refinements?.hp || 0) + 5, atk: (c.refinements?.atk || 0) + 5, def: (c.refinements?.def || 0) + 5 };
            next[idx] = c;
            return next;
          });
          createFloatingText(`${targetChar.name} \u2192 LEVEL 100 \u2022 ASCENSION+1`, false, "#facc15");
          playSound("summon_reveal");
        } else {
          setCredits((cr) => cr + 5e5);
          createFloatingText("No hero targeted \u2014 awarded $500k as fallback", true);
        }
        break;
      }
      case "bond_eternal_crystal": {
        const BOND = 5e4;
        if (targetChar) {
          setCharacters((prev) => {
            const next = [...prev];
            const idx = next.findIndex((c2) => String(c2.export_id) === String(targetId));
            if (idx === -1) return prev;
            const c = { ...next[idx] };
            c.bondXp += BOND;
            while (c.bondXp >= c.nextBondXp && c.bondLevel < 100) {
              c.bondXp -= c.nextBondXp;
              c.bondLevel++;
              c.nextBondXp = 80 + c.bondLevel * 25;
            }
            next[idx] = c;
            return next;
          });
          createFloatingText("+50,000 Bond", false, "#f472b6");
          playSound("bond_milestone");
        } else {
          setGems((g) => g + 500);
          createFloatingText("No target \u2014 awarded 500 Gems instead", true);
        }
        break;
      }
      case "void_capsule": {
        try {
          const cur = parseInt(localStorage.getItem("mugen_max_stamina_bonus") || "0", 10) || 0;
          const nextBonus = cur + 100;
          localStorage.setItem("mugen_max_stamina_bonus", String(nextBonus));
          setStamina((s) => Math.min(s + 100, 250 + Math.floor(totalAccountLevel * 4) + nextBonus));
          createFloatingText("Void Capsule consumed: +100 Max Stamina (permanent)", false, "#fbbf24");
          playSound("levelUp");
        } catch (e) {
          createFloatingText("Skill failed to apply permanent capsule; granted 100 Stamina instead", true);
          setStamina((s) => s + 100);
        }
        break;
      }
      case "ascension_injector": {
        setCharacters((prev) => {
          const next = [...prev];
          const c = { ...next[tIndex] };
          c.ascension = (c.ascension || 0) + 1;
          next[tIndex] = c;
          return next;
        });
        createFloatingText(`${targetChar.name} ASCENDED TO RANK ${(targetChar.ascension || 0) + 1}!`, false, "#facc15");
        playSound("summon_reveal");
        break;
      }
      case "omega_serum": {
        setCharacters((prev) => {
          const next = [...prev];
          const c = { ...next[tIndex] };
          c.duplicateStatBonus = (c.duplicateStatBonus || 0) + 0.15;
          next[tIndex] = c;
          return next;
        });
        createFloatingText(`${targetChar.name} POWER OVERLOAD: +15% ALL STATS`, false, "#a855f7");
        playSound("gacha_legendary");
        break;
      }
      case "paradox_core": {
        setCharacters((prev) => {
          const next = [...prev];
          const c = { ...next[tIndex] };
          if (!c.abilityLevels) c.abilityLevels = {};
          if (c.skillId) c.abilityLevels[c.skillId] = Math.max(c.abilityLevels[c.skillId] || 1, 10);
          if (c.skillId2) c.abilityLevels[c.skillId2] = Math.max(c.abilityLevels[c.skillId2] || 1, 10);
          next[tIndex] = c;
          return next;
        });
        createFloatingText(`${targetChar.name} TALENTS MAXIMIZED!`, false, "#00d2ff");
        playSound("gacha_epic");
        break;
      }
      default:
        consumed = false;
        createFloatingText("Unsupported item", true);
    }
    if (consumed) {
      removeFromInventory(itemId, 1);
      playSound("upgrade");
    }
  };
  const inventoryItems = useMemo(
    () => Object.entries(inventory || {}).filter(([id]) => items?.[id]).map(([id, qty]) => ({ ...items[id], qty })),
    [inventory, items]
  );
  const filteredItems = useMemo(
    () => inventoryItems.filter((item) => !item ? false : filter === "all" || item.type === filter).sort((a, b) => {
      if (sortBy === "rarity") {
        const order = { "legendary": 4, "epic": 3, "rare": 2, "uncommon": 1, "common": 0 };
        return (order[b.rarity] || 0) - (order[a.rarity] || 0);
      }
      if (sortBy === "qty") return b.qty - a.qty;
      return (a.name || "").localeCompare(b.name || "");
    }),
    [inventoryItems, filter, sortBy]
  );
  const unlockedList = characters.filter((c) => unlockedIds.map(String).includes(String(c.export_id))).filter((c) => c.name.toLowerCase().includes(targetSearch.toLowerCase())).sort((a, b) => calculateSubStat(b, characters, "pwr", skills, auraUpgrades) - calculateSubStat(a, characters, "pwr", skills, auraUpgrades));
  return /* @__PURE__ */ jsxDEV("div", { className: "inventory-view animate-fadeIn", style: { padding: "10px 0" }, children: [
    /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 20, alignItems: "center" }, children: [
      /* @__PURE__ */ jsxDEV("button", { className: `filter-chip ${filter === "all" ? "active" : ""}`, onClick: () => setFilter("all"), children: "ALL" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 5787,
        columnNumber: 9
      }),
      /* @__PURE__ */ jsxDEV("button", { className: `filter-chip ${filter === "consumable" ? "active" : ""}`, onClick: () => setFilter("consumable"), children: "BATTLE" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 5788,
        columnNumber: 9
      }),
      /* @__PURE__ */ jsxDEV("button", { className: `filter-chip ${filter === "material" ? "active" : ""}`, onClick: () => setFilter("material"), children: "CRAFT" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 5789,
        columnNumber: 9
      }),
      /* @__PURE__ */ jsxDEV("button", { className: `filter-chip ${filter === "junk" ? "active" : ""}`, onClick: () => setFilter("junk"), children: "JUNK" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 5790,
        columnNumber: 9
      }),
      /* @__PURE__ */ jsxDEV(
        CustomSelect,
        {
          value: sortBy,
          onChange: (e) => setSortBy(e.target.value),
          style: { width: "140px" },
          options: [
            { value: "rarity", label: "By Rarity" },
            { value: "qty", label: "By Quantity" },
            { value: "name", label: "By Name" }
          ]
        },
        void 0,
        false,
        {
          fileName: "<stdin>",
          lineNumber: 5792,
          columnNumber: 9
        }
      ),
      /* @__PURE__ */ jsxDEV("div", { style: { marginLeft: "auto", display: "flex", gap: 12 }, children: [
        /* @__PURE__ */ jsxDEV("button", { className: "view-all-link", onClick: sellAllJunk, children: [
          "SELL JUNK ",
          /* @__PURE__ */ jsxDEV(Database, { size: 12 }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 5804,
            columnNumber: 77
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 5804,
          columnNumber: 11
        }),
        /* @__PURE__ */ jsxDEV("button", { className: "view-all-link", onClick: salvageAllCommons, children: [
          "SALVAGE ",
          /* @__PURE__ */ jsxDEV(Wrench, { size: 12 }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 5805,
            columnNumber: 81
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 5805,
          columnNumber: 11
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 5803,
        columnNumber: 9
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 5786,
      columnNumber: 7
    }),
    /* @__PURE__ */ jsxDEV("div", { className: "inventory-grid", children: filteredItems.map((item) => {
      const isLocked = lockedItems.includes(item.id);
      return /* @__PURE__ */ jsxDEV("div", { className: `inventory-card rarity-${item.rarity} ${isLocked ? "locked" : ""} roster-card-animated`, children: [
        /* @__PURE__ */ jsxDEV("div", { className: "item-qty", children: [
          "x",
          item.qty
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 5814,
          columnNumber: 15
        }),
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            onClick: (e) => toggleLock(item.id, e),
            style: {
              position: "absolute",
              top: 10,
              right: 10,
              background: "transparent",
              border: "none",
              color: isLocked ? "#facc15" : "rgba(255,255,255,0.2)",
              cursor: "pointer",
              zIndex: 20
            },
            children: /* @__PURE__ */ jsxDEV(Database, { size: 14, fill: isLocked ? "#facc15" : "none" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 5823,
              columnNumber: 17
            })
          },
          void 0,
          false,
          {
            fileName: "<stdin>",
            lineNumber: 5815,
            columnNumber: 15
          }
        ),
        /* @__PURE__ */ jsxDEV("div", { className: "item-icon-box", style: {
          boxShadow: autoTargetId && characters.find((c) => String(c.export_id) === String(autoTargetId))?.element === item.element ? `0 0 15px ${ELEMENTS[item.element]?.color || "transparent"}` : "none",
          border: autoTargetId && characters.find((c) => String(c.export_id) === String(autoTargetId))?.element === item.element ? `2px solid ${ELEMENTS[item.element]?.color}` : "none"
        }, children: [
          item.imageUrl ? /* @__PURE__ */ jsxDEV("img", { src: item.imageUrl }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 5829,
            columnNumber: 34
          }) : /* @__PURE__ */ jsxDEV(Package, { size: 32, opacity: 0.3 }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 5829,
            columnNumber: 64
          }),
          autoTargetId && characters.find((c) => String(c.export_id) === String(autoTargetId))?.element === item.element && /* @__PURE__ */ jsxDEV("div", { style: { position: "absolute", top: -5, right: -5, background: ELEMENTS[item.element].color, color: "#000", fontSize: "0.5rem", fontWeight: 900, padding: "1px 4px", borderRadius: 4 }, children: "BEST" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 5831,
            columnNumber: 21
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 5825,
          columnNumber: 15
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "item-name", style: { fontSize: "0.8rem" }, children: item.name }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 5834,
          columnNumber: 15
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "item-desc", style: { height: "3.2em" }, children: item.desc }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 5835,
          columnNumber: 15
        }),
        /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", gap: 6, marginTop: "auto" }, children: [
          /* @__PURE__ */ jsxDEV("button", { className: "use-item-btn", style: { flex: 3 }, onClick: () => initiateUseItem(item.id), children: item.type === "junk" ? "GIFT" : "USE" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 5837,
            columnNumber: 17
          }),
          !isLocked && /* @__PURE__ */ jsxDEV(Fragment, { children: [
            ["xp_scroll", "xp_tome", "xp_ultra_tome"].includes(item.id) && /* @__PURE__ */ jsxDEV("button", { className: "use-item-btn", style: { flex: 1, background: "#a855f7", opacity: 0.8 }, onClick: (e) => {
              e.stopPropagation();
              if (confirm(`Use up to 10 ${item.name}s?`)) {
                let q = item.qty;
                for (let i = 0; i < Math.min(q, 10); i++) useItem(item.id, autoTargetId || characters[selectedCharIndex]?.export_id);
                if (q > 10) createFloatingText("Batch used 10 (Max)", false, "#f472b6");
              }
            }, title: "Use Batch (Max 10)", children: "x10" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 5843,
              columnNumber: 23
            }),
            /* @__PURE__ */ jsxDEV("button", { className: "use-item-btn", style: { flex: 1, opacity: 0.6 }, onClick: (e) => sellItem(item.id, e), children: /* @__PURE__ */ jsxDEV(Database, { size: 10 }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 5852,
              columnNumber: 126
            }) }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 5852,
              columnNumber: 21
            }),
            /* @__PURE__ */ jsxDEV("button", { className: "use-item-btn", style: { flex: 1, opacity: 0.6 }, onClick: (e) => salvageItem(item.id, e), children: /* @__PURE__ */ jsxDEV(Wrench, { size: 10 }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 5853,
              columnNumber: 129
            }) }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 5853,
              columnNumber: 21
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 5841,
            columnNumber: 19
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 5836,
          columnNumber: 15
        })
      ] }, item.id, true, {
        fileName: "<stdin>",
        lineNumber: 5813,
        columnNumber: 13
      });
    }) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 5809,
      columnNumber: 7
    }),
    showTargetModal && /* @__PURE__ */ jsxDEV("div", { className: "hero-select-modal", style: { display: "flex", flexDirection: "column" }, children: /* @__PURE__ */ jsxDEV("div", { className: "modal-panel", style: { width: "90%", maxWidth: "600px", maxHeight: "85vh", position: "relative" }, children: [
      /* @__PURE__ */ jsxDEV("div", { className: "modal-header", children: [
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("h2", { style: { margin: 0 }, children: "TARGETING MODE" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 5867,
            columnNumber: 25
          }),
          /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.8rem", color: "var(--primary)", fontWeight: 900 }, children: [
            "USING: ",
            items[pendingItem]?.name
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 5868,
            columnNumber: 25
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 5866,
          columnNumber: 21
        }),
        /* @__PURE__ */ jsxDEV("button", { className: "upgrade-btn", onClick: () => setShowTargetModal(false), children: /* @__PURE__ */ jsxDEV(X, { size: 18 }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 5870,
          columnNumber: 95
        }) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 5870,
          columnNumber: 21
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 5865,
        columnNumber: 17
      }),
      /* @__PURE__ */ jsxDEV(
        "input",
        {
          className: "search-bar",
          placeholder: "Identify hero...",
          value: targetSearch,
          onChange: (e) => setTargetSearch(e.target.value),
          style: { marginBottom: 15 },
          autoFocus: true
        },
        void 0,
        false,
        {
          fileName: "<stdin>",
          lineNumber: 5873,
          columnNumber: 17
        }
      ),
      /* @__PURE__ */ jsxDEV("div", { className: "roster-grid custom-scroll", style: { overflowY: "auto", flex: 1, padding: "10px" }, children: [
        unlockedList.map((c) => /* @__PURE__ */ jsxDEV("div", { className: "sb-hero-row-card neon-hover", style: { height: "50px", background: "rgba(255,255,255,0.03)", borderRadius: "8px", marginBottom: "4px" }, onClick: () => confirmUseItem(pendingItem, c.export_id), children: [
          /* @__PURE__ */ jsxDEV("img", { src: c.imageUrl, className: "sb-hero-row-icon", style: { width: 40, height: 40, borderRadius: 6 } }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 5885,
            columnNumber: 29
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "sb-hero-row-name", style: { fontSize: "0.9rem" }, children: c.name }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 5886,
            columnNumber: 29
          }),
          /* @__PURE__ */ jsxDEV("div", { style: { textAlign: "right" }, children: [
            /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.7rem", fontWeight: 900, color: "var(--primary)" }, children: [
              "LVL ",
              c.level
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 5888,
              columnNumber: 33
            }),
            /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.6rem", color: ELEMENTS[c.element].color }, children: c.element }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 5889,
              columnNumber: 33
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 5887,
            columnNumber: 29
          })
        ] }, c.export_id, true, {
          fileName: "<stdin>",
          lineNumber: 5884,
          columnNumber: 25
        })),
        unlockedList.length === 0 && /* @__PURE__ */ jsxDEV("div", { style: { textAlign: "center", opacity: 0.5, padding: 20 }, children: "No matching heroes." }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 5893,
          columnNumber: 51
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 5882,
        columnNumber: 17
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 5864,
      columnNumber: 13
    }) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 5863,
      columnNumber: 9
    })
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 5785,
    columnNumber: 5
  });
};;

export { InventoryView };
