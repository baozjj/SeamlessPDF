/**
 * PDF生成器核心控制器
 * 负责PDF生成的主流程控制
 */

import jsPDF from "jspdf";
import type { PdfGenerationOptions } from "../types";
import { renderElementsToCanvas } from "../rendering";
import {
  calculatePageLayoutMetrics,
  calculateIntelligentPageBreaks,
} from "../layout";
import { generatePdfDocument } from "./page-processor";

/**
 * 生成分页的PDF文档
 *
 * 该函数采用"渲染后分析"策略，先将整个内容渲染为Canvas，
 * 然后通过像素级分析找到最佳分页点，避免在文本或表格中间分页。
 *
 * @param options - PDF生成配置选项
 * @returns Promise<jsPDF> - 生成的PDF文档实例
 */
export async function generateIntelligentPdf({
  headerElement,
  contentElement,
  footerElement,
  onFooterUpdate,
}: PdfGenerationOptions): Promise<jsPDF> {
  console.log("🚀 开始PDF生成流程...");
  const totalStartTime = performance.now();

  // 第一阶段：将页面元素转换为Canvas
  const renderStartTime = performance.now();
  const canvasElements = await renderElementsToCanvas({
    headerElement,
    contentElement,
    footerElement,
  });
  const renderEndTime = performance.now();
  const renderTime = renderEndTime - renderStartTime;
  console.log(`✅ 第一阶段（Canvas渲染）耗时: ${renderTime.toFixed(2)}ms`);

  // 第二阶段：计算页面布局参数
  const layoutStartTime = performance.now();
  const layoutMetrics = calculatePageLayoutMetrics(canvasElements);
  const layoutEndTime = performance.now();
  const layoutTime = layoutEndTime - layoutStartTime;
  console.log(`✅ 第二阶段（布局计算）耗时: ${layoutTime.toFixed(2)}ms`);

  // 第三阶段：分页计算
  const pageBreakStartTime = performance.now();
  const pageBreakCoordinates = calculateIntelligentPageBreaks(
    canvasElements.content,
    layoutMetrics.contentPageHeightInPixels
  );
  const pageBreakEndTime = performance.now();
  const pageBreakTime = pageBreakEndTime - pageBreakStartTime;
  console.log(`✅ 第三阶段（分页计算）耗时: ${pageBreakTime.toFixed(2)}ms`);

  // 第四阶段：生成PDF文档
  const pdfGenerationStartTime = performance.now();
  const pdf = await generatePdfDocument({
    canvasElements,
    layoutMetrics,
    pageBreakCoordinates,
    footerElement,
    onFooterUpdate,
  });
  const pdfGenerationEndTime = performance.now();
  const pdfGenerationTime = pdfGenerationEndTime - pdfGenerationStartTime;
  console.log(`✅ 第四阶段（PDF生成）耗时: ${pdfGenerationTime.toFixed(2)}ms`);

  const totalEndTime = performance.now();
  const totalTime = totalEndTime - totalStartTime;
  console.log(`🎉 PDF生成完成，总耗时: ${totalTime.toFixed(2)}ms`);

  return pdf;
}
