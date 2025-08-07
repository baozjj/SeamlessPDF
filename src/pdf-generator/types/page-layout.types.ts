/**
 * 页面布局相关的类型定义
 */

/**
 * 页面布局度量参数
 */
export interface PageLayoutMetrics {
  /** 页眉高度 */
  headerHeight: number;
  /** 页脚高度 */
  footerHeight: number;
  /** 内容区域高度 */
  contentRegionHeight: number;
  /** 内容缩放因子 */
  contentScaleFactor: number;
  /** 内容页面高度（像素） */
  contentPageHeightInPixels: number;
}

/**
 * Canvas元素集合
 */
export interface CanvasElements {
  /** 页眉Canvas */
  header: HTMLCanvasElement;
  /** 内容Canvas */
  content: HTMLCanvasElement;
  /** 页脚Canvas */
  footer: HTMLCanvasElement;
}

/**
 * 表格边框检测结果
 */
export interface TableBorderDetectionResult {
  /** 是否在边框内 */
  isWithinBorder: boolean;
  /** 边框顶部位置 */
  borderTop: number;
  /** 边框底部位置 */
  borderBottom: number;
}

/**
 * 线条特征分析结果
 */
export interface LineCharacteristics {
  /** 是否为纯白色 */
  isPureWhite: boolean;
  /** 是否为表格线 */
  isTableLine: boolean;
}
