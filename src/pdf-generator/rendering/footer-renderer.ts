/**
 * 页脚渲染器
 * 负责页脚的预渲染和管理
 */

import type { PdfGenerationOptions } from "../types";
import { renderElementInIframe } from "../iframe";
import { extractPageStyles, createStyledClone } from "../serialization";

/**
 * 预渲染所有页脚
 *
 * @param config - 页脚渲染配置
 * @returns Promise<HTMLCanvasElement[]> - 预渲染的页脚Canvas数组
 */
export async function preRenderAllFooters({
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
    const footerCanvas = renderElementInIframe(
      cloneElement,
      `footer-page-${pageNumber}`,
      pageStyles,
      {
        enableSandbox: true,
      }
    );
    preRenderedFooters.push(footerCanvas);
  }

  const result = await Promise.all(preRenderedFooters);
  return result;
}
