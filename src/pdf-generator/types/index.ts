/**
 * 类型定义统一导出
 */

// PDF生成相关类型
export type {
  PdfGenerationOptions,
  PageBreakCoordinate,
  PageBreakAnalysisResult,
  OptimalBreakPointResult,
  ScaledDimensions,
} from './pdf-generation.types';

// 页面布局相关类型
export type {
  PageLayoutMetrics,
  CanvasElements,
  TableBorderDetectionResult,
  LineCharacteristics,
} from './page-layout.types';

// 渲染相关类型
export type {
  IframeRenderOptions,
  SerializedElement,
  RenderDataTransferObject,
  CanvasRenderResult,
  MessageEventData,
} from './rendering.types';
