import { findAuthUserById, toAuthUserDto } from '~/server/services/auth-users'
import { findUserById } from '~/server/services/mock-data'
import { fail, ok } from '~/server/utils/api-response'
import { getApiDataSource } from '~/server/utils/data-source'
import { getSessionUserId } from '~/server/utils/session'

export default defineEventHandler(async (event) => {
  const userId = getSessionUserId(event)
  if (!userId) {
    fail(401, 'UNAUTHORIZED', '请先登录')
  }

  if (getApiDataSource(event) === 'mock') {
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
  }

  const user = await findAuthUserById(userId)
  if (!user) {
    fail(401, 'UNAUTHORIZED', '登录状态已失效')
  }

  return ok({
    user: toAuthUserDto(user)
  })
})
