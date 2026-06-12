const STORAGE_KEY = 'hp-theme';

export function getStoredTheme() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;

    if (window.matchMedia('(prefers-color-scheme: light)').matches) {
        return 'light';
    }

    return 'dark';
}

export function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);

    const input = document.getElementById('theme-toggle-input');
    if (input) {
        input.checked = theme === 'dark';
    }

    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
}

export function initTheme() {
    applyTheme(getStoredTheme());

    const input = document.getElementById('theme-toggle-input');
    input?.addEventListener('change', () => {
        applyTheme(input.checked ? 'dark' : 'light');
    });
}
