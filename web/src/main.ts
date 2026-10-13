import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { router } from './router';
import App from './App.vue';
import { showToast } from './composables/useToast';
import { registerSW } from './push';
import './style.css';

const app = createApp(App).use(createPinia()).use(router);

// Red de seguridad: cualquier error no capturado (render, watchers, handlers async con
// try/finally sin catch, promesas sueltas) se muestra como toast en vez de perderse en
// la consola o dejar la pantalla a medias. No relanza: la app sigue funcionando.
function reportError(err: unknown) {
  // 401: api.ts ya redirige a /login; un fetch abortado al navegar no es un error del usuario
  if (err instanceof Error && (err.name === 'SessionExpiredError' || err.name === 'AbortError')) return;
  console.error(err);
  const msg = err instanceof Error ? err.message : typeof err === 'string' ? err : '';
  showToast(`Algo salió mal${msg ? `: ${msg}` : ''}`, 'error');
}

app.config.errorHandler = err => reportError(err);
window.addEventListener('unhandledrejection', e => {
  e.preventDefault();   // ya se informa con el toast
  reportError(e.reason);
});

registerSW();
app.mount('#app');

// Diagnóstico de viewport (iPhone instalado): abrir con ?vp=1 muestra las medidas reales
if (new URLSearchParams(location.search).has('vp')) {
  const probe = document.createElement('div');
  probe.style.cssText = 'position:fixed;visibility:hidden;padding:env(safe-area-inset-top) 0 env(safe-area-inset-bottom)';
  document.body.appendChild(probe);
  const box = document.createElement('pre');
  box.style.cssText = 'position:fixed;top:40%;left:8px;right:8px;z-index:9999;background:#13243D;color:#fff;padding:10px;font:12px monospace;white-space:pre-wrap';
  const show = () => {
    const cs = getComputedStyle(probe);
    box.textContent = [
      `innerHeight ${innerHeight} · screen ${screen.width}x${screen.height}`,
      `visualViewport ${Math.round(visualViewport?.height ?? 0)} · docEl ${document.documentElement.clientHeight}`,
      `safe-area top ${cs.paddingTop} · bottom ${cs.paddingBottom}`,
      `standalone ${matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true}`,
    ].join('\n');
  };
  document.body.appendChild(box);
  show();
  addEventListener('resize', show);
}
