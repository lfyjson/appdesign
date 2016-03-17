define("mobile/js/main", [ "./controller/load", "./view/templates", "./tools/method", "./model/data", "./model/search", "../../config/config", "./controller/watch", "./controller/file-handler", "./view/dialog", "./tools/slide", "./tools/base64", "./controller/detail-handler", "./controller/submit", "./controller/validation", "./model/approver", "./controller/approver-handler", "./tools/escape" ], function(require) {
    /**
     * 加载html
     */
    require("./controller/load").loadScript();
    /**
     * 共用方法
     */
    require("./tools/method");
    /**
     * 监听用户行为
     */
    require("./controller/watch").init();
});