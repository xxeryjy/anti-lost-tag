<script setup lang="ts">
const { t } = useI18n()
</script>

<template>
  <footer class="site-footer">
    <div class="site-footer-bar">
      <span>{{ t('footer.copy') }}</span>
      <span>{{ t('footer.localMode') }}</span>
    </div>
  </footer>
</template>
