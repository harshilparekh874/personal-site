const DIVISOR = 20;

function attachWobbleListeners(shell, inner) {
    let pos = { x: 0, y: 0 };
    let hovering = false;

    const apply = () => {
        if (hovering) {
            shell.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
            inner.style.transform = `translate3d(${-pos.x}px, ${-pos.y}px, 0) scale3d(1.03, 1.03, 1)`;
        } else {
            shell.style.transform = '';
            inner.style.transform = '';
        }
    };

    const onMove = (clientX, clientY) => {
        const rect = shell.getBoundingClientRect();
        pos.x = (clientX - (rect.left + rect.width / 2)) / DIVISOR;
        pos.y = (clientY - (rect.top + rect.height / 2)) / DIVISOR;
        apply();
    };

    shell.addEventListener('mouseenter', () => {
        hovering = true;
        apply();
    });

    shell.addEventListener('mousemove', (e) => onMove(e.clientX, e.clientY));

    shell.addEventListener('mouseleave', () => {
        hovering = false;
        pos = { x: 0, y: 0 };
        apply();
    });

    shell.addEventListener('touchmove', (e) => {
        if (!e.touches[0]) return;
        hovering = true;
        onMove(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });

    shell.addEventListener('touchend', () => {
        hovering = false;
        pos = { x: 0, y: 0 };
        apply();
    });
}

function enhanceWobbleCard(card) {
    if (card.dataset.wobbleEnhanced) return;

    card.dataset.wobbleEnhanced = 'true';

    const shell = document.createElement('div');
    shell.className = 'wobble-card-shell';

    if (card.classList.contains('feature-card')) {
        shell.classList.add('feature-card');
        card.classList.remove('feature-card');
    }

    const inner = document.createElement('div');
    inner.className = 'wobble-card-inner';

    const noise = document.createElement('div');
    noise.className = 'wobble-noise';
    noise.setAttribute('aria-hidden', 'true');

    inner.appendChild(noise);

    while (card.firstChild) {
        inner.appendChild(card.firstChild);
    }

    shell.appendChild(inner);
    card.appendChild(shell);
    card.classList.add('wobble-card');

    attachWobbleListeners(shell, inner);
}

export function initWobbleCards(selector = '.project-card, .timeline-item') {
    document.querySelectorAll(selector).forEach(enhanceWobbleCard);
}
