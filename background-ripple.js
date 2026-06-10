const DEFAULTS = {
    cellSize: 56,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    fillColor: '#000000',
};

function getPageHeight() {
    return Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        window.innerHeight
    );
}

function buildGrid(container, config) {
    const cellSize = config.cellSize;
    const cols = Math.max(Math.ceil(window.innerWidth / cellSize) + 1, 1);
    const rows = Math.max(Math.ceil(getPageHeight() / cellSize) + 1, 1);
    const gridWidth = Math.max(cols * cellSize, window.innerWidth);
    const gridHeight = rows * cellSize;

    container.innerHTML = '';
    container.style.height = `${gridHeight}px`;
    container.style.setProperty('--ripple-cols', cols);
    container.style.setProperty('--ripple-rows', rows);
    container.style.setProperty('--ripple-cell-size', `${cellSize}px`);

    const grid = document.createElement('div');
    grid.className = 'ripple-grid';
    grid.style.width = `${gridWidth}px`;
    grid.setAttribute('role', 'presentation');

    const fragment = document.createDocumentFragment();
    for (let i = 0; i < rows * cols; i++) {
        const cell = document.createElement('div');
        cell.className = 'ripple-cell';
        cell.dataset.row = String(Math.floor(i / cols));
        cell.dataset.col = String(i % cols);
        cell.style.borderColor = config.borderColor;
        cell.style.backgroundColor = config.fillColor;
        fragment.appendChild(cell);
    }

    grid.appendChild(fragment);
    container.appendChild(grid);

    return { grid, rows, cols };
}

function triggerRipple(grid, row, col) {
    grid.querySelectorAll('.ripple-cell').forEach((cell) => {
        cell.classList.remove('ripple-cell--animate');
        cell.style.removeProperty('--delay');
        cell.style.removeProperty('--duration');
    });

    grid.querySelectorAll('.ripple-cell').forEach((cell) => {
        const rowIdx = Number(cell.dataset.row);
        const colIdx = Number(cell.dataset.col);
        const distance = Math.hypot(row - rowIdx, col - colIdx);
        const delay = Math.max(0, distance * 55);
        const duration = 200 + distance * 80;

        cell.style.setProperty('--delay', `${delay}ms`);
        cell.style.setProperty('--duration', `${duration}ms`);
        cell.classList.add('ripple-cell--animate');
    });
}

export function initBackgroundRipple(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return null;

    const config = { ...DEFAULTS, ...options };
    let state = buildGrid(container, config);
    let resizeTimer = null;

    const refresh = () => {
        state = buildGrid(container, config);
    };

    const scheduleRefresh = () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(refresh, 120);
    };

    container.addEventListener('click', (e) => {
        const cell = e.target.closest('.ripple-cell');
        if (!cell || !container.contains(cell)) return;

        triggerRipple(
            state.grid,
            Number(cell.dataset.row),
            Number(cell.dataset.col)
        );
    });

    window.addEventListener('resize', scheduleRefresh);
    window.addEventListener('load', refresh);

    if (typeof ResizeObserver !== 'undefined') {
        const observer = new ResizeObserver(scheduleRefresh);
        observer.observe(document.body);
        observer.observe(document.documentElement);

        return {
            refresh,
            destroy: () => {
                observer.disconnect();
                window.removeEventListener('resize', scheduleRefresh);
                window.removeEventListener('load', refresh);
                clearTimeout(resizeTimer);
            },
        };
    }

    return {
        refresh,
        destroy: () => {
            window.removeEventListener('resize', scheduleRefresh);
            window.removeEventListener('load', refresh);
            clearTimeout(resizeTimer);
        },
    };
}
