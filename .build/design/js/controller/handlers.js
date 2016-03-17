define("design/js/controller/handlers", [ "../model/data", "../model/search", "../tools/method", "../view/setting", "./validation", "../tools/escape" ], function(require, exports, module) {
    var Model = require("../model/data");
    //加载model
    var Templates = require("../view/setting").Templates;
    //加载控件设置模板
    var Validation = require("./validation");
    //验证
    var m = require("../tools/method");
    var Escape = require("../tools/escape");
    //转义
    var settingWrap = document.getElementById("setting-wrap");
    init();
    //选项组增删修改事件
    function init() {
        settingWrap.addEventListener("click", function(ev) {
            var target = ev.target;
            //判断行为
            var action = getAction(target);
            //无行为时跳出
            if (!action) return;
            var id = getCurId(target);
            //获取当前控件id
            var data = Model.getData(id);
            switch (action) {
              case "option-add":
                optionsAdd(target, data);
                break;

              case "option-delete":
                optionsDelete(target, data);
            }
        }, false);
        //修改选项
        settingWrap.addEventListener("input", function(ev) {
            var target = ev.target, id;
            if (target.dataset.model === "options") {
                id = getCurId(target);
                optionsUpdate(id, target);
            }
        }, false);
        function getAction(target) {
            switch (target.dataset.model) {
              case "option-add":
                return "option-add";

              case "option-delete":
                return "option-delete";

              default:
                return false;
            }
        }
    }
    //新增选项
    function optionsAdd(target, data) {
        var option = target.parentNode;
        var oItem = option.parentNode;
        var oTemplates = new Templates(data);
        //获取设置模板
        var oNew = m.parseDOM(oTemplates.tOption("选项" + ++data.optionsIndex))[0];
        //获取新选项DOM
        m.insertAfter(oNew, option);
        //插入新选项模板
        Model.updateOptions(data.id, option.dataset.index, "add");
        //修改选项组模型
        setOptionsIndex(oItem);
        //重新设置选项组数据索引值
        oItem.classList.remove("limit-delete");
        //remove限制删除样式
        if (data.options.length >= 200) {
            //达到指定数量时,禁止添加
            oItem.classList.add("limit-add");
        }
    }
    //删除选项
    function optionsDelete(target, data) {
        var option = target.parentNode;
        var oItem = option.parentNode;
        option.parentNode.removeChild(option);
        //删除DOM
        Model.updateOptions(data.id, option.dataset.index, "delete");
        //修改选项组模型
        setOptionsIndex(oItem);
        //重新设置选项组数据索引值
        oItem.classList.remove("limit-add");
        //remove限制增加样式
        if (data.options.length <= 1) {
            //只有一条选项时,禁止删除
            oItem.classList.add("limit-delete");
        }
    }
    //设置选项组数据索引值
    function setOptionsIndex(oItem) {
        var options = oItem.querySelectorAll(".setting-option");
        for (var i = 0; i < options.length; i++) {
            options[i].dataset.index = i;
        }
    }
    //选项组模型修改
    function optionsUpdate(id, target) {
        var value, option = target.parentNode;
        //选项数据验证
        value = Validation.optionVerify(target);
        //超过指定字数||不符合规则 截取
        if (typeof value !== "undefined") target.value = value;
        Model.updateOptions(id, option.dataset.index, "update", Escape.escape(target.value));
    }
    //获取当前控件id
    function getCurId(target) {
        var parent = target.parentNode;
        while (parent.nodeName.toLowerCase() != "html" && parent.dataset.id == undefined) {
            parent = parent.parentNode;
        }
        return parent.dataset.id;
    }
    //图标hanlder
    function iconHanlder(id, newVal) {
        var aIconWrap = document.querySelectorAll("[data-role=curIconWrap]");
        for (var i = 0; i < aIconWrap.length; i++) {
            var aImg = aIconWrap[i].getElementsByTagName("img");
            for (var j = 0; j < aImg.length; j++) {
                if (aImg[j].dataset.value === newVal) {
                    aImg[j].parentNode.classList.add("active");
                } else {
                    aImg[j].parentNode.classList.remove("active");
                }
            }
        }
    }
    exports.iconHanlder = iconHanlder;
});