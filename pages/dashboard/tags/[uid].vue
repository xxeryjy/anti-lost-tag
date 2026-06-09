<script setup lang="ts">
const route = useRoute()
const { t } = useI18n()
const localePath = useLocalePath()
const { findTagByUid, getScansByTagId } = useSmartTagDemo()
const currentTag = computed(() => findTagByUid(String(route.params.uid)))
const scans = computed(() => (currentTag.value ? getScansByTagId(currentTag.value.id) : []))

useHead({
  title: t('dashboard.detailTitle')
})
</script>

<template>
  <div class="page-container">
    <section class="content-section">
      <div v-if="!currentTag" class="state-card">
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
        </div>

        <div class="content-section">
          <h2 class="section-title">{{ t('dashboard.scansTitle') }}</h2>
          <div class="card-grid">
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
