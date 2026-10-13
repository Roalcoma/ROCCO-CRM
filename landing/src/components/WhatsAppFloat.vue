<script setup lang="ts">
import { waLink } from '../config';
import ChannelIcon from './ChannelIcon.vue';
</script>

<template>
  <a :href="waLink('Hola Árbol Áureo, me interesa saber más sobre Rocco CRM')" target="_blank" rel="noopener"
     class="group fixed bottom-5 right-5 z-40 flex items-center gap-2 h-14 pl-4 pr-4 rounded-full text-white bg-[#25D366] shadow-[0_10px_30px_-5px_rgba(37,211,102,.55)] transition-transform hover:-translate-y-0.5"
     aria-label="Escríbenos por WhatsApp">
    <span class="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-20 pointer-events-none" />
    <ChannelIcon name="whatsapp" class="relative w-6 h-6" />
    <span class="relative max-w-0 overflow-hidden whitespace-nowrap text-sm font-semibold transition-all duration-300 group-hover:max-w-40">Escríbenos</span>
  </a>
</template>
