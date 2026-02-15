// 屏幕适配函数

/* 屏幕适配优化：缓存设备尺寸 */
// const DEVICE_WIDTH = device.width;
// const DEVICE_HEIGHT = device.height;

global.sd = function(x, w, y, h) {
    return {
        x: sd.x(x, w),
        y: sd.y(y, h)
    }
}

// 像素 --2026-1-31 10:51:00 新增指定宽高
sd.x = function(x, w, dw) {
    if (!dw) {
        dw = DEVICE_WIDTH;
    }
    return x * (dw / w);
}

sd.y = function(y, h, dh) {
    if (!dh) {
        dh = DEVICE_HEIGHT;
    }
    return y * (dh / h);
}


// 比例
sd.xp = function(proportion, dw) {
    if (!dw) {
        dw = DEVICE_WIDTH;
    }
    return dw * proportion;
}

sd.yp = function(proportion, dh) {
    if (!dh) {
        dh = DEVICE_HEIGHT;
    }
    return dh * proportion;
}


// 计算占比 --2026-1-28 21:52 11 新增 1-31 10:56:41 修改
sd.xpps = function(x, dw) {
    if (!dw) {
        dw = DEVICE_WIDTH;
    }
    return x / dw;
}

sd.ypps = function(y, dh) {
    if (!dh) {
        dh = DEVICE_HEIGHT;
    }
    return y / dh;
}

// 比例转坐标 (int)  --2026-1-28 21:56 44 新增
sd.ptx = function(proportion, dw) {
    if (!dw) {
        dw = DEVICE_WIDTH;
    }
    return Math.round(dw * proportion);
}

sd.pty = function(proportion, dh) {
    if (!dh) {
        dh = DEVICE_HEIGHT;
    }
    return Math.round(dh * proportion);
}


/* 屏幕适配 */


