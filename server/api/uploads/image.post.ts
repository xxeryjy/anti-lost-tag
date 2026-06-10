import { fail, ok } from '~/server/utils/api-response'
import { getMockSessionUserId } from '~/server/utils/session'

const allowedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])
const maxImageSize = 5 * 1024 * 1024

const mockImageUrl =
  'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20viewBox%3D%220%200%20600%20400%22%3E%3Crect%20width%3D%22600%22%20height%3D%22400%22%20fill%3D%22%23f7f6f1%22/%3E%3Ccircle%20cx%3D%22195%22%20cy%3D%22174%22%20r%3D%2264%22%20fill%3D%22%23dd806f%22/%3E%3Cpath%20d%3D%22M104%20320c42-70%2085-105%20130-105s85%2035%20130%20105H104Z%22%20fill%3D%22%235f9f8f%22/%3E%3Crect%20x%3D%22372%22%20y%3D%2298%22%20width%3D%22142%22%20height%3D%22182%22%20rx%3D%2230%22%20fill%3D%22%23315f57%22/%3E%3Ccircle%20cx%3D%22443%22%20cy%3D%22190%22%20r%3D%2228%22%20fill%3D%22%23fffdf8%22/%3E%3Ctext%20x%3D%22300%22%20y%3D%22358%22%20text-anchor%3D%22middle%22%20font-family%3D%22Arial%2C%20sans-serif%22%20font-size%3D%2230%22%20fill%3D%22%2324332f%22%3ESmartTag%20Mock%20Photo%3C/text%3E%3C/svg%3E'

export default defineEventHandler(async (event) => {
  const userId = getMockSessionUserId(event)
  if (!userId) {
    fail(401, 'UNAUTHORIZED', '请先登录')
  }

  const formData = await readMultipartFormData(event)
  const image = formData?.find((field) => field.name === 'image' && field.filename)

  if (!image || !image.data?.length) {
    fail(400, 'IMAGE_REQUIRED', '请上传图片文件')
  }
  if (!allowedImageTypes.has(image.type || '')) {
    fail(400, 'UNSUPPORTED_IMAGE_TYPE', '仅支持 JPG、PNG 或 WebP 图片')
  }
  if (image.data.length > maxImageSize) {
    fail(400, 'IMAGE_TOO_LARGE', '图片不能超过 5MB')
  }

  return ok({
    url: mockImageUrl
  })
})
