/**
 * 序列化模块统一导出
 */

// 元素序列化
export {
  serializeElement,
} from './element-serializer';

// 样式提取
export {
  extractPageStyles,
  copyComputedStyles,
  createStyledClone,
} from './style-extractor';
