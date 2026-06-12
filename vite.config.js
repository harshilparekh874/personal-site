import { defineConfig } from 'vite'

export default defineConfig({
    base: './',
    build: {
        target: 'esnext',
    },
    optimizeDeps: {
        include: ['rubiks-cube-solver'],
    },
})
