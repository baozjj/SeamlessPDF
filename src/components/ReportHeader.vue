<template>
  <header ref="el" class="report-header">
    <h1>Quarterly Business Report</h1>
    <p>Generated on: {{ new Date().toLocaleDateString() }}</p>
  </header>
</template>

<script setup lang="ts">
import { ref } from "vue";

const el = ref<HTMLElement | null>(null);
defineExpose({ el });
</script>

<style scoped>
.report-header {
  text-align: center;
  background: white;
  padding: 20px;
}
</style>
