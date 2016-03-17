(function(define, window) {
    define("mobile/js/tools/slide", [], function() {
        "use strict";
        var _document = window.document;
        function extend(obj1, obj2) {
            for (var attr in obj2) {
                obj1[attr] = obj2[attr];
            }
        }
        //绑定自定义事件
        function on(type, fn) {
            this.listeners = this.listeners || {};
            this.listeners[type] = this.listeners[type] || [];
            this.listeners[type].push(fn);
        }
        //触发自定义事件
        function trigger(type, ev) {
            if (this.listeners && this.listeners[type]) {
                for (var i = 0; i < this.listeners[type].length; i++) {
                    this.listeners[type][i].apply(this, ev);
                }
            }
        }
        /**
         * 获取目标元素
         * @param  {object} target ev.target
         * @param  {string} name   目标元素属性名
         * @param  {string} value  目标元素属性值
         * @return {object}        目标元素
         */
        1;
        function getTarget(target, name, value) {
            var oParent = target;
            if (oParent == _document) return oParent;
            while (oParent.dataset[name] != value && oParent.parentNode && oParent.parentNode != _document) {
                oParent = oParent.parentNode;
            }
            return oParent;
        }
        //滑动基础类
        var Slide = function(param) {
            this.setting = {
                //列表项目选择器
                listSelector: "li",
                //自动播放
                autoPlay: false,
                //间隔时间
                time: 5e3
            };
            extend(this.setting, param);
            this.cont = this.setting.cont;
            this.aItem = this.cont.querySelectorAll(this.setting.listSelector);
            this.iNum = 0;
            this.init();
        };
        Slide.prototype = {
            constructor: Slide,
            init: function() {
                for (var i = 0; i < this.aItem.length; i++) {
                    this.aItem[i].style.webkitTransform = "translate(" + i * window.innerWidth + "px, 0)";
                }
                _document.querySelector("html").style.overflowX = "hidden";
                // _document.querySelector('body').style.overflowX = 'hidden';
                //绑定事件
                this.bindEvent();
                //自动播放  
                if (this.setting.autoPlay) {
                    this.autoPlay();
                }
                setTimeout(function(self) {
                    self.cont.classList.add("translate");
                }, 0, this);
            },
            bindEvent: function() {
                this.cont.addEventListener("touchstart", this.touchStartHandler.bind(this), false);
                this.cont.addEventListener("touchmove", this.touchMoveHandler.bind(this), false);
                this.cont.addEventListener("touchend", this.touchEndHandler.bind(this), false);
            },
            touchStartHandler: function(ev) {
                this.disX = ev.touches[0].pageX;
                this.disY = ev.touches[0].pageY;
                this.offsetX = 0;
                this.interval = new Date();
                this.cont.classList.remove("translate");
                //禁止UC滑动切换页面
                var control = navigator.control || {};
                if (control.gesture) control.gesture(false);
                //触发触摸开始事件
                this.trigger("touchstart");
            },
            touchMoveHandler: function(ev) {
                this.offsetX = ev.touches[0].pageX - this.disX;
                this.offsetY = ev.touches[0].pageY - this.disY;
                var direction = Math.abs(this.offsetX) > Math.abs(this.offsetY);
                if (direction) {
                    if (this.iNum === 0 && this.offsetX > 0 || this.iNum === this.aItem.length - 1 && this.offsetX < 0) {
                        this.offsetX *= .2;
                    }
                    this.aItem[this.iNum - 1] && (this.aItem[this.iNum - 1].style.webkitTransform = "translate3d(" + (-window.innerWidth + this.offsetX) + "px, 0, 0)");
                    this.aItem[this.iNum].style.webkitTransform = "translate3d(" + this.offsetX + "px, 0, 0)";
                    this.aItem[this.iNum + 1] && (this.aItem[this.iNum + 1].style.webkitTransform = "translate3d(" + (window.innerWidth + this.offsetX) + "px, 0, 0)");
                    ev.preventDefault();
                    //触发触摸机型中事件
                    this.trigger("touchmove");
                }
            },
            touchEndHandler: function(ev) {
                var boundary = window.innerWidth / 2;
                var boundary2 = window.innerWidth / 10;
                this.cont.classList.add("translate");
                //判断是否快速滑动
                if (new Date() - this.interval > 300) {
                    if (this.offsetX > boundary) {
                        this.touchEndMove(-1);
                    } else if (this.offsetX < -boundary) {
                        this.touchEndMove(1);
                    } else {
                        this.touchEndMove(0);
                    }
                } else {
                    if (this.offsetX > boundary2) {
                        this.touchEndMove(-1);
                    } else if (this.offsetX < -boundary2) {
                        this.touchEndMove(1);
                    } else {
                        this.touchEndMove(0);
                    }
                }
                //触发触摸结束事件
                this.trigger("touchend");
                //UC滑动切换页面
                var control = navigator.control || {};
                if (control.gesture) control.gesture(true);
            },
            //滑动结束后运动归位
            touchEndMove: function(i) {
                this.iNum += i;
                if (this.iNum >= this.aItem.length) {
                    this.iNum = this.aItem.length - 1;
                } else if (this.iNum < 0) {
                    this.iNum = 0;
                }
                this.aItem[this.iNum - 1] && (this.aItem[this.iNum - 1].style.webkitTransform = "translate3d(" + -window.innerWidth + "px, 0, 0)");
                this.aItem[this.iNum].style.webkitTransform = "translate3d(0, 0 ,0)";
                this.aItem[this.iNum + 1] && (this.aItem[this.iNum + 1].style.webkitTransform = "translate3d(" + window.innerWidth + "px, 0, 0)");
                //触发滑动结束事件
                this.trigger("slidend");
            },
            //递归移动每个图片的位置
            recursion: function() {
                recursion.call(this, this.iNum, -1);
                recursion.call(this, this.iNum, 1);
                function recursion(iNum, n) {
                    if (this.aItem[iNum + n]) {
                        this.aItem[iNum + n].style.webkitTransform = "translate3d(" + n * window.innerWidth + "px, 0, 0)";
                        recursion.call(this, iNum + n, n);
                    } else {
                        return;
                    }
                }
            },
            //图片移动到指定位置
            toMoveIndex: function(index) {
                this.iNum = index;
                this.touchEndMove(0);
                this.recursion();
            },
            //自动播放
            autoPlay: function() {
                var self = this;
                this.timer = setInterval(next.bind(this), this.setting.time);
                this.on("touchstart", function() {
                    clearInterval(self.timer);
                });
                this.on("touchend", function() {
                    self.timer = setInterval(next.bind(self), self.setting.time);
                });
                function next() {
                    this.iNum++;
                    if (this.iNum >= this.aItem.length) {
                        this.iNum = 0;
                    }
                    this.touchEndMove(0);
                    //重新切换到第一张时，递归移动每个图片的位置
                    if (this.iNum === 0) {
                        this.recursion();
                    }
                }
            },
            on: on,
            trigger: trigger
        };
        //相册类, 继承自Slide
        var Photo = function(param) {
            //继承Slide类属性
            Slide.call(this, param);
            //图片索引标签
            this.pageTag = this.setting.pageTag;
            this.aImg = this.cont.getElementsByTagName("img");
            this.bindCustomEvent();
        };
        //继承Slide原型方法
        // Photo.prototype = Object.create(Slide.prototype);
        extend(Photo.prototype, Slide.prototype);
        var _Photo = {
            constructor: Photo,
            bindCustomEvent: function() {
                this.on("slidend", this.pageCount);
                this.on("slidend", this.loadImg);
            },
            //图片索引
            pageCount: function() {
                this.iAllPage = this.aItem.length;
                this.pageTag.innerHTML = this.iNum + 1 + "/" + this.iAllPage;
            },
            //加载图片
            loadImg: function() {
                setSrc(this.aImg[this.iNum - 1]);
                setSrc(this.aImg[this.iNum]);
                setSrc(this.aImg[this.iNum + 1]);
                function setSrc(obj) {
                    if (obj && !obj.src) {
                        obj.onload = function() {
                            obj.classList.add("show");
                            //加载完毕隐藏loading
                            obj.parentNode.classList.add("loaded");
                        };
                        obj.src = obj.dataset.src;
                        obj.dataset.src = "";
                    }
                }
            }
        };
        extend(Photo.prototype, _Photo);
        //相册UI
        var PhotoHanlder = {
            iNum: 0,
            init: function() {
                var self = this;
                //监听事件
                _document.addEventListener("click", function(ev) {
                    var target = getTarget(ev.target, "role", "photo");
                    if (target.dataset.role == "photo") {
                        self.parent = target;
                        //启动相册
                        self.openPhoto(ev);
                    }
                }, false);
            },
            //启动相册
            openPhoto: function(ev) {
                var target = ev.target;
                this.aImg = this.parent.querySelectorAll("img[data-src]");
                for (var i = 0; i < this.aImg.length; i++) {
                    this.aImg[i].index = i;
                }
                if (target.nodeName.toLowerCase() == "img" && target.dataset.src !== "") {
                    this.iNum = ev.target.index;
                    this.createDOM();
                    this.initPhoto();
                    this.closePhoto();
                }
            },
            //创建相册类
            initPhoto: function() {
                var oSlide = new Photo({
                    cont: this.oWrapper,
                    listSelector: "div.item",
                    pageTag: this.pageCount
                });
                //切换到指定索引图片
                oSlide.toMoveIndex(this.iNum);
                this.scrollTop = _document.body.scrollTop;
                _document.body.style.height = 0;
            },
            //关闭相册事件
            closePhoto: function() {
                var self = this;
                this.oWrapper.addEventListener("click", function() {
                    _document.body.removeChild(this);
                    _document.body.style.height = "auto";
                    _document.body.scrollTop = self.scrollTop;
                }, false);
            },
            //创建相册DOM
            createDOM: function() {
                this.oWrapper = _document.createElement("div");
                this.oWrapper.classList.add("dialog-photo");
                this.oWrapper.classList.add("show");
                for (var i = 0; i < this.aImg.length; i++) {
                    this.oWrapper.innerHTML += '<div class="item"><img data-src="' + this.aImg[i].dataset.src + '"></div>';
                }
                this.pageCount = _document.createElement("span");
                this.pageCount.classList.add("photo-page");
                this.oWrapper.appendChild(this.pageCount);
                _document.body.appendChild(this.oWrapper);
            }
        };
        PhotoHanlder.init();
        //轮播图UI
        var FocusHanlder = {
            init: function() {
                this.aFcous = document.querySelectorAll("[data-role=focus]");
                for (var i = 0; i < this.aFcous.length; i++) {
                    this.factory(this.aFcous[i]);
                }
            },
            factory: function(oFcous) {
                var dataset = oFcous.dataset, oSlide = new Slide({
                    cont: oFcous,
                    listSelector: "[role=item]",
                    autoPlay: dataset.autoPlay === "false" ? false : true,
                    time: typeof dataset.time === "undefined" ? 5e3 : dataset.time
                }), //添加圆点
                aDot = this.appendDot(oFcous, oSlide);
                oFcous.style.height = dataset.height;
                //滑动结束时切换圆点
                oSlide.on("slidend", function() {
                    for (var i = 0; i < aDot.length; i++) {
                        aDot[i].classList.remove("active");
                    }
                    aDot[oSlide.iNum].classList.add("active");
                });
            },
            appendDot: function(oFcous, oSlide) {
                var oDot = oFcous.querySelector("[role=dot]"), iLength = oSlide.aItem.length, aDot;
                for (var i = 0; i < iLength; i++) {
                    oDot.innerHTML += "<span></span>";
                }
                aDot = oDot.getElementsByTagName("span");
                aDot[0].classList.add("active");
                return aDot;
            }
        };
        FocusHanlder.init();
        var Slider = {
            Slide: Slide,
            Photo: Photo
        };
        if (!(define.amd || define.cmd)) {
            window.Slider = Slider;
        }
        return Slider;
    });
})(typeof define === "function" && (define.amd || define.cmd) ? define : function(name, deps, factory) {
    if (typeof name === "function") {
        factory = name;
    }
    if (typeof deps === "function") {
        factory = deps;
    }
    if (factory) {
        factory();
    }
}, window);