import { stat } from 'node:fs/promises'
import { BrowserWindow, dialog, ipcMain, shell } from 'electron'
import type { MergeRequest, MergeResult } from '../../shared/types/index'

export function registerIpcHandlers(): void {
  ipcMain.handle('select-psd-files', async (event): Promise<string[]> => {
    const win = BrowserWindow.fromWebContents(event.sender)
    const result = win
      ? await dialog.showOpenDialog(win, openOpts)
      : await dialog.showOpenDialog(openOpts)
    if (result.canceled) return []
    return result.filePaths
  })

  ipcMain.handle(
    'select-output-pdf',
    async (event, opts: { defaultName: string }): Promise<string | null> => {
      const win = BrowserWindow.fromWebContents(event.sender)
      const saveOpts: Electron.SaveDialogOptions = {
        title: 'Save merged PDF',
        defaultPath: opts.defaultName,
        filters: [{ name: 'PDF', extensions: ['pdf'] }]
      }
      const result = win
        ? await dialog.showSaveDialog(win, saveOpts)
        : await dialog.showSaveDialog(saveOpts)
      if (result.canceled || !result.filePath) return null
      return result.filePath
    }
  )

  ipcMain.handle(
    'start-merge',
    async (_event, _req: MergeRequest): Promise<MergeResult> => {
      throw new Error('start-merge not implemented yet (Phase 4)')
    }
  )

  ipcMain.handle(
    'cancel-merge',
    async (_event, _payload: { jobId: string }): Promise<boolean> => {
      return false
    }
  )

  ipcMain.handle(
    'stat-files',
    async (
      _event,
      paths: string[]
    ): Promise<Array<{ path: string; size: number | null }>> => {
      return Promise.all(
        paths.map(async (path) => {
          try {
            const s = await stat(path)
            return { path, size: s.size }
          } catch {
            return { path, size: null }
          }
        })
      )
    }
  )

  ipcMain.handle('open-path', async (_event, path: string): Promise<void> => {
    await shell.openPath(path)
  })

  ipcMain.handle('show-in-folder', async (_event, path: string): Promise<void> => {
    shell.showItemInFolder(path)
  })
}

const openOpts: Electron.OpenDialogOptions = {
  title: 'Select PSD files',
  buttonLabel: 'Add',
  properties: ['openFile', 'multiSelections'],
  filters: [{ name: 'Photoshop', extensions: ['psd'] }]
}
