import { dbCreate, dbList, dbClear } from '../../stores/db'
import type { ActivityEvent } from '../../types'

/**
 * Persists a single ActivityEvent to IndexedDB.
 */
export async function addActivityEvent(event: ActivityEvent): Promise<void> {
  await dbCreate('activityEvents', event)
}

/**
 * Returns all ActivityEvent records from IndexedDB, ordered by insertion order.
 */
export async function listActivityEvents(): Promise<ActivityEvent[]> {
  return dbList<ActivityEvent>('activityEvents')
}

/**
 * Deletes all ActivityEvent records from IndexedDB.
 */
export async function clearActivityEvents(): Promise<void> {
  await dbClear('activityEvents')
}
