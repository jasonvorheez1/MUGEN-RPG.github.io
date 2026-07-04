import { jsxDEV } from "react/jsx-dev-runtime";
import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
const CustomSelect = ({ value, onChange, options, className, style, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const selectedOption = options.find((opt) => String(opt.value) === String(value));
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);
  return /* @__PURE__ */ jsxDEV("div", { className: `custom-select-container ${className || ""}`, style, ref: containerRef, children: [
    /* @__PURE__ */ jsxDEV(
      "div",
      {
        className: `custom-select-trigger ${isOpen ? "active" : ""}`,
        onClick: () => setIsOpen(!isOpen),
        children: [
          /* @__PURE__ */ jsxDEV("span", { className: "select-value-text", children: selectedOption ? selectedOption.label || selectedOption.value : placeholder || "Select..." }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 28,
            columnNumber: 9
          }),
          /* @__PURE__ */ jsxDEV(ChevronDown, { size: 14, className: `select-arrow-icon ${isOpen ? "rotated" : ""}` }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 31,
            columnNumber: 9
          })
        ]
      },
      void 0,
      true,
      {
        fileName: "<stdin>",
        lineNumber: 24,
        columnNumber: 7
      }
    ),
    isOpen && /* @__PURE__ */ jsxDEV("div", { className: "custom-select-options-list custom-scroll", children: options.map((opt) => /* @__PURE__ */ jsxDEV(
      "div",
      {
        className: `custom-select-option ${String(opt.value) === String(value) ? "is-selected" : ""}`,
        onClick: () => {
          onChange({ target: { value: opt.value } });
          setIsOpen(false);
        },
        children: opt.label || opt.value
      },
      String(opt.value),
      false,
      {
        fileName: "<stdin>",
        lineNumber: 37,
        columnNumber: 13
      }
    )) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 35,
      columnNumber: 9
    })
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 23,
    columnNumber: 5
  });
};
const TierBadge = ({ tier }) => {
  if (!tier) return null;
  const t = String(tier).trim().toUpperCase();
  if (t === "C" || t === "C-" || t === "C+") {
    return null;
  }
  let tierClass = "tier-c";
  if (t === "SS") tierClass = "tier-ss";
  else if (t === "S+") tierClass = "tier-s-plus";
  else if (t === "S") tierClass = "tier-s";
  else if (t === "S-") tierClass = "tier-s-minus";
  else if (t.startsWith("A")) tierClass = t.includes("+") ? "tier-a-plus" : t.includes("-") ? "tier-a-minus" : "tier-a";
  else if (t.startsWith("B")) tierClass = t.includes("+") ? "tier-b-plus" : t.includes("-") ? "tier-b-minus" : "tier-b";
  else if (t.startsWith("C")) tierClass = t.includes("+") ? "tier-c-plus" : t.includes("-") ? "tier-c-minus" : "tier-c";
  else if (t.startsWith("D")) tierClass = "tier-d";
  else if (t.startsWith("E")) tierClass = "tier-e";
  else if (t.startsWith("F")) tierClass = "tier-f";
  return /* @__PURE__ */ jsxDEV("div", { className: `tier-badge ${tierClass}`, children: t }, void 0, false, {
    fileName: "<stdin>",
    lineNumber: 76,
    columnNumber: 10
  });
};
const Particle = ({ p }) => /* @__PURE__ */ jsxDEV(
  "div",
  {
    className: "particle",
    style: {
      left: `${p.x}%`,
      top: `${p.y}%`,
      background: p.color,
      width: "6px",
      height: "6px",
      "--tx": `${p.tx}px`,
      "--ty": `${p.ty}px`
    }
  },
  void 0,
  false,
  {
    fileName: "<stdin>",
    lineNumber: 80,
    columnNumber: 5
  }
);
const FloatingText = ({ t }) => /* @__PURE__ */ jsxDEV("div", { className: "floating-text", style: { left: `${t.x}%`, top: `${t.y}%`, color: t.color, "--drift-x": `${t.driftX}px` }, children: t.text }, void 0, false, {
  fileName: "<stdin>",
  lineNumber: 95,
  columnNumber: 5
});
const VisualEffect = ({ fx }) => /* @__PURE__ */ jsxDEV(
  "div",
  {
    className: "visual-fx-overlay",
    style: {
      left: fx.x,
      top: fx.y,
      "--scale": fx.scale || 1,
      "--rotation": `${fx.rotation || 0}deg`
    },
    children: /* @__PURE__ */ jsxDEV("img", { src: fx.src, alt: "fx" }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 110,
      columnNumber: 9
    })
  },
  void 0,
  false,
  {
    fileName: "<stdin>",
    lineNumber: 101,
    columnNumber: 5
  }
);
const BackgroundLayer = ({ view }) => {
  let bgImage = "background_hub.png";
  if (view === "train" || view === "abilities" || view === "social") bgImage = "background_gym.png";
  else if (view === "gacha") bgImage = "background_gacha.png";
  else if (view === "campaign") bgImage = "background_battle.png";
  else if (view === "shop" || view === "inventory") bgImage = "background_hub.png";
  else if (view === "missions") bgImage = "background_casino.png";
  return /* @__PURE__ */ jsxDEV("div", { className: "background-layer", children: [
    /* @__PURE__ */ jsxDEV(
      "div",
      {
        className: "bg-image",
        style: {
          backgroundImage: `url(${bgImage})`,
          opacity: 0,
          animation: "bgFadeIn 1s forwards"
        }
      },
      view,
      false,
      {
        fileName: "<stdin>",
        lineNumber: 124,
        columnNumber: 13
      }
    ),
    /* @__PURE__ */ jsxDEV("div", { className: "bg-overlay-gradient" }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 133,
      columnNumber: 13
    })
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 123,
    columnNumber: 9
  });
};
export {
  BackgroundLayer,
  CustomSelect,
  FloatingText,
  Particle,
  TierBadge,
  VisualEffect
};
