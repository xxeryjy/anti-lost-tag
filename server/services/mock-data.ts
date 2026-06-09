import type { PrivacyMessageRecord, ScanLogItem, TagProfile, TagRecord } from '~/types/smarttag'

interface MockUser {
  id: number
  email: string
  password: string
  emailVerifiedAt: string | null
  preferredLocale: 'zh-CN' | 'en' | 'ja'
}

const users: MockUser[] = [
  {
    id: 1,
    email: 'owner@smarttag.local',
    password: 'Password123',
    emailVerifiedAt: '2026-06-05T07:00:00.000Z',
    preferredLocale: 'zh-CN'
  }
]

const tags: TagRecord[] = [
  {
    id: 1,
    uid: 'mt-001',
    status: 'ACTIVE',
    rewardText: 'Safe return appreciated.',
    activatedAt: '2026-06-05T06:00:00.000Z',
    updatedAt: '2026-06-05T09:30:00.000Z',
    userId: 1,
    activationCode: 'AC-001-888',
    profile: {
      tagId: 1,
      category: 'PET',
      petKind: 'DOG',
      customLabel: null,
      displayName: 'Milo',
      photoUrl: null,
      breed: 'Shiba Inu',
      sex: 'MALE',
      isNeutered: true,
      medicalNote: 'Friendly, needs grain-free food.',
      hasMicrochip: true,
      microchipCode: 'MC-1001',
      privacyMode: false,
      ownerPhone: '+1 415 555 0100',
      backupPhone: '+1 415 555 0108',
      notificationEmail: 'owner@smarttag.local',
      homeAddress: 'San Francisco, CA',
      showHomeAddress: false,
      createdAt: '2026-06-05T06:00:00.000Z',
      updatedAt: '2026-06-05T09:30:00.000Z'
    }
  },
  {
    id: 2,
    uid: 'mt-002',
    status: 'LOST',
    rewardText: 'Reward available upon safe return.',
    activatedAt: '2026-06-04T03:00:00.000Z',
    updatedAt: '2026-06-05T10:00:00.000Z',
    userId: 1,
    activationCode: 'AC-002-999',
    profile: {
      tagId: 2,
      category: 'PET',
      petKind: 'CAT',
      customLabel: null,
      displayName: 'Mochi',
      photoUrl: null,
      breed: 'British Shorthair',
      sex: 'FEMALE',
      isNeutered: true,
      medicalNote: 'Timid around loud sounds.',
      hasMicrochip: false,
      microchipCode: null,
      privacyMode: true,
      ownerPhone: '+1 415 555 0200',
      backupPhone: null,
      notificationEmail: 'finder@smarttag.local',
      homeAddress: 'Tokyo',
      showHomeAddress: false,
      createdAt: '2026-06-04T03:00:00.000Z',
      updatedAt: '2026-06-05T10:00:00.000Z'
    }
  },
  {
    id: 3,
    uid: 'mt-003',
    status: 'INACTIVE',
    rewardText: null,
    activatedAt: null,
    updatedAt: '2026-06-05T08:00:00.000Z',
    userId: null,
    activationCode: 'AC-003-777',
    profile: null
  }
]

const scans: ScanLogItem[] = [
  {
    id: 101,
    scannedAt: '2026-06-05T10:12:00.000Z',
    locationSource: 'GPS',
    latitude: 37.7749,
    longitude: -122.4194,
    city: 'San Francisco',
    region: 'CA',
    country: 'US',
    ipAddress: '127.0.0.1',
    userAgent: 'Local Browser',
    mapUrl: 'https://maps.google.com/?q=37.7749,-122.4194',
    tagStatusAtScan: 'ACTIVE',
    notificationSuppressed: false,
    notificationStatus: 'SENT'
  },
  {
    id: 201,
    scannedAt: '2026-06-05T11:30:00.000Z',
    locationSource: 'GPS',
    latitude: 35.6762,
    longitude: 139.6503,
    city: 'Tokyo',
    region: 'Tokyo',
    country: 'JP',
    ipAddress: '127.0.0.1',
    userAgent: 'Local Browser',
    mapUrl: 'https://maps.google.com/?q=35.6762,139.6503',
    tagStatusAtScan: 'LOST',
    notificationSuppressed: false,
    notificationStatus: 'SENT'
  }
]

const tagScans: Record<number, number[]> = {
  1: [101],
  2: [201],
  3: []
}

const messages: PrivacyMessageRecord[] = []

export function listMyTags(userId: number) {
  return tags.filter((tag) => tag.userId === userId)
}

export function findTagByUid(uid: string) {
  return tags.find((tag) => tag.uid === uid) || null
}

export function findTagById(id: number) {
  return tags.find((tag) => tag.id === id) || null
}

export function findUserByEmail(email: string) {
  return users.find((user) => user.email.toLowerCase() === email.toLowerCase()) || null
}

export function createUser(email: string, password: string, preferredLocale: MockUser['preferredLocale']) {
  const user: MockUser = {
    id: users.length + 1,
    email,
    password,
    emailVerifiedAt: null,
    preferredLocale
  }
  users.push(user)
  return user
}

export function verifyUserEmail(email: string) {
  const user = findUserByEmail(email)
  if (!user) {
    return null
  }
  user.emailVerifiedAt = new Date().toISOString()
  return user
}

export function resetUserPassword(email: string, password: string) {
  const user = findUserByEmail(email)
  if (!user) {
    return null
  }
  user.password = password
  return user
}

export function activateTag(uid: string, activationCode: string, userId: number) {
  const tag = findTagByUid(uid)
  if (!tag) {
    return { kind: 'NOT_FOUND' as const }
  }
  if (tag.userId) {
    return { kind: 'ALREADY_BOUND' as const }
  }
  if (tag.activationCode !== activationCode) {
    return { kind: 'INVALID_CODE' as const }
  }

  tag.userId = userId
  tag.status = 'ACTIVE'
  tag.activatedAt = new Date().toISOString()
  tag.updatedAt = new Date().toISOString()
  tag.profile = {
    tagId: tag.id,
    category: 'ITEM',
    petKind: null,
    customLabel: 'Travel Bag',
    displayName: 'My Carry-On',
    photoUrl: null,
    breed: null,
    sex: null,
    isNeutered: null,
    medicalNote: null,
    hasMicrochip: false,
    microchipCode: null,
    privacyMode: false,
    ownerPhone: '+1 415 555 0300',
    backupPhone: null,
    notificationEmail: 'owner@smarttag.local',
    homeAddress: null,
    showHomeAddress: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  return { kind: 'SUCCESS' as const, tag }
}

export function updateTagStatus(id: number, status: TagRecord['status']) {
  const tag = findTagById(id)
  if (!tag) {
    return null
  }
  tag.status = status
  tag.updatedAt = new Date().toISOString()
  return tag
}

export function updateTagProfile(id: number, payload: Partial<TagProfile>) {
  const tag = findTagById(id)
  if (!tag || !tag.profile) {
    return null
  }
  tag.profile = {
    ...tag.profile,
    ...payload,
    updatedAt: new Date().toISOString()
  }
  tag.updatedAt = new Date().toISOString()
  return tag.profile
}

export function getProfileByTagId(id: number) {
  return findTagById(id)?.profile || null
}

export function getScansByTagId(id: number) {
  const ids = tagScans[id] || []
  return scans.filter((scan) => ids.includes(scan.id))
}

export function appendScan(uid: string, payload: Partial<ScanLogItem>) {
  const tag = findTagByUid(uid)
  if (!tag) {
    return null
  }

  const tagId = tag.id
  const scan: ScanLogItem = {
    id: scans.length + 1000,
    scannedAt: new Date().toISOString(),
    locationSource: payload.locationSource || 'IP',
    latitude: payload.latitude ?? null,
    longitude: payload.longitude ?? null,
    city: payload.city ?? null,
    region: payload.region ?? null,
    country: payload.country ?? null,
    ipAddress: payload.ipAddress ?? '127.0.0.1',
    userAgent: payload.userAgent ?? 'Mock Browser',
    mapUrl: payload.mapUrl ?? null,
    tagStatusAtScan: tag.status,
    notificationSuppressed: false,
    notificationStatus: 'SENT'
  }
  scans.unshift(scan)
  tagScans[tagId] = [scan.id, ...(tagScans[tagId] || [])]
  return scan
}

export function createPrivacyMessage(
  uid: string,
  payload: Pick<PrivacyMessageRecord, 'finderName' | 'finderContact' | 'message'>
) {
  const tag = findTagByUid(uid)
  if (!tag || !tag.profile) {
    return null
  }
  const record: PrivacyMessageRecord = {
    id: messages.length + 1,
    tagId: tag.id,
    scanLogId: null,
    finderName: payload.finderName,
    finderContact: payload.finderContact,
    message: payload.message,
    deliveryStatus: 'PENDING',
    createdAt: new Date().toISOString()
  }
  messages.unshift(record)
  return record
}
