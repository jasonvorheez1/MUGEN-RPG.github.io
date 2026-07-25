import { jsxDEV } from "react/jsx-dev-runtime";
import { Plus, Info } from "lucide-react";
import { BOSS_ROSTER, ELEMENTS, EQUIPMENT } from "../../constants.js";
import { rollEnemyGear, seededRandom } from "../../utils.js";
const RARITY_COLOR = { Common: "#94a3b8", Rare: "#38bdf8", Epic: "#a855f7", Legendary: "#facc15", Mythic: "#ff2ecb" };
const SquadRequirements = ({ pendingTrial, characters, squadIds, unlockedIds, franchiseCounts, extractFranchise }) => {
  const squad = characters.filter((c) => (squadIds || []).some((id) => String(id) === String(c.export_id)));
  const unlockedRoster = characters.filter((c) => unlockedIds.includes(c.export_id));
  const frMatch = (c, t) => {
    const f = (extractFranchise(c) || "").toLowerCase().trim();
    const tt = String(t).toLowerCase().trim();
    return f === tt || f.includes(tt);
  };
  const rosterCanFr = pendingTrial.franchise ? unlockedRoster.some((c) => frMatch(c, pendingTrial.franchise)) : true;
  const rosterCanEl = pendingTrial.element ? unlockedRoster.some((c) => String(c.element).toUpperCase() === String(pendingTrial.element).toUpperCase()) : true;
  const rosterCanWildcard = pendingTrial.isWildcard ? unlockedRoster.some((c) => {
    const f = extractFranchise(c) || "Minor";
    return !f || (franchiseCounts[f] || 0) < 3;
  }) : true;
  const reqs = [];
  if (pendingTrial.franchise) reqs.push({ label: `${pendingTrial.franchise} hero`, waived: !rosterCanFr, met: squad.some((c) => frMatch(c, pendingTrial.franchise)) });
  if (pendingTrial.element) reqs.push({ label: `${pendingTrial.element} hero`, waived: !rosterCanEl, met: squad.some((c) => String(c.element).toUpperCase() === String(pendingTrial.element).toUpperCase()) });
  if (pendingTrial.isWildcard) reqs.push({
    label: "Wildcard (minor series) hero",
    waived: !rosterCanWildcard,
    met: squad.some((c) => {
      const f = extractFranchise(c) || "Minor";
      return !f || (franchiseCounts[f] || 0) < 3;
    })
  });
  return /* @__PURE__ */ jsxDEV("div", { style: { background: "rgba(233,69,96,0.08)", border: "1px solid var(--primary)", borderRadius: 12, padding: "10px 12px", marginBottom: 15, textAlign: "left" }, children: [
    /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.6rem", fontWeight: 900, color: "var(--primary)", letterSpacing: 2, marginBottom: 7 }, children: "WHO'S GETTING IN" }, void 0, false, {
      fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\PreTrialModal.jsx",
      lineNumber: 51,
      columnNumber: 7
    }),
    /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", flexWrap: "wrap", gap: 6 }, children: reqs.map((r, i) => {
      const col = r.waived ? "#94a3b8" : r.met ? "#4ade80" : "#f87171";
      return /* @__PURE__ */ jsxDEV("span", { style: { fontSize: "0.66rem", fontWeight: 800, padding: "3px 9px", borderRadius: 20, background: r.waived ? "rgba(148,163,184,0.12)" : r.met ? "rgba(74,222,128,0.13)" : "rgba(239,68,68,0.13)", color: col, border: "1px solid " + col + "44" }, children: (r.waived ? "\u2014 " : r.met ? "\u2713 " : "\u2717 ") + r.label + (r.waived ? " (waived)" : "") }, i, false, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\PreTrialModal.jsx",
        lineNumber: 56,
        columnNumber: 13
      });
    }) }, void 0, false, {
      fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\PreTrialModal.jsx",
      lineNumber: 52,
      columnNumber: 7
    })
  ] }, void 0, true, {
    fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\PreTrialModal.jsx",
    lineNumber: 50,
    columnNumber: 5
  });
};
const ScoutReport = ({ pendingTrial }) => {
  const bossPick = BOSS_ROSTER[Math.abs(pendingTrial.id.length + pendingTrial.id.charCodeAt(0)) % BOSS_ROSTER.length];
  const isDuoTrial = pendingTrial.difficulty === "hard" || pendingTrial.difficulty === "expert";
  const bossEntries = isDuoTrial ? [bossPick, BOSS_ROSTER.find((b) => b.name === bossPick.duoPartner) || bossPick] : [bossPick];
  const bossGearTier = { easy: 1, medium: 2, hard: 3, expert: 4 }[pendingTrial.difficulty] ?? 2;
  const gearRoll = seededRandom(pendingTrial.id + "_gear");
  return /* @__PURE__ */ jsxDEV("div", { style: { background: "rgba(0,0,0,0.3)", padding: 12, borderRadius: 14, marginBottom: 15 }, children: [
    /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.6rem", fontWeight: 900, color: "#facc15", letterSpacing: 2, marginBottom: 8 }, children: "SCOUT REPORT" }, void 0, false, {
      fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\PreTrialModal.jsx",
      lineNumber: 78,
      columnNumber: 7
    }),
    /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", flexDirection: "column", gap: 8 }, children: bossEntries.map((boss) => {
      const gear = rollEnemyGear(bossGearTier, gearRoll);
      return /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
        /* @__PURE__ */ jsxDEV("img", { src: boss.img, style: { width: 32, height: 32, borderRadius: 8, objectFit: "cover", border: `1px solid ${ELEMENTS[boss.element]?.color || "#fff"}` } }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\PreTrialModal.jsx",
          lineNumber: 84,
          columnNumber: 15
        }),
        /* @__PURE__ */ jsxDEV("span", { style: { fontWeight: 800, fontSize: "0.68rem", minWidth: 90 }, children: boss.name }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\PreTrialModal.jsx",
          lineNumber: 85,
          columnNumber: 15
        }),
        /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", flexWrap: "wrap", gap: 4 }, children: gear.map((g) => {
          const item = (EQUIPMENT[g.slot] || []).find((it) => it.id === g.itemId);
          if (!item) return null;
          const rc = RARITY_COLOR[item.rarity];
          return /* @__PURE__ */ jsxDEV("span", { title: item.name, style: { fontSize: "0.56rem", fontWeight: 800, padding: "2px 6px", borderRadius: 10, color: rc, border: `1px solid ${rc}66`, background: `${rc}18` }, children: `${item.name} +${g.level}` }, g.slot, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\PreTrialModal.jsx",
            lineNumber: 92,
            columnNumber: 21
          });
        }) }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\PreTrialModal.jsx",
          lineNumber: 86,
          columnNumber: 15
        })
      ] }, boss.name, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\PreTrialModal.jsx",
        lineNumber: 83,
        columnNumber: 13
      });
    }) }, void 0, false, {
      fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\PreTrialModal.jsx",
      lineNumber: 79,
      columnNumber: 7
    })
  ] }, void 0, true, {
    fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\PreTrialModal.jsx",
    lineNumber: 77,
    columnNumber: 5
  });
};
const PreTrialModal = (props) => {
  const {
    characters,
    unlockedIds,
    squadIds,
    setShowSquadBuilder,
    pendingTrial,
    setPendingTrial,
    franchiseCounts,
    extractFranchise,
    startTrial
  } = props;
  return /* @__PURE__ */ jsxDEV("div", { className: "hero-select-modal animate-fadeIn", style: { display: "flex", flexDirection: "column" }, children: [
    /* @__PURE__ */ jsxDEV("div", { className: "modal-header", children: [
      /* @__PURE__ */ jsxDEV("div", { children: [
        /* @__PURE__ */ jsxDEV("h2", { style: { margin: 0, color: pendingTrial.element ? ELEMENTS[pendingTrial.element].color : "#fff" }, children: pendingTrial.name }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\PreTrialModal.jsx",
          lineNumber: 116,
          columnNumber: 11
        }),
        /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.8rem", opacity: 0.7, maxWidth: "400px", marginTop: 4 }, children: pendingTrial.desc }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\PreTrialModal.jsx",
          lineNumber: 117,
          columnNumber: 11
        })
      ] }, void 0, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\PreTrialModal.jsx",
        lineNumber: 115,
        columnNumber: 9
      }),
      /* @__PURE__ */ jsxDEV("button", { className: "upgrade-btn", style: { padding: "10px 20px" }, onClick: () => setPendingTrial(null), children: "CANCEL" }, void 0, false, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\PreTrialModal.jsx",
        lineNumber: 119,
        columnNumber: 9
      })
    ] }, void 0, true, {
      fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\PreTrialModal.jsx",
      lineNumber: 114,
      columnNumber: 7
    }),
    (pendingTrial.franchise || pendingTrial.element || pendingTrial.isWildcard) && /* @__PURE__ */ jsxDEV(
      SquadRequirements,
      {
        pendingTrial,
        characters,
        squadIds,
        unlockedIds,
        franchiseCounts,
        extractFranchise
      },
      void 0,
      false,
      {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\PreTrialModal.jsx",
        lineNumber: 123,
        columnNumber: 9
      }
    ),
    /* @__PURE__ */ jsxDEV(ScoutReport, { pendingTrial }, void 0, false, {
      fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\PreTrialModal.jsx",
      lineNumber: 133,
      columnNumber: 7
    }),
    /* @__PURE__ */ jsxDEV("div", { style: { background: "rgba(0,0,0,0.3)", padding: 15, borderRadius: 16, marginBottom: 20 }, children: [
      /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }, children: [
        /* @__PURE__ */ jsxDEV("h3", { style: { margin: 0, fontSize: "0.9rem", fontWeight: 900 }, children: [
          "TRIAL SQUAD (",
          squadIds.length,
          "/5)"
        ] }, void 0, true, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\PreTrialModal.jsx",
          lineNumber: 137,
          columnNumber: 11
        }),
        /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", flexDirection: "column", gap: 6 }, children: [
          /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", gap: 8 }, children: [
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                className: "upgrade-btn",
                style: { fontSize: "0.7rem" },
                onClick: () => setShowSquadBuilder({ element: pendingTrial.element, franchise: pendingTrial.franchise, isWildcard: pendingTrial.isWildcard }),
                children: "SELECT HEROES"
              },
              void 0,
              false,
              {
                fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\PreTrialModal.jsx",
                lineNumber: 140,
                columnNumber: 15
              }
            ),
            /* @__PURE__ */ jsxDEV("button", { className: "train-btn", style: { width: "auto", padding: "8px 24px" }, disabled: squadIds.length === 0, onClick: () => startTrial(pendingTrial), children: "PROCEED TO TRIAL" }, void 0, false, {
              fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\PreTrialModal.jsx",
              lineNumber: 147,
              columnNumber: 15
            })
          ] }, void 0, true, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\PreTrialModal.jsx",
            lineNumber: 139,
            columnNumber: 13
          }),
          squadIds.length === 0 && /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.65rem", color: "#ef4444", fontWeight: 700 }, children: "Select at least 1 hero to proceed" }, void 0, false, {
            fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\PreTrialModal.jsx",
            lineNumber: 151,
            columnNumber: 39
          })
        ] }, void 0, true, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\PreTrialModal.jsx",
          lineNumber: 138,
          columnNumber: 11
        })
      ] }, void 0, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\PreTrialModal.jsx",
        lineNumber: 136,
        columnNumber: 9
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "squad-slots-row", style: { gridTemplateColumns: "repeat(5, 1fr)" }, children: Array.from({ length: 5 }).map((_, i) => {
        const heroId = squadIds[i];
        const c = heroId ? characters.find((h) => String(h.export_id) === String(heroId)) : null;
        return /* @__PURE__ */ jsxDEV("div", { className: `squad-member-slot ${c ? "active" : "empty"}`, onClick: () => setShowSquadBuilder(true), children: c ? /* @__PURE__ */ jsxDEV("img", { src: c.imageUrl }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\PreTrialModal.jsx",
          lineNumber: 160,
          columnNumber: 22
        }) : /* @__PURE__ */ jsxDEV(Plus, { size: 20, opacity: 0.2 }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\PreTrialModal.jsx",
          lineNumber: 160,
          columnNumber: 49
        }) }, i, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\PreTrialModal.jsx",
          lineNumber: 159,
          columnNumber: 15
        });
      }) }, void 0, false, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\PreTrialModal.jsx",
        lineNumber: 154,
        columnNumber: 9
      })
    ] }, void 0, true, {
      fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\PreTrialModal.jsx",
      lineNumber: 135,
      columnNumber: 7
    }),
    /* @__PURE__ */ jsxDEV("div", { className: "glass-panel", style: { textAlign: "center", padding: 40, opacity: 0.7 }, children: [
      /* @__PURE__ */ jsxDEV(Info, { size: 32, style: { marginBottom: 10 } }, void 0, false, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\PreTrialModal.jsx",
        lineNumber: 168,
        columnNumber: 9
      }),
      /* @__PURE__ */ jsxDEV("p", { children: "Ensure your squad matches the element or series requirement before entering." }, void 0, false, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\PreTrialModal.jsx",
        lineNumber: 169,
        columnNumber: 9
      })
    ] }, void 0, true, {
      fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\PreTrialModal.jsx",
      lineNumber: 167,
      columnNumber: 7
    })
  ] }, void 0, true, {
    fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\views\\trials\\PreTrialModal.jsx",
    lineNumber: 113,
    columnNumber: 5
  });
};
export {
  PreTrialModal
};
