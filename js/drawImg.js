// 绘制
/* 预创建可重用的绘制对象 */
const reusablePaints = {
    borderPaint: new Paint(),
    textPaint: new Paint(),
    trajectoryPaint: new Paint()
};

// 初始化绘制对象属性（一次设置，多次重用）
function initPaints() {
    for (let key in reusablePaints) {
        let paint = reusablePaints[key];
        paint.setAntiAlias(true);
        paint.setDither(true);
    }
    reusablePaints.borderPaint.setStyle(Paint.Style.STROKE);
    reusablePaints.textPaint.setStyle(Paint.Style.FILL);
    reusablePaints.trajectoryPaint.setStyle(Paint.Style.STROKE);
}
initPaints();


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

    if (img && img != undefined && img != null) {
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
    let image = canvas.toImage();
    if (img) img.recycle();
    return image;
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
    let borderPaint = reusablePaints.borderPaint;
    // borderPaint.setColor(Color.parseColor(colors[index % colors.length]));

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
    let pathEndX = data.endX;
    let pathEndY = firstThorn.endY - sd.y(31, 1600, imgHeight);
    let dx = pathEndX - pathStartX;

    if (dx !== 0 && Math.abs(dx) > sd.x(10, 720, imgWidth)) {
        let centerX = pathStartX + dx / 2;
        let topY = pathStartY - Math.max(dx / 6, pathEndX / 400);

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
    let pressTime = data.pressTime.toFixed(3);
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



module.exports = this;
