const GRADIENT_SIZE = 200;
const OFF_POSITION = -GRADIENT_SIZE;

function getGradientColor() {
    return document.documentElement.getAttribute('data-theme') === 'light'
        ? 'rgba(217, 217, 217, 0.33)'
        : '#262626';
}

function setPointer(card, x, y) {
    card.style.setProperty('--magic-x', `${x}px`);
    card.style.setProperty('--magic-y', `${y}px`);
}

function resetPointer(card) {
    setPointer(card, OFF_POSITION, OFF_POSITION);
}

function attachMagicCard(card) {
    if (card.dataset.magicInit === 'true') return;

    card.dataset.magicInit = 'true';
    card.style.setProperty('--magic-gradient-color', getGradientColor());
    resetPointer(card);

    card.addEventListener('pointermove', (e) => {
        const rect = card.getBoundingClientRect();
        setPointer(card, e.clientX - rect.left, e.clientY - rect.top);
    });

    card.addEventListener('pointerleave', () => resetPointer(card));
}

export function initMagicCards(selector = '.magic-card') {
    document.querySelectorAll(selector).forEach(attachMagicCard);
}

export function refreshMagicCardThemes() {
    const color = getGradientColor();
    document.querySelectorAll('.magic-card').forEach((card) => {
        card.style.setProperty('--magic-gradient-color', color);
    });
}
