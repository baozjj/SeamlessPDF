import {
  captureCanvas,
  findCleanCut,
  getScaledHeight,
  isBlankLastPage,
} from "./pdfUtils";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface GenerateQuotePDFOptions {
  headerEl: HTMLElement;
  contentEl: HTMLElement;
  footerEl: HTMLElement;
  updateFooter: (pageIndex: number, totalPages: number) => Promise<void> | void;
}

export async function generateQuotePDF({
  headerEl,
  contentEl,
  footerEl,
  updateFooter,
}: GenerateQuotePDFOptions): Promise<jsPDF> {
  // 启动阶段：将三部分元素转为 canvas
  const [headerCanvas, contentCanvas, footerCanvas] = await Promise.all([
    captureCanvas(headerEl),
    captureCanvas(contentEl),
    captureCanvas(footerEl),
  ]);

  const pdf = new jsPDF("portrait", "pt", "a4");

  // 页面尺寸信息（A4）
  const pageWidth = 595.28;
  const pageHeight = 841.89;

  // 各区域高度计算
  const headerHeight = getScaledHeight(headerCanvas);
  const footerHeight = getScaledHeight(footerCanvas);
  const contentRegionHeight = pageHeight - headerHeight - footerHeight;

  // 内容缩放信息
  const contentScale = pageWidth / contentCanvas.width;
  const contentPageHeightPx = contentRegionHeight / contentScale;

  // 分页逻辑：计算所有分页的剪裁坐标
  const pageCoords: {
    startY: number;
    endY: number;
    isTableBorder: boolean;
  }[] = [];

  let offsetY = 0;
  do {
    const prevIsTableBorder =
      pageCoords.length > 0 && pageCoords[pageCoords.length - 1].isTableBorder;

    // 若上一页是表格边框，调整起始位置避免分割表格（向上偏移4px）
    if (prevIsTableBorder) offsetY -= 4;

    // 计算当前分页的结束位置（不超过内容总高度）
    const roughEndY = Math.min(
      offsetY + contentPageHeightPx,
      contentCanvas.height
    );

    // 查找干净的分页点（优先表格边框或纯白区域）
    const { cutY, isTableBorder } = findCleanCut(roughEndY, contentCanvas);
    let cleanEndY = cutY;

    // 若调整后结束位置无效（小于等于起始位置），回退使用粗略值
    if (cleanEndY <= offsetY) cleanEndY = roughEndY;

    // 记录当前分页的坐标范围及是否为表格边框
    pageCoords.push({ startY: offsetY, endY: cleanEndY, isTableBorder });
    // 更新偏移量用于下一轮循环
    offsetY = cleanEndY;
  } while (offsetY < contentCanvas.height);

  // 检查并移除最后一页可能的“空白白页”
  if (pageCoords.length > 1) {
    isBlankLastPage(pageCoords, contentCanvas) && pageCoords.pop();
  }

  const totalPages = pageCoords.length;

  // 渲染每一页
  for (let i = 0; i < totalPages; i++) {
    if (i > 0) pdf.addPage();

    // 添加头部
    pdf.addImage(
      headerCanvas.toDataURL("image/jpeg", 1.0),
      "JPEG",
      0,
      0,
      pageWidth,
      headerHeight
    );

    // 裁剪当前页的内容部分
    const { startY, endY } = pageCoords[i];
    const sliceCanvas = document.createElement("canvas");
    sliceCanvas.width = contentCanvas.width;
    sliceCanvas.height = endY - startY;

    const ctx = sliceCanvas.getContext("2d")!;
    ctx.drawImage(
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

    // 内容高度按比例缩放
    const renderContentHeight =
      ((endY - startY) / contentPageHeightPx) * contentRegionHeight;

    pdf.addImage(
      sliceCanvas.toDataURL("image/jpeg", 1.0),
      "JPEG",
      0,
      headerHeight,
      pageWidth,
      renderContentHeight
    );

    // 更新并渲染页脚
    if (updateFooter) {
      await Promise.resolve(updateFooter(i + 1, totalPages));
    }
    const updatedFooterCanvas = await html2canvas(footerEl, {
      scale: window.devicePixelRatio * 2,
    });

    pdf.addImage(
      updatedFooterCanvas,
      "JPEG",
      0,
      pageHeight - footerHeight,
      pageWidth,
      footerHeight
    );
  }

  return pdf;
}
