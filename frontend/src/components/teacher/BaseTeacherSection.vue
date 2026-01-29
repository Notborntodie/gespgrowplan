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
  background: linear-gradient(135deg, #87ceeb 0%, #b3d9ff 50%, #cce5ff 100%);
  padding: 0;
  border-radius: 20px;
  box-shadow: 0 8px 24px rgba(30, 144, 255, 0.2);
  width: 100%;
  margin: 0 auto 32px auto;
  border: 4px solid #87ceeb;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 28px;
  flex-wrap: wrap;
  gap: 12px;
  background: linear-gradient(135deg, #87ceeb 0%, #b3d9ff 50%, #cce5ff 100%);
  border-bottom: none;
  position: sticky;
  top: 0;
  z-index: 10;
  flex-shrink: 0;
  box-shadow: none;
  margin-bottom: 0;
}

.section-header .header-left {
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
}

.section-header h2 {
  margin: 0;
  color: #0c4a6e;
  font-size: 2rem;
  font-weight: 900;
  text-shadow: 0 2px 4px rgba(255, 255, 255, 0.5);
}

.section-header .header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.table-container {
  width: 100%;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0;
  min-height: 0;
  background: transparent;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: rgba(30, 144, 255, 0.3) transparent;
}

.table-container::-webkit-scrollbar {
  width: 8px;
}

.table-container::-webkit-scrollbar-track {
  background: transparent;
}

.table-container::-webkit-scrollbar-thumb {
  background: rgba(30, 144, 255, 0.3);
  border-radius: 4px;
}

.table-container::-webkit-scrollbar-thumb:hover {
  background: rgba(30, 144, 255, 0.5);
}
</style>

