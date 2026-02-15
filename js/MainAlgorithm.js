/**
 * 荆棘识别核心算法 - 基于状态机的像素扫描
 * @param {Image} img - 游戏截图（必须包含bitmap属性）
 * @param {Object} options - 配置选项 {TCYPS: 是否调整识别位置}
 * @returns {Array} 荆棘组数组，包含startX/startY/endX/endY坐标
 * 
 * 算法流程：
 * 1. 边界校验：验证图像尺寸和bitmap有效性
 * 2. 坐标计算：基于playersXPps和thornsCenterYPps确定扫描区域
 * 3. 像素扫描：从checkX开始，按动态步长扫描指定Y行
 * 4. 状态机识别：0=等待开始, 1=识别中，通过颜色特征分组
 * 5. 容错处理：识别失败时自动切换thornsCenterYPps重试
 */

function getThornsData(img, options) {
    if (!options) {
        options = {};
    }

    // 边界强校验：过滤空图、无bitmap、无效尺寸等异常场景，避免崩溃
    if (!img || !img.bitmap) return [];
    const bitmap = img.bitmap;
    const width = bitmap.getWidth(); // 画面实际宽度
    const height = bitmap.getHeight(); // 画面实际高度
    if (width <= 0 || height <= 0) return [];

    // 基础变量初始化：预计算关键坐标+获取扫描行像素数据
    const checkX = sd.ptx(playersXPps, width); // 扫描初始X位置（按玩家比例适配）
    const checkY = sd.pty(thornsCenterYPps, height); // 扫描固定Y行（荆棘中心位置）
    const pixels = util.java.array("int", width); // 存储扫描行的像素数据
    // 从checkX开始，获取checkY行的像素（仅取1行，减少内存占用）
    bitmap.getPixels(pixels, 0, width, checkX, checkY, width - checkX, 1);
    const thornsY = sd.yp(thornsCenterYPps, height); // 荆棘Y坐标（预计算一次，提升性能）

    // 存储最终识别到的荆棘组数据
    let thornsList = [];

    // 状态机变量：用于跟踪荆棘识别状态
    let state = 0; // 0: 等待识别荆棘开始 | 1: 正在识别荆棘（寻找结束位置）
    let currentStartX = -1; // 当前荆棘组的起始X坐标
    let lastThornX = -1; // 上一个识别到的荆棘像素X坐标
    let emptyCount = 0; // 连续空像素计数（用于判定荆棘组结束）

    // 识别阈值预计算：基于画面尺寸适配，确保不同分辨率下识别一致性
    const startScanX = checkX; // 【修改1：扫描起始X设为checkX，从自定义初始位置开始扫描】
    const gapThreshold = sd.xp(thornsWidthPps, width); // 荆棘组之间的最小间隔阈值
    const endThreshold = gapThreshold / 2; // 判定荆棘组结束的连续空像素阈值
    let step = 1; // 扫描步长（减少计算量，平衡速度与精度）

    // 预计算颜色判定阈值
    const COLOR_THRESHOLD = 155;
    const SUM_THRESHOLD = 400;

    // 核心循环：逐像素扫描识别荆棘，按状态机逻辑分组
    for (let x = startScanX; x < width; x += step) {
        // 【修改2：像素索引校准 = 实际X坐标 - checkX（因pixels从checkX开始存储像素）】
        let color = pixels[x - checkX];

        // 提取像素RGB值，用于颜色特征判定
        let r = (color >> 16) & 0xFF;
        // 非荆棘判定：红色值过高（排除背景等干扰像素）
        if (r > COLOR_THRESHOLD) {
            if (state == 1) { // 若正处于识别荆棘状态，累计空像素
                emptyCount += step;
                // 连续空像素达到阈值 → 当前荆棘组结束
                if (emptyCount >= endThreshold) {
                    thornsList.push({
                        startX: currentStartX,
                        startY: thornsY,
                        endX: lastThornX,
                        endY: thornsY
                    });
                    state = 0; // 重置状态，等待下一组荆棘
                    currentStartX = -1;
                }
            }

            step = 1;

            continue; // 跳过非荆棘像素，继续下一轮扫描
        }

        // 提取绿色、蓝色值，补充荆棘颜色特征判定
        let g = (color >> 8) & 0xFF;
        let b = color & 0xFF;

        // 荆棘判定：红≤155 且 绿+蓝≥400（匹配荆棘颜色特征）
        if ((g + b) >= SUM_THRESHOLD) {
            if (state == 0) { // 等待状态 → 识别到新荆棘组开始
                state = 1;
                currentStartX = x; // 记录当前荆棘组起始X
                emptyCount = 0; // 重置空像素计数
            } else { // 识别中 → 检查是否需要拆分新荆棘组
                // 当前像素与上一个荆棘像素的间隔≥阈值 → 拆分新组
                if (x - lastThornX >= gapThreshold && lastThornX !== -1) {
                    thornsList.push({
                        startX: currentStartX,
                        startY: thornsY,
                        endX: lastThornX,
                        endY: thornsY
                    });
                    currentStartX = x; // 记录新组起始X
                }
                emptyCount = 0; // 重置空像素计数
            }
            lastThornX = x; // 更新上一个荆棘像素X坐标

            step = 4;

        } else {
            // 非荆棘判定：颜色不匹配荆棘特征
            if (state == 1) { // 若正处于识别荆棘状态，累计空像素
                emptyCount += step;
                // 连续空像素达到阈值 → 当前荆棘组结束
                if (emptyCount >= endThreshold) {
                    thornsList.push({
                        startX: currentStartX,
                        startY: thornsY,
                        endX: lastThornX,
                        endY: thornsY
                    });
                    state = 0; // 重置状态，等待下一组荆棘
                    currentStartX = -1;
                }
            }
        }

    }

    // 收尾处理：扫描结束后，补全未完成的最后一组荆棘
    if (state == 1) {
        thornsList.push({
            startX: currentStartX,
            startY: thornsY,
            endX: width - 1, // 结束X设为画面右边界
            endY: thornsY
        });
    }

    if (thornsList.length === 0 && options.TCYPS != true) {
        let num = thornsCenterYPpsIndex;
        if (thornsCenterYPpsIndex <= 1) num = 2
        else if (thornsCenterYPpsIndex === 2) num = 3
        else if (thornsCenterYPpsIndex === 3) num = 1

        let LCTYPS = thornsCenterYPps;
        thornsCenterYPps = thornsCenterYPpsSelect(num);

        return getThornsData(img, {
            TCYPS: true,
            LCTYPS: LCTYPS
        });

    }
    if (options.LCTYPS != undefined) thornsCenterYPps = options.LCTYPS;

    // 错误荆棘判断
    if (thornsList.length >= 1 && thornsList[0].endX < width - 1 && thornsList[0].endX - thornsList[0].startX <= gapThreshold / 2) return [];


    // 返回识别到的荆棘组位置数据
    return thornsList;
}



/**
 * 获取分数点数 - 增强错误处理版本
 */
function getScorePoints(img) {
    // 增强边界校验
    if (!isImageValid(img)) {
        console.warn("getScorePoints: 图像无效");
        return 0;
    }

    try {
        const bitmap = img.bitmap;
        const width = bitmap.getWidth();
        const height = bitmap.getHeight();

        if (width <= 0 || height <= 0) {
            console.warn("getScorePoints: 图像尺寸无效");
            return 0;
        }

        // 基础变量初始化
        const checkX = sd.ptx(scoreCenterXPps, width);
        const checkY = sd.pty(scoreCenterYPps, height);
        const checkWidth = sd.ptx(scoreWidthPps, width);
        const checkHeight = sd.pty(scoreHeightPps, height);

        // 验证扫描区域在图像范围内
        if (checkX < 0 || checkY < 0 || checkX + checkWidth > width || checkY + checkHeight > height) {
            console.warn("getScorePoints: 扫描区域超出图像范围");
            return 0;
        }

        const pixels = util.java.array("int", checkWidth * checkHeight);
        bitmap.getPixels(pixels, 0, checkWidth, checkX, checkY, checkWidth, checkHeight);

        // 扫描步长
        let step = 1;
        let baseStep = 1;

        let scorePixelSum = 0;
        let contScoreNum = 0;
        let contNoScoreNum = 0;
        for (let i = 0; i < pixels.length; i += step) {
            let color = pixels[i];
            let red = (color >> 16) & 0xFF;
            if (red <= 100) {
                if (contScoreNum === 0) step = baseStep;
                scorePixelSum++;
                step += contScoreNum;

                contNoScoreNum = 0;
            } else {
                if (contNoScoreNum === 0) step = baseStep;
                contNoScoreNum++;
                step += contNoScoreNum;

                if (contNoScoreNum % 4 == 0) baseStep++;

                contScoreNum = 0;
            }


        }

        return scorePixelSum;

    } catch (e) {
        console.error("getScorePoints 执行错误: " + e);
        return 0;
    }
}



/**
 * 计算所有数据 - 增强错误处理版本
 */
function getAllData(img) {
    if (!isImageValid(img)) {
        console.warn("getAllData: 输入图像无效");
        return {
            thorns: [],
            scorePoints: 0, 
            ckltEndX: null
        };
    }

    try {
        let data =  {
            thorns: getThornsData(img),
            scorePoints: getScorePoints(img)
            
        }
        
        // 计算跳跃到的坐标
        data.endX = ckltEndX(data.thorns);
        
        // 计算长按时间
        data.pressTime = ckltJumpToXTime(data.endX);
        
        
        return data;
    } catch (e) {
        console.error("getAllData 执行错误: " + e);

        return {
            thorns: [],
            scorePoints: 0
        };
    }
}

// 跳跃算法
eval(files.read("./js/JumpAlgorithm.js"));

