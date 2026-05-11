# Car Models

All cars are procedurally generated in `createDetailedCar(color, isPolice, type)` using Three.js primitives (BoxGeometry, CylinderGeometry). No external 3D model files.

## Available Types

| Type | Body (w×h×d) | Cabin (w×h×d) | Cabin Position | Characteristics |
|------|-------------|---------------|----------------|-----------------|
| `sport` | 2.2 × 0.6 × 4.5 | 2.0 × 0.6 × 2.5 | (0, 1.1, 0.2) | Low profile, short body, cabin slightly forward |
| `truck` | 2.5 × 1.2 × 6.0 | 2.3 × 1.0 × 1.5 | (0, 1.1, -2.0) | Tall wide body, cabin pushed back |
| `muscle` | 2.4 × 0.8 × 5.0 | 2.1 × 0.6 × 2.5 | (0, 1.0, 0.5) | Wide stance, long hood, cabin centered |

## Construction

Each car is a `THREE.Group` containing:

### Body
- BoxGeometry with **metalness 0.8, roughness 0.2** for a glossy look.
- Color is set via `selectedColor` (police cars always `0xeeeeee`).

### Cabin
- Slightly smaller BoxGeometry on top of the body.
- Same metallic material as body.

### Windshield
- Thin (0.1 depth) box with dark tint: `#333333`, metalness 1.0, roughness 0, opacity 0.8, transparent.
- Positioned at the front of the cabin.

### Wheels (×4)
- CylinderGeometry (radius 0.4, height 0.4, 16 segments).
- Dark color `0x111111`, roughness 0.9.
- Rotated 90° on Z axis, positioned at four corners of the body.
- Wheels are slightly outside body width (± bodyWidth/2 + 0.1).

### Lights
- **Headlights** (×2): white `BoxBasicMaterial(0xffffff)` at front bumper.
- **Taillights** (×2): red `BoxBasicMaterial(0xff0000)` at rear bumper.

### Police Accessories
When `isPolice = true`, a **siren bar** is added:
- BoxGeometry(0.8, 0.2, 0.4) with `MeshBasicMaterial`.
- Positioned on top of the cabin.
- Named `"siren"` — its color oscillates red↔blue via `Date.now()` in the update loop.

## Customization (Garage)

Accessed from the main menu before starting a race.

### Car Selection
Three buttons: **SPORT** (default), **TRUCK**, **MUSCLE**.
- Active button highlighted with `.car-opt.active` (white bg, black text).
- Changing selection calls `updatePreview()` which destroys and recreates the player mesh.

### Color Selection
Five swatches (red default, blue, green, yellow, white).
- `.color-opt` rendered as 40px circles with inline `background` style.
- Active swatch gets white border + scale(1.2) + glow.
- `selectedColor` hex is stored and passed to `createDetailedCar`.

### Preview
The player car in the menu is the same 3D object in the 3D scene (not a 2D preview). `updatePreview()` simply removes the old `player` mesh and calls `createPlayer()` which calls `createDetailedCar()` with current selections.

## Obstacle Cars
Obstacle cars are created with `createDetailedCar(randomColor)` (no `type` param ⇒ defaults to `'sport'`). Colors randomly chosen from `[0x333333, 0xeeeeee, 0x2196f3, 0xffcc00]`.
