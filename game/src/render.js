// Everything the player sees: the reef arena, the lighthouse flame, the
// keeper and the tide's creatures, the HUD, and every screen (title,
// upgrade choice, pause, victory, defeat). It only reads the run state;
// it never changes it.

import { ARENA, CENTER_FLAME, TOTAL_WAVES, PALETTE } from './config.js';
import { mulberry32 } from './random.js';

// Fixed reef decoration, seeded once so the seabed never reshuffles.
const decorRng = mulberry32(99);
const CORALS = [];
for (let i = 0; i < 26; i += 1) {
  const a = decorRng() * Math.PI * 2;
  const r = 40 + decorRng() * 250;
  CORALS.push({
    x: ARENA.x + Math.cos(a) * r,
    y: ARENA.y + Math.sin(a) * r,
    size: 6 + decorRng() * 14,
    hue: decorRng(),
  });
}
const ROCKS = [];
for (let i = 0; i < 10; i += 1) {
  const a = decorRng() * Math.PI * 2;
  const r = 250 + decorRng() * 60;
  ROCKS.push({ x: ARENA.x + Math.cos(a) * r, y: ARENA.y + Math.sin(a) * r, size: 14 + decorRng() * 22 });
}

export function upgradeCardRects() {
  const w = 300;
  const h = 210;
  const gap = 28;
  const total = w * 3 + gap * 2;
  const x0 = (1280 - total) / 2;
  return [0, 1, 2].map((i) => ({ x: x0 + i * (w + gap), y: 300, w, h }));
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, font = 'Georgia, serif', align = 'center', bold = false) {
  ctx.fillStyle = color;
  ctx.font = `${bold ? 'bold ' : ''}${size}px ${font}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function drawBackground(ctx, t) {
  const g = ctx.createLinearGradient(0, 0, 0, 720);
  g.addColorStop(0, PALETTE.seaDeep);
  g.addColorStop(0.55, PALETTE.sea);
  g.addColorStop(1, '#0d2b45');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1280, 720);

  // God-rays drifting down through the water.
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = '#bfe8ff';
  for (let i = 0; i < 5; i += 1) {
    const x = 180 + i * 230 + Math.sin(t * 0.3 + i) * 24;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 70, 0);
    ctx.lineTo(x + 130, 720);
    ctx.lineTo(x + 20, 720);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // The reef ring: sand rim, then the dark reef floor.
  ctx.beginPath();
  ctx.arc(ARENA.x, ARENA.y, ARENA.r + 16, 0, Math.PI * 2);
  ctx.fillStyle = '#1d4a44';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(ARENA.x, ARENA.y, ARENA.r, 0, Math.PI * 2);
  ctx.fillStyle = PALETTE.reef;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(201,168,106,0.55)';
  ctx.stroke();

  // Corals and rocks on the reef floor.
  for (const c of CORALS) {
    ctx.fillStyle = c.hue < 0.4 ? 'rgba(255,154,60,0.5)' : c.hue < 0.7 ? 'rgba(79,227,193,0.45)' : 'rgba(199,125,255,0.45)';
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(c.x - c.size * 0.4, c.y - c.size * 0.5, c.size * 0.55, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const r of ROCKS) {
    ctx.fillStyle = '#0c2a33';
    ctx.beginPath();
    ctx.arc(r.x, r.y, r.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawFlame(ctx, t) {
  const flick = 1 + Math.sin(t * 6) * 0.08 + Math.sin(t * 11) * 0.05;
  // Warm pool of light on the water.
  const glow = ctx.createRadialGradient(CENTER_FLAME.x, CENTER_FLAME.y, 4, CENTER_FLAME.x, CENTER_FLAME.y, 150 * flick);
  glow.addColorStop(0, 'rgba(255,215,106,0.5)');
  glow.addColorStop(1, 'rgba(255,215,106,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(CENTER_FLAME.x, CENTER_FLAME.y, 150 * flick, 0, Math.PI * 2);
  ctx.fill();
  // The little lighthouse tower.
  ctx.fillStyle = '#22384a';
  ctx.fillRect(CENTER_FLAME.x - 13, CENTER_FLAME.y - 6, 26, 34);
  ctx.fillStyle = '#c9a86a';
  ctx.fillRect(CENTER_FLAME.x - 16, CENTER_FLAME.y - 12, 32, 8);
  // The flame itself.
  ctx.fillStyle = '#ff9a3c';
  ctx.beginPath();
  ctx.ellipse(CENTER_FLAME.x, CENTER_FLAME.y - 24, 9 * flick, 15 * flick, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffd76a';
  ctx.beginPath();
  ctx.ellipse(CENTER_FLAME.x, CENTER_FLAME.y - 21, 4.5 * flick, 8 * flick, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawEnemy(ctx, e, t) {
  ctx.save();
  ctx.translate(e.x, e.y);
  if (e.flash > 0) {
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 22;
  } else {
    ctx.shadowColor = e.glow;
    ctx.shadowBlur = 16;
  }
  if (e.type === 'wisp') {
    const pulse = 1 + Math.sin(t * 5 + e.wobble) * 0.12;
    ctx.fillStyle = e.color;
    ctx.beginPath();
    ctx.arc(0, 0, e.r * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff3d6';
    ctx.beginPath();
    ctx.arc(-4, -4, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(5, 3, 3.5, 0, Math.PI * 2);
    ctx.fill();
    // Ember tail.
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = e.color;
    ctx.beginPath();
    ctx.arc(-Math.cos(e.wobble) * e.r * 0.9, -Math.sin(e.wobble) * e.r * 0.9, e.r * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  } else if (e.type === 'skitter') {
    ctx.strokeStyle = e.color;
    ctx.lineWidth = 3;
    for (let i = 0; i < 3; i += 1) {
      const a = (i - 1) * 0.7 + Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 8, Math.sin(a) * 8);
      ctx.lineTo(Math.cos(a) * 20, Math.sin(a) * 20 + Math.sin(t * 9 + i) * 3);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-Math.cos(a) * 8, -Math.sin(a) * 8);
      ctx.lineTo(-Math.cos(a) * 20, -Math.sin(a) * 20 + Math.sin(t * 9 + i) * 3);
      ctx.stroke();
    }
    ctx.fillStyle = e.color;
    ctx.beginPath();
    ctx.arc(0, 0, e.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#07231c';
    ctx.beginPath();
    ctx.arc(-5, -3, 2.5, 0, Math.PI * 2);
    ctx.arc(5, -3, 2.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (e.type === 'spitter') {
    const sac = 1 + Math.sin(t * 4 + e.wobble) * 0.15;
    ctx.fillStyle = e.color;
    ctx.beginPath();
    ctx.arc(0, 0, e.r * sac, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2a0a4d';
    ctx.beginPath();
    ctx.arc(0, 4, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-6, -6, 3, 0, Math.PI * 2);
    ctx.arc(6, -6, 3, 0, Math.PI * 2);
    ctx.fill();
  } else if (e.type === 'leviathan') {
    // Spiked ring, huge maw, crown of horns.
    ctx.fillStyle = '#7a1020';
    for (let i = 0; i < 10; i += 1) {
      const a = (i / 10) * Math.PI * 2 + t * 0.4;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * e.r * 0.9, Math.sin(a) * e.r * 0.9);
      ctx.lineTo(Math.cos(a + 0.2) * e.r * 1.25, Math.sin(a + 0.2) * e.r * 1.25);
      ctx.lineTo(Math.cos(a + 0.4) * e.r * 0.9, Math.sin(a + 0.4) * e.r * 0.9);
      ctx.fill();
    }
    ctx.fillStyle = e.color;
    ctx.beginPath();
    ctx.arc(0, 0, e.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2a050c';
    ctx.beginPath();
    ctx.ellipse(0, 12, 26, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-18, -14, 6, 0, Math.PI * 2);
    ctx.arc(18, -14, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1a0208';
    ctx.beginPath();
    ctx.arc(-18, -14, 3, 0, Math.PI * 2);
    ctx.arc(18, -14, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Health bar when hurt.
  if (e.hp < e.maxHp) {
    const w = e.r * 2;
    const x = e.x - w / 2;
    const y = e.y - e.r - 12;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(x, y, w, 5);
    ctx.fillStyle = e.type === 'leviathan' ? '#ff5d73' : '#ffd76a';
    ctx.fillRect(x, y, w * Math.max(0, e.hp / e.maxHp), 5);
  }
}

function drawPlayer(ctx, s, t) {
  const p = s.player;
  const blink = p.invuln > 0 && Math.floor(t * 14) % 2 === 0;
  ctx.save();
  if (blink) ctx.globalAlpha = 0.45;

  // Lantern light pool around the keeper.
  const glow = ctx.createRadialGradient(p.x, p.y, 8, p.x, p.y, 130);
  glow.addColorStop(0, 'rgba(255,215,106,0.28)');
  glow.addColorStop(1, 'rgba(255,215,106,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(p.x, p.y, 130, 0, Math.PI * 2);
  ctx.fill();

  // Flare ready: a pulsing ring.
  if (s.flareCharge >= 100) {
    ctx.strokeStyle = `rgba(255,215,106,${0.5 + Math.sin(t * 6) * 0.3})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(p.x, p.y, s.flareRadius * 0.35 + Math.sin(t * 6) * 6, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Aim cone.
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.aim);
  const cone = ctx.createLinearGradient(0, 0, 90, 0);
  cone.addColorStop(0, 'rgba(255,215,106,0.35)');
  cone.addColorStop(1, 'rgba(255,215,106,0)');
  ctx.fillStyle = cone;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(90, -26);
  ctx.lineTo(90, 26);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // The keeper: teal cloak, hood, gold lantern swinging ahead.
  ctx.fillStyle = '#0e6e5c';
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#123f3a';
  ctx.beginPath();
  ctx.arc(p.x, p.y - 3, p.radius * 0.62, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#eaf6ff';
  ctx.beginPath();
  ctx.arc(p.x - 5, p.y - 4, 2.6, 0, Math.PI * 2);
  ctx.arc(p.x + 5, p.y - 4, 2.6, 0, Math.PI * 2);
  ctx.fill();
  const lx = p.x + Math.cos(p.aim) * (p.radius + 8);
  const ly = p.y + Math.sin(p.aim) * (p.radius + 8);
  ctx.fillStyle = '#ffd76a';
  ctx.beginPath();
  ctx.arc(lx, ly, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff3d6';
  ctx.beginPath();
  ctx.arc(lx, ly, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Dash cooldown pip under the keeper.
  if (p.dashCooldown > 0) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(p.x - 16, p.y + p.radius + 8, 32, 4);
    ctx.fillStyle = '#4fe3c1';
    ctx.fillRect(p.x - 16, p.y + p.radius + 8, 32 * (1 - p.dashCooldown / 1.4), 4);
  }
}

function drawHud(ctx, s) {
  const p = s.player;
  // Top bar panel.
  ctx.fillStyle = 'rgba(4,12,22,0.72)';
  roundRect(ctx, 12, 10, 1256, 54, 12);
  ctx.fill();

  // Health.
  text(ctx, '❤', 40, 38, 22, '#ff5d73', 'Georgia, serif', 'center', true);
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  roundRect(ctx, 58, 24, 210, 22, 8);
  ctx.fill();
  ctx.fillStyle = p.hp / p.maxHp > 0.35 ? '#4fe3c1' : '#ff5d73';
  roundRect(ctx, 58, 24, 210 * Math.max(0, p.hp / p.maxHp), 22, 8);
  ctx.fill();
  text(ctx, `${Math.ceil(p.hp)} / ${p.maxHp}`, 163, 36, 15, '#eaf6ff', 'Arial, sans-serif', 'center', true);

  // Wave + enemies left.
  text(ctx, `WAVE ${Math.max(1, s.wave)} / ${TOTAL_WAVES}`, 640, 30, 22, '#ffd76a', 'Georgia, serif', 'center', true);
  const left = s.enemies.length + s.spawnQueue.length;
  text(ctx, left > 0 ? `${left} creatures remain` : 'Wave clear!', 640, 52, 13, '#8fb4c7', 'Arial, sans-serif');

  // Score + embers.
  text(ctx, `SCORE  ${s.score.toLocaleString('en-US')}`, 1080, 30, 20, '#eaf6ff', 'Georgia, serif', 'center', true);
  text(ctx, `◆ ${s.embers} embers`, 1080, 52, 13, '#ff9a3c', 'Arial, sans-serif');

  // Flare meter, bottom left.
  ctx.fillStyle = 'rgba(4,12,22,0.72)';
  roundRect(ctx, 12, 656, 300, 52, 12);
  ctx.fill();
  text(ctx, 'FLARE  [Q]', 30, 682, 14, '#ffd76a', 'Arial, sans-serif', 'left', true);
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  roundRect(ctx, 118, 672, 176, 16, 8);
  ctx.fill();
  ctx.fillStyle = s.flareCharge >= 100 ? '#ffd76a' : '#c98a2e';
  roundRect(ctx, 118, 672, 176 * (s.flareCharge / 100), 16, 8);
  ctx.fill();
  if (s.flareCharge >= 100) text(ctx, 'READY!', 206, 680, 12, '#071224', 'Arial, sans-serif', 'center', true);

  // Controls hint, bottom right.
  text(ctx, 'WASD move · Mouse aim · Hold click / Space to fire · Shift dash · P pause · M music', 1268, 682, 13, '#8fb4c7', 'Arial, sans-serif', 'right');

  // Wave banner.
  if (s.banner) {
    const a = Math.min(1, s.banner.timer);
    ctx.globalAlpha = Math.min(1, a * 2);
    text(ctx, s.banner.text, 640, 150, 40, '#ffd76a', 'Georgia, serif', 'center', true);
    text(ctx, s.banner.sub, 640, 190, 17, '#eaf6ff', 'Arial, sans-serif');
    ctx.globalAlpha = 1;
  }
}

function dim(ctx, alpha = 0.62) {
  ctx.fillStyle = `rgba(4,10,20,${alpha})`;
  ctx.fillRect(0, 0, 1280, 720);
}

function statsLines(stats) {
  const mins = Math.floor(stats.time / 60);
  const secs = Math.floor(stats.time % 60).toString().padStart(2, '0');
  return [
    ['Final score', stats.score.toLocaleString('en-US')],
    ['Waves cleared', `${Math.min(stats.wave, TOTAL_WAVES)} / ${TOTAL_WAVES}`],
    ['Creatures banished', `${stats.kills}`],
    ['Embers gathered', `${stats.embers}`],
    ['Time', `${mins}:${secs}`],
    ['Accuracy', `${stats.accuracy}%`],
  ];
}

function drawStatsPanel(ctx, stats, y0) {
  const rows = statsLines(stats);
  ctx.fillStyle = 'rgba(4,12,22,0.8)';
  roundRect(ctx, 440, y0, 400, rows.length * 34 + 24, 14);
  ctx.fill();
  rows.forEach(([label, value], i) => {
    const y = y0 + 30 + i * 34;
    text(ctx, label, 465, y, 17, '#8fb4c7', 'Arial, sans-serif', 'left');
    text(ctx, value, 815, y, 17, '#ffd76a', 'Arial, sans-serif', 'right', true);
  });
  return y0 + rows.length * 34 + 24;
}

function drawTitle(ctx, s, t, best) {
  dim(ctx, 0.55);
  text(ctx, 'LUMENKEEPER', 640, 128, 74, '#ffd76a', 'Georgia, serif', 'center', true);
  text(ctx, '— Hold the Last Light —', 640, 180, 24, '#ff9a3c', 'Georgia, serif');
  text(ctx, 'Night falls on the reef. Ember wisps, tide skitters and ink spitters', 640, 232, 18, '#eaf6ff', 'Arial, sans-serif');
  text(ctx, 'crawl out of the dark water to snuff the lighthouse flame.', 640, 258, 18, '#eaf6ff', 'Arial, sans-serif');
  text(ctx, 'You are the keeper. Survive 10 waves — and the Dreadtide Leviathan.', 640, 284, 18, '#eaf6ff', 'Arial, sans-serif');

  // Creature legend.
  const legend = [
    ['#ff9a3c', 'Ember Wisp — drifts at you'],
    ['#4fe3c1', 'Tide Skitter — fast, zig-zags'],
    ['#c77dff', 'Ink Spitter — shoots from afar'],
    ['#ff5d73', 'Dreadtide Leviathan — final wave'],
  ];
  legend.forEach(([color, label], i) => {
    const y = 336 + i * 26;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(380, y, 8, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, label, 398, y, 16, '#eaf6ff', 'Arial, sans-serif', 'left');
  });

  text(ctx, 'WASD / Arrows — move      Mouse — aim      Hold Click / Space — fire', 640, 478, 17, '#8fb4c7', 'Arial, sans-serif');
  text(ctx, 'Shift — dash      Q / Right-click — Flare nova (when charged)      P — pause', 640, 504, 17, '#8fb4c7', 'Arial, sans-serif');
  text(ctx, 'Between waves, choose 1 of 3 reef blessings. Collect embers to charge your Flare.', 640, 530, 16, '#ff9a3c', 'Arial, sans-serif');

  const pulse = 0.75 + Math.sin(t * 4) * 0.25;
  ctx.globalAlpha = pulse;
  text(ctx, '▶  CLICK OR PRESS ENTER TO BEGIN  ◀', 640, 596, 26, '#ffd76a', 'Georgia, serif', 'center', true);
  ctx.globalAlpha = 1;
  if (best > 0) text(ctx, `Best score: ${best.toLocaleString('en-US')}`, 640, 636, 16, '#8fb4c7', 'Arial, sans-serif');
}

function drawUpgrade(ctx, s) {
  dim(ctx, 0.66);
  text(ctx, `WAVE ${s.wave} CLEARED!`, 640, 130, 46, '#ffd76a', 'Georgia, serif', 'center', true);
  text(ctx, 'The reef offers a blessing — choose one to carry into the next wave', 640, 178, 19, '#eaf6ff', 'Arial, sans-serif');
  text(ctx, `Score ${s.score.toLocaleString('en-US')}   ·   Health ${Math.ceil(s.player.hp)} / ${s.player.maxHp}`, 640, 214, 16, '#8fb4c7', 'Arial, sans-serif');
  const rects = upgradeCardRects();
  s.choices.forEach((u, i) => {
    const r = rects[i];
    const hover = false;
    ctx.fillStyle = 'rgba(10,30,51,0.95)';
    roundRect(ctx, r.x, r.y, r.w, r.h, 14);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffd76a';
    ctx.stroke();
    if (hover) ctx.stroke();
    text(ctx, u.icon, r.x + r.w / 2, r.y + 42, 34, '#ffd76a', 'Georgia, serif', 'center', true);
    text(ctx, u.name, r.x + r.w / 2, r.y + 92, 22, '#eaf6ff', 'Georgia, serif', 'center', true);
    // Word-wrap the description across two lines.
    const words = u.desc.split(' ');
    let line = '';
    const lines = [];
    for (const w of words) {
      if ((line + ' ' + w).trim().length > 26) { lines.push(line.trim()); line = w; } else line += ' ' + w;
    }
    lines.push(line.trim());
    lines.forEach((ln, li) => text(ctx, ln, r.x + r.w / 2, r.y + 132 + li * 22, 15, '#8fb4c7', 'Arial, sans-serif'));
    text(ctx, `[ ${i + 1} ]`, r.x + r.w / 2, r.y + r.h - 24, 15, '#4fe3c1', 'Arial, sans-serif', 'center', true);
  });
  text(ctx, 'Click a card or press 1, 2 or 3', 640, 560, 17, '#8fb4c7', 'Arial, sans-serif');
}

function drawEnd(ctx, s, won, t) {
  dim(ctx, 0.6);
  if (won) {
    text(ctx, '✦  THE LIGHT HOLDS  ✦', 640, 120, 52, '#ffd76a', 'Georgia, serif', 'center', true);
    text(ctx, 'Ten waves broken on the reef. The Leviathan sinks, the flame burns on,', 640, 168, 18, '#eaf6ff', 'Arial, sans-serif');
    text(ctx, 'and dawn finds the lighthouse still standing. The keeper endures.', 640, 194, 18, '#eaf6ff', 'Arial, sans-serif');
  } else {
    text(ctx, 'THE LIGHT GOES OUT…', 640, 120, 52, '#ff5d73', 'Georgia, serif', 'center', true);
    text(ctx, `The tide took the keeper on wave ${Math.max(1, s.finalStats?.wave || 1)}.`, 640, 168, 18, '#eaf6ff', 'Arial, sans-serif');
    text(ctx, 'But the flame remembers every keeper who held it. Light it again.', 640, 194, 18, '#eaf6ff', 'Arial, sans-serif');
  }
  const bottom = drawStatsPanel(ctx, s.finalStats, 232);
  const pulse = 0.75 + Math.sin(t * 4) * 0.25;
  ctx.globalAlpha = pulse;
  text(ctx, won ? '▶  PLAY AGAIN — CLICK OR PRESS ENTER  ◀' : '▶  TRY AGAIN — CLICK OR PRESS R  ◀', 640, bottom + 44, 24, '#ffd76a', 'Georgia, serif', 'center', true);
  ctx.globalAlpha = 1;
}

// --- Main entry ----------------------------------------------------------
export function draw(ctx, s, t, best) {
  ctx.clearRect(0, 0, 1280, 720);
  const off = s.particles ? s.particles.shakeOffset() : { x: 0, y: 0 };
  ctx.save();
  ctx.translate(off.x, off.y);

  drawBackground(ctx, t);
  drawFlame(ctx, t);

  // Ember shards on the reef floor.
  for (const sh of s.shards) {
    const bob = Math.sin(sh.bob) * 2;
    ctx.save();
    ctx.shadowColor = '#ff9a3c';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#ff9a3c';
    ctx.beginPath();
    ctx.arc(sh.x, sh.y + bob, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffd76a';
    ctx.beginPath();
    ctx.arc(sh.x, sh.y + bob, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  for (const e of s.enemies) drawEnemy(ctx, e, t);

  // Enemy ink bullets.
  for (const b of s.ebullets) {
    ctx.save();
    ctx.shadowColor = '#c77dff';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#c77dff';
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e0aaff';
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Keeper bolts.
  for (const b of s.bullets) {
    ctx.save();
    ctx.shadowColor = '#ffd76a';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#ffd76a';
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff3d6';
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  if (s.phase !== 'title') drawPlayer(ctx, s, t);
  s.particles?.draw(ctx);
  ctx.restore();

  if (s.phase === 'playing' || s.phase === 'upgrade' || s.phase === 'paused') drawHud(ctx, s);
  if (s.phase === 'title') drawTitle(ctx, s, t, best);
  if (s.phase === 'upgrade') drawUpgrade(ctx, s);
  if (s.phase === 'paused') {
    dim(ctx, 0.55);
    text(ctx, 'PAUSED', 640, 320, 52, '#ffd76a', 'Georgia, serif', 'center', true);
    text(ctx, 'Press P or Esc to resume · M toggles music', 640, 372, 18, '#eaf6ff', 'Arial, sans-serif');
  }
  if (s.phase === 'win') drawEnd(ctx, s, true, t);
  if (s.phase === 'lose') drawEnd(ctx, s, false, t);
}
