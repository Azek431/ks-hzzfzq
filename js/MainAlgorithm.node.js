/** --2026-2-13 22:40:25 新增
 * 获取荆棘数据 - Node.js 引擎适配版
 * 核心逻辑：利用 OpenCV Mat 的 Buffer 数据进行极速行扫描
 */
/**
 * 获取荆棘数据 - 极致性能位移版
 */
async function getThornsData(img, options = {}) {
    if (!img || img.isRecycled || !img.mat) return [];

    const {
        width,
        height
    } = img;
    const mat = img.mat;
    const data = mat.getData();

    // 1. 坐标预计算
    const checkX = Math.floor(sd.ptx(playersXPps, width));
    const checkY = Math.floor(sd.pty(thornsCenterYPps, height));
    const thornsY = sd.yp(thornsCenterYPps, height);

    // 每行起始偏移：y * width * 4
    const rowOffset = checkY * width * 4;

    let thornsList = [];
    let state = 0;
    let currentStartX = -1;
    let lastThornX = -1;
    let emptyCount = 0;

    const gapThreshold = sd.xp(thornsWidthPps, width);
    const endThreshold = gapThreshold >> 1; // 除以 2
    const COLOR_THRESHOLD = 155;
    const SUM_THRESHOLD = 400;

    // 2. 核心扫描 (位移运算优化)
    for (let x = checkX; x < width;) {
        const idx = rowOffset + (x << 2); // x * 4 优化

        // BGRA 格式判断
        if (data[idx + 2] <= COLOR_THRESHOLD && (data[idx + 1] + data[idx]) >= SUM_THRESHOLD) {
            if (state === 0) {
                state = 1;
                currentStartX = x;
            } else if (x - lastThornX >= gapThreshold && lastThornX !== -1) {
                thornsList.push({
                    startX: currentStartX,
                    startY: thornsY,
                    endX: lastThornX,
                    endY: thornsY
                });
                currentStartX = x;
            }
            lastThornX = x;
            emptyCount = 0;
            x += 4; // 命中特征跳步扫描
        } else {
            if (state === 1) {
                emptyCount++;
                if (emptyCount >= endThreshold) {
                    thornsList.push({
                        startX: currentStartX,
                        startY: thornsY,
                        endX: lastThornX,
                        endY: thornsY
                    });
                    state = 0;
                    currentStartX = -1;
                }
            }
            x += 1; // 未命中精细扫描
        }
    }

    if (state === 1) {
        thornsList.push({
            startX: currentStartX,
            startY: thornsY,
            endX: lastThornX,
            endY: thornsY
        });
    }

    // 3. 递归切换 Y 轴高度逻辑
    if (thornsList.length === 0 && !options.isRetry) {
        const nextIndex = (thornsCenterYPpsIndex % 3) + 1;
        const originalY = thornsCenterYPps;
        thornsCenterYPps = thornsCenterYPpsSelect(nextIndex);

        const result = await getThornsData(img, {
            isRetry: true
        });

        thornsCenterYPps = originalY; // 还原配置
        return result;
    }

    // 4. 异常过滤
    if (thornsList.length > 0 && (thornsList[0].endX - thornsList[0].startX) <= endThreshold) {
        if (thornsList[0].endX < width - 1) return [];
    }

    return thornsList;
}

/**
 * 获取分数点数 - 内存重映射优化版
 */
async function getScorePoints(img) {
    if (!img || img.isRecycled || !img.mat) return 0;

    const {
        width,
        height
    } = img;
    const mat = img.mat;
    const data = mat.getData();

    try {
        const cX = Math.floor(sd.ptx(scoreCenterXPps, width));
        const cY = Math.floor(sd.pty(scoreCenterYPps, height));
        const cW = Math.min(Math.floor(sd.ptx(scoreWidthPps, width)), width - cX);
        const cH = Math.min(Math.floor(sd.pty(scoreHeightPps, height)), height - cY);

        if (cW <= 0 || cH <= 0) return 0;

        let scorePixelSum = 0;
        let contScoreNum = 0;
        let contNoScoreNum = 0;
        let baseStep = 1;

        for (let y = 0; y < cH; y++) {
            const rowOffset = (cY + y) * width * 4;
            for (let x = 0; x < cW;) {
                const idx = rowOffset + ((cX + x) << 2);

                if (data[idx + 2] <= 100) { // Red 分量判断
                    scorePixelSum++;
                    x += (contScoreNum === 0) ? baseStep : (baseStep + contScoreNum);
                    contNoScoreNum = 0;
                    contScoreNum++;
                } else {
                    x += (contNoScoreNum === 0) ? baseStep : (baseStep + contNoScoreNum);
                    contNoScoreNum++;
                    if (contNoScoreNum % 4 === 0) baseStep++;
                    contScoreNum = 0;
                }
            }
        }
        return scorePixelSum;
    } catch (e) {
        return 0;
    }
}

/**
 * 并发数据计算中心
 */
async function getAllData(img) {
    if (!img || img.isRecycled || !img.mat) {
        return {
            thorns: [],
            scorePoints: 0,
            endX: null,
            pressTime: 0
        };
    }

    try {
        // 利用 Promise.all 同时启动两个 Buffer 扫描任务，不浪费多核 CPU
        const [thorns, scorePoints] = await Promise.all([
            getThornsData(img),
            getScorePoints(img)
        ]);

        // 同步计算后续参数
        const endX = await ckltEndX(thorns);
        const pressTime = await ckltJumpToXTime(endX);

        return {
            thorns,
            scorePoints,
            endX,
            pressTime
        };
    } catch (e) {
        console.error("Data Analysis Error:", e);
        return {
            thorns: [],
            scorePoints: -1,
            endX: -1,
            pressTime: -1
        };
    }
}

/**
 * 脚本主循环 - 异步流水线版
 * * 流程复盘：
 * 1. 采集：使用 nextImage 瞬间获取内存图像。
 * 2. 识别：通过 getAllData 并行计算荆棘和分数。
 * 3. 决策：不阻塞主流程，直接发出 jumpToX 指令。
 * 4. 视觉：异步绘制并自动管理内存回收。
 */
async function mainRun() {
    let capture = null;

    try {
        // 1. 获取最新帧
        capture = await capturer.nextImage();
        if (!capture || capture.isRecycled) return false;

        // 2. 核心识别
        const startTime = performance.now();
        const data = await getAllData(capture);
        const calcTime = (performance.now() - startTime).toFixed(2);

        // 3. 异步并发层 (动作执行与 UI 反馈)
        // 注意：末尾加了 () 确保它立即执行
        (async () => {
            try {
                const {
                    endX,
                    pressTime,
                    thorns
                } = data;
                const actualPressTime = pressTime / (global.runSpeed || 1);

                // --- A. 物理动作层 ---
                if (endX && endX > 0) {
                    jumpToX(endX, actualPressTime);
                }

                // --- B. 视觉绘制层 ---
                if (thorns && thorns.length > 0) {
                    // 发送给 UI 线程进行绘制
                    serverEngine.emit('drawScreenImg', {
                        data: data,
                        imgSizes: {
                            width: capture.width,
                            height: capture.height
                        }

                    });
                }
            } catch (innerError) {
                console.error("异步执行层异常:", innerError);
            } finally {
                // --- C. 资源释放层 ---
                // 在异步逻辑执行完（或报错后）回收图片
                if (capture && !capture.isRecycled) {
                    capture.recycle();
                }
            }
        })(); // <--- 关键：加了括号才会立即执行

        return true;

    } catch (e) {
        console.error("mainRun 运行异常:", e);
        // 如果第一步就挂了，也要回收
        if (capture && !capture.isRecycled) capture.recycle();
        return false;
    }
}

/**
 * 闪电响应版：等待分数变化
 */
async function whileScorePointsChange(baseScore, maxWaitTime) {
    let isFinished = false;
    const startTime = Date.now();

    // 任务 A：绝对超时控制
    const timeoutPromise = (async () => {
        await delay(maxWaitTime);
        if (!isFinished) {
            isFinished = true; // 强制通知识别循环停止
            return false;
        }
    })();

    // 任务 B：后台高频识别
    const monitorPromise = (async () => {
        try {
            while (!isFinished && (Date.now() - startTime < maxWaitTime)) {
                const img = await capturer.nextImage();
                if (!img || img.isRecycled) {
                    await delay(5);
                    continue;
                }

                // 重点：如果已经超时，拿到图立刻扔掉，不再计算
                if (isFinished) {
                    img.recycle();
                    break;
                }

                const currentSP = await getScorePoints(img);
                img.recycle(); // 识别完立即回收

                if (currentSP !== baseScore) {
                    isFinished = true;
                    return true;
                }
                await delay(5); // 给主线程留出 5ms 响应点击
            }
        } catch (e) {
            console.error("监控循环异常:", e);
        }
        return false;
    })();

    const result = await Promise.race([timeoutPromise, monitorPromise]);
    isFinished = true; // 确保所有任务都感知到结束
    return !!result;
}


/**
 * 极速流水线循环
 */
var isRunning = false;
var RESURGENCE_CHECK_INTERVAL = 3;
async function cycleRun() {
    if (isRunning) return;
    isRunning = true;
    let loopCount = 0;
    
    console.log("🚀 Node.js 极速流水线已启动");
    
    while (isRunning) {
        let img = null;
        try {
            // 1. 获取最新帧
            img = await capturer.nextImage();
            if (!img || img.isRecycled) {
                await delay(50);
                continue;
            }

            // 2. 核心数据识别 (并行计算)
            const data = await getAllData(img);
            if (!data || !data.thorns) {
                img.recycle();
                await delay(50);
                continue;
            }

            // 3. 处理复活逻辑
            if (data.thorns.length === 0) {
                loopCount++;
                if (loopCount >= RESURGENCE_CHECK_INTERVAL) {
                    loopCount = 0;
                    serverEngine.emit('getResurgenceButton');
                }
                img.recycle();
                await delay(200);
                // continue;
            }
            loopCount = 0;

            // 4. 计算跳跃参数
            const endX = data.endX;
            const pressTime = await ckltJumpToXTime(endX) / (global.runSpeed || 1);

            // 5. 执行非阻塞指令 (绘制 & 跳跃)
            if (endX > 0 && data.thorns.length) {
                // 异步执行，不 await 它们，让主循环先行
                jumpToX(endX, pressTime);
                serverEngine.emit('drawScreenImg', {
                    data: data,
                    imgSizes: {
                        width: img.width,
                        height: img.height
                    }
                });
            }

            // ⚠️ 关键优化：识别完这张图后，直接回收！
            // 这样 whileScorePointsChange 内部可以开辟全新的截图流，互不干扰
            const baseScore = data.scorePoints;
            img.recycle();
            img = null; // 彻底切断引用

            // 传统等待模式
            let sleepTime = pressTime * 2;
            sleepTime = Math.max(10, Math.min(sleepTime, 5000));
            await delay(sleepTime);

            // 6. 等待控制
            if (global.whileScoreChangeBoor) {
                // 进入全速监控模式 (由于上面已 recycle，这里不会报错)
                await whileScorePointsChange(baseScore, global.waitTime / (global.runSpeed || 1));
            } else {
                await delay(global.waitTime);
                if (sleepTime <= 450) await delay(68);
            }

        } catch (e) {
            console.error("cycleRun 核心循环崩溃:", e);
            if (img && !img.isRecycled) img.recycle();
            await delay(500);
        }
    }
}

// 停止函数
function stopCycle() {
    isRunning = false;
    console.log("🛑 循环停止信号已发出");
}