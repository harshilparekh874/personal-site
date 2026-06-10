let cachedApi = null;

function resolveSolverApi(mod) {
    if (!mod) {
        throw new Error('Rubik\'s cube solver failed to load');
    }

    if (mod.i && typeof mod.i === 'object') {
        return resolveSolverApi(mod.i);
    }

    // Vite exposes RubiksCube as a named export; default is the solve function.
    if (mod.RubiksCube && typeof mod.default === 'function') {
        return { RubiksCube: mod.RubiksCube, solveCube: mod.default };
    }

    const source = mod.default ?? mod;

    if (source?.RubiksCube && typeof source.default === 'function') {
        return { RubiksCube: source.RubiksCube, solveCube: source.default };
    }

    if (typeof source === 'function' && source.RubiksCube) {
        return { RubiksCube: source.RubiksCube, solveCube: source };
    }

    throw new Error('Rubik\'s cube solver failed to load');
}

export async function getSolverApi() {
    if (!cachedApi) {
        const mod = await import('rubiks-cube-solver');
        cachedApi = resolveSolverApi(mod);
    }
    return cachedApi;
}

export default getSolverApi;
