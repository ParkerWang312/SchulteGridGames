# GitHub Pages 发布目录

这个目录是给 GitHub Pages 准备的静态发布目录。

## 目录用途

- `index.html`：Pages 入口页
- `styles.css`：Pages 样式文件
- `app.js`：Pages 脚本文件

## 如何发布

1. 把整个仓库推到 GitHub。
2. 打开仓库页面。
3. 进入 `Settings`。
4. 打开左侧的 `Pages`。
5. 在 `Build and deployment` 中选择：
   - `Source` 选 `Deploy from a branch`
   - `Branch` 选 `main`
   - 目录选 `/docs`
6. 保存后等待 GitHub 完成发布。

发布成功后，页面地址通常是：

`https://<你的用户名>.github.io/<仓库名>/`

## 更新方式

以后更新网页内容时，只要同步修改 `docs/` 目录并推送到 GitHub，Pages 会自动重新发布。