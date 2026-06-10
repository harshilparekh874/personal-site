import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import gsap from 'gsap';

const CUBELET_SIZE = 0.95;
const CUBELET_GAP = 0.03;
const SPACING = CUBELET_SIZE + CUBELET_GAP;
const HALF_PI = Math.PI / 2;
const DEFAULT_CAMERA_POSITION = new THREE.Vector3(5.6, 4.5, 6.94);

const MOVE_FACES = {
    R: 'x1', L: 'x-1', U: 'y1', D: 'y-1', F: 'z1', B: 'z-1',
};

const MOVE_DIRS = {
    R: -1, L: 1, U: -1, D: 1, F: -1, B: 1,
};

const ALL_MOVES = ['R', "R'", 'L', "L'", 'U', "U'", 'D', "D'", 'F', "F'", 'B', "B'"];

const _worldPos = new THREE.Vector3();
const _localPos = new THREE.Vector3();
const _invParent = new THREE.Matrix4();
const _euler = new THREE.Euler();

function parseMove(move) {
    const prime = move.endsWith("'");
    const face = prime ? move.slice(0, -1) : move;
    const dir = MOVE_DIRS[face] * (prime ? -1 : 1);
    return { face, dir, layer: MOVE_FACES[face] };
}

function axisKeyForLayer(layer) {
    return layer[0];
}

function createShinyMaterial() {
    return new THREE.MeshPhysicalMaterial({
        color: 0x1c1c1c,
        metalness: 0.55,
        roughness: 0.18,
        clearcoat: 1.0,
        clearcoatRoughness: 0.04,
        envMapIntensity: 2.8,
        specularIntensity: 1.0,
        specularColor: new THREE.Color(0xffffff),
        sheen: 0.25,
        sheenRoughness: 0.3,
        sheenColor: new THREE.Color(0x888888),
    });
}

function createCubeletMesh(material) {
    const geometry = new THREE.BoxGeometry(CUBELET_SIZE, CUBELET_SIZE, CUBELET_SIZE);
    const mesh = new THREE.Mesh(geometry, material.clone());
    const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(geometry),
        new THREE.LineBasicMaterial({ color: 0x3a3a3a, transparent: true, opacity: 0.45 })
    );
    mesh.add(edges);
    return mesh;
}

function snapAngle(angle) {
    return Math.round(angle / HALF_PI) * HALF_PI;
}

export class RubikCube {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.cubelets = [];
        this.isAnimating = false;
        this.moveQueue = [];

        this._initScene();
        this._buildCube();
        this._setupResize();
        this._startSolveCycle();

        this._animate();
    }

    _initScene() {
        const { clientWidth, clientHeight } = this.container;

        this.scene = new THREE.Scene();
        this.scene.background = null;

        this.camera = new THREE.PerspectiveCamera(42, clientWidth / clientHeight, 0.1, 100);
        this.camera.position.copy(DEFAULT_CAMERA_POSITION);
        this.camera.lookAt(0, 0, 0);

        this.defaultDistance = DEFAULT_CAMERA_POSITION.length();

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(clientWidth, clientHeight);
        this.renderer.setClearColor(0x000000, 0);
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.45;
        this.container.appendChild(this.renderer.domElement);

        this.idleGroup = new THREE.Group();
        this.cubeGroup = new THREE.Group();
        this.idleGroup.add(this.cubeGroup);
        this.scene.add(this.idleGroup);

        const pmrem = new THREE.PMREMGenerator(this.renderer);
        this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.18).texture;
        pmrem.dispose();

        this._addStudioLights();
        this._setupControls();
    }

    _setupControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.target.set(0, 0, 0);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.06;
        this.controls.enablePan = false;
        this.controls.enableZoom = false;
        this.controls.rotateSpeed = 0.75;
        this.controls.minDistance = this.defaultDistance;
        this.controls.maxDistance = this.defaultDistance;
        this.controls.autoRotate = true;
        this.controls.autoRotateSpeed = 0.55;

        this.autoRotateTimer = null;

        this.controls.addEventListener('start', () => {
            this.controls.autoRotate = false;
            this.container.classList.add('is-dragging');
            clearTimeout(this.autoRotateTimer);
        });

        this.controls.addEventListener('end', () => {
            this.container.classList.remove('is-dragging');
            clearTimeout(this.autoRotateTimer);
            this.autoRotateTimer = setTimeout(() => {
                this.controls.autoRotate = true;
            }, 2200);
        });
    }

    _addStudioLights() {
        this.scene.add(new THREE.HemisphereLight(0xffffff, 0x2a2a2a, 0.65));

        const positions = [
            [6, 7, 5, 1.6],
            [-5, 4, 6, 1.0],
            [4, -4, 5, 0.85],
            [-4, 5, -4, 0.9],
            [0, 8, 0, 0.7],
            [0, -6, 2, 0.5],
        ];

        positions.forEach(([x, y, z, intensity]) => {
            const light = new THREE.DirectionalLight(0xffffff, intensity);
            light.position.set(x, y, z);
            this.scene.add(light);
        });
    }

    _buildCube() {
        const material = createShinyMaterial();

        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                for (let z = -1; z <= 1; z++) {
                    if (x === 0 && y === 0 && z === 0) continue;

                    const mesh = createCubeletMesh(material);
                    mesh.position.set(x * SPACING, y * SPACING, z * SPACING);
                    mesh.userData = { x, y, z };

                    this.cubeGroup.add(mesh);
                    this.cubelets.push(mesh);
                }
            }
        }
    }

    _getLayerCubelets(layer) {
        const axis = layer[0];
        const val = parseInt(layer.slice(1), 10);
        return this.cubelets.filter((c) => c.userData[axis] === val);
    }

    _snapCubelet(cubelet) {
        this.cubeGroup.updateMatrixWorld(true);
        _invParent.copy(this.cubeGroup.matrixWorld).invert();

        cubelet.getWorldPosition(_worldPos);
        _localPos.copy(_worldPos).applyMatrix4(_invParent);

        const x = Math.round(_localPos.x / SPACING);
        const y = Math.round(_localPos.y / SPACING);
        const z = Math.round(_localPos.z / SPACING);

        cubelet.userData = { x, y, z };
        cubelet.position.set(x * SPACING, y * SPACING, z * SPACING);

        _euler.setFromQuaternion(cubelet.quaternion, 'XYZ');
        cubelet.rotation.set(
            snapAngle(_euler.x),
            snapAngle(_euler.y),
            snapAngle(_euler.z)
        );
        cubelet.updateMatrix();
    }

    _finalizeLayerRotation(pivot, targets) {
        pivot.updateMatrixWorld(true);
        this.cubeGroup.updateMatrixWorld(true);

        targets.forEach((cubelet) => {
            this.cubeGroup.attach(cubelet);
            this._snapCubelet(cubelet);
        });

        pivot.clear();
        this.cubeGroup.remove(pivot);
        pivot.rotation.set(0, 0, 0);
    }

    _rotateLayer(move, duration = 0.36) {
        const { dir, layer } = parseMove(move);
        const targets = this._getLayerCubelets(layer);
        if (!targets.length) return Promise.resolve();

        const axisKey = axisKeyForLayer(layer);
        const angle = HALF_PI * dir;

        const pivot = new THREE.Group();
        pivot.rotation.set(0, 0, 0);
        this.cubeGroup.add(pivot);
        this.cubeGroup.updateMatrixWorld(true);

        targets.forEach((cubelet) => {
            pivot.attach(cubelet);
        });

        return new Promise((resolve) => {
            gsap.to(pivot.rotation, {
                [axisKey]: angle,
                duration,
                ease: 'power2.inOut',
                onComplete: () => {
                    pivot.rotation[axisKey] = angle;
                    this._finalizeLayerRotation(pivot, targets);
                    resolve();
                },
            });
        });
    }

    async _executeMoves(moves, speed = 0.34) {
        this.isAnimating = true;
        for (const move of moves) {
            await this._rotateLayer(move, speed);
        }
        this.isAnimating = false;
        this._drainQueue();
    }

    _drainQueue() {
        if (this.isAnimating || !this.moveQueue.length) return;
        const batch = this.moveQueue.splice(0);
        this._executeMoves(batch);
    }

    scramble(count = 20) {
        const moves = [];
        let lastFace = '';
        for (let i = 0; i < count; i++) {
            let move;
            do {
                move = ALL_MOVES[Math.floor(Math.random() * ALL_MOVES.length)];
            } while (move[0] === lastFace);
            lastFace = move[0];
            moves.push(move);
        }
        return moves;
    }

    invertMoves(moves) {
        return [...moves].reverse().map((m) => (m.endsWith("'") ? m[0] : `${m[0]}'`));
    }

    _startSolveCycle() {
        const runCycle = async () => {
            await this._wait(2800);
            const scramble = this.scramble(18);
            await this._executeMoves(scramble, 0.3);
            await this._wait(600);
            await this._executeMoves(this.invertMoves(scramble), 0.26);
            runCycle();
        };
        runCycle();
    }

    _wait(ms) {
        return new Promise((r) => setTimeout(r, ms));
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

    _animate() {
        requestAnimationFrame(() => this._animate());

        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}
