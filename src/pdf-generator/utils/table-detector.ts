/**
 * 表格检测工具函数
 */

import type { TableBorderDetectionResult } from "../types";
import { TABLE_BORDER_HEIGHT } from "../constants";
import {
  analyzeColorDistribution,
  determineLineCharacteristics,
} from "./color-analyzer";

/**
 * 检测表格边框区域
 * 向上和向下查找完整的表格边框范围
 */
export function detectTableBorderRegion(
  yCoordinate: number,
  canvas: HTMLCanvasElement
): TableBorderDetectionResult {
  const context = canvas.getContext("2d")!;

  // 向上查找边框起始位置
  let borderTop = yCoordinate;
  for (
    let y = yCoordinate;
    y >= Math.max(0, yCoordinate - TABLE_BORDER_HEIGHT * 2);
    y--
  ) {
    const lineData = context.getImageData(0, y, canvas.width, 1).data;
    const colorDist = analyzeColorDistribution(lineData);
    const lineChars = determineLineCharacteristics(colorDist, canvas.width);

    if (lineChars.isTableLine) {
      borderTop = y;
    } else {
      break;
    }
  }

  // 向下查找边框结束位置
  let borderBottom = yCoordinate;
  for (
    let y = yCoordinate;
    y <= Math.min(canvas.height - 1, yCoordinate + TABLE_BORDER_HEIGHT * 2);
    y++
  ) {
    const lineData = context.getImageData(0, y, canvas.width, 1).data;
    const colorDist = analyzeColorDistribution(lineData);
    const lineChars = determineLineCharacteristics(colorDist, canvas.width);

    if (lineChars.isTableLine) {
      borderBottom = y;
    } else {
      break;
    }
  }

  // 只允许在边框底部分割
  const isWithinBorder =
    borderTop < borderBottom &&
    yCoordinate >= borderTop &&
    yCoordinate <= borderBottom &&
    yCoordinate !== borderBottom;

  return { isWithinBorder, borderTop, borderBottom };
}

/**
 * 查找表格边框的底部位置
 */
export function findTableBorderBottom(
  startY: number,
  canvas: HTMLCanvasElement
): number {
  const context = canvas.getContext("2d")!;

  for (
    let y = startY;
    y <= Math.min(canvas.height - 1, startY + TABLE_BORDER_HEIGHT * 2);
    y++
  ) {
    const lineData = context.getImageData(0, y, canvas.width, 1).data;
    const colorDist = analyzeColorDistribution(lineData);
    const lineChars = determineLineCharacteristics(colorDist, canvas.width);

    if (!lineChars.isTableLine) {
      return y - 1;
    }
  }

  return startY;
}
