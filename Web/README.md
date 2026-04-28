# 舒尔特方格 Web 版

这是一个用原生 HTML、CSS、JavaScript 实现的舒尔特方格网页版本，无需构建工具，也没有第三方依赖。

## 单一来源说明

仓库现在已经把 `docs/` 设为网页的唯一来源。

- `docs/`：唯一需要维护的网页目录
- `Web/index.html`：兼容入口，会自动跳转到 `docs/index.html`

如果你准备修改网页内容，请直接改 `docs/` 里的文件。

## 使用方式

优先直接打开 `../docs/index.html`。

如果你已经习惯从 `Web/index.html` 进入，也可以继续用，它会自动跳转到 `docs/index.html`。

## 功能

- 支持 `3 x 3` 到 `10 x 10`
- 点击“开始训练”后按顺序找数字
- 支持重新洗牌
- 实时计时
- 错误点击提示
- 使用 `localStorage` 保存各难度最佳成绩

## 文件说明

- `index.html`：兼容入口，自动跳转到 `docs/index.html`