# psd-to-webtoon-pdf — 구현 체크리스트

> Electron 데스크톱 앱의 작업 단위 체크리스트. 디자인 시스템 토큰은 `psd-to-webtoon-pdf-design-system.md`를 참고합니다.
>
> 각 단계는 **독립적으로 작업 가능한 단위**로 끊었습니다. 한 번에 하나씩, 위에서 아래로 진행하면 동작하는 앱이 점진적으로 만들어지도록 구성했습니다. 체크박스를 채워가며 진행하세요.

---

## Phase 0 — 프로젝트 부트스트랩

### 0.1 저장소 / 도구 체인
- [x] `package.json` 초기화 (`name`, `version 0.0.1`, `private: true`, `type: "module"`)
- [x] `.nvmrc` 또는 `engines.node` 설정 (LTS, Node 20+)
- [x] `.editorconfig` 점검 (이미 추가됨 — UTF-8, LF, 2 spaces 확인)
- [x] `.gitignore`에 `node_modules/`, `dist/`, `dist-electron/`, `release/`, `.DS_Store`, `*.log` 포함
- [x] `LICENSE` 추가 (Apache-2.0 — spec §16.4 호환)
- [x] `README.md` / `README_ko.md` 스켈레톤

### 0.2 Electron + Vite + TypeScript 스캐폴딩
- [x] `electron`, `electron-vite`, `vite` 설치 (electron@41, electron-vite@5, vite@7)
- [x] `electron.vite.config.ts` 작성 (main / preload / renderer 3-entry, preload는 sandbox 호환 위해 CJS)
- [x] `tsconfig.json` (베이스, strict 모드)
- [x] `tsconfig.node.json` (main/preload용 — Node libs)
- [x] `tsconfig.web.json` (renderer용 — DOM libs)
- [x] `npm run dev` 으로 빈 BrowserWindow가 뜨는지 확인

### 0.3 React + 디자인 시스템 토대
- [x] `react@19`, `react-dom@19` 설치
- [x] `tailwindcss@4` 설치 + 설정 (`@tailwindcss/vite` 플러그인)
- [x] Tailwind 토큰을 디자인 시스템에 매핑 (CSS `@theme` 디렉티브)
  - `bg`: `#18181B` / `surface`: `#27272A` / `border`: `#3F3F46`
  - `text-primary`: `#FAFAFA` / `text-secondary`: `#A1A1AA`
  - `accent`: `#6366F1` / `accent-hover`: `#4F46E5`
  - `success`: `#10B981` / `warning`: `#F59E0B` / `error`: `#E11D48`
- [x] `Inter` 폰트 로드 (`@fontsource-variable/inter` — 오프라인 번들)
- [x] 기본 라디우스 12px, base spacing 8px 설정
- [x] `lucide-react` 설치 (디자인 시스템 §8)
- [x] 다크모드 기본 적용된 빈 화면 확인

### 0.4 폴더 구조 잡기
- [x] `src/main/` (index.ts, ipc/, services/, workers/)
- [x] `src/preload/` (index.ts)
- [x] `src/renderer/` (index.html, src/app/, components/, hooks/, i18n/, pages/, stores/)
- [x] `src/shared/` (types/, utils/)
- [x] `resources/`, `build/`, `scripts/` 빈 디렉터리 + `.gitkeep`

---

## Phase 1 — IPC 배선과 공유 타입

### 1.1 공유 타입 정의 (`src/shared/types/index.ts`)
- [x] `EmbedOption`, `PageSizeOption`, `MergeOptions`
- [x] `MergeRequest`, `MergeProgress`, `MergeResult`
- [x] `MergeProgress.phase` 유니온: `init | parse | encode | write | finalize | done | cancelled | error`
- [x] `DEFAULT_MERGE_OPTIONS` 상수 추가 (UI 초기값 공유용)

### 1.2 Preload contextBridge
- [x] `src/preload/index.ts` 에 `api` 객체 노출
- [x] 메서드: `selectPsdFiles`, `selectOutputPdf`, `startMerge`, `cancelMerge`, `onMergeProgress`, `openPath`, `showInFolder`
- [x] `Api` 타입 export → renderer가 `window.api` 타입 추론 가능하도록 `src/renderer/src/types/global.d.ts` 작성

### 1.3 Main 측 IPC 핸들러
- [x] `src/main/ipc/handlers.ts` — 채널 등록 (spec §7.2 표 기준)
- [x] `select-psd-files`: `dialog.showOpenDialog` (`.psd` 필터, multiSelections)
- [x] `select-output-pdf`: `dialog.showSaveDialog` (`.pdf`, defaultName)
- [x] `open-path`: `shell.openPath`
- [x] `show-in-folder`: `shell.showItemInFolder`
- [x] `start-merge`, `cancel-merge`: 우선 stub (Phase 4에서 워커와 연결)

### 1.4 BrowserWindow 보안 기본
- [x] `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`
- [x] `webSecurity: true` (개발 중에도)
- [x] CSP 메타 태그 (`renderer/index.html`)
- [x] 외부 URL 차단 (`win.webContents.setWindowOpenHandler`)
- [x] 인앱 navigation 차단 (`will-navigate`) + 권한 요청 일괄 거부

---

## Phase 2 — UI: 빈 상태 / 드롭존

### 2.1 라우팅 / 페이지 셸
- [x] `App.tsx` + `MergePage.tsx` 컨테이너
- [x] Zustand 스토어 `mergeStore.ts`
  - `files: { path: string; name: string; size: number | null }[]`
  - `phase: 'idle' | 'configuring' | 'merging' | 'completed' | 'cancelled' | 'error'`
  - `addFiles`, `removeFile`, `moveUp`, `moveDown`, `clearFiles`, `setOptions`, `resetSession`
- [x] 다크모드 기본 배경 + 헤더 (제품명 + 부제목)

### 2.2 DropZone 컴포넌트
- [x] `useFileDrop` 훅 (HTML5 drag/drop + `.psd` 확장자 필터, `webUtils.getPathForFile` 경유)
- [x] 드래그 오버 시 강조 상태 (border accent)
- [x] "[파일 선택]" 버튼 → `window.api.selectPsdFiles()` 호출
- [x] 빈 상태 안내 문구 ("한 개부터 시작할 수 있어요" — 1개도 정상 처리)
- [x] 드롭된 파일을 store에 push (사이즈 stat은 `statFiles` IPC로 비동기 조회)
- [x] 자연정렬(`natural-sort.ts`)로 초기 정렬

### 2.3 공통 유틸
- [x] `src/shared/utils/natural-sort.ts` (`Intl.Collator` 기반)
- [x] `src/shared/utils/format-bytes.ts` (B/KB/MB/GB/TB)
- [x] `src/shared/utils/path.ts` (renderer/main 공용 basename — node:path 의존 없음)
- [x] 두 유틸에 대한 Vitest 단위 테스트 (Phase 8.1에서 도입 완료)

---

## Phase 3 — UI: 파일 목록 + 옵션 패널

### 3.1 FileList / FileRow
- [x] `FileList.tsx` (Card 스타일, scroll)
- [x] `FileRow.tsx` 한 행: ▲ ▼ / 파일명 / 사이즈 / [x] 제거
- [x] 행 hover 상태 (살짝 밝은 배경 — 디자인 시스템 §7)
- [x] [+ 추가] 버튼 → 파일 다이얼로그 열고 중복 제거 후 append

### 3.2 OptionsPanel
- [x] 임베드 포맷 라디오: JPEG (slider 60–100, 기본 95) / PNG
- [x] 페이지 크기 라디오: 자동(원본) / 고정 너비 + 숫자 입력 (기본 690)
- [x] 페이지 간 여백 입력 (px, 기본 0)
- [x] 오류 발생 시 라디오: 계속 진행(skip) / 중단(abort)
- [x] 옵션 상태도 `mergeStore`에 보관

### 3.3 액션 영역
- [x] [목록 비우기] 버튼 (확인 모달 없이도 OK — store.clear)
- [x] [PDF 생성 →] 버튼
  - 활성화 조건: `files.length >= 1` (1 PSD = 1 PDF 페이지도 정상 결과)
  - 클릭 시 `selectOutputPdf({ defaultName })` 호출
  - 사용자가 경로 선택 시 Phase 4의 `startMerge` 호출

### 3.4 디자인 시스템 컴포넌트화
- [x] `Button` (primary / secondary / danger / ghost)
- [x] `Card` + `CardHeader` + `CardBody` (Surface 컬러, radius 12, subtle shadow)
- [x] `Toast` 인프라 (zustand 기반 큐 + `Toaster` 렌더러)
- 의도적 미작성: `Slider` / `Input` 별도 컴포넌트 — 현재는 OptionsPanel 안의 native `<input type="range" / "number">`로 충분. 사용처가 늘어나면 컴포넌트로 추출.

---

## Phase 4 — 워커 파이프라인 (코어)

> ⚠️ Spec §3 의 11가지 함정을 작업 시작 전 반드시 재확인.

### 4.1 의존성 설치
- [x] `ag-psd`
- [x] `@napi-rs/canvas`
- [x] `sharp` (`^0.34`)
- [x] `pdfkit`
- [x] `uuid`
- [x] electron-builder 설정에서 `sharp`, `@napi-rs/canvas` `asarUnpack` 예약 (`@img/**` 추가)

### 4.2 worker 스폰 인프라
- [x] `src/main/workers/merge.worker.ts` (worker_threads 진입점)
- [x] `src/main/services/merge-orchestrator.ts`
  - 워커 경로 후보 배열 + `fs.existsSync` 검사 (spec §3.10 회피)
  - jobId별 worker 인스턴스 관리 (cancel 신호용)
  - worker `message` → `webContents.send('merge-progress', ...)` 릴레이
  - `worker.on('exit', code)` 비정상 종료 감지 + 'done' 메시지 즉시 resolve + `worker.terminate()`
- [x] `start-merge` 핸들러 본 구현, `cancel-merge` 핸들러 본 구현
- [x] `spawnMergeWorker` 분리로 통합 테스트 가능 (electron 의존 없이 spawn)

### 4.3 워커 본체 — 초기화
- [x] `initializeCanvas(createCanvas)` (ag-psd fallback 대비 — §3.8)
- [x] `sharp.concurrency(1)` (워커 내부 libvips 스레드 제한)

### 4.4 워커 본체 — PSD → RGBA
- [x] `extractRgba(psd)` 구현 (spec §8.4)
  - 1순위 `psd.imageData`
  - 2순위 `psd.canvas.getContext('2d').getImageData`
  - 둘 다 없으면 throw → onError 정책에 따라 분기
- [x] `readPsd(buffer, { useImageData: true, skipLayerImageData: true, skipThumbnail: true })`
- [x] **반드시 Buffer 입력으로 sharp 사용** (`sharp(Buffer.from(rgba), { raw: { width, height, channels: 4 }, limitInputPixels: false })`) — §3.3 회피

### 4.5 워커 본체 — 리사이즈 / 인코딩
- [x] `computePageSize(width, height, opt)` 구현 (`src/shared/utils/page-size.ts`로 분리해 testable)
- [x] `pageSize.mode === 'fixed-width'`이고 원본보다 작을 때 `withoutEnlargement` 옵션 처리
- [x] JPEG 분기: `.flatten({ background: '#ffffff' }).jpeg({ quality, mozjpeg: true })`
- [x] PNG 분기: `.png({ compressionLevel: 3 })`

### 4.6 워커 본체 — PDF 작성
- [x] `new PDFDocument({ autoFirstPage: false })` + `doc.pipe(fs.createWriteStream(outputPath))` (스트리밍 — §3.6)
- [x] 페이지 추가: `doc.addPage({ size: [w, h], margin: 0 })` → `doc.image(buf, 0, 0, { width, height })`
- [x] `pageGapPx > 0` 이면 빈 페이지 삽입
- [x] 루프 종료 후 `doc.end()` + `writeStream` close 대기
- [x] `try/finally`로 핸들 정리 (§3.11)

### 4.7 워커 본체 — 진행률 / 취소 / 에러
- [x] phase 별 `parentPort.postMessage` 시점: init / parse / encode / write / finalize / done / cancelled / error
- [x] `parentPort.on('message')` 로 `cancel` 신호 처리 → `cancelRequested = true`
- [x] 취소 시: `doc.end()` → stream close → `fs.unlink(outputPath)` → `MergeResult.cancelled: true` 로 보고
- [x] `onError === 'skip'`: skipped 인덱스 누적 + 진행 계속
- [x] `onError === 'abort'`: throw 후 main 측에서 `error` phase 보고 + 부분 파일 삭제

### 4.8 메모리 안정화
- [x] `processOne` 함수 스코프에 임시 변수 가둠 (spec §8.6 — 함수 종료 시 GC)
- [x] 이터레이션 사이 `await new Promise(r => setImmediate(r))` 삽입
- [x] 파일을 **순차적으로만** 처리 (병렬 금지 — §4.1.4)

---

## Phase 5 — UI: 진행률 / 취소 / 완료

### 5.1 ProgressOverlay
- [x] 풀스크린 모달 (배경 dim + backdrop blur)
- [x] 진행률 바 + 퍼센트 (계산: `currentIndex / totalCount`)
- [x] "N개 중 K번째 처리 중", phase 한국어 라벨, 현재 파일명
- [x] 경과 시간 + 예상 남은 시간 (단순 선형 추정)
- [x] [취소] 버튼 → `window.api.cancelMerge(jobId)`
- [x] `onMergeProgress` 구독 → store 업데이트 (`useMergeProgressBridge` 훅)

### 5.2 CompletionCard
- [x] 페이지 수 / 파일 사이즈 / 경과 시간 표시
- [x] 스킵된 파일이 있으면 경고 라벨 (`F59E0B`)
- [x] 저장 경로 모노스페이스 표시
- [x] [PDF 열기] → `openPath`
- [x] [폴더에서 보기] → `showInFolder`
- [x] [처음으로] → store reset

### 5.3 ErrorToast / CancelledToast
- [x] error phase → 빨간 토스트 + 메시지 (ActionBar 처리)
- [x] cancelled phase → 중성 토스트 + "병합이 취소되었습니다"
- [x] 다음 시도 시 jobId 재생성 + 이전 상태 초기화 (spec §10 #14)

---

## Phase 6 — 에러 처리 / 엣지 케이스

> spec §10 매트릭스를 기준으로 항목 단위 검증.

- [x] #1 1개만 드롭 → 정상 추가 (1 PSD = 1 PDF 페이지도 유효한 결과 → spec §10 #1 강제는 제거)
- [x] #2 PSD가 아닌 파일 혼합 드롭 → 무시 + "N개 무시됨" 토스트 (DropZone)
- [x] #3 동일 경로 중복 → 자동 dedupe (mergeStore.dedupeAndSort)
- [x] #4 접근 권한 없음 → statFiles는 size=null, 워커는 readFile 실패 → onError 정책
- [x] #5 손상된 PSD → onError 정책대로 (워커 try/catch 분기)
- [x] #6 composite/layers 둘 다 없는 PSD → extractRgba throw → 스킵/중단
- [x] #7 PSB 입력 → 매직 바이트 사전 검사로 식별 → "PSB는 아직 지원하지 않습니다" 안내 (`detectPsdKind`)
- [x] #8 디스크 공간 부족 → write error 캐치 + 부분 파일 삭제 (워커 finally)
- [x] #9 사용자 취소 → 부분 파일 삭제 (4.7에서 처리)
- [x] #10 저장 경로 덮어쓰기 → OS 다이얼로그에 위임 (별도 처리 불필요)
- [ ] #11 긴 경로 / 특수문자 → 별도 사전 검증 없음 (OS-level 에러로 fall back, v0.2)
- [x] #12 워커 segfault → `worker.on('exit', code !== 0)` 감지 + 안내 메시지 (orchestrator)
- [x] #13 결과 PDF > 4GB → 경고 토스트 (CompletionCard)
- [x] #14 재시도 시 상태 초기화 (resetSession)
- [x] #15 fixed-width인데 원본이 더 좁음 → withoutEnlargement (4.5에서 처리)

---

## Phase 7 — i18n (영어 / 한국어)

- [x] `src/renderer/src/i18n/messages.ts` 키 정의 (~50 키, ko/en 동시)
- [x] `useT()` hook + `makeT(locale)` (React 외부에서도 사용 가능)
- [x] 첫 실행 기본은 영어 (글로벌 사용자 친화). 사용자 선택은 `localStorage`에 영구 저장
- [x] 언어 토글 (헤더 우측 KO/EN 버튼) — `localStorage`에 영구 저장
- [x] `formatDuration` / `phaseLabel` 도 i18n 통합 (locale 인자 받음)
- 의도적 미적용: 워커/main 에러 메시지는 한국어 그대로 (사용자 한국어 선호 + 에러 코드 → renderer 매핑은 v0.2 작업)

---

## Phase 8 — 테스트

### 8.1 단위 (Vitest) — 8 파일 / 65 케이스
- [x] `natural-sort` (수치/자릿수/대소문자/빈 문자열)
- [x] `format-bytes` (경계값, 소수점 옵션, 비정상 입력)
- [x] `computePageSize` (auto / fixed-width / 종횡비 / withoutEnlargement / 라운딩)
- [x] `path` (basenameFromPath, extensionOf — Unix/Windows/혼합)
- [x] `format-duration` + `phaseLabel`
- [x] `mergeStore` (addFiles/removeFile/moveUp·Down/clearFiles/resetSession/setOptions, dedupe + 자연정렬, phase 전환)
- [x] `toastStore` (push/dismiss/clear, default variant/duration)
- [x] `extractRgba` (imageData 1순위 / canvas fallback / 빈 PSD throw / 짧은 imageData → fallback)

### 8.2 통합 (Vitest, 임시 파일) — 1 파일 / 7 케이스
- [x] 워커 직접 spawn → 합성 PSD 병합 → PDF 매직 바이트 검증
- [x] 단일 PSD → 1페이지 / 다중 PSD → N페이지 (JPEG, PNG)
- [x] 고정 너비 리사이즈 + 페이지 간 여백
- [x] `onError=skip` → skipped 인덱스 검증
- [x] `onError=abort` → throw + 부분 파일 삭제
- [x] cancel 시그널 → `cancelled: true` + 부분 파일 삭제
- [x] **회귀 방지**: promise 10초 내 resolve (worker exit 의존 버그 차단)
- [ ] `pdfjs-dist`로 페이지 차원/내용 정밀 검증 — v0.2

### 8.3 React 컴포넌트 / 훅 / E2E — **v0.2 백로그**
> RTL+jsdom 셋업 + Playwright Electron 셋업 필요. 현재는 통합 테스트가 핵심 시나리오를 커버.

- [ ] React Testing Library 도입 (DropZone, FileList, OptionsPanel, ActionBar, ProgressOverlay, CompletionCard)
- [ ] 훅 테스트 (`useFileDrop`, `useMergeProgressBridge`)
- [ ] IPC 핸들러 테스트 (electron mock — `select-psd-files`, `stat-files` 등)
- [ ] Playwright + Electron E2E (드롭 → 병합 → 완료, 취소, 혼합 드롭, [PDF 열기] OS 분기)

### 8.4 수동 체크 (매 릴리스 — spec §11.4)
- [ ] macOS Preview / Windows 기본 뷰어 / Adobe Acrobat 모두 정상 표시
- [ ] 30 × 200MB 시나리오 워커 피크 메모리 < 1GB
- [ ] 취소 응답 < 2초
- [ ] 한/영 UI 일관성
- [ ] 8GB RAM 노트북 동작

---

## Phase 9 — 패키징 / 배포

### 9.1 electron-builder
- [x] `electron-builder` 설치 + `electron-builder.yml`
- [x] `appId: io.github.sejoung.psd-to-pdf`, `productName: "PSD to PDF"`
- [x] `asarUnpack`: `node_modules/sharp/**`, `node_modules/@napi-rs/canvas/**`, `node_modules/@img/**`
- [x] mac dmg (x64 + arm64) + dmg 레이아웃
- [x] win nsis (x64) — 사용자 디렉터리 선택 허용
- [x] linux AppImage (x64)
- [x] 아이콘 자동 생성 (`docs/icons/icon.svg` → `resources/icons/icon.{icns,ico,png}` via `npm run build:icons`) — 한 번 생성 후 커밋, 디자인 변경 시에만 재실행

### 9.2 코드 서명 — **사용자 환경 의존**
- [ ] macOS: Developer ID 서명 + notarization (CI 시크릿: `CSC_LINK`, `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID`)
- [ ] Windows: 인증서 있을 시 서명 / 없으면 SmartScreen 안내 README

### 9.3 첫 릴리스
- [x] GitHub Actions: lint / typecheck / unit / build / integration 매트릭스 (ubuntu + macOS) + macOS package smoke (`.github/workflows/ci.yml`)
- [x] tag 푸시 → release 자동 업로드 (`scripts/release.mjs` 인터랙티브 + `.github/workflows/release.yml` 매트릭스 빌드 → Draft Release)
- [ ] README / README_ko 사용법 + 스크린샷
- [ ] 릴리스 노트 v0.1.0

---

## Phase 10 — v0.2 이후 (참고용 백로그)

> v0.1 출시 후 진행. 본 체크리스트 본체와는 분리하여 관리.

- [ ] 드래그 리오더 (react-dnd 또는 dnd-kit)
- [ ] 페이지 간 구분선 / 파일명 라벨 오버레이 (webtoon spec §3 옵션)
- [ ] 자동 업데이트 (`electron-updater`)
- [ ] 크래시 리포팅 (opt-in)
- [ ] PDF 북마크 (파일명 기반)
- [ ] 긴 PSD 자동 분할
- [ ] 성능 회귀 벤치마크 CI
- [ ] PSB 지원
- [ ] CLI 버전 / 배치 모드
- [ ] 사용 매뉴얼 문서 사이트

---

## 작업 순서 권장

가장 빠르게 "동작하는 앱"을 보고 싶다면 다음 순서를 권장합니다:

1. **Phase 0 → 1 → 2** (드롭존만 있는 빈 앱)
2. **Phase 4.1 ~ 4.6** (워커가 단일 PSD를 PDF로 만든다)
3. **Phase 3** (옵션 패널 / 파일 목록 완성)
4. **Phase 5** (진행률 / 완료 화면)
5. **Phase 4.7 ~ 4.8** (취소 / 메모리 안정화 마감)
6. **Phase 6 → 7 → 8 → 9** (엣지케이스 / i18n / 테스트 / 패키징)

각 Phase 완료 시 커밋을 끊고, Phase 4 완료 시점에 한 번 실측(30×200MB)을 돌려 메모리 검증을 권장합니다.
