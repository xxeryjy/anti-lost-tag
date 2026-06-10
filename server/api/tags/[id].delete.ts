import { deleteTag, findTagById } from '~/server/services/mock-data'
import { deleteOwnerTag, getTagById } from '~/server/services/tags'
import { fail, ok } from '~/server/utils/api-response'
import { getApiDataSource } from '~/server/utils/data-source'
import { getSessionUserId } from '~/server/utils/session'

export default defineEventHandler(async (event) => {
  const userId = getSessionUserId(event)
  if (!userId) {
    fail(401, 'UNAUTHORIZED', '请先登录')
  }

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0) {
    fail(400, 'BAD_REQUEST', '标签 ID 不合法')
  }

  if (getApiDataSource(event) === 'database') {
    const tag = await getTagById(id)
    if (!tag) {
      fail(404, 'TAG_NOT_FOUND', '标签不存在')
    }
    if (tag.userId !== userId) {
      fail(403, 'FORBIDDEN', '无权删除该标签')
    }

    return ok({
      tag: await deleteOwnerTag(id)
    })
  }

  const tag = findTagById(id)
  if (!tag) {
    fail(404, 'TAG_NOT_FOUND', '标签不存在')
  }

  if (tag.userId !== userId) {
    fail(403, 'FORBIDDEN', '无权删除该标签')
  }

  const deletedTag = deleteTag(id)
  if (!deletedTag) {
    fail(404, 'TAG_NOT_FOUND', '标签不存在')
  }

  return ok({
    tag: deletedTag
  })
})
