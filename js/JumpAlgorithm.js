// 计算跳跃到的坐标
global.ckltEndX = function (thornData) {
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
global.ckltJumpToXTime = function (endX) {
    // 校验坐标有效性，避免非数字坐标计算出异常时长
    if (typeof endX !== 'number' || endX <= 0) return 100; // 最小100ms

    let time = (sd.xpps(endX) - playersXPps) * 800;

    // 确保时间在合理范围内 [0ms, 1000ms]
    time = Math.max(0, Math.min(time, 1000));

    return time;
}


// 跳到指定坐标，执行长按屏幕操作
global.jumpToX = function (endX, pressTime) {
    // 获取需要长按的时间
    if (pressTime == undefined) pressTime = ckltJumpToXTime(endX);
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


