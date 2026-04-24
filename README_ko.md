<p align="center">
  <img src="docs/icons/icon.svg" width="128" height="128" alt="PSD to PDF" />
</p>

<h1 align="center">psd-to-webtoon-pdf</h1>

<p align="center">
  여러 장의 Photoshop(<code>.psd</code>) 파일을 한 묶음 PDF로 병합하는 데스크톱 유틸리티입니다.
</p>

<p align="center">
  <a href="https://github.com/sejoung/psd-to-webtoon-pdf/actions/workflows/ci.yml"><img src="https://github.com/sejoung/psd-to-webtoon-pdf/actions/workflows/ci.yml/badge.svg?branch=main" alt="CI" /></a>
  <a href="https://github.com/sejoung/psd-to-webtoon-pdf/releases/latest"><img src="https://img.shields.io/github/v/release/sejoung/psd-to-webtoon-pdf?include_prereleases&sort=semver&label=release&color=6366F1" alt="Latest release" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-Apache%202.0-blue" alt="License: Apache 2.0" /></a>
  <img src="https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey" alt="Platforms" />
  <img src="https://img.shields.io/badge/Electron-41-47848F?logo=electron&logoColor=white" alt="Electron 41" />
</p>

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

### 로그

main / renderer / worker의 영구 로그가 다음 위치에 누적됩니다:

- **macOS**: `~/Library/Logs/PSD to PDF/main.log`
- **Windows**: `%APPDATA%\PSD to PDF\logs\main.log`
- **Linux**: `~/.config/PSD to PDF/logs/main.log`

병합 실패 시 표시되는 "병합 실패" 화면에 **로그 폴더 열기** 버튼이 있습니다.

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

### 릴리즈

```bash
npm run release          # interactive: bump 종류 선택 → verify → tag → push
npm run release:patch    # 0.1.0 → 0.1.1
npm run release:minor    # 0.1.0 → 0.2.0
npm run release:major    # 0.1.0 → 1.0.0
node scripts/release.mjs 0.2.0-beta.1   # 명시 semver (자유 문자열)
```

스크립트는 항상:

1. 작업 트리가 깨끗하지 않으면 거부 (먼저 commit/stash 필요).
2. 단축 변형(`patch`/`minor`/`major`)은 bump prompt를 건너뛰고, 그 외엔 묻습니다.
3. 5단계 계획을 표시하고 **최종 confirm**(필수 prompt)을 받습니다.
4. `npm run verify` 실행 (lint + typecheck + 단위/통합 테스트).
5. `npm version`으로 `package.json` 버전 bump + `vX.Y.Z` 태그 생성.
6. 브랜치 + 태그를 `origin`에 push.

이후 GitHub Actions (`.github/workflows/release.yml`)가 받아서:

- macOS (arm64 + x64), Windows (x64), Linux (x64) 매트릭스 빌드.
- 해당 secrets가 있으면 서명, 없으면 unsigned로 생성.
- 모든 인스톨러를 첨부한 **Draft Release**를 자동 생성. 노트 작성 후 수동으로 Publish.

자세한 구현 단계는 [docs/implementation-checklist.md](docs/implementation-checklist.md)를 참고하세요.

## 라이선스

Apache License 2.0
