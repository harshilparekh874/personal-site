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

    return { grid, rows, cols, cellSize };
}

function getCellCoords(state, clientX, clientY) {
    const { grid, rows, cols, cellSize } = state;
    const rect = grid.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
        return null;
    }

    const col = Math.floor(x / cellSize);
    const row = Math.floor(y / cellSize);

    if (row < 0 || col < 0 || row >= rows || col >= cols) {
        return null;
    }

    return { row, col };
}

function getCellAt(state, row, col) {
    return state.grid.querySelector(`.ripple-cell[data-row="${row}"][data-col="${col}"]`);
}

function setHoveredCell(state, hovered, next) {
    if (hovered && hovered !== next) {
        hovered.classList.remove('ripple-cell--hover');
    }
    if (next && hovered !== next) {
        next.classList.add('ripple-cell--hover');
    }
    return next;
}

function triggerRipple(grid, row, col) {
    grid.querySelectorAll('.ripple-cell').forEach((cell) => {
        cell.classList.remove('ripple-cell--animate');
        cell.style.removeProperty('--delay');
        cell.style.removeProperty('--duration');
    });

    requestAnimationFrame(() => {
        grid.querySelectorAll('.ripple-cell').forEach((cell) => {
            const rowIdx = Number(cell.dataset.row);
            const colIdx = Number(cell.dataset.col);
            const distance = Math.hypot(row - rowIdx, col - colIdx);
            const delay = Math.max(0, distance * 55);
            const duration = 220 + distance * 90;

            cell.style.setProperty('--delay', `${delay}ms`);
            cell.style.setProperty('--duration', `${duration}ms`);
            cell.classList.add('ripple-cell--animate');
        });
    });
}

export function initBackgroundRipple(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return null;

    const config = { ...DEFAULTS, ...options };
    let state = buildGrid(container, config);
    let resizeTimer = null;
    let hoveredCell = null;

    const refresh = () => {
        hoveredCell = null;
        state = buildGrid(container, config);
    };

    const scheduleRefresh = () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(refresh, 120);
    };

    const onMouseMove = (e) => {
        const coords = getCellCoords(state, e.clientX, e.clientY);
        if (!coords) {
            hoveredCell = setHoveredCell(state, hoveredCell, null);
            return;
        }
        hoveredCell = setHoveredCell(state, hoveredCell, getCellAt(state, coords.row, coords.col));
    };

    const onMouseLeave = () => {
        hoveredCell = setHoveredCell(state, hoveredCell, null);
    };

    const onClick = (e) => {
        const coords = getCellCoords(state, e.clientX, e.clientY);
        if (!coords) return;
        triggerRipple(state.grid, coords.row, coords.col);
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mouseleave', onMouseLeave);
    window.addEventListener('click', onClick);

    window.addEventListener('resize', scheduleRefresh);
    window.addEventListener('load', refresh);

    const destroy = () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseleave', onMouseLeave);
        window.removeEventListener('click', onClick);
        window.removeEventListener('resize', scheduleRefresh);
        window.removeEventListener('load', refresh);
        clearTimeout(resizeTimer);
    };

    if (typeof ResizeObserver !== 'undefined') {
        const observer = new ResizeObserver(scheduleRefresh);
        observer.observe(document.body);
        observer.observe(document.documentElement);

        return {
            refresh,
            destroy: () => {
                observer.disconnect();
                destroy();
            },
        };
    }

    return { refresh, destroy };
}
