/**
 * 工具函数统一导出
 */

export {
  captureElementAsCanvas,
  calculateScaledDimensions,
  isCanvasVisuallyWhite,
  createCanvasSlice,
} from './canvas-utils';

export {
  analyzeColorDistribution,
  determineLineCharacteristics,
  isLineCompletelyWhite,
} from './color-analyzer';

export {
  detectTableBorderRegion,
  findTableBorderBottom,
} from './table-detector';
