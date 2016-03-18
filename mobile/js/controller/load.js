define(function(require, exports) {
    var Templates = require('../view/templates');
    var Model = require('../model/data');
    var Search = require('../model/search');
    var Path = require('../../../config/config').Path;
    var m = require('../tools/method');

    var script;

    function loadScript() {
        if (!!Search.oSearch && Search.oSearch.tplid !== 'undefined') {
            script = document.createElement('script');
            script.src = Path.mobileDataPath + Search.oSearch.tplid + '.js';
            document.body.appendChild(script);
        }
    }

    window.loadWidget = function(data) {

        //格式化数据
        Model.format(data);

        //格式化后的数据
        var DATA = Model.DATA;

        var pageTitle = DATA['-1'][0].title;
        if (pageTitle) document.title = pageTitle;

        //顶级控件
        var aTop = DATA['0'];

        //加载主体标签
        var main = Templates.getMain();
        document.body.appendChild(main);

        for (var i = 0; i < aTop.length; i++) {

            //控件DOM
            var oItem = m.parseDOM(Templates.getWidget(aTop[i]))[0];
            //添加控件DOM
            main.appendChild(oItem);

            if (aTop[i].type == 'detail') {
                var oArea = oItem.querySelector('.detail-area');
                //当前明细内控件集合
                var seconds = DATA[aTop[i].id];

                //添加明细内控件
                for (var j = 0; j < seconds.length; j++) {
                    var html = Templates.getWidget(seconds[j]);
                    oArea.innerHTML += html;
                }
            }
        }

        // //审批人
        // main.innerHTML += Templates.getWidget({
        //     type: 'approver'
        // });

        // //提交按钮
        // main.innerHTML += Templates.getWidget({
        //     type: 'submit'
        // });

        //删除script
        if (script && script.parentNode) document.body.removeChild(script);
    }


    exports.loadScript = loadScript;
});
