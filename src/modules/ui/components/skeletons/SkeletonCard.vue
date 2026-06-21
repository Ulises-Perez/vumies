<template>
  <!-- Réplica de MovieCard/TVShowCard: figura aspect-poster + línea de título.
       Mismas dimensiones que la card real => al intercambiar no hay layout shift. -->
  <div>
    <div class="aspect-poster rounded-xl skeleton"></div>
    <div class="mt-3 h-4 w-3/4 rounded skeleton"></div>
  </div>
</template>
