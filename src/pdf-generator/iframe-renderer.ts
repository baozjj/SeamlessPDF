/**
 * iframe 隔离渲染模块
 * 提供跨域 iframe 多进程渲染功能
 */

import { serializeElement, extractPageStyles } from "./element-serializer";

/**
 * 在 iframe 中渲染元素为 Canvas
 * 这样可以避免阻塞主线程，提高用户界面响应性
 */
export async function renderElementsInIframe({
  headerElement,
  contentElement,
  footerElement,
}: {
  headerElement: HTMLElement;
  contentElement: HTMLElement;
  footerElement: HTMLElement;
}): Promise<{
  header: HTMLCanvasElement;
  content: HTMLCanvasElement;
  footer: HTMLCanvasElement;
}> {
  return new Promise((resolve, reject) => {
    // 创建隐藏的 iframe
    const iframe = document.createElement("iframe");
    iframe.style.position = "absolute";
    iframe.style.left = "-9999px";
    iframe.style.top = "-9999px";
    iframe.style.width = "1px";
    iframe.style.height = "1px";
    iframe.style.visibility = "hidden";

    // 设置超时处理
    const timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error("iframe 渲染超时"));
    }, 30000);

    const cleanup = () => {
      clearTimeout(timeoutId);
      if (iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
    };

    iframe.onload = async () => {
      try {
        // 使用 postMessage 与跨域 iframe 通信
        const renderResults = await renderInCrossOriginIframe(
          iframe.contentWindow!,
          {
            headerElement: serializeElement(headerElement),
            contentElement: serializeElement(contentElement),
            footerElement: serializeElement(footerElement),
            styles: await extractPageStyles(),
          }
        );

        cleanup();
        resolve(renderResults);
      } catch (error) {
        cleanup();
        reject(error);
      }
    };

    iframe.onerror = () => {
      cleanup();
      reject(new Error("iframe 加载失败"));
    };

    // 添加到 DOM 并加载跨域渲染页面
    document.body.appendChild(iframe);
    iframe.src = createCrossOriginRenderPage();
  });
}

/**
 * 创建跨域渲染页面
 */
function createCrossOriginRenderPage(): string {
  const renderPageHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>PDF Renderer</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
    <style>
        body { margin: 0; padding: 0; }
        .render-container { position: absolute; left: -9999px; top: -9999px; visibility: hidden; }
    </style>
</head>
<body>
    <script>
        window.addEventListener('message', async function(event) {
            let messageId = null;
            try {
                const { type, data, messageId: msgId } = event.data || {};
                messageId = msgId;
                
                if (type === 'RENDER_ELEMENTS') {
                    const results = await renderElements(data);
                    
                    event.source.postMessage({
                        type: 'RENDER_COMPLETE',
                        messageId: messageId,
                        data: results
                    }, '*');
                }
            } catch (error) {
                event.source.postMessage({
                    type: 'RENDER_ERROR',
                    messageId: messageId,
                    error: error.message
                }, '*');
            }
        });
        
        async function renderElements(data) {
            const { headerElement, contentElement, footerElement, styles } = data;
            
            // 注入样式
            const styleElement = document.createElement('style');
            styleElement.textContent = styles;
            document.head.appendChild(styleElement);
            
            // 创建渲染容器
            const container = document.createElement('div');
            container.className = 'render-container';
            document.body.appendChild(container);
            
            const results = {};
            const elementMap = {
                headerElement: 'header',
                contentElement: 'content', 
                footerElement: 'footer'
            };
            
            for (const [originalKey, elementData] of Object.entries({ headerElement, contentElement, footerElement })) {
                const key = elementMap[originalKey];
                
                const element = recreateElement(elementData);
                container.appendChild(element);
                
                if (element.offsetWidth === 0 || element.offsetHeight === 0) {
                    element.style.width = elementData.offsetWidth + 'px';
                    element.style.height = elementData.offsetHeight + 'px';
                }
                
                const renderWidth = elementData.offsetWidth;
                const renderHeight = elementData.offsetHeight;
                
                const canvas = await html2canvas(element, {
                    scale: window.devicePixelRatio * 2,
                    useCORS: true,
                    allowTaint: true,
                    logging: false,
                    width: renderWidth,
                    height: renderHeight,
                    windowWidth: renderWidth,
                    windowHeight: renderHeight
                });
                
                results[key] = {
                    dataURL: canvas.toDataURL('image/png'),
                    width: canvas.width,
                    height: canvas.height
                };
                
                container.removeChild(element);
            }
            
            document.body.removeChild(container);
            return results;
        }
        
        function recreateElement(elementData) {
            const element = document.createElement(elementData.tagName);
            element.innerHTML = elementData.innerHTML;
            
            if (elementData.styles) {
                Object.assign(element.style, elementData.styles);
            }
            
            if (elementData.attributes) {
                for (const [name, value] of Object.entries(elementData.attributes)) {
                    element.setAttribute(name, value);
                }
            }
            
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
            
            element.style.display = element.style.display || 'block';
            element.style.position = 'relative';
            element.style.visibility = 'visible';
            element.style.opacity = '1';
            
            if (elementData.offsetWidth && elementData.offsetHeight) {
                element.style.width = elementData.offsetWidth + 'px';
                element.style.height = elementData.offsetHeight + 'px';
                element.style.minWidth = elementData.offsetWidth + 'px';
                element.style.minHeight = elementData.offsetHeight + 'px';
                element.style.maxWidth = elementData.offsetWidth + 'px';
                element.style.maxHeight = elementData.offsetHeight + 'px';
            }
            
            element.style.boxSizing = element.style.boxSizing || 'border-box';
            element.style.overflow = element.style.overflow || 'hidden';
            element.style.wordWrap = element.style.wordWrap || 'break-word';
            element.style.wordBreak = element.style.wordBreak || 'break-word';
            
            return element;
        }
        
        window.parent.postMessage({ type: 'RENDERER_READY' }, '*');
    </script>
</body>
</html>`;

  return "data:text/html;charset=utf-8," + encodeURIComponent(renderPageHTML);
}

/**
 * 在跨域 iframe 中渲染元素
 */
async function renderInCrossOriginIframe(
  iframeWindow: Window,
  data: any
): Promise<{
  header: HTMLCanvasElement;
  content: HTMLCanvasElement;
  footer: HTMLCanvasElement;
}> {
  return new Promise((resolve, reject) => {
    const messageId = Math.random().toString(36).substring(2, 11);
    let isResolved = false;

    const timeout = setTimeout(() => {
      if (!isResolved) {
        isResolved = true;
        reject(new Error("跨域渲染超时"));
      }
    }, 30000);

    const messageHandler = async (event: MessageEvent) => {
      if (event.source !== iframeWindow) return;

      const {
        type,
        messageId: responseId,
        data: responseData,
        error,
      } = event.data;

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
        type: "RENDER_ELEMENTS",
        messageId: messageId,
        data: data,
      },
      "*"
    );
  });
}

/**
 * 将 base64 数据转换为 Canvas 对象
 */
async function convertDataURLsToCanvases(data: any): Promise<{
  header: HTMLCanvasElement;
  content: HTMLCanvasElement;
  footer: HTMLCanvasElement;
}> {
  const result: any = {};

  for (const [key, value] of Object.entries(data)) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;

    const imageData = value as any;
    canvas.width = imageData.width;
    canvas.height = imageData.height;

    const img = new Image();

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Timeout loading image for ${key}`));
      }, 10000);

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
