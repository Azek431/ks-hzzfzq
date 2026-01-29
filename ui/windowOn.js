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

    w.aRun.setOnClickListener((view) => {
        threads.start(() => {
            script.run();

        })

        return true;
    })

}



module.exports = this;