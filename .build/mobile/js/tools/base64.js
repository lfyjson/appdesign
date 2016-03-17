define("mobile/js/tools/base64", [], function(require, exports, module) {
    /**
     * 获取图片base64位编码
     * @param  {Object}   file     input[type=file]元素.files[0]
     * @param  {Function} callback 回调函数
     * @return {[type]}            [description]
     */
    function handler(file, callback) {
        //创建FileReader对象
        var fd = new FileReader();
        //读取base64
        fd.readAsDataURL(file);
        fd.onload = function() {
            clip(this.result, file.type, callback);
        };
    }
    /**
     * 裁剪图片
     * @param  {String}   result   base64编码
     * @param  {String} type 文件类型
     * @param  {Function} callback 回调函数
     * @return {[type]}            [description]
     */
    function clip(result, type, callback) {
        var canvas = document.createElement("canvas");
        var c = canvas.getContext("2d");
        var oImg = new Image();
        canvas.width = 120;
        canvas.height = 120;
        oImg.onload = function() {
            var w = this.width;
            var h = this.height;
            var naturalSrc = result;
            if (h > w) {
                c.drawImage(this, 0, (h - w) / 2, w, w, 0, 0, 120, 120);
            } else {
                c.drawImage(this, (w - h) / 2, 0, h, h, 0, 0, 120, 120);
            }
            var thumbSrc = canvas.toDataURL(type);
            if (w > 480) naturalSrc = compress(canvas, c, type, oImg);
            //回调函数
            callback(thumbSrc, naturalSrc);
        };
        oImg.src = result;
    }
    /**
     * 压缩图片
     * @param  {Object} canvas canvas元素
     * @param  {Object} c      canvas画布
     * @param  {Object} oImg   图片对象
     * @param {String} type 文件类型
     * @return {String}        缩略图base64编码
     */
    function compress(canvas, c, type, oImg) {
        var scale = oImg.height / oImg.width;
        canvas.width = 480;
        canvas.height = 480 * scale;
        c.drawImage(oImg, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL(type);
    }
    exports.handler = handler;
});