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

✨ 特性亮点

🚀 超高性能

· 毫秒级识别：荆棘障碍识别 ≤1ms，前10000米零误差
· 智能状态机：基于RGB颜色特征的像素扫描算法
· 多线程优化：识别与绘制并行，杜绝主线程阻塞
· 资源自动回收：智能内存管理，无泄漏风险

🎯 精准识别

· 全分辨率自适应：720×1600基准比例转换系统
· 智能边界检测：自动规避屏幕边缘干扰
· 动态参数调整：支持多设备分辨率自适应
· 实时纠错：识别失败自动切换参数重试

🎨 专业可视化

· Material Design 3：现代化UI设计语言
· 科技风绘制系统：霓虹边框+渐变面板+粒子轨迹
· 实时数据面板：跳跃参数、速度、风险等级实时展示
· 悬浮窗控制：非侵入式悬浮控制面板

📸 应用截图

<p align="center">
  <img src="images/Main_ui.jpg" width="180" alt="主界面">
  <img src="images/Main_test.jpg" width="180" alt="算法测试">
  <img src="images/Effect_show.jpg" width="180" alt="效果展示">
  <img src="images/Effect_show2.jpg" width="180" alt="效果展示2">
</p>

🏗️ 项目结构

```
ks-hzzfzq/
├── main.js                 # 主入口文件
├── project.json           # 项目配置
├── images/                # 资源文件
│   ├── ic_app_logo.png    # 应用图标
│   ├── WeiXin-qrcode.png  # 微信赞赏码
│   └── Alipay-qrcode.jpg  # 支付宝赞赏码
├── js/
│   └── script.js          # 核心算法脚本
├── res/layout/            # UI布局文件
│   ├── activity_main.xml  # 主界面布局
│   └── float_window_layout.xml # 悬浮窗布局
├── ui/                    # 界面逻辑
│   ├── uiInit.js          # UI初始化
│   ├── uiOn.js            # 主界面事件绑定
│   └── windowOn.js        # 悬浮窗事件绑定
├── module/                # 功能模块
│   ├── ScreenAuthModule.js # 权限管理
│   └── MaterialDesignDialog.js # 对话框模块
└── temp/                  # 临时文件（自动生成）
```

⚡ 快速开始

环境要求

· Android 系统：7.0+ (API 24+)
· Auto.js Pro：9.3.11+（推荐最新版）
· 必要权限：悬浮窗权限、截图权限、无障碍权限

安装步骤

1. 下载项目：克隆本仓库或下载ZIP包
2. 导入工具：打开Auto.js Pro → 导入项目 → 选择文件夹
3. 授权权限：授予悬浮窗、截图、无障碍权限
4. 启动游戏：打开快手APP → 进入「火崽崽」游戏界面
5. 运行脚本：在Auto.js Pro中运行项目

🔧 核心功能

🎯 图像识别算法

```javascript
// 荆棘识别核心算法
function getThornsData(img) {
    // 状态机像素扫描
    // 基于RGB颜色特征检测
    // 智能分组与合并
}
```

🎨 可视化绘制系统

```javascript
// 全息科技风绘制
function drawImg(img, data, options) {
    // 多层绘制系统
    // 科技网格背景
    // 动态数据面板
}
```

⚡ 自动跳跃控制

```javascript
// 智能跳跃计算
function jumpToX(endX) {
    // 抛物线轨迹计算
    // 自动按压时长控制
    // 多线程执行
}
```

📊 核心参数

识别参数
参数 默认值 说明
playersXPps 154.5/720 玩家中心X轴比例
thornsCenterYPps 1000/1600 荆棘中心Y轴比例
thornsWidthPps 87/720 荆棘宽度比例
waitTime 134ms 循环等待时间

性能参数
参数 值 说明
识别速度 ≤1ms 单帧识别时间
内存占用 <50MB 运行时内存
兼容性 Android 7.0+ 系统支持

🔬 技术架构

算法原理

```
状态机识别流程：
像素扫描 → 颜色特征检测 → 状态判断 → 分组合并 → 数据输出

抛物线计算：
起点坐标 → 顶点计算 → 落点确定 → 按压时长 → 执行跳跃
```

多线程架构

```
主线程：UI交互 + 状态管理
识别线程：图像处理 + 算法计算
绘制线程：可视化渲染 + 效果展示
控制线程：自动跳跃 + 复活检测
```

🛡️ 错误处理

容错机制

· 图像有效性验证：多重校验防止崩溃
· 资源安全回收：智能内存管理
· 异常自动恢复：识别失败自动重试
· 边界安全检查：坐标合法性验证

权限管理

· 自动权限申请：截图/无障碍权限自动获取
· 权限状态检测：实时监控权限状态
· 用户引导：清晰的权限申请指引

📖 使用指南

基本使用

1. 启动脚本：运行main.js
2. 参数配置：在主界面调整识别参数
3. 开始辅助：点击悬浮窗的"循环执行"
4. 监控状态：观察绘制效果和数据面板

高级配置

· 分辨率适配：修改基准分辨率参数
· 识别精度：调整颜色阈值和扫描步长
· 视觉效果：自定义绘制样式和颜色

## 🔬 算法原理详解

### 荆棘识别状态机
~~~
状态0（等待开始）→ 检测到颜色特征 → 状态1（识别中）

状态1（识别中）→ 连续空像素≥阈值 → 状态0（分组完成）
~~~

### 抛物线轨迹计算
~~~
基于二次函数公式：y = a(x - centerX)² + topY

其中：a = (endY - topY) / (dx/2)²

实现真实的物理跳跃轨迹模拟
~~~


### 分数识别优化
~~~
采用区域采样而非全图扫描，在scoreCenterXPps指定区域内

通过红色通道≤100的特征识别分数像素，采用动态步长提升效率
~~~


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

也可以给我们赞赏a, 谢谢
<p align="center">
  <img src = "images/WeiXin-qrcode.png" alt="WeiXin-qrcode" width = "360" height = "360">
  <img src = "images/Alipay-qrcode.jpg" alt="Alipay-qrcode" width = "270" height = "405">
</p>


<p align="center">
  <strong>温馨提示：本工具仅供学习交流使用，请遵守相关法律法规和平台规则。</strong>
</p>

---


