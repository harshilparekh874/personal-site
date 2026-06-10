import { createNoise3D } from 'simplex-noise';

const TAU = Math.PI * 2;
const PARTICLE_PROP_COUNT = 9;

export function initVortex(containerEl, options = {}) {
    const container = typeof containerEl === 'string'
        ? document.getElementById(containerEl)
        : containerEl;
    if (!container) return null;

    const config = {
        particleCount: options.particleCount ?? 650,
        rangeY: options.rangeY ?? 120,
        baseTTL: 50,
        rangeTTL: 150,
        baseSpeed: options.baseSpeed ?? 0,
        rangeSpeed: options.rangeSpeed ?? 1.4,
        baseRadius: options.baseRadius ?? 1,
        rangeRadius: options.rangeRadius ?? 2,
        baseHue: options.baseHue ?? 142,
        rangeHue: options.rangeHue ?? 38,
        saturation: options.saturation ?? 72,
        lightness: options.lightness ?? 36,
        noiseSteps: 3,
        xOff: 0.00125,
        yOff: 0.00125,
        zOff: 0.0005,
        backgroundColor: options.backgroundColor ?? '#000000',
    };

    const canvas = document.createElement('canvas');
    canvas.className = 'vortex-canvas';
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    const noise3D = createNoise3D();

    let tick = 0;
    let animationId = null;
    let isVisible = true;
    const center = [0, 0];
    const particlePropsLength = config.particleCount * PARTICLE_PROP_COUNT;
    let particleProps = new Float32Array(particlePropsLength);

    const rand = (n) => n * Math.random();
    const randRange = (n) => n - rand(2 * n);
    const fadeInOut = (t, m) => {
        const hm = 0.5 * m;
        return Math.abs(((t + hm) % m) - hm) / hm;
    };
    const lerp = (n1, n2, speed) => (1 - speed) * n1 + speed * n2;

    const resize = () => {
        const { width, height } = container.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio, 2);
        canvas.width = Math.max(1, Math.floor(width * dpr));
        canvas.height = Math.max(1, Math.floor(height * dpr));
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        center[0] = width * 0.5;
        center[1] = height * 0.5;
    };

    const initParticle = (i) => {
        const w = canvas.width / Math.min(window.devicePixelRatio, 2);
        const x = rand(w);
        const y = center[1] + randRange(config.rangeY);
        const ttl = config.baseTTL + rand(config.rangeTTL);
        particleProps.set([
            x,
            y,
            0,
            0,
            0,
            ttl,
            config.baseSpeed + rand(config.rangeSpeed),
            config.baseRadius + rand(config.rangeRadius),
            config.baseHue + rand(config.rangeHue),
        ], i);
    };

    const initParticles = () => {
        tick = 0;
        particleProps = new Float32Array(particlePropsLength);
        for (let i = 0; i < particlePropsLength; i += PARTICLE_PROP_COUNT) {
            initParticle(i);
        }
    };

    const checkBounds = (x, y) => {
        const w = canvas.width / Math.min(window.devicePixelRatio, 2);
        const h = canvas.height / Math.min(window.devicePixelRatio, 2);
        return x > w || x < 0 || y > h || y < 0;
    };

    const drawParticle = (x, y, x2, y2, life, ttl, radius, hue) => {
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineWidth = radius;
        ctx.strokeStyle = `hsla(${hue}, ${config.saturation}%, ${config.lightness}%, ${fadeInOut(life, ttl)})`;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.restore();
    };

    const updateParticle = (i) => {
        let x = particleProps[i];
        let y = particleProps[i + 1];
        const n = noise3D(x * config.xOff, y * config.yOff, tick * config.zOff) * config.noiseSteps * TAU;
        const vx = lerp(particleProps[i + 2], Math.cos(n), 0.5);
        const vy = lerp(particleProps[i + 3], Math.sin(n), 0.5);
        let life = particleProps[i + 4];
        const ttl = particleProps[i + 5];
        const speed = particleProps[i + 6];
        const x2 = x + vx * speed;
        const y2 = y + vy * speed;
        const radius = particleProps[i + 7];
        const hue = particleProps[i + 8];

        drawParticle(x, y, x2, y2, life, ttl, radius, hue);

        life += 1;
        particleProps[i] = x2;
        particleProps[i + 1] = y2;
        particleProps[i + 2] = vx;
        particleProps[i + 3] = vy;
        particleProps[i + 4] = life;

        if (checkBounds(x2, y2) || life > ttl) {
            initParticle(i);
        }
    };

    const renderGlow = () => {
        ctx.save();
        ctx.filter = 'blur(8px) brightness(180%)';
        ctx.globalCompositeOperation = 'lighter';
        ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height);
        ctx.restore();

        ctx.save();
        ctx.filter = 'blur(4px) brightness(180%)';
        ctx.globalCompositeOperation = 'lighter';
        ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height);
        ctx.restore();
    };

    const renderToScreen = () => {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height);
        ctx.restore();
    };

    const draw = () => {
        if (!isVisible) {
            animationId = requestAnimationFrame(draw);
            return;
        }

        tick += 1;
        const w = canvas.width / Math.min(window.devicePixelRatio, 2);
        const h = canvas.height / Math.min(window.devicePixelRatio, 2);

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = config.backgroundColor;
        ctx.fillRect(0, 0, w, h);

        for (let i = 0; i < particlePropsLength; i += PARTICLE_PROP_COUNT) {
            updateParticle(i);
        }

        renderGlow();
        renderToScreen();

        animationId = requestAnimationFrame(draw);
    };

    const observer = typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(([entry]) => {
            isVisible = entry.isIntersecting;
        }, { threshold: 0.05 })
        : null;

    observer?.observe(container);

    const onResize = () => {
        resize();
        initParticles();
    };

    resize();
    initParticles();
    draw();

    window.addEventListener('resize', onResize);
    if (typeof ResizeObserver !== 'undefined') {
        new ResizeObserver(onResize).observe(container);
    }

    return {
        destroy() {
            cancelAnimationFrame(animationId);
            window.removeEventListener('resize', onResize);
            observer?.disconnect();
            canvas.remove();
        },
    };
}
