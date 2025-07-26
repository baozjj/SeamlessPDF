import html2canvas from "html2canvas";

/**
 * 将 DOM 元素渲染为 Canvas，自动根据设备 DPR 缩放
 */
export const captureCanvas = async (
  el: HTMLElement
): Promise<HTMLCanvasElement> => {
  return await html2canvas(el, { scale: window.devicePixelRatio * 2 });
};

/**
 * 计算 canvas 缩放后在目标宽度下的高度（默认 A4 宽度）
 */
export const getScaledHeight = (
  canvas: HTMLCanvasElement,
  targetWidth = 595.28
): number => {
  return (targetWidth / canvas.width) * canvas.height;
};

/**
 * 分析某行是否为干净分页线（纯白或表格边框）
 */
export const analyzeCutLine = (y: number, canvas: HTMLCanvasElement) => {
  // 获取2D绘图上下文
  const ctx = canvas.getContext("2d")!;
  // 获取当前行的图像数据（宽度覆盖整个canvas，高度1像素）
  const imageData = ctx.getImageData(0, y, canvas.width, 1).data;
  // 获取当前行上方4像素处的图像数据（用于后续判断表格顶部边框）
  const prevImageData =
    y > 0 ? ctx.getImageData(0, y - 4, canvas.width, 1).data : null;
  const TABLE_BORDER_COLOR = "221,221,221";

  // 统计当前行各颜色出现次数
  const colorBuckets: Record<string, number> = {};
  for (let i = 0; i < imageData.length; i += 4) {
    // 提取RGB值作为颜色键（格式：R,G,B）
    const key = `${imageData[i]},${imageData[i + 1]},${imageData[i + 2]}`;
    colorBuckets[key] = (colorBuckets[key] || 0) + 1;
  }

  // 获取出现次数最多的主颜色及其占比
  const [mainColor, count] = Object.entries(colorBuckets).sort(
    (a, b) => b[1] - a[1]
  )[0];
  const ratio = count / canvas.width;
  // 判断是否为全白线（主颜色为纯白且占比100%）
  const isPureWhite = mainColor === "255,255,255" && ratio === 1;
  // 判断是否为表格线（主颜色为表格边框色且占比≥80%）
  const isTableLine = mainColor === TABLE_BORDER_COLOR && ratio >= 0.8;

  let isTableTopBorder = false;
  // 若为表格线且存在上方图像数据，检查是否为表格顶部边框（上方4像素处需全白）
  if (isTableLine && prevImageData) {
    isTableTopBorder = [...Array(prevImageData.length / 4).keys()].every(
      (i) => {
        const idx = i * 4;
        return (
          prevImageData[idx] === 255 &&
          prevImageData[idx + 1] === 255 &&
          prevImageData[idx + 2] === 255
        );
      }
    );
  }

  return {
    isCleanCut: (isPureWhite || isTableLine) && !isTableTopBorder,
    isTableBorder: isTableLine,
  };
};

/**
 * 向上查找最近的干净分页点
 */
export const findCleanCut = (
  startY: number,
  canvas: HTMLCanvasElement
): { cutY: number; isTableBorder: boolean } => {
  // 从起始位置向上遍历每一行（y递减）
  for (let y = startY; y > 0; y--) {
    // 分析当前行是否为干净分页线
    const result = analyzeCutLine(y, canvas);
    // 找到第一个干净分页线时返回（y+1修正为实际切割位置）
    if (result.isCleanCut) {
      return { cutY: y + 1, isTableBorder: result.isTableBorder };
    }
  }
  return { cutY: startY, isTableBorder: false };
};

/**
 * 判断给定 canvas 是否为“白色画布”，即绝大部分像素为接近纯白的颜色。
 *
 * @param canvas - 要检测的 canvas 元素
 * @param whiteThreshold - 单个 RGB 通道的白色判断阈值（默认 250，即接近255的亮色）
 * @returns boolean - 是否为视觉上的“白页”
 */
export const isWhiteCanvas = (
  canvas: HTMLCanvasElement,
  whiteThreshold = 250
): boolean => {
  // 获取 Canvas 2D 渲染上下文
  const ctx = canvas.getContext("2d");
  if (!ctx) return false; // 获取失败时，默认非白页

  const { width, height } = canvas;
  // 获取画布所有像素的图像数据
  const imageData = ctx.getImageData(0, 0, width, height);
  const pixels = imageData.data; // 像素数据，4个一组(R,G,B,A)

  // 遍历每个像素（步长4，跳过 alpha 通道）
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];

    // 若当前像素任一通道小于白色阈值，说明非白色
    if (r < whiteThreshold || g < whiteThreshold || b < whiteThreshold) {
      return false; // 一旦遇到非白色像素，立即判定非白页，提前返回
    }
  }

  // 全部像素均满足白色阈值，判定为白页，返回 true
  return true;
};

/**
 * 检查最后一页是否是“空白白页”
 * 仅当最后一页内容高度小于指定阈值时，才进行颜色检测
 *
 * @param pageCoords - 所有分页的坐标信息数组
 * @param contentCanvas - 原始内容 canvas
 * @param heightThresholdPx - 最后页高度像素阈值，默认 30px
 * @param whiteThreshold - 判断白色像素的 RGB 通道下限（默认 250）
 */
export const isBlankLastPage = (
  pageCoords: { startY: number; endY: number; isTableBorder: boolean }[],
  contentCanvas: HTMLCanvasElement,
  heightThresholdPx = 200,
  whiteThreshold = 250
) => {
  // 没有分页或只有一页，不需要处理
  if (pageCoords.length === 0) return false;

  // 获取最后一页的坐标信息
  const lastPage = pageCoords[pageCoords.length - 1];
  const lastPageHeight = lastPage.endY - lastPage.startY;

  // 若最后一页内容高度大于阈值，则不判定为白页，直接跳过
  if (lastPageHeight > heightThresholdPx) return false;

  // 创建临时 canvas，提取最后一页内容区域
  const sliceCanvas = document.createElement("canvas");
  sliceCanvas.width = contentCanvas.width;
  sliceCanvas.height = lastPageHeight;

  const ctx = sliceCanvas.getContext("2d")!;
  ctx.drawImage(
    contentCanvas,
    0,
    lastPage.startY,
    sliceCanvas.width,
    sliceCanvas.height,
    0,
    0,
    sliceCanvas.width,
    sliceCanvas.height
  );

  // 检测该区域是否为白色画布
  return isWhiteCanvas(sliceCanvas, whiteThreshold);
};
