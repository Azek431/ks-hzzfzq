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

// Rhino
const Rhino = "Rhino";

// Node.js
const NodeJs = "Node.js";

// 算法引擎
var AlgEng = storage.get("AlgEng") || NodeJs;


/* 屏幕适配函数 */
// 缓存屏幕分辨率
const DEVICE_WIDTH = device.width;
const DEVICE_HEIGHT = device.height;

eval(files.read('./js/ScreenAdapt.js'));
/* 屏幕适配函数 */


/* 初始化ui */
// ui事件模块
const uiOn = require("./ui/uiOn.js");

// 创建ui
const uiInit = require("./ui/uiInit.js")
uiInit.create();



/* 初始化ui */

// 创建缓存文件夹
files.create("./temp/");


/* 初始变量 */
// 启动Node.js脚本
const execution = $engines.execScriptFile('./js/NodeScript.node.js', {
    arguments: {
        serverEngineId: $engines.myEngine().id,
        cwd: files.cwd()
    }
})

// 脚本
var script = require("./js/script.js");
script.drawWindow();
script.initStorage();
script.initVar(); // 初始化变量


// 当前图片路径
var currentImgPath = "./temp/currentImage.jpg";

// 当前显示图片路径
var currentShowImgPath = "./temp/currentShowImage.jpg";


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
    script.initVar();

    dataSynchronization();

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

// 设置算法引擎
function setAlgEng(engine, options) {
    if (engine === undefined || !engine) engine = AlgEng;
    if (options === undefined) options = {};
    AlgEng = engine;
    storage.put("AlgEng", AlgEng);

    if (options.requestScreenCapture != false) sc.requestScreenCapture();
}
setAlgEng(null, {
    requestScreenCapture: false

});



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

/**
 * 增强版图像有效性检查
 * 修复回收状态检测，添加更严格的验证
 */
function isImageValid(img) {
    if (!img) return false;

    try {
        // 优先检查回收状态
        if (typeof img.isRecycled === 'function' && img.isRecycled()) {
            return false;
        }

        // 检查必要方法是否存在
        if (typeof img.getWidth !== 'function' || typeof img.getHeight !== 'function') {
            return false;
        }

        // 检查尺寸合理性
        let width = img.getWidth();
        let height = img.getHeight();
        if (width <= 0 || height <= 0 || width > 10000 || height > 10000) {
            return false;
        }

        // 检查bitmap是否存在且有效
        if (!img.bitmap) {
            return false;
        }

        // 最终验证：尝试访问像素数据
        try {
            let pixel = img.bitmap.getPixel(0, 0);
            return true;
        } catch (e) {
            return false;
        }

    } catch (e) {
        return false;
    }
}

// Node.js 初始化引擎变量
function initNodeJsGlobalVar() {
    let data = script.getData();
    execution.engine.emit('initGlobalVar', {
        data: data

    });
}

// ==========================================
// 屏幕截图权限模块 (Screen Capture Module)
// ==========================================
var sc = {};

/**
 * 请求并获取屏幕截图权限
 * 逻辑：根据当前运行引擎（Rhino 或 NodeJs）执行不同的授权流程
 */
sc.requestScreenCapture = function(algEng, options) {
    if (options === undefined) options = {};
    // 运行状态
    if (sc.run) return false;
    sc.run = true;

    if (algEng === undefined) algEng = AlgEng;


    // [检查状态] 若已初始化成功，则跳过后续流程
    if (sc.Rhino && sc.NodeJs) return true;

    // [UI展示] 弹出不可取消的 Material 风格等待对话框
    // 注意：变量接收的是 .show() 返回的 AlertDialog 实例，用于后续手动关闭
    if (options.Dialog != false) {
        sc.myDialog = new MaterialAlertDialogBuilder(activity)
            .setTitle("权限申请")
            .setMessage("正在等待授权...")
            .setCancelable(false)
            .setPositiveButton("取消", function() {
                toast("用户手动取消了授权");
            })
            .show();
    }

    // [异步处理] 开启子线程执行授权请求，避免阻塞 UI 主线程
    threads.start(function() {
        // --- 场景 A: Rhino 引擎环境 ---
        if (algEng == Rhino) {
            if (!sc.Rhino) {
                sc.myDialog.setMessage("正在申请 Node.js 引擎获取屏幕权限...");

                // 执行内置模块的截图请求逻辑
                ScreenAuthModule.requestScreenCapture();
                sc.Rhino = true;
                sc.NodeJs = false;

                sc.myDialog.setMessage("权限获取成功！正在关闭对话框");
            }
            // [释放UI] 授权完成，关闭等待对话框
            setTimeout(function() {
                sc.myDialog.setMessage("关闭对话框成功！");
                sc.myDialog.dismiss();
                sc.run = false;

            }, 68);

            return true;

        }

        // --- 场景 B: Node.js 引擎环境 ---
        if (algEng == NodeJs) {
            // 初始化引擎变量
            initNodeJsGlobalVar();

            if (!sc.NodeJs) {
                // sc.myDialog.setMessage("正在申请 Rhino 引擎获取屏幕权限...");
                // if (!sc.Rhino) ScreenAuthModule.requestScreenCapture();

                // sc.myDialog.setMessage("正在申请 Node.js 引擎获取屏幕权限...");
                execution.engine.emit('requestScreenCapture');

                // let img = captureScreen();
                // log(img)
                // if (!img || img.bitmap === undefined || img == null) {}

                sc.myDialog.setMessage("权限获取成功！正在关闭对话框");
                sc.NodeJs = true;
                sc.Rhino = false;
            }
            // [释放UI] 授权流程触发，关闭等待对话框
            setTimeout(function() {
                sc.myDialog.setMessage("关闭对话框成功！");
                sc.myDialog.dismiss();
                sc.run = false;

            }, 341);
            return true;

        }

        // --- 异常处理: 引擎匹配失败 ---
        toast("未识别的算法引擎，系统已尝试自动重置为 Node.js");
        setAlgEng(NodeJs);

        // [释放UI] 逻辑结束，确保对话框被移除
        sc.myDialog.setMessage("关闭对话框成功！")
        sc.myDialog.dismiss();
        sc.run = false;
        return false;
    });
};

// 权限状态初始化
sc.Rhino = false;
sc.NodeJs = false;
sc.run = false;

// 数据同步
function dataSynchronization() {
    // 初始化脚本变量
    script.initVar();
    initNodeJsGlobalVar();

}

/* 函数 (function) */

// ui 事件
uiOn.on(ui);

// 全局事件
let Event = require("./Event.js");


// 初始化 NodeJs 引擎变量
let initNodeVar = {};
initNodeVar.run = true;
initNodeVar.Dialog = new MaterialAlertDialogBuilder(activity)
    .setTitle("初始化")
    .setMessage("正在初始化 Node.js 引擎中...")
    .setCancelable(false)
    .setPositiveButton("取消", function() {
        toast("用户取消了初始化");
    })
    .show();
initNodeVar.thread = threads.start(function() {
    // 监听 NodeJs 变量初始化成功
    events.on("initGlobalVar-Suc", () => {
        nodeInitVar = false;
        initNodeVar.Dialog.setMessage(`NodeJs引擎初始化成功！`)
        initNodeVar.Dialog.dismiss();
        initNodeVar.thread.interrupt();

    })

    console.log("初始化 NodeJs 引擎变量");
    let i = 0;
    while (initNodeVar.run) {
        i++;
        initNodeVar.Dialog.setMessage(`尝试初始化 Node.js 引擎: ${i} 次`);
        initNodeJsGlobalVar();

        if (i >= 134) {
            initNodeVar.Dialog.setMessage(`NodeJs引擎初始化失败！`)
            initNodeVar.Dialog.dismiss();
            toast("初始化 Node.js 引擎失败，已自动给你切换成 Rhino 引擎");
            setAlgEng(Rhino);
            refreshUi();

        }

        sleep(30);
    }


})