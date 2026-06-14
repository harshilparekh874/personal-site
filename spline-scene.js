const DEFAULT_SCENE =
    'https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode';

const BODY_LOCK_NAMES = ['Bot', 'Top part'];

function createMarkup() {
    return `
        <div class="spline-scene">
            <div class="spline-scene__loader" aria-live="polite" aria-busy="true">
                <span class="spline-scene__loader-dot"></span>
            </div>
            <canvas class="spline-scene__canvas" aria-label="Interactive 3D robot"></canvas>
        </div>
    `;
}

function hideLoader(loader) {
    loader.setAttribute('aria-busy', 'false');
    loader.classList.add('is-hidden');
}

function fitContactSceneHeight(scene) {
    const width = scene.clientWidth;
    if (!width) return;

    const isDesktop = window.innerWidth >= 900;
    const height = Math.min(
        Math.round(width * (isDesktop ? 0.53 : 0.58)),
        isDesktop ? 320 : 280
    );

    scene.style.setProperty('--spline-scene-height', `${height}px`);
}

function lockBodyLookAt(app) {
    const locked = BODY_LOCK_NAMES.map((name) => app.findObjectByName(name))
        .filter(Boolean)
        .map((obj) => ({
            obj,
            rotation: {
                x: obj.rotation.x,
                y: obj.rotation.y,
                z: obj.rotation.z,
            },
        }));

    if (!locked.length) return;

    app.addEventListener('rendered', () => {
        for (const { obj, rotation } of locked) {
            obj.rotation.x = rotation.x;
            obj.rotation.y = rotation.y;
            obj.rotation.z = rotation.z;
        }
    });
}

async function loadScene(canvas, loader, sceneUrl) {
    try {
        const { Application } = await import('@splinetool/runtime');
        const app = new Application(canvas);
        await app.load(sceneUrl);
        app.setZoom(window.innerWidth >= 900 ? 2.85 : 2.55);
        app.setGlobalEvents(true);
        lockBodyLookAt(app);

        const scene = canvas.closest('.spline-scene');
        if (scene) {
            fitContactSceneHeight(scene);
        }

        hideLoader(loader);
    } catch (error) {
        console.error('Spline scene failed to load:', error);
        loader.textContent = '3D preview unavailable';
        loader.setAttribute('aria-busy', 'false');
    }
}

export function initSplineScene(
    containerSelector = '#contact-spline',
    sceneUrl = DEFAULT_SCENE
) {
    const container = document.querySelector(containerSelector);
    if (!container || container.dataset.splineInit === 'true') return;

    container.dataset.splineInit = 'true';
    container.innerHTML = createMarkup();

    const canvas = container.querySelector('.spline-scene__canvas');
    const loader = container.querySelector('.spline-scene__loader');
    const scene = container.querySelector('.spline-scene');

    if (scene) {
        fitContactSceneHeight(scene);
        window.addEventListener('resize', () => fitContactSceneHeight(scene));
    }

    let started = false;

    const start = () => {
        if (started) return;
        started = true;
        loadScene(canvas, loader, sceneUrl);
    };

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((entry) => entry.isIntersecting)) {
                    start();
                    observer.disconnect();
                }
            },
            { rootMargin: '160px' }
        );

        observer.observe(container);
    } else {
        start();
    }
}
