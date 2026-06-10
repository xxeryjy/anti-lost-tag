import { findAuthUserByEmail } from '~/server/services/auth-users'
import { findUserByEmail } from '~/server/services/mock-data'
import { fail, ok } from '~/server/utils/api-response'
import { getApiDataSource } from '~/server/utils/data-source'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: string }>(event)
  if (!body.email) {
    fail(400, 'BAD_REQUEST', '邮箱不能为空')
  }

  const user = getApiDataSource(event) === 'mock'
    ? findUserByEmail(body.email)
    : await findAuthUserByEmail(body.email)

  if (!user) {
    fail(404, 'USER_NOT_FOUND', '用户不存在')
  }

  return ok({
    accepted: true,
    mockMode: true
  })
})
