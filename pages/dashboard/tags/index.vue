<script setup lang="ts">
import logoImage from '~/assets/images/logo.png'
import type { TagRecord, TagStatus } from '~/types/smarttag'

const { t, locale, locales } = useI18n()
const localePath = useLocalePath()
const switchLocalePath = useSwitchLocalePath()
const { run, isLoading, errorMessage, successMessage, setSuccess } = useApiRequest()
const { tags, isLoadingTags, loadError, loadMyTags } = useOwnerTags()
const isNavDocked = ref(false)

const localeItems = computed(() =>
  locales.value.map((item) => {
    const code = typeof item === 'string' ? item : item.code
    const name = typeof item === 'string' ? item : item.name || item.code

    return {
      code,
      name,
      path: switchLocalePath(code)
    }
  })
)

const visibleTags = computed(() => tags.value)

const currentNavLogo = computed(() => logoImage)

const currentLocaleShortLabel = computed(() => {
  if (locale.value.startsWith('zh')) {
    return '中'
  }

  if (locale.value.startsWith('ja')) {
    return '日'
  }

  return '英'
})

function updateNavDockedState() {
  isNavDocked.value = window.scrollY > 72
}

function getTagDisplayName(tag: TagRecord) {
  return tag.profile?.displayName || tag.uid
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

function getCardAlertTitle(tag: TagRecord) {
  return tag.profile?.privacyMode
    ? t('dashboard.privateAlertTitle')
    : t('dashboard.activeAlertTitle')
}

function getCardAlertCopy(tag: TagRecord) {
  if (tag.profile?.privacyMode) {
    return t('dashboard.privateAlertCopy')
  }

  if (tag.profile?.notificationEmail) {
    return t('dashboard.activeAlertCopy')
  }

  return t('dashboard.directAlertCopy')
}

function getStatusActionLabel(status: TagStatus) {
  return status === 'LOST'
    ? t('dashboard.markAsFound')
    : t('dashboard.markAsLost')
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

async function toggleTagStatus(tag: TagRecord) {
  const nextStatus: TagStatus = tag.status === 'LOST' ? 'ACTIVE' : 'LOST'

  const data = await run<{ tag: { status: TagStatus } }>(() => $fetch(`/api/tags/${tag.id}/status`, {
    method: 'PATCH',
    body: { status: nextStatus }
  }))

  if (!data) {
    return
  }

  setSuccess(nextStatus === 'LOST' ? t('dashboard.lostEnabled') : t('dashboard.lostDisabled'))
  await loadMyTags()
}

onMounted(() => {
  updateNavDockedState()
  window.addEventListener('scroll', updateNavDockedState, { passive: true })
  loadMyTags()
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', updateNavDockedState)
})

useHead({
  title: t('dashboard.tagsTitle')
})
</script>

<template>
  <div class="page-container owner-tags-page home-page-redesign">
    <section class="content-section owner-tags-section">
            <header class="home-nav owner-tags-home-nav-shell" :class="{ 'is-docked': isNavDocked }">
        <div class="page-frame home-nav-inner owner-tags-home-nav-inner">
          <div class="owner-tags-nav-main">
            <NuxtLink :to="localePath('/')" class="brand-mark home-brand owner-tags-home-brand">
              <img :src="currentNavLogo" :alt="t('brand.logoAlt')" class="home-brand-logo">
            </NuxtLink>

            <NuxtLink :to="localePath('/dashboard/tags')" class="owner-tags-dashboard-link">
              {{ t('dashboard.consoleLabel') }}
            </NuxtLink>
          </div>

          <div class="home-nav-tools owner-tags-home-nav-tools">
            <details class="home-locale-switcher">
              <summary class="home-locale-trigger">
                <span>{{ currentLocaleShortLabel }}</span>
              </summary>
              <div class="home-locale-menu">
                <NuxtLink
                  v-for="item in localeItems"
                  :key="item.code"
                  class="home-locale-item"
                  :class="{ 'is-active': item.code === locale }"
                  :to="item.path"
                >
                  {{ item.name }}
                </NuxtLink>
              </div>
            </details>
          </div>
        </div>
      </header>

      <div class="surface-card owner-tags-panel">
        <div class="owner-tags-header">
          <span class="eyebrow owner-tags-eyebrow">{{ t('dashboard.tagsEyebrow') }}</span>
          <h1 class="section-title owner-tags-title">{{ t('dashboard.tagsTitle') }}</h1>
        </div>

        <p v-if="errorMessage" class="alert-box alert-error owner-tags-feedback">{{ errorMessage }}</p>
        <p v-if="successMessage" class="alert-box alert-success owner-tags-feedback">{{ successMessage }}</p>

        <div v-if="isLoadingTags" class="state-card compact-state owner-tags-state">
          <p class="section-copy">{{ t('common.loading') }}</p>
        </div>

        <div v-else-if="loadError" class="state-card compact-state owner-tags-state">
          <p class="section-copy">{{ loadError }}</p>
        </div>

        <div v-else-if="!visibleTags.length" class="state-card compact-state owner-tags-state">
          <p class="section-copy">{{ t('dashboard.emptyTags') }}</p>
        </div>

        <div v-else class="card-grid owner-tags-grid">
          <article
            v-for="tag in visibleTags"
            :key="tag.uid"
            class="state-card owner-tag-card"
          >
            <div class="owner-tag-summary">
              <NuxtLink class="owner-tag-summary-link" :to="localePath(`/dashboard/tags/${tag.uid}`)">
                <div class="owner-tag-media">
                  <div v-if="tag.profile?.photoUrl" class="tag-card-photo owner-tag-photo">
                    <img :src="tag.profile.photoUrl" :alt="getTagDisplayName(tag)" />
                  </div>
                  <div v-else class="owner-tag-photo owner-tag-photo-placeholder" aria-hidden="true">
                    <span>{{ tag.uid.slice(-3).toUpperCase() }}</span>
                  </div>
                </div>

                <div class="owner-tag-main">
                  <div class="owner-tag-topline">
                    <div class="owner-tag-copy">
                      <strong class="owner-tag-name">{{ getTagDisplayName(tag) }}</strong>
                      <p class="muted-text owner-tag-meta">{{ getTagMeta(tag) }}</p>
                      <p class="owner-tag-id">{{ t('dashboard.tagIdLabel') }}: {{ tag.uid }}</p>
                    </div>
                  </div>
                </div>
              </NuxtLink>

              <NuxtLink
                class="owner-tag-settings"
                :to="localePath(`/tags/${tag.uid}/edit`)"
              >
                {{ t('dashboard.quickEdit') }}
              </NuxtLink>
            </div>

            <div class="owner-tag-mode-row">
              <div class="owner-tag-mode-copy">
                <span class="owner-tag-mode-label">{{ t('dashboard.modeLabel') }}</span>
                <span class="owner-tag-mode-value" :class="`is-${tag.status.toLowerCase()}`">{{ getStatusDisplayLabel(tag.status) }}</span>
              </div>
              <button
                class="owner-tag-mode-action"
                :class="{ 'is-lost': tag.status !== 'LOST' }"
                type="button"
                :disabled="isLoading"
                @click="toggleTagStatus(tag)"
              >
                {{ isLoading ? t('common.submitting') : getStatusActionLabel(tag.status) }}
              </button>
            </div>

            <div class="owner-tag-alert" :class="{ 'is-private': tag.profile?.privacyMode }">
              <p class="owner-tag-alert-title">{{ getCardAlertTitle(tag) }}</p>
              <p class="owner-tag-alert-copy">{{ getCardAlertCopy(tag) }}</p>
            </div>

            <div class="owner-tag-reward-box">
              <span class="owner-tag-reward-label">{{ t('finder.rewardTitle') }}</span>
              <p class="muted-text owner-tag-reward">{{ tag.rewardText || t('dashboard.noReward') }}</p>
            </div>

            <div class="owner-tag-links">
              <NuxtLink class="owner-tag-link" :to="localePath(`/dashboard/tags/${tag.uid}`)">
                {{ t('dashboard.viewHistory') }}
              </NuxtLink>
              <span class="owner-tag-links-divider" aria-hidden="true"></span>
              <NuxtLink class="owner-tag-link" :to="`${localePath(`/t/${tag.uid}`)}?preview=1`">
                {{ t('dashboard.previewPublicProfile') }}
              </NuxtLink>
            </div>
          </article>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.owner-tags-panel {
  padding: 24px;
}

.owner-tags-header {
  margin-bottom: 16px;
}

.owner-tags-title {
  margin-top: 12px;
  color: #27352f;
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.02;
}

.owner-tags-home-nav-shell {
  position: sticky;
  top: 0;
  z-index: 20;
  margin-bottom: 18px;
  padding-top: 0;
}

.owner-tags-home-nav-inner {
  width: 100%;
  justify-content: space-between;
}

.owner-tags-nav-main {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.owner-tags-home-brand {
  color: var(--brand-deep);
  flex-shrink: 0;
}

.owner-tags-home-nav-tools {
  margin-left: auto;
}

.owner-tags-dashboard-link {
  display: inline-flex;
  align-items: center;
  min-height: 36px;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(66, 52, 41, 0.06);
  color: var(--brand-deep);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: none;
}

.owner-tags-home-nav-shell.is-docked .owner-tags-dashboard-link {
  color: var(--brand-deep);
  background: rgba(66, 52, 41, 0.06);
}

.owner-tags-home-nav-shell :deep(.home-locale-trigger) {
  color: var(--brand-deep);
  background: rgba(66, 52, 41, 0.06);
  border-color: rgba(66, 52, 41, 0.12);
}

.owner-tags-home-nav-shell.is-docked :deep(.home-locale-trigger) {
  color: var(--brand-deep);
  background: rgba(66, 52, 41, 0.06);
  border-color: rgba(66, 52, 41, 0.12);
}


.owner-tags-home-nav-shell :deep(.home-locale-menu) {
  z-index: 1;
}

.owner-tags-eyebrow {
  letter-spacing: 0.01em;
}

.owner-tags-feedback {
  margin: 0 0 16px;
}

.owner-tags-grid {
  align-items: stretch;
}

.owner-tag-card {
  display: grid;
  gap: 16px;
  min-width: 0;
  padding: 20px;
}

.owner-tag-summary {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.owner-tag-summary-link {
  display: flex;
  flex: 1;
  gap: 14px;
  min-width: 0;
  color: inherit;
  text-decoration: none;
}

.owner-tag-media {
  width: 88px;
  flex: 0 0 88px;
}

.owner-tag-photo {
  width: 100%;
  margin-bottom: 0;
}

.owner-tag-photo,
.owner-tag-photo-placeholder {
  aspect-ratio: 1;
  border-radius: 18px;
}

.owner-tag-photo-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed rgba(95, 159, 143, 0.25);
  background:
    radial-gradient(circle at top, rgba(95, 159, 143, 0.16), transparent 58%),
    rgba(255, 253, 248, 0.92);
  color: var(--accent);
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.owner-tag-main,
.owner-tag-copy {
  min-width: 0;
}

.owner-tag-topline {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.owner-tag-name {
  display: -webkit-box;
  overflow: hidden;
  min-width: 0;
  font-size: 24px;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.015em;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.owner-tag-meta,
.owner-tag-id,
.owner-tag-reward {
  margin: 0;
}

.owner-tag-meta {
  margin-top: 6px;
  color: #66736d;
  font-size: 14px;
  line-height: 1.5;
}

.owner-tag-id {
  margin-top: 6px;
  color: #8d93b0;
  font-size: 14px;
  line-height: 1.5;
}

.owner-tag-settings {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  min-height: 44px;
  padding: 0 14px;
  border: 1px solid rgba(49, 95, 87, 0.16);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.84);
  color: var(--brand-deep);
  font-size: 12px;
  font-weight: 700;
  text-decoration: none;
  white-space: nowrap;
}

.owner-tag-mode-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid rgba(49, 95, 87, 0.08);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.8);
}

.owner-tag-mode-copy {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  font-size: 15px;
}

.owner-tag-mode-label {
  color: #5f6d67;
  font-size: 13px;
  font-weight: 600;
}

.owner-tag-mode-value {
  font-weight: 700;
}

.owner-tag-mode-value.is-lost {
  color: var(--danger);
}

.owner-tag-mode-value.is-active {
  color: var(--accent);
}

.owner-tag-mode-value.is-inactive {
  color: var(--text-soft);
}

.owner-tag-mode-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: 0 16px;
  border: none;
  border-radius: 999px;
  background: #c7f5c9;
  color: #1d7b36;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
}

.owner-tag-mode-action.is-lost {
  background: rgba(214, 59, 47, 0.12);
  color: var(--danger);
}

.owner-tag-mode-action:disabled {
  opacity: 0.7;
  cursor: wait;
}

.owner-tag-alert,
.owner-tag-reward-box {
  padding: 14px 16px;
  border-radius: 16px;
}

.owner-tag-alert {
  background: rgba(214, 59, 47, 0.08);
  border: 1px solid rgba(214, 59, 47, 0.12);
  color: #b03025;
}

.owner-tag-alert.is-private {
  background: rgba(95, 159, 143, 0.1);
  border-color: rgba(95, 159, 143, 0.14);
  color: var(--brand-deep);
}

.owner-tag-alert-title,
.owner-tag-alert-copy {
  margin: 0;
}

.owner-tag-alert-title {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.01em;
}

.owner-tag-alert-copy {
  margin-top: 6px;
  font-size: 14px;
  line-height: 1.6;
}

.owner-tag-reward-box {
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(49, 95, 87, 0.08);
}

.owner-tag-reward-label {
  display: inline-flex;
  margin-bottom: 6px;
  color: var(--brand-deep);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.owner-tag-reward {
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.owner-tag-links {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  color: #8690b2;
  font-size: 14px;
}

.owner-tag-link {
  color: inherit;
  text-decoration: none;
}

.owner-tag-links-divider {
  width: 1px;
  height: 14px;
  background: rgba(134, 144, 178, 0.35);
}

@media (max-width: 960px) {
  .owner-tags-panel {
    padding: 20px;
  }

  .owner-tags-grid {
    gap: 14px;
  }
}

@media (max-width: 640px) {
  .owner-tags-page {
    padding-bottom: 48px;
  }

  .owner-tags-section {
    width: 100%;
    margin-top: 12px;
  }

  .owner-tags-panel {
    padding: 16px 14px;
    border-radius: 26px;
  }

  .owner-tags-header {
    margin-bottom: 14px;
  }

  .owner-tags-eyebrow {
    padding: 7px 12px;
    font-size: 12px;
  }

  .owner-tags-title {
    margin-top: 10px;
    margin-bottom: 0;
    font-size: clamp(22px, 7.6vw, 30px);
  }

  .owner-tags-state {
    padding: 22px 18px;
  }

  .owner-tag-card {
    gap: 14px;
    padding: 14px;
    border-radius: 24px;
  }

  .owner-tag-summary {
    gap: 10px;
  }

  .owner-tag-summary-link {
    gap: 12px;
  }

  .owner-tag-media {
    width: 72px;
    flex-basis: 72px;
  }

  .owner-tag-name {
    font-size: 17px;
    line-height: 1.24;
  }

  .owner-tag-meta,
  .owner-tag-id,
  .owner-tag-alert-copy,
  .owner-tag-reward,
  .owner-tag-links {
    font-size: 12.5px;
    line-height: 1.5;
  }

  .owner-tag-settings {
    min-width: 40px;
    min-height: 40px;
    padding: 0 12px;
  }

  .owner-tag-mode-row {
    padding: 10px 12px;
  }

  .owner-tag-mode-copy {
    gap: 6px;
    font-size: 13px;
  }

  .owner-tag-mode-action {
    min-height: 36px;
    padding: 0 14px;
    font-size: 12px;
    font-weight: 700;
  }

  .owner-tag-alert,
  .owner-tag-reward-box {
    padding: 12px 14px;
  }

  .owner-tag-links {
    gap: 10px;
  }

  .owner-tags-home-nav-inner {
    width: 100%;
    margin-inline: 0;
    padding-inline: 12px;
  }

  .owner-tags-home-nav-shell {
    width: 100%;
    margin-inline: 0;
  }

  .owner-tags-home-nav-inner {
    gap: 10px;
  }

  .owner-tags-nav-main {
    gap: 8px;
  }

  .owner-tags-home-nav-shell :deep(.home-locale-switcher) {
    display: block;
    flex-shrink: 0;
  }

  .owner-tags-dashboard-link {
    min-height: 34px;
    padding-inline: 10px;
    font-size: 11px;
  }
}
</style>
