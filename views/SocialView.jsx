import { Fragment, jsxDEV } from "react/jsx-dev-runtime";
import React, { useState } from "react";
import {
  Heart,
  Users,
  Sparkles,
  Star,
  Skull,
  Ban
} from "lucide-react";
import { playSound, getBondMultiplier } from "../utils.js";

const SocialView = ({
  char,
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
  minimalMode = false,
  totalAccountLevel,
  heroMoods,
  setHeroMoods,
  inventory,
  removeFromInventory,
  setGems,
  setAura,
  onDateStart,
  onOpenPathChooser
}) => {
  if (!char) return null;
  const [isInteracting, setIsInteracting] = useState(false);
  const getBondInteractionName = (r, charId) => {
    const hash = (charId * 997 + r * 7919) % 1e3;
    const titles1to10 = ["Fateful Encounter", "A Curious Gaze", "First Words", "Brief Connection", "Tentative Steps", "Shared Silence", "Awkward Greeting", "Small Kindness", "Mutual Respect", "The Spark"];
    const titles11to30 = ["Growing Trust", "Shoulder to Shoulder", "Unspoken Accord", "Battle Rhythm", "Quiet Confidence", "Crimson Promise", "Loyal Shadow", "Radiant Smile", "Hidden Depths", "True Colors"];
    const titles31to60 = ["Unbreakable Vow", "Soul Resonance", "Destined Path", "Twin Stars", "Eternal Echo", "Heart's Clarity", "Boundless Faith", "Sacred Memory", "Absolute Unity", "Infinite Horizon"];
    const titlesHigh = ["Cosmic Singularity", "Dimensional Anchor", "Mythic bond", "Legendary Union", "Transcental Love", "Reality Breaker", "Timeless Devotion", "Celestial Harmony", "Godslayer's Pact", "The Omega Point"];
    let pool = titles1to10;
    if (r > 60) pool = titlesHigh;
    else if (r > 30) pool = titles31to60;
    else if (r > 10) pool = titles11to30;
    return pool[hash % pool.length];
  };
  const interact = async (type) => {
    if (isInteracting) return;
    if (type === "path_select" && onOpenPathChooser) {
      onOpenPathChooser(char);
      return;
    }
    if ((type === "date" || type === "hangout") && onDateStart) {
      onDateStart();
      return;
    }
    const definitions = {
      "spar": { bond: 60, stamina: 30, xp: char.level * 20, sound: "spar", label: "Spar", sub: "Combat Practice" },
      "gift": { bond: 120, stamina: 5, cost: 500, sound: "upgrade", label: "Gift", sub: "Send a present" },
      "compliment": { bond: 20, stamina: 5, label: "Compliment", sub: "Nice words" },
      "high_five": { bond: 25, stamina: 8, label: "High Five", sub: "Slap hands" },
      "deep_talk": { bond: 60, stamina: 15, cost: 150, label: "Deep Talk", sub: "Personal topic" },
      "headpat": { bond: 40, stamina: 12, sound: "headpat", label: "Headpat", sub: "Good job" },
      "hug": { bond: 75, stamina: 18, sound: "hug", label: "Hug", sub: "Warm embrace" },
      "hangout": { bond: 150, stamina: 20, cost: 300, label: "Hangout", sub: "Spend time" },
      "cook_together": { bond: 180, stamina: 25, cost: 400, sound: "upgrade", label: "Cook", sub: "Make dinner" },
      "flirt": { bond: 40, stamina: 10, label: "Flirt", sub: "Wink wink" },
      "hold_hands": { bond: 60, stamina: 12, label: "Hold Hands", sub: "Touch" },
      "love_letter": { bond: 120, stamina: 5, cost: 200, label: "Love Letter", sub: "Write feelings" },
      "kiss": { bond: 200, stamina: 25, sound: "kiss", label: "Kiss", sub: "Smooch" },
      "makeout": { bond: 450, stamina: 50, sound: "kiss", label: "Makeout", sub: "Passionate" },
      "cuddle": { bond: 120, stamina: 10, sound: "hug", label: "Cuddle", sub: "Close warmth" },
      "date": { bond: 750, stamina: 30, cost: 1500, sound: "date", label: "Date", sub: "Night out" },
      "insult": { bond: 15, stamina: 5, label: "Insult", sub: "Mock them", sound: "error" },
      "glare": { bond: 10, stamina: 2, label: "Glare", sub: "Intimidate", sound: "click" },
      "brawl": { bond: 50, stamina: 20, xp: char.level * 25, label: "Fist Fight", sub: "Throw hands", sound: "attack_hit" },
      "ambush": { bond: 100, stamina: 30, xp: char.level * 30, label: "Ambush", sub: "Dirty trick", sound: "crit_hit" },
      "death_match": { bond: 300, stamina: 50, xp: char.level * 100, label: "Death Match", sub: "Kill attempt", sound: "sfx_defeat" },
      "gift_inv_common": { bond: 250, stamina: 0, sound: "upgrade", label: "Give Charm", sub: "Inventory Item" },
      "gift_inv_rare": { bond: 750, stamina: 0, sound: "upgrade", label: "Give Bouquet", sub: "Inventory Item" },
      "gift_inv_epic": { bond: 2500, stamina: 0, sound: "upgrade", label: "Give Prism", sub: "Inventory Item" }
    };
    let isRankInteraction = type && typeof type === "string" && type.startsWith("bond_rank_");
    let def = definitions[type] || {};
    let cost = def.cost || 0;
    let bondGain = def.bond || 10;
    let staminaCost = def.stamina || 5;
    let xpGain = def.xp || 0;
    let sound = def.sound || "click";
    let desc = "";
    if (isRankInteraction) {
      const rankNum = parseInt(type.split("_").pop(), 10) || 1;
      staminaCost = Math.max(1, Math.floor(2 + rankNum * 0.8));
      bondGain = Math.max(5, Math.floor(10 + rankNum * 2));
      sound = "bond_milestone";
      const name = getBondInteractionName(rankNum, char.export_id);
      desc = `You recall the memory: "${name}".`;
    }
    if (credits < cost) {
      createFloatingText(`Need $${cost}`, true);
      playSound("error");
      return;
    }
    if (stamina < staminaCost) {
      createFloatingText(`Too tired!`, true);
      playSound("error");
      return;
    }
    if (type.includes("gift_inv") && !inventory[type.replace("gift_inv_", "bond_gift").replace("_common", "")]) {
      let invKey = type === "gift_inv_common" ? "bond_gift" : type === "gift_inv_rare" ? "bond_gift_rare" : "bond_gift_epic";
      if (!inventory[invKey]) {
        createFloatingText("Item missing!", true);
        playSound("error");
        return;
      }
      removeFromInventory(invKey, 1);
    }
    setIsInteracting(true);
    try {
      setCredits((c) => c - cost);
      setStamina((s) => Math.max(0, s - staminaCost));
      setCharacters((prev) => {
        const next = [...prev];
        const c = { ...next[selectedCharIndex] };
        const mult = getBondMultiplier(c);
        c.bondXp += Math.floor(bondGain * mult);
        c.xp += xpGain;
        while (c.bondXp >= c.nextBondXp && c.bondLevel < 100) {
          c.bondXp -= c.nextBondXp;
          c.bondLevel++;
          c.nextBondXp = 80 + c.bondLevel * 25;
        }
        next[selectedCharIndex] = c;
        return next;
      });
      playSound(sound);
      const extraContext = `Appearance: ${appearanceTags[char.export_id] || "Unknown"}. Vibe: ${heroVibes[char.export_id] || "Mysterious"}. Interaction Type: ${def.label}.`;
      const response = await triggerDialogue(char, (desc || `The Summoner interacts with you via ${def.label || "interaction"}`) + " | Context: " + extraContext, isRankInteraction);
      if (response && response.moodDelta) {
        setHeroMoods((prev) => ({
          ...prev,
          [char.export_id]: Math.min(100, Math.max(0, (prev[char.export_id] || 50) + response.moodDelta))
        }));
      }
      if (bondGain > 0) {
        const est = Math.floor(bondGain * getBondMultiplier(char));
        createFloatingText(`+${est} Bond`, false, "#f472b6");
        if (char.bondLevel >= 15 && Math.random() < 0.15) {
          const bonusGems = 1 + Math.floor(char.bondLevel / 20);
          setGems((g) => g + bonusGems);
          createFloatingText(`REWARD FROM ${char.name.toUpperCase()}: +${bonusGems} GEMS!`, false, "#00d2ff");
          playSound("jackpot", 0.2);
        }
      }
      triggerVisualEffect2(type === "kiss" ? "fx_heart.png" : "fx_sparkle.png", "50%", "30%", 1.2);
    } finally {
      setIsInteracting(false);
    }
  };
  const getActions = () => {
    const actions = [];
    const lvl = char.bondLevel;
    const rel = char.relationship;
    actions.push({ id: "spar", type: "training" });
    actions.push({ id: "gift", type: "friendly" });
    if (onOpenPathChooser) actions.push({ id: "path_select", type: "system" });
    if (inventory?.bond_gift > 0) actions.push({ id: "gift_inv_common", type: "unique" });
    if (inventory?.bond_gift_rare > 0) actions.push({ id: "gift_inv_rare", type: "unique" });
    if (inventory?.bond_gift_epic > 0) actions.push({ id: "gift_inv_epic", type: "unique" });
    const relActions = {
      "Friend": [
        { id: "high_five", lvl: 2 },
        { id: "deep_talk", lvl: 10 },
        { id: "hug", lvl: 25 },
        { id: "hangout", lvl: 35 },
        { id: "cook_together", lvl: 50 }
      ],
      "Romantic": [
        { id: "flirt", lvl: 2 },
        { id: "hold_hands", lvl: 8 },
        { id: "cuddle", lvl: 15 },
        { id: "kiss", lvl: 25 },
        { id: "date", lvl: 40 },
        { id: "makeout", lvl: 60 }
      ],
      "Enemy": [
        { id: "glare", lvl: 2 },
        { id: "insult", lvl: 5 },
        { id: "brawl", lvl: 15 },
        { id: "ambush", lvl: 30 },
        { id: "death_match", lvl: 50 }
      ],
      "Neutral": [
        { id: "compliment", lvl: 3 },
        { id: "headpat", lvl: 18 }
      ]
    };
    let cat = "Neutral";
    if (rel.includes("Friend")) cat = "Friend";
    if (rel.includes("Romantic")) cat = "Romantic";
    if (rel.includes("Enemy")) cat = "Enemy";
    const sharedActions = [
      { id: "high_five", lvl: 1 },
      { id: "spar", lvl: 1 },
      { id: "gift", lvl: 1 }
    ];
    if (rel.includes("Comrade")) {
      [
        { id: "high_five", lvl: 2 },
        { id: "deep_talk", lvl: 8 },
        { id: "spar", lvl: 15 },
        { id: "hangout", lvl: 25 },
        { id: "cook_together", lvl: 45 }
      ].forEach((a) => {
        if (lvl >= a.lvl) actions.push({ ...a, locked: false });
        else if (lvl >= a.lvl - 10) actions.push({ ...a, locked: true, req: `Lv.${a.lvl}` });
      });
    } else {
      relActions[cat].forEach((a) => {
        if (lvl >= a.lvl) actions.push({ ...a, locked: false });
        else if (lvl >= a.lvl - 10) actions.push({ ...a, locked: true, req: `Lv.${a.lvl}` });
      });
    }
    const maxShown = 6;
    const startRank = Math.max(1, lvl - maxShown + 1);
    for (let r = startRank; r <= lvl + 1; r++) {
      actions.push({ id: `bond_rank_${r}`, type: "milestone", rank: r, locked: r > lvl, req: `Lv.${r}` });
    }
    return actions.reverse();
  };
  return /* @__PURE__ */ jsxDEV("div", { className: "social-grid-wrapper custom-scroll", style: { maxHeight: "100%", overflowY: "auto", paddingBottom: 20 }, children: getActions().map((act) => {
    if (act.id === "path_select") {
      const isNeutral = char.relationship === "Neutral";
      return /* @__PURE__ */ jsxDEV("button", { className: "bond-interaction-card", onClick: () => interact("path_select"), style: { borderColor: isNeutral ? "#facc15" : "#f472b6", background: isNeutral ? "rgba(250, 204, 21, 0.15)" : "rgba(244,114,182,0.1)" }, children: [
        /* @__PURE__ */ jsxDEV("div", { className: "interaction-icon", children: /* @__PURE__ */ jsxDEV(Sparkles, { size: 24 }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1533,
          columnNumber: 53
        }) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1533,
          columnNumber: 19
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "interaction-label", children: isNeutral ? "DEFINE PATH" : "CHANGE PATH" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1534,
          columnNumber: 19
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "interaction-sub", children: isNeutral ? "Set Relationship" : "Redefine Relationship" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1535,
          columnNumber: 19
        }),
        isNeutral && /* @__PURE__ */ jsxDEV("div", { style: { position: "absolute", top: 5, right: 5, width: 10, height: 10, background: "#facc15", borderRadius: "50%", boxShadow: "0 0 10px #facc15" }, className: "animate-pulse" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1536,
          columnNumber: 33
        })
      ] }, "path", true, {
        fileName: "<stdin>",
        lineNumber: 1532,
        columnNumber: 16
      });
    }
    if (act.id.startsWith("bond_rank_")) {
      const name = getBondInteractionName(act.rank, char.export_id);
      return /* @__PURE__ */ jsxDEV("button", { className: "memory-node-card", onClick: () => !act.locked && interact(act.id), disabled: isInteracting || act.locked, style: { opacity: act.locked ? 0.5 : 1 }, children: [
        /* @__PURE__ */ jsxDEV("div", { className: "memory-rank", children: [
          "RANK ",
          act.rank,
          " ",
          act.locked && `(LOCKED)`
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 1545,
          columnNumber: 23
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "memory-name", children: act.locked ? "???" : name }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1546,
          columnNumber: 23
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "memory-icon", children: /* @__PURE__ */ jsxDEV(Star, { size: 14 }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1547,
          columnNumber: 52
        }) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1547,
          columnNumber: 23
        })
      ] }, act.id, true, {
        fileName: "<stdin>",
        lineNumber: 1544,
        columnNumber: 19
      });
    }
    const def = {
      spar: { label: "Spar", sub: "Training" },
      gift: { label: "Gift", sub: "$500" },
      gift_inv_common: { label: "Give Charm", sub: "Item" },
      gift_inv_rare: { label: "Give Bouquet", sub: "Item" },
      gift_inv_epic: { label: "Give Prism", sub: "Item" },
      high_five: { label: "High Five", sub: "Friendly" },
      deep_talk: { label: "Deep Talk", sub: "$150" },
      hug: { label: "Hug", sub: "Warmth" },
      hangout: { label: "Hangout", sub: "$300" },
      cook_together: { label: "Cook", sub: "$400" },
      flirt: { label: "Flirt", sub: "Playful" },
      hold_hands: { label: "Hold Hands", sub: "Touch" },
      cuddle: { label: "Cuddle", sub: "Warmth" },
      love_letter: { label: "Love Letter", sub: "$200" },
      kiss: { label: "Kiss", sub: "Romantic" },
      date: { label: "Date", sub: "$1.5k" },
      makeout: { label: "Makeout", sub: "Passion" },
      compliment: { label: "Compliment", sub: "Nice" },
      headpat: { label: "Headpat", sub: "Good job" },
      glare: { label: "Glare", sub: "Hostile" },
      insult: { label: "Insult", sub: "Mock" },
      brawl: { label: "Brawl", sub: "Fight" },
      ambush: { label: "Ambush", sub: "Sneak Atk" },
      death_match: { label: "Death Match", sub: "Lethal" }
    }[act.id] || { label: act.id, sub: "" };
    let icon = /* @__PURE__ */ jsxDEV(Heart, { size: 24 }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 1579,
      columnNumber: 23
    });
    if (char.relationship.includes("Enemy")) icon = /* @__PURE__ */ jsxDEV(Skull, { size: 24 }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 1580,
      columnNumber: 60
    });
    else if (char.relationship.includes("Friend")) icon = /* @__PURE__ */ jsxDEV(Users, { size: 24 }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 1581,
      columnNumber: 66
    });
    return /* @__PURE__ */ jsxDEV("button", { className: "bond-interaction-card", onClick: () => !act.locked && interact(act.id), disabled: isInteracting || act.locked, style: { opacity: act.locked ? 0.5 : 1 }, children: [
      /* @__PURE__ */ jsxDEV("div", { className: "interaction-icon", children: act.locked ? /* @__PURE__ */ jsxDEV(Ban, { size: 24 }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 1586,
        columnNumber: 35
      }) : icon }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 1585,
        columnNumber: 18
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "interaction-label", children: def.label }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 1588,
        columnNumber: 18
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "interaction-sub", children: act.locked ? `Unlock: ${act.req}` : def.sub }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 1589,
        columnNumber: 18
      })
    ] }, act.id, true, {
      fileName: "<stdin>",
      lineNumber: 1584,
      columnNumber: 15
    });
  }) }, void 0, false, {
    fileName: "<stdin>",
    lineNumber: 1527,
    columnNumber: 6
  });
};;

export { SocialView };
