import type { H3Event } from 'h3'
import { fail } from '~/server/utils/api-response'

type RateLimitOptions = {
  scope: string
  maxRequests: number
  windowMs: number
}

type RateLimitStore = Map<string, number[]>

const globalForRateLimit = globalThis as typeof globalThis & {
  smarttagRateLimitStore?: RateLimitStore
}

const rateLimitStore = globalForRateLimit.smarttagRateLimitStore || new Map<string, number[]>()

if (process.env.NODE_ENV !== 'production') {
  globalForRateLimit.smarttagRateLimitStore = rateLimitStore
}

function normalizeIpAddress(ipAddress: string) {
  return ipAddress.replace(/^::ffff:/, '')
}

export function getRequestIp(event: H3Event) {
  const forwardedFor = getHeader(event, 'x-forwarded-for')?.split(',')[0]?.trim()
  const realIp = getHeader(event, 'x-real-ip')?.trim()
  const cfIp = getHeader(event, 'cf-connecting-ip')?.trim()
  const socketIp = event.node.req.socket.remoteAddress || '127.0.0.1'

  return normalizeIpAddress(forwardedFor || realIp || cfIp || socketIp)
}

export function readPositiveRuntimeNumber(value: unknown, fallback: number) {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : fallback
}

export function enforceIpRateLimit(event: H3Event, options: RateLimitOptions) {
  if (options.maxRequests <= 0 || options.windowMs <= 0) {
    return
  }

  const now = Date.now()
  const key = `${options.scope}:${getRequestIp(event)}`
  const recentRequests = (rateLimitStore.get(key) || []).filter((timestamp) => now - timestamp < options.windowMs)

  if (recentRequests.length >= options.maxRequests) {
    const oldestTimestamp = recentRequests[0] || now
    const retryAfterSeconds = Math.max(1, Math.ceil((options.windowMs - (now - oldestTimestamp)) / 1000))
    setHeader(event, 'retry-after', String(retryAfterSeconds))
    fail(429, 'RATE_LIMITED', '请求过于频繁，请稍后再试')
  }

  recentRequests.push(now)
  rateLimitStore.set(key, recentRequests)
}
