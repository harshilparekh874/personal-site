import gsap from 'gsap';

const skillImages = import.meta.glob('./assets/skills/*.png', {
    eager: true,
    import: 'default',
});

function localSkillImage(filename) {
    return skillImages[`./assets/skills/${filename}`];
}

const STACK_ITEMS = [
    { name: 'Python', image: localSkillImage('python.png'), description: 'Primary language for data pipelines, automation, and backend services.' },
    { name: 'React', image: localSkillImage('react.png'), description: 'Component-driven UIs with hooks, state management, and modern front-end patterns.' },
    { name: 'Java', image: localSkillImage('java.png'), description: 'Object-oriented backends, JVM tooling, and enterprise-grade application design.' },
    { name: 'Node.js', image: localSkillImage('nodejs.png'), description: 'Event-driven JavaScript runtimes for APIs, tooling, and real-time services.' },
    { name: 'TypeScript', image: localSkillImage('typescript.png'), description: 'Typed JavaScript for safer interfaces, shared models, and scalable codebases.' },
    { name: 'C / C++', image: localSkillImage('cv2.png'), description: 'Low-level performance work, systems programming, and native integrations.' },
    { name: 'Docker', image: localSkillImage('docker.png'), description: 'Containerized builds and reproducible deploys across local and cloud environments.' },
    { name: 'AWS', image: localSkillImage('aws.png'), description: 'Cloud infrastructure, serverless workflows, and managed production services.' },
    { name: 'SQL', image: localSkillImage('sql.png'), description: 'Relational modeling, query optimization, and analytics over structured data.' },
    { name: 'MongoDB', image: localSkillImage('mongodb.png'), description: 'Document databases for flexible schemas and fast application iteration.' },
    { name: 'HTML', image: localSkillImage('html.png'), description: 'Semantic markup, accessibility foundations, and structured web content.' },
    { name: 'CSS', image: localSkillImage('css.png'), description: 'Layout systems, responsive design, motion, and polished interface styling.' },
    { name: 'Git / GitHub', image: localSkillImage('git.png'), description: 'Version control, branching workflows, reviews, and collaborative shipping.' },
    { name: 'Linux', image: localSkillImage('linux.png'), description: 'Shell tooling, server administration, and deployment on Unix-like systems.' },
    { name: 'SageMaker', image: localSkillImage('sagemaker.png'), description: 'Managed ML training, deployment pipelines, and model hosting on AWS.' },
    { name: 'LangChain', image: localSkillImage('langchain.png'), description: 'LLM orchestration, retrieval workflows, and agent-style application logic.' },
    { name: 'Jira', image: localSkillImage('jira.png'), description: 'Agile planning, issue tracking, and cross-team delivery coordination.' },
    { name: 'Hugging Face', image: localSkillImage('huggingface.png'), description: 'Open models, transformers, and experiment-ready NLP tooling.' },
    { name: 'FastAPI', image: localSkillImage('fastapi.png'), description: 'High-performance Python APIs with validation, docs, and async support.' },
    { name: 'TensorFlow', image: localSkillImage('tensorflow.png'), description: 'Deep learning training, inference pipelines, and production ML graphs.' },
];

const CARD_W_DEFAULT = 200;
const CARD_H_DEFAULT = 292;
const SPREAD_X = 260;
const SPREAD_Y = 150;
const THROW_SPEED = 0.012;
const MAX_THROW_SPEED = 28;
const THROW_THRESHOLD = 420;
const SNAP_THRESHOLD = 0.25;

function shuffle(array) {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function rectOverlapArea(a, b) {
    const overlapX = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
    const overlapY = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
    return overlapX * overlapY;
}

export function initStackCards({
    stageId = 'stack-cards-stage',
    returnBtnId = 'return-stack-cards',
} = {}) {
    const stage = document.getElementById(stageId);
    const returnBtn = document.getElementById(returnBtnId);
    if (!stage || !returnBtn) return null;

    const labelEl = stage.querySelector('.stack-cards-label');
    const slotEl = document.createElement('div');
    slotEl.className = 'stack-card-slot';
    slotEl.innerHTML = `
        <div class="stack-card-slot__frame" aria-hidden="true"></div>
        <div class="stack-card-slot__detail" hidden>
            <p class="stack-card-slot__name"></p>
            <p class="stack-card-slot__desc"></p>
        </div>
    `;
    stage.appendChild(slotEl);

    const slotFrame = slotEl.querySelector('.stack-card-slot__frame');
    const slotDetail = slotEl.querySelector('.stack-card-slot__detail');
    const slotName = slotEl.querySelector('.stack-card-slot__name');
    const slotDesc = slotEl.querySelector('.stack-card-slot__desc');

    const cards = [];
    let activeCard = null;
    let pointerId = null;
    let dragOffsetX = 0;
    let dragOffsetY = 0;
    let velocitySamples = [];
    let rafId = 0;
    let returnBtnVisible = false;
    let isReturning = false;
    let dockedCard = null;
    let slotTargetActive = false;

    function cardSize() {
        const sample = cards[0]?.el;
        if (!sample) {
            return { width: CARD_W_DEFAULT, height: CARD_H_DEFAULT };
        }
        return {
            width: sample.offsetWidth || CARD_W_DEFAULT,
            height: sample.offsetHeight || CARD_H_DEFAULT,
        };
    }

    function stageSize() {
        return {
            width: stage.clientWidth,
            height: stage.clientHeight,
        };
    }

    function pileCenter() {
        const { width, height } = stageSize();
        const { width: cardW, height: cardH } = cardSize();
        return {
            x: width * 0.5 - cardW * 0.5,
            y: height * 0.44 - cardH * 0.5,
        };
    }

    function slotLayout() {
        const { width, height } = stageSize();
        const { width: cardW, height: cardH } = cardSize();
        const padding = clamp(width * 0.04, 16, 48);

        if (width < 720) {
            return {
                x: width - cardW - padding,
                y: clamp(height * 0.12, 56, height * 0.2),
                rotate: 0,
            };
        }

        return {
            x: width - cardW - padding,
            y: height * 0.34 - cardH * 0.5,
            rotate: 0,
        };
    }

    function layoutSlotFrame() {
        const layout = slotLayout();
        const { width: cardW, height: cardH } = cardSize();
        slotFrame.style.width = `${cardW}px`;
        slotFrame.style.height = `${cardH}px`;
        slotFrame.style.transform = `translate3d(${layout.x}px, ${layout.y}px, 0)`;
        slotEl.style.setProperty('--slot-x', `${layout.x}px`);
        slotEl.style.setProperty('--slot-y', `${layout.y + cardH + 24}px`);
        slotEl.style.setProperty('--slot-w', `${cardW}px`);
        slotEl.style.setProperty('--slot-detail-w', `${Math.max(cardW + 80, 320)}px`);
        return layout;
    }

    function cardRect(card) {
        const { width: w, height: h } = cardSize();
        return { x: card.x, y: card.y, w, h };
    }

    function slotRect() {
        const layout = slotLayout();
        const { width: w, height: h } = cardSize();
        return { x: layout.x, y: layout.y, w, h };
    }

    function overlapRatio(card, targetRect) {
        const area = cardRect(card);
        const cardArea = area.w * area.h;
        if (!cardArea) return 0;
        return rectOverlapArea(area, targetRect) / cardArea;
    }

    function isOverSlot(card) {
        return overlapRatio(card, slotRect()) >= SNAP_THRESHOLD;
    }

    function messyLayout() {
        const center = pileCenter();
        return {
            x: center.x + (Math.random() - 0.5) * SPREAD_X,
            y: center.y + (Math.random() - 0.5) * SPREAD_Y,
            rotate: (Math.random() - 0.5) * 14,
        };
    }

    function applyTransform(card) {
        card.el.style.zIndex = String(card.zIndex);
        card.el.style.transform = `translate3d(${card.x}px, ${card.y}px, 0) rotate(${card.rotate}deg)`;
    }

    function isOffScreen(card) {
        if (card.docked) return false;
        const { width, height } = stageSize();
        const { width: cardW, height: cardH } = cardSize();
        const margin = 40;
        return (
            card.x + cardW < -margin ||
            card.x > width + margin ||
            card.y + cardH < -margin ||
            card.y > height + margin
        );
    }

    function getLabelRect() {
        if (!labelEl) return null;
        const stageRect = stage.getBoundingClientRect();
        const labelRect = labelEl.getBoundingClientRect();
        return {
            x: labelRect.left - stageRect.left,
            y: labelRect.top - stageRect.top,
            w: labelRect.width,
            h: labelRect.height,
        };
    }

    function updateLabelReveal() {
        if (!labelEl) return;

        const label = getLabelRect();
        if (!label) return;

        const labelArea = label.w * label.h;
        if (!labelArea) return;

        let coveredArea = 0;
        cards.forEach((card) => {
            if (card.offScreen || card.docked) return;
            coveredArea += rectOverlapArea(cardRect(card), label);
        });

        const coveredRatio = clamp(coveredArea / labelArea, 0, 1);
        const revealed = coveredRatio <= 0.02;

        labelEl.classList.toggle('is-revealed', revealed);
        labelEl.style.opacity = revealed ? '1' : String(Math.max(0.06, 1 - coveredRatio * 0.94));
    }

    function syncOffScreenFlags() {
        cards.forEach((card) => {
            card.offScreen = isOffScreen(card);
        });
    }

    function hasOffScreenCards() {
        return cards.some((card) => card.offScreen);
    }

    function updateReturnButton() {
        const show = hasOffScreenCards();
        if (show === returnBtnVisible) return;

        returnBtnVisible = show;
        gsap.killTweensOf(returnBtn);
        gsap.to(returnBtn, {
            opacity: show ? 1 : 0,
            duration: 0.3,
            ease: 'power2.out',
        });
        returnBtn.style.pointerEvents = show ? 'auto' : 'none';
        returnBtn.tabIndex = show ? 0 : -1;
    }

    function bringToFront(card) {
        const maxZ = Math.max(...cards.map((c) => c.zIndex));
        card.zIndex = maxZ + 1;
        applyTransform(card);
    }

    function sendToBack(card) {
        const minZ = Math.min(...cards.map((c) => c.zIndex));
        card.zIndex = minZ - 1;
        normalizeZIndices();
    }

    function normalizeZIndices() {
        const ordered = [...cards].sort((a, b) => a.zIndex - b.zIndex);
        ordered.forEach((card, index) => {
            card.zIndex = index + 1;
            applyTransform(card);
        });
    }

    function stopCardMotion(card) {
        gsap.killTweensOf(card);
        card.vx = 0;
        card.vy = 0;
        card.spin = 0;
    }

    function animateCardTo(card, layout, duration = 0.5) {
        stopCardMotion(card);
        return gsap.to(card, {
            x: layout.x,
            y: layout.y,
            rotate: layout.rotate,
            duration,
            ease: 'power3.out',
            overwrite: true,
            onUpdate: () => {
                applyTransform(card);
                updateLabelReveal();
            },
        });
    }

    function showSlotOutline() {
        layoutSlotFrame();
        gsap.killTweensOf(slotFrame);
        gsap.to(slotFrame, {
            opacity: 1,
            duration: 0.28,
            ease: 'power2.out',
        });
    }

    function hideSlotOutline() {
        gsap.killTweensOf(slotFrame);
        gsap.to(slotFrame, {
            opacity: 0,
            duration: 0.22,
            ease: 'power2.in',
        });
        slotEl.classList.remove('is-target');
        slotTargetActive = false;
    }

    function showSlotDetail(card) {
        slotName.textContent = card.name;
        slotDesc.textContent = card.description;
        slotDetail.hidden = false;
        gsap.killTweensOf(slotDetail);
        gsap.fromTo(
            slotDetail,
            { opacity: 0, y: 8 },
            { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' },
        );
    }

    function hideSlotDetail() {
        gsap.killTweensOf(slotDetail);
        gsap.to(slotDetail, {
            opacity: 0,
            y: 6,
            duration: 0.2,
            ease: 'power2.in',
            onComplete: () => {
                slotDetail.hidden = true;
                slotName.textContent = '';
                slotDesc.textContent = '';
            },
        });
    }

    function undockCard(card) {
        if (!card?.docked) return;
        card.docked = false;
        card.el.classList.remove('is-docked');
        if (dockedCard === card) {
            dockedCard = null;
            hideSlotDetail();
        }
    }

    function dockCard(card) {
        if (dockedCard && dockedCard !== card) {
            undockCard(dockedCard);
            sendToBack(dockedCard);
            animateCardTo(dockedCard, messyLayout(), 0.42);
        }

        dockedCard = card;
        card.docked = true;
        card.offScreen = false;
        card.el.classList.add('is-docked');
        bringToFront(card);

        const layout = slotLayout();
        animateCardTo(card, layout, 0.38).eventCallback('onComplete', () => {
            showSlotDetail(card);
            updateLabelReveal();
            updateReturnButton();
        });
    }

    function createCard(item, index) {
        const layout = messyLayout();
        const card = {
            id: index,
            name: item.name,
            description: item.description,
            el: document.createElement('article'),
            x: layout.x,
            y: layout.y,
            rotate: layout.rotate,
            zIndex: index + 1,
            vx: 0,
            vy: 0,
            spin: 0,
            offScreen: false,
            docked: false,
        };

        card.el.className = 'stack-card';
        card.el.dataset.name = item.name;
        card.el.innerHTML = `
            <div class="stack-card__inner">
                <div class="stack-card__media">
                    <img class="stack-card__icon" src="${item.image}" alt="" draggable="false" />
                </div>
                <p class="stack-card__title">${item.name}</p>
            </div>
        `;

        applyTransform(card);
        stage.appendChild(card.el);
        cards.push(card);

        card.el.addEventListener('pointerdown', (e) => onPointerDown(e, card));
        return card;
    }

    function updateSlotTarget() {
        if (!activeCard) return;

        const over = isOverSlot(activeCard);
        if (over !== slotTargetActive) {
            slotTargetActive = over;
            slotEl.classList.toggle('is-target', over);
        }
    }

    function onPointerDown(e, card) {
        if (e.button !== 0 || isReturning) return;
        e.preventDefault();
        e.stopPropagation();

        if (card.docked) {
            undockCard(card);
        }

        activeCard = card;
        pointerId = e.pointerId;
        card.el.setPointerCapture(e.pointerId);
        card.el.classList.add('is-dragging');

        stopCardMotion(card);
        bringToFront(card);
        showSlotOutline();

        const rect = stage.getBoundingClientRect();
        dragOffsetX = e.clientX - rect.left - card.x;
        dragOffsetY = e.clientY - rect.top - card.y;

        velocitySamples = [{ x: e.clientX, y: e.clientY, t: performance.now() }];

        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
        window.addEventListener('pointercancel', onPointerUp);
    }

    function onPointerMove(e) {
        if (!activeCard || e.pointerId !== pointerId) return;

        const rect = stage.getBoundingClientRect();
        activeCard.x = e.clientX - rect.left - dragOffsetX;
        activeCard.y = e.clientY - rect.top - dragOffsetY;

        velocitySamples.push({ x: e.clientX, y: e.clientY, t: performance.now() });
        if (velocitySamples.length > 6) {
            velocitySamples.shift();
        }

        applyTransform(activeCard);
        updateSlotTarget();
        updateLabelReveal();
    }

    function releaseVelocity() {
        if (velocitySamples.length < 2) {
            return { x: 0, y: 0 };
        }

        const newest = velocitySamples[velocitySamples.length - 1];
        const oldest = velocitySamples[0];
        const dt = Math.max(0.016, (newest.t - oldest.t) / 1000);

        return {
            x: clamp((newest.x - oldest.x) / dt, -MAX_THROW_SPEED * 60, MAX_THROW_SPEED * 60),
            y: clamp((newest.y - oldest.y) / dt, -MAX_THROW_SPEED * 60, MAX_THROW_SPEED * 60),
        };
    }

    function endDrag(e) {
        if (!activeCard || e.pointerId !== pointerId) return;

        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        window.removeEventListener('pointercancel', onPointerUp);

        const card = activeCard;
        if (card.el.hasPointerCapture(e.pointerId)) {
            card.el.releasePointerCapture(e.pointerId);
        }
        card.el.classList.remove('is-dragging');
        hideSlotOutline();

        activeCard = null;
        pointerId = null;

        if (isOverSlot(card)) {
            dockCard(card);
        } else {
            const release = releaseVelocity();
            const speed = Math.hypot(release.x, release.y);

            if (speed > THROW_THRESHOLD) {
                card.vx = clamp(release.x * THROW_SPEED, -MAX_THROW_SPEED, MAX_THROW_SPEED);
                card.vy = clamp(release.y * THROW_SPEED, -MAX_THROW_SPEED, MAX_THROW_SPEED);
                card.spin = clamp(card.vx * 0.45, -6, 6);
            } else {
                sendToBack(card);
                animateCardTo(card, messyLayout(), 0.42);
            }
        }

        syncOffScreenFlags();
        updateReturnButton();
        updateLabelReveal();
    }

    function onPointerUp(e) {
        endDrag(e);
    }

    function tick() {
        let moving = false;

        cards.forEach((card) => {
            if (card === activeCard || isReturning) return;

            if (Math.abs(card.vx) > 0.04 || Math.abs(card.vy) > 0.04) {
                moving = true;
                card.x += card.vx;
                card.y += card.vy;
                card.rotate += card.spin;
                card.vx *= 0.96;
                card.vy *= 0.96;
                card.spin *= 0.94;
                applyTransform(card);
            } else if (card.vx || card.vy || card.spin) {
                card.vx = 0;
                card.vy = 0;
                card.spin = 0;
            }
        });

        if (moving) {
            syncOffScreenFlags();
            updateReturnButton();
            updateLabelReveal();
        }

        rafId = requestAnimationFrame(tick);
    }

    function returnCards(e) {
        e.preventDefault();
        e.stopPropagation();

        const thrownOff = cards.filter((card) => card.offScreen);
        if (!thrownOff.length || isReturning) return;

        isReturning = true;
        returnBtn.style.pointerEvents = 'none';

        if (dockedCard) {
            undockCard(dockedCard);
        }

        thrownOff.forEach((card) => stopCardMotion(card));

        const onPile = cards.filter((card) => !card.offScreen);
        const onPileSorted = [...onPile].sort((a, b) => a.zIndex - b.zIndex);
        const returnedSorted = shuffle(thrownOff);

        // Returned cards go to the bottom; cards still on the pile keep their positions.
        const ordered = [...returnedSorted, ...onPileSorted];
        ordered.forEach((card, index) => {
            card.zIndex = index + 1;
            applyTransform(card);
        });

        returnedSorted.forEach((card) => {
            card.offScreen = false;
            card.docked = false;
            card.el.classList.remove('is-docked');
            animateCardTo(card, messyLayout(), 0.55);
        });

        gsap.delayedCall(0.56, () => {
            isReturning = false;
            syncOffScreenFlags();
            updateReturnButton();
            updateLabelReveal();
        });
    }

    STACK_ITEMS.forEach((item, index) => createCard(item, index));

    gsap.set(slotFrame, { opacity: 0 });
    layoutSlotFrame();
    updateLabelReveal();

    returnBtn.addEventListener('click', returnCards);
    returnBtn.addEventListener('pointerdown', (e) => e.stopPropagation());
    gsap.set(returnBtn, { opacity: 0 });
    returnBtn.style.pointerEvents = 'none';

    const onResize = () => {
        layoutSlotFrame();

        if (dockedCard) {
            const layout = slotLayout();
            dockedCard.x = layout.x;
            dockedCard.y = layout.y;
            dockedCard.rotate = 0;
            applyTransform(dockedCard);
        }

        if (hasOffScreenCards() || isReturning || activeCard) {
            updateLabelReveal();
            return;
        }

        cards.forEach((card) => {
            if (card.docked) return;
            const layout = messyLayout();
            card.x = layout.x;
            card.y = layout.y;
            card.rotate = layout.rotate;
            applyTransform(card);
        });
        updateLabelReveal();
    };

    window.addEventListener('resize', onResize);
    rafId = requestAnimationFrame(tick);

    return {
        destroy() {
            cancelAnimationFrame(rafId);
            window.removeEventListener('resize', onResize);
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
            window.removeEventListener('pointercancel', onPointerUp);
        },
    };
}
