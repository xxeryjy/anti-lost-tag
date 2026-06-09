<script setup lang="ts">
import type { ScanLogItem, TagStatus } from '~/types/smarttag'

const route = useRoute()
const { t } = useI18n()
const localePath = useLocalePath()
const { isLoading, errorMessage, successMessage, run, setSuccess } = useApiRequest()
const { isLoadingTags, loadError, loadMyTags, findByUid, loadScans } = useOwnerTags()
const scans = ref<ScanLogItem[]>([])
const uid = computed(() => String(route.params.uid))
const currentTag = computed(() => findByUid(uid.value))

async function loadPageData() {
  await loadMyTags()
  if (currentTag.value) {
    scans.value = await loadScans(currentTag.value.id).catch(() => [])
  }
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

      <div v-else class="surface-card">
        <div class="inline-actions" style="justify-content: space-between;">
          <div>
            <span class="eyebrow">{{ t('dashboard.detailEyebrow') }}</span>
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
          <NuxtLink class="outline-button" :to="localePath(`/t/${currentTag.uid}`)">
            {{ t('dashboard.previewFinder') }}
          </NuxtLink>
          <button
            v-if="currentTag.status !== 'LOST'"
            class="outline-button danger-action"
            type="button"
            :disabled="isLoading"
            @click="updateStatus('LOST')"
          >
            {{ t('dashboard.enableLost') }}
          </button>
          <button
            v-else
            class="outline-button"
            type="button"
            :disabled="isLoading"
            @click="updateStatus('ACTIVE')"
          >
            {{ t('dashboard.disableLost') }}
          </button>
        </div>
        <p v-if="errorMessage" class="alert-box alert-error">{{ errorMessage }}</p>
        <p v-if="successMessage" class="alert-box alert-success">{{ successMessage }}</p>

        <div class="content-section">
          <h2 class="section-title">{{ t('dashboard.scansTitle') }}</h2>
          <div v-if="!scans.length" class="state-card compact-state">
            <p class="section-copy">{{ t('dashboard.emptyScans') }}</p>
          </div>
          <div v-else class="card-grid">
            <article v-for="scan in scans" :key="scan.id" class="state-card">
              <strong>{{ scan.scannedAt }}</strong>
              <p class="muted-text">{{ scan.city || t('common.unknown') }} / {{ scan.locationSource }}</p>
              <p class="muted-text">{{ scan.notificationStatus }}</p>
            </article>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
