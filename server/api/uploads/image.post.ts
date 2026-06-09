import { ok } from '~/server/utils/api-response'

export default defineEventHandler(() => {
  return ok({
    url: '/uploads/mock-image.jpg'
  })
})
