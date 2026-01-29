/* 初始化 (init) */
function init() {
    console.time("初始化类用时");
    
    // OpenCV 初始化
    runtime.images.initOpenCvIfNeeded();


    // 导入 java 相关类
    importClass(java.util.List);
    importClass(java.util.ArrayList);
    importClass(java.util.LinkedList);

    // 导入 OpenCV 类
    importClass(org.opencv.core.MatOfByte);
    importClass(org.opencv.core.Scalar);
    importClass(org.opencv.core.Point);
    importClass(org.opencv.core.CvType);
    importClass(org.opencv.core.Core);
    importClass(org.opencv.core.Mat);
    importClass(org.opencv.core.MatOfDMatch);
    importClass(org.opencv.core.MatOfKeyPoint);
    importClass(org.opencv.core.MatOfRect);
    importClass(org.opencv.core.Size);
    importClass(org.opencv.core.MatOfPoint2f)

    importClass(org.opencv.imgproc.Imgproc);
    importClass(org.opencv.imgcodecs.Imgcodecs)

    importClass(org.opencv.android.Utils)


    // 导入安卓类
    importClass(android.content.Intent)
    importClass(android.widget.Toast)
    importClass(android.net.Uri)
    importClass(android.graphics.Color)
    importClass(android.graphics.BitmapFactory)
    importClass(android.graphics.Bitmap)
    importClass(android.graphics.Paint)
    // importClass(android.graphics.Rect)
    importClass(android.graphics.Matrix)
    importClass(android.graphics.RectF)
    importClass(android.graphics.PorterDuff)

    // 导入 Material 类
    importClass(com.google.android.material.dialog.MaterialAlertDialogBuilder)

    // 导入 androidx 类
    importClass(Packages.androidx.appcompat.widget.PopupMenu)


    // 导入auto类
    importClass(com.stardust.autojs.core.image.ImageWrapper);

    console.timeEnd("初始化类用时");
}


module.exports = this;