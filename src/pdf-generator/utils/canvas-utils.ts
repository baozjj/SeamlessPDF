/**
 * Canvas操作工具函数
 */

import { snapdom } from "@zumer/snapdom";
import type { ScaledDimensions } from "../types";
import { DEFAULT_SCALE_FACTOR, A4_PAGE_DIMENSIONS } from "../constants";

/**
 * 将DOM元素渲染为Canvas
 * 自动根据设备像素比进行缩放，确保在高DPI设备上的清晰度
 */
export async function captureElementAsCanvas(
  element: HTMLElement
): Promise<HTMLCanvasElement> {
  return await snapdom.toCanvas(element, {
    scale: window.devicePixelRatio * DEFAULT_SCALE_FACTOR,
    useProxy: "https://corsproxy.io/?",
  });
}

/**
 * 计算Canvas在指定目标宽度下的缩放尺寸
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
 * 通过分析所有像素点，判断画布是否主要由接近白色的像素组成
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
 * 创建Canvas切片
 * 从源Canvas中提取指定Y坐标范围的内容
 */
export function createCanvasSlice(
  sourceCanvas: HTMLCanvasElement,
  startY: number,
  endY: number
): HTMLCanvasElement {
  const sliceCanvas = document.createElement("canvas");
  sliceCanvas.width = sourceCanvas.width;
  sliceCanvas.height = endY - startY;

  const context = sliceCanvas.getContext("2d")!;
  context.drawImage(
    sourceCanvas,
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
