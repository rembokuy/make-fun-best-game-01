// Enemy kinds: what each one is, how it moves and how it attacks.
// Creation is pure data; per-frame behaviour lives in updateEnemy, which
// only needs the run state (player position, time, spawn hooks).

import { ENEMY_TYPES, enemyHpFor } from './config.js';

export function createEnemy(type, x, y, wave, rng) {
  const def = ENEMY_TYPES[type];
  return {
    type,
    x, y,
    r: def.radius,
    hp: enemyHpFor(type, wave),
    maxHp: enemyHpFor(type, wave),
    speed: def.speed * rng.range(0.9, 1.1),
    damage: def.damage,
    score: def.score,
    color: def.color,
    glow: def.glow,
    shardChance: def.shardChance,
    angle: rng.range(0, Math.PI * 2),
    wobble: rng.range(0, Math.PI * 2),
    shootTimer: rng.range(1.2, 2.4),
    burstTimer: 3.5,
    spawnTimer: 4,
    flash: 0,
    hitTimer: 0,
  };
}

function distToPlayer(e, s) {
  const dx = s.player.x - e.x;
  const dy = s.player.y - e.y;
  return { dx, dy, d: Math.hypot(dx, dy) || 1 };
}

// Returns nothing; mutates the enemy and may push enemy bullets or
// spawn minions through the callbacks on the state.
export function updateEnemy(e, dt, s) {
  e.flash = Math.max(0, e.flash - dt);
  const { dx, dy, d } = distToPlayer(e, s);
  const nx = dx / d;
  const ny = dy / d;
  e.wobble += dt * 3;

  if (e.type === 'wisp') {
    // Drifts at the keeper, pulsing side to side like a carried ember.
    const wob = Math.sin(e.wobble) * 0.5;
    const px = -ny * wob;
    const py = nx * wob;
    e.x += (nx + px) * e.speed * dt;
    e.y += (ny + py) * e.speed * dt;
  } else if (e.type === 'skitter') {
    // Fast zig-zag: charges in, then veers hard sideways.
    const zig = Math.sin(e.wobble * 2.2) * 0.9;
    const px = -ny * zig;
    const py = nx * zig;
    e.x += (nx + px) * e.speed * dt;
    e.y += (ny + py) * e.speed * dt;
  } else if (e.type === 'spitter') {
    // Holds a firing distance of ~260 and lobs ink at the keeper.
    const want = 260;
    const radial = d > want + 30 ? 1 : d < want - 30 ? -1 : 0;
    e.x += (nx * radial + -ny * 0.25) * e.speed * dt;
    e.y += (ny * radial + nx * 0.25) * e.speed * dt;
    e.shootTimer -= dt;
    if (e.shootTimer <= 0 && d < 560) {
      e.shootTimer = 2.1;
      const spread = 0.12;
      const a = Math.atan2(dy, dx) + (Math.random() - 0.5) * spread;
      s.ebullets.push({
        x: e.x, y: e.y,
        vx: Math.cos(a) * 235,
        vy: Math.sin(a) * 235,
        r: 7, damage: e.damage, life: 4,
      });
      s.audio?.hit();
    }
  } else if (e.type === 'leviathan') {
    // The final wave's boss: slow, relentless, radial ink bursts, and it
    // sheds fresh wisps while it lives.
    e.x += nx * e.speed * dt;
    e.y += ny * e.speed * dt;
    e.burstTimer -= dt;
    if (e.burstTimer <= 0) {
      e.burstTimer = 3.2;
      for (let i = 0; i < 10; i += 1) {
        const a = (i / 10) * Math.PI * 2 + e.wobble;
        s.ebullets.push({
          x: e.x, y: e.y,
          vx: Math.cos(a) * 170,
          vy: Math.sin(a) * 170,
          r: 8, damage: 10, life: 5,
        });
      }
      s.particles.ring(e.x, e.y, '#ff5d73', 24, 300);
      s.audio?.explode();
    }
    e.spawnTimer -= dt;
    if (e.spawnTimer <= 0) {
      e.spawnTimer = 5;
      const a = Math.random() * Math.PI * 2;
      s.enemies.push(createEnemy(
        'wisp',
        e.x + Math.cos(a) * (e.r + 20),
        e.y + Math.sin(a) * (e.r + 20),
        s.wave,
        s.rng,
      ));
    }
  }

  // Stay inside the reef ring; enemies never leave the arena.
  const cx = e.x - 640;
  const cy = e.y - 360;
  const cd = Math.hypot(cx, cy);
  if (cd > 305 - e.r) {
    e.x = 640 + (cx / cd) * (305 - e.r);
    e.y = 360 + (cy / cd) * (305 - e.r);
  }
}
