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
        desc: 'My go-to for data science, ML pipelines, and automation. I use it for model prototyping, backend APIs with FastAPI, and scripting workflows that need to move fast.',
    },
    {
        name: 'JavaScript',
        slug: 'javascript',
        desc: 'The language behind most of my web interfaces and interactive experiences. I use modern ES modules, async patterns, and browser APIs to build responsive, performant frontends.',
    },
    {
        name: 'TypeScript',
        image: localSkillImage('typescript.png'),
        desc: 'Strongly typed JavaScript for large codebases that need to stay maintainable. I rely on it for safer refactors, clearer APIs, and better tooling across React and Node projects.',
    },
    {
        name: 'React',
        image: localSkillImage('react.png'),
        desc: 'Building component-driven UIs with hooks, state management, and performance tuning. I use it for dashboards, marketing sites, and interactive product surfaces that need to feel polished.',
    },
    {
        name: 'Next.js',
        slug: 'nextdotjs',
        desc: 'Full-stack React framework for routing, SSR, and production-ready deployments. I use it when SEO, performance, and a clean app structure matter from day one.',
    },
    {
        name: 'Node.js',
        image: localSkillImage('nodejs.png'),
        desc: 'Scalable backend services, REST APIs, and real-time features on the JavaScript runtime. I pair it with Express for services that need to integrate quickly with frontend apps.',
    },
    {
        name: 'Express',
        slug: 'express',
        desc: 'Minimal, flexible HTTP framework for Node.js APIs and middleware pipelines. I use it to ship backend endpoints quickly without heavy ceremony.',
    },
    {
        name: 'Java',
        image: localSkillImage('java.png'),
        desc: 'Object-oriented backend development for enterprise-grade systems and performance-sensitive services. I use it for structured application logic and JVM-based tooling.',
    },
    {
        name: 'C / C++',
        image: localSkillImage('cv2.png'),
        desc: 'Low-level systems programming and high-performance simulation kernels. I reach for it when memory layout, speed, and direct hardware interaction are non-negotiable.',
    },
    {
        name: 'Dart',
        slug: 'dart',
        desc: 'Language behind Flutter for cross-platform UI development. I use it when I need one codebase targeting mobile and web with a cohesive widget model.',
    },
    {
        name: 'Flutter',
        slug: 'flutter',
        desc: 'Cross-platform mobile and desktop UI toolkit with fast iteration and native performance. I use it to prototype apps and ship consistent interfaces across devices.',
    },
    {
        name: 'Android',
        slug: 'android',
        desc: 'Native mobile platform development and Android ecosystem tooling. I use it for device-specific features and mobile experiences that need tight OS integration.',
    },
    {
        name: 'HTML',
        image: localSkillImage('html.png'),
        desc: 'Semantic structure for web apps, landing pages, and accessible document markup. I focus on clean hierarchy, SEO-friendly tags, and solid foundations for CSS and JS.',
    },
    {
        name: 'CSS',
        image: localSkillImage('css.png'),
        desc: 'Layout, motion, and visual systems for modern responsive interfaces. I use custom properties, grid, and subtle animation to match design tokens and brand feel.',
    },
    {
        name: 'FastAPI',
        image: localSkillImage('fastapi.png'),
        desc: 'High-performance Python API framework with automatic docs and type validation. I use it to expose ML models and backend services with minimal boilerplate.',
    },
    {
        name: 'TensorFlow',
        image: localSkillImage('tensorflow.png'),
        desc: 'Deep learning for computer vision, NLP, and custom model training pipelines. I use it when I need fine-grained control over graphs, layers, and deployment paths.',
    },
    {
        name: 'LangChain',
        image: localSkillImage('langchain.png'),
        desc: 'Orchestrating LLM apps with tools, retrieval, and multi-step agents. I use it to connect models to data sources and build reliable AI-powered workflows.',
    },
    {
        name: 'Hugging Face',
        image: localSkillImage('huggingface.png'),
        desc: 'Accessing, fine-tuning, and deploying state-of-the-art NLP and vision models. I use the ecosystem for transformers, datasets, and rapid model experimentation.',
    },
    {
        name: 'AWS',
        image: localSkillImage('aws.png'),
        desc: 'Cloud architecture spanning compute, storage, and managed ML services. I use it to deploy scalable apps and keep infrastructure reliable under real traffic.',
    },
    {
        name: 'SageMaker',
        image: localSkillImage('sagemaker.png'),
        desc: 'Amazon\'s managed ML platform for training, tuning, and hosting models at scale. I use it when experiments need to graduate into production pipelines on AWS.',
    },
    {
        name: 'Docker',
        image: localSkillImage('docker.png'),
        desc: 'Containerization for reproducible dev environments and consistent deployments. I use it to package services, simplify CI, and reduce environment drift across machines.',
    },
    {
        name: 'PostgreSQL',
        slug: 'postgresql',
        desc: 'Relational database for complex queries, transactions, and structured data at scale. I use it when data integrity, joins, and SQL power matter more than schema flexibility.',
    },
    {
        name: 'SQL',
        image: localSkillImage('sql.png'),
        desc: 'Query design, indexing strategy, and relational modeling for high-load systems. I write optimized SQL for analytics, reporting, and application backends.',
    },
    {
        name: 'MongoDB',
        image: localSkillImage('mongodb.png'),
        desc: 'Document database for flexible schemas and fast iteration on unstructured data. I use it for apps that evolve quickly and benefit from JSON-native storage.',
    },
    {
        name: 'Prisma',
        slug: 'prisma',
        desc: 'Type-safe ORM and schema tooling for Node.js and TypeScript backends. I use it to keep database models in sync with application types and migrations.',
    },
    {
        name: 'Firebase',
        slug: 'firebase',
        desc: 'Backend-as-a-service for auth, realtime data, and rapid mobile or web prototypes. I use it when speed to MVP matters and managed infra reduces ops overhead.',
    },
    {
        name: 'Git',
        image: localSkillImage('git.png'),
        desc: 'Version control, branching workflows, and clean commit history for team collaboration. I use it daily for code reviews, feature isolation, and release management.',
    },
    {
        name: 'GitHub',
        slug: 'github',
        desc: 'Hosting repositories, pull requests, and CI-friendly collaboration workflows. I use it as the hub for open source, portfolio projects, and team development.',
    },
    {
        name: 'GitLab',
        slug: 'gitlab',
        desc: 'DevOps platform combining repos, pipelines, and integrated CI/CD. I use it when projects need built-in automation and deployment in one place.',
    },
    {
        name: 'Linux',
        image: localSkillImage('linux.png'),
        desc: 'Shell scripting, server configuration, and developer environments on Unix systems. I use it for deployment targets, containers, and day-to-day terminal workflows.',
    },
    {
        name: 'Nginx',
        slug: 'nginx',
        desc: 'Reverse proxy, static file serving, and load balancing for production web stacks. I use it to front apps, terminate TLS, and route traffic efficiently.',
    },
    {
        name: 'Vercel',
        slug: 'vercel',
        desc: 'Frontend deployment platform optimized for Next.js and static sites. I use it for fast previews, edge delivery, and low-friction production releases.',
    },
    {
        name: 'Jest',
        slug: 'jest',
        desc: 'JavaScript testing framework for unit tests, mocks, and snapshot coverage. I use it to lock in behavior on utilities, hooks, and UI logic before shipping.',
    },
    {
        name: 'Cypress',
        slug: 'cypress',
        desc: 'End-to-end browser testing for critical user flows and regression checks. I use it to validate interactions that unit tests alone cannot fully cover.',
    },
    {
        name: 'Testing Library',
        slug: 'testinglibrary',
        desc: 'User-centric testing utilities for React and DOM components. I use it to assert what users see and do instead of testing implementation details.',
    },
    {
        name: 'Jira',
        image: localSkillImage('jira.png'),
        desc: 'Agile sprint planning, issue tracking, and cross-team project visibility. I use it to break work into deliverables and keep execution aligned with priorities.',
    },
    {
        name: 'VS Code',
        slug: 'visualstudiocode',
        desc: 'Primary editor for full-stack development with extensions and integrated debugging. I use it for everything from quick scripts to large multi-root workspaces.',
    },
    {
        name: 'Android Studio',
        slug: 'androidstudio',
        desc: 'Official IDE for Android app development, emulators, and Gradle builds. I use it when building or debugging native Android experiences.',
    },
    {
        name: 'SonarQube',
        slug: 'sonarqube',
        desc: 'Static analysis and code quality gates for maintainable codebases. I use it to catch bugs, smells, and security issues before they reach production.',
    },
    {
        name: 'Figma',
        slug: 'figma',
        desc: 'Collaborative UI design, prototyping, and handoff to implementation. I use it to translate layouts into code with accurate spacing, type, and component specs.',
    },
];

function iconImageUrl(item) {
    if (item.image) return item.image;
    if (item.slug) return `https://cdn.simpleicons.org/${item.slug}/ffffff`;
    return null;
}

export function initIconCloud(canvas, items, { onSelect } = {}) {
    if (!canvas || !items.length) return null;

    const size = Number(canvas.dataset.size) || 560;
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d');
    const iconPositions = fibonacciSphere(items.length);
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
        offscreen.width = 48;
        offscreen.height = 48;
        const offCtx = offscreen.getContext('2d');
        const src = iconImageUrl(item);

        if (offCtx && src) {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = src;
            img.onload = () => {
                offCtx.clearRect(0, 0, offscreen.width, offscreen.height);
                offCtx.beginPath();
                offCtx.arc(24, 24, 24, 0, Math.PI * 2);
                offCtx.closePath();
                offCtx.clip();
                offCtx.drawImage(img, 0, 0, 48, 48);
                imagesLoaded[index] = true;
            };
            img.onerror = () => {
                offCtx.fillStyle = '#292d30';
                offCtx.beginPath();
                offCtx.arc(24, 24, 24, 0, Math.PI * 2);
                offCtx.fill();
                offCtx.fillStyle = '#f0f0f0';
                offCtx.font = 'bold 14px Inter, sans-serif';
                offCtx.textAlign = 'center';
                offCtx.textBaseline = 'middle';
                offCtx.fillText(item.name.slice(0, 2).toUpperCase(), 24, 24);
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
            const radius = 24 * scale;
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
                ctx.arc(0, 0, 28, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(59, 158, 255, 0.85)';
                ctx.lineWidth = 2;
                ctx.stroke();
            }

            if (iconCanvases[index] && imagesLoaded[index]) {
                ctx.drawImage(iconCanvases[index], -24, -24, 48, 48);
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
