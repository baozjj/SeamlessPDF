/**
 * Canvas渲染器
 * 负责将页面元素渲染为Canvas对象
 */

import type { CanvasElements } from "../types";
import { renderElementInIframe } from "../iframe";
import { extractPageStyles } from "../serialization";

/**
 * 将页面元素渲染为Canvas对象（使用iframe隔离渲染）
 *
 * @param elements - 页面元素集合
 * @returns Promise<CanvasElements> - 渲染后的Canvas元素集合
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

  const parallelEndTime = performance.now();
  console.log(
    `iframe并行渲染耗时: ${(parallelEndTime - parallelStartTime).toFixed(2)}ms`
  );

  return { header, content, footer };
}
