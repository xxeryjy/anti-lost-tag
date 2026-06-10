export type PreferredLocale = 'zh-CN' | 'en' | 'ja'
export type TagStatus = 'INACTIVE' | 'ACTIVE' | 'LOST'
export type ProfileCategory = 'PET' | 'ITEM'
export type PetKind = 'CAT' | 'DOG' | 'OTHER'
export type ProfileSex = 'MALE' | 'FEMALE' | 'UNKNOWN'
export type LocationSource = 'GPS' | 'IP'
export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED' | 'SKIPPED'
export type DeliveryStatus = 'PENDING' | 'SENT' | 'FAILED'

export interface PaginationMeta {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface PaginatedList<T> {
  items: T[]
  list: T[]
  pagination: PaginationMeta
}

export interface TagProfile {
  tagId: number
  category: ProfileCategory
  petKind: PetKind | null
  customLabel: string | null
  displayName: string
  photoUrl: string | null
  breed: string | null
  sex: ProfileSex | null
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
  createdAt: string
  updatedAt: string
}

export interface TagSummary {
  id: number
  uid: string
  status: TagStatus
  rewardText: string | null
  activatedAt: string | null
  updatedAt: string
}

export interface TagRecord extends TagSummary {
  userId: number | null
  activationCode: string
  profile: TagProfile | null
}

export interface ScanLogItem {
  id: number
  scannedAt: string
  locationSource: LocationSource
  latitude: number | null
  longitude: number | null
  city: string | null
  region: string | null
  country: string | null
  ipAddress: string | null
  userAgent: string | null
  mapUrl: string | null
  tagStatusAtScan: TagStatus
  notificationSuppressed: boolean
  notificationStatus: NotificationStatus
}

export interface PrivacyMessageRecord {
  id: number
  tagId: number
  scanLogId: number | null
  finderName: string | null
  finderContact: string | null
  message: string
  deliveryStatus: DeliveryStatus
  createdAt: string
}
