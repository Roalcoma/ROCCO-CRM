<script setup lang="ts">
import NavBar from './components/NavBar.vue';
import HeroSection from './components/HeroSection.vue';
import AboutSection from './components/AboutSection.vue';
import RoccoIntro from './components/RoccoIntro.vue';
import FeaturesSection from './components/FeaturesSection.vue';
import AutomationFlow from './components/AutomationFlow.vue';
import ServicesSection from './components/ServicesSection.vue';
import PricingSection from './components/PricingSection.vue';
import FaqSection from './components/FaqSection.vue';
import CtaSection from './components/CtaSection.vue';
import FooterSection from './components/FooterSection.vue';
import WhatsAppFloat from './components/WhatsAppFloat.vue';
</script>

<template>
  <NavBar />
  <main>
    <HeroSection />
    <AboutSection />
    <RoccoIntro />
    <FeaturesSection />
    <AutomationFlow />
    <ServicesSection />
    <PricingSection />
    <FaqSection />
    <CtaSection />
  </main>
  <FooterSection />
  <WhatsAppFloat />
</template>
