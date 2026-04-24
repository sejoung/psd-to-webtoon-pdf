# psd-to-webtoon-pdf

여러 장의 Photoshop(`.psd`) 파일을 한 묶음 PDF로 병합하는 데스크톱 유틸리티입니다.

웹툰/만화 제작자, 일러스트레이터, 편집자가 회차 분량 PSD를 PDF로 정리해 클라이언트 검수, 플랫폼 업로드 전 사전 정리, 프린트 샘플 생성 용도로 사용합니다.

## 핵심 특징

- **대용량 안전**: 30 × 200MB PSD(총 6GB)도 워커 메모리 1GB 이내로 처리
- **네이티브 크래시 회피**: 거대 이미지 처리의 함정을 설계 단계에서 회피
- **페이지 기반 PDF**: 1 PSD → 1 PDF 페이지로 안전하게 합본
- **오프라인 동작**: 모든 처리 로컬, 네트워크 불필요

## 기술 스택

- Electron + React 19 + TypeScript (strict)
- ag-psd (PSD 파서) + @napi-rs/canvas
- Sharp (이미지 인코딩)
- PDFKit (스트리밍 PDF 작성)
- Tailwind CSS 4 + lucide-react

## 개발

```bash
npm install
npm run dev          # Electron 개발 서버 (HMR)
```

### 품질 스크립트

```bash
npm run verify        # Biome lint+format + tsc + Vitest 통합
npm run check:fix     # Biome 자동 수정 (lint/format/import 정렬)
npm run test          # Vitest 1회 실행
npm run test:watch    # Vitest watch 모드
```

### 패키징 (electron-builder)

플랫폼별 아이콘은 `resources/icons/`에 커밋되어 있습니다 (`icon.icns`, `icon.ico`, `icon.png`). 별도 준비 없이 바로 패키징 가능합니다.

원본 SVG(`docs/icons/icon.svg`)를 수정한 경우에만 재생성:

```bash
npm run build:icons
```

> `.icns`는 macOS의 `iconutil`이 필요합니다. 다른 OS에서는 `.ico`와 `.png`만 갱신되니 macOS에서 한 번 더 실행해 `.icns`를 갱신하세요.

```bash
npm run package        # 현재 OS
npm run package:mac    # dmg (arm64 + x64)
npm run package:win    # nsis 인스톨러
npm run package:linux  # AppImage
npm run package:dir    # 언팩 디렉터리만 (빠른 검증, 서명 X)
```

배포 서명에 필요한 환경 변수:

- macOS: `CSC_LINK`, `CSC_KEY_PASSWORD`, 공증을 위해 `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID`
- Windows: 코드 서명 인증서를 위한 `CSC_LINK`, `CSC_KEY_PASSWORD`

자세한 구현 단계는 [docs/implementation-checklist.md](docs/implementation-checklist.md), 상세 스펙은 [docs/psd-to-pdf-standalone-spec.md](docs/psd-to-pdf-standalone-spec.md)를 참고하세요.

## 라이선스

Apache License 2.0
