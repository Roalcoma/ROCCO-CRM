<script setup lang="ts">
// Barra de navegación inferior para teléfono: Mensajes · Calendario · LEADS · Contactos · Más.
// Leads va al centro y destacado; las pestañas sin permiso no se muestran.
import { computed, ref, watch, onMounted } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import {
  MessagesSquare, CalendarDays, TrendingUp, BookUser, Ellipsis,
  LayoutGrid, ListChecks, Zap, SlidersHorizontal, UserCog, ArrowLeftRight, LogOut, Search, X,
} from 'lucide-vue-next';
import { useAuthStore } from '../stores/auth';
import { api } from '../api';
import { useWs } from '../composables/useWs';

const emit = defineEmits<{ switchAccount: [] }>();

const auth   = useAuthStore();
const route  = useRoute();
const router = useRouter();

const tabs = computed(() => [
  { to: '/conversations', label: 'Mensajes',   icon: MessagesSquare, match: ['/conversations'],                   module: 'conversations', main: false },
  { to: '/calendar',      label: 'Calendario', icon: CalendarDays,   match: ['/calendar'],                        module: 'calendar',      main: false },
  { to: '/opportunities', label: 'Leads',      icon: TrendingUp,     match: ['/opportunities', '/pipelines'],     module: 'opportunities', main: true  },
  { to: '/contacts',      label: 'Contactos',  icon: BookUser,       match: ['/contacts'],                        module: 'contacts',      main: false },
].filter(t => auth.can(t.module)));

const moreItems = computed(() => [
  { to: '/dashboard',        label: 'Dashboard',        icon: LayoutGrid,        show: true },
  { to: '/tasks',            label: 'Tareas',           icon: ListChecks,        show: auth.can('tasks') },
  { to: '/automations',      label: 'Automatizaciones', icon: Zap,               show: auth.can('automations') },
  { to: '/settings',         label: 'Ajustes',          icon: SlidersHorizontal, show: auth.isAdmin },
  { to: '/settings/profile', label: 'Mi perfil',        icon: UserCog,           show: true },
].filter(i => i.show));

const isActive = (m: string[]) => m.some(p => route.path.startsWith(p));
const moreActive = computed(() => !tabs.value.some(t => isActive(t.match)));

// ── Hoja "Más" ───────────────────────────────────────────────────────────────
const moreOpen = ref(false);
watch(() => route.fullPath, () => { moreOpen.value = false; });

const query = ref('');
function search() {
  const q = query.value.trim();
  if (!q) return;
  router.push({ path: '/contacts', query: { q } });
  query.value = '';
}

// ── Contador de conversaciones sin leer ──────────────────────────────────────
const unread = ref(0);
async function loadUnread() {
  if (!auth.can('conversations')) return;
  const r = await api.get<{ total: number }>('/conversations?unread=true&status=all&limit=1').catch(() => null);
  if (r) unread.value = r.total;
}
onMounted(loadUnread);
watch(() => route.path, loadUnread);
const { on } = useWs();
on('message:new', loadUnread);
on('conversation:update', loadUnread);
on('ws:reconnect', loadUnread);
</script>

<template>
  <nav class="tabbar flex-shrink-0 border-t border-slate-200 bg-white" aria-label="Navegación principal">
    <div class="flex h-16 items-stretch">
      <RouterLink
        v-for="t in tabs" :key="t.to"
        :to="t.to"
        class="tab relative flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium"
        :class="t.main ? 'text-ink' : isActive(t.match) ? 'text-[#F69008]' : 'text-slate-500'"
        :aria-current="isActive(t.match) ? 'page' : undefined"
      >
        <template v-if="t.main">
          <span
            class="presence -mt-5 flex h-12 w-12 items-center justify-center text-white shadow-lg ring-4 ring-white transition-transform active:scale-95"
            :class="isActive(t.match) ? 'bg-[#D97706] shadow-[#F69008]/40' : 'bg-[#F69008] shadow-[#F69008]/30'"
          >
            <component :is="t.icon" class="h-6 w-6" />
          </span>
          <span :class="isActive(t.match) ? 'font-semibold text-[#D97706]' : ''">{{ t.label }}</span>
        </template>
        <template v-else>
          <span v-if="isActive(t.match)" class="absolute inset-x-5 top-0 h-[3px] bg-[#F69008]"></span>
          <span class="relative">
            <component :is="t.icon" class="h-[22px] w-[22px]" />
            <span
              v-if="t.to === '/conversations' && unread > 0"
              class="absolute -right-2.5 -top-1.5 min-w-[18px] bg-red-600 px-1 text-center text-[10px] font-bold leading-[18px] text-white"
            >{{ unread > 99 ? '99+' : unread }}</span>
          </span>
          <span :class="isActive(t.match) ? 'font-semibold' : ''">{{ t.label }}</span>
        </template>
      </RouterLink>

      <button
        class="tab relative flex flex-1 cursor-pointer flex-col items-center justify-center gap-1 text-[11px] font-medium"
        :class="moreOpen || moreActive ? 'text-[#F69008]' : 'text-slate-500'"
        :aria-expanded="moreOpen"
        @click="moreOpen = !moreOpen"
      >
        <span v-if="moreActive" class="absolute inset-x-5 top-0 h-[3px] bg-[#F69008]"></span>
        <Ellipsis class="h-[22px] w-[22px]" />
        <span :class="moreActive ? 'font-semibold' : ''">Más</span>
      </button>
    </div>
  </nav>

  <!-- Hoja "Más" -->
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="moreOpen" class="fixed inset-0 z-[150] flex flex-col justify-end">
        <div class="sheet-backdrop absolute inset-0 bg-ink/40" @click="moreOpen = false" />
        <div class="sheet-panel relative bg-white shadow-lg">
          <div class="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <p class="font-display text-base font-bold text-ink">Más</p>
            <button class="cursor-pointer p-1.5 text-slate-500" aria-label="Cerrar" @click="moreOpen = false">
              <X class="h-5 w-5" />
            </button>
          </div>

          <div v-if="auth.can('contacts')" class="px-4 pt-3">
            <div class="relative">
              <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                v-model="query"
                type="search"
                enterkeyhint="search"
                placeholder="Buscar contactos…"
                class="w-full border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-[15px] focus:border-primary focus:bg-white focus:outline-none"
                @keydown.enter="search"
              />
            </div>
          </div>

          <nav class="px-2 py-2">
            <RouterLink
              v-for="i in moreItems" :key="i.to"
              :to="i.to"
              class="flex items-center gap-3 px-3 py-3 text-[15px]"
              :class="route.path === i.to || (i.to === '/settings' && route.path.startsWith('/settings/') && route.path !== '/settings/profile')
                ? 'bg-primary-light font-semibold text-ink' : 'text-slate-700 active:bg-slate-100'"
            >
              <component :is="i.icon" class="h-5 w-5 text-slate-500" />
              {{ i.label }}
            </RouterLink>
            <button
              class="flex w-full cursor-pointer items-center gap-3 px-3 py-3 text-[15px] text-slate-700 active:bg-slate-100"
              @click="moreOpen = false; emit('switchAccount')"
            >
              <ArrowLeftRight class="h-5 w-5 text-slate-500" />
              Cambiar de cuenta
            </button>
            <div class="my-1 h-px bg-slate-100"></div>
            <button
              class="flex w-full cursor-pointer items-center gap-3 px-3 py-3 text-[15px] text-red-600 active:bg-red-50"
              @click="auth.logout()"
            >
              <LogOut class="h-5 w-5" />
              Cerrar sesión
            </button>
          </nav>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* La barra respeta la zona del gesto de inicio del iPhone (app instalada) */
.tabbar { padding-bottom: env(safe-area-inset-bottom); }
.tab { -webkit-tap-highlight-color: transparent; min-height: var(--tap); }
.sheet-panel { padding-bottom: calc(env(safe-area-inset-bottom) + 0.5rem); max-height: 85dvh; overflow-y: auto; }

.sheet-enter-active, .sheet-leave-active { transition: opacity var(--duration) ease; }
.sheet-enter-active .sheet-panel, .sheet-leave-active .sheet-panel { transition: transform 220ms cubic-bezier(0.4, 0, 0.2, 1); }
.sheet-enter-from, .sheet-leave-to { opacity: 0; }
.sheet-enter-from .sheet-panel, .sheet-leave-to .sheet-panel { transform: translateY(100%); }
@media (prefers-reduced-motion: reduce) {
  .sheet-enter-active .sheet-panel, .sheet-leave-active .sheet-panel { transition: none; }
}
</style>
