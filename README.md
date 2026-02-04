<p align="center">
  <img src = "images/ic_app_logo.png" alt="ic_app_logo" width="128" height="128">
</p>

<h1 align="center"快手火崽崽辅助器</h1>

<p align="center">
  <strong>🎨 一个基于AutoJs Pro, 使用犀牛（Rhino）引擎, Js + xml + 无障碍权限 实现 的 快手火崽崽辅助器</strong>
</p>

<p align="center">
  <strong>主ui使用 Google Material Design3 的 Android 原生ui界面</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Auto.js%20Pro-9.3.11-blue?style=flat-square" alt="Auto.js Pro Version">
  <img src="https://img.shields.io/badge/Material%20Design-3-green?style=flat-square" alt="Material Design 3">
  <img src="https://img.shields.io/badge/Android-7.0+-brightgreen?style=flat-square" alt="Android Version">
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square" alt="License">
</p>

---

## 📱 预览截图

<p align="center">
  <img src="images/Main_ui.jpg" width="180" alt="主页">
  <img src="images/Main_test.jpg" width="180" alt="测试算法">
  <img src="images/Effect_show.jpg" width="180" alt="效果展示">
  <img src="images/Effect_show2.jpg" width="180" alt="效果展示2">
</p>

---

## ✨ 核心特性

### 🚀 超高性能算法引擎
- **毫秒级识别**：荆棘障碍识别平均耗时≤1ms，前500米零误差识别
- **智能状态机**：基于RGB颜色特征的像素扫描算法，抗干扰能力强
- **多线程优化**：图像识别与轨迹绘制并行处理，杜绝主线程阻塞
- **资源自动回收**：Bitmap/Mat资源智能释放，无内存泄漏风险

### 🎯 全分辨率自适应适配
- **基准适配体系**：以720×1600为基准，`sd.x()`/`sd.y()`动态比例转换
- **全场景兼容**：自动适配全面屏/非全面屏/折叠屏，处理导航栏/状态栏遮挡
- **边界智能检测**：识别区域自动规避屏幕边缘，提升识别准确性

### 🎨 全息科技风可视化
- **MD3设计语言**：科技蓝为主色调，搭配霓虹边框/渐变面板，质感拉满
- **实时数据面板**：跳跃距离、速度、长按时间、荆棘组数等核心数据实时展示
- **悬浮窗交互**：`floaty.rawWindow`实现非侵入式悬浮窗，不遮挡游戏画面
- **粒子轨迹绘制**：能量波外层+激光虚线内层+顶点高亮，视觉辨识度高

### 🔧 智能化自动化控制
- **状态机启停**：通过`cycleRun.state`（0=停止/1=运行）灵活控制循环
- **异常自动恢复**：智能检测复活按钮，自动点击恢复游戏，支持无人值守
- **容错机制完善**：截图失败/权限缺失/识别异常等场景均有兜底处理
- **轻量化设计**：无多余依赖，脚本启动速度快，占用资源少

---

## 🏗️ 项目结构
ks-hzzfzq/
├── main.js                 # 脚本主入口文件
├── project.json            # Auto.js Pro项目配置
├── images/                 # 资源文件目录
│   ├── ic_app_logo.png     # 应用图标
│   ├── WeiXin-qrcode.png   # 微信赞赏码
│   ├── Alipay-qrcode.jpg   # 支付宝赞赏码
│   └── screenshots/        # 截图资源（可选）
├── js/
│   └── script.js           # 核心算法实现脚本
├── res/layout/             # UI布局文件目录
│   ├── activity_main.xml   # 主界面布局
│   └── float_window_layout.xml # 悬浮窗布局
├── ui/                     # 界面逻辑处理
│   ├── uiInit.js           # UI初始化
│   ├── uiOn.js             # 主界面事件绑定
│   └── windowOn.js         # 悬浮窗事件绑定
├── module/                 # 功能模块封装
│   ├── ScreenAuthModule.js # 截图/无障碍权限管理
│   └── getListSimilarity.js # 超多维相似度计算
└── temp/                   # 临时文件目录（自动生成）


---

## ⚡ 快速开始

### 环境要求
| 依赖项 | 版本要求 |
|--------|----------|
| Android 系统 | 7.0+ (API 24+) |
| Auto.js Pro | 9.3.11+（推荐最新版） |
| 必要权限 | 悬浮窗权限 + 截图权限 + 无障碍权限 |

### 安装步骤
1. **下载项目**：克隆本仓库或直接下载ZIP包解压
2. **导入工具**：打开Auto.js Pro，通过「导入项目」功能选择解压后的文件夹
3. **授权权限**：按照APP提示，授予悬浮窗、截图、无障碍三项核心权限
4. **启动游戏**：打开快手APP，进入「火崽崽」游戏界面并保持前台运行
5. **运行脚本**：在Auto.js Pro中找到导入的项目，点击「运行」即可启动辅助

### 基础使用示例
```javascript
// 1. 单次执行辅助（测试用）
run();

// 2. 启动循环执行（自动连续游戏）
cycleRun.state = 1; // 设置状态为运行
cycleRun();

// 3. 停止循环执行（手动停止）
cycleRun.state = 0; // 设置状态为停止

// 玩家相关比例配置
let playersXPps = 154.5 / 720;        // 玩家中心X轴占比
let playersWidthPps = 143 / 720;       // 玩家宽度占比

// 荆棘相关比例配置
let thornsCenterYPps = 1000 / 1600;    // 荆棘中心Y轴占比
let thornsWidthPps = 87 / 720;         // 荆棘宽度占比

函数名	功能描述	参数说明	返回值
荆棘障碍识别核心算法	: 游戏截图Image对象	荆棘数据数组（含坐标信息）
全息科技风轨迹绘制	: 底图，: 荆棘数据，: {clear: Boolean}	绘制完成的Image对象
计算跳跃目标X坐标	: 荆棘识别数据数组	目标X坐标（Number）
执行自动跳跃操作	: 跳跃目标X坐标	无
主循环控制函数	无	无（通过控制）
获取状态栏/导航栏信息	无	{statusBarHeight, navBarHeight, hasNavBar}

