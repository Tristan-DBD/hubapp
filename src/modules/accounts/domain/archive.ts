import type { MonthSnapshot } from '../../../core/types'
import { getCurrentMonth } from '../../../core/utils'
import { calculateAllTotals, type IncomeEntry } from './finance'

export function createSnapshot(
  incomes: IncomeEntry[],
  fixedExpenses: number[],
  variableExpenses: number[],
  fixedLabels: string[],
  variableLabels: string[],
): MonthSnapshot {
  const totals = calculateAllTotals({
    incomes,
    fixedExpenses,
    variableExpenses,
  })

  return {
    month: getCurrentMonth(),
    incomes: incomes.map((i) => ({ label: i.label, amount: i.amount })),
    fixedExpenses: fixedExpenses.map((amount, i) => ({
      label: fixedLabels[i] || `Fixed ${i + 1}`,
      amount,
    })),
    variableExpenses: variableExpenses.map((amount, i) => ({
      label: variableLabels[i] || `Variable ${i + 1}`,
      amount,
    })),
    totals: {
      fixed: totals.fixedTotal,
      variable: totals.variableTotal,
      remaining: totals.remaining,
    },
    archivedAt: new Date().toISOString(),
  }
}

export function shouldArchive(lastArchivedMonth: string | null): boolean {
  const currentMonth = getCurrentMonth()
  return currentMonth !== lastArchivedMonth
}

export function archiveMonth(
  incomes: IncomeEntry[],
  fixedExpenses: number[],
  variableExpenses: number[],
  fixedLabels: string[],
  variableLabels: string[],
): {
  clearedVariableExpenses: number[];
  snapshot: MonthSnapshot;
} {
  const snapshot = createSnapshot(
    incomes,
    fixedExpenses,
    variableExpenses,
    fixedLabels,
    variableLabels,
  )

  return {
    snapshot,
    clearedVariableExpenses: [],
  }
}
