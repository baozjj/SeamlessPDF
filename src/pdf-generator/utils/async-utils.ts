/**
 * 异步工具函数
 */

/**
 * 让出主线程控制权，允许浏览器更新 UI
 */
export function yieldToMain(): Promise<void> {
  return new Promise((resolve) => {
      setTimeout(resolve, 0);
  });
}


