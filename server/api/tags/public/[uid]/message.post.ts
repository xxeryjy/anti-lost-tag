import { canCreatePrivacyMessage, createPrivacyMessage, findTagByUid } from '~/server/services/mock-data'
import { fail, ok } from '~/server/utils/api-response'

function getRequestIp(event: H3Event) {
  const forwardedFor = getHeader(event, 'x-forwarded-for')?.split(',')[0]?.trim()
  return forwardedFor || event.node.req.socket.remoteAddress || '127.0.0.1'
}

export default defineEventHandler(async (event) => {
  const uid = getRouterParam(event, 'uid') || ''
  const tag = findTagByUid(uid)
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
