define("mobile/js/model/search", [ "../tools/method", "../../../config/config" ], function(require, exports) {
    var m = require("../tools/method");
    //location.search
    var sSearch = getSearch(), oSearch, aApproverList;
    //search json键值对
    if (sSearch !== null) {
        oSearch = parseSearch(sSearch);
    }
    //审批人列表
    if (oSearch && oSearch.torealname) {
        aApproverList = oSearch.torealname.split(",");
    }
    //得到location.search值
    function getSearch() {
        var search = decodeURI(window.location.search);
        if (search.indexOf("?") != -1) {
            var str = search.substr(1);
            return str;
        } else {
            return null;
        }
    }
    /**
     * location.search转json
     * @param  {String} str search值
     * @return {Object}     json
     */
    function parseSearch(str) {
        var json = {};
        var arr = str.split("&");
        for (var i = 0; i < arr.length; i++) {
            var data = arr[i].split("=");
            json[data[0]] = data[1];
        }
        return json;
    }
    /**
     * 获取url前缀
     * @return {String}     url前缀
     */
    function getUrlPrefix() {
        var pathName = window.location.origin + window.location.pathname;
        return pathName.substring(0, pathName.lastIndexOf("/") + 1);
    }
    // getApproverList();
    function getApproverList() {
        if (oSearch && oSearch.tplid) {
            //获取审批人信息
            m.ajax({
                type: "post",
                url: require("../../../config/config").Path.getApprover,
                data: sSearch,
                success: function(data) {
                    data = JSON.parse(data);
                    if (data.status === 200) {
                        console.log(data);
                        aApproverList = data.result;
                        exports.aApproverList = aApproverList;
                    }
                },
                error: function() {
                    console.log("无");
                }
            });
        }
    }
    exports.sSearch = sSearch;
    exports.oSearch = oSearch;
    exports.getUrlPrefix = getUrlPrefix;
    exports.aApproverList = aApproverList;
});