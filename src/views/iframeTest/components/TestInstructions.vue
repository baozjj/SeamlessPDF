<template>
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
</template>

<script>
export default {
  name: 'TestInstructions'
}
</script>

<style scoped>
/* 测试说明样式 */
.instructions {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 20px;
}

.instructions h3 {
  color: #666;
  margin-bottom: 15px;
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
</style>
