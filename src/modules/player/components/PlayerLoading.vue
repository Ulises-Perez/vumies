<template>
  <div class="absolute inset-0 z-30 overflow-hidden bg-black">
    <!-- Backdrop de la peli/serie -->
    <div class="absolute inset-0">
      <img
        v-if="backdrop"
        :src="backdrop"
        alt=""
        class="h-full w-full object-cover opacity-70 animate-[kenburns_24s_ease-in-out_infinite_alternate]"
      />
      <!-- Degradados: viñeta + base oscura para legibilidad -->
      <div class="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/30"></div>
      <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(0,0,0,0.7)_100%)]"></div>
    </div>

    <!-- Logo / título centrado -->
    <div class="absolute inset-0 flex items-center justify-center px-8">
      <img
        v-if="logo"
        :src="logo"
        :alt="title"
        class="max-h-[40%] max-w-[70%] object-contain drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)] animate-[fadein_0.8s_ease-out]"
      />
      <h1
        v-else
        class="max-w-3xl text-center font-poppins text-5xl font-extrabold text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)] sm:text-6xl md:text-7xl"
      >
        {{ title || 'Reproduciendo' }}
      </h1>
    </div>

    <!-- Estado abajo a la izquierda -->
    <div class="absolute bottom-0 left-0 p-8 sm:p-10">
      <div class="mb-2 flex items-center gap-2 text-primary">
        <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
        <span class="text-[11px] font-semibold uppercase tracking-[0.25em] text-primary/90">Vumies</span>
      </div>

      <div v-if="subtitle" class="mb-2 text-sm font-medium text-white/70">{{ subtitle }}</div>

      <div class="flex items-center gap-3">
        <span class="relative flex h-2.5 w-2.5">
          <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
          <span class="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary"></span>
        </span>
        <span class="text-base font-semibold text-white">{{ status || 'Cargando…' }}</span>
      </div>

      <div class="mt-3 h-1 w-56 overflow-hidden rounded-full bg-white/15">
        <div class="h-full w-1/3 rounded-full bg-primary animate-[loadingbar_1.6s_ease-in-out_infinite]"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  backdrop?: string | null
  logo?: string | null
  title?: string
  subtitle?: string
  status?: string
}>()
</script>

<style scoped>
@keyframes kenburns {
  from { transform: scale(1.04) translate(0, 0); }
  to { transform: scale(1.12) translate(-1.5%, -1.5%); }
}
@keyframes loadingbar {
  0% { transform: translateX(-120%); }
  100% { transform: translateX(360%); }
}
@keyframes fadein {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
