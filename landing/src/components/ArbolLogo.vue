<script setup lang="ts">
defineProps<{ dark?: boolean }>();
</script>

<template>
  <span class="inline-flex items-center gap-2.5">
    <img src="/arbol-aureo.svg" alt="" class="w-9 h-9 rounded-md" width="36" height="36" />
    <span class="leading-none">
      <span class="block font-display text-[1.2rem] font-semibold tracking-tight" :class="dark ? 'text-ink' : 'text-white'">
        Árbol <span class="text-gold">Áureo</span>
      </span>
      <span class="hidden sm:block text-[10px] uppercase tracking-[.22em] mt-1" :class="dark ? 'text-ink/50' : 'text-white/45'">
        Tecnología que da frutos
      </span>
    </span>
  </span>
</template>
