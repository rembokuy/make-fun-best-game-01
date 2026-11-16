// Deterministic screenshot states: ?shot=start|play|win|lose&seed=1
// renders one exact, reproducible frame per state. A fixed seed deals
// the same enemies, shards and particles every time, and no wall clock
// is read — the scene is built, frozen and drawn once.

import { createRun, startWave } from './world.js';
import { createEnemy } from './enemies.js';
import { TOTAL_WAVES } from './config.js';

function placeEnemies(s, specs) {
  for (const [type, x, y] of specs) {
    const e = createEnemy(type, x, y, s.wave, s.rng);
    s.enemies.push(e);
  }
}

function seedBattle(s, wave, score, hp, flare) {
  s.phase = 'playing';
  startWave(s, wave);
  // Freeze the wave banner out and keep a mid-fight spawn queue so the
  // HUD reads as a wave in progress.
  s.banner = null;
  s.spawnQueue = s.spawnQueue.slice(0, 6);
  s.score = score;
  s.player.hp = hp;
  s.flareCharge = flare;
  s.time = 143;
  s.kills = 27;
  s.embers = 11;
  s.shotsFired = 180;
  s.shotsHit = 132;
  // A few bolts already in flight and a burst of embers on the floor.
  s.bullets = [
    { x: 700, y: 380, vx: 620, vy: -60, r: 6, damage: 12, pierce: 0, hitSet: new Set(), life: 1 },
    { x: 730, y: 400, vx: 600, vy: 40, r: 6, damage: 12, pierce: 0, hitSet: new Set(), life: 1 },
    { x: 660, y: 360, vx: 620, vy: -120, r: 6, damage: 12, pierce: 0, hitSet: new Set(), life: 1 },
  ];
  s.shards = [
    { x: 560, y: 420, vx: 0, vy: 0, value: 25, life: 10, bob: 0.5 },
    { x: 760, y: 470, vx: 0, vy: 0, value: 25, life: 10, bob: 1.5 },
    { x: 520, y: 300, vx: 0, vy: 0, value: 25, life: 10, bob: 2.5 },
  ];
  s.particles.burst(820, 300, '#ff9a3c', 16, 220, 0.6, 4);
  s.particles.burst(470, 250, '#4fe3c1', 10, 180, 0.5, 4);
}

export function buildShotState(shot, seed, audio, particles) {
  const s = createRun(seed, audio, particles);
  s.player.x = 640;
  s.player.y = 500;
  s.player.aim = -0.5;

  if (shot === 'start') {
    s.phase = 'title';
    // A quiet reef behind the title: a few creatures drifting in the dark.
    placeEnemies(s, [
      ['wisp', 380, 240],
      ['wisp', 900, 220],
      ['skitter', 300, 460],
      ['spitter', 960, 470],
      ['wisp', 700, 180],
    ]);
    return s;
  }

  if (shot === 'play') {
    seedBattle(s, 4, 4850, 76, 82);
    s.player.x = 600;
    s.player.y = 470;
    s.player.aim = 0.35;
    placeEnemies(s, [
      ['wisp', 820, 300],
      ['wisp', 880, 360],
      ['skitter', 470, 250],
      ['skitter', 520, 210],
      ['spitter', 950, 180],
      ['wisp', 420, 560],
    ]);
    // A couple of wounded foes so health bars show.
    s.enemies[0].hp = Math.floor(s.enemies[0].maxHp * 0.45);
    s.enemies[2].hp = Math.floor(s.enemies[2].maxHp * 0.6);
    s.ebullets = [
      { x: 880, y: 260, vx: -200, vy: 120, r: 7, damage: 8, life: 3 },
      { x: 900, y: 300, vx: -220, vy: 60, r: 7, damage: 8, life: 3 },
    ];
    s.banner = { text: 'WAVE 4 / 10', sub: 'The tide grows stronger…', timer: 2.0 };
    return s;
  }

  if (shot === 'win') {
    s.phase = 'win';
    s.wave = TOTAL_WAVES;
    s.finalStats = {
      score: 18450, wave: 10, kills: 148, embers: 63,
      time: 612, accuracy: 74,
      upgrades: ['Twin Lanterns', 'Heavy Ember', 'Rapid Wick', 'Thick Shell'],
    };
    s.score = 18450;
    placeEnemies(s, [['wisp', 380, 240]]);
    s.enemies[0].hp = 1;
    s.particles.burst(640, 360, '#ffd76a', 40, 320, 1, 5);
    return s;
  }

  // lose
  s.phase = 'lose';
  s.wave = 7;
  s.player.hp = 0;
  s.finalStats = {
    score: 7320, wave: 7, kills: 86, embers: 34,
    time: 389, accuracy: 68,
    upgrades: ['Twin Lanterns', 'Rapid Wick', 'Ember Magnet'],
  };
  s.score = 7320;
  placeEnemies(s, [
    ['wisp', 700, 300],
    ['skitter', 780, 420],
    ['spitter', 900, 220],
  ]);
  s.particles.burst(640, 500, '#ff5d73', 30, 300, 0.9, 5);
  return s;
}

export function isShotMode() {
  return new URLSearchParams(window.location.search).has('shot');
}

export function shotParams() {
  const q = new URLSearchParams(window.location.search);
  return {
    shot: q.get('shot') || 'start',
    seed: Number(q.get('seed') || '1') || 1,
  };
}
