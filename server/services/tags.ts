import type { TagProfile, TagRecord } from '~/types/smarttag'
import { prisma } from '~/server/utils/prisma'

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
