<script setup lang="ts">
import { waLink } from '../config';
import Icon from './Icon.vue';
import ChannelIcon from './ChannelIcon.vue';
import RoccoMockup from './RoccoMockup.vue';
</script>

<template>
  <section id="top" class="relative bg-ink-glow overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-28">
    <div class="absolute inset-0 grid-lines pointer-events-none" />

    <div class="relative max-w-7xl mx-auto px-5 grid lg:grid-cols-[1.05fr_1fr] gap-14 lg:gap-10 items-center">
      <div>
        <p v-reveal class="eyebrow text-gold mb-6">Agencia de tecnología y automatización</p>

        <h1 v-reveal="80" class="font-display text-[2.6rem] leading-[1.05] sm:text-6xl lg:text-[4.2rem] text-white tracking-tight">
          Sembramos tecnología.<br />
          <em class="text-gold-grad not-italic sm:italic">Tu negocio cosecha ventas.</em>
        </h1>

        <p v-reveal="160" class="mt-6 text-lg text-white/65 max-w-xl leading-relaxed">
          En <strong class="text-white font-semibold">Árbol Áureo</strong> creamos herramientas y automatizaciones para negocios
          que venden por WhatsApp, Instagram y Facebook. Nuestro fruto más reciente:
          <strong class="text-rocco font-semibold">Rocco CRM</strong>.
        </p>

        <div v-reveal="240" class="mt-9 flex flex-col sm:flex-row gap-3">
          <a href="#rocco" class="btn btn-gold">
            Conoce Rocco CRM <Icon name="arrowRight" class="w-4 h-4" />
          </a>
          <a :href="waLink('Hola Árbol Áureo, quiero agendar una llamada')" target="_blank" rel="noopener" class="btn btn-ghost">
            <ChannelIcon name="whatsapp" class="w-4 h-4" /> Agenda una llamada
          </a>
        </div>

        <ul v-reveal="320" class="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/50">
          <li v-for="t in ['Hecho en Venezuela', 'Soporte en español', 'Implementación acompañada']" :key="t" class="flex items-center gap-2">
            <Icon name="check" class="w-4 h-4 text-gold" /> {{ t }}
          </li>
        </ul>
      </div>

      <div v-reveal="200" class="lg:pl-6">
        <RoccoMockup />
      </div>
    </div>
  </section>
</template>
