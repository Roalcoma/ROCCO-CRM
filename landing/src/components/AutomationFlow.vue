<script setup lang="ts">
import Icon, { type IconName } from './Icon.vue';
import ChannelIcon from './ChannelIcon.vue';

const steps: { icon: IconName | 'instagram'; who: string; text: string }[] = [
  { icon: 'instagram', who: 'Tu seguidor comenta', text: '"INFO" en tu publicación o reel.' },
  { icon: 'message',   who: 'Rocco responde en público', text: 'Un comentario amable: "¡Te escribimos por DM!"' },
  { icon: 'send',      who: 'Rocco envía el DM', text: 'Con la información, el precio o el enlace para agendar.' },
  { icon: 'userPlus',  who: 'Nace un lead', text: 'Se crea el contacto y la oportunidad en tu pipeline.' },
];
</script>

<template>
  <section class="relative py-24 lg:py-28 bg-ink-glow text-white overflow-hidden">
    <div class="absolute inset-0 grid-lines pointer-events-none" />
    <div class="relative max-w-7xl mx-auto px-5">
      <div class="grid lg:grid-cols-[1fr_1.4fr] gap-12 items-end mb-14">
        <div>
          <p v-reveal class="eyebrow text-gold mb-4">Funcionando hoy</p>
          <h2 v-reveal="80" class="font-display text-4xl md:text-5xl leading-[1.08] tracking-tight">
            Un comentario en Instagram <em class="text-gold-grad">se convierte en cliente.</em>
          </h2>
        </div>
        <p v-reveal="160" class="text-white/60 text-lg leading-relaxed lg:pb-2">
          Esta es una de las automatizaciones que ya corren en producción con clientes de Árbol Áureo.
          Nadie del equipo tiene que estar pendiente: el prospecto recibe respuesta en segundos,
          y tú lo encuentras listo en tu pipeline.
        </p>
      </div>

      <ol class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 relative">
        <li v-for="(s, i) in steps" :key="i" v-reveal="i * 120"
            class="relative bg-white/[.04] border border-white/10 rounded-md p-6 hover:border-gold/50 hover:bg-white/[.07] transition-colors">
          <div class="flex items-center justify-between mb-8">
            <span class="w-11 h-11 rounded-md grid place-items-center"
                  :class="i === 3 ? 'bg-rocco text-white' : 'bg-gold/15 text-gold'">
              <ChannelIcon v-if="s.icon === 'instagram'" name="instagram" class="w-5 h-5" />
              <Icon v-else :name="s.icon" class="w-5 h-5" />
            </span>
            <span class="font-display text-3xl text-white/15">0{{ i + 1 }}</span>
          </div>
          <h3 class="font-semibold text-lg mb-1.5">{{ s.who }}</h3>
          <p class="text-white/55 text-sm leading-relaxed">{{ s.text }}</p>
          <Icon v-if="i < 3" name="arrowRight"
                class="hidden lg:block absolute -right-[13px] top-1/2 -translate-y-1/2 w-5 h-5 text-gold bg-ink rounded-full p-0.5 z-10" />
        </li>
      </ol>
    </div>
  </section>
</template>
