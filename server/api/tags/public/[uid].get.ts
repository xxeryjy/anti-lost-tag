import { findTagByUid } from '~/server/services/mock-data'
import { fail, ok } from '~/server/utils/api-response'
import { getMockSessionUserId } from '~/server/utils/session'
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

export default defineEventHandler((event) => {
  const uid = getRouterParam(event, 'uid') || ''
  const tag = findTagByUid(uid)
  if (!tag) {
    fail(404, 'TAG_NOT_FOUND', '标签不存在')
  }
  const userId = getMockSessionUserId(event)

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
