<template>
  <div class="iframe-test-container">
    <h1>iframe 性能测试页面</h1>

    <!-- 主页面渲染区域 -->
    <div class="render-area">
      <h2>主页面渲染区域</h2>
      <div class="animation-container">
        <!-- 旋转的元素 -->
        <div
          class="rotating-element"
          :style="{ transform: `rotate(${rotation}deg)` }"
        >
          🌟
        </div>

        <!-- 移动的小球 -->
        <div class="moving-ball" :style="{ left: ballPosition + 'px' }"></div>

        <!-- 实时计数器 -->
        <div class="counter">计数器: {{ counter }}</div>

        <!-- FPS 计数器 -->
        <div class="fps-counter">FPS: {{ fps }}</div>
      </div>
    </div>

    <!-- 控制面板 -->
    <div class="control-panel">
      <h2>控制面板</h2>

      <div class="task-duration-selector">
        <label>长任务持续时间:</label>
        <select v-model="taskDuration">
          <option value="1000">1秒</option>
          <option value="3000">3秒</option>
          <option value="5000">5秒</option>
        </select>
      </div>

      <div class="button-group">
        <button
          @click="createLongTaskIframe"
          :disabled="isRunningTask"
          class="test-button"
        >
          {{ isRunningTask ? "执行中..." : "创建长任务 iframe" }}
        </button>

        <button
          @click="runMainThreadTask"
          :disabled="isRunningTask"
          class="test-button compare-button"
        >
          {{ isRunningTask ? "执行中..." : "主线程长任务对比" }}
        </button>
      </div>

      <div class="status-info">
        <p>状态: {{ status }}</p>
        <p v-if="lastTaskTime">上次任务执行时间: {{ lastTaskTime }}ms</p>
      </div>
    </div>

    <!-- 测试说明 -->
    <div class="instructions">
      <h3>测试说明</h3>
      <ul>
        <li>观察上方的动画元素（旋转星星、移动小球、计数器）是否流畅</li>
        <li>点击"创建长任务 iframe"按钮，观察动画是否被阻塞</li>
        <li>点击"主线程长任务对比"按钮，对比主线程执行长任务的效果</li>
        <li>通过 FPS 计数器量化渲染性能</li>
        <li>打开控制台查看详细的执行日志</li>
      </ul>
    </div>

    <!-- 动态创建的 iframe 容器 -->
    <div id="iframe-container"></div>
  </div>
</template>

<script>
export default {
  name: "IframeTest",
  data() {
    return {
      // 动画相关
      rotation: 0,
      ballPosition: 0,
      counter: 0,
      ballDirection: 1,

      // FPS 计算
      fps: 0,
      frameCount: 0,
      lastTime: performance.now(),

      // 控制状态
      isRunningTask: false,
      taskDuration: 3000,
      status: "就绪",
      lastTaskTime: null,

      // 动画循环
      animationId: null,
      fpsInterval: null,
    };
  },

  mounted() {
    this.startAnimations();
    this.startFPSCounter();
  },

  beforeUnmount() {
    this.stopAnimations();
  },

  methods: {
    // 启动所有动画
    startAnimations() {
      const animate = () => {
        // 旋转动画
        this.rotation = (this.rotation + 2) % 360;

        // 小球移动动画
        this.ballPosition += this.ballDirection * 2;
        if (this.ballPosition >= 300 || this.ballPosition <= 0) {
          this.ballDirection *= -1;
        }

        // 计数器
        this.counter++;

        // FPS 计算
        this.frameCount++;

        this.animationId = requestAnimationFrame(animate);
      };

      animate();
    },

    // 停止动画
    stopAnimations() {
      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
      }
      if (this.fpsInterval) {
        clearInterval(this.fpsInterval);
      }
    },

    // FPS 计数器
    startFPSCounter() {
      this.fpsInterval = setInterval(() => {
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastTime;
        this.fps = Math.round((this.frameCount * 1000) / deltaTime);
        this.frameCount = 0;
        this.lastTime = currentTime;
      }, 1000);
    },

    // 创建长任务 iframe
    async createLongTaskIframe() {
      if (this.isRunningTask) return;

      this.isRunningTask = true;
      this.status = "创建 iframe 并执行长任务...";

      console.log(`开始创建 iframe 长任务，持续时间: ${this.taskDuration}ms`);

      const startTime = performance.now();

      // 创建 iframe
      const iframe = document.createElement("iframe");
      iframe.style.display = "none"; // 隐藏 iframe

      // 创建包含长任务的 HTML 内容
      const iframeContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Long Task iframe</title>
        </head>
        <body>
          <script>
            console.log('iframe 长任务开始执行...')
            const startTime = performance.now()
            const duration = ${this.taskDuration}

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
      `;

      iframe.srcdoc = iframeContent;
      // 监听来自 iframe 的消息
      const messageHandler = (event) => {
        if (event.data.type === "taskComplete") {
          const totalTime = performance.now() - startTime;
          this.lastTaskTime = Math.round(totalTime);
          this.status = `iframe 长任务完成，总耗时: ${this.lastTaskTime}ms`;

          console.log(`iframe 长任务完成，总耗时: ${totalTime}ms`);

          // 清理
          window.removeEventListener("message", messageHandler);
          document.getElementById("iframe-container").removeChild(iframe);

          this.isRunningTask = false;
        }
      };

      window.addEventListener("message", messageHandler);

      // 将 iframe 添加到页面
      document.getElementById("iframe-container").appendChild(iframe);
    },

    // 主线程长任务对比
    async runMainThreadTask() {
      if (this.isRunningTask) return;

      this.isRunningTask = true;
      this.status = "主线程执行长任务...";

      console.log(`开始主线程长任务，持续时间: ${this.taskDuration}ms`);

      const startTime = performance.now();

      // 使用 setTimeout 来避免完全阻塞 UI（但仍然会有明显影响）
      setTimeout(() => {
        const endTime = startTime + this.taskDuration;
        let result = 0;

        while (performance.now() < endTime) {
          // 执行一些计算密集型操作
          for (let i = 0; i < 100000; i++) {
            result += Math.sqrt(i) * Math.sin(i) * Math.cos(i);
          }
        }

        const actualDuration = performance.now() - startTime;
        this.lastTaskTime = Math.round(actualDuration);
        this.status = `主线程长任务完成，耗时: ${this.lastTaskTime}ms`;

        console.log(`主线程长任务完成，实际耗时: ${actualDuration}ms`);

        this.isRunningTask = false;
      }, 10);
    },
  },
};
</script>

<style scoped>
.iframe-test-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  font-family: "Arial", sans-serif;
}

h1 {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
}

h2 {
  color: #555;
  border-bottom: 2px solid #007bff;
  padding-bottom: 10px;
  margin-bottom: 20px;
}

h3 {
  color: #666;
  margin-bottom: 15px;
}

/* 主页面渲染区域样式 */
.render-area {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 15px;
  padding: 30px;
  margin-bottom: 30px;
  color: white;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.animation-container {
  display: flex;
  justify-content: space-around;
  align-items: center;
  min-height: 150px;
  position: relative;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 20px;
  backdrop-filter: blur(10px);
}

/* 旋转元素样式 */
.rotating-element {
  font-size: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  transition: none; /* 确保没有 CSS 过渡影响性能测试 */
}

/* 移动小球样式 */
.moving-ball {
  width: 30px;
  height: 30px;
  background: radial-gradient(circle at 30% 30%, #ffeb3b, #ff9800);
  border-radius: 50%;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  transition: none; /* 确保没有 CSS 过渡影响性能测试 */
}

/* 计数器和FPS样式 */
.counter,
.fps-counter {
  font-size: 24px;
  font-weight: bold;
  background: rgba(255, 255, 255, 0.2);
  padding: 15px 25px;
  border-radius: 25px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(5px);
}

.fps-counter {
  color: #4caf50;
}

/* 控制面板样式 */
.control-panel {
  background: #f8f9fa;
  border-radius: 15px;
  padding: 30px;
  margin-bottom: 30px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
}

.task-duration-selector {
  margin-bottom: 20px;
}

.task-duration-selector label {
  display: inline-block;
  margin-right: 10px;
  font-weight: bold;
  color: #555;
}

.task-duration-selector select {
  padding: 8px 15px;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
  background: white;
  cursor: pointer;
  transition: border-color 0.3s;
}

.task-duration-selector select:focus {
  outline: none;
  border-color: #007bff;
}

.button-group {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.test-button {
  padding: 12px 24px;
  font-size: 16px;
  font-weight: bold;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  min-width: 180px;
}

.test-button:not(.compare-button) {
  background: linear-gradient(135deg, #007bff, #0056b3);
  color: white;
}

.compare-button {
  background: linear-gradient(135deg, #28a745, #1e7e34);
  color: white;
}

.test-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.test-button:disabled {
  background: #6c757d;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.status-info {
  background: #e9ecef;
  padding: 15px;
  border-radius: 8px;
  border-left: 4px solid #007bff;
}

.status-info p {
  margin: 5px 0;
  color: #495057;
}

/* 测试说明样式 */
.instructions {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 20px;
}

.instructions ul {
  margin: 10px 0;
  padding-left: 20px;
}

.instructions li {
  margin: 8px 0;
  color: #856404;
  line-height: 1.5;
}

/* iframe 容器 */
#iframe-container {
  display: none; /* iframe 是隐藏的，仅用于测试 */
}

/* 响应式设计 */
@media (max-width: 768px) {
  .animation-container {
    flex-direction: column;
    gap: 20px;
    min-height: 200px;
  }

  .button-group {
    flex-direction: column;
  }

  .test-button {
    min-width: auto;
    width: 100%;
  }

  .moving-ball {
    position: relative;
    top: auto;
    transform: none;
  }
}
</style>
