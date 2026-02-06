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
            // 截图
            let img = captureScreen();

            // let startTime = Date.now();

            script.mainRun(img);


            // let text = `用时: ${Date.now() - startTime} ms`;
            // toast(text)

        })

        return true;
    })

}



module.exports = this;