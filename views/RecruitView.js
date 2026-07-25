import React, { useState } from "react";
import { GachaView } from "./GachaView.js";
import { SlotView } from "./SlotView.js";
import { GearShopView } from "./GearShopView.js";
import { playSound } from "../utils.js";

// Merged hub: "Recruit" used to be split across two separate top-level nav
// entries (Gacha pulls + the Lucky 7s slot machine). Same destination, two
// very different ways to get there -- so they now live under one roof with
// a clear sub-tab switch instead of cluttering the sidebar twice.
const RecruitView = (props) => {
  const h = React.createElement;
  const [tab, setTab] = useState("gacha");
  const { credits = 0, gems = 0, materials = 0, essence = 0 } = props;
  // Addition: previously each sub-view showed currency differently (Gacha
  // only showed the active banner's ONE currency, Gear showed nothing until
  // a purchase failed) -- a single always-visible strip here means switching
  // tabs never loses track of what you actually have to spend.
  return h("div", { className: "recruit-hub" },
    h("div", { className: "recruit-hub-currency-strip" },
      h("span", { className: "recruit-hub-currency-pill", style: { color: "#facc15" } }, `$${credits.toLocaleString()}`),
      h("span", { className: "recruit-hub-currency-pill", style: { color: "#00d2ff" } }, `${gems.toLocaleString()} 💎`),
      h("span", { className: "recruit-hub-currency-pill", style: { color: "#4ade80" } }, `${materials.toLocaleString()} MAT`),
      h("span", { className: "recruit-hub-currency-pill", style: { color: "#f97316" } }, `${essence.toLocaleString()} ESS`)
    ),
    h("div", { className: "recruit-hub-tabs" },
      h("button", {
        className: "recruit-hub-tab" + (tab === "gacha" ? " active" : ""),
        onClick: () => { setTab("gacha"); playSound("act_page_turn", 0.4); }
      }, "Pull Recruits"),
      h("button", {
        className: "recruit-hub-tab" + (tab === "slots" ? " active" : ""),
        onClick: () => { setTab("slots"); playSound("act_page_turn", 0.4); }
      }, "Lucky 7s"),
      h("button", {
        className: "recruit-hub-tab" + (tab === "gear" ? " active" : ""),
        onClick: () => { setTab("gear"); playSound("act_page_turn", 0.4); }
      }, "Gear")
    ),
    h("div", { className: "recruit-hub-body" },
      tab === "gacha" ? h(GachaView, props) : tab === "slots" ? h(SlotView, props) : h(GearShopView, props)
    )
  );
};

export { RecruitView };
