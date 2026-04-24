import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

/**
 * 통합 테스트 전용 설정. 빌드된 워커(`out/main/merge.worker.js`)를 spawn하므로
 * `npm run build` 가 선행되어야 함. `npm run test:integration`/`test:all`이 처리.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.integration.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    globals: false,
    testTimeout: 60_000,
    // 워커 spawn은 native 의존이라 병렬 실행을 피해 안정성 확보
    fileParallelism: false
  },
  resolve: {
    alias: {
      '@shared': resolve(__dirname, 'src/shared')
    }
  }
})
