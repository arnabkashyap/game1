# Context

## Overview
**Escape Road 3D** is an infinite-runner 3D driving game built with Three.js. The player drives a car on an endless road, dodging oncoming traffic while a wanted level and police pursuit escalate over distance. The game features a city/forest biome cycle, car customization, and optional multiplayer.

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Rendering | Three.js (self-hosted `three.min.js`, r128+) |
| Server | Node.js + Express + Socket.IO |
| Audio | Web Audio API via `THREE.Audio` |
| Fonts | Google Fonts (Outfit) |
| Hosting | Optimized for static deployment (e.g. GitHub Pages) |

## Project Structure
```
game1/
├── index.html          Entry point — UI overlays, HTML structure
├── style.css           All visual styling (dark theme, glassmorphism, animations)
├── game.js             Core game logic (~600 lines, all-in-one)
├── server.js           Node.js multiplayer relay server
├── package.json        Node dependencies (express, socket.io)
├── three.min.js        Bundled Three.js library (no CDN dependency)
├── README.md           Basic info + live demo link
├── faahhhhhhhh.mp3     Crash sound effect
├── transcendedlifting-race-start-beeps-125125.mp3  Countdown beeps
├── u_xg7ssi08yr-race-car-362035.mp3  Engine loop
└── node_modules/       (server dependencies)
```

## How It Works
1. **Menu** → player picks a car model, color, and name, then hits START.
2. **Countdown** (3-2-1-GO) → race begins.
3. **Gameplay** → infinite road scrolls toward the camera; the player steers left/right to avoid obstacle cars.
4. **Difficulty** → speed and obstacle spawn rate increase with distance.
5. **Police** → after enough distance, police cars appear and chase the player; colliding with anything ends the game.
6. **Game Over** → final distance is shown; player can retry.

## Key Design Decisions
- **Single-file game.js** — all game logic in one file for simplicity; no module bundler.
- **Three.js via global script tag** — avoids build tooling; `three.min.js` vendored locally.
- **Socket.IO multiplayer** — server relays position/color/name; no authoritative state (each client simulates).
- **Touch as dual-zone** — left half of screen = left steer, right half = right steer; no virtual buttons.
- **Biome cycling** — every 30 seconds the environment swaps between CITY and FOREST (fog color, density, roadside objects).
