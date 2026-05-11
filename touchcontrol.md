# Touch Control

## Design Philosophy
The game uses **dual-zone touch** — the screen is split vertically at the midpoint. The left half steers left, the right half steers right. There are no on-screen virtual buttons or joysticks, keeping the HUD clean and maximizing the viewport for the 3D scene.

## Implementation

### Global State
```js
const touchControls = { left: false, right: false };
```
A simple boolean pair consumed each frame by the input logic in `updateGameplay()`:
```js
if (keys.KeyA || keys.ArrowLeft || touchControls.left) targetX = -LANE_WIDTH;
else if (keys.KeyD || keys.ArrowRight || touchControls.right) targetX = LANE_WIDTH;
else targetX = 0;
```

### Event Handler (`updateTouch`)
Attached to four events on `window`:
- `touchstart` — finger(s) placed
- `touchmove` — finger(s) drag
- `touchend` — finger(s) lifted
- `touchcancel` — system interruption

All handlers use `{ passive: false }` to allow `preventDefault()`.

**Logic per event**:
```
1. Reset both left/right to false.
2. For each touch in touches[]:
   - if touch.clientX < window.innerWidth / 2 → left = true
   - else → right = true
3. If event is not touchstart on a <button>, call preventDefault().
```

This means:
- Multi-touch is supported (e.g. one finger on each side simultaneously = both false, which means no input — last branch wins to neutral).
- Only the **last touch** does not override — each frame re-evaluates all active touches, so if only one finger is on the right side, `right = true` and `left = false`.
- Buttons (START RACE, etc.) are excluded from `preventDefault()` so they remain clickable on touch devices.

### Integration with Game State
`updateTouch()` early-returns if `gameState !== 'PLAYING'`, ensuring touch steering is only active during the race. Menu navigation is handled entirely by button click events.

## Steering Feel
Player X position is lerped:
```js
player.position.x = THREE.MathUtils.lerp(player.position.x, targetX, 0.1);
```
- `targetX` is always one of `{-6, 0, +6}` (3 lanes, `LANE_WIDTH = 6`).
- The lerp factor 0.1 provides smooth but responsive steering — no instant snapping.
- Camera X follows player X with 0.5 multiplier for a subtle offset.

## Orientation Handling
A **portrait-orientation warning** overlay is shown on small screens in portrait mode:
```css
@media (orientation: portrait) and (max-width: 1024px) {
    #orientation-warning { opacity: 1; visibility: visible; pointer-events: auto; }
}
```
The overlay covers the full screen with a rotate-icon animation, instructing the user to switch to landscape. This ensures the wide-format 3D view and dual-zone touch split work as intended.

## Limitations & Gotchas
- **No multi-touch steering** — placing fingers on both sides simultaneously cancels to neutral (no movement).
- **No swipe or gesture** support — only binary left/right from screen half.
- **No joystick deadzone** — any touch on the left half, even near center, counts as left.
- **No on-screen throttle** — acceleration is automatic (speed grows with distance).
- **Browser chrome** — `{ passive: false }` + `preventDefault()` may still fail on some mobile browsers for `touchmove`/`touchend` in certain configurations.
