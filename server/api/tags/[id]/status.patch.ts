import { findTagById, updateTagStatus } from '~/server/services/mock-data'
import { getTagById, updateOwnerTagStatus } from '~/server/services/tags'
import { fail, ok } from '~/server/utils/api-response'
import { getApiDataSource } from '~/server/utils/data-source'
import { getSessionUserId } from '~/server/utils/session'
import type { TagStatus } from '~/types/smarttag'

const tagStatuses: TagStatus[] = ['INACTIVE', 'ACTIVE', 'LOST']

export default defineEventHandler(async (event) => {
  const userId = getSessionUserId(event)
  if (!userId) {
    fail(401, 'UNAUTHORIZED', '请先登录')
  }

  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody<{ status?: TagStatus }>(event)
  if (!Number.isInteger(id) || id <= 0) {
    fail(400, 'BAD_REQUEST', '标签 ID 不合法')
  }
  if (!body.status || !tagStatuses.includes(body.status)) {
    fail(400, 'BAD_REQUEST', '标签状态不合法')
  }

  if (getApiDataSource(event) === 'database') {
    const tag = await getTagById(id)
    if (!tag) {
      fail(404, 'TAG_NOT_FOUND', '标签不存在')
    }
    if (tag.userId !== userId) {
      fail(403, 'FORBIDDEN', '无权修改该标签状态')
    }

    return ok({
      tag: await updateOwnerTagStatus(id, body.status)
    })
  }

  const tag = findTagById(id)
  if (!tag) {
    fail(404, 'TAG_NOT_FOUND', '标签不存在')
  }
  if (tag.userId !== userId) {
    fail(403, 'FORBIDDEN', '无权修改该标签状态')
  }

  const updated = updateTagStatus(id, body.status)
  return ok({
    tag: updated
  })
})
