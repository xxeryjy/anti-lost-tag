import { consumeAuthCode } from '~/server/services/auth-codes'
import { findAuthUserByEmail, markAuthUserEmailVerified, toAuthUserDto } from '~/server/services/auth-users'
import { findUserByEmail, verifyUserEmail } from '~/server/services/mock-data'
import { fail, ok } from '~/server/utils/api-response'
import { getApiDataSource } from '~/server/utils/data-source'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: string; code?: string }>(event)
  const config = useRuntimeConfig(event)

  if (!body.email || !body.code) {
    fail(400, 'BAD_REQUEST', '邮箱和验证码不能为空')
  }

  if (getApiDataSource(event) === 'mock') {
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
  }

  const user = await findAuthUserByEmail(body.email)
  if (!user) {
    fail(404, 'USER_NOT_FOUND', '用户不存在')
  }
  if (user.emailVerifiedAt) {
    fail(409, 'EMAIL_ALREADY_VERIFIED', '邮箱已完成验证')
  }
  if (!(await consumeAuthCode(event, {
    email: body.email,
    purpose: 'EMAIL_VERIFY',
    code: body.code
  }))) {
    fail(400, 'INVALID_VERIFICATION_CODE', '验证码错误')
  }

  const verifiedUser = await markAuthUserEmailVerified(body.email)
  return ok({
    user: toAuthUserDto(verifiedUser)
  })
})
