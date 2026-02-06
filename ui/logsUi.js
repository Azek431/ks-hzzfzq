"ui";
// 导入类
importClass(android.graphics.Color)


$ui.layout(`
    <vertical>
        <appbar>
            <toolbar id="toolbar" title="日志 {{app.versionName}}" />
        </appbar>
        <globalconsole id="console" w="*" h="*" />
    </vertical>
`);

$ui.useAndroidResources();


// 设置 Material 3 亮色主题
activity.setTheme(com.google.android.material.R$style.Theme_Material3_Light);

// 设置应用主题
activity.theme.applyStyle(ui.R.style["Theme.Material3.Light"], true);


// 设置导航栏颜色
activity
    .getWindow()
    .setNavigationBarColor(Color.parseColor("#E8EFF7"));


// 自定义日志颜色
$ui.console.setColor("V", "#bdbdbd");
$ui.console.setColor("D", "#795548");
$ui.console.setColor("I", "#1de9b6");
$ui.console.setColor("W", "#673ab7");
$ui.console.setColor("E", "#b71c1c");


// 隐藏代码执行功能
let MaterialDesignDialog = require(`${files.cwd()}/module/MaterialDesignDialog.js`);
$ui.toolbar.setOnLongClickListener(function(view) {
    let Dialog = MaterialDesignDialog.input({
        title: "请你输入要执行的代码",
        helperText: "JavaScript",
        inputType: "textMultiLine",
        maxLines: 2147483647, 
        hint: "",
        positiveButton: ["执行", function(view, type) {
            let code = DialogLayout.input.getText();
            engines.execScript("scriptTestCode", code);
            
        }],
        negativeButton: ["取消", function(view, type) {
            toast("取消");

        }]

    });

    let DialogLayout = Dialog.dialogLayout;
    Dialog = Dialog.dialog;
    Dialog.show();
    
    return true;
})

