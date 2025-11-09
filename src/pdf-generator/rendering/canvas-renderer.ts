/**
 * Canvas渲染器
 * 负责将页面元素渲染为Canvas对象
 */

import type { CanvasElements } from "../types";
import { renderElementInIframe } from "../iframe";
import { extractPageStyles } from "../serialization";

/**
 * 将页面元素渲染为Canvas对象
 * 使用iframe隔离渲染，预先提取样式避免重复提取
 */
export async function renderElementsToCanvas({
  headerElement,
  contentElement,
  footerElement,
}: {
  headerElement: HTMLElement;
  contentElement: HTMLElement;
  footerElement: HTMLElement;
}): Promise<CanvasElements> {
  const pageStyles = await extractPageStyles();

  const [header, content, footer] = await Promise.all([
    renderElementInIframe(headerElement, "header", pageStyles, {
      enableSandbox: true,
    }),
    renderElementInIframe(contentElement, "content", pageStyles, {
      enableSandbox: true,
    }),
    renderElementInIframe(footerElement, "footer", pageStyles, {
      enableSandbox: true,
    }),
  ]);

  return { header, content, footer };
}
