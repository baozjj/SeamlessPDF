# SeamlessPDF ✨

**告别内容断裂，智能生成像素完美的PDF文档。**

SeamlessPDF 是一个智能的 JavaScript 库，旨在解决前端开发中最棘手的问题之一：将复杂的 HTML 内容导出为高质量、无缝的多页 PDF。它能智能地识别并避免在文本、图片或表格中间进行分页，确保最终文档的专业性与可读性。


---

## 😫 痛点：问题所在

传统的 `html2canvas` + `jsPDF` 方案非常强大，但它们在处理长内容时有一个致命缺陷——**粗暴分页**。它们会像一把无情的剪刀，在固定的页面高度处强行切割内容，导致：

*   一行文字被从中间“腰斩”。
*   一个表格行被无情地拆分。

这种糟糕的体验会严重拉低您产品的专业形象。

## 💡 方案：我们的解决之道

SeamlessPDF 采用了完全不同的、更智能的策略——**渲染后分析**。

它不再尝试在渲染前修改脆弱的 DOM 结构，而是将整个 HTML 内容先渲染成一张超长的 Canvas 画布。然后，它像一位经验丰富的排版师一样，通过**像素级分析**这张画布，寻找最完美的“切割线”。

这些“切割线”通常是：
1.  段落之间的**纯白空间**。
2.  表格的**边框线**。

通过在这些“自然”的位置进行分页，SeamlessPDF 保证了内容的完整性和阅读的流畅性，实现了真正的“无缝”导出。

## 🎨 核心特性

*   **分页**: 核心算法自动寻找最佳分页点，告别内容断裂。
*   **非侵入式**: 无需修改您现有的 DOM 结构或 CSS，对 Flexbox、Grid 等现代布局完全友好。
*   **高保真度**: 基于 `html2canvas`，最大限度地还原 HTML 的视觉效果。
*   **动态页眉页脚**: 支持在每一页动态生成包含当前页码和总页数的页眉与页脚。
*   **高度可配置**: 从页面尺寸、边距到分页算法的敏感度，一切尽在掌握。


## 📚 快速上手

在 Vue 3 项目中使用 SeamlessPDF 非常简单。

**1. 准备您的 Vue 组件**

确保您的页眉、内容和页脚组件都通过 `ref` 暴露了其根元素。

```vue
<!-- YourReport.vue -->
<template>
  <div>
    <ReportHeader ref="reportHeader" />
    <ReportContent ref="reportContent" />
    <ReportFooter ref="reportFooter" :current-page="footerState.current" :total-pages="footerState.total" />
    
    <button @click="exportPDF">导出PDF</button>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { PdfBuilder } from 'seamlesspdf';
import ReportHeader from './components/ReportHeader.vue';
import ReportContent from './components/ReportContent.vue';
import ReportFooter from './components/ReportFooter.vue';

const reportHeader = ref();
const reportContent = ref();
const reportFooter = ref();

const footerState = reactive({ current: 1, total: 1 });
const isExporting = ref(false);

const exportPDF = async () => {
  if (isExporting.value) return;

  const headerEl = reportHeader.value?.$el;
  const contentEl = reportContent.value?.$el;
  const footerEl = reportFooter.value?.$el;

  if (!headerEl || !contentEl || !footerEl) {
    console.error("报告组件尚未完全加载。");
    return;
  }

  isExporting.value = true;

  try {
    const builder = new PdfBuilder({ filename: '我的专业报告.pdf' });

    await builder
      .setElements({ header: headerEl, content: contentEl, footer: footerEl })
      .onUpdateFooter((currentPage, totalPages) => {
        // 在渲染每一页页脚前触发
        footerState.current = currentPage;
        footerState.total = totalPages;
      })
      .build();

  } catch (error) {
    console.error("PDF 生成失败:", error);
  } finally {
    isExporting.value = false;
    // 恢复页脚状态
    footerState.current = 1;
    footerState.total = 1;
  }
};
</script>
```

### 主要配置 (`PdfBuilderConfig`)

| 属性 | 类型 | 默认值 | 描述 |
| :--- | :--- | :--- | :--- |
| `page` | `PageDimensions` | A4 尺寸 | PDF 页面尺寸，单位为 pt。 |
| `margins` | `{ top, ... }` | `40` (各方向) | PDF 页面边距，单位为 pt。 |
| `imageType` | `'image/jpeg' \| 'image/png'` | `'image/jpeg'` | 生成PDF时使用的图片格式。 |
| `imageQuality`| `number` | `1.0` | 图片质量 (0-1)，仅对 `jpeg` 有效。 |
| `filename` | `string` | `'document.pdf'` | 下载的PDF文件名。 |
| `html2canvas`| `object` | `{ scale: ... }` | 传递给 `html2canvas` 的原生配置。 |
| `cutFinder` | `CutFinderConfig` | (见下文) | 分页算法的核心配置。 |

### 分页算法配置 (`cutFinder`)

| 属性 | 类型 | 默认值 | 描述 |
| :--- | :--- | :--- | :--- |
| `lineColor` | `string` | `'229,229,229'` | 视作可切割边框线的 RGB 颜色字符串。 |
| `lineColorRatio`| `number` | `0.8` | `lineColor` 需达到的像素占比 (0-1)。 |
| `searchUpwardsRange`| `number` | `100` | 向上搜索“干净”切割线的最大像素范围。 |
| `borderBreakerOffset`| `number` | `2` | 防止切割到表格边框的微小垂直偏移量。 |

## 🔬 工作原理

SeamlessPDF 的智能分页过程分为四个核心步骤：

1.  **捕获长 Canvas**: 将目标内容区域完整地渲染成一张超长的 Canvas 图片。
2.  **计算分页坐标**: 根据页面尺寸和边距，计算出每一页在理论上应该在长 Canvas 的哪个 Y 坐标范围。
3.  **智能寻找切割点**: 这是最关键的一步。从理论的切割点开始，向上（在 `searchUpwardsRange` 范围内）逐行分析像素，寻找纯白行或符合 `lineColor` 定义的表格边框行作为最终的、完美的切割点。
4.  **裁剪与组装**: 根据计算出的所有完美切割点，将长 Canvas 精确地裁剪成多个页面大小的切片，并逐一添加到 PDF 文档中，最后与页眉页脚组合成最终文件。
