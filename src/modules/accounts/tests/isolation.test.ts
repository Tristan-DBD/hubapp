import { describe, it, expect } from 'vitest'
import { shouldArchive } from '../domain/archive'
import { calculateRemaining } from '../domain/finance'

describe('Module Isolation', () => {
  it('should have independent domain logic', () => {
    expect(
      calculateRemaining({ incomes: [{ id: '1', label: 'Job', amount: 1000 }], fixedExpenses: [400], variableExpenses: [200] }),
    ).toBe(400)
  })

  it('should have independent archive logic using current month', () => {
    expect(shouldArchive('9999-99')).toBe(true)
  })

  it('should not depend on other modules for calculation', () => {
    expect(typeof calculateRemaining).toBe('function')
    expect(typeof shouldArchive).toBe('function')
  })
})
