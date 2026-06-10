import { findTagByUid } from '~/server/services/mock-data'
import { getTagByUid } from '~/server/services/tags'
import { fail, ok } from '~/server/utils/api-response'
import { getApiDataSource } from '~/server/utils/data-source'
import { getSessionUserId } from '~/server/utils/session'
import type { TagProfile } from '~/types/smarttag'

function toPublicProfile(profile: TagProfile | null) {
  if (!profile) {
    return null
  }

  const canShowDirectContact = !profile.privacyMode

  return {
    ...profile,
    ownerPhone: canShowDirectContact ? profile.ownerPhone : null,
    backupPhone: canShowDirectContact ? profile.backupPhone : null,
    notificationEmail: canShowDirectContact ? profile.notificationEmail : null,
    homeAddress: canShowDirectContact && profile.showHomeAddress ? profile.homeAddress : null,
    canSendMessage: profile.privacyMode
  }
}

export default defineEventHandler(async (event) => {
  const uid = getRouterParam(event, 'uid') || ''
  const tag = getApiDataSource(event) === 'database'
    ? await getTagByUid(uid)
    : findTagByUid(uid)

  if (!tag) {
    fail(404, 'TAG_NOT_FOUND', '标签不存在')
  }

  const userId = getSessionUserId(event)

  return ok({
    uid: tag.uid,
    status: tag.status,
    rewardText: tag.rewardText,
    isBound: Boolean(tag.userId),
    profile: toPublicProfile(tag.profile),
    lostBanner: tag.status === 'LOST',
    viewer: {
      isAuthenticated: Boolean(userId),
      isOwner: Boolean(userId && tag.userId === userId)
    }
  })
})
