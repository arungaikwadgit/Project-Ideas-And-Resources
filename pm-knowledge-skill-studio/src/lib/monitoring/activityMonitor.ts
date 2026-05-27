import { v4 as uuid } from 'uuid'
import type { ActivityEvent } from '../../types'
import { addActivityEvent } from './activityStore'

/**
 * Records a single ActivityEvent to the persistent store.
 *
 * - Automatically assigns a unique id and createdAt timestamp.
 * - Never logs API keys, tokens, or other sensitive data.
 * - Any storage errors are caught and silently dropped so monitoring
 *   never interferes with the main application flow.
 */
export async function recordActivity(
  event: Omit<ActivityEvent, 'id' | 'createdAt'>,
): Promise<void> {
  const fullEvent: ActivityEvent = {
    ...event,
    id: uuid(),
    createdAt: new Date().toISOString(),
  }

  // Strip any API key fields from metadata before storage
  if (fullEvent.metadata) {
    const sanitized = { ...fullEvent.metadata }
    const sensitiveKeys = ['apiKey', 'api_key', 'token', 'secret', 'password', 'key']
    for (const k of sensitiveKeys) {
      if (k in sanitized) {
        delete sanitized[k]
      }
    }
    fullEvent.metadata = sanitized
  }

  try {
    await addActivityEvent(fullEvent)
  } catch {
    // Monitoring failures must never surface to the user
  }
}
