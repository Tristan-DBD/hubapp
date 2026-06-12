import type { AppModule } from '../types'

const modules = new Map<string, AppModule>()

export function registerModule(module: AppModule): void {
  if (modules.has(module.id)) {
    throw new Error(`Module already registered: ${module.id}`)
  }
  modules.set(module.id, module)
}

export function getAllModules(): AppModule[] {
  return Array.from(modules.values())
}
