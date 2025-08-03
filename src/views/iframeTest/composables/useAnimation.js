import { ref, onMounted, onUnmounted } from 'vue'

/**
 * 动画相关的组合式函数
 * 管理旋转动画、移动小球、计数器和FPS计算
 */
export function useAnimation() {
  // 动画状态
  const rotation = ref(0)
  const ballPosition = ref(0)
  const counter = ref(0)
  const ballDirection = ref(1)

  // FPS 计算相关
  const fps = ref(0)
  const frameCount = ref(0)
  const lastTime = ref(performance.now())

  // 动画控制
  let animationId = null
  let fpsInterval = null

  /**
   * 启动所有动画
   */
  const startAnimations = () => {
    const animate = () => {
      // 旋转动画
      rotation.value = (rotation.value + 2) % 360

      // 小球移动动画
      ballPosition.value += ballDirection.value * 2
      if (ballPosition.value >= 300 || ballPosition.value <= 0) {
        ballDirection.value *= -1
      }

      // 计数器
      counter.value++

      // FPS 计算
      frameCount.value++

      animationId = requestAnimationFrame(animate)
    }

    animate()
  }

  /**
   * 停止所有动画
   */
  const stopAnimations = () => {
    if (animationId) {
      cancelAnimationFrame(animationId)
      animationId = null
    }
    if (fpsInterval) {
      clearInterval(fpsInterval)
      fpsInterval = null
    }
  }

  /**
   * 启动FPS计数器
   */
  const startFPSCounter = () => {
    fpsInterval = setInterval(() => {
      const currentTime = performance.now()
      const deltaTime = currentTime - lastTime.value
      fps.value = Math.round((frameCount.value * 1000) / deltaTime)
      frameCount.value = 0
      lastTime.value = currentTime
    }, 1000)
  }

  /**
   * 重置动画状态
   */
  const resetAnimation = () => {
    rotation.value = 0
    ballPosition.value = 0
    counter.value = 0
    ballDirection.value = 1
    fps.value = 0
    frameCount.value = 0
    lastTime.value = performance.now()
  }

  // 生命周期管理
  onMounted(() => {
    startAnimations()
    startFPSCounter()
  })

  onUnmounted(() => {
    stopAnimations()
  })

  return {
    // 状态
    rotation,
    ballPosition,
    counter,
    fps,
    
    // 方法
    startAnimations,
    stopAnimations,
    startFPSCounter,
    resetAnimation
  }
}
