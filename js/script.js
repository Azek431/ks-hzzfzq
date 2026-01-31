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

// 基础数值
// 玩家中心x占比
let playersXPps = 154.5 / 720;

// 人物宽度 --2026-1-30 09:43 08 新增数据
let playersWidthPps = 143 / 720;


// 荆棘中心y占比
let thornsCenterYPps = 1000 / 1600;

// 荆棘宽度占比
let thornsWidthPps = 87 / 720;

// 分数显示文字中心y占比  --2026-1-31 21:45:37 新增
let scoreCenterYPps = 147 / 1600;



/**
 * 获取荆棘组位置数据（基于图像像素识别，优化checkX初始检测位置）
 * @param {Image} img - 游戏画面截图（需包含荆棘区域，依赖bitmap属性）
 * @returns {Array} 荆棘组数组，每项含startX/startY/endX/endY（实际画面坐标）；异常场景返回空数组
 * @note 核心逻辑：从checkX指定的初始位置开始，扫描指定Y行像素，通过「红≤155且绿+蓝≥400」颜色特征识别荆棘，按间隔分组
 */
function getThornsData(img) {
    // 边界强校验：过滤空图、无bitmap、无效尺寸等异常场景，避免崩溃
    if (!img || !img.bitmap) return [];
    const bitmap = img.bitmap;
    const width = bitmap.getWidth();  // 画面实际宽度
    const height = bitmap.getHeight();// 画面实际高度
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
    let lastThornX = -1;    // 上一个识别到的荆棘像素X坐标
    let emptyCount = 0;     // 连续空像素计数（用于判定荆棘组结束）

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
                emptyCount = 0;    // 重置空像素计数
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

    // 返回识别到的荆棘组位置数据
    return thornsList;
}




// 获取当前游戏基础信息
function getGameInformation(img) {
    /*
        正在研究中
        
    */
    
    
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
 * 全息科技风绘制核心函数 - 荆棘组识别框+抛物线跳跃轨迹
 * @param {Image} img - 底图（游戏画面），传图则绘制，不传新建空白画布
 * @param {Array} data - 荆棘组数据数组，项含startX/startY/endX/endY坐标
 * @param {Object} options - 配置项 {clear:Boolean} 是否清空画布
 * @returns {Image} 绘制完成的图像
 * @compatible Auto.js全版本/安卓Canvas原生/零报错
 * @adaptation 所有像素尺寸已对接sd屏幕适配函数，全机型兼容
 * @update 能量峰文字替换为全息数据面板，面板贴合抛物线顶点，排版更优
 */
function drawImg(img, data, options) {
    // 【初始化区】配置兜底+画布+画笔基础设置
    options = options || {
        clear: false
    };
    let canvas = img ? new Canvas(img) : new Canvas();
    // 新增：获取图片宽高（x方向用宽度，y方向用高度），无图时兜底设备尺寸
    let imgWidth = img ? img.getWidth() : device.width;
    let imgHeight = img ? img.getHeight() : device.height;
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
    // 荆棘组框偏移量（基准13/68/58）- x用imgWidth，y用imgHeight
    let offsetX13 = sd.x(13, 720, imgWidth);
    let offsetY68 = sd.y(68, 1600, imgHeight);
    let offsetY58 = sd.y(58, 1600, imgHeight);
    // 安全圆角（安卓Canvas[0,16]限制，基准8）- x方向用imgWidth
    let safeRoundRadius = sd.x(8, 720, imgWidth);
    // 粒子节点：光晕/实心半径（基准12/5），顶点节点稍大更醒目- x方向用imgWidth
    let glowRadius = sd.x(12, 720, imgWidth);
    let pointRadius = sd.x(5, 720, imgWidth);
    let glowRadiusTop = glowRadius + sd.x(3, 720, imgWidth);
    let pointRadiusTop = pointRadius + sd.x(2, 720, imgWidth);
    // 文字：描边宽度/各层级字号（基准1.5/24/26/20）- x方向用imgWidth
    let textStrokeWidth = sd.x(1.5, 720, imgWidth);
    let textSizeThorn = sd.x(24, 720, imgWidth); // 荆棘组编号字号
    let textSizeNode = sd.x(26, 720, imgWidth); // 火崽崽/落点标注字号
    let textSizePanel = sd.x(20, 720, imgWidth); // 面板数据字号
    // 全息面板：宽高/偏移（基准180/80）- 宽用imgWidth，高/偏移y用imgHeight
    let panelW = sd.x(300, 720, imgWidth);
    let panelH = sd.y(80, 1600, imgHeight);
    let panelXOffset = sd.x(10, 720, imgWidth); // 面板相对顶点X偏移（右移）
    let panelYOffset = sd.y(-100, 1600, imgHeight); // 面板相对顶点Y偏移（下移）
    // 绘制偏移：荆棘组编号/节点文字（基准10/28/15）- x用imgWidth，y用imgHeight
    let thornTextX = sd.x(10, 720, imgWidth);
    let thornTextY = sd.y(28, 1600, imgHeight);
    let nodeTextOffset = sd.x(15, 720, imgWidth);
    // 画笔宽度：雷达框/荆棘组主框/能量轨迹/激光轨迹（基准7/2.5/9/3.5）- x方向用imgWidth
    let strokeRadar = sd.x(7, 720, imgWidth);
    let strokeThorn = sd.x(2.5, 720, imgWidth);
    let strokeEnergy = sd.x(9, 720, imgWidth);
    let strokeLaser = sd.x(3.5, 720, imgWidth);
    // 抛物线参数：高度系数（基准4.5，拉高轨迹）/分母（基准400）
    let parabolaHeightRatio = 4.5; // 系数越小，抛物线越高
    let parabolaDenominator = 400;
    // 面板文字：行间距（基准20）/内边距（基准15/18）- x用imgWidth，y用imgHeight
    let textYStep = sd.y(20, 1600, imgHeight);
    let textXStart = sd.x(15, 720, imgWidth);
    let textYStart = sd.y(24, 1600, imgHeight);
    // 【荆棘组识别绘制】雷达扫描外层+正红主框+黑边白字编号
    // 雷达扫描框配置：浅红霓虹+粗边+疏密虚线- x方向用imgWidth
    paint.setColor(Color.parseColor("#FF6666"));
    paint.setStrokeWidth(strokeRadar);
    let radarDash = new android.graphics.DashPathEffect([sd.x(10, 720, imgWidth), sd.x(3, 720, imgWidth)], 0);
    paint.setPathEffect(radarDash);
    // 荆棘组主框配置：正红霓虹+细边
    let thornMainColor = Color.parseColor("#FF0000");
    // 遍历绘制所有荆棘组
    for (let i = 0; i < data.length; i++) {
        let thorns = data[i];
        let startX = thorns.startX,
            startY = thorns.startY;
        let endX = thorns.endX,
            endY = thorns.endY;
        // 荆棘组框最终坐标
        let left = startX - offsetX13,
            top = startY - offsetY68;
        let right = endX + offsetX13,
            bottom = endY + offsetY58;
        // 1. 绘制雷达扫描外层框（安全圆角）
        canvas.drawRoundRect(left, top, right, bottom, safeRoundRadius, safeRoundRadius, paint);
        paint.setPathEffect(null); // 清除虚线，避免影响后续
        // 2. 绘制荆棘组主轮廓框（安全圆角）
        paint.setColor(thornMainColor);
        paint.setStrokeWidth(strokeThorn);
        canvas.drawRoundRect(left, top, right, bottom, safeRoundRadius, safeRoundRadius, paint);
        // 3. 绘制荆棘组编号：黑边白字+加粗+左对齐（全息数字风格）
        paint.setStyle(Paint.Style.STROKE);
        paint.setColor(Color.parseColor("#000000"));
        paint.setStrokeWidth(textStrokeWidth);
        paint.setTextSize(textSizeThorn);
        paint.setFakeBoldText(true);
        paint.setTextAlign(Paint.Align.LEFT);
        // 编号位置：荆棘组框右上角，不遮挡主体
        canvas.drawText(`[荆棘组${i+1}]`, right + thornTextX, top + thornTextY, paint);
        // 白色填充层，保证所有背景可读
        paint.setStyle(Paint.Style.FILL);
        paint.setColor(Color.parseColor("#FFFFFF"));
        canvas.drawText(`[荆棘组${i+1}]`, right + thornTextX, top + thornTextY, paint);
        // 画笔复位为描边，准备下一个绘制
        paint.setStyle(Paint.Style.STROKE);
    }
    // 【抛物线轨迹绘制】拉高轨迹+能量渐变外层+激光虚线内层
    paint.setStrokeCap(Paint.Cap.ROUND);
    paint.setStyle(Paint.Style.STROKE);
    let firstThorn = data[0];
    // 抛物线基础坐标（对接适配，保留原逻辑）- x用imgWidth，y用imgHeight
    let pathStartX = sd.xp(playersWidthPps, imgWidth);
    let pathStartY = firstThorn.startY - sd.y(31, 1600, imgHeight);
    let pathEndX = ckltEndX(data);
    let pathEndY = firstThorn.endY - sd.y(31, 1600, imgHeight);
    let dx = pathEndX - pathStartX;
    let dy = pathEndY - pathStartY;
    // 防错判断：起点终点不重叠+水平距离>10才绘制，过滤无效轨迹- x用imgWidth
    if (dx !== 0 && Math.abs(dx) > sd.x(10, 720, imgWidth)) {
        // 抛物线核心算法：系数4.5拉高轨迹，适配全机型
        let centerX = pathStartX + dx / 2;
        let topY = pathStartY - Math.max(dx / parabolaHeightRatio, pathEndX / parabolaDenominator);
        let a = (pathEndY - topY) / Math.pow(dx / 2, 2);
        // 生成抛物线路径：逐点连线，保证轨迹顺滑
        let path = new Path();
        path.moveTo(pathStartX, pathStartY);
        for (let x = pathStartX + 1; x <= pathEndX; x++) {
            let offsetX = x - centerX;
            let y = a * Math.pow(offsetX, 2) + topY;
            path.lineTo(x, y);
        }
        // 1. 能量渐变外层轨迹：青蓝→深蓝，模拟能量波流动
        // let energyGradient = new android.graphics.LinearGradient(
        //     pathStartX, pathStartY, centerX, topY,
        //     Color.parseColor("#66CCFF"), Color.parseColor("#0000FF"),
        //     android.graphics.Shader.TileMode.CLAMP
        // );
        // paint.setShader(energyGradient);
        paint.setStrokeWidth(strokeEnergy);
        paint.setPathEffect(null);
        canvas.drawPath(path, paint);
        paint.setShader(null); // 清除着色器，避免串色
        // 2. 激光密虚线内层轨迹：亮蓝+密虚线，模拟瞄准线- x用imgWidth
        paint.setColor(Color.parseColor("#0099FF"));
        paint.setStrokeWidth(strokeLaser);
        let laserDash = new android.graphics.DashPathEffect([sd.x(5, 720, imgWidth), sd.x(2, 720, imgWidth)], 0);
        paint.setPathEffect(laserDash);
        canvas.drawPath(path, paint);
        paint.setPathEffect(null); // 清除虚线，准备绘制节点
        // 【粒子节点绘制】双层光晕+配色区分，顶点节点放大更醒目- x用imgWidth
        paint.setStyle(Paint.Style.FILL);
        // 火崽崽（起点）：青绿色双层光晕+实心点
        paint.setColor(Color.parseColor("#3300FF99"));
        canvas.drawCircle(pathStartX, pathStartY, glowRadius, paint);
        paint.setColor(Color.parseColor("#6600FF66"));
        canvas.drawCircle(pathStartX, pathStartY, glowRadius - sd.x(3, 720, imgWidth), paint);
        paint.setColor(Color.parseColor("#00FF99"));
        canvas.drawCircle(pathStartX, pathStartY, pointRadius, paint);
        // 能量顶点（核心）：紫蓝色双层光晕+放大实心点，视觉焦点
        paint.setColor(Color.parseColor("#339900FF"));
        canvas.drawCircle(centerX, topY, glowRadiusTop, paint);
        paint.setColor(Color.parseColor("#669900FF"));
        canvas.drawCircle(centerX, topY, glowRadiusTop - sd.x(3, 720, imgWidth), paint);
        paint.setColor(Color.parseColor("#9900FF"));
        canvas.drawCircle(centerX, topY, pointRadiusTop, paint);
        // 落点（终点）：橙红色双层光晕+实心点
        paint.setColor(Color.parseColor("#33FF3300"));
        canvas.drawCircle(pathEndX, pathEndY, glowRadius, paint);
        paint.setColor(Color.parseColor("#66FF0066"));
        canvas.drawCircle(pathEndX, pathEndY, glowRadius - sd.x(3, 720, imgWidth), paint);
        paint.setColor(Color.parseColor("#FF6600"));
        canvas.drawCircle(pathEndX, pathEndY, pointRadius, paint);
        // 【节点文字标注】仅保留火崽崽/落点，能量峰替换为面板，排版更优
        paint.setStyle(Paint.Style.STROKE);
        paint.setColor(Color.parseColor("#000000"));
        paint.setStrokeWidth(textStrokeWidth);
        paint.setTextSize(textSizeNode);
        paint.setFakeBoldText(true);
        paint.setTextAlign(Paint.Align.LEFT);
        // 火崽崽文字：左上方偏移，避开面板和节点
        canvas.drawText(`[火崽崽]`, pathStartX - nodeTextOffset * 3, pathStartY - nodeTextOffset, paint);
        paint.setStyle(Paint.Style.FILL);
        paint.setColor(Color.parseColor("#00FF99"));
        canvas.drawText(`[火崽崽]`, pathStartX - nodeTextOffset * 3, pathStartY - nodeTextOffset, paint);
        // 落点文字：右上方偏移，无遮挡
        paint.setStyle(Paint.Style.STROKE);
        paint.setColor(Color.parseColor("#000000"));
        canvas.drawText(`[落点]`, pathEndX + nodeTextOffset, pathEndY - nodeTextOffset, paint);
        paint.setStyle(Paint.Style.FILL);
        paint.setColor(Color.parseColor("#FF6600"));
        canvas.drawText(`[落点]`, pathEndX + nodeTextOffset, pathEndY - nodeTextOffset, paint);
        // 【全息数据面板】替换原能量峰文字，贴合顶点右侧，精致紧凑无遮挡
        let panelPaint = new Paint();
        panelPaint.setAntiAlias(true);
        panelPaint.setStyle(Paint.Style.FILL);
        panelPaint.setColor(Color.parseColor("#99000000")); // 半透黑全息质感，稍加深更醒目
        // 面板坐标：贴合抛物线顶点右侧+微下移，原能量峰位置，无任何遮挡
        let panelLeft = centerX + panelXOffset;
        let panelTop = topY + panelYOffset;
        let panelRight = panelLeft + panelW;
        let panelBottom = panelTop + panelH;
        // 绘制面板底框：大圆角更精致（基准10），贴合科技风- x用imgWidth
        let panelRound = sd.x(10, 720, imgWidth);
        canvas.drawRoundRect(panelLeft, panelTop, panelRight, panelBottom, panelRound, panelRound, panelPaint);
        // 面板多维度实战数据计算，保留核心实用数据
        let jumpDist = Math.abs(dx).toFixed(0); // 水平跳跃距离
        let pressTime = ckltJumpToXTime(pathEndX).toFixed(1); // 核心长按时长
        let jumpSpeed = (jumpDist / pressTime * 1000).toFixed(1); // 跳跃速度(px/s)
        let vertexHeight = Math.abs(pathStartY - topY).toFixed(0); // 顶点高度
        let thornCount = data.length; // 荆棘组总数
        // 绘制面板文字：黑边+科技浅蓝填充，分行紧凑，适配面板尺寸
        paint.setStyle(Paint.Style.STROKE);
        paint.setColor(Color.parseColor("#000000"));
        paint.setStrokeWidth(textStrokeWidth);
        paint.setTextSize(textSizePanel);
        paint.setFakeBoldText(true);
        paint.setTextAlign(Paint.Align.LEFT);
        // 面板文字起始坐标：内边距，不贴边更精致
        let panelTextX = panelLeft + textXStart;
        let panelTextY = panelTop + textYStart;
        // 第一行：核心操作参数（长按时长+水平距离）
        canvas.drawText(`长按：${pressTime}ms | 距离：${jumpDist}px`, panelTextX, panelTextY, paint);
        paint.setStyle(Paint.Style.FILL);
        paint.setColor(Color.parseColor("#80E5FF")); // 科技浅蓝，比原蓝更通透
        canvas.drawText(`长按：${pressTime}ms | 距离：${jumpDist}px`, panelTextX, panelTextY, paint);
        // 第二行：跳跃性能（速度+顶点高度）
        paint.setStyle(Paint.Style.STROKE);
        paint.setColor(Color.parseColor("#000000"));
        canvas.drawText(`速度：${jumpSpeed}px/s | 高度：${vertexHeight}px`, panelTextX, panelTextY + textYStep, paint);
        paint.setStyle(Paint.Style.FILL);
        paint.setColor(Color.parseColor("#80E5FF"));
        canvas.drawText(`速度：${jumpSpeed}px/s | 高度：${vertexHeight}px`, panelTextX, panelTextY + textYStep, paint);
        // 第三行：场景信息（荆棘组总数）
        paint.setStyle(Paint.Style.STROKE);
        paint.setColor(Color.parseColor("#000000"));
        canvas.drawText(`当前荆棘组：${thornCount}个`, panelTextX, panelTextY + textYStep * 2, paint);
        paint.setStyle(Paint.Style.FILL);
        paint.setColor(Color.parseColor("#80E5FF"));
        canvas.drawText(`当前荆棘组：${thornCount}个`, panelTextX, panelTextY + textYStep * 2, paint);
        // 画笔最终复位：避免外部调用受当前样式影响- x用imgWidth
        paint.setStyle(Paint.Style.STROKE);
        paint.setStrokeWidth(sd.x(1, 720, imgWidth));
        paint.setColor(Color.parseColor("#000000"));
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
 * 游戏辅助核心循环执行函数
 * 核心流程：截图→荆棘组识别→轨迹绘制→自动跳跃→复活检测 无限循环
 * 状态管理：cycleRun.state - 0=停止/1=运行，控制循环启停
 * 执行特性：关键步骤子线程解耦，避免阻塞主循环，原逻辑完全保留
 */
function cycleRun() {
    // 启动核心循环子线程，避免阻塞主线程/界面卡顿
    threads.start(function() {
        // 设置循环运行状态，标记为启动中
        cycleRun.state = 1;
        // 无限循环：仅当运行状态为true时持续执行，置0则停止
        while (cycleRun.state) {
            // ===================== 1. 屏幕截图获取 + 权限校验 =====================
            let img = captureScreen();
            // 截图失败：弹提示并引导打开屏幕截图权限
            if (!img) {
                toast("没有获取到图片，是不是忘给获取屏幕权限了");
                openGetScreenPermissions();
            }

            // ===================== 2. 识别荆棘组数据：基于当前截图计算荆棘组坐标 =====================
            let data = getThornsData(img);

            let endX = ckltEndX(data); // 计算跳跃目标落点X坐标
            let jumpTime = ckltJumpToXTime(endX); // 长按时间
            let sleepTime = jumpTime * 2 + 143; // 赋值等待时间

            // ===================== 3. 全息轨迹绘制：有有效截图+荆棘组数据时执行（子线程） =====================
            if (data && img) {
                showBitmap = null; // 绘制前清空旧轨迹，避免画面残留
                // 绘制子线程：不阻塞主循环的跳跃/复活逻辑
                threads.start(() => {
                    // 调用全息绘制函数，清空画布后绘制新轨迹
                    let bitmap = drawImg(img, data, {
                        clear: true
                    }).bitmap;
                    // 绘制成功则更新显示的bitmap
                    if (bitmap) {
                        showBitmap = bitmap;
                        // 300ms后自动清空绘制，防止轨迹遮挡游戏画面
                        setTimeout(function() {
                            showBitmap = null;
                        }, jumpTime / 1.1);
                    }
                });
            }

            // ===================== 4. 复活检测：自动点击复活按钮，实现无人值守 =====================
            let resurgenceButton = getResurgenceButton();
            if (resurgenceButton) {
                resurgenceButton.clickCenter();
                toast("点击复活按钮");
                sleep(50);

            }

            // 获取当前游戏基础信息
            // getGameInformation();

            // ===================== 5. 自动跳跃：执行长按屏幕跳跃逻辑 =====================
            jumpToX(endX); // 执行跳跃操作
            // 有有效落点时，按计算时长休眠，避免连续跳跃（兜底+68ms）
            if (endX) {
                sleep(sleepTime);

            }

        }
    });
}
// 初始化循环状态为【停止】，防止脚本启动即自动执行（0=停止，1=运行）
cycleRun.state = 0;



module.exports = this;