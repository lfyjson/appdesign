define("mobile/js/controller/watch", [ "./file-handler", "../view/dialog", "../../../config/config", "../model/search", "../tools/method", "../tools/slide", "../tools/base64", "./detail-handler", "../view/templates", "../model/data", "./submit", "./validation", "../model/approver", "./approver-handler", "../tools/escape" ], function(require, exports) {
    function init() {
        //监听input
        document.addEventListener("input", nativeHanlder, false);
        //监听change
        document.addEventListener("change", nativeHanlder, false);
        //监听tap
        document.on("tap", touchendHanlder);
    }
    //tap处理
    function touchendHanlder(ev) {
        var target = ev.target;
        switch (target.dataset.action) {
          case "delete-image":
            //删除图片
            require("./file-handler").del.hanlder(target);
            break;

          case "delete-detail":
            //删除明细
            require("./detail-handler").del.handler(target);
            break;

          case "add-detail":
            //增加明细
            require("./detail-handler").add.hanlder(target);
            break;

          case "submit":
            //提交
            require("./submit").submit();
            break;

          case "add-approver":
            //增加审批人
            setTimeout(function() {
                require("./approver-handler").approver.addHanlder();
            }, 350);
            break;

          case "del-approver":
            //删除审批人
            require("./approver-handler").approver.delHanlder(target);
        }
    }
    //单选&日期&上传处理
    function nativeHanlder(ev) {
        var target = ev.target;
        var value = target.value;
        if (!target.classList.contains("item-native")) return;
        if (target.getAttribute("type") === "file") {
            //上传图片
            require("./file-handler").upload.hanlder(target);
        } else if (value !== "请选择" && value !== "请选择（必填）") {
            var oText = target.previousElementSibling;
            oText.classList.remove("item-prompt");
            target.dataset.enabled = true;
            if (target.getAttribute("type") === "datetime") {
                oText.innerHTML = getDateTime(value);
            } else {
                //XXS过滤
                oText.innerHTML = require("../tools/escape").escape(value);
            }
        }
    }
    function getDateTime(datetime) {
        var oDate = new Date(datetime);
        var date = oDate.getFullYear() + "-" + zeroize(oDate.getMonth() + 1) + "-" + zeroize(oDate.getDate());
        var time = " " + zeroize(oDate.getHours()) + ":" + zeroize(oDate.getMinutes());
        return date + time;
    }
    function zeroize(num) {
        if (num > 9) {
            return num;
        } else {
            return "0" + num;
        }
    }
    exports.init = init;
});