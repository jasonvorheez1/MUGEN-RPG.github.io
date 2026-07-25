// Split out of TrialsView.js (token-efficiency pass): the pre-battle squad
// confirmation modal. Receives every piece of TrialsView's state/handlers it
// might touch as a single props object (safe superset -- unused ones cost
// nothing).
//
// PILOT FILE for the JSX build step (see build-jsx.mjs). This is the
// hand-authored source; `PreTrialModal.js` next to it is generated -- never
// edit the .js file directly, it gets overwritten.
import { Plus, Info } from "lucide-react";
import { BOSS_ROSTER, ELEMENTS, EQUIPMENT } from "../../constants.js";
import { rollEnemyGear, seededRandom } from "../../utils.js";

const RARITY_COLOR = { Common: "#94a3b8", Rare: "#38bdf8", Epic: "#a855f7", Legendary: "#facc15", Mythic: "#ff2ecb" };

// "WHO'S GETTING IN" — surfaces every squad requirement for this trial as a
// chip (met/unmet/waived), mirroring the same pattern CampaignView uses for
// stage requirements. "Waived" means the requirement was auto-dropped
// because no owned hero could ever satisfy it (see the softlock fix in
// startTrial's franchise-trial element derivation above) -- surfacing that
// state here means the player can SEE why a requirement isn't listed as
// blocking, instead of just wondering why the trial always looked doable.
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

  return (
    <div style={{ background: "rgba(233,69,96,0.08)", border: "1px solid var(--primary)", borderRadius: 12, padding: "10px 12px", marginBottom: 15, textAlign: "left" }}>
      <div style={{ fontSize: "0.6rem", fontWeight: 900, color: "var(--primary)", letterSpacing: 2, marginBottom: 7 }}>WHO'S GETTING IN</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {reqs.map((r, i) => {
          const col = r.waived ? "#94a3b8" : r.met ? "#4ade80" : "#f87171";
          return (
            <span key={i} style={{ fontSize: "0.66rem", fontWeight: 800, padding: "3px 9px", borderRadius: 20, background: r.waived ? "rgba(148,163,184,0.12)" : r.met ? "rgba(74,222,128,0.13)" : "rgba(239,68,68,0.13)", color: col, border: "1px solid " + col + "44" }}>
              {(r.waived ? "— " : r.met ? "✓ " : "✗ ") + r.label + (r.waived ? " (waived)" : "")}
            </span>
          );
        })}
      </div>
    </div>
  );
};

// SCOUT GEAR — reproduces the EXACT boss + gear roll startTrial() will
// use (same BOSS_ROSTER pick logic, same trial-id-seeded RNG) so what
// you scout here is what you actually fight, not a flavor sample.
const ScoutReport = ({ pendingTrial }) => {
  const bossPick = BOSS_ROSTER[Math.abs(pendingTrial.id.length + pendingTrial.id.charCodeAt(0)) % BOSS_ROSTER.length];
  const isDuoTrial = pendingTrial.difficulty === "hard" || pendingTrial.difficulty === "expert";
  const bossEntries = isDuoTrial ? [bossPick, BOSS_ROSTER.find((b) => b.name === bossPick.duoPartner) || bossPick] : [bossPick];
  const bossGearTier = { easy: 1, medium: 2, hard: 3, expert: 4 }[pendingTrial.difficulty] ?? 2;
  const gearRoll = seededRandom(pendingTrial.id + "_gear");

  return (
    <div style={{ background: "rgba(0,0,0,0.3)", padding: 12, borderRadius: 14, marginBottom: 15 }}>
      <div style={{ fontSize: "0.6rem", fontWeight: 900, color: "#facc15", letterSpacing: 2, marginBottom: 8 }}>SCOUT REPORT</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {bossEntries.map((boss) => {
          const gear = rollEnemyGear(bossGearTier, gearRoll);
          return (
            <div key={boss.name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <img src={boss.img} style={{ width: 32, height: 32, borderRadius: 8, objectFit: "cover", border: `1px solid ${ELEMENTS[boss.element]?.color || "#fff"}` }} />
              <span style={{ fontWeight: 800, fontSize: "0.68rem", minWidth: 90 }}>{boss.name}</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {gear.map((g) => {
                  const item = (EQUIPMENT[g.slot] || []).find((it) => it.id === g.itemId);
                  if (!item) return null;
                  const rc = RARITY_COLOR[item.rarity];
                  return (
                    <span key={g.slot} title={item.name} style={{ fontSize: "0.56rem", fontWeight: 800, padding: "2px 6px", borderRadius: 10, color: rc, border: `1px solid ${rc}66`, background: `${rc}18` }}>
                      {`${item.name} +${g.level}`}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const PreTrialModal = (props) => {
  const {
    characters, unlockedIds, squadIds, setShowSquadBuilder, pendingTrial, setPendingTrial,
    franchiseCounts, extractFranchise, startTrial
  } = props;

  return (
    <div className="hero-select-modal animate-fadeIn" style={{ display: "flex", flexDirection: "column" }}>
      <div className="modal-header">
        <div>
          <h2 style={{ margin: 0, color: pendingTrial.element ? ELEMENTS[pendingTrial.element].color : "#fff" }}>{pendingTrial.name}</h2>
          <div style={{ fontSize: "0.8rem", opacity: 0.7, maxWidth: "400px", marginTop: 4 }}>{pendingTrial.desc}</div>
        </div>
        <button className="upgrade-btn" style={{ padding: "10px 20px" }} onClick={() => setPendingTrial(null)}>CANCEL</button>
      </div>

      {(pendingTrial.franchise || pendingTrial.element || pendingTrial.isWildcard) && (
        <SquadRequirements
          pendingTrial={pendingTrial}
          characters={characters}
          squadIds={squadIds}
          unlockedIds={unlockedIds}
          franchiseCounts={franchiseCounts}
          extractFranchise={extractFranchise}
        />
      )}

      <ScoutReport pendingTrial={pendingTrial} />

      <div style={{ background: "rgba(0,0,0,0.3)", padding: 15, borderRadius: 16, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: "0.9rem", fontWeight: 900 }}>TRIAL SQUAD ({squadIds.length}/5)</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="upgrade-btn"
                style={{ fontSize: "0.7rem" }}
                onClick={() => setShowSquadBuilder({ element: pendingTrial.element, franchise: pendingTrial.franchise, isWildcard: pendingTrial.isWildcard })}
              >
                SELECT HEROES
              </button>
              <button className="train-btn" style={{ width: "auto", padding: "8px 24px" }} disabled={squadIds.length === 0} onClick={() => startTrial(pendingTrial)}>
                PROCEED TO TRIAL
              </button>
            </div>
            {squadIds.length === 0 && <div style={{ fontSize: "0.65rem", color: "#ef4444", fontWeight: 700 }}>Select at least 1 hero to proceed</div>}
          </div>
        </div>
        <div className="squad-slots-row" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
          {Array.from({ length: 5 }).map((_, i) => {
            const heroId = squadIds[i];
            const c = heroId ? characters.find((h) => String(h.export_id) === String(heroId)) : null;
            return (
              <div key={i} className={`squad-member-slot ${c ? "active" : "empty"}`} onClick={() => setShowSquadBuilder(true)}>
                {c ? <img src={c.imageUrl} /> : <Plus size={20} opacity={0.2} />}
              </div>
            );
          })}
        </div>
      </div>

      <div className="glass-panel" style={{ textAlign: "center", padding: 40, opacity: 0.7 }}>
        <Info size={32} style={{ marginBottom: 10 }} />
        <p>Ensure your squad matches the element or series requirement before entering.</p>
      </div>
    </div>
  );
};

export { PreTrialModal };
