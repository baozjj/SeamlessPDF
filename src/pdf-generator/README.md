# PDF生成器

## 特性

- 🎯 **智能分页**：自动检测最佳分页点，避免在文本或表格中间分页
- 🚀 **高性能渲染**：使用iframe隔离渲染，支持并行处理
- 📐 **精确布局**：像素级精度的页面布局计算
- 🔧 **模块化设计**：清晰的代码结构，易于维护和扩展

## 架构设计

### 目录结构

```
src/pdf-generator/
├── types/                    # 类型定义
│   ├── pdf-generation.types.ts
│   ├── page-layout.types.ts
│   ├── rendering.types.ts
│   └── index.ts
├── constants/               # 常量定义
│   └── index.ts
├── core/                   # 核心业务逻辑
│   ├── pdf-generator.ts    # 主控制器
│   ├── page-processor.ts   # 页面处理器
│   └── index.ts
├── layout/                 # 页面布局计算
│   ├── layout-calculator.ts
│   ├── page-break-analyzer.ts
│   └── index.ts
├── rendering/              # 渲染引擎
│   ├── canvas-renderer.ts
│   ├── footer-renderer.ts
│   ├── page-renderer.ts
│   └── index.ts
├── utils/                  # 工具函数
│   ├── canvas-utils.ts
│   ├── color-analyzer.ts
│   ├── table-detector.ts
│   └── index.ts
├── serialization/          # 序列化模块
│   ├── element-serializer.ts
│   ├── style-extractor.ts
│   └── index.ts
├── iframe/                 # iframe渲染
│   ├── iframe-renderer.ts
│   └── index.ts
└── index.ts               # 主入口文件
```

### 模块职责

- **types**: 统一的类型定义，提供完整的TypeScript支持
- **constants**: 全局常量定义，避免魔法数字
- **core**: 核心业务逻辑，包含PDF生成的主流程控制
- **layout**: 页面布局计算，包含智能分页算法
- **rendering**: 渲染引擎，负责Canvas和页面渲染
- **utils**: 通用工具函数，按功能分类组织
- **serialization**: 元素序列化和样式提取
- **iframe**: iframe隔离渲染功能

## 使用方法

### 基本用法

```typescript
import {
  generateIntelligentPdf,
  type PdfGenerationOptions,
} from "./src/pdf-generator";

const options: PdfGenerationOptions = {
  headerElement: document.getElementById("header")!,
  contentElement: document.getElementById("content")!,
  footerElement: document.getElementById("footer")!,
  onFooterUpdate: (currentPage, totalPages) => {
    // 更新页脚内容
    const footerText = document.querySelector(".page-number");
    if (footerText) {
      footerText.textContent = `第 ${currentPage} 页，共 ${totalPages} 页`;
    }
  },
};

// 生成PDF
const pdf = await generateIntelligentPdf(options);

// 下载PDF
pdf.save("document.pdf");
```

## API参考

### 主要函数

#### `generateIntelligentPdf(options: PdfGenerationOptions): Promise<jsPDF>`

生成智能分页的PDF文档。

**参数：**

- `options.headerElement`: 页眉HTML元素
- `options.contentElement`: 内容HTML元素
- `options.footerElement`: 页脚HTML元素
- `options.onFooterUpdate`: 页脚更新回调函数

**返回：** Promise<jsPDF> - 生成的PDF文档实例

### 类型定义

```typescript
interface PdfGenerationOptions {
  headerElement: HTMLElement;
  contentElement: HTMLElement;
  footerElement: HTMLElement;
  onFooterUpdate: (
    currentPage: number,
    totalPages: number
  ) => Promise<void> | void;
}

interface PageBreakCoordinate {
  startY: number;
  endY: number;
  isTableBorderBreak: boolean;
}

interface PageLayoutMetrics {
  headerHeight: number;
  footerHeight: number;
  contentRegionHeight: number;
  contentScaleFactor: number;
  contentPageHeightInPixels: number;
}
```
