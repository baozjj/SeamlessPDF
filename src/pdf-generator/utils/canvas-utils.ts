/**
 * Canvas操作工具函数
 */

import { snapdom } from "@zumer/snapdom";
import type { ScaledDimensions } from "../types";
import { DEFAULT_SCALE_FACTOR, A4_PAGE_DIMENSIONS } from "../constants";

/**
 * 将DOM元素渲染为Canvas
 *
 * 自动根据设备像素比进行缩放，确保在高DPI设备上的清晰度
 *
 * @param element - 要渲染的DOM元素
 * @returns Promise<HTMLCanvasElement> - 渲染后的Canvas元素
 */
export async function captureElementAsCanvas(
  element: HTMLElement
): Promise<HTMLCanvasElement> {
  return await snapdom.toCanvas(element, {
    scale: window.devicePixelRatio * DEFAULT_SCALE_FACTOR,
    useProxy: "https://corsproxy.io/?", // 添加代理支持
  });
}

/**
 * 计算Canvas在指定目标宽度下的缩放尺寸
 *
 * @param canvas - 源Canvas元素
 * @param targetWidth - 目标宽度，默认为A4纸张宽度
 * @returns ScaledDimensions - 缩放后的尺寸信息
 */
export function calculateScaledDimensions(
  canvas: HTMLCanvasElement,
  targetWidth: number = A4_PAGE_DIMENSIONS.WIDTH
): ScaledDimensions {
  const scaleFactor = targetWidth / canvas.width;
  return {
    width: targetWidth,
    height: canvas.height * scaleFactor,
  };
}

/**
 * 检测Canvas是否为视觉上的白色画布
 *
 * 通过分析所有像素点，判断画布是否主要由接近白色的像素组成
 *
 * @param canvas - 要检测的Canvas元素
 * @param whiteThreshold - 白色判断阈值
 * @returns boolean - 是否为白色画布
 */
export function isCanvasVisuallyWhite(
  canvas: HTMLCanvasElement,
  whiteThreshold: number
): boolean {
  const context = canvas.getContext("2d");
  if (!context) return false;

  const { width, height } = canvas;
  const imageData = context.getImageData(0, 0, width, height);
  const pixels = imageData.data;

  for (let i = 0; i < pixels.length; i += 4) {
    const [red, green, blue] = [pixels[i], pixels[i + 1], pixels[i + 2]];

    if (
      red < whiteThreshold ||
      green < whiteThreshold ||
      blue < whiteThreshold
    ) {
      return false;
    }
  }

  return true;
}

/**
 * 提取页面内容区域为独立的Canvas
 *
 * @param sourceCanvas - 源Canvas
 * @param startY - 起始Y坐标
 * @param endY - 结束Y坐标
 * @returns HTMLCanvasElement - 提取的页面内容Canvas
 */
export function extractPageContentCanvas(
  sourceCanvas: HTMLCanvasElement,
  startY: number,
  endY: number
): HTMLCanvasElement {
  const extractedCanvas = document.createElement("canvas");
  extractedCanvas.width = sourceCanvas.width;
  extractedCanvas.height = endY - startY;

  const context = extractedCanvas.getContext("2d")!;
  context.drawImage(
    sourceCanvas,
    0,
    startY,
    extractedCanvas.width,
    extractedCanvas.height,
    0,
    0,
    extractedCanvas.width,
    extractedCanvas.height
  );

  return extractedCanvas;
}

/**
 * 创建内容切片Canvas
 *
 * @param contentCanvas - 源内容Canvas
 * @param startY - 起始Y坐标
 * @param endY - 结束Y坐标
 * @returns HTMLCanvasElement - 切片Canvas
 */
export function createContentSliceCanvas(
  contentCanvas: HTMLCanvasElement,
  startY: number,
  endY: number
): HTMLCanvasElement {
  const sliceCanvas = document.createElement("canvas");
  sliceCanvas.width = contentCanvas.width;
  sliceCanvas.height = endY - startY;

  const context = sliceCanvas.getContext("2d")!;
  context.drawImage(
    contentCanvas,
    0,
    startY,
    sliceCanvas.width,
    sliceCanvas.height,
    0,
    0,
    sliceCanvas.width,
    sliceCanvas.height
  );

  return sliceCanvas;
}
