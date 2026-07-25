import React from "react";
import { Sword, Heart, Trophy, ShoppingBag, Users, Settings, Sparkles, Star, Home, LayoutGrid, MoreHorizontal, Swords, Clover } from "lucide-react";
import { playSound } from "../utils.js";
const NavSidebar = props => {
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
  return <><nav className="nav-container">{!isMobile ? <><div className="nav-brand" style={{
          fontFamily: "Cinzel",
          letterSpacing: "4px",
          fontStyle: "italic",
          background: "linear-gradient(to right, #fff, #94a3b8)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent"
        }}>MUGEN 08</div><div className="nav-section-label">Main</div><div className={`nav-item ${view === "home" ? "active" : ""}`} onMouseEnter={() => playSound("menu_hover", 0.1)} onClick={() => {
          setView("home");
          playSound("menu_click", 0.2);
        }}><Home size={20} /> <span className="nav-label-text">The District</span></div><div className={`nav-item ${["train", "abilities", "social"].includes(view) ? "active" : ""}`} onMouseEnter={() => playSound("menu_hover", 0.1)} onClick={() => {
          setView("train");
          playSound("menu_click", 0.2);
        }}>{characters[selectedCharIndex] ? <img src={characters[selectedCharIndex].imageUrl} className="nav-char-icon" alt="" /> : <Sword size={20} />}<span className="nav-label-text">Profile</span></div><div className={`nav-item ${view === "roster" ? "active" : ""}`} onMouseEnter={() => playSound("menu_hover", 0.1)} onClick={() => {
          setView("roster");
          playSound("menu_click", 0.2);
        }}><Users size={20} /> <span className="nav-label-text">Roster</span></div><div className="nav-divider" /><div className="nav-section-label">Nightlife</div><div className={`nav-item ${view === "lounge" ? "active" : ""}`} onMouseEnter={() => playSound("menu_hover", 0.1)} onClick={() => {
          setView("lounge");
          playSound("menu_click", 0.2);
        }}><Heart size={20} /> <span className="nav-label-text">Lounge</span></div><div className={`nav-item ${view === "gacha" ? "active" : ""}`} onMouseEnter={() => playSound("menu_hover", 0.1)} onClick={() => {
          setView("gacha");
          playSound("menu_click", 0.2);
        }}><Clover size={20} /> <span className="nav-label-text">Recruit</span></div><div className="nav-divider" /><div className="nav-section-label">Battle</div><div className={`nav-item ${view === "campaign" ? "active" : ""}`} onMouseEnter={() => playSound("menu_hover", 0.1)} onClick={() => {
          setView("campaign");
          playSound("menu_click", 0.2);
        }}><Swords size={20} /> <span className="nav-label-text">Campaign</span></div><div className={`nav-item ${!unlockedFeatures.includes("events") ? "locked-nav" : ""} ${view === "events" ? "active" : ""}`} onMouseEnter={() => playSound("menu_hover", 0.1)} onClick={() => unlockedFeatures.includes("events") ? (setView("events"), playSound("menu_click", 0.2)) : createFloatingText("Reach Street Gym Rank 2 to unlock", true)}><Sparkles size={20} /> <span className="nav-label-text">Events</span>{!unlockedFeatures.includes("events") && <span className="nav-rank-req">RANK 2</span>}</div><div className={`nav-item ${!unlockedFeatures.includes("trials") ? "locked-nav" : ""} ${view === "trials" ? "active" : ""}`} onMouseEnter={() => playSound("menu_hover", 0.1)} onClick={() => unlockedFeatures.includes("trials") ? (setView("trials"), playSound("menu_click", 0.2)) : createFloatingText("Reach Street Gym Rank 2 to unlock", true)}><Star size={20} /> <span className="nav-label-text">Trials</span>{!unlockedFeatures.includes("trials") && <span className="nav-rank-req">RANK 2</span>}</div><div className="nav-divider" /><div className="nav-section-label">Business</div><div className={`nav-item ${!unlockedFeatures.includes("missions") ? "locked-nav" : ""} ${view === "missions" ? "active" : ""}`} onMouseEnter={() => playSound("menu_hover", 0.1)} onClick={() => unlockedFeatures.includes("missions") ? (setView("missions"), playSound("menu_click", 0.2)) : createFloatingText("Reach Street Gym Rank 3 to unlock", true)}><Trophy size={20} /> <span className="nav-label-text">Jobs</span>{!unlockedFeatures.includes("missions") && <span className="nav-rank-req">RANK 3</span>}</div><div className={`nav-item ${view === "inventory" ? "active" : ""}`} onMouseEnter={() => playSound("menu_hover", 0.1)} onClick={() => {
          setView("inventory");
          playSound("menu_click", 0.2);
        }}><LayoutGrid size={20} /> <span className="nav-label-text">Stash</span></div><div className={`nav-item ${view === "shop" ? "active" : ""}`} onMouseEnter={() => playSound("menu_hover", 0.1)} onClick={() => {
          setView("shop");
          playSound("menu_click", 0.2);
        }}><ShoppingBag size={20} /> <span className="nav-label-text">Shop</span></div><div className={`nav-item ${view === "settings" ? "active" : ""}`} onMouseEnter={() => playSound("menu_hover", 0.1)} onClick={() => {
          setView("settings");
          playSound("menu_click", 0.2);
        }} style={{
          marginTop: "auto"
        }}><Settings size={20} /> <span className="nav-label-text">Settings</span></div></> : <><div className={`nav-item ${view === "home" ? "active" : ""}`} onClick={() => {
          setView("home");
          setShowMobileMore(false);
          playSound("menu_click", 0.2);
        }}><Home size={22} /> <span className="nav-label-text">Base</span></div><div className={`nav-item ${["train", "abilities", "social"].includes(view) ? "active" : ""}`} onClick={() => {
          setView("train");
          setShowMobileMore(false);
          playSound("menu_click", 0.2);
        }}><Sword size={22} /> <span className="nav-label-text">Hero</span></div><div className={`nav-item ${view === "campaign" ? "active" : ""}`} onClick={() => {
          setView("campaign");
          setShowMobileMore(false);
          playSound("menu_click", 0.2);
        }}><Swords size={22} /> <span className="nav-label-text">Combat</span></div><div className={`nav-item ${view === "events" ? "active" : ""}`} onClick={() => {
          setView("events");
          setShowMobileMore(false);
          playSound("menu_click", 0.2);
        }}><Sparkles size={22} /> <span className="nav-label-text">Events</span></div><div className={`nav-item ${view === "gacha" ? "active" : ""}`} onClick={() => {
          setView("gacha");
          setShowMobileMore(false);
          playSound("menu_click", 0.2);
        }}><Clover size={22} /> <span className="nav-label-text">Recruit</span></div><div className={`nav-item ${showMobileMore ? "active" : ""}`} onClick={() => {
          setShowMobileMore(!showMobileMore);
          playSound("menu_click", 0.1);
        }}><MoreHorizontal size={22} /> <span className="nav-label-text">More</span></div></>}</nav>{isMobile && showMobileMore && <div className="mobile-more-overlay" onClick={() => setShowMobileMore(false)}><div className="mobile-more-panel" onClick={e => e.stopPropagation()}><div className="more-menu-item" onClick={() => {
          setView("roster");
          setShowMobileMore(false);
        }}><Users size={24} color="var(--primary)" /> <span className="more-menu-label">Roster</span></div><div className="more-menu-item" onClick={() => {
          setView("lounge");
          setShowMobileMore(false);
        }}><Heart size={24} color="#f472b6" /> <span className="more-menu-label">Lounge</span></div><div className={`more-menu-item ${!unlockedFeatures.includes("events") ? "locked-nav" : ""}`} onClick={() => {
          if (unlockedFeatures.includes("events")) {
            setView("events");
            setShowMobileMore(false);
          } else createFloatingText("Reach Street Gym Rank 2 to unlock", true);
        }}><Sparkles size={24} color="#a855f7" /> <span className="more-menu-label">Events</span>{!unlockedFeatures.includes("events") && <span className="nav-rank-req">RANK 2</span>}</div><div className={`more-menu-item ${!unlockedFeatures.includes("trials") ? "locked-nav" : ""}`} onClick={() => {
          if (unlockedFeatures.includes("trials")) {
            setView("trials");
            setShowMobileMore(false);
          } else createFloatingText("Reach Street Gym Rank 2 to unlock", true);
        }}><Star size={24} color="#facc15" /> <span className="more-menu-label">Trials</span>{!unlockedFeatures.includes("trials") && <span className="nav-rank-req">RANK 2</span>}</div><div className={`more-menu-item ${!unlockedFeatures.includes("missions") ? "locked-nav" : ""}`} onClick={() => {
          if (unlockedFeatures.includes("missions")) {
            setView("missions");
            setShowMobileMore(false);
          } else createFloatingText("Reach Street Gym Rank 3 to unlock", true);
        }}><Trophy size={24} color="#fb923c" /> <span className="more-menu-label">Jobs</span>{!unlockedFeatures.includes("missions") && <span className="nav-rank-req">RANK 3</span>}</div><div className="more-menu-item" onClick={() => {
          setView("inventory");
          setShowMobileMore(false);
        }}><LayoutGrid size={24} color="#94a3b8" /> <span className="more-menu-label">Stash</span></div><div className="more-menu-item" onClick={() => {
          setView("shop");
          setShowMobileMore(false);
        }}><ShoppingBag size={24} color="#22d3ee" /> <span className="more-menu-label">Shop</span></div><div className="more-menu-item" style={{
          gridColumn: "span 3"
        }} onClick={() => {
          setView("settings");
          setShowMobileMore(false);
        }}><Settings size={20} /> <span className="more-menu-label">System Settings</span></div></div></div>}</>;
};
export { NavSidebar };