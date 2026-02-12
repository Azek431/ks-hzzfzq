function main(w) {
    // 执行状态
    w.cycleRun.runState = 0;

    w.cycleRun.setOnClickListener(function(view) {
        view.setEnabled(false)
        if (view.runState) {
            view.setText("循环执行")
            view.runState = 0;

            script.cycleRun.state = 0;

        } else {
            view.setText("停止执行")
            view.runState = 1;

            threads.start(function() {
                script.cycleRun();

            })

        }

        view.setEnabled(true);

        return true;
    })

    // 单次执行
    w.aRun.setOnClickListener((view) => {
        threads.start(() => {
            script.mainRun();
            
        })

        return true;
    })
    
    // 配置设置
    w.configAdjust.setOnLongClickListener((view) => {
        // ui.configAdjust.longClick();
        let allStorage = getStorageAll(storageName);
        let storageText = JSON.stringify(allStorage, null, 2);
        let Dialog = MaterialDesignDialog.input({
            title: "请你输入配置数据",
            helperText: "json",
            inputType: "textMultiLine",
            maxLines: 2147483647,
            hint: storageText,
            text: storageText,
            activity: activity, 
            positiveButton: ["修改", function(view, type) {
                let text = DialogLayout.input.getText();
                let json = JSON.parse(text);
                
                setStorageData(storage, json);
                
                refreshUi(); // 刷新ui
                console.log(`成功修改配置数据为: ${JSON.stringify(getStorageAll(storageName), null, 2)}`)
                toast("成功修改配置数据！");


            }],
            negativeButton: ["复制", function(view, type) {
                setClip(storageText);
                toast("成功将配置数据赋值到剪贴板！");

            }],
            neutralButton: ["恢复默认", function(view, type) {
                storages.remove(storageName);
                refreshUi();
                toast("成功将配置数据恢复默认!");

            }]

        });

        let DialogLayout = Dialog.dialogLayout;
        Dialog = Dialog.dialog;
        Dialog.show();
        
        return true;
    })

}



module.exports = this;