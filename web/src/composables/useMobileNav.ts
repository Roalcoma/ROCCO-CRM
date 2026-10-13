// Estado compartido de la navegación móvil: las vistas pueden ocultar la barra inferior
// (p. ej. Mensajes con un chat abierto, para que no choque con la caja de escribir).
import { ref } from 'vue';

export const hideMobileTabBar = ref(false);
