import { createUser, findUserByEmail } from '~/server/services/mock-data'
import { fail, ok } from '~/server/utils/api-response'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: string; password?: string; preferredLocale?: 'zh-CN' | 'en' | 'ja' }>(event)

  if (!body.email || !body.password) {
    fail(400, 'BAD_REQUEST', '邮箱和密码不能为空')
  }
  if (findUserByEmail(body.email)) {
    fail(409, 'EMAIL_ALREADY_EXISTS', '邮箱已注册')
  }

  const user = createUser(body.email, body.password, body.preferredLocale || 'zh-CN')
  return ok({
    user: {
      id: user.id,
      email: user.email,
      emailVerifiedAt: user.emailVerifiedAt,
      preferredLocale: user.preferredLocale
    },
    nextStep: 'VERIFY_EMAIL'
  })
})
