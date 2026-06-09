<script setup lang="ts">
const route = useRoute()
const { t } = useI18n()
const { findTagByUid } = useSmartTagDemo()
const currentTag = findTagByUid(String(route.params.uid))

const form = reactive({
  category: currentTag?.profile?.category || 'PET',
  displayName: currentTag?.profile?.displayName || '',
  customLabel: currentTag?.profile?.customLabel || '',
  breed: currentTag?.profile?.breed || '',
  ownerPhone: currentTag?.profile?.ownerPhone || '',
  notificationEmail: currentTag?.profile?.notificationEmail || '',
  privacyMode: currentTag?.profile?.privacyMode || false,
  medicalNote: currentTag?.profile?.medicalNote || ''
})
</script>

<template>
  <div class="page-container">
    <section class="content-section">
      <div class="form-card">
        <span class="eyebrow">{{ t('tag.editEyebrow') }}</span>
        <h1 class="section-title">{{ t('tag.editTitle') }}</h1>
        <div class="form-grid two-columns">
          <label class="field-label">
            {{ t('tag.category') }}
            <select v-model="form.category">
              <option value="PET">PET</option>
              <option value="ITEM">ITEM</option>
            </select>
          </label>
          <label class="field-label">
            {{ t('tag.displayName') }}
            <input v-model="form.displayName" type="text" />
          </label>
          <label class="field-label">
            {{ t('tag.customLabel') }}
            <input v-model="form.customLabel" type="text" />
          </label>
          <label class="field-label">
            {{ t('tag.breed') }}
            <input v-model="form.breed" type="text" />
          </label>
          <label class="field-label">
            {{ t('tag.ownerPhone') }}
            <input v-model="form.ownerPhone" type="text" />
          </label>
          <label class="field-label">
            {{ t('tag.notificationEmail') }}
            <input v-model="form.notificationEmail" type="email" />
          </label>
        </div>
        <label class="field-label">
          {{ t('tag.medicalNote') }}
          <textarea v-model="form.medicalNote" />
        </label>
        <div class="inline-actions">
          <span class="status-chip">{{ t('tag.privacyMode') }}: {{ form.privacyMode ? 'ON' : 'OFF' }}</span>
          <button class="solid-button" type="button">{{ t('common.saveDraft') }}</button>
        </div>
      </div>
    </section>
  </div>
</template>
