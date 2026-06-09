<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const { demoTags } = useSmartTagDemo()

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
        <div class="card-grid">
          <NuxtLink
            v-for="tag in demoTags"
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
