<template>
  <div class="pdf-generator-container">
    <t-button
      @click="handleExport"
      :loading="isExporting"
      theme="primary"
      size="large"
    >
      <template #icon><t-icon name="download" /></template>
      导出为PDF
    </t-button>

    <div id="pdf-preview" class="report-preview">
      <ReportHeader ref="reportHeader" />
      <ReportContent ref="reportContent" />
      <ReportFooter ref="reportFooter" :page-info="footerState" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import {
  Button as TButton,
  Icon as TIcon,
  MessagePlugin,
} from "tdesign-vue-next";
import { generateIntelligentPdf } from "@/pdf-generator/index";

import ReportHeader from "@/components/ReportHeader.vue";
import ReportContent from "@/components/ReportContent.vue";
import ReportFooter from "@/components/ReportFooter.vue";

const isExporting = ref(false);

const reportHeader = ref();
const reportContent = ref();
const reportFooter = ref();

const footerState = reactive({ currentPage: 1, totalPages: 1 });

const handleExport = async () => {
  console.log("开始导出");

  const startTime = performance.now();
  const headerElement = reportHeader.value?.$el as HTMLElement;
  const contentElement = reportContent.value?.$el as HTMLElement;
  const footerElement = reportFooter.value?.$el as HTMLElement;

  if (!headerElement || !contentElement || !footerElement) {
    MessagePlugin.error("报告组件尚未完全加载，请稍候重试。");
    return;
  }

  isExporting.value = true;

  try {
    console.log("开始生成 PDF...");
    const generateStartTime = performance.now();
    const pdf = await generateIntelligentPdf({
      headerElement,
      contentElement,
      footerElement,
      onFooterUpdate: (currentPage: number, totalPages: number) => {
        footerState.currentPage = currentPage;
        footerState.totalPages = totalPages;
      },
    });

    const generateEndTime = performance.now();
    const generateTime = generateEndTime - generateStartTime;
    console.log(`PDF 生成耗时: ${generateTime.toFixed(2)}ms`);

    console.log("开始导出 PDF...");
    const exportStartTime = performance.now();
    await pdf.save(`报告.pdf`, {
      returnPromise: true,
    });
    const exportEndTime = performance.now();
    const exportTime = exportEndTime - exportStartTime;
    console.log(`PDF 导出耗时: ${exportTime.toFixed(2)}ms`);
  } catch (error) {
    console.error("PDF 生成失败:", error);
    MessagePlugin.error("PDF 生成失败，请重试。");
  } finally {
    const endTime = performance.now();
    const time = endTime - startTime;
    console.log(`总耗时: ${time.toFixed(2)}ms`);
    MessagePlugin.success(`总耗时: ${time.toFixed(2)}ms`);
    isExporting.value = false;
  }
};
</script>

<style scoped>
.pdf-generator-container {
  padding: 2rem;
  background-color: #f0f2f5;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
}
.report-preview {
  width: 800px;
  margin: 0 auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style>
