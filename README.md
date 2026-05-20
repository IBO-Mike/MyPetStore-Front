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

## Windows 环境部署指南

### 前置环境准备

#### 1. 安装 Node.js 和 npm

1. 访问 [Node.js 官网](https://nodejs.org/)
2. 下载 LTS 版本的 Windows 安装程序
3. 按照向导完成安装，建议勾选 "Automatically install the necessary tools"
4. 安装完成后，打开 PowerShell 或 CMD，验证安装：

```bash
node --version
npm --version
```

#### 2. 安装 Java JDK

1. 访问 [Oracle Java 官网](https://www.oracle.com/java/technologies/downloads/) 或使用 [OpenJDK](https://openjdk.org/)
2. 下载 Java 11 或更高版本的 Windows x64 安装程序
3. 按照向导完成安装
4. 配置环境变量：
   - 右键点击 **此电脑** > **属性** > **高级系统设置**
   - 点击 **环境变量**
   - 新建系统变量 `JAVA_HOME`，值为 JDK 安装路径（如 `C:\Program Files\Java\jdk-21.0.1`）
   - 编辑 `Path` 变量，添加 `%JAVA_HOME%\bin`
5. 验证安装：

```bash
java -version
javac -version
```

#### 3. 安装 Maven

1. 访问 [Apache Maven 官网](https://maven.apache.org/download.cgi)
2. 下载二进制包 `apache-maven-x.x.x-bin.zip`
3. 解压到本地路径（如 `C:\maven`）
4. 配置环境变量：
   - 新建系统变量 `MAVEN_HOME`，值为解压路径
   - 编辑 `Path` 变量，添加 `%MAVEN_HOME%\bin`
5. 验证安装：

```bash
mvn -version
```

#### 4. 安装 MySQL

1. 访问 [MySQL 官网](https://dev.mysql.com/downloads/mysql/)
2. 下载 MySQL Community Server（Windows x86 64-bit）
3. 按照向导完成安装，记住 root 密码
4. 验证安装，使用 MySQL Command Line Client 或 MySQL Workbench 连接

### 前端部署步骤

1. 打开 PowerShell 或 CMD，进入前端项目目录：

```bash
cd MyPetStore-Front
```

2. 安装依赖：

```bash
npm install
```

3. 启动开发服务器（假设后端运行在 `http://localhost:1145`）：

```bash
npm run dev
```

如果后端地址不同，使用：

```bash
set API_TARGET=http://localhost:8080 && npm run dev
```

4. 在浏览器中访问：

```text
http://localhost:3000
```

### 后端部署步骤

1. 打开 PowerShell 或 CMD，进入后端项目目录：

```bash
cd MyPetStore-Backend
```

2. 配置数据库（使用 MySQL Workbench 或命令行）：

```bash
mysql -u root -p < mps.sql
```

3. 编辑 `src/main/resources/application.properties`，配置数据库连接：

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/mypetstore?useSSL=false&serverTimezone=UTC&characterEncoding=utf8
spring.datasource.username=root
spring.datasource.password=your_password
```

4. 编译项目：

```bash
mvn clean package
```

或直接运行（无需生成 jar）：

```bash
mvn spring-boot:run
```

5. 后端启动成功后，默认访问地址：

```text
http://localhost:1145
```

### 完整启动流程

1. **启动 MySQL 数据库**（如果使用 Windows Service，自动启动）
2. **启动后端**：

```bash
cd MyPetStore-Backend
mvn spring-boot:run
```

3. **启动前端**（在新的 PowerShell/CMD 窗口）：

```bash
cd MyPetStore-Front
npm run dev
```

4. **访问应用**：在浏览器打开 `http://localhost:3000`

### 故障排除

| 问题 | 解决方案 |
|------|---------|
| npm: 无法识别的命令 | 检查 Node.js 是否安装，重启 PowerShell/CMD |
| Java: 无法识别的命令 | 检查 JAVA_HOME 环境变量是否正确配置，重启终端 |
| Maven: 无法识别的命令 | 检查 MAVEN_HOME 环境变量是否正确配置 |
| 无法连接到数据库 | 检查 MySQL 是否运行，数据库配置是否正确 |
| 前端无法连接到后端 | 检查后端是否启动，确认后端端口号是否正确 |
| 端口被占用 | 使用 `netstat -ano \| findstr :PORT` 查看占用进程，或修改端口配置
