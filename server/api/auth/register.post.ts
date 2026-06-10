import { createAndSendAuthCode } from '~/server/services/auth-codes'
import { createAuthUser, findAuthUserByEmail, normalizePreferredLocale, toAuthUserDto } from '~/server/services/auth-users'
import { createUser, findUserByEmail } from '~/server/services/mock-data'
import { fail, ok } from '~/server/utils/api-response'
import { getApiDataSource } from '~/server/utils/data-source'
import { hashPassword } from '~/server/utils/password'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: string; password?: string; preferredLocale?: 'zh-CN' | 'en' | 'ja' }>(event)

  if (!body.email || !body.password) {
    fail(400, 'BAD_REQUEST', '邮箱和密码不能为空')
  }

  if (getApiDataSource(event) === 'mock') {
    if (findUserByEmail(body.email)) {
      fail(409, 'EMAIL_ALREADY_EXISTS', '邮箱已注册')
    }

    const user = createUser(body.email, body.password, normalizePreferredLocale(body.preferredLocale))
    return ok({
      user: {
        id: user.id,
        email: user.email,
        emailVerifiedAt: user.emailVerifiedAt,
        preferredLocale: user.preferredLocale
      },
      nextStep: 'VERIFY_EMAIL'
    })
  }

  if (await findAuthUserByEmail(body.email)) {
    fail(409, 'EMAIL_ALREADY_EXISTS', '邮箱已注册')
  }

  const passwordHash = await hashPassword(body.password)
  const user = await createAuthUser(body.email, passwordHash, body.preferredLocale)
  const codeDelivery = await createAndSendAuthCode(event, {
    userId: user.id,
    email: user.email,
    purpose: 'EMAIL_VERIFY'
  })
  if (!codeDelivery.mailResult.mockMode && !codeDelivery.mailResult.sent) {
    fail(500, 'EMAIL_SEND_FAILED', '验证码邮件发送失败，请稍后重试')
  }

  return ok({
    user: toAuthUserDto(user),
    nextStep: 'VERIFY_EMAIL',
    codeDelivery: {
      mockMode: codeDelivery.mailResult.mockMode,
      provider: codeDelivery.mailResult.provider,
      expiresAt: codeDelivery.expiresAt.toISOString()
    }
  })
})
