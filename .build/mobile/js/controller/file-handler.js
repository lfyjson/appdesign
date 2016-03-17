define("mobile/js/controller/file-handler", [ "../view/dialog", "../../../config/config", "../model/search", "../tools/method", "../tools/slide", "../tools/base64" ], function(require, exports, module) {
    var Dialog = require("../view/dialog");
    var Path = require("../../../config/config").Path;
    var Search = require("../model/search");
    var m = require("../tools/method");
    require("../tools/slide");
    /**
     * 图片上传处理
     */
    var upload = {
        hanlder: function(input) {
            var self = this;
            var file = input.files[0];
            //初始化标签
            this.initLabel(input);
            //上传文件类型判断
            var reg = /^image/gi;
            if (!file || !reg.test(file.type)) {
                Dialog.tips({
                    content: "请上传图片类型文件"
                });
                self.oList.removeChild(self.span);
                return;
            }
            //获取图片base64编码
            require("../tools/base64").handler(file, function(thumb, natural) {
                var imgid = parseInt(Math.random() * 1e10).toString(16);
                self.i = m.create("i");
                self.i.dataset.action = "delete-image";
                self.i.dataset.imgid = imgid;
                self.img = new Image();
                self.img.src = thumb;
                self.img.dataset.src = natural;
                self.img.dataset.imgid = imgid;
                //上传
                self.transfer(thumb, natural, self.i.dataset.imgid, self.getSuffix(file.type));
            });
        },
        //获取后缀
        getSuffix: function(type) {
            var index = type.indexOf("/") + 1;
            return type.substr(index);
        },
        initLabel: function(input) {
            this.oList = input.parentNode.nextElementSibling;
            this.span = m.create("span");
            this.em = m.create("em");
            //显示loading
            this.span.appendChild(this.em);
            this.oList.appendChild(this.span);
            this.span.style.height = this.span.offsetWidth + "px";
        },
        //图片无刷新上传
        transfer: function(thumb, natural, id, type) {
            var self = this;
            var param = "action=upload&thumbbase64=" + encodeURIComponent(thumb) + "&naturalbase64=" + encodeURIComponent(natural);
            param += "&picId=" + id + "&" + Search.sSearch;
            param += "&thumbsuffix=" + type + "&naturalsuffix=" + type;
            param += "&username=1&personid=2";
            m.ajax({
                type: "post",
                url: Path.file,
                data: param,
                success: function(data) {
                    data = JSON.parse(data);
                    console.log(data);
                    if (data.status == 200) {
                        self.success(data);
                    } else {
                        self.error();
                    }
                },
                error: self.error.bind(self)
            });
        },
        success: function(data) {
            data.thumbURL && (this.img.src = data.thumbURL);
            data.naturalURL && (this.img.dataset.src = data.naturalURL);
            //插入缩略图
            this.span.removeChild(this.em);
            this.span.appendChild(this.img);
            this.span.appendChild(this.i);
        },
        error: function() {
            Dialog.tips({
                content: "图片上传失败"
            });
            this.oList.removeChild(this.span);
        }
    };
    /**
     * 图片删除处理
     */
    var del = {
        hanlder: function(target) {
            var self = this;
            var img = target.previousElementSibling;
            self.target = target;
            var param = "action=delete&id=" + target.dataset.imgid + "&" + Search.sSearch;
            param += "&thumbURL=" + img.src + "&naturalURL=" + img.dataset.src;
            console.log(param);
            m.ajax({
                type: "post",
                url: Path.file,
                data: param,
                success: function(data) {
                    data = JSON.parse(data);
                    self.success();
                },
                error: self.error
            });
        },
        success: function() {
            this.span = this.target.parentNode;
            this.oList = this.span.parentNode;
            this.oList.removeChild(this.span);
        },
        error: function() {
            Dialog.tips({
                content: "图片删除失败"
            });
        }
    };
    exports.upload = upload;
    exports.del = del;
});