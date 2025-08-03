/**
 * 任务执行服务
 * 处理iframe长任务和主线程长任务的执行
 */

/**
 * 生成iframe HTML模板
 * @param {number} duration - 任务持续时间（毫秒）
 * @returns {string} iframe HTML内容
 */
export function generateIframeTemplate(duration) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Long Task iframe</title>
    </head>
    <body>
      <script>
        console.log('iframe 长任务开始执行...')
        const startTime = performance.now()
        const duration = ${duration}

        // 执行不可中断的长任务
        function longTask() {
          const endTime = startTime + duration
          let result = 0

          while (performance.now() < endTime) {
            // 执行一些计算密集型操作
            for (let i = 0; i < 100000; i++) {
              result += Math.sqrt(i) * Math.sin(i) * Math.cos(i)
            }
          }

          const actualDuration = performance.now() - startTime
          console.log('iframe 长任务执行完成，实际耗时:', actualDuration + 'ms')

          // 通知父页面任务完成
          parent.postMessage({
            type: 'taskComplete',
            duration: actualDuration
          }, '*')

          return result
        }

        // 立即执行长任务
        longTask()
      <\/script>
    </body>
    </html>
  `
}

/**
 * 执行iframe长任务
 * @param {number} duration - 任务持续时间（毫秒）
 * @returns {Promise<number>} 返回任务执行时间
 */
export function executeIframeTask(duration) {
  return new Promise((resolve, reject) => {
    console.log(`开始创建 iframe 长任务，持续时间: ${duration}ms`)
    
    const startTime = performance.now()
    
    // 创建 iframe
    const iframe = document.createElement('iframe')
    iframe.style.display = 'none' // 隐藏 iframe
    
    // 设置iframe内容
    iframe.srcdoc = generateIframeTemplate(duration)
    
    // 监听来自 iframe 的消息
    const messageHandler = (event) => {
      if (event.data.type === 'taskComplete') {
        const totalTime = performance.now() - startTime
        
        console.log(`iframe 长任务完成，总耗时: ${totalTime}ms`)
        
        // 清理
        window.removeEventListener('message', messageHandler)
        const container = document.getElementById('iframe-container')
        if (container && container.contains(iframe)) {
          container.removeChild(iframe)
        }
        
        resolve(Math.round(totalTime))
      }
    }
    
    // 错误处理
    iframe.onerror = () => {
      window.removeEventListener('message', messageHandler)
      reject(new Error('iframe 加载失败'))
    }
    
    window.addEventListener('message', messageHandler)
    
    // 将 iframe 添加到页面
    const container = document.getElementById('iframe-container')
    if (container) {
      container.appendChild(iframe)
    } else {
      reject(new Error('找不到 iframe 容器'))
    }
  })
}

/**
 * 执行主线程长任务
 * @param {number} duration - 任务持续时间（毫秒）
 * @returns {Promise<number>} 返回任务执行时间
 */
export function executeMainThreadTask(duration) {
  return new Promise((resolve) => {
    console.log(`开始主线程长任务，持续时间: ${duration}ms`)
    
    const startTime = performance.now()
    
    // 使用 setTimeout 来避免完全阻塞 UI（但仍然会有明显影响）
    setTimeout(() => {
      const endTime = startTime + duration
      let result = 0
      
      while (performance.now() < endTime) {
        // 执行一些计算密集型操作
        for (let i = 0; i < 100000; i++) {
          result += Math.sqrt(i) * Math.sin(i) * Math.cos(i)
        }
      }
      
      const actualDuration = performance.now() - startTime
      console.log(`主线程长任务完成，实际耗时: ${actualDuration}ms`)
      
      resolve(Math.round(actualDuration))
    }, 10)
  })
}

/**
 * 任务执行器类
 * 提供统一的任务执行接口
 */
export class TaskExecutor {
  constructor() {
    this.isRunning = false
  }
  
  /**
   * 执行任务
   * @param {string} type - 任务类型 ('iframe' | 'mainThread')
   * @param {number} duration - 任务持续时间
   * @param {Function} onStatusChange - 状态变化回调
   * @returns {Promise<number>} 任务执行时间
   */
  async executeTask(type, duration, onStatusChange) {
    if (this.isRunning) {
      throw new Error('任务正在执行中')
    }
    
    this.isRunning = true
    
    try {
      let result
      
      if (type === 'iframe') {
        onStatusChange?.('创建 iframe 并执行长任务...')
        result = await executeIframeTask(duration)
        onStatusChange?.(`iframe 长任务完成，总耗时: ${result}ms`)
      } else if (type === 'mainThread') {
        onStatusChange?.('主线程执行长任务...')
        result = await executeMainThreadTask(duration)
        onStatusChange?.(`主线程长任务完成，耗时: ${result}ms`)
      } else {
        throw new Error('未知的任务类型')
      }
      
      return result
    } finally {
      this.isRunning = false
    }
  }
  
  /**
   * 检查是否正在执行任务
   */
  get running() {
    return this.isRunning
  }
}
