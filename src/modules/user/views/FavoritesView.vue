<template>
  <BaseContainer class="pb-20 pt-[var(--chrome-top)]">
    <p class="sr-only" aria-live="polite">{{ announcement }}</p>

    <header class="pb-8 pt-8">
      <h1 class="font-poppins text-3xl font-bold tracking-tight text-foreground md:text-4xl">
        Favoritos
      </h1>
    </header>

    <StorageErrorBanner />

    <!-- Estado vacío: enseña el gesto que llena la vista. -->
    <section
      v-if="!hasFavorites"
      class="flex flex-col items-center rounded-2xl border border-dashed border-border px-6 py-24 text-center"
    >
      <div class="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <HeartIcon class="h-6 w-6 text-muted-foreground" />
      </div>
      <h2 class="mt-5 text-lg font-semibold text-foreground">Todavía no guardaste nada</h2>
      <p class="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
        Toca el corazón en cualquier película o serie y aparecerá aquí, con lo más reciente
        arriba.
      </p>
      <BaseButton to="/" data-fav-empty class="mt-6">Explorar catálogo</BaseButton>
    </section>

    <!-- Lo último primero: la tarjeta grande es el favorito más reciente. -->
    <template v-else>
      <MediaCard
        v-if="latest"
        :to="detailTo(latest)"
        :title="latest.title"
        :meta="metaOf(latest)"
        :backdrop="latest.backdrop_path"
        :poster="latest.poster_path"
        :remove-label="removeLabel(latest)"
        remove-icon="heart"
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
          remove-icon="heart"
          @remove="removeItem(item)"
        />
      </div>
    </template>
  </BaseContainer>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { HeartIcon } from '@heroicons/vue/24/outline'
import { useUserStore, type FavoriteItem } from '../stores/user.store'
import { relativeTime } from '../utils/relative-time'
import { BaseButton, BaseContainer } from '@/modules/ui/components/base'
import MediaCard from '../components/MediaCard.vue'
import StorageErrorBanner from '../components/StorageErrorBanner.vue'

const userStore = useUserStore()
const favorites = computed(() => userStore.favorites)
const hasFavorites = computed(() => userStore.hasFavorites)
const latest = computed(() => favorites.value[0] ?? null)
const rest = computed(() => favorites.value.slice(1))

function metaOf(item: FavoriteItem) {
  const kind = item.type === 'movie' ? 'Película' : 'Serie'
  return `${kind} · guardado ${relativeTime(item.addedAt)}`
}

function removeLabel(item: FavoriteItem) {
  return `Quitar ${item.title} de favoritos`
}

function detailTo(item: FavoriteItem) {
  return {
    name: item.type === 'movie' ? 'movie-detail' : 'serie-detail',
    params: { id: item.id },
  }
}

const announcement = ref('')

// Favoritos guardados antes de que existiera backdrop_path: se rellenan solos.
onMounted(() => void userStore.backfillBackdrops())

/** La tarjeta desaparece con su botón: devolvemos el foco a la siguiente, o al estado vacío. */
async function removeItem(item: FavoriteItem) {
  const index = favorites.value.findIndex((f) => f.id === item.id && f.type === item.type)
  userStore.removeFromFavorites(item.id, item.type)
  announcement.value = `Quitado de favoritos: ${item.title}`
  await nextTick()
  const links = document.querySelectorAll<HTMLElement>('[data-media-link]')
  const next =
    links[Math.min(index, links.length - 1)] ?? document.querySelector<HTMLElement>('[data-fav-empty]')
  next?.focus()
}
</script>
