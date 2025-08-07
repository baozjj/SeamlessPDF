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
 *
 * @param yCoordinate - Y坐标
 * @param canvas - Canvas元素
 * @returns TableBorderDetectionResult - 表格边框检测结果
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

  const isWithinBorder =
    borderTop < borderBottom &&
    yCoordinate >= borderTop &&
    yCoordinate <= borderBottom &&
    yCoordinate !== borderBottom; // 只允许在边框底部分割

  return { isWithinBorder, borderTop, borderBottom };
}

/**
 * 查找表格边框的底部位置
 *
 * @param startY - 起始Y坐标
 * @param canvas - Canvas元素
 * @returns number - 边框底部位置
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
      return y - 1; // 返回最后一个边框行
    }
  }

  return startY; // 如果没找到边框结束，返回起始位置
}
