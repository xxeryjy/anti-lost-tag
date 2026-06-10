import { createHmac, timingSafeEqual } from 'node:crypto'
import type { H3Event } from 'h3'
import { getApiDataSource } from '~/server/utils/data-source'

const SESSION_COOKIE_NAME = 'smarttag_session'

function createSessionSignature(value: string, secret: string) {
  return createHmac('sha256', secret).update(value).digest('hex')
}

function getSessionSecret(event: H3Event) {
  const config = useRuntimeConfig(event)
  const secret = String(config.sessionSecret || 'dev-session-secret')
  if (process.env.NODE_ENV === 'production' && (secret === 'dev-session-secret' || secret.length < 32)) {
    throw createError({
      statusCode: 500,
      statusMessage: '生产环境 SESSION_SECRET 必须使用至少 32 位的非默认密钥'
    })
  }

  return secret
}

function signSessionUserId(userId: number, event: H3Event) {
  const value = String(userId)
  return `${value}.${createSessionSignature(value, getSessionSecret(event))}`
}

function readSignedSessionUserId(event: H3Event) {
  const cookieValue = getCookie(event, SESSION_COOKIE_NAME)
  if (!cookieValue) {
    return null
  }

  // 兼容早期 mock 阶段的纯数字 cookie，方便本地开发无缝切换。
  if (/^\d+$/.test(cookieValue)) {
    return getApiDataSource(event) === 'mock' ? Number(cookieValue) : null
  }

  const [value, signature] = cookieValue.split('.')
  if (!value || !signature || !/^\d+$/.test(value)) {
    return null
  }

  const expectedSignature = createSessionSignature(value, getSessionSecret(event))
  const signatureBuffer = Buffer.from(signature, 'hex')
  const expectedBuffer = Buffer.from(expectedSignature, 'hex')
  if (signatureBuffer.length !== expectedBuffer.length || !timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return null
  }

  return Number(value)
}

export function setSession(event: H3Event, userId: number) {
  setCookie(event, SESSION_COOKIE_NAME, signSessionUserId(userId, event), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production'
  })
}

export function setMockSession(event: H3Event, userId: number) {
  setSession(event, userId)
}

export function clearAuthSession(event: H3Event) {
  deleteCookie(event, SESSION_COOKIE_NAME, {
    path: '/'
  })
}

export function clearMockSession(event: H3Event) {
  clearAuthSession(event)
}

export function getSessionUserId(event: H3Event) {
  return readSignedSessionUserId(event)
}

export function getMockSessionUserId(event: H3Event) {
  return getSessionUserId(event)
}
