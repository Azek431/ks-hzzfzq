/* 火崽崽过大年辅助 */
"ui";
/*
 * 作者: Azek.
 * qq: 2982154038
 * 版权为 Azek 所有
 * 使用环境 Auto.js Pro 9.3.11
 */

/* 导入模块 */
// 初始化类
const initClass = require("./initClass.js");
initClass.init();

// 内存泄漏检测
$debug.setMemoryLeakDetectionEnabled(false);

// ui
let androidx = Packages.androidx;
let ActionBarDrawerToggle = androidx.appcompat.app.ActionBarDrawerToggle;
let MaterialColors = com.google.android.material.color.MaterialColors;

// 储存
var storage = storages.create("火崽崽过大年辅助");
ThemeColor = storage.get("ThemeColors") || "#0061A6";
ThemeColor = "#58B2DC";

/* 
x = 155
y = 1000;
荆棘长度 = 87;

*/

/* 屏幕适配 */
function sd(x, w, y, h) {
    return {
        x: sd.x(x, w),
        y: sd.y(y, h)
    }
}

// 像素
sd.x = function(x, w) {
    return x * (device.width / w);
}

sd.y = function(y, h) {
    return y * (device.height / h);
}

// 比例
sd.xp = function(proportion) {
    return device.width * proportion;
}

sd.yp = function(proportion) {
    return device.height * proportion;
}

// 计算占比 --2026-1-28 21:52 11 新增
sd.xpps = function(x) {
    return x / device.width;
}

sd.ypps = function(y) {
    return y / device.height;
}

// 比例转坐标 (int)  --2026-1-28 21:56 44 新增
sd.ptx = function(proportion) {
    return Math.round(device.width * proportion);
}

sd.pty = function(proportion) {
    return Math.round(device.height * proportion);
}


/* 屏幕适配 */

// 初始化ui
require("./ui/uiInit.js")

// 创建缓存文件夹
files.create("./temp/");


/* 初始化实例 */
// 初始化 ColorMapping
// var ColorMapping = colors.mapping;


// 创建 ColorMapping 实例
// var cm = new ColorMapping();


/* 初始化实例 */



/* 初始变量 */
// 脚本
var script = require("./js/script.js");

// 当前图片路径
var currentImgPath = "./temp/当前图片.jpg";

// 当前显示图片路径
var currentShowImgPath = "./temp/当前显示图片.jpg";


// 图片
var showImg = images.read(currentImgPath);
var showBitmapImg = showImg.bitmap;

// 储存
images.save(showImg, currentShowImgPath, "jpg", 100);


// 图片展示缩放
var imgShowScale = storage.get("imgShowScale") || 0.8;


/* 初始变量 */

/* 函数 (function) */
// 信息提示框 (toast)
var toastA;
toast = function(message) {
    if (toastA) {
        toast.dismiss();
        toastA = null;

    }

    toastA = Toast.makeText(context, String(message), Toast.LENGTH_LONG);
    toastA.show();


}

// 取消当前toast
toast.dismiss = function() {
    toastA.cancel();

}

// 随机模块
function random(minNum, maxNum) {
    if (!maxNum) {
        return Math.random();
    }

    let num = Math.random() * (maxNum - minNum) + minNum;
    if (isFloat(minNum) | isFloat(maxNum)) {
        return num;
    } else {
        return parseInt(num, 10);
    }


}

// 随机选择列表中的一个元素
random.choice = function(list) {
    return list[random(0, list.length - 1)];
}


// 二维[x,y] → 一维索引i，n=每行元素数
function get1DIndex(x, y, n) {
    return x * n + y;
}

// 使用二维索引获取一位列表值 -- 2026-1-28 23:05 23 新增
function getArr1DIndexValue(list, x, y, n) {
    return list[y * n + x];
}


// 整数颜色解析
function intColorRzls(color) {
    let alpha = (color >> 24) & 0xFF;
    let red = (color >> 16) & 0xFF;
    let green = (color >> 8) & 0xFF;
    let blue = color & 0xFF;

    return [alpha, red, green, blue];
}


// 判断数值是否是浮点数
function isFloat(num) {
    return num === +num && num !== (num | 0)
}


// bitmap 图片转 mat
function bitmapToMat(bitmap) {
    let mat = new Mat();
    Utils.bitmapToMat(bitmap, mat);

    return ImageWrapper.ofMat(mat);

}


// 设置 showBitmap 图片
function setShowBitmapImg(bitmap, other) {
    let mat = new Mat();
    Utils.bitmapToMat(bitmap, mat);
    setShowImgValue(ImageWrapper.ofMat(mat), other);

}

// 设置展示图片
function setShowImgValue(value, other) {
    if (!other) {
        other = {};

    }

    showImg = value;
    showBitmapImg = showImg.bitmap;

    // 储存 --2026-1-27 19:12 47 新增
    if (other["storage"] == true) {
        // 保存文件 ( 当前显示图片 )
        images.save(showImg, currentImgPath, "jpg", 100);

    }

    // 展示 --2026-1-28 10:24 17 新增
    if (other["storage"] == true || other["show"] == true) {
        // 保存文件
        images.save(showImg, currentShowImgPath, "jpg", 100);

    }

    return true;
}



// 悬浮窗事件处理
let windowOn = require("./ui/windowOn.js");

// 显示悬浮窗
function windowShow() {
    threads.start(function() {
        // 布局
        let w = floaty.window(files.read("res/layout/float_window_layout.xml"));

        // 显示调整参数、大小、位置按键
        w.setAdjustEnabled(true);

        // 显示位置
        w.setPosition(sd.x(103, 720), sd.y(431, 1600))
        
        windowOn.main(w);

    })

}

/**
 * 获取状态栏高度
 */
function getStatusBarHeightCompat() {
    let result = 0;
    let resId = context.getResources().getIdentifier('status_bar_height', 'dimen', 'android');
    if (resId > 0) {
        result = context.getResources().getDimensionPixelOffset(resId);
    }
    if (result <= 0) {
        result = context.getResources().getDimensionPixelOffset(R.dimen.dimen_25dp);
    }
    return result;
}




/* 函数 (function) */


// ui Engines
require("./ui/uiOn.js");