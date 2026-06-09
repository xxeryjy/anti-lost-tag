import { findTagByUid } from '~/server/services/mock-data'
import { fail, ok } from '~/server/utils/api-response'

export default defineEventHandler((event) => {
  const uid = getRouterParam(event, 'uid') || ''
  const tag = findTagByUid(uid)
  if (!tag) {
    fail(404, 'TAG_NOT_FOUND', '标签不存在')
  }

  return ok({
    uid: tag.uid,
    status: tag.status,
    rewardText: tag.rewardText,
    isBound: Boolean(tag.userId),
    profile: tag.profile,
    lostBanner: tag.status === 'LOST'
  })
})
