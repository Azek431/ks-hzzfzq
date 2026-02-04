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

### 🚀 高性能算法
- **超快识别速度**：荆棘障碍识别平均仅需1ms
- **100%准确率**：前500米测试零误差
- **智能跳跃计算**：精准计算落地时长，平均0ms误差

### 🎯 全分辨率适配
- **自适应屏幕**：基于720×1600基准的全分辨率适配
- **智能布局**：自动调整绘制位置，避免遮挡游戏元素
- **设备兼容**：支持所有Android 7.0+设备

### 🎨 专业可视化
- **实时绘制**：荆棘识别框、抛物线轨迹、数据面板
- **科技风界面**：Material Design 3原生UI设计
- **悬浮窗显示**：不遮挡游戏画面的实时信息展示

### 🔧 智能功能
- **自动复活**：智能检测并点击复活按钮
- **循环执行**：无人值守的全自动游戏辅助
- **参数配置**：可调节的等待时间和识别参数

## 🏗️ 项目结构

ks-hzzfzq/

├── main.js                 # 主入口文件

├── project.json            # 项目配置

├── images/                 # 资源文件

│   ├── ic_app_logo.png

│   └── screenshots/

├── js/

│   └── script.js           # 核心算法脚本

├── res/layout/             # UI布局文件

│   ├── activity_main.xml

│   └── float_window_layout.xml

├── ui/                     # 界面逻辑

│   ├── uiInit.js

│   ├── uiOn.js

│   └── windowOn.js

├── module/                 # 功能模块

│   ├── ScreenAuthModule.js

│   └── getListSimilarity.js

└── temp/                   # 临时文件



## ⚡ 快速开始

### 环境要求
- **Android版本**：7.0+ (API 24+)
- **Auto.js Pro**：9.3.11+ (推荐最新版)
- **必要权限**：悬浮窗、截图、无障碍权限

### 安装步骤
1. **下载项目**：克隆或下载项目到本地
2. **导入Auto.js Pro**：将项目导入Auto.js Pro应用
3. **授权权限**：确保授予所有必要权限
4. **启动游戏**：打开快手APP并进入火崽崽游戏
5. **运行脚本**：在Auto.js Pro中运行主脚本

### 基本使用
javascript
// 单次执行测试

run();

// 启动循环执行

cycleRun.state = 1;

cycleRun();

// 停止循环

cycleRun.state = 0;


## 🔧 核心配置

### 屏幕适配参数
javascript

// 玩家相关比例（基准720×1600）

let playersXPps = 154.5 / 720;        // 玩家中心X占比

let playersWidthPps = 143 / 720;     // 人物宽度占比

// 荆棘相关比例

let thornsCenterYPps = 1000 / 1600;  // 荆棘中心Y占比

let thornsWidthPps = 87 / 720;       // 荆棘宽度占比



### 主要函数说明

| 函数 | 功能描述 | 参数说明 |
|------|----------|----------|
| `getThornsData(img)` | 荆棘识别核心算法 | `img`: 游戏截图 |
| `drawImg(img, data, options)` | 全息科技风绘制 | `data`: 识别数据，`options`: 配置选项 |
| `ckltEndX(thornData)` | 计算跳跃目标坐标 | `thornData`: 荆棘数据数组 |
| `jumpToX(endX)` | 执行自动跳跃 | `endX`: 目标X坐标 |
| `cycleRun()` | 主循环执行函数 | 无参数 |

## 🎮 功能详解

### 荆棘识别算法
- **像素级分析**：基于RGB颜色值的精确识别
- **状态机解析**：智能分组连续荆棘像素
- **边界校验**：自动处理屏幕边缘情况

### 轨迹绘制系统
- **抛物线计算**：真实的物理轨迹模拟
- **多层绘制**：能量波+激光虚线双轨迹
- **实时数据**：跳跃距离、速度、风险评估

### 智能控制系统
- **循环管理**：可随时启停的循环执行
- **异常处理**：完善的错误捕获和恢复机制
- **资源管理**：自动释放内存，避免泄漏

## 🛠️ 高级配置

### 自定义参数调整

javascript
// 科技感等级设置

const TECH_LEVEL = 3;  // 1-基础, 2-增强, 3-终极


### 性能优化建议
1. **适当调整识别区域**：根据设备性能调整扫描步长
2. **合理设置等待时间**：平衡速度与稳定性
3. **定期清理缓存**：避免临时文件积累影响性能

## 📊 技术架构

### 核心算法
- **图像处理**：基于OpenCV的实时图像分析
- **物理模拟**：真实的抛物线轨迹计算
- **状态管理**：完善的状态机控制流程

### 界面系统
- **Material Design 3**：现代化的UI设计
- **响应式布局**：自适应不同屏幕尺寸
- **实时交互**：流畅的用户操作体验

### 性能优化
- **内存管理**：智能的资源分配和释放
- **多线程处理**：并行执行识别和绘制任务
- **算法优化**：高效的像素扫描和数据处理

## 🐛 故障排除

### 常见问题
1. **截图权限问题**：检查Auto.js Pro的截图权限设置
2. **识别不准确**：调整荆棘识别参数或清理屏幕
3. **性能问题**：关闭其他应用，释放系统资源

### 调试方法
javascript

// 启用详细日志

$debug.setMemoryLeakDetectionEnabled(true);

// 单步测试功能

run();  // 单次执行测试算法



## 🤝 参与贡献

我们欢迎各种形式的贡献！包括但不限于：
- 🐛 问题报告
- 💡 功能建议
- 🔧 代码提交
- 📖 文档改进

### 贡献指南
1. Fork本项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

## 📄 许可证

本项目采用 GPL-3.0 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

### 许可说明
- ✅ 允许商业使用
- ✅ 允许修改和分发
- ✅ 允许私人使用
- ⚠️ 需保留版权声明

## 👥 开发团队
- **作者**：Azek
- **邮箱**：Azek431@163.com
- **QQ**：2982154038
- **Telegram频道**：@AzekMain
- **QQ交流群**：130330601

## 🙏 致谢

感谢以下项目的支持和启发：
- [hyb1996/Auto.js](https://github.com/hyb1996/Auto.js) - 优秀的自动化脚本平台
- Material Design团队 - 提供现代化的UI设计规范
- 开源社区 - 持续的技术支持和贡献

---

<p align="center">
  如果这个项目对你有帮助，请给一个 ⭐ Star 支持一下！
</p>

也可以给我们赞赏a
<p align="center">
  <img src = "images/WeiXin-qrcode.png" alt="WeiXin-qrcode" width = "360" height = "360">
  <img src = "images/Alipay-qrcode.jpg" alt="Alipay-qrcode" width = "270" height = "405">
</p>


<p align="center">
  <strong>温馨提示：本工具仅供学习交流使用，请遵守相关法律法规和平台规则。</strong>
</p>

---


