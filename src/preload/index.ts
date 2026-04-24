import { contextBridge, ipcRenderer, webUtils } from 'electron'
import type { MergeProgress, MergeRequest, MergeResult } from '../shared/types/index'

const api = {
  /** OS 식별자 — 플랫폼별 UI 분기(예: macOS 신호등 padding)에 사용. */
  platform: process.platform as NodeJS.Platform,

  selectPsdFiles: (): Promise<string[]> => ipcRenderer.invoke('select-psd-files'),

  /** Electron 32+ sandboxed renderer에서 드롭된 File의 절대 경로 추출. */
  getPathForFile: (file: File): string => webUtils.getPathForFile(file),

  /** 파일 경로 배열에 대해 사이즈를 조회. 접근 불가 파일은 size=null. */
  statFiles: (paths: string[]): Promise<Array<{ path: string; size: number | null }>> =>
    ipcRenderer.invoke('stat-files', paths),

  selectOutputPdf: (opts: { defaultName: string }): Promise<string | null> =>
    ipcRenderer.invoke('select-output-pdf', opts),

  startMerge: (req: MergeRequest): Promise<MergeResult> =>
    ipcRenderer.invoke('start-merge', req),

  cancelMerge: (jobId: string): Promise<boolean> =>
    ipcRenderer.invoke('cancel-merge', { jobId }),

  /** 진행률 이벤트 구독. 반환된 unsubscribe를 호출해 해제. */
  onMergeProgress: (cb: (progress: MergeProgress) => void): (() => void) => {
    const handler = (_e: Electron.IpcRendererEvent, progress: MergeProgress): void =>
      cb(progress)
    ipcRenderer.on('merge-progress', handler)
    return () => {
      ipcRenderer.removeListener('merge-progress', handler)
    }
  },

  openPath: (path: string): Promise<void> => ipcRenderer.invoke('open-path', path),

  showInFolder: (path: string): Promise<void> =>
    ipcRenderer.invoke('show-in-folder', path)
}

contextBridge.exposeInMainWorld('api', api)

export type Api = typeof api
