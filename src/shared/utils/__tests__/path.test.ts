import { describe, expect, it } from 'vitest'
import { basenameFromPath, extensionOf } from '../path'

describe('basenameFromPath', () => {
  it('유닉스 경로', () => {
    expect(basenameFromPath('/Users/beni/foo/bar.psd')).toBe('bar.psd')
    expect(basenameFromPath('/foo/bar')).toBe('bar')
    expect(basenameFromPath('bar.psd')).toBe('bar.psd')
  })

  it('윈도우 경로 (\\ 구분자)', () => {
    expect(basenameFromPath('C:\\Users\\beni\\foo\\bar.psd')).toBe('bar.psd')
    expect(basenameFromPath('D:\\projects\\artwork.psd')).toBe('artwork.psd')
  })

  it('혼합 구분자', () => {
    expect(basenameFromPath('C:/Users\\beni/foo\\bar.psd')).toBe('bar.psd')
  })

  it('후행 슬래시 처리', () => {
    expect(basenameFromPath('/foo/bar/')).toBe('bar')
  })

  it('빈 입력', () => {
    expect(basenameFromPath('')).toBe('')
  })
})

describe('extensionOf', () => {
  it('일반 확장자', () => {
    expect(extensionOf('foo.psd')).toBe('psd')
    expect(extensionOf('/path/to/Image.PNG')).toBe('png')
    expect(extensionOf('chapter01.psd')).toBe('psd')
  })

  it('확장자 없음', () => {
    expect(extensionOf('Makefile')).toBe('')
    expect(extensionOf('/foo/bar')).toBe('')
  })

  it('숨김 파일은 확장자 없음 (선두 점)', () => {
    expect(extensionOf('.gitignore')).toBe('')
  })
})
