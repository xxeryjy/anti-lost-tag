import { findUserByEmail, verifyUserEmail } from '~/server/services/mock-data'
import { fail, ok } from '~/server/utils/api-response'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: string; code?: string }>(event)
  const config = useRuntimeConfig(event)

  if (!body.email || !body.code) {
    fail(400, 'BAD_REQUEST', '邮箱和验证码不能为空')
  }

  const user = findUserByEmail(body.email)
  if (!user) {
    fail(404, 'USER_NOT_FOUND', '用户不存在')
  }
  if (user.emailVerifiedAt) {
    fail(409, 'EMAIL_ALREADY_VERIFIED', '邮箱已完成验证')
  }
  if (body.code !== config.authMockCode) {
    fail(400, 'INVALID_VERIFICATION_CODE', '验证码错误')
  }

  const verifiedUser = verifyUserEmail(body.email)
  return ok({
    user: {
      id: verifiedUser!.id,
      email: verifiedUser!.email,
      emailVerifiedAt: verifiedUser!.emailVerifiedAt
    }
  })
})
