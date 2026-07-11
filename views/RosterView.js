import { Fragment, jsxDEV } from "react/jsx-dev-runtime";
import React, { useState, useMemo } from "react";
import {
  Heart,
  ArrowUpCircle,
  ArrowDownCircle
} from "lucide-react";
import { ELEMENTS } from "../constants.js";
import { TierBadge, CustomSelect } from "../components.js";
import { calculateStat, playSound, calculateSubStat, getOptimalLoadout } from "../utils.js";

const RosterView = ({ characters = [], setSelectedCharIndex, setView: setView2, unlockedIds = [], shards = {}, setShards, setUnlockedIds, credits = 0, setCredits, playSound: playSound2, skills = [], auraUpgrades = {}, favorites = [], setFavorites, setCharacters = () => {}, inventory = {}, items = {}, removeFromInventory = () => {}, createFloatingText = () => {}, triggerVisualEffect = () => {}, gearInventory = [], setGearInventory }) => {
  // QoL: "OPTIMIZE ALL" -- runs the same FF-style gear optimizer across every
  // unlocked hero in one pass, highest-Power first, so scarce shared gear
  // flows to whoever benefits most instead of being handed out arbitrarily.
  const [optimizingAll, setOptimizingAll] = useState(false);
  const applyOptimizeAll = () => {
    if (typeof setGearInventory !== "function" || !gearInventory.length) {
      createFloatingText("No gear owned yet", true);
      return;
    }
    setOptimizingAll(true);
    const unlockedChars = characters
      .filter((c) => unlockedIds.map(String).includes(String(c.export_id)))
      .slice()
      .sort((a, b) => Number(calculateSubStat(b, characters, "pwr", skills, auraUpgrades)) - Number(calculateSubStat(a, characters, "pwr", skills, auraUpgrades)));
    const claimed = new Set();
    let changedCount = 0;
    setCharacters((prev) => {
      const byId = new Map(prev.map((c) => [String(c.export_id), c]));
      unlockedChars.forEach((uc) => {
        const c = byId.get(String(uc.export_id));
        if (!c) return;
        const best = getOptimalLoadout(c, gearInventory, claimed);
        const before = c.equipSlots || {};
        if (["weapon", "armor", "trinket"].some((slot) => before[slot] !== best[slot])) {
          changedCount++;
          byId.set(String(uc.export_id), { ...c, equipSlots: best });
        }
      });
      return prev.map((c) => byId.get(String(c.export_id)) || c);
    });
    playSound("equip");
    createFloatingText(changedCount ? `★ OPTIMIZED GEAR FOR ${changedCount} HERO${changedCount === 1 ? "" : "ES"} ★` : "Already optimal across the roster!", false, "#4ade80");
    setOptimizingAll(false);
  };
  // Mass leveling ("Academy"): pour a stockpiled XP item across the whole roster
  // at once instead of one hero at a time -- the fast build-up path for 200+ chars.
  const XP_BULK_VALUES = {
    xp_scroll: 5e3, xp_tome: 25e3, xp_ultra_tome: 25e4, xp_grand_tome: 5e6,
    xp_omega_log: 25e6, xp_soul_gem: 45e6, xp_reality_script: 7e7,
    catalyst_fire: 2e4, catalyst_water: 2e4, catalyst_wind: 2e4, catalyst_light: 2e4, catalyst_dark: 2e4, catalyst_neutral: 25e3,
    cook_pepper_stew: 5e4, cook_melon_salad: 5e4, cook_windy_waffles: 5e4, cook_honey_tart: 5e4, cook_blackened_sausage: 5e4, cook_trail_pretzel: 5e4,
    cook_grand_banquet: 2e6
  };
  const ownedXpItems = Object.keys(XP_BULK_VALUES).filter((id) => (inventory[id] || 0) > 0);
  const [bulkItem, setBulkItem] = useState("");
  const [bulkBusy, setBulkBusy] = useState(false);
  const applyMassLevel = () => {
    const id = bulkItem || ownedXpItems[0];
    if (!id || (inventory[id] || 0) <= 0) { createFloatingText("No XP items in stock", true); return; }
    const per = XP_BULK_VALUES[id];
    let stock = inventory[id] || 0;
    let used = 0, levelsGained = 0;
    // Feed one item at a time to whichever unlocked hero is furthest from 100,
    // so a stockpile lifts the whole roster evenly rather than over-capping one.
    setCharacters((prev) => {
      const next = prev.map((c) => ({ ...c }));
      const pool = () => next.filter((c) => unlockedIds.map(String).includes(String(c.export_id)) && (c.level || 1) < 100)
        .sort((a, b) => (a.level || 1) - (b.level || 1));
      let guard = 0;
      while (stock > 0 && guard < 100000) {
        guard++;
        const p = pool();
        if (!p.length) break;
        const c = p[0];
        const before = c.level || 1;
        c.xp = (c.xp || 0) + per;
        c.nextXp = c.nextXp || Math.floor(100 * Math.pow(1.15, before - 1));
        while (c.xp >= c.nextXp && c.level < 100) {
          c.xp -= c.nextXp;
          c.level = (c.level || 1) + 1;
          c.nextXp = Math.floor(100 * Math.pow(1.15, c.level - 1));
          levelsGained++;
        }
        stock--; used++;
      }
      return next;
    });
    if (used > 0) {
      removeFromInventory(id, used);
      try { triggerVisualEffect("fx_powerup.png", 50, 45, 2.2); } catch (e) {}
      playSound("levelUp");
      createFloatingText(`+${levelsGained} levels across the roster!`, false, "#4ade80");
    } else {
      createFloatingText("All unlocked heroes already Lv.100", false, "#facc15");
    }
  };
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("power");
  const [sortOrder, setSortOrder] = useState("desc");
  const [filterTier, setFilterTier] = useState("All");
  const [filterGrowth, setFilterGrowth] = useState("All");
  // QoL filters: element, series/franchise, and owned/signature toggles.
  const [filterElement, setFilterElement] = useState("All");
  const [filterFranchise, setFilterFranchise] = useState("All");
  const [ownedOnly, setOwnedOnly] = useState(false);
  const [sigOnly, setSigOnly] = useState(false);
  // Set of character names that have a signature (for the "signature" filter + team-building).
  const sigOwners = useMemo(() => new Set((skills || []).filter((s) => s.signature).map((s) => s.owner)), [skills]);
  // All franchises present in the roster, for the series dropdown + series team-building.
  const franchiseList = useMemo(() => Array.from(new Set((characters || []).map((c) => c && c.franchise).filter(Boolean))).sort(), [characters]);
  const processedCharacters = useMemo(() => {
    if (!characters) return [];
    return characters.filter((c) => {
      if (!c) return false;
      const name = c.name || "";
      const franchise = c.franchise || "";
      const matchesSearch = name.toLowerCase().includes(search.toLowerCase()) || franchise.toLowerCase().includes(search.toLowerCase());
      const tier = (c.suggestedTier || c.tier || "C").trim();
      const matchesTier = filterTier === "All" || tier === filterTier || filterTier === "S" && tier === "S+";
      const matchesGrowth = filterGrowth === "All" || c.growthType === filterGrowth;
      const matchesElement = filterElement === "All" || c.element === filterElement;
      const matchesFranchise = filterFranchise === "All" || franchise === filterFranchise;
      const matchesOwned = !ownedOnly || unlockedIds?.includes(c.export_id);
      const matchesSig = !sigOnly || sigOwners.has(name);
      return matchesSearch && matchesTier && matchesGrowth && matchesElement && matchesFranchise && matchesOwned && matchesSig;
    }).sort((a, b) => {
      const aUnlocked = unlockedIds?.includes(a.export_id);
      const bUnlocked = unlockedIds?.includes(b.export_id);
      if (aUnlocked && !bUnlocked) return -1;
      if (!aUnlocked && bUnlocked) return 1;
      const aFav = (favorites || []).includes(a.export_id);
      const bFav = (favorites || []).includes(b.export_id);
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;
      let comparison = 0;
      if (sortBy === "unlocked" || sortBy === "level") comparison = (b.level || 0) - (a.level || 0);
      else if (sortBy === "name") comparison = (a.name || "").localeCompare(b.name || "");
      else if (sortBy === "power") comparison = Number(calculateSubStat(b, characters, "pwr", skills, auraUpgrades)) - Number(calculateSubStat(a, characters, "pwr", skills, auraUpgrades));
      else if (sortBy === "element") comparison = (a.element || "").localeCompare(b.element || "") || (a.name || "").localeCompare(b.name || "");
      else if (sortBy === "franchise") comparison = (a.franchise || "").localeCompare(b.franchise || "") || (a.name || "").localeCompare(b.name || "");
      else if (sortBy === "magic_atk") comparison = Number(calculateSubStat(b, characters, "magic_atk", skills, auraUpgrades)) - Number(calculateSubStat(a, characters, "magic_atk", skills, auraUpgrades));
      else if (sortBy === "magic_def") comparison = Number(calculateSubStat(b, characters, "magic_def", skills, auraUpgrades)) - Number(calculateSubStat(a, characters, "magic_def", skills, auraUpgrades));
      else if (["hp", "atk", "def", "speed"].includes(sortBy)) {
        const valA = calculateStat(a.baseStats?.[sortBy] || 0, a.level, a, characters, sortBy, auraUpgrades);
        const valB = calculateStat(b.baseStats?.[sortBy] || 0, b.level, b, characters, sortBy, auraUpgrades);
        comparison = valB - valA;
      } else if (sortBy === "bond") comparison = (b.bondLevel || 0) - (a.bondLevel || 0);
      return sortOrder === "desc" ? comparison : -comparison;
    });
  }, [characters, search, sortBy, sortOrder, filterTier, filterGrowth, filterElement, filterFranchise, ownedOnly, sigOnly, sigOwners, unlockedIds, skills, auraUpgrades, favorites]);
  const h = React.createElement;
  const massLevelPanel = h("div", { key: "mass-level", className: "glass-panel", style: { padding: 14, marginBottom: 16, borderLeft: "4px solid #4ade80", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 } }, [
    h("div", { key: "hd", style: { minWidth: 150 } }, [
      h("div", { key: "t", style: { fontSize: "0.8rem", fontWeight: 900, color: "#4ade80", letterSpacing: 1 } }, "⚡ THE ACADEMY"),
      h("div", { key: "s", style: { fontSize: "0.6rem", color: "#94a3b8" } }, "Pour XP stock across every unlocked hero at once")
    ]),
    ownedXpItems.length ? h("select", {
      key: "sel", className: "search-bar", style: { margin: 0, height: 40, flex: "1 1 200px", background: "#111", border: "1px solid #333" },
      value: bulkItem || ownedXpItems[0], onChange: (e) => setBulkItem(e.target.value)
    }, ownedXpItems.map((id) => h("option", { key: id, value: id }, `${(items[id] && items[id].name) || id} ×${inventory[id]} (${XP_BULK_VALUES[id].toLocaleString()} XP ea)`)))
      : h("div", { key: "none", style: { flex: 1, fontSize: "0.75rem", color: "#94a3b8", fontStyle: "italic" } }, "No XP items in stock — earn or craft some, then pour them here."),
    h("button", {
      key: "go", className: "train-btn", style: { width: "auto", padding: "10px 22px", opacity: ownedXpItems.length ? 1 : 0.5 },
      disabled: !ownedXpItems.length, onClick: applyMassLevel
    }, "POUR ACROSS ROSTER")
  ]);
  const optimizeAllPanel = h("div", { key: "optimize-all", className: "glass-panel", style: { padding: 14, marginBottom: 16, borderLeft: "4px solid #4ade80", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 } }, [
    h("div", { key: "hd", style: { minWidth: 150, flex: 1 } }, [
      h("div", { key: "t", style: { fontSize: "0.8rem", fontWeight: 900, color: "#4ade80", letterSpacing: 1 } }, "⚡ OPTIMIZE ALL GEAR"),
      h("div", { key: "s", style: { fontSize: "0.6rem", color: "#94a3b8" } }, `Auto-equip the best owned gear (${gearInventory.length} piece${gearInventory.length === 1 ? "" : "s"} owned) across every unlocked hero, strongest first.`)
    ]),
    h("button", {
      key: "go", className: "train-btn", style: { width: "auto", padding: "10px 22px", opacity: gearInventory.length ? 1 : 0.5 },
      disabled: !gearInventory.length || optimizingAll, onClick: applyOptimizeAll
    }, optimizingAll ? "OPTIMIZING…" : "OPTIMIZE ALL")
  ]);
  return /* @__PURE__ */ jsxDEV("div", { style: { padding: "16px 0" }, children: [
    massLevelPanel,
    optimizeAllPanel,
    /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 16 }, children: [
      /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", gap: 8, width: "100%" }, children: [
        /* @__PURE__ */ jsxDEV(
          "input",
          {
            className: "search-bar",
            style: { margin: 0, flex: 1 },
            placeholder: "Search roster...",
            value: search,
            onChange: (e) => setSearch(e.target.value)
          },
          void 0,
          false,
          {
            fileName: "<stdin>",
            lineNumber: 1667,
            columnNumber: 11
          }
        ),
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            className: "filter-chip active",
            style: { height: "44px", width: "44px", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 },
            onClick: () => setSortOrder((s) => s === "asc" ? "desc" : "asc"),
            title: `Sort: ${sortOrder === "asc" ? "Ascending" : "Descending"}`,
            children: sortOrder === "asc" ? /* @__PURE__ */ jsxDEV(ArrowUpCircle, { size: 18 }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 1680,
              columnNumber: 36
            }) : /* @__PURE__ */ jsxDEV(ArrowDownCircle, { size: 18 }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 1680,
              columnNumber: 66
            })
          },
          void 0,
          false,
          {
            fileName: "<stdin>",
            lineNumber: 1674,
            columnNumber: 11
          }
        )
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 1666,
        columnNumber: 9
      }),
      /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", gap: 8, width: "100%", paddingBottom: 4 }, children: [
        /* @__PURE__ */ jsxDEV(
          CustomSelect,
          {
            value: sortBy,
            onChange: (e) => setSortBy(e.target.value),
            style: { width: "180px" },
            options: [
              { value: "unlocked", label: "By Status" },
              { value: "power", label: "By Power (PWR)" },
              { value: "level", label: "By Level" },
              { value: "bond", label: "By Bond" },
              { value: "atk", label: "By Attack" },
              { value: "magic_atk", label: "By Magic Atk" },
              { value: "hp", label: "By Health" },
              { value: "def", label: "By Defense" },
              { value: "magic_def", label: "By Magic Def" },
              { value: "speed", label: "By Speed" },
              { value: "element", label: "By Element" },
              { value: "franchise", label: "By Series" },
              { value: "name", label: "By Name (A-Z)" }
            ]
          },
          void 0,
          false,
          {
            fileName: "<stdin>",
            lineNumber: 1685,
            columnNumber: 11
          }
        ),
        /* @__PURE__ */ jsxDEV(
          CustomSelect,
          {
            value: filterGrowth,
            onChange: (e) => setFilterGrowth(e.target.value),
            style: { width: "150px" },
            options: [
              { value: "All", label: "All Types" },
              { value: "Aggressive", label: "Aggressive" },
              { value: "Defensive", label: "Defensive" },
              { value: "Balanced", label: "Balanced" },
              { value: "Swift", label: "Swift" }
            ]
          },
          void 0,
          false,
          {
            fileName: "<stdin>",
            lineNumber: 1705,
            columnNumber: 11
          }
        )
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 1684,
        columnNumber: 9
      }),
      h("div", { key: "qol-filters", style: { display: "flex", gap: 8, width: "100%", flexWrap: "wrap", paddingBottom: 4, alignItems: "center" } }, [
        h(CustomSelect, {
          key: "el", value: filterElement, onChange: (e) => setFilterElement(e.target.value), style: { width: "140px" },
          options: [{ value: "All", label: "All Elements" }, ...["FIRE", "WATER", "WIND", "LIGHT", "DARK", "EARTH", "NEUTRAL"].map((el) => ({ value: el, label: el.charAt(0) + el.slice(1).toLowerCase() }))]
        }),
        h(CustomSelect, {
          key: "fr", value: filterFranchise, onChange: (e) => setFilterFranchise(e.target.value), style: { width: "180px" },
          options: [{ value: "All", label: "All Series" }, ...franchiseList.map((f) => ({ value: f, label: f.length > 22 ? f.slice(0, 21) + "…" : f }))]
        }),
        h("button", {
          key: "owned", onClick: () => setOwnedOnly((v) => !v),
          style: { padding: "7px 12px", borderRadius: 8, fontSize: "0.62rem", fontWeight: 800, border: ownedOnly ? "2px solid #4ade80" : "1px solid #333", background: ownedOnly ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.04)", color: ownedOnly ? "#4ade80" : "#cbd5e1", cursor: "pointer" }
        }, "OWNED ONLY"),
        h("button", {
          key: "sig", onClick: () => setSigOnly((v) => !v),
          style: { padding: "7px 12px", borderRadius: 8, fontSize: "0.62rem", fontWeight: 800, border: sigOnly ? "2px solid #facc15" : "1px solid #333", background: sigOnly ? "rgba(250,204,21,0.15)" : "rgba(255,255,255,0.04)", color: sigOnly ? "#facc15" : "#cbd5e1", cursor: "pointer" }
        }, "★ HAS SIGNATURE"),
        (filterElement !== "All" || filterFranchise !== "All" || ownedOnly || sigOnly) && h("button", {
          key: "clear", onClick: () => { setFilterElement("All"); setFilterFranchise("All"); setOwnedOnly(false); setSigOnly(false); },
          style: { padding: "7px 10px", borderRadius: 8, fontSize: "0.62rem", fontWeight: 800, border: "1px solid #ef4444", background: "transparent", color: "#fca5a5", cursor: "pointer" }
        }, "CLEAR ×"),
        h("span", { key: "count", style: { fontSize: "0.62rem", fontWeight: 800, color: "#94a3b8", marginLeft: "auto" } }, `${processedCharacters.length} shown`)
      ]),
      /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", gap: 4, width: "100%", overflowX: "auto", paddingBottom: 4 }, children: [
        /* @__PURE__ */ jsxDEV("span", { style: { fontSize: "0.6rem", fontWeight: 900, display: "flex", alignItems: "center", marginRight: 4 }, children: "TIER:" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1720,
          columnNumber: 11
        }),
        ["All", "SS", "S+", "S", "S-", "A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D", "E", "F"].map((t) => /* @__PURE__ */ jsxDEV(
          "button",
          {
            onClick: () => setFilterTier(t),
            className: `filter-chip ${filterTier === t ? "active" : ""}`,
            children: t
          },
          t,
          false,
          {
            fileName: "<stdin>",
            lineNumber: 1722,
            columnNumber: 13
          }
        ))
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 1719,
        columnNumber: 9
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 1665,
      columnNumber: 7
    }),
    /* @__PURE__ */ jsxDEV("div", { className: "roster-grid", children: processedCharacters.map((c, i) => {
      const isUnlocked = unlockedIds?.includes(c.export_id);
      const currentShards = shards[c.export_id] || 0;
      const isFav = favorites.includes(c.export_id);
      const toggleFav = (e) => {
        e.stopPropagation();
        setFavorites((prev) => isFav ? prev.filter((id) => id !== c.export_id) : [...prev, c.export_id]);
        playSound2("ui_select", 0.3);
      };
      return /* @__PURE__ */ jsxDEV(
        "div",
        {
          className: `roster-card roster-card-animated ${!isUnlocked ? "locked-hero" : "unlocked neon-hover"}`,
          style: { animationDelay: `${i % 12 * 0.03}s` },
          onClick: () => {
            if (isUnlocked) {
              setSelectedCharIndex(characters.indexOf(c));
              setView2("train");
            }
          },
          children: [
            isUnlocked && /* @__PURE__ */ jsxDEV(TierBadge, { tier: c.tier }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 1757,
              columnNumber: 30
            }),
            /* @__PURE__ */ jsxDEV("div", { style: { position: "relative" }, children: [
              /* @__PURE__ */ jsxDEV("img", { src: c.imageUrl, alt: c.name }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 1759,
                columnNumber: 17
              }),
              (c.pulls || 0) > 0 && /* @__PURE__ */ jsxDEV("div", { className: "pull-count-badge", title: `Pulled ${c.pulls}\xD7`, style: { position: "absolute", top: 6, left: 6 }, children: `x${c.pulls}` }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 1760,
                columnNumber: 41
              }),
              isUnlocked && /* @__PURE__ */ jsxDEV("button", { onClick: toggleFav, style: { position: "absolute", bottom: 6, right: 6, background: "rgba(0,0,0,0.5)", border: "none", borderRadius: "50%", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", color: isFav ? "#f472b6" : "rgba(255,255,255,0.4)", cursor: "pointer", zIndex: 30 }, children: /* @__PURE__ */ jsxDEV(Heart, { size: 14, fill: isFav ? "#f472b6" : "none" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 1763,
                columnNumber: 21
              }) }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 1762,
                columnNumber: 19
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 1758,
              columnNumber: 15
            }),
            /* @__PURE__ */ jsxDEV("div", { style: { fontWeight: 800, fontSize: "0.85rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }, children: isUnlocked ? c.name : "???" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 1767,
              columnNumber: 15
            }),
            isUnlocked ? /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", justifyContent: "center", gap: "5px", marginTop: "2px" }, children: [
              /* @__PURE__ */ jsxDEV("div", { style: { color: "#e94560", fontSize: "0.7rem", fontWeight: 900 }, children: [
                "LVL ",
                c.level
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 1773,
                columnNumber: 19
              }),
              (c.ascension || 0) > 0 ? /* @__PURE__ */ jsxDEV("div", { style: { color: "#facc15", fontSize: "0.6rem", fontWeight: 900 }, children: [
                "\u2605",
                c.ascension
              ] }, void 0, true, { fileName: "<stdin>", lineNumber: 1, columnNumber: 1 }) : null,
              /* @__PURE__ */ jsxDEV("div", { style: { color: ELEMENTS[c.element]?.color || "#fff", fontSize: "0.6rem", fontWeight: 800 }, children: [
                "\u2022 ",
                c.element
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 1774,
                columnNumber: 19
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 1772,
              columnNumber: 17
            }) : /* @__PURE__ */ jsxDEV("div", { style: { width: "100%" }, children: [
              /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.55rem", color: "#94a3b8", marginTop: 4, textAlign: "center" }, children: "LOCKED" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 1778,
                columnNumber: 20
              }),
              /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.45rem", opacity: 0.5, marginTop: 2 }, children: "Unlock via Gacha" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 1779,
                columnNumber: 20
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 1777,
              columnNumber: 17
            }),
            !isUnlocked && /* @__PURE__ */ jsxDEV("div", { className: "recruit-overlay", children: [
              /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.6rem", fontWeight: 900, color: "#fff" }, children: "UNKNOWN ENTITY" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 1785,
                columnNumber: 20
              }),
              /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.5rem", opacity: 0.7 }, children: c.franchise || "???" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 1786,
                columnNumber: 20
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 1784,
              columnNumber: 17
            })
          ]
        },
        c.export_id,
        true,
        {
          fileName: "<stdin>",
          lineNumber: 1746,
          columnNumber: 13
        }
      );
    }) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 1733,
      columnNumber: 7
    })
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 1664,
    columnNumber: 5
  });
};;

export { RosterView };
