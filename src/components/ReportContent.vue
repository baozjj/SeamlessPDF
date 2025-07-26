<template>
  <div ref="el" class="report-content">
    <h2>1. 执行摘要</h2>
    <p>
      本季度业务发展稳健，各项核心指标均呈现积极态势。通过持续的产品优化和市场拓展，我们在用户增长、收入提升和运营效率等方面取得了显著成果。智能PDF导出系统将确保本段落不会在页面分割时被截断，保持内容的完整性和可读性。
    </p>

    <h2>2. 绩效指标</h2>
    <p>
      下表展示了上季度的关键绩效指标。智能PDF导出器将尽力避免在分页时拆分此表格，确保数据的完整呈现。
    </p>

    <t-table
      row-key="index"
      :data="tableData"
      :columns="columns"
      :bordered="true"
    ></t-table>

    <h2>3. 总结与展望</h2>
    <p>
      综合本季度的各项数据表现，我们在既定战略目标的指引下取得了预期成果。展望未来，我们将继续深化产品创新，优化用户体验，扩大市场份额。同时，我们将加强内部运营管理，提升组织效能，为可持续发展奠定坚实基础。通过持续的技术投入和人才培养，我们有信心在下一季度实现更大突破。
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { Table as TTable } from "tdesign-vue-next";

const el = ref<HTMLElement | null>(null);
defineExpose({ el });

const columns = [
  { colKey: "id", title: "指标编号" },
  { colKey: "name", title: "指标名称" },
  { colKey: "value", title: "数值" },
  { colKey: "change", title: "变化率 (%)" },
];
const tableData = Array.from({ length: 40 }, (_, i) => ({
  index: i + 1,
  id: `KPI-${100 + i}`,
  name: `关键绩效指标 ${i + 1}`,
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
