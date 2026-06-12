import type React from 'react'

export interface AppModule {
  icon: string;
  id: string;
  init?: () => Promise<void>;
  loadScreen: () => Promise<{ default: React.ComponentType }>;
  name: string;
}

export type ModuleId = 'accounts' | 'upload-drive' | 'coach-upload';

export interface MonthSnapshot {
  archivedAt: string;
  fixedExpenses: Array<{ amount: number; label: string }>;
  incomes: Array<{ amount: number; label: string }>;
  month: string;
  totals: {
    fixed: number;
    remaining: number;
    variable: number;
  };
  variableExpenses: Array<{ amount: number; label: string }>;
}

export interface DriveFolder {
  id: string;
  name: string;
  parents?: string[];
}
