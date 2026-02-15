// 初始化悬浮窗 (绘制)
var cw = null;

function drawWindow() {
    cw = floaty.rawWindow(`
    <canvas id = "canvas" />
    
`)
    cw.setTouchable(false);
    cw.setSize(-1, -1);

    currentWindowY = storage.get("currentWindowY");
    if (currentWindowY != undefined) cw.setPosition(0, currentWindowY)
    else cw.setPosition(0, -getStatusBarHeightCompat());


    cwi = null;

    var paint = new Paint();
    paint.setTextAlign(Paint.Align.CENTER); //写字左右中心
    paint.setStyle(Paint.Style.STROKE); //空心样式
    paint.setStrokeWidth(6); // 线宽

    // 画笔基础科技风配置：抗锯齿+圆角端点+描边+颜色抖动（渐变更自然）
    paint.setAntiAlias(true);
    paint.setStrokeCap(Paint.Cap.ROUND);
    paint.setStyle(Paint.Style.STROKE);
    paint.setDither(true);


    showBitmap = null;
    // 画板刷新
    cw.canvas.on("draw", function(canvas) {
        let matrix = new Matrix();

        if (showBitmap) {
            canvas.drawBitmap(showBitmap, matrix, paint);

        } else {
            canvas.drawColor(Color.TRANSPARENT, PorterDuff.Mode.CLEAR);

        }

    })

}

// 初始化环境
// eval(files.read("./js/initEnv.js"));
// 选择
function thornsCenterYPpsSelect(index) {
    return thornsCenterYPpsList[index];
}

// 获取数据
function getData() {
    // 基础数值
    let data = {
        // 玩家中心x占比
        playersXPps: 154.5 / 720,

        // 人物宽度 --2026-1-30 09:43 08 新增数据
        playersWidthPps: 143 / 720,


        // 荆棘中心y占比
        thornsCenterYPps: storage.get("thornsCenterYPps") || 1000 / 1600,
        thornsCenterYPpsIndex: storage.get("thornsCenterYPpsIndex") || 1,
        thornsCenterYPpsList: [1000 / 1600, 1000 / 1600, 961 / 1600, 0.65],

        // 荆棘宽度占比
        thornsWidthPps: 87 / 720,


        // 分数显示文字中心x占比  --2026-1-31 21:45:37 新增
        scoreCenterXPps: 333 / 720,

        // 分数显示文字中心y占比  --2026-1-31 22:37:18 新增
        scoreCenterYPps: 122 / 1600,

        // 分数显示文字宽度占比  --2026-1-31 22:37:32 新增
        scoreWidthPps: 212 / 720,

        // 分数显示文字高度占比  --2026-2-4 11:55:43 新增
        scoreHeightPps: 40 / 1600,

        // 等待到分数点数变化
        whileScoreChangeBoor: storage.get("whileScoreChangeBoor"),

        // 循环等待时间
        waitTime: storage.get("waitTime") || random(103.1, 143.1),

        // 运行速度
        runSpeed: storage.get("runSpeed") || 1

    }

    // 等待到分数点数变化
    if (data.whileScoreChangeBoor === undefined) data.whileScoreChangeBoor = false;

    return data;
}

// 初始化变量
function initVar() {
    let data = getData();

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


// 初始化储存
function initStorage() {
    setStorageData(storage, getStorageAll(storageName));
}


// 算法脚本
eval(files.read("./js/MainAlgorithm.js"));


// 绘制
// eval(files.read("./js/drawImg.js"));
// const drawImg = require("./drawImg.js").drawImg;
const drawImage = require("./drawImg.js");
const drawImg = drawImage.drawImg;



// 脚本主内容
function mainRun() {
    // Node.js 引擎
    if (AlgEng == "Node.js") {
        execution.engine.emit('mainRun');

        return true;
    }

    // 删除绘制
    showBitmap = null;

    // 截图
    let img = captureScreen();

    // 计算荆棘组数据
    let data = getAllData(img);
    threads.start(function() {
        // 时间计算
        let endX = data.endX;
        let pressTime = data.pressTime / runSpeed;

        // 长按屏幕跳跃
        if (endX) jumpToX(endX, pressTime);

        let image;
        if (data) {
            // 绘制
            image = drawImg(img, data, {
                clear: true

            });
        }

        let bitmap = image.bitmap;
        if (bitmap) {
            showBitmap = bitmap;

            setTimeout(function() {
                // 回收图片
                // if (image) bitmap.recycle();

                showBitmap = null;

            }, pressTime * 0.88);

        }

    });


    // 回收图片 (防内存泄漏)
    // img.recycle();

    return true;

}



// 获取复活按钮，识别到按钮立即点击
function getResurgenceButton() {
    // 30毫秒超时，识别到按钮就点，无按钮直接结束，不等待
    let button = textMatches(/(原地复活|立即复活|复活)/).findOne(30);
    return button;

}


// 等待到分数点数变化
function whileScorePointsChange(scorePoints, maxWaitTime) {
    // 自动关闭
    setTimeout(function() {
        return false;
    }, maxWaitTime);

    try {
        let startTime = Date.now();
        let sp = scorePoints;

        let thread = threads.start(() => {
            while (true) {
                let img = captureScreen();
                if (!img) continue;

                sp = getScorePoints(img);
                if (img) img.recycle(); // 回收图片

                sleep(3);
            }
        })

        while (true) {
            if (Date.now() - startTime >= maxWaitTime) {
                if (thread) thread.interrupt();
                sleep(0);
                return false;
            }

            if (sp != scorePoints) {
                if (thread) thread.interrupt();
                sleep(0);
                return true;
            }

            sleep(3);
        }
    } catch (e) {
        console.error(e);

    }

    return false;
}



/**
 * 游戏辅助主控制循环 - 资源安全版本
 * 循环流程：
 * 1. 截图捕获 → captureScreen() 带有效性检查
 * 2. 数据分析 → getAllData() 获取荆棘和分数
 * 3. 复活检测 → getResurrectionButton() 自动复活
 * 4. 跳跃计算 → ckltEndX() 智能落点选择
 * 5. 执行跳跃 → jumpToX() 多线程按压操作
 * 6. 效果绘制 → drawImg() 非阻塞式渲染
 * 7. 状态等待 → 动态sleep时间控制
 * 
 * 资源管理：使用try-catch-finally确保图像回收
 */

function cycleRun() {
    // Node.js 引擎
    if (AlgEng == "Node.js") {
        execution.engine.emit('cycleRun');

        return true;
    }

    threads.start(function() {
        cycleRun.state = 1;
        let loopCount = 0;
        const RESURGENCE_CHECK_INTERVAL = 3;

        while (cycleRun.state) {
            // 删除绘制
            showBitmap = null;

            let img = null;
            if (cycleRun.thread) cycleRun.thread.interrupt(); // 中断线程
            try {
                img = captureScreen();
                if (!isImageValid(img)) {
                    console.error("循环执行: 截图失败或图像无效");
                    sleep(100);
                    continue;
                }

                let data = getAllData(img);

                if (!data || data.thorns === undefined) {
                    console.warn("数据获取失败");
                    continue;
                }
                []
                // 无荆棘数据处理：未识别到荆棘时，累计计数器并检测复活
                if (data.thorns.length === 0) {
                    loopCount++; // 累计无数据循环次数
                    // 计数器达到阈值时，触发复活按钮检测
                    if (loopCount >= RESURGENCE_CHECK_INTERVAL) {
                        loopCount = 0; // 重置无数据计数器，重新开始累计
                        console.log(`重置累计无数据次数: ${loopCount}`);

                        console.log("识别复活按钮");
                        let resurgenceButton = getResurgenceButton(); // 识别复活按钮位置
                        // 识别到复活按钮时，执行点击并等待复活动画
                        if (resurgenceButton) {
                            resurgenceButton.clickCenter(); // 点击复活按钮中心位置，确保触发
                            toast("自动复活中..."); // 提示用户当前正在执行复活操作
                            sleep(500); // 复活动画持续时间（200毫秒），避免后续操作干扰复活
                        }
                        continue; // 跳过当前循环剩余步骤，进入下一轮检测
                    }

                }

                // 3. 计算跳跃参数：基于荆棘数据确定跳跃终点和所需时长
                let endX = data.endX // 计算跳跃的目标X坐标（横向跳跃核心参数）
                let pressTime = ckltJumpToXTime(endX) / runSpeed; // 计算完成该跳跃所需的时间（控制跳跃力度）
                let sleepTime = (pressTime * 2); // 跳跃后等待时长：基于跳跃时间的2倍 ( 默认 )，确保跳跃动作完成

                // 4. 执行自动跳跃：当存在有效目标X坐标时，触发跳跃操作
                if (endX) jumpToX(endX, pressTime); // 调用自定义跳跃函数，执行横向跳跃

                // 在绘制线程中添加图像有效性检查
                cycleRun.thread = threads.start(() => {
                    if (isImageValid(img)) {
                        let image = drawImg(img, data, {
                            clear: true
                        });
                        if (image && image.bitmap) {
                            showBitmap = image.bitmap;
                            setTimeout(() => {
                                // if (image) image.recycle();  // 回收图片
                                showBitmap = null; // 删除绘制
                            }, pressTime * 0.88);
                        }
                    }
                });

                let scorePoints = getScorePoints(img);

                // 6. 循环等待：根据跳跃状态设置不同的等待时长，平衡效率和稳定性
                if (endX >= 0) {
                    // 等待时间范围赋值
                    sleepTime = Math.max(0, Math.min(sleepTime, 5000));

                    sleep(sleepTime); // 有效跳跃后，按计算的时长等待
                    // 短时跳跃补充等待：当跳跃后等待时长≤450毫秒时，额外补充68毫秒，防止跳跃不充分
                    if (sleepTime <= 450) {
                        sleep(68);
                    }
                } else {
                    sleep(10); // 无有效跳跃目标时，兜底等待10毫秒，防止CPU空转飙升
                }

                // 等待到分数变化设置  --2026-2-6 23:03:10 新增
                if (whileScoreChangeBoor) whileScorePointsChange(scorePoints, waitTime / runSpeed);
                else sleep(waitTime / runSpeed);


            } catch (e) {
                console.error("cycleRun 循环错误: " + e);
            } finally {
                // 确保图像资源被适当清理
                if (img && typeof img.recycle === 'function') {
                    try {
                        img.recycle();
                    } catch (e) {
                        console.error("图像资源并清理: " + e);
                    }
                }
            }

            if (img) img.recycle(); // 回收图片
            sleep(0);
        }

    });
}
cycleRun.state = 0;
cycleRun.thread = null;


module.exports = this;