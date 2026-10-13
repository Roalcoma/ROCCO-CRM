<script setup lang="ts">
import { ref, computed } from 'vue';
import { CRM_URL, waLink } from '../config';
import Icon from './Icon.vue';

const annual = ref(true);
const price = computed(() => (annual.value ? 12 : 15));

const included = [
  'Inbox unificado: WhatsApp, Instagram y Messenger',
  'Automatizaciones ilimitadas',
  'Calendario con página de reservas',
  'Contactos, pipelines y tareas',
  'Sincronización con Google Calendar',
  'Hasta 3 usuarios con permisos',
  'Soporte por WhatsApp en español',
];

const extras = [
  'Todo lo del plan Profesional',
  'Configuración completa por nuestro equipo',
  'Automatizaciones diseñadas para tu negocio',
  'Conexión de Meta: Instagram, Messenger y Lead Ads',
  'Capacitación para tu equipo',
];
</script>

<template>
  <section id="precio" class="py-24 lg:py-32 bg-cream scroll-mt-16">
    <div class="max-w-6xl mx-auto px-5">
      <div class="text-center max-w-2xl mx-auto mb-12">
        <p v-reveal class="eyebrow text-rocco-dark mb-4">Precio</p>
        <h2 v-reveal="80" class="font-rocco font-extrabold text-4xl md:text-5xl text-ink tracking-tight">Simple y sin sorpresas.</h2>
        <p v-reveal="140" class="text-ink/60 mt-4 text-lg">Empieza solo con Rocco, o déjanos montarlo contigo.</p>
      </div>

      <div v-reveal class="flex items-center justify-center gap-3 mb-12">
        <span class="text-sm font-semibold" :class="annual ? 'text-ink/40' : 'text-ink'">Mensual</span>
        <button role="switch" :aria-checked="annual" aria-label="Facturación anual"
                class="relative w-14 h-7 rounded-full transition-colors duration-300"
                :class="annual ? 'bg-rocco' : 'bg-ink/20'" @click="annual = !annual">
          <span class="absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform duration-300"
                :class="annual ? 'translate-x-7' : ''" />
        </button>
        <span class="text-sm font-semibold" :class="annual ? 'text-ink' : 'text-ink/40'">Anual</span>
        <span class="text-xs font-bold px-2.5 py-1 rounded-sm bg-emerald-100 text-emerald-700 transition-opacity" :class="annual ? 'opacity-100' : 'opacity-0'">−20%</span>
      </div>

      <div class="grid lg:grid-cols-2 gap-6 items-stretch">
        <!-- Rocco Profesional -->
        <article v-reveal class="relative bg-white rounded-md border-2 border-rocco p-8 md:p-10 flex flex-col shadow-[0_30px_60px_-30px_rgba(246,144,8,.45)]">
          <span class="absolute -top-3 left-8 text-[11px] font-bold uppercase tracking-wider bg-rocco text-white px-3 py-1 rounded-sm">7 días gratis</span>
          <div class="flex items-center gap-2.5">
            <img src="/rocco-mark.png" alt="" class="w-6 h-7 object-contain" />
            <h3 class="font-rocco font-extrabold text-2xl text-ink">Rocco Profesional</h3>
          </div>
          <p class="text-ink/55 mt-1">Para negocios que quieren arrancar por su cuenta.</p>

          <div class="mt-8 flex items-end gap-2">
            <span class="font-rocco font-extrabold text-7xl text-ink leading-none tabular-nums">${{ price }}</span>
            <span class="text-ink/50 mb-2">/mes</span>
            <span v-if="annual" class="text-ink/35 line-through mb-2 ml-1">$15</span>
          </div>
          <p class="text-sm text-ink/50 mt-2">{{ annual ? 'Facturado $144 al año · ahorras $36' : 'Facturado mes a mes' }}</p>

          <ul class="mt-8 space-y-3 flex-1">
            <li v-for="it in included" :key="it" class="flex items-start gap-3 text-ink/80">
              <Icon name="check" class="w-5 h-5 text-rocco shrink-0 mt-px" :stroke="2.5" /> {{ it }}
            </li>
          </ul>

          <a :href="`${CRM_URL}/login`" class="btn btn-rocco w-full mt-10">Empezar prueba gratis <Icon name="arrowRight" class="w-4 h-4" /></a>
          <p class="text-center text-xs text-ink/45 mt-3">Sin tarjeta de crédito · Cancela cuando quieras</p>
        </article>

        <!-- Con Árbol Áureo -->
        <article v-reveal="120" class="relative bg-ink text-white rounded-md p-8 md:p-10 flex flex-col overflow-hidden">
          <div class="absolute -right-20 -top-20 w-72 h-72 rounded-full bg-gold/15 blur-3xl pointer-events-none" />
          <div class="relative flex items-center gap-2.5">
            <img src="/arbol-aureo.svg" alt="" class="w-7 h-7 rounded" />
            <h3 class="font-display text-2xl">Rocco + Árbol Áureo</h3>
          </div>
          <p class="relative text-white/55 mt-1">Implementación acompañada, llave en mano.</p>

          <div class="relative mt-8">
            <span class="font-display text-5xl md:text-6xl text-gold-grad leading-none">A tu medida</span>
            <p class="text-sm text-white/50 mt-3">Cotizamos según tus canales, tu equipo y las automatizaciones que necesitas.</p>
          </div>

          <ul class="relative mt-8 space-y-3 flex-1">
            <li v-for="it in extras" :key="it" class="flex items-start gap-3 text-white/80">
              <Icon name="check" class="w-5 h-5 text-gold shrink-0 mt-px" :stroke="2.5" /> {{ it }}
            </li>
          </ul>

          <a :href="waLink('Hola Árbol Áureo, quiero cotizar la implementación de Rocco')" target="_blank" rel="noopener"
             class="relative btn btn-gold w-full mt-10">Solicitar cotización <Icon name="arrowRight" class="w-4 h-4" /></a>
          <p class="relative text-center text-xs text-white/40 mt-3">Te respondemos por WhatsApp</p>
        </article>
      </div>
    </div>
  </section>
</template>
