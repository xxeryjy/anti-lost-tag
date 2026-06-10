import type { H3Event } from 'h3'

export type ApiDataSource = 'mock' | 'database'

export function getApiDataSource(event: H3Event): ApiDataSource {
  const config = useRuntimeConfig(event)
  if (process.env.NODE_ENV === 'production' && config.apiDataSource !== 'database') {
    throw createError({
      statusCode: 500,
      statusMessage: '生产环境 API_DATA_SOURCE 必须配置为 database'
    })
  }

  return config.apiDataSource === 'database' ? 'database' : 'mock'
}
