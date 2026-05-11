/**
 * Escape Road 3D - Robust Implementation
 */

const UI = {
    mainMenu: document.getElementById('main-menu'),
    hud: document.getElementById('hud'),
    gameOver: document.getElementById('game-over'),
    wantedOverlay: document.getElementById('wanted-overlay'),
    countdown: document.getElementById('countdown'),
    countdownText: document.getElementById('countdown-text'),
    distance: document.getElementById('distance-val'),
    speed: document.getElementById('speed-val'),
    wanted: document.getElementById('wanted-val'),
    finalDistance: document.getElementById('final-distance')
};

// Game Constants
const LANE_WIDTH = 6;
const ROAD_LENGTH = 100;
const INITIAL_SPEED = 0.4;
const MAX_SPEED = 1.2;
const BIOME_DURATION = 30;

// Globals
let scene, camera, renderer, clock;
let player, road1, road2;
let obstacles = [];
let policeCars = [];
let gameState = 'MENU';
let distance = 0;
let worldSpeed = INITIAL_SPEED;
let targetX = 0;
let wantedLevel = 0;
let collisionCount = 0;
let biomeTimer = 0;

// Audio
let crashSound = null;
let startBeepSound = null;
let engineSound = null;

// Input
const keys = {};
window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);

// Mobile Touch
const touchControls = { left: false, right: false };

function updateTouch(e) {
    if (gameState !== 'PLAYING') return;
    
    touchControls.left = false;
    touchControls.right = false;
    
    for (let i = 0; i < e.touches.length; i++) {
        if (e.touches[i].clientX < window.innerWidth / 2) touchControls.left = true;
        else touchControls.right = true;
    }
    
    if (e.type !== 'touchstart' || e.target.tagName !== 'BUTTON') {
        e.preventDefault();
    }
}

window.addEventListener('touchstart', updateTouch, { passive: false });
window.addEventListener('touchmove', updateTouch, { passive: false });
window.addEventListener('touchend', updateTouch, { passive: false });
window.addEventListener('touchcancel', updateTouch, { passive: false });

class EnvironmentManager {
    constructor() {
        this.biome = 'CITY';
        this.pool = { CITY: [], FOREST: [] };
        this.activeObjects = [];
        this.spawnTimer = 0;
        this.config = {
            CITY: { fog: 0x88aabb, density: 0.015 },
            FOREST: { fog: 0x1a2e1a, density: 0.04 }
        };
        this.initPools();
    }

    initPools() {
        for (let i = 0; i < 20; i++) {
            const b = this.createBuilding();
            b.visible = false;
            scene.add(b);
            this.pool.CITY.push(b);
        }
        for (let i = 0; i < 30; i++) {
            const t = this.createTree();
            t.visible = false;
            scene.add(t);
            this.pool.FOREST.push(t);
        }
    }

    createBuilding() {
        const h = 10 + Math.random() * 20;
        const w = 4 + Math.random() * 4;
        const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(w, h, w),
            new THREE.MeshStandardMaterial({ color: 0x333333 })
        );
        mesh.position.y = h / 2;
        return mesh;
    }

    createTree() {
        const group = new THREE.Group();
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.6, 2), new THREE.MeshStandardMaterial({ color: 0x4d2600 }));
        trunk.position.y = 1;
        group.add(trunk);
        const fol = new THREE.Mesh(new THREE.ConeGeometry(2, 6, 8), new THREE.MeshStandardMaterial({ color: 0x0a3d0a }));
        fol.position.y = 5;
        group.add(fol);
        return group;
    }

    update(delta) {
        biomeTimer += delta;
        if (biomeTimer > BIOME_DURATION) {
            this.biome = this.biome === 'CITY' ? 'FOREST' : 'CITY';
            biomeTimer = 0;
        }
        const target = this.config[this.biome];
        if (scene.fog) {
            scene.fog.color.lerp(new THREE.Color(target.fog), delta);
            scene.fog.density = THREE.MathUtils.lerp(scene.fog.density, target.density, delta);
            scene.background.lerp(new THREE.Color(target.fog), delta);
        }

        this.spawnTimer += delta * worldSpeed * 10;
        if (this.spawnTimer > 0.5) {
            const pool = this.pool[this.biome];
            const obj = pool.find(o => !o.visible);
            if (obj) {
                obj.position.set((Math.random() > 0.5 ? 1 : -1) * (15 + Math.random() * 10), 0, -100);
                obj.visible = true;
                this.activeObjects.push(obj);
            }
            this.spawnTimer = 0;
        }

        for (let i = this.activeObjects.length - 1; i >= 0; i--) {
            const obj = this.activeObjects[i];
            obj.position.z += worldSpeed * 100 * delta;
            if (obj.position.z > 20) {
                obj.visible = false;
                this.activeObjects.splice(i, 1);
            }
        }
    }
}

class PoliceCar {
    constructor() {
        this.mesh = createDetailedCar(0xeeeeee, true);
        this.mesh.position.set(0, 0, 20); 
        scene.add(this.mesh);
        this.active = true;
    }

    update(delta) {
        this.mesh.position.z = THREE.MathUtils.lerp(this.mesh.position.z, -5, delta * 0.5);
        this.mesh.position.x = THREE.MathUtils.lerp(this.mesh.position.x, player.position.x, delta * 2);
        
        const siren = this.mesh.getObjectByName("siren");
        if (siren) {
            siren.material.color.set(Math.sin(Date.now() * 0.01) > 0 ? 0xff0000 : 0x0000ff);
        }
        const pBox = new THREE.Box3().setFromObject(player);
        const polBox = new THREE.Box3().setFromObject(this.mesh);
        if (pBox.intersectsBox(polBox)) {
            if (crashSound && crashSound.buffer) {
                if (crashSound.isPlaying) crashSound.stop();
                crashSound.play();
            }
            endGame();
        }
    }
}

function createPlayer() {
    player = createDetailedCar(0xff3e3e); // Red sports car
    scene.add(player);
}

function createDetailedCar(color, isPolice = false) {
    const group = new THREE.Group();
    const body = new THREE.Mesh(
        new THREE.BoxGeometry(2.2, 0.6, 4.5),
        new THREE.MeshStandardMaterial({ color: color, metalness: 0.8, roughness: 0.2 })
    );
    body.position.y = 0.5;
    body.castShadow = true;
    group.add(body);

    const cabin = new THREE.Mesh(
        new THREE.BoxGeometry(2, 0.6, 2.5),
        new THREE.MeshStandardMaterial({ color: color, metalness: 0.8, roughness: 0.2 })
    );
    cabin.position.y = 1.1;
    cabin.position.z = 0.2;
    cabin.castShadow = true;
    group.add(cabin);

    const glassMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 1, roughness: 0, opacity: 0.8, transparent: true });
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.5, 0.1), glassMat);
    windshield.position.set(0, 1.1, -1.06);
    group.add(windshield);

    const wheelGeom = new THREE.CylinderGeometry(0.4, 0.4, 0.4, 16);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
    const wheelPositions = [[-1.2, 0.4, 1.2], [1.2, 0.4, 1.2], [-1.2, 0.4, -1.2], [1.2, 0.4, -1.2]];
    wheelPositions.forEach(pos => {
        const wheel = new THREE.Mesh(wheelGeom, wheelMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(...pos);
        group.add(wheel);
    });

    const headLight = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 0.1), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    headLight.position.set(-0.7, 0.5, -2.26);
    group.add(headLight);
    const headLight2 = headLight.clone();
    headLight2.position.x = 0.7;
    group.add(headLight2);

    const tailLight = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 0.1), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
    tailLight.position.set(-0.7, 0.5, 2.26);
    group.add(tailLight);
    const tailLight2 = tailLight.clone();
    tailLight2.position.x = 0.7;
    group.add(tailLight2);

    if (isPolice) {
        const siren = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.2, 0.4), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
        siren.position.y = 1.4;
        siren.name = "siren";
        group.add(siren);
    }
    return group;
}

let env;

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x88aabb);
    scene.fog = new THREE.FogExp2(0x88aabb, 0.015);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 10);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.getElementById('game-container').appendChild(renderer.domElement);

    clock = new THREE.Clock();

    const listener = new THREE.AudioListener();
    camera.add(listener);
    crashSound = new THREE.Audio(listener);
    startBeepSound = new THREE.Audio(listener);
    engineSound = new THREE.Audio(listener);
    
    const audioLoader = new THREE.AudioLoader();
    audioLoader.load('faahhhhhhhh.mp3', buffer => {
        crashSound.setBuffer(buffer);
        crashSound.setVolume(0.5);
    });
    audioLoader.load('transcendedlifting-race-start-beeps-125125.mp3', buffer => {
        startBeepSound.setBuffer(buffer);
        startBeepSound.setVolume(0.6);
    });
    audioLoader.load('u_xg7ssi08yr-race-car-362035.mp3', buffer => {
        engineSound.setBuffer(buffer);
        engineSound.setVolume(0.3);
        engineSound.setLoop(true);
    });

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dL = new THREE.DirectionalLight(0xffffff, 1);
    dL.position.set(10, 20, 10);
    dL.castShadow = true;
    scene.add(dL);

    env = new EnvironmentManager();
    createPlayer();

    const rG = new THREE.PlaneGeometry(20, ROAD_LENGTH);
    const rM = new THREE.MeshStandardMaterial({ color: 0x111113 });
    road1 = new THREE.Mesh(rG, rM);
    road1.rotation.x = -Math.PI / 2;
    road1.receiveShadow = true;
    scene.add(road1);
    road2 = road1.clone();
    road2.position.z = -ROAD_LENGTH;
    scene.add(road2);

    document.getElementById('start-btn').addEventListener('click', () => startCountdown());
    document.getElementById('restart-btn').addEventListener('click', () => startCountdown());

    animate();
}

function startCountdown() {
    gameState = 'COUNTDOWN';
    UI.mainMenu.classList.remove('active');
    UI.gameOver.classList.remove('active');
    UI.hud.classList.remove('active');
    UI.countdown.classList.add('active');

    if (startBeepSound && startBeepSound.buffer) {
        startBeepSound.play();
    }

    const sequence = ['3', '2', '1', 'GO GO GO!'];
    let i = 0;
    
    UI.countdownText.textContent = sequence[i];
    i++;

    const interval = setInterval(() => {
        if (i < sequence.length) {
            UI.countdownText.textContent = sequence[i];
            i++;
        } else {
            clearInterval(interval);
            UI.countdown.classList.remove('active');
            startGame();
        }
    }, 1000);
}

function startGame() {
    gameState = 'PLAYING';
    distance = 0;
    wantedLevel = 0;
    collisionCount = 0;
    biomeTimer = 0;
    worldSpeed = INITIAL_SPEED;
    obstacles.forEach(o => scene.remove(o));
    policeCars.forEach(p => scene.remove(p.mesh));
    obstacles = [];
    policeCars = [];
    player.position.set(0, 0, 0);
    
    if (engineSound && engineSound.buffer) {
        engineSound.play();
    }

    UI.hud.classList.add('active');
    updateWantedUI();
}

function updateWantedUI() {
    let s = '';
    for (let i = 0; i < 5; i++) s += i < wantedLevel ? '★' : '☆';
    if (UI.wanted) UI.wanted.textContent = s;
}

function endGame() {
    gameState = 'GAMEOVER';
    if (engineSound && engineSound.isPlaying) {
        engineSound.stop();
    }
    UI.hud.classList.remove('active');
    UI.gameOver.classList.add('active');
    if (UI.finalDistance) UI.finalDistance.textContent = `${Math.floor(distance)}m`;
}

function animate() {
    requestAnimationFrame(animate);
    const delta = Math.min(clock.getDelta(), 0.1); 
    if (gameState === 'PLAYING') {
        try {
            updateGameplay(delta);
        } catch (e) {
            console.error("Crash in updateGameplay:", e);
        }
    }
    renderer.render(scene, camera);
}

function updateGameplay(delta) {
    distance += worldSpeed * 2;
    worldSpeed = Math.min(MAX_SPEED, INITIAL_SPEED + distance / 5000);
    env.update(delta);

    // Update engine pitch based on speed
    if (engineSound && engineSound.isPlaying) {
        engineSound.setPlaybackRate(0.8 + (worldSpeed * 0.5));
    }

    if (keys.KeyA || keys.ArrowLeft || touchControls.left) targetX = -LANE_WIDTH;
    else if (keys.KeyD || keys.ArrowRight || touchControls.right) targetX = LANE_WIDTH;
    else targetX = 0;

    player.position.x = THREE.MathUtils.lerp(player.position.x, targetX, 0.1);
    camera.position.x = player.position.x * 0.5;
    camera.lookAt(player.position.x, 0, -10);

    road1.position.z += worldSpeed * 100 * delta;
    road2.position.z += worldSpeed * 100 * delta;
    if (road1.position.z > ROAD_LENGTH) road1.position.z = road2.position.z - ROAD_LENGTH;
    if (road2.position.z > ROAD_LENGTH) road2.position.z = road1.position.z - ROAD_LENGTH;

    if (Math.random() < 0.02 + (distance / 50000)) {
        const colors = [0x333333, 0xeeeeee, 0x2196f3, 0xffcc00];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        const obs = createDetailedCar(randomColor);
        obs.position.set((Math.floor(Math.random() * 3) - 1) * LANE_WIDTH, 0, -100);
        scene.add(obs);
        obstacles.push(obs);
    }

    const pBox = new THREE.Box3().setFromObject(player);
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const o = obstacles[i];
        o.position.z += worldSpeed * 100 * delta;
        const oBox = new THREE.Box3().setFromObject(o);
        if (pBox.intersectsBox(oBox)) {
            if (crashSound && crashSound.buffer) {
                if (crashSound.isPlaying) crashSound.stop();
                crashSound.play();
            }
            endGame();
            return; 
        } else if (o.position.z > 20) {
            scene.remove(o);
            obstacles.splice(i, 1);
        }
    }

    policeCars.forEach(p => p.update(delta));
    if (UI.distance) UI.distance.textContent = `${Math.floor(distance)}m`;
    if (UI.speed) UI.speed.textContent = `${Math.floor(worldSpeed * 150)} km/h`;
}

window.addEventListener('load', () => {
    if (typeof THREE !== 'undefined') {
        init();
    } else {
        console.error("THREE is not defined!");
    }
});

window.addEventListener('resize', () => {
    if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
});
