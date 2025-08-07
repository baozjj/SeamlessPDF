/**
 * PDF生成器主入口文件
 * 统一导出所有公共API
 */

// 主要API导出
export { generateIntelligentPdf } from "./core";

// 类型定义导出
export type {
  PdfGenerationOptions,
  PageBreakCoordinate,
  PageBreakAnalysisResult,
  OptimalBreakPointResult,
  ScaledDimensions,
  PageLayoutMetrics,
  CanvasElements,
  IframeRenderOptions,
  SerializedElement,
} from "./types";

// 常量导出
export {
  A4_PAGE_DIMENSIONS,
  TABLE_BORDER_RGB_COLOR,
  PURE_WHITE_RGB_COLOR,
  TABLE_LINE_RATIO_THRESHOLD,
  DEFAULT_WHITE_PIXEL_THRESHOLD,
  DEFAULT_BLANK_PAGE_HEIGHT_THRESHOLD,
} from "./constants";

// 工具函数导出（可选，供高级用户使用）
export { calculateScaledDimensions, isCanvasVisuallyWhite } from "./utils";

export { findOptimalPageBreak } from "./layout";

export {
  calculatePageLayoutMetrics as calculateLayoutMetrics,
  calculateIntelligentPageBreaks as calculatePageBreaks,
} from "./layout";
