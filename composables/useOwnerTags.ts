import type { DeliveryStatus, LocationSource, NotificationStatus, PaginatedList, PrivacyMessageRecord, ScanLogItem, TagRecord } from '~/types/smarttag'

export function useOwnerTags() {
  const localePath = useLocalePath()
  const tags = ref<TagRecord[]>([])
  const isLoadingTags = ref(false)
  const loadError = ref('')

  async function loadMyTags() {
    isLoadingTags.value = true
    loadError.value = ''

    try {
      const response = await $fetch<{ success: true; data: { items: TagRecord[] } }>('/api/tags/my')
      tags.value = response.data.items
      return tags.value
    } catch (error: unknown) {
      const apiError = error as { data?: { error?: { code?: string; message?: string } }; statusCode?: number }
      const code = apiError.data?.error?.code
      if (apiError.statusCode === 401 || code === 'UNAUTHORIZED') {
        await navigateTo(localePath(`/auth/login?redirect=${encodeURIComponent('/dashboard/tags')}`))
        return []
      }

      loadError.value = apiError.data?.error?.message || '加载防丢牌失败'
      return []
    } finally {
      isLoadingTags.value = false
    }
  }

  function findByUid(uid: string) {
    return tags.value.find((tag) => tag.uid === uid) || null
  }

  async function loadScans(
    tagId: number,
    params: {
      page?: number
      pageSize?: number
      locationSource?: LocationSource
      notificationStatus?: NotificationStatus
    } = {}
  ) {
    const response = await $fetch<{ success: true; data: PaginatedList<ScanLogItem> }>(`/api/tags/${tagId}/scans`, {
      query: params
    })
    return response.data
  }

  async function loadMessages(
    tagId: number,
    params: {
      page?: number
      pageSize?: number
      deliveryStatus?: DeliveryStatus
    } = {}
  ) {
    const response = await $fetch<{ success: true; data: PaginatedList<PrivacyMessageRecord> }>(`/api/tags/${tagId}/messages`, {
      query: params
    })
    return response.data
  }

  return {
    tags,
    isLoadingTags,
    loadError,
    loadMyTags,
    findByUid,
    loadScans,
    loadMessages
  }
}
