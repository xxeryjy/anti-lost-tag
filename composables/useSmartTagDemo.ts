import type { ScanLogItem, TagRecord } from '~/types/smarttag'

const demoTags: TagRecord[] = [
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

const demoScans: Record<number, ScanLogItem[]> = {
  1: [
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
    }
  ],
  2: [
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
  ],
  3: []
}

export function useSmartTagDemo() {
  const homeSections = [
    {
      title: 'Manifesto',
      copy: 'A tag should not be a dead serial number. It should become a warm handoff between the person searching and the person hoping to be found.'
    },
    {
      title: 'Mission / Vision',
      copy: 'Help every lost pet or item reveal the right story, the right contact path, and the right next step in seconds.'
    },
    {
      title: 'Core Values',
      copy: 'Clarity first, privacy by choice, and a finder flow that removes hesitation instead of adding friction.'
    },
    {
      title: 'Privacy & Care',
      copy: 'Owners can choose direct contact or privacy mode, while still keeping the scan journey fast and humane.'
    }
  ]

  function findTagByUid(uid: string) {
    return demoTags.find((tag) => tag.uid === uid) || null
  }

  function getScansByTagId(tagId: number) {
    return demoScans[tagId] || []
  }

  return {
    demoTags,
    homeSections,
    findTagByUid,
    getScansByTagId
  }
}
