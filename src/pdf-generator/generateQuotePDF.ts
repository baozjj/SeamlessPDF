import {
  findOptimalPageBreak,
  calculateScaledDimensions,
  detectBlankLastPage,
} from "./pdfUtils";
import jsPDF from "jspdf";
import { renderElementInIframeWithStyles } from "./iframe-renderer";
import { extractPageStyles } from "./element-serializer";

/**
 * PDF 生成配置选项
 */
interface PdfGenerationOptions {
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
interface PageBreakCoordinate {
  /** 起始Y坐标 */
  startY: number;
  /** 结束Y坐标 */
  endY: number;
  /** 是否为表格边框分割点 */
  isTableBorderBreak: boolean;
}

/**
 * A4 页面尺寸常量（单位：pt）
 */
const A4_PAGE_DIMENSIONS = {
  WIDTH: 595.28,
  HEIGHT: 841.89,
} as const;

/**
 * 表格分割调整偏移量（单位：px）
 */
const TABLE_BREAK_ADJUSTMENT_OFFSET = 4;

/**
 * 生成分页的 PDF 文档
 *
 * 该函数采用"渲染后分析"策略，先将整个内容渲染为 Canvas，
 * 然后通过像素级分析找到最佳分页点，避免在文本或表格中间分页。
 *
 * @param options - PDF 生成配置选项
 * @returns Promise<jsPDF> - 生成的 PDF 文档实例
 */
export async function generateIntelligentPdf({
  headerElement,
  contentElement,
  footerElement,
  onFooterUpdate,
}: PdfGenerationOptions): Promise<jsPDF> {
  // 第一阶段：将页面元素转换为 Canvas
  // 第一阶段耗时
  const renderStartTime = performance.now();
  const canvasElements = await renderElementsToCanvas({
    headerElement,
    contentElement,
    footerElement,
  });
  const renderEndTime = performance.now();
  const renderTime = renderEndTime - renderStartTime;
  console.log(`第一阶段耗时: ${renderTime.toFixed(2)}ms`);

  // 第二阶段：计算页面布局参数
  const layoutStartTime = performance.now();
  const layoutMetrics = calculatePageLayoutMetrics(canvasElements);
  const layoutEndTime = performance.now();
  const layoutTime = layoutEndTime - layoutStartTime;
  console.log(`第二阶段耗时: ${layoutTime.toFixed(2)}ms`);

  // 第三阶段：分页计算
  const pageBreakStartTime = performance.now();
  const pageBreakCoordinates = calculateIntelligentPageBreaks(
    canvasElements.content,
    layoutMetrics.contentPageHeightInPixels
  );
  const pageBreakEndTime = performance.now();
  const pageBreakTime = pageBreakEndTime - pageBreakStartTime;
  console.log(`第三阶段耗时: ${pageBreakTime.toFixed(2)}ms`);

  // 第四阶段：生成 PDF 文档
  const pdfGenerationStartTime = performance.now();
  const pdf = await generatePdfDocument({
    canvasElements,
    layoutMetrics,
    pageBreakCoordinates,
    footerElement,
    onFooterUpdate,
  });
  const pdfGenerationEndTime = performance.now();
  const pdfGenerationTime = pdfGenerationEndTime - pdfGenerationStartTime;
  console.log(`第四阶段耗时: ${pdfGenerationTime.toFixed(2)}ms`);

  return pdf;
}

/**
 * 将页面元素渲染为 Canvas 对象（使用 iframe 隔离渲染）
 */
async function renderElementsToCanvas({
  headerElement,
  contentElement,
  footerElement,
}: {
  headerElement: HTMLElement;
  contentElement: HTMLElement;
  footerElement: HTMLElement;
}): Promise<{
  header: HTMLCanvasElement;
  content: HTMLCanvasElement;
  footer: HTMLCanvasElement;
}> {
  // 优化：预先提取样式，避免重复提取
  console.log("开始提取页面样式...");
  const stylesStartTime = performance.now();
  const pageStyles = await extractPageStyles();
  const stylesEndTime = performance.now();
  console.log(
    `样式提取耗时: ${(stylesEndTime - stylesStartTime).toFixed(2)}ms`
  );

  // 使用iframe并行渲染
  console.log("开始iframe并行渲染...");
  const parallelStartTime = performance.now();
  const [header, content, footer] = await Promise.all([
    renderElementInIframeWithStyles(headerElement, "header", pageStyles),
    renderElementInIframeWithStyles(contentElement, "content", pageStyles),
    renderElementInIframeWithStyles(footerElement, "footer", pageStyles),
  ]);
  const parallelEndTime = performance.now();
  console.log(
    `iframe并行渲染耗时: ${(parallelEndTime - parallelStartTime).toFixed(2)}ms`
  );

  return { header, content, footer };
}

/**
 * 计算页面布局度量参数
 */
function calculatePageLayoutMetrics(canvasElements: {
  header: HTMLCanvasElement;
  content: HTMLCanvasElement;
  footer: HTMLCanvasElement;
}) {
  const headerHeight = calculateScaledDimensions(canvasElements.header).height;
  const footerHeight = calculateScaledDimensions(canvasElements.footer).height;
  const contentRegionHeight =
    A4_PAGE_DIMENSIONS.HEIGHT - headerHeight - footerHeight;

  const contentScaleFactor =
    A4_PAGE_DIMENSIONS.WIDTH / canvasElements.content.width;
  const contentPageHeightInPixels = contentRegionHeight / contentScaleFactor;

  return {
    headerHeight,
    footerHeight,
    contentRegionHeight,
    contentScaleFactor,
    contentPageHeightInPixels,
  };
}

/**
 * 计算分页坐标
 */
function calculateIntelligentPageBreaks(
  contentCanvas: HTMLCanvasElement,
  contentPageHeightInPixels: number
): PageBreakCoordinate[] {
  const pageBreakCoordinates: PageBreakCoordinate[] = [];
  let currentOffsetY = 0;

  while (currentOffsetY < contentCanvas.height) {
    // 上一页是否为表格边框分割点
    const shouldAdjustForTableBorder =
      shouldAdjustOffsetForPreviousTableBorder(pageBreakCoordinates);

    // 如果上一页为表格边框分割点，则调整当前页的起始Y坐标
    if (shouldAdjustForTableBorder) {
      currentOffsetY -= TABLE_BREAK_ADJUSTMENT_OFFSET;
    }

    // 计算当前页的结束Y坐标
    const roughEndY = Math.min(
      currentOffsetY + contentPageHeightInPixels,
      contentCanvas.height
    );

    const { cutY: optimalEndY, isTableBorder } = findOptimalPageBreak(
      roughEndY,
      contentCanvas
    );
    const finalEndY = optimalEndY <= currentOffsetY ? roughEndY : optimalEndY;

    pageBreakCoordinates.push({
      startY: currentOffsetY,
      endY: finalEndY,
      isTableBorderBreak: isTableBorder,
    });

    currentOffsetY = finalEndY;
  }

  // 移除可能的空白最后一页
  removeBlankLastPageIfExists(pageBreakCoordinates, contentCanvas);

  return pageBreakCoordinates;
}

/**
 * 检查是否需要为上一页的表格边框调整偏移量
 */
function shouldAdjustOffsetForPreviousTableBorder(
  pageBreakCoordinates: PageBreakCoordinate[]
): boolean {
  return (
    pageBreakCoordinates.length > 0 &&
    pageBreakCoordinates[pageBreakCoordinates.length - 1].isTableBorderBreak
  );
}

/**
 * 移除空白的最后一页
 */
function removeBlankLastPageIfExists(
  pageBreakCoordinates: PageBreakCoordinate[],
  contentCanvas: HTMLCanvasElement
): void {
  if (
    pageBreakCoordinates.length > 1 &&
    detectBlankLastPage(pageBreakCoordinates, contentCanvas)
  ) {
    pageBreakCoordinates.pop();
  }
}

/**
 * 生成最终的 PDF 文档
 */
async function generatePdfDocument({
  canvasElements,
  layoutMetrics,
  pageBreakCoordinates,
  footerElement,
  onFooterUpdate,
}: {
  canvasElements: {
    header: HTMLCanvasElement;
    content: HTMLCanvasElement;
    footer: HTMLCanvasElement;
  };
  layoutMetrics: ReturnType<typeof calculatePageLayoutMetrics>;
  pageBreakCoordinates: PageBreakCoordinate[];
  footerElement: HTMLElement;
  onFooterUpdate: PdfGenerationOptions["onFooterUpdate"];
}): Promise<jsPDF> {
  const pdf = new jsPDF("portrait", "pt", "a4");
  const totalPages = pageBreakCoordinates.length;

  // 预渲染所有页脚（并行处理）
  console.log("开始预渲染所有页脚...");
  const footerPreRenderStartTime = performance.now();
  const preRenderedFooters = await preRenderAllFooters({
    footerElement,
    totalPages,
    onFooterUpdate,
  });
  const footerPreRenderEndTime = performance.now();
  const footerPreRenderTime = footerPreRenderEndTime - footerPreRenderStartTime;
  console.log(`页脚预渲染耗时: ${footerPreRenderTime.toFixed(2)}ms`);

  // 渲染所有页面（页脚已预渲染）
  console.log("开始渲染所有页面...");
  const pageRenderStartTime = performance.now();

  for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
    console.log(`第${pageIndex + 1}页开始渲染`);
    const pageStartTime = performance.now();

    if (pageIndex > 0) {
      pdf.addPage();
    }

    await renderSinglePage({
      pdf,
      pageIndex,
      canvasElements,
      layoutMetrics,
      pageBreakCoordinates,
      preRenderedFooter: preRenderedFooters[pageIndex],
    });

    const pageEndTime = performance.now();
    const pageTime = pageEndTime - pageStartTime;
    console.log(`第${pageIndex + 1}页耗时: ${pageTime.toFixed(2)}ms`);
  }

  const pageRenderEndTime = performance.now();
  const pageRenderTime = pageRenderEndTime - pageRenderStartTime;
  console.log(`所有页面渲染耗时: ${pageRenderTime.toFixed(2)}ms`);

  return pdf;
}

/**
 * 预渲染所有页脚
 */
async function preRenderAllFooters({
  footerElement,
  totalPages,
  onFooterUpdate,
}: {
  footerElement: HTMLElement;
  totalPages: number;
  onFooterUpdate: PdfGenerationOptions["onFooterUpdate"];
}): Promise<HTMLCanvasElement[]> {
  const preRenderedFooters = [];
  const pageStyles = await extractPageStyles();

  for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
    const pageNumber = pageIndex + 1;

    // 更新页脚内容
    if (onFooterUpdate) {
      await Promise.resolve(onFooterUpdate(pageNumber, totalPages));
    }

    // 创建页脚克隆并复制计算样式
    const cloneElement = createStyledClone(footerElement);

    // 渲染当前页脚
    const footerCanvas = renderElementInIframeWithStyles(
      cloneElement,
      `footer-page-${pageNumber}`,
      pageStyles
    );
    preRenderedFooters.push(footerCanvas);
  }

  const res = await Promise.all(preRenderedFooters);

  return res;
}

/**
 * 创建带有完整样式的元素克隆
 */
function createStyledClone(element: HTMLElement): HTMLElement {
  // 克隆元素结构
  const clone = element.cloneNode(true) as HTMLElement;

  // 复制根元素的计算样式
  copyComputedStyles(element, clone);

  // 递归复制所有子元素的计算样式
  const originalElements = element.querySelectorAll("*");
  const clonedElements = clone.querySelectorAll("*");

  for (let i = 0; i < originalElements.length; i++) {
    const originalEl = originalElements[i] as HTMLElement;
    const clonedEl = clonedElements[i] as HTMLElement;
    copyComputedStyles(originalEl, clonedEl);
  }

  return clone;
}

/**
 * 复制元素的计算样式
 */
function copyComputedStyles(source: HTMLElement, target: HTMLElement): void {
  const computedStyles = window.getComputedStyle(source);

  // 复制所有计算样式到内联样式
  for (let i = 0; i < computedStyles.length; i++) {
    const property = computedStyles[i];
    const value = computedStyles.getPropertyValue(property);

    // 跳过一些不需要或可能有问题的属性
    if (shouldSkipProperty(property)) {
      continue;
    }

    try {
      target.style.setProperty(property, value);
    } catch (e) {
      // 忽略无法设置的属性
      console.warn(`无法设置样式属性 ${property}: ${value}`, e);
    }
  }
}

/**
 * 判断是否应该跳过某个CSS属性
 */
function shouldSkipProperty(property: string): boolean {
  // 跳过这些可能有问题的属性
  const skipProperties = [
    "length",
    "parentRule",
    "cssText",
    "cssFloat",
    "getPropertyPriority",
    "getPropertyValue",
    "item",
    "removeProperty",
    "setProperty",
  ];

  return (
    skipProperties.includes(property) ||
    property.startsWith("-webkit-") ||
    property.startsWith("-moz-") ||
    property.startsWith("-ms-")
  );
}

/**
 * 渲染单个页面
 */
async function renderSinglePage({
  pdf,
  pageIndex,
  canvasElements,
  layoutMetrics,
  pageBreakCoordinates,
  preRenderedFooter,
}: {
  pdf: jsPDF;
  pageIndex: number;
  canvasElements: {
    header: HTMLCanvasElement;
    content: HTMLCanvasElement;
    footer: HTMLCanvasElement;
  };
  layoutMetrics: ReturnType<typeof calculatePageLayoutMetrics>;
  pageBreakCoordinates: PageBreakCoordinate[];
  preRenderedFooter: HTMLCanvasElement;
}): Promise<void> {
  // 渲染页眉
  renderPageHeader(pdf, canvasElements.header, layoutMetrics.headerHeight);

  // 渲染页面内容
  await renderPageContent({
    pdf,
    pageIndex,
    canvasElements,
    layoutMetrics,
    pageBreakCoordinates,
  });

  // 渲染页脚（使用预渲染的页脚）
  pdf.addImage(
    preRenderedFooter,
    "JPEG",
    0,
    A4_PAGE_DIMENSIONS.HEIGHT - layoutMetrics.footerHeight,
    A4_PAGE_DIMENSIONS.WIDTH,
    layoutMetrics.footerHeight
  );
}

/**
 * 渲染页眉
 */
function renderPageHeader(
  pdf: jsPDF,
  headerCanvas: HTMLCanvasElement,
  headerHeight: number
): void {
  pdf.addImage(
    headerCanvas.toDataURL("image/jpeg", 1.0),
    "JPEG",
    0,
    0,
    A4_PAGE_DIMENSIONS.WIDTH,
    headerHeight
  );
}

/**
 * 渲染页面内容
 */
async function renderPageContent({
  pdf,
  pageIndex,
  canvasElements,
  layoutMetrics,
  pageBreakCoordinates,
}: {
  pdf: jsPDF;
  pageIndex: number;
  canvasElements: { content: HTMLCanvasElement };
  layoutMetrics: ReturnType<typeof calculatePageLayoutMetrics>;
  pageBreakCoordinates: PageBreakCoordinate[];
}): Promise<void> {
  const { startY, endY } = pageBreakCoordinates[pageIndex];
  const contentSliceCanvas = createContentSliceCanvas(
    canvasElements.content,
    startY,
    endY
  );

  const scaledContentHeight = calculateScaledContentHeight(
    endY - startY,
    layoutMetrics.contentPageHeightInPixels,
    layoutMetrics.contentRegionHeight
  );

  pdf.addImage(
    contentSliceCanvas.toDataURL("image/jpeg", 1.0),
    "JPEG",
    0,
    layoutMetrics.headerHeight,
    A4_PAGE_DIMENSIONS.WIDTH,
    scaledContentHeight
  );
}

/**
 * 创建内容切片 Canvas
 */
function createContentSliceCanvas(
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

/**
 * 计算缩放后的内容高度
 */
function calculateScaledContentHeight(
  actualContentHeight: number,
  contentPageHeightInPixels: number,
  contentRegionHeight: number
): number {
  return (
    (actualContentHeight / contentPageHeightInPixels) * contentRegionHeight
  );
}
