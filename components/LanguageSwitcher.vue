<script setup lang="ts">
const { locale, locales } = useI18n()
const switchLocalePath = useSwitchLocalePath()

const localeLabels: Record<string, string> = {
  'zh-CN': '中',
  en: 'EN',
  ja: '日'
}
</script>

<template>
  <div class="pill-row">
    <NuxtLink
      v-for="item in locales"
      :key="item.code"
      class="pill language-pill"
      :class="{ 'is-active': item.code === locale }"
      :to="switchLocalePath(item.code)"
    >
      {{ localeLabels[item.code] || item.name }}
    </NuxtLink>
  </div>
</template>
