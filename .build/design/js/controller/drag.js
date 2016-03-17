define("design/js/controller/drag", [ "../view/phone", "../tools/method", "../model/data", "../model/search", "./setting", "../view/setting", "../model/insert", "./databind", "../tools/escape", "./validation", "./handlers", "./prompt", "../view/dialog", "../model/delete", "../view/load-body" ], function(require, exports, module) {
    var Phone = require("../view/phone");
    /*phone模板*/
    var Model = require("../model/data");
    /*model*/
    var Setting = require("./setting").setting;
    //控件设置模板
    var InsertData = require("../model/insert");
    //写入数据方法
    var Prompt = require("./prompt");
    var m = require("../tools/method");
    var Drag = function(param) {
        this.parent = param.parent;
        this.objName = param.objName;
        this.phoneInner = document.getElementById("phone-inner");
        this.phoneBody = document.getElementById("phone-body");
        this.aControl = document.querySelectorAll("#controls .control-item");
        this.init();
    };
    Drag.prototype = {
        constructor: Drag,
        createShadow: function() {
            for (var i = 0; i < this.aControl.length; i++) {
                if (this.aControl[i].dataset.type == this.type) {
                    this.shadow = this.aControl[i].cloneNode(true);
                }
            }
            // this.shadow.classList.add('control-item-shadow');
            with (this.shadow.style) {
                backgroundColor = "rgba(0, 0, 0, .5)";
                position = "absolute";
                left = 0;
                top = 0;
                transition = "none";
                zIndex = 9;
            }
        },
        createPlaceholder: function() {
            this.placeholder = document.createElement("div");
            this.placeholder.className = "placeholder";
        },
        init: function() {
            var _this = this;
            this.parent.onmousedown = function(ev) {
                _this.obj = m.getTarget(ev.target, "name", _this.objName, this);
                if (_this.obj.getAttribute("name") != _this.objName) return;
                var iCount = 0;
                var isInit = false;
                document.onmousemove = function(ev) {
                    if (iCount < 10) {
                        iCount++;
                        return;
                    }
                    if (!isInit) {
                        isInit = true;
                        _this.mouseDownInit();
                    }
                    //自动滚动scrollTop
                    if (ev.clientY + 50 > _this.innerBottom) {
                        _this.phoneInner.scrollTop += 15;
                    } else if (_this.innerTop + 50 > ev.clientY) {
                        _this.phoneInner.scrollTop -= 15;
                    }
                    var translate3d = "translate3d(" + ev.clientX + "px" + ", " + ev.clientY + "px, 0)";
                    _this.shadow.style.webkitTransform = translate3d;
                    _this.shadow.style.mozTransform = translate3d;
                    _this.shadow.style.msTransform = translate3d;
                    _this.shadow.style.transform = translate3d;
                    if (_this.isInPhoneInner(ev, _this.phoneInnerLeft, _this.phoneInnerTop, _this.phoneInner)) {
                        /*判断光标是否进入phoneInner*/
                        if (_this.interval) {
                            _this.interval = false;
                            var oNear = _this.findNearest(_this.shadow, _this.phoneItems, ev);
                            //明细嵌套明细判断
                            if (!(_this.type == "detail") || !oNear.parentNode.classList.contains("phone-area")) {
                                oNear.parentNode.insertBefore(_this.placeholder, oNear);
                            }
                            /*寻找元素间隔时间*/
                            setTimeout(function() {
                                _this.interval = true;
                            }, 100);
                        }
                    } else {
                        _this.placeholder.parentNode && _this.placeholder.parentNode.removeChild(_this.placeholder);
                    }
                };
                document.onmouseup = function() {
                    document.onmousemove = null;
                    document.onmouseup = null;
                    iCount = 0;
                    if (!isInit) return;
                    //未初始化时跳出
                    document.body.classList.remove("drag-move");
                    document.body.removeChild(_this.shadow);
                    //被拖拽控件去除滤镜效果
                    _this.obj.classList.remove("filter");
                    if (_this.objName == "control") {
                        if (_this.placeholder.parentNode) {
                            //在占位符在phoneBody时插入新数据
                            _this.insertNewItem();
                        }
                    } else {
                        _this.setItem(_this.placeholder.parentNode, _this.obj);
                    }
                    Prompt.detection();
                    //无控件提示
                    _this.itemOrder();
                };
                return false;
            };
        },
        itemOrder: function() {
            //控件排序
            var aItem = this.phoneInner.querySelectorAll(".phone-body > .phone-item");
            //顶级控件
            var aArea = this.phoneBody.querySelectorAll(".phone-area");
            //明细
            for (var i = 0; i < aItem.length; i++) {
                Model.updateData(aItem[i].dataset.id, "order", i + 1);
                //位置索引
                Model.updateData(aItem[i].dataset.id, "parentId", 0);
            }
            for (var i = 0; i < aArea.length; i++) {
                var aItem = aArea[i].querySelectorAll(".phone-item");
                for (var j = 0; j < aItem.length; j++) {
                    Model.updateData(aItem[j].dataset.id, "order", j + 1);
                    Model.updateData(aItem[j].dataset.id, "parentId", parseInt(aArea[i].parentNode.parentNode.dataset.id));
                }
            }
        },
        mouseDownInit: function() {
            //初始化各项参数
            this.type = this.obj.dataset.type;
            this.createShadow();
            this.createPlaceholder();
            this.interval = true;
            //间隔时间
            //phoneInner 头部纵坐标 底部纵坐标
            this.innerTop = m.getTop(this.phoneInner);
            this.innerBottom = this.innerTop + this.phoneInner.offsetHeight;
            // 获取phoneInner相对于窗口的位置
            this.phoneInnerLeft = m.getLeft(this.phoneInner);
            this.phoneInnerTop = m.getTop(this.phoneInner);
            this.getPhoneItems();
            /*获取phone项目数组*/
            document.body.appendChild(this.shadow);
            document.body.classList.add("drag-move");
            //被拖拽控件滤镜效果
            this.obj.classList.add("filter");
        },
        insertNewItem: function() {
            //写入新控件数据到model 返回该条数据id
            var id = InsertData.insertNewItem(this.obj);
            //获取新控件model
            var data = Model.getData(id);
            //获取新控件模板
            var newWidget = Phone.createWidget(data);
            //写入DOM对象到控件model
            Model.updateData(data.id, "obj", newWidget);
            /*插入新控件模板*/
            this.setItem(this.placeholder.parentNode, newWidget);
        },
        setItem: function(oParent, item) {
            oParent && oParent.insertBefore(item, this.placeholder);
            oParent && oParent.removeChild(this.placeholder);
            Setting.toActive(item);
        },
        getPhoneItems: function() {
            /*获取phone项目数组*/
            this.phoneItems = this.phoneBody.querySelectorAll('div[name="phone-item"]');
        },
        findNearest: function(obj, arr, moveEvent) {
            /*寻找最近的元素*/
            var _this = this;
            var iMin = 1e10;
            var iMinIndex = -1;
            for (var i = 0; i < arr.length; i++) {
                if (obj == arr[i]) continue;
                var dis = this.getDis(obj, arr[i], moveEvent);
                if (dis < iMin) {
                    iMin = dis;
                    iMinIndex = i;
                }
            }
            if (iMinIndex == -1) {
                return null;
            } else {
                return arr[iMinIndex];
            }
        },
        getDis: function(obj1, obj2, moveEvent) {
            /*计算直线距离*/
            var a = moveEvent.clientX - m.getLeft(obj2);
            var b = moveEvent.clientY - m.getTop(obj2) + this.phoneInner.scrollTop;
            return Math.sqrt(a * a + b * b);
        },
        isInPhoneInner: function(mouse, left, top, phone) {
            /*检测光标是否在phoneInner内*/
            var right = left + phone.offsetWidth;
            var bottom = top + phone.offsetHeight;
            if (mouse.clientX < left || mouse.clientX > right || mouse.clientY < phone.offsetTop || mouse.clientY > bottom) {
                return false;
            } else {
                return true;
            }
        }
    };
    function init() {
        var oControl = document.getElementById("controls"), oPhoneBody = document.getElementById("phone-body");
        new Drag({
            parent: oControl,
            objName: "control"
        });
        new Drag({
            parent: oPhoneBody,
            objName: "phone-item"
        });
    }
    exports.init = init;
    exports.Drag = Drag;
});