import { findTagById, updateTagProfile } from '~/server/services/mock-data'
import { getTagById, updateOwnerTagProfile, type UpdateTagProfilePayload } from '~/server/services/tags'
import { fail, ok } from '~/server/utils/api-response'
import { getApiDataSource } from '~/server/utils/data-source'
import { getSessionUserId } from '~/server/utils/session'
import type { PetKind, ProfileCategory, ProfileSex } from '~/types/smarttag'

const profileCategories: ProfileCategory[] = ['PET', 'ITEM']
const petKinds: PetKind[] = ['CAT', 'DOG', 'OTHER']
const profileSexes: ProfileSex[] = ['MALE', 'FEMALE', 'UNKNOWN']

function readNullableString(value: unknown) {
  if (value === null) {
    return null
  }
  if (typeof value === 'string') {
    return value.trim() || null
  }
  return undefined
}

function readNullableBoolean(value: unknown) {
  if (value === null || typeof value === 'boolean') {
    return value
  }
  return undefined
}

export default defineEventHandler(async (event) => {
  const userId = getSessionUserId(event)
  if (!userId) {
    fail(401, 'UNAUTHORIZED', '请先登录')
  }

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0) {
    fail(400, 'BAD_REQUEST', '标签 ID 不合法')
  }

  const body = await readBody<Record<string, unknown>>(event)
  const displayName = typeof body.displayName === 'string' ? body.displayName.trim() : ''
  if (!displayName) {
    fail(400, 'DISPLAY_NAME_REQUIRED', '展示名称不能为空')
  }
  if (body.category !== undefined && !profileCategories.includes(body.category as ProfileCategory)) {
    fail(400, 'BAD_REQUEST', '资料类型不合法')
  }
  if (body.petKind !== undefined && body.petKind !== null && !petKinds.includes(body.petKind as PetKind)) {
    fail(400, 'BAD_REQUEST', '宠物类型不合法')
  }
  if (body.sex !== undefined && body.sex !== null && !profileSexes.includes(body.sex as ProfileSex)) {
    fail(400, 'BAD_REQUEST', '性别不合法')
  }

  if (getApiDataSource(event) === 'database') {
    const tag = await getTagById(id)
    if (!tag) {
      fail(404, 'TAG_NOT_FOUND', '标签不存在')
    }
    if (tag.userId !== userId) {
      fail(403, 'FORBIDDEN', '无权修改该标签资料')
    }
    if (!tag.profile) {
      fail(404, 'TAG_NOT_FOUND', '标签资料不存在')
    }

    const payload: UpdateTagProfilePayload = {
      displayName
    }
    if (body.category !== undefined) {
      payload.category = body.category as ProfileCategory
    }
    if (body.petKind !== undefined) {
      payload.petKind = body.petKind === null ? null : body.petKind as PetKind
    }
    if (body.sex !== undefined) {
      payload.sex = body.sex === null ? null : body.sex as ProfileSex
    }

    const nullableStringFields = [
      'customLabel',
      'photoUrl',
      'breed',
      'medicalNote',
      'microchipCode',
      'ownerPhone',
      'backupPhone',
      'notificationEmail',
      'homeAddress'
    ] as const
    for (const field of nullableStringFields) {
      const value = readNullableString(body[field])
      if (value !== undefined) {
        payload[field] = value
      }
    }

    const nullableBooleanFields = ['isNeutered'] as const
    for (const field of nullableBooleanFields) {
      const value = readNullableBoolean(body[field])
      if (value !== undefined) {
        payload[field] = value
      }
    }

    const booleanFields = ['hasMicrochip', 'privacyMode', 'showHomeAddress'] as const
    for (const field of booleanFields) {
      if (typeof body[field] === 'boolean') {
        payload[field] = body[field]
      }
    }

    return ok({
      profile: await updateOwnerTagProfile(id, payload)
    })
  }

  const tag = findTagById(id)
  if (!tag) {
    fail(404, 'TAG_NOT_FOUND', '标签不存在')
  }
  if (tag.userId !== userId) {
    fail(403, 'FORBIDDEN', '无权修改该标签资料')
  }

  const profile = updateTagProfile(id, {
    ...body,
    displayName
  } as Parameters<typeof updateTagProfile>[1])

  if (!profile) {
    fail(404, 'TAG_NOT_FOUND', '标签资料不存在')
  }

  return ok({
    profile
  })
})
