import gsap from 'gsap';

const SHARED = {
    translateY: -350,
    width: 560,
    height: 1380,
    smallWidth: 240,
    duration: 7,
    xOffset: 100,
};

const DARK_GRADIENTS = {
    gradientFirst:
        'radial-gradient(68.54% 68.72% at 55.02% 31.46%, hsla(210, 100%, 90%, .22) 0, hsla(210, 100%, 62%, .09) 50%, hsla(210, 100%, 50%, 0) 80%)',
    gradientSecond:
        'radial-gradient(50% 50% at 50% 50%, hsla(210, 100%, 88%, .16) 0, hsla(210, 100%, 58%, .06) 80%, transparent 100%)',
    gradientThird:
        'radial-gradient(50% 50% at 50% 50%, hsla(210, 100%, 86%, .12) 0, hsla(210, 100%, 52%, .06) 80%, transparent 100%)',
};

const LIGHT_GRADIENTS = {
    gradientFirst:
        'radial-gradient(68.54% 68.72% at 55.02% 31.46%, hsla(272, 95%, 52%, .15) 0, hsla(265, 92%, 42%, .06) 50%, hsla(278, 85%, 35%, 0) 80%)',
    gradientSecond:
        'radial-gradient(50% 50% at 50% 50%, hsla(278, 92%, 48%, .11) 0, hsla(268, 88%, 38%, .05) 80%, transparent 100%)',
    gradientThird:
        'radial-gradient(50% 50% at 50% 50%, hsla(284, 90%, 46%, .08) 0, hsla(270, 85%, 36%, .045) 80%, transparent 100%)',
};

function getThemeGradients(theme = document.documentElement.getAttribute('data-theme')) {
    return theme === 'light' ? LIGHT_GRADIENTS : DARK_GRADIENTS;
}

function getConfig(theme) {
    return { ...SHARED, ...getThemeGradients(theme) };
}
function scaleConfig(base, viewportWidth) {
    const scale = Math.max(Math.min(viewportWidth / 1280, 1.35), 0.55);
    return {
        translateY: Math.round(base.translateY * scale),
        width: Math.round(base.width * scale),
        height: Math.round(base.height * scale),
        smallWidth: Math.round(base.smallWidth * scale),
        xOffset: Math.round(base.xOffset * scale),
    };
}

function createBeam(side, index, gradient, transform, size, origin) {
    const beam = document.createElement('div');
    beam.className = `spotlight-beam spotlight-beam--${side} spotlight-beam--${index}`;
    beam.style.background = gradient;
    beam.style.width = `${size.width}px`;
    beam.style.height = `${size.height}px`;
    beam.style.transform = transform;
    if (origin) beam.style.transformOrigin = origin;
    return beam;
}

function buildSide(side, config, size) {
    const group = document.createElement('div');
    group.className = `spotlight-side spotlight-side--${side}`;

    const rotate = side === 'left' ? -45 : 45;
    const anchor = side === 'left' ? 'left' : 'right';

    group.appendChild(
        createBeam(
            side,
            'main',
            config.gradientFirst,
            `translateY(${size.translateY}px) rotate(${rotate}deg)`,
            { width: size.width, height: size.height }
        )
    );

    group.appendChild(
        createBeam(
            side,
            'secondary',
            config.gradientSecond,
            side === 'left'
                ? 'rotate(-45deg) translate(5%, -50%)'
                : 'rotate(45deg) translate(-5%, -50%)',
            { width: size.smallWidth, height: size.height },
            side === 'left' ? 'top left' : 'top right'
        )
    );

    const tertiaryTranslate =
        side === 'left' ? 'rotate(-45deg) translate(-180%, -70%)' : 'rotate(45deg) translate(180%, -70%)';

    group.appendChild(
        createBeam(
            side,
            'tertiary',
            config.gradientThird,
            tertiaryTranslate,
            { width: size.smallWidth, height: size.height },
            side === 'left' ? 'top left' : 'top right'
        )
    );

    group.style[anchor] = '0';
    return group;
}

function applySpotlightTheme(root, theme) {
    const gradients = getThemeGradients(theme);
    root.dataset.theme = theme;

    root.querySelectorAll('.spotlight-beam--main').forEach((beam) => {
        beam.style.background = gradients.gradientFirst;
    });
    root.querySelectorAll('.spotlight-beam--secondary').forEach((beam) => {
        beam.style.background = gradients.gradientSecond;
    });
    root.querySelectorAll('.spotlight-beam--tertiary').forEach((beam) => {
        beam.style.background = gradients.gradientThird;
    });
}

export function initSpotlight(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return null;

    const theme = document.documentElement.getAttribute('data-theme') || 'dark';
    const config = { ...getConfig(theme), ...options };
    const root = document.createElement('div');
    root.className = 'spotlight-root';
    root.dataset.theme = theme;

    const left = buildSide('left', config, scaleConfig(config, window.innerWidth));
    const right = buildSide('right', config, scaleConfig(config, window.innerWidth));

    root.appendChild(left);
    root.appendChild(right);
    container.appendChild(root);

    gsap.set(root, { opacity: 0 });
    gsap.to(root, { opacity: 1, duration: 1.5, ease: 'power2.out' });

    const animateSide = (el, direction) => {
        gsap.fromTo(
            el,
            { x: 0 },
            {
                x: direction * config.xOffset,
                duration: config.duration,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut',
            }
        );
    };

    animateSide(left, 1);
    animateSide(right, -1);

    const onResize = () => {
        const size = scaleConfig(config, window.innerWidth);
        root.querySelectorAll('.spotlight-beam--main').forEach((beam) => {
            beam.style.width = `${size.width}px`;
            beam.style.height = `${size.height}px`;
            const isLeft = beam.classList.contains('spotlight-beam--left');
            const rotate = isLeft ? -45 : 45;
            beam.style.transform = `translateY(${size.translateY}px) rotate(${rotate}deg)`;
        });
        root.querySelectorAll('.spotlight-beam--secondary, .spotlight-beam--tertiary').forEach((beam) => {
            beam.style.width = `${size.smallWidth}px`;
            beam.style.height = `${size.height}px`;
        });
    };

    window.addEventListener('resize', onResize);

    const onThemeChange = (event) => {
        applySpotlightTheme(root, event.detail?.theme || 'dark');
    };

    window.addEventListener('themechange', onThemeChange);

    return {
        destroy: () => {
            window.removeEventListener('resize', onResize);
            window.removeEventListener('themechange', onThemeChange);
        },
    };
}
