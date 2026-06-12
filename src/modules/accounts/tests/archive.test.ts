import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  createSnapshot,
  shouldArchive,
  archiveMonth,
} from '../domain/archive'

describe('Archive System', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-15'))
  })

  const mockIncomes = [
    { id: '1', label: 'Job', amount: 3000 },
    { id: '2', label: 'Freelance', amount: 2000 },
  ]

  it('should create a complete snapshot', () => {
    const snapshot = createSnapshot(
      mockIncomes,
      [1000, 500],
      [200, 100],
      ['Rent', 'Insurance'],
      ['Groceries', 'Transport'],
    )

    expect(snapshot.month).toBe('2026-06')
    expect(snapshot.incomes).toHaveLength(2)
    expect(snapshot.incomes[0]).toEqual({ label: 'Job', amount: 3000 })
    expect(snapshot.incomes[1]).toEqual({ label: 'Freelance', amount: 2000 })
    expect(snapshot.fixedExpenses).toHaveLength(2)
    expect(snapshot.fixedExpenses[0]).toEqual({ label: 'Rent', amount: 1000 })
    expect(snapshot.variableExpenses).toHaveLength(2)
    expect(snapshot.totals).toEqual({
      fixed: 1500,
      variable: 300,
      remaining: 3200,
    })
    expect(snapshot.archivedAt).toBeDefined()
  })

  it('should detect month change correctly', () => {
    expect(shouldArchive(null)).toBe(true)
    expect(shouldArchive('2026-05')).toBe(true)
    expect(shouldArchive('2026-06')).toBe(false)
  })

  it('should archive and clear variable expenses', () => {
    const result = archiveMonth(
      mockIncomes,
      [1000],
      [200, 300],
      ['Rent'],
      ['Food', 'Fun'],
    )

    expect(result.snapshot.month).toBe('2026-06')
    expect(result.snapshot.incomes).toHaveLength(2)
  })

  it('should preserve data after archive cycle', () => {
    const result = archiveMonth(
      mockIncomes,
      [1000, 500],
      [200],
      ['Rent', 'Insurance'],
      ['Food'],
    )

    expect(result.snapshot.incomes).toHaveLength(2)
    expect(result.snapshot.incomes[0].amount).toBe(3000)
    expect(result.snapshot.fixedExpenses).toHaveLength(2)
    expect(result.snapshot.variableExpenses).toHaveLength(1)
    expect(result.snapshot.totals.fixed).toBe(1500)
    expect(result.snapshot.totals.variable).toBe(200)
    expect(result.snapshot.totals.remaining).toBe(3300)
  })
})
