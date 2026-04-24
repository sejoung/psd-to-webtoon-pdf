import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/__tests__/**/*.test.ts', 'src/**/*.test.ts'],
    globals: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/shared/**/*.ts'],
      exclude: ['src/shared/types/**']
    }
  },
  resolve: {
    alias: {
      '@shared': resolve(__dirname, 'src/shared')
    }
  }
})
