# SeamlessPDF

一个基于 Vue 3 的前端 PDF 生成工具，支持内容感知分页和内容完整性保护。

## 项目背景

传统的前端 PDF 生成方案（html2canvas + jsPDF）存在以下问题：

1. **内容断裂**：分页时会在文字段落中间或表格单元格中间截断内容，导致阅读体验差
2. **页面阻塞**：渲染过程会阻塞主线程，导致页面卡顿或无响应
3. **导出耗时长**：每次导出都需要重新渲染和计算，用户需要等待较长时间
4. **无法预生成**：不支持在后台提前生成 PDF，只能在用户点击导出时才开始处理

这些问题在处理长文档或复杂表格时尤为明显，影响用户体验。

## 技术方案

本项目采用"渲染后分析"策略，通过以下技术方案解决传统方案的问题：

### 内容感知分页

- 先将整个内容渲染为 Canvas
- 通过像素级分析识别文本段落和表格边界
- 在内容块之间寻找最佳分页点，避免在段落或表格中间断开
- 确保每页内容的完整性和可读性

### 基于 iframe 的并行渲染

这是本项目的核心技术优势，通过以下机制实现高性能、非阻塞的渲染：

**多进程并行处理**

- 为页眉、内容、页脚分别创建独立的沙盒 iframe
- 利用浏览器的站点隔离机制，每个 iframe 运行在独立的渲染进程中

**进程隔离与通信**

- 通过 `postMessage` API 在主页面和 iframe 之间传递序列化的 DOM 数据
- 每个 iframe 独立加载 snapDOM 库并执行 HTML 到 Canvas 的转换
- 渲染完成后将 Canvas 数据（base64）传回主页面

**非阻塞主线程**

- 所有重量级的 DOM 渲染操作都在 iframe 的独立进程中执行
- 主页面线程不会被渲染任务阻塞，保持界面响应性
- 用户可以在 PDF 生成过程中继续操作页面

### PDF 预生成机制

- 页面加载完成后在后台自动生成 PDF
- 将生成的 PDF 对象缓存在内存中
- 用户点击导出时直接下载已生成的 PDF，实现接近 0 秒的导出体验
- 适用于内容固定或变化不频繁的场景

### 其他性能优化

- 页脚批量预渲染，所有页码的页脚并行生成
- 样式预提取，避免在每个 iframe 中重复提取页面样式
- DOM 序列化，只传输必要的元素数据和计算样式到 iframe
- 分页计算结果缓存，避免重复计算

## 功能

- 将网页内容导出为 PDF 文档
- 内容感知分页算法，避免在文本段落或表格中间断开
- 支持页眉、页脚和动态页码
- 预生成机制，提升导出响应速度
- 支持图片渲染（包括 base64 和外部链接）

## 安装

```bash
# 克隆项目
git clone <repository-url>
cd SeamlessPDF

# 安装依赖（使用 pnpm）
pnpm install
```

## 使用

### 开发模式

```bash
pnpm dev
```

访问 `http://localhost:5173` 查看应用。

### 构建生产版本

```bash
pnpm build
```

构建产物将输出到 `dist` 目录。

### 预览生产构建

```bash
pnpm preview
```

### 其他命令

```bash
# 类型检查
pnpm type-check

# 代码检查和修复
pnpm lint

# 代码格式化
pnpm format
```

## 核心模块

### PDF 生成器 (`src/pdf-generator`)

PDF 生成的核心逻辑，包含以下模块：

- **core**: PDF 生成主流程控制
- **layout**: 页面布局计算和内容感知分页
- **rendering**: Canvas 渲染和页面渲染
- **utils**: 工具函数（异步处理、颜色分析、表格检测等）

### 使用示例

```typescript
import { generateIntelligentPdf } from "@/pdf-generator";

const pdf = await generateIntelligentPdf({
  headerElement: document.querySelector("#header"),
  contentElement: document.querySelector("#content"),
  footerElement: document.querySelector("#footer"),
  onFooterUpdate: (currentPage, totalPages) => {
    console.log(`当前页: ${currentPage}/${totalPages}`);
  },
});

await pdf.save("document.pdf", { returnPromise: true });
```

## 项目结构

```
SeamlessPDF/
├── src/
│   ├── pdf-generator/      # PDF 生成核心模块
│   │   ├── core/           # 主流程控制
│   │   ├── layout/         # 布局和分页计算
│   │   ├── rendering/      # 渲染逻辑
│   │   ├── utils/          # 工具函数
│   │   └── types/          # 类型定义
│   ├── components/         # Vue 组件
│   ├── views/              # 页面视图
│   ├── router/             # 路由配置
│   └── main.ts             # 应用入口
├── public/                 # 静态资源
└── package.json            # 项目配置
```

## 开发要求

- Node.js 22+
- pnpm（推荐）或 npm/yarn
