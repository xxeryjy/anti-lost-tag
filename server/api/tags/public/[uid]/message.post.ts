import { canCreatePrivacyMessage, createPrivacyMessage, findTagByUid } from '~/server/services/mock-data'
import { sendPrivacyMessageNotificationEmail } from '~/server/services/mail'
import { createPublicPrivacyMessage, getTagByUid, hasRecentPrivacyMessage, updatePrivacyMessageDeliveryStatus } from '~/server/services/tags'
import { fail, ok } from '~/server/utils/api-response'
import { getApiDataSource } from '~/server/utils/data-source'
import { enforceIpRateLimit, getRequestIp, readPositiveRuntimeNumber } from '~/server/utils/request'

export default defineEventHandler(async (event) => {
  const uid = getRouterParam(event, 'uid') || ''
  const config = useRuntimeConfig(event)
  enforceIpRateLimit(event, {
    scope: `public-message:${uid}`,
    maxRequests: readPositiveRuntimeNumber(config.publicMessageRateLimitMax, 10),
    windowMs: readPositiveRuntimeNumber(config.publicMessageRateLimitWindowMs, 5 * 60 * 1000)
  })

  const dataSource = getApiDataSource(event)
  const tag = dataSource === 'database'
    ? await getTagByUid(uid)
    : findTagByUid(uid)

  if (!tag) {
    fail(404, 'TAG_NOT_FOUND', '标签不存在')
  }
  if (!tag.profile?.privacyMode) {
    fail(403, 'FORBIDDEN', '当前标签未开启隐私留言')
  }

  const body = await readBody<{ finderName?: string | null; finderContact?: string | null; message?: string }>(event)
  const message = body.message?.trim()
  if (!message) {
    fail(400, 'BAD_REQUEST', '留言内容不能为空')
  }
  if (message.length > 800) {
    fail(400, 'BAD_REQUEST', '留言内容不能超过 800 个字符')
  }

  const ipAddress = getRequestIp(event)

  if (dataSource === 'database') {
    if (await hasRecentPrivacyMessage(tag.id, ipAddress)) {
      fail(429, 'RATE_LIMITED', '留言提交过于频繁，请稍后再试')
    }

    let record = await createPublicPrivacyMessage(tag.id, {
      finderName: body.finderName?.trim() || null,
      finderContact: body.finderContact?.trim() || null,
      message
    }, {
      ipAddress
    })

    if (tag.profile?.notificationEmail) {
      const mailResult = await sendPrivacyMessageNotificationEmail(event, {
        to: tag.profile.notificationEmail,
        tagUid: tag.uid,
        displayName: tag.profile.displayName,
        finderName: record.finderName,
        finderContact: record.finderContact,
        message: record.message
      })
      if (mailResult.sent) {
        record = await updatePrivacyMessageDeliveryStatus(record.id, 'SENT')
      } else if (!mailResult.mockMode) {
        record = await updatePrivacyMessageDeliveryStatus(record.id, 'FAILED')
      }
    }

    return ok({
      messageId: record.id,
      deliveryStatus: record.deliveryStatus,
      messageRecord: record
    })
  }

  const submitState = canCreatePrivacyMessage(uid, ipAddress)
  if (submitState.kind === 'RATE_LIMITED') {
    fail(429, 'RATE_LIMITED', '留言提交过于频繁，请稍后再试')
  }

  const record = createPrivacyMessage(uid, {
    finderName: body.finderName?.trim() || null,
    finderContact: body.finderContact?.trim() || null,
    message
  }, {
    ipAddress
  })
  if (!record) {
    fail(500, 'MESSAGE_CREATE_FAILED', '留言保存失败，请稍后重试')
  }

  return ok({
    messageId: record.id,
    deliveryStatus: record.deliveryStatus,
    messageRecord: record
  })
})
