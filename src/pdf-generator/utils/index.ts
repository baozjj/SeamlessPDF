/**
 * 工具函数统一导出
 */

// Canvas工具函数
export {
  captureElementAsCanvas,
  calculateScaledDimensions,
  isCanvasVisuallyWhite,
  extractPageContentCanvas,
  createContentSliceCanvas,
} from './canvas-utils';

// 颜色分析工具
export {
  analyzeColorDistribution,
  determineLineCharacteristics,
  isLineCompletelyWhite,
} from './color-analyzer';

// 表格检测工具
export {
  detectTableBorderRegion,
  findTableBorderBottom,
} from './table-detector';
