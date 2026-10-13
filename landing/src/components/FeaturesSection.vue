<script setup lang="ts">
import Icon, { type IconName } from './Icon.vue';
import ChannelIcon from './ChannelIcon.vue';

const small: { icon: IconName; title: string; body: string }[] = [
  { icon: 'users',  title: 'Contactos con historia', body: 'Perfil completo, etiquetas, notas e historial. Importa y exporta en CSV.' },
  { icon: 'tasks',  title: 'Tareas del equipo', body: 'Varios responsables, fechas de vencimiento y tablero por estado.' },
  { icon: 'shield', title: 'Equipo y permisos', body: 'Cada usuario ve solo los módulos que le das. Datos aislados por cuenta.' },
  { icon: 'megaphone', title: 'Leads de anuncios', body: 'Los formularios de Facebook e Instagram Ads entran solos como contactos.' },
];

const days = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const slots = ['9:00', '10:30', '14:00', '16:30'];
</script>

<template>
  <section id="funciones" class="py-24 lg:py-32 bg-paper scroll-mt-16">
    <div class="max-w-7xl mx-auto px-5">
      <div class="max-w-2xl mb-14">
        <p v-reveal class="eyebrow text-rocco-dark mb-4">Todo en uno</p>
        <h2 v-reveal="80" class="font-rocco font-extrabold text-4xl md:text-5xl text-ink tracking-tight leading-[1.05]">
          Lo que hacías en cinco apps, ahora en una.
        </h2>
      </div>

      <div class="grid md:grid-cols-6 gap-4">
        <!-- Inbox -->
        <article v-reveal class="md:col-span-4 bg-ink rounded-md p-7 md:p-9 text-white grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <Icon name="inbox" class="w-6 h-6 text-rocco mb-4" />
            <h3 class="font-rocco font-bold text-2xl mb-2">Inbox unificado</h3>
            <p class="text-white/60 leading-relaxed">WhatsApp, Instagram y Messenger en una bandeja. Varias líneas de WhatsApp en la misma cuenta y todo el equipo respondiendo desde el mismo lugar.</p>
          </div>
          <div class="space-y-2" aria-hidden="true">
            <div v-for="(m, i) in [
              { ch: 'whatsapp', c: '#25D366', n: 'Pedro A.', t: '¿Hacen envíos a Valencia?', u: 2 },
              { ch: 'instagram', c: '#E1306C', n: '@lau.nails', t: 'Precio del set completo', u: 1 },
              { ch: 'facebook', c: '#1877F2', n: 'Ana Torres', t: 'Gracias, quedo atenta', u: 0 },
            ] as const" :key="i"
                 class="flex items-center gap-3 bg-white/[.06] border border-white/10 rounded-md px-3 py-2.5"
                 :class="i === 0 ? 'border-rocco/40 bg-rocco/10' : ''">
              <span class="w-8 h-8 rounded-full grid place-items-center shrink-0" :style="{ background: m.c }">
                <ChannelIcon :name="m.ch" class="w-4 h-4 text-white" />
              </span>
              <span class="min-w-0 flex-1">
                <span class="block text-[13px] font-semibold truncate">{{ m.n }}</span>
                <span class="block text-[12px] text-white/50 truncate">{{ m.t }}</span>
              </span>
              <span v-if="m.u" class="w-5 h-5 rounded-full bg-rocco text-[10px] font-bold grid place-items-center">{{ m.u }}</span>
            </div>
          </div>
        </article>

        <!-- Automatizaciones -->
        <article v-reveal="100" class="md:col-span-2 bg-rocco text-white rounded-md p-7 md:p-9 relative overflow-hidden">
          <div class="absolute inset-0 opacity-30 [background-image:radial-gradient(rgba(255,255,255,.5)_1px,transparent_1.2px)] [background-size:14px_14px]" />
          <div class="relative">
            <Icon name="zap" class="w-6 h-6 mb-4" />
            <h3 class="font-rocco font-bold text-2xl mb-2">Automatizaciones</h3>
            <p class="text-white/85 leading-relaxed">Confirmaciones, recordatorios y seguimientos que se envían solos. Tú defines el disparador; Rocco hace el resto.</p>
            <div class="mt-6 space-y-1.5 text-[12.5px] font-medium" aria-hidden="true">
              <div class="bg-white/15 rounded px-3 py-2">Cuando: se agenda una cita</div>
              <div class="w-px h-3 bg-white/50 ml-4" />
              <div class="bg-white/15 rounded px-3 py-2">Enviar WhatsApp de confirmación</div>
              <div class="w-px h-3 bg-white/50 ml-4" />
              <div class="bg-white text-rocco-dark rounded px-3 py-2">Esperar hasta 2 h antes → recordar</div>
            </div>
          </div>
        </article>

        <!-- Pipeline -->
        <article v-reveal class="md:col-span-3 bg-white border border-ink/8 rounded-md p-7 md:p-9">
          <Icon name="kanban" class="w-6 h-6 text-rocco mb-4" />
          <h3 class="font-rocco font-bold text-2xl text-ink mb-2">Pipeline de ventas</h3>
          <p class="text-ink/60 leading-relaxed">Arrastra cada oportunidad de etapa en etapa. Varios pipelines, filtros, valor por columna y tarjetas que muestras a tu gusto.</p>
          <div class="mt-6 flex gap-2" aria-hidden="true">
            <div v-for="(s, i) in [
              { n: 'Nuevo', c: '#BFDBFE', h: 'h-16' }, { n: 'Contactado', c: '#FDE68A', h: 'h-24' },
              { n: 'Propuesta', c: '#DDD6FE', h: 'h-12' }, { n: 'Ganado', c: '#BBF7D0', h: 'h-20' },
            ]" :key="i" class="flex-1 flex flex-col justify-end">
              <div class="rounded-sm" :class="s.h" :style="{ background: s.c }" />
              <p class="text-[11px] text-ink/50 mt-1.5 truncate">{{ s.n }}</p>
            </div>
          </div>
        </article>

        <!-- Calendario -->
        <article v-reveal="100" class="md:col-span-3 bg-white border border-ink/8 rounded-md p-7 md:p-9">
          <Icon name="calendar" class="w-6 h-6 text-rocco mb-4" />
          <h3 class="font-rocco font-bold text-2xl text-ink mb-2">Citas y página de reservas</h3>
          <p class="text-ink/60 leading-relaxed">Tus clientes agendan solos desde un enlace. Se sincroniza con Google Calendar y el recordatorio sale por WhatsApp.</p>
          <div class="mt-6 grid grid-cols-7 gap-1.5 text-center" aria-hidden="true">
            <span v-for="(d, i) in days" :key="i" class="text-[11px] text-ink/40">{{ d }}</span>
            <span v-for="n in 14" :key="'d' + n" class="text-[12px] py-1.5 rounded-sm"
                  :class="n === 10 ? 'bg-rocco text-white font-bold' : n % 7 === 0 ? 'text-ink/25' : 'bg-cream text-ink/70'">{{ n + 14 }}</span>
          </div>
          <div class="mt-3 flex flex-wrap gap-1.5" aria-hidden="true">
            <span v-for="(s, i) in slots" :key="s" class="text-[12px] px-2.5 py-1 rounded-sm border"
                  :class="i === 1 ? 'border-rocco bg-rocco-soft text-rocco-dark font-semibold' : 'border-ink/10 text-ink/60'">{{ s }}</span>
          </div>
        </article>

        <!-- Pequeñas -->
        <article v-for="(f, i) in small" :key="f.title" v-reveal="i * 80"
                 class="md:col-span-3 bg-white border border-ink/8 rounded-md p-6 flex gap-4 hover:border-rocco/40 transition-colors">
          <span class="w-10 h-10 rounded-md bg-rocco-soft text-rocco-dark grid place-items-center shrink-0">
            <Icon :name="f.icon" class="w-5 h-5" />
          </span>
          <div>
            <h3 class="font-semibold text-ink">{{ f.title }}</h3>
            <p class="text-sm text-ink/60 leading-relaxed mt-1">{{ f.body }}</p>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>
