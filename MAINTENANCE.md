# 维护手册

## 1) 以后如何上传新文件
你只需要维护 Google Drive 共享文件夹：

1. 把新 PDF / 资料上传到对应目录。
2. 保持文件夹命名一致、层级清晰（按课程/章节/主题）。
3. 避免“根目录堆满文件”，尽量先建子目录再上传。

> 结论：日常内容更新主要在 Drive 中完成，不需要直接改前端代码。

---

## 2) 如何手动同步到网站
路径：**GitHub 仓库 → Actions → Update Drive Index → Run workflow**

操作步骤：
1. 打开仓库的 Actions 页面。
2. 选择 `Update Drive Index` 工作流。
3. 点击 `Run workflow`。
4. 等待任务执行完成。

---

## 3) 如何确认同步成功
可按以下三项检查：

1. Workflow 运行状态为绿色（成功）。
2. 仓库中 `data/drive-index.json` 最近提交时间已更新。
3. 网站刷新后，能看到新上传文件/目录。

---

## 4) 网站没更新时的排查顺序
按顺序检查：

1. **GitHub Actions 日志**：是否执行失败、失败在哪一步。
2. **`DRIVE_INDEX_SOURCE_URL`**：Secret 值是否正确。
3. **Apps Script Web App URL**：能否直接访问并返回 JSON。
4. **Apps Script 部署状态**：脚本更新后是否重新部署了 Web App。
5. **`data/drive-index.json` 内容**：是否实际写入了新数据。
6. **浏览器缓存**：强制刷新（`Ctrl/Cmd + Shift + R`）。

---

## 5) 如何替换头像
- 直接替换文件：`assets/avatar.png`
- 保持文件名不变可避免额外改代码。
- 若改文件名，需要同步修改 `index.html` 中头像路径。

---

## 6) 如何改标题 / 副标题 / 按钮文案
主要修改文件：`index.html`

建议定位：
- 标题、副标题：页面顶部 header 区域文本节点
- 按钮文案（如“打开总文件夹”）：顶部操作区按钮文本

如涉及按钮链接目标（Drive URL），通常还需检查 `script.js` 对应常量或绑定逻辑。

---

## 7) 如何改视觉样式
- 主要改 `style.css`（颜色、间距、圆角、阴影、响应式等）
- 非必要不要改 `script.js` 的数据处理逻辑
- 调样式时优先“小步提交 + 页面验证”

---

## 8) 如何避免 Codex 误操作（强烈建议）
每次让 Codex 修改前，在 prompt 中明确限制：

1. 改视觉：只允许改 `style.css` / `index.html`
2. 改数据逻辑：只允许改 `script.js`
3. 禁止改 `data/drive-index.json`（除非你明确要求同步结果）
4. 禁止编造示例目录或假 PDF 数据
5. 必须先执行环境检查：

```bash
pwd
git status
git branch --show-current
ls -la
find . -maxdepth 3 -type f
```

---

## 9) 推荐维护节奏
- 内容更新：随时上传 Drive
- 索引同步：按需手动触发；或每日定时自动
- 样式优化：集中批量做，避免频繁改动数据逻辑
- 每次改动后：检查 Actions、站点显示、PDF 打开链路
