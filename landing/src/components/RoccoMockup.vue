<script setup lang="ts">
import ChannelIcon, { type BrandName } from './ChannelIcon.vue';
import Icon, { type IconName } from './Icon.vue';

type Card = { name: string; value: string; ch: BrandName; tag: string; who: string };
const columns: { title: string; color: string; total: string; cards: Card[] }[] = [
  { title: 'Nuevo lead', color: '#BFDBFE', total: '$1.240', cards: [
    { name: 'María González', value: '$320', ch: 'whatsapp', tag: 'Facial', who: 'RA' },
    { name: 'Carlos Pérez', value: '$920', ch: 'instagram', tag: 'Anuncio IG', who: 'LM' },
  ] },
  { title: 'Contactado', color: '#FDE68A', total: '$780', cards: [
    { name: 'Andrea Rojas', value: '$480', ch: 'facebook', tag: 'Referido', who: 'RA' },
    { name: 'José Méndez', value: '$300', ch: 'whatsapp', tag: 'Seguimiento', who: 'DV' },
  ] },
  { title: 'Cita agendada', color: '#BBF7D0', total: '$1.650', cards: [
    { name: 'Luisa Fernández', value: '$1.650', ch: 'instagram', tag: 'VIP', who: 'LM' },
  ] },
];

const nav: { icon: IconName; label: string; active?: boolean }[] = [
  { icon: 'inbox', label: 'Conversaciones' },
  { icon: 'kanban', label: 'Oportunidades', active: true },
  { icon: 'users', label: 'Contactos' },
  { icon: 'calendar', label: 'Calendario' },
  { icon: 'zap', label: 'Automatizaciones' },
];

const chColor: Record<BrandName, string> = { whatsapp: '#25D366', instagram: '#E1306C', facebook: '#1877F2', google: '#4285F4' };
</script>

<template>
  <div class="relative" aria-hidden="true">
    <!-- Ventana -->
    <div class="rounded-lg overflow-hidden border border-white/10 bg-[#F6F4F0] shadow-[0_40px_100px_-30px_rgba(0,0,0,.7)]">
      <div class="flex items-center gap-1.5 px-3 py-2.5 bg-[#0b1626] border-b border-white/5">
        <span class="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" /><span class="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" /><span class="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
        <span class="mx-auto flex items-center gap-1.5 text-[11px] text-white/40 bg-white/5 px-3 py-1 rounded font-mono">
          <Icon name="lock" class="w-3 h-3" /> rocco.arbolaureo.org
        </span>
      </div>

      <div class="flex h-[330px] sm:h-[370px]">
        <!-- Sidebar -->
        <aside class="hidden sm:flex w-44 shrink-0 flex-col bg-gradient-to-b from-ink-2 to-ink px-3 py-4 gap-1">
          <div class="flex items-center gap-2 px-1 mb-4">
            <img src="/rocco-mark.png" alt="" class="w-5 h-6 object-contain" />
            <span class="font-rocco font-extrabold text-white text-lg leading-none">rocco<span class="text-rocco">.</span></span>
          </div>
          <div v-for="n in nav" :key="n.label"
               class="flex items-center gap-2 px-2 py-1.5 rounded text-[11.5px]"
               :class="n.active ? 'bg-rocco/15 text-rocco font-semibold' : 'text-white/55'">
            <Icon :name="n.icon" class="w-3.5 h-3.5" /> {{ n.label }}
          </div>
        </aside>

        <!-- Contenido -->
        <div class="flex-1 min-w-0 flex flex-col">
          <div class="flex items-center justify-between px-4 py-3 bg-white border-b border-black/5">
            <div>
              <p class="text-[13px] font-bold text-ink font-rocco">Ventas · Pipeline principal</p>
              <p class="text-[10.5px] text-ink/45">5 oportunidades · $3.670 en juego</p>
            </div>
            <span class="flex items-center gap-1 text-[10.5px] font-semibold bg-rocco text-white px-2.5 py-1.5 rounded">
              <Icon name="plus" class="w-3 h-3" /> Nueva
            </span>
          </div>

          <div class="flex-1 grid grid-cols-2 md:grid-cols-3 gap-2.5 p-3 overflow-hidden">
            <div v-for="(col, ci) in columns" :key="col.title" class="flex flex-col min-w-0" :class="ci === 2 ? 'hidden md:flex' : ''">
              <div class="flex items-center justify-between rounded-sm px-2 py-1.5 mb-2 text-[10.5px] font-semibold text-ink/80"
                   :style="{ background: col.color }">
                <span class="truncate">{{ col.title }}</span><span class="text-ink/55">{{ col.total }}</span>
              </div>
              <div class="space-y-2">
                <div v-for="c in col.cards" :key="c.name"
                     class="bg-white rounded-sm border border-black/5 p-2.5 shadow-[0_1px_2px_rgba(0,0,0,.05)] border-l-2"
                     :style="{ borderLeftColor: col.color }">
                  <div class="flex items-start justify-between gap-1">
                    <p class="text-[11.5px] font-semibold text-ink truncate">{{ c.name }}</p>
                    <span class="w-5 h-5 shrink-0 rounded-full bg-gradient-to-br from-rocco to-gold-dark text-white text-[8px] font-bold grid place-items-center">{{ c.who }}</span>
                  </div>
                  <p class="text-[12px] font-bold text-ink mt-0.5">{{ c.value }}</p>
                  <div class="flex items-center gap-1.5 mt-1.5">
                    <ChannelIcon :name="c.ch" class="w-3 h-3" :style="{ color: chColor[c.ch] }" />
                    <span class="text-[9.5px] bg-rocco-soft text-rocco-dark px-1.5 py-0.5 rounded-sm font-medium">{{ c.tag }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Notificación de WhatsApp flotante -->
    <div class="absolute -left-4 sm:-left-10 bottom-10 w-60 bg-white rounded-md shadow-2xl border border-black/5 p-3 float"
         style="animation-delay: -2s">
      <div class="flex items-center gap-2 mb-1.5">
        <span class="w-6 h-6 rounded-full bg-[#25D366] grid place-items-center"><ChannelIcon name="whatsapp" class="w-3.5 h-3.5 text-white" /></span>
        <span class="text-[11px] font-semibold text-ink">María González</span>
        <span class="ml-auto text-[10px] text-ink/40">ahora</span>
      </div>
      <p class="text-[11.5px] text-ink/70 leading-snug">¡Hola! ¿Tienen cupo para el sábado en la mañana?</p>
    </div>

    <!-- Automatización flotante -->
    <div class="absolute -right-3 sm:-right-8 -top-5 bg-ink text-white rounded-md shadow-2xl border border-white/10 px-3 py-2.5 flex items-center gap-2.5 float">
      <span class="w-7 h-7 rounded bg-gold/15 text-gold grid place-items-center"><Icon name="zap" class="w-4 h-4" /></span>
      <span class="leading-tight">
        <span class="block text-[11px] font-semibold">Recordatorio enviado</span>
        <span class="block text-[10px] text-white/50">Cita en 2 h · WhatsApp</span>
      </span>
      <Icon name="checkCircle" class="w-4 h-4 text-[#28C840]" />
    </div>
  </div>
</template>
