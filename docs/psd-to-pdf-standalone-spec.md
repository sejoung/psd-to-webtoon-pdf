# PSD to PDF Merger — Standalone Tool Specification

**상태**: 제안 / 의사결정 검토 단계
**최종 수정**: 2026-04-23
**포지션**: 이 문서는 **완전 독립형** 기획서입니다. 외부 레포지토리/코드베이스를 참조하지 않으며, 착수 시점에 새 저장소에서 이 문서만으로 설계 결정과 구현에 필요한 컨텍스트가 모두 제공되도록 작성되었습니다.

---

## 1. 개요

### 1.1 제품 한 줄 요약
여러 장의 Photoshop(`.psd`) 파일을 **페이지 단위로 묶어 하나의 PDF 파일로 병합**하는 데스크톱 유틸리티.

### 1.2 주 사용자 / 사용 시나리오
- **웹툰/만화 제작자**: 회차 분량 PSD 30~100개를 한 묶음 PDF로 변환 → 클라이언트 검수용, 플랫폼 업로드 전 사전 정리, 프린트 샘플 생성
- **일러스트레이터/디자이너**: 프로젝트 스냅샷을 PDF로 아카이브
- **편집자/디렉터**: PSD를 열지 않고 PDF 뷰어에서 빠르게 순차 리뷰

### 1.3 핵심 차별점
- **대용량 안전**: 30 × 200MB PSD(총 6GB)도 워커 메모리 1GB 이내로 처리
- **네이티브 크래시 회피**: 거대 이미지 처리의 고질적 함정(§3)을 설계 단계에서 전부 회피
- **페이지 기반**: 세로로 이어붙인 "한 장의 거대한 이미지"를 만들지 않음 → 수 억 픽셀 단일 캔버스의 모든 문제 원천 차단
- **오프라인 동작**: 네트워크 불필요, 모든 처리 로컬

### 1.4 명시적 **비**목표 (Out of Scope)
- 원본 PSD 편집 기능 (뷰어/컨버터만)
- PDF에서 PSD로 역변환
- 클라우드 동기화/협업
- 자동 슬라이싱, 웹툰 플랫폼별 내보내기 (다른 도구의 영역)
- PSD 레이어의 인터랙티브 보존 (v2+ 고려)

---

## 2. 요구사항

### 2.1 기능 요구사항

| 항목 | MVP | v1 | v2+ |
|---|:---:|:---:|:---:|
| `.psd` 파일 다중 입력 (드롭 + 다이얼로그) | ✅ | | |
| 파일 순서 재정렬 (▲▼ 버튼) | ✅ | | |
| 파일명 자연정렬 기본 적용 | ✅ | | |
| PDF 출력 (1 PSD = 1 페이지) | ✅ | | |
| JPEG 임베드 (품질 옵션) | ✅ | | |
| 진행률 표시 | ✅ | | |
| 저장 다이얼로그 | ✅ | | |
| 완료 후 "PDF 열기" / "폴더에서 보기" | ✅ | | |
| PNG 무손실 임베드 옵션 | | ✅ | |
| 고정 너비 리사이즈 옵션 | | ✅ | |
| 페이지 간 여백 | | ✅ | |
| 취소 기능 | | ✅ | |
| 일부 실패 시 skip/abort 선택 | | ✅ | |
| 드래그 리오더 | | ✅ | |
| PSD 북마크(PDF Outline) | | ✅ | |
| `.psb`(대형 PSD) 지원 | | | ✅ |
| 긴 PSD를 여러 페이지로 분할 | | | ✅ |
| 레이어 보존 PDF (PDF OCGs) | | | ✅ |
| 배치 모드 (폴더 단위 자동 처리) | | | ✅ |
| CLI 버전 | | | ✅ |

### 2.2 비기능 요구사항

| 항목 | 목표값 |
|---|---|
| 워커 피크 메모리 | 1 GB 이내 (PSD 개별 크기 1 GB까지) |
| 30 × 200MB 처리 시간 | 2~5분 (고성능 기기 기준) |
| 결과 PDF 무결성 | Adobe Acrobat / macOS Preview / Windows 기본 뷰어 전부 정상 표시 |
| 오프라인 완전 동작 | 네트워크 요청 없음 |
| 사용자 입력 2+ 파일 검증 | 1개 이하 드롭 시 즉시 경고 |
| UI 반응성 | 병합 중에도 UI 프리즈 없음 (워커 분리 필수) |

---

## 3. ⚠️ 반드시 숙지해야 할 기술적 함정

이 섹션은 구현 전 반드시 읽어야 하는 **필수 배경지식**입니다. 각 항목은 실측으로 확인된 문제이며, 설계가 이를 회피하도록 구성되어야 합니다.

### 3.1 Electron/Node 메모리 모델의 비직관성
- **V8 heap limit(`--max-old-space-size`, `maxOldGenerationSizeMb`)은 `Buffer`와 네이티브 라이브러리 메모리에 적용되지 않음**
- Node `Buffer` 중 4KB 초과분은 `Buffer.allocUnsafeSlow` 경유로 **system malloc** 할당 → V8 heap과 무관
- Sharp/libvips, libpng, ag-psd의 내부 버퍼 모두 system malloc
- **결론**: "heap을 8GB로 올렸는데 왜 크래시가?"의 답은 "V8과 관련 없는 네이티브 OOM이어서". `maxOldGenerationSizeMb` 늘려도 무의미한 경우 많음

### 3.2 네이티브 크래시는 JS 예외로 잡히지 않는다
- Sharp/libvips가 수억 픽셀 이미지 처리 중 내부 할당 실패 → **segfault**
- Node는 try/catch로 **절대** 잡을 수 없음
- Electron 전체 프로세스가 즉사 → 앱이 "조용히 재시작"
- 로그에 에러 없음, 단순히 `App started`가 다시 찍힘
- **대응**: 네이티브 라이브러리에 거대 입력을 주지 않는 **설계**로 회피해야 함. 사후 처리 불가능

### 3.3 Sharp의 `raw` 옵션은 파일 경로 입력에서 동작하지 않음
- `sharp(filePath, { raw: { width, height, channels: 4 } })` → **"Input file contains unsupported image format" 에러**
- 원인: libvips 바인딩(`OpenInput`)에서 `raw` 옵션 처리 분기가 **Buffer 입력 경로에만 존재**
  ```cpp
  if (descriptor->isBuffer) {
    if (descriptor->rawChannels > 0) { /* raw 처리 */ }
  }
  ```
- 파일 경로는 항상 `DetermineImageType`(매직 바이트 감지)을 거쳐 raw RGBA에는 포맷을 못 찾아 실패
- **회피법**: `sharp(buffer, { raw })` 또는 스트림 입력 `createReadStream(path).pipe(sharpInstance)` 사용

### 3.4 libpng는 전체 이미지를 메모리에 들고 써야 한다
- Sharp/libvips의 PNG writer는 libpng의 `png_write_image()`를 호출 → **row pointer 배열 형태로 전체 이미지 보유 필수**
- 수억 픽셀(수 GB RGBA) 입력 시 할당 실패 또는 silent truncation
- 잘린 PNG는 생성되지만 **디코더가 거부**("file corrupted" 에러)
- 로그에 실패 없이 파일만 깨진 채 남음
- **결론**: 페이지 기반 접근(개별 페이지는 작음)이 안전. **단일 거대 PNG 생성 금지**

### 3.5 JPEG의 차원 한계
- JPEG 표준 최대 크기: **65535 × 65535** 픽셀 (16-bit 필드)
- 너비 2000px × 높이 300000px 같은 웹툰 형식 이미지는 JPEG로 **저장 불가**
- **결론**: 세로로 매우 긴 단일 이미지를 JPEG로 내보내려 하지 말 것

### 3.6 PDF 라이브러리 선정 시 메모리 전략 차이
| 라이브러리 | 작성 방식 | 거대 문서 처리 | 추천 여부 |
|---|---|---|---|
| **PDFKit** | 스트리밍 (`.pipe(writeStream)`) — 페이지 즉시 flush | 안전 | ✅ **추천** |
| **pdf-lib** | 전체 문서 메모리 보유 후 한 번에 serialize | 수백 MB 이상 OOM | ❌ |
| **jsPDF** | 주로 브라우저 지향, 대용량 부적합 | 비권장 | ❌ |
| **HummusJS/muhammara** | 스트리밍 지원 | 네이티브 의존성 관리 필요 | 검토 |

### 3.7 Chromium 렌더러는 거대 이미지를 `<img>`로 표시하지 못한다
- 일반적으로 **16384 × 16384 또는 약 268M 픽셀** 한계 (빌드/플랫폼마다 조금 다름)
- 한계 초과 시 **조용히 렌더링 실패** (에러 없이 빈 이미지)
- UI에서 결과 PDF 미리보기는 PDF 뷰어(pdfjs 등)로 위임. `<img>` 직접 로드 금지

### 3.8 ag-psd는 canvas 팩토리 주입이 필요할 수 있다
- 합성 이미지(composite)가 PSD에 포함돼 있으면 `useImageData: true` 경로만으로 충분
- 레이어만 있고 composite가 없는 PSD는 ag-psd가 **canvas로 재합성**해야 함
- Node 환경엔 HTMLCanvasElement가 없으므로 `@napi-rs/canvas`의 `createCanvas`를 `initializeCanvas()`로 주입 필요
- **미주입 시**: "PSD has no composite image data and no reconstructable canvas" 같은 에러로 특정 PSD만 파싱 실패

### 3.9 PSD 파일 크기 ≠ 디코딩 후 메모리
- 200MB PSD는 압축된 바이트. **RGBA 디코딩 후는 5~10배**로 팽창 가능
- 예: 200MB PSD → 6000×10000 = 6천만 픽셀 → **240MB RGBA**
- 대형 PSD는 12000×20000 = 2억 픽셀 → 960MB RGBA
- 여러 장을 **동시에** 메모리에 들지 않도록 **반드시 순차 처리**

### 3.10 Electron worker thread 스폰 시 경로 해결
- 번들러(rollup 등)가 코드 분할 시 `__dirname`이 entry가 아닌 **chunk 파일 위치**를 가리킴
- 결과: `join(__dirname, 'workers', 'foo.worker.js')`가 잘못된 경로를 가리킬 수 있음
- **회피**: 후보 경로 배열로 `fs.existsSync` 검사 후 선택하는 방어적 패턴 사용

### 3.11 파일 핸들 / 스트림 누수
- 부분 파일 생성 후 에러 발생 시 핸들이 남으면 OS 레벨 파일 락, 삭제 실패
- **필수 패턴**: `try/finally`로 `fh.close()`, `writeStream.close()` 보장
- 취소/에러 시 **부분 PDF 파일 반드시 삭제** (사용자 혼동 방지)

---

## 4. 아키텍처 개요

### 4.1 기본 원칙
1. **페이지 단위 처리**: 1 PSD → 1 작업 단위 → 1 PDF 페이지. 절대 세로로 잇지 말 것
2. **워커 스레드 강제**: main process는 I/O와 UI만. 파싱/인코딩/PDF 생성은 **dedicated worker**
3. **스트리밍 쓰기**: PDF는 `createWriteStream`으로 디스크로 즉시 내려보냄. 메모리 보유 최소화
4. **순차 처리**: N개 PSD를 **한 번에 한 개씩**. 병렬 처리는 피크 메모리 N배 → 금지
5. **디스크 우선**: 메모리보다 디스크가 싸다. 임시 저장, 스트림 파이프 적극 활용

### 4.2 데이터 흐름

```
┌─────────────┐    ┌─────────────┐    ┌──────────────┐
│  Renderer   │    │    Main     │    │  Merge       │
│  (React UI) │←──→│   Process   │←──→│  Worker      │
│             │IPC │             │    │  (dedicated) │
└─────────────┘    └─────────────┘    └──────┬───────┘
                                             │
                                             │ PSD parse (ag-psd)
                                             │ RGBA extract
                                             │ Resize/encode (Sharp)
                                             │ Add page to PDF (PDFKit)
                                             │
                                             ▼
                                        ┌──────────┐
                                        │ output.pdf│
                                        └──────────┘
                                        (streaming write)
```

### 4.3 왜 페이지 기반인가 (대안 비교)

| 전략 | 피크 메모리 | 네이티브 크래시 위험 | 결과물 뷰어 호환성 | 평가 |
|---|---|---|---|---|
| **세로 병합 단일 PNG** | 수 GB RGBA + libpng 내부 버퍼 | 매우 높음 (§3.4) | 낮음 (뷰어별 한계 상이) | ❌ |
| **세로 병합 단일 JPEG** | 수 GB RGBA | 높음 | 차원 한계 (§3.5) | ❌ |
| **세로 병합 BigTIFF** | tiled write로 저감 | 중 | 중 (Preview OK, 일부 뷰어 안 됨) | ⚠️ |
| **내부 raw 포맷 + 별도 뷰어** | 낮음 | 낮음 | 0 (커스텀 포맷) | ❌ (재사용성 없음) |
| **PDF 페이지 기반** | 페이지당 수백 MB | 낮음 | 높음 (보편) | ✅ |

PDF 페이지 기반이 **유일하게 모든 축에서 안전한 옵션**.

---

## 5. 기술 스택 (권장)

| 레이어 | 선정 | 버전(예시) | 메모 |
|---|---|---|---|
| 앱 프레임워크 | **Electron** | 최신 안정 (30+) | 크로스 플랫폼 데스크톱, Node API 접근 |
| PSD 파서 | **ag-psd** | 최신 | pure JS, canvas 주입 지원 |
| Canvas 폴리필 | **@napi-rs/canvas** | 최신 | Node에서 `createCanvas` 제공 |
| 이미지 인코더 | **Sharp** | 최신 | JPEG/PNG 고속, 리사이즈 |
| PDF 라이터 | **PDFKit** | 최신 | **스트리밍 필수 (§3.6)** |
| 프론트엔드 | **React** | 19+ | |
| 상태관리 | **Zustand** | 5+ | 가볍고 단순 |
| 스타일 | **Tailwind CSS** | 4+ | 또는 CSS Modules |
| 번들러 | **electron-vite** + **Vite** | 최신 | Electron + Vite 통합 |
| 언어 | **TypeScript** | 5+ | strict 모드 |
| 테스트 | **Vitest** + **Playwright** | 최신 | 단위 + E2E |
| 패키징 | **electron-builder** | 최신 | dmg/exe/AppImage |

### 5.1 대안 검토 요약
- **Tauri** 대안 검토: Rust 기반으로 메모리 효율 좋지만 PSD 파싱 생태계(ag-psd 대체) 빈약. Electron 유지 권장
- **pdf-lib** 대신 **PDFKit**: §3.6 참조
- **node-canvas** 대신 **@napi-rs/canvas**: 더 현대적, prebuild 제공, 설치 실패율 낮음

---

## 6. 프로젝트 구조 (제안)

```
psd-to-pdf/
├── README.md
├── README_ko.md
├── LICENSE
├── package.json
├── electron.vite.config.ts
├── tsconfig.json
├── tsconfig.node.json
├── tsconfig.web.json
├── playwright.config.ts
├── vitest.config.ts
├── src/
│   ├── main/
│   │   ├── index.ts                     # 앱 부트, BrowserWindow 생성
│   │   ├── ipc/
│   │   │   └── handlers.ts              # IPC 핸들러 등록 + 입력 검증
│   │   ├── services/
│   │   │   ├── merge-orchestrator.ts    # 워커 스폰, 진행 이벤트 릴레이, 취소 관리
│   │   │   └── file-dialog.ts           # open/save 다이얼로그 래퍼
│   │   └── workers/
│   │       └── merge.worker.ts          # 모든 무거운 처리
│   ├── preload/
│   │   └── index.ts                     # contextBridge API 정의
│   ├── renderer/
│   │   ├── index.html
│   │   └── src/
│   │       ├── app/
│   │       │   ├── App.tsx
│   │       │   └── routes.tsx
│   │       ├── components/
│   │       │   ├── DropZone.tsx
│   │       │   ├── FileList.tsx
│   │       │   ├── FileRow.tsx
│   │       │   ├── OptionsPanel.tsx
│   │       │   ├── ProgressOverlay.tsx
│   │       │   ├── CompletionCard.tsx
│   │       │   └── ErrorToast.tsx
│   │       ├── hooks/
│   │       │   └── useFileDrop.ts
│   │       ├── i18n/
│   │       │   ├── en.ts
│   │       │   └── ko.ts
│   │       ├── pages/
│   │       │   └── MergePage.tsx
│   │       └── stores/
│   │           └── mergeStore.ts
│   └── shared/
│       ├── types/
│       │   └── index.ts
│       └── utils/
│           ├── natural-sort.ts
│           └── format-bytes.ts
├── resources/
│   └── icon.png
├── build/
│   ├── icon.icns                         # macOS
│   ├── icon.ico                          # Windows
│   └── background.png                    # dmg 배경
└── scripts/
    └── release.mjs
```

---

## 7. IPC 계약 (renderer ↔ main)

### 7.1 공유 타입 (`shared/types/index.ts`)

```typescript
export interface EmbedOption {
  format: 'jpeg' | 'png'
  /** JPEG 전용. 60~100. 기본 95. */
  quality?: number
}

export interface PageSizeOption {
  mode: 'auto' | 'fixed-width'
  /** mode === 'fixed-width'일 때만 사용. 픽셀. */
  width?: number
}

export interface MergeOptions {
  embed: EmbedOption
  pageSize: PageSizeOption
  /** 페이지 사이에 삽입할 빈 공간(픽셀). 기본 0. */
  pageGapPx: number
  /** 개별 PSD 실패 시 전략. */
  onError: 'skip' | 'abort'
}

export interface MergeRequest {
  jobId: string                   // UUIDv4, 취소·진행률 매칭용
  filePaths: string[]             // 사용자가 정한 순서
  outputPath: string              // 사용자가 선택한 저장 경로
  options: MergeOptions
}

export interface MergeProgress {
  jobId: string
  phase: 'init' | 'parse' | 'encode' | 'write' | 'finalize' | 'done' | 'cancelled' | 'error'
  currentIndex: number            // 1-based
  totalCount: number
  currentFileName?: string
  errorMessage?: string           // phase === 'error'일 때
  skippedIndices?: number[]       // 누적 스킵 인덱스 (onError='skip')
}

export interface MergeResult {
  outputPath: string
  pageCount: number
  skippedIndices: number[]
  elapsedMs: number
  fileSizeBytes: number
}
```

### 7.2 채널 목록

| 채널 | 방향 | 요청 | 응답 |
|---|---|---|---|
| `select-psd-files` | renderer → main (invoke) | void | `string[]` (절대 경로; 취소 시 빈 배열) |
| `select-output-pdf` | renderer → main (invoke) | `{ defaultName: string }` | `string \| null` |
| `start-merge` | renderer → main (invoke) | `MergeRequest` | `MergeResult` |
| `cancel-merge` | renderer → main (invoke) | `{ jobId: string }` | `boolean` (성공 시 true) |
| `merge-progress` | main → renderer (event) | `MergeProgress` | — |
| `open-path` | renderer → main (invoke) | `string` | `void` (shell.openPath) |
| `show-in-folder` | renderer → main (invoke) | `string` | `void` (shell.showItemInFolder) |

### 7.3 Preload bridge (예시)

```typescript
const api = {
  selectPsdFiles: () => ipcRenderer.invoke('select-psd-files'),
  selectOutputPdf: (opts: { defaultName: string }) =>
    ipcRenderer.invoke('select-output-pdf', opts),
  startMerge: (req: MergeRequest) => ipcRenderer.invoke('start-merge', req),
  cancelMerge: (jobId: string) => ipcRenderer.invoke('cancel-merge', { jobId }),
  onMergeProgress: (cb: (p: MergeProgress) => void) => {
    const handler = (_e: unknown, p: MergeProgress) => cb(p)
    ipcRenderer.on('merge-progress', handler)
    return () => ipcRenderer.removeListener('merge-progress', handler)
  },
  openPath: (p: string) => ipcRenderer.invoke('open-path', p),
  showInFolder: (p: string) => ipcRenderer.invoke('show-in-folder', p),
}
contextBridge.exposeInMainWorld('api', api)
export type Api = typeof api
```

---

## 8. 워커 알고리즘 (`merge.worker.ts`)

### 8.1 의사코드

```
INPUTS (workerData): MergeRequest + 내부 유틸 경로
OUTPUTS (postMessage): MergeProgress 이벤트 스트림 + 최종 done/error

초기화:
  initializeCanvas(createCanvas)  // ag-psd fallback용 (§3.8)
  sharp.concurrency(1)            // worker 내부 libvips 스레드 제한

메인 루프:
  doc = new PDFDocument({ autoFirstPage: false })
  writeStream = fs.createWriteStream(outputPath)
  doc.pipe(writeStream)

  skipped: number[] = []

  for (let i = 0; i < filePaths.length; i++) {
    if (cancelRequested) break
    send progress { phase: 'parse', currentIndex: i+1, currentFileName: basename(filePaths[i]) }

    try {
      // 한 이터레이션 끝나면 block 범위 밖으로 나가 GC 유도
      {
        const fileBuf = await fs.promises.readFile(filePaths[i])
        const psd = readPsd(fileBuf, {
          useImageData: true,
          skipLayerImageData: true,
          skipThumbnail: true
        })
        const rgba = extractRgba(psd)  // Uint8Array(width*height*4)
        const { width, height } = psd

        send progress { phase: 'encode', currentIndex: i+1 }

        // 페이지 크기 계산
        const [pageWidth, pageHeight] = computePageSize(width, height, options.pageSize)

        // Sharp 파이프라인 (반드시 Buffer 입력으로 raw 옵션 사용 — §3.3)
        let pipeline = sharp(Buffer.from(rgba), {
          raw: { width, height, channels: 4 },
          limitInputPixels: false
        })
        if (options.pageSize.mode === 'fixed-width' && width !== pageWidth) {
          pipeline = pipeline.resize({ width: pageWidth, withoutEnlargement: false })
        }

        let imageBuffer: Buffer
        if (options.embed.format === 'jpeg') {
          // JPEG는 투명도 없음 → 흰 배경으로 flatten
          imageBuffer = await pipeline
            .flatten({ background: '#ffffff' })
            .jpeg({ quality: options.embed.quality ?? 95, mozjpeg: true })
            .toBuffer()
        } else {
          imageBuffer = await pipeline
            .png({ compressionLevel: 3 })
            .toBuffer()
        }

        send progress { phase: 'write', currentIndex: i+1 }

        doc.addPage({ size: [pageWidth, pageHeight], margin: 0 })
        doc.image(imageBuffer, 0, 0, { width: pageWidth, height: pageHeight })

        if (options.pageGapPx > 0 && i < filePaths.length - 1) {
          doc.addPage({ size: [pageWidth, options.pageGapPx], margin: 0 })
          // 기본 흰 배경
        }
      } // block scope 탈출 → rgba, imageBuffer, psd GC 가능
    } catch (err) {
      if (options.onError === 'abort') throw err
      skipped.push(i)
      send progress {
        phase: 'parse',           // 진행 유지
        currentIndex: i+1,
        errorMessage: `Skipped ${basename(filePaths[i])}: ${err.message}`,
        skippedIndices: [...skipped]
      }
    }
  }

  if (cancelRequested) {
    doc.end()
    await new Promise(r => writeStream.on('close', r))
    await fs.promises.unlink(outputPath).catch(() => {})
    send progress { phase: 'cancelled', ... }
    return
  }

  send progress { phase: 'finalize', ... }
  doc.end()
  await new Promise(r => writeStream.on('close', r))

  const stat = await fs.promises.stat(outputPath)
  send done { outputPath, pageCount: filePaths.length - skipped.length, skipped, elapsedMs, fileSizeBytes: stat.size }
```

### 8.2 취소 신호 처리

```
parentPort.on('message', (msg) => {
  if (msg?.type === 'cancel') {
    cancelRequested = true   // 루프에서 체크 후 정리 경로 진입
  }
})
```

### 8.3 페이지 크기 계산

```typescript
function computePageSize(
  origWidth: number,
  origHeight: number,
  opt: PageSizeOption
): [number, number] {
  if (opt.mode === 'auto') return [origWidth, origHeight]
  if (opt.mode === 'fixed-width' && opt.width) {
    const ratio = opt.width / origWidth
    return [opt.width, Math.round(origHeight * ratio)]
  }
  return [origWidth, origHeight]
}
```

**주의**: PDFKit의 `size`는 PDF 포인트(1/72 인치) 기준. 픽셀을 포인트로 그대로 쓰면 화면상 표시는 저해상도로 보일 수 있음. v1에서는 **픽셀 = 포인트로 매핑** (72dpi 가정), 실제 인쇄 품질 필요한 사용자는 resize 옵션을 활용. v2에서 dpi 옵션 고려.

### 8.4 `extractRgba(psd)` (ag-psd 결과 → RGBA Uint8Array)

```typescript
function extractRgba(psd: ReturnType<typeof readPsd>): Uint8Array {
  const { width, height } = psd
  // 1순위: imageData (useImageData: true일 때 제공, canvas 경유 없음)
  if (psd.imageData && psd.imageData.data.length >= width * height * 4) {
    const out = new Uint8Array(width * height * 4)
    out.set(psd.imageData.data.subarray(0, out.length))
    return out
  }
  // 2순위: canvas fallback (레이어에서 재합성된 경우)
  const canvas = psd.canvas as any
  if (canvas && typeof canvas.getContext === 'function') {
    const ctx = canvas.getContext('2d')
    const img = ctx.getImageData(0, 0, width, height)
    const out = new Uint8Array(width * height * 4)
    out.set(img.data.subarray(0, out.length))
    return out
  }
  throw new Error('PSD has no composite image data and no reconstructable canvas')
}
```

### 8.5 피크 메모리 분석

| 시점 | 주요 할당 | 추정 크기 (600×800 4000×10000 대형 PSD 기준) |
|---|---|---|
| fileBuf 읽음 | 원본 PSD 바이트 | 압축 상태 ~200MB |
| readPsd 중 | ag-psd 내부 + imageData | 원본 + RGBA 복사본 ~320MB |
| rgba 추출 후 | Uint8Array | 160MB (4000×10000×4) |
| Sharp 파이프라인 | libvips 내부 버퍼 | ~160~240MB |
| imageBuffer (JPEG) | 인코딩 결과 | ~5~30MB |
| PDFKit 페이지 추가 | 이미지 버퍼 참조 | 짧은 시간 유지 후 스트림에 쓰이며 해제 |
| **이터레이션 종료** | 대부분 GC 대상 | 다음 루프 시작 시 거의 0 |

실측 피크 상한: **~600MB** (대형 PSD 1개 기준). 여러 장 누적 없음.

### 8.6 GC 유도 팁
- 변수를 `{ ... }` 블록 스코프에 가두기
- 이터레이션 사이 `await new Promise(r => setImmediate(r))` 삽입 고려 (libvips 타 스레드 정리 유도)
- 필요 시 `--expose-gc` 후 `global.gc()` 호출 (profiler에서만, 프로덕션 금지)

---

## 9. UI / UX 흐름

### 9.1 상태 다이어그램

```
[Empty]
  ├── drop or click →
[SelectingFiles]
  ├── 2+ PSD 유효 →
[FileList + OptionsPanel]
  ├── "PDF 생성" 클릭 → 저장 다이얼로그 →
[Merging + ProgressOverlay]
  ├── 완료 →
[CompletionCard]
  ├── "새로 시작" → Empty
  └── "다시" → FileList
[Cancelled] → FileList
[Error] → FileList (토스트)
```

### 9.2 와이어프레임 (ASCII)

#### Empty
```
┌──────────────────────────────────────────┐
│  PSD → PDF Merger                        │
│                                          │
│    ┌────────────────────────────────┐    │
│    │                                │    │
│    │    📄 PSD 파일을 드래그해서      │    │
│    │      여기에 놓으세요             │    │
│    │                                │    │
│    │      또는 [파일 선택]            │    │
│    │                                │    │
│    └────────────────────────────────┘    │
│                                          │
│  최소 2개 이상의 .psd 파일이 필요합니다.     │
└──────────────────────────────────────────┘
```

#### FileList + Options
```
┌──────────────────────────────────────────┐
│  파일 (12)                      [+ 추가]  │
│  ┌────────────────────────────────────┐   │
│  │ ▲ ▼  001.psd        3.1 MB   [x]  │   │
│  │ ▲ ▼  002.psd        2.8 MB   [x]  │   │
│  │ ▲ ▼  003.psd        3.4 MB   [x]  │   │
│  │ ... (스크롤)                        │   │
│  └────────────────────────────────────┘   │
│                                           │
│  임베드 포맷                               │
│   ◉ JPEG   품질 [──────●───] 95           │
│   ○ PNG (무손실)                          │
│                                           │
│  페이지 크기                               │
│   ◉ 자동 (원본)                           │
│   ○ 고정 너비  [ 690 ] px                 │
│                                           │
│  오류 발생 시                              │
│   ◉ 계속 진행 (실패 파일 건너뛰기)          │
│   ○ 중단                                  │
│                                           │
│  [ 목록 비우기 ]         [ PDF 생성 → ]   │
└──────────────────────────────────────────┘
```

#### Merging
```
┌──────────────────────────────────────────┐
│  병합 중...                               │
│                                           │
│  [███████████░░░░░░░░░]  54%              │
│                                           │
│  12개 중 7번째 처리 중                      │
│  인코딩: 007.psd                          │
│  경과: 1분 12초 · 예상 남은 시간: 1분 3초    │
│                                           │
│                              [ 취소 ]     │
└──────────────────────────────────────────┘
```

#### Completion
```
┌──────────────────────────────────────────┐
│  ✓  병합 완료                              │
│                                           │
│  12 페이지 · 487 MB · 2분 14초             │
│  ⚠ 2개 파일 스킵 (005.psd, 008.psd)        │
│                                           │
│  저장 위치:                                │
│  /Users/.../merged_001_12pages.pdf        │
│                                           │
│  [ PDF 열기 ]  [ 폴더에서 보기 ]           │
│  [ 처음으로 ]                              │
└──────────────────────────────────────────┘
```

### 9.3 i18n
- MVP: 영어 기본, 한국어 번역 동시
- 파일명/경로는 번역하지 않음 (시스템 언어 로케일 따라 자동 OS 표시)
- 키 예시: `emptyHint`, `minTwoFilesRequired`, `addFiles`, `embedFormat`, `qualityLabel`, `pageSizeAuto`, `pageSizeFixedWidth`, `errorStrategy`, `continueSkip`, `abort`, `startMerge`, `merging`, `progressHint`, `cancelButton`, `completed`, `pagesSuffix`, `skippedNotice`, `openPdf`, `showInFolder`, `startOver`, `toastError`, `toastCancelled`

---

## 10. 에러 처리 / 엣지 케이스 매트릭스

| # | 상황 | 동작 |
|---|---|---|
| 1 | 1개만 드롭 | 토스트 "최소 2개 필요" + 상태 유지 |
| 2 | 혼합 드롭 (PSD + PNG) | 지원 파일만 추가 + 토스트 "N개 무시됨" |
| 3 | 동일 경로 중복 드롭 | 중복 제거 |
| 4 | PSD 파일 접근 권한 없음 | 에러 토스트 + 해당 항목 경고 표시 |
| 5 | 손상된 PSD | onError=skip: 스킵 + 경고 / onError=abort: 중단 + 토스트 |
| 6 | composite도 layers도 없는 PSD | 스킵 처리 (§3.8 해결 시도 후) |
| 7 | PSB (대형 PSD) | v1에서 파싱 시도, 실패 시 안내 토스트 "PSB는 아직 지원하지 않습니다" |
| 8 | 디스크 공간 부족 | writeStream error → 워커 정리 + 부분 파일 삭제 + 토스트 |
| 9 | 사용자가 취소 | 워커 정리 + 부분 파일 삭제 + "취소됨" 화면 |
| 10 | 저장 경로에 이미 파일 존재 | OS 다이얼로그가 덮어쓰기 확인 → 사용자 선택 따름 |
| 11 | 파일명에 특수문자/긴 경로 | 플랫폼별 경로 길이 한계 검증, 문제 시 토스트 |
| 12 | 30+ 파일에서 중간에 OOM-유사 증상 | 워커 segfault 감지 (main에서 `worker.on('exit', code)`로 비정상 종료 포착) → 토스트 "처리 중 오류 발생, 더 적은 파일 또는 낮은 품질 시도" |
| 13 | 출력 PDF가 4GB 초과 | PDFKit/PDF 포맷은 이론상 허용되나 뷰어 호환성 저하. 경고 토스트만 |
| 14 | 중도 취소 후 다시 시작 | jobId 재생성, 이전 상태 완전 초기화 |
| 15 | 페이지 크기 fixed-width인데 원본이 더 좁음 | withoutEnlargement 옵션으로 확대 방지 or 사용자 선택 (옵션 패널에 체크박스) |

---

## 11. 테스트 전략

### 11.1 단위 테스트 (Vitest)
- `natural-sort`: 숫자/문자 혼합 케이스 10종
- `format-bytes`: 0/1/KB/MB/GB 경계, NaN, Infinity
- `computePageSize`: auto / fixed-width / 종횡비 검증
- `extractRgba`: 합성 PSD 생성(ag-psd `writePsd`) → 파싱 → 바이트 검증

### 11.2 통합 테스트 (Vitest, 임시 파일)
- `merge.worker`를 직접 실행 (`new Worker(path, { workerData })`) 하고 이벤트 수집
  - 2~3개 합성 PSD → 정상 PDF 생성 → `pdf-parse`(혹은 `pdfjs-dist`)로 페이지 수/차원 검증
  - 너비 불일치 PSD → 리사이즈 검증
  - 손상된 PSD + onError=skip → skipped 인덱스 검증
  - 취소 시그널 → 부분 파일 삭제 확인

### 11.3 E2E (Playwright + Electron)
- 드래그 드롭 → 병합 → 완료 전체 흐름
- 취소 버튼 → 상태 복귀
- 혼합 드롭 → 필터링 확인
- 완료 후 "PDF 열기" 버튼 동작 (macOS/Windows 분기)

### 11.4 수동 체크리스트 (매 릴리스)
- [ ] macOS Preview에서 결과 PDF 정상 열림, 모든 페이지 스크롤 가능
- [ ] Windows 기본 PDF 뷰어 정상
- [ ] Adobe Acrobat 정상 (색 프로파일, 텍스트 주석 영역)
- [ ] 30 × 200MB PSD 실측 완료 + 워커 피크 메모리 <1GB (활동 모니터)
- [ ] 취소 즉시 응답 (2초 이내)
- [ ] 재시작(restart)해도 이전 작업 상태 잔존 없음
- [ ] 한국어 / 영어 UI 전환 일관성
- [ ] 저사양 기기 (8GB RAM 노트북) 동작

### 11.5 성능 회귀 벤치마크
- 고정 입력 세트 (3개, 10개, 30개 PSD)로 CI에서 런타임/피크 메모리 기록
- 기준치 대비 +20% 이상 악화 시 경고

---

## 12. 패키징 / 배포

### 12.1 electron-builder 설정 (발췌)
```json
{
  "appId": "com.realdraw.psd-to-pdf",
  "productName": "PSD to PDF",
  "directories": { "output": "release", "buildResources": "build" },
  "files": [
    "dist-electron/**/*",
    "node_modules/**/*",
    "!node_modules/**/*.{md,ts,map}",
    "!node_modules/**/test/**"
  ],
  "asarUnpack": [
    "node_modules/sharp/**",
    "node_modules/@napi-rs/canvas/**"
  ],
  "mac": {
    "target": [{ "target": "dmg", "arch": ["x64", "arm64"] }],
    "category": "public.app-category.graphics-design"
  },
  "win": {
    "target": [{ "target": "nsis", "arch": ["x64"] }]
  },
  "linux": {
    "target": [{ "target": "AppImage", "arch": ["x64"] }],
    "category": "Graphics"
  }
}
```

### 12.2 서명 / 공증
- macOS: Apple Developer ID 서명 + notarization
- Windows: EV 인증서(있을 경우) 서명, 없으면 SmartScreen 경고 허용
- 서명 자동화: CI(GitHub Actions) secrets에 인증서 등록

### 12.3 자동 업데이트
- v1 이후 `electron-updater` 도입 검토
- GitHub Releases를 소스로 사용

### 12.4 배포 채널
- 1차: GitHub Releases (dmg / exe / AppImage 직접 다운로드)
- 향후: Mac App Store, Microsoft Store 고려
- 랜딩 페이지 정적 사이트 (GitHub Pages)

---

## 13. 로드맵

### v0.1 (MVP — 4~6주 예상)
- [ ] 프로젝트 부트스트랩 (electron-vite, React, Tailwind, TS strict)
- [ ] IPC 배선 + 기본 윈도우
- [ ] 드롭존 + 파일 목록 UI
- [ ] 기본 워커 파이프라인 (JPEG q=95, auto 페이지 크기)
- [ ] 진행률 이벤트 + 오버레이 UI
- [ ] 저장 다이얼로그 + 완료 화면
- [ ] 단위 테스트 최소 커버리지
- [ ] macOS dmg + Windows exe 빌드

### v0.2
- [ ] PNG 임베드 옵션
- [ ] 고정 너비 리사이즈
- [ ] 페이지 간 여백
- [ ] 취소 기능
- [ ] onError skip/abort 선택
- [ ] 드래그 리오더
- [ ] E2E 테스트 도입
- [ ] 영어 / 한국어 i18n 마감

### v0.3
- [ ] 자동 업데이트
- [ ] 크래시 리포팅 (opt-in)
- [ ] PDF 북마크 (파일명 기반)
- [ ] 긴 PSD 여러 페이지로 자동 분할
- [ ] 성능 회귀 벤치마크 CI

### v1.0
- [ ] 사용 매뉴얼 문서 사이트
- [ ] 사용자 피드백 반영 마감
- [ ] Mac App Store / Microsoft Store 등록 검토

### v2+
- [ ] PSB 지원
- [ ] 레이어 보존 PDF (PDF OCG)
- [ ] 배치 모드 / CLI 버전
- [ ] 텍스트 OCR 유지, 메타데이터 주입

---

## 14. 열린 의사결정 / 착수 전 정해야 할 것

| 번호 | 주제 | 옵션 | 메모 |
|---|---|---|---|
| D1 | 제품명 | 자유 | 도메인/상표 중복 확인 필요 |
| D2 | 저장소 위치 | GitHub public / private / 조직 내부 | 오픈소스 여부 |
| D3 | 라이선스 | MIT / Apache-2.0 / 독점 | 의존성(Sharp=Apache-2.0 등) 호환 확인 |
| D4 | 브랜딩 / 아이콘 | 자체 디자인 / 외주 / 템플릿 | |
| D5 | 배포 모델 | 무료 / 유료 / freemium | 유료면 라이선스 서버 필요 |
| D6 | 텔레메트리 | 없음 / 익명 opt-in / 필수 | opt-in이 기본 권장 |
| D7 | 지원 OS 초기 범위 | mac+win / +linux | linux 수요 확인 |
| D8 | 번역 범위 | en+ko / +ja+zh | 시장 타겟 |
| D9 | 최소 하드웨어 | 4GB / 8GB / 16GB RAM | 대용량 병합 시 실효 |
| D10 | PDFKit 대 대안 | PDFKit 고정 / 벤치마크 후 결정 | 성능 실측 권장 |
| D11 | 사용자 문서 분량 | 최소 README / 풀 매뉴얼 | 초기엔 README + GIF 정도 |
| D12 | 커뮤니티 채널 | Discord / GitHub Discussions / 없음 | |

---

## 15. 성공 기준

v1.0 출시 시점 다음을 만족해야 "성공":

1. **안정성**: 30 × 200MB PSD를 100% 완료율로 병합 (10회 반복 기준, 9회 이상 성공)
2. **결과물 무결성**: 생성된 PDF가 주요 3개 뷰어(Preview, Adobe Acrobat, Windows 기본)에서 전부 정상 표시
3. **메모리**: 위 시나리오에서 Electron 전체(메인+렌더러+워커) 실효 사용 메모리 **2GB 이하**
4. **UI 반응성**: 병합 중 UI 입력(취소 버튼) 지연 500ms 이하
5. **설치 경험**: 아무 준비 없는 macOS/Windows 유저가 설치파일 실행부터 첫 PDF 생성까지 **5분 이내** 도달
6. **크래시**: 리포트 기반 1000회 사용 중 프로세스 크래시 **0건**

---

## 16. 부록

### 16.1 용어
- **PSD**: Adobe Photoshop Document (1999년 포맷 명세)
- **PSB**: Photoshop Big 포맷 (30,000 픽셀 초과 / 2GB 초과 시 사용)
- **Composite**: PSD 내부에 사전 합성된 최종 이미지 레이어 (저장 시 선택적 포함)
- **Raw RGBA**: 압축되지 않은 4채널 픽셀 바이트 (R,G,B,A 순서 반복)
- **BigTIFF**: 4GB 제한 없는 TIFF 변형 (여기서는 거론만, 미사용)
- **PDF OCG**: Optional Content Group — PDF 레이어 기능
- **libvips**: Sharp가 내부적으로 쓰는 이미지 처리 라이브러리

### 16.2 참고 URL (자유 구현 시 참고)
- Adobe PSD 공식 명세: 검색 "Adobe Photoshop File Formats Specification"
- PDF 1.7 ISO 32000-1: 공식 표준 문서
- Node worker_threads 가이드: Node.js 공식 문서
- Electron 공식 보안 권장: Electron 공식 문서 Security 섹션

### 16.3 예상 외부 의존성 일람 (v0.1 기준)
```
electron               ^30
react                  ^19
react-dom              ^19
react-router           ^7
zustand                ^5
ag-psd                 latest
@napi-rs/canvas        latest
sharp                  ^0.34
pdfkit                 latest
uuid                   latest
typescript             ^5
electron-vite          latest
vite                   ^7
tailwindcss            ^4
vitest                 ^4
playwright             latest
electron-builder       latest
```

### 16.4 라이선스 호환성 스케치
- Sharp: Apache-2.0
- PDFKit: MIT
- ag-psd: MIT
- @napi-rs/canvas: MIT
- React/Zustand/TS: MIT
- Electron: MIT + Chromium 혼합 라이선스
- → 본 도구를 **MIT 또는 Apache-2.0**로 배포 시 호환성 문제 없음

---

## 문서 버전
- **v0.1 (2026-04-23)**: 초안 작성. 구현 방식 미결, 의사결정 수집 단계.

문서 수정 시 상단 "최종 수정" 날짜와 이 섹션의 버전 항목 갱신.
