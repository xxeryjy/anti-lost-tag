import { createHash, randomInt, timingSafeEqual } from 'node:crypto'
import type { H3Event } from 'h3'
import { normalizeEmail } from '~/server/services/auth-users'
import { isMailDeliveryEnabled, sendAuthCodeEmail } from '~/server/services/mail'
import { prisma } from '~/server/utils/prisma'
import { readPositiveRuntimeNumber } from '~/server/utils/request'

export type AuthCodePurpose = 'EMAIL_VERIFY' | 'PASSWORD_RESET'

function generateAuthCode() {
  return String(randomInt(0, 1_000_000)).padStart(6, '0')
}

function getAuthCodeSecret(event: H3Event) {
  const config = useRuntimeConfig(event)
  return String(config.sessionSecret || 'dev-session-secret')
}

function hashAuthCode(event: H3Event, email: string, purpose: AuthCodePurpose, code: string) {
  return createHash('sha256')
    .update(`${normalizeEmail(email)}:${purpose}:${code}:${getAuthCodeSecret(event)}`)
    .digest('hex')
}

function buildAuthActionUrl(event: H3Event, payload: { email: string; code: string; purpose: AuthCodePurpose }) {
  const appUrl = String(useRuntimeConfig(event).public.appUrl || 'http://localhost:3000').replace(/\/$/, '')
  const query = new URLSearchParams({
    email: normalizeEmail(payload.email),
    code: payload.code
  })
  const path = payload.purpose === 'EMAIL_VERIFY'
    ? '/auth/register'
    : '/auth/reset-password'

  return `${appUrl}${path}?${query.toString()}`
}

function isSameHash(left: string, right: string) {
  const leftBuffer = Buffer.from(left, 'hex')
  const rightBuffer = Buffer.from(right, 'hex')
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer)
}

export async function createAndSendAuthCode(
  event: H3Event,
  payload: {
    userId: number
    email: string
    purpose: AuthCodePurpose
  }
) {
  const config = useRuntimeConfig(event)
  const expiresMinutes = readPositiveRuntimeNumber(config.authCodeExpiresMinutes, 10)
  const code = isMailDeliveryEnabled(event) ? generateAuthCode() : String(config.authMockCode || '123456')
  const normalizedEmail = normalizeEmail(payload.email)
  const expiresAt = new Date(Date.now() + expiresMinutes * 60 * 1000)

  await prisma.$transaction(async (transaction) => {
    await transaction.authCode.updateMany({
      where: {
        userId: payload.userId,
        purpose: payload.purpose,
        consumedAt: null
      },
      data: {
        consumedAt: new Date()
      }
    })
    await transaction.authCode.create({
      data: {
        userId: payload.userId,
        email: normalizedEmail,
        purpose: payload.purpose,
        codeHash: hashAuthCode(event, normalizedEmail, payload.purpose, code),
        expiresAt
      }
    })
  })

  const mailResult = await sendAuthCodeEmail(event, {
    to: normalizedEmail,
    code,
    purpose: payload.purpose,
    expiresMinutes,
    actionUrl: buildAuthActionUrl(event, {
      email: normalizedEmail,
      code,
      purpose: payload.purpose
    })
  })

  return {
    expiresAt,
    mailResult
  }
}

export async function consumeAuthCode(
  event: H3Event,
  payload: {
    email: string
    purpose: AuthCodePurpose
    code: string
  }
) {
  const normalizedEmail = normalizeEmail(payload.email)
  const record = await prisma.authCode.findFirst({
    where: {
      email: normalizedEmail,
      purpose: payload.purpose,
      consumedAt: null,
      expiresAt: {
        gt: new Date()
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  if (!record) {
    return false
  }

  const expectedHash = hashAuthCode(event, normalizedEmail, payload.purpose, payload.code)
  if (!isSameHash(record.codeHash, expectedHash)) {
    return false
  }

  await prisma.authCode.update({
    where: {
      id: record.id
    },
    data: {
      consumedAt: new Date()
    }
  })

  return true
}
