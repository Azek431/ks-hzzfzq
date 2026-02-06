// 初始化悬浮窗 (绘制)
var cw = floaty.rawWindow(`
    <canvas id = "canvas" />
    
`)
cw.setTouchable(false);
cw.setSize(-1, -1);

let currentWindowY = storage.get("currentWindowY");
if (currentWindowY != undefined) cw.setPosition(0, currentWindowY)
else cw.setPosition(0, -getStatusBarHeightCompat());


var cwi = null;

var paint = new Paint();
paint.setTextAlign(Paint.Align.CENTER); //写字左右中心
paint.setStyle(Paint.Style.STROKE); //空心样式
paint.setStrokeWidth(6); // 线宽

// 画笔基础科技风配置：抗锯齿+圆角端点+描边+颜色抖动（渐变更自然）
paint.setAntiAlias(true);
paint.setStrokeCap(Paint.Cap.ROUND);
paint.setStyle(Paint.Style.STROKE);
paint.setDither(true);


let showBitmap = null;
// 画板刷新
cw.canvas.on("draw", function(canvas) {
    let matrix = new Matrix();

    if (showBitmap) {
        canvas.drawBitmap(showBitmap, matrix, paint);

    } else {
        canvas.drawColor(Color.TRANSPARENT, PorterDuff.Mode.CLEAR);

    }

})

// 选择
function thornsCenterYPpsSelect(index) {
    return thornsCenterYPpsList[index];
}


// 基础数值
// 玩家中心x占比
let playersXPps = 154.5 / 720;

// 人物宽度 --2026-1-30 09:43 08 新增数据
let playersWidthPps = 143 / 720;


// 荆棘中心y占比
let thornsCenterYPps = storage.get("thornsCenterYPps") || 1000 / 1600;
let thornsCenterYPpsIndex = storage.get("thornsCenterYPpsIndex") || 1;
let thornsCenterYPpsList = storage.get("thornsCenterYPpsList") || [1000 / 1600, 1000 / 1600, 961 / 1600, 0.65];



// 荆棘宽度占比
let thornsWidthPps = 87 / 720;


// 分数显示文字中心x占比  --2026-1-31 21:45:37 新增
let scoreCenterXPps = 333 / 720;

// 分数显示文字中心y占比  --2026-1-31 22:37:18 新增
let scoreCenterYPps = 122 / 1600;

// 分数显示文字宽度占比  --2026-1-31 22:37:32 新增
let scoreWidthPps = 212 / 720;

// 分数显示文字高度占比  --2026-2-4 11:55:43 新增
let scoreHeightPps = 40 / 1600;


// 等待到分数点数变化
let whileScoreChangeBoor = storage.get("whileScoreChangeBoor");
if (whileScoreChangeBoor === undefined) whileScoreChangeBoor = true;

// 循环等待时间
let waitTime = storage.get("waitTime") || 134;


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

    // 核心循环：逐像素扫描识别荆棘，按状态机逻辑分组
    for (let x = startScanX; x < width; x += step) {
        // 【修改2：像素索引校准 = 实际X坐标 - checkX（因pixels从checkX开始存储像素）】
        let color = pixels[x - checkX];

        // 提取像素RGB值，用于颜色特征判定
        let r = (color >> 16) & 0xFF;
        // 非荆棘判定：红色值过高（排除背景等干扰像素）
        if (r > 155) {
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
        if ((g + b) >= 400) {
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
        let baseStep = 2;

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
            scorePoints: 0
        };
    }

    try {
        return {
            thorns: getThornsData(img),
            scorePoints: getScorePoints(img)
        };
    } catch (e) {
        console.error("getAllData 执行错误: " + e);
        return {
            thorns: [],
            scorePoints: 0
        };
    }
}



/**
 * 全息科技风可视化绘制系统
 * @param {Image} img - 基础图像
 * @param {Object} data - 识别数据 {thorns: 荆棘数据, scorePoints: 分数}
 * @param {Object} options - 绘制配置 {clear: 清空画布, techLevel: 科技等级1-3}
 * 
 * 绘制层次：
 * - TECH_LEVEL 1: 基础边框和文字
 * - TECH_LEVEL 2: 增加网格背景和连接线  
 * - TECH_LEVEL 3: 全效果（粒子动画、数据流、热力图）
 */

function drawImg(img, data, options) {
    // 初始化配置
    options = options || {
        clear: false,
        techLevel: 3
    };
    const TECH_LEVEL = Math.min(Math.max(options.techLevel || 3, 1), 3);

    // 🆕 首先检查img是否有效
    let canvas;
    let imgWidth, imgHeight;

    if (isImageValid(img)) {
        // ✅ img有效，使用传入的图像
        canvas = new Canvas(img);
        imgWidth = img.getWidth();
        imgHeight = img.getHeight();
    } else {
        // ✅ img无效或被回收，创建新的Canvas
        canvas = new Canvas();
        imgWidth = device.width;
        imgHeight = device.height;
        console.warn("⚠️ 传入的图像已回收");
        return null;
    }

    if (options.clear === true) {
        canvas.drawColor(Color.TRANSPARENT, PorterDuff.Mode.CLEAR);
    }

    // 数据验证
    if (!data || !Array.isArray(data.thorns) || data.thorns.length === 0) {
        let imgMat = canvas.toImage().getMat();
        return images.matToImage(imgMat);
    }

    // 预计算尺寸参数
    const sizeParams = preCalculateSizes(imgWidth, imgHeight);

    // 分层绘制
    if (TECH_LEVEL >= 2) {
        drawOptimizedTechGrid(canvas, imgWidth, imgHeight, TECH_LEVEL);
    }

    drawOptimizedThorns(canvas, data.thorns, sizeParams, TECH_LEVEL, imgWidth, imgHeight);

    if (data.thorns.length > 0) {
        drawOptimizedTrajectory(canvas, data, sizeParams, TECH_LEVEL, imgWidth, imgHeight);
    }

    // 返回结果
    let imgMat = canvas.toImage().getMat();
    return images.matToImage(imgMat);
}


/**
 * 增强版图像有效性检查
 * 修复回收状态检测，添加更严格的验证
 */
function isImageValid(img) {
    if (!img) return false;

    try {
        // 优先检查回收状态
        if (typeof img.isRecycled === 'function' && img.isRecycled()) {
            return false;
        }

        // 检查必要方法是否存在
        if (typeof img.getWidth !== 'function' || typeof img.getHeight !== 'function') {
            return false;
        }

        // 检查尺寸合理性
        let width = img.getWidth();
        let height = img.getHeight();
        if (width <= 0 || height <= 0 || width > 10000 || height > 10000) {
            return false;
        }

        // 检查bitmap是否存在且有效
        if (!img.bitmap) {
            return false;
        }

        // 最终验证：尝试访问像素数据
        try {
            let pixel = img.bitmap.getPixel(0, 0);
            return true;
        } catch (e) {
            return false;
        }

    } catch (e) {
        return false;
    }
}



/**
 * 预计算所有尺寸参数
 */
function preCalculateSizes(imgWidth, imgHeight) {
    return {
        offsetX13: sd.x(13, 720, imgWidth),
        offsetY72: sd.y(72, 1600, imgHeight),
        offsetY48: sd.y(48, 1600, imgHeight),
        safeRoundRadius: sd.x(8, 720, imgWidth),
        baseTextSize: sd.x(16, 720, imgWidth),
        lineHeight: sd.y(22, 1600, imgHeight),
        panelMargin: sd.x(15, 720, imgWidth)
    };
}

/**
 * 绘制科技网格背景
 */
function drawOptimizedTechGrid(canvas, width, height, techLevel) {
    let gridPaint = new Paint();
    gridPaint.setAntiAlias(true);
    gridPaint.setStrokeWidth(sd.x(0.5, 720, width));

    let gridSize = techLevel >= 3 ? sd.x(40, 720, width) : sd.x(60, 720, width);
    let gridColor = techLevel >= 3 ? Color.parseColor("#20FFFFFF") : Color.parseColor("#0AFFFFFF");

    gridPaint.setColor(gridColor);

    for (let x = 0; x < width; x += gridSize) {
        canvas.drawLine(x, 0, x, height, gridPaint);
    }
    for (let y = 0; y < height; y += gridSize) {
        canvas.drawLine(0, y, width, y, gridPaint);
    }
}

/**
 * 绘制所有荆棘组
 */
function drawOptimizedThorns(canvas, thorns, sizes, techLevel, imgWidth, imgHeight) {
    for (let i = 0; i < thorns.length; i++) {
        let thorn = thorns[i];
        let startX = thorn.startX,
            startY = thorn.startY;
        let endX = thorn.endX,
            endY = thorn.endY;

        let centerX = (startX + endX) / 2;
        let centerY = (startY + endY) / 2;

        // 绘制边框
        drawEnhancedThornBorder(canvas, startX, startY, endX, endY, sizes, techLevel, i);

        // 绘制数据标签
        drawEnhancedThornDataLabel(canvas, startX, startY, endX, endY, centerX, centerY, i, thorns, techLevel, imgWidth, imgHeight);
    }
}

/**
 * 绘制荆棘组边框
 */
function drawEnhancedThornBorder(canvas, startX, startY, endX, endY, sizes, techLevel, index) {
    let borderPaint = new Paint();
    borderPaint.setAntiAlias(true);
    borderPaint.setStyle(Paint.Style.STROKE);

    let left = startX - sizes.offsetX13;
    let top = startY - sizes.offsetY72
    let right = endX + sizes.offsetX13;
    let bottom = endY + sizes.offsetY48

    let colors = ["#FF00FF", "#00FFFF", "#FFFF00", "#00FF00"];
    let borderColor = colors[index % colors.length];

    let borderWidths = [sd.x(3, 720, canvas.getWidth()), sd.x(2, 720, canvas.getWidth())];

    for (let i = 0; i < Math.min(techLevel, 2); i++) {
        borderPaint.setColor(Color.parseColor(borderColor));
        borderPaint.setStrokeWidth(borderWidths[i]);

        let offset = i * 2;
        canvas.drawRoundRect(left + offset, top + offset, right - offset, bottom - offset,
            sizes.safeRoundRadius, sizes.safeRoundRadius, borderPaint);
    }
}

/**
 * 绘制荆棘组数据标签
 */
function drawEnhancedThornDataLabel(canvas, startX, startY, endX, endY, centerX, centerY, index, thorns, techLevel, imgWidth, imgHeight) {
    let textPaint = new Paint();
    textPaint.setAntiAlias(true);
    textPaint.setTextSize(sd.x(16, 720, imgWidth));
    textPaint.setFakeBoldText(true);
    textPaint.setTextAlign(Paint.Align.LEFT);

    // 荆棘组信息
    let thornWidth = Math.abs(endX - startX);
    let thornHeight = Math.abs(endY - startY);

    let infoText = [
        `🌵荆棘组 ${index + 1}`,
        `📏${thornWidth.toFixed(0)}×${thornHeight.toFixed(0)}`,
        `📍(${centerX.toFixed(0)},${centerY.toFixed(0)})`
    ];

    // 计算面板位置
    let panelPos = calculateSmartPanelPosition(startX, startY, endX, endY, index, thorns.length, imgWidth, imgHeight);

    // 绘制面板
    drawTechEnhancedPanel(canvas, panelPos.x, panelPos.y, infoText.length, techLevel, index, imgWidth, imgHeight);

    // 绘制文字
    drawOptimizedPanelText(canvas, infoText, panelPos.x, panelPos.y, techLevel, imgWidth, imgHeight);
}

/**
 * 智能面板位置计算
 */
function calculateSmartPanelPosition(startX, startY, endX, endY, index, totalThorns, imgWidth, imgHeight) {
    let panelWidth = sd.x(120, 720, imgWidth);
    let panelHeight = 3 * sd.y(22, 1600, imgHeight) + sd.y(8, 1600, imgHeight);
    let margin = sd.x(15, 720, imgWidth);

    // 默认位置（右侧）
    let panelX = endX + margin;
    let panelY = startY - sd.y(10, 1600, imgHeight);

    // 边界检查
    if (panelX + panelWidth > imgWidth) {
        panelX = startX - panelWidth - margin;
    }
    if (panelY + panelHeight > imgHeight) {
        panelY = imgHeight - panelHeight - margin;
    }
    if (panelY < 0) {
        panelY = margin;
    }

    // 防重叠微调
    panelY += index * sd.y(25, 1600, imgHeight) % (imgHeight / 3);

    return {
        x: panelX,
        y: panelY
    };
}

/**
 * 绘制科技面板背景
 */
function drawTechEnhancedPanel(canvas, x, y, textLineCount, techLevel, index, imgWidth, imgHeight) {
    let bgPaint = new Paint();
    bgPaint.setAntiAlias(true);

    let panelWidth = sd.x(120, 720, imgWidth);
    let panelHeight = textLineCount * sd.y(22, 1600, imgHeight) + sd.y(8, 1600, imgHeight);
    let borderRadius = sd.x(6, 720, imgWidth);

    // 面板背景
    bgPaint.setColor(Color.argb(220, 0, 0, 0));
    bgPaint.setStyle(Paint.Style.FILL);
    canvas.drawRoundRect(x, y, x + panelWidth, y + panelHeight, borderRadius, borderRadius, bgPaint);

    // 面板边框
    let colors = ["#FF00FF", "#00FFFF", "#FFFF00", "#00FF00"];
    let borderColor = colors[index % colors.length];

    bgPaint.setColor(Color.parseColor(borderColor));
    bgPaint.setStyle(Paint.Style.STROKE);
    bgPaint.setStrokeWidth(sd.x(1, 720, imgWidth));
    canvas.drawRoundRect(x, y, x + panelWidth, y + panelHeight, borderRadius, borderRadius, bgPaint);
}

/**
 * 绘制面板文字
 */
function drawOptimizedPanelText(canvas, infoText, x, y, techLevel, imgWidth, imgHeight) {
    let textPaint = new Paint();
    textPaint.setAntiAlias(true);
    textPaint.setTextSize(sd.x(16, 720, imgWidth));
    textPaint.setFakeBoldText(true);
    textPaint.setTextAlign(Paint.Align.LEFT);
    textPaint.setColor(Color.WHITE);

    let lineHeight = sd.y(22, 1600, imgHeight);
    let textStartX = x + sd.x(8, 720, imgWidth);
    let textStartY = y + sd.y(20, 1600, imgHeight);

    infoText.forEach((line, i) => {
        canvas.drawText(line, textStartX, textStartY + i * lineHeight, textPaint);
    });
}

/**
 * 绘制抛物线轨迹
 */
function drawOptimizedTrajectory(canvas, data, sizes, techLevel, imgWidth, imgHeight) {
    let thorns = data.thorns;
    if (thorns.length === 0) return;

    let firstThorn = thorns[0];
    let pathStartX = sd.xp(playersWidthPps, imgWidth);
    let pathStartY = firstThorn.startY - sd.y(31, 1600, imgHeight);
    let pathEndX = ckltEndX(thorns);
    let pathEndY = firstThorn.endY - sd.y(31, 1600, imgHeight);
    let dx = pathEndX - pathStartX;

    if (dx !== 0 && Math.abs(dx) > sd.x(10, 720, imgWidth)) {
        let centerX = pathStartX + dx / 2;
        let topY = pathStartY - Math.max(dx / 4.5, pathEndX / 400);

        // 绘制轨迹线
        drawTrajectoryPath(canvas, pathStartX, pathStartY, pathEndX, pathEndY, centerX, topY, techLevel, imgWidth);

        // 绘制关键节点
        drawKeyPointsWithData(canvas, pathStartX, pathStartY, pathEndX, pathEndY, centerX, topY, dx, data, techLevel, imgWidth, imgHeight);
    }
}

/**
 * 绘制轨迹路径
 */
function drawTrajectoryPath(canvas, startX, startY, endX, endY, centerX, topY, techLevel, imgWidth) {
    let path = new Path();
    let dx = endX - startX;
    let a = (endY - topY) / Math.pow(dx / 2, 2);

    path.moveTo(startX, startY);
    for (let x = startX + 1; x <= endX; x++) {
        let offsetX = x - centerX;
        let y = a * Math.pow(offsetX, 2) + topY;
        path.lineTo(x, y);
    }

    let trajectoryPaint = new Paint();
    trajectoryPaint.setAntiAlias(true);
    trajectoryPaint.setStyle(Paint.Style.STROKE);

    if (techLevel >= 3) {
        trajectoryPaint.setColor(Color.parseColor("#00FFFF"));
        trajectoryPaint.setStrokeWidth(sd.x(4, 720, imgWidth));
    } else if (techLevel >= 2) {
        trajectoryPaint.setColor(Color.parseColor("#0099FF"));
        trajectoryPaint.setStrokeWidth(sd.x(3, 720, imgWidth));
    } else {
        trajectoryPaint.setColor(Color.parseColor("#0066FF"));
        trajectoryPaint.setStrokeWidth(sd.x(2, 720, imgWidth));
    }

    canvas.drawPath(path, trajectoryPaint);
}

/**
 * 绘制轨迹关键节点
 */
function drawKeyPointsWithData(canvas, startX, startY, endX, endY, centerX, topY, dx, data, techLevel, imgWidth, imgHeight) {
    let keyPoints = [{
            x: startX,
            y: startY,
            color: "#ff2222",
            label: "🔥起点",
            data: `(${startX.toFixed(0)},${startY.toFixed(0)})`
        },
        {
            x: centerX,
            y: topY,
            color: "#9900FF",
            label: "⚡顶点",
            data: `(${centerX.toFixed(0)},${topY.toFixed(0)})`
        },
        {
            x: endX,
            y: endY,
            color: "#FF6600",
            label: "🎯落点",
            data: `(${endX.toFixed(0)},${endY.toFixed(0)})`
        }
    ];

    // 绘制每个关键节点
    keyPoints.forEach((point, index) => {
        drawKeyPoint(canvas, point.x, point.y, point.color, point.label, point.data, techLevel, index, imgWidth, imgHeight);
    });

    // 绘制轨迹数据面板
    drawEnhancedTrajectoryPanel(canvas, startX, startY, endX, endY, centerX, topY, dx, data, techLevel, imgWidth, imgHeight);
}

/**
 * 绘制单个关键节点
 */
function drawKeyPoint(canvas, x, y, color, label, data, techLevel, index, imgWidth, imgHeight) {
    let nodePaint = new Paint();
    nodePaint.setAntiAlias(true);

    let baseSize = sd.x(10, 720, imgWidth);

    // 核心节点
    nodePaint.setColor(Color.parseColor(color));
    nodePaint.setStyle(Paint.Style.FILL);
    canvas.drawCircle(x, y, baseSize, nodePaint);

    // 白色边框
    nodePaint.setColor(Color.parseColor("#FFFFFF"));
    nodePaint.setStyle(Paint.Style.STROKE);
    nodePaint.setStrokeWidth(sd.x(1, 720, imgWidth));
    canvas.drawCircle(x, y, baseSize, nodePaint);

    // 节点标签和数据
    let textPaint = new Paint();
    textPaint.setAntiAlias(true);
    textPaint.setColor(Color.parseColor(color));
    textPaint.setTextSize(sd.x(18, 720, imgWidth));
    textPaint.setFakeBoldText(true);
    textPaint.setTextAlign(Paint.Align.CENTER);

    // 根据节点位置调整文字显示位置
    let textOffsetY = index === 1 ? -sd.y(30, 1600, imgHeight) : sd.y(30, 1600, imgHeight);
    let textOffsetX = index === 0 ? -sd.x(50, 720, imgWidth) :
        index === 2 ? sd.x(50, 720, imgWidth) : 0;

    // 绘制标签
    canvas.drawText(label, x + textOffsetX, y + textOffsetY, textPaint);

    // 绘制坐标数据
    textPaint.setTextSize(sd.x(16, 720, imgWidth));
    canvas.drawText(data, x + textOffsetX, y + textOffsetY + sd.y(18, 1600, imgHeight), textPaint);
}

/**
 * 绘制轨迹数据面板
 */
function drawEnhancedTrajectoryPanel(canvas, startX, startY, endX, endY, centerX, topY, dx, data, techLevel, imgWidth, imgHeight) {
    if (techLevel < 2) return;

    let panelPaint = new Paint();
    panelPaint.setAntiAlias(true);

    // 面板位置
    let panelX = centerX + sd.x(34, 720, imgWidth);
    let panelY = topY - sd.y(143, 1600, imgHeight);
    let panelWidth = sd.x(200, 720, imgWidth);
    let panelHeight = sd.y(128, 1600, imgHeight);

    // 边界检查
    if (panelX < 0) panelX = sd.x(10, 720, imgWidth);
    if (panelX + panelWidth > imgWidth) panelX = imgWidth - panelWidth - sd.x(10, 720, imgWidth);
    if (panelY < 0) panelY = sd.y(10, 1600, imgHeight);

    // 面板背景
    panelPaint.setColor(Color.argb(220, 0, 0, 0));
    panelPaint.setStyle(Paint.Style.FILL);
    canvas.drawRoundRect(panelX, panelY, panelX + panelWidth, panelY + panelHeight,
        sd.x(8, 720, imgWidth), sd.x(8, 720, imgWidth), panelPaint);

    // 面板边框
    panelPaint.setStyle(Paint.Style.STROKE);
    panelPaint.setColor(Color.parseColor("#00FFFF"));
    panelPaint.setStrokeWidth(sd.x(2, 720, imgWidth));
    canvas.drawRoundRect(panelX, panelY, panelX + panelWidth, panelY + panelHeight,
        sd.x(8, 720, imgWidth), sd.x(8, 720, imgWidth), panelPaint);

    // 面板数据
    let textPaint = new Paint();
    textPaint.setAntiAlias(true);
    textPaint.setColor(Color.parseColor("#FFFFFF"));
    textPaint.setTextSize(sd.x(12, 720, imgWidth));
    textPaint.setFakeBoldText(true);

    let jumpDist = Math.abs(dx).toFixed(0);
    let pressTime = ckltJumpToXTime(endX).toFixed(3);
    let jumpSpeed = sd.x(jumpDist / pressTime * 300, 720, imgWidth).toFixed(5);
    let vertexHeight = Math.abs(startY - topY).toFixed(0);
    // 增加分数电是数据，请你把传授数据改成 data，然后想要荆棘数据 data.thorns 就行了
    // scorePoints 还没定义，这是 data.scorePoints 里边的
    let lines = [
        `跳跃距离: ${jumpDist}px`,
        `按压时长: ${pressTime}ms`,
        `跳跃速度: ${jumpSpeed}m/min`,
        `抛物线高度: ${vertexHeight}px`,
        `荆棘组数量: ${data.thorns.length}个`,
        `分数点数: ${data.scorePoints}`
    ];


    let lineHeight = sd.y(18, 1600, imgHeight);
    let startYPos = panelY + sd.y(25, 1600, imgHeight);

    lines.forEach((line, index) => {
        canvas.drawText(line, panelX + sd.x(10, 720, imgWidth), startYPos + index * lineHeight, textPaint);
    });
}


/**
 * 增强网格效果（科技感等级3）
 */
function drawEnhancedGridEffect(canvas, width, height, baseGridSize, gridPaint) {
    // 简化的增强网格
    for (let x = 0; x < width; x += baseGridSize / 2) {
        gridPaint.setAlpha(30);
        canvas.drawLine(x, 0, x, height, gridPaint);
    }
    for (let y = 0; y < height; y += baseGridSize / 2) {
        gridPaint.setAlpha(30);
        canvas.drawLine(0, y, width, y, gridPaint);
    }
}

/**
 * 荆棘组热力图（科技感等级3）
 */
function drawThornsHeatmap(canvas, thorns, imgWidth, imgHeight) {
    if (thorns.length < 2) return;

    let heatmapPaint = new Paint();
    heatmapPaint.setAntiAlias(true);

    for (let i = 0; i < thorns.length; i++) {
        let thorn = thorns[i];
        let centerX = (thorn.startX + thorn.endX) / 2;
        let centerY = (thorn.startY + thorn.endY) / 2;

        heatmapPaint.setColor(Color.argb(30, 255, 100, 100));
        heatmapPaint.setStyle(Paint.Style.FILL);
        canvas.drawCircle(centerX, centerY, 50, heatmapPaint);
    }
}

/**
 * 荆棘组连线（科技感等级2）
 */
function drawThornConnection(canvas, currentThorn, nextThorn, techLevel) {
    let connectPaint = new Paint();
    connectPaint.setAntiAlias(true);
    connectPaint.setStyle(Paint.Style.STROKE);

    let currentCenterX = (currentThorn.startX + currentThorn.endX) / 2;
    let currentCenterY = (currentThorn.startY + currentThorn.endY) / 2;
    let nextCenterX = (nextThorn.startX + nextThorn.endX) / 2;
    let nextCenterY = (nextThorn.startY + nextThorn.endY) / 2;

    connectPaint.setColor(Color.argb(150, 100, 200, 255));
    connectPaint.setStrokeWidth(sd.x(1.5, 720, canvas.getWidth()));

    canvas.drawLine(currentCenterX, currentCenterY, nextCenterX, nextCenterY, connectPaint);
}

/**
 * 脉冲效果（科技感等级3）
 */
function drawPulseEffect(canvas, left, top, right, bottom, radius, index) {
    let pulsePaint = new Paint();
    pulsePaint.setAntiAlias(true);
    pulsePaint.setStyle(Paint.Style.STROKE);

    let currentTime = new Date().getTime() / 1000;
    let pulsePhase = (currentTime + index * 0.5) % 2;
    let pulseAlpha = Math.abs(Math.sin(pulsePhase * Math.PI)) * 150 + 50;

    pulsePaint.setColor(Color.argb(pulseAlpha, 0, 255, 255));
    pulsePaint.setStrokeWidth(sd.x(2, 720, canvas.getWidth()));

    canvas.drawRoundRect(left, top, right, bottom, radius, radius, pulsePaint);
}

/**
 * 边框角标（科技感等级2）
 */
function drawBorderCornerMarks(canvas, left, top, right, bottom, color, techLevel, index) {
    let cornerPaint = new Paint();
    cornerPaint.setAntiAlias(true);
    cornerPaint.setColor(Color.parseColor(color));

    let cornerSize = sd.x(6, 720, canvas.getWidth());
    let cornerOffset = sd.x(3, 720, canvas.getWidth());

    let corners = [{
            x: left + cornerOffset,
            y: top + cornerOffset
        },
        {
            x: right - cornerOffset,
            y: top + cornerOffset
        },
        {
            x: left + cornerOffset,
            y: bottom - cornerOffset
        },
        {
            x: right - cornerOffset,
            y: bottom - cornerOffset
        }
    ];

    corners.forEach(corner => {
        cornerPaint.setStyle(Paint.Style.FILL);
        canvas.drawRect(corner.x, corner.y, corner.x + cornerSize, corner.y + cornerSize, cornerPaint);
    });
}

/**
 * 动态角标效果（科技感等级3）
 */
function drawAnimatedCornerEffect(canvas, x, y, size, color, index) {
    let effectPaint = new Paint();
    effectPaint.setAntiAlias(true);
    effectPaint.setStyle(Paint.Style.STROKE);

    let currentTime = new Date().getTime() / 1000;
    let animationPhase = (currentTime + index * 0.3) % 1;
    let pulseAlpha = Math.floor(150 + 105 * Math.sin(animationPhase * Math.PI * 2));

    effectPaint.setColor(Color.parseColor(color));
    effectPaint.setAlpha(pulseAlpha);
    effectPaint.setStrokeWidth(sd.x(2, 720, canvas.getWidth()));

    canvas.drawRect(x - 2, y - 2, x + size + 4, y + size + 4, effectPaint);
}

/**
 * 面板发光效果（科技感等级2）
 */
function drawPanelGlowEffect(canvas, x, y, width, height, radius, color, imgWidth) {
    let glowPaint = new Paint();
    glowPaint.setAntiAlias(true);
    glowPaint.setStyle(Paint.Style.STROKE);
    glowPaint.setColor(Color.parseColor(color));

    for (let i = 1; i <= 2; i++) {
        glowPaint.setAlpha(80 - i * 30);
        glowPaint.setStrokeWidth(sd.x(2 + i, 720, imgWidth));

        let glowOffset = i * 2;
        canvas.drawRoundRect(x - glowOffset, y - glowOffset,
            x + width + glowOffset, y + height + glowOffset,
            radius, radius, glowPaint);
    }
}

/**
 * 面板角标装饰（科技感等级3）
 */
function drawPanelCornerDecorations(canvas, x, y, width, height, color, index, imgWidth) {
    let cornerPaint = new Paint();
    cornerPaint.setAntiAlias(true);
    cornerPaint.setColor(Color.parseColor(color));

    let cornerSize = sd.x(6, 720, imgWidth);
    let cornerOffset = sd.x(3, 720, imgWidth);

    let corners = [{
            x: x + cornerOffset,
            y: y + cornerOffset
        },
        {
            x: x + width - cornerOffset,
            y: y + cornerOffset
        },
        {
            x: x + cornerOffset,
            y: y + height - cornerOffset
        },
        {
            x: x + width - cornerOffset,
            y: y + height - cornerOffset
        }
    ];

    let currentTime = new Date().getTime() / 1000;
    let pulsePhase = (currentTime + index * 0.3) % 1;
    let pulseAlpha = Math.floor(150 + 105 * Math.sin(pulsePhase * Math.PI * 2));

    cornerPaint.setAlpha(pulseAlpha);

    corners.forEach(corner => {
        cornerPaint.setStyle(Paint.Style.FILL);
        canvas.drawRect(corner.x, corner.y, corner.x + cornerSize, corner.y + cornerSize, cornerPaint);
    });
}

/**
 * 高级科技感效果（科技感等级3）
 */
function drawAdvancedTechEffects(canvas, x, y, textLineCount, index, imgWidth, imgHeight) {
    let panelWidth = sd.x(140, 720, imgWidth);
    let panelHeight = textLineCount * sd.y(22, 1600, imgHeight) + sd.y(12, 1600, imgHeight);

    // 数据流动画
    drawDataFlowAnimation(canvas, x, y, panelWidth, panelHeight, index, imgWidth);

    // 粒子效果
    drawParticleEffects(canvas, x, y, panelWidth, panelHeight, index, imgWidth);
}

/**
 * 数据流动画效果
 */
function drawDataFlowAnimation(canvas, x, y, width, height, index, imgWidth) {
    let flowPaint = new Paint();
    flowPaint.setAntiAlias(true);
    flowPaint.setStyle(Paint.Style.STROKE);

    let currentTime = new Date().getTime() / 1000;
    let animationOffset = (currentTime + index * 0.5) % 1;

    flowPaint.setColor(Color.argb(150, 0, 255, 255));
    flowPaint.setStrokeWidth(sd.x(1, 720, imgWidth));

    let path = new Path();
    path.moveTo(x, y + height / 2);
    path.lineTo(x + width * animationOffset, y + height / 2);

    canvas.drawPath(path, flowPaint);
}

/**
 * 粒子效果装饰
 */
function drawParticleEffects(canvas, x, y, width, height, index, imgWidth) {
    let particlePaint = new Paint();
    particlePaint.setAntiAlias(true);
    particlePaint.setStyle(Paint.Style.FILL);

    for (let i = 0; i < 5; i++) {
        let particleX = x + Math.random() * width;
        let particleY = y + Math.random() * height;
        let particleSize = sd.x(1 + Math.random() * 2, 720, imgWidth);
        let particleAlpha = 50 + Math.random() * 100;

        particlePaint.setColor(Color.argb(particleAlpha, 0, 255, 255));
        canvas.drawCircle(particleX, particleY, particleSize, particlePaint);
    }
}

/**
 * 数据连接线（科技感等级2）
 */
function drawDataConnectionLine(canvas, thornX, thornY, panelX, panelY, techLevel, index, imgWidth, imgHeight) {
    let linePaint = new Paint();
    linePaint.setAntiAlias(true);
    linePaint.setStyle(Paint.Style.STROKE);

    let colors = ["#FF00FF", "#00FFFF", "#FFFF00", "#00FF00"];
    let lineColor = colors[index % colors.length];
    linePaint.setColor(Color.parseColor(lineColor));

    if (techLevel >= 2) {
        let dashEffect = new android.graphics.DashPathEffect(
            [sd.x(5, 720, imgWidth), sd.x(3, 720, imgWidth)], 0);
        linePaint.setPathEffect(dashEffect);
    }

    linePaint.setStrokeWidth(sd.x(1.5, 720, imgWidth));
    linePaint.setAlpha(150);

    let panelEdgeX = panelX;
    let panelEdgeY = panelY + sd.y(30, 1600, imgHeight);

    canvas.drawLine(thornX, thornY, panelEdgeX, panelEdgeY, linePaint);
}

/**
 * 连接点标记（科技感等级3）
 */
function drawConnectionPointMarker(canvas, startX, startY, endX, endY, color, imgWidth) {
    let markerPaint = new Paint();
    markerPaint.setAntiAlias(true);
    markerPaint.setColor(Color.parseColor(color));
    markerPaint.setStyle(Paint.Style.FILL);

    let markerSize = sd.x(4, 720, imgWidth);

    canvas.drawCircle(startX, startY, markerSize, markerPaint);
    canvas.drawCircle(endX, endY, markerSize, markerPaint);
}

/**
 * 轨迹预览效果（科技感等级3）
 */
function drawTrajectoryPreview(canvas, startX, startY, endX, endY, centerX, topY, imgWidth) {
    let previewPaint = new Paint();
    previewPaint.setAntiAlias(true);
    previewPaint.setStyle(Paint.Style.STROKE);

    let path = new Path();
    let dx = endX - startX;
    let a = (endY - topY) / Math.pow(dx / 2, 2);

    path.moveTo(startX, startY);
    for (let x = startX + 1; x <= endX; x += 3) {
        let offsetX = x - centerX;
        let y = a * Math.pow(offsetX, 2) + topY;
        path.lineTo(x, y);
    }

    previewPaint.setColor(Color.argb(80, 100, 200, 255));
    previewPaint.setStrokeWidth(sd.x(6, 720, imgWidth));

    canvas.drawPath(path, previewPaint);
}

/**
 * 轨迹分析面板（科技感等级3）
 */
function drawTrajectoryAnalysisPanel(canvas, startX, startY, endX, endY, centerX, topY, dx, imgWidth, imgHeight) {
    let panelPaint = new Paint();
    panelPaint.setAntiAlias(true);

    let panelX = centerX - sd.x(100, 720, imgWidth);
    let panelY = topY - sd.y(180, 1600, imgHeight);
    let panelWidth = sd.x(200, 720, imgWidth);
    let panelHeight = sd.y(100, 1600, imgHeight);

    // 边界检查
    if (panelX < 0) panelX = sd.x(10, 720, imgWidth);
    if (panelX + panelWidth > imgWidth) panelX = imgWidth - panelWidth - sd.x(10, 720, imgWidth);
    if (panelY < 0) panelY = sd.y(10, 1600, imgHeight);

    // 面板背景
    panelPaint.setColor(Color.argb(220, 0, 0, 0));
    panelPaint.setStyle(Paint.Style.FILL);
    canvas.drawRoundRect(panelX, panelY, panelX + panelWidth, panelY + panelHeight,
        sd.x(8, 720, imgWidth), sd.x(8, 720, imgWidth), panelPaint);

    // 分析数据
    let textPaint = new Paint();
    textPaint.setAntiAlias(true);
    textPaint.setColor(Color.parseColor("#FFFFFF"));
    textPaint.setTextSize(sd.x(12, 720, imgWidth));
    textPaint.setFakeBoldText(true);

    let trajectoryLength = calculateTrajectoryLength(startX, startY, endX, endY, centerX, topY);
    let curvature = calculateTrajectoryCurvature(dx, topY - startY);
    let riskLevel = assessJumpRisk(dx, trajectoryLength);

    let lines = [
        `轨迹长度: ${trajectoryLength.toFixed(1)}px`,
        `曲率: ${curvature.toFixed(3)}`,
        `风险评估: ${riskLevel}`
    ];

    let lineHeight = sd.y(18, 1600, imgHeight);
    let startYPos = panelY + sd.y(25, 1600, imgHeight);

    lines.forEach((line, index) => {
        canvas.drawText(line, panelX + sd.x(10, 720, imgWidth), startYPos + index * lineHeight, textPaint);
    });
}

/**
 * 计算轨迹长度
 */
function calculateTrajectoryLength(startX, startY, endX, endY, centerX, topY) {
    let dx = endX - startX;
    let dy = endY - startY;
    return Math.sqrt(dx * dx + dy * dy) * 1.2;
}

/**
 * 计算轨迹曲率
 */
function calculateTrajectoryCurvature(dx, height) {
    return Math.abs(height / (dx * dx)) * 10000;
}

/**
 * 跳跃风险评估
 */
function assessJumpRisk(distance, trajectoryLength) {
    let riskRatio = distance / trajectoryLength;
    if (riskRatio > 0.9) return "高风险";
    if (riskRatio > 0.7) return "中风险";
    return "低风险";
}

/**
 * 动态避障算法（科技感等级3）
 */
function applyDynamicCollisionAvoidance(position, currentIndex, thorns, imgWidth, imgHeight) {
    let panelWidth = sd.x(140, 720, imgWidth);
    let panelHeight = sd.y(78, 1600, imgHeight);

    for (let i = 0; i < Math.min(currentIndex, 5); i++) {
        let simulatedPanel = {
            x: (i * 50) % (imgWidth - panelWidth),
            y: (i * 30) % (imgHeight - panelHeight)
        };

        if (isColliding(position, simulatedPanel, panelWidth, panelHeight)) {
            position.x = (position.x + panelWidth / 2) % (imgWidth - panelWidth);
            position.y = (position.y + panelHeight / 2) % (imgHeight - panelHeight);
            break;
        }
    }

    return position;
}

/**
 * 碰撞检测
 */
function isColliding(pos1, pos2, width, height) {
    return pos1.x < pos2.x + width &&
        pos1.x + width > pos2.x &&
        pos1.y < pos2.y + height &&
        pos1.y + height > pos2.y;
}

/**
 * 视觉流线优化
 */
function optimizeVisualFlow(position, startX, startY, endX, endY, imgWidth, imgHeight) {
    let centerX = (startX + endX) / 2;
    let centerY = (startY + endY) / 2;

    let relativeX = position.x - centerX;
    let relativeY = position.y - centerY;

    if (Math.abs(relativeX) > Math.abs(relativeY)) {
        position.y = centerY - sd.y(15, 1600, imgHeight);
    } else {
        position.x = centerX - sd.x(70, 720, imgWidth);
    }

    return position;
}

/**
 * 布局策略评分
 */
function calculateLayoutScore(direction, spaceAssessment, index, totalThorns) {
    let baseScores = {
        'right': 90,
        'left': 70,
        'top': 50,
        'bottom': 30
    };

    let baseScore = baseScores[direction] || 50;
    let spaceRatio = spaceAssessment[direction] / 200;
    let spaceBonus = Math.min(20, spaceRatio * 20);
    let indexWeight = (1 - index / Math.max(totalThorns, 1)) * 10;

    return baseScore + spaceBonus + indexWeight;
}

/**
 * 右侧位置计算
 */
function calculateRightPosition(startX, endX, startY, panelWidth, panelHeight, margin, imgWidth) {
    return {
        x: endX + margin,
        y: startY - sd.y(10, 1600, imgWidth)
    };
}

/**
 * 左侧位置计算
 */
function calculateLeftPosition(startX, endX, startY, panelWidth, panelHeight, margin) {
    return {
        x: startX - panelWidth - margin,
        y: startY - sd.y(10, 1600, device.height)
    };
}

/**
 * 上方位置计算
 */
function calculateTopPosition(startX, endX, startY, panelWidth, panelHeight, margin) {
    let centerX = (startX + endX) / 2;
    return {
        x: centerX - panelWidth / 2,
        y: startY - panelHeight - margin
    };
}

/**
 * 下方位置计算
 */
function calculateBottomPosition(startX, endX, endY, panelWidth, panelHeight, margin) {
    let centerX = (startX + endX) / 2;
    return {
        x: centerX - panelWidth / 2,
        y: endY + margin
    };
}

/**
 * 防重叠微调
 */
function applyAntiOverlapAdjustment(position, index, totalThorns, panelHeight, imgHeight) {
    if (totalThorns <= 1) return position;

    let maxOffset = Math.min(panelHeight * 2, imgHeight * 0.3);
    let offset = (index * 137) % totalThorns;
    let offsetRatio = offset / totalThorns;
    let verticalOffset = Math.floor(offsetRatio * maxOffset - maxOffset / 2);

    position.y += verticalOffset;
    return position;
}

/**
 * 最终位置验证
 */
function validateFinalPosition(position, panelWidth, panelHeight, imgWidth, imgHeight, safeMargin) {
    position.x = Math.max(safeMargin, Math.min(position.x, imgWidth - panelWidth - safeMargin));
    position.y = Math.max(safeMargin, Math.min(position.y, imgHeight - panelHeight - safeMargin));

    if (isNaN(position.x) || isNaN(position.y)) {
        position.x = safeMargin;
        position.y = safeMargin;
    }

    return position;
}

/**
 * 增强版智能面板位置计算
 */
function calculateSmartPanelPositionEnhanced(startX, startY, endX, endY, index, thorns, techLevel, imgWidth, imgHeight) {
    let basePosition = calculateSmartPanelPosition(startX, startY, endX, endY, index, thorns.length, imgWidth, imgHeight);

    if (techLevel >= 3 && thorns.length > 1) {
        basePosition = applyDynamicCollisionAvoidance(basePosition, index, thorns, imgWidth, imgHeight);
    }

    if (techLevel >= 2) {
        basePosition = optimizeVisualFlow(basePosition, startX, startY, endX, endY, imgWidth, imgHeight);
    }

    return basePosition;
}

/**
 * 面板位置二次验证
 */
function validatePanelPosition(panelPos, textLineCount, imgWidth, imgHeight, techLevel) {
    let margin = sd.x(10, 720, imgWidth);
    let panelWidth = sd.x(140, 720, imgWidth);
    let panelHeight = textLineCount * sd.y(22, 1600, imgHeight) + sd.y(12, 1600, imgHeight);

    panelPos.x = Math.max(margin, Math.min(panelPos.x, imgWidth - panelWidth - margin));
    panelPos.y = Math.max(margin, Math.min(panelPos.y, imgHeight - panelHeight - margin));

    return panelPos;
}

/**
 * 荆棘组风险评估
 */
function assessThornRiskLevel(width, height) {
    let aspectRatio = width / height;
    let area = width * height;

    if (area > 50000) return "高危";
    if (aspectRatio > 3 || aspectRatio < 0.33) return "中危";
    if (area < 1000) return "低危";

    return "一般";
}

/**
 * 构建荆棘组信息文本
 */
function buildThornInfoText(width, height, centerX, centerY, index, techLevel) {
    let infoText = [
        `🌵荆棘组 ${index + 1}`,
        `📏${width.toFixed(0)}×${height.toFixed(0)}`,
        `📍(${centerX.toFixed(0)},${centerY.toFixed(0)})`
    ];

    if (techLevel >= 2) {
        let area = (width * height).toFixed(0);
        let aspectRatio = (width / height).toFixed(2);
        infoText.push(`📊${area}px² | ${aspectRatio}:1`);
    }

    if (techLevel >= 3) {
        let diagonal = Math.sqrt(width * width + height * height).toFixed(1);
        let riskLevel = assessThornRiskLevel(width, height);
        infoText.push(`📐对角线: ${diagonal}px`);
        infoText.push(`⚠️风险: ${riskLevel}`);
    }

    return infoText;
}

/**
 * 关键节点文字绘制
 */
function drawKeyPointText(canvas, x, y, color, label, data, techLevel, index, imgWidth, imgHeight) {
    let textPaint = new Paint();
    textPaint.setAntiAlias(true);
    textPaint.setColor(Color.parseColor(color));
    textPaint.setFakeBoldText(true);
    textPaint.setTextAlign(Paint.Align.CENTER);

    let textConfig = calculateOptimalTextPosition(x, y, index, imgWidth, imgHeight);

    textPaint.setTextSize(sd.x(14, 720, imgWidth));
    canvas.drawText(label, textConfig.labelX, textConfig.labelY, textPaint);

    textPaint.setTextSize(sd.x(12, 720, imgWidth));
    canvas.drawText(data, textConfig.dataX, textConfig.dataY, textPaint);
}

/**
 * 最优文字位置计算
 */
function calculateOptimalTextPosition(x, y, index, imgWidth, imgHeight) {
    let labelOffsetY, dataOffsetY, labelOffsetX;

    switch (index) {
        case 0:
            labelOffsetY = -sd.y(25, 1600, imgHeight);
            dataOffsetY = -sd.y(10, 1600, imgHeight);
            labelOffsetX = -sd.x(50, 720, imgWidth);
            break;
        case 1:
            labelOffsetY = -sd.y(35, 1600, imgHeight);
            dataOffsetY = -sd.y(20, 1600, imgHeight);
            labelOffsetX = 0;
            break;
        case 2:
            labelOffsetY = -sd.y(25, 1600, imgHeight);
            dataOffsetY = -sd.y(10, 1600, imgHeight);
            labelOffsetX = sd.x(50, 720, imgWidth);
            break;
        default:
            labelOffsetY = sd.y(25, 1600, imgHeight);
            dataOffsetY = sd.y(40, 1600, imgHeight);
            labelOffsetX = 0;
    }

    let labelX = Math.max(sd.x(20, 720, imgWidth), Math.min(x + labelOffsetX, imgWidth - sd.x(20, 720, imgWidth)));
    let labelY = Math.max(sd.y(20, 1600, imgHeight), Math.min(y + labelOffsetY, imgHeight - sd.y(20, 1600, imgHeight)));
    let dataY = Math.max(sd.y(20, 1600, imgHeight), Math.min(y + dataOffsetY, imgHeight - sd.y(20, 1600, imgHeight)));

    return {
        labelX: labelX,
        labelY: labelY,
        dataX: labelX,
        dataY: dataY
    };
}

/**
 * 轨迹面板位置计算
 */
function calculateTrajectoryPanelPosition(centerX, topY, imgWidth, imgHeight, techLevel) {
    let panelWidth = sd.x(200, 720, imgWidth);
    let margin = sd.x(20, 720, imgWidth);

    let panelX = centerX + sd.x(34, 720, imgWidth);
    let panelY = topY - sd.y(techLevel >= 3 ? 160 : 140, 1600, imgHeight);

    if (panelX + panelWidth > imgWidth - margin) {
        panelX = centerX - panelWidth - sd.x(34, 720, imgWidth);
    }
    if (panelY < margin) {
        panelY = margin;
    }
    if (panelY > imgHeight - sd.y(120, 1600, imgHeight)) {
        panelY = imgHeight - sd.y(140, 1600, imgHeight) - margin;
    }

    return {
        x: panelX,
        y: panelY
    };
}

/**
 * 轨迹面板背景绘制
 */
function drawTrajectoryPanelBackground(canvas, x, y, width, height, techLevel, imgWidth) {
    let bgPaint = new Paint();
    bgPaint.setAntiAlias(true);

    bgPaint.setColor(Color.argb(220, 0, 0, 0));
    bgPaint.setStyle(Paint.Style.FILL);
    canvas.drawRoundRect(x, y, x + width, y + height,
        sd.x(8, 720, imgWidth), sd.x(8, 720, imgWidth), bgPaint);

    bgPaint.setStyle(Paint.Style.STROKE);
    bgPaint.setColor(Color.parseColor("#00FFFF"));
    bgPaint.setStrokeWidth(sd.x(2, 720, imgWidth));
    canvas.drawRoundRect(x, y, x + width, y + height,
        sd.x(8, 720, imgWidth), sd.x(8, 720, imgWidth), bgPaint);
}




// 脚本主内容
function mainRun(img) {
    // 计算荆棘组数据
    let data = getAllData(img);

    if (data) {
        // 绘制
        threads.start(function() {
            showBitmap = null;

            let bitmap = drawImg(img, data, {
                clear: true

            }).bitmap;

            if (bitmap) {
                showBitmap = bitmap;

                setTimeout(function() {
                    showBitmap = null;

                }, 300);

            }
        });

        // 长按屏幕跳跃
        let endX = ckltEndX(data.thorns);
        jumpToX(endX);

    }


}



// 计算跳跃到的坐标
function ckltEndX(thornData) {
    //空白区域判断
    if (thornData.length == 0) {
        toast("没有识别到荆棘组，执行跳跃空白");
        return device.width - random(sd.xp(34 / 720), sd.xp(68 / 720));

    }

    // 获取最后差值x 和 最后坐标x
    let endItpls = null;
    let endX = null;
    if (thornData.length == 1) {
        // 最后差值
        endItpls = device.width - thornData[0].endX;

        // 最后坐标x
        endX = device.width;

    } else {
        // 最后差值
        endItpls = thornData[1].startX - thornData[0].endX;

        // 最后坐标x
        endX = thornData[1].startX;


    }

    // 判断是否能跳跃过去
    if (endItpls >= sd.xp(playersWidthPps) * 1.25) {
        // 可以跳跃过去
        return endX - sd.xp(playersWidthPps) / 1.95;

    } else {
        // 跳跃空白区域
        return thornData[0].startX - sd.xp(playersWidthPps) / 1.68;

    }

    // 无效返回
    return null;
}

/**
 * 计算跳到指定位置的长按时间（修复负数问题）
 */
function ckltJumpToXTime(endX) {
    // 校验坐标有效性，避免非数字坐标计算出异常时长
    if (typeof endX !== 'number' || endX <= 0) return 100; // 最小100ms

    let time = (sd.xpps(endX) - playersXPps) * 800;

    // 确保时间在合理范围内 [0ms, 1000ms]
    time = Math.max(0, Math.min(time, 1000));

    return time;
}


// 跳到指定坐标，执行长按屏幕操作
function jumpToX(endX) {
    // 获取需要长按的时间
    let pressTime = ckltJumpToXTime(endX);
    // 校验长按时间和坐标，有效才执行跳跃
    if (pressTime < 1 || endX <= 0 || endX > device.width) return;
    // 子线程执行长按，不阻塞主流程
    threads.start(() => {
        // 计算长按的Y坐标，在荆棘组中心Y轴附近随机偏移
        let pressY = sd.yp(thornsCenterYPps) + random(-50.1, 50.1);
        // 执行长按操作
        press(endX, pressY, pressTime);
    });
}

// 获取复活按钮，识别到按钮立即点击
function getResurgenceButton() {
    // 1毫秒超时，识别到按钮就点，无按钮直接结束，不等待
    let button = textMatches(/(原地复活|立即复活|复活)/).findOne(1);
    return button;

}


// 等待到分数点数变化
function whileScorePointsChange(scorePoints, maxWaitTime) {
    try {
        let startTime = Date.now();
        let sp = scorePoints;

        let thread = threads.start(() => {
            while (true) {
                let img = captureScreen();
                if (!img) continue;

                sp = getScorePoints(img);

                sleep(3);
            }
        })

        while (true) {
            if (Date.now() - startTime >= maxWaitTime) {
                if (thread) thread.interrupt();
                return false;
            }

            if (sp != scorePoints) {
                if (thread) thread.interrupt();
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
    threads.start(function() {
        cycleRun.state = 1;
        let loopCount = 0;
        const RESURGENCE_CHECK_INTERVAL = 3;

        while (cycleRun.state) {
            let img = null;
            try {
                img = captureScreen();
                if (!isImageValid(img)) {
                    console.error("循环执行: 截图失败或图像无效");
                    sleep(30);
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
                        let resurgenceButton = getResurgenceButton(); // 识别复活按钮位置
                        // 识别到复活按钮时，执行点击并等待复活动画
                        if (resurgenceButton) {
                            resurgenceButton.clickCenter(); // 点击复活按钮中心位置，确保触发
                            toast("自动复活中..."); // 提示用户当前正在执行复活操作
                            sleep(500); // 复活动画持续时间（200毫秒），避免后续操作干扰复活
                            loopCount = 0; // 重置无数据计数器，重新开始累计
                        }
                        continue; // 跳过当前循环剩余步骤，进入下一轮检测
                    }
                }

                // 3. 计算跳跃参数：基于荆棘数据确定跳跃终点和所需时长
                let endX = ckltEndX(data.thorns); // 计算跳跃的目标X坐标（横向跳跃核心参数）
                let jumpTime = ckltJumpToXTime(endX); // 计算完成该跳跃所需的时间（控制跳跃力度）
                let sleepTime = (jumpTime * 2); // 跳跃后等待时长：基于跳跃时间的2.25倍 ( 默认 )，确保跳跃动作完成

                // 4. 执行自动跳跃：当存在有效目标X坐标时，触发跳跃操作
                if (endX) {
                    jumpToX(endX); // 调用自定义跳跃函数，执行横向跳跃
                }

                // 在绘制线程中添加图像有效性检查
                threads.start(() => {
                    if (isImageValid(img)) {
                        let result = drawImg(img, data, {
                            clear: true
                        });
                        if (result && result.bitmap) {
                            showBitmap = result.bitmap;
                            setTimeout(() => {
                                showBitmap = null;
                            }, jumpTime * 0.88);
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
                if (whileScoreChangeBoor) whileScorePointsChange(scorePoints, 134);
                else sleep(134);
                

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
            
            sleep(0);
        }

    });
}
cycleRun.state = 0;



module.exports = this;