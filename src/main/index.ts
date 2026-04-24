import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { app, BrowserWindow, shell } from 'electron'
import { registerIpcHandlers } from './ipc/handlers'
import { initializeLogger, logger } from './services/logger'

initializeLogger()

const __dirname = dirname(fileURLToPath(import.meta.url))

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1100,
    height: 760,
    minWidth: 720,
    minHeight: 560,
    backgroundColor: '#18181B',
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true
    }
  })

  win.once('ready-to-show', () => win.show())

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // 인앱 navigation 차단: 허용된 dev URL 또는 file:// 만 통과
  win.webContents.on('will-navigate', (event, url) => {
    const allowed =
      (process.env.ELECTRON_RENDERER_URL &&
        url.startsWith(process.env.ELECTRON_RENDERER_URL)) ||
      url.startsWith('file://')
    if (!allowed) event.preventDefault()
  })

  // 모든 권한 요청 거부 (마이크/카메라/위치 등 — 본 앱 무관)
  win.webContents.session.setPermissionRequestHandler((_wc, _perm, callback) => {
    callback(false)
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  registerIpcHandlers()
  createWindow()
  logger.info('window created')
})

// macOS 표준은 윈도우 닫혀도 dock에 잔류이지만, 이 앱은 단순 유틸이라
// 닫기 버튼 = 종료를 기대하는 사용자 흐름에 맞춤.
app.on('window-all-closed', () => {
  app.quit()
})
