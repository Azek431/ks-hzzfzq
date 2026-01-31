"auto";

// 打开悬浮窗
ui.openWindow.setOnClickListener(function(view) {
    threads.start(function() {
        ScreenAuthModule.requestScreenCapture();
        // openGetScreenPermissions();

    })

    windowShow();

})

// 画板
function canvasOn(canvas) {
    // canvas 绘制
    let paintImg = new Paint();

    // 画板刷新
    canvas.on("draw", function(canvas) {
        canvas.drawColor(Color.TRANSPARENT, PorterDuff.Mode.CLEAR);
        canvas.drawARGB(255, 255, 255, 255);

        let matrix = new Matrix();

        // 自适应
        let src = new RectF(0, 0, showBitmapImg.getWidth(), showBitmapImg.getHeight())
        let dst = new RectF(0, 0, canvas.getWidth(), canvas.getHeight());

        matrix.setRectToRect(src, dst, Matrix.ScaleToFit.CENTER);

        // 缩放
        ui.canvas.attr("scaleX", imgShowScale);
        ui.canvas.attr("scaleY", imgShowScale);

        canvas.drawBitmap(showBitmapImg, matrix, paintImg);

        return true;
    })

    // 图片查看
    canvas.setOnLongClickListener(function(view) {
        app.viewFile(currentShowImgPath);

        return true;
    })

}
canvasOn(ui.canvas);

// 选择图片
ui.selectImg.on("click", function() {
    let fileType = "image/*";
    var intent = new Intent();

    intent.setType(fileType);
    intent.setAction(Intent.ACTION_GET_CONTENT)
    activity.startActivityForResult(intent, 1);

})


// 接收图片
activity.getEventEmitter().on("activity_result", (requestCode, resultCode, data) => {
    try {
        // 图片uri
        let imgUri = data.getData();
        // ui.imgUriText.setText(String(imgUri));

        // showBitmapImg
        let cr = context.getContentResolver();

        if (cr) {
            setShowBitmapImg(BitmapFactory.decodeStream(cr.openInputStream(imgUri)), {
                "storage": true

            });

        }

        // 文件路径
        // imgPath = uriToFile(imgUri);
        // ui.imgPathText.setText(imgPath);

    } catch (e) {
        console.error(e);

    }


});


// 缩放调整滑动条变化
ui.scaleSlider.addOnChangeListener({
    onValueChange: (view, value, fromUser) => {
        imgShowScale = value;
        storage.put("imgShowScale", imgShowScale);
        ui.scaleText.setText("缩放: " + value.toFixed(2));

    },
});

// 测试算法点击事件【优化版：稳+容错+体验佳，新增绘制用时统计】
ui.testScript.setOnClickListener((view) => {
    // 前置校验：路径/图片读取兜底，避免空路径报错
    if (!currentImgPath || currentImgPath.trim() === "") {
        toast("测试失败：未获取到有效图片路径");
        return true;
    }

    try {
        // 1. 读取测试图片，强校验有效性
        let img = images.read(currentImgPath);
        if (!img || !img.bitmap) {
            toast("测试失败：图片读取失败/图片文件损坏");
            return true;
        }

        // 2. 计时执行荆棘识别，核心测试逻辑
        let startTime = Date.now();
        let data = script.getThornsData(img);
        let recognizeCost = Date.now() - startTime; // 识别耗时
        // 标准化数据：确保始终是数组，避免后续判断出错
        data = Array.isArray(data) ? data : [];

        // 3. 初始化测试文本，区分识别结果
        let text = `识别用时: ${recognizeCost} ms`;
        let drawCost = 0; // 绘制耗时初始化
        if (data.length > 0) {
            text = `测试成功！${text}`;
            // 计时执行绘制，新增绘制耗时统计
            let drawStartTime = Date.now();
            let drawImg = script.drawImg(img, data);
            drawCost = Date.now() - drawStartTime; // 计算绘制耗时
            // 校验绘制结果
            if (drawImg) {
                setShowImgValue(drawImg, {
                    show: true
                });
                text += `\n绘制用时: ${drawCost} ms`; // 拼接绘制用时
            } else {
                text += `\n⚠️  荆棘识别成功，但绘制失败 (绘制用时: ${drawCost} ms)`;
            }
        } else {
            text = `未识别到荆棘, ${text}`;
        }

        // 4. 计算跳跃参数，全程校验避免异常
        let endX = script.ckltEndX(data);
        let pressTime = script.ckltJumpToXTime(endX);
        // 格式化参数展示，兜底非法值
        endX = (typeof endX === 'number' && endX >= 0) ? endX.toFixed(0) : "无效";
        pressTime = (typeof pressTime === 'number' && pressTime >= 0) ? pressTime.toFixed(1) : "无效";

        // 5. 拼接最终测试信息，补充落点坐标
        text += `\n落点X坐标: ${endX}px\n长按时间: ${pressTime}ms`;

        // 6. 友好提示测试结果
        toast(text);

    } catch (e) {
        // 全局异常捕获，精准提示错误原因
        toast(`测试异常：${e.message || "未知错误"}`);
        console.error("测试算法报错：", e);
    }

    return true;
});

// 恢复图片
ui.recoverImg.setOnClickListener((view) => {
    let img = images.read(currentImgPath);
    setShowImgValue(img, {
        show: true
    });

    toast("恢复成功");
})

