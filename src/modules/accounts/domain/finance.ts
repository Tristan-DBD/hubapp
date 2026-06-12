export interface IncomeEntry {
  amount: number;
  id: string;
  label: string;
}

export interface FinanceData {
  fixedExpenses: number[];
  incomes: IncomeEntry[];
  variableExpenses: number[];
}

export function calculateTotalIncome(data: FinanceData): number {
  return data.incomes.reduce((sum, i) => sum + i.amount, 0)
}

export function calculateFixedTotal(data: FinanceData): number {
  return data.fixedExpenses.reduce((sum, val) => sum + val, 0)
}

export function calculateVariableTotal(data: FinanceData): number {
  return data.variableExpenses.reduce((sum, val) => sum + val, 0)
}

export function calculateRemaining(data: FinanceData): number {
  const income = calculateTotalIncome(data)
  const fixed = calculateFixedTotal(data)
  const variable = calculateVariableTotal(data)
  return income - fixed - variable
}

export function calculateAllTotals(data: FinanceData) {
  return {
    totalIncome: calculateTotalIncome(data),
    fixedTotal: calculateFixedTotal(data),
    variableTotal: calculateVariableTotal(data),
    remaining: calculateRemaining(data),
  }
}
