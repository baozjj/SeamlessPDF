/**
 * 页面处理器
 * 负责PDF页面的生成和处理逻辑
 */

import jsPDF from "jspdf";
import type {
  CanvasElements,
  PageLayoutMetrics,
  PageBreakCoordinate,
  PdfGenerationOptions,
} from "../types";
import { preRenderAllFooters, renderSinglePage } from "../rendering";

/**
 * 生成最终的PDF文档
 *
 * @param config - PDF文档生成配置
 * @returns Promise<jsPDF> - 生成的PDF文档
 */
export async function generatePdfDocument({
  canvasElements,
  layoutMetrics,
  pageBreakCoordinates,
  footerElement,
  onFooterUpdate,
}: {
  canvasElements: CanvasElements;
  layoutMetrics: PageLayoutMetrics;
  pageBreakCoordinates: PageBreakCoordinate[];
  footerElement: HTMLElement;
  onFooterUpdate: PdfGenerationOptions["onFooterUpdate"];
}): Promise<jsPDF> {
  const pdf = new jsPDF("portrait", "pt", "a4");
  const totalPages = pageBreakCoordinates.length;

  // 预渲染所有页脚（并行处理）
  console.log("开始预渲染所有页脚...");
  const footerPreRenderStartTime = performance.now();
  const preRenderedFooters = await preRenderAllFooters({
    footerElement,
    totalPages,
    onFooterUpdate,
  });
  const footerPreRenderEndTime = performance.now();
  const footerPreRenderTime = footerPreRenderEndTime - footerPreRenderStartTime;
  console.log(`页脚预渲染耗时: ${footerPreRenderTime.toFixed(2)}ms`);

  // 渲染所有页面（页脚已预渲染）
  console.log("开始渲染所有页面...");
  const pageRenderStartTime = performance.now();

  for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
    console.log(`第${pageIndex + 1}页开始渲染`);
    const pageStartTime = performance.now();

    if (pageIndex > 0) {
      pdf.addPage();
    }

    await renderSinglePage({
      pdf,
      pageIndex,
      canvasElements,
      layoutMetrics,
      pageBreakCoordinates,
      preRenderedFooter: preRenderedFooters[pageIndex],
    });

    const pageEndTime = performance.now();
    const pageTime = pageEndTime - pageStartTime;
    console.log(`第${pageIndex + 1}页耗时: ${pageTime.toFixed(2)}ms`);
  }

  const pageRenderEndTime = performance.now();
  const pageRenderTime = pageRenderEndTime - pageRenderStartTime;
  console.log(`所有页面渲染耗时: ${pageRenderTime.toFixed(2)}ms`);

  return pdf;
}
