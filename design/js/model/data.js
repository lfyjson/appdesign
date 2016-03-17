define(function(require, exports, module) {
    var Search = require('./search');
    var m = require('../tools/method');

    //模板缓存
    var CACHE = {};
    //id计数器
    var idCounter = 0;
    //控件数据
    var DATA = [];

    window.temp = DATA;
    window.temp2 = idCounter;
    window.cache = CACHE;

    function getNewId(param) {
        return idCounter;
    }

    function addNewData(param) {
        var json = param; //获取json数据
        json.id = idCounter++; //控件id

        DATA.push(json);

        return json;
    }

    /**
     * 修改or新增 控件数据
     * @param  {mix}    id    被修改控件id or 控件json
     * @param  {string} attr  修改的属性
     * @param  {mix}    value 新值
     * @param  {string} json  二级json
     * @return {object}       控件json数据
     */
    function updateData(id, attr, value, json) {
        var curData;
        //获取修改id的model
        if (typeof id === 'object') {
            curData = id;
        } else {
            curData = getData(id);
        }

        //修改对应值
        if (json) {
            curData[json][attr] = value;
        } else {
            curData[attr] = value;
        }

        // curData['requireText'] = curData['require'] ? '（必填）' : ''; //更改验证文字

        return curData;
    }

    //选项组数据修改
    function updateOptions(id, index, action, value) {
        var curData = getData(id);
        if (action == 'add') {
            curData['options'].splice(parseInt(index) + 1, 0, '选项' + curData['optionsIndex']);
        } else if (action == 'delete') {
            curData['options'].splice(index, 1);
        } else if (action == 'update') {
            curData['options'][index] = value;
        }
    }

    function getData(id) {
        for (var i = 0; i < DATA.length; i++) {
            if (DATA[i].id == id) {
                return DATA[i];
            }
        }
    }

    //删除数据
    function deleteData(id) {
        for (var i = 0; i < DATA.length; i++) {
            if (DATA[i].id == id) {
                DATA.splice(i, 1);
                break;
            }
        }
    }

    //得到格式化后的数据
    function getFormatData() {
        var data = [];
        for (var i = 0; i < DATA.length; i++) {
            data.push(JSON.stringify(DATA[i]));
        }
        return data;
    }

    /**
     * 覆盖控件数据
     * @param  {Array} arr  新控件数据
     * @return {[type]}     [description]
     */
    function coverDATA(arr) {
        //获取当前模板路径
        var tpl = Search.getTplPath();

        //缓存页面设置信息
        var pageData = DATA[0];

        if (m.getJsonLen(CACHE) < 1) {
            //设置最近保存的模板
            CACHE['default'] = m.deepCopy(arr);
        } else {
            CACHE[tpl] = m.deepCopy(arr);
        }


        // 清空DATA
        // var len = DATA.length;
        // while(len--) {
        // 	DATA.pop();
        // }

        //深层拷贝新模板数据
        DATA = m.deepCopy(arr);

        //将缓存的页面设置信息覆盖到当前数据信息
        // DATA[0] = pageData;

        //重新改变输出DATA的指向
        module.exports.DATA = DATA;
        window.temp = DATA;

        // for(var prop in DATA) {
        // 	//数据绑定
        // 	db.DBModel(DATA[prop].id, function (scope) {
        // 	}, DATA[prop]);
        // }


        //重置计数器
        resetIdCount();
    }

    //重置计数器
    function resetIdCount() {
        var i = 0;
        DATA.forEach(function(obj) {
            i = obj.id > i ? obj.id : i;
        });
        idCounter = ++i;
    }

    module.exports = {
        CACHE: CACHE,
        DATA: DATA,
        addNewData: addNewData,
        updateData: updateData,
        updateOptions: updateOptions,
        getNewId: getNewId,
        getData: getData,
        deleteData: deleteData,
        getFormatData: getFormatData,
        coverDATA: coverDATA
    };
});
