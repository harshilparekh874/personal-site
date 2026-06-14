import { applyTheme, getStoredTheme } from './theme.js';

const SUN_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`;

const MOON_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`;

function getCurrentTheme() {
    return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

function polygonCollapsed(cx, cy, vertexCount) {
    const pairs = Array.from({ length: vertexCount }, () => `${cx}px ${cy}px`).join(', ');
    return `polygon(${pairs})`;
}

function getThemeTransitionClipPaths(variant, cx, cy, maxRadius, viewportWidth, viewportHeight) {
    switch (variant) {
        case 'square': {
            const halfW = Math.max(cx, viewportWidth - cx);
            const halfH = Math.max(cy, viewportHeight - cy);
            const halfSide = Math.max(halfW, halfH) * 1.05;
            const end = [
                `${cx - halfSide}px ${cy - halfSide}px`,
                `${cx + halfSide}px ${cy - halfSide}px`,
                `${cx + halfSide}px ${cy + halfSide}px`,
                `${cx - halfSide}px ${cy + halfSide}px`,
            ].join(', ');
            return [polygonCollapsed(cx, cy, 4), `polygon(${end})`];
        }
        default:
            return [
                `circle(0px at ${cx}px ${cy}px)`,
                `circle(${maxRadius}px at ${cx}px ${cy}px)`,
            ];
    }
}

function updateButtonIcon(button) {
    const isDark = getCurrentTheme() === 'dark';
    button.innerHTML = `${isDark ? SUN_ICON : MOON_ICON}<span class="sr-only">Toggle theme</span>`;
    button.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
}

const DEFAULT_DURATION = 850;
const DEFAULT_EASING = 'cubic-bezier(0.16, 1, 0.3, 1)';

function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function toggleTheme(
    button,
    {
        duration = DEFAULT_DURATION,
        easing = DEFAULT_EASING,
        variant = 'circle',
        fromCenter = false,
    } = {}
) {
    const viewportWidth = window.visualViewport?.width ?? window.innerWidth;
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight;

    let x;
    let y;

    if (fromCenter) {
        x = viewportWidth / 2;
        y = viewportHeight / 2;
    } else {
        const rect = button.getBoundingClientRect();
        x = rect.left + rect.width / 2;
        y = rect.top + rect.height / 2;
    }

    const maxRadius =
        Math.hypot(Math.max(x, viewportWidth - x), Math.max(y, viewportHeight - y)) * 1.02;

    const nextTheme = getCurrentTheme() === 'dark' ? 'light' : 'dark';
    const motionDuration = prefersReducedMotion() ? 1 : duration;

    const applyNextTheme = () => {
        applyTheme(nextTheme);
        updateButtonIcon(button);
    };

    if (typeof document.startViewTransition !== 'function') {
        applyNextTheme();
        return;
    }

    const clipPath = getThemeTransitionClipPaths(
        variant,
        x,
        y,
        maxRadius,
        viewportWidth,
        viewportHeight
    );

    const root = document.documentElement;
    root.dataset.magicuiThemeVt = 'active';
    root.style.setProperty('--magicui-theme-toggle-vt-duration', `${motionDuration}ms`);
    root.style.setProperty('--magicui-theme-toggle-vt-easing', easing);
    root.style.setProperty('--magicui-theme-vt-clip-from', clipPath[0]);

    const cleanup = () => {
        delete root.dataset.magicuiThemeVt;
        root.style.removeProperty('--magicui-theme-toggle-vt-duration');
        root.style.removeProperty('--magicui-theme-toggle-vt-easing');
        root.style.removeProperty('--magicui-theme-vt-clip-from');
    };

    const transition = document.startViewTransition(applyNextTheme);

    if (transition?.finished?.finally) {
        transition.finished.finally(cleanup);
    } else {
        cleanup();
    }

    transition?.ready?.then?.(() => {
        document.documentElement.animate(
            { clipPath },
            {
                duration: motionDuration,
                easing,
                fill: 'forwards',
                pseudoElement: '::view-transition-new(root)',
            }
        );
    });
}

export function initAnimatedThemeToggler(
    selector = '#animated-theme-toggler',
    options = {}
) {
    const button = document.querySelector(selector);
    if (!button || button.dataset.themeTogglerInit === 'true') return;

    button.dataset.themeTogglerInit = 'true';
    button.type = 'button';
    button.classList.add('animated-theme-toggler');
    updateButtonIcon(button);

    button.addEventListener('click', () => toggleTheme(button, options));

    window.addEventListener('themechange', () => updateButtonIcon(button));
}

export function initThemeSystem() {
    applyTheme(getStoredTheme());
    initAnimatedThemeToggler('#animated-theme-toggler', {
        duration: DEFAULT_DURATION,
        easing: DEFAULT_EASING,
    });
}
