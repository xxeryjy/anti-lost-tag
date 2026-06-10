import { randomBytes, scrypt as scryptCallback } from 'node:crypto'
import { promisify } from 'node:util'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const scrypt = promisify(scryptCallback)

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  const derivedKey = await scrypt(password, salt, 64)
  return `scrypt$${salt}$${derivedKey.toString('hex')}`
}

function date(value) {
  return new Date(value)
}

async function upsertProfile(tagId, data) {
  return prisma.tagProfile.upsert({
    where: {
      tagId
    },
    update: data,
    create: {
      tagId,
      ...data
    }
  })
}

async function main() {
  const passwordHash = await hashPassword('Password123')
  const owner = await prisma.user.upsert({
    where: {
      email: 'owner@smarttag.local'
    },
    update: {
      passwordHash,
      emailVerifiedAt: date('2026-06-05T07:00:00.000Z'),
      preferredLocale: 'ZH_CN',
      timezone: 'Asia/Shanghai'
    },
    create: {
      email: 'owner@smarttag.local',
      passwordHash,
      emailVerifiedAt: date('2026-06-05T07:00:00.000Z'),
      preferredLocale: 'ZH_CN',
      timezone: 'Asia/Shanghai'
    }
  })

  const tagMilo = await prisma.tag.upsert({
    where: {
      uid: 'mt-001'
    },
    update: {
      activationCode: 'AC-001-888',
      status: 'ACTIVE',
      rewardText: 'Safe return appreciated.',
      activatedAt: date('2026-06-05T06:00:00.000Z'),
      userId: owner.id
    },
    create: {
      uid: 'mt-001',
      activationCode: 'AC-001-888',
      status: 'ACTIVE',
      rewardText: 'Safe return appreciated.',
      activatedAt: date('2026-06-05T06:00:00.000Z'),
      userId: owner.id
    }
  })

  await upsertProfile(tagMilo.id, {
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
    showHomeAddress: false
  })

  const tagMochi = await prisma.tag.upsert({
    where: {
      uid: 'mt-002'
    },
    update: {
      activationCode: 'AC-002-999',
      status: 'LOST',
      rewardText: 'Reward available upon safe return.',
      activatedAt: date('2026-06-04T03:00:00.000Z'),
      userId: owner.id
    },
    create: {
      uid: 'mt-002',
      activationCode: 'AC-002-999',
      status: 'LOST',
      rewardText: 'Reward available upon safe return.',
      activatedAt: date('2026-06-04T03:00:00.000Z'),
      userId: owner.id
    }
  })

  await upsertProfile(tagMochi.id, {
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
    showHomeAddress: false
  })

  await prisma.tag.upsert({
    where: {
      uid: 'mt-003'
    },
    update: {
      activationCode: 'AC-003-777',
      status: 'INACTIVE',
      rewardText: null,
      activatedAt: null,
      userId: null
    },
    create: {
      uid: 'mt-003',
      activationCode: 'AC-003-777',
      status: 'INACTIVE',
      rewardText: null,
      activatedAt: null,
      userId: null
    }
  })

  await prisma.scanLog.upsert({
    where: {
      id: 101
    },
    update: {
      tagId: tagMilo.id,
      scannedAt: date('2026-06-05T10:12:00.000Z'),
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
    create: {
      id: 101,
      tagId: tagMilo.id,
      scannedAt: date('2026-06-05T10:12:00.000Z'),
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
    }
  })

  await prisma.scanLog.upsert({
    where: {
      id: 201
    },
    update: {
      tagId: tagMochi.id,
      scannedAt: date('2026-06-05T11:30:00.000Z'),
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
    },
    create: {
      id: 201,
      tagId: tagMochi.id,
      scannedAt: date('2026-06-05T11:30:00.000Z'),
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
  })

  console.log('Seed completed: owner@smarttag.local / Password123')
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
