// Lumenkeeper — boot, the fixed-step loop, screen flow and input routing.
// The simulation lives in world.js, the drawing in render.js; this file
// only wires them together and owns the phase transitions.

import { VIEW_W, VIEW_H } from './config.js';
import { Input } from './input.js';
import { AudioSys } from './audio.js';
import { Particles } from './particles.js';
import { createRun, startGame, update, chooseUpgrade } from './world.js';
import { draw, upgradeCardRects } from './render.js';
import { buildShotState, isShotMode, shotParams } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW_W;
canvas.height = VIEW_H;

const input = new Input(canvas);
const audio = new AudioSys();
const particles = new Particles();

const BEST_KEY = 'lumenkeeper-best-score';
function loadBest() {
  try {
    return Number(window.localStorage.getItem(BEST_KEY) || '0') || 0;
  } catch {
    return 0;
  }
}
function saveBest(score) {
  try {
    if (score > loadBest()) window.localStorage.setItem(BEST_KEY, String(score));
  } catch {
    // Private mode: the score just is not kept.
  }
}

let state = createRun((Math.random() * 1e9) | 0, audio, particles);
let best = loadBest();
let shotMode = false;
let shotTime = 0.6; // Fixed simulated time so a shot frame never wobbles.

function pointInRect(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

function handlePhaseInput() {
  const s = state;
  if (input.wasPressed('m')) {
    audio.unlock();
    const on = audio.toggleMusic();
    if (on) audio.startMusic();
  }

  if (s.phase === 'title') {
    if (input.wasPressed('enter') || input.wasClicked()) {
      audio.unlock();
      audio.startMusic();
      startGame(s);
    }
    return;
  }

  if (s.phase === 'playing') {
    if (input.wasPressed('p') || input.wasPressed('escape')) {
      s.phase = 'paused';
    }
    return;
  }

  if (s.phase === 'paused') {
    if (input.wasPressed('p') || input.wasPressed('escape') || input.wasClicked()) {
      s.phase = 'playing';
    }
    return;
  }

  if (s.phase === 'upgrade') {
    if (input.wasPressed('1')) { chooseUpgrade(s, 0); return; }
    if (input.wasPressed('2')) { chooseUpgrade(s, 1); return; }
    if (input.wasPressed('3')) { chooseUpgrade(s, 2); return; }
    if (input.wasClicked()) {
      const pt = input.clickPoint();
      const rects = upgradeCardRects();
      for (let i = 0; i < rects.length; i += 1) {
        if (pointInRect(pt.x, pt.y, rects[i])) {
          chooseUpgrade(s, i);
          return;
        }
      }
    }
    return;
  }

  if (s.phase === 'win') {
    if (input.wasPressed('enter') || input.wasClicked()) {
      saveBest(s.finalStats?.score || 0);
      best = loadBest();
      startGame(s);
    }
    return;
  }

  if (s.phase === 'lose') {
    if (input.wasPressed('r') || input.wasPressed('enter') || input.wasClicked()) {
      saveBest(s.finalStats?.score || 0);
      best = loadBest();
      startGame(s);
    }
  }
}

// Record the best score the moment a run ends, even if the player walks away.
let recordedForRun = null;
function maybeRecordBest() {
  if ((state.phase === 'win' || state.phase === 'lose') && state.finalStats && recordedForRun !== state.finalStats) {
    recordedForRun = state.finalStats;
    saveBest(state.finalStats.score);
    best = loadBest();
  }
}

function frame(now) {
  const t = now / 1000;
  if (shotMode) {
    // One frozen frame: draw, announce readiness, stop.
    draw(ctx, state, shotTime, best);
    window.__shotReady = true;
    return;
  }
  const dt = Math.min(0.033, 1 / 60);
  handlePhaseInput();
  update(state, input, dt);
  maybeRecordBest();
  draw(ctx, state, t, best);
  input.endFrame();
  requestAnimationFrame(frame);
}

// Read-only handle for automated play-tests (and curious players):
// window.__lumenkeeper.state is the live run state.
window.__lumenkeeper = {
  get state() { return state; },
  get best() { return best; },
};

function boot() {
  if (isShotMode()) {
    shotMode = true;
    const { shot, seed } = shotParams();
    state = buildShotState(shot, seed, null, particles);
    // Draw immediately as well as on the next frame, so a screenshot
    // taken at any moment after load sees the finished scene.
    draw(ctx, state, shotTime, best);
    window.__shotReady = true;
    requestAnimationFrame(frame);
    return;
  }
  requestAnimationFrame(frame);
}

boot();
