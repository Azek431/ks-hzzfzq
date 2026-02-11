importClass(com.google.android.material.dialog.MaterialAlertDialogBuilder);

function input(options) {
    if (!options) options = {}

    let DialogLayout = options.view;
    if (!DialogLayout) DialogLayout = ui.inflate(`
        <LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
        xmlns:app="http://schemas.android.com/apk/res-auto"
        xmlns:tools="http://schemas.android.com/tools"
        android:id = "@+id/LinearLayout"
        android:orientation="vertical" >
        
        <com.google.android.material.textfield.TextInputLayout
        android:id = "@+id/inputLayout"
        android:layout_width = "match_parent"
        android:layout_height = "match_parent"
        app:hintEnabled="true"
        app:hintAnimationEnabled="true"
        app:helperText="helpText"
        app:helperTextEnabled="true"
        
        margin = "20 20 20 20"
        
        >
        
        <com.google.android.material.textfield.TextInputEditText
        android:id = "@+id/input"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:inputType="text"
        android:hint = "hint"
        
        />
        
        </com.google.android.material.textfield.TextInputLayout>
        
        </LinearLayout>
    `);
    
    let inputLayout = DialogLayout.inputLayout;
    let input = DialogLayout.input;
    
    if (options.helperText != undefined) inputLayout.attr("helperText", options.helperText);
    if (options.inputType != undefined) input.attr("inputType", options.inputType);
    if (options.hint != undefined) input.attr("hint", options.hint);
    if (options.maxLines != undefined) input.setMaxLines(options.maxLines);
    if (options.text != undefined) input.setText(options.text);

    let Dialog = new MaterialAlertDialogBuilder(activity);
    if (options.title) Dialog.setTitle(options.title);
    Dialog.setView(DialogLayout);

    // 确定
    if (options.positiveButton) Dialog.setPositiveButton(options.positiveButton[0], options.positiveButton[1]);

    // 取消
    if (options.negativeButton) Dialog.setNegativeButton(options.negativeButton[0], options.negativeButton[1]);

    // 默认
    if (options.neutralButton) Dialog.setNeutralButton(options.neutralButton[0], options.neutralButton[1]);

    return {
        dialogLayout: DialogLayout,
        dialog: Dialog,
        input: DialogLayout.input,
        
    };
}

// 输入框示例
function inputExample() {
    let Dialog = input({
        title: "请你输入数值",
        helperText: "数值",
        inputType: "numberDecimal",
        hint: "0.00",
        positiveButton: ["确认", function(view, type) {
            toast(`你输入的是: ${DialogLayout.input.getText()}`)
        }],
        negativeButton: ["取消", function(view, type) {
            toast("取消");
        }],
        neutralButton: ["默认", function(view, type) {
            toast("默认: 0.00")
        }]

    });
    
    let DialogLayout = Dialog.dialogLayout;
    Dialog = Dialog.dialog;
    Dialog.show();
    
}



module.exports = this;