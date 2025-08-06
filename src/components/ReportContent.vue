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

    <h2>3. 图片渲染测试</h2>
    <p>
      以下是不同类型图片的渲染测试，用于验证 snapDOM
      在各种场景下的图片处理能力：
    </p>

    <!-- Base64 编码图片测试 -->
    <div class="image-test-section">
      <h3>3.1 Base64 编码图片</h3>
      <p>这是一个 base64 编码的小图标，应该能在所有环境中正常显示：</p>
      <img
        :src="base64LargeImage"
        alt="Base64 测试图片"
        class="test-image small"
      />
    </div>

    <!-- SVG 图片测试 -->
    <div class="image-test-section">
      <h3>3.2 内联 SVG 图片</h3>
      <p>内联 SVG 图形，测试矢量图形的渲染效果：</p>
      <svg width="100" height="100" class="test-image small">
        <circle
          cx="50"
          cy="50"
          r="40"
          stroke="black"
          stroke-width="3"
          fill="red"
        />
        <text x="50" y="55" text-anchor="middle" fill="white" font-size="12">
          SVG
        </text>
      </svg>
    </div>

    <h2>4. 总结与展望</h2>
    <p>
      综合本季度的各项数据表现，我们在既定战略目标的指引下取得了预期成果。展望未来，我们将继续深化产品创新，优化用户体验，扩大市场份额。同时，我们将加强内部运营管理，提升组织效能，为可持续发展奠定坚实基础。通过持续的技术投入和人才培养，我们有信心在下一季度实现更大突破。
    </p>
    <h2>4. 总结与展望</h2>
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

// Base64 编码的较大测试图片（彩色方块）
const base64LargeImage = ref(
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzAwNjZjYyIvPgogIDx0ZXh0IHg9IjEwMCIgeT0iNTUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkJhc2U2NCBJbWFnZTwvdGV4dD4KPC9zdmc+"
);

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
