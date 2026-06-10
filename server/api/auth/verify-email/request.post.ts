import { createAndSendAuthCode } from '~/server/services/auth-codes'
import { findAuthUserByEmail } from '~/server/services/auth-users'
import { findUserByEmail } from '~/server/services/mock-data'
import { fail, ok } from '~/server/utils/api-response'
import { getApiDataSource } from '~/server/utils/data-source'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: string }>(event)
  if (!body.email) {
    fail(400, 'BAD_REQUEST', '邮箱不能为空')
  }

  const dataSource = getApiDataSource(event)
  const user = dataSource === 'mock'
    ? findUserByEmail(body.email)
    : await findAuthUserByEmail(body.email)

  if (!user) {
    fail(404, 'USER_NOT_FOUND', '用户不存在')
  }
  if (user.emailVerifiedAt) {
    fail(409, 'EMAIL_ALREADY_VERIFIED', '邮箱已完成验证')
  }

  if (dataSource === 'database') {
    const codeDelivery = await createAndSendAuthCode(event, {
      userId: user.id,
      email: user.email,
      purpose: 'EMAIL_VERIFY'
    })
    if (!codeDelivery.mailResult.mockMode && !codeDelivery.mailResult.sent) {
      fail(500, 'EMAIL_SEND_FAILED', '验证码邮件发送失败，请稍后重试')
    }

    return ok({
      accepted: true,
      mockMode: codeDelivery.mailResult.mockMode,
      provider: codeDelivery.mailResult.provider,
      expiresAt: codeDelivery.expiresAt.toISOString()
    })
  }

  return ok({
    accepted: true,
    mockMode: true
  })
})
