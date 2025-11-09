/**
 * 渲染相关的类型定义
 */

/**
 * iframe渲染配置选项
 */
export interface IframeRenderOptions {
  enableSandbox?: boolean;
  sandboxPermissions?: string;
}

/**
 * 序列化元素数据
 */
export interface SerializedElement {
  tagName: string;
  innerHTML: string;
  styles: Record<string, string>;
  attributes: Record<string, string>;
  offsetWidth: number;
  offsetHeight: number;
  childrenStyles: Record<string, any>;
}

/**
 * 渲染数据传输对象
 */
export interface RenderDataTransferObject {
  element: SerializedElement;
  elementKey: string;
  styles: string;
  processId: string;
}

/**
 * Canvas渲染结果
 */
export interface CanvasRenderResult {
  dataURL: string;
  width: number;
  height: number;
  processId: string;
}

/**
 * 消息事件数据
 */
export interface MessageEventData {
  type: string;
  messageId?: string;
  processId?: string;
  data?: any;
  error?: string;
}
