<p align="center">
  <img src="docs/icons/icon.svg" width="128" height="128" alt="PSD to PDF" />
</p>

<h1 align="center">psd-to-webtoon-pdf</h1>

<p align="center">
  Convert multiple Photoshop (<code>.psd</code>) files into a single, sequential PDF for visual review.
</p>

<p align="center">
  <a href="https://github.com/sejoung/psd-to-webtoon-pdf/actions/workflows/ci.yml"><img src="https://github.com/sejoung/psd-to-webtoon-pdf/actions/workflows/ci.yml/badge.svg?branch=main" alt="CI" /></a>
  <a href="https://github.com/sejoung/psd-to-webtoon-pdf/releases/latest"><img src="https://img.shields.io/github/v/release/sejoung/psd-to-webtoon-pdf?include_prereleases&sort=semver&label=release&color=6366F1" alt="Latest release" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-Apache%202.0-blue" alt="License: Apache 2.0" /></a>
  <img src="https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey" alt="Platforms" />
  <img src="https://img.shields.io/badge/Electron-41-47848F?logo=electron&logoColor=white" alt="Electron 41" />
</p>

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

### Logs

Persistent logs (main, renderer, worker) live at:

- **macOS**: `~/Library/Logs/PSD to PDF/main.log`
- **Windows**: `%APPDATA%\PSD to PDF\logs\main.log`
- **Linux**: `~/.config/PSD to PDF/logs/main.log`

The "병합 실패" error screen has an **Open log folder** button.

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

### Release

```bash
npm run release          # interactive: choose bump → verify → tag → push
npm run release:patch    # 0.1.0 → 0.1.1
npm run release:minor    # 0.1.0 → 0.2.0
npm run release:major    # 0.1.0 → 1.0.0
node scripts/release.mjs 0.2.0-beta.1   # explicit semver (any string accepted)
```

The script always:

1. Refuses to run on a dirty working tree.
2. With shortcut variants (`patch`/`minor`/`major`), skips bump prompt; otherwise asks.
3. Shows the 5-step plan and asks for **final confirmation** (the only mandatory prompt).
4. Runs `npm run verify` (lint + typecheck + unit + integration tests).
5. `npm version` bumps `package.json` and creates the `vX.Y.Z` tag.
6. Pushes branch + tag to `origin`.

GitHub Actions (`.github/workflows/release.yml`) then takes over:

- Matrix builds on macOS (arm64 + x64), Windows (x64), Linux (x64).
- Signs only if the relevant secrets are set; otherwise produces unsigned artifacts.
- Creates a **Draft Release** with all installers attached. Add release notes and Publish manually.

See [docs/implementation-checklist.md](docs/implementation-checklist.md) for the step-by-step build plan.

한국어 README는 [README_ko.md](README_ko.md)를 참고하세요.

## License

Apache License 2.0
