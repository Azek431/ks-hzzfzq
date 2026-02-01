/**
 * 截图服务自动管理模块
 */
var ScreenAuthModule = {
    /**
    * 请求截图
    * * @description 自动请求截图权限
    */
    handleDialogLogic: function () {
        var timestamp = new Date().getTime();
        while (new Date().getTime() - timestamp < 2000) {
            var scopeTitle = packageName("com.android.systemui").textMatches(/要开始使用.*(录制|投放).*吗.*/).visibleToUser(true).findOne(100);
            if (scopeTitle) {
                var shareOneApp = packageName("com.android.systemui").textMatches(/.*(单个|一个|当前|此|仅).*应用.*/).visibleToUser(true).findOne(100);
                if (shareOneApp) {
                    log("检测到 '共享单个应用' 限制，正在切换...");
                    try {
                        shareOneApp.parent().click();
                        sleep(200);
                        var shareScreenText = packageName("com.android.systemui").textMatches(/.*(整个|所有|全部).*(屏幕|内容).*/).visibleToUser(true).findOne(100);
                        if (shareScreenText) {
                            var clicked = shareScreenText.click();
                            if (!clicked) click(shareScreenText.bounds().centerX(), shareScreenText.bounds().centerY());
                            log("已切换至：共享整个屏幕");
                            sleep(200);
                        }
                    } catch (e) {
                        console.warn("切换屏幕共享模式异常: " + e);
                    }
                }
            }
            var startShareBtn = packageName("com.android.systemui").textMatches(/(.*立即开始.*|.*开始.*|.*共享屏幕.*|START NOW|允许)/).clickable(true).findOne();
            if (startShareBtn != null) startShareBtn.click();
        }
    },

    /**
     * 尝试使用 Root 权限修改系统设置
     */
    tryRootAuth: function () {
        console.verbose("正在尝试 Root 授权...");

        try {
            var checkRoot = shell("date", true);

            if (checkRoot.code !== 0) {
                console.verbose("Root 权限不可用");
                return false;
            }

            console.log("检测到 Root 权限可用，开始配置...");

            var pkg = context.getPackageName();
            var res = shell("appops set " + pkg + " PROJECT_MEDIA allow", true);

            if (res.code === 0) {
                console.info(" Root 权限修改截图配置成功");
                return true;
            } else {
                console.warn("Root 权限存在，但修改设置失败 (代码: " + res.code + ")");
                console.verbose("错误信息: " + res.error);
            }
        } catch (e) {
            console.verbose("Root 授权尝试跳过: " + e);
        }
        return false;
    },

    /**
     * 撤销 Root 权限
     */
    revoke: function () {
        var pkg = context.getPackageName();
        shell("appops set " + pkg + " PROJECT_MEDIA default", true);
        log(" 截图权限已重置");
    },

    /**
     * 请求截图权限（主入口）
     * @param {boolean} stopScriptIfFailed - 失败时是否停止脚本
     * @returns {boolean} 最终是否成功
     */
    requestScreenCapture: function (stopScriptIfFailed) {

        if (stopScriptIfFailed === undefined) stopScriptIfFailed = true;

        var hasRootSet = this.tryRootAuth();

        var logicThread = null;
        if (!hasRootSet && device.sdkInt > 28) {
            logicThread = threads.start(function () {
                ScreenAuthModule.handleDialogLogic();
            });
        }

        var success = false;
        try {
            if (typeof requestScreenCapture === "function") {
                success = requestScreenCapture(false);
            } else {
                success = images.requestScreenCapture(false);
            }
        } catch (e) {
            try {
                success = requestScreenCapture({
                    orientation: 1,
                    width: device.width,
                    height: device.height
                });
            } catch (e2) {
                log("截图请求API调用失败: " + e2);
            }
        }

        if (logicThread && logicThread.isAlive()) {
            logicThread.interrupt();
        }

        if (!success) {
            toastLog(" 请求截图权限失败");
            if (stopScriptIfFailed) exit();
            return false;
        }

        log(" 截图权限获取成功");
        return true;
    }
}

// 导出模块
module.exports = ScreenAuthModule;

// ScreenAuthModule.requestScreenCapture();