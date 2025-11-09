/**
 * 页脚渲染器
 * 负责页脚的预渲染和管理
 */

import type { PdfGenerationOptions } from "../types";
import { renderElementInIframe } from "../iframe";
import { extractPageStyles, createStyledClone } from "../serialization";

/**
 * 预渲染所有页脚
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

    if (onFooterUpdate) {
      await Promise.resolve(onFooterUpdate(pageNumber, totalPages));
    }

    const cloneElement = createStyledClone(footerElement);

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

  return await Promise.all(preRenderedFooters);
}
