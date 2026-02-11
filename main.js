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

// 自动打开截图权限 --云大佬贡献
var ScreenAuthModule = require("./module/ScreenAuthModule.js");

// MatetialDesign 对话框模块 --Azek. 大佬制作 ( 作者 )
var MaterialDesignDialog = require(`${files.cwd()}/module/MaterialDesignDialog.js`);


// 关闭内存泄漏检测
$debug.setMemoryLeakDetectionEnabled(false);

// ui
let androidx = Packages.androidx;
let ActionBarDrawerToggle = androidx.appcompat.app.ActionBarDrawerToggle;
let MaterialColors = com.google.android.material.color.MaterialColors;

// 储存
const storageName = "Azek-快手火崽崽辅助器";
var storage = storages.create(storageName);
// storages.remove(storageName);


// 主题颜色
var ThemeColor = storage.get("ThemeColor") || "#7B90D2";


// GitHub 网址
const githubWeb = "https://github.com/Azek431/ks-hzzfzq";


/* 屏幕适配优化：缓存设备尺寸 */
const DEVICE_WIDTH = device.width;
const DEVICE_HEIGHT = device.height;

function sd(x, w, y, h) {
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


/* 初始化ui */
// ui事件模块
const uiOn = require("./ui/uiOn.js");

// 创建ui
const uiInit = require("./ui/uiInit.js")
uiInit.create();



/* 初始化ui */

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


// 列表处理模块
function listProc() {}

// 求和
listProc.sum = function(arr) {
    let sum = arr.reduce((prev, cur, index, arr) => {
        return prev + cur;

    })

    return sum;

}




// 二维[x,y] → 一维索引i，n=每行元素数
function get1DIndex(x, y, n) {
    return x * n + y;
}

// 使用二维索引获取一位列表值 -- 2026-1-28 23:05 23 新增
function getArr1DIndexValue(list, x, y, n) {
    return list[y * n + x];
}

// map转Object
function mapToObject(map) {
    if (map == null || map === undefined) {
        return null;
    }
    let iter = map.entrySet().iterator();
    let obj = {};
    while (iter.hasNext()) {
        let entry = iter.next();
        obj[entry.key] = entry.value;
    }
    return obj;
}

// 获取储存器所有数据
function getStorageAll(storageName) {
    let map = context.getSharedPreferences("autojs.localstorage." + storageName, 0);
    return mapToObject(map.getAll());

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

// 刷新界面
function refreshUi() {
    // 初始化脚本变量
    script.init();

    // 刷新界面
    uiInit.create();

    // ui 事件
    uiOn.on(ui);
}

// 设置储存内容
function setStorageData(storage, json) {
    let keys = Object.keys(json);
    let values = Object.values(json);

    for (let i = 0; i < keys.length; i++) {
        let key = keys[i];
        let value = values[i];

        if (typeof value == "string") {
            if (value[0] == `"`) {
                value = value.substring(1, value.length)
            }
            if (value[value.length - 1] == `"`) {
                value = value.substring(0, value.length - 1)
            }

            // 布尔值处理
            if (value == "true") {
                storage.put(key, true);
                continue;
            } else if (value == "false") {
                storage.put(key, false);
                continue;
            }

            // 其他类型处理
            storage.put(key, value);

        } else {
            storage.put(key, value);

        }

    }

}


// 设置主题颜色
function setThemeColor(color) {
    ThemeColor = color;
    storage.put("ThemeColor", ThemeColor);

    refreshUi(); // 刷新ui
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

// 自动打开获取屏幕权限
function openGetScreenPermissions() {
    threads.start(function() {
        let Allow = textMatches(/(允许|立即开始|统一|授予|同意)/).findOne(10 * 1000);
        if (Allow) {
            Allow.click();

        }

    });
    requestScreenCapture();
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

// 获取底部导航栏高度
function getNavigationBarHeight() {
    // let context = context || org.autojs.autojs.AutoJs.getInstance().getApplicationContext();
    let res = context.getResources();

    // 方法1：通过公开资源标识符获取
    // let navBarId = res.getIdentifier("navigation_bar_height", "dimen", "android");
    // if (navBarId > 0) {
    //     log(navBarId)
    //     log(666, res.getDimensionPixelSize(navBarId))
    // }


    // 方法3：通过屏幕尺寸差值计算
    let windowManager = context.getSystemService(android.content.Context.WINDOW_SERVICE);
    let display = windowManager.getDefaultDisplay();

    let realMetrics = new android.util.DisplayMetrics();
    display.getRealMetrics(realMetrics);
    let realHeight = realMetrics.heightPixels;

    let usableMetrics = new android.util.DisplayMetrics();
    display.getMetrics(usableMetrics);
    let usableHeight = usableMetrics.heightPixels;

    let difference = realHeight - usableHeight;

    // 获取状态栏高度
    let statusBarId = res.getIdentifier("status_bar_height", "dimen", "android");
    let statusBarHeight = (statusBarId > 0) ? res.getDimensionPixelSize(statusBarId) : 0;

    // 计算导航栏高度
    let navBarHeight = difference - statusBarHeight;
    return Math.max(navBarHeight, 0); // 确保非负
}



/* 函数 (function) */

// ui 事件
uiOn.on(ui);

// 全局事件
let Event = require("./Event.js");