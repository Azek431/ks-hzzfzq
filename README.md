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
- **毫秒级识别**：荆棘障碍识别平均耗时≤1ms，前10000米零误差识别
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
```text
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

```
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

## 主要函数说明

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

```javascript
// 科技感等级设置

const TECH_LEVEL = 3;  // 1-基础, 2-增强, 3-终极

```

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
```javascript

// 启用详细日志

$debug.setMemoryLeakDetectionEnabled(true);

// 单步测试功能

run();  // 单次执行测试算法

```

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

## 👥 作者
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


