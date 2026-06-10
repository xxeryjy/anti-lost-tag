<script setup lang="ts">
import type { ProfileCategory, TagProfile } from '~/types/smarttag'

const route = useRoute()
const { t } = useI18n()
const localePath = useLocalePath()
const { isLoadingTags, loadError, loadMyTags, findByUid } = useOwnerTags()
const { isLoading, errorMessage, successMessage, run, setSuccess } = useApiRequest()

const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp']
const maxImageSize = 5 * 1024 * 1024
const pendingPhotoFile = shallowRef<File | null>(null)
const cropPreviewUrl = ref('')
const isCropModalOpen = ref(false)
const cropForm = reactive({
  zoom: 100,
  offsetX: 0,
  offsetY: 0
})

const form = reactive({
  category: 'PET' as ProfileCategory,
  petKind: 'DOG' as TagProfile['petKind'],
  displayName: '',
  photoUrl: '',
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
const cropPreviewStyle = computed(() => ({
  transform: `translate(${cropForm.offsetX}%, ${cropForm.offsetY}%) scale(${cropForm.zoom / 100})`
}))

function setValidationError(message: string) {
  errorMessage.value = message
  successMessage.value = ''
}

function getValidDisplayName() {
  const displayName = form.displayName.trim()
  if (!displayName) {
    setValidationError(t('tag.displayNameRequired'))
    return null
  }

  form.displayName = displayName
  return displayName
}

function resetCropState() {
  cropForm.zoom = 100
  cropForm.offsetX = 0
  cropForm.offsetY = 0
}

function clearPendingPhoto() {
  if (cropPreviewUrl.value) {
    URL.revokeObjectURL(cropPreviewUrl.value)
  }
  pendingPhotoFile.value = null
  cropPreviewUrl.value = ''
  isCropModalOpen.value = false
  resetCropState()
}

function closeCropModal() {
  if (isLoading.value) {
    return
  }
  clearPendingPhoto()
}

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = url
  })
}

async function createCroppedPhoto() {
  if (!cropPreviewUrl.value) {
    return null
  }

  const image = await loadImage(cropPreviewUrl.value)
  const canvas = document.createElement('canvas')
  const width = 600
  const height = 450
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')
  if (!context) {
    return null
  }

  const zoom = cropForm.zoom / 100
  const baseScale = Math.max(width / image.naturalWidth, height / image.naturalHeight)
  const drawWidth = image.naturalWidth * baseScale * zoom
  const drawHeight = image.naturalHeight * baseScale * zoom
  const offsetX = (cropForm.offsetX / 100) * width
  const offsetY = (cropForm.offsetY / 100) * height
  const drawX = (width - drawWidth) / 2 + offsetX
  const drawY = (height - drawHeight) / 2 + offsetY

  context.fillStyle = '#fffdf8'
  context.fillRect(0, 0, width, height)
  context.drawImage(image, drawX, drawY, drawWidth, drawHeight)

  return {
    dataUrl: canvas.toDataURL('image/jpeg', 0.9),
    blob: await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9))
  }
}

function applyProfile(profile: TagProfile | null) {
  if (!profile) {
    return
  }

  form.category = profile.category
  form.petKind = profile.petKind || 'DOG'
  form.displayName = profile.displayName
  form.photoUrl = profile.photoUrl || ''
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
  const displayName = getValidDisplayName()
  if (!displayName) {
    return
  }

  const payload = {
    category: form.category,
    petKind: form.category === 'PET' ? form.petKind : null,
    displayName,
    photoUrl: form.photoUrl || null,
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

async function uploadImage(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) {
    return
  }
  if (!allowedImageTypes.includes(file.type)) {
    setValidationError(t('tag.photoTypeError'))
    input.value = ''
    return
  }
  if (file.size > maxImageSize) {
    setValidationError(t('tag.photoSizeError'))
    input.value = ''
    return
  }

  clearPendingPhoto()
  pendingPhotoFile.value = file
  cropPreviewUrl.value = URL.createObjectURL(file)
  isCropModalOpen.value = true
  errorMessage.value = ''
  successMessage.value = ''
  input.value = ''
}

async function confirmCroppedPhoto() {
  if (!pendingPhotoFile.value) {
    setValidationError(t('tag.photoRequired'))
    return
  }
  const croppedPhoto = await createCroppedPhoto()
  if (!croppedPhoto?.blob) {
    setValidationError(t('tag.photoCropFailed'))
    return
  }

  const body = new FormData()
  body.append('image', croppedPhoto.blob, pendingPhotoFile.value.name.replace(/\.[^.]+$/, '.jpg'))
  body.append('cropZoom', String(cropForm.zoom))
  body.append('cropOffsetX', String(cropForm.offsetX))
  body.append('cropOffsetY', String(cropForm.offsetY))
  const data = await run<{ url: string }>(() => $fetch('/api/uploads/image', {
    method: 'POST',
    body
  }))

  if (data) {
    form.photoUrl = data.url
    setSuccess(t('tag.photoUploadSuccess'))
    clearPendingPhoto()
  }
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

onBeforeUnmount(() => {
  if (cropPreviewUrl.value) {
    URL.revokeObjectURL(cropPreviewUrl.value)
  }
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
          <div class="profile-photo-editor">
            <div class="profile-photo-preview">
              <img v-if="form.photoUrl" :src="form.photoUrl" :alt="form.displayName || t('tag.photo')" />
              <span v-else>{{ t('tag.photoPlaceholder') }}</span>
            </div>
            <div class="profile-photo-controls">
              <label class="outline-button profile-upload-button">
                {{ t('tag.uploadPhoto') }}
                <input type="file" accept="image/jpeg,image/png,image/webp" @change="uploadImage" />
              </label>
              <button
                v-if="form.photoUrl"
                class="outline-button"
                type="button"
                :disabled="isLoading"
                @click="form.photoUrl = ''"
              >
                {{ t('tag.removePhoto') }}
              </button>
              <p class="muted-text">{{ t('tag.photoHint') }}</p>
            </div>
          </div>

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

    <div v-if="isCropModalOpen" class="modal-backdrop" role="presentation" @click.self="closeCropModal">
      <section class="confirm-dialog photo-crop-dialog" role="dialog" aria-modal="true" :aria-label="t('tag.photoCropTitle')">
        <div class="modal-heading-row">
          <div>
            <span class="eyebrow">{{ t('tag.photoCropEyebrow') }}</span>
            <h2 class="finder-form-title">{{ t('tag.photoCropTitle') }}</h2>
          </div>
          <button class="modal-close-button" type="button" :aria-label="t('common.cancel')" :disabled="isLoading" @click="closeCropModal">
            x
          </button>
        </div>

        <div class="photo-crop-layout">
          <div class="photo-crop-frame">
            <img v-if="cropPreviewUrl" :src="cropPreviewUrl" :alt="t('tag.photoCropTitle')" :style="cropPreviewStyle" />
          </div>

          <div class="photo-crop-controls">
            <label class="field-label">
              {{ t('tag.photoCropZoom') }}
              <input v-model.number="cropForm.zoom" type="range" min="80" max="160" step="5" />
            </label>
            <label class="field-label">
              {{ t('tag.photoCropOffsetX') }}
              <input v-model.number="cropForm.offsetX" type="range" min="-30" max="30" step="2" />
            </label>
            <label class="field-label">
              {{ t('tag.photoCropOffsetY') }}
              <input v-model.number="cropForm.offsetY" type="range" min="-30" max="30" step="2" />
            </label>
            <p class="form-note">{{ t('tag.photoCropHint') }}</p>
          </div>
        </div>

        <div class="inline-actions dialog-actions">
          <button class="outline-button" type="button" :disabled="isLoading" @click="closeCropModal">
            {{ t('common.cancel') }}
          </button>
          <button class="solid-button" type="button" :disabled="isLoading" @click="confirmCroppedPhoto">
            {{ isLoading ? t('common.submitting') : t('tag.photoCropConfirm') }}
          </button>
        </div>
      </section>
    </div>
  </div>
</template>
