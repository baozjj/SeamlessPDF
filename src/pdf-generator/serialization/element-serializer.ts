/**
 * 元素序列化器
 * 负责将DOM元素序列化为可传输的数据
 */

import type { SerializedElement } from "../types";

/**
 * 序列化元素为可传输的数据
 *
 * @param element - 要序列化的HTML元素
 * @returns SerializedElement - 序列化后的元素数据
 */
export function serializeElement(element: HTMLElement): SerializedElement {
  return {
    tagName: element.tagName,
    innerHTML: element.innerHTML,
    outerHTML: element.outerHTML,
    styles: getComputedStylesObject(element),
    attributes: getElementAttributes(element),
    offsetWidth: element.offsetWidth,
    offsetHeight: element.offsetHeight,
    childrenStyles: serializeChildrenStyles(element),
  };
}

/**
 * 序列化子元素的样式
 *
 * @param element - 父元素
 * @returns Record<string, any> - 子元素样式映射
 */
function serializeChildrenStyles(element: HTMLElement): Record<string, any> {
  const childrenStyles: Record<string, any> = {};

  const allElements = element.querySelectorAll("*");
  allElements.forEach((child, index) => {
    if (child instanceof HTMLElement) {
      childrenStyles[index] = {
        tagName: child.tagName,
        className: child.className,
        styles: getComputedStylesObject(child),
      };
    }
  });

  return childrenStyles;
}

/**
 * 获取元素的计算样式对象
 *
 * @param element - HTML元素
 * @returns Record<string, string> - 样式对象
 */
function getComputedStylesObject(element: HTMLElement): Record<string, string> {
  const computedStyles = window.getComputedStyle(element);
  const styles: Record<string, string> = {};

  // 重要的样式属性列表，确保布局正确
  const importantProperties = [
    // 尺寸和布局
    "width",
    "height",
    "min-width",
    "min-height",
    "max-width",
    "max-height",
    "margin",
    "margin-top",
    "margin-right",
    "margin-bottom",
    "margin-left",
    "padding",
    "padding-top",
    "padding-right",
    "padding-bottom",
    "padding-left",
    "border",
    "border-width",
    "border-style",
    "border-color",
    "border-top",
    "border-right",
    "border-bottom",
    "border-left",
    "box-sizing",
    "overflow",
    "overflow-x",
    "overflow-y",

    // 定位
    "display",
    "position",
    "top",
    "left",
    "right",
    "bottom",
    "float",
    "clear",
    "z-index",

    // 字体和文本
    "font-family",
    "font-size",
    "font-weight",
    "font-style",
    "color",
    "text-align",
    "text-decoration",
    "text-transform",
    "line-height",
    "letter-spacing",
    "word-spacing",
    "white-space",

    // 背景
    "background",
    "background-color",
    "background-image",
    "background-size",
    "background-position",
    "background-repeat",
    "background-attachment",

    // 其他视觉效果
    "opacity",
    "transform",
    "box-shadow",
    "border-radius",
    "visibility",
    "cursor",
  ];

  importantProperties.forEach((prop) => {
    const value = computedStyles.getPropertyValue(prop);
    if (value && value !== "initial" && value !== "inherit") {
      styles[prop] = value;
    }
  });

  return styles;
}

/**
 * 获取元素的属性
 *
 * @param element - HTML元素
 * @returns Record<string, string> - 属性对象
 */
function getElementAttributes(element: HTMLElement): Record<string, string> {
  const attributes: Record<string, string> = {};

  for (let i = 0; i < element.attributes.length; i++) {
    const attr = element.attributes[i];
    attributes[attr.name] = attr.value;
  }

  return attributes;
}
