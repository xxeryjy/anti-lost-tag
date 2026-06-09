<script setup lang="ts">
import type { ProfileCategory, TagProfile } from '~/types/smarttag'

const route = useRoute()
const { t } = useI18n()
const localePath = useLocalePath()
const { isLoadingTags, loadError, loadMyTags, findByUid } = useOwnerTags()
const { isLoading, errorMessage, successMessage, run, setSuccess } = useApiRequest()

const form = reactive({
  category: 'PET' as ProfileCategory,
  petKind: 'DOG' as TagProfile['petKind'],
  displayName: '',
  customLabel: '',
  breed: '',
  sex: 'UNKNOWN' as TagProfile['sex'],
  isNeutered: false,
  medicalNote: '',
  hasMicrochip: false,
  microchipCode: '',
  privacyMode: false,
  ownerPhone: '',
  backupPhone: '',
  notificationEmail: '',
  homeAddress: '',
  showHomeAddress: false
})

const uid = computed(() => String(route.params.uid))
const currentTag = computed(() => findByUid(uid.value))

function applyProfile(profile: TagProfile | null) {
  if (!profile) {
    return
  }

  form.category = profile.category
  form.petKind = profile.petKind || 'DOG'
  form.displayName = profile.displayName
  form.customLabel = profile.customLabel || ''
  form.breed = profile.breed || ''
  form.sex = profile.sex || 'UNKNOWN'
  form.isNeutered = Boolean(profile.isNeutered)
  form.medicalNote = profile.medicalNote || ''
  form.hasMicrochip = profile.hasMicrochip
  form.microchipCode = profile.microchipCode || ''
  form.privacyMode = profile.privacyMode
  form.ownerPhone = profile.ownerPhone || ''
  form.backupPhone = profile.backupPhone || ''
  form.notificationEmail = profile.notificationEmail || ''
  form.homeAddress = profile.homeAddress || ''
  form.showHomeAddress = profile.showHomeAddress
}

async function saveProfile() {
  if (!currentTag.value) {
    return
  }

  const payload = {
    category: form.category,
    petKind: form.category === 'PET' ? form.petKind : null,
    displayName: form.displayName,
    customLabel: form.customLabel || null,
    breed: form.breed || null,
    sex: form.category === 'PET' ? form.sex : null,
    isNeutered: form.category === 'PET' ? form.isNeutered : null,
    medicalNote: form.medicalNote || null,
    hasMicrochip: form.hasMicrochip,
    microchipCode: form.hasMicrochip ? form.microchipCode || null : null,
    privacyMode: form.privacyMode,
    ownerPhone: form.ownerPhone || null,
    backupPhone: form.backupPhone || null,
    notificationEmail: form.notificationEmail || null,
    homeAddress: form.homeAddress || null,
    showHomeAddress: form.showHomeAddress
  }

  const data = await run<{ profile: TagProfile }>(() => $fetch(`/api/tags/${currentTag.value!.id}/profile`, {
    method: 'PATCH',
    body: payload
  }))

  if (!data) {
    return
  }

  setSuccess(t('tag.profileSaveSuccess'))
  await loadMyTags()
}

async function saveAndGoDetail() {
  await saveProfile()
  if (!errorMessage.value && currentTag.value) {
    await navigateTo(localePath(`/dashboard/tags/${currentTag.value.uid}`))
  }
}

onMounted(async () => {
  await loadMyTags()
  applyProfile(currentTag.value?.profile || null)
})

useHead({
  title: t('tag.editTitle')
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

      <div v-else class="form-card">
        <span class="eyebrow">{{ t('tag.editEyebrow') }}</span>
        <h1 class="section-title">{{ t('tag.editTitle') }}</h1>
        <form @submit.prevent="saveAndGoDetail">
          <div class="form-grid two-columns">
            <label class="field-label">
              {{ t('tag.category') }}
              <select v-model="form.category">
                <option value="PET">PET</option>
                <option value="ITEM">ITEM</option>
              </select>
            </label>
            <label v-if="form.category === 'PET'" class="field-label">
              {{ t('tag.petKind') }}
              <select v-model="form.petKind">
                <option value="DOG">DOG</option>
                <option value="CAT">CAT</option>
                <option value="OTHER">OTHER</option>
              </select>
            </label>
            <label class="field-label">
              {{ t('tag.displayName') }}
              <input v-model="form.displayName" type="text" required />
            </label>
            <label class="field-label">
              {{ t('tag.customLabel') }}
              <input v-model="form.customLabel" type="text" />
            </label>
            <label class="field-label">
              {{ t('tag.breed') }}
              <input v-model="form.breed" type="text" />
            </label>
            <label v-if="form.category === 'PET'" class="field-label">
              {{ t('tag.sex') }}
              <select v-model="form.sex">
                <option value="UNKNOWN">UNKNOWN</option>
                <option value="MALE">MALE</option>
                <option value="FEMALE">FEMALE</option>
              </select>
            </label>
            <label class="field-label">
              {{ t('tag.ownerPhone') }}
              <input v-model="form.ownerPhone" type="text" />
            </label>
            <label class="field-label">
              {{ t('tag.backupPhone') }}
              <input v-model="form.backupPhone" type="text" />
            </label>
            <label class="field-label">
              {{ t('tag.notificationEmail') }}
              <input v-model="form.notificationEmail" type="email" />
            </label>
            <label class="field-label">
              {{ t('tag.homeAddress') }}
              <input v-model="form.homeAddress" type="text" />
            </label>
          </div>

          <div class="toggle-grid">
            <label class="toggle-row">
              <input v-model="form.privacyMode" type="checkbox" />
              <span>{{ t('tag.privacyMode') }}</span>
            </label>
            <label v-if="form.category === 'PET'" class="toggle-row">
              <input v-model="form.isNeutered" type="checkbox" />
              <span>{{ t('tag.isNeutered') }}</span>
            </label>
            <label class="toggle-row">
              <input v-model="form.hasMicrochip" type="checkbox" />
              <span>{{ t('tag.hasMicrochip') }}</span>
            </label>
            <label class="toggle-row">
              <input v-model="form.showHomeAddress" type="checkbox" />
              <span>{{ t('tag.showHomeAddress') }}</span>
            </label>
          </div>

          <label v-if="form.hasMicrochip" class="field-label">
            {{ t('tag.microchipCode') }}
            <input v-model="form.microchipCode" type="text" />
          </label>
          <label class="field-label">
            {{ t('tag.medicalNote') }}
            <textarea v-model="form.medicalNote" />
          </label>
          <p v-if="errorMessage" class="alert-box alert-error">{{ errorMessage }}</p>
          <p v-if="successMessage" class="alert-box alert-success">{{ successMessage }}</p>
          <div class="inline-actions">
            <button class="outline-button" type="button" :disabled="isLoading" @click="saveProfile">
              {{ t('common.saveDraft') }}
            </button>
            <button class="solid-button" type="submit" :disabled="isLoading">
              {{ isLoading ? t('common.submitting') : t('tag.saveAndBack') }}
            </button>
          </div>
        </form>
      </div>
    </section>
  </div>
</template>
