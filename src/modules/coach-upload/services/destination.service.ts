import { dbManager } from '../../../core/db/db-manager'
import type { DB } from '../../../core/db/types'
import type { DriveDestination } from '../domain/types'

const MODULE_ID = 'coach-upload'
const DEST_KEY = 'driveDestination'

let _db: DB | null = null
function getDB(): DB {
  if (!_db) {_db = dbManager.getDB(MODULE_ID)}
  return _db
}

export const destinationService = {
  get(): DriveDestination | null {
    const raw = getDB().get(DEST_KEY)
    if (!raw) {return null}
    return raw as DriveDestination
  },

  set(dest: DriveDestination): void {
    getDB().set(DEST_KEY, dest)
  },

  clear(): void {
    getDB().delete(DEST_KEY)
  },
}
