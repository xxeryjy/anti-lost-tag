import type { PreferredLocale as ApiPreferredLocale } from '~/types/smarttag'
import { prisma } from '~/server/utils/prisma'

export interface AuthUserDto {
  id: number
  email: string
  preferredLocale: ApiPreferredLocale
  emailVerifiedAt: string | null
}

const apiToDbLocale: Record<ApiPreferredLocale, 'ZH_CN' | 'EN' | 'JA'> = {
  'zh-CN': 'ZH_CN',
  en: 'EN',
  ja: 'JA'
}

const dbToApiLocale: Record<'ZH_CN' | 'EN' | 'JA', ApiPreferredLocale> = {
  ZH_CN: 'zh-CN',
  EN: 'en',
  JA: 'ja'
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export function normalizePreferredLocale(locale?: string): ApiPreferredLocale {
  if (locale === 'en' || locale === 'ja' || locale === 'zh-CN') {
    return locale
  }
  return 'zh-CN'
}

export function toAuthUserDto(user: {
  id: number
  email: string
  preferredLocale: 'ZH_CN' | 'EN' | 'JA'
  emailVerifiedAt: Date | null
}): AuthUserDto {
  return {
    id: user.id,
    email: user.email,
    preferredLocale: dbToApiLocale[user.preferredLocale],
    emailVerifiedAt: user.emailVerifiedAt?.toISOString() || null
  }
}

export async function findAuthUserByEmail(email: string) {
  const user = await prisma.user.findUnique({
    where: {
      email: normalizeEmail(email)
    }
  })
  return user
}

export async function findAuthUserById(id: number) {
  return prisma.user.findUnique({
    where: {
      id
    }
  })
}

export async function createAuthUser(
  email: string,
  passwordHash: string,
  preferredLocale?: string,
  options?: {
    emailVerifiedAt?: Date | null
  }
) {
  return prisma.user.create({
    data: {
      email: normalizeEmail(email),
      passwordHash,
      preferredLocale: apiToDbLocale[normalizePreferredLocale(preferredLocale)],
      emailVerifiedAt: options?.emailVerifiedAt ?? null
    }
  })
}

export async function markAuthUserEmailVerified(email: string) {
  return prisma.user.update({
    where: {
      email: normalizeEmail(email)
    },
    data: {
      emailVerifiedAt: new Date()
    }
  })
}

export async function updateAuthUserPassword(email: string, passwordHash: string) {
  return prisma.user.update({
    where: {
      email: normalizeEmail(email)
    },
    data: {
      passwordHash
    }
  })
}
