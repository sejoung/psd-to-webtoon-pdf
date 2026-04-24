import { useMergeStore } from '../stores/mergeStore'
import { Card, CardBody, CardHeader } from './Card'

const RADIO_BASE = 'flex cursor-pointer items-center gap-2 text-sm text-text-primary'

function Radio({
  checked,
  onChange,
  label,
  children
}: {
  checked: boolean
  onChange: () => void
  label: string
  children?: React.ReactNode
}) {
  return (
    <label className={RADIO_BASE}>
      <input
        type="radio"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 cursor-pointer accent-accent"
      />
      <span>{label}</span>
      {children}
    </label>
  )
}

function Field({
  label,
  children,
  hint
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-text-secondary">
          {label}
        </span>
        {hint && <span className="text-xs text-text-secondary">{hint}</span>}
      </div>
      {children}
    </div>
  )
}

export function OptionsPanel() {
  const options = useMergeStore((s) => s.options)
  const setOptions = useMergeStore((s) => s.setOptions)

  const isJpeg = options.embed.format === 'jpeg'
  const isAutoSize = options.pageSize.mode === 'auto'

  return (
    <Card>
      <CardHeader>
        <h2 className="text-sm font-semibold">옵션</h2>
      </CardHeader>
      <CardBody className="flex flex-col gap-6">
        <Field label="임베드 포맷">
          <div className="flex flex-col gap-2">
            <Radio
              label="JPEG"
              checked={isJpeg}
              onChange={() =>
                setOptions({
                  embed: { format: 'jpeg', quality: options.embed.quality ?? 95 }
                })
              }
            >
              {isJpeg && (
                <div className="ml-3 flex items-center gap-2">
                  <input
                    type="range"
                    min={60}
                    max={100}
                    step={1}
                    value={options.embed.quality ?? 95}
                    onChange={(e) =>
                      setOptions({
                        embed: { format: 'jpeg', quality: Number(e.target.value) }
                      })
                    }
                    className="h-1.5 w-40 cursor-pointer accent-accent"
                  />
                  <span className="w-8 text-right tabular-nums text-xs text-text-secondary">
                    {options.embed.quality ?? 95}
                  </span>
                </div>
              )}
            </Radio>
            <Radio
              label="PNG (무손실)"
              checked={!isJpeg}
              onChange={() => setOptions({ embed: { format: 'png' } })}
            />
          </div>
        </Field>

        <Field label="페이지 크기">
          <div className="flex flex-col gap-2">
            <Radio
              label="자동 (원본 크기 유지)"
              checked={isAutoSize}
              onChange={() => setOptions({ pageSize: { mode: 'auto' } })}
            />
            <Radio
              label="고정 너비"
              checked={!isAutoSize}
              onChange={() =>
                setOptions({
                  pageSize: {
                    mode: 'fixed-width',
                    width: options.pageSize.width ?? 690,
                    withoutEnlargement: options.pageSize.withoutEnlargement ?? true
                  }
                })
              }
            >
              {!isAutoSize && (
                <div className="ml-3 flex items-center gap-2">
                  <input
                    type="number"
                    min={100}
                    max={20000}
                    step={10}
                    value={options.pageSize.width ?? 690}
                    onChange={(e) =>
                      setOptions({
                        pageSize: {
                          mode: 'fixed-width',
                          width: Math.max(1, Number(e.target.value) || 0),
                          withoutEnlargement: options.pageSize.withoutEnlargement ?? true
                        }
                      })
                    }
                    className="h-7 w-20 rounded-card border border-border bg-bg px-2 text-right text-xs text-text-primary focus:border-accent focus:outline-none"
                  />
                  <span className="text-xs text-text-secondary">px</span>
                </div>
              )}
            </Radio>
            {!isAutoSize && (
              <label className="ml-6 mt-1 flex cursor-pointer items-center gap-2 text-xs text-text-secondary">
                <input
                  type="checkbox"
                  checked={options.pageSize.withoutEnlargement ?? true}
                  onChange={(e) =>
                    setOptions({
                      pageSize: {
                        ...options.pageSize,
                        mode: 'fixed-width',
                        withoutEnlargement: e.target.checked
                      }
                    })
                  }
                  className="h-3.5 w-3.5 cursor-pointer accent-accent"
                />
                원본보다 작을 땐 확대하지 않기
              </label>
            )}
          </div>
        </Field>

        <Field label="페이지 간 여백" hint="px (페이지 사이 흰 공간)">
          <input
            type="number"
            min={0}
            max={2000}
            step={5}
            value={options.pageGapPx}
            onChange={(e) =>
              setOptions({ pageGapPx: Math.max(0, Number(e.target.value) || 0) })
            }
            className="h-8 w-24 rounded-card border border-border bg-bg px-2 text-right text-sm text-text-primary focus:border-accent focus:outline-none"
          />
        </Field>

        <Field label="오류 발생 시">
          <div className="flex flex-col gap-2">
            <Radio
              label="계속 진행 (실패 파일 건너뛰기)"
              checked={options.onError === 'skip'}
              onChange={() => setOptions({ onError: 'skip' })}
            />
            <Radio
              label="중단"
              checked={options.onError === 'abort'}
              onChange={() => setOptions({ onError: 'abort' })}
            />
          </div>
        </Field>
      </CardBody>
    </Card>
  )
}
