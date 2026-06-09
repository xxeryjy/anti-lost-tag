import { findUserByEmail } from '~/server/services/mock-data'
import { fail, ok } from '~/server/utils/api-response'
import { setMockSession } from '~/server/utils/session'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: string; password?: string }>(event)

  if (!body.email || !body.password) {
    fail(400, 'BAD_REQUEST', '邮箱和密码不能为空')
  }

  const user = findUserByEmail(body.email)
  if (!user || user.password !== body.password) {
    fail(401, 'INVALID_CREDENTIALS', '邮箱或密码错误')
  }
  if (!user.emailVerifiedAt) {
    fail(403, 'EMAIL_NOT_VERIFIED', '请先完成邮箱验证')
  }

  setMockSession(event, user.id)

  return ok({
    user: {
      id: user.id,
      email: user.email,
      preferredLocale: user.preferredLocale,
      emailVerifiedAt: user.emailVerifiedAt
    }
  })
})
