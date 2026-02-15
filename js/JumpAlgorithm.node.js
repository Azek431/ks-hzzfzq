"nodejs";

/**
 * 导入 Auto.js Pro V9 无障碍操作模块
 * 模块化的 press 函数返回 Promise<boolean>，支持非阻塞异步调用
 */
const { press } = require('accessibility');

/**
 * 【算法层】异步预测跳跃的目标 X 轴坐标
 * * @description 根据识别到的荆棘数组，判断前方地形。
 * 逻辑分支：
 * 1. 空白区：执行极限跳跃策略。
 * 2. 单组/多组：计算障碍物间隙（Gap），判断角色是否能安全落地。
 * * @param {Array} thornData - 荆棘对象数组 [{startX, endX}, ...]
 * @returns {Promise<number>} 返回计算后的物理像素 X 坐标（整数）
 */
async function ckltEndX(thornData) {
    const width = DEVICE_WIDTH; // 设备的物理宽度

    // --- 场景 1：视野内无障碍物 ---
    if (!thornData || thornData.length === 0) {
        if (typeof toast === 'function') toast("空白区判断，准备极限跳跃");
        // 计算逻辑：在屏幕边缘（34-68像素占比区间）随机落点，防止操作死板
        const randomOffset = sd.xp((34 + Math.random() * 34) / 720);
        return Math.floor(width - randomOffset);
    }

    // --- 场景 2：多障碍地形分析 ---
    let endGap = 0;  // 两组障碍物之间的净空间
    let targetX = 0; // 目标参考点

    if (thornData.length === 1) {
        // 只有一组荆棘（通常在脚下），目标设为屏幕终点
        endGap = width - thornData[0].endX;
        targetX = width;
    } else {
        // 存在多组荆棘，计算当前障碍物终点与下一组障碍物起点之间的间隙
        endGap = thornData[1].startX - thornData[0].endX;
        targetX = thornData[1].startX;
    }

    // --- 场景 3：决策模型 ---
    const playerWidth = sd.xp(playersWidthPps); // 获取适配后的玩家角色宽度
    
    /**
     * 安全校验逻辑：
     * 如果间隙 (Gap) 大于玩家宽度的 1.25 倍，判定为可安全落地。
     * 落地坐标修正：目标起点向回偏移（玩家宽度/1.95），确保不踩踏下一组荆棘边缘。
     * 否则：判定为无法跳过，执行“原地起跳/微调”策略。
     */
    if (endGap >= playerWidth * 1.25) {
        return Math.floor(targetX - playerWidth / 1.95);
    } else {
        return Math.floor(thornData[0].startX - playerWidth / 1.68);
    }
}

/**
 * 【转换层】将物理坐标差值映射为长按时间
 * * @description 基于线性映射模型：时间 = (目标坐标占比 - 玩家坐标占比) * 动态系数。
 * * @param {number} endX - 目标 X 轴物理坐标
 * @returns {Promise<number>} 返回长按毫秒数 [100, 1000]
 */
async function ckltJumpToXTime(endX) {
    // 边界安全检查：防止非数字类型导致 NaN 崩溃
    if (typeof endX !== 'number' || endX <= 0) return 100;

    // 计算逻辑：xpps 将像素转为 0~1 的占比，减去玩家当前占比得到距离百分比
    const distancePps = sd.xpps(endX) - playersXPps;
    
    // 核心物理系数：800ms（代表横跨 100% 屏幕宽度所需的基础长按时间）
    let time = distancePps * 800;

    // 约束逻辑：确保时间在合理区间，防止出现负数或超长按导致的逻辑锁死
    return Math.max(0, Math.min(Math.floor(time), 1000));
}

/**
 * 【执行层】触发 V9 异步长按动作
 * * @description 采用非阻塞设计，发起点击指令后立即返回，不阻塞主循环截图识别。
 * * @param {number} endX - 点击的 X 轴坐标
 * @param {number|Promise<number>} pressTime - 长按时长（支持直接传入或传入 Promise 对象）
 */
async function jumpToX(endX, pressTime) {
    /**
     * A. 异步数据解包 (Promise Unwrap)
     * 在 Node.js 异步引擎中，必须 await 确保 pressTime 从 Promise 对象转为具体数字。
     * 这是防止 "NaN" 计算错误的关键防线。
     */
    let finalTime = await pressTime; 
    if (finalTime === undefined || isNaN(finalTime)) {
        // 如果外部未传入有效时间，内部自动调用预测算法
        finalTime = await ckltJumpToXTime(endX);
    }

    // B. 合法性熔断：坐标越界或时间非法时不执行任何操作
    if (finalTime < 1 || endX <= 0 || endX > DEVICE_WIDTH) return;

    try {
        // C. 坐标整数化与防检测偏移
        const finalX = Math.floor(endX);
        // 在 Y 轴方向加入随机 +/- 50 像素的抖动，模拟真人的手指点击不稳定性
        const randomYOffset = (Math.random() - 0.5) * 100;
        const finalY = Math.floor(sd.yp(thornsCenterYPps) + randomYOffset);

        /**
         * D. 执行 V9 无障碍 press 操作
         * 注意：此处不加 await，因为 press 是一个耗时的 IO 动作。
         * 我们采用 Promise.then 链式调用处理结果，让程序能“边跳边看”。
         */
        press(finalX, finalY, Math.floor(finalTime))
            .then(success => {
                if (!success) {
                    console.warn(`[无障碍反馈] 坐标(${finalX}, ${finalY}) 点击执行返回 false，检查权限是否丢失`);
                }
            })
            .catch(err => {
                console.error(`[无障碍通讯错误] ${err}`);
            });

    } catch (e) {
        console.error("jumpToX 执行层发生捕获异常:", e);
    }
}

