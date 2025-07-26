<template>
  <div class="app-container">
    <div class="controls">
      <t-button
        @click="handleExport"
        :loading="isExporting"
        theme="primary"
        size="large"
      >
        <template #icon><t-icon name="download" /></template>
        导出为PDF
      </t-button>
    </div>

    <div id="pdf-preview" class="report-preview">
      <ReportHeader ref="reportHeader" />
      <ReportContent ref="reportContent" />
      <ReportFooter ref="reportFooter" :page-info="footerState" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import type { ComponentPublicInstance } from "vue";
import {
  Button as TButton,
  Icon as TIcon,
  MessagePlugin,
} from "tdesign-vue-next";
import { generateQuotePDF } from "@/pdf-generator/generateQuotePDF";

import ReportHeader from "@/components/ReportHeader.vue";
import ReportContent from "@/components/ReportContent.vue";
import ReportFooter from "@/components/ReportFooter.vue";

const isExporting = ref(false);

// 使用refs获取组件实例，并通过$el获取其根DOM元素
const reportHeader = ref<ComponentPublicInstance>();
const reportContent = ref<ComponentPublicInstance>();
const reportFooter = ref<ComponentPublicInstance>();

const footerState = reactive({ currentPage: 1, totalPages: 1 });

const handleExport = async () => {
  const headerEl = reportHeader.value?.$el as HTMLElement;
  const contentEl = reportContent.value?.$el as HTMLElement;
  const footerEl = reportFooter.value?.$el as HTMLElement;

  if (!headerEl || !contentEl || !footerEl) {
    MessagePlugin.error("报告组件尚未完全加载，请稍候重试。");
    return;
  }
  isExporting.value = true;

  const pdf = await generateQuotePDF({
    headerEl,
    contentEl,
    footerEl,
    updateFooter: (pageIndex: number, totalPages: number) => {
      footerState.currentPage = pageIndex;
      footerState.totalPages = totalPages;
    },
  });

  await pdf.save(`aaa.pdf`, {
    returnPromise: true,
  });
  isExporting.value = false;
};
</script>

<style scoped>
.app-container {
  padding: 2rem;
  background-color: #f0f2f5;
}
.controls {
  margin-bottom: 2rem;
  text-align: center;
}
.report-preview {
  width: 800px;
  margin: 0 auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style>
