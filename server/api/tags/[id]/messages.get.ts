import { findTagById, getPrivacyMessagesByTagId } from '~/server/services/mock-data'
import { getTagById, listOwnerTagMessages } from '~/server/services/tags'
import { fail, ok } from '~/server/utils/api-response'
import { getApiDataSource } from '~/server/utils/data-source'
import { paginateItems, parsePaginationQuery } from '~/server/utils/pagination'
import { getSessionUserId } from '~/server/utils/session'
import type { DeliveryStatus } from '~/types/smarttag'

const deliveryStatuses: DeliveryStatus[] = ['PENDING', 'SENT', 'FAILED']

export default defineEventHandler(async (event) => {
  const userId = getSessionUserId(event)
  if (!userId) {
    fail(401, 'UNAUTHORIZED', '请先登录')
  }

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0) {
    fail(400, 'BAD_REQUEST', '标签 ID 不合法')
  }

  const query = getQuery(event)
  const deliveryStatus = typeof query.deliveryStatus === 'string' && deliveryStatuses.includes(query.deliveryStatus as DeliveryStatus)
    ? query.deliveryStatus as DeliveryStatus
    : undefined
  const { page, pageSize } = parsePaginationQuery(query, 5)

  if (getApiDataSource(event) === 'database') {
    const tag = await getTagById(id)
    if (!tag) {
      fail(404, 'TAG_NOT_FOUND', '标签不存在')
    }
    if (tag.userId !== userId) {
      fail(403, 'FORBIDDEN', '无权查看该标签留言')
    }

    return ok({
      ...await listOwnerTagMessages(id, { deliveryStatus }, page, pageSize)
    })
  }

  const tag = findTagById(id)
  if (!tag) {
    fail(404, 'TAG_NOT_FOUND', '标签不存在')
  }
  if (tag.userId !== userId) {
    fail(403, 'FORBIDDEN', '无权查看该标签留言')
  }

  return ok({
    ...paginateItems(getPrivacyMessagesByTagId(id, { deliveryStatus }), page, pageSize)
  })
})
