import {
  captureElementAsCanvas,
  findOptimalPageBreak,
  calculateScaledDimensions,
  detectBlankLastPage,
} from "./pdfUtils";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

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
  const canvasElements = await renderElementsToCanvas({
    headerElement,
    contentElement,
    footerElement,
  });

  // 第二阶段：计算页面布局参数
  const layoutMetrics = calculatePageLayoutMetrics(canvasElements);

  // 第三阶段：智能分页计算
  const pageBreakCoordinates = calculateIntelligentPageBreaks(
    canvasElements.content,
    layoutMetrics.contentPageHeightInPixels
  );

  // 第四阶段：生成 PDF 文档
  return await generatePdfDocument({
    canvasElements,
    layoutMetrics,
    pageBreakCoordinates,
    footerElement,
    onFooterUpdate,
  });
}

/**
 * 将页面元素渲染为 Canvas 对象
 */
async function renderElementsToCanvas({
  headerElement,
  contentElement,
  footerElement,
}: Pick<
  PdfGenerationOptions,
  "headerElement" | "contentElement" | "footerElement"
>) {
  const [header, content, footer] = await Promise.all([
    captureElementAsCanvas(headerElement),
    captureElementAsCanvas(contentElement),
    captureElementAsCanvas(footerElement),
  ]);

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
    const shouldAdjustForTableBorder =
      shouldAdjustOffsetForPreviousTableBorder(pageBreakCoordinates);

    if (shouldAdjustForTableBorder) {
      currentOffsetY -= TABLE_BREAK_ADJUSTMENT_OFFSET;
    }

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

  for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
    if (pageIndex > 0) {
      pdf.addPage();
    }

    await renderSinglePage({
      pdf,
      pageIndex,
      totalPages,
      canvasElements,
      layoutMetrics,
      pageBreakCoordinates,
      footerElement,
      onFooterUpdate,
    });
  }

  return pdf;
}

/**
 * 渲染单个页面
 */
async function renderSinglePage({
  pdf,
  pageIndex,
  totalPages,
  canvasElements,
  layoutMetrics,
  pageBreakCoordinates,
  footerElement,
  onFooterUpdate,
}: {
  pdf: jsPDF;
  pageIndex: number;
  totalPages: number;
  canvasElements: {
    header: HTMLCanvasElement;
    content: HTMLCanvasElement;
    footer: HTMLCanvasElement;
  };
  layoutMetrics: ReturnType<typeof calculatePageLayoutMetrics>;
  pageBreakCoordinates: PageBreakCoordinate[];
  footerElement: HTMLElement;
  onFooterUpdate: PdfGenerationOptions["onFooterUpdate"];
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

  // 渲染页脚
  await renderPageFooter({
    pdf,
    pageIndex: pageIndex + 1,
    totalPages,
    footerElement,
    layoutMetrics,
    onFooterUpdate,
  });
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

/**
 * 渲染页脚
 */
async function renderPageFooter({
  pdf,
  pageIndex,
  totalPages,
  footerElement,
  layoutMetrics,
  onFooterUpdate,
}: {
  pdf: jsPDF;
  pageIndex: number;
  totalPages: number;
  footerElement: HTMLElement;
  layoutMetrics: ReturnType<typeof calculatePageLayoutMetrics>;
  onFooterUpdate: PdfGenerationOptions["onFooterUpdate"];
}): Promise<void> {
  if (onFooterUpdate) {
    await Promise.resolve(onFooterUpdate(pageIndex, totalPages));
  }

  const updatedFooterCanvas = await html2canvas(footerElement, {
    scale: window.devicePixelRatio * 2,
  });

  pdf.addImage(
    updatedFooterCanvas,
    "JPEG",
    0,
    A4_PAGE_DIMENSIONS.HEIGHT - layoutMetrics.footerHeight,
    A4_PAGE_DIMENSIONS.WIDTH,
    layoutMetrics.footerHeight
  );
}
