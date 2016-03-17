define("mobile/js/model/data", [], function(require, exports, module) {
    var DATA = {};
    window.temp = DATA;
    /**
     * 格式化数据
     * @param  {String} data 数据
     */
    function format(data) {
        var arr = parseData(data);
        DATA["-1"] = arr.splice(0, 1);
        //顶级控件数组集合
        var aTop = siblingsArr(arr, 0);
        //将数组按order值进行升序排序
        aTop = quickSort(aTop);
        DATA["0"] = aTop;
        for (var i = 0; i < aTop.length; i++) {
            var data = aTop[i];
            if (data.type == "detail") {
                //明细内控件集合
                var seconds = siblingsArr(arr, data.id);
                //按order进行升序排序
                seconds = quickSort(seconds);
                DATA[data.id] = seconds;
            }
        }
    }
    function parseData(str) {
        var arr = [];
        var reg = /},{/g;
        var data = str.replace(reg, "},?&${");
        data = data.split(",?&$");
        for (var i = 0; i < data.length; i++) {
            arr.push(JSON.parse(data[i]));
        }
        return arr;
    }
    /**
     * 同级别控件集合
     * @param  {Array} arr      未处理控件集合
     * @param  {Number} parentId 父级id
     * @return {Array}          同级别控件集合
     */
    function siblingsArr(arr, parentId) {
        var siblings = [];
        for (var i = 0; i < arr.length; i++) {
            if (arr[i].parentId == parentId) {
                siblings = siblings.concat(arr.splice(i--, 1));
            }
        }
        return siblings;
    }
    /**
     * 快速排序
     * @param  {Array} arr 数组
     * @return {Array}     升序数组
     */
    function quickSort(arr) {
        if (arr.length <= 1) {
            return arr;
        }
        var num = Math.floor(arr.length / 2);
        var curArr = arr.splice(num, 1);
        var numValue = curArr[0].order;
        var left = [];
        var right = [];
        for (var i = 0; i < arr.length; i++) {
            if (arr[i].order < numValue) {
                left.push(arr[i]);
            } else {
                right.push(arr[i]);
            }
        }
        return quickSort(left).concat(curArr, quickSort(right));
    }
    function getData(id) {
        for (key in DATA) {
            var arr = DATA[key];
            for (var i = 0; i < arr.length; i++) {
                if (arr[i].id == id) {
                    return arr[i];
                }
            }
        }
        return null;
    }
    module.exports = {
        DATA: DATA,
        format: format,
        getData: getData
    };
});