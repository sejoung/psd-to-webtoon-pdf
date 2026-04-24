# psd-to-webtoon-pdf

Convert multiple Photoshop (`.psd`) files into a single, sequential PDF for visual review.

Built for webtoon/comic creators, illustrators, and editors who need to review batches of PSD files without opening Photoshop one by one.

## Highlights

- **Large-file safe**: 30 × 200MB PSDs (~6GB total) processed within ~1GB worker memory
- **Avoids native crashes**: Page-based pipeline sidesteps the big-image pitfalls of libpng/libvips/JPEG
- **One PSD = One PDF page**: Continuous, scrollable review experience
- **Offline-only**: No network, no telemetry

## Tech stack

- Electron + React 19 + TypeScript (strict)
- ag-psd (PSD parser) + @napi-rs/canvas
- Sharp (image encoding)
- PDFKit (streaming PDF writer)
- Tailwind CSS 4 + lucide-react

## Develop

```bash
npm install
npm run dev          # Electron dev server with HMR
```

### Quality scripts

```bash
npm run verify        # Biome lint+format check + tsc + Vitest
npm run check:fix     # Auto-fix Biome issues (lint, format, import order)
npm run test          # Vitest run once
npm run test:watch    # Vitest in watch mode
```

### Package (electron-builder)

Platform icons live in `resources/icons/` (`icon.icns`, `icon.ico`, `icon.png`) and are committed to the repo, so packaging works out of the box.

When the source SVG (`docs/icons/icon.svg`) changes, regenerate them:

```bash
npm run build:icons
```

> `.icns` requires macOS (`iconutil`). On other platforms only `.ico` and `.png` are emitted — re-run on macOS to refresh `.icns`.

```bash
npm run package        # current OS
npm run package:mac    # dmg (arm64 + x64)
npm run package:win    # nsis installer
npm run package:linux  # AppImage
npm run package:dir    # unpacked directory (fast, no signing)
```

Code signing for distribution requires environment variables:

- macOS: `CSC_LINK`, `CSC_KEY_PASSWORD`, plus `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID` for notarization.
- Windows: `CSC_LINK` and `CSC_KEY_PASSWORD` for an Authenticode certificate.

See [docs/implementation-checklist.md](docs/implementation-checklist.md) for the step-by-step build plan and [docs/psd-to-pdf-standalone-spec.md](docs/psd-to-pdf-standalone-spec.md) for the full specification.

한국어 README는 [README_ko.md](README_ko.md)를 참고하세요.

## License

Apache License 2.0
