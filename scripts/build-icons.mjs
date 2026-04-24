#!/usr/bin/env node
/**
 * docs/icons/icon.svg → resources/icons/{icon.icns, icon.ico, icon.png} 생성.
 *
 * 결과물은 git에 커밋합니다 (한 번 만들고 디자인 바뀔 때만 재실행).
 * electron-builder는 electron-builder.yml의 platform.icon 경로로 이 파일들을 참조.
 *
 * - macOS 환경에서만 .icns 생성 가능 (iconutil 의존). 비-macOS에서는 .icns 단계 skip.
 * - .ico는 png-to-ico 사용 (크로스 플랫폼).
 * - .png는 Linux AppImage 빌드용 + 일반 fallback.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import pngToIco from 'png-to-ico'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const SOURCE = resolve(ROOT, 'docs/icons/icon.svg')
const OUT = resolve(ROOT, 'resources/icons')
const TMP_ICONSET = resolve(OUT, '.icon.iconset')

if (!existsSync(SOURCE)) {
  console.error(`Source SVG not found: ${SOURCE}`)
  process.exit(1)
}

mkdirSync(OUT, { recursive: true })

async function renderPng(size) {
  return sharp(SOURCE, { density: 384 })
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toBuffer()
}

async function buildIcns() {
  if (process.platform !== 'darwin') {
    console.warn('[icns] iconutil은 macOS 전용 — .icns 생성 건너뜀')
    return
  }

  rmSync(TMP_ICONSET, { recursive: true, force: true })
  mkdirSync(TMP_ICONSET, { recursive: true })

  // Apple HIG 권장 iconset 구성
  const items = [
    { name: 'icon_16x16.png', size: 16 },
    { name: 'icon_16x16@2x.png', size: 32 },
    { name: 'icon_32x32.png', size: 32 },
    { name: 'icon_32x32@2x.png', size: 64 },
    { name: 'icon_128x128.png', size: 128 },
    { name: 'icon_128x128@2x.png', size: 256 },
    { name: 'icon_256x256.png', size: 256 },
    { name: 'icon_256x256@2x.png', size: 512 },
    { name: 'icon_512x512.png', size: 512 },
    { name: 'icon_512x512@2x.png', size: 1024 }
  ]

  for (const { name, size } of items) {
    const buf = await renderPng(size)
    writeFileSync(resolve(TMP_ICONSET, name), buf)
  }

  const target = resolve(OUT, 'icon.icns')
  execFileSync('iconutil', ['-c', 'icns', '-o', target, TMP_ICONSET])
  rmSync(TMP_ICONSET, { recursive: true, force: true })
  console.log(`[icns] ${target}`)
}

async function buildIco() {
  // ICO에 흔히 들어가는 사이즈들. 256은 PNG-compressed entry로 들어감.
  const sizes = [16, 32, 48, 64, 128, 256]
  const buffers = await Promise.all(sizes.map(renderPng))
  const ico = await pngToIco(buffers)
  const target = resolve(OUT, 'icon.ico')
  writeFileSync(target, ico)
  console.log(`[ico]  ${target}`)
}

async function buildLinuxPng() {
  // electron-builder Linux는 보통 512×512를 선호.
  const buf = await renderPng(512)
  const target = resolve(OUT, 'icon.png')
  writeFileSync(target, buf)
  console.log(`[png]  ${target}`)
}

await Promise.all([buildIcns(), buildIco(), buildLinuxPng()])
console.log('done.')
