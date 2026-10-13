<script setup lang="ts">
// Aviso para activar las notificaciones push en este dispositivo. Sale solo si se pueden
// activar y están apagadas; "Ahora no" lo oculta 7 días (en este navegador).
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { BellRing, Share, X } from 'lucide-vue-next';
import { pushState, enablePush, type PushState } from '../push';
import { showToast } from '../composables/useToast';

const KEY = 'rocco.pushPromptUntil';
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;

const route = useRoute();
const state = ref<PushState | null>(null);
const snoozed = ref(false);
const working = ref(false);

onMounted(async () => {
  try { snoozed.value = Number(localStorage.getItem(KEY) ?? 0) > Date.now(); } catch { /* sin storage: se muestra */ }
  state.value = await pushState().catch(() => null);
});

const visible = computed(() =>
  !snoozed.value && route.path !== '/notifications' && (state.value === 'off' || state.value === 'install-first'));

function later() {
  snoozed.value = true;
  try { localStorage.setItem(KEY, String(Date.now() + SNOOZE_MS)); } catch { /* ignorar */ }
}

async function activate() {
  working.value = true;
  try {
    state.value = await enablePush();
    if (state.value === 'on') showToast('¡Notificaciones activadas en este dispositivo!', 'success');
    else if (state.value === 'denied') showToast('El navegador bloqueó las notificaciones. Actívalas en los permisos del sitio.', 'error', 8000);
  } catch {
    showToast('No se pudieron activar las notificaciones', 'error');
  } finally {
    working.value = false;
  }
}
</script>

<template>
  <div v-if="visible" class="flex flex-shrink-0 items-start gap-3 border-b border-slate-200 bg-primary-light px-4 py-3 sm:px-6">
    <BellRing class="mt-0.5 h-5 w-5 flex-shrink-0 text-[#D97706]" />
    <div class="min-w-0 flex-1">
      <template v-if="state === 'off'">
        <p class="text-sm font-semibold text-ink">Activa las notificaciones</p>
        <p class="mt-0.5 text-[13px] text-slate-600">Entérate al instante de cada lead nuevo, mensaje y cita.</p>
        <div class="mt-2 flex gap-2">
          <button class="btn btn-primary btn-sm cursor-pointer" :disabled="working" @click="activate">Activar</button>
          <button class="btn btn-ghost btn-sm cursor-pointer" @click="later">Ahora no</button>
        </div>
      </template>
      <template v-else>
        <p class="text-sm font-semibold text-ink">Instala Rocco para recibir notificaciones</p>
        <p class="mt-0.5 text-[13px] text-slate-600">
          En iPhone toca <Share class="inline h-3.5 w-3.5 align-[-2px]" /> <b>Compartir</b> y luego
          <b>“Añadir a pantalla de inicio”</b>. Abre Rocco desde ese ícono y actívalas aquí.
        </p>
      </template>
    </div>
    <button class="-mr-1 cursor-pointer p-1 text-slate-500" aria-label="Ocultar aviso" @click="later">
      <X class="h-4 w-4" />
    </button>
  </div>
</template>
