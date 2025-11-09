/**
 * 分页分析器
 * 负责智能分页算法的实现
 */

import type {
  PageBreakAnalysisResult,
  OptimalBreakPointResult,
} from "../types";
import { TABLE_BORDER_HEIGHT } from "../constants";
import {
  analyzeColorDistribution,
  determineLineCharacteristics,
  detectTableBorderRegion,
  findTableBorderBottom,
} from "../utils";

/**
 * 分析指定行是否适合作为分页切割线
 * 通过像素级分析判断该行是否为纯白空间或表格边框
 */
export function analyzePageBreakLine(
  yCoordinate: number,
  canvas: HTMLCanvasElement
): PageBreakAnalysisResult {
  const context = canvas.getContext("2d")!;

  // 检测完整的表格边框区域
  const tableBorderRegion = detectTableBorderRegion(yCoordinate, canvas);

  if (tableBorderRegion.isWithinBorder) {
    return {
      isCleanBreakPoint: false,
      isTableBorder: true,
    };
  }

  // 检查当前行的特征
  const currentLineImageData = context.getImageData(
    0,
    yCoordinate,
    canvas.width,
    1
  ).data;
  const colorDistribution = analyzeColorDistribution(currentLineImageData);
  const lineCharacteristics = determineLineCharacteristics(
    colorDistribution,
    canvas.width
  );

  // 如果是表格边框，确保在边框底部分割
  if (lineCharacteristics.isTableLine) {
    const borderBottomY = findTableBorderBottom(yCoordinate, canvas);
    const isAtBorderBottom = yCoordinate === borderBottomY;

    return {
      isCleanBreakPoint: isAtBorderBottom,
      isTableBorder: true,
    };
  }

  return {
    isCleanBreakPoint: lineCharacteristics.isPureWhite,
    isTableBorder: false,
  };
}

/**
 * 向上搜索最优的分页切割点
 * 从指定位置向上遍历，寻找第一个适合分页的干净切割线
 */
export function findOptimalPageBreak(
  startYCoordinate: number,
  canvas: HTMLCanvasElement
): OptimalBreakPointResult {
  // 先向上搜索最优分割点
  for (let y = startYCoordinate; y > 0; y--) {
    const analysisResult = analyzePageBreakLine(y, canvas);

    if (analysisResult.isCleanBreakPoint) {
      if (analysisResult.isTableBorder) {
        const borderBottom = findTableBorderBottom(y, canvas);
        return {
          cutY: borderBottom + 1,
          isTableBorder: true,
        };
      }

      return {
        cutY: y + 1,
        isTableBorder: false,
      };
    }
  }

  // 如果向上未找到，向下搜索
  for (let y = startYCoordinate + 1; y < canvas.height; y++) {
    const analysisResult = analyzePageBreakLine(y, canvas);

    if (analysisResult.isCleanBreakPoint) {
      if (analysisResult.isTableBorder) {
        const borderBottom = findTableBorderBottom(y, canvas);
        return {
          cutY: borderBottom + 1,
          isTableBorder: true,
        };
      }

      return {
        cutY: y + 1,
        isTableBorder: false,
      };
    }
  }

  // 找不到干净分割点时，确保跳过整个表格边框区域
  const safeCutY = Math.min(
    startYCoordinate + TABLE_BORDER_HEIGHT * 2,
    canvas.height
  );
  return {
    cutY: safeCutY,
    isTableBorder: true,
  };
}
