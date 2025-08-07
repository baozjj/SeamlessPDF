/**
 * 页面布局模块统一导出
 */

// 分页分析器
export {
  analyzePageBreakLine,
  findOptimalPageBreak,
} from './page-break-analyzer';

// 布局计算器
export {
  calculatePageLayoutMetrics,
  calculateIntelligentPageBreaks,
  detectBlankLastPage,
  calculateScaledContentHeight,
} from './layout-calculator';
