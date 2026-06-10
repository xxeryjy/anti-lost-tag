import { findAuthUserByEmail, toAuthUserDto } from '~/server/services/auth-users'
import { findUserByEmail } from '~/server/services/mock-data'
import { fail, ok } from '~/server/utils/api-response'
import { getApiDataSource } from '~/server/utils/data-source'
import { verifyPassword } from '~/server/utils/password'
import { setSession } from '~/server/utils/session'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: string; password?: string }>(event)

  if (!body.email || !body.password) {
    fail(400, 'BAD_REQUEST', '邮箱和密码不能为空')
  }

  if (getApiDataSource(event) === 'mock') {
    const user = findUserByEmail(body.email)
    if (!user || user.password !== body.password) {
      fail(401, 'INVALID_CREDENTIALS', '邮箱或密码错误')
    }
    if (!user.emailVerifiedAt) {
      fail(403, 'EMAIL_NOT_VERIFIED', '请先完成邮箱验证')
    }

    setSession(event, user.id)

    return ok({
      user: {
        id: user.id,
        email: user.email,
        preferredLocale: user.preferredLocale,
        emailVerifiedAt: user.emailVerifiedAt
      }
    })
  }

  const user = await findAuthUserByEmail(body.email)
  if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
    fail(401, 'INVALID_CREDENTIALS', '邮箱或密码错误')
  }
  if (!user.emailVerifiedAt) {
    fail(403, 'EMAIL_NOT_VERIFIED', '请先完成邮箱验证')
  }

  setSession(event, user.id)

  return ok({
    user: toAuthUserDto(user)
  })
})
