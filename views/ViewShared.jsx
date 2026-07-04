import { Fragment, jsxDEV } from "react/jsx-dev-runtime";
import React, { useState, useEffect } from "react";
import { ELEMENTS, LEADER_SKILLS } from "../constants.js";
import { playSound } from "../utils.js";

const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;

const CampaignIntro = ({ activeBattle, squad, bossImg, onComplete }) => {
  const [phase, setPhase] = useState(0);
  if (!activeBattle) return null;
  const elColor = ELEMENTS[activeBattle.element]?.color || "#fff";
  const leader = squad[0];
  const leaderSkill = leader ? LEADER_SKILLS.find((ls) => ls.id === leader.leaderSkillId) : null;
  useEffect(() => {
    playSound("riser", 0.4);
    const t0 = setTimeout(() => {
      setPhase(1);
      playSound("summon_start", 0.5);
    }, 400);
    const t1 = setTimeout(() => {
      setPhase(2);
      playSound("boss_intro", 0.8);
    }, 1400);
    const t2 = setTimeout(() => {
      setPhase(3);
      playSound("heavenly_hit", 0.6);
    }, 3e3);
    const t_leader = setTimeout(() => {
      setPhase(4);
      playSound("gacha_epic", 0.7);
      playSound("chime_shimmer", 0.5);
    }, 4500);
    const t3 = setTimeout(() => {
      setPhase(5);
      playSound("intro_boom", 1);
      playSound("slash_heavy", 0.4);
    }, 6e3);
    const t4 = setTimeout(() => {
      setPhase(6);
      playSound("hype_start", 0.9);
    }, 7200);
    const t5 = setTimeout(onComplete, 8600);
    return () => {
      [t0, t1, t2, t_leader, t3, t4, t5].forEach(clearTimeout);
    };
  }, []);
  return /* @__PURE__ */ jsxDEV("div", { className: "campaign-intro-overlay", style: { background: "#000" }, children: [
    /* @__PURE__ */ jsxDEV("div", { className: "anime-speed-lines", style: { opacity: phase >= 2 ? 0.3 : 0 } }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 3911,
      columnNumber: 8
    }),
    phase === 1 && /* @__PURE__ */ jsxDEV("div", { className: "animate-popIn", style: { textAlign: "center", zIndex: 10 }, children: [
      /* @__PURE__ */ jsxDEV("div", { style: { color: elColor, fontWeight: 900, letterSpacing: 8, fontSize: "1rem" }, className: "animate-pulse", children: "HIT THE STREETS" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 3916,
        columnNumber: 13
      }),
      /* @__PURE__ */ jsxDEV("h1", { style: { fontSize: "4rem", fontFamily: "MugenTitle", color: "#fff", margin: "10px 0" }, children: activeBattle.name.toUpperCase() }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 3917,
        columnNumber: 13
      }),
      /* @__PURE__ */ jsxDEV("div", { style: { fontSize: "0.8rem", opacity: 0.6, letterSpacing: 2 }, children: [
        "LOCATION: ",
        activeBattle.bg || "MUGEN STREETS"
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 3918,
        columnNumber: 13
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 3915,
      columnNumber: 10
    }),
    phase === 2 && /* @__PURE__ */ jsxDEV("div", { style: { position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }, children: [
      /* @__PURE__ */ jsxDEV("div", { className: "intro-banner-stripe", style: { background: "linear-gradient(90deg, #000, #ef4444, #000)", height: "160px" }, children: [
        /* @__PURE__ */ jsxDEV("div", { className: "intro-boss-name-huge", children: String(activeBattle?.enemy || activeBattle?.name || "Unknown").toUpperCase() }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 3926,
          columnNumber: 17
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "intro-element-tag", style: { borderColor: elColor, color: elColor }, children: [
          activeBattle?.element || "NEUTRAL",
          " TYPE"
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 3927,
          columnNumber: 17
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 3925,
        columnNumber: 13
      }),
      /* @__PURE__ */ jsxDEV("img", { src: bossImg, className: "animate-slideInRight", style: { position: "absolute", right: "5%", height: "90%", objectFit: "contain", zIndex: 4, filter: "drop-shadow(0 0 50px #ef4444)" } }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 3929,
        columnNumber: 13
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "intro-flash" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 3930,
        columnNumber: 13
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 3924,
      columnNumber: 10
    }),
    phase === 3 && /* @__PURE__ */ jsxDEV("div", { style: { position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }, children: [
      /* @__PURE__ */ jsxDEV("div", { className: "intro-banner-stripe", style: { background: "linear-gradient(90deg, #000, #3b82f6, #000)", height: "160px" }, children: /* @__PURE__ */ jsxDEV("div", { className: "intro-boss-name-huge", style: { color: "#fff" }, children: "CREW READY" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 3938,
        columnNumber: 17
      }) }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 3937,
        columnNumber: 13
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "intro-hero-stack animate-slideInLeft", style: { position: "absolute", left: "10%", zIndex: 10 }, children: squad.slice(0, 5).map((c, i) => /* @__PURE__ */ jsxDEV(
        "img",
        {
          src: c.imageUrl,
          className: "intro-hero-avatar",
          style: {
            width: 120,
            height: 120,
            marginLeft: i === 0 ? 0 : -40,
            zIndex: 10 - i,
            border: `4px solid ${ELEMENTS[c.element]?.color || "#fff"}`,
            boxShadow: `0 0 30px ${ELEMENTS[c.element]?.color || "#fff"}66`
          }
        },
        i,
        false,
        {
          fileName: "<stdin>",
          lineNumber: 3942,
          columnNumber: 21
        }
      )) }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 3940,
        columnNumber: 13
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "intro-flash" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 3952,
        columnNumber: 13
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 3936,
      columnNumber: 10
    }),
    phase === 4 && leaderSkill && /* @__PURE__ */ jsxDEV("div", { className: "leader-activation-overlay", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "animate-popIn", style: { marginBottom: 20 }, children: [
        /* @__PURE__ */ jsxDEV("div", { style: { color: "#facc15", fontWeight: 900, letterSpacing: 5, fontSize: "0.8rem" }, children: "CREW BONUS" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 3960,
          columnNumber: 17
        }),
        /* @__PURE__ */ jsxDEV("img", { src: leader.imageUrl, style: { width: 220, height: 220, borderRadius: "50%", border: "4px solid #facc15", boxShadow: "0 0 50px rgba(250, 204, 21, 0.4)", marginTop: 20 }, className: "animate-pulse" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 3961,
          columnNumber: 17
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 3959,
        columnNumber: 14
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "leader-skill-banner", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "leader-glow-pulse" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 3964,
          columnNumber: 17
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "leader-skill-name-reveal", children: leaderSkill.name }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 3965,
          columnNumber: 17
        }),
        /* @__PURE__ */ jsxDEV("div", { className: "leader-skill-desc-reveal", children: leaderSkill.desc }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 3966,
          columnNumber: 17
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 3963,
        columnNumber: 14
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "intro-flash", style: { animationDuration: "0.6s" } }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 3968,
        columnNumber: 14
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 3958,
      columnNumber: 11
    }),
    phase === 5 && /* @__PURE__ */ jsxDEV("div", { className: "intro-vs-container", style: { gap: 0 }, children: [
      /* @__PURE__ */ jsxDEV("div", { className: "intro-side player-side animate-slideInLeft", style: { background: "linear-gradient(90deg, rgba(59, 130, 246, 0.4), transparent)", height: "100vh", justifyContent: "center" }, children: /* @__PURE__ */ jsxDEV("img", { src: squad[0]?.imageUrl, style: { width: "80%", height: "60%", objectFit: "contain" } }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 3976,
        columnNumber: 17
      }) }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 3975,
        columnNumber: 13
      }),
      /* @__PURE__ */ jsxDEV("div", { style: { position: "absolute", zIndex: 50 }, children: /* @__PURE__ */ jsxDEV("div", { className: "vs-large animate-popIn", style: { fontSize: "10rem", textShadow: "0 0 50px #fff" }, children: "VS" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 3979,
        columnNumber: 17
      }) }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 3978,
        columnNumber: 13
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "intro-side enemy-side animate-slideInRight", style: { background: "linear-gradient(-90deg, rgba(239, 68, 68, 0.4), transparent)", height: "100vh", justifyContent: "center" }, children: /* @__PURE__ */ jsxDEV("img", { src: bossImg, style: { width: "80%", height: "60%", objectFit: "contain" } }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 3982,
        columnNumber: 17
      }) }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 3981,
        columnNumber: 13
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "intro-slash", style: { height: 100, background: "#fff" } }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 3984,
        columnNumber: 13
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 3974,
      columnNumber: 10
    }),
    phase === 6 && /* @__PURE__ */ jsxDEV("div", { style: { textAlign: "center", zIndex: 100 }, children: [
      /* @__PURE__ */ jsxDEV("div", { className: "animate-popIn intro-boss-name-huge", style: { fontSize: "12rem", fontStyle: "italic", color: "#fff", textShadow: "0 0 80px var(--primary)" }, children: "FIGHT!" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 3991,
        columnNumber: 13
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "intro-flash", style: { animationDuration: "0.2s" } }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 3992,
        columnNumber: 13
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 3990,
      columnNumber: 10
    })
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 3910,
    columnNumber: 5
  });
};;

export { isMobile, CampaignIntro };
