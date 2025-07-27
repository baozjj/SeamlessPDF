# PDF 生成系统文档

## 📋 系统概述

这是一个高性能、非阻塞的 PDF 生成系统，专门用于将网页内容转换为分页的 PDF 文档。系统采用模块化设计，支持智能分页、样式保持和多进程渲染。

## 🏗️ 系统架构

### 核心模块

```
src/pdf-generator/
├── generateQuotePDF.ts      # 主入口文件，PDF 生成流程控制
├── iframe-renderer.ts       # iframe 隔离渲染模块
├── element-serializer.ts    # 元素序列化模块
├── non-blocking-renderer.ts # 非阻塞渲染工具
└── pdfUtils.ts             # PDF 工具函数（分页算法等）
```

### 模块职责

| 模块                         | 职责       | 主要功能                |
| ---------------------------- | ---------- | ----------------------- |
| **generateQuotePDF.ts**      | 流程控制   | 四阶段 PDF 生成流程管理 |
| **iframe-renderer.ts**       | 多进程渲染 | 跨域 iframe 隔离渲染    |
| **element-serializer.ts**    | 数据序列化 | DOM 元素和样式序列化    |
| **non-blocking-renderer.ts** | 非阻塞渲染 | 时间切片渲染工具        |
| **pdfUtils.ts**              | 算法工具   | 智能分页和图像处理      |

## 🚀 核心特性

### 1. 四阶段生成流程

```typescript
// 第一阶段：元素渲染（iframe 多进程）
const canvasElements = await renderElementsToCanvas({
  headerElement,
  contentElement,
  footerElement,
});

// 第二阶段：布局计算
const layoutMetrics = calculatePageLayoutMetrics(canvasElements);

// 第三阶段：智能分页
const pageBreakCoordinates = calculatePageBreaks(
  canvasElements.content,
  layoutMetrics
);

// 第四阶段：PDF 文档生成（非阻塞页脚渲染）
const pdf = await generatePdfDocument({
  canvasElements,
  layoutMetrics,
  pageBreakCoordinates,
  footerElement,
  onFooterUpdate,
});
```

### 2. 非阻塞渲染系统

#### iframe 多进程渲染

- **适用场景**：复杂页面元素（页眉、内容）
- **优势**：完全隔离，零阻塞主线程
- **实现**：跨域 iframe + postMessage 通信

#### 时间切片渲染

- **适用场景**：简单元素（页脚）
- **优势**：轻量级，减少阻塞时间
- **实现**：setTimeout(0) + 优化配置

### 3. 智能分页算法

```typescript
// 自动检测最佳分页点
const breakPoint = findOptimalPageBreak(targetY, contentCanvas);

// 避免在以下位置分页：
// - 文本行中间
// - 表格内部
// - 图片中间
// - 重要内容区域
```

### 4. 样式完整保持

```typescript
// 序列化所有样式信息
const serializedElement = {
  tagName: element.tagName,
  innerHTML: element.innerHTML,
  outerHTML: element.outerHTML,
  styles: getComputedStylesObject(element),
  attributes: getElementAttributes(element),
  childrenStyles: serializeChildrenStyles(element), // 子元素样式
};
```

## 📖 使用指南

### 基本用法

```typescript
import { generateIntelligentPdf } from "./pdf-generator/generateQuotePDF";

const pdf = await generateIntelligentPdf({
  headerElement: document.getElementById("header"),
  contentElement: document.getElementById("content"),
  footerElement: document.getElementById("footer"),
  onFooterUpdate: (currentPage, totalPages) => {
    // 更新页脚页码
    const pageInfo = document.querySelector(".page-info");
    pageInfo.textContent = `第 ${currentPage} 页，共 ${totalPages} 页`;
  },
});

// 下载 PDF
pdf.save("document.pdf");
```

### 高级配置

```typescript
// 自定义渲染选项
const customRenderer = await renderElementNonBlocking(element, {
  useIframe: true, // 使用 iframe 多进程渲染
  scale: 3, // 高清渲染
});

// 自定义分页检测
const pageBreaks = calculatePageBreaks(contentCanvas, layoutMetrics, {
  minPageHeight: 200, // 最小页面高度
  avoidBreakInTables: true, // 避免表格内分页
});
```
