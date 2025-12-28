#!/usr/bin/env node

/**
 * GitHub Actions本地模拟测试脚本
 * 用于在本地模拟GitHub Actions环境进行测试
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("=== GitHub Actions本地模拟测试 ===\n");

// 模拟GitHub Actions环境变量
function setupGitHubActionsEnv() {
  console.log("1. 设置GitHub Actions环境变量:");

  const githubEnv = {
    GITHUB_WORKSPACE: process.cwd(),
    GITHUB_ACTIONS: "true",
    GITHUB_RUN_ID: "local-test-" + Date.now(),
    GITHUB_RUN_NUMBER: "1",
    GITHUB_ACTOR: "local-user",
    GITHUB_REPOSITORY: "local/kurobbs-auto-checkin",
    GITHUB_EVENT_NAME: "workflow_dispatch",
    GITHUB_SHA: "local-commit",
    GITHUB_REF: "refs/heads/main",
  };

  Object.entries(githubEnv).forEach(([key, value]) => {
    process.env[key] = value;
    console.log(`   📝 ${key}=${value}`);
  });

  console.log("   ✅ GitHub Actions环境变量设置完成\n");
}

// 模拟GitHub Actions步骤
function simulateGitHubActions() {
  console.log("2. 模拟GitHub Actions工作流步骤:");

  const steps = [
    { name: "检出代码", command: 'echo "步骤1: 检出代码 (本地跳过)"' },
    { name: "设置Node.js", command: "node --version" },
    { name: "安装依赖", command: "npm install" },
    { name: "构建TypeScript", command: "npm run build" },
    { name: "运行签到脚本", command: "npm start" },
  ];

  steps.forEach((step, index) => {
    console.log(`\n   🔄 步骤${index + 1}: ${step.name}`);

    try {
      if (step.command.startsWith("echo")) {
        console.log(
          `      ${step.command.replace('echo "', "").replace('"', "")}`
        );
      } else {
        const output = execSync(step.command, {
          encoding: "utf8",
          stdio: ["pipe", "pipe", "pipe"],
        });
        console.log(`      ✅ 执行成功`);
        if (output && output.trim()) {
          console.log(`        输出: ${output.trim().split("\n")[0]}...`);
        }
      }
    } catch (error) {
      console.log(`      ❌ 执行失败: ${error.message}`);
      if (error.stdout) {
        console.log(
          `         错误输出: ${error.stdout.toString().trim().split("\n")[0]}`
        );
      }
    }
  });
}

// 检查GitHub Actions配置文件
function checkWorkflowConfig() {
  console.log("\n3. 检查GitHub Actions配置文件:");

  const workflowPath = path.join(
    __dirname,
    ".github",
    "workflows",
    "auto_checkin.yaml"
  );

  if (fs.existsSync(workflowPath)) {
    console.log("   ✅ workflow文件存在:", workflowPath);

    try {
      const content = fs.readFileSync(workflowPath, "utf8");
      const lines = content.split("\n");

      // 提取关键信息
      const nameMatch = content.match(/name:\s*([^\n]+)/);
      if (nameMatch) {
        console.log(`   📋 工作流名称: ${nameMatch[1].trim()}`);
      }

      const triggers = [];
      if (content.includes("schedule:")) triggers.push("定时触发");
      if (content.includes("workflow_dispatch:")) triggers.push("手动触发");
      if (triggers.length > 0) {
        console.log(`   🔔 触发方式: ${triggers.join(", ")}`);
      }

      const stepCount = (content.match(/- name:/g) || []).length;
      console.log(`   📊 步骤数量: ${stepCount}`);
    } catch (error) {
      console.log("   ❌ 读取workflow文件失败:", error.message);
    }
  } else {
    console.log("   ⚠️ workflow文件不存在");
  }
}

// 生成GitHub Actions调试报告
function generateDebugReport() {
  console.log("\n4. 生成调试报告:");

  const report = {
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    cwd: process.cwd(),
    envVars: {
      TOKEN: process.env.TOKEN ? "已设置" : "未设置",
      DEBUG: process.env.DEBUG || "未设置",
      BARK_DEVICE_KEY: process.env.BARK_DEVICE_KEY ? "已设置" : "未设置",
      SERVER3_SEND_KEY: process.env.SERVER3_SEND_KEY ? "已设置" : "未设置",
    },
    files: {
      packageJson: fs.existsSync(path.join(__dirname, "package.json")),
      tsconfig: fs.existsSync(path.join(__dirname, "tsconfig.json")),
      distDir: fs.existsSync(path.join(__dirname, "dist")),
      workflow: fs.existsSync(
        path.join(__dirname, ".github", "workflows", "auto_checkin.yaml")
      ),
    },
  };

  console.log("   📋 环境信息:");
  console.log(`      时间: ${report.timestamp}`);
  console.log(`      Node.js: ${report.nodeVersion}`);
  console.log(`      平台: ${report.platform}-${report.arch}`);

  console.log("   🔧 环境变量状态:");
  Object.entries(report.envVars).forEach(([key, value]) => {
    console.log(`      ${key}: ${value}`);
  });

  console.log("   📁 文件状态:");
  Object.entries(report.files).forEach(([key, exists]) => {
    console.log(`      ${key}: ${exists ? "✅ 存在" : "❌ 缺失"}`);
  });

  // 保存报告到文件
  const reportPath = path.join(__dirname, "github-actions-debug-report.json");
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n   💾 调试报告已保存: ${reportPath}`);
}

// 主函数
async function main() {
  try {
    setupGitHubActionsEnv();
    checkWorkflowConfig();

    console.log("\n⚠️  注意: 以下步骤将实际执行命令，请确保环境已正确配置");
    console.log("   按 Ctrl+C 可随时中断测试\n");

    // 询问用户是否继续执行实际命令
    const readline = require("readline");
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question("是否继续执行GitHub Actions模拟测试? (y/N): ", (answer) => {
      if (answer.toLowerCase() === "y" || answer.toLowerCase() === "yes") {
        simulateGitHubActions();
        generateDebugReport();

        console.log("\n=== GitHub Actions模拟测试完成 ===");
        console.log("\n📚 下一步:");
        console.log("1. 查看生成的调试报告: github-actions-debug-report.json");
        console.log("2. 在GitHub上实际测试工作流");
        console.log("3. 使用 act 工具进行更真实的本地测试");
      } else {
        generateDebugReport();
        console.log("\n✅ 已生成环境检查报告，跳过命令执行");
      }
      rl.close();
    });
  } catch (error) {
    console.error("测试过程中发生错误:", error);
    process.exit(1);
  }
}

// 运行主函数
if (require.main === module) {
  main();
}

module.exports = {
  setupGitHubActionsEnv,
  simulateGitHubActions,
  checkWorkflowConfig,
  generateDebugReport,
};
