define("design/js/main", [ "./controller/drag", "./view/phone", "./tools/method", "./model/data", "./model/search", "./controller/setting", "./view/setting", "./model/insert", "./controller/databind", "./tools/escape", "./controller/validation", "./controller/handlers", "./controller/prompt", "./view/dialog", "./model/delete", "./view/load-body", "./controller/load-template", "../../config/config", "./model/format", "./controller/preview", "./tools/qrcode", "./controller/save", "./controller/modify-template", "./tools/observer" ], function(require, exports, module) {
    /**
     * 载入
     */
    load(init);
    /**
     * 初始化
     */
    function init() {
        /**
         * 拖拽
         */
        require("./controller/drag").init();
        /**
         * 加载控件模板
         */
        require("./controller/load-template").loadScript();
        /**
         * 双向数据绑定
         */
        require("./controller/databind");
        /**
         * 无控件限制功能
         */
        require("./controller/prompt").detection();
        /**
         * 预览
         */
        require("./controller/preview").init();
        /**
         * 保存
         */
        require("./controller/save");
        /**
         * 拖拽模板
         */
        require("./controller/modify-template").init();
    }
    /**
     * 载入DOM
     * @param  {function} fn 初始化方法
     * @return {[type]}      [description]
     */
    function load(fn) {
        // try {
        document.body.dataset.id;
        require("./view/load-body");
        fn();
    }
});