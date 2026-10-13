<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Bell, BellOff, BellRing, Smartphone } from 'lucide-vue-next';
import { pushState, enablePush, disablePush, sendTestPush, type PushState } from '../../push';

const state = ref<PushState | 'loading'>('loading');
const working = ref(false);
const msg = ref('');

async function refresh() { state.value = await pushState(); }

onMounted(refresh);

async function toggle() {
  working.value = true;
  msg.value = '';
  try {
    if (state.value === 'on') {
      await disablePush();
    } else {
      state.value = await enablePush();
      if (state.value === 'on') msg.value = '¡Notificaciones activadas!';
    }
    await refresh();
  } catch {
    msg.value = 'No se pudo cambiar la suscripción.';
  } finally {
    working.value = false;
  }
}

async function test() {
  working.value = true;
  msg.value = '';
  try {
    await sendTestPush();
    msg.value = 'Notificación de prueba enviada.';
  } catch {
    msg.value = 'No se pudo enviar la prueba.';
  } finally {
    working.value = false;
  }
}

const stateLabel: Record<PushState, string> = {
  insecure:      'Requiere HTTPS',
  unsupported:   'Tu navegador no lo soporta',
  'install-first': 'Añade la app a inicio',
  denied:        'Permiso bloqueado en el navegador',
  off:           'Desactivadas',
  on:            'Activas en este dispositivo',
};
</script>

<template>
  <div class="mx-auto max-w-2xl space-y-6 p-6">
    <div>
      <h1 class="text-xl font-bold text-slate-900">Notificaciones</h1>
      <p class="mt-1 text-sm text-slate-500">Recibe alertas de leads, mensajes y tareas directamente en este dispositivo.</p>
    </div>

    <!-- Tarjeta principal -->
    <div class="border border-slate-200 bg-white p-5 shadow-sm">
      <div class="flex items-start gap-4">
        <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center bg-[#F69008]/10">
          <BellRing v-if="state === 'on'" class="h-5 w-5 text-[#F69008]" />
          <Bell v-else class="h-5 w-5 text-slate-400" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-[13px] font-semibold text-slate-800">
            Notificaciones en este dispositivo
          </p>
          <p class="mt-0.5 text-[12px] text-slate-500">
            {{ state === 'loading' ? 'Verificando…' : stateLabel[state as PushState] ?? '' }}
          </p>
        </div>
        <!-- Indicador de estado -->
        <span
          class="text-[11px] font-semibold px-2 py-0.5"
          :class="state === 'on' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'"
        >{{ state === 'on' ? 'ON' : 'OFF' }}</span>
      </div>

      <!-- Aviso iOS -->
      <div v-if="state === 'install-first'" class="mt-4 flex items-start gap-2 border border-blue-200 bg-blue-50 p-3 text-[12px] text-blue-700">
        <Smartphone class="mt-0.5 h-4 w-4 flex-shrink-0" />
        <span>En iPhone debes primero <strong>añadir Rocco a la pantalla de inicio</strong> (botón Compartir → Añadir a inicio) y luego abrir la app instalada.</span>
      </div>

      <!-- Permiso bloqueado -->
      <p v-if="state === 'denied'" class="mt-3 text-[12px] text-slate-500">
        Desbloquearlo en <strong>Ajustes del navegador → Permisos del sitio → Notificaciones</strong>.
      </p>

      <!-- Acciones -->
      <div v-if="state !== 'loading' && state !== 'insecure' && state !== 'unsupported' && state !== 'denied' && state !== 'install-first'" class="mt-4 flex flex-wrap gap-2">
        <button
          class="btn btn-primary btn-sm"
          :disabled="working"
          @click="toggle"
        >
          <BellRing v-if="state !== 'on'" class="h-3.5 w-3.5" />
          <BellOff v-else class="h-3.5 w-3.5" />
          {{ state === 'on' ? 'Desactivar en este dispositivo' : 'Activar notificaciones' }}
        </button>
        <button
          v-if="state === 'on'"
          class="btn btn-secondary btn-sm"
          :disabled="working"
          @click="test"
        >
          Enviar prueba
        </button>
      </div>

      <p v-if="msg" class="mt-3 text-[12px]" :class="msg.includes('No se pudo') ? 'text-red-600' : 'text-emerald-600'">
        {{ msg }}
      </p>
    </div>

    <!-- Info qué notificaciones llegan -->
    <div class="border border-slate-200 bg-white p-5 shadow-sm">
      <p class="text-[13px] font-semibold text-slate-800 mb-3">Cuándo recibirás notificaciones</p>
      <ul class="space-y-2 text-[12px] text-slate-600">
        <li class="flex items-center gap-2"><span class="h-1.5 w-1.5 flex-shrink-0 bg-[#F69008]"></span> Lead nuevo por WhatsApp o Instagram</li>
        <li class="flex items-center gap-2"><span class="h-1.5 w-1.5 flex-shrink-0 bg-[#F69008]"></span> Mensaje recibido en una conversación</li>
        <li class="flex items-center gap-2"><span class="h-1.5 w-1.5 flex-shrink-0 bg-[#F69008]"></span> Tarea asignada o recordatorio de vencimiento</li>
        <li class="flex items-center gap-2"><span class="h-1.5 w-1.5 flex-shrink-0 bg-[#F69008]"></span> Cita agendada o recordatorio</li>
      </ul>
    </div>
  </div>
</template>
