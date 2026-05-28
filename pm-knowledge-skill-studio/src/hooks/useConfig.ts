import { useState, useEffect } from 'react'
import { loadConfig } from '../lib/config/configLoader'

interface UseConfigResult<T> {
  data: T | null
  loading: boolean
  error: string | null
}

/**
 * React hook that fetches and parses a JSON config file from the public
 * /config/ directory using configLoader.
 *
 * @param configPath  Relative path within /pm-knowledge-skill-studio/config/
 *                    e.g. 'roles.json', 'aiProviders.json'
 */
export function useConfig<T>(configPath: string): UseConfigResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    setLoading(true)
    setError(null)

    loadConfig<T>(configPath)
      .then((result) => {
        if (!cancelled) {
          setData(result)
          setLoading(false)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load config')
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [configPath])

  return { data, loading, error }
}
