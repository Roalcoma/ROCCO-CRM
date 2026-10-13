// Toasts globales (avisos breves abajo a la derecha). Estado a nivel de módulo, como
// useDialog: se pinta una sola vez con <AppToasts /> en App.vue y vale para todo
// (CRM, agencia y página pública de reservas).
import { ref } from 'vue';

export type ToastKind = 'success' | 'error' | 'info';
export interface ToastAction { label: string; run: () => void }
export interface Toast { id: number; kind: ToastKind; message: string; action?: ToastAction }

export const toasts = ref<Toast[]>([]);
let seq = 0;

export function dismissToast(id: number) {
  toasts.value = toasts.value.filter(t => t.id !== id);
}

export function showToast(message: string, kind: ToastKind = 'info', ms = kind === 'error' ? 6000 : 3500, action?: ToastAction) {
  // Mismo mensaje repetido en ráfaga (p. ej. varios errores iguales): no apilar copias
  if (toasts.value.some(t => t.message === message && t.kind === kind)) return;
  const id = ++seq;
  toasts.value = [...toasts.value.slice(-3), { id, kind, message, action }];
  setTimeout(() => dismissToast(id), ms);
}

export function useToast() {
  return {
    success: (m: string) => showToast(m, 'success'),
    error: (m: string) => showToast(m, 'error'),
    info: (m: string) => showToast(m, 'info'),
  };
}
