import { findTagById, getPrivacyMessagesByTagId } from '~/server/services/mock-data'
import { fail, ok } from '~/server/utils/api-response'
import { getMockSessionUserId } from '~/server/utils/session'

export default defineEventHandler((event) => {
  const userId = getMockSessionUserId(event)
  if (!userId) {
    fail(401, 'UNAUTHORIZED', '请先登录')
  }

  const id = Number(getRouterParam(event, 'id'))
  const tag = findTagById(id)
  if (!tag) {
    fail(404, 'TAG_NOT_FOUND', '标签不存在')
  }
  if (tag.userId !== userId) {
    fail(403, 'FORBIDDEN', '无权查看该标签留言')
  }

  return ok({
    items: getPrivacyMessagesByTagId(id)
  })
})
