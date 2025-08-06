/**
 * 任务执行服务
 * 处理iframe长任务和主线程长任务的执行
 */

/**
 * 生成iframe HTML模板
 * @param {number} elementCount - DOM元素数量
 * @returns {string} iframe HTML内容
 */
export function generateIframeTemplate(elementCount) {
  const iframeHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Long Task iframe</title>
      <style>
        body {
          margin: 0;
          padding: 20px;
          font-family: Arial, sans-serif;
        }

        #test-container {
          width: 1400px;
          max-height: 3000px;
          border: 2px solid #333;
          padding: 10px;
          background: #f5f5f5;
          display: flex;
          flex-wrap: wrap;
          gap: 2px;
          align-content: flex-start;
          overflow: hidden;
        }

        .test-div {
          width: 20px;
          height: 20px;
          background: #667eea;
          border-radius: 2px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 6px;
          box-shadow: 0 1px 1px rgba(0,0,0,0.1);
          transition: none;
        }

        .test-div:nth-child(odd) {
          background: #ff6b6b;
        }

        .test-div:nth-child(3n) {
          background: #4ecdc4;
        }

        .test-div:nth-child(5n) {
          background: #feca57;
        }

        .test-div:nth-child(7n) {
          background: #a55eea;
        }

        .test-div:nth-child(11n) {
          background: #26de81;
        }
      </style>
    </head>
    <body>
      <h2>iframe Canvas生成测试页面</h2>
      <p>正在创建DOM结构并生成canvas...</p>

      <!-- 测试DOM结构 -->
      <div id="test-container">
        <!-- 50个测试div将通过JavaScript动态创建 -->
      </div>

      <!-- 引入snapDOM库 -->
      <script src="https://cdn.jsdelivr.net/npm/@zumer/snapdom/dist/snapdom.min.js"></script>

      <script>
        console.log('iframe canvas生成任务开始执行...')
        const startTime = performance.now()
        const elementCount = ${elementCount}

        // 创建测试DOM结构
        function createTestDOM() {
          const container = document.getElementById('test-container')

          console.log('开始创建', elementCount, '个DOM元素')

          // 使用文档片段提高性能
          const fragment = document.createDocumentFragment()

          // 根据元素数量调整显示内容
          const showNumbers = elementCount <= 1000 // 超过1000个元素时不显示数字以提高性能

          for (let i = 1; i <= elementCount; i++) {
            const div = document.createElement('div')
            div.className = 'test-div'

            // 只在元素较少时显示数字
            if (showNumbers) {
              div.textContent = i
            }

            fragment.appendChild(div)

            // 每1000个元素输出一次进度
            if (i % 1000 === 0) {
              console.log('已创建', i, '个元素...')
            }
          }

          container.appendChild(fragment)
          console.log('DOM结构创建完成，包含', elementCount, '个div元素')
        }

        // 使用snapDOM生成canvas
        async function generateCanvas() {
          const container = document.getElementById('test-container')

          if (!container) {
            console.error('找不到test-container元素')
            return generateFallbackCanvas()
          }

          console.log('容器元素找到，子元素数量:', container.children.length)
          console.log('容器尺寸:', container.offsetWidth, 'x', container.offsetHeight)
          console.log('容器滚动尺寸:', container.scrollWidth, 'x', container.scrollHeight)

          // 确保容器有有效的尺寸
          if (container.offsetWidth === 0 || container.offsetHeight === 0) {
            console.warn('容器尺寸为0，尝试设置默认尺寸')
            container.style.width = '820px'
            container.style.height = '620px'
            // 等待样式应用
            await new Promise(resolve => setTimeout(resolve, 100))
          }

          try {
            console.log('开始使用snapDOM生成canvas...')

            // 检查snapdom是否可用
            if (typeof snapdom === 'undefined') {
              console.error('snapDOM库未加载')
              return generateFallbackCanvas()
            }

            // 根据元素数量调整snapDOM配置
            const scale = elementCount > 3000 ? 0.5 : elementCount > 1000 ? 0.8 : 1
            const fast = elementCount > 1000 // 大量元素时使用快速模式

            console.log('snapDOM配置: scale =', scale, ', fast =', fast)

            const canvas = await snapdom.toCanvas(container, {
              backgroundColor: '#ffffff',
              scale: window.devicePixelRatio * scale,
              fast: fast,
              compress: true,
              width: 1600,
              height: 3200,
            })

            console.log('snapDOM执行完成，检查结果...')
            console.log('Canvas对象:', canvas)
            console.log('Canvas尺寸:', canvas ? canvas.width + 'x' + canvas.height : 'null')

            if (!canvas) {
              console.error('snapDOM返回了null')
              return generateFallbackCanvas()
            }

            if (canvas.width === 0 || canvas.height === 0) {
              console.error('snapDOM返回了无效的canvas尺寸:', canvas.width, 'x', canvas.height)
              return generateFallbackCanvas()
            }

            // 将canvas转换为base64数据
            const canvasData = canvas.toDataURL('image/png')
            console.log('snapDOM生成完成，尺寸:', canvas.width, 'x', canvas.height, '数据大小:', canvasData.length, '字符')

            return {
              dataURL: canvasData,
              width: canvas.width,
              height: canvas.height
            }
          } catch (error) {
            console.error('snapDOM生成失败，使用备用方案:', error.message)
            return generateFallbackCanvas()
          }
        }

        // 备用canvas生成方案
        function generateFallbackCanvas() {
          try {
            console.log('使用备用方案生成canvas...')
            const canvas = document.createElement('canvas')
            canvas.width = 1420
            canvas.height = 3020
            const ctx = canvas.getContext('2d')

            if (!ctx) {
              throw new Error('无法获取canvas上下文')
            }

            // 绘制背景
            ctx.fillStyle = '#f5f5f5'
            ctx.fillRect(0, 0, canvas.width, canvas.height)

            // 绘制边框
            ctx.strokeStyle = '#333333'
            ctx.lineWidth = 2
            ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2)

            // 添加标题
            ctx.fillStyle = '#333333'
            ctx.font = 'bold 16px Arial'
            ctx.textAlign = 'left'
            ctx.fillText('iframe 长任务测试页面 - 备用Canvas', 20, 30)

            // 获取实际的DOM元素数量
            const actualContainer = document.getElementById('test-container')
            const actualElementCount = actualContainer ? actualContainer.children.length : elementCount

            // 绘制50个彩色方块
            const colors = ['#667eea', '#ff6b6b', '#4ecdc4', '#feca57', '#a55eea', '#26de81']
            let x = 20, y = 50
            const boxSize = 20
            const gap = 2
            const cols = Math.floor((canvas.width - 40) / (boxSize + gap))

            // 根据元素数量限制绘制数量
            const maxDrawElements = Math.min(actualElementCount, 10000) // 最多绘制10000个
            console.log('备用canvas将绘制', maxDrawElements, '个元素（实际DOM元素：', actualElementCount, '个）')

            for (let i = 1; i <= maxDrawElements; i++) {
              // 计算颜色索引
              let colorIndex = 0
              if (i % 2 === 1) colorIndex = 1  // 奇数
              if (i % 3 === 0) colorIndex = 2  // 3的倍数
              if (i % 5 === 0) colorIndex = 3  // 5的倍数
              if (i % 7 === 0) colorIndex = 4  // 7的倍数
              if (i % 11 === 0) colorIndex = 5 // 11的倍数

              ctx.fillStyle = colors[colorIndex]

              // 绘制矩形（使用简单矩形替代圆角矩形以确保兼容性）
              ctx.fillRect(x, y, boxSize, boxSize)

              // 绘制边框
              ctx.strokeStyle = 'rgba(255,255,255,0.3)'
              ctx.lineWidth = 1
              ctx.strokeRect(x, y, boxSize, boxSize)

              // 绘制数字（只在前100个元素上绘制数字以提高性能）
              if (i <= 100) {
                ctx.fillStyle = 'white'
                ctx.font = 'bold 14px Arial'
                ctx.textAlign = 'center'
                ctx.textBaseline = 'middle'
                ctx.fillText(i.toString(), x + boxSize/2, y + boxSize/2)
              }

              // 计算下一个位置
              x += boxSize + gap
              if ((i % cols) === 0) {
                x = 20
                y += boxSize + gap
              }

              // 如果超出canvas高度，停止绘制
              if (y + boxSize > canvas.height - 20) {
                console.log('达到canvas高度限制，停止绘制，已绘制', i, '个元素')
                break
              }
            }

            const canvasData = canvas.toDataURL('image/png')
            console.log('备用canvas生成完成，尺寸:', canvas.width, 'x', canvas.height, '数据大小:', canvasData.length, '字符')

            return {
              dataURL: canvasData,
              width: canvas.width,
              height: canvas.height
            }
          } catch (error) {
            console.error('备用canvas生成也失败:', error)
            // 返回一个最简单的canvas
            return generateMinimalCanvas()
          }
        }

        // 最简单的canvas生成方案
        function generateMinimalCanvas() {
          try {
            console.log('使用最简canvas方案...')
            const canvas = document.createElement('canvas')
            canvas.width = 400
            canvas.height = 300
            const ctx = canvas.getContext('2d')

            // 绘制简单背景
            ctx.fillStyle = '#f0f0f0'
            ctx.fillRect(0, 0, canvas.width, canvas.height)

            // 绘制文字
            ctx.fillStyle = '#333333'
            ctx.font = '20px Arial'
            ctx.textAlign = 'center'
            ctx.fillText('Canvas生成成功', canvas.width/2, canvas.height/2)
            ctx.fillText('包含50个测试元素', canvas.width/2, canvas.height/2 + 30)

            const canvasData = canvas.toDataURL('image/png')
            console.log('最简canvas生成完成')

            return {
              dataURL: canvasData,
              width: canvas.width,
              height: canvas.height
            }
          } catch (error) {
            console.error('最简canvas也失败:', error)
            return null
          }
        }

        // 执行canvas生成任务
        async function canvasTask() {
          // 首先创建DOM结构
          createTestDOM()

          // 根据元素数量调整等待时间
          const waitTime = Math.min(500 + Math.floor(elementCount / 10), 2000)
          console.log('等待DOM渲染完成，等待时间:', waitTime + 'ms')
          await new Promise(resolve => setTimeout(resolve, waitTime))

          console.log('DOM渲染完成，开始生成canvas...')

          // 生成canvas数据
          let canvasData = null
          try {
            canvasData = await generateCanvas()
            console.log('canvas数据生成成功:', canvasData)
          } catch (error) {
            console.error('canvas数据生成失败:', error)
          }

          const actualDuration = performance.now() - startTime
          console.log('iframe canvas任务执行完成，实际耗时:', actualDuration + 'ms')

          // 通知父页面任务完成，包含canvas数据
          parent.postMessage({
            type: 'taskComplete',
            duration: actualDuration,
            canvasData: canvasData,
            domElementCount: elementCount
          }, '*')
        }

        // 等待snapDOM库加载完成后执行canvas任务
        function waitForSnapDOM() {
          if (typeof snapdom !== 'undefined') {
            console.log('snapDOM库加载完成')
            canvasTask()
          } else {
            console.log('等待snapDOM库加载...')
            setTimeout(waitForSnapDOM, 100)
          }
        }

        // 开始执行
        waitForSnapDOM()
      <\/script>
    </body>
    </html>
  `;

  const blob = new Blob([iframeHTML], { type: "text/html" });
  const blobUrl = URL.createObjectURL(blob);
  return blobUrl;
}

/**
 * 执行iframe canvas生成任务
 * @param {number} elementCount - DOM元素数量
 * @returns {Promise<{executionTime: number, canvasData: object|null}>} 返回任务执行时间和canvas数据
 */
export function executeIframeTask(elementCount) {
  return new Promise((resolve, reject) => {
    console.log(`开始创建 iframe canvas任务，元素数量: ${elementCount}个`);

    const startTime = performance.now();

    // 创建 iframe
    const iframe = document.createElement("iframe");
    iframe.style.display = "none"; // 隐藏 iframe

    // iframe.sandbox = "allow-scripts ";

    // 设置iframe内容
    iframe.src = generateIframeTemplate(elementCount);

    // 监听来自 iframe 的消息
    const messageHandler = (event) => {
      if (event.data.type === "taskComplete") {
        const totalTime = performance.now() - startTime;

        console.log(`iframe 长任务完成，总耗时: ${totalTime}ms`);

        // 处理canvas数据
        if (event.data.canvasData) {
          console.log("接收到canvas数据:", {
            width: event.data.canvasData.width,
            height: event.data.canvasData.height,
            dataSize: event.data.canvasData.dataURL.length,
          });
        }

        // 清理
        window.removeEventListener("message", messageHandler);
        const container = document.getElementById("iframe-container");
        if (container && container.contains(iframe)) {
          container.removeChild(iframe);
        }

        resolve({
          executionTime: Math.round(totalTime),
          canvasData: event.data.canvasData,
          domElementCount: event.data.domElementCount,
        });
      }
    };

    // 错误处理
    iframe.onerror = () => {
      window.removeEventListener("message", messageHandler);
      reject(new Error("iframe 加载失败"));
    };

    window.addEventListener("message", messageHandler);

    // 将 iframe 添加到页面
    const container = document.getElementById("iframe-container");
    if (container) {
      container.appendChild(iframe);
    } else {
      reject(new Error("找不到 iframe 容器"));
    }
  });
}

/**
 * 任务执行器类
 * 提供统一的任务执行接口
 */
export class TaskExecutor {
  constructor() {
    this.isRunning = false;
  }

  /**
   * 执行Canvas生成任务
   * @param {number} elementCount - DOM元素数量
   * @param {Function} onStatusChange - 状态变化回调
   * @returns {Promise<{executionTime: number, canvasData?: object, domElementCount?: number}>} 任务执行结果
   */
  async executeCanvasTask(elementCount, onStatusChange) {
    if (this.isRunning) {
      throw new Error("任务正在执行中");
    }

    this.isRunning = true;

    try {
      onStatusChange?.(
        `创建 iframe 并生成包含${elementCount}个元素的canvas...`
      );
      const result = await executeIframeTask(elementCount);

      // 构建状态消息
      let statusMessage = `iframe canvas生成完成，总耗时: ${result.executionTime}ms`;
      if (result.canvasData) {
        statusMessage += `，生成了包含${result.domElementCount}个元素的canvas`;
      }
      onStatusChange?.(statusMessage);

      return result;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * 检查是否正在执行任务
   */
  get running() {
    return this.isRunning;
  }
}
