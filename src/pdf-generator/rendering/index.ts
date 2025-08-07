/**
 * 渲染引擎模块统一导出
 */

// Canvas渲染器
export {
  renderElementsToCanvas,
} from './canvas-renderer';

// 页脚渲染器
export {
  preRenderAllFooters,
} from './footer-renderer';

// 页面渲染器
export {
  renderSinglePage,
} from './page-renderer';
