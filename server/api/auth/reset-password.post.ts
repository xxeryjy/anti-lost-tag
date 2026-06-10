import { consumeAuthCode } from '~/server/services/auth-codes'
import { findAuthUserByEmail, updateAuthUserPassword } from '~/server/services/auth-users'
import { findUserByEmail, resetUserPassword } from '~/server/services/mock-data'
import { fail, ok } from '~/server/utils/api-response'
import { getApiDataSource } from '~/server/utils/data-source'
import { hashPassword } from '~/server/utils/password'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: string; code?: string; newPassword?: string }>(event)
  const config = useRuntimeConfig(event)

  if (!body.email || !body.code || !body.newPassword) {
    fail(400, 'BAD_REQUEST', '邮箱、验证码和新密码不能为空')
  }

  if (getApiDataSource(event) === 'mock') {
    if (body.code !== config.authMockCode) {
      fail(400, 'INVALID_VERIFICATION_CODE', '验证码错误')
    }
    if (!findUserByEmail(body.email)) {
      fail(404, 'USER_NOT_FOUND', '用户不存在')
    }

    resetUserPassword(body.email, body.newPassword)
    return ok({
      message: '密码重置成功'
    })
  }

  if (!(await findAuthUserByEmail(body.email))) {
    fail(404, 'USER_NOT_FOUND', '用户不存在')
  }
  if (!(await consumeAuthCode(event, {
    email: body.email,
    purpose: 'PASSWORD_RESET',
    code: body.code
  }))) {
    fail(400, 'INVALID_VERIFICATION_CODE', '验证码错误')
  }

  await updateAuthUserPassword(body.email, await hashPassword(body.newPassword))
  return ok({
    message: '密码重置成功'
  })
})
