/**
 * PDF生成相关的类型定义
 */

/**
 * PDF生成配置选项
 */
export interface PdfGenerationOptions {
  /** 页眉元素 */
  headerElement: HTMLElement;
  /** 内容元素 */
  contentElement: HTMLElement;
  /** 页脚元素 */
  footerElement: HTMLElement;
  /** 页脚更新回调函数 */
  onFooterUpdate: (
    currentPage: number,
    totalPages: number
  ) => Promise<void> | void;
}

/**
 * 页面分割坐标信息
 */
export interface PageBreakCoordinate {
  /** 起始Y坐标 */
  startY: number;
  /** 结束Y坐标 */
  endY: number;
  /** 是否为表格边框分割点 */
  isTableBorderBreak: boolean;
}

/**
 * 页面分析结果接口
 */
export interface PageBreakAnalysisResult {
  /** 是否为干净的分页点 */
  isCleanBreakPoint: boolean;
  /** 是否为表格边框 */
  isTableBorder: boolean;
}

/**
 * 最优分页点查找结果
 */
export interface OptimalBreakPointResult {
  /** 切割Y坐标 */
  cutY: number;
  /** 是否为表格边框 */
  isTableBorder: boolean;
}

/**
 * 缩放尺寸信息
 */
export interface ScaledDimensions {
  /** 缩放后宽度 */
  width: number;
  /** 缩放后高度 */
  height: number;
}
