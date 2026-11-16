# Lumenkeeper — Hold the Last Light

A 2D canvas arena-survival game. Night falls on a reef; ember wisps, tide
skitters and ink spitters crawl out of the dark water to snuff the
lighthouse flame. You are the keeper. Survive 10 waves — and the
Dreadtide Leviathan that comes with the last one.

## The loop

- **Title screen** → click or press Enter to begin.
- **Play**: move around the reef ring, aim with the mouse, fire lantern
  bolts. Waves of creatures spawn from the dark water; clear them all to
  advance. Kills drop ember shards — collect them to score and to charge
  your Flare.
- **Between waves**: choose 1 of 3 reef blessings (more bolts, heavier
  damage, faster fire, piercing light, more health, faster movement,
  a stronger magnet, a stronger Flare).
- **Win**: clear wave 10 and sink the Leviathan. **Lose**: your health
  reaches zero. Both end screens show your stats and offer a restart.

## Controls

| Input | Action |
| --- | --- |
| WASD / Arrow keys | Move |
| Mouse | Aim |
| Hold left click / Space | Fire lantern bolts |
| Shift | Dash (brief invulnerability) |
| Q / Right-click | Flare nova — damages everything nearby (needs a full charge) |
| P / Esc | Pause |
| 1 / 2 / 3 or click | Pick an upgrade card between waves |
| Enter / R / click | Restart from an end screen |
| M | Toggle music |

## Depth

- **4 enemy kinds**: Ember Wisps drift at you in pulsing waves, Tide
  Skitters zig-zag in fast, Ink Spitters hold their distance and lob ink,
  and the Dreadtide Leviathan (wave 10) fires radial ink bursts and sheds
  fresh wisps while it lives.
- **8 upgrades** across 3-card choices between waves, each stackable to a
  cap — a run's weapon visibly changes as bolts multiply, pierce and
  quicken.
- **Flare nova** and **dash** give the keeper two active tools with real
  timing decisions; embers are both score and Flare fuel.

## Feel

Particles on every hit and kill, screen shake, hit flashes, floating
damage and score text, a flickering lighthouse flame, and fully
synthesised WebAudio sound effects plus a quiet arpeggio music loop —
no audio files, no network requests, everything offline.

## How to run

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome.

## Files

- `game/index.html` — the page; loads the modules below.
- `game/src/main.js` — boot, game loop, screen flow, input routing.
- `game/src/config.js` — tuning, wave tables, upgrade definitions, palette.
- `game/src/random.js` — seeded RNG (mulberry32) for reproducible runs.
- `game/src/input.js` — keyboard + mouse state.
- `game/src/audio.js` — synthesised WebAudio SFX and music.
- `game/src/world.js` — the simulation: player, waves, bullets, collisions.
- `game/src/enemies.js` — the four enemy kinds and their behaviour.
- `game/src/upgrades.js` — between-wave card rolls and application.
- `game/src/render.js` — all drawing: reef, HUD, menus, end screens.
- `game/src/particles.js` — particles, floating text, screen shake.
- `game/src/shots.js` — deterministic screenshot states
  (`?shot=start|play|win|lose&seed=1`).

## License

MIT — see LICENSE.
