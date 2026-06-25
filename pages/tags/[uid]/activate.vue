<script setup lang="ts">
const route = useRoute()
const { t } = useI18n()
const localePath = useLocalePath()
const form = reactive({
  uid: String(route.params.uid)
})
const activationRedirectPath = computed(() => `/tags/${form.uid}/activate`)
const activationCode = computed(() => form.uid.trim())
const { isLoading, errorMessage, successMessage, setSuccess } = useApiRequest()

function activationErrorMessage(code?: string, statusCode?: number) {
  if (code === 'UNAUTHORIZED' || statusCode === 401) {
    return t('tag.activateLoginRequired')
  }
  if (code === 'TAG_NOT_FOUND' || statusCode === 404) {
    return t('tag.activateTagNotFound')
  }
  if (code === 'TAG_ALREADY_BOUND' || statusCode === 409) {
    return t('tag.activateAlreadyBound')
  }
  if (code === 'INVALID_ACTIVATION_CODE') {
    return t('tag.activateInvalidCode')
  }
  if (code === 'BAD_REQUEST') {
    return t('tag.activateRequired')
  }
  return t('tag.activateFailed')
}

async function submitActivation() {
  const uid = form.uid.trim()
  if (!uid || !activationCode.value) {
    errorMessage.value = t('tag.activateRequired')
    successMessage.value = ''
    return
  }

  isLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const response = await $fetch<{ success: true; data: { tag: { uid: string }; alreadyOwned?: boolean } }>('/api/tags/activate', {
      method: 'POST',
      body: {
        uid,
        activationCode: activationCode.value
      }
    })

    setSuccess(response.data.alreadyOwned ? t('tag.activateAlreadyOwned') : t('tag.activateSuccess'))
    await navigateTo(localePath(`/tags/${response.data.tag.uid}/edit`))
  } catch (error: unknown) {
    const apiError = error as { data?: { error?: { code?: string; message?: string } }; statusCode?: number }
    const code = apiError.data?.error?.code
    errorMessage.value = activationErrorMessage(code, apiError.statusCode)

    if (code === 'UNAUTHORIZED' || apiError.statusCode === 401) {
      await navigateTo(localePath(`/auth/login?redirect=${encodeURIComponent(activationRedirectPath.value)}`))
    }
    return
  } finally {
    isLoading.value = false
  }
}

useHead({
  title: t('tag.activateTitle')
})
</script>

<template>
  <div class="page-container">
    <section class="content-section">
      <div class="form-card">
        <span class="eyebrow">{{ t('tag.activateEyebrow') }}</span>
        <h1 class="section-title">{{ t('tag.activateTitle') }}</h1>
        <form @submit.prevent="submitActivation">
          <label class="field-label">
            UID
            <input v-model="form.uid" type="text" readonly />
          </label>
          <label class="field-label">
            {{ t('tag.activationCode') }}
            <input :value="activationCode" type="text" readonly />
          </label>
          <button class="solid-button" type="submit" :disabled="isLoading">
            {{ isLoading ? t('common.submitting') : t('tag.activateAction') }}
          </button>
        </form>
        <p class="form-note">{{ t('tag.activateHint') }}</p>
        <p v-if="errorMessage" class="alert-box alert-error">{{ errorMessage }}</p>
        <p v-if="successMessage" class="alert-box alert-success">{{ successMessage }}</p>
      </div>
    </section>
  </div>
</template>
