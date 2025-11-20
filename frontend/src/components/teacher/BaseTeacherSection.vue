<template>
  <section class="content-section">
    <div class="section-header">
      <div class="header-left">
        <h2>{{ title }}</h2>
        <slot name="filters"></slot>
      </div>
      <div class="header-right">
        <slot name="header-right"></slot>
      </div>
    </div>
    
    <div class="table-container">
      <slot name="content"></slot>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>

<style scoped>
.content-section {
  background: #f8fafc;
  padding: 32px 24px;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  width: 100%;
  margin: 0 auto 32px auto;
  border: 1px solid #e2e8f0;
  box-sizing: border-box;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.section-header .header-left {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.section-header h2 {
  margin: 0;
  color: #1e293b;
  font-size: 1.8rem;
  font-weight: 700;
}

.section-header .header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.table-container {
  width: 100%;
}
</style>

