import html2canvas from "html2canvas";

/**
 * 页面分析结果接口
 */
interface PageBreakAnalysisResult {
  /** 是否为干净的分页点 */
  isCleanBreakPoint: boolean;
  /** 是否为表格边框 */
  isTableBorder: boolean;
}

/**
 * 最优分页点查找结果
 */
interface OptimalBreakPointResult {
  /** 切割Y坐标 */
  cutY: number;
  /** 是否为表格边框 */
  isTableBorder: boolean;
}

/**
 * 缩放尺寸信息
 */
interface ScaledDimensions {
  /** 缩放后宽度 */
  width: number;
  /** 缩放后高度 */
  height: number;
}

/**
 * 表格边框颜色常量（RGB格式）
 */
const TABLE_BORDER_RGB_COLOR = "221,221,221";

/**
 * 纯白色RGB值
 */
const PURE_WHITE_RGB_COLOR = "255,255,255";

/**
 * 表格线识别的最小占比阈值
 */
const TABLE_LINE_RATIO_THRESHOLD = 0.8;

/**
 * 默认白色像素判断阈值
 */
const DEFAULT_WHITE_PIXEL_THRESHOLD = 250;

/**
 * 默认空白页高度阈值（像素）
 */
const DEFAULT_BLANK_PAGE_HEIGHT_THRESHOLD = 200;

/**
 * 表格边框检测的向上偏移量（像素）
 */
const TABLE_BORDER_DETECTION_OFFSET = 4;

/**
 * 将 DOM 元素渲染为 Canvas
 *
 * 自动根据设备像素比进行缩放，确保在高DPI设备上的清晰度
 *
 * @param element - 要渲染的 DOM 元素
 * @returns Promise<HTMLCanvasElement> - 渲染后的 Canvas 元素
 */
export async function captureElementAsCanvas(
  element: HTMLElement
): Promise<HTMLCanvasElement> {
  return await html2canvas(element, {
    scale: window.devicePixelRatio * 2,
  });
}

/**
 * 计算 Canvas 在指定目标宽度下的缩放尺寸
 *
 * @param canvas - 源 Canvas 元素
 * @param targetWidth - 目标宽度，默认为 A4 纸张宽度
 * @returns ScaledDimensions - 缩放后的尺寸信息
 */
export function calculateScaledDimensions(
  canvas: HTMLCanvasElement,
  targetWidth: number = 595.28
): ScaledDimensions {
  const scaleFactor = targetWidth / canvas.width;
  return {
    width: targetWidth,
    height: canvas.height * scaleFactor,
  };
}

/**
 * 分析指定行是否适合作为分页切割线
 *
 * 通过像素级分析判断该行是否为纯白空间或表格边框，
 * 同时检测表格顶部边框以避免不当分割
 *
 * @param yCoordinate - 要分析的Y坐标
 * @param canvas - 源 Canvas 元素
 * @returns PageBreakAnalysisResult - 分析结果
 */
export function analyzePageBreakLine(
  yCoordinate: number,
  canvas: HTMLCanvasElement
): PageBreakAnalysisResult {
  const context = canvas.getContext("2d")!;
  const currentLineImageData = context.getImageData(
    0,
    yCoordinate,
    canvas.width,
    1
  ).data;
  const previousLineImageData =
    yCoordinate > 0
      ? context.getImageData(
          0,
          yCoordinate - TABLE_BORDER_DETECTION_OFFSET,
          canvas.width,
          1
        ).data
      : null;

  const colorDistribution = analyzeColorDistribution(currentLineImageData);
  const lineCharacteristics = determineLineCharacteristics(
    colorDistribution,
    canvas.width
  );

  const isTableTopBorder =
    lineCharacteristics.isTableLine && previousLineImageData
      ? isLineCompletelyWhite(previousLineImageData)
      : false;

  return {
    isCleanBreakPoint:
      (lineCharacteristics.isPureWhite || lineCharacteristics.isTableLine) &&
      !isTableTopBorder,
    isTableBorder: lineCharacteristics.isTableLine,
  };
}

/**
 * 分析图像数据中的颜色分布
 */
function analyzeColorDistribution(
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
 * 确定线条特征
 */
function determineLineCharacteristics(
  colorDistribution: Record<string, number>,
  lineWidth: number
) {
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
function isLineCompletelyWhite(imageData: Uint8ClampedArray): boolean {
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

/**
 * 向上搜索最优的分页切割点
 *
 * 从指定位置向上遍历，寻找第一个适合分页的干净切割线
 *
 * @param startYCoordinate - 搜索起始Y坐标
 * @param canvas - 源 Canvas 元素
 * @returns OptimalBreakPointResult - 最优切割点信息
 */
export function findOptimalPageBreak(
  startYCoordinate: number,
  canvas: HTMLCanvasElement
): OptimalBreakPointResult {
  for (let y = startYCoordinate; y > 0; y--) {
    const analysisResult = analyzePageBreakLine(y, canvas);

    if (analysisResult.isCleanBreakPoint) {
      return {
        cutY: y + 1,
        isTableBorder: analysisResult.isTableBorder,
      };
    }
  }

  return {
    cutY: startYCoordinate,
    isTableBorder: false,
  };
}

/**
 * 检测 Canvas 是否为视觉上的白色画布
 *
 * 通过分析所有像素点，判断画布是否主要由接近白色的像素组成
 *
 * @param canvas - 要检测的 Canvas 元素
 * @param whiteThreshold - 白色判断阈值，默认为 250
 * @returns boolean - 是否为白色画布
 */
export function isCanvasVisuallyWhite(
  canvas: HTMLCanvasElement,
  whiteThreshold: number = DEFAULT_WHITE_PIXEL_THRESHOLD
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
 * 检测并判断最后一页是否为空白页
 *
 * 仅当最后一页内容高度小于指定阈值时，才进行详细的颜色检测
 *
 * @param pageBreakCoordinates - 所有分页坐标信息
 * @param contentCanvas - 原始内容 Canvas
 * @param heightThreshold - 高度阈值，默认 200px
 * @param whiteThreshold - 白色像素判断阈值，默认 250
 * @returns boolean - 最后一页是否为空白页
 */
export function detectBlankLastPage(
  pageBreakCoordinates: Array<{
    startY: number;
    endY: number;
    isTableBorderBreak: boolean;
  }>,
  contentCanvas: HTMLCanvasElement,
  heightThreshold: number = DEFAULT_BLANK_PAGE_HEIGHT_THRESHOLD,
  whiteThreshold: number = DEFAULT_WHITE_PIXEL_THRESHOLD
): boolean {
  if (pageBreakCoordinates.length === 0) {
    return false;
  }

  const lastPageCoordinates =
    pageBreakCoordinates[pageBreakCoordinates.length - 1];
  const lastPageHeight = lastPageCoordinates.endY - lastPageCoordinates.startY;

  if (lastPageHeight > heightThreshold) {
    return false;
  }

  const lastPageCanvas = extractPageContentCanvas(
    contentCanvas,
    lastPageCoordinates.startY,
    lastPageCoordinates.endY
  );

  return isCanvasVisuallyWhite(lastPageCanvas, whiteThreshold);
}

/**
 * 提取页面内容区域为独立的 Canvas
 *
 * @param sourceCanvas - 源 Canvas
 * @param startY - 起始Y坐标
 * @param endY - 结束Y坐标
 * @returns HTMLCanvasElement - 提取的页面内容 Canvas
 */
function extractPageContentCanvas(
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
