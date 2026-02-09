"auto";

function on(ui) {
    // 打开悬浮窗
    ui.openWindow.setOnClickListener(function(view) {
        threads.start(function() {
            ScreenAuthModule.requestScreenCapture();
            // openGetScreenPermissions();

        })

        windowShow();

    })

    // 画板
    function canvasOn(canvas) {
        // canvas 绘制
        let paintImg = new Paint();

        // 画板刷新
        canvas.on("draw", function(canvas) {
            canvas.drawColor(Color.TRANSPARENT, PorterDuff.Mode.CLEAR);
            canvas.drawARGB(255, 255, 255, 255);

            let matrix = new Matrix();

            // 自适应
            let src = new RectF(0, 0, showBitmapImg.getWidth(), showBitmapImg.getHeight())
            let dst = new RectF(0, 0, canvas.getWidth(), canvas.getHeight());

            matrix.setRectToRect(src, dst, Matrix.ScaleToFit.CENTER);

            // 缩放
            ui.canvas.attr("scaleX", imgShowScale);
            ui.canvas.attr("scaleY", imgShowScale);

            canvas.drawBitmap(showBitmapImg, matrix, paintImg);

            return true;
        })

        // 图片查看
        canvas.setOnLongClickListener(function(view) {
            app.viewFile(currentShowImgPath);

            return true;
        })

    }
    canvasOn(ui.canvas);

    // 选择图片
    ui.selectImg.setOnClickListener(function() {
        let fileType = "image/*";
        var intent = new Intent();

        intent.setType(fileType);
        intent.setAction(Intent.ACTION_GET_CONTENT)
        activity.startActivityForResult(intent, 1);

    })

    // 缩放调整滑动条变化
    ui.scaleSlider.addOnChangeListener({
        onValueChange: (view, value, fromUser) => {
            imgShowScale = value;
            storage.put("imgShowScale", imgShowScale);
            ui.scaleText.setText("缩放: " + value.toFixed(2));

        },
    });

    // 测试算法点击事件【优化版：稳+容错+体验佳，新增绘制用时统计】
    ui.testScript.setOnClickListener((view) => {
        // 前置校验：路径/图片读取兜底，避免空路径报错
        if (!currentImgPath || currentImgPath.trim() === "") {
            toast("测试失败：未获取到有效图片路径");
            return true;
        }

        try {
            // 1. 读取测试图片，强校验有效性
            let img = images.read(currentImgPath);
            if (!img || !img.bitmap) {
                toast("测试失败：图片读取失败/图片文件损坏");
                return true;
            }

            let data = {}
            let text = "";

            // 2. 计时执行荆棘识别，核心测试逻辑
            let startTime = Date.now();
            data.thorns = script.getThornsData(img);
            text = `识别用时: ${Date.now() - startTime} ms`;

            // 获取分数点数
            startTime = Date.now();
            data.scorePoints = script.getScorePoints(img);
            text += `\n获取分数区域点数用时: ${Date.now() - startTime} ms`


            // 3. 初始化测试文本，区分识别结果
            let drawCost = 0; // 绘制耗时初始化
            if (data.thorns.length > 0) {
                text = `测试成功！${text}`;
                // 计时执行绘制，新增绘制耗时统计
                let drawStartTime = Date.now();
                let drawImg = script.drawImg(img, data);
                drawCost = Date.now() - drawStartTime; // 计算绘制耗时
                // 校验绘制结果
                if (drawImg) {
                    setShowImgValue(drawImg, {
                        show: true
                    });
                    text += `\n绘制用时: ${drawCost} ms`; // 拼接绘制用时
                } else {
                    text += `\n⚠️  荆棘识别成功，但绘制失败 (绘制用时: ${drawCost} ms)`;
                }
            } else {
                text = `未识别到荆棘, ${text}`;
            }

            // 4. 计算跳跃参数，全程校验避免异常
            let endX = script.ckltEndX(data.thorns);
            let pressTime = script.ckltJumpToXTime(endX);
            // 格式化参数展示，兜底非法值
            endX = (typeof endX === 'number' && endX >= 0) ? endX.toFixed(0) : "无效";
            pressTime = (typeof pressTime === 'number' && pressTime >= 0) ? pressTime.toFixed(1) : "无效";

            // 5. 拼接最终测试信息，补充落点坐标
            text += `\n落点X坐标: ${endX}px\n长按时间: ${pressTime}ms`;

            // 6. 友好提示测试结果
            toast(text);

        } catch (e) {
            // 全局异常捕获，精准提示错误原因
            toast(`测试异常：${e.message || "未知错误"}`);
            console.error("测试算法报错：", e);
        }

        return true;
    });

    // 恢复图片
    ui.recoverImg.setOnClickListener((view) => {
        let img = images.read(currentImgPath);
        setShowImgValue(img, {
            show: true
        });

        toast("恢复成功");
    })

    // 底部导航栏选项
    let navigationBarBoor = storage.get("navigationBarBoor") || false;
    ui.navigationBarSelect.setOnClickListener((view) => {
        if (navigationBarBoor) {
            navigationBarBoor = false;
            script.thornsCenterYPpsIndex = 1;

            toast("已成功将底部导航栏设为: 无");
        } else {
            navigationBarBoor = true;

            script.thornsCenterYPpsList[1] = script.thornsCenterYPps;
            script.thornsCenterYPpsIndex = 2;

            toast("已成功将底部导航栏设为: 有");
        }

        script.thornsCenterYPps = script.thornsCenterYPpsSelect(script.thornsCenterYPpsIndex);

        ui.navigationBarSelect.refreshUi();
        ui.setThornsCenterYPps.refreshUi();

        return true;
    })
    ui.navigationBarSelect.refreshUi = function() {
        if (navigationBarBoor) {
            ui.navigationBarSelect.setText("底部导航栏: 有");
        } else {
            ui.navigationBarSelect.setText("底部导航栏: 无");
        }
        storage.put("navigationBarBoor", navigationBarBoor);
    }
    ui.setThornsCenterYPps.setText(`荆棘中心y占比: ${script.thornsCenterYPps}`);


    // 打开日志
    ui.toolbar.setOnLongClickListener((view) => {
        engines.execScriptFile(`./ui/logsUi.js`);


        return true;
    })

    // 设置荆棘中心y占比
    ui.setThornsCenterYPps.refreshUi = function() {
        let view = ui.setThornsCenterYPps;
        view.setText(`荆棘中心y占比: ${script.thornsCenterYPps}`);
        view.setText(`${view.getText()} ( ${sd.pty(script.thornsCenterYPps)}px )`);

        storage.put("thornsCenterYPps", script.thornsCenterYPps);
        storage.put("thornsCenterYPpsIndex ", script.thornsCenterYPpsIndex);
        storage.put("thornsCenterYPpsList", script.thornsCenterYPpsList);

    }
    ui.setThornsCenterYPps.refreshUi();

    ui.setThornsCenterYPps.setOnClickListener((mainView) => {
        let thornsCenterYPps = script.thornsCenterYPps;

        let Dialog = MaterialDesignDialog.input({
            title: "请你输入荆棘中心y占比",
            helperText: "数值",
            inputType: "numberDecimal",
            hint: thornsCenterYPps,
            positiveButton: ["确认", function(view, type) {
                let numText = DialogLayout.input.getText();

                if (numText != "") {
                    thornsCenterYPps = numText;
                    script.thornsCenterYPps = thornsCenterYPps;

                }

                mainView.refreshUi();
                toast("成功将荆棘中心y占比设置为: " + script.thornsCenterYPps);

            }],
            negativeButton: ["取消", function(view, type) {
                toast("取消");

            }],
            neutralButton: ["默认", function(view, type) {
                script.thornsCenterYPpsIndex = 0;
                script.thornsCenterYPps = script.thornsCenterYPpsList[script.thornsCenterYPpsIndex];

                mainView.refreshUi();
                toast(`已成功恢复默认: ${script.thornsCenterYPps}`);

            }]

        });

        let DialogLayout = Dialog.dialogLayout;
        Dialog = Dialog.dialog;
        Dialog.show();

        return true;
    })
    ui.setThornsCenterYPps.setOnLongClickListener(function(mainView) {
        let thornsCenterY = sd.pty(script.thornsCenterYPps);
        let Dialog = MaterialDesignDialog.input({
            title: "请你输入荆棘中心y坐标",
            helperText: "坐标 (y)",
            inputType: "numberDecimal",
            hint: thornsCenterY,
            positiveButton: ["确认", function(view, type) {
                let numText = DialogLayout.input.getText();

                if (numText != "") {
                    thornsCenterY = numText;
                    script.thornsCenterYPps = sd.ypps(thornsCenterY);

                }

                mainView.refreshUi();
                toast(`成功将荆棘中心y坐标设置为: ${thornsCenterY}px`);

            }],
            negativeButton: ["取消", function(view, type) {
                toast("取消");

            }],
            neutralButton: ["默认", function(view, type) {
                script.thornsCenterYPpsIndex = 0;
                script.thornsCenterYPps = script.thornsCenterYPpsList[script.thornsCenterYPpsIndex];

                mainView.refreshUi();
                toast(`已成功恢复默认: ${sd.pty(script.thornsCenterYPps)}px`);

            }]

        });

        let DialogLayout = Dialog.dialogLayout;
        Dialog = Dialog.dialog;
        Dialog.show();

        return true;
    })


    // 状态栏偏移选项
    let statusBarHeightOffsetBoor = storage.get("statusBarHeightOffsetBoor");
    if (statusBarHeightOffsetBoor === undefined) statusBarHeightOffsetBoor = true;

    ui.statusBarHeightOffset.setOnClickListener((view) => {
        if (statusBarHeightOffsetBoor) {
            statusBarHeightOffsetBoor = false;

            script.cw.setPosition(script.cw.getX(), 0);

            toast("已成功将底部导航栏设为: 无");
        } else {
            statusBarHeightOffsetBoor = true;

            script.cw.setPosition(script.cw.getX(), -getStatusBarHeightCompat());

            toast("已成功将底部导航栏设为: 开启");
        }

        view.refreshUi();
        return true;
    })

    // 设置状态栏偏移
    ui.statusBarHeightOffset.setOnLongClickListener(function(mainView) {
        let Dialog = MaterialDesignDialog.input({
            title: "请你输入状态栏y偏移数值",
            helperText: "px",
            inputType: "text",
            hint: script.cw.getY(),
            positiveButton: ["确认", function(view, type) {
                let textNum = Number(DialogLayout.input.getText());

                script.cw.setPosition(script.cw.getX(), textNum);
                toast(`已成功将状态栏y偏移设为: ${script.cw.getY()}px`)

                mainView.refreshUi();
            }],
            negativeButton: ["取消", function(view, type) {
                toast("取消");

            }],
            neutralButton: ["默认", function(view, type) {
                mainView.click();
                mainView.click();

            }]

        });

        let DialogLayout = Dialog.dialogLayout;
        Dialog = Dialog.dialog;
        Dialog.show();

        return true;
    })
    ui.statusBarHeightOffset.refreshUi = function() {
        let view = ui.statusBarHeightOffset;
        if (statusBarHeightOffsetBoor) {
            view.setText("状态栏偏移: 开启");
        } else {
            view.setText("状态栏偏移: 无");
        }
        if (script.cw) view.setText(`${view.getText()} ( ${script.cw.getY()}px )`);

        storage.put("currentWindowY", script.cw.getY());
        storage.put("statusBarHeightOffsetBoor", statusBarHeightOffsetBoor);
    }
    setTimeout(function() {
        ui.statusBarHeightOffset.refreshUi();
    }, 100);



    // 隐藏执行代码功能
    ui.scriptTestText.setOnLongClickListener(function(view) {
        let Dialog = MaterialDesignDialog.input({
            title: "请你输入要执行的代码",
            helperText: "JavaScript",
            inputType: "textMultiLine",
            maxLines: 2147483647,
            hint: "",
            positiveButton: ["执行", function(view, type) {
                let code = DialogLayout.input.getText();
                eval(String(code));

            }],
            negativeButton: ["取消", function(view, type) {
                toast("取消");

            }],
            neutralButton: ["新线程执行", function(view, type) {
                let code = DialogLayout.input.getText();
                threads.start(function() {
                    eval(String(code));

                })

            }]

        });

        let DialogLayout = Dialog.dialogLayout;
        Dialog = Dialog.dialog;
        Dialog.show();


        return true;
    })

    // 等待到分数变化
    ui.whileScoreChange.setOnClickListener(function(view) {
        if (script.whileScoreChangeBoor) {
            script.whileScoreChangeBoor = false;
            toast("成功设置等待分数变化为: 开启");
        } else {
            script.whileScoreChangeBoor = true;
            toast("成功设置等待分数变化为: 关闭");
        }

        view.refreshUi();
        return true;
    });
    ui.whileScoreChange.setOnLongClickListener(function(mainView) {
        let waitTime = script.waitTime;
        let Dialog = MaterialDesignDialog.input({
            title: "请你输入 循环等待时间 / 检测分数变化最大等待时间 ",
            helperText: "等待时间 ( ms )",
            inputType: "numberDecimal",
            hint: waitTime,
            positiveButton: ["确认", function(view, type) {
                let numText = DialogLayout.input.getText();

                if (numText != "") {
                    waitTime = numText;
                    script.waitTime = waitTime;

                }

                mainView.refreshUi();
                toast(`成功将时间为: ${script.waitTime}ms`)

            }],
            negativeButton: ["取消", function(view, type) {
                toast("取消");

            }],
            neutralButton: ["默认", function(view, type) {
                script.waitTime = 134;

                mainView.refreshUi();
                toast(`已成功恢复默认: ${script.waitTime}ms`)
            }]

        });

        let DialogLayout = Dialog.dialogLayout;
        Dialog = Dialog.dialog;
        Dialog.show();


        return true;
    })

    ui.whileScoreChange.refreshUi = function() {
        let view = ui.whileScoreChange;

        if (script.whileScoreChangeBoor) view.setText("等待到分数点数变化: 开启")
        else view.setText("等待到分数点数变化: 关闭");

        view.setText(`${view.getText()} ( ${script.waitTime}ms )`);

        storage.put("waitTime", script.waitTime);
        storage.put("whileScoreChangeBoor", script.whileScoreChangeBoor);
    }
    ui.whileScoreChange.refreshUi();


    // 复制 GitHub 网址
    ui.openGithubText.setOnClickListener(function(view) {
        setClip(githubWeb);

        toast(`复制成功: ${getClip()}`)

        return true;
    })

    // 跳转 GitHub 网站
    ui.openGithubText.setOnLongClickListener(function(view) {
        //创建Intent对象
        var intent = new Intent(Intent.ACTION_VIEW, Uri.parse(githubWeb));

        //启动Activity
        app.startActivity(intent);

        return true;
    })

    // 主题颜色选择
    ui.ThemeColorsSelect.setOnClickListener(function(view) {
        var Color = [{
            color: "#F8C3CD",
            name: "退红"
        }, {
            color: "#FFC408",
            name: "籐黄"
        }, {
            color: "#58B2DC",
            name: "天蓝"
        }, {
            color: "#7DB9DE",
            name: "勿忘草"
        }, {
            color: "#005CAF",
            name: "琉璃"
        }, {
            color: "#7B90D2",
            name: "红碧"
        }, {
            color: "#080808",
            name: "黑"
        }, {
            color: "#562E37",
            name: "似紫"
        }, {
            color: "#9B6E23",
            name: "狐"
        }, {
            color: "#F05E1C",
            name: "黄丹"
        }];
        var popupMenu = new PopupMenu(activity, view);
        var menu = popupMenu.getMenu();
        for (var i = 0; i < Color.length; i++) {
            menu.add(Color[i].name);
        }
        let themeColor = ThemeColor;
        popupMenu.setOnMenuItemClickListener(new PopupMenu.OnMenuItemClickListener({
            onMenuItemClick: function(item) {
                for (var i = 0; i < Color.length; i++) {
                    if (Color[i].name == item.getTitle()) {
                        themeColor = Color[i].color;
                        break;
                    }
                }
                
                setThemeColor(themeColor);
                return true;
            }
        }));
        popupMenu.show();
        return true;
    })


}



module.exports = this;