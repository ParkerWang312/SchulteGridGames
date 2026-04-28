# 舒尔特方格训练

一个同时提供 Python 桌面版和 Web 版的舒尔特方格训练项目，支持 `3 x 3` 到 `10 x 10` 难度，也就是覆盖 `1` 到 `100` 的数字训练。

## 在线体验

GitHub Pages 地址：

https://parkerwang312.github.io/SchulteGridGames/

如果页面暂时打不开，通常是因为仓库里的 GitHub Pages 还没有完成首次发布。可以到仓库的 `Settings -> Pages` 中确认发布源是否为 `main /docs`。

## 项目内容

- `docs/`：GitHub Pages 发布目录
- `Web/`：Web 版源码目录
- `main.py`：Python Tkinter 桌面版入口
- `GITHUB_PAGES.md`：GitHub Pages 发布说明

## 功能特性

- 支持 `3 x 3` 到 `10 x 10` 难度切换
- Web 版和 Python 版文案、配色、交互保持一致
- 按顺序点击数字，错误点击会即时提示
- 实时计时，并按难度记录最佳成绩
- 支持重新洗牌
- Web 版适合手机浏览器访问

## 玩法

1. 选择难度。
2. 点击“开始训练”。
3. 按照 `1`、`2`、`3` 的顺序依次点击数字。
4. 点击到当前难度的最大数字后，系统会显示本轮用时。

## 本地运行

### 运行 Python 桌面版

确保本机安装了 Python 3，然后在项目根目录执行：

```powershell
python main.py
```

如果你的 Windows 环境没有 `python` 命令，也可以尝试：

```powershell
py main.py
```

### 运行 Web 版

可以直接打开下面的文件：

- `Web/index.html`
- `docs/index.html`

如果你希望用本地静态服务访问，也可以在项目根目录执行：

```powershell
python -m http.server 8000
```

然后访问：

http://localhost:8000/docs/

## 发布说明

如果你要继续通过 GitHub Pages 发布，详细步骤见 `GITHUB_PAGES.md`。