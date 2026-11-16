// Lumenkeeper — tuning, waves and upgrade definitions in one place.
// Nothing here touches the canvas or the DOM: it is pure data the rest
// of the game reads, so balancing never means hunting through logic.

export const VIEW_W = 1280;
export const VIEW_H = 720;
export const ARENA = { x: 640, y: 360, r: 305 };
export const CENTER_FLAME = { x: 640, y: 360, r: 26 };

export const TOTAL_WAVES = 10;

export const PLAYER_BASE = {
  radius: 16,
  speed: 265,
  maxHp: 100,
  dashCooldown: 1.4,
  dashTime: 0.16,
  dashSpeed: 720,
  invulnTime: 0.7,
};

export const WEAPON_BASE = {
  damage: 12,
  fireInterval: 0.34,
  projectiles: 1,
  pierce: 0,
  bulletSpeed: 620,
  bulletRadius: 6,
  spread: 0.14,
};

// Enemy stat tables. hpMul grows with the wave so late waves stay scary.
export const ENEMY_TYPES = {
  wisp: {
    name: 'Ember Wisp',
    score: 100,
    radius: 15,
    hp: 22,
    speed: 78,
    damage: 10,
    color: '#ff9a3c',
    glow: '#ffcf7d',
    shardChance: 0.45,
  },
  skitter: {
    name: 'Tide Skitter',
    score: 150,
    radius: 13,
    hp: 16,
    speed: 168,
    damage: 8,
    color: '#4fe3c1',
    glow: '#a7f5e3',
    shardChance: 0.5,
  },
  spitter: {
    name: 'Ink Spitter',
    score: 200,
    radius: 17,
    hp: 34,
    speed: 62,
    damage: 8,
    color: '#c77dff',
    glow: '#e0aaff',
    shardChance: 0.6,
  },
  leviathan: {
    name: 'Dreadtide Leviathan',
    score: 2000,
    radius: 52,
    hp: 900,
    speed: 46,
    damage: 20,
    color: '#ff5d73',
    glow: '#ffb3c0',
    shardChance: 1,
  },
};

// How many of each foe a wave sends. The final wave is the boss plus a
// trickle of wisps, handled in world.js.
export function waveComposition(wave) {
  return {
    wisp: 3 + wave * 2,
    skitter: wave >= 2 ? 1 + wave : 0,
    spitter: wave >= 3 ? wave - 2 : 0,
    leviathan: wave === TOTAL_WAVES ? 1 : 0,
  };
}

// Seconds between spawns inside a wave; it tightens as waves climb.
export function spawnInterval(wave) {
  return Math.max(0.42, 1.05 - wave * 0.06);
}

export function enemyHpFor(type, wave) {
  const base = ENEMY_TYPES[type].hp;
  return Math.round(base * (1 + (wave - 1) * 0.16));
}

// --- Upgrades -----------------------------------------------------------
// Each upgrade is a card offered between waves. `max` caps how many times
// it can be taken; `apply` mutates the run state in place.
export const UPGRADES = [
  {
    id: 'twin',
    name: 'Twin Lanterns',
    icon: '✦✦',
    desc: '+1 lantern bolt per shot',
    max: 3,
    apply: (s) => { s.weapon.projectiles += 1; },
  },
  {
    id: 'heavy',
    name: 'Heavy Ember',
    icon: '●',
    desc: '+45% bolt damage',
    max: 5,
    apply: (s) => { s.weapon.damage *= 1.45; },
  },
  {
    id: 'rapid',
    name: 'Rapid Wick',
    icon: '≋',
    desc: '+25% fire rate',
    max: 5,
    apply: (s) => { s.weapon.fireInterval *= 0.8; },
  },
  {
    id: 'pierce',
    name: 'Piercing Light',
    icon: '→→',
    desc: 'Bolts pierce +1 enemy',
    max: 3,
    apply: (s) => { s.weapon.pierce += 1; },
  },
  {
    id: 'shell',
    name: 'Thick Shell',
    icon: '⬢',
    desc: '+30 max health, heal 30',
    max: 4,
    apply: (s) => { s.player.maxHp += 30; s.player.hp = Math.min(s.player.maxHp, s.player.hp + 30); },
  },
  {
    id: 'current',
    name: 'Swift Current',
    icon: '»',
    desc: '+14% move speed, faster dash',
    max: 4,
    apply: (s) => { s.player.speed *= 1.14; s.player.dashCooldown = Math.max(0.7, s.player.dashCooldown * 0.88); },
  },
  {
    id: 'magnet',
    name: 'Ember Magnet',
    icon: '◎',
    desc: 'Shards fly to you from farther away',
    max: 3,
    apply: (s) => { s.magnetRadius *= 1.8; },
  },
  {
    id: 'flare',
    name: 'Bright Flare',
    icon: '☀',
    desc: 'Flare nova hits harder and wider',
    max: 4,
    apply: (s) => { s.flareDamage *= 1.5; s.flareRadius *= 1.18; },
  },
];

export const PALETTE = {
  seaDeep: '#071224',
  sea: '#0a1e33',
  seaLight: '#10304d',
  reef: '#123f3a',
  sand: '#c9a86a',
  gold: '#ffd76a',
  ember: '#ff9a3c',
  teal: '#4fe3c1',
  violet: '#c77dff',
  red: '#ff5d73',
  ink: '#eaf6ff',
  dim: '#8fb4c7',
};
