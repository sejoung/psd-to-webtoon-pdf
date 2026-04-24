import { contextBridge } from 'electron'

const api = {
  ping: () => 'pong'
}

contextBridge.exposeInMainWorld('api', api)

export type Api = typeof api
