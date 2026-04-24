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
npm run dev
```

See [docs/implementation-checklist.md](docs/implementation-checklist.md) for the step-by-step build plan and [docs/psd-to-pdf-standalone-spec.md](docs/psd-to-pdf-standalone-spec.md) for the full specification.

한국어 README는 [README_ko.md](README_ko.md)를 참고하세요.

## License

Apache License 2.0
