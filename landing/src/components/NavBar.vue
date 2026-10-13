<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { CRM_URL, waLink } from '../config';
import ArbolLogo from './ArbolLogo.vue';
import Icon from './Icon.vue';

const links = [
  { href: '#nosotros',  label: 'Nosotros' },
  { href: '#rocco',     label: 'Rocco CRM' },
  { href: '#servicios', label: 'Servicios' },
  { href: '#precio',    label: 'Precio' },
  { href: '#faq',       label: 'FAQ' },
];

const scrolled = ref(false);
const open = ref(false);
const onScroll = () => { scrolled.value = window.scrollY > 24; };

onMounted(() => { onScroll(); window.addEventListener('scroll', onScroll, { passive: true }); });
onUnmounted(() => window.removeEventListener('scroll', onScroll));
</script>

<template>
  <header
    class="fixed inset-x-0 top-0 z-50 transition-all duration-300"
    :class="scrolled || open ? 'bg-ink/90 backdrop-blur-md border-b border-white/10' : 'bg-transparent border-b border-transparent'"
  >
    <nav class="max-w-7xl mx-auto px-5 h-[72px] flex items-center justify-between" aria-label="Principal">
      <a href="#top" aria-label="Árbol Áureo, inicio"><ArbolLogo /></a>

      <div class="hidden lg:flex items-center gap-8">
        <a v-for="l in links" :key="l.href" :href="l.href"
           class="text-sm text-white/70 hover:text-white transition-colors">{{ l.label }}</a>
      </div>

      <div class="flex items-center gap-2">
        <a :href="`${CRM_URL}/login`" class="hidden md:inline-flex text-sm text-white/70 hover:text-white px-3 py-2 transition-colors">
          Entrar a Rocco
        </a>
        <a :href="waLink('Hola Árbol Áureo, quiero hablar sobre mi negocio')" target="_blank" rel="noopener"
           class="btn btn-gold !py-2.5 !px-4 text-sm hidden sm:inline-flex">
          Hablemos
        </a>
        <button class="lg:hidden w-10 h-10 grid place-items-center text-white rounded-md hover:bg-white/10"
                :aria-expanded="open" aria-controls="mobile-menu" :aria-label="open ? 'Cerrar menú' : 'Abrir menú'"
                @click="open = !open">
          <Icon :name="open ? 'x' : 'menu'" class="w-5 h-5" />
        </button>
      </div>
    </nav>

    <Transition
      enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0 -translate-y-2"
      leave-active-class="transition duration-150 ease-in" leave-to-class="opacity-0 -translate-y-2"
    >
      <div v-if="open" id="mobile-menu" class="lg:hidden border-t border-white/10 px-5 pb-6 pt-2">
        <a v-for="l in links" :key="l.href" :href="l.href" @click="open = false"
           class="block py-3 text-white/80 hover:text-white border-b border-white/5">{{ l.label }}</a>
        <div class="grid grid-cols-2 gap-3 mt-5">
          <a :href="`${CRM_URL}/login`" class="btn btn-ghost text-sm">Entrar a Rocco</a>
          <a :href="waLink('Hola Árbol Áureo, quiero hablar sobre mi negocio')" target="_blank" rel="noopener" class="btn btn-gold text-sm">Hablemos</a>
        </div>
      </div>
    </Transition>
  </header>
</template>
