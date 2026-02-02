// 初始化悬浮窗 (绘制)
var cw = floaty.rawWindow(`
    <canvas id = "canvas" />
    
`)
cw.setTouchable(false);
cw.setSize(-1, -1);
cw.setPosition(0, -getStatusBarHeightCompat());


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

// 荆棘中心y占比选择
function thornsCenterYListSelect(index) {
    if (index == 1) {
        return 961 / 1600;
    } else {
        return 1000 / 1600;
    }

}


// 基础数值
// 玩家中心x占比
let playersXPps = 154.5 / 720;

// 人物宽度 --2026-1-30 09:43 08 新增数据
let playersWidthPps = 143 / 720;


// 荆棘中心y占比
let thornsCenterYIndex = 0;
let thornsCenterYPps = thornsCenterYListSelect(thornsCenterYIndex);


// 荆棘宽度占比
let thornsWidthPps = 87 / 720;


// 分数显示文字中心x占比  --2026-1-31 21:45:37 新增
let scoreCenterXPps = 358 / 720;

// 分数显示文字中心y占比  --2026-1-31 22:37:18 新增
let scoreCenterYPps = 142 / 1600;

// 分数显示文字中心宽度占比  --2026-1-31 22:37:32 新增
let scoreWidthPps = 210 / 720;

// 等待间隔倍数
let sleepIntervalMultiples = storage.get("sleepIntervalMultiples") || 2.25;


/**
 * 获取荆棘组位置数据（基于图像像素识别，优化checkX初始检测位置）
 * @param {Image} img - 游戏画面截图（需包含荆棘区域，依赖bitmap属性）
 * @returns {Array} 荆棘组数组，每项含startX/startY/endX/endY（实际画面坐标）；异常场景返回空数组
 * @note 核心逻辑：从checkX指定的初始位置开始，扫描指定Y行像素，通过「红≤155且绿+蓝≥400」颜色特征识别荆棘，按间隔分组
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
    const STEP = 2; // 扫描步长（减少计算量，平衡速度与精度）

    // 核心循环：逐像素扫描识别荆棘，按状态机逻辑分组
    for (let x = startScanX; x < width; x += STEP) {
        // 【修改2：像素索引校准 = 实际X坐标 - checkX（因pixels从checkX开始存储像素）】
        let color = pixels[x - checkX];

        // 提取像素RGB值，用于颜色特征判定
        let r = (color >> 16) & 0xFF;
        // 非荆棘判定：红色值过高（排除背景等干扰像素）
        if (r > 155) {
            if (state == 1) { // 若正处于识别荆棘状态，累计空像素
                emptyCount += STEP;
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
        } else {
            // 非荆棘判定：颜色不匹配荆棘特征
            if (state == 1) { // 若正处于识别荆棘状态，累计空像素
                emptyCount += STEP;
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

    // if (thornsList.length == 0 && options["TCYIchange"] != false) {
    //     if (thornsCenterYIndex == 1) {
    //         thornsCenterYIndex = 0;
    //     } else {
    //         thornsCenterYIndex = 1;
    //     }
    //     thornsCenterYPps = thornsCenterYListSelect(thornsCenterYIndex);

    //     return getThornsData(img, {
    //         TCYIchange: false
    //     })

    // }

    // 返回识别到的荆棘组位置数据
    return thornsList;
}



/**
 * 获取分数区域像素判定结果（横向反向扫描，red值判定）
 * @param {Image} img - 游戏画面截图（需包含分数显示区域）
 * @returns {Array} 二进制结果数组，1=red≤100，0=red>100；按“x412→x355”扫描顺序存储
 * @note 核心逻辑：扫描scoreCenterYPps对应的Y行，从适配后的x412反向扫到x355，输出逐像素判定结果
 */
function getScorePixelResult(img) {
    // ===================== 边界强校验（完全复用getThornsData逻辑，保稳定） =====================
    if (!img || !img.bitmap) return [];
    const bitmap = img.bitmap;
    const width = bitmap.getWidth(); // 实际屏幕宽度
    const height = bitmap.getHeight(); // 实际屏幕高度
    if (width <= 0 || height <= 0) return [];


    // 基准坐标转实际坐标（sd.xp/sd.pty 适配）
    const left = 276
    const top = 103
    const right = 462
    const bottom = 170

    // 计算区域宽高
    const rectW = right - left;
    const rectH = bottom - top;

    // 基础变量初始化：预计算关键坐标+获取扫描行像素数据
    const checkX = 343
    const checkY = 152 // 151.5
    const checkWidth = 168
    const pixels = util.java.array("int", 2122 * 47); // 存储扫描行的像素数据
    // 从checkX开始，获取checkY行的像素（仅取1行，减少内存占用）
    bitmap.getPixels(pixels, 0, 212, 368, 122, 212, 40);

    let scorePixelResult = [];
    for (let i = 0; i < pixels.length; i += 10) {
        let color = pixels[i];
        if (color == undefined) continue;
        let red = (color >> 16) & 0xFF;

        if (red <= 100) {
            scorePixelResult.push({
                code: 1,
                i: i,
                color: intColorRzls(color)
            });
            // scorePixelResult.push(1);

        } else {
            scorePixelResult.push({
                code: 0,
                i: i,
                color: intColorRzls(color)
            });
            // scorePixelResult.push(0);

        }


    }

    return scorePixelResult;

}



// 脚本主内容
function mainRun(img) {
    // 计算荆棘组数据
    let data = getThornsData(img);

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
        let endX = ckltEndX(data);
        jumpToX(endX);

    }


}


/**
 * 全息科技风绘制核心函数 - 荆棘组识别框+抛物线跳跃轨迹【增强版】
 * @param {Image} img - 底图（游戏画面），传图则绘制，不传新建空白画布
 * @param {Array} data - 荆棘组数据数组，项含startX/startY/endX/endY坐标
 * @param {Object} options - 配置项 {clear:Boolean} 是否清空画布
 * @returns {Image} 绘制完成的图像
 * @compatible Auto.js全版本/安卓Canvas原生/零报错
 * @adaptation 所有像素尺寸已对接sd屏幕适配函数，全机型兼容
 * @update 1.新增3个核心点位坐标显示 2.新增4类科技感数据 3.优化面板光晕+等宽字体 4.坐标精准对齐点位
 * @techStyle 等宽字体+霓虹边框+数据图标+半透渐变+精准坐标，全息座舱既视感
 */
function drawImg(img, data, options) {
    // 【初始化区】配置兜底+画布+画笔基础设置
    options = options || { clear: false };
    let canvas = img ? new Canvas(img) : new Canvas();
    let imgWidth = img ? img.getWidth() : device.width;
    let imgHeight = img ? img.getHeight() : device.height;
    // 【新增：科技风基础配置】等宽字体+光晕参数（增强科技感）
    const FONT_FAMILY = "monospace"; // 等宽字体，科技感核心
    const PANEL_GLOW_COLOR = Color.parseColor("#4D80FF"); // 面板边框光晕色
    const TEXT_SHADOW_RADIUS = sd.x(1.5, 720, imgWidth); // 文字阴影半径
    const TEXT_SHADOW_COLOR = Color.parseColor("#00000080"); // 文字阴影色（半透黑）

    // 【画布操作】仅显式传clear=true时清空，避免无效操作
    if (options.clear === true) {
        canvas.drawColor(Color.TRANSPARENT, PorterDuff.Mode.CLEAR);
    }
    // 【数据校验】非数组/空数组直接返回，避免后续报错
    if (!Array.isArray(data) || data.length === 0) {
        let imgMat = canvas.toImage().getMat();
        return images.matToImage(imgMat);
    }

    // 【适配参数区】所有像素尺寸通过sd适配，基准720*1600，全机型兼容
    // 基础偏移/圆角/半径（原有参数优化命名，保持适配逻辑）
    let offsetX13 = sd.x(13, 720, imgWidth);
    let offsetY68 = sd.y(68, 1600, imgHeight);
    let offsetY58 = sd.y(58, 1600, imgHeight);
    let safeRoundRadius = sd.x(8, 720, imgWidth);
    let glowRadius = sd.x(12, 720, imgWidth);
    let pointRadius = sd.x(5, 720, imgWidth);
    let glowRadiusTop = glowRadius + sd.x(3, 720, imgWidth);
    let pointRadiusTop = pointRadius + sd.x(2, 720, imgWidth);

    // 【新增：坐标文字适配参数】避免遮挡，偏移量精细化
    let coordTextOffsetY = sd.y(22, 1600, imgHeight); // 坐标文字相对节点文字的Y偏移
    let vertexCoordOffsetX = sd.x(10, 720, imgWidth); // 顶点坐标X偏移
    let vertexCoordOffsetY = sd.y(30, 1600, imgHeight); // 顶点坐标Y偏移

    // 文字参数（新增等宽字体适配，优化科技感）
    let textStrokeWidth = sd.x(1.5, 720, imgWidth);
    let textSizeThorn = sd.x(24, 720, imgWidth);
    let textSizeNode = sd.x(26, 720, imgWidth);
    let textSizeCoord = sd.x(18, 720, imgWidth); // 坐标文字字号（略小于节点文字）
    let textSizePanel = sd.x(20, 720, imgWidth);
    let textSizePanelSmall = sd.x(16, 720, imgWidth); // 新增小字号（显示额外数据）

    // 全息面板参数（优化尺寸+偏移，新增边框光晕宽度）
    let panelW = sd.x(320, 720, imgWidth); // 面板加宽，容纳更多数据
    let panelH = sd.y(120, 1600, imgHeight); // 面板加高，分4行显示
    let panelXOffset = sd.x(10, 720, imgWidth);
    let panelYOffset = sd.y(-110, 1600, imgHeight);
    let panelBorderWidth = sd.x(2, 720, imgWidth); // 面板边框宽度

    // 其他偏移参数（保持原有逻辑，优化命名）
    let thornTextX = sd.x(10, 720, imgWidth);
    let thornTextY = sd.y(28, 1600, imgHeight);
    let nodeTextOffset = sd.x(15, 720, imgWidth);
    let strokeRadar = sd.x(7, 720, imgWidth);
    let strokeThorn = sd.x(2.5, 720, imgWidth);
    let strokeEnergy = sd.x(9, 720, imgWidth);
    let strokeLaser = sd.x(3.5, 720, imgWidth);

    // 抛物线参数（保持原有逻辑）
    let parabolaHeightRatio = 4.5;
    let parabolaDenominator = 400;

    // 面板文字排版（优化行间距，容纳4行数据）
    let textYStep = sd.y(24, 1600, imgHeight);
    let textXStart = sd.x(15, 720, imgWidth);
    let textYStart = sd.y(30, 1600, imgHeight);
    let textYStartSmall = sd.y(90, 1600, imgHeight); // 小字号数据起始Y坐标

    // 【荆棘组识别绘制】保持原有逻辑，优化画笔抗锯齿
    paint.setAntiAlias(true); // 新增抗锯齿，线条更顺滑
    paint.setColor(Color.parseColor("#FF6666"));
    paint.setStrokeWidth(strokeRadar);
    let radarDash = new android.graphics.DashPathEffect([sd.x(10, 720, imgWidth), sd.x(3, 720, imgWidth)], 0);
    paint.setPathEffect(radarDash);
    let thornMainColor = Color.parseColor("#FF0000");

    for (let i = 0; i < data.length; i++) {
        let thorns = data[i];
        let startX = thorns.startX, startY = thorns.startY;
        let endX = thorns.endX, endY = thorns.endY;
        let left = startX - offsetX13, top = startY - offsetY68;
        let right = endX + offsetX13, bottom = endY + offsetY58;

        canvas.drawRoundRect(left, top, right, bottom, safeRoundRadius, safeRoundRadius, paint);
        paint.setPathEffect(null);
        paint.setColor(thornMainColor);
        paint.setStrokeWidth(strokeThorn);
        canvas.drawRoundRect(left, top, right, bottom, safeRoundRadius, safeRoundRadius, paint);

        // 荆棘组编号：新增等宽字体+文字阴影，增强科技感
        paint.setStyle(Paint.Style.STROKE);
        paint.setColor(Color.parseColor("#000000"));
        paint.setStrokeWidth(textStrokeWidth);
        paint.setTextSize(textSizeThorn);
        paint.setFakeBoldText(true);
        paint.setTextAlign(Paint.Align.LEFT);
        // paint.setTypeface(Typeface.create(FONT_FAMILY, Typeface.BOLD)); // 等宽加粗字体
        paint.setShadowLayer(TEXT_SHADOW_RADIUS, 1, 1, TEXT_SHADOW_COLOR); // 文字阴影
        canvas.drawText(`[荆棘组${i+1}]`, right + thornTextX, top + thornTextY, paint);

        paint.setStyle(Paint.Style.FILL);
        paint.setColor(Color.parseColor("#FFFFFF"));
        canvas.drawText(`[荆棘组${i+1}]`, right + thornTextX, top + thornTextY, paint);
        paint.setStyle(Paint.Style.STROKE);
        paint.clearShadowLayer(); // 清除阴影，避免影响后续
    }

    // 【抛物线轨迹绘制】保持原有逻辑，优化轨迹顺滑度
    paint.setStrokeCap(Paint.Cap.ROUND);
    paint.setStyle(Paint.Style.STROKE);
    let firstThorn = data[0];
    let pathStartX = sd.xp(playersWidthPps, imgWidth);
    let pathStartY = firstThorn.startY - sd.y(31, 1600, imgHeight);
    let pathEndX = ckltEndX(data);
    let pathEndY = firstThorn.endY - sd.y(31, 1600, imgHeight);
    let dx = pathEndX - pathStartX;
    let dy = pathEndY - pathStartY;

    // 【新增：轨迹点数计算（体现精度）】
    let trajectoryPointCount = Math.abs(dx) > 0 ? Math.abs(dx) : 0; // 轨迹点数=水平距离（逐点绘制）

    if (dx !== 0 && Math.abs(dx) > sd.x(10, 720, imgWidth)) {
        let centerX = pathStartX + dx / 2;
        let topY = pathStartY - Math.max(dx / parabolaHeightRatio, pathEndX / parabolaDenominator);
        let a = (pathEndY - topY) / Math.pow(dx / 2, 2);
        let path = new Path();
        path.moveTo(pathStartX, pathStartY);
        for (let x = pathStartX + 1; x <= pathEndX; x++) {
            let offsetX = x - centerX;
            let y = a * Math.pow(offsetX, 2) + topY;
            path.lineTo(x, y);
        }

        // 能量渐变外层轨迹（保持原有）
        paint.setStrokeWidth(strokeEnergy);
        paint.setPathEffect(null);
        canvas.drawPath(path, paint);
        paint.setShader(null);

        // 激光密虚线内层轨迹（保持原有）
        paint.setColor(Color.parseColor("#0099FF"));
        paint.setStrokeWidth(strokeLaser);
        let laserDash = new android.graphics.DashPathEffect([sd.x(5, 720, imgWidth), sd.x(2, 720, imgWidth)], 0);
        paint.setPathEffect(laserDash);
        canvas.drawPath(path, paint);
        paint.setPathEffect(null);

        // 【粒子节点绘制】保持原有配色+双层光晕，优化抗锯齿
        paint.setStyle(Paint.Style.FILL);
        paint.setAntiAlias(true);

        // 1. 火崽崽（起点）：青绿色节点+坐标显示
        paint.setColor(Color.parseColor("#3300FF99"));
        canvas.drawCircle(pathStartX, pathStartY, glowRadius, paint);
        paint.setColor(Color.parseColor("#6600FF66"));
        canvas.drawCircle(pathStartX, pathStartY, glowRadius - sd.x(3, 720, imgWidth), paint);
        paint.setColor(Color.parseColor("#00FF99"));
        canvas.drawCircle(pathStartX, pathStartY, pointRadius, paint);

        // 2. 能量顶点（核心）：紫蓝色节点+坐标显示
        paint.setColor(Color.parseColor("#339900FF"));
        canvas.drawCircle(centerX, topY, glowRadiusTop, paint);
        paint.setColor(Color.parseColor("#669900FF"));
        canvas.drawCircle(centerX, topY, glowRadiusTop - sd.x(3, 720, imgWidth), paint);
        paint.setColor(Color.parseColor("#9900FF"));
        canvas.drawCircle(centerX, topY, pointRadiusTop, paint);

        // 3. 落点（终点）：橙红色节点+坐标显示
        paint.setColor(Color.parseColor("#33FF3300"));
        canvas.drawCircle(pathEndX, pathEndY, glowRadius, paint);
        paint.setColor(Color.parseColor("#66FF0066"));
        canvas.drawCircle(pathEndX, pathEndY, glowRadius - sd.x(3, 720, imgWidth), paint);
        paint.setColor(Color.parseColor("#FF6600"));
        canvas.drawCircle(pathEndX, pathEndY, pointRadius, paint);

        // 【节点文字+坐标标注】新增3个点位坐标，科技风排版
        paint.setStyle(Paint.Style.STROKE);
        paint.setColor(Color.parseColor("#000000"));
        paint.setStrokeWidth(textStrokeWidth);
        paint.setTextSize(textSizeNode);
        paint.setFakeBoldText(true);
        paint.setTextAlign(Paint.Align.LEFT);
        // paint.setTypeface(Typeface.create(FONT_FAMILY, Typeface.BOLD));
        paint.setShadowLayer(TEXT_SHADOW_RADIUS, 1, 1, TEXT_SHADOW_COLOR);

        // 🔥 火崽崽（起点）：节点文字+坐标（下方偏移，无遮挡）
        let startCoordText = `📍 [火崽崽]`;
        let startCoordDetail = `(X:${Math.round(pathStartX)}, Y:${Math.round(pathStartY)})`;
        canvas.drawText(startCoordText, pathStartX - nodeTextOffset * 3, pathStartY - nodeTextOffset, paint);
        paint.setStyle(Paint.Style.FILL);
        paint.setColor(Color.parseColor("#00FF99"));
        canvas.drawText(startCoordText, pathStartX - nodeTextOffset * 3, pathStartY - nodeTextOffset, paint);
        // 坐标文字（小一号，下方偏移）
        paint.setStyle(Paint.Style.STROKE);
        paint.setColor(Color.parseColor("#000000"));
        paint.setTextSize(textSizeCoord);
        canvas.drawText(startCoordDetail, pathStartX - nodeTextOffset * 3, pathStartY - nodeTextOffset + coordTextOffsetY, paint);
        paint.setStyle(Paint.Style.FILL);
        paint.setColor(Color.parseColor("#00FF99"));
        canvas.drawText(startCoordDetail, pathStartX - nodeTextOffset * 3, pathStartY - nodeTextOffset + coordTextOffsetY, paint);

        // 🚀 落点（终点）：节点文字+坐标（下方偏移）
        let endCoordText = `🎯 [落点]`;
        let endCoordDetail = `(X:${Math.round(pathEndX)}, Y:${Math.round(pathEndY)})`;
        paint.setStyle(Paint.Style.STROKE);
        paint.setColor(Color.parseColor("#000000"));
        paint.setTextSize(textSizeNode);
        canvas.drawText(endCoordText, pathEndX + nodeTextOffset, pathEndY - nodeTextOffset, paint);
        paint.setStyle(Paint.Style.FILL);
        paint.setColor(Color.parseColor("#FF6600"));
        canvas.drawText(endCoordText, pathEndX + nodeTextOffset, pathEndY - nodeTextOffset, paint);
        // 坐标文字
        paint.setStyle(Paint.Style.STROKE);
        paint.setColor(Color.parseColor("#000000"));
        paint.setTextSize(textSizeCoord);
        canvas.drawText(endCoordDetail, pathEndX + nodeTextOffset, pathEndY - nodeTextOffset + coordTextOffsetY, paint);
        paint.setStyle(Paint.Style.FILL);
        paint.setColor(Color.parseColor("#FF6600"));
        canvas.drawText(endCoordDetail, pathEndX + nodeTextOffset, pathEndY - nodeTextOffset + coordTextOffsetY, paint);

        // ⚡ 抛物线顶点：新增文字+坐标（面板右侧，无遮挡）
        let vertexCoordText = `⚡ [顶点]`;
        let vertexCoordDetail = `(X:${Math.round(centerX)}, Y:${Math.round(topY)})`;
        paint.setStyle(Paint.Style.STROKE);
        paint.setColor(Color.parseColor("#000000"));
        paint.setTextSize(textSizeNode);
        canvas.drawText(vertexCoordText, centerX + vertexCoordOffsetX, topY + vertexCoordOffsetY, paint);
        paint.setStyle(Paint.Style.FILL);
        paint.setColor(Color.parseColor("#9900FF"));
        canvas.drawText(vertexCoordText, centerX + vertexCoordOffsetX, topY + vertexCoordOffsetY, paint);
        // 坐标文字
        paint.setStyle(Paint.Style.STROKE);
        paint.setColor(Color.parseColor("#000000"));
        paint.setTextSize(textSizeCoord);
        canvas.drawText(vertexCoordDetail, centerX + vertexCoordOffsetX, topY + vertexCoordOffsetY + coordTextOffsetY, paint);
        paint.setStyle(Paint.Style.FILL);
        paint.setColor(Color.parseColor("#9900FF"));
        canvas.drawText(vertexCoordDetail, centerX + vertexCoordOffsetX, topY + vertexCoordOffsetY + coordTextOffsetY, paint);

        paint.clearShadowLayer(); // 清除阴影

        // 【全息数据面板】增强版：新增4类数据+光晕边框+渐变背景
        let panelPaint = new Paint();
        panelPaint.setAntiAlias(true);
        panelPaint.setStyle(Paint.Style.FILL);
        // 新增：面板渐变背景（深蓝→黑，科技感更强）
        // let panelGradient = new android.graphics.LinearGradient(
        //     panelLeft, panelTop, panelRight, panelBottom,
        //     Color.parseColor("#CC1A36FF"), Color.parseColor("#CC000000"),
        //     android.graphics.Shader.TileMode.CLAMP
        // );
        // panelPaint.setShader(panelGradient);

        // 面板坐标（保持原有贴合顶点）
        let panelLeft = centerX + panelXOffset - sd.x(100, 720, imgWidth);
        let panelTop = topY + panelYOffset - sd.y(100, 1600, imgHeight);
        let panelRight = panelLeft + panelW + sd.x(50, 720, imgWidth);
        let panelBottom = panelTop + panelH;
        let panelRound = sd.x(12, 720, imgWidth); // 增大圆角，更精致

        // 绘制面板底框（渐变背景+大圆角）
        canvas.drawRoundRect(panelLeft, panelTop, panelRight, panelBottom, panelRound, panelRound, panelPaint);
        panelPaint.setShader(null);

        // 新增：面板霓虹边框（科技蓝+细边）
        panelPaint.setStyle(Paint.Style.STROKE);
        panelPaint.setColor(PANEL_GLOW_COLOR);
        panelPaint.setStrokeWidth(panelBorderWidth);
        canvas.drawRoundRect(panelLeft, panelTop, panelRight, panelBottom, panelRound, panelRound, panelPaint);

        // 面板核心数据计算（原有+新增）
        let jumpDist = Math.abs(dx).toFixed(0);
        let pressTime = ckltJumpToXTime(pathEndX).toFixed(1);
        let jumpSpeed = (jumpDist / pressTime * 1000).toFixed(1);
        let vertexHeight = Math.abs(pathStartY - topY).toFixed(0);
        let thornCount = data.length;
        // 新增科技数据
        let currentTime = new Date().toLocaleTimeString().replace(/\//g, ":"); // 当前时间（简洁格式）
        let screenRes = `${imgWidth}×${imgHeight}`; // 屏幕分辨率
        let timestamp = Math.floor(Date.now() / 1000); // 时间戳（秒级，科技感）

        // 绘制面板文字（4行数据，图标前缀+等宽字体）
        paint.setStyle(Paint.Style.STROKE);
        paint.setColor(Color.parseColor("#000000"));
        paint.setStrokeWidth(textStrokeWidth);
        paint.setTextSize(textSizePanel);
        paint.setFakeBoldText(true);
        paint.setTextAlign(Paint.Align.LEFT);
        // paint.setTypeface(Typeface.create(FONT_FAMILY, Typeface.BOLD));
        paint.setShadowLayer(TEXT_SHADOW_RADIUS, 1, 1, TEXT_SHADOW_COLOR);

        let panelTextX = panelLeft + textXStart;
        let panelTextY = panelTop + textYStart;

        // 第1行：核心操作参数（长按+距离）
        let line1 = `⏱️ 长按：${pressTime}ms | 📏 距离：${jumpDist}px`;
        canvas.drawText(line1, panelTextX, panelTextY, paint);
        paint.setStyle(Paint.Style.FILL);
        paint.setColor(Color.parseColor("#80E5FF"));
        canvas.drawText(line1, panelTextX, panelTextY, paint);

        // 第2行：跳跃性能参数（速度+高度）
        paint.setStyle(Paint.Style.STROKE);
        paint.setColor(Color.parseColor("#000000"));
        let line2 = `⚡ 速度：${jumpSpeed}px/s | 📈 高度：${vertexHeight}px`;
        canvas.drawText(line2, panelTextX, panelTextY + textYStep, paint);
        paint.setStyle(Paint.Style.FILL);
        paint.setColor(Color.parseColor("#80E5FF"));
        canvas.drawText(line2, panelTextX, panelTextY + textYStep, paint);

        // 第3行：场景数据（荆棘组+轨迹点数）
        paint.setStyle(Paint.Style.STROKE);
        paint.setColor(Color.parseColor("#000000"));
        let line3 = `🌵 荆棘组：${thornCount}个 | 🔍 轨迹点：${trajectoryPointCount.toFixed(2)}个`;
        canvas.drawText(line3, panelTextX, panelTextY + textYStep * 2, paint);
        paint.setStyle(Paint.Style.FILL);
        paint.setColor(Color.parseColor("#80E5FF"));
        canvas.drawText(line3, panelTextX, panelTextY + textYStep * 2, paint);

        // 第4行：科技感辅助数据（时间戳+分辨率）
        paint.setStyle(Paint.Style.STROKE);
        paint.setColor(Color.parseColor("#000000"));
        paint.setTextSize(textSizePanelSmall); // 小字号，避免拥挤
        let line4 = `🗓️ 时间：${currentTime}`;
        canvas.drawText(line4, panelTextX, panelTextY + textYStep * 3, paint);
        paint.setStyle(Paint.Style.FILL);
        paint.setColor(Color.parseColor("#80E5FF"));
        canvas.drawText(line4, panelTextX, panelTextY + textYStep * 3, paint);

        // 画笔最终复位：恢复默认样式，避免外部调用受影响
        paint.clearShadowLayer();
        paint.setStyle(Paint.Style.STROKE);
        paint.setStrokeWidth(sd.x(1, 720, imgWidth));
        paint.setColor(Color.parseColor("#000000"));
        // paint.setTypeface(Typeface.DEFAULT);
        paint.setFakeBoldText(false);
        paint.setTextAlign(Paint.Align.LEFT);
        paint.setAntiAlias(false);
    }

    // 【最终返回】画布转Mat再转Image，保留原兼容逻辑
    let imgMat = canvas.toImage().getMat();
    return images.matToImage(imgMat);
}




// 计算跳跃到的坐标
function ckltEndX(data) {
    //空白区域判断
    if (data.length == 0) {
        toast("没有识别到荆棘组，执行跳跃空白");
        return device.width - random(sd.xp(134 / 720), sd.xp(231 / 720));

    }

    // 获取最后差值x 和 最后坐标x
    let endItpls = null;
    let endX = null;
    if (data.length == 1) {
        // 最后差值
        endItpls = device.width - data[0].endX;

        // 最后坐标x
        endX = device.width;

    } else {
        // 最后差值
        endItpls = data[1].startX - data[0].endX;

        // 最后坐标x
        endX = data[1].startX;


    }

    // 判断是否能跳跃过去
    if (endItpls >= sd.xp(playersWidthPps) * 1.25) {
        // 可以跳跃过去
        return endX - sd.xp(playersWidthPps) / 1.8;

    } else {
        // 跳跃空白区域
        return data[0].startX - sd.xp(playersWidthPps) / 1.8;

    }

    // 无效返回
    return null;
}

// 计算跳到指定位置的长按时间
function ckltJumpToXTime(endX) {
    // 校验坐标有效性，避免非数字坐标计算出异常时长
    if (typeof endX !== 'number' || endX <= 0) return 0;
    return (sd.xpps(endX) - playersXPps) * 800;
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


// 单次执行脚本
function run() {
    // 截图
    let img = captureScreen();

    // let startTime = Date.now();

    script.mainRun(img);

    // let text = `用时: ${Date.now() - startTime} ms`;
    // toast(text)

}


/**
 * 游戏辅助核心循环执行函数【Auto.js Pro 专属】
 * 核心定位：实现游戏自动化无限循环，覆盖从画面识别到操作执行的全流程，无需人工干预
 * 核心流程：截图捕获游戏画面 → 识别荆棘位置数据 → 绘制跳跃轨迹 → 执行自动跳跃 → 检测复活按钮并触发
 * 状态管理：通过 cycleRun.state 控制循环启停，外部可直接修改该状态变量实现控制
 * - cycleRun.state = 0：循环停止（默认初始状态，防止脚本启动即自动执行）
 * - cycleRun.state = 1：循环运行（启动后持续执行，直至状态改为0）
 * 执行特性：关键的轨迹绘制步骤通过子线程实现解耦，避免阻塞主循环的跳跃和检测逻辑，保证操作流畅性
 * 依赖函数说明：
 * - captureScreen()：Auto.js 内置截图函数，用于获取当前游戏画面
 * - getThornsData(img)：自定义荆棘识别函数，传入截图对象，返回荆棘位置数据数组（格式需与绘制/跳跃函数适配）
 * - ckltEndX(data)：自定义跳跃终点计算函数，传入荆棘数据，返回跳跃目标X坐标
 * - ckltJumpToXTime(endX)：自定义跳跃时长计算函数，传入目标X坐标，返回所需跳跃时间（单位：毫秒）
 * - jumpToX(endX)：自定义自动跳跃函数，传入目标X坐标，执行跳跃操作
 * - drawImg(img, data, options)：自定义轨迹绘制函数，传入截图、荆棘数据和配置，返回含绘制结果的对象
 * - getResurgenceButton()：自定义复活按钮识别函数，返回按钮对象（含 clickCenter() 点击方法）
 * - openGetScreenPermissions()：Auto.js 权限申请函数，截图权限未获取时触发
 */
function cycleRun() {
    // 启动子线程执行核心循环，避免阻塞主线程，保证脚本整体响应性
    threads.start(function() {
        cycleRun.state = 1; // 线程启动后，将循环状态设为【运行中】
        let loopCount = 0; // 无荆棘数据时的循环计数器，用于触发复活检测
        // 复活检测触发阈值：当连续 N 次循环未识别到荆棘数据时，触发复活按钮检测（可根据游戏复活动画时长调整）
        const RESURGENCE_CHECK_INTERVAL = 3; 

        // 主循环：只要循环状态为1（运行中），就持续执行自动化流程
        while (cycleRun.state) {
            // 1. 截图捕获游戏画面：获取当前屏幕帧，作为后续识别的基础
            let img = captureScreen();
            // 截图失败处理：未获取到截图权限时，提示并触发权限申请
            if (!img) {
                toast("未获取到截图权限，无法执行游戏辅助");
                openGetScreenPermissions(); // 打开截图权限申请页面
                continue; // 跳过当前循环，等待权限申请完成后重新尝试
            }
            
            // 2. 识别荆棘位置数据：调用自定义识别函数，从截图中提取荆棘坐标/范围数据
            let data = getThornsData(img);
            // 无荆棘数据处理：未识别到荆棘时，累计计数器并检测复活
            if (data.length == 0) {
                loopCount++; // 累计无数据循环次数
                // 计数器达到阈值时，触发复活按钮检测
                if (loopCount >= RESURGENCE_CHECK_INTERVAL) {
                    let resurgenceButton = getResurgenceButton(); // 识别复活按钮位置
                    // 识别到复活按钮时，执行点击并等待复活动画
                    if (resurgenceButton) {
                        resurgenceButton.clickCenter(); // 点击复活按钮中心位置，确保触发
                        toast("自动复活中..."); // 提示用户当前正在执行复活操作
                        sleep(200); // 复活动画持续时间（200毫秒），避免后续操作干扰复活
                        loopCount = 0; // 重置无数据计数器，重新开始累计
                    }
                    continue; // 跳过当前循环剩余步骤，进入下一轮检测
                }
            }

            // 3. 计算跳跃参数：基于荆棘数据确定跳跃终点和所需时长
            let endX = ckltEndX(data); // 计算跳跃的目标X坐标（横向跳跃核心参数）
            let jumpTime = ckltJumpToXTime(endX); // 计算完成该跳跃所需的时间（控制跳跃力度）
            let sleepTime = (jumpTime * sleepIntervalMultiples); // 跳跃后等待时长：基于跳跃时间的2.25倍 ( 默认 )，确保跳跃动作完成

            // 4. 执行自动跳跃：当存在有效目标X坐标时，触发跳跃操作
            if (endX) {
                jumpToX(endX); // 调用自定义跳跃函数，执行横向跳跃
            }

            // 5. 子线程绘制轨迹：单独启动线程绘制跳跃轨迹，避免阻塞主循环的睡眠和下一轮识别
            threads.start(() => {
                // 确保截图和荆棘数据有效时才执行绘制（避免空指针错误）
                if (img && data) {
                    // 调用绘制函数，clear: true 表示绘制前清空之前的轨迹
                    let result = drawImg(img, data, {
                        clear: true
                    });
                    // 绘制成功后，显示绘制结果 bitmap，并在指定时间后释放
                    if (result && result.bitmap) {
                        showBitmap = result.bitmap; // 将绘制结果赋值给全局变量，用于画面显示
                        // 轨迹显示时长：跳跃时间的0.8倍，避免轨迹显示过久影响视觉
                        setTimeout(() => {
                            showBitmap = null; // 释放 bitmap 资源，防止内存泄漏
                        }, jumpTime * 0.8);
                    }
                }
            });

            // 6. 循环等待：根据跳跃状态设置不同的等待时长，平衡效率和稳定性
            if (endX >= 0) {
                sleep(sleepTime); // 有效跳跃后，按计算的时长等待
                // 短时跳跃补充等待：当跳跃后等待时长≤450毫秒时，额外补充68毫秒，防止跳跃不充分
                if (sleepTime <= 450) {
                    sleep(68);
                }
            } else {
                sleep(10); // 无有效跳跃目标时，兜底等待10毫秒，防止CPU空转飙升
            }
        }
    });
}
// 初始化循环状态为【停止】（0=停止，1=运行）
// 注意：脚本启动时不会自动执行循环，需通过外部逻辑将 cycleRun.state 设为1启动（如按钮点击、延时启动等）
cycleRun.state = 0;



module.exports = this;