/**
 * 元素序列化模块
 * 负责将 DOM 元素序列化为可传输的数据
 */

/**
 * 序列化元素为可传输的数据
 */
export function serializeElement(element: HTMLElement): any {
  return {
    tagName: element.tagName,
    innerHTML: element.innerHTML,
    outerHTML: element.outerHTML,
    styles: getComputedStylesObject(element),
    attributes: getElementAttributes(element),
    offsetWidth: element.offsetWidth,
    offsetHeight: element.offsetHeight,
    childrenStyles: serializeChildrenStyles(element)
  };
}

/**
 * 序列化子元素的样式
 */
function serializeChildrenStyles(element: HTMLElement): Record<string, any> {
  const childrenStyles: Record<string, any> = {};
  
  const allElements = element.querySelectorAll('*');
  allElements.forEach((child, index) => {
    if (child instanceof HTMLElement) {
      childrenStyles[index] = {
        tagName: child.tagName,
        className: child.className,
        styles: getComputedStylesObject(child)
      };
    }
  });
  
  return childrenStyles;
}

/**
 * 获取元素的计算样式对象
 */
function getComputedStylesObject(element: HTMLElement): Record<string, string> {
  const computedStyles = window.getComputedStyle(element);
  const styles: Record<string, string> = {};
  
  // 复制更全面的样式属性，确保布局正确
  const importantProperties = [
    // 尺寸和布局
    "width", "height", "min-width", "min-height", "max-width", "max-height",
    "margin", "margin-top", "margin-right", "margin-bottom", "margin-left",
    "padding", "padding-top", "padding-right", "padding-bottom", "padding-left",
    "border", "border-width", "border-style", "border-color",
    "border-top", "border-right", "border-bottom", "border-left",
    "box-sizing", "overflow", "overflow-x", "overflow-y",
    
    // 定位
    "display", "position", "top", "left", "right", "bottom",
    "float", "clear", "z-index",
    
    // 字体和文本
    "font-family", "font-size", "font-weight", "font-style",
    "color", "text-align", "text-decoration", "text-transform",
    "line-height", "letter-spacing", "word-spacing", "white-space",
    
    // 背景
    "background", "background-color", "background-image", "background-size",
    "background-position", "background-repeat", "background-attachment",
    
    // 其他视觉效果
    "opacity", "transform", "box-shadow", "border-radius",
    "visibility", "cursor"
  ];

  importantProperties.forEach((prop) => {
    const value = computedStyles.getPropertyValue(prop);
    if (value && value !== 'initial' && value !== 'inherit') {
      styles[prop] = value;
    }
  });

  return styles;
}

/**
 * 获取元素的属性
 */
function getElementAttributes(element: HTMLElement): Record<string, string> {
  const attributes: Record<string, string> = {};
  
  for (let i = 0; i < element.attributes.length; i++) {
    const attr = element.attributes[i];
    attributes[attr.name] = attr.value;
  }
  
  return attributes;
}

/**
 * 提取页面样式
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
