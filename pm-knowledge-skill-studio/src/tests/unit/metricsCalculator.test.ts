import { describe, it, expect } from 'vitest'
import { calculateMetrics } from '../../lib/monitoring/metricsCalculator'
import type { ActivityEvent } from '../../types'

function makeEvent(eventType: ActivityEvent['eventType'], overrides: Partial<ActivityEvent> = {}): ActivityEvent {
  return {
    id: Math.random().toString(),
    eventType,
    status: 'success',
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}

describe('calculateMetrics', () => {
  it('returns zero metrics for empty events', () => {
    const metrics = calculateMetrics([])
    expect(metrics.totalAppOpens).toBe(0)
    expect(metrics.promptExecutionCount).toBe(0)
    expect(metrics.governanceBlocks).toBe(0)
  })

  it('counts app_opened events', () => {
    const events = [makeEvent('app_opened'), makeEvent('app_opened'), makeEvent('role_selected')]
    const metrics = calculateMetrics(events)
    expect(metrics.totalAppOpens).toBe(2)
  })

  it('counts role selections', () => {
    const events = [
      makeEvent('role_selected', { roleId: 'pm' }),
      makeEvent('role_selected', { roleId: 'pm' }),
      makeEvent('role_selected', { roleId: 'ba' }),
    ]
    const metrics = calculateMetrics(events)
    expect(metrics.rolesSelectedCount).toBe(3)
    expect(metrics.mostSelectedRole).toBe('pm')
  })

  it('counts governance blocks', () => {
    const events = [makeEvent('governance_block'), makeEvent('governance_block'), makeEvent('governance_warning')]
    const metrics = calculateMetrics(events)
    expect(metrics.governanceBlocks).toBe(2)
    expect(metrics.governanceWarnings).toBe(1)
  })

  it('counts prompt executions', () => {
    const events = [makeEvent('prompt_executed'), makeEvent('prompt_executed'), makeEvent('prompt_loaded')]
    const metrics = calculateMetrics(events)
    expect(metrics.promptExecutionCount).toBe(2)
  })

  it('counts AI runs by provider', () => {
    const events = [
      makeEvent('ai_run_success', { aiProviderId: 'anthropic' }),
      makeEvent('ai_run_success', { aiProviderId: 'anthropic' }),
      makeEvent('ai_run_success', { aiProviderId: 'openai' }),
    ]
    const metrics = calculateMetrics(events)
    expect(metrics.aiRunsByProvider['anthropic']).toBe(2)
    expect(metrics.aiRunsByProvider['openai']).toBe(1)
  })
})
