<script setup lang="ts">
import heroImage from '~/assets/images/Dog_running@2x.png'
import logoImage from '~/assets/images/logo.png'
import logoNavImage from '~/assets/images/logo_nav.png'
import valueImageOne from '~/assets/images/Mask_group1.png'
import valueImageTwo from '~/assets/images/Mask_group2.png'
import valueImageThree from '~/assets/images/Mask_group3.png'

definePageMeta({
  layout: false
})

const localePath = useLocalePath()
const switchLocalePath = useSwitchLocalePath()
const { t, locale, locales } = useI18n()

const isMobileMenuOpen = ref(false)
const isNavDocked = ref(false)

const navLinks = computed(() => [
  {
    label: t('home.navManifesto'),
    href: '#manifesto'
  },
  {
    label: t('home.navMission'),
    href: '#mission'
  },
  {
    label: t('home.navValues'),
    href: '#values'
  }
])

const valueItems = computed(() => [
  {
    title: t('home.valueOneTitle'),
    copy: t('home.valueOneCopy'),
    image: valueImageOne
  },
  {
    title: t('home.valueTwoTitle'),
    copy: t('home.valueTwoCopy'),
    image: valueImageTwo
  },
  {
    title: t('home.valueThreeTitle'),
    copy: t('home.valueThreeCopy'),
    image: valueImageThree
  }
])

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

const currentLocaleLabel = computed(() => {
  const matched = localeItems.value.find((item) => item.code === locale.value)
  return matched?.code.toUpperCase() || locale.value.toUpperCase()
})

const currentNavLogo = computed(() => logoImage)

function closeMobileMenu() {
  isMobileMenuOpen.value = false
}

function updateNavDockedState() {
  isNavDocked.value = window.scrollY > 72
}

onMounted(() => {
  updateNavDockedState()
  window.addEventListener('scroll', updateNavDockedState, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', updateNavDockedState)
})

useHead(() => ({
  title: `${t('brand.name')} | ${t('home.heroTitle')}`,
  meta: [
    {
      name: 'description',
      content: t('home.heroSubtitle')
    }
  ]
}))
</script>

<template>
  <div class="home-page home-page-redesign" :class="`locale-${locale}`">
    <section class="home-hero">
      <img :src="heroImage" :alt="t('home.heroImageAlt')" class="home-hero-image">
      <div class="home-hero-overlay" />

      <header class="home-nav" :class="{ 'is-docked': isNavDocked }">
        <div class="page-frame home-nav-inner">
          <NuxtLink :to="localePath('/')" class="brand-mark home-brand">
            <img :src="currentNavLogo" :alt="t('brand.logoAlt')" class="home-brand-logo">
          </NuxtLink>

          <nav class="home-nav-links" aria-label="Homepage sections">
            <a
              v-for="link in navLinks"
              :key="link.href"
              class="home-nav-link"
              :href="link.href"
            >
              {{ link.label }}
            </a>
          </nav>

          <div class="home-nav-tools">
            <details class="home-locale-switcher">
              <summary class="home-locale-trigger">
                <span>{{ currentLocaleLabel }}</span>
                <span class="home-locale-caret">+</span>
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

            <button
              type="button"
              class="home-nav-toggle"
              :aria-expanded="isMobileMenuOpen ? 'true' : 'false'"
              aria-controls="home-mobile-nav"
              @click="isMobileMenuOpen = !isMobileMenuOpen"
            >
              <span />
              <span />
            </button>
          </div>
        </div>

        <div
          v-show="isMobileMenuOpen"
          id="home-mobile-nav"
          class="page-frame home-mobile-nav"
        >
          <a
            v-for="link in navLinks"
            :key="`mobile-${link.href}`"
            class="home-mobile-link"
            :href="link.href"
            @click="closeMobileMenu"
          >
            {{ link.label }}
          </a>

          <div class="home-mobile-divider" />

          <NuxtLink
            v-for="item in localeItems"
            :key="`locale-${item.code}`"
            class="home-mobile-link home-mobile-locale"
            :class="{ 'is-active': item.code === locale }"
            :to="item.path"
            @click="closeMobileMenu"
          >
            {{ item.name }}
          </NuxtLink>

          <NuxtLink
            class="home-mobile-cta"
            :to="localePath('/')"
            @click="closeMobileMenu"
          >
            {{ t('home.heroTitle') }}
          </NuxtLink>
        </div>
      </header>

      <div class="page-frame home-hero-content">
        <div class="home-hero-copy-block home-reveal home-reveal-delay-2">
          <h1 class="home-hero-title">{{ t('home.heroTitle') }}</h1>
          <p class="home-hero-subtitle">{{ t('home.heroSubtitle') }}</p>
        </div>
      </div>

      <a href="#manifesto" class="hero-scroll-indicator" :aria-label="t('home.scrollLabel')">
        <span>{{ t('home.scrollCue') }}</span>
        <strong>+</strong>
      </a>
    </section>

    <main class="page-frame home-main">
      <section id="manifesto" class="home-section home-manifesto">
        <div class="home-section-intro home-reveal home-reveal-delay-1">
          <span class="eyebrow">{{ t('home.manifestoEyebrow') }}</span>
          <h2 class="section-display-title">{{ t('home.manifestoTitle') }}</h2>
        </div>

        <div class="home-manifesto-body home-reveal home-reveal-delay-2">
          <p class="section-copy home-copy-lg">{{ t('home.manifestoBodyOne') }}</p>
          <p class="section-copy">{{ t('home.manifestoBodyTwo') }}</p>
          <p class="section-copy">{{ t('home.manifestoBodyThree') }}</p>
        </div>
      </section>

      <section class="home-section home-story-video">
        <article class="home-video-card home-reveal home-reveal-delay-2">
          <div class="home-video-cover">
            <img :src="heroImage" :alt="t('home.heroImageAlt')" class="home-video-image">
            <button type="button" class="home-video-play" aria-label="Play story video">
              <span class="home-video-play-icon">+</span>
            </button>
          </div>
          <p class="home-video-meta">{{ t('home.manifestoQuote') }}</p>
        </article>
      </section>

      <section id="mission" class="home-section home-mission-values">
        <div class="home-mission-heading home-reveal home-reveal-delay-1">
          <span class="home-section-tag">{{ t('home.missionEyebrow') }}</span>
        </div>

        <div class="home-mission-grid home-reveal home-reveal-delay-1">
          <article class="home-mission-card home-mission-card-primary">
            <span class="home-mission-card-number" aria-hidden="true">01</span>
            <div>
              <span class="home-mission-card-label">{{ t('home.missionTitle') }}</span>
              <h2 class="section-display-title">{{ t('home.missionCopy') }}</h2>
            </div>
          </article>

          <article class="home-mission-card">
            <span class="home-mission-card-number" aria-hidden="true">02</span>
            <div class="home-mission-card-body">
              <span class="home-mission-card-label">{{ t('home.visionTitle') }}</span>
              <p class="section-copy home-copy-lg">{{ t('home.visionCopy') }}</p>
            </div>
            <ul class="home-vision-list">
              <li>{{ t('home.visionPointOne') }}</li>
              <li>{{ t('home.visionPointTwo') }}</li>
              <li>{{ t('home.visionPointThree') }}</li>
            </ul>
          </article>
        </div>

        <div id="values" class="home-values-panel home-reveal home-reveal-delay-2">
          <div class="home-values-heading">
            <span class="home-section-tag">{{ t('home.valuesEyebrow') }}</span>
          </div>

          <div class="home-values-list">
            <article
              v-for="(item, index) in valueItems"
              :key="item.title"
              class="home-value-item"
            >
              <figure class="home-value-media">
                <img :src="item.image" :alt="item.title" class="home-value-image">
                <span class="home-value-index" aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</span>
              </figure>
              <div class="home-value-content">
                <h3 class="home-value-title">{{ item.title }}</h3>
                <p class="section-copy">{{ item.copy }}</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section class="home-section home-our-story">
        <div class="home-story-card home-reveal home-reveal-delay-1">
          <div class="home-story-heading">
            <span class="home-section-tag">{{ t('home.storyEyebrow') }}</span>
            <h2 class="section-display-title">{{ t('home.storyTitle') }}</h2>
          </div>

          <div class="home-story-body">
            <p class="section-copy home-copy-lg">{{ t('home.storyBodyOne') }}</p>
            <p class="section-copy">{{ t('home.storyBodyTwo') }}</p>
            <p class="home-story-closing">{{ t('home.storyBodyThree') }}</p>
          </div>
        </div>
      </section>
    </main>

    <footer class="home-footer">
      <div class="page-frame home-footer-inner">
        <div class="home-footer-main">
          <div class="home-footer-brand home-reveal home-reveal-delay-1">
            <span class="brand-mark home-footer-mark">
              <img :src="logoImage" :alt="t('brand.logoAlt')" class="home-footer-logo">
            </span>
            <p class="home-footer-copy">{{ t('footer.copy') }}</p>
          </div>

          <nav class="home-footer-nav home-reveal home-reveal-delay-2" aria-label="Footer sections">
            <a
              v-for="link in navLinks"
              :key="`footer-${link.href}`"
              :href="link.href"
            >
              {{ link.label }}
            </a>
          </nav>

          <div class="home-footer-contact home-reveal home-reveal-delay-2">
            <a class="home-footer-email" :href="`mailto:${t('footer.email')}`">
              <span class="home-footer-email-icon" aria-hidden="true">@</span>
              <span class="home-footer-email-text">
                <span class="home-footer-email-label">{{ t('footer.emailLabel') }}</span>
                <strong>{{ t('footer.email') }}</strong>
              </span>
            </a>
          </div>
        </div>

        <div class="home-footer-meta">
          <span>{{ t('footer.copyright') }}</span>
        </div>
      </div>
    </footer>
  </div>
</template>
