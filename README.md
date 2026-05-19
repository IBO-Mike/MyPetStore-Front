# MyPetStore Frontend

MyPetStore 的前端项目，使用 Webpack 构建多页面应用。页面包括首页、分类浏览、商品详情、购物车、订单、订单详情、个人中心、收藏、商品对比、登录和注册。

## 技术栈

- Webpack 5
- Babel
- 原生 HTML/CSS/JavaScript
- Webpack Dev Server

## 目录结构

```text
src/
  assets/
    css/        公共样式
    js/         API、登录态、布局和工具函数
  images/       静态图片资源
  pages/        多页面源码
dist/           构建产物
```

## 本地运行

先安装依赖：

```bash
npm install
```

启动开发服务器：

```bash
npm run dev
```

默认访问地址：

```text
http://localhost:3000
```

开发服务器会把 `/api` 请求代理到后端：

```text
http://localhost:1145
```

因此运行前端功能前，需要先启动后端服务。

如果后端地址不是默认端口，可以在启动时指定代理目标：

```bash
API_TARGET=http://localhost:1145 npm run dev
```

## 构建

```bash
npm run build
```

构建结果输出到：

```text
dist/
```

## 主要页面

- `/index.html` 首页
- `/catalog.html` 分类浏览
- `/product.html` 商品详情
- `/cart.html` 购物车
- `/order.html` 我的订单
- `/order-detail.html` 订单详情
- `/favorites.html` 我的收藏
- `/compare.html` 商品对比
- `/user.html` 个人中心
- `/login.html` 登录
- `/register.html` 注册
