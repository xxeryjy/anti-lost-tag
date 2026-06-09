import { findUserByEmail, resetUserPassword } from '~/server/services/mock-data'
import { fail, ok } from '~/server/utils/api-response'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: string; code?: string; newPassword?: string }>(event)
  const config = useRuntimeConfig(event)

  if (!body.email || !body.code || !body.newPassword) {
    fail(400, 'BAD_REQUEST', '邮箱、验证码和新密码不能为空')
  }

  if (!findUserByEmail(body.email)) {
    fail(404, 'USER_NOT_FOUND', '用户不存在')
  }
  if (body.code !== config.authMockCode) {
    fail(400, 'INVALID_VERIFICATION_CODE', '验证码错误')
  }

  resetUserPassword(body.email, body.newPassword)
  return ok({
    message: '密码重置成功'
  })
})
