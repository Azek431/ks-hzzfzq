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
paint.setStrokeWidth(3); //边缘宽度  
paint.setStyle(Paint.Style.STROKE); //空心样式
paint.setColor(Color.RED);

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

// 荆棘中心y占比
let thornsCenterYPps = 1000 / 1600;

// 荆棘宽度占比
let thornsWidthPps = 87 / 720;


// 获取荆棘数据
function getThornsData(img) {
    // 基础变量
    let bitmap = img.bitmap;
    let width = bitmap.getWidth();
    let height = bitmap.getHeight();
    let totalPixels = width * height

    // 获取所有像素
    let pixels = util.java.array("int", totalPixels);
    bitmap.getPixels(pixels, 0, width, 0, 0, width, height);

    // 荆棘组
    let thornsList = [];
    let isThornsXList = [];
    let state = 0;
    let lastX = null;
    let wpSum = 0;

    for (let x = sd.ptx(playersXPps); x < device.width; x++) {
        let color = getArr1DIndexValue(pixels, x, sd.pty(thornsCenterYPps), width);
        let argb = intColorRzls(color);

        if (argb[1] <= 155 & argb[2] + argb[3] >= 400) {
            isThornsXList.push(x);

            // 判断
            if (state == 0) {
                // 荆棘初始位置
                thornsList.push({
                    startX: x,
                    startY: sd.yp(thornsCenterYPps)

                });

                state = 1;

                continue;

            } else {
                let poorX = isThornsXList[isThornsXList.length - 1] - isThornsXList[isThornsXList.length - 2];
                if (poorX >= sd.xp(thornsWidthPps)) {
                    thornsList[thornsList.length - 1]["endX"] = isThornsXList[isThornsXList.length - 2];
                    thornsList[thornsList.length - 1]["endY"] = sd.yp(thornsCenterYPps);

                    state = 0;

                    continue;

                }

            }

            // 最后位置判断
            if (device.width - x <= sd.xp(thornsWidthPps) / 2) {
                // 设置最后的荆棘位置
                thornsList[thornsList.length - 1]["endX"] = device.width - 1;
                thornsList[thornsList.length - 1]["endY"] = sd.yp(thornsCenterYPps);

                // 结束 for 循环
                break;

            }


        } else {
            if (state == 1) {
                wpSum++;
                if (wpSum >= sd.xp(thornsWidthPps) / 2) {
                    thornsList[thornsList.length - 1]["endX"] = isThornsXList[isThornsXList.length - 1];
                    thornsList[thornsList.length - 1]["endY"] = sd.yp(thornsCenterYPps);


                }

            }

        }

    }

    // 返回荆棘组位置数据
    return thornsList;

}

// 脚本主内容
function mainRun(img) {
    // 计算荆棘数据
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


// 绘制
function drawImg(img, data, options) {
    // 更多选项
    if (!options) {
        options = {};

    }

    // 绘制
    var canvas = new Canvas();
    
    // 图片
    if (img) {
        canvas = new Canvas(img);
        
    }
    
    
    // 清空
    if (options["clear"] == true) {
        canvas.drawColor(Color.TRANSPARENT, PorterDuff.Mode.CLEAR);

    }

    // 绘制矩形
    for (let i = 0; i < data.length; i++) {
        let thornsData = data[i];

        canvas.drawRect(thornsData.startX - sd.x(13, 720), thornsData.startY - sd.y(68, 1600), thornsData.endX + sd.x(13, 720), thornsData.endY + sd.y(58, 1600), paint);

    }

    let imgMat = canvas.toImage().getMat();

    return images.matToImage(imgMat);

}


// 计算跳跃到的坐标
function ckltEndX(data) {
    //空白区域判断
    if (data.length == 0) {
        toast("没有识别到荆棘，执行跳跃空白");
        return device.width - random(sd.xp(134 / 720), sd.xp(231 / 720));
        
    }
    
    // 1组障碍判断
    if (data.length == 1) {
        let thornsData = data[0];
        if (thornsData.startX - sd.xp(playersXPps) >= sd.xp(thornsWidthPps) * 2.3) {
            return thornsData.startX - sd.xp(thornsWidthPps) * 1.5;

        } else {
            return thornsData.endX + sd.xp(thornsWidthPps);

        }

    }

    // 2组障碍判断
    if (data.length == 2) {
        return data[1].startX - sd.xp(thornsWidthPps) * 1.4;

    }

    return null;
}

// 计算跳到指定位置的时间
function ckltJumpToXTime(endX) {
    return (sd.xpps(endX) - playersXPps) * 800;
}


// 跳到指定坐标
function jumpToX(endX) {
    let pressTime = ckltJumpToXTime(endX);

    if (pressTime >= 1) {
        threads.start(() => {
            press(endX, sd.yp(thornsCenterYPps) + random(-50.1, 50.1), pressTime);

        })

    }


}

// 点击复活按钮 --2026-1-29 11:41 00 新增
function clickResurgenceButton() {
    threads.start(function() {
        let button = textMatches(/(原地复活|立即复活|复活)/).findOne(1);
        if (button) {
            button.clickCenter();

        }

    });

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


// 循环执行脚本
function cycleRun() {
    threads.start(function() {
        cycleRun.state = 1;
        while (cycleRun.state) {
            // 截图
            let img = captureScreen();
            if (!img) {
                toast("没有获取到图片，是不是忘给获取屏幕权限了");
                openGetScreenPermissions();
                
            }

            // 计算荆棘数据
            let data = getThornsData(img);
            
            if (data && img) {
                // 绘制
                showBitmap = null;

                threads.start(() => {
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

            }

            // 长按屏幕跳跃
            let endX = ckltEndX(data);
            jumpToX(endX);
            if (endX) {
                sleep(ckltJumpToXTime(endX) * 2 + 30);

            }

            // 点击复活按钮
            clickResurgenceButton();


        }

    })

}
cycleRun.state = 0;


module.exports = this;