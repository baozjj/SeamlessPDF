/**
 * PDF生成器常量定义
 */

/** A4页面尺寸（单位：pt） */
export const A4_PAGE_DIMENSIONS = {
  WIDTH: 595.28,
  HEIGHT: 841.89,
} as const;

/** 表格边框颜色（RGB格式） */
export const TABLE_BORDER_RGB_COLOR = "221,221,221";

/** 纯白色RGB值 */
export const PURE_WHITE_RGB_COLOR = "255,255,255";

/** 表格线识别的最小占比阈值 */
export const TABLE_LINE_RATIO_THRESHOLD = 0.8;

/** 默认白色像素判断阈值 */
export const DEFAULT_WHITE_PIXEL_THRESHOLD = 250;

/** 默认空白页高度阈值（像素） */
export const DEFAULT_BLANK_PAGE_HEIGHT_THRESHOLD = 100;

/** 表格边框检测的向上偏移量（像素） */
export const TABLE_BORDER_HEIGHT = 4;

/** 表格分割调整偏移量（单位：px） */
export const TABLE_BREAK_ADJUSTMENT_OFFSET = 4;

/** 渲染超时时间（毫秒） */
export const RENDER_TIMEOUT_MS = 30000;

/** 图片加载超时时间（毫秒） */
export const IMAGE_LOAD_TIMEOUT_MS = 10000;

/** 默认设备像素比缩放因子 */
export const DEFAULT_SCALE_FACTOR = 2;
