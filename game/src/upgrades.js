// Between-wave upgrade cards: which three are offered, and what taking
// one does. Rolls are seeded, never repeat a maxed-out upgrade, and the
// choice is shown as three clickable cards (or keys 1–3).

import { UPGRADES } from './config.js';

export function takenCount(state, id) {
  return state.upgradeCounts[id] || 0;
}

export function availableUpgrades(state) {
  return UPGRADES.filter((u) => takenCount(state, u.id) < u.max);
}

export function rollUpgradeChoices(state, count = 3) {
  const pool = state.rng.shuffle(availableUpgrades(state));
  return pool.slice(0, Math.min(count, pool.length));
}

export function applyUpgrade(state, def) {
  def.apply(state);
  state.upgradeCounts[def.id] = takenCount(state, def.id) + 1;
  state.upgradesTaken.push(def.name);
  state.audio?.upgrade();
}
