#!/usr/bin/env node

/**
 * 本地测试脚本
 * 用于验证环境配置和基本功能
 */

import { readFileSync, existsSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log("=== 库街区自动签到脚本本地测试 ===\n");

// 检查Node.js版本
console.log("1. Node.js环境检查:");
console.log(`   Node.js版本: ${process.version}`);
console.log(`   NPM版本: ${process.env.npm_version || "未知"}`);

// 检查依赖
console.log("\n2. 依赖检查:");
try {
  const packageJson = JSON.parse(
    readFileSync(join(__dirname, "package.json"), "utf8")
  );
  console.log("   ✅ package.json加载成功");
  console.log(`   📦 项目名称: ${packageJson.name}`);
  console.log(`   📋 版本: ${packageJson.version}`);

  // 检查主要依赖
  const deps = ["axios", "dotenv"];
  deps.forEach((dep) => {
    try {
      // 使用import.meta.resolve检查模块是否存在
      import.meta.resolve(dep);
      console.log(`   ✅ ${dep} 依赖可用`);
    } catch {
      console.log(`   ⚠️ ${dep} 依赖可能缺失，请运行: npm install`);
    }
  });
} catch (error) {
  console.log("   ❌ package.json加载失败:", error.message);
}

// 检查TypeScript编译
console.log("\n3. TypeScript编译检查:");
try {
  if (existsSync(join(__dirname, "dist"))) {
    console.log("   ✅ dist目录存在");

    const files = readdirSync(join(__dirname, "dist"));
    if (files.length > 0) {
      console.log("   ✅ 编译文件存在:", files.join(", "));
    } else {
      console.log("   ⚠️ dist目录为空，请运行: npm run build");
    }
  } else {
    console.log("   ⚠️ dist目录不存在，请运行: npm run build");
  }
} catch (error) {
  console.log("   ❌ 编译检查失败:", error.message);
}

// 检查环境变量
console.log("\n4. 环境变量检查:");
const envVars = [
  "TOKEN",
  "DEBUG",
  "BARK_DEVICE_KEY",
  "BARK_SERVER_URL",
  "SERVER3_SEND_KEY",
];

envVars.forEach((envVar) => {
  const value = process.env[envVar];
  if (value) {
    // 对敏感信息进行掩码显示
    const maskedValue =
      value.length <= 6 ? "***" : `${value.slice(0, 3)}***${value.slice(-3)}`;
    console.log(`   ✅ ${envVar}: ${maskedValue}`);
  } else {
    console.log(`   ⚠️ ${envVar}: 未设置`);
  }
});

// 检查.env文件
console.log("\n5. 配置文件检查:");
try {
  if (existsSync(join(__dirname, ".env"))) {
    console.log("   ✅ .env文件存在");

    const envContent = readFileSync(join(__dirname, ".env"), "utf8");
    const lines = envContent
      .split("\n")
      .filter((line) => line.trim() && !line.startsWith("#"));
    console.log(`   📋 配置了 ${lines.length} 个环境变量`);
  } else {
    console.log("   ⚠️ .env文件不存在，请复制 .env.example 并配置");
  }

  if (existsSync(join(__dirname, ".env.example"))) {
    console.log("   ✅ .env.example示例文件存在");
  }
} catch (error) {
  console.log("   ❌ 配置文件检查失败:", error.message);
}

console.log("\n=== 测试完成 ===");
console.log("\n下一步操作:");
console.log("1. 配置环境变量: cp .env.example .env");
console.log("2. 开发模式运行: npm run dev");
console.log("3. 生产模式运行: npm run build && npm start");
console.log("4. 调试: 在VSCode中按F5启动调试");

// 如果TOKEN已设置，可以进行简单的API测试
if (process.env.TOKEN) {
  console.log("\n🔍 检测到TOKEN，可以进行API连接测试...");
  console.log("   运行: npm run dev 进行完整测试");
} else {
  console.log("\n⚠️  TOKEN未设置，请先配置环境变量");
}

console.log("\n📚 详细调试指南请查看 DEBUGGING.md");
