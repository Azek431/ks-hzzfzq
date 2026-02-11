<p align="center">
  <img src = "images/ic_app_logo.png" alt="ic_app_logo" width="128" height="128">
</p>

<h1 align="center">快手火崽崽辅助器</h1>

<p align="center">
  <strong>🎨 一个基于AutoJs Pro，使用犀牛（Rhino）引擎，Js + xml + 无障碍权限实现的快手火崽崽辅助器</strong>
</p>

<p align="center">
  <strong>主ui使用 Google Material Design3 的 Android 原生ui界面</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Auto.js%20Pro-9.3.11-blue?style=flat-square" alt="Auto.js Pro Version">
  <img src="https://img.shields.io/badge/Material%20Design-3-green?style=flat-square" alt="Material Design 3">
  <img src="https://img.shields.io/badge/Android-7.0+-brightgreen?style=flat-square" alt="Android Version">
  <img src="https://img.shields.io/badge/License-GPL-yellow?style=flat-square" alt="License">
</p>

---

## 📖 项目技术文档

### ✨ 核心特性亮点

#### 🚀 超高性能引擎

· 毫秒级识别：荆棘障碍识别 ≤1ms，前10000米零误差
· 智能状态机：基于RGB颜色特征的像素扫描算法
· 多线程架构：识别、绘制、控制三线程分离，杜绝主线程阻塞
· 智能资源管理：图像实时回收，内存占用<50MB，零泄漏风险

#### 🎯 精准识别系统

· 全分辨率自适应：720×1600基准比例转换系统，支持多设备
· 动态参数调整：实时纠错，识别失败自动切换参数重试
· 智能边界检测：自动规避屏幕边缘和状态栏干扰
· 复活检测机制：自动检测并点击复活按钮，提升稳定性

#### 🎨 专业可视化系统

· Material Design 3：现代化Android原生UI设计
· 全息科技风绘制：霓虹边框、渐变面板、粒子轨迹、动态网格
· 实时数据面板：跳跃参数、速度曲线、风险评估实时展示
· 非侵入式控制：悬浮窗控制面板，不影响游戏操作

---

## 🏗️ 项目架构详解

### 文件结构

```
快手火崽崽辅助器/
├── main.js                  # 主入口，UI初始化和全局管理
├── project.json            # 项目配置和权限声明
├── images/                 # 应用图标和截图资源
│   ├── ic_app_logo.png     # 应用图标(128×128)
│   ├── Main_ui.jpg         # 主界面截图
│   └── Effect_show*.jpg    # 效果展示截图
├── js/                     # 核心算法模块
│   └── script.js           # 游戏识别、绘制、控制核心逻辑
├── ui/                     # 界面管理模块
│   ├── uiInit.js           # Material Design 3界面初始化
│   ├── uiOn.js             # 主界面事件绑定和交互逻辑
│   ├── logsUi.js           # 实时日志查看器
│   └── windowOn.js         # 悬浮窗事件处理
├── res/layout/             # XML界面布局
│   ├── activity_main.xml   # 主活动布局
│   └── float_window_layout.xml # 悬浮窗布局
├── module/                 # 功能模块库
│   ├── ScreenAuthModule.js # 自动截图权限获取(云大佬贡献)
│   └── MaterialDesignDialog.js # 自定义对话框组件
├── initClass.js           # Java类库初始化
├── Event.js              # 全局事件监听器
└── temp/                 # 运行时临时文件(自动生成)
```

### 🔧 技术栈

· 运行环境：Auto.js Pro 9.3.11+，Rhino JavaScript引擎
· UI框架：Android原生Material Design 3
· 图像处理：OpenCV for Android
· 屏幕适配：720×1600基准比例转换系统
· 权限管理：自动获取截图、无障碍、悬浮窗权限

---

## ⚡ 快速开始指南

### 环境要求

· Android系统：7.0+ (API 24+)
· Auto.js Pro：9.3.11+（必须Pro版）
· 必要权限：悬浮窗权限、无障碍权限、截图权限（自动获取）

### 安装步骤

1. 下载项目：从GitHub克隆或下载ZIP包
2. 导入项目：Auto.js Pro → 导入 → 选择项目文件夹
3. 授权权限：按提示授予悬浮窗和无障碍权限
4. 启动游戏：打开快手APP → 进入「火崽崽」游戏
5. 运行脚本：点击悬浮窗"循环执行"开始辅助

---

## 🔬 核心功能详解

### 🎯 图像识别算法体系

#### 荆棘识别核心算法

```javascript
/**
 * 基于状态机的像素扫描算法
 * 算法流程：像素扫描 → 颜色特征检测 → 状态判断 → 分组合并
 * 时间复杂度：O(n)，单帧识别≤1ms
 */
function getThornsData(img, options) {
    // 1. 边界校验：图像有效性验证
    // 2. 坐标计算：基于playersXPps和thornsCenterYPps
    // 3. 状态机扫描：0=等待开始，1=识别中
    // 4. 容错处理：自动切换参数重试
    // 返回值：{startX，startY，endX，endY}数组
}
```

#### 分数识别优化算法

```javascript
/**
 * 区域采样优化算法
 * 仅在scoreCenterXPps指定区域内扫描
 * 动态步长：根据连续像素情况调整扫描密度
 */
function getScorePoints(img) {
    // 仅扫描分数显示区域(212×40像素)
    // 红色通道≤100判定为分数像素
    // 动态步长提升扫描效率
}
```

## 🎨 可视化绘制系统

### 多层绘制架构

```javascript
/**
 * 全息科技风绘制引擎
 * 支持三种科技等级：基础、增强、全效果
 */
function drawImg(img, data, options) {
    // 第一层：科技网格背景(TECH_LEVEL≥2)
    // 第二层：荆棘组边框+数据面板
    // 第三层：抛物线轨迹+关键节点
    // 第四层：动态效果(粒子、脉冲、热力图)
}
```

### 实时数据面板

· 荆棘组信息：尺寸、坐标、面积、对角线
· 跳跃参数：距离、时长、速度、顶点高度
· 风险评估：基于距离和曲率的智能评估
· 性能统计：识别用时、绘制用时、内存占用

## ⚡ 自动控制逻辑

### 智能跳跃计算

```javascript
/**
 * 基于物理的抛物线跳跃算法
 * 二次函数公式：y = a(x - centerX)² + topY
 */
function ckltEndX(thornData) {
    // 空白区域判断：无荆棘时跳跃到安全区域
    // 间隙评估：判断能否跳过当前荆棘组
    // 落点计算：考虑玩家宽度和安全边界
}
```

### 循环执行引擎

```javascript
/**
 * 主控制循环 - 四阶段架构
 */
function cycleRun() {
    // 第一阶段：截图捕获+数据分析
    // 第二阶段：复活检测+自动点击
    // 第三阶段：跳跃计算+执行按压
    // 第四阶段：效果绘制+状态等待
}
```

---

## 📊 核心参数配置

### 识别参数体系

参数 默认值 说明 影响范围
playersXPps 154.5/720 玩家中心X轴比例 扫描起始位置
thornsCenterYPps 1000/1600 荆棘中心Y轴比例 识别准确性
thornsWidthPps 87/720 荆棘宽度比例 分组判断
playersWidthPps 143/720 玩家宽度比例 跳跃计算
waitTime 134ms 循环等待时间 执行速度

### 性能参数

参数 基准值 说明
识别速度 ≤1ms 单帧荆棘识别时间
绘制速度 5-15ms 科技效果渲染时间
内存占用 <50MB 运行时峰值内存
兼容性 Android 7.0+ 系统版本支持
分辨率 720×1600 基准适配分辨率

### 可视化参数

参数 可选值 说明
imgShowScale 0.01-1.00 图片展示缩放比例
techLevel 1-3 科技效果等级
ThemeColor 30种预设 主题配色方案

---

## 🔬 技术架构深度解析

### 多线程架构设计

```
┌─────────────────────────────────────────────┐
│             主线程(UI Thread)                │
│  • UI事件处理  • 状态管理  • 用户交互        │
└───────────────┬─────────────────────────────┘
                │ 消息传递
┌───────────────▼─────────────────────────────┐
│           识别线程(Detection Thread)         │
│  • 图像捕获  • 荆棘识别  • 分数统计         │
└───────────────┬─────────────────────────────┘
                │ 数据传递
┌───────────────▼─────────────────────────────┐
│           绘制线程(Render Thread)            │
│  • 科技效果  • 数据面板  • 轨迹可视化        │
└───────────────┬─────────────────────────────┘
                │ 控制信号
┌───────────────▼─────────────────────────────┐
│           控制线程(Control Thread)           │
│  • 自动跳跃  • 复活检测  • 长按执行          │
└─────────────────────────────────────────────┘
```

### 状态机识别原理

```
荆棘识别状态机：
状态0(等待开始)
   ↓ 检测到颜色特征(r≤155且g+b≥400)
状态1(识别中)
   ↓ 连续空像素≥阈值(间隙阈值/2)
状态0(分组完成)
   ↓ 输出荆棘组数据

复活检测状态机：
状态0(正常游戏)
   ↓ 连续3次无荆棘数据
状态1(检测复活)
   ↓ 查找复活按钮文本
状态2(执行复活)
   ↓ 点击按钮→等待动画
状态0(恢复正常)
```

### 抛物线物理模型

```
基于二次函数的轨迹计算：
y = a(x - centerX)² + topY

其中：
  • a = (endY - topY) / (dx/2)²
  • centerX = (startX + endX) / 2
  • topY = startY - max(dx/6，endX/400)
  • dx = endX - startX

按压时长计算：
pressTime = (endX比例 - playersXPps) × 800
范围限制：0ms ≤ pressTime ≤ 1000ms
```

---

## 🛡️ 容错与安全机制

### 异常处理体系

```javascript
// 1. 图像有效性多层校验
function isImageValid(img) {
    // 回收状态检查 → 方法存在性 → 尺寸合理性 → 像素访问测试
}

// 2. 资源安全回收链
try {
    let img = captureScreen();
    // 业务逻辑...
} finally {
    if (img && img.recycle) img.recycle();
}

// 3. 边界安全防护
function validateCoordinates(x, y, width, height) {
    // 坐标范围检查 → 类型验证 → 数值合理性
}
```

### 权限管理策略

· 自动权限获取：截图权限自动申请和配置
· 权限状态监控：实时检测权限有效性
· 优雅降级：权限缺失时友好提示
· 用户引导：清晰的权限申请指引

---

## 📖 使用与配置指南

### 基础使用流程

1. 启动脚本：运行main.js，授予必要权限
2. 参数校准：根据设备调整thornsCenterYPps
3. 开始辅助：点击悬浮窗"循环执行"
4. 状态监控：观察绘制效果和数据面板
5. 性能调优：根据需求调整waitTime和techLevel

### 高级配置选项

#### 分辨率适配

```javascript
// 自定义设备分辨率适配
const CUSTOM_WIDTH = 1080;
const CUSTOM_HEIGHT = 2400;

// 修改比例计算
sd.x = function(x, w, dw = CUSTOM_WIDTH) {
    return x * (dw / w);
}
```

#### 识别精度调优

```javascript
// 调整颜色阈值(script.js第206行附近)
const COLOR_THRESHOLD = 155;    // 红色通道阈值
const SUM_THRESHOLD = 400;      // 绿蓝通道和阈值

// 调整扫描步长(script.js第227行)
let step = 1;                   // 基础步长
step = 4;                       // 识别到荆棘时的步长
```

#### 视觉效果定制

```javascript
// 修改科技等级(script.js第385行)
const TECH_LEVEL = 3; // 1=基础，2=增强，3=全效果

// 自定义颜色方案(uiOn.js第533行)
var Color = [
    {color: "#7B90D2", name: "红碧"},
    {color: "#00FFCC", name: "深水池"},
    // 添加自定义颜色...
];
```

### 故障排除

#### 常见问题及解决方案

1. 绘制偏移：调整thornsCenterYPps参数，使用长按设置精确坐标
2. 识别失败：检查底部导航栏设置，开启状态栏偏移
3. 内存过高：确保Auto.js Pro版本≥9.3.11，重启脚本
4. 速度过慢：调整waitTime参数，关闭高等级科技效果
5. 权限问题：手动授予悬浮窗和无障碍权限

#### 设备特定配置

设备类型 推荐配置 备注
红手指云手机 thornsCenterYPps=0.65，关闭状态栏偏移 云手机特殊适配
高分辨率设备 自定义分辨率参数 保持720×1600比例
带导航栏设备 开启底部导航栏选项 防止识别偏移

---

## 🤝 参与贡献

### 我们欢迎各种形式的贡献！包括但不限于：

· 🐛 问题报告
· 💡 功能建议
· 🔧 代码提交
· 📖 文档改进

### 贡献指南

1. Fork本项目
2. 创建功能分支 (git checkout -b feature/AmazingFeature)
3. 提交更改 (git commit -m 'Add some AmazingFeature')
4. 推送到分支 (git push origin feature/AmazingFeature)
5. 开启Pull Request

---

## 📄 许可证与声明

### 开源协议

- 许可证：GPL-3.0
- 商业使用：允许
- 修改分发：允许，需保留版权声明
- 版权声明：© Azek. 保留所有权利

### 免责声明

本工具仅供学习和研究目的使用，使用者应遵守：

1. 相关法律法规和平台规则
2. 不得用于商业盈利目的
3. 不得损害游戏公平性
4. 自行承担使用风险

## 👥 作者

- **作者**：Azek
- **邮箱**：Azek431@163.com
- **GitHub**：Azek431/ks-hzzfzq
- **交流群**：QQ群 130330601
- **QQ频道**：pd67838308
- **Telegram频道**：@AzekMain

---

## 🙏 致谢

### 感谢以下项目的支持和启发：

· hyb1996/Auto.js - 优秀的自动化脚本平台
· Material Design团队 - 提供现代化的UI设计规范
· 开源社区 - 持续的技术支持和贡献

---

<p align="center">
  <strong>🎯 精准识别 | ⚡ 极致性能 | 🎨 炫酷视觉</strong><br>
  如果这个项目对你有帮助，请给一个 ⭐ Star 支持！
</p>

也可以给我们赞赏a，谢谢

<p align="center">
  <img src = "images/WeiXin-qrcode.png" alt="WeiXin-qrcode" width = "360" height = "360">
  <img src = "images/Alipay-qrcode.jpg" alt="Alipay-qrcode" width = "270" height = "405">
</p>

---

<p align="center">
  <strong>温馨提示：本工具仅供学习交流使用，请遵守相关法律法规和平台规则。</strong>
</p>