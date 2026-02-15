// 导入模块
const engines = require("engines");

const fs = require("fs");
const path = require("path");

/* */
const {
    requestScreenCapture
} = require("media_projection");

const Images = require("image")
const {
    showToast
} = require("toast")

// 等待
const {
    delay
} = require('lang');

// 设备
const {
    device
} = require('device')

// 长按屏幕
const { press } = require('accessibility');

// 适配 V9 的 OpenCV 模块
// const cv = require('@autojs/opencv');


// 打印引擎启动参数
console.log(engines.myEngine().execArgv);

// 从参数中取出Rhino引擎的ID
const serverEngineId = engines.myEngine().execArgv.serverEngineId;

// 根据ID找出Rhino引擎
const serverEngine = engines.getRunningEngines().find(e => e.id === serverEngineId);
const mainId = engines.myEngine().execArgv.id;

// 项目所在路径
// console.log(__dirname);
const cwd = engines.myEngine().execArgv.cwd;

if (!serverEngine) {
    console.error('请运行文件"main.js"，而不是直接启动本代码');
    return;
}
$autojs.keepRunning();
console.info("Node.js 引擎运行成功！");


// 缓存屏幕分辨率
const DEVICE_WIDTH = device.screenWidth;
const DEVICE_HEIGHT = device.screenHeight;

// 屏幕适配函数
eval(fs.readFileSync(`${cwd}/js/ScreenAdapt.js`, 'utf8'));

// 跳跃算法
eval(fs.readFileSync(`${cwd}/js/JumpAlgorithm.node.js`, 'utf8'));


// 主要获取算法
eval(fs.readFileSync(`${cwd}/js/MainAlgorithm.node.js`, 'utf8'));

// 绘制函数
eval(fs.readFileSync(`${cwd}/js/drawImg.node.js`, 'utf8'));



// 获取当前纳秒时间戳
// process.hrtime.bigint();


// 初始化变量
function initGlobalVar(data) {
    let keys = Object.keys(data);
    let values = Object.values(data);

    // 遍历
    for (let i = 0; i < keys.length; i++) {
        let key = keys[i];
        let value = values[i];

        global[key] = value;

    }

    return true;
}



// 监听命令消息
initGlobalVar_boor = false;
engines.myEngine().on('initGlobalVar', (com) => {
    serverEngine.emit('initGlobalVar-Suc', {});
    if (!initGlobalVar_boor) {
        initGlobalVar_boor = true;
        console.log(`NodeJs 引擎成功收到数据！`)
    }

    initGlobalVar(com.data);

});

// 执行指定代码
engines.myEngine().on("eval", (code) => {
    eval(code);

})


// 监听截图权限请求
engines.myEngine().on('requestScreenCapture', (com) => {
    requestScreenCaptureImg();

});
// 请求截图权限
async function requestScreenCaptureImg() {
    serverEngine.emit('requestScreenCaptureImg');
    global.capturer = await requestScreenCapture();
    
    // console.log(capturer)
    let img = await capturer.nextImage();
    // console.log(img)
}

// 监听测试算法
engines.myEngine().on('testScript', (currentImgPath) => {
    testAlgorithm(currentImgPath);

})

// 监听单次执行
engines.myEngine().on('mainRun', () => {
    mainRun();
    
})

// 监听循环执行
engines.myEngine().on('cycleRun', () => {
    cycleRun();
    
})

// 监听停止循环执行
engines.myEngine().on('stopCycleRun', () => {
    stopCycle();
    
})


// 信息提示框
function toast(text) {
    serverEngine.emit('toast', text);
}

// 选择
function thornsCenterYPpsSelect(index) {
    return thornsCenterYPpsList[index];
}

/**
 * 测试算法函数 - Node.js 引擎版
 * 适配点：异步图片读取、Image.mat 校验、以及更精准的耗时统计
 */
async function testAlgorithm(currentImgPath) {
    // 前置校验：路径/图片读取兜底
    if (!currentImgPath || currentImgPath.trim() === "") {
        showToast("测试失败：未获取到有效图片路径");
        return true;
    }

    try {
        // 1. 读取测试图片 (Node.js 中是异步的)
        let img = await Images.readImage(currentImgPath);

        // 校验图片及底层 Mat 是否有效
        if (!img || !img.mat) {
            showToast("测试失败：图片读取失败或 Mat 对象无效");
            return true;
        }

        let data = {};
        let text = "";

        // 2. 计时执行荆棘识别
        // 注意：getThornsData 现在是异步函数 (async)，必须使用 await
        let startTime = process.hrtime.bigint();
        data.thorns = await getThornsData(img);
        text = `识别用时: ${Number(process.hrtime.bigint() - startTime) / 1e6} ms`;

        // 3. 获取分数点数 (假设该函数也适配了 Node 异步)
        startTime = process.hrtime.bigint()
        data.scorePoints = typeof getScorePoints === 'function' ? await getScorePoints(img) : [];
        text += `\n获取分数区域点数用时: ${Number(process.hrtime.bigint() - startTime) / 1e6} ms`;

        // 4. 计算逻辑 (同步计算)
        data.endX = await ckltEndX(data.thorns);
        data.pressTime = await ckltJumpToXTime(data.endX);

        // 5. 结果处理与可视化
        let drawCost = 0;
        if (data.thorns && data.thorns.length > 0) {
            text = `测试成功！${text}`;

            // 计时执行绘制
            let drawStartTime = process.hrtime.bigint();
            // 绘制
            serverEngine.emit('drawImgFiles', {
                path: currentImgPath,
                data: data
            })
            // drawImg(img, data)
            drawCost = Number(process.hrtime.bigint() - drawStartTime) / 1e6;
        text += `\n发送绘制事件用时: ${drawCost} ms`; // 拼接绘制用时
        
        } else {
            text = `未识别到荆棘, ${text}`;
        }

        // 6. 格式化落点参数
        let endXStr = (typeof data.endX === 'number' && data.endX >= 0) ? data.endX.toFixed(0) : "无效";
        let pressTimeStr = (typeof data.pressTime === 'number' && data.pressTime >= 0) ? data.pressTime.toFixed(1) : "无效";

        text += `\n落点X坐标: ${endXStr}px\n长按时间: ${pressTimeStr}ms`;

        // 7. 友好提示测试结果
        // console.log(text); // Node 引擎建议同时在控制台打印
        toast(text);

        // 8. 必须手动回收资源
        img.recycle();

    } catch (e) {
        // 精准异常捕获
        toast(`测试异常：${e.message || "未知错误"}`);
        console.error("测试算法报错详情：", e);
    }
}


async function test1() {
    await delay(3000);

    for (let i = 0; i < 13; i++) {
        console.time("等待截图用时")
        img = await capturer.nextImage();
        // img = await capturer.latestImage();
        console.timeEnd("等待截图用时")

        console.time("获取图片所有颜色用时");

        let mat = img.mat;
        let data = mat.getData();

        console.timeEnd("获取图片所有颜色用时");

    }

}


async function test2() {
    await delay(500);

    const img = await Images.readImage("./temp/currentImage.jpg");
    console.log(img)

    console.time("算法执行用时");

    let data = getThornsData(img);

    console.timeEnd("算法执行用时");
    console.log(data)


    img.recycle();
}
// test2();

