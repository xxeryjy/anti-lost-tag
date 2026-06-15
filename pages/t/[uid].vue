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
const displaySubtitle = computed(() => tag.value?.profile?.breed || tag.value?.profile?.customLabel || t('finder.genericLabel'))
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
      return
    }

    if (response.data.viewer.isOwner && !isPreview.value) {
      await navigateTo(localePath(`/dashboard/tags/${response.data.uid}`))
      return
    }

    if (!isPreview.value) {
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
</script>

<template>
  <div class="page-container">
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

      <div v-else-if="tag" class="finder-card">
        <FinderBanner v-if="isLost" />
        <div class="finder-heading">
          <div v-if="tag.profile?.photoUrl" class="finder-profile-photo">
            <img :src="tag.profile.photoUrl" :alt="displayName" />
          </div>
          <div>
            <span class="eyebrow">{{ isOwner && isPreview ? t('finder.ownerPreview') : t('finder.publicProfile') }}</span>
            <h1 class="section-title">{{ displayName }}</h1>
            <p class="section-copy">{{ displaySubtitle }}</p>
          </div>
          <span class="status-chip" :class="`status-${tag.status.toLowerCase()}`">{{ tag.status }}</span>
        </div>

        <div class="finder-meta">
          <div class="meta-box">
            <strong>{{ t('finder.medicalTitle') }}</strong>
            <p class="muted-text">{{ tag.profile?.medicalNote || t('finder.noMedicalNote') }}</p>
          </div>
          <div class="meta-box">
            <strong>{{ t('finder.rewardTitle') }}</strong>
            <p class="muted-text">{{ tag.rewardText || t('finder.noReward') }}</p>
          </div>
        </div>

        <div class="meta-box">
          <strong>{{ t('finder.contactTitle') }}</strong>
          <p v-if="isPrivacyMode" class="muted-text">{{ t('finder.privacyModeOn') }}</p>
          <ul v-else class="detail-list finder-contact-list">
            <li>{{ t('finder.ownerPhone') }}: {{ tag.profile?.ownerPhone || t('common.none') }}</li>
            <li>{{ t('finder.backupPhone') }}: {{ tag.profile?.backupPhone || t('common.none') }}</li>
            <li>{{ t('finder.email') }}: {{ tag.profile?.notificationEmail || t('common.none') }}</li>
          </ul>
        </div>

        <div v-if="tag.profile?.homeAddress" class="meta-box">
          <strong>{{ t('finder.homeAddress') }}</strong>
          <p class="muted-text">{{ tag.profile.homeAddress }}</p>
        </div>

        <div v-if="canSendMessage" class="finder-message-entry">
          <div>
            <strong>{{ t('finder.messageTitle') }}</strong>
            <p class="muted-text">{{ t('finder.messageEntryCopy') }}</p>
          </div>
          <button class="solid-button" type="button" @click="openMessageModal">
            {{ t('finder.sendPrivacyMessage') }}
          </button>
        </div>
        <p v-if="successMessage" class="alert-box alert-success">{{ successMessage }}</p>

        <div class="inline-actions">
          <a
            v-if="!isPrivacyMode && ownerPhoneLink"
            class="solid-button"
            :href="ownerPhoneLink"
          >
            {{ t('finder.callOwner') }}
          </a>
          <a
            v-if="!isPrivacyMode && notificationEmailLink"
            class="outline-button"
            :href="notificationEmailLink"
          >
            {{ t('finder.emailOwner') }}
          </a>
          <button class="solid-button" type="button" @click="openFinderLocation">
            {{ t('finder.showLocation') }}
          </button>
          <NuxtLink v-if="isOwner" class="outline-button" :to="localePath(`/dashboard/tags/${tag.uid}`)">
            {{ t('finder.backToOwnerDetail') }}
          </NuxtLink>
        </div>
      </div>
    </section>

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
