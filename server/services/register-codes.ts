import { createHash, randomInt, timingSafeEqual } from 'node:crypto'
import type { H3Event } from 'h3'
import { normalizeEmail } from '~/server/services/auth-users'
import { isMailDeliveryEnabled, sendAuthCodeEmail } from '~/server/services/mail'
import { prisma } from '~/server/utils/prisma'
import { readPositiveRuntimeNumber } from '~/server/utils/request'

function generateRegisterCode() {
  return String(randomInt(0, 1_000_000)).padStart(6, '0')
}

function getRegisterCodeSecret(event: H3Event) {
  const config = useRuntimeConfig(event)
  return String(config.sessionSecret || 'dev-session-secret')
}

function hashRegisterCode(event: H3Event, email: string, code: string) {
  return createHash('sha256')
    .update(`${normalizeEmail(email)}:REGISTER:${code}:${getRegisterCodeSecret(event)}`)
    .digest('hex')
}

function buildRegisterActionUrl(event: H3Event, payload: { email: string; code: string }) {
  const appUrl = String(useRuntimeConfig(event).public.appUrl || 'http://localhost:3000').replace(/\/$/, '')
  const query = new URLSearchParams({
    email: normalizeEmail(payload.email),
    code: payload.code
  })

  return `${appUrl}/auth/register?${query.toString()}`
}

function isSameHash(left: string, right: string) {
  const leftBuffer = Buffer.from(left, 'hex')
  const rightBuffer = Buffer.from(right, 'hex')
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer)
}

export async function createAndSendRegisterCode(
  event: H3Event,
  payload: {
    email: string
  }
) {
  const config = useRuntimeConfig(event)
  const expiresMinutes = readPositiveRuntimeNumber(config.authCodeExpiresMinutes, 10)
  const code = isMailDeliveryEnabled(event) ? generateRegisterCode() : String(config.authMockCode || '123456')
  const normalizedEmail = normalizeEmail(payload.email)
  const expiresAt = new Date(Date.now() + expiresMinutes * 60 * 1000)

  await prisma.$transaction(async (transaction) => {
    await transaction.registerCode.updateMany({
      where: {
        email: normalizedEmail,
        consumedAt: null
      },
      data: {
        consumedAt: new Date()
      }
    })

    await transaction.registerCode.create({
      data: {
        email: normalizedEmail,
        codeHash: hashRegisterCode(event, normalizedEmail, code),
        expiresAt
      }
    })
  })

  const mailResult = await sendAuthCodeEmail(event, {
    to: normalizedEmail,
    code,
    purpose: 'EMAIL_VERIFY',
    expiresMinutes,
    actionUrl: buildRegisterActionUrl(event, {
      email: normalizedEmail,
      code
    })
  })

  return {
    expiresAt,
    mailResult
  }
}

export async function consumeRegisterCode(
  event: H3Event,
  payload: {
    email: string
    code: string
  }
) {
  const normalizedEmail = normalizeEmail(payload.email)
  const record = await prisma.registerCode.findFirst({
    where: {
      email: normalizedEmail,
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

  const expectedHash = hashRegisterCode(event, normalizedEmail, payload.code)
  if (!isSameHash(record.codeHash, expectedHash)) {
    return false
  }

  await prisma.registerCode.update({
    where: {
      id: record.id
    },
    data: {
      consumedAt: new Date()
    }
  })

  return true
}
