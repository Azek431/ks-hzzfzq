/* 变量 */
// 基础数值
// 玩家中心x占比
global.playersXPps = 154.5 / 720;

// 人物宽度 --2026-1-30 09:43 08 新增数据
global.playersWidthPps = 143 / 720;

// 荆棘中心y占比
global.thornsCenterYPps = storage.get("thornsCenterYPps") || 1000 / 1600;
global.thornsCenterYPpsIndex = storage.get("thornsCenterYPpsIndex") || 1;
global.thornsCenterYPpsList = [1000 / 1600, 1000 / 1600, 961 / 1600, 0.65];

// 荆棘宽度占比
global.thornsWidthPps = 87 / 720;


// 分数显示文字中心x占比  --2026-1-31 21:45:37 新增
global.scoreCenterXPps = 333 / 720;

// 分数显示文字中心y占比  --2026-1-31 22:37:18 新增
global.scoreCenterYPps = 122 / 1600;

// 分数显示文字宽度占比  --2026-1-31 22:37:32 新增
global.scoreWidthPps = 212 / 720;

// 分数显示文字高度占比  --2026-2-4 11:55:43 新增
global.scoreHeightPps = 40 / 1600;


// 等待到分数点数变化
global.whileScoreChangeBoor = storage.get("whileScoreChangeBoor");
if (global.whileScoreChangeBoor === undefined) global.whileScoreChangeBoor = false;

// 循环等待时间
global.waitTime = storage.get("waitTime") || 134;

// 运行速度
global.runSpeed = storage.get("runSpeed") || 1;

/* 变量 */

/* 函数 */
// 选择
global.thornsCenterYPpsSelect = function(index) {
    return thornsCenterYPpsList[index];
}

/**
 * 增强版图像有效性检查
 * 修复回收状态检测，添加更严格的验证
 */
global.isImageValid = function(img) {
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

// 初始化储存
global.initStorage = function() {
    setStorageData(storage, getStorageAll(storageName));
}


/* 函数 */