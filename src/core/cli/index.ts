export interface CliOptions {
  name: string;
}

export function validateModuleName(name: string): boolean {
  return /^[a-z][a-z0-9_-]*$/.test(name)
}

export function generateModulePath(name: string): string {
  return `src/modules/${name}`
}

export function parseCliArgs(args: string[]): CliOptions {
  const name = args[0]
  if (!name) {
    throw new Error('Module name is required')
  }
  if (!validateModuleName(name)) {
    throw new Error(`Invalid module name: "${name}". Use lowercase alphanumeric, hyphens, or underscores.`)
  }
  return { name }
}

export const MODULE_REGISTRY_PATH = 'src/core/module-registry/auto-imports.ts'
