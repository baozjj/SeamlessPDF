<template>
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
        @click="handleIframeTask"
        :disabled="isRunningTask"
        class="test-button"
      >
        {{ isRunningTask ? "执行中..." : "创建长任务 iframe" }}
      </button>

      <button
        @click="handleMainThreadTask"
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
</template>

<script>
import { ref } from 'vue'
import { TaskExecutor } from '../services/taskExecutor.js'

export default {
  name: 'ControlPanel',
  setup() {
    // 响应式数据
    const taskDuration = ref(3000)
    const isRunningTask = ref(false)
    const status = ref('就绪')
    const lastTaskTime = ref(null)

    // 任务执行器实例
    const taskExecutor = new TaskExecutor()

    /**
     * 状态更新回调
     */
    const updateStatus = (newStatus) => {
      status.value = newStatus
    }

    /**
     * 处理iframe任务
     */
    const handleIframeTask = async () => {
      if (isRunningTask.value) return

      isRunningTask.value = true
      
      try {
        const executionTime = await taskExecutor.executeTask(
          'iframe',
          taskDuration.value,
          updateStatus
        )
        lastTaskTime.value = executionTime
      } catch (error) {
        console.error('iframe任务执行失败:', error)
        status.value = `任务执行失败: ${error.message}`
      } finally {
        isRunningTask.value = false
      }
    }

    /**
     * 处理主线程任务
     */
    const handleMainThreadTask = async () => {
      if (isRunningTask.value) return

      isRunningTask.value = true
      
      try {
        const executionTime = await taskExecutor.executeTask(
          'mainThread',
          taskDuration.value,
          updateStatus
        )
        lastTaskTime.value = executionTime
      } catch (error) {
        console.error('主线程任务执行失败:', error)
        status.value = `任务执行失败: ${error.message}`
      } finally {
        isRunningTask.value = false
      }
    }

    return {
      taskDuration,
      isRunningTask,
      status,
      lastTaskTime,
      handleIframeTask,
      handleMainThreadTask
    }
  }
}
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

/* 响应式设计 */
@media (max-width: 768px) {
  .button-group {
    flex-direction: column;
  }

  .test-button {
    min-width: auto;
    width: 100%;
  }
}
</style>
