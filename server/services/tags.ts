import type { DeliveryStatus, LocationSource, NotificationStatus, PaginatedList, PrivacyMessageRecord, ScanLogItem, TagProfile, TagRecord } from '~/types/smarttag'
import { prisma } from '~/server/utils/prisma'

const scanNotificationWindow = 60 * 1000
const privacyMessageWindow = 5 * 60 * 1000

function toIsoString(value: Date | null) {
  return value?.toISOString() || null
}

export function toTagProfileDto(profile: {
  tagId: number
  category: TagProfile['category']
  petKind: TagProfile['petKind']
  customLabel: string | null
  displayName: string
  photoUrl: string | null
  breed: string | null
  sex: TagProfile['sex']
  isNeutered: boolean | null
  medicalNote: string | null
  hasMicrochip: boolean
  microchipCode: string | null
  privacyMode: boolean
  ownerPhone: string | null
  backupPhone: string | null
  notificationEmail: string | null
  homeAddress: string | null
  showHomeAddress: boolean
  createdAt: Date
  updatedAt: Date
}): TagProfile {
  return {
    tagId: profile.tagId,
    category: profile.category,
    petKind: profile.petKind,
    customLabel: profile.customLabel,
    displayName: profile.displayName,
    photoUrl: profile.photoUrl,
    breed: profile.breed,
    sex: profile.sex,
    isNeutered: profile.isNeutered,
    medicalNote: profile.medicalNote,
    hasMicrochip: profile.hasMicrochip,
    microchipCode: profile.microchipCode,
    privacyMode: profile.privacyMode,
    ownerPhone: profile.ownerPhone,
    backupPhone: profile.backupPhone,
    notificationEmail: profile.notificationEmail,
    homeAddress: profile.homeAddress,
    showHomeAddress: profile.showHomeAddress,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString()
  }
}

export function toTagRecordDto(tag: {
  id: number
  uid: string
  status: TagRecord['status']
  rewardText: string | null
  activatedAt: Date | null
  updatedAt: Date
  userId: number | null
  activationCode: string
  profile: Parameters<typeof toTagProfileDto>[0] | null
}): TagRecord {
  return {
    id: tag.id,
    uid: tag.uid,
    status: tag.status,
    rewardText: tag.rewardText,
    activatedAt: toIsoString(tag.activatedAt),
    updatedAt: tag.updatedAt.toISOString(),
    userId: tag.userId,
    activationCode: tag.activationCode,
    profile: tag.profile ? toTagProfileDto(tag.profile) : null
  }
}

export function toScanLogDto(scan: {
  id: number
  scannedAt: Date
  locationSource: ScanLogItem['locationSource']
  latitude: number | null
  longitude: number | null
  city: string | null
  region: string | null
  country: string | null
  ipAddress: string | null
  userAgent: string | null
  mapUrl: string | null
  tagStatusAtScan: ScanLogItem['tagStatusAtScan']
  notificationSuppressed: boolean
  notificationStatus: ScanLogItem['notificationStatus']
}): ScanLogItem {
  return {
    id: scan.id,
    scannedAt: scan.scannedAt.toISOString(),
    locationSource: scan.locationSource,
    latitude: scan.latitude,
    longitude: scan.longitude,
    city: scan.city,
    region: scan.region,
    country: scan.country,
    ipAddress: scan.ipAddress,
    userAgent: scan.userAgent,
    mapUrl: scan.mapUrl,
    tagStatusAtScan: scan.tagStatusAtScan,
    notificationSuppressed: scan.notificationSuppressed,
    notificationStatus: scan.notificationStatus
  }
}

export function toPrivacyMessageDto(message: {
  id: number
  tagId: number
  scanLogId: number | null
  finderName: string | null
  finderContact: string | null
  message: string
  deliveryStatus: PrivacyMessageRecord['deliveryStatus']
  createdAt: Date
}): PrivacyMessageRecord {
  return {
    id: message.id,
    tagId: message.tagId,
    scanLogId: message.scanLogId,
    finderName: message.finderName,
    finderContact: message.finderContact,
    message: message.message,
    deliveryStatus: message.deliveryStatus,
    createdAt: message.createdAt.toISOString()
  }
}

function createPagination<T>(items: T[], page: number, pageSize: number, total: number): PaginatedList<T> {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages)

  return {
    items,
    list: items,
    pagination: {
      page: safePage,
      pageSize,
      total,
      totalPages
    }
  }
}

export async function listOwnerTags(userId: number) {
  const tags = await prisma.tag.findMany({
    where: {
      userId
    },
    include: {
      profile: true
    },
    orderBy: {
      updatedAt: 'desc'
    }
  })

  return tags.map(toTagRecordDto)
}

export async function getTagById(id: number) {
  const tag = await prisma.tag.findUnique({
    where: {
      id
    },
    include: {
      profile: true
    }
  })

  return tag ? toTagRecordDto(tag) : null
}

export async function getTagByUid(uid: string) {
  const tag = await prisma.tag.findUnique({
    where: {
      uid
    },
    include: {
      profile: true
    }
  })

  return tag ? toTagRecordDto(tag) : null
}

export async function activateOwnerTag(uid: string, activationCode: string, userId: number) {
  const result = await prisma.$transaction(async (transaction) => {
    const tag = await transaction.tag.findUnique({
      where: {
        uid
      },
      include: {
        profile: true
      }
    })

    if (!tag) {
      return { kind: 'NOT_FOUND' as const }
    }
    if (tag.userId) {
      if (tag.userId === userId) {
        return {
          kind: 'ALREADY_OWNED' as const,
          tag: toTagRecordDto(tag)
        }
      }

      return { kind: 'ALREADY_BOUND' as const }
    }
    if (tag.activationCode !== activationCode) {
      return { kind: 'INVALID_CODE' as const }
    }

    const activatedTag = await transaction.tag.update({
      where: {
        id: tag.id
      },
      data: {
        userId,
        status: 'ACTIVE',
        activatedAt: new Date()
      },
      include: {
        profile: true
      }
    })

    if (activatedTag.profile) {
      return {
        kind: 'SUCCESS' as const,
        tag: toTagRecordDto(activatedTag)
      }
    }

    const owner = await transaction.user.findUnique({
      where: {
        id: userId
      },
      select: {
        email: true
      }
    })
    const profile = await transaction.tagProfile.create({
      data: {
        tagId: activatedTag.id,
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
        notificationEmail: owner?.email || null,
        homeAddress: null,
        showHomeAddress: false
      }
    })

    return {
      kind: 'SUCCESS' as const,
      tag: toTagRecordDto({
        ...activatedTag,
        profile
      })
    }
  })

  return result
}

export async function updateOwnerTagStatus(id: number, status: TagRecord['status']) {
  const tag = await prisma.tag.update({
    where: {
      id
    },
    data: {
      status
    },
    include: {
      profile: true
    }
  })

  return toTagRecordDto(tag)
}

export type UpdateTagProfilePayload = Partial<Omit<TagProfile, 'tagId' | 'createdAt' | 'updatedAt'>>

export async function updateOwnerTagProfile(id: number, payload: UpdateTagProfilePayload) {
  const profile = await prisma.$transaction(async (transaction) => {
    await transaction.tag.update({
      where: {
        id
      },
      data: {
        updatedAt: new Date()
      }
    })

    return transaction.tagProfile.update({
      where: {
        tagId: id
      },
      data: payload
    })
  })

  return toTagProfileDto(profile)
}

export async function deleteOwnerTag(id: number) {
  const tag = await prisma.tag.delete({
    where: {
      id
    },
    include: {
      profile: true
    }
  })

  return toTagRecordDto(tag)
}

export async function listOwnerTagScans(
  tagId: number,
  filters: {
    locationSource?: LocationSource
    notificationStatus?: NotificationStatus
  },
  page: number,
  pageSize: number
) {
  const where = {
    tagId,
    ...(filters.locationSource ? { locationSource: filters.locationSource } : {}),
    ...(filters.notificationStatus ? { notificationStatus: filters.notificationStatus } : {})
  }
  const total = await prisma.scanLog.count({ where })
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages)
  const scans = await prisma.scanLog.findMany({
    where,
    orderBy: {
      scannedAt: 'desc'
    },
    skip: (safePage - 1) * pageSize,
    take: pageSize
  })

  return createPagination(scans.map(toScanLogDto), page, pageSize, total)
}

export async function listOwnerTagMessages(
  tagId: number,
  filters: {
    deliveryStatus?: DeliveryStatus
  },
  page: number,
  pageSize: number
) {
  const where = {
    tagId,
    ...(filters.deliveryStatus ? { deliveryStatus: filters.deliveryStatus } : {})
  }
  const total = await prisma.privacyMessage.count({ where })
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages)
  const messages = await prisma.privacyMessage.findMany({
    where,
    orderBy: {
      createdAt: 'desc'
    },
    skip: (safePage - 1) * pageSize,
    take: pageSize
  })

  return createPagination(messages.map(toPrivacyMessageDto), page, pageSize, total)
}

export async function createPublicScan(
  uid: string,
  payload: {
    locationSource?: LocationSource
    latitude?: number | null
    longitude?: number | null
    city?: string | null
    region?: string | null
    country?: string | null
    ipAddress?: string | null
    userAgent?: string | null
    mapUrl?: string | null
  }
) {
  const tag = await prisma.tag.findUnique({
    where: {
      uid
    },
    select: {
      id: true,
      status: true
    }
  })
  if (!tag) {
    return null
  }

  const ipAddress = payload.ipAddress || '127.0.0.1'
  const recentDuplicateScan = await prisma.scanLog.findFirst({
    where: {
      tagId: tag.id,
      ipAddress,
      scannedAt: {
        gt: new Date(Date.now() - scanNotificationWindow)
      }
    },
    select: {
      id: true
    }
  })
  const notificationSuppressed = Boolean(recentDuplicateScan)
  const scan = await prisma.scanLog.create({
    data: {
      tagId: tag.id,
      locationSource: payload.locationSource || 'IP',
      latitude: payload.latitude ?? null,
      longitude: payload.longitude ?? null,
      city: payload.city || null,
      region: payload.region || null,
      country: payload.country || null,
      ipAddress,
      userAgent: payload.userAgent || 'Browser',
      mapUrl: payload.mapUrl || null,
      tagStatusAtScan: tag.status,
      notificationSuppressed,
      notificationStatus: notificationSuppressed ? 'SKIPPED' : 'PENDING'
    }
  })

  return toScanLogDto(scan)
}

export async function updateScanNotificationStatus(id: number, notificationStatus: NotificationStatus) {
  const scan = await prisma.scanLog.update({
    where: {
      id
    },
    data: {
      notificationStatus,
      notificationSentAt: notificationStatus === 'SENT' ? new Date() : null
    }
  })

  return toScanLogDto(scan)
}

export async function hasRecentPrivacyMessage(tagId: number, ipAddress: string) {
  const recentRecord = await prisma.privacyMessage.findFirst({
    where: {
      tagId,
      ipAddress,
      createdAt: {
        gt: new Date(Date.now() - privacyMessageWindow)
      }
    },
    select: {
      id: true
    }
  })

  return Boolean(recentRecord)
}

export async function createPublicPrivacyMessage(
  tagId: number,
  payload: {
    finderName: string | null
    finderContact: string | null
    message: string
  },
  options: {
    ipAddress?: string | null
  } = {}
) {
  const record = await prisma.privacyMessage.create({
    data: {
      tagId,
      finderName: payload.finderName,
      finderContact: payload.finderContact,
      message: payload.message,
      ipAddress: options.ipAddress || '127.0.0.1',
      deliveryStatus: 'PENDING'
    }
  })

  return toPrivacyMessageDto(record)
}

export async function updatePrivacyMessageDeliveryStatus(id: number, deliveryStatus: DeliveryStatus) {
  const record = await prisma.privacyMessage.update({
    where: {
      id
    },
    data: {
      deliveryStatus,
      deliveredAt: deliveryStatus === 'SENT' ? new Date() : null
    }
  })

  return toPrivacyMessageDto(record)
}
