import type { H3Event } from 'h3'

export type ApiDataSource = 'mock' | 'database'

export function getApiDataSource(event: H3Event): ApiDataSource {
  const config = useRuntimeConfig(event)
  return config.apiDataSource === 'database' ? 'database' : 'mock'
}
