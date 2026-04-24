# psd-to-webtoon-pdf — Project Specification

## 1. Overview

### One-liner
Convert multiple PSD files into a continuous PDF for easy visual review.

### Purpose
This tool is designed to simplify the review process of multiple PSD files by converting them into a single, sequential PDF.

### Key Idea
- Multiple PSD → One continuous review experience
- Optimized for **scroll-based inspection**
- Not just merging — **review-focused output**

---

## 2. Core Use Cases

- Webtoon production review
- Visual QA / content inspection
- Design handoff validation
- Bulk PSD preview without opening Photoshop

---

## 3. MVP Features

### Input
- Multiple `.psd` files (drag & drop)
- Natural sorting (001, 002, 010)
- Manual reordering

### Output
- Single PDF file
- Structure:
  - 1 PSD = 1 page
  - Continuous scroll experience

### Options

#### Image
- JPEG (default, quality adjustable)
- PNG (lossless)

#### Size
- Original size
- Fixed width (e.g. 690px, 800px)

#### Layout
- Page gap (default: 0)
- Optional separator line
- Optional filename label overlay

---

## 4. Non-Goals

- Editing PSD
- Cloud sync
- Reverse conversion (PDF → PSD)
- Complex layout editing

---

## 5. Architecture

### Principle
- Sequential processing (no parallel memory spikes)
- Page-based PDF generation
- Streaming output (no full memory load)

### Pipeline

PSD → RGBA → Image Encode → PDF Page → Stream Write

### Tech Stack

- Electron (desktop app)
- React (UI)
- TypeScript
- ag-psd (PSD parsing)
- Sharp (image processing)
- PDFKit (PDF generation)

---

## 6. UX Flow

1. Drop PSD files
2. Reorder if needed
3. Configure options
4. Click “Generate PDF”
5. Preview / open result

---

## 7. Key Design Decisions

### Why not merge into one long image?
- Memory unsafe
- Viewer limitations
- Crashes likely

### Why PDF pages?
- Stable
- Cross-platform compatible
- Scrollable

---

## 8. Performance Strategy

- Process one PSD at a time
- Avoid large in-memory buffers
- Stream PDF output
- Limit concurrency

---

## 9. Future Improvements

- Drag reorder UI
- CLI version
- Batch folder mode
- PDF bookmarks
- PSB support

---

## 10. Repository Info

### Name
psd-to-webtoon-pdf

### Description
Convert multiple PSD files into a continuous PDF for easy review.

---

## 11. Success Criteria

- No crashes on large PSD sets
- PDF opens correctly in all major viewers
- Minimal memory usage
- Fast enough for practical use (<5 min for 30 files)

---

## 12. License

MIT (recommended)
