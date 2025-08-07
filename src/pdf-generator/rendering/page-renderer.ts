/**
 * 页面渲染器
 * 负责PDF页面的渲染逻辑
 */

import jsPDF from "jspdf";
import type {
  CanvasElements,
  PageLayoutMetrics,
  PageBreakCoordinate,
} from "../types";
import { A4_PAGE_DIMENSIONS } from "../constants";
import { createContentSliceCanvas } from "../utils";
import { calculateScaledContentHeight } from "../layout";

/**
 * 渲染单个页面
 *
 * @param config - 页面渲染配置
 */
export async function renderSinglePage({
  pdf,
  pageIndex,
  canvasElements,
  layoutMetrics,
  pageBreakCoordinates,
  preRenderedFooter,
}: {
  pdf: jsPDF;
  pageIndex: number;
  canvasElements: CanvasElements;
  layoutMetrics: PageLayoutMetrics;
  pageBreakCoordinates: PageBreakCoordinate[];
  preRenderedFooter: HTMLCanvasElement;
}): Promise<void> {
  // 渲染页眉
  renderPageHeader(pdf, canvasElements.header, layoutMetrics.headerHeight);

  // 渲染页面内容
  await renderPageContent({
    pdf,
    pageIndex,
    canvasElements,
    layoutMetrics,
    pageBreakCoordinates,
  });

  // 渲染页脚（使用预渲染的页脚）
  pdf.addImage(
    preRenderedFooter,
    "JPEG",
    0,
    A4_PAGE_DIMENSIONS.HEIGHT - layoutMetrics.footerHeight,
    A4_PAGE_DIMENSIONS.WIDTH,
    layoutMetrics.footerHeight
  );
}

/**
 * 渲染页眉
 *
 * @param pdf - PDF文档实例
 * @param headerCanvas - 页眉Canvas
 * @param headerHeight - 页眉高度
 */
function renderPageHeader(
  pdf: jsPDF,
  headerCanvas: HTMLCanvasElement,
  headerHeight: number
): void {
  pdf.addImage(
    headerCanvas.toDataURL("image/jpeg", 1.0),
    "JPEG",
    0,
    0,
    A4_PAGE_DIMENSIONS.WIDTH,
    headerHeight
  );
}

/**
 * 渲染页面内容
 *
 * @param config - 内容渲染配置
 */
async function renderPageContent({
  pdf,
  pageIndex,
  canvasElements,
  layoutMetrics,
  pageBreakCoordinates,
}: {
  pdf: jsPDF;
  pageIndex: number;
  canvasElements: { content: HTMLCanvasElement };
  layoutMetrics: PageLayoutMetrics;
  pageBreakCoordinates: PageBreakCoordinate[];
}): Promise<void> {
  const { startY, endY } = pageBreakCoordinates[pageIndex];
  const contentSliceCanvas = createContentSliceCanvas(
    canvasElements.content,
    startY,
    endY
  );

  const scaledContentHeight = calculateScaledContentHeight(
    endY - startY,
    layoutMetrics.contentPageHeightInPixels,
    layoutMetrics.contentRegionHeight
  );

  pdf.addImage(
    contentSliceCanvas.toDataURL("image/jpeg", 1.0),
    "JPEG",
    0,
    layoutMetrics.headerHeight,
    A4_PAGE_DIMENSIONS.WIDTH,
    scaledContentHeight
  );
}
