<template>
  <header ref="el" class="report-header">
    <h1>季度业务报告</h1>
    <p>生成日期：{{ new Date().toLocaleDateString() }}</p>
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
