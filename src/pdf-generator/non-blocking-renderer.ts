/**
 * 非阻塞渲染工具模块
 * 提供通用的非阻塞 HTML 元素渲染功能
 */

import html2canvas from "html2canvas";

/**
 * 通用的非阻塞 HTML 元素渲染函数
 * 可以选择使用 iframe 多进程渲染或简单的非阻塞渲染
 */
export async function renderElementNonBlocking(
  element: HTMLElement,
  options: {
    useIframe?: boolean;
    scale?: number;
    maxWidth?: number;
  } = {}
): Promise<HTMLCanvasElement> {
  const {
    useIframe = false,
    scale = window.devicePixelRatio * 2,
    maxWidth,
  } = options;

  // 如果指定了最大宽度，先应用宽度约束
  const originalStyles = maxWidth
    ? applyWidthConstraints(element, maxWidth)
    : null;

  try {
    if (useIframe) {
      // 使用 iframe 多进程渲染（适用于复杂元素）
      return await renderSingleElementInIframe(element);
    } else {
      // 使用简单的非阻塞渲染（适用于简单元素如页脚）
      return await renderElementWithYield(element, scale);
    }
  } finally {
    // 恢复原始样式
    if (originalStyles) {
      restoreOriginalStyles(element, originalStyles);
    }
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
  // 对于单个元素的 iframe 渲染，直接使用简单的非阻塞渲染
  // 因为 iframe 渲染主要是为了处理多个复杂元素的并行渲染
  // 单个元素使用简单渲染更可靠
  return await renderElementWithYield(element, window.devicePixelRatio * 2);
}

/**
 * 应用宽度约束到元素
 */
function applyWidthConstraints(
  element: HTMLElement,
  maxWidth: number
): {
  width: string;
  maxWidth: string;
  boxSizing: string;
  overflow: string;
  overflowWrap: string;
} {
  const originalStyles = {
    width: element.style.width,
    maxWidth: element.style.maxWidth,
    boxSizing: element.style.boxSizing,
    overflow: element.style.overflow,
    overflowWrap: element.style.overflowWrap,
  };

  element.style.width = `${maxWidth}px`;
  element.style.maxWidth = `${maxWidth}px`;
  element.style.boxSizing = "border-box";
  element.style.overflow = "hidden";
  element.style.overflowWrap = "break-word";

  // 强制重新布局
  element.offsetHeight;

  return originalStyles;
}

/**
 * 恢复元素的原始样式
 */
function restoreOriginalStyles(
  element: HTMLElement,
  originalStyles: {
    width: string;
    maxWidth: string;
    boxSizing: string;
    overflow: string;
    overflowWrap: string;
  }
): void {
  element.style.width = originalStyles.width;
  element.style.maxWidth = originalStyles.maxWidth;
  element.style.boxSizing = originalStyles.boxSizing;
  element.style.overflow = originalStyles.overflow;
  element.style.overflowWrap = originalStyles.overflowWrap;
}
