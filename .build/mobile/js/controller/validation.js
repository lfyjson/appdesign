define("mobile/js/controller/validation", [ "../model/data", "../view/dialog", "../tools/method", "../model/approver" ], function(require, exports) {
    var Model = require("../model/data");
    var Dialog = require("../view/dialog");
    var m = require("../tools/method");
    var Approver = require("../model/approver").approver;
    function check() {
        //获取所有控件
        var widgets = document.querySelectorAll("div[data-order]");
        for (var i = 0; i < widgets.length; i++) {
            var widget = widgets[i];
            //获取控件数据
            var data = Model.DATA[widget.dataset.parentid][widget.dataset.order - 1];
            //验证
            var text;
            if (validate[data.type]) {
                text = validate[data.type](widget, data);
            }
            //会话框提示
            if (text != null) {
                Dialog.tips({
                    content: text,
                    time: 1500
                });
                break;
            }
        }
        //审批人判断
        if (Approver.toid.length < 1 && !text) {
            text = "请选择审批人";
            Dialog.tips({
                content: text,
                time: 1500
            });
        }
        //返回验证结果
        if (!!text && text.length > 0) {
            return false;
        } else {
            return true;
        }
    }
    var maxLength = {
        text: 20,
        textarea: 400,
        number: 20
    };
    //控件验证
    var validate = {
        text: function(widget, data) {
            var input = widget.querySelector("[data-native]");
            var str = input.value;
            var max = maxLength[data.type];
            if (data.require && str.length < 1) {
                return emptyHint(data);
            } else if (m.strlen(str) > max[data.type]) {
                return data.title + "最多输入" + max + "个字";
            }
        },
        textarea: function(widget, data) {
            return this.text(widget, data);
        },
        number: function(widget, data) {
            var input = widget.querySelector("[data-native]");
            var str = input.value;
            var max = maxLength[data.type];
            if (data.require && str.length < 1) {
                return emptyHint(data);
            } else if (str.length > max) {
                return data.title + "最多输入" + max + "个数字";
            }
        },
        radio: function(widget, data) {
            var sel = widget.querySelector("[data-native]");
            //单选框是否选择	
            if (data.require && !sel.dataset.enabled) {
                return emptyHint(data);
            }
        },
        date: function(widget, data) {
            var input = widget.querySelector("[data-native]");
            if (data.require && input.value.length < 1) {
                return emptyHint(data);
            }
        },
        dateRange: function(widget, data) {
            var inputs = widget.querySelectorAll("[data-native]");
            var begin = inputs[0].value;
            var end = inputs[1].value;
            if (data.require) {
                if (begin.length < 1) {
                    return "请选择" + data.title;
                } else if (end.length < 1) {
                    return "请选择" + data.title2;
                }
            }
            if (begin.length > 0 && end.length > 0) {
                var beginTime = new Date(begin).getTime();
                var endTime = new Date(end).getTime();
                if (beginTime > endTime) {
                    return data.title + "不能大于" + data.title2;
                }
            }
        },
        image: function(widget, data) {
            var aImg = widget.querySelectorAll("img");
            if (data.require && aImg.length < 1) {
                return emptyHint(data);
            }
        }
    };
    /**
     * 必填项为空时的提示
     * @param  {Object} data 当前控件json数据
     * @return {String}      提示文字
     */
    function emptyHint(data) {
        //验证有效性为false
        switch (data.type) {
          case "date":
            return "请选择" + data.title;
            break;

          case "image":
            return "请上传" + data.title;
            break;

          case "number":
            return data.title + "不能为空且必须为数字";
            break;

          case "radio":
            return "请选择" + data.title;
            break;

          default:
            return data.title + "内容不能为空";
        }
    }
    exports.check = check;
});