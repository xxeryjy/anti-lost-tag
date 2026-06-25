import { createAuthUser, findAuthUserByEmail, normalizePreferredLocale, toAuthUserDto } from '~/server/services/auth-users'
import { createUser, findUserByEmail, verifyUserEmail } from '~/server/services/mock-data'
import { consumeRegisterCode } from '~/server/services/register-codes'
import { fail, ok } from '~/server/utils/api-response'
import { getApiDataSource } from '~/server/utils/data-source'
import { hashPassword } from '~/server/utils/password'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: string; password?: string; code?: string; preferredLocale?: 'zh-CN' | 'en' | 'ja' }>(event)
  const config = useRuntimeConfig(event)

  if (!body.email || !body.password || !body.code) {
    fail(400, 'BAD_REQUEST', '邮箱、密码和验证码不能为空')
  }

  if (getApiDataSource(event) === 'mock') {
    if (findUserByEmail(body.email)) {
      fail(409, 'EMAIL_ALREADY_EXISTS', '邮箱已注册')
    }

    if (body.code !== config.authMockCode) {
      fail(400, 'INVALID_VERIFICATION_CODE', '验证码错误')
    }

    createUser(body.email, body.password, normalizePreferredLocale(body.preferredLocale))
    const user = verifyUserEmail(body.email)

    return ok({
      user: {
        id: user!.id,
        email: user!.email,
        emailVerifiedAt: user!.emailVerifiedAt,
        preferredLocale: user!.preferredLocale
      }
    })
  }

  if (await findAuthUserByEmail(body.email)) {
    fail(409, 'EMAIL_ALREADY_EXISTS', '邮箱已注册')
  }

  if (!(await consumeRegisterCode(event, {
    email: body.email,
    code: body.code
  }))) {
    fail(400, 'INVALID_VERIFICATION_CODE', '验证码错误')
  }

  const passwordHash = await hashPassword(body.password)
  const user = await createAuthUser(body.email, passwordHash, body.preferredLocale, {
    emailVerifiedAt: new Date()
  })

  return ok({
    user: toAuthUserDto(user)
  })
})
