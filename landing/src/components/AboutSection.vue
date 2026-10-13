<script setup lang="ts">
import Icon, { type IconName } from './Icon.vue';

const pillars: { icon: IconName; title: string; body: string }[] = [
  { icon: 'sprout', title: 'Raíces', body: 'Entendemos cómo se vende aquí: por chat, con notas de voz, con confianza y con el cliente esperando respuesta ya.' },
  { icon: 'wrench', title: 'Tronco', body: 'Construimos nuestra propia tecnología. No revendemos software extranjero: lo diseñamos, lo mantenemos y lo mejoramos cada semana.' },
  { icon: 'users',  title: 'Frutos', body: 'Medimos nuestro trabajo en resultados tuyos: menos prospectos perdidos, más citas agendadas y seguimientos que sí se hacen.' },
];
</script>

<template>
  <section id="nosotros" class="py-24 lg:py-32 bg-paper scroll-mt-16">
    <div class="max-w-7xl mx-auto px-5 grid lg:grid-cols-[1fr_1.2fr] gap-14 lg:gap-20">
      <div class="lg:sticky lg:top-32 self-start">
        <p v-reveal class="eyebrow text-gold-dark mb-5">Quiénes somos</p>
        <h2 v-reveal="80" class="font-display text-4xl md:text-5xl leading-[1.08] text-ink tracking-tight">
          Un árbol se juzga <em class="text-gold-dark">por sus frutos.</em>
        </h2>
        <p v-reveal="160" class="mt-6 text-lg text-ink/65 leading-relaxed">
          Árbol Áureo es una agencia venezolana de tecnología. Diseñamos software, automatizaciones
          e integraciones para que los negocios que viven del WhatsApp y las redes sociales puedan crecer
          sin volverse locos en el intento.
        </p>
        <p v-reveal="220" class="mt-4 text-ink/65 leading-relaxed">
          No somos un proveedor más: nos sentamos contigo, entendemos tu proceso de venta
          y lo convertimos en un sistema que funciona solo.
        </p>
      </div>

      <ol class="space-y-4">
        <li v-for="(p, i) in pillars" :key="p.title" v-reveal="i * 100"
            class="group relative bg-white border border-ink/8 rounded-md p-7 md:p-8 flex gap-6 hover:border-gold/60 hover:shadow-[0_20px_50px_-25px_rgba(14,27,46,.35)] transition-all duration-300">
          <span class="font-display text-5xl text-gold/40 leading-none w-10 shrink-0 group-hover:text-gold transition-colors">0{{ i + 1 }}</span>
          <div>
            <div class="flex items-center gap-2.5 mb-2">
              <Icon :name="p.icon" class="w-5 h-5 text-gold-dark" />
              <h3 class="text-xl font-semibold text-ink">{{ p.title }}</h3>
            </div>
            <p class="text-ink/60 leading-relaxed">{{ p.body }}</p>
          </div>
        </li>

        <li v-reveal="300" class="relative bg-ink rounded-md p-7 md:p-8 overflow-hidden">
          <div class="absolute inset-0 citrus-dots opacity-60" />
          <div class="relative flex flex-col sm:flex-row sm:items-center gap-5">
            <img src="/rocco-mark.png" alt="" class="w-12 h-14 object-contain" width="48" height="56" />
            <p class="text-white/80 leading-relaxed">
              <span class="font-rocco font-extrabold text-white text-lg">Rocco CRM</span> es el primer fruto de ese árbol:
              la herramienta que usamos con nuestros propios clientes, ahora disponible para tu negocio.
            </p>
            <a href="#rocco" class="btn btn-rocco shrink-0 !py-2.5 text-sm">Ver Rocco <Icon name="arrowRight" class="w-4 h-4" /></a>
          </div>
        </li>
      </ol>
    </div>
  </section>
</template>
