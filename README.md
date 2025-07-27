# SeamlessPDF ✨

**高性能前端PDF导出解决方案 - 告别主线程阻塞，实现像素完美的PDF文档**

SeamlessPDF 是一个专门解决传统 html2canvas + jsPDF 方案性能瓶颈的前端PDF导出库。通过创新的iframe隔离渲染架构和智能分页算法，实现了主线程非阻塞的高性能PDF导出。

## 🚀 核心特性

### 性能优化

- **🔥 主线程非阻塞**：iframe隔离渲染，避免html2canvas阻塞UI
- **⚡ 异步并行处理**：多元素并行渲染，显著提升导出速度

### 智能分页

- **🧠 像素级分析**：基于Canvas像素分析的智能分页算法
- **📋 表格完整性**：精确识别表格边框，确保表格不被分割
- **🎯 最优分页点**：自动寻找段落间空白和表格边框作为分页点

---

## 😫 传统方案的痛点

传统的 `html2canvas` + `jsPDF` 方案存在以下问题：

### 性能问题

- **主线程阻塞**：html2canvas在主线程执行，导致页面卡顿
- **同步执行**：无法异步处理，用户体验差

### 分页问题

- **粗暴分页**：在固定高度处强行切割内容
- **内容断裂**：文字、图片、表格被从中间分割
- **专业性差**：影响文档的可读性和专业形象

## 💡 SeamlessPDF的解决方案

### 1. iframe隔离渲染架构

```
主线程 ──┐
         ├─ 用户交互保持响应
         └─ 通过postMessage与iframe通信

iframe ───┐
          ├─ html2canvas渲染执行
          ├─ 避免阻塞主线程
          └─ 支持并行处理多个元素
```

### 2. 渲染后分析策略

不再在渲染前修改DOM结构，而是：

1. **完整渲染**：将HTML内容渲染成完整的Canvas
2. **像素分析**：通过像素级分析寻找最佳分页点
3. **智能分割**：在自然位置（空白行、表格边框）进行分页

### 3. 四阶段优化流程

1. **Canvas渲染阶段**：并行渲染页眉、内容、页脚
2. **布局计算阶段**：计算页面尺寸和缩放参数
3. **智能分页阶段**：分析最优分页点
4. **PDF生成阶段**：并行预渲染页脚，生成最终PDF

---

## 📦 安装

```bash
# 使用 pnpm（推荐）
pnpm install

# 或使用 npm
npm install

# 或使用 yarn
yarn install
```

## 🛠️ 开发

```bash
# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 预览构建结果
pnpm preview

# 代码检查
pnpm lint

# 代码格式化
pnpm format
```

## 🎯 快速开始

### 基础用法

```typescript
import { generateIntelligentPdf } from "@/pdf-generator/generateQuotePDF";

// 准备页面元素
const headerElement = document.getElementById("header") as HTMLElement;
const contentElement = document.getElementById("content") as HTMLElement;
const footerElement = document.getElementById("footer") as HTMLElement;

// 生成PDF
const pdf = await generateIntelligentPdf({
  headerElement,
  contentElement,
  footerElement,
  onFooterUpdate: (currentPage: number, totalPages: number) => {
    footerState.currentPage = currentPage;
    footerState.totalPages = totalPages;
  },
});

// 下载PDF
pdf.save("report.pdf");
```

### Vue组件集成

```vue
<template>
  <div>
    <button @click="exportPDF" :disabled="isExporting">
      {{ isExporting ? "导出中..." : "导出PDF" }}
    </button>

    <div ref="headerRef"><!-- 页眉内容 --></div>
    <div ref="contentRef"><!-- 主要内容 --></div>
    <div ref="footerRef"><!-- 页脚内容 --></div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { generateIntelligentPdf } from "@/pdf-generator/generateQuotePDF";

const isExporting = ref(false);
const headerRef = ref<HTMLElement>();
const contentRef = ref<HTMLElement>();
const footerRef = ref<HTMLElement>();

const exportPDF = async () => {
  isExporting.value = true;

  try {
    const pdf = await generateIntelligentPdf({
      headerElement: headerRef.value!,
      contentElement: contentRef.value!,
      footerElement: footerRef.value!,
      onFooterUpdate: (currentPage, totalPages) => {
        // 更新页脚逻辑
      },
    });

    pdf.save("document.pdf");
  } finally {
    isExporting.value = false;
  }
};
</script>
```

## 🏗️ 技术架构

```
┌─────────────────────────────────────────────────────────────┐
│                        主线程                                │
├─────────────────────────────────────────────────────────────┤
│  用户交互 │ Vue组件 │ PDF导出控制 │ 性能监控 │ 文件下载      │
└─────────────────────────────────────────────────────────────┘
                              │
                    postMessage 通信
                              │
┌─────────────────────────────────────────────────────────────┐
│                      iframe 渲染进程                         │
├─────────────────────────────────────────────────────────────┤
│  html2canvas │ 样式注入 │ 元素重建 │ Canvas生成 │ 数据返回    │
└─────────────────────────────────────────────────────────────┘
                              │
                         Canvas数据
                              │
┌─────────────────────────────────────────────────────────────┐
│                      智能分页引擎                            │
├─────────────────────────────────────────────────────────────┤
│  像素分析 │ 表格检测 │ 空白识别 │ 分页计算 │ 优化调整       │
└─────────────────────────────────────────────────────────────┘
                              │
                         分页数据
                              │
┌─────────────────────────────────────────────────────────────┐
│                      PDF生成引擎                             │
├─────────────────────────────────────────────────────────────┤
│  jsPDF集成 │ 页面组装 │ 图像处理 │ 文档输出 │ 质量优化       │
└─────────────────────────────────────────────────────────────┘
```
