<template>
  <div ref="el" class="report-content">
    <h2>1. Executive Summary</h2>
    <p>
      Lorem ipsum dolor sit amet, consectetur adipiscing elit. ... (add a long
      paragraph) ...
    </p>

    <h2>2. Performance Metrics</h2>
    <p>
      The following table showcases key performance indicators for the last
      quarter. The intelligent PDF exporter will attempt to avoid splitting this
      table across a page break.
    </p>

    <t-table
      row-key="index"
      :data="tableData"
      :columns="columns"
      :bordered="true"
    ></t-table>

    <h2>3. Visual Data</h2>
    <p>
      A picture is worth a thousand words. This section includes graphical
      representations of our growth. The exporter will ensure this image is not
      cut in half.
    </p>

    <h2>4. Concluding Remarks</h2>
    <p>... (add another very long paragraph to ensure multiple pages) ...</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { Table as TTable } from "tdesign-vue-next";

const el = ref<HTMLElement | null>(null);
defineExpose({ el });

const columns = [
  { colKey: "id", title: "ID" },
  { colKey: "name", title: "Metric Name" },
  { colKey: "value", title: "Value" },
  { colKey: "change", title: "Change (%)" },
];
const tableData = Array.from({ length: 40 }, (_, i) => ({
  index: i + 1,
  id: `METRIC-${100 + i}`,
  name: `Key Performance Indicator ${i + 1}`,
  value: (Math.random() * 1000).toFixed(2),
  change: (Math.random() * 20 - 10).toFixed(2),
}));
</script>

<style scoped>
.report-content {
  background: white;
  padding: 20px;
}
.report-content h2 {
  margin-top: 2rem;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
}
p {
  line-height: 1.6;
}
</style>
