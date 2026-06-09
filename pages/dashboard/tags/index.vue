<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const { tags, isLoadingTags, loadError, loadMyTags } = useOwnerTags()
const statusOptions = ['ALL', 'ACTIVE', 'LOST', 'INACTIVE'] as const
const selectedStatus = ref<'ALL' | 'ACTIVE' | 'LOST' | 'INACTIVE'>('ALL')

const filteredTags = computed(() => {
  if (selectedStatus.value === 'ALL') {
    return tags.value
  }

  return tags.value.filter((tag) => tag.status === selectedStatus.value)
})

onMounted(() => {
  loadMyTags()
})

useHead({
  title: t('dashboard.tagsTitle')
})
</script>

<template>
  <div class="page-container">
    <section class="content-section">
      <div class="surface-card">
        <span class="eyebrow">{{ t('dashboard.tagsEyebrow') }}</span>
        <h1 class="section-title">{{ t('dashboard.tagsTitle') }}</h1>

        <div class="pill-row filter-row">
          <button
            v-for="status in statusOptions"
            :key="status"
            class="pill filter-pill"
            :class="{ 'is-active': selectedStatus === status }"
            type="button"
            @click="selectedStatus = status"
          >
            {{ status === 'ALL' ? t('dashboard.allTags') : status }}
          </button>
        </div>

        <div v-if="isLoadingTags" class="state-card compact-state">
          <p class="section-copy">{{ t('common.loading') }}</p>
        </div>

        <div v-else-if="loadError" class="state-card compact-state">
          <p class="section-copy">{{ loadError }}</p>
        </div>

        <div v-else-if="!filteredTags.length" class="state-card compact-state">
          <p class="section-copy">{{ t('dashboard.emptyTags') }}</p>
        </div>

        <div v-else class="card-grid">
          <NuxtLink
            v-for="tag in filteredTags"
            :key="tag.uid"
            class="state-card"
            :to="localePath(`/dashboard/tags/${tag.uid}`)"
          >
            <div class="inline-actions" style="justify-content: space-between;">
              <strong>{{ tag.profile?.displayName || tag.uid }}</strong>
              <span class="status-chip" :class="`status-${tag.status.toLowerCase()}`">{{ tag.status }}</span>
            </div>
            <p class="muted-text">UID: {{ tag.uid }}</p>
            <p class="muted-text">{{ tag.rewardText || t('dashboard.noReward') }}</p>
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>
