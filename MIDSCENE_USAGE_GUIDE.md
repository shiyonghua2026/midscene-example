# Midscene 使用指南

Midscene 是一个基于 AI 的 Web/移动端自动化测试框架，支持自然语言描述操作。

---

## 目录

1. [环境配置](#1-环境配置)
2. [.env 文件配置](#2-env-文件配置)
3. [启动 Playground 调试](#3-启动-playground-调试)
4. [测试编写模式](#4-测试编写模式)
5. [YAML 脚本详解](#5-yaml-脚本详解)
6. [常用 API 方法](#6-常用-api-方法)
7. [缓存与报告](#7-缓存与报告)
8. [Chrome 录制脚本转换](#8-chrome-录制脚本转换)
9. [Chrome 扩展 Playground](#9-chrome-扩展-playground)
10. [快速编写脚本最佳实践](#10-快速编写脚本最佳实践)

---

## 1. 环境配置

### 安装依赖

```bash
cd playwright-testing-demo
pnpm install
```

### 核心依赖包

| 包名 | 用途 |
|------|------|
| `@midscene/web` | Web 浏览器自动化核心 SDK |
| `@midscene/cli` | YAML 脚本命令行执行器 |
| `@playwright/test` | Playwright 测试框架 |
| `dotenv` | 环境变量加载 |

---

## 2. .env 文件配置

在项目目录创建 `.env` 文件。

### 基础配置模板

```env
# 模型名称
MIDSCENE_MODEL_NAME=gemini-3-flash-preview

# API 密钥和地址
OPENAI_API_KEY=sk-xxxxx
OPENAI_BASE_URL=https://your-api-endpoint.com/v1

# 调试选项
MIDSCENE_HEADLESS=false
MIDSCENE_DEBUG_AI_PROFILE=1
MIDSCENE_CACHE=1
```

### 不同 AI 模型配置

#### OpenAI 兼容接口

```env
OPENAI_API_KEY=sk-xxxxx
OPENAI_BASE_URL=https://api.openai.com/v1
MIDSCENE_MODEL_NAME=gpt-4-vision-preview
```

#### Gemini

```env
MIDSCENE_MODEL_NAME=gemini-3-flash-preview
MIDSCENE_MODEL_FAMILY=gemini
```

**使用第三方代理时**：

```env
MIDSCENE_MODEL_NAME=gemini-3-flash-preview-thinking
MIDSCENE_MODEL_FAMILY=gemini
OPENAI_API_KEY=your-api-key
OPENAI_BASE_URL=https://your-proxy-endpoint/v1
```

#### Claude (Anthropic)

```env
MIDSCENE_USE_ANTHROPIC_SDK=1
MIDSCENE_MODEL_NAME=claude-sonnet-4-5-20250514
ANTHROPIC_API_KEY=sk-ant-xxxxx
```

#### 通义千问 Qwen3-vl

```env
MIDSCENE_MODEL_NAME=qwen3-vl-plus
MIDSCENE_MODEL_FAMILY=qwen3-vl
OPENAI_API_KEY=your-dashscope-key
OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
```

#### Ollama 本地部署

```env
OPENAI_BASE_URL=http://localhost:11434/v1
OPENAI_API_KEY=ollama
MIDSCENE_MODEL_NAME=llama3.2-vision
```

### 环境变量说明

| 变量名 | 说明 |
|--------|------|
| `MIDSCENE_MODEL_NAME` | AI 模型名称 |
| `MIDSCENE_MODEL_FAMILY` | 模型家族（见下表） |
| `OPENAI_API_KEY` | API 密钥 |
| `OPENAI_BASE_URL` | API 端点地址 |
| `MIDSCENE_HEADLESS` | 无头模式 (true/false) |
| `MIDSCENE_CACHE` | 启用缓存 (1/true) |

### MODEL_FAMILY 对照表

| 模型类型 | MODEL_FAMILY 值 | 是否必需 |
|---------|----------------|---------|
| Gemini | `gemini` | 是（使用第三方代理时） |
| GPT-4o | 不需要设置 | 否 |
| Claude | 不需要设置 | 否 |
| Qwen2.5-VL | `qwen2.5-vl` | 是 |
| Qwen3-VL | `qwen3-vl` | 是 |
| Doubao Vision | `vlm-ui-tars-doubao-1.5` | 是 |

**注意**：如果遇到错误 `modelFamily cannot be undefined when includeBbox is true`，说明需要设置 `MIDSCENE_MODEL_FAMILY`。

---

## 3. 启动 Playground 调试

# 启动 Midscene Playground
npx --yes @midscene/web

### Playwright Test UI 模式（推荐）

```bash
cd playwright-testing-demo

# 启动 Playwright UI（可视化调试界面）
pnpm run e2e:ui

# 启动 UI 并启用缓存
pnpm run e2e:ui:cache
```

### 命令行执行测试

```bash
# 运行所有测试
pnpm run e2e

# 启用缓存运行
pnpm run e2e:cache

# 运行特定测试文件
npx playwright test e2e/todo-mvc-en.spec.ts

# 显示浏览器窗口
npx playwright test --headed
```

### 脚本模式运行

```bash
cd playwright-demo

# 运行基础 demo
npx tsx demo.ts

# 运行数据提取示例
npx tsx extract-data.ts
```

### YAML 脚本调试

```bash
# 全局安装 CLI
npm install -g @midscene/cli

# 运行脚本（显示浏览器）
midscene --headed ./midscene-scripts/sauce-demo.yaml

# 保持窗口不关闭
midscene --keep-window ./midscene-scripts/sauce-demo.yaml
```

---

## 4. 测试编写模式

### Playwright Test 框架模式

**fixture.ts** - 测试夹具配置：

```typescript
import { test as base } from '@playwright/test';
import type { PlayWrightAiFixtureType } from '@midscene/web/playwright';
import { PlaywrightAiFixture } from '@midscene/web/playwright';

export const test = base.extend<PlayWrightAiFixtureType>(PlaywrightAiFixture());
```

**测试文件示例：**

```typescript
import { expect } from '@playwright/test';
import { test } from './fixture';

test.beforeEach(async ({ page }) => {
  await page.goto('https://todomvc.com/examples/react/dist/');
});

test('AI 驱动的 Todo 测试', async ({ ai, aiQuery, aiAssert }) => {
  await ai("在任务输入框中输入 'Learn JS' 然后按回车");

  const list = await aiQuery('string[], 完整的任务列表');
  expect(list.length).toEqual(1);

  await aiAssert('列表底部显示 "1 item left"');
});
```

### 直接脚本模式

```typescript
import { chromium } from 'playwright';
import { PlaywrightAgent } from '@midscene/web/playwright';
import 'dotenv/config';

async function main() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto('https://www.ebay.com');

  const agent = new PlaywrightAgent(page);

  await agent.aiAct('在搜索框输入 "Headphones"，按回车');
  await agent.aiWaitFor('页面上有耳机商品');

  const items = await agent.aiQuery<Array<{ title: string; price: number }>>(
    '{title: string, price: number}[], 商品标题和价格'
  );
  console.log(items);

  await browser.close();
}

main();
```

### YAML 脚本模式

```yaml
web:
  url: https://www.ebay.com
  viewportWidth: 1280
  viewportHeight: 720

tasks:
  - name: 搜索商品
    flow:
      - aiAct: 在搜索框输入 'Headphones'，按回车
      - sleep: 3000

  - name: 提取数据
    flow:
      - aiQuery: "{name: string, price: number}[], 商品名称和价格"
        name: products

  - name: 验证结果
    flow:
      - aiAssert: 页面上有耳机商品列表
```

---

## 5. YAML 脚本详解

YAML 脚本是 Midscene 提供的一种无需编写代码的自动化方式，让团队成员可以专注于业务逻辑而非框架 API。

### 5.1 YAML 脚本基本结构

```yaml
# 目标配置（web/android/ios/computer 四选一）
web:
  url: https://example.com

# Agent 配置（可选）
agent:
  testId: "test-name"
  generateReport: true

# 任务列表
tasks:
  - name: 任务名称
    flow:
      - aiAct: "执行操作"
      - aiAssert: "验证结果"
```

### 5.2 目标平台配置

#### Web 浏览器配置

```yaml
web:
  url: https://www.example.com        # 必填：目标 URL
  serve: ./public                      # 可选：本地静态服务目录
  viewportWidth: 1280                  # 可选：视口宽度（默认 1280）
  viewportHeight: 960                  # 可选：视口高度（默认 960）
  deviceScaleFactor: 2                 # 可选：设备像素比
  userAgent: "Mozilla/5.0..."          # 可选：自定义 User-Agent
  cookie: ./cookies.json               # 可选：Cookie 文件路径
  output: ./output/result.json         # 可选：输出结果文件
  bridgeMode: false                    # 可选：桥接模式（见多页面章节）
```

#### Android 配置

```yaml
android:
  deviceId: emulator-5554              # 设备 ID
  launch: https://www.example.com      # 启动 URL 或包名
  output: ./output/result.json
```

#### iOS 配置

```yaml
ios:
  wdaPort: 8100                        # WebDriverAgent 端口
  launch: com.example.app              # Bundle ID 或 URL
  autoDismissKeyboard: false           # 是否自动关闭键盘
```

#### 桌面控制配置

```yaml
computer:
  displayId: 1                         # 可选：显示器 ID
  output: ./output/result.json
```

### 5.3 Agent 配置选项

```yaml
agent:
  testId: "login-test"                 # 测试标识符
  groupName: "用户认证"                 # 报告分组名称
  generateReport: true                 # 是否生成报告（默认 true）
  replanningCycleLimit: 20             # AI 重规划次数限制（默认 20）
  aiActContext: "如果出现弹窗，点击关闭"  # AI 操作的全局上下文提示
  cache:
    strategy: 'read-write'             # 缓存策略：read-only/read-write/write-only
    id: my-cache-id                    # 缓存 ID
```

### 5.4 可用的操作指令

#### 规划类操作（AI 智能执行）

| 指令 | 说明 | 示例 |
|------|------|------|
| `ai` / `aiAct` | 通用操作 | `aiAct: 点击登录按钮` |
| `aiKeyboardPress` | 按键操作 | `aiKeyboardPress: Enter` |
| `aiScroll` | 滚动页面 | `aiScroll: 向下滚动 500px` |

#### 即时操作（直接执行）

| 指令 | 说明 | 示例 |
|------|------|------|
| `aiTap` | 点击元素 | `aiTap: 提交按钮` |
| `aiHover` | 悬停元素 | `aiHover: 用户头像` |
| `aiInput` | 输入文本 | 见下方示例 |

#### 查询与断言

| 指令 | 说明 | 示例 |
|------|------|------|
| `aiQuery` | 提取数据 | `aiQuery: "string[], 所有链接"` |
| `aiAssert` | 断言验证 | `aiAssert: 页面显示"登录成功"` |
| `aiWaitFor` | 等待条件 | `aiWaitFor: 加载完成` |
| `aiNumber` | 提取数字 | `aiNumber: 商品价格是多少？` |
| `aiString` | 提取字符串 | `aiString: 页面标题` |
| `aiBoolean` | 提取布尔值 | `aiBoolean: 是否已登录？` |
| `aiLocate` | 定位元素 | `aiLocate: 搜索按钮的位置` |

#### 工具类操作

| 指令 | 说明 | 示例 |
|------|------|------|
| `sleep` | 等待毫秒 | `sleep: 3000` |
| `javascript` | 执行 JS | `javascript: document.title` |
| `recordToReport` | 截图记录 | `recordToReport: 登录后截图` |

### 5.5 单页面完整示例

#### 示例 1：电商登录并添加购物车

```yaml
# sauce-demo-login.yaml
# 登录 Sauce Demo 并添加商品到购物车

web:
  url: https://www.saucedemo.com/
  viewportWidth: 1280
  viewportHeight: 720
  output: ./output/sauce-demo-result.json

agent:
  testId: "sauce-demo-cart"
  aiActContext: 如果出现任何弹窗或提示，点击关闭或确认

tasks:
  - name: 用户登录
    flow:
      - aiAssert: 登录表单可见
      - aiAct: 在用户名输入框中输入 'standard_user'
      - aiAct: 在密码输入框中输入 'secret_sauce'
      - aiTap: Login 按钮
      - sleep: 2000

  - name: 验证登录成功
    flow:
      - aiAssert: 页面标题显示 "Swag Labs"
      - aiWaitFor: 商品列表加载完成

  - name: 提取商品信息
    flow:
      - aiQuery: >
          {name: string, price: number, description: string}[],
          提取所有商品的名称、价格和描述
        name: products

  - name: 添加商品到购物车
    flow:
      - aiAct: 点击 "Sauce Labs Backpack" 商品的 "Add to cart" 按钮
      - aiAct: 点击 "Sauce Labs Bike Light" 商品的 "Add to cart" 按钮
      - sleep: 1000

  - name: 查看购物车
    flow:
      - aiTap: 右上角的购物车图标
      - sleep: 1500
      - aiAssert: 购物车中有 2 件商品
      - aiQuery: >
          {name: string, price: number}[], 购物车中的商品名称和价格
        name: cartItems
```

#### 示例 2：搜索并提取数据

```yaml
# ebay-search.yaml
# 在 eBay 搜索商品并提取信息

web:
  url: https://www.ebay.com
  viewportWidth: 1280
  viewportHeight: 800
  output: ./output/ebay-search.json

agent:
  testId: "ebay-headphone-search"
  cache:
    strategy: 'read-write'
    id: ebay-search-cache

tasks:
  - name: 搜索商品
    flow:
      - aiWaitFor: 搜索框可见
      - aiAct: 在搜索框中输入 'Wireless Headphones'
      - aiTap: 搜索按钮
      - sleep: 3000

  - name: 筛选和排序
    flow:
      - aiAct: 点击 "Buy It Now" 筛选选项
      - sleep: 2000
      - aiAct: 将价格排序改为从低到高
      - sleep: 2000

  - name: 提取商品列表
    flow:
      - aiQuery: >
          {
            title: string,
            price: number,
            shipping: string,
            seller: string
          }[],
          提取前 5 个商品的标题、价格、运费和卖家信息
        name: products
      - aiNumber: 第一个商品的价格是多少？
      - aiString: 第一个商品的标题是什么？

  - name: 验证结果
    flow:
      - aiAssert: 页面上显示了无线耳机商品
      - aiBoolean: 是否有商品价格低于 $50？
```

#### 示例 3：表单填写与验证

```yaml
# form-submission.yaml
# 填写联系表单并验证提交

web:
  url: https://example.com/contact
  viewportWidth: 1024
  viewportHeight: 768

agent:
  testId: "contact-form"
  aiActContext: 所有必填字段旁边都有红色星号标记

tasks:
  - name: 填写个人信息
    flow:
      - aiInput:
          locate: 姓名输入框
          value: 张三
      - aiInput:
          locate: 邮箱输入框
          value: zhangsan@example.com
      - aiInput:
          locate: 电话输入框
          value: 13800138000

  - name: 选择选项
    flow:
      - aiAct: 点击"咨询类型"下拉框，选择"技术支持"
      - aiTap: "接受服务条款"复选框

  - name: 填写留言
    flow:
      - aiInput:
          locate: 留言文本框
          value: >
            您好，我想咨询关于产品的技术问题。
            请在工作时间内与我联系，谢谢！

  - name: 提交并验证
    flow:
      - recordToReport: 提交前截图
      - aiTap: 提交按钮
      - sleep: 2000
      - aiAssert: 页面显示"提交成功"或"感谢您的留言"
      - recordToReport: 提交后截图
```

#### 示例 4：Todo 应用测试

```yaml
# todo-app-test.yaml
# Todo MVC 应用完整测试

web:
  url: https://todomvc.com/examples/react/dist/
  viewportWidth: 1280
  viewportHeight: 720
  output: ./output/todo-result.json

agent:
  testId: "todo-mvc-test"

tasks:
  - name: 添加任务
    flow:
      - aiWaitFor: 任务输入框可见
      - aiAct: 在任务输入框中输入 '学习 JavaScript'，按回车
      - aiAct: 在任务输入框中输入 '学习 TypeScript'，按回车
      - aiAct: 在任务输入框中输入 '学习 Midscene'，按回车
      - sleep: 1000

  - name: 验证任务添加
    flow:
      - aiQuery: >
          string[], 任务列表中所有任务的文本
        name: taskList
      - aiAssert: 任务列表显示 3 个任务
      - aiAssert: 底部显示 "3 items left"

  - name: 完成任务
    flow:
      - aiTap: '学习 JavaScript' 任务左侧的复选框
      - sleep: 500
      - aiAssert: 底部显示 "2 items left"
      - aiAssert: '学习 JavaScript' 任务有删除线样式

  - name: 筛选任务
    flow:
      - aiTap: "Completed" 筛选按钮
      - sleep: 500
      - aiQuery: >
          string[], 当前显示的任务列表
        name: completedTasks
      - aiAssert: 只显示 1 个已完成的任务

  - name: 清除已完成
    flow:
      - aiTap: "All" 筛选按钮
      - aiTap: "Clear completed" 按钮
      - sleep: 500
      - aiAssert: 任务列表只剩 2 个任务

  - name: 删除任务
    flow:
      - aiAct: 将鼠标悬停在 '学习 TypeScript' 任务上
      - aiTap: 该任务右侧的删除按钮（X）
      - sleep: 500
      - aiAssert: 任务列表只剩 1 个任务
```

### 5.6 多页面与弹窗处理

> **重要说明**：YAML 脚本主要设计用于单页面自动化。每个 Agent 实例绑定到单个页面。

#### 默认行为：同页面导航

默认情况下，Midscene 会**拦截新标签页**（包括 `target="_blank"` 链接），并在当前页面打开以简化调试。

#### 方式一：使用 bridgeMode 处理多标签页

```yaml
# multi-tab-bridge.yaml
# 使用桥接模式连接现有标签页

web:
  url: https://www.example.com
  bridgeMode: 'newTabWithUrl'          # 在新标签页中打开
  # bridgeMode: 'currentTab'           # 或连接当前活动标签页

tasks:
  - name: 在当前页面操作
    flow:
      - aiAct: 点击某个链接
      - sleep: 2000
```

#### 方式二：处理同页面弹窗（Modal/Dialog）

对于在同一页面内的弹窗（如模态框、对话框），可以直接操作：

```yaml
# modal-dialog.yaml
# 处理页面内的模态弹窗

web:
  url: https://www.example.com
  viewportWidth: 1280
  viewportHeight: 720

agent:
  aiActContext: 如果出现任何确认弹窗，根据操作需要选择确认或取消

tasks:
  - name: 触发弹窗
    flow:
      - aiTap: "删除账户"按钮
      - sleep: 500

  - name: 处理确认弹窗
    flow:
      - aiWaitFor: 确认对话框出现
      - aiAssert: 弹窗显示"确定要删除账户吗？"
      - aiTap: 弹窗中的"取消"按钮
      - sleep: 500
      - aiAssert: 弹窗已关闭

  - name: 再次触发并确认
    flow:
      - aiTap: "删除账户"按钮
      - sleep: 500
      - aiTap: 弹窗中的"确认删除"按钮
      - sleep: 1000
      - aiAssert: 页面显示"账户已删除"
```

#### 方式三：处理浏览器原生弹窗

```yaml
# native-alert.yaml
# 处理浏览器 alert/confirm/prompt 弹窗

web:
  url: https://www.example.com

agent:
  aiActContext: >
    如果浏览器弹出 alert 对话框，点击确定。
    如果弹出 confirm 对话框，根据测试需要选择确定或取消。

tasks:
  - name: 处理 Alert
    flow:
      - aiAct: 点击触发 Alert 的按钮
      - sleep: 500
      - aiAct: 点击 Alert 对话框的"确定"按钮

  - name: 处理 Confirm
    flow:
      - aiAct: 点击触发 Confirm 的按钮
      - sleep: 500
      - aiAct: 在确认对话框中点击"取消"
```

#### 方式四：多页面流程（顺序导航）

对于需要访问多个页面的场景，可以通过页面内导航实现：

```yaml
# multi-page-flow.yaml
# 通过页面导航访问多个页面

web:
  url: https://www.example.com
  viewportWidth: 1280
  viewportHeight: 720

tasks:
  - name: 首页操作
    flow:
      - aiWaitFor: 首页加载完成
      - aiQuery: >
          string[], 导航菜单中的所有链接文本
        name: navLinks
      - recordToReport: 首页截图

  - name: 进入产品页
    flow:
      - aiTap: 导航菜单中的"产品"链接
      - sleep: 2000
      - aiWaitFor: 产品列表页面加载完成
      - aiAssert: URL 包含 "/products"
      - recordToReport: 产品页截图

  - name: 查看产品详情
    flow:
      - aiTap: 第一个产品卡片
      - sleep: 2000
      - aiWaitFor: 产品详情页加载完成
      - aiQuery: >
          {name: string, price: number, description: string}, 产品详情信息
        name: productDetail
      - recordToReport: 产品详情截图

  - name: 返回并验证
    flow:
      - aiAct: 点击浏览器返回按钮或页面的返回链接
      - sleep: 1500
      - aiAssert: 返回到产品列表页面
```

#### 方式五：处理新窗口链接

```yaml
# handle-new-window-links.yaml
# 处理会打开新窗口的链接

web:
  url: https://www.example.com

agent:
  aiActContext: >
    默认情况下，所有 target="_blank" 链接会在当前页面打开。
    如果需要返回原页面，使用浏览器的后退功能。

tasks:
  - name: 点击外部链接
    flow:
      - recordToReport: 点击前截图
      - aiTap: "帮助文档"链接（即使有新窗口图标也会在当前页面打开）
      - sleep: 3000
      - aiAssert: 帮助文档页面已加载

  - name: 返回原页面
    flow:
      - javascript: window.history.back()
      - sleep: 2000
      - aiAssert: 返回到原始页面
```

### 5.7 高级特性

#### 使用图片定位元素

```yaml
tasks:
  - name: 通过图片定位
    flow:
      - aiTap:
          locate:
            prompt: 点击与参考图片匹配的 Logo
            images:
              - name: "company-logo"
                url: "./images/logo.png"
            convertHttpImage2Base64: true
```

#### 执行 JavaScript 代码

```yaml
tasks:
  - name: 执行自定义脚本
    flow:
      - javascript: >
          document.title
        name: pageTitle

      - javascript: >
          localStorage.setItem('theme', 'dark');
          return localStorage.getItem('theme');
        name: themeValue

      - javascript: >
          window.scrollTo(0, document.body.scrollHeight);
```

#### 条件继续执行

```yaml
tasks:
  - name: 可能失败的任务
    continueOnError: true              # 即使失败也继续执行下一个任务
    flow:
      - aiTap: 可能不存在的元素
      - sleep: 1000

  - name: 后续任务
    flow:
      - aiAssert: 页面正常显示
```

#### 深度思考模式

```yaml
tasks:
  - name: 复杂操作
    flow:
      - ai: 分析页面结构，找到最合适的提交按钮
        deepThink: true                # 启用深度思考（取决于模型支持）
        cacheable: false               # 不缓存此操作结果
```

### 5.8 运行 YAML 脚本

```bash
# 安装 CLI 工具
npm install -g @midscene/cli

# 基本运行
midscene ./scripts/my-test.yaml

# 显示浏览器窗口
midscene --headed ./scripts/my-test.yaml

# 保持窗口不关闭
midscene --keep-window ./scripts/my-test.yaml

# 运行多个脚本
midscene ./scripts/*.yaml
```

### 5.9 YAML 脚本最佳实践

| 建议 | 说明 |
|------|------|
| 使用描述性的任务名称 | 方便在报告中定位问题 |
| 合理使用 sleep | 等待页面加载或动画完成 |
| 善用 aiActContext | 为 AI 提供全局操作上下文 |
| 启用缓存 | 开发阶段使用缓存加速迭代 |
| 使用 recordToReport | 在关键步骤截图便于调试 |
| 拆分复杂流程 | 将大任务拆分为多个小任务 |

---

## 6. 常用 API 方法

### 操作类

| 方法 | 说明 | 示例 |
|------|------|------|
| `ai(prompt)` | 通用操作 | `await ai("点击登录按钮")` |
| `aiAct(prompt)` | 具体操作 | `await aiAct("输入 'test'")` |
| `aiTap(prompt)` | 点击 | `await aiTap("提交按钮")` |
| `aiWaitFor(condition)` | 等待条件 | `await aiWaitFor("加载完成")` |

### 查询类

| 方法 | 说明 | 示例 |
|------|------|------|
| `aiQuery<T>(schema)` | 提取数据 | `await aiQuery<string[]>("string[], 链接")` |
| `aiString(prompt)` | 提取字符串 | `await aiString("页面标题")` |
| `aiNumber(prompt)` | 提取数字 | `await aiNumber("商品数量")` |
| `aiBoolean(prompt)` | 提取布尔值 | `await aiBoolean("是否登录?")` |

### 断言

| 方法 | 说明 |
|------|------|
| `aiAssert(condition)` | AI 断言 |

---

## 7. 缓存与报告

### 缓存机制

```bash
# 启用缓存
MIDSCENE_CACHE=1 pnpm run e2e
```

缓存位置：`midscene_run/cache/*.cache.yaml`

### 测试报告

报告位置：`midscene_run/report/[report-id].html`

**Playwright 配置：**

```typescript
// playwright.config.ts
export default defineConfig({
  reporter: [
    ['list'],
    ['@midscene/web/playwright-reporter'],
  ],
});
```

---

## 8. Chrome 录制脚本转换

通过 Chrome 的录制功能生成 Playwright 脚本，然后转换为 Midscene 自然语言脚本。

### Chrome 浏览器版本要求

| 项目 | 要求 |
|------|------|
| 最低版本 | Chrome 101 或更高版本 |
| 推荐版本 | 最新稳定版 Chrome（Chrome 120+） |
| 下载地址 | https://www.google.com/chrome/ |

### 推荐的 Chrome 扩展插件

#### Playwright Chrome Recorder（推荐）

| 项目 | 信息 |
|------|------|
| 名称 | Playwright Chrome Recorder |
| 链接 | [Chrome Web Store](https://chromewebstore.google.com/detail/playwright-chrome-recorde/bfnbgoehgplaehdceponclakmhlgjlpd) |
| 功能 | 从 DevTools Recorder 面板直接导出 Playwright 测试脚本 |
| 特点 | 实时生成脚本、支持暂停/恢复/重排序操作 |

#### Playwright CRX

| 项目 | 信息 |
|------|------|
| 名称 | Playwright CRX |
| 链接 | [Chrome Web Store](https://chromewebstore.google.com/detail/playwright-crx/jambeljnbnfbkcpnoiaedcabbgmnnlcd) |
| 功能 | 浏览器内直接运行 Playwright，支持录制和回放 |
| 特点 | 可录制断言、支持多标签页 |

#### Playwright Recorder

| 项目 | 信息 |
|------|------|
| 名称 | Playwright Recorder |
| 链接 | [Chrome Web Store](https://chromewebstore.google.com/detail/playwright-recorder/bapaclfmcgookbglclacfgeemaehkkme) |
| 功能 | 录制浏览器操作，生成多语言脚本 |
| 特点 | 支持 JavaScript、TypeScript、Python、Java、C# |

### 命令行工具（可选）

```bash
# 批量导出 Chrome DevTools 录制的 JSON 文件为 Playwright 脚本
npx playwright-chrome-recorder <录制文件路径.json>
```

GitHub: [playwright-chrome-recorder](https://github.com/AndrewUsher/playwright-chrome-recorder)

### 使用 Chrome 录制功能

#### 步骤 1：打开 Chrome DevTools

- 按 `F12` 或右键选择"检查"
- 切换到 **Recorder** 面板（如果没有，点击 `...` > `More tools` > `Recorder`）

#### 步骤 2：录制操作

1. 点击 "Create a new recording"
2. 输入录制名称，点击 "Start recording"
3. 在页面上执行操作（点击、输入、导航等）
4. 完成后点击 "End recording"

#### 步骤 3：导出为 Playwright 脚本

1. 点击导出按钮（下载图标）
2. 选择 **"Export as a Playwright Test"**
3. 保存 `.spec.ts` 文件

### 将 Playwright 脚本转换为 Midscene 脚本

#### 原始 Playwright 录制脚本示例

```typescript
await page.goto('https://todomvc.com/examples/react/dist/');
await page.getByPlaceholder('What needs to be done?').click();
await page.getByPlaceholder('What needs to be done?').fill('Learn JS');
await page.getByPlaceholder('What needs to be done?').press('Enter');
await page.locator('li').filter({ hasText: 'Learn JS' }).getByRole('checkbox').click();
```

#### 转换为 Midscene 脚本

```typescript
import { expect } from '@playwright/test';
import { test } from './fixture';  // 使用 Midscene fixture

test.beforeEach(async ({ page }) => {
  await page.goto('https://todomvc.com/examples/react/dist/');
});

test('我的测试', async ({ ai, aiQuery, aiAssert }) => {
  // 用自然语言描述操作
  await ai("在任务输入框中输入 'Learn JS' 然后按回车");
  await ai("点击 'Learn JS' 任务左边的勾选框");
});
```

#### 转换规则对照表

| Playwright 原始代码 | Midscene 自然语言 |
|-------------------|------------------|
| `page.click('.button')` | `await ai("点击按钮")` |
| `page.fill('input', 'text')` | `await ai("在输入框中输入 'text'")` |
| `page.press('Enter')` | `await ai("按回车键")` |
| `page.locator().check()` | `await aiTap("勾选框")` |
| `expect(...)` | `await aiAssert("验证条件")` |

### 完整转换流程

1. 安装 Chrome 101+ 版本
2. 安装 **Playwright Chrome Recorder** 扩展
3. 打开 DevTools (F12) → Recorder 面板
4. 录制操作 → 点击导出 → 选择 **Playwright** 格式
5. 将生成的脚本转换为 Midscene 自然语言脚本
6. 创建 `fixture.ts` 文件（参考第 4 节）
7. 配置 `.env` 文件（参考第 2 节）
8. 运行测试验证

---

## 9. Chrome 扩展 Playground

Midscene 官方提供了 Chrome 扩展，可以在任意网页上快速测试和调试自然语言命令。

### 安装扩展

| 项目 | 信息 |
|------|------|
| 名称 | Midscene.js |
| 链接 | [Chrome Web Store](https://chromewebstore.google.com/detail/midscenejs/gbldofcpkknbggpkmbdaefngejllnief) |
| 功能 | 在任意网页上执行 AI 自动化操作 |
| 特点 | 零代码调试、实时验证命令 |

### 扩展配置方式

1. 点击 Midscene 扩展图标
2. 进入设置/配置页面
3. 输入环境变量（支持 `KEY=value` 或 `export KEY="value"` 格式）

### 各模型配置示例

#### Gemini（使用第三方代理）

```
MIDSCENE_MODEL_NAME=gemini-3-flash-preview-thinking
MIDSCENE_MODEL_FAMILY=gemini
OPENAI_API_KEY=your-api-key
OPENAI_BASE_URL=https://your-proxy-endpoint/v1
```

#### Gemini（官方 API）

```
MIDSCENE_MODEL_NAME=gemini-3-flash-preview
MIDSCENE_MODEL_FAMILY=gemini
MIDSCENE_MODEL_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/
MIDSCENE_MODEL_API_KEY=your-google-api-key
```

#### Qwen3-VL（通义千问）

```
MIDSCENE_MODEL_NAME=qwen3-vl-plus
MIDSCENE_MODEL_FAMILY=qwen3-vl
OPENAI_API_KEY=your-dashscope-key
OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
```

#### Claude

```
MIDSCENE_USE_ANTHROPIC_SDK=1
MIDSCENE_MODEL_NAME=claude-sonnet-4-5-20250514
ANTHROPIC_API_KEY=sk-ant-xxxxx
```

### 常见错误排查

| 错误信息 | 原因 | 解决方案 |
|---------|------|---------|
| `modelFamily cannot be undefined when includeBbox is true` | 缺少 MODEL_FAMILY 配置 | 添加对应的 `MIDSCENE_MODEL_FAMILY` |
| `Invalid API Key` | API 密钥错误 | 检查 `OPENAI_API_KEY` 或 `MIDSCENE_MODEL_API_KEY` |
| `Invalid URL` | API 地址错误 | 检查 `OPENAI_BASE_URL` 格式 |

### 使用流程

1. 安装并配置 Chrome 扩展
2. 打开目标网页
3. 点击扩展图标，选择操作类型（Act/Query/Assert）
4. 输入自然语言命令测试
5. 测试通过后，复制命令到代码中

---

## 10. 快速编写脚本最佳实践

### 方案对比

| 方案 | 适用场景 | 优势 |
|------|---------|------|
| Chrome 扩展 Playground | 快速验证命令 | 零代码、实时调试 |
| YAML 脚本 | 简单自动化任务 | 专注逻辑、无需框架知识 |
| Playwright + TypeScript | 复杂测试场景 | 灵活、可编程 |
| 可视化报告 Playground | 调试失败用例 | 回放动画、查看 AI 思考过程 |

### 提示词编写技巧

提高脚本稳定性的关键是**提示词质量**：

| 差的提示词 | 好的提示词 |
|-----------|-----------|
| `点击按钮` | `点击页面右上角蓝色的"登录"按钮` |
| `输入内容` | `在带有"请输入用户名"占位符的输入框中输入 'admin'` |
| `验证结果` | `验证页面顶部显示"欢迎回来, admin"的提示信息` |

**技巧**：
- 描述元素位置（上/下/左/右）
- 描述元素特征（颜色、文字、图标）
- 提供具体的预期值

### 启用缓存加速开发

```bash
# 命令行方式
MIDSCENE_CACHE=1 pnpm run e2e
```

YAML 脚本配置：

```yaml
agent:
  cache:
    strategy: 'read-write'
    id: my-test-cache
```

### 可视化报告调试

运行测试后，Midscene 会生成可视化报告：

```bash
pnpm run e2e
# 报告位置：midscene_run/report/*.html
```

报告功能：
- **动画回放** - 查看每一步操作
- **AI 思考过程** - 了解 AI 如何理解指令
- **内置 Playground** - 在报告中重新运行和调试 Prompt

### 推荐工作流

```
1. Chrome 扩展测试命令 → 2. 复制到 YAML/代码 → 3. 运行并查看报告 → 4. 在报告 Playground 调试
```

---

## 快速开始

```bash
# 1. 安装依赖
cd playwright-testing-demo && pnpm install

# 2. 配置 .env 文件

# 3. 启动 Playground UI
pnpm run e2e:ui
```

## 参考链接

- [Midscene 官方文档](https://midscenejs.com/)
- [API 文档](https://midscenejs.com/api.html)
- [模型配置](https://midscenejs.com/model-strategy.html)
