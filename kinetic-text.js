/**
 * Vanilla port of Magic UI KineticText — splits text into hover-reactive letters.
 */
export function initKineticText(selector = '.kinetic-text') {
    document.querySelectorAll(selector).forEach((el) => {
        if (el.dataset.kineticInit === 'true') return;

        const text = el.textContent.trim();
        if (!text) return;

        el.textContent = '';
        el.dataset.kineticInit = 'true';
        el.setAttribute('aria-label', text);

        for (const char of text) {
            const letter = document.createElement('span');
            letter.className = 'kinetic-text__letter';
            letter.setAttribute('aria-hidden', 'true');
            letter.textContent = char === ' ' ? '\u00a0' : char;
            el.appendChild(letter);
        }

        const srOnly = document.createElement('span');
        srOnly.className = 'sr-only';
        srOnly.textContent = text;
        el.appendChild(srOnly);
    });
}
