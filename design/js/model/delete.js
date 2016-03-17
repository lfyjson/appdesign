define(function(require, exports, module) {
    var Model = require('./data');
    var m = require('../tools/method');

    /**
     * 删除控件模板&数据
     * @param  {object} target 关闭按钮DOM对象
     * @return {string}        被删除的控件id集合
     */
    function deleteItem(target) {
        var oItem = target.parentNode.parentNode;
        var oWrap = oItem.parentNode;
        var id = oItem.dataset.id;
        var arr = [];

        if (oItem.dataset.type == 'detail') {
            //循环删除明细内控件数据
            var DATA = Model.DATA;
            for (var i = 0; i < DATA.length; i++) {
                if (DATA[i].parentId == id) {
                    arr.push(DATA[i].id);
                    Model.deleteData(DATA[i].id);
                }
            }
        }
        oWrap.removeChild(oItem);
        arr.push(id);
        Model.deleteData(id);

        return arr.join(",");
    }

    exports.deleteItem = deleteItem;
});
