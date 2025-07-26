<template>
  <footer ref="el" class="report-footer">
    <span>Confidential & Proprietary</span>
    <span>Page {{ pageInfo.currentPage }} of {{ pageInfo.totalPages }}</span>
  </footer>
</template>

<script setup lang="ts">
import { ref } from "vue";

defineProps<{
  pageInfo: { currentPage: number; totalPages: number };
}>();

const el = ref<HTMLElement | null>(null);
defineExpose({ el });
</script>

<style scoped>
.report-footer {
  padding-top: 1rem;
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #666;
  background: white;
  padding: 20px;
}
</style>
