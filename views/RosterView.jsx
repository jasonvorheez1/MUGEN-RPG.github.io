import { Fragment, jsxDEV } from "react/jsx-dev-runtime";
import React, { useState, useMemo } from "react";
import {
  Heart,
  ArrowUpCircle,
  ArrowDownCircle
} from "lucide-react";
import { ELEMENTS } from "../constants.js";
import { TierBadge, CustomSelect } from "../components.jsx";
import { calculateStat, playSound, calculateSubStat } from "../utils.js";

const RosterView = ({ characters = [], setSelectedCharIndex, setView: setView2, unlockedIds = [], shards = {}, setShards, setUnlockedIds, credits = 0, setCredits, playSound: playSound2, skills = [], auraUpgrades = {}, favorites = [], setFavorites }) => {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("power");
  const [sortOrder, setSortOrder] = useState("desc");
  const [filterTier, setFilterTier] = useState("All");
  const [filterGrowth, setFilterGrowth] = useState("All");
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
      return matchesSearch && matchesTier && matchesGrowth;
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
      else if (sortBy === "magic_atk") comparison = Number(calculateSubStat(b, characters, "magic_atk", skills, auraUpgrades)) - Number(calculateSubStat(a, characters, "magic_atk", skills, auraUpgrades));
      else if (sortBy === "magic_def") comparison = Number(calculateSubStat(b, characters, "magic_def", skills, auraUpgrades)) - Number(calculateSubStat(a, characters, "magic_def", skills, auraUpgrades));
      else if (["hp", "atk", "def", "speed"].includes(sortBy)) {
        const valA = calculateStat(a.baseStats?.[sortBy] || 0, a.level, a, characters, sortBy, auraUpgrades);
        const valB = calculateStat(b.baseStats?.[sortBy] || 0, b.level, b, characters, sortBy, auraUpgrades);
        comparison = valB - valA;
      } else if (sortBy === "bond") comparison = (b.bondLevel || 0) - (a.bondLevel || 0);
      return sortOrder === "desc" ? comparison : -comparison;
    });
  }, [characters, search, sortBy, sortOrder, filterTier, filterGrowth, unlockedIds, skills, auraUpgrades, favorites]);
  return /* @__PURE__ */ jsxDEV("div", { style: { padding: "16px 0" }, children: [
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
