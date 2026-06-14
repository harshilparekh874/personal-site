const DEFAULT_SCENE =
    'https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode';

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

function forwardPointerMoves(root, canvas) {
    root.addEventListener('pointermove', (event) => {
        if (event.target === canvas) return;

        canvas.dispatchEvent(
            new PointerEvent('pointermove', {
                bubbles: true,
                clientX: event.clientX,
                clientY: event.clientY,
                pointerId: event.pointerId,
                pointerType: event.pointerType,
            })
        );
    });
}

async function loadScene(root, canvas, loader, sceneUrl) {
    try {
        const { Application } = await import('@splinetool/runtime');
        const app = new Application(canvas);
        await app.load(sceneUrl);
        app.setZoom(1.45);
        hideLoader(loader);
        forwardPointerMoves(root, canvas);
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

    const root = container.querySelector('.spline-scene');
    const canvas = container.querySelector('.spline-scene__canvas');
    const loader = container.querySelector('.spline-scene__loader');

    let started = false;

    const start = () => {
        if (started) return;
        started = true;
        loadScene(root, canvas, loader, sceneUrl);
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
