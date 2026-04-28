# 舒尔特方格 Web 版

这是一个用原生 HTML、CSS、JavaScript 实现的舒尔特方格网页版本，无需构建工具，也没有第三方依赖。

## GitHub Pages 发布建议

仓库里已经额外整理了一个 `docs/` 目录，适合直接给 GitHub Pages 使用。

- `Web/`：本地开发和查看用
- `docs/`：GitHub Pages 发布用

如果你准备把项目发布到 GitHub Pages，优先使用仓库根目录下的 `docs/`。

## 使用方式

直接在浏览器中打开 `index.html` 即可运行。

## 功能

- 支持 `3 x 3` 到 `10 x 10`
- 点击“开始游戏”后按顺序找数字
- 支持重新洗牌
- 实时计时
- 错误点击提示
- 使用 `localStorage` 保存各难度最佳成绩

## 文件说明

- `index.html`：页面结构
- `styles.css`：界面样式
- `app.js`：游戏逻辑