/**
 * 样式提取器
 * 负责提取页面样式信息
 */

/**
 * 提取页面样式
 * 
 * @returns Promise<string> - 页面样式字符串
 */
export async function extractPageStyles(): Promise<string> {
  let styles = '';
  
  // 提取所有样式表
  for (const styleSheet of Array.from(document.styleSheets)) {
    try {
      if (styleSheet.href) {
        // 外部样式表
        const response = await fetch(styleSheet.href);
        styles += await response.text() + '\n';
      } else if (styleSheet.cssRules) {
        // 内联样式表
        const cssRules = Array.from(styleSheet.cssRules);
        styles += cssRules.map(rule => rule.cssText).join('\n') + '\n';
      }
    } catch (error) {
      console.warn('无法提取样式表:', error);
    }
  }
  
  // 提取内联样式
  const inlineStyles = Array.from(document.querySelectorAll('style'));
  inlineStyles.forEach(style => {
    styles += style.textContent + '\n';
  });
  
  return styles;
}

/**
 * 复制元素的计算样式
 * 
 * @param source - 源元素
 * @param target - 目标元素
 */
export function copyComputedStyles(source: HTMLElement, target: HTMLElement): void {
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
 * 
 * @param property - CSS属性名
 * @returns boolean - 是否应该跳过
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
 * 创建带有完整样式的元素克隆
 * 
 * @param element - 要克隆的元素
 * @returns HTMLElement - 克隆的元素
 */
export function createStyledClone(element: HTMLElement): HTMLElement {
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
