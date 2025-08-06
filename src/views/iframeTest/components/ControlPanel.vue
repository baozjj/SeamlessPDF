<template>
  <div class="control-panel">
    <h2>控制面板</h2>

    <div class="element-count-selector">
      <label>DOM元素数量:</label>
      <select v-model="elementCount">
        <option value="100">100个元素 (快速测试)</option>
        <option value="500">500个元素 (轻度负载)</option>
        <option value="1000">1000个元素 (中度负载)</option>
        <option value="2000">2000个元素 (重度负载)</option>
        <option value="3000">3000个元素 (高负载)</option>
        <option value="5000">5000个元素 (极高负载)</option>
      </select>
      <span class="element-info">预计处理时间: {{ getEstimatedTime() }}</span>
    </div>

    <div class="button-group">
      <button
        @click="handleCanvasGeneration"
        :disabled="isRunningTask"
        class="test-button"
      >
        {{ isRunningTask ? "生成中..." : "生成Canvas图像" }}
      </button>
    </div>

    <div class="status-info">
      <p>状态: {{ status }}</p>
      <p v-if="lastTaskTime">上次任务执行时间: {{ lastTaskTime }}ms</p>
      <p v-if="lastCanvasInfo">Canvas信息: {{ lastCanvasInfo }}</p>
    </div>

    <!-- Canvas显示区域 -->
    <div v-if="canvasDataURL" class="canvas-display">
      <h3>生成的Canvas图像</h3>
      <div class="canvas-container">
        <img :src="canvasDataURL" alt="Generated Canvas" class="canvas-image" />
        <div class="canvas-info">
          <p>尺寸: {{ canvasWidth }} x {{ canvasHeight }}</p>
          <p>数据大小: {{ Math.round(canvasDataURL.length / 1024) }}KB</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from "vue";
import { TaskExecutor } from "../services/taskExecutor.js";

export default {
  name: "ControlPanel",
  setup() {
    // 响应式数据
    const isRunningTask = ref(false);
    const status = ref("就绪");
    const lastTaskTime = ref(null);
    const lastCanvasInfo = ref(null);
    const elementCount = ref(1000); // 默认1000个元素

    // Canvas相关数据
    const canvasDataURL = ref(null);
    const canvasWidth = ref(0);
    const canvasHeight = ref(0);

    // 任务执行器实例
    const taskExecutor = new TaskExecutor();

    /**
     * 状态更新回调
     */
    const updateStatus = (newStatus) => {
      status.value = newStatus;
    };

    /**
     * 获取预估处理时间
     */
    const getEstimatedTime = () => {
      const count = parseInt(elementCount.value);
      if (count <= 100) return "< 1秒";
      if (count <= 500) return "1-2秒";
      if (count <= 1000) return "2-3秒";
      if (count <= 2000) return "3-5秒";
      if (count <= 3000) return "5-8秒";
      return "8-15秒";
    };

    /**
     * 处理Canvas生成任务
     */
    const handleCanvasGeneration = async () => {
      if (isRunningTask.value) return;

      isRunningTask.value = true;

      try {
        const result = await taskExecutor.executeCanvasTask(
          elementCount.value,
          updateStatus
        );

        lastTaskTime.value = result.executionTime;

        // 处理canvas数据
        if (result.canvasData) {
          canvasDataURL.value = result.canvasData.dataURL;
          canvasWidth.value = result.canvasData.width;
          canvasHeight.value = result.canvasData.height;
          lastCanvasInfo.value = `${result.canvasData.width}x${result.canvasData.height}, ${Math.round(result.canvasData.dataURL.length / 1024)}KB`;

          console.log("Canvas数据已更新到UI");
        } else {
          // 清空之前的canvas数据
          canvasDataURL.value = null;
          canvasWidth.value = 0;
          canvasHeight.value = 0;
          lastCanvasInfo.value = null;
        }
      } catch (error) {
        console.error("Canvas生成失败:", error);
        status.value = `Canvas生成失败: ${error.message}`;
      } finally {
        isRunningTask.value = false;
      }
    };

    return {
      isRunningTask,
      status,
      lastTaskTime,
      lastCanvasInfo,
      canvasDataURL,
      canvasWidth,
      canvasHeight,
      elementCount,
      getEstimatedTime,
      handleCanvasGeneration,
    };
  },
};
</script>

<style scoped>
/* 控制面板样式 */
.control-panel {
  background: #f8f9fa;
  border-radius: 15px;
  padding: 30px;
  margin-bottom: 30px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
}

.control-panel h2 {
  color: #555;
  border-bottom: 2px solid #007bff;
  padding-bottom: 10px;
  margin-bottom: 20px;
}

.element-count-selector {
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.element-count-selector label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: #555;
}

.element-count-selector select {
  width: 100%;
  padding: 8px 12px;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  cursor: pointer;
  transition: border-color 0.3s;
  margin-bottom: 8px;
}

.element-count-selector select:focus {
  outline: none;
  border-color: #007bff;
}

.element-info {
  display: block;
  font-size: 12px;
  color: #6c757d;
  font-style: italic;
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

.test-button {
  background: linear-gradient(135deg, #007bff, #0056b3);
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

/* Canvas显示区域样式 */
.canvas-display {
  margin-top: 20px;
  background: #ffffff;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  border: 1px solid #e0e0e0;
}

.canvas-display h3 {
  color: #333;
  margin-bottom: 15px;
  font-size: 18px;
}

.canvas-container {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.canvas-image {
  max-width: 400px;
  max-height: 300px;
  border: 2px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  object-fit: contain;
}

.canvas-info {
  flex: 1;
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  border-left: 4px solid #28a745;
}

.canvas-info p {
  margin: 8px 0;
  color: #495057;
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .button-group {
    flex-direction: column;
  }

  .test-button {
    min-width: auto;
    width: 100%;
  }

  .canvas-container {
    flex-direction: column;
  }

  .canvas-image {
    max-width: 100%;
    align-self: center;
  }
}
</style>
