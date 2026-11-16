// The run itself: player, waves, bullets, collisions, shards, the flare
// nova and the win/lose flow. Rendering never lives here — render.js
// only reads this state — so the simulation stays testable on its own.

import {
  ARENA, PLAYER_BASE, WEAPON_BASE, TOTAL_WAVES,
  waveComposition, spawnInterval,
} from './config.js';
import { makeRng } from './random.js';
import { createEnemy, updateEnemy } from './enemies.js';
import { rollUpgradeChoices, applyUpgrade } from './upgrades.js';

export function createRun(seed, audio, particles) {
  const rng = makeRng(seed);
  return {
    seed,
    rng,
    audio: audio || null,
    particles: particles || null,
    phase: 'title',
    wave: 0,
    score: 0,
    kills: 0,
    embers: 0,
    time: 0,
    shotsFired: 0,
    shotsHit: 0,
    flareCharge: 0,
    flareDamage: 60,
    flareRadius: 210,
    magnetRadius: 90,
    player: {
      x: 640, y: 500,
      hp: PLAYER_BASE.maxHp,
      maxHp: PLAYER_BASE.maxHp,
      speed: PLAYER_BASE.speed,
      radius: PLAYER_BASE.radius,
      aim: -Math.PI / 2,
      fireTimer: 0,
      dashTimer: 0,
      dashCooldown: 0,
      dashDirX: 0, dashDirY: -1,
      invuln: 0,
    },
    weapon: { ...WEAPON_BASE },
    bullets: [],
    enemies: [],
    ebullets: [],
    shards: [],
    spawnQueue: [],
    spawnTimer: 0,
    upgradeCounts: {},
    upgradesTaken: [],
    choices: [],
    banner: null,
    finalStats: null,
    boss: null,
  };
}

export function startGame(s) {
  const fresh = createRun(s.seed, s.audio, s.particles);
  Object.assign(s, fresh);
  s.phase = 'playing';
  startWave(s, 1);
}

export function startWave(s, wave) {
  s.wave = wave;
  s.enemies = [];
  s.ebullets = [];
  s.bullets = [];
  const comp = waveComposition(wave);
  const queue = [];
  if (comp.leviathan) queue.push('leviathan');
  for (let i = 0; i < comp.wisp; i += 1) queue.push('wisp');
  for (let i = 0; i < comp.skitter; i += 1) queue.push('skitter');
  for (let i = 0; i < comp.spitter; i += 1) queue.push('spitter');
  // Boss first, the rest shuffled so no two waves open the same way.
  const rest = s.rng.shuffle(queue.slice(comp.leviathan ? 1 : 0));
  s.spawnQueue = comp.leviathan ? ['leviathan', ...rest] : rest;
  s.spawnTimer = 0.6;
  s.banner = {
    text: wave === TOTAL_WAVES ? 'FINAL WAVE — THE DREADTIDE' : `WAVE ${wave} / ${TOTAL_WAVES}`,
    sub: wave === TOTAL_WAVES
      ? 'The Leviathan comes for the flame. Hold the light!'
      : wave === 1
        ? 'Wisps drift in from the dark water. Hold the light!'
        : 'The tide grows stronger…',
    timer: 2.6,
  };
}

function spawnPoint(s, rng) {
  for (let tries = 0; tries < 6; tries += 1) {
    const a = rng.range(0, Math.PI * 2);
    const x = ARENA.x + Math.cos(a) * (ARENA.r - 18);
    const y = ARENA.y + Math.sin(a) * (ARENA.r - 18);
    const d = Math.hypot(x - s.player.x, y - s.player.y);
    if (d > 200) return { x, y };
  }
  const a = rng.range(0, Math.PI * 2);
  return { x: ARENA.x + Math.cos(a) * (ARENA.r - 18), y: ARENA.y + Math.sin(a) * (ARENA.r - 18) };
}

function fireWeapon(s) {
  const p = s.player;
  const w = s.weapon;
  const n = w.projectiles;
  for (let i = 0; i < n; i += 1) {
    const offset = (i - (n - 1) / 2) * w.spread;
    const a = p.aim + offset;
    s.bullets.push({
      x: p.x + Math.cos(a) * (p.radius + 6),
      y: p.y + Math.sin(a) * (p.radius + 6),
      vx: Math.cos(a) * w.bulletSpeed,
      vy: Math.sin(a) * w.bulletSpeed,
      r: w.bulletRadius,
      damage: w.damage,
      pierce: w.pierce,
      hitSet: new Set(),
      life: 1.1,
    });
  }
  s.shotsFired += n;
  s.audio?.shoot();
  s.particles?.burst(p.x + Math.cos(p.aim) * 22, p.y + Math.sin(p.aim) * 22, '#ffd76a', 3, 120, 0.25, 3);
}

export function doFlare(s) {
  if (s.flareCharge < 100 || s.phase !== 'playing') return false;
  s.flareCharge = 0;
  s.audio?.flare();
  s.particles?.ring(s.player.x, s.player.y, '#ffd76a', 40, 520);
  s.particles?.addShake(0.45);
  for (const e of s.enemies) {
    const d = Math.hypot(e.x - s.player.x, e.y - s.player.y);
    if (d < s.flareRadius + e.r) {
      damageEnemy(s, e, s.flareDamage);
    }
  }
  return true;
}

function damageEnemy(s, e, dmg) {
  e.hp -= dmg;
  e.flash = 0.12;
  s.particles?.burst(e.x, e.y, e.glow, 5, 160, 0.35, 3);
  if (e.hp <= 0) killEnemy(s, e);
}

function killEnemy(s, e) {
  e.dead = true;
  s.kills += 1;
  s.score += e.score;
  s.flareCharge = Math.min(100, s.flareCharge + 4);
  s.particles?.burst(e.x, e.y, e.color, e.type === 'leviathan' ? 60 : 18, 300, 0.7, 5);
  s.particles?.floatText(e.x, e.y - e.r, `+${e.score}`, '#ffd76a', 18);
  s.particles?.addShake(e.type === 'leviathan' ? 0.8 : 0.18);
  s.audio?.explode();
  if (s.rng.chance(e.shardChance)) {
    const a = s.rng.range(0, Math.PI * 2);
    s.shards.push({
      x: e.x, y: e.y,
      vx: Math.cos(a) * 60, vy: Math.sin(a) * 60,
      value: 25, life: 12, bob: s.rng.range(0, Math.PI * 2),
    });
  }
  if (e.type === 'leviathan') {
    s.score += 500;
    s.particles?.floatText(e.x, e.y - 60, 'LEVIATHAN DOWN! +500', '#ff5d73', 26);
  }
}

function damagePlayer(s, dmg) {
  const p = s.player;
  if (p.invuln > 0 || s.phase !== 'playing') return;
  p.hp -= dmg;
  p.invuln = PLAYER_BASE.invulnTime;
  s.particles?.burst(p.x, p.y, '#ff5d73', 16, 260, 0.5, 4);
  s.particles?.addShake(0.4);
  s.particles?.floatText(p.x, p.y - 26, `-${dmg}`, '#ff5d73', 20);
  s.audio?.hurt();
  if (p.hp <= 0) {
    p.hp = 0;
    endRun(s, false);
  }
}

function endRun(s, won) {
  s.phase = won ? 'win' : 'lose';
  s.finalStats = {
    score: s.score,
    wave: s.wave,
    kills: s.kills,
    embers: s.embers,
    time: s.time,
    accuracy: s.shotsFired > 0 ? Math.round((s.shotsHit / s.shotsFired) * 100) : 0,
    upgrades: s.upgradesTaken.slice(),
  };
  s.particles?.burst(s.player.x, s.player.y, won ? '#ffd76a' : '#ff5d73', 50, 380, 1, 6);
  if (won) s.audio?.win();
  else s.audio?.lose();
}

export function chooseUpgrade(s, index) {
  const def = s.choices[index];
  if (!def || s.phase !== 'upgrade') return false;
  applyUpgrade(s, def);
  s.choices = [];
  startWave(s, s.wave + 1);
  s.phase = 'playing';
  return true;
}

function waveCleared(s) {
  s.score += 250 * s.wave;
  s.audio?.waveClear();
  if (s.wave >= TOTAL_WAVES) {
    endRun(s, true);
    return;
  }
  s.phase = 'upgrade';
  s.choices = rollUpgradeChoices(s, 3);
  s.banner = null;
}

// --- Per-frame update (playing phase only does simulation) ---------------
export function update(s, input, dt) {
  s.particles?.update(dt);
  if (s.banner) {
    s.banner.timer -= dt;
    if (s.banner.timer <= 0) s.banner = null;
  }
  if (s.phase !== 'playing') return;

  s.time += dt;
  s.flareCharge = Math.min(100, s.flareCharge + dt * 1.5);
  const p = s.player;

  // Aim follows the mouse.
  p.aim = Math.atan2(input.mouse.y - p.y, input.mouse.x - p.x);

  // Movement: WASD / arrows, clamped to the reef ring.
  let mx = 0;
  let my = 0;
  if (input.down('w') || input.down('arrowup')) my -= 1;
  if (input.down('s') || input.down('arrowdown')) my += 1;
  if (input.down('a') || input.down('arrowleft')) mx -= 1;
  if (input.down('d') || input.down('arrowright')) mx += 1;
  const mLen = Math.hypot(mx, my);
  if (mLen > 0) {
    mx /= mLen;
    my /= mLen;
    p.dashDirX = mx;
    p.dashDirY = my;
  }

  // Dash on Shift: a short burst with brief invulnerability.
  p.dashCooldown = Math.max(0, p.dashCooldown - dt);
  if (input.wasPressed('shift') && p.dashCooldown <= 0) {
    p.dashTimer = PLAYER_BASE.dashTime;
    p.dashCooldown = PLAYER_BASE.dashCooldown;
    p.invuln = Math.max(p.invuln, 0.22);
    s.audio?.dash();
    s.particles?.burst(p.x, p.y, '#4fe3c1', 10, 200, 0.35, 3);
  }
  if (p.dashTimer > 0) {
    p.dashTimer -= dt;
    p.x += p.dashDirX * PLAYER_BASE.dashSpeed * dt;
    p.y += p.dashDirY * PLAYER_BASE.dashSpeed * dt;
    s.particles?.trail(p.x, p.y, '#4fe3c1');
  } else {
    p.x += mx * p.speed * dt;
    p.y += my * p.speed * dt;
  }
  const pcx = p.x - ARENA.x;
  const pcy = p.y - ARENA.y;
  const pcd = Math.hypot(pcx, pcy);
  const maxR = ARENA.r - p.radius;
  if (pcd > maxR) {
    p.x = ARENA.x + (pcx / pcd) * maxR;
    p.y = ARENA.y + (pcy / pcd) * maxR;
  }
  p.invuln = Math.max(0, p.invuln - dt);
  p.fireTimer -= dt;

  // Flare nova on Q or right click.
  if (input.wasPressed('q') || input.wasPressed('flare')) doFlare(s);

  // Firing.
  if (input.firing && p.fireTimer <= 0) {
    p.fireTimer = s.weapon.fireInterval;
    fireWeapon(s);
  }

  // Spawning.
  if (s.spawnQueue.length > 0) {
    s.spawnTimer -= dt;
    if (s.spawnTimer <= 0) {
      s.spawnTimer = spawnInterval(s.wave);
      const type = s.spawnQueue.shift();
      const pt = spawnPoint(s, s.rng);
      const e = createEnemy(type, pt.x, pt.y, s.wave, s.rng);
      s.enemies.push(e);
      if (type === 'leviathan') s.boss = e;
    }
  }

  // Bullets.
  for (let i = s.bullets.length - 1; i >= 0; i -= 1) {
    const b = s.bullets[i];
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
    let dead = b.life <= 0;
    if (!dead) {
      for (const e of s.enemies) {
        if (e.dead || b.hitSet.has(e)) continue;
        if (Math.hypot(e.x - b.x, e.y - b.y) < e.r + b.r) {
          b.hitSet.add(e);
          s.shotsHit += 1;
          damageEnemy(s, e, b.damage);
          s.particles?.floatText(e.x, e.y - e.r - 6, `${Math.round(b.damage)}`, '#eaf6ff', 14);
          s.audio?.hit();
          if (b.pierce <= 0) { dead = true; break; }
          b.pierce -= 1;
        }
      }
    }
    if (dead || Math.hypot(b.x - ARENA.x, b.y - ARENA.y) > ARENA.r + 20) {
      s.bullets.splice(i, 1);
    }
  }
  s.enemies = s.enemies.filter((e) => !e.dead);

  // Enemies.
  for (const e of s.enemies) {
    updateEnemy(e, dt, s);
    const d = Math.hypot(e.x - p.x, e.y - p.y);
    if (d < e.r + p.radius) {
      damagePlayer(s, e.damage);
      // Shove the enemy back so one touch is not a chain of hits.
      const nx = (e.x - p.x) / (d || 1);
      const ny = (e.y - p.y) / (d || 1);
      e.x = p.x + nx * (e.r + p.radius + 6);
      e.y = p.y + ny * (e.r + p.radius + 6);
    }
  }

  // Enemy bullets.
  for (let i = s.ebullets.length - 1; i >= 0; i -= 1) {
    const b = s.ebullets[i];
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
    if (b.life <= 0 || Math.hypot(b.x - ARENA.x, b.y - ARENA.y) > ARENA.r + 30) {
      s.ebullets.splice(i, 1);
      continue;
    }
    if (Math.hypot(b.x - p.x, b.y - p.y) < b.r + p.radius) {
      damagePlayer(s, b.damage);
      s.ebullets.splice(i, 1);
    }
  }

  // Ember shards: drift, magnetise, collect.
  for (let i = s.shards.length - 1; i >= 0; i -= 1) {
    const sh = s.shards[i];
    sh.life -= dt;
    sh.bob += dt * 4;
    const d = Math.hypot(p.x - sh.x, p.y - sh.y);
    if (d < s.magnetRadius) {
      const pull = 520 * (1 - d / (s.magnetRadius + 1)) + 120;
      sh.vx += ((p.x - sh.x) / (d || 1)) * pull * dt * 4;
      sh.vy += ((p.y - sh.y) / (d || 1)) * pull * dt * 4;
    }
    sh.x += sh.vx * dt;
    sh.y += sh.vy * dt;
    sh.vx *= 0.94;
    sh.vy *= 0.94;
    if (d < p.radius + 12) {
      s.shards.splice(i, 1);
      s.score += sh.value;
      s.embers += 1;
      s.flareCharge = Math.min(100, s.flareCharge + 8);
      s.audio?.pickup();
      s.particles?.floatText(p.x, p.y - 24, `+${sh.value}`, '#ff9a3c', 15);
      continue;
    }
    if (sh.life <= 0) s.shards.splice(i, 1);
  }

  // Wave clear?
  if (s.spawnQueue.length === 0 && s.enemies.length === 0) {
    waveCleared(s);
  }
}
