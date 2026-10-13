import { createApp, type Directive } from 'vue';
import App from './App.vue';
import './style.css';

// v-reveal: aparece al entrar en pantalla. v-reveal="120" = retraso en ms.
const io = new IntersectionObserver(
  (entries) => entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
  }),
  { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
);

const reveal: Directive<HTMLElement, number | undefined> = {
  mounted(el, { value }) {
    el.classList.add('reveal');
    if (value) el.style.setProperty('--d', `${value}ms`);
    io.observe(el);
  },
};

createApp(App).directive('reveal', reveal).mount('#app');
