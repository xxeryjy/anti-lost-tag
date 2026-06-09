<script setup lang="ts">
const route = useRoute()
const localePath = useLocalePath()
const { t } = useI18n()
const { findTagByUid } = useSmartTagDemo()

const tag = computed(() => findTagByUid(String(route.params.uid)))
const notFound = computed(() => !tag.value)
const isInactive = computed(() => tag.value?.status === 'INACTIVE')
const isLost = computed(() => tag.value?.status === 'LOST')
const isPrivacyMode = computed(() => Boolean(tag.value?.profile?.privacyMode))

function openFinderLocation() {
  if (!import.meta.client) {
    return
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords
      window.open(`https://maps.google.com/?q=${latitude},${longitude}`, '_blank')
    },
    () => {
      window.open('https://maps.google.com/', '_blank')
    }
  )
}

useHead({
  title: `${t('finder.pageTitle')} - ${String(route.params.uid)}`
})
</script>

<template>
  <div class="page-container">
    <section class="content-section">
      <div v-if="notFound" class="state-card">
        <span class="eyebrow">404</span>
        <h1 class="section-title">{{ t('finder.notFoundTitle') }}</h1>
        <p class="section-copy">{{ t('finder.notFoundCopy') }}</p>
      </div>

      <div v-else-if="isInactive" class="state-card">
        <span class="eyebrow">{{ t('finder.inactiveEyebrow') }}</span>
        <h1 class="section-title">{{ t('finder.inactiveTitle') }}</h1>
        <p class="section-copy">{{ t('finder.inactiveCopy') }}</p>
        <div class="stack-actions">
          <NuxtLink class="solid-button" :to="localePath(`/tags/${route.params.uid}/activate`)">
            {{ t('finder.activateNow') }}
          </NuxtLink>
        </div>
      </div>

      <div v-else class="finder-card">
        <FinderBanner v-if="isLost" />
        <span class="eyebrow">{{ t('finder.publicProfile') }}</span>
        <div class="inline-actions" style="justify-content: space-between;">
          <div>
            <h1 class="section-title">{{ tag?.profile?.displayName }}</h1>
            <p class="section-copy">{{ tag?.profile?.breed || tag?.profile?.customLabel || t('finder.genericLabel') }}</p>
          </div>
          <span class="status-chip" :class="`status-${tag?.status.toLowerCase()}`">{{ tag?.status }}</span>
        </div>

        <div class="finder-meta">
          <div class="meta-box">
            <strong>{{ t('finder.medicalTitle') }}</strong>
            <p class="muted-text">{{ tag?.profile?.medicalNote || t('finder.noMedicalNote') }}</p>
          </div>
          <div class="meta-box">
            <strong>{{ t('finder.rewardTitle') }}</strong>
            <p class="muted-text">{{ tag?.rewardText || t('finder.noReward') }}</p>
          </div>
        </div>

        <div class="meta-box">
          <strong>{{ t('finder.contactTitle') }}</strong>
          <p v-if="isPrivacyMode" class="muted-text">{{ t('finder.privacyModeOn') }}</p>
          <ul v-else class="detail-list">
            <li>{{ t('finder.ownerPhone') }}: {{ tag?.profile?.ownerPhone }}</li>
            <li>{{ t('finder.backupPhone') }}: {{ tag?.profile?.backupPhone || t('common.none') }}</li>
            <li>{{ t('finder.email') }}: {{ tag?.profile?.notificationEmail }}</li>
          </ul>
        </div>

        <div class="inline-actions">
          <button class="solid-button" type="button" @click="openFinderLocation">
            {{ t('finder.showLocation') }}
          </button>
          <NuxtLink
            v-if="isPrivacyMode"
            class="outline-button"
            :to="localePath('/auth/login')"
          >
            {{ t('finder.sendPrivacyMessage') }}
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>
