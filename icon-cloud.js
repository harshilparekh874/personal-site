function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}

const skillImages = import.meta.glob('./assets/skills/*.png', {
    eager: true,
    import: 'default',
});

function localSkillImage(filename) {
    return skillImages[`./assets/skills/${filename}`];
}

function fibonacciSphere(count, radius = 100) {
    const icons = [];
    const offset = 2 / count;
    const increment = Math.PI * (3 - Math.sqrt(5));

    for (let i = 0; i < count; i += 1) {
        const y = i * offset - 1 + offset / 2;
        const r = Math.sqrt(1 - y * y);
        const phi = i * increment;
        icons.push({
            x: Math.cos(phi) * r * radius,
            y: y * radius,
            z: Math.sin(phi) * r * radius,
            scale: 1,
            opacity: 1,
            id: i,
        });
    }

    return icons;
}

export const STACK_ITEMS = [
    {
        name: 'Python',
        image: localSkillImage('python.png'),
        desc: 'Data science, machine learning models, and automation scripting. I use it as my default for prototyping models, building APIs, and glue code that needs to move quickly.',
    },
    {
        name: 'React',
        image: localSkillImage('react.png'),
        desc: 'Building modern web apps with hooks, state management, and performance optimization. I use it for interactive UIs, component-driven layouts, and frontends that need to stay fast as they grow.',
    },
    {
        name: 'Java',
        image: localSkillImage('java.png'),
        desc: 'High-performance object-oriented programming for enterprise backend systems. I use it for structured services, JVM tooling, and backends where strong typing and mature ecosystems matter.',
    },
    {
        name: 'Node.js',
        image: localSkillImage('nodejs.png'),
        desc: 'Scalable backend services and real-time APIs with Express and Socket.io. I use it to ship JavaScript backends that integrate cleanly with React frontends and modern tooling.',
    },
    {
        name: 'TypeScript',
        image: localSkillImage('typescript.png'),
        desc: 'Strongly typed JavaScript for robust and maintainable large-scale applications. I rely on it to catch bugs early and keep complex codebases easier to refactor over time.',
    },
    {
        name: 'C / C++',
        image: localSkillImage('cv2.png'),
        desc: 'Low-level systems programming and high-performance simulation kernels. I reach for it when speed, memory control, and direct systems work are the priority.',
    },
    {
        name: 'Docker',
        image: localSkillImage('docker.png'),
        desc: 'Containerization for consistent development and deployment workflows. I use it to package services, simplify CI, and keep environments aligned across machines.',
    },
    {
        name: 'AWS',
        image: localSkillImage('aws.png'),
        desc: 'Cloud architecture, serverless functions, and scalable infrastructure management. I use it to deploy apps and ML workloads with room to scale under real traffic.',
    },
    {
        name: 'SQL',
        image: localSkillImage('sql.png'),
        desc: 'Complex query optimization and relational database design for high-load systems. I write SQL for analytics, reporting, and backends that need reliable structured data.',
    },
    {
        name: 'MongoDB',
        image: localSkillImage('mongodb.png'),
        desc: 'Flexible NoSQL database for storing data as documents. I use it when schemas evolve quickly and JSON-native storage fits the product shape better.',
    },
    {
        name: 'HTML',
        image: localSkillImage('html.png'),
        desc: 'Structure user interfaces for web and Electron-based applications. I focus on semantic markup, accessibility, and clean foundations for CSS and JavaScript.',
    },
    {
        name: 'CSS',
        image: localSkillImage('css.png'),
        desc: 'Styling web pages and user interfaces with modern design principles. I use layout systems, motion, and design tokens to match polished product visuals.',
    },
    {
        name: 'Git / GitHub',
        image: localSkillImage('git.png'),
        desc: 'Version control, code reviews, and CI-friendly collaboration workflows. I use it daily for branching, pull requests, and keeping project history clean.',
    },
    {
        name: 'Linux',
        image: localSkillImage('linux.png'),
        desc: 'Shell scripting, system configuration, and developer-focused environments. I use it for servers, containers, and terminal workflows across deployment targets.',
    },
    {
        name: 'SageMaker',
        image: localSkillImage('sagemaker.png'),
        desc: 'Amazon\'s cloud machine learning platform for building models at scale. I use it when training and hosting models need to move from experiment to production on AWS.',
    },
    {
        name: 'LangChain',
        image: localSkillImage('langchain.png'),
        desc: 'Building LLM-powered applications with tool usage, retrieval, and prompt orchestration. I use it to connect models to data and ship reliable AI workflows.',
    },
    {
        name: 'Jira',
        image: localSkillImage('jira.png'),
        desc: 'Agile project management, sprint planning, and issue tracking. I use it to break work into deliverables and keep execution aligned with team priorities.',
    },
    {
        name: 'Hugging Face',
        image: localSkillImage('huggingface.png'),
        desc: 'Access and deploy state-of-the-art NLP models for various tasks. I use the ecosystem for transformers, datasets, and rapid model experimentation.',
    },
    {
        name: 'FastAPI',
        image: localSkillImage('fastapi.png'),
        desc: 'High-performance Python web framework for building APIs quickly and efficiently. I use it to expose ML models and backend services with minimal boilerplate.',
    },
    {
        name: 'TensorFlow',
        image: localSkillImage('tensorflow.png'),
        desc: 'Building deep learning models for computer vision, NLP, and reinforcement learning. I use it when I need fine-grained control over training and deployment pipelines.',
    },
];

function iconImageUrl(item) {
    if (item.image) return item.image;
    if (item.slug) return `https://cdn.simpleicons.org/${item.slug}/ffffff`;
    return null;
}

export function initIconCloud(canvas, items, { onSelect } = {}) {
    if (!canvas || !items.length) return null;

    const size = Number(canvas.dataset.size) || 1120;
    canvas.width = size;
    canvas.height = size;

    const sphereRadius = size * (100 / 560);
    const iconSize = Math.round(size * (48 / 560));
    const iconHalf = iconSize / 2;
    const selectRing = iconHalf + 4;

    const ctx = canvas.getContext('2d');
    const iconPositions = fibonacciSphere(items.length, sphereRadius);
    const iconCanvases = [];
    const imagesLoaded = new Array(items.length).fill(false);

    let isDragging = false;
    let lastMousePos = { x: 0, y: 0 };
    let mousePos = { x: size / 2, y: size / 2 };
    let targetRotation = null;
    let animationFrame = 0;
    const rotation = { x: 0, y: 0 };
    let selectedId = null;
    let isVisible = true;

    items.forEach((item, index) => {
        const offscreen = document.createElement('canvas');
        offscreen.width = iconSize;
        offscreen.height = iconSize;
        const offCtx = offscreen.getContext('2d');
        const src = iconImageUrl(item);

        if (offCtx && src) {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = src;
            img.onload = () => {
                offCtx.clearRect(0, 0, offscreen.width, offscreen.height);
                offCtx.beginPath();
                offCtx.arc(iconHalf, iconHalf, iconHalf, 0, Math.PI * 2);
                offCtx.closePath();
                offCtx.clip();
                offCtx.drawImage(img, 0, 0, iconSize, iconSize);
                imagesLoaded[index] = true;
            };
            img.onerror = () => {
                offCtx.fillStyle = '#292d30';
                offCtx.beginPath();
                offCtx.arc(iconHalf, iconHalf, iconHalf, 0, Math.PI * 2);
                offCtx.fill();
                offCtx.fillStyle = '#f0f0f0';
                offCtx.font = `bold ${Math.round(iconSize * 0.29)}px Inter, sans-serif`;
                offCtx.textAlign = 'center';
                offCtx.textBaseline = 'middle';
                offCtx.fillText(item.name.slice(0, 2).toUpperCase(), iconHalf, iconHalf);
                imagesLoaded[index] = true;
            };
        }

        iconCanvases[index] = offscreen;
    });

    function rotateToIcon(icon) {
        const targetX = -Math.atan2(
            icon.y,
            Math.sqrt(icon.x * icon.x + icon.z * icon.z)
        );
        const targetY = Math.atan2(icon.x, icon.z);
        const currentX = rotation.x;
        const currentY = rotation.y;
        const distance = Math.hypot(targetX - currentX, targetY - currentY);
        const duration = Math.min(2000, Math.max(800, distance * 1000));

        targetRotation = {
            x: targetX,
            y: targetY,
            startX: currentX,
            startY: currentY,
            startTime: performance.now(),
            duration,
        };
    }

    function selectIcon(index) {
        if (index == null) return;
        selectedId = index;
        rotateToIcon(iconPositions[index]);
        onSelect?.(items[index], index);
    }

    function hitTest(clientX, clientY) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (clientX - rect.left) * scaleX;
        const y = (clientY - rect.top) * scaleY;

        let hitIndex = null;
        let bestDepth = -Infinity;

        iconPositions.forEach((icon, index) => {
            const cosX = Math.cos(rotation.x);
            const sinX = Math.sin(rotation.x);
            const cosY = Math.cos(rotation.y);
            const sinY = Math.sin(rotation.y);

            const rotatedX = icon.x * cosY - icon.z * sinY;
            const rotatedZ = icon.x * sinY + icon.z * cosY;
            const rotatedY = icon.y * cosX + rotatedZ * sinX;

            const screenX = canvas.width / 2 + rotatedX;
            const screenY = canvas.height / 2 + rotatedY;
            const scale = (rotatedZ + 200) / 300;
            const radius = iconHalf * scale;
            const dx = x - screenX;
            const dy = y - screenY;

            if (dx * dx + dy * dy < radius * radius && rotatedZ > bestDepth) {
                bestDepth = rotatedZ;
                hitIndex = index;
            }
        });

        return hitIndex;
    }

    function onPointerDown(e) {
        const index = hitTest(e.clientX, e.clientY);
        if (index != null) {
            selectIcon(index);
            return;
        }

        isDragging = true;
        lastMousePos = { x: e.clientX, y: e.clientY };
        canvas.setPointerCapture(e.pointerId);
    }

    function onPointerMove(e) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        mousePos = {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY,
        };

        if (!isDragging) return;

        const deltaX = e.clientX - lastMousePos.x;
        const deltaY = e.clientY - lastMousePos.y;
        rotation.x += deltaY * 0.002;
        rotation.y += deltaX * 0.002;
        lastMousePos = { x: e.clientX, y: e.clientY };
    }

    function onPointerUp(e) {
        isDragging = false;
        if (canvas.hasPointerCapture(e.pointerId)) {
            canvas.releasePointerCapture(e.pointerId);
        }
    }

    function render() {
        if (!isVisible) {
            animationFrame = requestAnimationFrame(render);
            return;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const maxDistance = Math.hypot(centerX, centerY);
        const dx = mousePos.x - centerX;
        const dy = mousePos.y - centerY;
        const distance = Math.hypot(dx, dy);
        const speed = 0.002 + (distance / maxDistance) * 0.008;

        if (targetRotation) {
            const elapsed = performance.now() - targetRotation.startTime;
            const progress = Math.min(1, elapsed / targetRotation.duration);
            const eased = easeOutCubic(progress);

            rotation.x =
                targetRotation.startX +
                (targetRotation.x - targetRotation.startX) * eased;
            rotation.y =
                targetRotation.startY +
                (targetRotation.y - targetRotation.startY) * eased;

            if (progress >= 1) targetRotation = null;
        } else if (!isDragging) {
            rotation.x += (dy / canvas.height) * speed;
            rotation.y += (dx / canvas.width) * speed;
        }

        iconPositions.forEach((icon, index) => {
            const cosX = Math.cos(rotation.x);
            const sinX = Math.sin(rotation.x);
            const cosY = Math.cos(rotation.y);
            const sinY = Math.sin(rotation.y);

            const rotatedX = icon.x * cosY - icon.z * sinY;
            const rotatedZ = icon.x * sinY + icon.z * cosY;
            const rotatedY = icon.y * cosX + rotatedZ * sinX;
            const scale = (rotatedZ + 200) / 300;
            const opacity = Math.max(0.2, Math.min(1, (rotatedZ + 150) / 200));

            ctx.save();
            ctx.translate(centerX + rotatedX, centerY + rotatedY);
            ctx.scale(scale, scale);
            ctx.globalAlpha = opacity;

            if (index === selectedId) {
                ctx.beginPath();
                ctx.arc(0, 0, selectRing, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(59, 158, 255, 0.85)';
                ctx.lineWidth = 2;
                ctx.stroke();
            }

            if (iconCanvases[index] && imagesLoaded[index]) {
                ctx.drawImage(iconCanvases[index], -iconHalf, -iconHalf, iconSize, iconSize);
            }

            ctx.restore();
        });

        animationFrame = requestAnimationFrame(render);
    }

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);
    canvas.addEventListener('lostpointercapture', onPointerUp);

    const observer =
        typeof IntersectionObserver !== 'undefined'
            ? new IntersectionObserver(([entry]) => {
                  isVisible = entry.isIntersecting;
              }, { threshold: 0.08 })
            : null;
    observer?.observe(canvas);

    render();

    return {
        selectByIndex: selectIcon,
        destroy() {
            cancelAnimationFrame(animationFrame);
            observer?.disconnect();
            canvas.removeEventListener('pointerdown', onPointerDown);
            canvas.removeEventListener('pointermove', onPointerMove);
            canvas.removeEventListener('pointerup', onPointerUp);
            canvas.removeEventListener('pointercancel', onPointerUp);
            canvas.removeEventListener('lostpointercapture', onPointerUp);
        },
    };
}

export function initStackCloud({
    canvasId = 'stack-icon-cloud',
    detailId = 'stack-cloud-detail',
    titleId = 'stack-cloud-detail-title',
    descId = 'stack-cloud-detail-desc',
} = {}) {
    const canvas = document.getElementById(canvasId);
    const detail = document.getElementById(detailId);
    const titleEl = document.getElementById(titleId);
    const descEl = document.getElementById(descId);

    if (!canvas || !detail || !titleEl || !descEl) return null;

    const showDetail = (item) => {
        titleEl.textContent = item.name;
        descEl.textContent = item.desc;
        detail.classList.add('is-active');
    };

    return initIconCloud(canvas, STACK_ITEMS, {
        onSelect: (item) => showDetail(item),
    });
}
