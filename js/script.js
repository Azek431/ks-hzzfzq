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
paint.setAntiAlias(true); // 抗锯齿更顺滑
paint.setStyle(Paint.Style.STROKE); // 描边模式

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


// 获取荆棘数据
function getThornsData(img) {
    // 基础变量
    let bitmap = img.bitmap;
    let width = bitmap.getWidth();

    let checkY = sd.pty(thornsCenterYPps);
    let pixels = util.java.array("int", width);
    bitmap.getPixels(pixels, 0, width, 0, checkY, width, 1);

    // 荆棘组
    let thornsList = [];

    // 状态机变量
    let state = 0; // 0: 寻找开始, 1: 寻找结束
    let currentStartX = -1;
    let lastThornX = -1;
    let emptyCount = 0; // 连续空像素计数

    // 预计算阈值
    const startScanX = sd.ptx(playersXPps);
    const gapThreshold = sd.xp(thornsWidthPps);
    const endThreshold = gapThreshold / 2;
    const STEP = 2;

    for (let x = startScanX; x < width; x += STEP) {
        let color = pixels[x];

        let r = (color >> 16) & 0xFF;
        if (r > 155) {
            // 非障碍物逻辑
            if (state == 1) {
                emptyCount += STEP;
                // 如果连续空像素超过阈值，认为当前障碍物结束
                if (emptyCount >= endThreshold) {
                    thornsList.push({
                        startX: currentStartX,
                        startY: sd.yp(thornsCenterYPps),
                        endX: lastThornX,
                        endY: sd.yp(thornsCenterYPps)
                    });
                    state = 0;
                    currentStartX = -1;
                }
            }
            continue;
        }

        // 计算 绿+蓝
        let g = (color >> 8) & 0xFF;
        let b = color & 0xFF;

        // 判定条件：红<=155 且 绿+蓝>=400
        if ((g + b) >= 400) {
            // 是障碍物
            if (state == 0) {
                // 发现新障碍
                state = 1;
                currentStartX = x;
                emptyCount = 0;
            } else {
                if (x - lastThornX >= gapThreshold && lastThornX !== -1) {
                    thornsList.push({
                        startX: currentStartX,
                        startY: sd.yp(thornsCenterYPps),
                        endX: lastThornX,
                        endY: sd.yp(thornsCenterYPps)
                    });
                    currentStartX = x;
                }

                emptyCount = 0;
            }
            lastThornX = x;
        } else {
            if (state == 1) {
                emptyCount += STEP;
                if (emptyCount >= endThreshold) {
                    thornsList.push({
                        startX: currentStartX,
                        startY: sd.yp(thornsCenterYPps),
                        endX: lastThornX,
                        endY: sd.yp(thornsCenterYPps)
                    });
                    state = 0;
                    currentStartX = -1;
                }
            }
        }
    }


    if (state == 1) {
        thornsList.push({
            startX: currentStartX,
            startY: sd.yp(thornsCenterYPps),
            endX: width - 1,
            endY: sd.yp(thornsCenterYPps)
        });
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
    paint.setColor(Color.RED);
    paint.setStrokeWidth(3); // 线宽
    
    for (let i = 0; i < data.length; i++) {
        let thornsData = data[i];

        canvas.drawRect(thornsData.startX - sd.x(13, 720), thornsData.startY - sd.y(68, 1600), thornsData.endX + sd.x(13, 720), thornsData.endY + sd.y(58, 1600), paint);

    }

    // 绘制抛物线 --豆包ai贡献
    paint.setColor(colors.BLUE); // 抛物线颜色
    paint.setStrokeWidth(6); // 线宽
    
    // 基础参数
    let startX = sd.xp(playersWidthPps); // 初始位置X（起点）
    let startY = data[0].startY - sd.y(31, 1600); // 初始位置Y（起点）
    let endX = ckltEndX(data); // 结束位置X（终点）
    let endY = data[0].endY - sd.y(31, 1600); // 结束位置Y（终点）
    
    let dx = endX - startX;
    let centerX = startX + dx / 2; // 抛物线中点X
    let topY = startY - Math.max(dx / 6, endX / 431); // 顶点高度（自动在中间上方）
    let a = (endY - topY) / Math.pow(dx / 2, 2); // 自动计算开口系数
    // 用Path绘制抛物线
    let path = new Path();
    path.moveTo(startX, startY); // Path移动到【初始位置（起点）】
    // 遍历计算抛物线上的点，添加到Path
    for (let x = startX + 1; x <= endX; x++) {
        let offsetX = x - centerX;
        let y = a * Math.pow(offsetX, 2) + topY;
        path.lineTo(x, y); // 连线到当前点
    }
    // 绘制Path
    canvas.drawPath(path, paint);
    

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
    if (endItpls >= sd.xp(playersWidthPps) * 1.10) {
        // 可以跳跃过去
        return endX - sd.xp(playersWidthPps) / 2;

    } else {
        // 跳跃空白区域
        return data[0].startX - sd.xp(playersWidthPps) / 2;

    }

    // 无效返回
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
                sleep(ckltJumpToXTime(endX) * 2 + 68);

            }

            // 点击复活按钮
            clickResurgenceButton();


        }

    })

}
cycleRun.state = 0;


module.exports = this;