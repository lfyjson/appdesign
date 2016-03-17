define("design/js/model/search", [ "../tools/method" ], function(require, exports) {
    //location.search
    var sSearch = getSearch("search"), oSearch;
    var m = require("../tools/method");
    //search json键值对
    if (sSearch !== null) {
        oSearch = parseSearch(sSearch);
    }
    //得到hash
    // function getHash() {
    // 	//type [string] hash
    // 	var sHash = getSearch('hash'), oHash;
    // 	//type [Object] hash 
    // 	if(sHash !== null) {
    // 		oHash = parseSearch(sHash);
    // 	}
    // 	return {
    // 		sHash: sHash,
    // 		oHash: oHash
    // 	}
    // }
    //得到location.search值
    function getSearch(type) {
        var search = window.location[type];
        if (search.indexOf("?") != -1) {
            var str = search.m.substr(1);
            //过滤tplid
            var reg = /&{0,1}tplid=[\w | . | \/]*/;
            var reg2 = /&&/;
            var reg3 = /^&/;
            str = str.replace(reg, "");
            str = str.replace(reg2, "&");
            str = str.replace(reg3, "");
            return str;
        } else if (search.indexOf("#") != -1) {
            var str = search.m.substr(1);
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
    function getTplPath() {
        return window.location.hash.substring(1);
    }
    /**
     * 获取url前缀
     * @return {String}     url前缀
     */
    function getUrlPrefix() {
        var pathName = window.location.origin + window.location.pathname;
        return pathName.substring(0, pathName.lastIndexOf("/") + 1);
    }
    /**
     * 获取orgid
     */
    function getOrgid() {
        var orgid = ".vs";
        if (oSearch && oSearch.orgid) {
            orgid = oSearch.orgid;
        }
        return orgid;
    }
    //获取图片URL
    function getIconURL(index) {
        return getUrlPrefix() + "design/images/app/" + index + ".png";
    }
    exports.sSearch = sSearch;
    exports.oSearch = oSearch;
    exports.getTplPath = getTplPath;
    exports.getUrlPrefix = getUrlPrefix;
    exports.getOrgid = getOrgid;
    exports.getIconURL = getIconURL;
});