/**
 * 颜色分析工具函数
 */

import type { LineCharacteristics } from "../types";
import {
  TABLE_BORDER_RGB_COLOR,
  PURE_WHITE_RGB_COLOR,
  TABLE_LINE_RATIO_THRESHOLD,
} from "../constants";

/**
 * 分析图像数据中的颜色分布
 */
export function analyzeColorDistribution(
  imageData: Uint8ClampedArray
): Record<string, number> {
  const colorBuckets: Record<string, number> = {};

  for (let i = 0; i < imageData.length; i += 4) {
    const rgbKey = `${imageData[i]},${imageData[i + 1]},${imageData[i + 2]}`;
    colorBuckets[rgbKey] = (colorBuckets[rgbKey] || 0) + 1;
  }

  return colorBuckets;
}

/**
 * 确定线条特征（纯白色或表格线）
 */
export function determineLineCharacteristics(
  colorDistribution: Record<string, number>,
  lineWidth: number
): LineCharacteristics {
  const [dominantColor, pixelCount] = Object.entries(colorDistribution).sort(
    (a, b) => b[1] - a[1]
  )[0];

  const dominantColorRatio = pixelCount / lineWidth;
  return {
    isPureWhite:
      dominantColor === PURE_WHITE_RGB_COLOR && dominantColorRatio === 1,
    isTableLine:
      dominantColor === TABLE_BORDER_RGB_COLOR &&
      dominantColorRatio >= TABLE_LINE_RATIO_THRESHOLD,
  };
}

/**
 * 检查图像数据是否完全为白色
 */
export function isLineCompletelyWhite(imageData: Uint8ClampedArray): boolean {
  for (let i = 0; i < imageData.length; i += 4) {
    if (
      imageData[i] !== 255 ||
      imageData[i + 1] !== 255 ||
      imageData[i + 2] !== 255
    ) {
      return false;
    }
  }
  return true;
}
