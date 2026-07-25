// CombatSystem.js is now a thin barrel: the actual logic lives in
// combat/*.js (split out for token efficiency -- this file was previously
// ~3400 lines). Every name below is re-exported UNCHANGED from its new
// location, so every other file's `import { X } from "./CombatSystem.js"`
// (or "../CombatSystem.js") keeps working exactly as before with zero
// changes needed anywhere else in the codebase.
export {
  getBattleStats,
  describeEffect,
  applyStatusTick,
  pushShieldEffect,
  getCastAnimMs,
  getCastAnimSound,
  getLungeMs,
  getBasicAttackMs,
  getCooldownGain,
  getFlurryHitSound,
  HITSTOP_BUFFER_MS
} from "./combat/battleHelpers.js";
export { resolveBasicAttack, executeCombatSkill } from "./combat/resolution.js";
export { TacticalStanceRow, ProjectileLayer, TurnOrderStrip, BattleUnit } from "./combat/battleUI.js";
export { VictoryScreen } from "./combat/victoryScreen.js";
export { SquadBuilderModal } from "./combat/squadBuilder.js";
