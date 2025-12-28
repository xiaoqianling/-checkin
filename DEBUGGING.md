# 本地调试指南

本文档详细介绍如何进行本地调试，包括本地运行和模拟 GitHub Actions 环境。

## 1. 环境准备

### 1.1 安装依赖

```bash
npm install
```

### 1.2 配置环境变量

复制 `.env.example` 文件为 `.env` 并填写真实值：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
TOKEN=你的库街区token
DEBUG=true
BARK_DEVICE_KEY=你的Bark设备key
BARK_SERVER_URL=https://api.day.app
SERVER3_SEND_KEY=你的ServerChan SendKey
```

## 2. 本地运行方式

### 2.1 开发模式运行（推荐）

使用 tsx 直接运行 TypeScript 文件，无需编译：

```bash
npm run dev
```

### 2.2 生产模式运行

先编译再运行：

```bash
npm run build
npm start
```

### 2.3 带调试信息的运行

启用详细日志输出：

```bash
DEBUG=true npm run dev
```

## 3. VSCode 调试

### 3.1 配置调试环境

1. 在 VSCode 中打开项目
2. 按 `F5` 或点击运行和调试
3. 选择调试配置：
   - **Debug TypeScript (tsx)** - 直接调试 TypeScript 文件
   - **Debug Compiled JavaScript** - 调试编译后的 JavaScript

### 3.2 设置断点

在代码中点击行号左侧设置断点，然后启动调试。

## 4. 模拟 GitHub Actions 环境

### 4.1 使用 act 工具（推荐）

#### 安装 act

```bash
# Windows (使用 Chocolatey)
choco install act

# 或使用 scoop
scoop install act

# macOS
brew install act

# Linux
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash
```

#### 运行 GitHub Actions 工作流

```bash
# 列出可用的工作流
act -l

# 运行特定工作流
act -W .github/workflows/auto_checkin.yaml

# 运行并查看详细输出
act -W .github/workflows/auto_checkin.yaml -v

# 手动触发工作流（模拟 workflow_dispatch）
act -W .github/workflows/auto_checkin.yaml --event workflow_dispatch
```

#### 配置 act 环境变量

创建 `.env` 文件或在命令行中设置：

```bash
# 方式1：使用 .env 文件
cat > .env << EOF
TOKEN=你的token
DEBUG=true
BARK_DEVICE_KEY=你的bark_key
BARK_SERVER_URL=https://api.day.app
SERVER3_SEND_KEY=你的serverchan_key
EOF

# 方式2：命令行设置
act -W .github/workflows/auto_checkin.yaml -s TOKEN=你的token -s DEBUG=true
```

### 4.2 手动模拟 GitHub Actions 步骤

```bash
# 1. 检出代码（已在本地）

# 2. 设置 Node.js 环境
node --version

# 3. 安装依赖
npm ci

# 4. 构建 TypeScript
npm run build

# 5. 运行脚本（模拟GitHub Actions环境变量）
export TOKEN=你的token
export DEBUG=true
export BARK_DEVICE_KEY=你的bark_key
export BARK_SERVER_URL=https://api.day.app
export SERVER3_SEND_KEY=你的serverchan_key

npm start
```

## 5. 调试技巧

### 5.1 网络请求调试

启用网络请求详细日志：

```typescript
// 在代码中添加
import axios from "axios";

// 启用axios调试
axios.interceptors.request.use((request) => {
  console.log("Request:", request.method?.toUpperCase(), request.url);
  console.log("Headers:", request.headers);
  console.log("Data:", request.data);
  return request;
});

axios.interceptors.response.use((response) => {
  console.log("Response:", response.status, response.statusText);
  console.log("Data:", response.data);
  return response;
});
```

### 5.2 环境变量检查

```typescript
// 检查环境变量是否正常加载
console.log("Environment variables:");
console.log(
  "TOKEN:",
  process.env.TOKEN ? "***" + process.env.TOKEN.slice(-4) : "Not set"
);
console.log("DEBUG:", process.env.DEBUG);
console.log(
  "BARK_DEVICE_KEY:",
  process.env.BARK_DEVICE_KEY ? "Set" : "Not set"
);
```

### 5.3 错误处理调试

```typescript
// 在 catch 块中添加详细错误信息
try {
  // 你的代码
} catch (error) {
  console.error("Error details:");
  console.error("Name:", error.name);
  console.error("Message:", error.message);
  console.error("Stack:", error.stack);

  if (axios.isAxiosError(error)) {
    console.error("Axios error details:");
    console.error("Status:", error.response?.status);
    console.error("Data:", error.response?.data);
  }
}
```

## 6. 常见问题排查

### 6.1 环境变量未加载

确保 `.env` 文件在项目根目录，且格式正确。

### 6.2 TypeScript 编译错误

运行 `npm run build` 检查编译错误。

### 6.3 网络请求失败

检查网络连接，确认 API 端点可访问。

### 6.4 Token 无效

验证 token 是否正确，可以在浏览器中测试 API。

## 7. 测试脚本

创建一个简单的测试脚本：

```bash
# test.sh
#!/bin/bash

echo "=== 环境检查 ==="
node --version
npm --version

echo "=== 依赖检查 ==="
npm list axios dotenv

echo "=== 编译检查 ==="
npm run build

echo "=== 运行测试 ==="
TOKEN=test DEBUG=true npm start
```

运行测试：

```bash
chmod +x test.sh
./test.sh
```

通过以上方法，您可以全面地进行本地调试和 GitHub Actions 环境模拟。
