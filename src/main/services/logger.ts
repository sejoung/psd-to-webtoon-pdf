import { app } from 'electron'
import log from 'electron-log/main'

/**
 * 영구 로그 위치:
 * - macOS: ~/Library/Logs/<appName>/main.log
 * - Windows: %APPDATA%/<appName>/logs/main.log
 * - Linux: ~/.config/<appName>/logs/main.log
 *
 * Renderer/Worker 모두 이 파일에 누적되도록 단일화.
 */
export function initializeLogger(): void {
  log.initialize()

  log.transports.file.level = 'info'
  log.transports.console.level = process.env.NODE_ENV === 'development' ? 'debug' : 'info'
  log.transports.file.maxSize = 10 * 1024 * 1024 // 10MB → rotation
  log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {scope}{text}'

  // 메인 프로세스의 console.* 호출도 모두 로그 파일로 캡처
  Object.assign(console, log.functions)

  // 메인의 미처리 예외 / 거부도 자동 캡처
  log.errorHandler.startCatching({
    showDialog: false
  })

  log.info('=== app start ===', { version: app.getVersion(), platform: process.platform })
}

export function getLogPath(): string {
  return log.transports.file.getFile().path
}

export function getLogDirectory(): string {
  const file = log.transports.file.getFile().path
  return file.substring(0, file.lastIndexOf('/')) || file
}

export const logger = log.scope('main')
export const workerLogger = log.scope('worker')
export const rendererLogger = log.scope('renderer')
