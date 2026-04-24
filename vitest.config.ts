import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

/**
 * 단위 테스트 설정. 운영 소스(`src/`)와 분리된 `tests/unit/` 만 실행.
 * 통합 테스트는 `vitest.integration.config.ts` 참조.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/out/**'],
    globals: false,
    testTimeout: 30_000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: ['src/**/*.d.ts', 'src/shared/types/**', 'src/renderer/index.html']
    }
  },
  resolve: {
    alias: {
      '@shared': resolve(__dirname, 'src/shared'),
      '@main': resolve(__dirname, 'src/main'),
      '@renderer': resolve(__dirname, 'src/renderer/src')
    }
  }
})
