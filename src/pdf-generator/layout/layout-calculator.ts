/**
 * 页面布局计算器
 * 负责页面尺寸和布局参数的计算
 */

import type {
  PageLayoutMetrics,
  CanvasElements,
  PageBreakCoordinate,
} from "../types";
import {
  A4_PAGE_DIMENSIONS,
  TABLE_BREAK_ADJUSTMENT_OFFSET,
  DEFAULT_BLANK_PAGE_HEIGHT_THRESHOLD,
  DEFAULT_WHITE_PIXEL_THRESHOLD,
} from "../constants";
import {
  calculateScaledDimensions,
  isCanvasVisuallyWhite,
  createCanvasSlice,
} from "../utils";
import { findOptimalPageBreak } from "./page-break-analyzer";

/**
 * 计算页面布局度量参数
 */
export function calculatePageLayoutMetrics(
  canvasElements: CanvasElements
): PageLayoutMetrics {
  const headerHeight = calculateScaledDimensions(canvasElements.header).height;
  const footerHeight = calculateScaledDimensions(canvasElements.footer).height;
  const contentRegionHeight =
    A4_PAGE_DIMENSIONS.HEIGHT - headerHeight - footerHeight;

  const contentScaleFactor =
    A4_PAGE_DIMENSIONS.WIDTH / canvasElements.content.width;
  const contentPageHeightInPixels = contentRegionHeight / contentScaleFactor;

  return {
    headerHeight,
    footerHeight,
    contentRegionHeight,
    contentScaleFactor,
    contentPageHeightInPixels,
  };
}

/**
 * 计算智能分页坐标
 */
export function calculateIntelligentPageBreaks(
  contentCanvas: HTMLCanvasElement,
  contentPageHeightInPixels: number
): PageBreakCoordinate[] {
  const pageBreakCoordinates: PageBreakCoordinate[] = [];
  let currentOffsetY = 0;

  while (currentOffsetY < contentCanvas.height) {
    // 如果上一页为表格边框分割点，则调整当前页的起始Y坐标
    if (isPreviousPageTableBorder(pageBreakCoordinates)) {
      currentOffsetY -= TABLE_BREAK_ADJUSTMENT_OFFSET;
    }

    // 计算当前页的结束Y坐标
    const roughEndY = Math.min(
      currentOffsetY + contentPageHeightInPixels,
      contentCanvas.height
    );

    const { cutY: optimalEndY, isTableBorder } = findOptimalPageBreak(
      roughEndY,
      contentCanvas
    );
    const finalEndY = optimalEndY <= currentOffsetY ? roughEndY : optimalEndY;

    pageBreakCoordinates.push({
      startY: currentOffsetY,
      endY: finalEndY,
      isTableBorderBreak: isTableBorder,
    });

    currentOffsetY = finalEndY;
  }

  // 移除可能的空白最后一页
  removeBlankLastPageIfExists(pageBreakCoordinates, contentCanvas);

  return pageBreakCoordinates;
}

/**
 * 检查上一页是否为表格边框分割点
 */
function isPreviousPageTableBorder(
  pageBreakCoordinates: PageBreakCoordinate[]
): boolean {
  return (
    pageBreakCoordinates.length > 0 &&
    pageBreakCoordinates[pageBreakCoordinates.length - 1].isTableBorderBreak
  );
}

/**
 * 移除空白的最后一页
 */
function removeBlankLastPageIfExists(
  pageBreakCoordinates: PageBreakCoordinate[],
  contentCanvas: HTMLCanvasElement
): void {
  if (
    pageBreakCoordinates.length > 1 &&
    detectBlankLastPage(pageBreakCoordinates, contentCanvas)
  ) {
    pageBreakCoordinates.pop();
  }
}

/**
 * 检测并判断最后一页是否为空白页
 * 仅当最后一页内容高度小于指定阈值时，才进行详细的颜色检测
 */
export function detectBlankLastPage(
  pageBreakCoordinates: PageBreakCoordinate[],
  contentCanvas: HTMLCanvasElement,
  heightThreshold: number = DEFAULT_BLANK_PAGE_HEIGHT_THRESHOLD,
  whiteThreshold: number = DEFAULT_WHITE_PIXEL_THRESHOLD
): boolean {
  if (pageBreakCoordinates.length === 0) {
    return false;
  }

  const lastPageCoordinates =
    pageBreakCoordinates[pageBreakCoordinates.length - 1];
  const lastPageHeight = lastPageCoordinates.endY - lastPageCoordinates.startY;

  if (lastPageHeight > heightThreshold) {
    return false;
  }

  const lastPageCanvas = createCanvasSlice(
    contentCanvas,
    lastPageCoordinates.startY,
    lastPageCoordinates.endY
  );

  return isCanvasVisuallyWhite(lastPageCanvas, whiteThreshold);
}

/**
 * 计算缩放后的内容高度
 */
export function calculateScaledContentHeight(
  actualContentHeight: number,
  contentPageHeightInPixels: number,
  contentRegionHeight: number
): number {
  return (
    (actualContentHeight / contentPageHeightInPixels) * contentRegionHeight
  );
}
