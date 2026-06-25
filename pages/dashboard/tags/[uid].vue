<script setup lang="ts">
import type { DeliveryStatus, LocationSource, NotificationStatus, PaginationMeta, PrivacyMessageRecord, ScanLogItem, TagRecord, TagStatus } from '~/types/smarttag'

const route = useRoute()
const router = useRouter()
const { locale, t } = useI18n()
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
const displayName = computed(() => currentTag.value?.profile?.displayName || currentTag.value?.uid || '')
const photoFallbackLabel = computed(() => currentTag.value?.uid?.slice(-3).toUpperCase() || 'TAG')
const finderPreviewPath = computed(() => currentTag.value ? `${localePath(`/t/${currentTag.value.uid}`)}?preview=1` : localePath('/dashboard/tags'))
const displayStatusLabel = computed(() => currentTag.value ? getStatusDisplayLabel(currentTag.value.status) : '')
const tagAlertTitle = computed(() => currentTag.value ? getAlertModeTitle(currentTag.value) : '')
const tagAlertCopy = computed(() => currentTag.value ? getAlertModeCopy(currentTag.value) : '')
const formattedUpdatedAt = computed(() => formatDateTime(currentTag.value?.updatedAt))
const detailMeta = computed(() => {
  if (!currentTag.value) {
    return ''
  }

  return [getTagMeta(currentTag.value), `ID ${currentTag.value.uid.toUpperCase()}`]
    .filter(Boolean)
    .join(' / ')
})
const profileFacts = computed(() => {
  if (!currentTag.value) {
    return []
  }

  return [
    { label: t('dashboard.uid'), value: currentTag.value.uid },
    { label: t('dashboard.modeLabel'), value: displayStatusLabel.value },
    { label: t('dashboard.updatedAt'), value: formattedUpdatedAt.value },
    { label: t('finder.contactTitle'), value: tagAlertTitle.value }
  ]
})
const ownerContactItems = computed(() => {
  const profile = currentTag.value?.profile
  if (!profile) {
    return []
  }

  return [
    { label: t('finder.ownerPhone'), value: profile.ownerPhone || t('common.none') },
    { label: t('finder.backupPhone'), value: profile.backupPhone || t('common.none') },
    { label: t('finder.email'), value: profile.notificationEmail || t('common.none') },
    { label: t('finder.homeAddress'), value: profile.homeAddress || t('common.none') }
  ]
})
const localeCode = computed(() => {
  if (locale.value.startsWith('zh')) {
    return 'zh-CN'
  }

  if (locale.value.startsWith('ja')) {
    return 'ja-JP'
  }

  return 'en-US'
})

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return t('common.none')
  }

  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(localeCode.value, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(parsedDate)
}

function getCategoryLabel(tag: TagRecord) {
  if (tag.profile?.category === 'ITEM') {
    return t('dashboard.categoryItem')
  }

  return t('dashboard.categoryPet')
}

function getPetKindLabel(tag: TagRecord) {
  const petKind = tag.profile?.petKind
  if (!petKind) {
    return t('common.unknown')
  }

  return t(`dashboard.petKind${petKind}`)
}

function getTagMeta(tag: TagRecord) {
  const primary = tag.profile?.category === 'ITEM'
    ? getCategoryLabel(tag)
    : getPetKindLabel(tag)
  const secondary = tag.profile?.breed || tag.profile?.customLabel || t('common.unknown')

  return `${primary} / ${secondary}`
}

function getStatusDisplayLabel(status: TagStatus) {
  if (status === 'LOST') {
    return t('dashboard.statusLost')
  }

  if (status === 'INACTIVE') {
    return t('dashboard.statusInactive')
  }

  return t('dashboard.statusActive')
}

function getAlertModeTitle(tag: TagRecord) {
  return tag.profile?.privacyMode
    ? t('dashboard.privateAlertTitle')
    : t('dashboard.activeAlertTitle')
}

function getAlertModeCopy(tag: TagRecord) {
  if (tag.profile?.privacyMode) {
    return t('dashboard.privateAlertCopy')
  }

  if (tag.profile?.notificationEmail) {
    return t('dashboard.activeAlertCopy')
  }

  return t('dashboard.directAlertCopy')
}

function getScanLocationSummary(scan: ScanLogItem) {
  const parts = [scan.city, scan.region, scan.country].filter(Boolean)
  if (parts.length) {
    return parts.join(' / ')
  }

  return t('common.unknown')
}

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
  <div class="page-container owner-tag-detail-page">
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

        <div class="surface-card owner-detail-shell">
          <section class="owner-detail-hero">
            <div class="owner-detail-hero-main">
              <div class="owner-detail-photo-shell">
                <div v-if="currentTag.profile?.photoUrl" class="tag-detail-photo owner-detail-photo">
                  <img :src="currentTag.profile.photoUrl" :alt="displayName" />
                </div>
                <div v-else class="owner-detail-photo owner-detail-photo-placeholder" aria-hidden="true">
                  <span>{{ photoFallbackLabel }}</span>
                </div>
              </div>

              <div class="owner-detail-hero-copy">
                <div class="owner-detail-topline">
                  <span class="eyebrow owner-detail-eyebrow">{{ t('dashboard.detailEyebrow') }}</span>
                  <span class="status-chip owner-detail-status" :class="`status-${currentTag.status.toLowerCase()}`">{{ displayStatusLabel }}</span>
                </div>

                <h1 class="section-title owner-detail-name">{{ displayName }}</h1>
                <p v-if="detailMeta" class="owner-detail-meta">{{ detailMeta }}</p>
                <p class="owner-detail-description">{{ tagAlertCopy }}</p>
              </div>
            </div>

            <aside class="owner-detail-hero-side">
              <article class="meta-box owner-detail-spotlight">
                <span class="owner-detail-spotlight-label">{{ t('dashboard.modeLabel') }}</span>
                <strong class="owner-detail-spotlight-value">{{ displayStatusLabel }}</strong>
                <p class="owner-detail-spotlight-copy">{{ tagAlertTitle }} / {{ tagAlertCopy }}</p>
              </article>
              <article class="meta-box owner-detail-spotlight owner-detail-spotlight-soft">
                <span class="owner-detail-spotlight-label">{{ t('dashboard.previewFinder') }}</span>
                <strong class="owner-detail-spotlight-value">{{ currentTag.uid.toUpperCase() }}</strong>
                <p class="owner-detail-spotlight-copy">{{ tagAlertCopy }}</p>
              </article>
            </aside>
          </section>

          <div class="summary-grid owner-detail-facts">
            <article v-for="fact in profileFacts" :key="fact.label" class="meta-box owner-fact-card">
              <span class="owner-fact-label">{{ fact.label }}</span>
              <strong class="owner-fact-value">{{ fact.value }}</strong>
            </article>
          </div>

          <div class="inline-actions owner-detail-actions">
            <NuxtLink class="solid-button" :to="localePath(`/tags/${currentTag.uid}/edit`)">
              {{ t('dashboard.editProfile') }}
            </NuxtLink>
            <NuxtLink class="outline-button" :to="finderPreviewPath">
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

          <div class="owner-overview-grid">
            <article class="meta-box owner-panel">
              <div class="owner-panel-head">
                <span class="owner-panel-label">{{ t('finder.rewardTitle') }}</span>
                <span class="owner-panel-hint">{{ displayStatusLabel }}</span>
              </div>
              <p class="owner-panel-copy">{{ currentTag.rewardText || t('dashboard.noReward') }}</p>
            </article>

            <article class="meta-box owner-panel">
              <div class="owner-panel-head">
                <span class="owner-panel-label">{{ t('finder.medicalTitle') }}</span>
                <span class="owner-panel-hint">{{ tagAlertTitle }}</span>
              </div>
              <p class="owner-panel-copy">{{ currentTag.profile?.medicalNote || t('finder.noMedicalNote') }}</p>
            </article>

            <article class="meta-box owner-panel owner-panel-wide">
              <div class="owner-panel-head">
                <span class="owner-panel-label">{{ t('finder.contactTitle') }}</span>
                <span class="owner-contact-mode" :class="{ 'is-private': currentTag.profile?.privacyMode }">
                  {{ tagAlertTitle }}
                </span>
              </div>
              <p class="owner-panel-copy">{{ tagAlertCopy }}</p>
              <ul class="owner-contact-grid">
                <li v-for="item in ownerContactItems" :key="item.label">
                  <span class="owner-contact-label">{{ item.label }}</span>
                  <strong class="owner-contact-value">{{ item.value }}</strong>
                </li>
              </ul>
            </article>
          </div>

          <section class="content-section owner-record-section">
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
            <div v-else class="owner-record-card-grid">
              <article v-for="message in messages" :key="message.id" class="meta-box owner-record-card owner-message-card">
                <div class="owner-record-card-head">
                  <div>
                    <strong class="owner-record-card-title">{{ message.finderName || t('dashboard.anonymousFinder') }}</strong>
                    <p class="muted-text owner-record-card-meta">{{ formatDateTime(message.createdAt) }}</p>
                  </div>
                  <span class="status-chip" :class="`status-${message.deliveryStatus.toLowerCase()}`">{{ deliveryStatusLabel(message.deliveryStatus) }}</span>
                </div>
                <p class="owner-message-body">{{ message.message }}</p>
                <p v-if="message.finderContact" class="muted-text owner-record-inline-copy">
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
          </section>

          <section class="content-section owner-record-section">
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
            <div v-else class="owner-record-card-grid">
              <article v-for="scan in scans" :key="scan.id" class="meta-box owner-record-card owner-scan-card">
                <div class="owner-record-card-head">
                  <div>
                    <strong class="owner-record-card-title">{{ formatDateTime(scan.scannedAt) }}</strong>
                    <p class="muted-text owner-record-card-meta">{{ getScanLocationSummary(scan) }}</p>
                  </div>
                  <span class="status-chip" :class="`status-${scan.notificationStatus.toLowerCase()}`">
                    {{ notificationStatusLabel(scan.notificationStatus) }}
                  </span>
                </div>
                <div class="owner-record-inline">
                  <span class="pill owner-record-pill">{{ locationSourceLabel(scan.locationSource) }}</span>
                  <span class="status-chip" :class="`status-${scan.tagStatusAtScan.toLowerCase()}`">{{ getStatusDisplayLabel(scan.tagStatusAtScan) }}</span>
                </div>
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
          </section>
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

<style scoped>
.owner-tag-detail-page {
  padding-bottom: 56px;
}

.owner-detail-shell {
  display: grid;
  gap: 22px;
  padding: clamp(16px, 2.4vw, 28px);
}

.owner-detail-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(280px, 0.65fr);
  gap: 18px;
  align-items: stretch;
}

.owner-detail-hero-main {
  display: grid;
  grid-template-columns: minmax(184px, 212px) minmax(0, 1fr);
  gap: 24px;
  align-items: center;
  padding: 22px;
  border: 1px solid rgba(49, 95, 87, 0.08);
  border-radius: 24px;
  background:
    radial-gradient(circle at top left, rgba(95, 159, 143, 0.12), transparent 34%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(255, 250, 244, 0.88));
}

.owner-detail-photo-shell {
  display: grid;
  place-items: center;
}

.owner-detail-photo,
.owner-detail-photo-placeholder {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 999px;
}

.owner-detail-photo {
  margin-bottom: 0;
}

.owner-detail-photo-placeholder {
  display: grid;
  place-items: center;
  border: 1px dashed rgba(49, 95, 87, 0.22);
  background:
    radial-gradient(circle at top, rgba(95, 159, 143, 0.16), transparent 58%),
    rgba(255, 253, 248, 0.96);
  color: var(--accent);
  font-size: 30px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.owner-detail-hero-copy,
.owner-detail-hero-side {
  display: grid;
  gap: 12px;
  min-width: 0;
}

.owner-detail-topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.owner-detail-eyebrow {
  color: var(--brand-deep);
  background: rgba(95, 159, 143, 0.1);
}

.owner-detail-status {
  font-weight: 700;
}

.owner-detail-name {
  margin: 0;
  color: #24332f;
  font-size: clamp(34px, 5vw, 52px);
  line-height: 0.96;
  letter-spacing: -0.04em;
}

.owner-detail-meta,
.owner-detail-description,
.owner-detail-spotlight-copy,
.owner-panel-copy {
  margin: 0;
}

.owner-detail-meta {
  color: #5e6d67;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.01em;
}

.owner-detail-description {
  max-width: 54ch;
  color: var(--text-soft);
  font-size: 15px;
  line-height: 1.72;
}

.owner-detail-spotlight {
  display: grid;
  gap: 8px;
  padding: 18px;
  border-radius: 20px;
  background: linear-gradient(135deg, rgba(49, 95, 87, 0.92), rgba(95, 159, 143, 0.88));
  border-color: rgba(255, 255, 255, 0.12);
  color: #fffdf8;
}

.owner-detail-spotlight-soft {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(255, 250, 244, 0.9));
  color: var(--text);
}

.owner-detail-spotlight-label {
  color: rgba(255, 253, 248, 0.72);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.owner-detail-spotlight-soft .owner-detail-spotlight-label {
  color: var(--accent);
}

.owner-detail-spotlight-value {
  font-size: 24px;
  line-height: 1.1;
}

.owner-detail-spotlight-copy {
  color: inherit;
  opacity: 0.88;
  font-size: 14px;
  line-height: 1.68;
}

.owner-detail-facts {
  margin-top: 0;
}

.owner-fact-card {
  display: grid;
  gap: 8px;
}

.owner-fact-label {
  color: #73807a;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.owner-fact-value {
  color: #24332f;
  font-size: 16px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.owner-detail-actions {
  gap: 10px;
}

.owner-detail-actions :deep(.solid-button),
.owner-detail-actions :deep(.outline-button),
.owner-detail-actions .solid-button,
.owner-detail-actions .outline-button {
  min-width: 0;
}

.owner-overview-grid,
.owner-record-card-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.owner-panel {
  display: grid;
  gap: 14px;
  padding: 18px;
  border-radius: 20px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(255, 250, 244, 0.84));
  border-color: rgba(49, 95, 87, 0.08);
  box-shadow: none;
}

.owner-panel-wide {
  grid-column: 1 / -1;
}

.owner-panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.owner-panel-label {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(49, 95, 87, 0.06);
  color: var(--brand-deep);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.03em;
}

.owner-panel-hint {
  color: #73807a;
  font-size: 13px;
  font-weight: 600;
}

.owner-panel-copy {
  color: #4f5d58;
  font-size: 15px;
  line-height: 1.72;
  white-space: pre-wrap;
}

.owner-contact-mode {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(95, 159, 143, 0.14);
  color: var(--accent);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.owner-contact-mode.is-private {
  background: rgba(214, 59, 47, 0.1);
  color: var(--danger);
}

.owner-contact-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.owner-contact-grid li {
  display: grid;
  gap: 6px;
  padding: 14px 16px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(36, 51, 47, 0.08);
}

.owner-contact-label {
  color: #73807a;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.owner-contact-value {
  color: #24332f;
  font-size: 15px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.owner-record-section {
  margin-top: 0;
  gap: 14px;
}

.record-section-heading {
  display: grid;
  gap: 10px;
  align-items: flex-start;
}

.owner-record-section .section-title {
  margin: 0;
  color: #24332f;
  font-size: clamp(24px, 3.2vw, 32px);
  line-height: 1.08;
  letter-spacing: -0.03em;
}

.owner-record-section .muted-text {
  font-size: 14px;
  line-height: 1.6;
}

.compact-filter-row {
  gap: 8px;
}

.owner-record-section .filter-pill {
  min-height: 34px;
  padding: 0 14px;
  font-size: 13px;
  font-weight: 600;
}

.compact-state {
  min-height: 0;
  padding: 16px 18px;
}

.compact-state .section-copy {
  font-size: 14px;
  line-height: 1.68;
}

.owner-record-card {
  display: grid;
  gap: 10px;
  padding: 16px 18px;
  border-radius: 18px;
}

.owner-record-card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.owner-record-card-title {
  color: #24332f;
  font-size: 16px;
  line-height: 1.35;
}

.owner-record-card-meta,
.owner-record-inline-copy {
  margin: 0;
}

.owner-record-card-meta {
  margin-top: 4px;
  font-size: 13px;
  line-height: 1.55;
}

.owner-record-inline {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.owner-record-card :deep(.status-chip),
.owner-record-pill {
  min-height: 28px;
  padding: 0 12px;
  font-size: 12px;
}

.owner-message-body {
  margin: 0;
  color: #4f5d58;
  font-size: 14px;
  line-height: 1.7;
}

.owner-record-inline-copy {
  font-size: 13px;
  line-height: 1.55;
}

.owner-record-card .text-link {
  font-size: 14px;
  font-weight: 600;
}

.owner-record-section .pagination-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: 12px;
  margin-top: 2px;
}

.owner-record-section .pagination-row .outline-button {
  min-height: 40px;
  min-width: 84px;
  padding: 0 16px;
  font-size: 14px;
  white-space: nowrap;
}

.owner-record-section .pagination-row .outline-button:first-child {
  justify-self: start;
}

.owner-record-section .pagination-row .outline-button:last-child {
  justify-self: end;
}

.owner-record-section .pagination-row .muted-text {
  font-size: 14px;
  justify-self: center;
  text-align: center;
  white-space: nowrap;
}

.owner-tag-detail-page .status-chip.status-pending,
.owner-tag-detail-page .status-chip.status-skipped {
  background: rgba(221, 128, 111, 0.14);
  color: #b05e4f;
}

.owner-tag-detail-page .status-chip.status-sent {
  background: rgba(95, 159, 143, 0.14);
  color: var(--accent);
}

.owner-tag-detail-page .status-chip.status-failed {
  background: rgba(214, 59, 47, 0.12);
  color: var(--danger);
}

@media (max-width: 1120px) {
  .owner-detail-hero,
  .owner-contact-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 960px) {
  .owner-detail-hero-main,
  .owner-overview-grid,
  .owner-record-card-grid {
    grid-template-columns: 1fr;
  }

  .owner-detail-hero-side {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .owner-tag-detail-page {
    padding-bottom: 48px;
  }

  .owner-detail-shell {
    gap: 16px;
    padding: 14px;
    border-radius: 26px;
  }

  .owner-detail-hero-main {
    gap: 18px;
    padding: 16px;
    border-radius: 22px;
  }

  .owner-detail-hero-side,
  .owner-detail-facts,
  .owner-contact-grid {
    grid-template-columns: 1fr;
  }

  .owner-detail-name {
    font-size: clamp(28px, 10vw, 40px);
  }

  .owner-detail-meta,
  .owner-detail-description,
  .owner-panel-copy,
  .owner-contact-value,
  .owner-record-card-meta,
  .owner-record-inline-copy {
    font-size: 14px;
  }

  .owner-record-section .section-title {
    font-size: clamp(18px, 7.2vw, 24px);
  }

  .owner-record-section .muted-text,
  .compact-state .section-copy,
  .owner-message-body,
  .owner-record-card .text-link,
  .owner-record-section .pagination-row .muted-text,
  .owner-record-section .pagination-row .outline-button {
    font-size: 13px;
  }

  .owner-record-section .filter-pill,
  .owner-record-card :deep(.status-chip),
  .owner-record-pill {
    min-height: 26px;
    padding: 0 11px;
    font-size: 11px;
  }

  .owner-detail-photo,
  .owner-detail-photo-placeholder {
    max-width: 164px;
    margin: 0 auto;
  }

  .owner-panel,
  .owner-record-card {
    padding: 16px;
    border-radius: 18px;
  }

  .compact-state {
    padding: 14px 16px;
  }

  .owner-contact-grid li {
    padding: 12px 14px;
    border-radius: 14px;
  }

  .owner-detail-actions > *,
  .owner-detail-actions :deep(.solid-button),
  .owner-detail-actions :deep(.outline-button) {
    width: 100%;
  }
}
</style>
