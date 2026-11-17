<template>
  <BaseContainer class="pb-20 pt-[var(--chrome-top)]">
    <p class="sr-only" aria-live="polite">{{ announcement }}</p>

    <header class="flex flex-wrap items-start justify-between gap-4 pb-8 pt-8">
      <h1 class="font-poppins text-3xl font-bold tracking-tight text-foreground md:text-4xl">
        Recientes
      </h1>
      <BaseButton
        v-if="hasHistory"
        variant="ghost"
        size="sm"
        class="text-destructive hover:bg-destructive/10 hover:text-destructive"
        @click="clearHistory"
      >
        Borrar todo
      </BaseButton>
    </header>

    <StorageErrorBanner />

    <section
      v-if="!hasHistory"
      class="flex flex-col items-center rounded-2xl border border-dashed border-border px-6 py-24 text-center"
    >
      <div class="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <ClockIcon class="h-6 w-6 text-muted-foreground" />
      </div>
      <h2 class="mt-5 text-lg font-semibold text-foreground">Todavía no viste nada</h2>
      <p class="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
        Lo que reproduzcas aparecerá aquí, con lo más reciente arriba.
      </p>
      <BaseButton to="/" data-hist-empty class="mt-6">Explorar catálogo</BaseButton>
    </section>

    <!-- Lo último primero: la tarjeta grande es lo último que se reprodujo. -->
    <template v-else>
      <MediaCard
        v-if="latest"
        :to="detailTo(latest)"
        :title="latest.title"
        :meta="metaOf(latest)"
        :backdrop="latest.backdrop_path"
        :poster="latest.poster_path"
        :remove-label="removeLabel(latest)"
        remove-icon="x"
        lead
        @remove="removeItem(latest)"
      />

      <div
        v-if="rest.length"
        class="mt-4 grid gap-4 sm:grid-cols-2 md:mt-6 lg:grid-cols-3 xl:grid-cols-4"
      >
        <MediaCard
          v-for="item in rest"
          :key="`${item.id}-${item.type}`"
          :to="detailTo(item)"
          :title="item.title"
          :meta="metaOf(item)"
          :backdrop="item.backdrop_path"
          :poster="item.poster_path"
          :remove-label="removeLabel(item)"
          remove-icon="x"
          @remove="removeItem(item)"
        />
      </div>
    </template>
  </BaseContainer>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { ClockIcon } from '@heroicons/vue/24/outline'
import { useUserStore, type WatchHistoryItem } from '../stores/user.store'
import { relativeTime } from '../utils/relative-time'
import { BaseButton, BaseContainer } from '@/modules/ui/components/base'
import MediaCard from '../components/MediaCard.vue'
import StorageErrorBanner from '../components/StorageErrorBanner.vue'

const userStore = useUserStore()
const history = computed(() => userStore.watchHistory)
const hasHistory = computed(() => userStore.hasHistory)
const latest = computed(() => history.value[0] ?? null)
const rest = computed(() => history.value.slice(1))

function metaOf(item: WatchHistoryItem) {
  const kind =
    item.kind === 'anime'
      ? 'Anime'
      : item.type === 'tv'
        ? item.season && item.episode
          ? `Serie T${item.season} E${item.episode}`
          : 'Serie'
        : 'Película'
  return `${kind} · visto ${relativeTime(item.watchedAt)}`
}

function removeLabel(item: WatchHistoryItem) {
  return `Quitar ${item.title} del historial`
}

function detailTo(item: WatchHistoryItem) {
  return {
    name: item.type === 'movie' ? 'movie-detail' : 'serie-detail',
    params: { id: item.id },
  }
}

const announcement = ref('')

// Historial guardado antes de que existiera backdrop_path: se rellena solo.
onMounted(() => void userStore.backfillBackdrops())

/** La tarjeta desaparece con su botón: devolvemos el foco a la siguiente, o al estado vacío. */
async function removeItem(item: WatchHistoryItem) {
  const index = history.value.findIndex((h) => h.id === item.id && h.type === item.type)
  userStore.removeFromHistory(item.id, item.type)
  announcement.value = `Quitado del historial: ${item.title}`
  await nextTick()
  const links = document.querySelectorAll<HTMLElement>('[data-media-link]')
  const next =
    links[Math.min(index, links.length - 1)] ?? document.querySelector<HTMLElement>('[data-hist-empty]')
  next?.focus()
}

async function clearHistory() {
  if (!confirm('¿Estás seguro de que quieres borrar todo tu historial?')) return
  userStore.clearHistory()
  announcement.value = 'Historial borrado'
  await nextTick()
  document.querySelector<HTMLElement>('[data-hist-empty]')?.focus()
}
</script>
