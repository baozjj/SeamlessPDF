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
import { ref, reactive, onMounted, nextTick } from "vue";
import {
  Button as TButton,
  Icon as TIcon,
  MessagePlugin,
} from "tdesign-vue-next";
import { generateIntelligentPdf } from "@/pdf-generator/index";
import type jsPDF from "jspdf";

import ReportHeader from "@/components/ReportHeader.vue";
import ReportContent from "@/components/ReportContent.vue";
import ReportFooter from "@/components/ReportFooter.vue";

defineOptions({
  name: "PdfGenerator",
});

// PDF 生成状态枚举
enum PdfGenerationStatus {
  NOT_STARTED = "NOT_STARTED",
  GENERATING = "GENERATING",
  COMPLETED = "COMPLETED",
}

const isExporting = ref(false);

const reportHeader = ref();
const reportContent = ref();
const reportFooter = ref();

const footerState = reactive({ currentPage: 1, totalPages: 1 });

// PDF 预生成相关状态
const pdfGenerationStatus = ref<PdfGenerationStatus>(
  PdfGenerationStatus.NOT_STARTED
);
const preGeneratedPdf = ref<jsPDF | null>(null);
const pdfGenerationError = ref<Error | null>(null);

/**
 * 预生成 PDF
 * 在页面加载完成后自动在后台生成 PDF
 */
const preGeneratePdf = async () => {
  const headerElement = reportHeader.value?.$el as HTMLElement;
  const contentElement = reportContent.value?.$el as HTMLElement;
  const footerElement = reportFooter.value?.$el as HTMLElement;

  if (!headerElement || !contentElement || !footerElement) {
    console.warn("报告组件尚未完全加载，无法预生成 PDF");
    return;
  }

  pdfGenerationStatus.value = PdfGenerationStatus.GENERATING;
  pdfGenerationError.value = null;

  try {
    console.log("开始预生成 PDF...");
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
    console.log(`PDF 预生成完成，耗时: ${generateTime.toFixed(2)}ms`);

    preGeneratedPdf.value = pdf;
    pdfGenerationStatus.value = PdfGenerationStatus.COMPLETED;
  } catch (error) {
    console.error("PDF 预生成失败:", error);
    pdfGenerationError.value = error as Error;
    pdfGenerationStatus.value = PdfGenerationStatus.NOT_STARTED;
  }
};

/**
 * 导出 PDF
 * 如果 PDF 已预生成完成，则立即下载
 * 如果 PDF 正在生成中，则等待生成完成后下载
 * 如果 PDF 未开始生成或生成失败，则重新生成
 */
const handleExport = async () => {
  console.log("开始导出");
  const startTime = performance.now();

  isExporting.value = true;

  try {
    let pdf: jsPDF;

    // 情况1: PDF 已经预生成完成，直接使用
    if (
      pdfGenerationStatus.value === PdfGenerationStatus.COMPLETED &&
      preGeneratedPdf.value
    ) {
      console.log("使用预生成的 PDF");
      pdf = preGeneratedPdf.value;
    }
    // 情况2: PDF 正在生成中，等待生成完成
    else if (pdfGenerationStatus.value === PdfGenerationStatus.GENERATING) {
      console.log("PDF 正在生成中，等待完成...");

      // 轮询等待 PDF 生成完成
      await new Promise<void>((resolve, reject) => {
        const checkInterval = setInterval(() => {
          if (
            pdfGenerationStatus.value === PdfGenerationStatus.COMPLETED &&
            preGeneratedPdf.value
          ) {
            clearInterval(checkInterval);
            resolve();
          } else if (
            pdfGenerationStatus.value === PdfGenerationStatus.NOT_STARTED
          ) {
            clearInterval(checkInterval);
            reject(pdfGenerationError.value || new Error("PDF 生成失败"));
          }
        }, 100);
      });

      console.log("PDF 生成完成，开始导出");
      pdf = preGeneratedPdf.value!;
    }
    // 情况3: PDF 未开始生成或生成失败，重新生成
    else {
      console.log("重新生成 PDF...");
      const headerElement = reportHeader.value?.$el as HTMLElement;
      const contentElement = reportContent.value?.$el as HTMLElement;
      const footerElement = reportFooter.value?.$el as HTMLElement;

      if (!headerElement || !contentElement || !footerElement) {
        MessagePlugin.error("报告组件尚未完全加载，请稍候重试。");
        return;
      }

      const generateStartTime = performance.now();
      pdf = await generateIntelligentPdf({
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
    }

    // 导出 PDF
    console.log("开始导出 PDF...");
    const exportStartTime = performance.now();
    await pdf.save(`报告.pdf`, {
      returnPromise: true,
    });
    const exportEndTime = performance.now();
    const exportTime = exportEndTime - exportStartTime;
    console.log(`PDF 导出耗时: ${exportTime.toFixed(2)}ms`);

    const endTime = performance.now();
    const totalTime = endTime - startTime;
    console.log(`总耗时: ${totalTime.toFixed(2)}ms`);
    MessagePlugin.success(`导出成功，耗时: ${totalTime.toFixed(2)}ms`);
  } catch (error) {
    console.error("PDF 导出失败:", error);
    MessagePlugin.error("PDF 导出失败，请重试。");
  } finally {
    isExporting.value = false;
  }
};

// 页面加载完成后预生成 PDF
onMounted(async () => {
  // 使用 nextTick 确保所有组件都已渲染完成
  await nextTick();
  preGeneratePdf();
});
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
