define("design/js/controller/preview", [ "../model/data", "../model/search", "../tools/method", "../view/dialog", "../view/setting", "../../../config/config", "../tools/qrcode" ], function(require, exports, module) {
    var Model = require("../model/data");
    var Dialog = require("../view/dialog");
    var Path = require("../../../config/config").Path;
    var Search = require("../model/search");
    var qr = require("../tools/qrcode");
    var m = require("../tools/method");
    var DATA = Model.DATA;
    var oDialog, oQrcode, oPreview = document.getElementById("preview");
    function init() {
        bindPreview();
    }
    function bindPreview() {
        oPreview.addEventListener("click", function() {
            var data = Model.getFormatData(DATA);
            //显示弹窗
            showDialog();
            var param = "data=" + encodeURIComponent(data) + "&orgid=" + Search.getOrgid() + "&urlprefix=" + Search.getUrlPrefix();
            //新建&修改云模板使用
            // param += '&fileName=' + Search.getTplPath();
            m.ajax({
                type: "post",
                url: Path.preview,
                data: param,
                success: success,
                error: error
            });
        }, false);
    }
    function showDialog() {
        oDialog = Dialog.dialog({
            type: "preview"
        });
        //获取二维码div
        oQrcode = oDialog.querySelector(".dialog-code");
    }
    function success(data) {
        console.log(data);
        if (data != 0) {
            //生成二维码
            var qrcode = new qr.QRCode(oQrcode, {
                width: 160,
                height: 160
            });
            qrcode.makeCode(data);
        } else {
            error();
        }
    }
    function error(status) {
        Dialog.message({
            status: 2,
            text: "预览失败"
        });
    }
    exports.init = init;
});