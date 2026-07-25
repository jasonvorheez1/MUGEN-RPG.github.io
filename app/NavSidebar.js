import { Fragment, jsxDEV } from "react/jsx-dev-runtime";
import React from "react";
import { Sword, Heart, Trophy, ShoppingBag, Users, Settings, Sparkles, Star, Home, LayoutGrid, MoreHorizontal, Swords, Clover } from "lucide-react";
import { playSound } from "../utils.js";
const NavSidebar = (props) => {
  const {
    isMobile,
    view,
    setView,
    characters,
    selectedCharIndex,
    unlockedFeatures,
    createFloatingText,
    showMobileMore,
    setShowMobileMore
  } = props;
  return /* @__PURE__ */ jsxDEV(Fragment, { children: [
    /* @__PURE__ */ jsxDEV("nav", { className: "nav-container", children: !isMobile ? /* @__PURE__ */ jsxDEV(Fragment, { children: [
      /* @__PURE__ */ jsxDEV("div", { className: "nav-brand", style: {
        fontFamily: "Cinzel",
        letterSpacing: "4px",
        fontStyle: "italic",
        background: "linear-gradient(to right, #fff, #94a3b8)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent"
      }, children: "MUGEN 08" }, void 0, false, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
        lineNumber: 16,
        columnNumber: 58
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "nav-section-label", children: "Main" }, void 0, false, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
        lineNumber: 23,
        columnNumber: 26
      }),
      /* @__PURE__ */ jsxDEV("div", { className: `nav-item ${view === "home" ? "active" : ""}`, onMouseEnter: () => playSound("menu_hover", 0.1), onClick: () => {
        setView("home");
        playSound("menu_click", 0.2);
      }, children: [
        /* @__PURE__ */ jsxDEV(Home, { size: 20 }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
          lineNumber: 26,
          columnNumber: 12
        }),
        " ",
        /* @__PURE__ */ jsxDEV("span", { className: "nav-label-text", children: "The District" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
          lineNumber: 26,
          columnNumber: 31
        })
      ] }, void 0, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
        lineNumber: 23,
        columnNumber: 71
      }),
      /* @__PURE__ */ jsxDEV("div", { className: `nav-item ${["train", "abilities", "social"].includes(view) ? "active" : ""}`, onMouseEnter: () => playSound("menu_hover", 0.1), onClick: () => {
        setView("train");
        playSound("menu_click", 0.2);
      }, children: [
        characters[selectedCharIndex] ? /* @__PURE__ */ jsxDEV("img", { src: characters[selectedCharIndex].imageUrl, className: "nav-char-icon", alt: "" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
          lineNumber: 29,
          columnNumber: 45
        }) : /* @__PURE__ */ jsxDEV(Sword, { size: 20 }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
          lineNumber: 29,
          columnNumber: 133
        }),
        /* @__PURE__ */ jsxDEV("span", { className: "nav-label-text", children: "Profile" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
          lineNumber: 29,
          columnNumber: 153
        })
      ] }, void 0, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
        lineNumber: 26,
        columnNumber: 89
      }),
      /* @__PURE__ */ jsxDEV("div", { className: `nav-item ${view === "roster" ? "active" : ""}`, onMouseEnter: () => playSound("menu_hover", 0.1), onClick: () => {
        setView("roster");
        playSound("menu_click", 0.2);
      }, children: [
        /* @__PURE__ */ jsxDEV(Users, { size: 20 }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
          lineNumber: 32,
          columnNumber: 12
        }),
        " ",
        /* @__PURE__ */ jsxDEV("span", { className: "nav-label-text", children: "Roster" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
          lineNumber: 32,
          columnNumber: 32
        })
      ] }, void 0, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
        lineNumber: 29,
        columnNumber: 206
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "nav-divider" }, void 0, false, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
        lineNumber: 32,
        columnNumber: 84
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "nav-section-label", children: "Nightlife" }, void 0, false, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
        lineNumber: 32,
        columnNumber: 115
      }),
      /* @__PURE__ */ jsxDEV("div", { className: `nav-item ${view === "lounge" ? "active" : ""}`, onMouseEnter: () => playSound("menu_hover", 0.1), onClick: () => {
        setView("lounge");
        playSound("menu_click", 0.2);
      }, children: [
        /* @__PURE__ */ jsxDEV(Heart, { size: 20 }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
          lineNumber: 35,
          columnNumber: 12
        }),
        " ",
        /* @__PURE__ */ jsxDEV("span", { className: "nav-label-text", children: "Lounge" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
          lineNumber: 35,
          columnNumber: 32
        })
      ] }, void 0, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
        lineNumber: 32,
        columnNumber: 165
      }),
      /* @__PURE__ */ jsxDEV("div", { className: `nav-item ${view === "gacha" ? "active" : ""}`, onMouseEnter: () => playSound("menu_hover", 0.1), onClick: () => {
        setView("gacha");
        playSound("menu_click", 0.2);
      }, children: [
        /* @__PURE__ */ jsxDEV(Clover, { size: 20 }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
          lineNumber: 38,
          columnNumber: 12
        }),
        " ",
        /* @__PURE__ */ jsxDEV("span", { className: "nav-label-text", children: "Recruit" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
          lineNumber: 38,
          columnNumber: 33
        })
      ] }, void 0, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
        lineNumber: 35,
        columnNumber: 84
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "nav-divider" }, void 0, false, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
        lineNumber: 38,
        columnNumber: 86
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "nav-section-label", children: "Battle" }, void 0, false, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
        lineNumber: 38,
        columnNumber: 117
      }),
      /* @__PURE__ */ jsxDEV("div", { className: `nav-item ${view === "campaign" ? "active" : ""}`, onMouseEnter: () => playSound("menu_hover", 0.1), onClick: () => {
        setView("campaign");
        playSound("menu_click", 0.2);
      }, children: [
        /* @__PURE__ */ jsxDEV(Swords, { size: 20 }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
          lineNumber: 41,
          columnNumber: 12
        }),
        " ",
        /* @__PURE__ */ jsxDEV("span", { className: "nav-label-text", children: "Campaign" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
          lineNumber: 41,
          columnNumber: 33
        })
      ] }, void 0, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
        lineNumber: 38,
        columnNumber: 164
      }),
      /* @__PURE__ */ jsxDEV("div", { className: `nav-item ${!unlockedFeatures.includes("events") ? "locked-nav" : ""} ${view === "events" ? "active" : ""}`, onMouseEnter: () => playSound("menu_hover", 0.1), onClick: () => unlockedFeatures.includes("events") ? (setView("events"), playSound("menu_click", 0.2)) : createFloatingText("Reach Street Gym Rank 2 to unlock", true), children: [
        /* @__PURE__ */ jsxDEV(Sparkles, { size: 20 }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
          lineNumber: 41,
          columnNumber: 430
        }),
        " ",
        /* @__PURE__ */ jsxDEV("span", { className: "nav-label-text", children: "Events" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
          lineNumber: 41,
          columnNumber: 453
        }),
        !unlockedFeatures.includes("events") && /* @__PURE__ */ jsxDEV("span", { className: "nav-rank-req", children: "RANK 2" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
          lineNumber: 41,
          columnNumber: 540
        })
      ] }, void 0, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
        lineNumber: 41,
        columnNumber: 87
      }),
      /* @__PURE__ */ jsxDEV("div", { className: `nav-item ${!unlockedFeatures.includes("trials") ? "locked-nav" : ""} ${view === "trials" ? "active" : ""}`, onMouseEnter: () => playSound("menu_hover", 0.1), onClick: () => unlockedFeatures.includes("trials") ? (setView("trials"), playSound("menu_click", 0.2)) : createFloatingText("Reach Street Gym Rank 2 to unlock", true), children: [
        /* @__PURE__ */ jsxDEV(Star, { size: 20 }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
          lineNumber: 41,
          columnNumber: 934
        }),
        " ",
        /* @__PURE__ */ jsxDEV("span", { className: "nav-label-text", children: "Trials" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
          lineNumber: 41,
          columnNumber: 953
        }),
        !unlockedFeatures.includes("trials") && /* @__PURE__ */ jsxDEV("span", { className: "nav-rank-req", children: "RANK 2" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
          lineNumber: 41,
          columnNumber: 1040
        })
      ] }, void 0, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
        lineNumber: 41,
        columnNumber: 591
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "nav-divider" }, void 0, false, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
        lineNumber: 41,
        columnNumber: 1091
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "nav-section-label", children: "Business" }, void 0, false, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
        lineNumber: 41,
        columnNumber: 1122
      }),
      /* @__PURE__ */ jsxDEV("div", { className: `nav-item ${!unlockedFeatures.includes("missions") ? "locked-nav" : ""} ${view === "missions" ? "active" : ""}`, onMouseEnter: () => playSound("menu_hover", 0.1), onClick: () => unlockedFeatures.includes("missions") ? (setView("missions"), playSound("menu_click", 0.2)) : createFloatingText("Reach Street Gym Rank 3 to unlock", true), children: [
        /* @__PURE__ */ jsxDEV(Trophy, { size: 20 }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
          lineNumber: 41,
          columnNumber: 1522
        }),
        " ",
        /* @__PURE__ */ jsxDEV("span", { className: "nav-label-text", children: "Jobs" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
          lineNumber: 41,
          columnNumber: 1543
        }),
        !unlockedFeatures.includes("missions") && /* @__PURE__ */ jsxDEV("span", { className: "nav-rank-req", children: "RANK 3" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
          lineNumber: 41,
          columnNumber: 1630
        })
      ] }, void 0, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
        lineNumber: 41,
        columnNumber: 1171
      }),
      /* @__PURE__ */ jsxDEV("div", { className: `nav-item ${view === "inventory" ? "active" : ""}`, onMouseEnter: () => playSound("menu_hover", 0.1), onClick: () => {
        setView("inventory");
        playSound("menu_click", 0.2);
      }, children: [
        /* @__PURE__ */ jsxDEV(LayoutGrid, { size: 20 }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
          lineNumber: 44,
          columnNumber: 12
        }),
        " ",
        /* @__PURE__ */ jsxDEV("span", { className: "nav-label-text", children: "Stash" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
          lineNumber: 44,
          columnNumber: 37
        })
      ] }, void 0, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
        lineNumber: 41,
        columnNumber: 1681
      }),
      /* @__PURE__ */ jsxDEV("div", { className: `nav-item ${view === "shop" ? "active" : ""}`, onMouseEnter: () => playSound("menu_hover", 0.1), onClick: () => {
        setView("shop");
        playSound("menu_click", 0.2);
      }, children: [
        /* @__PURE__ */ jsxDEV(ShoppingBag, { size: 20 }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
          lineNumber: 47,
          columnNumber: 12
        }),
        " ",
        /* @__PURE__ */ jsxDEV("span", { className: "nav-label-text", children: "Shop" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
          lineNumber: 47,
          columnNumber: 38
        })
      ] }, void 0, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
        lineNumber: 44,
        columnNumber: 88
      }),
      /* @__PURE__ */ jsxDEV("div", { className: `nav-item ${view === "settings" ? "active" : ""}`, onMouseEnter: () => playSound("menu_hover", 0.1), onClick: () => {
        setView("settings");
        playSound("menu_click", 0.2);
      }, style: {
        marginTop: "auto"
      }, children: [
        /* @__PURE__ */ jsxDEV(Settings, { size: 20 }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
          lineNumber: 52,
          columnNumber: 12
        }),
        " ",
        /* @__PURE__ */ jsxDEV("span", { className: "nav-label-text", children: "Settings" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
          lineNumber: 52,
          columnNumber: 35
        })
      ] }, void 0, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
        lineNumber: 47,
        columnNumber: 88
      })
    ] }, void 0, true, {
      fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
      lineNumber: 16,
      columnNumber: 56
    }) : /* @__PURE__ */ jsxDEV(Fragment, { children: [
      /* @__PURE__ */ jsxDEV("div", { className: `nav-item ${view === "home" ? "active" : ""}`, onClick: () => {
        setView("home");
        setShowMobileMore(false);
        playSound("menu_click", 0.2);
      }, children: [
        /* @__PURE__ */ jsxDEV(Home, { size: 22 }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
          lineNumber: 56,
          columnNumber: 12
        }),
        " ",
        /* @__PURE__ */ jsxDEV("span", { className: "nav-label-text", children: "Base" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
          lineNumber: 56,
          columnNumber: 31
        })
      ] }, void 0, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
        lineNumber: 52,
        columnNumber: 97
      }),
      /* @__PURE__ */ jsxDEV("div", { className: `nav-item ${["train", "abilities", "social"].includes(view) ? "active" : ""}`, onClick: () => {
        setView("train");
        setShowMobileMore(false);
        playSound("menu_click", 0.2);
      }, children: [
        /* @__PURE__ */ jsxDEV(Sword, { size: 22 }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
          lineNumber: 60,
          columnNumber: 12
        }),
        " ",
        /* @__PURE__ */ jsxDEV("span", { className: "nav-label-text", children: "Hero" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
          lineNumber: 60,
          columnNumber: 32
        })
      ] }, void 0, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
        lineNumber: 56,
        columnNumber: 81
      }),
      /* @__PURE__ */ jsxDEV("div", { className: `nav-item ${view === "campaign" ? "active" : ""}`, onClick: () => {
        setView("campaign");
        setShowMobileMore(false);
        playSound("menu_click", 0.2);
      }, children: [
        /* @__PURE__ */ jsxDEV(Swords, { size: 22 }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
          lineNumber: 64,
          columnNumber: 12
        }),
        " ",
        /* @__PURE__ */ jsxDEV("span", { className: "nav-label-text", children: "Combat" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
          lineNumber: 64,
          columnNumber: 33
        })
      ] }, void 0, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
        lineNumber: 60,
        columnNumber: 82
      }),
      /* @__PURE__ */ jsxDEV("div", { className: `nav-item ${view === "events" ? "active" : ""}`, onClick: () => {
        setView("events");
        setShowMobileMore(false);
        playSound("menu_click", 0.2);
      }, children: [
        /* @__PURE__ */ jsxDEV(Sparkles, { size: 22 }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
          lineNumber: 68,
          columnNumber: 12
        }),
        " ",
        /* @__PURE__ */ jsxDEV("span", { className: "nav-label-text", children: "Events" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
          lineNumber: 68,
          columnNumber: 35
        })
      ] }, void 0, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
        lineNumber: 64,
        columnNumber: 85
      }),
      /* @__PURE__ */ jsxDEV("div", { className: `nav-item ${view === "gacha" ? "active" : ""}`, onClick: () => {
        setView("gacha");
        setShowMobileMore(false);
        playSound("menu_click", 0.2);
      }, children: [
        /* @__PURE__ */ jsxDEV(Clover, { size: 22 }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
          lineNumber: 72,
          columnNumber: 12
        }),
        " ",
        /* @__PURE__ */ jsxDEV("span", { className: "nav-label-text", children: "Recruit" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
          lineNumber: 72,
          columnNumber: 33
        })
      ] }, void 0, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
        lineNumber: 68,
        columnNumber: 87
      }),
      /* @__PURE__ */ jsxDEV("div", { className: `nav-item ${showMobileMore ? "active" : ""}`, onClick: () => {
        setShowMobileMore(!showMobileMore);
        playSound("menu_click", 0.1);
      }, children: [
        /* @__PURE__ */ jsxDEV(MoreHorizontal, { size: 22 }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
          lineNumber: 75,
          columnNumber: 12
        }),
        " ",
        /* @__PURE__ */ jsxDEV("span", { className: "nav-label-text", children: "More" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
          lineNumber: 75,
          columnNumber: 41
        })
      ] }, void 0, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
        lineNumber: 72,
        columnNumber: 86
      })
    ] }, void 0, true, {
      fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
      lineNumber: 52,
      columnNumber: 95
    }) }, void 0, false, {
      fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
      lineNumber: 16,
      columnNumber: 12
    }),
    isMobile && showMobileMore && /* @__PURE__ */ jsxDEV("div", { className: "mobile-more-overlay", onClick: () => setShowMobileMore(false), children: /* @__PURE__ */ jsxDEV("div", { className: "mobile-more-panel", onClick: (e) => e.stopPropagation(), children: [
      /* @__PURE__ */ jsxDEV("div", { className: "more-menu-item", onClick: () => {
        setView("roster");
        setShowMobileMore(false);
      }, children: [
        /* @__PURE__ */ jsxDEV(Users, { size: 24, color: "var(--primary)" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
          lineNumber: 78,
          columnNumber: 12
        }),
        " ",
        /* @__PURE__ */ jsxDEV("span", { className: "more-menu-label", children: "Roster" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
          lineNumber: 78,
          columnNumber: 55
        })
      ] }, void 0, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
        lineNumber: 75,
        columnNumber: 280
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "more-menu-item", onClick: () => {
        setView("lounge");
        setShowMobileMore(false);
      }, children: [
        /* @__PURE__ */ jsxDEV(Heart, { size: 24, color: "#f472b6" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
          lineNumber: 81,
          columnNumber: 12
        }),
        " ",
        /* @__PURE__ */ jsxDEV("span", { className: "more-menu-label", children: "Lounge" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
          lineNumber: 81,
          columnNumber: 48
        })
      ] }, void 0, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
        lineNumber: 78,
        columnNumber: 108
      }),
      /* @__PURE__ */ jsxDEV("div", { className: `more-menu-item ${!unlockedFeatures.includes("events") ? "locked-nav" : ""}`, onClick: () => {
        if (unlockedFeatures.includes("events")) {
          setView("events");
          setShowMobileMore(false);
        } else createFloatingText("Reach Street Gym Rank 2 to unlock", true);
      }, children: [
        /* @__PURE__ */ jsxDEV(Sparkles, { size: 24, color: "#a855f7" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
          lineNumber: 86,
          columnNumber: 12
        }),
        " ",
        /* @__PURE__ */ jsxDEV("span", { className: "more-menu-label", children: "Events" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
          lineNumber: 86,
          columnNumber: 51
        }),
        !unlockedFeatures.includes("events") && /* @__PURE__ */ jsxDEV("span", { className: "nav-rank-req", children: "RANK 2" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
          lineNumber: 86,
          columnNumber: 139
        })
      ] }, void 0, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
        lineNumber: 81,
        columnNumber: 101
      }),
      /* @__PURE__ */ jsxDEV("div", { className: `more-menu-item ${!unlockedFeatures.includes("trials") ? "locked-nav" : ""}`, onClick: () => {
        if (unlockedFeatures.includes("trials")) {
          setView("trials");
          setShowMobileMore(false);
        } else createFloatingText("Reach Street Gym Rank 2 to unlock", true);
      }, children: [
        /* @__PURE__ */ jsxDEV(Star, { size: 24, color: "#facc15" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
          lineNumber: 91,
          columnNumber: 12
        }),
        " ",
        /* @__PURE__ */ jsxDEV("span", { className: "more-menu-label", children: "Trials" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
          lineNumber: 91,
          columnNumber: 47
        }),
        !unlockedFeatures.includes("trials") && /* @__PURE__ */ jsxDEV("span", { className: "nav-rank-req", children: "RANK 2" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
          lineNumber: 91,
          columnNumber: 135
        })
      ] }, void 0, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
        lineNumber: 86,
        columnNumber: 190
      }),
      /* @__PURE__ */ jsxDEV("div", { className: `more-menu-item ${!unlockedFeatures.includes("missions") ? "locked-nav" : ""}`, onClick: () => {
        if (unlockedFeatures.includes("missions")) {
          setView("missions");
          setShowMobileMore(false);
        } else createFloatingText("Reach Street Gym Rank 3 to unlock", true);
      }, children: [
        /* @__PURE__ */ jsxDEV(Trophy, { size: 24, color: "#fb923c" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
          lineNumber: 96,
          columnNumber: 12
        }),
        " ",
        /* @__PURE__ */ jsxDEV("span", { className: "more-menu-label", children: "Jobs" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
          lineNumber: 96,
          columnNumber: 49
        }),
        !unlockedFeatures.includes("missions") && /* @__PURE__ */ jsxDEV("span", { className: "nav-rank-req", children: "RANK 3" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
          lineNumber: 96,
          columnNumber: 137
        })
      ] }, void 0, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
        lineNumber: 91,
        columnNumber: 186
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "more-menu-item", onClick: () => {
        setView("inventory");
        setShowMobileMore(false);
      }, children: [
        /* @__PURE__ */ jsxDEV(LayoutGrid, { size: 24, color: "#94a3b8" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
          lineNumber: 99,
          columnNumber: 12
        }),
        " ",
        /* @__PURE__ */ jsxDEV("span", { className: "more-menu-label", children: "Stash" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
          lineNumber: 99,
          columnNumber: 53
        })
      ] }, void 0, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
        lineNumber: 96,
        columnNumber: 188
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "more-menu-item", onClick: () => {
        setView("shop");
        setShowMobileMore(false);
      }, children: [
        /* @__PURE__ */ jsxDEV(ShoppingBag, { size: 24, color: "#22d3ee" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
          lineNumber: 102,
          columnNumber: 12
        }),
        " ",
        /* @__PURE__ */ jsxDEV("span", { className: "more-menu-label", children: "Shop" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
          lineNumber: 102,
          columnNumber: 54
        })
      ] }, void 0, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
        lineNumber: 99,
        columnNumber: 105
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "more-menu-item", style: {
        gridColumn: "span 3"
      }, onClick: () => {
        setView("settings");
        setShowMobileMore(false);
      }, children: [
        /* @__PURE__ */ jsxDEV(Settings, { size: 20 }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
          lineNumber: 107,
          columnNumber: 12
        }),
        " ",
        /* @__PURE__ */ jsxDEV("span", { className: "more-menu-label", children: "System Settings" }, void 0, false, {
          fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
          lineNumber: 107,
          columnNumber: 35
        })
      ] }, void 0, true, {
        fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
        lineNumber: 102,
        columnNumber: 105
      })
    ] }, void 0, true, {
      fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
      lineNumber: 75,
      columnNumber: 210
    }) }, void 0, false, {
      fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
      lineNumber: 75,
      columnNumber: 132
    })
  ] }, void 0, true, {
    fileName: "C:\\Users\\anoob\\OneDrive\\Documents\\mugen_trainer___level_up_your_heroes_by_scraps\\MUGEN-RPG.github.io\\app\\NavSidebar.jsx",
    lineNumber: 16,
    columnNumber: 10
  });
};
export {
  NavSidebar
};
