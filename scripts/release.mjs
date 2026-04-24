#!/usr/bin/env node
/**
 * 릴리즈 트리거 스크립트.
 *
 * 흐름:
 *   1) git working tree clean + main 브랜치 확인
 *   2) 현재 버전 표시 → patch/minor/major/custom 선택
 *   3) 최종 확인 prompt
 *   4) `npm run verify` (lint + typecheck + unit + integration)
 *   5) `npm version <new>`로 package.json 업데이트 + 커밋 + tag
 *   6) `git push origin <branch> --tags`
 *
 * 이후는 .github/workflows/release.yml이 받아서 매트릭스 빌드 → Draft Release.
 */
import { execSync, spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { stdin as input, stdout as output } from 'node:process'
import { createInterface } from 'node:readline/promises'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const PKG_PATH = resolve(ROOT, 'package.json')

const c = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
}

function log(msg) {
  console.log(msg)
}
function info(msg) {
  console.log(`${c.cyan}›${c.reset} ${msg}`)
}
function success(msg) {
  console.log(`${c.green}✓${c.reset} ${msg}`)
}
function fail(msg) {
  console.error(`${c.red}✗ ${msg}${c.reset}`)
}

function sh(cmd, opts = {}) {
  return execSync(cmd, { stdio: 'pipe', encoding: 'utf8', cwd: ROOT, ...opts }).trim()
}

function shStream(cmd, args) {
  const r = spawnSync(cmd, args, { stdio: 'inherit', cwd: ROOT })
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(' ')} failed`)
}

function readPkg() {
  return JSON.parse(readFileSync(PKG_PATH, 'utf8'))
}

function bumpSemver(version, kind) {
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(version)
  if (!m) throw new Error(`invalid current version: ${version}`)
  let [, maj, min, pat] = m.map(Number)
  if (kind === 'patch') pat += 1
  else if (kind === 'minor') {
    min += 1
    pat = 0
  } else if (kind === 'major') {
    maj += 1
    min = 0
    pat = 0
  } else throw new Error(`unknown bump: ${kind}`)
  return `${maj}.${min}.${pat}`
}

function ensureCleanGit() {
  const status = sh('git status --porcelain')
  if (status) {
    fail('working tree가 깨끗하지 않습니다. 먼저 commit 또는 stash 하세요.')
    log(status)
    process.exit(1)
  }
}

function getBranch() {
  return sh('git rev-parse --abbrev-ref HEAD')
}

function parseArgs(argv) {
  // 첫 인자: bump 종류 (patch | minor | major | semver string). 없으면 인터랙티브.
  const arg = argv[2]?.trim()
  if (!arg) return { mode: 'interactive' }
  if (arg === 'patch' || arg === 'minor' || arg === 'major') {
    return { mode: 'preset', kind: arg }
  }
  if (/^\d+\.\d+\.\d+(-[\w.-]+)?$/.test(arg)) {
    return { mode: 'explicit', version: arg }
  }
  fail(`알 수 없는 인자: "${arg}". 사용: release [patch|minor|major|<semver>]`)
  process.exit(1)
}

async function pickVersionInteractive(rl, currentVersion) {
  const patch = bumpSemver(currentVersion, 'patch')
  const minor = bumpSemver(currentVersion, 'minor')
  const major = bumpSemver(currentVersion, 'major')

  log('\n다음 버전을 선택하세요:')
  log(`  ${c.cyan}1${c.reset}) patch  → ${patch}`)
  log(`  ${c.cyan}2${c.reset}) minor  → ${minor}`)
  log(`  ${c.cyan}3${c.reset}) major  → ${major}`)
  log(`  ${c.cyan}4${c.reset}) custom (직접 입력)`)
  log(`  ${c.cyan}q${c.reset}) 취소`)

  while (true) {
    const choice = (await rl.question('> ')).trim().toLowerCase()
    if (choice === '1' || choice === 'patch') return patch
    if (choice === '2' || choice === 'minor') return minor
    if (choice === '3' || choice === 'major') return major
    if (choice === '4' || choice === 'custom') {
      const custom = (await rl.question('새 버전 (예: 0.2.0): ')).trim()
      if (!/^\d+\.\d+\.\d+(-[\w.-]+)?$/.test(custom)) {
        fail('semver 형식이 아닙니다.')
        continue
      }
      return custom
    }
    if (choice === 'q' || choice === 'quit') {
      log('취소되었습니다.')
      rl.close()
      process.exit(0)
    }
    log(`${c.dim}1/2/3/4 또는 q를 입력하세요${c.reset}`)
  }
}

async function main() {
  log(`${c.bold}🚀 Release${c.reset}\n`)

  ensureCleanGit()

  const branch = getBranch()
  if (branch !== 'main') {
    info(`현재 브랜치: ${c.yellow}${branch}${c.reset} (보통 main에서 릴리즈)`)
  }

  const pkg = readPkg()
  const currentVersion = pkg.version
  info(`현재 버전: ${c.bold}${currentVersion}${c.reset}`)

  const args = parseArgs(process.argv)
  const rl = createInterface({ input, output })

  let nextVersion
  if (args.mode === 'preset') {
    nextVersion = bumpSemver(currentVersion, args.kind)
    info(`bump: ${c.bold}${args.kind}${c.reset} → ${c.green}${nextVersion}${c.reset}`)
  } else if (args.mode === 'explicit') {
    nextVersion = args.version
    info(`명시 버전: ${c.green}${nextVersion}${c.reset}`)
  } else {
    nextVersion = await pickVersionInteractive(rl, currentVersion)
  }

  const tag = `v${nextVersion}`

  // 2) 최종 확인
  log(`\n다음을 진행합니다:`)
  log(
    `  ${c.cyan}1.${c.reset} ${c.bold}npm run verify${c.reset} (lint + typecheck + unit + integration)`
  )
  log(
    `  ${c.cyan}2.${c.reset} package.json 버전 업데이트  ${currentVersion} → ${c.green}${nextVersion}${c.reset}`
  )
  log(`  ${c.cyan}3.${c.reset} git commit + tag ${c.green}${tag}${c.reset}`)
  log(`  ${c.cyan}4.${c.reset} git push origin ${branch} --tags`)
  log(`  ${c.cyan}5.${c.reset} GitHub Actions가 매트릭스 빌드 → Draft Release 자동 생성`)

  const ok = (await rl.question(`\n계속할까요? [y/N] `)).trim().toLowerCase()
  rl.close()
  if (ok !== 'y' && ok !== 'yes') {
    log('취소되었습니다.')
    process.exit(0)
  }

  // 3) verify
  log(`\n${c.bold}[1/4]${c.reset} verify…`)
  shStream('npm', ['run', 'verify'])
  success('verify 통과')

  // 4) version bump (npm version은 자동으로 commit + tag 생성)
  log(`\n${c.bold}[2/4]${c.reset} 버전 bump…`)
  // npm version은 git tag prefix를 'v'로 사용 (기본 동작)
  // -m 으로 commit 메시지 커스터마이징
  shStream('npm', ['version', nextVersion, '-m', `chore(release): %s`])
  success(`package.json + tag ${tag} 생성`)

  // package.json 갱신 — 위에서 npm version이 lint 깨뜨릴 수 있으니 재포맷
  // (biome formatter가 npm 버전 라인 형식 변형하지 않도록 그대로 두되 한 번 확인)
  const updated = readPkg()
  if (updated.version !== nextVersion) {
    fail(`버전이 기대와 다릅니다: ${updated.version} (기대 ${nextVersion})`)
    process.exit(1)
  }

  // 5) push
  log(`\n${c.bold}[3/4]${c.reset} push…`)
  shStream('git', ['push', 'origin', branch])
  shStream('git', ['push', 'origin', tag])
  success(`origin ${branch} + ${tag} 푸시 완료`)

  // 6) 안내
  log(`\n${c.bold}[4/4]${c.reset} GitHub Actions 확인:`)
  let originUrl = ''
  try {
    originUrl = sh('git remote get-url origin')
      .replace(/\.git$/, '')
      .replace('git@github.com:', 'https://github.com/')
      .replace(/:\/\/github\.com\//, '://github.com/')
  } catch {
    /* ignore */
  }
  if (originUrl) {
    log(`  ${c.cyan}Actions${c.reset}  ${originUrl}/actions`)
    log(`  ${c.cyan}Releases${c.reset} ${originUrl}/releases`)
  }
  log(
    `\n${c.green}✓${c.reset} 릴리즈 트리거 완료. CI가 빌드 후 ${c.bold}Draft Release${c.reset}를 생성합니다.\n` +
      `  Releases 페이지에서 노트 작성 후 Publish 하세요.`
  )
}

main().catch((err) => {
  fail(err instanceof Error ? err.message : String(err))
  process.exit(1)
})
