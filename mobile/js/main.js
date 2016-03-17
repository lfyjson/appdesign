define(function(require) {
    /**
     * 加载html
     */
    require('./controller/load').loadScript();

    /**
     * 共用方法
     */
    require('./tools/method');

    /**
     * 监听用户行为
     */
    require('./controller/watch').init();


});
