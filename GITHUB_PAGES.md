# GitHub Pages 发布说明

这个项目已经整理成适合 GitHub Pages 的结构：

```text
SchulteGridGames/
├─ docs/        # GitHub Pages 直接发布目录
├─ Web/         # 本地开发版本
├─ main.py      # Python 桌面版
└─ README.md
```

## 为什么用 `docs/`

对于同时包含 Python 和网页文件的仓库，GitHub Pages 最稳妥的做法是使用仓库根目录下的 `docs/` 作为静态站点发布目录。这样不会影响 Python 文件，也不需要单独建一个前端仓库。

## GitHub 发布步骤

1. 在 GitHub 上创建一个新仓库。
2. 把当前项目推送到这个仓库。
3. 打开仓库页面，进入 `Settings`。
4. 点击左侧的 `Pages`。
5. 在 `Build and deployment` 里选择：
   - `Source`: `Deploy from a branch`
   - `Branch`: `main`
   - `Folder`: `/docs`
6. 点击 `Save`。
7. 等待 GitHub 完成部署。

部署完成后，访问地址通常是：

`https://<GitHub用户名>.github.io/<仓库名>/`

## 本地 Git 操作示例

如果你还没把项目推到 GitHub，可以在项目根目录执行：

```powershell
git init
git add .
git commit -m "Prepare GitHub Pages deployment"
git branch -M main
git remote add origin https://github.com/<你的用户名>/<你的仓库名>.git
git push -u origin main
```

## 以后如何更新网页

以后只要修改并提交 `docs/` 目录中的文件，再推送到 GitHub，GitHub Pages 就会自动更新。

## 注意

- `docs/` 是发布目录，GitHub Pages 直接读取这里的文件。
- 网页最佳成绩使用浏览器本地 `localStorage` 保存，不会跨设备同步。
- 如果你希望以后只维护一份网页代码，可以再把 `Web/` 和 `docs/` 进一步合并成一个统一来源。