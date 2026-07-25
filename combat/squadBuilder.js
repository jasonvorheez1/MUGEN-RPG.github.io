import { Fragment, jsxDEV } from "react/jsx-dev-runtime";
import React, { useState, useRef, useEffect, useMemo } from "react";
import gsap from "gsap";
import { X, Users, Heart, Crown, ArrowUpCircle, Ban } from "lucide-react";
import { ELEMENTS, LEADER_SKILLS } from "../constants.js";
import { calculateSubStat, formatPower, getCrewChemistryTier, getSkillTags } from "../utils.js";
import { CustomSelect } from "../components.js";
const SquadBuilderModal = ({
  characters,
  unlockedIds,
  squadIds,
  setSquadIds,
  cameoId = null,
  setCameoId = () => {
  },
  onClose,
  playSound: playSound2,
  createFloatingText,
  skills,
  favorites = [],
  filter = null,
  auraUpgrades = {}
}) => {
  const [rosterSearch, setRosterSearch] = useState("");
  const [rosterSort, setRosterSort] = useState("power");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [rosterElementFilter, setRosterElementFilter] = useState("All");
  const [rosterFranchiseFilter, setRosterFranchiseFilter] = useState("All");
  const [rosterTierFilter, setRosterTierFilter] = useState("All");
  const [rosterSigOnly, setRosterSigOnly] = useState(false);
  const [activeTagFilters, setActiveTagFilters] = useState(() => /* @__PURE__ */ new Set());
  const toggleTagFilter = (t) => setActiveTagFilters((prev) => {
    const next = new Set(prev);
    if (next.has(t)) next.delete(t);
    else next.add(t);
    return next;
  });
  const franchiseListSB = useMemo(() => Array.from(new Set((characters || []).map((c) => c && c.franchise).filter(Boolean))).sort(), [characters]);
  const sigOwnersSB = useMemo(() => new Set((skills || []).filter((s) => s.signature).map((s) => s.owner)), [skills]);
  const hasActiveFilters = rosterSearch || favoritesOnly || rosterElementFilter !== "All" || rosterFranchiseFilter !== "All" || rosterTierFilter !== "All" || rosterSigOnly || activeTagFilters.size > 0;
  const clearAllFilters = () => {
    setRosterSearch("");
    setFavoritesOnly(false);
    setRosterElementFilter("All");
    setRosterFranchiseFilter("All");
    setRosterTierFilter("All");
    setRosterSigOnly(false);
    setActiveTagFilters(/* @__PURE__ */ new Set());
  };
  const [cameoPickerOpen, setCameoPickerOpen] = useState(false);
  const [cameoSearch, setCameoSearch] = useState("");
  const [cameoChargeOnly, setCameoChargeOnly] = useState(false);
  const maxSquad = filter && filter.maxSquad || 4;
  useEffect(() => {
    if (squadIds.length > maxSquad) setSquadIds(squadIds.slice(0, maxSquad));
  }, [maxSquad]);
  const overlayRef = useRef(null);
  const headerRef = useRef(null);
  useEffect(() => {
    if (!overlayRef.current) return;
    gsap.fromTo(overlayRef.current, {
      opacity: 0
    }, {
      opacity: 1,
      duration: 0.25,
      ease: "power1.out"
    });
    if (headerRef.current) {
      gsap.fromTo(headerRef.current, {
        y: -40,
        opacity: 0
      }, {
        y: 0,
        opacity: 1,
        duration: 0.5,
        ease: "back.out(1.7)"
      });
    }
  }, []);
  const processRoster = () => {
    let list = characters.filter((c) => unlockedIds.map(String).includes(String(c.export_id)));
    if (filter) {
      list = list.map((c) => {
        let allowed = true;
        if (filter.isWildcard) {
          const counts = characters.reduce((m, char) => {
            const f = char.franchise || "Minor";
            m[f] = (m[f] || 0) + 1;
            return m;
          }, {});
          if (c.franchise && (counts[c.franchise] || 0) >= 3) allowed = false;
        } else if (filter.franchise) {
          const cFranchise = String(c.franchise || "").toLowerCase().trim();
          const reqFranchise = String(filter.franchise).toLowerCase().trim();
          if (cFranchise !== reqFranchise && !cFranchise.includes(reqFranchise)) allowed = false;
        } else if (filter.element && String(c.element) !== String(filter.element)) allowed = false;
        return {
          ...c,
          _restricted: !allowed
        };
      });
    }
    if (favoritesOnly) list = list.filter((c) => favorites.includes(c.export_id));
    if (rosterElementFilter !== "All") list = list.filter((c) => c.element === rosterElementFilter);
    if (rosterFranchiseFilter !== "All") {
      list = list.filter((c) => {
        const f = (c.franchise || "").toLowerCase().trim();
        const target = rosterFranchiseFilter.toLowerCase().trim();
        return f === target || f.includes(target);
      });
    }
    if (rosterTierFilter !== "All") {
      list = list.filter((c) => c.tier === rosterTierFilter || rosterTierFilter === "S" && c.tier === "S+");
    }
    if (rosterSigOnly) list = list.filter((c) => sigOwnersSB.has(c.name));
    if (activeTagFilters.size > 0) {
      list = list.filter((c) => {
        const equipped = [c.skillId, c.skillId2].filter(Boolean).map((id) => (skills || []).find((s) => s.id === id)).filter(Boolean);
        const tags = new Set(equipped.flatMap((s) => getSkillTags(s)));
        return Array.from(activeTagFilters).some((t) => tags.has(t));
      });
    }
    if (rosterSearch) {
      const q = rosterSearch.toLowerCase();
      list = list.filter((c) => {
        if (c.name.toLowerCase().includes(q)) return true;
        if (String(c.franchise || "").toLowerCase().includes(q)) return true;
        if (String(c.element || "").toLowerCase().includes(q)) return true;
        const equipped = [c.skillId, c.skillId2].filter(Boolean).map((id) => (skills || []).find((s) => s.id === id)).filter(Boolean);
        return equipped.some((s) => s.name.toLowerCase().includes(q) || getSkillTags(s).some((t) => t.toLowerCase().includes(q)));
      });
    }
    list.sort((a, b) => {
      if (a._restricted !== b._restricted) return a._restricted ? 1 : -1;
      if (rosterSort === "power") {
        const pwrA = calculateSubStat(a, characters, "pwr", skills, auraUpgrades);
        const pwrB = calculateSubStat(b, characters, "pwr", skills, auraUpgrades);
        return pwrB - pwrA;
      }
      if (rosterSort === "level") return b.level - a.level;
      if (rosterSort === "rarity") {
        const tiers = {
          "SS": 6,
          "S+": 5,
          "S": 4,
          "A": 3,
          "B": 2,
          "C": 1
        };
        return (tiers[b.tier] || 0) - (tiers[a.tier] || 0);
      }
      return a.name.localeCompare(b.name);
    });
    return list;
  };
  const visibleRoster = useMemo(processRoster, [characters, unlockedIds, filter, favoritesOnly, rosterElementFilter, rosterFranchiseFilter, rosterTierFilter, rosterSigOnly, activeTagFilters, rosterSearch, rosterSort, skills, auraUpgrades, sigOwnersSB]);
  const sigForChar = (c) => (skills || []).find((s) => s.signature && s.owner === c.name);
  const cameoEligible = useMemo(() => (characters || []).filter((c) => {
    if (!unlockedIds.map(String).includes(String(c.export_id))) return false;
    const sig = sigForChar(c);
    return sig && (c.signatureUnlocked || c.abilityLevels && c.abilityLevels[sig.id]);
  }), [characters, unlockedIds, skills]);
  const cameoChar = cameoId ? characters.find((c) => String(c.export_id) === String(cameoId)) : null;
  const cameoSig = cameoChar ? sigForChar(cameoChar) : null;
  const h = React.createElement;
  const cameoFiltered = useMemo(() => {
    let list = cameoEligible;
    if (cameoChargeOnly) list = list.filter((c) => getSkillTags(sigForChar(c)).includes("CHARGE-SPEED"));
    if (!cameoSearch) return list;
    const q = cameoSearch.toLowerCase();
    return list.filter((c) => {
      const s = sigForChar(c);
      return c.name.toLowerCase().includes(q) || String(c.franchise || "").toLowerCase().includes(q) || s && s.name.toLowerCase().includes(q);
    });
  }, [cameoEligible, cameoSearch, cameoChargeOnly, skills]);
  const selectCameo = (id) => {
    setCameoId(id);
    setCameoPickerOpen(false);
    setCameoSearch("");
    playSound2(id ? "equip" : "ui_cancel", 0.4);
  };
  const cameoBlock = /* @__PURE__ */ jsxDEV("div", { className: "vanguard-slot-2007", style: {
    marginTop: 10,
    padding: 10,
    border: "1px dashed rgba(0,210,255,0.45)",
    borderRadius: 12,
    background: "rgba(0,210,255,0.04)"
  }, children: [
    /* @__PURE__ */ jsxDEV("div", { style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 6,
      gap: 6
    }, children: [
      /* @__PURE__ */ jsxDEV("span", { style: {
        fontSize: "0.6rem",
        color: "#00d2ff",
        fontWeight: 900,
        letterSpacing: 1
      }, children: "\u2605 GUEST SUMMON \u2014 flashes in to cast their signature (2 uses \xB7 60s)" }, "t", false, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
        lineNumber: 191,
        columnNumber: 8
      }),
      cameoEligible.length > 0 ? /* @__PURE__ */ jsxDEV("span", { style: {
        fontSize: "0.55rem",
        color: "#64748b",
        fontWeight: 800,
        whiteSpace: "nowrap"
      }, children: cameoEligible.length + " AVAIL" }, "c", false, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
        lineNumber: 196,
        columnNumber: 111
      }) : null
    ] }, "hd", true, {
      fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
      lineNumber: 185,
      columnNumber: 6
    }),
    // NOTE: the picker itself used to expand INLINE here, inside a fixed-height
    // 320px sidebar column that's already sharing space with the 5-slot squad
    // list. With 30+ eligible guests that expansion (search bar + a 190px list)
    // regularly got squeezed to near-zero height by the sidebar's own layout,
    // rendering as an empty box with just the search bar visible -- a real bug,
    // not a styling nit. Fixed by moving the open picker OUT of this cramped
    // column entirely into its own full-screen overlay (see cameoPickerOverlay
    // below), so it always has all the room it needs regardless of sidebar size.
    cameoChar ? /* @__PURE__ */ jsxDEV("div", { style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }, children: [
      /* @__PURE__ */ jsxDEV("img", { src: cameoChar.imageUrl, style: {
        width: 40,
        height: 40,
        borderRadius: 6,
        border: "2px solid #00d2ff",
        flexShrink: 0,
        objectFit: "cover"
      } }, "img", false, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
        lineNumber: 214,
        columnNumber: 8
      }),
      /* @__PURE__ */ jsxDEV("div", { style: {
        flex: 1,
        minWidth: 0
      }, children: [
        /* @__PURE__ */ jsxDEV("div", { style: {
          fontSize: "0.78rem",
          fontWeight: 900,
          color: "#fff",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis"
        }, children: cameoChar.name }, "nm", false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
          lineNumber: 224,
          columnNumber: 10
        }),
        cameoSig ? /* @__PURE__ */ jsxDEV("div", { style: {
          fontSize: "0.58rem",
          color: "#94a3b8",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis"
        }, children: cameoSig.name }, "sig", false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
          lineNumber: 231,
          columnNumber: 46
        }) : null,
        // Improvement: previously the only info shown for the selected guest
        // was their name + signature name -- no way to tell what the
        // signature actually DOES without leaving this screen. A couple of
        // mechanic tags (reusing the same tag vocabulary as roster
        // filtering) makes that legible at a glance.
        cameoSig ? /* @__PURE__ */ jsxDEV("div", { style: {
          display: "flex",
          gap: 3,
          marginTop: 2,
          flexWrap: "wrap"
        }, children: getSkillTags(cameoSig).slice(0, 3).map((t) => /* @__PURE__ */ jsxDEV("span", { style: {
          fontSize: "0.5rem",
          fontWeight: 800,
          padding: "1px 5px",
          borderRadius: 8,
          background: "rgba(0,210,255,0.12)",
          color: "#00d2ff"
        }, children: t }, t, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
          lineNumber: 248,
          columnNumber: 57
        })) }, "tags", false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
          lineNumber: 243,
          columnNumber: 20
        }) : null
      ] }, "info", true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
        lineNumber: 221,
        columnNumber: 12
      }),
      /* @__PURE__ */ jsxDEV("button", { className: "sb-chip", style: {
        fontSize: "0.58rem",
        flexShrink: 0
      }, onClick: () => setCameoPickerOpen(true), children: "CHANGE" }, "chg", false, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
        lineNumber: 255,
        columnNumber: 46
      }),
      /* @__PURE__ */ jsxDEV("button", { className: "sb-icon-btn", style: {
        width: 26,
        height: 26,
        flexShrink: 0,
        background: "#ef4444"
      }, onClick: () => selectCameo(null), children: /* @__PURE__ */ jsxDEV(X, { size: 12 }, void 0, false, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
        lineNumber: 263,
        columnNumber: 44
      }) }, "clr", false, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
        lineNumber: 258,
        columnNumber: 66
      })
    ] }, "sel-row", true, {
      fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
      lineNumber: 210,
      columnNumber: 17
    }) : /* @__PURE__ */ jsxDEV("button", { className: "sb-chip", disabled: cameoEligible.length === 0, style: {
      width: "100%",
      textAlign: "center",
      padding: "9px 0",
      fontSize: "0.68rem",
      cursor: cameoEligible.length ? "pointer" : "not-allowed",
      opacity: cameoEligible.length ? 1 : 0.5
    }, onClick: () => cameoEligible.length && setCameoPickerOpen(true), children: cameoEligible.length ? "+ SELECT A GUEST" : "No unlocked signatures yet" }, "open", false, {
      fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
      lineNumber: 263,
      columnNumber: 77
    }),
    cameoChar ? /* @__PURE__ */ jsxDEV("div", { style: {
      fontSize: "0.56rem",
      color: "#64748b",
      marginTop: 6,
      lineHeight: 1.3
    }, children: "Uses YOUR squad's stats to cast this signature when summoned mid-battle." }, "hint", false, {
      fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
      lineNumber: 270,
      columnNumber: 170
    }) : null
  ] }, "cameo-slot", true, {
    fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
    lineNumber: 179,
    columnNumber: 22
  });
  const cameoPickerOverlay = !cameoPickerOpen ? null : /* @__PURE__ */ jsxDEV("div", { className: "cameo-picker-overlay", onClick: (e) => {
    if (e.target === e.currentTarget) {
      setCameoPickerOpen(false);
      setCameoSearch("");
    }
  }, children: /* @__PURE__ */ jsxDEV("div", { className: "cameo-picker-panel", children: [
    /* @__PURE__ */ jsxDEV("div", { className: "cameo-picker-head", children: [
      /* @__PURE__ */ jsxDEV("div", { children: [
        /* @__PURE__ */ jsxDEV("div", { style: {
          fontSize: "1rem",
          fontWeight: 900,
          color: "#00d2ff",
          letterSpacing: 1
        }, children: "\u2605 SELECT GUEST SUMMON" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
          lineNumber: 281,
          columnNumber: 111
        }),
        /* @__PURE__ */ jsxDEV("div", { style: {
          fontSize: "0.65rem",
          color: "#94a3b8",
          marginTop: 3
        }, children: "Flashes in mid-battle to cast their signature using YOUR squad's stats (2 uses \xB7 60s cooldown)." }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
          lineNumber: 286,
          columnNumber: 41
        })
      ] }, "t", true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
        lineNumber: 281,
        columnNumber: 98
      }),
      /* @__PURE__ */ jsxDEV("button", { className: "sb-icon-btn", onClick: () => {
        setCameoPickerOpen(false);
        setCameoSearch("");
      }, children: /* @__PURE__ */ jsxDEV(X, { size: 16 }, void 0, false, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
        lineNumber: 293,
        columnNumber: 12
      }) }, "x", false, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
        lineNumber: 290,
        columnNumber: 121
      })
    ] }, "hd", true, {
      fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
      lineNumber: 281,
      columnNumber: 54
    }),
    /* @__PURE__ */ jsxDEV("input", { className: "search-bar", autoFocus: true, placeholder: "Search guest or signature...", value: cameoSearch, onChange: (e) => setCameoSearch(e.target.value), style: {
      margin: "12px 0",
      width: "100%"
    } }, "search", false, {
      fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
      lineNumber: 293,
      columnNumber: 42
    }),
    /* @__PURE__ */ jsxDEV("div", { style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 8
    }, children: [
      /* @__PURE__ */ jsxDEV("div", { style: {
        fontSize: "0.6rem",
        color: "#64748b",
        fontWeight: 800
      }, children: `${cameoFiltered.length} AVAILABLE` }, "count", false, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
        lineNumber: 301,
        columnNumber: 10
      }),
      /* @__PURE__ */ jsxDEV("button", { className: "sb-chip", style: {
        fontSize: "0.58rem",
        background: cameoChargeOnly ? "rgba(0,210,255,0.25)" : "transparent",
        borderColor: cameoChargeOnly ? "#00d2ff" : void 0,
        color: cameoChargeOnly ? "#00d2ff" : void 0
      }, onClick: () => setCameoChargeOnly((v) => !v), children: "\u26A1 CHARGE-SPEED ONLY" }, "chargeToggle", false, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
        lineNumber: 305,
        columnNumber: 55
      })
    ] }, "filters", true, {
      fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
      lineNumber: 296,
      columnNumber: 12
    }),
    /* @__PURE__ */ jsxDEV("div", { className: "cameo-picker-grid custom-scroll", children: [
      /* @__PURE__ */ jsxDEV("div", { className: `cameo-picker-card ${!cameoId ? "selected" : ""}`, onClick: () => selectCameo(null), children: [
        /* @__PURE__ */ jsxDEV("div", { className: "cameo-picker-card-icon", style: {
          background: "rgba(255,255,255,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }, children: /* @__PURE__ */ jsxDEV(X, { size: 18, color: "#666" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
          lineNumber: 315,
          columnNumber: 14
        }) }, "ic", false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
          lineNumber: 310,
          columnNumber: 262
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "cameo-picker-card-name", children: "No Guest" }, "nm", false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
          lineNumber: 315,
          columnNumber: 48
        })
      ] }, "none", true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
        lineNumber: 310,
        columnNumber: 150
      }),
      cameoFiltered.map((c) => {
        const s = sigForChar(c);
        const selected = String(cameoId) === String(c.export_id);
        const sTags = s ? getSkillTags(s).slice(0, 2) : [];
        return /* @__PURE__ */ jsxDEV("div", { className: `cameo-picker-card ${selected ? "selected" : ""}`, onClick: () => selectCameo(c.export_id), children: [
          /* @__PURE__ */ jsxDEV("img", { className: "cameo-picker-card-icon", src: c.imageUrl }, "img", false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
            lineNumber: 319,
            columnNumber: 144
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "cameo-picker-card-name", children: c.name }, "nm", false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
            lineNumber: 319,
            columnNumber: 213
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "cameo-picker-card-sig", children: s ? s.name : "" }, "sg", false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
            lineNumber: 319,
            columnNumber: 276
          }),
          sTags.length ? /* @__PURE__ */ jsxDEV("div", { style: {
            display: "flex",
            gap: 2,
            justifyContent: "center",
            marginTop: 2,
            flexWrap: "wrap"
          }, children: sTags.map((t) => /* @__PURE__ */ jsxDEV("span", { style: {
            fontSize: "0.45rem",
            fontWeight: 800,
            padding: "1px 4px",
            borderRadius: 6,
            background: "rgba(0,210,255,0.15)",
            color: "#00d2ff"
          }, children: t }, t, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
            lineNumber: 325,
            columnNumber: 32
          })) }, "tg", false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
            lineNumber: 319,
            columnNumber: 363
          }) : null
        ] }, c.export_id, true, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
          lineNumber: 319,
          columnNumber: 18
        });
      }),
      cameoFiltered.length === 0 ? /* @__PURE__ */ jsxDEV("div", { className: "cameo-picker-empty", children: "No matches" }, "empty", false, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
        lineNumber: 333,
        columnNumber: 42
      }) : null
    ] }, "grid", true, {
      fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
      lineNumber: 310,
      columnNumber: 90
    })
  ] }, "panel", true, {
    fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
    lineNumber: 281,
    columnNumber: 6
  }) }, "cameo-picker-overlay", false, {
    fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
    lineNumber: 276,
    columnNumber: 56
  });
  const totalSquadPWR = useMemo(() => squadIds.reduce((sum, id) => {
    const c = characters.find((h2) => String(h2.export_id) === String(id));
    return sum + (c ? calculateSubStat(c, characters, "pwr", skills, auraUpgrades) : 0);
  }, 0), [squadIds, characters, skills, auraUpgrades]);
  const currentSquad = useMemo(() => squadIds.map((id) => characters.find((c) => String(c.export_id) === String(id))).filter(Boolean), [squadIds, characters]);
  const crewChemistry = useMemo(() => getCrewChemistryTier(currentSquad), [currentSquad]);
  const leaderChar = squadIds[0] ? characters.find((c) => String(c.export_id) === String(squadIds[0])) : null;
  const leaderSkill = leaderChar ? LEADER_SKILLS.find((ls) => ls.id === leaderChar.leaderSkillId) : null;
  const toggleSquadMember = (rawId, isRestricted) => {
    if (isRestricted) {
      playSound2("error");
      createFloatingText("Unit Incompatible with Mission Protocol", true);
      return;
    }
    const id = String(rawId);
    setSquadIds((prev) => {
      const prevStr = prev.map((x) => String(x));
      if (prevStr.includes(id)) {
        playSound2("ui_cancel", 0.3);
        return prev.filter((x) => String(x) !== id);
      }
      if (prev.length >= maxSquad) {
        playSound2("ui_cancel", 0.5);
        createFloatingText(`Squad full (${maxSquad})!`, true);
        return prev;
      }
      playSound2("equip", 0.4);
      return [...prev, id];
    });
  };
  const promoteToLeader = (rawId) => {
    const id = String(rawId);
    setSquadIds((prev) => {
      const filtered = prev.filter((x) => String(x) !== id);
      return [id, ...filtered];
    });
    playSound2("equip", 0.5);
    createFloatingText("New Leader Assigned", false, "#facc15");
  };
  const autoFillSquad = () => {
    const candidates = visibleRoster.filter((c) => !c._restricted).slice(0, maxSquad).map((c) => c.export_id);
    if (candidates.length === 0) {
      createFloatingText("No eligible units found", true);
      return;
    }
    setSquadIds(candidates);
    playSound2("equip");
    createFloatingText("Squad Optimized", false, "#4ade80");
  };
  return /* @__PURE__ */ jsxDEV("div", { ref: overlayRef, className: "squad-builder-overlay", children: [
    /* @__PURE__ */ jsxDEV("div", { ref: headerRef, className: "vanguard-glass-header", children: [
      /* @__PURE__ */ jsxDEV("div", { style: {
        display: "flex",
        alignItems: "center",
        gap: 15
      }, children: [
        /* @__PURE__ */ jsxDEV("div", { style: {
          background: filter ? "#ef4444" : "var(--primary)",
          padding: "8px",
          borderRadius: "8px",
          boxShadow: filter ? "0 0 15px #ef4444" : "0 0 15px var(--primary)"
        }, children: /* @__PURE__ */ jsxDEV(Users, { size: 24, color: "#fff" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
          lineNumber: 392,
          columnNumber: 12
        }) }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
          lineNumber: 387,
          columnNumber: 10
        }),
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("h2", { style: {
            margin: 0,
            fontFamily: "Rajdhani",
            fontWeight: 900,
            fontSize: "1.8rem",
            letterSpacing: 2,
            textTransform: "uppercase",
            color: "#fff"
          }, children: filter ? "MEMBERS ONLY" : "YOUR CREW" }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
            lineNumber: 392,
            columnNumber: 55
          }),
          /* @__PURE__ */ jsxDEV("div", { style: {
            fontSize: "0.7rem",
            color: "#94a3b8",
            letterSpacing: 1
          }, children: filter ? "MISSION PARAMETERS ACTIVE" : "STANDARD OPERATING PROCEDURE" }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
            lineNumber: 400,
            columnNumber: 58
          })
        ] }, void 0, true, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
          lineNumber: 392,
          columnNumber: 50
        })
      ] }, void 0, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
        lineNumber: 383,
        columnNumber: 121
      }),
      /* @__PURE__ */ jsxDEV("div", { style: {
        display: "flex",
        gap: 10
      }, children: [
        /* @__PURE__ */ jsxDEV("button", { className: "glossy-btn-blue", style: {
          padding: "8px 16px",
          fontSize: "0.8rem"
        }, onClick: autoFillSquad, children: "AUTO FILL" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
          lineNumber: 407,
          columnNumber: 10
        }),
        /* @__PURE__ */ jsxDEV("button", { className: "glossy-btn-blue", style: {
          padding: "8px 16px",
          fontSize: "0.8rem",
          background: "#ef4444",
          borderColor: "#991b1b",
          boxShadow: "0 4px 0 #7f1d1d"
        }, onClick: () => setSquadIds([]), children: "CLEAR" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
          lineNumber: 410,
          columnNumber: 54
        }),
        /* @__PURE__ */ jsxDEV("button", { className: "glossy-btn-blue", style: {
          padding: "8px 16px",
          fontSize: "0.8rem",
          background: "#334155",
          borderColor: "#1e293b",
          boxShadow: "0 4px 0 #0f172a"
        }, onClick: onClose, children: /* @__PURE__ */ jsxDEV(X, { size: 16 }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
          lineNumber: 422,
          columnNumber: 30
        }) }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
          lineNumber: 416,
          columnNumber: 58
        })
      ] }, void 0, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
        lineNumber: 404,
        columnNumber: 103
      })
    ] }, void 0, true, {
      fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
      lineNumber: 383,
      columnNumber: 66
    }),
    /* @__PURE__ */ jsxDEV("div", { style: {
      display: "flex",
      flex: 1,
      overflow: "hidden",
      gap: 20,
      padding: 20
    }, children: [
      /* @__PURE__ */ jsxDEV("div", { style: {
        width: "320px",
        display: "flex",
        flexDirection: "column",
        gap: 15
      }, children: [
        /* @__PURE__ */ jsxDEV("div", { className: "glass-panel", style: {
          padding: 15,
          background: "rgba(0,0,0,0.4)"
        }, children: [
          /* @__PURE__ */ jsxDEV("div", { style: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10
          }, children: [
            /* @__PURE__ */ jsxDEV("span", { style: {
              fontSize: "0.7rem",
              fontWeight: 900,
              color: "#94a3b8"
            }, children: "TOTAL POWER" }, void 0, false, {
              fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
              lineNumber: 441,
              columnNumber: 14
            }),
            /* @__PURE__ */ jsxDEV("span", { className: "pwr-val-endgame", style: {
              fontSize: "1.4rem"
            }, children: formatPower(totalSquadPWR) }, void 0, false, {
              fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
              lineNumber: 445,
              columnNumber: 34
            })
          ] }, void 0, true, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
            lineNumber: 436,
            columnNumber: 12
          }),
          leaderChar && /* @__PURE__ */ jsxDEV("div", { style: {
            background: "rgba(250, 204, 21, 0.1)",
            border: "1px solid rgba(250, 204, 21, 0.3)",
            padding: 8,
            borderRadius: 8
          }, children: [
            /* @__PURE__ */ jsxDEV("div", { style: {
              fontSize: "0.6rem",
              color: "#facc15",
              fontWeight: 900
            }, children: "ACTIVE RESONANCE" }, void 0, false, {
              fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
              lineNumber: 452,
              columnNumber: 14
            }),
            /* @__PURE__ */ jsxDEV("div", { style: {
              fontSize: "0.8rem",
              color: "#fff",
              fontWeight: 700
            }, children: leaderSkill?.name }, void 0, false, {
              fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
              lineNumber: 456,
              columnNumber: 38
            }),
            /* @__PURE__ */ jsxDEV("div", { style: {
              fontSize: "0.6rem",
              color: "#ccc"
            }, children: leaderSkill?.desc }, void 0, false, {
              fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
              lineNumber: 460,
              columnNumber: 41
            })
          ] }, void 0, true, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
            lineNumber: 447,
            columnNumber: 72
          }),
          crewChemistry ? /* @__PURE__ */ jsxDEV("div", { style: {
            marginTop: 8,
            background: "rgba(244,114,182,0.1)",
            border: "1px solid rgba(244,114,182,0.3)",
            padding: 8,
            borderRadius: 8
          }, children: [
            /* @__PURE__ */ jsxDEV("div", { style: {
              fontSize: "0.6rem",
              color: "#f472b6",
              fontWeight: 900,
              display: "flex",
              alignItems: "center",
              gap: 5
            }, children: [
              /* @__PURE__ */ jsxDEV(Heart, { size: 10, fill: "#f472b6" }, void 0, false, {
                fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
                lineNumber: 476,
                columnNumber: 16
              }),
              crewChemistry.label
            ] }, void 0, true, {
              fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
              lineNumber: 469,
              columnNumber: 14
            }),
            /* @__PURE__ */ jsxDEV("div", { style: {
              fontSize: "0.6rem",
              color: "#ccc"
            }, children: `+${Math.round(crewChemistry.val * 100)}% ATK, +${Math.round(crewChemistry.val * 0.8 * 100)}% DEF for the whole squad \u2014 avg bond ${Math.round(crewChemistry.avgBond)}` }, void 0, false, {
              fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
              lineNumber: 476,
              columnNumber: 77
            })
          ] }, void 0, true, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
            lineNumber: 463,
            columnNumber: 65
          }) : currentSquad.length ? /* @__PURE__ */ jsxDEV("div", { style: {
            marginTop: 8,
            fontSize: "0.58rem",
            color: "#64748b",
            lineHeight: 1.3
          }, children: "Bond with more of your squad (avg LV.10+) to unlock a squad-wide Crew Chemistry buff." }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
            lineNumber: 479,
            columnNumber: 226
          }) : null
        ] }, void 0, true, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
          lineNumber: 433,
          columnNumber: 10
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "custom-scroll", style: {
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 10,
          paddingRight: 5
        }, children: Array.from({
          length: maxSquad
        }).map((_, i) => {
          const heroId = squadIds[i];
          const c = heroId ? characters.find((h2) => String(h2.export_id) === String(heroId)) : null;
          const isLeaderSlot = i === 0;
          return /* @__PURE__ */ jsxDEV("div", { className: `vanguard-slot-2007 ${isLeaderSlot && c ? "active-leader" : ""}`, style: {
            padding: 10,
            display: "flex",
            alignItems: "center",
            gap: 10,
            minHeight: 70
          }, children: [
            /* @__PURE__ */ jsxDEV("div", { style: {
              fontSize: "1.2rem",
              fontWeight: 900,
              color: "rgba(255,255,255,0.1)",
              width: 20,
              textAlign: "center"
            }, children: isLeaderSlot ? /* @__PURE__ */ jsxDEV(Crown, { size: 16, color: "#facc15" }, void 0, false, {
              fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
              lineNumber: 509,
              columnNumber: 34
            }) : i + 1 }, void 0, false, {
              fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
              lineNumber: 503,
              columnNumber: 16
            }),
            c ? /* @__PURE__ */ jsxDEV(Fragment, { children: [
              /* @__PURE__ */ jsxDEV("img", { src: c.imageUrl, style: {
                width: 48,
                height: 48,
                borderRadius: 6,
                border: `2px solid ${ELEMENTS[c.element].color}`
              } }, void 0, false, {
                fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
                lineNumber: 509,
                columnNumber: 91
              }),
              /* @__PURE__ */ jsxDEV("div", { style: {
                flex: 1,
                overflow: "hidden"
              }, children: [
                /* @__PURE__ */ jsxDEV("div", { style: {
                  fontSize: "0.85rem",
                  fontWeight: 900,
                  color: "#fff",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis"
                }, children: c.name }, void 0, false, {
                  fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
                  lineNumber: 517,
                  columnNumber: 20
                }),
                /* @__PURE__ */ jsxDEV("div", { style: {
                  fontSize: "0.65rem",
                  color: ELEMENTS[c.element].color,
                  fontWeight: 800
                }, children: [
                  c.element,
                  " \u2022 PWR ",
                  formatPower(calculateSubStat(c, characters, "pwr", skills, auraUpgrades))
                ] }, void 0, true, {
                  fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
                  lineNumber: 524,
                  columnNumber: 36
                })
              ] }, void 0, true, {
                fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
                lineNumber: 514,
                columnNumber: 22
              }),
              /* @__PURE__ */ jsxDEV("div", { style: {
                display: "flex",
                flexDirection: "column",
                gap: 4
              }, children: [
                !isLeaderSlot && /* @__PURE__ */ jsxDEV("button", { className: "sb-icon-btn", style: {
                  width: 24,
                  height: 24
                }, onClick: () => promoteToLeader(c.export_id), children: /* @__PURE__ */ jsxDEV(ArrowUpCircle, { size: 14 }, void 0, false, {
                  fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
                  lineNumber: 535,
                  columnNumber: 67
                }) }, void 0, false, {
                  fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
                  lineNumber: 532,
                  columnNumber: 38
                }),
                /* @__PURE__ */ jsxDEV("button", { className: "sb-icon-btn", style: {
                  width: 24,
                  height: 24,
                  background: "#ef4444"
                }, onClick: () => toggleSquadMember(c.export_id), children: /* @__PURE__ */ jsxDEV(X, { size: 14 }, void 0, false, {
                  fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
                  lineNumber: 539,
                  columnNumber: 69
                }) }, void 0, false, {
                  fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
                  lineNumber: 535,
                  columnNumber: 104
                })
              ] }, void 0, true, {
                fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
                lineNumber: 528,
                columnNumber: 127
              })
            ] }, void 0, true, {
              fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
              lineNumber: 509,
              columnNumber: 89
            }) : /* @__PURE__ */ jsxDEV("div", { style: {
              flex: 1,
              textAlign: "center",
              fontSize: "0.7rem",
              color: "#555",
              fontWeight: 800,
              letterSpacing: 1
            }, children: isLeaderSlot ? "ASSIGN LEADER" : "EMPTY SLOT" }, void 0, false, {
              fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
              lineNumber: 539,
              columnNumber: 105
            })
          ] }, i, true, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
            lineNumber: 497,
            columnNumber: 20
          });
        }) }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
          lineNumber: 484,
          columnNumber: 119
        }),
        cameoBlock
      ] }, void 0, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
        lineNumber: 428,
        columnNumber: 8
      }),
      /* @__PURE__ */ jsxDEV("div", { style: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        background: "rgba(0,0,0,0.3)",
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.05)",
        overflow: "hidden"
      }, children: [
        /* @__PURE__ */ jsxDEV("div", { style: {
          padding: 15,
          background: "rgba(0,0,0,0.4)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          display: "flex",
          gap: 10,
          alignItems: "center"
        }, children: [
          /* @__PURE__ */ jsxDEV("input", { className: "search-bar", style: {
            margin: 0,
            height: 36,
            fontSize: "0.8rem",
            background: "#111",
            border: "1px solid #333"
          }, placeholder: "Search name / skill / tag (AOE, HEALER, STUN...)", value: rosterSearch, onChange: (e) => setRosterSearch(e.target.value) }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
            lineNumber: 562,
            columnNumber: 12
          }),
          /* @__PURE__ */ jsxDEV("select", { className: "search-bar", style: {
            width: 120,
            margin: 0,
            height: 36,
            fontSize: "0.8rem",
            background: "#111",
            border: "1px solid #333"
          }, value: rosterSort, onChange: (e) => setRosterSort(e.target.value), children: [
            /* @__PURE__ */ jsxDEV("option", { value: "power", children: "Power" }, void 0, false, {
              fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
              lineNumber: 575,
              columnNumber: 79
            }),
            /* @__PURE__ */ jsxDEV("option", { value: "level", children: "Level" }, void 0, false, {
              fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
              lineNumber: 575,
              columnNumber: 115
            }),
            /* @__PURE__ */ jsxDEV("option", { value: "rarity", children: "Rarity" }, void 0, false, {
              fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
              lineNumber: 575,
              columnNumber: 151
            }),
            /* @__PURE__ */ jsxDEV("option", { value: "name", children: "Name" }, void 0, false, {
              fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
              lineNumber: 575,
              columnNumber: 189
            })
          ] }, void 0, true, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
            lineNumber: 568,
            columnNumber: 148
          }),
          /* @__PURE__ */ jsxDEV("button", { className: `sb-chip ${favoritesOnly ? "active" : ""}`, style: {
            height: 36,
            display: "flex",
            alignItems: "center"
          }, onClick: () => setFavoritesOnly(!favoritesOnly), children: /* @__PURE__ */ jsxDEV(Heart, { size: 14, fill: favoritesOnly ? "currentColor" : "none" }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
            lineNumber: 579,
            columnNumber: 63
          }) }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
            lineNumber: 575,
            columnNumber: 232
          })
        ] }, void 0, true, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
          lineNumber: 555,
          columnNumber: 10
        }),
        /* @__PURE__ */ jsxDEV("div", { style: {
          display: "flex",
          gap: 6,
          flexWrap: "wrap",
          padding: "8px 15px",
          background: "rgba(0,0,0,0.3)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          alignItems: "center"
        }, children: [
          /* @__PURE__ */ jsxDEV(CustomSelect, { value: rosterElementFilter, onChange: (e) => setRosterElementFilter(e.target.value), style: {
            width: 134,
            fontSize: "0.7rem"
          }, options: [{
            value: "All",
            label: "All Elements"
          }, ...["FIRE", "WATER", "WIND", "LIGHT", "DARK", "EARTH", "NEUTRAL"].map((el) => ({
            value: el,
            label: el.charAt(0) + el.slice(1).toLowerCase()
          }))] }, "el", false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
            lineNumber: 587,
            columnNumber: 12
          }),
          /* @__PURE__ */ jsxDEV(CustomSelect, { value: rosterFranchiseFilter, onChange: (e) => setRosterFranchiseFilter(e.target.value), style: {
            width: 150,
            fontSize: "0.7rem"
          }, options: [{
            value: "All",
            label: "All Series"
          }, ...franchiseListSB.map((f) => ({
            value: f,
            label: f.length > 20 ? f.slice(0, 19) + "\u2026" : f
          }))] }, "fr", false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
            lineNumber: 596,
            columnNumber: 19
          }),
          /* @__PURE__ */ jsxDEV(CustomSelect, { value: rosterTierFilter, onChange: (e) => setRosterTierFilter(e.target.value), style: {
            width: 120,
            fontSize: "0.7rem"
          }, options: [{
            value: "All",
            label: "All Tiers"
          }, ...["SS", "S+", "S", "A", "B", "C"].map((t) => ({
            value: t,
            label: t
          }))] }, "tr", false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
            lineNumber: 605,
            columnNumber: 19
          }),
          /* @__PURE__ */ jsxDEV("button", { className: `sb-chip ${rosterSigOnly ? "active" : ""}`, style: {
            fontSize: "0.62rem"
          }, onClick: () => setRosterSigOnly((v) => !v), children: "\u2605 SIGNATURE" }, "sig", false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
            lineNumber: 614,
            columnNumber: 19
          }),
          hasActiveFilters ? /* @__PURE__ */ jsxDEV("button", { style: {
            padding: "4px 10px",
            borderRadius: 20,
            fontSize: "0.62rem",
            fontWeight: 800,
            border: "1px solid #ef4444",
            background: "transparent",
            color: "#fca5a5",
            cursor: "pointer"
          }, onClick: () => {
            clearAllFilters();
            playSound2("ui_cancel", 0.3);
          }, children: "CLEAR \xD7" }, "clear", false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
            lineNumber: 616,
            columnNumber: 96
          }) : null,
          /* @__PURE__ */ jsxDEV("span", { style: {
            fontSize: "0.62rem",
            fontWeight: 800,
            color: "#94a3b8",
            marginLeft: "auto",
            whiteSpace: "nowrap"
          }, children: `${visibleRoster.length} shown` }, "count", false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
            lineNumber: 628,
            columnNumber: 38
          })
        ] }, "sb-filters", true, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
          lineNumber: 579,
          columnNumber: 144
        }),
        /* @__PURE__ */ jsxDEV("div", { style: {
          display: "flex",
          gap: 6,
          flexWrap: "wrap",
          padding: "8px 15px",
          background: "rgba(0,0,0,0.3)",
          borderBottom: "1px solid rgba(255,255,255,0.05)"
        }, children: ["AOE", "HEALER", "SUPPORT", "SHIELD", "CONTROL", "DOT", "NUKE", "LIFESTEAL", "CRIT", "EXECUTE", "EXPOSE", "DEF-PIERCE", "STAGGER", "CLEANSE", "REGEN", "BUFF-STEAL", "DISPEL", "SLOW", "FAST", "MULTI-HIT", "TEAM-WIDE", "SIGNATURE", "CHARGE-SPEED"].map((t) => /* @__PURE__ */ jsxDEV("button", { className: `sb-chip ${activeTagFilters.has(t) ? "active" : ""}`, style: {
          fontSize: "0.6rem",
          padding: "3px 9px"
        }, onClick: () => toggleTagFilter(t), children: t }, t, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
          lineNumber: 641,
          columnNumber: 269
        })) }, "sb-tags", false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
          lineNumber: 634,
          columnNumber: 60
        }),
        filter && /* @__PURE__ */ jsxDEV("div", { style: {
          background: "rgba(239, 68, 68, 0.1)",
          padding: "8px 15px",
          borderBottom: "1px solid #ef444444",
          display: "flex",
          alignItems: "center",
          gap: 10
        }, children: [
          /* @__PURE__ */ jsxDEV(Ban, { size: 14, color: "#ef4444" }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
            lineNumber: 651,
            columnNumber: 12
          }),
          /* @__PURE__ */ jsxDEV("span", { style: {
            fontSize: "0.7rem",
            color: "#ef4444",
            fontWeight: 900
          }, children: "RESTRICTED: " }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
            lineNumber: 651,
            columnNumber: 45
          }),
          /* @__PURE__ */ jsxDEV("span", { style: {
            fontSize: "0.7rem",
            color: "#fff"
          }, children: filter.franchise ? `Must be ${filter.franchise}` : filter.element ? `Must be ${filter.element}` : `Must be Minor Franchise` }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
            lineNumber: 655,
            columnNumber: 33
          })
        ] }, void 0, true, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
          lineNumber: 644,
          columnNumber: 80
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "sb-roster-grid custom-scroll", style: {
          padding: 10,
          gap: 8,
          background: "#08080a"
        }, children: visibleRoster.map((c) => {
          const isSelected = squadIds.map(String).includes(String(c.export_id));
          const isRestricted = !!c._restricted;
          return /* @__PURE__ */ jsxDEV("div", { className: `sb-hero-row-card ${isSelected ? "selected" : ""} ${isRestricted ? "restricted" : ""}`, style: {
            height: 50,
            borderRadius: 8,
            background: isSelected ? "linear-gradient(90deg, rgba(255,0,127,0.14), rgba(0,210,255,0.1))" : "rgba(255,255,255,0.03)",
            borderColor: isSelected ? "#00d2ff" : "transparent",
            boxShadow: isSelected ? "0 0 10px rgba(0,210,255,0.3)" : "none",
            opacity: isRestricted ? 0.4 : 1
          }, onClick: () => toggleSquadMember(c.export_id, isRestricted), children: [
            /* @__PURE__ */ jsxDEV("img", { src: c.imageUrl, style: {
              width: 36,
              height: 36,
              borderRadius: 6,
              objectFit: "cover"
            } }, void 0, false, {
              fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
              lineNumber: 672,
              columnNumber: 77
            }),
            /* @__PURE__ */ jsxDEV("div", { style: {
              flex: 1,
              overflow: "hidden",
              paddingLeft: 8
            }, children: [
              /* @__PURE__ */ jsxDEV("div", { style: {
                fontSize: "0.8rem",
                fontWeight: 900,
                color: isSelected ? "#00d2ff" : isRestricted ? "#ef4444" : "#fff",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }, children: c.name }, void 0, false, {
                fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
                lineNumber: 681,
                columnNumber: 18
              }),
              /* @__PURE__ */ jsxDEV("div", { style: {
                fontSize: "0.6rem",
                color: "#888"
              }, children: [
                "PWR ",
                formatPower(calculateSubStat(c, characters, "pwr", skills, auraUpgrades)),
                " \u2022 ",
                c.element,
                sigOwnersSB.has(c.name) ? " \u2022 \u2605SIG" : ""
              ] }, void 0, true, {
                fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
                lineNumber: 688,
                columnNumber: 34
              })
            ] }, void 0, true, {
              fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
              lineNumber: 677,
              columnNumber: 20
            }),
            favorites.includes(c.export_id) ? /* @__PURE__ */ jsxDEV(Heart, { size: 13, fill: "#f472b6", color: "#f472b6", style: {
              flexShrink: 0
            } }, "fav", false, {
              fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
              lineNumber: 691,
              columnNumber: 212
            }) : null,
            isSelected && /* @__PURE__ */ jsxDEV("div", { style: {
              color: "#00d2ff",
              fontWeight: 900,
              fontSize: "0.7rem",
              textShadow: "0 0 6px rgba(0,210,255,0.8)"
            }, children: "ACTIVE" }, void 0, false, {
              fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
              lineNumber: 693,
              columnNumber: 43
            }),
            isRestricted && /* @__PURE__ */ jsxDEV(Ban, { size: 14, color: "#ef4444" }, void 0, false, {
              fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
              lineNumber: 698,
              columnNumber: 48
            })
          ] }, c.export_id, true, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
            lineNumber: 665,
            columnNumber: 20
          });
        }) }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
          lineNumber: 658,
          columnNumber: 153
        })
      ] }, void 0, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
        lineNumber: 547,
        columnNumber: 38
      })
    ] }, void 0, true, {
      fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
      lineNumber: 422,
      columnNumber: 66
    }),
    cameoPickerOverlay,
    /* @__PURE__ */ jsxDEV("div", { style: {
      padding: "15px 20px",
      background: "rgba(0,0,0,0.6)",
      borderTop: "1px solid rgba(255,255,255,0.1)",
      display: "flex",
      justifyContent: "center"
    }, children: /* @__PURE__ */ jsxDEV("button", { className: "glossy-btn-green", style: {
      width: 300,
      padding: "14px",
      fontSize: "1rem",
      letterSpacing: 2,
      textTransform: "uppercase"
    }, onClick: onClose, children: "CONFIRM CONFIGURATION" }, void 0, false, {
      fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
      lineNumber: 705,
      columnNumber: 8
    }) }, void 0, false, {
      fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
      lineNumber: 699,
      columnNumber: 52
    })
  ] }, void 0, true, {
    fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\combat\\squadBuilder.jsx",
    lineNumber: 383,
    columnNumber: 10
  });
};
export {
  SquadBuilderModal
};
