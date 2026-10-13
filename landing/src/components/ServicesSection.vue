<script setup lang="ts">
import { waLink } from '../config';
import Icon, { type IconName } from './Icon.vue';

const services: { icon: IconName; title: string; body: string }[] = [
  { icon: 'compass',   title: 'Implementación de Rocco', body: 'Conectamos tus canales, importamos tus contactos y armamos tu pipeline con las etapas reales de tu venta.' },
  { icon: 'zap',       title: 'Automatizaciones a medida', body: 'Bots de comentarios, secuencias de seguimiento, recordatorios de citas y flujos específicos de tu negocio.' },
  { icon: 'megaphone', title: 'Integración con Meta', body: 'Instagram, Messenger y formularios de Lead Ads conectados para que ningún prospecto se quede por fuera.' },
  { icon: 'headset',   title: 'Capacitación y soporte', body: 'Entrenamos a tu equipo y te acompañamos por WhatsApp, en español y con gente que conoce tu cuenta.' },
];

const steps = [
  { t: 'Diagnóstico', d: 'Una llamada para entender cómo vendes hoy y dónde se pierden los clientes.' },
  { t: 'Implementación', d: 'Configuramos Rocco con tus canales, tu equipo y tu proceso.' },
  { t: 'Automatización', d: 'Activamos los flujos que te ahorran más tiempo desde la primera semana.' },
  { t: 'Crecimiento', d: 'Revisamos resultados contigo y seguimos ajustando.' },
];
</script>

<template>
  <section id="servicios" class="py-24 lg:py-32 bg-paper scroll-mt-16">
    <div class="max-w-7xl mx-auto px-5">
      <div class="grid lg:grid-cols-2 gap-6 items-end mb-14">
        <div>
          <p v-reveal class="eyebrow text-gold-dark mb-4">Servicios de Árbol Áureo</p>
          <h2 v-reveal="80" class="font-display text-4xl md:text-5xl text-ink leading-[1.08] tracking-tight">
            No te dejamos solo <em class="text-gold-dark">con el software.</em>
          </h2>
        </div>
        <p v-reveal="160" class="text-lg text-ink/60 leading-relaxed">
          Puedes usar Rocco por tu cuenta, o dejar que nuestro equipo lo configure y automatice por ti.
          Tú te enfocas en vender; nosotros en que el sistema trabaje.
        </p>
      </div>

      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-ink/10 border border-ink/10 rounded-md overflow-hidden">
        <article v-for="(s, i) in services" :key="s.title" v-reveal="i * 80"
                 class="bg-white p-7 group hover:bg-cream transition-colors">
          <span class="w-11 h-11 rounded-md bg-ink text-gold grid place-items-center mb-6 group-hover:scale-105 transition-transform">
            <Icon :name="s.icon" class="w-5 h-5" />
          </span>
          <h3 class="text-lg font-semibold text-ink mb-2">{{ s.title }}</h3>
          <p class="text-sm text-ink/60 leading-relaxed">{{ s.body }}</p>
        </article>
      </div>

      <!-- Proceso -->
      <div id="proceso" class="mt-20 grid lg:grid-cols-[1fr_2fr] gap-10 scroll-mt-24">
        <div>
          <h3 v-reveal class="font-display text-3xl text-ink leading-tight">Cómo trabajamos contigo</h3>
          <p v-reveal="80" class="mt-3 text-ink/60">Cuatro pasos, sin tecnicismos. Casi siempre estás operando en la primera semana.</p>
          <a v-reveal="140" :href="waLink('Hola Árbol Áureo, quiero agendar un diagnóstico')" target="_blank" rel="noopener"
             class="btn btn-line mt-6 text-sm">Agendar diagnóstico <Icon name="arrowRight" class="w-4 h-4" /></a>
        </div>
        <ol class="relative grid sm:grid-cols-2 gap-x-8 gap-y-10">
          <li v-for="(s, i) in steps" :key="s.t" v-reveal="i * 100" class="relative pl-14">
            <span class="absolute left-0 top-0 w-10 h-10 rounded-full border border-gold text-gold-dark font-display text-lg grid place-items-center bg-white">{{ i + 1 }}</span>
            <h4 class="font-semibold text-ink text-lg">{{ s.t }}</h4>
            <p class="text-ink/60 mt-1 leading-relaxed">{{ s.d }}</p>
          </li>
        </ol>
      </div>
    </div>
  </section>
</template>
