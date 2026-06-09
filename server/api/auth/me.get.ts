import { findUserById } from '~/server/services/mock-data'
import { fail, ok } from '~/server/utils/api-response'
import { getMockSessionUserId } from '~/server/utils/session'

export default defineEventHandler((event) => {
  const userId = getMockSessionUserId(event)
  if (!userId) {
    fail(401, 'UNAUTHORIZED', '请先登录')
  }

  const user = findUserById(userId)
  if (!user) {
    fail(401, 'UNAUTHORIZED', '登录状态已失效')
  }

  return ok({
    user: {
      id: user.id,
      email: user.email,
      preferredLocale: user.preferredLocale,
      emailVerifiedAt: user.emailVerifiedAt
    }
  })
})
