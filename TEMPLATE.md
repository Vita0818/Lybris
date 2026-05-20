# Lybris 模板复用说明

## 1. 适用场景

Lybris 是一个多学科资料站模板，适合以下轻量内容站点：

- 课程资料站：讲义、作业、阅读材料和参考资料统一入口。
- 学科资料库：按课程、章节、主题或资料类型分层管理。
- 个人或团队学习档案：笔记、PDF、Markdown、链接和归档资料集中浏览。
- Google Drive 或其他外部资料源索引站：用静态 JSON 驱动前端展示。
- GitHub Pages 静态小站：零后端部署、低维护成本。

模板仓库只提供通用结构，不绑定任何具体学科。复制到具体学科仓库后，再替换配置和资料索引。

## 2. 技术架构

模板采用“静态前端 + 外部资料索引”的组合：

- GitHub Pages 托管 `index.html`、`style.css`、`script.js` 和 `data/*.json`。
- 外部资料源存储实际文件，可以是 Google Drive，也可以是能生成同结构 JSON 的其他来源。
- GitHub Actions 可定时拉取外部 JSON 并更新 `data/drive-index.json`。
- 前端脚本读取 `data/site-config.json`、`data/subject-config.json` 和 `data/drive-index.json` 后渲染资料书架。

## 3. 文件结构说明

- `index.html`：页面骨架，包含标题、头像、搜索、概览、导航、资源列表和预览弹窗容器。
- `style.css`：视觉样式，包括玻璃面板、卡片、按钮、目录树、移动端布局和预览阅读样式。
- `script.js`：数据加载、目录树渲染、导航、搜索、预览和 fallback 逻辑。
- `assets/avatar.png`：默认头像资源。
- `data/site-config.json`：站点级配置。
- `data/subject-config.json`：学科级配置。
- `data/drive-index.json`：前端读取的资料索引缓存。
- `google-apps-script.js`：Google Drive 扫描脚本样例。
- `.github/workflows/update-drive-index.yml`：定时或手动更新资料索引。

## 4. 数据流

```text
外部资料源
   ↓ 生成 JSON
资料索引 URL
   ↓ GitHub Actions 拉取
data/drive-index.json
   ↓ 前端 fetch
Lybris 页面渲染资料书架
```

## 5. 页面功能清单

- 顶部品牌区和学科说明。
- 资料源入口按钮。
- 搜索框。
- 返回上一级按钮。
- 面包屑路径导航。
- 左侧文件夹树。
- 右侧当前文件夹内容。
- 可预览资源的 PDF / Markdown 网页内预览。
- 原文件打开链接。
- 配置或索引加载失败时的中性 fallback。

## 6. 视觉风格边界

模板核心视觉应保持中性：

- 极浅蓝绿背景。
- 半透明白色玻璃面板。
- 连续圆角、细描边、轻阴影。
- serif 标题或数字，中文使用系统字体。
- 装饰标签只使用通用词，例如 Notes、Textbook、Archive、Course、Reference、Markdown、PDF。

不要把某一学科的公式、符号、课程编号或专有术语写进模板核心。具体学科气质应通过 `subject-config.json` 和资料索引配置体现。

## 7. 复制到具体学科仓库

1. 新建具体学科仓库，并复制 Lybris 模板文件。
2. 修改 `data/site-config.json`：站点标题、描述、资料源入口、按钮文案。
3. 修改 `data/subject-config.json`：学科标识、学科名称、分类和装饰标签。
4. 替换 `assets/avatar.png`，如需使用学科或组织头像。
5. 用真实资料索引替换 `data/drive-index.json`，或配置 `DRIVE_INDEX_SOURCE_URL`。
6. 如果使用 Google Drive，部署新的 Apps Script Web App。
7. 在 GitHub 仓库 Secrets 中设置 JSON 来源地址。
8. 启用 GitHub Pages。
9. 手动运行一次 workflow，确认资料索引成功更新。
10. 打开站点验证目录树、搜索、预览和原文件链接。

## 8. 复用边界建议

- 前端展示层可定制文案、主题色、卡片样式和分类名称。
- 数据结构应保持稳定，避免随意改动 `script.js` 依赖字段。
- 自动同步链路优先保持简单：外部资料源生成 JSON，Actions 同步到 `data/drive-index.json`。
- 模板仓库保留通用默认状态；具体课程、学科和真实资料应留在学科仓库。
