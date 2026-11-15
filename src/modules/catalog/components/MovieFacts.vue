<template>
  <!-- Real facts only: every row renders from TMDB data passed by the parent.
       Missing fields omit their row entirely, never a placeholder. -->
  <dl v-if="hasFacts" class="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4 sm:gap-x-8 content-start">
    <div v-if="directors" class="min-w-0">
      <dt class="type-label text-muted-foreground">Director</dt>
      <dd class="text-sm md:text-base text-foreground break-words">{{ directors }}</dd>
    </div>
    <div v-if="writers" class="min-w-0">
      <dt class="type-label text-muted-foreground">Guión</dt>
      <dd class="text-sm md:text-base text-foreground break-words">{{ writers }}</dd>
    </div>
    <div v-if="studio" class="min-w-0">
      <dt class="type-label text-muted-foreground">Estudio</dt>
      <dd class="text-sm md:text-base text-foreground break-words">{{ studio }}</dd>
    </div>
    <div v-if="statusEs" class="min-w-0">
      <dt class="type-label text-muted-foreground">Estado</dt>
      <dd class="text-sm md:text-base text-foreground break-words">{{ statusEs }}</dd>
    </div>
    <div v-if="showOriginalTitle" class="min-w-0">
      <dt class="type-label text-muted-foreground">Título original</dt>
      <dd class="text-sm md:text-base text-foreground break-words">{{ originalTitle }}</dd>
    </div>
    <div v-if="languageEs" class="min-w-0">
      <dt class="type-label text-muted-foreground">Idioma original</dt>
      <dd class="text-sm md:text-base text-foreground break-words">{{ languageEs }}</dd>
    </div>
    <div v-if="voteCount > 0" class="min-w-0">
      <dt class="type-label text-muted-foreground">Votos</dt>
      <dd class="text-sm md:text-base text-foreground break-words">{{ formattedVotes }}</dd>
    </div>
  </dl>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    /** Joined director names, '' when unknown. */
    directors?: string
    /** Joined writer names, '' when unknown. */
    writers?: string
    /** Studio name, '' when unknown. */
    studio?: string
    /** Raw TMDB status, '' when unknown. */
    status?: string
    /** Local title, used to hide a redundant original title. */
    title?: string
    /** Raw TMDB original title, '' when unknown. */
    originalTitle?: string
    /** Raw TMDB language code, '' when unknown. */
    originalLanguage?: string
    /** Raw TMDB vote count, 0 when unknown. */
    voteCount?: number
  }>(),
  {
    directors: '',
    writers: '',
    studio: '',
    status: '',
    title: '',
    originalTitle: '',
    originalLanguage: '',
    voteCount: 0,
  }
)

// TMDB enum to Spanish: unknown values omit the row, never print raw.
const STATUS_ES: Record<string, string> = {
  Released: 'Estrenada',
  'In Production': 'En producción',
  'Post Production': 'Postproducción',
  Planned: 'Anunciada',
  Canceled: 'Cancelada',
  Rumored: 'Rumoreada',
}

const statusEs = computed(() => STATUS_ES[props.status] ?? '')

// Spanish language name: unresolvable codes omit the row, never a bare ISO code.
const languageEs = computed(() => {
  if (!props.originalLanguage) return ''
  const code = props.originalLanguage.toLowerCase()
  try {
    const label = new Intl.DisplayNames(['es'], { type: 'language' }).of(code)
    if (!label || label.toLowerCase() === code) return ''
    return label.charAt(0).toUpperCase() + label.slice(1)
  } catch {
    return ''
  }
})

// The original title only adds signal when it differs from the local title.
const showOriginalTitle = computed(
  () => !!props.originalTitle && props.originalTitle !== props.title
)

const formattedVotes = computed(() => props.voteCount.toLocaleString('es-MX'))

const hasFacts = computed(
  () =>
    !!props.directors ||
    !!props.writers ||
    !!props.studio ||
    !!statusEs.value ||
    showOriginalTitle.value ||
    !!languageEs.value ||
    props.voteCount > 0
)
</script>
