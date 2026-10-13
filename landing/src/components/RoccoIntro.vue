<script setup lang="ts">
import { CRM_URL } from '../config';
import Icon from './Icon.vue';
import ChannelIcon, { type BrandName } from './ChannelIcon.vue';

const pains = [
  { before: 'Cinco apps abiertas y no sabes a quién respondiste.', after: 'Un solo inbox con WhatsApp, Instagram y Facebook.' },
  { before: 'El seguimiento del jueves se te olvidó y la venta se enfrió.', after: 'Tareas con fecha y automatizaciones que recuerdan por ti.' },
  { before: '¿Quién pagó? ¿Quién sigue interesado? Todo está en tu cabeza.', after: 'Un pipeline visual con cada oportunidad y su valor.' },
];

const channels: { name: BrandName; label: string; bg: string }[] = [
  { name: 'whatsapp',  label: 'WhatsApp',        bg: '#25D366' },
  { name: 'instagram', label: 'Instagram',       bg: 'linear-gradient(135deg,#FEDA75,#D62976,#962FBF)' },
  { name: 'facebook',  label: 'Messenger',       bg: '#1877F2' },
  { name: 'google',    label: 'Google Calendar', bg: '#4285F4' },
];
</script>

<template>
  <section id="rocco" class="relative py-24 lg:py-32 bg-cream scroll-mt-16 overflow-hidden">
    <div class="absolute -right-40 top-0 w-[36rem] h-[36rem] rounded-full bg-rocco/10 blur-3xl pointer-events-none" />

    <div class="relative max-w-7xl mx-auto px-5">
      <img src="/rocco-mark.png" alt="" aria-hidden="true" width="230" height="285"
           class="hidden lg:block absolute right-16 top-2 w-56 xl:w-64 float drop-shadow-[0_30px_40px_rgba(217,119,6,.35)]" />
      <div class="relative max-w-3xl">
        <div v-reveal class="flex items-center gap-3 mb-6">
          <img src="/rocco-logo.png" alt="Rocco" class="h-9 w-auto" width="101" height="36" />
          <span class="text-xs font-semibold uppercase tracking-[.16em] text-ink/45 border-l border-ink/15 pl-3">Un producto de Árbol Áureo</span>
        </div>
        <h2 v-reveal="80" class="font-rocco font-extrabold text-4xl md:text-6xl text-ink leading-[1.02] tracking-tight">
          El CRM para negocios que venden <span class="text-rocco">por chat.</span>
        </h2>
        <p v-reveal="160" class="mt-6 text-lg text-ink/65 leading-relaxed max-w-2xl">
          Rocco junta tus conversaciones, tus clientes, tus citas y tus ventas en un solo lugar,
          y hace los seguimientos que a ti se te olvidan. Simple para el dueño, potente para el equipo.
        </p>
        <div v-reveal="220" class="mt-8 flex flex-wrap gap-3">
          <a :href="`${CRM_URL}/login`" class="btn btn-rocco">Pruébalo 7 días gratis <Icon name="arrowRight" class="w-4 h-4" /></a>
          <a href="#funciones" class="btn btn-line">Ver funciones</a>
        </div>
      </div>

      <!-- Antes / después -->
      <div class="mt-16 grid md:grid-cols-3 gap-4">
        <div v-for="(p, i) in pains" :key="i" v-reveal="i * 100"
             class="bg-white rounded-md border border-ink/8 overflow-hidden">
          <div class="p-6 border-b border-dashed border-ink/10">
            <p class="text-[11px] font-semibold uppercase tracking-wider text-red-500/80 mb-2">Sin Rocco</p>
            <p class="text-ink/55 leading-relaxed line-through decoration-red-400/40">{{ p.before }}</p>
          </div>
          <div class="p-6 bg-rocco-soft/40">
            <p class="text-[11px] font-semibold uppercase tracking-wider text-rocco-dark mb-2">Con Rocco</p>
            <p class="text-ink font-medium leading-relaxed">{{ p.after }}</p>
          </div>
        </div>
      </div>

      <!-- Canales -->
      <div v-reveal class="mt-12 flex flex-col md:flex-row md:items-center gap-5 md:gap-10 border-t border-ink/10 pt-10">
        <p class="text-sm font-semibold text-ink/50 shrink-0">Se conecta con</p>
        <ul class="flex flex-wrap gap-x-8 gap-y-4">
          <li v-for="c in channels" :key="c.name" class="flex items-center gap-2.5 font-semibold text-ink/80">
            <span class="w-8 h-8 rounded-md grid place-items-center text-white" :style="{ background: c.bg }">
              <ChannelIcon :name="c.name" class="w-4 h-4" />
            </span>
            {{ c.label }}
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>
