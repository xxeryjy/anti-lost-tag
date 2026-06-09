import { findUserByEmail } from '~/server/services/mock-data'
import { fail, ok } from '~/server/utils/api-response'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: string }>(event)
  if (!body.email) {
    fail(400, 'BAD_REQUEST', '邮箱不能为空')
  }
  if (!findUserByEmail(body.email)) {
    fail(404, 'USER_NOT_FOUND', '用户不存在')
  }

  return ok({
    accepted: true,
    mockMode: true
  })
})
