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
 * 采用"渲染后分析"策略，先将整个内容渲染为Canvas，
 * 然后通过像素级分析找到最佳分页点，避免在文本或表格中间分页
 */
export async function generateIntelligentPdf({
  headerElement,
  contentElement,
  footerElement,
  onFooterUpdate,
}: PdfGenerationOptions): Promise<jsPDF> {
  // 第一阶段：将页面元素转换为Canvas
  const canvasElements = await renderElementsToCanvas({
    headerElement,
    contentElement,
    footerElement,
  });

  // 第二阶段：计算页面布局参数
  const layoutMetrics = calculatePageLayoutMetrics(canvasElements);

  // 第三阶段：分页计算
  const pageBreakCoordinates = calculateIntelligentPageBreaks(
    canvasElements.content,
    layoutMetrics.contentPageHeightInPixels
  );

  // 第四阶段：生成PDF文档
  const pdf = await generatePdfDocument({
    canvasElements,
    layoutMetrics,
    pageBreakCoordinates,
    footerElement,
    onFooterUpdate,
  });

  return pdf;
}
