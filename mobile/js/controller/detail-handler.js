define(function(require, exports, module) {
    var Templates = require('../view/templates');
    var m = require('../tools/method');

    /**
     * 增加明细
     */
    var add = {
        hanlder: function(target) {
            var oParent = target.parentNode;
            //获取数据集合
            var DATA = require('../model/data').DATA;
            //获取当前明细数据
            var data = this.getData(DATA['0'], target.dataset.id),
                //明细内二级控件
                seconds = DATA[target.dataset.id];
            //无数据时跳出
            if (data == null) return;
            //获取新增明细area html
            var html = Templates.tDetailInner(data.title, 2, true);
            //转换DOM
            var DOM = m.parseDOM(html),
                oTitle = DOM[0],
                oArea = DOM[1];

            //插入标题
            oParent.insertBefore(oTitle, target);
            //插入area
            oParent.insertBefore(oArea, target);

            //设置明细列表索引
            setNum(oParent.querySelectorAll('.detail-num'));
            //插入二级控件
            this.insertWidget(oArea, seconds);
        },
        getData: function(datas, id) {
            for (var i = 0; i < datas.length; i++) {
                if (datas[i].id == id) {
                    return datas[i];
                }
            }
            return null;
        },
        insertWidget: function(wrap, widgets) {
            for (var i = 0; i < widgets.length; i++) {
                wrap.innerHTML += Templates.getWidget(widgets[i]);
            }
        }
    }

    /**
     * 删除明细
     */
    var del = {
        handler: function(target) {
            var self = this;

            var oDialog = require('../view/dialog').dialog({
                content: '你确定要删除吗？'
            });

            oDialog.btnTrue.on('tap', function() {
                self.removeDetail(target);
            }, false);
        },
        removeDetail: function(target) {
            var oTitle = target.parentNode;
            var oArea = oTitle.nextElementSibling;
            var oParent = oTitle.parentNode;

            oParent.removeChild(oTitle);
            oParent.removeChild(oArea);

            setNum(oParent.querySelectorAll('.detail-num'));
        }
    }

    /**
     * 设置明细列表索引
     * @param {Object} nums num标签集合
     */
    function setNum(nums) {
        for (var i = 0; i < nums.length; i++) {
            nums[i].innerHTML = i + 1;
        }
    }

    exports.add = add;
    exports.del = del;
});
