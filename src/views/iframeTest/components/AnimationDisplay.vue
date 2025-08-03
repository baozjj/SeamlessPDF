<template>
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
</template>

<script>
import { useAnimation } from '../composables/useAnimation.js'

export default {
  name: 'AnimationDisplay',
  setup() {
    const { rotation, ballPosition, counter, fps } = useAnimation()

    return {
      rotation,
      ballPosition,
      counter,
      fps
    }
  }
}
</script>

<style scoped>
/* 主页面渲染区域样式 */
.render-area {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 15px;
  padding: 30px;
  margin-bottom: 30px;
  color: white;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.render-area h2 {
  color: white;
  border-bottom: 2px solid rgba(255, 255, 255, 0.3);
  padding-bottom: 10px;
  margin-bottom: 20px;
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

/* 响应式设计 */
@media (max-width: 768px) {
  .animation-container {
    flex-direction: column;
    gap: 20px;
    min-height: 200px;
  }

  .moving-ball {
    position: relative;
    top: auto;
    transform: none;
  }
}
</style>
