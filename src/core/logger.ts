const SESSION_ID = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)

const breadcrumbs: string[] = []

export function dumpBreadcrumbs(title?: string): string {
  const header = title ? `=== ${title} ===` : '=== BREADCRUMBS ==='
  const output = [header, `Session: ${SESSION_ID}`, `Count: ${breadcrumbs.length}`, ''].concat(breadcrumbs).join('\n')
  return output
}

let _globalDumpRegistered = false

function ensureGlobalHandler(): void {
  if (_globalDumpRegistered) {return}
  _globalDumpRegistered = true
  try {
    const ErrorUtilsGlobal = (globalThis as any).ErrorUtils
    if (!ErrorUtilsGlobal) {return}
    const handler = ErrorUtilsGlobal.getGlobalHandler?.()
    if (handler) {
      ErrorUtilsGlobal.setGlobalHandler((error: Error, isFatal: boolean) => {
        console.error(dumpBreadcrumbs('FATAL CRASH'))
        console.error('[logger] Unhandled error:', error?.message, error?.stack)
        handler(error, isFatal)
      })
    }
  } catch {
    // ErrorUtils not available (e.g. tests, SSR)
  }
}

ensureGlobalHandler()
