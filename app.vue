<script setup lang="ts">
const route = useRoute()

const isHomePage = computed(() => {
  const normalizedPath = route.path.replace(/\/+$/, '') || '/'
  return normalizedPath === '/' || normalizedPath === '/en' || normalizedPath === '/ja'
})
</script>

<template>
  <NuxtLayout v-if="!isHomePage">
    <NuxtPage />
  </NuxtLayout>
  <NuxtPage v-else />
</template>
