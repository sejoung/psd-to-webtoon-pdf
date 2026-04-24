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
npm run dev
```

자세한 구현 단계는 [docs/implementation-checklist.md](docs/implementation-checklist.md), 상세 스펙은 [docs/psd-to-pdf-standalone-spec.md](docs/psd-to-pdf-standalone-spec.md)를 참고하세요.

## 라이선스

Apache License 2.0
