/**
 * 非阻塞渲染工具模块
 * 提供通用的非阻塞 HTML 元素渲染功能
 */

import html2canvas from "html2canvas";
import { renderElementsInIframe } from "./iframe-renderer";

/**
 * 通用的非阻塞 HTML 元素渲染函数
 * 可以选择使用 iframe 多进程渲染或简单的非阻塞渲染
 */
export async function renderElementNonBlocking(
  element: HTMLElement,
  options: {
    useIframe?: boolean;
    scale?: number;
  } = {}
): Promise<HTMLCanvasElement> {
  const { useIframe = false, scale = window.devicePixelRatio * 2 } = options;

  if (useIframe) {
    // 使用 iframe 多进程渲染（适用于复杂元素）
    return await renderSingleElementInIframe(element);
  } else {
    // 使用简单的非阻塞渲染（适用于简单元素如页脚）
    return await renderElementWithYield(element, scale);
  }
}

/**
 * 使用时间切片的简单非阻塞渲染
 */
async function renderElementWithYield(
  element: HTMLElement,
  scale: number = window.devicePixelRatio * 2
): Promise<HTMLCanvasElement> {
  // 让出主线程控制权
  await new Promise((resolve) => setTimeout(resolve, 0));

  // 使用优化的 html2canvas 配置
  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    allowTaint: true,
    logging: false,
    imageTimeout: 15000,
    removeContainer: true,
    ignoreElements: (element: Element) => {
      const htmlElement = element as HTMLElement;
      return (
        element.tagName === "SCRIPT" ||
        element.tagName === "NOSCRIPT" ||
        (htmlElement.style && htmlElement.style.display === "none")
      );
    },
  });

  return canvas;
}

/**
 * 为单个元素使用 iframe 渲染（复用现有的多元素渲染）
 */
async function renderSingleElementInIframe(
  element: HTMLElement
): Promise<HTMLCanvasElement> {
  // 复用现有的多元素渲染，但只传入一个元素
  const result = await renderElementsInIframe({
    headerElement: element,
    contentElement: element,
    footerElement: element,
  });

  // 返回其中一个结果（它们都是同一个元素）
  return result.header;
}
