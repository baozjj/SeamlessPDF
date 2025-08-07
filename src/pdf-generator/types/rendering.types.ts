/**
 * 渲染相关的类型定义
 */

/**
 * iframe渲染配置选项
 */
export interface IframeRenderOptions {
  /** 是否启用沙盒模式 */
  enableSandbox?: boolean;
  /** 沙盒权限设置 */
  sandboxPermissions?: string;
}

/**
 * 序列化元素数据
 */
export interface SerializedElement {
  /** 标签名 */
  tagName: string;
  /** 内部HTML */
  innerHTML: string;
  /** 外部HTML */
  outerHTML: string;
  /** 计算样式 */
  styles: Record<string, string>;
  /** 元素属性 */
  attributes: Record<string, string>;
  /** 偏移宽度 */
  offsetWidth: number;
  /** 偏移高度 */
  offsetHeight: number;
  /** 子元素样式 */
  childrenStyles: Record<string, any>;
}

/**
 * 渲染数据传输对象
 */
export interface RenderDataTransferObject {
  /** 序列化的元素 */
  element: SerializedElement;
  /** 元素键名 */
  elementKey: string;
  /** 页面样式 */
  styles: string;
  /** 进程ID */
  processId: string;
}

/**
 * Canvas渲染结果
 */
export interface CanvasRenderResult {
  /** 数据URL */
  dataURL: string;
  /** 宽度 */
  width: number;
  /** 高度 */
  height: number;
  /** 进程ID */
  processId: string;
}

/**
 * 消息事件数据
 */
export interface MessageEventData {
  /** 消息类型 */
  type: string;
  /** 消息ID */
  messageId?: string;
  /** 进程ID */
  processId?: string;
  /** 数据内容 */
  data?: any;
  /** 错误信息 */
  error?: string;
}
