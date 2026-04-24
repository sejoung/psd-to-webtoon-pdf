import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/__tests__/**/*.test.ts', 'src/**/*.test.ts'],
    // 기본 `npm test`는 단위 테스트만. 통합 테스트는 빌드된 워커가 필요하므로
    // `npm run test:integration` 또는 `npm run test:all`을 통해 별도로 실행.
    exclude: ['**/node_modules/**', '**/dist/**', '**/*.integration.test.ts'],
    globals: false,
    testTimeout: 30000,
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
