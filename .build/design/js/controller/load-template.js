define("design/js/controller/load-template", [ "../model/search", "../tools/method", "../../../config/config", "../model/format", "../model/data", "../view/phone", "./prompt", "../view/dialog", "../view/setting", "../view/load-body", "./setting", "../model/insert", "./databind", "../tools/escape", "./validation", "./handlers", "../model/delete", "../controller/databind" ], function(require, exports, module) {
    var Search = require("../model/search");
    var Path = require("../../../config/config").Path;
    var Format = require("../model/format");
    var Model = require("../model/data");
    var Phone = require("../view/phone");
    var Prompt = require("./prompt");
    var PhoneBody = require("../view/load-body");
    var Setting = require("./setting").setting;
    var Dialog = require("../view/dialog");
    var Body = require("../view/load-body");
    var m = require("../tools/method");
    var db = require("../controller/databind");
    var oPhoneBody = document.getElementById("phone-body"), oPlace;
    //模板加载情况判断
    var bTpl = [], script;
    function loadScript() {
        //获取模板路径
        var tpl = Search.getTplPath();
        //当hash为空时， 设置为空模板
        if (tpl === "") {
            window.location.hash = "#.tpl/empty";
        } else if (tpl === "default") {
            //从sessionStorage中获取最近一次保存的模板
            var data = window.sessionStorage.getItem("default");
            if (data) {
                loadWidget(data);
            } else {
                window.location.hash = "#.tpl/empty";
            }
        } else if (tpl !== "") {
            if (Model.CACHE[tpl]) {
                //从缓存加载模板
                loadWidget(Model.CACHE[tpl]);
            } else {
                //从网络加载模板
                script = document.createElement("script");
                script.src = Path.designDataPath + tpl + ".js";
                document.body.appendChild(script);
            }
        }
        //模板请求失败
        error();
    }
    function loadWidget(data, tpl) {
        //清空控件视图
        clearWidgets();
        //获取格式化数据
        var datas = Format.format(data);
        //顶级控件
        var aTop = datas[0];
        for (var i = 0; i < aTop.length; i++) {
            //创建新模板
            var newWidget = Phone.createWidget(aTop[i]);
            //写入obj
            // Model.updateData(aTop[i].id, 'obj', newWidget);
            //插入新模板
            oPhoneBody.insertBefore(newWidget, oPlace);
            //明细检测
            if (aTop[i].type == "detail") {
                var oArea = newWidget.querySelector(".phone-area");
                var oPlaceholder = newWidget.querySelector("div[data-role=area]");
                //当前明细内控件集合
                var seconds = datas[aTop[i].id];
                //添加明细内控件
                for (var j = 0; j < seconds.length; j++) {
                    var widget = Phone.createWidget(seconds[j]);
                    //obj赋给DATA
                    Model.updateData(seconds[j].id, "obj", widget);
                    oArea.insertBefore(widget, oPlaceholder);
                }
            }
        }
        //重新切换设置
        Setting.id = 0;
        Setting.showSetting(0, true);
        //控件检测
        Prompt.detection();
        //模板切换成功
        success();
        for (var prop in Model.DATA) {
            //双向数据绑定
            db.DBModel(Model.DATA[prop].id, function(scope) {
                return Model.DATA[prop];
            });
        }
    }
    //清空视图上的模板
    function clearWidgets() {
        //清空视图
        oPhoneBody.innerHTML = "";
        //加入占位符
        oPhoneBody.innerHTML += PhoneBody.tPlaceholder();
        //获取占位符
        oPlace = oPhoneBody.querySelector("div[data-role=placeholder]");
    }
    //模板请求失败
    function error() {
        var index = bTpl.length - 1;
        setTimeout(function() {
            if (bTpl[index]) {
                if (window.sessionStorage.getItem("default")) {
                    tips("message", {
                        status: 0,
                        text: "模板切换失败"
                    });
                }
                removeScript();
            }
        }, 3e3);
    }
    //模板切换成功提示
    function success() {
        var tpl = Search.getTplPath();
        if (tpl && bTpl[bTpl.length - 1]) {
            if (window.sessionStorage.getItem("default")) {
                tips("message", {
                    status: 1,
                    text: "成功切换到" + Body.getTplName(tpl) + "模板"
                });
            }
            bTpl[bTpl.length - 1] = false;
        }
        removeScript();
        //如果未临时存储最近一次保存的模板，则将其从缓存中存到sessionStorage中
        if (!window.sessionStorage.getItem("default")) {
            window.sessionStorage.setItem("default", Model.getFormatData(Model.CACHE["default"]));
        }
    }
    //删除script标签
    function removeScript() {
        if (script && script.parentNode) script.parentNode.removeChild(script);
    }
    //切换提示
    function tips(type, json) {
        //当sessionStorage存储了最近一次保存的模板时，显示提示
        if (window.sessionStorage.getItem("default")) {
            Dialog[type](json);
        }
    }
    window.addEventListener("hashchange", function() {
        tips("dialog", {
            type: "loading",
            content: "正在切换模板"
        });
        //将之前所有请求设置false
        for (var i = 0; i < bTpl.length; i++) {
            bTpl[i] = false;
        }
        //添加模板加载成功判断
        bTpl.push(true);
        loadScript();
    }, false);
    window.loadWidget = loadWidget;
    exports.loadScript = loadScript;
});