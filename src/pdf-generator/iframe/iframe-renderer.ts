/**
 * iframe隔离渲染器
 * 提供跨域iframe多进程渲染功能
 */

import type {
  IframeRenderOptions,
  RenderDataTransferObject,
  CanvasRenderResult,
  MessageEventData,
} from "../types";
import { RENDER_TIMEOUT_MS, IMAGE_LOAD_TIMEOUT_MS } from "../constants";
import { serializeElement } from "../serialization";

/**
 * 在iframe中渲染单个元素为Canvas（使用预提取的样式）
 * 优化版本：避免重复提取样式，支持多进程并行渲染
 *
 * @param element - 要渲染的HTML元素
 * @param elementKey - 元素键名
 * @param preExtractedStyles - 预提取的样式
 * @param options - 渲染选项
 * @returns Promise<HTMLCanvasElement> - 渲染后的Canvas
 */
export async function renderElementInIframe(
  element: HTMLElement,
  elementKey: string,
  preExtractedStyles: string,
  options: IframeRenderOptions = {}
): Promise<HTMLCanvasElement> {
  const startTime = performance.now();
  console.log(`🚀 [性能监控] 调用 #${elementKey} 开始 - renderElementInIframe`);

  return new Promise((resolve, reject) => {
    // 为每个iframe生成唯一的进程ID
    const processId = generateProcessId(elementKey);

    // 创建隐藏的iframe
    const iframe = createHiddenIframe(processId, options);

    // 设置超时处理
    const timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error(`iframe 渲染超时 (进程: ${processId})`));
    }, RENDER_TIMEOUT_MS);

    const cleanup = () => {
      clearTimeout(timeoutId);
      if (iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
    };

    iframe.onload = async () => {
      try {
        // 使用postMessage与跨域iframe通信，传入预提取的样式
        const renderResults = await renderInCrossOriginIframe(
          iframe.contentWindow!,
          {
            element: serializeElement(element),
            elementKey: elementKey,
            styles: preExtractedStyles,
            processId: processId,
          }
        );

        const endTime = performance.now();
        const duration = endTime - startTime;
        console.log(
          `✅ [性能监控] 调用 #${elementKey} 完成: ${duration.toFixed(3)}ms`
        );

        cleanup();
        resolve(renderResults[elementKey]);
      } catch (error) {
        console.error(`iframe进程 ${processId} 渲染失败:`, error);
        cleanup();
        reject(error);
      }
    };

    iframe.onerror = () => {
      console.error(`iframe进程 ${processId} 加载失败`);
      cleanup();
      reject(new Error(`iframe 加载失败 (进程: ${processId})`));
    };

    iframe.srcdoc = createRenderPage(processId);
    document.body.appendChild(iframe);
  });
}

/**
 * 生成进程ID
 *
 * @param elementKey - 元素键名
 * @returns string - 进程ID
 */
function generateProcessId(elementKey: string): string {
  return `${elementKey}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * 创建隐藏的iframe
 *
 * @param processId - 进程ID
 * @param options - 渲染选项
 * @returns HTMLIFrameElement - iframe元素
 */
function createHiddenIframe(
  processId: string,
  options: IframeRenderOptions
): HTMLIFrameElement {
  const iframe = document.createElement("iframe");
  iframe.style.position = "absolute";
  iframe.style.left = "-9999px";
  iframe.style.top = "-9999px";
  iframe.style.width = "1px";
  iframe.style.height = "1px";
  iframe.style.visibility = "hidden";
  iframe.setAttribute("data-process-id", processId);

  // 配置沙盒模式
  const { enableSandbox = false, sandboxPermissions = "allow-scripts" } =
    options;
  if (enableSandbox) {
    iframe.sandbox = sandboxPermissions;
  }

  return iframe;
}

/**
 * 创建单个元素的渲染页面
 *
 * @param processId - 进程ID
 * @returns string - 渲染页面HTML
 */
function createRenderPage(processId?: string): string {
  const uniqueId = processId || Math.random().toString(36).substring(2, 15);
  const timestamp = Date.now();

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>PDF Renderer - Process ${uniqueId}</title>
    <script src="https://cdn.jsdelivr.net/npm/@zumer/snapdom/dist/snapdom.min.js"></script>
    <style>
        body {
            margin: 0;
            padding: 0;
        }
        .render-container {
            position: absolute;
            left: -9999px;
            top: -9999px;
            visibility: hidden;
        }
    </style>
    <meta name="process-id" content="${uniqueId}">
    <meta name="timestamp" content="${timestamp}">
</head>
<body data-process-id="${uniqueId}">
    <script>
        const PROCESS_ID = '${uniqueId}';

        window.addEventListener('message', async function(event) {
            let messageId = null;
            try {
                const { type, data, messageId: msgId } = event.data || {};
                messageId = msgId;

                if (type === 'RENDER_ELEMENT') {
                    const result = await renderSingleElement(data);

                    event.source.postMessage({
                        type: 'RENDER_COMPLETE',
                        messageId: messageId,
                        processId: PROCESS_ID,
                        data: result
                    }, '*');
                }
            } catch (error) {
                console.error('Process', PROCESS_ID, 'error:', error);
                event.source.postMessage({
                    type: 'RENDER_ERROR',
                    messageId: messageId,
                    processId: PROCESS_ID,
                    error: error.message
                }, '*');
            }
        });

        async function renderSingleElement(data) {
            const { element: elementData, elementKey, styles } = data;

            // 注入样式
            const styleElement = document.createElement('style');
            styleElement.textContent = styles;
            document.head.appendChild(styleElement);

            // 创建渲染容器
            const container = document.createElement('div');
            container.className = 'render-container';
            container.setAttribute('data-process', PROCESS_ID);
            document.body.appendChild(container);

            const element = recreateElement(elementData);
            container.appendChild(element);

            // 使用snapDOM渲染元素
            const canvas = await snapdom.toCanvas(element, {
                scale: window.devicePixelRatio * 2,
                fast: true,
                compress: true,
            });

            const result = {
                [elementKey]: {
                    dataURL: canvas.toDataURL('image/png'),
                    width: canvas.width,
                    height: canvas.height,
                    processId: PROCESS_ID
                }
            };

            document.body.removeChild(container);
            return result;
        }

        function recreateElement(elementData) {
            const element = document.createElement(elementData.tagName);
            element.innerHTML = elementData.innerHTML;

            // 应用原始样式
            if (elementData.styles) {
                Object.assign(element.style, elementData.styles);
            }

            // 应用原始属性
            if (elementData.attributes) {
                for (const [name, value] of Object.entries(elementData.attributes)) {
                    element.setAttribute(name, value);
                }
            }

            // 应用子元素样式
            if (elementData.childrenStyles) {
                const childElements = element.querySelectorAll('*');
                childElements.forEach((child, index) => {
                    if (elementData.childrenStyles[index] && child instanceof HTMLElement) {
                        const childStyles = elementData.childrenStyles[index].styles;
                        if (childStyles) {
                            Object.assign(child.style, childStyles);
                        }
                    }
                });
            }

            // 确保元素可见
            element.style.visibility = 'visible';
            element.style.opacity = '1';
            element.style.position = 'relative';

            return element;
        }

        window.parent.postMessage({ type: 'RENDERER_READY', processId: PROCESS_ID }, '*');
    </script>
</body>
</html>`;
}

/**
 * 在跨域iframe中渲染元素
 *
 * @param iframeWindow - iframe窗口对象
 * @param data - 渲染数据
 * @returns Promise<Record<string, HTMLCanvasElement>> - 渲染结果
 */
async function renderInCrossOriginIframe(
  iframeWindow: Window,
  data: RenderDataTransferObject
): Promise<Record<string, HTMLCanvasElement>> {
  return new Promise((resolve, reject) => {
    const messageId = Math.random().toString(36).substring(2, 11);
    let isResolved = false;

    const timeout = setTimeout(() => {
      if (!isResolved) {
        isResolved = true;
        reject(new Error("跨域渲染超时"));
      }
    }, RENDER_TIMEOUT_MS);

    const messageHandler = async (event: MessageEvent) => {
      if (event.source !== iframeWindow) return;

      const {
        type,
        messageId: responseId,
        data: responseData,
        error,
      }: MessageEventData = event.data;

      if (responseId !== messageId) return;

      if (type === "RENDER_COMPLETE" && !isResolved) {
        isResolved = true;
        clearTimeout(timeout);
        window.removeEventListener("message", messageHandler);

        try {
          const canvases = await convertDataURLsToCanvases(responseData);
          resolve(canvases);
        } catch (error) {
          reject(error);
        }
      } else if (type === "RENDER_ERROR" && !isResolved) {
        isResolved = true;
        clearTimeout(timeout);
        window.removeEventListener("message", messageHandler);
        reject(new Error(error));
      }
    };

    window.addEventListener("message", messageHandler);

    iframeWindow.postMessage(
      {
        type: "RENDER_ELEMENT",
        messageId: messageId,
        data: data,
      },
      "*"
    );
  });
}

/**
 * 将base64数据转换为Canvas对象
 *
 * @param data - 渲染结果数据
 * @returns Promise<Record<string, HTMLCanvasElement>> - Canvas对象映射
 */
async function convertDataURLsToCanvases(
  data: any
): Promise<Record<string, HTMLCanvasElement>> {
  const result: Record<string, HTMLCanvasElement> = {};

  for (const [key, value] of Object.entries(data)) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;

    const imageData = value as CanvasRenderResult;
    canvas.width = imageData.width;
    canvas.height = imageData.height;

    const img = new Image();

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Timeout loading image for ${key}`));
      }, IMAGE_LOAD_TIMEOUT_MS);

      img.onload = () => {
        try {
          clearTimeout(timeout);

          const imgAspectRatio = img.width / img.height;
          const canvasAspectRatio = canvas.width / canvas.height;

          ctx.clearRect(0, 0, canvas.width, canvas.height);

          if (Math.abs(imgAspectRatio - canvasAspectRatio) > 0.01) {
            let drawWidth,
              drawHeight,
              offsetX = 0,
              offsetY = 0;

            if (imgAspectRatio > canvasAspectRatio) {
              drawWidth = canvas.width;
              drawHeight = canvas.width / imgAspectRatio;
              offsetY = (canvas.height - drawHeight) / 2;
            } else {
              drawHeight = canvas.height;
              drawWidth = canvas.height * imgAspectRatio;
              offsetX = (canvas.width - drawWidth) / 2;
            }

            ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
          } else {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          }

          resolve();
        } catch (error) {
          clearTimeout(timeout);
          reject(error);
        }
      };

      img.onerror = () => {
        clearTimeout(timeout);
        reject(new Error(`Failed to load image for ${key}`));
      };

      if (!imageData.dataURL || !imageData.dataURL.startsWith("data:image/")) {
        clearTimeout(timeout);
        reject(new Error(`Invalid dataURL for ${key}`));
        return;
      }

      img.src = imageData.dataURL;
    });

    result[key] = canvas;
  }

  return result;
}
