import { findTagById, updateTagStatus } from '~/server/services/mock-data'
import { fail, ok } from '~/server/utils/api-response'
import { getMockSessionUserId } from '~/server/utils/session'
import type { TagStatus } from '~/types/smarttag'

export default defineEventHandler(async (event) => {
  const userId = getMockSessionUserId(event)
  if (!userId) {
    fail(401, 'UNAUTHORIZED', '请先登录')
  }

  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody<{ status?: TagStatus }>(event)
  const tag = findTagById(id)

  if (!tag) {
    fail(404, 'TAG_NOT_FOUND', '标签不存在')
  }
  if (tag.userId !== userId) {
    fail(403, 'FORBIDDEN', '无权修改该标签状态')
  }
  if (!body.status) {
    fail(400, 'BAD_REQUEST', '标签状态不能为空')
  }

  const updated = updateTagStatus(id, body.status)
  return ok({
    tag: updated
  })
})
