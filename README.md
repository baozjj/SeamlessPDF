# SeamlessPDF ✨

**告别内容断裂，生成像素完美的PDF文档。**

SeamlessPDF 旨在解决前端开发中最棘手的问题之一：将复杂的 HTML 内容导出为高质量、无缝的多页 PDF。它能智能地识别并避免在文本、图片或表格中间进行分页，确保最终文档的专业性与可读性。

---

## 😫 痛点：问题所在

传统的 `html2canvas` + `jsPDF` 方案非常强大，但它们在处理长内容时有一个致命缺陷——**粗暴分页**。它们会像一把无情的剪刀，在固定的页面高度处强行切割内容，导致：

- 一行文字被从中间“腰斩”。
- 一个表格行被无情地拆分。

这种糟糕的体验会严重拉低您产品的专业形象。

## 💡 方案：我们的解决之道

SeamlessPDF 采用了完全不同的、更智能的策略——**渲染后分析**。

它不再尝试在渲染前修改脆弱的 DOM 结构，而是将整个 HTML 内容先渲染成一张超长的 Canvas 画布。然后，它像一位经验丰富的排版师一样，通过**像素级分析**这张画布，寻找最完美的“切割线”。

这些“切割线”通常是：

1.  段落之间的**纯白空间**。
2.  表格的**边框线**。

通过在这些“自然”的位置进行分页，SeamlessPDF 保证了内容的完整性和阅读的流畅性，实现了真正的“无缝”导出。

## 基础使用

```javascript
import { generateIntelligentPdf } from "./pdf-generator/generateQuotePDF";

// 获取页面元素
const headerElement = document.getElementById("header");
const contentElement = document.getElementById("content");
const footerElement = document.getElementById("footer");

// 生成PDF
const pdf = await generateIntelligentPdf({
  headerElement,
  contentElement,
  footerElement,
  onFooterUpdate: (currentPage, totalPages) => {
    console.log(`正在生成第 ${currentPage}/${totalPages} 页`);
  },
});

// 保存PDF
await pdf.save("intelligent-report.pdf", {
  returnPromise: true,
});
```
