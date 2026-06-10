import { listMyTags } from '~/server/services/mock-data'
import { listOwnerTags } from '~/server/services/tags'
import { fail, ok } from '~/server/utils/api-response'
import { getApiDataSource } from '~/server/utils/data-source'
import { getSessionUserId } from '~/server/utils/session'

export default defineEventHandler(async (event) => {
  const userId = getSessionUserId(event)
  if (!userId) {
    fail(401, 'UNAUTHORIZED', '请先登录')
  }

  const items = getApiDataSource(event) === 'mock'
    ? listMyTags(userId)
    : await listOwnerTags(userId)

  return ok({
    items
  })
})
