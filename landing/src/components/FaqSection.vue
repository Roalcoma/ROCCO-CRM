<script setup lang="ts">
import { EMAIL, waLink } from '../config';

const faqs = [
  {
    q: '¿Qué relación hay entre Árbol Áureo y Rocco CRM?',
    a: 'Árbol Áureo es la agencia; Rocco CRM es nuestro producto. Lo diseñamos, lo desarrollamos y lo mantenemos nosotros, y también lo implementamos para los negocios que prefieren que lo configuremos por ellos.',
  },
  {
    q: '¿Necesito conocimientos técnicos para usar Rocco?',
    a: 'No. Rocco está pensado para dueños de negocio y equipos de ventas. Si prefieres no configurarlo tú, nuestro equipo lo deja listo contigo.',
  },
  {
    q: '¿Qué pasa cuando terminan los 7 días de prueba?',
    a: 'Puedes activar tu suscripción de $15 al mes (o $12 al mes pagando el año) para continuar. Si decides no seguir, no se te cobra nada.',
  },
  {
    q: '¿Puedo conectar más de un WhatsApp o Instagram?',
    a: 'Sí. Puedes conectar varias líneas de WhatsApp y tus cuentas de Instagram y Facebook. Todos los mensajes llegan al mismo inbox, identificados por canal.',
  },
  {
    q: '¿Mis datos y los de mis clientes están seguros?',
    a: 'Toda la comunicación viaja cifrada (HTTPS), las contraseñas se guardan con hash y los datos de cada cuenta están aislados de las demás. Además, puedes limitar qué módulos ve cada usuario de tu equipo.',
  },
  {
    q: '¿Para qué tipo de negocio sirve?',
    a: 'Para cualquiera que venda o atienda por WhatsApp e Instagram: clínicas y estética, salones, seguros, bienes raíces, coaches, tiendas, agencias y servicios profesionales.',
  },
  {
    q: '¿Puedo cancelar en cualquier momento?',
    a: 'Sí, sin penalización. El acceso sigue activo hasta el final del período que ya pagaste.',
  },
  {
    q: '¿El soporte es en español?',
    a: 'Siempre. Te atendemos por WhatsApp, de lunes a viernes, personas que conocen tu cuenta y cómo vende tu negocio.',
  },
];
</script>

<template>
  <section id="faq" class="py-24 lg:py-32 bg-paper scroll-mt-16">
    <div class="max-w-7xl mx-auto px-5 grid lg:grid-cols-[1fr_1.6fr] gap-12">
      <div>
        <p v-reveal class="eyebrow text-gold-dark mb-4">Preguntas frecuentes</p>
        <h2 v-reveal="80" class="font-display text-4xl md:text-5xl text-ink leading-[1.08] tracking-tight">¿Tienes dudas?</h2>
        <p v-reveal="140" class="mt-4 text-ink/60 leading-relaxed">
          Si no ves tu pregunta, escríbenos por
          <a :href="waLink('Hola, tengo una pregunta sobre Rocco CRM')" target="_blank" rel="noopener" class="text-ink underline decoration-gold underline-offset-4 hover:decoration-2">WhatsApp</a>
          o a <a :href="`mailto:${EMAIL}`" class="text-ink underline decoration-gold underline-offset-4 hover:decoration-2 whitespace-nowrap">{{ EMAIL }}</a>.
        </p>
      </div>

      <div v-reveal="100" class="divide-y divide-ink/10 border-y border-ink/10">
        <details v-for="f in faqs" :key="f.q" class="group py-1">
          <summary class="flex items-center justify-between gap-6 py-5 cursor-pointer list-none font-semibold text-ink text-lg hover:text-gold-dark transition-colors [&::-webkit-details-marker]:hidden">
            {{ f.q }}
            <span class="relative w-4 h-4 shrink-0 text-gold-dark" aria-hidden="true">
              <span class="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-current" />
              <span class="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-current transition-transform duration-300 group-open:rotate-90 group-open:scale-0" />
            </span>
          </summary>
          <p class="pb-6 pr-10 text-ink/65 leading-relaxed">{{ f.a }}</p>
        </details>
      </div>
    </div>
  </section>
</template>
