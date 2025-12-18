import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        globals: true,
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json-summary'],
            include: ['src/lib/**/*.ts'],
            exclude: ['**/*.test.ts', '**/*.d.ts'],
            thresholds: {
                lines: 30,
                branches: 30,
                functions: 30,
                statements: 30,
            },
        },
    },
})
