"auto";

importClass(android.view.WindowManager);

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

// 测试算法
ui.testScript.setOnClickListener((view) => {
    // 图片赋值
    let img = images.read(currentImgPath);

    let startTime = Date.now();

    let data = script.getThornsData(img);

    // 测试结果
    let text = `用时: ${Date.now() - startTime} ms`


    // 绘制
    if (data) {
        text = `测试成功！${text}`;

        img = script.drawImg(showImg, data);
        setShowImgValue(img, {
            show: true
        });

    } else {
        text = `未识别到荆棘, ${text}`;

    }

    // 计算跳跃到的位置
    let endX = script.ckltEndX(data);

    // 计算长按时间
    let pressTime = script.ckltJumpToXTime(endX);

    text += `\n长按时间: ${pressTime}`

    // 信息提示框
    toast(text);


    return true;
})