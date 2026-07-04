import { Fragment, jsxDEV } from "react/jsx-dev-runtime";
import React, { useState, useMemo } from "react";
import {
  Users,
  Sparkles,
  ChevronRight,
  Trophy,
  LayoutGrid,
  Gem,
  Monitor,
  Database,
  Swords,
  Activity
} from "lucide-react";
import { ELEMENTS } from "../constants.js";
import { playSound, calculateSubStat, formatPower } from "../utils.js";

const HomeView = ({
  characters = [],
  totalAccountLevel = 0,
  credits = 0,
  setCredits,
  gems = 0,
  setGems,
  aura = 0,
  setView: setView2,
  setSelectedCharIndex,
  unlockedIds = [],
  vaultCredits = 0,
  setVaultCredits,
  maxVaultCapacity = 5e3,
  createFloatingText,
  unlockedFeatures = [],
  stats = {},
  showDailyModal = false,
  setShowDailyModal,
  totalPWR = 0,
  skills = [],
  campaignProgress = 1,
  unclaimedGems = 0,
  setUnclaimedGems,
  triggerVisualEffect: triggerVisualEffect2,
  activeMissions = [],
  endlessFloor = 1,
  eventTokens = 0,
  materials = 0,
  essence = 0,
  items = {},
  auraUpgrades = {},
  selectedCharIndex = 0
}) => {
  const [showPerks, setShowPerks] = useState(false);
  const isMobile2 = window.innerWidth <= 768;
  const claimDaily = () => {
    const reward = 250 + (stats?.dailyStreak || 0) * 50;
    setGems((g) => g + reward);
    setShowDailyModal(false);
    createFloatingText(`+${reward} DAILY GEMS!`, false, "#00d2ff");
    playSound("daily_reward");
  };
  const claimVault = () => {
    if (vaultCredits <= 0) return;
    setCredits((c) => c + vaultCredits);
    createFloatingText(`+$${vaultCredits.toLocaleString()}`, false, "#facc15");
    setVaultCredits(0);
    playSound("purchase");
  };
  const claimGeode = () => {
    const floor = Math.floor(unclaimedGems);
    if (floor <= 0) return;
    setGems((g) => g + floor);
    setUnclaimedGems((g) => g % 1);
    createFloatingText(`+${floor} GEMS!`, false, "#00d2ff");
    playSound("jackpot");
  };
  const unlockedCharacters = useMemo(
    () => (characters || []).filter((c) => unlockedIds?.includes(c?.export_id)),
    [characters, unlockedIds]
  );
  const topHeroes = useMemo(
    () => [...unlockedCharacters].sort((a, b) => calculateSubStat(b, characters, "pwr", skills, auraUpgrades) - calculateSubStat(a, characters, "pwr", skills, auraUpgrades)).slice(0, 4),
    [unlockedCharacters, characters, skills, auraUpgrades]
  );
  const featuredHero = characters[selectedCharIndex] || topHeroes[0];
  const squadComposition = useMemo(() => {
    const counts = { FIRE: 0, WATER: 0, WIND: 0, LIGHT: 0, DARK: 0, EARTH: 0, NEUTRAL: 0 };
    unlockedCharacters.forEach((c) => {
      if (counts[c.element] !== void 0) counts[c.element]++;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [unlockedCharacters]);
  const facilityRank = Math.floor(totalAccountLevel / 15) + 1;
  const facilityNames = ["Street Gym", "Industrial Loft", "Downtown Studio", "Upper East Dojo", "Penthouse HQ", "Empire Spire", "Metropolitan Sanctum"];
  const facilityName = facilityNames[Math.min(facilityRank - 1, facilityNames.length - 1)];
  const nextFacilityName = facilityNames[Math.min(facilityRank, facilityNames.length - 1)];
  const levelsIntoRank = totalAccountLevel % 15;
  const levelsToNextRank = 15 - levelsIntoRank;
  const RANK_UNLOCKS = { 2: "Events & Trials", 3: "Jobs" };
  const nextRankReward = RANK_UNLOCKS[facilityRank + 1] || "More Aura perks";
  const nextStage = campaignProgress;
  const recommendedCP = nextStage * 125e3;
  return /* @__PURE__ */ jsxDEV("div", { className: "animate-fadeIn home-dashboard-wrapper", style: { paddingBottom: 100 }, children: [
    /* @__PURE__ */ jsxDEV("div", { className: "home-ambient-container", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "scanning-grid-overlay", style: { opacity: 0.1 } }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 87,
        columnNumber: 9
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "vignette-heavy", style: { background: "radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.7) 100%)" } }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 88,
        columnNumber: 9
      }),
      Array.from({ length: 12 }).map((_, i) => /* @__PURE__ */ jsxDEV(
        "div",
        {
          className: "home-float-particle",
          style: {
            left: `${i * 137 % 100}%`,
            top: `${i * 73 % 100}%`,
            animationDelay: `${i * 0.4}s`,
            opacity: 0.1 + i % 3 * 0.1
          }
        },
        i,
        false,
        {
          fileName: "<stdin>",
          lineNumber: 90,
          columnNumber: 11
        }
      ))
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 86,
      columnNumber: 7
    }),
    showDailyModal && /* @__PURE__ */ jsxDEV("div", { className: "summoning-overlay", style: { background: "rgba(0,0,0,0.9)", backdropFilter: "blur(15px)" }, children: /* @__PURE__ */ jsxDEV("div", { className: "glass-panel animate-popIn", style: { padding: 40, textAlign: "center", maxWidth: "320px", border: "2px solid var(--gem-color)", boxShadow: "0 0 50px rgba(0,210,255,0.3)" }, children: [
      /* @__PURE__ */ jsxDEV(Sparkles, { size: 56, color: "var(--gem-color)", style: { marginBottom: 20 }, className: "animate-pulse" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 106,
        columnNumber: 13
      }),
      /* @__PURE__ */ jsxDEV("h2", { style: { margin: "0 0 5px 0", fontFamily: "Cinzel", letterSpacing: 2 }, children: "NIGHTLY REWARD" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 107,
        columnNumber: 13
      }),
      /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "1.4rem", fontWeight: 900, color: "var(--gem-color)", marginBottom: 10 }, children: [
        "DAY ",
        stats.dailyStreak
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 108,
        columnNumber: 13
      }),
      /* @__PURE__ */ jsxDEV("p", { style: { fontSize: "0.85rem", opacity: 0.8, marginBottom: 30, lineHeight: 1.5 }, children: "Dimensional alignment successful. Here are your nightly gems." }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 109,
        columnNumber: 13
      }),
      /* @__PURE__ */ jsxDEV("button", { className: "train-btn", style: { background: "var(--gem-color)", color: "#000" }, onClick: claimDaily, children: [
        "CLAIM ",
        250 + stats.dailyStreak * 50,
        " GEMS"
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 110,
        columnNumber: 13
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 105,
      columnNumber: 11
    }) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 104,
      columnNumber: 9
    }),
    /* @__PURE__ */ jsxDEV("div", { style: { display: "grid", gridTemplateColumns: isMobile2 ? "1fr" : "1.5fr 1fr", gap: 20, marginBottom: 30, marginTop: 10 }, children: [
      /* @__PURE__ */ jsxDEV("div", { className: "glass-panel aero-glass animate-popIn", style: { padding: 0, position: "relative", overflow: "hidden", minHeight: "380px", border: "1px solid rgba(255,255,255,0.3)" }, children: [
        /* @__PURE__ */ jsxDEV("div", { style: {
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at 70% 50%, ${ELEMENTS[featuredHero?.element || "FIRE"].color}33 0%, transparent 70%)`,
          zIndex: 1
        } }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 120,
          columnNumber: 15
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "anime-speed-lines", style: { opacity: 0.15, animationDuration: "0.1s" } }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 126,
          columnNumber: 15
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "loading-hex-grid", style: { opacity: 0.08, zIndex: 1 } }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 127,
          columnNumber: 15
        }),
        /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", height: "100%", flexDirection: isMobile2 ? "column" : "row" }, children: [
          /* @__PURE__ */ jsxDEV("div", { style: { flex: 1, padding: isMobile2 ? "20px" : "40px", display: "flex", flexDirection: "column", zIndex: 10, position: "relative" }, children: [
            /* @__PURE__ */ jsxDEV("div", { className: "featured-tag", style: {
              background: ELEMENTS[featuredHero?.element || "FIRE"].color,
              color: "#000",
              marginBottom: 15,
              boxShadow: `0 0 20px ${ELEMENTS[featuredHero?.element || "FIRE"].color}66`,
              animation: "pulse-glow 2s infinite"
            }, children: "FEATURED PARTNER" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 131,
              columnNumber: 23
            }),
            /* @__PURE__ */ jsxDEV("h1", { className: "glitch-text-hover", "data-text": featuredHero?.name, style: {
              margin: 0,
              fontSize: isMobile2 ? "2.2rem" : "3.5rem",
              fontFamily: "MugenTitle",
              letterSpacing: 1,
              textTransform: "uppercase",
              textShadow: `0 0 30px ${ELEMENTS[featuredHero?.element || "FIRE"].color}44`
            }, children: featuredHero?.name }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 139,
              columnNumber: 23
            }),
            /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", gap: 15, margin: "12px 0" }, children: [
              /* @__PURE__ */ jsxDEV("span", { style: { fontSize: "0.75rem", fontWeight: 900, color: "#fff", border: "1px solid rgba(255,255,255,0.2)", padding: "2px 8px", borderRadius: 4 }, children: [
                "LV.",
                featuredHero?.level
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 149,
                columnNumber: 27
              }),
              /* @__PURE__ */ jsxDEV("span", { style: { fontSize: "0.75rem", fontWeight: 900, color: "#f472b6", background: "rgba(244,114,182,0.1)", padding: "2px 8px", borderRadius: 4 }, children: [
                "BOND ",
                featuredHero?.bondLevel
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 150,
                columnNumber: 27
              }),
              /* @__PURE__ */ jsxDEV("span", { style: { fontSize: "0.75rem", fontWeight: 900, color: ELEMENTS[featuredHero?.element || "FIRE"].color }, children: [
                featuredHero?.element,
                " TYPE"
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 151,
                columnNumber: 27
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 148,
              columnNumber: 23
            }),
            /* @__PURE__ */ jsxDEV("p", { style: { fontSize: "0.9rem", opacity: 0.8, maxWidth: "320px", lineHeight: 1.6, margin: "15px 0", color: "#cbd5e1" }, children: [
              "Runs the crew tonight. Pulling serious weight on the floor — ",
              /* @__PURE__ */ jsxDEV("span", { style: { color: "#fff", fontWeight: 900 }, children: [
                formatPower(calculateSubStat(featuredHero, characters, "pwr", skills, auraUpgrades)),
                " PWR"
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 155,
                columnNumber: 107
              }),
              "."
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 154,
              columnNumber: 23
            }),
            /* @__PURE__ */ jsxDEV("div", { style: { marginTop: "auto", display: "flex", gap: 12, paddingBottom: isMobile2 ? 20 : 0 }, children: [
              /* @__PURE__ */ jsxDEV("button", { className: "train-btn", style: { width: "auto", padding: "12px 30px", fontSize: "0.9rem" }, onClick: () => setView2("train"), children: "THE SPOT" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 159,
                columnNumber: 27
              }),
              /* @__PURE__ */ jsxDEV("button", { className: "sb-btn", style: { background: "rgba(255,255,255,0.05)", fontSize: "0.9rem", border: "1px solid rgba(255,255,255,0.1)" }, onClick: () => setView2("lounge"), children: "LOUNGE" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 160,
                columnNumber: 27
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 158,
              columnNumber: 23
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 130,
            columnNumber: 19
          }),
          /* @__PURE__ */ jsxDEV("div", { style: {
            width: isMobile2 ? "100%" : "380px",
            height: isMobile2 ? "240px" : "auto",
            position: "relative",
            zIndex: 5,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            pointerEvents: "none"
          }, children: [
            /* @__PURE__ */ jsxDEV(
              "img",
              {
                src: featuredHero?.imageUrl,
                style: {
                  height: isMobile2 ? "100%" : "120%",
                  width: "100%",
                  objectFit: "contain",
                  transform: isMobile2 ? "none" : "scale(1.1) translateY(8%) translateX(10%)",
                  filter: `drop-shadow(0 0 30px ${ELEMENTS[featuredHero?.element || "FIRE"].color}44)`,
                  maskImage: "linear-gradient(to bottom, black 80%, transparent 100%)",
                  animation: "float-hero-art 6s ease-in-out infinite"
                }
              },
              void 0,
              false,
              {
                fileName: "<stdin>",
                lineNumber: 175,
                columnNumber: 21
              }
            ),
            /* @__PURE__ */ jsxDEV("div", { style: {
              position: "absolute",
              top: "20%",
              right: "10%",
              fontSize: "0.5rem",
              fontFamily: "monospace",
              color: ELEMENTS[featuredHero?.element || "FIRE"].color,
              opacity: 0.4,
              writingMode: "vertical-rl"
            }, children: Array.from({ length: 8 }).map((_, i) => /* @__PURE__ */ jsxDEV("div", { className: "animate-pulse", style: { animationDelay: `${i * 0.2}s` }, children: [
              "GUEST 00",
              i
            ] }, i, true, {
              fileName: "<stdin>",
              lineNumber: 198,
              columnNumber: 64
            })) }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 188,
              columnNumber: 21
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 165,
            columnNumber: 19
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 129,
          columnNumber: 15
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 118,
        columnNumber: 11
      }),
      /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", flexDirection: "column", gap: 15 }, children: [
        /* @__PURE__ */ jsxDEV("div", { className: "glass-panel", style: { padding: 25, flex: 1, borderLeft: "4px solid var(--primary)" }, children: [
          /* @__PURE__ */ jsxDEV("div", { className: "stat-label", style: { marginBottom: 5, letterSpacing: 2 }, children: "STREET REP" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 207,
            columnNumber: 19
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "stat-value text-pulse", style: { fontSize: "3rem" }, children: formatPower(totalAccountLevel) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 208,
            columnNumber: 19
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "facility-status", style: { marginTop: 15, background: "rgba(0,0,0,0.4)", padding: "6px 12px", borderRadius: 8, width: "fit-content" }, children: [
            /* @__PURE__ */ jsxDEV("div", { className: "status-dot" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 210,
              columnNumber: 23
            }),
            " ",
            facilityName.toUpperCase(),
            " RANK ",
            facilityRank
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 209,
            columnNumber: 19
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "exp-bar-container", style: { height: 6, marginTop: 15 }, children: /* @__PURE__ */ jsxDEV("div", { className: "exp-bar-fill", style: { width: `${levelsIntoRank / 25 * 100}%` } }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 213,
            columnNumber: 23
          }) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 212,
            columnNumber: 19
          }),
          /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.65rem", opacity: 0.7, marginTop: 6 }, children: [
            levelsToNextRank,
            " level",
            levelsToNextRank === 1 ? "" : "s",
            " to ",
            nextFacilityName,
            " (Rank ",
            facilityRank + 1,
            ") — unlocks ",
            nextRankReward
          ] }, void 0, true, {})
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 206,
          columnNumber: 15
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "glass-panel", style: { padding: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
          /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", alignItems: "center", gap: 12 }, children: [
            /* @__PURE__ */ jsxDEV("div", { style: { width: 44, height: 44, borderRadius: 12, background: "rgba(239, 68, 68, 0.1)", display: "flex", alignItems: "center", justifyContent: "center" }, children: /* @__PURE__ */ jsxDEV(Swords, { color: "#ef4444", size: 24 }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 220,
              columnNumber: 27
            }) }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 219,
              columnNumber: 23
            }),
            /* @__PURE__ */ jsxDEV("div", { children: [
              /* @__PURE__ */ jsxDEV("div", { className: "stat-label", children: "CREW POWER" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 223,
                columnNumber: 27
              }),
              /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "1.4rem", fontWeight: 900, color: "#fff" }, children: formatPower(totalPWR) }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 224,
                columnNumber: 27
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 222,
              columnNumber: 23
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 218,
            columnNumber: 19
          }),
          /* @__PURE__ */ jsxDEV("button", { className: "view-all-link", onClick: () => setView2("roster"), children: "DETAILS" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 227,
            columnNumber: 19
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 217,
          columnNumber: 15
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 205,
        columnNumber: 11
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 116,
      columnNumber: 7
    }),
    /* @__PURE__ */ jsxDEV("div", { className: "home-grid-layout", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "dashboard-sections", children: [
        /* @__PURE__ */ jsxDEV("section", { className: "dashboard-section", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "section-header", children: [
            /* @__PURE__ */ jsxDEV("h3", { children: [
              /* @__PURE__ */ jsxDEV(Activity, { size: 18, color: "#4ade80" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 239,
                columnNumber: 21
              }),
              " THE JOB BOARD"
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 239,
              columnNumber: 17
            }),
            /* @__PURE__ */ jsxDEV("button", { className: "view-all-link", onClick: () => setView2("missions"), children: [
              "BOARD ",
              /* @__PURE__ */ jsxDEV(ChevronRight, { size: 14 }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 240,
                columnNumber: 93
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 240,
              columnNumber: 17
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 238,
            columnNumber: 15
          }),
          /* @__PURE__ */ jsxDEV("div", { style: { display: "grid", gridTemplateColumns: isMobile2 ? "1fr" : "repeat(3, 1fr)", gap: 15 }, children: activeMissions.length > 0 ? activeMissions.slice(0, 3).map((m, i) => {
            const now = Date.now();
            const progress = Math.min(100, (now - m.startTime) / (m.endTime - m.startTime) * 100);
            const isReady = progress >= 100;
            return /* @__PURE__ */ jsxDEV("div", { className: "glass-panel", style: { padding: 15, position: "relative", overflow: "hidden", borderColor: isReady ? "#4ade80" : "rgba(255,255,255,0.1)" }, children: [
              /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }, children: [
                /* @__PURE__ */ jsxDEV("img", { src: m.heroImg, style: { width: 32, height: 32, borderRadius: "50%", border: "1px solid #fff" } }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 250,
                  columnNumber: 35
                }),
                /* @__PURE__ */ jsxDEV("div", { style: { flex: 1, overflow: "hidden" }, children: [
                  /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.75rem", fontWeight: 900, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }, children: m.heroName }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 252,
                    columnNumber: 39
                  }),
                  /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.55rem", opacity: 0.6, letterSpacing: 1 }, children: isReady ? "READY" : "OUT ON A JOB" }, void 0, false, {
                    fileName: "<stdin>",
                    lineNumber: 253,
                    columnNumber: 39
                  })
                ] }, void 0, true, {
                  fileName: "<stdin>",
                  lineNumber: 251,
                  columnNumber: 35
                })
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 249,
                columnNumber: 31
              }),
              /* @__PURE__ */ jsxDEV("div", { className: "bar-wrapper", style: { height: 4 }, children: /* @__PURE__ */ jsxDEV("div", { className: "bar-fill", style: { background: isReady ? "#4ade80" : "#facc15", width: `${progress}%` } }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 257,
                columnNumber: 35
              }) }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 256,
                columnNumber: 31
              }),
              isReady && /* @__PURE__ */ jsxDEV("div", { style: { position: "absolute", inset: 0, background: "rgba(74, 222, 128, 0.05)", animation: "pulse-soft 1s infinite" } }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 259,
                columnNumber: 43
              })
            ] }, i, true, {
              fileName: "<stdin>",
              lineNumber: 248,
              columnNumber: 27
            });
          }) : /* @__PURE__ */ jsxDEV("div", { className: "glass-panel", style: { gridColumn: "span 3", padding: 25, textAlign: "center", opacity: 0.4 }, children: /* @__PURE__ */ jsxDEV("p", { style: { margin: 0, fontSize: "0.8rem", fontStyle: "italic" }, children: "No active contracts deployed. Visit the Mission Board to scavenge for resources." }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 264,
            columnNumber: 27
          }) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 263,
            columnNumber: 23
          }) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 242,
            columnNumber: 15
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 237,
          columnNumber: 11
        }),
        /* @__PURE__ */ jsxDEV("section", { className: "dashboard-section", style: { marginTop: 25 }, children: [
          /* @__PURE__ */ jsxDEV("div", { className: "section-header", children: /* @__PURE__ */ jsxDEV("h3", { children: [
            /* @__PURE__ */ jsxDEV(LayoutGrid, { size: 18, color: "#00d2ff" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 273,
              columnNumber: 21
            }),
            " TACTICAL_OVERVIEW"
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 273,
            columnNumber: 17
          }) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 272,
            columnNumber: 15
          }),
          /* @__PURE__ */ jsxDEV("div", { style: { display: "grid", gridTemplateColumns: isMobile2 ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: 15 }, children: [
            /* @__PURE__ */ jsxDEV("div", { className: "glass-panel", style: { padding: 15, textAlign: "center" }, children: [
              /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.6rem", color: "#94a3b8", fontWeight: 900, marginBottom: 5 }, children: "MATERIALS" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 277,
                columnNumber: 23
              }),
              /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "1.2rem", fontWeight: 900, color: "#fff" }, children: formatPower(materials) }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 278,
                columnNumber: 23
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 276,
              columnNumber: 19
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "glass-panel", style: { padding: 15, textAlign: "center" }, children: [
              /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.6rem", color: "#f97316", fontWeight: 900, marginBottom: 5 }, children: "ESSENCE" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 281,
                columnNumber: 23
              }),
              /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "1.2rem", fontWeight: 900, color: "#f97316" }, children: formatPower(essence) }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 282,
                columnNumber: 23
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 280,
              columnNumber: 19
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "glass-panel", style: { padding: 15, textAlign: "center" }, children: [
              /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.6rem", color: "#a855f7", fontWeight: 900, marginBottom: 5 }, children: "STAR POWER" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 285,
                columnNumber: 23
              }),
              /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "1.2rem", fontWeight: 900, color: "#a855f7" }, children: aura }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 286,
                columnNumber: 23
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 284,
              columnNumber: 19
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "glass-panel", style: { padding: 15, textAlign: "center" }, children: [
              /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.6rem", color: "#facc15", fontWeight: 900, marginBottom: 5 }, children: "TOKENS" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 289,
                columnNumber: 23
              }),
              /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "1.2rem", fontWeight: 900, color: "#facc15" }, children: eventTokens.toLocaleString() }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 290,
                columnNumber: 23
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 288,
              columnNumber: 19
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 275,
            columnNumber: 15
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 271,
          columnNumber: 11
        }),
        /* @__PURE__ */ jsxDEV("section", { className: "dashboard-section", style: { marginTop: 25 }, children: [
          /* @__PURE__ */ jsxDEV("div", { className: "section-header", children: /* @__PURE__ */ jsxDEV("h3", { children: [
            /* @__PURE__ */ jsxDEV(Users, { size: 18, color: "#f472b6" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 298,
              columnNumber: 21
            }),
            " SQUAD_RESONANCE"
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 298,
            columnNumber: 17
          }) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 297,
            columnNumber: 15
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "glass-panel", style: { padding: 20 }, children: /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", flexWrap: "wrap", gap: 15 }, children: squadComposition.filter((s) => s[1] > 0).map(([el, count]) => /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.03)", padding: "6px 12px", borderRadius: 10, border: `1px solid ${ELEMENTS[el].color}44` }, children: [
            /* @__PURE__ */ jsxDEV("div", { style: { width: 8, height: 8, borderRadius: "50%", background: ELEMENTS[el].color } }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 304,
              columnNumber: 31
            }),
            /* @__PURE__ */ jsxDEV("span", { style: { fontSize: "0.75rem", fontWeight: 900 }, children: el }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 305,
              columnNumber: 31
            }),
            /* @__PURE__ */ jsxDEV("span", { style: { fontSize: "0.75rem", opacity: 0.5 }, children: count }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 306,
              columnNumber: 31
            })
          ] }, el, true, {
            fileName: "<stdin>",
            lineNumber: 303,
            columnNumber: 27
          })) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 301,
            columnNumber: 19
          }) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 300,
            columnNumber: 15
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 296,
          columnNumber: 11
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 234,
        columnNumber: 9
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "home-sidebar-ops", style: { display: "flex", flexDirection: "column", gap: 20 }, children: [
        /* @__PURE__ */ jsxDEV("div", { className: "glass-panel", style: { borderLeft: "4px solid var(--gem-color)", padding: 20, background: "linear-gradient(135deg, rgba(34, 211, 238, 0.05), transparent)" }, children: [
          /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 15 }, children: [
            /* @__PURE__ */ jsxDEV(Monitor, { size: 18, color: "var(--gem-color)" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 321,
              columnNumber: 21
            }),
            /* @__PURE__ */ jsxDEV("h3", { style: { margin: 0, fontSize: "0.9rem", fontWeight: 900, letterSpacing: 2 }, children: "HOUSE RULES" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 322,
              columnNumber: 21
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 320,
            columnNumber: 17
          }),
          /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.8rem", lineHeight: 1.6 }, children: [
            /* @__PURE__ */ jsxDEV("div", { children: [
              "Current Objective: ",
              /* @__PURE__ */ jsxDEV("span", { style: { color: "#fff", fontWeight: 800 }, children: [
                "Clear Stage ",
                nextStage
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 325,
                columnNumber: 45
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 325,
              columnNumber: 21
            }),
            /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", justifyContent: "space-between", marginTop: 10 }, children: [
              /* @__PURE__ */ jsxDEV("span", { style: { opacity: 0.6 }, children: "Rec. Power:" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 327,
                columnNumber: 25
              }),
              /* @__PURE__ */ jsxDEV("span", { style: { fontWeight: 900 }, children: formatPower(recommendedCP) }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 328,
                columnNumber: 25
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 326,
              columnNumber: 21
            }),
            /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", justifyContent: "space-between" }, children: [
              /* @__PURE__ */ jsxDEV("span", { style: { opacity: 0.6 }, children: "Status:" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 331,
                columnNumber: 25
              }),
              /* @__PURE__ */ jsxDEV("span", { style: { fontWeight: 900, color: totalPWR >= recommendedCP ? "#4ade80" : "#ef4444" }, children: totalPWR >= recommendedCP ? "IN THE GAME" : "INSUFFICIENT" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 332,
                columnNumber: 25
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 330,
              columnNumber: 21
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 324,
            columnNumber: 17
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 319,
          columnNumber: 13
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "glass-panel", style: { padding: 20, borderLeft: "4px solid #ef4444" }, children: [
          /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 15 }, children: [
            /* @__PURE__ */ jsxDEV(Trophy, { size: 18, color: "#ef4444" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 342,
              columnNumber: 21
            }),
            /* @__PURE__ */ jsxDEV("h3", { style: { margin: 0, fontSize: "0.9rem", fontWeight: 900, letterSpacing: 2 }, children: "ENDGAME" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 343,
              columnNumber: 21
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 341,
            columnNumber: 18
          }),
          /* @__PURE__ */ jsxDEV("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }, children: [
            /* @__PURE__ */ jsxDEV("div", { className: "stat-hex", style: { padding: 10 }, children: [
              /* @__PURE__ */ jsxDEV("div", { className: "hex-label", children: "THE VOID" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 347,
                columnNumber: 25
              }),
              /* @__PURE__ */ jsxDEV("div", { className: "hex-val", style: { color: "#ef4444" }, children: endlessFloor }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 348,
                columnNumber: 25
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 346,
              columnNumber: 21
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "stat-hex", style: { padding: 10 }, children: [
              /* @__PURE__ */ jsxDEV("div", { className: "hex-label", children: "CLEARED" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 351,
                columnNumber: 25
              }),
              /* @__PURE__ */ jsxDEV("div", { className: "hex-val", style: { color: "#facc15" }, children: unlockedIds.length }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 352,
                columnNumber: 25
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 350,
              columnNumber: 21
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 345,
            columnNumber: 17
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 340,
          columnNumber: 13
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "glass-panel", style: { borderLeft: "4px solid #facc15", padding: 20 }, children: [
          /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }, children: [
            /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
              /* @__PURE__ */ jsxDEV(Database, { size: 18, color: "#facc15" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 361,
                columnNumber: 25
              }),
              /* @__PURE__ */ jsxDEV("h3", { style: { margin: 0, fontSize: "0.9rem", fontWeight: 900, color: "#facc15" }, children: "THE VAULT" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 362,
                columnNumber: 25
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 360,
              columnNumber: 21
            }),
            /* @__PURE__ */ jsxDEV("span", { style: { fontSize: "0.65rem", fontWeight: 900, opacity: 0.6 }, children: [
              Math.floor(vaultCredits / maxVaultCapacity * 100),
              "%"
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 364,
              columnNumber: 21
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 359,
            columnNumber: 17
          }),
          /* @__PURE__ */ jsxDEV("div", { className: "bar-wrapper", style: { height: 6, marginBottom: 15 }, children: /* @__PURE__ */ jsxDEV("div", { className: "bar-fill", style: { background: "#facc15", width: `${vaultCredits / maxVaultCapacity * 100}%` } }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 367,
            columnNumber: 21
          }) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 366,
            columnNumber: 17
          }),
          /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
            /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "1.4rem", fontWeight: 900 }, children: [
              "$",
              vaultCredits.toLocaleString()
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 370,
              columnNumber: 21
            }),
            /* @__PURE__ */ jsxDEV("button", { className: "sb-btn confirm", style: { height: 32, padding: "0 16px", fontSize: "0.7rem" }, onClick: claimVault, disabled: vaultCredits <= 0, children: "HARVEST" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 371,
              columnNumber: 21
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 369,
            columnNumber: 17
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 358,
          columnNumber: 13
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "glass-panel", style: { borderLeft: "4px solid #00d2ff", padding: 20 }, children: [
          /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 15 }, children: /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
            /* @__PURE__ */ jsxDEV(Gem, { size: 18, color: "#00d2ff" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 379,
              columnNumber: 25
            }),
            /* @__PURE__ */ jsxDEV("h3", { style: { margin: 0, fontSize: "0.9rem", fontWeight: 900, color: "#00d2ff" }, children: "GEODE" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 380,
              columnNumber: 25
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 378,
            columnNumber: 21
          }) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 377,
            columnNumber: 17
          }),
          /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
            /* @__PURE__ */ jsxDEV("div", { children: [
              /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "1.8rem", fontWeight: 900, color: "#fff" }, children: Math.floor(unclaimedGems) }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 385,
                columnNumber: 25
              }),
              /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.6rem", color: "#94a3b8", letterSpacing: 1 }, children: "SYNTHESIZING..." }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 386,
                columnNumber: 25
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 384,
              columnNumber: 21
            }),
            /* @__PURE__ */ jsxDEV("button", { className: "sb-btn confirm", style: { background: "#00d2ff", height: 32, padding: "0 16px", fontSize: "0.7rem" }, onClick: claimGeode, disabled: unclaimedGems < 1, children: "COLLECT" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 388,
              columnNumber: 21
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 383,
            columnNumber: 17
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 376,
          columnNumber: 13
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "glass-panel", style: { padding: 15, background: "rgba(0,0,0,0.4)", border: "none" }, children: [
          /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.6rem", fontWeight: 900, color: "var(--text-muted)", marginBottom: 10, letterSpacing: 2 }, children: "THE FEED" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 394,
            columnNumber: 17
          }),
          /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", flexDirection: "column", gap: 8 }, children: [
            /* @__PURE__ */ jsxDEV("div", { className: "news-item", style: { border: "none", margin: 0, padding: 0 }, children: [
              /* @__PURE__ */ jsxDEV("span", { className: "news-tag", style: { fontSize: "0.55rem" }, children: "[HITS]" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 397,
                columnNumber: 25
              }),
              /* @__PURE__ */ jsxDEV("span", { style: { fontSize: "0.65rem" }, children: [
                stats.totalHits.toLocaleString(),
                " recorded"
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 398,
                columnNumber: 25
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 396,
              columnNumber: 21
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "news-item", style: { border: "none", margin: 0, padding: 0 }, children: [
              /* @__PURE__ */ jsxDEV("span", { className: "news-tag", style: { fontSize: "0.55rem", color: "#f472b6" }, children: "[XP]" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 401,
                columnNumber: 25
              }),
              /* @__PURE__ */ jsxDEV("span", { style: { fontSize: "0.65rem" }, children: [
                stats.totalXpGained.toLocaleString(),
                " total"
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 402,
                columnNumber: 25
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 400,
              columnNumber: 21
            }),
            /* @__PURE__ */ jsxDEV("div", { className: "news-item", style: { border: "none", margin: 0, padding: 0 }, children: [
              /* @__PURE__ */ jsxDEV("span", { className: "news-tag", style: { fontSize: "0.55rem", color: "#4ade80" }, children: "[DAYS]" }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 405,
                columnNumber: 25
              }),
              /* @__PURE__ */ jsxDEV("span", { style: { fontSize: "0.65rem" }, children: [
                Math.max(1, Math.floor((Date.now() - stats.startTime) / (1e3 * 60 * 60 * 24))),
                " mission cycle"
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 406,
                columnNumber: 25
              })
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 404,
              columnNumber: 21
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 395,
            columnNumber: 17
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 393,
          columnNumber: 13
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 316,
        columnNumber: 9
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 233,
      columnNumber: 7
    }),
    /* @__PURE__ */ jsxDEV("div", { className: "home-footer", style: { marginTop: 60, opacity: 0.4 }, children: [
      /* @__PURE__ */ jsxDEV("div", { className: "footer-line" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 414,
        columnNumber: 9
      }),
      /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", justifyContent: "center", gap: 20, marginBottom: 10 }, children: [
        /* @__PURE__ */ jsxDEV("span", { children: "MUGEN_OS_V3.0_LIVE" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 416,
          columnNumber: 13
        }),
        /* @__PURE__ */ jsxDEV("span", { children: "VIP ACCESS" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 417,
          columnNumber: 13
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 415,
        columnNumber: 9
      }),
      /* @__PURE__ */ jsxDEV("span", { children: "\xA9 2025 MUGEN TRAINER SYSTEM // NOSTALGIC PROJECT 08" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 419,
        columnNumber: 9
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 413,
      columnNumber: 7
    })
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 84,
    columnNumber: 5
  });
};;

export { HomeView };
