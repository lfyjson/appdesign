define("design/js/controller/save", [ "../model/data", "../model/search", "../tools/method", "../view/dialog", "../view/setting", "./validation", "./setting", "../model/insert", "../view/phone", "./databind", "../tools/escape", "./handlers", "./prompt", "../model/delete", "../view/load-body", "../../../config/config" ], function(require, exports, module) {
    var Model = require("../model/data");
    var Dialog = require("../view/dialog");
    var Validation = require("./validation");
    var Setting = require("./setting").setting;
    var Path = require("../../../config/config").Path;
    var Search = require("../model/search");
    var m = require("../tools/method");
    var oSave = document.getElementById("save");
    init();
    function init() {
        document.body.addEventListener("click", function(ev) {
            var target = ev.target;
            switch (target.dataset.action) {
              case "save":
                saveHandler("save", "保存", false);
                break;

              case "last-save":
                lastSaveHandler(false);
                break;

              case "enabled":
                saveHandler("enabled", "保存并启用", true);
                break;

              case "last-enabled":
                lastSaveHandler(true);
            }
        }, false);
    }
    /**
     * 保存处理
     * @param  {string} type        动作行为
     * @param  {string} btnText     按钮&标题文字
     * @param  {boolean} enabled    是否启用
     * @return {[type]}             [description]
     */
    function saveHandler(type, btnText, enabled) {
        var param = Validation.verify();
        if (param === true) {
            /*验证通过*/
            save(enabled);
        } else if (param == "show-save-dialog") {
            /*填写页面信息*/
            var dialog = Dialog.dialog({
                type: type,
                btnText: btnText,
                data: Model.getData(0)
            });
            //聚焦input
            dialog.querySelector("input:first-child").focus();
        } else {
            /*验证不通过*/
            Dialog.message({
                status: 2,
                text: param.text
            });
            //定位到控件
            console.log(param.id);
            Setting.toFixed(param.id);
        }
    }
    /**
     * 最后一级保存处理
     * @param  {boolean} enalbed 是否启用
     * @return {[type]}         [description]
     */
    function lastSaveHandler(enalbed) {
        var param = Validation.verify();
        if (param === true) {
            save(enalbed);
        } else {
            //验证不通过提示
            var dialog = document.getElementById("dialog-box");
            dialog.classList.add("animation-error");
            setTimeout(function() {
                dialog.classList.remove("animation-zoomIn");
                dialog.classList.remove("animation-error");
            }, 300);
        }
    }
    /**
     * 验证通过保存
     * @param  {boolean} enabled 是否启用
     * @return {[type]}         [description]
     */
    function save(enabled) {
        Model.updateData(0, "enabled", enabled);
        var DATA = Model.DATA;
        //得到格式化数据
        var formatData = Model.getFormatData();
        //loading会话框
        Dialog.dialog({
            type: "loading",
            content: "正在保存"
        });
        m.ajax({
            type: "post",
            url: Path.template,
            data: "action=m.create&data=" + encodeURIComponent(formatData) + "&orgid=" + Search.getOrgid(),
            success: function(data) {
                console.log(data);
                serverSave(data, function(oldTemplate) {
                    //成功回调
                    Dialog.message({
                        status: 1,
                        text: "保存成功" + (enabled ? "，该审批已启用" : "")
                    });
                    //保存成功后删除旧模板文件
                    delTemplate(oldTemplate);
                    //保存成功后，更换最近一次保存模板数据
                    window.sessionStorage.setItem("default", formatData);
                }, error);
            },
            error: error
        });
    }
    /**
     * 向服务器端发送数据
     * @param  {String} dataFileName 模板数据文件名
     * @param  {Function} successFn 成功回调函数
     * @return {[type]}              [description]
     */
    function serverSave(dataFileName, successFn, error) {
        var page = Model.DATA[0];
        var param = Search.sSearch + "&tplid=" + dataFileName;
        param += "&itemname=" + page.title + "&itemdesc=" + page.explain;
        param += "&urlprefix=" + window.location.origin + window.location.pathname;
        param += "&isvalid=" + (page.enabled ? 1 : 0);
        console.log(param);
        m.ajax({
            type: "post",
            url: Path.save,
            data: param,
            success: function(data) {
                data = JSON.parse(data);
                console.log(data);
                if (data.status == 200) {
                    successFn && successFn(data.oldTemplate);
                } else {
                    error(data);
                }
            },
            error: error && error
        });
    }
    /**
     * 删除旧模板
     * @param  {String} oldTemplate 旧模板文件名
     */
    function delTemplate(oldTemplate) {
        m.ajax({
            type: "post",
            url: Path.template,
            data: "action=delete&oldTemplate=" + oldTemplate,
            success: function(data) {
                console.log(data);
            },
            error: function(status) {
                console.log(status);
            }
        });
    }
    //保存失败
    function error(data) {
        var text = data.errmsg ? data.errmsg : "保存失败";
        Dialog.message({
            status: 2,
            text: text
        });
    }
});