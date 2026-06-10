import { findTagById, updateTagProfile } from '~/server/services/mock-data'
import { fail, ok } from '~/server/utils/api-response'
import { getMockSessionUserId } from '~/server/utils/session'

export default defineEventHandler(async (event) => {
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
    fail(403, 'FORBIDDEN', '无权修改该标签资料')
  }

  const body = await readBody<Record<string, unknown>>(event)
  const displayName = typeof body.displayName === 'string' ? body.displayName.trim() : ''
  if (!displayName) {
    fail(400, 'DISPLAY_NAME_REQUIRED', '展示名称不能为空')
  }

  const profile = updateTagProfile(id, {
    ...body,
    displayName
  } as Parameters<typeof updateTagProfile>[1])

  if (!profile) {
    fail(404, 'TAG_NOT_FOUND', '标签资料不存在')
  }

  return ok({
    profile
  })
})
