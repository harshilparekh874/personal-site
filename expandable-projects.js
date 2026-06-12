import gsap from 'gsap';
import project1Img from './assets/project1.png';
import project2Img from './assets/project2.png';
import project3Img from './assets/project3.png';
import project4Img from './assets/project4.png';
import project5Img from './assets/project5.png';
import project6Img from './assets/project6.png';

const PROJECTS = [
    {
        title: 'Black Hole Simulation',
        description: 'C++ · OpenGL · General Relativity',
        src: project1Img,
        ctaLink: 'https://github.com/harshilparekh874/blackhole',
        content: `A high-performance, real-time General Relativity simulator that visualizes spacetime curvature around black holes. Built with C++ and OpenGL compute shaders, it renders gravitational lensing, accretion disks, and frame-dragging with interactive camera controls.`,
    },
    {
        title: 'Filmstrip',
        description: 'React · Node.js · Movie tracking',
        src: project2Img,
        ctaLink: 'https://github.com/harshilparekh874/Filmstrip',
        content: `A full-stack movie tracking app where you log films, rate and review titles, and follow friends' watchlists. React frontend, Node.js API, and social discovery features — deployed live on Vercel.`,
    },
    {
        title: 'Physics Sim — Kinetic Shapes',
        description: 'Physics sandbox · Collision dynamics',
        src: project3Img,
        ctaLink: 'https://github.com/harshilparekh874/Physics-Sim',
        content: `An interactive physics playground for experimenting with variable gravity, elastic collisions, and custom shape dynamics. Tune parameters in real time and watch how kinetic systems evolve under different forces.`,
    },
    {
        title: 'Google Drive Clone',
        description: 'Cloud storage · File management',
        src: project4Img,
        ctaLink: 'https://github.com/harshilparekh874/googledrive-clone',
        content: `A full-featured cloud storage clone with upload, folder hierarchy, sharing permissions, and search. Recreates the core Drive experience end to end — from drag-and-drop uploads to organized file browsing.`,
    },
    {
        title: 'Object Detection — FIFA',
        description: 'Computer vision · Bundesliga footage',
        src: project5Img,
        ctaLink: 'https://github.com/harshilparekh874/Football-Tracking-Project',
        content: `A computer vision pipeline for detecting players and the ball in FIFA Bundesliga match footage. Trained and evaluated on real broadcast video to support sports analytics and automated tracking workflows.`,
    },
    {
        title: 'Function Calling Kitchen',
        description: 'LLMs · Tool use · Interactive demo',
        src: project6Img,
        ctaLink: 'https://github.com/harshilparekh874/Function-Calling-Kitchen',
        content: `An interactive cooking simulator that orchestrates sequences of LLM function calls — chop, sauté, season, and plate ingredients through structured tool use. Demonstrates multi-step agent workflows in a playful, visual interface.`,
    },
];

const ZOOM_DURATION = 0.48;

function createCloseIcon() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svg.setAttribute('width', '24');
    svg.setAttribute('height', '24');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML = '<path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M18 6l-12 12"></path><path d="M6 6l12 12"></path>';
    return svg;
}

function applyZoomRect(img, rect, borderRadius) {
    gsap.set(img, {
        position: 'fixed',
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        margin: 0,
        padding: 0,
        borderRadius,
        transform: 'none',
        x: 0,
        y: 0,
        zIndex: 120,
    });
}

function measureTargetImageRect(expanded) {
    expanded.classList.add('is-measuring');
    expanded.removeAttribute('hidden');
    gsap.set(expanded, { opacity: 0, visibility: 'hidden', pointerEvents: 'none' });

    const media = expanded.querySelector('.expandable-project-expanded-media');
    const rect = media.getBoundingClientRect();

    expanded.setAttribute('hidden', '');
    expanded.classList.remove('is-measuring');
    gsap.set(expanded, { clearProps: 'opacity,visibility,pointerEvents' });

    return rect;
}

export function initExpandableProjects(containerId = 'expandable-projects') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const list = document.createElement('ul');
    list.className = 'expandable-projects-list';

    PROJECTS.forEach((project, index) => {
        const item = document.createElement('li');
        item.className = 'expandable-project-item';
        item.dataset.projectIndex = String(index);

        item.innerHTML = `
            <button type="button" class="expandable-project-card" aria-expanded="false">
                <div class="expandable-project-row">
                    <div class="expandable-project-media">
                        <img src="${project.src}" alt="${project.title}" width="100" height="100" loading="lazy">
                    </div>
                    <div class="expandable-project-info">
                        <h3 class="expandable-project-title">${project.title}</h3>
                        <p class="expandable-project-desc">${project.description}</p>
                    </div>
                </div>
                <span class="expandable-project-read-btn">Read</span>
            </button>
        `;

        list.appendChild(item);
    });

    container.appendChild(list);

    const overlay = document.createElement('div');
    overlay.className = 'expandable-project-overlay';
    overlay.hidden = true;

    const zoomImg = document.createElement('img');
    zoomImg.className = 'expandable-project-zoom-img';
    zoomImg.alt = '';
    zoomImg.hidden = true;

    const expanded = document.createElement('div');
    expanded.className = 'expandable-project-expanded';
    expanded.setAttribute('role', 'dialog');
    expanded.setAttribute('aria-modal', 'true');
    expanded.hidden = true;

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'expandable-project-close';
    closeBtn.setAttribute('aria-label', 'Close project details');
    closeBtn.appendChild(createCloseIcon());

    const expandedImgWrap = document.createElement('div');
    expandedImgWrap.className = 'expandable-project-expanded-media';
    const expandedImg = document.createElement('img');
    expandedImg.className = 'expandable-project-expanded-img';
    expandedImg.alt = '';
    expandedImgWrap.appendChild(expandedImg);

    const expandedContent = document.createElement('div');
    expandedContent.className = 'expandable-project-expanded-content';
    expandedContent.innerHTML = `
        <h3 class="expandable-project-expanded-title"></h3>
        <p class="expandable-project-expanded-body"></p>
        <a class="expandable-project-cta" href="#" target="_blank" rel="noopener noreferrer">View project</a>
    `;

    expanded.append(closeBtn, expandedImgWrap, expandedContent);
    document.body.append(overlay, zoomImg, expanded);

    let activeIndex = null;
    let isAnimating = false;
    let lastTargetRect = null;

    const titleEl = expanded.querySelector('.expandable-project-expanded-title');
    const bodyEl = expanded.querySelector('.expandable-project-expanded-body');
    const ctaLink = expanded.querySelector('.expandable-project-cta');

    const scrollKeys = new Set(['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ']);

    const blockScroll = (event) => {
        event.preventDefault();
    };

    const blockScrollKeys = (event) => {
        if (scrollKeys.has(event.key)) {
            event.preventDefault();
        }
    };

    const setScrollLock = (locked) => {
        if (locked) {
            document.addEventListener('wheel', blockScroll, { passive: false });
            document.addEventListener('touchmove', blockScroll, { passive: false });
            document.addEventListener('keydown', blockScrollKeys);
            return;
        }

        document.removeEventListener('wheel', blockScroll);
        document.removeEventListener('touchmove', blockScroll);
        document.removeEventListener('keydown', blockScrollKeys);
    };

    const resetZoomImg = () => {
        zoomImg.hidden = true;
        gsap.set(zoomImg, { clearProps: 'all' });
    };

    const getSourceImage = (index) =>
        list.children[index]?.querySelector('.expandable-project-media img');

    const hideExpanded = () => {
        expanded.hidden = true;
        expanded.classList.remove('is-open');
        gsap.set(expanded, { clearProps: 'opacity,pointerEvents' });
        gsap.set(expandedImg, { clearProps: 'opacity' });
        gsap.set(expandedContent, { clearProps: 'all' });
    };

    const closeExpanded = () => {
        if (activeIndex === null || isAnimating) return;

        const sourceImg = getSourceImage(activeIndex);
        const sourceCard = list.children[activeIndex]?.querySelector('.expandable-project-card');
        const fromRect = lastTargetRect || expanded.querySelector('.expandable-project-expanded-media').getBoundingClientRect();

        if (!sourceImg || !sourceCard) {
            activeIndex = null;
            overlay.hidden = true;
            hideExpanded();
            resetZoomImg();
            setScrollLock(false);
            return;
        }

        isAnimating = true;
        sourceCard.setAttribute('aria-expanded', 'false');

        gsap.set(expandedContent, { opacity: 0 });
        gsap.set(expandedImg, { opacity: 0 });

        zoomImg.src = expandedImg.src;
        zoomImg.alt = expandedImg.alt;
        zoomImg.hidden = false;
        applyZoomRect(zoomImg, fromRect, '24px 24px 0 0');

        hideExpanded();

        const toRect = sourceImg.getBoundingClientRect();

        gsap.to(overlay, { opacity: 0, duration: 0.25, ease: 'power2.in' });
        gsap.to(zoomImg, {
            top: toRect.top,
            left: toRect.left,
            width: toRect.width,
            height: toRect.height,
            borderRadius: '8px',
            duration: ZOOM_DURATION,
            ease: 'power3.in',
            onComplete: () => {
                gsap.set(sourceImg, { opacity: 1 });
                resetZoomImg();
                overlay.hidden = true;
                gsap.set(overlay, { clearProps: 'opacity' });
                activeIndex = null;
                lastTargetRect = null;
                isAnimating = false;
                setScrollLock(false);
            },
        });
    };

    const openExpanded = (index, sourceCard) => {
        if (isAnimating) return;

        const project = PROJECTS[index];
        const sourceImg = sourceCard.querySelector('.expandable-project-media img');
        if (!project || !sourceImg) return;

        activeIndex = index;
        isAnimating = true;
        sourceCard.setAttribute('aria-expanded', 'true');

        expandedImg.src = project.src;
        expandedImg.alt = project.title;
        titleEl.textContent = project.title;
        bodyEl.textContent = project.content;
        ctaLink.href = project.ctaLink;

        const fromRect = sourceImg.getBoundingClientRect();
        const toRect = measureTargetImageRect(expanded);
        lastTargetRect = toRect;

        expanded.hidden = false;
        expanded.classList.add('is-open');
        gsap.set(expanded, { opacity: 0, pointerEvents: 'none' });
        gsap.set(expandedImg, { opacity: 0 });
        gsap.set(expandedContent, { opacity: 0, y: 12 });

        zoomImg.src = project.src;
        zoomImg.alt = project.title;
        zoomImg.hidden = false;
        applyZoomRect(zoomImg, fromRect, '8px');
        gsap.set(sourceImg, { opacity: 0 });

        overlay.hidden = false;
        gsap.set(overlay, { opacity: 0 });
        setScrollLock(true);

        const cardRevealAt = ZOOM_DURATION * 0.5;

        const tl = gsap.timeline({
            onComplete: () => {
                gsap.set(expandedImg, { opacity: 1 });
                gsap.set(expanded, { pointerEvents: 'auto' });
                resetZoomImg();
                isAnimating = false;
            },
        });

        tl.to(overlay, { opacity: 1, duration: 0.22, ease: 'power2.out' }, 0);

        tl.to(
            zoomImg,
            {
                top: toRect.top,
                left: toRect.left,
                width: toRect.width,
                height: toRect.height,
                borderRadius: '24px 24px 0 0',
                duration: ZOOM_DURATION,
                ease: 'power3.out',
            },
            0
        );

        tl.to(
            expanded,
            { opacity: 1, duration: 0.26, ease: 'power2.out' },
            cardRevealAt
        );
        tl.to(
            expandedContent,
            { opacity: 1, y: 0, duration: 0.28, ease: 'power2.out' },
            cardRevealAt + 0.02
        );
    };

    list.addEventListener('click', (event) => {
        const card = event.target.closest('.expandable-project-card');
        if (!card) return;

        const item = card.closest('.expandable-project-item');
        const index = Number(item?.dataset.projectIndex);
        if (Number.isNaN(index)) return;

        if (activeIndex === index) {
            closeExpanded();
            return;
        }

        if (activeIndex !== null) {
            const previousIndex = activeIndex;
            const previousCard = list.children[previousIndex]?.querySelector('.expandable-project-card');
            const previousImg = getSourceImage(previousIndex);

            gsap.killTweensOf([zoomImg, overlay, expanded, expandedContent]);
            isAnimating = false;
            activeIndex = null;
            lastTargetRect = null;
            overlay.hidden = true;
            hideExpanded();
            resetZoomImg();
            gsap.set(overlay, { clearProps: 'opacity' });
            if (previousImg) gsap.set(previousImg, { opacity: 1 });
            if (previousCard) previousCard.setAttribute('aria-expanded', 'false');
            setScrollLock(false);

            window.requestAnimationFrame(() => openExpanded(index, card));
            return;
        }

        openExpanded(index, card);
    });

    overlay.addEventListener('click', closeExpanded);
    closeBtn.addEventListener('click', closeExpanded);

    expanded.addEventListener('click', (event) => {
        event.stopPropagation();
    });

    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closeExpanded();
    });
}
