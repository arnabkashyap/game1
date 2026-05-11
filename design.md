# Design

## Architecture
The game follows a flat, single-file architecture with no module system. All code lives in `game.js` (~600 lines) and runs in a global scope.

### Core Loop (in `animate()`)
```
requestAnimationFrame
  → clock.getDelta()
  → if PLAYING → updateGameplay(delta)
  → renderer.render(scene, camera)
```

`updateGameplay()` orchestrates every subsystem each frame:
1. **Distance & Speed** — distance accumulates; speed increases from 0.4 → 1.2 (capped).
2. **Environment** — biome switches every 30 s; spawns/despawns buildings (city) or trees (forest).
3. **Road** — two PlaneGeometry segments cycle infinitely.
4. **Input** — keyboard (A/D, arrow keys) and touch → `targetX` lerped onto player X.
5. **Obstacles** — random spawn of oncoming cars; Box3 collision against player.
6. **Police** — each PoliceCar lerps toward player Z/X; collision ends game.
7. **Audio** — engine pitch scales with speed (0.8–1.4x playback rate).
8. **Multiplayer** — emits position; receives other players via Socket.IO.

### State Machine
```
MENU → COUNTDOWN → PLAYING → GAMEOVER → COUNTDOWN (loop)
```

Each state controls which UI overlay is visible. `gameState` is a global string checked inside `animate()` and `updateTouch()`.

### Rendering Pipeline
- **Scene**: `THREE.Scene` with `FogExp2` (color/density lerps on biome change).
- **Camera**: PerspectiveCamera (75° FOV, 0.1–1000 near/far); follows player X with 0.5 multiplier; always looks ahead at Z=-10.
- **Lighting**: AmbientLight (0.5 intensity) + DirectionalLight (shadow-mapped).
- **Shadows**: enabled on renderer; body/cabin meshes cast shadows; road receives shadows.
- **Background**: `scene.background` color lerps with biome fog color.

### UI System
HTML overlays controlled by CSS `.overlay` / `.overlay.active` toggling opacity + `pointer-events`. Six overlays: main-menu, garage (nested modal), HUD, countdown, wanted-flash, game-over. No canvas-based UI.

### Audio System
- Uses `THREE.Audio` (Web Audio wrapper).
- Listener attached to camera for positional audio.
- Three buffers loaded at init: crash (one-shot), beeps (one-shot), engine (loop + dynamic playback rate).
- Audio files loaded via `THREE.AudioLoader` (XHR); game works without audio if files are missing (graceful no-op).

### Multiplayer (Socket.IO)
- **Server** (`server.js`): receives `move` events, broadcasts `updatePlayers` with all positions, broadcasts `playerDisconnected` on disconnect.
- **Client**: on `updatePlayers`, creates/updates remote player meshes (same `createDetailedCar` function) with `position.lerp` interpolation and name-tag sprites above each car.
- No lag compensation, no client-side prediction, no authoritative collision.

## Key Classes & Objects
| Symbol | Role |
|--------|------|
| `EnvironmentManager` | Object pool for buildings (×20) and trees (×30); biome switching; spawn/despawn culling |
| `PoliceCar` | Police chase logic: lerps toward player, siren color oscillation, Box3 collision |
| `UI` | Singleton referencing all DOM overlay elements |
| `touchControls` | `{ left, right }` booleans set by touch event handler |
| `otherPlayers` | Map of `{ id → { mesh, nameTag } }` for multiplayer |
