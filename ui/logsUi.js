"ui";

$ui.layout(`
    <vertical>
        <appbar>
            <toolbar id="toolbar" title="日志" />
            
            <horizontal>
                <button id = "clear" text = "清空" w = "auto" h = "auto" />
            </horizontal>
            
        </appbar>
        <globalconsole id="console" w="*" h="*" />
    </vertical>
`);



// 自定义日志颜色
$ui.console.setColor("V", "#bdbdbd");
$ui.console.setColor("D", "#795548");
$ui.console.setColor("I", "#1de9b6");
$ui.console.setColor("W", "#673ab7");
$ui.console.setColor("E", "#b71c1c");


// 清空日志
ui.clear.on("click", (view) => {
    ui.console.clear();

})