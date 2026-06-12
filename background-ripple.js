const DEFAULTS = {
    cellSize: 64,
    borderColor: 'rgba(255, 255, 255, 0.09)',
    fillColor: '#000000',
    rippleRadius: 14,
};

function getThemeRippleColors() {
    const styles = getComputedStyle(document.documentElement);
    return {
        borderColor: styles.getPropertyValue('--ripple-cell-border').trim() || DEFAULTS.borderColor,
        fillColor: styles.getPropertyValue('--ripple-cell-bg').trim() || DEFAULTS.fillColor,
    };
}

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

    const cells = Array.from({ length: rows }, () => []);
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < rows * cols; i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;
        const cell = document.createElement('div');
        cell.className = 'ripple-cell';
        cell.dataset.row = String(row);
        cell.dataset.col = String(col);
        cell.style.borderColor = config.borderColor;
        cell.style.backgroundColor = config.fillColor;
        cells[row][col] = cell;
        fragment.appendChild(cell);
    }

    grid.appendChild(fragment);
    container.appendChild(grid);

    return { grid, rows, cols, cellSize, cells, rippleRadius: config.rippleRadius };
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
    return state.cells[row]?.[col] ?? null;
}

function setHoveredCell(hovered, next) {
    if (hovered && hovered !== next) {
        hovered.classList.remove('ripple-cell--hover');
    }
    if (next && hovered !== next) {
        next.classList.add('ripple-cell--hover');
    }
    return next;
}

export function initBackgroundRipple(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return null;

    const config = { ...DEFAULTS, ...options, ...getThemeRippleColors() };
    let state = buildGrid(container, config);
    let resizeTimer = null;
    let scrollTimer = null;
    let hoveredCell = null;
    let hoverRaf = null;
    let isScrolling = false;
    let lastPointer = { x: 0, y: 0 };
    let activeRippleCells = [];

    const clearActiveRipple = () => {
        for (const cell of activeRippleCells) {
            cell.classList.remove('ripple-cell--animate');
            cell.style.removeProperty('--delay');
            cell.style.removeProperty('--duration');
        }
        activeRippleCells = [];
    };

    const triggerRipple = (row, col) => {
        clearActiveRipple();

        const { cells, rows, cols, rippleRadius } = state;
        const rMin = Math.max(0, row - rippleRadius);
        const rMax = Math.min(rows - 1, row + rippleRadius);
        const cMin = Math.max(0, col - rippleRadius);
        const cMax = Math.min(cols - 1, col + rippleRadius);

        requestAnimationFrame(() => {
            for (let r = rMin; r <= rMax; r++) {
                for (let c = cMin; c <= cMax; c++) {
                    const distance = Math.hypot(row - r, col - c);
                    if (distance > rippleRadius) continue;

                    const cell = cells[r][c];
                    const delay = Math.max(0, distance * 50);
                    const duration = 200 + distance * 70;

                    cell.style.setProperty('--delay', `${delay}ms`);
                    cell.style.setProperty('--duration', `${duration}ms`);
                    cell.classList.add('ripple-cell--animate');
                    activeRippleCells.push(cell);
                }
            }
        });
    };

    const updateHover = () => {
        if (isScrolling) return;

        const coords = getCellCoords(state, lastPointer.x, lastPointer.y);
        if (!coords) {
            hoveredCell = setHoveredCell(hoveredCell, null);
            return;
        }

        hoveredCell = setHoveredCell(hoveredCell, getCellAt(state, coords.row, coords.col));
    };

    let lastBodyWidth = 0;
    let lastBodyHeight = 0;

    const refresh = () => {
        Object.assign(config, getThemeRippleColors());
        clearActiveRipple();
        hoveredCell = null;
        state = buildGrid(container, config);
        lastBodyWidth = document.body.clientWidth;
        lastBodyHeight = document.body.clientHeight;
    };

    const scheduleRefresh = () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            const w = document.body.clientWidth;
            const h = document.body.clientHeight;
            if (w === lastBodyWidth && h === lastBodyHeight) return;
            refresh();
        }, 200);
    };

    lastBodyWidth = document.body.clientWidth;
    lastBodyHeight = document.body.clientHeight;

    const onPointerMove = (e) => {
        lastPointer.x = e.clientX;
        lastPointer.y = e.clientY;
        if (isScrolling || hoverRaf) return;

        hoverRaf = requestAnimationFrame(() => {
            hoverRaf = null;
            updateHover();
        });
    };

    const onPointerLeave = () => {
        hoveredCell = setHoveredCell(hoveredCell, null);
    };

    const onScroll = () => {
        isScrolling = true;
        hoveredCell = setHoveredCell(hoveredCell, null);
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(() => {
            isScrolling = false;
        }, 150);
    };

    const onClick = (e) => {
        const coords = getCellCoords(state, e.clientX, e.clientY);
        if (!coords) return;
        triggerRipple(coords.row, coords.col);
    };

    const onAnimationEnd = (e) => {
        if (!e.target.classList?.contains('ripple-cell--animate')) return;
        e.target.classList.remove('ripple-cell--animate');
        e.target.style.removeProperty('--delay');
        e.target.style.removeProperty('--duration');
        activeRippleCells = activeRippleCells.filter((cell) => cell !== e.target);
    };

    container.addEventListener('animationend', onAnimationEnd);

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerleave', onPointerLeave);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('click', onClick);
    window.addEventListener('resize', scheduleRefresh);
    window.addEventListener('load', refresh);

    const destroy = () => {
        container.removeEventListener('animationend', onAnimationEnd);
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerleave', onPointerLeave);
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('click', onClick);
        window.removeEventListener('resize', scheduleRefresh);
        window.removeEventListener('load', refresh);
        clearTimeout(resizeTimer);
        clearTimeout(scrollTimer);
        if (hoverRaf) cancelAnimationFrame(hoverRaf);
        clearActiveRipple();
    };

    if (typeof ResizeObserver !== 'undefined') {
        const observer = new ResizeObserver(scheduleRefresh);
        observer.observe(document.body);

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
