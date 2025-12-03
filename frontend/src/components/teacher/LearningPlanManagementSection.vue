<template>
  <section class="content-section learning-plan-section">
    <LeaningPlanManagement mode="teacher" />
  </section>
</template>

<script setup lang="ts">
import LeaningPlanManagement from '@/components/admin/LeaningPlanManagement.vue'
</script>

<style scoped>
.content-section.learning-plan-section {
  padding: 0;
  background: transparent;
  border: none;
  box-shadow: none;
}
</style>

