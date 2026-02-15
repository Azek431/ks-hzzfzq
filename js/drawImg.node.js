// 提示: 因为犀牛引擎 ( Rhino )的绘制函数过大，无法重构 所以目前版本先不重构绘制函数 调用犀牛引擎绘制即可

/**
 * 原生科技感绘制 (Bloom 模拟特效)
 */
async function drawImg(img, data) {
    if (!img || img.isRecycled) return null;

    // 1. 创建画布
    let canvas = new images.Canvas(img);
    let width = img.width;
    let height = img.height;

    // 2. 初始化超酷画笔
    let paint = new images.Paint();
    paint.setAntiAlias(true); // 抗锯齿开启

    const neonBlue = "#00f2ff";
    const neonPurple = "#7d00ff";

    try {
        // --- A. 绘制荆棘组：霓虹 Bloom 特效 ---
        if (data.thorns && data.thorns.length > 0) {
            data.thorns.forEach((thorn, index) => {
                let x = thorn.startX, y = thorn.startY;
                let w = thorn.endX - x, h = thorn.endY - y;

                // --- 模拟发光 (Bloom) ---
                // 第一层：外围大范围淡色虚影
                paint.setStrokeWidth(12);
                paint.setColor(colors.parseColor("#3300f2ff")); // 低透明度
                canvas.drawRect(x, y, x + w, y + h, paint);

                // 第二层：核心高亮细线
                paint.setStrokeWidth(3);
                paint.setColor(colors.parseColor(neonBlue));
                canvas.drawRect(x, y, x + w, y + h, paint);

                // --- 科技感护角 ---
                drawCyberCorners(canvas, paint, x, y, w, h, 25);
            });
        }

        // --- B. 抛物线：虚线流光 ---
        if (data.endX) {
            paint.setStyle(images.Paint.Style.STROKE);
            paint.setStrokeWidth(5);
            
            // 设置虚线效果 (DashPathEffect)
            // 参数：[实线长度, 间隔长度], 偏移量
            paint.setPathEffect(new android.graphics.DashPathEffect([20, 10], 0));
            paint.setColor(colors.parseColor(neonPurple));

            let path = new android.graphics.Path();
            let startX = 100, startY = 800; // 假设起点
            // 绘制二次方贝塞尔曲线
            path.moveTo(startX, startY);
            path.quadTo((startX + data.endX) / 2, startY - 300, data.endX, startY);
            
            canvas.drawPath(path, paint);
            paint.setPathEffect(null); // 重置
        }

        // --- C. 文字面板 ---
        paint.setStyle(images.Paint.Style.FILL);
        paint.setTextSize(24);
        paint.setFakeBoldText(true);
        canvas.drawText("SYSTEM ACTIVE // TARGET LOCKED", 50, 100, paint);

        // 3. 导出结果
        return canvas.toImage();

    } catch (e) {
        console.error("原生 Canvas 绘制异常:", e);
        return null;
    }
}

/**
 * 绘制赛博朋克风格的 L 型护角
 */
function drawCyberCorners(canvas, paint, x, y, w, h, len) {
    paint.setStrokeWidth(6);
    // 左上角
    canvas.drawLine(x, y, x + len, y, paint);
    canvas.drawLine(x, y, x, y + len, paint);
    // 右下角
    canvas.drawLine(x + w, y + h, x + w - len, y + h, paint);
    canvas.drawLine(x + w, y + h, x + w, y + h - len, paint);
}
