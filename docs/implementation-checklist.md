# psd-to-webtoon-pdf — 구현 체크리스트

> 본 문서는 다음 세 문서를 기반으로, Electron 데스크톱 앱을 처음부터 단계별로 만들기 위한 작업 단위 체크리스트입니다.
>
> - `psd-to-pdf-standalone-spec.md` (기능/아키텍처/IPC/워커 알고리즘)
> - `psd-to-webtoon-pdf-spec.md` (제품 정의 / MVP 범위)
> - `psd-to-webtoon-pdf-design-system.md` (다크 모드, 컬러/타이포 토큰)
>
> 각 단계는 **독립적으로 작업 가능한 단위**로 끊었습니다. 한 번에 하나씩, 위에서 아래로 진행하면 동작하는 앱이 점진적으로 만들어지도록 구성했습니다. 체크박스를 채워가며 진행하세요.

---

## Phase 0 — 프로젝트 부트스트랩

### 0.1 저장소 / 도구 체인
- [ ] `package.json` 초기화 (`name`, `version 0.0.1`, `private: true`, `type: "module"`)
- [ ] `.nvmrc` 또는 `engines.node` 설정 (LTS, Node 20+)
- [ ] `.editorconfig` 점검 (이미 추가됨 — UTF-8, LF, 2 spaces 확인)
- [ ] `.gitignore`에 `node_modules/`, `dist/`, `dist-electron/`, `release/`, `.DS_Store`, `*.log` 포함
- [ ] `LICENSE` 추가 (MIT 권장 — spec 12장)
- [ ] `README.md` / `README_ko.md` 스켈레톤

### 0.2 Electron + Vite + TypeScript 스캐폴딩
- [ ] `electron`, `electron-vite`, `vite` 설치
- [ ] `electron.vite.config.ts` 작성 (main / preload / renderer 3-entry)
- [ ] `tsconfig.json` (베이스, strict 모드)
- [ ] `tsconfig.node.json` (main/preload용 — Node libs)
- [ ] `tsconfig.web.json` (renderer용 — DOM libs)
- [ ] `npm run dev` 으로 빈 BrowserWindow가 뜨는지 확인

### 0.3 React + 디자인 시스템 토대
- [ ] `react@19`, `react-dom@19` 설치
- [ ] `tailwindcss@4` 설치 + 설정
- [ ] Tailwind 토큰을 디자인 시스템에 매핑
  - `bg`: `#18181B` / `surface`: `#27272A` / `border`: `#3F3F46`
  - `text-primary`: `#FAFAFA` / `text-secondary`: `#A1A1AA`
  - `accent`: `#6366F1` / `accent-hover`: `#4F46E5`
  - `success`: `#10B981` / `warning`: `#F59E0B` / `error`: `#E11D48`
- [ ] `Inter` 폰트 로드 (또는 `system-ui`)
- [ ] 기본 라디우스 12px, base spacing 8px 설정
- [ ] `lucide-react` 설치 (디자인 시스템 §8)
- [ ] 다크모드 기본 적용된 빈 화면 확인

### 0.4 폴더 구조 잡기
- [ ] `src/main/` (index.ts, ipc/, services/, workers/)
- [ ] `src/preload/` (index.ts)
- [ ] `src/renderer/` (index.html, src/app/, components/, hooks/, i18n/, pages/, stores/)
- [ ] `src/shared/` (types/, utils/)
- [ ] `resources/`, `build/`, `scripts/` 빈 디렉터리 + `.gitkeep`

---

## Phase 1 — IPC 배선과 공유 타입

### 1.1 공유 타입 정의 (`src/shared/types/index.ts`)
- [ ] `EmbedOption`, `PageSizeOption`, `MergeOptions`
- [ ] `MergeRequest`, `MergeProgress`, `MergeResult`
- [ ] `MergeProgress.phase` 유니온: `init | parse | encode | write | finalize | done | cancelled | error`

### 1.2 Preload contextBridge
- [ ] `src/preload/index.ts` 에 `api` 객체 노출
- [ ] 메서드: `selectPsdFiles`, `selectOutputPdf`, `startMerge`, `cancelMerge`, `onMergeProgress`, `openPath`, `showInFolder`
- [ ] `Api` 타입 export → renderer가 `window.api` 타입 추론 가능하도록 `src/renderer/src/types/global.d.ts` 작성

### 1.3 Main 측 IPC 핸들러
- [ ] `src/main/ipc/handlers.ts` — 채널 등록 (spec §7.2 표 기준)
- [ ] `select-psd-files`: `dialog.showOpenDialog` (`.psd` 필터, multiSelections)
- [ ] `select-output-pdf`: `dialog.showSaveDialog` (`.pdf`, defaultName)
- [ ] `open-path`: `shell.openPath`
- [ ] `show-in-folder`: `shell.showItemInFolder`
- [ ] `start-merge`, `cancel-merge`: 우선 stub (Phase 4에서 워커와 연결)

### 1.4 BrowserWindow 보안 기본
- [ ] `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`
- [ ] `webSecurity: true` (개발 중에도)
- [ ] CSP 메타 태그 (`renderer/index.html`)
- [ ] 외부 URL 차단 (`win.webContents.setWindowOpenHandler`)

---

## Phase 2 — UI: 빈 상태 / 드롭존

### 2.1 라우팅 / 페이지 셸
- [ ] `App.tsx` + `MergePage.tsx` 빈 컨테이너
- [ ] Zustand 스토어 `mergeStore.ts`
  - `files: { path: string; name: string; size: number }[]`
  - `phase: 'idle' | 'configuring' | 'merging' | 'completed' | 'cancelled' | 'error'`
  - `addFiles`, `removeFile`, `moveUp`, `moveDown`, `clear`
- [ ] 다크모드 기본 배경 + 헤더 (제품명만)

### 2.2 DropZone 컴포넌트
- [ ] `useFileDrop` 훅 (HTML5 drag/drop + `.psd` 확장자 필터)
- [ ] 드래그 오버 시 강조 상태 (border accent)
- [ ] "또는 [파일 선택]" 버튼 → `window.api.selectPsdFiles()` 호출
- [ ] 빈 상태 안내 문구 ("최소 2개 이상의 .psd 파일이 필요합니다")
- [ ] 드롭된 파일을 store에 push
- [ ] 자연정렬(`natural-sort.ts`)로 초기 정렬

### 2.3 공통 유틸
- [ ] `src/shared/utils/natural-sort.ts` (숫자/문자 혼합 자연정렬)
- [ ] `src/shared/utils/format-bytes.ts` (B/KB/MB/GB)
- [ ] 두 유틸에 대한 Vitest 단위 테스트

---

## Phase 3 — UI: 파일 목록 + 옵션 패널

### 3.1 FileList / FileRow
- [ ] `FileList.tsx` (Card 스타일, scroll)
- [ ] `FileRow.tsx` 한 행: ▲ ▼ / 파일명 / 사이즈 / [x] 제거
- [ ] 행 hover 상태 (살짝 밝은 배경 — 디자인 시스템 §7)
- [ ] [+ 추가] 버튼 → 파일 다이얼로그 열고 중복 제거 후 append

### 3.2 OptionsPanel
- [ ] 임베드 포맷 라디오: JPEG (slider 60–100, 기본 95) / PNG
- [ ] 페이지 크기 라디오: 자동(원본) / 고정 너비 + 숫자 입력 (기본 690)
- [ ] 페이지 간 여백 입력 (px, 기본 0)
- [ ] 오류 발생 시 라디오: 계속 진행(skip) / 중단(abort)
- [ ] 옵션 상태도 `mergeStore` 또는 별도 스토어에 보관

### 3.3 액션 영역
- [ ] [목록 비우기] 버튼 (확인 모달 없이도 OK — store.clear)
- [ ] [PDF 생성 →] 버튼
  - 활성화 조건: `files.length >= 2`
  - 클릭 시 `selectOutputPdf({ defaultName })` 호출
  - 사용자가 경로 선택 시 Phase 4의 `startMerge` 호출

### 3.4 디자인 시스템 컴포넌트화
- [ ] `Button` (primary / secondary / danger)
- [ ] `Card` (Surface 컬러, radius 12, subtle shadow)
- [ ] `Slider` (JPEG quality)
- [ ] `Input` (text / number)
- [ ] `Toast` 인프라 (zustand 기반 큐)

---

## Phase 4 — 워커 파이프라인 (코어)

> ⚠️ Spec §3 의 11가지 함정을 작업 시작 전 반드시 재확인.

### 4.1 의존성 설치
- [ ] `ag-psd`
- [ ] `@napi-rs/canvas`
- [ ] `sharp` (`^0.34`)
- [ ] `pdfkit`
- [ ] `uuid`
- [ ] electron-builder 설정에서 `sharp`, `@napi-rs/canvas` `asarUnpack` 예약

### 4.2 worker 스폰 인프라
- [ ] `src/main/workers/merge.worker.ts` (worker_threads 진입점)
- [ ] `src/main/services/merge-orchestrator.ts`
  - 워커 경로 후보 배열 + `fs.existsSync` 검사 (spec §3.10 회피)
  - jobId별 worker 인스턴스 관리 (cancel 신호용)
  - worker `message` → `webContents.send('merge-progress', ...)` 릴레이
  - `worker.on('exit', code)` 비정상 종료 감지 → 사용자에게 토스트 (spec §10 #12)
- [ ] `start-merge` 핸들러 본 구현, `cancel-merge` 핸들러 본 구현

### 4.3 워커 본체 — 초기화
- [ ] `initializeCanvas(createCanvas)` (ag-psd fallback 대비 — §3.8)
- [ ] `sharp.concurrency(1)` (워커 내부 libvips 스레드 제한)

### 4.4 워커 본체 — PSD → RGBA
- [ ] `extractRgba(psd)` 구현 (spec §8.4)
  - 1순위 `psd.imageData`
  - 2순위 `psd.canvas.getContext('2d').getImageData`
  - 둘 다 없으면 throw → onError 정책에 따라 분기
- [ ] `readPsd(buffer, { useImageData: true, skipLayerImageData: true, skipThumbnail: true })`
- [ ] **반드시 Buffer 입력으로 sharp 사용** (`sharp(Buffer.from(rgba), { raw: { width, height, channels: 4 }, limitInputPixels: false })`) — §3.3 회피

### 4.5 워커 본체 — 리사이즈 / 인코딩
- [ ] `computePageSize(width, height, opt)` 구현
- [ ] `pageSize.mode === 'fixed-width'`이고 원본보다 작을 때 `withoutEnlargement` 옵션 처리
- [ ] JPEG 분기: `.flatten({ background: '#ffffff' }).jpeg({ quality, mozjpeg: true })`
- [ ] PNG 분기: `.png({ compressionLevel: 3 })`

### 4.6 워커 본체 — PDF 작성
- [ ] `new PDFDocument({ autoFirstPage: false })` + `doc.pipe(fs.createWriteStream(outputPath))` (스트리밍 — §3.6)
- [ ] 페이지 추가: `doc.addPage({ size: [w, h], margin: 0 })` → `doc.image(buf, 0, 0, { width, height })`
- [ ] `pageGapPx > 0` 이면 빈 페이지 삽입
- [ ] 루프 종료 후 `doc.end()` + `writeStream` close 대기
- [ ] `try/finally`로 핸들 정리 (§3.11)

### 4.7 워커 본체 — 진행률 / 취소 / 에러
- [ ] phase 별 `parentPort.postMessage` 시점:
  - parse 시작 / encode 시작 / write 시작 / finalize / done
- [ ] `parentPort.on('message')` 로 `cancel` 신호 처리 → `cancelRequested = true`
- [ ] 취소 시: `doc.end()` → stream close → `fs.unlink(outputPath)` → `cancelled` 보고
- [ ] `onError === 'skip'`: skipped 인덱스 누적 + 진행 계속
- [ ] `onError === 'abort'`: throw 후 main 측에서 `error` phase 보고 + 부분 파일 삭제

### 4.8 메모리 안정화
- [ ] 한 이터레이션 변수를 `{ ... }` 블록 스코프에 가두기 (spec §8.6)
- [ ] 이터레이션 사이 `await new Promise(r => setImmediate(r))` 삽입
- [ ] 파일을 **순차적으로만** 처리 (병렬 금지 — §4.1.4)

---

## Phase 5 — UI: 진행률 / 취소 / 완료

### 5.1 ProgressOverlay
- [ ] 풀스크린 모달 (배경 dim)
- [ ] 진행률 바 + 퍼센트 (계산: `currentIndex / totalCount`)
- [ ] "N개 중 K번째 처리 중", phase 한국어 라벨, 현재 파일명
- [ ] 경과 시간 + 예상 남은 시간 (단순 선형 추정)
- [ ] [취소] 버튼 → `window.api.cancelMerge(jobId)`
- [ ] `onMergeProgress` 구독 → store 업데이트

### 5.2 CompletionCard
- [ ] 페이지 수 / 파일 사이즈 / 경과 시간 표시
- [ ] 스킵된 파일이 있으면 경고 라벨 (`F59E0B`)
- [ ] 저장 경로 모노스페이스 표시
- [ ] [PDF 열기] → `openPath`
- [ ] [폴더에서 보기] → `showInFolder`
- [ ] [처음으로] → store reset

### 5.3 ErrorToast / CancelledToast
- [ ] error phase → 빨간 토스트 + 메시지
- [ ] cancelled phase → 중성 토스트 + "병합이 취소되었습니다"
- [ ] 다음 시도 시 jobId 재생성 + 이전 상태 초기화 (spec §10 #14)

---

## Phase 6 — 에러 처리 / 엣지 케이스

> spec §10 매트릭스를 기준으로 항목 단위 검증.

- [ ] #1 1개만 드롭 → "최소 2개 필요" 토스트
- [ ] #2 PSD가 아닌 파일 혼합 드롭 → 무시 + "N개 무시됨" 토스트
- [ ] #3 동일 경로 중복 → 자동 dedupe
- [ ] #4 접근 권한 없음 → 토스트 + 항목 경고
- [ ] #5 손상된 PSD → onError 정책대로
- [ ] #6 composite/layers 둘 다 없는 PSD → 스킵
- [ ] #7 PSB 입력 → 시도 후 실패 시 "PSB 미지원" 안내
- [ ] #8 디스크 공간 부족 → write error 캐치 + 부분 파일 삭제
- [ ] #9 사용자 취소 → 부분 파일 삭제 (앞서 4.7에서 처리)
- [ ] #10 저장 경로 덮어쓰기 → OS 다이얼로그에 위임 (별도 처리 불필요)
- [ ] #11 긴 경로 / 특수문자 → 사전 검증
- [ ] #12 워커 segfault → `worker.on('exit', code !== 0)` 감지 + 토스트
- [ ] #13 결과 PDF > 4GB → 경고 토스트
- [ ] #14 재시도 시 상태 초기화
- [ ] #15 fixed-width인데 원본이 더 좁음 → withoutEnlargement (4.5에서 처리)

---

## Phase 7 — i18n (영어 / 한국어)

- [ ] `src/renderer/src/i18n/en.ts`, `ko.ts` 키 정의
- [ ] 키 목록(spec §9.3): `emptyHint`, `minTwoFilesRequired`, `addFiles`, `embedFormat`, `qualityLabel`, `pageSizeAuto`, `pageSizeFixedWidth`, `errorStrategy`, `continueSkip`, `abort`, `startMerge`, `merging`, `progressHint`, `cancelButton`, `completed`, `pagesSuffix`, `skippedNotice`, `openPdf`, `showInFolder`, `startOver`, `toastError`, `toastCancelled`
- [ ] OS 언어 자동 감지 → 한국어 우선
- [ ] 언어 토글 (헤더) — 사용자 설정 영구 저장 (electron-store 또는 간단한 JSON)

---

## Phase 8 — 테스트

### 8.1 단위 (Vitest)
- [ ] `natural-sort` 10종 케이스
- [ ] `format-bytes` 경계값
- [ ] `computePageSize` (auto / fixed-width / 종횡비)
- [ ] `extractRgba` (ag-psd `writePsd`로 합성 PSD → 파싱 → 바이트 검증)

### 8.2 통합 (Vitest, 임시 파일)
- [ ] 워커 직접 spawn → 2~3개 합성 PSD 병합 → `pdfjs-dist`로 페이지 수 검증
- [ ] 너비 불일치 PSD 리사이즈 검증
- [ ] 손상 PSD + skip 정책 → skipped 인덱스 검증
- [ ] 취소 시그널 → 부분 파일 삭제 확인

### 8.3 E2E (Playwright + Electron)
- [ ] 드롭 → 병합 → 완료 골든패스
- [ ] 취소 → idle 복귀
- [ ] 혼합 드롭 필터링
- [ ] [PDF 열기] OS 분기 동작

### 8.4 수동 체크 (매 릴리스 — spec §11.4)
- [ ] macOS Preview / Windows 기본 뷰어 / Adobe Acrobat 모두 정상 표시
- [ ] 30 × 200MB 시나리오 워커 피크 메모리 < 1GB
- [ ] 취소 응답 < 2초
- [ ] 한/영 UI 일관성
- [ ] 8GB RAM 노트북 동작

---

## Phase 9 — 패키징 / 배포

### 9.1 electron-builder
- [ ] `electron-builder` 설치 + `electron-builder.yml` 또는 `package.json#build`
- [ ] `appId: com.realdraw.psd-to-pdf`, `productName`
- [ ] `asarUnpack`: `node_modules/sharp/**`, `node_modules/@napi-rs/canvas/**`
- [ ] mac dmg (x64 + arm64)
- [ ] win nsis (x64)
- [ ] linux AppImage (선택)
- [ ] `build/icon.icns`, `build/icon.ico` 준비

### 9.2 코드 서명
- [ ] macOS: Developer ID 서명 + notarization (CI 시크릿)
- [ ] Windows: 인증서 있을 시 서명 / 없으면 SmartScreen 안내 README

### 9.3 첫 릴리스
- [ ] GitHub Actions: lint / test / build 매트릭스 (mac, win)
- [ ] tag 푸시 → release 자동 업로드 (artifacts: dmg, exe)
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
