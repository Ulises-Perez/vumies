<template>
  <!-- Placeholder para vistas de detalle (película/serie): replica el hero backdrop
       above-the-fold para mantener estable el LCP y el layout mientras carga. -->
  <div class="min-h-screen pb-20">
    <div class="relative h-[85vh] w-full overflow-hidden">
      <div class="absolute inset-0 skeleton"></div>
      <div class="absolute inset-0 bg-gradient-to-t from-dark via-dark/40 to-transparent" />
      <div class="absolute inset-0 bg-gradient-to-r from-dark via-dark/60 to-transparent" />

      <div class="absolute inset-0 flex items-end pb-20">
        <div class="px-4 md:px-12 w-full">
          <div class="max-w-3xl space-y-6">
            <div class="h-14 md:h-16 w-2/3 rounded-lg skeleton"></div>
            <div class="h-4 w-60 rounded skeleton"></div>
            <div class="h-4 w-44 rounded skeleton"></div>
            <div class="flex gap-4 pt-4">
              <div class="h-12 w-44 rounded-lg skeleton"></div>
              <div class="h-12 w-44 rounded-lg skeleton"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bloque de contenido inferior (sinopsis + sidebar) -->
    <div class="relative z-10 px-4 md:px-12 -mt-10">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div class="lg:col-span-2 space-y-4">
          <div class="h-6 w-40 rounded skeleton"></div>
          <div class="h-4 w-full rounded skeleton"></div>
          <div class="h-4 w-full rounded skeleton"></div>
          <div class="h-4 w-4/5 rounded skeleton"></div>
        </div>
        <div class="space-y-4">
          <div class="h-40 w-full rounded-2xl skeleton"></div>
        </div>
      </div>
    </div>
  </div>
</template>
