import { getProfileByTagId } from '~/server/services/mock-data'
import { fail, ok } from '~/server/utils/api-response'
import { getMockSessionUserId } from '~/server/utils/session'

export default defineEventHandler((event) => {
  if (!getMockSessionUserId(event)) {
    fail(401, 'UNAUTHORIZED', '请先登录')
  }

  const id = Number(getRouterParam(event, 'id'))
  const profile = getProfileByTagId(id)
  if (!profile) {
    fail(404, 'TAG_NOT_FOUND', '标签资料不存在')
  }

  return ok({
    profile
  })
})
