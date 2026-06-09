import { updateTagProfile } from '~/server/services/mock-data'
import { fail, ok } from '~/server/utils/api-response'
import { getMockSessionUserId } from '~/server/utils/session'

export default defineEventHandler(async (event) => {
  if (!getMockSessionUserId(event)) {
    fail(401, 'UNAUTHORIZED', '请先登录')
  }

  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody<Record<string, unknown>>(event)
  const profile = updateTagProfile(id, body as Parameters<typeof updateTagProfile>[1])

  if (!profile) {
    fail(404, 'TAG_NOT_FOUND', '标签资料不存在')
  }

  return ok({
    profile
  })
})
