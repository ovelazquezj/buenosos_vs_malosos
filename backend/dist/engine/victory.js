"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkVictory = checkVictory;
// ============================================================
// checkVictory
// Checks all victory conditions and returns the winning Seat,
// or null if the game is still in progress.
//
// MalOsos wins if:
//   - stability === 0
//   - OR 3+ services with crit=5 are DOWN
//
// BuenOsos wins if:
//   - turn >= turnLimit
//   - AND stability > 30
//   - AND servicesRecovered.length >= 2
// ============================================================
function checkVictory(state) {
    if (state.status !== 'running') {
        return null;
    }
    // ---- MalOsos victory conditions ----
    // Condition 1: Stability reaches 0
    if (state.markers.stability === 0) {
        return 'MALOSOS';
    }
    // Condition 2: 3 or more crit=5 services are DOWN
    const crit5Down = Object.values(state.services).filter((s) => s.crit === 5 && s.state === 'DOWN').length;
    if (crit5Down >= 3) {
        return 'MALOSOS';
    }
    // ---- BuenOsos victory conditions ----
    // Only evaluated at turn >= turnLimit (end of last allowed turn)
    if (state.markers.turn >= state.config.turnLimit) {
        if (state.markers.stability > 30 &&
            state.servicesRecovered.length >= 2) {
            return 'BUENOSOS';
        }
    }
    // No winner yet
    return null;
}
//# sourceMappingURL=victory.js.map