import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import gsap from 'gsap';

gsap.ticker.lagSmoothing(0);

let solverModulePromise = null;

function loadSolverModule() {
    if (!solverModulePromise) {
        solverModulePromise = import('./cube-solver-api.js').then((mod) => mod.getSolverApi());
    }
    return solverModulePromise;
}

const CUBELET_SIZE = 0.95;
const CUBELET_GAP = 0.045;
const CUBELET_RADIUS = 0.11;
const CUBELET_SEGMENTS = 4;
const SPACING = CUBELET_SIZE + CUBELET_GAP;
const HALF_PI = Math.PI / 2;
const DEFAULT_CAMERA_POSITION = new THREE.Vector3(5.6, 4.5, 6.94);

const FACE_COLORS = {
    R: 0xc41e3a,
    L: 0xff6a00,
    U: 0xffffff,
    D: 0xffd500,
    F: 0x00a651,
    B: 0x0051ba,
    inner: 0x141414,
};

const OUTER_LAYERS = {
    R: 'x1', L: 'x-1', U: 'y1', D: 'y-1', F: 'z1', B: 'z-1',
};

const MIDDLE_LAYERS = {
    M: 'x0', E: 'y0', S: 'z0',
};

const WIDE_LAYERS = {
    r: ['x1', 'x0'],
    l: ['x-1', 'x0'],
    u: ['y1', 'y0'],
    d: ['y-1', 'y0'],
    f: ['z1', 'z0'],
    b: ['z-1', 'z0'],
};

// Matches rubiks-cube-solver rotation directions.
const MOVE_DIRS = {
    R: -1, r: -1, L: 1, l: 1, M: 1, m: 1,
    U: -1, u: -1, D: 1, d: 1, E: 1, e: 1,
    F: -1, f: -1, B: 1, b: 1, S: -1, s: -1,
};

const SCRAMBLE_MOVE_DURATION = 0.26;
const SOLVE_MOVE_DURATION = 0.4;
const MOVE_EASE = 'power2.inOut';
const MOVE_SETTLE = 0.05;

const DRAG_ROTATE_SPEED = 0.0055;
const MOMENTUM_DECAY = 5.2;
const SPIN_STOP_THRESHOLD = 0.00035;
const MAX_ORBIT_VELOCITY = 2.8;
const MIN_PHI = 0.05;
const MAX_PHI = Math.PI - 0.05;

const SCRAMBLE_MOVES = [
    'R', "R'", 'R2', 'L', "L'", 'L2',
    'U', "U'", 'U2', 'D', "D'", 'D2',
    'F', "F'", 'F2', 'B', "B'", 'B2',
];

const _worldPos = new THREE.Vector3();
const _localPos = new THREE.Vector3();
const _invParent = new THREE.Matrix4();
const _euler = new THREE.Euler();

function toSolverMove(move) {
    const prime = move.endsWith("'");
    const isDouble = move.endsWith('2');
    const face = isDouble ? move[0] : prime ? move.slice(0, -1) : move;
    if (isDouble) return `${face}2`;
    if (prime) return `${face}prime`;
    return face;
}

function fromSolverMove(move) {
    if (!move) return move;
    const face = move[0];
    if (move.includes('2')) return `${face}2`;
    if (/prime/i.test(move)) return `${face}'`;
    return face;
}

function layersForMove(face) {
    if (WIDE_LAYERS[face]) return WIDE_LAYERS[face];
    const middle = MIDDLE_LAYERS[face] || MIDDLE_LAYERS[face.toUpperCase()];
    if (middle) return [middle];
    return [OUTER_LAYERS[face.toUpperCase()]];
}

function parseMove(move) {
    const prime = move.endsWith("'");
    const isDouble = move.endsWith('2');
    const face = isDouble ? move[0] : prime ? move.slice(0, -1) : move;
    let dir = MOVE_DIRS[face];
    if (dir == null) return null;
    if (prime) dir *= -1;
    if (isDouble) dir *= 2;
    const layers = layersForMove(face);
    if (!layers[0]) return null;
    return { face, dir, layers, axisKey: layers[0][0] };
}

function parseSolverSolution(solution) {
    return solution
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map(fromSolverMove);
}

const materialCache = new Map();

function stickerMaterial(color, envMap) {
    if (!materialCache.has(color)) {
        const mat = new THREE.MeshStandardMaterial({
            color,
            metalness: 0.78,
            roughness: 0.18,
            envMapIntensity: 1.35,
        });
        if (envMap) mat.envMap = envMap;
        materialCache.set(color, mat);
    }
    return materialCache.get(color);
}

function innerMaterial(envMap) {
    const key = 'inner';
    if (!materialCache.has(key)) {
        const mat = new THREE.MeshStandardMaterial({
            color: FACE_COLORS.inner,
            metalness: 0.35,
            roughness: 0.55,
        });
        if (envMap) mat.envMap = envMap;
        materialCache.set(key, mat);
    }
    return materialCache.get(key);
}

function createCubeletMaterials(x, y, z, envMap) {
    return [
        x === 1 ? stickerMaterial(FACE_COLORS.R, envMap) : innerMaterial(envMap),
        x === -1 ? stickerMaterial(FACE_COLORS.L, envMap) : innerMaterial(envMap),
        y === 1 ? stickerMaterial(FACE_COLORS.U, envMap) : innerMaterial(envMap),
        y === -1 ? stickerMaterial(FACE_COLORS.D, envMap) : innerMaterial(envMap),
        z === 1 ? stickerMaterial(FACE_COLORS.F, envMap) : innerMaterial(envMap),
        z === -1 ? stickerMaterial(FACE_COLORS.B, envMap) : innerMaterial(envMap),
    ];
}

let sharedCubeletGeometry = null;

function getCubeletGeometry() {
    if (!sharedCubeletGeometry) {
        sharedCubeletGeometry = new RoundedBoxGeometry(
            CUBELET_SIZE,
            CUBELET_SIZE,
            CUBELET_SIZE,
            CUBELET_SEGMENTS,
            CUBELET_RADIUS
        );
    }
    return sharedCubeletGeometry;
}

function createCubeletMesh(x, y, z, envMap) {
    return new THREE.Mesh(getCubeletGeometry(), createCubeletMaterials(x, y, z, envMap));
}

function snapAngle(angle) {
    return Math.round(angle / HALF_PI) * HALF_PI;
}

export class RubikCube {
    constructor(containerId, shuffleButtonId = 'cube-shuffle-btn') {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.cubelets = [];
        this.layerIndex = {
            x: { '-1': [], 0: [], 1: [] },
            y: { '-1': [], 0: [], 1: [] },
            z: { '-1': [], 0: [], 1: [] },
        };
        this.isAnimating = false;
        this.sequenceActive = false;
        this.isDragging = false;
        this.orbitCoasting = false;
        this.autoSpinEnabled = true;
        this._autoSpinWaitingSettle = false;
        this._autoSpinArmTime = null;
        this._autoSpinDelay = 1800;
        this.spinVelocity = { theta: 0, phi: 0 };
        this._pointer = { lastX: 0, lastY: 0 };
        this._velocitySamples = [];
        this._activeLayerTween = null;
        this.activePivot = null;
        this.logicalCube = null;
        this.solverApi = null;
        this.shuffleBtn = document.getElementById(shuffleButtonId);

        this._initScene();
        this._buildCube();
        this._setupResize();
        this._setupVisibility();
        this._setupShuffleButton();
    }

    _initScene() {
        const { clientWidth, clientHeight } = this.container;

        this.scene = new THREE.Scene();
        this.scene.background = null;

        this.camera = new THREE.PerspectiveCamera(42, clientWidth / clientHeight, 0.1, 100);
        this.camera.position.copy(DEFAULT_CAMERA_POSITION);
        this.camera.lookAt(0, 0, 0);

        this.clock = new THREE.Clock();
        this.autoSpinSpeed = 0.42;

        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance',
        });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        this.renderer.setSize(clientWidth, clientHeight);
        this.renderer.setClearColor(0x000000, 0);
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.45;
        this.container.appendChild(this.renderer.domElement);

        this.cubeGroup = new THREE.Group();
        this.scene.add(this.cubeGroup);

        this.orbitRadius = DEFAULT_CAMERA_POSITION.length();
        this.orbit = {
            theta: Math.atan2(DEFAULT_CAMERA_POSITION.x, DEFAULT_CAMERA_POSITION.z),
            phi: Math.acos(
                THREE.MathUtils.clamp(DEFAULT_CAMERA_POSITION.y / this.orbitRadius, -1, 1)
            ),
        };
        this._updateCamera();

        const pmrem = new THREE.PMREMGenerator(this.renderer);
        this.envMap = pmrem.fromScene(new RoomEnvironment(), 0.12).texture;
        this.scene.environment = this.envMap;
        pmrem.dispose();

        this._addStudioLights();
        this._setupDragControls();

        this.isVisible = true;
        this.renderer.setAnimationLoop(() => this._renderFrame());
    }

    _updateCamera() {
        const { theta, phi } = this.orbit;
        const r = this.orbitRadius;
        this.camera.position.set(
            r * Math.sin(phi) * Math.sin(theta),
            r * Math.cos(phi),
            r * Math.sin(phi) * Math.cos(theta)
        );
        this.camera.lookAt(0, 0, 0);
    }

    _clampOrbitPhi(phi) {
        return THREE.MathUtils.clamp(phi, MIN_PHI, MAX_PHI);
    }

    _clampOrbitVelocity(velocity) {
        return THREE.MathUtils.clamp(velocity, -MAX_ORBIT_VELOCITY, MAX_ORBIT_VELOCITY);
    }

    _renderFrame() {
        const coasting =
            !this.isDragging &&
            (Math.abs(this.spinVelocity.theta) > SPIN_STOP_THRESHOLD ||
                Math.abs(this.spinVelocity.phi) > SPIN_STOP_THRESHOLD);

        this.orbitCoasting = coasting;

        const active =
            this.isVisible ||
            this.isDragging ||
            this.isAnimating ||
            coasting ||
            this.autoSpinEnabled ||
            this._autoSpinWaitingSettle;

        if (!active) return;

        const delta = Math.min(this.clock.getDelta(), 0.032);

        this._applySpinMomentum(delta);

        if (
            this.autoSpinEnabled &&
            !this.isDragging &&
            !coasting &&
            !this.isAnimating &&
            !this.sequenceActive
        ) {
            this.cubeGroup.rotation.y += this.autoSpinSpeed * delta;
        }

        this._tickAutoSpinResume();

        if (!this.isVisible && !this.isDragging && !this.isAnimating && !coasting && !this.autoSpinEnabled) {
            return;
        }

        this.renderer.render(this.scene, this.camera);
    }

    _applySpinMomentum(delta) {
        if (this.isDragging) return;

        let { theta, phi } = this.spinVelocity;
        if (Math.abs(theta) <= SPIN_STOP_THRESHOLD && Math.abs(phi) <= SPIN_STOP_THRESHOLD) {
            this.spinVelocity.theta = 0;
            this.spinVelocity.phi = 0;
            return;
        }

        this.orbit.theta += theta * delta;
        this.orbit.phi = this._clampOrbitPhi(this.orbit.phi + phi * delta);
        this._updateCamera();

        const decay = Math.exp(-MOMENTUM_DECAY * delta);
        this.spinVelocity.theta *= decay;
        this.spinVelocity.phi *= decay;
    }

    _scheduleAutoSpin(delay = 1800) {
        clearTimeout(this.autoRotateTimer);
        this._autoSpinDelay = delay;
        this._autoSpinArmTime = null;
        this._autoSpinWaitingSettle = true;
    }

    _tickAutoSpinResume() {
        if (
            !this._autoSpinWaitingSettle ||
            this.isDragging ||
            this.orbitCoasting ||
            this.isAnimating ||
            this.sequenceActive
        ) {
            return;
        }

        if (this._autoSpinArmTime === null) {
            this._autoSpinArmTime = performance.now() + this._autoSpinDelay;
        }

        if (performance.now() >= this._autoSpinArmTime) {
            this.autoSpinEnabled = true;
            this._autoSpinWaitingSettle = false;
            this._autoSpinArmTime = null;
        }
    }

    _cancelAutoSpinSchedule() {
        clearTimeout(this.autoRotateTimer);
        this._autoSpinWaitingSettle = false;
        this._autoSpinArmTime = null;
    }

    _setupDragControls() {
        this.autoRotateTimer = null;

        const el = this.renderer.domElement;

        el.addEventListener('pointerdown', (e) => this._handlePointerDown(e));
        el.addEventListener('pointermove', (e) => this._handlePointerMove(e));
        el.addEventListener('pointerup', (e) => this._handlePointerUp(e));
        el.addEventListener('pointercancel', (e) => this._handlePointerUp(e));
        el.addEventListener('lostpointercapture', (e) => this._handlePointerUp(e));
    }

    _handlePointerDown(e) {
        if (e.button !== 0) return;

        e.preventDefault();
        this.renderer.domElement.setPointerCapture(e.pointerId);

        this.isDragging = true;
        this.autoSpinEnabled = false;
        this.orbitCoasting = false;
        this.spinVelocity.theta = 0;
        this.spinVelocity.phi = 0;
        this._velocitySamples.length = 0;
        this._pointer.lastX = e.clientX;
        this._pointer.lastY = e.clientY;
        this.container.classList.add('is-dragging');
        this._cancelAutoSpinSchedule();
    }

    _handlePointerMove(e) {
        if (!this.isDragging) return;

        const dx = e.clientX - this._pointer.lastX;
        const dy = e.clientY - this._pointer.lastY;
        if (!dx && !dy) return;

        this._pointer.lastX = e.clientX;
        this._pointer.lastY = e.clientY;

        this.orbit.theta -= dx * DRAG_ROTATE_SPEED;
        this.orbit.phi = this._clampOrbitPhi(this.orbit.phi + dy * DRAG_ROTATE_SPEED);
        this._updateCamera();

        this._velocitySamples.push({ dx, dy, t: performance.now() });
        if (this._velocitySamples.length > 8) {
            this._velocitySamples.shift();
        }
    }

    _handlePointerUp(e) {
        if (!this.isDragging) return;

        if (this.renderer.domElement.hasPointerCapture(e.pointerId)) {
            this.renderer.domElement.releasePointerCapture(e.pointerId);
        }

        this.isDragging = false;
        this.container.classList.remove('is-dragging');
        this._applyReleaseVelocity();
        this._validateCubeIntegrity();

        if (!this.sequenceActive && !this.isAnimating) {
            this._scheduleAutoSpin();
        }
    }

    _applyReleaseVelocity() {
        const samples = this._velocitySamples;
        if (samples.length < 2) return;

        const newest = samples[samples.length - 1];
        let oldest = samples[0];
        for (let i = samples.length - 2; i >= 0; i -= 1) {
            if (newest.t - samples[i].t <= 90) {
                oldest = samples[i];
            } else {
                break;
            }
        }

        const dt = (newest.t - oldest.t) / 1000;
        if (dt < 0.008) return;

        let sumDx = 0;
        let sumDy = 0;
        for (let i = 1; i < samples.length; i += 1) {
            if (samples[i].t >= oldest.t) {
                sumDx += samples[i].dx;
                sumDy += samples[i].dy;
            }
        }

        this.spinVelocity.theta = this._clampOrbitVelocity(
            -(sumDx / dt) * DRAG_ROTATE_SPEED * 0.02
        );
        this.spinVelocity.phi = this._clampOrbitVelocity(
            (sumDy / dt) * DRAG_ROTATE_SPEED * 0.02
        );
    }

    _validateCubeIntegrity() {
        let needsRepair = false;

        for (const cubelet of this.cubelets) {
            if (!cubelet.parent) {
                needsRepair = true;
                break;
            }

            const { x, y, z } = cubelet.userData;
            if (Math.abs(x) > 1 || Math.abs(y) > 1 || Math.abs(z) > 1) {
                needsRepair = true;
                break;
            }

            const dist = cubelet.position.length();
            if (Math.abs(dist - Math.hypot(x * SPACING, y * SPACING, z * SPACING)) > 0.05) {
                needsRepair = true;
                break;
            }
        }

        if (needsRepair) {
            this._repairCubeStructure();
        }
    }

    _repairCubeStructure() {
        this._activeLayerTween?.kill();
        this._activeLayerTween = null;
        this._safeEmptyPivot(true);

        this.cubeGroup.updateMatrixWorld(true);
        _invParent.copy(this.cubeGroup.matrixWorld).invert();

        for (const cubelet of this.cubelets) {
            if (cubelet.parent !== this.cubeGroup) {
                this.cubeGroup.attach(cubelet);
            }
            this._snapCubelet(cubelet);
        }

        this.cubeGroup.rotation.set(0, 0, 0);
        this.cubeGroup.updateMatrixWorld(true);
        this._rebuildLayerIndex();
    }

    _rebuildLayerIndex() {
        this.layerIndex = {
            x: { '-1': [], 0: [], 1: [] },
            y: { '-1': [], 0: [], 1: [] },
            z: { '-1': [], 0: [], 1: [] },
        };

        for (const cubelet of this.cubelets) {
            const { x, y, z } = cubelet.userData;
            this.layerIndex.x[x].push(cubelet);
            this.layerIndex.y[y].push(cubelet);
            this.layerIndex.z[z].push(cubelet);
        }
    }

    _addStudioLights() {
        this.scene.add(new THREE.AmbientLight(0xffffff, 0.62));
        this.scene.add(new THREE.HemisphereLight(0xffffff, 0x2a2a2a, 0.42));

        const key = new THREE.DirectionalLight(0xffffff, 1.1);
        key.position.set(6, 7, 5);
        this.scene.add(key);

        const fill = new THREE.DirectionalLight(0xffffff, 0.55);
        fill.position.set(-4, 3, 6);
        this.scene.add(fill);
    }

    _buildCube() {
        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                for (let z = -1; z <= 1; z++) {
                    if (x === 0 && y === 0 && z === 0) continue;

                    const mesh = createCubeletMesh(x, y, z, this.envMap);
                    mesh.position.set(x * SPACING, y * SPACING, z * SPACING);
                    mesh.userData = { x, y, z };

                    this.cubeGroup.add(mesh);
                    this.cubelets.push(mesh);
                    this.layerIndex.x[x].push(mesh);
                    this.layerIndex.y[y].push(mesh);
                    this.layerIndex.z[z].push(mesh);
                }
            }
        }
    }

    _getLayerCubelets(layer) {
        const axis = layer[0];
        const val = parseInt(layer.slice(1), 10);
        return this.layerIndex[axis][val] || [];
    }

    _getCubeletsForLayers(layers) {
        const seen = new Set();
        const targets = [];
        for (const layer of layers) {
            for (const cubelet of this._getLayerCubelets(layer)) {
                if (!seen.has(cubelet)) {
                    seen.add(cubelet);
                    targets.push(cubelet);
                }
            }
        }
        return targets;
    }

    _reindexCubelet(cubelet, x, y, z) {
        const prev = cubelet.userData;
        if (prev.x === x && prev.y === y && prev.z === z) return;

        this.layerIndex.x[prev.x].splice(this.layerIndex.x[prev.x].indexOf(cubelet), 1);
        this.layerIndex.y[prev.y].splice(this.layerIndex.y[prev.y].indexOf(cubelet), 1);
        this.layerIndex.z[prev.z].splice(this.layerIndex.z[prev.z].indexOf(cubelet), 1);

        cubelet.userData = { x, y, z };
        this.layerIndex.x[x].push(cubelet);
        this.layerIndex.y[y].push(cubelet);
        this.layerIndex.z[z].push(cubelet);
    }

    _snapCubelet(cubelet) {
        cubelet.getWorldPosition(_worldPos);
        _localPos.copy(_worldPos).applyMatrix4(_invParent);

        const x = THREE.MathUtils.clamp(Math.round(_localPos.x / SPACING), -1, 1);
        const y = THREE.MathUtils.clamp(Math.round(_localPos.y / SPACING), -1, 1);
        const z = THREE.MathUtils.clamp(Math.round(_localPos.z / SPACING), -1, 1);

        this._reindexCubelet(cubelet, x, y, z);
        cubelet.position.set(x * SPACING, y * SPACING, z * SPACING);

        _euler.setFromQuaternion(cubelet.quaternion, 'XYZ');
        cubelet.rotation.set(
            snapAngle(_euler.x),
            snapAngle(_euler.y),
            snapAngle(_euler.z)
        );
        cubelet.updateMatrix();
    }

    _safeEmptyPivot(snapCubelets = false) {
        if (!this.activePivot) return;

        const stranded = [...this.activePivot.children];
        if (stranded.length) {
            this.activePivot.updateMatrixWorld(true);
            this.cubeGroup.updateMatrixWorld(true);
            _invParent.copy(this.cubeGroup.matrixWorld).invert();

            for (const cubelet of stranded) {
                this.cubeGroup.attach(cubelet);
                if (snapCubelets) {
                    this._snapCubelet(cubelet);
                }
            }
        }

        this.activePivot.rotation.set(0, 0, 0);
        if (this.activePivot.parent) {
            this.activePivot.parent.remove(this.activePivot);
        }
    }

    _getPivot() {
        if (!this.activePivot) {
            this.activePivot = new THREE.Group();
            this.activePivot.name = 'layer-pivot';
        }

        this._safeEmptyPivot(false);
        this.activePivot.rotation.set(0, 0, 0);

        if (!this.activePivot.parent) {
            this.cubeGroup.add(this.activePivot);
        }

        return this.activePivot;
    }

    _releasePivot() {
        this._safeEmptyPivot(false);
    }

    _finalizeLayerRotation(targets) {
        if (!this.activePivot) return;

        this.activePivot.updateMatrixWorld(true);
        this.cubeGroup.updateMatrixWorld(true);
        _invParent.copy(this.cubeGroup.matrixWorld).invert();

        for (const cubelet of targets) {
            this.cubeGroup.attach(cubelet);
            this._snapCubelet(cubelet);
        }

        this._releasePivot();
    }

    async _ensureSolver() {
        if (!this.solverApi) {
            this.solverApi = await loadSolverModule();
        }
        return this.solverApi;
    }

    _applyLogicalMove(move) {
        this.logicalCube?.move(toSolverMove(move));
    }

    _rotateLayer(move, duration = SCRAMBLE_MOVE_DURATION, ease = MOVE_EASE) {
        const parsed = parseMove(move);
        if (!parsed) {
            console.warn('Skipping unsupported cube move:', move);
            return Promise.resolve();
        }

        const { dir, layers, axisKey } = parsed;
        const targets = this._getCubeletsForLayers(layers);
        if (!targets.length) return Promise.resolve();

        const angle = HALF_PI * dir;

        const pivot = this._getPivot();
        this.cubeGroup.updateMatrixWorld(true);

        for (const cubelet of targets) {
            pivot.attach(cubelet);
        }

        return new Promise((resolve) => {
            this._activeLayerTween?.kill();

            this._activeLayerTween = gsap.to(pivot.rotation, {
                [axisKey]: angle,
                duration,
                ease,
                overwrite: true,
                onComplete: () => {
                    pivot.rotation[axisKey] = angle;
                    this._activeLayerTween = null;
                    requestAnimationFrame(() => {
                        this._finalizeLayerRotation(targets);
                        resolve();
                    });
                },
            });
        });
    }

    async _executeMoves(moves, speed = SCRAMBLE_MOVE_DURATION, ease = MOVE_EASE) {
        if (!moves.length) return;

        this.isAnimating = true;
        for (const move of moves) {
            await this._rotateLayer(move, speed, ease);
            this._applyLogicalMove(move);
            if (MOVE_SETTLE > 0) {
                await this._wait(MOVE_SETTLE * 1000);
            }
        }
        this.isAnimating = false;
        this._validateCubeIntegrity();
    }

    scramble(count = 22) {
        const moves = [];
        let lastFace = '';
        for (let i = 0; i < count; i++) {
            let move;
            do {
                move = SCRAMBLE_MOVES[Math.floor(Math.random() * SCRAMBLE_MOVES.length)];
            } while (move[0] === lastFace);
            lastFace = move[0];
            moves.push(move);
        }
        return moves;
    }

    _fadeShuffleButton(visible) {
        if (!this.shuffleBtn) return Promise.resolve();

        return new Promise((resolve) => {
            gsap.to(this.shuffleBtn, {
                opacity: visible ? 1 : 0,
                duration: 0.35,
                ease: 'power2.inOut',
                onComplete: () => {
                    this.shuffleBtn.style.pointerEvents = visible ? '' : 'none';
                    resolve();
                },
            });
        });
    }

    _setupShuffleButton() {
        if (!this.shuffleBtn) return;

        gsap.set(this.shuffleBtn, { opacity: 1 });

        this.shuffleBtn.addEventListener('click', () => this._runShuffleSequence());
    }

    async _runShuffleSequence() {
        if (this.sequenceActive || this.isAnimating) return;

        this.sequenceActive = true;
        this.shuffleBtn.disabled = true;
        this.autoSpinEnabled = false;
        this.spinVelocity.theta = 0;
        this.spinVelocity.phi = 0;
        this._cancelAutoSpinSchedule();
        this._validateCubeIntegrity();

        try {
            const { RubiksCube, solveCube } = await this._ensureSolver();
            this.logicalCube = RubiksCube.Solved();

            const scramble = this.scramble(16 + Math.floor(Math.random() * 8));
            await this._executeMoves(scramble, SCRAMBLE_MOVE_DURATION, MOVE_EASE);

            const solveMoves = parseSolverSolution(solveCube(this.logicalCube.toString()));
            await this._wait(2000);

            await this._fadeShuffleButton(false);
            await this._executeMoves(solveMoves, SOLVE_MOVE_DURATION, MOVE_EASE);
            this.logicalCube = RubiksCube.Solved();
            await this._fadeShuffleButton(true);
        } catch (error) {
            console.error('Cube shuffle/solve failed:', error);
            await this._fadeShuffleButton(true);
        } finally {
            this.shuffleBtn.disabled = false;
            this.sequenceActive = false;

            if (!this.isDragging) {
                this._scheduleAutoSpin(1600);
            }
        }
    }

    _wait(ms) {
        return new Promise((r) => setTimeout(r, ms));
    }

    _setupVisibility() {
        if (typeof IntersectionObserver === 'undefined') return;

        this._visibilityObserver = new IntersectionObserver(
            ([entry]) => {
                this.isVisible = entry.isIntersecting;
            },
            { threshold: 0.08 }
        );
        this._visibilityObserver.observe(this.container);
    }

    _setupResize() {
        const onResize = () => {
            const w = this.container.clientWidth;
            const h = this.container.clientHeight;
            if (!w || !h) return;
            this.camera.aspect = w / h;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(w, h);
        };
        window.addEventListener('resize', onResize);
        if (typeof ResizeObserver !== 'undefined') {
            new ResizeObserver(onResize).observe(this.container);
        }
    }
}
