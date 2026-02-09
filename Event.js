// 接收图片
activity.getEventEmitter().on("activity_result", (requestCode, resultCode, data) => {
    try {
        // 图片uri
        let imgUri = data.getData();
        // ui.imgUriText.setText(String(imgUri));

        // showBitmapImg
        let cr = context.getContentResolver();

        if (cr) {
            setShowBitmapImg(BitmapFactory.decodeStream(cr.openInputStream(imgUri)), {
                "storage": true

            });

        }

        // 文件路径
        // imgPath = uriToFile(imgUri);
        // ui.imgPathText.setText(imgPath);

    } catch (e) {
        console.error(e);

    }


});