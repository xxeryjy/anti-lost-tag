import { findTagById, getPrivacyMessagesByTagId } from '~/server/services/mock-data'
import { fail, ok } from '~/server/utils/api-response'
import { paginateItems, parsePaginationQuery } from '~/server/utils/pagination'
import { getMockSessionUserId } from '~/server/utils/session'
import type { DeliveryStatus } from '~/types/smarttag'

const deliveryStatuses: DeliveryStatus[] = ['PENDING', 'SENT', 'FAILED']

export default defineEventHandler((event) => {
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
    fail(403, 'FORBIDDEN', '无权查看该标签留言')
  }

  const query = getQuery(event)
  const deliveryStatus = typeof query.deliveryStatus === 'string' && deliveryStatuses.includes(query.deliveryStatus as DeliveryStatus)
    ? query.deliveryStatus as DeliveryStatus
    : undefined
  const { page, pageSize } = parsePaginationQuery(query, 5)

  return ok({
    ...paginateItems(getPrivacyMessagesByTagId(id, { deliveryStatus }), page, pageSize)
  })
})
