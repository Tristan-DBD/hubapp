import { describe, it, expect, beforeEach, vi } from 'vitest'
import { shouldArchive, archiveMonth } from '../domain/archive'

describe('Month Switch', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('should archive when switching from June to July', () => {
    vi.setSystemTime(new Date('2026-06-15'))
    const juneResult = shouldArchive('2026-05')
    expect(juneResult).toBe(true)

    vi.setSystemTime(new Date('2026-07-01'))
    const julyResult = shouldArchive('2026-06')
    expect(julyResult).toBe(true)
  })

  it('should only archive once when month changes', () => {
    vi.setSystemTime(new Date('2026-07-01'))

    const result1 = archiveMonth(
      [{ id: '1', label: 'Job', amount: 5000 }],
      [1000],
      [200],
      ['Rent'],
      ['Food'],
    )
    expect(result1.snapshot.month).toBe('2026-07')

    const result2 = archiveMonth(
      [{ id: '1', label: 'Job', amount: 5000 }],
      [1000],
      [200],
      ['Rent'],
      ['Food'],
    )
    expect(result2.snapshot.month).toBe('2026-07')
  })

  it('should NOT archive if still in same month', () => {
    vi.setSystemTime(new Date('2026-07-15'))
    expect(shouldArchive('2026-07')).toBe(false)
    expect(shouldArchive('2026-07')).toBe(false)
  })
})
