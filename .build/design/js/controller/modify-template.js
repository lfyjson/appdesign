define("design/js/controller/modify-template", [ "../tools/method", "../tools/observer" ], function(require, exports, module) {
    var m = require("../tools/method");
    var Observer = require("../tools/observer");
    function init() {
        new Drag({
            wrap: document.querySelector(".main"),
            phoneInner: document.getElementById("phone-inner")
        });
    }
    function Drag(param) {
        this.wrap = param.wrap;
        this.phoneInner = param.phoneInner;
        this.init();
    }
    Drag.prototype = {
        constructor: Drag,
        init: function() {
            var _this = this;
            this.inOutPhoneHandler();
            //进入离开phone处理
            this.wrap.onmousedown = function(ev) {
                _this.obj = ev.target;
                if (_this.obj.dataset.name === "tpl") {
                    var isInit = false, isInner = false, iCount = 0;
                    document.onmousemove = function(ev) {
                        if (iCount < 5) {
                            iCount++;
                            return;
                        }
                        if (!isInit) {
                            _this.mouseDownInit();
                            isInit = true;
                        }
                        var translate3d = "translate3d(" + ev.clientX + "px" + ", " + ev.clientY + "px, 0)";
                        _this.shadow.style.webkitTransform = translate3d;
                        _this.shadow.style.mozTransform = translate3d;
                        _this.shadow.style.msTransform = translate3d;
                        _this.shadow.style.transform = translate3d;
                        if (_this.isInPhoneInner(ev, _this.phoneInnerLeft, _this.phoneInnerTop, _this.phoneInner)) {
                            if (!isInner) {
                                _this.pub("inPhone");
                            }
                            isInner = true;
                        } else {
                            if (isInner) {
                                _this.pub("outPhone");
                            }
                            isInner = false;
                        }
                    };
                    document.onmouseup = function() {
                        document.onmousemove = null;
                        document.onmouseup = null;
                        if (_this.shadow) {
                            document.body.removeChild(_this.shadow);
                            _this.shadow = null;
                        }
                        if (isInner) {
                            window.location.hash = _this.getHash();
                            _this.pub("changeSuccess");
                        }
                        document.body.classList.remove("drag-move");
                    };
                    return false;
                }
            };
        },
        getHash: function() {
            return this.obj.href.substring(this.obj.href.indexOf("#"));
        },
        inOutPhoneHandler: function() {
            this.tplPrompt = document.querySelector(".phone-tpl-prompt");
            this.tplPromptSpan = this.tplPrompt.querySelector("span");
            this.phoneBody = document.getElementById("phone-body");
            this.sub("inPhone", this.inPhone);
            this.sub("outPhone", this.outPhone);
            this.sub("changeSuccess", this.outPhone);
        },
        inPhone: function() {
            this.phoneBody.style.display = "none";
            this.tplPrompt.style.display = "block";
            this.tplPromptSpan.innerHTML = "释放鼠标切换到<em>" + this.obj.innerHTML + "</em>模板";
        },
        outPhone: function() {
            this.phoneBody.style.display = "block";
            this.tplPrompt.style.display = "none";
            this.tplPromptSpan.innerHTML = "";
        },
        mouseDownInit: function() {
            //初始化各项参数
            this.createShadow();
            this.interval = true;
            //间隔时间
            //phoneInner 头部纵坐标 底部纵坐标
            this.innerTop = m.getTop(this.phoneInner);
            this.innerBottom = this.innerTop + this.phoneInner.offsetHeight;
            // 获取phoneInner相对于窗口的位置
            this.phoneInnerLeft = m.getLeft(this.phoneInner);
            this.phoneInnerTop = m.getTop(this.phoneInner);
            document.body.appendChild(this.shadow);
            document.body.classList.add("drag-move");
        },
        createShadow: function() {
            this.shadow = this.obj.cloneNode(true);
            with (this.shadow.style) {
                backgroundColor = "rgba(0, 0, 0, .5)";
                position = "absolute";
                left = 0;
                top = 0;
                transition = "none";
                zIndex = 9;
            }
        },
        isInPhoneInner: function(mouse, left, top, phone) {
            var right = left + phone.offsetWidth;
            var bottom = top + phone.offsetHeight;
            if (mouse.clientX < left || mouse.clientX > right || mouse.clientY < phone.offsetTop || mouse.clientY > bottom) {
                return false;
            } else {
                return true;
            }
        }
    };
    m.extend(Drag.prototype, new Observer());
    module.exports = {
        init: init
    };
});