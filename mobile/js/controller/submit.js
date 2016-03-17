define(function(require, exports) {
    var Validation = require('./validation');
    var Model = require('../model/data');
    var Dialog = require('../view/dialog');
    var Path = require('../../../config/config').Path;
    var Search = require('../model/search');
    var m = require('../tools/method');
    var Approver = require('../model/approver').approver;

    function submit() {
        //验证表单
        var valid = Validation.check();

        if (valid) {
            var page = Model.DATA[-1]['0'];
            var item = '&itemname=' + (page.title ? page.title : '暂无');
            item += '&itemdesc=' + (page.explain ? page.explain : '暂无');
            var param = 'data=' + JSON.stringify(getFormatData()) + '&' + Search.sSearch;
            //项目简介
            param += item;
            //url前缀
            param += '&urlprefix=' + Search.getUrlPrefix();
            //是否启用
            param += '&isvalid=' + (page.enabled ? 1 : 0);
            //已选择审批人
            param += Approver.get();
            //icon图标
            param += '&iconurl=' + page.iconURL;

            console.log(param);
            m.ajax({
                type: 'post',
                url: Path.submit,
                data: param,
                beforeSend: function() {
                    Dialog.tips({
                        type: 'loading',
                        content: '正在努力提交中...'
                    });
                },
                success: function(data) {
                    data = JSON.parse(data);
                    console.log(data);
                    if (data.status == 200) {
                        success(data);
                    } else {
                        error(data);
                    }
                },
                error: error
            });

        }
    }

    function success(data) {
        Dialog.tips({
            content: '提交成功',
            time: 1500,
            onTimeEnd: function() {
                //提交成功后跳转到成功页面
                if (data.fdurl) {
                    //window.location.href = data.fdurl + '&' + Search.sSearch;
                }
            }
        });
    }

    function error(data) {
        Dialog.tips({
            content: data.msgdesc ? data.msgdesc : '提交失败',
            time: 1500
        });
    }

    //获取键值对格式化数据
    function getFormatData() {
        var widgets = document.querySelectorAll('div[data-parentid="0"]');
        return getWidgetsData(widgets);
    }

    //获取控件键值对数据
    function getWidgetsData(widgets) {
        var json = {};
        for (var i = 0; i < widgets.length; i++) {
            var widget = widgets[i];
            //获取控件数据
            var data = Model.DATA[widget.dataset.parentid][widget.dataset.order - 1];

            if (get[data.type]) {
                json[i + '.' + data.type] = get[data.type](widget, data);
            }
        }
        return json;
    }

    //获取不同类型控件键值对
    var get = {
        text: function(widget, data) {
            var json = {};
            var value = widget.querySelector('[data-native]').value;
            json[data.title] = value;
            return json;
        },
        textare: function(widget, data) {
            return this.text(widget, data);
        },
        number: function(widget, data) {
            return this.text(widget, data);
        },
        date: function(widget, data) {
            return this.text(widget, data);
        },
        radio: function(widget, data) {
            var json = {};
            var sel = widget.querySelector('[data-native]');
            if (!sel.dataset.enabled) {
                //单选框未选择时,值为空
                json[data.title] = '';
            } else {
                json[data.title] = sel.value;
            }

            return json;
        },
        dateRange: function(widget, data) {
            var json = {};
            var inputs = widget.querySelectorAll('[data-native]');

            json[data.title] = inputs[0].value;
            json[data.title2] = inputs[1].value;

            return json;
        },
        image: function(widget, data) {
            var json = {};
            var imgs = widget.querySelectorAll('img');
            for (var i = 0; i < imgs.length; i++) {
                var URL = {
                    thumbURL: imgs[i].src,
                    naturalURL: imgs[i].dataset.src
                }
                json[imgs[i].dataset.imgid] = URL;
            }
            console.log(json);
            return json;
        },
        detail: function(widget, data) {
            var json = {};
            var aArea = widget.querySelectorAll('.detail-area');
            for (var i = 0; i < aArea.length; i++) {
                var widgets = aArea[i].querySelectorAll('div[data-parentid]');
                json[data.title + '(' + i + ')'] = getWidgetsData(widgets);
            }
            return json;
        }
    }


    exports.submit = submit;
});
