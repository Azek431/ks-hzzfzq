/* ui初始化 */
function create() {
    // 使用安卓资源
    $ui.useAndroidResources();
    
    // 设置 Material 3 亮色主题
    activity.setTheme(com.google.android.material.R$style.Theme_Material3_Light);
    
    // 设置应用主题
    activity.theme.applyStyle(ui.R.style["Theme.Material3.Light"], true);


    // 设置导航栏颜色
    activity
        .getWindow()
        .setNavigationBarColor(Color.parseColor("#E8EFF7"));


    //亮色状态栏
    function StatusBarTransparency() {
        importClass(android.view.View);
        // 状态栏背景透明, 不加的话, 状态栏是绿色, 默认的主题色
        ui.statusBarColor(colors.TRANSPARENT);
        var SystemUiVisibility = (ve) => {
            var option =
                //View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN |
                (ve ? View.SYSTEM_UI_FLAG_LAYOUT_STABLE : View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR);
            activity.getWindow()
                .getDecorView()
                .setSystemUiVisibility(option);
        };
        SystemUiVisibility(false);
    }
    StatusBarTransparency();


    // 设置状态栏颜色
    ui.statusBarColor("#fafafa");
    
    // 对应文件 res/layout/activity_main.xml
    ui.layoutFile("res/layout/activity_main.xml");
    

}
/* ui初始化 */



module.exports = this;