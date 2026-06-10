import gsap from 'gsap';

const DEFAULTS = {
    gradientFirst:
        'radial-gradient(68.54% 68.72% at 55.02% 31.46%, hsla(210, 100%, 85%, .08) 0, hsla(210, 100%, 55%, .02) 50%, hsla(210, 100%, 45%, 0) 80%)',
    gradientSecond:
        'radial-gradient(50% 50% at 50% 50%, hsla(210, 100%, 85%, .06) 0, hsla(210, 100%, 55%, .02) 80%, transparent 100%)',
    gradientThird:
        'radial-gradient(50% 50% at 50% 50%, hsla(210, 100%, 85%, .04) 0, hsla(210, 100%, 45%, .02) 80%, transparent 100%)',
    translateY: -350,
    width: 560,
    height: 1380,
    smallWidth: 240,
    duration: 7,
    xOffset: 100,
};

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

export function initSpotlight(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return null;

    const config = { ...DEFAULTS, ...options };
    const root = document.createElement('div');
    root.className = 'spotlight-root';

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

    return { destroy: () => window.removeEventListener('resize', onResize) };
}
