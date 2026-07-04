import React, { useState, useRef, useMemo, useEffect } from "react";
import gsap from "gsap";
import { playSound } from "../utils.js";

// "LUCKY 7s" -- a high-risk backroom slot machine. Costs BOTH stamina and cash per
// pull. Most pulls bust; rare pulls pay out better gear than the gacha plus character
// shards. Collect 50 shards on the featured recruit to unlock them (or, if you already
// own them, bank a dupe that permanently boosts their stats).
const SHARD_GOAL = 50;
const SPIN_STAMINA = 40;
const SPIN_CREDITS = 75000;

// Reels are weighted toward BUST -- this is meant to be a gamble.
const SYMBOLS = [
  { id: "bust", icon: "💀", weight: 34, label: "Bust" },
  { id: "cherry", icon: "🍒", weight: 22, label: "Cherry" },
  { id: "bell", icon: "🔔", weight: 16, label: "Bell" },
  { id: "shard", icon: "🎴", weight: 11, label: "Shard" },
  { id: "gem", icon: "💎", weight: 9, label: "Gem" },
  { id: "star", icon: "⭐", weight: 5, label: "Star" },
  { id: "seven", icon: "7️⃣", weight: 3, label: "Lucky 7" }
];
const WEIGHTED = SYMBOLS.flatMap((s) => Array(s.weight).fill(s.id));
const ICON = Object.fromEntries(SYMBOLS.map((s) => [s.id, s.icon]));
const rollSymbol = () => WEIGHTED[Math.floor(Math.random() * WEIGHTED.length)];

const LEGENDARY_ITEMS = ["multiverse_core", "void_capsule", "ascension_injector", "omega_serum", "paradox_core", "bond_eternal_crystal", "xp_grand_tome"];
const EPIC_ITEMS = ["stamina_xl", "xp_ultra_tome", "bond_gift_epic", "treasure_resonant_core"];
const RARE_ITEMS = ["stamina_large", "xp_tome", "bond_gift_rare"];
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const SlotView = ({
  stamina, setStamina, maxStamina,
  credits, setCredits,
  gems, setGems,
  aura, setAura,
  materials, setMaterials,
  characters = [], unlockedIds = [], setUnlockedIds,
  shards = {}, setShards, setCharacters,
  addToInventory, createFloatingText
}) => {
  const h = React.createElement;
  const [reels, setReels] = useState(["seven", "shard", "cherry"]);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const machineRef = useRef(null);
  const reelRefs = [useRef(null), useRef(null), useRef(null)];

  // Featured recruit for shards: a deterministic daily pick from the locked roster
  // (falls back to any character if everything's unlocked).
  const featured = useMemo(() => {
    const locked = characters.filter((c) => !unlockedIds.map(String).includes(String(c.export_id)));
    const pool = locked.length ? locked : characters;
    if (!pool.length) return null;
    const day = Math.floor(Date.now() / 864e5);
    return pool[day % pool.length];
  }, [characters, unlockedIds]);

  const featShards = featured ? (shards[featured.export_id] || 0) : 0;

  const grantShards = (n) => {
    if (!featured || !setShards) return;
    setShards((prev) => {
      const key = featured.export_id;
      let total = (prev[key] || 0) + n;
      let converted = 0;
      while (total >= SHARD_GOAL) {
        total -= SHARD_GOAL;
        converted++;
      }
      if (converted > 0) {
        const owned = unlockedIds.map(String).includes(String(featured.export_id));
        if (!owned && setUnlockedIds) {
          setUnlockedIds((ids) => Array.from(new Set([...ids, featured.export_id])));
          createFloatingText(`★ RECRUITED ${featured.name.toUpperCase()}!`, false, "#facc15");
          playSound("gacha_legendary");
          // Any extra conversions beyond the first become dupes.
          if (converted > 1 && setCharacters) {
            setCharacters((cs) => cs.map((c) => c.export_id === featured.export_id ? { ...c, pulls: (c.pulls || 0) + (converted - 1) } : c));
          }
        } else if (setCharacters) {
          setCharacters((cs) => cs.map((c) => c.export_id === featured.export_id ? { ...c, pulls: (c.pulls || 0) + converted } : c));
          createFloatingText(`${featured.name} DUPE x${converted} — stats up!`, false, "#a855f7");
          playSound("gacha_epic");
        }
      }
      return { ...prev, [featured.export_id]: total };
    });
  };

  const evaluate = (r) => {
    const [a, b, c] = r;
    const all3 = a === b && b === c;
    const counts = {};
    r.forEach((s) => counts[s] = (counts[s] || 0) + 1);
    const shardCount = counts.shard || 0;

    if (all3 && a === "seven") {
      const g = 2500, sh = 25;
      setGems((x) => x + g); grantShards(sh);
      const it = pick(LEGENDARY_ITEMS); addToInventory(it);
      playSound("jackpot");
      if (machineRef.current) gsap.fromTo(machineRef.current, { scale: 1 }, { scale: 1.04, duration: 0.12, yoyo: true, repeat: 5, ease: "power1.inOut" });
      return { tier: "JACKPOT", color: "#facc15", text: `LUCKY 7s!! +${g} Gems, a Legendary, +${sh} shards!` };
    }
    if (all3 && a === "shard") {
      const sh = 20; grantShards(sh);
      playSound("gacha_legendary");
      return { tier: "SHARD RUSH", color: "#00d2ff", text: `Three of a kind — +${sh} ${featured ? featured.name : ""} shards!` };
    }
    if (all3 && a === "star") {
      const au = 4000; setAura((x) => x + au);
      const it = pick(LEGENDARY_ITEMS); addToInventory(it);
      playSound("gacha_legendary");
      return { tier: "STARSTRUCK", color: "#f472b6", text: `+${au} Star Power and a Legendary drop!` };
    }
    if (all3 && a === "gem") {
      const g = 900, sh = 10; setGems((x) => x + g); grantShards(sh);
      const it = pick(EPIC_ITEMS); addToInventory(it);
      playSound("gacha_epic");
      return { tier: "BIG WIN", color: "#22c55e", text: `+${g} Gems, an Epic, +${sh} shards!` };
    }
    if (all3) {
      const cr = SPIN_CREDITS * 4; setCredits((x) => x + cr);
      const it = pick(RARE_ITEMS); addToInventory(it);
      playSound("success");
      return { tier: "MATCH", color: "#4ade80", text: `Three ${ICON[a]} — credits back + a Rare item!` };
    }
    if (shardCount >= 2) {
      const sh = 5; grantShards(sh);
      playSound("gacha_results");
      return { tier: "SHARDS", color: "#00d2ff", text: `+${sh} ${featured ? featured.name : ""} shards.` };
    }
    // any two-of-a-kind consolation
    const pairSym = Object.keys(counts).find((k) => counts[k] === 2 && k !== "bust");
    if (pairSym) {
      const mat = 30000; setMaterials((x) => x + mat);
      playSound("ui_select", 0.4);
      return { tier: "SMALL", color: "#94a3b8", text: `Pair of ${ICON[pairSym]} — +${mat.toLocaleString()} Materials.` };
    }
    playSound("error", 0.4);
    playSound("mugen_timeover", 0.5);
    return { tier: "BUST", color: "#ef4444", text: "Nothing. The house always wins... try again." };
  };

  const spin = () => {
    if (spinning) return;
    if (stamina < SPIN_STAMINA) { createFloatingText(`Need ${SPIN_STAMINA} Stamina`, true); playSound("error"); return; }
    if (credits < SPIN_CREDITS) { createFloatingText(`Need $${SPIN_CREDITS.toLocaleString()}`, true); playSound("error"); return; }
    setStamina((s) => s - SPIN_STAMINA);
    setCredits((c) => c - SPIN_CREDITS);
    setSpinning(true);
    setResult(null);
    playSound("reel_spin", 0.6);
    const final = [rollSymbol(), rollSymbol(), rollSymbol()];
    // Cycle each reel fast, then settle them left-to-right with a spin SFX per stop.
    const cyclers = reelRefs.map((_, i) => setInterval(() => {
      setReels((prev) => { const n = [...prev]; n[i] = rollSymbol(); return n; });
    }, 70));
    const stopReel = (i) => {
      clearInterval(cyclers[i]);
      setReels((prev) => { const n = [...prev]; n[i] = final[i]; return n; });
      playSound("spin" + i, 0.5);
      if (reelRefs[i].current) gsap.fromTo(reelRefs[i].current, { y: -14 }, { y: 0, duration: 0.3, ease: "bounce.out" });
    };
    setTimeout(() => stopReel(0), 700);
    setTimeout(() => stopReel(1), 1050);
    setTimeout(() => {
      stopReel(2);
      setSpinning(false);
      setResult(evaluate(final));
    }, 1400);
  };

  useEffect(() => () => { /* cleanup handled by component unmount */ }, []);

  const canAfford = stamina >= SPIN_STAMINA && credits >= SPIN_CREDITS;
  const shardPct = Math.min(100, featShards / SHARD_GOAL * 100);

  return h("div", { className: "slot-view custom-scroll" },
    h("div", { className: "slot-header" },
      h("div", { className: "slot-title" }, "LUCKY 7s"),
      h("div", { className: "slot-subtitle" }, "The backroom never closes • high risk, high reward")
    ),
    h("div", { className: "slot-cabinet", ref: machineRef },
      h("div", { className: "slot-marquee" }, "★ JACKPOT ★"),
      h("div", { className: "slot-reels" },
        reels.map((sym, i) => h("div", { key: i, className: "slot-reel" },
          h("div", { className: "slot-symbol", ref: reelRefs[i] }, ICON[sym])
        ))
      ),
      result && h("div", { className: "slot-result", style: { color: result.color, borderColor: result.color } },
        h("div", { className: "slot-result-tier" }, result.tier),
        h("div", { className: "slot-result-text" }, result.text)
      ),
      !result && h("div", { className: "slot-result slot-result-idle" },
        h("div", { className: "slot-result-text" }, spinning ? "Spinning..." : "Pull the lever, see what the night gives you.")
      ),
      h("button", {
        className: "slot-lever-btn",
        disabled: spinning || !canAfford,
        onClick: spin
      },
        spinning ? "SPINNING..." : h(React.Fragment, null,
          "PULL  •  ", h("span", { style: { color: "#facc15" } }, "$" + SPIN_CREDITS.toLocaleString()),
          "  +  ", h("span", { style: { color: "#4ade80" } }, SPIN_STAMINA + " STA")
        )
      )
    ),
    featured && h("div", { className: "slot-recruit-card" },
      h("img", { src: featured.imageUrl, className: "slot-recruit-img", alt: featured.name }),
      h("div", { className: "slot-recruit-info" },
        h("div", { className: "slot-recruit-label" }, unlockedIds.map(String).includes(String(featured.export_id)) ? "TONIGHT'S DUPE FEATURE" : "TONIGHT'S RECRUIT"),
        h("div", { className: "slot-recruit-name" }, unlockedIds.map(String).includes(String(featured.export_id)) ? featured.name : "??? • " + (featured.franchise || "Mystery")),
        h("div", { className: "slot-shard-bar" },
          h("div", { className: "slot-shard-fill", style: { width: shardPct + "%" } })
        ),
        h("div", { className: "slot-shard-count" }, "🎴 " + featShards + " / " + SHARD_GOAL + " shards")
      )
    ),
    h("div", { className: "slot-paytable" },
      h("div", { className: "slot-paytable-title" }, "HOUSE PAYOUTS"),
      [
        ["7️⃣ 7️⃣ 7️⃣", "Jackpot — Gems + Legendary + 25 shards"],
        ["🎴 🎴 🎴", "+20 recruit shards"],
        ["⭐ ⭐ ⭐", "Star Power + Legendary"],
        ["💎 💎 💎", "Gems + Epic + 10 shards"],
        ["🍒 🍒 🍒 / 🔔🔔🔔", "Credits back + Rare item"],
        ["🎴 🎴", "+5 recruit shards"],
        ["Any pair", "Materials consolation"]
      ].map(([k, v], i) => h("div", { key: i, className: "slot-pay-row" },
        h("span", { className: "slot-pay-combo" }, k),
        h("span", { className: "slot-pay-reward" }, v)
      ))
    )
  );
};

export { SlotView };
