export function getCurrentMonth(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

export function resolveDuplicateNames(names: string[]): string[] {
  const counts = new Map<string, number>()
  return names.map((name) => {
    if (!name) {return name}
    const count = counts.get(name) ?? 0
    counts.set(name, count + 1)
    if (count === 0) {return name}
    return `${name} (${count})`
  })
}
