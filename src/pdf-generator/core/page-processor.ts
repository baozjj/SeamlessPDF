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
import { yieldToMain } from "../utils";

/**
 * 生成最终的PDF文档
 * 
 */
export async function generatePdfDocument({
  canvasElements,
  layoutMetrics,
  pageBreakCoordinates,
  footerElement,
  onFooterUpdate
}: {
  canvasElements: CanvasElements;
  layoutMetrics: PageLayoutMetrics;
  pageBreakCoordinates: PageBreakCoordinate[];
  footerElement: HTMLElement;
  onFooterUpdate: PdfGenerationOptions["onFooterUpdate"];
  batchSize?: number;
}): Promise<jsPDF> {
  const pdf = new jsPDF("portrait", "pt", "a4");
  const totalPages = pageBreakCoordinates.length;

  // 预渲染所有页脚（并行处理）
  const preRenderedFooters = await preRenderAllFooters({
    footerElement,
    totalPages,
    onFooterUpdate,
  });

  // 渲染所有页面
  for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
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

    await yieldToMain();
  }

  return pdf;
}
