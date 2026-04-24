import { FilePlus2 } from 'lucide-react'
import { useCallback } from 'react'
import { useT } from '../i18n/useT'
import { makeFileEntry, useMergeStore } from '../stores/mergeStore'
import { useToastStore } from '../stores/toastStore'
import { Button } from './Button'
import { Card, CardBody, CardHeader } from './Card'
import { FileRow } from './FileRow'

export function FileList() {
  const files = useMergeStore((s) => s.files)
  const addFiles = useMergeStore((s) => s.addFiles)
  const removeFile = useMergeStore((s) => s.removeFile)
  const moveUp = useMergeStore((s) => s.moveUp)
  const moveDown = useMergeStore((s) => s.moveDown)
  const pushToast = useToastStore((s) => s.push)
  const t = useT()

  const handleAdd = useCallback(async () => {
    const paths = await window.api.selectPsdFiles()
    if (paths.length === 0) return
    const stats = await window.api.statFiles(paths)
    const before = files.length
    addFiles(stats.map((s) => makeFileEntry(s.path, s.size)))
    const ignored = paths.length - (useMergeStore.getState().files.length - before)
    if (ignored > 0) {
      pushToast({
        message: t('fileList.duplicateSkipped', { count: ignored }),
        variant: 'info',
        durationMs: 3000
      })
    }
  }, [addFiles, files.length, pushToast, t])

  return (
    <Card className="flex h-full min-h-0 flex-col">
      <CardHeader>
        <h2 className="text-sm font-semibold">
          {t('fileList.title')}{' '}
          <span className="text-text-secondary">({files.length})</span>
        </h2>
        <Button size="sm" leftIcon={<FilePlus2 size={14} />} onClick={handleAdd}>
          {t('fileList.addButton')}
        </Button>
      </CardHeader>
      <CardBody className="min-h-0 flex-1 overflow-y-auto p-0">
        {files.length === 0 ? (
          <div className="flex h-full items-center justify-center p-6 text-sm text-text-secondary">
            {t('fileList.empty')}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {files.map((file, index) => (
              <FileRow
                key={file.path}
                index={index}
                file={file}
                total={files.length}
                onMoveUp={moveUp}
                onMoveDown={moveDown}
                onRemove={removeFile}
              />
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  )
}
