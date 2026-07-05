import React, { useState, useEffect } from "react";
import {
  Volume2,
  Monitor,
  Database,
  BarChart3,
  Info,
  Gamepad2,
  Save,
  Download,
  Upload,
  History,
  AlertTriangle,
  Moon
} from "lucide-react";
import { playSound } from "../utils.js";

const h = React.createElement;

// Small shared building blocks -------------------------------------------------

const SectionTitle = ({ icon, text }) =>
  h("h3", { style: { marginTop: 0, fontSize: "1rem", display: "flex", alignItems: "center", gap: 8 } }, icon, " ", text);

const Slider = ({ label, value, onChange, min = 0, max = 1, step = 0.01, format }) =>
  h("div", { style: { marginTop: 18 } },
    h("label", { style: { fontSize: "0.8rem", color: "var(--text-muted)", display: "flex", justifyContent: "space-between" } },
      h("span", null, label),
      h("span", { style: { color: "#fff", fontWeight: 800 } }, format ? format(value) : Math.round(value * 100) + "%")
    ),
    h("input", {
      type: "range", min, max, step, value,
      onChange: (e) => onChange(parseFloat(e.target.value)),
      style: { width: "100%", accentColor: "var(--primary)", height: 8, borderRadius: 4, marginTop: 8 }
    })
  );

const Toggle = ({ label, hint, checked, onChange }) =>
  h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" } },
    h("div", null,
      h("div", { style: { fontSize: "0.85rem" } }, label),
      hint ? h("div", { style: { fontSize: "0.62rem", color: "var(--text-muted)", marginTop: 2 } }, hint) : null
    ),
    h("button", {
      onClick: () => { onChange(!checked); playSound(checked ? "ui_cancel" : "equip", 0.3); },
      style: {
        width: 46, height: 24, borderRadius: 12, border: "none", cursor: "pointer", position: "relative",
        background: checked ? "var(--primary)" : "rgba(255,255,255,0.12)", transition: "background 0.2s"
      }
    },
      h("span", { style: {
        position: "absolute", top: 3, left: checked ? 25 : 3, width: 18, height: 18, borderRadius: "50%",
        background: "#fff", transition: "left 0.2s", display: "block"
      } })
    )
  );

const timeAgo = (ts) => {
  if (!ts) return "never";
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 5) return "just now";
  if (s < 60) return s + "s ago";
  if (s < 3600) return Math.floor(s / 60) + "m ago";
  if (s < 86400) return Math.floor(s / 3600) + "h ago";
  return Math.floor(s / 86400) + "d ago";
};

// -------------------------------------------------------------------------------

const SettingsView = ({ setAppState, setView, settings, setSettings, stats, saveGame, lastSavedAt = 0, createFloatingText }) => {
  const [activeTab, setActiveTab] = useState("audio");
  const [wipeConfirm, setWipeConfirm] = useState("");
  const [backups, setBackups] = useState([]);
  const [, forceTick] = useState(0);

  // Keep the "last saved Xs ago" label fresh while the tab is open.
  useEffect(() => {
    const t = setInterval(() => forceTick((n) => n + 1), 5000);
    return () => clearInterval(t);
  }, []);

  const refreshBackups = () => {
    const found = [];
    for (let i = 1; i <= 3; i++) {
      try {
        const raw = localStorage.getItem(`mugen_backup_${i}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          found.push({ slot: i, savedAt: parsed.savedAt, data: parsed.data });
        }
      } catch (e) {}
    }
    found.sort((a, b) => b.savedAt - a.savedAt);
    setBackups(found);
  };
  useEffect(refreshBackups, [activeTab, lastSavedAt]);

  const restoreBackup = (b) => {
    if (!confirm(`Restore backup from ${new Date(b.savedAt).toLocaleString()}? Current progress will be replaced.`)) return;
    // Same guard as importSave below: writing straight to localStorage then
    // reloading fires `beforeunload`, whose autosave flush serializes the OLD
    // React state and would silently overwrite this restore a moment before
    // the reload actually took effect.
    window.__mugenSkipAutosave = true;
    Object.keys(b.data).forEach((key) => {
      localStorage.setItem(key, typeof b.data[key] === "string" ? b.data[key] : JSON.stringify(b.data[key]));
    });
    window.location.reload();
  };

  const wipeData = () => {
    if (wipeConfirm !== "DELETE") {
      if (typeof createFloatingText === "function") createFloatingText('Type "DELETE" to confirm the wipe', true);
      return;
    }
    // Without this, the beforeunload autosave flush would re-write the OLD
    // (pre-wipe) React state right back into localStorage before the reload
    // took effect, silently undoing the wipe.
    window.__mugenSkipAutosave = true;
    localStorage.clear();
    window.location.reload();
  };

  const exportSave = async () => {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      // Exclude local-device backup snapshots -- they're a safety net for THIS
      // browser (restorable from Settings → Data → Local Backups), not
      // portable save data. Bundling them into every export was tripling the
      // file size for no benefit and pushing long-played saves past what a
      // fresh import could safely write back to storage.
      if (key.startsWith("mugen_") && !key.startsWith("mugen_backup")) data[key] = localStorage.getItem(key);
    }
    data.__meta = JSON.stringify({ exportedAt: Date.now(), version: 3 });
    const json = JSON.stringify(data);

    let blob, filename;
    if (typeof CompressionStream !== "undefined") {
      // Gzip-compress the export via the browser's native (de)compression
      // streams -- no library needed. JSON compresses very well (usually
      // 80-90% smaller), so this keeps even very long-played saves compact.
      try {
        const compressedStream = new Blob([json]).stream().pipeThrough(new CompressionStream("gzip"));
        blob = await new Response(compressedStream).blob();
        filename = `mugen_save_${new Date().toISOString().slice(0, 10)}.json.gz`;
      } catch (err) {
        console.warn("Compression failed, falling back to plain JSON export", err);
        blob = new Blob([json], { type: "application/json" });
        filename = `mugen_save_${new Date().toISOString().slice(0, 10)}.json`;
      }
    } else {
      // Older browser without CompressionStream support -- fall back to a
      // plain (uncompressed) export rather than blocking the feature.
      blob = new Blob([json], { type: "application/json" });
      filename = `mugen_save_${new Date().toISOString().slice(0, 10)}.json`;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    playSound("purchase", 0.4);
  };

  // Distinguishes a genuine QuotaExceededError (device/browser storage full)
  // from any other failure. Different browsers surface this differently, so
  // check every known shape rather than just err.name.
  const isQuotaError = (err) => !!err && (
    err.name === "QuotaExceededError" ||
    err.code === 22 ||
    err.code === 1014 ||
    err.name === "NS_ERROR_DOM_QUOTA_REACHED"
  );

  const importSave = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      // Step 0: decode. Gzip-compressed exports (.json.gz, produced by the
      // Export Save button above) are detected by their magic bytes rather
      // than file extension, so a renamed/re-extensioned file still works.
      // Plain, uncompressed .json exports (including older saves from before
      // compression was added) continue to work unchanged.
      let jsonText;
      try {
        const bytes = new Uint8Array(event.target.result);
        const isGzip = bytes.length > 2 && bytes[0] === 0x1f && bytes[1] === 0x8b;
        if (isGzip) {
          if (typeof DecompressionStream === "undefined") {
            alert("Import Failed: This save file is compressed, but your browser doesn't support decompressing it. Try a recent version of Chrome, Firefox, or Safari.");
            return;
          }
          const decompressedStream = new Blob([event.target.result]).stream().pipeThrough(new DecompressionStream("gzip"));
          jsonText = await new Response(decompressedStream).text();
        } else {
          jsonText = new TextDecoder("utf-8").decode(bytes);
        }
      } catch (err) {
        alert("Import Failed: Couldn't read that file — it may be corrupted or incomplete.");
        console.error(err);
        return;
      }
      // Step 1: parse. A malformed/truncated file fails here specifically --
      // report that instead of a generic "corrupt" catch-all.
      let data;
      try {
        data = JSON.parse(jsonText);
      } catch (err) {
        alert("Import Failed: That file isn't valid JSON — it looks corrupted or incomplete.");
        return;
      }
      // Step 2: structural validation.
      if (!data.mugen_trainer_save_v2 && !data.mugen_credits && !data.mugen_unlocked_ids) {
        alert("Import Failed: This doesn't look like a Mugen save file (missing core save data).");
        return;
      }
      // From here on we're committed to writing real data straight to
      // localStorage and reloading. That reload fires `beforeunload`, whose
      // autosave flush (in App.js) serializes the OLD React state -- which
      // never learns about this import at all -- and would silently
      // overwrite everything we're about to write a moment before the
      // reload actually took effect. This flag tells that flush to back off.
      // (The Local Backup shadow below only covers writes made *before* the
      // shadow is restored; beforeunload fires *after* that, once reload()
      // has been called, which is exactly what let this slip through before.)
      window.__mugenSkipAutosave = true;
      // Step 3: snapshot current state before overwriting, so a bad import is
      // a one-click restore instead of a lost account. Best-effort -- on a
      // device already low on storage this snapshot itself may fail; that's
      // not fatal, we just proceed without a pre-import safety net.
      const current = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith("mugen_") && !key.startsWith("mugen_backup")) current[key] = localStorage.getItem(key);
      }
      let backupOk = true;
      try {
        localStorage.setItem("mugen_backup_3", JSON.stringify({ savedAt: Date.now(), version: 3, data: current }));
      } catch (err) {
        backupOk = false;
        if (!isQuotaError(err)) console.warn("Pre-import backup failed", err);
      }
      // Step 4: apply the import. Freeze further writes while doing so: the
      // app's periodic stamina/aura regen timers can trigger a pending
      // autosave in the gap between these writes and the reload actually
      // taking effect, silently overwriting the just-imported save with stale
      // in-memory state. Shadow localStorage.setItem with a no-op for
      // everything except our own writes below (via the captured original).
      const originalSetItem = localStorage.setItem.bind(localStorage);
      localStorage.setItem = () => {};
      const failedKeys = [];
      Object.keys(data).forEach((key) => {
        if (!key.startsWith("mugen_")) return;
        try {
          originalSetItem(key, data[key]);
        } catch (err) {
          failedKeys.push(key);
        }
      });
      localStorage.setItem = originalSetItem;
      if (failedKeys.length > 0) {
        // Ran out of storage partway through -- the save is now a broken mix
        // of old and new data. Restore the pre-import snapshot (if we made
        // one) rather than leaving that inconsistent state in place, instead
        // of reloading into a half-imported save.
        if (backupOk) {
          Object.keys(current).forEach((key) => {
            try { originalSetItem(key, current[key]); } catch (err) {}
          });
          alert("Import Failed: Your browser's storage is full, so the import couldn't finish. Your original save was restored — free up space (Settings → Data → clear old backups) and try again.");
        } else {
          alert("Import Failed: Your browser's storage is full. Free up space (Settings → Data → clear old backups) and try again.");
        }
        return;
      }
      window.location.reload();
    };
    reader.readAsArrayBuffer(file);
  };

  const updateSetting = (category, key, value) => {
    setSettings((prev) => ({
      ...prev,
      [category]: { ...prev[category], [key]: value }
    }));
  };

  const audio = settings.audio || {};
  const graphics = settings.graphics || {};
  const gameplay = settings.gameplay || {};

  const tabs = [
    { id: "audio", icon: h(Volume2, { size: 16 }), label: "Audio" },
    { id: "gameplay", icon: h(Gamepad2, { size: 16 }), label: "Gameplay" },
    { id: "graphics", icon: h(Monitor, { size: 16 }), label: "Visuals" },
    { id: "data", icon: h(Database, { size: 16 }), label: "Data" },
    { id: "stats", icon: h(BarChart3, { size: 16 }), label: "Stats" }
  ];

  const statCard = (label, value) =>
    h("div", { key: label, style: { background: "rgba(0,0,0,0.2)", padding: 10, borderRadius: 8 } },
      h("div", { style: { fontSize: "0.6rem", color: "var(--text-muted)" } }, label),
      h("div", { style: { fontSize: "1rem", fontWeight: 900 } }, value)
    );

  return h("div", { style: { padding: "16px 0" } },
    h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 } },
      h("h2", { style: { fontWeight: 900, margin: 0 } }, "SETTINGS"),
      h("div", { style: { display: "flex", alignItems: "center", gap: 10 } },
        h("span", { style: { fontSize: "0.65rem", color: "var(--text-muted)" } },
          h(Save, { size: 11, style: { verticalAlign: "-1px", marginRight: 4 } }),
          "Saved ", timeAgo(lastSavedAt)
        ),
        h("button", {
          className: "train-btn",
          style: { width: "auto", background: "linear-gradient(135deg,#00d2ff,#3a7bd5)", fontSize: "0.75rem", height: 36, padding: "0 16px" },
          onClick: () => { if (typeof saveGame === "function") saveGame(false); }
        }, "SAVE NOW")
      )
    ),
    h("div", { style: { display: "flex", gap: 8, marginBottom: 15, overflowX: "auto", paddingBottom: 5 } },
      tabs.map((tab) => h("button", {
        key: tab.id,
        onClick: () => setActiveTab(tab.id),
        style: {
          padding: "10px 16px", borderRadius: 12, border: "none",
          background: activeTab === tab.id ? "var(--primary)" : "rgba(255,255,255,0.05)",
          color: "white", fontSize: "0.75rem", fontWeight: 800,
          display: "flex", alignItems: "center", gap: 6, cursor: "pointer", whiteSpace: "nowrap"
        }
      }, tab.icon, " ", tab.label))
    ),
    h("div", { className: "glass-panel", style: { minHeight: 300 } },

      // AUDIO ---------------------------------------------------------------
      activeTab === "audio" && h("div", { className: "animate-fadeIn" },
        h(SectionTitle, { icon: h(Volume2, { size: 18 }), text: "Audio Mix" }),
        h(Slider, { label: "Master Volume", value: audio.master ?? 0.5, onChange: (v) => updateSetting("audio", "master", v) }),
        h(Slider, { label: "SFX Volume", value: audio.sfx ?? 0.5, onChange: (v) => updateSetting("audio", "sfx", v) }),
        h(Slider, { label: "Music Volume", value: typeof audio.music === "number" ? audio.music : 1, onChange: (v) => updateSetting("audio", "music", v) }),
        h("div", { style: { fontSize: "0.62rem", color: "var(--text-muted)", marginTop: 14 } },
          "Music volume applies on the next track change. Master scales everything.")
      ),

      // GAMEPLAY ------------------------------------------------------------
      activeTab === "gameplay" && h("div", { className: "animate-fadeIn" },
        h(SectionTitle, { icon: h(Gamepad2, { size: 18 }), text: "Gameplay" }),
        h(Toggle, {
          label: "Auto-Save",
          hint: "Continuously saves as you play. A save is always flushed when the tab closes.",
          checked: gameplay.autoSave !== false,
          onChange: (v) => updateSetting("gameplay", "autoSave", v)
        }),
        h(Slider, {
          label: "Dialogue Speed",
          value: gameplay.dialogueSpeed || 1,
          min: 0.5, max: 3, step: 0.25,
          format: (v) => v + "x",
          onChange: (v) => updateSetting("gameplay", "dialogueSpeed", v)
        })
      ),

      // VISUALS -------------------------------------------------------------
      activeTab === "graphics" && h("div", { className: "animate-fadeIn" },
        h(SectionTitle, { icon: h(Monitor, { size: 18 }), text: "Visual FX" }),
        h(Toggle, { label: "Particles", checked: graphics.particles !== false, onChange: (v) => updateSetting("graphics", "particles", v) }),
        h(Toggle, { label: "Screen Shake", checked: graphics.shake !== false, onChange: (v) => updateSetting("graphics", "shake", v) }),
        h(Toggle, { label: "Scanlines (CRT Effect)", checked: graphics.scanlines !== false, onChange: (v) => updateSetting("graphics", "scanlines", v) }),
        h(Toggle, { label: "Dialogue Animations", checked: graphics.animations !== false, onChange: (v) => updateSetting("graphics", "animations", v) }),
        h("div", { style: { marginTop: 20 } },
          h("div", { style: { fontSize: "0.8rem", fontWeight: 800, display: "flex", alignItems: "center", gap: 6, marginBottom: 10 } },
            h(Moon, { size: 14, color: "#f472b6" }), "CITY THEME"),
          h("div", { style: { display: "flex", gap: 10 } },
            [
              { id: "classic", name: "MUGEN CLASSIC", desc: "Crimson arcade default", accent: "#e94560" },
              { id: "nightlife", name: "NIGHTLIFE '08", desc: "Neon club nostalgia", accent: "#f472b6" }
            ].map((t) => h("button", {
              key: t.id,
              onClick: () => { updateSetting("graphics", "theme", t.id); playSound("equip", 0.4); },
              style: {
                flex: 1, padding: "14px 12px", borderRadius: 12, cursor: "pointer", textAlign: "left",
                border: `2px solid ${(graphics.theme || "classic") === t.id ? t.accent : "rgba(255,255,255,0.1)"}`,
                background: (graphics.theme || "classic") === t.id ? `linear-gradient(135deg, ${t.accent}22, transparent)` : "rgba(0,0,0,0.25)",
                boxShadow: (graphics.theme || "classic") === t.id ? `0 0 16px ${t.accent}55` : "none"
              }
            },
              h("div", { style: { fontWeight: 900, fontSize: "0.8rem", color: t.accent } }, t.name),
              h("div", { style: { fontSize: "0.62rem", color: "var(--text-muted)", marginTop: 3 } }, t.desc)
            ))
          )
        )
      ),

      // DATA ----------------------------------------------------------------
      activeTab === "data" && h("div", { className: "animate-fadeIn" },
        h(SectionTitle, { icon: h(Database, { size: 18 }), text: "Save Data" }),
        h("div", { style: { display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" } },
          h("button", { className: "train-btn", style: { background: "#10b981", fontSize: "0.8rem", height: 44, padding: "0 15px", flex: 1, minWidth: 160 }, onClick: exportSave },
            h(Download, { size: 14, style: { marginRight: 6, verticalAlign: "-2px" } }), "EXPORT SAVE"),
          h("label", { className: "train-btn", style: { background: "#3b82f6", fontSize: "0.8rem", height: 44, padding: "0 15px", flex: 1, minWidth: 160, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" } },
            h(Upload, { size: 14, style: { marginRight: 6 } }), "IMPORT SAVE",
            h("input", { type: "file", accept: ".json,.gz,.json.gz", onChange: importSave, style: { display: "none" } })
          )
        ),
        h("div", { style: { fontSize: "0.6rem", color: "var(--text-muted)", marginBottom: 14, marginTop: -8 } },
          "Exports are gzip-compressed automatically (usually 80-90% smaller) and no longer bundle your local backups — older plain .json saves still import fine."),
        h("div", { style: { marginBottom: 18 } },
          h("div", { style: { fontSize: "0.8rem", fontWeight: 800, display: "flex", alignItems: "center", gap: 6, marginBottom: 8 } },
            h(History, { size: 14, color: "#facc15" }), "LOCAL BACKUPS"),
          h("div", { style: { fontSize: "0.62rem", color: "var(--text-muted)", marginBottom: 10 } },
            "Every manual save keeps a rotating snapshot (3 slots). Importing a file also backs up your current save first."),
          backups.length === 0
            ? h("div", { style: { padding: 14, background: "rgba(0,0,0,0.2)", borderRadius: 8, fontSize: "0.72rem", color: "var(--text-muted)" } },
                'No backups yet — hit "SAVE NOW" to create one.')
            : backups.map((b) => h("div", { key: b.slot, style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "rgba(0,0,0,0.2)", borderRadius: 8, marginBottom: 6 } },
                h("div", null,
                  h("div", { style: { fontSize: "0.75rem", fontWeight: 800 } }, "Slot ", b.slot),
                  h("div", { style: { fontSize: "0.62rem", color: "var(--text-muted)" } }, new Date(b.savedAt).toLocaleString(), " • ", timeAgo(b.savedAt))
                ),
                h("button", { className: "upgrade-btn", style: { padding: "8px 14px", fontSize: "0.7rem" }, onClick: () => restoreBackup(b) }, "RESTORE")
              ))
        ),
        h("div", { style: { display: "flex", gap: 8, marginBottom: 18 } },
          h("button", { className: "train-btn", style: { background: "#334155", fontSize: "0.8rem", height: 44, padding: "0 15px" }, onClick: () => setAppState("menu") }, "LOGOUT TO MENU")
        ),
        h("div", { style: { border: "1px solid rgba(239,68,68,0.35)", borderRadius: 10, padding: 14, background: "rgba(239,68,68,0.05)" } },
          h("div", { style: { fontSize: "0.78rem", fontWeight: 900, color: "#ef4444", display: "flex", alignItems: "center", gap: 6, marginBottom: 8 } },
            h(AlertTriangle, { size: 14 }), "DANGER ZONE"),
          h("div", { style: { fontSize: "0.62rem", color: "var(--text-muted)", marginBottom: 10 } },
            'Wipes ALL progress permanently. Type DELETE below and press the button.'),
          h("div", { style: { display: "flex", gap: 8 } },
            h("input", {
              className: "search-bar",
              style: { margin: 0, height: 40, fontSize: "0.8rem", background: "#111", border: "1px solid #7f1d1d", flex: 1 },
              placeholder: 'Type "DELETE"',
              value: wipeConfirm,
              onChange: (e) => setWipeConfirm(e.target.value)
            }),
            h("button", {
              className: "train-btn",
              style: { background: wipeConfirm === "DELETE" ? "#ef4444" : "#3f1d1d", fontSize: "0.8rem", height: 40, padding: "0 15px", width: "auto", cursor: wipeConfirm === "DELETE" ? "pointer" : "not-allowed" },
              onClick: wipeData
            }, "WIPE DATA")
          )
        )
      ),

      // STATS ---------------------------------------------------------------
      activeTab === "stats" && h("div", { className: "animate-fadeIn" },
        h(SectionTitle, { icon: h(BarChart3, { size: 18 }), text: "Trainer Profile" }),
        h("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 15 } },
          statCard("TOTAL HITS", (stats.totalHits || 0).toLocaleString()),
          statCard("TOTAL XP GAINED", (stats.totalXpGained || 0).toLocaleString()),
          statCard("MESSAGES SENT", (stats.messagesSent || 0).toLocaleString()),
          statCard("DAYS TRAINING", Math.max(1, Math.floor((Date.now() - (stats.startTime || Date.now())) / (1e3 * 60 * 60 * 24))))
        )
      )
    ),
    h("div", { style: { marginTop: 20, padding: 10, background: "rgba(0,0,0,0.1)", borderRadius: 8, fontSize: "0.7rem" } },
      h("div", { style: { display: "flex", alignItems: "center", gap: 5, marginBottom: 5 } },
        h(Info, { size: 12 }), " ", h("span", null, "Application Info")),
      "MUGEN TRAINER v3.0.0 (Nightlife Update)", h("br"), "Built on Websim Engine"
    ),
    h("div", { style: { marginTop: 20, textAlign: "center", fontSize: "0.6rem", opacity: 0.3 } },
      "\xA9 2026 Mugen Training Grounds. Experimental AI Interactions enabled.")
  );
};

export { SettingsView };
