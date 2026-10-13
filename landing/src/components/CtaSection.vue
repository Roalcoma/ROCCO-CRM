<script setup lang="ts">
import { CRM_URL, waLink } from '../config';
import Icon from './Icon.vue';
import ChannelIcon from './ChannelIcon.vue';
</script>

<template>
  <section class="px-5 pb-24 lg:pb-32 bg-paper">
    <div v-reveal class="relative max-w-7xl mx-auto bg-ink-glow rounded-md overflow-hidden px-6 py-16 md:px-16 md:py-24 text-center">
      <div class="absolute inset-0 grid-lines pointer-events-none" />
      <img src="/arbol-aureo.svg" alt="" class="relative w-14 h-14 mx-auto mb-8 rounded-md ring-1 ring-gold/30" />
      <h2 class="relative font-display text-4xl md:text-6xl text-white leading-[1.05] tracking-tight max-w-3xl mx-auto">
        Planta hoy. <em class="text-gold-grad">Cosecha esta misma semana.</em>
      </h2>
      <p class="relative text-white/60 text-lg mt-6 max-w-xl mx-auto leading-relaxed">
        Prueba Rocco CRM 7 días gratis, sin tarjeta. O cuéntanos de tu negocio y lo armamos juntos.
      </p>
      <div class="relative mt-10 flex flex-col sm:flex-row gap-3 justify-center">
        <a :href="`${CRM_URL}/login`" class="btn btn-rocco">Probar Rocco gratis <Icon name="arrowRight" class="w-4 h-4" /></a>
        <a :href="waLink('Hola Árbol Áureo, quiero hablar sobre mi negocio')" target="_blank" rel="noopener" class="btn btn-ghost">
          <ChannelIcon name="whatsapp" class="w-4 h-4" /> Hablar con Árbol Áureo
        </a>
      </div>
    </div>
  </section>
</template>
