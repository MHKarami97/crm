/**
 * Strips Vue reactivity proxies, symbols, and undefined properties
 * so objects can be cloned cleanly by IndexedDB without DataCloneError.
 */
export function toCleanData<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj
  return JSON.parse(JSON.stringify(obj))
}
