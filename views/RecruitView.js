import React, { useState } from "react";
import { GachaView } from "./GachaView.js";
import { SlotView } from "./SlotView.js";
import { playSound } from "../utils.js";

// Merged hub: "Recruit" used to be split across two separate top-level nav
// entries (Gacha pulls + the Lucky 7s slot machine). Same destination, two
// very different ways to get there -- so they now live under one roof with
// a clear sub-tab switch instead of cluttering the sidebar twice.
const RecruitView = (props) => {
  const h = React.createElement;
  const [tab, setTab] = useState("gacha");
  return h("div", { className: "recruit-hub" },
    h("div", { className: "recruit-hub-tabs" },
      h("button", {
        className: "recruit-hub-tab" + (tab === "gacha" ? " active" : ""),
        onClick: () => { setTab("gacha"); playSound("ui_select", 0.3); }
      }, "Pull Recruits"),
      h("button", {
        className: "recruit-hub-tab" + (tab === "slots" ? " active" : ""),
        onClick: () => { setTab("slots"); playSound("ui_select", 0.3); }
      }, "Lucky 7s")
    ),
    h("div", { className: "recruit-hub-body" },
      tab === "gacha" ? h(GachaView, props) : h(SlotView, props)
    )
  );
};

export { RecruitView };
