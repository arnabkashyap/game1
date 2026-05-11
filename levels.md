# Levels

There are no discrete levels. The game uses a **continuous difficulty curve** driven by distance traveled, with progressive traffic, police, and biome changes.

## Speed & Acceleration

| Phase | Distance Range | worldSpeed | Display Speed | Time to Reach* |
|-------|---------------|------------|---------------|----------------|
| Cruise | 0–2,000 | 0.40 → 0.48 | 60–72 km/h | ~15 s |
| Build | 2,000–5,000 | 0.48 → 0.60 | 72–90 km/h | ~30 s |
| Chase | 5,000–15,000 | 0.60 → 1.00 | 90–150 km/h | ~60 s |
| Pursuit | 15,000–30,000 | 1.00 → 1.60 | 150–240 km/h | ~60 s |
| Max | 30,000+ | 1.60 | 240 km/h (capped) | — |

\* ~60 fps reference.

### Revised Formula

```
worldSpeed = 0.4 + (distance / 15000) ^ 0.65
worldSpeed = Math.min(MAX_SPEED, worldSpeed)
```

Where `MAX_SPEED` is raised to **1.6** (up from 1.2) to allow 240 km/h at extreme distances.

This provides:
- **Slower early acceleration** — ~100 km/h in ~15 seconds (was ~8 s before).
- **Progressive difficulty** — speed ramps smoothly through city/forest cycles.
- **Higher top end** — extended max speed for late-game challenge.

## Obstacle Traffic Population

Traffic count and density are tied directly to **wanted level**.

| Wanted Level | Stars | Obstacles on screen | Spawn Rate (per frame) | Speed Threshold |
|--------------|-------|---------------------|------------------------|-----------------|
| 0 | ☆☆☆☆☆ | 0–1 | 0.005 | any |
| 1 | ★☆☆☆☆ | 1–2 | 0.010 | > 80 km/h |
| 2 | ★★☆☆☆ | 2–3 | 0.015 | > 100 km/h |
| 3 | ★★★☆☆ | 3–4 | 0.025 | > 120 km/h |
| 4 | ★★★★☆ | 4–5 | 0.035 | > 150 km/h |
| 5 | ★★★★★ | 5–7 | 0.050 | > 180 km/h |

### Wanted Level Progression

Wanted level increases over distance:

| Distance | Wanted Level Trigger |
|----------|---------------------|
| 0–1,000 | Level 0 |
| 1,000–3,000 | Level 1 (minor evasion) |
| 3,000–6,000 | Level 2 (noticeable) |
| 6,000–12,000 | Level 3 (hot pursuit) |
| 12,000–20,000 | Level 4 (intense) |
| 20,000+ | Level 5 (maximum) |

At each threshold a **wanted flash overlay** animates on screen (red flash + "WANTED" text). The HUD star display updates to match.

### Traffic Density Rules

- **Below 80 km/h**: almost no traffic (0–1 cars), giving new players room to learn.
- **80–120 km/h**: light traffic builds up (1–2 cars).
- **120–180 km/h**: moderate traffic with occasional密集 clusters.
- **180+ km/h**: heavy traffic — the player must weave constantly.
- At **wanted level 5** and **> 200 km/h**, traffic is at maximum density with erratic obstacle lane placement.

## Police Pursuit

Police cars are no longer a placeholder. They spawn based on wanted level:

| Wanted Level | Police Cars | Spawn Interval |
|--------------|-------------|----------------|
| 1 | 0 | — |
| 2 | 1 | Every 10 s |
| 3 | 1–2 | Every 8 s |
| 4 | 2–3 | Every 6 s |
| 5 | 3–4 | Every 4 s |

- Police cars spawn ahead of the player and lerp toward the player's position.
- They flash red/blue sirens and trigger instant game-over on contact.
- At wanted level 3+, police spawn from both ahead and behind.
- Police cars are visually distinct (white body with roof siren bar).

## Biome System (`EnvironmentManager`)

Biomes alternate every **30 seconds** (`BIOME_DURATION`):

| Property | CITY | FOREST |
|----------|------|--------|
| Fog color | `#88aabb` | `#1a2e1a` |
| Fog density | 0.015 | 0.04 |
| Background color | `#88aabb` | `#1a2e1a` |
| Roadside objects | Buildings (6–11 m wide, 10–30 m tall) | Trees (cone + cylinder) |
| Traffic color palette | Dark grays, neon accents | Muted earth tones |

Transition is smooth — fog color, density, and background are `THREE.MathUtils.lerp`'d each frame.

Object spawning uses object pooling (20 buildings / 30 trees pre-created, recycled via visibility toggle). Objects spawn at Z=-100 and despawn past Z=+20.

## Rank System

At game over, rank is computed from final distance:

| Distance | Rank |
|----------|------|
| 0–500 | ROOKIE |
| 500–2,000 | STREET |
| 2,000–5,000 | HOTSHOT |
| 5,000–12,000 | ELITE |
| 12,000–25,000 | LEGEND |
| 25,000+ | ESCAPED |

## Full Game Flow

```
START → 3..2..1..GO
         │
         ├── 0–1,000 m     Wanted 0   Traffic: minimal    60–72 km/h    City biome
         ├── 1,000–3,000 m Wanted 1★  Traffic: light      72–90 km/h    → Forest biome
         ├── 3,000–6,000 m Wanted 2★  Traffic: moderate   90–110 km/h   → City biome
         ├── 6,000–12,000 m Wanted 3★ Traffic: moderate+  110–150 km/h  Police join
         ├── 12,000–20,000 m Wanted 4★ Traffic: heavy     150–200 km/h  Intense pursuit
         └── 20,000+ m      Wanted 5★ Traffic: max        200–240 km/h  Maximum chaos
                  │
                  └── collision → GAME OVER → rank display → TRY AGAIN
```
