<script setup lang="ts">
import type { LocationSource, PrivacyMessageRecord, ScanLogItem, TagProfile, TagStatus } from '~/types/smarttag'

interface FinderViewer {
  isAuthenticated: boolean
  isOwner: boolean
}

interface PublicFinderTag {
  uid: string
  status: TagStatus
  rewardText: string | null
  isBound: boolean
  profile: (TagProfile & { canSendMessage?: boolean }) | null
  lostBanner: boolean
  viewer: FinderViewer
}

const route = useRoute()
const localePath = useLocalePath()
const { locale, t } = useI18n()
const uid = computed(() => String(route.params.uid))
const isPreview = computed(() => route.query.preview === '1')
const isLoadingPage = ref(true)
const loadError = ref('')
const tag = ref<PublicFinderTag | null>(null)
const scanLog = ref<ScanLogItem | null>(null)
const scanSubmitted = ref(false)
const isMessageModalOpen = ref(false)
const messageForm = reactive({
  finderName: '',
  finderContact: '',
  message: ''
})
const { isLoading, errorMessage, successMessage, setSuccess } = useApiRequest()

const isInactive = computed(() => tag.value?.status === 'INACTIVE')
const isLost = computed(() => tag.value?.status === 'LOST')
const isPrivacyMode = computed(() => Boolean(tag.value?.profile?.privacyMode))
const canSendMessage = computed(() => Boolean(tag.value?.profile?.canSendMessage))
const isOwner = computed(() => Boolean(tag.value?.viewer?.isOwner))
const displayName = computed(() => tag.value?.profile?.displayName || uid.value)
const displaySubtitle = computed(() => tag.value?.profile?.breed?.trim() || tag.value?.profile?.customLabel?.trim() || '')
const finderProfileEyebrow = computed(() => isOwner.value && isPreview.value ? t('finder.ownerPreview') : t('finder.publicProfile'))
const displayStatusLabel = computed(() => {
  if (tag.value?.status === 'LOST') {
    return t('dashboard.statusLost')
  }

  if (tag.value?.status === 'INACTIVE') {
    return t('dashboard.statusInactive')
  }

  return t('dashboard.statusActive')
})
const finderIdentityMeta = computed(() => {
  const parts = []

  if (displaySubtitle.value) {
    parts.push(displaySubtitle.value)
  }

  if (tag.value?.uid) {
    parts.push(`ID ${tag.value.uid.toUpperCase()}`)
  }

  return parts.join(' / ')
})
const finderSupportCopy = computed(() => isPrivacyMode.value ? t('finder.privacyModeOn') : t('dashboard.directAlertCopy'))
const photoFallbackLabel = computed(() => tag.value?.uid?.slice(-3).toUpperCase() || 'TAG')
const ownerPhoneLink = computed(() => {
  const phone = tag.value?.profile?.ownerPhone?.trim()
  return phone ? `tel:${phone.replace(/\s+/g, '')}` : ''
})
const notificationEmailLink = computed(() => {
  const email = tag.value?.profile?.notificationEmail?.trim()
  if (!email) {
    return ''
  }

  const subject = encodeURIComponent(t('finder.emailSubject', { name: displayName.value }))
  return `mailto:${email}?subject=${subject}`
})
const shouldAutoRecordScan = computed(() => !isPreview.value && !isOwner.value)
const showOwnerLocationAction = computed(() => isOwner.value)
const hasStickyContactActions = computed(() => !isOwner.value && !isPrivacyMode.value && Boolean(ownerPhoneLink.value || notificationEmailLink.value))

function buildMapUrl(latitude: number, longitude: number) {
  return `https://maps.google.com/?q=${latitude},${longitude}`
}

async function submitScan(payload: {
  locationSource: LocationSource
  latitude?: number
  longitude?: number
  mapUrl?: string
}) {
  if (scanSubmitted.value || !tag.value || isInactive.value) {
    return
  }

  scanSubmitted.value = true
  try {
    const response = await $fetch<{ success: true; data: { scan: ScanLogItem } }>(`/api/tags/public/${uid.value}/scan`, {
      method: 'POST',
      body: {
        ...payload,
        locale: locale.value
      }
    })
    scanLog.value = response.data.scan
  } catch {
    scanSubmitted.value = false
  }
}

function recordScanWithLocation() {
  if (!import.meta.client || !navigator.geolocation) {
    submitScan({ locationSource: 'IP' })
    return
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords
      submitScan({
        locationSource: 'GPS',
        latitude,
        longitude,
        mapUrl: buildMapUrl(latitude, longitude)
      })
    },
    () => {
      submitScan({ locationSource: 'IP' })
    },
    {
      enableHighAccuracy: false,
      timeout: 8000,
      maximumAge: 300000
    }
  )
}

function openFinderLocation() {
  if (!import.meta.client) {
    return
  }

  if (scanLog.value?.mapUrl) {
    window.open(scanLog.value.mapUrl, '_blank')
    return
  }

  navigator.geolocation?.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords
      window.open(buildMapUrl(latitude, longitude), '_blank')
    },
    () => {
      window.open('https://maps.google.com/', '_blank')
    }
  )
}

function resetMessageForm() {
  messageForm.finderName = ''
  messageForm.finderContact = ''
  messageForm.message = ''
}

function openMessageModal() {
  errorMessage.value = ''
  successMessage.value = ''
  isMessageModalOpen.value = true
}

function closeMessageModal() {
  if (isLoading.value) {
    return
  }

  errorMessage.value = ''
  isMessageModalOpen.value = false
}

async function submitPrivacyMessage() {
  const message = messageForm.message.trim()
  if (!message) {
    errorMessage.value = t('finder.messageRequired')
    successMessage.value = ''
    return
  }

  isLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    await $fetch<{
      success: true
      data: {
        messageId: number
        deliveryStatus: PrivacyMessageRecord['deliveryStatus']
      }
    }>(`/api/tags/public/${uid.value}/message`, {
      method: 'POST',
      body: {
        finderName: messageForm.finderName.trim(),
        finderContact: messageForm.finderContact.trim(),
        message
      }
    })
  } catch (error: unknown) {
    const apiError = error as { data?: { error?: { code?: string; message?: string } }; statusCode?: number; statusMessage?: string; message?: string }
    errorMessage.value = apiError.data?.error?.code === 'RATE_LIMITED' || apiError.statusCode === 429
      ? t('finder.messageRateLimited')
      : apiError.data?.error?.message || apiError.statusMessage || apiError.message || t('finder.messageFailed')
    return
  } finally {
    isLoading.value = false
  }

  resetMessageForm()
  isMessageModalOpen.value = false
  setSuccess(t('finder.messageSuccess'))
}

async function loadFinderTag() {
  isLoadingPage.value = true
  loadError.value = ''
  tag.value = null
  scanLog.value = null
  scanSubmitted.value = false

  try {
    const response = await $fetch<{ success: true; data: PublicFinderTag }>(`/api/tags/public/${uid.value}`)
    tag.value = response.data

    if (response.data.status === 'INACTIVE') {
      if (response.data.viewer.isAuthenticated && !isPreview.value) {
        await navigateTo(localePath(`/tags/${response.data.uid}/activate`))
      }
      return
    }

    if (response.data.viewer.isOwner && !isPreview.value) {
      await navigateTo(localePath(`/dashboard/tags/${response.data.uid}`))
      return
    }

    if (shouldAutoRecordScan.value) {
      recordScanWithLocation()
    }
  } catch (error: unknown) {
    const apiError = error as { data?: { error?: { message?: string } }; statusCode?: number; statusMessage?: string }
    loadError.value = apiError.statusCode === 404
      ? t('finder.notFoundCopy')
      : apiError.data?.error?.message || apiError.statusMessage || t('common.loadFailed')
  } finally {
    isLoadingPage.value = false
  }
}

onMounted(() => {
  loadFinderTag()
})

useHead({
  title: computed(() => `${t('finder.pageTitle')} - ${uid.value}`)
})

definePageMeta({
  layout: 'minimal'
})
</script>

<template>
  <div class="page-container finder-preview-page">
    <section class="content-section">
      <div v-if="isLoadingPage" class="state-card">
        <h1 class="section-title">{{ t('common.loading') }}</h1>
      </div>

      <div v-else-if="loadError" class="state-card">
        <span class="eyebrow">404</span>
        <h1 class="section-title">{{ t('finder.notFoundTitle') }}</h1>
        <p class="section-copy">{{ loadError }}</p>
      </div>

      <div v-else-if="tag && isInactive" class="state-card">
        <span class="eyebrow">{{ t('finder.inactiveEyebrow') }}</span>
        <h1 class="section-title">{{ t('finder.inactiveTitle') }}</h1>
        <p class="section-copy">{{ t('finder.inactiveCopy') }}</p>
        <div class="stack-actions">
          <NuxtLink
            v-if="tag.viewer.isAuthenticated"
            class="solid-button"
            :to="localePath(`/tags/${uid}/activate`)"
          >
            {{ t('finder.activateNow') }}
          </NuxtLink>
          <NuxtLink
            v-else
            class="solid-button"
            :to="localePath(`/auth/login?redirect=${encodeURIComponent(`/tags/${uid}/activate`)}`)"
          >
            {{ t('finder.loginToActivate') }}
          </NuxtLink>
          <NuxtLink
            v-if="!tag.viewer.isAuthenticated"
            class="outline-button"
            :to="localePath(`/auth/register?redirect=${encodeURIComponent(`/tags/${uid}/activate`)}`)"
          >
            {{ t('finder.registerToActivate') }}
          </NuxtLink>
        </div>
      </div>

      <div v-else-if="tag" class="finder-card finder-preview-card">
        <div v-if="isLost" class="finder-hero-banner-wrap">
          <FinderBanner class="finder-hero-banner" />
        </div>

        <section class="finder-hero" :class="{ 'is-lost': isLost }">
          <div class="finder-hero-main">
            <div class="finder-hero-photo-shell">
              <div v-if="tag.profile?.photoUrl" class="finder-profile-photo finder-hero-photo">
                <img :src="tag.profile.photoUrl" :alt="displayName" />
              </div>
              <div v-else class="finder-hero-photo finder-hero-photo-placeholder" aria-hidden="true">
                <span>{{ photoFallbackLabel }}</span>
              </div>
            </div>

            <div class="finder-hero-copy">
              <div class="finder-hero-topline">
                <span class="eyebrow finder-hero-eyebrow">{{ finderProfileEyebrow }}</span>
                <span class="status-chip finder-hero-status" :class="`status-${tag.status.toLowerCase()}`">{{ displayStatusLabel }}</span>
              </div>

              <h1 class="section-title finder-hero-name">{{ displayName }}</h1>
              <p v-if="finderIdentityMeta" class="finder-hero-subtitle">{{ finderIdentityMeta }}</p>
              <p class="finder-hero-description">{{ finderSupportCopy }}</p>
            </div>
          </div>

          <div class="inline-actions finder-hero-actions">
            <button v-if="showOwnerLocationAction" class="solid-button" type="button" @click="openFinderLocation">
              {{ t('finder.showLocation') }}
            </button>
            <NuxtLink
              v-if="!tag.viewer.isAuthenticated"
              class="outline-button"
              :to="localePath('/auth/login?redirect=%2Fdashboard%2Ftags')"
            >
              {{ t('finder.ownerContinue') }}
            </NuxtLink>
            <NuxtLink v-if="isOwner" class="outline-button" :to="localePath(`/dashboard/tags/${tag.uid}`)">
              {{ t('finder.backToOwnerDetail') }}
            </NuxtLink>
          </div>
        </section>

        <p v-if="successMessage" class="alert-box alert-success finder-feedback">{{ successMessage }}</p>

        <div class="finder-info-grid">
          <article class="meta-box finder-panel finder-panel-note">
            <span class="finder-panel-label">{{ t('finder.medicalTitle') }}</span>
            <p class="finder-panel-copy">{{ tag.profile?.medicalNote || t('finder.noMedicalNote') }}</p>
          </article>

          <article class="meta-box finder-panel finder-panel-reward">
            <span class="finder-panel-label">{{ t('finder.rewardTitle') }}</span>
            <p class="finder-panel-copy">{{ tag.rewardText || t('finder.noReward') }}</p>
          </article>

          <article class="meta-box finder-panel finder-contact-panel">
            <div class="finder-panel-head">
              <span class="finder-panel-label">{{ t('finder.contactTitle') }}</span>
              <span class="finder-contact-mode" :class="{ 'is-private': isPrivacyMode }">
                {{ isPrivacyMode ? t('dashboard.privateAlertTitle') : t('dashboard.activeAlertTitle') }}
              </span>
            </div>

            <p v-if="isPrivacyMode" class="finder-panel-copy">{{ t('finder.privacyModeOn') }}</p>
            <ul v-else class="finder-contact-grid">
              <li>
                <span class="finder-contact-label">{{ t('finder.ownerPhone') }}</span>
                <strong class="finder-contact-value">{{ tag.profile?.ownerPhone || t('common.none') }}</strong>
              </li>
              <li>
                <span class="finder-contact-label">{{ t('finder.backupPhone') }}</span>
                <strong class="finder-contact-value">{{ tag.profile?.backupPhone || t('common.none') }}</strong>
              </li>
              <li>
                <span class="finder-contact-label">{{ t('finder.email') }}</span>
                <strong class="finder-contact-value">{{ tag.profile?.notificationEmail || t('common.none') }}</strong>
              </li>
            </ul>
          </article>

          <article v-if="tag.profile?.homeAddress" class="meta-box finder-panel finder-address-panel">
            <span class="finder-panel-label">{{ t('finder.homeAddress') }}</span>
            <p class="finder-panel-copy">{{ tag.profile.homeAddress }}</p>
          </article>
        </div>

        <div v-if="canSendMessage" class="finder-message-entry finder-message-panel">
          <div>
            <span class="finder-panel-label">{{ t('finder.messageEyebrow') }}</span>
            <p class="finder-message-copy">{{ t('finder.messageEntryCopy') }}</p>
          </div>
          <button class="solid-button" type="button" @click="openMessageModal">
            {{ t('finder.sendPrivacyMessage') }}
          </button>
        </div>
      </div>
    </section>

    <div v-if="hasStickyContactActions" class="finder-sticky-actions" :aria-label="t('finder.contactTitle')">
      <a
        v-if="ownerPhoneLink"
        class="finder-sticky-action is-primary"
        :href="ownerPhoneLink"
      >
        {{ t('finder.callOwner') }}
      </a>
      <a
        v-if="notificationEmailLink"
        class="finder-sticky-action is-secondary"
        :href="notificationEmailLink"
      >
        {{ t('finder.emailOwner') }}
      </a>
    </div>

    <div v-if="isMessageModalOpen" class="modal-backdrop" role="presentation" @click.self="closeMessageModal">
      <section class="confirm-dialog finder-message-dialog" role="dialog" aria-modal="true" :aria-label="t('finder.messageTitle')">
        <div class="modal-heading-row">
          <div>
            <span class="eyebrow">{{ t('finder.messageEyebrow') }}</span>
            <h2 class="finder-form-title">{{ t('finder.messageTitle') }}</h2>
          </div>
          <button class="modal-close-button" type="button" :aria-label="t('common.cancel')" :disabled="isLoading" @click="closeMessageModal">
            x
          </button>
        </div>
        <form class="finder-message-form" @submit.prevent="submitPrivacyMessage">
          <div class="form-grid two-columns">
            <label class="field-label">
              {{ t('finder.finderName') }}
              <input v-model="messageForm.finderName" type="text" maxlength="80" autocomplete="name" />
            </label>
            <label class="field-label">
              {{ t('finder.finderContact') }}
              <input v-model="messageForm.finderContact" type="text" maxlength="120" autocomplete="email" />
            </label>
          </div>
          <label class="field-label">
            {{ t('finder.message') }}
            <textarea v-model="messageForm.message" maxlength="800" required />
          </label>
          <p class="form-note">{{ t('finder.messagePrivacyNote') }}</p>
          <p v-if="errorMessage" class="alert-box alert-error">{{ errorMessage }}</p>
          <div class="inline-actions dialog-actions">
            <button class="outline-button" type="button" :disabled="isLoading" @click="closeMessageModal">
              {{ t('common.cancel') }}
            </button>
            <button class="solid-button" type="submit" :disabled="isLoading">
              {{ isLoading ? t('common.submitting') : t('finder.sendMessage') }}
            </button>
          </div>
        </form>
      </section>
    </div>
  </div>
</template>

<style scoped>
.finder-preview-page {
  padding-bottom: 72px;
}

.finder-preview-card {
  gap: 22px;
  padding: clamp(16px, 2.4vw, 28px);
  overflow: visible;
  background:
    radial-gradient(circle at top right, rgba(95, 159, 143, 0.1), transparent 24%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(255, 250, 244, 0.9));
}

.finder-hero {
  display: grid;
  gap: 24px;
}

.finder-hero-banner-wrap {
  position: sticky;
  top: 0;
  z-index: 26;
  width: 100%;
  margin: 0;
  padding: 12px 0 0;
  background: linear-gradient(180deg, rgba(255, 250, 244, 0.96), rgba(255, 250, 244, 0));
}

.finder-hero-banner {
  display: block;
}

.finder-hero-banner-wrap :deep(.finder-banner) {
  margin-bottom: 0;
  padding: 16px 18px;
  border-radius: 0;
  font-size: clamp(22px, 3.6vw, 30px);
  letter-spacing: 0.04em;
  box-shadow: 0 18px 40px rgba(214, 59, 47, 0.18);
}

.finder-hero-main {
  display: grid;
  grid-template-columns: minmax(184px, 224px) minmax(0, 1fr);
  gap: 28px;
  align-items: center;
}

.finder-hero-photo-shell {
  display: grid;
  place-items: center;
  width: 196px;
  height: 196px;
  padding: 14px;
  margin-block: 10px 18px;
  margin-inline: auto;
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(241, 245, 239, 0.96));
  border: 1px solid rgba(36, 51, 47, 0.08);
  box-shadow: 0 16px 36px rgba(49, 95, 87, 0.1);
}

.finder-hero-photo {
  width: 100%;
  height: 100%;
  overflow: hidden;
  aspect-ratio: 1;
  border-radius: 999px;
  border: 1px dashed rgba(49, 95, 87, 0.2);
  background: rgba(255, 253, 248, 0.9);
}

.finder-hero-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.finder-hero-photo-placeholder {
  display: grid;
  place-items: center;
  background:
    radial-gradient(circle at top, rgba(95, 159, 143, 0.14), transparent 60%),
    rgba(255, 253, 248, 0.96);
  color: var(--accent);
  font-size: 28px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.finder-hero-copy {
  display: grid;
  gap: 12px;
  min-width: 0;
}

.finder-hero-topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.finder-hero-eyebrow {
  color: var(--brand-deep);
  background: rgba(95, 159, 143, 0.1);
}

.finder-hero-status {
  font-weight: 700;
}

.finder-hero-name {
  margin: 0;
  color: #24332f;
  font-family: 'Segoe UI', 'PingFang SC', 'Hiragino Sans', sans-serif;
  font-size: clamp(34px, 5vw, 52px);
  font-weight: 800;
  line-height: 0.96;
  letter-spacing: -0.04em;
}

.finder-hero-subtitle,
.finder-hero-description,
.finder-panel-copy,
.finder-message-copy {
  margin: 0;
}

.finder-hero-subtitle {
  color: #5e6d67;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.01em;
}

.finder-hero-description {
  max-width: 54ch;
  color: var(--text-soft);
  font-size: 15px;
  line-height: 1.72;
}

.finder-hero-actions {
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
}

.finder-hero-actions :deep(.solid-button),
.finder-hero-actions :deep(.outline-button),
.finder-hero-actions .solid-button,
.finder-hero-actions .outline-button {
  min-width: 0;
}

.finder-feedback {
  margin: 0;
}

.finder-info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.finder-panel {
  padding: 18px;
  border-radius: 20px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(255, 250, 244, 0.82));
  border-color: rgba(49, 95, 87, 0.08);
  box-shadow: none;
}

.finder-panel-reward {
  background: linear-gradient(180deg, rgba(255, 247, 244, 0.92), rgba(255, 255, 255, 0.86));
}

.finder-panel-label {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  min-height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(49, 95, 87, 0.06);
  color: var(--brand-deep);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.03em;
}

.finder-panel-copy {
  margin-top: 14px;
  color: #4f5d58;
  font-size: 16px;
  line-height: 1.7;
  white-space: pre-wrap;
}

.finder-contact-panel,
.finder-address-panel {
  grid-column: 1 / -1;
}

.finder-panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.finder-contact-mode {
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

.finder-contact-mode.is-private {
  background: rgba(214, 59, 47, 0.1);
  color: var(--danger);
}

.finder-contact-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin: 16px 0 0;
  padding: 0;
  list-style: none;
}

.finder-contact-grid li {
  display: grid;
  gap: 6px;
  padding: 14px 16px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(36, 51, 47, 0.08);
}

.finder-contact-label {
  color: #73807a;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.finder-contact-value {
  color: #24332f;
  font-size: 15px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.finder-message-panel {
  padding: 18px 20px;
  border-radius: 22px;
  background: linear-gradient(135deg, rgba(95, 159, 143, 0.12), rgba(255, 255, 255, 0.94));
  border: 1px solid rgba(95, 159, 143, 0.12);
}

.finder-message-copy {
  margin-top: 12px;
  color: #4f5d58;
  font-size: 15px;
  line-height: 1.72;
}

.finder-sticky-actions {
  position: static;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  width: min(100%, 720px);
  margin: 18px auto 0;
  padding: 10px;
  border: 1px solid rgba(36, 51, 47, 0.08);
  border-radius: 22px;
  background: rgba(255, 252, 247, 0.94);
  box-shadow: 0 20px 45px rgba(36, 51, 47, 0.16);
  backdrop-filter: blur(14px);
}

.finder-sticky-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 0 16px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 700;
  text-align: center;
  text-decoration: none;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.finder-sticky-action:hover {
  transform: translateY(-1px);
}

.finder-sticky-action.is-primary {
  color: #fff;
  background: linear-gradient(135deg, var(--brand-deep), var(--accent));
  box-shadow: 0 12px 24px rgba(49, 95, 87, 0.2);
}

.finder-sticky-action.is-secondary {
  color: var(--brand-deep);
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(49, 95, 87, 0.18);
}

@media (max-width: 960px) {
  .finder-hero-main,
  .finder-info-grid,
  .finder-contact-grid {
    grid-template-columns: 1fr;
  }

  .finder-hero-main {
    justify-items: center;
  }

  .finder-hero-copy {
    width: 100%;
  }
}

@media (max-width: 640px) {
  .finder-preview-page {
    padding-bottom: 164px;
  }

  .finder-preview-card {
    gap: 16px;
    padding: 14px;
    border-radius: 26px;
  }

  .finder-hero {
    gap: 18px;
  }

  .finder-hero-banner-wrap {
    margin-top: -14px;
    padding-top: 10px;
  }

  .finder-hero-banner-wrap :deep(.finder-banner) {
    padding: 14px 16px;
    font-size: clamp(18px, 6vw, 24px);
    line-height: 1.2;
  }

  .finder-hero-main {
    gap: 18px;
  }

  .finder-hero-photo-shell {
    width: 160px;
    height: 160px;
    padding: 12px;
    margin-block: 12px 20px;
  }

  .finder-hero-name {
    font-size: clamp(28px, 10vw, 40px);
  }

  .finder-hero-subtitle,
  .finder-hero-description,
  .finder-panel-copy,
  .finder-message-copy,
  .finder-contact-value {
    font-size: 14px;
  }

  .finder-panel,
  .finder-message-panel {
    padding: 16px;
    border-radius: 18px;
  }

  .finder-contact-grid li {
    padding: 12px 14px;
    border-radius: 14px;
  }

  .finder-hero-actions > *,
  .finder-message-panel > .solid-button {
    width: 100%;
  }

  .finder-message-panel {
    align-items: flex-start;
  }

  .finder-sticky-actions {
    position: fixed;
    left: 50%;
    bottom: calc(12px + env(safe-area-inset-bottom));
    z-index: 32;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    width: min(calc(100% - 24px), 720px);
    margin-top: 0;
    padding: 8px;
    border-radius: 20px;
    transform: translateX(-50%);
  }

  .finder-sticky-action {
    width: 100%;
    min-height: 42px;
    font-size: 13px;
  }
}
</style>
