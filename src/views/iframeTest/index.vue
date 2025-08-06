<template>
  <div class="iframe-test-container">
    <h1>iframe Canvas生成测试页面</h1>

    <!-- 动画显示区域 -->
    <AnimationDisplay />

    <!-- 控制面板 -->
    <ControlPanel />

    <!-- 测试说明 -->
    <TestInstructions />

    <!-- 动态创建的 iframe 容器 -->
    <div id="iframe-container"></div>
  </div>
</template>

<script>
import AnimationDisplay from "./components/AnimationDisplay.vue";
import ControlPanel from "./components/ControlPanel.vue";
import TestInstructions from "./components/TestInstructions.vue";

export default {
  name: "IframeTest",
  components: {
    AnimationDisplay,
    ControlPanel,
    TestInstructions,
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

/* iframe 容器 */
#iframe-container {
  display: none; /* iframe 是隐藏的，仅用于测试 */
}
</style>
