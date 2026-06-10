import { appendScan, findTagByUid } from '~/server/services/mock-data'
import { fail, ok } from '~/server/utils/api-response'

function getRequestIp(event: H3Event) {
  const forwardedFor = getHeader(event, 'x-forwarded-for')?.split(',')[0]?.trim()
  return forwardedFor || event.node.req.socket.remoteAddress || '127.0.0.1'
}

export default defineEventHandler(async (event) => {
  const uid = getRouterParam(event, 'uid') || ''
  if (!findTagByUid(uid)) {
    fail(404, 'TAG_NOT_FOUND', '标签不存在')
  }

  const body = await readBody<Record<string, unknown>>(event)
  const scan = appendScan(uid, {
    ...body,
    ipAddress: getRequestIp(event),
    userAgent: getHeader(event, 'user-agent') || 'Mock Browser'
  } as Parameters<typeof appendScan>[1])
  return ok({
    scan
  })
})
