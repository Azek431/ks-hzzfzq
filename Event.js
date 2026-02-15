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


// 监测退出
events.on("exit", () => {
    execution.engine.forceStop();

});


// eval
events.on("eval", (code) => {
    eval(code);

})

// setTimeout(function() {
//     execution.engine.emit('eval', files.read("./js/MainAlgorithm.js"));
// }, 1000)

// 请求截图权限
events.on("requestScreenCaptureImg", () => {
    threads.start(function() {
        ScreenAuthModule.tryRootAuth();
        ScreenAuthModule.handleDialogLogic();

    })

})

// 信息提示框
events.on("toast", (text) => {
    toast(text);
})


// 绘制
events.on("drawImgFiles", (data) => {
    let drawStartTime = Date.now();
    let img = images.read(data.path);
    let drawImg = script.drawImg(img, data.data);
    drawCost = Date.now() - drawStartTime; // 计算绘制耗时
    // 校验绘制结果
    if (drawImg) {
        setShowImgValue(drawImg, {
            show: true
        });
        // text += `\n绘制用时: ${drawCost} ms`; // 拼接绘制用时
    } else {
        // text += `\n⚠️  荆棘识别成功，但绘制失败 (绘制用时: ${drawCost} ms)`;
    }


})

// 绘制当前屏幕
events.on("drawScreenImg", (com) => {
    let data = com.data;
    let imgSizes = com.imgSizes;
    let imgWidth = imgSizes.width;
    let imgHeight = imgSizes.height;

    // 绘制
    let bitmapImg = Bitmap.createBitmap(imgWidth, imgHeight, Bitmap.Config.ARGB_8888);
    let drawImg = script.drawImg(bitmapImg, data, {
        clear: true
    });

    let bitmap = drawImg.bitmap;
    if (bitmap) {
        script.showBitmap = bitmap;

        setTimeout(function() {
            // 回收图片
            // if (image) bitmap.recycle();

            script.showBitmap = null;

        }, data.pressTime * 0.88);

    }

})

// 寻找复活控件
events.on("getResurgenceButton", () => {
    threads.start(function() {
        script.getResurgenceButton();

    })

})