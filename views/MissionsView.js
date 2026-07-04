import { Fragment, jsxDEV } from "react/jsx-dev-runtime";
import React, { useState, useEffect, useMemo } from "react";
import {
  Sword,
  Sparkles,
  Package,
  Gem,
  Monitor,
  Database,
  X,
  Activity
} from "lucide-react";
import { FACILITY_PERKS, ELEMENTS } from "../constants.js";
import { playSound, calculateSubStat } from "../utils.js";

const MissionsView = ({
  totalAccountLevel,
  credits,
  gems,
  aura,
  setCredits,
  setGems,
  setAura,
  setStamina,
  maxStamina,
  createFloatingText,
  claimedMilestones,
  setClaimedMilestones,
  characters,
  unlockedIds,
  activeMissions,
  setActiveMissions,
  setMaterials,
  setEssence,
  addToInventory,
  skills,
  auraUpgrades,
  totalPWR
}) => {
  const [now, setNow] = useState(Date.now());
  const [selectedHeroId, setSelectedHeroId] = useState(null);
  const [showDeploymentModal, setShowDeploymentModal] = useState(null);
  const [missionTab, setMissionTab] = useState("ops");
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1e3);
    return () => clearInterval(timer);
  }, []);
  const CONTRACTS = [
    {
      id: "materials_scavenge",
      name: "Industrial Scavenge",
      desc: "Sift through dimensional debris for useful raw materials.",
      type: "scavenge",
      duration: 15 * 60 * 1e3,
      // 15m
      reqCP: 1500,
      rewards: { materials: 1500, credits: 2500 },
      elementBonus: "WATER",
      color: "#94a3b8",
      icon: /* @__PURE__ */ jsxDEV(Package, { size: 20 }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 1823,
        columnNumber: 13
      })
    },
    {
      id: "xp_patrol",
      name: "Security Patrol",
      desc: "Keep the academy perimeter clear of minor glitches.",
      type: "combat",
      duration: 30 * 60 * 1e3,
      // 30m
      reqCP: 5e3,
      rewards: { xp: 25e3, credits: 5e3 },
      elementBonus: "FIRE",
      color: "#ef4444",
      icon: /* @__PURE__ */ jsxDEV(Sword, { size: 20 }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 1835,
        columnNumber: 13
      })
    },
    {
      id: "essence_well",
      name: "Aether Siphoning",
      desc: "Channel raw energy into high-purity essence crystals.",
      type: "research",
      duration: 60 * 60 * 1e3,
      // 1h
      reqCP: 25e3,
      rewards: { essence: 45, aura: 20 },
      elementBonus: "LIGHT",
      color: "#f97316",
      icon: /* @__PURE__ */ jsxDEV(Sparkles, { size: 20 }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 1847,
        columnNumber: 13
      })
    },
    {
      id: "gem_mining",
      name: "Crystal Deep-Core",
      desc: "Risky extraction of dimensional gems from unstable rifts.",
      type: "mining",
      duration: 120 * 60 * 1e3,
      // 2h
      reqCP: 75e3,
      rewards: { gems: 15, materials: 8500 },
      elementBonus: "DARK",
      color: "#00d2ff",
      icon: /* @__PURE__ */ jsxDEV(Gem, { size: 20 }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 1859,
        columnNumber: 13
      })
    },
    {
      id: "multiverse_recon",
      name: "Void Reconnaissance",
      desc: "Deep-space scouting of parallel timelines. Extreme duration.",
      type: "stealth",
      duration: 480 * 60 * 1e3,
      // 8h
      reqCP: 5e8,
      rewards: { gems: 500, essence: 750, aura: 500, credits: 25e4 },
      elementBonus: "WIND",
      color: "#a855f7",
      icon: /* @__PURE__ */ jsxDEV(Monitor, { size: 20 }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 1871,
        columnNumber: 13
      })
    }
  ];
  const deployHero = (mission, heroId) => {
    if (!heroId) return;
    const hero = characters.find((c) => String(c.export_id) === String(heroId));
    if (!hero) return;
    if (activeMissions.some((m) => String(m.heroId) === String(heroId))) {
      createFloatingText("Hero is already deployed!", true);
      return;
    }
    const heroPwr = calculateSubStat(hero, characters, "pwr", skills, auraUpgrades);
    const successRate = Math.min(1, heroPwr / mission.reqCP * (hero.element === mission.elementBonus ? 1.3 : 1));
    const newAssignment = {
      missionId: mission.id,
      heroId,
      heroName: hero.name,
      heroImg: hero.imageUrl,
      startTime: Date.now(),
      endTime: Date.now() + mission.duration,
      successRate,
      potentialRewards: mission.rewards
    };
    setActiveMissions((prev) => [...prev, newAssignment]);
    setShowDeploymentModal(null);
    setSelectedHeroId(null);
    playSound("equip");
    createFloatingText(`DEPLOYED: ${hero.name.toUpperCase()}`, false, mission.color);
  };
  const claimMission = (assignment) => {
    const roll = Math.random();
    const isSuccess = roll < assignment.successRate;
    const isGreatSuccess = isSuccess && roll < assignment.successRate * 0.3;
    const r = assignment.potentialRewards;
    const mission = CONTRACTS.find((m) => m.id === assignment.missionId);
    const mult = isGreatSuccess ? 2 : 1;
    if (isSuccess) {
      if (r.credits) setCredits((c) => c + Math.floor(r.credits * mult));
      if (r.gems) setGems((g) => g + Math.floor(r.gems * mult));
      if (r.aura) setAura((a) => a + Math.floor(r.aura * mult));
      if (r.materials) setMaterials((s) => s + Math.floor(r.materials * mult));
      if (r.essence) setEssence((e) => e + Math.floor(r.essence * mult));
      if (r.xp) {
        window.dispatchEvent(new CustomEvent("mugen_global_xp", { detail: { xp: Math.floor(r.xp * mult) } }));
      }
      const curMaterials = parseInt(localStorage.getItem("mugen_materials") || "0", 10);
      const curEssence = parseInt(localStorage.getItem("mugen_essence") || "0", 10);
      localStorage.setItem("mugen_materials", String(curMaterials + Math.floor((r.materials || 0) * mult)));
      localStorage.setItem("mugen_essence", String(curEssence + Math.floor((r.essence || 0) * mult)));
      window.dispatchEvent(new CustomEvent("mugen_materials_changed", {
        detail: { materials: curMaterials + Math.floor((r.materials || 0) * mult), essence: curEssence + Math.floor((r.essence || 0) * mult) }
      }));
      if (isGreatSuccess) {
        createFloatingText("GREAT SUCCESS! REWARDS x2", false, "#facc15");
        playSound("jackpot");
      } else {
        createFloatingText("MISSION COMPLETE", false, "#4ade80");
        playSound("success");
      }
    } else {
      const consolationCredits = Math.floor((r.credits || 1e3) * 0.2);
      setCredits((c) => c + consolationCredits);
      createFloatingText("MISSION FAILED", true);
      playSound("defeat");
    }
    setActiveMissions((prev) => prev.filter((m) => m.startTime !== assignment.startTime));
  };
  const availableHeroes = useMemo(
    () => characters.filter((c) => unlockedIds.includes(c.export_id)).filter((c) => !activeMissions.some((m) => String(m.heroId) === String(c.export_id))).sort((a, b) => calculateSubStat(b, characters, "pwr", skills, auraUpgrades) - calculateSubStat(a, characters, "pwr", skills, auraUpgrades)),
    [characters, unlockedIds, activeMissions, skills, auraUpgrades]
  );
  const generateMilestones = () => {
    const fixed = [
      { level: 10, label: "Rookie Trainer", rewards: { gems: 500, credits: 5e3 } },
      { level: 25, label: "Aura Awakened", rewards: { aura: 150, gems: 250 } },
      { level: 50, label: "Dedicated Mentor", rewards: { gems: 1500, credits: 5e4, aura: 100 } },
      { level: 75, label: "Tactical Mind", rewards: { gems: 2e3, aura: 250 } },
      { level: 100, label: "Master Specialist", rewards: { gems: 5e3, credits: 25e4, aura: 500 } },
      { level: 150, label: "Hero Collector", rewards: { gems: 7500, credits: 5e5 } },
      { level: 200, label: "Elite Commander", rewards: { gems: 15e3, credits: 1e6, aura: 1e3 } },
      { level: 300, label: "Dimensional Rift", rewards: { gems: 25e3, credits: 5e6 } },
      { level: 500, label: "Mugen Legend", rewards: { gems: 5e4, credits: 25e6, aura: 2500 } },
      { level: 750, label: "World Conqueror", rewards: { gems: 1e5, credits: 1e8 } },
      { level: 1e3, label: "Dimensional God", rewards: { gems: 25e4, credits: 5e8, aura: 1e4 } },
      { level: 2e3, label: "Omniverse Ruler", rewards: { gems: 1e6, aura: 25e3 } },
      { level: 5e3, label: "True Architect", rewards: { gems: 1e7, aura: 1e5 } }
    ];
    const cap = Math.max(1250, Math.ceil(totalAccountLevel / 250) * 250 + 250);
    const infinite = [];
    for (let lvl = 1250; lvl <= cap; lvl += 250) {
      const scale = lvl / 1e3;
      infinite.push({
        level: lvl,
        label: `Transcendent Rank ${Math.floor((lvl - 1e3) / 250)}`,
        rewards: {
          gems: Math.floor(5e3 * scale),
          credits: Math.floor(1e6 * scale),
          aura: Math.floor(250 * scale)
        }
      });
    }
    return [...fixed, ...infinite];
  };
  const MILESTONES = generateMilestones();
  const claimMilestone = (m) => {
    if (totalAccountLevel < m.level || claimedMilestones.includes(m.level)) return;
    setClaimedMilestones((prev) => [...prev, m.level]);
    if (m.rewards.gems) setGems((prev) => prev + m.rewards.gems);
    if (m.rewards.credits) setCredits((prev) => prev + m.rewards.credits);
    if (m.rewards.aura) setAura((prev) => prev + m.rewards.aura);
    setStamina(maxStamina);
    createFloatingText(`CLAIMED MILESTONE: ${m.label}!`, false, "#00d2ff");
    playSound("levelUp");
  };
  const passiveRate = Math.floor(totalAccountLevel / 10);
  const claimAllFinished = () => {
    const finished = activeMissions.filter((m) => Date.now() >= m.endTime);
    if (finished.length === 0) {
      createFloatingText("No missions ready!", true);
      return;
    }
    finished.forEach(claimMission);
    createFloatingText(`Batch Retrieved ${finished.length} Operations!`, false, "#4ade80");
  };
  return /* @__PURE__ */ jsxDEV("div", { style: { padding: "16px 0" }, children: [
    /* @__PURE__ */ jsxDEV("div", { className: "missions-tabs-v2", children: [
      /* @__PURE__ */ jsxDEV("button", { className: `mission-tab-btn ${missionTab === "ops" ? "active" : ""}`, onClick: () => setMissionTab("ops"), children: [
        "Operations (",
        activeMissions.length,
        ")"
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 2030,
        columnNumber: 9
      }),
      /* @__PURE__ */ jsxDEV("button", { className: `mission-tab-btn ${missionTab === "milestones" ? "active" : ""}`, onClick: () => setMissionTab("milestones"), children: "Milestones" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 2033,
        columnNumber: 9
      }),
      /* @__PURE__ */ jsxDEV("button", { className: `mission-tab-btn ${missionTab === "sanctum" ? "active" : ""}`, onClick: () => setMissionTab("sanctum"), children: "Sanctum" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 2036,
        columnNumber: 9
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 2029,
      columnNumber: 7
    }),
    missionTab === "ops" && /* @__PURE__ */ jsxDEV("div", { className: "animate-fadeIn", children: [
      /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }, children: [
        /* @__PURE__ */ jsxDEV("h2", { style: { fontWeight: 900, margin: 0, letterSpacing: 1, fontSize: "1.2rem", color: "#facc15" }, children: "// ACTIVE CONTRACTS" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 2044,
          columnNumber: 13
        }),
        /* @__PURE__ */ jsxDEV("button", { className: "train-btn", style: { width: "auto", padding: "10px 20px", fontSize: "0.75rem", background: "#4ade80", color: "#000" }, onClick: claimAllFinished, children: "CLAIM ALL READY" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 2045,
          columnNumber: 13
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 2043,
        columnNumber: 11
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "mission-terminal-grid", style: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }, children: CONTRACTS.map((mission) => {
        const assignment = activeMissions.find((am) => am.missionId === mission.id);
        const isCompleted = assignment && now >= assignment.endTime;
        const progress = assignment ? Math.min(100, (now - assignment.startTime) / (assignment.endTime - assignment.startTime) * 100) : 0;
        const remaining = assignment ? Math.max(0, assignment.endTime - now) : 0;
        return /* @__PURE__ */ jsxDEV("div", { className: "mission-job-card", style: { borderColor: assignment ? isCompleted ? "#4ade80" : "#334155" : "rgba(255,255,255,0.1)" }, children: [
          /* @__PURE__ */ jsxDEV("div", { className: "mission-bg-stripes" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 2059,
            columnNumber: 21
          }),
          assignment && /* @__PURE__ */ jsxDEV("div", { className: "active-mission-overlay", style: { background: isCompleted ? "rgba(5, 20, 10, 0.95)" : "rgba(10, 10, 20, 0.95)" }, children: !isCompleted ? /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 15 }, children: [
            /* @__PURE__ */ jsxDEV("div", { className: "mission-progress-circle", children: [
              /* @__PURE__ */ jsxDEV("svg", { className: "circular-progress", viewBox: "0 0 36 36", children: [
                /* @__PURE__ */ jsxDEV("circle", { className: "circular-bg", cx: "18", cy: "18", r: "16" }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 2067,
                  columnNumber: 45
                }),
                /* @__PURE__ */ jsxDEV("circle", { className: "circular-fill", cx: "18", cy: "18", r: "16", strokeDasharray: `${progress}, 100` }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 2068,
                  columnNumber: 45
                })
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 2066,
                columnNumber: 41
              }),
              /* @__PURE__ */ jsxDEV("div", { style: { position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", fontSize: "0.7rem", fontWeight: 900 }, children: [
                Math.floor(progress),
                "%"
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 2070,
                columnNumber: 41
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 2065,
              columnNumber: 37
            }),
            /* @__PURE__ */ jsxDEV("div", { style: { textAlign: "center" }, children: [
              /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.9rem", fontWeight: 900, color: "#fff" }, children: assignment.heroName }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 2075,
                columnNumber: 41
              }),
              /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.6rem", color: "#facc15", letterSpacing: 1 }, children: "IN PROGRESS..." }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 2076,
                columnNumber: 41
              }),
              /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.8rem", fontWeight: 900, marginTop: 5, fontFamily: "monospace" }, children: [
                Math.floor(remaining / 6e4),
                "m ",
                Math.floor(remaining % 6e4 / 1e3),
                "s"
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 2077,
                columnNumber: 41
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 2074,
              columnNumber: 37
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 2064,
            columnNumber: 33
          }) : /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 15 }, className: "animate-popIn", children: [
            /* @__PURE__ */ jsxDEV("div", { style: { color: "#4ade80", fontWeight: 900, fontSize: "1.1rem", letterSpacing: 1 }, children: "JOB DONE" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 2084,
              columnNumber: 37
            }),
            /* @__PURE__ */ jsxDEV("div", { style: { width: 60, height: 60, borderRadius: "50%", border: "2px solid #4ade80", padding: 2 }, children: /* @__PURE__ */ jsxDEV("img", { src: assignment.heroImg, style: { width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" } }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 2086,
              columnNumber: 41
            }) }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 2085,
              columnNumber: 37
            }),
            /* @__PURE__ */ jsxDEV("div", { className: `success-rate-badge ${assignment.successRate > 0.8 ? "rate-high" : "rate-mid"}`, style: { fontSize: "0.7rem" }, children: [
              "ODDS: ",
              Math.floor(assignment.successRate * 100),
              "%"
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 2088,
              columnNumber: 37
            }),
            /* @__PURE__ */ jsxDEV("button", { className: "train-btn", style: { width: "80%", padding: "10px" }, onClick: () => claimMission(assignment), children: "REPORT & CLAIM" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 2091,
              columnNumber: 37
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 2083,
            columnNumber: 33
          }) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 2062,
            columnNumber: 25
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "mission-card-header", style: { borderLeft: `4px solid ${mission.color}` }, children: [
            /* @__PURE__ */ jsxDEV("div", { style: { fontWeight: 900, fontSize: "1rem", color: "#fff" }, children: mission.name.toUpperCase() }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 2098,
              columnNumber: 25
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "mission-type-pill", style: { color: mission.color }, children: mission.type }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 2099,
              columnNumber: 25
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 2097,
            columnNumber: 21
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "mission-card-body", children: [
            /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.75rem", color: "var(--text-muted)", lineHeight: 1.4, marginBottom: 15, height: "2.8em", overflow: "hidden" }, children: mission.desc }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 2103,
              columnNumber: 25
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "mission-reqs-grid", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "mission-req-item", children: [
                /* @__PURE__ */ jsxDEV("div", { className: "req-label", children: "DIFFICULTY" }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 2107,
                  columnNumber: 33
                }),
                /* @__PURE__ */ jsxDEV("div", { className: "req-val", style: { color: mission.reqCP > totalPWR ? "#ef4444" : "#4ade80" }, children: [
                  "PWR ",
                  mission.reqCP.toLocaleString()
                ] }, void 0, true, {
                  fileName: "<stdin>",
                  lineNumber: 2108,
                  columnNumber: 33
                })
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 2106,
                columnNumber: 29
              }),
              /* @__PURE__ */ jsxDEV("div", { className: "mission-req-item", children: [
                /* @__PURE__ */ jsxDEV("div", { className: "req-label", children: "DURATION" }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 2111,
                  columnNumber: 33
                }),
                /* @__PURE__ */ jsxDEV("div", { className: "req-val", children: [
                  mission.duration / 6e4,
                  " MIN"
                ] }, void 0, true, {
                  fileName: "<stdin>",
                  lineNumber: 2112,
                  columnNumber: 33
                })
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 2110,
                columnNumber: 29
              }),
              /* @__PURE__ */ jsxDEV("div", { className: "mission-req-item full-width", children: [
                /* @__PURE__ */ jsxDEV("div", { className: "req-label", children: "BONUS SYNERGY" }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 2115,
                  columnNumber: 33
                }),
                /* @__PURE__ */ jsxDEV("div", { className: "req-val", style: { color: ELEMENTS[mission.elementBonus].color }, children: [
                  mission.elementBonus,
                  " SPECIALIST"
                ] }, void 0, true, {
                  fileName: "<stdin>",
                  lineNumber: 2116,
                  columnNumber: 33
                })
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 2114,
                columnNumber: 29
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 2105,
              columnNumber: 25
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "mission-rewards-preview", children: Object.entries(mission.rewards).map(([key, val]) => /* @__PURE__ */ jsxDEV("div", { className: "reward-chip", children: [
              key === "credits" ? /* @__PURE__ */ jsxDEV(Database, { size: 10 }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 2123,
                columnNumber: 58
              }) : key === "gems" ? /* @__PURE__ */ jsxDEV(Gem, { size: 10 }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 2123,
                columnNumber: 99
              }) : /* @__PURE__ */ jsxDEV(Package, { size: 10 }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 2123,
                columnNumber: 118
              }),
              /* @__PURE__ */ jsxDEV("span", { children: val.toLocaleString() }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 2124,
                columnNumber: 37
              })
            ] }, key, true, {
              fileName: "<stdin>",
              lineNumber: 2122,
              columnNumber: 33
            })) }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 2120,
              columnNumber: 25
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 2102,
            columnNumber: 21
          }),
          /* @__PURE__ */ jsxDEV("button", { className: "mission-dispatch-btn", onClick: () => setShowDeploymentModal(mission), children: "DISPATCH AGENT" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 2130,
            columnNumber: 21
          })
        ] }, mission.id, true, {
          fileName: "<stdin>",
          lineNumber: 2058,
          columnNumber: 17
        });
      }) }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 2050,
        columnNumber: 11
      }),
      showDeploymentModal && /* @__PURE__ */ jsxDEV("div", { className: "hero-select-modal animate-fadeIn", style: { display: "flex", flexDirection: "column" }, children: /* @__PURE__ */ jsxDEV("div", { className: "modal-panel", style: { width: "90%", maxWidth: "600px", maxHeight: "85vh", display: "flex", flexDirection: "column" }, children: [
        /* @__PURE__ */ jsxDEV("div", { className: "modal-header", children: [
          /* @__PURE__ */ jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDEV("h2", { style: { margin: 0 }, children: "SELECT SPECIALIST" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 2143,
              columnNumber: 25
            }),
            /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.8rem", color: showDeploymentModal.color, fontWeight: 900 }, children: [
              "MISSION: ",
              showDeploymentModal.name.toUpperCase()
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 2144,
              columnNumber: 25
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 2142,
            columnNumber: 21
          }),
          /* @__PURE__ */ jsxDEV("button", { className: "upgrade-btn", onClick: () => setShowDeploymentModal(null), children: /* @__PURE__ */ jsxDEV(X, { size: 18 }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 2146,
            columnNumber: 98
          }) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 2146,
            columnNumber: 21
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 2141,
          columnNumber: 17
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "roster-grid custom-scroll", style: { overflowY: "auto", flex: 1, padding: 10 }, children: [
          availableHeroes.map((c) => {
            const heroPwr = calculateSubStat(c, characters, "pwr", skills, auraUpgrades);
            const successRate = Math.min(1, heroPwr / showDeploymentModal.reqCP * (c.element === showDeploymentModal.elementBonus ? 1.3 : 1));
            const isMatch = c.element === showDeploymentModal.elementBonus;
            return /* @__PURE__ */ jsxDEV("div", { className: "sb-hero-row-card neon-hover", style: { height: "60px", background: "rgba(255,255,255,0.03)", borderRadius: "12px", marginBottom: 6 }, onClick: () => deployHero(showDeploymentModal, c.export_id), children: [
              /* @__PURE__ */ jsxDEV("img", { src: c.imageUrl, className: "sb-hero-row-icon", style: { width: 44, height: 44, borderRadius: 8 } }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 2157,
                columnNumber: 33
              }),
              /* @__PURE__ */ jsxDEV("div", { className: "sb-hero-row-name", style: { fontSize: "0.9rem" }, children: c.name }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 2158,
                columnNumber: 33
              }),
              /* @__PURE__ */ jsxDEV("div", { style: { textAlign: "right", paddingRight: 10 }, children: [
                /* @__PURE__ */ jsxDEV("div", { className: `success-rate-badge ${successRate >= 0.9 ? "rate-high" : successRate >= 0.5 ? "rate-mid" : "rate-low"}`, children: [
                  Math.floor(successRate * 100),
                  "% SUCCESS"
                ] }, void 0, true, {
                  fileName: "<stdin>",
                  lineNumber: 2160,
                  columnNumber: 37
                }),
                /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.6rem", color: ELEMENTS[c.element].color, fontWeight: 900 }, children: isMatch ? "ELEMENT BONUS" : c.element }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 2163,
                  columnNumber: 37
                })
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 2159,
                columnNumber: 33
              })
            ] }, c.export_id, true, {
              fileName: "<stdin>",
              lineNumber: 2156,
              columnNumber: 29
            });
          }),
          availableHeroes.length === 0 && /* @__PURE__ */ jsxDEV("div", { style: { textAlign: "center", opacity: 0.5, padding: 40 }, children: "All heroes are currently deployed or unavailable." }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 2170,
            columnNumber: 54
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 2149,
          columnNumber: 17
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 2140,
        columnNumber: 13
      }) }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 2139,
        columnNumber: 9
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 2042,
      columnNumber: 9
    }),
    missionTab === "milestones" && /* @__PURE__ */ jsxDEV("div", { className: "animate-fadeIn", children: [
      /* @__PURE__ */ jsxDEV("div", { style: { margin: "0 0 16px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
        /* @__PURE__ */ jsxDEV("h2", { style: { margin: 0, fontSize: "1.2rem", fontWeight: 900, letterSpacing: 1 }, children: "ACCOUNT MILESTONES" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 2182,
          columnNumber: 13
        }),
        /* @__PURE__ */ jsxDEV("span", { style: { fontSize: "0.7rem", color: "#4ade80", fontWeight: 900 }, children: [
          claimedMilestones.length,
          " / ",
          MILESTONES.length,
          " CLAIMED"
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 2183,
          columnNumber: 13
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 2181,
        columnNumber: 11
      }),
      /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", flexDirection: "column", gap: 12 }, children: MILESTONES.map((m, i) => {
        const isClaimed = claimedMilestones.includes(m.level);
        const canClaim = totalAccountLevel >= m.level && !isClaimed;
        const progress = Math.min(100, totalAccountLevel / m.level * 100);
        return /* @__PURE__ */ jsxDEV("div", { className: `glass-panel ${isClaimed ? "claimed" : ""}`, style: { padding: 0, overflow: "hidden", opacity: isClaimed ? 0.6 : 1, border: isClaimed ? "1px solid rgba(74, 222, 128, 0.2)" : "1px solid rgba(255,255,255,0.1)" }, children: [
          /* @__PURE__ */ jsxDEV("div", { style: { padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
            /* @__PURE__ */ jsxDEV("div", { style: { flex: 1 }, children: [
              /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }, children: [
                /* @__PURE__ */ jsxDEV("span", { style: { fontWeight: 900, fontSize: "1rem", color: isClaimed ? "#4ade80" : "#fff" }, children: m.label }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 2197,
                  columnNumber: 21
                }),
                /* @__PURE__ */ jsxDEV("span", { style: { fontSize: "0.7rem", background: "rgba(255,255,255,0.1)", padding: "2px 8px", borderRadius: 4, fontWeight: 800 }, children: [
                  "LVL ",
                  m.level
                ] }, void 0, true, {
                  fileName: "<stdin>",
                  lineNumber: 2198,
                  columnNumber: 21
                })
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 2196,
                columnNumber: 19
              }),
              /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", gap: 10 }, children: [
                m.rewards.gems && /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.7rem", color: "#00d2ff", fontWeight: 800 }, children: [
                  "+",
                  m.rewards.gems.toLocaleString(),
                  " Gems"
                ] }, void 0, true, {
                  fileName: "<stdin>",
                  lineNumber: 2201,
                  columnNumber: 40
                }),
                m.rewards.credits && /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.7rem", color: "#facc15", fontWeight: 800 }, children: [
                  "+$",
                  m.rewards.credits.toLocaleString()
                ] }, void 0, true, {
                  fileName: "<stdin>",
                  lineNumber: 2202,
                  columnNumber: 43
                }),
                m.rewards.aura && /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.7rem", color: "#a855f7", fontWeight: 800 }, children: [
                  "+",
                  m.rewards.aura.toLocaleString(),
                  " Aura"
                ] }, void 0, true, {
                  fileName: "<stdin>",
                  lineNumber: 2203,
                  columnNumber: 40
                })
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 2200,
                columnNumber: 19
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 2195,
              columnNumber: 17
            }),
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                className: "train-btn",
                style: {
                  width: "auto",
                  padding: "8px 20px",
                  fontSize: "0.8rem",
                  background: isClaimed ? "rgba(74, 222, 128, 0.1)" : canClaim ? "linear-gradient(135deg, #00d2ff, #3a7bd5)" : "#334155",
                  color: isClaimed ? "#4ade80" : "#fff",
                  border: isClaimed ? "1px solid #4ade80" : "none"
                },
                onClick: () => claimMilestone(m),
                disabled: !canClaim && !isClaimed,
                children: isClaimed ? "CLAIMED" : canClaim ? "CLAIM" : "LOCKED"
              },
              void 0,
              false,
              {
                fileName: "<stdin>",
                lineNumber: 2207,
                columnNumber: 17
              }
            )
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 2194,
            columnNumber: 15
          }),
          !isClaimed && /* @__PURE__ */ jsxDEV("div", { style: { height: 4, background: "rgba(255,255,255,0.05)", width: "100%" }, children: /* @__PURE__ */ jsxDEV("div", { style: { height: "100%", background: "var(--primary)", width: `${progress}%`, transition: "width 0.5s ease" } }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 2225,
            columnNumber: 19
          }) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 2224,
            columnNumber: 17
          })
        ] }, i, true, {
          fileName: "<stdin>",
          lineNumber: 2193,
          columnNumber: 13
        });
      }) }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 2186,
        columnNumber: 11
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 2180,
      columnNumber: 9
    }),
    missionTab === "sanctum" && /* @__PURE__ */ jsxDEV("div", { className: "animate-fadeIn", children: [
      /* @__PURE__ */ jsxDEV("h2", { style: { fontWeight: 900, margin: "0 0 20px 0", letterSpacing: 1, fontSize: "1.2rem" }, children: "FACILITY SANCTUM" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 2237,
        columnNumber: 7
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "glass-panel", style: { marginBottom: 24, padding: 25, borderLeft: "4px solid #facc15", background: "linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(10, 5, 20, 0.95))" }, children: /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("h3", { style: { margin: "0 0 5px 0", fontSize: "1.4rem", color: "#fff", display: "flex", alignItems: "center", gap: 10 }, children: [
            /* @__PURE__ */ jsxDEV(Activity, { size: 24, color: "#facc15", className: "animate-pulse" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 2243,
              columnNumber: 15
            }),
            " Resource Synthesis"
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 2242,
            columnNumber: 13
          }),
          /* @__PURE__ */ jsxDEV("p", { style: { fontSize: "0.8rem", opacity: 0.7, margin: 0, maxWidth: "280px" }, children: "Your facility automatically generates credits based on your Total Power Level." }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 2245,
            columnNumber: 13
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 2241,
          columnNumber: 11
        }),
        /* @__PURE__ */ jsxDEV("div", { style: { textAlign: "right", background: "rgba(0,0,0,0.3)", padding: "15px", borderRadius: "16px", border: "1px solid rgba(250, 204, 21, 0.2)" }, children: [
          /* @__PURE__ */ jsxDEV("div", { style: { color: "#facc15", fontWeight: 900, fontSize: "1.8rem" }, children: [
            "$",
            passiveRate.toLocaleString()
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 2248,
            columnNumber: 13
          }),
          /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.65rem", opacity: 0.6, fontWeight: 800, letterSpacing: 1 }, children: "PER SECOND" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 2249,
            columnNumber: 13
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 2247,
          columnNumber: 11
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 2240,
        columnNumber: 9
      }) }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 2239,
        columnNumber: 7
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "glass-panel", style: { padding: 25 }, children: [
        /* @__PURE__ */ jsxDEV("h4", { style: { margin: "0 0 15px 0", fontSize: "0.9rem", color: "#a855f7", fontWeight: 900 }, children: "FACILITY BLUEPRINTS" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 2255,
          columnNumber: 10
        }),
        /* @__PURE__ */ jsxDEV("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }, children: FACILITY_PERKS.map((perk, i) => {
          const isActive = Math.floor(totalAccountLevel / 25) + 1 >= perk.rank;
          return /* @__PURE__ */ jsxDEV("div", { className: `facility-perk-item ${isActive ? "active" : "locked"}`, style: { padding: "15px" }, children: [
            /* @__PURE__ */ jsxDEV("div", { className: "perk-icon-circle", style: { width: "36px", height: "36px" }, children: /* @__PURE__ */ jsxDEV(Sparkles, { size: 18 }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 2262,
              columnNumber: 21
            }) }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 2261,
              columnNumber: 19
            }),
            /* @__PURE__ */ jsxDEV("div", { children: [
              /* @__PURE__ */ jsxDEV("div", { style: { fontWeight: 900, fontSize: "0.85rem" }, children: perk.label }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 2265,
                columnNumber: 21
              }),
              /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.7rem", opacity: 0.7 }, children: perk.desc }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 2266,
                columnNumber: 21
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 2264,
              columnNumber: 19
            })
          ] }, i, true, {
            fileName: "<stdin>",
            lineNumber: 2260,
            columnNumber: 17
          });
        }) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 2256,
          columnNumber: 10
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 2254,
        columnNumber: 7
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 2236,
      columnNumber: 5
    })
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 2028,
    columnNumber: 5
  });
};;

export { MissionsView };
