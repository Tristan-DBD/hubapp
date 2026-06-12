import { describe, it, expect } from 'vitest'
import {
  calculateTotalIncome,
  calculateFixedTotal,
  calculateVariableTotal,
  calculateRemaining,
  calculateAllTotals,
} from '../domain/finance'

describe('Finance Logic', () => {
  const mockData = {
    incomes: [
      { id: '1', label: 'Job', amount: 3000 },
      { id: '2', label: 'Freelance', amount: 2000 },
    ],
    fixedExpenses: [1000, 500, 200],
    variableExpenses: [300, 150],
  }

  it('should calculate total income correctly', () => {
    expect(calculateTotalIncome(mockData)).toBe(5000)
  })

  it('should handle single income entry', () => {
    const single = { ...mockData, incomes: [{ id: '1', label: 'Salary', amount: 4000 }] }
    expect(calculateTotalIncome(single)).toBe(4000)
  })

  it('should handle empty incomes', () => {
    const empty = { ...mockData, incomes: [] }
    expect(calculateTotalIncome(empty)).toBe(0)
  })

  it('should calculate fixed total correctly', () => {
    expect(calculateFixedTotal(mockData)).toBe(1700)
  })

  it('should calculate variable total correctly', () => {
    expect(calculateVariableTotal(mockData)).toBe(450)
  })

  it('should calculate remaining correctly', () => {
    expect(calculateRemaining(mockData)).toBe(2850)
  })

  it('should calculate all totals at once', () => {
    const result = calculateAllTotals(mockData)
    expect(result).toEqual({
      totalIncome: 5000,
      fixedTotal: 1700,
      variableTotal: 450,
      remaining: 2850,
    })
  })

  it('should handle zero expenses', () => {
    const zeroData = {
      incomes: [{ id: '1', label: 'Job', amount: 3000 }],
      fixedExpenses: [],
      variableExpenses: [],
    }
    expect(calculateRemaining(zeroData)).toBe(3000)
  })

  it('should handle negative remaining (overspend)', () => {
    const overspend = {
      incomes: [{ id: '1', label: 'Job', amount: 2000 }],
      fixedExpenses: [1500],
      variableExpenses: [800],
    }
    expect(calculateRemaining(overspend)).toBe(-300)
  })
})
