<script setup lang="ts">
import { CRM_URL, EMAIL, waLink } from '../config';
import ArbolLogo from './ArbolLogo.vue';

const year = new Date().getFullYear();

const cols = [
  { title: 'Árbol Áureo', links: [
    { href: '#nosotros', label: 'Nosotros' },
    { href: '#servicios', label: 'Servicios' },
    { href: '#proceso', label: 'Cómo trabajamos' },
    { href: waLink('Hola Árbol Áureo'), label: 'WhatsApp', ext: true },
    { href: `mailto:${EMAIL}`, label: 'Correo' },
  ] },
  { title: 'Rocco CRM', links: [
    { href: '#rocco', label: 'Qué es Rocco' },
    { href: '#funciones', label: 'Funciones' },
    { href: '#precio', label: 'Precio' },
    { href: `${CRM_URL}/login`, label: 'Iniciar sesión' },
  ] },
  { title: 'Legal', links: [
    { href: `${CRM_URL}/privacy`, label: 'Privacidad' },
    { href: `${CRM_URL}/terms`, label: 'Términos' },
  ] },
];
</script>

<template>
  <footer class="bg-ink text-white/55">
    <div class="max-w-7xl mx-auto px-5 py-16 grid gap-12 md:grid-cols-[1.4fr_repeat(3,1fr)]">
      <div>
        <ArbolLogo />
        <p class="mt-5 text-sm leading-relaxed max-w-xs">
          Agencia venezolana de tecnología y automatización. Creadores de Rocco CRM.
        </p>
      </div>
      <nav v-for="c in cols" :key="c.title" :aria-label="c.title">
        <p class="text-white text-sm font-semibold mb-4">{{ c.title }}</p>
        <ul class="space-y-2.5 text-sm">
          <li v-for="l in c.links" :key="l.label">
            <a :href="l.href" v-bind="'ext' in l ? { target: '_blank', rel: 'noopener' } : {}" class="hover:text-gold transition-colors">{{ l.label }}</a>
          </li>
        </ul>
      </nav>
    </div>
    <div class="border-t border-white/10">
      <div class="max-w-7xl mx-auto px-5 py-6 flex flex-col sm:flex-row gap-2 justify-between text-xs text-white/35">
        <p>© {{ year }} Árbol Áureo. Todos los derechos reservados.</p>
        <p>Rocco CRM es un producto de Árbol Áureo.</p>
      </div>
    </div>
  </footer>
</template>
