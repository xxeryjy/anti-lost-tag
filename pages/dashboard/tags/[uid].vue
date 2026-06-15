<script setup lang="ts">
import type { DeliveryStatus, LocationSource, NotificationStatus, PaginationMeta, PrivacyMessageRecord, ScanLogItem, TagStatus } from '~/types/smarttag'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const localePath = useLocalePath()
const { isLoading, errorMessage, successMessage, run, setSuccess } = useApiRequest()
const { isLoadingTags, loadError, loadMyTags, findByUid, loadScans, loadMessages } = useOwnerTags()
const scans = ref<ScanLogItem[]>([])
const messages = ref<PrivacyMessageRecord[]>([])
const scanPagination = ref<PaginationMeta>({ page: 1, pageSize: 5, total: 0, totalPages: 1 })
const messagePagination = ref<PaginationMeta>({ page: 1, pageSize: 5, total: 0, totalPages: 1 })
const scanLocationSourceOptions = ['ALL', 'GPS', 'IP'] as const
const scanNotificationStatusOptions = ['ALL', 'SENT', 'SKIPPED', 'FAILED', 'PENDING'] as const
const messageDeliveryStatusOptions = ['ALL', 'PENDING', 'SENT', 'FAILED'] as const
const selectedScanLocationSource = ref<typeof scanLocationSourceOptions[number]>('ALL')
const selectedScanNotificationStatus = ref<typeof scanNotificationStatusOptions[number]>('ALL')
const selectedMessageDeliveryStatus = ref<typeof messageDeliveryStatusOptions[number]>('ALL')
const pendingStatus = ref<TagStatus | null>(null)
const isDeleteConfirmOpen = ref(false)
const uid = computed(() => String(route.params.uid))
const currentTag = computed(() => findByUid(uid.value))
const pendingStatusLabel = computed(() => pendingStatus.value === 'LOST' ? t('dashboard.enableLost') : t('dashboard.disableLost'))

function emptyPagination(pageSize = 5): PaginationMeta {
  return {
    page: 1,
    pageSize,
    total: 0,
    totalPages: 1
  }
}

async function loadPageData() {
  await loadMyTags()
  if (currentTag.value) {
    await Promise.all([
      loadScanRecords(1),
      loadMessageRecords(1)
    ])
    return
  }

  scans.value = []
  messages.value = []
  scanPagination.value = emptyPagination()
  messagePagination.value = emptyPagination()
}

async function loadScanRecords(page = scanPagination.value.page) {
  if (!currentTag.value) {
    return
  }

  const data = await loadScans(currentTag.value.id, {
    page,
    pageSize: scanPagination.value.pageSize,
    locationSource: selectedScanLocationSource.value === 'ALL' ? undefined : selectedScanLocationSource.value as LocationSource,
    notificationStatus: selectedScanNotificationStatus.value === 'ALL' ? undefined : selectedScanNotificationStatus.value as NotificationStatus
  }).catch(() => ({
    items: [],
    list: [],
    pagination: emptyPagination(scanPagination.value.pageSize)
  }))

  scans.value = data.items
  scanPagination.value = data.pagination
}

async function loadMessageRecords(page = messagePagination.value.page) {
  if (!currentTag.value) {
    return
  }

  const data = await loadMessages(currentTag.value.id, {
    page,
    pageSize: messagePagination.value.pageSize,
    deliveryStatus: selectedMessageDeliveryStatus.value === 'ALL' ? undefined : selectedMessageDeliveryStatus.value as DeliveryStatus
  }).catch(() => ({
    items: [],
    list: [],
    pagination: emptyPagination(messagePagination.value.pageSize)
  }))

  messages.value = data.items
  messagePagination.value = data.pagination
}

async function setScanLocationSource(source: typeof scanLocationSourceOptions[number]) {
  selectedScanLocationSource.value = source
  await loadScanRecords(1)
}

async function setScanNotificationStatus(status: typeof scanNotificationStatusOptions[number]) {
  selectedScanNotificationStatus.value = status
  await loadScanRecords(1)
}

async function setMessageDeliveryStatus(status: typeof messageDeliveryStatusOptions[number]) {
  selectedMessageDeliveryStatus.value = status
  await loadMessageRecords(1)
}

function locationSourceLabel(source: 'ALL' | LocationSource) {
  return source === 'ALL' ? t('dashboard.filterAll') : t(`dashboard.locationSource${source}`)
}

function notificationStatusLabel(status: 'ALL' | NotificationStatus) {
  return status === 'ALL' ? t('dashboard.filterAll') : t(`dashboard.notificationStatus${status}`)
}

function deliveryStatusLabel(status: 'ALL' | DeliveryStatus) {
  return status === 'ALL' ? t('dashboard.filterAll') : t(`dashboard.deliveryStatus${status}`)
}

async function updateStatus(status: TagStatus) {
  if (!currentTag.value) {
    return
  }

  const data = await run<{ tag: { status: TagStatus } }>(() => $fetch(`/api/tags/${currentTag.value!.id}/status`, {
    method: 'PATCH',
    body: { status }
  }))

  if (!data) {
    return
  }

  setSuccess(status === 'LOST' ? t('dashboard.lostEnabled') : t('dashboard.lostDisabled'))
  await loadPageData()
}

function openStatusConfirm(status: TagStatus) {
  pendingStatus.value = status
}

function closeStatusConfirm() {
  if (isLoading.value) {
    return
  }
  pendingStatus.value = null
}

async function confirmStatusChange() {
  if (!pendingStatus.value) {
    return
  }

  const status = pendingStatus.value
  await updateStatus(status)
  if (!errorMessage.value) {
    pendingStatus.value = null
  }
}

function openDeleteConfirm() {
  isDeleteConfirmOpen.value = true
}

function closeDeleteConfirm() {
  if (isLoading.value) {
    return
  }
  isDeleteConfirmOpen.value = false
}

async function confirmDeleteTag() {
  if (!currentTag.value) {
    return
  }

  const tagId = currentTag.value.id
  const data = await run(() => $fetch(`/api/tags/${tagId}`, {
    method: 'DELETE'
  }))

  if (!data) {
    return
  }

  setSuccess(t('dashboard.deleteTagSuccess'))
  await loadMyTags()
  await router.push(localePath('/dashboard/tags'))
}

onMounted(() => {
  loadPageData()
})

useHead({
  title: t('dashboard.detailTitle')
})
</script>

<template>
  <div class="page-container">
    <section class="content-section">
      <div v-if="isLoadingTags" class="state-card">
        <h1 class="section-title">{{ t('common.loading') }}</h1>
      </div>

      <div v-else-if="loadError" class="state-card">
        <h1 class="section-title">{{ t('common.loadFailed') }}</h1>
        <p class="section-copy">{{ loadError }}</p>
      </div>

      <div v-else-if="!currentTag" class="state-card">
        <h1 class="section-title">{{ t('finder.notFoundTitle') }}</h1>
      </div>

      <template v-else>
        <MobilePageHeader
          :back-to="localePath('/dashboard/tags')"
          :back-label="t('dashboard.backToTags')"
          :eyebrow="t('dashboard.detailEyebrow')"
          :title="t('dashboard.detailTitle')"
        />

        <div class="surface-card">
          <div class="tag-detail-heading">
            <div v-if="currentTag.profile?.photoUrl" class="tag-detail-photo">
              <img :src="currentTag.profile.photoUrl" :alt="currentTag.profile.displayName || currentTag.uid" />
            </div>
            <div>
              <h1 class="section-title">{{ currentTag.profile?.displayName || currentTag.uid }}</h1>
            </div>
            <span class="status-chip" :class="`status-${currentTag.status.toLowerCase()}`">{{ currentTag.status }}</span>
          </div>

          <div class="summary-grid" style="margin-top: 18px;">
            <div class="meta-box">
              <strong>{{ t('dashboard.uid') }}</strong>
              <p class="muted-text">{{ currentTag.uid }}</p>
            </div>
            <div class="meta-box">
              <strong>{{ t('dashboard.updatedAt') }}</strong>
              <p class="muted-text">{{ currentTag.updatedAt }}</p>
            </div>
          </div>

          <div class="inline-actions" style="margin-top: 18px;">
            <NuxtLink class="solid-button" :to="localePath(`/tags/${currentTag.uid}/edit`)">
              {{ t('dashboard.editProfile') }}
            </NuxtLink>
            <NuxtLink class="outline-button" :to="`${localePath(`/t/${currentTag.uid}`)}?preview=1`">
              {{ t('dashboard.previewFinder') }}
            </NuxtLink>
            <button
              v-if="currentTag.status !== 'LOST'"
              class="outline-button danger-action"
              type="button"
              :disabled="isLoading"
              @click="openStatusConfirm('LOST')"
            >
              {{ t('dashboard.enableLost') }}
            </button>
            <button
              v-else
              class="outline-button"
              type="button"
              :disabled="isLoading"
              @click="openStatusConfirm('ACTIVE')"
            >
              {{ t('dashboard.disableLost') }}
            </button>
            <button
              class="outline-button danger-action"
              type="button"
              :disabled="isLoading"
              @click="openDeleteConfirm"
            >
              {{ t('dashboard.deleteTag') }}
            </button>
          </div>
          <p v-if="errorMessage" class="alert-box alert-error">{{ errorMessage }}</p>
          <p v-if="successMessage" class="alert-box alert-success">{{ successMessage }}</p>

          <div class="content-section">
            <div class="record-section-heading">
              <div>
                <h2 class="section-title">{{ t('dashboard.messagesTitle') }}</h2>
                <p class="muted-text">
                  {{ t('dashboard.paginationSummary', { total: messagePagination.total, page: messagePagination.page, totalPages: messagePagination.totalPages }) }}
                </p>
              </div>
              <div class="pill-row filter-row compact-filter-row">
                <button
                  v-for="status in messageDeliveryStatusOptions"
                  :key="status"
                  class="pill filter-pill"
                  :class="{ 'is-active': selectedMessageDeliveryStatus === status }"
                  type="button"
                  @click="setMessageDeliveryStatus(status)"
                >
                  {{ deliveryStatusLabel(status) }}
                </button>
              </div>
            </div>
            <div v-if="!messages.length" class="state-card compact-state">
              <p class="section-copy">{{ t('dashboard.emptyMessages') }}</p>
            </div>
            <div v-else class="card-grid">
              <article v-for="message in messages" :key="message.id" class="state-card owner-message-card">
                <div class="message-card-header">
                  <strong>{{ message.finderName || t('dashboard.anonymousFinder') }}</strong>
                  <span class="status-chip">{{ deliveryStatusLabel(message.deliveryStatus) }}</span>
                </div>
                <p class="muted-text">{{ message.createdAt }}</p>
                <p class="owner-message-body">{{ message.message }}</p>
                <p v-if="message.finderContact" class="muted-text">
                  {{ t('dashboard.finderContact') }}: {{ message.finderContact }}
                </p>
              </article>
            </div>
            <div v-if="messagePagination.totalPages > 1" class="pagination-row">
              <button class="outline-button" type="button" :disabled="messagePagination.page <= 1" @click="loadMessageRecords(messagePagination.page - 1)">
                {{ t('dashboard.prevPage') }}
              </button>
              <span class="muted-text">{{ messagePagination.page }} / {{ messagePagination.totalPages }}</span>
              <button class="outline-button" type="button" :disabled="messagePagination.page >= messagePagination.totalPages" @click="loadMessageRecords(messagePagination.page + 1)">
                {{ t('dashboard.nextPage') }}
              </button>
            </div>
          </div>

          <div class="content-section">
            <div class="record-section-heading">
              <div>
                <h2 class="section-title">{{ t('dashboard.scansTitle') }}</h2>
                <p class="muted-text">
                  {{ t('dashboard.paginationSummary', { total: scanPagination.total, page: scanPagination.page, totalPages: scanPagination.totalPages }) }}
                </p>
              </div>
              <div class="stacked-filter-group">
                <div class="pill-row filter-row compact-filter-row">
                  <button
                    v-for="source in scanLocationSourceOptions"
                    :key="source"
                    class="pill filter-pill"
                    :class="{ 'is-active': selectedScanLocationSource === source }"
                    type="button"
                    @click="setScanLocationSource(source)"
                  >
                    {{ locationSourceLabel(source) }}
                  </button>
                </div>
                <div class="pill-row filter-row compact-filter-row">
                  <button
                    v-for="status in scanNotificationStatusOptions"
                    :key="status"
                    class="pill filter-pill"
                    :class="{ 'is-active': selectedScanNotificationStatus === status }"
                    type="button"
                    @click="setScanNotificationStatus(status)"
                  >
                    {{ notificationStatusLabel(status) }}
                  </button>
                </div>
              </div>
            </div>
            <div v-if="!scans.length" class="state-card compact-state">
              <p class="section-copy">{{ t('dashboard.emptyScans') }}</p>
            </div>
            <div v-else class="card-grid">
              <article v-for="scan in scans" :key="scan.id" class="state-card">
                <strong>{{ scan.scannedAt }}</strong>
                <p class="muted-text">{{ scan.city || t('common.unknown') }} / {{ scan.locationSource }}</p>
                <p class="muted-text">
                  {{ notificationStatusLabel(scan.notificationStatus) }}
                </p>
                <a v-if="scan.mapUrl" class="text-link" :href="scan.mapUrl" target="_blank" rel="noopener">
                  {{ t('dashboard.openScanMap') }}
                </a>
              </article>
            </div>
            <div v-if="scanPagination.totalPages > 1" class="pagination-row">
              <button class="outline-button" type="button" :disabled="scanPagination.page <= 1" @click="loadScanRecords(scanPagination.page - 1)">
                {{ t('dashboard.prevPage') }}
              </button>
              <span class="muted-text">{{ scanPagination.page }} / {{ scanPagination.totalPages }}</span>
              <button class="outline-button" type="button" :disabled="scanPagination.page >= scanPagination.totalPages" @click="loadScanRecords(scanPagination.page + 1)">
                {{ t('dashboard.nextPage') }}
              </button>
            </div>
          </div>
        </div>
      </template>
    </section>

    <div v-if="pendingStatus" class="modal-backdrop" role="presentation" @click.self="closeStatusConfirm">
      <section class="confirm-dialog" role="dialog" aria-modal="true" :aria-label="pendingStatusLabel">
        <span class="eyebrow">{{ t('dashboard.statusConfirmEyebrow') }}</span>
        <h2 class="section-title">{{ pendingStatusLabel }}</h2>
        <p class="section-copy">
          {{ pendingStatus === 'LOST' ? t('dashboard.enableLostConfirmCopy') : t('dashboard.disableLostConfirmCopy') }}
        </p>
        <div class="inline-actions">
          <button class="outline-button" type="button" :disabled="isLoading" @click="closeStatusConfirm">
            {{ t('common.cancel') }}
          </button>
          <button
            class="solid-button"
            :class="{ 'danger-solid': pendingStatus === 'LOST' }"
            type="button"
            :disabled="isLoading"
            @click="confirmStatusChange"
          >
            {{ isLoading ? t('common.submitting') : pendingStatusLabel }}
          </button>
        </div>
      </section>
    </div>

    <div v-if="isDeleteConfirmOpen" class="modal-backdrop" role="presentation" @click.self="closeDeleteConfirm">
      <section class="confirm-dialog" role="dialog" aria-modal="true" :aria-label="t('dashboard.deleteTagConfirmTitle')">
        <span class="eyebrow">{{ t('dashboard.deleteTagConfirmEyebrow') }}</span>
        <h2 class="section-title">{{ t('dashboard.deleteTagConfirmTitle') }}</h2>
        <p class="section-copy">{{ t('dashboard.deleteTagConfirmCopy') }}</p>
        <div class="inline-actions">
          <button class="outline-button" type="button" :disabled="isLoading" @click="closeDeleteConfirm">
            {{ t('common.cancel') }}
          </button>
          <button
            class="solid-button danger-solid"
            type="button"
            :disabled="isLoading"
            @click="confirmDeleteTag"
          >
            {{ isLoading ? t('common.submitting') : t('dashboard.confirmDeleteTag') }}
          </button>
        </div>
      </section>
    </div>
  </div>
</template>
